-- Questionnaire paramétrable (niveaux d'exigence, modules d'activité) et listes de suggestions / catalogues (26/10/2026).
-- Idempotent. Sans effet sur les questionnaires tant que QUESTIONNAIRE_NIVEAU_B / _C restent « complet » (valeur par défaut).
SET search_path TO sges;

ALTER TABLE "sges_questions" ADD COLUMN IF NOT EXISTS "module" TEXT,
  ADD COLUMN IF NOT EXISTS "niveau" TEXT NOT NULL DEFAULT 'reglementaire';
ALTER TABLE "sges_dossiers" ADD COLUMN IF NOT EXISTS "modulesQuestionnaire" TEXT,
  ADD COLUMN IF NOT EXISTS "niveauQuestionnaire" TEXT,
  ADD COLUMN IF NOT EXISTS "principesEquateur" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "questionnaireComplet" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS "sges_modules_questionnaire" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "secteurs" TEXT,
  "zones" TEXT,
  "natures" TEXT,
  "effectifMin" INTEGER,
  "stressHydriqueMin" INTEGER,
  "equateur" BOOLEAN NOT NULL DEFAULT false,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "ordre" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "sges_modules_questionnaire_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sges_modules_questionnaire_code_key" ON "sges_modules_questionnaire"("code");
ALTER TABLE "sges_modules_questionnaire" ENABLE ROW LEVEL SECURITY;

-- Modules livrés
INSERT INTO "sges_modules_questionnaire" ("id", "code", "libelle", "secteurs", "zones", "natures", "effectifMin", "stressHydriqueMin", "equateur", "ordre") VALUES
  (gen_random_uuid()::text, 'M1', '{"fr":"Rejets liquides industriels","en":"Industrial wastewater","ar":"المقذوفات السائلة الصناعية"}', 'A01,A03,B,C10,C11,C13,C17,C19,C20,C2012,C21,C22,C24,C2442,C25,D35,E36,E37,E38,I55', NULL, NULL, NULL, NULL, false, 0),
  (gen_random_uuid()::text, 'M2', '{"fr":"Émissions atmosphériques","en":"Air emissions","ar":"الانبعاثات في الهواء"}', 'B,C10,C17,C19,C20,C2012,C23,C2394,C24,C2442,D35,E38', NULL, NULL, NULL, NULL, false, 1),
  (gen_random_uuid()::text, 'M3', '{"fr":"Produits et déchets dangereux","en":"Hazardous materials and waste","ar":"المواد والنفايات الخطرة"}', 'A01,B,C13,C17,C19,C20,C2012,C21,C22,C24,C2442,C25,C27,C29,C30,D35,D3520H,E38,G4671,H49', NULL, NULL, NULL, NULL, false, 2),
  (gen_random_uuid()::text, 'M4', '{"fr":"Communautés, foncier et patrimoine","en":"Communities, land and heritage","ar":"الساكنة والعقار والتراث"}', 'A02,B,D35,D3511R,D3520H,E36,E37,E38,F41,F42,I55', NULL, 'CREATION,EXTENSION', NULL, NULL, false, 3),
  (gen_random_uuid()::text, 'M5', '{"fr":"Biodiversité et aires protégées","en":"Biodiversity and protected areas","ar":"التنوع البيولوجي والمناطق المحمية"}', 'A01,A02,A03,B,D3511R,F42,H50,I55', 'SENSIBLE,COTIERE,MONTAGNE,OASIS', NULL, NULL, NULL, false, 4),
  (gen_random_uuid()::text, 'M6', '{"fr":"Émissions de GES et transition","en":"GHG emissions and transition","ar":"انبعاثات الغازات الدفيئة والانتقال"}', 'B,C17,C19,C20,C2012,C2394,C23,C24,C2442,D35,D3520H,G4671,H49,H50,H51', NULL, NULL, NULL, NULL, false, 5),
  (gen_random_uuid()::text, 'M7', '{"fr":"Nuisances pour les riverains","en":"Nuisances for neighbours","ar":"الإزعاج للساكنة المجاورة"}', NULL, 'URBAINE,PERIURBAINE', NULL, NULL, NULL, false, 6),
  (gen_random_uuid()::text, 'M8', '{"fr":"Ressource en eau","en":"Water resources","ar":"الموارد المائية"}', 'A01,A03,B,C10,C11,C13,C17,E36,I55', NULL, NULL, NULL, 3, false, 7),
  (gen_random_uuid()::text, 'M9', '{"fr":"Main-d''œuvre particulière","en":"Specific workforce","ar":"يد عاملة خاصة"}', 'A01,B,F41,F42', NULL, NULL, 250, NULL, false, 8),
  (gen_random_uuid()::text, 'M10', '{"fr":"Terres collectives","en":"Collective lands","ar":"الأراضي السلالية"}', NULL, 'RURALE,OASIS,MONTAGNE', NULL, NULL, NULL, false, 9),
  (gen_random_uuid()::text, 'E10', '{"fr":"Effectif d''au moins 10 salariés","en":"At least 10 employees","ar":"10 أجراء على الأقل"}', NULL, NULL, NULL, 10, NULL, false, 10),
  (gen_random_uuid()::text, 'E50', '{"fr":"Effectif d''au moins 50 salariés","en":"At least 50 employees","ar":"50 أجيرا على الأقل"}', NULL, NULL, NULL, 50, NULL, false, 11),
  (gen_random_uuid()::text, 'EP', '{"fr":"Principes de l''Équateur applicables","en":"Equator Principles apply","ar":"مبادئ التعادل مطبقة"}', NULL, NULL, NULL, NULL, NULL, true, 12)
