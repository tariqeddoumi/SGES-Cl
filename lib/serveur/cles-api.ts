import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { ErreurMetier } from "./contexte";
import { calculerPerimetre, chargerArbre, type Perimetre } from "./perimetre";
import { prisma } from "./prisma";

/** Empreinte SHA-256 d'une clé : la clé elle-même n'est jamais stockée. */
export function empreinte(cle: string): string {
  return createHash("sha256").update(cle).digest("hex");
}

export function nouvelleCle(): { cle: string; prefixe: string; empreinte: string } {
  const cle = `sges_${randomBytes(30).toString("base64url")}`;
  return { cle, prefixe: cle.slice(0, 12), empreinte: empreinte(cle) };
}

/**
 * Authentifie un appel de la plateforme d'octroi (en-tête X-API-Key). Une clé rattachée
 * à une entité ne voit que cette entité et sa descendance.
 */
export async function authentifierCle(req: NextRequest): Promise<{ id: string; nom: string; perimetre: Perimetre }> {
  const cle = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!cle) throw new ErreurMetier("Clé d'API absente (en-tête X-API-Key).", 401, "non_authentifie");
  const e = empreinte(cle);
  const c = await prisma.cleApi.findUnique({ where: { empreinte: e } });
  if (!c || !timingSafeEqual(Buffer.from(c.empreinte), Buffer.from(e)) || !c.actif || (c.expireLe && c.expireLe < new Date())) {
    throw new ErreurMetier("Clé d'API invalide, révoquée ou expirée.", 401, "non_authentifie");
  }
  await prisma.cleApi.update({ where: { id: c.id }, data: { derniereUtilisation: new Date() } });
  const perimetre = calculerPerimetre(await chargerArbre(), { entiteId: c.entiteId, administrateur: !c.entiteId });
  return { id: c.id, nom: c.nom, perimetre };
}
