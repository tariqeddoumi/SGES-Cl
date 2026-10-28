import { route } from "@/lib/serveur/api";
import { dossierAutorise, genererPlan, recalculer } from "@/lib/serveur/dossiers";
import { exigerVolet } from "@/lib/serveur/etat-dossier";

export const POST = route(
  async (_req, ctx, { id }) => {
    const d = await dossierAutorise(ctx, id, "ecriture");
    exigerVolet(ctx, d, "evaluation");
    const r = await genererPlan(id, ctx.langue);
    await recalculer(id);
    return r;
  },
  { permission: "dossier:modifier" }
);
