/**
 * Permissions de l'outil. Les rôles sont paramétrables (table sges_roles) : chacun
 * porte une liste de ces permissions, éditable depuis Paramétrage › Rôles.
 * Cette liste est la seule définition des permissions reconnues.
 */
export const PERMISSIONS = [
  // Dossiers SGES
  "dossier:lire",
  "dossier:creer",
  "dossier:modifier",
  "dossier:soumettre",
  "dossier:valider",
  "dossier:decider",
  "dossier:reclassifier",
  "dossier:cloturer",
  "dossier:supprimer",
  // Suivi
  "plan:suivre",
  "visite:gerer",
  "client:gerer",
  // Pilotage
  "reporting:lire",
  "reporting:exporter",
  "climat:lire",
  "audit:lire",
  // Destinataire des notifications réglementaires (Responsable Social et Environnemental)
  "notification:rse",
  // Administration
  "admin:referentiels",
  "admin:parametres",
  "admin:utilisateurs",
  "admin:entites",
  "admin:api",
  "admin:base",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const GROUPES_PERMISSIONS: { groupe: string; permissions: Permission[] }[] = [
  {
    groupe: "dossiers",
    permissions: [
      "dossier:lire",
      "dossier:creer",
      "dossier:modifier",
      "dossier:soumettre",
      "dossier:valider",
      "dossier:decider",
      "dossier:reclassifier",
      "dossier:cloturer",
      "dossier:supprimer",
    ],
  },
  { groupe: "suivi", permissions: ["plan:suivre", "visite:gerer", "client:gerer"] },
  {
    groupe: "pilotage",
    permissions: ["reporting:lire", "reporting:exporter", "climat:lire", "audit:lire", "notification:rse"],
  },
  {
    groupe: "administration",
    permissions: ["admin:referentiels", "admin:parametres", "admin:utilisateurs", "admin:entites", "admin:api", "admin:base"],
  },
];

export function lirePermissions(texte: string | null | undefined): Permission[] {
  try {
    const l = JSON.parse(texte ?? "[]");
    return Array.isArray(l) ? l.filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p)) : [];
  } catch {
    return [];
  }
}

export function aPermission(permissions: readonly string[] | undefined, p: Permission): boolean {
  return !!permissions && permissions.includes(p);
}

/** Rôles livrés (procédure CFD12340876/0217, « Rôles & responsabilités », et circulaire CFD-537/01-24). */
export const ROLES_DEFAUT: { code: string; libelle: Record<string, string>; permissions: Permission[] }[] = [
  {
    code: "admin_systeme",
    libelle: { fr: "Administrateur système", en: "System administrator", ar: "مدير النظام" },
    permissions: [...PERMISSIONS],
  },
  {
    code: "responsable_rse",
    libelle: {
      fr: "Responsable Social et Environnemental",
      en: "Environmental & Social Officer",
      ar: "المسؤول الاجتماعي والبيئي",
    },
    permissions: [
      "dossier:lire",
      "dossier:reclassifier",
      "plan:suivre",
      "visite:gerer",
      "reporting:lire",
      "reporting:exporter",
      "climat:lire",
      "audit:lire",
      "notification:rse",
      "admin:referentiels",
    ],
  },
  {
    code: "charge_affaires",
    libelle: {
      fr: "Chargé d'affaires / clientèle / Analyste",
      en: "Relationship manager / Analyst",
      ar: "مكلف بالأعمال / محلل",
    },
    permissions: [
      "dossier:lire",
      "dossier:creer",
      "dossier:modifier",
      "dossier:soumettre",
      "dossier:decider",
      "plan:suivre",
      "visite:gerer",
      "client:gerer",
      "reporting:lire",
    ],
  },
  {
    code: "directeur_ca",
    libelle: {
      fr: "Directeur centre d'affaires / succursale",
      en: "Business centre / branch director",
      ar: "مدير مركز الأعمال / الفرع",
    },
    permissions: [
      "dossier:lire",
      "dossier:valider",
      "dossier:decider",
      "dossier:cloturer",
      "plan:suivre",
      "visite:gerer",
      "reporting:lire",
      "reporting:exporter",
      "climat:lire",
    ],
  },
  {
    code: "risques",
    libelle: { fr: "Fonction Risques Groupe", en: "Group Risk function", ar: "وظيفة المخاطر للمجموعة" },
    permissions: ["dossier:lire", "reporting:lire", "reporting:exporter", "climat:lire", "audit:lire"],
  },
  {
    code: "comite_credit",
    libelle: { fr: "Comité de crédit", en: "Credit committee", ar: "لجنة القروض" },
    permissions: ["dossier:lire", "dossier:decider", "reporting:lire"],
  },
  {
    code: "auditeur",
    libelle: { fr: "Contrôle / Audit", en: "Control / Audit", ar: "المراقبة / التدقيق" },
    permissions: ["dossier:lire", "reporting:lire", "audit:lire", "climat:lire"],
  },
  {
    code: "lecture",
    libelle: { fr: "Consultation", en: "Read only", ar: "اطلاع فقط" },
    permissions: ["dossier:lire"],
  },
];
