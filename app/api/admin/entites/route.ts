import { corps, route } from "@/lib/serveur/api";
import { interdit } from "@/lib/serveur/contexte";
import { replacer } from "@/lib/serveur/entites-admin";
import { journaliser } from "@/lib/serveur/journal";
import { chargerArbre, peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaEntite } from "@/lib/serveur/schemas-admin";

export const GET = route(
  async (_req, ctx) => {
    const arbre = await chargerArbre();
    const compte = await prisma.entite.findMany({ select: { id: true, _count: { select: { utilisateurs: true, clients: true, dossiers: true, enfants: true } } } });
    return arbre
      .filter((e) => ctx.perimetre.tout || ctx.perimetre.lecture.includes(e.id))
      .map((e) => ({ ...e, ...compte.find((c) => c.id === e.id)?._count, ecriture: peutEcrire(ctx.perimetre, e.id) }))
      .sort((a, b) => a.chemin.localeCompare(b.chemin));
  },
  { permission: "admin:entites" }
);

export const POST = route(
  async (req, ctx) => {
    const s = SchemaEntite.parse(await corps(req));
    // Une entité se crée sous une entité de son périmètre ; la racine est réservée à l'administration globale.
    if (s.parentId ? !peutEcrire(ctx.perimetre, s.parentId) && !ctx.perimetre.tout : !ctx.perimetre.tout) throw interdit();
    const e = await prisma.entite.create({ data: { ...s, parentId: null, chemin: "/", niveau: 0, seuilDeclenchement: s.seuilDeclenchement ?? null } });
    await replacer(e.id, s.parentId ?? null);
    await journaliser(ctx, "creation", "entite", e.id, s);
    return e;
  },
  { permission: "admin:entites" }
);
