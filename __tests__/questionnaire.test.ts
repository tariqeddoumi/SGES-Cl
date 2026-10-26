import { moduleRetenu, modulesRetenus, niveauQuestionnaire, questionPosee, type ContexteDossier } from "@/lib/domaine/questionnaire";

const ctx: ContexteDossier = { codeSecteur: "I55", typeZone: "COTIERE", natureProjet: "CREATION", effectif: 80, stressHydrique: 2, equateur: false };

describe("niveau du questionnaire", () => {
  it("complet par défaut, et toujours pour A, FI ou sur décision RSE", () => {
    expect(niveauQuestionnaire("B", {})).toBe("complet");
    expect(niveauQuestionnaire("A", { parametre: "minimum" })).toBe("complet");
    expect(niveauQuestionnaire("FI", { parametre: "minimum" })).toBe("complet");
    expect(niveauQuestionnaire("B", { parametre: "minimum", complet: true })).toBe("complet");
    expect(niveauQuestionnaire("C", { parametre: "minimum" })).toBe("minimum");
  });
  it("exigences SFI : au moins standard", () => {
    expect(niveauQuestionnaire("B", { parametre: "minimum", exigencesSFI: true })).toBe("standard");
    expect(niveauQuestionnaire("B", { parametre: "standard", exigencesSFI: true })).toBe("standard");
  });
});

describe("modules d'activité", () => {
  it("un critère rempli suffit", () => {
    expect(moduleRetenu({ code: "M1", secteurs: "C10,I55" }, ctx)).toBe(true);
    expect(moduleRetenu({ code: "M2", secteurs: "C23,C24" }, ctx)).toBe(false);
    expect(moduleRetenu({ code: "M2", secteurs: "C" }, { ...ctx, codeSecteur: "C2394" })).toBe(true);
    expect(moduleRetenu({ code: "M2", secteurs: "D35" }, { ...ctx, codeSecteur: "D3511R" })).toBe(false);
    expect(moduleRetenu({ code: "M5", zones: "SENSIBLE,COTIERE" }, ctx)).toBe(true);
    expect(moduleRetenu({ code: "E50", effectifMin: 50 }, { ...ctx, effectif: 30 })).toBe(false);
    expect(moduleRetenu({ code: "EP", equateur: true }, ctx)).toBe(false);
    expect(moduleRetenu({ code: "EP", equateur: true }, { ...ctx, equateur: true })).toBe(true);
  });
  it("donnée inconnue : module retenu par prudence", () => {
    expect(moduleRetenu({ code: "E50", effectifMin: 50 }, { ...ctx, effectif: null })).toBe(true);
    expect(moduleRetenu({ code: "M2", secteurs: "C23" }, { ...ctx, codeSecteur: null })).toBe(true);
    expect(moduleRetenu({ code: "M8", stressHydriqueMin: 3 }, { ...ctx, stressHydrique: null })).toBe(true);
  });
  it("liste des modules retenus", () => {
    expect(modulesRetenus([{ code: "M1", secteurs: "I55" }, { code: "M2", secteurs: "C24" }, { code: "X" }], ctx)).toEqual(["M1", "X"]);
  });
});

describe("question posée", () => {
  const connus = ["M1", "M2"];
  it("complet : tout est posé", () => {
    expect(questionPosee({ niveau: "bonne_pratique", module: "M2" }, "complet", [], connus)).toBe(true);
  });
  it("minimum : réglementaire et interne seulement, selon les modules", () => {
    expect(questionPosee({ niveau: "reglementaire" }, "minimum", [], connus)).toBe(true);
    expect(questionPosee({ niveau: "interne" }, "minimum", [], connus)).toBe(true);
    expect(questionPosee({ niveau: "sfi" }, "minimum", [], connus)).toBe(false);
    expect(questionPosee({ niveau: "reglementaire", module: "M2" }, "minimum", ["M1"], connus)).toBe(false);
    expect(questionPosee({ niveau: "reglementaire", module: "M1" }, "minimum", ["M1"], connus)).toBe(true);
  });
  it("standard : ajoute SFI ; un module inconnu ne filtre pas", () => {
    expect(questionPosee({ niveau: "sfi" }, "standard", [], connus)).toBe(true);
    expect(questionPosee({ niveau: "bonne_pratique" }, "standard", [], connus)).toBe(false);
    expect(questionPosee({ niveau: "sfi", module: "ZZ" }, "standard", [], connus)).toBe(true);
  });
});
