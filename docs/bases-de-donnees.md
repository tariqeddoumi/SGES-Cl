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

L'adresse de la base reste un **secret de déploiement** : elle n'est jamais modifiable depuis
l'écran (un compte administrateur compromis ne doit pas pouvoir rediriger les données). L'écran
Paramétrage › Base de données affiche le moteur en service, le temps de réponse et les volumes,
et propose la sauvegarde JSON.

## Pièces jointes

Les pièces (EIES, PGES, photos…) sont stockées **dans la base** (colonne binaire, 10 Mo par
fichier) : aucun stockage externe à configurer, et elles suivent les sauvegardes. Pour exclure
les pièces d'une sauvegarde : `npm run db:exporter -- fichier.json --sans-documents`.
