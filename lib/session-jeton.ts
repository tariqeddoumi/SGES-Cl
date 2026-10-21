import { SignJWT, jwtVerify } from "jose";

/**
 * Jeton de session (cookie httpOnly « sges_session »), signé HS256.
 * Module sans dépendance Node : il sert aussi le middleware (environnement Edge).
 */
export const COOKIE_SESSION = "sges_session";
export const COOKIE_LANGUE = "sges_langue";

export interface ContenuJeton {
  sub: string;
  /** Mot de passe provisoire : seul l'écran de changement est accessible. */
  chg?: boolean;
}

const CLE_DEVELOPPEMENT = "developpement-uniquement-cle-sges-non-secrete-000000";

export function cleSession(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET (32 caractères minimum) doit être défini en production.");
  }
  return new TextEncoder().encode(CLE_DEVELOPPEMENT);
}

export async function signerJeton(contenu: ContenuJeton, heures: number): Promise<string> {
  return new SignJWT({ chg: contenu.chg ?? false })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(contenu.sub)
    .setIssuedAt()
    .setExpirationTime(`${Math.max(1, Math.round(heures))}h`)
    .sign(cleSession());
}

export async function lireJeton(jeton: string | undefined | null): Promise<ContenuJeton | null> {
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, cleSession(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, chg: payload.chg === true };
  } catch {
    return null;
  }
}
