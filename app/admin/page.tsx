"use client";

import Link from "next/link";
import { Building2, Coins, Database, FileQuestion, Globe, KeyRound, ListChecks, ListOrdered, MapPinned, Ban, Factory, Settings2, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/permissions";
import { useApp } from "@/components/providers/application";
import { EnTete } from "@/components/ui/mise-en-page";

const TUILES: { groupe: string; elements: { href: string; cle: string; icone: LucideIcon; permission: Permission }[] }[] = [
  {
    groupe: "admin.groupe_regles",
    elements: [
      { href: "/admin/parametres", cle: "parametres", icone: Settings2, permission: "admin:parametres" },
      { href: "/admin/questionnaires", cle: "questionnaires", icone: FileQuestion, permission: "admin:referentiels" },
      { href: "/admin/referentiels/exclusion", cle: "exclusion", icone: Ban, permission: "admin:referentiels" },
      { href: "/admin/referentiels/categorisation", cle: "categorisation", icone: ListOrdered, permission: "admin:referentiels" },
      { href: "/admin/referentiels/secteurs", cle: "secteurs", icone: Factory, permission: "admin:referentiels" },
      { href: "/admin/referentiels/regions", cle: "regions", icone: MapPinned, permission: "admin:referentiels" },
      { href: "/admin/referentiels/listes", cle: "listes", icone: ListChecks, permission: "admin:referentiels" },
    ],
  },
  {
    groupe: "admin.titre",
    elements: [
      { href: "/admin/entites", cle: "entites", icone: Building2, permission: "admin:entites" },
      { href: "/admin/utilisateurs", cle: "utilisateurs", icone: Users, permission: "admin:utilisateurs" },
      { href: "/admin/roles", cle: "roles", icone: ShieldCheck, permission: "admin:utilisateurs" },
      { href: "/admin/referentiels/devises", cle: "devises", icone: Coins, permission: "admin:referentiels" },
      { href: "/admin/referentiels/langues", cle: "langues", icone: Globe, permission: "admin:referentiels" },
      { href: "/admin/api", cle: "api", icone: KeyRound, permission: "admin:api" },
      { href: "/admin/base", cle: "base", icone: Database, permission: "admin:base" },
    ],
  },
];

export default function PageAdmin() {
  const { t, peut } = useApp();
  return (
    <div className="space-y-6">
      <EnTete titre={t("admin.titre")} description={t("admin.description")} />
      {TUILES.map((g) => {
        const elements = g.elements.filter((e) => peut(e.permission));
        if (!elements.length) return null;
        return (
          <section key={g.groupe}>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{t(g.groupe)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {elements.map((e) => {
                const Icone = e.icone;
                return (
                  <Link key={e.href} href={e.href} className="flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring/60">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Icone size={17} /></span>
                    <span>
                      <span className="block text-[14px] font-semibold">{t(`admin.${e.cle}`)}</span>
                      <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{t(`admin.${e.cle}Desc`)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
