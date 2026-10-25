/**
 * Masquage des données personnelles et bancaires avant tout envoi à un service d'IA externe
 * (loi 09-08 / CNDP : minimisation des données transmises). Le masquage porte sur les
 * identifiants structurés ; les noms de personnes dans un texte libre ne sont pas détectables
 * de façon fiable : la politique de confidentialité et le choix du fournisseur restent requis.
 */

export interface ResultatAnonymisation {
  texte: string;
  masques: Record<string, number>;
}

const REGLES: { type: string; re: RegExp; remplacement: string }[] = [
  { type: "email", re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, remplacement: "[EMAIL]" },
  { type: "iban", re: /\bMA\s?\d{2}(?:[ -]?\d{4}){5,6}\b/gi, remplacement: "[IBAN]" },
  { type: "rib", re: /\b(?:\d[ .-]?){24}\b/g, remplacement: "[RIB]" },
  { type: "compte", re: /\b\d{20}\b/g, remplacement: "[COMPTE]" },
  { type: "ice", re: /\b(?:ICE\s*:?\s*)?\d{15}\b/gi, remplacement: "[ICE]" },
  { type: "cin", re: /\b(?:CIN|C\.I\.N\.?)\s*(?:n°|no|:)?\s*[A-Z]{1,2}\d{5,8}\b/gi, remplacement: "[CIN]" },
  { type: "telephone", re: /(?:\+212|00212|\b0)[\s.-]?[5-7](?:[\s.-]?\d{2}){4}\b/g, remplacement: "[TEL]" },
];

export function anonymiser(texte: string): ResultatAnonymisation {
  const masques: Record<string, number> = {};
  let t = texte;
  for (const r of REGLES) {
    t = t.replace(r.re, () => {
      masques[r.type] = (masques[r.type] ?? 0) + 1;
      return r.remplacement;
    });
  }
  return { texte: t, masques };
}
