import { route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";

/** Révocation (la clé reste listée pour la traçabilité). */
export const DELETE = route(
  async (_req, ctx, { id }) => {
    await prisma.cleApi.update({ where: { id }, data: { actif: false } });
    await journaliser(ctx, "revocation", "cle_api", id);
    return { ok: true };
  },
  { permission: "admin:api" }
);
