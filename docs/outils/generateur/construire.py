"""Outil Excel ESG Climat 360 : évaluation E&S, climat et note ESG d'un crédit d'investissement.

Mêmes règles que l'outil web (lib/domaine) : déclenchement, liste d'exclusion, catégorisation,
questionnaire (niveaux et modules), risque E&S résiduel, score climat, émissions financées,
pièces, plan d'actions et note ESG. Formules natives uniquement (aucune macro).

Usage (depuis docs/outils) : python3 generateur/construire.py generateur/donnees.json guide-questions.json sortie.xlsx [exemple]
Recalculer ensuite les formules (Excel le fait à l'ouverture).
"""
import json
import os
import sys

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.drawing.image import Image as XLImage
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation

D = json.load(open(sys.argv[1], encoding="utf-8"))
GUIDE = json.load(open(sys.argv[2], encoding="utf-8"))
SORTIE = sys.argv[3]
EXEMPLE = len(sys.argv) > 4 and sys.argv[4] == "exemple"
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo_bp.png")

# ── Charte Banque Populaire ────────────────────────────────────────────────
ORANGE, BRUN, BRUN2, CREME, GRIS, SAISIE = "E8790F", "5A3A1E", "8B4A17", "F6D2A6", "EFEFEF", "FFF2CC"
POLICE = "Calibri"
f_titre = Font(name=POLICE, size=18, bold=True, color=ORANGE)
f_sous = Font(name=POLICE, size=11, italic=True, color=BRUN)
f_entete = Font(name=POLICE, size=10, bold=True, color="FFFFFF")
f_norm = Font(name=POLICE, size=10, color="333333")
f_gras = Font(name=POLICE, size=10, bold=True, color=BRUN)
f_section = Font(name=POLICE, size=12, bold=True, color=ORANGE)
f_lien = Font(name=POLICE, size=11, bold=True, color=ORANGE, underline="single")
f_petit = Font(name=POLICE, size=9, italic=True, color="7A7A7A")
fill = lambda c: PatternFill("solid", start_color=c, end_color=c)
FILL_ENTETE, FILL_SAISIE, FILL_CALC, FILL_CREME = fill(ORANGE), fill(SAISIE), fill(GRIS), fill("FDF1E3")
fin = Side(style="thin", color="D9D9D9")
BORD = Border(left=fin, right=fin, top=fin, bottom=fin)
HAUT = Alignment(vertical="top", wrap_text=True)
CENTRE = Alignment(horizontal="center", vertical="center", wrap_text=True)

wb = Workbook()
FEUILLES = ["Accueil", "Identification", "Exclusion", "Catégorisation", "Questionnaire", "Climat", "Pièces", "Plan d'actions", "Scores", "Fiche", "Paramètres", "Référentiels", "Méthode"]
ws = {}
for i, n in enumerate(FEUILLES):
    ws[n] = wb.active if i == 0 else wb.create_sheet(n)
    ws[n].title = n
    ws[n].sheet_view.showGridLines = False
    ws[n].sheet_properties.tabColor = ORANGE if n not in ("Paramètres", "Référentiels", "Méthode") else BRUN2


def q(feuille):
    return "'" + feuille.replace("'", "''") + "'"


def nom(n, feuille, ref):
    wb.defined_names[n] = DefinedName(n, attr_text=f"{q(feuille)}!{ref}")


def entete(w, titre, sous=None, logo=True):
    w["A1"] = titre
    w["A1"].font = f_titre
    if sous:
        w["A2"] = sous
        w["A2"].font = f_sous
    w.row_dimensions[1].height = 30
    if logo:
        img = XLImage(LOGO)
        img.width, img.height = 126, 60
        w.add_image(img, "H1" if w.title not in ("Questionnaire", "Plan d'actions") else "S1")


def ligne_entete(w, r, valeurs, c0=1):
    for j, v in enumerate(valeurs):
        c = w.cell(r, c0 + j, v)
        c.font, c.fill, c.alignment, c.border = f_entete, FILL_ENTETE, CENTRE, BORD


def cellule(w, ref, v=None, font=f_norm, fill_=None, align=None, fmt=None, bord=True):
    c = w[ref]
    if v is not None:
        c.value = v
    c.font = font
    if fill_:
        c.fill = fill_
    c.alignment = align or Alignment(vertical="center", wrap_text=True)
    if fmt:
        c.number_format = fmt
    if bord:
        c.border = BORD
    return c


def saisie(w, ref, v=None, fmt=None, aide=None):
    c = cellule(w, ref, v, font=Font(name=POLICE, size=10, color="1F3864"), fill_=FILL_SAISIE, fmt=fmt)
    if aide:
        c.comment = Comment(aide, "ESG Climat 360")
    return c


def calc(w, ref, formule, fmt=None, gras=False):
    return cellule(w, ref, formule, font=f_gras if gras else f_norm, fill_=FILL_CALC, fmt=fmt)


def liste(w, plage, source, titre=None, msg=None):
    dv = DataValidation(type="list", formula1=source, allow_blank=True, showDropDown=False)
    if msg:
        dv.promptTitle, dv.prompt, dv.showInputMessage = (titre or "Saisie")[:32], msg[:250], True
    dv.error, dv.errorTitle, dv.showErrorMessage = "Choisissez une valeur de la liste.", "Valeur non prévue", True
    w.add_data_validation(dv)
    dv.add(plage)


OUINON = '"Oui,Non"'
REP_ONNA = '"Oui,Non,Sans objet"'

# ════════════════════════════ Paramètres ════════════════════════════════
P = ws["Paramètres"]
entete(P, "Paramètres du modèle", "Valeurs par défaut de l'outil web ESG Climat 360 — modifiables ici (cellules jaunes).")
P.column_dimensions["A"].width, P.column_dimensions["B"].width, P.column_dimensions["C"].width = 52, 16, 70
params = [
    ("Déclenchement", None, None, None),
    ("Seuil de déclenchement (MAD, montant d'investissement)", 10000000, "P_SEUIL", "Circulaire CFD-537/01-24 : évaluation obligatoire au-delà de 10 M MAD."),
    ("Risque E&S résiduel", None, None, None),
    ("Seuil « modéré » (score ≥)", 15, "P_RMOD", "Score = 100 × Σ gravité des risques / Σ gravité des réponses."),
    ("Seuil « élevé » (score ≥)", 35, "P_RELEV", ""),
    ("Seuil « critique » (score ≥)", 60, "P_RCRIT", ""),
    ("Relever d'un cran en catégorie A (Oui/Non)", "Oui", "P_RELEVER_A", "Un projet A avec au moins un risque non maîtrisé monte d'un niveau."),
    ("Climat", None, None, None),
    ("Couverture minimale des données climat (0 à 1)", 0.75, "P_CLIM_COUV", "Sous ce seuil, pas de score climat global."),
    ("Poids du risque dominant", 0.6, "P_POND1", "Score climat = 0,6 × risque dominant + 0,4 × l'autre."),
    ("Poids de l'autre risque", 0.4, "P_POND2", ""),
    ("Seuil climat « modéré » (≥)", 25, "P_CS1", ""),
    ("Seuil climat « élevé » (≥)", 50, "P_CS2", ""),
    ("Seuil climat « très élevé » (≥)", 75, "P_CS3", ""),
    ("Note ESG", None, None, None),
    ("Poids du pilier E", 0.4, "P_WE", "Note = 40 % E + 30 % S + 30 % G."),
    ("Poids du pilier S", 0.3, "P_WS", ""),
    ("Poids du pilier G", 0.3, "P_WG", ""),
    ("Seuil de la note A (≥)", 80, "P_NA", ""),
    ("Seuil de la note B (≥)", 65, "P_NB", ""),
    ("Seuil de la note C (≥)", 50, "P_NC", "Un risque critique non maîtrisé plafonne la note juste sous ce seuil (D au mieux)."),
    ("Seuil de la note D (≥)", 35, "P_ND", "En dessous : E."),
    ("Part minimale de réponses (sinon note provisoire)", 0.6, "P_ESG_COUV", ""),
    ("Part du climat dans le pilier E (0 à 1)", 0.3, "P_PART_CLIM", ""),
    ("Questionnaire", None, None, None),
    ("Niveau du questionnaire en catégorie B", "complet", "P_NIV_B", "minimum : réglementaire + interne ; standard : + SFI / Équateur ; complet : tout. A et FI restent complets."),
    ("Niveau du questionnaire en catégorie C", "complet", "P_NIV_C", ""),
]
r = 4
for lib, val, n, note in params:
    if val is None:
        P.cell(r, 1, lib).font = f_section
        r += 1
        continue
    cellule(P, f"A{r}", lib)
    saisie(P, f"B{r}", val, fmt="0.00" if isinstance(val, float) else ("#,##0" if isinstance(val, int) and val > 1000 else None))
    cellule(P, f"C{r}", note or "", font=f_petit)
    nom(n, "Paramètres", f"$B${r}")
    if n in ("P_NIV_B", "P_NIV_C"):
        liste(P, f"B{r}", '"minimum,standard,complet"')
    if n == "P_RELEVER_A":
        liste(P, f"B{r}", OUINON)
    r += 1
P.cell(r + 1, 1, "Source : paramètres par défaut de l'outil web ESG Climat 360 (Paramétrage › Paramètres généraux), à valider par le Responsable RSE et la Fonction Risques.").font = f_petit

# ════════════════════════════ Référentiels ══════════════════════════════
R = ws["Référentiels"]
entete(R, "Référentiels", "Secteurs, régions, listes et modules d'activité — repris de l'outil web.", logo=False)
for col, w_ in zip("ABCDEFGH", (9, 46, 9, 9, 9, 9, 8, 52)):
    R.column_dimensions[col].width = w_
ligne_entete(R, 4, ["Code", "Secteur", "Cat. indic.", "Risque transition", "Sensibilité physique", "Facteur (tCO2e/M MAD)", "CBAM", "Libellé (liste)"])
for i, s in enumerate(D["secteurs"]):
    rr = 5 + i
    for j, v in enumerate([s["code"], s["libelle"], s["categorie"], s["risqueTransition"], s["sensibilite"], s["facteur"], "Oui" if s["cbam"] else "Non"]):
        cellule(R, f"{'ABCDEFG'[j]}{rr}", v)
    calc(R, f"H{rr}", f'=A{rr}&" — "&B{rr}')
NS = 5 + len(D["secteurs"]) - 1
nom("R_SECT_AFF", "Référentiels", f"$H$5:$H${NS}")
nom("R_SECT_CODE", "Référentiels", f"$A$5:$A${NS}")
nom("R_SECT_TAB", "Référentiels", f"$A$5:$G${NS}")

