import type { Dossier } from "@prisma/client";
import { evaluationModifiable, planModifiable, transitionsPossibles, visitesModifiables } from "../domaine/workflow";
import { booleen } from "../parametres";
import { ErreurMetier, type Contexte } from "./contexte";
import { controleSoumission, seuilApplicable } from "./dossiers";
import { chargerParametres } from "./parametres";
import { peutEcrire } from "./perimetre";
import { prisma } from "./prisma";

/** Droits de l'utilisateur sur un dossier, selon son rôle, son périmètre et le statut. */
export function droitsDossier(ctx: Contexte, d: Pick<Dossier, "statut" | "entiteId" | "chargeId" | "creeParId">) {
  const ecriture = peutEcrire(ctx.perimetre, d.entiteId);
  const p = ctx.permissions;
  return {
    ecriture,
    evaluation: ecriture && p.includes("dossier:modifier") && evaluationModifiable(d.statut),
    plan: ecriture && (p.includes("dossier:modifier") || p.includes("plan:suivre")) && planModifiable(d.statut),
    visites: ecriture && p.includes("visite:gerer") && visitesModifiables(d.statut),
    pieces: ecriture && (p.includes("dossier:modifier") || p.includes("visite:gerer")) && d.statut !== "annule",
    reclasser: p.includes("dossier:reclassifier") && evaluationModifiable(d.statut),
    deroger: p.includes("exclusion:deroger") && evaluationModifiable(d.statut),
    decider: ecriture && p.includes("dossier:decider") && d.statut === "valide",
    supprimer: ecriture && d.statut === "brouillon" && (p.includes("dossier:supprimer") || d.creeParId === ctx.utilisateur.id),
    transitions: ecriture ? transitionsPossibles(d.statut, p) : [],
  };
}

export type Volet = "evaluation" | "plan" | "visites" | "pieces";

/** Refuse l'écriture d'un volet hors statut ou hors droits. */
export function exigerVolet(ctx: Contexte, d: Pick<Dossier, "statut" | "entiteId" | "chargeId" | "creeParId">, volet: Volet) {
  if (!droitsDossier(ctx, d)[volet]) {
    throw new ErreurMetier("Ce volet n'est pas modifiable au statut actuel du dossier ou avec vos droits.", 409, "verrouille");
  }
}

/** Avancement des étapes (affichage du parcours). */
export async function etatEtapes(dossierId: string) {
  const p = await chargerParametres();
  const d = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    include: { climat: { select: { id: true } }, _count: { select: { actions: true, visites: true } } },
  });
  const { controles, motifs } = await controleSoumission(dossierId);
  const apresSoumission = !["brouillon"].includes(d.statut);
  return {
    etapes: {
      identification: controles.identification,
      exclusion: controles.exclusion,
      categorisation: controles.categorisation && controles.categorisationComplete,
      evaluation: controles.evaluation,
      climat: !booleen(p, "VOLET_CLIMAT_ACTIF") || controles.climat,
      plan: controles.evaluation && controles.plan,
      fiche: apresSoumission,
      decision: !!d.decision,
      suivi: d.statut === "cloture",
    },
    motifsBlocage: motifs,
    seuil: await seuilApplicable(d.entiteId),
  };
}
