import { anonymiser } from "@/lib/domaine/anonymisation";
import {
  analyseDepuisCanevas,
  construireChecklist,
  definition,
  lireAnalyse,
  nettoyerReponses,
  piecesAttendues,
  type AnalysePiece,
  type PieceDeposee,
} from "@/lib/domaine/pieces";

const analyse = (type: string, etats: Record<string, "present" | "partiel" | "absent">, precisions: Record<string, string> = {}): AnalysePiece => ({
  typeDetecte: type,
  resume: "",
  champs: Object.entries(etats).map(([code, etat]) => ({ code, etat, precision: precisions[code] ?? null, citation: null })),
});
const toutPresent = (type: string): AnalysePiece =>
  analyse(type, Object.fromEntries((definition(type)?.champs ?? []).map((x) => [x.code, "present" as const])));
const piece = (id: string, type: string, a: AnalysePiece | null, texte = true): PieceDeposee => ({ id, type, nom: `${id}.pdf`, texteDisponible: texte, analyse: a });

describe("pièces attendues", () => {
  it("exige EIES, PGES, acceptabilité et autorisation en catégorie A", () => {
    const a = piecesAttendues("A");
    for (const code of ["EIES", "PGES", "ACCEPTABILITE", "AUTORISATION"]) expect(a.find((p) => p.code === code)?.niveau).toBe("obligatoire");
  });
  it("les recommande seulement en catégorie B", () => {
    const b = piecesAttendues("B");
    expect(b.find((p) => p.code === "EIES")?.niveau).toBe("recommandee");
    expect(b.some((p) => p.niveau === "obligatoire")).toBe(false);
  });
  it("n'affiche que le socle commun tant que la catégorie est inconnue", () => {
    expect(piecesAttendues(null).map((p) => p.code)).toEqual(["PRESENTATION", "PLAN_ACTION", "ENGAGEMENT"]);
  });
  it("un dossier à EIES requise est traité comme une catégorie A", () => {
    expect(piecesAttendues(null, true).find((p) => p.code === "EIES")?.niveau).toBe("obligatoire");
  });
});

describe("check-list", () => {
  const attendues = piecesAttendues("A");

  it("signale manquantes les pièces non déposées", () => {
    const c = construireChecklist(attendues, []);
    expect(c.lignes.find((l) => l.code === "EIES")?.statut).toBe("manquant");
    expect(c.aCompleter).toBe(4);
  });

  it("une pièce déposée mais non analysée est « non analysée »", () => {
    const c = construireChecklist(attendues, [piece("d1", "EIES", null)]);
    expect(c.lignes.find((l) => l.code === "EIES")?.statut).toBe("non_analyse");
  });

  it("une pièce complète est complète", () => {
    const c = construireChecklist(attendues, [piece("d1", "EIES", toutPresent("EIES"))]);
    const l = c.lignes.find((x) => x.code === "EIES")!;
    expect(l.statut).toBe("complet");
    expect(l.champsManquants).toEqual([]);
  });

  it("liste précisément les informations manquantes ou partielles", () => {
    const a = analyse("EIES", { eies_resume: "present", eies_description: "present", eies_etat_initial: "partiel", eies_impacts: "present", eies_mesures: "present", eies_surveillance: "absent", eies_consultation: "present", eies_auteur: "present" }, { eies_etat_initial: "Pas de campagne de mesure du bruit" });
    const l = construireChecklist(attendues, [piece("d1", "EIES", a)]).lignes.find((x) => x.code === "EIES")!;
    expect(l.statut).toBe("incomplet");
    expect(l.champsManquants).toEqual([
      { code: "eies_etat_initial", etat: "partiel", precision: "Pas de campagne de mesure du bruit" },
      { code: "eies_surveillance", etat: "absent", precision: null },
    ]);
  });

  it("ignore les informations facultatives", () => {
    const a = analyse("EIES", { ...Object.fromEntries(definition("EIES")!.champs.map((x) => [x.code, "present" as const])), eies_alternatives: "absent" });
    expect(construireChecklist(attendues, [piece("d1", "EIES", a)]).lignes.find((x) => x.code === "EIES")?.statut).toBe("complet");
  });

  it("fusionne plusieurs documents de même type en retenant le meilleur état", () => {
    const a1 = analyse("PGES", { pges_mesures: "present", pges_responsables: "absent" });
    const a2 = analyse("PGES", { pges_responsables: "present", pges_calendrier: "present", pges_budget: "present", pges_indicateurs: "present" });
    const l = construireChecklist(attendues, [piece("d1", "PGES", a1), piece("d2", "PGES", a2)]).lignes.find((x) => x.code === "PGES")!;
    expect(l.statut).toBe("complet");
  });

  it("reconnaît une pièce déposée en « Autre » et signale l'incohérence de type", () => {
    const c = construireChecklist(attendues, [piece("d1", "AUTRE", toutPresent("PGES"))]);
    expect(c.lignes.find((x) => x.code === "PGES")?.statut).toBe("complet");
    expect(c.incoherences).toEqual([{ documentId: "d1", nom: "d1.pdf", declare: "AUTRE", detecte: "PGES" }]);
  });

  it("n'accepte pas un canevas à la place d'une pièce officielle", () => {
    const canevas = piece("c1", "CANEVAS", analyseDepuisCanevas("EIES", Object.fromEntries(definition("EIES")!.champs.map((x) => [x.code, "renseigné"]))));
    const c = construireChecklist(attendues, [canevas]);
    const l = c.lignes.find((x) => x.code === "EIES")!;
    expect(l.statut).toBe("canevas");
    expect(c.aCompleter).toBe(4); // l'EIES reste à régulariser
  });

  it("un canevas incomplet laisse la pièce « incomplète »", () => {
    const canevas = piece("c1", "CANEVAS", analyseDepuisCanevas("PRESENTATION", { pres_objet: "Extension de raffinerie" }));
    const l = construireChecklist(piecesAttendues("B"), [canevas]).lignes.find((x) => x.code === "PRESENTATION")!;
    expect(l.statut).toBe("incomplet");
    expect(l.canevas?.reponses).toEqual({ pres_objet: "Extension de raffinerie" });
    expect(l.champsManquants.map((x) => x.code)).not.toContain("pres_objet");
  });

  it("un canevas complet remplace une pièce non officielle", () => {
    const reponses = Object.fromEntries(definition("PRESENTATION")!.champs.map((x) => [x.code, "x"]));
    const l = construireChecklist(piecesAttendues("B"), [piece("c1", "CANEVAS", analyseDepuisCanevas("PRESENTATION", reponses))]).lignes.find((x) => x.code === "PRESENTATION")!;
    expect(l.statut).toBe("canevas");
  });

  it("un canevas complète les informations manquantes d'un document déposé", () => {
    const a = analyse("PGES", { pges_mesures: "present", pges_responsables: "present", pges_calendrier: "present", pges_indicateurs: "present", pges_budget: "absent" });
    const canevas = piece("c1", "CANEVAS", analyseDepuisCanevas("PGES", { pges_budget: "1,2 MMAD" }));
    const l = construireChecklist(attendues, [piece("d1", "PGES", a), canevas]).lignes.find((x) => x.code === "PGES")!;
    expect(l.statut).toBe("complet");
  });
});

