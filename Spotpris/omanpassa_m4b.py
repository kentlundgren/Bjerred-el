# omanpassa_m4b.py
# Omanpassning av M4b på januari–september 2026 ("M4b ver. 2"), med samma modell, samma sökrum och samma urvalsregel som
# ver. 1 (som anpassades på januari–juni). Det enda som ändras är vilka månader som ingår i anpassningen.
#
# Skriptet återanvänder berakna_spotpris.py oförändrat och SKRIVER BARA NYA FILER:
#     data/omanpassning_resultat.json   (hela resultatet)
#     data/omanpassning_data.js         (samma sak som skriptfil, för omanpassning.html: fungerar från file://)
# De frusna filerna (kraftringen.json, m4b_resultat.json, forutsagelse_*.json, spotpris_data.js) rörs inte, så att
# blindprovet för juli–september ligger kvar orört på Spotpris-sidan.
#
# Kriterierna står i data/omanpassning_kriterier.json och skrevs före första körningen. Skriptet utvärderar dem och
# ändrar aldrig gränserna eller urvalet för att nå dem.
#
# Körning (från mappen Spotpris/, i PowerShell):   python omanpassa_m4b.py
# Bara standardbiblioteket. Inget slumpmoment: två körningar ger samma utdata (utom fältet "genererad").
# Fel = modellens värde minus fakturans spotpris, öre/kWh, utan moms (som i resten av projektet).
#
# UPPDATERING 2026-10-08: Första versionen (1.0).

import datetime
import json
import math
import os
import sys

import berakna_spotpris as b

SKRIPT_VERSION = "1.0"
DATAMAPP = "data"
FORSTA_FACITMANAD = "2026-07"      # månader från och med denna kommer ur omanpassning_indata.json + facit_jul_sep.json


def las(namn):
    return b.las_json(os.path.join(DATAMAPP, namn))


# ----------------------------------------------------------------------------------------------------------------
# 1. Indata: nio månader
# ----------------------------------------------------------------------------------------------------------------

def bygg_indata():
    """Jan–Jun ur kraftringen.json (oförändrad). Jul–Sep: kWh ur omanpassning_indata.json, pris ur facit_jul_sep.json."""
    kr = dict(las("kraftringen.json")["manader"])
    ny = las("omanpassning_indata.json")["manader"]
    facit = las("facit_jul_sep.json")["manader"]
    for m in sorted(ny):
        kr[m] = {"kwh_huvud": ny[m]["kwh_huvud"], "kwh_bastu": ny[m]["kwh_bastu"], "kwh_varmvatten": ny[m]["kwh_varmvatten"],
                 "spot_ore": facit[m]["spot_ore"], "rorliga_ore": facit[m]["rorliga_ore"], "paslag_ore": facit[m]["paslag_ore"]}
    return kr


def bygg_manader(kr):
    return {m: b.Manad(m, b.ladda_spot_manad(m), kr[m]) for m in sorted(kr)}


def delmangd(manader, namn):
    return {n: manader[n] for n in namn}


def p_av(par, ordning=(0, 0, 0)):
    """Parameterdict i det format som forbrukning() vill ha, ur ett urval i resultatfilerna (som forutsag_spotpris.p_av)."""
    return {"bo": par["bo"], "bo_q": b.tid_till_q(par["bo"]), "pre": float(par["pre_timmar"]), "pre_q": int(round(par["pre_timmar"] * 4)),
            "prep": float(par["prep_timmar"]), "prep_q": int(round(par["prep_timmar"] * 4)), "varm": par["varm"],
            "V": float(par["V_kw"]), "ordning": ordning}


# ----------------------------------------------------------------------------------------------------------------
# 2. Hjälpfunktioner för utvärdering
# ----------------------------------------------------------------------------------------------------------------

def fel_for(manader, modell, p):
    """Fel per månad för en kombination, eller None för en månad där kombinationen är ogiltig (E_d < 0)."""
    ut = {}
    for n, mn in manader.items():
        f = b.forbrukning(mn, modell, p)
        ut[n] = None if f is None else f["varde"] - mn.spot_ore
    return ut


def rms_av(v):
    v = [x for x in v if x is not None]
    return math.sqrt(sum(x * x for x in v) / len(v)) if v else None


def max_abs(v):
    v = [abs(x) for x in v if x is not None]
    return max(v) if v else None


