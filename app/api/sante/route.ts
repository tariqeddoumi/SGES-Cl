import { NextResponse } from "next/server";
import { moteurBase, prisma } from "@/lib/serveur/prisma";

/** Sonde de supervision : l'application répond et la base est joignable. */
export async function GET() {
  const debut = Date.now();
  try {
    await prisma.parametre.count();
    return NextResponse.json({ statut: "ok", base: moteurBase(), latenceMs: Date.now() - debut });
  } catch {
    return NextResponse.json({ statut: "degrade", base: moteurBase() }, { status: 503 });
  }
}
