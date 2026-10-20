import type { Categorie } from "./constantes";

/**
 * Catégorisation E&S d'un projet (procédure CFD12340876/0217, §3.3).
 *
 *  - catégorie A si l'un des éléments A reçoit « oui », quelles que soient les autres réponses ;
 *  - catégorie B si aucun élément A n'est positif et qu'au moins un élément B l'est ;
 *  - catégorie C si seul l'élément C (société de service) est positif ;
 *  - catégorie FI si seul l'élément FI (intermédiaire financier) est positif.
 *
 * En cas de réponses positives dans plusieurs catégories, celle dont l'impact est le
 * plus significatif prévaut : l'ordre de préséance est paramétrable (A, B, FI, C par
 * défaut : un intermédiaire financier pèse plus qu'une société de service).
 */

export const PRESEANCE_DEFAUT: Categorie[] = ["A", "B", "FI", "C"];

export interface ResultatCategorisation {
  /** Catégorie calculée ; null si aucun élément n'est positif ou si le formulaire est incomplet. */
  categorie: Categorie | null;
  /** Éléments positifs, par catégorie. */
  positifs: Record<Categorie, string[]>;
  /** Questions actives restées sans réponse. */
  manquantes: string[];
  complet: boolean;
}

export function calculerCategorie(
  questions: { id: string; categorie: string; actif?: boolean }[],
  reponses: Record<string, boolean | null | undefined>,
  preseance: Categorie[] = PRESEANCE_DEFAUT
): ResultatCategorisation {
  const positifs: Record<Categorie, string[]> = { A: [], B: [], C: [], FI: [] };
  const manquantes: string[] = [];
  for (const q of questions) {
    if (q.actif === false) continue;
    const r = reponses[q.id];
    if (r === undefined || r === null) {
      manquantes.push(q.id);
      continue;
    }
    if (r && q.categorie in positifs) positifs[q.categorie as Categorie].push(q.id);
  }
  // Un « oui » à un élément A suffit, même si le formulaire n'est pas terminé :
  // le classement A ne peut plus être remis en cause par les autres réponses.
  const categorie = positifs.A.length
    ? "A"
    : manquantes.length
      ? null
      : (preseance.find((c) => positifs[c].length > 0) ?? null);
  return { categorie, positifs, manquantes, complet: manquantes.length === 0 };
}

/** Une étude d'impact (EIE/EIES) est exigée pour la catégorie A (procédure §3.4). */
export function eieRequise(categorie: string | null | undefined): boolean {
  return categorie === "A";
}

/** Lecture de l'ordre de préséance paramétré (« A,B,FI,C »). */
export function lirePreseance(valeur: string | null | undefined): Categorie[] {
  const lu = (valeur ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is Categorie => ["A", "B", "C", "FI"].includes(s));
  const complet = Array.from(new Set([...lu, ...PRESEANCE_DEFAUT]));
  return complet as Categorie[];
}
