/**
 * Installation des référentiels et des comptes initiaux.
 *
 *   npm run db:seed                     référentiels + administrateur (mot de passe provisoire affiché une fois)
 *   npm run db:seed -- --demo           + comptes de démonstration, clients et dossiers d'exemple
 *   npm run db:seed -- --forcer         met aussi à jour les libellés des référentiels existants
 *   npm run db:reference                référentiels seulement
 *
 * Rejouable sans risque : un élément existant (même code) n'est pas recréé, et les
 * personnalisations faites depuis l'écran Paramétrage sont conservées (sauf --forcer).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { ROLES_DEFAUT } from "../lib/permissions";
import { DEVISES, ENTITES, LANGUES, LISTES_VALEURS, TAUX_INDICATIFS } from "./donnees/organisation";
import { CRITERES_EXCLUSION, NATURE_CRITERE, NATURE_DEFAUT, QUESTIONS_CATEGORISATION } from "./donnees/exclusion-categorisation";
import { BLOCS, QUESTIONS, THEMATIQUES } from "./donnees/questionnaires";
import { REGIONS, SECTEURS } from "./donnees/secteurs-regions";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const FORCER = args.has("--forcer");
const DEMO = args.has("--demo");
const REFERENCE_SEULEMENT = args.has("--reference-seulement");

const j = (o: unknown) => JSON.stringify(o);

async function referentiels() {
  for (const l of LANGUES) {
    await prisma.langue.upsert({ where: { code: l.code }, update: FORCER ? l : {}, create: l });
  }
  for (const d of DEVISES) {
    const data = { ...d, libelle: j(d.libelle) };
    await prisma.devise.upsert({ where: { code: d.code }, update: FORCER ? data : {}, create: data });
  }
  // Cours indicatifs datés du 1er janvier 2024 : un dossier antérieur au premier cours publié ne peut pas être converti.
  const dateCours = new Date("2024-01-01T00:00:00Z");
  for (const t of TAUX_INDICATIFS) {
    await prisma.tauxChange.upsert({
      where: { deviseCode_date: { deviseCode: t.deviseCode, date: dateCours } },
      update: {},
      create: { deviseCode: t.deviseCode, date: dateCours, taux: t.taux, source: "Indicatif (installation)" },
    });
  }

  for (const [i, r] of ROLES_DEFAUT.entries()) {
    const data = { code: r.code, libelle: j(r.libelle), permissions: j(r.permissions), systeme: true, ordre: i };
    await prisma.role.upsert({ where: { code: r.code }, update: FORCER ? data : {}, create: data });
  }

  // Organisation : le chemin matérialisé suit l'ordre parent → enfant de la liste.
  for (const e of ENTITES) {
    const existe = await prisma.entite.findUnique({ where: { code: e.code } });
    if (existe) continue;
    const parent = e.parent ? await prisma.entite.findUniqueOrThrow({ where: { code: e.parent } }) : null;
    const cree = await prisma.entite.create({
      data: {
        code: e.code,
        nom: e.nom,
        type: e.type,
        parentId: parent?.id ?? null,
        chemin: "/",
        niveau: parent ? parent.niveau + 1 : 0,
        pays: e.pays ?? "MA",
        deviseCode: e.deviseCode ?? "MAD",
        langueDefaut: e.langueDefaut ?? "fr",
      },
    });
    await prisma.entite.update({ where: { id: cree.id }, data: { chemin: `${parent?.chemin ?? "/"}${cree.id}/` } });
  }

  for (const [liste, valeurs] of Object.entries(LISTES_VALEURS)) {
    for (const [i, v] of valeurs.entries()) {
      const data = { liste, code: v.code, libelle: j(v.libelle), extra: v.extra ? j(v.extra) : null, ordre: i };
      await prisma.listeValeur.upsert({ where: { liste_code: { liste, code: v.code } }, update: FORCER ? data : {}, create: data });
    }
  }

  for (const [i, s] of SECTEURS.entries()) {
    const data = {
      code: s.code,
      libelle: j(s.libelle),
      categorieIndicative: s.categorieIndicative,
      risqueTransition: s.risqueTransition,
      sensibilitePhysique: s.sensibilitePhysique,
      facteurEmission: s.facteurEmission,
      exposeCBAM: s.exposeCBAM ?? false,
      eligibleTaxonomie: s.eligibleTaxonomie ?? false,
      ordre: i,
    };
    await prisma.secteur.upsert({ where: { code: s.code }, update: FORCER ? data : {}, create: data });
  }

  for (const [i, r] of REGIONS.entries()) {
    const [stressHydrique, secheresse, inondation, chaleurExtreme, submersionMarine, incendie, seisme] = r.a;
    const data = {
      code: r.code, pays: r.pays, libelle: j(r.libelle), stressHydrique, secheresse, inondation, chaleurExtreme,
      submersionMarine, incendie, seisme, ordre: i, source: "Synthèse qualitative indicative — à calibrer",
    };
    await prisma.region.upsert({ where: { code: r.code }, update: FORCER ? data : {}, create: data });
  }

  for (const [i, c] of CRITERES_EXCLUSION.entries()) {
    const data = { code: c.code, libelle: j(c.libelle), source: c.source, bloquant: c.bloquant ?? false, actif: c.actif ?? true, ordre: i, ...(NATURE_CRITERE[c.code] ?? NATURE_DEFAUT) };
    await prisma.critereExclusion.upsert({ where: { code: c.code }, update: FORCER ? data : {}, create: data });
  }

  for (const q of QUESTIONS_CATEGORISATION) {
    const code = `CAT${String(q.numero).padStart(2, "0")}`;
    const data = { code, numero: q.numero, categorie: q.categorie, libelle: j(q.libelle), ordre: q.numero };
    await prisma.questionCategorisation.upsert({ where: { code }, update: FORCER ? data : {}, create: data });
  }

  const themId = new Map<string, string>();
  for (const [i, t] of THEMATIQUES.entries()) {
    const data = { code: t.code, libelle: j(t.libelle), normes: t.normes, ordre: i };
    const r = await prisma.thematique.upsert({ where: { code: t.code }, update: FORCER ? data : {}, create: data });
    themId.set(t.code, r.id);
  }
  const blocId = new Map<string, string>();
  for (const [i, b] of BLOCS.entries()) {
    const data = { code: b.code, libelle: j(b.libelle), thematiqueId: themId.get(b.thematique)!, ordre: i };
    const r = await prisma.bloc.upsert({ where: { code: b.code }, update: FORCER ? data : {}, create: data });
    blocId.set(b.code, r.id);
  }
  for (const [i, q] of QUESTIONS.entries()) {
    const data = {
      code: q.code,
      blocId: blocId.get(q.bloc)!,
      categories: q.categories,
      type: q.type ?? "oui_non",
      reponseRisque: q.risque === undefined ? "non" : q.risque,
      gravite: q.gravite ?? 2,
      references: q.references ?? null,
      libelle: j(q.libelle),
      aide: q.aide ? j(q.aide) : null,
      obligatoire: q.obligatoire ?? true,
      ordre: i,
    };
    const existe = await prisma.question.findUnique({ where: { code: q.code } });
    const r = await prisma.question.upsert({ where: { code: q.code }, update: FORCER ? data : {}, create: data });
    // Actions types : créées avec la question ; complétées si la question n'en a aucune.
    const nbModeles = await prisma.modeleAction.count({ where: { questionId: r.id } });
    if (!existe || nbModeles === 0) {
      for (const [k, a] of (q.actions ?? []).entries()) {
        await prisma.modeleAction.create({
          data: { questionId: r.id, horizon: a.horizon, delaiMois: a.delaiMois ?? null, libelle: j(a.libelle), ordre: k },
        });
      }
    }
  }
}

/** Mot de passe provisoire : 14 caractères, tirage cryptographique, sans caractères ambigus. */
export function motDePasseProvisoire(): string {
  const classes = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?-+="];
  const tous = classes.join("");
  const c = classes.map((a) => a[randomInt(a.length)]);
  while (c.length < 14) c.push(tous[randomInt(tous.length)]);
  for (let i = c.length - 1; i > 0; i--) {
    const k = randomInt(i + 1);
    [c[i], c[k]] = [c[k], c[i]];
  }
  return c.join("");
}

async function administrateur() {
  const email = process.env.SGES_ADMIN_EMAIL || "admin@sges.local";
  if (await prisma.utilisateur.findUnique({ where: { email } })) return;
  const role = await prisma.role.findUniqueOrThrow({ where: { code: "admin_systeme" } });
  const mdp = motDePasseProvisoire();
  await prisma.utilisateur.create({
    data: {
      email,
      nom: "Administrateur",
      prenom: "SGES",
      roleId: role.id,
      entiteId: null,
      motDePasseHash: await bcrypt.hash(mdp, 10),
      doitChangerMdp: true,
    },
  });
  console.log("──────────────────────────────────────────────────────────");
  console.log(`  Compte administrateur : ${email}`);
  console.log(`  Mot de passe provisoire (affiché une seule fois) : ${mdp}`);
  console.log("  Il devra être changé à la première connexion.");
  console.log("──────────────────────────────────────────────────────────");
}

async function principal() {
  console.log("• Référentiels…");
  await referentiels();
  if (REFERENCE_SEULEMENT) return;
  await administrateur();
  if (DEMO) {
    const { installerDemo } = await import("./demo");
    await installerDemo(prisma);
  }
  console.log("✓ Terminé.");
}

principal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
