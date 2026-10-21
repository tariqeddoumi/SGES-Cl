import { prisma } from "./prisma";

/**
 * Sauvegarde logique portable : toutes les tables, dans l'ordre des clés étrangères.
 * Le même format se relit sur n'importe quel moteur (PostgreSQL, SQL Server, MySQL,
 * SQLite) : c'est l'outil de reprise d'une base vers un autre moteur.
 */
export const ORDRE_TABLES = [
  "langue", "devise", "tauxChange", "parametre", "listeValeur", "secteur", "region", "role", "entite", "utilisateur",
  "critereExclusion", "questionCategorisation", "thematique", "bloc", "question", "modeleAction",
  "client", "dossier", "reponseExclusion", "reponseCategorisation", "reponseQuestion", "action", "suiviAction",
  "visite", "evaluationClimat", "document", "historiqueDossier", "notification", "journal", "cleApi",
] as const;

export type Table = (typeof ORDRE_TABLES)[number];

type Delegue = { findMany: (a?: unknown) => Promise<Record<string, unknown>[]>; count: () => Promise<number>; createMany: (a: unknown) => Promise<{ count: number }> };
export const table = (t: Table) => (prisma as unknown as Record<string, Delegue>)[t];

export async function volumes(): Promise<Record<string, number>> {
  const r: Record<string, number> = {};
  for (const t of ORDRE_TABLES) r[t] = await table(t).count();
  return r;
}

/** Sérialisation JSON fidèle : dates en ISO, contenus binaires en base64. */
export function serialiser(v: unknown): unknown {
  if (v instanceof Date) return { $date: v.toISOString() };
  if (v instanceof Uint8Array) return { $bytes: Buffer.from(v).toString("base64") };
  if (Array.isArray(v)) return v.map(serialiser);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialiser(x)]));
  return v;
}

export function deserialiser(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(deserialiser);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.$date === "string") return new Date(o.$date);
    if (typeof o.$bytes === "string") return Buffer.from(o.$bytes, "base64");
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, deserialiser(x)]));
  }
  return v;
}

export async function exporterTout(options: { sansDocuments?: boolean } = {}) {
  const tables: Record<string, unknown[]> = {};
  for (const t of ORDRE_TABLES) {
    if (t === "document" && options.sansDocuments) continue;
    // Entités : parent avant enfant (chemin matérialisé croissant).
    const lignes = await table(t).findMany(t === "entite" ? { orderBy: { niveau: "asc" } } : undefined);
    tables[t] = lignes.map(serialiser);
  }
  return { format: "sges-sauvegarde", version: 1, date: new Date().toISOString(), tables };
}
