import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Contexte } from "./contexte";
import { chargerParametres } from "./parametres";

export const sha256 = (donnees: string | Uint8Array) => createHash("sha256").update(donnees).digest("hex");

export type TypeSnapshot = "soumission" | "validation" | "decision";

/**
 * Instantané immuable du dossier tel qu'il est présenté au validateur et au comité : saisies, résultats,
 * questionnaire effectivement posé (libellés, gravités), plan d'actions, pièces avec empreinte SHA-256 et
 * paramètres de calcul. Il permet de reproduire la décision même si le référentiel, le plan ou les pièces
 * évoluent ensuite. Écrit dans la transaction de la transition : pas d'instantané, pas de transition.
 */
export async function figerSnapshot(db: Prisma.TransactionClient, dossierId: string, type: TypeSnapshot, ctx: Contexte | null) {
  const p = await chargerParametres();
  const d = await db.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    include: {
      client: true,
      climat: true,
      actions: { orderBy: { ordre: "asc" } },
      reponsesExclusion: { include: { critere: true } },
      reponsesCategorisation: { include: { question: true } },
      documents: { select: { id: true, type: true, nom: true, taille: true, contenu: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });
  const reponses = await db.reponseQuestion.findMany({ where: { dossierId }, include: { question: { include: { bloc: { include: { thematique: true } } } } } });
  const { client, climat, actions, reponsesExclusion, reponsesCategorisation, documents, ...dossier } = d;

  const contenu = JSON.stringify({
    format: 1,
    type,
    figeLe: new Date().toISOString(),
    dossier,
    client: { raisonSociale: client.raisonSociale, compteCourant: client.compteCourant, formeJuridique: client.formeJuridique },
    exclusion: reponsesExclusion.map((r) => ({ code: r.critere.code, libelle: r.critere.libelle, bloquant: r.critere.bloquant, reponse: r.reponse, commentaire: r.commentaire })),
    categorisation: reponsesCategorisation.map((r) => ({ code: r.question.code, categorie: r.question.categorie, libelle: r.question.libelle, reponse: r.reponse })),
    questionnaire: reponses.map((r) => ({
      code: r.question.code,
      thematique: r.question.bloc.thematique.code,
      libelle: r.question.libelle,
      gravite: r.question.gravite,
      reponseRisque: r.question.reponseRisque,
      valeur: r.valeur,
      risque: r.risque,
      commentaire: r.commentaire,
    })),
    climat,
    actions,
    pieces: documents.map(({ contenu: octets, ...x }) => ({ ...x, sha256: sha256(octets) })),
    parametres: Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith("IA_") && !["APP_LOGO_URL"].includes(k))),
  });
  const empreinte = sha256(contenu);
  const version = ((await db.snapshotDossier.aggregate({ where: { dossierId }, _max: { version: true } }))._max.version ?? 0) + 1;
  await db.snapshotDossier.create({
    data: { dossierId, type, version, empreinte, contenu, auteurId: ctx?.utilisateur.id ?? null, auteurNom: ctx ? `${ctx.utilisateur.prenom} ${ctx.utilisateur.nom}` : "système" },
  });
  return { version, empreinte };
}
