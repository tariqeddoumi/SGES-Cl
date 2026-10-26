import { derogationPossible, reponseBloquante } from "@/lib/domaine/exclusion";

const bailleur = { bloquant: true, derogeable: true, nature: "exclusion_bailleur" };
const legal = { bloquant: false, derogeable: true, nature: "interdiction_legale" };

describe("gouvernance de la liste d'exclusion (F13)", () => {
  it("un critère bloquant coché bloque, sauf dérogation motivée", () => {
    expect(reponseBloquante({ reponse: true }, bailleur)).toBe(true);
    expect(reponseBloquante({ reponse: true, derogation: "Décision du comité RSE" }, bailleur)).toBe(false);
    expect(reponseBloquante({ reponse: true, derogation: "  " }, bailleur)).toBe(true);
    expect(reponseBloquante({ reponse: false }, bailleur)).toBe(false);
  });
  it("une interdiction légale bloque toujours et n'admet aucune dérogation", () => {
    expect(reponseBloquante({ reponse: true, derogation: "x" }, legal)).toBe(true);
    expect(derogationPossible({ ...legal, bloquant: true })).toBe(false);
  });
  it("un critère non bloquant ne bloque pas ; un critère non dérogeable reste bloquant", () => {
    expect(reponseBloquante({ reponse: true }, { ...bailleur, bloquant: false })).toBe(false);
    expect(reponseBloquante({ reponse: true, derogation: "x" }, { ...bailleur, derogeable: false })).toBe(true);
    expect(reponseBloquante({ reponse: true }, { ...bailleur, actif: false })).toBe(false);
  });
});
