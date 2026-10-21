import { emissions, niveauClimat, normaliserAleas, qualitePCAF, scoreClimat, scorePhysique, scoreTransition } from "@/lib/domaine/climat";

describe("volet climat", () => {
  const aleas = normaliserAleas({ stressHydrique: 4, secheresse: 4, inondation: 2, chaleurExtreme: 4 });
  it("normalise les aléas (bornes 0 à 4, valeurs absentes à 0)", () => {
    expect(normaliserAleas({ seisme: 9, incendie: -2 })).toMatchObject({ seisme: 4, incendie: 0, inondation: 0 });
  });
  it("risque physique : exposition maximale, sensibilité, adaptation", () => {
    const sans = scorePhysique(aleas, 4, 0);
    const adapte = scorePhysique(aleas, 4, 4);
    expect(sans).toBe(100);
    expect(adapte).toBe(60);
    expect(scorePhysique(normaliserAleas({}), 4, 0)).toBe(0);
  });
  it("risque de transition : CBAM majore, alignement vert réduit", () => {
    const f = { reglementaire: 4, technologique: 2, marche: 2, reputation: 0 };
    const base = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: false, alignement: "non_aligne" });
    const cbam = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: true, partExportUE: 20, alignement: "non_aligne" });
    const vert = scoreTransition({ risqueSecteur: 4, facteurs: f, expositionCBAM: false, alignement: "vert" });
    expect(cbam).toBeGreaterThan(base);
    expect(vert).toBeCloseTo(base / 2, 1);
  });
  it("score global : risque dominant à 60 %", () => {
    expect(scoreClimat(80, 20)).toBe(56);
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
  it("qualité des données PCAF selon la méthode", () => {
    expect(qualitePCAF("declaree", true)).toBe(1);
    expect(qualitePCAF("estimee_secteur")).toBe(5);
  });
});
