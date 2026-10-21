"use client";

import Link from "next/link";
import { useDonnees } from "@/lib/client/api";
import { ALEAS, ALIGNEMENTS_TAXONOMIE } from "@/lib/domaine/constantes";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { Barres, COULEUR_NIVEAU } from "@/components/ui/graphiques";
import { Bandeau, Carte, Chargement, EnTete, Indicateur, Vide } from "@/components/ui/mise-en-page";
import { PuceNiveau } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Donnees {
  nbDossiers: number;
  nbEvalues: number;
  montantEvalue: number;
  emissionsFinancees: number;
  intensite: number | null;
  partVerte: number | null;
  montantCBAM: number;
  parNiveau: Record<string, number>;
  parAlignement: Record<string, number>;
  regions: { region: string; nb: number; montant: number; physique: number; aleas: Record<string, number> }[];
  secteurs: { secteur: string; nb: number; montant: number; transition: number; emissions: number; cbam: number }[];
  dossiers: { id: string; reference: string; client: string; niveau: string | null; score: number | null; physique: number | null; transition: number | null; emissions: number | null }[];
}

const CASE = ["bg-success/15", "bg-success/35", "bg-warning/40", "bg-destructive/45", "bg-destructive/75 text-white"];

export default function PageClimat() {
  const { t, fmt, deviseReference } = useApp();
  const { donnees, erreur } = useDonnees<Donnees>("/api/climat");
  if (erreur) return <Bandeau ton="alerte">{erreur.message}</Bandeau>;
  if (!donnees) return <Chargement lignes={8} />;
  return (
    <div className="space-y-4">
      <EnTete titre={t("climat.titrePortefeuille")} description={t("climat.descriptionPortefeuille")} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Indicateur libelle={t("climat.dossiersEvalues")} valeur={`${donnees.nbEvalues} / ${donnees.nbDossiers}`} />
        <Indicateur libelle={t("climat.totalEmissions")} valeur={fmt.nombre(donnees.emissionsFinancees, 0)} unite={t("commun.tco2e")} />
        <Indicateur libelle={t("climat.intensite")} valeur={fmt.nombre(donnees.intensite, 1)} unite={t("climat.intensiteUnite", { devise: deviseReference })} />
        <Indicateur libelle={t("climat.partVerte")} valeur={donnees.partVerte === null ? "—" : `${fmt.nombre(donnees.partVerte * 100, 0)} %`} ton="favorable" />
        <Indicateur libelle={t("climat.expositionCBAM")} valeur={fmt.ref(donnees.montantCBAM)} ton={donnees.montantCBAM ? "vigilance" : "neutre"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre={t("climat.repartitionNiveaux")}>
          <Barres barres={["faible", "modere", "eleve", "tres_eleve"].map((n) => ({ cle: n, libelle: t(`niveau.${n}`), valeur: donnees.parNiveau[n] ?? 0, couleur: COULEUR_NIVEAU[n] }))} />
        </Carte>
        <Carte titre={t("climat.taxonomie")}>
          <Barres barres={ALIGNEMENTS_TAXONOMIE.map((a) => ({ cle: a, libelle: t(`climat.${a}`), valeur: donnees.parAlignement[a] ?? 0, couleur: a === "vert" ? "bg-success" : a === "transition" ? "bg-warning" : "bg-muted-foreground/50" }))} />
        </Carte>
      </div>
      <Carte titre={t("climat.expositionRegion")} sansMarge>
        {donnees.regions.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("dossier.region")}</Th>
                {ALEAS.map((a) => <Th key={a} className="min-w-[78px] whitespace-normal text-center leading-tight">{t(`climat.${a}`)}</Th>)}
                <Th alignFin>{t("tableau.dossiers")}</Th>
                <Th alignFin>{t("climat.montantFinance")}</Th>
                <Th alignFin>{t("climat.physique")}</Th>
              </tr>
            </thead>
            <tbody>
              {donnees.regions.map((r) => (
                <Tr key={r.region}>
                  <Td className="min-w-[170px] font-medium">{r.region}</Td>
                  {ALEAS.map((a) => (
                    <Td key={a} className="p-1 text-center">
                      <span className={cn("inline-block w-8 rounded py-1 text-[12px] font-semibold tabulaire", CASE[r.aleas[a] ?? 0])}>{r.aleas[a] ?? 0}</span>
                    </Td>
                  ))}
                  <Td alignFin>{r.nb}</Td>
                  <Td alignFin className="whitespace-nowrap">{fmt.ref(r.montant)}</Td>
                  <Td alignFin>{fmt.nombre(r.physique, 0)}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Carte titre={t("climat.transitionSecteur")} sansMarge>
        {donnees.secteurs.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead><tr><Th>{t("dossier.secteur")}</Th><Th alignFin>{t("tableau.dossiers")}</Th><Th alignFin>{t("climat.montantFinance")}</Th><Th alignFin>{t("climat.transitionTitre")}</Th><Th alignFin>{t("climat.emissionsFinancees")}</Th><Th alignFin>CBAM</Th></tr></thead>
            <tbody>
              {donnees.secteurs.map((s) => (
                <Tr key={s.secteur}>
                  <Td className="font-medium">{s.secteur}</Td><Td alignFin>{s.nb}</Td><Td alignFin className="whitespace-nowrap">{fmt.ref(s.montant)}</Td>
                  <Td alignFin>{fmt.nombre(s.transition, 0)}</Td><Td alignFin>{fmt.nombre(s.emissions, 0)}</Td><Td alignFin>{s.cbam ? fmt.ref(s.cbam) : "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Carte titre={t("climat.score")} sansMarge>
        {donnees.dossiers.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead><tr><Th>{t("dossier.client")}</Th><Th>{t("climat.niveau")}</Th><Th alignFin>{t("climat.physique")}</Th><Th alignFin>{t("climat.transitionTitre")}</Th><Th alignFin>{t("climat.emissionsFinancees")}</Th></tr></thead>
            <tbody>
              {donnees.dossiers.map((d) => (
                <Tr key={d.id}>
                  <Td><Link href={`/dossiers/${d.id}?etape=climat`} className="font-medium hover:underline">{d.client}</Link><span className="ms-2 text-[11.5px] text-muted-foreground"><span dir="ltr">{d.reference}</span></span></Td>
                  <Td><PuceNiveau niveau={d.niveau} score={d.score} /></Td>
                  <Td alignFin>{fmt.nombre(d.physique, 0)}</Td><Td alignFin>{fmt.nombre(d.transition, 0)}</Td><Td alignFin>{fmt.nombre(d.emissions, 0)}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
    </div>
  );
}
