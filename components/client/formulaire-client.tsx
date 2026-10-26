"use client";

import { useApp } from "@/components/providers/application";
import { Champ, Selecteur, ZoneTexte } from "@/components/ui/champs";
import type { Referentiels } from "@/lib/client/referentiels";
import { useLibelles, useListe } from "@/lib/client/listes";

export interface ValeursClient {
  entiteId: string;
  compteCourant: string;
  codeClient: string;
  raisonSociale: string;
  formeJuridique: string;
  comptePortefeuille: string;
  identifiantFiscal: string;
  registreCommerce: string;
  ice: string;
  secteurId: string;
  segment: string;
  pays: string;
  ville: string;
  adresse: string;
  contactNom: string;
  contactPoste: string;
  contactTelephone: string;
  contactEmail: string;
  sourceSignaletique: string;
}

export function clientVide(entiteId = ""): ValeursClient {
  return {
    entiteId, compteCourant: "", codeClient: "", raisonSociale: "", formeJuridique: "", comptePortefeuille: "", identifiantFiscal: "",
    registreCommerce: "", ice: "", secteurId: "", segment: "", pays: "MA", ville: "", adresse: "", contactNom: "", contactPoste: "",
    contactTelephone: "", contactEmail: "", sourceSignaletique: "saisie",
  };
}

export function clientDepuis(c: Record<string, unknown>): ValeursClient {
  const v = clientVide();
  for (const k of Object.keys(v) as (keyof ValeursClient)[]) {
    const x = c[k];
    if (x !== null && x !== undefined) v[k] = String(x);
  }
  return v;
}

export function clientVersApi(v: ValeursClient) {
  const o: Record<string, string | null> = {};
  for (const [k, x] of Object.entries(v)) o[k] = x.trim() === "" ? null : x.trim();
  if (!o.entiteId) delete o.entiteId;
  return o;
}

export function FormulaireClient({
  valeurs,
  onChange,
  referentiels,
  provenance,
  desactive,
}: {
  valeurs: ValeursClient;
  onChange: (v: ValeursClient) => void;
  referentiels: Referentiels;
  /** Champs repris du système central (affichés avec leur provenance). */
  provenance?: string;
  desactive?: boolean;
}) {
  const { t, lib } = useApp();
  const villes = useLibelles("ville");
  const pays = useListe("pays");
  const maj = (k: keyof ValeursClient, v: string) => onChange({ ...valeurs, [k]: v });
  const opt = (liste: string) => (referentiels.listes[liste] ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle) }));
  const entites = referentiels.entites.filter((e) => e.ecriture).map((e) => ({ valeur: e.id, libelle: `${"· ".repeat(e.niveau)}${e.nom}` }));
  const p = valeurs.sourceSignaletique !== "saisie" ? provenance : undefined;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Champ id="cc" libelle={t("client.compteCourant")} valeur={valeurs.compteCourant} onChange={(v) => maj("compteCourant", v.replace(/\D/g, "").slice(0, 20))} dir="ltr" desactive={desactive} aide={valeurs.compteCourant && valeurs.compteCourant.length !== 20 ? t("client.compteInvalide") : undefined} />
      <Champ id="rs" libelle={t("client.raisonSociale")} valeur={valeurs.raisonSociale} onChange={(v) => maj("raisonSociale", v)} obligatoire provenance={p} desactive={desactive} />
      <Selecteur id="fj" libelle={t("client.formeJuridique")} valeur={valeurs.formeJuridique} onChange={(v) => maj("formeJuridique", v)} options={opt("forme_juridique")} provenance={p} desactive={desactive} />
      <Champ id="ptf" libelle={t("client.comptePortefeuille")} valeur={valeurs.comptePortefeuille} onChange={(v) => maj("comptePortefeuille", v)} provenance={p} desactive={desactive} />
      <Selecteur id="sect" libelle={t("client.codeActivite")} valeur={valeurs.secteurId} onChange={(v) => maj("secteurId", v)} options={referentiels.secteurs.map((s) => ({ valeur: s.id, libelle: `${s.code} — ${lib(s.libelle)}` }))} provenance={p} desactive={desactive} />
      <Selecteur id="seg" libelle={t("client.segment")} valeur={valeurs.segment} onChange={(v) => maj("segment", v)} options={opt("segment")} desactive={desactive} />
      <Champ id="code" libelle={t("client.codeClient")} valeur={valeurs.codeClient} onChange={(v) => maj("codeClient", v)} provenance={p} desactive={desactive} />
      <Champ id="ice" libelle={t("client.ice")} valeur={valeurs.ice} onChange={(v) => maj("ice", v)} dir="ltr" desactive={desactive} />
      <Champ id="if" libelle={t("client.identifiantFiscal")} valeur={valeurs.identifiantFiscal} onChange={(v) => maj("identifiantFiscal", v)} dir="ltr" desactive={desactive} />
      <Champ id="rc" libelle={t("client.registreCommerce")} valeur={valeurs.registreCommerce} onChange={(v) => maj("registreCommerce", v)} dir="ltr" desactive={desactive} />
      <Champ id="ville" suggestions={villes} libelle={t("client.ville")} valeur={valeurs.ville} onChange={(v) => maj("ville", v)} desactive={desactive} />
      <Selecteur id="pays" libelle={t("client.pays")} valeur={valeurs.pays} onChange={(v) => maj("pays", v)} options={pays.map((p) => ({ valeur: p.code, libelle: p.libelle }))} desactive={desactive} />
      <ZoneTexte id="adr" libelle={t("client.adresse")} valeur={valeurs.adresse} onChange={(v) => maj("adresse", v)} lignes={2} className="md:col-span-2" desactive={desactive} />
      <Champ id="cn" libelle={t("client.contact")} valeur={valeurs.contactNom} onChange={(v) => maj("contactNom", v)} desactive={desactive} />
      <Champ id="cp" libelle={t("client.contactPoste")} valeur={valeurs.contactPoste} onChange={(v) => maj("contactPoste", v)} desactive={desactive} />
      <Champ id="ct" type="tel" libelle={t("client.contactTelephone")} valeur={valeurs.contactTelephone} onChange={(v) => maj("contactTelephone", v)} dir="ltr" desactive={desactive} />
      <Champ id="ce" type="email" libelle={t("client.contactEmail")} valeur={valeurs.contactEmail} onChange={(v) => maj("contactEmail", v)} dir="ltr" desactive={desactive} />
      {entites.length > 1 && (
        <Selecteur id="ent" libelle={t("commun.entite")} valeur={valeurs.entiteId} onChange={(v) => maj("entiteId", v)} options={entites} className="md:col-span-2" desactive={desactive} />
      )}
    </div>
  );
}
