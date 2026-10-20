# SGES — Système de Gestion Environnementale, Sociale et Climatique

Outil bancaire d'évaluation des risques E&S et climat des crédits d'investissement (groupe
bancaire marocain et filiales). Référentiel : circulaire CFD-537/01-24, procédure
CFD12340876/0217, cahier des charges SGES, SFI, Principes de l'Équateur, BAM 5/W/2021.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind 4 (design de l'outil de
scoring PF) · Prisma 5 (schéma portable PostgreSQL / SQL Server / MySQL / SQLite) · Zod · jose.

## Commandes
`npm run dev` · `npm run build` · `npm run lint` · `npm run type-check` · `npm test` ·
`npm run db:schema` · `npm run db:seed -- --demo` · `npm run db:fournisseur -- <moteur>`.

## Structure
- `lib/domaine/` — règles métier pures (catégorisation, déclenchement, risque, climat, circuit), testées.
- `lib/serveur/` — accès base, session, périmètre multi-entités, services dossiers, fiche, API.
- `lib/i18n/` — dictionnaires fr/en/ar (mêmes clés, test), libellés multilingues des référentiels.
- `app/api/` — routes ; toutes passent par `route()` (session, permission, origine, erreurs).
- `components/dossier/` — volets du dossier ; `components/ui/` — composants du design.
- `prisma/donnees/` — référentiels livrés (exclusion, catégorisation, questionnaires, secteurs, régions).

## Conventions
- Code et interface en français ; toute chaîne affichée passe par `t("…")` et existe en fr/en/ar.
- Schéma portable : pas d'enum, pas de Json, `@db.Text` pour les textes longs, `onUpdate: NoAction`.
- Tout accès à un dossier passe par `dossierAutorise()` (contrôle du périmètre).
- Propriétés CSS logiques (`ms-`, `pe-`, `start-`) pour l'arabe (RTL).
- Montants : devise du dossier + contre-valeur en devise de référence figée au cours du jour.
