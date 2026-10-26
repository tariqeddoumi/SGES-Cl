"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCopy, Sparkles } from "lucide-react";
import { api } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useDossier } from "./contexte";

export type TypeRedaction = "commentaire" | "revue" | "synthese" | "clauses";

interface Reponse {
  type: TypeRedaction;
  modele: string;
  resultat: {
    texte?: string;
    appreciation?: string;
    alertes?: { gravite: "bloquant" | "majeur" | "mineur"; etape: string; constat: string; recommandation: string }[];
    clauses?: { type: string; texte: string }[];
    remarques?: string;
  };
}

const TON = { bloquant: "alerte", majeur: "vigilance", mineur: "neutre" } as const;

/**
 * Rédaction et contrôle assistés : commentaire d'évaluation, revue de cohérence, note pour le comité,
 * clauses E&S du contrat. Le texte proposé est relu par l'utilisateur ; seul le commentaire peut être
 * repris dans l'étape « Risques E&S », sans être enregistré.
 */
export function RedactionIA({ type, onFermer }: { type: TypeRedaction; onFermer: () => void }) {
  const { t } = useApp();
  const toast = useToast();
  const router = useRouter();
  const { dossier, droits, setPrefill } = useDossier();
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [erreur, setErreur] = useState("");
  const lance = useRef(false);

  useEffect(() => {
    if (lance.current) return;
    lance.current = true;
    api<Reponse>(`/api/dossiers/${dossier.id}/ia/redaction`, { body: { type } })
      .then(setReponse)
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)));
  }, [dossier.id, type]);

  const texte = () => {
    const r = reponse?.resultat;
    if (!r) return "";
    if (r.texte) return r.texte;
    if (r.alertes) return [r.appreciation, ...r.alertes.map((a) => `[${t(`ia.gravite_${a.gravite}`)} — ${t(`etape.${a.etape}`)}] ${a.constat} → ${a.recommandation}`)].join("\n");
    if (r.clauses) return [...r.clauses.map((c) => `${t(`clauses.type_${c.type}`)} : ${c.texte}`), "", r.remarques ?? ""].join("\n");
    return "";
  };
  const copier = async () => {
    await navigator.clipboard.writeText(texte()).catch(() => undefined);
    toast(t("ia.copie"));
  };
  const inserer = () => {
    setPrefill({ commentaire: reponse?.resultat.texte ?? "" });
    toast(t("ia.insere"));
    onFermer();
    router.replace(`/dossiers/${dossier.id}?etape=evaluation`, { scroll: false });
  };

  const r = reponse?.resultat;
  return (
    <Dialogue
      ouvert
      large
      onFermer={onFermer}
      titre={
        <span className="flex items-center gap-2">
          <Sparkles size={16} /> {t(`ia.mode_${type}`)}
        </span>
      }
      pied={
        <>
          <Bouton variante="contour" onClick={onFermer}>
            {t("commun.fermer")}
          </Bouton>
          {reponse && (
            <Bouton variante="contour" onClick={copier}>
              <ClipboardCopy /> {t("ia.copier")}
            </Bouton>
          )}
          {reponse && type === "commentaire" && droits.evaluation && <Bouton onClick={inserer}>{t("ia.insererCommentaire")}</Bouton>}
        </>
      }
    >
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      {!reponse && !erreur && (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Sablier /> {t("ia.enCours")}
        </p>
      )}
      {r && (
        <div className="space-y-3 text-[13px]">
          <Bandeau ton="info">{t("ia.aRelire")}</Bandeau>
          {r.texte && <div className="whitespace-pre-wrap rounded-md border border-border bg-surface/60 p-3 leading-relaxed">{r.texte}</div>}
          {r.alertes && (
            <>
              {r.appreciation && <p className="font-medium">{r.appreciation}</p>}
              {r.alertes.length === 0 ? (
                <Bandeau ton="succes">{t("ia.aucuneAlerte")}</Bandeau>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {r.alertes.map((a, i) => (
                    <li key={i} className="space-y-1 px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Puce ton={TON[a.gravite]}>{t(`ia.gravite_${a.gravite}`)}</Puce>
                        <Puce>{t(`etape.${a.etape}`)}</Puce>
                      </div>
                      <p>{a.constat}</p>
                      <p className="text-muted-foreground">→ {a.recommandation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {r.clauses && (
            <>
              {(["condition_prealable", "engagement", "reporting", "defaut"] as const).map((ty) => {
                const l = r.clauses!.filter((c) => c.type === ty);
                return l.length ? (
                  <div key={ty}>
                    <p className="mb-1 font-semibold">{t(`clauses.type_${ty}`)}</p>
                    <ol className="list-decimal space-y-1 ps-5">
                      {l.map((c, i) => (
                        <li key={i}>{c.texte}</li>
                      ))}
                    </ol>
                  </div>
                ) : null;
              })}
              {r.remarques && <Bandeau ton="vigilance">{r.remarques}</Bandeau>}
            </>
          )}
          <p className="text-[11px] text-muted-foreground">{reponse?.modele}</p>
        </div>
      )}
    </Dialogue>
  );
}
