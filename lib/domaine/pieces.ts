/**
 * Pièces attendues d'un dossier E&S, contrôle de complétude et canevas de recueil.
 *
 * Règles pures (sans accès base) : la liste des pièces dépend de la catégorie du projet ;
 * chaque pièce est décrite par les informations qu'elle doit contenir. L'analyse
 * documentaire (IA) renseigne, pour chaque pièce déposée, l'état de chaque information ;
 * ce module en déduit la check-list : complet / incomplet / manquant / canevas.
 * Lorsque le chargé ne dispose pas de la pièce, les mêmes informations servent de
 * canevas à remplir avec le client.
 */

export type EtatChamp = "present" | "partiel" | "absent";
export type TypeSaisie = "texte" | "nombre" | "date" | "oui_non";

export interface ChampPiece {
  /** Code unique : libellé = i18n « pieces.champs.<code> ». */
  code: string;
  obligatoire: boolean;
  saisie: TypeSaisie;
}

export interface DefPiece {
  /** Code du type de document (liste de valeurs « type_document »). */
  code: string;
  /** Pièce officielle (émise ou signée par un tiers) : un canevas ne la remplace pas. */
  officiel: boolean;
  champs: ChampPiece[];
}

const c = (code: string, obligatoire = true, saisie: TypeSaisie = "texte"): ChampPiece => ({ code, obligatoire, saisie });

export const PIECES: DefPiece[] = [
  {
    code: "PRESENTATION",
    officiel: false,
    champs: [
      c("pres_objet"), c("pres_description"), c("pres_procede"), c("pres_capacite"), c("pres_site"),
      c("pres_investissement", true, "nombre"), c("pres_calendrier"), c("pres_effectifs", false, "nombre"),
      c("pres_eau_energie", false), c("pres_dechets", false),
    ],
  },
  {
    code: "EIES",
    officiel: true,
    champs: [
      c("eies_resume"), c("eies_description"), c("eies_etat_initial"), c("eies_impacts"), c("eies_mesures"),
      c("eies_surveillance"), c("eies_consultation"), c("eies_auteur"), c("eies_alternatives", false),
    ],
  },
  {
    code: "PGES",
    officiel: false,
    champs: [c("pges_mesures"), c("pges_responsables"), c("pges_calendrier"), c("pges_budget", true, "nombre"), c("pges_indicateurs"), c("pges_urgence", false)],
  },
  {
    code: "ACCEPTABILITE",
    officiel: true,
    champs: [c("acc_reference"), c("acc_autorite"), c("acc_date", true, "date"), c("acc_conditions"), c("acc_validite", false, "date")],
  },
  {
    code: "AUTORISATION",
    officiel: true,
    champs: [c("aut_type"), c("aut_numero"), c("aut_autorite"), c("aut_date", true, "date"), c("aut_validite", false, "date")],
  },
  {
    code: "ENGAGEMENT",
    officiel: false,
    champs: [c("eng_signataire"), c("eng_engagements"), c("eng_date", true, "date"), c("eng_pges_reference", false)],
  },
  {
    code: "PLAN_ACTION",
    officiel: false,
    champs: [c("plan_actions"), c("plan_echeances"), c("plan_responsables"), c("plan_signature", true, "oui_non")],
  },
];

export const CODES_PIECES = PIECES.map((p) => p.code);
export function definition(code: string): DefPiece | undefined {
  return PIECES.find((p) => p.code === code);
}

export type Niveau = "obligatoire" | "recommandee";
export interface PieceAttendue {
  code: string;
  niveau: Niveau;
}

/**
 * Pièces attendues selon la catégorie (procédure CFD12340876/0217 : EIES / PGES en catégorie A,
 * plan d'actions et engagement de conformité pour tous les dossiers évalués).
 * La catégorie A exige l'EIES, le PGES, la décision d'acceptabilité et les autorisations ;
 * en B, ces pièces sont recommandées « si exigibles » (loi 49-17, régime d'autorisation du secteur).
 */
