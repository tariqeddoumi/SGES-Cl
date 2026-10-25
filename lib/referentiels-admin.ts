/**
 * Registre des référentiels administrables par l'écran générique
 * Paramétrage › Référentiels. Partagé entre l'API (validation, modèle Prisma) et
 * l'interface (formulaire, colonnes) : ajouter un référentiel = une entrée ici.
 */

export type TypeChamp = "texte" | "libelle" | "libelleLong" | "nombre" | "entier" | "booleen" | "choix" | "echelle" | "codes" | "date";

export interface ChampRef {
  nom: string;
  /** Clé de traduction du libellé du champ. */
  cle: string;
  type: TypeChamp;
  requis?: boolean;
  choix?: string[];
  /** Affiché dans la liste. */
  colonne?: boolean;
  /** Non modifiable après création (identifiant). */
  fige?: boolean;
  min?: number;
  max?: number;
}

export interface DefReferentiel {
  type: string;
  modele: "langue" | "devise" | "tauxChange" | "listeValeur" | "secteur" | "region" | "critereExclusion" | "questionCategorisation" | "thematique" | "bloc";
  cleTitre: string;
  cleDescription: string;
  /** Champ identifiant (clé primaire) ; « id » par défaut. */
  id?: string;
  /** Champ d'activation (actif / active) pour désactiver au lieu de supprimer. */
  actif?: string;
  tri: { champ: string; sens: "asc" | "desc" }[];
  champs: ChampRef[];
  /** Filtre fixe (liste de valeurs : nom de la liste). */
  filtre?: string;
}

const ACTIF: ChampRef = { nom: "actif", cle: "commun.actif", type: "booleen", colonne: true };
const ORDRE: ChampRef = { nom: "ordre", cle: "commun.ordre", type: "entier" };

