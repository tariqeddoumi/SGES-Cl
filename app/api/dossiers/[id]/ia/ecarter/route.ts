import { z } from "zod";
import { lirePropositions } from "@/lib/domaine/sources";
import { corps, route } from "@/lib/serveur/api";
import { dossierAutorise } from "@/lib/serveur/dossiers";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({
  section: z.enum(["identification", "exclusion", "categorisation", "evaluation", "climat"]),
  /** Clés à écarter ; absentes : toute la section. */
  cles: z.array(z.string().max(100)).max(500).optional(),
});

/** Écarte des propositions de l'OCR intelligent (refusées par le chargé) : elles ne sont plus affichées. */
export const POST = route(
  async (req, ctx, { id }) => {
    await dossierAutorise(ctx, id, "ecriture");
    const { section, cles } = Schema.parse(await corps(req));
    const d = await prisma.dossier.findUniqueOrThrow({ where: { id }, select: { propositionsOCR: true } });
    const p = lirePropositions(d.propositionsOCR);
    if (!p) return { ok: true };
    if (cles) for (const k of cles) delete p[section][k];
    else p[section] = {};
    await prisma.dossier.update({ where: { id }, data: { propositionsOCR: JSON.stringify(p) } });
    return { ok: true };
  },
  { permission: "dossier:modifier" }
);
