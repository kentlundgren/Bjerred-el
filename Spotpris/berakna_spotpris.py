# berakna_spotpris.py
# Räknar månadens spotpris på fyra sätt (M1, M2, M4a, M4b), kalibrerar förbrukningsmodellen mot fakturornas spotpris
# (M4b), gör leave-one-out och ett band av alternativa passningar, och räknar ut en uppskattad effektkurva.
# Enligt Spotpris/SPEC.md (utkast 1) och Spotpris/PRD.md (utkast 5).
#
# Körning (från mappen Spotpris/, i PowerShell):
#     python berakna_spotpris.py
# Läser data/kraftringen.json, oppettider.json, sokrum.json och spot_SE4_ÅÅÅÅ-MM.json (se hamta_spotpris.py).
# Skriver data/manadsnitt.json, data/m4b_resultat.json och data/effektkurva.json.
#
# Bara standardbiblioteket används. Inget slumpmoment finns: två körningar ger samma utdata (utom fältet "genererad").
# Alla priser är i öre/kWh utan moms. Inget värde avrundas före visning. Fel = modellens värde minus fakturans värde.
#
# UPPDATERING 2026-10-07: Första versionen (1.0).

import datetime
import itertools
import json
import math
import os
import re
import sys

from hamta_spotpris import DataFel, kontrollera_dygn, upplosning_min, KVARTSOVERGANG

SKRIPT_VERSION = "1.0"
DATAMAPP = "data"
KALLA = "elprisetjustnu.se (spotpris), Kraftringens fakturor och debiteringsunderlag, bjerredskallbadhus.se (öppettider)"
BASTU_STANGER_Q = 88          # 22:00 som kvartsindex (SPEC 3.3: modellen använder 22.00)
TOLERANS_LIKA = 1e-9          # skillnader under detta räknas som oavgjort (SPEC 6.2)
MARKNING_EFFEKT = "Uppskattning ur modell, inte en mätning"


# ----------------------------------------------------------------------------------------------------------------
# 1. Inläsning
# ----------------------------------------------------------------------------------------------------------------

def las_json(sokvag):
    with open(sokvag, encoding="utf-8") as f:
        return json.load(f)


def tid_till_q(hhmm):
    """'07:30' -> kvartsindex 30."""
    h, m = hhmm.split(":")
    return int(h) * 4 + int(m) // 15


def ladda_indata(datamapp=DATAMAPP):
    return {
        "kraftringen": las_json(os.path.join(datamapp, "kraftringen.json"))["manader"],
        "oppettider": las_json(os.path.join(datamapp, "oppettider.json")),
        "sokrum": las_json(os.path.join(datamapp, "sokrum.json")),
    }


