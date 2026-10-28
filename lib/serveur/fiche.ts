import type { ResultatESG } from "../domaine/esg";
import { genererClauses } from "../domaine/clauses";
import type { ScenariosClimat } from "../domaine/climat";
import { localeIntl } from "../devises";
import { DICTIONNAIRES, traduire } from "../i18n";
import { libelle } from "../i18n/libelle";
import { lireJson } from "../utils";
import { prisma } from "./prisma";
import { questionsApplicables } from "./dossiers";

/**
 * Fiche d'évaluation du risque environnemental et social (procédure §3.6, annexe 1) :
 * structure unique servie à l'écran d'impression, à l'export et à la plateforme
 * d'octroi de crédit (cahier des charges SGES, « Données récupérées de l'outil SGES »).
 */
export async function construireFiche(dossierId: string, langue = "fr") {
  const d = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossierId },
    include: {
      entite: true,
      client: true,
      charge: true,
      valideur: true,
      secteur: true,
      region: true,
      climat: true,
      reponsesExclusion: { where: { reponse: true }, include: { critere: true } },
      actions: { orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] },
      documents: { select: { id: true, type: true, nom: true, createdAt: true } },
    },
  });
  const L = (t: string | null | undefined) => (t ? libelle(t, langue) : null);
  const valeurListe = async (liste: string, code: string | null | undefined) => {
    if (!code) return null;
    const v = await prisma.listeValeur.findUnique({ where: { liste_code: { liste, code } } });
    return v ? libelle(v.libelle, langue) : code;
  };

  // Problématiques par thématique : maîtrisée (Oui), non maîtrisée (Non), non concernée.
  const questions = await questionsApplicables(d.id, d.categorie, d.secteur?.code ?? null);
  const reponses = await prisma.reponseQuestion.findMany({ where: { dossierId } });
  const parQuestion = new Map(reponses.map((r) => [r.questionId, r]));
  const themes = new Map<string, { code: string; libelle: string; normes: string | null; concernee: boolean; maitrisee: boolean; risques: { code: string; question: string; reponse: string | null; commentaire: string | null }[] }>();
  for (const q of questions) {
    const th = q.bloc.thematique;
    if (th.code === "SIGNALETIQUE") continue;
    const t = themes.get(th.code) ?? { code: th.code, libelle: L(th.libelle)!, normes: th.normes, concernee: false, maitrisee: true, risques: [] };
    const r = parQuestion.get(q.id);
    if (r?.valeur && r.valeur !== "na" && q.reponseRisque) t.concernee = true;
    if (r?.risque) {
      t.maitrisee = false;
      t.risques.push({ code: q.code, question: L(q.libelle)!, reponse: r.valeur, commentaire: r.commentaire });
    }
    themes.set(th.code, t);
  }

  const actions = d.actions.map((a) => ({
    id: a.id,
    origine: a.origine,
    thematique: a.thematique,
    libelle: a.libelle,
    horizon: a.horizon,
    negociable: a.negociable,
    retenue: a.retenue,
    reserveClient: a.reserveClient,
    responsable: a.responsable,
    dateDebut: a.dateDebut,
    dateEcheance: a.dateEcheance,
    periode: a.periode,
    budget: a.budget,
    deviseCode: a.deviseCode,
    avancement: a.avancement,
    statut: a.statut,
    questionId: a.questionId,
  }));

  // Exposition aux risques non maîtrisés : chaque risque et ses mesures correctives.
  const exposition = Array.from(themes.values()).flatMap((t) =>
    t.risques.map((r) => {
      const q = questions.find((x) => x.code === r.code);
      return {
        thematique: t.libelle,
        risque: r.question,
        mesures: actions.filter((a) => a.questionId === q?.id).map((a) => ({ libelle: a.libelle, horizon: a.horizon, retenue: a.retenue })),
      };
    })
  );
  const actionsEIE = actions.filter((a) => a.origine === "eie");

  const climat = d.climat
    ? {
        aleas: lireJson<Record<string, number>>(d.climat.aleas, {}),
        transition: lireJson<Record<string, number>>(d.climat.transition, {}),
        scorePhysique: d.climat.scorePhysique,
        scoreTransition: d.climat.scoreTransition,
        scoreClimat: d.climat.scoreClimat,
        niveauClimat: d.climat.niveauClimat,
        expositionCBAM: d.climat.expositionCBAM,
        emissionsFinancees: d.climat.emissionsFinancees,
        methodeEmissions: d.climat.methodeEmissions,
        qualitePCAF: d.climat.qualitePCAF,
        sourceEmissions: d.climat.sourceEmissions,
        baseAttribution: d.climat.baseAttribution,
        montantAttribueRef: d.climat.montantAttribueRef,
        dateArrete: d.climat.dateArrete,
        couvertureDonnees: d.climat.couvertureDonnees,
        methodeVersion: d.climat.methodeVersion,
        scenarios: lireJson<ScenariosClimat | null>(d.climat.scenarios ?? "", null),
        alignementTaxonomie: d.climat.alignementTaxonomie,
        mesuresAdaptation: d.climat.mesuresAdaptation,
      }
    : null;

  // Clauses E&S du contrat de crédit, déduites du dossier (à valider par la direction juridique).
  const ligneFinancement = await valeurListe("ligne_financement", d.ligneFinancement);
  const dico = DICTIONNAIRES[langue] ?? DICTIONNAIRES.fr;
  const clauses = genererClauses({
    categorie: d.categorie,
    eieRequise: d.eieRequise,
    pieces: d.documents.map((x) => x.type),
    actionsRetenues: d.actions.filter((a) => a.retenue).map((a) => ({ libelle: a.libelle, echeance: a.dateEcheance, horizon: a.horizon, statut: a.statut })),
    reservesComite: d.reservesComite,
    derogations: d.reponsesExclusion.filter((r) => r.derogation).map((r) => ({ code: r.critere.code, justification: r.derogation! })),
    climat: climat ? { niveau: climat.niveauClimat, alerteTransition: !!climat.scenarios?.alerteTransition, expositionCBAM: climat.expositionCBAM, methodeEmissions: climat.methodeEmissions } : null,
    ligneFinancement,
    niveauRisque: d.niveauRisque,
  }).map((c) => {
    const vars = c.vars?.echeance ? { ...c.vars, echeance: new Date(String(c.vars.echeance)).toLocaleDateString(localeIntl(langue), { timeZone: "UTC" }) } : c.vars;
    return { type: c.type, code: c.code, texte: traduire(dico, `clauses.${c.code}`, vars) };
  });

  return {
    version: 1,
    genereLe: new Date().toISOString(),
    langue,
    dossier: { id: d.id, reference: d.reference, statut: d.statut, verrouille: d.verrouille },
    banque: {
      codeBanque: d.entite.code,
      entite: d.entite.nom,
      chargeNom: d.charge ? `${d.charge.prenom} ${d.charge.nom}` : null,
      chargeMatricule: d.charge?.matricule ?? null,
      date: d.dateDossier,
    },
    client: {
      referenceProjet: d.reference,
      raisonSociale: d.client.raisonSociale,
      formeJuridique: await valeurListe("forme_juridique", d.client.formeJuridique),
      comptePortefeuille: d.client.comptePortefeuille,
      compteCourant: d.client.compteCourant,
      typeActivite: L(d.secteur?.libelle),
      codeActivite: d.secteur?.code ?? null,
      contact: d.client.contactNom,
      poste: d.client.contactPoste,
      telephone: d.client.contactTelephone,
      email: d.client.contactEmail,
    },
    lieu: {
      adresseSite: d.adresseSite,
      localite: d.localite,
      region: L(d.region?.libelle),
      typeZone: await valeurListe("type_zone", d.typeZone),
      latitude: d.latitude,
      longitude: d.longitude,
    },
    description: {
      processus: d.descriptionProcessus,
      objet: d.objet,
      natureProjet: await valeurListe("nature_projet", d.natureProjet),
      typeCredit: await valeurListe("type_credit", d.typeCredit),
      projetDeveloppementDurable: d.projetDeveloppementDurable,
      ligneFinancement,
      principesEquateur: d.principesEquateur,
      questionnaire: questions.questionnaire,
      montantDemande: d.montantDemande,
      montantInvestissement: d.montantInvestissement,
      devise: d.deviseCode,
      montantDemandeRef: d.montantDemandeRef,
      tauxReference: d.tauxReference,
    },
    conclusions: {
      evaluationObligatoire: d.evaluationObligatoire,
      motifsDeclenchement: (d.motifDeclenchement ?? "").split(",").filter(Boolean),
      listeExclusion: d.exclu,
      raisonsExclusion: d.reponsesExclusion.map((r) => L(r.critere.libelle)),
      motifExclusion: d.motifExclusion,
      categorie: d.categorie,
      categorieCalculee: d.categorieCalculee,
      sousCategorieFI: d.sousCategorieFI,
      justificationCategorie: d.justificationCategorie,
      eieRequise: d.eieRequise,
      niveauRisque: d.niveauRisque,
      scoreRisque: d.scoreRisque,
      nbRisquesNonMaitrises: d.nbRisquesNonMaitrises,
      commentaireEvaluation: d.commentaireEvaluation,
    },
    problematiques: Array.from(themes.values()).map((t) => ({
      code: t.code,
      libelle: t.libelle,
      normes: t.normes,
      etat: !t.concernee && t.maitrisee ? "non_concerne" : t.maitrisee ? "maitrise" : "non_maitrise",
      risques: t.risques,
    })),
    expositionNonMaitrisee: [
      ...exposition,
      ...actionsEIE.map((a) => ({ thematique: "EIE / PGES", risque: a.libelle, mesures: [{ libelle: a.libelle, horizon: a.horizon, retenue: true }] })),
    ],
    planActions: {
      propose: d.planActionPropose,
      nbActions: actions.length,
      nbRetenues: actions.filter((a) => a.retenue).length,
      actions,
    },
    climat,
    esg: d.detailESG ? { ...lireJson<ResultatESG | null>(d.detailESG, null)!, octroi: { score: d.scoreESGOctroi, note: d.noteESGOctroi } } : null,
    clauses,
    validation: {
      soumisLe: d.soumisLe,
      valideur: d.valideur ? `${d.valideur.prenom} ${d.valideur.nom}` : null,
      valideLe: d.valideLe,
      commentaire: d.commentaireValidation,
    },
    decisionComite: {
      comite: await valeurListe("comite", d.comite),
      dateComite: d.dateComite,
      decision: d.decision,
      montantAccorde: d.montantAccorde,
      motifRejet: d.motifRejetCode ? await valeurListe("motif_rejet", d.motifRejetCode) : null,
      motifRejetDetail: d.motifRejetES,
      reserves: d.reservesComite,
      commentaire: d.commentaireComite,
    },
    pieces: d.documents.map((x) => ({ type: x.type, nom: x.nom, date: x.createdAt })),
  };
}

export type Fiche = Awaited<ReturnType<typeof construireFiche>>;
