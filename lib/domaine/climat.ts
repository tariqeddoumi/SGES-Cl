import { ALEAS, FACTEURS_TRANSITION, type Alea, type AlignementTaxonomie, type FacteurTransition } from "./constantes";
import { arrondir, borner } from "../utils";

/**
 * Volet climat du dossier.
 *
 * Cadres de référence : Directive Bank Al-Maghrib n° 5/W/2021 (risques financiers liés
 * au changement climatique et à l'environnement), recommandations TCFD / norme ISSB S2,
 * Principes de l'Équateur IV (analyse des risques climatiques physiques et de transition),
 * standard PCAF (émissions financées).
 *
 * Toutes les échelles d'entrée vont de 0 (nul) à 4 (très élevé) ; les scores sortent sur 100.
 */

export type Aleas = Record<Alea, number>;
export type FacteursTransition = Record<FacteurTransition, number>;

export const ALEAS_NULS: Aleas = Object.fromEntries(ALEAS.map((a) => [a, 0])) as Aleas;
export const TRANSITION_NULLE: FacteursTransition = Object.fromEntries(
  FACTEURS_TRANSITION.map((f) => [f, 0])
) as FacteursTransition;

export function normaliserAleas(v: Partial<Record<string, unknown>> | null | undefined): Aleas {
  const r = { ...ALEAS_NULS };
  for (const a of ALEAS) r[a] = borner(Math.round(Number(v?.[a] ?? 0)) || 0, 0, 4);
  return r;
}

export function normaliserTransition(v: Partial<Record<string, unknown>> | null | undefined): FacteursTransition {
  const r = { ...TRANSITION_NULLE };
  for (const f of FACTEURS_TRANSITION) r[f] = borner(Math.round(Number(v?.[f] ?? 0)) || 0, 0, 4);
  return r;
}

/**
 * Risque physique : exposition (aléa maximal et moyenne des trois principaux), modulée
 * par la sensibilité de l'activité et réduite par la capacité d'adaptation.
 */
export function scorePhysique(aleas: Aleas, sensibilite: number, capaciteAdaptation: number): number {
  const valeurs = Object.values(aleas).sort((a, b) => b - a);
  const max = valeurs[0] ?? 0;
  const top3 = valeurs.slice(0, 3);
  const moyenne = top3.length ? top3.reduce((s, v) => s + v, 0) / top3.length : 0;
  const exposition = 0.6 * max + 0.4 * moyenne; // 0 à 4
  const vulnerabilite = exposition * (0.5 + borner(sensibilite, 0, 4) / 8); // ×0,5 à ×1
  const attenuation = 1 - 0.1 * borner(capaciteAdaptation, 0, 4); // jusqu'à −40 %
  return arrondir(borner((vulnerabilite * attenuation * 100) / 4, 0, 100));
}

/**
 * Risque de transition : sensibilité du secteur et facteurs propres au projet ; le
 * Mécanisme d'ajustement carbone aux frontières (CBAM, UE) majore l'exposition des
 * exportateurs, l'alignement taxonomique la réduit.
 */
export function scoreTransition(entree: {
  risqueSecteur: number;
  facteurs: FacteursTransition;
  expositionCBAM: boolean;
  partExportUE?: number | null;
  alignement: AlignementTaxonomie | string;
}): number {
  const f = Object.values(entree.facteurs);
  const moyenne = f.length ? f.reduce((s, v) => s + v, 0) / f.length : 0;
  let base = 0.5 * borner(entree.risqueSecteur, 0, 4) + 0.5 * moyenne;
  if (entree.expositionCBAM) base += (entree.partExportUE ?? 0) >= 10 ? 1 : 0.5;
  const reduction = entree.alignement === "vert" ? 0.5 : entree.alignement === "transition" ? 0.75 : 1;
  return arrondir(borner((base * reduction * 100) / 4, 0, 100));
}

/** Score climat global : le risque dominant pèse 60 %, l'autre 40 %. */
export function scoreClimat(physique: number, transition: number): number {
  const haut = Math.max(physique, transition);
  const bas = Math.min(physique, transition);
  return arrondir(0.6 * haut + 0.4 * bas);
}

export type NiveauClimat = "faible" | "modere" | "eleve" | "tres_eleve";

export function niveauClimat(score: number): NiveauClimat {
  if (score >= 75) return "tres_eleve";
  if (score >= 50) return "eleve";
  if (score >= 25) return "modere";
  return "faible";
}

/**
 * Émissions de gaz à effet de serre du projet (tCO2e/an) et part financée (PCAF,
 * financement de projet : facteur d'attribution = encours / financement total du projet).
 */
export function emissions(entree: {
  methode: string;
  scope1?: number | null;
  scope2?: number | null;
  scope3?: number | null;
  facteurSecteur: number;
  montantInvestissementRef?: number | null;
  montantFinanceRef: number;
}): { totales: number; financees: number; attribution: number } {
  const investissement =
    entree.montantInvestissementRef && entree.montantInvestissementRef > 0
      ? entree.montantInvestissementRef
      : entree.montantFinanceRef;
  const totales =
    entree.methode === "estimee_secteur"
      ? (entree.facteurSecteur * investissement) / 1_000_000
      : (entree.scope1 ?? 0) + (entree.scope2 ?? 0) + (entree.scope3 ?? 0);
  const attribution = investissement > 0 ? borner(entree.montantFinanceRef / investissement, 0, 1) : 1;
  return { totales: arrondir(totales, 1), financees: arrondir(totales * attribution, 1), attribution: arrondir(attribution, 3) };
}

/** Score de qualité des données PCAF selon la méthode (1 = mesuré et vérifié ; 5 = estimation sectorielle). */
export function qualitePCAF(methode: string, verifiee = false): number {
  if (methode === "declaree") return verifiee ? 1 : 2;
  if (methode === "estimee_activite") return 3;
  return 5;
}
