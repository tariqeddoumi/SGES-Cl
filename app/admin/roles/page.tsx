"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { lireLibelle } from "@/lib/i18n/libelle";
import { GROUPES_PERMISSIONS, lirePermissions } from "@/lib/permissions";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampMultilingue } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Carte, Chargement, EnTete } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";

interface Role { id: string; code: string; libelle: string; permissions: string; systeme: boolean; _count: { utilisateurs: number } }

export default function PageRoles() {
  const { t, lib, peut } = useApp();
  const toast = useToast();
  const { donnees, recharger } = useDonnees<Role[]>("/api/admin/roles");
  const [matrice, setMatrice] = useState<Record<string, string[]>>({});
  const [nouveau, setNouveau] = useState<{ code: string; libelle: Record<string, string> } | null>(null);
  useEffect(() => { if (donnees) setMatrice(Object.fromEntries(donnees.map((r) => [r.id, lirePermissions(r.permissions)]))); }, [donnees]);
  if (!donnees) return <Chargement lignes={8} />;
  const modifies = donnees.filter((r) => JSON.stringify([...(matrice[r.id] ?? [])].sort()) !== JSON.stringify(lirePermissions(r.permissions).sort()));
  const basculer = (roleId: string, p: string) => setMatrice((m) => ({ ...m, [roleId]: m[roleId]?.includes(p) ? m[roleId].filter((x) => x !== p) : [...(m[roleId] ?? []), p] }));
  const enregistrer = async () => {
    try {
      for (const r of modifies) await api(`/api/admin/roles/${r.id}`, { method: "PATCH", body: { permissions: matrice[r.id] } });
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) { toast((e as Error).message, "erreur"); }
  };
  const creer = async () => {
    if (!nouveau) return;
    try { await api("/api/admin/roles", { body: { ...nouveau, permissions: ["dossier:lire"] } }); setNouveau(null); await recharger(); } catch (e) { toast((e as Error).message, "erreur"); }
  };
  const editable = peut("admin:parametres");
  return (
    <div className="space-y-4">
      <EnTete titre={t("admin.roles")} description={t("admin.rolesDesc")} retour={{ href: "/admin", libelle: t("admin.titre") }} actions={editable && <Bouton variante="contour" onClick={() => setNouveau({ code: "", libelle: {} })}><Plus /> {t("commun.ajouter")}</Bouton>} />
      <Carte sansMarge>
        <div className="defilement-x overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="sticky start-0 z-10 bg-surface px-3 py-2 text-start text-[11px] uppercase text-muted-foreground">{t("admin.permissions")}</th>
                {donnees.map((r) => (
                  <th key={r.id} className="min-w-[110px] bg-surface px-2 py-2 text-center align-bottom text-[11.5px] font-semibold">
                    {lib(r.libelle)}
                    <span className="block font-normal text-muted-foreground">{r._count.utilisateurs}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPES_PERMISSIONS.map((g) => (
                <Fragment key={g.groupe}>
                  <tr><td colSpan={donnees.length + 1} className="border-t border-border bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(({ dossiers: "nav.groupeDossiers", suivi: "nav.groupeSuivi", pilotage: "nav.groupePilotage", administration: "admin.titre" } as Record<string, string>)[g.groupe] ?? g.groupe)}</td></tr>
                  {g.permissions.map((p) => (
                    <tr key={p} className="hover:bg-surface/70">
                      <td className="sticky start-0 border-t border-border bg-card px-3 py-1.5 font-mono text-[11.5px]" dir="ltr">{p}</td>
                      {donnees.map((r) => (
                        <td key={r.id} className="border-t border-border text-center">
                          <input type="checkbox" aria-label={`${lib(r.libelle)} — ${p}`} disabled={!editable} checked={matrice[r.id]?.includes(p) ?? false} onChange={() => basculer(r.id, p)} className="h-4 w-4 accent-[var(--primary)]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
      {editable && (
        <div className="flex items-center justify-end gap-3">
          {modifies.length > 0 && <Puce ton="vigilance">{t("commun.modificationsNonEnregistrees")}</Puce>}
          <Bouton onClick={enregistrer} disabled={!modifies.length}>{t("commun.enregistrer")}</Bouton>
        </div>
      )}
      <Dialogue ouvert={!!nouveau} onFermer={() => setNouveau(null)} titre={t("admin.nouvelle")} pied={<><Bouton variante="contour" onClick={() => setNouveau(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={creer}>{t("commun.creer")}</Bouton></>}>
        {nouveau && (
          <div className="space-y-3">
            <Champ id="code" libelle={t("commun.code")} valeur={nouveau.code} onChange={(v) => setNouveau({ ...nouveau, code: v.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} dir="ltr" obligatoire />
            <ChampMultilingue id="lib" libelle={t("commun.libelle")} valeur={lireLibelle(nouveau.libelle)} onChange={(v) => setNouveau({ ...nouveau, libelle: v })} obligatoire />
          </div>
        )}
      </Dialogue>
    </div>
  );
}
