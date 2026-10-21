import type { Prisma } from "@prisma/client";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { filtreLecture, peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaClient } from "@/lib/serveur/schemas-client";
import { variantesRecherche } from "@/lib/utils";

export const GET = route(
  async (req, ctx) => {
    const p = req.nextUrl.searchParams;
    const where: Prisma.ClientWhereInput = { ...filtreLecture(ctx.perimetre) };
    const q = p.get("q")?.trim();
    if (q) where.OR = variantesRecherche(q).flatMap((v) => [{ raisonSociale: { contains: v } }, { compteCourant: { contains: v } }, { codeClient: { contains: v } }, { ice: { contains: v } }]);
    const taille = Math.min(200, Number(p.get("taille")) || 50);
    const page = Math.max(1, Number(p.get("page")) || 1);
    const [total, lignes] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { raisonSociale: "asc" },
        skip: (page - 1) * taille,
        take: taille,
        include: { entite: { select: { code: true, nom: true } }, secteur: { select: { code: true, libelle: true } }, _count: { select: { dossiers: true } } },
      }),
    ]);
    return { total, page, taille, lignes };
  },
  { permission: "dossier:lire" }
);

export const POST = route(
  async (req, ctx) => {
    const data = SchemaClient.parse(await corps(req));
    const entiteId = data.entiteId ?? ctx.utilisateur.entiteId;
    if (!entiteId || !peutEcrire(ctx.perimetre, entiteId)) throw interdit("Choisissez une entité de rattachement dans votre périmètre.");
    if (data.compteCourant) {
      // Unicité contrôlée par l'application (colonne facultative : voir l'en-tête du schéma).
      const doublon = await prisma.client.findFirst({ where: { compteCourant: data.compteCourant } });
      if (doublon) throw new ErreurMetier("Un client existe déjà avec ce compte courant.", 409, "doublon", { clientId: doublon.id });
    }
    const c = await prisma.client.create({ data: { ...data, entiteId, pays: data.pays ?? "MA" } });
    await journaliser(ctx, "creation", "client", c.id, { raisonSociale: c.raisonSociale });
    return c;
  },
  { permission: "client:gerer" }
);
