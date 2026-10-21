import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit, introuvable } from "@/lib/serveur/contexte";
import { replacer } from "@/lib/serveur/entites-admin";
import { journaliser } from "@/lib/serveur/journal";
import { oublierArbre, peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaEntite } from "@/lib/serveur/schemas-admin";

export const PATCH = route(
  async (req, ctx, { id }) => {
    const e = await prisma.entite.findUnique({ where: { id } });
    if (!e) throw introuvable();
    if (!peutEcrire(ctx.perimetre, id) && !ctx.perimetre.tout) throw interdit();
    const s = SchemaEntite.partial().parse(await corps(req));
    const { parentId, ...reste } = s;
    await prisma.entite.update({ where: { id }, data: reste });
    if (parentId !== undefined && parentId !== e.parentId) {
      if (!ctx.perimetre.tout) throw interdit("Seul l'administrateur global déplace une entité dans l'arbre.");
      try {
        await replacer(id, parentId);
      } catch {
        throw new ErreurMetier("Déplacement impossible : une entité ne peut pas être placée sous sa propre descendance.", 400, "validation");
      }
    }
    oublierArbre();
    await journaliser(ctx, "modification", "entite", id, s);
    return prisma.entite.findUnique({ where: { id } });
  },
  { permission: "admin:entites" }
);

export const DELETE = route(
  async (_req, ctx, { id }) => {
    if (!ctx.perimetre.tout) throw interdit();
    const n = await prisma.entite.findUnique({ where: { id }, select: { _count: { select: { enfants: true, utilisateurs: true, clients: true, dossiers: true } } } });
    if (!n) throw introuvable();
    if (Object.values(n._count).some((x) => x > 0)) throw new ErreurMetier("Entité utilisée : désactivez-la plutôt que de la supprimer.", 409, "utilise");
    await prisma.entite.delete({ where: { id } });
    oublierArbre();
    await journaliser(ctx, "suppression", "entite", id);
    return { ok: true };
  },
  { permission: "admin:entites" }
);
