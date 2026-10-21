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
}

/** Dernier cours connu d'une devise à une date (null si inconnu). */
export function coursA(cours: Cours[], devise: string, reference: string, date: Date = new Date()): number | null {
  if (devise === reference) return 1;
  let meilleur: { t: number; taux: number } | null = null;
  const limite = date.getTime();
  for (const c of cours) {
    if (c.deviseCode !== devise) continue;
    const t = new Date(c.date).getTime();
    if (t <= limite && (!meilleur || t > meilleur.t)) meilleur = { t, taux: c.taux };
  }
  // Aucun cours antérieur : le plus ancien cours connu vaut mieux que rien.
  if (!meilleur) {
    const premiers = cours.filter((c) => c.deviseCode === devise).sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return premiers[0]?.taux ?? null;
  }
  return meilleur.taux;
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