ALEAS = ["Stress hydrique", "Sécheresse", "Inondation", "Chaleur extrême", "Submersion marine / érosion côtière", "Feux de forêt", "Séisme"]
for col, w_ in zip(["J", "K", "L", "M", "N", "O", "P", "Q", "R"], (8, 34, 9, 9, 9, 9, 9, 9, 9)):
    R.column_dimensions[col].width = w_
ligne_entete(R, 4, ["Code", "Région"] + ALEAS, c0=10)
for i, g in enumerate(D["regions"]):
    rr = 5 + i
    cellule(R, f"J{rr}", g["code"])
    cellule(R, f"K{rr}", g["libelle"])
    for k, v in enumerate(g["a"]):
        cellule(R, f"{get_column_letter(12 + k)}{rr}", v, align=CENTRE)
NR = 5 + len(D["regions"]) - 1
nom("R_REG_LIB", "Référentiels", f"$K$5:$K${NR}")
nom("R_REG_CODE", "Référentiels", f"$J$5:$J${NR}")
nom("R_REG_ALEAS", "Référentiels", f"$L$5:$R${NR}")

# Listes : type de crédit, nature, zone, ligne de financement
LISTES_SPEC = [("T", "type_credit", "Type de crédit", "Investissement"), ("X", "nature_projet", "Nature du projet", None), ("AA", "type_zone", "Type de zone", None), ("AD", "ligne_financement", "Ligne de financement", "Impose SFI")]
SFI_DEFAUT = {"SUNREF", "MORSEFF", "GEFF", "GVC", "BEI", "SFI"}
for col, cle, titre, extra in LISTES_SPEC:
    c0 = R[f"{col}4"].column
    entetes = ["Code", titre] + ([extra] if extra else [])
    ligne_entete(R, 4, entetes, c0=c0)
    R.column_dimensions[get_column_letter(c0)].width = 14
    R.column_dimensions[get_column_letter(c0 + 1)].width = 44
    if extra:
        R.column_dimensions[get_column_letter(c0 + 2)].width = 12
    for i, v in enumerate(D["listes"][cle]):
        rr = 5 + i
        cellule(R, f"{get_column_letter(c0)}{rr}", v["code"])
        cellule(R, f"{get_column_letter(c0 + 1)}{rr}", v["libelle"])
        if cle == "type_credit":
            saisie(R, f"{get_column_letter(c0 + 2)}{rr}", "Oui" if (v.get("extra") or {}).get("investissement", True) else "Non")
        if cle == "ligne_financement":
            saisie(R, f"{get_column_letter(c0 + 2)}{rr}", "Oui" if v["code"] in SFI_DEFAUT else "Non")
    fin_ = 5 + len(D["listes"][cle]) - 1
    nom(f"R_{cle.upper()}_CODE", "Référentiels", f"${get_column_letter(c0)}$5:${get_column_letter(c0)}${fin_}")
    nom(f"R_{cle.upper()}_LIB", "Référentiels", f"${get_column_letter(c0 + 1)}$5:${get_column_letter(c0 + 1)}${fin_}")
    if extra:
        nom(f"R_{cle.upper()}_X", "Référentiels", f"${get_column_letter(c0 + 2)}$5:${get_column_letter(c0 + 2)}${fin_}")

# Modules d'activité (retenus par formule selon l'identification)
RM0 = NS + 4
R.cell(RM0 - 1, 1, "Modules d'activité du questionnaire (niveaux minimum et standard)").font = f_section
ligne_entete(R, RM0, ["Code", "Module", "Secteurs (codes)", "Zones", "Natures", "Effectif min.", "Stress hydrique min.", "Équateur"], c0=1)
R.cell(RM0, 9, "Retenu").font, R.cell(RM0, 9).fill = f_entete, FILL_ENTETE
for i, m in enumerate(D["modules"]):
    rr = RM0 + 1 + i
    for j, v in enumerate([m["code"], m["libelle"], m.get("secteurs") or "", m.get("zones") or "", m.get("natures") or "", m.get("effectifMin"), m.get("stressHydriqueMin"), "Oui" if m.get("equateur") else "Non"]):
        cellule(R, f"{'ABCDEFGH'[j]}{rr}", v)
    sc, zo, na, ef, st, eq = "SECT_CODE", "ZONE_CODE", "NATURE_CODE", "ID_EFFECTIF", "STRESS", "ID_EQUATEUR"
    critere_sect = f'AND(C{rr}<>"",OR({sc}="",ISNUMBER(SEARCH(","&{sc}&",",","&C{rr}&",")),ISNUMBER(SEARCH(","&LEFT({sc},1)&",",","&C{rr}&","))))'
    critere_zone = f'AND(D{rr}<>"",OR({zo}="",ISNUMBER(SEARCH(","&{zo}&",",","&D{rr}&","))))'
    critere_nat = f'AND(E{rr}<>"",OR({na}="",ISNUMBER(SEARCH(","&{na}&",",","&E{rr}&","))))'
    critere_eff = f'AND(F{rr}<>"",OR({ef}="",N({ef})>=F{rr}))'
    critere_str = f'AND(G{rr}<>"",OR({st}="",N({st})>=G{rr}))'
    critere_eq = f'AND(H{rr}="Oui",{eq}="Oui")'
    aucun = f'AND(C{rr}="",D{rr}="",E{rr}="",F{rr}="",G{rr}="",H{rr}<>"Oui")'
    calc(R, f"I{rr}", f'=IF(OR({critere_sect},{critere_zone},{critere_nat},{critere_eff},{critere_str},{critere_eq},{aucun}),"Oui","Non")', gras=True)
RMF = RM0 + len(D["modules"])
nom("R_MOD_CODE", "Référentiels", f"$A${RM0 + 1}:$A${RMF}")
nom("R_MOD_RET", "Référentiels", f"$I${RM0 + 1}:$I${RMF}")
R.cell(RMF + 2, 1, "Un module est retenu dès qu'un de ses critères est rempli ; si la donnée du dossier est inconnue, il est retenu par prudence. Un code de section (une lettre) couvre ses divisions.").font = f_petit

# ════════════════════════════ Identification ════════════════════════════
I = ws["Identification"]
entete(I, "1. Identification du dossier", "Renseignez les cellules jaunes. Les cellules grises se calculent.")
I.column_dimensions["A"].width, I.column_dimensions["B"].width, I.column_dimensions["C"].width, I.column_dimensions["D"].width = 3, 40, 52, 60
champs = [
    (4, "Client (raison sociale)", "ID_CLIENT", None, None, "Atlantique Resorts SA"),
    (5, "Référence du dossier", "ID_REF", None, None, "SGES-BPR-CS-CA1-2026-00021"),
    (6, "Date de l'évaluation", "ID_DATE", None, "dd/mm/yyyy", None),
    (7, "Chargé d'affaires", "ID_CHARGE", None, None, "Omar Idrissi"),
    (8, "Entité / centre d'affaires", "ID_ENTITE", None, None, "Centre d'affaires Settat"),
    (10, "Type de crédit", "ID_TYPECREDIT", "=R_TYPE_CREDIT_LIB", None, "Crédit MLT (comité BPR)"),
    (11, "Nature du projet", "ID_NATURE", "=R_NATURE_PROJET_LIB", None, "Création"),
    (12, "Secteur d'activité (CITI)", "ID_SECTEUR", "=R_SECT_AFF", None, None),
    (13, "Région du site", "ID_REGION", "=R_REG_LIB", None, "Souss-Massa"),
    (14, "Type de zone", "ID_ZONE", "=R_TYPE_ZONE_LIB", None, "Zone côtière / littoral"),
    (15, "Ville / localité", "ID_VILLE", None, None, "Taghazout"),
    (17, "Montant demandé (MAD)", "ID_DEMANDE", None, "#,##0", 38000000),
    (18, "Montant total de l'investissement (MAD)", "ID_INVEST", None, "#,##0", 52000000),
    (19, "Durée du crédit (mois)", "ID_DUREE", None, "0", 84),
    (20, "Effectif total (salariés)", "ID_EFFECTIF", None, "0", 80),
    (21, "Ligne de financement / refinancement", "ID_LIGNE", "=R_LIGNE_FINANCEMENT_LIB", None, "Ressources propres de la banque"),
    (22, "Principes de l'Équateur applicables", "ID_EQUATEUR", OUINON, None, "Non"),
    (23, "Projet de développement durable", "ID_DD", OUINON, None, "Non"),
]
aides = {
    "ID_TYPECREDIT": "Un crédit de fonctionnement est hors périmètre : l'évaluation E&S ne s'impose pas.",
    "ID_SECTEUR": "Le secteur fixe la catégorie indicative, la sensibilité climatique, le facteur d'émission et les modules d'activité.",
    "ID_REGION": "La région fournit les aléas climatiques par défaut (onglet Climat).",
    "ID_EFFECTIF": "Repris automatiquement dans la question SIG01 ; sert aux seuils du Code du travail (10 et 50 salariés).",
    "ID_LIGNE": "Certaines lignes de bailleurs imposent les normes SFI (questionnaire au moins « standard »).",
    "ID_EQUATEUR": "Financement de projet ou prêt lié à un projet au-delà des seuils des Principes de l'Équateur.",
}
for rr, lib, n, src, fmt, ex in champs:
    cellule(I, f"B{rr}", lib, font=f_gras)
    val = ex if EXEMPLE else None
    if n == "ID_SECTEUR" and EXEMPLE:
        val = next(s["code"] + " — " + s["libelle"] for s in D["secteurs"] if s["code"] == "I55")
    if n == "ID_DATE":
        val = "=TODAY()" if not EXEMPLE else "=DATE(2026,11,1)"
    saisie(I, f"C{rr}", val, fmt=fmt, aide=aides.get(n))
    nom(n, "Identification", f"$C${rr}")
    if src:
        liste(I, f"C{rr}", src, lib, aides.get(n))
