import type { Prisma } from "@prisma/client";
import { calculerCategorie, eieRequise, lirePreseance } from "../domaine/categorisation";
import { baseAttribution, emissions, evaluerClimat, lirePonderation, lirePrixCarbone, scenariosClimat, lireSeuilsClimat, METHODE_CLIMAT_VERSION, normaliserAleas, normaliserTransition, qualitePCAF } from "../domaine/climat";
import type { Categorie } from "../domaine/constantes";
import { evaluerDeclenchement } from "../domaine/declenchement";
import { reponseBloquante } from "../domaine/exclusion";
import { codes, modulesRetenus, niveauQuestionnaire, questionPosee, type NiveauQuestionnaire } from "../domaine/questionnaire";
import { calculerRisque, estRisque, lireSeuils, questionApplicable } from "../domaine/risque";
import { motifsBlocageSoumission, type ControleSoumission } from "../domaine/workflow";
import { libelle } from "../i18n/libelle";
import { booleen, nombre } from "../parametres";
import { lireJson } from "../utils";
import { ErreurMetier, introuvable, interdit, type Contexte } from "./contexte";
import { arrondirMontant } from "../devises";
import { versReference } from "./devises";
import { versionReferentiel } from "./referentiel-version";
import { chargerParametres } from "./parametres";
import { ascendance, chargerArbre, peutEcrire, peutLire, seuilHerite } from "./perimetre";
import { prisma, type Tx } from "./prisma";

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

/** Questions de la catégorie et du secteur, avec leur thématique (sans filtre de niveau). */
async function questionsDeCategorie(categorie: string | null, codeSecteur: string | null) {
  if (!categorie) return [];
  const questions = await prisma.question.findMany({
    where: { actif: true, bloc: { actif: true, thematique: { actif: true } } },
    include: { bloc: { include: { thematique: true } } },
    orderBy: [{ bloc: { thematique: { ordre: "asc" } } }, { bloc: { ordre: "asc" } }, { ordre: "asc" }],
  });
  return questions.filter((q) => questionApplicable(q, categorie, codeSecteur));
}

export interface Questionnaire {
  niveau: NiveauQuestionnaire;
  modules: string[];
  exigencesSFI: boolean;
  /** Questions de la catégorie (questionnaire complet) et questions effectivement posées. */
  total: number;
  posees: number;
}

/**
 * Niveau du questionnaire et modules d'activité retenus pour le dossier (paramètres
 * QUESTIONNAIRE_NIVEAU_*, lignes de financement imposant les normes SFI, Principes de l'Équateur,
 * décision RSE). Figés à la soumission : un changement de paramétrage ne modifie pas un dossier soumis.
 */
async function reglageQuestionnaire(dossierId: string, categorie: string | null) {
  const p = await chargerParametres();
  const d = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    select: {
      statut: true, typeZone: true, natureProjet: true, ligneFinancement: true, principesEquateur: true, questionnaireComplet: true,
      niveauQuestionnaire: true, modulesQuestionnaire: true, secteur: { select: { code: true } }, region: { select: { stressHydrique: true } },
    },
  });
  const modules = await prisma.moduleQuestionnaire.findMany({ where: { actif: true } });
  const connus = modules.map((m) => m.code);
  const exigencesSFI = d.principesEquateur || (!!d.ligneFinancement && codes(p.LIGNES_EXIGENCES_SFI).includes(d.ligneFinancement));
  if (d.statut !== "brouillon" && d.niveauQuestionnaire) {
    return { niveau: d.niveauQuestionnaire as NiveauQuestionnaire, retenus: codes(d.modulesQuestionnaire), connus, exigencesSFI };
  }
  const niveau = niveauQuestionnaire(categorie, { parametre: categorie ? p[`QUESTIONNAIRE_NIVEAU_${categorie}`] : null, exigencesSFI, complet: d.questionnaireComplet });
  // Effectif déclaré dans le questionnaire (question paramétrable) : inconnu tant qu'il n'est pas saisi.
  const rep = await prisma.reponseQuestion.findFirst({ where: { dossierId, question: { code: p.QUESTION_EFFECTIF || "SIG01" } }, select: { valeur: true } });
  const effectif = rep?.valeur != null && rep.valeur !== "" && Number.isFinite(Number(rep.valeur)) ? Number(rep.valeur) : null;
  const retenus = modulesRetenus(modules, {
    codeSecteur: d.secteur?.code ?? null,
    typeZone: d.typeZone,
    natureProjet: d.natureProjet,
    effectif,
    stressHydrique: d.region?.stressHydrique ?? null,
    equateur: d.principesEquateur,
  });
  return { niveau, retenus, connus, exigencesSFI };
}

