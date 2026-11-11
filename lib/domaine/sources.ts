/**
 * Sources documentaires de la saisie : pour chaque information du dossier (identification,
 * exclusion, catégorisation, questions E&S, volet climat), les documents où on la trouve
 * habituellement, et ce qui ne se constate qu'en visite.
 *
 * Principe « le document d'abord » : l'outil indique où se trouve l'information, propose de
 * charger le document ; l'OCR intelligent le lit et propose la réponse. La saisie directe ne
 * sert que lorsqu'aucun document n'est disponible.
 */

/** Pseudo-source : information constatée sur le site, sans document. */
export const VISITE = "VISITE";

/** Types de documents (liste de valeurs « type_document ») utilisés par la carte des sources. */
export const TYPES_SOURCES = [
  "PRESENTATION", "EIES", "PGES", "ACCEPTABILITE", "AUTORISATION", "PLAN_ACTION", "ENGAGEMENT",
  "CNSS", "RAPPORT_ANALYSES", "DECHETS", "HSE", "PLAN_URGENCE", "POLITIQUE_ES", "RH", "ENERGIE",
  "ASSURANCE", "CERTIFICAT", "FONCIER", "RAPPORT_SUIVI",
] as const;

/** Questions E&S (code) → documents, dans l'ordre de pertinence ; VISITE si le constat sur site compte. */
export const SOURCES_QUESTIONS: Record<string, string[]> = {
  SIG01: ["CNSS", "PRESENTATION"],
  SIG02: ["CNSS", "RH"],
  SIG03: ["PRESENTATION"],
  EFF01: ["EIES", "PRESENTATION", VISITE],
  EFF02: ["AUTORISATION", "RAPPORT_ANALYSES"],
  EFF03: ["RAPPORT_ANALYSES", "PGES"],
  DS01: ["DECHETS", VISITE],
  DS02: ["DECHETS"],
  AIR01: ["EIES", "PRESENTATION", VISITE],
  AIR02: ["RAPPORT_ANALYSES", "EIES"],
  AIR03: ["RAPPORT_ANALYSES", "EIES"],
  DD01: ["HSE", VISITE],
  DD02: ["DECHETS"],
  DD03: ["PRESENTATION", "HSE", VISITE],
  URG01: ["PLAN_URGENCE", "PGES"],
  URG02: ["PLAN_URGENCE", VISITE],
  CERT01: ["ACCEPTABILITE", "AUTORISATION"],
  CERT02: ["CERTIFICAT"],
  SGE01: ["POLITIQUE_ES"],
  SGE02: ["POLITIQUE_ES", "PGES"],
  SGE03: ["EIES", "PGES", "ACCEPTABILITE"],
  RES01: ["ENERGIE", "PGES"],
  RES02: ["AUTORISATION", "EIES"],
  HN01: ["EIES", VISITE],
  HS01: ["HSE"],
  HS02: ["HSE", VISITE],
  HS03: ["HSE", "RH"],
  HS04: ["HSE"],
  CT01: [VISITE],
  CT02: ["HSE"],
  RH01: ["CNSS"],
  RH02: ["RH", "CNSS"],
  RH03: ["RH", "ENGAGEMENT", VISITE],
  RH04: ["RH"],
  RH05: ["RH"],
  RH06: ["RH"],
  RH07: ["PRESENTATION", "RH"],
  NP01: ["EIES"],
  NP04: ["EIES", "PGES"],
  NP05: ["FONCIER", "EIES"],
  NP06: ["EIES"],
  NP07: ["FONCIER", "EIES"],
  NP08: ["EIES"],
  NP09: ["PLAN_ACTION", "PGES", "EIES"],
  CL01: ["ENERGIE"],
  CL02: ["ENERGIE", "PRESENTATION"],
  CL03: ["ENERGIE"],
  CL04: ["EIES", "PRESENTATION"],
  CL05: ["ASSURANCE"],
  FI01: ["POLITIQUE_ES"],
  FI02: ["POLITIQUE_ES", "RAPPORT_SUIVI"],
  FI03: ["RAPPORT_SUIVI"],
  FI04: ["POLITIQUE_ES"],
  FI05: ["RAPPORT_SUIVI"],
  FI06: ["POLITIQUE_ES", "RAPPORT_SUIVI"],
};

/** Champs d'identification → documents. */
export const SOURCES_IDENTIFICATION: Record<string, string[]> = {
  objet: ["PRESENTATION"],
  natureProjet: ["PRESENTATION"],
  descriptionProcessus: ["PRESENTATION", "EIES"],
  montantInvestissement: ["PRESENTATION"],
  dureeMois: ["PRESENTATION"],
  adresseSite: ["PRESENTATION", "AUTORISATION", "EIES"],
  localite: ["PRESENTATION", "AUTORISATION", "EIES"],
  regionId: ["PRESENTATION", "EIES"],
  typeZone: ["EIES", "PRESENTATION"],
  latitude: ["EIES"],
  longitude: ["EIES"],
};

