"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { useDossier } from "./contexte";

/** Barre d'actions collante d'un volet : enregistrement et passage à l'étape suivante. */
export function BarreVolet({ children, modifie, suivante }: { children?: React.ReactNode; modifie?: boolean; suivante?: string }) {
  const { t, rtl } = useApp();
  const { dossier } = useDossier();
  const router = useRouter();
  const Fleche = rtl ? ArrowLeft : ArrowRight;
  return (
    <div className="no-print sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur">
      {modifie && <span className="me-auto text-[12.5px] text-warning">{t("commun.modificationsNonEnregistrees")}</span>}
      {children}
      {suivante && (
        <Bouton variante="contour" onClick={() => router.replace(`/dossiers/${dossier.id}?etape=${suivante}`, { scroll: false })} disabled={modifie}>
          {t("commun.suivant")} : {t(`etape.${suivante}`)}
          <Fleche />
        </Bouton>
      )}
    </div>
  );
}
