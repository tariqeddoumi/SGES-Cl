# Corrections des constats P1 (audit du 23/10/2026)

Migration d'une base existante : `prisma/sql/migrations/2026-10-25-constats-p1.sql`
(appliquée sur Supabase, schéma `sges`, le 25/10/2026). Nouvelle installation : `prisma/sql/supabase-schema-sges.sql`.

| Constat | Correction | Où |
|---|---|---|
| **F05** inconnu = 0 | Aléas et facteurs de transition à trois états : valeur 0–4, **inconnu** (`?`), **non applicable** (`NA`). L'inconnu est exclu du calcul ; couverture des données affichée et enregistrée ; sous `CLIMAT_COUVERTURE_MIN` (0,75) : pas de score global, niveau « données insuffisantes », soumission refusée si le climat est obligatoire. | `lib/domaine/climat.ts::evaluerClimat`, `EchelleEtendue`, `volet-climat.tsx` |
| **F06** émissions sur le montant demandé | Base d'attribution PCAF explicite : encours à date (saisi au suivi), sinon montant accordé, sinon demandé ; date d'arrêté ; la décision recalcule. Demandé / accordé / encours restent tracés. | `baseAttribution`, `api/dossiers/[id]/encours`, `volet-suivi.tsx` |
| **F07** qualité PCAF sans justification | Qualité **déduite** (plus saisie) : 1 vérifiée par un tiers, 2 déclarée, 3 activité, 5 secteur ou sans source ; source des émissions obligatoire hors estimation sectorielle ; « vérifiée » réservé aux émissions déclarées. | `qualitePCAF`, `api/dossiers/[id]/climat` |
| **F08** pondérations non calibrées | Pondération et seuils paramétrables (`CLIMAT_PONDERATION`, `CLIMAT_SEUILS_NIVEAUX`), version de méthode enregistrée et affichée (« score indicatif »), note méthodologique et plan de validation. | `docs/methodologie-climat.md` |
| **F09** cours postérieur / ancien | Seul un cours publié **au plus tard** à la date du dossier est admis ; validité maximale `COURS_VALIDITE_JOURS` ; sinon conversion **bloquée** (aucune écriture). Le cours retenu est figé avec sa devise, sa date et sa source. | `lib/devises.ts::coursRetenu`, `versReference`, `PATCH /api/dossiers/[id]` |
| **F10** montants en Float | Montants `DECIMAL(20,2)` et cours `DECIMAL(24,10)` en base (PostgreSQL, SQL Server, MySQL ; Decimal Prisma sur SQLite) ; arrondi explicite à la précision ISO de la devise (`arrondirMontant`) avant stockage ou comparaison au seuil. | `schema.prisma`, `lib/serveur/prisma.ts`, `lib/devises.ts` |
| **F11** évaluation non reproductible | Empreinte du référentiel (questionnaire, catégorisation, exclusion, paramètres de calcul) enregistrée sur le dossier ; après soumission, catégorie, risque et scores climat sont **figés** (seule la base PCAF suit l'encours) ; instantanés P0 à la soumission, validation, décision. | `referentiel-version.ts`, `recalculer` |
| **F12** API renvoie les brouillons | Fiche restituée **uniquement si validée** ; sinon HTTP 409 `evaluation_non_disponible` sans données. Réponse : état, version et empreinte de l'instantané, date de validation, signature HMAC `X-SGES-Signature`. | `app/api/v1/fiches/[reference]` |
| **F13** exclusion systématiquement bloquante | Nature de chaque critère (interdiction légale > exclusion bailleur > restriction sectorielle > politique groupe) et caractère dérogeable ; **dérogation motivée** du Responsable RSE (permission `exclusion:deroger`), journalisée en transaction, impossible pour une interdiction légale. Matrice proposée à faire approuver. | `lib/domaine/exclusion.ts`, `exclusion/derogation` |
| **F14** signalétique simulée par défaut | Simulation **refusée en production** (lecture et paramétrage), sauf recette explicite `SIGNALETIQUE_SIMULATION_AUTORISEE=true` ; pannes du connecteur journalisées et signalées (plus confondues avec « client inconnu »). | `lib/serveur/signaletique.ts` |
| **F15** IA et confidentialité | Activation subordonnée à `IA_REFERENCE_VALIDATION` (référence de la validation juridique / CNDP / SSI) ; désactivée par défaut ; masquage des identifiants ; passerelle approuvée possible (`ANTHROPIC_BASE_URL`). | `parametres`, `api/dossiers/[id]/ia` |

## Recette (base PostgreSQL locale, build de production)
22 contrôles automatisés, dont les jeux de recette 5 (demandé 20 M, accordé 8 M, encours 5 M → base encours, trois valeurs tracées),
6 (aléa inconnu jamais assimilé à 0) et 7 (cours postérieur jamais appliqué) ; non-régression P0 rejouée.

## Points ouverts
- Matrice nature / dérogation des critères d'exclusion à faire approuver (Risques, RSE, Juridique).
- Méthode climat à calibrer et valider (voir le plan de validation) ; scénarios NGFS non intégrés.
- Import de cours BAM datés et sourcés (aujourd'hui saisie ou import manuel) ; fixer `COURS_VALIDITE_JOURS`.
- Versions de questionnaire publiées avec date d'effet (aujourd'hui : empreinte + gel à la soumission).
