import type { Prisma } from "@prisma/client";
import { calculerCategorie, eieRequise, lirePreseance } from "../domaine/categorisation";
import { emissions, niveauClimat, normaliserAleas, normaliserTransition, qualitePCAF, scoreClimat, scorePhysique, scoreTransition } from "../domaine/climat";
import type { Categorie } from "../domaine/constantes";
import { evaluerDeclenchement } from "../domaine/declenchement";
import { calculerRisque, estRisque, lireSeuils, questionApplicable } from "../domaine/risque";
import { motifsBlocageSoumission, type ControleSoumission } from "../domaine/workflow";
import { libelle } from "../i18n/libelle";
import { booleen, nombre } from "../parametres";
import { lireJson } from "../utils";
import { introuvable, interdit, type Contexte } from "./contexte";
import { versReference } from "./devises";
import { chargerParametres } from "./parametres";
import { ascendance, chargerArbre, peutEcrire, peutLire, seuilHerite } from "./perimetre";
import { prisma } from "./prisma";

// ─── Accès ─────────────────────────────────────────────────────────────────

/**
 * Charge un dossier en vérifiant le périmètre de l'utilisateur. Toutes les routes qui
 * touchent un dossier ou ses dépendances passent par ici : un identifiant deviné
 * n'ouvre jamais le dossier d'une autre entité (OWASP API1 — BOLA).
 */
export async function dossierAutorise(ctx: Contexte, id: string, mode: "lecture" | "ecriture" = "lecture") {
  const d = await prisma.dossier.findUnique({ where: { id } });
  if (!d || !peutLire(ctx.perimetre, d.entiteId)) throw introuvable("Dossier introuvable.");
  if (mode === "ecriture" && !peutEcrire(ctx.perimetre, d.entiteId)) {
    throw interdit("Ce dossier relève d'une entité en consultation seule pour vous.");
  }
  return d;
}

// ─── Référence ─────────────────────────────────────────────────────────────

export async function genererReference(entiteCode: string, date = new Date()): Promise<string> {
  const p = await chargerParametres();
  const prefixe = `${p.PREFIXE_REFERENCE || "SGES"}-${entiteCode}-${date.getFullYear()}-`;
  const derniers = await prisma.dossier.findMany({
    where: { reference: { startsWith: prefixe } },
    select: { reference: true },
    orderBy: { reference: "desc" },
    take: 1,
  });
  const n = derniers.length ? Number(derniers[0].reference.slice(prefixe.length)) || 0 : 0;
  return `${prefixe}${String(n + 1).padStart(5, "0")}`;
}

// ─── Montants et déclenchement ─────────────────────────────────────────────

export async function seuilApplicable(entiteId: string): Promise<number> {
  const p = await chargerParametres();
  const propre = seuilHerite(await chargerArbre(), entiteId);
  if (propre) return (await versReference(propre.seuil, propre.devise)).montant;
  return nombre(p, "SEUIL_DECLENCHEMENT", 10_000_000);
}

export async function estCreditInvestissement(typeCredit: string | null | undefined): Promise<boolean | undefined> {
  if (!typeCredit) return undefined;
  const v = await prisma.listeValeur.findUnique({ where: { liste_code: { liste: "type_credit", code: typeCredit } } });
  if (!v) return undefined;
  const extra = lireJson<{ investissement?: boolean }>(v.extra, {});
  return extra.investissement;
}

// ─── Recalcul ──────────────────────────────────────────────────────────────

/** Questions applicables au dossier, avec leur thématique. */
export async function questionsApplicables(categorie: string | null, codeSecteur: string | null) {
  if (!categorie) return [];
  const questions = await prisma.question.findMany({
    where: { actif: true, bloc: { actif: true, thematique: { actif: true } } },
    include: { bloc: { include: { thematique: true } } },
    orderBy: [{ bloc: { thematique: { ordre: "asc" } } }, { bloc: { ordre: "asc" } }, { ordre: "asc" }],
  });
  return questions.filter((q) => questionApplicable(q, categorie, codeSecteur));
}

/**
 * Recalcule tout ce qui se déduit des saisies : montants en devise de référence,
 * déclenchement, catégorie, risques E&S, volet climat. Idempotent ; appelé après
 * chaque enregistrement d'un volet.
 */
