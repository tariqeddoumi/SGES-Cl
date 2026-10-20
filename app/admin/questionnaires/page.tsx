"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { api, ErreurApi, useDonnees } from "@/lib/client/api";
import { CATEGORIES, HORIZONS, TYPES_QUESTION } from "@/lib/domaine/constantes";
import { lireLibelle } from "@/lib/i18n/libelle";
import { cn, lireJson } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampMultilingue, ChoixSegmente, Interrupteur, Selecteur } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";

interface ModeleAction { id: string; horizon: string; libelle: string; delaiMois: number | null; actif: boolean }
interface Question {
  id: string; code: string; libelle: string; aide: string | null; blocId: string; categories: string; type: string; options: string | null; reponseRisque: string | null;
  gravite: number; references: string | null; secteurs: string | null; obligatoire: boolean; ordre: number; actif: boolean; actions: ModeleAction[]; _count: { reponses: number };
}
interface Bloc { id: string; code: string; libelle: string; ordre: number; actif: boolean; questions: Question[] }
interface Thematique { id: string; code: string; libelle: string; actif: boolean; blocs: Bloc[] }

interface Formulaire {
  id: string | null; code: string; blocId: string; libelle: Record<string, string>; aide: Record<string, string>; categories: string[]; type: string;
  options: { code: string; libelle: Record<string, string> }[]; reponseRisque: string; gravite: number; references: string; secteurs: string; obligatoire: boolean; ordre: string; actif: boolean;
  actions: { id?: string; horizon: string; libelle: Record<string, string>; delaiMois: string; actif: boolean }[];
}

function versFormulaire(q: Question): Formulaire {
  return {
    id: q.id, code: q.code, blocId: q.blocId, libelle: lireLibelle(q.libelle), aide: lireLibelle(q.aide), categories: q.categories.split(",").filter(Boolean), type: q.type,
    options: lireJson<{ code: string; libelle: Record<string, string> }[]>(q.options, []), reponseRisque: q.reponseRisque ?? "", gravite: q.gravite, references: q.references ?? "",
    secteurs: q.secteurs ?? "", obligatoire: q.obligatoire, ordre: String(q.ordre), actif: q.actif,
    actions: q.actions.map((a) => ({ id: a.id, horizon: a.horizon, libelle: lireLibelle(a.libelle), delaiMois: a.delaiMois?.toString() ?? "", actif: a.actif })),
  };
}

