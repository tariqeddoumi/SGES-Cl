import type { z } from "zod";
import { ecrireLibelle } from "../i18n/libelle";
import { prisma } from "./prisma";
import type { SchemaQuestion } from "./schemas-admin";

type Q = Partial<z.infer<typeof SchemaQuestion>>;

export function donneesQuestion(s: Q) {
  return {
    ...(s.libelle ? { libelle: ecrireLibelle(s.libelle) } : {}),
    ...(s.aide !== undefined ? { aide: s.aide ? ecrireLibelle(s.aide) : null } : {}),
    ...(s.blocId ? { blocId: s.blocId } : {}),
    ...(s.categories ? { categories: s.categories.join(",") } : {}),
    ...(s.type ? { type: s.type } : {}),
    ...(s.options !== undefined ? { options: s.options ? JSON.stringify(s.options) : null } : {}),
    ...(s.reponseRisque !== undefined ? { reponseRisque: s.reponseRisque || null } : {}),
    ...(s.gravite ? { gravite: s.gravite } : {}),
    ...(s.references !== undefined ? { references: s.references || null } : {}),
    ...(s.secteurs !== undefined ? { secteurs: s.secteurs || null } : {}),
    ...(s.obligatoire !== undefined ? { obligatoire: s.obligatoire } : {}),
    ...(s.ordre !== undefined ? { ordre: s.ordre } : {}),
    ...(s.actif !== undefined ? { actif: s.actif } : {}),
  };
}

/** Remplace les actions types d'une question (mise à jour, ajout, suppression). */
export async function synchroniserActions(questionId: string, actions: Q["actions"]) {
  if (!actions) return;
  const existantes = await prisma.modeleAction.findMany({ where: { questionId } });
  const gardees = new Set(actions.filter((a) => a.id).map((a) => a.id!));
  await prisma.modeleAction.deleteMany({ where: { questionId, id: { in: existantes.filter((e) => !gardees.has(e.id)).map((e) => e.id) } } });
  for (const [ordre, a] of actions.entries()) {
    const data = { horizon: a.horizon, libelle: ecrireLibelle(a.libelle), delaiMois: a.delaiMois ?? null, actif: a.actif ?? true, ordre };
    if (a.id && existantes.some((e) => e.id === a.id)) await prisma.modeleAction.update({ where: { id: a.id }, data });
    else await prisma.modeleAction.create({ data: { ...data, questionId } });
  }
}
