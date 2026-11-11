import { route } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { exigerIA } from "@/lib/serveur/ia";
import { lireEtEnregistrer } from "@/lib/serveur/pieces";
import { prisma } from "@/lib/serveur/prisma";

export const maxDuration = 300;

/** Relance la lecture d'une pièce (par exemple après activation de l'OCR intelligent). */
export const POST = route(
  async (_req, ctx, { id, docId }) => {
    await exigerIA();
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "pieces");
    const doc = await prisma.document.findUnique({ where: { id: docId }, select: { id: true, dossierId: true, mime: true, nom: true, type: true, contenu: true } });
    if (!doc || doc.dossierId !== id) throw introuvable("Pièce introuvable.");
    const r = await lireEtEnregistrer(ctx, { ...doc, contenu: new Uint8Array(doc.contenu) });
    await recalculer(id);
    return r;
  },
  { permission: "dossier:modifier" }
);
