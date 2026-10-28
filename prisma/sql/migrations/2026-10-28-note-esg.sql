-- Note ESG (lib/domaine/esg.ts) : pilier des questions et notes du dossier (28/10/2026). Idempotent.
-- Les dossiers existants reçoivent leur note au prochain enregistrement (recalcul) ; la note « à
-- l'octroi » des dossiers déjà soumis reste vide (elle n'est pas reconstituée a posteriori).
SET search_path TO sges;

ALTER TABLE "sges_questions" ADD COLUMN IF NOT EXISTS "pilier" TEXT;
ALTER TABLE "sges_dossiers" ADD COLUMN IF NOT EXISTS "detailESG" TEXT,
  ADD COLUMN IF NOT EXISTS "noteESG" TEXT,
  ADD COLUMN IF NOT EXISTS "noteESGOctroi" TEXT,
  ADD COLUMN IF NOT EXISTS "scoreESG" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreESGOctroi" DOUBLE PRECISION;

-- Pilier des questions qui ne suivent pas celui de leur thématique.
UPDATE "sges_questions" q SET "pilier" = m.p FROM (VALUES
  ('SGE01','G'),('SGE02','G'),('SGE03','G'),('CERT01','G'),('CERT02','G'),('URG01','S'),('URG02','S'),('NP06','E'),('NP09','G')
) AS m(c, p) WHERE q."code" = m.c AND q."pilier" IS NULL;
