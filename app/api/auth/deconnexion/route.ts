import { NextResponse, type NextRequest } from "next/server";
import { contexteRequete } from "@/lib/serveur/contexte";
import { effacerSession } from "@/lib/serveur/cookies";
import { journaliser } from "@/lib/serveur/journal";

export async function POST(req: NextRequest) {
  const ctx = await contexteRequete(req).catch(() => null);
  if (ctx) await journaliser(ctx, "deconnexion", "utilisateur", ctx.utilisateur.id);
  const r = NextResponse.json({ data: null });
  effacerSession(r);
  return r;
}
