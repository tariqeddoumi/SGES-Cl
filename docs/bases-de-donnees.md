# Bases de données

L'outil fonctionne sur **PostgreSQL 14+** (défaut), **Microsoft SQL Server 2017+**,
**MySQL 8 / MariaDB 10.6+** et **SQLite** (poste local, démonstration, formation).

## Pourquoi c'est possible

`prisma/schema.prisma` est écrit pour rester portable :

- aucune énumération SQL : les codes (statuts, catégories…) sont contrôlés par l'application
  (`lib/domaine/constantes.ts`) ;
- aucun type JSON natif : les structures sont sérialisées en texte ;
- textes longs annotés `@db.Text`, traduits en `NVarChar(Max)` pour SQL Server (Unicode,
  indispensable pour l'arabe) et retirés pour SQLite ;
- toutes les relations en `onUpdate: NoAction` (SQL Server refuse les chemins de cascade
  multiples) ; seules les dépendances d'un dossier sont supprimées en cascade ;
- pas d'unicité sur une colonne facultative (SQL Server tient deux NULL pour égaux) : l'unicité
  du compte courant est contrôlée par l'application ;
- recherche insensible à la casse sur tous les moteurs ;
- toutes les tables sont préfixées `sges_` pour cohabiter dans une base partagée.

Un test (`__tests__/portabilite.test.ts`) vérifie ces règles et la conversion aller-retour.

## Changer de moteur

```bash
# 1. Convertir le schéma (idempotent, réversible)
npm run db:fournisseur -- sqlserver        # postgresql | sqlserver | mysql | sqlite

# 2. Pointer DATABASE_URL vers la nouvelle base (voir .env.example)
# 3. Générer le client et créer les tables
npx prisma generate
npm run db:schema

# 4a. Base neuve : référentiels et administrateur
npm run db:seed
# 4b. Reprise des données d'une autre base (n'importe quel moteur)
npm run db:exporter -- sauvegarde.json      # sur l'ancienne base
npm run db:importer -- sauvegarde.json      # à blanc
npm run db:importer -- sauvegarde.json --appliquer

# 5. Contrôle avant branchement
npm run db:verifier
```

L'import refuse une base non vide, charge les tables dans l'ordre des clés étrangères (entités
parent avant enfant), par lots compatibles avec la limite de paramètres de SQL Server, puis
compare les volumes table par table.

Exemples d'adresses :

| Moteur | `DATABASE_URL` |
| --- | --- |
| PostgreSQL | `postgresql://sges:***@hote:5432/sges?schema=public&sslmode=require` |
| SQL Server | `sqlserver://hote:1433;database=sges;user=sges;password=***;encrypt=true` |
| MySQL | `mysql://sges:***@hote:3306/sges` |
| SQLite | `file:./sges.db` |

## Supabase (base partagée avec l'outil de scoring Project Finance)

L'outil est installé dans le projet Supabase **ProjectFinanceScoring**, dans un schéma dédié
**`sges`** : ses 30 tables `sges_*` y sont isolées des schémas `public`, `corp_scoring` et
`suivi_reco` des autres applications. Le script de création est conservé dans
`prisma/sql/supabase-schema-sges.sql`.

- **Isolation** : les droits des rôles `anon` et `authenticated` sur le schéma `sges` sont
  retirés et la sécurité par ligne (RLS) est activée sur chaque table, sans politique. L'API REST
  de Supabase n'y donne donc aucun accès. Seule l'application, connectée côté serveur avec le
  compte `postgres`, lit et écrit les données. L'alerte « RLS Enabled No Policy » du conseiller
  Supabase est attendue.
- **Adresse de connexion** : la même que l'outil PF (même mot de passe), avec `schema=sges` :
  - application (Vercel, serveur) : pooler transactionnel, port 6543, suffixe
    `?schema=sges&pgbouncer=true&connection_limit=1` ;
  - commandes `db:schema`, `db:importer`, `db:verifier` : pooler de session, port 5432,
    suffixe `?schema=sges`.
- **Contenu initial** : référentiels complets (langues, devises et cours, rôles, 12 entités,
  listes de valeurs, 45 secteurs, 16 régions, liste d'exclusion, 25 éléments de catégorisation,
  questionnaires et actions types) et un compte `admin@sges.local` dont le mot de passe
  provisoire doit être changé à la première connexion. Aucune donnée de démonstration.
- **Évolution du schéma** : modifier `prisma/schema.prisma` puis `npm run db:schema` avec
  l'adresse du pooler de session : Prisma n'agit que sur le schéma `sges`. **Ne jamais lancer
  `db:schema` sans `schema=sges`** : sur `public`, Prisma proposerait de supprimer les tables
  des autres applications (il s'arrête sans `--accept-data-loss`, option à ne pas utiliser ici).

L'adresse de la base reste un **secret de déploiement** : elle n'est jamais modifiable depuis
l'écran (un compte administrateur compromis ne doit pas pouvoir rediriger les données). L'écran
Paramétrage › Base de données affiche le moteur en service, le temps de réponse et les volumes,
et propose la sauvegarde JSON.

## Pièces jointes

Les pièces (EIES, PGES, photos…) sont stockées **dans la base** (colonne binaire, 10 Mo par
fichier) : aucun stockage externe à configurer, et elles suivent les sauvegardes. Pour exclure
les pièces d'une sauvegarde : `npm run db:exporter -- fichier.json --sans-documents`.
