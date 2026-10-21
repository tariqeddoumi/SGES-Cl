"use client";

import { useEffect, useMemo, useState } from "react";
import { api, useDonnees } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { ChoixSegmente, ZoneTexte } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Sablier } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";

interface Donnees {
  criteres: { id: string; code: string; libelle: string; source: string; bloquant: boolean; actif: boolean }[];
  reponses: { critereId: string; reponse: boolean; commentaire: string | null }[];
  motifExclusion: string | null;
  exclu: boolean;
  exclusionVerifiee: boolean;
}

export function VoletExclusion() {
  const { t, lib } = useApp();
  const { dossier, droits, recharger } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVolet } = useDonnees<Donnees>(`/api/dossiers/${dossier.id}/exclusion`);
  const [reponses, setReponses] = useState<Record<string, boolean | undefined>>({});
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const initiales = useMemo(() => Object.fromEntries((donnees?.reponses ?? []).map((r) => [r.critereId, r.reponse])), [donnees]);
  useEffect(() => {
    setReponses(initiales);
    setMotif(donnees?.motifExclusion ?? "");
  }, [initiales, donnees]);

  if (!donnees) return <Chargement lignes={6} />;
  const criteres = donnees.criteres;
  const sansReponse = criteres.filter((c) => c.actif && reponses[c.id] === undefined).length;
  const exclu = criteres.some((c) => reponses[c.id]);
  const bloquant = criteres.some((c) => c.bloquant && reponses[c.id]);
  const modifie = JSON.stringify(reponses) !== JSON.stringify(initiales) || motif !== (donnees.motifExclusion ?? "");

  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      await api(`/api/dossiers/${dossier.id}/exclusion`, {
        method: "PUT",
        body: {
          reponses: Object.entries(reponses)
            .filter(([, v]) => v !== undefined)
            .map(([critereId, reponse]) => ({ critereId, reponse })),
          motifExclusion: motif || null,
        },
      });
      toast(t("commun.enregistre"));
      await Promise.all([rechargerVolet(), recharger()]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <Carte
        titre={t("exclusion.titre")}
        description={t("exclusion.description")}
        actions={
          droits.evaluation && (
            <Bouton variante="contour" taille="petite" onClick={() => setReponses(Object.fromEntries(criteres.filter((c) => c.actif).map((c) => [c.id, false])))}>
              {t("exclusion.toutNon")}
            </Bouton>
          )
        }
        sansMarge
      >
        <ol className="divide-y divide-border">
          {criteres.map((c, i) => (
            <li key={c.id} className={cn("flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center", reponses[c.id] && "bg-destructive-subtle/60")}>
              <span className="w-6 shrink-0 text-[12px] font-semibold text-muted-foreground tabulaire">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] leading-relaxed">{lib(c.libelle)}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Puce ton="neutre">
                    {t("exclusion.source")} : {c.source}
                  </Puce>
                  {c.bloquant && <Puce ton="alerte">{t("exclusion.bloquant")}</Puce>}
                </div>
              </div>
              <ChoixSegmente
                nom={c.code}
                valeur={reponses[c.id] === undefined ? null : reponses[c.id] ? "oui" : "non"}
                onChange={(v) => setReponses({ ...reponses, [c.id]: v === "oui" })}
                options={[
                  { valeur: "oui", libelle: t("commun.oui") },
                  { valeur: "non", libelle: t("commun.non") },
                ]}
                risque={["oui"]}
                desactive={!droits.evaluation}
              />
            </li>
          ))}
        </ol>
      </Carte>

      {sansReponse > 0 ? (
        <Bandeau ton="vigilance">{t("exclusion.resultatIncomplet", { n: sansReponse })}</Bandeau>
      ) : exclu ? (
        <Bandeau ton="alerte" titre={t("dossier.exclusionOui")}>
          {bloquant ? t("dossier.blocage_exclusion_bloquante") : t("exclusion.resultatOui")}
        </Bandeau>
      ) : (
        <Bandeau ton="succes">{t("exclusion.resultatNon")}</Bandeau>
      )}

      {(exclu || donnees.motifExclusion) && (
        <Carte>
          <ZoneTexte id="motif" libelle={t("exclusion.motif")} aide={t("exclusion.motifAide")} valeur={motif} onChange={setMotif} lignes={3} obligatoire={exclu} desactive={!droits.evaluation} />
        </Carte>
      )}
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      <BarreVolet modifie={droits.evaluation && modifie} suivante="categorisation">
        {droits.evaluation && (
          <Bouton onClick={enregistrer} disabled={!modifie || enCours || (exclu && !motif.trim())}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        )}
      </BarreVolet>
    </div>
  );
}
