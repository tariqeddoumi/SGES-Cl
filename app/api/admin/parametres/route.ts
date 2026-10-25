import { z } from "zod";
import { CATALOGUE_PARAMETRES, valeurValide } from "@/lib/parametres";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier } from "@/lib/serveur/contexte";
import { journaliser } from "@/lib/serveur/journal";
import { chargerParametres, oublierParametres } from "@/lib/serveur/parametres";
import { simulationAutorisee } from "@/lib/serveur/signaletique";
import { prisma } from "@/lib/serveur/prisma";

export const GET = route(async () => ({ catalogue: CATALOGUE_PARAMETRES, valeurs: await chargerParametres() }), { permission: "admin:parametres" });

export const PUT = route(
  async (req, ctx) => {
    const valeurs = z.record(z.string(), z.string()).parse(await corps(req));
    const avant = await chargerParametres();
    const erreurs: { champ: string; message: string }[] = [];
    for (const [cle, v] of Object.entries(valeurs)) {
      const def = CATALOGUE_PARAMETRES.find((d) => d.cle === cle);
      if (!def) erreurs.push({ champ: cle, message: "inconnu" });
      else if (!valeurValide(def, v)) erreurs.push({ champ: cle, message: "invalide" });
    }
    if (valeurs.DEVISE_REFERENCE && !(await prisma.devise.findUnique({ where: { code: valeurs.DEVISE_REFERENCE } }))) erreurs.push({ champ: "DEVISE_REFERENCE", message: "invalide" });
    if (valeurs.SIGNALETIQUE_MODE === "simulation" && !simulationAutorisee()) erreurs.push({ champ: "SIGNALETIQUE_MODE", message: "simulation interdite en production" });
    // Gouvernance de l'IA (constat F15) : activation subordonnée à la référence de validation juridique / CNDP / SSI.
    const iaActive = (valeurs.IA_ACTIVE ?? avant.IA_ACTIVE) === "true";
    const reference = (valeurs.IA_REFERENCE_VALIDATION ?? avant.IA_REFERENCE_VALIDATION ?? "").trim();
    if (iaActive && !reference) erreurs.push({ champ: "IA_ACTIVE", message: "référence de validation (juridique, CNDP, SSI) requise" });
    if (erreurs.length) throw new ErreurMetier("Valeurs invalides.", 400, "validation", erreurs);
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (avant[cle] === valeur) continue;
      await prisma.parametre.upsert({ where: { cle }, update: { valeur, updatedById: ctx.utilisateur.id }, create: { cle, valeur, updatedById: ctx.utilisateur.id } });
      await journaliser(ctx, "parametre", "parametre", cle, { avant: avant[cle], apres: valeur });
    }
    oublierParametres();
    return chargerParametres();
  },
  { permission: "admin:parametres" }
);
