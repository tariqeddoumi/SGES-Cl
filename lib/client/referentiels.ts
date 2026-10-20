"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

export interface Referentiels {
  listes: Record<string, { code: string; libelle: string; extra: string | null }[]>;
  secteurs: { id: string; code: string; libelle: string; categorieIndicative: string | null; risqueTransition: number; sensibilitePhysique: number; facteurEmission: number; exposeCBAM: boolean; eligibleTaxonomie: boolean }[];
  regions: { id: string; code: string; pays: string; libelle: string; stressHydrique: number; secheresse: number; inondation: number; chaleurExtreme: number; submersionMarine: number; incendie: number; seisme: number }[];
  devises: { code: string; libelle: string; symbole: string; decimales: number }[];
  entites: { id: string; code: string; nom: string; type: string; niveau: number; deviseCode: string; ecriture: boolean }[];
  criteres: { id: string; code: string; libelle: string; source: string; bloquant: boolean }[];
  questionsCategorisation: { id: string; numero: number; code: string; libelle: string; categorie: string }[];
}

// Un seul chargement par session de navigation : les référentiels changent rarement.
let promesse: Promise<Referentiels> | null = null;

export function oublierReferentiels() {
  promesse = null;
}

export function useReferentiels(): Referentiels | null {
  const [r, setR] = useState<Referentiels | null>(null);
  useEffect(() => {
    promesse ??= api<Referentiels>("/api/referentiels").catch((e) => {
      promesse = null;
      throw e;
    });
    promesse.then(setR).catch(() => undefined);
  }, []);
  return r;
}
