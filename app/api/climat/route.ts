import { libelle } from "@/lib/i18n/libelle";
import { ALEAS } from "@/lib/domaine/constantes";
import { route } from "@/lib/serveur/api";
import { compter, dossiersPerimetre } from "@/lib/serveur/portefeuille";

/**
 * Vue portefeuille du risque climatique (Directive BAM 5/W/2021) : exposition physique
 * par région, transition par secteur, émissions financées (PCAF), part verte, CBAM.
 */
export const GET = route(
  async (_req, ctx) => {
    const tous = await dossiersPerimetre(ctx);
    const evalues = tous.filter((d) => d.climat?.scoreClimat != null);
    const financeRef = (d: (typeof tous)[number]) => (d.decision === "accorde" && d.montantAccorde ? d.montantAccorde * d.tauxReference : d.montantDemandeRef);
    const total = evalues.reduce((s, d) => s + financeRef(d), 0);
    const emissions = evalues.reduce((s, d) => s + (d.climat?.emissionsFinancees ?? 0), 0);

    const regions = new Map<string, { region: string; nb: number; montant: number; physique: number; aleas: Record<string, number> }>();
    for (const d of evalues) {
      if (!d.region) continue;
      const r = regions.get(d.region.code) ?? { region: libelle(d.region.libelle, ctx.langue), nb: 0, montant: 0, physique: 0, aleas: Object.fromEntries(ALEAS.map((a) => [a, (d.region as unknown as Record<string, number>)[a] ?? 0])) };
      r.nb++;
      r.montant += financeRef(d);
      r.physique += d.climat!.scorePhysique ?? 0;
      regions.set(d.region.code, r);
    }
    const secteurs = new Map<string, { secteur: string; nb: number; montant: number; transition: number; emissions: number; cbam: number }>();
    for (const d of evalues) {
      const k = d.secteur?.code ?? "—";
      const s = secteurs.get(k) ?? { secteur: d.secteur ? `${d.secteur.code} — ${libelle(d.secteur.libelle, ctx.langue)}` : "—", nb: 0, montant: 0, transition: 0, emissions: 0, cbam: 0 };
      s.nb++;
      s.montant += financeRef(d);
      s.transition += d.climat!.scoreTransition ?? 0;
      s.emissions += d.climat!.emissionsFinancees ?? 0;
      if (d.climat!.expositionCBAM) s.cbam += financeRef(d);
      secteurs.set(k, s);
    }
    return {
      nbDossiers: tous.length,
      nbEvalues: evalues.length,
      montantEvalue: total,
      emissionsFinancees: emissions,
      intensite: total > 0 ? emissions / (total / 1_000_000) : null,
      partVerte: total > 0 ? evalues.filter((d) => d.climat!.alignementTaxonomie === "vert").reduce((s, d) => s + financeRef(d), 0) / total : null,
      montantCBAM: evalues.filter((d) => d.climat!.expositionCBAM).reduce((s, d) => s + financeRef(d), 0),
      parNiveau: compter(evalues, (d) => d.climat!.niveauClimat),
      parAlignement: compter(evalues, (d) => d.climat!.alignementTaxonomie),
      regions: Array.from(regions.values()).map((r) => ({ ...r, physique: r.physique / r.nb })).sort((a, b) => b.physique - a.physique),
      secteurs: Array.from(secteurs.values()).map((s) => ({ ...s, transition: s.transition / s.nb })).sort((a, b) => b.emissions - a.emissions),
      dossiers: evalues
        .sort((a, b) => (b.climat!.scoreClimat ?? 0) - (a.climat!.scoreClimat ?? 0))
        .slice(0, 20)
        .map((d) => ({ id: d.id, reference: d.reference, client: d.client.raisonSociale, niveau: d.climat!.niveauClimat, score: d.climat!.scoreClimat, physique: d.climat!.scorePhysique, transition: d.climat!.scoreTransition, emissions: d.climat!.emissionsFinancees })),
    };
  },
  { permission: "climat:lire" }
);
