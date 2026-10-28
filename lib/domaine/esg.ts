/**
 * Note ESG du dossier : qualité de la gestion environnementale, sociale et de gouvernance du
 * client et de son projet, de 0 à 100 et de A (excellente) à E (insuffisante).
 *
 * Elle se déduit de ce qui est déjà saisi, sans question supplémentaire :
 *  - E : questions environnementales maîtrisées (pondérées par la gravité) et risque climatique ;
 *  - S : questions sociales (santé-sécurité, ressources humaines, communautés) maîtrisées ;
 *  - G : système de gestion et conformité, complétude des pièces, engagement sur le plan
 *        d'actions, transparence des données climat.
 *
 * À l'inverse du « risque E&S résiduel » (plus il est élevé, plus le dossier est risqué), la note
 * ESG mesure une qualité : plus elle est élevée, mieux le client maîtrise ses enjeux. Elle a deux
 * moments : à l'octroi (figée à la soumission) et actualisée en suivi, où une action corrective
 * réalisée rend maîtrisé le risque qu'elle traitait et où une visite non conforme plafonne la note.
 *
 * Garde-fous : un projet exclu n'est pas noté ; un risque critique (gravité 4) non maîtrisé
 * plafonne la note à D ; une couverture insuffisante des réponses rend la note provisoire.
 */
import { estRisque, normaliser } from "./risque";

export const METHODE_ESG_VERSION = "SGES-ESG-1.0 (indicative)";
export const PILIERS = ["E", "S", "G"] as const;
export type Pilier = (typeof PILIERS)[number];
export const NOTES_ESG = ["A", "B", "C", "D", "E"] as const;
export type NoteESG = (typeof NOTES_ESG)[number];

/** Pilier par défaut d'une thématique du questionnaire (une question peut le préciser). */
export const PILIER_THEMATIQUE: Record<string, Pilier> = {
  GEST_ENV: "E",
  CLIMAT: "E",
  HSE: "S",
  RH: "S",
  SFI: "S",
  FI_ACTIVITE: "G",
  FI_ENGAGEMENT: "G",
};

export function pilierQuestion(q: { pilier?: string | null; thematique?: string | null }): Pilier | null {
  if (q.pilier && (PILIERS as readonly string[]).includes(q.pilier)) return q.pilier as Pilier;
  return q.thematique ? PILIER_THEMATIQUE[q.thematique] ?? null : null;
}

export interface QuestionESG {
  id: string;
  type: string;
  reponseRisque: string | null;
  gravite: number;
  pilier: Pilier | null;
  valeur: string | null;
  /** Suivi : toutes les actions retenues sur ce risque sont réalisées. */
  actionRealisee?: boolean;
}

export interface EntreeESG {
  questions: QuestionESG[];
  /** Score climat (risque, 0 à 100), couverture (0 à 1) et qualité PCAF (1 meilleure à 5). */
  climat: { score: number | null; couverture: number | null; qualitePCAF: number | null } | null;
  /** Lignes de la check-list des pièces. */
  pieces: { niveau: "obligatoire" | "recommandee"; statut: string; officiel: boolean }[];
  /** Actions du plan : retenue (null = non négociée), statut, avancement, échéance dépassée. */
  actions: { retenue: boolean | null; statut: string; avancement: number; enRetard: boolean }[];
  /** Conformité de la dernière visite de suivi. */
  conformiteVisite: string | null;
  exclu: boolean;
  /** Suivi : après la décision, les actions réalisées et les visites comptent. */
  suivi: boolean;
}

export interface ParametresESG {
  ponderation: Record<Pilier, number>;
  /** Seuils de A, B, C, D (le reste est E). */
  seuils: [number, number, number, number];
  couvertureMin: number;
  /** Part du climat dans le pilier E. */
  partClimat: number;
}

export const PARAMETRES_ESG_DEFAUT: ParametresESG = { ponderation: { E: 0.4, S: 0.3, G: 0.3 }, seuils: [80, 65, 50, 35], couvertureMin: 0.6, partClimat: 0.3 };

export interface Composante {
  code: string;
  score: number;
  poids: number;
}

