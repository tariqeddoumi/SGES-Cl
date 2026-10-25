import { z } from "zod";
import { DECISIONS } from "@/lib/domaine/constantes";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, notifierRSE, notifierUtilisateur } from "@/lib/serveur/dossiers";
import { droitsDossier } from "@/lib/serveur/etat-dossier";
import { journaliserCritique } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { figerSnapshot } from "@/lib/serveur/snapshot";

const Schema = z.object({
  comite: z.string().max(40).nullable().optional(),
  dateComite: z.string().min(8),
  decision: z.enum(DECISIONS),
  montantAccorde: z.number().positive().max(1e15).nullable().optional(),
  motifRejetCode: z.string().max(40).nullable().optional(),
  motifRejetES: z.string().max(8000).nullable().optional(),
  reservesComite: z.string().max(8000).nullable().optional(),
  commentaireComite: z.string().max(8000).nullable().optional(),
});

/** Décision du comité de crédit (procédure §3.8) ; les réserves rouvrent le plan d'actions. */
export const POST = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    if (!droitsDossier(ctx, d).decider) throw new ErreurMetier("La décision se saisit sur un dossier validé.", 409, "verrouille");
    const s = Schema.parse(await corps(req));
    if (s.decision === "accorde" && !s.montantAccorde) throw new ErreurMetier("Montant accordé obligatoire.", 400, "validation", [{ champ: "montantAccorde" }]);
    if (s.decision === "rejete" && s.motifRejetCode && !s.motifRejetES?.trim()) {
      throw new ErreurMetier("Précisez le motif de rejet E&S.", 400, "validation", [{ champ: "motifRejetES" }]);
    }
    // Ajournement : le dossier retourne en évaluation pour être complété.
    const statut = s.decision === "ajourne" ? "brouillon" : "decide";
    // Décision : changement de statut, réserves du comité, historique, journal et instantané en une transaction.
    await prisma.$transaction(
      async (tx) => {
        const r = await tx.dossier.updateMany({
          where: { id, statut: "valide" },
          data: {
            comite: s.comite ?? null,
            dateComite: new Date(s.dateComite),
            decision: s.decision,
            montantAccorde: s.decision === "accorde" ? s.montantAccorde : null,
            motifRejetCode: s.decision === "rejete" ? (s.motifRejetCode ?? null) : null,
            motifRejetES: s.decision === "rejete" ? (s.motifRejetES ?? null) : null,
            reservesComite: s.reservesComite ?? null,
            commentaireComite: s.commentaireComite ?? null,
            statut,
            verrouille: false,
          },
        });
        if (r.count !== 1) throw new ErreurMetier("Le dossier n'est plus au statut « validé » : rechargez la page.", 409, "conflit");
        if (s.decision === "accorde" && s.reservesComite?.trim()) {
          const ordre = await tx.action.count({ where: { dossierId: id } });
          await tx.action.create({
            data: { dossierId: id, origine: "comite", libelle: s.reservesComite.trim(), horizon: "court", negociable: false, retenue: true, deviseCode: d.deviseCode, ordre },
          });
        }
        const snap = await figerSnapshot(tx, id, "decision", ctx);
        await historiser(id, ctx, "decision", { deStatut: d.statut, versStatut: statut, commentaire: `${s.decision}${s.motifRejetES ? ` — ${s.motifRejetES}` : ""}` }, tx);
        await journaliserCritique(tx, ctx, "decision", "dossier", id, {
          reference: d.reference,
          avant: { statut: d.statut, decision: d.decision, montantAccorde: d.montantAccorde },
          apres: { statut, decision: s.decision, montantAccorde: s.decision === "accorde" ? s.montantAccorde : null, comite: s.comite ?? null, dateComite: s.dateComite },
          snapshot: snap,
        });
      },
      { timeout: 60_000, maxWait: 10_000 }
    );
    await notifierUtilisateur(d.chargeId !== ctx.utilisateur.id ? d.chargeId : null, id, "decision", `${d.reference} — ${s.decision}`, s.commentaireComite ?? "");
    if (s.decision === "rejete" && s.motifRejetCode) await notifierRSE(id, "decision", `${d.reference} — rejet pour motif E&S`, s.motifRejetES ?? "");
    return { statut };
  },
  { permission: "dossier:decider" }
);
