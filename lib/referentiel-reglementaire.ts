/**
 * Cadre réglementaire et méthodologie affichés dans l'écran « Cadre réglementaire ».
 * Contenu en trois langues ; les règles chiffrées renvoient aux paramètres réels.
 */
type L = { fr: string; en: string; ar: string };

export const TEXTES: { groupe: L; elements: { titre: L; description: L }[] }[] = [
  {
    groupe: { fr: "Référentiel interne du groupe", en: "Group internal framework", ar: "الإطار الداخلي للمجموعة" },
    elements: [
      {
        titre: { fr: "Circulaire CFD-537/01-24 — Gestion des risques E&S", en: "Circular CFD-537/01-24 — E&S risk management", ar: "الدورية CFD-537/01-24 — تدبير المخاطر البيئية والاجتماعية" },
        description: {
          fr: "Principes directeurs : périmètre groupe et filiales ; évaluation systématique des projets de catégorie A et des projets B, C, FI au-delà de 10 MDH ; fiche E&S obligatoire au comité ; tout dossier visé sans fiche est ajourné.",
          en: "Guiding principles: group and subsidiaries scope; systematic assessment of category A projects and B, C, FI projects above MAD 10m; E&S sheet mandatory for the committee; any in-scope file without it is deferred.",
          ar: "المبادئ التوجيهية: نطاق المجموعة وفروعها؛ تقييم منهجي لمشاريع الفئة A ومشاريع B وC وFI التي تتجاوز 10 ملايين درهم؛ البطاقة البيئية والاجتماعية إلزامية أمام اللجنة؛ يؤجل كل ملف معني بدونها.",
        },
      },
      {
        titre: { fr: "Procédure CFD12340876/0217 — Évaluation des risques E&S", en: "Procedure CFD12340876/0217 — E&S risk assessment", ar: "المسطرة CFD12340876/0217 — تقييم المخاطر البيئية والاجتماعية" },
        description: {
          fr: "Dix étapes : identification, liste d'exclusion, catégorisation (25 éléments), identification des risques, plan d'action correctif, fiche d'évaluation, négociation, analyse par le comité, suivi du plan, reporting. L'outil suit exactement ce déroulé.",
          en: "Ten steps: identification, exclusion list, categorisation (25 items), risk identification, corrective action plan, assessment sheet, negotiation, committee review, plan monitoring, reporting. The tool follows this sequence exactly.",
          ar: "عشر مراحل: التعريف، لائحة الإقصاء، التصنيف (25 عنصرا)، تحديد المخاطر، خطة العمل التصحيحية، بطاقة التقييم، التفاوض، دراسة اللجنة، تتبع الخطة، التقارير. تتبع الأداة هذا التسلسل بدقة.",
        },
      },
      {
        titre: { fr: "Cahier des charges SGES — intégration à la plateforme d'octroi", en: "SGES specification — credit platform integration", ar: "دفتر تحملات النظام — الربط بمنصة منح القروض" },
        description: {
          fr: "Critères déclencheurs, règles obligatoires et données de la fiche E&S transmises à la nouvelle plateforme d'octroi : servies par l'API /api/v1/fiches.",
          en: "Trigger criteria, mandatory rules and E&S sheet data passed to the new credit platform: served by the /api/v1/fiches API.",
          ar: "معايير التفعيل والقواعد الإلزامية ومعطيات البطاقة المرسلة إلى منصة منح القروض الجديدة عبر واجهة /api/v1/fiches.",
        },
      },
    ],
  },
  {
    groupe: { fr: "Réglementation marocaine", en: "Moroccan regulation", ar: "التشريع المغربي" },
    elements: [
      { titre: { fr: "Loi 49-17 relative à l'évaluation environnementale", en: "Law 49-17 on environmental assessment", ar: "القانون 49-17 المتعلق بالتقييم البيئي" }, description: { fr: "Remplace la loi 12-03 : études d'impact, décision d'acceptabilité environnementale, audit environnemental.", en: "Replaces Law 12-03: impact studies, environmental acceptability decision, environmental audit.", ar: "يعوض القانون 12-03: دراسات التأثير، قرار القبول البيئي، الافتحاص البيئي." } },
      { titre: { fr: "Lois 11-03, 36-15, 28-00, 13-03, 47-09, 22-07, 110-14", en: "Laws 11-03, 36-15, 28-00, 13-03, 47-09, 22-07, 110-14", ar: "القوانين 11-03 و36-15 و28-00 و13-03 و47-09 و22-07 و110-14" }, description: { fr: "Protection de l'environnement, eau, déchets, air, efficacité énergétique, aires protégées, événements catastrophiques : citées question par question dans les check-lists.", en: "Environmental protection, water, waste, air, energy efficiency, protected areas, catastrophic events: cited question by question in the checklists.", ar: "حماية البيئة، الماء، النفايات، الهواء، النجاعة الطاقية، المناطق المحمية، الوقائع الكارثية: مذكورة سؤالا بسؤال في القوائم." } },
      { titre: { fr: "Code du travail (loi 65-99)", en: "Labour Code (Law 65-99)", ar: "مدونة الشغل (القانون 65-99)" }, description: { fr: "Contrats, salaire minimum, durée du travail, hygiène et sécurité, comité de sécurité et d'hygiène, médecine du travail, âge minimum.", en: "Contracts, minimum wage, working time, health and safety, safety committee, occupational health, minimum age.", ar: "العقود، الحد الأدنى للأجر، مدة العمل، الصحة والسلامة، لجنة السلامة، طب الشغل، السن الأدنى." } },
      { titre: { fr: "Bank Al-Maghrib — Directive n° 5/W/2021", en: "Bank Al-Maghrib — Directive No. 5/W/2021", ar: "بنك المغرب — التوجيه رقم 5/W/2021" }, description: { fr: "Gestion des risques financiers liés au changement climatique et à l'environnement : volet climat de chaque dossier et vue portefeuille.", en: "Management of climate- and environment-related financial risks: climate section of each file and portfolio view.", ar: "تدبير المخاطر المالية المرتبطة بالتغير المناخي والبيئة: الشق المناخي لكل ملف ونظرة المحفظة." } },
    ],
  },
  {
    groupe: { fr: "Normes internationales", en: "International standards", ar: "المعايير الدولية" },
    elements: [
      { titre: { fr: "Normes de performance de la SFI (2012) et Directives EHS", en: "IFC Performance Standards (2012) and EHS Guidelines", ar: "معايير الأداء لمؤسسة التمويل الدولية (2012) والإرشادات البيئية والصحية" }, description: { fr: "NP1 à NP8 ; liste d'exclusion SFI ; catégories A, B, C, FI (FI-1 à FI-3).", en: "PS1 to PS8; IFC exclusion list; categories A, B, C, FI (FI-1 to FI-3).", ar: "المعايير 1 إلى 8؛ لائحة الإقصاء؛ الفئات A وB وC وFI." } },
      { titre: { fr: "Principes de l'Équateur IV (2020)", en: "Equator Principles IV (2020)", ar: "مبادئ التعادل IV (2020)" }, description: { fr: "Revue indépendante, plan d'action (ESAP), clauses E&S, analyse des risques climatiques, publication des émissions au-delà de 100 000 tCO2e.", en: "Independent review, ESAP, E&S covenants, climate risk assessment, emissions disclosure above 100,000 tCO2e.", ar: "المراجعة المستقلة، خطة العمل، البنود البيئية والاجتماعية، تحليل المخاطر المناخية، نشر الانبعاثات فوق 100.000 طن." } },
      { titre: { fr: "Conventions fondamentales de l'OIT, Principes directeurs de l'OCDE", en: "ILO core conventions, OECD Guidelines", ar: "الاتفاقيات الأساسية لمنظمة العمل الدولية، المبادئ التوجيهية لمنظمة التعاون" }, description: { fr: "Travail des enfants, travail forcé, non-discrimination, liberté syndicale.", en: "Child labour, forced labour, non-discrimination, freedom of association.", ar: "تشغيل الأطفال، العمل القسري، عدم التمييز، الحرية النقابية." } },
      { titre: { fr: "TCFD / ISSB S2, PCAF, CBAM (UE 2023/956)", en: "TCFD / ISSB S2, PCAF, CBAM (EU 2023/956)", ar: "TCFD / ISSB S2، PCAF، آلية تعديل الكربون على الحدود" }, description: { fr: "Risques physiques et de transition, émissions financées et qualité des données, exposition des exportateurs au mécanisme carbone européen.", en: "Physical and transition risks, financed emissions and data quality, exporters' exposure to the EU carbon mechanism.", ar: "المخاطر المادية ومخاطر الانتقال، الانبعاثات الممولة وجودة المعطيات، تعرض المصدرين لآلية الكربون الأوروبية." } },
    ],
  },
];

