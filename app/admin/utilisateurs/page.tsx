"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Search } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Interrupteur, Selecteur } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, EnTete } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";
import { useLibelles } from "@/lib/client/listes";

interface U {
  id: string; email: string; nom: string; prenom: string; matricule: string | null; fonction: string | null; telephone: string | null; roleId: string; entiteId: string | null;
  porteeEcriture: string; langue: string; isActive: boolean; doitChangerMdp: boolean; derniereConnexion: string | null; verrouilleJusqua: string | null;
  role: { code: string; libelle: string }; entite: { nom: string } | null;
}

const vide = { id: "", email: "", nom: "", prenom: "", matricule: "", fonction: "", telephone: "", roleId: "", entiteId: "", porteeEcriture: "entite", langue: "fr", isActive: true };

export default function PageUtilisateurs() {
  const { t, lib, fmt, langues } = useApp();
  const fonctions = useLibelles("fonction_banque");
  const toast = useToast();
  const ref = useReferentiels();
  const { donnees, recharger } = useDonnees<U[]>("/api/admin/utilisateurs");
  const { donnees: roles } = useDonnees<{ id: string; code: string; libelle: string }[]>("/api/admin/roles");
  const [u, setU] = useState<typeof vide | null>(null);
  const [mdp, setMdp] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [erreur, setErreur] = useState("");
  const lignes = useMemo(() => (donnees ?? []).filter((x) => !q || `${x.prenom} ${x.nom} ${x.email} ${x.matricule}`.toLowerCase().includes(q.toLowerCase())), [donnees, q]);

  const enregistrer = async () => {
    if (!u) return;
    setErreur("");
    const corps = { email: u.email, nom: u.nom, prenom: u.prenom, matricule: u.matricule, fonction: u.fonction, telephone: u.telephone, roleId: u.roleId, entiteId: u.entiteId || null, porteeEcriture: u.porteeEcriture, langue: u.langue, isActive: u.isActive };
    try {
      if (u.id) await api(`/api/admin/utilisateurs/${u.id}`, { method: "PATCH", body: corps });
      else {
        const r = await api<{ motDePasseProvisoire: string }>("/api/admin/utilisateurs", { body: corps });
        setMdp(r.motDePasseProvisoire);
      }
      setU(null);
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  };
  const reinitialiser = async (x: U) => {
    if (!confirm(t("admin.reinitialiserMdp") + " ?")) return;
    const r = await api<{ motDePasseProvisoire: string }>(`/api/admin/utilisateurs/${x.id}/mot-de-passe`, { method: "POST" });
    setMdp(r.motDePasseProvisoire);
  };
  if (!donnees || !roles || !ref) return <Chargement lignes={8} />;
  return (
    <div className="space-y-4">
      <EnTete titre={t("admin.utilisateurs")} description={t("admin.utilisateursDesc")} retour={{ href: "/admin", libelle: t("admin.titre") }} actions={<Bouton onClick={() => { setErreur(""); setU({ ...vide, roleId: roles[0]?.id ?? "" }); }}><Plus /> {t("commun.ajouter")}</Bouton>} />
      {mdp && (
        <Bandeau ton="vigilance" titre={t("admin.mdpProvisoire")} actions={<Bouton variante="contour" taille="petite" onClick={() => setMdp(null)}>{t("commun.fermer")}</Bouton>}>
          <code className="select-all rounded bg-card px-2 py-1 font-mono text-[15px]" dir="ltr">{mdp}</code>
        </Bandeau>
      )}
      <label className="flex h-9 max-w-md items-center gap-2 rounded-md border border-border bg-background px-3">
        <Search size={15} className="text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commun.rechercher")} className="w-full bg-transparent text-sm outline-none" aria-label={t("commun.rechercher")} />
      </label>
      <Carte sansMarge>
        <Tableau>
          <thead><tr><Th>{t("audit.utilisateur")}</Th><Th>{t("profil.role")}</Th><Th>{t("commun.entite")}</Th><Th>{t("admin.porteeEcriture")}</Th><Th>{t("commun.statut")}</Th><Th /></tr></thead>
          <tbody>
            {lignes.map((x) => (
              <Tr key={x.id} className={x.isActive ? undefined : "opacity-50"}>
                <Td><span className="block font-medium">{x.prenom} {x.nom}</span><span className="text-[11.5px] text-muted-foreground" dir="ltr">{x.email}{x.matricule ? ` · ${x.matricule}` : ""}</span></Td>
                <Td>{lib(x.role.libelle)}</Td>
                <Td>{x.entite?.nom ?? <span className="text-muted-foreground">{t("admin.sansEntite")}</span>}</Td>
                <Td className="text-muted-foreground">{x.porteeEcriture === "groupe" ? t("admin.porteeGroupe") : t("admin.porteeEntite")}</Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {x.isActive ? <Puce ton="favorable">{t("commun.actif")}</Puce> : <Puce>{t("commun.inactif")}</Puce>}
                    {x.doitChangerMdp && <Puce ton="vigilance">{t("admin.mdpAChanger")}</Puce>}
                  </span>
                  {x.derniereConnexion && <span className="text-[11px] text-muted-foreground">{fmt.dateHeure(x.derniereConnexion)}</span>}
                </Td>
                <Td alignFin>
                  <span className="inline-flex gap-1">
                    <Bouton variante="fantome" taille="iconePetite" title={t("admin.reinitialiserMdp")} aria-label={t("admin.reinitialiserMdp")} onClick={() => reinitialiser(x)}><KeyRound /></Bouton>
                    <Bouton variante="fantome" taille="iconePetite" aria-label={t("commun.modifier")} onClick={() => { setErreur(""); setU({ ...vide, ...x, matricule: x.matricule ?? "", fonction: x.fonction ?? "", telephone: x.telephone ?? "", entiteId: x.entiteId ?? "" }); }}><Pencil /></Bouton>
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Tableau>
      </Carte>
      <Dialogue ouvert={!!u} onFermer={() => setU(null)} titre={u?.id ? t("admin.edition") : t("admin.nouvelle")} large pied={<><Bouton variante="contour" onClick={() => setU(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={enregistrer}>{t("commun.enregistrer")}</Bouton></>}>
        {u && (
          <div className="grid gap-3 md:grid-cols-2">
            {erreur && <Bandeau ton="alerte" className="md:col-span-2">{erreur}</Bandeau>}
            <Champ id="prenom" libelle={t("admin.prenom")} valeur={u.prenom} onChange={(v) => setU({ ...u, prenom: v })} obligatoire />
            <Champ id="nom" libelle={t("admin.nom")} valeur={u.nom} onChange={(v) => setU({ ...u, nom: v })} obligatoire />
            <Champ id="email" type="email" libelle={t("auth.email")} valeur={u.email} onChange={(v) => setU({ ...u, email: v })} obligatoire dir="ltr" />
            <Champ id="matricule" libelle={t("dossier.matricule")} valeur={u.matricule} onChange={(v) => setU({ ...u, matricule: v })} />
            <Champ id="fonction" suggestions={fonctions} libelle={t("client.contactPoste")} valeur={u.fonction} onChange={(v) => setU({ ...u, fonction: v })} />
            <Champ id="tel" libelle={t("client.contactTelephone")} valeur={u.telephone} onChange={(v) => setU({ ...u, telephone: v })} dir="ltr" />
            <Selecteur id="role" libelle={t("profil.role")} valeur={u.roleId} onChange={(v) => setU({ ...u, roleId: v })} options={roles.map((r) => ({ valeur: r.id, libelle: lib(r.libelle) }))} sansVide />
            <Selecteur id="entite" libelle={t("commun.entite")} valeur={u.entiteId} onChange={(v) => setU({ ...u, entiteId: v })} options={ref.entites.map((e) => ({ valeur: e.id, libelle: `${"· ".repeat(e.niveau)}${e.nom}` }))} aide={!u.entiteId ? t("admin.sansEntite") : undefined} />
            <Selecteur id="portee" libelle={t("admin.porteeEcriture")} valeur={u.porteeEcriture} onChange={(v) => setU({ ...u, porteeEcriture: v })} options={[{ valeur: "entite", libelle: t("admin.porteeEntite") }, { valeur: "groupe", libelle: t("admin.porteeGroupe") }]} sansVide />
            <Selecteur id="langue" libelle={t("commun.langue")} valeur={u.langue} onChange={(v) => setU({ ...u, langue: v })} options={langues.map((l) => ({ valeur: l.code, libelle: l.nomNatif }))} sansVide />
            <div className="pt-2"><Interrupteur id="actif" libelle={t("commun.actif")} valeur={u.isActive} onChange={(v) => setU({ ...u, isActive: v })} /></div>
          </div>
        )}
      </Dialogue>
    </div>
  );
}
