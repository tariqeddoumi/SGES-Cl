# Diagnostic d'ergonomie et d'automatisation — 11/11/2026

Objectif : un outil plus simple, plus rapide, avec moins d'étapes, où **le document précède la saisie**.
Méthode : relecture du parcours du chargé d'affaires (création → soumission), du code des écrans et des
routes, recette navigateur sur la base de démonstration (français, arabe).

## 1. Constat sur le parcours avant changement

| # | Constat | Effet pour le chargé |
|---|---|---|
| D1 | La lecture automatique des pièces ne traitait que le texte : **scans et photos ignorés** (« non extractible ») | Les autorisations, attestations et bordereaux, souvent scannés, étaient ressaisis à la main |
| D2 | Les propositions de l'assistant vivaient dans une fenêtre et **disparaissaient au rechargement** de la page | Il fallait tout reprendre en une fois, sans pouvoir y revenir |
| D3 | Aucune indication de **où trouver** une information | Le chargé ne savait pas quel document demander au client pour une question donnée |
| D4 | Dépôt **un fichier à la fois**, type à choisir **avant** le dépôt | 3 gestes par pièce ; erreurs de type fréquentes |
| D5 | Lecture des pièces **manuelle**, uniquement depuis l'onglet Pièces ou une fenêtre | Fonction peu découverte |
| D6 | Le **volet climat** n'était pas pré-rempli (émissions, part renouvelable, CBAM, adaptation) | Saisie la plus technique, entièrement manuelle |
| D7 | Liste des types de pièces limitée aux pièces de procédure (EIES, PGES, autorisations…) | Pas de place pour les preuves usuelles (CNSS, analyses, bilan carbone, assurance…) |
| D8 | Avertissement technique au chargement de chaque page (cours de change transmis avec des propriétés non sérialisables) | Indicateur d'erreurs en développement, bruit dans les journaux |

## 2. Ce qui a été réalisé

| Constat | Réalisation |
|---|---|
| D1 | **OCR intelligent** : transcription des PDF scannés et des photos (PNG, JPEG, WebP) au dépôt, reconnaissance du type de pièce ; relecture d'une pièce à la demande ; les pièces non lues sont transcrites avant chaque lecture |
| D2 | Propositions **conservées sur le dossier** (`propositionsOCR`), affichées **sous chaque champ** concerné avec document source et citation ; « Reprendre », « Reprendre les N propositions », « Écarter » (mémorisé) |
| D3 | **Carte des sources** (`lib/domaine/sources.ts`) : chaque information (55 questions, identification, exclusion, catégorisation, climat) est reliée aux documents qui la contiennent et aux constats de visite ; « Où trouver l'information » sous chaque champ vide, avec dépôt en un clic |
| D3 | **Documents utiles** en tête d'étape, classés par nombre de réponses qu'ils apportent (« Rapports d'analyses — 4 réponses ») |
| D4 | Dépôt **multiple** et **glisser-déposer** sur toute la page du dossier ; type facultatif (reconnu par l'OCR) |
| D5 | **Lecture automatique** après dépôt (`OCR_LECTURE_AUTO`) ; bouton « Lire les documents » dès qu'une pièce n'a pas été lue |
| D6 | Propositions du **volet climat** : scopes 1, 2, 3, source, part renouvelable, émissions évitées, CBAM, part exportée vers l'UE, mesures d'adaptation ; la méthode passe en « déclarée » quand les émissions viennent d'un document |
| D7 | **11 types de pièces** ajoutés (fr / en / ar), migration Supabase appliquée |
| D8 | Cours de change convertis en objets simples avant transmission |
| — | « Assistant IA » renommé **« OCR intelligent »** dans toute l'interface (trois langues) et le paramétrage |

Gain attendu sur un dossier de catégorie B avec EIES et autorisations : la plupart des réponses de
l'identification, une grande partie du questionnaire et l'essentiel du volet climat arrivent pré-remplies ;
le chargé relit et complète. Le gain réel est à mesurer pendant le pilote (temps de saisie, part des
réponses reprises, part des propositions écartées).

## 3. Recette

- 127 tests automatisés (dont 9 nouveaux : carte des sources, propositions, circuit OCR avec modèle simulé) ;
- contrôle de type et lint sans erreur ;
- navigateur : bandeau « documents utiles », propositions en ligne (identification, questionnaire, climat),
  « Reprendre » remplit et active « Enregistrer », « Écarter » est mémorisé après rechargement,
  « Où trouver l'information » sous les champs vides, affichage arabe (droite à gauche), aucune erreur console.
- Non testé ici : l'appel réel au modèle (pas de clé d'API dans l'environnement de recette). À faire en
  pré-production avec des pièces réelles anonymisées.

## 4. Propositions pour la suite (non réalisées)

Classées par gain / effort.

| Priorité | Proposition | Gain |
|---|---|---|
| 1 | **Paramétrer la carte des sources** par question (champ « Documents sources » dans Paramétrage › Questionnaires) | Le RSE ajuste sans développement |
| 1 | **Lettre de demande de pièces** générée à partir des documents utiles manquants (PDF / e-mail au client, en français ou arabe) | Une demande unique et complète au client |
| 1 | **Pièces du client réutilisées** d'un dossier à l'autre (statuts, CNSS, politique E&S, certificats) avec date de validité | Moins de demandes au client pour un renouvellement |
| 2 | **Contrôle des dates de validité** lues par l'OCR (autorisation expirée, attestation d'assurance échue) avec alerte et action proposée | Détection automatique des non-conformités |
| 2 | **Contrôle croisé** document / déclaration (effectif CNSS vs effectif déclaré, montant de l'investissement vs note de présentation) | Repère les incohérences avant le directeur |
| 2 | **Pré-catégorisation dès la création** : lecture de la note de présentation → secteur, catégorie indicative, déclenchement | Moins d'étapes avant le questionnaire |
| 2 | **Photos de visite** lues par l'OCR (étiquettes, extincteurs, aire de stockage) pour proposer constats et conformité | Rapport de visite plus rapide |
| 3 | **Suivi des actions** : lecture des preuves de réalisation déposées (facture, rapport) et proposition de passage à « réalisée » | Note ESG actualisée sans saisie |
| 3 | **Mode hors connexion** (application mobile) pour les visites, synchronisé ensuite | Zones sans réseau |
| 3 | **Import du dossier Excel** (outil Excel SGES) dans l'outil web | Pas de double saisie après une visite |

## 5. Points de vigilance

- **Confidentialité** : les scans et photos sont transmis au service tels quels. La validation juridique / CNDP /
  SSI doit couvrir ce cas ; sinon, désactiver `OCR_SCANS` (seul le texte, masqué, est alors transmis).
- **Responsabilité** : une proposition peut être fausse ; elle n'est jamais enregistrée sans action du chargé,
  et le directeur valide.
- **Coût** : la lecture automatique après chaque dépôt multiplie les appels ; désactiver `OCR_LECTURE_AUTO`
  pour lire en une fois après avoir déposé toutes les pièces.