export const REGLES: { titre: L; texte: L }[] = [
  {
    titre: { fr: "Déclenchement", en: "Triggers", ar: "التفعيل" },
    texte: {
      fr: "Évaluation obligatoire si le projet relève de la catégorie A (un élément 1 à 11 positif), ou si le montant d'investissement converti en devise de référence dépasse le seuil (paramètre général, ou seuil propre à l'entité). Les crédits de fonctionnement sont hors périmètre.",
      en: "Assessment is mandatory if the project is category A (any item 1–11 positive), or if the investment amount converted into the reference currency exceeds the threshold (general setting, or entity-specific). Working capital loans are out of scope.",
      ar: "التقييم إلزامي إذا كان المشروع من الفئة A أو إذا تجاوز مبلغ الاستثمار المحول إلى العملة المرجعية العتبة (إعداد عام أو خاص بالكيان). قروض التسيير خارج النطاق.",
    },
  },
  {
    titre: { fr: "Catégorisation", en: "Categorisation", ar: "التصنيف" },
    texte: {
      fr: "A si l'un des éléments A est positif ; sinon B si un élément B l'est ; sinon C ou FI. Avec plusieurs catégories positives, la plus significative prévaut (ordre paramétrable, A > B > FI > C par défaut). Le Responsable RSE peut retenir une autre catégorie, avec justification journalisée.",
      en: "A if any A item is positive; otherwise B if any B item is; otherwise C or FI. With several positive categories, the most significant prevails (configurable order, A > B > FI > C by default). The E&S Officer may override, with a logged justification.",
      ar: "A إذا كان أي عنصر A إيجابيا؛ وإلا B؛ وإلا C أو FI. عند تعدد الفئات تسود الأهم (ترتيب قابل للإعداد). يمكن للمسؤول البيئي اعتماد فئة أخرى مع تعليل مسجل.",
    },
  },
  {
    titre: { fr: "Risque E&S résiduel", en: "Residual E&S risk", ar: "المخاطر البيئية والاجتماعية المتبقية" },
    texte: {
      fr: "Score = 100 × Σ gravité des risques non maîtrisés / Σ gravité des questions applicables répondues (gravité 1 à 4). Niveaux selon les seuils paramétrés (15 / 35 / 60 par défaut). Catégorie A : un cran de plus ; un risque critique non maîtrisé : au moins « élevé ».",
      en: "Score = 100 × Σ severity of unmitigated risks / Σ severity of applicable answered questions (severity 1–4). Levels per configured thresholds (15 / 35 / 60 by default). Category A: one level up; an unmitigated critical risk: at least 'high'.",
      ar: "النقطة = 100 × مجموع خطورة المخاطر غير المتحكم فيها / مجموع خطورة الأسئلة المطبقة المجاب عنها. المستويات حسب العتبات المعدة. الفئة A: درجة إضافية؛ خطر حرج غير متحكم فيه: على الأقل «مرتفع».",
    },
  },
  {
    titre: { fr: "Score climat", en: "Climate score", ar: "النقطة المناخية" },
    texte: {
      fr: "Physique : exposition (0,6 × aléa maximal + 0,4 × moyenne des trois principaux) modulée par la sensibilité et réduite par la capacité d'adaptation. Transition : sensibilité du secteur et facteurs du projet, majorés par le CBAM, réduits par l'alignement taxonomique. Score climat = 0,6 × risque dominant + 0,4 × l'autre. Émissions financées = émissions × part financée (PCAF).",
      en: "Physical: exposure (0.6 × max hazard + 0.4 × mean of top three) adjusted for sensitivity and reduced by adaptive capacity. Transition: sector sensitivity and project factors, increased by CBAM, reduced by taxonomy alignment. Climate score = 0.6 × dominant risk + 0.4 × the other. Financed emissions = emissions × financed share (PCAF).",
      ar: "المادي: التعرض معدلا بالحساسية ومخففا بالقدرة على التكيف. الانتقال: حساسية القطاع وعوامل المشروع، تزداد بآلية الكربون وتنقص بالتوافق مع التصنيف. النقطة المناخية = 0,6 × الخطر الغالب + 0,4 × الآخر. الانبعاثات الممولة = الانبعاثات × الحصة الممولة.",
    },
  },
  {
    titre: { fr: "Note ESG", en: "ESG rating", ar: "التنقيط البيئي والاجتماعي والحوكمة" },
    texte: {
      fr: "Qualité de la gestion ESG du client, de 0 à 100 et de A à E (seuils 80 / 65 / 50 / 35 par défaut). Environnement : questions environnementales maîtrisées, pondérées par la gravité, et 100 − score climat (30 %). Social : santé-sécurité, ressources humaines, communautés. Gouvernance : système de gestion et conformité (50 %), pièces (20 %), engagement sur le plan d'actions (20 %), transparence des données climat (10 %). Note = 40 % E + 30 % S + 30 % G (paramétrable). Un risque critique non maîtrisé plafonne à D ; en suivi, une action réalisée lève le risque traité et une visite non conforme plafonne à C. Projet exclu : non noté. Note figée à la soumission, puis actualisée en suivi.",
      en: "Quality of the client's ESG management, from 0 to 100 and A to E (thresholds 80 / 65 / 50 / 35 by default). Environment: managed environmental questions, weighted by severity, and 100 − climate score (30%). Social: health and safety, human resources, communities. Governance: management system and compliance (50%), documents (20%), action plan commitment (20%), climate data transparency (10%). Rating = 40% E + 30% S + 30% G (configurable). An unmanaged critical risk caps the rating at D; during monitoring, a completed action removes the risk it addresses and a non-compliant visit caps at C. Excluded project: not rated. Frozen at submission, then updated during monitoring.",
      ar: "جودة تدبير الزبون للقضايا البيئية والاجتماعية والحوكمة، من 0 إلى 100 ومن A إلى E. البيئة: الأسئلة البيئية المتحكم فيها مرجحة بالخطورة و100 ناقص النقطة المناخية (30٪). الاجتماعي: الصحة والسلامة والموارد البشرية والساكنة. الحوكمة: نظام التدبير والمطابقة (50٪)، الوثائق (20٪)، الالتزام بخطة العمل (20٪)، شفافية المعطيات المناخية (10٪). التنقيط = 40٪ بيئة + 30٪ اجتماعي + 30٪ حوكمة (قابل للإعداد). خطر حرج غير متحكم فيه يحدد التنقيط في D؛ أثناء التتبع، إجراء منجز يرفع الخطر المعالج وزيارة غير مطابقة تحدد التنقيط في C. المشروع المقصى لا ينقط.",
    },
  },
  {
    titre: { fr: "Circuit et séparation des fonctions", en: "Workflow and segregation of duties", ar: "المسار وفصل المهام" },
    texte: {
      fr: "Évaluation par le chargé, validation et verrouillage par le directeur (différent du chargé), décision du comité reportée, suivi du plan d'actions et visites, clôture. Chaque étape est historisée et journalisée.",
      en: "Assessment by the relationship manager, validation and locking by the director (different person), committee decision recorded, action plan and site visit monitoring, closure. Every step is recorded and logged.",
      ar: "التقييم من طرف المكلف، المصادقة والقفل من طرف المدير (شخص مختلف)، تسجيل قرار اللجنة، تتبع خطة العمل والزيارات، الإغلاق. كل مرحلة مؤرخة ومسجلة.",
    },
  },
];
