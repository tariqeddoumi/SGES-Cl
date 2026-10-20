# Méthodologie

Toutes les règles ci-dessous sont dans `lib/domaine/` (fonctions pures, testées) et partagées
par le serveur et l'interface : le calcul affiché pendant la saisie est celui qui est enregistré.

## Déclenchement (circulaire CFD-537/01-24, chapitre II)

Évaluation **obligatoire** si :

1. le projet est de **catégorie A** (ou un élément 1 à 11 du formulaire est positif), quels que
   soient la taille de l'entreprise, le montant et le secteur ;
2. sinon, le **montant d'investissement** converti en devise de référence dépasse le **seuil**
   (`SEUIL_DECLENCHEMENT`, 10 000 000 MAD par défaut ; une entité peut avoir son propre seuil,
   dans sa devise — hérité par ses filiales). À défaut de montant d'investissement, le montant
   demandé est comparé.

Les types de crédit marqués « hors investissement » (liste de valeurs `type_credit`, champ
`extra.investissement = false`) sont hors périmètre.

## Catégorisation (procédure §3.3)

25 éléments : 1–11 → A, 12–23 → B, 24 → C, 25 → FI.

- A si un élément A est positif (même formulaire incomplet) ;
- sinon, formulaire complet requis ; la catégorie positive la plus significative prévaut selon
  `PRESEANCE_CATEGORIES` (`A,B,FI,C`) ;
- FI : sous-catégorie FI-1 / FI-2 / FI-3 obligatoire ;
- le Responsable RSE (`dossier:reclassifier`) peut retenir une autre catégorie, avec justification
  journalisée et notifiée ;
- catégorie A : EIES exigée (pièce jointe obligatoire avant soumission si
  `EIE_OBLIGATOIRE_CATEGORIE_A`).

## Risque E&S résiduel

Chaque question porte la (les) réponse(s) signalant un risque **non maîtrisé** (« non » à une
mesure de contrôle ; « oui » à une nuisance ; seuil numérique `>30`, `<=2,5`…) et une gravité 1–4.

    score = 100 × Σ gravité des réponses à risque / Σ gravité des questions évaluatives répondues

Les « sans objet » et les questions descriptives ne comptent pas. Niveaux selon
`SEUILS_NIVEAU_RISQUE` (15 / 35 / 60) : faible, modéré, élevé, critique. Catégorie A : un cran
de plus (`RELEVER_NIVEAU_CATEGORIE_A`) ; un risque de gravité 4 non maîtrisé impose au moins
« élevé ».

Sur la fiche, une thématique est : **maîtrisée** (concernée, aucun risque non maîtrisé),
**non maîtrisée** (au moins un, donc un plan d'actions) ou **non concernée**.

## Plan d'actions (procédure §3.5, §3.7)

Chaque réponse à risque génère les actions types de la question (horizon, délai → échéance
indicative). Les propositions devenues sans objet et jamais négociées sont retirées ; les actions
négociées ou suivies sont conservées. Actions de l'EIE : non négociables, retenues d'office.
Réserves du comité : ajoutées au plan à la décision.

## Climat

Échelles 0–4. Aléas : stress hydrique, sécheresse, inondation, chaleur extrême, submersion
marine, incendie, séisme (repris de la région, ajustables).

    exposition   = 0,6 × aléa max + 0,4 × moyenne des 3 principaux
    physique     = exposition × (0,5 + sensibilité/8) × (1 − 0,1 × adaptation) → /100
    transition   = (0,5 × risque secteur + 0,5 × moyenne des facteurs + CBAM) × alignement → /100
                   CBAM : +0,5 (+1 si export UE ≥ 10 %) ; vert × 0,5 ; transition × 0,75
    score climat = 0,6 × risque dominant + 0,4 × l'autre
    niveaux      : < 25 faible, < 50 modéré, < 75 élevé, sinon très élevé

Émissions (tCO2e/an) : déclarées (scopes 1+2+3) ou estimées par facteur sectoriel
(tCO2e par M MAD investi, PCAF score 5). **Émissions financées** = émissions × montant financé /
investissement total (attribution PCAF « financement de projet », bornée à 1).

Les aléas régionaux et facteurs sectoriels livrés sont **indicatifs** et doivent être calibrés
par la fonction Développement durable (Paramétrage › Régions, Secteurs).

## Circuit et séparation des fonctions

`brouillon → soumis → valide (verrouillé) → decide → en_suivi → cloture` (+ retour, annulation,
ajournement, réouverture). La soumission exige : identification complète, liste d'exclusion
répondue sans critère bloquant, catégorie, questionnaire complet et commentaire, volet climat
(si obligatoire), chaque action négociée, EIES en catégorie A. Le validateur doit être différent
du chargé (`SEPARATION_FONCTIONS`). Chaque transition est historisée et journalisée.
