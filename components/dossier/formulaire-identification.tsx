"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/application";
import { Champ, Interrupteur, Selecteur, ZoneTexte } from "@/components/ui/champs";
import type { Referentiels } from "@/lib/client/referentiels";
import { useListe } from "@/lib/client/listes";
import { lireLibelle } from "@/lib/i18n/libelle";
import { lireJson } from "@/lib/utils";

export interface ValeursIdentification {
  typeCredit: string;
  natureProjet: string;
  objet: string;
  descriptionProcessus: string;
  projetDeveloppementDurable: boolean;
  ligneFinancement: string;
  principesEquateur: boolean;
  secteurId: string;
  deviseCode: string;
  montantDemande: string;
  montantInvestissement: string;
  dureeMois: string;
  adresseSite: string;
  localite: string;
  regionId: string;
  typeZone: string;
  latitude: string;
  longitude: string;
}

/** Région d'une ville de la liste « ville » (libellé dans n'importe quelle langue), sinon undefined. */
export function regionDeVille(referentiels: Referentiels, ville: string | null | undefined): string | undefined {
  const v = (ville ?? "").trim().toLowerCase();
  if (!v) return undefined;
  const x = referentiels.listes.ville?.find((e) => Object.values(lireLibelle(e.libelle)).some((l) => l?.toLowerCase() === v));
  const code = x?.extra ? lireJson<{ region?: string }>(x.extra, {}).region : undefined;
  return code ? referentiels.regions.find((r) => r.code === code)?.id : undefined;
}

export function valeursInitiales(d?: Partial<Record<keyof ValeursIdentification, unknown>> | null, devise = "MAD"): ValeursIdentification {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    typeCredit: s(d?.typeCredit),
    natureProjet: s(d?.natureProjet),
    objet: s(d?.objet),
    descriptionProcessus: s(d?.descriptionProcessus),
    projetDeveloppementDurable: !!d?.projetDeveloppementDurable,
    ligneFinancement: s(d?.ligneFinancement),
    principesEquateur: !!d?.principesEquateur,
    secteurId: s(d?.secteurId),
    deviseCode: s(d?.deviseCode) || devise,
    montantDemande: s(d?.montantDemande),
    montantInvestissement: s(d?.montantInvestissement),
    dureeMois: s(d?.dureeMois),
    adresseSite: s(d?.adresseSite),
    localite: s(d?.localite),
    regionId: s(d?.regionId),
    typeZone: s(d?.typeZone),
    latitude: s(d?.latitude),
    longitude: s(d?.longitude),
  };
}

/** Conversion vers le corps attendu par l'API (nombres, valeurs nulles). */
export function versApi(v: ValeursIdentification) {
  const n = (x: string) => (x.trim() === "" ? null : Number(x.replace(/\s/g, "").replace(",", ".")));
  const t = (x: string) => (x.trim() === "" ? null : x.trim());
  return {
    typeCredit: t(v.typeCredit),
    natureProjet: t(v.natureProjet),
    objet: t(v.objet),
    descriptionProcessus: t(v.descriptionProcessus),
    projetDeveloppementDurable: v.projetDeveloppementDurable,
    ligneFinancement: t(v.ligneFinancement),
    principesEquateur: v.principesEquateur,
    secteurId: t(v.secteurId),
    deviseCode: v.deviseCode,
    montantDemande: n(v.montantDemande) ?? undefined,
    montantInvestissement: n(v.montantInvestissement),
    dureeMois: n(v.dureeMois),
    adresseSite: t(v.adresseSite),
    localite: t(v.localite),
    regionId: t(v.regionId),
    typeZone: t(v.typeZone),
    latitude: n(v.latitude),
    longitude: n(v.longitude),
  };
}

