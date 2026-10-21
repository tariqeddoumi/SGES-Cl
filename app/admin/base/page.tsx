"use client";

import { Database, Download } from "lucide-react";
import { useDonnees } from "@/lib/client/api";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Bandeau, Carte, Chargement, EnTete, Indicateur } from "@/components/ui/mise-en-page";
import { Tableau, Td, Th, Tr } from "@/components/ui/tableau";

const MOTEURS: Record<string, string> = { postgresql: "PostgreSQL", sqlserver: "Microsoft SQL Server", mysql: "MySQL / MariaDB", sqlite: "SQLite" };

export default function PageBase() {
  const { t, fmt } = useApp();
  const { donnees, erreur } = useDonnees<{ moteur: string; latenceMs: number; volumes: Record<string, number> }>("/api/admin/base");
  if (erreur) return <Bandeau ton="alerte">{erreur.message}</Bandeau>;
  if (!donnees) return <Chargement lignes={6} />;
  return (
    <div className="space-y-4">
      <EnTete titre={t("admin.base")} description={t("admin.baseDesc")} retour={{ href: "/admin", libelle: t("admin.titre") }} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicateur libelle={t("admin.moteur")} valeur={MOTEURS[donnees.moteur] ?? donnees.moteur} />
        <Indicateur libelle={t("admin.tempsReponse")} valeur={donnees.latenceMs} unite="ms" ton={donnees.latenceMs > 200 ? "vigilance" : "favorable"} />
        <Indicateur libelle={t("admin.volumes")} valeur={fmt.nombre(Object.values(donnees.volumes).reduce((s, v) => s + v, 0), 0)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre={t("admin.sauvegarde")} description={t("admin.sauvegardeAide")}>
          <div className="flex flex-wrap gap-2">
            <Bouton asChild><a href="/api/admin/sauvegarde"><Download /> JSON</a></Bouton>
            <Bouton variante="contour" asChild><a href="/api/admin/sauvegarde?documents=0"><Download /> JSON ({t("pieces.titre")} : —)</a></Bouton>
          </div>
        </Carte>
        <Carte titre={t("admin.changerMoteur")}>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{t("admin.changerMoteurAide")}</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-sidebar p-3 font-mono text-[12px] text-sidebar-foreground" dir="ltr">{`npm run db:fournisseur -- sqlserver
npx prisma generate && npm run db:schema
npm run db:importer -- sges-sauvegarde.json`}</pre>
        </Carte>
      </div>
      <Carte titre={t("admin.volumes")} sansMarge>
        <Tableau>
          <thead><tr><Th><Database size={13} className="inline" /> Table</Th><Th alignFin>{t("commun.total")}</Th></tr></thead>
          <tbody>
            {Object.entries(donnees.volumes).map(([k, v]) => <Tr key={k}><Td className="font-mono text-[12px]" dir="ltr">{k}</Td><Td alignFin>{fmt.nombre(v, 0)}</Td></Tr>)}
          </tbody>
        </Tableau>
      </Carte>
    </div>
  );
}
