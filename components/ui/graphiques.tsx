"use client";

import { cn } from "@/lib/utils";

/**
 * Graphiques légers en CSS (barres et colonnes) : lisibles à l'impression, dans les deux
 * thèmes et en arabe, sans bibliothèque de graphes. Chaque barre porte sa valeur en clair.
 */
export interface Barre {
  cle: string;
  libelle: React.ReactNode;
  valeur: number;
  /** Texte affiché à droite (sinon la valeur). */
  affichage?: React.ReactNode;
  couleur?: string;
}

export function Barres({ barres, vide = "—" }: { barres: Barre[]; vide?: string }) {
  const max = Math.max(1, ...barres.map((b) => b.valeur));
  if (!barres.length) return <p className="text-[13px] text-muted-foreground">{vide}</p>;
  return (
    <ul className="space-y-2.5">
      {barres.map((b) => (
        <li key={b.cle}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate">{b.libelle}</span>
            <span className="shrink-0 font-semibold tabulaire">{b.affichage ?? b.valeur}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", b.couleur ?? "bg-primary")} style={{ width: `${(100 * b.valeur) / max}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Colonnes({ colonnes, hauteur = 140 }: { colonnes: { cle: string; libelle: string; valeur: number }[]; hauteur?: number }) {
  const max = Math.max(1, ...colonnes.map((c) => c.valeur));
  return (
    <div className="flex items-end gap-1.5" style={{ height: hauteur + 34 }}>
      {colonnes.map((c) => (
        <div key={c.cle} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${c.libelle} : ${c.valeur}`}>
          <span className="text-[10.5px] font-semibold tabulaire text-muted-foreground">{c.valeur || ""}</span>
          <div className="w-full max-w-[28px] rounded-t-sm bg-chart-1" style={{ height: Math.max(2, (hauteur * c.valeur) / max), opacity: c.valeur ? 1 : 0.25 }} />
          <span className="w-full truncate text-center text-[10px] text-muted-foreground">{c.libelle}</span>
        </div>
      ))}
    </div>
  );
}

/** Couleurs fixes par code : catégories et niveaux gardent la même teinte partout. */
export const COULEUR_CATEGORIE: Record<string, string> = { A: "bg-destructive", B: "bg-warning", C: "bg-success", FI: "bg-chart-4", "—": "bg-muted-foreground/40" };
export const COULEUR_NIVEAU: Record<string, string> = { faible: "bg-success", modere: "bg-warning", eleve: "bg-destructive/80", critique: "bg-destructive", tres_eleve: "bg-destructive", "—": "bg-muted-foreground/40" };
