"use client";

import { Suspense, use, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Circle,
  FileText,
  Lock,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api, ErreurApi, useDonnees } from "@/lib/client/api";
import { TRANSITIONS, type Transition } from "@/lib/domaine/workflow";
import { cn, lireJson } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { ZoneTexte } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Chargement, EnTete } from "@/components/ui/mise-en-page";
import { Puce, PuceCategorie, PuceDecision, PuceESG, PuceNiveau, PuceStatut } from "@/components/ui/puces";
import { ContexteDossier, type EtatDossier, type Prefill } from "@/components/dossier/contexte";
import { VoletIdentification } from "@/components/dossier/volet-identification";
import { VoletExclusion } from "@/components/dossier/volet-exclusion";
import { VoletCategorisation } from "@/components/dossier/volet-categorisation";
import { VoletEvaluation } from "@/components/dossier/volet-evaluation";
import { VoletClimat } from "@/components/dossier/volet-climat";
import { VoletPlan } from "@/components/dossier/volet-plan";
import { VoletFiche } from "@/components/dossier/volet-fiche";
import { VoletDecision } from "@/components/dossier/volet-decision";
import { VoletSuivi } from "@/components/dossier/volet-suivi";
import { VoletPieces } from "@/components/dossier/volet-pieces";
import { AssistantIA } from "@/components/dossier/assistant-ia";
import { VoletHistorique } from "@/components/dossier/volet-historique";

const VOLETS = [
  { id: "identification", composant: VoletIdentification },
  { id: "exclusion", composant: VoletExclusion },
  { id: "categorisation", composant: VoletCategorisation },
  { id: "evaluation", composant: VoletEvaluation },
  { id: "climat", composant: VoletClimat },
  { id: "plan", composant: VoletPlan },
  { id: "fiche", composant: VoletFiche },
  { id: "decision", composant: VoletDecision },
  { id: "suivi", composant: VoletSuivi },
  { id: "pieces", composant: VoletPieces },
  { id: "historique", composant: VoletHistorique },
] as const;

