/**
 * Modules d'activité du questionnaire (codes secteurs exacts ; une lettre de section couvre ses divisions) et marquage des questions (proposition du 26/10/2026,
 * à valider par le Responsable RSE et la Conformité). Sans effet tant que le niveau du
 * questionnaire reste « complet » (paramètres QUESTIONNAIRE_NIVEAU_B et QUESTIONNAIRE_NIVEAU_C).
 */

type L = { fr: string; en: string; ar: string };

export const MODULES: {
  code: string;
  libelle: L;
  secteurs?: string;
  zones?: string;
  natures?: string;
  effectifMin?: number;
  stressHydriqueMin?: number;
  equateur?: boolean;
}[] = [
  {
    code: "M1",
    libelle: { fr: "Rejets liquides industriels", en: "Industrial wastewater", ar: "المقذوفات السائلة الصناعية" },
    secteurs: "A01,A03,B,C10,C11,C13,C17,C19,C20,C2012,C21,C22,C24,C2442,C25,D35,E36,E37,E38,I55",
  },
  {
    code: "M2",
    libelle: { fr: "Émissions atmosphériques", en: "Air emissions", ar: "الانبعاثات في الهواء" },
    secteurs: "B,C10,C17,C19,C20,C2012,C23,C2394,C24,C2442,D35,E38",
  },
  {
    code: "M3",
    libelle: { fr: "Produits et déchets dangereux", en: "Hazardous materials and waste", ar: "المواد والنفايات الخطرة" },
    secteurs: "A01,B,C13,C17,C19,C20,C2012,C21,C22,C24,C2442,C25,C27,C29,C30,D35,D3520H,E38,G4671,H49",
  },
  {
    code: "M4",
    libelle: { fr: "Communautés, foncier et patrimoine", en: "Communities, land and heritage", ar: "الساكنة والعقار والتراث" },
    secteurs: "A02,B,D35,D3511R,D3520H,E36,E37,E38,F41,F42,I55",
    natures: "CREATION,EXTENSION",
  },
  {
    code: "M5",
    libelle: { fr: "Biodiversité et aires protégées", en: "Biodiversity and protected areas", ar: "التنوع البيولوجي والمناطق المحمية" },
    secteurs: "A01,A02,A03,B,D3511R,F42,H50,I55",
    zones: "SENSIBLE,COTIERE,MONTAGNE,OASIS",
  },
  {
    code: "M6",
    libelle: { fr: "Émissions de GES et transition", en: "GHG emissions and transition", ar: "انبعاثات الغازات الدفيئة والانتقال" },
    secteurs: "B,C17,C19,C20,C2012,C2394,C23,C24,C2442,D35,D3520H,G4671,H49,H50,H51",
  },
  {
    code: "M7",
    libelle: { fr: "Nuisances pour les riverains", en: "Nuisances for neighbours", ar: "الإزعاج للساكنة المجاورة" },
    zones: "URBAINE,PERIURBAINE",
  },
  {
    code: "M8",
    libelle: { fr: "Ressource en eau", en: "Water resources", ar: "الموارد المائية" },
    secteurs: "A01,A03,B,C10,C11,C13,C17,E36,I55",
    stressHydriqueMin: 3,
  },
  {
    code: "M9",
    libelle: { fr: "Main-d'œuvre particulière", en: "Specific workforce", ar: "يد عاملة خاصة" },
    secteurs: "A01,B,F41,F42",
    effectifMin: 250,
  },
  {
    code: "M10",
    libelle: { fr: "Terres collectives", en: "Collective lands", ar: "الأراضي السلالية" },
    zones: "RURALE,OASIS,MONTAGNE",
  },
  { code: "E10", libelle: { fr: "Effectif d'au moins 10 salariés", en: "At least 10 employees", ar: "10 أجراء على الأقل" }, effectifMin: 10 },
  { code: "E50", libelle: { fr: "Effectif d'au moins 50 salariés", en: "At least 50 employees", ar: "50 أجيرا على الأقل" }, effectifMin: 50 },
  { code: "EP", libelle: { fr: "Principes de l'Équateur applicables", en: "Equator Principles apply", ar: "مبادئ التعادل مطبقة" }, equateur: true },
];

/** Niveau d'exigence et module déclencheur de chaque question livrée. */
export const MARQUAGE: Record<string, { niveau: "reglementaire" | "interne" | "sfi" | "bonne_pratique"; module?: string }> = {
  SIG01: { niveau: "interne" }, SIG02: { niveau: "bonne_pratique" }, SIG03: { niveau: "bonne_pratique" },
  EFF01: { niveau: "reglementaire", module: "M1" }, EFF02: { niveau: "reglementaire", module: "M1" }, EFF03: { niveau: "sfi", module: "M1" },
  DS01: { niveau: "reglementaire" }, DS02: { niveau: "reglementaire" },
  AIR01: { niveau: "reglementaire", module: "M2" }, AIR02: { niveau: "reglementaire", module: "M2" }, AIR03: { niveau: "sfi", module: "M7" },
  DD01: { niveau: "sfi", module: "M3" }, DD02: { niveau: "reglementaire", module: "M3" }, DD03: { niveau: "reglementaire", module: "M3" },
  URG01: { niveau: "sfi" }, URG02: { niveau: "reglementaire" },
  CERT01: { niveau: "reglementaire" }, CERT02: { niveau: "bonne_pratique" },
  SGE01: { niveau: "interne" }, SGE02: { niveau: "sfi" }, SGE03: { niveau: "reglementaire" },
  RES01: { niveau: "sfi" }, RES02: { niveau: "interne", module: "M8" },
  HN01: { niveau: "sfi", module: "M7" },
  HS01: { niveau: "reglementaire" }, HS02: { niveau: "reglementaire" }, HS03: { niveau: "reglementaire", module: "E50" }, HS04: { niveau: "reglementaire" },
  CT01: { niveau: "reglementaire" }, CT02: { niveau: "sfi" },
  RH01: { niveau: "reglementaire" }, RH02: { niveau: "reglementaire" }, RH03: { niveau: "reglementaire" }, RH04: { niveau: "reglementaire" },
  RH05: { niveau: "reglementaire", module: "E10" }, RH06: { niveau: "sfi" }, RH07: { niveau: "sfi", module: "M9" },
  NP01: { niveau: "sfi" }, NP04: { niveau: "sfi", module: "M4" }, NP05: { niveau: "sfi", module: "M4" }, NP06: { niveau: "sfi", module: "M5" },
  NP07: { niveau: "sfi", module: "M10" }, NP08: { niveau: "sfi", module: "M4" }, NP09: { niveau: "sfi", module: "EP" },
  CL01: { niveau: "interne", module: "M6" }, CL02: { niveau: "reglementaire", module: "M6" }, CL03: { niveau: "sfi", module: "M6" },
  CL04: { niveau: "interne" }, CL05: { niveau: "reglementaire" },
  FI01: { niveau: "interne" }, FI02: { niveau: "sfi" }, FI03: { niveau: "interne" }, FI04: { niveau: "interne" }, FI05: { niveau: "sfi" }, FI06: { niveau: "interne" },
};
