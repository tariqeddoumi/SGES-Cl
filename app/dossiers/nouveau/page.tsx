"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Download, Search, UserPlus } from "lucide-react";
import { api } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Selecteur } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, EnTete, Sablier } from "@/components/ui/mise-en-page";
import { FormulaireClient, clientDepuis, clientVersApi, clientVide, type ValeursClient } from "@/components/client/formulaire-client";
import { FormulaireIdentification, valeursInitiales, versApi, type ValeursIdentification } from "@/components/dossier/formulaire-identification";

interface ClientResume {
  id: string;
  raisonSociale: string;
  compteCourant: string | null;
  secteurId: string | null;
  entite?: { nom: string };
}

function Contenu() {
  const { t, session, parametres, fmt, deviseReference } = useApp();
  const ref = useReferentiels();
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();

  const [mode, setMode] = useState<"recherche" | "nouveau">("recherche");
  const [client, setClient] = useState<ClientResume | null>(null);
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<ClientResume[]>([]);
  const [compte, setCompte] = useState("");
  const [nouveau, setNouveau] = useState<ValeursClient>(clientVide(session?.entiteId ?? ""));
  const [provenance, setProvenance] = useState<string>();
  const [info, setInfo] = useState("");
  const [valeurs, setValeurs] = useState<ValeursIdentification>(valeursInitiales(null, deviseReference));
  const [entiteId, setEntiteId] = useState(session?.entiteId ?? "");
  const [erreur, setErreur] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState(false);

  // Nouvelle évaluation pour un client connu (bouton « renouveler »).
  useEffect(() => {
    const id = params.get("client");
    if (!id) return;
    api<{ client: ClientResume }>(`/api/clients/${id}`).then((r) => {
      setClient(r.client);
      setValeurs((v) => ({ ...v, secteurId: r.client.secteurId ?? "" }));
    }).catch(() => undefined);
  }, [params]);

  useEffect(() => {
    if (!ref) return;
    const ecrivables = ref.entites.filter((e) => e.ecriture);
    if (!entiteId && ecrivables.length) setEntiteId(ecrivables[0].id);
    const e = ref.entites.find((x) => x.id === (entiteId || ecrivables[0]?.id));
    if (e) setValeurs((v) => (v.montantDemande ? v : { ...v, deviseCode: e.deviseCode }));
  }, [ref, entiteId]);

  useEffect(() => {
    if (mode !== "recherche" || recherche.trim().length < 2) {
      setResultats([]);
      return;
    }
    const h = setTimeout(() => {
      api<{ lignes: ClientResume[] }>(`/api/clients?taille=10&q=${encodeURIComponent(recherche)}`).then((r) => setResultats(r.lignes)).catch(() => undefined);
    }, 250);
    return () => clearTimeout(h);
  }, [recherche, mode]);

  const importer = async () => {
    setInfo("");
    setErreur("");
    try {
      const r = await api<{ existant: ClientResume | null; signaletique: (Record<string, unknown> & { source: string }) | null }>(`/api/signaletique/${compte}`);
      if (r.existant) {
        setClient(r.existant);
        setValeurs((v) => ({ ...v, secteurId: r.existant!.secteurId ?? v.secteurId }));
        return;
      }
      setMode("nouveau");
      if (r.signaletique) {
        setNouveau({ ...clientDepuis(r.signaletique), entiteId: nouveau.entiteId, sourceSignaletique: r.signaletique.source });
        // Le code d'activité importé sert aussi de secteur du projet (modifiable).
        const secteurImporte = r.signaletique.secteurId ? String(r.signaletique.secteurId) : "";
        if (secteurImporte) setValeurs((v) => ({ ...v, secteurId: v.secteurId || secteurImporte }));
        setProvenance(r.signaletique.source === "api" ? "Core banking" : "Simulation");
        setInfo(t("client.importeDepuis", { source: r.signaletique.source }));
      } else {
        setNouveau({ ...nouveau, compteCourant: compte });
        setInfo(t("client.introuvable"));
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const creer = async () => {
    setEnCours(true);
    setErreur("");
    const e: Record<string, string> = {};
    if (!valeurs.montantDemande) e.montantDemande = t("commun.obligatoire");
    if (!valeurs.typeCredit) e.typeCredit = t("commun.obligatoire");
    if (!valeurs.secteurId && !(mode === "nouveau" && nouveau.secteurId)) e.secteurId = t("commun.obligatoire");
    if (!valeurs.regionId) e.regionId = t("commun.obligatoire");
    setErreurs(e);
    if (Object.keys(e).length || (!client && !nouveau.raisonSociale.trim())) {
      setEnCours(false);
      setErreur(t("erreurs.validation"));
      return;
    }
    try {
      let clientId = client?.id;
      if (!clientId) {
        const c = await api<{ id: string }>("/api/clients", { body: { ...clientVersApi(nouveau), entiteId: nouveau.entiteId || entiteId || undefined, secteurId: nouveau.secteurId || valeurs.secteurId || null } });
        clientId = c.id;
      }
      const d = await api<{ id: string; reference: string }>("/api/dossiers", {
        body: { ...versApi(valeurs), secteurId: valeurs.secteurId || nouveau.secteurId || null, clientId, entiteId: entiteId || undefined, dossierPrecedentId: params.get("precedent") },
      });
      toast(t("dossier.dossierCree", { reference: d.reference }));
      router.push(`/dossiers/${d.id}?etape=exclusion`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : String(err));
      setEnCours(false);
    }
  };

  if (!ref) return <Chargement lignes={6} />;
  const ecrivables = ref.entites.filter((e) => e.ecriture);
  const seuil = Number(parametres.SEUIL_DECLENCHEMENT) || 10_000_000;

  return (
    <div className="space-y-5">
      <EnTete titre={t("dossier.nouveau")} description={t("dossier.descriptionListe")} retour={{ href: "/dossiers", libelle: t("nav.dossiers") }} />
      <Bandeau ton="info" titre={t("dossier.declenchementTitre")}>
        {t("dossier.motifCategorieA")} · {t("dossier.motifSeuil", { seuil: fmt.compact(seuil, deviseReference) })}
      </Bandeau>
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}

      <Carte titre={`1. ${t("dossier.client")}`}>
        {client ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted-foreground" />
              <div>
                <p className="font-semibold">{client.raisonSociale}</p>
                <p className="text-[12px] text-muted-foreground tabulaire" dir="ltr">
                  {client.compteCourant ?? "—"}
                </p>
              </div>
            </div>
            <Bouton variante="contour" taille="petite" onClick={() => setClient(null)}>
              {t("commun.modifier")}
            </Bouton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Champ id="compte" libelle={t("client.compteCourant")} valeur={compte} onChange={(v) => setCompte(v.replace(/\D/g, "").slice(0, 20))} aide={t("client.importerAide")} dir="ltr" />
              <div className="flex items-start pt-6">
                <Bouton variante="contour" onClick={importer} disabled={compte.length !== 20}>
                  <Download /> {t("client.importer")}
                </Bouton>
              </div>
            </div>
            {mode === "recherche" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <Search size={15} className="text-muted-foreground" />
                  <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("client.choisir")} className="w-full bg-transparent text-sm outline-none" />
                </label>
                {resultats.length > 0 && (
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {resultats.map((c) => (
                      <li key={c.id}>
                        <button
                          className="flex w-full items-center justify-between px-3 py-2 text-start text-[13px] hover:bg-accent"
                          onClick={() => {
                            setClient(c);
                            setValeurs((v) => ({ ...v, secteurId: c.secteurId ?? v.secteurId }));
                          }}
                        >
                          <span className="font-medium">{c.raisonSociale}</span>
                          <span className="text-muted-foreground tabulaire" dir="ltr">
                            {c.compteCourant}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Bouton variante="lien" onClick={() => setMode("nouveau")}>
                  <UserPlus /> {t("client.ouCreer")}
                </Bouton>
              </div>
            ) : (
              <div className="space-y-3">
                {info && <Bandeau ton="info">{info}</Bandeau>}
                <FormulaireClient valeurs={nouveau} onChange={setNouveau} referentiels={ref} provenance={provenance} />
                <Bouton variante="lien" onClick={() => setMode("recherche")}>
                  {t("client.choisir")}
                </Bouton>
              </div>
            )}
          </div>
        )}
      </Carte>

      <Carte titre={`2. ${t("etape.identification")}`}>
        {ecrivables.length > 1 && (
          <div className="mb-5 max-w-md">
            <Selecteur id="entite" libelle={t("dossier.entite")} valeur={entiteId} onChange={setEntiteId} options={ecrivables.map((e) => ({ valeur: e.id, libelle: `${"· ".repeat(e.niveau)}${e.nom}` }))} sansVide />
          </div>
        )}
        <FormulaireIdentification valeurs={valeurs} onChange={setValeurs} referentiels={ref} erreurs={erreurs} />
      </Carte>

      <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
        <Bouton variante="contour" onClick={() => router.push("/dossiers")}>
          {t("commun.annuler")}
        </Bouton>
        <Bouton onClick={creer} disabled={enCours}>
          {enCours && <Sablier />}
          {t("dossier.creerEtContinuer")}
        </Bouton>
      </div>
    </div>
  );
}

export default function PageNouveauDossier() {
  return (
    <Suspense>
      <Contenu />
    </Suspense>
  );
}
