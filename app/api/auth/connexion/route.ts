import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nombre } from "@/lib/parametres";
import { signerJeton } from "@/lib/session-jeton";
import { adresseIp, corps, reponseErreur, verifierOrigine } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { poserLangue, poserSession } from "@/lib/serveur/cookies";
import { journaliser } from "@/lib/serveur/journal";
import { chargerParametres } from "@/lib/serveur/parametres";
import { prisma } from "@/lib/serveur/prisma";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), motDePasse: z.string().min(1).max(200) });

// Empreinte factice : un e-mail inconnu coûte le même temps qu'un mot de passe faux
// (pas de découverte des comptes existants par la mesure du temps de réponse).
let empreinteFactice: string | null = null;
const factice = () => (empreinteFactice ??= bcrypt.hashSync("sges-compte-inexistant", 10));

export async function POST(req: NextRequest) {
  try {
    verifierOrigine(req);
    const { email, motDePasse } = Schema.parse(await corps(req));
    const p = await chargerParametres();
    const u = await prisma.utilisateur.findUnique({ where: { email } });
    const maintenant = new Date();

    if (u?.verrouilleJusqua && u.verrouilleJusqua > maintenant) {
      const minutes = Math.ceil((u.verrouilleJusqua.getTime() - maintenant.getTime()) / 60000);
      throw new ErreurMetier(`Compte temporairement verrouillé (${minutes} min).`, 429, "compte_verrouille", { minutes });
    }
    const ok = await bcrypt.compare(motDePasse, u?.motDePasseHash ?? factice());
    if (!u || !u.isActive || !u.motDePasseHash || !ok) {
      if (u) {
        const tentatives = u.tentativesEchouees + 1;
        const max = nombre(p, "TENTATIVES_MAX", 5);
        await prisma.utilisateur.update({
          where: { id: u.id },
          data: {
            tentativesEchouees: tentatives >= max ? 0 : tentatives,
            verrouilleJusqua: tentatives >= max ? new Date(maintenant.getTime() + nombre(p, "VERROUILLAGE_MINUTES", 15) * 60000) : null,
          },
        });
        await journaliser(null, "connexion_echec", "utilisateur", u.id, { email }, adresseIp(req));
      }
      throw new ErreurMetier("Identifiants incorrects.", 401, "identifiants");
    }

    await prisma.utilisateur.update({ where: { id: u.id }, data: { tentativesEchouees: 0, verrouilleJusqua: null, derniereConnexion: maintenant } });
    const heures = Number(process.env.SESSION_HEURES) || nombre(p, "SESSION_HEURES", 10);
    const jeton = await signerJeton({ sub: u.id, chg: u.doitChangerMdp }, heures);
    await journaliser({ utilisateur: u }, "connexion", "utilisateur", u.id, undefined, adresseIp(req));
    const r = NextResponse.json({ data: { doitChangerMdp: u.doitChangerMdp } });
    poserSession(r, jeton, heures);
    poserLangue(r, u.langue);
    return r;
  } catch (e) {
    return reponseErreur(e);
  }
}
