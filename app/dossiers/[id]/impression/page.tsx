"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import type { Fiche } from "@/lib/serveur/fiche";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Chargement } from "@/components/ui/mise-en-page";
import { FicheEvaluation } from "@/components/dossier/fiche-evaluation";

interface Questionnaire {
  categorie: string | null;
  thematiques: { id: string; libelle: string; blocs: { id: string; libelle: string; questions: { id: string; code: string; libelle: string; type: string }[] }[] }[];
  reponses: { questionId: string; valeur: string | null }[];
}

function EnTeteImpression({ titre, fiche }: { titre: string; fiche: Fiche }) {
  const { habillage, t, fmt } = useApp();
  return (
    <header className="mb-5 flex items-start justify-between gap-4 border-b-2 border-foreground pb-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{habillage.nom} — {t("fiche.sousTitre")}</p>
        <h1 className="mt-1 text-xl font-bold">{titre}</h1>
        <p className="text-[13px]">
          <span dir="ltr">{fiche.dossier.reference}</span> — {fiche.client.raisonSociale}
        </p>
      </div>
      <div className="text-end text-[11px] text-muted-foreground">
        {habillage.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={habillage.logoUrl} alt="" className="mb-1 ms-auto h-10 object-contain" />
        )}
        {t("commun.genereLe", { date: fmt.dateHeure(fiche.genereLe) })}
      </div>
    </header>
  );
}

function Contenu({ id }: { id: string }) {
  const { t, lib } = useApp();
  const doc = useSearchParams().get("doc") ?? "fiche";
  const { donnees: fiche } = useDonnees<Fiche>(`/api/dossiers/${id}/fiche`);
  const { donnees: q } = useDonnees<Questionnaire>(doc === "questionnaire" ? `/api/dossiers/${id}/evaluation` : null);

  if (!fiche || (doc === "questionnaire" && !q)) return <div className="p-8"><Chargement lignes={8} /></div>;
  const titre = doc === "plan" ? t("plan.titre") : doc === "questionnaire" ? `${t("evaluation.titre")} — ${t(`categorie.${q?.categorie ?? "A"}`)}` : t("fiche.titre");
  const valeurs = new Map((q?.reponses ?? []).map((r) => [r.questionId, r.valeur]));

  return (
    <div className="mx-auto max-w-[900px] bg-white p-8 text-[13px] text-black dark:bg-card dark:text-foreground print:p-0">
      <div className="no-print mb-4 flex justify-end">
        <Bouton onClick={() => window.print()}>
          <Printer /> {t("commun.imprimer")}
        </Bouton>
      </div>
      <EnTeteImpression titre={titre} fiche={fiche} />
      {doc === "fiche" && <FicheEvaluation fiche={fiche} />}
      {doc === "plan" && (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {[t("plan.action"), t("plan.horizon"), t("plan.retenue"), t("plan.responsable"), t("plan.dateDebut"), t("plan.dateEcheance"), t("plan.budget"), t("plan.avancement")].map((h) => (
                <th key={h} className="border border-black/40 bg-black/5 px-2 py-1.5 text-start">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fiche.planActions.actions.map((a) => (
              <tr key={a.id} className="print-avoid">
                <td className="border border-black/40 px-2 py-1.5">
                  {a.libelle}
                  {a.origine !== "systeme" && <em> — {t(`origine.${a.origine}`)}</em>}
                  {a.reserveClient && <div className="text-[11px] italic">{a.reserveClient}</div>}
                </td>
                <td className="border border-black/40 px-2 py-1.5">{t(`horizon.${a.horizon}`)}</td>
                <td className="border border-black/40 px-2 py-1.5">{a.retenue === null ? "—" : a.retenue ? t("commun.oui") : t("commun.non")}</td>
                <td className="border border-black/40 px-2 py-1.5">{a.responsable}</td>
                <td className="border border-black/40 px-2 py-1.5">{a.dateDebut ? new Date(a.dateDebut).toLocaleDateString() : ""}</td>
                <td className="border border-black/40 px-2 py-1.5">{a.dateEcheance ? new Date(a.dateEcheance).toLocaleDateString() : ""}</td>
                <td className="border border-black/40 px-2 py-1.5 text-end">{a.budget ? `${a.budget.toLocaleString()} ${a.deviseCode ?? ""}` : ""}</td>
                <td className="border border-black/40 px-2 py-1.5 text-end">{a.avancement} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {doc === "questionnaire" &&
        q!.thematiques.map((th) => (
          <section key={th.id} className="mb-5">
            <h2 className="mb-2 border-b border-black/40 pb-1 text-[14px] font-bold">{lib(th.libelle)}</h2>
            {th.blocs.map((b) => (
              <div key={b.id} className="mb-3">
                {th.blocs.length > 1 && <h3 className="mb-1 text-[12.5px] font-semibold">{lib(b.libelle)}</h3>}
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {b.questions.map((x) => (
                      <tr key={x.id} className="print-avoid">
                        <td className="w-[70%] border border-black/30 px-2 py-1.5">{lib(x.libelle)}</td>
                        <td className="border border-black/30 px-2 py-1.5">
                          {x.type.startsWith("oui_non") ? (
                            <span className="flex gap-3">
                              {["oui", "non", ...(x.type === "oui_non_na" ? ["na"] : [])].map((o) => (
                                <span key={o}>
                                  {valeurs.get(x.id) === o ? "☒" : "☐"} {t(o === "na" ? "commun.na" : `commun.${o}`)}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="inline-block min-h-5 w-full">{valeurs.get(x.id) ?? ""}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}

export default function PageImpression({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <Contenu id={id} />
    </Suspense>
  );
}