function Espace({ id }: { id: string }) {
  const { t, fmt, parametres } = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { donnees, erreur, recharger } = useDonnees<EtatDossier>(`/api/dossiers/${id}`);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreurTransition, setErreurTransition] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [prefill, setPrefillEtat] = useState<Prefill>({});
  const setPrefill = useCallback((n: Prefill) => setPrefillEtat((p) => ({ ...p, ...n })), []);
  const consommer = useCallback((k: keyof Prefill) => setPrefillEtat((p) => { const reste = { ...p }; delete reste[k]; return reste; }), []);

  const climatActif = parametres.VOLET_CLIMAT_ACTIF !== "false";
  const volets = VOLETS.filter((v) => climatActif || v.id !== "climat");
  const etape = sp.get("etape") ?? "identification";
  const Volet = (volets.find((v) => v.id === etape) ?? volets[0]).composant;
  const aller = useCallback((e: string) => router.replace(`/dossiers/${id}?etape=${e}`, { scroll: false }), [router, id]);

  if (erreur) return <Bandeau ton="alerte">{erreur.code === "introuvable" ? t("erreurs.introuvable") : erreur.message}</Bandeau>;
  if (!donnees) return <Chargement lignes={8} />;
  const { dossier: d, droits, etapes } = donnees;

  const executer = async () => {
    if (!transition) return;
    setEnCours(true);
    setErreurTransition("");
    try {
      await api(`/api/dossiers/${id}/transition`, { body: { transition, commentaire: commentaire || null } });
      toast(t("transition.effectuee"));
      setTransition(null);
      setCommentaire("");
      await recharger();
    } catch (e) {
      if (e instanceof ErreurApi && e.code === "incomplet" && Array.isArray(e.details)) {
        setErreurTransition((e.details as string[]).map((m) => t(`dossier.blocage_${m}`)).join(" · "));
      } else setErreurTransition(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    await api(`/api/dossiers/${id}`, { method: "DELETE" });
    router.push("/dossiers");
  };

  const motifs = (d.motifDeclenchement ?? "").split(",").filter(Boolean);
  const visibles = droits.transitions.filter((x) => x !== "decider");

  return (
    <ContexteDossier.Provider value={{ ...donnees, recharger, prefill, setPrefill, consommer }}>
      <div className="space-y-4">
        <EnTete
          retour={{ href: "/dossiers", libelle: t("nav.dossiers") }}
          titre={
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr">{d.reference}</span>
              {d.verrouille && <Lock size={17} className="text-muted-foreground" aria-label={t("commun.verrouille")} />}
            </span>
          }
          description={
            <>
              <Link href={`/clients/${d.client.id}`} className="font-medium text-foreground hover:underline">
                {d.client.raisonSociale}
              </Link>
              {" · "}
              {d.entite.nom} · {fmt.montant(d.montantDemande, d.deviseCode)}
            </>
          }
          meta={
            <>
              <PuceStatut statut={d.statut} />
              <PuceCategorie categorie={d.categorie} sous={d.sousCategorieFI} />
              {d.niveauRisque && <PuceNiveau niveau={d.niveauRisque} score={d.scoreRisque} />}
              <PuceESG note={d.noteESG} score={d.scoreESG} provisoire={!!lireJson<{ provisoire?: boolean }>(d.detailESG, {}).provisoire} />
              {d.climat?.niveauClimat && (
                <Puce ton="info" title={t("climat.score")}>
                  {t("etape.climat")} : {t(`niveau.${d.climat.niveauClimat}`)}
                </Puce>
              )}
              <PuceDecision decision={d.decision} />
              <Puce ton={d.evaluationObligatoire ? "vigilance" : "neutre"} title={motifs.map((m) => t(`dossier.motif${m === "categorie_a" ? "CategorieA" : m === "seuil" ? "Seuil" : m === "hors_perimetre" ? "HorsPerimetre" : "Volontaire"}`, { seuil: fmt.ref(donnees.seuil) })).join(" · ")}>
                {t("dossier.declenchement")} : {d.evaluationObligatoire ? t("dossier.obligatoire") : t("dossier.volontaire")}
              </Puce>
              {d.exclu && (
                <Puce ton="alerte">
                  <Ban size={12} /> {t("dossier.exclusionOui")}
                </Puce>
              )}
            </>
          }
          actions={
            <>
              <Bouton variante="contour" asChild>
                <Link href={`/dossiers/${id}/impression`} target="_blank">
                  <FileText /> {t("fiche.ouvrir")}
                </Link>
              </Bouton>
              {parametres.IA_ACTIVE === "true" && droits.pieces && (
                <Bouton variante="contour" onClick={() => setAssistant(true)}>
                  <Sparkles /> {t("evaluation.assistantIA")}
                </Bouton>
              )}
              {visibles.map((x) => (
                <Bouton key={x} variante={x === "annuler" || x === "retourner" ? "contour" : "primaire"} onClick={() => setTransition(x)}>
                  {t(`transition.${x}`)}
                </Bouton>
              ))}
              {droits.decider && <Bouton onClick={() => aller("decision")}>{t("transition.decider")}</Bouton>}
              {(d.statut === "decide" || d.statut === "cloture") && (
                <Bouton variante="contour" asChild>
                  <Link href={`/dossiers/nouveau?client=${d.client.id}&precedent=${d.id}`}>
                    <RefreshCcw /> {t("dossier.renouveler")}
                  </Link>
                </Bouton>
              )}
              {droits.supprimer && (
                <Bouton variante="fantome" onClick={supprimer} aria-label={t("dossier.supprimerBrouillon")} title={t("dossier.supprimerBrouillon")}>
                  <Trash2 className="text-destructive" />
                </Bouton>
              )}
            </>
          }
        />

        {assistant && <AssistantIA onFermer={() => setAssistant(false)} />}
        {d.verrouille && <Bandeau ton="info">{t("dossier.verrouilleMessage")}</Bandeau>}
        {!droits.ecriture && <Bandeau ton="info">{t("dossier.perimetreMessage")}</Bandeau>}

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          <nav aria-label={t("dossier.avancement")} className="no-print">
            <ol className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible">
              {volets.map((v, i) => {
                const fait = etapes[v.id];
                const actif = v.id === etape;
                const numerote = i < 9;
                return (
                  <li key={v.id} className={cn(!numerote && i === 9 && "lg:mt-3 lg:border-t lg:border-border lg:pt-3")}>
                    <button
                      onClick={() => aller(v.id)}
                      aria-current={actif ? "step" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-start text-[13px] transition-colors",
                        actif ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      {numerote ? (
                        fait ? (
                          <CheckCircle2 size={16} className="shrink-0 text-success" />
                        ) : (
                          <Circle size={16} className="shrink-0 opacity-50" />
                        )
                      ) : (
                        <span className="w-4" />
                      )}
                      <span>{t(`etape.${v.id}`)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="min-w-0">
            <Volet />
          </div>
        </div>
      </div>

      <Dialogue
        ouvert={!!transition}
        onFermer={() => setTransition(null)}
        titre={transition ? t("transition.confirmer", { action: t(`transition.${transition}`) }) : ""}
        pied={
          <>
            <Bouton variante="contour" onClick={() => setTransition(null)}>
              {t("commun.annuler")}
            </Bouton>
            <Bouton onClick={executer} disabled={enCours || (!!transition && TRANSITIONS[transition].commentaireObligatoire && !commentaire.trim())}>
              {t("commun.confirmer")}
            </Bouton>
          </>
        }
      >
        <div className="space-y-3">
          {erreurTransition && <Bandeau ton="alerte">{erreurTransition}</Bandeau>}
          {transition === "valider" && <p className="text-[13px] text-muted-foreground">{t("validation.description")}</p>}
          <ZoneTexte
            id="commentaire-transition"
            libelle={t("commun.commentaire")}
            valeur={commentaire}
            onChange={setCommentaire}
            obligatoire={!!transition && TRANSITIONS[transition].commentaireObligatoire}
            aide={transition && TRANSITIONS[transition].commentaireObligatoire ? t("transition.commentaireRequis") : undefined}
          />
        </div>
      </Dialogue>
    </ContexteDossier.Provider>
  );
}

export default function PageDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <Espace id={id} />
    </Suspense>
  );
}
