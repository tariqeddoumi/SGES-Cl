/**
 * Liste d'exclusion et formulaire de catégorisation.
 *
 * Liste d'exclusion : liste de la SFI (Société financière internationale) reprise par
 * la procédure CFD12340876/0217 (annexe 2) et la formation SGES ; les deux derniers
 * critères sont des options de politique sectorielle du groupe, livrées désactivées.
 *
 * Catégorisation : les 25 éléments du « Formulaire de catégorisation » (procédure §3.3) :
 * éléments 1 à 11 → catégorie A ; 12 à 23 → B ; 24 → C ; 25 → FI.
 */

type L = { fr: string; en: string; ar: string };

/**
 * Nature de chaque critère (gouvernance, constat F13) : les interdictions légales ne sont jamais
 * dérogeables ; les exclusions de bailleur (liste SFI) et de politique du groupe peuvent faire l'objet
 * d'une dérogation motivée du Responsable RSE si le critère est marqué dérogeable. Cette matrice est
 * une proposition à faire approuver par la gouvernance (Risques, RSE, Juridique), modifiable en
 * Paramétrage › Liste d'exclusion.
 */
export const NATURE_CRITERE: Record<string, { nature: string; derogeable: boolean }> = {
  EXC01: { nature: "interdiction_legale", derogeable: false },
  EXC09: { nature: "interdiction_legale", derogeable: false },
  EXC15: { nature: "politique_groupe", derogeable: true },
  EXC16: { nature: "politique_groupe", derogeable: true },
};
export const NATURE_DEFAUT = { nature: "exclusion_bailleur", derogeable: true };

