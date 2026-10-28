"use client";

import { useEffect, useState } from "react";
import { api, ErreurApi, useDonnees } from "@/lib/client/api";
import type { DefParametre } from "@/lib/parametres";
import { useReferentiels } from "@/lib/client/referentiels";
import { useApp } from "@/components/providers/application";
import { useToast } from "@/components/providers/toasts";
import { Bouton } from "@/components/ui/bouton";
import { ChoixMultiple, Champ, Interrupteur, Selecteur } from "@/components/ui/champs";
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
  COURS_VALIDITE_JOURS: { fr: "Validité maximale d'un cours de change (jours, 0 = sans limite)", en: "Maximum age of an exchange rate (days, 0 = no limit)", ar: "أقصى مدة صلاحية لسعر الصرف (أيام، 0 = بدون حد)" },
  DELAI_DECISION_JOURS: { fr: "Délai d'alerte sans décision (jours)", en: "No-decision alert delay (days)", ar: "مهلة التنبيه دون قرار (أيام)" },
  DELAI_VISITE_MOIS: { fr: "Fréquence des visites de suivi (mois)", en: "Follow-up visit frequency (months)", ar: "وتيرة زيارات التتبع (أشهر)" },
  SEUILS_NIVEAU_RISQUE: { fr: "Seuils des niveaux de risque (modéré, élevé, critique)", en: "Risk level thresholds (moderate, high, critical)", ar: "عتبات مستويات المخاطر" },
  RELEVER_NIVEAU_CATEGORIE_A: { fr: "Relever le niveau d'un cran en catégorie A", en: "Raise level one notch for category A", ar: "رفع المستوى درجة للفئة A" },
  QUESTIONNAIRE_NIVEAU_B: { fr: "Questionnaire des projets de catégorie B", en: "Questionnaire for category B projects", ar: "استبيان مشاريع الفئة B" },
  QUESTIONNAIRE_NIVEAU_C: { fr: "Questionnaire des projets de catégorie C", en: "Questionnaire for category C projects", ar: "استبيان مشاريع الفئة C" },
  LIGNES_EXIGENCES_SFI: { fr: "Lignes de financement imposant les normes SFI (questionnaire au moins standard)", en: "Credit lines requiring IFC standards (at least standard questionnaire)", ar: "خطوط التمويل التي تفرض معايير مؤسسة التمويل الدولية" },
  ESG_PONDERATION: { fr: "Note ESG : pondération des piliers E, S, G", en: "ESG rating: weighting of E, S, G pillars", ar: "التنقيط البيئي والاجتماعي والحوكمة: ترجيح الركائز" },
  ESG_SEUILS_NOTES: { fr: "Note ESG : seuils des notes A, B, C, D (sur 100)", en: "ESG rating: thresholds for A, B, C, D (out of 100)", ar: "التنقيط: عتبات A وB وC وD (من 100)" },
  ESG_COUVERTURE_MIN: { fr: "Note ESG : part minimale de réponses (sinon note provisoire)", en: "ESG rating: minimum share of answers (else provisional)", ar: "التنقيط: الحد الأدنى لنسبة الأجوبة" },
  ESG_PART_CLIMAT: { fr: "Note ESG : part du climat dans le pilier E (0 à 1)", en: "ESG rating: climate share of the E pillar (0 to 1)", ar: "التنقيط: حصة المناخ في الركيزة البيئية" },
  QUESTION_EFFECTIF: { fr: "Code de la question donnant l'effectif", en: "Code of the headcount question", ar: "رمز سؤال عدد المستخدمين" },
  COMMENTAIRE_EVALUATION_OBLIGATOIRE: { fr: "Commentaire d'évaluation obligatoire", en: "Assessment comment mandatory", ar: "تعليق التقييم إلزامي" },
  VOLET_CLIMAT_ACTIF: { fr: "Volet climat activé", en: "Climate section enabled", ar: "تفعيل الشق المناخي" },
  VOLET_CLIMAT_OBLIGATOIRE: { fr: "Volet climat obligatoire avant soumission", en: "Climate section mandatory before submission", ar: "الشق المناخي إلزامي قبل الإرسال" },
  CLIMAT_COUVERTURE_MIN: { fr: "Couverture minimale des données climat pour produire un score (0 à 1)", en: "Minimum climate data coverage to produce a score (0 to 1)", ar: "الحد الأدنى لتغطية المعطيات المناخية لإنتاج نقطة (0 إلى 1)" },
  CLIMAT_PONDERATION: { fr: "Pondération risque dominant / autre risque (méthode indicative)", en: "Weighting of dominant / other risk (indicative method)", ar: "ترجيح الخطر الغالب / الخطر الآخر (منهجية إرشادية)" },
  CLIMAT_SEUILS_NIVEAUX: { fr: "Seuils des niveaux climat (modéré, élevé, très élevé)", en: "Climate level thresholds (moderate, high, very high)", ar: "عتبات المستويات المناخية (متوسط، مرتفع، مرتفع جدا)" },
  CLIMAT_PRIX_CARBONE: { fr: "Prix du carbone 2030 par scénario NGFS (politiques actuelles, sous 2 °C, zéro net 2050), devise de référence / tCO2e", en: "2030 carbon price by NGFS scenario (current policies, below 2 °C, net zero 2050), reference currency / tCO2e", ar: "سعر الكربون 2030 حسب سيناريوهات NGFS (السياسات الحالية، أقل من درجتين، الحياد الكربوني 2050)" },
  CLIMAT_PRIX_ETS: { fr: "Prix des certificats CBAM (prix ETS de l'UE), devise de référence / tCO2e", en: "CBAM certificate price (EU ETS price), reference currency / tCO2e", ar: "سعر شهادات آلية تعديل الكربون على الحدود (سعر سوق الاتحاد الأوروبي)" },
  CLIMAT_CBAM_FACTEUR: { fr: "Part des émissions soumise au CBAM à l'horizon du scénario (0,485 en 2030, 1 en 2034)", en: "Share of emissions subject to CBAM at the scenario horizon (0.485 in 2030, 1 in 2034)", ar: "حصة الانبعاثات الخاضعة لآلية الحدود في أفق السيناريو (0.485 في 2030، 1 في 2034)" },
  CLIMAT_SEUIL_EBE: { fr: "Seuil d'alerte : coût carbone + CBAM rapporté à l'EBE (%)", en: "Alert threshold: carbon + CBAM cost as share of EBITDA (%)", ar: "عتبة التنبيه: كلفة الكربون وآلية الحدود نسبة إلى الفائض الإجمالي للاستغلال (%)" },
  SESSION_HEURES: { fr: "Durée de session (heures)", en: "Session length (hours)", ar: "مدة الجلسة (ساعات)" },
  TENTATIVES_MAX: { fr: "Tentatives de connexion avant verrouillage", en: "Login attempts before lockout", ar: "محاولات الدخول قبل القفل" },
  VERROUILLAGE_MINUTES: { fr: "Durée du verrouillage (minutes)", en: "Lockout duration (minutes)", ar: "مدة القفل (دقائق)" },
  SIGNALETIQUE_MODE: { fr: "Connecteur signalétique client", en: "Customer data connector", ar: "موصل معطيات الزبناء" },
  IA_ACTIVE: { fr: "Assistant IA d'analyse des pièces et de pré-remplissage", en: "AI document analysis and pre-fill assistant", ar: "المساعد الذكي لتحليل الوثائق والملء المسبق" },
  IA_REFERENCE_VALIDATION: { fr: "Référence de la validation juridique, CNDP et SSI du service d'IA (obligatoire pour activer l'assistant)", en: "Reference of the legal, data-protection (CNDP) and security approval of the AI service (required to enable the assistant)", ar: "مرجع المصادقة القانونية ولجنة حماية المعطيات وأمن المعلومات (إلزامي لتفعيل المساعد)" },
  IA_ANONYMISER: { fr: "Masquer les données personnelles avant envoi à l'IA (e-mail, téléphone, ICE, RIB, CIN)", en: "Mask personal data before sending to the AI (email, phone, ICE, bank account, ID)", ar: "إخفاء المعطيات الشخصية قبل الإرسال إلى الذكاء الاصطناعي" },
  IA_MODELE: { fr: "Modèle d'IA", en: "AI model", ar: "نموذج الذكاء الاصطناعي" },
};

export default function PageParametres() {
  const { t, lib, langue, devises, langues } = useApp();
  const ref = useReferentiels();
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
    if (d.cle === "LIGNES_EXIGENCES_SFI") return <ChoixMultiple id={d.cle} libelle={nom(d.cle)} aide={d.cle} valeur={val} onChange={maj} options={(ref?.listes.ligne_financement ?? []).map((x) => ({ valeur: x.code, libelle: lib(x.libelle).split(" — ")[0] }))} />;
    if (d.type === "choix") return <Selecteur id={d.cle} libelle={nom(d.cle)} aide={d.cle.startsWith("QUESTIONNAIRE_NIVEAU") ? t("questionnaire.niveauAide") : undefined} valeur={val} onChange={maj} options={(d.choix ?? []).map((x) => ({ valeur: x, libelle: d.cle.startsWith("QUESTIONNAIRE_NIVEAU") ? t(`questionnaire.niveau_${x}`) : x }))} sansVide />;
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
