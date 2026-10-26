"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, ErreurApi, useDonnees } from "@/lib/client/api";
import { oublierReferentiels } from "@/lib/client/referentiels";
import { lireLibelle } from "@/lib/i18n/libelle";
import type { ChampRef, DefReferentiel } from "@/lib/referentiels-admin";
import { dateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { ChoixMultiple, Champ, ChampMultilingue, Echelle, Interrupteur, Selecteur } from "@/components/ui/champs";
import { useReferentiels } from "@/lib/client/referentiels";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

type Element = Record<string, unknown>;

function valeurAffichee(c: ChampRef, v: unknown, lib: (x: string) => string, t: (x: string) => string, fmt: { date: (d: string) => string; nombre: (n: number, d?: number) => string }) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (c.type === "libelle" || c.type === "libelleLong") return <span className={c.type === "libelleLong" ? "line-clamp-2" : ""}>{lib(String(v))}</span>;
  if (c.type === "booleen") return v ? <Puce ton="favorable">{t("commun.oui")}</Puce> : <Puce>{t("commun.non")}</Puce>;
  if (c.type === "date") return fmt.date(String(v));
  if (c.type === "nombre") return <span className="tabulaire">{fmt.nombre(Number(v), 6)}</span>;
  if (c.type === "multi") return <span className="line-clamp-2">{String(v).split(",").join(", ")}</span>;
  if (c.nom === "liste") return t(`listes.${String(v)}`);
  return String(v);
}

