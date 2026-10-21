"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FolderOpen,
  Globe,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  ScrollText,
  Settings,
  ShieldAlert,
  ThermometerSun,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { ecranAutorise, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Carte, Vide } from "@/components/ui/mise-en-page";

interface Entree {
  icone: LucideIcon;
  cle: string;
  href: string;
  permission?: Permission;
  compteur?: "notifications" | "aTraiter";
  climat?: boolean;
}

const GROUPES: { titre: string; entrees: Entree[] }[] = [
  {
    titre: "nav.groupeSuivi",
    entrees: [
      { icone: LayoutDashboard, cle: "nav.tableauDeBord", href: "/tableau-de-bord" },
      { icone: Bell, cle: "nav.notifications", href: "/notifications", compteur: "notifications" },
    ],
  },
  {
    titre: "nav.groupeDossiers",
    entrees: [
      { icone: FolderOpen, cle: "nav.dossiers", href: "/dossiers", permission: "dossier:lire", compteur: "aTraiter" },
      { icone: Users, cle: "nav.clients", href: "/clients", permission: "dossier:lire" },
      { icone: ListChecks, cle: "nav.plansAction", href: "/plans-action", permission: "dossier:lire" },
      { icone: CalendarCheck, cle: "nav.visites", href: "/visites", permission: "dossier:lire" },
    ],
  },
  {
    titre: "nav.groupePilotage",
    entrees: [
      { icone: LineChart, cle: "nav.reporting", href: "/reporting", permission: "reporting:lire" },
      { icone: ThermometerSun, cle: "nav.climat", href: "/climat", permission: "climat:lire", climat: true },
    ],
  },
  {
    titre: "nav.groupeReference",
    entrees: [
      { icone: BookOpen, cle: "nav.referentiel", href: "/referentiel" },
      { icone: ScrollText, cle: "nav.audit", href: "/audit", permission: "audit:lire" },
    ],
  },
];

const SANS_CADRE = ["/connexion", "/changer-mot-de-passe"];