def anpassa(tran, modell, komb):
    """U1 på träningsmånaderna. Returnerar (valt, giltiga) eller (None, [])."""
    giltiga, _, _ = b.sok(tran, modell, komb)
    return b.valj(giltiga, "u1"), giltiga


def leave_one_out_med_param(manader, modell, komb):
    """Som berakna_spotpris.leave_one_out, men sparar också vilken kombination som valdes när månaden utelämnades."""
    namn = list(manader.keys())
    ut = {}
    for k in namn:
        tran = {n: manader[n] for n in namn if n != k}
        val, _ = anpassa(tran, modell, komb)
        if val is None:
            ut[k] = {"fel_ore": None, "saknas": "ingen giltig kombination på de övriga månaderna", "parametrar": None}
            continue
        f = b.forbrukning(manader[k], modell, val["p"])
        if f is None:
            ut[k] = {"fel_ore": None, "saknas": f"vald kombination ogiltig för {k}", "parametrar": b.parametrar_ut(val["p"])}
            continue
        ut[k] = {"fel_ore": f["varde"] - manader[k].spot_ore, "saknas": None, "parametrar": b.parametrar_ut(val["p"])}
    return ut


def framatprov(manader, modell, komb, forsta_test=FORSTA_FACITMANAD):
    """Expanderande fönster: anpassa på alla månader före k, förutsäg k, för varje k från och med forsta_test."""
    namn = list(manader.keys())
    ut = {}
    for k in namn[namn.index(forsta_test):]:
        tran = {n: manader[n] for n in namn[:namn.index(k)]}
        val, _ = anpassa(tran, modell, komb)
        f = b.forbrukning(manader[k], modell, val["p"]) if val else None
        ut[k] = {"tranad_pa": f"{namn[0]} till {namn[namn.index(k) - 1]}", "antal_tranings_manader": len(tran),
                 "parametrar": b.parametrar_ut(val["p"]) if val else None,
                 "rms_pa_traningen": val["rms"] if val else None,
                 "forutsagt_ore": f["varde"] if f else None, "faktura_ore": manader[k].spot_ore,
                 "fel_ore": (f["varde"] - manader[k].spot_ore) if f else None}
    return ut


def bast_v_per_manad(manader, modell, p):
    """För varje månad: vilken jämn baslast V (0–25 kW, steg 0,1) hade gett minst fel om alla andra antaganden hålls som i p?"""
    ut = {}
    for n, mn in manader.items():
        bast = None
        for i in range(0, 251):
            f = b.forbrukning(mn, modell, dict(p, V=i / 10.0))
            if f is None:
                continue
            fel = f["varde"] - mn.spot_ore
            if bast is None or abs(fel) < abs(bast[1]):
                bast = (i / 10.0, fel)
        ut[n] = {"V_bast_kw": bast[0], "kvarstaende_fel_ore": bast[1], "rest_kwh_per_timme": mn.kwh_rest / mn.T}
    return ut


def rms_mot_v(manader, modell, komb, namn_lista):
    """För varje V (heltal 0–20): lägsta RMS över alla andra parametrar, på de angivna månaderna. Ogiltiga kombinationer (i någon
    av månaderna) hoppas över. Visar hur tydligt V bestäms av data (diagrammet 'RMS mot baslast')."""
    tran = {n: manader[n] for n in namn_lista}
    per_v = {}
    for p in komb:
        fel, _ = b.fel_per_manad(tran, modell, p)
        if fel is None:
            continue
        r = b.rms(fel)
        v = int(p["V"])
        if v not in per_v or r < per_v[v]:
            per_v[v] = r
    return [{"V_kw": v, "rms_ore": per_v.get(v)} for v in range(0, 21)]


# ----------------------------------------------------------------------------------------------------------------
# 3. Hela körningen
# ----------------------------------------------------------------------------------------------------------------