export interface ResultatPilier {
  score: number | null;
  composantes: Composante[];
  /** Risques non maîtrisés du pilier. */
  risques: number;
}

export interface ResultatESG {
  score: number | null;
  note: NoteESG | null;
  exclu: boolean;
  provisoire: boolean;
  couverture: number;
  plafond: "risque_critique" | "visite_non_conforme" | null;
  piliers: Record<Pilier, ResultatPilier>;
  version: string;
}

const arrondi = (n: number) => Math.round(n * 10) / 10;
const borne = (n: number) => Math.max(0, Math.min(100, n));

function moyenne(c: Composante[]): number | null {
  const p = c.reduce((s, x) => s + x.poids, 0);
  return p > 0 ? arrondi(c.reduce((s, x) => s + x.score * x.poids, 0) / p) : null;
}

export function lirePonderationESG(v: string | null | undefined): Record<Pilier, number> {
  const n = (v ?? "").split(",").map((x) => Number(x.trim()));
  if (n.length !== 3 || n.some((x) => !Number.isFinite(x) || x < 0) || n.reduce((a, b) => a + b, 0) <= 0) return { ...PARAMETRES_ESG_DEFAUT.ponderation };
  return { E: n[0], S: n[1], G: n[2] };
}

export function lireSeuilsESG(v: string | null | undefined): [number, number, number, number] {
  const n = (v ?? "").split(",").map((x) => Number(x.trim()));
  if (n.length !== 4 || n.some((x) => !Number.isFinite(x)) || !(n[0] > n[1] && n[1] > n[2] && n[2] > n[3])) return [...PARAMETRES_ESG_DEFAUT.seuils];
  return n as [number, number, number, number];
}

export function noteDepuisScore(score: number, seuils = PARAMETRES_ESG_DEFAUT.seuils): NoteESG {
  return score >= seuils[0] ? "A" : score >= seuils[1] ? "B" : score >= seuils[2] ? "C" : score >= seuils[3] ? "D" : "E";
}

const VALEUR_PIECE: Record<string, number> = { complet: 1, canevas: 0.75, non_analyse: 0.75, incomplet: 0.5, manquant: 0 };

/** Complétude des pièces (0 à 100) : les pièces obligatoires comptent double. */
export function scoreDocumentation(pieces: EntreeESG["pieces"]): number | null {
  if (!pieces.length) return null;
  let s = 0, p = 0;
  for (const l of pieces) {
    const poids = l.niveau === "obligatoire" ? 2 : 1;
    const v = l.statut === "canevas" && l.officiel ? 0.5 : VALEUR_PIECE[l.statut] ?? 0;
    s += v * poids;
    p += poids;
  }
  return arrondi((100 * s) / p);
}

/**
 * Engagement sur le plan d'actions (0 à 100). À l'octroi : part des actions négociées que le
 * client retient. En suivi : avancement des actions retenues, nul pour une action en retard.
 */
export function scoreEngagement(actions: EntreeESG["actions"], suivi: boolean): number | null {
  if (suivi) {
    const retenues = actions.filter((a) => a.retenue && a.statut !== "abandonnee");
    if (!retenues.length) return null;
    const v = retenues.map((a) => (a.statut === "realisee" ? 1 : a.enRetard ? 0 : Math.max(0, Math.min(100, a.avancement)) / 100));
    return arrondi((100 * v.reduce((x, y) => x + y, 0)) / v.length);
  }
  const negociees = actions.filter((a) => a.retenue !== null);
  if (!negociees.length) return null;
  return arrondi((100 * negociees.filter((a) => a.retenue).length) / negociees.length);
}

/** Transparence des données climat : couverture et qualité PCAF (1 = 100, 5 = 0). */
export function scoreTransparence(climat: EntreeESG["climat"]): number | null {
  if (!climat || (climat.couverture === null && climat.qualitePCAF === null)) return null;
  const c: Composante[] = [];
  if (climat.couverture !== null) c.push({ code: "couverture", score: borne(climat.couverture * 100), poids: 1 });
  if (climat.qualitePCAF !== null) c.push({ code: "pcaf", score: borne(((5 - climat.qualitePCAF) / 4) * 100), poids: 1 });
  return moyenne(c);
}