I["D12"] = "Liste : code CITI — libellé (onglet Référentiels)."
I["D12"].font = f_petit
I.cell(25, 2, "Calculé").font = f_section
calcules = [
    (26, "Code secteur", "SECT_CODE", '=IFERROR(INDEX(R_SECT_CODE,MATCH(ID_SECTEUR,R_SECT_AFF,0)),"")'),
    (27, "Catégorie indicative du secteur", "SECT_CAT", '=IFERROR(INDEX(R_SECT_TAB,MATCH(SECT_CODE,R_SECT_CODE,0),3),"")'),
    (28, "Code région", "REG_CODE", '=IFERROR(INDEX(R_REG_CODE,MATCH(ID_REGION,R_REG_LIB,0)),"")'),
    (29, "Stress hydrique de la région (0-4)", "STRESS", '=IFERROR(INDEX(R_REG_ALEAS,MATCH(ID_REGION,R_REG_LIB,0),1),"")'),
    (30, "Code type de zone", "ZONE_CODE", '=IFERROR(INDEX(R_TYPE_ZONE_CODE,MATCH(ID_ZONE,R_TYPE_ZONE_LIB,0)),"")'),
    (31, "Code nature du projet", "NATURE_CODE", '=IFERROR(INDEX(R_NATURE_PROJET_CODE,MATCH(ID_NATURE,R_NATURE_PROJET_LIB,0)),"")'),
    (32, "Crédit d'investissement", "ID_INVEST_OK", '=IFERROR(INDEX(R_TYPE_CREDIT_X,MATCH(ID_TYPECREDIT,R_TYPE_CREDIT_LIB,0)),"Oui")'),
    (33, "Normes SFI exigées par le financement", "ID_SFI", '=IF(OR(ID_EQUATEUR="Oui",IFERROR(INDEX(R_LIGNE_FINANCEMENT_X,MATCH(ID_LIGNE,R_LIGNE_FINANCEMENT_LIB,0))="Oui",FALSE)),"Oui","Non")'),
    (34, "Montant comparé au seuil (MAD)", "MONTANT_COMP", '=IF(N(ID_INVEST)>0,ID_INVEST,N(ID_DEMANDE))'),
    (35, "Évaluation E&S", "DECLENCHEMENT", '=IF(ID_INVEST_OK="Non","Hors périmètre (crédit de fonctionnement)",IF(OR(CAT="A",MONTANT_COMP>P_SEUIL),"Obligatoire","Volontaire"))'),
    (36, "Motif", "MOTIF_DECL", '=IF(ID_INVEST_OK="Non","Crédit de fonctionnement",IF(CAT="A","Projet de catégorie A","")&IF(AND(CAT="A",MONTANT_COMP>P_SEUIL)," ; ","")&IF(MONTANT_COMP>P_SEUIL,"Investissement supérieur au seuil de "&TEXT(P_SEUIL/1000000,"0")&" M MAD",""))'),
]
for rr, lib, n, f in calcules:
    cellule(I, f"B{rr}", lib)
    calc(I, f"C{rr}", f, fmt="#,##0" if n == "MONTANT_COMP" else None, gras=n == "DECLENCHEMENT")
    nom(n, "Identification", f"$C${rr}")

# ════════════════════════════ Exclusion ═════════════════════════════════
E = ws["Exclusion"]
entete(E, "2. Liste d'exclusion", "Répondez Oui / Non à chaque critère. Un « Oui » exclut le projet, sauf dérogation du Responsable RSE sur un critère dérogeable.")
for col, w_ in zip("ABCDEFGH", (8, 9, 80, 16, 11, 11, 13, 40)):
    E.column_dimensions[col].width = w_
ligne_entete(E, 5, ["Code", "Source", "Critère", "Nature", "Dérogeable", "Réponse", "Dérogation RSE", "Justification / motif"])
NAT = {"interdiction_legale": "Interdiction légale", "exclusion_bailleur": "Exclusion bailleur", "restriction_sectorielle": "Restriction sectorielle", "politique_groupe": "Politique du groupe"}
for i, c in enumerate(D["exclusion"]):
    rr = 6 + i
    cellule(E, f"A{rr}", c["code"])
    cellule(E, f"B{rr}", c["source"])
    cellule(E, f"C{rr}", c["libelle"], align=HAUT)
    cellule(E, f"D{rr}", NAT.get(c["nature"]["nature"], c["nature"]["nature"]))
    cellule(E, f"E{rr}", "Oui" if c["nature"]["derogeable"] else "Non", align=CENTRE)
    saisie(E, f"F{rr}", ("Non" if EXEMPLE else None))
    saisie(E, f"G{rr}")
    saisie(E, f"H{rr}")
    E.row_dimensions[rr].height = 48
EF = 6 + len(D["exclusion"]) - 1
liste(E, f"F6:F{EF}", OUINON)
liste(E, f"G6:G{EF}", OUINON, "Dérogation", "Réservée au Responsable RSE, uniquement sur un critère dérogeable, avec justification.")
E.conditional_formatting.add(f"F6:F{EF}", CellIsRule(operator="equal", formula=['"Oui"'], fill=fill("F8CBAD")))
rr = EF + 2
cellule(E, f"C{rr}", "Critères répondus", font=f_gras)
calc(E, f"F{rr}", f'=COUNTA(F6:F{EF})&" / {len(D["exclusion"])}"')
cellule(E, f"C{rr + 1}", "Projet exclu", font=f_gras)
calc(E, f"F{rr + 1}", f'=IF(SUMPRODUCT((F6:F{EF}="Oui")*((E6:E{EF}="Non")+(G6:G{EF}<>"Oui")>0))>0,"Oui","Non")', gras=True)
nom("EXCLU", "Exclusion", f"$F${rr + 1}")
cellule(E, f"C{rr + 2}", "Dérogation saisie sur un critère non dérogeable (à corriger)", font=f_gras)
calc(E, f"F{rr + 2}", f'=IF(SUMPRODUCT((G6:G{EF}="Oui")*(E6:E{EF}="Non"))>0,"Oui","Non")')
E.conditional_formatting.add(f"F{rr + 1}", CellIsRule(operator="equal", formula=['"Oui"'], fill=fill("F8CBAD"), font=Font(bold=True, color="C00000")))

# ════════════════════════════ Catégorisation ════════════════════════════
C = ws["Catégorisation"]
entete(C, "3. Catégorisation A, B, C, FI", "25 éléments : un « Oui » à un élément A classe le projet en A. Préséance A > B > FI > C.")
for col, w_ in zip("ABCDE", (6, 10, 92, 11, 30)):
    C.column_dimensions[col].width = w_
ligne_entete(C, 5, ["N°", "Catégorie", "Élément", "Réponse", "Commentaire"])
EXEMPLE_CAT = {12, 15, 16, 17}  # hôtel : rejets liquides, déchets, eau, énergie → B
for i, c in enumerate(D["categorisation"]):
    rr = 6 + i
    cellule(C, f"A{rr}", c["numero"], align=CENTRE)
    cellule(C, f"B{rr}", c["categorie"], align=CENTRE)
    cellule(C, f"C{rr}", c["libelle"], align=HAUT)
    saisie(C, f"D{rr}", ("Oui" if c["numero"] in EXEMPLE_CAT else "Non") if EXEMPLE else None)
    saisie(C, f"E{rr}")
    C.row_dimensions[rr].height = 32
CF = 6 + len(D["categorisation"]) - 1
liste(C, f"D6:D{CF}", OUINON)
C.conditional_formatting.add(f"D6:D{CF}", CellIsRule(operator="equal", formula=['"Oui"'], fill=fill(CREME)))
rr = CF + 2
lignes_cat = [
    ("Éléments A positifs", f'=COUNTIFS(B6:B{CF},"A",D6:D{CF},"Oui")'),
    ("Éléments B positifs", f'=COUNTIFS(B6:B{CF},"B",D6:D{CF},"Oui")'),
    ("Éléments C positifs", f'=COUNTIFS(B6:B{CF},"C",D6:D{CF},"Oui")'),
    ("Éléments FI positifs", f'=COUNTIFS(B6:B{CF},"FI",D6:D{CF},"Oui")'),
    ("Éléments sans réponse", f"=COUNTBLANK(D6:D{CF})"),
]
for k, (lib, f) in enumerate(lignes_cat):
    cellule(C, f"C{rr + k}", lib, font=f_gras)
    calc(C, f"D{rr + k}", f)
rA, rB, rC, rFI, rM = rr, rr + 1, rr + 2, rr + 3, rr + 4
rr += 6
cellule(C, f"C{rr}", "Catégorie calculée", font=f_gras)
calc(C, f"D{rr}", f'=IF(D{rA}>0,"A",IF(D{rM}>0,"",IF(D{rB}>0,"B",IF(D{rFI}>0,"FI",IF(D{rC}>0,"C","")))))', gras=True)
nom("CAT_CALC", "Catégorisation", f"$D${rr}")
cellule(C, f"C{rr + 1}", "Catégorie retenue par le Responsable RSE (reclassement, facultatif)", font=f_gras)
saisie(C, f"D{rr + 1}", aide="Réservé au Responsable RSE. Laisser vide pour retenir la catégorie calculée.")
liste(C, f"D{rr + 1}", '"A,B,C,FI"')
cellule(C, f"C{rr + 2}", "Justification du reclassement", font=f_gras)
saisie(C, f"D{rr + 2}")
C.merge_cells(f"D{rr + 2}:E{rr + 2}")
cellule(C, f"C{rr + 3}", "CATÉGORIE RETENUE", font=Font(name=POLICE, size=12, bold=True, color=ORANGE))
calc(C, f"D{rr + 3}", f'=IF(D{rr + 1}<>"",D{rr + 1},D{rr})', gras=True)
nom("CAT", "Catégorisation", f"$D${rr + 3}")
cellule(C, f"C{rr + 4}", "Étude d'impact (EIES) exigée", font=f_gras)
calc(C, f"D{rr + 4}", '=IF(CAT="A","Oui","Non")')
cellule(C, f"C{rr + 5}", "Catégorie indicative du secteur (pour contrôle)", font=f_gras)
calc(C, f"D{rr + 5}", "=SECT_CAT")
C.cell(rr + 7, 3, "Formulaire incomplet sans élément A : pas de catégorie calculée. Un seul « Oui » A suffit pour classer en A.").font = f_petit

# ════════════════════════════ Questionnaire ═════════════════════════════
Q = ws["Questionnaire"]
entete(Q, "4. Questionnaire des risques environnementaux et sociaux", "Répondez aux questions « Applicable = Oui ». Lisez la consigne et l'exemple à droite. « Non » à une mesure de contrôle = risque non maîtrisé.")
NIV_LIB = {"reglementaire": "Réglementaire", "interne": "Interne / BAM", "sfi": "SFI / Équateur", "bonne_pratique": "Bonne pratique"}
cols = [("A", "Code", 8), ("B", "Thématique", 18), ("C", "Bloc", 18), ("D", "Question", 60), ("E", "Catégories", 9), ("F", "Type", 9), ("G", "Niveau", 13), ("H", "Module", 8), ("I", "Pilier ESG", 7), ("J", "Gravité", 7), ("K", "Réponse à risque", 8),
        ("L", "Applicable", 10), ("M", "Réponse", 11), ("N", "Résultat", 11), ("O", "Commentaire / preuve vue", 30), ("P", "Comment répondre", 60), ("Q", "Preuves à demander", 34), ("R", "Exemple", 50), ("S", "Références", 28), ("T", "Obligatoire", 9)]
for col, t, w_ in cols:
    Q.column_dimensions[col].width = w_
ligne_entete(Q, 5, [c[1] for c in cols])
for col in "UVWXYZ":
    Q.column_dimensions[col].hidden = True
