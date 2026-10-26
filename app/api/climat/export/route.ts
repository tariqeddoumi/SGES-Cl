import ExcelJS from "exceljs";
import { ALEAS } from "@/lib/domaine/constantes";
import type { ScenariosClimat } from "@/lib/domaine/climat";
import { dictionnaire, traduire } from "@/lib/i18n";
import { libelle } from "@/lib/i18n/libelle";
import { route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { dossiersPerimetre } from "@/lib/serveur/portefeuille";
import { lireJson } from "@/lib/utils";

/**
 * Reporting du risque climatique du portefeuille (Directive BAM n° 5/W/2021) : une feuille par dossier
 * (aléas retenus, scores, couverture des données, scénarios, CBAM, émissions financées et base PCAF),
 * puis les agrégats par région, par secteur et par ligne de financement. Les dossiers à données
 * insuffisantes sont listés (couverture), non écartés.
 */
export const GET = route(
  async (_req, ctx) => {
    const t = (c: string) => traduire(dictionnaire(ctx.langue), c);
    const tous = (await dossiersPerimetre(ctx)).filter((d) => d.climat);
    const wb = new ExcelJS.Workbook();
    wb.creator = "SGES";
    wb.created = new Date();
    // Excel : nom de feuille sans * ? : \ / [ ] et limité à 31 caractères.
    const feuille = (nom: string) => nom.replace(/[*?:\\/[\]]/g, "-").slice(0, 31);
    const vue = { views: [{ state: "frozen" as const, ySplit: 1, rightToLeft: ctx.langue === "ar" }] };
    const expo = (d: (typeof tous)[number]) => d.climat!.montantAttribueRef ?? d.montantDemandeRef;

    const f1 = wb.addWorksheet(feuille(t("nav.dossiers")), vue);
    f1.columns = [
      { header: t("dossier.reference"), key: "reference", width: 28 },
      { header: t("client.raisonSociale"), key: "client", width: 30 },
      { header: t("dossier.entite"), key: "entite", width: 24 },
      { header: t("dossier.secteur"), key: "secteur", width: 30 },
      { header: t("dossier.region"), key: "region", width: 22 },
      { header: t("commun.statut"), key: "statut", width: 14 },
      { header: t("climat.baseAttribution"), key: "base", width: 14 },
      { header: `${t("climat.exposition")} (${t("commun.deviseReference")})`, key: "expo", width: 18 },
      ...ALEAS.map((a) => ({ header: t(`climat.${a}`), key: a, width: 10 })),
      { header: t("climat.couverture"), key: "couverture", width: 10 },
      { header: t("climat.physique"), key: "physique", width: 10 },
      { header: t("climat.physique_ssp585"), key: "ssp585", width: 12 },
      { header: t("climat.transitionTitre"), key: "transition", width: 10 },
      { header: t("climat.score"), key: "score", width: 10 },
      { header: t("climat.niveau"), key: "niveau", width: 14 },
      { header: t("climat.cbam"), key: "cbam", width: 8 },
      { header: t("climat.partExportUE"), key: "export", width: 10 },
      { header: `${t("climat.coutCarbone")} — ${t("climat.scenario_nz2050")}`, key: "nz", width: 18 },
      { header: "% EBE", key: "ebe", width: 8 },
      { header: t("climat.taxonomie"), key: "taxo", width: 14 },
      { header: t("climat.emissionsFinancees"), key: "emissions", width: 14 },
      { header: t("climat.qualitePCAF"), key: "pcaf", width: 8 },
      { header: t("dossier.ligneFinancement"), key: "ligne", width: 16 },
    ];
    for (const d of tous) {
      const c = d.climat!;
      const aleas = lireJson<Record<string, unknown>>(c.aleas, {});
      const sc = lireJson<ScenariosClimat | null>(c.scenarios ?? "", null);
      const nz = sc?.transition.find((x) => x.scenario === "nz2050");
      f1.addRow({
        reference: d.reference, client: d.client.raisonSociale, entite: d.entite.nom,
        secteur: d.secteur ? `${d.secteur.code} — ${libelle(d.secteur.libelle, ctx.langue)}` : "", region: d.region ? libelle(d.region.libelle, ctx.langue) : "",
        statut: t(`statut.${d.statut}`), base: c.baseAttribution ? t(`climat.base_${c.baseAttribution}`) : "", expo: expo(d),
        ...Object.fromEntries(ALEAS.map((a) => [a, aleas[a] === null || aleas[a] === undefined ? "?" : aleas[a] === "na" ? "NA" : aleas[a]])),
        couverture: c.couvertureDonnees, physique: c.scorePhysique, ssp585: sc?.physique.ssp585 ?? null, transition: c.scoreTransition, score: c.scoreClimat,
        niveau: c.niveauClimat ? t(`niveau.${c.niveauClimat}`) : "", cbam: c.expositionCBAM ? t("commun.oui") : t("commun.non"), export: c.partExportUE,
        nz: nz?.total ?? null, ebe: nz?.partEBE ?? null, taxo: t(`climat.${c.alignementTaxonomie}`), emissions: c.emissionsFinancees, pcaf: c.qualitePCAF,
        ligne: d.ligneFinancement ?? "",
      });
    }
    f1.getColumn("couverture").numFmt = "0%";
    f1.getColumn("ebe").numFmt = "0%";
    f1.getColumn("expo").numFmt = "#,##0";
    f1.getColumn("nz").numFmt = "#,##0";

    const agreger = (nom: string, cle: (d: (typeof tous)[number]) => string) => {
      const f = wb.addWorksheet(feuille(nom), vue);
      f.columns = [
        { header: nom, key: "k", width: 34 },
        { header: t("tableau.nbDossiers"), key: "nb", width: 10 },
        { header: `${t("climat.exposition")} (${t("commun.deviseReference")})`, key: "expo", width: 20 },
        { header: t("climat.physique"), key: "physique", width: 12 },
        { header: t("climat.transitionTitre"), key: "transition", width: 12 },
        { header: t("climat.emissionsFinancees"), key: "emissions", width: 16 },
        { header: t("niveau.insuffisant"), key: "insuffisants", width: 14 },
      ];
      const m = new Map<string, { nb: number; expo: number; p: number; t: number; n: number; e: number; ins: number }>();
      for (const d of tous) {
        const k = cle(d);
        const x = m.get(k) ?? { nb: 0, expo: 0, p: 0, t: 0, n: 0, e: 0, ins: 0 };
        x.nb++;
        x.expo += expo(d);
        x.e += d.climat!.emissionsFinancees ?? 0;
        if (d.climat!.scoreClimat === null) x.ins++;
        else {
          x.n++;
          x.p += (d.climat!.scorePhysique ?? 0) * expo(d);
          x.t += (d.climat!.scoreTransition ?? 0) * expo(d);
        }
        m.set(k, x);
      }
      // Scores moyens pondérés par l'exposition (dossiers à données suffisantes).
      for (const [k, x] of m) {
        const poids = tous.filter((d) => cle(d) === k && d.climat!.scoreClimat !== null).reduce((s, d) => s + expo(d), 0);
        f.addRow({ k, nb: x.nb, expo: x.expo, physique: poids ? Math.round(x.p / poids) : null, transition: poids ? Math.round(x.t / poids) : null, emissions: Math.round(x.e), insuffisants: x.ins });
      }
      f.getColumn("expo").numFmt = "#,##0";
    };
    agreger(t("dossier.region"), (d) => (d.region ? libelle(d.region.libelle, ctx.langue) : "—"));
    agreger(t("dossier.secteur"), (d) => (d.secteur ? `${d.secteur.code} — ${libelle(d.secteur.libelle, ctx.langue)}` : "—"));
    agreger(t("dossier.ligneFinancement"), (d) => d.ligneFinancement ?? "—");

    await journaliser(ctx, "export_climat", "portefeuille", null, { dossiers: tous.length });
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SGES_reporting_climat_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { permission: "climat:lire" }
);