export function calculerESG(e: EntreeESG, p: ParametresESG = PARAMETRES_ESG_DEFAUT): ResultatESG {
  // Questions notables : une réponse de risque est définie, la question est rattachée à un pilier.
  const notables = e.questions.filter((q) => q.pilier && normaliser(q.reponseRisque) !== "");
  const repondues = notables.filter((q) => normaliser(q.valeur) !== "");
  const couverture = notables.length ? arrondi(repondues.length / notables.length) : 0;
  let critique = false;
  const parPilier: Record<Pilier, { s: number; p: number; risques: number }> = { E: { s: 0, p: 0, risques: 0 }, S: { s: 0, p: 0, risques: 0 }, G: { s: 0, p: 0, risques: 0 } };
  for (const q of repondues) {
    if (normaliser(q.valeur) === "na") continue;
    const poids = Math.max(1, Math.min(4, q.gravite || 2));
    const maitrise = !estRisque(q, q.valeur) || (e.suivi && !!q.actionRealisee);
    const x = parPilier[q.pilier!];
    x.p += poids;
    if (maitrise) x.s += poids;
    else {
      x.risques++;
      if (poids >= 4) critique = true;
    }
  }
  const questions = (k: Pilier): Composante[] => (parPilier[k].p ? [{ code: "questions", score: arrondi((100 * parPilier[k].s) / parPilier[k].p), poids: 1 }] : []);

  // E : questions environnementales et climat (100 − score de risque climat).
  const compE = questions("E").map((c) => ({ ...c, poids: 1 - p.partClimat }));
  if (e.climat?.score !== null && e.climat?.score !== undefined) compE.push({ code: "climat", score: arrondi(borne(100 - e.climat.score)), poids: p.partClimat });
  // S : questions sociales.
  const compS = questions("S");
  // G : système de gestion et conformité, pièces, engagement, transparence climat.
  const compG = questions("G").map((c) => ({ ...c, poids: 0.5 }));
  const doc = scoreDocumentation(e.pieces);
  if (doc !== null) compG.push({ code: "documentation", score: doc, poids: 0.2 });
  const eng = scoreEngagement(e.actions, e.suivi);
  if (eng !== null) compG.push({ code: "engagement", score: eng, poids: 0.2 });
  const tra = scoreTransparence(e.climat);
  if (tra !== null) compG.push({ code: "transparence", score: tra, poids: 0.1 });

  const piliers: Record<Pilier, ResultatPilier> = {
    E: { score: moyenne(compE), composantes: compE, risques: parPilier.E.risques },
    S: { score: moyenne(compS), composantes: compS, risques: parPilier.S.risques },
    G: { score: moyenne(compG), composantes: compG, risques: parPilier.G.risques },
  };
  const base = { couverture, piliers, version: METHODE_ESG_VERSION, provisoire: couverture < p.couvertureMin };
  if (e.exclu) return { ...base, score: null, note: null, exclu: true, plafond: null };
  // Sans aucune réponse notée, pas de note (les pièces ou le plan seuls ne suffisent pas).
  if (!repondues.length) return { ...base, score: null, note: null, exclu: false, plafond: null };

  const global = moyenne(PILIERS.filter((k) => piliers[k].score !== null).map((k) => ({ code: k, score: piliers[k].score!, poids: p.ponderation[k] })));
  if (global === null) return { ...base, score: null, note: null, exclu: false, plafond: null };
  let score = global;
  let plafond: ResultatESG["plafond"] = null;
  // Plafonds : juste sous le seuil de la note maximale autorisée.
  if (critique && score >= p.seuils[2]) {
    score = arrondi(p.seuils[2] - 0.1);
    plafond = "risque_critique";
  }
  if (e.suivi && e.conformiteVisite === "non_conforme" && score >= p.seuils[1]) {
    score = arrondi(p.seuils[1] - 0.1);
    plafond = plafond ?? "visite_non_conforme";
  }
  return { ...base, score, note: noteDepuisScore(score, p.seuils), exclu: false, plafond };
}