def ladda_spot_manad(manad, datamapp=DATAMAPP):
    """Läser en månads spotfil, kontrollerar varje dygn (SPEC 11) och returnerar kvartsintervall.
    Ett timintervall ersätts av fyra kvartsintervall med samma pris (SPEC 3.1).
    Returvärde: lista av (datum:str, veckodag:int, q:int, ore:float)."""
    fil = os.path.join(datamapp, f"spot_SE4_{manad}.json")
    if not os.path.exists(fil):
        raise DataFel(f"Spotfil saknas för {manad}: {fil}")
    intervall = las_json(fil)["intervall"]
    per_dygn = {}
    for i in intervall:
        per_dygn.setdefault(i["start"][:10], []).append(i)
    ar, m = int(manad[:4]), int(manad[5:7])
    forvantade = []
    d = datetime.date(ar, m, 1)
    while d.month == m:
        forvantade.append(d)
        d += datetime.timedelta(days=1)
    saknas = [str(d) for d in forvantade if d.isoformat() not in per_dygn]
    if saknas:
        raise DataFel(f"{manad}: saknade dygn: {', '.join(saknas)}")
    ut = []
    for d in forvantade:
        rader = per_dygn[d.isoformat()]
        kontrollera_dygn(d, rader)
        u = upplosning_min(rader[0])
        for r in rader:
            ore = r["sek_per_kwh"] * 100.0
            h, mi = int(r["start"][11:13]), int(r["start"][14:16])
            for k in range(u // 15):                      # 1 kvart för 15 min, 4 kvartar för 60 min
                ut.append((r["start"][:10], d.weekday(), h * 4 + (mi // 15) + k, ore))
    return ut


class Manad:
    """En månads spotpriser, förberäknade summor per (veckodag, kvartsindex) och kända kWh."""

    def __init__(self, namn, intervall, kr):
        self.namn = namn
        self.S = [[0.0] * 96 for _ in range(7)]       # summa pris per (veckodag, q)
        self.C = [[0] * 96 for _ in range(7)]         # antal intervall per (veckodag, q)
        priser = []
        for datum, wd, q, ore in intervall:
            self.S[wd][q] += ore
            self.C[wd][q] += 1
            priser.append(ore)
        self.N = len(priser)
        self.T = self.N / 4.0                          # antal timmar (verkliga intervall, inte klockslag)
        self.priser = priser
        self.kr = kr
        self.kwh_huvud = float(kr["kwh_huvud"])
        self.kwh_bastu = float(kr["kwh_bastu"])
        self.kwh_varm = float(kr["kwh_varmvatten"])
        self.kwh_rest = self.kwh_huvud - self.kwh_bastu - self.kwh_varm
        self.spot_ore = float(kr["spot_ore"])
        self.allt_elpris_ore = float(kr["spot_ore"]) + float(kr["rorliga_ore"]) + float(kr["paslag_ore"])

    # --- enkla värden
    def m1(self):
        return sum(self.priser) / self.N

    def vikta(self, vikt):
        """Viktat medelpris med vikt[wd][q]; None om vikterna summerar till noll."""
        s = w = 0.0
        for wd in range(7):
            vs, cs, vw = self.S[wd], self.C[wd], vikt[wd]
            for q in range(96):
                if vw[q]:
                    s += vw[q] * vs[q]
                    w += vw[q] * cs[q]
        return (s / w, w) if w > 0 else (None, 0.0)

    def m2(self):
        v = [[1 if 24 <= q < 88 else 0 for q in range(96)] for _ in range(7)]
        return self.vikta(v)[0]

    def timprofil(self):
        """Medelpris per timme på dygnet (24 värden), medel över månadens intervall."""
        s = [0.0] * 24
        c = [0] * 24
        for wd in range(7):
            for q in range(96):
                s[q // 4] += self.S[wd][q]
                c[q // 4] += self.C[wd][q]
        return [s[h] / c[h] for h in range(24)]


def bygg_manader(datamapp, indata, manader=None):
    ut = {}
    for namn in (manader or sorted(indata["kraftringen"].keys())):
        ut[namn] = Manad(namn, ladda_spot_manad(namn, datamapp), indata["kraftringen"][namn])
    return ut


def kontrollera_mot_krore(indata, sokvag="../Eneas_Samkop_av_El/enea_jamforelse.js"):
    """SPEC 3.2: 'allt elpris' ska stämma med krOre i enea_jamforelse.js (skillnad under 0,005), annars avbryts körningen.
    Saknas JavaScript-filen (SPEC säger inget om det) ges en varning och kontrollen hoppas över."""
    if not os.path.exists(sokvag):
        print(f"VARNING: {sokvag} finns inte, kontrollen mot krOre hoppas över.")
        return
    text = open(sokvag, encoding="utf-8").read()
    for manad, kr in indata["kraftringen"].items():
        m = re.search(r"key:\s*'" + re.escape(manad) + r"'.*?krOre:\s*([0-9.]+)", text)
        if not m:
            raise DataFel(f"krOre för {manad} hittades inte i {sokvag}")
        allt = float(kr["spot_ore"]) + float(kr["rorliga_ore"]) + float(kr["paslag_ore"])
        if abs(allt - float(m.group(1))) >= 0.005:
            raise DataFel(f"{manad}: 'allt elpris' {allt:.4f} avviker från krOre {m.group(1)} med 0,005 eller mer")


# ----------------------------------------------------------------------------------------------------------------
# 2. Förbrukningsmodellen (SPEC avsnitt 5)
# ----------------------------------------------------------------------------------------------------------------

class Modell:
    """Öppettider som data och cache över vikter per parameterkombination."""

    def __init__(self, oppettider):
        self.rest = {}
        for wd, tider in oppettider["restaurang"].items():
            self.rest[int(wd)] = None if tider is None else (tid_till_q(tider[0]), tid_till_q(tider[1]))
        self._cache = {}

    def rest_oppen(self, wd, q, prep_q):
        t = self.rest.get(wd)
        return bool(t) and (t[0] - prep_q) <= q < t[1]

    def _vikter(self, nyckel, fkn):
        if nyckel not in self._cache:
            self._cache[nyckel] = [[fkn(wd, q) for q in range(96)] for wd in range(7)]
        return self._cache[nyckel]

    def v_bastu(self, bo_q, pre_q):
        return self._vikter(("bastu", bo_q, pre_q), lambda wd, q: 1 if bo_q - pre_q <= q < BASTU_STANGER_Q else 0)

    def v_drift(self, prep_q):
        return self._vikter(("drift", prep_q), lambda wd, q: 1 if self.rest_oppen(wd, q, prep_q) else 0)

    def v_tider(self, bo_q):
        return self._vikter(("tider", bo_q), lambda wd, q: (1 if bo_q <= q < BASTU_STANGER_Q else 0) + (1 if self.rest_oppen(wd, q, 0) else 0))

    def v_alla(self):
        return self._vikter(("alla",), lambda wd, q: 1)


def parametrar_kombinationer(rum, bo_alternativ):
    """Alla kombinationer ur ett sökrum, i fast ordning (SPEC 6.1). Returnerar en lista av dictar."""
    v = rum["V"]
    vs = list(range(v["fran"], v["till"] + 1, v["steg"]))
    ut = []
    for bo, pre, prep, varm, V in itertools.product(rum["bo"], rum["pre"], rum["prep"], rum["varm"], vs):
        ut.append({"bo": bo, "bo_q": tid_till_q(bo), "pre": float(pre), "pre_q": int(round(pre * 4)),
                   "prep": float(prep), "prep_q": int(round(prep * 4)), "varm": varm, "V": float(V),
                   "ordning": (bo_alternativ.index(bo), rum["prep"].index(prep), rum["varm"].index(varm))})
    return ut


def forbrukning(mn, modell, p):
    """Fördelar månadens kWh enligt SPEC avsnitt 5. Returnerar None om kombinationen är ogiltig (E_d < 0),
    annars en dict med energi och pris per del och vikter. Kastar DataFel om inga aktiva intervall finns."""
    E_v = p["V"] * mn.T
    E_d = mn.kwh_rest - E_v
    if E_d < 0:
        return None
    P_bastu, n_b = mn.vikta(modell.v_bastu(p["bo_q"], p["pre_q"]))
    P_drift, n_d = mn.vikta(modell.v_drift(p["prep_q"]))
    if P_bastu is None or P_drift is None:
        raise DataFel(f"{mn.namn}: inga aktiva intervall för bastu eller driftdel med {p}")
    if p["varm"] == "24h":
        P_varm, n_v = mn.vikta(modell.v_alla())
        vikt_varm = modell.v_alla()
    else:
        P_varm, n_v = mn.vikta(modell.v_tider(p["bo_q"]))
        vikt_varm = modell.v_tider(p["bo_q"])
    M1 = mn.m1()
    varde = (mn.kwh_bastu * P_bastu + mn.kwh_varm * P_varm + E_v * M1 + E_d * P_drift) / mn.kwh_huvud
    # kontroll av energibalansen (SPEC 5, punkt 4)
    if abs(mn.kwh_bastu + mn.kwh_varm + E_v + E_d - mn.kwh_huvud) > 0.001:
        raise DataFel(f"{mn.namn}: energibalansen stämmer inte")
    return {"varde": varde, "E_v": E_v, "E_d": E_d, "P_bastu": P_bastu, "P_varm": P_varm, "P_drift": P_drift,
            "n_bastu": n_b, "n_varm_vikt": n_v, "n_drift": n_d, "vikt_varm": vikt_varm}


# ----------------------------------------------------------------------------------------------------------------
# 3. Sökning, urval, leave-one-out och band (SPEC avsnitt 6)
# ----------------------------------------------------------------------------------------------------------------

def fel_per_manad(manader, modell, p):
    """Fel (modell minus faktura) per månad, eller None om kombinationen är ogiltig i någon månad.
    Andra returvärdet: dict månad -> orsak för ogiltiga månader."""
    fel = {}
    ogiltiga = []
    for namn, mn in manader.items():
        f = forbrukning(mn, modell, p)
        if f is None:
            ogiltiga.append(namn)
        else:
            fel[namn] = f["varde"] - mn.spot_ore
    return (None if ogiltiga else fel), ogiltiga


def rms(fel):
    v = list(fel.values())
    return math.sqrt(sum(x * x for x in v) / len(v))


def storsta_abs(fel):
    return max(abs(x) for x in fel.values())


def urvalsnyckel(p, r, mx, mal):
    """Sorteringsnyckel enligt SPEC 6.2. U1: lägst RMS, därefter lägst största absolutfel. U2: tvärtom.
    Därefter lägst V och därefter ordningen bo, prep, varm. Skillnader under 1e-9 räknas som lika."""
    a, b = (r, mx) if mal == "u1" else (mx, r)
    return (round(a / TOLERANS_LIKA), round(b / TOLERANS_LIKA), p["V"]) + p["ordning"]


def sok(manader, modell, kombinationer):
    """Utvärderar alla kombinationer på de angivna månaderna. Returnerar lista av dictar för giltiga kombinationer
    samt statistik över ogiltiga."""
    giltiga, ogiltiga_per_manad, antal_ogiltiga = [], {}, 0
    for p in kombinationer:
        fel, ogilt = fel_per_manad(manader, modell, p)
        if fel is None:
            antal_ogiltiga += 1
            for m in ogilt:
                ogiltiga_per_manad[m] = ogiltiga_per_manad.get(m, 0) + 1
            continue
        giltiga.append({"p": p, "fel": fel, "rms": rms(fel), "storsta": storsta_abs(fel)})
    return giltiga, antal_ogiltiga, ogiltiga_per_manad


def valj(giltiga, mal):
    if not giltiga:
        return None
    return min(giltiga, key=lambda g: urvalsnyckel(g["p"], g["rms"], g["storsta"], mal))


def parametrar_ut(p):
    return {"bo": p["bo"], "pre_timmar": p["pre"], "prep_timmar": p["prep"], "varm": p["varm"], "V_kw": p["V"]}


def urval_ut(g):
    return {"parametrar": parametrar_ut(g["p"]), "rms": g["rms"], "fel_per_manad": g["fel"], "storsta_absolutfel": g["storsta"]}


def leave_one_out(manader, modell, kombinationer):
    """SPEC 6.3: välj U1 på övriga månader, förutsäg den utelämnade. Ogiltig för den utelämnade -> 'saknas'
    (någon annan kombination väljs inte)."""
    namn_lista = list(manader.keys())
    fel, saknas = {}, {}
    for k in namn_lista:
        tr = {n: manader[n] for n in namn_lista if n != k}
        giltiga, _, _ = sok(tr, modell, kombinationer)
        b = valj(giltiga, "u1")
        if b is None:
            saknas[k] = "ingen giltig kombination på de övriga månaderna"
            continue
        f = forbrukning(manader[k], modell, b["p"])
        if f is None:
            saknas[k] = f"vald kombination ogiltig för {k}: E_d < 0 (V {b['p']['V']} kW)"
            continue
        fel[k] = f["varde"] - manader[k].spot_ore
    ut = {"fel_per_manad": {k: (fel[k] if k in fel else "saknas") for k in namn_lista}, "saknas_orsak": saknas,
          "antal_saknas": len(saknas)}
    if fel:
        ut["rms"] = rms(fel)
        ut["storsta_absolutfel"] = storsta_abs(fel)
    else:
        ut["rms"] = None
        ut["storsta_absolutfel"] = None
    return ut


def utvardera_kriterier(passning_utfall, loo_utfall, passning_grans, loo_grans):
    """SPEC 6.4: redovisar kriterierna som uppfyllt/ej uppfyllt med de faktiska talen. Ändrar aldrig gränserna."""
    return {
        "passning": {"grans": passning_grans, "utfall": passning_utfall, "uppfyllt": passning_utfall <= passning_grans},
        "leave_one_out": {"grans": loo_grans, "utfall": loo_utfall, "uppfyllt": loo_utfall is not None and loo_utfall <= loo_grans},
    }


def kor_sokrum(manader, modell, rum, indata, bo_alternativ, med_kriterier=False):
    """En körning (primär eller känslighet): sökning, U1, U2, band, leave-one-out och eventuellt kriterier."""
    komb = parametrar_kombinationer(rum, bo_alternativ)
    giltiga, antal_ogilt, ogilt_manad = sok(manader, modell, komb)
    u1, u2 = valj(giltiga, "u1"), valj(giltiga, "u2")
    band = [g for g in giltiga if g["rms"] <= indata["sokrum"]["band_rms_max"]]
    ut = {
        "sokrum": rum,
        "antal_kombinationer": len(komb), "antal_giltiga": len(giltiga), "antal_ogiltiga": antal_ogilt,
        "ogiltiga_per_manad": ogilt_manad,
        "u1": urval_ut(u1), "u2": urval_ut(u2),
        "antal_i_band": len(band),
        "antal_med_storsta_fel_max_2": sum(1 for g in giltiga if g["storsta"] <= indata["sokrum"]["ratt_info_storsta_fel_max"]),
        "leave_one_out": leave_one_out(manader, modell, komb),
    }
    if med_kriterier:
        k = indata["sokrum"]["kriterier"]
        ut["kriterier"] = utvardera_kriterier(u1["storsta"], ut["leave_one_out"]["storsta_absolutfel"],
                                              k["passning_storsta_absolutfel_max"], k["leave_one_out_storsta_absolutfel_max"])
    return ut, giltiga, u1, band


# ----------------------------------------------------------------------------------------------------------------
# 4. Effektkurva (SPEC avsnitt 8)
# ----------------------------------------------------------------------------------------------------------------

def effektkurva_kombination(mn, modell, p):
    """Medeleffekt per timme på dygnet (24 värden) per del, för en kombination. None om ogiltig."""
    f = forbrukning(mn, modell, p)
    if f is None:
        return None
    delar = {"bastu": [0.0] * 24, "varmvatten": [0.0] * 24, "baslast": [0.0] * 24, "drift": [0.0] * 24}
    antal = [0] * 24
    vb, vd, vv = modell.v_bastu(p["bo_q"], p["pre_q"]), modell.v_drift(p["prep_q"]), f["vikt_varm"]
    sum_vikt_varm = sum(vv[wd][q] * mn.C[wd][q] for wd in range(7) for q in range(96))
    for wd in range(7):
        for q in range(96):
            c = mn.C[wd][q]
            if not c:
                continue
            h = q // 4
            antal[h] += c
            # effekt i intervallet = energi i intervallet / 0,25 timme
            delar["bastu"][h] += c * (mn.kwh_bastu / (f["n_bastu"] * 0.25) if vb[wd][q] else 0.0)
            delar["varmvatten"][h] += c * (mn.kwh_varm * vv[wd][q] / (sum_vikt_varm * 0.25))
            delar["baslast"][h] += c * p["V"]
            delar["drift"][h] += c * (f["E_d"] / (f["n_drift"] * 0.25) if vd[wd][q] else 0.0)
    for k in delar:
        delar[k] = [delar[k][h] / antal[h] for h in range(24)]
    summa = [sum(delar[k][h] for k in delar) for h in range(24)]
    return {"delar": delar, "summa": summa, "antal_per_timme": antal}


def effektkurva_manad(mn, modell, u1, band):
    c = effektkurva_kombination(mn, modell, u1["p"])
    lagsta, hogsta = [1e18] * 24, [-1e18] * 24
    for g in band:
        e = effektkurva_kombination(mn, modell, g["p"])
        if e is None:
            continue
        for h in range(24):
            lagsta[h] = min(lagsta[h], e["summa"][h])
            hogsta[h] = max(hogsta[h], e["summa"][h])
    medel = sum(c["summa"][h] * c["antal_per_timme"][h] for h in range(24)) / mn.N
    return {"delar": c["delar"], "summa": c["summa"], "lagsta": lagsta, "hogsta": hogsta,
            "medeleffekt_kw": medel, "kwh_huvud_delat_pa_timmar_kw": mn.kwh_huvud / mn.T, "markning": MARKNING_EFFEKT}


# ----------------------------------------------------------------------------------------------------------------
# 5. Hela körningen och utdata
# ----------------------------------------------------------------------------------------------------------------

def metadata():
    return {"genererad": datetime.date.today().isoformat(), "skript_version": SKRIPT_VERSION, "kalla": KALLA}


def kor_allt(datamapp=DATAMAPP, kontrollera_krore=True):
    """Hela beräkningen. Returnerar en dict med tre utdata-delar (manadsnitt, m4b_resultat, effektkurva)."""
    indata = ladda_indata(datamapp)
    if kontrollera_krore:
        kontrollera_mot_krore(indata)
    manader = bygg_manader(datamapp, indata)
    modell = Modell(indata["oppettider"])
    bo_alt = indata["oppettider"]["bastu"]["oppnar_alternativ"]

    primar, giltiga_p, u1_p, band_p = kor_sokrum(manader, modell, indata["sokrum"]["primar"], indata, bo_alt, med_kriterier=True)
    kanslighet, giltiga_k, u1_k, band_k = kor_sokrum(manader, modell, indata["sokrum"]["kanslighet"], indata, bo_alt)

    # M4a med standardparametrar (antagande utan kalibrering) och M4b = U1 i den primära körningen
    s = indata["sokrum"]["m4a_standard"]
    p4a = {"bo": s["bo"], "bo_q": tid_till_q(s["bo"]), "pre": float(s["pre"]), "pre_q": int(round(s["pre"] * 4)),
           "prep": float(s["prep"]), "prep_q": int(round(s["prep"] * 4)), "varm": s["varm"], "V": float(s["V"]), "ordning": (0, 0, 0)}

    manadsnitt = {"metadata": metadata(), "manader": {}}
    for namn, mn in manader.items():
        f4a, f4b = forbrukning(mn, modell, p4a), forbrukning(mn, modell, u1_p["p"])
        m1, m2 = mn.m1(), mn.m2()
        manadsnitt["manader"][namn] = {
            "m1_ore": m1, "m2_ore": m2,
            "antal_intervall": mn.N, "antal_negativa": sum(1 for x in mn.priser if x < 0),
            "lagsta_ore": min(mn.priser), "hogsta_ore": max(mn.priser), "timprofil_ore": mn.timprofil(),
            "faktura": {"spot_ore": mn.spot_ore, "rorliga_ore": float(mn.kr["rorliga_ore"]), "paslag_ore": float(mn.kr["paslag_ore"]),
                        "allt_elpris_ore": mn.allt_elpris_ore},
            "skillnader_ore": {"allt_elpris_minus_m1": mn.allt_elpris_ore - m1, "spot_minus_m1": mn.spot_ore - m1,
                               "allt_elpris_minus_spot": mn.allt_elpris_ore - mn.spot_ore},
            "m4a": {"parametrar": parametrar_ut(p4a), "varde_ore": f4a["varde"] if f4a else None,
                    "fel_ore": (f4a["varde"] - mn.spot_ore) if f4a else None},
            "m4b": {"parametrar": parametrar_ut(u1_p["p"]), "varde_ore": f4b["varde"], "fel_ore": f4b["varde"] - mn.spot_ore},
        }
    m4b = {"metadata": metadata(), "primar": primar, "kanslighet": kanslighet,
           "teckenkonvention": "fel = modellens värde minus fakturans spot_ore (öre/kWh); plus betyder att modellen räknar för högt"}
    effekt = {"metadata": metadata(), "markning": MARKNING_EFFEKT,
              "primar": {"manader": {n: effektkurva_manad(mn, modell, u1_p, band_p) for n, mn in manader.items()}},
              "kanslighet": {"manader": {n: effektkurva_manad(mn, modell, u1_k, band_k) for n, mn in manader.items()}}}
    return {"manadsnitt": manadsnitt, "m4b_resultat": m4b, "effektkurva": effekt, "manader": manader, "modell": modell,
            "giltiga_primar": giltiga_p}


def skriv(utdata, datamapp=DATAMAPP):
    for namn in ("manadsnitt", "m4b_resultat", "effektkurva"):
        with open(os.path.join(datamapp, namn + ".json"), "w", encoding="utf-8") as f:
            json.dump(utdata[namn], f, ensure_ascii=False, indent=2)


def sammanfatta(utdata):
    mn, m4 = utdata["manadsnitt"]["manader"], utdata["m4b_resultat"]
    print("Månad    M1      M2      Faktura   M4a-fel  M4b-fel")
    for namn, v in mn.items():
        print(f"{namn}  {v['m1_ore']:7.2f} {v['m2_ore']:7.2f} {v['faktura']['spot_ore']:8.2f}  {v['m4a']['fel_ore']:+7.2f}  {v['m4b']['fel_ore']:+7.2f}")
    for nyckel, rubrik in (("primar", "PRIMÄR (bastun på 1 h före öppning)"), ("kanslighet", "KÄNSLIGHET (pre 0–6 h)")):
        r = m4[nyckel]
        u1 = r["u1"]
        print(f"\n{rubrik}: {r['antal_giltiga']} giltiga av {r['antal_kombinationer']}, i band {r['antal_i_band']}, "
              f"med största fel <= 2: {r['antal_med_storsta_fel_max_2']}")
        print(f"  U1: RMS {u1['rms']:.2f}, {u1['parametrar']}")
        print("  fel:", " ".join(f"{x:+.2f}" for x in u1["fel_per_manad"].values()), f"| största {u1['storsta_absolutfel']:.2f}")
        l = r["leave_one_out"]
        print("  leave-one-out:", " ".join(x if isinstance(x, str) else f"{x:+.2f}" for x in l["fel_per_manad"].values()),
              f"| största {l['storsta_absolutfel'] if l['storsta_absolutfel'] is None else round(l['storsta_absolutfel'], 2)}")
        if "kriterier" in r:
            k = r["kriterier"]
            print(f"  KRITERIER: passning {k['passning']['utfall']:.2f} <= {k['passning']['grans']}: "
                  f"{'uppfyllt' if k['passning']['uppfyllt'] else 'ej uppfyllt'};  leave-one-out {k['leave_one_out']['utfall']:.2f} <= {k['leave_one_out']['grans']}: "
                  f"{'uppfyllt' if k['leave_one_out']['uppfyllt'] else 'ej uppfyllt'}")


def main():
    utdata = kor_allt()
    skriv(utdata)
    sammanfatta(utdata)
    print("\nSkrev data/manadsnitt.json, data/m4b_resultat.json och data/effektkurva.json")


def m3(manad, forbrukning_kwh_per_intervall):
    """Gränssnitt för M3 (SPEC avsnitt 9). Inte byggt i första versionen."""
    raise NotImplementedError("M3 kräver förbrukning per kvart")


if __name__ == "__main__":
    try:
        main()
    except DataFel as e:
        print("AVBRUTET:", e)
        sys.exit(1)
