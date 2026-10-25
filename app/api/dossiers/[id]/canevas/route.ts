import { z } from "zod";
import { analyseDepuisCanevas, definition, nettoyerReponses, rendreCanevas } from "@/lib/domaine/pieces";
import { evaluationModifiable } from "@/lib/domaine/workflow";
import { DICTIONNAIRES, traduire } from "@/lib/i18n";
import { libelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { dossierAutorise, historiser } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";
import { checklistDossier } from "@/lib/serveur/pieces";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ piece: z.string(), reponses: z.record(z.string(), z.string().max(4000)) });

/**
 * Canevas rempli avec le client lorsque la pièce n'est pas disponible : enregistré comme
 * pièce de type « CANEVAS » (texte), il alimente la check-list et l'assistant IA. Un canevas
 * ne remplace jamais une pièce officielle (EIES, autorisation) : la check-list la garde à régulariser.
 */
export const PUT = route(
  async (req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "pieces");
    if (!evaluationModifiable(d.statut)) throw new ErreurMetier("Le canevas ne peut plus être modifié une fois le dossier soumis.", 409, "verrouille");
    const { piece, reponses } = Schema.parse(await corps(req));
    const def = definition(piece);
    if (!def) throw new ErreurMetier("Pièce inconnue.", 400, "validation");
    const rep = nettoyerReponses(piece, reponses);
    const dico = DICTIONNAIRES[ctx.langue] ?? DICTIONNAIRES.fr;
    const typeLib = (await prisma.listeValeur.findFirst({ where: { liste: "type_document", code: piece } }))?.libelle;
    const titre = `${traduire(dico, "pieces.canevas.titre")} — ${libelle(typeLib, ctx.langue) || piece}`;
    const client = await prisma.client.findUniqueOrThrow({ where: { id: d.clientId }, select: { raisonSociale: true } });
    const texte = rendreCanevas(
      titre,
      [`${client.raisonSociale} · ${d.reference}`, `${traduire(dico, "pieces.canevas.recueilli", { date: new Date().toLocaleDateString(ctx.langue) })}`],
      def.champs.map((ch) => ({ libelle: traduire(dico, `pieces.champs.${ch.code}`), valeur: rep[ch.code] ?? "" }))
    );
    const octets = Buffer.from(texte, "utf8");
    const analyse = JSON.stringify(analyseDepuisCanevas(piece, rep));
    const nom = `Canevas_${piece}.txt`;
    const existant = await prisma.document.findFirst({ where: { dossierId: id, type: "CANEVAS", nom }, select: { id: true } });
    const data = { type: "CANEVAS", nom, mime: "text/plain", taille: octets.length, contenu: octets, texte, analyse, deposeParId: ctx.utilisateur.id };
    if (existant) await prisma.document.update({ where: { id: existant.id }, data });
    else await prisma.document.create({ data: { dossierId: id, ...data } });
    await historiser(id, ctx, "piece", { commentaire: `Canevas — ${piece}` });
    return checklistDossier(id);
  },
  { permission: "dossier:modifier" }
);
