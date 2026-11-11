# OCR intelligent — le document d'abord, la saisie en dernier recours

Ce qu'on appelait « l'assistant IA » s'appelle maintenant **OCR intelligent**. Il lit toutes les pièces
du dossier, y compris les **scans et les photos**, reconnaît leur type, contrôle leur complétude et
**propose les réponses** dans chaque étape. Le chargé relit, reprend ou écarte la proposition, puis enregistre.
Il ne saisit lui-même que ce qu'aucun document ne contient.

## Activation (Paramétrage › Intégration)

| Paramètre | Défaut | Rôle |
|---|---|---|
| `IA_ACTIVE` | non | Active l'OCR intelligent |
| `IA_REFERENCE_VALIDATION` | — | Référence de la validation juridique / CNDP / SSI : **sans elle, l'activation est refusée** |
| `IA_ANONYMISER` | oui | Masque e-mail, téléphone, ICE, RIB/IBAN, compte, CIN dans le texte envoyé |
| `OCR_SCANS` | oui | Autorise la transcription des scans et photos (le fichier d'origine est transmis, aucun masquage n'est possible) |
| `OCR_LECTURE_AUTO` | oui | Lit les pièces automatiquement après chaque dépôt |
| `IA_MODELE` | claude-opus-5-5 | Modèle utilisé |

La clé `ANTHROPIC_API_KEY` est lue sur le serveur. Sans OCR intelligent, tout fonctionne quand même :
la carte des sources indique quels documents demander et la saisie reste manuelle.

## Le parcours

1. **Déposer** : bouton « Déposer des documents » en tête du dossier, plusieurs fichiers à la fois, ou
   **glisser-déposer sur la page**. Inutile de choisir le type : une pièce déposée en « Autre » prend le
   type reconnu.
2. **Lire** : chaque pièce est lue au dépôt (texte du PDF, Word, Excel ; transcription des scans et photos
   par l'OCR). Les propositions sont ensuite calculées (lecture automatique, ou bouton « Lire les documents »).
3. **Reprendre** : dans chaque étape (identification, exclusion, catégorisation, questionnaire E&S, climat),
   la proposition s'affiche sous le champ concerné, avec le **document source** et le **passage cité**.
   « Reprendre » remplit le champ, « Reprendre les N propositions » remplit tout l'écran, « × » écarte.
   Rien n'est enregistré sans « Enregistrer ».
4. **Saisir ce qui manque** : sous chaque information encore vide, « **Où trouver l'information** » liste
   les documents qui la contiennent (✓ déjà déposé, ou lien pour le charger d'un clic) et signale ce qui ne
   se constate qu'en visite. En tête d'étape, les **documents utiles** sont classés par nombre de réponses
   qu'ils apporteraient (« Bilan carbone, audit énergétique — 6 réponses »).

Les propositions sont **conservées sur le dossier** : elles restent affichées d'une session à l'autre tant que
la valeur enregistrée est vide ou différente, ou jusqu'à ce que le chargé les écarte. Une pièce déposée après la
dernière lecture est signalée « à lire ».

## Carte des sources (`lib/domaine/sources.ts`)

Chaque information est rattachée aux documents où on la trouve habituellement :

| Information | Documents |
|---|---|
| Identification (objet, montant, durée, site, région, zone, coordonnées) | Note de présentation, EIES, autorisation |
| Liste d'exclusion, catégorisation | Note de présentation, EIES |
| 55 questions E&S | Selon la question (ex. EFF02 → autorisation, rapports d'analyses ; RH01 → déclarations CNSS ; CL05 → attestation d'assurance) |
| Volet climat (scopes 1-2-3, part renouvelable, CBAM, export UE, adaptation) | Bilan carbone / audit énergétique, note de présentation, EIES |

Onze types de pièces ont été ajoutés à la liste « type_document » pour couvrir ces sources : déclarations CNSS,
rapports d'analyses et de mesures, documents déchets, documents HSE, plan d'urgence, politique E&S, documents RH,
bilan carbone / énergie, assurance, certificats, foncier.

## Confidentialité et traçabilité

- Désactivé par défaut ; activation conditionnée à la référence de validation.
- Texte envoyé masqué (`IA_ANONYMISER`). **Les scans et photos sont envoyés tels quels** : désactivez
  `OCR_SCANS` si la validation ne couvre pas ce cas.
- Journal d'audit : chaque transcription (`ocr_piece`) et chaque lecture (`analyse_ia` : modèle, nombre de pièces,
  transcriptions, masquages, nombre de propositions par étape).
- Rien n'est enregistré sans action de l'utilisateur ; une proposition peut être fausse.

## Limites

- Fichiers de 10 Mo maximum ; une transcription très longue peut être tronquée (signalé dans le journal).
- La carte des sources est dans le code (paramétrage par question à prévoir, voir le diagnostic).
- La rédaction (commentaire, revue de cohérence, note de comité, clauses) reste dans la fenêtre « OCR intelligent ».