export function piecesAttendues(categorie: string | null, eieRequise = false): PieceAttendue[] {
  const a = categorie === "A" || eieRequise;
  const b = categorie === "B";
  const n = (x: boolean): Niveau => (x ? "obligatoire" : "recommandee");
  const liste: PieceAttendue[] = [{ code: "PRESENTATION", niveau: "recommandee" }];
  if (a || b) {
    liste.push({ code: "EIES", niveau: n(a) });
    liste.push({ code: "PGES", niveau: n(a) });
    liste.push({ code: "ACCEPTABILITE", niveau: n(a) });
    liste.push({ code: "AUTORISATION", niveau: n(a) });
  } else if (categorie === "C" || categorie === "FI") {
    liste.push({ code: "AUTORISATION", niveau: "recommandee" });
  } else {
    // Catégorie non encore déterminée : on n'affiche que le socle commun.
  }
  liste.push({ code: "PLAN_ACTION", niveau: "recommandee" });
  liste.push({ code: "ENGAGEMENT", niveau: "recommandee" });
  return liste;
}

// ───────────────────────── Analyse d'une pièce ─────────────────────────

export interface ConstatChamp {
  code: string;
  etat: EtatChamp;
  /** Ce qui manque ou reste imprécis dans le document. */
  precision: string | null;
  citation: string | null;
}

/** Résultat de l'analyse stockée sur la pièce (colonne `analyse`, JSON). */
export interface AnalysePiece {
  typeDetecte: string | null;
  resume: string;
  champs: ConstatChamp[];
  /** Renseigné pour un canevas : pièce visée et réponses saisies avec le client. */
  canevas?: { piece: string; reponses: Record<string, string> };
  analyseLe?: string;
  modele?: string;
}

export function lireAnalyse(texte: string | null | undefined): AnalysePiece | null {
  if (!texte) return null;
  try {
    const o = JSON.parse(texte) as AnalysePiece;
    return o && typeof o === "object" && Array.isArray(o.champs) ? o : null;
  } catch {
    return null;
  }
}

export interface PieceDeposee {
  id: string;
  type: string;
  nom: string;
  /** Texte exploitable (extrait du fichier) : sinon la pièce ne peut pas être analysée. */
  texteDisponible: boolean;
  analyse: AnalysePiece | null;
}

// ───────────────────────── Check-list ─────────────────────────

export type StatutPiece = "complet" | "incomplet" | "manquant" | "non_analyse" | "canevas";

export interface ChampManquant {
  code: string;
  etat: EtatChamp;
  precision: string | null;
}

export interface LignePiece {
  code: string;
  niveau: Niveau;
  officiel: boolean;
  statut: StatutPiece;
  documents: { id: string; nom: string; analysee: boolean; texteDisponible: boolean }[];
  canevas: { id: string; reponses: Record<string, string> } | null;
  champsManquants: ChampManquant[];
}

export interface Incoherence {
  documentId: string;
  nom: string;
  declare: string;
  detecte: string;
}

export interface Checklist {
  lignes: LignePiece[];
  incoherences: Incoherence[];
  resume: Record<StatutPiece, number>;
  /** Pièces obligatoires à compléter (manquantes, incomplètes ou remplacées par un canevas seulement). */
  aCompleter: number;
}

const RANG: Record<EtatChamp, number> = { absent: 0, partiel: 1, present: 2 };

function fusionner(sources: AnalysePiece[]): Map<string, ConstatChamp> {
  const m = new Map<string, ConstatChamp>();
  for (const a of sources) {
    for (const ch of a.champs) {
      const prec = m.get(ch.code);
      if (!prec || RANG[ch.etat] > RANG[prec.etat]) m.set(ch.code, ch);
    }
  }
  return m;
}

