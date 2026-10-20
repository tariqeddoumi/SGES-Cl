import { prisma } from "./prisma";

/**
 * Périmètre multi-entités (groupe › banques › filiales › centres d'affaires › agences).
 *
 *  - LECTURE : son entité et toute sa descendance (la maison mère consulte ses filiales,
 *    jamais l'inverse ; deux banques sœurs ne se voient pas) ;
 *  - ÉCRITURE : sa seule entité, ou toute sa descendance avec la portée « groupe » ;
 *  - administrateur système sans entité : toute la plateforme ; tout autre compte sans
 *    entité : rien (sécurité par défaut) ;
 *  - une entité désactivée ferme l'accès de ses utilisateurs et de ceux de sa descendance.
 */

export interface EntiteArbre {
  id: string;
  code: string;
  nom: string;
  type: string;
  parentId: string | null;
  chemin: string;
  niveau: number;
  pays: string;
  deviseCode: string;
  langueDefaut: string;
  seuilDeclenchement: number | null;
  isActive: boolean;
  nomOutil: string | null;
  logoUrl: string | null;
  couleurPrimaire: string | null;
}

export interface Perimetre {
  tout: boolean;
  entiteId: string | null;
  lecture: string[];
  ecriture: string[];
}

export const PERIMETRE_TOTAL: Perimetre = { tout: true, entiteId: null, lecture: [], ecriture: [] };
export const PERIMETRE_VIDE: Perimetre = { tout: false, entiteId: null, lecture: [], ecriture: [] };

export function cheminDe(id: string, cheminParent: string | null | undefined): string {
  return `${cheminParent ?? "/"}${id}/`;
}

export function descendance(arbre: EntiteArbre[], id: string): string[] {
  const racine = arbre.find((e) => e.id === id);
  if (!racine) return [];
  return arbre.filter((e) => e.chemin.startsWith(racine.chemin)).map((e) => e.id);
}

export function ascendance(arbre: EntiteArbre[], id: string): EntiteArbre[] {
  const parId = new Map(arbre.map((e) => [e.id, e]));
  const chaine: EntiteArbre[] = [];
  const vus = new Set<string>();
  let courant = parId.get(id);
  while (courant && !vus.has(courant.id)) {
    vus.add(courant.id);
    chaine.push(courant);
    courant = courant.parentId ? parId.get(courant.parentId) : undefined;
  }
  return chaine;
}

export function calculerPerimetre(
  arbre: EntiteArbre[],
  compte: { entiteId: string | null; porteeEcriture?: string | null; administrateur?: boolean }
): Perimetre {
  if (!compte.entiteId) return compte.administrateur ? PERIMETRE_TOTAL : PERIMETRE_VIDE;
  const chaine = ascendance(arbre, compte.entiteId);
  if (chaine.length === 0 || chaine.some((e) => !e.isActive)) return { ...PERIMETRE_VIDE, entiteId: compte.entiteId };
  const lecture = descendance(arbre, compte.entiteId);
  const ecriture = compte.porteeEcriture === "groupe" ? lecture : [compte.entiteId];
  return { tout: false, entiteId: compte.entiteId, lecture, ecriture };
}

export function peutLire(p: Perimetre, entiteId: string | null | undefined): boolean {
  return p.tout || (!!entiteId && p.lecture.includes(entiteId));
}

export function peutEcrire(p: Perimetre, entiteId: string | null | undefined): boolean {
  return p.tout || (!!entiteId && p.ecriture.includes(entiteId));
}

/** Filtre Prisma des objets rattachés à une entité (dossiers, clients…). */
export function filtreLecture(p: Perimetre): { entiteId?: { in: string[] } } {
  return p.tout ? {} : { entiteId: { in: p.lecture } };
}

/**
 * Habillage hérité : pour chaque élément, la première valeur renseignée en remontant
 * vers la racine ; ce qui reste vide vient du paramétrage général.
 */
export function habillageHerite(arbre: EntiteArbre[], entiteId: string | null) {
  const chaine = entiteId ? ascendance(arbre, entiteId) : [];
  const premier = (cle: "nomOutil" | "logoUrl" | "couleurPrimaire") =>
    chaine.map((e) => e[cle]).find((v) => v && v.trim()) ?? null;
  return {
    nomOutil: premier("nomOutil"),
    logoUrl: premier("logoUrl"),
    couleurPrimaire: premier("couleurPrimaire"),
    entite: chaine[0]?.nom ?? null,
  };
}

/** Seuil de déclenchement applicable : le plus proche renseigné en remontant, sinon null. */
export function seuilHerite(arbre: EntiteArbre[], entiteId: string): { seuil: number; devise: string } | null {
  for (const e of ascendance(arbre, entiteId)) {
    if (e.seuilDeclenchement !== null && e.seuilDeclenchement !== undefined) return { seuil: e.seuilDeclenchement, devise: e.deviseCode };
  }
  return null;
}

// ─── Arbre en mémoire (30 s) ───────────────────────────────────────────────

let cache: { arbre: EntiteArbre[]; expire: number } | null = null;

export async function chargerArbre(): Promise<EntiteArbre[]> {
  if (cache && cache.expire > Date.now()) return cache.arbre;
  const arbre = await prisma.entite.findMany({
    orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    select: {
      id: true, code: true, nom: true, type: true, parentId: true, chemin: true, niveau: true, pays: true,
      deviseCode: true, langueDefaut: true, seuilDeclenchement: true, isActive: true, nomOutil: true,
      logoUrl: true, couleurPrimaire: true,
    },
  });
  cache = { arbre, expire: Date.now() + 30_000 };
  return arbre;
}

export function oublierArbre(): void {
  cache = null;
}
