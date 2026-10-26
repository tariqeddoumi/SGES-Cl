-- Index des clés étrangères (avis de performance Supabase « unindexed_foreign_keys », 26/10/2026). Idempotent.
SET search_path TO sges;
CREATE INDEX IF NOT EXISTS "sges_blocs_thematiqueId_idx" ON "sges_blocs"("thematiqueId");
CREATE INDEX IF NOT EXISTS "sges_cles_api_entiteId_idx" ON "sges_cles_api"("entiteId");
CREATE INDEX IF NOT EXISTS "sges_clients_secteurId_idx" ON "sges_clients"("secteurId");
CREATE INDEX IF NOT EXISTS "sges_dossiers_chargeId_idx" ON "sges_dossiers"("chargeId");
CREATE INDEX IF NOT EXISTS "sges_dossiers_dossierPrecedentId_idx" ON "sges_dossiers"("dossierPrecedentId");
CREATE INDEX IF NOT EXISTS "sges_dossiers_regionId_idx" ON "sges_dossiers"("regionId");
CREATE INDEX IF NOT EXISTS "sges_dossiers_secteurId_idx" ON "sges_dossiers"("secteurId");
CREATE INDEX IF NOT EXISTS "sges_dossiers_valideurId_idx" ON "sges_dossiers"("valideurId");
CREATE INDEX IF NOT EXISTS "sges_journal_utilisateurId_idx" ON "sges_journal"("utilisateurId");
CREATE INDEX IF NOT EXISTS "sges_modeles_actions_questionId_idx" ON "sges_modeles_actions"("questionId");
CREATE INDEX IF NOT EXISTS "sges_notifications_dossierId_idx" ON "sges_notifications"("dossierId");
CREATE INDEX IF NOT EXISTS "sges_questions_blocId_idx" ON "sges_questions"("blocId");
CREATE INDEX IF NOT EXISTS "sges_reponses_categorisation_questionId_idx" ON "sges_reponses_categorisation"("questionId");
CREATE INDEX IF NOT EXISTS "sges_reponses_exclusion_critereId_idx" ON "sges_reponses_exclusion"("critereId");
CREATE INDEX IF NOT EXISTS "sges_reponses_questionId_idx" ON "sges_reponses"("questionId");
CREATE INDEX IF NOT EXISTS "sges_utilisateurs_roleId_idx" ON "sges_utilisateurs"("roleId");
CREATE INDEX IF NOT EXISTS "sges_visites_visiteurId_idx" ON "sges_visites"("visiteurId");
