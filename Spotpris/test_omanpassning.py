# test_omanpassning.py
# Tester för omanpassa_m4b.py (omanpassningen av M4b på januari–september 2026).
# Körs från mappen Spotpris/ med:  python test_omanpassning.py
# Skriver "OK" om allt stämmer, annars en lista på fel. Skriver inga filer (till skillnad från test_spotpris.py, som skriver om
# spotpris_data.js), så de frusna filerna rörs inte.
#
# Referensvärdena är de som skriptet gav vid första körningen 2026-10-08, efter att kriterierna i data/omanpassning_kriterier.json var skrivna.
# De fungerar som skydd mot oavsiktliga ändringar, inte som oberoende facit. Förutom en sak: att anpassningen på januari–juni ger ver. 1
# (T5 i SPEC 12) kontrolleras inne i skriptet och avbryter körningen om det inte stämmer.
#
# UPPDATERING 2026-10-08: Första versionen (1.0).

import json
import os
import sys

import berakna_spotpris as b
import omanpassa_m4b as o

FEL = []


def kolla(nr, villkor, text):
    if not villkor:
        FEL.append(f"{nr}: {text}")


def nara(a, c, tol):
    if not isinstance(a, (int, float)) or not isinstance(c, (int, float)):
        return False
    return abs(a - c) <= tol


def lista_nara(nr, namn, faktisk, forvantad, tol):
    kolla(nr, len(faktisk) == len(forvantad), f"{namn}: {len(faktisk)} värden, förväntat {len(forvantad)}")
    for i, (f, v) in enumerate(zip(faktisk, forvantad)):
        kolla(nr, nara(f, v, tol), f"{namn} nr {i + 1}: fick {f}, förväntat {v} (tolerans {tol})")


def utan_genererad(r):
    r = json.loads(json.dumps(r))
    r["metadata"]["genererad"] = ""
    r["frusen_ver2"]["datum"] = ""
    return json.dumps(r, sort_keys=True, ensure_ascii=False)


