import { calculerRisque, estRisque, lireSeuils, niveauDepuisScore, questionApplicable } from "@/lib/domaine/risque";

const q = (id: string, gravite: number, reponseRisque = "non", type = "oui_non", thematique = "ENV") => ({ id, gravite, reponseRisque, type, thematique });

describe("évaluation des risques E&S", () => {
  it("détecte la réponse à risque (oui/non, nombre avec seuil)", () => {
    expect(estRisque({ type: "oui_non", reponseRisque: "non" }, "Non")).toBe(true);
    expect(estRisque({ type: "oui_non", reponseRisque: "oui" }, "non")).toBe(false);
    expect(estRisque({ type: "oui_non_na", reponseRisque: "non" }, "na")).toBe(false);
    expect(estRisque({ type: "nombre", reponseRisque: ">30" }, "45")).toBe(true);
    expect(estRisque({ type: "nombre", reponseRisque: ">30" }, "30")).toBe(false);
    expect(estRisque({ type: "nombre", reponseRisque: "<=2,5" }, "2,5")).toBe(true);
  });
  it("score pondéré par la gravité", () => {
    const r = calculerRisque([q("a", 3), q("b", 1)], { a: "non", b: "oui" });
    expect(r.score).toBe(75);
    expect(r.nbRisques).toBe(1);
  });
  it("les « sans objet » et questions descriptives ne pèsent pas", () => {
    const r = calculerRisque([q("a", 2), { id: "d", gravite: 2, reponseRisque: null as unknown as string, type: "texte", thematique: "SIG" }, q("n", 4, "non", "oui_non_na")], { a: "non", d: "texte", n: "na" });
    expect(r.score).toBe(100);
    const sig = r.parThematique.find((t) => t.thematique === "SIG");
    expect(sig?.etat).toBe("non_concerne");
  });
  it("catégorie A relève le niveau d'un cran ; un risque critique impose au moins « élevé »", () => {
    const qs = [q("a", 1), ...Array.from({ length: 9 }, (_, i) => q(`x${i}`, 1))];
    const rep = Object.fromEntries(qs.map((x) => [x.id, "oui"]));
    rep.a = "non"; // 10 % → faible
    expect(calculerRisque(qs, rep).niveau).toBe("faible");
    expect(calculerRisque(qs, rep, { categorie: "A" }).niveau).toBe("modere");
    const qc = [q("c", 4), ...Array.from({ length: 30 }, (_, i) => q(`y${i}`, 4))];
    const rc = Object.fromEntries(qc.map((x) => [x.id, "oui"]));
    rc.c = "non";
    expect(calculerRisque(qc, rc).niveau).toBe("eleve");
  });
  it("questions obligatoires sans réponse : évaluation incomplète", () => {
    const r = calculerRisque([q("a", 2), q("b", 2)], { a: "oui" });
    expect(r.complet).toBe(false);
    expect(r.manquantes).toEqual(["b"]);
  });
  it("seuils paramétrables, avec repli si la saisie est incohérente", () => {
    expect(lireSeuils("10,20,30")).toEqual({ modere: 10, eleve: 20, critique: 30 });
    expect(lireSeuils("30,20,10").modere).toBe(15);
    expect(niveauDepuisScore(59.9)).toBe("eleve");
    expect(niveauDepuisScore(60)).toBe("critique");
  });
  it("applicabilité par catégorie et par secteur (un code de section couvre ses divisions)", () => {
    expect(questionApplicable({ categories: "A,B" }, "B")).toBe(true);
    expect(questionApplicable({ categories: "A,B" }, "C")).toBe(false);
    expect(questionApplicable({ categories: "A", secteurs: "C23" }, "A", "C2394")).toBe(true);
    expect(questionApplicable({ categories: "A", secteurs: "C23" }, "A", "D35")).toBe(false);
    expect(questionApplicable({ categories: "A", actif: false }, "A")).toBe(false);
  });
});
