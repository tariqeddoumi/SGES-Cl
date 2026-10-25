import { arrondirMontant, convertir, coursA, coursRetenu, formatMontantCompact } from "@/lib/devises";

const cours = [
  { deviseCode: "EUR", date: "2026-01-01", taux: 10.8 },
  { deviseCode: "EUR", date: "2026-06-01", taux: 11 },
  { deviseCode: "USD", date: "2026-01-01", taux: 9.35 },
];

describe("multi-devises", () => {
  it("dernier cours connu à la date", () => {
    expect(coursA(cours, "EUR", "MAD", new Date("2026-03-01"))).toBe(10.8);
    expect(coursA(cours, "EUR", "MAD", new Date("2026-07-01"))).toBe(11);
    expect(coursA(cours, "MAD", "MAD")).toBe(1);
    expect(coursA(cours, "GBP", "MAD")).toBeNull();
  });
  it("jamais de cours postérieur à la date du dossier (jeu de recette 7)", () => {
    // Cours de janvier, dossier de décembre précédent : conversion bloquée.
    expect(coursA(cours, "EUR", "MAD", new Date("2025-12-15"))).toBeNull();
    expect(convertir(100, "EUR", "MAD", cours, "MAD", new Date("2025-12-15"))).toBeNull();
  });
  it("un cours plus ancien que la durée de validité n'est plus admis", () => {
    expect(coursA(cours, "EUR", "MAD", new Date("2026-06-04"), 5)).toBe(11);
    expect(coursA(cours, "EUR", "MAD", new Date("2026-06-20"), 5)).toBeNull();
    expect(coursA(cours, "EUR", "MAD", new Date("2026-06-20"), 0)).toBe(11);
  });
  it("restitue la date et la source du cours appliqué", () => {
    const r = coursRetenu([{ deviseCode: "EUR", date: "2026-03-02", taux: 10.9, source: "BAM" }], "EUR", "MAD", new Date("2026-03-03"));
    expect(r).toEqual({ taux: 10.9, date: new Date("2026-03-02"), source: "BAM" });
  });
  it("conversion croisée via la devise de référence", () => {
    expect(convertir(100, "EUR", "MAD", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(1080);
    expect(convertir(1080, "MAD", "EUR", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(100);
    expect(convertir(100, "EUR", "USD", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(115.508, 2);
    expect(convertir(1, "GBP", "MAD", cours, "MAD")).toBeNull();
  });
  it("arrondi explicite à la précision de la devise", () => {
    expect(arrondirMontant(1.005, 2)).toBe(1.01);
    expect(arrondirMontant(10_000_000.004, 2)).toBe(10_000_000);
    expect(arrondirMontant(1234.5, 0)).toBe(1235);
    expect(arrondirMontant(-2.345, 2)).toBe(-2.35);
    expect(arrondirMontant(0.1 + 0.2, 2)).toBe(0.3);
  });
  it("montants abrégés par langue", () => {
    expect(formatMontantCompact(12_500_000, "MAD", "fr")).toMatch(/12,5\sM MAD/);
    expect(formatMontantCompact(2_300_000_000, "MAD", "en")).toBe("2.3 bn MAD");
  });
});
