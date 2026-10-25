import { construireChecklist, lireAnalyse, piecesAttendues, type Checklist, type PieceDeposee } from "../domaine/pieces";
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
