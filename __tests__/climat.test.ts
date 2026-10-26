import { baseAttribution, couverture, emissions, evaluerClimat, lirePonderation, niveauClimat, normaliserAleas, normaliserTransition, qualitePCAF, scoreClimat, scorePhysique, scoreTransition } from "@/lib/domaine/climat";

const tousConnus = { stressHydrique: 4, secheresse: 4, inondation: 2, chaleurExtreme: 4, submersionMarine: 0, incendie: 0, seisme: 0 };
const transitionConnue = { reglementaire: 2, technologique: 2, marche: 2, reputation: 1 };

describe("volet climat", () => {
  const aleas = normaliserAleas(tousConnus);
  it("normalise les aléas (bornes 0 à 4) ; une valeur absente reste INCONNUE, jamais 0 (jeu de recette 6)", () => {
    expect(normaliserAleas({ seisme: 9, incendie: -2 })).toMatchObject({ seisme: 4, incendie: 0, inondation: null });
    expect(normaliserAleas({ inondation: "na" }).inondation).toBe("na");
  });
  it("risque physique : exposition maximale, sensibilité, adaptation", () => {
    expect(scorePhysique(aleas, 4, 0)).toBe(100);
    expect(scorePhysique(aleas, 4, 4)).toBe(60);
    expect(scorePhysique(normaliserAleas({}), 4, 0)).toBeNull();
    expect(scorePhysique(normaliserAleas(Object.fromEntries(Object.keys(tousConnus).map((k) => [k, "na"]))), 4, 0)).toBe(0);
  });
  it("aucun score global si la couverture des données est insuffisante", () => {
    const partiels = normaliserAleas({ stressHydrique: 1 });
    const r = evaluerClimat({ aleas: partiels, transition: normaliserTransition(transitionConnue), sensibilite: 2, capaciteAdaptation: 1, risqueSecteur: 2, expositionCBAM: false, alignement: "non_aligne" });
    expect(r.niveau).toBe("insuffisant");
    expect(r.score).toBeNull();
    expect(r.couverture).toBeCloseTo(5 / 11, 2);
    const complet = evaluerClimat({ aleas, transition: normaliserTransition(transitionConnue), sensibilite: 2, capaciteAdaptation: 1, risqueSecteur: 2, expositionCBAM: false, alignement: "non_aligne" });
    expect(complet.score).not.toBeNull();
    expect(couverture(aleas, normaliserTransition(transitionConnue))).toBe(1);
  });
  it("risque de transition : CBAM majore, alignement vert réduit", () => {
    const f = normaliserTransition({ reglementaire: 4, technologique: 2, marche: 2, reputation: 0 });
    const base = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: false, alignement: "non_aligne" })!;
    const cbam = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: true, partExportUE: 20, alignement: "non_aligne" })!;
    const vert = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: false, alignement: "vert" })!;
    expect(cbam).toBeGreaterThan(base);
    expect(vert).toBeCloseTo(base / 2, 1);
  });
  it("score global : risque dominant à 60 % par défaut, pondération paramétrable", () => {
    expect(scoreClimat(80, 20)).toBe(56);
    expect(scoreClimat(80, 20, lirePonderation("0.5,0.5"))).toBe(50);
    expect(lirePonderation("n'importe quoi")).toEqual([0.6, 0.4]);
    expect(niveauClimat(56)).toBe("eleve");
    expect(niveauClimat(10)).toBe("faible");
  });
  it("émissions financées (PCAF) : facteur d'attribution borné à 1", () => {
    const e = emissions({ methode: "declaree", scope1: 1000, scope2: 500, facteurSecteur: 0, montantInvestissementRef: 200, montantFinanceRef: 100 });
    expect(e).toEqual({ totales: 1500, financees: 750, attribution: 0.5 });
    const s = emissions({ methode: "estimee_secteur", facteurSecteur: 100, montantInvestissementRef: 20_000_000, montantFinanceRef: 40_000_000 });
    expect(s.totales).toBe(2000);
    expect(s.attribution).toBe(1);
  });
  it("base d'attribution : demandé avant décision, accordé, puis encours à date (jeu de recette 5)", () => {
    const d = { decision: null, montantDemandeRef: 20e6, montantAccordeRef: null, encoursRef: null, dateEncours: null, dateComite: null, dateDossier: new Date("2026-01-10") };
    expect(baseAttribution(d)).toMatchObject({ base: "demande", montantRef: 20e6 });
    const accorde = { ...d, decision: "accorde", montantAccordeRef: 8e6, dateComite: new Date("2026-03-01") };
    expect(baseAttribution(accorde)).toMatchObject({ base: "accorde", montantRef: 8e6, dateArrete: new Date("2026-03-01") });
    expect(baseAttribution({ ...accorde, encoursRef: 5e6, dateEncours: new Date("2026-09-30") })).toMatchObject({ base: "encours", montantRef: 5e6, dateArrete: new Date("2026-09-30") });
    expect(baseAttribution({ ...d, decision: "rejete", montantAccordeRef: null })).toMatchObject({ base: "demande" });
  });
  it("qualité PCAF déduite des preuves, jamais saisie", () => {
    expect(qualitePCAF("declaree", true)).toBe(1);
    expect(qualitePCAF("declaree", false)).toBe(2);
    expect(qualitePCAF("declaree", true, false)).toBe(5);
    expect(qualitePCAF("estimee_activite")).toBe(3);
    expect(qualitePCAF("estimee_secteur")).toBe(5);
  });
});

