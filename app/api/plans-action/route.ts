import { route } from "@/lib/serveur/api";
import { filtreActionsEnRetard, filtreActionsPortefeuille } from "@/lib/serveur/portefeuille";
import { prisma } from "@/lib/serveur/prisma";

const TAILLE = 50;

/**
 * Actions retenues des dossiers décidés, en suivi ou clôturés, triées par échéance, par pages.
 * Les indicateurs portent sur tout le portefeuille (pas seulement la page affichée) et
 * « en retard » suit la même définition que le tableau de bord.
 */
export const GET = route(
  async (req, ctx) => {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const base = filtreActionsPortefeuille(ctx.perimetre);
    const where =
      sp.get("retard") === "1"
        ? { AND: [filtreActionsEnRetard(ctx.perimetre), ...(sp.get("statut") ? [{ statut: sp.get("statut")! }] : [])] }
        : { ...base, ...(sp.get("statut") ? { statut: sp.get("statut")! } : {}) };
    const [lignes, total, retenues, realisees, enRetard] = await Promise.all([
      prisma.action.findMany({
        where,
        orderBy: [{ dateEcheance: "asc" }, { id: "asc" }],
        skip: (page - 1) * TAILLE,
        take: TAILLE,
        include: { dossier: { select: { id: true, reference: true, statut: true, deviseCode: true, client: { select: { raisonSociale: true } }, entite: { select: { nom: true } } } } },
      }),
      prisma.action.count({ where }),
      prisma.action.count({ where: base }),
      prisma.action.count({ where: { ...base, statut: "realisee" } }),
      prisma.action.count({ where: filtreActionsEnRetard(ctx.perimetre) }),
    ]);
    return { lignes, total, page, taille: TAILLE, indicateurs: { retenues, realisees, enRetard } };
  },
  { permission: "dossier:lire" }
);