export async function recalculer(dossierId: string): Promise<void> {
  const p = await chargerParametres();
  const d = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    include: { secteur: true, region: true, climat: true, reponsesCategorisation: { include: { question: true } }, reponsesExclusion: { include: { critere: true } } },
  });

  // Montants : le cours est figé à la date du dossier (traçabilité de la décision).
  const demande = await versReference(d.montantDemande, d.deviseCode, d.dateDossier);
  const investRef = d.montantInvestissement ? d.montantInvestissement * demande.taux : null;

  // Catégorisation
  const questionsCat = await prisma.questionCategorisation.findMany({ where: { actif: true } });
  const reponsesCat = Object.fromEntries(d.reponsesCategorisation.map((r) => [r.questionId, r.reponse]));
  const cat = calculerCategorie(questionsCat, reponsesCat, lirePreseance(p.PRESEANCE_CATEGORIES));
  const categorie = (d.categorie as Categorie | null) ?? null;
  const categorieRetenue = d.justificationCategorie && categorie ? categorie : cat.categorie;

  // Déclenchement
  const decl = evaluerDeclenchement({
    categorie: categorieRetenue,
    elementListeA: cat.positifs.A.length > 0,
    montantInvestissementRef: investRef,
    montantDemandeRef: demande.montant,
    seuil: await seuilApplicable(d.entiteId),
    creditInvestissement: await estCreditInvestissement(d.typeCredit),
  });

  // Exclusion
  const criteresActifs = await prisma.critereExclusion.count({ where: { actif: true } });
  const repExcl = d.reponsesExclusion.filter((r) => r.critere.actif);
  const exclusionVerifiee = criteresActifs > 0 && repExcl.length >= criteresActifs;
  const exclu = repExcl.some((r) => r.reponse);

  // Risques E&S
  const questions = await questionsApplicables(categorieRetenue, d.secteur?.code ?? null);
  const reponses = await prisma.reponseQuestion.findMany({ where: { dossierId } });
  const valeurs = Object.fromEntries(reponses.map((r) => [r.questionId, r.valeur]));
  const risque = calculerRisque(
    questions.map((q) => ({ id: q.id, type: q.type, reponseRisque: q.reponseRisque, gravite: q.gravite, thematique: q.bloc.thematique.code, obligatoire: q.obligatoire })),
    valeurs,
    { categorie: categorieRetenue, seuils: lireSeuils(p.SEUILS_NIVEAU_RISQUE), releverCategorieA: booleen(p, "RELEVER_NIVEAU_CATEGORIE_A") }
  );
  // Indicateur « risque » de chaque réponse (sert la fiche et le plan d'actions).
  const parId = new Map(questions.map((q) => [q.id, q]));
  for (const r of reponses) {
    const q = parId.get(r.questionId);
    const flag = q ? estRisque(q, r.valeur) : false;
    if (flag !== r.risque) await prisma.reponseQuestion.update({ where: { id: r.id }, data: { risque: flag } });
  }

  // Climat
  if (d.climat) {
    const c = d.climat;
    const aleas = normaliserAleas(lireJson(c.aleas, {}));
    const transition = normaliserTransition(lireJson(c.transition, {}));
    const sp = scorePhysique(aleas, c.sensibilite, c.capaciteAdaptation);
    const st = scoreTransition({
      risqueSecteur: d.secteur?.risqueTransition ?? 1,
      facteurs: transition,
      expositionCBAM: c.expositionCBAM,
      partExportUE: c.partExportUE,
      alignement: c.alignementTaxonomie,
    });
    const sc = scoreClimat(sp, st);
    const em = emissions({
      methode: c.methodeEmissions,
      scope1: c.scope1,
      scope2: c.scope2,
      scope3: c.scope3,
      facteurSecteur: d.secteur?.facteurEmission ?? 0,
      montantInvestissementRef: investRef,
      montantFinanceRef: demande.montant,
    });
    await prisma.evaluationClimat.update({
      where: { id: c.id },
      data: {
        scorePhysique: sp,
        scoreTransition: st,
        scoreClimat: sc,
        niveauClimat: niveauClimat(sc),
        emissionsFinancees: em.financees,
        qualitePCAF: c.methodeEmissions === "declaree" ? Math.min(c.qualitePCAF, 2) : qualitePCAF(c.methodeEmissions),
      },
    });
  }

  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      tauxReference: demande.taux,
      montantDemandeRef: demande.montant,
      montantInvestissementRef: investRef,
      evaluationObligatoire: decl.obligatoire,
      motifDeclenchement: decl.motifs.join(","),
      exclusionVerifiee,
      exclu,
      categorieCalculee: cat.categorie,
      categorie: categorieRetenue,
      sousCategorieFI: categorieRetenue === "FI" ? d.sousCategorieFI : null,
      eieRequise: eieRequise(categorieRetenue),
      scoreRisque: categorieRetenue && risque.nbRepondues > 0 ? risque.score : null,
      niveauRisque: categorieRetenue && risque.nbRepondues > 0 ? risque.niveau : null,
      nbRisquesNonMaitrises: risque.nbRisques,
      evaluationTerminee: !!categorieRetenue && questions.length > 0 && risque.complet,
    },
  });
}