def kor():
    kriterier = las("omanpassning_kriterier.json")
    sokrum = las("sokrum.json")
    oppettider = las("oppettider.json")
    kr = bygg_indata()
    manader = bygg_manader(kr)
    namn = list(manader.keys())
    jan_jun = [n for n in namn if n < FORSTA_FACITMANAD]
    modell = b.Modell(oppettider)
    bo_alt = oppettider["bastu"]["oppnar_alternativ"]
    komb = b.parametrar_kombinationer(sokrum["primar"], bo_alt)
    komb_kansl = b.parametrar_kombinationer(sokrum["kanslighet"], bo_alt)

    # --- Kontroll 1: att skriptet reproducerar ver. 1 när det körs på januari–juni (tester T5 i SPEC)
    ver1_ur_fil = las("m4b_resultat.json")["primar"]["u1"]
    v1_omkord, giltiga_jj = anpassa(delmangd(manader, jan_jun), modell, komb)
    p1 = p_av(ver1_ur_fil["parametrar"])
    if b.parametrar_ut(v1_omkord["p"]) != ver1_ur_fil["parametrar"] or abs(v1_omkord["rms"] - ver1_ur_fil["rms"]) > 1e-9:
        raise b.DataFel("Kontrollen misslyckades: anpassningen på januari–juni ger inte ver. 1 (m4b_resultat.json).")

    # --- Ver. 2: U1, U2, band på alla nio månader
    giltiga, antal_ogiltiga, ogiltiga_per_manad = b.sok(manader, modell, komb)
    u1, u2 = b.valj(giltiga, "u1"), b.valj(giltiga, "u2")
    band = [g for g in giltiga if g["rms"] <= sokrum["band_rms_max"]]
    topp5 = sorted(giltiga, key=lambda g: b.urvalsnyckel(g["p"], g["rms"], g["storsta"], "u1"))[:5]
    p2 = u1["p"]

    # --- Leave-one-out och framåtprov
    loo = leave_one_out_med_param(manader, modell, komb)
    loo_fel = [v["fel_ore"] for v in loo.values()]
    fram = framatprov(manader, modell, komb)
    fram_fel = [v["fel_ore"] for v in fram.values()]

    # --- Kriterierna (utvärderas, ändras inte)
    k = kriterier["kriterier"]
    k1_utfall, k2_utfall = u1["storsta"], max_abs(loo_fel)
    k3_max, k3_rms = max_abs(fram_fel), rms_av(fram_fel)
    utvardering = {
        "K1_passning": {"grans": k["K1_passning"]["grans_ore"], "utfall": k1_utfall, "uppfyllt": k1_utfall <= k["K1_passning"]["grans_ore"]},
        # Månader där den valda kombinationen är ogiltig (E_d < 0) räknas inte in i största felet utan redovisas som 'saknas' (SPEC 6.3).
        "K2_leave_one_out": {"grans": k["K2_leave_one_out"]["grans_ore"], "utfall": k2_utfall,
                             "uppfyllt": k2_utfall is not None and k2_utfall <= k["K2_leave_one_out"]["grans_ore"],
                             "antal_saknas": sum(1 for v in loo.values() if v["fel_ore"] is None),
                             "saknas_manader": [n for n, v in loo.items() if v["fel_ore"] is None]},
        "K3_framatprov": {"grans_max": k["K3_framatprov"]["grans_max_ore"], "grans_rms": k["K3_framatprov"]["grans_rms_ore"],
                          "utfall_max": k3_max, "utfall_rms": k3_rms,
                          "uppfyllt_max": k3_max <= k["K3_framatprov"]["grans_max_ore"],
                          "uppfyllt_rms": k3_rms < k["K3_framatprov"]["grans_rms_ore"],
                          "uppfyllt": k3_max <= k["K3_framatprov"]["grans_max_ore"] and k3_rms < k["K3_framatprov"]["grans_rms_ore"]},
    }
    utvardering["alla_uppfyllda"] = all(utvardering[x]["uppfyllt"] for x in ("K1_passning", "K2_leave_one_out", "K3_framatprov"))

    # --- Ver. 1 (frusna parametrar) mot ver. 2 på alla nio månader, och M1, M2, M4a för sammanhang
    s = sokrum["m4a_standard"]
    p4a = {"bo": s["bo"], "bo_q": b.tid_till_q(s["bo"]), "pre": float(s["pre"]), "pre_q": int(round(s["pre"] * 4)),
           "prep": float(s["prep"]), "prep_q": int(round(s["prep"] * 4)), "varm": s["varm"], "V": float(s["V"]), "ordning": (0, 0, 0)}
    per_manad = {}
    for n, mn in manader.items():
        f1, f2, fa = b.forbrukning(mn, modell, p1), b.forbrukning(mn, modell, p2), b.forbrukning(mn, modell, p4a)
        per_manad[n] = {
            "faktura_ore": mn.spot_ore, "m1_ore": mn.m1(), "m2_ore": mn.m2(),
            "m4a_ore": fa["varde"] if fa else None,
            "ver1_ore": f1["varde"] if f1 else None, "ver2_ore": f2["varde"] if f2 else None,
            "fel_m1": mn.m1() - mn.spot_ore, "fel_m2": mn.m2() - mn.spot_ore,
            "fel_m4a": (fa["varde"] - mn.spot_ore) if fa else None,
            "fel_ver1": (f1["varde"] - mn.spot_ore) if f1 else None, "fel_ver2": (f2["varde"] - mn.spot_ore) if f2 else None,
            "i_anpassningen_ver1": n < FORSTA_FACITMANAD, "i_anpassningen_ver2": True,
            "kwh": {"huvud": mn.kwh_huvud, "bastu": mn.kwh_bastu, "varmvatten": mn.kwh_varm, "rest": mn.kwh_rest},
        }
    sammanfattning = {}
    for etikett, nycklar in (("jan_jun", jan_jun), ("jul_sep", [n for n in namn if n >= FORSTA_FACITMANAD]), ("jan_sep", namn)):
        sammanfattning[etikett] = {}
        for fk in ("fel_m1", "fel_m2", "fel_m4a", "fel_ver1", "fel_ver2"):
            v = [per_manad[n][fk] for n in nycklar]
            sammanfattning[etikett][fk] = {"rms": rms_av(v), "storsta": max_abs(v)}

    # --- Känslighetskörning (pre 0–6 timmar) på nio månader, redovisas bredvid
    giltiga_k, antal_ogilt_k, _ = b.sok(manader, modell, komb_kansl)
    u1_k = b.valj(giltiga_k, "u1")

    ver1_param_ut = b.parametrar_ut(p1)
    ver2_param_ut = b.parametrar_ut(p2)
    resultat = {
        "metadata": {"genererad": datetime.date.today().isoformat(), "skript_version": SKRIPT_VERSION,
                     "text": "Omanpassning av M4b på januari–september 2026 (ver. 2). Ver. 1 (januari–juni) är oförändrad och redovisas bredvid.",
                     "teckenkonvention": "fel = modellens värde minus fakturans spot_ore (öre/kWh); plus betyder att modellen räknar för högt"},
        "manader": namn, "anpassningsmanader_ver1": jan_jun,
        "ver1": {"parametrar": ver1_param_ut, "rms_pa_jan_jun": ver1_ur_fil["rms"]},
        "ver2": {"parametrar": ver2_param_ut, "rms": u1["rms"], "storsta_absolutfel": u1["storsta"], "fel_per_manad": u1["fel"]},
        "samma_kombination": ver1_param_ut == ver2_param_ut,
        "u2": b.urval_ut(u2),
        "antal_kombinationer": len(komb), "antal_giltiga": len(giltiga), "antal_ogiltiga": antal_ogiltiga,
        "ogiltiga_per_manad": ogiltiga_per_manad,
        "antal_i_band": len(band), "antal_med_storsta_fel_max_2": sum(1 for g in giltiga if g["storsta"] <= sokrum["ratt_info_storsta_fel_max"]),
        "topp5": [{"parametrar": b.parametrar_ut(g["p"]), "rms": g["rms"], "storsta": g["storsta"]} for g in topp5],
        "leave_one_out": loo, "framatprov": fram,
        "kriterier": utvardering, "kriterier_text": kriterier["kriterier"], "beslutsregel": kriterier["beslutsregel"],
        "per_manad": per_manad, "sammanfattning": sammanfattning,
        "bast_v_ver1": bast_v_per_manad(manader, modell, p1), "bast_v_ver2": bast_v_per_manad(manader, modell, p2),
        "rms_mot_v": {"jan_jun": rms_mot_v(manader, modell, komb, jan_jun), "jan_sep": rms_mot_v(manader, modell, komb, namn)},
        "kanslighet": {"antal_giltiga": len(giltiga_k), "u1": b.urval_ut(u1_k), "antal_i_band": sum(1 for g in giltiga_k if g["rms"] <= sokrum["band_rms_max"]),
                       "text": "Bastun slås på 0–6 timmar före öppning. Redovisas bredvid och räknas inte mot kriterierna."},
        "frusen_ver2": {"datum": datetime.date.today().isoformat(), "parametrar": ver2_param_ut,
                        "text": "Parametrarna för M4b ver. 2 frusna. Oktober 2026 ska förutsägas med både ver. 1 och ver. 2 innan fakturan läses."},
    }
    return resultat


