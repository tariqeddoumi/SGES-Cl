# Questionnaire paramétrable, listes et simplifications — 26/10/2026

## 1. Questionnaire paramétrable (sans effet par défaut)

Chaque question porte désormais :

- un **niveau d'exigence** : réglementaire (droit marocain), interne / BAM, SFI / Équateur,
  bonne pratique ;
- un **module d'activité** facultatif qui la déclenche (rejets liquides, émissions, produits
  dangereux, communautés, biodiversité, GES, riverains, eau, main-d'œuvre, terres collectives,
  effectif ≥ 10 ou ≥ 50, Principes de l'Équateur).

Le niveau du questionnaire se règle par catégorie dans *Paramétrage › Paramètres généraux* :

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `QUESTIONNAIRE_NIVEAU_B` | minimum, standard, complet | **complet** |
| `QUESTIONNAIRE_NIVEAU_C` | minimum, standard, complet | **complet** |
| `LIGNES_EXIGENCES_SFI` | lignes de financement (choix multiple) | SUNREF, MorSEFF, GEFF, GVC, BEI, SFI |
| `QUESTION_EFFECTIF` | code de la question donnant l'effectif | SIG01 |

- **minimum** : questions réglementaires et internes, selon les modules retenus ;
- **standard** : minimum + normes SFI / Équateur, selon les modules retenus ;
- **complet** : toutes les questions de la catégorie (comportement actuel).

Tant que les deux paramètres restent à « complet », **rien ne change** : le nombre de questions
reste celui d'aujourd'hui. Le marquage livré (annexe 2 de la proposition Word) est à valider par
le Responsable RSE et la Conformité avant de passer un niveau à « minimum » ou « standard ».

### Garde-fous

- Catégorie A et intermédiaires financiers : toujours complets.
- Ligne de financement listée dans `LIGNES_EXIGENCES_SFI` ou case « Principes de l'Équateur
  applicables » cochée (identification) : au moins « standard ».
- Le Responsable RSE peut **imposer le questionnaire complet** sur un dossier (écran Risques E&S) ;
  l'acte est journalisé et apparaît dans l'historique.
- Donnée inconnue (secteur, zone, effectif, stress hydrique) : le module est retenu par prudence.
- Le niveau et les modules sont **figés à la soumission** ; la fiche E&S indique le niveau
  appliqué et le nombre de questions posées.

### Administration

- *Paramétrage › Modules d'activité du questionnaire* : secteurs, types de zone et natures de
  projet en choix multiple, effectif minimal, stress hydrique minimal, Principes de l'Équateur.
  Un code de section (une lettre, « C ») couvre ses divisions ; les autres codes sont exacts.
- *Paramétrage › Questionnaires E&S* : niveau d'exigence, module et secteurs ciblés (choix
  multiple) de chaque question.

## 2. Listes déroulantes et catalogues

Onze nouvelles listes, modifiables dans *Paramétrage › Listes de valeurs* (fr / en / ar). Les champs
gardent la saisie libre : la liste propose, elle n'impose pas.

| Liste | Utilisée dans |
|---|---|
| Villes et localités (avec leur région) | localité du projet, ville du client |
| Pays | pays du client et des entités (liste déroulante) |
| Fonctions côté client | responsable d'une action, participants à une visite |
| Fonctions de la banque | fonction d'un utilisateur |
| Sources des émissions | volet climat |
| Mesures d'adaptation types | volet climat |
| Motifs types (liste d'exclusion) | motif de l'exclusion |
| Motifs types de reclassement | justification du reclassement |
| Réserves types du comité | décision du comité |
| Constats et recommandations types | visites de site |

Les textes longs proposent un menu « + Ajouter un élément type » qui insère la ligne choisie ;
le texte reste modifiable.

## 3. Simplifications

- Choisir une ville de la liste renseigne **automatiquement la région** du projet.
- Une nouvelle évaluation reprend le **secteur et la ville du client** (et donc la région).
- Les options rares de l'identification (ligne de financement, développement durable, Principes de
  l'Équateur) sont regroupées dans un bloc repliable, ouvert dès qu'une option est renseignée.
- Catégorisation : bouton « Répondre « Non » aux éléments sans réponse ».

## 4. Base de données

Migration idempotente : `prisma/sql/migrations/2026-10-26-questionnaire-listes.sql` (appliquée sur
Supabase, schéma `sges`). Script complet régénéré : `prisma/sql/supabase-schema-sges.sql`.

## 5. Recette

- 107 tests unitaires (dont 8 sur les niveaux et modules) ;
- 17 contrôles navigateur des nouveautés (modules, paramètres, bandeau, décision RSE, fiche,
  ville → région, éléments types) ;
- dossier complet de la création à la clôture, 20 chemins alternatifs du circuit ;
- 612 pages parcourues (10 profils, 3 langues, mobile) : aucune anomalie.
