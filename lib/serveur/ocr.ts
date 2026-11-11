import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { TYPES_SOURCES } from "../domaine/sources";
import { booleen, type Parametres } from "../parametres";
import { ErreurMetier } from "./contexte";
import { extraireTexte } from "./extraction";

/**
 * OCR intelligent : transcription des pièces que l'extraction classique ne sait pas lire (PDF
 * scannés, photos de documents) et reconnaissance du type de pièce. Le modèle lit le fichier
 * d'origine (image ou PDF) : aucun masquage n'est possible avant l'envoi, d'où le paramètre
 * OCR_SCANS, distinct de l'activation générale.
 */

const MAX_TEXTE = 400_000;
/** En dessous de ce nombre de caractères par page, un PDF est considéré comme scanné. */
const CARACTERES_PAR_PAGE = 120;

const IMAGES = new Set(["image/png", "image/jpeg", "image/webp"]);
type MediaImage = "image/png" | "image/jpeg" | "image/webp";

export function lisibleParOCR(mime: string): boolean {
  return IMAGES.has(mime) || mime === "application/pdf";
}

/** Le texte extrait est-il trop pauvre (scan, photo) pour être exploité ? */
export function texteInsuffisant(texte: string | null, mime: string, octets: number): boolean {
  const n = (texte ?? "").replace(/\s+/g, " ").trim().length;
  if (IMAGES.has(mime)) return true;
  if (mime !== "application/pdf") return false;
  // Estimation grossière du nombre de pages d'un scan : ~150 Ko par page.
  const pages = Math.max(1, Math.round(octets / 150_000));
  return n < CARACTERES_PAR_PAGE * pages;
}

const Transcription = z.object({
  typeDetecte: z.string().nullable(),
  lisible: z.boolean(),
  texte: z.string(),
  remarque: z.string().nullable(),
});

const SYSTEME =
  "Tu es le module d'OCR d'un outil bancaire d'évaluation environnementale et sociale (Maroc). " +
  "On te remet une pièce d'un dossier de crédit : scan, photo ou PDF image. " +
  "1. Transcris fidèlement tout le texte lisible, dans l'ordre de lecture, dans sa langue d'origine (français, arabe, anglais) : " +
  "titres, paragraphes, tableaux (une ligne par rangée, cellules séparées par « | »), tampons, dates, références, montants, signatures (« [signature] »). " +
  "N'invente ni ne corrige rien ; marque « [illisible] » ce que tu ne peux pas lire. " +
  "2. Reconnais le type de la pièce parmi les codes fournis (null si aucun ne convient). " +
  "3. lisible = false si la pièce est inexploitable (floue, coupée, vide) ; remarque : ce qui gêne la lecture, sinon null.";

/** Transcrit une pièce scannée ou photographiée ; renvoie le texte et le type reconnu. */
export async function transcrire(p: Parametres, o: { mime: string; octets: Uint8Array; nom: string; types: { code: string; libelle: string }[] }) {
  if (!booleen(p, "OCR_SCANS")) throw new ErreurMetier("La transcription des scans et photos est désactivée (Paramétrage).", 403, "ocr_scans_inactif");
  const data = Buffer.from(o.octets).toString("base64");
  const piece: Anthropic.Beta.BetaContentBlockParam = IMAGES.has(o.mime)
    ? { type: "image", source: { type: "base64", media_type: o.mime as MediaImage, data } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  const client = new Anthropic();
  // Une transcription peut être longue : flux, puis message final validé contre le schéma.
  const flux = client.beta.messages.stream({
    model: p.IA_MODELE || "claude-opus-5-5",
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Transcription) },
    system: SYSTEME,
    messages: [
      {
        role: "user",
        content: [
          piece,
          { type: "text", text: `<types_pieces>\n${o.types.map((t) => `${t.code} : ${t.libelle}`).join("\n")}\n</types_pieces>\nNom du fichier : ${o.nom}` },
        ],
      },
    ],
  });
  const reponse = await flux.finalMessage();
  if (reponse.stop_reason === "refusal") throw new ErreurMetier("La transcription a été refusée par le modèle.", 422, "ia_refus");
  const sortie = reponse.parsed_output;
  if (!sortie) throw new ErreurMetier("Transcription illisible.", 502, "ia_format");
  const codes = new Set(o.types.map((t) => t.code));
  return {
    texte: sortie.texte.slice(0, MAX_TEXTE),
    typeDetecte: sortie.typeDetecte && codes.has(sortie.typeDetecte) ? sortie.typeDetecte : null,
    lisible: sortie.lisible,
    remarque: sortie.remarque,
    modele: reponse.model,
    tronque: reponse.stop_reason === "max_tokens",
  };
}

/** Types de pièces proposés à la reconnaissance (ceux de la carte des sources et les autres usuels). */
export const TYPES_RECONNUS = [...TYPES_SOURCES, "PHOTO"] as const;

/**
 * Texte d'une pièce : extraction classique, puis OCR intelligent si le texte est trop pauvre et que
 * l'OCR est activé. Un échec de l'OCR n'empêche jamais le dépôt (la pièce reste « non lue »).
 */
export async function lirePiece(
  p: Parametres | null,
  o: { mime: string; octets: Uint8Array; nom: string; types: { code: string; libelle: string }[] }
): Promise<{ texte: string | null; origine: "extraction" | "ocr" | null; typeDetecte: string | null; erreurOCR: string | null; remarque: string | null; tronque?: boolean }> {
  const extrait = await extraireTexte(o.mime, o.octets);
  const base = { texte: extrait, origine: extrait ? ("extraction" as const) : null, typeDetecte: null, erreurOCR: null, remarque: null };
  if (!p || !lisibleParOCR(o.mime) || !texteInsuffisant(extrait, o.mime, o.octets.byteLength) || !booleen(p, "OCR_SCANS")) return base;
  try {
    const r = await transcrire(p, o);
    if (!r.texte.trim()) return { ...base, remarque: r.remarque };
    return { texte: r.texte, origine: "ocr", typeDetecte: r.typeDetecte, erreurOCR: null, remarque: r.remarque, tronque: r.tronque };
  } catch (e) {
    return { ...base, erreurOCR: e instanceof Error ? e.message : String(e) };
  }
}
