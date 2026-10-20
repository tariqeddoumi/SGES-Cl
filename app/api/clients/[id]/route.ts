import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit, introuvable } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { filtreLecture, peutEcrire, peutLire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaClient } from "@/lib/serveur/schemas-client";

export const GET = route(
  async (_req, ctx, { id }) => {
    const c = await prisma.client.findUnique({ where: { id }, include: { entite: true, secteur: true } });
    if (!c || !peutLire(ctx.perimetre, c.entiteId)) throw introuvable("Client introuvable.");
    const dossiers = await prisma.dossier.findMany({
      where: { clientId: id, ...filtreLecture(ctx.perimetre) },
      orderBy: { dateDossier: "desc" },
      select: { id: true, reference: true, statut: true, categorie: true, niveauRisque: true, scoreRisque: true, montantDemande: true, deviseCode: true, dateDossier: true, decision: true, objet: true },
    });
    return { client: c, dossiers, ecriture: peutEcrire(ctx.perimetre, c.entiteId) && ctx.permissions.includes("client:gerer") };
  },
  { permission: "dossier:lire" }
);

export const PATCH = route(
  async (req, ctx, { id }) => {
    const c = await prisma.client.findUnique({ where: { id } });
    if (!c || !peutLire(ctx.perimetre, c.entiteId)) throw introuvable("Client introuvable.");
    if (!peutEcrire(ctx.perimetre, c.entiteId)) throw interdit();
    const data = SchemaClient.partial().parse(await corps(req));
    if (data.entiteId && !peutEcrire(ctx.perimetre, data.entiteId)) throw interdit();
    if (data.compteCourant && data.compteCourant !== c.compteCourant) {
      const doublon = await prisma.client.findFirst({ where: { compteCourant: data.compteCourant, NOT: { id } } });
      if (doublon) throw new ErreurMetier("Un client existe déjà avec ce compte courant.", 409, "doublon");
    }
    const maj = await prisma.client.update({ where: { id }, data: { ...data, raisonSociale: data.raisonSociale ?? undefined } });
    await journaliser(ctx, "modification", "client", id);
    return maj;
  },
  { permission: "client:gerer" }
);
