"use client";

import { useEffect, useState } from "react";
import { api, ErreurApi, useDonnees } from "@/lib/client/api";
import type { DefParametre } from "@/lib/parametres";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Interrupteur, Selecteur } from "@/components/ui/champs";
import { Bandeau, Carte, Chargement, EnTete, Sablier } from "@/components/ui/mise-en-page";

const GROUPES = ["habillage", "regles", "evaluation", "climat", "securite", "integration"] as const;

/** Libellés des paramètres (le code reste visible pour l'exploitation). */
const LIBELLES: Record<string, { fr: string; en: string; ar: string }> = {
  APP_NOM: { fr: "Nom de l'outil", en: "Tool name", ar: "اسم الأداة" },
  APP_SOUS_TITRE: { fr: "Sous-titre", en: "Subtitle", ar: "العنوان الفرعي" },
  APP_LOGO_URL: { fr: "Logo (URL)", en: "Logo (URL)", ar: "الشعار (رابط)" },
  COULEUR_PRIMAIRE: { fr: "Couleur principale", en: "Primary colour", ar: "اللون الرئيسي" },
  THEME: { fr: "Thème", en: "Theme", ar: "المظهر" },
  LANGUE_DEFAUT: { fr: "Langue par défaut", en: "Default language", ar: "اللغة الافتراضية" },
  DEVISE_REFERENCE: { fr: "Devise de référence", en: "Reference currency", ar: "العملة المرجعية" },
  SEUIL_DECLENCHEMENT: { fr: "Seuil de déclenchement (devise de référence)", en: "Trigger threshold (reference currency)", ar: "عتبة التفعيل (العملة المرجعية)" },
  PREFIXE_REFERENCE: { fr: "Préfixe des références", en: "Reference prefix", ar: "بادئة المراجع" },
  SEPARATION_FONCTIONS: { fr: "Séparation des fonctions (validateur ≠ chargé)", en: "Segregation of duties (validator ≠ manager)", ar: "فصل المهام" },
  EXCLUSION_NOTIFIER_RSE: { fr: "Notifier le Responsable RSE en cas d'exclusion", en: "Notify E&S officer on exclusion", ar: "إشعار المسؤول عند الإقصاء" },
  CATEGORIE_A_NOTIFIER_RSE: { fr: "Notifier le Responsable RSE pour la catégorie A", en: "Notify E&S officer on category A", ar: "إشعار المسؤول للفئة A" },
  EIE_OBLIGATOIRE_CATEGORIE_A: { fr: "EIES jointe obligatoire en catégorie A", en: "ESIA attachment mandatory for category A", ar: "إرفاق دراسة التأثير إلزامي للفئة A" },
  PRESEANCE_CATEGORIES: { fr: "Préséance des catégories", en: "Category precedence", ar: "أسبقية الفئات" },
  DELAI_DECISION_JOURS: { fr: "Délai d'alerte sans décision (jours)", en: "No-decision alert delay (days)", ar: "مهلة التنبيه دون قرار (أيام)" },
  DELAI_VISITE_MOIS: { fr: "Fréquence des visites de suivi (mois)", en: "Follow-up visit frequency (months)", ar: "وتيرة زيارات التتبع (أشهر)" },
  SEUILS_NIVEAU_RISQUE: { fr: "Seuils des niveaux de risque (modéré, élevé, critique)", en: "Risk level thresholds (moderate, high, critical)", ar: "عتبات مستويات المخاطر" },
  RELEVER_NIVEAU_CATEGORIE_A: { fr: "Relever le niveau d'un cran en catégorie A", en: "Raise level one notch for category A", ar: "رفع المستوى درجة للفئة A" },
  COMMENTAIRE_EVALUATION_OBLIGATOIRE: { fr: "Commentaire d'évaluation obligatoire", en: "Assessment comment mandatory", ar: "تعليق التقييم إلزامي" },
  VOLET_CLIMAT_ACTIF: { fr: "Volet climat activé", en: "Climate section enabled", ar: "تفعيل الشق المناخي" },
  VOLET_CLIMAT_OBLIGATOIRE: { fr: "Volet climat obligatoire avant soumission", en: "Climate section mandatory before submission", ar: "الشق المناخي إلزامي قبل الإرسال" },
  SESSION_HEURES: { fr: "Durée de session (heures)", en: "Session length (hours)", ar: "مدة الجلسة (ساعات)" },
  TENTATIVES_MAX: { fr: "Tentatives de connexion avant verrouillage", en: "Login attempts before lockout", ar: "محاولات الدخول قبل القفل" },
  VERROUILLAGE_MINUTES: { fr: "Durée du verrouillage (minutes)", en: "Lockout duration (minutes)", ar: "مدة القفل (دقائق)" },
  SIGNALETIQUE_MODE: { fr: "Connecteur signalétique client", en: "Customer data connector", ar: "موصل معطيات الزبناء" },
  IA_ACTIVE: { fr: "Assistant IA d'analyse des EIES", en: "AI ESIA analysis assistant", ar: "المساعد الذكي لتحليل دراسات التأثير" },
  IA_MODELE: { fr: "Modèle d'IA", en: "AI model", ar: "نموذج الذكاء الاصطناعي" },
};

