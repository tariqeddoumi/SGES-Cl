"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { CATEGORIES, NIVEAUX_RISQUE } from "@/lib/domaine/constantes";
import { dateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Selecteur } from "@/components/ui/champs";
import { Barres, COULEUR_CATEGORIE, COULEUR_NIVEAU } from "@/components/ui/graphiques";
import { Bandeau, Carte, Chargement, EnTete, Indicateur, Vide } from "@/components/ui/mise-en-page";
import { PuceCategorie, PuceDecision, PuceNiveau, PuceStatut } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Donnees {
  nb: number;
  montantRef: number;
  montantAccordeRef: number;
  projetsDD: number;
  plansAction: number;
  tauxRealisation: number | null;
  parCategorie: Record<string, number>;
  parDecision: Record<string, number>;
  parNiveau: Record<string, number>;
  parSecteur: [string, number][];
  parEntite: { entite: string; nb: number; montant: number; A: number; B: number; C: number; FI: number; exclus: number; accordes: number; rejetes: number; sansDecision: number; montantAccorde: number }[];
  sansDecision: { id: string; reference: string; client: string; entite: string; valideLe: string; charge: string | null }[];
  dossiers: { id: string; reference: string; client: string; entite: string; date: string; categorie: string | null; niveauRisque: string | null; montantDemande: number; deviseCode: string; statut: string; decision: string | null }[];
}

function periode(type: "mois" | "trimestre" | "annee"): [string, string] {
  const d = new Date();
  if (type === "mois") return [dateInput(new Date(d.getFullYear(), d.getMonth() - 1, 1)), dateInput(new Date(d.getFullYear(), d.getMonth(), 0))];
  if (type === "trimestre") {
    const q = Math.floor(d.getMonth() / 3) * 3;
    return [dateInput(new Date(d.getFullYear(), q, 1)), dateInput(new Date(d.getFullYear(), q + 3, 0))];
  }
  return [dateInput(new Date(d.getFullYear(), 0, 1)), dateInput(new Date(d.getFullYear(), 11, 31))];
}

