/**
 * Catalogue des paramètres généraux (table sges_parametres).
 *
 * Toute valeur absente de la base prend la valeur par défaut ci-dessous : une base
 * neuve fonctionne sans paramétrage préalable. L'écran Paramétrage › Paramètres
 * généraux est construit à partir de ce catalogue.
 */

export type TypeParametre = "texte" | "nombre" | "booleen" | "choix" | "couleur" | "liste";

export interface DefParametre {
  cle: string;
  groupe: "habillage" | "regles" | "evaluation" | "climat" | "securite" | "integration";
  type: TypeParametre;
  defaut: string;
  /** Valeurs admises pour un paramètre « choix ». */
  choix?: string[];
  /** Diffusé au navigateur (habillage, langue…) ; les autres restent côté serveur. */
  public?: boolean;
}

export const CATALOGUE_PARAMETRES: DefParametre[] = [
  // Habillage
  { cle: "APP_NOM", groupe: "habillage", type: "texte", defaut: "SGES", public: true },
  { cle: "APP_SOUS_TITRE", groupe: "habillage", type: "texte", defaut: "Gestion environnementale, sociale et climatique", public: true },
  { cle: "APP_LOGO_URL", groupe: "habillage", type: "texte", defaut: "", public: true },
  { cle: "COULEUR_PRIMAIRE", groupe: "habillage", type: "couleur", defaut: "", public: true },
  { cle: "THEME", groupe: "habillage", type: "choix", defaut: "clair", choix: ["clair", "sombre"], public: true },
  { cle: "LANGUE_DEFAUT", groupe: "habillage", type: "texte", defaut: "fr", public: true },

  // Règles de gestion (circulaire CFD-537/01-24, CDC SGES)
  { cle: "DEVISE_REFERENCE", groupe: "regles", type: "texte", defaut: "MAD", public: true },
  { cle: "SEUIL_DECLENCHEMENT", groupe: "regles", type: "nombre", defaut: "10000000", public: true },
  { cle: "PREFIXE_REFERENCE", groupe: "regles", type: "texte", defaut: "SGES" },
  { cle: "SEPARATION_FONCTIONS", groupe: "regles", type: "booleen", defaut: "true" },
  { cle: "EXCLUSION_NOTIFIER_RSE", groupe: "regles", type: "booleen", defaut: "true" },
  { cle: "CATEGORIE_A_NOTIFIER_RSE", groupe: "regles", type: "booleen", defaut: "true" },
  { cle: "EIE_OBLIGATOIRE_CATEGORIE_A", groupe: "regles", type: "booleen", defaut: "true" },
  { cle: "PRESEANCE_CATEGORIES", groupe: "regles", type: "texte", defaut: "A,B,FI,C", public: true },
  { cle: "DELAI_DECISION_JOURS", groupe: "regles", type: "nombre", defaut: "60", public: true },
  { cle: "DELAI_VISITE_MOIS", groupe: "regles", type: "nombre", defaut: "12" },

  // Évaluation
  { cle: "SEUILS_NIVEAU_RISQUE", groupe: "evaluation", type: "texte", defaut: "15,35,60", public: true },
  { cle: "RELEVER_NIVEAU_CATEGORIE_A", groupe: "evaluation", type: "booleen", defaut: "true", public: true },
  { cle: "COMMENTAIRE_EVALUATION_OBLIGATOIRE", groupe: "evaluation", type: "booleen", defaut: "true" },

  // Climat
  { cle: "VOLET_CLIMAT_ACTIF", groupe: "climat", type: "booleen", defaut: "true", public: true },
  { cle: "VOLET_CLIMAT_OBLIGATOIRE", groupe: "climat", type: "booleen", defaut: "true" },

  // Sécurité
  { cle: "SESSION_HEURES", groupe: "securite", type: "nombre", defaut: "10" },
  { cle: "TENTATIVES_MAX", groupe: "securite", type: "nombre", defaut: "5" },
  { cle: "VERROUILLAGE_MINUTES", groupe: "securite", type: "nombre", defaut: "15" },

  // Intégration
  { cle: "SIGNALETIQUE_MODE", groupe: "integration", type: "choix", defaut: "simulation", choix: ["simulation", "api", "desactive"] },
  { cle: "IA_ACTIVE", groupe: "integration", type: "booleen", defaut: "false", public: true },
  { cle: "IA_MODELE", groupe: "integration", type: "texte", defaut: "claude-opus-5-5" },
];

export type Parametres = Record<string, string>;

export function valeursParDefaut(): Parametres {
  return Object.fromEntries(CATALOGUE_PARAMETRES.map((p) => [p.cle, p.defaut]));
}

export function nombre(p: Parametres, cle: string, defaut = 0): number {
  const n = Number(p[cle]);
  return Number.isFinite(n) ? n : defaut;
}

export function booleen(p: Parametres, cle: string): boolean {
  return p[cle] === "true";
}

export function valeurValide(def: DefParametre, valeur: string): boolean {
  switch (def.type) {
    case "nombre":
      return valeur.trim() !== "" && Number.isFinite(Number(valeur));
    case "booleen":
      return valeur === "true" || valeur === "false";
    case "choix":
      return !!def.choix?.includes(valeur);
    case "couleur":
      return valeur === "" || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valeur);
    default:
      return valeur.length <= 2000;
  }
}
