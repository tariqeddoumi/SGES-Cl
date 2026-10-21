import { route } from "@/lib/serveur/api";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/** Actions retenues des dossiers décidés ou en suivi, triées par échéance. */
export const GET = route(
  async (req, ctx) => {
    const sp = req.nextUrl.searchParams;
    const actions = await prisma.action.findMany({
      where: {
        dossier: { ...filtreLecture(ctx.perimetre), statut: { in: ["decide", "en_suivi", "cloture"] } },
        retenue: true,
        ...(sp.get("statut") ? { statut: sp.get("statut")! } : {}),
        ...(sp.get("retard") === "1" ? { statut: { in: ["a_faire", "en_cours"] }, dateEcheance: { lt: new Date() } } : {}),
      },
      orderBy: [{ dateEcheance: "asc" }],
      take: 500,
      include: { dossier: { select: { id: true, reference: true, statut: true, deviseCode: true, client: { select: { raisonSociale: true } }, entite: { select: { nom: true } } } } },
    });
    return actions;
  },
  { permission: "dossier:lire" }
);
