import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { reponseErreur } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { authentifierCle } from "@/lib/serveur/cles-api";
import { construireFiche } from "@/lib/serveur/fiche";
import { journaliser } from "@/lib/serveur/journal";
import { peutLire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

const STATUTS_VALIDES = ["valide", "decide", "en_suivi", "cloture"];

/** Signature HMAC-SHA256 du corps : la plateforme d'octroi vérifie l'intégrité et la provenance de la fiche. */
function signer(corps: string): string | null {
  const secret = process.env.API_SIGNATURE_SECRET || process.env.JWT_SECRET;
  return secret ? createHmac("sha256", secret).update(corps).digest("hex") : null;
}

/**
 * API d'intégration — fiche d'évaluation E&S d'une demande de crédit, pour la
 * plateforme d'octroi (cahier des charges SGES, « Données récupérées de l'outil SGES »).
 *
 *   GET /api/v1/fiches/{référence}?langue=fr     (en-tête X-API-Key)
 *
 * Seule une fiche **validée par la direction** est restituée (statuts validé, décidé, en suivi,
 * clôturé), avec son état, sa version (instantané figé à la validation / décision), l'empreinte
 * SHA-256 de cet instantané, sa date et une signature HMAC (en-tête X-SGES-Signature).
 * Tant que la fiche n'est pas validée : HTTP 409 `evaluation_non_disponible`, sans aucune donnée
 * d'évaluation — un dossier présenté au comité sans fiche disponible doit être ajourné
 * (circulaire CFD-537/01-24).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const cle = await authentifierCle(req);
    const { reference } = await params;
    const d = await prisma.dossier.findUnique({ where: { reference }, select: { id: true, entiteId: true, statut: true, evaluationObligatoire: true, valideLe: true } });
    if (!d || !peutLire(cle.perimetre, d.entiteId)) throw introuvable("Dossier introuvable.");
    const appelant = { utilisateur: { id: "", prenom: "API", nom: cle.nom } };

    if (!STATUTS_VALIDES.includes(d.statut)) {
      await journaliser(appelant, "api_fiche_refusee", "dossier", d.id, { reference, etat: d.statut });
      return NextResponse.json(
        { error: "Fiche d'évaluation non validée : elle ne peut pas être présentée au comité.", code: "evaluation_non_disponible", reference, evaluationDisponible: false, etat: d.statut, evaluationObligatoire: d.evaluationObligatoire },
        { status: 409 }
      );
    }

    const snapshot = await prisma.snapshotDossier.findFirst({
      where: { dossierId: d.id, type: { in: ["validation", "decision"] } },
      orderBy: { version: "desc" },
      select: { version: true, type: true, empreinte: true, createdAt: true },
    });
    const fiche = await construireFiche(d.id, req.nextUrl.searchParams.get("langue") ?? "fr");
    const corps = JSON.stringify({
      evaluationDisponible: true,
      etat: d.statut,
      evaluationObligatoire: fiche.conclusions.evaluationObligatoire,
      valideLe: d.valideLe,
      version: snapshot ? { numero: snapshot.version, type: snapshot.type, empreinte: snapshot.empreinte, figeLe: snapshot.createdAt } : null,
      fiche,
    });
    await journaliser(appelant, "api_fiche", "dossier", d.id, { reference, version: snapshot?.version ?? null });
    const signature = signer(corps);
    return new NextResponse(corps, {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(signature ? { "X-SGES-Signature": `sha256=${signature}` } : {}) },
    });
  } catch (e) {
    return reponseErreur(e);
  }
}
