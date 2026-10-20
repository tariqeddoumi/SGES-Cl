"use client";

import { cn } from "@/lib/utils";

export interface Onglet {
  id: string;
  libelle: React.ReactNode;
  pastille?: React.ReactNode;
  desactive?: boolean;
}

/** Onglets horizontaux défilables (navigation clavier : flèches gauche/droite). */
export function Onglets({ onglets, actif, onChange, className }: { onglets: Onglet[]; actif: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("no-print flex gap-1 overflow-x-auto border-b border-border", className)}>
      {onglets.map((o, i) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={actif === o.id}
          disabled={o.desactive}
          onClick={() => onChange(o.id)}
          onKeyDown={(e) => {
            const dir = document.documentElement.dir === "rtl" ? -1 : 1;
            const pas = e.key === "ArrowRight" ? dir : e.key === "ArrowLeft" ? -dir : 0;
            if (!pas) return;
            const suivant = onglets[(i + pas + onglets.length) % onglets.length];
            if (suivant && !suivant.desactive) onChange(suivant.id);
          }}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-40",
            actif === o.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {o.libelle}
          {o.pastille}
        </button>
      ))}
    </div>
  );
}
