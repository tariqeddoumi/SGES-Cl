/**
 * Valeurs codées du domaine SGES.
 *
 * Le schéma de base est portable (aucune énumération SQL) : ces listes sont la seule
 * définition des codes admis. Les libellés affichés viennent des dictionnaires de
 * traduction (lib/i18n), jamais de ces codes.
 */

/** Catégories E&S (SFI) : A > B > C ; FI pour les intermédiaires financiers. */
export const CATEGORIES = ["A", "B", "C", "FI"] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const SOUS_CATEGORIES_FI = ["FI1", "FI2", "FI3"] as const;
export type SousCategorieFI = (typeof SOUS_CATEGORIES_FI)[number];

export const STATUTS = [
  "brouillon",
  "soumis",
  "valide",
  "decide",
  "en_suivi",
  "cloture",
  "annule",
] as const;
export type Statut = (typeof STATUTS)[number];

export const DECISIONS = ["accorde", "rejete", "ajourne"] as const;
export type Decision = (typeof DECISIONS)[number];

export const HORIZONS = ["court", "moyen", "long"] as const;
export type Horizon = (typeof HORIZONS)[number];

export const ORIGINES_ACTION = ["systeme", "eie", "comite", "visite", "manuelle"] as const;
export type OrigineAction = (typeof ORIGINES_ACTION)[number];

export const STATUTS_ACTION = ["a_faire", "en_cours", "realisee", "abandonnee"] as const;
export type StatutAction = (typeof STATUTS_ACTION)[number];

export const NIVEAUX_RISQUE = ["faible", "modere", "eleve", "critique"] as const;
export type NiveauRisque = (typeof NIVEAUX_RISQUE)[number];

export const TYPES_QUESTION = ["oui_non", "oui_non_na", "choix", "nombre", "texte"] as const;
export type TypeQuestion = (typeof TYPES_QUESTION)[number];

export const TYPES_VISITE = ["pre_octroi", "suivi", "cloture", "inopinee"] as const;
export const CONFORMITES = ["conforme", "partielle", "non_conforme"] as const;

export const TYPES_ENTITE = [
  "groupe",
  "banque",
  "banque_regionale",
  "filiale",
  "direction",
  "centre_affaires",
  "agence",
] as const;

/** Aléas climatiques physiques suivis (échelle 0 à 4). */
export const ALEAS = [
  "stressHydrique",
  "secheresse",
  "inondation",
  "chaleurExtreme",
  "submersionMarine",
  "incendie",
  "seisme",
] as const;
export type Alea = (typeof ALEAS)[number];

/** Facteurs de risque de transition (échelle 0 à 4), cadre TCFD / ISSB S2. */
export const FACTEURS_TRANSITION = ["reglementaire", "technologique", "marche", "reputation"] as const;
export type FacteurTransition = (typeof FACTEURS_TRANSITION)[number];

export const ALIGNEMENTS_TAXONOMIE = ["vert", "transition", "non_aligne", "non_eligible"] as const;
export type AlignementTaxonomie = (typeof ALIGNEMENTS_TAXONOMIE)[number];

export const METHODES_EMISSIONS = ["declaree", "estimee_activite", "estimee_secteur"] as const;

/**
 * Étapes du dossier, dans l'ordre de la procédure CFD12340876/0217 (§3), complétées
 * du volet climat (Directive BAM n° 5/W/2021).
 */
export const ETAPES = [
  "identification",
  "exclusion",
  "categorisation",
  "evaluation",
  "climat",
  "plan",
  "fiche",
  "decision",
  "suivi",
] as const;
export type Etape = (typeof ETAPES)[number];

/** Listes de valeurs paramétrables (table sges_listes_valeurs). */
export const LISTES = [
  "forme_juridique",
  "nature_projet",
  "type_credit",
  "type_zone",
  "comite",
  "motif_rejet",
  "type_document",
  "segment",
] as const;
export type Liste = (typeof LISTES)[number];

export function estCategorie(v: unknown): v is Categorie {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
