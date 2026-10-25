import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { anonymiser } from "@/lib/domaine/anonymisation";
import { CODES_PIECES, definition, lireAnalyse, piecesAttendues, type AnalysePiece } from "@/lib/domaine/pieces";
import { DICTIONNAIRES, traduire } from "@/lib/i18n";
import { libelle } from "@/lib/i18n/libelle";
import { booleen } from "@/lib/parametres";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, questionsApplicables } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliser } from "@/lib/serveur/journal";
import { chargerParametres } from "@/lib/serveur/parametres";
import { checklistDossier } from "@/lib/serveur/pieces";
import { prisma } from "@/lib/serveur/prisma";

// L'analyse de plusieurs études d'impact peut prendre plusieurs minutes.
export const maxDuration = 300;

const PAR_PIECE = 80_000;
const TOTAL = 300_000;

const CHAMPS_IDENTIFICATION = ["objet", "natureProjet", "descriptionProcessus", "adresseSite", "localite", "regionCode", "typeZone", "montantInvestissement", "dureeMois", "latitude", "longitude"] as const;

const Reponse = z.object({ code: z.string(), valeur: z.string(), justification: z.string(), citation: z.string().nullable() });

const Sortie = z.object({
  synthese: z.string(),
  documents: z.array(
    z.object({
      documentId: z.string(),
      typeDetecte: z.string().nullable(),
      resume: z.string(),
      champs: z.array(z.object({ code: z.string(), etat: z.enum(["present", "partiel", "absent"]), precision: z.string().nullable(), citation: z.string().nullable() })),
    })
  ),
  identification: z.array(z.object({ champ: z.enum(CHAMPS_IDENTIFICATION), valeur: z.string(), citation: z.string().nullable() })),
  exclusion: z.array(Reponse),
  categorisation: z.array(Reponse),
  evaluation: z.array(Reponse),
  actionsEIE: z.array(z.object({ libelle: z.string(), horizon: z.enum(["court", "moyen", "long"]), thematique: z.string().nullable() })),
});

const SYSTEME =
  "Tu assistes un chargé d'affaires d'une banque marocaine qui constitue le dossier d'évaluation environnementale et sociale (E&S) " +
  "d'un crédit d'investissement (normes de performance SFI, Principes de l'Équateur, loi 49-17, circulaire CFD-537/01-24). " +
  "On te remet les pièces du dossier (texte extrait, données personnelles éventuellement masquées entre crochets) et les référentiels de l'outil.\n" +
  "1. Pour chaque pièce, reconnais son type parmi les codes fournis (ou null) et, pour chaque information attendue de ce type, indique si elle est " +
  "« present » (traitée de façon exploitable), « partiel » (évoquée mais incomplète ou imprécise) ou « absent ». Pour « partiel » et « absent », " +
  "la précision dit exactement ce qui manque (ex. « aucune mesure de bruit à l'état initial », « budget non chiffré »). Cite un passage pour « present » et « partiel ».\n" +
  "2. Propose des valeurs pour les rubriques du dossier (identification, liste d'exclusion, catégorisation, questionnaire E&S, actions du PGES) " +
  "UNIQUEMENT lorsque les pièces permettent d'y répondre, avec le passage qui le fonde. N'invente rien ; omets ce que les pièces ne traitent pas. " +
  "Pour la liste d'exclusion et la catégorisation, ne réponds « non » que si une pièce décrit positivement le contraire ; l'absence de mention ne vaut pas « non ». " +
  "Valeurs admises : « oui », « non », « na » (questions oui/non) ou un nombre ; pour l'identification, du texte, un nombre (montants en unités de la devise du dossier, durée en mois, coordonnées décimales), " +
  "un code de région ou de type de zone pris dans les listes fournies.\n";

