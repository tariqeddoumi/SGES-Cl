"use client";

import { createContext, useContext } from "react";
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
  decider: boolean;
  supprimer: boolean;
  transitions: Transition[];
}

export interface EtatDossier {
  dossier: DossierComplet;
  droits: Droits;
  etapes: Record<string, boolean>;
  motifsBlocage: string[];
  seuil: number;
}

export const ContexteDossier = createContext<(EtatDossier & { recharger: () => Promise<void> }) | null>(null);

export function useDossier() {
  const c = useContext(ContexteDossier);
  if (!c) throw new Error("useDossier hors du dossier");
  return c;
}