def sammanfatta(r):
    print("Månad     M1     M2    faktura  fel M1   fel M2   fel ver1  fel ver2")
    for n, v in r["per_manad"].items():
        print(f"{n}  {v['m1_ore']:6.2f} {v['m2_ore']:6.2f}  {v['faktura_ore']:7.2f}  {v['fel_m1']:+6.2f}  {v['fel_m2']:+6.2f}  {v['fel_ver1']:+8.2f}  {v['fel_ver2']:+8.2f}")
    print("\nVer. 1:", r["ver1"]["parametrar"])
    print("Ver. 2:", r["ver2"]["parametrar"], f"RMS {r['ver2']['rms']:.2f}, största {r['ver2']['storsta_absolutfel']:.2f}", "(SAMMA som ver. 1)" if r["samma_kombination"] else "(ANNAN än ver. 1)")
    print(f"Giltiga {r['antal_giltiga']} av {r['antal_kombinationer']}, i band {r['antal_i_band']}, med största fel <= 2: {r['antal_med_storsta_fel_max_2']}")
    for e in ("jan_jun", "jul_sep", "jan_sep"):
        s = r["sammanfattning"][e]
        print(f"  RMS {e}: ver1 {s['fel_ver1']['rms']:.2f}  ver2 {s['fel_ver2']['rms']:.2f}  M2 {s['fel_m2']['rms']:.2f}  M1 {s['fel_m1']['rms']:.2f}")
    print("\nLeave-one-out (fel, eller 'saknas' om vald kombination är ogiltig för månaden):")
    for n, v in r["leave_one_out"].items():
        fel = "saknas (" + v["saknas"] + ")" if v["fel_ore"] is None else f"{v['fel_ore']:+.2f}"
        print(f"   utan {n}: {fel}   {v['parametrar']}")
    print("Framåtprov:")
    for n, v in r["framatprov"].items():
        if v["fel_ore"] is None:
            print(f"   {n} (anpassad på {v['tranad_pa']}): {v['parametrar']} saknas")
        else:
            print(f"   {n} (anpassad på {v['tranad_pa']}): {v['parametrar']} förutsagt {v['forutsagt_ore']:.2f}, faktura {v['faktura_ore']:.2f}, fel {v['fel_ore']:+.2f}")
    k = r["kriterier"]
    print(f"\nK1 passning       {k['K1_passning']['utfall']:.2f} <= {k['K1_passning']['grans']}: {'uppfyllt' if k['K1_passning']['uppfyllt'] else 'EJ uppfyllt'}")
    print(f"K2 leave-one-out  {k['K2_leave_one_out']['utfall']:.2f} <= {k['K2_leave_one_out']['grans']}: {'uppfyllt' if k['K2_leave_one_out']['uppfyllt'] else 'EJ uppfyllt'}  (månader som saknas: {k['K2_leave_one_out']['saknas_manader']})")
    k3 = k["K3_framatprov"]
    print(f"K3 framåtprov     största {k3['utfall_max']:.2f} <= {k3['grans_max']}: {'uppfyllt' if k3['uppfyllt_max'] else 'EJ uppfyllt'};  RMS {k3['utfall_rms']:.2f} < {k3['grans_rms']}: {'uppfyllt' if k3['uppfyllt_rms'] else 'EJ uppfyllt'}")
    print("Alla kriterier uppfyllda:", k["alla_uppfyllda"])
    ku = r["kanslighet"]["u1"]
    print("\nKänslighet (pre 0–6 h), nio månader:", ku["parametrar"], f"RMS {ku['rms']:.2f}")


def skriv(r):
    with open(os.path.join(DATAMAPP, "omanpassning_resultat.json"), "w", encoding="utf-8") as f:
        json.dump(r, f, ensure_ascii=False, indent=2)
    with open(os.path.join(DATAMAPP, "omanpassning_data.js"), "w", encoding="utf-8") as f:
        f.write("// omanpassning_data.js: skapad av omanpassa_m4b.py. Redigera inte för hand. Se omanpassning.html." + chr(10))
        f.write("window.OMANPASSNING = " + json.dumps(r, ensure_ascii=False, separators=(",", ":")) + ";" + chr(10))


def main():
    r = kor()
    skriv(r)
    sammanfatta(r)
    print("\nSkrev data/omanpassning_resultat.json och data/omanpassning_data.js")


if __name__ == "__main__":
    try:
        main()
    except b.DataFel as e:
        print("AVBRUTET:", e)
        sys.exit(1)
