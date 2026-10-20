import type { Permission } from "../permissions";
import type { Statut } from "./constantes";

/**
 * Circuit d'un dossier SGES (procédure CFD12340876/0217, §2 logigramme) :
 *
 *   brouillon ──soumettre──▶ soumis ──valider (verrou)──▶ valide ──décision comité──▶ decide
 *       ▲                      │                                                       │
 *       └──────retourner───────┘                                    plan retenu ▼      │
 *                                                                          en_suivi ──clôturer──▶ cloture
 *
 * Le Directeur valide et verrouille le dossier « pour empêcher toute modification en
 * attendant la décision du comité » ; la décision est ensuite reportée (montant accordé
 * ou motif de rejet E&S). Les réserves du comité rouvrent le plan d'actions.
 */

export type Transition =
  | "soumettre"
  | "retourner"
  | "valider"
  | "decider"
  | "demarrer_suivi"
  | "cloturer"
  | "annuler"
  | "rouvrir";

export const TRANSITIONS: Record<Transition, { de: Statut[]; vers: Statut; permission: Permission; commentaireObligatoire?: boolean }> = {
  soumettre: { de: ["brouillon"], vers: "soumis", permission: "dossier:soumettre" },
  retourner: { de: ["soumis", "valide"], vers: "brouillon", permission: "dossier:valider", commentaireObligatoire: true },
  valider: { de: ["soumis"], vers: "valide", permission: "dossier:valider" },
  decider: { de: ["valide"], vers: "decide", permission: "dossier:decider" },
  demarrer_suivi: { de: ["decide"], vers: "en_suivi", permission: "plan:suivre" },
  cloturer: { de: ["decide", "en_suivi"], vers: "cloture", permission: "dossier:cloturer" },
  annuler: { de: ["brouillon", "soumis"], vers: "annule", permission: "dossier:modifier", commentaireObligatoire: true },
  rouvrir: { de: ["cloture"], vers: "en_suivi", permission: "dossier:cloturer", commentaireObligatoire: true },
};

export function transitionsPossibles(statut: string, permissions: readonly string[]): Transition[] {
  return (Object.keys(TRANSITIONS) as Transition[]).filter((t) => {
    const def = TRANSITIONS[t];
    return (def.de as string[]).includes(statut) && permissions.includes(def.permission);
  });
}

/** Les volets d'évaluation (identification à climat) ne se modifient qu'en brouillon. */
export function evaluationModifiable(statut: string): boolean {
  return statut === "brouillon";
}

/**
 * Le plan d'actions se négocie en brouillon, puis se suit après la décision (avancement,
 * réserves du comité). Il est figé pendant la validation et une fois le dossier clos.
 */
export function planModifiable(statut: string): boolean {
  return statut === "brouillon" || statut === "decide" || statut === "en_suivi";
}

export function visitesModifiables(statut: string): boolean {
  return statut !== "annule" && statut !== "cloture";
}

export interface ControleSoumission {
  identification: boolean;
  exclusion: boolean;
  categorisation: boolean;
  evaluation: boolean;
  climat: boolean;
  plan: boolean;
  /** Critère d'exclusion bloquant coché. */
  exclusionBloquante: boolean;
  /** Pièce EIE/EIES jointe (obligatoire en catégorie A si le paramètre l'exige). */
  eie: boolean;
}

/** Motifs qui empêchent la soumission (liste vide : soumission possible). */
export function motifsBlocageSoumission(c: ControleSoumission, options: { climatObligatoire: boolean; eieObligatoire: boolean }): string[] {
  const motifs: string[] = [];
  if (!c.identification) motifs.push("identification");
  if (!c.exclusion) motifs.push("exclusion");
  if (c.exclusionBloquante) motifs.push("exclusion_bloquante");
  if (!c.categorisation) motifs.push("categorisation");
  if (!c.evaluation) motifs.push("evaluation");
  if (options.climatObligatoire && !c.climat) motifs.push("climat");
  if (!c.plan) motifs.push("plan");
  if (options.eieObligatoire && !c.eie) motifs.push("eie");
  return motifs;
}
