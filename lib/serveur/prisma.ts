import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma unique : en développement, le rechargement à chaud recréerait un client
 * (et un pool de connexions) à chaque modification de fichier.
 */
const globalPourPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalPourPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalPourPrisma.prisma = prisma;

/** Moteur de base en service (postgresql, sqlserver, mysql, sqlite), lu de l'adresse. */
export function moteurBase(url = process.env.DATABASE_URL ?? ""): string {
  if (url.startsWith("postgres")) return "postgresql";
  if (url.startsWith("sqlserver")) return "sqlserver";
  if (url.startsWith("mysql")) return "mysql";
  if (url.startsWith("file:")) return "sqlite";
  return "inconnu";
}
