"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, FilePen, Gavel, Hourglass, ListTodo } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { CATEGORIES, NIVEAUX_RISQUE } from "@/lib/domaine/constantes";
import { useApp } from "@/components/providers/application";
import { Barres, Colonnes, COULEUR_CATEGORIE, COULEUR_NIVEAU } from "@/components/ui/graphiques";
import { Bandeau, Carte, Chargement, EnTete, Indicateur, Vide } from "@/components/ui/mise-en-page";
import { PuceCategorie, PuceDecision, PuceNiveau, PuceStatut } from "@/components/ui/puces";

interface Donnees {
  lecture: boolean;
  aTraiter: { brouillons: number; aValider: number | null; auComite: number; sansDecision: number; actionsEnRetard: number; visitesAPlanifier: number };
  delaiDecisionJours: number;
  portefeuille: {
    nb: number;
    montantRef: number;
    categorieA: number;
    exclusions: number;
    parCategorie: Record<string, number>;
    parNiveau: Record<string, number>;
    decisions: Record<string, number>;
    tauxAccord: number | null;
    parMois: Record<string, number>;
  };
  climat: { emissionsFinancees: number; eleve: number; evalues: number };
  recents: { id: string; reference: string; statut: string; categorie: string | null; niveauRisque: string | null; scoreRisque: number | null; client: string; montantDemande: number; deviseCode: string; decision: string | null }[];
}

