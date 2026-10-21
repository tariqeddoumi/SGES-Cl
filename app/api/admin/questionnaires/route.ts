import { route } from "@/lib/serveur/api";
import { prisma } from "@/lib/serveur/prisma";

/** Arbre complet des questionnaires (éléments inactifs compris). */
export const GET = route(
  async () =>
    prisma.thematique.findMany({
      orderBy: { ordre: "asc" },
      include: {
        blocs: {
          orderBy: { ordre: "asc" },
          include: {
            questions: {
              orderBy: { ordre: "asc" },
              include: { actions: { orderBy: { ordre: "asc" } }, _count: { select: { reponses: true } } },
            },
          },
        },
      },
    }),
  { permission: "admin:referentiels" }
);
