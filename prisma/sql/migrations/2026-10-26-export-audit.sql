-- Rôle Contrôle / Audit : droit d'export du reporting (26/10/2026). Idempotent.
SET search_path TO sges;
UPDATE "sges_roles" SET "permissions" = replace("permissions", '"reporting:lire"', '"reporting:lire","reporting:exporter"')
  WHERE "code" = 'auditeur' AND "permissions" NOT LIKE '%reporting:exporter%';