export function FormulaireIdentification({
  valeurs,
  onChange,
  referentiels,
  desactive,
  erreurs = {},
}: {
  valeurs: ValeursIdentification;
  onChange: (v: ValeursIdentification) => void;
  referentiels: Referentiels;
  desactive?: boolean;
  erreurs?: Record<string, string>;
}) {
  const { t, lib, fmt } = useApp();
  const villes = useListe("ville");
  const maj = <K extends keyof ValeursIdentification>(k: K, v: ValeursIdentification[K]) => onChange({ ...valeurs, [k]: v });
  const options = (liste: string) => (referentiels.listes[liste] ?? []).map((v) => ({ valeur: v.code, libelle: lib(v.libelle) }));
  const secteurs = useMemo(
    () => referentiels.secteurs.map((s) => ({ valeur: s.id, libelle: `${s.code} — ${lib(s.libelle)}`, aide: s.categorieIndicative ? t("categorisation.indicationSecteur", { categorie: s.categorieIndicative }) : undefined })),
    [referentiels.secteurs, lib, t]
  );
  const regions = referentiels.regions.map((r) => ({ valeur: r.id, libelle: lib(r.libelle) }));
  const devises = referentiels.devises.map((d) => ({ valeur: d.code, libelle: `${d.code} — ${lib(d.libelle)}` }));
  // Options de financement repliées tant qu'aucune n'est renseignée.
  const avance = !!valeurs.ligneFinancement || valeurs.projetDeveloppementDurable || valeurs.principesEquateur;
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    if (avance) setOuvert(true);
  }, [avance]);
  // Une ville de la liste renseigne sa région (modifiable).
  const choisirLocalite = (v: string) => {
    const regionId = regionDeVille(referentiels, v);
    onChange({ ...valeurs, localite: v, ...(regionId ? { regionId } : {}) });
  };
  const lisible = (x: string) => {
    const n = Number(x.replace(/\s/g, "").replace(",", "."));
    return x.trim() && Number.isFinite(n) ? `= ${fmt.compact(n, valeurs.deviseCode)}` : undefined;
  };

  return (
    <div className="space-y-6">
      <fieldset className="grid gap-4 md:grid-cols-2" disabled={desactive}>
        <legend className="mb-2 text-[13px] font-semibold text-foreground md:col-span-2">{t("dossier.descriptionProjet")}</legend>
        <Selecteur id="typeCredit" libelle={t("dossier.typeCredit")} valeur={valeurs.typeCredit} onChange={(v) => maj("typeCredit", v)} options={options("type_credit")} obligatoire erreur={erreurs.typeCredit} desactive={desactive} />
        <Selecteur id="natureProjet" libelle={t("dossier.natureProjet")} valeur={valeurs.natureProjet} onChange={(v) => maj("natureProjet", v)} options={options("nature_projet")} desactive={desactive} />
        <Selecteur id="secteurId" libelle={t("dossier.secteur")} valeur={valeurs.secteurId} onChange={(v) => maj("secteurId", v)} options={secteurs} obligatoire erreur={erreurs.secteurId} desactive={desactive} className="md:col-span-2" />
        <ZoneTexte id="objet" libelle={t("dossier.objet")} valeur={valeurs.objet} onChange={(v) => maj("objet", v)} lignes={2} desactive={desactive} className="md:col-span-2" />
        <ZoneTexte id="processus" libelle={t("dossier.descriptionProcessus")} valeur={valeurs.descriptionProcessus} onChange={(v) => maj("descriptionProcessus", v)} lignes={3} desactive={desactive} className="md:col-span-2" />
        <details className="group rounded-md border border-border md:col-span-2" open={ouvert} onToggle={(e) => setOuvert(e.currentTarget.open)}>
          <summary className="cursor-pointer select-none px-3 py-2 text-[12.5px] font-medium text-foreground marker:text-muted-foreground">
            {t("dossier.optionsFinancement")}
            {!ouvert && <span className="ms-2 font-normal text-muted-foreground">{t("dossier.optionsFinancementAide")}</span>}
          </summary>
          <div className="grid gap-4 border-t border-border p-3">
            <Selecteur id="ligneFinancement" libelle={t("dossier.ligneFinancement")} aide={t("dossier.ligneFinancementAide")} valeur={valeurs.ligneFinancement} onChange={(v) => maj("ligneFinancement", v)} options={options("ligne_financement")} desactive={desactive} />
            <Interrupteur id="dd" libelle={t("dossier.projetDD")} valeur={valeurs.projetDeveloppementDurable} onChange={(v) => maj("projetDeveloppementDurable", v)} desactive={desactive} />
            <Interrupteur id="ep" libelle={t("questionnaire.principesEquateur")} aide={t("questionnaire.principesEquateurAide")} valeur={valeurs.principesEquateur} onChange={(v) => maj("principesEquateur", v)} desactive={desactive} />
          </div>
        </details>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-4" disabled={desactive}>
        <legend className="mb-2 text-[13px] font-semibold text-foreground md:col-span-4">{t("commun.montant")}</legend>
        <Selecteur id="devise" libelle={t("commun.devise")} valeur={valeurs.deviseCode} onChange={(v) => maj("deviseCode", v)} options={devises} sansVide desactive={desactive} />
        <Champ id="montantDemande" type="number" min={0} libelle={t("dossier.montantDemande")} valeur={valeurs.montantDemande} onChange={(v) => maj("montantDemande", v)} obligatoire suffixe={valeurs.deviseCode} aide={lisible(valeurs.montantDemande)} erreur={erreurs.montantDemande} desactive={desactive} />
        <Champ id="montantInvestissement" type="number" min={0} libelle={t("dossier.montantInvestissement")} valeur={valeurs.montantInvestissement} onChange={(v) => maj("montantInvestissement", v)} suffixe={valeurs.deviseCode} aide={lisible(valeurs.montantInvestissement)} desactive={desactive} />
        <Champ id="duree" type="number" min={1} libelle={t("dossier.duree")} valeur={valeurs.dureeMois} onChange={(v) => maj("dureeMois", v)} desactive={desactive} />
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2" disabled={desactive}>
        <legend className="mb-2 text-[13px] font-semibold text-foreground md:col-span-2">{t("dossier.lieu")}</legend>
        <ZoneTexte id="adresse" libelle={t("dossier.adresseSite")} valeur={valeurs.adresseSite} onChange={(v) => maj("adresseSite", v)} lignes={2} desactive={desactive} className="md:col-span-2" />
        <Champ id="localite" suggestions={villes.map((v) => v.libelle)} libelle={t("dossier.localite")} aide={t("dossier.localiteAide")} valeur={valeurs.localite} onChange={choisirLocalite} erreur={erreurs.localite} desactive={desactive} />
        <Selecteur id="region" libelle={t("dossier.region")} valeur={valeurs.regionId} onChange={(v) => maj("regionId", v)} options={regions} obligatoire erreur={erreurs.regionId} desactive={desactive} />
        <Selecteur id="typeZone" libelle={t("dossier.typeZone")} valeur={valeurs.typeZone} onChange={(v) => maj("typeZone", v)} options={options("type_zone")} desactive={desactive} />
        <div className="grid grid-cols-2 gap-3">
          <Champ id="lat" type="number" step="any" libelle={t("dossier.latitude")} valeur={valeurs.latitude} onChange={(v) => maj("latitude", v)} desactive={desactive} dir="ltr" />
          <Champ id="lon" type="number" step="any" libelle={t("dossier.longitude")} valeur={valeurs.longitude} onChange={(v) => maj("longitude", v)} desactive={desactive} dir="ltr" />
        </div>
      </fieldset>
    </div>
  );
}
