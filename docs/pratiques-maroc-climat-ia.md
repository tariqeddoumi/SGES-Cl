# Évolutions du 26/10/2026 — pratiques bancaires marocaines, volet climat, IA, données de démonstration

Migration d'une base existante : `prisma/sql/migrations/2026-10-26-pratiques-maroc-climat.sql`.

## 1. Pratiques des banques au Maroc
| Pratique | Ce que fait l'outil |
|---|---|
| **Clauses E&S du contrat de crédit** (covenants exigés par les lignes AFD, BERD, BEI, SFI) | Générées depuis le dossier dans la fiche, à l'impression et dans l'API de la plateforme d'octroi : conditions préalables (acceptabilité loi 49-17, EIES, autorisations, plan signé, réserves du comité, conditions de dérogation), engagements (conformité réglementaire marocaine et SFI, exclusion, actions datées du plan, incidents sous 5 jours, visites, plan climat, CBAM, ligne de bailleur), reporting (annuel ou semestriel, émissions), cas de défaut. À valider par la direction juridique. `lib/domaine/clauses.ts` |
| **Lignes de financement vert** | Champ « ligne de financement / refinancement » (SUNREF/AFD, MorSEFF, GEFF, Green Value Chain/BERD, BEI, SFI, obligation verte, fonds propres), paramétrable ; repris dans les clauses et le reporting. |
| **Reporting BAM 5/W/2021** | Export Excel du portefeuille (page Climat) : par dossier (aléas retenus, couverture, scores, scénarios, CBAM, émissions financées, base PCAF, qualité), puis agrégats pondérés par l'exposition par région, secteur et ligne de financement ; dossiers à données insuffisantes listés. |

## 2. Volet climat — revérification
- **Aléas régionaux recalés** sur les événements récents : Al Hoceïma et Al Haouz (séisme 4), Agadir (chaleur 4, séisme 3), Larache / Rif (incendie 4), plaine du Gharb (inondation 4), Guelmim et Drâa-Tafilalet (crues), pénurie d'eau de Casablanca-Settat, Fès-Meknès et Béni Mellal (stress hydrique 4), lagune de Dakhla (submersion 3).
- **Sensibilité** initialisée sur le profil physique du secteur (au lieu de 1 par défaut).
- **Scénarios** (analyse de sensibilité demandée par la directive) : risque physique 2050 intermédiaire (SSP2-4.5) et défavorable (SSP5-8.5) ; coût annuel du carbone 2030 par scénario NGFS (politiques actuelles, sous 2 °C, zéro net 2050) et coût CBAM, rapportés à l'**EBE** (nouvelle saisie), avec alerte au-delà de 10 %.
- **CBAM corrigé** : seules les émissions directes (scope 1) des produits sont couvertes pour l'acier, l'aluminium et l'hydrogène, et seule la part des quotas gratuits déjà supprimée est payée : 48,5 % en 2030, puis 100 % en 2034 (`CLIMAT_CBAM_FACTEUR`).
- Exposition du portefeuille = base PCAF du dossier (encours, accordé ou demandé).
- Paramètres : `CLIMAT_PRIX_CARBONE` (100 / 850 / 1 700 MAD/tCO2e), `CLIMAT_PRIX_ETS` (850), `CLIMAT_CBAM_FACTEUR` (0,485), `CLIMAT_SEUIL_EBE` (10 %).

## 3. IA — nouvelles fonctions (Assistant IA › Rédaction et contrôle)
| Fonction | Résultat |
|---|---|
| Rédiger le commentaire d'évaluation | Les cinq rubriques du canevas, reprises dans l'étape Risques E&S (non enregistrées). |
| Contrôle de cohérence avant soumission | Alertes classées (bloquant, majeur, mineur) par étape, avec recommandation. |
| Note de synthèse pour le comité | Une page : projet, catégorie, risques, climat, plan, avis et conditions. |
| Clauses E&S du contrat | Clauses types adaptées au projet + remarques pour la direction juridique. |

Garde-fous : activation et référence de validation obligatoires, données du client remplacées par des repères ([CLIENT], [COMPTE], [CHARGE]…) puis masquage des identifiants, journalisation de chaque appel, rien n'est enregistré sans relecture.

## 4. Données de démonstration (fictives)
Sept nouveaux dossiers et quatre comptes (Souss-Massa, Rabat-Salé-Kénitra) :
| Dossier | Ce qu'il illustre |
|---|---|
| Dessalement Chtouka (Souss-Massa, cat. A, ligne BEI) | EIES provisoire et PGES déjà analysés : check-list « incomplète » avec les informations manquantes ; base pour l'IA. |
| Domaines Oléicoles du Saïss (cat. B, GEFF) | Stress hydrique 4, autorisation ABH de prélèvement ; dossier soumis. |
| Aciéries du Détroit (Tanger, cat. A, CBAM 35 %) | Émissions vérifiées (PCAF 1), coût carbone > 400 % de l'EBE en zéro net 2050 : alerte de transition, clauses climat et CBAM. |
| Tamuda Bay Résidences (littoral, cat. B) | Submersion et incendie, en suivi avec encours. |
| Valoris Fès Énergie (biogaz, SUNREF, vert) | Accordé, base PCAF = encours. |
| Comptoir des Bois Exotiques | Inscription sur la liste d'exclusion (bois non certifiés). |
| Frigo Transports du Sud (Laâyoune, MorSEFF) | Données climat inconnues : « données insuffisantes ». |

Les comptes de démonstration utilisent le mot de passe `Demo!Sges2026`. Les nouveaux comptes sont charge.agadir, directeur.sm, charge.kenitra et directeur.rsk (@sges.local).
