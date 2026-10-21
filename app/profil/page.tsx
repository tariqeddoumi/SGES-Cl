"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { api } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Selecteur } from "@/components/ui/champs";
import { Carte, EnTete, Ligne } from "@/components/ui/mise-en-page";

export default function PageProfil() {
  const { t, session, langue, langues, devises, deviseAffichage, changerDeviseAffichage } = useApp();
  const router = useRouter();
  if (!session) return null;
  return (
    <div className="max-w-3xl space-y-4">
      <EnTete titre={t("profil.titre")} description={`${session.prenom} ${session.nom} · ${session.email}`} />
      <Carte titre={t("profil.preferences")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Selecteur id="langue" libelle={t("profil.langueInterface")} valeur={langue} sansVide options={langues.map((l) => ({ valeur: l.code, libelle: l.nomNatif }))} onChange={async (v) => { await api("/api/langue", { body: { langue: v } }); router.refresh(); }} />
          <Selecteur id="devise" libelle={t("profil.deviseAffichage")} aide={t("profil.deviseAffichageAide")} valeur={deviseAffichage} sansVide options={devises.map((d) => ({ valeur: d.code, libelle: `${d.code} — ${d.libelle}` }))} onChange={changerDeviseAffichage} />
        </div>
      </Carte>
      <Carte titre={t("profil.securite")}>
        <dl>
          <Ligne libelle={t("profil.role")}>{session.roleLibelle}</Ligne>
          <Ligne libelle={t("profil.perimetre")}>{session.entiteNom ?? t("profil.perimetreTout")}</Ligne>
          <Ligne libelle={t("admin.permissions")}><span className="font-mono text-[11.5px] font-normal" dir="ltr">{session.permissions.join(", ")}</span></Ligne>
        </dl>
        <Bouton variante="contour" className="mt-4" asChild><Link href="/changer-mot-de-passe"><KeyRound /> {t("auth.changerMotDePasse")}</Link></Bouton>
      </Carte>
    </div>
  );
}
