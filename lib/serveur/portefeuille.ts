import type { Prisma } from "@prisma/client";
import type { Contexte } from "./contexte";
import { filtreLecture } from "./perimetre";
import { prisma } from "./prisma";

/** Dossiers du périmètre pour les tableaux de bord et le reporting (lecture légère). */
export async function dossiersPerimetre(ctx: Contexte, where: Prisma.DossierWhereInput = {}) {
  return prisma.dossier.findMany({
    where: { ...filtreLecture(ctx.perimetre), statut: { not: "annule" }, ...where },
    select: {
      id: true, reference: true, statut: true, categorie: true, sousCategorieFI: true, niveauRisque: true, scoreRisque: true,
      montantDemande: true, montantDemandeRef: true, montantAccorde: true, tauxReference: true, deviseCode: true,
      dateDossier: true, valideLe: true, dateComite: true, decision: true, exclu: true, evaluationObligatoire: true,
      projetDeveloppementDurable: true, planActionPropose: true, nbRisquesNonMaitrises: true, entiteId: true, updatedAt: true,
      chargeId: true, motifRejetCode: true,
      client: { select: { raisonSociale: true } },
      entite: { select: { id: true, code: true, nom: true } },
      secteur: { select: { code: true, libelle: true, risqueTransition: true, exposeCBAM: true } },
      region: { select: { code: true, libelle: true, stressHydrique: true, secheresse: true, inondation: true, chaleurExtreme: true, submersionMarine: true, incendie: true, seisme: true } },
      climat: { select: { scoreClimat: true, niveauClimat: true, scorePhysique: true, scoreTransition: true, emissionsFinancees: true, alignementTaxonomie: true, expositionCBAM: true } },
      charge: { select: { prenom: true, nom: true } },
    },
    orderBy: { dateDossier: "desc" },
  });
}

export type LigneDossier = Awaited<ReturnType<typeof dossiersPerimetre>>[number];

export function compter<T>(lignes: T[], cle: (x: T) => string | null | undefined): Record<string, number> {
  const r: Record<string, number> = {};
  for (const l of lignes) {
    const k = cle(l) ?? "—";
    r[k] = (r[k] ?? 0) + 1;
  }
  return r;
}

export function sommer<T>(lignes: T[], cle: (x: T) => string | null | undefined, valeur: (x: T) => number): Record<string, number> {
  const r: Record<string, number> = {};
  for (const l of lignes) {
    const k = cle(l) ?? "—";
    r[k] = (r[k] ?? 0) + valeur(l);
  }
  return r;
}
