import { ecrireLibelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaBloc } from "@/lib/serveur/schemas-admin";

export const POST = route(
  async (req, ctx) => {
    const s = SchemaBloc.parse(await corps(req));
    const b = await prisma.bloc.create({ data: { ...s, libelle: ecrireLibelle(s.libelle), ordre: s.ordre ?? (await prisma.bloc.count()) } });
    await journaliser(ctx, "creation", "bloc", b.id, s);
    return b;
  },
  { permission: "admin:referentiels" }
);
