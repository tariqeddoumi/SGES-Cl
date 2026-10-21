import { route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { compteValide, lireSignaletique } from "@/lib/serveur/signaletique";

/** Recherche d'un client par compte courant : base SGES d'abord, puis système central. */
export const GET = route(
  async (_req, ctx, { compte }) => {
    if (!compteValide(compte)) throw new ErreurMetier("Le compte courant doit comporter 20 chiffres.", 400, "validation");
    const existant = await prisma.client.findFirst({ where: { compteCourant: compte, ...filtreLecture(ctx.perimetre) } });
    if (existant) return { existant, signaletique: null };
    const secteurs = await prisma.secteur.findMany({ select: { id: true, code: true } });
    const s = await lireSignaletique(compte);
    return { existant: null, signaletique: s ? { ...s, secteurId: secteurs.find((x) => x.code === s.codeActivite)?.id ?? null } : null };
  },
  { permission: "dossier:lire" }
);
