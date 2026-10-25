# Assistant IA — analyse des pièces et réduction de la saisie

Activation : Administration → Paramètres → intégration (`IA_ACTIVE`), clé `ANTHROPIC_API_KEY` côté serveur,
et **référence de la validation juridique / CNDP / SSI** (`IA_REFERENCE_VALIDATION`), sans laquelle l'activation est refusée.
Désactivé par défaut. Sans IA, la check-list documentaire fonctionne quand même (présence des pièces).

## Ce que fait l'assistant
Un seul appel analyse **toutes les pièces** du dossier (PDF texte, Word, Excel, texte, canevas remplis) et :

1. **Contrôle la complétude de chaque pièce** (EIES, PGES, décision d'acceptabilité, autorisation, note de
   présentation, plan d'actions signé, engagement) : pour chaque information attendue (`lib/domaine/pieces.ts`),
   état *présent / partiel / absent* et **précision de ce qui manque** (Pièces → Check-list documentaire).
   Reconnaît aussi une pièce classée « Autre » (signalée comme incohérence de type).
2. **Propose des valeurs** pour : identification (localité, région, type de zone, investissement, durée, coordonnées…),
   liste d'exclusion, catégorisation, questionnaire E&S et actions du PGES, chacune avec le passage source.
   Règle : jamais de « non » par simple absence de mention.
3. Les propositions sont **reprises dans les étapes sans être enregistrées** ; le chargé relit, corrige et enregistre.

## Pièces attendues (selon la catégorie)
| Catégorie | Obligatoires | Recommandées |
|---|---|---|
| A (ou EIES requise) | EIES, PGES, acceptabilité environnementale, autorisation | note de présentation, plan d'actions signé, engagement |
| B | — | EIES, PGES, acceptabilité, autorisation + socle |
| C / FI | — | autorisation + socle |

## Sans document : le canevas
Pour chaque pièce, bouton **« Pas de document ? Remplir un canevas avec le client »** : mêmes informations que celles
contrôlées dans la pièce, imprimable pour l'entretien, enregistré comme pièce `CANEVAS`. Il alimente la check-list et
l'assistant. Un canevas **ne remplace jamais une pièce officielle** (EIES, acceptabilité, autorisation) : elle reste
« à régulariser » avant le comité.

## Confidentialité (diagnostic F15)
- Désactivé par défaut ; le texte envoyé est **anonymisé** (e-mail, téléphone, ICE, RIB/IBAN, compte, CIN) si
  `IA_ANONYMISER` = oui (défaut). Les noms de personnes dans le texte libre ne sont pas détectés : validation
  juridique / CNDP et choix du fournisseur restent nécessaires.
- Chaque analyse est journalisée (modèle, nombre de pièces, masquages, nombre de propositions).
- Les fichiers scannés (sans texte extractible) ne sont pas envoyés : la check-list le signale.

## Limites
- Pas de saisie IA du volet climat, ni de lecture d'images / PDF scannés (OCR).
- Les règles de pièces attendues sont dans le code (`piecesAttendues`), non paramétrables en base.
- Suppression de pièces interdite après soumission du dossier (diagnostic F03, partie pièces).
