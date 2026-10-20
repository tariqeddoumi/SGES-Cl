import { z } from "zod";
import { HORIZONS, ORIGINES_ACTION } from "@/lib/domaine/constantes";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const actions = await prisma.action.findMany({
      where: { dossierId: id },
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
      include: { suivis: { orderBy: { date: "desc" }, take: 10 } },
    });
    const questions = await prisma.question.findMany({
      where: { id: { in: actions.map((a) => a.questionId).filter((x): x is string => !!x) } },
      select: { id: true, code: true, libelle: true },
    });
    return { actions, questions };
  },
  { permission: "dossier:lire" }
);

const Schema = z.object({
  libelle: z.string().min(3).max(4000),
  origine: z.enum(ORIGINES_ACTION).default("manuelle"),
  horizon: z.enum(HORIZONS).default("court"),
  thematique: z.string().max(40).nullable().optional(),
  responsable: z.string().max(200).nullable().optional(),
  dateDebut: z.string().nullable().optional(),
  dateEcheance: z.string().nullable().optional(),
  budget: z.number().min(0).max(1e13).nullable().optional(),
  deviseCode: z.string().length(3).nullable().optional(),
  commentaire: z.string().max(4000).nullable().optional(),
});

export const POST = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "plan");
    const s = Schema.parse(await corps(req));
    if (s.origine === "systeme") throw new ErreurMetier("Les actions « système » sont générées automatiquement.", 400, "validation");
    // Actions de l'EIE : non négociables, retenues d'office (procédure §3.7).
    const eie = s.origine === "eie";
    const apresDecision = d.statut !== "brouillon";
    const ordre = await prisma.action.count({ where: { dossierId: id } });
    const a = await prisma.action.create({
      data: {
        dossierId: id,
        origine: s.origine,
        libelle: s.libelle,
        horizon: s.horizon,
        thematique: s.thematique ?? null,
        responsable: s.responsable ?? null,
        dateDebut: s.dateDebut ? new Date(s.dateDebut) : null,
        dateEcheance: s.dateEcheance ? new Date(s.dateEcheance) : null,
        budget: s.budget ?? null,
        deviseCode: s.deviseCode ?? d.deviseCode,
        commentaire: s.commentaire ?? null,
        negociable: !eie && !apresDecision,
        retenue: eie || apresDecision ? true : null,
        ordre,
      },
    });
    await prisma.dossier.update({ where: { id }, data: { planActionPropose: true } });
    await historiser(id, ctx, "plan", { commentaire: `+ ${s.libelle.slice(0, 120)}` });
    return a;
  },
  { permission: "dossier:lire" }
);
