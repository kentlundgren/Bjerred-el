# test_spotpris.py
# Tester enligt Spotpris/SPEC.md avsnitt 12 (T1–T15) plus ett extra test (T16: timpriser).
# Körs från mappen Spotpris/ med:  python test_spotpris.py
# Skriver "OK" om allt stämmer, annars en lista på fel. Referensvärdena kommer från förstudiernas skript (2026-10-07).
# Gäller bara med data/kraftringen.json, oppettider.json och sokrum.json som de är (SPEC 12, anmärkning till T5–T10).
#
# UPPDATERING 2026-10-07: Första versionen (1.0).

import copy
import datetime
import json
import os
import shutil
import sys
import tempfile

import berakna_spotpris as b
from hamta_spotpris import DataFel

FEL = []
MANADER = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]


def kolla(nr, villkor, text):
    if not villkor:
        FEL.append(f"{nr}: {text}")


def nara(a, c, tol):
    """Sant om talen ligger inom toleransen. Ett värde som inte är ett tal (till exempel 'saknas') räknas som fel, inte som krasch."""
    if not isinstance(a, (int, float)) or not isinstance(c, (int, float)):
        return False
    return abs(a - c) <= tol


def lista_nara(nr, namn, faktisk, forvantad, tol):
    for m, f, v in zip(MANADER, faktisk, forvantad):
        kolla(nr, nara(f, v, tol), f"{namn} {m}: fick {f}, förväntat {v} (tolerans {tol})")


def json_utan_genererad(d):
    d = copy.deepcopy(d)
    for k in ("manadsnitt", "m4b_resultat", "effektkurva"):
        d[k]["metadata"]["genererad"] = ""
    return json.dumps({k: d[k] for k in ("manadsnitt", "m4b_resultat", "effektkurva")}, sort_keys=True, ensure_ascii=False)


