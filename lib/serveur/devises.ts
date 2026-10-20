import { convertir, coursA, type Cours } from "../devises";
import { chargerParametres } from "./parametres";
import { prisma } from "./prisma";

let cache: { cours: Cours[]; expire: number } | null = null;

export async function chargerCours(): Promise<Cours[]> {
  if (cache && cache.expire > Date.now()) return cache.cours;
  const lignes = await prisma.tauxChange.findMany({ orderBy: { date: "asc" }, select: { deviseCode: true, date: true, taux: true } });
  cache = { cours: lignes, expire: Date.now() + 60_000 };
  return lignes;
}

export function oublierCours(): void {
  cache = null;
}

export async function deviseReference(): Promise<string> {
  return (await chargerParametres()).DEVISE_REFERENCE || "MAD";
}

/** Conversion vers la devise de référence ; lève une erreur métier si le cours manque. */
export async function versReference(montant: number, devise: string, date = new Date()): Promise<{ montant: number; taux: number }> {
  const ref = await deviseReference();
  const cours = await chargerCours();
  const taux = coursA(cours, devise, ref, date);
  if (taux === null) throw new ErreurCours(devise, ref);
  return { montant: montant * taux, taux };
}

export async function convertirMontant(montant: number, de: string, vers: string, date = new Date()): Promise<number | null> {
  return convertir(montant, de, vers, await chargerCours(), await deviseReference(), date);
}

export class ErreurCours extends Error {
  constructor(public devise: string, public reference: string) {
    super(`Aucun cours de change ${devise} → ${reference} n'est renseigné (Paramétrage › Devises).`);
  }
}
