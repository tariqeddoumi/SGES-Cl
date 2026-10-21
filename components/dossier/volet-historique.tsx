"use client";

import { useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Carte, Chargement, Vide } from "@/components/ui/mise-en-page";
import { PuceStatut } from "@/components/ui/puces";
import { useDossier } from "./contexte";

interface Evenement {
  id: string;
  date: string;
  auteurNom: string | null;
  evenement: string;
  deStatut: string | null;
  versStatut: string | null;
  commentaire: string | null;
}

export function VoletHistorique() {
  const { t, fmt } = useApp();
  const { dossier } = useDossier();
  const { donnees } = useDonnees<Evenement[]>(`/api/dossiers/${dossier.id}/historique`);
  const libelle = (e: string) => {
    const cle = `historique.${e}`;
    const v = t(cle);
    return v === cle ? e : v;
  };
  return (
    <Carte titre={t("historique.titre")}>
      {!donnees ? (
        <Chargement />
      ) : donnees.length === 0 ? (
        <Vide titre={t("commun.aucuneDonnee")} />
      ) : (
        <ol className="relative space-y-4 border-s border-border ps-5">
          {donnees.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-[12px] text-muted-foreground">
                {fmt.dateHeure(e.date)} — {e.auteurNom}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                {libelle(e.evenement)}
                {e.deStatut && <PuceStatut statut={e.deStatut} />}
                {e.versStatut && (
                  <>
                    → <PuceStatut statut={e.versStatut} />
                  </>
                )}
              </p>
              {e.commentaire && <p className="mt-0.5 whitespace-pre-line text-[13px] text-muted-foreground">{e.commentaire}</p>}
            </li>
          ))}
        </ol>
      )}
    </Carte>
  );
}
