"use client";

import { useState } from "react";
import { Download, Paperclip, RotateCw, ScanText, Trash2, Upload } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Selecteur } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Sablier, Vide } from "@/components/ui/mise-en-page";
import type { Checklist } from "@/lib/domaine/pieces";
import { AssistantIA } from "./assistant-ia";
import { CanevasDialogue } from "./canevas-dialogue";
import { ChecklistPieces } from "./checklist-pieces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";
import { useDossier } from "./contexte";

interface Piece {
  id: string;
  type: string;
  nom: string;
  mime: string;
  taille: number;
  createdAt: string;
  origineTexte: string | null;
}

export function VoletPieces() {
  const { t, lib, fmt } = useApp();
  const { dossier, droits, recharger, documents } = useDossier();
  const ref = useReferentiels();
  const toast = useToast();
  // Les listes se rechargent après chaque dépôt ou lecture (documents.version).
  const { donnees, recharger: rechargerPieces } = useDonnees<Piece[]>(`/api/dossiers/${dossier.id}/documents?v=${documents.version}`);
  const [type, setType] = useState("AUTRE");
  const [relecture, setRelecture] = useState<string | null>(null);
  const { donnees: checklist, recharger: rechargerChecklist } = useDonnees<Checklist>(`/api/dossiers/${dossier.id}/checklist?v=${documents.version}`);
  const enCours = !!documents.enCours;
  const [canevas, setCanevas] = useState<string | null>(null);
  const [assistant, setAssistant] = useState(false);

  const relire = async (id: string) => {
    setRelecture(id);
    try {
      const r = await api<{ origineTexte: string | null; erreurOCR: string | null }>(`/api/dossiers/${dossier.id}/documents/${id}/lecture`, { body: {} });
      toast(r.erreurOCR ? t("ocr.erreurTranscription", { nom: "", message: r.erreurOCR }) : r.origineTexte ? t("commun.enregistre") : t("ocr.illisible"), r.erreurOCR ? "erreur" : undefined);
      await Promise.all([rechargerPieces(), rechargerChecklist(), recharger()]);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setRelecture(null);
    }
  };
  const supprimer = async (id: string) => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    await api(`/api/dossiers/${dossier.id}/documents/${id}`, { method: "DELETE" });
    await Promise.all([rechargerPieces(), rechargerChecklist(), recharger()]);
  };
  const libType = (code: string) => lib(ref?.listes.type_document?.find((x) => x.code === code)?.libelle) || code;

  return (
    <div className="space-y-4">
      {dossier.eieRequise && !(donnees ?? []).some((p) => p.type === "EIES") && <Bandeau ton="vigilance">{t("dossier.blocage_eie")}</Bandeau>}
      {checklist && (
        <ChecklistPieces
          checklist={checklist}
          categorie={dossier.categorie}
          droits={droits.pieces}
          iaActive={documents.ocrActif}
          libType={libType}
          onDeposer={(code) => documents.deposer(code)}
          onCanevas={setCanevas}
          onAnalyser={() => (documents.aLire.length ? documents.lire() : setAssistant(true))}
        />
      )}
      <Carte titre={t("pieces.titre")} description={t("pieces.description")} sansMarge>
        {droits.pieces && (
          <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
            <Selecteur id="type-piece" className="min-w-[260px]" libelle={t("pieces.typePiece")} valeur={type} onChange={setType} options={(ref?.listes.type_document ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle) }))} sansVide />
            <Bouton onClick={() => documents.deposer(type)} disabled={enCours}>
              {enCours ? <Sablier /> : <Upload />} {t("pieces.deposer")}
            </Bouton>
            <p className="basis-full text-[12px] text-muted-foreground">{documents.ocrActif ? t("ocr.aideDepot") : t("ocr.aideDepotSansOCR")}</p>
          </div>
        )}
        {!donnees ? (
          <div className="p-4">
            <Chargement />
          </div>
        ) : donnees.length === 0 ? (
          <Vide icone={<Paperclip size={26} />} titre={t("pieces.aucune")} />
        ) : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("pieces.typePiece")}</Th>
                <Th>{t("pieces.fichier")}</Th>
                <Th alignFin>{t("pieces.taille")}</Th>
                <Th>{t("pieces.deposeLe")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {donnees.map((p) => (
                <Tr key={p.id}>
                  <Td>{libType(p.type)}</Td>
                  <Td className="max-w-[320px]">
                    <span className="block truncate">{p.nom}</span>
                    {p.origineTexte === "ocr" ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-primary">
                        <ScanText size={12} /> {t("ocr.transcrit")}
                      </span>
                    ) : (
                      !p.origineTexte && p.type !== "PHOTO" && <span className="block text-[11.5px] text-warning">{t("ocr.nonLu")}</span>
                    )}
                  </Td>
                  <Td alignFin>{fmt.nombre(p.taille / 1024, 0)} Ko</Td>
                  <Td>{fmt.dateHeure(p.createdAt)}</Td>
                  <Td alignFin>
                    <span className="inline-flex gap-1">
                      {documents.ocrActif && droits.pieces && /^(application\/pdf|image\/)/.test(p.mime) && (
                        <Bouton variante="fantome" taille="iconePetite" onClick={() => relire(p.id)} disabled={!!relecture || enCours} aria-label={t("ocr.relire")} title={t("ocr.relire")}>
                          {relecture === p.id ? <Sablier /> : <RotateCw />}
                        </Bouton>
                      )}
                      <Bouton variante="fantome" taille="iconePetite" asChild>
                        <a href={`/api/dossiers/${dossier.id}/documents/${p.id}`} aria-label={t("commun.telecharger")}>
                          <Download />
                        </a>
                      </Bouton>
                      {droits.pieces && droits.evaluation && (
                        <Bouton variante="fantome" taille="iconePetite" onClick={() => supprimer(p.id)} aria-label={t("commun.supprimer")}>
                          <Trash2 className="text-destructive" />
                        </Bouton>
                      )}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      {canevas && (
        <CanevasDialogue
          piece={canevas}
          titre={`${t("pieces.canevas.titre")} — ${libType(canevas)}`}
          initial={checklist?.lignes.find((l) => l.code === canevas)?.canevas?.reponses ?? {}}
          onFermer={() => setCanevas(null)}
          onEnregistre={() => {
            rechargerChecklist();
            rechargerPieces();
            setCanevas(null);
          }}
        />
      )}
      {assistant && (
        <AssistantIA
          onFermer={() => {
            setAssistant(false);
            rechargerChecklist();
            rechargerPieces();
          }}
        />
      )}
    </div>
  );
}
