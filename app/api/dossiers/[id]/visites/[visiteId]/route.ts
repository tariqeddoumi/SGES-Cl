import { corps, route } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaVisite } from "@/lib/serveur/schemas";

async function charger(ctx: Parameters<typeof dossierAutorise>[0], id: string, visiteId: string) {
  const d = await dossierAutorise(ctx, id, "ecriture");
  exigerVolet(ctx, d, "visites");
  const v = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!v || v.dossierId !== id) throw introuvable("Visite introuvable.");
  return v;
}

export const PATCH = route(
  async (req, ctx, { id, visiteId }) => {
    await charger(ctx, id, visiteId);
    const s = SchemaVisite.partial().parse(await corps(req));
    const v = await prisma.visite.update({
      where: { id: visiteId },
      data: {
        ...s,
        date: s.date ? new Date(s.date) : undefined,
        prochaineVisite: s.prochaineVisite === undefined ? undefined : s.prochaineVisite ? new Date(s.prochaineVisite) : null,
      },
    });
    await recalculer(id);
    return v;
  },
  { permission: "visite:gerer" }
);

export const DELETE = route(
  async (_req, ctx, { id, visiteId }) => {
    await charger(ctx, id, visiteId);
    await prisma.visite.delete({ where: { id: visiteId } });
    await recalculer(id);
    return { ok: true };
  },
  { permission: "visite:gerer" }
);