/** Champs du volet climat → documents. */
export const SOURCES_CLIMAT: Record<string, string[]> = {
  scope1: ["ENERGIE"],
  scope2: ["ENERGIE"],
  scope3: ["ENERGIE"],
  sourceEmissions: ["ENERGIE"],
  partRenouvelable: ["ENERGIE", "PRESENTATION"],
  emissionsEvitees: ["ENERGIE", "PRESENTATION"],
  expositionCBAM: ["PRESENTATION", "ENERGIE"],
  partExportUE: ["PRESENTATION"],
  mesuresAdaptation: ["EIES", "PRESENTATION"],
};

/** Volets dont toutes les informations viennent des mêmes documents. */
export const SOURCES_VOLETS: Record<string, string[]> = {
  exclusion: ["PRESENTATION", "EIES"],
  categorisation: ["PRESENTATION", "EIES"],
};

/** Documents où chercher une question (par défaut : la note de présentation). */
export function sourcesQuestion(code: string): string[] {
  return SOURCES_QUESTIONS[code] ?? ["PRESENTATION"];
}

export interface InfoVide {
  /** Identifiant de l'information (code de question, champ…). */
  code: string;
  sources: string[];
}

export interface DocumentUtile {
  type: string;
  /** Nombre d'informations encore vides que ce document permet de renseigner. */
  nb: number;
}

/**
 * Documents à demander au client, classés par nombre d'informations vides qu'ils permettent de
 * renseigner. Un type déjà déposé n'est pas proposé ; la visite n'est pas un document.
 */
export function documentsUtiles(vides: InfoVide[], deposes: Iterable<string>, max = 5): DocumentUtile[] {
  const presents = new Set(deposes);
  const compte = new Map<string, number>();
  for (const v of vides) {
    // Une information déjà couverte par un document déposé n'appelle pas d'autre document.
    if (v.sources.some((s) => presents.has(s))) continue;
    for (const s of new Set(v.sources)) {
      if (s === VISITE) continue;
      compte.set(s, (compte.get(s) ?? 0) + 1);
    }
  }
  return [...compte.entries()]
    .map(([type, nb]) => ({ type, nb }))
    .sort((a, b) => b.nb - a.nb || TYPES_SOURCES.indexOf(a.type as (typeof TYPES_SOURCES)[number]) - TYPES_SOURCES.indexOf(b.type as (typeof TYPES_SOURCES)[number]))
    .slice(0, max);
}

/** Informations constatées seulement en visite (aucun document n'en fait foi). */
export function visiteSeulement(sources: string[]): boolean {
  return sources.length > 0 && sources.every((s) => s === VISITE);
}

// ───────────────────────── Propositions de l'OCR intelligent ─────────────────────────

/** Une valeur proposée par l'OCR intelligent, avec le document et le passage qui la fondent. */
export interface Proposition {
  valeur: string;
  justification?: string | null;
  citation: string | null;
  documentId: string | null;
  documentNom: string | null;
}

/**
 * Dernière lecture des documents, conservée sur le dossier : chaque volet affiche les propositions
 * à côté des champs encore vides ou différents, jusqu'à ce que le chargé les reprenne ou les écarte.
 */
export interface PropositionsDossier {
  lueLe: string;
  modele: string;
  synthese: string;
  /** Documents lus (identifiant → date de dépôt) : un document déposé après est « à lire ». */
  documents: string[];
  identification: Record<string, Proposition>;
  exclusion: Record<string, Proposition>;
  categorisation: Record<string, Proposition>;
  evaluation: Record<string, Proposition>;
  climat: Record<string, Proposition>;
}

export function lirePropositions(texte: string | null | undefined): PropositionsDossier | null {
  if (!texte) return null;
  try {
    const o = JSON.parse(texte) as PropositionsDossier;
    if (!o || typeof o !== "object" || typeof o.lueLe !== "string") return null;
    for (const k of ["identification", "exclusion", "categorisation", "evaluation", "climat"] as const) if (!o[k] || typeof o[k] !== "object") o[k] = {};
    if (!Array.isArray(o.documents)) o.documents = [];
    return o;
  } catch {
    return null;
  }
}

/** Une proposition reste à examiner tant que la valeur enregistrée est vide ou différente. */
export function aExaminer(p: Proposition | undefined, valeurActuelle: string | null | undefined): p is Proposition {
  if (!p) return false;
  const a = (valeurActuelle ?? "").toString().trim().toLowerCase();
  return a === "" || a !== p.valeur.trim().toLowerCase();
}
