/**
 * Jeu de démonstration : comptes par rôle, clients et dossiers à tous les stades du
 * circuit. Réservé aux environnements de test et de formation (`--demo`).
 */
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { genererPlan, recalculer, questionsApplicables } from "../lib/serveur/dossiers";
import { PIECES_DEMO } from "./demo-pieces";

export const MDP_DEMO = "Demo!Sges2026";

const COMPTES: { email: string; prenom: string; nom: string; role: string; entite: string | null; matricule?: string; portee?: string; langue?: string }[] = [
  { email: "admin.demo@sges.local", prenom: "Admin", nom: "Démo", role: "admin_systeme", entite: null },
  { email: "rse@sges.local", prenom: "Salma", nom: "Benali", role: "responsable_rse", entite: "GRP", matricule: "RSE001" },
  { email: "charge.casa@sges.local", prenom: "Youssef", nom: "Alaoui", role: "charge_affaires", entite: "BCP-CA-CASA", matricule: "CA1024" },
  { email: "directeur.casa@sges.local", prenom: "Nadia", nom: "Tazi", role: "directeur_ca", entite: "BCP-CA-CASA", matricule: "DIR207" },
  { email: "charge.settat@sges.local", prenom: "Omar", nom: "Idrissi", role: "charge_affaires", entite: "BPR-CS-CA1", matricule: "CA3310" },
  { email: "directeur.bprcs@sges.local", prenom: "Karim", nom: "Fassi", role: "directeur_ca", entite: "BPR-CS", matricule: "DIR412", portee: "groupe" },
  { email: "risques@sges.local", prenom: "Leila", nom: "Chraibi", role: "risques", entite: "GRP" },
  { email: "comite@sges.local", prenom: "Hassan", nom: "Berrada", role: "comite_credit", entite: "BCP" },
  { email: "audit@sges.local", prenom: "Imane", nom: "Kettani", role: "auditeur", entite: "GRP" },
  { email: "charge.ci@sges.local", prenom: "Aminata", nom: "Koné", role: "charge_affaires", entite: "FIL-CI", matricule: "CI0042", langue: "fr" },
  { email: "analyst.en@sges.local", prenom: "James", nom: "Walker", role: "charge_affaires", entite: "BCP-BFI", matricule: "BFI077", langue: "en" },
  { email: "charge.agadir@sges.local", prenom: "Hicham", nom: "Ouazzani", role: "charge_affaires", entite: "BPR-SM", matricule: "CA4410" },
  { email: "directeur.sm@sges.local", prenom: "Rajae", nom: "El Mansouri", role: "directeur_ca", entite: "BPR-SM", matricule: "DIR530", portee: "groupe" },
  { email: "charge.kenitra@sges.local", prenom: "Zineb", nom: "Lamrani", role: "charge_affaires", entite: "BPR-RSK-CA1", matricule: "CA5120" },
  { email: "directeur.rsk@sges.local", prenom: "Adil", nom: "Benjelloun", role: "directeur_ca", entite: "BPR-RSK", matricule: "DIR611", portee: "groupe" },
];

