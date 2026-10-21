import type { NiveauRisque } from "./constantes";

/**
 * Évaluation des risques E&S à partir des check-lists (procédure §3.4 et §3.6).
 *
 * Chaque question porte la (les) réponse(s) qui signalent un risque NON MAÎTRISÉ
 * (« Non » à une mesure de contrôle et de gestion, ou « Oui » à une nuisance) et une
 * gravité de 1 à 4. Le score de risque résiduel est la part, pondérée par la gravité,
 * des questions applicables dont la réponse signale un risque non maîtrisé :
 *
 *     score = 100 × Σ gravité(risques) / Σ gravité(questions applicables répondues)
 *
 * Le niveau découle de seuils paramétrables ; la catégorie A relève le niveau d'un cran
 * (impacts potentiellement irréversibles) et un risque critique (gravité 4) non maîtrisé
 * porte au moins le niveau « élevé ».
 */

export interface QuestionRisque {
  id: string;
  type: string;
  reponseRisque: string | null;
  gravite: number;
  thematique?: string;
  obligatoire?: boolean;
}

/** Normalise une réponse saisie (oui/non/na ou valeur libre). */
export function normaliser(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

/** La réponse signale-t-elle un risque non maîtrisé ? */
export function estRisque(q: Pick<QuestionRisque, "reponseRisque" | "type">, valeur: string | null | undefined): boolean {
  const v = normaliser(valeur);
  if (!v || v === "na") return false;
  // Séparateurs : « ; » ou une virgule qui n'est pas une virgule décimale (« <=2,5 »).
  const declencheurs = normaliser(q.reponseRisque)
    .split(/;|,(?!\d)/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (declencheurs.length === 0) return false;
  if (q.type === "nombre") {
    // Seuils numériques : « >100 », « <0,5 », « >=3 ».
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n)) return false;
    return declencheurs.some((d) => {
      const m = d.match(/^(>=|<=|>|<)\s*(-?[\d.,]+)$/);
      if (!m) return false;
      const s = Number(m[2].replace(",", "."));
      return m[1] === ">" ? n > s : m[1] === "<" ? n < s : m[1] === ">=" ? n >= s : n <= s;
    });
  }
  return declencheurs.includes(v);
}

export interface SeuilsNiveau {
  modere: number;
  eleve: number;
  critique: number;
}

export const SEUILS_DEFAUT: SeuilsNiveau = { modere: 15, eleve: 35, critique: 60 };

export function lireSeuils(valeur: string | null | undefined): SeuilsNiveau {
  const [a, b, c] = (valeur ?? "").split(",").map((s) => Number(s.trim()));
  if ([a, b, c].every((x) => Number.isFinite(x)) && a < b && b < c) return { modere: a, eleve: b, critique: c };
  return SEUILS_DEFAUT;
}

const ORDRE: NiveauRisque[] = ["faible", "modere", "eleve", "critique"];

export function niveauDepuisScore(score: number, seuils: SeuilsNiveau = SEUILS_DEFAUT): NiveauRisque {
  if (score >= seuils.critique) return "critique";
  if (score >= seuils.eleve) return "eleve";
  if (score >= seuils.modere) return "modere";
  return "faible";
}

export function relever(n: NiveauRisque, crans = 1): NiveauRisque {
  return ORDRE[Math.min(ORDRE.length - 1, ORDRE.indexOf(n) + crans)];
}

export function auMoins(n: NiveauRisque, plancher: NiveauRisque): NiveauRisque {
  return ORDRE.indexOf(n) >= ORDRE.indexOf(plancher) ? n : plancher;
}

export interface SyntheseThematique {
  thematique: string;
  applicables: number;
  repondues: number;
  risques: number;
  /** maitrise : concerné, risque maîtrisé ; non_maitrise : plan d'action ; non_concerne. */
  etat: "maitrise" | "non_maitrise" | "non_concerne";
}

export interface ResultatRisque {
  score: number;
  niveau: NiveauRisque;
  nbRisques: number;
  nbApplicables: number;
  nbRepondues: number;
  /** Questions obligatoires sans réponse. */
  manquantes: string[];
  complet: boolean;
  parThematique: SyntheseThematique[];
  risquesCritiques: number;
}

export function calculerRisque(
  questions: QuestionRisque[],
  reponses: Record<string, string | null | undefined>,
  options: { categorie?: string | null; seuils?: SeuilsNiveau; releverCategorieA?: boolean } = {}
): ResultatRisque {
  let poidsTotal = 0;
  let poidsRisque = 0;
  let nbRisques = 0;
  let nbRepondues = 0;
  let risquesCritiques = 0;
  const manquantes: string[] = [];
  const parThem = new Map<string, SyntheseThematique>();

  for (const q of questions) {
    const them = q.thematique ?? "divers";
    const s = parThem.get(them) ?? { thematique: them, applicables: 0, repondues: 0, risques: 0, etat: "non_concerne" as const };
    s.applicables++;
    const v = normaliser(reponses[q.id]);
    if (!v) {
      if (q.obligatoire !== false) manquantes.push(q.id);
      parThem.set(them, s);
      continue;
    }
    nbRepondues++;
    // Seules les questions qui évaluent un risque rendent une thématique « concernée ».
    if (q.reponseRisque) s.repondues++;
    if (v === "na") {
      parThem.set(them, s);
      continue;
    }
    const g = Math.max(1, Math.min(4, q.gravite || 2));
    // Seules les questions qui évaluent un risque entrent dans la pondération : une
    // question descriptive (texte libre sans déclencheur) ne dilue pas le score.
    if (q.reponseRisque) poidsTotal += g;
    if (estRisque(q, v)) {
      poidsRisque += g;
      nbRisques++;
      s.risques++;
      if (g >= 4) risquesCritiques++;
    }
    parThem.set(them, s);
  }

  const score = poidsTotal > 0 ? Math.round((1000 * poidsRisque) / poidsTotal) / 10 : 0;
  let niveau = niveauDepuisScore(score, options.seuils);
  if (options.categorie === "A" && options.releverCategorieA !== false && nbRisques > 0) niveau = relever(niveau);
  if (risquesCritiques > 0) niveau = auMoins(niveau, "eleve");

  const parThematique = Array.from(parThem.values()).map((s) => ({
    ...s,
    etat: s.risques > 0 ? ("non_maitrise" as const) : s.repondues > 0 ? ("maitrise" as const) : ("non_concerne" as const),
  }));

  return {
    score,
    niveau,
    nbRisques,
    nbApplicables: questions.length,
    nbRepondues,
    manquantes,
    complet: manquantes.length === 0,
    parThematique,
    risquesCritiques,
  };
}

/** La question s'applique-t-elle au dossier (catégorie et secteur) ? */
export function questionApplicable(
  q: { categories: string; secteurs?: string | null; actif?: boolean },
  categorie: string | null | undefined,
  codeSecteur?: string | null
): boolean {
  if (q.actif === false || !categorie) return false;
  const cats = q.categories.split(",").map((s) => s.trim().toUpperCase());
  if (!cats.includes(categorie.toUpperCase())) return false;
  const secteurs = (q.secteurs ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (secteurs.length === 0) return true;
  if (!codeSecteur) return false;
  // Un code de section (« C ») couvre ses divisions (« C23 », « C2394 »).
  return secteurs.some((s) => codeSecteur === s || codeSecteur.startsWith(s));
}
