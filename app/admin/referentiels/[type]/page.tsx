"use client";

import { use } from "react";
import { definition } from "@/lib/referentiels-admin";
import { useApp } from "@/components/providers/application";
import { Bandeau, EnTete } from "@/components/ui/mise-en-page";
import { EditeurReferentiel } from "@/components/admin/editeur-referentiel";

export default function PageReferentielAdmin({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const { t } = useApp();
  const def = definition(type);
  if (!def) return <Bandeau ton="alerte">{t("erreurs.introuvable")}</Bandeau>;
  return (
    <div className="space-y-4">
      <EnTete titre={t(def.cleTitre)} description={t(def.cleDescription)} retour={{ href: "/admin", libelle: t("admin.titre") }} />
      <EditeurReferentiel def={def} />
    </div>
  );
}
