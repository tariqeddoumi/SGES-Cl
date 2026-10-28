"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Printer, RefreshCcw, Trash2 } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { HORIZONS, STATUTS_ACTION } from "@/lib/domaine/constantes";
import { cn, dateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChoixSegmente, Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, Indicateur, Progression, Sablier, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";
import { useLibelles } from "@/lib/client/listes";

export interface ActionPlan {
  id: string;
  origine: string;
  thematique: string | null;
  libelle: string;
  horizon: string;
  negociable: boolean;
  retenue: boolean | null;
  reserveClient: string | null;
  responsable: string | null;
  dateDebut: string | null;
  dateEcheance: string | null;
  periode: string | null;
  avancement: number;
  statut: string;
  budget: number | null;
  deviseCode: string | null;
  commentaire: string | null;
  questionId: string | null;
  suivis: { id: string; date: string; avancement: number; statut: string; commentaire: string | null }[];
}

export function enRetard(a: Pick<ActionPlan, "dateEcheance" | "statut" | "retenue">): boolean {
  return !!a.dateEcheance && a.retenue !== false && a.statut !== "realisee" && a.statut !== "abandonnee" && new Date(a.dateEcheance) < new Date();
}

function LigneAction({ action, questions, onMaj }: { action: ActionPlan; questions: Map<string, { code: string; libelle: string }>; onMaj: () => Promise<void> }) {
  const { t, lib, fmt } = useApp();
  const fonctions = useLibelles("fonction_client");
  const { dossier, droits } = useDossier();
  const toast = useToast();
  const negociation = dossier.statut === "brouillon";
  const suivi = dossier.statut === "decide" || dossier.statut === "en_suivi";
  const editable = droits.plan;
  const initial = useMemo(
    () => ({
      retenue: action.retenue,
      reserveClient: action.reserveClient ?? "",
      responsable: action.responsable ?? "",
      dateDebut: dateInput(action.dateDebut),
      dateEcheance: dateInput(action.dateEcheance),
      budget: action.budget?.toString() ?? "",
      avancement: action.avancement,
      statut: action.statut,
      commentaireSuivi: "",
    }),
    [action]
  );
  const [v, setV] = useState(initial);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  useEffect(() => setV(initial), [initial]);
  const modifie = JSON.stringify(v) !== JSON.stringify(initial);
  const q = action.questionId ? questions.get(action.questionId) : undefined;
  const retard = enRetard(action);

  const enregistrer = async (surcharge?: Partial<typeof v>) => {
    const x = { ...v, ...surcharge };
    setEnCours(true);
    try {
      await api(`/api/dossiers/${dossier.id}/actions/${action.id}`, {
        method: "PATCH",
        body: {
          ...(negociation ? { retenue: x.retenue, reserveClient: x.reserveClient || null } : {}),
          responsable: x.responsable || null,
          dateDebut: x.dateDebut || null,
          dateEcheance: x.dateEcheance || null,
          budget: x.budget ? Number(x.budget) : null,
          ...(suivi ? { avancement: Number(x.avancement), statut: x.statut, commentaireSuivi: x.commentaireSuivi || null } : {}),
        },
      });
      toast(t("commun.enregistre"));
      await onMaj();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    try {
      await api(`/api/dossiers/${dossier.id}/actions/${action.id}`, { method: "DELETE" });
      await onMaj();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    }
  };

  return (
    <li className={cn("px-4 py-3", action.retenue === false && "opacity-60", retard && "bg-destructive-subtle/40")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium leading-relaxed">{action.libelle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Puce ton="neutre">{t(`horizon.${action.horizon}`)}</Puce>
            <Puce ton={action.origine === "eie" || action.origine === "comite" ? "primaire" : "info"}>{t(`origine.${action.origine}`)}</Puce>
            {!action.negociable && <Puce ton="vigilance">{t("plan.nonNegociable")}</Puce>}
            {retard && <Puce ton="alerte">{t("plan.enRetard")}</Puce>}
            {action.dateEcheance && <span className="text-[11.5px] text-muted-foreground">{t("plan.dateEcheance")} : {fmt.date(action.dateEcheance)}</span>}
            {action.budget ? <span className="text-[11.5px] text-muted-foreground">· {fmt.montant(action.budget, action.deviseCode ?? dossier.deviseCode)}</span> : null}
          </div>
          {q && (
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              {t("plan.questionSource")} : {q.code} — {lib(q.libelle)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {negociation ? (
            <ChoixSegmente
              nom={`retenue-${action.id}`}
              taille="petite"
              valeur={v.retenue === null ? null : v.retenue ? "oui" : "non"}
              onChange={(x) => {
                const retenue = x === "oui";
                setV({ ...v, retenue });
                if (retenue) enregistrer({ retenue });
                else setOuvert(true);
              }}
              options={[
                { valeur: "oui", libelle: t("plan.retenue") },
                { valeur: "non", libelle: t("plan.ecartee") },
              ]}
              risque={["non"]}
              desactive={!editable || !action.negociable}
            />
          ) : (
            <div className="w-36">
              <div className="mb-1 flex justify-between text-[11.5px]">
                <span>{t(`statutAction.${action.statut}`)}</span>
                <span className="tabulaire">{action.avancement} %</span>
              </div>
              <Progression valeur={action.avancement} ton={action.statut === "realisee" ? "favorable" : retard ? "alerte" : "primaire"} />
            </div>
          )}
          <Bouton variante="fantome" taille="petite" onClick={() => setOuvert(!ouvert)}>
            {t("commun.details")}
          </Bouton>
          {editable && action.origine !== "systeme" && (
            <Bouton variante="fantome" taille="iconePetite" onClick={supprimer} aria-label={t("commun.supprimer")}>
              <Trash2 className="text-destructive" />
            </Bouton>
          )}
        </div>
      </div>
      {ouvert && (
        <div className="mt-3 grid gap-3 rounded-md border border-border bg-surface p-3 md:grid-cols-4">
          {negociation && v.retenue === false && (
            <ZoneTexte id={`res-${action.id}`} className="md:col-span-4" libelle={t("plan.reserveClient")} valeur={v.reserveClient} onChange={(x) => setV({ ...v, reserveClient: x })} lignes={2} desactive={!editable} />
          )}
          <Champ id={`resp-${action.id}`} suggestions={fonctions} libelle={t("plan.responsable")} valeur={v.responsable} onChange={(x) => setV({ ...v, responsable: x })} desactive={!editable} />
          <Champ id={`deb-${action.id}`} type="date" libelle={t("plan.dateDebut")} valeur={v.dateDebut} onChange={(x) => setV({ ...v, dateDebut: x })} desactive={!editable} />
          <Champ id={`ech-${action.id}`} type="date" libelle={t("plan.dateEcheance")} valeur={v.dateEcheance} onChange={(x) => setV({ ...v, dateEcheance: x })} desactive={!editable} />
          <Champ id={`bud-${action.id}`} type="number" min={0} libelle={t("plan.budget")} valeur={v.budget} onChange={(x) => setV({ ...v, budget: x })} suffixe={action.deviseCode ?? dossier.deviseCode} desactive={!editable} />
          {suivi && (
            <>
              <div>
                <label htmlFor={`av-${action.id}`} className="mb-1 block text-[12.5px] font-medium">
                  {t("plan.avancement")} : {v.avancement} %
                </label>
                <input id={`av-${action.id}`} type="range" min={0} max={100} step={10} value={v.avancement} disabled={!editable} onChange={(e) => setV({ ...v, avancement: Number(e.target.value) })} className="w-full accent-[var(--primary)]" />
              </div>
              <Selecteur id={`st-${action.id}`} libelle={t("commun.statut")} valeur={v.statut} onChange={(x) => setV({ ...v, statut: x })} options={STATUTS_ACTION.map((s) => ({ valeur: s, libelle: t(`statutAction.${s}`) }))} sansVide desactive={!editable} />
              <ZoneTexte id={`cs-${action.id}`} className="md:col-span-2" libelle={t("plan.suivi")} valeur={v.commentaireSuivi} onChange={(x) => setV({ ...v, commentaireSuivi: x })} lignes={1} desactive={!editable} />
            </>
          )}
          {action.suivis.length > 0 && (
            <div className="md:col-span-4">
              <p className="mb-1 text-[12px] font-semibold text-muted-foreground">{t("plan.historiqueSuivi")}</p>
              <ul className="space-y-0.5 text-[12px] text-muted-foreground">
                {action.suivis.map((s) => (
                  <li key={s.id}>
                    {fmt.date(s.date)} — {s.avancement} % — {t(`statutAction.${s.statut}`)}
                    {s.commentaire ? ` — ${s.commentaire}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {editable && (
            <div className="flex justify-end md:col-span-4">
              <Bouton taille="petite" onClick={() => enregistrer()} disabled={!modifie || enCours}>
                {enCours && <Sablier />}
                {t("commun.enregistrer")}
              </Bouton>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function VoletPlan() {
  const { t, fmt } = useApp();
  const fonctions = useLibelles("fonction_client");
  const { dossier, droits, recharger } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVolet } = useDonnees<{ actions: ActionPlan[]; questions: { id: string; code: string; libelle: string }[] }>(`/api/dossiers/${dossier.id}/actions`);
  const [ajout, setAjout] = useState<null | "manuelle" | "eie" | "comite">(null);
  const [nouvelle, setNouvelle] = useState({ libelle: "", horizon: "court", dateEcheance: "", responsable: "" });
  const [enCours, setEnCours] = useState(false);

  const majTout = async () => {
    await Promise.all([rechargerVolet(), recharger()]);
  };
  if (!donnees) return <Chargement lignes={6} />;
  const questions = new Map(donnees.questions.map((q) => [q.id, q]));
  const actions = donnees.actions;
  const retenues = actions.filter((a) => a.retenue);
  const aNegocier = actions.filter((a) => a.negociable && a.retenue === null).length;
  const budget = retenues.reduce((s, a) => s + (a.budget ?? 0), 0);
  const retards = actions.filter(enRetard).length;
  const realisees = retenues.filter((a) => a.statut === "realisee").length;

  const generer = async () => {
    try {
      const r = await api<{ ajoutees: number; retirees: number }>(`/api/dossiers/${dossier.id}/actions/generer`, { method: "POST" });
      toast(t("plan.generees", r));
      await majTout();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    }
  };

  const ajouter = async () => {
    if (!ajout) return;
    setEnCours(true);
    try {
      await api(`/api/dossiers/${dossier.id}/actions`, { body: { ...nouvelle, origine: ajout, dateEcheance: nouvelle.dateEcheance || null, responsable: nouvelle.responsable || null } });
      setAjout(null);
      setNouvelle({ libelle: "", horizon: "court", dateEcheance: "", responsable: "" });
      await majTout();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <Bandeau ton="info">{t("plan.description")}</Bandeau>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicateur libelle={t("plan.retenues")} valeur={`${retenues.length} / ${actions.length}`} precision={aNegocier ? `${aNegocier} ${t("plan.nonNegociee").toLowerCase()}` : undefined} ton={aNegocier ? "vigilance" : "neutre"} />
        <Indicateur libelle={t("plan.budgetTotal")} valeur={fmt.compact(budget, dossier.deviseCode)} />
        <Indicateur libelle={t("plan.realisees")} valeur={`${realisees} / ${retenues.length}`} ton={retenues.length && realisees === retenues.length ? "favorable" : "neutre"} />
        <Indicateur libelle={t("plan.enRetard")} valeur={retards} ton={retards ? "alerte" : "neutre"} />
      </div>
      <Carte
        titre={t("plan.titre")}
        sansMarge
        actions={
          <>
            <Bouton variante="contour" taille="petite" asChild>
              <Link href={`/dossiers/${dossier.id}/impression?doc=plan`} target="_blank">
                <Printer /> {t("plan.imprimer")}
              </Link>
            </Bouton>
            {droits.evaluation && (
              <Bouton variante="contour" taille="petite" onClick={generer}>
                <RefreshCcw /> {t("plan.generer")}
              </Bouton>
            )}
            {droits.plan && (
              <>
                {dossier.categorie === "A" && dossier.statut === "brouillon" && (
                  <Bouton variante="contour" taille="petite" onClick={() => setAjout("eie")}>
                    <Plus /> {t("plan.ajouterEIE")}
                  </Bouton>
                )}
                <Bouton taille="petite" onClick={() => setAjout(dossier.statut === "brouillon" ? "manuelle" : "comite")}>
                  <Plus /> {t("plan.ajouter")}
                </Bouton>
              </>
            )}
          </>
        }
      >
        {actions.length === 0 ? (
          <Vide titre={t("plan.aucuneAction")} />
        ) : (
          <ul className="divide-y divide-border">
            {actions.map((a) => (
              <LigneAction key={a.id} action={a} questions={questions} onMaj={majTout} />
            ))}
          </ul>
        )}
      </Carte>
      <BarreVolet suivante="fiche" />

      <Dialogue
        ouvert={!!ajout}
        onFermer={() => setAjout(null)}
        titre={ajout === "eie" ? t("plan.ajouterEIE") : t("plan.ajouter")}
        pied={
          <>
            <Bouton variante="contour" onClick={() => setAjout(null)}>
              {t("commun.annuler")}
            </Bouton>
            <Bouton onClick={ajouter} disabled={enCours || nouvelle.libelle.trim().length < 3}>
              {t("commun.ajouter")}
            </Bouton>
          </>
        }
      >
        <div className="space-y-3">
          {dossier.statut !== "brouillon" && (
            <Selecteur
              id="origine"
              libelle={t("plan.origine")}
              valeur={ajout ?? ""}
              onChange={(v) => setAjout(v as typeof ajout)}
              options={["comite", "visite", "manuelle"].map((o) => ({ valeur: o, libelle: t(`origine.${o}`) }))}
              sansVide
            />
          )}
          <ZoneTexte id="lib" libelle={t("plan.action")} valeur={nouvelle.libelle} onChange={(v) => setNouvelle({ ...nouvelle, libelle: v })} lignes={3} obligatoire />
          <div className="grid gap-3 md:grid-cols-3">
            <Selecteur id="hz" libelle={t("plan.horizon")} valeur={nouvelle.horizon} onChange={(v) => setNouvelle({ ...nouvelle, horizon: v })} options={HORIZONS.map((h) => ({ valeur: h, libelle: t(`horizon.${h}`) }))} sansVide />
            <Champ id="ech" type="date" libelle={t("plan.dateEcheance")} valeur={nouvelle.dateEcheance} onChange={(v) => setNouvelle({ ...nouvelle, dateEcheance: v })} />
            <Champ id="resp" suggestions={fonctions} libelle={t("plan.responsable")} valeur={nouvelle.responsable} onChange={(v) => setNouvelle({ ...nouvelle, responsable: v })} />
          </div>
        </div>
      </Dialogue>
    </div>
  );
}

