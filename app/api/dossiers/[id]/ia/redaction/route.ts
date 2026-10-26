import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { dossierAutorise } from "@/lib/serveur/dossiers";
import { construireFiche } from "@/lib/serveur/fiche";
import { anonymiserPourIA, appelerIA, exigerIA } from "@/lib/serveur/ia";
import { journaliser } from "@/lib/serveur/journal";
import { checklistDossier } from "@/lib/serveur/pieces";

export const maxDuration = 300;

const TYPES = ["commentaire", "revue", "synthese", "clauses"] as const;
const ETAPES = ["identification", "exclusion", "categorisation", "evaluation", "climat", "plan", "pieces", "fiche"] as const;

const FORMATS = {
  commentaire: z.object({ texte: z.string() }),
  revue: z.object({
    appreciation: z.string(),
    alertes: z.array(
      z.object({ gravite: z.enum(["bloquant", "majeur", "mineur"]), etape: z.enum(ETAPES), constat: z.string(), recommandation: z.string() })
    ),
  }),
  synthese: z.object({ texte: z.string() }),
  clauses: z.object({
    clauses: z.array(z.object({ type: z.enum(["condition_prealable", "engagement", "reporting", "defaut"]), texte: z.string() })),
    remarques: z.string(),
  }),
};

const CADRE =
  "Tu assistes une banque marocaine dans la gestion des risques environnementaux, sociaux et climatiques de ses crédits " +
  "d'investissement (circulaire CFD-537/01-24, procédure CFD12340876/0217, normes de performance SFI, Principes de l'Équateur, " +
  "directive BAM n° 5/W/2021, loi 49-17, droit de l'environnement et du travail marocain). Tu reçois la fiche d'évaluation du " +
  "dossier (données anonymisées : [CLIENT], [CHARGE]…). Appuie-toi exclusivement sur ces données ; n'invente ni chiffre, ni pièce, " +
  "ni engagement ; signale ce qui manque. Style professionnel bancaire, phrases courtes.";

const CONSIGNES: Record<(typeof TYPES)[number], string> = {
  commentaire:
    "Rédige le commentaire de l'évaluation E&S en cinq rubriques numérotées : 1. Présentation du projet et de son site ; " +
    "2. Principaux enjeux environnementaux, sociaux et climatiques ; 3. Mesures de gestion en place ; 4. Risques non maîtrisés et " +
    "plan d'actions proposé ; 5. Avis et conditions proposées au comité. 250 à 450 mots, texte brut sans markdown.",
  revue:
    "Fais la revue critique du dossier AVANT sa soumission, comme le ferait un validateur exigeant : incohérences entre la catégorie, " +
    "les réponses de catégorisation, le secteur et la description du projet ; risques non maîtrisés sans action corrective ; actions " +
    "vagues (sans responsable, échéance ou budget) ; pièces manquantes ou incomplètes au regard de la catégorie ; volet climat peu " +
    "plausible au regard de la région et du secteur (aléas, CBAM, émissions) ; commentaire d'évaluation absent ou contradictoire ; " +
    "montants et seuil de déclenchement. Classe chaque alerte : bloquant (soumission à revoir), majeur, mineur, avec l'étape concernée " +
    "et une recommandation concrète. Termine par une appréciation globale en deux ou trois phrases.",
  synthese:
    "Rédige la note de synthèse E&S destinée au comité de crédit (une page, texte brut) : projet et montant ; catégorie et motif ; " +
    "risque E&S résiduel et principaux risques non maîtrisés ; climat (niveau, risque physique 2050, coût carbone, CBAM, émissions " +
    "financées) ; plan d'actions (nombre, budget, échéances clés) ; pièces manquantes ; avis motivé et conditions proposées.",
  clauses:
    "Propose les clauses environnementales et sociales du contrat de crédit, adaptées à CE projet : conditions préalables au premier " +
    "décaissement, engagements de l'emprunteur (dont les actions clés datées du plan), obligations d'information, cas de défaut. " +
    "Pars des clauses types fournies (« clauses ») : complète-les, précise-les et supprime ce qui est sans objet. Style contractuel. " +
    "Dans « remarques », indique ce que la direction juridique doit vérifier.",
};

/**
 * Assistant de rédaction et de contrôle : commentaire d'évaluation, revue de cohérence avant soumission,
 * note de synthèse pour le comité, clauses E&S du contrat. Rien n'est enregistré : le texte est proposé
 * à l'utilisateur, qui le relit et l'insère.
 */
export const POST = route(
  async (req, ctx, { id }) => {
    const p = await exigerIA();
    const d = await dossierAutorise(ctx, id);
    const { type } = z.object({ type: z.enum(TYPES) }).parse(await corps(req));
    const fiche = await construireFiche(id, "fr");
    const checklist = await checklistDossier(id);
    const remplacements: Record<string, string> = {
      [fiche.client.raisonSociale]: "[CLIENT]",
      ...(fiche.client.compteCourant ? { [fiche.client.compteCourant]: "[COMPTE]" } : {}),
      ...(fiche.client.contact ? { [fiche.client.contact]: "[CONTACT]" } : {}),
      ...(fiche.banque.chargeNom ? { [fiche.banque.chargeNom]: "[CHARGE]" } : {}),
      ...(fiche.validation.valideur ? { [fiche.validation.valideur]: "[DIRECTEUR]" } : {}),
    };
    const contexte = {
      fiche: { ...fiche, client: { ...fiche.client, telephone: null, email: null } },
      pieces: checklist.lignes.map((l) => ({ piece: l.code, niveau: l.niveau, statut: l.statut, manquant: l.champsManquants.map((m) => m.code) })),
    };
    const { texte, masques } = anonymiserPourIA(contexte, p, remplacements);
    const { sortie, modele } = await appelerIA(p, {
      systeme: `${CADRE}\n${CONSIGNES[type]}\nRédige dans la langue « ${ctx.langue} ».`,
      contenu: `<dossier>\n${texte}\n</dossier>`,
      format: FORMATS[type],
      maxTokens: type === "revue" || type === "clauses" ? 8000 : 4000,
    });
    await journaliser(ctx, `ia_${type}`, "dossier", id, { reference: d.reference, modele, masques });
    return { type, resultat: sortie, modele };
  },
  { permission: "dossier:lire" }
);
