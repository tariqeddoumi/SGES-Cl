import { route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { exporterTout } from "@/lib/serveur/sauvegarde";

/** Téléchargement de la sauvegarde logique complète (JSON portable). */
export const GET = route(
  async (req, ctx) => {
    const sansDocuments = req.nextUrl.searchParams.get("documents") === "0";
    const s = await exporterTout({ sansDocuments });
    await journaliser(ctx, "sauvegarde", "base", null, { sansDocuments });
    return new Response(JSON.stringify(s), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="sges-sauvegarde-${s.date.slice(0, 10)}.json"` },
    });
  },
  { permission: "admin:base" }
);
