"use client";

import { useRef, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Selecteur } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, Sablier, Vide } from "@/components/ui/mise-en-page";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";
import { useDossier } from "./contexte";

interface Piece {
  id: string;
  type: string;
  nom: string;
  mime: string;
  taille: number;
  createdAt: string;
}

export function VoletPieces() {
  const { t, lib, fmt } = useApp();
  const { dossier, droits, recharger } = useDossier();
  const ref = useReferentiels();
  const toast = useToast();
  const { donnees, recharger: rechargerPieces } = useDonnees<Piece[]>(`/api/dossiers/${dossier.id}/documents`);
  const [type, setType] = useState(dossier.categorie === "A" ? "EIES" : "AUTRE");
  const [enCours, setEnCours] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const deposer = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast(t("pieces.tropGros"), "erreur");
    setEnCours(true);
    const fd = new FormData();
    fd.append("fichier", f);
    fd.append("type", type);
    try {
      await api(`/api/dossiers/${dossier.id}/documents`, { formData: fd });
      toast(t("commun.enregistre"));
      await Promise.all([rechargerPieces(), recharger()]);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "erreur");
    } finally {
      setEnCours(false);
      if (input.current) input.current.value = "";
    }
  };
  const supprimer = async (id: string) => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    await api(`/api/dossiers/${dossier.id}/documents/${id}`, { method: "DELETE" });
    await Promise.all([rechargerPieces(), recharger()]);
  };
  const libType = (code: string) => lib(ref?.listes.type_document?.find((x) => x.code === code)?.libelle) || code;

  return (
    <div className="space-y-4">
      {dossier.eieRequise && !(donnees ?? []).some((p) => p.type === "EIES") && <Bandeau ton="vigilance">{t("dossier.blocage_eie")}</Bandeau>}
      <Carte titre={t("pieces.titre")} description={t("pieces.description")} sansMarge>
        {droits.pieces && (
          <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
            <Selecteur id="type-piece" className="min-w-[260px]" libelle={t("pieces.typePiece")} valeur={type} onChange={setType} options={(ref?.listes.type_document ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle) }))} sansVide />
            <input ref={input} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.doc,.xls,.txt" onChange={(e) => e.target.files?.[0] && deposer(e.target.files[0])} />
            <Bouton onClick={() => input.current?.click()} disabled={enCours}>
              {enCours ? <Sablier /> : <Upload />} {t("pieces.deposer")}
            </Bouton>
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
                  <Td className="max-w-[320px] truncate">{p.nom}</Td>
                  <Td alignFin>{fmt.nombre(p.taille / 1024, 0)} Ko</Td>
                  <Td>{fmt.dateHeure(p.createdAt)}</Td>
                  <Td alignFin>
                    <span className="inline-flex gap-1">
                      <Bouton variante="fantome" taille="iconePetite" asChild>
                        <a href={`/api/dossiers/${dossier.id}/documents/${p.id}`} aria-label={t("commun.telecharger")}>
                          <Download />
                        </a>
                      </Bouton>
                      {droits.pieces && (
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
    </div>
  );
}
