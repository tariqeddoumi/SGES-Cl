/**
 * Données de démarrage : langues, devises, organisation, listes de valeurs.
 * Tout est modifiable ensuite depuis l'écran Paramétrage.
 */
import { CATALOGUES } from "./catalogues";

export const LANGUES = [
  { code: "fr", nom: "Français", nomNatif: "Français", rtl: false, ordre: 1 },
  { code: "en", nom: "Anglais", nomNatif: "English", rtl: false, ordre: 2 },
  { code: "ar", nom: "Arabe", nomNatif: "العربية", rtl: true, ordre: 3 },
];

export const DEVISES = [
  { code: "MAD", libelle: { fr: "Dirham marocain", en: "Moroccan dirham", ar: "الدرهم المغربي" }, symbole: "DH", decimales: 2, ordre: 1 },
  { code: "EUR", libelle: { fr: "Euro", en: "Euro", ar: "اليورو" }, symbole: "€", decimales: 2, ordre: 2 },
  { code: "USD", libelle: { fr: "Dollar américain", en: "US dollar", ar: "الدولار الأمريكي" }, symbole: "$", decimales: 2, ordre: 3 },
  { code: "XOF", libelle: { fr: "Franc CFA (UEMOA)", en: "CFA franc (WAEMU)", ar: "فرنك غرب أفريقيا" }, symbole: "FCFA", decimales: 0, ordre: 4 },
  { code: "XAF", libelle: { fr: "Franc CFA (CEMAC)", en: "CFA franc (CEMAC)", ar: "فرنك وسط أفريقيا" }, symbole: "FCFA", decimales: 0, ordre: 5 },
  { code: "GBP", libelle: { fr: "Livre sterling", en: "Pound sterling", ar: "الجنيه الإسترليني" }, symbole: "£", decimales: 2, ordre: 6 },
  { code: "CHF", libelle: { fr: "Franc suisse", en: "Swiss franc", ar: "الفرنك السويسري" }, symbole: "CHF", decimales: 2, ordre: 7 },
];

/**
 * Cours INDICATIFS (1 unité = n MAD) servant à la démonstration : à remplacer par les
 * cours de la salle des marchés (Paramétrage › Devises, ou import).
 */
export const TAUX_INDICATIFS: { deviseCode: string; taux: number }[] = [
  { deviseCode: "EUR", taux: 10.8 },
  { deviseCode: "USD", taux: 9.35 },
  { deviseCode: "XOF", taux: 10.8 / 655.957 },
  { deviseCode: "XAF", taux: 10.8 / 655.957 },
  { deviseCode: "GBP", taux: 12.6 },
  { deviseCode: "CHF", taux: 11.5 },
];

/** Organisation de démonstration (codes et noms modifiables). */
export const ENTITES: {
  code: string;
  nom: string;
  type: string;
  parent: string | null;
  pays?: string;
  deviseCode?: string;
  langueDefaut?: string;
}[] = [
  { code: "GRP", nom: "Groupe Banque Populaire", type: "groupe", parent: null },
  { code: "BCP", nom: "Banque Centrale Populaire", type: "banque", parent: "GRP" },
  { code: "BCP-BFI", nom: "Banque de Financement et d'Investissement", type: "direction", parent: "BCP" },
  { code: "BCP-CA-CASA", nom: "Centre d'affaires Casablanca Anfa", type: "centre_affaires", parent: "BCP" },
  { code: "BPR-CS", nom: "Banque Populaire Casablanca-Settat", type: "banque_regionale", parent: "GRP" },
  { code: "BPR-CS-CA1", nom: "Centre d'affaires Settat", type: "centre_affaires", parent: "BPR-CS" },
  { code: "BPR-RSK", nom: "Banque Populaire Rabat-Salé-Kénitra", type: "banque_regionale", parent: "GRP" },
  { code: "BPR-RSK-CA1", nom: "Centre d'affaires Kénitra", type: "centre_affaires", parent: "BPR-RSK" },
  { code: "BPR-SM", nom: "Banque Populaire Souss-Massa", type: "banque_regionale", parent: "GRP" },
  { code: "FIL-AFR", nom: "Filiales Afrique", type: "groupe", parent: "GRP" },
  { code: "FIL-CI", nom: "Filiale Côte d'Ivoire", type: "filiale", parent: "FIL-AFR", pays: "CI", deviseCode: "XOF" },
  { code: "FIL-SN", nom: "Filiale Sénégal", type: "filiale", parent: "FIL-AFR", pays: "SN", deviseCode: "XOF" },
];

