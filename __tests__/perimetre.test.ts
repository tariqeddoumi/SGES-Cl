import { calculerPerimetre, habillageHerite, peutEcrire, peutLire, seuilHerite, type EntiteArbre } from "@/lib/serveur/perimetre";

const e = (id: string, parent: string | null, chemin: string, extra: Partial<EntiteArbre> = {}): EntiteArbre => ({
  id, code: id, nom: id, type: "banque", parentId: parent, chemin, niveau: chemin.split("/").length - 3, pays: "MA", deviseCode: "MAD",
  langueDefaut: "fr", seuilDeclenchement: null, isActive: true, nomOutil: null, logoUrl: null, couleurPrimaire: null, ...extra,
});
const arbre = [
  e("grp", null, "/grp/", { nomOutil: "SGES Groupe", couleurPrimaire: "#123456" }),
  e("bcp", "grp", "/grp/bcp/"),
  e("ca", "bcp", "/grp/bcp/ca/", { logoUrl: "/logo-ca.png" }),
  e("bpr", "grp", "/grp/bpr/"),
  e("fil", "grp", "/grp/fil/", { isActive: false, deviseCode: "XOF", seuilDeclenchement: 1_000_000_000 }),
  e("filca", "fil", "/grp/fil/filca/"),
];

describe("périmètre multi-entités", () => {
  it("la maison mère lit sa descendance, pas l'inverse ; les sœurs ne se voient pas", () => {
    const p = calculerPerimetre(arbre, { entiteId: "bcp" });
    expect(peutLire(p, "ca")).toBe(true);
    expect(peutLire(p, "grp")).toBe(false);
    expect(peutLire(p, "bpr")).toBe(false);
  });
  it("écriture : sa seule entité, ou sa descendance avec la portée groupe", () => {
    expect(peutEcrire(calculerPerimetre(arbre, { entiteId: "bcp" }), "ca")).toBe(false);
    expect(peutEcrire(calculerPerimetre(arbre, { entiteId: "bcp", porteeEcriture: "groupe" }), "ca")).toBe(true);
  });
  it("compte sans entité : tout pour l'administrateur, rien sinon", () => {
    expect(calculerPerimetre(arbre, { entiteId: null, administrateur: true }).tout).toBe(true);
    const p = calculerPerimetre(arbre, { entiteId: null });
    expect(p.tout).toBe(false);
    expect(p.lecture).toEqual([]);
  });
  it("entité (ou ascendante) désactivée : aucun accès", () => {
    expect(calculerPerimetre(arbre, { entiteId: "filca" }).lecture).toEqual([]);
  });
  it("habillage et seuil hérités de l'entité mère la plus proche", () => {
    expect(habillageHerite(arbre, "ca")).toMatchObject({ nomOutil: "SGES Groupe", logoUrl: "/logo-ca.png", couleurPrimaire: "#123456", entite: "ca" });
    expect(seuilHerite(arbre, "filca")).toEqual({ seuil: 1_000_000_000, devise: "XOF" });
    expect(seuilHerite(arbre, "ca")).toBeNull();
  });
});