for col in ("AA", "AB"):
    Q.column_dimensions[col].hidden = True
EXEMPLE_REP = {
    "SIG02": 38, "SIG03": "Gardiennage, blanchisserie, collecte des déchets",
    "EFF01": "Oui", "EFF02": "Oui", "EFF03": "Non", "DS01": "Oui", "DS02": "Non", "AIR01": "Non", "AIR02": "Sans objet", "AIR03": "Oui",
    "DD01": "Oui", "DD02": "Oui", "DD03": "Non", "URG01": "Oui", "URG02": "Oui", "CERT01": "Oui", "CERT02": "Non", "SGE01": "Oui", "SGE02": "Non",
    "RES01": "Oui", "RES02": "Non", "HN01": "Non", "HS01": "Oui", "HS02": "Oui", "HS03": "Oui", "HS04": "Oui", "CT01": "Oui", "CT02": "Oui",
    "RH01": "Oui", "RH02": "Oui", "RH03": "Oui", "RH04": "Oui", "RH05": "Oui", "RH06": "Non", "RH07": "Non", "NP01": "Oui", "NP04": "Sans objet",
    "NP05": "Non", "NP06": "Non", "NP08": "Non", "CL01": "Non", "CL02": "Oui", "CL03": "Sans objet", "CL04": "Oui", "CL05": "Oui",
}
QN = len(D["questions"])
QF = 6 + QN - 1
for i, x in enumerate(D["questions"]):
    rr = 6 + i
    g = GUIDE.get(x["code"], {})
    vals = [x["code"], x["thematiqueLib"], x["bloc"], x["libelle"], x["categories"], {"oui_non": "Oui/Non", "oui_non_na": "Oui/Non/SO", "nombre": "Nombre", "texte": "Texte"}[x["type"]],
            NIV_LIB[x["niveau"]], x["module"], x["pilier"], x["gravite"], x["risque"] or ""]
    for j, v in enumerate(vals):
        cellule(Q, f"{'ABCDEFGHIJK'[j]}{rr}", v, align=HAUT if j in (1, 2, 3) else CENTRE)
    Q[f"D{rr}"].font = Font(name=POLICE, size=10, bold=True, color="333333")
    applicable = (f'=IF(CAT="","Non",IF(AND(ISNUMBER(SEARCH(","&CAT&",",","&E{rr}&",")),OR(Q_NIVEAU="complet",AND(OR(G{rr}="Réglementaire",G{rr}="Interne / BAM",AND(G{rr}="SFI / Équateur",Q_NIVEAU="standard")),'
                  f'OR(H{rr}="",IFERROR(INDEX(R_MOD_RET,MATCH(H{rr},R_MOD_CODE,0)),"Oui")="Oui")))),"Oui","Non"))')
    calc(Q, f"L{rr}", applicable)
    Q[f"L{rr}"].alignment = CENTRE
    if x["code"] == "SIG01":
        calc(Q, f"M{rr}", '=IF(ID_EFFECTIF="","",ID_EFFECTIF)')
        Q[f"M{rr}"].comment = Comment("Repris de l'onglet Identification (effectif).", "ESG Climat 360")
    else:
        saisie(Q, f"M{rr}", EXEMPLE_REP.get(x["code"]) if EXEMPLE else None)
        if x["type"] == "oui_non":
            liste(Q, f"M{rr}", OUINON)
        elif x["type"] == "oui_non_na":
            liste(Q, f"M{rr}", REP_ONNA)
    Q[f"M{rr}"].alignment = CENTRE
    resultat = (f'=IF(OR(L{rr}<>"Oui",M{rr}="",M{rr}="Sans objet",K{rr}=""),"",IF(F{rr}="Nombre",IF(AND(ISNUMBER(M{rr}),LEFT(K{rr},1)=">"),IF(M{rr}>VALUE(MID(K{rr},2,10)),"Risque","Maîtrisé"),""),'
                f'IF(LOWER(M{rr})=LOWER(K{rr}),"Risque","Maîtrisé")))')
    calc(Q, f"N{rr}", resultat, gras=True)
    Q[f"N{rr}"].alignment = CENTRE
    saisie(Q, f"O{rr}")
    cellule(Q, f"P{rr}", g.get("repondre", ""), align=HAUT)
    cellule(Q, f"Q{rr}", g.get("preuves", ""), align=HAUT)
    cellule(Q, f"R{rr}", g.get("exemple", ""), align=HAUT, font=Font(name=POLICE, size=10, italic=True, color=BRUN2))
    cellule(Q, f"S{rr}", x["references"], align=HAUT, font=f_petit)
    cellule(Q, f"T{rr}", "Oui" if x["obligatoire"] else "Non", align=CENTRE)
    # Colonnes de calcul (masquées)
    Q[f"U{rr}"] = f'=IF(AND(L{rr}="Oui",K{rr}<>"",M{rr}<>"",M{rr}<>"Sans objet"),J{rr},0)'
    Q[f"V{rr}"] = f'=IF(N{rr}="Risque",J{rr},0)'
    Q[f"W{rr}"] = f'=IF(AND(N{rr}="Risque",J{rr}>=4),1,0)'
    Q[f"X{rr}"] = f'=IF(AND(L{rr}="Oui",K{rr}<>"",I{rr}<>""),1,0)'
    Q[f"Y{rr}"] = f'=IF(AND(X{rr}=1,M{rr}<>""),1,0)'
    Q[f"Z{rr}"] = f'=IF(AND(L{rr}="Oui",M{rr}="",T{rr}="Oui"),1,0)'
    Q[f"AA{rr}"] = f'=IF(AND(U{rr}>0,N{rr}="Maîtrisé"),J{rr},0)'
    Q[f"AB{rr}"] = x["thematique"]
    Q.row_dimensions[rr].height = 96
Q.freeze_panes = "E6"
Q.auto_filter.ref = f"A5:T{QF}"
Q.conditional_formatting.add(f"A6:T{QF}", FormulaRule(formula=[f'$L6="Non"'], font=Font(color="A6A6A6")))
Q.conditional_formatting.add(f"N6:N{QF}", CellIsRule(operator="equal", formula=['"Risque"'], fill=fill("F8CBAD"), font=Font(bold=True, color="C00000")))
Q.conditional_formatting.add(f"N6:N{QF}", CellIsRule(operator="equal", formula=['"Maîtrisé"'], fill=fill("E2EFDA"), font=Font(bold=True, color="375623")))
Q.conditional_formatting.add(f"M6:M{QF}", FormulaRule(formula=[f'AND($L6="Oui",$M6="",$T6="Oui")'], fill=fill("FCE4D6")))
for n_, col in (("Q_GRAV", "J"), ("Q_POIDS", "U"), ("Q_RISQ", "V"), ("Q_CRIT", "W"), ("Q_NOTABLE", "X"), ("Q_REPN", "Y"), ("Q_MANQ", "Z"), ("Q_MAIT", "AA"), ("Q_THEM", "AB"), ("Q_PIL", "I"), ("Q_APP", "L"), ("Q_RES", "N"), ("Q_CODE", "A"), ("Q_REP", "M"), ("Q_CATS", "E")):
    nom(n_, "Questionnaire", f"${col}$6:${col}${QF}")

# ════════════════════════════ Climat ════════════════════════════════════
K = ws["Climat"]
entete(K, "5. Volet climat (directive BAM 5/W/2021)", "Aléas repris de la région (ajustables), sensibilité, facteurs de transition, émissions financées (PCAF).")
for col, w_ in zip("ABCDE", (44, 16, 16, 16, 60)):
    K.column_dimensions[col].width = w_
ligne_entete(K, 5, ["Aléa physique du site (0 = nul, 4 = très élevé)", "Valeur de la région", "Ajustement (0-4, ?, NA)", "Valeur retenue", "Conseil"])
conseils = ["Nappe surexploitée, pénuries récentes : 3 à 4.", "Années sèches successives, baisse des barrages.", "Zone inondable, oued, crues éclair.", "Vagues de chaleur > 45 °C.", "Littoral bas, érosion du trait de côte.", "Proximité de massifs forestiers.", "Zone sismique (RPS 2000), séismes récents."]
EX_ADJ = {4: 3}
for k, a in enumerate(ALEAS):
    rr = 6 + k
    cellule(K, f"A{rr}", a, font=f_gras)
    calc(K, f"B{rr}", f'=IFERROR(INDEX(R_REG_ALEAS,MATCH(ID_REGION,R_REG_LIB,0),{k + 1}),"")')
    saisie(K, f"C{rr}", EX_ADJ.get(k) if EXEMPLE else None)
    calc(K, f"D{rr}", f'=IF(C{rr}<>"",C{rr},IF(B{rr}="","?",B{rr}))', gras=True)
    cellule(K, f"E{rr}", conseils[k], font=f_petit)
liste(K, "C6:C12", '"0,1,2,3,4,?,NA"', "Aléa", "0 à 4 ; « ? » si inconnu ; « NA » si non applicable. Vide = valeur de la région.")
cellule(K, "A14", "Sensibilité de l'activité aux aléas (0-4)", font=f_gras)
calc(K, "B14", '=IFERROR(INDEX(R_SECT_TAB,MATCH(SECT_CODE,R_SECT_CODE,0),5),"")')
saisie(K, "C14")
calc(K, "D14", '=IF(C14<>"",C14,N(B14))', gras=True)
cellule(K, "E14", "Valeur du secteur par défaut ; à ajuster selon le site.", font=f_petit)
cellule(K, "A15", "Capacité d'adaptation (mesures en place, 0-4)", font=f_gras)
saisie(K, "C15", 2 if EXEMPLE else None)
calc(K, "D15", "=N(C15)", gras=True)
cellule(K, "E15", "Ex. : bassin de rétention, forage de secours, assurance CAT → 2 à 3.", font=f_petit)
liste(K, "C14:C15", '"0,1,2,3,4"')
ligne_entete(K, 17, ["Facteurs de transition (0-4, ?, NA)", "", "Saisie", "Valeur retenue", "Conseil"])
TRANS = [("Réglementaire (tarification carbone, normes)", "Normes d'émission, taxe carbone à venir."), ("Technologique (obsolescence, substitution)", "Procédé fossile remplaçable, équipements anciens."), ("Marché (demande, coûts de l'énergie)", "Dépendance au fioul, clients exigeant du bas carbone."), ("Réputation", "Exposition médiatique, attentes des donneurs d'ordre.")]
EX_TR = [1, 1, 2, 1]
for k, (a, cons) in enumerate(TRANS):
    rr = 18 + k
    cellule(K, f"A{rr}", a, font=f_gras)
    saisie(K, f"C{rr}", EX_TR[k] if EXEMPLE else None)
    calc(K, f"D{rr}", f'=IF(C{rr}="","?",C{rr})', gras=True)
    cellule(K, f"E{rr}", cons, font=f_petit)