import { aleasProjetes, lirePrixCarbone, scenariosClimat, stressTransition } from "@/lib/domaine/climat";

describe("scénarios climat (BAM 5/W/2021)", () => {
  it("aggrave les aléas à 2050 sans toucher au séisme ni aux inconnus", () => {
    const a = normaliserAleas({ stressHydrique: 4, secheresse: 3, chaleurExtreme: 3, inondation: 1, submersionMarine: "na", incendie: null, seisme: 3 });
    const p = aleasProjetes(a, "ssp585");
    expect(p).toMatchObject({ stressHydrique: 4, secheresse: 4, chaleurExtreme: 4, inondation: 2, submersionMarine: "na", incendie: null, seisme: 3 });
    expect(aleasProjetes(a, "ssp245").inondation).toBe(1);
  });
  it("le risque physique 2050 est au moins égal au risque actuel", () => {
    const a = normaliserAleas({ stressHydrique: 2, secheresse: 2, inondation: 1, chaleurExtreme: 2, submersionMarine: 0, incendie: 1, seisme: 0 });
    const s = scenariosClimat({ aleas: a, sensibilite: 2, capaciteAdaptation: 1, emissionsTotales: 0, expositionCBAM: false, prix: lirePrixCarbone(null), prixETS: 850 });
    expect(s.physique.ssp245!).toBeGreaterThan(s.physique.actuel!);
    expect(s.physique.ssp585!).toBeGreaterThanOrEqual(s.physique.ssp245!);
  });
  it("coût carbone et CBAM rapportés à l'EBE, alerte au-delà du seuil", () => {
    // Aciérie : 100 000 tCO2e/an dont 60 000 directes, 35 % exportés vers l'UE, EBE 120 M MAD.
    // CBAM 2030 = 60 000 × 35 % × 850 × 48,5 % (quotas gratuits encore à 51,5 %).
    const r = stressTransition({ emissionsTotales: 100_000, emissionsDirectes: 60_000, expositionCBAM: true, partExportUE: 35, prix: lirePrixCarbone("100,850,1700"), prixETS: 850, ebeRef: 120_000_000 });
    expect(r.scenarios[0]).toMatchObject({ scenario: "actuelles", coutCarbone: 10_000_000, coutCBAM: 8_657_250 });
    expect(r.scenarios[2].total).toBe(170_000_000 + 8_657_250);
    expect(r.scenarios[2].partEBE).toBeCloseTo(1.489, 3);
    // Sans émissions directes connues : base = émissions totales (prudence) ; facteur paramétrable.
    expect(stressTransition({ emissionsTotales: 1000, expositionCBAM: true, partExportUE: 100, prix: lirePrixCarbone(null), prixETS: 1000, facteurCBAM: 1 }).scenarios[0].coutCBAM).toBe(1_000_000);
    expect(r.alerte).toBe(true);
    const sobre = stressTransition({ emissionsTotales: 500, expositionCBAM: false, prix: lirePrixCarbone(null), prixETS: 850, ebeRef: 50_000_000 });
    expect(sobre.alerte).toBe(false);
    expect(stressTransition({ emissionsTotales: 1, expositionCBAM: false, prix: lirePrixCarbone(null), prixETS: 850 }).scenarios[0].partEBE).toBeNull();
  });
});
