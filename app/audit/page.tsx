"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Ligne { id: string; date: string; utilisateurNom: string | null; action: string; objet: string; objetId: string | null; details: string | null; ip: string | null }

export default function PageAudit() {
  const { t, fmt } = useApp();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { donnees } = useDonnees<{ total: number; lignes: Ligne[] }>(`/api/audit?page=${page}&q=${encodeURIComponent(q)}`);
  return (
    <div className="space-y-4">
      <EnTete titre={t("audit.titre")} description={t("audit.description")} />
      <label className="flex h-9 max-w-md items-center gap-2 rounded-md border border-border bg-background px-3">
        <Search size={15} className="text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("commun.rechercher")} className="w-full bg-transparent text-sm outline-none" aria-label={t("commun.rechercher")} />
      </label>
      <Carte sansMarge>
        {!donnees ? <div className="p-4"><Chargement /></div> : donnees.lignes.length === 0 ? <Vide titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead><tr><Th>{t("commun.date")}</Th><Th>{t("audit.utilisateur")}</Th><Th>{t("audit.action")}</Th><Th>{t("audit.objet")}</Th><Th>{t("commun.details")}</Th><Th>{t("audit.ip")}</Th></tr></thead>
            <tbody>
              {donnees.lignes.map((l) => (
                <Tr key={l.id}>
                  <Td className="whitespace-nowrap">{fmt.dateHeure(l.date)}</Td>
                  <Td>{l.utilisateurNom}</Td>
                  <Td className="font-medium">{l.action}</Td>
                  <Td className="text-muted-foreground">{l.objet}</Td>
                  <Td className="max-w-[420px] truncate font-mono text-[11.5px] text-muted-foreground" dir="ltr">{l.details}</Td>
                  <Td className="text-muted-foreground" dir="ltr">{l.ip}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      {donnees && donnees.total > 100 && (
        <div className="flex justify-end gap-2">
          <Bouton variante="contour" taille="petite" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("commun.precedent")}</Bouton>
          <Bouton variante="contour" taille="petite" disabled={page * 100 >= donnees.total} onClick={() => setPage(page + 1)}>{t("commun.suivant")}</Bouton>
        </div>
      )}
    </div>
  );
}