ON CONFLICT ("code") DO NOTHING;

-- Marquage initial des questions (seulement celles encore au niveau par défaut, sans module)
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'SIG01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'bonne_pratique', "module" = NULL WHERE "code" = 'SIG02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'bonne_pratique', "module" = NULL WHERE "code" = 'SIG03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M1' WHERE "code" = 'EFF01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M1' WHERE "code" = 'EFF02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M1' WHERE "code" = 'EFF03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'DS01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'DS02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M2' WHERE "code" = 'AIR01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M2' WHERE "code" = 'AIR02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M7' WHERE "code" = 'AIR03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M3' WHERE "code" = 'DD01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M3' WHERE "code" = 'DD02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M3' WHERE "code" = 'DD03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'URG01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'URG02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'CERT01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'bonne_pratique', "module" = NULL WHERE "code" = 'CERT02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'SGE01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'SGE02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'SGE03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'RES01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = 'M8' WHERE "code" = 'RES02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M7' WHERE "code" = 'HN01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'HS01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'HS02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'E50' WHERE "code" = 'HS03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'HS04' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'CT01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'CT02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'RH01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'RH02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'RH03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'RH04' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'E10' WHERE "code" = 'RH05' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'RH06' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M9' WHERE "code" = 'RH07' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'NP01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M4' WHERE "code" = 'NP04' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M4' WHERE "code" = 'NP05' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M5' WHERE "code" = 'NP06' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M10' WHERE "code" = 'NP07' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M4' WHERE "code" = 'NP08' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'EP' WHERE "code" = 'NP09' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = 'M6' WHERE "code" = 'CL01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = 'M6' WHERE "code" = 'CL02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = 'M6' WHERE "code" = 'CL03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'CL04' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'reglementaire', "module" = NULL WHERE "code" = 'CL05' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'FI01' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'FI02' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'FI03' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'FI04' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'sfi', "module" = NULL WHERE "code" = 'FI05' AND "niveau" = 'reglementaire' AND "module" IS NULL;
UPDATE "sges_questions" SET "niveau" = 'interne', "module" = NULL WHERE "code" = 'FI06' AND "niveau" = 'reglementaire' AND "module" IS NULL;

