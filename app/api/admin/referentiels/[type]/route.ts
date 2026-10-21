import { definition } from "@/lib/referentiels-admin";
import { corps, route } from "@/lib/serveur/api";
import { introuvable } from "@/lib/serveur/contexte";
import { oublierCours } from "@/lib/serveur/devises";
import { journaliser } from "@/lib/serveur/journal";
import { delegue, valeursPropres } from "@/lib/serveur/referentiels-admin";

export const GET = route(
  async (_req, _ctx, { type }) => {
    const def = definition(type);
    if (!def) throw introuvable("Référentiel inconnu.");
    return delegue(def).findMany({ orderBy: def.tri.map((t) => ({ [t.champ]: t.sens })) });
  },
  { permission: "admin:referentiels" }
);

export const POST = route(
  async (req, ctx, { type }) => {
    const def = definition(type);
    if (!def) throw introuvable("Référentiel inconnu.");
    const data = valeursPropres(def, await corps<Record<string, unknown>>(req), true);
    const cree = await delegue(def).create({ data });
    if (def.modele === "tauxChange" || def.modele === "devise") oublierCours();
    await journaliser(ctx, "creation", `referentiel:${type}`, String(cree[def.id ?? "id"]), data);
    return cree;
  },
  { permission: "admin:referentiels" }
);
