"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Printer, Sparkles } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { calculerRisque, estRisque, lireSeuils } from "@/lib/domaine/risque";
import { lireJson, cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { CLASSE_CHAMP, ChoixSegmente, ZoneTexte } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Progression, Sablier } from "@/components/ui/mise-en-page";
import { Puce, PuceNiveau } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";
import { AssistantIA } from "./assistant-ia";

interface Question {
  id: string;
  code: string;
  libelle: string;
  aide: string | null;
  type: string;
  options: string | null;
  reponseRisque: string | null;
  gravite: number;
  references: string | null;
  obligatoire: boolean;
  nbActions: number;
}

interface Donnees {
  categorie: string | null;
  thematiques: { id: string; code: string; libelle: string; normes: string | null; blocs: { id: string; code: string; libelle: string; questions: Question[] }[] }[];
  reponses: { questionId: string; valeur: string | null; commentaire: string | null }[];
  commentaireEvaluation: string | null;
  commentaireObligatoire: boolean;
}

type Saisie = Record<string, { valeur: string; commentaire: string }>;

export function VoletEvaluation() {
  const { t, lib, parametres } = useApp();
  const { dossier, droits, recharger } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVolet } = useDonnees<Donnees>(`/api/dossiers/${dossier.id}/evaluation`);
  const [saisie, setSaisie] = useState<Saisie>({});
  const [commentaire, setCommentaire] = useState("");
  const [filtre, setFiltre] = useState<"tout" | "risques" | "vides">("tout");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [assistant, setAssistant] = useState(false);

  const initiale = useMemo<Saisie>(
    () => Object.fromEntries((donnees?.reponses ?? []).map((r) => [r.questionId, { valeur: r.valeur ?? "", commentaire: r.commentaire ?? "" }])),
    [donnees]
  );
  useEffect(() => {
    setSaisie(initiale);
    setCommentaire(donnees?.commentaireEvaluation ?? "");
  }, [initiale, donnees]);

  const questions = useMemo(() => (donnees?.thematiques ?? []).flatMap((th) => th.blocs.flatMap((b) => b.questions.map((q) => ({ ...q, thematique: th.code })))), [donnees]);
  const synthese = useMemo(
    () =>
      calculerRisque(
        questions,
        Object.fromEntries(Object.entries(saisie).map(([k, v]) => [k, v.valeur])),
        { categorie: donnees?.categorie, seuils: lireSeuils(parametres.SEUILS_NIVEAU_RISQUE), releverCategorieA: parametres.RELEVER_NIVEAU_CATEGORIE_A !== "false" }
      ),
    [questions, saisie, donnees?.categorie, parametres]
  );

  if (!donnees) return <Chargement lignes={8} />;
  if (!donnees.categorie) return <Bandeau ton="vigilance">{t("evaluation.pasDeCategorie")}</Bandeau>;

  const lecture = !droits.evaluation;
  const modifies = Object.keys({ ...saisie, ...initiale }).filter(
    (k) => (saisie[k]?.valeur ?? "") !== (initiale[k]?.valeur ?? "") || (saisie[k]?.commentaire ?? "") !== (initiale[k]?.commentaire ?? "")
  );
  const modifie = modifies.length > 0 || commentaire !== (donnees.commentaireEvaluation ?? "");
  const maj = (id: string, champ: "valeur" | "commentaire", v: string) =>
    setSaisie((s) => ({ ...s, [id]: { valeur: s[id]?.valeur ?? "", commentaire: s[id]?.commentaire ?? "", [champ]: v } }));

  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      const r = await api<{ plan: { ajoutees: number; retirees: number } }>(`/api/dossiers/${dossier.id}/evaluation`, {
        method: "PUT",
        body: {
          reponses: modifies.map((id) => ({ questionId: id, valeur: saisie[id]?.valeur || null, commentaire: saisie[id]?.commentaire || null })),
          commentaireEvaluation: commentaire,
        },
      });
      toast(`${t("commun.enregistre")} — ${t("plan.generees", { ajoutees: r.plan.ajoutees, retirees: r.plan.retirees })}`);
      await Promise.all([rechargerVolet(), recharger()]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const visible = (q: Question) => {
    const v = saisie[q.id]?.valeur ?? "";
    if (filtre === "vides") return !v;
    if (filtre === "risques") return estRisque(q, v);
    return true;
  };

  const controle = (q: Question) => {
    const v = saisie[q.id]?.valeur ?? "";
    const risques = (q.reponseRisque ?? "").split(",").map((s) => s.trim());
    if (q.type === "oui_non" || q.type === "oui_non_na") {
      const opts = [
        { valeur: "oui", libelle: t("commun.oui") },
        { valeur: "non", libelle: t("commun.non") },
      ];
      if (q.type === "oui_non_na") opts.push({ valeur: "na", libelle: t("commun.na") });
      return <ChoixSegmente nom={q.code} valeur={v || null} onChange={(x) => maj(q.id, "valeur", x)} options={opts} risque={risques} desactive={lecture} taille="petite" />;
    }
    if (q.type === "choix") {
      const options = lireJson<{ code: string; libelle: string }[]>(q.options, []);
      return (
        <select aria-label={lib(q.libelle)} value={v} disabled={lecture} onChange={(e) => maj(q.id, "valeur", e.target.value)} className={cn(CLASSE_CHAMP, "w-56")}>
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {lib(o.libelle)}
            </option>
          ))}
        </select>
      );
    }
    if (q.type === "nombre") {
      return <input aria-label={lib(q.libelle)} type="number" value={v} disabled={lecture} onChange={(e) => maj(q.id, "valeur", e.target.value)} className={cn(CLASSE_CHAMP, "w-32 tabulaire", estRisque(q, v) && "border-destructive")} />;
    }
    return null;
  };

  const nbRepondues = synthese.nbRepondues;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Bandeau ton="info">{t("evaluation.description", { categorie: donnees.categorie })}</Bandeau>
          <div className="no-print flex flex-wrap items-center gap-2">
            {(["tout", "risques", "vides"] as const).map((f) => (
              <Bouton key={f} variante={filtre === f ? "secondaire" : "fantome"} taille="petite" onClick={() => setFiltre(f)}>
                {f === "tout" ? t("commun.tous") : f === "risques" ? t("evaluation.filtreRisques") : t("evaluation.filtreSansReponse")}
              </Bouton>
            ))}
            <span className="ms-auto flex gap-2">
              {parametres.IA_ACTIVE === "true" && droits.evaluation && (
                <Bouton variante="contour" taille="petite" onClick={() => setAssistant(true)}>
                  <Sparkles /> {t("evaluation.assistantIA")}
                </Bouton>
              )}
              <Bouton variante="contour" taille="petite" asChild>
                <Link href={`/dossiers/${dossier.id}/impression?doc=questionnaire`} target="_blank">
                  <Printer /> {t("evaluation.imprimerQuestionnaire")}
                </Link>
              </Bouton>
            </span>
          </div>

          {donnees.thematiques.map((th) => {
            const blocs = th.blocs.map((b) => ({ ...b, questions: b.questions.filter(visible) })).filter((b) => b.questions.length);
            if (!blocs.length) return null;
            return (
              <Carte key={th.id} titre={lib(th.libelle)} description={th.normes ?? undefined} sansMarge>
                {blocs.map((b) => (
                  <div key={b.id}>
                    {th.blocs.length > 1 || lib(b.libelle) !== lib(th.libelle) ? (
                      <p className="border-b border-border bg-surface px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{lib(b.libelle)}</p>
                    ) : null}
                    <ul className="divide-y divide-border">
                      {b.questions.map((q) => {
                        const v = saisie[q.id]?.valeur ?? "";
                        const risque = estRisque(q, v);
                        const ouvert = ouverts.has(q.id) || !!saisie[q.id]?.commentaire;
                        return (
                          <li key={q.id} className={cn("px-4 py-3", risque && "bg-destructive-subtle/50")}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] leading-relaxed">
                                  {lib(q.libelle)}
                                  {q.obligatoire && !v && <span className="ms-1 text-destructive">*</span>}
                                </p>
                                {q.aide && <p className="mt-0.5 text-[12px] text-muted-foreground">{lib(q.aide)}</p>}
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                  {q.reponseRisque && (
                                    <Puce ton={q.gravite >= 4 ? "alerte" : q.gravite === 3 ? "vigilance" : "neutre"}>
                                      {t("evaluation.gravite")} : {t(`evaluation.gravite${q.gravite}`)}
                                    </Puce>
                                  )}
                                  {q.references && <span>{q.references}</span>}
                                  {risque && (
                                    <Puce ton="alerte">
                                      {t("evaluation.risque")}
                                      {q.nbActions ? ` → ${q.nbActions}` : ""}
                                    </Puce>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {controle(q)}
                                {q.type !== "texte" && (
                                  <button
                                    type="button"
                                    title={t("evaluation.commentaireQuestion")}
                                    aria-label={t("evaluation.commentaireQuestion")}
                                    onClick={() => setOuverts((s) => new Set(s).add(q.id))}
                                    className={cn("rounded-md p-1.5 hover:bg-accent", saisie[q.id]?.commentaire ? "text-primary" : "text-muted-foreground")}
                                  >
                                    <MessageSquare size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {q.type === "texte" && (
                              <textarea aria-label={lib(q.libelle)} dir="auto" value={v} disabled={lecture} onChange={(e) => maj(q.id, "valeur", e.target.value)} rows={2} className={cn(CLASSE_CHAMP, "mt-2")} />
                            )}
                            {ouvert && q.type !== "texte" && (
                              <textarea
                                aria-label={t("evaluation.commentaireQuestion")}
                                placeholder={t("evaluation.commentaireQuestion")}
                                dir="auto"
                                value={saisie[q.id]?.commentaire ?? ""}
                                disabled={lecture}
                                onChange={(e) => maj(q.id, "commentaire", e.target.value)}
                                rows={2}
                                className={cn(CLASSE_CHAMP, "mt-2 text-[13px]")}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </Carte>
            );
          })}

          <Carte titre={t("evaluation.commentaireEvaluation")} actions={!lecture && !commentaire && <Bouton variante="contour" taille="petite" onClick={() => setCommentaire(t("evaluation.canevas"))}>{t("evaluation.insererCanevas")}</Bouton>}>
            <ZoneTexte id="commentaire-eval" libelle={t("evaluation.commentaireEvaluation")} aide={t("evaluation.commentaireAide")} valeur={commentaire} onChange={setCommentaire} lignes={8} obligatoire={donnees.commentaireObligatoire} desactive={lecture} />
          </Carte>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Carte titre={t("dossier.niveauRisque")}>
            <div className="flex items-baseline justify-between">
              <PuceNiveau niveau={nbRepondues ? synthese.niveau : null} />
              <span className="text-[24px] font-semibold tabulaire">
                {nbRepondues ? synthese.score.toFixed(0) : "—"}
                <span className="ms-1 text-[12px] font-normal text-muted-foreground">{t("commun.sur100")}</span>
              </span>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">{t("evaluation.progression", { n: synthese.nbRepondues, total: synthese.nbApplicables })}</p>
            <Progression valeur={(100 * synthese.nbRepondues) / Math.max(1, synthese.nbApplicables)} className="mt-1" />
            <p className="mt-3 text-[13px]">
              {t("dossier.risquesNonMaitrises")} : <strong className={synthese.nbRisques ? "text-destructive" : ""}>{synthese.nbRisques}</strong>
            </p>
            {synthese.complet && <p className="mt-2 text-[12px] text-success">{t("evaluation.toutRepondu")}</p>}
          </Carte>
          <Carte titre={t("evaluation.synthese")} sansMarge>
            <ul className="divide-y divide-border">
              {synthese.parThematique.map((s) => {
                const th = donnees.thematiques.find((x) => x.code === s.thematique);
                return (
                  <li key={s.thematique} className="flex items-start justify-between gap-2 px-4 py-2 text-[12.5px]">
                    <span className="min-w-0 leading-snug">{th ? lib(th.libelle) : s.thematique}</span>
                    <Puce className="shrink-0" ton={s.etat === "non_maitrise" ? "alerte" : s.etat === "maitrise" ? "favorable" : "neutre"}>
                      {s.etat === "non_maitrise" ? t("evaluation.nbRisques", { n: s.risques }) : s.etat === "maitrise" ? t("evaluation.maitrise") : t("evaluation.nonConcerne")}
                    </Puce>
                  </li>
                );
              })}
            </ul>
          </Carte>
        </aside>
      </div>
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      <BarreVolet modifie={!lecture && modifie} suivante={parametres.VOLET_CLIMAT_ACTIF !== "false" ? "climat" : "plan"}>
        {!lecture && (
          <Bouton onClick={enregistrer} disabled={!modifie || enCours}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        )}
      </BarreVolet>
      {assistant && (
        <AssistantIA
          onFermer={() => setAssistant(false)}
          onAppliquer={(propositions) => {
            setSaisie((s) => {
              const n = { ...s };
              for (const p of propositions) n[p.questionId] = { valeur: p.valeur, commentaire: p.justification };
              return n;
            });
            setAssistant(false);
          }}
        />
      )}
    </div>
  );
}
