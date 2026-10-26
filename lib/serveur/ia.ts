import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { anonymiser } from "../domaine/anonymisation";
import { booleen, type Parametres } from "../parametres";
import { ErreurMetier } from "./contexte";
import { chargerParametres } from "./parametres";

/**
 * Socle commun des fonctions d'IA : contrôles de gouvernance (activation, référence de validation
 * juridique / CNDP / SSI, clé), anonymisation et appel au modèle avec sortie structurée. Aucune
 * réponse du modèle n'est enregistrée sans validation explicite d'un utilisateur.
 */
export async function exigerIA(): Promise<Parametres> {
  const p = await chargerParametres();
  if (!booleen(p, "IA_ACTIVE")) throw new ErreurMetier("L'assistant IA est désactivé (Paramétrage).", 403, "ia_inactive");
  if (!p.IA_REFERENCE_VALIDATION?.trim()) throw new ErreurMetier("Assistant IA non autorisé : la référence de validation juridique / CNDP / SSI n'est pas renseignée.", 403, "ia_non_validee");
  if (!process.env.ANTHROPIC_API_KEY) throw new ErreurMetier("Clé ANTHROPIC_API_KEY absente de la configuration du serveur.", 503, "ia_indisponible");
  return p;
}

/**
 * Anonymise une structure destinée au modèle : les identifiants du client (raison sociale, comptes,
 * contacts) sont remplacés par des repères, puis le texte est passé au masque des identifiants.
 */
export function anonymiserPourIA(valeur: unknown, p: Parametres, remplacements: Record<string, string> = {}): { texte: string; masques: Record<string, number> } {
  let texte = JSON.stringify(valeur, null, 1);
  for (const [vrai, repere] of Object.entries(remplacements)) {
    if (vrai && vrai.trim().length >= 3) texte = texte.split(vrai).join(repere);
  }
  if (!booleen(p, "IA_ANONYMISER")) return { texte, masques: {} };
  return anonymiser(texte);
}

export async function appelerIA<S extends z.ZodType>(p: Parametres, o: { systeme: string; contenu: string; format: S; maxTokens?: number; effort?: "low" | "medium" | "high" }) {
  const client = new Anthropic();
  const reponse = await client.beta.messages.parse({
    model: p.IA_MODELE || "claude-opus-5-5",
    max_tokens: o.maxTokens ?? 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: o.effort ?? "medium", format: betaZodOutputFormat(o.format) },
    system: o.systeme,
    messages: [{ role: "user", content: o.contenu }],
  });
  if (reponse.stop_reason === "refusal") throw new ErreurMetier("La demande a été refusée par le modèle.", 422, "ia_refus");
  const sortie = reponse.parsed_output as z.infer<S> | null;
  if (!sortie) throw new ErreurMetier("Réponse de l'assistant illisible.", 502, "ia_format");
  return { sortie, modele: reponse.model };
}
