import { randomInt } from "crypto";

export const LONGUEUR_MINIMALE = 12;

/** Mot de passe provisoire : 14 caractères, une de chaque classe, tirage cryptographique. */
export function genererMotDePasseProvisoire(): string {
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

/** Motifs de refus d'un mot de passe choisi (liste vide : accepté). */
export function motifsRefus(mdp: string, contexte: { email?: string; ancien?: string } = {}): string[] {
  const m: string[] = [];
  if (mdp.length < LONGUEUR_MINIMALE) m.push("longueur");
  if (!/[A-Z]/.test(mdp)) m.push("majuscule");
  if (!/[a-z]/.test(mdp)) m.push("minuscule");
  if (!/[0-9]/.test(mdp)) m.push("chiffre");
  if (!/[^A-Za-z0-9]/.test(mdp)) m.push("special");
  const id = contexte.email?.split("@")[0]?.toLowerCase();
  if (id && id.length >= 4 && mdp.toLowerCase().includes(id)) m.push("identifiant");
  if (contexte.ancien && mdp === contexte.ancien) m.push("identique");
  return m;
}
