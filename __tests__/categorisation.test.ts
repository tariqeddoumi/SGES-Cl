import { calculerCategorie, eieRequise, lirePreseance } from "@/lib/domaine/categorisation";

const Q = [
  ...Array.from({ length: 11 }, (_, i) => ({ id: `a${i + 1}`, categorie: "A" })),
  ...Array.from({ length: 12 }, (_, i) => ({ id: `b${i + 12}`, categorie: "B" })),
  { id: "c24", categorie: "C" },
  { id: "fi25", categorie: "FI" },
];
const tousNon = () => Object.fromEntries(Q.map((q) => [q.id, false])) as Record<string, boolean>;

describe("catégorisation (procédure §3.3)", () => {
  it("A dès qu'un élément 1 à 11 est positif, quelles que soient les autres réponses", () => {
    const r = { ...tousNon(), a3: true, b13: true, c24: true };
    expect(calculerCategorie(Q, r).categorie).toBe("A");
  });
  it("A même si le formulaire est incomplet", () => {
    expect(calculerCategorie(Q, { a1: true }).categorie).toBe("A");
  });
  it("B si aucun A et au moins un élément 12 à 23", () => {
    expect(calculerCategorie(Q, { ...tousNon(), b15: true }).categorie).toBe("B");
  });
  it("C si seul l'élément 24 est positif", () => {
    expect(calculerCategorie(Q, { ...tousNon(), c24: true }).categorie).toBe("C");
  });
  it("FI si seul l'élément 25 est positif ; FI l'emporte sur C par défaut", () => {
    expect(calculerCategorie(Q, { ...tousNon(), fi25: true }).categorie).toBe("FI");
    expect(calculerCategorie(Q, { ...tousNon(), fi25: true, c24: true }).categorie).toBe("FI");
  });
  it("préséance paramétrable", () => {
    expect(calculerCategorie(Q, { ...tousNon(), fi25: true, c24: true }, lirePreseance("A,B,C,FI")).categorie).toBe("C");
  });
  it("incomplet sans élément A : pas de catégorie", () => {
    const r = calculerCategorie(Q, { b12: true });
    expect(r.categorie).toBeNull();
    expect(r.complet).toBe(false);
  });
  it("aucun positif : pas de catégorie", () => {
    expect(calculerCategorie(Q, tousNon()).categorie).toBeNull();
  });
  it("EIE exigée en catégorie A seulement", () => {
    expect(eieRequise("A")).toBe(true);
    expect(eieRequise("B")).toBe(false);
  });
  it("lirePreseance complète une liste partielle et ignore l'inconnu", () => {
    expect(lirePreseance("B,X")).toEqual(["B", "A", "FI", "C"]);
  });
});
