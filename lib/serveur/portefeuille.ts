import type { Prisma } from "@prisma/client";
import type { Contexte } from "./contexte";
import { filtreLecture, type Perimetre } from "./perimetre";
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

/**
 * Actions retenues suivies au portefeuille (dossiers décidés, en suivi ou clôturés) et
 * définition unique d'une action « en retard » : retenue, ni réalisée ni abandonnée, échéance
 * dépassée, sur un dossier dont le suivi est en cours. Partagée par le tableau de bord et la
 * page Plans d'actions pour que les compteurs et la liste filtrée concordent.
 */
export function filtreActionsPortefeuille(perimetre: Perimetre): Prisma.ActionWhereInput {
  return { retenue: true, dossier: { ...filtreLecture(perimetre), statut: { in: ["decide", "en_suivi", "cloture"] } } };
}

export function filtreActionsEnRetard(perimetre: Perimetre, maintenant = new Date()): Prisma.ActionWhereInput {
  return {
    retenue: true,
    statut: { in: ["a_faire", "en_cours"] },
    dateEcheance: { lt: maintenant },
    dossier: { ...filtreLecture(perimetre), statut: { in: ["decide", "en_suivi"] } },
  };
}

/**
 * Échéances des visites de suivi : crédits accordés (dossiers décidés ou en suivi). L'échéance
 * est la prochaine visite fixée, sinon la dernière visite + délai paramétré, sinon la date du
 * comité. Source unique de la page Visites et du compteur du tableau de bord.
 */
export async function echeancesVisites(perimetre: Perimetre, delaiMois: number, maintenant = new Date()) {
  const suivis = await prisma.dossier.findMany({
    where: { ...filtreLecture(perimetre), statut: { in: ["decide", "en_suivi"] }, decision: "accorde" },
    select: {
      id: true, reference: true, statut: true, dateComite: true, client: { select: { raisonSociale: true } },
      visites: { orderBy: { date: "desc" }, take: 1, select: { date: true, prochaineVisite: true } },
    },
  });
  return suivis
    .map((d) => {
      const v = d.visites[0];
      const echeance = v?.prochaineVisite ?? (v ? new Date(v.date.getFullYear(), v.date.getMonth() + delaiMois, v.date.getDate()) : d.dateComite ?? maintenant);
      return { id: d.id, reference: d.reference, client: d.client.raisonSociale, derniere: v?.date ?? null, echeance, enRetard: echeance < maintenant };
    })
    .sort((a, b) => +a.echeance - +b.echeance);
}