export default function PageReporting() {
  const { t, fmt, peut } = useApp();
  const ref = useReferentiels();
  const [[du, au], setPeriode] = useState<[string, string]>(() => periode("annee"));
  const [entite, setEntite] = useState("");
  const qs = useMemo(() => new URLSearchParams({ du, au, ...(entite ? { entite } : {}) }).toString(), [du, au, entite]);
  const { donnees, erreur } = useDonnees<Donnees>(`/api/reporting?${qs}`);

  return (
    <div className="space-y-4">
      <EnTete
        titre={t("reporting.titre")}
        description={t("reporting.description")}
        actions={
          peut("reporting:exporter") && (
            <>
              <Bouton variante="contour" asChild><a href={`/api/reporting/export?format=csv&${qs}`}><FileText /> {t("commun.exporterCsv")}</a></Bouton>
              <Bouton asChild><a href={`/api/reporting/export?format=xlsx&${qs}`}><FileSpreadsheet /> {t("reporting.exportComplet")}</a></Bouton>
            </>
          )
        }
      />
      <Carte>
        <div className="flex flex-wrap items-end gap-3">
          <Champ id="du" type="date" libelle={t("commun.du")} valeur={du} onChange={(v) => setPeriode([v, au])} />
          <Champ id="au" type="date" libelle={t("commun.au")} valeur={au} onChange={(v) => setPeriode([du, v])} />
          {ref && ref.entites.length > 1 && (
            <Selecteur id="entite" className="min-w-[240px]" libelle={t("commun.entite")} valeur={entite} onChange={setEntite} options={ref.entites.map((e) => ({ valeur: e.id, libelle: `${"· ".repeat(e.niveau)}${e.nom}` }))} />
          )}
          <div className="flex gap-1.5">
            <Bouton variante="contour" taille="petite" onClick={() => setPeriode(periode("mois"))}>{t("reporting.moisPrecedent")}</Bouton>
            <Bouton variante="contour" taille="petite" onClick={() => setPeriode(periode("trimestre"))}>{t("reporting.trimestreEnCours")}</Bouton>
            <Bouton variante="contour" taille="petite" onClick={() => setPeriode(periode("annee"))}>{t("reporting.annee")}</Bouton>
          </div>
        </div>
      </Carte>
      {erreur && <Bandeau ton="alerte">{erreur.message}</Bandeau>}
      {!donnees ? <Chargement lignes={8} /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Indicateur libelle={t("reporting.dossiersTraites")} valeur={donnees.nb} />
            <Indicateur libelle={t("reporting.montantDemande")} valeur={fmt.ref(donnees.montantRef)} />
            <Indicateur libelle={t("reporting.montantAccorde")} valeur={fmt.ref(donnees.montantAccordeRef)} ton="favorable" />
            <Indicateur libelle={t("reporting.projetsDD")} valeur={donnees.projetsDD} />
            <Indicateur libelle={t("reporting.tauxRealisation")} valeur={donnees.tauxRealisation === null ? "—" : `${fmt.nombre(donnees.tauxRealisation * 100, 0)} %`} precision={`${t("reporting.plansAction")} : ${donnees.plansAction}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Carte titre={t("reporting.parCategorie")}>
              <Barres barres={CATEGORIES.map((c) => ({ cle: c, libelle: t(`categorie.${c}`), valeur: donnees.parCategorie[c] ?? 0, couleur: COULEUR_CATEGORIE[c] }))} />
            </Carte>
            <Carte titre={t("dossier.niveauRisque")}>
              <Barres barres={NIVEAUX_RISQUE.map((n) => ({ cle: n, libelle: t(`niveau.${n}`), valeur: donnees.parNiveau[n] ?? 0, couleur: COULEUR_NIVEAU[n] }))} />
            </Carte>
            <Carte titre={t("reporting.parDecision")}>
              <Barres barres={["accorde", "rejete", "ajourne", "attente"].map((d) => ({ cle: d, libelle: d === "attente" ? t("comite.attente") : t(`decision.${d}`), valeur: donnees.parDecision[d] ?? 0, couleur: d === "accorde" ? "bg-success" : d === "rejete" ? "bg-destructive" : "bg-muted-foreground/50" }))} />
            </Carte>
          </div>
          <Carte titre={t("reporting.syntheseEntite")} sansMarge>
            {donnees.parEntite.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
              <Tableau>
                <thead>
                  <tr>
                    <Th>{t("commun.entite")}</Th><Th alignFin>{t("tableau.dossiers")}</Th><Th alignFin>A</Th><Th alignFin>B</Th><Th alignFin>C</Th><Th alignFin>FI</Th>
                    <Th alignFin>{t("dossier.exclu")}</Th><Th alignFin>{t("decision.accorde")}</Th><Th alignFin>{t("decision.rejete")}</Th><Th alignFin>{t("comite.attente")}</Th><Th alignFin>{t("reporting.montantDemande")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.parEntite.map((e) => (
                    <Tr key={e.entite}>
                      <Td className="font-medium">{e.entite}</Td><Td alignFin>{e.nb}</Td><Td alignFin>{e.A}</Td><Td alignFin>{e.B}</Td><Td alignFin>{e.C}</Td><Td alignFin>{e.FI}</Td>
                      <Td alignFin>{e.exclus}</Td><Td alignFin>{e.accordes}</Td><Td alignFin>{e.rejetes}</Td><Td alignFin>{e.sansDecision}</Td><Td alignFin>{fmt.ref(e.montant)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Tableau>
            )}
          </Carte>
          <div className="grid gap-4 lg:grid-cols-2">
            <Carte titre={t("reporting.parSecteur")}>
              <Barres barres={donnees.parSecteur.map(([s, v]) => ({ cle: s, libelle: s, valeur: v, affichage: fmt.ref(v) }))} vide={t("commun.aucuneDonnee")} />
            </Carte>
            <Carte id="sans-decision" titre={t("reporting.sansDecision")} description={t("reporting.sansDecisionAide")} sansMarge>
              {donnees.sansDecision.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
                <ul className="divide-y divide-border">
                  {donnees.sansDecision.map((d) => (
                    <li key={d.id} className="px-4 py-2.5 text-[13px]">
                      <Link href={`/dossiers/${d.id}`} className="font-medium hover:underline">{d.client}</Link>
                      <span className="ms-2 text-muted-foreground" dir="ltr">{d.reference}</span>
                      <p className="text-[12px] text-muted-foreground">{d.entite} · {t("validation.valideLe")} {fmt.date(d.valideLe)} · {d.charge}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>
          </div>
          <Carte titre={t("reporting.listeMensuelle")} sansMarge>
            {donnees.dossiers.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
              <Tableau>
                <thead><tr><Th>{t("commun.date")}</Th><Th>{t("dossier.reference")}</Th><Th>{t("dossier.client")}</Th><Th>{t("commun.entite")}</Th><Th>{t("dossier.categorie")}</Th><Th>{t("dossier.niveauRisque")}</Th><Th alignFin>{t("commun.montant")}</Th><Th>{t("commun.statut")}</Th></tr></thead>
                <tbody>
                  {donnees.dossiers.map((d) => (
                    <Tr key={d.id}>
                      <Td className="whitespace-nowrap">{fmt.date(d.date)}</Td>
                      <Td><Link href={`/dossiers/${d.id}`} className="hover:underline" dir="ltr">{d.reference}</Link></Td>
                      <Td>{d.client}</Td><Td className="text-muted-foreground">{d.entite}</Td>
                      <Td><PuceCategorie categorie={d.categorie} /></Td><Td><PuceNiveau niveau={d.niveauRisque} /></Td>
                      <Td alignFin>{fmt.compact(d.montantDemande, d.deviseCode)}</Td>
                      <Td><span className="flex gap-1"><PuceStatut statut={d.statut} /><PuceDecision decision={d.decision} /></span></Td>
                    </Tr>
                  ))}
                </tbody>
              </Tableau>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
