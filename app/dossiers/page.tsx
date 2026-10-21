"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSpreadsheet, FolderOpen, Plus, Search } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { useReferentiels } from "@/lib/client/referentiels";
import { CATEGORIES, NIVEAUX_RISQUE, STATUTS } from "@/lib/domaine/constantes";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { PuceCategorie, PuceDecision, PuceNiveau, PuceStatut } from "@/components/ui/puces";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

interface Ligne {
  id: string;
  reference: string;
  statut: string;
  categorie: string | null;
  sousCategorieFI: string | null;
  niveauRisque: string | null;
  scoreRisque: number | null;
  montantDemande: number;
  deviseCode: string;
  montantDemandeRef: number;
  updatedAt: string;
  decision: string | null;
  exclu: boolean;
  evaluationObligatoire: boolean;
  objet: string | null;
  client: { id: string; raisonSociale: string; compteCourant: string | null };
  entite: { code: string; nom: string };
  charge: { prenom: string; nom: string } | null;
  climat: { niveauClimat: string | null; scoreClimat: number | null } | null;
}

const CLASSE_FILTRE = "h-9 rounded-md border border-border bg-background px-2.5 text-[13px] text-foreground";

function Liste() {
  const { t, fmt, peut } = useApp();
  const ref = useReferentiels();
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [qDiffere, setQDiffere] = useState(q);
  const filtres = {
    statut: sp.get("statut") ?? "",
    categorie: sp.get("categorie") ?? "",
    niveau: sp.get("niveau") ?? "",
    entite: sp.get("entite") ?? "",
    mes: sp.get("mes") ?? "",
    page: Number(sp.get("page") ?? 1),
  };
  useEffect(() => {
    const h = setTimeout(() => setQDiffere(q), 300);
    return () => clearTimeout(h);
  }, [q]);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filtres)) if (v && k !== "page") p.set(k, String(v));
    if (qDiffere) p.set("q", qDiffere);
    p.set("page", String(filtres.page));
    p.set("taille", "25");
    return `/api/dossiers?${p}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, qDiffere]);
  const { donnees, erreur, chargement } = useDonnees<{ total: number; page: number; taille: number; lignes: Ligne[] }>(url);

  const filtrer = (cle: string, valeur: string) => {
    const p = new URLSearchParams(sp.toString());
    if (valeur) p.set(cle, valeur);
    else p.delete(cle);
    if (cle !== "page") p.delete("page");
    router.replace(`/dossiers?${p}`);
  };
  const pages = donnees ? Math.max(1, Math.ceil(donnees.total / donnees.taille)) : 1;
  const exportUrl = `/api/reporting/export?format=xlsx&${new URLSearchParams(Object.entries(filtres).filter(([k, v]) => v && k !== "page") as [string, string][])}`;

  return (
    <div className="space-y-4">
      <EnTete
        titre={t("dossier.titreListe")}
        description={t("dossier.descriptionListe")}
        actions={
          <>
            {peut("reporting:exporter") && (
              <Bouton variante="contour" asChild>
                <a href={exportUrl}>
                  <FileSpreadsheet /> {t("commun.exporterExcel")}
                </a>
              </Bouton>
            )}
            {peut("dossier:creer") && (
              <Bouton asChild>
                <Link href="/dossiers/nouveau">
                  <Plus /> {t("dossier.nouveau")}
                </Link>
              </Bouton>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search size={15} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commun.rechercher")} className="w-full bg-transparent text-sm outline-none" aria-label={t("commun.rechercher")} />
        </label>
        <select aria-label={t("dossier.filtreStatut")} value={filtres.statut} onChange={(e) => filtrer("statut", e.target.value)} className={CLASSE_FILTRE}>
          <option value="">{t("dossier.filtreStatut")} : {t("commun.tous")}</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {t(`statut.${s}`)}
            </option>
          ))}
        </select>
        <select aria-label={t("dossier.filtreCategorie")} value={filtres.categorie} onChange={(e) => filtrer("categorie", e.target.value)} className={CLASSE_FILTRE}>
          <option value="">{t("dossier.filtreCategorie")} : {t("commun.toutes")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categorie.${c}`)}
            </option>
          ))}
        </select>
        <select aria-label={t("dossier.filtreNiveau")} value={filtres.niveau} onChange={(e) => filtrer("niveau", e.target.value)} className={CLASSE_FILTRE}>
          <option value="">{t("dossier.filtreNiveau")} : {t("commun.tous")}</option>
          {NIVEAUX_RISQUE.map((n) => (
            <option key={n} value={n}>
              {t(`niveau.${n}`)}
            </option>
          ))}
        </select>
        {ref && ref.entites.length > 1 && (
          <select aria-label={t("dossier.filtreEntite")} value={filtres.entite} onChange={(e) => filtrer("entite", e.target.value)} className={CLASSE_FILTRE}>
            <option value="">{t("dossier.filtreEntite")} : {t("commun.toutes")}</option>
            {ref.entites.map((e) => (
              <option key={e.id} value={e.id}>
                {"· ".repeat(e.niveau)}
                {e.nom}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <input type="checkbox" checked={filtres.mes === "1"} onChange={(e) => filtrer("mes", e.target.checked ? "1" : "")} className="h-4 w-4 accent-[var(--primary)]" />
          {t("dossier.mesDossiers")}
        </label>
      </div>

      {erreur && <Bandeau ton="alerte">{erreur.message}</Bandeau>}
      <Carte sansMarge>
        {chargement && !donnees ? (
          <div className="p-4">
            <Chargement lignes={6} />
          </div>
        ) : !donnees?.lignes.length ? (
          <Vide icone={<FolderOpen size={28} />} titre={t("dossier.aucunDossier")} />
        ) : (
          <Tableau>
            <thead>
              <tr>
                <Th>{t("dossier.reference")}</Th>
                <Th>{t("dossier.client")}</Th>
                <Th>{t("dossier.categorie")}</Th>
                <Th>{t("dossier.niveauRisque")}</Th>
                <Th>{t("climat.niveau")}</Th>
                <Th alignFin>{t("dossier.montantDemande")}</Th>
                <Th>{t("commun.statut")}</Th>
                <Th>{t("dossier.charge")}</Th>
                <Th>{t("dossier.derniereMaj")}</Th>
              </tr>
            </thead>
            <tbody>
              {donnees.lignes.map((d) => (
                <Tr key={d.id} onClick={() => router.push(`/dossiers/${d.id}`)}>
                  <Td className="whitespace-nowrap font-medium">
                    <Link href={`/dossiers/${d.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()} dir="ltr">
                      {d.reference}
                    </Link>
                    {d.exclu && <span className="ms-2 rounded bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">EXCL</span>}
                  </Td>
                  <Td>
                    <span className="block max-w-[260px] truncate font-medium">{d.client.raisonSociale}</span>
                    <span className="block max-w-[260px] truncate text-[11.5px] text-muted-foreground">{d.objet ?? d.entite.nom}</span>
                  </Td>
                  <Td>
                    <PuceCategorie categorie={d.categorie} sous={d.sousCategorieFI} />
                  </Td>
                  <Td>
                    <PuceNiveau niveau={d.niveauRisque} score={d.scoreRisque} />
                  </Td>
                  <Td>
                    <PuceNiveau niveau={d.climat?.niveauClimat} />
                  </Td>
                  <Td alignFin className="whitespace-nowrap">
                    <span title={fmt.montant(d.montantDemande, d.deviseCode)}>{fmt.compact(d.montantDemande, d.deviseCode)}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <PuceStatut statut={d.statut} />
                      <PuceDecision decision={d.decision} />
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{d.charge ? `${d.charge.prenom} ${d.charge.nom}` : "—"}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{fmt.date(d.updatedAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Tableau>
        )}
      </Carte>
      {donnees && donnees.total > donnees.taille && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>{t("commun.elements", { n: donnees.total })}</span>
          <div className="flex items-center gap-2">
            <Bouton variante="contour" taille="petite" disabled={filtres.page <= 1} onClick={() => filtrer("page", String(filtres.page - 1))}>
              {t("commun.precedent")}
            </Bouton>
            <span>{t("commun.page", { n: filtres.page, total: pages })}</span>
            <Bouton variante="contour" taille="petite" disabled={filtres.page >= pages} onClick={() => filtrer("page", String(filtres.page + 1))}>
              {t("commun.suivant")}
            </Bouton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PageDossiers() {
  return (
    <Suspense>
      <Liste />
    </Suspense>
  );
}
