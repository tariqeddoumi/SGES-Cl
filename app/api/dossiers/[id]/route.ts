import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { interdit } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, INCLUSION_DOSSIER, recalculer } from "@/lib/serveur/dossiers";
import { droitsDossier, etatEtapes, exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliser } from "@/lib/serveur/journal";
import { SchemaIdentification } from "@/lib/serveur/schemas";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const d = await prisma.dossier.findUniqueOrThrow({ where: { id }, include: INCLUSION_DOSSIER });
    const { etapes, motifsBlocage, seuil } = await etatEtapes(id);
    return { dossier: d, droits: droitsDossier(ctx, d), etapes, motifsBlocage, seuil };
  },
  { permission: "dossier:lire" }
);

const SchemaModification = SchemaIdentification.extend({
  commentaireEvaluation: z.string().max(20000).nullable().optional(),
  chargeId: z.string().nullable().optional(),
});

export const PATCH = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const { dateDossier, chargeId, ...data } = SchemaModification.parse(await corps(req));
    if (chargeId !== undefined && chargeId !== null) {
      // Réattribution : le nouveau chargé doit pouvoir écrire sur l'entité du dossier.
      const u = await prisma.utilisateur.findUnique({ where: { id: chargeId } });
      if (!u || !u.isActive) throw interdit("Chargé inconnu ou inactif.");
    }
    await prisma.dossier.update({
      where: { id },
      data: { ...data, ...(dateDossier ? { dateDossier: new Date(dateDossier) } : {}), ...(chargeId ? { chargeId } : {}) },
    });
    await recalculer(id);
    await historiser(id, ctx, "modification", { commentaire: Object.keys(data).join(", ") });
    return { ok: true };
  },
  { permission: "dossier:modifier" }
);

export const DELETE = route(
  async (_req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    if (!droitsDossier(ctx, d).supprimer) throw interdit("Seul un brouillon peut être supprimé, par son auteur ou un profil habilité.");
    await prisma.notification.deleteMany({ where: { dossierId: id } });
    await prisma.dossier.updateMany({ where: { dossierPrecedentId: id }, data: { dossierPrecedentId: null } });
    await prisma.dossier.delete({ where: { id } });
    await journaliser(ctx, "suppression", "dossier", id, { reference: d.reference });
    return { ok: true };
  },
  { permission: "dossier:modifier" }
);
