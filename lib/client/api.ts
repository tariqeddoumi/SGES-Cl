"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dictionnaire, traduire } from "@/lib/i18n";

/**
 * Appels à l'API depuis le navigateur. La session est portée par un cookie httpOnly :
 * aucun jeton n'est manipulé en JavaScript (rien à voler par injection de script).
 */

export class ErreurApi extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
  }
}

/**
 * Les messages d'erreur du serveur sont rédigés en français (souvent plus précis que le code) :
 * en français on les garde, dans les autres langues on affiche la traduction du code d'erreur.
 */
function messageLocalise(code: string | undefined, message: string): string {
  const langue = typeof document !== "undefined" ? document.documentElement.lang : "fr";
  if (!code || !langue || langue === "fr") return message;
  const cle = `erreurs.${code}`;
  const traduit = traduire(dictionnaire(langue), cle);
  return traduit === cle ? message : traduit;
}

export async function api<T = unknown>(url: string, options: { method?: string; body?: unknown; formData?: FormData } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      method: options.method ?? (options.body || options.formData ? "POST" : "GET"),
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      credentials: "same-origin",
    });
  } catch {
    throw new ErreurApi("Le serveur ne répond pas.", 0, "reseau");
  }
  if (r.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/auth/")) {
    window.location.href = `/connexion?retour=${encodeURIComponent(window.location.pathname)}`;
  }
  const texte = await r.text();
  let json: { data?: T; error?: string; code?: string; details?: unknown } = {};
  try {
    json = texte ? JSON.parse(texte) : {};
  } catch {
    /* réponse non JSON */
  }
  if (!r.ok) {
    // Erreur de validation : le message nomme les champs refusés, sur tous les écrans.
    const champs =
      json.code === "validation" && Array.isArray(json.details)
        ? [...new Set((json.details as { champ?: string }[]).map((d) => d.champ).filter(Boolean))].join(", ")
        : "";
    const message = messageLocalise(json.code, json.error ?? `Erreur ${r.status}`) + (champs ? ` (${champs})` : "");
    throw new ErreurApi(message, r.status, json.code ?? "interne", json.details);
  }
  return json.data as T;
}

/** Chargement d'une ressource avec rechargement à la demande. */
export function useDonnees<T>(url: string | null) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<ErreurApi | null>(null);
  const [chargement, setChargement] = useState(!!url);
  const dernier = useRef(0);

  const recharger = useCallback(async () => {
    if (!url) return;
    const n = ++dernier.current;
    setChargement(true);
    try {
      const d = await api<T>(url);
      if (n === dernier.current) {
        setDonnees(d);
        setErreur(null);
      }
    } catch (e) {
      if (n === dernier.current) setErreur(e instanceof ErreurApi ? e : new ErreurApi(String(e), 0, "interne"));
    } finally {
      if (n === dernier.current) setChargement(false);
    }
  }, [url]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { donnees, erreur, chargement, recharger, setDonnees };
}
