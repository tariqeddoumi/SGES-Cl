import { ecrireLibelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, introuvable } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaRole } from "@/lib/serveur/schemas-admin";

export const PATCH = route(
  async (req, ctx, { id }) => {
    const r = await prisma.role.findUnique({ where: { id } });
    if (!r) throw introuvable();
    const s = SchemaRole.partial().parse(await corps(req));
    // Garde-fou : le rôle de l'utilisateur qui modifie doit garder l'administration des rôles.
    if (s.permissions && ctx.utilisateur.roleCode === r.code && !s.permissions.includes("admin:parametres")) {
      throw new ErreurMetier("Vous retireriez vos propres droits d'administration.", 400, "validation");
    }
    const maj = await prisma.role.update({
      where: { id },
      data: {
        ...(s.libelle ? { libelle: ecrireLibelle(s.libelle) } : {}),
        ...(s.permissions ? { permissions: JSON.stringify(s.permissions) } : {}),
        ...(s.description !== undefined ? { description: s.description } : {}),
        ...(s.ordre !== undefined ? { ordre: s.ordre } : {}),
        ...(s.code && !r.systeme ? { code: s.code } : {}),
      },
    });
    await journaliser(ctx, "modification", "role", id, { avant: r.permissions, apres: s.permissions });
    return maj;
  },
  { permission: "admin:parametres" }
);

export const DELETE = route(
  async (_req, ctx, { id }) => {
    const r = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { utilisateurs: true } } } });
    if (!r) throw introuvable();
    if (r.systeme || r._count.utilisateurs > 0) throw new ErreurMetier("Rôle livré ou encore attribué : suppression impossible.", 409, "utilise");
    await prisma.role.delete({ where: { id } });
    await journaliser(ctx, "suppression", "role", id);
    return { ok: true };
  },
  { permission: "admin:parametres" }
);
