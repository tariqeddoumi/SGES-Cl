import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { interdit } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, INCLUSION_DOSSIER, recalculer } from "@/lib/serveur/dossiers";
import { droitsDossier, etatEtapes, exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliser } from "@/lib/serveur/journal";
import { SchemaIdentification } from "@/lib/serveur/schemas";
import { versReference } from "@/lib/serveur/devises";
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
    // Cours applicable vérifié AVANT l'écriture : un changement de devise ou de date sans cours admissible
    // (aucun cours publié à la date, jamais un cours postérieur) est refusé sans rien modifier.
    const devise = (data as { deviseCode?: string }).deviseCode ?? d.deviseCode;
    const date = dateDossier ? new Date(dateDossier) : d.dateDossier;
    if (devise !== d.deviseCode || date.getTime() !== d.dateDossier.getTime()) await versReference(1, devise, date);
    await prisma.dossier.update({
      where: { id },
      data: {
        ...data,
        ...(dateDossier ? { dateDossier: date } : {}),
        ...(chargeId ? { chargeId } : {}),
        // Nouvelle devise ou nouvelle date : le cours figé est recherché à nouveau.
        ...(devise !== d.deviseCode || date.getTime() !== d.dateDossier.getTime() ? { deviseCoursReference: null } : {}),
      },
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
