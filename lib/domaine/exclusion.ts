/**
 * Gouvernance de la liste d'exclusion (constat F13 de l'audit).
 *
 * La procédure de 2017 précise que l'inscription sur la liste d'exclusion n'est pas systématiquement
 * suspensive. Chaque critère porte donc une NATURE, par ordre de priorité décroissant :
 *  - interdiction_legale     : interdit par la loi — toujours bloquant, jamais dérogeable ;
 *  - exclusion_bailleur      : exclusion d'un bailleur (SFI, lignes de crédit) — bloquant selon paramétrage ;
 *  - restriction_sectorielle : restriction de la politique sectorielle — dérogation possible ;
 *  - politique_groupe        : politique interne du groupe — dérogation possible.
 * Un critère « bloquant » empêche la soumission, sauf dérogation motivée accordée par une personne
 * habilitée (permission exclusion:deroger), journalisée — impossible pour une interdiction légale.
 */
export const NATURES_EXCLUSION = ["interdiction_legale", "exclusion_bailleur", "restriction_sectorielle", "politique_groupe"] as const;
export type NatureExclusion = (typeof NATURES_EXCLUSION)[number];

export function derogationPossible(c: { bloquant: boolean; derogeable: boolean; nature: string }): boolean {
  return c.bloquant && c.derogeable && c.nature !== "interdiction_legale";
}

/** Un « oui » bloque la soumission si le critère est bloquant (ou interdiction légale) et sans dérogation valable. */
export function reponseBloquante(
  r: { reponse: boolean; derogation?: string | null },
  c: { bloquant: boolean; derogeable: boolean; nature: string; actif?: boolean }
): boolean {
  if (!r.reponse || c.actif === false) return false;
  if (c.nature === "interdiction_legale") return true;
  if (!c.bloquant) return false;
  return !(derogationPossible(c) && !!r.derogation?.trim());
}
