# Méthodologie du volet climat — version SGES-CLIMAT-1.1 (indicative, non calibrée)

> Statut : **méthode indicative**. Les pondérations et majorations sont des hypothèses d'expert,
> paramétrables, non encore calibrées ni validées indépendamment (constat F08 de l'audit). Le score
> ne doit pas être présenté comme une mesure validée du risque.

## 1. Entrées
| Donnée | Échelle | Inconnu | Non applicable |
|---|---|---|---|
| 7 aléas physiques (stress hydrique, sécheresse, inondation, chaleur extrême, submersion, feux, séisme) | 0–4, repris de la région puis ajustés | `?` (null) | `NA` |
| Sensibilité de l'activité, capacité d'adaptation | 0–4 | — | — |
| 4 facteurs de transition (réglementaire, technologique, marché, réputation) | 0–4 | `?` | `NA` |
| Risque de transition du secteur | 0–4 (référentiel secteurs) | — | — |
| CBAM (exposition, part exportée vers l'UE), alignement taxonomique | — | — | — |

Une donnée **inconnue n'est jamais assimilée à 0** (constat F05) : elle est exclue du calcul et réduit
la **couverture** (part des 11 données renseignées, NA compris). Sous `CLIMAT_COUVERTURE_MIN` (0,75
par défaut), aucun score global n'est produit (niveau « données insuffisantes ») et la soumission est
refusée si le volet climat est obligatoire.

## 2. Calcul
- **Risque physique** = 100 × exposition × vulnérabilité × atténuation / 4, avec exposition =
  0,6 × aléa max + 0,4 × moyenne des trois aléas connus les plus élevés ; vulnérabilité = 0,5 +
  sensibilité / 8 ; atténuation = 1 − 0,1 × capacité d'adaptation.
- **Risque de transition** = 100 × (0,5 × risque secteur + 0,5 × moyenne des facteurs connus
  [+ 0,5 ou + 1 si CBAM, selon la part exportée ≥ 10 %]) × réduction taxonomique (vert × 0,5 ;
  transition × 0,75) / 4.
- **Score climat** = pondération du risque dominant et de l'autre (`CLIMAT_PONDERATION`, 0,6 / 0,4).
- **Niveaux** : seuils `CLIMAT_SEUILS_NIVEAUX` (25 / 50 / 75).

La version de la méthode est enregistrée avec chaque évaluation (`methodeVersion`) ; les paramètres
de calcul et le résultat sont figés dans l'instantané de soumission / validation / décision.

## 3. Émissions financées (PCAF, financement de projet)
- Émissions du projet : déclarées (scopes 1 à 3), estimées par l'activité, ou estimation sectorielle
  par million investi.
- **Facteur d'attribution** = montant attribué / financement total du projet, borné à 1, avec une
  **base explicite** (constat F06) : **encours à date** s'il est saisi au suivi, sinon **montant
  accordé** après décision favorable, sinon **montant demandé** (avant décision). Les trois montants
  et la date d'arrêté restent tracés.
- **Qualité des données PCAF déduite des preuves**, jamais saisie (constat F07) : 1 = déclarées et
  vérifiées par un tiers (attestation référencée) ; 2 = déclarées non vérifiées (rapport référencé) ;
  3 = estimées par l'activité physique ; 5 = estimation sectorielle, ou toute déclaration sans source.

## 4. Limites connues
- Pas encore de scénarios à horizon (NGFS : ordonné, désordonné, hot-house) ni de stress-test.
- Pas de géolocalisation fine des aléas (niveau régional, ajusté manuellement).
- Facteurs d'émission sectoriels indicatifs ; classes d'actifs PCAF autres que le financement de
  projet non distinguées.

## 5. Plan de validation proposé
1. Revue par la fonction Risques / RSE des pondérations et seuils, approbation formelle de la version.
2. **Champion / challenger** : comparaison avec une méthode alternative (grille experte, fournisseur
   de données climatiques) sur un échantillon de dossiers réels anonymisés.
3. **Backtesting / proxys** : confrontation des scores aux sinistres et aux pertes observés (inondations,
   sécheresses, arrêts d'activité) dès que l'historique le permet.
4. **Scénarios BAM / NGFS** : intégration d'horizons 2030 / 2050 et sensibilité au prix du carbone.
5. Revue annuelle, versionnement (`METHODE_CLIMAT_VERSION`) et traçabilité des changements.
