"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { convertir, formatDate, formatDateHeure, formatMontant, formatMontantCompact, formatNombre, type Cours } from "@/lib/devises";
import { traduire, type Messages, type Variables } from "@/lib/i18n";
import { libelle as lireLib, type Libelle } from "@/lib/i18n/libelle";
import type { Permission } from "@/lib/permissions";

export interface SessionClient {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  roleCode: string;
  roleLibelle: string;
  entiteId: string | null;
  entiteNom: string | null;
  permissions: Permission[];
  deviseAffichage: string | null;
  doitChangerMdp: boolean;
}

export interface DeviseClient {
  code: string;
  symbole: string;
  decimales: number;
  libelle: string;
}

export interface LangueClient {
  code: string;
  nomNatif: string;
  rtl: boolean;
}

export interface Habillage {
  nom: string;
  sousTitre: string;
  logoUrl: string;
  couleur: string;
  entite: string | null;
}

interface ValeurApp {
  langue: string;
  rtl: boolean;
  t: (cle: string, vars?: Variables) => string;
  /** Libellé multilingue d'un référentiel dans la langue courante. */
  lib: (texte: string | Libelle | null | undefined) => string;
  parametres: Record<string, string>;
  session: SessionClient | null;
  habillage: Habillage;
  devises: DeviseClient[];
  langues: LangueClient[];
  deviseReference: string;
  deviseAffichage: string;
  changerDeviseAffichage: (code: string) => void;
  peut: (p: Permission) => boolean;
  fmt: {
    montant: (m: number | null | undefined, devise: string) => string;
    compact: (m: number | null | undefined, devise: string) => string;
    /** Montant exprimé en devise de référence, affiché dans la devise choisie par l'utilisateur. */
    ref: (m: number | null | undefined, compact?: boolean) => string;
    nombre: (n: number | null | undefined, decimales?: number) => string;
    date: (d: Date | string | null | undefined) => string;
    dateHeure: (d: Date | string | null | undefined) => string;
  };
}

const Contexte = createContext<ValeurApp | null>(null);

export function FournisseurApplication({
  langue,
  rtl,
  messages,
  parametres,
  session,
  habillage,
  devises,
  langues,
  cours,
  children,
}: {
  langue: string;
  rtl: boolean;
  messages: Messages;
  parametres: Record<string, string>;
  session: SessionClient | null;
  habillage: Habillage;
  devises: DeviseClient[];
  langues: LangueClient[];
  cours: Cours[];
  children: React.ReactNode;
}) {
  const deviseReference = parametres.DEVISE_REFERENCE || "MAD";
  const [deviseAffichage, setDeviseAffichage] = useState(session?.deviseAffichage || deviseReference);

  const changerDeviseAffichage = useCallback((code: string) => {
    setDeviseAffichage(code);
    // Préférence mémorisée côté serveur ; un échec n'empêche pas l'affichage.
    fetch("/api/moi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviseAffichage: code }),
    }).catch(() => undefined);
  }, []);

  const valeur = useMemo<ValeurApp>(() => {
    const t = (cle: string, vars?: Variables) => traduire(messages, cle, vars);
    return {
      langue,
      rtl,
      t,
      lib: (texte) => lireLib(texte, langue),
      parametres,
      session,
      habillage,
      devises,
      langues,
      deviseReference,
      deviseAffichage,
      changerDeviseAffichage,
      peut: (p) => !!session?.permissions.includes(p),
      fmt: {
        // Montants d'engagement : à l'unité, sans décimales.
        montant: (m, devise) => formatMontant(m, devise, langue, 0),
        compact: (m, devise) => formatMontantCompact(m, devise, langue),
        ref: (m, compact = true) => {
          if (m === null || m === undefined) return "—";
          const v = convertir(m, deviseReference, deviseAffichage, cours, deviseReference) ?? m;
          const d = v === m && deviseAffichage !== deviseReference ? deviseReference : deviseAffichage;
          return compact ? formatMontantCompact(v, d, langue) : formatMontant(v, d, langue);
        },
        nombre: (n, decimales = 1) => formatNombre(n, langue, decimales),
        date: (d) => formatDate(d, langue),
        dateHeure: (d) => formatDateHeure(d, langue),
      },
    };
  }, [langue, rtl, messages, parametres, session, habillage, devises, langues, cours, deviseReference, deviseAffichage, changerDeviseAffichage]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useApp(): ValeurApp {
  const v = useContext(Contexte);
  if (!v) throw new Error("useApp hors de FournisseurApplication");
  return v;
}

/** Raccourci : traduction seule. */
export function useT() {
  return useApp().t;
}
