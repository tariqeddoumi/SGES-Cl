import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(async (_req, ctx) => ({ ...ctx.utilisateur, permissions: ctx.permissions, perimetre: ctx.perimetre }), { autoriserMdpProvisoire: true });

const Schema = z.object({
  langue: z.string().min(2).max(8).optional(),
  deviseAffichage: z.string().min(3).max(3).nullable().optional(),
  theme: z.enum(["clair", "sombre"]).nullable().optional(),
});

export const PATCH = route(async (req, ctx) => {
  const data = Schema.parse(await corps(req));
  if (data.deviseAffichage && !(await prisma.devise.findUnique({ where: { code: data.deviseAffichage } }))) delete data.deviseAffichage;
  await prisma.utilisateur.update({ where: { id: ctx.utilisateur.id }, data });
  return { ok: true };
});
