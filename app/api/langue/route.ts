import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { corps, reponseErreur, verifierOrigine } from "@/lib/serveur/api";
import { contexteRequete } from "@/lib/serveur/contexte";
import { poserLangue } from "@/lib/serveur/cookies";
import { prisma } from "@/lib/serveur/prisma";

/** Change la langue de l'interface (y compris sur l'écran de connexion). */
export async function POST(req: NextRequest) {
  try {
    verifierOrigine(req);
    const { langue } = z.object({ langue: z.string().min(2).max(8) }).parse(await corps(req));
    const existe = await prisma.langue.findFirst({ where: { code: langue, active: true } });
    if (!existe) return NextResponse.json({ error: "Langue inconnue.", code: "validation" }, { status: 400 });
    const ctx = await contexteRequete(req);
    if (ctx) await prisma.utilisateur.update({ where: { id: ctx.utilisateur.id }, data: { langue } });
    const r = NextResponse.json({ data: { langue } });
    poserLangue(r, langue);
    return r;
  } catch (e) {
    return reponseErreur(e);
  }
}
