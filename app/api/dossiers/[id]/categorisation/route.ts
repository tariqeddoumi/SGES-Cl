import { z } from "zod";
import { CATEGORIES, SOUS_CATEGORIES_FI } from "@/lib/domaine/constantes";
import { booleen } from "@/lib/parametres";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, interdit } from "@/lib/serveur/contexte";
import { dossierAutorise, exigerVersion, historiser, notifierRSE, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliserCritique } from "@/lib/serveur/journal";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    const [questions, reponses, d] = await Promise.all([
      prisma.questionCategorisation.findMany({ where: { OR: [{ actif: true }, { reponses: { some: { dossierId: id } } }] }, orderBy: { ordre: "asc" } }),
      prisma.reponseCategorisation.findMany({ where: { dossierId: id } }),
      prisma.dossier.findUniqueOrThrow({
        where: { id },
        select: { categorie: true, categorieCalculee: true, sousCategorieFI: true, justificationCategorie: true, eieRequise: true, secteur: { select: { categorieIndicative: true } } },
      }),
    ]);
    return { questions, reponses, ...d };
  },
  { permission: "dossier:lire" }
);

const Schema = z.object({
  reponses: z.array(z.object({ questionId: z.string(), reponse: z.boolean() })).max(200),
  sousCategorieFI: z.enum(SOUS_CATEGORIES_FI).nullable().optional(),
  /** Reclassement (Responsable RSE) : catégorie retenue différente de la catégorie calculée. */
  categorieRetenue: z.enum(CATEGORIES).nullable().optional(),
  justification: z.string().max(4000).nullable().optional(),
  /** Version du dossier lue par le client (`updatedAt`) : refuse l'écriture si le dossier a changé depuis. */
  version: z.string().nullable().optional(),
});

export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    const data = Schema.parse(await corps(req));
    const reclassement = data.categorieRetenue !== undefined;

    // 1. Contrôles AVANT toute écriture : un rejet ne laisse aucune réponse enregistrée.
    if (reclassement) {
      if (!ctx.permissions.includes("dossier:reclassifier")) throw interdit("Le reclassement est réservé au Responsable Social et Environnemental.");
      if (d.statut !== "brouillon") throw new ErreurMetier("Reclassement possible uniquement en cours d'évaluation.", 409, "verrouille");
      if (data.categorieRetenue && !data.justification?.trim()) {
        throw new ErreurMetier("La justification du reclassement est obligatoire.", 400, "validation", [{ champ: "justification" }]);
      }
    } else exigerVolet(ctx, d, "evaluation");
    exigerVersion(d, data.version);
    const ids = new Set((await prisma.questionCategorisation.findMany({ select: { id: true } })).map((q) => q.id));
    const valides = data.reponses.filter((r) => ids.has(r.questionId));
    const ancienne = d.categorie;

    // 2. Écritures atomiques.
    await prisma.$transaction(async (tx) => {
      for (const r of valides) {
        await tx.reponseCategorisation.upsert({
          where: { dossierId_questionId: { dossierId: id, questionId: r.questionId } },
          update: { reponse: r.reponse },
          create: { dossierId: id, questionId: r.questionId, reponse: r.reponse },
        });
      }
      if (reclassement) {
        await tx.dossier.update({
          where: { id },
          data: data.categorieRetenue ? { categorie: data.categorieRetenue, justificationCategorie: data.justification } : { categorie: null, justificationCategorie: null },
        });
        await journaliserCritique(tx, ctx, "reclassement", "dossier", id, { reference: d.reference, de: ancienne, vers: data.categorieRetenue ?? null, justification: data.justification ?? null });
      } else if (!d.justificationCategorie) {
        // Sans reclassement en vigueur, la catégorie suit le formulaire.
        await tx.dossier.update({ where: { id }, data: { categorie: null } });
      }
      await tx.dossier.update({
        where: { id },
        data: { sousCategorieFI: data.sousCategorieFI ?? d.sousCategorieFI, dateCategorisation: new Date(), etape: Math.max(d.etape, 4) },
      });
    });
    await recalculer(id);
    const apres = await prisma.dossier.findUniqueOrThrow({ where: { id } });
    const p = await chargerParametres();
    if (apres.categorie !== ancienne) {
      await historiser(id, ctx, reclassement ? "reclassement" : "categorisation", { commentaire: `${ancienne ?? "—"} → ${apres.categorie ?? "—"}${data.justification ? ` : ${data.justification}` : ""}` });
      if (booleen(p, "CATEGORIE_A_NOTIFIER_RSE")) {
        if (apres.categorie === "A") await notifierRSE(id, "categorie_a", `${apres.reference} — catégorie A`, "Projet classé en catégorie A : EIES exigée, information de la SFI le cas échéant.");
        else if (ancienne === "A") await notifierRSE(id, "changement_categorie", `${apres.reference} — changement de catégorie`, `Catégorie A → ${apres.categorie ?? "non catégorisé"}`);
      }
    }
    return { categorie: apres.categorie, categorieCalculee: apres.categorieCalculee, eieRequise: apres.eieRequise };
  },
  { permission: "dossier:lire" }
);
