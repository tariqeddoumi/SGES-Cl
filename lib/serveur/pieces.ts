import { construireChecklist, lireAnalyse, piecesAttendues, type Checklist, type PieceDeposee } from "../domaine/pieces";
import { libelle } from "../i18n/libelle";
import { parametresOCR } from "./ia";
import { journaliser } from "./journal";
import { lirePiece } from "./ocr";
import { prisma } from "./prisma";

/** Pièces du dossier (sans le contenu binaire) mises en forme pour la check-list. */
export async function piecesDeposees(dossierId: string): Promise<PieceDeposee[]> {
  const docs = await prisma.document.findMany({
    where: { dossierId },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, nom: true, analyse: true, texte: true },
  });
  return docs.map((d) => ({ id: d.id, type: d.type, nom: d.nom, texteDisponible: !!d.texte?.trim(), analyse: lireAnalyse(d.analyse) }));
}

export async function checklistDossier(dossierId: string): Promise<Checklist> {
  const d = await prisma.dossier.findUniqueOrThrow({ where: { id: dossierId }, select: { categorie: true, eieRequise: true } });
  return construireChecklist(piecesAttendues(d.categorie, d.eieRequise), await piecesDeposees(dossierId));
}

/** Types de pièces actifs (libellé français) proposés à la reconnaissance par l'OCR intelligent. */
export async function typesPieces(): Promise<{ code: string; libelle: string }[]> {
  const l = await prisma.listeValeur.findMany({ where: { liste: "type_document", actif: true }, orderBy: { ordre: "asc" }, select: { code: true, libelle: true } });
  return l.filter((x) => x.code !== "CANEVAS" && x.code !== "AUTRE").map((x) => ({ code: x.code, libelle: libelle(x.libelle, "fr") }));
}

/**
 * Lit une pièce (extraction, puis OCR intelligent si besoin) et l'enregistre : texte, origine et,
 * pour une pièce déposée en « Autre », le type reconnu. Journalise chaque transcription.
 */
export async function lireEtEnregistrer(
  ctx: { utilisateur: { id: string; prenom: string; nom: string } },
  doc: { id: string; dossierId: string; mime: string; nom: string; type: string; contenu: Uint8Array }
) {
  const p = await parametresOCR();
  const lu = await lirePiece(p, { mime: doc.mime, octets: doc.contenu, nom: doc.nom, types: p ? await typesPieces() : [] });
  const reclasse = lu.typeDetecte && doc.type === "AUTRE" ? lu.typeDetecte : null;
  await prisma.document.update({ where: { id: doc.id }, data: { texte: lu.texte, origineTexte: lu.origine, ...(reclasse ? { type: reclasse } : {}) } });
  if (lu.origine === "ocr" || lu.erreurOCR) await journaliser(ctx, "ocr_piece", "dossier", doc.dossierId, { document: doc.id, origine: lu.origine, type: lu.typeDetecte, reclasse, erreur: lu.erreurOCR, tronque: !!lu.tronque });
  return { origineTexte: lu.origine, typeDetecte: lu.typeDetecte, type: reclasse ?? doc.type, erreurOCR: lu.erreurOCR, remarque: lu.remarque, texteDisponible: !!lu.texte?.trim() };
}
