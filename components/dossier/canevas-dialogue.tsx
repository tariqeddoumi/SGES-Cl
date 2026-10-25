"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { api } from "@/lib/client/api";
import { definition, type Checklist } from "@/lib/domaine/pieces";
import { LANGUES_RTL } from "@/lib/i18n";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ZoneTexte } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";
import { useDossier } from "./contexte";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Canevas à remplir avec le client lorsqu'une pièce n'est pas disponible : mêmes informations
 * que celles contrôlées dans la pièce. Enregistré, il alimente la check-list et l'assistant IA.
 */
export function CanevasDialogue({ piece, titre, initial, onFermer, onEnregistre }: { piece: string; titre: string; initial: Record<string, string>; onFermer: () => void; onEnregistre: (c: Checklist) => void }) {
  const { t, langue } = useApp();
  const dir = LANGUES_RTL.has(langue) ? "rtl" : "ltr";
  const { dossier, recharger } = useDossier();
  const toast = useToast();
  const def = definition(piece)!;
  const [valeurs, setValeurs] = useState<Record<string, string>>(initial);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      const c = await api<Checklist>(`/api/dossiers/${dossier.id}/canevas`, { method: "PUT", body: { piece, reponses: valeurs } });
      toast(t("pieces.canevas.enregistre"));
      onEnregistre(c);
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  /** Version papier (vierge ou remplie) à faire compléter lors d'un entretien avec le client. */
  const imprimer = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const lignes = def.champs
      .map((ch) => `<div class="q"><p>${esc(t(`pieces.champs.${ch.code}`))}${ch.obligatoire ? "" : ` <i>(${esc(t("pieces.canevas.facultatif"))})</i>`}</p><div class="r">${esc(valeurs[ch.code] ?? "")}</div></div>`)
      .join("");
    w.document.write(
      `<!doctype html><html lang="${langue}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(titre)}</title><style>body{font:13px Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px}p.m{color:#555}.q{margin:14px 0;break-inside:avoid}.q p{margin:0 0 4px;font-weight:600}.r{min-height:54px;border:1px solid #999;border-radius:4px;padding:6px;white-space:pre-wrap}</style></head><body><h1>${esc(titre)}</h1><p class="m">${esc(dossier.client.raisonSociale)} · ${esc(dossier.reference)}</p>${lignes}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Dialogue
      ouvert
      large
      onFermer={onFermer}
      titre={titre}
      description={t("pieces.canevas.intro")}
      pied={
        <>
          <Bouton variante="contour" onClick={imprimer}>
            <Printer /> {t("pieces.canevas.imprimer")}
          </Bouton>
          <Bouton variante="contour" onClick={onFermer}>
            {t("commun.annuler")}
          </Bouton>
          <Bouton onClick={enregistrer} disabled={enCours}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        </>
      }
    >
      {erreur && <Bandeau ton="alerte" className="mb-3">{erreur}</Bandeau>}
      <div className="space-y-3">
        {def.champs.map((ch) => {
          const id = `cv-${ch.code}`;
          const lib = `${t(`pieces.champs.${ch.code}`)}${ch.obligatoire ? "" : ` (${t("pieces.canevas.facultatif")})`}`;
          const maj = (v: string) => setValeurs((x) => ({ ...x, [ch.code]: v }));
          return ch.saisie === "texte" ? (
            <ZoneTexte key={ch.code} id={id} libelle={lib} valeur={valeurs[ch.code]} onChange={maj} lignes={2} />
          ) : (
            <Champ key={ch.code} id={id} libelle={lib} valeur={valeurs[ch.code] ?? ""} onChange={maj} type={ch.saisie === "date" ? "date" : "text"} />
          );
        })}
      </div>
    </Dialogue>
  );
}
