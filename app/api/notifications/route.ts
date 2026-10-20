import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(async (_req, ctx) =>
  prisma.notification.findMany({ where: { destinataireId: ctx.utilisateur.id }, orderBy: { createdAt: "desc" }, take: 200 })
);

/** Marquer comme lues : une liste d'identifiants, ou toutes. */
export const PATCH = route(async (req, ctx) => {
  const { ids } = z.object({ ids: z.array(z.string()).max(500).optional() }).parse(await corps(req));
  const r = await prisma.notification.updateMany({ where: { destinataireId: ctx.utilisateur.id, ...(ids ? { id: { in: ids } } : {}) }, data: { lu: true } });
  return { maj: r.count };
});