// ─── Plan d'actions ────────────────────────────────────────────────────────

/**
 * Génère les actions correctives proposées par le système (procédure §3.5) à partir des
 * réponses qui signalent un risque non maîtrisé. Les actions déjà négociées ou suivies
 * sont conservées ; les propositions devenues sans objet (risque levé) et jamais
 * négociées sont retirées.
 */
export async function genererPlan(dossierId: string, langue = "fr"): Promise<{ ajoutees: number; retirees: number }> {
  const d = await prisma.dossier.findUniqueOrThrow({ where: { id: dossierId }, include: { secteur: true } });
  const questions = await questionsApplicables(d.categorie, d.secteur?.code ?? null);
  const applicables = new Set(questions.map((q) => q.id));
  const reponses = await prisma.reponseQuestion.findMany({ where: { dossierId, risque: true } });
  const enRisque = reponses.filter((r) => applicables.has(r.questionId)).map((r) => r.questionId);
  const modeles = await prisma.modeleAction.findMany({
    where: { questionId: { in: enRisque }, actif: true },
    include: { question: { include: { bloc: { include: { thematique: true } } } } },
    orderBy: [{ question: { ordre: "asc" } }, { ordre: "asc" }],
  });
  const existantes = await prisma.action.findMany({ where: { dossierId, origine: "systeme" } });
  const parModele = new Map(existantes.filter((a) => a.modeleId).map((a) => [a.modeleId!, a]));

  let ajoutees = 0;
  let ordre = existantes.length;
  const base = d.dateDossier;
  for (const m of modeles) {
    if (parModele.has(m.id)) continue;
    const echeance = m.delaiMois ? new Date(base.getFullYear(), base.getMonth() + m.delaiMois, base.getDate()) : null;
    await prisma.action.create({
      data: {
        dossierId,
        questionId: m.questionId,
        modeleId: m.id,
        origine: "systeme",
        thematique: m.question.bloc.thematique.code,
        // Le libellé est figé dans la langue du chargé : le plan négocié avec le client
        // ne doit pas changer si le référentiel évolue ensuite.
        libelle: libelle(m.libelle, langue),
        horizon: m.horizon,
        negociable: true,
        dateEcheance: echeance,
        periode: m.delaiMois ? `${m.delaiMois}` : null,
        ordre: ordre++,
      },
    });
    ajoutees++;
  }

  const modelesVoulus = new Set(modeles.map((m) => m.id));
  const obsoletes = existantes.filter(
    (a) => a.modeleId && !modelesVoulus.has(a.modeleId) && a.retenue === null && a.avancement === 0
  );
  if (obsoletes.length) await prisma.action.deleteMany({ where: { id: { in: obsoletes.map((a) => a.id) } } });

  const total = await prisma.action.count({ where: { dossierId } });
  await prisma.dossier.update({ where: { id: dossierId }, data: { planActionPropose: total > 0 } });
  return { ajoutees, retirees: obsoletes.length };
}

// ─── Notifications réglementaires ──────────────────────────────────────────

/**
 * Notifie les titulaires d'une permission dont l'entité couvre le dossier (son entité ou
 * une entité mère), ainsi que les titulaires sans entité (fonctions groupe).
 */