const CLIENTS = [
  { cle: "CIM", entite: "BCP-CA-CASA", compte: "18278000012345678901", raison: "Ciments de l'Atlas SA", forme: "SA", secteur: "C2394", segment: "GE", ville: "Settat", contact: ["Rachid Amrani", "Directeur HSE", "+212 522 000 101", "hse@ciments-atlas.example"] },
  { cle: "AGRO", entite: "BCP-CA-CASA", compte: "18278000012345678902", raison: "Délices du Souss SARL", forme: "SARL", secteur: "C10", segment: "PME", ville: "Agadir", contact: ["Fatima Zahra Ouali", "Gérante", "+212 528 000 202", "contact@delices-souss.example"] },
  { cle: "SOL", entite: "BCP-BFI", compte: "18278000012345678903", raison: "Noor Énergie Ouarzazate SAS", forme: "SAS", secteur: "D3511R", segment: "GE", ville: "Ouarzazate", contact: ["Mehdi Lahlou", "Directeur de projet", "+212 524 000 303", "projet@noor-energie.example"] },
  { cle: "IT", entite: "BCP-CA-CASA", compte: "18278000012345678904", raison: "Atlas Digital Services SARL", forme: "SARL", secteur: "J", segment: "PME", ville: "Casablanca", contact: ["Sara Bennani", "DAF", "+212 522 000 404", "daf@atlas-digital.example"] },
  { cle: "TEX", entite: "BPR-CS-CA1", compte: "18110000012345678905", raison: "Textiles de Berrechid SA", forme: "SA", secteur: "C13", segment: "GE", ville: "Berrechid", contact: ["Khalid Naciri", "Directeur d'usine", "+212 522 000 505", "usine@textiles-berrechid.example"] },
  { cle: "LEAS", entite: "BCP-CA-CASA", compte: "18278000012345678906", raison: "Maghreb Leasing Équipements SA", forme: "SA", secteur: "K", segment: "IF", ville: "Casablanca", contact: ["Hind Squalli", "Responsable conformité", "+212 522 000 606", "conformite@maghreb-leasing.example"] },
  { cle: "HOT", entite: "BPR-CS-CA1", compte: "18110000012345678907", raison: "Atlantique Resorts SA", forme: "SA", secteur: "I55", segment: "GE", ville: "El Jadida", contact: ["Yassine Mernissi", "Directeur général", "+212 523 000 707", "dg@atlantique-resorts.example"] },
  { cle: "DESAL", entite: "BPR-SM", compte: "18810000012345678909", raison: "Eaux du Souss — Dessalement Chtouka SA", forme: "SA", secteur: "E36", segment: "GE", ville: "Biougra", contact: ["Nabil Aït Lahcen", "Directeur de projet", "+212 528 000 909", "projet@eaux-souss.example"] },
  { cle: "OLIV", entite: "BPR-RSK-CA1", compte: "18115000012345678910", raison: "Domaines Oléicoles du Saïss SARL", forme: "SARL", secteur: "A01", segment: "PME", ville: "Meknès", contact: ["Ilham Kadiri", "Gérante", "+212 535 000 110", "gerance@oleicoles-saiss.example"] },
  { cle: "ACIER", entite: "BCP-BFI", compte: "18278000012345678911", raison: "Aciéries du Détroit SA", forme: "SA", secteur: "C24", segment: "GE", ville: "Tanger", contact: ["Driss Bennouna", "Directeur industriel", "+212 539 000 111", "industrie@acieries-detroit.example"] },
  { cle: "LITTO", entite: "BCP-CA-CASA", compte: "18278000012345678912", raison: "Tamuda Bay Résidences SA", forme: "SA", secteur: "F41", segment: "GE", ville: "M'diq", contact: ["Samir Tazi", "Directeur des programmes", "+212 539 000 212", "programmes@tamuda-residences.example"] },
  { cle: "BIOGAZ", entite: "BCP-BFI", compte: "18278000012345678913", raison: "Valoris Fès Énergie SA", forme: "SA", secteur: "E38", segment: "GE", ville: "Fès", contact: ["Kenza Alami", "Directrice technique", "+212 535 000 313", "technique@valoris-fes.example"] },
  { cle: "BOIS", entite: "BPR-CS-CA1", compte: "18110000012345678914", raison: "Comptoir des Bois Exotiques SARL", forme: "SARL", secteur: "G", segment: "PME", ville: "Berrechid", contact: ["Mounir Haddaoui", "Gérant", "+212 522 000 414", "gerant@bois-exotiques.example"] },
  { cle: "FRIGO", entite: "BPR-SM", compte: "18810000012345678915", raison: "Frigo Transports du Sud SARL", forme: "SARL", secteur: "H49", segment: "PME", ville: "Laâyoune", contact: ["Brahim Moussaoui", "Gérant", "+212 528 000 515", "gerant@frigo-sud.example"] },
  { cle: "ENG", entite: "FIL-CI", compte: "22501000012345678908", raison: "Agro-Intrants Côte d'Ivoire SA", forme: "SA", secteur: "C2012", segment: "GE", ville: "Abidjan", contact: ["Koffi Yao", "Directeur technique", "+225 27 00 00 08", "technique@agro-intrants.example"] },
];

interface Scenario {
  client: string;
  charge: string;
  typeCredit: string;
  nature: string;
  objet: string;
  processus: string;
  montant: number;
  invest: number;
  devise?: string;
  region: string;
  zone: string;
  localite: string;
  /** Éléments positifs du formulaire de catégorisation. */
  cat: number[];
  sousFI?: string;
  /** Part des questions à risque répondues défavorablement (0 à 1). */
  profil: number;
  dd?: boolean;
  climat: { sensibilite: number; adaptation: number; transition: [number, number, number, number]; cbam?: boolean; exportUE?: number; alignement: string; methode: string; s1?: number; s2?: number };
  /** Stade à atteindre. */
  stade: "categorise" | "evalue" | "soumis" | "valide" | "accorde" | "rejete" | "suivi" | "cloture";
  moisAvant: number;
  /** Critères d'exclusion cochés (code) et motif. */
  exclusion?: { codes: string[]; motif: string };
  /** Aléas du site différents de ceux de la région (null = inconnu, "na" = non applicable). */
  aleas?: Partial<Record<string, number | null | "na">>;
  /** Facteurs de transition inconnus (null) : démonstration d'une couverture insuffisante. */
  transitionInconnue?: boolean;
  ebe?: number;
  sourceEmissions?: string;
  verifiees?: boolean;
  ligne?: string;
  /** Encours à date (part du montant accordé) pour les dossiers accordés ou en suivi. */
  encours?: number;
  pieces?: string;
}