def main():
    r = o.kor()          # kor() avbryter med DataFel om anpassningen på januari–juni inte ger ver. 1
    namn = r["manader"]

    # O1: nio månader, i ordning
    kolla("O1", namn == [f"2026-0{i}" for i in range(1, 10)], f"månader: {namn}")

    # O2: kWh för juli–september är mätardifferenserna ur intern_underlag.js (STANDARD)
    kr = o.bygg_indata()
    forv = {"2026-07": (365214 - 343630, (65896 - 61254) + (57817 - 53688), 692241 - 690588),
            "2026-08": (387050 - 365214, (70572 - 65896) + (61947 - 57817), 693960 - 692241),
            "2026-09": (408739 - 387050, (75815 - 70572) + (66805 - 61947), 695247 - 693960)}
    for m, (h, ba, va) in forv.items():
        kolla("O2", (kr[m]["kwh_huvud"], kr[m]["kwh_bastu"], kr[m]["kwh_varmvatten"]) == (h, ba, va), f"{m}: kWh {kr[m]} mot mätardifferenser {(h, ba, va)}")
    for m in namn:
        kolla("O2", kr[m]["kwh_huvud"] > kr[m]["kwh_bastu"] + kr[m]["kwh_varmvatten"], f"{m}: restposten ska vara positiv")
    kolla("O2", len(b.ladda_indata()["kraftringen"]) == 6, "kraftringen.json ska fortfarande ha sex månader (frusen)")

    # O3: ver. 1 är oförändrad, ver. 2 är den omanpassade kombinationen
    p1, p2 = r["ver1"]["parametrar"], r["ver2"]["parametrar"]
    kolla("O3", (p1["bo"], p1["pre_timmar"], p1["prep_timmar"], p1["varm"], p1["V_kw"]) == ("06:00", 1.0, 2.0, "24h", 13.0), f"ver. 1: {p1}")
    kolla("O3", (p2["bo"], p2["pre_timmar"], p2["prep_timmar"], p2["varm"], p2["V_kw"]) == ("07:30", 1.0, 2.0, "24h", 13.0), f"ver. 2: {p2}")
    kolla("O3", not r["samma_kombination"], "ver. 2 ska skilja sig från ver. 1 (bastun öppnar 07:30 i stället för 06:00)")
    kolla("O3", nara(r["ver2"]["rms"], 1.99, 0.01) and nara(r["ver2"]["storsta_absolutfel"], 3.23, 0.01), f"ver. 2 RMS {r['ver2']['rms']}, största {r['ver2']['storsta_absolutfel']}")
    kolla("O3", r["antal_giltiga"] == 168 and r["antal_kombinationer"] == 252, f"{r['antal_giltiga']} av {r['antal_kombinationer']}")
    kolla("O3", r["antal_i_band"] == 0 and r["antal_med_storsta_fel_max_2"] == 0, f"band {r['antal_i_band']}, <=2: {r['antal_med_storsta_fel_max_2']}")
    kolla("O3", nara(r["u2"]["storsta_absolutfel"], 2.99, 0.01), f"U2 största {r['u2']['storsta_absolutfel']}")

    # O4: fel per månad, ver. 1 (frusna parametrar) och ver. 2, med verklig bastu/varmvatten-fördelning
    pm = r["per_manad"]
    lista_nara("O4", "fel ver. 1", [pm[m]["fel_ver1"] for m in namn], [0.40, 0.02, -0.04, 2.55, 1.28, -1.65, 3.07, -3.39, -3.75], 0.01)
    lista_nara("O4", "fel ver. 2", [pm[m]["fel_ver2"] for m in namn], [1.91, 1.12, -0.01, 1.96, 0.42, -1.85, 2.45, -3.23, -2.61], 0.01)
    lista_nara("O4", "fel M1", [pm[m]["fel_m1"] for m in namn], [-4.39, -3.39, -2.00, 3.42, 6.42, 3.63, 7.27, -3.27, -7.96], 0.01)
    lista_nara("O4", "fel M2", [pm[m]["fel_m2"] for m in namn], [8.38, 8.48, 2.61, 2.29, -1.95, -3.63, -1.34, -0.58, 4.92], 0.01)
    s = r["sammanfattning"]
    kolla("O4", nara(s["jan_jun"]["fel_ver1"]["rms"], 1.35, 0.01) and nara(s["jan_jun"]["fel_ver2"]["rms"], 1.43, 0.01), f"RMS jan–jun: {s['jan_jun']}")
    kolla("O4", nara(s["jul_sep"]["fel_ver1"]["rms"], 3.42, 0.01) and nara(s["jul_sep"]["fel_ver2"]["rms"], 2.78, 0.01), f"RMS jul–sep: {s['jul_sep']}")
    kolla("O4", nara(s["jan_sep"]["fel_ver1"]["rms"], 2.26, 0.01) and nara(s["jan_sep"]["fel_ver2"]["rms"], 1.99, 0.01), f"RMS jan–sep: {s['jan_sep']}")

    # O5: framåtprov (juli är identiskt med ver. 1)
    f = r["framatprov"]
    lista_nara("O5", "framåtprov", [f[m]["fel_ore"] for m in ("2026-07", "2026-08", "2026-09")], [3.07, -3.23, -2.61], 0.01)
    kolla("O5", f["2026-07"]["parametrar"] == p1, "juli ska förutsägas med ver. 1:s parametrar")
    kolla("O5", f["2026-07"]["antal_tranings_manader"] == 6 and f["2026-09"]["antal_tranings_manader"] == 8, "fönstret ska växa från sex till åtta månader")

    # O6: leave-one-out, mars saknas (vald kombination med V 14 kW är omöjlig i mars)
    l = r["leave_one_out"]
    kolla("O6", l["2026-03"]["fel_ore"] is None and l["2026-03"]["parametrar"]["V_kw"] == 14.0, f"mars ska saknas med V 14: {l['2026-03']}")
    lista_nara("O6", "LOO-fel", [l[m]["fel_ore"] for m in namn if m != "2026-03"], [3.51, 1.33, 2.27, 0.96, -1.85, 2.78, -3.23, -2.61], 0.01)

    # O7: kriterierna: utfall, gränserna oförändrade mot filen som skrevs före körningen, och beslutsregeln
    k = r["kriterier"]
    fil = json.load(open(os.path.join("data", "omanpassning_kriterier.json"), encoding="utf-8"))["kriterier"]
    kolla("O7", k["K1_passning"]["grans"] == fil["K1_passning"]["grans_ore"] == 3.0, "K1:s gräns ska vara 3,0")
    kolla("O7", k["K2_leave_one_out"]["grans"] == fil["K2_leave_one_out"]["grans_ore"] == 4.5, "K2:s gräns ska vara 4,5")
    kolla("O7", k["K3_framatprov"]["grans_max"] == 4.5 and k["K3_framatprov"]["grans_rms"] == 3.77, "K3:s gränser ska vara 4,5 och 3,77")
    kolla("O7", (not k["K1_passning"]["uppfyllt"]) and nara(k["K1_passning"]["utfall"], 3.23, 0.01), f"K1 ska vara ej uppfyllt (3,23): {k['K1_passning']}")
    kolla("O7", k["K2_leave_one_out"]["uppfyllt"] and nara(k["K2_leave_one_out"]["utfall"], 3.51, 0.01) and k["K2_leave_one_out"]["antal_saknas"] == 1, f"K2: {k['K2_leave_one_out']}")
    kolla("O7", k["K3_framatprov"]["uppfyllt"] and nara(k["K3_framatprov"]["utfall_rms"], 2.98, 0.01), f"K3: {k['K3_framatprov']}")
    kolla("O7", not k["alla_uppfyllda"], "alla_uppfyllda ska vara falskt (K1 ej uppfyllt)")
    kolla("O7", "andringar" in json.load(open(os.path.join("data", "omanpassning_kriterier.json"), encoding="utf-8"))["metadata"], "kriteriefilen ska ha ett fält 'andringar'")

    # O8: baslasten V ligger i sökrummets övre gräns för vad mars tillåter (V 14 är omöjligt i mars)
    rv = {x["V_kw"]: x["rms_ore"] for x in r["rms_mot_v"]["jan_sep"]}
    kolla("O8", all(rv[v] is None for v in range(14, 21)) and rv[13] is not None, "V över 13 kW ska vara ogiltigt när mars ingår")
    kolla("O8", all(rv[v] > rv[v + 1] for v in range(0, 13)), "RMS ska sjunka för varje steg i V upp till 13 kW")

    # O9: de frusna filerna är orörda: ver. 1 ur m4b_resultat.json och blindprovets förutsägelser
    fr = json.load(open(os.path.join("data", "m4b_resultat.json"), encoding="utf-8"))["primar"]["u1"]
    kolla("O9", fr["parametrar"]["bo"] == "06:00" and nara(fr["rms"], 1.35, 0.01), f"m4b_resultat.json ska fortfarande ha ver. 1: {fr['parametrar']}")
    fo = json.load(open(os.path.join("data", "forutsagelse_jul_sep.json"), encoding="utf-8"))
    kolla("O9", fo["metadata"]["gjord"] == "2026-10-07", f"blindprovets datum ska vara 2026-10-07, är {fo['metadata']['gjord']}")

    # O10: determinism och webbpaketet
    r2 = o.kor()
    kolla("O10", utan_genererad(r) == utan_genererad(r2), "två körningar ger olika utdata")
    sokv = os.path.join("data", "omanpassning_data.js")
    if os.path.exists(sokv):
        txt = open(sokv, encoding="utf-8").read()
        kolla("O10", txt.count("window.OMANPASSNING = ") == 1, "omanpassning_data.js ska ha exakt en tilldelning")
        paket = json.loads(txt[txt.index("window.OMANPASSNING = ") + len("window.OMANPASSNING = "):].rstrip().rstrip(";"))
        kolla("O10", utan_genererad(paket) == utan_genererad(r), "omanpassning_data.js ska vara lika med resultatet (kör omanpassa_m4b.py igen)")
    else:
        kolla("O10", False, "data/omanpassning_data.js saknas (kör omanpassa_m4b.py)")

    if FEL:
        print(f"{len(FEL)} fel:")
        for x in FEL:
            print(" -", x)
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
