import { z } from "zod";
import { CONFORMITES, TYPES_VISITE } from "../domaine/constantes";

/** Champs d'identification d'un dossier (création et modification). */
export const SchemaIdentification = z.object({
  typeCredit: z.string().max(40).nullable().optional(),
  natureProjet: z.string().max(40).nullable().optional(),
  objet: z.string().max(4000).nullable().optional(),
  descriptionProcessus: z.string().max(8000).nullable().optional(),
  projetDeveloppementDurable: z.boolean().optional(),
  secteurId: z.string().max(40).nullable().optional(),
  deviseCode: z.string().length(3).optional(),
  montantDemande: z.number().positive().max(1e15).optional(),
  montantInvestissement: z.number().nonnegative().max(1e15).nullable().optional(),
  dureeMois: z.number().int().min(1).max(600).nullable().optional(),
  adresseSite: z.string().max(2000).nullable().optional(),
  localite: z.string().max(200).nullable().optional(),
  regionId: z.string().max(40).nullable().optional(),
  typeZone: z.string().max(40).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  dateDossier: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});


/** Visite de site. */
export const SchemaVisite = z.object({
  date: z.string().min(8),
  type: z.enum(TYPES_VISITE),
  participants: z.string().max(2000).nullable().optional(),
  constats: z.string().max(20000).nullable().optional(),
  conformite: z.enum(CONFORMITES).nullable().optional(),
  recommandations: z.string().max(20000).nullable().optional(),
  prochaineVisite: z.string().nullable().optional(),
});

