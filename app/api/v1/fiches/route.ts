import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { reponseErreur } from "@/lib/serveur/api";
import { authentifierCle } from "@/lib/serveur/cles-api";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/**
 * Recherche des évaluations E&S d'un client (compte courant 20 positions) ou modifiées
 * depuis une date : GET /api/v1/fiches?compte=…&depuis=2026-01-01
 */
export async function GET(req: NextRequest) {
  try {
    const cle = await authentifierCle(req);
    const sp = req.nextUrl.searchParams;
    const where: Prisma.DossierWhereInput = { ...filtreLecture(cle.perimetre), statut: { not: "annule" } };
    if (sp.get("compte")) where.client = { compteCourant: sp.get("compte")! };
    if (sp.get("depuis")) where.updatedAt = { gte: new Date(sp.get("depuis")!) };
    if (sp.get("statut")) where.statut = { in: sp.get("statut")!.split(",") };
    const lignes = await prisma.dossier.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(500, Number(sp.get("limite")) || 100),
      select: {
        reference: true, statut: true, categorie: true, sousCategorieFI: true, exclu: true, niveauRisque: true, scoreRisque: true, evaluationObligatoire: true,
        montantDemande: true, deviseCode: true, decision: true, montantAccorde: true, updatedAt: true, valideLe: true,
        client: { select: { compteCourant: true, raisonSociale: true } }, entite: { select: { code: true } },
      },
    });
    return NextResponse.json({ total: lignes.length, dossiers: lignes });
  } catch (e) {
    return reponseErreur(e);
  }
}
