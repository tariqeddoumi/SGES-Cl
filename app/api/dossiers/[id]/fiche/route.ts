import { route } from "@/lib/serveur/api";
import { dossierAutorise } from "@/lib/serveur/dossiers";
import { construireFiche } from "@/lib/serveur/fiche";

export const GET = route(
  async (req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    return construireFiche(id, req.nextUrl.searchParams.get("langue") ?? ctx.langue);
  },
  { permission: "dossier:lire" }
);
