"use client";

import { BookOpen, Scale } from "lucide-react";
import { libelle } from "@/lib/i18n/libelle";
import { REGLES, TEXTES } from "@/lib/referentiel-reglementaire";
import { useApp } from "@/components/providers/application";
import { Carte, EnTete } from "@/components/ui/mise-en-page";

export default function PageReferentiel() {
  const { t, langue, fmt, parametres, deviseReference } = useApp();
  const l = (x: Record<string, string>) => libelle(x, langue);
  return (
    <div className="space-y-4">
      <EnTete titre={t("referentiel.titre")} description={t("referentiel.description")} />
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {TEXTES.map((g) => (
            <Carte key={g.groupe.fr} titre={l(g.groupe)}>
              <ul className="space-y-4">
                {g.elements.map((e) => (
                  <li key={e.titre.fr} className="flex gap-3">
                    <BookOpen size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-[13.5px] font-semibold">{l(e.titre)}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{l(e.description)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Carte>
          ))}
        </div>
        <div className="space-y-4">
          <Carte titre={t("admin.groupe_regles")}>
            <p className="mb-3 text-[12.5px] text-muted-foreground">
              {t("dossier.motifSeuil", { seuil: fmt.compact(Number(parametres.SEUIL_DECLENCHEMENT) || 10_000_000, deviseReference) })}
            </p>
            <ul className="space-y-4">
              {REGLES.map((r) => (
                <li key={r.titre.fr} className="flex gap-3">
                  <Scale size={16} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[13.5px] font-semibold">{l(r.titre)}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{l(r.texte)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Carte>
        </div>
      </div>
    </div>
  );
}
