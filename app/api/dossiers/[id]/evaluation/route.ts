import { z } from "zod";
import { calculerRisque, lireSeuils } from "@/lib/domaine/risque";
import { booleen } from "@/lib/parametres";
import { corps, route } from "@/lib/serveur/api";
import { dossierAutorise, exigerVersion, genererPlan, questionsApplicables, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const d = await prisma.dossier.findUniqueOrThrow({ where: { id }, include: { secteur: true } });
    const questions = await questionsApplicables(d.id, d.categorie, d.secteur?.code ?? null);
    const reponses = await prisma.reponseQuestion.findMany({ where: { dossierId: id } });
    const nbActions = await prisma.modeleAction.groupBy({ by: ["questionId"], where: { actif: true }, _count: true });
    const actionsParQuestion = new Map(nbActions.map((n) => [n.questionId, n._count]));

    // Regroupement thématique › bloc, dans l'ordre du référentiel.
    const thematiques: {
      id: string; code: string; libelle: string; normes: string | null;
      blocs: { id: string; code: string; libelle: string; questions: unknown[] }[];
    }[] = [];
    for (const q of questions) {
      const th = q.bloc.thematique;
      let t = thematiques.find((x) => x.id === th.id);
      if (!t) thematiques.push((t = { id: th.id, code: th.code, libelle: th.libelle, normes: th.normes, blocs: [] }));
      let b = t.blocs.find((x) => x.id === q.blocId);
      if (!b) t.blocs.push((b = { id: q.blocId, code: q.bloc.code, libelle: q.bloc.libelle, questions: [] }));
      b.questions.push({
        id: q.id, code: q.code, libelle: q.libelle, aide: q.aide, type: q.type, options: q.options,
        reponseRisque: q.reponseRisque, gravite: q.gravite, references: q.references, obligatoire: q.obligatoire,
        nbActions: actionsParQuestion.get(q.id) ?? 0,
      });
    }
    const p = await chargerParametres();
    const valeurs = Object.fromEntries(reponses.map((r) => [r.questionId, r.valeur]));
    const synthese = calculerRisque(
      questions.map((q) => ({ id: q.id, type: q.type, reponseRisque: q.reponseRisque, gravite: q.gravite, thematique: q.bloc.thematique.code, obligatoire: q.obligatoire })),
      valeurs,
      { categorie: d.categorie, seuils: lireSeuils(p.SEUILS_NIVEAU_RISQUE), releverCategorieA: booleen(p, "RELEVER_NIVEAU_CATEGORIE_A") }
    );
    return {
      categorie: d.categorie,
      questionnaire: { ...questions.questionnaire, complet: d.questionnaireComplet },
      thematiques,
      reponses,
      synthese,
      commentaireEvaluation: d.commentaireEvaluation,
      commentaireObligatoire: booleen(p, "COMMENTAIRE_EVALUATION_OBLIGATOIRE"),
    };
  },
  { permission: "dossier:lire" }
);

const Schema = z.object({
  reponses: z
    .array(z.object({ questionId: z.string(), valeur: z.string().max(4000).nullable(), commentaire: z.string().max(4000).nullable().optional() }))
    .max(500),
  commentaireEvaluation: z.string().max(20000).nullable().optional(),
  version: z.string().nullable().optional(),
});

export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const { reponses, commentaireEvaluation, version } = Schema.parse(await corps(req));
    exigerVersion(d, version);
    const ids = new Set((await prisma.question.findMany({ select: { id: true } })).map((q) => q.id));
    // Toutes les écritures du volet sont atomiques : tout ou rien.
    await prisma.$transaction(async (tx) => {
      for (const r of reponses) {
        if (!ids.has(r.questionId)) continue;
        if (r.valeur === null || r.valeur === "") {
          await tx.reponseQuestion.deleteMany({ where: { dossierId: id, questionId: r.questionId } });
          continue;
        }
        await tx.reponseQuestion.upsert({
          where: { dossierId_questionId: { dossierId: id, questionId: r.questionId } },
          update: { valeur: r.valeur, commentaire: r.commentaire ?? null },
          create: { dossierId: id, questionId: r.questionId, valeur: r.valeur, commentaire: r.commentaire ?? null },
        });
      }
      await tx.dossier.update({ where: { id }, data: { ...(commentaireEvaluation !== undefined ? { commentaireEvaluation } : {}), etape: Math.max(d.etape, 5) } });
    });
    await recalculer(id);
    // Le plan d'actions suit les réponses (procédure §3.5 : génération automatique).
    const plan = await genererPlan(id, ctx.langue);
    const apres = await prisma.dossier.findUniqueOrThrow({
      where: { id },
      select: { scoreRisque: true, niveauRisque: true, nbRisquesNonMaitrises: true, evaluationTerminee: true },
    });
    return { ...apres, plan };
  },
  { permission: "dossier:modifier" }
);
