"use client";

import { CheckCircle2, Eye, FileSearch, ScanText, Upload, X } from "lucide-react";
import { documentsUtiles, VISITE, type InfoVide, type Proposition } from "@/lib/domaine/sources";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Sablier } from "@/components/ui/mise-en-page";
import { cn } from "@/lib/utils";
import { useDossier } from "./contexte";

/** Libellé d'un type de pièce (liste « type_document »). */
export function useLibType() {
  const { lib } = useApp();
  const ref = useReferentiels();
  return (code: string) => lib(ref?.listes.type_document?.find((x) => x.code === code)?.libelle) || code;
}

/**
 * « Où trouver l'information » : documents qui la contiennent (déposés ✓, ou à charger d'un clic)
 * et constat en visite. Affiché sous une information encore vide, sans proposition de l'OCR.
 */
export function IndicationSources({ sources, className }: { sources: string[]; className?: string }) {
  const { t } = useApp();
  const { droits, documents } = useDossier();
  const libType = useLibType();
  if (!sources.length) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground", className)}>
      <FileSearch size={13} className="shrink-0" aria-hidden />
      <span>{t("ocr.ouTrouver")}</span>
      {sources.map((s) =>
        s === VISITE ? (
          <span key={s} className="inline-flex items-center gap-1">
            <Eye size={12} aria-hidden /> {t("ocr.visite")}
          </span>
        ) : documents.typesLus.has(s) ? (
          <span key={s} className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 size={12} aria-hidden /> {libType(s)}
          </span>
        ) : droits.pieces ? (
          <button key={s} type="button" onClick={() => documents.deposer(s)} disabled={!!documents.enCours} className="inline-flex items-center gap-1 rounded px-1 text-primary underline-offset-2 hover:underline disabled:opacity-50" title={t("ocr.charger", { type: libType(s) })}>
            <Upload size={12} aria-hidden /> {libType(s)}
          </button>
        ) : (
          <span key={s}>{libType(s)}</span>
        )
      )}
    </p>
  );
}

/** Valeur proposée par l'OCR intelligent, avec le document et le passage qui la fondent. */
export function PropositionOCR({
  proposition,
  rendu,
  onReprendre,
  onEcarter,
  className,
}: {
  proposition: Proposition;
  rendu?: React.ReactNode;
  onReprendre?: () => void;
  onEcarter?: () => void;
  className?: string;
}) {
  const { t } = useApp();
  return (
    <div className={cn("rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[12px]", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ScanText size={13} className="shrink-0 text-primary" aria-hidden />
        <span className="font-semibold text-primary">{t("ocr.nom")}</span>
        <span>{rendu ?? proposition.valeur}</span>
        {proposition.documentNom && <span className="text-muted-foreground">— {proposition.documentNom}</span>}
        <span className="ms-auto inline-flex gap-1">
          {onReprendre && (
            <Bouton variante="contour" taille="petite" onClick={onReprendre}>
              {t("ocr.reprendre")}
            </Bouton>
          )}
          {onEcarter && (
            <Bouton variante="fantome" taille="iconePetite" onClick={onEcarter} aria-label={t("ocr.ecarter")} title={t("ocr.ecarter")}>
              <X />
            </Bouton>
          )}
        </span>
      </div>
      {proposition.justification && <p className="mt-0.5 text-muted-foreground">{proposition.justification}</p>}
      {proposition.citation && <p className="mt-0.5 border-s-2 border-border ps-2 italic text-muted-foreground">« {proposition.citation} »</p>}
    </div>
  );
}

/**
 * En tête d'étape : les documents à demander (classés par nombre de réponses qu'ils apportent),
 * la lecture des documents déposés depuis la dernière lecture, et la reprise de toutes les propositions.
 * La saisie directe reste possible à tout moment.
 */
export function BandeauDocuments({ vides, nbPropositions, onToutReprendre }: { vides: InfoVide[]; nbPropositions: number; onToutReprendre?: () => void }) {
  const { t } = useApp();
  const { droits, documents } = useDossier();
  const libType = useLibType();
  const utiles = documentsUtiles(vides, documents.typesLus, 4);
  const aLire = documents.ocrActif ? documents.aLire.length : 0;
  if (!utiles.length && !aLire && !nbPropositions) return null;
  return (
    <div className="no-print space-y-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-[12.5px]">
      <div className="flex flex-wrap items-center gap-2">
        <ScanText size={15} className="shrink-0 text-primary" aria-hidden />
        <span className="font-semibold">{t("ocr.nom")}</span>
        {nbPropositions > 0 && <span>{t("ocr.nbPropositions", { n: nbPropositions })}</span>}
        <span className="ms-auto flex flex-wrap gap-1.5">
          {nbPropositions > 0 && onToutReprendre && (
            <Bouton taille="petite" onClick={onToutReprendre}>
              {t("ocr.toutReprendre", { n: nbPropositions })}
            </Bouton>
          )}
          {aLire > 0 && droits.pieces && (
            <Bouton variante="contour" taille="petite" onClick={documents.lire} disabled={!!documents.enCours}>
              {documents.enCours === "lecture" ? <Sablier /> : <ScanText />} {t("ocr.lire")}
            </Bouton>
          )}
        </span>
      </div>
      {aLire > 0 && <p className="text-muted-foreground">{t("ocr.aLire", { n: aLire })}</p>}
      {utiles.length > 0 && droits.pieces && (
        <div>
          <p className="text-muted-foreground">{documents.ocrActif ? t("ocr.documentsUtiles") : t("ocr.documentsUtilesSansOCR")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {utiles.map((u) => (
              <Bouton key={u.type} variante="contour" taille="petite" className="h-auto max-w-full whitespace-normal py-1 text-start" onClick={() => documents.deposer(u.type)} disabled={!!documents.enCours}>
                <Upload /> {libType(u.type)} <span className="text-muted-foreground">· {t("ocr.nbReponses", { n: u.nb })}</span>
              </Bouton>
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">{t("ocr.saisieDirecte")}</p>
        </div>
      )}
    </div>
  );
}