export const CRITERES_EXCLUSION: { code: string; libelle: L; source: string; bloquant?: boolean; actif?: boolean }[] = [
  {
    code: "EXC01",
    source: "SFI",
    libelle: {
      fr: "Production ou commerce de tout produit, bien ou activité illégal au regard de la réglementation marocaine ou internationale, ou faisant l'objet d'une interdiction internationale (certains pesticides/herbicides, médicaments, substances appauvrissant la couche d'ozone, PCB, espèces protégées CITES…)",
      en: "Production of or trade in any product, good or activity deemed illegal under Moroccan or international law, or subject to international bans (certain pesticides/herbicides, pharmaceuticals, ozone-depleting substances, PCBs, CITES wildlife…)",
      ar: "إنتاج أو تجارة أي منتوج أو سلعة أو نشاط غير قانوني وفق التشريع المغربي أو الدولي، أو خاضع لحظر دولي (بعض المبيدات، الأدوية، المواد المستنفدة لطبقة الأوزون، مركبات PCB، الأنواع المحمية CITES...)",
    },
  },
  {
    code: "EXC02",
    source: "SFI",
    libelle: { fr: "Production ou commerce d'armes et de munitions", en: "Production of or trade in weapons and munitions", ar: "إنتاج أو تجارة الأسلحة والذخيرة" },
  },
  {
    code: "EXC03",
    source: "SFI",
    libelle: {
      fr: "Production ou commerce de boissons alcoolisées (à l'exception de la bière et du vin)",
      en: "Production of or trade in alcoholic beverages (excluding beer and wine)",
      ar: "إنتاج أو تجارة المشروبات الكحولية (باستثناء الجعة والنبيذ)",
    },
  },
  { code: "EXC04", source: "SFI", libelle: { fr: "Production ou commerce du tabac", en: "Production of or trade in tobacco", ar: "إنتاج أو تجارة التبغ" } },
  {
    code: "EXC05",
    source: "SFI",
    libelle: {
      fr: "Jeux de hasard, casinos et entreprises équivalentes (si activité principale du demandeur)",
      en: "Gambling, casinos and equivalent enterprises (if the applicant's main activity)",
      ar: "ألعاب القمار والكازينوهات وما يماثلها (إذا كانت النشاط الرئيسي لطالب التمويل)",
    },
  },
  {
    code: "EXC06",
    source: "SFI",
    libelle: {
      fr: "Production ou commerce de matériaux radioactifs (hors équipements médicaux, de contrôle de qualité et équipements dont la source radioactive est négligeable)",
      en: "Production of or trade in radioactive materials (excluding medical and quality-control equipment with negligible radioactive source)",
      ar: "إنتاج أو تجارة المواد المشعة (باستثناء المعدات الطبية ومعدات مراقبة الجودة ذات المصدر المشع الضئيل)",
    },
    bloquant: true,
  },
  {
    code: "EXC07",
    source: "SFI",
    libelle: {
      fr: "Production ou commerce de fibres d'amiante non liées, ou de biens en contenant (hors fibrociment contenant moins de 20 % d'amiante)",
      en: "Production of or trade in unbonded asbestos fibres or products containing them (excluding asbestos cement sheeting with less than 20% asbestos)",
      ar: "إنتاج أو تجارة ألياف الأميانت غير المرتبطة أو السلع المحتوية عليها (باستثناء الإسمنت الليفي الذي يحتوي على أقل من 20% من الأميانت)",
    },
    bloquant: true,
  },
  {
    code: "EXC08",
    source: "SFI",
    libelle: {
      fr: "Pêche hauturière au filet dérivant de plus de 2,5 km de longueur",
      en: "Drift-net fishing in the marine environment using nets longer than 2.5 km",
      ar: "الصيد في أعالي البحار بالشباك العائمة التي يتجاوز طولها 2,5 كلم",
    },
    bloquant: true,
  },
  {
    code: "EXC09",
    source: "SFI",
    libelle: {
      fr: "Production ou activités impliquant des formes de travail forcé ou préjudiciables, ou le travail des enfants",
      en: "Production or activities involving harmful or exploitative forms of forced labour or child labour",
      ar: "الإنتاج أو الأنشطة التي تنطوي على العمل القسري أو الاستغلالي أو تشغيل الأطفال",
    },
    bloquant: true,
  },
  {
    code: "EXC10",
    source: "SFI",
    libelle: {
      fr: "Opérations d'exploitation forestière commerciale dans la forêt tropicale humide primaire",
      en: "Commercial logging operations in primary tropical moist forest",
      ar: "عمليات الاستغلال التجاري للغابات في الغابات الاستوائية الرطبة الأولية",
    },
    bloquant: true,
  },
  {
    code: "EXC11",
    source: "SFI",
    libelle: {
      fr: "Production ou commerce de bois ou d'autres produits forestiers ne provenant pas de forêts gérées durablement",
      en: "Production of or trade in wood or other forestry products other than from sustainably managed forests",
      ar: "إنتاج أو تجارة الخشب أو غيره من المنتجات الغابوية غير المتأتية من غابات مدبرة بشكل مستدام",
    },
  },
  {
    code: "EXC12",
    source: "SFI",
    libelle: {
      fr: "Production, commerce, stockage ou transport de volumes importants de produits chimiques dangereux, ou utilisation à l'échelle commerciale de produits chimiques dangereux (essence, kérosène et autres produits pétroliers inclus)",
      en: "Production, trade, storage or transport of significant volumes of hazardous chemicals, or commercial-scale usage of hazardous chemicals",
      ar: "إنتاج أو تجارة أو تخزين أو نقل كميات كبيرة من المواد الكيميائية الخطرة أو استعمالها على نطاق تجاري",
    },
  },
  {
    code: "EXC13",
    source: "SFI",
    libelle: {
      fr: "Production ou activités portant atteinte aux terres possédées ou revendiquées par des populations autochtones sans leur consentement préalable, libre et éclairé",
      en: "Production or activities that impinge on lands owned or claimed by indigenous peoples without their free, prior and informed consent",
      ar: "الإنتاج أو الأنشطة التي تمس بأراضي مملوكة أو مطالب بها من طرف سكان أصليين دون موافقتهم الحرة والمسبقة والمستنيرة",
    },
    bloquant: true,
  },
  {
    code: "EXC14",
    source: "SFI",
    libelle: {
      fr: "Transport de pétrole ou d'autres substances dangereuses par des navires-citernes non conformes aux exigences de l'OMI (MARPOL, SOLAS, double coque)",
      en: "Shipment of oil or other hazardous substances in tankers not complying with IMO requirements (MARPOL, SOLAS, double hull)",
      ar: "نقل البترول أو مواد خطرة أخرى بواسطة ناقلات غير مطابقة لمتطلبات المنظمة البحرية الدولية",
    },
  },
  {
    code: "EXC15",
    source: "Groupe (option)",
    actif: false,
    libelle: {
      fr: "Nouvelle centrale électrique au charbon ou nouvelle mine de charbon thermique (politique sectorielle climat)",
      en: "New coal-fired power plant or new thermal coal mine (climate sector policy)",
      ar: "محطة كهربائية جديدة تعمل بالفحم أو منجم جديد للفحم الحراري (السياسة القطاعية للمناخ)",
    },
  },
  {
    code: "EXC16",
    source: "Groupe (option)",
    actif: false,
    libelle: {
      fr: "Exploration ou production de pétrole et gaz non conventionnels (sables bitumineux, gaz de schiste, Arctique)",
      en: "Exploration or production of unconventional oil and gas (oil sands, shale, Arctic)",
      ar: "التنقيب عن النفط والغاز غير التقليديين أو إنتاجهما (الرمال النفطية، الغاز الصخري، القطب الشمالي)",
    },
  },
];

