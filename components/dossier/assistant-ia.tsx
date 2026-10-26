"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/client/api";
import type { Checklist } from "@/lib/domaine/pieces";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";
import { RedactionIA, type TypeRedaction } from "./redaction-ia";

interface Reponse {
  code: string;
  libelle: string;
  valeur: string;
  justification: string;
  citation: string | null;
}
interface PropExclusion extends Reponse { critereId: string }
interface PropQuestion extends Reponse { questionId: string }

interface Resultat {
  synthese: string;
  modele: string;
  masques: Record<string, number>;
  checklist: Checklist;
  propositions: {
    identification: { champ: string; valeur: string; citation: string | null }[];
    exclusion: PropExclusion[];
    categorisation: PropQuestion[];
    evaluation: PropQuestion[];
    actionsEIE: { libelle: string; horizon: string; thematique: string | null }[];
  };
}

/**
 * Assistant IA : lit toutes les pièces du dossier (et les canevas remplis), met à jour la
 * check-list documentaire et propose des valeurs pour l'identification, la liste d'exclusion,
 * la catégorisation, le questionnaire E&S et les actions du PGES. Les propositions sont reprises
 * dans les volets sans être enregistrées : le chargé relit, corrige puis enregistre chaque étape.
 */
export function AssistantIA({ onFermer }: { onFermer: () => void }) {
  const { t, parametres } = useApp();
  const toast = useToast();
  const { dossier, droits, recharger, setPrefill } = useDossier();
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [retenues, setRetenues] = useState<Set<string>>(new Set());
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const masquage = parametres.IA_ANONYMISER !== "false";
  const [redaction, setRedaction] = useState<TypeRedaction | null>(null);

  const cle = (section: string, id: string | number) => `${section}:${id}`;

  const analyser = async () => {
    setEnCours(true);
    setErreur("");
    try {
      const r = await api<Resultat>(`/api/dossiers/${dossier.id}/ia`, { body: {} });
      setResultat(r);
      const p = r.propositions;
      setRetenues(
        new Set([
          ...p.identification.map((x) => cle("identification", x.champ)),
          ...p.exclusion.map((x) => cle("exclusion", x.critereId)),
          ...p.categorisation.map((x) => cle("categorisation", x.questionId)),
          ...p.evaluation.map((x) => cle("evaluation", x.questionId)),
          ...p.actionsEIE.map((_, i) => cle("actions", i)),
        ])
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const basculer = (k: string, on: boolean) =>
    setRetenues((s) => {
      const n = new Set(s);
      if (on) n.add(k);
      else n.delete(k);
      return n;
    });

  const appliquer = async () => {
    if (!resultat) return;
    const p = resultat.propositions;
    const ok = (s: string, id: string | number) => retenues.has(cle(s, id));
    const prefill = {
      identification: p.identification.filter((x) => ok("identification", x.champ)).map((x) => ({ champ: x.champ, valeur: x.valeur })),
      exclusion: p.exclusion.filter((x) => ok("exclusion", x.critereId)).map((x) => ({ critereId: x.critereId, valeur: x.valeur })),
      categorisation: p.categorisation.filter((x) => ok("categorisation", x.questionId)).map((x) => ({ questionId: x.questionId, valeur: x.valeur })),
      evaluation: p.evaluation.filter((x) => ok("evaluation", x.questionId)).map((x) => ({ questionId: x.questionId, valeur: x.valeur, justification: x.justification })),
    };
    let n = 0;
    for (const liste of Object.values(prefill)) n += liste.length;
    setPrefill(Object.fromEntries(Object.entries(prefill).filter(([, l]) => l.length)));
    for (const [i, a] of p.actionsEIE.entries()) {
      if (!ok("actions", i)) continue;
      await api(`/api/dossiers/${dossier.id}/actions`, { body: { libelle: a.libelle, origine: "eie", horizon: a.horizon, thematique: a.thematique } }).catch(() => undefined);
      n++;
    }
    await recharger();
    toast(t("ia.reprises", { n }));
    onFermer();
  };

  const section = (nom: string, lignes: { k: string; titre: string; valeur: React.ReactNode; justification?: string; citation?: string | null }[]) =>
    lignes.length > 0 && (
      <div key={nom}>
        <p className="mb-2 text-[13px] font-semibold">{t(`ia.section.${nom}`)}</p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {lignes.map((l) => (
            <li key={l.k} className="flex gap-3 px-3 py-2.5">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primary)]" checked={retenues.has(l.k)} onChange={(e) => basculer(l.k, e.target.checked)} aria-label={l.titre} />
              <div className="min-w-0 text-[13px]">
                <p className="font-medium">{l.titre}</p>
                <p className="mt-0.5">
                  {l.valeur} {l.justification && <span className="text-muted-foreground">{l.justification}</span>}
                </p>
                {l.citation && <p className="mt-1 border-s-2 border-border ps-2 text-[12px] italic text-muted-foreground">« {l.citation} »</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );

  if (redaction) return <RedactionIA type={redaction} onFermer={onFermer} />;

  const valeur = (v: string) => <Puce ton={v === "non" ? "alerte" : v === "oui" ? "favorable" : "neutre"}>{v === "na" ? t("commun.na") : v === "oui" ? t("commun.oui") : v === "non" ? t("commun.non") : v}</Puce>;
  const p = resultat?.propositions;
  const total = p ? p.identification.length + p.exclusion.length + p.categorisation.length + p.evaluation.length + p.actionsEIE.length : 0;

  return (
    <Dialogue
      ouvert
      large
      onFermer={onFermer}
      titre={
        <span className="flex items-center gap-2">
          <Sparkles size={16} /> {t("ia.titre")}
        </span>
      }
      pied={
        resultat ? (
          <>
            <Bouton variante="contour" onClick={onFermer}>
              {t("commun.annuler")}
            </Bouton>
            {droits.evaluation && total > 0 && <Bouton onClick={appliquer}>{t("ia.appliquer")}</Bouton>}
          </>
        ) : (
          <Bouton onClick={analyser} disabled={enCours}>
            {enCours ? <Sablier /> : <Sparkles />} {t("ia.lancer")}
          </Bouton>
        )
      }
    >
      {erreur && <Bandeau ton="alerte" className="mb-3">{erreur}</Bandeau>}
      {!resultat ? (
        <div className="space-y-3">
          <p className="text-[13px]">{t("ia.presentation")}</p>
          <Bandeau ton={masquage ? "info" : "vigilance"}>{masquage ? t("ia.masquageActif") : t("ia.masquageInactif")}</Bandeau>
          {enCours && <p className="text-[13px] text-muted-foreground">{t("ia.enCours")}</p>}
          {!enCours && (
            <div>
              <p className="mb-2 text-[13px] font-semibold">{t("ia.autresFonctions")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["commentaire", "revue", "synthese", "clauses"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setRedaction(m)} className="rounded-md border border-border p-3 text-start transition-colors hover:bg-accent">
                    <span className="block text-[13px] font-semibold">{t(`ia.mode_${m}`)}</span>
                    <span className="mt-0.5 block text-[12px] text-muted-foreground">{t(`ia.desc_${m}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {resultat.synthese && <Bandeau ton="info">{resultat.synthese}</Bandeau>}
          {total === 0 ? <Bandeau ton="vigilance">{t("ia.aucune")}</Bandeau> : droits.evaluation && <p className="text-[12.5px] text-muted-foreground">{t("ia.verifier")}</p>}
          {p && (
            <>
              {section("identification", p.identification.map((x) => ({ k: cle("identification", x.champ), titre: t(`ia.champ.${x.champ}`), valeur: <span>{x.valeur}</span>, citation: x.citation })))}
              {section("exclusion", p.exclusion.map((x) => ({ k: cle("exclusion", x.critereId), titre: x.libelle, valeur: valeur(x.valeur), justification: x.justification, citation: x.citation })))}
              {section("categorisation", p.categorisation.map((x) => ({ k: cle("categorisation", x.questionId), titre: x.libelle, valeur: valeur(x.valeur), justification: x.justification, citation: x.citation })))}
              {section("evaluation", p.evaluation.map((x) => ({ k: cle("evaluation", x.questionId), titre: x.libelle, valeur: valeur(x.valeur), justification: x.justification, citation: x.citation })))}
              {section("actions", p.actionsEIE.map((a, i) => ({ k: cle("actions", i), titre: a.libelle, valeur: <span className="text-muted-foreground">({t(`horizon.${a.horizon}`)})</span> })))}
            </>
          )}
          <p className="text-[11px] text-muted-foreground">{resultat.modele}</p>
        </div>
      )}
    </Dialogue>
  );
}
