"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";

/**
 * Champs de formulaire. Chaque libellé est associé à son champ (clic = focus,
 * annonce par les lecteurs d'écran) ; les propriétés logiques (start/end) gardent la
 * mise en page correcte en arabe.
 */
export const CLASSE_CHAMP =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Etiquette({ id, libelle, obligatoire, provenance }: { id: string; libelle: React.ReactNode; obligatoire?: boolean; provenance?: string }) {
  return (
    <label htmlFor={id} className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
      <span>
        {libelle}
        {obligatoire && <span className="ms-0.5 text-destructive">*</span>}
      </span>
      {provenance && <span className="rounded bg-accent px-1.5 py-px text-[10.5px] font-semibold text-accent-foreground">{provenance}</span>}
    </label>
  );
}

export function Aide({ texte, erreur }: { texte?: React.ReactNode; erreur?: string }) {
  if (erreur) return <p className="mt-1 text-[12px] text-destructive">{erreur}</p>;
  if (texte) return <p className="mt-1 text-[12px] text-muted-foreground">{texte}</p>;
  return null;
}

export function Champ({
  id,
  libelle,
  valeur,
  onChange,
  type = "text",
  placeholder,
  aide,
  erreur,
  obligatoire,
  desactive,
  suffixe,
  provenance,
  min,
  max,
  step,
  className,
  dir,
  suggestions,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: string | number | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  aide?: React.ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  desactive?: boolean;
  suffixe?: string;
  provenance?: string;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
  dir?: "ltr" | "rtl" | "auto";
  /** Valeurs proposées à la saisie (liste paramétrable) ; la saisie libre reste possible. */
  suggestions?: string[];
}) {
  return (
    <div className={className}>
      <Etiquette id={id} libelle={libelle} obligatoire={obligatoire} provenance={provenance} />
      <div className="relative">
        <input
          id={id}
          type={type}
          value={valeur ?? ""}
          min={min}
          max={max}
          step={step}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={desactive}
          list={suggestions?.length ? `${id}-suggestions` : undefined}
          autoComplete={suggestions?.length ? "off" : undefined}
          aria-invalid={erreur ? true : undefined}
          className={cn(CLASSE_CHAMP, suffixe && "pe-14", type === "number" && "tabulaire", erreur && "border-destructive")}
        />
        {suffixe && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">{suffixe}</span>}
        {!!suggestions?.length && (
          <datalist id={`${id}-suggestions`}>
            {suggestions.map((x) => <option key={x} value={x} />)}
          </datalist>
        )}
      </div>
      <Aide texte={aide} erreur={erreur} />
    </div>
  );
}

export function ZoneTexte({
  id,
  libelle,
  valeur,
  onChange,
  lignes = 3,
  placeholder,
  aide,
  erreur,
  obligatoire,
  desactive,
  className,
  modeles,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: string | null | undefined;
  onChange: (v: string) => void;
  lignes?: number;
  placeholder?: string;
  aide?: React.ReactNode;
  erreur?: string;
  obligatoire?: boolean;
  desactive?: boolean;
  className?: string;
  /** Éléments types (liste paramétrable) ajoutés au texte en une sélection. */
  modeles?: string[];
}) {
  const { t } = useApp();
  const ajouter = (x: string) => {
    if (!x) return;
    const v = (valeur ?? "").trimEnd();
    if (v.split("\n").some((l) => l.replace(/^[-•]\s*/, "") === x)) return;
    onChange(v ? `${v}\n- ${x}` : `- ${x}`);
  };
  return (
    <div className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-3">
        <Etiquette id={id} libelle={libelle} obligatoire={obligatoire} />
        {!!modeles?.length && !desactive && (
          <select
            aria-label={t("commun.ajouterElementType")}
            value=""
            onChange={(e) => ajouter(e.target.value)}
            className="mb-1 max-w-full rounded-md border border-border bg-background px-2 py-1 text-[12px] text-muted-foreground sm:max-w-[60%]"
          >
            <option value="">+ {t("commun.ajouterElementType")}</option>
            {modeles.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
      </div>
      <textarea
        id={id}
        value={valeur ?? ""}
        rows={lignes}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={desactive}
        dir="auto"
        className={cn(CLASSE_CHAMP, "leading-relaxed", erreur && "border-destructive")}
      />
      <Aide texte={aide} erreur={erreur} />
    </div>
  );
}

export interface OptionChoix {
  valeur: string;
  libelle: string;
  aide?: string;
}

export function Selecteur({
  id,
  libelle,
  valeur,
  onChange,
  options,
  aide,
  obligatoire,
  erreur,
  sansVide,
  desactive,
  provenance,
  className,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: string | null | undefined;
  onChange: (v: string) => void;
  options: OptionChoix[];
  aide?: React.ReactNode;
  obligatoire?: boolean;
  erreur?: string;
  sansVide?: boolean;
  desactive?: boolean;
  provenance?: string;
  className?: string;
}) {
  const { t } = useApp();
  const v = valeur ?? "";
  // Une valeur absente du référentiel (élément désactivé depuis) reste visible.
  const inconnue = v && !options.some((o) => o.valeur === v);
  const aideOption = options.find((o) => o.valeur === v)?.aide;
  return (
    <div className={className}>
      <Etiquette id={id} libelle={libelle} obligatoire={obligatoire} provenance={provenance} />
      <select
        id={id}
        value={v}
        disabled={desactive}
        onChange={(e) => onChange(e.target.value)}
        className={cn(CLASSE_CHAMP, erreur && "border-destructive")}
      >
        {!sansVide && <option value="">{t("commun.nonRenseigne")}</option>}
        {inconnue && <option value={v}>{v}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      <Aide texte={aideOption ?? aide} erreur={erreur} />
    </div>
  );
}

/** Choix multiple (valeur : codes séparés par des virgules), avec recherche au-delà de 12 options. */
export function ChoixMultiple({
  id,
  libelle,
  valeur,
  onChange,
  options,
  aide,
  desactive,
  className,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: string | null | undefined;
  onChange: (v: string) => void;
  options: OptionChoix[];
  aide?: React.ReactNode;
  desactive?: boolean;
  className?: string;
}) {
  const { t } = useApp();
  const [q, setQ] = useState("");
  const choisis = (valeur ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const basculer = (v: string) => onChange((choisis.includes(v) ? choisis.filter((x) => x !== v) : [...choisis, v]).join(","));
  const filtre = q.trim().toLowerCase();
  const visibles = options.filter((o) => !filtre || choisis.includes(o.valeur) || `${o.valeur} ${o.libelle}`.toLowerCase().includes(filtre));
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-2">
        <span id={id} className="mb-1 text-[12.5px] font-medium text-foreground">{libelle}</span>
        <span className="mb-1 text-[11.5px] text-muted-foreground">{choisis.length ? t("commun.nbSelectionnes", { n: choisis.length }) : t("commun.aucun")}</span>
      </div>
      {options.length > 12 && (
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commun.rechercher")} aria-label={t("commun.rechercher")} className={cn(CLASSE_CHAMP, "mb-2 py-1.5 text-[12.5px]")} />
      )}
      <div role="group" aria-labelledby={id} className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
        {visibles.map((o) => {
          const actif = choisis.includes(o.valeur);
          return (
            <button
              key={o.valeur}
              type="button"
              aria-pressed={actif}
              disabled={desactive}
              title={o.aide ?? o.valeur}
              onClick={() => basculer(o.valeur)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors disabled:cursor-not-allowed",
                actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
      <Aide texte={aide} />
    </div>
  );
}

export function Interrupteur({
  id,
  libelle,
  valeur,
  onChange,
  aide,
  desactive,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: boolean;
  onChange: (v: boolean) => void;
  aide?: React.ReactNode;
  desactive?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={valeur}
        disabled={desactive}
        onClick={() => onChange(!valeur)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
          valeur ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", valeur ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0.5 rtl:-translate-x-0.5")} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-[13px]">
        <span className="font-medium text-foreground">{libelle}</span>
        {aide && <span className="mt-0.5 block text-[12px] text-muted-foreground">{aide}</span>}
      </label>
    </div>
  );
}

/**
 * Choix segmenté (Oui / Non / Sans objet…). La couleur ne marque que la réponse qui
 * signale un risque, pour que l'œil trouve les problèmes d'un coup.
 */
export function ChoixSegmente({
  nom,
  valeur,
  onChange,
  options,
  desactive,
  risque,
  taille = "normale",
}: {
  nom: string;
  valeur: string | null | undefined;
  onChange: (v: string) => void;
  options: { valeur: string; libelle: string }[];
  desactive?: boolean;
  /** Valeurs qui signalent un risque : affichées en rouge une fois choisies. */
  risque?: string[];
  taille?: "normale" | "petite";
}) {
  return (
    <div role="radiogroup" aria-label={nom} className="inline-flex shrink-0 overflow-hidden rounded-md border border-border bg-background">
      {options.map((o) => {
        const actif = valeur === o.valeur;
        const enRisque = actif && risque?.includes(o.valeur);
        return (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            disabled={desactive}
            onClick={() => onChange(o.valeur)}
            className={cn(
              "border-e border-border font-medium transition-colors last:border-e-0 disabled:cursor-not-allowed",
              taille === "petite" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]",
              actif
                ? enRisque
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}

/** Échelle 0 à 4 (aléas, facteurs de transition, sensibilité). */
export function Echelle({
  id,
  libelle,
  valeur,
  onChange,
  desactive,
  aide,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: number;
  onChange: (v: number) => void;
  desactive?: boolean;
  aide?: React.ReactNode;
}) {
  const couleurs = ["bg-success", "bg-success/70", "bg-warning", "bg-destructive/80", "bg-destructive"];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <span id={id} className="text-[13px] text-foreground">
          {libelle}
        </span>
        {aide && <span className="block text-[11.5px] text-muted-foreground">{aide}</span>}
      </div>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1">
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valeur === n}
            disabled={desactive}
            onClick={() => onChange(n)}
            className={cn(
              "h-7 w-7 rounded-md border text-[12px] font-semibold tabulaire transition-colors disabled:cursor-not-allowed",
              valeur === n ? cn(couleurs[n], "border-transparent text-white") : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Échelle 0 à 4 avec « inconnu » (?) et « non applicable » (NA) : une donnée non renseignée ne doit
 * jamais être confondue avec une absence de risque (0).
 */
export function EchelleEtendue({
  id,
  libelle,
  valeur,
  onChange,
  desactive,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: number | null | "na";
  onChange: (v: number | null | "na") => void;
  desactive?: boolean;
}) {
  const { t } = useApp();
  const couleurs = ["bg-success", "bg-success/70", "bg-warning", "bg-destructive/80", "bg-destructive"];
  const options: { v: number | null | "na"; l: string; titre: string }[] = [
    { v: null, l: "?", titre: t("climat.inconnu") },
    { v: "na", l: "NA", titre: t("climat.nonApplicable") },
    ...[0, 1, 2, 3, 4].map((n) => ({ v: n, l: String(n), titre: String(n) })),
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
      <span id={id} className={cn("min-w-0 text-[13px]", valeur === null ? "text-warning" : "text-foreground")}>
        {libelle}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1">
        {options.map((o) => {
          const actif = valeur === o.v;
          return (
            <button
              key={o.l}
              type="button"
              role="radio"
              aria-checked={actif}
              title={o.titre}
              disabled={desactive}
              onClick={() => onChange(o.v)}
              className={cn(
                "h-7 min-w-7 rounded-md border px-1 text-[12px] font-semibold tabulaire transition-colors disabled:cursor-not-allowed",
                actif ? cn(typeof o.v === "number" ? couleurs[o.v] : o.v === "na" ? "bg-muted-foreground" : "bg-warning", "border-transparent text-white") : "border-border bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Saisie d'un libellé dans chaque langue active (référentiels). */
export function ChampMultilingue({
  id,
  libelle,
  valeur,
  onChange,
  multiligne,
  obligatoire,
}: {
  id: string;
  libelle: React.ReactNode;
  valeur: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  multiligne?: boolean;
  obligatoire?: boolean;
}) {
  const { langues } = useApp();
  return (
    <fieldset className="rounded-md border border-border p-3">
      <legend className="px-1 text-[12.5px] font-medium text-foreground">
        {libelle}
        {obligatoire && <span className="ms-0.5 text-destructive">*</span>}
      </legend>
      <div className="space-y-2">
        {langues.map((l) => (
          <div key={l.code} className="flex items-start gap-2">
            <span className="mt-2 w-7 shrink-0 text-[11px] font-bold uppercase text-muted-foreground">{l.code}</span>
            {multiligne ? (
              <textarea
                id={`${id}-${l.code}`}
                dir={l.rtl ? "rtl" : "ltr"}
                rows={2}
                value={valeur[l.code] ?? ""}
                onChange={(e) => onChange({ ...valeur, [l.code]: e.target.value })}
                className={CLASSE_CHAMP}
                aria-label={`${typeof libelle === "string" ? libelle : ""} (${l.nomNatif})`}
              />
            ) : (
              <input
                id={`${id}-${l.code}`}
                dir={l.rtl ? "rtl" : "ltr"}
                value={valeur[l.code] ?? ""}
                onChange={(e) => onChange({ ...valeur, [l.code]: e.target.value })}
                className={CLASSE_CHAMP}
                aria-label={`${typeof libelle === "string" ? libelle : ""} (${l.nomNatif})`}
              />
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
