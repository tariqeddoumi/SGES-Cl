import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Montants et cours sont stockés en DECIMAL exact (jamais en virgule flottante) : la base garde la
 * valeur au centime et au 10⁻¹⁰ près. Le reste de l'application manipule des nombres déjà arrondis
 * (lib/devises.ts::arrondirMontant) ; cette extension les restitue donc en `number`, sans perte pour
 * des montants inférieurs à 10¹³ à deux décimales.
 */
const dec = (v: Prisma.Decimal) => v.toNumber();
const decN = (v: Prisma.Decimal | null) => (v === null ? null : v.toNumber());

function creerClient() {
  return new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] }).$extends({
    name: "montants-decimaux",
    result: {
      entite: { seuilDeclenchement: { needs: { seuilDeclenchement: true }, compute: (e) => decN(e.seuilDeclenchement) } },
      tauxChange: { taux: { needs: { taux: true }, compute: (t) => dec(t.taux) } },
      dossier: {
        montantDemande: { needs: { montantDemande: true }, compute: (d) => dec(d.montantDemande) },
        montantInvestissement: { needs: { montantInvestissement: true }, compute: (d) => decN(d.montantInvestissement) },
        tauxReference: { needs: { tauxReference: true }, compute: (d) => dec(d.tauxReference) },
        montantDemandeRef: { needs: { montantDemandeRef: true }, compute: (d) => dec(d.montantDemandeRef) },
        montantInvestissementRef: { needs: { montantInvestissementRef: true }, compute: (d) => decN(d.montantInvestissementRef) },
        montantAccorde: { needs: { montantAccorde: true }, compute: (d) => decN(d.montantAccorde) },
        encours: { needs: { encours: true }, compute: (d) => decN(d.encours) },
      },
      action: { budget: { needs: { budget: true }, compute: (a) => decN(a.budget) } },
      evaluationClimat: {
        montantAttribueRef: { needs: { montantAttribueRef: true }, compute: (c) => decN(c.montantAttribueRef) },
        ebeAnnuel: { needs: { ebeAnnuel: true }, compute: (c) => decN(c.ebeAnnuel) },
      },
    },
  });
}

export type ClientPrisma = ReturnType<typeof creerClient>;
/** Client transactionnel (callback de prisma.$transaction). */
export type Tx = Parameters<Parameters<ClientPrisma["$transaction"]>[0]>[0];

/**
 * Client Prisma unique : en développement, le rechargement à chaud recréerait un client
 * (et un pool de connexions) à chaque modification de fichier.
 */
const globalPourPrisma = globalThis as unknown as { prisma?: ClientPrisma };

export const prisma = globalPourPrisma.prisma ?? creerClient();

if (process.env.NODE_ENV !== "production") globalPourPrisma.prisma = prisma;

/** Moteur de base en service (postgresql, sqlserver, mysql, sqlite), lu de l'adresse. */
export function moteurBase(url = process.env.DATABASE_URL ?? ""): string {
  if (url.startsWith("postgres")) return "postgresql";
  if (url.startsWith("sqlserver")) return "sqlserver";
  if (url.startsWith("mysql")) return "mysql";
  if (url.startsWith("file:")) return "sqlite";
  return "inconnu";
}
