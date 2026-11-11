import { QUESTIONS } from "@/prisma/donnees/questionnaires";
import { aExaminer, documentsUtiles, lirePropositions, sourcesQuestion, SOURCES_QUESTIONS, TYPES_SOURCES, VISITE, visiteSeulement } from "@/lib/domaine/sources";
import { TYPES_DOCUMENT } from "@/prisma/donnees/organisation";

describe("Sources documentaires", () => {
  it("couvre les 55 questions du référentiel livré, avec des types de documents connus", () => {
    const codes = QUESTIONS.map((q) => q.code);
    expect(codes.filter((c) => !SOURCES_QUESTIONS[c])).toEqual([]);
    const types = new Set(TYPES_DOCUMENT.map((t) => t.code));
    for (const s of TYPES_SOURCES) expect(types.has(s)).toBe(true);
    for (const liste of Object.values(SOURCES_QUESTIONS)) for (const s of liste) expect(s === VISITE || types.has(s)).toBe(true);
  });

  it("propose par défaut la note de présentation", () => {
    expect(sourcesQuestion("INCONNUE")).toEqual(["PRESENTATION"]);
  });

  it("classe les documents par nombre d'informations vides qu'ils renseignent", () => {
    const vides = ["EFF02", "EFF03", "AIR02", "AIR03", "CL01", "CT01"].map((code) => ({ code, sources: sourcesQuestion(code) }));
    expect(documentsUtiles(vides, [])[0]).toEqual({ type: "RAPPORT_ANALYSES", nb: 4 });
    // Une information déjà couverte par un document déposé ne compte plus.
    const apres = documentsUtiles(vides, ["RAPPORT_ANALYSES"]);
    expect(apres.find((d) => d.type === "RAPPORT_ANALYSES")).toBeUndefined();
    expect(apres.find((d) => d.type === "AUTORISATION")).toBeUndefined();
    expect(apres).toEqual([{ type: "ENERGIE", nb: 1 }]);
    // La visite n'est jamais proposée comme document.
    expect(documentsUtiles([{ code: "CT01", sources: [VISITE] }], [])).toEqual([]);
    expect(visiteSeulement(sourcesQuestion("CT01"))).toBe(true);
    expect(visiteSeulement(sourcesQuestion("EFF01"))).toBe(false);
  });

  it("garde une proposition à examiner tant que la valeur enregistrée diffère", () => {
    const p = { valeur: "non", citation: null, documentId: "d1", documentNom: "EIES.pdf" };
    expect(aExaminer(p, "")).toBe(true);
    expect(aExaminer(p, null)).toBe(true);
    expect(aExaminer(p, "oui")).toBe(true);
    expect(aExaminer(p, "Non")).toBe(false);
    expect(aExaminer(undefined, "")).toBe(false);
  });

  it("lit les propositions enregistrées et tolère un contenu invalide", () => {
    expect(lirePropositions(null)).toBeNull();
    expect(lirePropositions("{")).toBeNull();
    const p = lirePropositions(JSON.stringify({ lueLe: "2026-11-11", modele: "m", synthese: "", evaluation: { q1: { valeur: "oui", citation: null, documentId: null, documentNom: null } } }));
    expect(p?.identification).toEqual({});
    expect(p?.documents).toEqual([]);
    expect(p?.evaluation.q1.valeur).toBe("oui");
  });
});
