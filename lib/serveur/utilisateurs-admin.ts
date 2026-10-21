import { lirePermissions } from "../permissions";
import { interdit, type Contexte } from "./contexte";
import { peutEcrire } from "./perimetre";
import { prisma } from "./prisma";

/**
 * Un administrateur rattaché à une entité gère les comptes de sa branche ; il ne peut
 * ni créer de compte sans entité ni attribuer un rôle d'administration qu'il n'a pas.
 */
export async function controlerAttribution(ctx: Contexte, entiteId: string | null | undefined, roleId: string) {
  if (!entiteId ? !ctx.perimetre.tout : !peutEcrire(ctx.perimetre, entiteId) && !ctx.perimetre.tout) throw interdit("Entité hors de votre périmètre.");
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw interdit("Rôle inconnu.");
  const manquantes = lirePermissions(role.permissions).filter((p) => p.startsWith("admin:") && !ctx.permissions.includes(p));
  if (manquantes.length) throw interdit("Vous ne pouvez pas attribuer des droits d'administration que vous n'avez pas.");
}

