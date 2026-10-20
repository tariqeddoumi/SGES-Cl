import { CATALOGUE_PARAMETRES, valeursParDefaut, type Parametres } from "../parametres";
import { prisma } from "./prisma";

let cache: { valeurs: Parametres; expire: number } | null = null;

/** Paramètres généraux : valeurs en base, complétées des valeurs par défaut (cache 30 s). */
export async function chargerParametres(): Promise<Parametres> {
  if (cache && cache.expire > Date.now()) return cache.valeurs;
  const valeurs = valeursParDefaut();
  try {
    const lignes = await prisma.parametre.findMany();
    for (const l of lignes) valeurs[l.cle] = l.valeur;
  } catch {
    // Base indisponible ou pas encore créée : l'outil démarre avec les valeurs par défaut.
  }
  cache = { valeurs, expire: Date.now() + 30_000 };
  return valeurs;
}

export function oublierParametres(): void {
  cache = null;
}

/** Sous-ensemble diffusable au navigateur. */
export function parametresPublics(p: Parametres): Parametres {
  const publics = new Set(CATALOGUE_PARAMETRES.filter((d) => d.public).map((d) => d.cle));
  return Object.fromEntries(Object.entries(p).filter(([k]) => publics.has(k)));
}
