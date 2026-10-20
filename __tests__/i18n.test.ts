import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { DICTIONNAIRES, traduire } from "@/lib/i18n";
import { ecrireLibelle, libelle, traductionsManquantes } from "@/lib/i18n/libelle";

function cles(o: unknown, prefixe = ""): string[] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === "string" ? [`${prefixe}${k}`] : cles(v, `${prefixe}${k}.`)));
}

function fichiers(rep: string): string[] {
  return readdirSync(rep).flatMap((f) => {
    const p = join(rep, f);
    if (statSync(p).isDirectory()) return f === "node_modules" || f.startsWith(".") ? [] : fichiers(p);
    return /\.(tsx?)$/.test(f) ? [p] : [];
  });
}

describe("internationalisation", () => {
  const fr = new Set(cles(DICTIONNAIRES.fr));
  it.each(["en", "ar"])("le dictionnaire %s a exactement les clés du français", (l) => {
    const autre = new Set(cles(DICTIONNAIRES[l]));
    expect([...fr].filter((k) => !autre.has(k))).toEqual([]);
    expect([...autre].filter((k) => !fr.has(k))).toEqual([]);
  });
  it.each(["en", "ar"])("le dictionnaire %s est réellement traduit", (l) => {
    const identiques = cles(DICTIONNAIRES.fr).filter((k) => traduire(DICTIONNAIRES[l], k) === traduire(DICTIONNAIRES.fr, k) && traduire(DICTIONNAIRES.fr, k).length > 12);
    expect(identiques.length).toBeLessThan(cles(DICTIONNAIRES.fr).length * 0.05);
  });
  it("toute clé littérale t(\"…\") utilisée dans le code existe", () => {
    const racine = join(__dirname, "..");
    const manquantes = new Set<string>();
    for (const f of [...fichiers(join(racine, "app")), ...fichiers(join(racine, "components"))]) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z]+\.[a-zA-Z0-9_.]+)"/g)) if (!fr.has(m[1])) manquantes.add(`${m[1]} (${f.slice(racine.length)})`);
    }
    expect([...manquantes]).toEqual([]);
  });
  it("variables et repli sur le français", () => {
    expect(traduire(DICTIONNAIRES.fr, "commun.page", { n: 2, total: 5 })).toBe("Page 2 sur 5");
    expect(traduire(DICTIONNAIRES.fr, "cle.inexistante")).toBe("cle.inexistante");
  });
  it("libellés multilingues des référentiels", () => {
    const l = ecrireLibelle({ fr: "Ciment", en: " ", ar: "إسمنت" });
    expect(libelle(l, "en")).toBe("Ciment");
    expect(libelle(l, "ar")).toBe("إسمنت");
    expect(libelle("Texte simple", "ar")).toBe("Texte simple");
    expect(traductionsManquantes(l, ["fr", "en", "ar"])).toEqual(["en"]);
  });
});