export default function PageParametres() {
  const { t, langue, devises, langues } = useApp();
  const toast = useToast();
  const { donnees, recharger } = useDonnees<{ catalogue: DefParametre[]; valeurs: Record<string, string> }>("/api/admin/parametres");
  const [v, setV] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  useEffect(() => { if (donnees) setV(donnees.valeurs); }, [donnees]);
  if (!donnees) return <Chargement lignes={8} />;
  const modifies = Object.keys(v).filter((k) => v[k] !== donnees.valeurs[k]);
  const enregistrer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      await api("/api/admin/parametres", { method: "PUT", body: Object.fromEntries(modifies.map((k) => [k, v[k]])) });
      toast(t("admin.parametreModifie"));
      await recharger();
      // Habillage, langue, thème : la mise en page serveur doit être relue.
      window.location.reload();
    } catch (e) {
      setErreur(e instanceof ErreurApi && Array.isArray(e.details) ? (e.details as { champ: string }[]).map((d) => d.champ).join(", ") + " : " + t("admin.valeurInvalide") : (e as Error).message);
    } finally {
      setEnCours(false);
    }
  };
  const nom = (cle: string) => LIBELLES[cle]?.[langue as "fr"] ?? LIBELLES[cle]?.fr ?? cle;
  const champ = (d: DefParametre) => {
    const val = v[d.cle] ?? "";
    const maj = (x: string) => setV({ ...v, [d.cle]: x });
    if (d.type === "booleen") return <Interrupteur id={d.cle} libelle={nom(d.cle)} aide={d.cle} valeur={val === "true"} onChange={(b) => maj(String(b))} />;
    if (d.cle === "DEVISE_REFERENCE") return <Selecteur id={d.cle} libelle={nom(d.cle)} valeur={val} onChange={maj} options={devises.map((x) => ({ valeur: x.code, libelle: x.code }))} sansVide />;
    if (d.cle === "LANGUE_DEFAUT") return <Selecteur id={d.cle} libelle={nom(d.cle)} valeur={val} onChange={maj} options={langues.map((x) => ({ valeur: x.code, libelle: x.nomNatif }))} sansVide />;
    if (d.type === "choix") return <Selecteur id={d.cle} libelle={nom(d.cle)} valeur={val} onChange={maj} options={(d.choix ?? []).map((x) => ({ valeur: x, libelle: x }))} sansVide />;
    if (d.type === "couleur")
      return (
        <div className="flex items-end gap-2">
          <Champ id={d.cle} className="flex-1" libelle={nom(d.cle)} valeur={val} onChange={maj} placeholder="#1f6f5a" dir="ltr" />
          <input type="color" aria-label={nom(d.cle)} value={/^#[0-9a-f]{6}$/i.test(val) ? val : "#1f6f5a"} onChange={(e) => maj(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border" />
        </div>
      );
    return <Champ id={d.cle} type={d.type === "nombre" ? "number" : "text"} libelle={nom(d.cle)} aide={d.cle} valeur={val} onChange={maj} dir="ltr" />;
  };
  return (
    <div className="space-y-4">
      <EnTete titre={t("admin.parametres")} description={t("admin.parametresDesc")} retour={{ href: "/admin", libelle: t("admin.titre") }} />
      {erreur && <Bandeau ton="alerte">{erreur}</Bandeau>}
      {GROUPES.map((g) => (
        <Carte key={g} titre={t(`admin.groupe_${g}`)}>
          <div className="grid gap-4 md:grid-cols-2">
            {donnees.catalogue.filter((d) => d.groupe === g).map((d) => <div key={d.cle}>{champ(d)}</div>)}
          </div>
        </Carte>
      ))}
      <div className="sticky bottom-0 flex justify-end gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur">
        {modifies.length > 0 && <span className="me-auto text-[12.5px] text-warning">{t("commun.modificationsNonEnregistrees")} ({modifies.length})</span>}
        <Bouton onClick={enregistrer} disabled={!modifies.length || enCours}>{enCours && <Sablier />}{t("commun.enregistrer")}</Bouton>
      </div>
    </div>
  );
}
