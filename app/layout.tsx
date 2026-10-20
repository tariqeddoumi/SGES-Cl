import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CadreApplication } from "@/components/layout/cadre";
import { FournisseurApplication, type SessionClient } from "@/components/providers/application";
import { FournisseurToasts } from "@/components/providers/toasts";
import { dictionnaire, LANGUES_RTL } from "@/lib/i18n";
import { libelle } from "@/lib/i18n/libelle";
import { texteSur } from "@/lib/couleurs";
import { COOKIE_LANGUE } from "@/lib/session-jeton";
import { contexteServeur } from "@/lib/serveur/contexte";
import { chargerCours } from "@/lib/serveur/devises";
import { chargerParametres, parametresPublics } from "@/lib/serveur/parametres";
import { chargerArbre, habillageHerite } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SGES", template: "%s · SGES" },
  description: "Système de gestion environnementale, sociale et climatique des crédits d'investissement",
  robots: { index: false, follow: false },
};

/** Rendu à chaque requête : langue, habillage et droits dépendent de l'utilisateur. */
export const dynamic = "force-dynamic";

async function sansEchec<T>(f: () => Promise<T>, defaut: T): Promise<T> {
  try {
    return await f();
  } catch {
    return defaut;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const parametres = await chargerParametres();
  const ctx = await sansEchec(() => contexteServeur(), null);
  const cookieLangue = (await cookies()).get(COOKIE_LANGUE)?.value;
  const langues = await sansEchec(
    () => prisma.langue.findMany({ where: { active: true }, orderBy: { ordre: "asc" }, select: { code: true, nomNatif: true, rtl: true } }),
    [{ code: "fr", nomNatif: "Français", rtl: false }]
  );
  const langue = ctx?.langue ?? cookieLangue ?? parametres.LANGUE_DEFAUT ?? "fr";
  const rtl = langues.find((l) => l.code === langue)?.rtl ?? LANGUES_RTL.has(langue);
  const devises = await sansEchec(
    async () =>
      (await prisma.devise.findMany({ where: { active: true }, orderBy: { ordre: "asc" } })).map((d) => ({
        code: d.code,
        symbole: d.symbole,
        decimales: d.decimales,
        libelle: libelle(d.libelle, langue),
      })),
    []
  );
  const cours = await sansEchec(() => chargerCours(), []);
  const arbre = await sansEchec(() => chargerArbre(), []);
  const h = habillageHerite(arbre, ctx?.utilisateur.entiteId ?? null);

  const session: SessionClient | null = ctx
    ? {
        id: ctx.utilisateur.id,
        prenom: ctx.utilisateur.prenom,
        nom: ctx.utilisateur.nom,
        email: ctx.utilisateur.email,
        roleCode: ctx.utilisateur.roleCode,
        roleLibelle: libelle(ctx.utilisateur.roleLibelle, langue),
        entiteId: ctx.utilisateur.entiteId,
        entiteNom: h.entite,
        permissions: ctx.permissions,
        deviseAffichage: ctx.utilisateur.deviseAffichage,
        doitChangerMdp: ctx.utilisateur.doitChangerMdp,
      }
    : null;

  const theme = parametres.THEME === "sombre" ? "dark" : "";
  const couleur = h.couleurPrimaire || parametres.COULEUR_PRIMAIRE;

  return (
    <html lang={langue} dir={rtl ? "rtl" : "ltr"} className={theme} suppressHydrationWarning>
      <body className="antialiased">
        {couleur && /^#[0-9a-f]{3,6}$/i.test(couleur) && (
          <style>{`:root,.dark{--primary:${couleur};--ring:${couleur};--chart-1:${couleur};--accent-foreground:${couleur};${texteSur(couleur) ? `--primary-foreground:${texteSur(couleur)};` : ""}}`}</style>
        )}
        <FournisseurApplication
          langue={langue}
          rtl={rtl}
          messages={dictionnaire(langue)}
          parametres={parametresPublics(parametres)}
          session={session}
          habillage={{
            nom: h.nomOutil || parametres.APP_NOM || "SGES",
            sousTitre: parametres.APP_SOUS_TITRE || "",
            logoUrl: h.logoUrl || parametres.APP_LOGO_URL || "",
            couleur: couleur || "",
            entite: h.entite,
          }}
          devises={devises}
          langues={langues}
          cours={cours}
        >
          <FournisseurToasts>
            <CadreApplication>{children}</CadreApplication>
          </FournisseurToasts>
        </FournisseurApplication>
      </body>
    </html>
  );
}
