import bcrypt from "bcryptjs";
import { route } from "@/lib/serveur/api";
import { interdit, introuvable } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { genererMotDePasseProvisoire } from "@/lib/serveur/mot-de-passe";
import { peutEcrire } from "@/lib/serveur/perimetre";
import { prisma } from "@/lib/serveur/prisma";

/** Réinitialisation : nouveau mot de passe provisoire, à changer à la connexion suivante. */
export const POST = route(
  async (_req, ctx, { id }) => {
    const u = await prisma.utilisateur.findUnique({ where: { id } });
    if (!u) throw introuvable();
    if (!ctx.perimetre.tout && (!u.entiteId || !peutEcrire(ctx.perimetre, u.entiteId))) throw interdit();
    const mdp = genererMotDePasseProvisoire();
    await prisma.utilisateur.update({ where: { id }, data: { motDePasseHash: await bcrypt.hash(mdp, 10), doitChangerMdp: true, tentativesEchouees: 0, verrouilleJusqua: null } });
    await journaliser(ctx, "reinitialisation_mot_de_passe", "utilisateur", id);
    return { motDePasseProvisoire: mdp };
  },
  { permission: "admin:utilisateurs" }
);
