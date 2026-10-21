/**
 * Secteurs d'activité (CITI rév. 4) et régions, avec leurs profils E&S et climat.
 *
 * VALEURS INDICATIVES à calibrer par la fonction Développement durable :
 *  - categorieIndicative : aide à la catégorisation, jamais imposée ;
 *  - risqueTransition / sensibilitePhysique : 0 (nul) à 4 (très élevé) ;
 *  - facteurEmission : tCO2e par million de MAD investi (estimation PCAF score 5,
 *    ordre de grandeur pour l'agrégation de portefeuille) ;
 *  - exposeCBAM : produits couverts par le règlement (UE) 2023/956 (ciment, fer et acier,
 *    aluminium, engrais, électricité, hydrogène).
 * Aléas régionaux : synthèse qualitative 0-4 (stress hydrique, sécheresse, inondation,
 * chaleur extrême, submersion marine, incendie, séisme) à partir des travaux publics
 * disponibles (DGM, ministère de l'Eau, ABH, CNRST) ; à remplacer par les données de
 * l'outil d'analyse climatique retenu par la banque.
 */

type L = { fr: string; en: string; ar: string };

export const SECTEURS: {
  code: string;
  libelle: L;
  categorieIndicative: string;
  risqueTransition: number;
  sensibilitePhysique: number;
  facteurEmission: number;
  exposeCBAM?: boolean;
  eligibleTaxonomie?: boolean;
}[] = [
  { code: "A01", libelle: { fr: "Agriculture, élevage", en: "Crop and animal production", ar: "الفلاحة وتربية الماشية" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 4, facteurEmission: 180 },
  { code: "A02", libelle: { fr: "Sylviculture et exploitation forestière", en: "Forestry and logging", ar: "الحراجة واستغلال الغابات" }, categorieIndicative: "A", risqueTransition: 2, sensibilitePhysique: 4, facteurEmission: 60 },
  { code: "A03", libelle: { fr: "Pêche et aquaculture", en: "Fishing and aquaculture", ar: "الصيد البحري وتربية الأحياء المائية" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 120 },
  { code: "B", libelle: { fr: "Industries extractives (mines, carrières)", en: "Mining and quarrying", ar: "الصناعات الاستخراجية (المناجم والمقالع)" }, categorieIndicative: "A", risqueTransition: 3, sensibilitePhysique: 3, facteurEmission: 350 },
  { code: "B06", libelle: { fr: "Extraction d'hydrocarbures", en: "Extraction of oil and gas", ar: "استخراج المحروقات" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 900 },
  { code: "C10", libelle: { fr: "Industries alimentaires", en: "Food products", ar: "الصناعات الغذائية" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 110 },
  { code: "C11", libelle: { fr: "Fabrication de boissons", en: "Beverages", ar: "صناعة المشروبات" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 90 },
  { code: "C13", libelle: { fr: "Textile, habillement, cuir", en: "Textiles, apparel and leather", ar: "النسيج والألبسة والجلد" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 2, facteurEmission: 120 },
  { code: "C17", libelle: { fr: "Papier et carton", en: "Paper and paper products", ar: "الورق والكرتون" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 260 },
  { code: "C19", libelle: { fr: "Raffinage, cokéfaction", en: "Coke and refined petroleum", ar: "تكرير البترول" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 1100 },
  { code: "C20", libelle: { fr: "Industrie chimique", en: "Chemicals", ar: "الصناعة الكيميائية" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 420 },
  { code: "C2012", libelle: { fr: "Engrais et produits azotés", en: "Fertilisers and nitrogen compounds", ar: "الأسمدة والمواد الآزوتية" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 3, facteurEmission: 900, exposeCBAM: true },
  { code: "C21", libelle: { fr: "Industrie pharmaceutique", en: "Pharmaceuticals", ar: "الصناعة الصيدلية" }, categorieIndicative: "B", risqueTransition: 1, sensibilitePhysique: 2, facteurEmission: 70 },
  { code: "C22", libelle: { fr: "Caoutchouc et plastique", en: "Rubber and plastics", ar: "المطاط والبلاستيك" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 220 },
  { code: "C2394", libelle: { fr: "Ciment, chaux et plâtre", en: "Cement, lime and plaster", ar: "الإسمنت والجير والجبس" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 1500, exposeCBAM: true },
  { code: "C23", libelle: { fr: "Autres produits minéraux non métalliques", en: "Other non-metallic minerals", ar: "منتجات معدنية غير فلزية أخرى" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 480 },
  { code: "C24", libelle: { fr: "Métallurgie, sidérurgie", en: "Basic metals (iron, steel)", ar: "صناعة التعدين والصلب" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 1200, exposeCBAM: true },
  { code: "C2442", libelle: { fr: "Production d'aluminium", en: "Aluminium production", ar: "إنتاج الألومنيوم" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 1300, exposeCBAM: true },
  { code: "C25", libelle: { fr: "Produits métalliques", en: "Fabricated metal products", ar: "المنتجات المعدنية" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 2, facteurEmission: 150 },
  { code: "C27", libelle: { fr: "Équipements électriques", en: "Electrical equipment", ar: "التجهيزات الكهربائية" }, categorieIndicative: "B", risqueTransition: 1, sensibilitePhysique: 2, facteurEmission: 90 },
  { code: "C29", libelle: { fr: "Industrie automobile", en: "Motor vehicles", ar: "صناعة السيارات" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 110 },
  { code: "C30", libelle: { fr: "Aéronautique et autres matériels de transport", en: "Aerospace and other transport equipment", ar: "صناعة الطيران ومعدات النقل" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 2, facteurEmission: 80 },
  { code: "D35", libelle: { fr: "Production d'électricité (thermique)", en: "Electricity generation (thermal)", ar: "إنتاج الكهرباء (حراري)" }, categorieIndicative: "A", risqueTransition: 4, sensibilitePhysique: 3, facteurEmission: 1800, exposeCBAM: true },
  { code: "D3511R", libelle: { fr: "Énergies renouvelables (solaire, éolien, hydraulique)", en: "Renewable energy (solar, wind, hydro)", ar: "الطاقات المتجددة (شمسية، ريحية، كهرمائية)" }, categorieIndicative: "B", risqueTransition: 0, sensibilitePhysique: 3, facteurEmission: 15, eligibleTaxonomie: true },
  { code: "D3520H", libelle: { fr: "Hydrogène et ammoniac verts", en: "Green hydrogen and ammonia", ar: "الهيدروجين والأمونياك الأخضر" }, categorieIndicative: "A", risqueTransition: 1, sensibilitePhysique: 3, facteurEmission: 40, exposeCBAM: true, eligibleTaxonomie: true },
  { code: "E36", libelle: { fr: "Captage, traitement et distribution d'eau, dessalement", en: "Water supply and desalination", ar: "التزويد بالماء وتحلية مياه البحر" }, categorieIndicative: "B", risqueTransition: 1, sensibilitePhysique: 4, facteurEmission: 120, eligibleTaxonomie: true },
  { code: "E37", libelle: { fr: "Assainissement, traitement des eaux usées", en: "Sewerage and wastewater treatment", ar: "التطهير ومعالجة المياه العادمة" }, categorieIndicative: "B", risqueTransition: 1, sensibilitePhysique: 3, facteurEmission: 80, eligibleTaxonomie: true },
  { code: "E38", libelle: { fr: "Collecte, traitement et valorisation des déchets", en: "Waste collection, treatment and recovery", ar: "جمع النفايات ومعالجتها وتثمينها" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 2, facteurEmission: 200, eligibleTaxonomie: true },
  { code: "F41", libelle: { fr: "Construction de bâtiments, promotion immobilière", en: "Construction of buildings, real estate development", ar: "تشييد المباني والإنعاش العقاري" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 140 },
  { code: "F42", libelle: { fr: "Génie civil, infrastructures (routes, ports, barrages)", en: "Civil engineering, infrastructure", ar: "الهندسة المدنية والبنيات التحتية" }, categorieIndicative: "A", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 200 },
  { code: "G", libelle: { fr: "Commerce de gros et de détail", en: "Wholesale and retail trade", ar: "تجارة الجملة والتقسيط" }, categorieIndicative: "C", risqueTransition: 1, sensibilitePhysique: 1, facteurEmission: 40 },
  { code: "G4671", libelle: { fr: "Commerce de combustibles et carburants", en: "Wholesale of fuels", ar: "تجارة المحروقات" }, categorieIndicative: "B", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 300 },
  { code: "H49", libelle: { fr: "Transport terrestre et logistique", en: "Land transport and logistics", ar: "النقل البري واللوجستيك" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 2, facteurEmission: 260 },
  { code: "H50", libelle: { fr: "Transport maritime", en: "Water transport", ar: "النقل البحري" }, categorieIndicative: "B", risqueTransition: 3, sensibilitePhysique: 3, facteurEmission: 320 },
  { code: "H51", libelle: { fr: "Transport aérien", en: "Air transport", ar: "النقل الجوي" }, categorieIndicative: "B", risqueTransition: 4, sensibilitePhysique: 2, facteurEmission: 420 },
  { code: "I55", libelle: { fr: "Hôtellerie et tourisme", en: "Accommodation and tourism", ar: "الفندقة والسياحة" }, categorieIndicative: "B", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 90 },
  { code: "J", libelle: { fr: "Information et communication, centres de données", en: "Information & communication, data centres", ar: "الإعلام والاتصال ومراكز البيانات" }, categorieIndicative: "C", risqueTransition: 1, sensibilitePhysique: 2, facteurEmission: 60 },
  { code: "K", libelle: { fr: "Activités financières et d'assurance", en: "Financial and insurance activities", ar: "الأنشطة المالية والتأمين" }, categorieIndicative: "FI", risqueTransition: 1, sensibilitePhysique: 1, facteurEmission: 10 },
  { code: "L", libelle: { fr: "Activités immobilières", en: "Real estate activities", ar: "الأنشطة العقارية" }, categorieIndicative: "C", risqueTransition: 2, sensibilitePhysique: 3, facteurEmission: 50 },
  { code: "M", libelle: { fr: "Activités spécialisées, scientifiques et techniques", en: "Professional, scientific and technical activities", ar: "الأنشطة المهنية والعلمية والتقنية" }, categorieIndicative: "C", risqueTransition: 0, sensibilitePhysique: 1, facteurEmission: 15 },
  { code: "N", libelle: { fr: "Services administratifs et de soutien", en: "Administrative and support services", ar: "الخدمات الإدارية والدعم" }, categorieIndicative: "C", risqueTransition: 0, sensibilitePhysique: 1, facteurEmission: 20 },
  { code: "P", libelle: { fr: "Enseignement", en: "Education", ar: "التعليم" }, categorieIndicative: "C", risqueTransition: 0, sensibilitePhysique: 2, facteurEmission: 25 },
  { code: "Q86", libelle: { fr: "Santé (cliniques, hôpitaux)", en: "Human health (clinics, hospitals)", ar: "الصحة (مصحات ومستشفيات)" }, categorieIndicative: "B", risqueTransition: 1, sensibilitePhysique: 2, facteurEmission: 60 },
  { code: "R", libelle: { fr: "Arts, spectacles et loisirs", en: "Arts, entertainment and recreation", ar: "الفنون والترفيه" }, categorieIndicative: "C", risqueTransition: 0, sensibilitePhysique: 2, facteurEmission: 30 },
  { code: "S", libelle: { fr: "Autres services", en: "Other services", ar: "خدمات أخرى" }, categorieIndicative: "C", risqueTransition: 0, sensibilitePhysique: 1, facteurEmission: 20 },
];

export const REGIONS: {
  code: string;
  pays: string;
  libelle: L;
  a: [number, number, number, number, number, number, number];
}[] = [
  // a = [stressHydrique, secheresse, inondation, chaleurExtreme, submersionMarine, incendie, seisme]
  { code: "MA-01", pays: "MA", libelle: { fr: "Tanger-Tétouan-Al Hoceïma", en: "Tangier-Tetouan-Al Hoceima", ar: "طنجة - تطوان - الحسيمة" }, a: [2, 2, 3, 2, 2, 3, 3] },
  { code: "MA-02", pays: "MA", libelle: { fr: "L'Oriental", en: "Oriental", ar: "جهة الشرق" }, a: [4, 4, 2, 3, 1, 2, 2] },
  { code: "MA-03", pays: "MA", libelle: { fr: "Fès-Meknès", en: "Fez-Meknes", ar: "فاس - مكناس" }, a: [3, 3, 2, 3, 0, 2, 2] },
  { code: "MA-04", pays: "MA", libelle: { fr: "Rabat-Salé-Kénitra", en: "Rabat-Sale-Kenitra", ar: "الرباط - سلا - القنيطرة" }, a: [2, 2, 3, 2, 2, 2, 1] },
  { code: "MA-05", pays: "MA", libelle: { fr: "Béni Mellal-Khénifra", en: "Beni Mellal-Khenifra", ar: "بني ملال - خنيفرة" }, a: [3, 3, 2, 3, 0, 2, 2] },
  { code: "MA-06", pays: "MA", libelle: { fr: "Casablanca-Settat", en: "Casablanca-Settat", ar: "الدار البيضاء - سطات" }, a: [3, 3, 3, 2, 2, 1, 1] },
  { code: "MA-07", pays: "MA", libelle: { fr: "Marrakech-Safi", en: "Marrakesh-Safi", ar: "مراكش - آسفي" }, a: [4, 4, 2, 4, 1, 2, 3] },
  { code: "MA-08", pays: "MA", libelle: { fr: "Drâa-Tafilalet", en: "Draa-Tafilalet", ar: "درعة - تافيلالت" }, a: [4, 4, 2, 4, 0, 1, 2] },
  { code: "MA-09", pays: "MA", libelle: { fr: "Souss-Massa", en: "Souss-Massa", ar: "سوس - ماسة" }, a: [4, 4, 2, 3, 2, 2, 2] },
  { code: "MA-10", pays: "MA", libelle: { fr: "Guelmim-Oued Noun", en: "Guelmim-Oued Noun", ar: "كلميم - واد نون" }, a: [4, 4, 2, 3, 1, 1, 1] },
  { code: "MA-11", pays: "MA", libelle: { fr: "Laâyoune-Sakia El Hamra", en: "Laayoune-Sakia El Hamra", ar: "العيون - الساقية الحمراء" }, a: [4, 4, 1, 3, 2, 0, 1] },
  { code: "MA-12", pays: "MA", libelle: { fr: "Dakhla-Oued Ed-Dahab", en: "Dakhla-Oued Ed-Dahab", ar: "الداخلة - وادي الذهب" }, a: [4, 4, 1, 3, 2, 0, 0] },
  { code: "CI-AB", pays: "CI", libelle: { fr: "Côte d'Ivoire — District d'Abidjan", en: "Côte d'Ivoire — Abidjan", ar: "ساحل العاج — أبيدجان" }, a: [1, 1, 4, 3, 3, 1, 0] },
  { code: "CI-NO", pays: "CI", libelle: { fr: "Côte d'Ivoire — Nord", en: "Côte d'Ivoire — North", ar: "ساحل العاج — الشمال" }, a: [3, 3, 2, 4, 0, 2, 0] },
  { code: "SN-DK", pays: "SN", libelle: { fr: "Sénégal — Dakar", en: "Senegal — Dakar", ar: "السنغال — داكار" }, a: [3, 3, 3, 3, 4, 1, 0] },
  { code: "SN-NO", pays: "SN", libelle: { fr: "Sénégal — Nord et vallée du fleuve", en: "Senegal — North and river valley", ar: "السنغال — الشمال ووادي النهر" }, a: [4, 4, 3, 4, 1, 2, 0] },
];
