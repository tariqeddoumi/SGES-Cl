import { z } from "zod";
import { HORIZONS, STATUTS_ACTION } from "@/lib/domaine/constantes";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({
  libelle: z.string().min(3).max(4000).optional(),
  horizon: z.enum(HORIZONS).optional(),
  retenue: z.boolean().nullable().optional(),
  reserveClient: z.string().max(4000).nullable().optional(),
  responsable: z.string().max(200).nullable().optional(),
  dateDebut: z.string().nullable().optional(),
  dateEcheance: z.string().nullable().optional(),
  periode: z.string().max(40).nullable().optional(),
  budget: z.number().min(0).max(1e13).nullable().optional(),
  deviseCode: z.string().length(3).nullable().optional(),
  avancement: z.number().int().min(0).max(100).optional(),
  statut: z.enum(STATUTS_ACTION).optional(),
  commentaire: z.string().max(4000).nullable().optional(),
  commentaireSuivi: z.string().max(4000).nullable().optional(),
});

async function charger(ctx: Parameters<typeof dossierAutorise>[0], id: string, actionId: string) {
  const d = await dossierAutorise(ctx, id, "ecriture");
  exigerVolet(ctx, d, "plan");
  const a = await prisma.action.findUnique({ where: { id: actionId } });
  if (!a || a.dossierId !== id) throw introuvable("Action introuvable.");
  return { d, a };
}

export const PATCH = route(
  async (req, ctx, { id, actionId }) => {
    const { d, a } = await charger(ctx, id, actionId);
    const s = Schema.parse(await corps(req));
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const enNegociation = d.statut === "brouillon";

    if (enNegociation) {
      if (s.retenue !== undefined && !a.negociable && s.retenue !== true) {
        throw new ErreurMetier("Action non négociable (issue de l'EIE) : elle reste retenue.", 400, "validation");
      }
      if (s.libelle !== undefined && a.origine === "systeme") delete s.libelle;
    } else {
      // Après la décision : suivi seulement (la négociation est close).
      delete s.retenue;
      delete s.libelle;
      delete s.horizon;
    }

    let { avancement, statut } = s;
    if (avancement !== undefined && statut === undefined) statut = avancement >= 100 ? "realisee" : avancement > 0 ? "en_cours" : a.statut === "abandonnee" ? "abandonnee" : "a_faire";
    if (statut === "realisee") avancement = 100;

    const maj = await prisma.action.update({
      where: { id: actionId },
      data: {
        libelle: s.libelle,
        horizon: s.horizon,
        retenue: s.retenue,
        reserveClient: s.reserveClient,
        responsable: s.responsable,
        dateDebut: date(s.dateDebut),
        dateEcheance: date(s.dateEcheance),
        periode: s.periode,
        budget: s.budget,
        deviseCode: s.deviseCode,
        commentaire: s.commentaire,
        avancement,
        statut,
      },
    });
    if ((avancement !== undefined && avancement !== a.avancement) || (statut !== undefined && statut !== a.statut)) {
      await prisma.suiviAction.create({
        data: { actionId, avancement: maj.avancement, statut: maj.statut, commentaire: s.commentaireSuivi ?? null, auteurId: ctx.utilisateur.id },
      });
    }
    await recalculer(id);
    return maj;
  },
  { permission: "dossier:lire" }
);

export const DELETE = route(
  async (_req, ctx, { id, actionId }) => {
    const { d, a } = await charger(ctx, id, actionId);
    if (a.origine === "systeme") throw new ErreurMetier("Une action proposée par le système s'écarte (non retenue) ; elle ne se supprime pas.", 400, "validation");
    // Une fois le dossier présenté à la validation puis au comité, le plan ne se supprime plus : l'action est abandonnée (traçable).
    if (d.statut !== "brouillon") throw new ErreurMetier("Le plan d'actions est figé : passez l'action au statut « abandonnée » (la suppression n'est possible qu'en cours d'évaluation).", 409, "verrouille");
    await prisma.action.delete({ where: { id: actionId } });
    await historiser(id, ctx, "plan", { commentaire: `− ${a.libelle.slice(0, 120)}` });
    await recalculer(id);
    return { ok: true };
  },
  { permission: "dossier:lire" }
);
