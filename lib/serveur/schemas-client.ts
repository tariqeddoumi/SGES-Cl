import { z } from "zod";

const texte = (max: number) => z.string().trim().max(max).nullable().optional();

export const SchemaClient = z.object({
  entiteId: z.string().optional(),
  compteCourant: z
    .string()
    .trim()
    .regex(/^\d{20}$/, "20 chiffres")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  codeClient: texte(40),
  raisonSociale: z.string().trim().min(2).max(300),
  formeJuridique: texte(40),
  comptePortefeuille: texte(80),
  identifiantFiscal: texte(40),
  registreCommerce: texte(40),
  ice: texte(40),
  secteurId: texte(40),
  segment: texte(20),
  pays: z.string().trim().max(3).optional(),
  ville: texte(120),
  adresse: texte(1000),
  contactNom: texte(200),
  contactPoste: texte(200),
  contactTelephone: texte(60),
  contactEmail: z.string().trim().email().max(200).nullable().optional().or(z.literal("").transform(() => null)),
  sourceSignaletique: z.enum(["saisie", "simulation", "api"]).optional(),
});
