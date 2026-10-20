import { ar } from "./messages/ar";
import { en } from "./messages/en";
import { fr, type Messages } from "./messages/fr";

/**
 * Langues de l'interface. Une langue ajoutée dans Paramétrage › Langues sans
 * dictionnaire d'interface s'affiche en français pour l'interface, mais ses libellés
 * de référentiel (questions, listes, secteurs…) sont bien utilisés.
 */
export const DICTIONNAIRES: Record<string, Messages> = { fr, en, ar };
export const LANGUES_RTL = new Set(["ar", "he", "fa", "ur"]);

export function dictionnaire(langue: string): Messages {
  return DICTIONNAIRES[langue] ?? fr;
}

export type Variables = Record<string, string | number>;

/** Lit une clé pointée (« dossier.reference ») et remplace les variables {nom}. */
export function traduire(messages: Messages, cle: string, vars?: Variables): string {
  let v: unknown = messages;
  for (const p of cle.split(".")) {
    v = v && typeof v === "object" ? (v as Record<string, unknown>)[p] : undefined;
  }
  if (typeof v !== "string") {
    // Repli sur le français, puis sur la clé (visible, donc corrigeable).
    if (messages !== fr) return traduire(fr, cle, vars);
    return cle;
  }
  return vars ? v.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : v;
}

export type { Messages };
