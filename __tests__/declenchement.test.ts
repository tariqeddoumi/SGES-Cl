import { evaluerDeclenchement } from "@/lib/domaine/declenchement";

describe("critères déclencheurs (circulaire CFD-537/01-24)", () => {
  const base = { categorie: "B", montantDemandeRef: 5_000_000, seuil: 10_000_000 };
  it("catégorie A : obligatoire quel que soit le montant", () => {
    expect(evaluerDeclenchement({ ...base, categorie: "A" }).obligatoire).toBe(true);
  });
  it("élément de l'annexe 1 positif avant catégorisation : obligatoire", () => {
    expect(evaluerDeclenchement({ ...base, categorie: null, elementListeA: true }).motifs).toContain("categorie_a");
  });
  it("hors A : obligatoire au-delà du seuil d'investissement", () => {
    expect(evaluerDeclenchement({ ...base, montantInvestissementRef: 12_000_000 }).obligatoire).toBe(true);
    expect(evaluerDeclenchement({ ...base, montantInvestissementRef: 10_000_000 }).obligatoire).toBe(false);
  });
  it("sans montant d'investissement, le montant demandé est comparé", () => {
    expect(evaluerDeclenchement({ ...base, montantDemandeRef: 11_000_000 }).montantCompare).toBe(11_000_000);
  });
  it("crédit de fonctionnement : hors périmètre", () => {
    const r = evaluerDeclenchement({ ...base, categorie: "A", creditInvestissement: false });
    expect(r.obligatoire).toBe(false);
    expect(r.motifs).toEqual(["hors_perimetre"]);
  });
  it("sous le seuil, hors A : volontaire", () => {
    expect(evaluerDeclenchement(base).motifs).toEqual(["volontaire"]);
  });
});