export const QUESTIONS_CATEGORISATION: { numero: number; categorie: string; libelle: L }[] = [
  { numero: 1, categorie: "A", libelle: { fr: "Usines industrielles de grande taille (cimenterie, usine sidérurgique, métallurgique, production d'engrais, etc.)", en: "Large industrial plants (cement, steel, metallurgy, fertiliser production, etc.)", ar: "مصانع صناعية كبيرة الحجم (الإسمنت، الصلب، التعدين، إنتاج الأسمدة، إلخ)" } },
  { numero: 2, categorie: "A", libelle: { fr: "Construction d'infrastructures (barrages, port, aéroport, autoroute, centrale électrique, etc.)", en: "Infrastructure construction (dams, port, airport, motorway, power plant, etc.)", ar: "إنجاز بنيات تحتية (سدود، ميناء، مطار، طريق سيار، محطة كهربائية، إلخ)" } },
  { numero: 3, categorie: "A", libelle: { fr: "Impact sur une forêt vierge", en: "Impact on primary (virgin) forest", ar: "تأثير على غابة بكر" } },
  { numero: 4, categorie: "A", libelle: { fr: "Impact sur un site de patrimoine culturel (emplacements religieux ou archéologiques, par exemple)", en: "Impact on a cultural heritage site (e.g. religious or archaeological sites)", ar: "تأثير على موقع للتراث الثقافي (مواقع دينية أو أثرية مثلا)" } },
  { numero: 5, categorie: "A", libelle: { fr: "Impact sur des lignes de partage des eaux par de grands programmes d'aménagement hydraulique (lutte contre les inondations, irrigation ou drainage, par exemple)", en: "Impact on watersheds through large water-management schemes (flood control, irrigation or drainage)", ar: "تأثير على خطوط تقسيم المياه عبر برامج تهيئة هيدروليكية كبرى (الحماية من الفيضانات، السقي، الصرف)" } },
  { numero: 6, categorie: "A", libelle: { fr: "Déplacement involontaire de communautés ou de familles", en: "Involuntary resettlement of communities or families", ar: "تهجير غير طوعي لجماعات أو أسر" } },
  { numero: 7, categorie: "A", libelle: { fr: "Production ou utilisation commerciale de produits agrochimiques (production ou commercialisation de pesticides, engrais, fongicides)", en: "Production or commercial use of agrochemicals (pesticides, fertilisers, fungicides)", ar: "إنتاج أو استعمال تجاري للمواد الكيميائية الزراعية (مبيدات، أسمدة، مبيدات فطرية)" } },
  { numero: 8, categorie: "A", libelle: { fr: "Impact sur une voie maritime navigable internationale", en: "Impact on an international navigable waterway", ar: "تأثير على ممر مائي دولي صالح للملاحة" } },
  { numero: 9, categorie: "A", libelle: { fr: "Impact sur des habitats naturels protégés ou des zones à diversité biologique élevée (marécages, récifs coralliens, palétuviers, par exemple)", en: "Impact on protected natural habitats or areas of high biodiversity (wetlands, coral reefs, mangroves)", ar: "تأثير على موائل طبيعية محمية أو مناطق ذات تنوع بيولوجي مرتفع (مستنقعات، شعاب مرجانية، أشجار المانغروف)" } },
  { numero: 10, categorie: "A", libelle: { fr: "Impact sur des populations autochtones", en: "Impact on indigenous peoples", ar: "تأثير على سكان أصليين" } },
  { numero: 11, categorie: "A", libelle: { fr: "Impacts irréversibles significatifs sur le milieu physique (carrières, mines, zones d'aménagement agricole, urbain, industriel ou touristique, etc.)", en: "Significant irreversible impacts on the physical environment (quarries, mines, agricultural, urban, industrial or tourism development zones)", ar: "تأثيرات مهمة لا رجعة فيها على الوسط الطبيعي (مقالع، مناجم، مناطق تهيئة فلاحية أو حضرية أو صناعية أو سياحية)" } },
  { numero: 12, categorie: "B", libelle: { fr: "Production ou augmentation de la production de déchets liquides", en: "Generation or increase of liquid waste", ar: "إنتاج أو زيادة إنتاج النفايات السائلة" } },
  { numero: 13, categorie: "B", libelle: { fr: "Émission de gaz ou de particules dans l'air", en: "Emission of gases or particulates into the air", ar: "انبعاث غازات أو جسيمات في الهواء" } },
  { numero: 14, categorie: "B", libelle: { fr: "Stockage, manipulation ou utilisation de substances toxiques (liquides, solides ou gaz)", en: "Storage, handling or use of toxic substances (liquid, solid or gas)", ar: "تخزين أو مناولة أو استعمال مواد سامة (سائلة أو صلبة أو غازية)" } },
  { numero: 15, categorie: "B", libelle: { fr: "Production de déchets solides dangereux ou non dangereux", en: "Generation of hazardous or non-hazardous solid waste", ar: "إنتاج نفايات صلبة خطرة أو غير خطرة" } },
  { numero: 16, categorie: "B", libelle: { fr: "Augmentation de la consommation d'eau", en: "Increase in water consumption", ar: "زيادة استهلاك الماء" } },
  { numero: 17, categorie: "B", libelle: { fr: "Augmentation de la consommation d'énergie", en: "Increase in energy consumption", ar: "زيادة استهلاك الطاقة" } },
  { numero: 18, categorie: "B", libelle: { fr: "Le produit final devient un polluant une fois utilisé", en: "The end product becomes a pollutant once used", ar: "المنتوج النهائي يصبح ملوثا بعد استعماله" } },
  { numero: 19, categorie: "B", libelle: { fr: "Niveaux élevés de bruit (dans l'usine ou aux limites du site)", en: "High noise levels (within the plant or at site boundaries)", ar: "مستويات مرتفعة من الضجيج (داخل المصنع أو في حدود الموقع)" } },
  { numero: 20, categorie: "B", libelle: { fr: "Utilisation de substances appauvrissant la couche d'ozone", en: "Use of ozone-depleting substances", ar: "استعمال مواد مستنفدة لطبقة الأوزون" } },
  { numero: 21, categorie: "B", libelle: { fr: "Impact sur la santé et la sécurité sur les lieux de travail", en: "Impact on occupational health and safety", ar: "تأثير على الصحة والسلامة في أماكن العمل" } },
  { numero: 22, categorie: "B", libelle: { fr: "Nécessité d'obtenir des permis ou autorisations environnementales pour l'exécution du projet", en: "Environmental permits or authorisations required to carry out the project", ar: "ضرورة الحصول على رخص أو تراخيص بيئية لإنجاز المشروع" } },
  { numero: 23, categorie: "B", libelle: { fr: "Contamination antérieure des sols", en: "Prior soil contamination", ar: "تلوث سابق للتربة" } },
  { numero: 24, categorie: "C", libelle: { fr: "Société de service (impacts sociaux ou environnementaux minimes ou nuls)", en: "Service company (minimal or no social or environmental impacts)", ar: "شركة خدمات (تأثيرات اجتماعية أو بيئية ضئيلة أو منعدمة)" } },
  { numero: 25, categorie: "FI", libelle: { fr: "Intermédiaire financier (assurance, société de financement, crédit-bail, microfinance, fonds…)", en: "Financial intermediary (insurance, finance company, leasing, microfinance, fund…)", ar: "وسيط مالي (تأمين، شركة تمويل، ائتمان إيجاري، تمويل أصغر، صندوق...)" } },
];
