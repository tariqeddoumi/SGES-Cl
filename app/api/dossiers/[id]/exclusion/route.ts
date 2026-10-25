import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, exigerVersion, historiser, notifierRSE, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliserCritique } from "@/lib/serveur/journal";
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
  /** Version du dossier lue par le client (`updatedAt`) : refuse l'écriture si le dossier a changé depuis. */
  version: z.string().nullable().optional(),
});

export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const { reponses, motifExclusion, version } = Schema.parse(await corps(req));
    exigerVersion(d, version);

    // 1. Tout est validé AVANT la moindre écriture : un rejet 400 ne laisse aucune trace partielle.
    const criteres = new Set((await prisma.critereExclusion.findMany({ select: { id: true } })).map((c) => c.id));
    const valides = reponses.filter((r) => criteres.has(r.critereId));
    const existantes = await prisma.reponseExclusion.findMany({ where: { dossierId: id }, include: { critere: { select: { actif: true } } } });
    const finales = new Map(existantes.filter((r) => r.critere.actif).map((r) => [r.critereId, r.reponse]));
    for (const r of valides) finales.set(r.critereId, r.reponse);
    const exclu = [...finales.values()].some(Boolean);
    if (exclu && !motifExclusion?.trim()) throw new ErreurMetier("Le motif est obligatoire lorsqu'un critère d'exclusion est coché.", 400, "validation", [{ champ: "motifExclusion" }]);

    // 2. Écritures atomiques (réponses, motif, journal) : tout ou rien.
    await prisma.$transaction(async (tx) => {
      for (const r of valides) {
        await tx.reponseExclusion.upsert({
          where: { dossierId_critereId: { dossierId: id, critereId: r.critereId } },
          // Une réponse repassée à « non » n'a plus besoin de dérogation.
          update: { reponse: r.reponse, commentaire: r.commentaire ?? null, ...(r.reponse ? {} : { derogation: null, derogationParId: null, derogationParNom: null, derogationLe: null }) },
          create: { dossierId: id, critereId: r.critereId, reponse: r.reponse, commentaire: r.commentaire ?? null },
        });
      }
      await tx.dossier.update({ where: { id }, data: { motifExclusion: motifExclusion ?? null, etape: Math.max(d.etape, 3) } });
      if (exclu !== d.exclu) {
        await journaliserCritique(tx, ctx, "exclusion", "dossier", id, { reference: d.reference, avant: d.exclu, apres: exclu, motif: motifExclusion ?? null });
      }
    });
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
