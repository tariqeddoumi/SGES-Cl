import type { Prisma } from "@prisma/client";
import { variantesRecherche } from "../utils";
import type { Contexte } from "./contexte";
import { chargerArbre, filtreLecture, peutLire } from "./perimetre";

/**
 * Filtre des dossiers à partir des paramètres d'URL, commun à la liste des dossiers et à
 * l'export Excel / CSV : ce qui est exporté est exactement ce qui est affiché.
 *
 * statut, categorie, niveau (listes séparées par des virgules), decision, clientId, mes=1,
 * entite (et sa descendance, dans le périmètre), q (recherche), du / au (date du dossier),
 * tous=1 (inclut les dossiers annulés).
 */
export async function filtreDossiers(ctx: Contexte, p: URLSearchParams): Promise<Prisma.DossierWhereInput> {
  const where: Prisma.DossierWhereInput = { ...filtreLecture(ctx.perimetre) };
  if (p.get("statut")) where.statut = { in: p.get("statut")!.split(",") };
  else if (p.get("tous") !== "1") where.statut = { not: "annule" };
  if (p.get("categorie")) where.categorie = { in: p.get("categorie")!.split(",") };
  if (p.get("niveau")) where.niveauRisque = { in: p.get("niveau")!.split(",") };
  if (p.get("decision")) where.decision = p.get("decision");
  if (p.get("clientId")) where.clientId = p.get("clientId")!;
  if (p.get("mes") === "1") where.chargeId = ctx.utilisateur.id;
  if (p.get("du") || p.get("au")) {
    where.dateDossier = { gte: p.get("du") ? new Date(p.get("du")!) : undefined, lte: p.get("au") ? new Date(`${p.get("au")}T23:59:59`) : undefined };
  }
  if (p.get("entite")) {
    // Une entité et toute sa descendance, dans la limite du périmètre.
    const arbre = await chargerArbre();
    const racine = arbre.find((e) => e.id === p.get("entite"));
    if (racine) where.entiteId = { in: arbre.filter((e) => e.chemin.startsWith(racine.chemin) && peutLire(ctx.perimetre, e.id)).map((e) => e.id) };
  }
  const q = p.get("q")?.trim();
  if (q) {
    where.OR = variantesRecherche(q).flatMap((v) => [
      { reference: { contains: v } },
      { objet: { contains: v } },
      { client: { raisonSociale: { contains: v } } },
      { client: { compteCourant: { contains: v } } },
    ]);
  }
  return where;
}
