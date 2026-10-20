"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ListChecks } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { STATUTS_ACTION } from "@/lib/domaine/constantes";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Carte, Chargement, EnTete, Indicateur, Progression, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";
import { enRetard, type ActionPlan } from "@/components/dossier/volet-plan";

type Ligne = ActionPlan & { dossier: { id: string; reference: string; deviseCode: string; client: { raisonSociale: string }; entite: { nom: string } } };

function Contenu() {
  const { t, fmt } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const url = `/api/plans-action?${sp.toString()}`;
  const { donnees } = useDonnees<Ligne[]>(url);
  const filtre = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.replace(`/plans-action?${p}`);
  };
  const actions = donnees ?? [];
  const retards = actions.filter(enRetard).length;
  const realisees = actions.filter((a) => a.statut === "realisee").length;
  return (
    <div className="space-y-4">
      <EnTete titre={t("plan.titrePortefeuille")} description={t("plan.descriptionPortefeuille")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicateur libelle={t("plan.retenues")} valeur={actions.length} />
        <Indicateur libelle={t("plan.realisees")} valeur={actions.length ? `${fmt.nombre((100 * realisees) / actions.length, 0)} %` : "—"} ton="favorable" />
        <Indicateur libelle={t("plan.enRetard")} valeur={retards} ton={retards ? "alerte" : "neutre"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Bouton variante={sp.get("retard") === "1" ? "secondaire" : "contour"} taille="petite" onClick={() => filtre("retard", sp.get("retard") === "1" ? "" : "1")}>
          {t("plan.enRetard")}
        </Bouton>
        <select aria-label={t("commun.statut")} value={sp.get("statut") ?? ""} onChange={(e) => filtre("statut", e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-[13px]">
          <option value="">{t("commun.statut")} : {t("commun.tous")}</option>
          {STATUTS_ACTION.map((s) => <option key={s} value={s}>{t(`statutAction.${s}`)}</option>)}
        </select>
      </div>
      <Carte sansMarge>
        {!donnees ? (
          <div className="p-4"><Chargement /></div>
        ) : actions.length === 0 ? (
          <Vide icone={<ListChecks size={26} />} titre={t("commun.aucunResultat")} />
        ) : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("plan.action")}</Th>
                <Th>{t("dossier.client")}</Th>
                <Th>{t("plan.responsable")}</Th>
                <Th>{t("plan.dateEcheance")}</Th>
                <Th>{t("plan.avancement")}</Th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <Tr key={a.id} onClick={() => router.push(`/dossiers/${a.dossier.id}?etape=suivi`)}>
                  <Td className="max-w-[420px]">
                    <span className="block">{a.libelle}</span>
                    <span className="text-[11.5px] text-muted-foreground">{t(`origine.${a.origine}`)} · {t(`horizon.${a.horizon}`)}</span>
                  </Td>
                  <Td>
                    <Link href={`/dossiers/${a.dossier.id}?etape=suivi`} className="block font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{a.dossier.client.raisonSociale}</Link>
                    <span className="text-[11.5px] text-muted-foreground" dir="ltr">{a.dossier.reference}</span>
                  </Td>
                  <Td>{a.responsable ?? "—"}</Td>
                  <Td className="whitespace-nowrap">
                    {fmt.date(a.dateEcheance) || "—"} {enRetard(a) && <Puce ton="alerte">{t("plan.enRetard")}</Puce>}
                  </Td>
                  <Td className="w-40">
                    <div className="mb-1 flex justify-between text-[11.5px]"><span>{t(`statutAction.${a.statut}`)}</span><span className="tabulaire">{a.avancement} %</span></div>
                    <Progression valeur={a.avancement} ton={a.statut === "realisee" ? "favorable" : enRetard(a) ? "alerte" : "primaire"} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
    </div>
  );
}

export default function PagePlans() {
  return <Suspense><Contenu /></Suspense>;
}