export default function PageQuestionnaires() {
  const { t, lib } = useApp();
  const toast = useToast();
  const { donnees, recharger } = useDonnees<Thematique[]>("/api/admin/questionnaires");
  const [f, setF] = useState<Formulaire | null>(null);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [categorie, setCategorie] = useState("");
  const [bloc, setBloc] = useState<{ thematiqueId: string; code: string; libelle: Record<string, string> } | null>(null);
  const [erreur, setErreur] = useState("");

  const blocs = useMemo(() => (donnees ?? []).flatMap((th) => th.blocs.map((b) => ({ ...b, thematique: th }))), [donnees]);
  if (!donnees) return <Chargement lignes={10} />;

  const nouvelle = (blocId: string) =>
    setF({ id: null, code: "", blocId, libelle: {}, aide: {}, categories: ["A", "B"], type: "oui_non", options: [], reponseRisque: "non", gravite: 2, references: "", secteurs: "", obligatoire: true, ordre: "", actif: true, actions: [] });

  const enregistrer = async () => {
    if (!f) return;
    setErreur("");
    const corps = {
      code: f.code, blocId: f.blocId, libelle: f.libelle, aide: Object.values(f.aide).some((x) => x?.trim()) ? f.aide : null, categories: f.categories, type: f.type,
      options: f.type === "choix" ? f.options : null, reponseRisque: f.reponseRisque || null, gravite: f.gravite, references: f.references || null, secteurs: f.secteurs || null,
      obligatoire: f.obligatoire, actif: f.actif, ...(f.ordre ? { ordre: Number(f.ordre) } : {}),
      actions: f.actions.map((a) => ({ id: a.id, horizon: a.horizon, libelle: a.libelle, delaiMois: a.delaiMois ? Number(a.delaiMois) : null, actif: a.actif })),
    };
    try {
      if (f.id) await api(`/api/admin/questionnaires/questions/${f.id}`, { method: "PATCH", body: corps });
      else await api("/api/admin/questionnaires/questions", { body: corps });
      toast(t("commun.enregistre"));
      setF(null);
      await recharger();
    } catch (e) {
      setErreur(e instanceof ErreurApi && Array.isArray(e.details) ? (e.details as { champ: string }[]).map((d) => d.champ).join(", ") : (e as Error).message);
    }
  };
  const supprimer = async () => {
    if (!f?.id || !confirm(t("commun.confirmerSuppression"))) return;
    try { await api(`/api/admin/questionnaires/questions/${f.id}`, { method: "DELETE" }); setF(null); await recharger(); } catch (e) { toast((e as Error).message, "erreur"); }
  };
  const creerBloc = async () => {
    if (!bloc) return;
    try { await api("/api/admin/questionnaires/blocs", { body: bloc }); setBloc(null); await recharger(); } catch (e) { toast((e as Error).message, "erreur"); }
  };
  const basculer = (id: string) => setOuverts((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const filtre = (q: Question) => !categorie || q.categories.split(",").includes(categorie);

  return (
    <div className="space-y-4">
      <EnTete
        titre={t("admin.questionnaires")}
        description={t("admin.questionnairesDesc")}
        retour={{ href: "/admin", libelle: t("admin.titre") }}
        actions={<Bouton variante="contour" asChild><Link href="/admin/referentiels/thematiques">{t("admin.thematique")}</Link></Bouton>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted-foreground">{t("dossier.categorie")} :</span>
        <ChoixSegmente nom="cat" taille="petite" valeur={categorie} onChange={setCategorie} options={[{ valeur: "", libelle: t("commun.toutes") }, ...CATEGORIES.map((c) => ({ valeur: c, libelle: c }))]} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Carte sansMarge>
          <ul className="divide-y divide-border">
            {donnees.map((th) => (
              <li key={th.id}>
                <div className={cn("flex items-center gap-2 bg-surface px-4 py-2 text-[13px] font-semibold", !th.actif && "opacity-50")}>
                  {lib(th.libelle)}
                  <Bouton variante="fantome" taille="iconePetite" className="ms-auto" aria-label={t("admin.bloc")} title={t("admin.bloc")} onClick={() => setBloc({ thematiqueId: th.id, code: "", libelle: {} })}><Plus /></Bouton>
                </div>
                {th.blocs.map((b) => {
                  const qs = b.questions.filter(filtre);
                  const ouvert = ouverts.has(b.id);
                  return (
                    <div key={b.id}>
                      <button onClick={() => basculer(b.id)} className={cn("flex w-full items-center gap-2 px-4 py-2 text-start text-[13px] hover:bg-accent/50", !b.actif && "opacity-50")}>
                        {ouvert ? <ChevronDown size={14} /> : <ChevronRight size={14} className="rtl:rotate-180" />}
                        <span className="flex-1">{lib(b.libelle)}</span>
                        <Puce>{qs.length}</Puce>
                      </button>
                      {ouvert && (
                        <ul className="pb-2">
                          {qs.map((q) => (
                            <li key={q.id}>
                              <button onClick={() => setF(versFormulaire(q))} className={cn("flex w-full gap-2 px-10 py-1.5 text-start text-[12.5px] hover:bg-accent/50", f?.id === q.id && "bg-accent", !q.actif && "opacity-50")}>
                                <span className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground" dir="ltr">{q.code}</span>
                                <span className="line-clamp-2 flex-1">{lib(q.libelle)}</span>
                                <span className="shrink-0 text-[10.5px] text-muted-foreground">{q.categories}</span>
                              </button>
                            </li>
                          ))}
                          <li className="px-10 pt-1">
                            <Bouton variante="lien" taille="petite" onClick={() => nouvelle(b.id)}><Plus /> {t("admin.question")}</Bouton>
                          </li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
        </Carte>

        <div className="xl:sticky xl:top-20 xl:self-start">
          {!f ? (
            <Carte><Vide titre={t("admin.question")} description={t("admin.questionnairesDesc")} /></Carte>
          ) : (
            <Carte titre={f.id ? `${t("admin.edition")} — ${f.code}` : t("admin.nouvelle")}>
              <div className="space-y-3">
                {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
                {f.id && donnees && (blocs.find((b) => b.id === f.blocId)?.questions.find((q) => q.id === f.id)?._count.reponses ?? 0) > 0 && (
                  <Bandeau ton="info">{t("erreurs.utilise")}</Bandeau>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <Champ id="code" libelle={t("commun.code")} valeur={f.code} onChange={(v) => setF({ ...f, code: v.toUpperCase() })} desactive={!!f.id} obligatoire dir="ltr" />
                  <Selecteur id="bloc" libelle={t("admin.bloc")} valeur={f.blocId} onChange={(v) => setF({ ...f, blocId: v })} options={blocs.map((b) => ({ valeur: b.id, libelle: `${lib(b.thematique.libelle)} › ${lib(b.libelle)}` }))} sansVide />
                </div>
                <ChampMultilingue id="libelle" libelle={t("admin.question")} valeur={f.libelle} onChange={(v) => setF({ ...f, libelle: v })} multiligne obligatoire />
                <ChampMultilingue id="aide" libelle={t("commun.description")} valeur={f.aide} onChange={(v) => setF({ ...f, aide: v })} multiligne />
                <div>
                  <p className="mb-1 text-[12.5px] font-medium">{t("admin.categoriesConcernees")}</p>
                  <div className="flex gap-3">
                    {CATEGORIES.map((c) => (
                      <label key={c} className="flex items-center gap-1.5 text-[13px]">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={f.categories.includes(c)} onChange={(e) => setF({ ...f, categories: e.target.checked ? [...f.categories, c] : f.categories.filter((x) => x !== c) })} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Selecteur id="type" libelle={t("admin.typeReponse")} valeur={f.type} onChange={(v) => setF({ ...f, type: v })} options={TYPES_QUESTION.map((x) => ({ valeur: x, libelle: t(`admin.${x}`) }))} sansVide />
                  <Champ id="risque" libelle={t("admin.reponseRisque")} valeur={f.reponseRisque} onChange={(v) => setF({ ...f, reponseRisque: v })} aide={t("admin.reponseRisqueAide")} dir="ltr" />
                  <Selecteur id="gravite" libelle={t("evaluation.gravite")} valeur={String(f.gravite)} onChange={(v) => setF({ ...f, gravite: Number(v) })} options={[1, 2, 3, 4].map((g) => ({ valeur: String(g), libelle: `${g} — ${t(`evaluation.gravite${g}`)}` }))} sansVide />
                </div>
                {f.type === "choix" && (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    {f.options.map((o, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Champ id={`opt-${i}`} className="w-28" libelle={t("commun.code")} valeur={o.code} onChange={(v) => setF({ ...f, options: f.options.map((x, k) => (k === i ? { ...x, code: v } : x)) })} dir="ltr" />
                        <div className="flex-1"><ChampMultilingue id={`optl-${i}`} libelle={t("commun.libelle")} valeur={o.libelle} onChange={(v) => setF({ ...f, options: f.options.map((x, k) => (k === i ? { ...x, libelle: v } : x)) })} /></div>
                      </div>
                    ))}
                    <Bouton variante="lien" taille="petite" onClick={() => setF({ ...f, options: [...f.options, { code: "", libelle: {} }] })}><Plus /> {t("commun.ajouter")}</Bouton>
                  </div>
                )}
                <Champ id="refs" libelle={t("evaluation.references")} valeur={f.references} onChange={(v) => setF({ ...f, references: v })} />
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <Champ id="secteurs" libelle={t("admin.secteursCibles")} valeur={f.secteurs} onChange={(v) => setF({ ...f, secteurs: v })} dir="ltr" />
                  <Champ id="ordre" type="number" libelle={t("commun.ordre")} valeur={f.ordre} onChange={(v) => setF({ ...f, ordre: v })} />
                </div>
                <div className="flex flex-wrap gap-6">
                  <Interrupteur id="obl" libelle={t("commun.obligatoire")} valeur={f.obligatoire} onChange={(v) => setF({ ...f, obligatoire: v })} />
                  <Interrupteur id="actif" libelle={t("commun.actif")} valeur={f.actif} onChange={(v) => setF({ ...f, actif: v })} />
                </div>

                <div className="rounded-md border border-border">
                  <p className="border-b border-border bg-surface px-3 py-2 text-[12.5px] font-semibold">{t("admin.actionsModeles")}</p>
                  <div className="space-y-3 p-3">
                    {f.actions.map((a, i) => (
                      <div key={a.id ?? i} className="space-y-2 rounded-md border border-border p-2">
                        <div className="flex flex-wrap items-end gap-2">
                          <Selecteur id={`hz-${i}`} libelle={t("plan.horizon")} valeur={a.horizon} onChange={(v) => setF({ ...f, actions: f.actions.map((x, k) => (k === i ? { ...x, horizon: v } : x)) })} options={HORIZONS.map((h) => ({ valeur: h, libelle: t(`horizon.${h}`) }))} sansVide />
                          <Champ id={`dl-${i}`} className="w-28" type="number" libelle={t("admin.delai")} valeur={a.delaiMois} onChange={(v) => setF({ ...f, actions: f.actions.map((x, k) => (k === i ? { ...x, delaiMois: v } : x)) })} />
                          <Bouton variante="fantome" taille="icone" className="ms-auto" aria-label={t("commun.supprimer")} onClick={() => setF({ ...f, actions: f.actions.filter((_, k) => k !== i) })}><Trash2 className="text-destructive" /></Bouton>
                        </div>
                        <ChampMultilingue id={`al-${i}`} libelle={t("plan.action")} valeur={a.libelle} onChange={(v) => setF({ ...f, actions: f.actions.map((x, k) => (k === i ? { ...x, libelle: v } : x)) })} multiligne />
                      </div>
                    ))}
                    <Bouton variante="contour" taille="petite" onClick={() => setF({ ...f, actions: [...f.actions, { horizon: "court", libelle: {}, delaiMois: "6", actif: true }] })}><Plus /> {t("plan.ajouter")}</Bouton>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {f.id && <Bouton variante="fantome" onClick={supprimer}><Trash2 className="text-destructive" /> {t("commun.supprimer")}</Bouton>}
                  <Bouton variante="contour" onClick={() => setF(null)}>{t("commun.annuler")}</Bouton>
                  <Bouton onClick={enregistrer} disabled={!f.code || !Object.values(f.libelle).some((x) => x?.trim()) || !f.categories.length}>{t("commun.enregistrer")}</Bouton>
                </div>
              </div>
            </Carte>
          )}
        </div>
      </div>
      <Dialogue ouvert={!!bloc} onFermer={() => setBloc(null)} titre={t("admin.bloc")} pied={<><Bouton variante="contour" onClick={() => setBloc(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={creerBloc}>{t("commun.creer")}</Bouton></>}>
        {bloc && (
          <div className="space-y-3">
            <Champ id="bcode" libelle={t("commun.code")} valeur={bloc.code} onChange={(v) => setBloc({ ...bloc, code: v.toUpperCase() })} obligatoire dir="ltr" />
            <ChampMultilingue id="blib" libelle={t("commun.libelle")} valeur={bloc.libelle} onChange={(v) => setBloc({ ...bloc, libelle: v })} obligatoire />
          </div>
        )}
      </Dialogue>
    </div>
  );
}
