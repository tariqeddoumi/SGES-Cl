import type { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { libelle } from "@/lib/i18n/libelle";
import { dictionnaire, traduire } from "@/lib/i18n";
import { route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { chargerArbre, filtreLecture, peutLire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/**
 * Export Excel (ou CSV) des dossiers SGES avec les données de la fiche d'évaluation
 * attendues par la plateforme d'octroi (cahier des charges SGES), et des plans d'actions.
 */
export const GET = route(
  async (req, ctx) => {
    const sp = req.nextUrl.searchParams;
    const m = dictionnaire(ctx.langue);
    const t = (c: string) => traduire(m, c);
    const where: Prisma.DossierWhereInput = { ...filtreLecture(ctx.perimetre), statut: { not: "annule" } };
    if (sp.get("du") || sp.get("au")) where.dateDossier = { gte: sp.get("du") ? new Date(sp.get("du")!) : undefined, lte: sp.get("au") ? new Date(`${sp.get("au")}T23:59:59`) : undefined };
    if (sp.get("statut")) where.statut = { in: sp.get("statut")!.split(",") };
    if (sp.get("categorie")) where.categorie = { in: sp.get("categorie")!.split(",") };
    if (sp.get("niveau")) where.niveauRisque = { in: sp.get("niveau")!.split(",") };
    if (sp.get("mes") === "1") where.chargeId = ctx.utilisateur.id;
    if (sp.get("entite")) {
      const arbre = await chargerArbre();
      const r = arbre.find((e) => e.id === sp.get("entite"));
      if (r) where.entiteId = { in: arbre.filter((e) => e.chemin.startsWith(r.chemin) && peutLire(ctx.perimetre, e.id)).map((e) => e.id) };
    }
    const dossiers = await prisma.dossier.findMany({
      where,
      orderBy: { dateDossier: "desc" },
      include: { entite: true, client: true, charge: true, secteur: true, region: true, climat: true, actions: { orderBy: { ordre: "asc" } } },
    });
    const listes = await prisma.listeValeur.findMany();
    const lv = (liste: string, code: string | null) => (code ? libelle(listes.find((l) => l.liste === liste && l.code === code)?.libelle, ctx.langue) || code : "");

    const wb = new ExcelJS.Workbook();
    wb.creator = "SGES";
    wb.created = new Date();
    const f1 = wb.addWorksheet(t("nav.dossiers"), { views: [{ state: "frozen", ySplit: 1, rightToLeft: ctx.langue === "ar" }] });
    f1.columns = [
      { header: t("dossier.codeBanque"), key: "codeBanque", width: 14 },
      { header: t("dossier.entite"), key: "entite", width: 30 },
      { header: t("dossier.matricule"), key: "matricule", width: 12 },
      { header: t("dossier.charge"), key: "charge", width: 20 },
      { header: t("dossier.dateDossier"), key: "date", width: 12 },
      { header: t("dossier.reference"), key: "reference", width: 28 },
      { header: t("client.raisonSociale"), key: "client", width: 32 },
      { header: t("client.formeJuridique"), key: "forme", width: 18 },
      { header: t("client.comptePortefeuille"), key: "ptf", width: 16 },
      { header: t("client.compteCourant"), key: "compte", width: 24 },
      { header: t("dossier.secteur"), key: "secteur", width: 30 },
      { header: t("client.contact"), key: "contact", width: 20 },
      { header: t("client.contactTelephone"), key: "tel", width: 16 },
      { header: t("client.contactEmail"), key: "email", width: 24 },
      { header: t("dossier.adresseSite"), key: "adresse", width: 26 },
      { header: t("dossier.localite"), key: "localite", width: 16 },
      { header: t("dossier.region"), key: "region", width: 22 },
      { header: t("dossier.typeZone"), key: "zone", width: 18 },
      { header: t("dossier.descriptionProcessus"), key: "processus", width: 40 },
      { header: t("dossier.natureProjet"), key: "nature", width: 18 },
      { header: t("dossier.projetDD"), key: "dd", width: 10 },
      { header: t("dossier.montantDemande"), key: "montant", width: 16 },
      { header: t("commun.devise"), key: "devise", width: 8 },
      { header: t("dossier.exclu"), key: "exclu", width: 10 },
      { header: t("exclusion.motif"), key: "motifExcl", width: 30 },
      { header: t("dossier.categorie"), key: "categorie", width: 10 },
      { header: t("dossier.niveauRisque"), key: "niveau", width: 12 },
      { header: t("dossier.scoreRisque"), key: "score", width: 10 },
      { header: t("dossier.risquesNonMaitrises"), key: "nbRisques", width: 10 },
      { header: t("fiche.propositionPlan"), key: "plan", width: 10 },
      { header: t("climat.score"), key: "climat", width: 10 },
      { header: t("climat.emissionsFinancees"), key: "emissions", width: 14 },
      { header: t("commun.statut"), key: "statut", width: 16 },
      { header: t("comite.comite"), key: "comite", width: 16 },
      { header: t("comite.dateComite"), key: "dateComite", width: 12 },
      { header: t("comite.decision"), key: "decision", width: 12 },
      { header: t("comite.montantAccorde"), key: "accorde", width: 16 },
      { header: t("comite.motifRejet"), key: "motifRejet", width: 30 },
      { header: t("comite.commentaire"), key: "commentaire", width: 30 },
    ];
    for (const d of dossiers) {
      f1.addRow({
        codeBanque: d.entite.code, entite: d.entite.nom, matricule: d.charge?.matricule ?? "", charge: d.charge ? `${d.charge.prenom} ${d.charge.nom}` : "",
        date: d.dateDossier, reference: d.reference, client: d.client.raisonSociale, forme: lv("forme_juridique", d.client.formeJuridique),
        ptf: d.client.comptePortefeuille ?? "", compte: d.client.compteCourant ?? "", secteur: d.secteur ? `${d.secteur.code} — ${libelle(d.secteur.libelle, ctx.langue)}` : "",
        contact: d.client.contactNom ?? "", tel: d.client.contactTelephone ?? "", email: d.client.contactEmail ?? "", adresse: d.adresseSite ?? "",
        localite: d.localite ?? "", region: d.region ? libelle(d.region.libelle, ctx.langue) : "", zone: lv("type_zone", d.typeZone),
        processus: d.descriptionProcessus ?? "", nature: lv("nature_projet", d.natureProjet), dd: d.projetDeveloppementDurable ? t("commun.oui") : t("commun.non"),
        montant: d.montantDemande, devise: d.deviseCode, exclu: d.exclu ? t("commun.oui") : t("commun.non"), motifExcl: d.motifExclusion ?? "",
        categorie: [d.categorie, d.sousCategorieFI].filter(Boolean).join(" / "), niveau: d.niveauRisque ? t(`niveau.${d.niveauRisque}`) : "",
        score: d.scoreRisque, nbRisques: d.nbRisquesNonMaitrises, plan: d.planActionPropose ? t("commun.oui") : t("commun.non"),
        climat: d.climat?.scoreClimat ?? null, emissions: d.climat?.emissionsFinancees ?? null, statut: t(`statut.${d.statut}`),
        comite: lv("comite", d.comite), dateComite: d.dateComite, decision: d.decision ? t(`decision.${d.decision}`) : "", accorde: d.montantAccorde,
        motifRejet: [lv("motif_rejet", d.motifRejetCode), d.motifRejetES].filter(Boolean).join(" — "), commentaire: d.commentaireComite ?? "",
      });
    }
    f1.getRow(1).font = { bold: true };
    f1.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0EC" } };
    f1.autoFilter = { from: "A1", to: { row: 1, column: f1.columnCount } };
    for (const c of ["montant", "accorde"]) f1.getColumn(c).numFmt = "#,##0";

    const f2 = wb.addWorksheet(t("plan.titre"), { views: [{ state: "frozen", ySplit: 1, rightToLeft: ctx.langue === "ar" }] });
    f2.columns = [
      { header: t("dossier.reference"), key: "reference", width: 28 },
      { header: t("dossier.client"), key: "client", width: 30 },
      { header: t("plan.action"), key: "action", width: 60 },
      { header: t("plan.origine"), key: "origine", width: 18 },
      { header: t("plan.horizon"), key: "horizon", width: 12 },
      { header: t("plan.retenue"), key: "retenue", width: 10 },
      { header: t("plan.responsable"), key: "responsable", width: 20 },
      { header: t("plan.dateEcheance"), key: "echeance", width: 12 },
      { header: t("plan.budget"), key: "budget", width: 14 },
      { header: t("plan.avancement"), key: "avancement", width: 10 },
      { header: t("commun.statut"), key: "statut", width: 12 },
    ];
    for (const d of dossiers) {
      for (const a of d.actions) {
        f2.addRow({
          reference: d.reference, client: d.client.raisonSociale, action: a.libelle, origine: t(`origine.${a.origine}`), horizon: t(`horizon.${a.horizon}`),
          retenue: a.retenue === null ? "" : a.retenue ? t("commun.oui") : t("commun.non"), responsable: a.responsable ?? "", echeance: a.dateEcheance,
          budget: a.budget, avancement: a.avancement / 100, statut: t(`statutAction.${a.statut}`),
        });
      }
    }
    f2.getRow(1).font = { bold: true };
    f2.getColumn("avancement").numFmt = "0%";
    f2.getColumn("budget").numFmt = "#,##0";

    await journaliser(ctx, "export", "reporting", null, { lignes: dossiers.length, format: sp.get("format") ?? "xlsx" });
    const nom = `sges-${new Date().toISOString().slice(0, 10)}`;
    if (sp.get("format") === "csv") {
      const buf = await wb.csv.writeBuffer({ sheetName: t("nav.dossiers"), formatterOptions: { delimiter: ";", writeBOM: true } });
      return new Response(new Uint8Array(buf as ArrayBuffer), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nom}.csv"` } });
    }
    const buf = await wb.xlsx.writeBuffer();
    return new Response(new Uint8Array(buf as ArrayBuffer), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${nom}.xlsx"` },
    });
  },
  { permission: "reporting:exporter" }
);