const SCENARIOS: Scenario[] = [
  {
    client: "CIM", charge: "charge.casa@sges.local", typeCredit: "GRANDS_PROJETS", nature: "EXTENSION",
    objet: "Extension de la capacité clinker (ligne 2) et installation d'un filtre à manches",
    processus: "Extraction calcaire en carrière, concassage, cuisson du cru en four rotatif (1 450 °C), broyage ciment, ensachage et expédition.",
    montant: 450_000_000, invest: 780_000_000, region: "MA-06", zone: "INDUSTRIELLE", localite: "Settat",
    cat: [1, 11, 12, 13, 15, 16, 17, 21, 22], profil: 0.35, climat: { sensibilite: 2, adaptation: 2, transition: [4, 3, 3, 3], cbam: true, exportUE: 18, alignement: "transition", methode: "declaree", s1: 610_000, s2: 48_000 },
    stade: "suivi", moisAvant: 14,
  },
  {
    client: "AGRO", charge: "charge.casa@sges.local", typeCredit: "INV_PME", nature: "CREATION",
    objet: "Création d'une unité de conditionnement d'agrumes et de jus",
    processus: "Réception, lavage, calibrage, conditionnement des agrumes ; pressage et pasteurisation des jus ; chambres froides.",
    montant: 28_000_000, invest: 36_000_000, region: "MA-09", zone: "INDUSTRIELLE", localite: "Ait Melloul",
    cat: [12, 15, 16, 17, 21], profil: 0.3, climat: { sensibilite: 3, adaptation: 1, transition: [2, 1, 2, 1], alignement: "non_eligible", methode: "estimee_secteur" },
    stade: "soumis", moisAvant: 1,
  },
  {
    client: "SOL", charge: "analyst.en@sges.local", typeCredit: "PROJECT_FINANCE", nature: "CREATION",
    objet: "Centrale photovoltaïque de 120 MWc avec stockage par batteries",
    processus: "Installation de modules photovoltaïques sur trackers, onduleurs, poste de raccordement 225 kV ; nettoyage des modules à faible consommation d'eau.",
    montant: 95_000_000, invest: 140_000_000, devise: "EUR", region: "MA-08", zone: "OASIS", localite: "Ouarzazate",
    cat: [16, 21, 22], profil: 0.1, dd: true, climat: { sensibilite: 2, adaptation: 3, transition: [0, 1, 0, 0], alignement: "vert", methode: "estimee_activite", s1: 900, s2: 1_200 },
    stade: "valide", moisAvant: 2,
  },
  {
    client: "IT", charge: "charge.casa@sges.local", typeCredit: "INV_PME", nature: "EXTENSION",
    objet: "Aménagement d'un centre de services et acquisition de serveurs",
    processus: "Prestations de services numériques et d'hébergement ; salle serveurs climatisée.",
    montant: 12_500_000, invest: 15_000_000, region: "MA-06", zone: "URBAINE", localite: "Casablanca",
    cat: [24], profil: 0.2, climat: { sensibilite: 1, adaptation: 2, transition: [1, 1, 1, 0], alignement: "non_eligible", methode: "estimee_secteur" },
    stade: "evalue", moisAvant: 0,
  },
  {
    client: "TEX", charge: "charge.settat@sges.local", typeCredit: "INV_GE", nature: "MODERNISATION",
    objet: "Modernisation de la teinturerie et station de traitement des effluents",
    processus: "Filature, tissage, teinture et finissage ; chaudières vapeur au fioul ; rejets d'eaux colorées.",
    montant: 64_000_000, invest: 82_000_000, region: "MA-06", zone: "INDUSTRIELLE", localite: "Berrechid",
    cat: [12, 13, 14, 15, 16, 17, 19, 21], profil: 0.45, climat: { sensibilite: 2, adaptation: 1, transition: [2, 2, 3, 2], cbam: false, alignement: "non_aligne", methode: "estimee_secteur" },
    stade: "accorde", moisAvant: 5,
  },
  {
    client: "LEAS", charge: "charge.casa@sges.local", typeCredit: "INV_GE", nature: "EXTENSION",
    objet: "Ligne de refinancement du portefeuille de crédit-bail d'équipements",
    processus: "Crédit-bail d'équipements industriels, agricoles et de transport aux PME.",
    montant: 150_000_000, invest: 150_000_000, region: "MA-06", zone: "URBAINE", localite: "Casablanca",
    cat: [25], sousFI: "FI2", profil: 0.4, climat: { sensibilite: 1, adaptation: 1, transition: [2, 1, 2, 2], alignement: "non_eligible", methode: "estimee_secteur" },
    stade: "categorise", moisAvant: 0,
  },
  {
    client: "HOT", charge: "charge.settat@sges.local", typeCredit: "MLT_BPR", nature: "RENOUVELLEMENT",
    objet: "Rénovation énergétique d'un complexe hôtelier balnéaire (solaire thermique, GTB)",
    processus: "Hébergement touristique de 320 chambres, restauration, piscines, blanchisserie.",
    montant: 38_000_000, invest: 52_000_000, region: "MA-06", zone: "COTIERE", localite: "El Jadida",
    cat: [12, 15, 16, 17], profil: 0.15, dd: true, climat: { sensibilite: 3, adaptation: 2, transition: [1, 1, 1, 1], alignement: "transition", methode: "estimee_secteur" },
    stade: "cloture", moisAvant: 26,
  },
  {
    client: "ENG", charge: "charge.ci@sges.local", typeCredit: "INV_GE", nature: "CREATION",
    objet: "Unité de mélange d'engrais NPK",
    processus: "Réception de matières premières (urée, phosphates, potasse), mélange, granulation, ensachage.",
    montant: 9_500_000_000, invest: 14_000_000_000, devise: "XOF", region: "CI-AB", zone: "INDUSTRIELLE", localite: "Yopougon",
    cat: [7, 12, 13, 14, 15, 17, 21, 22], profil: 0.5, climat: { sensibilite: 3, adaptation: 1, transition: [3, 2, 3, 2], alignement: "non_aligne", methode: "estimee_secteur" },
    stade: "rejete", moisAvant: 3,
  },
  {
    client: "DESAL", charge: "charge.agadir@sges.local", typeCredit: "GRANDS_PROJETS", nature: "CREATION",
    objet: "Station de dessalement d'eau de mer (275 000 m3/jour) pour l'irrigation de la plaine de Chtouka et l'eau potable du Grand Agadir",
    processus: "Prise d'eau en mer, prétraitement, osmose inverse en deux passes, reminéralisation ; émissaire de rejet de saumure ; poste électrique et 120 km de conduites.",
    montant: 620_000_000, invest: 1_150_000_000, region: "MA-09", zone: "COTIERE", localite: "Chtouka Aït Baha",
    cat: [2, 5, 9, 12, 14, 16, 17, 19, 21, 22], profil: 0.25, dd: true, ligne: "BEI", ebe: 140_000_000,
    aleas: { incendie: "na" },
    climat: { sensibilite: 3, adaptation: 3, transition: [2, 2, 1, 1], alignement: "transition", methode: "estimee_activite", s2: 210_000 },
    sourceEmissions: "Consommation électrique de conception (3,5 kWh/m3 × 100 Mm3/an) × facteur réseau ONEE 2024, net de la part éolienne contractée.",
    stade: "evalue", moisAvant: 0, pieces: "DESAL",
  },
  {
    client: "OLIV", charge: "charge.kenitra@sges.local", typeCredit: "INV_PME", nature: "EXTENSION",
    objet: "Extension de l'oliveraie irriguée (180 à 420 ha) et création d'une unité de trituration à deux phases",
    processus: "Oléiculture intensive en goutte-à-goutte avec fertigation ; trituration à deux phases ; compostage des grignons ; pompage solaire.",
    montant: 42_000_000, invest: 55_000_000, region: "MA-03", zone: "RURALE", localite: "Aïn Jemaâ",
    cat: [12, 14, 15, 16, 21, 22], profil: 0.3, dd: true, ligne: "GEFF", ebe: 9_000_000,
    climat: { sensibilite: 4, adaptation: 2, transition: [1, 1, 2, 1], alignement: "transition", methode: "estimee_secteur" },
    stade: "soumis", moisAvant: 1, pieces: "OLIV",
  },
  {
    client: "ACIER", charge: "analyst.en@sges.local", typeCredit: "GRANDS_PROJETS", nature: "TRANSITION",
    objet: "Décarbonation de l'aciérie : fours de réchauffage à induction et raccordement à un parc éolien",
    processus: "Aciérie électrique (four à arc), coulée continue, laminage à chaud de ronds à béton et fil machine ; 35 % des volumes exportés vers l'UE.",
    montant: 900_000_000, invest: 1_400_000_000, region: "MA-01", zone: "INDUSTRIELLE", localite: "Tanger",
    cat: [1, 12, 13, 14, 15, 17, 19, 21, 22, 23], profil: 0.3, ebe: 260_000_000,
    climat: { sensibilite: 2, adaptation: 2, transition: [4, 3, 3, 3], cbam: true, exportUE: 35, alignement: "transition", methode: "declaree", s1: 380_000, s2: 220_000 },
    sourceEmissions: "Bilan GES 2025 (GHG Protocol), attestation de vérification d'assurance limitée n° VER-2026-118 du 15/03/2026 par un organisme tiers accrédité.",
    verifiees: true, stade: "valide", moisAvant: 1, pieces: "ACIER",
  },
  {
    client: "LITTO", charge: "charge.casa@sges.local", typeCredit: "INV_GE", nature: "CREATION",
    objet: "Programme de 240 logements touristiques en front de mer et équipements de loisirs",
    processus: "Construction de résidences R+3, piscines, voiries et réseaux ; gestion locative hôtelière ; station de traitement des eaux usées pour l'arrosage.",
    montant: 180_000_000, invest: 260_000_000, region: "MA-01", zone: "COTIERE", localite: "M'diq",
    cat: [12, 15, 16, 17, 19, 21, 22], profil: 0.2, ligne: "FONDS_PROPRES", ebe: 35_000_000,
    aleas: { submersionMarine: 3, inondation: 3 },
    climat: { sensibilite: 3, adaptation: 1, transition: [1, 1, 2, 2], alignement: "non_aligne", methode: "estimee_secteur" },
    stade: "suivi", moisAvant: 10, encours: 0.55,
  },
  {
    client: "BIOGAZ", charge: "analyst.en@sges.local", typeCredit: "PROJECT_FINANCE", nature: "CREATION",
    objet: "Captage et valorisation électrique du biogaz de la décharge contrôlée (6 MW)",
    processus: "Réseau de captage du biogaz, torchères, moteurs à gaz et raccordement moyenne tension ; tri et compostage des déchets verts.",
    montant: 120_000_000, invest: 165_000_000, region: "MA-03", zone: "PERIURBAINE", localite: "Fès",
    cat: [12, 13, 15, 21, 22, 23], profil: 0.15, dd: true, ligne: "SUNREF", ebe: 28_000_000,
    climat: { sensibilite: 2, adaptation: 2, transition: [0, 1, 0, 1], alignement: "vert", methode: "estimee_activite", s1: 4_000 },
    sourceEmissions: "Étude de faisabilité 2025 : émissions résiduelles des moteurs et des torchères (facteurs GIEC 2006).",
    stade: "accorde", moisAvant: 4, encours: 0.4,
  },
  {
    client: "BOIS", charge: "charge.settat@sges.local", typeCredit: "INV_PME", nature: "EXTENSION",
    objet: "Extension de l'entrepôt de négoce de bois exotiques",
    processus: "Importation, stockage et revente de grumes et bois sciés tropicaux (Afrique centrale), sans certification de gestion durable.",
    montant: 18_000_000, invest: 22_000_000, region: "MA-06", zone: "INDUSTRIELLE", localite: "Berrechid",
    cat: [15, 21], profil: 0.3,
    exclusion: { codes: ["EXC11"], motif: "Approvisionnement en bois tropicaux sans certification FSC/PEFC ni traçabilité de l'origine : activité inscrite sur la liste d'exclusion (produits forestiers non issus de forêts gérées durablement). Mise en conformité attendue : certification de la chaîne de contrôle avant tout financement." },
    climat: { sensibilite: 1, adaptation: 1, transition: [1, 1, 1, 1], alignement: "non_eligible", methode: "estimee_secteur" },
    stade: "categorise", moisAvant: 0,
  },
  {
    client: "FRIGO", charge: "charge.agadir@sges.local", typeCredit: "LEASING", nature: "RENOUVELLEMENT",
    objet: "Renouvellement de 25 camions frigorifiques (norme Euro VI, groupes froid au R452A)",
    processus: "Transport frigorifique de produits de la mer entre Laâyoune, Dakhla, Agadir et Casablanca ; atelier d'entretien.",
    montant: 32_000_000, invest: 38_000_000, region: "MA-11", zone: "INDUSTRIELLE", localite: "Laâyoune",
    cat: [13, 14, 17, 20, 21], profil: 0.35, ligne: "MORSEFF",
    aleas: { chaleurExtreme: null, submersionMarine: null, inondation: null },
    transitionInconnue: true,
    climat: { sensibilite: 2, adaptation: 1, transition: [3, 2, 2, 1], alignement: "non_aligne", methode: "estimee_secteur" },
    stade: "evalue", moisAvant: 0,
  },
];

