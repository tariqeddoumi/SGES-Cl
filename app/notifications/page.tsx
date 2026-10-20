"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { api, useDonnees } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";
import { Bouton } from "@/components/ui/bouton";
import { Carte, Chargement, EnTete, Vide } from "@/components/ui/mise-en-page";
import { Puce } from "@/components/ui/puces";

interface Notif { id: string; type: string; titre: string; message: string; lien: string | null; lu: boolean; createdAt: string }

export default function PageNotifications() {
  const { t, fmt } = useApp();
  const { donnees, recharger } = useDonnees<Notif[]>("/api/notifications");
  const lire = async (ids?: string[]) => {
    await api("/api/notifications", { method: "PATCH", body: { ids } });
    await recharger();
  };
  const nonLues = (donnees ?? []).filter((n) => !n.lu).length;
  const libType = (x: string) => { const k = `notifications.${x}`; const v = t(k); return v === k ? x : v; };
  return (
    <div className="space-y-4">
      <EnTete titre={t("notifications.titre")} description={t("notifications.nonLues", { n: nonLues })} actions={nonLues > 0 && <Bouton variante="contour" onClick={() => lire()}><CheckCheck /> {t("notifications.toutLu")}</Bouton>} />
      <Carte sansMarge>
        {!donnees ? <div className="p-4"><Chargement /></div> : donnees.length === 0 ? <Vide icone={<Bell size={26} />} titre={t("notifications.aucune")} /> : (
          <ul className="divide-y divide-border">
            {donnees.map((n) => (
              <li key={n.id} className={cn("flex items-start gap-3 px-4 py-3", !n.lu && "bg-accent/40")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.lu ? "bg-transparent" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Puce ton={["exclusion", "categorie_a", "changement_categorie"].includes(n.type) ? "alerte" : "info"}>{libType(n.type)}</Puce>
                    <span className="text-[12px] text-muted-foreground">{fmt.dateHeure(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] font-medium">{n.lien ? <Link href={n.lien} onClick={() => !n.lu && lire([n.id])} className="hover:underline">{n.titre}</Link> : n.titre}</p>
                  {n.message && <p className="mt-0.5 whitespace-pre-line text-[13px] text-muted-foreground">{n.message}</p>}
                </div>
                {!n.lu && <Bouton variante="fantome" taille="petite" onClick={() => lire([n.id])}>{t("commun.fermer")}</Bouton>}
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