liste(K, "C18:C21", '"0,1,2,3,4,?,NA"')
cellule(K, "A23", "Risque de transition du secteur (0-4)", font=f_gras)
calc(K, "D23", '=IFERROR(INDEX(R_SECT_TAB,MATCH(SECT_CODE,R_SECT_CODE,0),4),0)', gras=True)
cellule(K, "A24", "Exposition au mécanisme carbone européen (CBAM)", font=f_gras)
calc(K, "B24", '=IFERROR(INDEX(R_SECT_TAB,MATCH(SECT_CODE,R_SECT_CODE,0),7),"Non")')
saisie(K, "C24")
liste(K, "C24", OUINON)
calc(K, "D24", '=IF(C24<>"",C24,B24)', gras=True)
cellule(K, "A25", "Part des exportations vers l'UE (%)", font=f_gras)
saisie(K, "C25", 0 if EXEMPLE else None)
calc(K, "D25", "=N(C25)", gras=True)
cellule(K, "A26", "Alignement sur la taxonomie verte", font=f_gras)
saisie(K, "C26", "Non aligné" if EXEMPLE else None)
liste(K, "C26", '"Vert (aligné),Transition,Non aligné,Non éligible"')
calc(K, "D26", '=IF(C26="","Non aligné",C26)', gras=True)

ligne_entete(K, 28, ["Calcul", "", "", "Résultat", "Explication"])
CALCK = [
    (29, "Aléas renseignés (sur 7)", '=7-SUMPRODUCT((D6:D12="?")*1)', None, "« NA » compte comme renseigné."),
    (30, "Facteurs de transition renseignés (sur 4)", '=4-SUMPRODUCT((D18:D21="?")*1)', None, ""),
    (31, "Couverture des données", "=(D29+D30)/11", "0%", "Sous le minimum (paramètre), aucun score global."),
    (32, "Aléas chiffrés", "=COUNT(D6:D12)", None, ""),
    (33, "Aléa maximal", "=IF(D32=0,0,MAX(D6:D12))", None, ""),
    (34, "Moyenne des trois principaux aléas", "=IF(D32=0,0,(LARGE(D6:D12,1)+IF(D32>=2,LARGE(D6:D12,2),0)+IF(D32>=3,LARGE(D6:D12,3),0))/MIN(3,D32))", "0.00", ""),
    (35, "Risque physique (0-100)", '=IF(D29=0,"",ROUND(MIN(100,MAX(0,(0.6*D33+0.4*D34)*(0.5+MIN(4,MAX(0,D14))/8)*(1-0.1*MIN(4,MAX(0,D15)))*100/4)),1))', "0.0", "Exposition (0,6 × max + 0,4 × moyenne) × (0,5 + sensibilité / 8) × (1 − 0,1 × adaptation)."),
    (36, "Moyenne des facteurs de transition", "=IF(COUNT(D18:D21)=0,0,AVERAGE(D18:D21))", "0.00", ""),
    (37, "Risque de transition (0-100)", '=IF(D30=0,"",ROUND(MIN(100,MAX(0,(0.5*MIN(4,MAX(0,D23))+0.5*D36+IF(D24="Oui",IF(D25>=10,1,0.5),0))*IF(D26="Vert (aligné)",0.5,IF(D26="Transition",0.75,1))*100/4)),1))', "0.0", "(0,5 × secteur + 0,5 × facteurs + CBAM) × réduction taxonomique."),
    (38, "SCORE CLIMAT (0-100)", '=IF(OR(D35="",D37="",D31<P_CLIM_COUV),"",ROUND(P_POND1*MAX(D35,D37)+P_POND2*MIN(D35,D37),1))', "0.0", "0,6 × risque dominant + 0,4 × l'autre."),
    (39, "Niveau climat", '=IF(D38="","Données insuffisantes",IF(D38>=P_CS3,"Très élevé",IF(D38>=P_CS2,"Élevé",IF(D38>=P_CS1,"Modéré","Faible"))))', None, ""),
]
for rr, lib, f, fmt, ex in CALCK:
    cellule(K, f"A{rr}", lib, font=f_gras if rr in (38, 39) else f_norm)
    calc(K, f"D{rr}", f, fmt=fmt, gras=rr in (35, 37, 38, 39))
    cellule(K, f"E{rr}", ex, font=f_petit)
nom("CLIM_COUV", "Climat", "$D$31")
nom("CLIM_PHYS", "Climat", "$D$35")
nom("CLIM_TRANS", "Climat", "$D$37")
nom("CLIM_SCORE", "Climat", "$D$38")
nom("CLIM_NIV", "Climat", "$D$39")

ligne_entete(K, 41, ["Émissions financées (PCAF)", "", "Saisie", "Résultat", "Explication"])
cellule(K, "A42", "Méthode", font=f_gras)
saisie(K, "C42", "Estimée (secteur)" if EXEMPLE else None)
liste(K, "C42", '"Déclarée,Estimée (activité),Estimée (secteur)"')
calc(K, "D42", '=IF(C42="","Estimée (secteur)",C42)')
for rr, lib in ((43, "Scope 1 (tCO2e/an)"), (44, "Scope 2 (tCO2e/an)"), (45, "Scope 3 (tCO2e/an, facultatif)")):
    cellule(K, f"A{rr}", lib)
    saisie(K, f"C{rr}", fmt="#,##0")
cellule(K, "A46", "Émissions vérifiées par un tiers", font=f_gras)
saisie(K, "C46")
cellule(K, "A47", "Source référencée (bilan, audit, rapport)", font=f_gras)
saisie(K, "C47")
liste(K, "C46:C47", OUINON)
calc(K, "B48", '=IFERROR(INDEX(R_SECT_TAB,MATCH(SECT_CODE,R_SECT_CODE,0),6),0)')
cellule(K, "A48", "Facteur sectoriel (tCO2e par M MAD investi)")
cellule(K, "A49", "Émissions totales (tCO2e/an)", font=f_gras)
calc(K, "D49", '=ROUND(IF(D42="Estimée (secteur)",B48*IF(N(ID_INVEST)>0,ID_INVEST,N(ID_DEMANDE))/1000000,N(C43)+N(C44)+N(C45)),1)', fmt="#,##0.0", gras=True)
cellule(K, "A50", "Part attribuée à la banque")
calc(K, "D50", '=IF(N(ID_INVEST)>0,MIN(1,MAX(0,N(ID_DEMANDE)/ID_INVEST)),1)', fmt="0.0%")
cellule(K, "A51", "ÉMISSIONS FINANCÉES (tCO2e/an)", font=f_gras)
calc(K, "D51", "=ROUND(D49*D50,1)", fmt="#,##0.0", gras=True)
cellule(K, "A52", "Qualité des données PCAF (1 meilleure à 5)", font=f_gras)
calc(K, "D52", '=IF(D42="Déclarée",IF(C47<>"Oui",5,IF(C46="Oui",1,2)),IF(D42="Estimée (activité)",IF(C47="Oui",3,5),5))', gras=True)
cellule(K, "E52", "1 : déclarées et vérifiées ; 2 : déclarées ; 3 : activité ; 5 : estimation sectorielle.", font=f_petit)
nom("PCAF", "Climat", "$D$52")
K.conditional_formatting.add("D38", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=100, color=ORANGE))

# ════════════════════════════ Pièces ════════════════════════════════════
PI = ws["Pièces"]
entete(PI, "6. Pièces du dossier", "Pièces attendues selon la catégorie. Indiquez l'état de chaque pièce ; une pièce officielle ne peut pas être remplacée par un canevas.")
for col, w_ in zip("ABCDEFGH", (16, 52, 10, 15, 22, 9, 8, 50)):
    PI.column_dimensions[col].width = w_
ligne_entete(PI, 5, ["Code", "Pièce", "Officielle", "Attendue", "État", "Valeur", "Poids", "Informations manquantes / commentaire"])
LIB_DOC = {x["code"]: x["libelle"] for x in D["listes"]["type_document"]}
PIECES = [("PRESENTATION", "Non", '="Recommandée"'), ("EIES", "Oui", '=IF(CAT="A","Obligatoire",IF(CAT="B","Recommandée","Non attendue"))'), ("PGES", "Non", '=IF(CAT="A","Obligatoire",IF(CAT="B","Recommandée","Non attendue"))'),
          ("ACCEPTABILITE", "Oui", '=IF(CAT="A","Obligatoire",IF(CAT="B","Recommandée","Non attendue"))'), ("AUTORISATION", "Oui", '=IF(CAT="A","Obligatoire",IF(CAT="","Non attendue","Recommandée"))'),
          ("PLAN_ACTION", "Non", '="Recommandée"'), ("ENGAGEMENT", "Non", '="Recommandée"')]
EX_PI = ["Complète", "Déposée non analysée", "Incomplète", "Manquante", "Complète", "Manquante", "Manquante"]
for k, (code, off, f) in enumerate(PIECES):
    rr = 6 + k
    cellule(PI, f"A{rr}", code)
    cellule(PI, f"B{rr}", LIB_DOC.get(code, code))
    cellule(PI, f"C{rr}", off, align=CENTRE)
    calc(PI, f"D{rr}", f)
    saisie(PI, f"E{rr}", EX_PI[k] if EXEMPLE else None)
    calc(PI, f"F{rr}", f'=IF(D{rr}="Non attendue",0,IF(E{rr}="Complète",1,IF(E{rr}="Déposée non analysée",0.75,IF(E{rr}="Canevas",IF(C{rr}="Oui",0.5,0.75),IF(E{rr}="Incomplète",0.5,0)))))', fmt="0.00")
    calc(PI, f"G{rr}", f'=IF(D{rr}="Obligatoire",2,IF(D{rr}="Recommandée",1,0))')
    saisie(PI, f"H{rr}")
liste(PI, "E6:E12", '"Complète,Incomplète,Manquante,Canevas,Déposée non analysée"', "État", "Vide = manquante. Canevas : rempli avec le client en l'absence de la pièce.")
PI.conditional_formatting.add("E6:E12", FormulaRule(formula=['AND($D6="Obligatoire",OR($E6="",$E6="Manquante",$E6="Incomplète",AND($E6="Canevas",$C6="Oui")))'], fill=fill("F8CBAD")))
cellule(PI, "B14", "Score de complétude des pièces (0-100)", font=f_gras)
calc(PI, "F14", '=IF(SUM(G6:G12)=0,"",ROUND(100*SUMPRODUCT(F6:F12,G6:G12)/SUM(G6:G12),1))', fmt="0.0", gras=True)
nom("DOC_SCORE", "Pièces", "$F$14")
cellule(PI, "B15", "Pièces obligatoires à compléter", font=f_gras)
calc(PI, "F15", '=SUMPRODUCT((D6:D12="Obligatoire")*((E6:E12="")+(E6:E12="Manquante")+(E6:E12="Incomplète")+(E6:E12="Canevas")*(C6:C12="Oui")>0))', gras=True)
nom("DOC_A_COMPLETER", "Pièces", "$F$15")
PI.cell(17, 2, "Complète = 1 ; déposée non analysée ou canevas = 0,75 (0,5 pour une pièce officielle) ; incomplète = 0,5 ; manquante = 0. Les pièces obligatoires comptent double.").font = f_petit

