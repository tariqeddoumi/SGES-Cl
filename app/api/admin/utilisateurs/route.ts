import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { corps, route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { genererMotDePasseProvisoire } from "@/lib/serveur/mot-de-passe";
import { controlerAttribution } from "@/lib/serveur/utilisateurs-admin";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaUtilisateur } from "@/lib/serveur/schemas-admin";

export const GET = route(
  async (_req, ctx) => {
    const where: Prisma.UtilisateurWhereInput = ctx.perimetre.tout ? {} : { entiteId: { in: ctx.perimetre.lecture } };
    return prisma.utilisateur.findMany({
      where,
      orderBy: [{ nom: "asc" }],
      select: {
        id: true, email: true, nom: true, prenom: true, matricule: true, fonction: true, telephone: true, roleId: true, entiteId: true,
        porteeEcriture: true, langue: true, isActive: true, doitChangerMdp: true, derniereConnexion: true, verrouilleJusqua: true,
        role: { select: { code: true, libelle: true } }, entite: { select: { nom: true } },
      },
    });
  },
  { permission: "admin:utilisateurs" }
);

export const POST = route(
  async (req, ctx) => {
    const s = SchemaUtilisateur.parse(await corps(req));
    await controlerAttribution(ctx, s.entiteId, s.roleId);
    const mdp = genererMotDePasseProvisoire();
    const u = await prisma.utilisateur.create({ data: { ...s, entiteId: s.entiteId ?? null, motDePasseHash: await bcrypt.hash(mdp, 10), doitChangerMdp: true } });
    await journaliser(ctx, "creation", "utilisateur", u.id, { email: u.email, roleId: u.roleId, entiteId: u.entiteId });
    // Le mot de passe provisoire n'est affiché qu'une fois ; seule son empreinte est conservée.
    return { id: u.id, motDePasseProvisoire: mdp };
  },
  { permission: "admin:utilisateurs" }
);
