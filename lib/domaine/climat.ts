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

// ─────────────────────────── Scénarios (analyse de sensibilité, BAM 5/W/2021) ───────────────────────────

export type ScenarioPhysique = "ssp245" | "ssp585";

/**
 * Aggravation des aléas à l'horizon 2050 (en crans de l'échelle 0-4), d'après les tendances projetées
 * par le GIEC (AR6) pour l'Afrique du Nord et la Méditerranée : réchauffement supérieur à la moyenne
 * mondiale, baisse des précipitations, sécheresses plus fréquentes, élévation du niveau de la mer.
 * Le séisme n'évolue pas. Hypothèses d'expert, indicatives, à remplacer par des projections locales.
 */
export const AGGRAVATION_2050: Record<ScenarioPhysique, Partial<Record<Alea, number>>> = {
  ssp245: { stressHydrique: 1, secheresse: 1, chaleurExtreme: 1 },
  ssp585: { stressHydrique: 1, secheresse: 1, chaleurExtreme: 2, inondation: 1, submersionMarine: 1, incendie: 1 },
};

/** Aléas projetés : un aléa inconnu reste inconnu, un aléa non applicable reste non applicable. */
export function aleasProjetes(aleas: Aleas, scenario: ScenarioPhysique): Aleas {
  const delta = AGGRAVATION_2050[scenario];
  return Object.fromEntries(
    ALEAS.map((a) => {
      const v = aleas[a];
      return [a, typeof v === "number" ? Math.min(4, v + (delta[a] ?? 0)) : v];
    })
  ) as Aleas;
}

export type ScenarioTransition = "actuelles" | "sous2" | "nz2050";
export const SCENARIOS_TRANSITION: ScenarioTransition[] = ["actuelles", "sous2", "nz2050"];

/**
 * Prix du carbone à l'horizon 2030 par scénario NGFS (politiques actuelles, sous 2 °C, zéro émission
 * nette 2050), en devise de référence par tCO2e — paramètre CLIMAT_PRIX_CARBONE (« 100,850,1700 » MAD).
 */
export function lirePrixCarbone(v: string | null | undefined): Record<ScenarioTransition, number> {
  const p = (v ?? "").split(",").map((x) => Number(x.trim()));
  const ok = p.length === 3 && p.every((x) => Number.isFinite(x) && x >= 0);
  const [a, b, c] = ok ? p : [100, 850, 1700];
  return { actuelles: a, sous2: b, nz2050: c };
}

export interface ResultatStressTransition {
  scenario: ScenarioTransition;
  prixCarbone: number;
  /** Coût annuel d'un prix du carbone appliqué aux émissions du projet (devise de référence). */
  coutCarbone: number;
  /** Coût CBAM annuel sur la part exportée vers l'UE (certificats au prix ETS, sans prix carbone local déductible). */
  coutCBAM: number;
  total: number;
  /** Part de l'EBE annuel absorbée (0 à 1+), null si l'EBE n'est pas renseigné. */
  partEBE: number | null;
}

/**
 * Part des émissions effectivement soumise au CBAM à l'horizon 2030 : suppression progressive des quotas
 * gratuits du SEQE-UE (règlement (UE) 2023/956) — 2,5 % en 2026, 5 % en 2027, 10 % en 2028, 22,5 % en
 * 2029, 48,5 % en 2030… 100 % en 2034. Paramètre CLIMAT_CBAM_FACTEUR (0,485 par défaut).
 */
export const FACTEUR_CBAM_2030 = 0.485;

/**
 * Stress de transition : coût annuel du carbone sous chaque scénario et coût CBAM pour les exportateurs
 * vers l'UE, rapportés à l'EBE du projet. Le CBAM porte sur les émissions directes (scope 1) des produits
 * exportés — fer, acier, aluminium et hydrogène ; ciment et engrais incluent aussi l'électricité : on
 * retient les émissions directes si elles sont connues, sinon les émissions totales (approche prudente).
 * Au-delà du seuil (CLIMAT_SEUIL_EBE, 10 % par défaut), l'alerte est levée.
 */
export function stressTransition(e: {
  emissionsTotales: number;
  /** Émissions directes (scope 1), base du CBAM lorsqu'elles sont connues. */
  emissionsDirectes?: number | null;
  facteurCBAM?: number;
  expositionCBAM: boolean;
  partExportUE?: number | null;
  prix: Record<ScenarioTransition, number>;
  prixETS: number;
  ebeRef?: number | null;
  seuilEBE?: number;
}): { scenarios: ResultatStressTransition[]; alerte: boolean } {
  const baseCBAM = e.emissionsDirectes && e.emissionsDirectes > 0 ? e.emissionsDirectes : e.emissionsTotales;
  const coutCBAM = e.expositionCBAM ? arrondir(baseCBAM * ((e.partExportUE ?? 0) / 100) * e.prixETS * (e.facteurCBAM ?? FACTEUR_CBAM_2030), 0) : 0;
  const scenarios = SCENARIOS_TRANSITION.map((s) => {
    const coutCarbone = arrondir(e.emissionsTotales * e.prix[s], 0);
    const total = coutCarbone + coutCBAM;
    return { scenario: s, prixCarbone: e.prix[s], coutCarbone, coutCBAM, total, partEBE: e.ebeRef && e.ebeRef > 0 ? arrondir(total / e.ebeRef, 3) : null };
  });
  const seuil = e.seuilEBE ?? 0.1;
  return { scenarios, alerte: scenarios.some((x) => x.partEBE !== null && x.partEBE > seuil) };
}

export interface ScenariosClimat {
  physique: { actuel: number | null; ssp245: number | null; ssp585: number | null };
  transition: ResultatStressTransition[];
  alerteTransition: boolean;
}

export function scenariosClimat(e: {
  aleas: Aleas;
  sensibilite: number;
  capaciteAdaptation: number;
  emissionsTotales: number;
  emissionsDirectes?: number | null;
  facteurCBAM?: number;
  expositionCBAM: boolean;
  partExportUE?: number | null;
  prix: Record<ScenarioTransition, number>;
  prixETS: number;
  ebeRef?: number | null;
  seuilEBE?: number;
}): ScenariosClimat {
  const st = stressTransition(e);
  return {
    physique: {
      actuel: scorePhysique(e.aleas, e.sensibilite, e.capaciteAdaptation),
      ssp245: scorePhysique(aleasProjetes(e.aleas, "ssp245"), e.sensibilite, e.capaciteAdaptation),
      ssp585: scorePhysique(aleasProjetes(e.aleas, "ssp585"), e.sensibilite, e.capaciteAdaptation),
    },
    transition: st.scenarios,
    alerteTransition: st.alerte,
  };
}
