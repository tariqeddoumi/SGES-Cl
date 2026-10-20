import { route } from "@/lib/serveur/api";
import { dossierAutorise, genererPlan } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";

export const POST = route(
  async (_req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    return genererPlan(id, ctx.langue);
  },
  { permission: "dossier:modifier" }
);