export default function PageTableauDeBord() {
  const { t, fmt, session, langue, parametres } = useApp();
  const { donnees, erreur } = useDonnees<Donnees>("/api/tableau-de-bord");
  if (erreur) return <Bandeau ton="alerte">{erreur.message}</Bandeau>;
  if (!donnees) return <Chargement lignes={8} />;
  if (!donnees.lecture) return <EnTete titre={t("tableau.bonjour", { prenom: session?.prenom ?? "" })} />;
  const a = donnees.aTraiter;
  const pf = donnees.portefeuille;

  const taches = [
    { cle: "brouillons", n: a.brouillons, libelle: t("tableau.brouillons"), href: "/dossiers?statut=brouillon&mes=1", icone: FilePen, ton: "neutre" as const },
    a.aValider !== null && { cle: "aValider", n: a.aValider, libelle: t("tableau.aValider"), href: "/dossiers?statut=soumis", icone: ClipboardCheck, ton: "vigilance" as const },
    { cle: "auComite", n: a.auComite, libelle: t("tableau.auComite"), href: "/dossiers?statut=valide", icone: Gavel, ton: "neutre" as const },
    { cle: "sansDecision", n: a.sansDecision, libelle: t("tableau.sansDecision", { jours: donnees.delaiDecisionJours }), href: "/reporting#sans-decision", icone: Hourglass, ton: "alerte" as const },
    { cle: "actions", n: a.actionsEnRetard, libelle: t("tableau.actionsEnRetard"), href: "/plans-action?retard=1", icone: ListTodo, ton: "alerte" as const },
    { cle: "visites", n: a.visitesAPlanifier, libelle: t("tableau.visitesAPlanifier"), href: "/visites", icone: CalendarClock, ton: "vigilance" as const },
  ].filter(Boolean) as { cle: string; n: number; libelle: string; href: string; icone: typeof FilePen; ton: "neutre" | "vigilance" | "alerte" }[];

  const nomMois = (k: string) => new Intl.DateTimeFormat(langue === "ar" ? "ar-MA" : langue, { month: "short" }).format(new Date(`${k}-15`));
  const nbDecisions = (pf.decisions.accorde ?? 0) + (pf.decisions.rejete ?? 0);

  return (
    <div className="space-y-5">
      <EnTete titre={t("tableau.bonjour", { prenom: session?.prenom ?? "" })} description={t("tableau.description")} />

      <section>
        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{t("tableau.aTraiter")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {taches.map((x) => {
            const Icone = x.icone;
            const actif = x.n > 0;
            return (
              <Link
                key={x.cle}
                href={x.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring/60"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-md ${actif && x.ton === "alerte" ? "bg-destructive-subtle text-destructive" : actif && x.ton === "vigilance" ? "bg-warning-subtle text-warning" : "bg-accent text-accent-foreground"}`}>
                  <Icone size={17} />
                </span>
                <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">{x.libelle}</span>
                <span className={`text-[24px] font-semibold tabulaire ${actif && x.ton === "alerte" ? "text-destructive" : ""}`}>{x.n}</span>
                <ArrowRight size={15} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{t("tableau.portefeuille")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicateur libelle={t("tableau.dossiers")} valeur={pf.nb} href="/dossiers" />
          <Indicateur libelle={t("tableau.montantEvalue")} valeur={fmt.ref(pf.montantRef)} />
          <Indicateur libelle={t("tableau.categorieA")} valeur={pf.categorieA} ton={pf.categorieA ? "vigilance" : "neutre"} href="/dossiers?categorie=A" />
          <Indicateur libelle={t("tableau.exclusions")} valeur={pf.exclusions} ton={pf.exclusions ? "alerte" : "favorable"} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre={t("tableau.repartitionCategories")}>
          <Barres barres={CATEGORIES.map((c) => ({ cle: c, libelle: t(`categorie.${c}`), valeur: pf.parCategorie[c] ?? 0, couleur: COULEUR_CATEGORIE[c] }))} />
        </Carte>
        <Carte titre={t("tableau.repartitionNiveaux")}>
          <Barres barres={NIVEAUX_RISQUE.map((n) => ({ cle: n, libelle: t(`niveau.${n}`), valeur: pf.parNiveau[n] ?? 0, couleur: COULEUR_NIVEAU[n] }))} />
        </Carte>
        <Carte titre={t("tableau.decisions")}>
          <Barres
            barres={["accorde", "rejete"].map((d) => ({ cle: d, libelle: t(`decision.${d}`), valeur: pf.decisions[d] ?? 0, couleur: d === "accorde" ? "bg-success" : "bg-destructive" }))}
          />
          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {t("tableau.tauxAccord")} : <strong className="text-foreground">{pf.tauxAccord === null ? "—" : `${fmt.nombre(pf.tauxAccord * 100, 0)} %`}</strong> ({nbDecisions})
          </p>
        </Carte>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Carte titre={t("tableau.evolution")}>
          <Colonnes colonnes={Object.entries(pf.parMois).map(([k, v]) => ({ cle: k, libelle: nomMois(k), valeur: v }))} />
        </Carte>
        {parametres.VOLET_CLIMAT_ACTIF !== "false" && (
          <Carte titre={t("tableau.climat")} actions={<Link href="/climat" className="text-[12.5px] text-primary hover:underline">{t("commun.voir")}</Link>}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("tableau.emissionsFinancees")}</p>
            <p className="mt-1 text-[24px] font-semibold tabulaire">
              {fmt.nombre(donnees.climat.emissionsFinancees, 0)} <span className="text-[12px] font-normal text-muted-foreground">{t("commun.tco2e")}</span>
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("tableau.risqueClimatEleve")}</p>
            <p className={`mt-1 text-[24px] font-semibold tabulaire ${donnees.climat.eleve ? "text-destructive" : ""}`}>
              {donnees.climat.eleve} <span className="text-[12px] font-normal text-muted-foreground">/ {donnees.climat.evalues}</span>
            </p>
          </Carte>
        )}
      </div>

      <Carte titre={t("tableau.derniersDossiers")} sansMarge actions={<Link href="/dossiers" className="text-[12.5px] text-primary hover:underline">{t("commun.voir")}</Link>}>
        {donnees.recents.length === 0 ? (
          <Vide titre={t("tableau.rienATraiter")} />
        ) : (
          <ul className="divide-y divide-border">
            {donnees.recents.map((d) => (
              <li key={d.id}>
                <Link href={`/dossiers/${d.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-surface">
                  <span className="w-[230px] font-medium" dir="ltr">
                    {d.reference}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{d.client}</span>
                  <PuceCategorie categorie={d.categorie} />
                  <PuceNiveau niveau={d.niveauRisque} />
                  <span className="w-28 text-end tabulaire text-muted-foreground">{fmt.compact(d.montantDemande, d.deviseCode)}</span>
                  <PuceStatut statut={d.statut} />
                  <PuceDecision decision={d.decision} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
