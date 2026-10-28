import { calculerESG, lirePonderationESG, lireSeuilsESG, noteDepuisScore, pilierQuestion, scoreDocumentation, scoreEngagement, scoreTransparence, type EntreeESG, type QuestionESG } from "@/lib/domaine/esg";

const q = (id: string, pilier: "E" | "S" | "G", valeur: string | null, gravite = 2, extra: Partial<QuestionESG> = {}): QuestionESG => ({ id, type: "oui_non", reponseRisque: "non", gravite, pilier, valeur, ...extra });
const base: EntreeESG = { questions: [], climat: null, pieces: [], actions: [], conformiteVisite: null, exclu: false, suivi: false };

describe("note ESG", () => {
  it("pilier : celui de la question, sinon celui de la thématique", () => {
    expect(pilierQuestion({ thematique: "HSE" })).toBe("S");
    expect(pilierQuestion({ thematique: "GEST_ENV", pilier: "G" })).toBe("G");
    expect(pilierQuestion({ thematique: "SIGNALETIQUE" })).toBeNull();
  });
  it("tout maîtrisé : 100, note A", () => {
    const r = calculerESG({ ...base, questions: [q("1", "E", "oui"), q("2", "S", "oui"), q("3", "G", "oui")] });
    expect(r.score).toBe(100);
    expect(r.note).toBe("A");
    expect(r.provisoire).toBe(false);
  });
  it("les risques pèsent selon leur gravité", () => {
    const r = calculerESG({ ...base, questions: [q("1", "E", "oui", 1), q("2", "E", "non", 3), q("3", "S", "oui"), q("4", "G", "oui")] });
    expect(r.piliers.E.score).toBe(25);
    expect(r.piliers.E.risques).toBe(1);
    // 0,4 × 25 + 0,3 × 100 + 0,3 × 100
    expect(r.score).toBe(70);
    expect(r.note).toBe("B");
  });
  it("« sans objet » n'entre pas dans la note ; les questions sans réponse réduisent la couverture", () => {
    const r = calculerESG({ ...base, questions: [q("1", "E", "na"), q("2", "E", "oui"), q("3", "S", null), q("4", "S", null)] });
    expect(r.piliers.E.score).toBe(100);
    expect(r.piliers.S.score).toBeNull();
    expect(r.couverture).toBe(0.5);
    expect(r.provisoire).toBe(true);
  });
  it("climat : 30 % du pilier E (100 − risque)", () => {
    const r = calculerESG({ ...base, questions: [q("1", "E", "oui")], climat: { score: 60, couverture: 1, qualitePCAF: 3 } });
    expect(r.piliers.E.score).toBe(82); // 0,7 × 100 + 0,3 × 40
  });
  it("risque critique non maîtrisé : plafonné à D", () => {
    const r = calculerESG({ ...base, questions: [q("1", "E", "non", 4), ...Array.from({ length: 20 }, (_, i) => q(`s${i}`, "S", "oui")), q("g", "G", "oui")] });
    expect(r.plafond).toBe("risque_critique");
    expect(r.note).toBe("D");
  });
  it("suivi : une action réalisée rend le risque maîtrisé ; une visite non conforme plafonne à C", () => {
    const qs = [q("1", "E", "non", 3, { actionRealisee: true }), q("2", "S", "oui"), q("3", "G", "oui")];
    expect(calculerESG({ ...base, questions: qs }).piliers.E.score).toBe(0);
    const suivi = calculerESG({ ...base, questions: qs, suivi: true, conformiteVisite: "non_conforme" });
    expect(suivi.piliers.E.score).toBe(100);
    expect(suivi.plafond).toBe("visite_non_conforme");
    expect(suivi.note).toBe("C");
  });
  it("aucune réponse : pas de note, même avec des pièces", () => {
    const r = calculerESG({ ...base, questions: [q("1", "G", null)], pieces: [{ niveau: "obligatoire", statut: "manquant", officiel: true }] });
    expect(r.score).toBeNull();
    expect(r.note).toBeNull();
  });
  it("projet exclu : pas de note", () => {
    const r = calculerESG({ ...base, exclu: true, questions: [q("1", "E", "oui")] });
    expect(r.exclu).toBe(true);
    expect(r.note).toBeNull();
  });
  it("composantes de gouvernance", () => {
    expect(scoreDocumentation([{ niveau: "obligatoire", statut: "complet", officiel: true }, { niveau: "recommandee", statut: "manquant", officiel: false }])).toBe(66.7);
    expect(scoreDocumentation([{ niveau: "obligatoire", statut: "canevas", officiel: true }])).toBe(50);
    expect(scoreEngagement([{ retenue: true, statut: "a_faire", avancement: 0, enRetard: false }, { retenue: false, statut: "a_faire", avancement: 0, enRetard: false }, { retenue: null, statut: "a_faire", avancement: 0, enRetard: false }], false)).toBe(50);
    expect(scoreEngagement([{ retenue: true, statut: "realisee", avancement: 100, enRetard: false }, { retenue: true, statut: "en_cours", avancement: 40, enRetard: true }], true)).toBe(50);
    expect(scoreTransparence({ score: null, couverture: 0.8, qualitePCAF: 3 })).toBe(65);
  });
  it("paramètres et notes", () => {
    expect(lirePonderationESG("50,25,25")).toEqual({ E: 50, S: 25, G: 25 });
    expect(lirePonderationESG("x")).toEqual({ E: 0.4, S: 0.3, G: 0.3 });
    expect(lireSeuilsESG("90,70,50,30")).toEqual([90, 70, 50, 30]);
    expect(lireSeuilsESG("10,20,30,40")).toEqual([80, 65, 50, 35]);
    expect(noteDepuisScore(64.9)).toBe("C");
    expect(noteDepuisScore(34)).toBe("E");
  });
});
