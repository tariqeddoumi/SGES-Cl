import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, recalculer } from "@/lib/serveur/dossiers";
import { journaliserCritique } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ complet: z.boolean() });

/** Le Responsable RSE impose (ou lève) le questionnaire complet sur un dossier en cours d'évaluation. */
export const POST = route(
  async (req, ctx, { id }) => {
    const { complet } = Schema.parse(await corps(req));
    if (!ctx.permissions.includes("dossier:reclassifier")) throw interdit("Réservé au Responsable Social et Environnemental.");
    const d = await dossierAutorise(ctx, id, "lecture");
    if (d.statut !== "brouillon") throw new ErreurMetier("Modifiable uniquement en cours d'évaluation.", 409, "verrouille");
    if (d.questionnaireComplet === complet) return { complet };
    await prisma.$transaction(async (tx) => {
      await tx.dossier.update({ where: { id }, data: { questionnaireComplet: complet } });
      await journaliserCritique(tx, ctx, complet ? "questionnaire_complet" : "questionnaire_allege", "dossier", id, { reference: d.reference });
      await historiser(id, ctx, "questionnaire", { commentaire: complet ? "Questionnaire complet imposé" : "Questionnaire selon le paramétrage" }, tx);
    });
    await recalculer(id);
    return { complet };
  },
  { permission: "dossier:lire" }
);
