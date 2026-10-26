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
  // Dérogation motivée à un critère d'exclusion bloquant (hors interdiction légale)
  "exclusion:deroger",
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
      "exclusion:deroger",
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
      "exclusion:deroger",
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
    permissions: ["dossier:lire", "reporting:lire", "reporting:exporter", "audit:lire", "climat:lire"],
  },
  {
    code: "lecture",
    libelle: { fr: "Consultation", en: "Read only", ar: "اطلاع فقط" },
    permissions: ["dossier:lire"],
  },
];

/**
 * Permission exigée pour ouvrir un écran : la même que celle de l'API qui l'alimente. Le menu
 * masque déjà ces écrans ; ce contrôle couvre l'accès par l'adresse (lien, favori) avec un
 * message clair plutôt qu'un écran vide. L'API reste le contrôle de sécurité.
 * Le préfixe le plus long l'emporte.
 */
const PERMISSIONS_ECRANS: [string, Permission | "admin:*"][] = [
  ["/dossiers", "dossier:lire"],
  ["/dossiers/nouveau", "dossier:creer"],
  ["/clients", "dossier:lire"],
  ["/plans-action", "dossier:lire"],
  ["/visites", "dossier:lire"],
  ["/reporting", "reporting:lire"],
  ["/climat", "climat:lire"],
  ["/audit", "audit:lire"],
  ["/admin", "admin:*"],
  ["/admin/parametres", "admin:parametres"],
  ["/admin/entites", "admin:entites"],
  ["/admin/utilisateurs", "admin:utilisateurs"],
  ["/admin/roles", "admin:utilisateurs"],
  ["/admin/questionnaires", "admin:referentiels"],
  ["/admin/referentiels", "admin:referentiels"],
  ["/admin/api", "admin:api"],
  ["/admin/base", "admin:base"],
];

export function ecranAutorise(chemin: string, permissions: readonly string[] | undefined): boolean {
  const regle = PERMISSIONS_ECRANS.filter(([prefixe]) => chemin === prefixe || chemin.startsWith(prefixe + "/")).sort((a, b) => b[0].length - a[0].length)[0];
  if (!regle) return true;
  if (regle[1] === "admin:*") return !!permissions?.some((p) => p.startsWith("admin:"));
  return aPermission(permissions, regle[1]);
}
