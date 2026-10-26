import { genererClauses, type EntreeClauses } from "@/lib/domaine/clauses";

const base: EntreeClauses = { categorie: "B", eieRequise: false, pieces: [], actionsRetenues: [], derogations: [] };
const codes = (e: EntreeClauses) => genererClauses(e).map((c) => c.code);

describe("clauses E&S du contrat de crédit", () => {
  it("socle : conformité, exclusion, visites, reporting annuel, cas de défaut", () => {
    expect(codes({ ...base, categorie: "C" })).toEqual(["eg_conformite", "eg_exclusion", "eg_visites", "rp_annuel", "cd_manquement"]);
  });
  it("catégorie A : acceptabilité, EIES manquante, reporting semestriel, émissions", () => {
    const c = codes({ ...base, categorie: "A", eieRequise: true });
    expect(c).toEqual(expect.arrayContaining(["cp_acceptabilite", "cp_eies", "cp_autorisations", "rp_semestriel", "rp_emissions", "cd_incident"]));
    expect(codes({ ...base, categorie: "A", eieRequise: true, pieces: ["EIES", "AUTORISATION"] })).not.toContain("cp_eies");
  });
  it("plan d'actions : signature préalable, engagement global et actions datées par échéance", () => {
    const cl = genererClauses({
      ...base,
      actionsRetenues: [
        { libelle: "Station d'épuration", echeance: "2027-06-30", horizon: "moyen" },
        { libelle: "Autorisation de déversement", echeance: "2027-01-31", horizon: "court" },
        { libelle: "Formation HSE", echeance: null, horizon: "court" },
        { libelle: "Déjà faite", echeance: "2026-01-01", horizon: "court", statut: "realisee" },
      ],
    });
    expect(cl.map((x) => x.code)).toEqual(expect.arrayContaining(["cp_plan_signe", "eg_plan"]));
    const actions = cl.filter((x) => x.code.startsWith("eg_action"));
    expect(actions.map((x) => x.vars?.action)).toEqual(["Autorisation de déversement", "Station d'épuration", "Formation HSE"]);
  });
  it("réserves du comité, dérogation, climat, CBAM et ligne de bailleur", () => {
    const c = genererClauses({
      ...base,
      reservesComite: "Autorisation de déversement avant le second tirage",
      derogations: [{ code: "EXC03", justification: "Activité accessoire < 5 % du CA" }],
      climat: { niveau: "eleve", alerteTransition: true, expositionCBAM: true, methodeEmissions: "estimee_secteur" },
      ligneFinancement: "SUNREF",
    });
    expect(c.map((x) => x.code)).toEqual(expect.arrayContaining(["cp_reserves", "cp_derogation", "eg_climat", "eg_cbam", "eg_ligne", "rp_emissions"]));
    expect(c.find((x) => x.code === "eg_ligne")?.vars).toEqual({ ligne: "SUNREF" });
  });
});
