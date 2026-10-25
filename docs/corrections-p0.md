# Corrections des constats P0 (audit du 23/10/2026)

| Constat | Correction | Où |
|---|---|---|
| **F01** classement A sans les 25 réponses | Un « oui » A **pré-classe** toujours en A (EIES exigée, RSE notifié) mais la **soumission est refusée** tant que les 25 éléments actifs ne sont pas tous renseignés (motif `categorisation_incomplete`) ; l'étape « Catégorisation » n'est cochée qu'une fois complète ; bandeau « classement A provisoire ». | `lib/serveur/dossiers.ts::controleSoumission`, `lib/domaine/workflow.ts`, `volet-categorisation.tsx` |
| **F02** écritures partielles sur erreur 400, pas de transaction | Les routes exclusion, catégorisation (dont reclassement) et évaluation **valident tout avant d'écrire**, puis écrivent dans **une transaction**. Précondition de version optionnelle (`version` = `updatedAt` lu) : 409 `conflit` si le dossier a changé. Les transitions et la décision sont conditionnées au statut attendu (pas de double validation concurrente). | `app/api/dossiers/[id]/{exclusion,categorisation,evaluation,transition,decision}`, `exigerVersion` |
| **F03** pièces / actions retirables après validation | Pièces : suppression refusée dès que le dossier n'est plus en cours d'évaluation, canevas non modifiable ; actions : suppression refusée hors brouillon (passer à « abandonnée »). **Instantané immuable** (saisies, questionnaire posé, plan, pièces avec SHA-256, paramètres) figé à la soumission, à la validation et à la décision (table `sges_snapshots_dossiers`, versionnée). | `lib/serveur/snapshot.ts`, `documents/[docId]`, `actions/[actionId]`, `canevas` |
| **F04** échec du journal ignoré | Pour les événements critiques (transitions, décision, reclassement, inscription en liste d'exclusion) le journal est écrit **dans la même transaction** : si l'écriture échoue, l'opération est annulée. Les entrées contiennent l'état avant/après (décision) et l'empreinte de l'instantané. | `lib/serveur/journal.ts::journaliserCritique` |

## Vérifications réalisées (base PostgreSQL locale, build de production)
- Jeu de recette 1 : un seul « oui » A, autres sans réponse → catégorie A provisoire, soumission 409.
- Jeu de recette 4 : exclusion cochée sans motif → 400, aucune réponse modifiée.
- Jeu de recette 10 : trigger forçant l'échec du journal → validation annulée (statut inchangé, aucun instantané) ; sans trigger → validée, 1 instantané + 1 entrée de journal.
- Version périmée : `version` périmée → 409 ; pièces / canevas verrouillés après validation.

## Reste hors périmètre P0
Chaînage cryptographique / archivage WORM du journal (F04 « empreinte, archivage »), journal des différences champ par champ pour toutes les saisies, et les constats P1/P2.
