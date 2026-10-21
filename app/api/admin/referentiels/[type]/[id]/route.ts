import { definition } from "@/lib/referentiels-admin";
import { corps, route } from "@/lib/serveur/api";
import { ErreurMetier, introuvable } from "@/lib/serveur/contexte";
import { oublierCours } from "@/lib/serveur/devises";
import { journaliser } from "@/lib/serveur/journal";
import { delegue, utilisations, valeursPropres } from "@/lib/serveur/referentiels-admin";

export const PATCH = route(
  async (req, ctx, { type, id }) => {
    const def = definition(type);
    if (!def) throw introuvable("Référentiel inconnu.");
    const where = { [def.id ?? "id"]: id };
    const avant = await delegue(def).findUnique({ where });
    if (!avant) throw introuvable();
    const data = valeursPropres(def, await corps<Record<string, unknown>>(req), false);
    const maj = await delegue(def).update({ where, data });
    if (def.modele === "tauxChange" || def.modele === "devise") oublierCours();
    await journaliser(ctx, "modification", `referentiel:${type}`, id, { avant, apres: data });
    return maj;
  },
  { permission: "admin:referentiels" }
);

/** Suppression réservée aux éléments jamais utilisés ; sinon, désactiver. */
export const DELETE = route(
  async (_req, ctx, { type, id }) => {
    const def = definition(type);
    if (!def) throw introuvable("Référentiel inconnu.");
    const where = { [def.id ?? "id"]: id };
    const element = await delegue(def).findUnique({ where });
    if (!element) throw introuvable();
    if ((await utilisations(def, element)) > 0) throw new ErreurMetier("Élément encore utilisé : désactivez-le plutôt que de le supprimer.", 409, "utilise");
    await delegue(def).delete({ where });
    if (def.modele === "tauxChange" || def.modele === "devise") oublierCours();
    await journaliser(ctx, "suppression", `referentiel:${type}`, id, element);
    return { ok: true };
  },
  { permission: "admin:referentiels" }
);
