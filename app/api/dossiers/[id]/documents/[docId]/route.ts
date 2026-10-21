import { route } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id, docId }) => {
    await dossierAutorise(ctx, id);
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc || doc.dossierId !== id) throw introuvable("Pièce introuvable.");
    return new Response(new Uint8Array(doc.contenu), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Length": String(doc.taille),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.nom)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  },
  { permission: "dossier:lire" }
);

export const DELETE = route(
  async (_req, ctx, { id, docId }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "pieces");
    const doc = await prisma.document.findUnique({ where: { id: docId }, select: { dossierId: true, nom: true } });
    if (!doc || doc.dossierId !== id) throw introuvable("Pièce introuvable.");
    await prisma.document.delete({ where: { id: docId } });
    await historiser(id, ctx, "piece", { commentaire: `− ${doc.nom}` });
    return { ok: true };
  },
  { permission: "dossier:lire" }
);