def main():
    ut = b.kor_allt()
    mn, m4 = ut["manadsnitt"]["manader"], ut["m4b_resultat"]
    prim, kans = m4["primar"], m4["kanslighet"]
    manader, modell = ut["manader"], ut["modell"]

    # T1, T1b: M1 och M2
    lista_nara("T1", "M1", [mn[m]["m1_ore"] for m in MANADER], [112.99, 113.29, 84.59, 66.54, 94.61, 103.72], 0.005)
    lista_nara("T1b", "M2", [mn[m]["m2_ore"] for m in MANADER], [125.76, 125.16, 89.20, 65.41, 86.24, 96.46], 0.005)

    # T2: antal intervall per månad och antal dygn
    forv = [2976, 2688, 2972, 2880, 2976, 2880]
    kolla("T2", [mn[m]["antal_intervall"] for m in MANADER] == forv, f"antal intervall: {[mn[m]['antal_intervall'] for m in MANADER]} != {forv}")
    dygn = set()
    for m in MANADER:
        dygn.update(d for d, wd, q, o in b.ladda_spot_manad(m))
    kolla("T2", len(dygn) == 181, f"antal dygn {len(dygn)} != 181")

    # T3: sommartid
    mars = b.ladda_spot_manad("2026-03")
    kolla("T3", sum(1 for d, wd, q, o in mars if d == "2026-03-29") == 92, "2026-03-29 ska ha 92 intervall")
    kolla("T3", manader["2026-03"].T == 743.0, f"T för mars {manader['2026-03'].T} != 743")

    # T4: negativa intervall
    kolla("T4", [mn[m]["antal_negativa"] for m in MANADER] == [0, 0, 26, 115, 128, 59], f"negativa: {[mn[m]['antal_negativa'] for m in MANADER]}")

    # T5: primär körning, U1
    u1 = prim["u1"]
    p = u1["parametrar"]
    kolla("T5", nara(u1["rms"], 1.35, 0.01), f"RMS {u1['rms']}")
    kolla("T5", (p["bo"], p["pre_timmar"], p["prep_timmar"], p["varm"], p["V_kw"]) == ("06:00", 1.0, 2.0, "24h", 13.0), f"parametrar {p}")
    lista_nara("T5", "fel", [u1["fel_per_manad"][m] for m in MANADER], [0.40, 0.02, -0.04, 2.55, 1.28, -1.65], 0.01)

    # T6: leave-one-out
    loo = prim["leave_one_out"]
    lista_nara("T6", "LOO-fel", [loo["fel_per_manad"][m] for m in MANADER], [1.91, 0.02, -0.04, 2.55, 1.28, -4.09], 0.01)

    # T7: antal giltiga och antal med största fel <= 2,0
    kolla("T7", prim["antal_kombinationer"] == 252 and prim["antal_giltiga"] == 168, f"{prim['antal_giltiga']} av {prim['antal_kombinationer']}")
    kolla("T7", prim["antal_med_storsta_fel_max_2"] == 1, f"antal med största fel <= 2,0: {prim['antal_med_storsta_fel_max_2']}")
    # T7b: band
    kolla("T7b", prim["antal_i_band"] == 7 and kans["antal_i_band"] == 81, f"band primär {prim['antal_i_band']}, känslighet {kans['antal_i_band']}")

    # T8: U2
    u2 = prim["u2"]
    p2 = u2["parametrar"]
    kolla("T8", (p2["bo"], p2["prep_timmar"], p2["varm"], p2["V_kw"]) == ("07:30", 2.0, "24h", 13.0), f"U2-parametrar {p2}")
    kolla("T8", nara(u2["storsta_absolutfel"], 1.96, 0.01) and nara(u2["rms"], 1.43, 0.01), f"U2 största {u2['storsta_absolutfel']}, RMS {u2['rms']}")

    # T9: känslighetskörning
    k1 = kans["u1"]
    pk = k1["parametrar"]
    kolla("T9", nara(k1["rms"], 1.21, 0.01), f"känslighet RMS {k1['rms']}")
    kolla("T9", (pk["bo"], pk["pre_timmar"], pk["prep_timmar"], pk["varm"], pk["V_kw"]) == ("07:30", 5.0, 1.0, "tider", 13.0), f"parametrar {pk}")
    kolla("T9", kans["leave_one_out"]["fel_per_manad"]["2026-03"] == "saknas", "mars ska saknas i känslighetens leave-one-out")

    # T10: effektkurvans medelvärde per månad
    for nyckel in ("primar", "kanslighet"):
        for m, f10 in zip(MANADER, [47.6, 47.6, 37.8, 37.0, 32.2, 28.6]):
            e = ut["effektkurva"][nyckel]["manader"][m]
            kolla("T10", nara(e["medeleffekt_kw"], e["kwh_huvud_delat_pa_timmar_kw"], 0.01), f"{nyckel} {m}: medeleffekt {e['medeleffekt_kw']} mot {e['kwh_huvud_delat_pa_timmar_kw']}")
            kolla("T10", round(e["medeleffekt_kw"], 1) == f10, f"{nyckel} {m}: {round(e['medeleffekt_kw'], 1)} != {f10}")
            kolla("T10", e["markning"].startswith("Uppskattning"), f"{nyckel} {m}: märkning saknas")
            kolla("T10", len(e["summa"]) == 24 and len(e["lagsta"]) == 24 and len(e["hogsta"]) == 24, f"{nyckel} {m}: ska ha 24 timvärden")
    jan = ut["effektkurva"]["kanslighet"]["manader"]["2026-01"]
    kolla("T10", max(range(24), key=lambda h: jan["summa"][h]) == 16 and nara(max(jan["summa"]), 76.6, 0.1), "känslighetskörningens januaritopp ska vara 76,6 kW kl. 16")

    # T11: kriterier
    kr = prim["kriterier"]
    kolla("T11", kr["passning"]["uppfyllt"] and nara(kr["passning"]["utfall"], 2.55, 0.01) and kr["passning"]["grans"] == 3.0, f"passning {kr['passning']}")
    kolla("T11", kr["leave_one_out"]["uppfyllt"] and nara(kr["leave_one_out"]["utfall"], 4.09, 0.01) and kr["leave_one_out"]["grans"] == 4.5, f"LOO {kr['leave_one_out']}")
    ej = b.utvardera_kriterier(3.5, 5.0, 3.0, 4.5)
    kolla("T11", (not ej["passning"]["uppfyllt"]) and (not ej["leave_one_out"]["uppfyllt"]), "konstruerad indata över gränsen ska ge 'ej uppfyllt'")
    kolla("T11", ej["passning"]["grans"] == 3.0 and ej["leave_one_out"]["grans"] == 4.5, "gränserna får inte ändras av utvärderingen")

    # T12: omöjlig kombination
    mar = manader["2026-03"]
    ogiltig = {"bo": "07:30", "bo_q": 30, "pre": 1.0, "pre_q": 4, "prep": 0.0, "prep_q": 0, "varm": "24h", "V": 14.0, "ordning": (0, 0, 0)}
    kolla("T12", b.forbrukning(mar, modell, ogiltig) is None, "V 14 kW ska vara ogiltigt i mars (restposten är för liten)")
    fel, ogilt = b.fel_per_manad(manader, modell, ogiltig)
    kolla("T12", fel is None and "2026-03" in ogilt, f"fel_per_manad ska ge None och nämna mars: {fel}, {ogilt}")

    # T13: saknat dygn avbryter
    tmp = tempfile.mkdtemp()
    try:
        for f in os.listdir("data"):
            shutil.copy(os.path.join("data", f), tmp)
        sokv = os.path.join(tmp, "spot_SE4_2026-01.json")
        d = json.load(open(sokv, encoding="utf-8"))
        d["intervall"] = [i for i in d["intervall"] if not i["start"].startswith("2026-01-15")]
        json.dump(d, open(sokv, "w", encoding="utf-8"))
        try:
            b.ladda_spot_manad("2026-01", tmp)
            kolla("T13", False, "ett saknat dygn ska ge DataFel")
        except DataFel as e:
            kolla("T13", "2026-01-15" in str(e), f"felet ska nämna 2026-01-15: {e}")
        # T16 (extra): timpriser ersätts av fyra kvartar med samma pris
        ts = {"metadata": {}, "intervall": []}
        start = datetime.datetime(2025, 2, 1, 0, 0)
        for n in range(28 * 24):                      # 28 dygn med timpriser (före kvartsövergången 2025-10-01)
            a = start + datetime.timedelta(hours=n)
            e = a + datetime.timedelta(hours=1)
            ts["intervall"].append({"start": a.strftime("%Y-%m-%dT%H:%M:%S+01:00"), "slut": e.strftime("%Y-%m-%dT%H:%M:%S+01:00"),
                                    "sek_per_kwh": a.hour / 100.0, "eur_per_kwh": 0, "exr": 0})
        json.dump(ts, open(os.path.join(tmp, "spot_SE4_2025-02.json"), "w", encoding="utf-8"))
        q = b.ladda_spot_manad("2025-02", tmp)
        kolla("T16", len(q) == 28 * 96, f"timpriser ska ge 2688 kvartar, fick {len(q)}")
        kolla("T16", all(abs(o - (qi // 4)) < 1e-9 for d, wd, qi, o in q), "varje kvart ska ha timmens pris")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    # T14: determinism
    ut2 = b.kor_allt()
    kolla("T14", json_utan_genererad(ut) == json_utan_genererad(ut2), "två körningar ger olika utdata")

    # T15: allt elpris mot krOre
    lista_nara("T15", "allt elpris", [mn[m]["faktura"]["allt_elpris_ore"] for m in MANADER], [122.24, 121.56, 92.87, 68.29, 95.00, 106.45], 0.005)
    try:
        b.kontrollera_mot_krore(b.ladda_indata())
    except DataFel as e:
        kolla("T15", False, f"kontrollen mot krOre: {e}")

    # Extra: energibalans för primär U1 i varje månad
    for m in MANADER:
        f = b.forbrukning(manader[m], modell, [g for g in ut["giltiga_primar"] if abs(g["rms"] - u1["rms"]) < 1e-12][0]["p"])
        mm = manader[m]
        kolla("T5", abs(mm.kwh_bastu + mm.kwh_varm + f["E_v"] + f["E_d"] - mm.kwh_huvud) < 0.001, f"{m}: energibalansen stämmer inte")

    if FEL:
        print(f"{len(FEL)} fel:")
        for f in FEL:
            print(" -", f)
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
