"use client";

import { useEffect, useMemo, useState } from "react";
import { api, useDonnees } from "@/lib/client/api";
import { emissions, evaluerClimat, lirePonderation, lireSeuilsClimat, METHODE_CLIMAT_VERSION, normaliserAleas, normaliserTransition, qualitePCAF, type Aleas, type FacteursTransition } from "@/lib/domaine/climat";
import { ALEAS, ALIGNEMENTS_TAXONOMIE, FACTEURS_TRANSITION, METHODES_EMISSIONS } from "@/lib/domaine/constantes";
import { lireJson } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Echelle, EchelleEtendue, Interrupteur, Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Progression, Sablier } from "@/components/ui/mise-en-page";
import { PuceNiveau } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";

type Region = Record<string, number> & { libelle: string };

interface Donnees {
  climat: Record<string, unknown> | null;
  region: Region | null;
  secteur: { risqueTransition: number; facteurEmission: number; exposeCBAM: boolean; eligibleTaxonomie: boolean; libelle: string } | null;
  montantDemandeRef: number;
  montantInvestissementRef: number | null;
}

interface Formulaire {
  aleas: Aleas;
  sensibilite: number;
  capaciteAdaptation: number;
  mesuresAdaptation: string;
  transition: FacteursTransition;
  expositionCBAM: boolean;
  partExportUE: string;
  methodeEmissions: string;
  emissionsVerifiees: boolean;
  sourceEmissions: string;
  scope1: string;
  scope2: string;
  scope3: string;
  emissionsEvitees: string;
  partRenouvelable: string;
  alignementTaxonomie: string;
  objectifTaxonomie: string;
  commentaire: string;
}

function depuis(d: Donnees): Formulaire {
  const c = d.climat;
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const aleasRegion = d.region ? normaliserAleas(d.region) : normaliserAleas({});
  return {
    aleas: c ? normaliserAleas(lireJson(String(c.aleas), {})) : aleasRegion,
    sensibilite: c ? Number(c.sensibilite) : 1,
    capaciteAdaptation: c ? Number(c.capaciteAdaptation) : 1,
    mesuresAdaptation: s(c?.mesuresAdaptation),
    transition: c ? normaliserTransition(lireJson(String(c.transition), {})) : normaliserTransition({}),
    expositionCBAM: c ? !!c.expositionCBAM : !!d.secteur?.exposeCBAM,
    partExportUE: s(c?.partExportUE),
    methodeEmissions: s(c?.methodeEmissions) || "estimee_secteur",
    emissionsVerifiees: !!c?.emissionsVerifiees,
    sourceEmissions: s(c?.sourceEmissions),
    scope1: s(c?.scope1),
    scope2: s(c?.scope2),
    scope3: s(c?.scope3),
    emissionsEvitees: s(c?.emissionsEvitees),
    partRenouvelable: s(c?.partRenouvelable),
    alignementTaxonomie: s(c?.alignementTaxonomie) || (d.secteur?.eligibleTaxonomie ? "transition" : "non_eligible"),
    objectifTaxonomie: s(c?.objectifTaxonomie),
    commentaire: s(c?.commentaire),
  };
}

const num = (x: string) => (x.trim() === "" ? null : Number(x.replace(",", ".")));

