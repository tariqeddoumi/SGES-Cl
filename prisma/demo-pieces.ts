/**
 * Pièces fictives des dossiers de démonstration (texte), pour la check-list documentaire et l'assistant IA.
 * Toutes les personnes, sociétés et références sont fictives.
 */
import type { AnalysePiece } from "../lib/domaine/pieces";

export interface PieceDemo {
  type: string;
  nom: string;
  texte: string;
  /** Analyse de démonstration (sans appel à l'IA) : montre une pièce incomplète dans la check-list. */
  analyse?: AnalysePiece;
}

const present = (code: string) => ({ code, etat: "present" as const, precision: null, citation: null });

export const EIES_DESSALEMENT = `ÉTUDE D'IMPACT ENVIRONNEMENTAL ET SOCIAL — STATION DE DESSALEMENT D'EAU DE MER DE CHTOUKA (VERSION PROVISOIRE)
Maître d'ouvrage : Eaux du Souss — Dessalement Chtouka SA. Bureau d'études : EnviroConseil Maroc (fictif), mars 2026.

1. Résumé non technique
Le projet consiste à construire une station de dessalement par osmose inverse d'une capacité de 275 000 m3/jour, destinée à l'irrigation de 15 000 ha de la plaine de Chtouka et à l'eau potable du Grand Agadir. Il comprend une prise d'eau en mer, un émissaire de rejet de saumure, la station, un poste électrique et 120 km de conduites.

2. Description du projet et de ses variantes
Procédé : prétraitement par flottation et filtration, osmose inverse en deux passes, reminéralisation. Consommation électrique estimée à 3,5 kWh/m3, alimentée à 60 % par un parc éolien dédié (contrat d'achat d'électricité en cours de négociation). Variantes de site étudiées : Tifnit et Sidi Rbat ; Tifnit retenu pour la profondeur de la prise.

3. État initial du site
Milieu marin : courantologie et bathymétrie décrites. Qualité de l'eau de mer : une campagne de mesures (janvier 2026). Milieu terrestre : dunes côtières partiellement dégradées. Le site est situé à 4 km du Parc national de Souss-Massa ; l'inventaire de l'avifaune n'a pas été réalisé sur un cycle annuel complet. Aucune mesure de bruit à l'état initial n'est présentée.

4. Analyse des impacts
Phase travaux : poussières, bruit, circulation d'engins, emprise sur les dunes. Phase exploitation : rejet de saumure (salinité 1,8 fois celle de l'eau de mer) et de produits de nettoyage des membranes, impingement et entraînement d'organismes à la prise d'eau, consommation d'énergie, émissions indirectes de GES. Modélisation de dispersion de la saumure : panache inférieur à +2 g/l au-delà de 300 m du diffuseur.

5. Mesures d'évitement, de réduction et de compensation
Diffuseurs multiports, prise d'eau à faible vitesse (< 0,15 m/s) avec grilles, neutralisation des eaux de lavage, restauration des dunes après travaux, recrutement local prioritaire.

6. Programme de surveillance
Suivi mensuel de la salinité et de la température au point de rejet ; suivi semestriel du benthos. Budget et responsabilités à préciser dans le PGES.

7. Consultation du public
L'enquête publique prévue par la loi 49-17 n'a pas encore été organisée. Une réunion d'information avec les associations d'usagers de l'eau est programmée.

8. Auteur
EnviroConseil Maroc, document non signé (version provisoire).`;

export const PGES_DESSALEMENT = `PLAN DE GESTION ENVIRONNEMENTALE ET SOCIALE (EXTRAIT) — DESSALEMENT CHTOUKA
Mesures : (1) contrôle de la salinité au rejet ; (2) gestion des produits chimiques de nettoyage des membranes (stockage sur rétention, neutralisation) ; (3) plan de circulation des engins ; (4) restauration des dunes ; (5) mécanisme de gestion des plaintes des riverains et des pêcheurs.
Responsables : direction HSE du maître d'ouvrage ; entreprise générale pour la phase travaux.
Calendrier : mesures 1, 2 et 5 dès la mise en service ; mesures 3 et 4 pendant les travaux (2026-2028).
Budget : à chiffrer.
Indicateurs : salinité, nombre de plaintes traitées, surface de dunes restaurée.`;

export const PRESENTATION_OLIVERAIE = `NOTE DE PRÉSENTATION — EXTENSION DE L'OLIVERAIE ET DE L'UNITÉ DE TRITURATION
Domaines Oléicoles du Saïss SARL, Meknès.
Objet : extension de 180 à 420 ha d'oliveraie intensive irriguée et création d'une unité de trituration à deux phases (40 t/jour).
Investissement : 55 millions de dirhams (crédit sollicité : 42 millions ; apport des associés : 13 millions).
Site : commune rurale d'Aïn Jemaâ, plaine du Saïss ; aucune zone protégée dans un rayon de 5 km ; oued à 1,2 km.
Procédé : irrigation goutte-à-goutte avec fertigation ; trituration à deux phases limitant les margines ; valorisation des grignons en compost.
Eau : prélèvement autorisé de 650 000 m3/an dans la nappe du Saïss (forage existant) ; bassin de stockage des eaux pluviales de 20 000 m3.
Énergie : pompage solaire de 300 kWc pour 70 % des besoins.
Effectifs : 18 permanents, jusqu'à 120 saisonniers pendant la récolte (hébergement non prévu, transport assuré).
Calendrier : plantation 2026-2027, mise en service de l'unité en novembre 2027.`;

