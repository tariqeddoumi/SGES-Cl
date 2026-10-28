"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { CONFORMITES, TYPES_VISITE } from "@/lib/domaine/constantes";
import { dateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { VoletPlan } from "./volet-plan";
import { useLibelles } from "@/lib/client/listes";

interface Visite {
  id: string;
  date: string;
  type: string;
  participants: string | null;
  constats: string | null;
  conformite: string | null;
  recommandations: string | null;
  prochaineVisite: string | null;
  visiteur: { prenom: string; nom: string } | null;
}

const vide = { id: "", date: dateInput(new Date()), type: "suivi", participants: "", constats: "", conformite: "", recommandations: "", prochaineVisite: "" };

export function VoletSuivi() {
  const { t, fmt } = useApp();
  const fonctions = useLibelles("fonction_client");
  const constatsTypes = useLibelles("constat_visite");
  const recommandationsTypes = useLibelles("recommandation_visite");
  const { dossier, droits, recharger } = useDossier();
  const toast = useToast();
  const { donnees, recharger: rechargerVisites } = useDonnees<Visite[]>(`/api/dossiers/${dossier.id}/visites`);
  const [edition, setEdition] = useState<typeof vide | null>(null);

  const enregistrer = async () => {
    if (!edition) return;
    const corps = {
      date: edition.date,
      type: edition.type,
      participants: edition.participants || null,
      constats: edition.constats || null,
      conformite: edition.conformite || null,
      recommandations: edition.recommandations || null,
      prochaineVisite: edition.prochaineVisite || null,
    };
    try {
      if (edition.id) await api(`/api/dossiers/${dossier.id}/visites/${edition.id}`, { method: "PATCH", body: corps });
      else await api(`/api/dossiers/${dossier.id}/visites`, { body: corps });
      setEdition(null);
      toast(t("commun.enregistre"));
      await Promise.all([rechargerVisites(), recharger()]);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    }
  };
  const supprimer = async (id: string) => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    await api(`/api/dossiers/${dossier.id}/visites/${id}`, { method: "DELETE" });
    await rechargerVisites();
  };

  const [encours, setEncours] = useState({ montant: dossier.encours === null ? "" : String(dossier.encours), date: dateInput(dossier.dateEncours) });
  const enregistrerEncours = async () => {
    try {
      const m = encours.montant.trim() === "" ? null : Number(encours.montant.replace(/\s/g, "").replace(",", "."));
      await api(`/api/dossiers/${dossier.id}/encours`, { method: "PUT", body: { encours: m, dateEncours: m === null ? null : encours.date || null } });
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    }
  };

  const tonConformite = (c: string | null) => (c === "conforme" ? "favorable" : c === "partielle" ? "vigilance" : c === "non_conforme" ? "alerte" : "neutre");
  return (
    <div className="space-y-4">
      {dossier.statut === "decide" && dossier.decision === "accorde" && droits.transitions.includes("demarrer_suivi") && (
        <Bandeau ton="info">{t("transition.demarrer_suivi")} : ↑</Bandeau>
      )}
      {dossier.decision === "accorde" && (
        <Carte titre={t("suivi.encoursTitre")} description={t("suivi.encoursAide")}>
          <div className="flex flex-wrap items-end gap-3">
            <Champ id="encours" type="number" min={0} className="w-56" libelle={t("suivi.encours")} valeur={encours.montant} onChange={(v) => setEncours({ ...encours, montant: v })} suffixe={dossier.deviseCode} desactive={!droits.plan} />
            <Champ id="date-encours" type="date" className="w-48" libelle={t("suivi.dateEncours")} valeur={encours.date} onChange={(v) => setEncours({ ...encours, date: v })} desactive={!droits.plan} />
            {droits.plan && (
              <Bouton variante="contour" onClick={enregistrerEncours}>
                {t("commun.enregistrer")}
              </Bouton>
            )}
          </div>
        </Carte>
      )}
      <Carte
        titre={t("suivi.visites")}
        actions={
          droits.visites && (
            <Bouton taille="petite" onClick={() => setEdition({ ...vide })}>
              <CalendarPlus /> {t("suivi.nouvelleVisite")}
            </Bouton>
          )
        }
        sansMarge
      >
        {!donnees ? (
          <div className="p-4">
            <Chargement />
          </div>
        ) : donnees.length === 0 ? (
          <Vide titre={t("suivi.aucuneVisite")} />
        ) : (
          <ul className="divide-y divide-border">
            {donnees.map((v) => (
              <li key={v.id} className="px-4 py-3 text-[13px]">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{fmt.date(v.date)}</strong>
                  <Puce>{t(`suivi.${v.type}`)}</Puce>
                  {v.conformite && <Puce ton={tonConformite(v.conformite)}>{t(`suivi.${v.conformite}`)}</Puce>}
                  {v.visiteur && <span className="text-muted-foreground">— {v.visiteur.prenom} {v.visiteur.nom}</span>}
                  {droits.visites && (
                    <span className="ms-auto flex gap-1">
                      <Bouton variante="fantome" taille="iconePetite" aria-label={t("commun.modifier")} onClick={() => setEdition({ id: v.id, date: dateInput(v.date), type: v.type, participants: v.participants ?? "", constats: v.constats ?? "", conformite: v.conformite ?? "", recommandations: v.recommandations ?? "", prochaineVisite: dateInput(v.prochaineVisite) })}>
                        <Pencil />
                      </Bouton>
                      <Bouton variante="fantome" taille="iconePetite" aria-label={t("commun.supprimer")} onClick={() => supprimer(v.id)}>
                        <Trash2 className="text-destructive" />
                      </Bouton>
                    </span>
                  )}
                </div>
                {v.constats && <p className="mt-1.5 whitespace-pre-line">{v.constats}</p>}
                {v.recommandations && (
                  <p className="mt-1 whitespace-pre-line text-muted-foreground">
                    {t("suivi.recommandations")} : {v.recommandations}
                  </p>
                )}
                {v.prochaineVisite && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {t("suivi.prochaineVisite")} : {fmt.date(v.prochaineVisite)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>

      {["decide", "en_suivi", "cloture"].includes(dossier.statut) && <VoletPlan />}

      <Dialogue
        ouvert={!!edition}
        onFermer={() => setEdition(null)}
        titre={t("suivi.nouvelleVisite")}
        large
        pied={
          <>
            <Bouton variante="contour" onClick={() => setEdition(null)}>
              {t("commun.annuler")}
            </Bouton>
            <Bouton onClick={enregistrer} disabled={!edition?.date}>
              {t("commun.enregistrer")}
            </Bouton>
          </>
        }
      >
        {edition && (
          <div className="grid gap-3 md:grid-cols-2">
            <Champ id="dv" type="date" libelle={t("suivi.dateVisite")} valeur={edition.date} onChange={(x) => setEdition({ ...edition, date: x })} obligatoire />
            <Selecteur id="tv" libelle={t("suivi.typeVisite")} valeur={edition.type} onChange={(x) => setEdition({ ...edition, type: x })} options={TYPES_VISITE.map((x) => ({ valeur: x, libelle: t(`suivi.${x}`) }))} sansVide />
            <Champ id="pv" suggestions={fonctions} className="md:col-span-2" libelle={t("suivi.participants")} valeur={edition.participants} onChange={(x) => setEdition({ ...edition, participants: x })} />
            <ZoneTexte id="cv" modeles={constatsTypes} className="md:col-span-2" libelle={t("suivi.constats")} valeur={edition.constats} onChange={(x) => setEdition({ ...edition, constats: x })} lignes={4} />
            <Selecteur id="conf" libelle={t("suivi.conformite")} valeur={edition.conformite} onChange={(x) => setEdition({ ...edition, conformite: x })} options={CONFORMITES.map((x) => ({ valeur: x, libelle: t(`suivi.${x}`) }))} />
            <Champ id="pvn" type="date" libelle={t("suivi.prochaineVisite")} valeur={edition.prochaineVisite} onChange={(x) => setEdition({ ...edition, prochaineVisite: x })} />
            <ZoneTexte id="rv" modeles={recommandationsTypes} className="md:col-span-2" libelle={t("suivi.recommandations")} valeur={edition.recommandations} onChange={(x) => setEdition({ ...edition, recommandations: x })} lignes={3} />
          </div>
        )}
      </Dialogue>
    </div>
  );
}
