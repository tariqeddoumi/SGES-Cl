/**
 * Libellés multilingues des référentiels.
 *
 * Stockés en texte (schéma portable) sous la forme {"fr": "...", "en": "...", "ar": "..."}.
 * Une langue manquante retombe sur le français, puis sur la première langue renseignée :
 * un référentiel partiellement traduit reste lisible.
 */

export type Libelle = Record<string, string>;

export function lireLibelle(texte: string | Libelle | null | undefined): Libelle {
  if (!texte) return {};
  if (typeof texte === "object") return texte;
  const t = texte.trim();
  if (t.startsWith("{")) {
    try {
      const o = JSON.parse(t);
      if (o && typeof o === "object") return o as Libelle;
    } catch {
      /* texte simple */
    }
  }
  return { fr: texte };
}

export function libelle(texte: string | Libelle | null | undefined, langue: string, repli = "fr"): string {
  const l = lireLibelle(texte);
  return l[langue]?.trim() || l[repli]?.trim() || Object.values(l).find((v) => v?.trim()) || "";
}

export function ecrireLibelle(l: Libelle): string {
  const propre: Libelle = {};
  for (const [k, v] of Object.entries(l)) if (typeof v === "string" && v.trim()) propre[k] = v.trim();
  return JSON.stringify(propre);
}

/** Langues pour lesquelles une traduction manque. */
export function traductionsManquantes(texte: string | Libelle | null | undefined, langues: string[]): string[] {
  const l = lireLibelle(texte);
  return langues.filter((c) => !l[c]?.trim());
}
