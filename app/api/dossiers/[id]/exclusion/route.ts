import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, notifierRSE, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { booleen } from "@/lib/parametres";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const [criteres, reponses, d] = await Promise.all([
      prisma.critereExclusion.findMany({ where: { OR: [{ actif: true }, { reponses: { some: { dossierId: id } } }] }, orderBy: { ordre: "asc" } }),
      prisma.reponseExclusion.findMany({ where: { dossierId: id } }),
      prisma.dossier.findUniqueOrThrow({ where: { id }, select: { motifExclusion: true, exclu: true, exclusionVerifiee: true } }),
    ]);
    return { criteres, reponses, ...d };
  },
  { permission: "dossier:lire" }
);

const Schema = z.object({
  reponses: z.array(z.object({ critereId: z.string(), reponse: z.boolean(), commentaire: z.string().max(4000).nullable().optional() })).max(200),
  motifExclusion: z.string().max(8000).nullable().optional(),
});

export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const { reponses, motifExclusion } = Schema.parse(await corps(req));
    const criteres = new Set((await prisma.critereExclusion.findMany({ select: { id: true } })).map((c) => c.id));
    for (const r of reponses) {
      if (!criteres.has(r.critereId)) continue;
      await prisma.reponseExclusion.upsert({
        where: { dossierId_critereId: { dossierId: id, critereId: r.critereId } },
        update: { reponse: r.reponse, commentaire: r.commentaire ?? null },
        create: { dossierId: id, critereId: r.critereId, reponse: r.reponse, commentaire: r.commentaire ?? null },
      });
    }
    const exclu = reponses.some((r) => r.reponse);
    if (exclu && !motifExclusion?.trim()) throw new ErreurMetier("Le motif est obligatoire lorsqu'un critère d'exclusion est coché.", 400, "validation", [{ champ: "motifExclusion" }]);
    await prisma.dossier.update({ where: { id }, data: { motifExclusion: motifExclusion ?? null, etape: Math.max(d.etape, 3) } });
    await recalculer(id);
    const apres = await prisma.dossier.findUniqueOrThrow({ where: { id } });
    if (apres.exclu && !d.exclu) {
      await historiser(id, ctx, "exclusion", { commentaire: motifExclusion });
      if (booleen(await chargerParametres(), "EXCLUSION_NOTIFIER_RSE")) {
        await notifierRSE(id, "exclusion", `${apres.reference} — liste d'exclusion`, motifExclusion ?? "");
      }
    }
    return { exclu: apres.exclu, exclusionVerifiee: apres.exclusionVerifiee };
  },
  { permission: "dossier:modifier" }
);
