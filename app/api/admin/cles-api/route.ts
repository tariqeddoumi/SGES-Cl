import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { interdit } from "@/lib/serveur/contexte";
import { nouvelleCle } from "@/lib/serveur/cles-api";
import { journaliser } from "@/lib/serveur/journal";
import { peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async () => prisma.cleApi.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, nom: true, prefixe: true, entiteId: true, actif: true, derniereUtilisation: true, expireLe: true, createdAt: true, entite: { select: { nom: true } } } }),
  { permission: "admin:api" }
);

export const POST = route(
  async (req, ctx) => {
    const s = z.object({ nom: z.string().trim().min(2).max(100), entiteId: z.string().nullable().optional(), expireLe: z.string().nullable().optional() }).parse(await corps(req));
    if (s.entiteId ? !peutEcrire(ctx.perimetre, s.entiteId) : !ctx.perimetre.tout) throw interdit();
    const k = nouvelleCle();
    const c = await prisma.cleApi.create({ data: { nom: s.nom, prefixe: k.prefixe, empreinte: k.empreinte, entiteId: s.entiteId ?? null, expireLe: s.expireLe ? new Date(s.expireLe) : null } });
    await journaliser(ctx, "creation", "cle_api", c.id, { nom: s.nom, entiteId: s.entiteId });
    return { id: c.id, cle: k.cle };
  },
  { permission: "admin:api" }
);
