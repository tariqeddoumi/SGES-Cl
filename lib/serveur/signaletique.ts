import { ErreurMetier } from "./contexte";
import { journaliser } from "./journal";
import { chargerParametres } from "./parametres";

/**
 * Connecteur de signalétique client (système central bancaire, ex. T24).
 *
 * Procédure §3.1 : le chargé saisit le compte courant sur 20 positions pour importer la
 * signalétique (raison sociale, forme juridique, compte portefeuille, activité, code
 * activité). Trois modes (paramètre SIGNALETIQUE_MODE, ou variable d'environnement) :
 *  - simulation : jeu d'essai déterministe, pour la démonstration et la formation ;
 *  - api        : GET {SIGNALETIQUE_URL}/{compte}, jeton SIGNALETIQUE_JETON ;
 *  - desactive  : saisie manuelle uniquement.
 */
export interface Signaletique {
  compteCourant: string;
  codeClient: string | null;
  raisonSociale: string;
  formeJuridique: string | null;
  comptePortefeuille: string | null;
  codeActivite: string | null;
  libelleActivite: string | null;
  ville: string | null;
  identifiantFiscal: string | null;
  ice: string | null;
  source: "simulation" | "api";
}

export function compteValide(compte: string): boolean {
  return /^\d{20}$/.test(compte);
}

const SIMULATION: Record<string, Omit<Signaletique, "compteCourant" | "source">> = {
  "18278000099999999901": { codeClient: "99999999", raisonSociale: "Sucrerie du Gharb SA", formeJuridique: "SA", comptePortefeuille: "PTF-GE-RABAT", codeActivite: "C10", libelleActivite: "Industries alimentaires", ville: "Sidi Kacem", identifiantFiscal: "40001234", ice: "001234567000089" },
  "18278000099999999902": { codeClient: "99999998", raisonSociale: "Carrières de l'Oriental SARL", formeJuridique: "SARL", comptePortefeuille: "PTF-PME-OUJDA", codeActivite: "B", libelleActivite: "Industries extractives", ville: "Oujda", identifiantFiscal: "40005678", ice: "002345678000012" },
  "18278000099999999903": { codeClient: "99999997", raisonSociale: "Atlas Aquaculture SA", formeJuridique: "SA", comptePortefeuille: "PTF-GE-DAKHLA", codeActivite: "A03", libelleActivite: "Pêche et aquaculture", ville: "Dakhla", identifiantFiscal: "40009876", ice: "003456789000034" },
};

/**
 * La simulation (jeux d'essai fictifs) est interdite en production : une signalétique fictive ne doit
 * jamais alimenter un dossier réel. Une recette sur un serveur de production l'autorise explicitement
 * (variable SIGNALETIQUE_SIMULATION_AUTORISEE=true).
 */
export function simulationAutorisee(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.SIGNALETIQUE_SIMULATION_AUTORISEE === "true";
}

export async function lireSignaletique(compte: string): Promise<Signaletique | null> {
  if (!compteValide(compte)) return null;
  const mode = process.env.SIGNALETIQUE_MODE || (await chargerParametres()).SIGNALETIQUE_MODE || "simulation";
  if (mode === "desactive") return null;
  if (mode === "simulation" && !simulationAutorisee()) {
    throw new ErreurMetier("Connecteur de signalétique en mode simulation : interdit en production. Configurez l'intégration avec le système central ou désactivez l'import.", 503, "signaletique_simulation");
  }
  if (mode === "api") {
    const base = process.env.SIGNALETIQUE_URL;
    if (!base) throw new ErreurMetier("Connecteur de signalétique non configuré (SIGNALETIQUE_URL).", 503, "signaletique_configuration");
    let r: Response;
    try {
      r = await fetch(`${base.replace(/\/$/, "")}/${encodeURIComponent(compte)}`, {
        headers: process.env.SIGNALETIQUE_JETON ? { Authorization: `Bearer ${process.env.SIGNALETIQUE_JETON}` } : undefined,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
    } catch (e) {
      // Journal d'erreurs d'intégration : une panne ne doit pas passer pour un « client inconnu ».
      await journaliser(null, "signaletique_erreur", "connecteur", null, { erreur: e instanceof Error ? e.message : String(e) });
      throw new ErreurMetier("Système central injoignable : réessayez ou saisissez la fiche client manuellement.", 502, "signaletique_indisponible");
    }
    if (r.status === 404) return null;
    if (!r.ok) {
      await journaliser(null, "signaletique_erreur", "connecteur", null, { statut: r.status });
      throw new ErreurMetier(`Système central en erreur (HTTP ${r.status}).`, 502, "signaletique_indisponible");
    }
    const j = (await r.json()) as Record<string, unknown>;
    const s = (k: string) => (typeof j[k] === "string" && (j[k] as string).trim() ? (j[k] as string).trim() : null);
    const raison = s("raisonSociale") ?? s("nom") ?? s("name");
    if (!raison) return null;
    return {
      compteCourant: compte,
      codeClient: s("codeClient") ?? s("customerId"),
      raisonSociale: raison,
      formeJuridique: s("formeJuridique") ?? s("legalForm"),
      comptePortefeuille: s("comptePortefeuille") ?? s("portfolio"),
      codeActivite: s("codeActivite") ?? s("activityCode"),
      libelleActivite: s("libelleActivite") ?? s("activity"),
      ville: s("ville") ?? s("city"),
      identifiantFiscal: s("identifiantFiscal"),
      ice: s("ice"),
      source: "api",
    };
  }
  const connu = SIMULATION[compte];
  return connu ? { ...connu, compteCourant: compte, source: "simulation" } : null;
}
