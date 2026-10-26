import { z } from "zod";
import { ALIGNEMENTS_TAXONOMIE, METHODES_EMISSIONS } from "@/lib/domaine/constantes";
import { normaliserAleas, normaliserTransition } from "@/lib/domaine/climat";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
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
/** Aléa ou facteur : 0 à 4, null = inconnu (jamais assimilé à 0), "na" = non applicable. */
const ValeurEchelle = z.union([Echelle, z.literal("na"), z.null()]);
const Schema = z.object({
  aleas: z.record(z.string(), ValeurEchelle),
  sensibilite: Echelle,
  capaciteAdaptation: Echelle,
  mesuresAdaptation: z.string().max(8000).nullable().optional(),
  transition: z.record(z.string(), ValeurEchelle),
  expositionCBAM: z.boolean(),
  partExportUE: z.number().min(0).max(100).nullable().optional(),
  scope1: z.number().min(0).max(1e9).nullable().optional(),
  scope2: z.number().min(0).max(1e9).nullable().optional(),
  scope3: z.number().min(0).max(1e10).nullable().optional(),
  methodeEmissions: z.enum(METHODES_EMISSIONS),
  /** Vérification par un tiers des émissions déclarées : exige la référence de l'attestation. */
  emissionsVerifiees: z.boolean().optional(),
  /** EBE annuel (devise du dossier), facultatif : base du stress de transition. */
  ebeAnnuel: z.number().min(0).max(1e15).nullable().optional(),
  sourceEmissions: z.string().max(4000).nullable().optional(),
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
    // La qualité PCAF n'est plus saisie : elle est déduite de la méthode et des preuves (recalculer).
    if (s.methodeEmissions !== "estimee_secteur" && !s.sourceEmissions?.trim()) {
      throw new ErreurMetier("Indiquez la source des émissions (rapport, bilan carbone, données d'activité : référence et date).", 400, "validation", [{ champ: "sourceEmissions" }]);
    }
    if (s.emissionsVerifiees && s.methodeEmissions !== "declaree") {
      throw new ErreurMetier("Seules des émissions déclarées peuvent être « vérifiées par un tiers ».", 400, "validation", [{ champ: "emissionsVerifiees" }]);
    }
    const data = {
      ...s,
      emissionsVerifiees: !!s.emissionsVerifiees,
      sourceEmissions: s.sourceEmissions?.trim() || null,
      aleas: JSON.stringify(normaliserAleas(s.aleas)),
      transition: JSON.stringify(normaliserTransition(s.transition)),
    };
    await prisma.evaluationClimat.upsert({ where: { dossierId: id }, update: data, create: { ...data, dossierId: id } });
    await prisma.dossier.update({ where: { id }, data: { etape: Math.max(d.etape, 6) } });
    await recalculer(id);
    return prisma.evaluationClimat.findUnique({ where: { dossierId: id } });
  },
  { permission: "dossier:modifier" }
);
