import { z } from "zod";
import { TRANSITIONS, statutApres, transitionsPossibles, type Transition } from "@/lib/domaine/workflow";
import { booleen } from "@/lib/parametres";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit } from "@/lib/serveur/contexte";
import { controleSoumission, dossierAutorise, historiser, notifierPermission, notifierUtilisateur } from "@/lib/serveur/dossiers";
import { journaliserCritique } from "@/lib/serveur/journal";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";
import { figerSnapshot, type TypeSnapshot } from "@/lib/serveur/snapshot";

const Schema = z.object({
  transition: z.enum(Object.keys(TRANSITIONS) as [Transition, ...Transition[]]),
  commentaire: z.string().max(4000).nullable().optional(),
});

export const POST = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    const { transition, commentaire } = Schema.parse(await corps(req));
    if (transition === "decider") throw new ErreurMetier("La décision se saisit avec son formulaire.", 400, "validation");
    if (!transitionsPossibles(d.statut, ctx.permissions).includes(transition)) {
      throw new ErreurMetier("Opération impossible au statut actuel ou avec vos droits.", 409, "verrouille");
    }
    const def = TRANSITIONS[transition];
    if (def.commentaireObligatoire && !commentaire?.trim()) throw new ErreurMetier("Commentaire obligatoire.", 400, "validation", [{ champ: "commentaire" }]);
    const p = await chargerParametres();
    const vers = statutApres(transition, d.decision);
    const data: Record<string, unknown> = { statut: vers };

    switch (transition) {
      case "soumettre": {
        const { motifs } = await controleSoumission(id);
        if (motifs.length) throw new ErreurMetier("Le dossier n'est pas complet.", 409, "incomplet", motifs);
        Object.assign(data, { soumisLe: new Date(), etape: Math.max(d.etape, 7) });
        break;
      }
      case "valider":
        if (booleen(p, "SEPARATION_FONCTIONS") && (d.chargeId === ctx.utilisateur.id || d.creeParId === ctx.utilisateur.id)) {
          throw interdit("Séparation des fonctions : le chargé du dossier ne peut pas le valider.");
        }
        Object.assign(data, { verrouille: true, valideurId: ctx.utilisateur.id, valideLe: new Date(), commentaireValidation: commentaire ?? null, etape: Math.max(d.etape, 8) });
        break;
      case "retourner":
        Object.assign(data, { verrouille: false, valideurId: null, valideLe: null });
        break;
      case "demarrer_suivi":
        if (d.decision !== "accorde") throw new ErreurMetier("Le suivi ne concerne que les crédits accordés.", 409, "verrouille");
        Object.assign(data, { etape: 9 });
        break;
      case "cloturer":
      case "annuler":
        Object.assign(data, { verrouille: false });
        break;
    }

    // Opération critique : changement de statut, historique, journal d'audit et instantané dans UNE transaction.
    // Si l'une des écritures échoue (journal compris), rien n'est validé.
    const snapshotType: TypeSnapshot | null = transition === "soumettre" ? "soumission" : transition === "valider" ? "validation" : null;
    const empreinte = await prisma.$transaction(
      async (tx) => {
        const r = await tx.dossier.updateMany({ where: { id, statut: d.statut }, data });
        if (r.count !== 1) throw new ErreurMetier("Le statut du dossier a changé entre-temps : rechargez la page.", 409, "conflit");
        const snap = snapshotType ? await figerSnapshot(tx, id, snapshotType, ctx) : null;
        await historiser(id, ctx, "transition", { deStatut: d.statut, versStatut: vers, commentaire }, tx);
        await journaliserCritique(tx, ctx, transition, "dossier", id, {
          reference: d.reference,
          de: d.statut,
          vers,
          commentaire: commentaire ?? null,
          snapshot: snap,
        });
        return snap?.empreinte ?? null;
      },
      { timeout: 60_000, maxWait: 10_000 }
    );
    void empreinte;

    if (transition === "soumettre") await notifierPermission(id, "dossier:valider", "a_valider", `${d.reference} — à valider`, commentaire ?? "", ctx.utilisateur.id);
    if (transition === "retourner") await notifierUtilisateur(d.chargeId, id, "retourne", `${d.reference} — retourné`, commentaire ?? "");
    if (transition === "valider") await notifierUtilisateur(d.chargeId, id, "valide", `${d.reference} — validé`, commentaire ?? "");
    return { statut: vers };
  },
  { permission: "dossier:lire" }
);
