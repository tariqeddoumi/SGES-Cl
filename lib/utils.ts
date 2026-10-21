import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind en résolvant les conflits (la dernière l'emporte). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Normalise une date : objet, chaîne ISO ou rien. */
export function versDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date au format d'un champ <input type="date"> (AAAA-MM-JJ). */
export function dateInput(v: Date | string | null | undefined): string {
  const d = versDate(v);
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Lecture tolérante d'un JSON stocké en texte (schéma portable). */
export function lireJson<T>(texte: string | null | undefined, defaut: T): T {
  if (!texte) return defaut;
  try {
    return JSON.parse(texte) as T;
  } catch {
    return defaut;
  }
}

export function borner(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function arrondir(v: number, decimales = 1): number {
  const f = 10 ** decimales;
  return Math.round(v * f) / f;
}

/**
 * Variantes de casse d'un terme de recherche. `mode: "insensitive"` de Prisma n'existe
 * que sur PostgreSQL : chercher ces variantes garde une recherche tolérante sur tous les
 * moteurs (SQL Server et MySQL sont déjà insensibles à la casse par défaut).
 */
export function variantesRecherche(q: string): string[] {
  const s = q.trim();
  const capitalise = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const titre = s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  return Array.from(new Set([s, s.toLowerCase(), s.toUpperCase(), capitalise, titre]));
}
