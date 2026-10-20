"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bandeau, Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Ligne {
  id: string;
  raisonSociale: string;
  compteCourant: string | null;
  ville: string | null;
  segment: string | null;
  entite: { nom: string };
  secteur: { code: string; libelle: string } | null;
  _count: { dossiers: number };
}

export default function PageClients() {
  const { t, lib } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [qd, setQd] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setQd(q), 300);
    return () => clearTimeout(h);
  }, [q]);
  const { donnees, erreur } = useDonnees<{ total: number; lignes: Ligne[] }>(`/api/clients?taille=100&q=${encodeURIComponent(qd)}`);
  return (
    <div className="space-y-4">
      <EnTete titre={t("client.titreListe")} />
      <label className="flex h-9 max-w-md items-center gap-2 rounded-md border border-border bg-background px-3">
        <Search size={15} className="text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commun.rechercher")} className="w-full bg-transparent text-sm outline-none" aria-label={t("commun.rechercher")} />
      </label>
      {erreur && <Bandeau ton="alerte">{erreur.message}</Bandeau>}
      <Carte sansMarge>
        {!donnees ? (
          <div className="p-4"><Chargement /></div>
        ) : donnees.lignes.length === 0 ? (
          <Vide icone={<Users size={26} />} titre={t("client.aucunClient")} />
        ) : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("client.raisonSociale")}</Th>
                <Th>{t("client.compteCourant")}</Th>
                <Th>{t("client.codeActivite")}</Th>
                <Th>{t("client.ville")}</Th>
                <Th>{t("commun.entite")}</Th>
                <Th alignFin>{t("nav.dossiers")}</Th>
              </tr>
            </thead>
            <tbody>
              {donnees.lignes.map((c) => (
                <Tr key={c.id} onClick={() => router.push(`/clients/${c.id}`)}>
                  <Td className="font-medium">
                    <Link href={`/clients/${c.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{c.raisonSociale}</Link>
                  </Td>
                  <Td className="tabulaire text-muted-foreground"><span dir="ltr">{c.compteCourant ?? "—"}</span></Td>
                  <Td>{c.secteur ? `${c.secteur.code} — ${lib(c.secteur.libelle)}` : "—"}</Td>
                  <Td>{c.ville ?? "—"}</Td>
                  <Td className="text-muted-foreground">{c.entite.nom}</Td>
                  <Td alignFin>{c._count.dossiers}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
    </div>
  );
}