/** Questions posées au dossier selon sa catégorie, son secteur et le niveau de questionnaire retenu. */
export async function questionsApplicables(dossierId: string, categorie: string | null, codeSecteur: string | null) {
  const toutes = await questionsDeCategorie(categorie, codeSecteur);
  const r = await reglageQuestionnaire(dossierId, categorie);
  const questions = toutes.filter((q) => questionPosee(q, r.niveau, r.retenus, r.connus));
  const questionnaire: Questionnaire = { niveau: r.niveau, modules: r.retenus, exigencesSFI: r.exigencesSFI, total: toutes.length, posees: questions.length };
  return Object.assign(questions, { questionnaire });
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

  // Après soumission, l'évaluation (catégorie, risque, scores climat) est FIGÉE : un changement de
  // référentiel ou de paramètre ne la modifie plus. Seule la base PCAF des émissions financées suit
  // la vie du crédit (montant accordé, encours).
  const evaluationFigee = d.statut !== "brouillon";

  // Montants : le cours est figé à la date du dossier (traçabilité de la décision).
  // Cours figé : une fois le cours de la date du dossier retenu pour une devise, il ne bouge plus
  // (seuil de déclenchement et contre-valeurs reproductibles). Changer de devise refait la recherche.
  const decRef = (await prisma.devise.findUnique({ where: { code: p.DEVISE_REFERENCE || "MAD" }, select: { decimales: true } }))?.decimales ?? 2;
  const fige = d.deviseCoursReference === d.deviseCode || (evaluationFigee && d.tauxReference > 0);
  const cours = fige
    ? { taux: d.tauxReference, dateCours: d.dateCoursReference, source: d.sourceCoursReference }
    : await versReference(1, d.deviseCode, d.dateDossier);
  const demande = { montant: arrondirMontant(d.montantDemande * cours.taux, decRef), taux: cours.taux };
  const investRef = d.montantInvestissement ? arrondirMontant(d.montantInvestissement * demande.taux, decRef) : null;

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
  const questions = await questionsApplicables(dossierId, categorieRetenue, d.secteur?.code ?? null);
  const reponses = await prisma.reponseQuestion.findMany({ where: { dossierId } });
  const valeurs = Object.fromEntries(reponses.map((r) => [r.questionId, r.valeur]));
  const risque = calculerRisque(
    questions.map((q) => ({ id: q.id, type: q.type, reponseRisque: q.reponseRisque, gravite: q.gravite, thematique: q.bloc.thematique.code, obligatoire: q.obligatoire })),
    valeurs,
    { categorie: categorieRetenue, seuils: lireSeuils(p.SEUILS_NIVEAU_RISQUE), releverCategorieA: booleen(p, "RELEVER_NIVEAU_CATEGORIE_A") }
  );
  // Indicateur « risque » de chaque réponse (sert la fiche et le plan d'actions).
  const parId = new Map(questions.map((q) => [q.id, q]));
  for (const r of evaluationFigee ? [] : reponses) {
    const q = parId.get(r.questionId);
    const flag = q ? estRisque(q, r.valeur) : false;
    if (flag !== r.risque) await prisma.reponseQuestion.update({ where: { id: r.id }, data: { risque: flag } });
  }

  // Climat
  if (d.climat) {
    const c = d.climat;
    const r = evaluerClimat(
      {
        aleas: normaliserAleas(lireJson(c.aleas, {})),
        transition: normaliserTransition(lireJson(c.transition, {})),
        sensibilite: c.sensibilite,
        capaciteAdaptation: c.capaciteAdaptation,
        risqueSecteur: d.secteur?.risqueTransition ?? 1,
        expositionCBAM: c.expositionCBAM,
        partExportUE: c.partExportUE,
        alignement: c.alignementTaxonomie,
      },
      { couvertureMin: nombre(p, "CLIMAT_COUVERTURE_MIN", 0.75), ponderation: lirePonderation(p.CLIMAT_PONDERATION), seuils: lireSeuilsClimat(p.CLIMAT_SEUILS_NIVEAUX) }
    );
    // Base PCAF : encours à date, sinon montant accordé, sinon montant demandé (les trois restent tracés).
    const base = baseAttribution({
      decision: d.decision,
      montantDemandeRef: demande.montant,
      montantAccordeRef: d.montantAccorde !== null ? arrondirMontant(d.montantAccorde * demande.taux, decRef) : null,
      encoursRef: d.encours !== null ? arrondirMontant(d.encours * demande.taux, decRef) : null,
      dateEncours: d.dateEncours,
      dateComite: d.dateComite,
      dateDossier: d.dateDossier,
    });
    const em = emissions({
      methode: c.methodeEmissions,
      scope1: c.scope1,
      scope2: c.scope2,
      scope3: c.scope3,
      facteurSecteur: d.secteur?.facteurEmission ?? 0,
      montantInvestissementRef: investRef,
      montantFinanceRef: base.montantRef,
    });
    await prisma.evaluationClimat.update({
      where: { id: c.id },
      data: {
        ...(evaluationFigee
          ? {}
          : {
              scorePhysique: r.physique,
              scoreTransition: r.transition,
              scoreClimat: r.score,
              niveauClimat: r.niveau,
              couvertureDonnees: r.couverture,
              methodeVersion: METHODE_CLIMAT_VERSION,
            }),
        emissionsFinancees: em.financees,
        baseAttribution: base.base,
        montantAttribueRef: base.montantRef,
        facteurAttribution: em.attribution,
        dateArrete: base.dateArrete,
        ...(evaluationFigee
          ? {}
          : {
              qualitePCAF: qualitePCAF(c.methodeEmissions, c.emissionsVerifiees, !!c.sourceEmissions?.trim()),
              scenarios: JSON.stringify(
                scenariosClimat({
                  aleas: normaliserAleas(lireJson(c.aleas, {})),
                  sensibilite: c.sensibilite,
                  capaciteAdaptation: c.capaciteAdaptation,
                  emissionsTotales: em.totales,
                  emissionsDirectes: c.methodeEmissions !== "estimee_secteur" ? c.scope1 : null,
                  facteurCBAM: nombre(p, "CLIMAT_CBAM_FACTEUR", 0.485),
                  expositionCBAM: c.expositionCBAM,
                  partExportUE: c.partExportUE,
                  prix: lirePrixCarbone(p.CLIMAT_PRIX_CARBONE),
                  prixETS: nombre(p, "CLIMAT_PRIX_ETS", 850),
                  ebeRef: c.ebeAnnuel !== null ? arrondirMontant(c.ebeAnnuel * demande.taux, decRef) : null,
                  seuilEBE: nombre(p, "CLIMAT_SEUIL_EBE", 10) / 100,
                })
              ),
            }),
      },
    });
  }
  if (evaluationFigee) return;

  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      tauxReference: demande.taux,
      deviseCoursReference: d.deviseCode,
      dateCoursReference: cours.dateCours,
      sourceCoursReference: cours.source,
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
      niveauQuestionnaire: categorieRetenue ? questions.questionnaire.niveau : null,
      modulesQuestionnaire: categorieRetenue ? questions.questionnaire.modules.join(",") : null,
      versionReferentiel: await versionReferentiel(p),
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
  const questions = await questionsApplicables(dossierId, d.categorie, d.secteur?.code ?? null);
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
    include: { climat: true, actions: true, documents: { select: { type: true } }, reponsesExclusion: { include: { critere: true } }, reponsesCategorisation: { select: { questionId: true } } },
  });
  // Procédure : les 25 éléments de catégorisation sont à vérifier. Un « oui » A pré-classe le projet
  // immédiatement (EIES exigée, RSE notifié) mais ne dispense pas de répondre aux autres éléments.
  const elementsActifs = await prisma.questionCategorisation.findMany({ where: { actif: true }, select: { id: true } });
  const repondus = new Set(d.reponsesCategorisation.map((r) => r.questionId));
  const categorisationComplete = elementsActifs.length > 0 && elementsActifs.every((q) => repondus.has(q.id));
  const identification = !!(d.clientId && d.montantDemande > 0 && d.typeCredit && d.secteurId && (d.regionId || d.localite));
  const plan =
    d.actions.length === 0 ||
    d.actions.every((a) => !a.negociable || a.retenue !== null);
  const c: ControleSoumission = {
    identification,
    exclusion: d.exclusionVerifiee,
    exclusionBloquante: d.reponsesExclusion.some((r) => reponseBloquante(r, r.critere)),
    categorisation: !!d.categorie && (d.categorie !== "FI" || !!d.sousCategorieFI),
    categorisationComplete,
    evaluation:
      d.evaluationTerminee && (!booleen(p, "COMMENTAIRE_EVALUATION_OBLIGATOIRE") || !!d.commentaireEvaluation?.trim()),
    climat: !booleen(p, "VOLET_CLIMAT_ACTIF") || (!!d.climat && d.climat.niveauClimat !== "insuffisant"),
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
  extra: { deStatut?: string; versStatut?: string; commentaire?: string | null } = {},
  db: Tx = prisma
) {
  await db.historiqueDossier.create({
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

/**
 * Précondition de version (écritures concurrentes) : si le client indique la version du dossier
 * qu'il a lue et que le dossier a changé depuis, l'enregistrement est refusé plutôt que d'écraser.
 */
export function exigerVersion(d: { updatedAt: Date }, version: string | null | undefined) {
  if (!version) return;
  if (new Date(version).getTime() !== d.updatedAt.getTime()) {
    throw new ErreurMetier("Le dossier a été modifié par un autre utilisateur depuis son affichage : rechargez la page avant d'enregistrer.", 409, "conflit");
  }
}
