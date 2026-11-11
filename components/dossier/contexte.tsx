"use client";

import { createContext, useContext } from "react";
import type { PropositionsDossier } from "@/lib/domaine/sources";
import type { Transition } from "@/lib/domaine/workflow";

export interface DossierComplet {
  id: string;
  reference: string;
  statut: string;
  etape: number;
  verrouille: boolean;
  entiteId: string;
  clientId: string;
  chargeId: string | null;
  dateDossier: string;
  typeCredit: string | null;
  natureProjet: string | null;
  objet: string | null;
  descriptionProcessus: string | null;
  projetDeveloppementDurable: boolean;
  ligneFinancement: string | null;
  secteurId: string | null;
  deviseCode: string;
  montantDemande: number;
  montantInvestissement: number | null;
  tauxReference: number;
  montantDemandeRef: number;
  montantInvestissementRef: number | null;
  dureeMois: number | null;
  adresseSite: string | null;
  localite: string | null;
  regionId: string | null;
  typeZone: string | null;
  latitude: number | null;
  longitude: number | null;
  evaluationObligatoire: boolean;
  motifDeclenchement: string | null;
  exclusionVerifiee: boolean;
  exclu: boolean;
  scoreESG: number | null;
  noteESG: string | null;
  scoreESGOctroi: number | null;
  propositionsOCR: string | null;
  noteESGOctroi: string | null;
  detailESG: string | null;
  motifExclusion: string | null;
  categorieCalculee: string | null;
  categorie: string | null;
  sousCategorieFI: string | null;
  justificationCategorie: string | null;
  eieRequise: boolean;
  evaluationTerminee: boolean;
  scoreRisque: number | null;
  niveauRisque: string | null;
  nbRisquesNonMaitrises: number;
  commentaireEvaluation: string | null;
  planActionPropose: boolean;
  soumisLe: string | null;
  valideurId: string | null;
  valideLe: string | null;
  commentaireValidation: string | null;
  comite: string | null;
  dateComite: string | null;
  decision: string | null;
  montantAccorde: number | null;
  encours: number | null;
  dateEncours: string | null;
  motifRejetCode: string | null;
  motifRejetES: string | null;
  reservesComite: string | null;
  commentaireComite: string | null;
  dossierPrecedentId: string | null;
  updatedAt: string;
  entite: { id: string; code: string; nom: string };
  client: { id: string; raisonSociale: string; compteCourant: string | null; formeJuridique: string | null; comptePortefeuille: string | null; contactNom: string | null; contactPoste: string | null; contactTelephone: string | null; contactEmail: string | null; secteur: { code: string; libelle: string } | null };
  charge: { id: string; nom: string; prenom: string; matricule: string | null; email: string } | null;
  valideur: { id: string; nom: string; prenom: string } | null;
  secteur: { id: string; code: string; libelle: string; categorieIndicative: string | null; risqueTransition: number; facteurEmission: number; exposeCBAM: boolean } | null;
  region: { id: string; code: string; libelle: string } | null;
  climat: { scoreClimat: number | null; niveauClimat: string | null; scorePhysique: number | null; scoreTransition: number | null; emissionsFinancees: number | null } | null;
  precedent: { id: string; reference: string } | null;
}

export interface Droits {
  ecriture: boolean;
  evaluation: boolean;
  plan: boolean;
  visites: boolean;
  pieces: boolean;
  reclasser: boolean;
  deroger: boolean;
  decider: boolean;
  supprimer: boolean;
  transitions: Transition[];
}

export interface PieceDossier {
  id: string;
  type: string;
  nom: string;
  mime: string;
  /** extraction | ocr ; null : pièce non lue (scan sans OCR). */
  origineTexte: string | null;
  createdAt: string;
}

export interface EtatDossier {
  dossier: DossierComplet;
  pieces: PieceDossier[];
  droits: Droits;
  etapes: Record<string, boolean>;
  motifsBlocage: string[];
  seuil: number;
}

/** Propositions de l'assistant IA acceptées par le chargé : chaque volet les reprend dans sa saisie (rien n'est enregistré avant « Enregistrer »). */
export interface Prefill {
  identification?: { champ: string; valeur: string }[];
  exclusion?: { critereId: string; valeur: string }[];
  categorisation?: { questionId: string; valeur: string }[];
  evaluation?: { questionId: string; valeur: string; justification: string }[];
  /** Commentaire d'évaluation rédigé par l'assistant (repris dans la zone de texte, non enregistré). */
  commentaire?: string;
}

/** Documents et OCR intelligent : dépôt en un geste, lecture, propositions conservées sur le dossier. */
export interface Documents {
  /** OCR intelligent utilisable (activé et autorisé dans le paramétrage). */
  ocrActif: boolean;
  propositions: PropositionsDossier | null;
  /** Pièces déposées depuis la dernière lecture. */
  aLire: PieceDossier[];
  /** Types de pièces déposées et lisibles. */
  typesLus: Set<string>;
  /** Ouvre le choix de fichiers ; le type est celui de la pièce attendue (sinon reconnu à la lecture). */
  deposer: (type?: string) => void;
  /** Lit les pièces et met à jour les propositions. */
  lire: () => Promise<void>;
  /** Écarte des propositions refusées (toute la section si aucune clé). */
  ecarter: (section: "identification" | "exclusion" | "categorisation" | "evaluation" | "climat", cles?: string[]) => Promise<void>;
  enCours: "depot" | "lecture" | null;
  /** Incrémenté à chaque dépôt : les listes de pièces se rechargent. */
  version: number;
}

export type ValeurContexte = EtatDossier & {
  documents: Documents;
  recharger: () => Promise<void>;
  prefill: Prefill;
  setPrefill: (p: Prefill) => void;
  consommer: (section: keyof Prefill) => void;
};

export const ContexteDossier = createContext<ValeurContexte | null>(null);

export function useDossier() {
  const c = useContext(ContexteDossier);
  if (!c) throw new Error("useDossier hors du dossier");
  return c;
}
