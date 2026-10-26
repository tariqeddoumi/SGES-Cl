"use client";

import { useApp } from "@/components/providers/application";
import { useReferentiels } from "./referentiels";

/** Valeurs actives d'une liste paramétrable, libellées dans la langue de l'utilisateur. */
export function useListe(liste: string): { code: string; libelle: string }[] {
  const ref = useReferentiels();
  const { lib } = useApp();
  return (ref?.listes[liste] ?? []).map((v) => ({ code: v.code, libelle: lib(v.libelle) }));
}

/** Libellés d'une liste paramétrable : suggestions de saisie ou éléments types à insérer. */
export function useLibelles(liste: string): string[] {
  return useListe(liste).map((v) => v.libelle);
}
