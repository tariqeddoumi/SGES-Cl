import { z } from "zod";
import { derogationPossible } from "@/lib/domaine/exclusion";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, notifierRSE } from "@/lib/serveur/dossiers";
import { droitsDossier } from "@/lib/serveur/etat-dossier";
import { journaliserCritique } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ critereId: z.string(), justification: z.string().max(8000).nullable() });

/**
 * Dérogation motivée à un critère d'exclusion bloquant (gouvernance F13) : réservée à la permission
 * exclusion:deroger (Responsable RSE), interdite pour une interdiction légale ou un critère non dérogeable.
 * Accordée ou retirée dans une transaction avec son entrée de journal d'audit.
 */
export const PUT = route(
  async (req, ctx, { id }) => {
    // Fonction de contrôle (Responsable RSE, groupe) : la consultation du dossier suffit, la permission fait foi.
    const d = await dossierAutorise(ctx, id);
    if (!droitsDossier(ctx, d).deroger) throw new ErreurMetier("Dérogation réservée au Responsable Social et Environnemental, en cours d'évaluation.", 403, "interdit");
    const { critereId, justification } = Schema.parse(await corps(req));
    const r = await prisma.reponseExclusion.findUnique({ where: { dossierId_critereId: { dossierId: id, critereId } }, include: { critere: true } });
    if (!r) throw introuvable("Réponse introuvable.");
    if (!r.reponse) throw new ErreurMetier("Aucune dérogation n'est nécessaire : le critère n'est pas coché.", 400, "validation");
    if (!derogationPossible(r.critere)) throw new ErreurMetier("Ce critère n'admet pas de dérogation (interdiction légale ou critère non dérogeable).", 409, "verrouille");
    const texte = justification?.trim() || null;
    if (justification !== null && !texte) throw new ErreurMetier("La justification de la dérogation est obligatoire.", 400, "validation", [{ champ: "justification" }]);
    await prisma.$transaction(async (tx) => {
      await tx.reponseExclusion.update({
        where: { id: r.id },
        data: texte
          ? { derogation: texte, derogationParId: ctx.utilisateur.id, derogationParNom: `${ctx.utilisateur.prenom} ${ctx.utilisateur.nom}`, derogationLe: new Date() }
          : { derogation: null, derogationParId: null, derogationParNom: null, derogationLe: null },
      });
      await journaliserCritique(tx, ctx, texte ? "derogation_exclusion" : "retrait_derogation_exclusion", "dossier", id, {
        reference: d.reference,
        critere: r.critere.code,
        nature: r.critere.nature,
        avant: r.derogation,
        apres: texte,
      });
      await historiser(id, ctx, "exclusion", { commentaire: `${texte ? "Dérogation" : "Retrait de dérogation"} — ${r.critere.code}${texte ? ` : ${texte}` : ""}` }, tx);
    });
    if (texte) await notifierRSE(id, "exclusion", `${d.reference} — dérogation ${r.critere.code}`, texte);
    return { ok: true };
  },
  { permission: "exclusion:deroger" }
);
