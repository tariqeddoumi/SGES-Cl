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
 * Échelles d'entrée de 0 (nul) à 4 (très élevé), scores sur 100. Une donnée INCONNUE (null) n'est
 * jamais assimilée à « aucun risque » : elle est exclue du calcul et réduit la couverture ; « na »
 * (non applicable) est une absence de risque établie. En dessous de la couverture minimale, aucun
 * score global n'est produit (niveau « données insuffisantes »).
 *
 * MÉTHODE INDICATIVE, NON CALIBRÉE : pondérations et majorations sont des hypothèses d'expert,
 * paramétrables, à valider (cas réels, champion/challenger, scénarios NGFS) — voir
 * docs/methodologie-climat.md. La version de la méthode est enregistrée avec chaque évaluation.
 */
export const METHODE_CLIMAT_VERSION = "SGES-CLIMAT-1.1 (indicative, non calibrée)";

/** Valeur d'échelle : 0 à 4, null = inconnue (non renseignée), "na" = non applicable. */
export type ValeurEchelle = number | null | "na";
export type Aleas = Record<Alea, ValeurEchelle>;
export type FacteursTransition = Record<FacteurTransition, ValeurEchelle>;

export function lireValeur(x: unknown): ValeurEchelle {
  if (x === "na") return "na";
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? borner(Math.round(n), 0, 4) : null;
}

export function normaliserAleas(v: Partial<Record<string, unknown>> | null | undefined): Aleas {
  return Object.fromEntries(ALEAS.map((a) => [a, lireValeur(v?.[a])])) as Aleas;
}

export function normaliserTransition(v: Partial<Record<string, unknown>> | null | undefined): FacteursTransition {
  return Object.fromEntries(FACTEURS_TRANSITION.map((f) => [f, lireValeur(v?.[f])])) as FacteursTransition;
}

const nombres = (r: Record<string, ValeurEchelle>) => Object.values(r).filter((v): v is number => typeof v === "number");
const renseignees = (r: Record<string, ValeurEchelle>) => Object.values(r).filter((v) => v !== null).length;

/** Part des données climat renseignées (valeur ou « non applicable »), de 0 à 1. */
export function couverture(aleas: Aleas, transition: FacteursTransition): number {
  const total = ALEAS.length + FACTEURS_TRANSITION.length;
  return arrondir((renseignees(aleas) + renseignees(transition)) / total, 2);
}

/**
 * Risque physique : exposition (aléa maximal et moyenne des trois principaux aléas connus), modulée
 * par la sensibilité de l'activité et réduite par la capacité d'adaptation. Null si aucun aléa n'est
 * renseigné ; 0 si tous sont « non applicables ».
 */
export function scorePhysique(aleas: Aleas, sensibilite: number, capaciteAdaptation: number): number | null {
  if (renseignees(aleas) === 0) return null;
  const valeurs = nombres(aleas).sort((a, b) => b - a);
  const max = valeurs[0] ?? 0;
  const top3 = valeurs.slice(0, 3);
  const moyenne = top3.length ? top3.reduce((s, v) => s + v, 0) / top3.length : 0;
  const exposition = 0.6 * max + 0.4 * moyenne; // 0 à 4
  const vulnerabilite = exposition * (0.5 + borner(sensibilite, 0, 4) / 8); // ×0,5 à ×1
  const attenuation = 1 - 0.1 * borner(capaciteAdaptation, 0, 4); // jusqu'à −40 %
  return arrondir(borner((vulnerabilite * attenuation * 100) / 4, 0, 100));
}

/**
 * Risque de transition : sensibilité du secteur et facteurs propres au projet (connus) ; le CBAM
 * majore l'exposition des exportateurs, l'alignement taxonomique la réduit. Null si aucun facteur
 * n'est renseigné.
 */
export function scoreTransition(entree: {
  risqueSecteur: number;
  facteurs: FacteursTransition;
  expositionCBAM: boolean;
  partExportUE?: number | null;
  alignement: AlignementTaxonomie | string;
}): number | null {
  if (renseignees(entree.facteurs) === 0) return null;
  const f = nombres(entree.facteurs);
  const moyenne = f.length ? f.reduce((s, v) => s + v, 0) / f.length : 0;
  let base = 0.5 * borner(entree.risqueSecteur, 0, 4) + 0.5 * moyenne;
  if (entree.expositionCBAM) base += (entree.partExportUE ?? 0) >= 10 ? 1 : 0.5;
  const reduction = entree.alignement === "vert" ? 0.5 : entree.alignement === "transition" ? 0.75 : 1;
  return arrondir(borner((base * reduction * 100) / 4, 0, 100));
}

/** Pondération du risque dominant / de l'autre (paramètre CLIMAT_PONDERATION, « 0.6,0.4 » par défaut). */
export function lirePonderation(v: string | null | undefined): [number, number] {
  const [a, b] = (v ?? "").split(",").map((x) => Number(x.trim()));
  return Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= 0 && a + b > 0 ? [a / (a + b), b / (a + b)] : [0.6, 0.4];
}

