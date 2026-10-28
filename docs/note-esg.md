# Note ESG — méthode (SGES-ESG-1.0, indicative)

## Objet

Une note unique qui qualifie la **qualité de la gestion environnementale, sociale et de
gouvernance** du client et de son projet : de 0 à 100 et de **A** (excellente) à **E**
(insuffisante). Elle complète, sans les remplacer :

- le **risque E&S résiduel** (plus il est élevé, plus le dossier est risqué) ;
- le **score climat** (risque physique et de transition) ;
- la **catégorie** A, B, C, FI (ampleur des impacts potentiels du projet).

La note ESG répond à une autre question : *le client maîtrise-t-il ses enjeux ?* Elle se calcule
**sans aucune saisie supplémentaire**, à partir de ce qui est déjà renseigné.

## Calcul

### Trois piliers (0 à 100)

| Pilier | Composantes | Poids dans le pilier |
|---|---|---|
| **E — Environnement** | Questions environnementales maîtrisées (effluents, déchets, air, produits dangereux, eau, biodiversité, GES) | 70 % |
| | Risque climatique : 100 − score climat | 30 % (`ESG_PART_CLIMAT`) |
| **S — Social** | Questions maîtrisées : santé-sécurité, urgences, conditions de travail, droits fondamentaux, communautés, foncier, patrimoine | 100 % |
| **G — Gouvernance** | Questions maîtrisées : politique et système de gestion E&S, EIES, autorisations, certifications, revue indépendante | 50 % |
| | Pièces du dossier (check-list ; les pièces obligatoires comptent double) | 20 % |
| | Engagement sur le plan d'actions | 20 % |
| | Transparence des données climat (couverture des données, qualité PCAF) | 10 % |

- **Questions maîtrisées** = 100 × Σ gravité des réponses qui ne signalent pas de risque /
  Σ gravité des réponses (gravité 1 à 4). « Sans objet » n'est pas compté.
- **Pièces** : complète = 1 ; déposée non analysée ou canevas = 0,75 (0,5 pour une pièce
  officielle remplacée par un canevas) ; incomplète = 0,5 ; manquante = 0.
- **Engagement** : à l'octroi, part des actions négociées que le client retient ; en suivi,
  avancement moyen des actions retenues (0 pour une action en retard, 100 pour une action réalisée).
- Une composante sans donnée (pas de volet climat, pas de plan) est ignorée et les poids restants
  sont recalculés.
- Le pilier de chaque question est celui de sa thématique, sauf précision dans
  *Paramétrage › Questionnaires E&S* (champ « Pilier ESG »).

### Note globale

**Note = 40 % E + 30 % S + 30 % G** (`ESG_PONDERATION`), puis lettre selon les seuils
`ESG_SEUILS_NOTES` : A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E en dessous.

### Garde-fous

| Situation | Effet |
|---|---|
| Projet sur la liste d'exclusion | Non noté |
| Aucune réponse notée | Pas de note |
| Moins de 60 % des questions notées ont une réponse (`ESG_COUVERTURE_MIN`) | Note **provisoire** (astérisque dans l'en-tête, message sur la fiche) |
| Un risque critique (gravité 4) non maîtrisé | Note plafonnée à **D** |
| En suivi, dernière visite non conforme | Note plafonnée à **C** |

## Deux moments

- **Note à l'octroi** : calculée pendant l'évaluation, **figée à la soumission** ; c'est celle que
  voit le comité.
- **Note actualisée** : recalculée à chaque enregistrement, y compris en suivi. Une action
  corrective **réalisée** lève le risque qu'elle traitait ; l'avancement du plan et la conformité
  de la dernière visite comptent. La fiche affiche les deux quand elles diffèrent.

## Où la trouver

- En-tête du dossier et liste des dossiers : pastille « ESG B · 71 » ;
- fiche d'évaluation E&S : section « Note ESG » (piliers, composantes, plafond, couverture) ;
  la fiche JSON et l'API `/api/v1/fiches` la transmettent à la plateforme d'octroi ;
- tableau de bord : répartition A à E et note moyenne ;
- reporting : colonnes « Note ESG », score et note à l'octroi dans les exports Excel et CSV ;
- écran « Cadre réglementaire » : rappel de la méthode.

## Paramètres

| Paramètre | Défaut | Rôle |
|---|---|---|
| `ESG_PONDERATION` | 40,30,30 | Poids E, S, G |
| `ESG_SEUILS_NOTES` | 80,65,50,35 | Seuils de A, B, C, D |
| `ESG_COUVERTURE_MIN` | 0,6 | Part minimale de réponses (sinon provisoire) |
| `ESG_PART_CLIMAT` | 0,3 | Part du climat dans le pilier E |

## Limites

Méthode **indicative et non calibrée** : à valider par le Responsable RSE et la Fonction Risques
(poids, seuils, rattachement des questions aux piliers) avant tout usage dans la décision de crédit
ou le reporting externe. Elle ne remplace ni l'analyse du chargé ni l'avis du comité.

## Base de données

Migration idempotente : `prisma/sql/migrations/2026-10-28-note-esg.sql` (appliquée sur Supabase).
Les dossiers existants reçoivent leur note au prochain enregistrement ; la note à l'octroi des
dossiers déjà soumis n'est pas reconstituée.
