import type { Prisma } from "@prisma/client";
import { nombre } from "@/lib/parametres";
import { libelle } from "@/lib/i18n/libelle";
import { route } from "@/lib/serveur/api";
import { chargerParametres } from "@/lib/serveur/parametres";
import { chargerArbre, peutLire } from "@/lib/serveur/perimetre";
import { compter, dossiersPerimetre, sommer } from "@/lib/serveur/portefeuille";
import { prisma } from "@/lib/serveur/prisma";

/**
 * Reporting SGES (procédure §3.10) : dossiers traités sur une période, par entité ;
 * dossiers anciens sans décision ; base du reporting trimestriel aux comités.
 */
export const GET = route(
  async (req, ctx) => {
    const sp = req.nextUrl.searchParams;
    const du = sp.get("du") ? new Date(sp.get("du")!) : new Date(new Date().getFullYear(), 0, 1);
    const au = sp.get("au") ? new Date(`${sp.get("au")}T23:59:59`) : new Date();
    const where: Prisma.DossierWhereInput = { dateDossier: { gte: du, lte: au } };
    const arbre = await chargerArbre();
    if (sp.get("entite")) {
      const racine = arbre.find((e) => e.id === sp.get("entite"));
      if (racine) where.entiteId = { in: arbre.filter((e) => e.chemin.startsWith(racine.chemin) && peutLire(ctx.perimetre, e.id)).map((e) => e.id) };
    }
    const dossiers = await dossiersPerimetre(ctx, where);
    const p = await chargerParametres();
    const delai = nombre(p, "DELAI_DECISION_JOURS", 60) * 86400000;

    const parEntite = new Map<string, { entite: string; nb: number; montant: number; A: number; B: number; C: number; FI: number; exclus: number; accordes: number; rejetes: number; sansDecision: number; montantAccorde: number }>();
    for (const d of dossiers) {
      const e = parEntite.get(d.entiteId) ?? { entite: d.entite.nom, nb: 0, montant: 0, A: 0, B: 0, C: 0, FI: 0, exclus: 0, accordes: 0, rejetes: 0, sansDecision: 0, montantAccorde: 0 };
      e.nb++;
      e.montant += d.montantDemandeRef;
      if (d.categorie && d.categorie in e) (e as unknown as Record<string, number>)[d.categorie]++;
      if (d.exclu) e.exclus++;
      if (d.decision === "accorde") {
        e.accordes++;
        e.montantAccorde += (d.montantAccorde ?? 0) * d.tauxReference;
      }
      if (d.decision === "rejete") e.rejetes++;
      if (!d.decision && ["valide", "soumis"].includes(d.statut)) e.sansDecision++;
      parEntite.set(d.entiteId, e);
    }

    const actions = await prisma.action.findMany({ where: { dossierId: { in: dossiers.map((d) => d.id) }, retenue: true }, select: { statut: true } });
    const sansDecision = (await dossiersPerimetre(ctx, { statut: "valide" }))
      .filter((d) => d.valideLe && Date.now() - d.valideLe.getTime() > delai)
      .map((d) => ({ id: d.id, reference: d.reference, client: d.client.raisonSociale, entite: d.entite.nom, valideLe: d.valideLe, charge: d.charge ? `${d.charge.prenom} ${d.charge.nom}` : null }));

    return {
      du, au,
      nb: dossiers.length,
      montantRef: dossiers.reduce((s, d) => s + d.montantDemandeRef, 0),
      montantAccordeRef: dossiers.reduce((s, d) => s + (d.decision === "accorde" ? (d.montantAccorde ?? 0) * d.tauxReference : 0), 0),
      projetsDD: dossiers.filter((d) => d.projetDeveloppementDurable).length,
      plansAction: dossiers.filter((d) => d.planActionPropose).length,
      tauxRealisation: actions.length ? actions.filter((a) => a.statut === "realisee").length / actions.length : null,
      parCategorie: compter(dossiers, (d) => d.categorie),
      parDecision: compter(dossiers, (d) => d.decision ?? "attente"),
      parNiveau: compter(dossiers, (d) => d.niveauRisque),
      parSecteur: Object.entries(sommer(dossiers, (d) => (d.secteur ? `${d.secteur.code} — ${libelle(d.secteur.libelle, ctx.langue)}` : null), (d) => d.montantDemandeRef))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
      parEntite: Array.from(parEntite.values()).sort((a, b) => b.nb - a.nb),
      sansDecision,
      dossiers: dossiers.map((d) => ({ id: d.id, reference: d.reference, client: d.client.raisonSociale, entite: d.entite.nom, date: d.dateDossier, categorie: d.categorie, niveauRisque: d.niveauRisque, montantDemande: d.montantDemande, deviseCode: d.deviseCode, statut: d.statut, decision: d.decision })),
    };
  },
  { permission: "reporting:lire" }
);
