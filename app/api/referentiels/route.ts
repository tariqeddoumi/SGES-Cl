import { route } from "@/lib/serveur/api";
import { chargerArbre } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/**
 * Référentiels nécessaires aux formulaires (libellés multilingues bruts : l'interface
 * les lit dans la langue de l'utilisateur). Les entités sont limitées au périmètre.
 */
export const GET = route(async (_req, ctx) => {
  const [listes, secteurs, regions, devises, criteres, questionsCat] = await Promise.all([
    prisma.listeValeur.findMany({ where: { actif: true }, orderBy: [{ liste: "asc" }, { ordre: "asc" }] }),
    prisma.secteur.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
    prisma.region.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
    prisma.devise.findMany({ where: { active: true }, orderBy: { ordre: "asc" } }),
    prisma.critereExclusion.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
    prisma.questionCategorisation.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
  ]);
  const arbre = await chargerArbre();
  const entites = arbre
    .filter((e) => ctx.perimetre.tout || ctx.perimetre.lecture.includes(e.id))
    .map((e) => ({ id: e.id, code: e.code, nom: e.nom, type: e.type, niveau: e.niveau, deviseCode: e.deviseCode, ecriture: ctx.perimetre.tout || ctx.perimetre.ecriture.includes(e.id) }));
  const parListe: Record<string, { code: string; libelle: string; extra: string | null }[]> = {};
  for (const l of listes) (parListe[l.liste] ??= []).push({ code: l.code, libelle: l.libelle, extra: l.extra });
  return { listes: parListe, secteurs, regions, devises, entites, criteres, questionsCategorisation: questionsCat };
});
