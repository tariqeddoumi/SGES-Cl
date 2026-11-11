"use client";

import { Suspense, use, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Circle,
  FileText,
  Lock,
  RefreshCcw,
  ScanText,
  Trash2,
  Upload,
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
import { ContexteDossier, type Documents, type EtatDossier, type Prefill } from "@/components/dossier/contexte";
import { lirePropositions } from "@/lib/domaine/sources";
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

  // ── Documents et OCR intelligent : dépôt en un geste (bouton ou glisser-déposer), lecture automatique ──
  const ocrActif = parametres.IA_ACTIVE === "true";
  const lectureAuto = ocrActif && parametres.OCR_LECTURE_AUTO !== "false";
  const fichiers = useRef<HTMLInputElement>(null);
  const typeDepot = useRef("AUTRE");
  const [enCoursDoc, setEnCoursDoc] = useState<Documents["enCours"]>(null);
  const [version, setVersion] = useState(0);
  const [survol, setSurvol] = useState(false);

  const lire = useCallback(async () => {
    setEnCoursDoc("lecture");
    try {
      const r = await api<{ propositions: Record<string, unknown[]>; transcrites: number }>(`/api/dossiers/${id}/ia`, { body: {} });
      const n = ["identification", "exclusion", "categorisation", "evaluation", "climat"].reduce((a, k) => a + (r.propositions[k]?.length ?? 0), 0);
      toast(t("ocr.lu", { n }));
      setVersion((v) => v + 1);
      await recharger();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setEnCoursDoc(null);
    }
  }, [id, recharger, t, toast]);

  const deposerFichiers = useCallback(
    async (liste: File[]) => {
      if (!liste.length) return;
      setEnCoursDoc("depot");
      let ok = 0;
      for (const f of liste) {
        if (f.size > 10 * 1024 * 1024) {
          toast(`${f.name} : ${t("pieces.tropGros")}`, "erreur");
          continue;
        }
        const fd = new FormData();
        fd.append("fichier", f);
        fd.append("type", typeDepot.current);
        try {
          const r = await api<{ erreurOCR: string | null; origineTexte: string | null }>(`/api/dossiers/${id}/documents`, { formData: fd });
          ok++;
          if (r.erreurOCR) toast(t("ocr.erreurTranscription", { nom: f.name, message: r.erreurOCR }), "erreur");
        } catch (e) {
          toast(`${f.name} : ${e instanceof Error ? e.message : String(e)}`, "erreur");
        }
      }
      typeDepot.current = "AUTRE";
      if (fichiers.current) fichiers.current.value = "";
      setEnCoursDoc(null);
      if (ok) {
        toast(t("ocr.depose", { n: ok }));
        setVersion((v) => v + 1);
        await recharger();
        if (lectureAuto) await lire();
      }
    },
    [id, lectureAuto, lire, recharger, t, toast]
  );

  const documents = useMemo<Documents | null>(() => {
    if (!donnees) return null;
    const propositions = lirePropositions(donnees.dossier.propositionsOCR);
    const lus = new Set(propositions?.documents ?? []);
    return {
      ocrActif,
      propositions,
      aLire: donnees.pieces.filter((x) => !lus.has(x.id) && x.type !== "PHOTO"),
      typesLus: new Set(donnees.pieces.filter((x) => x.origineTexte || x.type === "CANEVAS").map((x) => x.type)),
      deposer: (type?: string) => {
        typeDepot.current = type ?? "AUTRE";
        fichiers.current?.click();
      },
      lire,
      ecarter: async (section, cles) => {
        await api(`/api/dossiers/${id}/ia/ecarter`, { body: { section, cles } }).catch(() => undefined);
        await recharger();
      },
      enCours: enCoursDoc,
      version,
    };
  }, [donnees, ocrActif, lire, id, recharger, enCoursDoc, version]);

  const climatActif = parametres.VOLET_CLIMAT_ACTIF !== "false";
  const volets = VOLETS.filter((v) => climatActif || v.id !== "climat");
  const etape = sp.get("etape") ?? "identification";
  const Volet = (volets.find((v) => v.id === etape) ?? volets[0]).composant;
  const aller = useCallback((e: string) => router.replace(`/dossiers/${id}?etape=${e}`, { scroll: false }), [router, id]);

  if (erreur) return <Bandeau ton="alerte">{erreur.code === "introuvable" ? t("erreurs.introuvable") : erreur.message}</Bandeau>;
  if (!donnees || !documents) return <Chargement lignes={8} />;
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
    <ContexteDossier.Provider value={{ ...donnees, documents, recharger, prefill, setPrefill, consommer }}>
      <input ref={fichiers} type="file" multiple className="hidden" aria-label={t("ocr.depot")} accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.doc,.xls,.txt" onChange={(e) => deposerFichiers(Array.from(e.target.files ?? []))} />
      <div
        className={cn("relative space-y-4", survol && "rounded-lg outline-dashed outline-2 outline-offset-4 outline-primary")}
        onDragOver={(e) => {
          if (!droits.pieces || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setSurvol(false);
        }}
        onDrop={(e) => {
          if (!droits.pieces) return;
          e.preventDefault();
          setSurvol(false);
          typeDepot.current = "AUTRE";
          deposerFichiers(Array.from(e.dataTransfer.files));
        }}
      >
        {survol && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center rounded-lg bg-primary/5 pt-24">
            <span className="rounded-md bg-surface px-4 py-2 text-[13.5px] font-medium shadow">{t("ocr.glisser")}</span>
          </div>
        )}
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
              {droits.pieces && (
                <Bouton variante="contour" onClick={() => documents.deposer()} disabled={!!documents.enCours} title={t("ocr.glisser")}>
                  <Upload /> {t("ocr.depot")}
                </Bouton>
              )}
              {ocrActif && droits.pieces && (
                <Bouton variante="contour" onClick={() => setAssistant(true)}>
                  <ScanText /> {t("evaluation.assistantIA")}
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
        {documents.enCours && <Bandeau ton="info">{documents.enCours === "lecture" ? t("ocr.lectureEnCours") : t("ocr.depotEnCours")}</Bandeau>}
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
