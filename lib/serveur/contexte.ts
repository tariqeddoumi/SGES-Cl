import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { lirePermissions, type Permission } from "../permissions";
import { COOKIE_LANGUE, COOKIE_SESSION, lireJeton } from "../session-jeton";
import { calculerPerimetre, chargerArbre, type Perimetre } from "./perimetre";
import { chargerParametres } from "./parametres";
import { prisma } from "./prisma";

/** Utilisateur authentifié et tout ce qu'une route doit savoir de lui. */
export interface Contexte {
  utilisateur: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    matricule: string | null;
    entiteId: string | null;
    roleCode: string;
    roleLibelle: string;
    langue: string;
    deviseAffichage: string | null;
    doitChangerMdp: boolean;
  };
  permissions: Permission[];
  perimetre: Perimetre;
  langue: string;
}

export class ErreurMetier extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "erreur_metier",
    public details?: unknown
  ) {
    super(message);
  }
}

export const nonAutorise = () => new ErreurMetier("Session absente ou expirée.", 401, "non_authentifie");
export const interdit = (msg = "Droits insuffisants pour cette opération.") => new ErreurMetier(msg, 403, "interdit");
export const introuvable = (msg = "Élément introuvable.") => new ErreurMetier(msg, 404, "introuvable");

async function contexteDepuisJeton(jeton: string | undefined, langueCookie?: string): Promise<Contexte | null> {
  const contenu = await lireJeton(jeton);
  if (!contenu) return null;
  const u = await prisma.utilisateur.findUnique({
    where: { id: contenu.sub },
    include: { role: true },
  });
  // Compte désactivé ou supprimé : la session est révoquée immédiatement.
  if (!u || !u.isActive) return null;
  const permissions = lirePermissions(u.role.permissions);
  const arbre = await chargerArbre();
  const perimetre = calculerPerimetre(arbre, {
    entiteId: u.entiteId,
    porteeEcriture: u.porteeEcriture,
    administrateur: permissions.includes("admin:entites"),
  });
  const parametres = await chargerParametres();
  return {
    utilisateur: {
      id: u.id,
      email: u.email,
      nom: u.nom,
      prenom: u.prenom,
      matricule: u.matricule,
      entiteId: u.entiteId,
      roleCode: u.role.code,
      roleLibelle: u.role.libelle,
      langue: u.langue,
      deviseAffichage: u.deviseAffichage,
      doitChangerMdp: u.doitChangerMdp,
    },
    permissions,
    perimetre,
    langue: langueCookie || u.langue || parametres.LANGUE_DEFAUT || "fr",
  };
}

/** Contexte d'une route d'API (null si non authentifié). */
export async function contexteRequete(req: NextRequest): Promise<Contexte | null> {
  return contexteDepuisJeton(req.cookies.get(COOKIE_SESSION)?.value, req.cookies.get(COOKIE_LANGUE)?.value);
}

/** Contexte d'un composant serveur (null si non authentifié). */
export async function contexteServeur(): Promise<Contexte | null> {
  const c = await cookies();
  return contexteDepuisJeton(c.get(COOKIE_SESSION)?.value, c.get(COOKIE_LANGUE)?.value);
}

export function exiger(ctx: Contexte, ...permissions: Permission[]): void {
  for (const p of permissions) if (!ctx.permissions.includes(p)) throw interdit();
}

export function nomComplet(u: { prenom: string; nom: string }): string {
  return `${u.prenom} ${u.nom}`.trim();
}
