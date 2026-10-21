import { z } from "zod";
import { TYPES_ENTITE } from "../domaine/constantes";
import { PERMISSIONS } from "../permissions";

const opt = (max: number) => z.string().trim().max(max).nullable().optional().or(z.literal("").transform(() => null));

export const SchemaEntite = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  nom: z.string().trim().min(2).max(200),
  type: z.enum(TYPES_ENTITE),
  parentId: z.string().nullable().optional(),
  pays: z.string().trim().min(2).max(3),
  deviseCode: z.string().length(3),
  langueDefaut: z.string().min(2).max(8),
  seuilDeclenchement: z.number().positive().nullable().optional(),
  nomOutil: opt(100),
  logoUrl: z.string().trim().max(500).regex(/^(https:\/\/|\/)/).nullable().optional().or(z.literal("").transform(() => null)),
  couleurPrimaire: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).nullable().optional().or(z.literal("").transform(() => null)),
  isActive: z.boolean().optional(),
});

export const SchemaUtilisateur = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  nom: z.string().trim().min(1).max(100),
  prenom: z.string().trim().min(1).max(100),
  matricule: opt(40),
  fonction: opt(120),
  telephone: opt(40),
  roleId: z.string().min(1),
  entiteId: z.string().nullable().optional(),
  porteeEcriture: z.enum(["entite", "groupe"]).optional(),
  langue: z.string().min(2).max(8).optional(),
  isActive: z.boolean().optional(),
});

export const SchemaRole = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/),
  libelle: z.record(z.string(), z.string()),
  description: z.string().max(2000).nullable().optional(),
  permissions: z.array(z.enum(PERMISSIONS)),
  ordre: z.number().int().optional(),
});


const Libelle = z.record(z.string(), z.string());

export const SchemaBloc = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  libelle: Libelle,
  thematiqueId: z.string().min(1),
  ordre: z.number().int().optional(),
  actif: z.boolean().optional(),
});

export const SchemaQuestion = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  libelle: Libelle,
  aide: Libelle.nullable().optional(),
  blocId: z.string().min(1),
  categories: z.array(z.enum(["A", "B", "C", "FI"])).min(1),
  type: z.enum(["oui_non", "oui_non_na", "choix", "nombre", "texte"]),
  options: z.array(z.object({ code: z.string().min(1).max(40), libelle: Libelle })).nullable().optional(),
  reponseRisque: z.string().trim().max(100).nullable().optional(),
  gravite: z.number().int().min(1).max(4),
  references: z.string().max(2000).nullable().optional(),
  secteurs: z.string().max(2000).nullable().optional(),
  obligatoire: z.boolean(),
  ordre: z.number().int().optional(),
  actif: z.boolean().optional(),
  actions: z
    .array(
      z.object({
        id: z.string().optional(),
        horizon: z.enum(["court", "moyen", "long"]),
        libelle: Libelle,
        delaiMois: z.number().int().min(0).max(240).nullable().optional(),
        actif: z.boolean().optional(),
      })
    )
    .optional(),
});
