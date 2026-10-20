import { prisma } from "./prisma";

/**
 * Journal d'audit. L'écriture ne doit jamais faire échouer l'opération journalisée :
 * une erreur d'écriture est consignée dans les journaux du serveur.
 */
export async function journaliser(
  ctx: { utilisateur: { id: string; prenom: string; nom: string } } | null,
  action: string,
  objet: string,
  objetId?: string | null,
  details?: unknown,
  ip?: string | null
): Promise<void> {
  try {
    await prisma.journal.create({
      data: {
        utilisateurId: ctx?.utilisateur.id || null,
        utilisateurNom: ctx ? `${ctx.utilisateur.prenom} ${ctx.utilisateur.nom}` : "système",
        action,
        objet,
        objetId: objetId ?? null,
        details: details === undefined ? null : JSON.stringify(details).slice(0, 20000),
        ip: ip ?? null,
      },
    });
  } catch (e) {
    console.error("[journal]", e);
  }
}
