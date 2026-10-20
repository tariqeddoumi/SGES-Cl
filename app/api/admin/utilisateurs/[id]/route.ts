import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit, introuvable } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaUtilisateur } from "@/lib/serveur/schemas-admin";
import { controlerAttribution } from "@/lib/serveur/utilisateurs-admin";

export const PATCH = route(
  async (req, ctx, { id }) => {
    const u = await prisma.utilisateur.findUnique({ where: { id } });
    if (!u) throw introuvable();
    if (!ctx.perimetre.tout && (!u.entiteId || !peutEcrire(ctx.perimetre, u.entiteId))) throw interdit();
    const s = SchemaUtilisateur.partial().parse(await corps(req));
    if (id === ctx.utilisateur.id && (s.isActive === false || (s.roleId && s.roleId !== u.roleId))) {
      throw new ErreurMetier("Vous ne pouvez ni désactiver votre propre compte ni changer votre propre rôle.", 400, "validation");
    }
    if (s.roleId !== undefined || s.entiteId !== undefined) await controlerAttribution(ctx, s.entiteId === undefined ? u.entiteId : s.entiteId, s.roleId ?? u.roleId);
    const maj = await prisma.utilisateur.update({ where: { id }, data: { ...s, ...(s.isActive ? { tentativesEchouees: 0, verrouilleJusqua: null } : {}) } });
    await journaliser(ctx, "modification", "utilisateur", id, s);
    return { id: maj.id };
  },
  { permission: "admin:utilisateurs" }
);
