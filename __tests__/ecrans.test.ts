import { ecranAutorise, ROLES_DEFAUT } from "@/lib/permissions";

const role = (code: string) => ROLES_DEFAUT.find((r) => r.code === code)!.permissions;

describe("accès aux écrans", () => {
  test("écrans sans règle : ouverts à toute session", () => {
    expect(ecranAutorise("/tableau-de-bord", [])).toBe(true);
    expect(ecranAutorise("/profil", [])).toBe(true);
  });
  test("le chargé d'affaires ouvre ses écrans mais pas l'audit ni le paramétrage", () => {
    const p = role("charge_affaires");
    expect(ecranAutorise("/dossiers/abc", p)).toBe(true);
    expect(ecranAutorise("/dossiers/nouveau", p)).toBe(true);
    expect(ecranAutorise("/audit", p)).toBe(false);
    expect(ecranAutorise("/admin", p)).toBe(false);
    expect(ecranAutorise("/admin/parametres", p)).toBe(false);
  });
  test("le préfixe le plus long l'emporte", () => {
    const p = role("comite_credit");
    expect(ecranAutorise("/dossiers/x", p)).toBe(true);
    expect(ecranAutorise("/dossiers/nouveau", p)).toBe(false);
  });
  test("le responsable RSE gère les référentiels mais pas les paramètres", () => {
    const p = role("responsable_rse");
    expect(ecranAutorise("/admin", p)).toBe(true);
    expect(ecranAutorise("/admin/questionnaires", p)).toBe(true);
    expect(ecranAutorise("/admin/referentiels/secteurs", p)).toBe(true);
    expect(ecranAutorise("/admin/parametres", p)).toBe(false);
  });
  test("l'administrateur système ouvre tout", () => {
    const p = role("admin_systeme");
    for (const c of ["/audit", "/climat", "/admin/base", "/admin/api", "/admin/roles"]) expect(ecranAutorise(c, p)).toBe(true);
  });
});
