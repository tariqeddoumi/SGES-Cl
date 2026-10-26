import { route } from "@/lib/serveur/api";
import { dossierAutorise } from "@/lib/serveur/dossiers";
import { checklistDossier } from "@/lib/serveur/pieces";

/** Check-list documentaire (pièces attendues, manquantes, incomplètes) — sans appel à l'IA. */
export const GET = route(
  async (_req, ctx, { id }) => {
    await dossierAutorise(ctx, id);
    return checklistDossier(id);
  },
  { permission: "dossier:lire" }
);
