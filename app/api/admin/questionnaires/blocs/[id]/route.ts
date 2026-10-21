import { ecrireLibelle } from "@/lib/i18n/libelle";
import { corps, route } from "@/lib/serveur/api";
import { journaliser } from "@/lib/serveur/journal";
import { prisma } from "@/lib/serveur/prisma";
import { SchemaBloc } from "@/lib/serveur/schemas-admin";

export const PATCH = route(
  async (req, ctx, { id }) => {
    const { code: _c, ...s } = SchemaBloc.partial().parse(await corps(req));
    void _c;
    const b = await prisma.bloc.update({ where: { id }, data: { ...s, libelle: s.libelle ? ecrireLibelle(s.libelle) : undefined } });
    await journaliser(ctx, "modification", "bloc", id, s);
    return b;
  },
  { permission: "admin:referentiels" }
);