/** Cadre : menu latéral pleine hauteur (collant), barre supérieure, contenu. */
export function CadreApplication({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { t, session } = useApp();
  const [ouvert, setOuvert] = useState(false);
  const fermer = useCallback(() => setOuvert(false), []);
  useEffect(() => setOuvert(false), [pathname]);
  if (SANS_CADRE.some((p) => pathname.startsWith(p)) || pathname.includes("/impression")) return <>{children}</>;
  return (
    <div className="flex min-h-screen bg-background">
      <MenuLateral ouvertMobile={ouvert} onFermer={fermer} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarreSuperieure onOuvrirMenu={() => setOuvert(true)} />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1400px]">
            {!session || ecranAutorise(pathname, session.permissions) ? (
              children
            ) : (
              <Carte>
                <Vide
                  icone={<ShieldAlert size={28} />}
                  titre={t("erreurs.interdit")}
                  action={<Bouton variante="contour" asChild><Link href="/tableau-de-bord">{t("nav.tableauDeBord")}</Link></Bouton>}
                />
              </Carte>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function useCompteurs() {
  const pathname = usePathname();
  const [c, setC] = useState({ notifications: 0, aTraiter: 0 });
  useEffect(() => {
    let annule = false;
    api<{ notifications: number; aTraiter: number }>("/api/compteurs")
      .then((r) => !annule && setC(r))
      .catch(() => undefined);
    return () => {
      annule = true;
    };
  }, [pathname]);
  return c;
}

function MenuLateral({ ouvertMobile, onFermer }: { ouvertMobile: boolean; onFermer: () => void }) {
  const { t, habillage, peut, parametres, session } = useApp();
  const pathname = usePathname() || "/";
  const compteurs = useCompteurs();
  const actif = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const climatActif = parametres.VOLET_CLIMAT_ACTIF !== "false";
  const adminVisible = session?.permissions.some((p) => p.startsWith("admin:"));

  return (
    <>
      {ouvertMobile && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onFermer} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-[240px] shrink-0 flex-col bg-sidebar transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:rtl:translate-x-0",
          ouvertMobile ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <div className={cn("flex gap-2.5 px-4", habillage.logoUrl ? "items-start py-3" : "h-14 items-center")}>
          <Link href="/tableau-de-bord" className="flex min-w-0 flex-1 items-center gap-2.5">
            {habillage.logoUrl ? (
              <span className="flex h-12 w-full items-center justify-center rounded-lg bg-white px-3 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={habillage.logoUrl} alt={habillage.nom} className="max-h-full max-w-full object-contain" />
              </span>
            ) : (
              <>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-[10.5px] font-bold text-primary-foreground">
                  {habillage.nom.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-sidebar-accent-foreground">{habillage.nom}</span>
                  {habillage.entite && <span className="block truncate text-[11px] text-sidebar-foreground">{habillage.entite}</span>}
                </span>
              </>
            )}
          </Link>
          <button onClick={onFermer} aria-label={t("nav.fermerMenu")} className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent md:hidden">
            <X size={18} />
          </button>
        </div>

        {peut("dossier:creer") && (
          <div className="px-3 pb-1">
            <Link
              href="/dossiers/nouveau"
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              {t("nav.nouveauDossier")}
            </Link>
          </div>
        )}

        <nav aria-label="Navigation" className="flex-1 overflow-y-auto px-2.5 pb-3">
          {GROUPES.map((g) => {
            const entrees = g.entrees.filter((e) => (!e.permission || peut(e.permission)) && (!e.climat || climatActif));
            if (!entrees.length) return null;
            return (
              <div key={g.titre}>
                <p className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{t(g.titre)}</p>
                {entrees.map((e) => {
                  const Icone = e.icone;
                  const n = e.compteur ? compteurs[e.compteur] : 0;
                  const a = actif(e.href);
                  return (
                    <Link
                      key={e.href}
                      href={e.href}
                      aria-current={a ? "page" : undefined}
                      className={cn(
                        "mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors",
                        a ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icone size={16} className="shrink-0 opacity-90" />
                      <span className="truncate">{t(e.cle)}</span>
                      {n > 0 && (
                        <span
                          className={cn(
                            "ms-auto min-w-[18px] rounded-full px-1.5 text-center text-[10.5px] font-bold leading-[17px]",
                            e.compteur === "notifications" ? "bg-destructive text-destructive-foreground" : "bg-sidebar-accent-foreground/15 text-sidebar-accent-foreground"
                          )}
                        >
                          {n}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {adminVisible && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <Link href="/admin" className="flex items-center gap-2 text-[12.5px] text-sidebar-foreground/80 transition-colors hover:text-sidebar-accent-foreground">
              <Settings size={14} />
              {t("nav.parametrage")}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

function BarreSuperieure({ onOuvrirMenu }: { onOuvrirMenu: () => void }) {
  const { t, session, langues, langue, devises, deviseAffichage, changerDeviseAffichage } = useApp();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clic = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", clic);
    return () => document.removeEventListener("mousedown", clic);
  }, []);

  const changerLangue = async (code: string) => {
    await api("/api/langue", { body: { langue: code } }).catch(() => undefined);
    router.refresh();
  };
  const deconnexion = async () => {
    await api("/api/auth/deconnexion", { method: "POST" }).catch(() => undefined);
    window.location.href = "/connexion";
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <button onClick={onOuvrirMenu} aria-label={t("nav.ouvrirMenu")} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden">
        <Menu size={20} />
      </button>
      <div className="ms-auto flex items-center gap-2">
        {devises.length > 1 && (
          <label className="hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:flex" title={t("nav.deviseAffichage")}>
            <span className="sr-only">{t("nav.deviseAffichage")}</span>
            <select
              value={deviseAffichage}
              onChange={(e) => changerDeviseAffichage(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px] font-medium text-foreground"
            >
              {devises.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          </label>
        )}
        {langues.length > 1 && (
          <label className="flex items-center gap-1 text-muted-foreground" title={t("commun.langue")}>
            <Globe size={15} aria-hidden />
            <span className="sr-only">{t("commun.langue")}</span>
            <select
              value={langue}
              onChange={(e) => changerLangue(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px] font-medium text-foreground"
            >
              {langues.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nomNatif}
                </option>
              ))}
            </select>
          </label>
        )}
        <Link href="/notifications" aria-label={t("nav.notifications")} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Bell size={17} />
        </Link>
        {session && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {(session.prenom[0] ?? "") + (session.nom[0] ?? "")}
              </span>
              <span className="hidden text-start leading-tight lg:block">
                <span className="block text-[12.5px] font-semibold text-foreground">
                  {session.prenom} {session.nom}
                </span>
                <span className="block max-w-[220px] truncate text-[11px] text-muted-foreground">{session.roleLibelle}</span>
              </span>
            </button>
            {menu && (
              <div role="menu" className="absolute end-0 top-full mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                <Link role="menuitem" href="/profil" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent">
                  <User size={15} /> {t("nav.profil")}
                </Link>
                {session.permissions.some((p) => p.startsWith("admin:")) && (
                  <Link role="menuitem" href="/admin" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent">
                    <Settings size={15} /> {t("nav.parametrage")}
                  </Link>
                )}
                <Link role="menuitem" href="/referentiel" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent">
                  <ClipboardList size={15} /> {t("nav.referentiel")}
                </Link>
                <button role="menuitem" onClick={deconnexion} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-[13px] text-destructive hover:bg-accent">
                  <LogOut size={15} /> {t("nav.deconnexion")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
