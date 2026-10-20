"use client";

import Link from "next/link";
import { CheckCircle2, Code2, Printer, XCircle } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import type { Fiche } from "@/lib/serveur/fiche";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte, Chargement, Ligne } from "@/components/ui/mise-en-page";
import { useDossier } from "./contexte";
import { FicheEvaluation } from "./fiche-evaluation";

export function VoletFiche() {
  const { t, fmt } = useApp();
  const { dossier: d, motifsBlocage, droits } = useDossier();
  const { donnees: fiche } = useDonnees<Fiche>(`/api/dossiers/${d.id}/fiche`);

  return (
    <div className="space-y-4">
      {d.statut === "brouillon" && (
        <Carte titre={t("dossier.blocages")}>
          {motifsBlocage.length === 0 ? (
            <p className="flex items-center gap-2 text-[13px] text-success">
              <CheckCircle2 size={16} /> {t("dossier.pretSoumission")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {motifsBlocage.map((m) => (
                <li key={m} className="flex items-start gap-2 text-[13px]">
                  <XCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
                  {t(`dossier.blocage_${m}`)}
                </li>
              ))}
            </ul>
          )}
          {droits.transitions.includes("soumettre") && motifsBlocage.length === 0 && (
            <p className="mt-3 text-[12.5px] text-muted-foreground">{t("transition.soumettre")} : ↑</p>
          )}
        </Carte>
      )}

      <Carte titre={t("validation.titre")} description={t("validation.description")}>
        <dl>
          <Ligne libelle={t("validation.soumisLe")}>{d.soumisLe ? fmt.dateHeure(d.soumisLe) : "—"}</Ligne>
          <Ligne libelle={t("validation.validePar")}>{d.valideur ? `${d.valideur.prenom} ${d.valideur.nom}` : "—"}</Ligne>
          <Ligne libelle={t("validation.valideLe")}>{d.valideLe ? fmt.dateHeure(d.valideLe) : "—"}</Ligne>
          <Ligne libelle={t("validation.commentaire")}>{d.commentaireValidation ?? "—"}</Ligne>
        </dl>
        <p className="mt-3 text-[12px] text-muted-foreground">{t("validation.separation")}</p>
      </Carte>

      <Carte
        titre={t("fiche.titre")}
        actions={
          <>
            <Bouton variante="contour" taille="petite" asChild>
              <Link href={`/dossiers/${d.id}/impression`} target="_blank">
                <Printer /> {t("fiche.imprimer")}
              </Link>
            </Bouton>
            <Bouton variante="contour" taille="petite" asChild>
              <a href={`/api/dossiers/${d.id}/fiche`} target="_blank" rel="noreferrer">
                <Code2 /> JSON
              </a>
            </Bouton>
          </>
        }
      >
        {!fiche ? <Chargement lignes={6} /> : <FicheEvaluation fiche={fiche} />}
      </Carte>
      <Bandeau ton="info" titre={t("fiche.integration")}>
        {t("fiche.integrationAide")}{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-[12px]" dir="ltr">
          GET /api/v1/fiches/{d.reference}
        </code>
      </Bandeau>
    </div>
  );
}