function valeurDemo(q: { code: string; type: string; reponseRisque: string | null }, i: number, profil: number): string {
  if (q.type === "nombre") return q.code === "SIG01" ? String(40 + ((i * 37) % 900)) : q.code === "SIG02" ? String(10 + ((i * 7) % 45)) : String(Math.round(profil * 60));
  if (q.type === "texte") return "Gardiennage, nettoyage et transport du personnel.";
  if (!q.reponseRisque) return "oui";
  const defavorable = ((i * 0.618) % 1) < profil;
  const risque = q.reponseRisque.split(",")[0];
  const favorable = risque === "oui" ? "non" : "oui";
  if (q.type === "oui_non_na" && i % 7 === 3) return "na";
  return defavorable ? risque : favorable;
}

export async function installerDemo(prisma: PrismaClient) {
  console.log("• Démonstration : comptes, clients, dossiers…");
  const hash = await bcrypt.hash(MDP_DEMO, 10);
  const entites = new Map((await prisma.entite.findMany()).map((e) => [e.code, e]));
  const roles = new Map((await prisma.role.findMany()).map((r) => [r.code, r]));
  for (const c of COMPTES) {
    await prisma.utilisateur.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email, prenom: c.prenom, nom: c.nom, matricule: c.matricule ?? null,
        roleId: roles.get(c.role)!.id, entiteId: c.entite ? entites.get(c.entite)!.id : null,
        porteeEcriture: c.portee ?? "entite", langue: c.langue ?? "fr", motDePasseHash: hash, doitChangerMdp: false,
      },
    });
  }
  const users = new Map((await prisma.utilisateur.findMany()).map((u) => [u.email, u]));
  const secteurs = new Map((await prisma.secteur.findMany()).map((s) => [s.code, s]));
  const regions = new Map((await prisma.region.findMany()).map((r) => [r.code, r]));

  const clients = new Map<string, string>();
  for (const c of CLIENTS) {
    const existe = await prisma.client.findFirst({ where: { compteCourant: c.compte } });
    const cl =
      existe ??
      (await prisma.client.create({
        data: {
          entiteId: entites.get(c.entite)!.id, compteCourant: c.compte, codeClient: c.compte.slice(8, 16),
          raisonSociale: c.raison, formeJuridique: c.forme, comptePortefeuille: `PTF-${c.entite}`,
          secteurId: secteurs.get(c.secteur)!.id, segment: c.segment, ville: c.ville, pays: c.entite === "FIL-CI" ? "CI" : "MA",
          contactNom: c.contact[0], contactPoste: c.contact[1], contactTelephone: c.contact[2], contactEmail: c.contact[3],
          sourceSignaletique: "simulation",
        },
      }));
    clients.set(c.cle, cl.id);
  }

  if ((await prisma.dossier.count()) > 0) {
    console.log("  Des dossiers existent déjà : dossiers de démonstration non recréés.");
    return;
  }

  const criteres = await prisma.critereExclusion.findMany({ where: { actif: true } });
  const questionsCat = await prisma.questionCategorisation.findMany();
  const directeurCasa = users.get("directeur.casa@sges.local")!;
  const directeurCS = users.get("directeur.bprcs@sges.local")!;
  const directeurPour = (entite: string) =>
    entite.startsWith("BPR-CS") ? directeurCS : entite.startsWith("BPR-SM") ? users.get("directeur.sm@sges.local")! : entite.startsWith("BPR-RSK") ? users.get("directeur.rsk@sges.local")! : directeurCasa;

  let n = 0;
  for (const s of SCENARIOS) {
    n++;
    const client = await prisma.client.findUniqueOrThrow({ where: { id: clients.get(s.client)! }, include: { entite: true } });
    const charge = users.get(s.charge)!;
    const date = new Date();
    date.setMonth(date.getMonth() - s.moisAvant);
    const ref = `SGES-${client.entite.code}-${date.getFullYear()}-${String(n).padStart(5, "0")}`;
    const d = await prisma.dossier.create({
      data: {
        reference: ref, entiteId: client.entiteId, clientId: client.id, chargeId: charge.id, dateDossier: date, creeParId: charge.id,
        typeCredit: s.typeCredit, natureProjet: s.nature, objet: s.objet, descriptionProcessus: s.processus,
        projetDeveloppementDurable: !!s.dd, secteurId: client.secteurId, deviseCode: s.devise ?? (client.entite.code === "FIL-CI" ? "XOF" : "MAD"),
        montantDemande: s.montant, montantInvestissement: s.invest, regionId: regions.get(s.region)!.id, typeZone: s.zone,
        localite: s.localite, adresseSite: `Site de ${s.localite}`, dureeMois: 84, createdAt: date, ligneFinancement: s.ligne ?? null,
      },
    });
    for (const pc of s.pieces ? PIECES_DEMO[s.pieces] ?? [] : []) {
      const octets = Buffer.from(pc.texte, "utf8");
      await prisma.document.create({
        data: { dossierId: d.id, type: pc.type, nom: pc.nom, mime: "text/plain", taille: octets.length, contenu: octets, texte: pc.texte, analyse: pc.analyse ? JSON.stringify(pc.analyse) : null, deposeParId: charge.id, createdAt: date },
      });
    }
    const hist = async (evenement: string, de?: string, vers?: string, auteur = charge, commentaire?: string) =>
      prisma.historiqueDossier.create({ data: { dossierId: d.id, auteurId: auteur.id, auteurNom: `${auteur.prenom} ${auteur.nom}`, evenement, deStatut: de, versStatut: vers, commentaire, date } });
    await hist("creation");

    for (const c of criteres) await prisma.reponseExclusion.create({ data: { dossierId: d.id, critereId: c.id, reponse: !!s.exclusion?.codes.includes(c.code) } });
    if (s.exclusion) await prisma.dossier.update({ where: { id: d.id }, data: { motifExclusion: s.exclusion.motif } });
    for (const q of questionsCat) await prisma.reponseCategorisation.create({ data: { dossierId: d.id, questionId: q.id, reponse: s.cat.includes(q.numero) } });
    if (s.sousFI) await prisma.dossier.update({ where: { id: d.id }, data: { sousCategorieFI: s.sousFI } });
    await recalculer(d.id);
    const apres = await prisma.dossier.findUniqueOrThrow({ where: { id: d.id }, include: { secteur: true, region: true } });
    if (s.stade === "categorise") continue;

    const questions = await questionsApplicables(d.id, apres.categorie, apres.secteur?.code ?? null);
    for (const [i, q] of questions.entries()) {
      await prisma.reponseQuestion.create({ data: { dossierId: d.id, questionId: q.id, valeur: valeurDemo(q, i + n, s.profil) } });
    }
    const r = apres.region!;
    await prisma.evaluationClimat.create({
      data: {
        dossierId: d.id,
        aleas: JSON.stringify({ stressHydrique: r.stressHydrique, secheresse: r.secheresse, inondation: r.inondation, chaleurExtreme: r.chaleurExtreme, submersionMarine: r.submersionMarine, incendie: r.incendie, seisme: r.seisme, ...s.aleas }),
        sensibilite: s.climat.sensibilite, capaciteAdaptation: s.climat.adaptation,
        transition: JSON.stringify(s.transitionInconnue ? {} : { reglementaire: s.climat.transition[0], technologique: s.climat.transition[1], marche: s.climat.transition[2], reputation: s.climat.transition[3] }),
        ebeAnnuel: s.ebe ?? null, sourceEmissions: s.sourceEmissions ?? null, emissionsVerifiees: !!s.verifiees,
        expositionCBAM: !!s.climat.cbam, partExportUE: s.climat.exportUE ?? null, methodeEmissions: s.climat.methode,
        scope1: s.climat.s1 ?? null, scope2: s.climat.s2 ?? null, alignementTaxonomie: s.climat.alignement,
        mesuresAdaptation: s.climat.adaptation >= 2 ? "Protection contre les crues, récupération des eaux pluviales, plan canicule." : null,
      },
    });
    await prisma.dossier.update({
      where: { id: d.id },
      data: { commentaireEvaluation: "Évaluation réalisée lors de la visite du site avec le responsable HSE du client. Les risques non maîtrisés font l'objet du plan d'actions ci-joint, accepté par le client." },
    });
    await recalculer(d.id);
    await genererPlan(d.id);
    if (s.stade === "evalue") continue;

    // Négociation : le client retient la plupart des actions.
    const actions = await prisma.action.findMany({ where: { dossierId: d.id }, orderBy: { ordre: "asc" } });
    for (const [i, a] of actions.entries()) {
      const retenue = i % 5 !== 4;
      await prisma.action.update({
        where: { id: a.id },
        data: {
          retenue, reserveClient: retenue ? null : "Mesure jugée disproportionnée par le client ; alternative proposée.",
          dateDebut: date, responsable: "Responsable HSE du client", budget: retenue ? 150_000 + i * 85_000 : null, deviseCode: apres.deviseCode,
        },
      });
    }
    if (apres.categorie === "A") {
      await prisma.action.create({
        data: { dossierId: d.id, origine: "eie", thematique: "GEST_ENV", libelle: "Mettre en œuvre le programme de surveillance des poussières diffuses prévu au PGES (capteurs en limite de site, rapport trimestriel)", horizon: "court", negociable: false, retenue: true, dateDebut: date, responsable: "Bureau d'études PGES", ordre: 99 },
      });
    }
    const directeur = directeurPour(client.entite.code);
    await prisma.dossier.update({ where: { id: d.id }, data: { statut: "soumis", soumisLe: date, etape: 7 } });
    await hist("transition", "brouillon", "soumis");
    if (s.stade === "soumis") continue;

    await prisma.dossier.update({ where: { id: d.id }, data: { statut: "valide", verrouille: true, valideurId: directeur.id, valideLe: date, commentaireValidation: "Évaluation conforme à la procédure." } });
    await hist("transition", "soumis", "valide", directeur);
    if (s.stade === "valide") continue;

    const rejete = s.stade === "rejete";
    await prisma.dossier.update({
      where: { id: d.id },
      data: {
        statut: "decide", comite: client.entite.code.startsWith("BPR") ? "BPR" : client.entite.code === "BCP-BFI" ? "DIRECTOIRE" : "BCP", dateComite: date, decision: rejete ? "rejete" : "accorde",
        montantAccorde: rejete ? null : s.montant * 0.9, motifRejetCode: rejete ? "RISQUE_NON_MAITRISE" : null,
        motifRejetES: rejete ? "Absence d'autorisation environnementale et de stockage sécurisé des intrants ; risques HSE majeurs non maîtrisés." : null,
        reservesComite: rejete ? null : "Décaissement de la seconde tranche conditionné à la mise en service du dispositif de traitement.",
        commentaireComite: rejete ? "Le dossier pourra être représenté après mise en conformité." : "Accord sous réserve du respect du plan d'actions E&S.",
        verrouille: false,
      },
    });
    await hist("decision", "valide", "decide", charge);
    // Base PCAF des émissions financées : montant accordé (comme après une décision saisie à l'écran),
    // puis encours à date lorsqu'il est connu.
    if (!rejete && s.encours) {
      const arrete = new Date(date);
      arrete.setMonth(arrete.getMonth() + 3);
      await prisma.dossier.update({ where: { id: d.id }, data: { encours: Math.round(s.montant * 0.9 * s.encours), dateEncours: arrete > new Date() ? new Date() : arrete } });
    }
    await recalculer(d.id);
    if (s.stade === "rejete" || s.stade === "accorde") continue;

    await prisma.dossier.update({ where: { id: d.id }, data: { statut: "en_suivi" } });
    await hist("transition", "decide", "en_suivi");
    const retenues = await prisma.action.findMany({ where: { dossierId: d.id, retenue: true } });
    for (const [i, a] of retenues.entries()) {
      const avancement = s.stade === "cloture" ? 100 : [100, 60, 30, 0][i % 4];
      await prisma.action.update({ where: { id: a.id }, data: { avancement, statut: avancement === 100 ? "realisee" : avancement > 0 ? "en_cours" : "a_faire" } });
      if (avancement > 0) await prisma.suiviAction.create({ data: { actionId: a.id, avancement, statut: avancement === 100 ? "realisee" : "en_cours", commentaire: "Constaté lors de la visite de suivi.", auteurId: charge.id } });
    }
    const visite = new Date(date);
    visite.setMonth(visite.getMonth() + 6);
    await prisma.visite.create({
      data: {
        dossierId: d.id, date: visite, type: "suivi", visiteurId: charge.id, participants: "Chargé d'affaires, responsable HSE du client",
        constats: "Filtre à manches installé sur la ligne 1 ; aire de stockage des déchets dangereux en cours d'aménagement.",
        conformite: "partielle", recommandations: "Finaliser la rétention des cuves de fioul avant la prochaine visite.",
        prochaineVisite: new Date(visite.getFullYear() + 1, visite.getMonth(), visite.getDate()),
      },
    });
    if (s.stade === "cloture") {
      await prisma.dossier.update({ where: { id: d.id }, data: { statut: "cloture" } });
      await hist("transition", "en_suivi", "cloture", directeur);
    }
  }
  // Note ESG actualisée avec les actions et visites de suivi créées ci-dessus.
  for (const d of await prisma.dossier.findMany({ select: { id: true } })) await recalculer(d.id);
  console.log(`  ${SCENARIOS.length} dossiers, ${CLIENTS.length} clients, ${COMPTES.length} comptes (mot de passe : ${MDP_DEMO}).`);
}
