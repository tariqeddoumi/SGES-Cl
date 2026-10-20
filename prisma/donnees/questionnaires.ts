/**
 * Check-lists d'évaluation E&S par catégorie (procédure CFD12340876/0217, §3.4, annexes 3 à 6)
 * et actions correctives générées automatiquement (§3.5).
 *
 * Structure des questionnaires prévue par la procédure :
 *  - A  : signalétique, gestion environnementale, conformité aux normes de performance SFI
 *         (complétés ici par l'hygiène-sécurité, les RH et le climat, comme l'exigent les NP2 et NP3) ;
 *  - B  : signalétique, gestion environnementale (blocs 1 à 7), hygiène et sécurité, RH, SFI ;
 *  - C  : signalétique, urgence, certifications, système de gestion, hygiène et sécurité, RH ;
 *  - FI : signalétique, description de l'activité, engagement stratégique.
 *
 * Les questions portent sur les « mesures de contrôle et de gestion » : « Non » signale un
 * risque non maîtrisé (plan d'action), « Oui » un risque maîtrisé, « Sans objet » une
 * problématique qui ne concerne pas le client. Quelques questions décrivent une nuisance
 * (« Existe-t-il des émissions de particules ? ») : c'est alors « Oui » qui déclenche l'action,
 * comme dans l'exemple de la procédure.
 *
 * Références : Normes de performance SFI 2012 (NP1 à NP8), Directives EHS du Groupe Banque
 * mondiale, Principes de l'Équateur IV (2020), conventions fondamentales de l'OIT,
 * Code du travail (loi 65-99), loi 49-17 relative à l'évaluation environnementale (ex-loi 12-03),
 * loi 11-03 (protection de l'environnement), loi 36-15 (eau), loi 28-00 (déchets),
 * loi 13-03 (air), loi 47-09 (efficacité énergétique), loi 22-07 (aires protégées),
 * loi 110-14 (événements catastrophiques), Directive BAM n° 5/W/2021 (risques climatiques).
 */

type L = { fr: string; en: string; ar: string };

export const THEMATIQUES: { code: string; libelle: L; normes: string }[] = [
  { code: "SIGNALETIQUE", libelle: { fr: "Signalétique de l'entreprise", en: "Company profile", ar: "البطاقة التعريفية للمقاولة" }, normes: "" },
  { code: "GEST_ENV", libelle: { fr: "Gestion environnementale", en: "Environmental management", ar: "التدبير البيئي" }, normes: "SFI NP1, NP3 ; lois 11-03, 49-17, 36-15, 28-00, 13-03" },
  { code: "HSE", libelle: { fr: "Hygiène et sécurité", en: "Health and safety", ar: "الصحة والسلامة" }, normes: "SFI NP2, NP4 ; Code du travail (livre II, titre IV)" },
  { code: "RH", libelle: { fr: "Gestion des ressources humaines", en: "Human resources management", ar: "تدبير الموارد البشرية" }, normes: "SFI NP2 ; Code du travail ; conventions fondamentales OIT" },
  { code: "SFI", libelle: { fr: "Conformité aux normes de performance de la SFI", en: "Compliance with IFC Performance Standards", ar: "المطابقة لمعايير الأداء لمؤسسة التمويل الدولية" }, normes: "SFI NP1 à NP8 ; Principes de l'Équateur IV" },
  { code: "CLIMAT", libelle: { fr: "Climat et énergie", en: "Climate and energy", ar: "المناخ والطاقة" }, normes: "SFI NP3 ; PE IV ; Directive BAM 5/W/2021 ; loi 47-09" },
  { code: "FI_ACTIVITE", libelle: { fr: "Description de l'activité (intermédiaire financier)", en: "Business description (financial intermediary)", ar: "وصف النشاط (وسيط مالي)" }, normes: "SFI NP1 (intermédiaires financiers)" },
  { code: "FI_ENGAGEMENT", libelle: { fr: "Engagement stratégique", en: "Strategic commitment", ar: "الالتزام الاستراتيجي" }, normes: "SFI NP1 ; Directive BAM 5/W/2021" },
];

export const BLOCS: { code: string; thematique: string; libelle: L }[] = [
  { code: "SIG", thematique: "SIGNALETIQUE", libelle: { fr: "Signalétique", en: "Profile", ar: "البطاقة التعريفية" } },
  { code: "ENV_EFF", thematique: "GEST_ENV", libelle: { fr: "Bloc 1 — Effluents liquides", en: "Block 1 — Liquid effluents", ar: "المجموعة 1 — المقذوفات السائلة" } },
  { code: "ENV_DECH", thematique: "GEST_ENV", libelle: { fr: "Bloc 2 — Déchets solides", en: "Block 2 — Solid waste", ar: "المجموعة 2 — النفايات الصلبة" } },
  { code: "ENV_AIR", thematique: "GEST_ENV", libelle: { fr: "Bloc 3 — Émissions gazeuses et bruit", en: "Block 3 — Air emissions and noise", ar: "المجموعة 3 — الانبعاثات الغازية والضجيج" } },
  { code: "ENV_DD", thematique: "GEST_ENV", libelle: { fr: "Bloc 4 — Déchets et produits dangereux", en: "Block 4 — Hazardous waste and materials", ar: "المجموعة 4 — النفايات والمواد الخطرة" } },
  { code: "ENV_URG", thematique: "GEST_ENV", libelle: { fr: "Bloc 5 — Préparation aux situations d'urgence", en: "Block 5 — Emergency preparedness", ar: "المجموعة 5 — الاستعداد لحالات الطوارئ" } },
  { code: "ENV_CERT", thematique: "GEST_ENV", libelle: { fr: "Bloc 6 — Certifications et autorisations", en: "Block 6 — Certifications and permits", ar: "المجموعة 6 — الشهادات والتراخيص" } },
  { code: "ENV_SGES", thematique: "GEST_ENV", libelle: { fr: "Bloc 7 — Système de gestion sociale et environnementale", en: "Block 7 — Environmental and social management system", ar: "المجموعة 7 — نظام التدبير البيئي والاجتماعي" } },
  { code: "ENV_RES", thematique: "GEST_ENV", libelle: { fr: "Bloc 8 — Ressources en eau et énergie", en: "Block 8 — Water and energy resources", ar: "المجموعة 8 — الموارد المائية والطاقية" } },
  { code: "HSE_NUIS", thematique: "HSE", libelle: { fr: "Existence de nuisances", en: "Nuisances", ar: "وجود الإزعاجات" } },
  { code: "HSE_MES", thematique: "HSE", libelle: { fr: "Mesures d'hygiène et de sécurité", en: "Health and safety measures", ar: "تدابير الصحة والسلامة" } },
  { code: "HSE_COND", thematique: "HSE", libelle: { fr: "Conditions de travail", en: "Working conditions", ar: "ظروف العمل" } },
  { code: "RH_EMP", thematique: "RH", libelle: { fr: "Conditions d'emploi et droits fondamentaux", en: "Employment conditions and core labour rights", ar: "ظروف التشغيل والحقوق الأساسية" } },
  { code: "SFI_NP", thematique: "SFI", libelle: { fr: "Normes de performance SFI et Principes de l'Équateur", en: "IFC Performance Standards and Equator Principles", ar: "معايير الأداء ومبادئ التعادل" } },
  { code: "CLI_GES", thematique: "CLIMAT", libelle: { fr: "Émissions de gaz à effet de serre et énergie", en: "Greenhouse gas emissions and energy", ar: "انبعاثات الغازات الدفيئة والطاقة" } },
  { code: "CLI_ADA", thematique: "CLIMAT", libelle: { fr: "Adaptation aux risques climatiques physiques", en: "Adaptation to physical climate risks", ar: "التكيف مع المخاطر المناخية المادية" } },
  { code: "FI_ACT", thematique: "FI_ACTIVITE", libelle: { fr: "Portefeuille et politique E&S", en: "Portfolio and E&S policy", ar: "المحفظة والسياسة البيئية والاجتماعية" } },
  { code: "FI_ENG", thematique: "FI_ENGAGEMENT", libelle: { fr: "Gouvernance et engagement", en: "Governance and commitment", ar: "الحكامة والالتزام" } },
];

