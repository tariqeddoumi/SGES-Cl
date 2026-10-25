-- Constats P1 de l'audit du 23/10/2026 — migration d'une base « sges » existante (PostgreSQL / Supabase).
-- Idempotente pour les ajouts de colonnes ; à exécuter une fois.
SET search_path TO sges;

-- F10 : montants et cours en DECIMAL exact (arrondi explicite à la conversion).
ALTER TABLE sges_entites ALTER COLUMN "seuilDeclenchement" TYPE DECIMAL(20,2) USING round("seuilDeclenchement"::numeric, 2);
ALTER TABLE sges_taux_change ALTER COLUMN "taux" TYPE DECIMAL(24,10) USING round("taux"::numeric, 10);
ALTER TABLE sges_dossiers
  ALTER COLUMN "montantDemande" TYPE DECIMAL(20,2) USING round("montantDemande"::numeric, 2),
  ALTER COLUMN "montantInvestissement" TYPE DECIMAL(20,2) USING round("montantInvestissement"::numeric, 2),
  ALTER COLUMN "tauxReference" TYPE DECIMAL(24,10) USING round("tauxReference"::numeric, 10),
  ALTER COLUMN "montantDemandeRef" TYPE DECIMAL(20,2) USING round("montantDemandeRef"::numeric, 2),
  ALTER COLUMN "montantInvestissementRef" TYPE DECIMAL(20,2) USING round("montantInvestissementRef"::numeric, 2),
  ALTER COLUMN "montantAccorde" TYPE DECIMAL(20,2) USING round("montantAccorde"::numeric, 2);
ALTER TABLE sges_actions ALTER COLUMN "budget" TYPE DECIMAL(20,2) USING round("budget"::numeric, 2);

-- F09 : cours figé avec sa devise, sa date et sa source.
ALTER TABLE sges_dossiers
  ADD COLUMN IF NOT EXISTS "deviseCoursReference" TEXT,
  ADD COLUMN IF NOT EXISTS "dateCoursReference" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sourceCoursReference" TEXT,
-- F11 : empreinte du référentiel ayant produit l'évaluation.
  ADD COLUMN IF NOT EXISTS "versionReferentiel" TEXT,
-- F06 : encours à date (base PCAF).
  ADD COLUMN IF NOT EXISTS "encours" DECIMAL(20,2),
  ADD COLUMN IF NOT EXISTS "dateEncours" TIMESTAMP(3);

-- F05 à F08 : couverture des données, base d'attribution, provenance et vérification des émissions, version de méthode.
ALTER TABLE sges_evaluations_climat
  ADD COLUMN IF NOT EXISTS "emissionsVerifiees" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sourceEmissions" TEXT,
  ADD COLUMN IF NOT EXISTS "baseAttribution" TEXT,
  ADD COLUMN IF NOT EXISTS "montantAttribueRef" DECIMAL(20,2),
  ADD COLUMN IF NOT EXISTS "facteurAttribution" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dateArrete" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "couvertureDonnees" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "methodeVersion" TEXT;

-- F13 : nature des critères d'exclusion et dérogations motivées.
ALTER TABLE sges_criteres_exclusion
  ADD COLUMN IF NOT EXISTS "nature" TEXT NOT NULL DEFAULT 'politique_groupe',
  ADD COLUMN IF NOT EXISTS "derogeable" BOOLEAN NOT NULL DEFAULT false;
UPDATE sges_criteres_exclusion SET "nature" = 'exclusion_bailleur', "derogeable" = true WHERE "source" = 'SFI';
UPDATE sges_criteres_exclusion SET "nature" = 'interdiction_legale', "derogeable" = false WHERE "code" IN ('EXC01', 'EXC09');
UPDATE sges_criteres_exclusion SET "nature" = 'politique_groupe', "derogeable" = true WHERE "code" IN ('EXC15', 'EXC16');
ALTER TABLE sges_reponses_exclusion
  ADD COLUMN IF NOT EXISTS "derogation" TEXT,
  ADD COLUMN IF NOT EXISTS "derogationParId" TEXT,
  ADD COLUMN IF NOT EXISTS "derogationParNom" TEXT,
  ADD COLUMN IF NOT EXISTS "derogationLe" TIMESTAMP(3);
UPDATE sges_roles SET "permissions" = replace("permissions", '"dossier:reclassifier"', '"dossier:reclassifier","exclusion:deroger"')
  WHERE "code" IN ('responsable_rse', 'admin_systeme') AND "permissions" NOT LIKE '%exclusion:deroger%';
