/**
 * Bascule le schéma Prisma vers un autre moteur de base de données.
 *
 *   npm run db:fournisseur -- postgresql | sqlserver | mysql | sqlite
 *
 * Le schéma de référence (prisma/schema.prisma) est écrit pour PostgreSQL et reste
 * portable (voir l'en-tête du schéma). Ce script ne touche que deux choses :
 *   - le fournisseur de la source de données ;
 *   - l'annotation des textes longs : @db.Text (PostgreSQL, MySQL),
 *     @db.NVarChar(Max) (SQL Server, Unicode : indispensable pour l'arabe), rien (SQLite).
 *
 * Il est idempotent : on peut passer d'un moteur à l'autre et revenir.
 * Ensuite : npx prisma generate && npm run db:schema.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const FOURNISSEURS = ["postgresql", "sqlserver", "mysql", "sqlite"] as const;
export type Fournisseur = (typeof FOURNISSEURS)[number];

const ANNOTATIONS_TEXTE = /\s@db\.(Text|NVarChar\(Max\))/g;

export function convertirSchema(schema: string, cible: Fournisseur): string {
  // Ramène d'abord le schéma à sa forme de référence (PostgreSQL)…
  let sortie = schema.replace(ANNOTATIONS_TEXTE, " @db.Text");
  // …y compris les champs déjà dépouillés pour SQLite : ils sont repérés par le
  // marqueur de commentaire laissé lors de la conversion.
  sortie = sortie.replace(/ \/\/ texte-long$/gm, " @db.Text");
  sortie = sortie.replace(
    /(datasource db \{[\s\S]*?provider\s*=\s*)"[a-z]+"/,
    `$1"${cible}"`
  );
  if (cible === "sqlserver") sortie = sortie.replace(/ @db\.Text/g, " @db.NVarChar(Max)");
  if (cible === "sqlite") sortie = sortie.replace(/ @db\.Text(.*)$/gm, "$1 // texte-long");
  return sortie;
}

function principal() {
  const cible = process.argv[2] as Fournisseur | undefined;
  if (!cible || !FOURNISSEURS.includes(cible)) {
    console.error(`Usage : npm run db:fournisseur -- ${FOURNISSEURS.join(" | ")}`);
    process.exit(1);
  }
  const chemin = join(process.cwd(), "prisma", "schema.prisma");
  const avant = readFileSync(chemin, "utf8");
  writeFileSync(chemin, convertirSchema(avant, cible));
  console.log(`✓ Schéma converti pour ${cible}.`);
  console.log("  Étapes suivantes :");
  console.log("  1. DATABASE_URL vers la base cible (voir .env.example)");
  console.log("  2. npx prisma generate");
  console.log("  3. npm run db:schema   (création des tables)");
  console.log("  4. npm run db:seed     (référentiels + comptes initiaux) ou npm run db:importer");
}

if (require.main === module) principal();
