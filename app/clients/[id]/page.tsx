"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte, Chargement, EnTete, Sablier, Vide } from "@/components/ui/mise-en-page";
import { PuceCategorie, PuceDecision, PuceNiveau, PuceStatut } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";
import { FormulaireClient, clientDepuis, clientVersApi, type ValeursClient } from "@/components/client/formulaire-client";

interface Donnees {
  client: Record<string, unknown> & { id: string; raisonSociale: string; entite: { nom: string } };
  dossiers: { id: string; reference: string; statut: string; categorie: string | null; niveauRisque: string | null; scoreRisque: number | null; montantDemande: number; deviseCode: string; dateDossier: string; decision: string | null; objet: string | null }[];
  ecriture: boolean;
}

export default function PageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, fmt, peut } = useApp();
  const ref = useReferentiels();
  const toast = useToast();
  const { donnees, erreur, recharger } = useDonnees<Donnees>(`/api/clients/${id}`);
  const [v, setV] = useState<ValeursClient | null>(null);
  const [enCours, setEnCours] = useState(false);
  useEffect(() => {
    if (donnees) setV(clientDepuis(donnees.client));
  }, [donnees]);
  if (erreur) return <Bandeau ton="alerte">{erreur.message}</Bandeau>;
  if (!donnees || !v || !ref) return <Chargement lignes={8} />;
  const modifie = JSON.stringify(v) !== JSON.stringify(clientDepuis(donnees.client));
  const enregistrer = async () => {
    setEnCours(true);
    try {
      await api(`/api/clients/${id}`, { method: "PATCH", body: clientVersApi(v) });
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setEnCours(false);
    }
  };
  return (
    <div className="space-y-4">
      <EnTete
        retour={{ href: "/clients", libelle: t("client.titreListe") }}
        titre={donnees.client.raisonSociale}
        description={donnees.client.entite.nom}
        actions={
          peut("dossier:creer") && (
            <Bouton asChild>
              <Link href={`/dossiers/nouveau?client=${id}`}>
                <Plus /> {t("dossier.nouveau")}
              </Link>
            </Bouton>
          )
        }
      />
      <Carte titre={t("client.dossiers")} sansMarge>
        {donnees.dossiers.length === 0 ? (
          <Vide titre={t("dossier.aucunDossier")} />
        ) : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("dossier.reference")}</Th>
                <Th>{t("dossier.objet")}</Th>
                <Th>{t("dossier.categorie")}</Th>
                <Th>{t("dossier.niveauRisque")}</Th>
                <Th alignFin>{t("dossier.montantDemande")}</Th>
                <Th>{t("commun.statut")}</Th>
                <Th>{t("commun.date")}</Th>
              </tr>
            </thead>
            <tbody>
              {donnees.dossiers.map((d) => (
                <Tr key={d.id}>
                  <Td className="font-medium"><Link href={`/dossiers/${d.id}`} className="hover:underline" dir="ltr">{d.reference}</Link></Td>
                  <Td className="max-w-[280px] truncate">{d.objet}</Td>
                  <Td><PuceCategorie categorie={d.categorie} /></Td>
                  <Td><PuceNiveau niveau={d.niveauRisque} score={d.scoreRisque} /></Td>
                  <Td alignFin>{fmt.compact(d.montantDemande, d.deviseCode)}</Td>
                  <Td><span className="flex gap-1"><PuceStatut statut={d.statut} /><PuceDecision decision={d.decision} /></span></Td>
                  <Td>{fmt.date(d.dateDossier)}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Carte titre={t("commun.details")}>
        <FormulaireClient valeurs={v} onChange={setV} referentiels={ref} desactive={!donnees.ecriture} />
        {donnees.ecriture && (
          <div className="mt-4 flex justify-end">
            <Bouton onClick={enregistrer} disabled={!modifie || enCours}>
              {enCours && <Sablier />}
              {t("commun.enregistrer")}
            </Bouton>
          </div>
        )}
      </Carte>
    </div>
  );
}
