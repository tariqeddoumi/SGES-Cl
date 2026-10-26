/**
 * Clauses environnementales et sociales du contrat de crédit (covenants E&S).
 *
 * Pratique des banques marocaines et des lignes de bailleurs (AFD/SUNREF, BERD/MorSEFF, GEFF, BEI,
 * SFI) : la décision du comité est traduite en conditions préalables au décaissement, engagements du
 * client pendant la durée du crédit, obligations de reporting et cas de défaut. Les clauses sont
 * produites à partir du dossier (catégorie, plan d'actions retenu, réserves du comité, pièces, climat,
 * dérogations, ligne de financement) ; le libellé de chaque clause est une clé de traduction
 * « clauses.<code> » avec ses variables. À valider par la direction juridique avant usage contractuel.
 */

export type TypeClause = "condition_prealable" | "engagement" | "reporting" | "defaut";
export const TYPES_CLAUSE: TypeClause[] = ["condition_prealable", "engagement", "reporting", "defaut"];

export interface Clause {
  type: TypeClause;
  code: string;
  vars?: Record<string, string | number>;
}

export interface EntreeClauses {
  categorie: string | null;
  eieRequise: boolean;
  /** Types des pièces déposées (hors canevas). */
  pieces: string[];
  actionsRetenues: { libelle: string; echeance: Date | string | null; horizon: string; statut?: string }[];
  reservesComite?: string | null;
  derogations: { code: string; justification: string }[];
  climat?: { niveau: string | null; alerteTransition: boolean; expositionCBAM: boolean; methodeEmissions: string } | null;
  ligneFinancement?: string | null;
  niveauRisque?: string | null;
  /** Délai de régularisation après mise en demeure (jours). */
  delaiRegularisation?: number;
}

const date = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function genererClauses(e: EntreeClauses): Clause[] {
  const c: Clause[] = [];
  const cat = e.categorie;
  const significatif = cat === "A" || cat === "B";

  // Conditions préalables au premier décaissement
  if (cat === "A" || e.eieRequise) {
    c.push({ type: "condition_prealable", code: "cp_acceptabilite" });
    if (!e.pieces.includes("EIES")) c.push({ type: "condition_prealable", code: "cp_eies" });
  }
  if (significatif && !e.pieces.includes("AUTORISATION")) c.push({ type: "condition_prealable", code: "cp_autorisations" });
  if (e.actionsRetenues.length && !e.pieces.includes("PLAN_ACTION")) c.push({ type: "condition_prealable", code: "cp_plan_signe" });
  if (e.reservesComite?.trim()) c.push({ type: "condition_prealable", code: "cp_reserves", vars: { reserves: e.reservesComite.trim() } });
  for (const d of e.derogations) c.push({ type: "condition_prealable", code: "cp_derogation", vars: { critere: d.code, conditions: d.justification } });

  // Engagements pendant la durée du crédit
  c.push({ type: "engagement", code: "eg_conformite" });
  c.push({ type: "engagement", code: "eg_exclusion" });
  if (e.actionsRetenues.length) {
    c.push({ type: "engagement", code: "eg_plan", vars: { n: e.actionsRetenues.length } });
    const prioritaires = e.actionsRetenues
      .filter((a) => a.statut !== "realisee" && a.statut !== "abandonnee")
      .sort((a, b) => (a.echeance ? +new Date(a.echeance) : Infinity) - (b.echeance ? +new Date(b.echeance) : Infinity))
      .slice(0, 8);
    for (const a of prioritaires) {
      c.push(a.echeance ? { type: "engagement", code: "eg_action", vars: { action: a.libelle, echeance: date(a.echeance) } } : { type: "engagement", code: "eg_action_sans_date", vars: { action: a.libelle } });
    }
  }
  if (significatif) c.push({ type: "engagement", code: "eg_incidents" });
  c.push({ type: "engagement", code: "eg_visites" });
  if (e.climat && (e.climat.alerteTransition || e.climat.niveau === "eleve" || e.climat.niveau === "tres_eleve")) c.push({ type: "engagement", code: "eg_climat" });
  if (e.climat?.expositionCBAM) c.push({ type: "engagement", code: "eg_cbam" });
  if (e.ligneFinancement) c.push({ type: "engagement", code: "eg_ligne", vars: { ligne: e.ligneFinancement } });

  // Reporting
  c.push({ type: "reporting", code: cat === "A" || e.niveauRisque === "eleve" || e.niveauRisque === "critique" ? "rp_semestriel" : "rp_annuel" });
  if (cat === "A" || e.climat?.methodeEmissions === "declaree" || e.climat?.expositionCBAM) c.push({ type: "reporting", code: "rp_emissions" });

  // Cas de défaut
  c.push({ type: "defaut", code: "cd_manquement", vars: { jours: e.delaiRegularisation ?? 60 } });
  if (significatif) c.push({ type: "defaut", code: "cd_incident" });
  return c;
}
