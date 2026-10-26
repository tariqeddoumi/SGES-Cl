"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, FileWarning, Sparkles, Upload } from "lucide-react";
import type { Checklist, LignePiece, StatutPiece } from "@/lib/domaine/pieces";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte } from "@/components/ui/mise-en-page";
import { Puce, type Ton } from "@/components/ui/puces";

const TON: Record<StatutPiece, Ton> = { complet: "favorable", incomplet: "vigilance", manquant: "alerte", non_analyse: "neutre", canevas: "info" };

/**
 * Check-list documentaire : pour chaque pièce attendue, son état et, lorsqu'elle est incomplète,
 * les informations précises à compléter dans le document. Une pièce absente peut être remplacée
 * (hors pièces officielles) par un canevas rempli avec le client.
 */
export function ChecklistPieces({
  checklist,
  categorie,
  droits,
  iaActive,
  libType,
  onDeposer,
  onCanevas,
  onAnalyser,
}: {
  checklist: Checklist;
  categorie: string | null;
  droits: boolean;
  iaActive: boolean;
  libType: (code: string) => string;
  onDeposer: (code: string) => void;
  onCanevas: (code: string) => void;
  onAnalyser: () => void;
}) {
  const { t } = useApp();
  const { lignes, incoherences, aCompleter } = checklist;

  const ligne = (l: LignePiece) => {
    const aide = l.statut === "complet" || l.statut === "canevas" ? null : l;
    return (
      <li key={l.code} className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {l.statut === "complet" ? <CheckCircle2 size={17} className="shrink-0 text-success" /> : l.statut === "manquant" ? <FileWarning size={17} className="shrink-0 text-destructive" /> : <AlertTriangle size={17} className="shrink-0 text-warning" />}
          <span className="min-w-0 flex-1 text-[13.5px] font-medium">{libType(l.code)}</span>
          <Puce ton={l.niveau === "obligatoire" ? "primaire" : "neutre"}>{t(`pieces.checklist.${l.niveau}`)}</Puce>
          <Puce ton={TON[l.statut]}>{t(`pieces.checklist.statut.${l.statut}`)}</Puce>
        </div>
        {droits && (
          <div className="ps-6">
            <span className="flex flex-wrap gap-1.5">
              <Bouton variante="contour" taille="petite" onClick={() => onDeposer(l.code)}>
                <Upload /> {t("pieces.checklist.deposer")}
              </Bouton>
              {(!l.officiel || l.statut === "manquant" || l.statut === "canevas" || l.canevas) && (
                <Bouton variante="fantome" taille="petite" onClick={() => onCanevas(l.code)}>
                  <ClipboardList /> {l.canevas ? t("pieces.checklist.modifierCanevas") : t("pieces.checklist.canevas")}
                </Bouton>
              )}
            </span>
          </div>
        )}
        {l.documents.map((d) => (
          <p key={d.id} className="ps-6 text-[12px] text-muted-foreground">
            {d.nom}
            {!d.texteDisponible && <span className="block text-warning">{t("pieces.checklist.nonExtractible")}</span>}
          </p>
        ))}
        {l.statut === "canevas" && <p className="ps-6 text-[12px] text-muted-foreground">{l.officiel ? t("pieces.checklist.aRegulariser") : t("pieces.checklist.canevasSuffit")}</p>}
        {aide && aide.champsManquants.length > 0 && aide.statut !== "manquant" && (
          <div className="ps-6">
            <p className="text-[12px] font-semibold text-muted-foreground">{t("pieces.checklist.manque")}</p>
            <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12.5px]">
              {aide.champsManquants.map((m) => (
                <li key={m.code}>
                  {t(`pieces.champs.${m.code}`)} <span className="text-muted-foreground">— {t(`pieces.checklist.etat.${m.etat}`)}</span>
                  {m.precision && <span className="block text-muted-foreground">{m.precision}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <Carte
      titre={t("pieces.checklist.titre")}
      description={t("pieces.checklist.description")}
      actions={
        iaActive &&
        droits && (
          <Bouton variante="contour" taille="petite" onClick={onAnalyser}>
            <Sparkles /> {t("pieces.checklist.analyser")}
          </Bouton>
        )
      }
      sansMarge
    >
      <div className="space-y-2 p-4 pb-0">
        {!categorie && <Bandeau ton="info">{t("pieces.checklist.categorieInconnue")}</Bandeau>}
        {!iaActive && <Bandeau ton="info">{t("pieces.checklist.iaInactive")}</Bandeau>}
        <Bandeau ton={aCompleter ? "vigilance" : "succes"}>{aCompleter ? t("pieces.checklist.aCompleter", { n: aCompleter }) : t("pieces.checklist.toutEnRegle")}</Bandeau>
        {incoherences.map((i) => (
          <Bandeau key={i.documentId} ton="vigilance">
            {t("pieces.checklist.incoherence", { nom: i.nom, declare: libType(i.declare), detecte: libType(i.detecte) })}
          </Bandeau>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-border border-t border-border">{lignes.map(ligne)}</ul>
    </Carte>
  );
}
