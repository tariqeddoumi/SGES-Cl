"use client";

import Link from "next/link";
import { useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Donnees {
  realisees: { id: string; date: string; type: string; conformite: string | null; constats: string | null; visiteur: { prenom: string; nom: string } | null; dossier: { id: string; reference: string; client: { raisonSociale: string } } }[];
  aPlanifier: { id: string; reference: string; client: string; derniere: string | null; echeance: string; enRetard: boolean }[];
}

export default function PageVisites() {
  const { t, fmt } = useApp();
  const { donnees } = useDonnees<Donnees>("/api/visites");
  if (!donnees) return <Chargement lignes={6} />;
  const ton = (c: string | null) => (c === "conforme" ? "favorable" : c === "partielle" ? "vigilance" : c === "non_conforme" ? "alerte" : "neutre");
  return (
    <div className="space-y-4">
      <EnTete titre={t("suivi.titrePortefeuille")} description={t("suivi.descriptionPortefeuille")} />
      <Carte titre={t("suivi.aPlanifier")} sansMarge>
        {donnees.aPlanifier.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead><tr><Th>{t("dossier.client")}</Th><Th>{t("dossier.reference")}</Th><Th>{t("suivi.derniereVisite")}</Th><Th>{t("suivi.prochaineVisite")}</Th></tr></thead>
            <tbody>
              {donnees.aPlanifier.map((d) => {
                return (
                  <Tr key={d.id}>
                    <Td className="font-medium"><Link href={`/dossiers/${d.id}?etape=suivi`} className="hover:underline">{d.client}</Link></Td>
                    <Td dir="ltr" className="whitespace-nowrap text-muted-foreground">{d.reference}</Td>
                    <Td>{d.derniere ? fmt.date(d.derniere) : "—"}</Td>
                    <Td>{fmt.date(d.echeance)} {d.enRetard && <Puce ton="alerte">{t("suivi.enRetard")}</Puce>}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Carte titre={t("suivi.realisees")} sansMarge>
        {donnees.realisees.length === 0 ? <Vide titre={t("suivi.aucuneVisite")} /> : (
          <Tableau>
            <thead><tr><Th>{t("suivi.dateVisite")}</Th><Th>{t("dossier.client")}</Th><Th>{t("suivi.typeVisite")}</Th><Th>{t("suivi.conformite")}</Th><Th>{t("suivi.visiteur")}</Th><Th>{t("suivi.constats")}</Th></tr></thead>
            <tbody>
              {donnees.realisees.map((v) => (
                <Tr key={v.id}>
                  <Td className="whitespace-nowrap">{fmt.date(v.date)}</Td>
                  <Td className="font-medium"><Link href={`/dossiers/${v.dossier.id}?etape=suivi`} className="hover:underline">{v.dossier.client.raisonSociale}</Link></Td>
                  <Td>{t(`suivi.${v.type}`)}</Td>
                  <Td>{v.conformite ? <Puce ton={ton(v.conformite)}>{t(`suivi.${v.conformite}`)}</Puce> : "—"}</Td>
                  <Td>{v.visiteur ? `${v.visiteur.prenom} ${v.visiteur.nom}` : "—"}</Td>
                  <Td className="max-w-[360px] truncate text-muted-foreground">{v.constats}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
    </div>
  );
}
