"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte, Chargement, Ligne, Sablier } from "@/components/ui/mise-en-page";
import { FormulaireIdentification, valeursInitiales, versApi, type ValeursIdentification } from "./formulaire-identification";
import { useDossier } from "./contexte";
import { BarreVolet } from "./barre-volet";
import { BandeauDocuments, PropositionOCR } from "./sources";
import { aExaminer, SOURCES_IDENTIFICATION } from "@/lib/domaine/sources";

export function VoletIdentification() {
  const { t, fmt, lib, deviseReference } = useApp();
  const { dossier: d, droits, recharger, seuil, prefill, consommer, documents } = useDossier();
  const ref = useReferentiels();
  const toast = useToast();
  const [valeurs, setValeurs] = useState<ValeursIdentification>(valeursInitiales(d as never));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => setValeurs(valeursInitiales(d as never)), [d]);
  useEffect(() => {
    if (!prefill.identification) return;
    const propositions = prefill.identification;
    setValeurs((v) => ({ ...v, ...Object.fromEntries(propositions.map((x) => [x.champ, x.valeur])) }));
    consommer("identification");
  }, [prefill.identification, consommer]);

  const modifie = JSON.stringify(valeurs) !== JSON.stringify(valeursInitiales(d as never));
  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      await api(`/api/dossiers/${d.id}`, { method: "PATCH", body: versApi(valeurs) });
      toast(t("commun.enregistre"));
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  // Propositions de l'OCR intelligent pour les champs encore vides ou différents, et documents utiles.
  type Champ = keyof ValeursIdentification;
  const propositions = documents.propositions?.identification ?? {};
  const champs = Object.keys(SOURCES_IDENTIFICATION) as Champ[];
  const aReprendre = droits.evaluation ? champs.filter((c) => aExaminer(propositions[c], String(valeurs[c] ?? ""))) : [];
  const reprendre = (cs: Champ[]) => setValeurs((v) => ({ ...v, ...Object.fromEntries(cs.map((c) => [c, propositions[c].valeur])) }));
  const vides = champs.filter((c) => !String(valeurs[c] ?? "").trim()).map((c) => ({ code: c, sources: SOURCES_IDENTIFICATION[c] }));
  const rendu = (c: string, v: string) =>
    c === "regionId" ? lib(ref?.regions.find((r) => r.id === v)?.libelle) || v : c === "typeZone" ? lib(ref?.listes.type_zone?.find((z) => z.code === v)?.libelle) || v : c === "natureProjet" ? lib(ref?.listes.nature_projet?.find((z) => z.code === v)?.libelle) || v : v;

  const motifs = (d.motifDeclenchement ?? "").split(",").filter(Boolean);
  const c = d.client;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Carte titre={t("fiche.partie1")}>
          <dl>
            <Ligne libelle={t("dossier.codeBanque")}>{d.entite.code}</Ligne>
            <Ligne libelle={t("dossier.entite")}>{d.entite.nom}</Ligne>
            <Ligne libelle={t("dossier.charge")}>{d.charge ? `${d.charge.prenom} ${d.charge.nom}` : "—"}</Ligne>
            <Ligne libelle={t("dossier.matricule")}>{d.charge?.matricule ?? "—"}</Ligne>
            <Ligne libelle={t("dossier.dateDossier")}>{fmt.date(d.dateDossier)}</Ligne>
            {d.precedent && (
              <Ligne libelle={t("dossier.precedent")}>
                <Link href={`/dossiers/${d.precedent.id}`} className="text-primary hover:underline" dir="ltr">
                  {d.precedent.reference}
                </Link>
              </Ligne>
            )}
          </dl>
        </Carte>
        <Carte titre={t("dossier.client")} actions={<Link href={`/clients/${c.id}`} className="text-[12.5px] text-primary hover:underline">{t("commun.ouvrir")}</Link>}>
          <dl>
            <Ligne libelle={t("client.raisonSociale")}>{c.raisonSociale}</Ligne>
            <Ligne libelle={t("client.compteCourant")}>
              <span dir="ltr" className="tabulaire">
                {c.compteCourant ?? "—"}
              </span>
            </Ligne>
            <Ligne libelle={t("client.comptePortefeuille")}>{c.comptePortefeuille ?? "—"}</Ligne>
            <Ligne libelle={t("client.codeActivite")}>{c.secteur ? `${c.secteur.code} — ${lib(c.secteur.libelle)}` : "—"}</Ligne>
            <Ligne libelle={t("client.contact")}>{[c.contactNom, c.contactPoste].filter(Boolean).join(" — ") || "—"}</Ligne>
            <Ligne libelle={t("client.contactTelephone")}>
              <span dir="ltr">{c.contactTelephone ?? "—"}</span>
            </Ligne>
            <Ligne libelle={t("client.contactEmail")}>{c.contactEmail ?? "—"}</Ligne>
          </dl>
        </Carte>
      </div>

      <Bandeau ton={d.evaluationObligatoire ? "vigilance" : "info"} titre={`${t("dossier.declenchementTitre")} — ${d.evaluationObligatoire ? t("dossier.obligatoire") : t("dossier.volontaire")}`}>
        {motifs
          .map((m) =>
            m === "categorie_a"
              ? t("dossier.motifCategorieA")
              : m === "seuil"
                ? t("dossier.motifSeuil", { seuil: fmt.compact(seuil, deviseReference) })
                : m === "hors_perimetre"
                  ? t("dossier.motifHorsPerimetre")
                  : t("dossier.motifVolontaire")
          )
          .join(" · ")}
        {d.deviseCode !== deviseReference && (
          <span className="block text-muted-foreground">
            {t("dossier.montantRef", { devise: deviseReference })} : {fmt.montant(d.montantDemandeRef, deviseReference)} (1 {d.deviseCode} = {fmt.nombre(d.tauxReference, 4)} {deviseReference})
          </span>
        )}
      </Bandeau>

      <Carte titre={t("etape.identification")}>
        {!ref ? (
          <Chargement />
        ) : (
          <>
            {erreur && <Bandeau ton="alerte" className="mb-4">{erreur}</Bandeau>}
            {droits.evaluation && (
              <div className="mb-4 space-y-2">
                <BandeauDocuments vides={vides} nbPropositions={aReprendre.length} onToutReprendre={() => reprendre(aReprendre)} />
                {aReprendre.map((c) => (
                  <PropositionOCR key={c} proposition={propositions[c]} rendu={<><span className="text-muted-foreground">{t(`ia.champ.${c}`)} :</span> <strong>{rendu(c, propositions[c].valeur)}</strong></>} onReprendre={() => reprendre([c])} onEcarter={() => documents.ecarter("identification", [c])} />
                ))}
              </div>
            )}
            <FormulaireIdentification valeurs={valeurs} onChange={setValeurs} referentiels={ref} desactive={!droits.evaluation} />
          </>
        )}
      </Carte>
      {droits.evaluation && (
        <BarreVolet modifie={modifie} suivante="exclusion">
          <Bouton onClick={enregistrer} disabled={!modifie || enCours}>
            {enCours && <Sablier />}
            {t("commun.enregistrer")}
          </Bouton>
        </BarreVolet>
      )}
    </div>
  );
}