describe("canevas", () => {
  it("écarte les champs inconnus et les valeurs vides", () => {
    expect(nettoyerReponses("PGES", { pges_budget: " 100 ", inconnu: "x", pges_mesures: "  " })).toEqual({ pges_budget: "100" });
  });
  it("lit une analyse stockée en JSON, ou null", () => {
    expect(lireAnalyse(null)).toBeNull();
    expect(lireAnalyse("pas du json")).toBeNull();
    expect(lireAnalyse(JSON.stringify(toutPresent("PGES")))?.typeDetecte).toBe("PGES");
  });
});

describe("anonymisation", () => {
  it("masque les identifiants structurés", () => {
    const r = anonymiser("Contact : a.b@exemple.ma, tél. 06 61 23 45 67 ou +212 5 22 33 44 55. ICE 001234567000089. Compte 18278000099999999901. CIN BE123456.");
    expect(r.texte).not.toMatch(/exemple\.ma|61 23 45|001234567000089|18278000099999999901|BE123456/);
    expect(r.texte).toContain("[EMAIL]");
    expect(r.texte).toContain("[ICE]");
    expect(r.texte).toContain("[COMPTE]");
    expect(r.masques.telephone).toBe(2);
  });
  it("masque un RIB de 24 chiffres", () => {
    expect(anonymiser("RIB 007 780 0001234567890123 45").texte).toContain("[RIB]");
  });
  it("conserve les données techniques du projet", () => {
    const t = "Capacité 1 200 t/j, investissement 120 000 000 MAD, loi 49-17, norme ISO 14001, latitude 34.2563.";
    expect(anonymiser(t).texte).toBe(t);
  });
});

import JSZip from "jszip";
import { extraireTexte } from "@/lib/serveur/extraction";

describe("extraction de texte", () => {
  it("lit le texte d'un document Word", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document><w:body><w:p><w:r><w:t>Plan de gestion &amp; suivi</w:t></w:r></w:p><w:p><w:r><w:t>Budget : 1,3 M MAD</w:t></w:r></w:p></w:body></w:document>');
    const octets = await zip.generateAsync({ type: "uint8array" });
    const t = await extraireTexte("application/vnd.openxmlformats-officedocument.wordprocessingml.document", octets);
    expect(t).toContain("Plan de gestion & suivi");
    expect(t).toContain("Budget : 1,3 M MAD");
  });
  it("renvoie null pour un format sans texte", async () => {
    expect(await extraireTexte("image/png", new Uint8Array([1, 2]))).toBeNull();
  });
});
