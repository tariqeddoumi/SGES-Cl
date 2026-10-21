import { readFileSync } from "fs";
import { join } from "path";
import { convertirSchema } from "../scripts/db/fournisseur";
import { deserialiser, serialiser } from "@/lib/serveur/sauvegarde";

const schema = readFileSync(join(__dirname, "../prisma/schema.prisma"), "utf8");

describe("portabilité multi-bases", () => {
  it("le schéma de référence respecte les règles de portabilité", () => {
    expect(schema).not.toMatch(/^\s*enum\s/m);
    expect(schema).not.toMatch(/^\s+\w+\s+Json\??\s/m);
    // Toute relation déclare onUpdate: NoAction (chemins de cascade SQL Server).
    const relations = schema.match(/@relation\([^)]*fields:[^)]*\)/g) ?? [];
    expect(relations.length).toBeGreaterThan(20);
    for (const r of relations) expect(r).toContain("onUpdate: NoAction");
  });
  it.each(["sqlserver", "mysql", "sqlite"] as const)("conversion aller-retour %s sans perte", (cible) => {
    const converti = convertirSchema(schema, cible);
    expect(converti).toContain(`provider = "${cible}"`);
    if (cible === "sqlserver") expect(converti).toContain("@db.NVarChar(Max)");
    if (cible === "sqlite") expect(converti).not.toMatch(/ @db\./);
    expect(convertirSchema(converti, "postgresql")).toBe(schema);
  });
  it("sauvegarde : dates et binaires restitués à l'identique", () => {
    const d = { a: new Date("2026-10-20T10:00:00.123Z"), b: Buffer.from([1, 2, 3]), c: [{ x: 1 }], n: null };
    const r = deserialiser(JSON.parse(JSON.stringify(serialiser(d)))) as typeof d;
    expect(r.a.getTime()).toBe(d.a.getTime());
    expect(Buffer.compare(r.b, d.b)).toBe(0);
    expect(r.c).toEqual([{ x: 1 }]);
  });
});
