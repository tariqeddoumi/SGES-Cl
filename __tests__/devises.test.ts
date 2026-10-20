import { convertir, coursA, formatMontantCompact } from "@/lib/devises";

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
  it("avant le premier cours, le plus ancien sert de repli", () => {
    expect(coursA(cours, "EUR", "MAD", new Date("2020-01-01"))).toBe(10.8);
  });
  it("conversion croisée via la devise de référence", () => {
    expect(convertir(100, "EUR", "MAD", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(1080);
    expect(convertir(1080, "MAD", "EUR", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(100);
    expect(convertir(100, "EUR", "USD", cours, "MAD", new Date("2026-02-01"))).toBeCloseTo(115.508, 2);
    expect(convertir(1, "GBP", "MAD", cours, "MAD")).toBeNull();
  });
  it("montants abrégés par langue", () => {
    expect(formatMontantCompact(12_500_000, "MAD", "fr")).toMatch(/12,5\sM MAD/);
    expect(formatMontantCompact(2_300_000_000, "MAD", "en")).toBe("2.3 bn MAD");
  });
});