export function VoletClimat() {
  const { t, lib, fmt, parametres } = useApp();
  const { dossier, droits, recharger } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVolet } = useDonnees<Donnees>(`/api/dossiers/${dossier.id}/climat`);
  const [f, setF] = useState<Formulaire | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    if (donnees) setF(depuis(donnees));
  }, [donnees]);

  const calcul = useMemo(() => {
    if (!f || !donnees) return null;
    const r = evaluerClimat(
      { aleas: f.aleas, transition: f.transition, sensibilite: f.sensibilite, capaciteAdaptation: f.capaciteAdaptation, risqueSecteur: donnees.secteur?.risqueTransition ?? 1, expositionCBAM: f.expositionCBAM, partExportUE: num(f.partExportUE), alignement: f.alignementTaxonomie },
      { couvertureMin: Number(parametres.CLIMAT_COUVERTURE_MIN ?? 0.75), ponderation: lirePonderation(parametres.CLIMAT_PONDERATION), seuils: lireSeuilsClimat(parametres.CLIMAT_SEUILS_NIVEAUX) }
    );
    const em = emissions({
      methode: f.methodeEmissions,
      scope1: num(f.scope1),
      scope2: num(f.scope2),
      scope3: num(f.scope3),
      facteurSecteur: donnees.secteur?.facteurEmission ?? 0,
      montantInvestissementRef: donnees.montantInvestissementRef,
      montantFinanceRef: (donnees.climat?.montantAttribueRef as number | null | undefined) ?? donnees.montantDemandeRef,
    });
    return { sp: r.physique, st: r.transition, sc: r.score, niveau: r.niveau, couverture: r.couverture, em };
  }, [f, donnees, parametres]);

  if (!donnees || !f || !calcul) return <Chargement lignes={8} />;
  const lecture = !droits.evaluation;
  const maj = <K extends keyof Formulaire>(k: K, v: Formulaire[K]) => setF({ ...f, [k]: v });
  const modifie = !donnees.climat || JSON.stringify(f) !== JSON.stringify(depuis(donnees));

  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      await api(`/api/dossiers/${dossier.id}/climat`, {
        method: "PUT",
        body: {
          aleas: f.aleas,
          sensibilite: f.sensibilite,
          capaciteAdaptation: f.capaciteAdaptation,
          mesuresAdaptation: f.mesuresAdaptation || null,
          transition: f.transition,
          expositionCBAM: f.expositionCBAM,
          partExportUE: num(f.partExportUE),
          methodeEmissions: f.methodeEmissions,
          emissionsVerifiees: f.methodeEmissions === "declaree" && f.emissionsVerifiees,
          sourceEmissions: f.sourceEmissions || null,
          scope1: num(f.scope1),
          scope2: num(f.scope2),
          scope3: num(f.scope3),
          emissionsEvitees: num(f.emissionsEvitees),
          partRenouvelable: num(f.partRenouvelable),
          alignementTaxonomie: f.alignementTaxonomie,
          objectifTaxonomie: f.objectifTaxonomie || null,
          commentaire: f.commentaire || null,
        },
      });
      toast(t("commun.enregistre"));
      await Promise.all([rechargerVolet(), recharger()]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const ton = (s: number) => (s >= 75 ? "alerte" : s >= 50 ? "alerte" : s >= 25 ? "vigilance" : "favorable") as "alerte" | "vigilance" | "favorable";
  return (
    <div className="space-y-4">
      <Bandeau ton="info">{t("climat.description")}</Bandeau>
      {!donnees.climat && <Bandeau ton="vigilance">{t("climat.nonRenseigne")}</Bandeau>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Carte
            titre={t("climat.physique")}
            description={donnees.region ? t("climat.aleasRepris", { region: lib(donnees.region.libelle) }) : t("climat.aleas")}
            actions={
              !lecture && donnees.region && (
                <Bouton variante="contour" taille="petite" onClick={() => maj("aleas", normaliserAleas(donnees.region!))}>
                  {t("climat.reprendreRegion")}
                </Bouton>
              )
            }
          >
            <p className="mb-2 text-[12px] text-muted-foreground">{t("climat.aleas")}</p>
            <div className="divide-y divide-border">
              {ALEAS.map((a) => (
                <EchelleEtendue key={a} id={`alea-${a}`} libelle={t(`climat.${a}`)} valeur={f.aleas[a]} onChange={(v) => maj("aleas", { ...f.aleas, [a]: v })} desactive={lecture} />
              ))}
            </div>
            <div className="mt-4 divide-y divide-border border-t border-border pt-2">
              <Echelle id="sensibilite" libelle={t("climat.sensibilite")} valeur={f.sensibilite} onChange={(v) => maj("sensibilite", v)} desactive={lecture} />
              <Echelle id="adaptation" libelle={t("climat.capaciteAdaptation")} valeur={f.capaciteAdaptation} onChange={(v) => maj("capaciteAdaptation", v)} desactive={lecture} />
            </div>
            <ZoneTexte id="adaptation-txt" className="mt-3" libelle={t("climat.mesuresAdaptation")} valeur={f.mesuresAdaptation} onChange={(v) => maj("mesuresAdaptation", v)} lignes={2} desactive={lecture} />
          </Carte>

          <Carte titre={t("climat.transitionTitre")} description={t("climat.sensibiliteSecteur", { n: donnees.secteur?.risqueTransition ?? "—" })}>
            <p className="mb-2 text-[12px] text-muted-foreground">{t("climat.facteurs")}</p>
            <div className="divide-y divide-border">
              {FACTEURS_TRANSITION.map((x) => (
                <EchelleEtendue key={x} id={`tr-${x}`} libelle={t(`climat.${x}`)} valeur={f.transition[x]} onChange={(v) => maj("transition", { ...f.transition, [x]: v })} desactive={lecture} />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Interrupteur id="cbam" libelle={t("climat.cbam")} valeur={f.expositionCBAM} onChange={(v) => maj("expositionCBAM", v)} desactive={lecture} />
              {f.expositionCBAM && <Champ id="export" type="number" min={0} max={100} libelle={t("climat.partExportUE")} valeur={f.partExportUE} onChange={(v) => maj("partExportUE", v)} suffixe="%" desactive={lecture} />}
              <Selecteur id="taxo" libelle={t("climat.taxonomie")} valeur={f.alignementTaxonomie} onChange={(v) => maj("alignementTaxonomie", v)} options={ALIGNEMENTS_TAXONOMIE.map((a) => ({ valeur: a, libelle: t(`climat.${a}`) }))} sansVide desactive={lecture} />
              <Selecteur
                id="objectif"
                libelle={t("climat.objectifTaxonomie")}
                valeur={f.objectifTaxonomie}
                onChange={(v) => maj("objectifTaxonomie", v)}
                options={["attenuation", "adaptation", "eau", "economieCirculaire", "pollution", "biodiversite"].map((o) => ({ valeur: o, libelle: t(`climat.${o}`) }))}
                desactive={lecture}
              />
            </div>
          </Carte>

          <Carte titre={t("climat.emissions")}>
            <div className="grid gap-4 md:grid-cols-3">
              <Selecteur id="methode" className="md:col-span-3" libelle={t("climat.methode")} valeur={f.methodeEmissions} onChange={(v) => maj("methodeEmissions", v)} options={METHODES_EMISSIONS.map((m) => ({ valeur: m, libelle: t(`climat.${m}`) }))} sansVide desactive={lecture} />
              {f.methodeEmissions !== "estimee_secteur" && (
                <>
                  <Champ id="s1" type="number" min={0} libelle={t("climat.scope1")} valeur={f.scope1} onChange={(v) => maj("scope1", v)} desactive={lecture} />
                  <Champ id="s2" type="number" min={0} libelle={t("climat.scope2")} valeur={f.scope2} onChange={(v) => maj("scope2", v)} desactive={lecture} />
                  <Champ id="s3" type="number" min={0} libelle={t("climat.scope3")} valeur={f.scope3} onChange={(v) => maj("scope3", v)} desactive={lecture} />
                </>
              )}
              {f.methodeEmissions !== "estimee_secteur" && (
                <ZoneTexte id="source-emissions" className="md:col-span-3" libelle={t("climat.sourceEmissions")} aide={t("climat.sourceEmissionsAide")} valeur={f.sourceEmissions} onChange={(v) => maj("sourceEmissions", v)} lignes={2} obligatoire desactive={lecture} />
              )}
              {f.methodeEmissions === "declaree" && (
                <div className="md:col-span-3">
                  <Interrupteur id="verifiees" libelle={t("climat.emissionsVerifiees")} aide={t("climat.emissionsVerifieesAide")} valeur={f.emissionsVerifiees} onChange={(v) => maj("emissionsVerifiees", v)} desactive={lecture} />
                </div>
              )}
              <Champ id="evitees" type="number" min={0} libelle={t("climat.emissionsEvitees")} valeur={f.emissionsEvitees} onChange={(v) => maj("emissionsEvitees", v)} desactive={lecture} />
              <Champ id="enr" type="number" min={0} max={100} libelle={t("climat.partRenouvelable")} valeur={f.partRenouvelable} onChange={(v) => maj("partRenouvelable", v)} suffixe="%" desactive={lecture} />
            </div>
            <ZoneTexte id="commentaire-climat" className="mt-4" libelle={t("climat.commentaire")} valeur={f.commentaire} onChange={(v) => maj("commentaire", v)} lignes={2} desactive={lecture} />
          </Carte>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Carte titre={t("climat.score")}>
            <div className="flex items-baseline justify-between">
              <PuceNiveau niveau={calcul.niveau} />
              <span className="text-[26px] font-semibold tabulaire">
                {calcul.sc === null ? "—" : fmt.nombre(calcul.sc, 0)}
                <span className="ms-1 text-[12px] font-normal text-muted-foreground">{t("commun.sur100")}</span>
              </span>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {t("climat.couverture")} : {fmt.nombre(calcul.couverture * 100, 0)} %
            </p>
            {calcul.niveau === "insuffisant" && <Bandeau ton="vigilance" className="mt-2">{t("climat.donneesInsuffisantes")}</Bandeau>}
            <p className="mt-2 text-[11px] text-muted-foreground">{t("climat.methodeIndicative", { version: METHODE_CLIMAT_VERSION })}</p>
            <div className="mt-4 space-y-3 text-[12.5px]">
              <div>
                <div className="mb-1 flex justify-between">
                  <span>{t("climat.physique")}</span>
                  <span className="tabulaire">{calcul.sp === null ? "—" : fmt.nombre(calcul.sp, 0)}</span>
                </div>
                <Progression valeur={calcul.sp ?? 0} ton={ton(calcul.sp ?? 0)} />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span>{t("climat.transitionTitre")}</span>
                  <span className="tabulaire">{calcul.st === null ? "—" : fmt.nombre(calcul.st, 0)}</span>
                </div>
                <Progression valeur={calcul.st ?? 0} ton={ton(calcul.st ?? 0)} />
              </div>
            </div>
          </Carte>
          <Carte titre={t("climat.emissionsFinancees")}>
            <p className="text-[24px] font-semibold tabulaire">
              {fmt.nombre(calcul.em.financees, 0)} <span className="text-[12px] font-normal text-muted-foreground">{t("commun.tco2e")}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t("commun.total")} : {fmt.nombre(calcul.em.totales, 0)} · ×{fmt.nombre(calcul.em.attribution, 2)}
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {t("climat.qualitePCAF")} : {qualitePCAF(f.methodeEmissions, f.emissionsVerifiees, !!f.sourceEmissions.trim())}
            </p>
            {donnees.climat?.baseAttribution ? (
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t("climat.baseAttribution")} : {t(`climat.base_${String(donnees.climat.baseAttribution)}`)}
                {donnees.climat.dateArrete ? ` · ${fmt.date(String(donnees.climat.dateArrete))}` : ""}
              </p>
            ) : null}
          </Carte>
        </aside>
      </div>
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      <BarreVolet modifie={!lecture && modifie && !!donnees.climat} suivante="plan">
        {!lecture && (
          <Bouton onClick={enregistrer} disabled={!modifie || enCours}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        )}
      </BarreVolet>
    </div>
  );
}
