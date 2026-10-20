/**
 * Reprise d'une sauvegarde logique dans la base en service (moteur quelconque).
 *   npm run db:importer -- sauvegarde.json            à blanc : contrôle et plan
 *   npm run db:importer -- sauvegarde.json --appliquer
 *
 * La base cible doit être vide (schéma créé par `npm run db:schema`). Les tables sont
 * chargées dans l'ordre des clés étrangères ; les entités, parent avant enfant.
 */
import { readFileSync } from "fs";
import { deserialiser, ORDRE_TABLES, table, volumes } from "../../lib/serveur/sauvegarde";
import { prisma } from "../../lib/serveur/prisma";

async function principal() {
  const [fichier, ...options] = process.argv.slice(2);
  if (!fichier) throw new Error("Usage : npm run db:importer -- sauvegarde.json [--appliquer]");
  const s = JSON.parse(readFileSync(fichier, "utf8"));
  if (s.format !== "sges-sauvegarde") throw new Error("Fichier non reconnu (format sges-sauvegarde attendu).");
  const avant = await volumes();
  const occupees = Object.entries(avant).filter(([, n]) => n > 0);
  if (occupees.length) throw new Error(`La base cible n'est pas vide : ${occupees.map(([t, n]) => `${t} (${n})`).join(", ")}`);
  for (const t of ORDRE_TABLES) console.log(`  ${t.padEnd(24)} ${(s.tables[t] ?? []).length}`);
  if (!options.includes("--appliquer")) {
    console.log("À blanc : rien n'a été écrit. Relancez avec --appliquer.");
    return;
  }
  for (const t of ORDRE_TABLES) {
    const lignes = (s.tables[t] ?? []).map(deserialiser) as Record<string, unknown>[];
    // Lots modestes : SQL Server limite le nombre de paramètres par requête (2 100).
    const taille = t === "document" ? 5 : 50;
    for (let i = 0; i < lignes.length; i += taille) await table(t).createMany({ data: lignes.slice(i, i + taille) });
    process.stdout.write(`✓ ${t} (${lignes.length})\n`);
  }
  const apres = await volumes();
  const ecarts = ORDRE_TABLES.filter((t) => (s.tables[t] ?? []).length !== apres[t]);
  if (ecarts.length) throw new Error(`Écarts de volume : ${ecarts.join(", ")}`);
  console.log("✓ Reprise terminée, volumes identiques.");
}

principal()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
