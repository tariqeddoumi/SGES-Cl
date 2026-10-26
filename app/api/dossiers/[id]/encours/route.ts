import { z } from "zod";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ encours: z.number().min(0).max(1e15).nullable(), dateEncours: z.string().min(8).nullable() });

/**
 * Encours du crédit à une date d'arrêté (suivi) : base du facteur d'attribution PCAF des émissions
 * financées, à la place du montant accordé. Demandé, accordé et encours restent tous trois tracés.
 */
export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "plan");
    if (d.decision !== "accorde") throw new ErreurMetier("L'encours ne concerne qu'un crédit accordé.", 409, "verrouille");
    const s = Schema.parse(await corps(req));
    if (s.encours !== null && !s.dateEncours) throw new ErreurMetier("Date d'arrêté obligatoire.", 400, "validation", [{ champ: "dateEncours" }]);
    if (s.encours !== null && d.montantAccorde !== null && s.encours > d.montantAccorde) {
      throw new ErreurMetier("L'encours ne peut pas dépasser le montant accordé.", 400, "validation", [{ champ: "encours" }]);
    }
    const dateEncours = s.encours === null ? null : new Date(s.dateEncours!);
    if (dateEncours && dateEncours.getTime() > Date.now()) throw new ErreurMetier("La date d'arrêté ne peut pas être future.", 400, "validation", [{ champ: "dateEncours" }]);
    await prisma.dossier.update({ where: { id }, data: { encours: s.encours, dateEncours } });
    await historiser(id, ctx, "modification", { commentaire: `Encours : ${d.encours ?? "—"} → ${s.encours ?? "—"} ${d.deviseCode}` });
    await journaliser(ctx, "encours", "dossier", id, { avant: { encours: d.encours, dateEncours: d.dateEncours }, apres: { encours: s.encours, dateEncours } });
    await recalculer(id);
    return { encours: s.encours, dateEncours };
  },
  { permission: "dossier:lire" }
);
