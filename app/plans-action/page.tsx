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
interface Reponse { lignes: Ligne[]; total: number; page: number; taille: number; indicateurs: { retenues: number; realisees: number; enRetard: number } }

function Contenu() {
  const { t, fmt } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const url = `/api/plans-action?${sp.toString()}`;
  const { donnees } = useDonnees<Reponse>(url);
  const filtre = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    if (k !== "page") p.delete("page");
    router.replace(`/plans-action?${p}`);
  };
  const actions = donnees?.lignes ?? [];
  const ind = donnees?.indicateurs;
  const page = donnees?.page ?? 1;
  const pages = donnees ? Math.max(1, Math.ceil(donnees.total / donnees.taille)) : 1;
  return (
    <div className="space-y-4">
      <EnTete titre={t("plan.titrePortefeuille")} description={t("plan.descriptionPortefeuille")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicateur libelle={t("plan.retenues")} valeur={ind?.retenues ?? "—"} />
        <Indicateur libelle={t("plan.realisees")} valeur={ind?.retenues ? `${fmt.nombre((100 * ind.realisees) / ind.retenues, 0)} %` : "—"} ton="favorable" />
        <Indicateur libelle={t("plan.enRetard")} valeur={ind?.enRetard ?? "—"} ton={ind?.enRetard ? "alerte" : "neutre"} />
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
      {donnees && donnees.total > donnees.taille && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>{t("commun.elements", { n: donnees.total })}</span>
          <div className="flex items-center gap-2">
            <Bouton variante="contour" taille="petite" disabled={page <= 1} onClick={() => filtre("page", String(page - 1))}>
              {t("commun.precedent")}
            </Bouton>
            <span>{t("commun.page", { n: page, total: pages })}</span>
            <Bouton variante="contour" taille="petite" disabled={page >= pages} onClick={() => filtre("page", String(page + 1))}>
              {t("commun.suivant")}
            </Bouton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagePlans() {
  return <Suspense><Contenu /></Suspense>;
}
