import { route } from "@/lib/serveur/api";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/** Pastilles du menu : notifications non lues, dossiers qui attendent l'utilisateur. */
export const GET = route(async (_req, ctx) => {
  const notifications = await prisma.notification.count({ where: { destinataireId: ctx.utilisateur.id, lu: false } });
  const statuts: string[] = [];
  if (ctx.permissions.includes("dossier:valider")) statuts.push("soumis");
  if (ctx.permissions.includes("dossier:decider")) statuts.push("valide");
  const aTraiter =
    (statuts.length ? await prisma.dossier.count({ where: { ...filtreLecture(ctx.perimetre), statut: { in: statuts } } }) : 0) +
    (ctx.permissions.includes("dossier:modifier")
      ? await prisma.dossier.count({ where: { ...filtreLecture(ctx.perimetre), statut: "brouillon", chargeId: ctx.utilisateur.id } })
      : 0);
  return { notifications, aTraiter };
});
