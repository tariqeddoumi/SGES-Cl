import { ErreurMetier } from "./contexte";
import { ecrireLibelle, lireLibelle } from "../i18n/libelle";
import type { DefReferentiel } from "../referentiels-admin";
import { prisma } from "./prisma";

/** Accès générique au délégué Prisma d'un référentiel (les modèles partagent la même interface CRUD). */
export function delegue(def: DefReferentiel) {
  return (prisma as unknown as Record<string, {
    findMany: (a: unknown) => Promise<Record<string, unknown>[]>;
    create: (a: unknown) => Promise<Record<string, unknown>>;
    update: (a: unknown) => Promise<Record<string, unknown>>;
    delete: (a: unknown) => Promise<unknown>;
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
  }>)[def.modele];
}

/** Contrôle et conversion des valeurs saisies selon la définition des champs. */
export function valeursPropres(def: DefReferentiel, brut: Record<string, unknown>, creation: boolean): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  const erreurs: { champ: string; message: string }[] = [];
  for (const c of def.champs) {
    if (!(c.nom in brut)) {
      if (creation && c.requis) erreurs.push({ champ: c.nom, message: "obligatoire" });
      continue;
    }
    if (!creation && c.fige) continue;
    const v = brut[c.nom];
    switch (c.type) {
      case "libelle":
      case "libelleLong": {
        const l = lireLibelle(v as Record<string, string> | string);
        if (c.requis && !Object.values(l).some((x) => x?.trim())) erreurs.push({ champ: c.nom, message: "obligatoire" });
        sortie[c.nom] = ecrireLibelle(l);
        break;
      }
      case "nombre":
      case "entier":
      case "echelle": {
        if (v === "" || v === null) {
          if (c.requis) erreurs.push({ champ: c.nom, message: "obligatoire" });
          sortie[c.nom] = null;
          break;
        }
        const n = Number(v);
        const min = c.type === "echelle" ? 0 : c.min;
        const max = c.type === "echelle" ? 4 : c.max;
        if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max) || (c.type !== "nombre" && !Number.isInteger(n))) {
          erreurs.push({ champ: c.nom, message: "invalide" });
        } else sortie[c.nom] = n;
        break;
      }
      case "booleen":
        sortie[c.nom] = v === true || v === "true";
        break;
      case "choix":
        if (v === "" || v === null) {
          if (c.requis) erreurs.push({ champ: c.nom, message: "obligatoire" });
          sortie[c.nom] = null;
        } else if (!c.choix?.includes(String(v))) erreurs.push({ champ: c.nom, message: "invalide" });
        else sortie[c.nom] = String(v);
        break;
      case "date": {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) erreurs.push({ champ: c.nom, message: "invalide" });
        else sortie[c.nom] = d;
        break;
      }
      default: {
        const s = v === null || v === undefined ? "" : String(v).trim();
        if (c.requis && !s) erreurs.push({ champ: c.nom, message: "obligatoire" });
        else if (s.length > 4000) erreurs.push({ champ: c.nom, message: "trop long" });
        else sortie[c.nom] = s || null;
      }
    }
  }
  if (erreurs.length) throw new ErreurMetier("Données invalides.", 400, "validation", erreurs);
  return sortie;
}

/** Nombre d'utilisations d'un élément (refus de suppression s'il est utilisé). */
export async function utilisations(def: DefReferentiel, element: Record<string, unknown>): Promise<number> {
  switch (def.modele) {
    case "secteur":
      return (await prisma.dossier.count({ where: { secteurId: String(element.id) } })) + (await prisma.client.count({ where: { secteurId: String(element.id) } }));
    case "region":
      return prisma.dossier.count({ where: { regionId: String(element.id) } });
    case "critereExclusion":
      return prisma.reponseExclusion.count({ where: { critereId: String(element.id) } });
    case "questionCategorisation":
      return prisma.reponseCategorisation.count({ where: { questionId: String(element.id) } });
    case "thematique":
      return prisma.bloc.count({ where: { thematiqueId: String(element.id) } });
    case "devise":
      return prisma.dossier.count({ where: { deviseCode: String(element.code) } });
    case "listeValeur": {
      const champ: Record<string, string> = { type_credit: "typeCredit", nature_projet: "natureProjet", type_zone: "typeZone", comite: "comite", motif_rejet: "motifRejetCode" };
      const f = champ[String(element.liste)];
      return f ? prisma.dossier.count({ where: { [f]: String(element.code) } }) : 0;
    }
    default:
      return 0;
  }
}