# ════════════════════════════ Plan d'actions ════════════════════════════
PA = ws["Plan d'actions"]
entete(PA, "7. Plan d'actions correctives", "Les actions types sont proposées automatiquement pour chaque risque non maîtrisé (colonne « Proposée »). Filtrez sur « Oui », puis négociez avec le client.")
for col, w_ in zip("ABCDEFGHIJK", (8, 18, 70, 9, 8, 10, 10, 22, 13, 13, 30)):
    PA.column_dimensions[col].width = w_
ligne_entete(PA, 5, ["Question", "Thématique", "Action corrective type", "Horizon", "Délai (mois)", "Proposée", "Retenue", "Responsable (client)", "Échéance", "Budget (MAD)", "Commentaire / réserve du client"])
HZ = {"court": "Court", "moyen": "Moyen", "long": "Long"}
rr = 6
for x in D["questions"]:
    for a in x["actions"]:
        cellule(PA, f"A{rr}", x["code"], align=CENTRE)
        cellule(PA, f"B{rr}", x["thematiqueLib"])
        cellule(PA, f"C{rr}", a["libelle"], align=HAUT)
        cellule(PA, f"D{rr}", HZ.get(a["horizon"], a["horizon"]), align=CENTRE)
        cellule(PA, f"E{rr}", a["delai"], align=CENTRE)
        calc(PA, f"F{rr}", f'=IF(IFERROR(INDEX(Q_RES,MATCH(A{rr},Q_CODE,0)),"")="Risque","Oui","Non")', gras=True)
        PA[f"F{rr}"].alignment = CENTRE
        saisie(PA, f"G{rr}")
        saisie(PA, f"H{rr}")
        saisie(PA, f"I{rr}", fmt="dd/mm/yyyy")
        saisie(PA, f"J{rr}", fmt="#,##0")
        saisie(PA, f"K{rr}")
        PA.row_dimensions[rr].height = 30
        rr += 1
PAF = rr - 1
PA.cell(PAF + 2, 1, "Actions ajoutées (hors actions types)").font = f_section
ligne_entete(PA, PAF + 3, ["", "Thématique", "Action", "Horizon", "Délai (mois)", "Proposée", "Retenue", "Responsable (client)", "Échéance", "Budget (MAD)", "Commentaire"])
M0, M1 = PAF + 4, PAF + 13
for rr in range(M0, M1 + 1):
    for col in "BCDEGHIJK":
        saisie(PA, f"{col}{rr}")
    calc(PA, f"F{rr}", f'=IF(C{rr}<>"","Ajoutée","")')
liste(PA, f"G6:G{M1}", OUINON, "Retenue", "Oui : le client s'engage sur l'action ; Non : action écartée (motif en commentaire).")
liste(PA, f"D{M0}:D{M1}", '"Court,Moyen,Long"')
PA.conditional_formatting.add(f"A6:K{PAF}", FormulaRule(formula=['$F6="Non"'], font=Font(color="BFBFBF")))
PA.conditional_formatting.add(f"F6:F{PAF}", CellIsRule(operator="equal", formula=['"Oui"'], fill=fill(CREME), font=Font(bold=True, color=BRUN)))
PA.auto_filter.ref = f"A5:K{PAF}"
PA.freeze_panes = "D6"
s = M1 + 2
cellule(PA, f"C{s}", "Actions proposées", font=f_gras)
calc(PA, f"F{s}", f'=COUNTIF(F6:F{PAF},"Oui")')
cellule(PA, f"C{s + 1}", "Actions négociées (proposées ou ajoutées, avec une réponse Retenue)", font=f_gras)
calc(PA, f"F{s + 1}", f'=COUNTIFS(F6:F{PAF},"Oui",G6:G{PAF},"<>")+COUNTIFS(F{M0}:F{M1},"Ajoutée",G{M0}:G{M1},"<>")')
cellule(PA, f"C{s + 2}", "Actions retenues par le client", font=f_gras)
calc(PA, f"F{s + 2}", f'=COUNTIFS(F6:F{PAF},"Oui",G6:G{PAF},"Oui")+COUNTIFS(F{M0}:F{M1},"Ajoutée",G{M0}:G{M1},"Oui")')
cellule(PA, f"C{s + 3}", "Engagement sur le plan d'actions (0-100)", font=f_gras)
calc(PA, f"F{s + 3}", f'=IF(F{s + 1}=0,"",ROUND(100*F{s + 2}/F{s + 1},1))', fmt="0.0", gras=True)
nom("PLAN_PROPOSEES", "Plan d'actions", f"$F${s}")
nom("PLAN_RETENUES", "Plan d'actions", f"$F${s + 2}")
nom("ENGAGEMENT", "Plan d'actions", f"$F${s + 3}")
if EXEMPLE:
    # Négociation de l'exemple : actions proposées (réponses à risque) retenues, sauf la dernière.
    declencheur = {x["code"]: (x["risque"] or "").lower() for x in D["questions"]}
    a_risque = {c for c, v in EXEMPLE_REP.items() if isinstance(v, str) and v.lower() == declencheur.get(c)}
    lignes_prop = [r_ for r_ in range(6, PAF + 1) if PA[f"A{r_}"].value in a_risque]
    for k, r_ in enumerate(lignes_prop):
        PA[f"G{r_}"] = "Non" if k == len(lignes_prop) - 1 else "Oui"
        PA[f"H{r_}"] = "Directeur technique" if k % 2 else "Responsable HSE"
        PA[f"I{r_}"] = "=DATE(2027,6,30)"
    PA[f"K{lignes_prop[-1]}"] = "Le client propose une alternative à discuter en comité."

# ════════════════════════════ Scores ════════════════════════════════════
S = ws["Scores"]
entete(S, "8. Scores : risque E&S, climat et note ESG", "Tout se calcule : ne rien saisir sur cet onglet.")
for col, w_ in zip("ABCDEF", (46, 16, 16, 16, 16, 50)):
    S.column_dimensions[col].width = w_
