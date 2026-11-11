/**
 * Nom de l'outil. Le libellé affiché se règle dans Paramétrage › Habillage (APP_NOM) et, par entité,
 * dans l'habillage de l'entité ; cette valeur sert de défaut. Les identifiants techniques gardent le
 * préfixe historique « sges » (schéma de base, tables, références de dossier, en-tête de signature d'API).
 */
export const NOM_OUTIL = "ESG Climat 360";
export const SOUS_TITRE_OUTIL = "Évaluation E&S, climat et ESG des crédits d'investissement";

/** Initiales du pastillon de la barre latérale : premières lettres des deux premiers mots (« EC »). */
export function initialesOutil(nom: string): string {
  const mots = nom.trim().split(/[\s\-_]+/).filter(Boolean);
  return (mots.length > 1 ? mots.slice(0, 2).map((m) => m[0]).join("") : nom.slice(0, 2)).toUpperCase();
}
