/**
 * Critères déclencheurs de l'évaluation E&S (circulaire CFD-537/01-24, chapitre II ;
 * cahier des charges SGES, « Critères déclencheurs ») :
 *
 *  1. tout crédit d'investissement relatif à un projet de catégorie A, quels que soient
 *     la taille de l'entreprise, le montant et le secteur ;
 *  2. tout crédit d'investissement hors catégorie A dont le montant d'investissement
 *     dépasse le seuil (10 millions de dirhams par défaut, paramétrable par entité).
 *
 * Le montant comparé est le montant d'investissement converti en devise de référence ;
 * à défaut, le montant demandé (un dossier sans montant d'investissement ne doit pas
 * échapper au contrôle).
 */

export interface EntreeDeclenchement {
  categorie: string | null | undefined;
  /** Au moins un élément de l'annexe 1 (projets de catégorie A) est positif. */
  elementListeA?: boolean;
  montantInvestissementRef?: number | null;
  montantDemandeRef: number;
  /** Seuil en devise de référence. */
  seuil: number;
  /** Le type de crédit est un crédit d'investissement (sinon : hors périmètre). */
  creditInvestissement?: boolean;
}

export interface ResultatDeclenchement {
  obligatoire: boolean;
  motifs: ("categorie_a" | "seuil" | "hors_perimetre" | "volontaire")[];
  montantCompare: number;
}

export function evaluerDeclenchement(e: EntreeDeclenchement): ResultatDeclenchement {
  const montantCompare =
    e.montantInvestissementRef && e.montantInvestissementRef > 0
      ? e.montantInvestissementRef
      : e.montantDemandeRef;
  if (e.creditInvestissement === false) {
    return { obligatoire: false, motifs: ["hors_perimetre"], montantCompare };
  }
  const motifs: ResultatDeclenchement["motifs"] = [];
  if (e.categorie === "A" || e.elementListeA) motifs.push("categorie_a");
  if (montantCompare > e.seuil) motifs.push("seuil");
  if (motifs.length === 0) motifs.push("volontaire");
  return { obligatoire: motifs[0] !== "volontaire", motifs, montantCompare };
}