S.cell(4, 1, "Questionnaire").font = f_section
LIGNES_S = [
    (5, "Niveau du questionnaire", "Q_NIVEAU", '=IF(OR(CAT="A",CAT="FI",CAT=""),"complet",IF(AND(IF(CAT="B",P_NIV_B,P_NIV_C)="minimum",ID_SFI="Oui"),"standard",IF(CAT="B",P_NIV_B,P_NIV_C)))', None, "A et FI : toujours complet ; normes SFI exigées : au moins standard."),
    (6, "Questions de la catégorie", "Q_TOTAL", '=IF(CAT="",0,SUMPRODUCT(ISNUMBER(SEARCH(","&CAT&",",","&Q_CATS&","))*1))', None, ""),
    (7, "Questions posées", "Q_POSEES", '=COUNTIF(Q_APP,"Oui")', None, "Selon le niveau et les modules d'activité retenus."),
    (8, "Questions posées sans réponse", "Q_SANS_REP", '=SUMPRODUCT((Q_APP="Oui")*(Q_REP=""))', None, ""),
    (9, "dont obligatoires", "Q_OBLIG_MANQ", "=SUM(Q_MANQ)", None, "Le dossier ne peut pas être soumis tant qu'il en reste."),
]
S.cell(11, 1, "Risque E&S résiduel").font = f_section
LIGNES_S += [
    (12, "Σ gravité des réponses notées", "R_POIDS", "=SUM(Q_POIDS)", None, "Questions à risque répondues (hors « Sans objet »)."),
    (13, "Σ gravité des risques non maîtrisés", "R_POIDS_RISQ", "=SUM(Q_RISQ)", None, ""),
    (14, "Risques non maîtrisés", "R_NB", '=COUNTIF(Q_RES,"Risque")', None, ""),
    (15, "dont critiques (gravité 4)", "R_CRIT", "=SUM(Q_CRIT)", None, "Un risque critique porte le niveau au moins à « élevé »."),
    (16, "SCORE DE RISQUE E&S (0-100)", "R_SCORE", '=IF(R_POIDS=0,"",ROUND(1000*R_POIDS_RISQ/R_POIDS,0)/10)', "0.0", "100 × Σ gravité des risques / Σ gravité des réponses."),
    (17, "Niveau (rang 1-4)", "R_RANG", '=IF(R_SCORE="","",MIN(4,MAX(IF(R_CRIT>0,3,1),IF(R_SCORE>=P_RCRIT,4,IF(R_SCORE>=P_RELEV,3,IF(R_SCORE>=P_RMOD,2,1)))+IF(AND(CAT="A",P_RELEVER_A="Oui",R_NB>0),1,0))))', None, "Catégorie A avec risque : un cran de plus."),
    (18, "NIVEAU DE RISQUE E&S", "R_NIVEAU", '=IF(R_RANG="","—",CHOOSE(R_RANG,"Faible","Modéré","Élevé","Critique"))', None, ""),
]
S.cell(20, 1, "Climat").font = f_section
LIGNES_S += [
    (21, "Risque physique", None, "=CLIM_PHYS", "0.0", ""),
    (22, "Risque de transition", None, "=CLIM_TRANS", "0.0", ""),
    (23, "SCORE CLIMAT", None, "=CLIM_SCORE", "0.0", ""),
    (24, "NIVEAU CLIMAT", None, "=CLIM_NIV", None, ""),
    (25, "Émissions financées (tCO2e/an)", None, "='Climat'!D51", "#,##0.0", ""),
]
S.cell(27, 1, "Note ESG — composantes").font = f_section
LIGNES_S += [
    (28, "E · questions environnementales maîtrisées", "E_Q", '=IF(SUMIFS(Q_POIDS,Q_PIL,"E")=0,"",ROUND(100*SUMIFS(Q_MAIT,Q_PIL,"E")/SUMIFS(Q_POIDS,Q_PIL,"E"),1))', "0.0", "100 × Σ gravité maîtrisée / Σ gravité répondue."),
    (29, "E · risque climatique (100 − score climat)", "E_CLIM", '=IF(ISNUMBER(CLIM_SCORE),ROUND(100-CLIM_SCORE,1),"")', "0.0", ""),
    (30, "PILIER E — ENVIRONNEMENT", "P_E", '=IF(AND(E_Q="",E_CLIM=""),"",ROUND((N(E_Q)*IF(E_Q="",0,1-P_PART_CLIM)+N(E_CLIM)*IF(E_CLIM="",0,P_PART_CLIM))/(IF(E_Q="",0,1-P_PART_CLIM)+IF(E_CLIM="",0,P_PART_CLIM)),1))', "0.0", "70 % questions, 30 % climat."),
    (31, "PILIER S — SOCIAL", "P_S", '=IF(SUMIFS(Q_POIDS,Q_PIL,"S")=0,"",ROUND(100*SUMIFS(Q_MAIT,Q_PIL,"S")/SUMIFS(Q_POIDS,Q_PIL,"S"),1))', "0.0", "Santé-sécurité, RH, communautés."),
    (32, "G · système de gestion et conformité", "G_Q", '=IF(SUMIFS(Q_POIDS,Q_PIL,"G")=0,"",ROUND(100*SUMIFS(Q_MAIT,Q_PIL,"G")/SUMIFS(Q_POIDS,Q_PIL,"G"),1))', "0.0", "Poids 50 %."),
    (33, "G · pièces du dossier", "G_DOC", "=DOC_SCORE", "0.0", "Poids 20 %."),
    (34, "G · engagement sur le plan d'actions", "G_ENG", "=ENGAGEMENT", "0.0", "Poids 20 %."),
    (35, "G · transparence des données climat", "G_TRA", '=IF(CLIM_COUV=0,"",ROUND((CLIM_COUV*100+(5-PCAF)/4*100)/2,1))', "0.0", "Poids 10 % : couverture climat et qualité PCAF."),
    (36, "PILIER G — GOUVERNANCE", "P_G", '=IF(AND(G_Q="",G_DOC="",G_ENG="",G_TRA=""),"",ROUND((N(G_Q)*0.5+N(G_DOC)*0.2+N(G_ENG)*0.2+N(G_TRA)*0.1)/(IF(G_Q="",0,0.5)+IF(G_DOC="",0,0.2)+IF(G_ENG="",0,0.2)+IF(G_TRA="",0,0.1)),1))', "0.0", "Composantes disponibles, poids recalculés."),
]
S.cell(38, 1, "Note ESG").font = f_section
LIGNES_S += [
    (39, "Questions notées avec réponse", "ESG_COUV", '=IF(SUM(Q_NOTABLE)=0,0,ROUND(SUM(Q_REPN)/SUM(Q_NOTABLE),2))', "0%", "Sous la part minimale : note provisoire."),
    (40, "Score avant plafond", "ESG_BRUT", '=IF(OR(EXCLU="Oui",SUM(Q_REPN)=0,AND(P_E="",P_S="",P_G="")),"",ROUND((N(P_E)*IF(P_E="",0,P_WE)+N(P_S)*IF(P_S="",0,P_WS)+N(P_G)*IF(P_G="",0,P_WG))/(IF(P_E="",0,P_WE)+IF(P_S="",0,P_WS)+IF(P_G="",0,P_WG)),1))', "0.0", "40 % E + 30 % S + 30 % G."),
    (41, "Plafond appliqué", "ESG_PLAFOND", '=IF(AND(ISNUMBER(ESG_BRUT),R_CRIT>0,ESG_BRUT>=P_NC),"Risque critique non maîtrisé : D au mieux","")', None, ""),
    (42, "SCORE ESG (0-100)", "ESG_SCORE", '=IF(ESG_BRUT="","",IF(ESG_PLAFOND<>"",ROUND(P_NC-0.1,1),ESG_BRUT))', "0.0", ""),
    (43, "NOTE ESG", "ESG_NOTE", '=IF(EXCLU="Oui","Non noté (exclu)",IF(ESG_SCORE="","—",IF(ESG_SCORE>=P_NA,"A",IF(ESG_SCORE>=P_NB,"B",IF(ESG_SCORE>=P_NC,"C",IF(ESG_SCORE>=P_ND,"D","E")))))&IF(AND(ISNUMBER(ESG_SCORE),ESG_COUV<P_ESG_COUV)," (provisoire)",""))', None, "A ≥ 80 · B ≥ 65 · C ≥ 50 · D ≥ 35 · E en dessous."),
    (44, "Lecture", "ESG_LECTURE", '=IF(LEFT(ESG_NOTE,1)="A","Excellente maîtrise des enjeux ESG",IF(LEFT(ESG_NOTE,1)="B","Bonne maîtrise",IF(LEFT(ESG_NOTE,1)="C","Maîtrise moyenne : des progrès sont attendus",IF(LEFT(ESG_NOTE,1)="D","Maîtrise faible : plan d\'actions prioritaire",IF(LEFT(ESG_NOTE,1)="E","Maîtrise insuffisante","")))))', None, ""),
]
for rr, lib, n, f, fmt, ex in LIGNES_S:
    gras = lib.isupper() or lib.startswith("PILIER") or lib.startswith("SCORE") or lib.startswith("NOTE")
    cellule(S, f"A{rr}", lib, font=f_gras if gras else f_norm)
    calc(S, f"B{rr}", f.replace("\\'", "'"), fmt=fmt, gras=gras)
    cellule(S, f"F{rr}", ex, font=f_petit)
    if n:
        nom(n, "Scores", f"$B${rr}")
for ref in ("B30", "B31", "B36", "B42"):
    S.conditional_formatting.add(ref, DataBarRule(start_type="num", start_value=0, end_type="num", end_value=100, color=ORANGE))
S.conditional_formatting.add("B43", FormulaRule(formula=['OR(LEFT(B43,1)="A",LEFT(B43,1)="B")'], fill=fill("E2EFDA"), font=Font(bold=True, color="375623")))
S.conditional_formatting.add("B43", FormulaRule(formula=['LEFT(B43,1)="C"'], fill=fill("FFF2CC"), font=Font(bold=True, color="7F6000")))
S.conditional_formatting.add("B43", FormulaRule(formula=['OR(LEFT(B43,1)="D",LEFT(B43,1)="E")'], fill=fill("F8CBAD"), font=Font(bold=True, color="C00000")))
S.conditional_formatting.add("B18", FormulaRule(formula=['OR(B18="Élevé",B18="Critique")'], fill=fill("F8CBAD"), font=Font(bold=True, color="C00000")))

# Synthèse par thématique
S.cell(46, 1, "Synthèse par thématique").font = f_section
ligne_entete(S, 47, ["Thématique", "Questions posées", "Répondues", "Risques", "État"])
for k, t in enumerate(D["thematiques"]):
    rr = 48 + k
    cellule(S, f"A{rr}", t["libelle"])
    calc(S, f"B{rr}", f'=COUNTIFS(Q_THEM,"{t["code"]}",Q_APP,"Oui")')
    calc(S, f"C{rr}", f'=SUMPRODUCT((Q_THEM="{t["code"]}")*(Q_APP="Oui")*(Q_REP<>""))')
    calc(S, f"D{rr}", f'=COUNTIFS(Q_THEM,"{t["code"]}",Q_RES,"Risque")')
    calc(S, f"E{rr}", f'=IF(B{rr}=0,"Non concerné",IF(D{rr}>0,"Non maîtrisé",IF(C{rr}=0,"À renseigner","Maîtrisé")))', gras=True)
TF = 48 + len(D["thematiques"]) - 1
S.conditional_formatting.add(f"E48:E{TF}", CellIsRule(operator="equal", formula=['"Non maîtrisé"'], font=Font(bold=True, color="C00000")))
S.conditional_formatting.add(f"E48:E{TF}", CellIsRule(operator="equal", formula=['"Maîtrisé"'], font=Font(bold=True, color="375623")))

# ════════════════════════════ Fiche ═════════════════════════════════════
F = ws["Fiche"]
entete(F, "Fiche d'évaluation E&S — synthèse", "Prête à imprimer (format A4). Les clauses du contrat sont à valider par la direction juridique.")
F.column_dimensions["A"].width, F.column_dimensions["B"].width, F.column_dimensions["C"].width, F.column_dimensions["D"].width = 36, 34, 30, 30
blocs = [
    ("Dossier", [("Client", "=ID_CLIENT"), ("Référence", "=ID_REF"), ("Date", "=ID_DATE"), ("Chargé d'affaires", "=ID_CHARGE"), ("Secteur", "=ID_SECTEUR"), ("Région / zone", '=ID_REGION&" · "&ID_ZONE'),
                 ("Montant demandé (MAD)", "=ID_DEMANDE"), ("Investissement total (MAD)", "=ID_INVEST"), ("Ligne de financement", "=ID_LIGNE"), ("Normes SFI exigées", "=ID_SFI")]),
    ("Conclusions", [("Évaluation E&S", "=DECLENCHEMENT"), ("Motif", "=MOTIF_DECL"), ("Liste d'exclusion", '=IF(EXCLU="Oui","Projet exclu","Non concerné")'), ("Catégorie retenue", '=IF(CAT="","À déterminer",CAT)'),
                     ("EIES exigée", '=IF(CAT="A","Oui","Non")'), ("Questionnaire", '=Q_NIVEAU&" — "&Q_POSEES&" questions sur "&Q_TOTAL'), ("Questions sans réponse", "=Q_SANS_REP")]),
    ("Risque E&S résiduel", [("Score (0-100)", "=R_SCORE"), ("Niveau", "=R_NIVEAU"), ("Risques non maîtrisés", "=R_NB"), ("dont critiques", "=R_CRIT")]),
    ("Climat", [("Risque physique", "=CLIM_PHYS"), ("Risque de transition", "=CLIM_TRANS"), ("Score climat", "=CLIM_SCORE"), ("Niveau climat", "=CLIM_NIV"), ("Émissions financées (tCO2e/an)", "='Climat'!D51"), ("Qualité PCAF", "=PCAF")]),
    ("Note ESG", [("NOTE ESG", "=ESG_NOTE"), ("Score ESG (0-100)", "=ESG_SCORE"), ("Lecture", "=ESG_LECTURE"), ("Environnement (E)", "=P_E"), ("Social (S)", "=P_S"), ("Gouvernance (G)", "=P_G"), ("Plafond", "=ESG_PLAFOND")]),
    ("Plan d'actions et pièces", [("Actions proposées", "=PLAN_PROPOSEES"), ("Actions retenues par le client", "=PLAN_RETENUES"), ("Engagement (0-100)", "=ENGAGEMENT"), ("Pièces obligatoires à compléter", "=DOC_A_COMPLETER")]),
]
rr = 4
for titre, lignes in blocs:
    F.cell(rr, 1, titre.upper()).font = Font(name=POLICE, size=11, bold=True, color="FFFFFF")
    for col in "ABCD":
        F[f"{col}{rr}"].fill = FILL_ENTETE
    rr += 1
    for lib, f in lignes:
        cellule(F, f"A{rr}", lib, font=f_gras)
        c = calc(F, f"B{rr}", f, fmt="#,##0" if "MAD" in lib else ("0.0" if "(0-100)" in lib or lib in ("Risque physique", "Risque de transition", "Score climat", "Environnement (E)", "Social (S)", "Gouvernance (G)") else ("dd/mm/yyyy" if lib == "Date" else None)), gras=lib.isupper())
        F.merge_cells(f"B{rr}:D{rr}")
        rr += 1
    rr += 1
