"use client";

import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";

export type Ton = "neutre" | "favorable" | "vigilance" | "alerte" | "primaire" | "info";

const TONS: Record<Ton, string> = {
  neutre: "bg-muted text-muted-foreground",
  favorable: "bg-success-subtle text-success",
  vigilance: "bg-warning-subtle text-warning",
  alerte: "bg-destructive-subtle text-destructive",
  primaire: "bg-accent text-accent-foreground",
  info: "bg-secondary text-foreground",
};

export function Puce({ children, ton = "neutre", className, title }: { children: React.ReactNode; ton?: Ton; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", TONS[ton], className)}
    >
      {children}
    </span>
  );
}

const TON_STATUT: Record<string, Ton> = {
  brouillon: "neutre",
  soumis: "vigilance",
  valide: "primaire",
  decide: "info",
  en_suivi: "primaire",
  cloture: "favorable",
  annule: "neutre",
};

export function PuceStatut({ statut }: { statut: string | null | undefined }) {
  const { t } = useApp();
  if (!statut) return null;
  return <Puce ton={TON_STATUT[statut] ?? "neutre"}>{t(`statut.${statut}`)}</Puce>;
}

/** Catégorie E&S : A en rouge (impacts significatifs), B en ambre, C en vert, FI neutre. */
const CLASSE_CATEGORIE: Record<string, string> = {
  A: "border-destructive/40 bg-destructive-subtle text-destructive",
  B: "border-warning/40 bg-warning-subtle text-warning",
  C: "border-success/40 bg-success-subtle text-success",
  FI: "border-border bg-secondary text-foreground",
};

export function PuceCategorie({ categorie, sous, grande }: { categorie: string | null | undefined; sous?: string | null; grande?: boolean }) {
  const { t } = useApp();
  if (!categorie) return <span className="text-[12px] text-muted-foreground">{t("categorie.nonCategorise")}</span>;
  return (
    <span
      title={t(`categorie.desc${categorie}`)}
      dir="ltr"
      className={cn(
        "inline-flex items-center rounded-md border font-bold tabulaire",
        CLASSE_CATEGORIE[categorie] ?? CLASSE_CATEGORIE.FI,
        grande ? "px-3 py-1 text-base" : "px-2 py-0.5 text-[12px]"
      )}
    >
      {categorie}
      {sous ? <span className="ms-1 font-semibold opacity-80">{sous.replace("FI", "")}</span> : null}
    </span>
  );
}

const TON_NIVEAU: Record<string, Ton> = { faible: "favorable", modere: "vigilance", eleve: "alerte", critique: "alerte", tres_eleve: "alerte" };

export function PuceNiveau({ niveau, score }: { niveau: string | null | undefined; score?: number | null }) {
  const { t, fmt } = useApp();
  if (!niveau) return <span className="text-[12px] text-muted-foreground">—</span>;
  return (
    <Puce ton={TON_NIVEAU[niveau] ?? "neutre"} className={niveau === "critique" || niveau === "tres_eleve" ? "ring-1 ring-destructive/50" : undefined}>
      {t(`niveau.${niveau}`)}
      {score !== null && score !== undefined && <span className="font-normal opacity-80 tabulaire">· {fmt.nombre(score, 0)}</span>}
    </Puce>
  );
}

const TON_DECISION: Record<string, Ton> = { accorde: "favorable", rejete: "alerte", ajourne: "vigilance" };

export function PuceDecision({ decision }: { decision: string | null | undefined }) {
  const { t } = useApp();
  if (!decision) return null;
  return <Puce ton={TON_DECISION[decision] ?? "neutre"}>{t(`decision.${decision}`)}</Puce>;
}

export function tonNiveau(niveau: string | null | undefined): Ton {
  return TON_NIVEAU[niveau ?? ""] ?? "neutre";
}
