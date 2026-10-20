import { prisma } from "./prisma";
import { oublierArbre } from "./perimetre";

/**
 * Recalcule chemin et niveau d'une entité et de toute sa descendance après un
 * déplacement dans l'arbre. Refuse les cycles (une entité sous sa propre descendante).
 */
export async function replacer(id: string, parentId: string | null): Promise<void> {
  const toutes = await prisma.entite.findMany({ select: { id: true, parentId: true } });
  let p = parentId;
  const vus = new Set<string>();
  while (p) {
    if (p === id || vus.has(p)) throw new Error("cycle");
    vus.add(p);
    p = toutes.find((e) => e.id === p)?.parentId ?? null;
  }
  const parent = parentId ? await prisma.entite.findUniqueOrThrow({ where: { id: parentId } }) : null;
  const majRec = async (eid: string, cheminParent: string, niveau: number) => {
    const chemin = `${cheminParent}${eid}/`;
    await prisma.entite.update({ where: { id: eid }, data: { chemin, niveau } });
    for (const enfant of toutes.filter((e) => e.parentId === eid)) await majRec(enfant.id, chemin, niveau + 1);
  };
  await prisma.entite.update({ where: { id }, data: { parentId } });
  await majRec(id, parent?.chemin ?? "/", parent ? parent.niveau + 1 : 0);
  oublierArbre();
}
