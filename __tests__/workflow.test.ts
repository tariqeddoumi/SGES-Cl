import { motifsBlocageSoumission, planModifiable, transitionsPossibles, evaluationModifiable } from "@/lib/domaine/workflow";

describe("circuit du dossier", () => {
  it("transitions selon le statut et les permissions", () => {
    expect(transitionsPossibles("brouillon", ["dossier:soumettre", "dossier:modifier"])).toEqual(["soumettre", "annuler"]);
    expect(transitionsPossibles("soumis", ["dossier:valider"])).toEqual(["retourner", "valider"]);
    expect(transitionsPossibles("soumis", ["dossier:soumettre"])).toEqual([]);
    expect(transitionsPossibles("valide", ["dossier:decider"])).toEqual(["decider"]);
  });
  it("verrou : l'évaluation ne se modifie qu'en brouillon ; le plan aussi après décision", () => {
    expect(evaluationModifiable("valide")).toBe(false);
    expect(planModifiable("valide")).toBe(false);
    expect(planModifiable("en_suivi")).toBe(true);
  });
  it("motifs de blocage de la soumission", () => {
    const ok = { identification: true, exclusion: true, categorisation: true, categorisationComplete: true, evaluation: true, climat: true, plan: true, exclusionBloquante: false, eie: true };
    expect(motifsBlocageSoumission(ok, { climatObligatoire: true, eieObligatoire: true })).toEqual([]);
    expect(motifsBlocageSoumission({ ...ok, eie: false, climat: false }, { climatObligatoire: false, eieObligatoire: true })).toEqual(["eie"]);
    // Jeu de recette 1 : seul un élément A est « oui », les autres sont sans réponse → classement A provisoire, soumission interdite.
    expect(motifsBlocageSoumission({ ...ok, categorisationComplete: false }, { climatObligatoire: true, eieObligatoire: true })).toEqual(["categorisation_incomplete"]);
    expect(motifsBlocageSoumission({ ...ok, categorisation: false, categorisationComplete: false }, { climatObligatoire: true, eieObligatoire: true })).toEqual(["categorisation"]);
    expect(motifsBlocageSoumission({ ...ok, exclusionBloquante: true }, { climatObligatoire: true, eieObligatoire: false })).toEqual(["exclusion_bloquante"]);
  });
});
