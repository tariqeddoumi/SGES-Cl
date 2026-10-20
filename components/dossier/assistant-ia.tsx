"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Selecteur, ZoneTexte } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";

export interface Proposition {
  questionId: string;
  code: string;
  question: string;
  valeur: string;
  justification: string;
  citation: string | null;
}

interface Resultat {
  propositions: Proposition[];
  actionsEIE: { libelle: string; horizon: string; thematique: string | null }[];
  synthese: string;
  modele: string;
}

/**
 * Assistant d'analyse (facultatif) : lit l'EIES / le PGES déposé et propose des réponses
 * au questionnaire et des actions issues de l'étude. Rien n'est enregistré sans
 * validation explicite du chargé : l'outil reste un outil d'aide à la décision.
 */
export function AssistantIA({ onFermer, onAppliquer }: { onFermer: () => void; onAppliquer: (p: Proposition[]) => void }) {
  const { t } = useApp();
  const toast = useToast();
  const { dossier, recharger } = useDossier();
  const { donnees: pieces } = useDonnees<{ id: string; nom: string; type: string; mime: string }[]>(`/api/dossiers/${dossier.id}/documents`);
  const [documentId, setDocumentId] = useState("");
  const [texte, setTexte] = useState("");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [retenues, setRetenues] = useState<Set<string>>(new Set());
  const [actionsRetenues, setActionsRetenues] = useState<Set<number>>(new Set());
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const analyser = async () => {
    setEnCours(true);
    setErreur("");
    try {
      const r = await api<Resultat>(`/api/dossiers/${dossier.id}/ia`, { body: { documentId: documentId || null, texte: texte || null } });
      setResultat(r);
      setRetenues(new Set(r.propositions.map((p) => p.questionId)));
      setActionsRetenues(new Set(r.actionsEIE.map((_, i) => i)));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const appliquer = async () => {
    if (!resultat) return;
    for (const [i, a] of resultat.actionsEIE.entries()) {
      if (!actionsRetenues.has(i)) continue;
      await api(`/api/dossiers/${dossier.id}/actions`, { body: { libelle: a.libelle, origine: "eie", horizon: a.horizon, thematique: a.thematique } }).catch(() => undefined);
    }
    if (actionsRetenues.size) {
      toast(`${actionsRetenues.size} ${t("origine.eie").toLowerCase()}`);
      await recharger();
    }
    onAppliquer(resultat.propositions.filter((p) => retenues.has(p.questionId)));
  };

  const documents = (pieces ?? []).filter((p) => p.mime === "application/pdf" || p.mime === "text/plain");
  return (
    <Dialogue
      ouvert
      large
      onFermer={onFermer}
      titre={
        <span className="flex items-center gap-2">
          <Sparkles size={16} /> {t("evaluation.assistantIA")}
        </span>
      }
      pied={
        resultat ? (
          <>
            <Bouton variante="contour" onClick={onFermer}>
              {t("commun.annuler")}
            </Bouton>
            <Bouton onClick={appliquer}>{t("commun.valider")}</Bouton>
          </>
        ) : (
          <Bouton onClick={analyser} disabled={enCours || (!documentId && texte.trim().length < 200)}>
            {enCours && <Sablier />}
            <Sparkles /> {t("commun.valider")}
          </Bouton>
        )
      }
    >
      {erreur && <Bandeau ton="alerte" className="mb-3">{erreur}</Bandeau>}
      {!resultat ? (
        <div className="space-y-4">
          <Selecteur id="doc-ia" libelle={t("pieces.fichier")} valeur={documentId} onChange={setDocumentId} options={documents.map((d) => ({ valeur: d.id, libelle: `${d.type} — ${d.nom}` }))} />
          <ZoneTexte id="texte-ia" libelle={t("commun.description")} valeur={texte} onChange={setTexte} lignes={6} />
        </div>
      ) : (
        <div className="space-y-4">
          {resultat.synthese && <Bandeau ton="info">{resultat.synthese}</Bandeau>}
          <ul className="divide-y divide-border rounded-md border border-border">
            {resultat.propositions.map((p) => (
              <li key={p.questionId} className="flex gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  checked={retenues.has(p.questionId)}
                  onChange={(e) => {
                    const s = new Set(retenues);
                    if (e.target.checked) s.add(p.questionId);
                    else s.delete(p.questionId);
                    setRetenues(s);
                  }}
                  aria-label={p.question}
                />
                <div className="min-w-0 text-[13px]">
                  <p className="font-medium">{p.question}</p>
                  <p className="mt-0.5">
                    <Puce ton={p.valeur === "non" ? "alerte" : "favorable"}>{p.valeur === "na" ? t("commun.na") : p.valeur === "oui" ? t("commun.oui") : p.valeur === "non" ? t("commun.non") : p.valeur}</Puce>{" "}
                    <span className="text-muted-foreground">{p.justification}</span>
                  </p>
                  {p.citation && <p className="mt-1 border-s-2 border-border ps-2 text-[12px] italic text-muted-foreground">« {p.citation} »</p>}
                </div>
              </li>
            ))}
          </ul>
          {resultat.actionsEIE.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-semibold">{t("plan.ajouterEIE")}</p>
              <ul className="space-y-1.5">
                {resultat.actionsEIE.map((a, i) => (
                  <li key={i} className="flex gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--primary)]"
                      checked={actionsRetenues.has(i)}
                      onChange={(e) => {
                        const s = new Set(actionsRetenues);
                        if (e.target.checked) s.add(i);
                        else s.delete(i);
                        setActionsRetenues(s);
                      }}
                      aria-label={a.libelle}
                    />
                    <span>
                      {a.libelle} <span className="text-muted-foreground">({t(`horizon.${a.horizon}`)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">{resultat.modele}</p>
        </div>
      )}
    </Dialogue>
  );
}
