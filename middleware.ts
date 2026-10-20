import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, lireJeton } from "./lib/session-jeton";

/**
 * Garde des écrans : sans session valide, retour à la connexion ; avec un mot de passe
 * provisoire, seul l'écran de changement est accessible. Les routes d'API contrôlent
 * elles-mêmes la session (lib/serveur/api.ts) et l'API d'intégration sa clé.
 */
const PUBLIC = ["/connexion", "/api/", "/_next/", "/favicon", "/icone"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const jeton = await lireJeton(req.cookies.get(COOKIE_SESSION)?.value);
  if (!jeton) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = pathname !== "/" ? `?retour=${encodeURIComponent(pathname + search)}` : "";
    return NextResponse.redirect(url);
  }
  if (jeton.chg && pathname !== "/changer-mot-de-passe") {
    const url = req.nextUrl.clone();
    url.pathname = "/changer-mot-de-passe";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
