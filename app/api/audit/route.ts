import type { Prisma } from "@prisma/client";
import { route } from "@/lib/serveur/api";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (req) => {
    const sp = req.nextUrl.searchParams;
    const where: Prisma.JournalWhereInput = {};
    if (sp.get("action")) where.action = sp.get("action")!;
    if (sp.get("objet")) where.objet = sp.get("objet")!;
    if (sp.get("q")) where.OR = [{ utilisateurNom: { contains: sp.get("q")! } }, { details: { contains: sp.get("q")! } }, { objetId: sp.get("q")! }];
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const [total, lignes] = await Promise.all([
      prisma.journal.count({ where }),
      prisma.journal.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * 100, take: 100 }),
    ]);
    return { total, page, lignes };
  },
  { permission: "audit:lire" }
);
