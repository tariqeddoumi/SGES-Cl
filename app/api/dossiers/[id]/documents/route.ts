import { route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { lireEtEnregistrer } from "@/lib/serveur/pieces";
import { prisma } from "@/lib/serveur/prisma";

const TAILLE_MAX = 10 * 1024 * 1024;
const TYPES_ADMIS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "text/plain",
]);

// La transcription d'un scan de plusieurs pages peut prendre une à deux minutes.
export const maxDuration = 300;

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    return prisma.document.findMany({
      where: { dossierId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, nom: true, mime: true, taille: true, createdAt: true, deposeParId: true, origineTexte: true },
    });
  },
  { permission: "dossier:lire" }
);

export const POST = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "pieces");
    const form = await req.formData();
    const fichier = form.get("fichier");
    const type = String(form.get("type") ?? "AUTRE").slice(0, 40);
    if (!(fichier instanceof File)) throw new ErreurMetier("Fichier manquant.", 400, "validation");
    if (fichier.size > TAILLE_MAX) throw new ErreurMetier("Fichier trop volumineux (10 Mo maximum).", 413, "trop_gros");
    const mime = fichier.type || "application/octet-stream";
    if (!TYPES_ADMIS.has(mime)) throw new ErreurMetier("Format de fichier non admis.", 415, "format");
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const doc = await prisma.document.create({
      data: {
        dossierId: id,
        type,
        nom: fichier.name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 200),
        mime,
        taille: fichier.size,
        contenu: Buffer.from(octets),
        deposeParId: ctx.utilisateur.id,
      },
      select: { id: true, dossierId: true, type: true, nom: true, mime: true, taille: true, createdAt: true },
    });
    // Lecture : extraction du texte, puis OCR intelligent pour un scan ou une photo (type reconnu si « Autre »).
    const lecture = await lireEtEnregistrer(ctx, { ...doc, contenu: octets });
    await historiser(id, ctx, "piece", { commentaire: `${lecture.type} — ${doc.nom}` });
    await recalculer(id);
    return { ...doc, ...lecture };
  },
  { permission: "dossier:lire" }
);
