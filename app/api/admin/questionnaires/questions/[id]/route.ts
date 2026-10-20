import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { donneesQuestion, synchroniserActions } from "@/lib/serveur/questions-admin";
import { SchemaQuestion } from "@/lib/serveur/schemas-admin";

export const PATCH = route(
  async (req, ctx, { id }) => {
    const avant = await prisma.question.findUniqueOrThrow({ where: { id }, include: { actions: true } });
    const s = SchemaQuestion.partial().parse(await corps(req));
    // Le code est l'identifiant stable d'une question (export, API) : il ne change pas.
    const q = await prisma.question.update({ where: { id }, data: donneesQuestion(s) });
    await synchroniserActions(id, s.actions);
    await journaliser(ctx, "modification", "question", id, { avant, apres: s });
    return q;
  },
  { permission: "admin:referentiels" }
);

export const DELETE = route(
  async (_req, ctx, { id }) => {
    if (await prisma.reponseQuestion.count({ where: { questionId: id } })) {
      throw new ErreurMetier("Question déjà utilisée dans des évaluations : désactivez-la.", 409, "utilise");
    }
    await prisma.modeleAction.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });
    await journaliser(ctx, "suppression", "question", id);
    return { ok: true };
  },
  { permission: "admin:referentiels" }
);
