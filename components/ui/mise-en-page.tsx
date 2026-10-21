"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";

/** En-tête d'écran : titre, contexte, actions. */
export function EnTete({
  titre,
  description,
  retour,
  actions,
  meta,
}: {
  titre: React.ReactNode;
  description?: React.ReactNode;
  retour?: { href: string; libelle: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const { rtl } = useApp();
  const Fleche = rtl ? ArrowRight : ArrowLeft;
  return (
    <div className="mb-5">
      {retour && (
        <Link href={retour.href} className="no-print mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Fleche size={15} />
          {retour.libelle}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">{titre}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="no-print flex min-w-0 max-w-full flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Bloc de contenu avec en-tête. */
export function Carte({
  titre,
  description,
  actions,
  children,
  className,
  sansMarge,
  id,
}: {
  titre?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sansMarge?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("carte rounded-lg border border-border bg-card", className)}>
      {(titre || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {titre && <h2 className="text-[14.5px] font-semibold text-foreground">{titre}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="no-print flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className={sansMarge ? "defilement-x overflow-x-auto" : "p-4"}>{children}</div>
    </section>
  );
}

/** Indicateur chiffré : la couleur est réservée à la valeur quand elle porte un sens. */
export function Indicateur({
  libelle,
  valeur,
  unite,
  precision,
  ton = "neutre",
  href,
  className,
}: {
  libelle: string;
  valeur: React.ReactNode;
  unite?: string;
  precision?: string;
  ton?: "neutre" | "favorable" | "vigilance" | "alerte";
  href?: string;
  className?: string;
}) {
  const tons = { neutre: "text-foreground", favorable: "text-success", vigilance: "text-warning", alerte: "text-destructive" } as const;
  const contenu = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{libelle}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn("text-[26px] font-semibold leading-none tracking-tight tabulaire", tons[ton])}>{valeur}</span>
        {unite && <span className="text-[13px] font-normal text-muted-foreground">{unite}</span>}
      </p>
      {precision && <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{precision}</p>}
    </>
  );
  const classe = cn("block rounded-lg border border-border bg-card p-4", href && "transition-colors hover:border-ring/60", className);
  return href ? (
    <Link href={href} className={classe}>
      {contenu}
    </Link>
  ) : (
    <div className={classe}>{contenu}</div>
  );
}

export function Vide({ titre, description, action, icone }: { titre: string; description?: string; action?: React.ReactNode; icone?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icone && <div className="mb-3 text-muted-foreground">{icone}</div>}
      <p className="text-sm font-medium text-foreground">{titre}</p>
      {description && <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Bandeau({
  ton = "info",
  titre,
  children,
  className,
  actions,
}: {
  ton?: "info" | "succes" | "vigilance" | "alerte";
  titre?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const styles = {
    info: "border-border bg-secondary text-foreground",
    succes: "border-success/30 bg-success-subtle text-foreground",
    vigilance: "border-warning/40 bg-warning-subtle text-foreground",
    alerte: "border-destructive/40 bg-destructive-subtle text-foreground",
  } as const;
  const Icone = { info: Info, succes: CheckCircle2, vigilance: AlertTriangle, alerte: XCircle }[ton];
  const couleurIcone = { info: "text-muted-foreground", succes: "text-success", vigilance: "text-warning", alerte: "text-destructive" }[ton];
  return (
    <div role={ton === "alerte" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-[13px]", styles[ton], className)}>
      <Icone size={17} className={cn("mt-0.5 shrink-0", couleurIcone)} />
      <div className="min-w-0 flex-1">
        {titre && <p className="font-semibold">{titre}</p>}
        {children && <div className={cn(titre && "mt-0.5", "text-[13px] leading-relaxed")}>{children}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function Chargement({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: lignes }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

export function Sablier({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} size={16} />;
}

/** Barre d'avancement (0 à 100). */
export function Progression({ valeur, ton, className, libelle }: { valeur: number; ton?: "primaire" | "favorable" | "vigilance" | "alerte"; className?: string; libelle?: string }) {
  const v = Math.max(0, Math.min(100, valeur));
  const couleur =
    ton === "alerte" ? "bg-destructive" : ton === "vigilance" ? "bg-warning" : ton === "favorable" ? "bg-success" : "bg-primary";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={libelle}>
      <div className={cn("h-full rounded-full transition-all", couleur)} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Ligne libellé / valeur pour les fiches de synthèse. */
export function Ligne({ libelle, children, className }: { libelle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-border/70 py-2 text-[13px] last:border-0", className)}>
      <dt className="text-muted-foreground">{libelle}</dt>
      <dd className="min-w-0 break-words font-medium text-foreground">{children ?? "—"}</dd>
    </div>
  );
}
