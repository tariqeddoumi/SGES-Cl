/**
 * OCR intelligent : détection des pièces à transcrire et circuit de lecture (modèle simulé).
 */
const appels: unknown[] = [];
let sortieSimulee: unknown = { typeDetecte: "AUTORISATION", lisible: true, texte: "Autorisation de déversement n° 12/2025 — Agence du bassin hydraulique du Souss-Massa", remarque: null };

jest.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    beta = {
      messages: {
        stream: (corps: unknown) => {
          appels.push(corps);
          return { finalMessage: async () => ({ stop_reason: "end_turn", parsed_output: sortieSimulee, model: "modele-test" }) };
        },
      },
    };
  }
  return { __esModule: true, default: Anthropic };
});

import { lirePiece, lisibleParOCR, texteInsuffisant } from "@/lib/serveur/ocr";

const types = [
  { code: "AUTORISATION", libelle: "Autorisation / permis" },
  { code: "EIES", libelle: "Étude d'impact" },
];
const params = { IA_ACTIVE: "true", OCR_SCANS: "true", IA_MODELE: "claude-opus-5-5" };
// PNG d'un pixel : l'extraction classique ne donne aucun texte.
const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

describe("OCR intelligent", () => {
  beforeEach(() => {
    appels.length = 0;
  });

  it("reconnaît les pièces lisibles par l'OCR et les textes trop pauvres", () => {
    expect(lisibleParOCR("image/jpeg")).toBe(true);
    expect(lisibleParOCR("application/pdf")).toBe(true);
    expect(lisibleParOCR("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(false);
    expect(texteInsuffisant(null, "image/png", 50_000)).toBe(true);
    expect(texteInsuffisant("", "application/pdf", 900_000)).toBe(true);
    expect(texteInsuffisant("Page 1", "application/pdf", 300_000)).toBe(true);
    expect(texteInsuffisant("x".repeat(5000), "application/pdf", 300_000)).toBe(false);
    expect(texteInsuffisant(null, "text/plain", 10)).toBe(false);
  });

  it("transcrit une photo, reconnaît son type et envoie l'image au modèle", async () => {
    const r = await lirePiece(params, { mime: "image/png", octets: png, nom: "scan.png", types });
    expect(r.origine).toBe("ocr");
    expect(r.typeDetecte).toBe("AUTORISATION");
    expect(r.texte).toContain("Autorisation de déversement");
    const corps = appels[0] as { messages: { content: { type: string; source?: { media_type: string } }[] }[]; model: string };
    expect(corps.model).toBe("claude-opus-5-5");
    expect(corps.messages[0].content[0].type).toBe("image");
    expect(corps.messages[0].content[0].source?.media_type).toBe("image/png");
  });

  it("n'appelle pas le modèle quand l'OCR est inactif ou la transcription des scans désactivée", async () => {
    expect((await lirePiece(null, { mime: "image/png", octets: png, nom: "scan.png", types })).origine).toBeNull();
    expect((await lirePiece({ ...params, OCR_SCANS: "false" }, { mime: "image/png", octets: png, nom: "scan.png", types })).origine).toBeNull();
    expect(appels).toHaveLength(0);
  });

  it("ignore un type inconnu et ne bloque jamais le dépôt en cas d'erreur", async () => {
    sortieSimulee = { typeDetecte: "INVENTE", lisible: true, texte: "Texte", remarque: null };
    expect((await lirePiece(params, { mime: "image/png", octets: png, nom: "a.png", types })).typeDetecte).toBeNull();
    sortieSimulee = null;
    const r = await lirePiece(params, { mime: "image/png", octets: png, nom: "a.png", types });
    expect(r.origine).toBeNull();
    expect(r.erreurOCR).toBeTruthy();
  });
});
