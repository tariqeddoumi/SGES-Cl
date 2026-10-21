# Diagnostic d'alignement — octobre 2026

Contrôle de cohérence entre base de données, API et interface, et revue du design.

## Méthode

| Contrôle | Outil | Résultat |
| --- | --- | --- |
| Types, lint, tests unitaires, build, dépendances | `type-check`, `lint`, `jest`, `build`, `npm audit` | sans erreur ; 61 tests |
| Schéma Prisma ↔ base locale | `prisma migrate diff` | migration vide |
| Schéma Prisma ↔ Supabase (schéma `sges`) | empreinte des colonnes, index, clés étrangères | identiques (365 / 64 / 33) |
| Valeurs calculées stockées ↔ moteur de règles | recalcul des 10 dossiers de démonstration | 0 écart |
| Appels du front ↔ routes et méthodes de l'API | extraction statique | toutes les routes appelées existent |
| Champs des formulaires ↔ schémas Zod ↔ colonnes | revue des corps de requête | voir corrections |
| Parcours écran par écran | Playwright : 8 rôles, FR / EN / AR, 1440 px et 390 px | voir corrections |

Le parcours relève les erreurs de console, les appels API en échec, les textes `undefined`,
`NaN`, `Invalid Date`, `[object Object]`, les clés de traduction affichées, le JSON brut, les
débordements horizontaux (page et tableaux) et le sens d'écriture en arabe.

## Corrections

### Alignement des données

- **Actions « en retard »** : trois définitions coexistaient (tableau de bord, liste, navigateur).
  Définition unique côté serveur (`filtreActionsEnRetard`), testée : le lien « 21 en retard »
  mène à 21 actions.
- **Plans d'actions** : l'API tronquait silencieusement à 500 actions et les indicateurs étaient
  calculés sur la liste tronquée. Pagination (50) et indicateurs calculés en base.
- **Visites à planifier** : le tableau de bord ne comptait que les dossiers « en suivi », la page
  incluait les dossiers décidés. Source unique (`echeancesVisites`) ; colonne « Dernière visite »
  au lieu de « Réalisées ».
- **Export Excel** : la recherche texte de la liste n'était pas appliquée à l'export. Filtre
  commun à la liste et à l'export (`lib/serveur/filtre-dossiers.ts`).
- **Fiche client** : vider le champ pays provoquait une erreur ; la valeur existante est conservée.
- **Questionnaires** : la route de modification des blocs n'avait pas d'écran ; ajout de
  l'édition (libellé multilingue, activation).

### Interface et traductions

- 13 codes d'erreur serveur sans traduction ; erreurs de validation nommant le champ refusé sur
  tous les écrans ; en anglais et en arabe, message traduit selon le code d'erreur.
- Garde des écrans selon les droits (`ecranAutorise`) : message « Droits insuffisants » au lieu
  d'un écran vide quand l'adresse est saisie directement.
- Libellés précisés : « Mes évaluations en cours », « Montant financé » (page Climat, montant
  accordé sinon demandé, base de l'attribution PCAF), « Description du projet ».

### Design

- Mobile : l'espace dossier débordait de 1 050 px (grille sans colonne déclarée) ; règle
  générale `.grid > * { min-width: 0 }` ; boutons d'en-tête de carte qui passent à la ligne ;
  tableaux de la fiche défilables ; liste des dossiers en cartes sous 768 px.
- Bureau : la colonne « Statut » de la liste des dossiers était coupée à 1440 px ; colonnes
  « Niveau climat » et « Chargé » affichées à partir de 1536 px, statut et décision empilés.
- Arabe : référence et nom collés (marge logique sur un élément forcé en LTR), catégorie
  « FI 2 » inversée, troncature des noms latins du mauvais côté.
- Synthèse par thématique lisible (retour à la ligne au lieu de la troncature), en-têtes des
  aléas climatiques sur plusieurs lignes, montants insécables.

## Points connus, non bloquants

- Les messages d'erreur de validation nomment le champ par son identifiant technique
  (`contactEmail`) ; l'éditeur de référentiels, lui, affiche le libellé traduit.
- Le projet n'est pas formaté avec Prettier (`npm run format:check` signale 186 fichiers) ;
  un formatage global serait à faire en un commit dédié.
- Le volet Supabase n'a pas été modifié : aucune évolution du schéma dans ce lot.
