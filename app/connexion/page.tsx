"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Leaf, Lock } from "lucide-react";
import { api, ErreurApi } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champs";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";

function Formulaire() {
  const { t, habillage, langues, langue } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur("");
    try {
      const r = await api<{ doitChangerMdp: boolean }>("/api/auth/connexion", { body: { email, motDePasse } });
      const retour = params.get("retour");
      // Rechargement complet : la mise en page serveur relit la session et la langue.
      window.location.href = r.doitChangerMdp ? "/changer-mot-de-passe" : retour && retour.startsWith("/") ? retour : "/tableau-de-bord";
    } catch (err) {
      if (err instanceof ErreurApi && err.code === "compte_verrouille") {
        setErreur(t("auth.compteVerrouille", { minutes: (err.details as { minutes?: number })?.minutes ?? 15 }));
      } else if (err instanceof ErreurApi && err.code === "identifiants") setErreur(t("auth.erreurIdentifiants"));
      else setErreur(err instanceof Error ? err.message : String(err));
      setEnCours(false);
    }
  };

  const changerLangue = async (code: string) => {
    await api("/api/langue", { body: { langue: code } }).catch(() => undefined);
    router.refresh();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Leaf size={20} />
          </span>
          <div>
            <p className="text-lg font-semibold text-sidebar-accent-foreground">{habillage.nom}</p>
            <p className="text-[13px]">{habillage.sousTitre || t("app.sousTitreDefaut")}</p>
          </div>
        </div>
        <div className="max-w-md space-y-4">
          <p className="text-[26px] font-semibold leading-snug text-sidebar-accent-foreground">{t("app.sousTitreDefaut")}</p>
          <ul className="space-y-2 text-[13.5px]">
            {["etape.exclusion", "etape.categorisation", "etape.evaluation", "etape.climat", "etape.plan", "etape.suivi"].map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sidebar-ring" />
                {t(c)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11.5px] opacity-70">SFI · Principes de l&apos;Équateur · Loi 49-17 · Bank Al-Maghrib 5/W/2021 · PCAF</p>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-end p-4">
          {langues.length > 1 && (
            <label className="flex items-center gap-1.5 text-muted-foreground">
              <Globe size={15} aria-hidden />
              <span className="sr-only">{t("commun.langue")}</span>
              <select value={langue} onChange={(e) => changerLangue(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground">
                {langues.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nomNatif}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <form onSubmit={soumettre} className="w-full max-w-sm space-y-4">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">{t("auth.titreConnexion")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{habillage.nom}</p>
            </div>
            {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
            <Champ id="email" type="email" libelle={t("auth.email")} valeur={email} onChange={setEmail} obligatoire dir="ltr" />
            <Champ id="mdp" type="password" libelle={t("auth.motDePasse")} valeur={motDePasse} onChange={setMotDePasse} obligatoire dir="ltr" />
            <Bouton type="submit" className="w-full" taille="grande" disabled={enCours || !email || !motDePasse}>
              {enCours ? <Sablier /> : <Lock size={15} />}
              {t("auth.seConnecter")}
            </Bouton>
            <p className="pt-2 text-center text-[11.5px] text-muted-foreground">{t("auth.mentionConfidentialite")}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  );
}
