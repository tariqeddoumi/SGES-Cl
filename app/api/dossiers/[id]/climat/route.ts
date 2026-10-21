import { z } from "zod";
import { ALIGNEMENTS_TAXONOMIE, METHODES_EMISSIONS } from "@/lib/domaine/constantes";
import { normaliserAleas, normaliserTransition } from "@/lib/domaine/climat";
import { corps, route } from "@/lib/serveur/api";
import { dossierAutorise, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const d = await prisma.dossier.findUniqueOrThrow({
      where: { id },
      select: { climat: true, region: true, secteur: true, montantDemandeRef: true, montantInvestissementRef: true },
    });
    return d;
  },
  { permission: "dossier:lire" }
);

const Echelle = z.number().int().min(0).max(4);
const Schema = z.object({
  aleas: z.record(z.string(), Echelle),
  sensibilite: Echelle,
  capaciteAdaptation: Echelle,
  mesuresAdaptation: z.string().max(8000).nullable().optional(),
  transition: z.record(z.string(), Echelle),
  expositionCBAM: z.boolean(),
  partExportUE: z.number().min(0).max(100).nullable().optional(),
  scope1: z.number().min(0).max(1e9).nullable().optional(),
  scope2: z.number().min(0).max(1e9).nullable().optional(),
  scope3: z.number().min(0).max(1e10).nullable().optional(),
  methodeEmissions: z.enum(METHODES_EMISSIONS),
  qualitePCAF: z.number().int().min(1).max(5).optional(),
  emissionsEvitees: z.number().min(0).max(1e9).nullable().optional(),
  partRenouvelable: z.number().min(0).max(100).nullable().optional(),
  alignementTaxonomie: z.enum(ALIGNEMENTS_TAXONOMIE),
  objectifTaxonomie: z.string().max(40).nullable().optional(),
  commentaire: z.string().max(8000).nullable().optional(),
});

export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const s = Schema.parse(await corps(req));
    const data = {
      ...s,
      aleas: JSON.stringify(normaliserAleas(s.aleas)),
      transition: JSON.stringify(normaliserTransition(s.transition)),
      qualitePCAF: s.qualitePCAF ?? 5,
    };
    await prisma.evaluationClimat.upsert({ where: { dossierId: id }, update: data, create: { ...data, dossierId: id } });
    await prisma.dossier.update({ where: { id }, data: { etape: Math.max(d.etape, 6) } });
    await recalculer(id);
    return prisma.evaluationClimat.findUnique({ where: { dossierId: id } });
  },
  { permission: "dossier:modifier" }
);