export function construireChecklist(attendues: PieceAttendue[], deposees: PieceDeposee[]): Checklist {
  const canevas = deposees.filter((d) => d.analyse?.canevas);
  const reelles = deposees.filter((d) => !d.analyse?.canevas && d.type !== "CANEVAS");
  const incoherences: Incoherence[] = [];
  for (const d of reelles) {
    const det = d.analyse?.typeDetecte;
    if (det && det !== d.type && CODES_PIECES.includes(det) && (d.type === "AUTRE" || CODES_PIECES.includes(d.type))) {
      incoherences.push({ documentId: d.id, nom: d.nom, declare: d.type, detecte: det });
    }
  }

  const lignes: LignePiece[] = attendues.map((att) => {
    const def = definition(att.code)!;
    // Une pièce « Autre » que l'analyse reconnaît comme cette pièce compte pour elle.
    const docs = reelles.filter((d) => d.type === att.code || (d.type === "AUTRE" && d.analyse?.typeDetecte === att.code));
    const canvas = canevas.find((d) => d.analyse?.canevas?.piece === att.code) ?? null;
    const analyses = docs.map((d) => d.analyse).filter((a): a is AnalysePiece => !!a);
    const sources = [...analyses, ...(canvas?.analyse ? [canvas.analyse] : [])];
    const fusion = fusionner(sources);
    const manquants: ChampManquant[] = def.champs
      .filter((ch) => ch.obligatoire)
      .map((ch) => ({ code: ch.code, etat: fusion.get(ch.code)?.etat ?? ("absent" as EtatChamp), precision: fusion.get(ch.code)?.precision ?? null }))
      .filter((m) => m.etat !== "present");

    let statut: StatutPiece;
    if (docs.length === 0) statut = canvas ? (manquants.length ? "incomplet" : "canevas") : "manquant";
    else if (analyses.length === 0) statut = canvas && !manquants.length ? "canevas" : "non_analyse";
    else statut = manquants.length ? "incomplet" : "complet";
    // Une pièce officielle reconstituée par canevas seul reste à régulariser (statut « canevas »).
    return {
      code: att.code,
      niveau: att.niveau,
      officiel: def.officiel,
      statut,
      documents: docs.map((d) => ({ id: d.id, nom: d.nom, analysee: !!d.analyse, texteDisponible: d.texteDisponible })),
      canevas: canvas ? { id: canvas.id, reponses: canvas.analyse!.canevas!.reponses } : null,
      champsManquants: statut === "complet" || statut === "canevas" ? [] : manquants,
    };
  });

  const resume = { complet: 0, incomplet: 0, manquant: 0, non_analyse: 0, canevas: 0 } as Record<StatutPiece, number>;
  for (const l of lignes) resume[l.statut]++;
  const aCompleter = lignes.filter((l) => l.niveau === "obligatoire" && (l.statut === "manquant" || l.statut === "incomplet" || (l.statut === "canevas" && l.officiel))).length;
  return { lignes, incoherences, resume, aCompleter };
}

// ───────────────────────── Canevas ─────────────────────────

/** Réponses utiles : on ignore les champs inconnus de la pièce et les valeurs vides. */
export function nettoyerReponses(piece: string, reponses: Record<string, string>): Record<string, string> {
  const def = definition(piece);
  if (!def) return {};
  const codes = new Set(def.champs.map((x) => x.code));
  return Object.fromEntries(Object.entries(reponses).map(([k, v]) => [k, String(v ?? "").trim().slice(0, 4000)]).filter(([k, v]) => codes.has(k as string) && v));
}

/** Analyse déduite d'un canevas : un champ renseigné est « présent ». */
export function analyseDepuisCanevas(piece: string, reponses: Record<string, string>): AnalysePiece {
  const def = definition(piece);
  const rep = nettoyerReponses(piece, reponses);
  return {
    typeDetecte: piece,
    resume: "",
    champs: (def?.champs ?? []).map((ch) => ({ code: ch.code, etat: rep[ch.code] ? "present" : "absent", precision: null, citation: null })),
    canevas: { piece, reponses: rep },
    analyseLe: new Date().toISOString(),
  };
}

/** Texte du canevas rempli (stocké comme pièce et relu par l'assistant). */
export function rendreCanevas(titre: string, entete: string[], champs: { libelle: string; valeur: string }[]): string {
  return [titre, "=".repeat(Math.min(titre.length, 70)), ...entete, "", ...champs.map((x) => `${x.libelle}\n  ${x.valeur || "—"}`)].join("\n");
}