export const AUTORISATION_OLIVERAIE = `AGENCE DU BASSIN HYDRAULIQUE DU SEBOU — AUTORISATION DE PRÉLÈVEMENT D'EAU SOUTERRAINE (FICTIVE)
Autorisation n° ABHS/2025/0417 délivrée le 12 novembre 2025 à Domaines Oléicoles du Saïss SARL, en application de la loi n° 36-15 sur l'eau.
Ouvrage : forage F2, commune d'Aïn Jemaâ. Volume maximal annuel : 650 000 m3. Débit maximal : 25 l/s.
Conditions : compteur volumétrique, déclaration trimestrielle des volumes prélevés, réduction de 30 % en période de sécheresse déclarée.
Validité : 10 ans, jusqu'au 11 novembre 2035.`;

export const BILAN_CARBONE_ACIERIE = `BILAN DES ÉMISSIONS DE GAZ À EFFET DE SERRE 2025 — ACIÉRIES DU DÉTROIT SA (SITE DE TANGER)
Périmètre : aciérie électrique (four à arc) et laminoir à chaud. Méthode : GHG Protocol, facteurs d'émission ONEE 2024.
Scope 1 : 380 000 tCO2e (gaz naturel des fours de réchauffage, électrodes, chaux). Scope 2 : 220 000 tCO2e (électricité du réseau).
Vérification : attestation de vérification d'assurance limitée n° VER-2026-118 délivrée par un organisme tiers accrédité le 15 mars 2026.
Exportations vers l'Union européenne : 35 % des volumes (ronds à béton et fil machine), soumis au mécanisme d'ajustement carbone aux frontières (CBAM) à partir de 2026.
Projet : remplacement des fours de réchauffage au gaz par l'induction et contrat d'achat d'électricité renouvelable (objectif : −45 % d'émissions en 2030).`;

export const ACCEPTABILITE_ACIERIE = `DÉCISION D'ACCEPTABILITÉ ENVIRONNEMENTALE (FICTIVE)
Comité régional unifié d'investissement de Tanger-Tétouan-Al Hoceïma — décision n° CRUI-TTA/EE/2026-031 du 4 février 2026.
Projet : extension de l'aciérie électrique et du laminoir — Aciéries du Détroit SA, zone industrielle de Tanger.
Conditions : traitement des fumées par filtre à manches (poussières < 10 mg/Nm3), recyclage de 90 % des eaux de refroidissement, gestion des laitiers et des poussières d'aciérie comme déchets dangereux, suivi trimestriel du bruit en limite de propriété.
Validité : 5 ans pour le démarrage des travaux.`;

export const PIECES_DEMO: Record<string, PieceDemo[]> = {
  DESAL: [
    {
      type: "EIES",
      nom: "EIES_Dessalement_Chtouka_provisoire.txt",
      texte: EIES_DESSALEMENT,
      analyse: {
        typeDetecte: "EIES",
        resume: "EIES provisoire d'une station de dessalement de 275 000 m3/j ; état initial et consultation publique incomplets.",
        champs: [
          present("eies_resume"),
          present("eies_description"),
          { code: "eies_etat_initial", etat: "partiel", precision: "Avifaune non inventoriée sur un cycle annuel (Parc national de Souss-Massa à 4 km) ; aucune mesure de bruit initiale.", citation: "l'inventaire de l'avifaune n'a pas été réalisé sur un cycle annuel complet" },
          present("eies_impacts"),
          present("eies_mesures"),
          { code: "eies_surveillance", etat: "partiel", precision: "Budget et responsabilités du suivi non précisés.", citation: "Budget et responsabilités à préciser dans le PGES." },
          { code: "eies_consultation", etat: "absent", precision: "Enquête publique de la loi 49-17 non organisée.", citation: "L'enquête publique prévue par la loi 49-17 n'a pas encore été organisée." },
          { code: "eies_auteur", etat: "partiel", precision: "Version provisoire non signée.", citation: "document non signé (version provisoire)" },
          present("eies_alternatives"),
        ],
        analyseLe: new Date().toISOString(),
        modele: "démonstration",
      },
    },
    {
      type: "PGES",
      nom: "PGES_Dessalement_Chtouka_extrait.txt",
      texte: PGES_DESSALEMENT,
      analyse: {
        typeDetecte: "PGES",
        resume: "Extrait de PGES : mesures et responsables identifiés, budget non chiffré.",
        champs: [present("pges_mesures"), present("pges_responsables"), present("pges_calendrier"), { code: "pges_budget", etat: "absent", precision: "Budget des mesures « à chiffrer ».", citation: "Budget : à chiffrer." }, present("pges_indicateurs")],
        analyseLe: new Date().toISOString(),
        modele: "démonstration",
      },
    },
  ],
  OLIV: [
    { type: "PRESENTATION", nom: "Note_presentation_oliveraie.txt", texte: PRESENTATION_OLIVERAIE },
    { type: "AUTORISATION", nom: "Autorisation_ABH_Sebou_prelevement.txt", texte: AUTORISATION_OLIVERAIE },
  ],
  ACIER: [
    { type: "AUTRE", nom: "Bilan_GES_2025_Acieries_du_Detroit.txt", texte: BILAN_CARBONE_ACIERIE },
    { type: "ACCEPTABILITE", nom: "Decision_acceptabilite_CRUI_TTA.txt", texte: ACCEPTABILITE_ACIERIE },
  ],
};