F.cell(rr, 1, "Avis du chargé d'affaires").font = f_section
saisie(F, f"A{rr + 1}")
F.merge_cells(f"A{rr + 1}:D{rr + 4}")
F.cell(rr + 6, 1, "Visa du directeur").font = f_gras
F.cell(rr + 6, 3, "Visa du Responsable RSE").font = f_gras
F.print_area = f"A1:D{rr + 8}"
F.page_setup.orientation, F.page_setup.fitToWidth = "portrait", 1
F.sheet_properties.pageSetUpPr.fitToPage = True
for ref in ("B33", "B34", "B35"):
    pass

# ════════════════════════════ Méthode ═══════════════════════════════════
MT = ws["Méthode"]
entete(MT, "Méthode des scores", "Mêmes règles que l'outil web ESG Climat 360 (méthodes indicatives, à valider par le Responsable RSE et la Fonction Risques).", logo=False)
MT.column_dimensions["A"].width, MT.column_dimensions["B"].width = 30, 120
METHODE = [
    ("Déclenchement", "Évaluation obligatoire si le projet est de catégorie A, ou si le montant d'investissement (à défaut, le montant demandé) dépasse le seuil (10 M MAD par défaut). Crédit de fonctionnement : hors périmètre."),
    ("Liste d'exclusion", "Un « Oui » à un critère exclut le projet. Seul le Responsable RSE peut déroger, uniquement sur un critère dérogeable (jamais sur une interdiction légale), avec justification."),
    ("Catégorisation", "25 éléments. Un « Oui » à un élément A suffit pour classer en A. Sinon, quand tout est renseigné : B si un élément B est positif, puis FI, puis C. Le RSE peut reclasser avec justification."),
    ("Questionnaire", "Questions selon la catégorie. Niveau « complet » par défaut ; en « minimum », seules les questions réglementaires et internes ; en « standard », + SFI / Équateur. Les questions d'un module d'activité ne sont posées que si le dossier est concerné (secteur, zone, nature, effectif, stress hydrique, Équateur)."),
    ("Risque E&S résiduel", "Score = 100 × Σ gravité des réponses à risque / Σ gravité des réponses notées (gravité 1 à 4, « Sans objet » exclu). Niveaux : modéré ≥ 15, élevé ≥ 35, critique ≥ 60. Catégorie A avec un risque : un cran de plus. Un risque critique : au moins « élevé »."),
    ("Score climat", "Physique : (0,6 × aléa max + 0,4 × moyenne des 3 principaux) × (0,5 + sensibilité / 8) × (1 − 0,1 × adaptation), ramené sur 100. Transition : (0,5 × risque du secteur + 0,5 × facteurs + 0,5 ou 1 si CBAM) × 0,5 (vert) / 0,75 (transition) / 1. Score = 0,6 × dominant + 0,4 × l'autre, si au moins 75 % des données sont renseignées."),
    ("Émissions financées", "Méthode PCAF : émissions du projet × part attribuée (montant demandé / investissement total). Qualité de la donnée de 1 (vérifiée) à 5 (estimation sectorielle)."),
    ("Note ESG", "E = 70 % questions environnementales maîtrisées + 30 % (100 − score climat). S = questions sociales maîtrisées. G = 50 % système de gestion et conformité + 20 % pièces + 20 % engagement sur le plan + 10 % transparence climat. Note = 40 % E + 30 % S + 30 % G ; A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E en dessous. Exclu : non noté. Risque critique non maîtrisé : D au mieux. Moins de 60 % de réponses : provisoire."),
    ("Différences avec l'outil web", "L'Excel calcule la note à l'octroi. Le suivi (actions réalisées, visites, note actualisée), le circuit de validation, la traçabilité et l'assistant IA sont dans l'outil web."),
]
for k, (t, x) in enumerate(METHODE):
    rr = 4 + k
    cellule(MT, f"A{rr}", t, font=f_gras, align=HAUT)
    cellule(MT, f"B{rr}", x, align=HAUT)
    MT.row_dimensions[rr].height = 62

# ════════════════════════════ Accueil ═══════════════════════════════════
A = ws["Accueil"]
A.column_dimensions["A"].width, A.column_dimensions["B"].width, A.column_dimensions["C"].width, A.column_dimensions["D"].width, A.column_dimensions["E"].width = 3, 6, 40, 62, 26
img = XLImage(LOGO)
img.width, img.height = 168, 80
A.add_image(img, "B1")
A["C6"] = "ESG Climat 360 — Évaluation environnementale, sociale et climatique"
A["C6"].font = Font(name=POLICE, size=20, bold=True, color=ORANGE)
A["C7"] = "Outil Excel du chargé d'affaires : liste d'exclusion, catégorisation, questionnaire guidé, climat, plan d'actions, risque E&S et note ESG."
A["C7"].font = f_sous
A["C9"] = "Étapes"
A["C9"].font = f_section
ligne_entete(A, 10, ["", "Onglet", "Ce que vous faites", "Avancement"], c0=2)
ETAPES = [
    ("Identification", "Client, secteur, région, montants, effectif, financement.", '=IF(AND(ID_SECTEUR<>"",ID_REGION<>"",N(ID_DEMANDE)>0),"✓ Complet","À compléter")'),
    ("Exclusion", "16 critères Oui / Non.", f'=COUNTA(\'Exclusion\'!F6:F{EF})&" / {len(D["exclusion"])}"'),
    ("Catégorisation", "25 éléments Oui / Non → catégorie A, B, C ou FI.", '=IF(CAT="","À compléter","Catégorie "&CAT)'),
    ("Questionnaire", "Répondre aux questions applicables (consigne et exemple sur chaque ligne).", '=(Q_POSEES-Q_SANS_REP)&" / "&Q_POSEES&" réponses"'),
    ("Climat", "Aléas, sensibilité, transition, émissions.", '=TEXT(CLIM_COUV,"0%")&" des données"'),
    ("Pièces", "État de chaque pièce attendue.", '=IF(DOC_A_COMPLETER=0,"✓ Rien à compléter",DOC_A_COMPLETER&" pièce(s) obligatoire(s) à compléter")'),
    ("Plan d'actions", "Négocier les actions proposées avec le client.", '=PLAN_RETENUES&" retenue(s) / "&PLAN_PROPOSEES&" proposée(s)"'),
    ("Scores", "Risque E&S, climat et note ESG (calculés).", '="Note ESG : "&ESG_NOTE'),
    ("Fiche", "Synthèse à joindre au dossier de crédit.", '="Risque E&S : "&R_NIVEAU'),
]
for k, (ong, txt, f) in enumerate(ETAPES):
    rr = 11 + k
    cellule(A, f"B{rr}", k + 1, align=CENTRE, font=Font(name=POLICE, size=12, bold=True, color="FFFFFF"), fill_=fill(ORANGE))
    c = cellule(A, f"C{rr}", ong, font=f_lien)
    c.hyperlink = f"#{q(ong)}!A1"
    cellule(A, f"D{rr}", txt)
    calc(A, f"E{rr}", f, gras=True)
    A.row_dimensions[rr].height = 22
A["C21"] = "Légende"
A["C21"].font = f_section
cellule(A, "C22", "Cellule à saisir", fill_=FILL_SAISIE)
cellule(A, "D22", "Saisie libre ou liste déroulante (survolez la cellule pour l'aide).")
cellule(A, "C23", "Cellule calculée", fill_=FILL_CALC)
cellule(A, "D23", "Formule : ne pas modifier.")
cellule(A, "C24", "Risque", fill_=fill("F8CBAD"), font=Font(name=POLICE, size=10, bold=True, color="C00000"))
cellule(A, "D24", "Réponse qui signale un risque non maîtrisé : une action corrective est proposée.")
A["C26"] = "Résultat du dossier"
A["C26"].font = f_section
for k, (lib, f) in enumerate([("Évaluation E&S", "=DECLENCHEMENT"), ("Catégorie", '=IF(CAT="","—",CAT)'), ("Risque E&S résiduel", '=R_NIVEAU&IF(ISNUMBER(R_SCORE)," ("&TEXT(R_SCORE,"0")&"/100)","")'), ("Climat", '=CLIM_NIV&IF(ISNUMBER(CLIM_SCORE)," ("&TEXT(CLIM_SCORE,"0")&"/100)","")'), ("NOTE ESG", '=ESG_NOTE&IF(ISNUMBER(ESG_SCORE)," · "&TEXT(ESG_SCORE,"0")&"/100","")')]):
    cellule(A, f"C{27 + k}", lib, font=f_gras)
    calc(A, f"D{27 + k}", f, gras=True)
A.conditional_formatting.add("D31", FormulaRule(formula=['OR(LEFT(D31,1)="A",LEFT(D31,1)="B")'], fill=fill("E2EFDA"), font=Font(bold=True, color="375623")))
A.conditional_formatting.add("D31", FormulaRule(formula=['OR(LEFT(D31,1)="D",LEFT(D31,1)="E")'], fill=fill("F8CBAD"), font=Font(bold=True, color="C00000")))
A["C33"] = ("Exemple fictif pré-rempli : hôtel de 320 chambres à Taghazout (catégorie B). Effacez les cellules jaunes pour un nouveau dossier, ou utilisez la version vierge."
            if EXEMPLE else "Version vierge : commencez par l'onglet Identification.")
A["C33"].font = f_petit
A["C34"] = "Mêmes règles que l'outil web ESG Climat 360 (onglet Méthode). Méthodes indicatives, à valider par le Responsable RSE et la Fonction Risques."
A["C34"].font = f_petit

# Exemple : négociation du plan (retenue « Oui » sur les actions proposées, une écartée)
if EXEMPLE:
    pass

# Polices et impression
for w in wb.worksheets:
    w.sheet_view.zoomScale = 90
    w.page_setup.paperSize = 9
    w.page_setup.orientation = "portrait" if w.title in ("Fiche", "Identification", "Accueil") else "landscape"
    w.page_setup.fitToWidth, w.page_setup.fitToHeight = 1, 0
    w.sheet_properties.pageSetUpPr.fitToPage = True
    w.print_options.horizontalCentered = True
    w.oddFooter.left.text = "ESG Climat 360 — Banque Populaire · &A"
    w.oddFooter.right.text = "&P / &N"
wb.active = 0
wb.save(SORTIE)
print("ok", SORTIE)
