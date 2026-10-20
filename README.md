# SGES — Système de Gestion Environnementale, Sociale et Climatique

Outil web d'évaluation et de suivi des risques **environnementaux, sociaux et climatiques** des
crédits d'investissement, pour un groupe bancaire et ses filiales. Il remplace l'application
SGES historique (Java/COBOL, 2016) et met le dispositif au niveau des normes internationales
et de la réglementation marocaine.

Conforme : circulaire **CFD-537/01-24**, procédure **CFD12340876/0217**, cahier des charges
SGES (intégration à la plateforme d'octroi) · Normes de performance **SFI** (NP1–NP8) et liste
d'exclusion · **Principes de l'Équateur IV** · conventions fondamentales **OIT** · loi **49-17**
(évaluation environnementale), Code du travail, lois 11-03, 36-15, 28-00, 13-03, 47-09, 22-07,
110-14 · **Bank Al-Maghrib, Directive n° 5/W/2021** (risques climatiques) · TCFD / ISSB S2 ·
**PCAF** (émissions financées) · **CBAM** (UE 2023/956).

## Ce que fait l'outil

Le parcours d'un dossier suit exactement la procédure (§3) :

| Étape | Ce que fait l'outil |
| --- | --- |
| 1. Identification | Signalétique importée par le compte courant 20 positions (connecteur système central), lieu, montants **en toute devise** convertis en devise de référence, **critères déclencheurs** calculés (catégorie A ou investissement > seuil paramétrable, seuil propre possible par filiale). |
| 2. Liste d'exclusion | Liste SFI + politique sectorielle du groupe ; critères bloquants ; **notification automatique du Responsable RSE**. |
| 3. Catégorisation | Formulaire des 25 éléments ; règle A > B > FI > C (préséance paramétrable) ; sous-catégories FI-1/2/3 ; reclassement motivé réservé au Responsable RSE ; notification catégorie A / changement de catégorie A. |
| 4. Risques E&S | Check-lists A, B, C, FI (≈60 questions, blocs 1 à 8, hygiène-sécurité, RH, NP SFI, climat) avec références normatives ; **score de risque résiduel** pondéré par la gravité ; synthèse par thématique (maîtrisé / non maîtrisé / non concerné) ; assistant IA facultatif pour pré-remplir à partir de l'EIES. |
| 5. Climat | Aléas physiques par région (7 aléas), sensibilité, adaptation ; risque de transition (secteur, facteurs, CBAM, taxonomie) ; **émissions financées PCAF** et qualité des données ; score climat. |
| 6. Plan d'actions | Actions correctives **générées automatiquement** (court / moyen / long terme) ; négociation (retenue, réserve du client, échéance, budget en devise) ; actions de l'EIE non négociables. |
| 7. Fiche & validation | **Fiche d'évaluation E&S** en 5 parties (+ climat), imprimable et servie en JSON ; contrôles bloquants avant soumission ; validation et **verrouillage** par le directeur avec **séparation des fonctions**. |
| 8. Décision du comité | Montant accordé ou motif de rejet E&S ; réserves du comité ajoutées au plan ; ajournement. |
| 9. Suivi | Avancement des actions avec historique, **visites de sites** (constats, conformité, prochaine visite), clôture. |

Et autour du dossier : tableau de bord « à traiter », **reporting SGES** par entité et période
(dossiers anciens sans décision, export Excel/CSV des données de la fiche), **vue portefeuille
climat**, plans d'actions et visites du portefeuille, notifications, journal d'audit,
cadre réglementaire, **API d'intégration** pour la plateforme d'octroi de crédit.

## Points forts

- **Multi-bases de données** : PostgreSQL (défaut), **SQL Server**, **MySQL/MariaDB**, **SQLite** —
  même schéma, une commande pour changer de moteur, sauvegarde JSON portable d'un moteur à
  l'autre (testée PostgreSQL → SQLite). Voir [docs/bases-de-donnees.md](docs/bases-de-donnees.md).
- **Multi-langues** : français, anglais, **arabe (droite à gauche)** pour toute l'interface ; libellés
  de **tous les référentiels** traduisibles depuis l'écran ; nouvelles langues ajoutables.
- **Multi-devises** : MAD, EUR, USD, XOF, XAF, GBP, CHF… ; cours datés ; montant du dossier figé
  au cours du jour ; affichage des tableaux de bord dans la devise choisie par l'utilisateur.
- **Multi-entités** : groupe › banques › banques régionales › filiales › centres d'affaires, avec
  cloisonnement des données (une filiale ne voit ni sa mère ni ses sœurs), habillage par entité
  (nom, logo, couleur), devise, langue et seuil propres.
- **Très paramétrable**, sans développement : paramètres généraux, rôles et matrice des permissions,
  questionnaires (thématiques, blocs, questions, gravité, réponses à risque, actions types, secteurs
  ciblés), liste d'exclusion, formulaire de catégorisation, secteurs (profil E&S/climat, facteurs
  d'émission), régions et aléas, devises et cours, langues, listes de valeurs, clés d'API.
- **Sécurité** : session en cookie httpOnly signé, verrouillage après échecs, mots de passe
  provisoires, permissions par rôle, contrôle du périmètre sur chaque objet (OWASP API1),
  contrôle d'origine des requêtes, journal d'audit, en-têtes de sécurité.

## Technologies

Identiques à l'outil de scoring Project Finance, en plus récent : **Next.js 15** (App Router),
**React 19**, **TypeScript** strict, **Tailwind CSS 4** (design « Clarté institutionnelle » de
l'outil PF), Radix UI, **Prisma 5**, Zod 4, jose (JWT), ExcelJS, unpdf, SDK Anthropic (assistant
facultatif), Jest.

## Démarrage

```bash
npm install
cp .env.example .env                 # DATABASE_URL, JWT_SECRET
npm run db:schema                    # création des tables
npm run db:seed -- --demo            # référentiels + comptes et dossiers de démonstration
npm run dev                          # http://localhost:3000
```

Sans `--demo`, seul un administrateur est créé ; son mot de passe provisoire s'affiche une fois.

### Comptes de démonstration (mot de passe `Demo!Sges2026`)

| Compte | Rôle | Entité |
| --- | --- | --- |
| `admin.demo@sges.local` | Administrateur système | toute la plateforme |
| `rse@sges.local` | Responsable Social et Environnemental | Groupe |
| `charge.casa@sges.local` | Chargé d'affaires | Centre d'affaires Casablanca Anfa |
| `directeur.casa@sges.local` | Directeur centre d'affaires | Centre d'affaires Casablanca Anfa |
| `charge.settat@sges.local` | Chargé d'affaires | BP Casablanca-Settat |
| `directeur.bprcs@sges.local` | Directeur (portée groupe) | BP Casablanca-Settat |
| `risques@sges.local` | Fonction Risques Groupe | Groupe |
| `comite@sges.local` | Comité de crédit | BCP |
| `audit@sges.local` | Contrôle / Audit | Groupe |
| `charge.ci@sges.local` | Chargé d'affaires | Filiale Côte d'Ivoire (XOF) |
| `analyst.en@sges.local` | Analyst (English) | Banque de Financement |

Le jeu de démonstration contient 8 dossiers à tous les stades (A, B, C, FI ; EUR, XOF, MAD).
**Ne pas utiliser `--demo` en production.**

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` / `build` / `start` | Développement, compilation, production |
| `npm run type-check` / `lint` / `test` | Contrôles (53 tests unitaires) |
| `npm run db:fournisseur -- sqlserver` | Bascule le schéma vers un autre moteur |
| `npm run db:schema` | Crée / met à jour les tables |
| `npm run db:seed [-- --demo] [--forcer]` | Référentiels et comptes |
| `npm run db:exporter` / `db:importer` | Sauvegarde / reprise JSON portable |
| `npm run db:verifier` | Contrôle d'une base avant branchement |

## Documentation

- [Bases de données](docs/bases-de-donnees.md) — moteurs, bascule, reprise
- [Méthodologie](docs/methodologie.md) — règles de déclenchement, catégorisation, scores
- [API d'intégration](docs/api-integration.md) — plateforme d'octroi de crédit
- [Déploiement](docs/deploiement.md) — Vercel, serveur, Docker
- [Guide utilisateur](docs/guide-utilisateur.md) — parcours par rôle