export const POST = route(
  async (req, ctx, { id }) => {
    const p = await chargerParametres();
    if (!booleen(p, "IA_ACTIVE")) throw new ErreurMetier("L'assistant IA est désactivé (Paramétrage).", 403, "ia_inactive");
    if (!process.env.ANTHROPIC_API_KEY) throw new ErreurMetier("Clé ANTHROPIC_API_KEY absente de la configuration du serveur.", 503, "ia_indisponible");
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "pieces");
    z.object({}).passthrough().parse((await corps(req).catch(() => ({}))) ?? {});

    const docs = await prisma.document.findMany({ where: { dossierId: id }, orderBy: { createdAt: "asc" }, select: { id: true, type: true, nom: true, texte: true, analyse: true } });
    const exploitables = docs.filter((x) => (x.texte ?? "").trim().length >= 80);
    if (!exploitables.length) throw new ErreurMetier("Aucune pièce exploitable : déposez un PDF, un document Word ou un fichier texte, ou remplissez un canevas.", 400, "texte_absent");

    const masquer = booleen(p, "IA_ANONYMISER");
    let reste = TOTAL;
    const blocs: string[] = [];
    const masques: Record<string, number> = {};
    for (const x of exploitables) {
      let t = (x.texte ?? "").slice(0, Math.min(PAR_PIECE, reste));
      if (masquer) {
        const r = anonymiser(t);
        t = r.texte;
        for (const [k, n] of Object.entries(r.masques)) masques[k] = (masques[k] ?? 0) + n;
      }
      reste -= t.length;
      blocs.push(`<piece id="${x.id}" type_declare="${x.type}" nom="${x.nom.replace(/"/g, "'")}">\n${t}\n</piece>`);
      if (reste <= 0) break;
    }

    const fr = DICTIONNAIRES.fr;
    const attendues = piecesAttendues(d.categorie, d.eieRequise);
    const defs = [...new Set([...attendues.map((a) => a.code), ...CODES_PIECES])]
      .map((code) => `${code} : ${definition(code)!.champs.map((ch) => `${ch.code} (${traduire(fr, `pieces.champs.${ch.code}`)}${ch.obligatoire ? "" : ", facultatif"})`).join(" ; ")}`)
      .join("\n");

    const [criteres, elements, regions, zones, secteur] = await Promise.all([
      prisma.critereExclusion.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
      prisma.questionCategorisation.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
      prisma.region.findMany({ select: { id: true, code: true, libelle: true } }),
      prisma.listeValeur.findMany({ where: { liste: "type_zone", actif: true }, select: { code: true, libelle: true } }),
      d.secteurId ? prisma.secteur.findUnique({ where: { id: d.secteurId } }) : null,
    ]);
    const questions = (await questionsApplicables(d.categorie, secteur?.code ?? null)).filter((q) => q.type !== "texte");
    const listes =
      `<pieces_types>\n${defs}\n</pieces_types>\n` +
      `<regions>\n${regions.map((r) => `${r.code} : ${libelle(r.libelle, "fr")}`).join("\n")}\n</regions>\n` +
      `<types_zone>\n${zones.map((z) => `${z.code} : ${libelle(z.libelle, "fr")}`).join("\n")}\n</types_zone>\n` +
      `<exclusion>\n${criteres.map((c) => `${c.code} ${libelle(c.libelle, "fr")}`).join("\n")}\n</exclusion>\n` +
      `<categorisation>\n${elements.map((q) => `${q.code} [catégorie ${q.categorie}] ${libelle(q.libelle, "fr")}`).join("\n")}\n</categorisation>\n` +
      (questions.length ? `<questionnaire>\n${questions.map((q) => `${q.code} [${q.type}; réponse signalant un risque : ${q.reponseRisque ?? "aucune"}] ${libelle(q.libelle, "fr")}`).join("\n")}\n</questionnaire>\n` : "<questionnaire></questionnaire>\n") +
      `<dossier devise="${d.deviseCode}" categorie="${d.categorie ?? "non déterminée"}" />\n`;

    const client = new Anthropic();
    const reponse = await client.beta.messages.parse({
      model: p.IA_MODELE || "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Sortie) },
      system: `${SYSTEME}Rédige résumés, précisions et justifications dans la langue « ${ctx.langue} ».`,
      messages: [{ role: "user", content: `${listes}\n<documents>\n${blocs.join("\n")}\n</documents>` }],
    });
    if (reponse.stop_reason === "refusal") throw new ErreurMetier("L'analyse a été refusée par le modèle.", 422, "ia_refus");
    const sortie = reponse.parsed_output;
    if (!sortie) throw new ErreurMetier("Réponse de l'assistant illisible.", 502, "ia_format");

    // 1. Analyses par pièce (stockées : la check-list reste lisible sans nouvel appel).
    const maintenant = new Date().toISOString();
    const parId = new Map(exploitables.map((x) => [x.id, x]));
    for (const a of sortie.documents) {
      const x = parId.get(a.documentId);
      if (!x || lireAnalyse(x.analyse)?.canevas) continue;
      const type = a.typeDetecte && CODES_PIECES.includes(a.typeDetecte) ? a.typeDetecte : null;
      const codes = new Set((definition(type ?? x.type)?.champs ?? []).map((ch) => ch.code));
      const analyse: AnalysePiece = { typeDetecte: type, resume: a.resume, champs: a.champs.filter((ch) => codes.has(ch.code)), analyseLe: maintenant, modele: reponse.model };
      await prisma.document.update({ where: { id: x.id }, data: { analyse: JSON.stringify(analyse) } });
    }

    // 2. Propositions de saisie, filtrées sur les référentiels (jamais enregistrées ici).
    const oui = (v: string) => ["oui", "non"].includes(v.trim().toLowerCase());
    const mapper = <T extends { code: string }>(liste: z.infer<typeof Reponse>[], ref: Map<string, T>, accepte: (r: z.infer<typeof Reponse>, o: T) => boolean) =>
      liste.filter((r) => ref.has(r.code) && accepte(r, ref.get(r.code)!)).map((r) => ({ ...r, valeur: r.valeur.trim().toLowerCase(), item: ref.get(r.code)! }));
    const exclusion = mapper(sortie.exclusion, new Map(criteres.map((c) => [c.code, c])), (r) => oui(r.valeur)).map((r) => ({ critereId: r.item.id, code: r.code, libelle: libelle(r.item.libelle, ctx.langue), valeur: r.valeur, justification: r.justification, citation: r.citation }));
    const categorisation = mapper(sortie.categorisation, new Map(elements.map((q) => [q.code, q])), (r) => oui(r.valeur)).map((r) => ({ questionId: r.item.id, code: r.code, libelle: libelle(r.item.libelle, ctx.langue), valeur: r.valeur, justification: r.justification, citation: r.citation }));
    const evaluation = mapper(sortie.evaluation, new Map(questions.map((q) => [q.code, q])), (r, q) => (q.type === "nombre" ? Number.isFinite(Number(r.valeur.replace(",", "."))) : ["oui", "non", "na"].includes(r.valeur.trim().toLowerCase()))).map((r) => ({ questionId: r.item.id, code: r.code, libelle: libelle(r.item.libelle, ctx.langue), valeur: r.valeur, justification: r.justification, citation: r.citation }));

    const regionParCode = new Map(regions.map((r) => [r.code, r.id]));
    const zonesOk = new Set(zones.map((z) => z.code));
    const identification: { champ: string; valeur: string; citation: string | null }[] = [];
    for (const x of sortie.identification) {
      let v = x.valeur.trim();
      if (!v) continue;
      if (x.champ === "regionCode") {
        const rid = regionParCode.get(v);
        if (!rid) continue;
        identification.push({ champ: "regionId", valeur: rid, citation: x.citation });
        continue;
      }
      if (x.champ === "typeZone" && !zonesOk.has(v)) continue;
      if (["montantInvestissement", "dureeMois", "latitude", "longitude"].includes(x.champ)) {
        v = v.replace(/\s/g, "").replace(",", ".");
        if (!Number.isFinite(Number(v))) continue;
      }
      identification.push({ champ: x.champ, valeur: v, citation: x.citation });
    }

    await journaliser(ctx, "analyse_ia", "dossier", id, { modele: reponse.model, pieces: exploitables.length, masquage: masquer, masques, propositions: { identification: identification.length, exclusion: exclusion.length, categorisation: categorisation.length, evaluation: evaluation.length } });
    return {
      synthese: sortie.synthese,
      modele: reponse.model,
      masques,
      checklist: await checklistDossier(id),
      propositions: { identification, exclusion, categorisation, evaluation, actionsEIE: sortie.actionsEIE },
    };
  },
  { permission: "dossier:modifier" }
);
