import { nombre } from "@/lib/parametres";
import { route } from "@/lib/serveur/api";
import { chargerParametres } from "@/lib/serveur/parametres";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { echeancesVisites } from "@/lib/serveur/portefeuille";
import { prisma } from "@/lib/serveur/prisma";

/** Visites réalisées et dossiers en suivi dont la prochaine visite est à planifier. */
export const GET = route(
  async (_req, ctx) => {
    const delai = nombre(await chargerParametres(), "DELAI_VISITE_MOIS", 12);
    const realisees = await prisma.visite.findMany({
      where: { dossier: filtreLecture(ctx.perimetre) },
      orderBy: { date: "desc" },
      take: 300,
      include: { visiteur: { select: { prenom: true, nom: true } }, dossier: { select: { id: true, reference: true, client: { select: { raisonSociale: true } } } } },
    });
    const aPlanifier = await echeancesVisites(ctx.perimetre, delai);
    return { realisees, aPlanifier, delai };
  },
  { permission: "dossier:lire" }
);
