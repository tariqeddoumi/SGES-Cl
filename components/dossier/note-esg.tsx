"use client";

import type { ResultatESG } from "@/lib/domaine/esg";
import { PILIERS } from "@/lib/domaine/esg";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";

export type NoteESGFiche = ResultatESG & { octroi?: { score: number | null; note: string | null } };

const COULEUR_NOTE: Record<string, string> = {
  A: "bg-success text-white",
  B: "bg-success/75 text-white",
  C: "bg-secondary text-foreground",
  D: "bg-warning text-white",
  E: "bg-destructive text-white",
};
const COULEUR_BARRE = (s: number) => (s >= 65 ? "bg-success" : s >= 50 ? "bg-chart-1" : s >= 35 ? "bg-warning" : "bg-destructive");

/** Note ESG : lettre, score, piliers E, S, G et leurs composantes, plafond et couverture. */
export function NoteESG({ esg, compacte }: { esg: NoteESGFiche; compacte?: boolean }) {
  const { t, fmt } = useApp();
  if (esg.exclu) return <p className="text-[13px] text-muted-foreground">{t("esg.exclu")}</p>;
  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-4">
        <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[26px] font-bold", esg.note ? COULEUR_NOTE[esg.note] : "bg-muted text-muted-foreground")} dir="ltr">
          {esg.note ?? "—"}
        </span>
        <div className="min-w-0">
          <p className="text-[20px] font-semibold tabulaire">
            {esg.score === null ? "—" : fmt.nombre(esg.score, 0)}
            <span className="ms-1 text-[12px] font-normal text-muted-foreground">{t("commun.sur100")}</span>
          </p>
          <p className="text-muted-foreground">{esg.note ? t(`esg.note_${esg.note}`) : t("esg.indisponible")}</p>
        </div>
        {esg.octroi?.note && (esg.octroi.note !== esg.note || esg.octroi.score !== esg.score) && (
          <p className="ms-auto rounded-md bg-surface px-3 py-1.5 text-[12px]">
            {t("esg.aLOctroi")} : <strong dir="ltr">{esg.octroi.note}{esg.octroi.score !== null ? ` · ${fmt.nombre(esg.octroi.score, 0)}` : ""}</strong>
          </p>
        )}
      </div>
      {esg.plafond && <p className="rounded-md bg-warning-subtle px-3 py-2 text-warning">{t(`esg.plafond_${esg.plafond}`)}</p>}
      {esg.provisoire && <p className="rounded-md bg-surface px-3 py-2 text-muted-foreground">{t("esg.provisoireDetail", { couverture: fmt.nombre(esg.couverture * 100, 0) })}</p>}
      <div className={cn("grid gap-3", !compacte && "sm:grid-cols-3")}>
        {PILIERS.map((k) => {
          const p = esg.piliers[k];
          return (
            <div key={k} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-semibold">{t(`esg.pilier_${k}`)}</span>
                <span className="tabulaire font-semibold">{p.score === null ? "—" : fmt.nombre(p.score, 0)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                {p.score !== null && <div className={cn("h-full rounded-full", COULEUR_BARRE(p.score))} style={{ width: `${p.score}%` }} />}
              </div>
              <ul className="mt-2 space-y-0.5 text-[12px] text-muted-foreground">
                {p.composantes.map((c) => (
                  <li key={c.code} className="flex justify-between gap-2">
                    <span>{t(`esg.composante_${c.code}`)}</span>
                    <span className="tabulaire">{fmt.nombre(c.score, 0)}</span>
                  </li>
                ))}
                {p.risques > 0 && <li className="text-destructive">{t("esg.risquesNonMaitrises", { n: p.risques })}</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t("esg.couverture")} : {fmt.nombre(esg.couverture * 100, 0)} % · {t("esg.methode", { version: esg.version })}
      </p>
    </div>
  );
}
