import { ecrireLibelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaRole } from "@/lib/serveur/schemas-admin";

export const GET = route(
  async () => prisma.role.findMany({ orderBy: { ordre: "asc" }, include: { _count: { select: { utilisateurs: true } } } }),
  { permission: "admin:utilisateurs" }
);

export const POST = route(
  async (req, ctx) => {
    const s = SchemaRole.parse(await corps(req));
    const r = await prisma.role.create({ data: { code: s.code, libelle: ecrireLibelle(s.libelle), description: s.description ?? null, permissions: JSON.stringify(s.permissions), ordre: s.ordre ?? 99 } });
    await journaliser(ctx, "creation", "role", r.id, s);
    return r;
  },
  { permission: "admin:parametres" }
);
