# API d'intégration — plateforme d'octroi de crédit

Le cahier des charges SGES impose à la nouvelle plateforme d'octroi de récupérer
automatiquement la fiche d'évaluation E&S de chaque demande répondant aux critères
déclencheurs, et d'en faire un élément obligatoire de la décision des comités.

## Authentification

Clé créée dans **Paramétrage › Intégration (API)** (affichée une seule fois ; seule son
empreinte SHA-256 est conservée), à transmettre dans l'en-tête `X-API-Key`. Une clé rattachée
à une entité ne voit que cette entité et sa descendance. Chaque appel est journalisé.

## Fiche d'un dossier

```
GET /api/v1/fiches/{référence}?langue=fr|en|ar
X-API-Key: sges_…
```

```json
{
  "evaluationDisponible": true,
  "evaluationObligatoire": true,
  "fiche": {
    "banque":       { "codeBanque", "entite", "chargeNom", "chargeMatricule", "date" },
    "client":       { "referenceProjet", "raisonSociale", "formeJuridique", "comptePortefeuille",
                      "compteCourant", "typeActivite", "codeActivite", "contact", "poste",
                      "telephone", "email" },
    "lieu":         { "adresseSite", "localite", "region", "typeZone" },
    "description":  { "processus", "objet", "natureProjet", "typeCredit",
                      "projetDeveloppementDurable", "montantDemande", "devise", "montantDemandeRef" },
    "conclusions":  { "listeExclusion", "raisonsExclusion", "motifExclusion", "categorie",
                      "sousCategorieFI", "niveauRisque", "scoreRisque", "commentaireEvaluation" },
    "problematiques": [ { "code", "libelle", "etat": "maitrise|non_maitrise|non_concerne", "risques": [] } ],
    "expositionNonMaitrisee": [ { "thematique", "risque", "mesures": [] } ],
    "planActions":  { "propose", "nbActions", "nbRetenues", "actions": [] },
    "climat":       { "scoreClimat", "niveauClimat", "emissionsFinancees", "alignementTaxonomie", "expositionCBAM" },
    "validation":   { "soumisLe", "valideur", "valideLe" },
    "decisionComite": { "comite", "dateComite", "decision", "montantAccorde", "motifRejet", "motifRejetDetail", "reserves", "commentaire" }
  }
}
```

Correspondance avec le tableau « Données à importer obligatoirement de l'outil SGES » du cahier
des charges : informations agence/CA → `banque` ; informations client → `client` ; lieu →
`lieu` ; description → `description` ; conclusions → `conclusions` ; principales
problématiques E&S → `problematiques` ; exposition aux risques non maîtrisés →
`expositionNonMaitrisee` ; proposition d'un plan d'actions → `planActions` ; décision du comité
→ `decisionComite`.

`evaluationDisponible` est vrai dès la validation par la direction. Un dossier soumis au comité
sans fiche disponible doit être **ajourné** (circulaire, chapitre III).

## Recherche

```
GET /api/v1/fiches?compte={compte 20 positions}&depuis=2026-01-01&statut=valide,decide&limite=100
```

Retourne les dossiers (référence, statut, catégorie, exclusion, niveau de risque, montants,
décision) — utile pour rapprocher une demande de crédit de son évaluation.

## Codes d'erreur

`401` clé absente, invalide, révoquée ou expirée · `404` dossier inconnu ou hors périmètre de la
clé · `500` erreur interne (consignée).
