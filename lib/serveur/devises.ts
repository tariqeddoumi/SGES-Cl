import { convertir, coursRetenu, type Cours } from "../devises";
import { nombre } from "../parametres";
import { chargerParametres } from "./parametres";
import { prisma } from "./prisma";

let cache: { cours: Cours[]; expire: number } | null = null;

export async function chargerCours(): Promise<Cours[]> {
  if (cache && cache.expire > Date.now()) return cache.cours;
  const lignes = await prisma.tauxChange.findMany({ orderBy: { date: "asc" }, select: { deviseCode: true, date: true, taux: true, source: true } });
  cache = { cours: lignes, expire: Date.now() + 60_000 };
  return lignes;
}

export function oublierCours(): void {
  cache = null;
}

export async function deviseReference(): Promise<string> {
  return (await chargerParametres()).DEVISE_REFERENCE || "MAD";
}

/**
 * Conversion vers la devise de référence au cours applicable à `date` (jamais un cours postérieur,
 * ni un cours plus ancien que COURS_VALIDITE_JOURS si ce paramètre est > 0). Lève une erreur métier
 * si aucun cours n'est admissible : la conversion est bloquée plutôt qu'approximée.
 */
export async function versReference(montant: number, devise: string, date = new Date()): Promise<{ montant: number; taux: number; dateCours: Date | null; source: string | null }> {
  const p = await chargerParametres();
  const ref = p.DEVISE_REFERENCE || "MAD";
  const r = coursRetenu(await chargerCours(), devise, ref, date, nombre(p, "COURS_VALIDITE_JOURS", 0));
  if (!r) throw new ErreurCours(devise, ref, date);
  return { montant: montant * r.taux, taux: r.taux, dateCours: r.date ?? date, source: r.source };
}

export async function convertirMontant(montant: number, de: string, vers: string, date = new Date()): Promise<number | null> {
  return convertir(montant, de, vers, await chargerCours(), await deviseReference(), date);
}

export class ErreurCours extends Error {
  constructor(public devise: string, public reference: string, public date?: Date) {
    super(
      `Aucun cours de change ${devise} → ${reference} admissible${date ? ` au ${date.toISOString().slice(0, 10)}` : ""} : ` +
        "renseignez le cours publié à cette date (Paramétrage › Taux de change). Un cours postérieur n'est jamais appliqué."
    );
  }
}
