/**
 * Contrôle d'une base avant branchement : connexion, schéma, référentiels, comptes.
 *   npm run db:verifier
 */
import { moteurBase, prisma } from "../../lib/serveur/prisma";
import { lirePermissions } from "../../lib/permissions";
import { volumes } from "../../lib/serveur/sauvegarde";

async function principal() {
  let ko = 0;
  const ok = (cond: boolean, msg: string) => {
    console.log(`${cond ? "✓" : "✗"} ${msg}`);
    if (!cond) ko++;
  };
  console.log(`Moteur : ${moteurBase()}`);
  const v = await volumes().catch((e) => {
    console.error("✗ Schéma absent ou incomplet :", e.message);
    process.exit(1);
  });
  ok(true, "Toutes les tables de l'application sont présentes");
  ok(v.langue > 0 && v.devise > 0, "Langues et devises installées");
  ok(v.critereExclusion > 0, "Liste d'exclusion installée");
  ok(v.questionCategorisation >= 25, "Formulaire de catégorisation (25 éléments)");
  ok(v.question > 0 && v.modeleAction > 0, "Questionnaires et actions correctives");
  ok(v.entite > 0, "Organisation (au moins une entité)");
  const roles = await prisma.role.findMany({ include: { _count: { select: { utilisateurs: true } } } });
  const admins = roles.filter((r) => lirePermissions(r.permissions).includes("admin:parametres")).reduce((s, r) => s + r._count.utilisateurs, 0);
  ok(admins > 0, "Au moins un administrateur");
  for (const [t, n] of Object.entries(v)) console.log(`  ${t.padEnd(24)} ${n}`);
  if (ko) {
    console.log(`${ko} point(s) bloquant(s).`);
    process.exit(1);
  }
}

principal().finally(() => prisma.$disconnect());
