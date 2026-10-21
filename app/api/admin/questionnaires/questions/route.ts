import { corps, route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { donneesQuestion, synchroniserActions } from "@/lib/serveur/questions-admin";
import { SchemaQuestion } from "@/lib/serveur/schemas-admin";

export const POST = route(
  async (req, ctx) => {
    const s = SchemaQuestion.parse(await corps(req));
    const q = await prisma.question.create({
      data: { code: s.code, ...(donneesQuestion(s) as Required<Pick<ReturnType<typeof donneesQuestion>, "libelle" | "blocId" | "categories">>), ordre: s.ordre ?? (await prisma.question.count()) },
    });
    await synchroniserActions(q.id, s.actions);
    await journaliser(ctx, "creation", "question", q.id, s);
    return q;
  },
  { permission: "admin:referentiels" }
);