export const REFERENTIELS: DefReferentiel[] = [
  {
    type: "langues",
    modele: "langue",
    cleTitre: "admin.langues",
    cleDescription: "admin.languesDesc",
    id: "code",
    actif: "active",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "nom", cle: "commun.libelle", type: "texte", requis: true, colonne: true },
      { nom: "nomNatif", cle: "admin.nomNatif", type: "texte", requis: true, colonne: true },
      { nom: "rtl", cle: "admin.rtl", type: "booleen", colonne: true },
      { nom: "active", cle: "commun.actif", type: "booleen", colonne: true },
      ORDRE,
    ],
  },
  {
    type: "devises",
    modele: "devise",
    cleTitre: "admin.devises",
    cleDescription: "admin.devisesDesc",
    id: "code",
    actif: "active",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelle", requis: true, colonne: true },
      { nom: "symbole", cle: "admin.symbole", type: "texte", requis: true, colonne: true },
      { nom: "decimales", cle: "admin.decimales", type: "entier", min: 0, max: 4 },
      { nom: "active", cle: "commun.actif", type: "booleen", colonne: true },
      ORDRE,
    ],
  },
  {
    type: "taux",
    modele: "tauxChange",
    cleTitre: "admin.tauxChange",
    cleDescription: "admin.devisesDesc",
    tri: [{ champ: "date", sens: "desc" }],
    champs: [
      { nom: "deviseCode", cle: "commun.devise", type: "texte", requis: true, colonne: true },
      { nom: "date", cle: "commun.date", type: "date", requis: true, colonne: true },
      { nom: "taux", cle: "admin.tauxChange", type: "nombre", requis: true, colonne: true, min: 0 },
      { nom: "source", cle: "admin.source", type: "texte", colonne: true },
    ],
  },
  {
    type: "listes",
    modele: "listeValeur",
    cleTitre: "admin.listes",
    cleDescription: "admin.listesDesc",
    actif: "actif",
    tri: [{ champ: "liste", sens: "asc" }, { champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "liste", cle: "admin.liste", type: "choix", requis: true, colonne: true, fige: true, choix: ["type_credit", "nature_projet", "type_zone", "comite", "motif_rejet", "type_document", "forme_juridique", "segment"] },
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelle", requis: true, colonne: true },
      ACTIF,
      ORDRE,
    ],
  },
  {
    type: "secteurs",
    modele: "secteur",
    cleTitre: "admin.secteurs",
    cleDescription: "admin.secteursDesc",
    actif: "actif",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelle", requis: true, colonne: true },
      { nom: "categorieIndicative", cle: "admin.categorieIndicative", type: "choix", choix: ["A", "B", "C", "FI"], colonne: true },
      { nom: "risqueTransition", cle: "admin.risqueTransition", type: "echelle", colonne: true },
      { nom: "sensibilitePhysique", cle: "admin.sensibilitePhysique", type: "echelle" },
      { nom: "facteurEmission", cle: "admin.facteurEmission", type: "nombre", min: 0, colonne: true },
      { nom: "exposeCBAM", cle: "admin.exposeCBAM", type: "booleen", colonne: true },
      { nom: "eligibleTaxonomie", cle: "admin.eligibleTaxonomie", type: "booleen" },
      ACTIF,
      ORDRE,
    ],
  },
  {
    type: "regions",
    modele: "region",
    cleTitre: "admin.regions",
    cleDescription: "admin.regionsDesc",
    actif: "actif",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "pays", cle: "client.pays", type: "texte", requis: true, colonne: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelle", requis: true, colonne: true },
      { nom: "stressHydrique", cle: "climat.stressHydrique", type: "echelle", colonne: true },
      { nom: "secheresse", cle: "climat.secheresse", type: "echelle", colonne: true },
      { nom: "inondation", cle: "climat.inondation", type: "echelle", colonne: true },
      { nom: "chaleurExtreme", cle: "climat.chaleurExtreme", type: "echelle", colonne: true },
      { nom: "submersionMarine", cle: "climat.submersionMarine", type: "echelle", colonne: true },
      { nom: "incendie", cle: "climat.incendie", type: "echelle", colonne: true },
      { nom: "seisme", cle: "climat.seisme", type: "echelle", colonne: true },
      { nom: "source", cle: "admin.source", type: "texte" },
      ACTIF,
      ORDRE,
    ],
  },
  {
    type: "exclusion",
    modele: "critereExclusion",
    cleTitre: "admin.exclusion",
    cleDescription: "admin.exclusionDesc",
    actif: "actif",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelleLong", requis: true, colonne: true },
      { nom: "source", cle: "admin.source", type: "texte", requis: true, colonne: true },
      { nom: "bloquant", cle: "admin.bloquant", type: "booleen", colonne: true },
      { nom: "nature", cle: "admin.natureExclusion", type: "choix", choix: ["interdiction_legale", "exclusion_bailleur", "restriction_sectorielle", "politique_groupe"], requis: true, colonne: true },
      { nom: "derogeable", cle: "admin.derogeable", type: "booleen", colonne: true },
      ACTIF,
      ORDRE,
    ],
  },
  {
    type: "categorisation",
    modele: "questionCategorisation",
    cleTitre: "admin.categorisation",
    cleDescription: "admin.categorisationDesc",
    actif: "actif",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, fige: true },
      { nom: "numero", cle: "admin.numero", type: "entier", requis: true, colonne: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelleLong", requis: true, colonne: true },
      { nom: "categorie", cle: "dossier.categorie", type: "choix", choix: ["A", "B", "C", "FI"], requis: true, colonne: true },
      ACTIF,
      ORDRE,
    ],
  },
  {
    type: "thematiques",
    modele: "thematique",
    cleTitre: "admin.thematique",
    cleDescription: "admin.questionnairesDesc",
    actif: "actif",
    tri: [{ champ: "ordre", sens: "asc" }],
    champs: [
      { nom: "code", cle: "commun.code", type: "texte", requis: true, colonne: true, fige: true },
      { nom: "libelle", cle: "commun.libelle", type: "libelle", requis: true, colonne: true },
      { nom: "normes", cle: "evaluation.references", type: "texte", colonne: true },
      ACTIF,
      ORDRE,
    ],
  },
];

export function definition(type: string): DefReferentiel | undefined {
  return REFERENTIELS.find((r) => r.type === type);
}
