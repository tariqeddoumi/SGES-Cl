-- Pratiques bancaires marocaines, scénarios climat et référentiel régional — migration d'une base « sges » existante.
-- Idempotente. À exécuter une fois (PostgreSQL / Supabase).
SET search_path TO sges;

-- Ligne de financement / refinancement (SUNREF, MorSEFF, GEFF, BEI, obligation verte…)
ALTER TABLE sges_dossiers ADD COLUMN IF NOT EXISTS "ligneFinancement" TEXT;

-- Scénarios climat : EBE du projet et résultats (risque physique 2050, coût carbone NGFS, CBAM)
ALTER TABLE sges_evaluations_climat
  ADD COLUMN IF NOT EXISTS "ebeAnnuel" DECIMAL(20,2),
  ADD COLUMN IF NOT EXISTS "scenarios" TEXT;

-- Liste de valeurs « ligne_financement »
INSERT INTO sges_listes_valeurs ("id", "liste", "code", "libelle", "ordre", "actif") VALUES
  ('lf_sunref', 'ligne_financement', 'SUNREF', '{"fr":"SUNREF Maroc (AFD) — efficacité énergétique, énergies renouvelables, environnement","en":"SUNREF Morocco (AFD) — energy efficiency, renewables, environment","ar":"SUNREF المغرب (الوكالة الفرنسية للتنمية)"}', 0, true),
  ('lf_morseff', 'ligne_financement', 'MORSEFF', '{"fr":"MorSEFF (BERD) — énergie durable des entreprises","en":"MorSEFF (EBRD) — sustainable energy financing","ar":"MorSEFF (البنك الأوروبي لإعادة الإعمار والتنمية)"}', 1, true),
  ('lf_geff', 'ligne_financement', 'GEFF', '{"fr":"GEFF (BERD) — économie verte","en":"GEFF (EBRD) — green economy financing facility","ar":"GEFF (البنك الأوروبي) — الاقتصاد الأخضر"}', 2, true),
  ('lf_gvc', 'ligne_financement', 'GVC', '{"fr":"Green Value Chain (BERD) — chaînes de valeur vertes","en":"Green Value Chain (EBRD)","ar":"سلاسل القيمة الخضراء (البنك الأوروبي)"}', 3, true),
  ('lf_bei', 'ligne_financement', 'BEI', '{"fr":"Ligne BEI — PME, climat et action pour le climat","en":"EIB credit line — SMEs and climate action","ar":"خط بنك الاستثمار الأوروبي"}', 4, true),
  ('lf_sfi', 'ligne_financement', 'SFI', '{"fr":"Ligne SFI / IFC — financement climatique","en":"IFC climate finance line","ar":"خط المؤسسة المالية الدولية للتمويل المناخي"}', 5, true),
  ('lf_oblig', 'ligne_financement', 'OBLIGATION_VERTE', '{"fr":"Obligation verte, sociale ou durable de la banque (affectation des fonds)","en":"Bank green, social or sustainability bond (use of proceeds)","ar":"سندات خضراء أو اجتماعية أو مستدامة للبنك"}', 6, true),
  ('lf_fp', 'ligne_financement', 'FONDS_PROPRES', '{"fr":"Ressources propres de la banque","en":"Bank''s own resources","ar":"الموارد الذاتية للبنك"}', 7, true)
ON CONFLICT ("liste", "code") DO NOTHING;

-- Aléas régionaux recalés (revue du 26/10/2026 : séisme d'Al Haouz 2023, 50,4 °C à Agadir en 2023,
-- feux de Larache 2022, crues de Guelmim 2014 et du Sud-Est 2024, pénurie d'eau 2022-2024).
-- Ordre : stress hydrique, sécheresse, inondation, chaleur extrême, submersion marine, incendie, séisme.
UPDATE sges_regions r SET "stressHydrique" = v.sh, "secheresse" = v.se, "inondation" = v.inn, "chaleurExtreme" = v.ch, "submersionMarine" = v.sm, "incendie" = v.inc, "seisme" = v.sei
FROM (VALUES
  ('MA-01', 2, 2, 3, 2, 2, 4, 4),
  ('MA-02', 4, 4, 2, 3, 1, 2, 3),
  ('MA-03', 4, 3, 2, 3, 0, 3, 2),
  ('MA-04', 3, 2, 4, 2, 2, 2, 1),
  ('MA-05', 4, 3, 2, 4, 0, 3, 2),
  ('MA-06', 4, 3, 3, 2, 2, 1, 1),
  ('MA-07', 4, 4, 2, 4, 1, 2, 4),
  ('MA-08', 4, 4, 3, 4, 0, 1, 2),
  ('MA-09', 4, 4, 2, 4, 2, 2, 3),
  ('MA-10', 4, 4, 3, 3, 1, 1, 1),
  ('MA-12', 4, 4, 1, 3, 3, 0, 0)
) AS v(code, sh, se, inn, ch, sm, inc, sei)
WHERE r."code" = v.code;
