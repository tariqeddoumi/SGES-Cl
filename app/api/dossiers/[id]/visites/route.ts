import { corps, route } from "@/lib/serveur/api";
import { dossierAutorise, historiser } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaVisite } from "@/lib/serveur/schemas";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    return prisma.visite.findMany({ where: { dossierId: id }, orderBy: { date: "desc" }, include: { visiteur: { select: { prenom: true, nom: true } } } });
  },
  { permission: "dossier:lire" }
);

export const POST = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "visites");
    const s = SchemaVisite.parse(await corps(req));
    const v = await prisma.visite.create({
      data: { ...s, dossierId: id, date: new Date(s.date), prochaineVisite: s.prochaineVisite ? new Date(s.prochaineVisite) : null, visiteurId: ctx.utilisateur.id },
    });
    await historiser(id, ctx, "visite", { commentaire: `${s.type} — ${s.date.slice(0, 10)}` });
    return v;
  },
  { permission: "visite:gerer" }
);
