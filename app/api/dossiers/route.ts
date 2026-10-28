import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { SchemaIdentification } from "@/lib/serveur/schemas";
import { ErreurMetier, interdit, introuvable } from "@/lib/serveur/contexte";
import { genererReference, historiser, recalculer } from "@/lib/serveur/dossiers";
import { filtreDossiers } from "@/lib/serveur/filtre-dossiers";
import { journaliser } from "@/lib/serveur/journal";
import { peutEcrire, peutLire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

const SchemaCreation = SchemaIdentification.extend({
  clientId: z.string().min(1),
  entiteId: z.string().optional(),
  montantDemande: z.number().positive().max(1e15),
  deviseCode: z.string().length(3),
  dossierPrecedentId: z.string().nullable().optional(),
});

export const GET = route(
  async (req, ctx) => {
    const p = req.nextUrl.searchParams;
    const where = await filtreDossiers(ctx, p);
    const taille = Math.min(200, Math.max(1, Number(p.get("taille")) || 50));
    const page = Math.max(1, Number(p.get("page")) || 1);
    const [total, lignes] = await Promise.all([
      prisma.dossier.count({ where }),
      prisma.dossier.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * taille,
        take: taille,
        select: {
          id: true, reference: true, statut: true, categorie: true, sousCategorieFI: true, niveauRisque: true, scoreRisque: true,
          montantDemande: true, deviseCode: true, montantDemandeRef: true, dateDossier: true, updatedAt: true, decision: true,
          evaluationObligatoire: true, exclu: true, etape: true, nbRisquesNonMaitrises: true, objet: true, noteESG: true, scoreESG: true,
          client: { select: { id: true, raisonSociale: true, compteCourant: true } },
          entite: { select: { id: true, code: true, nom: true } },
          charge: { select: { id: true, prenom: true, nom: true } },
          secteur: { select: { code: true, libelle: true } },
          climat: { select: { niveauClimat: true, scoreClimat: true } },
        },
      }),
    ]);
    return { total, page, taille, lignes };
  },
  { permission: "dossier:lire" }
);

export const POST = route(
  async (req, ctx) => {
    const data = SchemaCreation.parse(await corps(req));
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client || !peutLire(ctx.perimetre, client.entiteId)) throw introuvable("Client introuvable.");
    const entiteId = data.entiteId ?? ctx.utilisateur.entiteId ?? client.entiteId;
    if (!peutEcrire(ctx.perimetre, entiteId)) throw interdit("Vous ne pouvez pas créer de dossier pour cette entité.");
    const entite = await prisma.entite.findUniqueOrThrow({ where: { id: entiteId } });
    if (!(await prisma.devise.findFirst({ where: { code: data.deviseCode, active: true } }))) {
      throw new ErreurMetier("Devise inconnue ou inactive.", 400, "validation");
    }
    if (data.dossierPrecedentId) {
      const prec = await prisma.dossier.findUnique({ where: { id: data.dossierPrecedentId } });
      if (!prec || !peutLire(ctx.perimetre, prec.entiteId)) data.dossierPrecedentId = null;
    }
    const { clientId, entiteId: _e, dossierPrecedentId, dateDossier, ...reste } = data;
    void _e;
    // La référence est séquentielle : en cas de création simultanée, on retente.
    for (let essai = 0; essai < 5; essai++) {
      try {
        const d = await prisma.dossier.create({
          data: {
            ...reste,
            reference: await genererReference(entite.code),
            entiteId,
            clientId,
            chargeId: ctx.utilisateur.id,
            creeParId: ctx.utilisateur.id,
            dossierPrecedentId: dossierPrecedentId ?? null,
            dateDossier: dateDossier ? new Date(dateDossier) : new Date(),
            secteurId: reste.secteurId ?? client.secteurId,
          },
        });
        await recalculer(d.id);
        await historiser(d.id, ctx, "creation");
        await journaliser(ctx, "creation", "dossier", d.id, { reference: d.reference });
        return prisma.dossier.findUnique({ where: { id: d.id } });
      } catch (e) {
        if ((e as { code?: string }).code === "P2002" && essai < 4) continue;
        throw e;
      }
    }
  },
  { permission: "dossier:creer" }
);
