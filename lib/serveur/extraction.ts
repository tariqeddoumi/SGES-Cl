import JSZip from "jszip";

const MAX = 400_000;

const entites = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");

/** Texte brut d'un document Word (word/document.xml) : paragraphes, tabulations, tableaux. */
export async function texteDocx(octets: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(octets);
  const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
  return entites(
    xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<\/w:tc>/g, "\t")
      .replace(/<\/w:p>|<w:br\/>/g, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Textes d'un classeur Excel (chaînes partagées + cellules texte en ligne). */
export async function texteXlsx(octets: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(octets);
  const partage = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const lignes = [...partage.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => entites([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
  return lignes.join("\n");
}

/** Texte d'une pièce déposée (pour l'analyse documentaire) ; un échec n'empêche pas le dépôt. */
export async function extraireTexte(mime: string, octets: Uint8Array): Promise<string | null> {
  try {
    if (mime === "text/plain") return new TextDecoder().decode(octets).slice(0, MAX);
    if (mime === "application/pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(octets);
      const { text } = await extractText(pdf, { mergePages: true });
      return (Array.isArray(text) ? text.join("\n") : text).slice(0, MAX) || null;
    }
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return (await texteDocx(octets)).slice(0, MAX) || null;
    if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return (await texteXlsx(octets)).slice(0, MAX) || null;
    return null;
  } catch {
    return null;
  }
}
