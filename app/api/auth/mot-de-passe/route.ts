import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { nombre } from "@/lib/parametres";
import { signerJeton } from "@/lib/session-jeton";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { poserSession } from "@/lib/serveur/cookies";
import { journaliser } from "@/lib/serveur/journal";
import { motifsRefus } from "@/lib/serveur/mot-de-passe";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ ancien: z.string().min(1), nouveau: z.string().min(1).max(200) });

export const POST = route(
  async (req, ctx) => {
    const { ancien, nouveau } = Schema.parse(await corps(req));
    const u = await prisma.utilisateur.findUniqueOrThrow({ where: { id: ctx.utilisateur.id } });
    if (!u.motDePasseHash || !(await bcrypt.compare(ancien, u.motDePasseHash))) {
      throw new ErreurMetier("Mot de passe actuel incorrect.", 400, "ancien_incorrect");
    }
    const motifs = motifsRefus(nouveau, { email: u.email, ancien });
    if (motifs.length) throw new ErreurMetier("Mot de passe trop faible.", 400, "mdp_faible", motifs);
    await prisma.utilisateur.update({ where: { id: u.id }, data: { motDePasseHash: await bcrypt.hash(nouveau, 10), doitChangerMdp: false } });
    await journaliser(ctx, "changement_mot_de_passe", "utilisateur", u.id);
    // Nouveau jeton sans l'indicateur de mot de passe provisoire.
    const heures = Number(process.env.SESSION_HEURES) || nombre(await chargerParametres(), "SESSION_HEURES", 10);
    const r = NextResponse.json({ data: null });
    poserSession(r, await signerJeton({ sub: u.id }, heures), heures);
    return r;
  },
  { autoriserMdpProvisoire: true }
);
