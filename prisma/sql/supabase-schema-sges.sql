-- Création du schéma « sges » sur PostgreSQL / Supabase (base partagée avec d'autres applications).
-- Généré par : npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- Appliqué le 2026-10-20 sur le projet Supabase « ProjectFinanceScoring ». Pour les évolutions
-- ultérieures : npm run db:schema avec DATABASE_URL terminé par ?schema=sges.

CREATE SCHEMA IF NOT EXISTS sges;
SET search_path TO sges;
-- CreateTable
CREATE TABLE "sges_entites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "chemin" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL DEFAULT 0,
    "pays" TEXT NOT NULL DEFAULT 'MA',
    "deviseCode" TEXT NOT NULL DEFAULT 'MAD',
    "langueDefaut" TEXT NOT NULL DEFAULT 'fr',
    "seuilDeclenchement" DECIMAL(20,2),
    "nomOutil" TEXT,
    "logoUrl" TEXT,
    "couleurPrimaire" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_entites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "systeme" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "matricule" TEXT,
    "fonction" TEXT,
    "telephone" TEXT,
    "motDePasseHash" TEXT,
    "roleId" TEXT NOT NULL,
    "entiteId" TEXT,
    "porteeEcriture" TEXT NOT NULL DEFAULT 'entite',
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "deviseAffichage" TEXT,
    "theme" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "doitChangerMdp" BOOLEAN NOT NULL DEFAULT true,
    "tentativesEchouees" INTEGER NOT NULL DEFAULT 0,
    "verrouilleJusqua" TIMESTAMP(3),
    "derniereConnexion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_langues" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomNatif" TEXT NOT NULL,
    "rtl" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sges_langues_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "sges_devises" (
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "symbole" TEXT NOT NULL,
    "decimales" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sges_devises_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "sges_taux_change" (
    "id" TEXT NOT NULL,
    "deviseCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "taux" DECIMAL(24,10) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sges_taux_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_parametres" (
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "sges_parametres_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "sges_listes_valeurs" (
    "id" TEXT NOT NULL,
    "liste" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "extra" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_listes_valeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_modules_questionnaire" (
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

-- CreateTable
CREATE TABLE "sges_secteurs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorieIndicative" TEXT,
    "risqueTransition" INTEGER NOT NULL DEFAULT 1,
    "sensibilitePhysique" INTEGER NOT NULL DEFAULT 1,
    "facteurEmission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exposeCBAM" BOOLEAN NOT NULL DEFAULT false,
    "eligibleTaxonomie" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sges_secteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_regions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'MA',
    "libelle" TEXT NOT NULL,
    "stressHydrique" INTEGER NOT NULL DEFAULT 0,
    "secheresse" INTEGER NOT NULL DEFAULT 0,
    "inondation" INTEGER NOT NULL DEFAULT 0,
    "chaleurExtreme" INTEGER NOT NULL DEFAULT 0,
    "submersionMarine" INTEGER NOT NULL DEFAULT 0,
    "incendie" INTEGER NOT NULL DEFAULT 0,
    "seisme" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sges_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_criteres_exclusion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SFI',
    "bloquant" BOOLEAN NOT NULL DEFAULT false,
    "nature" TEXT NOT NULL DEFAULT 'politique_groupe',
    "derogeable" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_criteres_exclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_questions_categorisation" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "aide" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_questions_categorisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_thematiques" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "normes" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_thematiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_blocs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "thematiqueId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_blocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_questions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "aide" TEXT,
    "blocId" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'oui_non',
    "options" TEXT,
    "reponseRisque" TEXT,
    "gravite" INTEGER NOT NULL DEFAULT 2,
    "references" TEXT,
    "secteurs" TEXT,
    "niveau" TEXT NOT NULL DEFAULT 'reglementaire',
    "pilier" TEXT,
    "module" TEXT,
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_modeles_actions" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "horizon" TEXT NOT NULL DEFAULT 'court',
    "libelle" TEXT NOT NULL,
    "delaiMois" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sges_modeles_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_clients" (
    "id" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "compteCourant" TEXT,
    "codeClient" TEXT,
    "raisonSociale" TEXT NOT NULL,
    "formeJuridique" TEXT,
    "comptePortefeuille" TEXT,
    "identifiantFiscal" TEXT,
    "registreCommerce" TEXT,
    "ice" TEXT,
    "secteurId" TEXT,
    "segment" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'MA',
    "ville" TEXT,
    "adresse" TEXT,
    "contactNom" TEXT,
    "contactPoste" TEXT,
    "contactTelephone" TEXT,
    "contactEmail" TEXT,
    "sourceSignaletique" TEXT NOT NULL DEFAULT 'saisie',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_dossiers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chargeId" TEXT,
    "dateDossier" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "etape" INTEGER NOT NULL DEFAULT 1,
    "verrouille" BOOLEAN NOT NULL DEFAULT false,
    "typeCredit" TEXT,
    "natureProjet" TEXT,
    "objet" TEXT,
    "descriptionProcessus" TEXT,
    "projetDeveloppementDurable" BOOLEAN NOT NULL DEFAULT false,
    "ligneFinancement" TEXT,
    "secteurId" TEXT,
    "deviseCode" TEXT NOT NULL DEFAULT 'MAD',
    "montantDemande" DECIMAL(20,2) NOT NULL,
    "montantInvestissement" DECIMAL(20,2),
    "tauxReference" DECIMAL(24,10) NOT NULL DEFAULT 1,
    "deviseCoursReference" TEXT,
    "dateCoursReference" TIMESTAMP(3),
    "sourceCoursReference" TEXT,
    "montantDemandeRef" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "montantInvestissementRef" DECIMAL(20,2),
    "dureeMois" INTEGER,
    "adresseSite" TEXT,
    "localite" TEXT,
    "regionId" TEXT,
    "typeZone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "evaluationObligatoire" BOOLEAN NOT NULL DEFAULT false,
    "motifDeclenchement" TEXT,
    "exclusionVerifiee" BOOLEAN NOT NULL DEFAULT false,
    "exclu" BOOLEAN NOT NULL DEFAULT false,
    "motifExclusion" TEXT,
    "categorieCalculee" TEXT,
    "categorie" TEXT,
    "sousCategorieFI" TEXT,
    "justificationCategorie" TEXT,
    "eieRequise" BOOLEAN NOT NULL DEFAULT false,
    "dateCategorisation" TIMESTAMP(3),
    "evaluationTerminee" BOOLEAN NOT NULL DEFAULT false,
    "principesEquateur" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireComplet" BOOLEAN NOT NULL DEFAULT false,
    "niveauQuestionnaire" TEXT,
    "modulesQuestionnaire" TEXT,
    "scoreESG" DOUBLE PRECISION,
    "noteESG" TEXT,
    "scoreESGOctroi" DOUBLE PRECISION,
    "noteESGOctroi" TEXT,
    "detailESG" TEXT,
    "versionReferentiel" TEXT,
    "scoreRisque" DOUBLE PRECISION,
    "niveauRisque" TEXT,
    "nbRisquesNonMaitrises" INTEGER NOT NULL DEFAULT 0,
    "commentaireEvaluation" TEXT,
    "planActionPropose" BOOLEAN NOT NULL DEFAULT false,
    "soumisLe" TIMESTAMP(3),
    "valideurId" TEXT,
    "valideLe" TIMESTAMP(3),
    "commentaireValidation" TEXT,
    "comite" TEXT,
    "dateComite" TIMESTAMP(3),
    "decision" TEXT,
    "montantAccorde" DECIMAL(20,2),
    "encours" DECIMAL(20,2),
    "dateEncours" TIMESTAMP(3),
    "motifRejetCode" TEXT,
    "motifRejetES" TEXT,
    "reservesComite" TEXT,
    "commentaireComite" TEXT,
    "dossierPrecedentId" TEXT,
    "creeParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_reponses_exclusion" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "critereId" TEXT NOT NULL,
    "reponse" BOOLEAN NOT NULL,
    "commentaire" TEXT,
    "derogation" TEXT,
    "derogationParId" TEXT,
    "derogationParNom" TEXT,
    "derogationLe" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_reponses_exclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_reponses_categorisation" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reponse" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_reponses_categorisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_reponses" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valeur" TEXT,
    "commentaire" TEXT,
    "risque" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_reponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_actions" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "questionId" TEXT,
    "modeleId" TEXT,
    "origine" TEXT NOT NULL DEFAULT 'systeme',
    "thematique" TEXT,
    "libelle" TEXT NOT NULL,
    "horizon" TEXT NOT NULL DEFAULT 'court',
    "negociable" BOOLEAN NOT NULL DEFAULT true,
    "retenue" BOOLEAN,
    "reserveClient" TEXT,
    "responsable" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "periode" TEXT,
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "budget" DECIMAL(20,2),
    "deviseCode" TEXT,
    "commentaire" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_suivis_actions" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avancement" INTEGER NOT NULL,
    "statut" TEXT NOT NULL,
    "commentaire" TEXT,
    "auteurId" TEXT,
    "visiteId" TEXT,

    CONSTRAINT "sges_suivis_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_visites" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'suivi',
    "visiteurId" TEXT,
    "participants" TEXT,
    "constats" TEXT,
    "conformite" TEXT,
    "recommandations" TEXT,
    "prochaineVisite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_visites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_evaluations_climat" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "aleas" TEXT NOT NULL,
    "sensibilite" INTEGER NOT NULL DEFAULT 1,
    "capaciteAdaptation" INTEGER NOT NULL DEFAULT 1,
    "mesuresAdaptation" TEXT,
    "transition" TEXT NOT NULL,
    "expositionCBAM" BOOLEAN NOT NULL DEFAULT false,
    "partExportUE" DOUBLE PRECISION,
    "scope1" DOUBLE PRECISION,
    "scope2" DOUBLE PRECISION,
    "scope3" DOUBLE PRECISION,
    "methodeEmissions" TEXT NOT NULL DEFAULT 'estimee_secteur',
    "qualitePCAF" INTEGER NOT NULL DEFAULT 5,
    "emissionsVerifiees" BOOLEAN NOT NULL DEFAULT false,
    "sourceEmissions" TEXT,
    "emissionsFinancees" DOUBLE PRECISION,
    "baseAttribution" TEXT,
    "montantAttribueRef" DECIMAL(20,2),
    "facteurAttribution" DOUBLE PRECISION,
    "dateArrete" TIMESTAMP(3),
    "emissionsEvitees" DOUBLE PRECISION,
    "partRenouvelable" DOUBLE PRECISION,
    "alignementTaxonomie" TEXT NOT NULL DEFAULT 'non_eligible',
    "objectifTaxonomie" TEXT,
    "scorePhysique" DOUBLE PRECISION,
    "scoreTransition" DOUBLE PRECISION,
    "scoreClimat" DOUBLE PRECISION,
    "niveauClimat" TEXT,
    "couvertureDonnees" DOUBLE PRECISION,
    "methodeVersion" TEXT,
    "ebeAnnuel" DECIMAL(20,2),
    "scenarios" TEXT,
    "commentaire" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sges_evaluations_climat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_documents" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "contenu" BYTEA NOT NULL,
    "texte" TEXT,
    "analyse" TEXT,
    "deposeParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sges_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_historique_dossiers" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" TEXT,
    "auteurNom" TEXT,
    "evenement" TEXT NOT NULL,
    "deStatut" TEXT,
    "versStatut" TEXT,
    "commentaire" TEXT,

    CONSTRAINT "sges_historique_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_snapshots_dossiers" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "empreinte" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "auteurId" TEXT,
    "auteurNom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sges_snapshots_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_notifications" (
    "id" TEXT NOT NULL,
    "destinataireId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dossierId" TEXT,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sges_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_journal" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" TEXT,
    "utilisateurNom" TEXT,
    "action" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "objetId" TEXT,
    "details" TEXT,
    "ip" TEXT,

    CONSTRAINT "sges_journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sges_cles_api" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "entiteId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereUtilisation" TIMESTAMP(3),
    "expireLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sges_cles_api_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sges_entites_code_key" ON "sges_entites"("code");

-- CreateIndex
CREATE INDEX "sges_entites_parentId_idx" ON "sges_entites"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_roles_code_key" ON "sges_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_utilisateurs_email_key" ON "sges_utilisateurs"("email");

-- CreateIndex
CREATE INDEX "sges_utilisateurs_entiteId_idx" ON "sges_utilisateurs"("entiteId");

-- CreateIndex
CREATE INDEX "sges_utilisateurs_roleId_idx" ON "sges_utilisateurs"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_taux_change_deviseCode_date_key" ON "sges_taux_change"("deviseCode", "date");

-- CreateIndex
CREATE UNIQUE INDEX "sges_listes_valeurs_liste_code_key" ON "sges_listes_valeurs"("liste", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_modules_questionnaire_code_key" ON "sges_modules_questionnaire"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_secteurs_code_key" ON "sges_secteurs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_regions_code_key" ON "sges_regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_criteres_exclusion_code_key" ON "sges_criteres_exclusion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_questions_categorisation_code_key" ON "sges_questions_categorisation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_thematiques_code_key" ON "sges_thematiques"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sges_blocs_code_key" ON "sges_blocs"("code");

-- CreateIndex
CREATE INDEX "sges_blocs_thematiqueId_idx" ON "sges_blocs"("thematiqueId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_questions_code_key" ON "sges_questions"("code");

-- CreateIndex
CREATE INDEX "sges_questions_blocId_idx" ON "sges_questions"("blocId");

-- CreateIndex
CREATE INDEX "sges_modeles_actions_questionId_idx" ON "sges_modeles_actions"("questionId");

-- CreateIndex
CREATE INDEX "sges_clients_entiteId_idx" ON "sges_clients"("entiteId");

-- CreateIndex
CREATE INDEX "sges_clients_compteCourant_idx" ON "sges_clients"("compteCourant");

-- CreateIndex
CREATE INDEX "sges_clients_secteurId_idx" ON "sges_clients"("secteurId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_dossiers_reference_key" ON "sges_dossiers"("reference");

-- CreateIndex
CREATE INDEX "sges_dossiers_entiteId_idx" ON "sges_dossiers"("entiteId");

-- CreateIndex
CREATE INDEX "sges_dossiers_clientId_idx" ON "sges_dossiers"("clientId");

-- CreateIndex
CREATE INDEX "sges_dossiers_statut_idx" ON "sges_dossiers"("statut");

-- CreateIndex
CREATE INDEX "sges_dossiers_categorie_idx" ON "sges_dossiers"("categorie");

-- CreateIndex
CREATE INDEX "sges_dossiers_chargeId_idx" ON "sges_dossiers"("chargeId");

-- CreateIndex
CREATE INDEX "sges_dossiers_dossierPrecedentId_idx" ON "sges_dossiers"("dossierPrecedentId");

-- CreateIndex
CREATE INDEX "sges_dossiers_regionId_idx" ON "sges_dossiers"("regionId");

-- CreateIndex
CREATE INDEX "sges_dossiers_secteurId_idx" ON "sges_dossiers"("secteurId");

-- CreateIndex
CREATE INDEX "sges_dossiers_valideurId_idx" ON "sges_dossiers"("valideurId");

-- CreateIndex
CREATE INDEX "sges_reponses_exclusion_critereId_idx" ON "sges_reponses_exclusion"("critereId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_reponses_exclusion_dossierId_critereId_key" ON "sges_reponses_exclusion"("dossierId", "critereId");

-- CreateIndex
CREATE INDEX "sges_reponses_categorisation_questionId_idx" ON "sges_reponses_categorisation"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_reponses_categorisation_dossierId_questionId_key" ON "sges_reponses_categorisation"("dossierId", "questionId");

-- CreateIndex
CREATE INDEX "sges_reponses_questionId_idx" ON "sges_reponses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_reponses_dossierId_questionId_key" ON "sges_reponses"("dossierId", "questionId");

-- CreateIndex
CREATE INDEX "sges_actions_dossierId_idx" ON "sges_actions"("dossierId");

-- CreateIndex
CREATE INDEX "sges_suivis_actions_actionId_idx" ON "sges_suivis_actions"("actionId");

-- CreateIndex
CREATE INDEX "sges_visites_dossierId_idx" ON "sges_visites"("dossierId");

-- CreateIndex
CREATE INDEX "sges_visites_visiteurId_idx" ON "sges_visites"("visiteurId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_evaluations_climat_dossierId_key" ON "sges_evaluations_climat"("dossierId");

-- CreateIndex
CREATE INDEX "sges_documents_dossierId_idx" ON "sges_documents"("dossierId");

-- CreateIndex
CREATE INDEX "sges_historique_dossiers_dossierId_idx" ON "sges_historique_dossiers"("dossierId");

-- CreateIndex
CREATE INDEX "sges_snapshots_dossiers_dossierId_idx" ON "sges_snapshots_dossiers"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_snapshots_dossiers_dossierId_version_key" ON "sges_snapshots_dossiers"("dossierId", "version");

-- CreateIndex
CREATE INDEX "sges_notifications_destinataireId_lu_idx" ON "sges_notifications"("destinataireId", "lu");

-- CreateIndex
CREATE INDEX "sges_notifications_dossierId_idx" ON "sges_notifications"("dossierId");

-- CreateIndex
CREATE INDEX "sges_journal_date_idx" ON "sges_journal"("date");

-- CreateIndex
CREATE INDEX "sges_journal_objet_objetId_idx" ON "sges_journal"("objet", "objetId");

-- CreateIndex
CREATE INDEX "sges_journal_utilisateurId_idx" ON "sges_journal"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "sges_cles_api_empreinte_key" ON "sges_cles_api"("empreinte");

-- CreateIndex
CREATE INDEX "sges_cles_api_entiteId_idx" ON "sges_cles_api"("entiteId");

-- AddForeignKey
ALTER TABLE "sges_entites" ADD CONSTRAINT "sges_entites_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sges_entites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_utilisateurs" ADD CONSTRAINT "sges_utilisateurs_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sges_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_utilisateurs" ADD CONSTRAINT "sges_utilisateurs_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "sges_entites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_taux_change" ADD CONSTRAINT "sges_taux_change_deviseCode_fkey" FOREIGN KEY ("deviseCode") REFERENCES "sges_devises"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_blocs" ADD CONSTRAINT "sges_blocs_thematiqueId_fkey" FOREIGN KEY ("thematiqueId") REFERENCES "sges_thematiques"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_questions" ADD CONSTRAINT "sges_questions_blocId_fkey" FOREIGN KEY ("blocId") REFERENCES "sges_blocs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_modeles_actions" ADD CONSTRAINT "sges_modeles_actions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "sges_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_clients" ADD CONSTRAINT "sges_clients_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "sges_entites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_clients" ADD CONSTRAINT "sges_clients_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "sges_secteurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "sges_entites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "sges_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "sges_utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_valideurId_fkey" FOREIGN KEY ("valideurId") REFERENCES "sges_utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "sges_secteurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "sges_regions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_dossiers" ADD CONSTRAINT "sges_dossiers_dossierPrecedentId_fkey" FOREIGN KEY ("dossierPrecedentId") REFERENCES "sges_dossiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses_exclusion" ADD CONSTRAINT "sges_reponses_exclusion_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses_exclusion" ADD CONSTRAINT "sges_reponses_exclusion_critereId_fkey" FOREIGN KEY ("critereId") REFERENCES "sges_criteres_exclusion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses_categorisation" ADD CONSTRAINT "sges_reponses_categorisation_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses_categorisation" ADD CONSTRAINT "sges_reponses_categorisation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "sges_questions_categorisation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses" ADD CONSTRAINT "sges_reponses_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_reponses" ADD CONSTRAINT "sges_reponses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "sges_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_actions" ADD CONSTRAINT "sges_actions_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_suivis_actions" ADD CONSTRAINT "sges_suivis_actions_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "sges_actions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_visites" ADD CONSTRAINT "sges_visites_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_visites" ADD CONSTRAINT "sges_visites_visiteurId_fkey" FOREIGN KEY ("visiteurId") REFERENCES "sges_utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_evaluations_climat" ADD CONSTRAINT "sges_evaluations_climat_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_documents" ADD CONSTRAINT "sges_documents_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_historique_dossiers" ADD CONSTRAINT "sges_historique_dossiers_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_snapshots_dossiers" ADD CONSTRAINT "sges_snapshots_dossiers_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_notifications" ADD CONSTRAINT "sges_notifications_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "sges_utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_notifications" ADD CONSTRAINT "sges_notifications_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "sges_dossiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_journal" ADD CONSTRAINT "sges_journal_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "sges_utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sges_cles_api" ADD CONSTRAINT "sges_cles_api_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "sges_entites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- Schéma réservé à l'application (accès serveur via Prisma) : rien n'est exposé à l'API Supabase.
REVOKE ALL ON SCHEMA sges FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA sges FROM anon, authenticated;
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'sges' LOOP
    EXECUTE format('ALTER TABLE sges.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