-- Listes de suggestions et catalogues d'éléments types
INSERT INTO "sges_listes_valeurs" ("id", "liste", "code", "libelle", "extra", "ordre", "actif") VALUES
  (gen_random_uuid()::text, 'ville', 'CASABLANCA', '{"fr":"Casablanca","en":"Casablanca","ar":"الدار البيضاء"}', '{"region":"MA-06"}', 0, true),
  (gen_random_uuid()::text, 'ville', 'RABAT', '{"fr":"Rabat","en":"Rabat","ar":"الرباط"}', '{"region":"MA-04"}', 1, true),
  (gen_random_uuid()::text, 'ville', 'SALE', '{"fr":"Salé","en":"Salé","ar":"سلا"}', '{"region":"MA-04"}', 2, true),
  (gen_random_uuid()::text, 'ville', 'KENITRA', '{"fr":"Kénitra","en":"Kenitra","ar":"القنيطرة"}', '{"region":"MA-04"}', 3, true),
  (gen_random_uuid()::text, 'ville', 'TANGER', '{"fr":"Tanger","en":"Tangier","ar":"طنجة"}', '{"region":"MA-01"}', 4, true),
  (gen_random_uuid()::text, 'ville', 'TETOUAN', '{"fr":"Tétouan","en":"Tetouan","ar":"تطوان"}', '{"region":"MA-01"}', 5, true),
  (gen_random_uuid()::text, 'ville', 'FES', '{"fr":"Fès","en":"Fez","ar":"فاس"}', '{"region":"MA-03"}', 6, true),
  (gen_random_uuid()::text, 'ville', 'MEKNES', '{"fr":"Meknès","en":"Meknes","ar":"مكناس"}', '{"region":"MA-03"}', 7, true),
  (gen_random_uuid()::text, 'ville', 'MARRAKECH', '{"fr":"Marrakech","en":"Marrakesh","ar":"مراكش"}', '{"region":"MA-07"}', 8, true),
  (gen_random_uuid()::text, 'ville', 'AGADIR', '{"fr":"Agadir","en":"Agadir","ar":"أكادير"}', '{"region":"MA-09"}', 9, true),
  (gen_random_uuid()::text, 'ville', 'OUJDA', '{"fr":"Oujda","en":"Oujda","ar":"وجدة"}', '{"region":"MA-02"}', 10, true),
  (gen_random_uuid()::text, 'ville', 'NADOR', '{"fr":"Nador","en":"Nador","ar":"الناظور"}', '{"region":"MA-02"}', 11, true),
  (gen_random_uuid()::text, 'ville', 'EL_JADIDA', '{"fr":"El Jadida","en":"El Jadida","ar":"الجديدة"}', '{"region":"MA-06"}', 12, true),
  (gen_random_uuid()::text, 'ville', 'SAFI', '{"fr":"Safi","en":"Safi","ar":"آسفي"}', '{"region":"MA-07"}', 13, true),
  (gen_random_uuid()::text, 'ville', 'SETTAT', '{"fr":"Settat","en":"Settat","ar":"سطات"}', '{"region":"MA-06"}', 14, true),
  (gen_random_uuid()::text, 'ville', 'BERRECHID', '{"fr":"Berrechid","en":"Berrechid","ar":"برشيد"}', '{"region":"MA-06"}', 15, true),
  (gen_random_uuid()::text, 'ville', 'MOHAMMEDIA', '{"fr":"Mohammédia","en":"Mohammedia","ar":"المحمدية"}', '{"region":"MA-06"}', 16, true),
  (gen_random_uuid()::text, 'ville', 'BENI_MELLAL', '{"fr":"Béni Mellal","en":"Beni Mellal","ar":"بني ملال"}', '{"region":"MA-05"}', 17, true),
  (gen_random_uuid()::text, 'ville', 'KHOURIBGA', '{"fr":"Khouribga","en":"Khouribga","ar":"خريبكة"}', '{"region":"MA-05"}', 18, true),
  (gen_random_uuid()::text, 'ville', 'TAZA', '{"fr":"Taza","en":"Taza","ar":"تازة"}', '{"region":"MA-03"}', 19, true),
  (gen_random_uuid()::text, 'ville', 'ERRACHIDIA', '{"fr":"Errachidia","en":"Errachidia","ar":"الرشيدية"}', '{"region":"MA-08"}', 20, true),
  (gen_random_uuid()::text, 'ville', 'OUARZAZATE', '{"fr":"Ouarzazate","en":"Ouarzazate","ar":"ورزازات"}', '{"region":"MA-08"}', 21, true),
  (gen_random_uuid()::text, 'ville', 'LAAYOUNE', '{"fr":"Laâyoune","en":"Laayoune","ar":"العيون"}', '{"region":"MA-11"}', 22, true),
  (gen_random_uuid()::text, 'ville', 'DAKHLA', '{"fr":"Dakhla","en":"Dakhla","ar":"الداخلة"}', '{"region":"MA-12"}', 23, true),
  (gen_random_uuid()::text, 'ville', 'GUELMIM', '{"fr":"Guelmim","en":"Guelmim","ar":"كلميم"}', '{"region":"MA-10"}', 24, true),
  (gen_random_uuid()::text, 'ville', 'ESSAOUIRA', '{"fr":"Essaouira","en":"Essaouira","ar":"الصويرة"}', '{"region":"MA-07"}', 25, true),
  (gen_random_uuid()::text, 'ville', 'SIDI_KACEM', '{"fr":"Sidi Kacem","en":"Sidi Kacem","ar":"سيدي قاسم"}', '{"region":"MA-04"}', 26, true),
  (gen_random_uuid()::text, 'ville', 'LARACHE', '{"fr":"Larache","en":"Larache","ar":"العرائش"}', '{"region":"MA-01"}', 27, true),
  (gen_random_uuid()::text, 'ville', 'ABIDJAN', '{"fr":"Abidjan","en":"Abidjan","ar":"أبيدجان"}', '{"region":"CI-AB"}', 28, true),
  (gen_random_uuid()::text, 'ville', 'DAKAR', '{"fr":"Dakar","en":"Dakar","ar":"داكار"}', '{"region":"SN-DK"}', 29, true),
  (gen_random_uuid()::text, 'pays', 'MA', '{"fr":"Maroc","en":"Morocco","ar":"المغرب"}', NULL, 0, true),
  (gen_random_uuid()::text, 'pays', 'CI', '{"fr":"Côte d''Ivoire","en":"Côte d''Ivoire","ar":"كوت ديفوار"}', NULL, 1, true),
  (gen_random_uuid()::text, 'pays', 'SN', '{"fr":"Sénégal","en":"Senegal","ar":"السنغال"}', NULL, 2, true),
  (gen_random_uuid()::text, 'pays', 'ML', '{"fr":"Mali","en":"Mali","ar":"مالي"}', NULL, 3, true),
  (gen_random_uuid()::text, 'pays', 'BF', '{"fr":"Burkina Faso","en":"Burkina Faso","ar":"بوركينا فاسو"}', NULL, 4, true),
  (gen_random_uuid()::text, 'pays', 'CM', '{"fr":"Cameroun","en":"Cameroon","ar":"الكاميرون"}', NULL, 5, true),
  (gen_random_uuid()::text, 'pays', 'GN', '{"fr":"Guinée","en":"Guinea","ar":"غينيا"}', NULL, 6, true),
  (gen_random_uuid()::text, 'pays', 'MR', '{"fr":"Mauritanie","en":"Mauritania","ar":"موريتانيا"}', NULL, 7, true),
  (gen_random_uuid()::text, 'pays', 'TN', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}', NULL, 8, true),
  (gen_random_uuid()::text, 'pays', 'FR', '{"fr":"France","en":"France","ar":"فرنسا"}', NULL, 9, true),
  (gen_random_uuid()::text, 'pays', 'ES', '{"fr":"Espagne","en":"Spain","ar":"إسبانيا"}', NULL, 10, true),
  (gen_random_uuid()::text, 'pays', 'BE', '{"fr":"Belgique","en":"Belgium","ar":"بلجيكا"}', NULL, 11, true),
  (gen_random_uuid()::text, 'fonction_client', 'DG', '{"fr":"Direction générale","en":"General management","ar":"الإدارة العامة"}', NULL, 0, true),
  (gen_random_uuid()::text, 'fonction_client', 'HSE', '{"fr":"Responsable HSE / environnement","en":"HSE / environment manager","ar":"مسؤول الصحة والسلامة والبيئة"}', NULL, 1, true),
  (gen_random_uuid()::text, 'fonction_client', 'DRH', '{"fr":"Direction des ressources humaines","en":"Human resources","ar":"إدارة الموارد البشرية"}', NULL, 2, true),
  (gen_random_uuid()::text, 'fonction_client', 'TECH', '{"fr":"Direction technique / production","en":"Technical / production management","ar":"الإدارة التقنية / الإنتاج"}', NULL, 3, true),
  (gen_random_uuid()::text, 'fonction_client', 'DAF', '{"fr":"Direction administrative et financière","en":"Finance and administration","ar":"الإدارة الإدارية والمالية"}', NULL, 4, true),
  (gen_random_uuid()::text, 'fonction_client', 'QUALITE', '{"fr":"Responsable qualité","en":"Quality manager","ar":"مسؤول الجودة"}', NULL, 5, true),
  (gen_random_uuid()::text, 'fonction_client', 'BET', '{"fr":"Bureau d''études / consultant","en":"Engineering firm / consultant","ar":"مكتب الدراسات / مستشار"}', NULL, 6, true),
  (gen_random_uuid()::text, 'fonction_client', 'SOUS_TRAITANT', '{"fr":"Sous-traitant / entreprise de travaux","en":"Contractor","ar":"المقاول من الباطن"}', NULL, 7, true),
  (gen_random_uuid()::text, 'fonction_banque', 'CHARGE', '{"fr":"Chargé d''affaires","en":"Relationship manager","ar":"مكلف بالأعمال"}', NULL, 0, true),
  (gen_random_uuid()::text, 'fonction_banque', 'ANALYSTE', '{"fr":"Analyste crédit","en":"Credit analyst","ar":"محلل القروض"}', NULL, 1, true),
  (gen_random_uuid()::text, 'fonction_banque', 'DIRECTEUR_CA', '{"fr":"Directeur de centre d''affaires","en":"Business centre director","ar":"مدير مركز الأعمال"}', NULL, 2, true),
  (gen_random_uuid()::text, 'fonction_banque', 'RSE', '{"fr":"Responsable social et environnemental","en":"E&S officer","ar":"المسؤول الاجتماعي والبيئي"}', NULL, 3, true),
  (gen_random_uuid()::text, 'fonction_banque', 'RISQUES', '{"fr":"Analyste risques","en":"Risk analyst","ar":"محلل المخاطر"}', NULL, 4, true),
  (gen_random_uuid()::text, 'fonction_banque', 'AUDIT', '{"fr":"Auditeur / contrôleur","en":"Auditor / controller","ar":"مدقق / مراقب"}', NULL, 5, true),
  (gen_random_uuid()::text, 'fonction_banque', 'ADMIN', '{"fr":"Administrateur de l''outil","en":"Tool administrator","ar":"مدير الأداة"}', NULL, 6, true),
  (gen_random_uuid()::text, 'source_emissions', 'BILAN_VERIFIE', '{"fr":"Bilan carbone vérifié par un tiers","en":"Third-party verified carbon footprint","ar":"بصمة كربونية متحقق منها من طرف ثالث"}', NULL, 0, true),
  (gen_random_uuid()::text, 'source_emissions', 'BILAN_CLIENT', '{"fr":"Bilan carbone établi par le client","en":"Client''s own carbon footprint","ar":"بصمة كربونية أعدها الزبون"}', NULL, 1, true),
  (gen_random_uuid()::text, 'source_emissions', 'AUDIT_ENERGIE', '{"fr":"Audit énergétique (loi 47-09)","en":"Energy audit (Law 47-09)","ar":"افتحاص طاقي (القانون 47-09)"}', NULL, 2, true),
  (gen_random_uuid()::text, 'source_emissions', 'FACTURES', '{"fr":"Factures d''énergie et de combustibles","en":"Energy and fuel bills","ar":"فواتير الطاقة والوقود"}', NULL, 3, true),
  (gen_random_uuid()::text, 'source_emissions', 'EIES', '{"fr":"Étude d''impact (EIES)","en":"Impact assessment (ESIA)","ar":"دراسة التأثير"}', NULL, 4, true),
  (gen_random_uuid()::text, 'source_emissions', 'FACTEUR_SECTEUR', '{"fr":"Facteur d''émission sectoriel (estimation)","en":"Sector emission factor (estimate)","ar":"معامل الانبعاث القطاعي (تقدير)"}', NULL, 5, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'RETENTION', '{"fr":"Bassin de rétention des eaux pluviales","en":"Stormwater retention basin","ar":"حوض لتجميع مياه الأمطار"}', NULL, 0, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'EAU_SECOURS', '{"fr":"Forage ou source d''eau de secours","en":"Backup well or water source","ar":"بئر أو مصدر ماء احتياطي"}', NULL, 1, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'RECYCLAGE_EAU', '{"fr":"Recyclage / réutilisation des eaux","en":"Water recycling / reuse","ar":"إعادة تدوير المياه / استعمالها"}', NULL, 2, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'ECONOMIE_EAU', '{"fr":"Équipements économes en eau (goutte-à-goutte…)","en":"Water-saving equipment (drip irrigation…)","ar":"تجهيزات مقتصدة للماء (السقي بالتنقيط…)"}', NULL, 3, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'PROTECTION_INONDATION', '{"fr":"Protection contre l''inondation (surélévation, digues)","en":"Flood protection (raised platforms, dykes)","ar":"الحماية من الفيضانات (الرفع، السدود)"}', NULL, 4, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'ISOLATION', '{"fr":"Isolation et toiture réfléchissante","en":"Insulation and cool roof","ar":"العزل وسقف عاكس"}', NULL, 5, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'SECOURS_ELEC', '{"fr":"Alimentation électrique de secours","en":"Backup power supply","ar":"تزويد كهربائي احتياطي"}', NULL, 6, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'ASSURANCE_CAT', '{"fr":"Assurance catastrophes naturelles (loi 110-14)","en":"Natural catastrophe insurance (Law 110-14)","ar":"التأمين ضد الكوارث الطبيعية (القانون 110-14)"}', NULL, 7, true),
  (gen_random_uuid()::text, 'mesure_adaptation', 'PLAN_CONTINUITE', '{"fr":"Plan de continuité d''activité climatique","en":"Climate business continuity plan","ar":"مخطط استمرارية النشاط المناخي"}', NULL, 8, true),
  (gen_random_uuid()::text, 'motif_exclusion', 'ACTIVITE_PRINCIPALE', '{"fr":"Activité principale du client","en":"Client''s main activity","ar":"النشاط الرئيسي للزبون"}', NULL, 0, true),
  (gen_random_uuid()::text, 'motif_exclusion', 'ACTIVITE_ACCESSOIRE', '{"fr":"Activité accessoire (au-delà du seuil de tolérance)","en":"Ancillary activity (above the tolerance threshold)","ar":"نشاط ثانوي (يتجاوز عتبة التسامح)"}', NULL, 1, true),
  (gen_random_uuid()::text, 'motif_exclusion', 'FOURNISSEUR', '{"fr":"Activité d''un fournisseur ou sous-traitant principal","en":"Activity of a main supplier or contractor","ar":"نشاط مورد أو مقاول من الباطن رئيسي"}', NULL, 2, true),
  (gen_random_uuid()::text, 'motif_exclusion', 'OBJET_FINANCE', '{"fr":"Objet même du financement","en":"The financed item itself","ar":"موضوع التمويل نفسه"}', NULL, 3, true),
  (gen_random_uuid()::text, 'motif_exclusion', 'ABSENCE', '{"fr":"Activité absente : vérifié sur pièces et visite","en":"Activity absent: checked on documents and site visit","ar":"النشاط غير موجود: تم التحقق بالوثائق والزيارة"}', NULL, 4, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'EIES_DISPONIBLE', '{"fr":"EIES disponible et impacts circonscrits","en":"ESIA available and impacts contained","ar":"دراسة التأثير متوفرة والآثار محدودة"}', NULL, 0, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'AMPLEUR_LIMITEE', '{"fr":"Ampleur limitée du projet (capacité, emprise)","en":"Limited project scale (capacity, footprint)","ar":"حجم المشروع محدود (الطاقة، المساحة)"}', NULL, 1, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'ZONE_SENSIBLE', '{"fr":"Site en zone sensible ou proche de populations","en":"Site in a sensitive area or near communities","ar":"موقع في منطقة حساسة أو قرب الساكنة"}', NULL, 2, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'CUMUL_IMPACTS', '{"fr":"Cumul d''impacts avec des installations voisines","en":"Cumulative impacts with nearby facilities","ar":"تراكم الآثار مع منشآت مجاورة"}', NULL, 3, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'NATURE_ACTIVITE', '{"fr":"Nature de l''activité mal reflétée par le formulaire","en":"Activity not properly reflected by the form","ar":"طبيعة النشاط غير معكوسة جيدا في الاستمارة"}', NULL, 4, true),
  (gen_random_uuid()::text, 'motif_reclassement', 'AVIS_EXPERT', '{"fr":"Avis d''expert ou du bailleur de fonds","en":"Expert or lender opinion","ar":"رأي خبير أو الممول"}', NULL, 5, true),
  (gen_random_uuid()::text, 'reserve_comite', 'AUTORISATIONS', '{"fr":"Production des autorisations environnementales avant le premier décaissement","en":"Environmental permits to be provided before first disbursement","ar":"تقديم التراخيص البيئية قبل أول صرف"}', NULL, 0, true),
  (gen_random_uuid()::text, 'reserve_comite', 'DECISION_EIES', '{"fr":"Décision d''acceptabilité environnementale avant décaissement","en":"Environmental acceptability decision before disbursement","ar":"قرار القبول البيئي قبل الصرف"}', NULL, 1, true),
  (gen_random_uuid()::text, 'reserve_comite', 'PLAN_SIGNE', '{"fr":"Plan d''actions E&S signé par le client","en":"E&S action plan signed by the client","ar":"خطة العمل البيئية والاجتماعية موقعة من طرف الزبون"}', NULL, 2, true),
  (gen_random_uuid()::text, 'reserve_comite', 'DEVERSEMENT', '{"fr":"Autorisation de déversement de l''Agence de bassin hydraulique","en":"Discharge permit from the River Basin Agency","ar":"ترخيص التصريف من وكالة الحوض المائي"}', NULL, 3, true),
  (gen_random_uuid()::text, 'reserve_comite', 'RAPPORT_ANNUEL', '{"fr":"Rapport E&S annuel transmis à la banque","en":"Annual E&S report sent to the bank","ar":"تقرير بيئي واجتماعي سنوي يرسل إلى البنك"}', NULL, 4, true),
  (gen_random_uuid()::text, 'reserve_comite', 'VISITE_6_MOIS', '{"fr":"Visite de suivi E&S dans les six mois","en":"E&S monitoring visit within six months","ar":"زيارة تتبع بيئية واجتماعية خلال ستة أشهر"}', NULL, 5, true),
  (gen_random_uuid()::text, 'reserve_comite', 'ASSURANCE', '{"fr":"Assurance des actifs financés contre les catastrophes naturelles","en":"Insurance of financed assets against natural catastrophes","ar":"تأمين الأصول الممولة ضد الكوارث الطبيعية"}', NULL, 6, true),
  (gen_random_uuid()::text, 'reserve_comite', 'EMISSIONS', '{"fr":"Déclaration annuelle des émissions de GES","en":"Annual GHG emissions reporting","ar":"تصريح سنوي بانبعاثات الغازات الدفيئة"}', NULL, 7, true),
  (gen_random_uuid()::text, 'constat_visite', 'REJETS_NON_TRAITES', '{"fr":"Rejets liquides sans traitement préalable","en":"Untreated liquid discharges","ar":"مقذوفات سائلة دون معالجة مسبقة"}', NULL, 0, true),
  (gen_random_uuid()::text, 'constat_visite', 'DECHETS_STOCKAGE', '{"fr":"Stockage des déchets non conforme","en":"Non-compliant waste storage","ar":"تخزين النفايات غير مطابق"}', NULL, 1, true),
  (gen_random_uuid()::text, 'constat_visite', 'PRODUITS_RETENTION', '{"fr":"Produits dangereux sans bac de rétention","en":"Hazardous products without secondary containment","ar":"مواد خطرة بدون حوض احتجاز"}', NULL, 2, true),
  (gen_random_uuid()::text, 'constat_visite', 'EPI', '{"fr":"Équipements de protection individuelle non portés","en":"Personal protective equipment not worn","ar":"عدم ارتداء معدات الوقاية الفردية"}', NULL, 3, true),
  (gen_random_uuid()::text, 'constat_visite', 'INCENDIE', '{"fr":"Moyens de lutte contre l''incendie insuffisants ou non vérifiés","en":"Firefighting equipment insufficient or not inspected","ar":"وسائل مكافحة الحرائق غير كافية أو غير مراقبة"}', NULL, 4, true),
  (gen_random_uuid()::text, 'constat_visite', 'REGISTRES', '{"fr":"Registres (déchets, accidents, analyses) non tenus","en":"Registers (waste, accidents, analyses) not kept","ar":"السجلات (النفايات، الحوادث، التحاليل) غير ممسوكة"}', NULL, 5, true),
  (gen_random_uuid()::text, 'constat_visite', 'BRUIT_POUSSIERES', '{"fr":"Nuisances (bruit, poussières) perçues par les riverains","en":"Nuisances (noise, dust) felt by neighbours","ar":"إزعاج (ضجيج، غبار) تشعر به الساكنة"}', NULL, 6, true),
  (gen_random_uuid()::text, 'constat_visite', 'PLAN_AVANCE', '{"fr":"Plan d''actions en bonne voie","en":"Action plan on track","ar":"خطة العمل تسير بشكل جيد"}', NULL, 7, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'ANALYSES_REJETS', '{"fr":"Réaliser une campagne d''analyses des rejets par un laboratoire agréé","en":"Have discharges analysed by an accredited laboratory","ar":"إجراء تحاليل للمقذوفات من طرف مختبر معتمد"}', NULL, 0, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'AIRE_DECHETS', '{"fr":"Aménager une aire de stockage des déchets","en":"Set up a waste storage area","ar":"تهيئة مكان لتخزين النفايات"}', NULL, 1, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'RETENTION', '{"fr":"Installer des bacs de rétention sous les produits dangereux","en":"Install containment trays under hazardous products","ar":"تثبيت أحواض احتجاز تحت المواد الخطرة"}', NULL, 2, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'FORMATION_SECURITE', '{"fr":"Former le personnel à la sécurité et au port des EPI","en":"Train staff in safety and PPE use","ar":"تكوين المستخدمين في السلامة وارتداء معدات الوقاية"}', NULL, 3, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'VERIFICATION_INCENDIE', '{"fr":"Faire vérifier les moyens d''incendie par un organisme agréé","en":"Have firefighting equipment inspected by an approved body","ar":"مراقبة وسائل الحريق من طرف هيئة معتمدة"}', NULL, 4, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'REGISTRES', '{"fr":"Mettre en place et tenir à jour les registres","en":"Set up and maintain the registers","ar":"إحداث السجلات وتحيينها"}', NULL, 5, true),
  (gen_random_uuid()::text, 'recommandation_visite', 'RIVERAINS', '{"fr":"Informer les riverains et ouvrir un registre des plaintes","en":"Inform neighbours and open a grievance register","ar":"إخبار الساكنة وفتح سجل للشكايات"}', NULL, 6, true)
ON CONFLICT ("liste", "code") DO NOTHING;