export interface DonneeQuestion {
  code: string;
  bloc: string;
  categories: string;
  type?: "oui_non" | "oui_non_na" | "nombre" | "texte";
  risque?: string | null;
  gravite?: number;
  references?: string;
  libelle: L;
  aide?: L;
  obligatoire?: boolean;
  actions?: { horizon: "court" | "moyen" | "long"; delaiMois?: number; libelle: L }[];
}

export const QUESTIONS: DonneeQuestion[] = [
  // ─── Signalétique (descriptif, sans incidence sur le score) ─────────────────
  {
    code: "SIG01", bloc: "SIG", categories: "A,B,C,FI", type: "nombre", risque: null, obligatoire: true,
    libelle: { fr: "Effectif total (salariés permanents et temporaires)", en: "Total workforce (permanent and temporary)", ar: "العدد الإجمالي للأجراء (الدائمين والمؤقتين)" },
  },
  {
    code: "SIG02", bloc: "SIG", categories: "A,B,C,FI", type: "nombre", risque: null, obligatoire: false,
    libelle: { fr: "Part des femmes dans l'effectif (%)", en: "Share of women in the workforce (%)", ar: "نسبة النساء من مجموع الأجراء (%)" },
  },
  {
    code: "SIG03", bloc: "SIG", categories: "A,B,C,FI", type: "texte", risque: null, obligatoire: false,
    libelle: { fr: "Activités sous-traitées et principaux sous-traitants", en: "Subcontracted activities and main subcontractors", ar: "الأنشطة المناولة وأهم المناولين" },
  },

  // ─── Bloc 1 : effluents liquides ────────────────────────────────────────────
  {
    code: "EFF01", bloc: "ENV_EFF", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "SFI NP3 ; Directives EHS générales §1.3 ; loi 36-15 sur l'eau",
    libelle: {
      fr: "Les effluents liquides (eaux de procédé, de lavage, sanitaires) sont-ils collectés séparément et traités avant rejet ?",
      en: "Are liquid effluents (process, washing and sanitary water) collected separately and treated before discharge?",
      ar: "هل يتم جمع المقذوفات السائلة (مياه المعالجة والغسل والصرف الصحي) بشكل منفصل ومعالجتها قبل تصريفها؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place une collecte séparative et un prétraitement des effluents avant rejet", en: "Set up separate collection and pre-treatment of effluents before discharge", ar: "إرساء نظام جمع منفصل ومعالجة أولية للمقذوفات قبل تصريفها" } },
      { horizon: "moyen", delaiMois: 18, libelle: { fr: "Installer une station de traitement des eaux usées dimensionnée pour l'activité", en: "Install a wastewater treatment plant sized for the activity", ar: "إنشاء محطة لمعالجة المياه العادمة ملائمة لحجم النشاط" } },
    ],
  },
  {
    code: "EFF02", bloc: "ENV_EFF", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "Loi 36-15 (autorisation de déversement) ; valeurs limites sectorielles",
    libelle: {
      fr: "Le rejet dispose-t-il d'une autorisation de déversement de l'Agence de bassin hydraulique et respecte-t-il les valeurs limites ?",
      en: "Does the discharge have a permit from the River Basin Agency and comply with discharge limits?",
      ar: "هل يتوفر التصريف على ترخيص من وكالة الحوض المائي ويحترم القيم القصوى للتصريف؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Déposer la demande d'autorisation de déversement auprès de l'Agence de bassin hydraulique", en: "File a discharge permit application with the River Basin Agency", ar: "إيداع طلب ترخيص التصريف لدى وكالة الحوض المائي" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place un autocontrôle semestriel des rejets par un laboratoire agréé", en: "Implement half-yearly self-monitoring of discharges by an accredited laboratory", ar: "إرساء مراقبة ذاتية نصف سنوية للمقذوفات من طرف مختبر معتمد" } },
    ],
  },
  {
    code: "EFF03", bloc: "ENV_EFF", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 2,
    references: "SFI NP3 ; Directives EHS",
    libelle: {
      fr: "Des analyses périodiques des rejets liquides sont-elles réalisées et archivées ?",
      en: "Are periodic analyses of liquid discharges performed and recorded?",
      ar: "هل يتم إجراء تحاليل دورية للمقذوفات السائلة وأرشفتها؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Réaliser une campagne d'analyses des rejets liquides par un laboratoire agréé", en: "Carry out a liquid discharge sampling campaign by an accredited laboratory", ar: "إجراء حملة تحاليل للمقذوفات السائلة من طرف مختبر معتمد" } },
    ],
  },

  // ─── Bloc 2 : déchets solides ───────────────────────────────────────────────
  {
    code: "DS01", bloc: "ENV_DECH", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 2,
    references: "Loi 28-00 relative à la gestion des déchets ; SFI NP3",
    libelle: {
      fr: "Les déchets solides non dangereux sont-ils triés, stockés sur une aire dédiée et évacués par un collecteur autorisé ?",
      en: "Is non-hazardous solid waste sorted, stored in a dedicated area and removed by an authorised collector?",
      ar: "هل يتم فرز النفايات الصلبة غير الخطرة وتخزينها في مكان مخصص وإزالتها من طرف جامع مرخص؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Aménager une aire de stockage des déchets et contractualiser avec un collecteur autorisé", en: "Set up a waste storage area and contract an authorised collector", ar: "تهيئة مكان لتخزين النفايات والتعاقد مع جامع مرخص" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place un plan de réduction et de valorisation des déchets (recyclage, réemploi)", en: "Implement a waste reduction and recovery plan (recycling, reuse)", ar: "وضع مخطط لتقليص النفايات وتثمينها (إعادة التدوير وإعادة الاستعمال)" } },
    ],
  },
  {
    code: "DS02", bloc: "ENV_DECH", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 1,
    references: "Loi 28-00",
    libelle: {
      fr: "Un registre des quantités de déchets produits et éliminés est-il tenu ?",
      en: "Is a register of waste quantities generated and disposed of maintained?",
      ar: "هل يتم مسك سجل لكميات النفايات المنتجة والمتخلص منها؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Tenir un registre des déchets (nature, quantités, destination)", en: "Keep a waste register (type, quantity, destination)", ar: "مسك سجل للنفايات (النوع، الكمية، الوجهة)" } },
    ],
  },

  // ─── Bloc 3 : émissions gazeuses et bruit ──────────────────────────────────
  {
    code: "AIR01", bloc: "ENV_AIR", categories: "A,B", type: "oui_non", risque: "oui", gravite: 2,
    references: "Loi 13-03 relative à la lutte contre la pollution de l'air ; SFI NP3",
    libelle: {
      fr: "Existe-t-il des émissions de particules en suspension ou de fumées ?",
      en: "Are there emissions of suspended particulates or fumes?",
      ar: "هل توجد انبعاثات للجسيمات العالقة أو الأدخنة؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place des dispositifs de captage des particules", en: "Install particulate capture devices", ar: "تركيب أجهزة لالتقاط الجسيمات" } },
      { horizon: "moyen", delaiMois: 18, libelle: { fr: "Étudier l'opportunité de réduire les émissions de particules", en: "Study options to reduce particulate emissions", ar: "دراسة إمكانية تقليص انبعاثات الجسيمات" } },
    ],
  },
  {
    code: "AIR02", bloc: "ENV_AIR", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "Loi 13-03 ; décret 2-09-631 (valeurs limites) ; Directives EHS §1.1",
    libelle: {
      fr: "Les sources d'émission (cheminées, chaudières, fours) sont-elles équipées de dispositifs de traitement et contrôlées périodiquement ?",
      en: "Are emission sources (stacks, boilers, kilns) fitted with abatement devices and periodically monitored?",
      ar: "هل مصادر الانبعاث (المداخن، المراجل، الأفران) مجهزة بأنظمة معالجة وتخضع لمراقبة دورية؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Équiper les sources d'émission de dispositifs de traitement adaptés (filtres, dépoussiéreurs, laveurs)", en: "Fit emission sources with appropriate abatement (filters, dust collectors, scrubbers)", ar: "تجهيز مصادر الانبعاث بأنظمة معالجة ملائمة (مصافي، مزيلات الغبار، غسالات)" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place une surveillance périodique des émissions atmosphériques par un laboratoire agréé", en: "Implement periodic stack emission monitoring by an accredited laboratory", ar: "إرساء مراقبة دورية للانبعاثات الجوية من طرف مختبر معتمد" } },
    ],
  },
  {
    code: "AIR03", bloc: "ENV_AIR", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 1,
    references: "Directives EHS §1.7 (bruit)",
    libelle: {
      fr: "Les niveaux de bruit en limite de site sont-ils mesurés et conformes ?",
      en: "Are noise levels at the site boundary measured and compliant?",
      ar: "هل يتم قياس مستويات الضجيج في حدود الموقع وهل هي مطابقة؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Réaliser une campagne de mesures acoustiques en limite de propriété", en: "Carry out a noise survey at the site boundary", ar: "إنجاز حملة قياس الضجيج في حدود الموقع" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Installer des dispositifs d'insonorisation (capotage, écrans acoustiques)", en: "Install noise abatement (enclosures, acoustic barriers)", ar: "تركيب أنظمة عزل الصوت (أغطية، حواجز صوتية)" } },
    ],
  },

  // ─── Bloc 4 : déchets et produits dangereux ────────────────────────────────
  {
    code: "DD01", bloc: "ENV_DD", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "SFI NP3 ; Directives EHS §1.5 (matières dangereuses)",
    libelle: {
      fr: "Les produits chimiques et déchets dangereux sont-ils stockés sur rétention, étiquetés, avec fiches de données de sécurité disponibles ?",
      en: "Are chemicals and hazardous waste stored with secondary containment, labelled, with safety data sheets available?",
      ar: "هل يتم تخزين المواد الكيميائية والنفايات الخطرة فوق أحواض احتجاز مع وسمها وتوفير بطاقات بيانات السلامة؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Aménager des bacs de rétention et un local de stockage ventilé ; afficher les fiches de données de sécurité", en: "Provide containment bunds and a ventilated store; display safety data sheets", ar: "تهيئة أحواض احتجاز ومخزن مهوى وتعليق بطاقات بيانات السلامة" } },
    ],
  },
  {
    code: "DD02", bloc: "ENV_DD", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "Loi 28-00 ; décret 2-07-253 (classification des déchets)",
    libelle: {
      fr: "Les déchets dangereux sont-ils éliminés par une entreprise autorisée, avec conservation des bordereaux de suivi ?",
      en: "Is hazardous waste disposed of by a licensed company, with waste tracking notes kept?",
      ar: "هل يتم التخلص من النفايات الخطرة عبر شركة مرخصة مع الاحتفاظ بوثائق التتبع؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Contractualiser l'élimination des déchets dangereux avec une société autorisée et conserver les bordereaux", en: "Contract hazardous waste disposal with a licensed company and keep tracking notes", ar: "التعاقد مع شركة مرخصة للتخلص من النفايات الخطرة والاحتفاظ بوثائق التتبع" } },
    ],
  },
  {
    code: "DD03", bloc: "ENV_DD", categories: "A,B", type: "oui_non", risque: "oui", gravite: 3,
    references: "Protocole de Montréal ; Convention de Stockholm (PCB)",
    libelle: {
      fr: "L'activité utilise-t-elle des substances appauvrissant la couche d'ozone ou des équipements contenant des PCB ?",
      en: "Does the activity use ozone-depleting substances or equipment containing PCBs?",
      ar: "هل يستعمل النشاط مواد مستنفدة لطبقة الأوزون أو معدات تحتوي على مركبات PCB؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Établir un inventaire des équipements contenant des SAO ou des PCB", en: "Inventory equipment containing ODS or PCBs", ar: "جرد المعدات المحتوية على المواد المستنفدة للأوزون أو مركبات PCB" } },
      { horizon: "moyen", delaiMois: 24, libelle: { fr: "Remplacer progressivement les fluides et équipements concernés", en: "Phase out the affected fluids and equipment", ar: "الاستبدال التدريجي للسوائل والمعدات المعنية" } },
    ],
  },

  // ─── Bloc 5 : situations d'urgence ─────────────────────────────────────────
  {
    code: "URG01", bloc: "ENV_URG", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "SFI NP1 §20-21 ; NP4",
    libelle: {
      fr: "Un plan d'urgence (incendie, déversement, fuite, évacuation) existe-t-il et est-il testé par des exercices ?",
      en: "Is there an emergency plan (fire, spill, leak, evacuation) tested through drills?",
      ar: "هل يوجد مخطط للطوارئ (حريق، انسكاب، تسرب، إخلاء) يتم اختباره عبر تمارين؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Élaborer un plan d'urgence et d'évacuation et désigner les équipes d'intervention", en: "Prepare an emergency and evacuation plan and appoint response teams", ar: "إعداد مخطط للطوارئ والإخلاء وتعيين فرق التدخل" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Organiser au moins un exercice par an et former les équipes d'intervention", en: "Hold at least one drill per year and train response teams", ar: "تنظيم تمرين واحد على الأقل سنويا وتكوين فرق التدخل" } },
    ],
  },
  {
    code: "URG02", bloc: "ENV_URG", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "Code du travail ; règlement de sécurité incendie",
    libelle: {
      fr: "Les moyens de lutte contre l'incendie (extincteurs, robinets d'incendie, détection) sont-ils en place et vérifiés ?",
      en: "Are firefighting means (extinguishers, hydrants, detection) in place and inspected?",
      ar: "هل وسائل مكافحة الحريق (مطافئ، صنابير الحريق، أنظمة الكشف) متوفرة ومراقبة؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Installer les moyens de lutte contre l'incendie et souscrire un contrat de vérification périodique", en: "Install firefighting equipment and contract periodic inspections", ar: "تركيب وسائل مكافحة الحريق وإبرام عقد للمراقبة الدورية" } },
    ],
  },

  // ─── Bloc 6 : certifications et autorisations ──────────────────────────────
  {
    code: "CERT01", bloc: "ENV_CERT", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "Loi 49-17 relative à l'évaluation environnementale ; autorisations d'exploiter",
    libelle: {
      fr: "Le projet dispose-t-il (ou disposera-t-il avant décaissement) des autorisations requises : décision d'acceptabilité environnementale, autorisation d'exploiter, autorisation de prélèvement d'eau ?",
      en: "Does the project hold (or will it hold before disbursement) all required permits: environmental acceptability decision, operating licence, water abstraction permit?",
      ar: "هل يتوفر المشروع (أو سيتوفر قبل صرف التمويل) على التراخيص المطلوبة: قرار القبول البيئي، رخصة الاستغلال، رخصة جلب الماء؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Obtenir les autorisations manquantes avant le premier décaissement (condition suspensive)", en: "Obtain missing permits before first disbursement (condition precedent)", ar: "الحصول على التراخيص الناقصة قبل أول صرف (شرط واقف)" } },
    ],
  },
  {
    code: "CERT02", bloc: "ENV_CERT", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 1, obligatoire: false,
    references: "ISO 14001, ISO 45001, ISO 50001",
    libelle: {
      fr: "L'entreprise est-elle certifiée (ISO 14001, ISO 45001, ISO 50001) ou engagée dans une démarche de certification ?",
      en: "Is the company certified (ISO 14001, ISO 45001, ISO 50001) or working towards certification?",
      ar: "هل المقاولة حاصلة على شهادة (ISO 14001، ISO 45001، ISO 50001) أو منخرطة في مسار الإشهاد؟",
    },
    actions: [
      { horizon: "long", delaiMois: 36, libelle: { fr: "Engager une démarche de certification ISO 14001 / ISO 45001", en: "Start an ISO 14001 / ISO 45001 certification process", ar: "الانخراط في مسار الإشهاد ISO 14001 / ISO 45001" } },
    ],
  },

  // ─── Bloc 7 : système de gestion E&S ───────────────────────────────────────
  {
    code: "SGE01", bloc: "ENV_SGES", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP1 §6-7",
    libelle: {
      fr: "L'entreprise dispose-t-elle d'une politique environnementale et sociale formalisée et d'un responsable désigné ?",
      en: "Does the company have a formal environmental and social policy and a designated officer?",
      ar: "هل تتوفر المقاولة على سياسة بيئية واجتماعية مكتوبة ومسؤول معين؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Désigner un responsable E&S et formaliser une politique environnementale et sociale", en: "Appoint an E&S officer and adopt an environmental and social policy", ar: "تعيين مسؤول بيئي واجتماعي وصياغة سياسة بيئية واجتماعية" } },
    ],
  },
  {
    code: "SGE02", bloc: "ENV_SGES", categories: "A,B", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP1 §7-24",
    libelle: {
      fr: "Les aspects et risques E&S de l'activité sont-ils identifiés et suivis (registre, indicateurs, revue de direction) ?",
      en: "Are the E&S aspects and risks of the activity identified and monitored (register, indicators, management review)?",
      ar: "هل يتم تحديد الجوانب والمخاطر البيئية والاجتماعية للنشاط وتتبعها (سجل، مؤشرات، مراجعة الإدارة)؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place un système de gestion E&S proportionné : registre des aspects, indicateurs, revue annuelle", en: "Implement a proportionate E&S management system: aspects register, indicators, annual review", ar: "إرساء نظام تدبير بيئي واجتماعي ملائم: سجل الجوانب، مؤشرات، مراجعة سنوية" } },
    ],
  },
  {
    code: "SGE03", bloc: "ENV_SGES", categories: "A", type: "oui_non", risque: "non", gravite: 4,
    references: "Loi 49-17 ; SFI NP1 ; Principes de l'Équateur, Principe 2",
    libelle: {
      fr: "Une étude d'impact environnemental et social (EIES) a-t-elle été réalisée par un bureau d'études qualifié, avec un plan de gestion (PGES) ?",
      en: "Has an environmental and social impact assessment (ESIA) been carried out by a qualified consultant, with a management plan (ESMP)?",
      ar: "هل تم إنجاز دراسة التأثير البيئي والاجتماعي من طرف مكتب دراسات مؤهل مع مخطط للتدبير؟",
    },
    aide: {
      fr: "Exigée pour tout projet de catégorie A (procédure §3.4). Joindre l'EIES et le PGES dans les pièces du dossier.",
      en: "Required for every category A project. Attach the ESIA and ESMP to the file.",
      ar: "مطلوبة لكل مشروع من الفئة A. يرجى إرفاق الدراسة والمخطط بوثائق الملف.",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Faire réaliser une EIES et un PGES par un bureau d'études qualifié, selon le cahier des charges SGES", en: "Commission an ESIA and ESMP from a qualified consultant, per the SGES terms of reference", ar: "تكليف مكتب دراسات مؤهل بإنجاز دراسة التأثير ومخطط التدبير وفق دفتر التحملات" } },
    ],
  },

  // ─── Bloc 8 : eau et énergie ───────────────────────────────────────────────
  {
    code: "RES01", bloc: "ENV_RES", categories: "A,B", type: "oui_non", risque: "non", gravite: 2,
    references: "Loi 36-15 ; SFI NP3 (efficacité des ressources)",
    libelle: {
      fr: "La consommation d'eau est-elle mesurée et des mesures d'économie sont-elles mises en œuvre ?",
      en: "Is water consumption metered and are water-saving measures implemented?",
      ar: "هل يتم قياس استهلاك الماء وتطبيق تدابير لترشيده؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Installer des compteurs divisionnaires et suivre les consommations d'eau", en: "Install sub-meters and track water consumption", ar: "تركيب عدادات فرعية وتتبع استهلاك الماء" } },
      { horizon: "moyen", delaiMois: 18, libelle: { fr: "Mettre en œuvre un plan d'économie d'eau (recyclage, réutilisation des eaux épurées)", en: "Implement a water-saving plan (recycling, treated wastewater reuse)", ar: "تنفيذ مخطط لترشيد الماء (إعادة التدوير، إعادة استعمال المياه المعالجة)" } },
    ],
  },
  {
    code: "RES02", bloc: "ENV_RES", categories: "A,B", type: "oui_non", risque: "non", gravite: 3,
    references: "Loi 36-15 ; Directive BAM 5/W/2021",
    libelle: {
      fr: "La ressource en eau du projet est-elle sécurisée compte tenu du stress hydrique local (autorisation de prélèvement, ressource alternative) ?",
      en: "Is the project's water supply secured given local water stress (abstraction permit, alternative source)?",
      ar: "هل الموارد المائية للمشروع مؤمنة بالنظر للإجهاد المائي المحلي (رخصة الجلب، مصدر بديل)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Obtenir l'autorisation de prélèvement et évaluer la disponibilité de la ressource", en: "Obtain the abstraction permit and assess resource availability", ar: "الحصول على رخصة الجلب وتقييم توفر الموارد" } },
      { horizon: "moyen", delaiMois: 24, libelle: { fr: "Étudier une ressource alternative (dessalement, eaux non conventionnelles)", en: "Study an alternative source (desalination, non-conventional water)", ar: "دراسة مصدر بديل (تحلية مياه البحر، المياه غير التقليدية)" } },
    ],
  },

  // ─── Hygiène et sécurité ───────────────────────────────────────────────────
  {
    code: "HN01", bloc: "HSE_NUIS", categories: "A,B", type: "oui_non", risque: "oui", gravite: 2,
    references: "SFI NP4",
    libelle: {
      fr: "Les riverains sont-ils exposés à des nuisances (bruit, odeurs, poussières, trafic de poids lourds) ?",
      en: "Are neighbours exposed to nuisances (noise, odours, dust, heavy traffic)?",
      ar: "هل يتعرض الساكنة المجاورة لإزعاجات (ضجيج، روائح، غبار، حركة الشاحنات)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place des mesures de réduction des nuisances et informer les riverains", en: "Implement nuisance reduction measures and inform neighbours", ar: "اتخاذ تدابير لتقليص الإزعاجات وإخبار الساكنة المجاورة" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Instaurer un mécanisme de recueil et de traitement des plaintes des riverains", en: "Set up a grievance mechanism for neighbours", ar: "إرساء آلية لتلقي ومعالجة شكايات الساكنة" } },
    ],
  },
  {
    code: "HS01", bloc: "HSE_MES", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "Code du travail, art. 281 et suivants ; SFI NP2 §23",
    libelle: {
      fr: "Une évaluation des risques professionnels est-elle réalisée et mise à jour, avec un plan de prévention ?",
      en: "Is an occupational risk assessment carried out and updated, with a prevention plan?",
      ar: "هل يتم إنجاز تقييم للمخاطر المهنية وتحيينه مع مخطط للوقاية؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Réaliser l'évaluation des risques professionnels et établir le plan de prévention", en: "Carry out the occupational risk assessment and prepare a prevention plan", ar: "إنجاز تقييم المخاطر المهنية وإعداد مخطط الوقاية" } },
    ],
  },
  {
    code: "HS02", bloc: "HSE_MES", categories: "A,B,C", type: "oui_non_na", risque: "non", gravite: 3,
    references: "Code du travail ; SFI NP2",
    libelle: {
      fr: "Les équipements de protection individuelle sont-ils fournis gratuitement et leur port est-il contrôlé ?",
      en: "Is personal protective equipment provided free of charge and its use enforced?",
      ar: "هل يتم توفير معدات الوقاية الفردية مجانا ومراقبة ارتدائها؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Doter le personnel des équipements de protection adaptés et contrôler leur port", en: "Provide suitable PPE and enforce its use", ar: "تزويد الأجراء بمعدات الوقاية الملائمة ومراقبة ارتدائها" } },
    ],
  },
  {
    code: "HS03", bloc: "HSE_MES", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 2,
    references: "Code du travail, art. 304 (médecine du travail) et 336 (comité de sécurité et d'hygiène)",
    aide: { fr: "Obligatoire à partir de 50 salariés.", en: "Mandatory from 50 employees.", ar: "إلزامي ابتداء من 50 أجيرا." },
    libelle: {
      fr: "Existe-t-il un comité de sécurité et d'hygiène et un service médical du travail ?",
      en: "Is there a health and safety committee and an occupational health service?",
      ar: "هل توجد لجنة للسلامة وحفظ الصحة ومصلحة طبية للشغل؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Constituer le comité de sécurité et d'hygiène et organiser la médecine du travail", en: "Set up the health and safety committee and organise occupational health services", ar: "تشكيل لجنة السلامة وحفظ الصحة وتنظيم طب الشغل" } },
    ],
  },
  {
    code: "HS04", bloc: "HSE_MES", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "Loi 18-12 (accidents du travail) ; SFI NP2",
    libelle: {
      fr: "Les accidents du travail sont-ils déclarés, enregistrés et analysés (taux de fréquence suivi) ?",
      en: "Are occupational accidents reported, recorded and analysed (frequency rate tracked)?",
      ar: "هل يتم التصريح بحوادث الشغل وتسجيلها وتحليلها (تتبع معدل التكرار)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Tenir un registre des accidents et en analyser les causes", en: "Keep an accident register and analyse root causes", ar: "مسك سجل للحوادث وتحليل أسبابها" } },
    ],
  },
  {
    code: "CT01", bloc: "HSE_COND", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 1,
    references: "Code du travail ; SFI NP2",
    libelle: {
      fr: "Les installations sanitaires, l'éclairage, la ventilation et l'eau potable sont-ils adaptés aux effectifs ?",
      en: "Are sanitary facilities, lighting, ventilation and drinking water adequate for the workforce?",
      ar: "هل المرافق الصحية والإنارة والتهوية والماء الصالح للشرب ملائمة لعدد الأجراء؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre les installations sanitaires et l'ambiance de travail aux normes", en: "Bring sanitary facilities and the work environment up to standard", ar: "مطابقة المرافق الصحية وظروف العمل للمعايير" } },
    ],
  },
  {
    code: "CT02", bloc: "HSE_COND", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP2 §23",
    libelle: {
      fr: "Le personnel est-il formé à la sécurité (accueil sécurité, habilitations, conduite d'engins) ?",
      en: "Is staff trained in safety (induction, authorisations, machinery operation)?",
      ar: "هل يتلقى الأجراء تكوينا في السلامة (الاستقبال، التأهيلات، سياقة الآليات)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place un plan de formation à la sécurité", en: "Implement a safety training plan", ar: "وضع مخطط للتكوين في مجال السلامة" } },
    ],
  },

  // ─── Ressources humaines ───────────────────────────────────────────────────
  {
    code: "RH01", bloc: "RH_EMP", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "Code du travail ; dahir 1-72-184 (CNSS) ; SFI NP2",
    libelle: {
      fr: "Tous les salariés disposent-ils d'un contrat de travail et sont-ils déclarés à la sécurité sociale (CNSS) ?",
      en: "Do all employees have an employment contract and are they registered with social security (CNSS)?",
      ar: "هل يتوفر جميع الأجراء على عقد شغل وهل هم مصرح بهم لدى الصندوق الوطني للضمان الاجتماعي؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Régulariser la situation contractuelle et la déclaration CNSS de tous les salariés", en: "Regularise contracts and CNSS registration for all employees", ar: "تسوية الوضعية التعاقدية والتصريح بالضمان الاجتماعي لجميع الأجراء" } },
    ],
  },
  {
    code: "RH02", bloc: "RH_EMP", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 3,
    references: "Code du travail (SMIG/SMAG, durée du travail) ; SFI NP2 §10",
    libelle: {
      fr: "Le salaire minimum légal, la durée du travail et la rémunération des heures supplémentaires sont-ils respectés ?",
      en: "Are the legal minimum wage, working hours and overtime pay respected?",
      ar: "هل يتم احترام الحد الأدنى القانوني للأجر ومدة العمل وأداء الساعات الإضافية؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Mettre la politique de rémunération et de temps de travail en conformité", en: "Bring pay and working-time practices into compliance", ar: "مطابقة سياسة الأجور ومدة العمل للقانون" } },
    ],
  },
  {
    code: "RH03", bloc: "RH_EMP", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 4,
    references: "OIT C29, C105, C138, C182 ; Code du travail art. 143 ; SFI NP2 §21-22",
    libelle: {
      fr: "L'entreprise garantit-elle l'absence de travail des enfants et de travail forcé, y compris chez ses sous-traitants et fournisseurs principaux ?",
      en: "Does the company ensure there is no child or forced labour, including among its contractors and primary suppliers?",
      ar: "هل تضمن المقاولة انعدام تشغيل الأطفال والعمل القسري، بما في ذلك لدى المناولين والموردين الرئيسيين؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Vérifier l'âge à l'embauche et insérer une clause sociale dans les contrats de sous-traitance", en: "Verify age at hiring and include a social clause in subcontracts", ar: "التحقق من السن عند التشغيل وإدراج بند اجتماعي في عقود المناولة" } },
    ],
  },
  {
    code: "RH04", bloc: "RH_EMP", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "OIT C100, C111 ; Code du travail art. 9 ; SFI NP2 §15",
    libelle: {
      fr: "Existe-t-il une politique de non-discrimination, d'égalité des chances et de prévention du harcèlement ?",
      en: "Is there a policy on non-discrimination, equal opportunity and harassment prevention?",
      ar: "هل توجد سياسة لعدم التمييز وتكافؤ الفرص والوقاية من التحرش؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Formaliser une politique d'égalité des chances et de prévention du harcèlement", en: "Adopt an equal opportunity and anti-harassment policy", ar: "صياغة سياسة لتكافؤ الفرص والوقاية من التحرش" } },
    ],
  },
  {
    code: "RH05", bloc: "RH_EMP", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 2,
    references: "OIT C87, C98 ; Code du travail (délégués des salariés) ; SFI NP2 §13",
    libelle: {
      fr: "La liberté d'association et la représentation du personnel (délégués des salariés) sont-elles respectées ?",
      en: "Are freedom of association and workers' representation (staff delegates) respected?",
      ar: "هل يتم احترام حرية الانتماء وتمثيلية الأجراء (مندوبو الأجراء)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Organiser l'élection des délégués des salariés", en: "Hold staff delegate elections", ar: "تنظيم انتخاب مندوبي الأجراء" } },
    ],
  },
  {
    code: "RH06", bloc: "RH_EMP", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP2 §20",
    libelle: {
      fr: "Un mécanisme de réclamation accessible aux travailleurs (confidentiel, sans représailles) existe-t-il ?",
      en: "Is there a grievance mechanism accessible to workers (confidential, without retaliation)?",
      ar: "هل توجد آلية للتظلم متاحة للأجراء (سرية ودون انتقام)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place un mécanisme de réclamation des travailleurs", en: "Set up a worker grievance mechanism", ar: "إرساء آلية لتظلم الأجراء" } },
    ],
  },
  {
    code: "RH07", bloc: "RH_EMP", categories: "A,B", type: "oui_non", risque: "oui", gravite: 2,
    references: "SFI NP2 §18-19 (licenciements, hébergement des travailleurs)",
    libelle: {
      fr: "Le projet prévoit-il des licenciements collectifs ou un recours important à de la main-d'œuvre temporaire, migrante ou hébergée sur site ?",
      en: "Does the project involve collective dismissals or significant use of temporary, migrant or on-site housed labour?",
      ar: "هل يتضمن المشروع تسريحات جماعية أو اللجوء المكثف إلى يد عاملة مؤقتة أو مهاجرة أو مقيمة في الموقع؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Établir un plan de gestion de la main-d'œuvre (recrutement, hébergement, licenciements) conforme à la NP2", en: "Prepare a labour management plan (recruitment, accommodation, retrenchment) in line with PS2", ar: "إعداد مخطط لتدبير اليد العاملة (التشغيل، الإيواء، التسريح) مطابق لمعيار الأداء 2" } },
    ],
  },

  // ─── Normes de performance SFI ─────────────────────────────────────────────
  {
    code: "NP01", bloc: "SFI_NP", categories: "A,B", type: "oui_non", risque: "non", gravite: 3,
    references: "SFI NP1 §25-36 ; Principes de l'Équateur, Principes 5 et 6",
    libelle: {
      fr: "Les parties prenantes (riverains, autorités, communautés) ont-elles été consultées et un mécanisme de plaintes externe est-il en place ?",
      en: "Have stakeholders (neighbours, authorities, communities) been consulted and is an external grievance mechanism in place?",
      ar: "هل تمت استشارة الأطراف المعنية (الساكنة، السلطات، الجماعات) وهل توجد آلية خارجية للشكايات؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Élaborer un plan d'engagement des parties prenantes", en: "Prepare a stakeholder engagement plan", ar: "إعداد مخطط لإشراك الأطراف المعنية" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place un mécanisme de gestion des plaintes des communautés", en: "Set up a community grievance mechanism", ar: "إرساء آلية لتدبير شكايات الجماعات" } },
    ],
  },
  {
    code: "NP04", bloc: "SFI_NP", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 3,
    references: "SFI NP4 (santé, sûreté et sécurité des communautés)",
    libelle: {
      fr: "Les risques pour la santé et la sécurité des communautés (trafic, matières dangereuses, rupture d'ouvrage, agents de sécurité) sont-ils évalués et gérés ?",
      en: "Are community health and safety risks (traffic, hazardous materials, structural failure, security personnel) assessed and managed?",
      ar: "هل يتم تقييم وتدبير المخاطر على صحة وسلامة الجماعات (حركة المرور، المواد الخطرة، انهيار المنشآت، أعوان الأمن)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Évaluer les risques pour les communautés et intégrer les mesures au PGES", en: "Assess community risks and include measures in the ESMP", ar: "تقييم المخاطر على الجماعات وإدراج التدابير في مخطط التدبير" } },
    ],
  },
  {
    code: "NP05", bloc: "SFI_NP", categories: "A,B", type: "oui_non", risque: "oui", gravite: 4,
    references: "SFI NP5 (acquisition de terres et réinstallation involontaire)",
    libelle: {
      fr: "Le projet nécessite-t-il une acquisition de terres ou entraîne-t-il un déplacement physique ou économique de populations ?",
      en: "Does the project require land acquisition or cause physical or economic displacement?",
      ar: "هل يتطلب المشروع اقتناء أراض أو يؤدي إلى تهجير مادي أو اقتصادي للسكان؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Élaborer un plan d'action de réinstallation (PAR) conforme à la NP5", en: "Prepare a resettlement action plan (RAP) in line with PS5", ar: "إعداد مخطط عمل لإعادة التوطين مطابق لمعيار الأداء 5" } },
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Indemniser et accompagner les personnes affectées avant le début des travaux", en: "Compensate and support affected persons before construction starts", ar: "تعويض ومواكبة الأشخاص المتضررين قبل بدء الأشغال" } },
    ],
  },
  {
    code: "NP06", bloc: "SFI_NP", categories: "A,B", type: "oui_non", risque: "oui", gravite: 4,
    references: "SFI NP6 ; loi 22-07 relative aux aires protégées ; Convention de Ramsar",
    libelle: {
      fr: "Le site est-il situé dans ou à proximité d'une aire protégée, d'un habitat critique, d'un site Ramsar ou d'un SIBE ?",
      en: "Is the site located in or near a protected area, critical habitat, Ramsar site or SIBE?",
      ar: "هل يقع الموقع داخل أو بالقرب من منطقة محمية أو موئل حرج أو موقع رامسار أو موقع ذي أهمية بيولوجية؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Faire réaliser une évaluation de la biodiversité par un expert", en: "Commission a biodiversity assessment by an expert", ar: "تكليف خبير بإنجاز تقييم للتنوع البيولوجي" } },
      { horizon: "moyen", delaiMois: 18, libelle: { fr: "Mettre en œuvre un plan d'action biodiversité (éviter, réduire, compenser)", en: "Implement a biodiversity action plan (avoid, minimise, offset)", ar: "تنفيذ مخطط عمل للتنوع البيولوجي (تجنب، تقليص، تعويض)" } },
    ],
  },
  {
    code: "NP07", bloc: "SFI_NP", categories: "A", type: "oui_non", risque: "oui", gravite: 4,
    references: "SFI NP7 ; terres collectives (loi 62-17)",
    libelle: {
      fr: "Le projet affecte-t-il des populations autochtones ou des terres et ressources coutumières (terres collectives) ?",
      en: "Does the project affect indigenous peoples or customary lands and resources (collective lands)?",
      ar: "هل يؤثر المشروع على سكان أصليين أو على أراض وموارد عرفية (أراضي الجماعات السلالية)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Obtenir le consentement libre, préalable et éclairé des communautés concernées", en: "Obtain free, prior and informed consent of the affected communities", ar: "الحصول على الموافقة الحرة والمسبقة والمستنيرة للجماعات المعنية" } },
    ],
  },
  {
    code: "NP08", bloc: "SFI_NP", categories: "A,B", type: "oui_non", risque: "oui", gravite: 3,
    references: "SFI NP8 ; loi 22-80 relative au patrimoine",
    libelle: {
      fr: "Le projet peut-il affecter un patrimoine culturel (sites archéologiques ou religieux, ksour, kasbahs) ?",
      en: "Could the project affect cultural heritage (archaeological or religious sites, ksour, kasbahs)?",
      ar: "هل يمكن أن يؤثر المشروع على تراث ثقافي (مواقع أثرية أو دينية، قصور، قصبات)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Mettre en place une procédure de découverte fortuite et consulter les autorités du patrimoine", en: "Adopt a chance-find procedure and consult heritage authorities", ar: "اعتماد مسطرة الاكتشاف العرضي واستشارة السلطات المكلفة بالتراث" } },
    ],
  },
  {
    code: "NP09", bloc: "SFI_NP", categories: "A", type: "oui_non_na", risque: "non", gravite: 3,
    references: "Principes de l'Équateur IV, Principes 7 et 8",
    aide: {
      fr: "Financement de projet ou prêt aux entreprises lié à un projet de 10 millions USD ou plus.",
      en: "Project finance or project-related corporate loans of USD 10 million or more.",
      ar: "تمويل المشاريع أو القروض المرتبطة بمشروع بقيمة 10 ملايين دولار أو أكثر.",
    },
    libelle: {
      fr: "Le projet fait-il l'objet d'une revue E&S indépendante, d'un plan d'action (ESAP) et de clauses E&S dans la documentation de financement ?",
      en: "Is the project subject to an independent E&S review, an action plan (ESAP) and E&S covenants in the financing documents?",
      ar: "هل يخضع المشروع لمراجعة بيئية واجتماعية مستقلة وخطة عمل وبنود بيئية واجتماعية في وثائق التمويل؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Faire réaliser une revue E&S indépendante et intégrer un ESAP et des clauses E&S dans la documentation de financement", en: "Commission an independent E&S review and include an ESAP and E&S covenants in financing documents", ar: "تكليف جهة مستقلة بالمراجعة وإدراج خطة العمل والبنود البيئية والاجتماعية في وثائق التمويل" } },
    ],
  },

  // ─── Climat ────────────────────────────────────────────────────────────────
  {
    code: "CL01", bloc: "CLI_GES", categories: "A,B", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP3 §7-8 ; Principes de l'Équateur, Principe 10",
    aide: {
      fr: "Au-delà de 100 000 tCO2e par an (scopes 1 et 2), une quantification et une publication annuelles sont attendues.",
      en: "Above 100,000 tCO2e per year (scopes 1 and 2), annual quantification and disclosure are expected.",
      ar: "فوق 100.000 طن مكافئ ثاني أكسيد الكربون سنويا، يتعين القياس والنشر السنوي.",
    },
    libelle: {
      fr: "Les émissions de gaz à effet de serre du projet (scopes 1 et 2) sont-elles estimées et suivies ?",
      en: "Are the project's greenhouse gas emissions (scopes 1 and 2) estimated and monitored?",
      ar: "هل يتم تقدير وتتبع انبعاثات الغازات الدفيئة للمشروع (النطاقان 1 و2)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Réaliser un bilan carbone (scopes 1 et 2)", en: "Carry out a carbon footprint (scopes 1 and 2)", ar: "إنجاز حصيلة الكربون (النطاقان 1 و2)" } },
      { horizon: "long", delaiMois: 36, libelle: { fr: "Définir une trajectoire de réduction des émissions", en: "Define an emission reduction pathway", ar: "تحديد مسار لتقليص الانبعاثات" } },
    ],
  },
  {
    code: "CL02", bloc: "CLI_GES", categories: "A,B", type: "oui_non", risque: "non", gravite: 1,
    references: "Loi 47-09 relative à l'efficacité énergétique (audit énergétique) ; SFI NP3",
    libelle: {
      fr: "Le projet intègre-t-il des mesures d'efficacité énergétique ou d'énergies renouvelables ?",
      en: "Does the project include energy efficiency or renewable energy measures?",
      ar: "هل يتضمن المشروع تدابير للنجاعة الطاقية أو الطاقات المتجددة؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Réaliser un audit énergétique (loi 47-09) et mettre en œuvre les mesures rentables", en: "Carry out an energy audit (Law 47-09) and implement cost-effective measures", ar: "إنجاز افتحاص طاقي (القانون 47-09) وتنفيذ التدابير المجدية" } },
    ],
  },
  {
    code: "CL03", bloc: "CLI_GES", categories: "A,B", type: "oui_non_na", risque: "non", gravite: 2,
    references: "Règlement (UE) 2023/956 — mécanisme d'ajustement carbone aux frontières (CBAM)",
    libelle: {
      fr: "Si l'entreprise exporte vers l'Union européenne des produits couverts par le CBAM, est-elle en mesure de déclarer leurs émissions intégrées ?",
      en: "If the company exports CBAM-covered goods to the EU, can it report their embedded emissions?",
      ar: "إذا كانت المقاولة تصدر إلى الاتحاد الأوروبي منتجات خاضعة لآلية تعديل الكربون على الحدود، هل هي قادرة على التصريح بانبعاثاتها المدمجة؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Mettre en place la mesure et la déclaration des émissions intégrées des produits exportés (CBAM)", en: "Implement measurement and reporting of embedded emissions for exported goods (CBAM)", ar: "إرساء قياس الانبعاثات المدمجة للمنتجات المصدرة والتصريح بها" } },
    ],
  },
  {
    code: "CL04", bloc: "CLI_ADA", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 2,
    references: "Directive BAM 5/W/2021 ; Principes de l'Équateur, annexe A",
    libelle: {
      fr: "Les risques climatiques physiques du site (inondation, sécheresse, chaleur extrême, submersion) ont-ils été pris en compte dans la conception du projet ?",
      en: "Have physical climate risks at the site (flood, drought, extreme heat, coastal flooding) been considered in the project design?",
      ar: "هل تم أخذ المخاطر المناخية المادية للموقع (الفيضانات، الجفاف، الحرارة القصوى، الغمر البحري) بعين الاعتبار في تصميم المشروع؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Réaliser une analyse de vulnérabilité climatique du site", en: "Carry out a climate vulnerability assessment of the site", ar: "إنجاز تحليل للهشاشة المناخية للموقع" } },
      { horizon: "moyen", delaiMois: 24, libelle: { fr: "Mettre en œuvre les mesures d'adaptation (protection contre les crues, sécurisation de l'eau, refroidissement)", en: "Implement adaptation measures (flood protection, water security, cooling)", ar: "تنفيذ تدابير التكيف (الحماية من الفيضانات، تأمين الماء، التبريد)" } },
    ],
  },
  {
    code: "CL05", bloc: "CLI_ADA", categories: "A,B,C", type: "oui_non", risque: "non", gravite: 1,
    references: "Loi 110-14 instituant un régime de couverture des conséquences d'événements catastrophiques",
    libelle: {
      fr: "Les actifs financés sont-ils assurés contre les événements catastrophiques (inondation, séisme) ?",
      en: "Are the financed assets insured against catastrophic events (flood, earthquake)?",
      ar: "هل الأصول الممولة مؤمنة ضد الوقائع الكارثية (الفيضانات، الزلازل)؟",
    },
    actions: [
      { horizon: "court", delaiMois: 3, libelle: { fr: "Souscrire une couverture contre les conséquences d'événements catastrophiques", en: "Take out catastrophic event insurance cover", ar: "اكتتاب تأمين ضد عواقب الوقائع الكارثية" } },
    ],
  },

  // ─── Intermédiaires financiers ─────────────────────────────────────────────
  {
    code: "FI01", bloc: "FI_ACT", categories: "FI", type: "oui_non", risque: "non", gravite: 3,
    references: "SFI — exigences pour les intermédiaires financiers",
    libelle: {
      fr: "L'institution applique-t-elle à ses financements une politique E&S et la liste d'exclusion ?",
      en: "Does the institution apply an E&S policy and the exclusion list to its financing?",
      ar: "هل تطبق المؤسسة على تمويلاتها سياسة بيئية واجتماعية ولائحة الإقصاء؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Adopter une politique E&S et la liste d'exclusion de la SFI", en: "Adopt an E&S policy and the IFC exclusion list", ar: "اعتماد سياسة بيئية واجتماعية ولائحة الإقصاء لمؤسسة التمويل الدولية" } },
    ],
  },
  {
    code: "FI02", bloc: "FI_ACT", categories: "FI", type: "oui_non", risque: "non", gravite: 3,
    references: "SFI — catégorisation FI-1, FI-2, FI-3",
    libelle: {
      fr: "Les opérations à risque E&S élevé (catégorie A) du portefeuille sont-elles identifiées et suivies ?",
      en: "Are high E&S risk (category A) transactions in the portfolio identified and monitored?",
      ar: "هل يتم تحديد وتتبع العمليات ذات المخاطر البيئية والاجتماعية المرتفعة (الفئة A) في المحفظة؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place une catégorisation E&S des financements et un suivi des opérations de catégorie A", en: "Introduce E&S categorisation of loans and monitoring of category A transactions", ar: "إرساء تصنيف بيئي واجتماعي للتمويلات وتتبع عمليات الفئة A" } },
    ],
  },
  {
    code: "FI03", bloc: "FI_ACT", categories: "FI", type: "nombre", risque: ">30", gravite: 2,
    references: "SFI — intermédiaires financiers",
    libelle: {
      fr: "Part du portefeuille dans les secteurs à risque E&S élevé (%)",
      en: "Share of portfolio in high E&S risk sectors (%)",
      ar: "حصة المحفظة في القطاعات ذات المخاطر البيئية والاجتماعية المرتفعة (%)",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Définir des limites d'exposition aux secteurs à risque E&S élevé", en: "Set exposure limits for high E&S risk sectors", ar: "تحديد سقوف التعرض للقطاعات ذات المخاطر المرتفعة" } },
    ],
  },
  {
    code: "FI04", bloc: "FI_ENG", categories: "FI", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP1",
    libelle: {
      fr: "Un responsable E&S est-il désigné et formé ?",
      en: "Is an E&S officer appointed and trained?",
      ar: "هل تم تعيين مسؤول بيئي واجتماعي وتكوينه؟",
    },
    actions: [
      { horizon: "court", delaiMois: 6, libelle: { fr: "Désigner et former un responsable E&S", en: "Appoint and train an E&S officer", ar: "تعيين وتكوين مسؤول بيئي واجتماعي" } },
    ],
  },
  {
    code: "FI05", bloc: "FI_ENG", categories: "FI", type: "oui_non", risque: "non", gravite: 2,
    references: "SFI NP1",
    libelle: {
      fr: "Un reporting E&S périodique est-il produit pour la direction et les bailleurs de fonds ?",
      en: "Is periodic E&S reporting produced for management and lenders?",
      ar: "هل يتم إعداد تقارير بيئية واجتماعية دورية للإدارة والممولين؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 12, libelle: { fr: "Mettre en place un reporting E&S annuel (portefeuille, incidents, plans d'actions)", en: "Introduce annual E&S reporting (portfolio, incidents, action plans)", ar: "إرساء تقرير بيئي واجتماعي سنوي (المحفظة، الحوادث، خطط العمل)" } },
    ],
  },
  {
    code: "FI06", bloc: "FI_ENG", categories: "FI", type: "oui_non", risque: "non", gravite: 2,
    references: "Directive BAM 5/W/2021",
    libelle: {
      fr: "L'institution évalue-t-elle les risques climatiques de son portefeuille ?",
      en: "Does the institution assess the climate risks of its portfolio?",
      ar: "هل تقيم المؤسسة المخاطر المناخية لمحفظتها؟",
    },
    actions: [
      { horizon: "moyen", delaiMois: 18, libelle: { fr: "Intégrer l'évaluation des risques climatiques dans l'analyse de crédit", en: "Integrate climate risk assessment into credit analysis", ar: "إدماج تقييم المخاطر المناخية في تحليل القروض" } },
    ],
  },
];
