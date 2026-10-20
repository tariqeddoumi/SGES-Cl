"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { DECISIONS } from "@/lib/domaine/constantes";
import { dateInput } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChoixSegmente, Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Bandeau, Carte, Ligne, Sablier } from "@/components/ui/mise-en-page";
import { PuceDecision } from "@/components/ui/puces";
import { useDossier } from "./contexte";

export function VoletDecision() {
  const { t, lib, fmt } = useApp();
  const { dossier: d, droits, recharger } = useDossier();
  const ref = useReferentiels();
  const toast = useToast();
  const [v, setV] = useState({
    comite: d.comite ?? "",
    dateComite: dateInput(d.dateComite) || dateInput(new Date()),
    decision: d.decision ?? "",
    montantAccorde: d.montantAccorde?.toString() ?? d.montantDemande.toString(),
    motifRejetCode: d.motifRejetCode ?? "",
    motifRejetES: d.motifRejetES ?? "",
    reservesComite: d.reservesComite ?? "",
    commentaireComite: d.commentaireComite ?? "",
  });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => setErreur(""), [v]);

  const enregistrer = async () => {
    setEnCours(true);
    try {
      await api(`/api/dossiers/${d.id}/decision`, {
        body: {
          comite: v.comite || null,
          dateComite: v.dateComite,
          decision: v.decision,
          montantAccorde: v.decision === "accorde" ? Number(v.montantAccorde) : null,
          motifRejetCode: v.decision === "rejete" ? v.motifRejetCode || null : null,
          motifRejetES: v.decision === "rejete" ? v.motifRejetES || null : null,
          reservesComite: v.reservesComite || null,
          commentaireComite: v.commentaireComite || null,
        },
      });
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  if (d.decision && !droits.decider) {
    return (
      <Carte titre={t("comite.titre")}>
        <dl>
          <Ligne libelle={t("comite.decision")}><PuceDecision decision={d.decision} /></Ligne>
          <Ligne libelle={t("comite.comite")}>{lib(ref?.listes.comite?.find((c) => c.code === d.comite)?.libelle) || d.comite}</Ligne>
          <Ligne libelle={t("comite.dateComite")}>{fmt.date(d.dateComite)}</Ligne>
          {d.montantAccorde && <Ligne libelle={t("comite.montantAccorde")}>{fmt.montant(d.montantAccorde, d.deviseCode)}</Ligne>}
          {d.motifRejetCode && <Ligne libelle={t("comite.motifRejet")}>{lib(ref?.listes.motif_rejet?.find((c) => c.code === d.motifRejetCode)?.libelle) || d.motifRejetCode}</Ligne>}
          {d.motifRejetES && <Ligne libelle={t("comite.motifRejetDetail")}>{d.motifRejetES}</Ligne>}
          {d.reservesComite && <Ligne libelle={t("comite.reserves")}>{d.reservesComite}</Ligne>}
          {d.commentaireComite && <Ligne libelle={t("comite.commentaire")}>{d.commentaireComite}</Ligne>}
        </dl>
      </Carte>
    );
  }
  if (!droits.decider) return <Bandeau ton="info">{t("comite.pasEncore")}</Bandeau>;

  const opt = (l: string) => (ref?.listes[l] ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle) }));
  return (
    <Carte titre={t("comite.titre")} description={t("comite.description")}>
      <div className="grid gap-4 md:grid-cols-2">
        <Selecteur id="comite" libelle={t("comite.comite")} valeur={v.comite} onChange={(x) => setV({ ...v, comite: x })} options={opt("comite")} />
        <Champ id="dateComite" type="date" libelle={t("comite.dateComite")} valeur={v.dateComite} onChange={(x) => setV({ ...v, dateComite: x })} obligatoire />
        <div className="md:col-span-2">
          <p className="mb-1 text-[12.5px] font-medium">
            {t("comite.decision")} <span className="text-destructive">*</span>
          </p>
          <ChoixSegmente nom="decision" valeur={v.decision} onChange={(x) => setV({ ...v, decision: x })} options={DECISIONS.map((x) => ({ valeur: x, libelle: t(`decision.${x}`) }))} risque={["rejete"]} />
        </div>
        {v.decision === "accorde" && (
          <>
            <Champ id="montantAccorde" type="number" min={0} libelle={t("comite.montantAccorde")} valeur={v.montantAccorde} onChange={(x) => setV({ ...v, montantAccorde: x })} suffixe={d.deviseCode} obligatoire />
            <ZoneTexte id="reserves" className="md:col-span-2" libelle={t("comite.reserves")} aide={t("comite.reservesAide")} valeur={v.reservesComite} onChange={(x) => setV({ ...v, reservesComite: x })} lignes={2} />
          </>
        )}
        {v.decision === "rejete" && (
          <>
            <Selecteur id="motif" libelle={t("comite.motifRejet")} valeur={v.motifRejetCode} onChange={(x) => setV({ ...v, motifRejetCode: x })} options={opt("motif_rejet")} />
            <ZoneTexte id="motifDetail" libelle={t("comite.motifRejetDetail")} valeur={v.motifRejetES} onChange={(x) => setV({ ...v, motifRejetES: x })} lignes={2} obligatoire={!!v.motifRejetCode} />
          </>
        )}
        <ZoneTexte id="commentaireComite" className="md:col-span-2" libelle={t("comite.commentaire")} valeur={v.commentaireComite} onChange={(x) => setV({ ...v, commentaireComite: x })} lignes={2} />
      </div>
      {erreur && <Bandeau ton="alerte" className="mt-4">{erreur}</Bandeau>}
      <div className="mt-4 flex justify-end">
        <Bouton onClick={enregistrer} disabled={enCours || !v.decision || !v.dateComite}>
          {enCours && <Sablier />}
          {t("comite.enregistrer")}
        </Bouton>
      </div>
    </Carte>
  );
}
