"use client";

import { CheckSquare, Square } from "lucide-react";
import type { Fiche } from "@/lib/serveur/fiche";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { PuceCategorie, PuceDecision, PuceNiveau } from "@/components/ui/puces";

type FicheJson = Omit<Fiche, never>;

function Section({ titre, children, className }: { titre: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("print-avoid rounded-lg border border-border bg-card", className)}>
      <h3 className="border-b border-border bg-surface px-4 py-2 text-[13px] font-semibold uppercase tracking-wide text-foreground">{titre}</h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Grille({ lignes }: { lignes: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
      {lignes.map(([l, v]) => (
        <div key={l} className="flex gap-2 border-b border-border/60 py-1">
          <dt className="w-[45%] shrink-0 text-muted-foreground">{l}</dt>
          <dd className="min-w-0 break-words font-medium">{v === null || v === undefined || v === "" ? "—" : v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Case({ coche, libelle }: { coche: boolean; libelle: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {coche ? <CheckSquare size={15} /> : <Square size={15} className="text-muted-foreground" />} {libelle}
    </span>
  );
}

/**
 * Fiche d'évaluation du risque E&S, en cinq parties (procédure §3.6) complétées du
 * volet climat. Même rendu à l'écran et à l'impression.
 */
export function FicheEvaluation({ fiche }: { fiche: FicheJson }) {
  const { t, fmt } = useApp();
  const f = fiche;
  const retenue = (r: boolean | null) => (r === null ? t("plan.nonNegociee") : r ? t("plan.retenue") : t("plan.ecartee"));
  return (
    <div className="space-y-4">
      <Section titre={t("fiche.partie1")}>
        <Grille
          lignes={[
            [t("dossier.codeBanque"), f.banque.codeBanque],
            [t("dossier.entite"), f.banque.entite],
            [t("dossier.charge"), f.banque.chargeNom],
            [t("dossier.matricule"), f.banque.chargeMatricule],
            [t("dossier.dateDossier"), fmt.date(f.banque.date)],
          ]}
        />
      </Section>

      <Section titre={t("fiche.partie2")}>
        <Grille
          lignes={[
            [t("dossier.reference"), <span key="r" dir="ltr">{f.client.referenceProjet}</span>],
            [t("client.raisonSociale"), f.client.raisonSociale],
            [t("client.formeJuridique"), f.client.formeJuridique],
            [t("client.comptePortefeuille"), f.client.comptePortefeuille],
            [t("client.compteCourant"), <span key="c" dir="ltr" className="tabulaire">{f.client.compteCourant}</span>],
            [t("dossier.secteur"), f.client.typeActivite ? `${f.client.codeActivite} — ${f.client.typeActivite}` : null],
            [t("client.contact"), [f.client.contact, f.client.poste].filter(Boolean).join(" — ")],
            [t("client.contactTelephone"), <span key="t" dir="ltr">{f.client.telephone}</span>],
            [t("client.contactEmail"), f.client.email],
            [t("dossier.adresseSite"), f.lieu.adresseSite],
            [t("dossier.localite"), f.lieu.localite],
            [t("dossier.region"), f.lieu.region],
            [t("dossier.typeZone"), f.lieu.typeZone],
            [t("dossier.typeCredit"), f.description.typeCredit],
            [t("dossier.natureProjet"), f.description.natureProjet],
            [t("dossier.projetDD"), f.description.projetDeveloppementDurable ? t("commun.oui") : t("commun.non")],
            [t("dossier.montantDemande"), fmt.montant(f.description.montantDemande, f.description.devise)],
            [t("dossier.montantInvestissement"), f.description.montantInvestissement ? fmt.montant(f.description.montantInvestissement, f.description.devise) : null],
          ]}
        />
        {f.description.processus && (
          <div className="mt-3 text-[13px]">
            <p className="text-muted-foreground">{t("dossier.descriptionProcessus")}</p>
            <p className="mt-0.5 whitespace-pre-line">{f.description.processus}</p>
          </div>
        )}
      </Section>

      <Section titre={t("fiche.partie3")}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-[12px] text-muted-foreground">{t("dossier.exclu")}</p>
            <p className={cn("mt-1 text-[14px] font-semibold", f.conclusions.listeExclusion ? "text-destructive" : "text-success")}>
              {f.conclusions.listeExclusion ? t("dossier.exclusionOui") : t("dossier.exclusionNon")}
            </p>
            {f.conclusions.raisonsExclusion.length > 0 && (
              <ul className="mt-1 list-disc ps-5 text-[12.5px]">
                {f.conclusions.raisonsExclusion.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {f.conclusions.motifExclusion && <p className="mt-1 text-[12.5px]">{f.conclusions.motifExclusion}</p>}
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">{t("dossier.categorie")}</p>
            <div className="mt-1 flex items-center gap-2">
              <PuceCategorie categorie={f.conclusions.categorie} sous={f.conclusions.sousCategorieFI} grande />
              {f.conclusions.categorie && <span className="text-[12px] text-muted-foreground">{t(`categorie.desc${f.conclusions.categorie}`)}</span>}
            </div>
            {f.conclusions.justificationCategorie && (
              <p className="mt-1 text-[12px]">
                {t("categorisation.calculee")} : {f.conclusions.categorieCalculee} — {f.conclusions.justificationCategorie}
              </p>
            )}
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">{t("dossier.niveauRisque")}</p>
            <div className="mt-1">
              <PuceNiveau niveau={f.conclusions.niveauRisque} score={f.conclusions.scoreRisque} />
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t("dossier.risquesNonMaitrises")} : {f.conclusions.nbRisquesNonMaitrises}
            </p>
          </div>
        </div>

        <h4 className="mt-5 text-[13px] font-semibold">{t("fiche.problematiques")}</h4>
        <table className="mt-2 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border px-2 py-1.5 text-start">{t("plan.thematique")}</th>
              <th className="border border-border px-2 py-1.5 text-center" colSpan={2}>
                {t("fiche.mesuresControle")}
              </th>
              <th className="border border-border px-2 py-1.5 text-center">{t("evaluation.nonConcerne")}</th>
            </tr>
          </thead>
          <tbody>
            {f.problematiques.map((p) => (
              <tr key={p.code}>
                <td className="border border-border px-2 py-1.5">
                  <span className="font-medium">{p.libelle}</span>
                  {p.risques.length > 0 && (
                    <ul className="mt-1 list-disc ps-4 text-[12px] text-muted-foreground">
                      {p.risques.map((r) => (
                        <li key={r.code}>{r.question}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="border border-border px-2 py-1.5 text-center">
                  <Case coche={p.etat === "maitrise"} libelle={t("commun.oui")} />
                </td>
                <td className="border border-border px-2 py-1.5 text-center">
                  <Case coche={p.etat === "non_maitrise"} libelle={t("commun.non")} />
                </td>
                <td className="border border-border px-2 py-1.5 text-center">
                  <Case coche={p.etat === "non_concerne"} libelle="" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {f.expositionNonMaitrisee.length > 0 && (
          <>
            <h4 className="mt-5 text-[13px] font-semibold">{t("fiche.expositionNonMaitrisee")}</h4>
            <table className="mt-2 w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-surface">
                  <th className="w-1/2 border border-border px-2 py-1.5 text-start">{t("evaluation.risque")}</th>
                  <th className="border border-border px-2 py-1.5 text-start">{t("fiche.mesuresCorrectives")}</th>
                </tr>
              </thead>
              <tbody>
                {f.expositionNonMaitrisee.map((e, i) => (
                  <tr key={i}>
                    <td className="border border-border px-2 py-1.5 align-top">
                      <span className="text-[11px] text-muted-foreground">{e.thematique}</span>
                      <br />
                      {e.risque}
                    </td>
                    <td className="border border-border px-2 py-1.5 align-top">
                      <ul className="list-disc ps-4">
                        {e.mesures.map((m, k) => (
                          <li key={k}>
                            {m.libelle} <span className="text-muted-foreground">({t(`horizon.${m.horizon}`)})</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {f.conclusions.commentaireEvaluation && (
          <div className="mt-5">
            <h4 className="text-[13px] font-semibold">{t("evaluation.commentaireEvaluation")}</h4>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed">{f.conclusions.commentaireEvaluation}</p>
          </div>
        )}
      </Section>

      {f.climat && (
        <Section titre={t("fiche.partieClimat")}>
          <Grille
            lignes={[
              [t("climat.score"), <PuceNiveau key="n" niveau={f.climat.niveauClimat} score={f.climat.scoreClimat} />],
              [t("climat.physique"), fmt.nombre(f.climat.scorePhysique, 0)],
              [t("climat.transitionTitre"), fmt.nombre(f.climat.scoreTransition, 0)],
              [t("climat.emissionsFinancees"), `${fmt.nombre(f.climat.emissionsFinancees, 0)} ${t("commun.tco2e")}`],
              [t("climat.taxonomie"), t(`climat.${f.climat.alignementTaxonomie}`)],
              [t("climat.cbam"), f.climat.expositionCBAM ? t("commun.oui") : t("commun.non")],
            ]}
          />
        </Section>
      )}

      <Section titre={t("fiche.partie4")} className="print-break">
        <p className="mb-2 text-[13px]">
          {t("fiche.propositionPlan")} : <strong>{f.planActions.propose ? t("commun.oui") : t("commun.non")}</strong>
          {f.planActions.propose && ` — ${f.planActions.nbRetenues} / ${f.planActions.nbActions} ${t("plan.retenues").toLowerCase()}`}
        </p>
        {f.planActions.actions.length > 0 && (
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-surface">
                <th className="border border-border px-2 py-1.5 text-start">{t("plan.action")}</th>
                <th className="border border-border px-2 py-1.5 text-start">{t("plan.horizon")}</th>
                <th className="border border-border px-2 py-1.5 text-start">{t("plan.retenue")}</th>
                <th className="border border-border px-2 py-1.5 text-start">{t("plan.dateEcheance")}</th>
                <th className="border border-border px-2 py-1.5 text-end">{t("plan.budget")}</th>
                <th className="border border-border px-2 py-1.5 text-end">{t("plan.avancement")}</th>
              </tr>
            </thead>
            <tbody>
              {f.planActions.actions.map((a) => (
                <tr key={a.id}>
                  <td className="border border-border px-2 py-1.5">
                    {a.libelle}
                    {a.origine !== "systeme" && <span className="text-muted-foreground"> — {t(`origine.${a.origine}`)}</span>}
                    {a.reserveClient && <span className="block text-[11px] italic text-muted-foreground">{a.reserveClient}</span>}
                  </td>
                  <td className="border border-border px-2 py-1.5">{t(`horizon.${a.horizon}`)}</td>
                  <td className="border border-border px-2 py-1.5">{retenue(a.retenue)}</td>
                  <td className="border border-border px-2 py-1.5">{fmt.date(a.dateEcheance)}</td>
                  <td className="border border-border px-2 py-1.5 text-end tabulaire">{a.budget ? fmt.montant(a.budget, a.deviseCode ?? f.description.devise) : "—"}</td>
                  <td className="border border-border px-2 py-1.5 text-end tabulaire">{a.avancement} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section titre={t("fiche.partie5")}>
        {f.decisionComite.decision ? (
          <Grille
            lignes={[
              [t("comite.comite"), f.decisionComite.comite],
              [t("comite.dateComite"), fmt.date(f.decisionComite.dateComite)],
              [t("comite.decision"), <PuceDecision key="d" decision={f.decisionComite.decision} />],
              [t("comite.montantAccorde"), f.decisionComite.montantAccorde ? fmt.montant(f.decisionComite.montantAccorde, f.description.devise) : null],
              [t("comite.motifRejet"), [f.decisionComite.motifRejet, f.decisionComite.motifRejetDetail].filter(Boolean).join(" — ")],
              [t("comite.reserves"), f.decisionComite.reserves],
              [t("comite.commentaire"), f.decisionComite.commentaire],
            ]}
          />
        ) : (
          <p className="text-[13px] text-muted-foreground">{t("comite.attente")}</p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-6 text-[12px]">
          <div className="border-t border-border pt-2">
            {t("fiche.signatureCharge")} : {f.banque.chargeNom}
          </div>
          <div className="border-t border-border pt-2">
            {t("fiche.signatureDirecteur")} : {f.validation.valideur ?? "—"} {f.validation.valideLe ? `(${fmt.date(f.validation.valideLe)})` : ""}
          </div>
        </div>
      </Section>
    </div>
  );
}