/** Écran générique d'un référentiel paramétrable (liste, ajout, modification, désactivation). */
export function EditeurReferentiel({ def, filtreFixe }: { def: DefReferentiel; filtreFixe?: Record<string, string> }) {
  const { t, lib, fmt } = useApp();
  const ref = useReferentiels();
  const toast = useToast();
  const optionsSource = (source: string) =>
    source === "secteurs"
      ? (ref?.secteurs ?? []).map((x) => ({ valeur: x.code, libelle: `${x.code} — ${lib(x.libelle)}` }))
      : (ref?.listes[source.replace(/^liste:/, "")] ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle) }));
  const { donnees, erreur, recharger } = useDonnees<Element[]>(`/api/admin/referentiels/${def.type}`);
  const [edition, setEdition] = useState<{ id: string | null; valeurs: Element } | null>(null);
  const [inactifs, setInactifs] = useState(false);
  const [q, setQ] = useState("");
  const [filtreListe, setFiltreListe] = useState(filtreFixe?.liste ?? "");
  const [erreurForm, setErreurForm] = useState("");
  const idChamp = def.id ?? "id";
  const colonnes = def.champs.filter((c) => c.colonne);

  const lignes = useMemo(() => {
    let l = donnees ?? [];
    if (def.actif && !inactifs) l = l.filter((x) => x[def.actif!] !== false);
    if (filtreListe) l = l.filter((x) => x.liste === filtreListe);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((x) => JSON.stringify(x).toLowerCase().includes(s));
    }
    return l;
  }, [donnees, inactifs, q, filtreListe, def.actif]);

  const ouvrir = (x?: Element) => {
    setErreurForm("");
    if (x) {
      const v: Element = {};
      for (const c of def.champs) v[c.nom] = c.type === "libelle" || c.type === "libelleLong" ? lireLibelle(String(x[c.nom] ?? "")) : c.type === "date" ? dateInput(String(x[c.nom])) : x[c.nom];
      setEdition({ id: String(x[idChamp]), valeurs: v });
    } else {
      const v: Element = {};
      for (const c of def.champs) v[c.nom] = c.type === "booleen" ? c.nom === "actif" || c.nom === "active" : c.type === "libelle" || c.type === "libelleLong" ? {} : c.type === "echelle" ? 0 : c.nom === "liste" && filtreListe ? filtreListe : c.type === "date" ? dateInput(new Date()) : "";
      setEdition({ id: null, valeurs: v });
    }
  };

  const enregistrer = async () => {
    if (!edition) return;
    setErreurForm("");
    try {
      if (edition.id) await api(`/api/admin/referentiels/${def.type}/${encodeURIComponent(edition.id)}`, { method: "PATCH", body: edition.valeurs });
      else await api(`/api/admin/referentiels/${def.type}`, { body: edition.valeurs });
      oublierReferentiels();
      setEdition(null);
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      if (e instanceof ErreurApi && Array.isArray(e.details)) {
        setErreurForm((e.details as { champ: string; message: string }[]).map((d) => `${t(def.champs.find((c) => c.nom === d.champ)?.cle ?? d.champ)} : ${d.message}`).join(" · "));
      } else setErreurForm(e instanceof Error ? e.message : String(e));
    }
  };

  const supprimer = async (x: Element) => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    try {
      await api(`/api/admin/referentiels/${def.type}/${encodeURIComponent(String(x[idChamp]))}`, { method: "DELETE" });
      oublierReferentiels();
      await recharger();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    }
  };

  const champ = (c: ChampRef) => {
    if (!edition) return null;
    const v = edition.valeurs[c.nom];
    const maj = (x: unknown) => setEdition({ ...edition, valeurs: { ...edition.valeurs, [c.nom]: x } });
    const desactive = !!edition.id && c.fige;
    const libelleChamp = t(c.cle);
    switch (c.type) {
      case "libelle":
      case "libelleLong":
        return <ChampMultilingue key={c.nom} id={c.nom} libelle={libelleChamp} valeur={(v as Record<string, string>) ?? {}} onChange={maj} multiligne={c.type === "libelleLong"} obligatoire={c.requis} />;
      case "booleen":
        return <Interrupteur key={c.nom} id={c.nom} libelle={libelleChamp} valeur={!!v} onChange={maj} />;
      case "choix":
        return <Selecteur key={c.nom} id={c.nom} libelle={libelleChamp} valeur={String(v ?? "")} onChange={maj} options={(c.choix ?? []).map((x) => ({ valeur: x, libelle: c.nom === "liste" ? t(`listes.${x}`) : x }))} obligatoire={c.requis} desactive={desactive} />;
      case "multi":
        return <ChoixMultiple key={c.nom} id={c.nom} libelle={libelleChamp} valeur={String(v ?? "")} onChange={maj} options={optionsSource(c.source ?? "")} desactive={desactive} />;
      case "echelle":
        return <Echelle key={c.nom} id={c.nom} libelle={libelleChamp} valeur={Number(v ?? 0)} onChange={maj} />;
      default:
        return (
          <Champ
            key={c.nom}
            id={c.nom}
            type={c.type === "nombre" || c.type === "entier" ? "number" : c.type === "date" ? "date" : "text"}
            step={c.type === "nombre" ? "any" : undefined}
            libelle={libelleChamp}
            valeur={v === null || v === undefined ? "" : String(v)}
            onChange={maj}
            obligatoire={c.requis}
            desactive={desactive}
          />
        );
    }
  };

  const listes = def.modele === "listeValeur" ? def.champs.find((c) => c.nom === "liste")?.choix ?? [] : [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search size={15} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commun.rechercher")} className="w-full bg-transparent text-sm outline-none" aria-label={t("commun.rechercher")} />
        </label>
        {listes.length > 0 && (
          <select aria-label={t("admin.liste")} value={filtreListe} onChange={(e) => setFiltreListe(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-[13px]">
            <option value="">{t("admin.liste")} : {t("commun.toutes")}</option>
            {listes.map((l) => <option key={l} value={l}>{t(`listes.${l}`)}</option>)}
          </select>
        )}
        {def.actif && (
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <input type="checkbox" checked={inactifs} onChange={(e) => setInactifs(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            {t("commun.afficherInactifs")}
          </label>
        )}
        <Bouton onClick={() => ouvrir()}><Plus /> {t("commun.ajouter")}</Bouton>
      </div>
      {erreur && <Bandeau ton="alerte">{erreur.message}</Bandeau>}
      <Carte sansMarge>
        {!donnees ? <div className="p-4"><Chargement /></div> : lignes.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead>
              <tr>
                {colonnes.map((c) => <Th key={c.nom} className={c.type === "echelle" ? "whitespace-normal text-center" : undefined}>{t(c.cle)}</Th>)}
                <Th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((x) => (
                <Tr key={String(x[idChamp])} className={def.actif && x[def.actif] === false ? "opacity-50" : undefined}>
                  {colonnes.map((c) => <Td key={c.nom} className={c.type === "libelleLong" ? "max-w-[520px]" : c.type === "echelle" ? "text-center" : undefined}>{valeurAffichee(c, x[c.nom], lib, t, fmt)}</Td>)}
                  <Td alignFin>
                    <span className="inline-flex gap-1">
                      <Bouton variante="fantome" taille="iconePetite" onClick={() => ouvrir(x)} aria-label={t("commun.modifier")}><Pencil /></Bouton>
                      <Bouton variante="fantome" taille="iconePetite" onClick={() => supprimer(x)} aria-label={t("commun.supprimer")}><Trash2 className="text-destructive" /></Bouton>
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Dialogue
        ouvert={!!edition}
        onFermer={() => setEdition(null)}
        titre={edition?.id ? t("admin.edition") : t("admin.nouvelle")}
        large
        pied={<><Bouton variante="contour" onClick={() => setEdition(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={enregistrer}>{t("commun.enregistrer")}</Bouton></>}
      >
        {erreurForm && <Bandeau ton="alerte" className="mb-3">{erreurForm}</Bandeau>}
        <div className="grid gap-3 md:grid-cols-2">
          {def.champs.map((c) => (
            <div key={c.nom} className={c.type === "libelle" || c.type === "libelleLong" || c.type === "echelle" || c.type === "multi" ? "md:col-span-2" : undefined}>{champ(c)}</div>
          ))}
        </div>
      </Dialogue>
    </div>
  );
}
