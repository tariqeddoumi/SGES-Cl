import { route } from "@/lib/serveur/api";
import { dossierAutorise } from "@/lib/serveur/dossiers";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    return prisma.historiqueDossier.findMany({ where: { dossierId: id }, orderBy: { date: "desc" } });
  },
  { permission: "dossier:lire" }
);