type L = { fr: string; en: string; ar: string };

export const LISTES_VALEURS: Record<string, { code: string; libelle: L; extra?: Record<string, unknown> }[]> = {
  type_credit: [
    { code: "INV_GE", libelle: { fr: "Crédit d'investissement — Grande entreprise", en: "Investment loan — Large corporate", ar: "قرض استثماري — مقاولة كبرى" }, extra: { investissement: true } },
    { code: "INV_PME", libelle: { fr: "Crédit d'investissement — PME", en: "Investment loan — SME", ar: "قرض استثماري — مقاولة صغرى ومتوسطة" }, extra: { investissement: true } },
    { code: "GRANDS_PROJETS", libelle: { fr: "Financement de grands projets", en: "Large project financing", ar: "تمويل المشاريع الكبرى" }, extra: { investissement: true } },
    { code: "PROJECT_FINANCE", libelle: { fr: "Financement de projet (Project finance)", en: "Project finance", ar: "تمويل المشاريع (Project finance)" }, extra: { investissement: true } },
    { code: "MLT_BPR", libelle: { fr: "Crédit MLT (comité BPR)", en: "Medium/long-term loan (regional committee)", ar: "قرض متوسط/طويل الأجل (لجنة البنك الجهوي)" }, extra: { investissement: true } },
    { code: "LEASING", libelle: { fr: "Crédit-bail d'équipement", en: "Equipment leasing", ar: "الائتمان الإيجاري للمعدات" }, extra: { investissement: true } },
    { code: "FONCT", libelle: { fr: "Crédit de fonctionnement (hors périmètre)", en: "Working capital (out of scope)", ar: "قرض التسيير (خارج النطاق)" }, extra: { investissement: false } },
  ],
  nature_projet: [
    { code: "CREATION", libelle: { fr: "Création", en: "New project (greenfield)", ar: "إحداث" } },
    { code: "EXTENSION", libelle: { fr: "Extension", en: "Extension", ar: "توسعة" } },
    { code: "MODERNISATION", libelle: { fr: "Modernisation / mise à niveau", en: "Modernisation / upgrade", ar: "تحديث / تأهيل" } },
    { code: "RENOUVELLEMENT", libelle: { fr: "Renouvellement d'équipements", en: "Equipment renewal", ar: "تجديد المعدات" } },
    { code: "ACQUISITION", libelle: { fr: "Acquisition / reprise", en: "Acquisition", ar: "اقتناء / استحواذ" } },
    { code: "TRANSITION", libelle: { fr: "Transition énergétique / efficacité", en: "Energy transition / efficiency", ar: "الانتقال الطاقي / النجاعة" } },
  ],
  type_zone: [
    { code: "URBAINE", libelle: { fr: "Zone urbaine", en: "Urban area", ar: "منطقة حضرية" } },
    { code: "PERIURBAINE", libelle: { fr: "Zone périurbaine", en: "Peri-urban area", ar: "منطقة شبه حضرية" } },
    { code: "INDUSTRIELLE", libelle: { fr: "Zone industrielle aménagée", en: "Industrial zone", ar: "منطقة صناعية" } },
    { code: "RURALE", libelle: { fr: "Zone rurale / agricole", en: "Rural / agricultural area", ar: "منطقة قروية / فلاحية" } },
    { code: "COTIERE", libelle: { fr: "Zone côtière / littoral", en: "Coastal area", ar: "منطقة ساحلية" } },
    { code: "SENSIBLE", libelle: { fr: "Zone écologiquement sensible / protégée", en: "Ecologically sensitive / protected area", ar: "منطقة حساسة بيئيا / محمية" } },
    { code: "OASIS", libelle: { fr: "Oasis / zone aride", en: "Oasis / arid area", ar: "واحة / منطقة جافة" } },
    { code: "MONTAGNE", libelle: { fr: "Zone de montagne / forestière", en: "Mountain / forest area", ar: "منطقة جبلية / غابوية" } },
  ],
  comite: [
    { code: "CA", libelle: { fr: "Comité centre d'affaires", en: "Business centre committee", ar: "لجنة مركز الأعمال" } },
    { code: "BPR", libelle: { fr: "Comité de crédit BPR", en: "Regional bank credit committee", ar: "لجنة القروض للبنك الجهوي" } },
    { code: "BCP", libelle: { fr: "Comité de crédit BCP", en: "Central bank credit committee", ar: "لجنة القروض للبنك المركزي الشعبي" } },
    { code: "DIRECTOIRE", libelle: { fr: "Comité de direction / engagements groupe", en: "Group credit committee", ar: "لجنة الالتزامات للمجموعة" } },
  ],
  motif_rejet: [
    { code: "EXCLUSION", libelle: { fr: "Activité figurant sur la liste d'exclusion", en: "Activity on the exclusion list", ar: "نشاط مدرج في لائحة الإقصاء" } },
    { code: "RISQUE_NON_MAITRISE", libelle: { fr: "Risques E&S élevés non maîtrisés", en: "High unmitigated E&S risks", ar: "مخاطر بيئية واجتماعية مرتفعة غير متحكم فيها" } },
    { code: "EIE_ABSENTE", libelle: { fr: "Étude d'impact absente ou non conforme", en: "Missing or non-compliant impact study", ar: "دراسة التأثير غائبة أو غير مطابقة" } },
    { code: "PLAN_REFUSE", libelle: { fr: "Plan d'actions refusé par le client", en: "Action plan refused by client", ar: "رفض الزبون لخطة العمل" } },
    { code: "NON_CONFORMITE", libelle: { fr: "Non-conformité réglementaire (autorisations)", en: "Regulatory non-compliance (permits)", ar: "عدم المطابقة التنظيمية (التراخيص)" } },
    { code: "CLIMAT", libelle: { fr: "Risque climatique jugé excessif", en: "Excessive climate risk", ar: "مخاطر مناخية مفرطة" } },
  ],
  type_document: [
    { code: "PRESENTATION", libelle: { fr: "Note de présentation du projet / étude de faisabilité", en: "Project presentation note / feasibility study", ar: "مذكرة تقديم المشروع / دراسة الجدوى" } },
    { code: "EIES", libelle: { fr: "Étude d'impact environnemental et social (EIES)", en: "Environmental & social impact assessment (ESIA)", ar: "دراسة التأثير البيئي والاجتماعي" } },
    { code: "PGES", libelle: { fr: "Plan de gestion environnementale et sociale (PGES)", en: "Environmental & social management plan (ESMP)", ar: "مخطط التدبير البيئي والاجتماعي" } },
    { code: "ACCEPTABILITE", libelle: { fr: "Décision d'acceptabilité environnementale", en: "Environmental acceptability decision", ar: "قرار القبول البيئي" } },
    { code: "AUTORISATION", libelle: { fr: "Autorisation / permis", en: "Permit / licence", ar: "ترخيص / رخصة" } },
    { code: "PLAN_ACTION", libelle: { fr: "Plan d'actions signé", en: "Signed action plan", ar: "خطة العمل الموقعة" } },
    { code: "ENGAGEMENT", libelle: { fr: "Lettre d'engagement de conformité E&S", en: "E&S compliance commitment letter", ar: "رسالة الالتزام بالمطابقة البيئية والاجتماعية" } },
    { code: "RAPPORT_SUIVI", libelle: { fr: "Rapport de suivi / avancement", en: "Monitoring / progress report", ar: "تقرير التتبع" } },
    { code: "PHOTO", libelle: { fr: "Photo de visite", en: "Site visit photo", ar: "صورة الزيارة" } },
    { code: "CANEVAS", libelle: { fr: "Canevas rempli avec le client", en: "Template completed with the client", ar: "نموذج مملوء مع الزبون" } },
    { code: "AUTRE", libelle: { fr: "Autre", en: "Other", ar: "أخرى" } },
  ],
  /** Lignes de financement / refinancement vert usuelles au Maroc (critères d'éligibilité et reporting propres à chaque bailleur). */
  ligne_financement: [
    { code: "SUNREF", libelle: { fr: "SUNREF Maroc (AFD) — efficacité énergétique, énergies renouvelables, environnement", en: "SUNREF Morocco (AFD) — energy efficiency, renewables, environment", ar: "SUNREF المغرب (الوكالة الفرنسية للتنمية)" } },
    { code: "MORSEFF", libelle: { fr: "MorSEFF (BERD) — énergie durable des entreprises", en: "MorSEFF (EBRD) — sustainable energy financing", ar: "MorSEFF (البنك الأوروبي لإعادة الإعمار والتنمية)" } },
    { code: "GEFF", libelle: { fr: "GEFF (BERD) — économie verte", en: "GEFF (EBRD) — green economy financing facility", ar: "GEFF (البنك الأوروبي) — الاقتصاد الأخضر" } },
    { code: "GVC", libelle: { fr: "Green Value Chain (BERD) — chaînes de valeur vertes", en: "Green Value Chain (EBRD)", ar: "سلاسل القيمة الخضراء (البنك الأوروبي)" } },
    { code: "BEI", libelle: { fr: "Ligne BEI — PME, climat et action pour le climat", en: "EIB credit line — SMEs and climate action", ar: "خط بنك الاستثمار الأوروبي" } },
    { code: "SFI", libelle: { fr: "Ligne SFI / IFC — financement climatique", en: "IFC climate finance line", ar: "خط المؤسسة المالية الدولية للتمويل المناخي" } },
    { code: "OBLIGATION_VERTE", libelle: { fr: "Obligation verte, sociale ou durable de la banque (affectation des fonds)", en: "Bank green, social or sustainability bond (use of proceeds)", ar: "سندات خضراء أو اجتماعية أو مستدامة للبنك" } },
    { code: "FONDS_PROPRES", libelle: { fr: "Ressources propres de la banque", en: "Bank's own resources", ar: "الموارد الذاتية للبنك" } },
  ],
  forme_juridique: [
    { code: "SA", libelle: { fr: "Société anonyme (SA)", en: "Public limited company (SA)", ar: "شركة مساهمة" } },
    { code: "SARL", libelle: { fr: "SARL", en: "Limited liability company (SARL)", ar: "شركة ذات مسؤولية محدودة" } },
    { code: "SARLAU", libelle: { fr: "SARL à associé unique", en: "Single-member LLC", ar: "شركة ذات مسؤولية محدودة بشريك وحيد" } },
    { code: "SAS", libelle: { fr: "Société par actions simplifiée (SAS)", en: "Simplified joint-stock company", ar: "شركة المساهمة المبسطة" } },
    { code: "SNC", libelle: { fr: "Société en nom collectif", en: "General partnership", ar: "شركة التضامن" } },
    { code: "GIE", libelle: { fr: "Groupement d'intérêt économique", en: "Economic interest group", ar: "مجموعة ذات نفع اقتصادي" } },
    { code: "COOP", libelle: { fr: "Coopérative", en: "Cooperative", ar: "تعاونية" } },
    { code: "EP", libelle: { fr: "Établissement public", en: "Public entity", ar: "مؤسسة عمومية" } },
    { code: "PP", libelle: { fr: "Personne physique / entreprise individuelle", en: "Sole proprietorship", ar: "شخص ذاتي / مقاولة فردية" } },
  ],
  segment: [
    { code: "TPE", libelle: { fr: "Très petite entreprise", en: "Micro enterprise", ar: "مقاولة صغيرة جدا" } },
    { code: "PME", libelle: { fr: "Petite et moyenne entreprise", en: "Small and medium enterprise", ar: "مقاولة صغرى ومتوسطة" } },
    { code: "GE", libelle: { fr: "Grande entreprise", en: "Large corporate", ar: "مقاولة كبرى" } },
    { code: "IF", libelle: { fr: "Institution financière", en: "Financial institution", ar: "مؤسسة مالية" } },
  ],
  ...CATALOGUES,
};
