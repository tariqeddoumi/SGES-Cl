/**
 * Sauvegarde logique complète de la base en service (JSON portable entre moteurs).
 *   npm run db:exporter -- [fichier.json] [--sans-documents]
 */
import { writeFileSync } from "fs";
import { exporterTout } from "../../lib/serveur/sauvegarde";
import { prisma } from "../../lib/serveur/prisma";

async function principal() {
  const args = process.argv.slice(2);
  const fichier = args.find((a) => !a.startsWith("--")) ?? `sges-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  const s = await exporterTout({ sansDocuments: args.includes("--sans-documents") });
  writeFileSync(fichier, JSON.stringify(s));
  for (const [t, l] of Object.entries(s.tables)) console.log(`  ${t.padEnd(24)} ${l.length}`);
  console.log(`✓ Sauvegarde écrite : ${fichier}`);
}

principal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
