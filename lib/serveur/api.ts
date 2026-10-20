import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import type { Permission } from "../permissions";
import { contexteRequete, ErreurMetier, interdit, nonAutorise, type Contexte } from "./contexte";
import { ErreurCours } from "./devises";

type Params = Record<string, string>;
type Gestionnaire = (req: NextRequest, ctx: Contexte, params: Params) => Promise<Response | unknown>;

/**
 * Enveloppe commune des routes d'API authentifiées :
 *  - session obligatoire (cookie httpOnly), compte actif ;
 *  - mot de passe provisoire : aucune route métier accessible ;
 *  - permission exigée (rôle paramétrable) ;
 *  - requêtes d'écriture : l'origine doit être l'application (défense contre la
 *    falsification de requête intersite, en plus du cookie SameSite=Lax) ;
 *  - erreurs : messages sûrs (jamais de trace serveur), codes stables pour l'interface.
 */
export function route(handler: Gestionnaire, options: { permission?: Permission | Permission[]; autoriserMdpProvisoire?: boolean } = {}) {
  return async (req: NextRequest, segment: { params: Promise<unknown> }) => {
    try {
      verifierOrigine(req);
      const ctx = await contexteRequete(req);
      if (!ctx) throw nonAutorise();
      if (ctx.utilisateur.doitChangerMdp && !options.autoriserMdpProvisoire) {
        throw new ErreurMetier("Le mot de passe provisoire doit être changé.", 403, "mdp_provisoire");
      }
      const exigees = options.permission ? (Array.isArray(options.permission) ? options.permission : [options.permission]) : [];
      for (const p of exigees) if (!ctx.permissions.includes(p)) throw interdit();
      const params = ((segment?.params ? await segment.params : {}) ?? {}) as Params;
      const resultat = await handler(req, ctx, params);
      if (resultat instanceof Response) return resultat;
      return NextResponse.json({ data: resultat ?? null });
    } catch (e) {
      return reponseErreur(e);
    }
  };
}

export function verifierOrigine(req: NextRequest): void {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origine = req.headers.get("origin");
  if (!origine) return;
  const hote = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origine).host !== hote) throw interdit("Origine de la requête refusée.");
  } catch (e) {
    if (e instanceof ErreurMetier) throw e;
    throw interdit("Origine de la requête refusée.");
  }
}

export function reponseErreur(e: unknown): NextResponse {
  if (e instanceof ErreurMetier) {
    return NextResponse.json({ error: e.message, code: e.code, details: e.details }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Données invalides.",
        code: "validation",
        details: e.issues.map((i) => ({ champ: i.path.join("."), message: i.message })),
      },
      { status: 400 }
    );
  }
  if (e instanceof ErreurCours) {
    return NextResponse.json({ error: e.message, code: "cours_manquant" }, { status: 400 });
  }
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return NextResponse.json({ error: "Cet élément existe déjà (code ou identifiant en double).", code: "doublon" }, { status: 409 });
  if (code === "P2003" || code === "P2014") {
    return NextResponse.json({ error: "Élément encore utilisé : désactivez-le plutôt que de le supprimer.", code: "utilise" }, { status: 409 });
  }
  if (code === "P2025") return NextResponse.json({ error: "Élément introuvable.", code: "introuvable" }, { status: 404 });
  console.error("[api]", e);
  return NextResponse.json({ error: "Erreur interne. L'incident est consigné.", code: "interne" }, { status: 500 });
}

export async function corps<T = unknown>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ErreurMetier("Corps de requête JSON invalide.", 400, "json_invalide");
  }
}

export function adresseIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
}
