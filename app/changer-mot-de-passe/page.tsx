"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { api, ErreurApi } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champs";
import { Bandeau, Sablier } from "@/components/ui/mise-en-page";

export default function PageChangerMotDePasse() {
  const { t, session } = useApp();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveau !== confirmation) return setErreur(t("auth.motsDePasseDifferents"));
    setEnCours(true);
    setErreur("");
    try {
      await api("/api/auth/mot-de-passe", { body: { ancien, nouveau } });
      window.location.href = "/tableau-de-bord";
    } catch (err) {
      setErreur(err instanceof ErreurApi && err.code === "mdp_faible" ? t("auth.reglesMotDePasse") : err instanceof Error ? err.message : String(err));
      setEnCours(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={soumettre} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <KeyRound size={18} />
          </span>
          <div>
            <h1 className="text-lg font-semibold">{t("auth.changerMotDePasse")}</h1>
            <p className="text-[12.5px] text-muted-foreground">{session?.email}</p>
          </div>
        </div>
        {session?.doitChangerMdp && <Bandeau ton="vigilance">{t("auth.motDePasseProvisoire")}</Bandeau>}
        {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
        <Champ id="ancien" type="password" libelle={t("auth.ancienMotDePasse")} valeur={ancien} onChange={setAncien} obligatoire dir="ltr" />
        <Champ id="nouveau" type="password" libelle={t("auth.nouveauMotDePasse")} valeur={nouveau} onChange={setNouveau} obligatoire aide={t("auth.reglesMotDePasse")} dir="ltr" />
        <Champ id="confirmation" type="password" libelle={t("auth.confirmationMotDePasse")} valeur={confirmation} onChange={setConfirmation} obligatoire dir="ltr" />
        <Bouton type="submit" className="w-full" disabled={enCours || !ancien || !nouveau}>
          {enCours && <Sablier />}
          {t("commun.enregistrer")}
        </Bouton>
      </form>
    </div>
  );
}
