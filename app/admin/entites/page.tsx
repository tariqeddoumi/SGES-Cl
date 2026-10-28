"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { oublierReferentiels } from "@/lib/client/referentiels";
import { TYPES_ENTITE } from "@/lib/domaine/constantes";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Interrupteur, Selecteur } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, EnTete } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { useListe } from "@/lib/client/listes";

interface Entite {
  id: string; code: string; nom: string; type: string; parentId: string | null; niveau: number; pays: string; deviseCode: string; langueDefaut: string;
  seuilDeclenchement: number | null; isActive: boolean; nomOutil: string | null; logoUrl: string | null; couleurPrimaire: string | null;
  utilisateurs?: number; clients?: number; dossiers?: number; enfants?: number; ecriture: boolean;
}

const vide = { id: "", code: "", nom: "", type: "agence", parentId: "", pays: "MA", deviseCode: "MAD", langueDefaut: "fr", seuilDeclenchement: "", isActive: true, nomOutil: "", logoUrl: "", couleurPrimaire: "" };

export default function PageEntites() {
  const { t, devises, langues, fmt } = useApp();
  const pays = useListe("pays");
  const toast = useToast();
  const { donnees, recharger } = useDonnees<Entite[]>("/api/admin/entites");
  const [e, setE] = useState<typeof vide | null>(null);
  const [erreur, setErreur] = useState("");
  const ouvrir = (x?: Entite) => {
    setErreur("");
    setE(x ? { ...vide, ...x, parentId: x.parentId ?? "", seuilDeclenchement: x.seuilDeclenchement?.toString() ?? "", nomOutil: x.nomOutil ?? "", logoUrl: x.logoUrl ?? "", couleurPrimaire: x.couleurPrimaire ?? "" } : { ...vide });
  };
  const enregistrer = async () => {
    if (!e) return;
    const corps = { code: e.code, nom: e.nom, type: e.type, parentId: e.parentId || null, pays: e.pays, deviseCode: e.deviseCode, langueDefaut: e.langueDefaut, seuilDeclenchement: e.seuilDeclenchement ? Number(e.seuilDeclenchement) : null, isActive: e.isActive, nomOutil: e.nomOutil, logoUrl: e.logoUrl, couleurPrimaire: e.couleurPrimaire };
    try {
      if (e.id) await api(`/api/admin/entites/${e.id}`, { method: "PATCH", body: corps });
      else await api("/api/admin/entites", { body: corps });
      oublierReferentiels();
      setE(null);
      toast(t("commun.enregistre"));
      await recharger();
    } catch (x) {
      setErreur((x as Error).message);
    }
  };
  const supprimer = async (x: Entite) => {
    if (!confirm(t("commun.confirmerSuppression"))) return;
    try { await api(`/api/admin/entites/${x.id}`, { method: "DELETE" }); await recharger(); } catch (z) { toast((z as Error).message, "erreur"); }
  };
  if (!donnees) return <Chargement lignes={8} />;
  return (
    <div className="space-y-4">
      <EnTete titre={t("admin.entites")} description={t("admin.entitesDesc")} retour={{ href: "/admin", libelle: t("admin.titre") }} actions={<Bouton onClick={() => ouvrir()}><Plus /> {t("commun.ajouter")}</Bouton>} />
      <Carte sansMarge>
        <ul className="divide-y divide-border">
          {donnees.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13px]" style={{ paddingInlineStart: 16 + x.niveau * 24 }}>
              <span className={`font-medium ${x.isActive ? "" : "line-through opacity-60"}`}>{x.nom}</span>
              <span className="text-[11.5px] text-muted-foreground" dir="ltr">{x.code}</span>
              <Puce>{x.type}</Puce>
              <span className="text-[12px] text-muted-foreground">{x.pays} · {x.deviseCode} · {x.langueDefaut}{x.seuilDeclenchement ? ` · ${fmt.compact(x.seuilDeclenchement, x.deviseCode)}` : ""}</span>
              <span className="ms-auto text-[12px] text-muted-foreground tabulaire">{x.utilisateurs ?? 0} / {x.clients ?? 0} / {x.dossiers ?? 0}</span>
              {x.ecriture && (
                <span className="flex gap-1">
                  <Bouton variante="fantome" taille="iconePetite" onClick={() => ouvrir(x)} aria-label={t("commun.modifier")}><Pencil /></Bouton>
                  <Bouton variante="fantome" taille="iconePetite" onClick={() => supprimer(x)} aria-label={t("commun.supprimer")}><Trash2 className="text-destructive" /></Bouton>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Carte>
      <Dialogue ouvert={!!e} onFermer={() => setE(null)} titre={e?.id ? t("admin.edition") : t("admin.nouvelle")} large pied={<><Bouton variante="contour" onClick={() => setE(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={enregistrer}>{t("commun.enregistrer")}</Bouton></>}>
        {e && (
          <div className="grid gap-3 md:grid-cols-2">
            {erreur && <Bandeau ton="alerte" className="md:col-span-2">{erreur}</Bandeau>}
            <Champ id="code" libelle={t("commun.code")} valeur={e.code} onChange={(v) => setE({ ...e, code: v })} obligatoire dir="ltr" />
            <Champ id="nom" libelle={t("commun.libelle")} valeur={e.nom} onChange={(v) => setE({ ...e, nom: v })} obligatoire />
            <Selecteur id="type" libelle={t("commun.type")} valeur={e.type} onChange={(v) => setE({ ...e, type: v })} options={TYPES_ENTITE.map((x) => ({ valeur: x, libelle: x }))} sansVide />
            <Selecteur id="parent" libelle={t("admin.parent")} valeur={e.parentId} onChange={(v) => setE({ ...e, parentId: v })} options={donnees.filter((x) => x.id !== e.id).map((x) => ({ valeur: x.id, libelle: `${"· ".repeat(x.niveau)}${x.nom}` }))} />
            <Selecteur id="pays" libelle={t("client.pays")} valeur={e.pays} onChange={(v) => setE({ ...e, pays: v })} options={pays.map((p) => ({ valeur: p.code, libelle: p.libelle }))} />
            <Selecteur id="devise" libelle={t("commun.devise")} valeur={e.deviseCode} onChange={(v) => setE({ ...e, deviseCode: v })} options={devises.map((d) => ({ valeur: d.code, libelle: d.code }))} sansVide />
            <Selecteur id="langue" libelle={t("commun.langue")} valeur={e.langueDefaut} onChange={(v) => setE({ ...e, langueDefaut: v })} options={langues.map((l) => ({ valeur: l.code, libelle: l.nomNatif }))} sansVide />
            <Champ id="seuil" type="number" libelle={t("admin.seuilPropre")} valeur={e.seuilDeclenchement} onChange={(v) => setE({ ...e, seuilDeclenchement: v })} suffixe={e.deviseCode} />
            <Champ id="nomOutil" libelle={t("admin.nomOutil")} valeur={e.nomOutil} onChange={(v) => setE({ ...e, nomOutil: v })} />
            <Champ id="logo" libelle={t("admin.logo")} valeur={e.logoUrl} onChange={(v) => setE({ ...e, logoUrl: v })} dir="ltr" />
            <Champ id="couleur" libelle={t("admin.couleur")} valeur={e.couleurPrimaire} onChange={(v) => setE({ ...e, couleurPrimaire: v })} placeholder="#1f6f5a" dir="ltr" />
            <div className="pt-6"><Interrupteur id="actif" libelle={t("commun.actif")} valeur={e.isActive} onChange={(v) => setE({ ...e, isActive: v })} /></div>
          </div>
        )}
      </Dialogue>
    </div>
  );
}
