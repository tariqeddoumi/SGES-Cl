import { NextResponse, type NextRequest } from "next/server";
import { reponseErreur } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { authentifierCle } from "@/lib/serveur/cles-api";
import { construireFiche } from "@/lib/serveur/fiche";
import { journaliser } from "@/lib/serveur/journal";
import { peutLire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/**
 * API d'intégration — fiche d'évaluation E&S d'une demande de crédit, pour la
 * plateforme d'octroi (cahier des charges SGES, « Données récupérées de l'outil SGES »).
 *
 *   GET /api/v1/fiches/{référence}?langue=fr     (en-tête X-API-Key)
 *
 * `evaluationDisponible` est vrai dès que la fiche a été validée par la direction : la
 * plateforme peut alors la joindre au dossier du comité. Une demande soumise au comité
 * sans fiche disponible doit être ajournée (circulaire CFD-537/01-24).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const cle = await authentifierCle(req);
    const { reference } = await params;
    const d = await prisma.dossier.findUnique({ where: { reference }, select: { id: true, entiteId: true, statut: true } });
    if (!d || !peutLire(cle.perimetre, d.entiteId)) throw introuvable("Dossier introuvable.");
    const fiche = await construireFiche(d.id, req.nextUrl.searchParams.get("langue") ?? "fr");
    await journaliser({ utilisateur: { id: "", prenom: "API", nom: cle.nom } }, "api_fiche", "dossier", d.id, { reference });
    return NextResponse.json({
      evaluationDisponible: ["valide", "decide", "en_suivi", "cloture"].includes(d.statut),
      evaluationObligatoire: fiche.conclusions.evaluationObligatoire,
      fiche,
    });
  } catch (e) {
    return reponseErreur(e);
  }
}
