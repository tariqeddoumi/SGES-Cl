import { route } from "@/lib/serveur/api";
import { moteurBase, prisma } from "@/lib/serveur/prisma";
import { volumes } from "@/lib/serveur/sauvegarde";

/** Diagnostic de la base en service (l'adresse elle-même n'est jamais exposée). */
export const GET = route(
  async () => {
    const debut = Date.now();
    await prisma.parametre.count();
    const latence = Date.now() - debut;
    return { moteur: moteurBase(), latenceMs: latence, volumes: await volumes(), version: process.env.npm_package_version ?? null };
  },
  { permission: "admin:base" }
);
