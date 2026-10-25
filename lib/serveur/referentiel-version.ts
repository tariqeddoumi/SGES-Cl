import type { Parametres } from "../parametres";
import { prisma } from "./prisma";
import { sha256 } from "./snapshot";

/** Paramètres qui changent le résultat d'une évaluation (catégorie, risque, climat, déclenchement). */
const PARAMETRES_DE_CALCUL = [
  "SEUIL_DECLENCHEMENT",
  "PRESEANCE_CATEGORIES",
  "SEUILS_NIVEAU_RISQUE",
  "RELEVER_NIVEAU_CATEGORIE_A",
  "CLIMAT_COUVERTURE_MIN",
  "CLIMAT_PONDERATION",
  "CLIMAT_SEUILS_NIVEAUX",
];

/**
 * Empreinte du référentiel d'évaluation en vigueur : questionnaire (libellés, types, gravités, réponses
 * signalant un risque), éléments de catégorisation, critères d'exclusion et paramètres de calcul.
 * Enregistrée sur le dossier à chaque calcul tant qu'il est en évaluation, puis figée à la soumission
 * (et reprise dans l'instantané) : une évaluation passée reste rattachée au référentiel qui l'a produite.
 */
export async function versionReferentiel(p: Parametres): Promise<string> {
  const [questions, categorisation, exclusion] = await Promise.all([
    prisma.question.findMany({
      where: { actif: true },
      orderBy: { code: "asc" },
      select: { code: true, libelle: true, type: true, gravite: true, reponseRisque: true, obligatoire: true, categories: true, secteurs: true },
    }),
    prisma.questionCategorisation.findMany({ where: { actif: true }, orderBy: { code: "asc" }, select: { code: true, categorie: true, libelle: true } }),
    prisma.critereExclusion.findMany({ where: { actif: true }, orderBy: { code: "asc" }, select: { code: true, libelle: true, bloquant: true } }),
  ]);
  const parametres = Object.fromEntries(PARAMETRES_DE_CALCUL.map((k) => [k, p[k] ?? null]));
  return sha256(JSON.stringify({ questions, categorisation, exclusion, parametres })).slice(0, 16);
}
