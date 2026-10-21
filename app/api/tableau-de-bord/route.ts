import { nombre } from "@/lib/parametres";
import { route } from "@/lib/serveur/api";
import { chargerParametres } from "@/lib/serveur/parametres";
import { filtreLecture } from "@/lib/serveur/perimetre";
import { compter, dossiersPerimetre } from "@/lib/serveur/portefeuille";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(async (_req, ctx) => {
  const p = await chargerParametres();
  const lecture = ctx.permissions.includes("dossier:lire");
  if (!lecture) return { lecture: false };
  const dossiers = await dossiersPerimetre(ctx);
  const maintenant = Date.now();
  const delaiDecision = nombre(p, "DELAI_DECISION_JOURS", 60) * 86400000;
  const delaiVisite = nombre(p, "DELAI_VISITE_MOIS", 12) * 30 * 86400000;

  const actionsEnRetard = await prisma.action.count({
    where: {
      dossier: { ...filtreLecture(ctx.perimetre), statut: { in: ["decide", "en_suivi"] } },
      retenue: true,
      statut: { in: ["a_faire", "en_cours"] },
      dateEcheance: { lt: new Date() },
    },
  });
  const enSuivi = dossiers.filter((d) => d.statut === "en_suivi");
  const visites = await prisma.visite.findMany({
    where: { dossierId: { in: enSuivi.map((d) => d.id) } },
    select: { dossierId: true, date: true, prochaineVisite: true },
    orderBy: { date: "desc" },
  });
  const visitesAPlanifier = enSuivi.filter((d) => {
    const v = visites.find((x) => x.dossierId === d.id);
    if (!v) return true;
    if (v.prochaineVisite) return v.prochaineVisite.getTime() < maintenant;
    return maintenant - v.date.getTime() > delaiVisite;
  }).length;

  const parMois: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    parMois[d.toISOString().slice(0, 7)] = 0;
  }
  for (const d of dossiers) {
    const k = d.dateDossier.toISOString().slice(0, 7);
    if (k in parMois) parMois[k]++;
  }

  const decides = dossiers.filter((d) => d.decision === "accorde" || d.decision === "rejete");
  return {
    lecture: true,
    aTraiter: {
      brouillons: dossiers.filter((d) => d.statut === "brouillon" && d.chargeId === ctx.utilisateur.id).length,
      aValider: ctx.permissions.includes("dossier:valider") ? dossiers.filter((d) => d.statut === "soumis").length : null,
      auComite: dossiers.filter((d) => d.statut === "valide").length,
      sansDecision: dossiers.filter((d) => d.statut === "valide" && d.valideLe && maintenant - d.valideLe.getTime() > delaiDecision).length,
      actionsEnRetard,
      visitesAPlanifier,
    },
    delaiDecisionJours: nombre(p, "DELAI_DECISION_JOURS", 60),
    portefeuille: {
      nb: dossiers.length,
      montantRef: dossiers.reduce((s, d) => s + d.montantDemandeRef, 0),
      categorieA: dossiers.filter((d) => d.categorie === "A").length,
      exclusions: dossiers.filter((d) => d.exclu).length,
      parCategorie: compter(dossiers, (d) => d.categorie),
      parNiveau: compter(dossiers, (d) => d.niveauRisque),
      parStatut: compter(dossiers, (d) => d.statut),
      decisions: compter(decides, (d) => d.decision),
      tauxAccord: decides.length ? decides.filter((d) => d.decision === "accorde").length / decides.length : null,
      parMois,
    },
    climat: {
      emissionsFinancees: dossiers.reduce((s, d) => s + (d.climat?.emissionsFinancees ?? 0), 0),
      eleve: dossiers.filter((d) => d.climat?.niveauClimat === "eleve" || d.climat?.niveauClimat === "tres_eleve").length,
      evalues: dossiers.filter((d) => d.climat?.scoreClimat != null).length,
    },
    recents: dossiers.slice(0, 8).map((d) => ({
      id: d.id, reference: d.reference, statut: d.statut, categorie: d.categorie, niveauRisque: d.niveauRisque, scoreRisque: d.scoreRisque,
      client: d.client.raisonSociale, montantDemande: d.montantDemande, deviseCode: d.deviseCode, decision: d.decision, updatedAt: d.updatedAt,
    })),
  };
});
