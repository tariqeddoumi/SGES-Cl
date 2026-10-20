import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { booleen } from "@/lib/parametres";
import { libelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, introuvable } from "@/lib/serveur/contexte";
import { dossierAutorise, questionsApplicables } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliser } from "@/lib/serveur/journal";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

// L'analyse d'une étude d'impact longue peut prendre plusieurs minutes.
export const maxDuration = 300;

const Sortie = z.object({
  synthese: z.string(),
  propositions: z.array(
    z.object({
      code: z.string(),
      valeur: z.string(),
      justification: z.string(),
      citation: z.string().nullable(),
    })
  ),
  actionsEIE: z.array(
    z.object({
      libelle: z.string(),
      horizon: z.enum(["court", "moyen", "long"]),
      thematique: z.string().nullable(),
    })
  ),
});

/**
 * Assistant d'analyse de l'EIES / du PGES (facultatif, paramètre IA_ACTIVE et clé
 * ANTHROPIC_API_KEY). Ne propose que des réponses étayées par le document ; rien
 * n'est enregistré : le chargé valide chaque proposition à l'écran.
 */
export const POST = route(
  async (req, ctx, { id }) => {
    const p = await chargerParametres();
    if (!booleen(p, "IA_ACTIVE")) throw new ErreurMetier("L'assistant IA est désactivé (Paramétrage).", 403, "ia_inactive");
    if (!process.env.ANTHROPIC_API_KEY) throw new ErreurMetier("Clé ANTHROPIC_API_KEY absente de la configuration du serveur.", 503, "ia_indisponible");
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const { documentId, texte } = z.object({ documentId: z.string().nullable(), texte: z.string().max(400_000).nullable() }).parse(await corps(req));

    let source = texte ?? "";
    if (documentId) {
      const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { dossierId: true, texte: true, nom: true } });
      if (!doc || doc.dossierId !== id) throw introuvable("Pièce introuvable.");
      if (!doc.texte) throw new ErreurMetier("Le texte de cette pièce n'a pas pu être extrait (PDF scanné ?).", 400, "texte_absent");
      source = `${doc.texte}\n\n${source}`;
    }
    if (source.trim().length < 200) throw new ErreurMetier("Document trop court pour une analyse.", 400, "validation");

    const secteur = d.secteurId ? await prisma.secteur.findUnique({ where: { id: d.secteurId } }) : null;
    const questions = (await questionsApplicables(d.categorie, secteur?.code ?? null)).filter((q) => q.type !== "texte");
    if (!questions.length) throw new ErreurMetier("Catégorisez d'abord le projet.", 409, "verrouille");
    const liste = questions
      .map((q) => `${q.code} [${q.type}; réponse signalant un risque : ${q.reponseRisque ?? "aucune"}] ${libelle(q.libelle, ctx.langue)}`)
      .join("\n");

    const client = new Anthropic();
    const reponse = await client.beta.messages.parse({
      model: p.IA_MODELE || "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Sortie) },
      system:
        "Tu assistes un chargé d'affaires bancaire qui évalue les risques environnementaux et sociaux d'un projet " +
        "(normes de performance SFI, Principes de l'Équateur, réglementation marocaine). Tu lis l'étude d'impact fournie et " +
        "tu proposes des réponses au questionnaire uniquement lorsque le document permet d'y répondre ; pour chaque " +
        "proposition, cite le passage qui la fonde. N'invente rien : omets une question que le document ne traite pas. " +
        "Valeurs admises : « oui », « non », « na » pour les questions oui/non, un nombre pour les questions numériques. " +
        "Extrais aussi les mesures du plan de gestion environnementale et sociale (PGES) comme actions. " +
        `Rédige la synthèse, les justifications et les actions dans la langue « ${ctx.langue} ».`,
      messages: [
        {
          role: "user",
          content: `<questionnaire>\n${liste}\n</questionnaire>\n\n<document>\n${source}\n</document>`,
        },
      ],
    });
    if (reponse.stop_reason === "refusal") throw new ErreurMetier("L'analyse a été refusée par le modèle.", 422, "ia_refus");
    const sortie = reponse.parsed_output;
    if (!sortie) throw new ErreurMetier("Réponse de l'assistant illisible.", 502, "ia_format");

    const parCode = new Map(questions.map((q) => [q.code, q]));
    const propositions = sortie.propositions
      .filter((x) => parCode.has(x.code))
      .map((x) => {
        const q = parCode.get(x.code)!;
        return { questionId: q.id, code: q.code, question: libelle(q.libelle, ctx.langue), valeur: x.valeur.trim().toLowerCase(), justification: x.justification, citation: x.citation };
      })
      .filter((x) => (parCode.get(x.code)!.type === "nombre" ? Number.isFinite(Number(x.valeur)) : ["oui", "non", "na"].includes(x.valeur)));

    await journaliser(ctx, "analyse_ia", "dossier", id, { modele: reponse.model, propositions: propositions.length });
    return { synthese: sortie.synthese, propositions, actionsEIE: sortie.actionsEIE, modele: reponse.model };
  },
  { permission: "dossier:modifier" }
);
