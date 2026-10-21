"use client";

import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Selecteur } from "@/components/ui/champs";
import { Dialogue } from "@/components/ui/dialogue";
import { Bandeau, Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Cle { id: string; nom: string; prefixe: string; actif: boolean; derniereUtilisation: string | null; expireLe: string | null; createdAt: string; entite: { nom: string } | null }

const EXEMPLE = `curl -H "X-API-Key: sges_…" \\
  https://sges.banque.ma/api/v1/fiches/SGES-BCP-CA-CASA-2026-00001?langue=fr

{
  "evaluationDisponible": true,
  "evaluationObligatoire": true,
  "fiche": {
    "banque":   { "codeBanque", "entite", "chargeNom", "chargeMatricule", "date" },
    "client":   { "referenceProjet", "raisonSociale", "formeJuridique", "comptePortefeuille",
                  "compteCourant", "typeActivite", "codeActivite", "contact", "poste", "telephone", "email" },
    "lieu":     { "adresseSite", "localite", "region", "typeZone" },
    "description": { "processus", "natureProjet", "projetDeveloppementDurable", "montantDemande", "devise" },
    "conclusions": { "listeExclusion", "raisonsExclusion", "categorie", "sousCategorieFI", "niveauRisque" },
    "problematiques": [ { "libelle", "etat": "maitrise | non_maitrise | non_concerne", "risques" } ],
    "expositionNonMaitrisee": [ { "risque", "mesures" } ],
    "planActions": { "propose", "actions" },
    "climat": { "scoreClimat", "niveauClimat", "emissionsFinancees", "alignementTaxonomie" },
    "decisionComite": { "decision", "montantAccorde", "motifRejet", "commentaire" }
  }
}

GET /api/v1/fiches?compte=18278000012345678901&depuis=2026-01-01`;

export default function PageApi() {
  const { t, fmt } = useApp();
  const ref = useReferentiels();
  const { donnees, recharger } = useDonnees<Cle[]>("/api/admin/cles-api");
  const [nouvelle, setNouvelle] = useState<{ nom: string; entiteId: string; expireLe: string } | null>(null);
  const [cle, setCle] = useState<string | null>(null);
  const creer = async () => {
    if (!nouvelle) return;
    const r = await api<{ cle: string }>("/api/admin/cles-api", { body: { nom: nouvelle.nom, entiteId: nouvelle.entiteId || null, expireLe: nouvelle.expireLe || null } });
    setCle(r.cle);
    setNouvelle(null);
    await recharger();
  };
  const revoquer = async (id: string) => {
    if (!confirm(`${t("admin.revoquer")} ?`)) return;
    await api(`/api/admin/cles-api/${id}`, { method: "DELETE" });
    await recharger();
  };
  return (
    <div className="space-y-4">
      <EnTete titre={t("api.titre")} description={t("api.description")} retour={{ href: "/admin", libelle: t("admin.titre") }} actions={<Bouton onClick={() => setNouvelle({ nom: "", entiteId: "", expireLe: "" })}><Plus /> {t("admin.nouvelleCle")}</Bouton>} />
      {cle && (
        <Bandeau ton="vigilance" titre={t("admin.cleCreee")} actions={<Bouton variante="contour" taille="petite" onClick={() => setCle(null)}>{t("commun.fermer")}</Bouton>}>
          <code className="select-all break-all rounded bg-card px-2 py-1 font-mono text-[13px]" dir="ltr">{cle}</code>
        </Bandeau>
      )}
      <Carte sansMarge>
        {!donnees ? <div className="p-4"><Chargement /></div> : donnees.length === 0 ? <Vide icone={<KeyRound size={26} />} titre={t("commun.aucuneDonnee")} /> : (
          <Tableau>
            <thead><tr><Th>{t("commun.libelle")}</Th><Th>{t("commun.code")}</Th><Th>{t("commun.entite")}</Th><Th>{t("admin.derniereUtilisation")}</Th><Th>{t("commun.statut")}</Th><Th /></tr></thead>
            <tbody>
              {donnees.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.nom}</Td>
                  <Td className="font-mono text-[12px]" dir="ltr">{c.prefixe}…</Td>
                  <Td>{c.entite?.nom ?? "—"}</Td>
                  <Td>{fmt.dateHeure(c.derniereUtilisation) || "—"}</Td>
                  <Td>{c.actif ? <Puce ton="favorable">{t("commun.actif")}</Puce> : <Puce>{t("commun.inactif")}</Puce>}</Td>
                  <Td alignFin>{c.actif && <Bouton variante="contour" taille="petite" onClick={() => revoquer(c.id)}>{t("admin.revoquer")}</Bouton>}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      <Carte titre="API v1" description={t("api.authentification")}>
        <pre className="overflow-x-auto rounded-md bg-sidebar p-4 font-mono text-[12px] leading-relaxed text-sidebar-foreground" dir="ltr">{EXEMPLE}</pre>
      </Carte>
      <Dialogue ouvert={!!nouvelle} onFermer={() => setNouvelle(null)} titre={t("admin.nouvelleCle")} pied={<><Bouton variante="contour" onClick={() => setNouvelle(null)}>{t("commun.annuler")}</Bouton><Bouton onClick={creer} disabled={!nouvelle?.nom}>{t("commun.creer")}</Bouton></>}>
        {nouvelle && (
          <div className="space-y-3">
            <Champ id="nom" libelle={t("commun.libelle")} valeur={nouvelle.nom} onChange={(v) => setNouvelle({ ...nouvelle, nom: v })} obligatoire placeholder="Plateforme d'octroi — production" />
            <Selecteur id="entite" libelle={t("commun.entite")} valeur={nouvelle.entiteId} onChange={(v) => setNouvelle({ ...nouvelle, entiteId: v })} options={(ref?.entites ?? []).map((e) => ({ valeur: e.id, libelle: `${"· ".repeat(e.niveau)}${e.nom}` }))} />
            <Champ id="exp" type="date" libelle={t("commun.au")} valeur={nouvelle.expireLe} onChange={(v) => setNouvelle({ ...nouvelle, expireLe: v })} />
          </div>
        )}
      </Dialogue>
    </div>
  );
}
