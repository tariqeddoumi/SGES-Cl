"use client";

import { useEffect, useMemo, useState } from "react";
import { api, useDonnees } from "@/lib/client/api";
import { calculerCategorie, lirePreseance } from "@/lib/domaine/categorisation";
import { CATEGORIES, SOUS_CATEGORIES_FI } from "@/lib/domaine/constantes";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { ChoixSegmente, Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Sablier } from "@/components/ui/mise-en-page";
import { PuceCategorie } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";

interface Donnees {
  questions: { id: string; numero: number; code: string; libelle: string; categorie: string; actif: boolean }[];
  reponses: { questionId: string; reponse: boolean }[];
  categorie: string | null;
  categorieCalculee: string | null;
  sousCategorieFI: string | null;
  justificationCategorie: string | null;
  eieRequise: boolean;
  secteur: { categorieIndicative: string | null } | null;
}

export function VoletCategorisation() {
  const { t, lib, parametres } = useApp();
  const { dossier, droits, recharger, prefill, consommer } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVolet } = useDonnees<Donnees>(`/api/dossiers/${dossier.id}/categorisation`);
  const [reponses, setReponses] = useState<Record<string, boolean | undefined>>({});
  const [sousFI, setSousFI] = useState("");
  const [reclasser, setReclasser] = useState(false);
  const [categorieRetenue, setCategorieRetenue] = useState("");
  const [justification, setJustification] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const initiales = useMemo(() => Object.fromEntries((donnees?.reponses ?? []).map((r) => [r.questionId, r.reponse])), [donnees]);
  useEffect(() => {
    if (!donnees) return;
    setReponses(initiales);
    setSousFI(donnees.sousCategorieFI ?? "");
    setReclasser(!!donnees.justificationCategorie);
    setCategorieRetenue(donnees.justificationCategorie ? (donnees.categorie ?? "") : "");
    setJustification(donnees.justificationCategorie ?? "");
  }, [donnees, initiales]);

  useEffect(() => {
    if (!donnees || !prefill.categorisation) return;
    const propositions = prefill.categorisation;
    setReponses((r) => ({ ...r, ...Object.fromEntries(propositions.map((x) => [x.questionId, x.valeur === "oui"])) }));
    consommer("categorisation");
  }, [prefill.categorisation, donnees, consommer]);

  // Calcul immédiat, avec la même règle que le serveur (lib/domaine/categorisation).
  const calcul = useMemo(
    () => calculerCategorie(donnees?.questions ?? [], reponses, lirePreseance(parametres.PRESEANCE_CATEGORIES)),
    [donnees, reponses, parametres.PRESEANCE_CATEGORIES]
  );
  if (!donnees) return <Chargement lignes={8} />;

  const modifie =
    JSON.stringify(reponses) !== JSON.stringify(initiales) ||
    sousFI !== (donnees.sousCategorieFI ?? "") ||
    justification !== (donnees.justificationCategorie ?? "") ||
    (reclasser && categorieRetenue !== (donnees.justificationCategorie ? donnees.categorie : ""));
  const categorieAffichee = reclasser && categorieRetenue ? categorieRetenue : calcul.categorie;

  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      const corps: Record<string, unknown> = {
        reponses: Object.entries(reponses)
          .filter(([, v]) => v !== undefined)
          .map(([questionId, reponse]) => ({ questionId, reponse })),
        sousCategorieFI: categorieAffichee === "FI" ? sousFI || null : null,
      };
      if (droits.reclasser && (reclasser || donnees.justificationCategorie)) {
        corps.categorieRetenue = reclasser ? categorieRetenue || null : null;
        corps.justification = reclasser ? justification : null;
      }
      await api(`/api/dossiers/${dossier.id}/categorisation`, { method: "PUT", body: corps });
      toast(t("commun.enregistre"));
      await Promise.all([rechargerVolet(), recharger()]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const groupes = CATEGORIES.map((c) => ({ c, questions: donnees.questions.filter((q) => q.categorie === c) })).filter((g) => g.questions.length);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <Bandeau ton="info">{t("categorisation.description")}</Bandeau>
          {groupes.map((g) => (
            <Carte key={g.c} titre={t(`categorie.${g.c}`)} description={t(`categorie.desc${g.c}`)} sansMarge>
              <ol className="divide-y divide-border">
                {g.questions.map((q) => (
                  <li key={q.id} className={cn("flex flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center", reponses[q.id] && "bg-accent/50")}>
                    <span className="w-7 shrink-0 text-[12px] font-semibold text-muted-foreground tabulaire">{q.numero}.</span>
                    <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed">{lib(q.libelle)}</p>
                    <ChoixSegmente
                      nom={q.code}
                      taille="petite"
                      valeur={reponses[q.id] === undefined ? null : reponses[q.id] ? "oui" : "non"}
                      onChange={(v) => setReponses({ ...reponses, [q.id]: v === "oui" })}
                      options={[
                        { valeur: "oui", libelle: t("commun.oui") },
                        { valeur: "non", libelle: t("commun.non") },
                      ]}
                      desactive={!droits.evaluation}
                    />
                  </li>
                ))}
              </ol>
            </Carte>
          ))}
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <Carte titre={t("categorisation.calculee")}>
            <div className="flex items-center gap-3">
              <PuceCategorie categorie={categorieAffichee} sous={categorieAffichee === "FI" ? sousFI : null} grande />
              <p className="text-[12.5px] text-muted-foreground">{categorieAffichee ? t(`categorie.desc${categorieAffichee}`) : t("categorie.nonCategorise")}</p>
            </div>
            {!calcul.complet && <p className="mt-3 text-[12px] text-warning">{t("categorisation.incomplete", { n: calcul.manquantes.length })}</p>}
            {donnees.secteur?.categorieIndicative && (
              <p className="mt-3 text-[12px] text-muted-foreground">{t("categorisation.indicationSecteur", { categorie: donnees.secteur.categorieIndicative })}</p>
            )}
            <p className="mt-3 text-[11.5px] text-muted-foreground">{t("categorisation.preseance")}</p>
            {categorieAffichee === "A" && <Bandeau ton="vigilance" className="mt-3">{t("categorisation.eieRequise")}</Bandeau>}
            {categorieAffichee === "FI" && (
              <Selecteur
                id="sousFI"
                className="mt-3"
                libelle={t("categorisation.sousCategorieFI")}
                valeur={sousFI}
                onChange={setSousFI}
                options={SOUS_CATEGORIES_FI.map((s) => ({ valeur: s, libelle: t(`categorie.${s}`) }))}
                obligatoire
                desactive={!droits.evaluation}
              />
            )}
          </Carte>
          {(droits.reclasser || donnees.justificationCategorie) && (
            <Carte titre={t("categorisation.surclasser")}>
              <label className="mb-3 flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={reclasser} disabled={!droits.reclasser} onChange={(e) => setReclasser(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                {t("categorisation.surclasser")}
              </label>
              {reclasser && (
                <div className="space-y-3">
                  <Selecteur id="retenue" libelle={t("categorisation.retenue")} valeur={categorieRetenue} onChange={setCategorieRetenue} options={CATEGORIES.map((c) => ({ valeur: c, libelle: t(`categorie.${c}`) }))} desactive={!droits.reclasser} />
                  <ZoneTexte id="justif" libelle={t("categorisation.justification")} valeur={justification} onChange={setJustification} aide={t("categorisation.justificationAide")} obligatoire desactive={!droits.reclasser} />
                </div>
              )}
            </Carte>
          )}
        </aside>
      </div>
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      <BarreVolet modifie={(droits.evaluation || droits.reclasser) && modifie} suivante="evaluation">
        {(droits.evaluation || droits.reclasser) && (
          <Bouton onClick={enregistrer} disabled={!modifie || enCours || (reclasser && (!categorieRetenue || !justification.trim()))}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        )}
      </BarreVolet>
    </div>
  );
}
