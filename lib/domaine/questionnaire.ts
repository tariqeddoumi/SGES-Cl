/**
 * Niveau du questionnaire d'évaluation et modules d'activité.
 *
 * Chaque question porte un niveau d'exigence (réglementaire, interne / BAM, SFI / Équateur, bonne
 * pratique) et, le cas échéant, un module d'activité qui la déclenche (rejets liquides, émissions,
 * biodiversité…). Le niveau du questionnaire, réglé par catégorie, détermine les questions posées :
 *  - minimum  : exigences réglementaires et internes, selon les modules retenus ;
 *  - standard : minimum + normes SFI / Principes de l'Équateur, selon les modules retenus ;
 *  - complet  : toutes les questions de la catégorie (aucun filtrage).
 *
 * Garde-fous : la catégorie A et les intermédiaires financiers restent complets ; un financement
 * soumis aux exigences SFI (ligne de bailleur, Principes de l'Équateur) passe au moins en standard ;
 * le Responsable RSE peut imposer le questionnaire complet ; une donnée inconnue retient le module.
 */

export const NIVEAUX_QUESTION = ["reglementaire", "interne", "sfi", "bonne_pratique"] as const;
export type NiveauQuestion = (typeof NIVEAUX_QUESTION)[number];

export const NIVEAUX_QUESTIONNAIRE = ["minimum", "standard", "complet"] as const;
export type NiveauQuestionnaire = (typeof NIVEAUX_QUESTIONNAIRE)[number];

const NIVEAUX_POSES: Record<NiveauQuestionnaire, readonly string[]> = {
  minimum: ["reglementaire", "interne"],
  standard: ["reglementaire", "interne", "sfi"],
  complet: NIVEAUX_QUESTION,
};

export interface DefModule {
  code: string;
  secteurs?: string | null;
  zones?: string | null;
  natures?: string | null;
  effectifMin?: number | null;
  stressHydriqueMin?: number | null;
  equateur?: boolean;
}

export interface ContexteDossier {
  codeSecteur: string | null;
  typeZone: string | null;
  natureProjet: string | null;
  /** Effectif déclaré (null : inconnu). */
  effectif: number | null;
  /** Stress hydrique de la région, 0 à 4 (null : inconnu). */
  stressHydrique: number | null;
  /** Principes de l'Équateur applicables. */
  equateur: boolean;
}

export const codes = (s: string | null | undefined) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const lireNiveau = (v: string | null | undefined, defaut: NiveauQuestionnaire): NiveauQuestionnaire =>
  (NIVEAUX_QUESTIONNAIRE as readonly string[]).includes(v ?? "") ? (v as NiveauQuestionnaire) : defaut;

/** Niveau de questionnaire applicable au dossier. */
export function niveauQuestionnaire(
  categorie: string | null | undefined,
  o: { parametre?: string | null; exigencesSFI?: boolean; complet?: boolean }
): NiveauQuestionnaire {
  if (o.complet || !categorie || categorie === "A" || categorie === "FI") return "complet";
  const n = lireNiveau(o.parametre, "complet");
  return n === "minimum" && o.exigencesSFI ? "standard" : n;
}

/** Un code de section (une lettre : « C ») couvre ses divisions ; sinon le code doit être exact (« D35 » ne couvre pas « D3511R »). */
export function secteurCouvert(codeModule: string, codeSecteur: string): boolean {
  return codeSecteur === codeModule || (codeModule.length === 1 && codeSecteur.startsWith(codeModule));
}

/** Le module est-il retenu pour ce dossier ? Un critère rempli suffit ; une donnée inconnue retient le module. */
export function moduleRetenu(m: DefModule, d: ContexteDossier): boolean {
  const secteurs = codes(m.secteurs), zones = codes(m.zones), natures = codes(m.natures);
  // Critère renseigné dans le module mais donnée inconnue sur le dossier : on retient (prudence).
  if (secteurs.length && (!d.codeSecteur || secteurs.some((s) => secteurCouvert(s, d.codeSecteur!)))) return true;
  if (zones.length && (!d.typeZone || zones.includes(d.typeZone))) return true;
  if (natures.length && (!d.natureProjet || natures.includes(d.natureProjet))) return true;
  if (m.effectifMin != null && (d.effectif === null || d.effectif >= m.effectifMin)) return true;
  if (m.stressHydriqueMin != null && (d.stressHydrique === null || d.stressHydrique >= m.stressHydriqueMin)) return true;
  if (m.equateur && d.equateur) return true;
  // Sans aucun critère, le module est toujours retenu.
  return !secteurs.length && !zones.length && !natures.length && m.effectifMin == null && m.stressHydriqueMin == null && !m.equateur;
}

export function modulesRetenus(modules: DefModule[], d: ContexteDossier): string[] {
  return modules.filter((m) => moduleRetenu(m, d)).map((m) => m.code);
}

/** La question est-elle posée au niveau et avec les modules retenus ? Un module inconnu ne filtre pas. */
export function questionPosee(
  q: { niveau?: string | null; module?: string | null },
  niveau: NiveauQuestionnaire,
  retenus: readonly string[],
  connus: readonly string[]
): boolean {
  if (niveau === "complet") return true;
  if (!NIVEAUX_POSES[niveau].includes(q.niveau ?? "reglementaire")) return false;
  if (q.module && connus.includes(q.module) && !retenus.includes(q.module)) return false;
  return true;
}
