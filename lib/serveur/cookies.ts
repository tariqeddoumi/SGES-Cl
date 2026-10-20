import type { NextResponse } from "next/server";
import { COOKIE_LANGUE, COOKIE_SESSION } from "../session-jeton";

const securise = () => process.env.NODE_ENV === "production" && process.env.COOKIE_NON_SECURISE !== "true";

export function poserSession(r: NextResponse, jeton: string, heures: number) {
  r.cookies.set(COOKIE_SESSION, jeton, { httpOnly: true, sameSite: "lax", secure: securise(), path: "/", maxAge: Math.round(heures * 3600) });
}

export function effacerSession(r: NextResponse) {
  r.cookies.set(COOKIE_SESSION, "", { httpOnly: true, sameSite: "lax", secure: securise(), path: "/", maxAge: 0 });
}

export function poserLangue(r: NextResponse, langue: string) {
  r.cookies.set(COOKIE_LANGUE, langue, { httpOnly: false, sameSite: "lax", secure: securise(), path: "/", maxAge: 365 * 24 * 3600 });
}
