"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/application";

/** Fenêtre modale accessible (focus piégé, Échap pour fermer). */
export function Dialogue({
  ouvert,
  onFermer,
  titre,
  description,
  children,
  pied,
  large,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  pied?: React.ReactNode;
  large?: boolean;
}) {
  const { t } = useApp();
  return (
    <RadixDialog.Root open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-card shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            large ? "max-w-3xl" : "max-w-lg"
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-[15px] font-semibold text-foreground">{titre}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-[12.5px] text-muted-foreground">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{typeof titre === "string" ? titre : ""}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close aria-label={t("commun.fermer")} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X size={17} />
            </RadixDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {pied && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{pied}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