/** Score climat global : le risque dominant pèse 60 %, l'autre 40 % (pondération paramétrable). */
export function scoreClimat(physique: number, transition: number, ponderation: [number, number] = [0.6, 0.4]): number {
  const haut = Math.max(physique, transition);
  const bas = Math.min(physique, transition);
  return arrondir(ponderation[0] * haut + ponderation[1] * bas);
}

export type NiveauClimat = "faible" | "modere" | "eleve" | "tres_eleve";

export function lireSeuilsClimat(v: string | null | undefined): [number, number, number] {
  const s = (v ?? "").split(",").map((x) => Number(x.trim()));
  return s.length === 3 && s.every(Number.isFinite) && s[0] < s[1] && s[1] < s[2] ? (s as [number, number, number]) : [25, 50, 75];
}

export function niveauClimat(score: number, seuils: [number, number, number] = [25, 50, 75]): NiveauClimat {
  if (score >= seuils[2]) return "tres_eleve";
  if (score >= seuils[1]) return "eleve";
  if (score >= seuils[0]) return "modere";
  return "faible";
}

export interface ResultatClimat {
  physique: number | null;
  transition: number | null;
  score: number | null;
  /** « insuffisant » : couverture des données sous le minimum, aucun score global n'est produit. */
  niveau: NiveauClimat | "insuffisant";
  couverture: number;
}

/** Évaluation complète, avec contrôle de couverture (paramètre CLIMAT_COUVERTURE_MIN, 0,75 par défaut). */
export function evaluerClimat(
  e: { aleas: Aleas; transition: FacteursTransition; sensibilite: number; capaciteAdaptation: number; risqueSecteur: number; expositionCBAM: boolean; partExportUE?: number | null; alignement: string },
  o: { couvertureMin?: number; ponderation?: [number, number]; seuils?: [number, number, number] } = {}
): ResultatClimat {
  const physique = scorePhysique(e.aleas, e.sensibilite, e.capaciteAdaptation);
  const transition = scoreTransition({ risqueSecteur: e.risqueSecteur, facteurs: e.transition, expositionCBAM: e.expositionCBAM, partExportUE: e.partExportUE, alignement: e.alignement });
  const cov = couverture(e.aleas, e.transition);
  if (physique === null || transition === null || cov < (o.couvertureMin ?? 0.75)) return { physique, transition, score: null, niveau: "insuffisant", couverture: cov };
  const score = scoreClimat(physique, transition, o.ponderation);
  return { physique, transition, score, niveau: niveauClimat(score, o.seuils), couverture: cov };
}

// ─────────────────────────── Émissions financées (PCAF) ───────────────────────────

export type BaseAttribution = "demande" | "accorde" | "encours";

/**
 * Montant servant au facteur d'attribution PCAF, à la date d'arrêté : l'encours s'il est connu,
 * sinon le montant accordé après décision favorable, sinon (avant décision) le montant demandé.
 * Les trois valeurs restent tracées ; seule la base retenue entre dans le calcul.
 */
export function baseAttribution(d: {
  decision: string | null;
  montantDemandeRef: number;
  montantAccordeRef: number | null;
  encoursRef: number | null;
  dateEncours: Date | null;
  dateComite: Date | null;
  dateDossier: Date;
}): { base: BaseAttribution; montantRef: number; dateArrete: Date } {
  if (d.decision === "accorde" && d.encoursRef !== null && d.encoursRef >= 0) return { base: "encours", montantRef: d.encoursRef, dateArrete: d.dateEncours ?? d.dateComite ?? d.dateDossier };
  if (d.decision === "accorde" && d.montantAccordeRef !== null) return { base: "accorde", montantRef: d.montantAccordeRef, dateArrete: d.dateComite ?? d.dateDossier };
  return { base: "demande", montantRef: d.montantDemandeRef, dateArrete: d.dateDossier };
}

/**
 * Émissions de gaz à effet de serre du projet (tCO2e/an) et part financée (PCAF, financement de
 * projet : facteur d'attribution = montant attribué (encours à date) / financement total du projet).
 */
export function emissions(entree: {
  methode: string;
  scope1?: number | null;
  scope2?: number | null;
  scope3?: number | null;
  facteurSecteur: number;
  montantInvestissementRef?: number | null;
  /** Montant attribué (base PCAF) en devise de référence. */
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

/**
 * Score de qualité des données PCAF, déduit de la méthode et des preuves (jamais saisi librement) :
 * 1 = émissions déclarées ET vérifiées par un tiers (attestation référencée) ; 2 = déclarées non vérifiées
 * (rapport ou bilan carbone référencé) ; 3 = estimées à partir de l'activité physique ; 5 = estimation
 * sectorielle par montant investi. Une déclaration sans source référencée retombe en 5.
 */
export function qualitePCAF(methode: string, verifiee = false, sourceReferencee = true): number {
  if (methode === "declaree") return !sourceReferencee ? 5 : verifiee ? 1 : 2;
  if (methode === "estimee_activite") return sourceReferencee ? 3 : 5;
  return 5;
}
