-- OCR intelligent et saisie guidée par les documents (11/11/2026). Idempotent.
-- Texte transcrit des scans et photos, propositions de la dernière lecture des pièces, nouveaux types
-- de documents utilisés par la carte des sources (lib/domaine/sources.ts).
SET search_path TO sges;

ALTER TABLE "sges_documents" ADD COLUMN IF NOT EXISTS "origineTexte" TEXT;
UPDATE "sges_documents" SET "origineTexte" = 'extraction' WHERE "origineTexte" IS NULL AND "texte" IS NOT NULL;
ALTER TABLE "sges_dossiers" ADD COLUMN IF NOT EXISTS "propositionsOCR" TEXT;

-- Les types existants gardent leur ordre ; « Canevas » et « Autre » passent en fin de liste.
INSERT INTO "sges_listes_valeurs" ("id", "liste", "code", "libelle", "extra", "ordre", "actif") VALUES
  (gen_random_uuid()::text, 'type_document', 'CNSS', '{"fr":"Déclarations CNSS / registre du personnel","en":"Social security (CNSS) returns / staff register","ar":"تصريحات الصندوق الوطني للضمان الاجتماعي / سجل المستخدمين"}', NULL, 8, true),
  (gen_random_uuid()::text, 'type_document', 'RAPPORT_ANALYSES', '{"fr":"Rapports d''analyses et de mesures (rejets, air, bruit)","en":"Test and measurement reports (effluents, air, noise)","ar":"تقارير التحاليل والقياسات (المقذوفات، الهواء، الضجيج)"}', NULL, 9, true),
  (gen_random_uuid()::text, 'type_document', 'DECHETS', '{"fr":"Contrats et bordereaux de collecte des déchets, registre des déchets","en":"Waste collection contracts and consignment notes, waste register","ar":"عقود ووصولات جمع النفايات وسجل النفايات"}', NULL, 10, true),
  (gen_random_uuid()::text, 'type_document', 'HSE', '{"fr":"Documents HSE : évaluation des risques, plan de prévention, registre des accidents","en":"HSE documents: risk assessment, prevention plan, accident register","ar":"وثائق الصحة والسلامة: تقييم المخاطر، مخطط الوقاية، سجل الحوادث"}', NULL, 11, true),
  (gen_random_uuid()::text, 'type_document', 'PLAN_URGENCE', '{"fr":"Plan d''urgence et rapports de vérification incendie","en":"Emergency plan and fire-safety inspection reports","ar":"مخطط الطوارئ وتقارير فحص معدات الحريق"}', NULL, 12, true),
  (gen_random_uuid()::text, 'type_document', 'POLITIQUE_ES', '{"fr":"Politique E&S / système de gestion, organigramme HSE","en":"E&S policy / management system, HSE organisation chart","ar":"السياسة البيئية والاجتماعية / نظام التدبير، الهيكل التنظيمي"}', NULL, 13, true),
  (gen_random_uuid()::text, 'type_document', 'RH', '{"fr":"Documents RH : règlement intérieur, procédure de réclamation, PV des délégués","en":"HR documents: internal rules, grievance procedure, staff delegate minutes","ar":"وثائق الموارد البشرية: النظام الداخلي، مسطرة الشكايات، محاضر المناديب"}', NULL, 14, true),
  (gen_random_uuid()::text, 'type_document', 'ENERGIE', '{"fr":"Bilan carbone, audit énergétique, factures d''eau et d''énergie","en":"Carbon footprint, energy audit, water and energy bills","ar":"البصمة الكربونية، الافتحاص الطاقي، فواتير الماء والطاقة"}', NULL, 15, true),
  (gen_random_uuid()::text, 'type_document', 'ASSURANCE', '{"fr":"Attestation d''assurance (dont garantie catastrophes)","en":"Insurance certificate (including catastrophe cover)","ar":"شهادة التأمين (بما فيها ضمان الوقائع الكارثية)"}', NULL, 16, true),
  (gen_random_uuid()::text, 'type_document', 'CERTIFICAT', '{"fr":"Certificats (ISO 14001, 45001, 50001…)","en":"Certificates (ISO 14001, 45001, 50001…)","ar":"الشهادات (إيزو 14001، 45001، 50001…)"}', NULL, 17, true),
  (gen_random_uuid()::text, 'type_document', 'FONCIER', '{"fr":"Titres fonciers, plan d''acquisition ou de réinstallation","en":"Land titles, acquisition or resettlement plan","ar":"الرسوم العقارية، مخطط الاقتناء أو إعادة التوطين"}', NULL, 18, true)
ON CONFLICT ("liste", "code") DO NOTHING;
UPDATE "sges_listes_valeurs" SET "ordre" = 90 WHERE "liste" = 'type_document' AND "code" = 'CANEVAS';
UPDATE "sges_listes_valeurs" SET "ordre" = 99 WHERE "liste" = 'type_document' AND "code" = 'AUTRE';
