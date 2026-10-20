import { nombre } from "@/lib/parametres";
import { route } from "@/lib/serveur/api";
import { chargerParametres } from "@/lib/serveur/parametres";
import { filtreLecture } from "@/lib/serveur/perimetre";
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
    const suivis = await prisma.dossier.findMany({
      where: { ...filtreLecture(ctx.perimetre), statut: { in: ["decide", "en_suivi"] }, decision: "accorde" },
      select: { id: true, reference: true, statut: true, dateComite: true, client: { select: { raisonSociale: true } }, visites: { orderBy: { date: "desc" }, take: 1, select: { date: true, prochaineVisite: true } } },
    });
    const aPlanifier = suivis
      .map((d) => {
        const v = d.visites[0];
        const echeance = v?.prochaineVisite ?? (v ? new Date(v.date.getFullYear(), v.date.getMonth() + delai, v.date.getDate()) : d.dateComite ?? new Date());
        return { id: d.id, reference: d.reference, client: d.client.raisonSociale, derniere: v?.date ?? null, echeance };
      })
      .sort((a, b) => +a.echeance - +b.echeance);
    return { realisees, aPlanifier, delai };
  },
  { permission: "dossier:lire" }
);
