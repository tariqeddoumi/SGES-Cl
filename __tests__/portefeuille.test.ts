import { filtreActionsEnRetard, filtreActionsPortefeuille } from "@/lib/serveur/portefeuille";
import type { Perimetre } from "@/lib/serveur/perimetre";

// PrismaClient n'est pas sollicité : on vérifie seulement la forme des filtres.
jest.mock("@/lib/serveur/prisma", () => ({ prisma: {} }));

const perimetre = { lecture: ["ca"], ecriture: ["ca"], global: false } as unknown as Perimetre;

describe("filtres d'actions du portefeuille", () => {
  const maintenant = new Date("2026-10-21T00:00:00Z");
  const retard = filtreActionsEnRetard(perimetre, maintenant);

  test("« en retard » : retenue, ni réalisée ni abandonnée, échéance dépassée", () => {
    expect(retard.retenue).toBe(true);
    expect(retard.statut).toEqual({ in: ["a_faire", "en_cours"] });
    expect(retard.dateEcheance).toEqual({ lt: maintenant });
  });

  test("« en retard » ne porte que sur les dossiers dont le suivi est en cours", () => {
    expect((retard.dossier as { statut: unknown }).statut).toEqual({ in: ["decide", "en_suivi"] });
  });

  test("les actions en retard sont un sous-ensemble du portefeuille affiché", () => {
    const base = filtreActionsPortefeuille(perimetre);
    const statutsBase = ((base.dossier as { statut: { in: string[] } }).statut).in;
    const statutsRetard = ((retard.dossier as { statut: { in: string[] } }).statut).in;
    expect(statutsRetard.every((s) => statutsBase.includes(s))).toBe(true);
    expect(base.retenue).toBe(true);
  });
});