export async function notifierPermission(dossierId: string, permission: string, type: string, titre: string, message: string, exclure?: string): Promise<number> {
  const d = await prisma.dossier.findUnique({ where: { id: dossierId }, select: { entiteId: true } });
  if (!d) return 0;
  const chaine = ascendance(await chargerArbre(), d.entiteId).map((e) => e.id);
  const roles = await prisma.role.findMany({ select: { id: true, permissions: true } });
  const ids = roles.filter((r) => lireJson<string[]>(r.permissions, []).includes(permission)).map((r) => r.id);
  if (!ids.length) return 0;
  const destinataires = await prisma.utilisateur.findMany({
    where: { isActive: true, roleId: { in: ids }, OR: [{ entiteId: null }, { entiteId: { in: chaine } }] },
    select: { id: true },
  });
  let n = 0;
  for (const u of destinataires) {
    if (u.id === exclure) continue;
    // Pas de doublon pour le même événement encore non lu (enregistrements répétés).
    const deja = await prisma.notification.findFirst({ where: { destinataireId: u.id, dossierId, type, lu: false } });
    if (deja) continue;
    await prisma.notification.create({ data: { destinataireId: u.id, dossierId, type, titre, message, lien: `/dossiers/${dossierId}` } });
    n++;
  }
  return n;
}

/**
 * Notifications réglementaires au Responsable Social et Environnemental (procédure,
 * « Règles de gestion ») : exclusion, catégorie A, changement d'une catégorie A.
 */
export function notifierRSE(dossierId: string, type: string, titre: string, message: string): Promise<number> {
  return notifierPermission(dossierId, "notification:rse", type, titre, message);
}

export async function notifierUtilisateur(destinataireId: string | null | undefined, dossierId: string, type: string, titre: string, message: string) {
  if (!destinataireId) return;
  await prisma.notification.create({ data: { destinataireId, dossierId, type, titre, message, lien: `/dossiers/${dossierId}` } });
}

// ─── Contrôles ─────────────────────────────────────────────────────────────

export async function controleSoumission(dossierId: string) {
  const p = await chargerParametres();
  const d = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    include: { climat: true, actions: true, documents: { select: { type: true } }, reponsesExclusion: { include: { critere: true } } },
  });
  const identification = !!(d.clientId && d.montantDemande > 0 && d.typeCredit && d.secteurId && (d.regionId || d.localite));
  const plan =
    d.actions.length === 0 ||
    d.actions.every((a) => !a.negociable || a.retenue !== null);
  const c: ControleSoumission = {
    identification,
    exclusion: d.exclusionVerifiee,
    exclusionBloquante: d.reponsesExclusion.some((r) => r.reponse && r.critere.bloquant && r.critere.actif),
    categorisation: !!d.categorie && (d.categorie !== "FI" || !!d.sousCategorieFI),
    evaluation:
      d.evaluationTerminee && (!booleen(p, "COMMENTAIRE_EVALUATION_OBLIGATOIRE") || !!d.commentaireEvaluation?.trim()),
    climat: !booleen(p, "VOLET_CLIMAT_ACTIF") || !!d.climat,
    plan,
    eie: d.documents.some((x) => x.type === "EIES"),
  };
  const motifs = motifsBlocageSoumission(c, {
    climatObligatoire: booleen(p, "VOLET_CLIMAT_ACTIF") && booleen(p, "VOLET_CLIMAT_OBLIGATOIRE"),
    eieObligatoire: d.categorie === "A" && booleen(p, "EIE_OBLIGATOIRE_CATEGORIE_A"),
  });
  return { controles: c, motifs };
}

export async function historiser(
  dossierId: string,
  ctx: Contexte | null,
  evenement: string,
  extra: { deStatut?: string; versStatut?: string; commentaire?: string | null } = {}
) {
  await prisma.historiqueDossier.create({
    data: {
      dossierId,
      auteurId: ctx?.utilisateur.id ?? null,
      auteurNom: ctx ? `${ctx.utilisateur.prenom} ${ctx.utilisateur.nom}` : "système",
      evenement,
      deStatut: extra.deStatut ?? null,
      versStatut: extra.versStatut ?? null,
      commentaire: extra.commentaire ?? null,
    },
  });
}

/** Inclusion standard pour l'affichage complet d'un dossier. */
export const INCLUSION_DOSSIER = {
  entite: true,
  client: { include: { secteur: true } },
  charge: { select: { id: true, nom: true, prenom: true, matricule: true, email: true } },
  valideur: { select: { id: true, nom: true, prenom: true } },
  secteur: true,
  region: true,
  climat: true,
  precedent: { select: { id: true, reference: true } },
} satisfies Prisma.DossierInclude;
