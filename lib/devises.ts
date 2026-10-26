/**
 * Multi-devises.
 *
 * Chaque cours exprime la valeur d'une unité de devise en devise de référence (MAD par
 * défaut, paramètre DEVISE_REFERENCE) à une date. La conversion entre deux devises
 * passe par la devise de référence ; le cours retenu est le dernier connu à la date.
 */

export interface Cours {
  deviseCode: string;
  date: Date | string;
  taux: number;
  source?: string | null;
}

export interface CoursRetenu {
  taux: number;
  /** Date du cours appliqué (null pour la devise de référence elle-même). */
  date: Date | null;
  source: string | null;
}

const JOUR = 86_400_000;

/**
 * Cours applicable à une date : le dernier cours publié AU PLUS TARD à cette date.
 * Jamais de cours postérieur (un cours de janvier ne convertit pas un dossier de décembre) ;
 * si `validiteJours` > 0, un cours plus ancien que cette durée n'est plus admis. Sans cours
 * admissible : null — la conversion est bloquée plutôt qu'approximée.
 */
export function coursRetenu(cours: Cours[], devise: string, reference: string, date: Date = new Date(), validiteJours = 0): CoursRetenu | null {
  if (devise === reference) return { taux: 1, date: null, source: null };
  let meilleur: { t: number; c: Cours } | null = null;
  const limite = date.getTime();
  for (const c of cours) {
    if (c.deviseCode !== devise) continue;
    const t = new Date(c.date).getTime();
    if (t <= limite && (!meilleur || t > meilleur.t)) meilleur = { t, c };
  }
  if (!meilleur || !(meilleur.c.taux > 0)) return null;
  if (validiteJours > 0 && limite - meilleur.t > validiteJours * JOUR) return null;
  return { taux: meilleur.c.taux, date: new Date(meilleur.t), source: meilleur.c.source ?? null };
}

/** Cours applicable à une date (null si aucun cours admissible). */
export function coursA(cours: Cours[], devise: string, reference: string, date: Date = new Date(), validiteJours = 0): number | null {
  return coursRetenu(cours, devise, reference, date, validiteJours)?.taux ?? null;
}

export function convertir(
  montant: number,
  de: string,
  vers: string,
  cours: Cours[],
  reference: string,
  date: Date = new Date()
): number | null {
  if (de === vers) return montant;
  const tDe = coursA(cours, de, reference, date);
  const tVers = coursA(cours, vers, reference, date);
  if (tDe === null || tVers === null || tVers === 0) return null;
  return (montant * tDe) / tVers;
}

/**
 * Arrondi explicite d'un montant à la précision de sa devise (ISO 4217 : 2 décimales pour MAD, EUR, USD ;
 * 0 pour XOF, XAF ; 3 pour TND…), demi-unité arrondie à l'unité supérieure en valeur absolue.
 * Tout montant calculé (contre-valeur, conversion) est arrondi avant d'être stocké ou comparé à un seuil.
 */
export function arrondirMontant(montant: number, decimales = 2): number {
  const f = 10 ** decimales;
  const v = Math.round(Math.abs(montant) * f + 1e-7) / f;
  return montant < 0 ? -v : v;
}

const LOCALES: Record<string, string> = { fr: "fr-FR", en: "en-GB", ar: "ar-MA" };

export function localeIntl(langue: string): string {
  return LOCALES[langue] ?? langue;
}

/** Montant complet : « 12 500 000 MAD ». */
export function formatMontant(montant: number | null | undefined, devise: string, langue = "fr", decimales = 0): string {
  if (montant === null || montant === undefined || !Number.isFinite(montant)) return "—";
  const n = new Intl.NumberFormat(localeIntl(langue), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    numberingSystem: "latn",
  }).format(montant);
  return `${n} ${devise}`;
}

/** Montant abrégé pour tableaux et indicateurs : « 12,5 M MAD », « 1,2 Md MAD ». */
export function formatMontantCompact(montant: number | null | undefined, devise: string, langue = "fr"): string {
  if (montant === null || montant === undefined || !Number.isFinite(montant)) return "—";
  const abs = Math.abs(montant);
  const fmt = (n: number, d: number) =>
    new Intl.NumberFormat(localeIntl(langue), { maximumFractionDigits: d, numberingSystem: "latn" }).format(n);
  const u =
    langue === "en"
      ? { md: "bn", m: "m", k: "k" }
      : langue === "ar"
        ? { md: "مليار", m: "مليون", k: "ألف" }
        : { md: "Md", m: "M", k: "k" };
  if (abs >= 1e9) return `${fmt(montant / 1e9, 2)} ${u.md} ${devise}`;
  if (abs >= 1e6) return `${fmt(montant / 1e6, 1)} ${u.m} ${devise}`;
  if (abs >= 1e4) return `${fmt(montant / 1e3, 0)} ${u.k} ${devise}`;
  return `${fmt(montant, 0)} ${devise}`;
}

export function formatNombre(n: number | null | undefined, langue = "fr", decimales = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(localeIntl(langue), { maximumFractionDigits: decimales, numberingSystem: "latn" }).format(n);
}

export function formatDate(d: Date | string | null | undefined, langue = "fr"): string {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return new Intl.DateTimeFormat(localeIntl(langue), { day: "2-digit", month: "2-digit", year: "numeric", numberingSystem: "latn" }).format(x);
}

export function formatDateHeure(d: Date | string | null | undefined, langue = "fr"): string {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return new Intl.DateTimeFormat(localeIntl(langue), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(x);
}
