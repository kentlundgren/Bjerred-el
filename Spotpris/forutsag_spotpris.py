# forutsag_spotpris.py
# Blindprov: förutsäger fakturans spotpris för juli, augusti och september 2026 med de antaganden som valdes på
# januari–juni (M4b, U1 i den primära körningen). Facit (fakturornas spotpris) har inte lästs in här.
#
# Det som används:
#   - spotpriser per kvart ur data/spot_SE4_2026-07..09.json (hamta_spotpris.py)
#   - kWh huvud, "bad" (bastu + varmvatten) och restaurang ur index.html / data.md (Kents avläsningar)
#   - antaganden och öppettider som i Jan–Jun (data/oppettider.json). Sommartider är inte kontrollerade.
# Det som saknas: uppdelningen av "bad" i bastu och varmvatten för juli–september. Den antas ha samma andel varmvatten
# som genomsnittet januari–juni (spannet min–max används för att visa osäkerheten).
#
# Körning (från mappen Spotpris/):  python forutsag_spotpris.py
# Skriver data/forutsagelse_jul_sep.json.
#
# UPPDATERING 2026-10-07: Första versionen.

import json
import datetime

import berakna_spotpris as b

# kWh ur index.html (monthlyData) och data.md: huvudmätare och "bad" (bastu + varmvatten). Restaurang = huvud - bad.
KWH = {
    "2026-07": {"huvud": 21585, "bad": 10424},
    "2026-08": {"huvud": 21836, "bad": 10526},
    "2026-09": {"huvud": 21689, "bad": 11388},
}


def p_av(par):
    """Parameterdict i det format som forbrukning() vill ha, ur ett urval i m4b_resultat.json."""
    return {"bo": par["bo"], "bo_q": b.tid_till_q(par["bo"]), "pre": float(par["pre_timmar"]), "pre_q": int(round(par["pre_timmar"] * 4)),
            "prep": float(par["prep_timmar"]), "prep_q": int(round(par["prep_timmar"] * 4)), "varm": par["varm"], "V": float(par["V_kw"]),
            "ordning": (0, 0, 0)}


def main():
    ut = b.kor_allt(kontrollera_krore=False)
    indata, modell = ut["indata"], ut["modell"]
    kr = indata["kraftringen"]
    andelar = [kr[m]["kwh_varmvatten"] / (kr[m]["kwh_bastu"] + kr[m]["kwh_varmvatten"]) for m in kr]
    andel_medel, andel_min, andel_max = sum(andelar) / len(andelar), min(andelar), max(andelar)
    u1 = json.load(open("data/m4b_resultat.json", encoding="utf-8"))["primar"]["u1"]["parametrar"]
    p_u1 = p_av(u1)
    band = [g["p"] for g in ut["giltiga_primar"] if g["rms"] <= indata["sokrum"]["band_rms_max"]]

    resultat = {"metadata": {"gjord": datetime.date.today().isoformat(),
                             "text": "Förutsägelse gjord innan fakturornas spotpris lästes in. Antaganden från Jan-Jun, frusna.",
                             "varmvattenandel": {"medel": andel_medel, "min": andel_min, "max": andel_max},
                             "u1": u1, "antal_i_band": len(band)}, "manader": {}}
    for m, k in KWH.items():
        intervall = b.ladda_spot_manad(m)
        def manad(andel):
            varm = round(k["bad"] * andel)
            kr_m = {"kwh_huvud": k["huvud"], "kwh_bastu": k["bad"] - varm, "kwh_varmvatten": varm, "spot_ore": 0.0, "rorliga_ore": 0.0, "paslag_ore": 0.0}
            return b.Manad(m, intervall, kr_m)
        punkt = b.forbrukning(manad(andel_medel), modell, p_u1)
        varden = []
        for a in (andel_min, andel_medel, andel_max):
            mn = manad(a)
            for p in [p_u1] + band:
                f = b.forbrukning(mn, modell, p)
                if f is not None:
                    varden.append(f["varde"])
        mn = manad(andel_medel)
        resultat["manader"][m] = {"m4b_ore": punkt["varde"], "spann_min_ore": min(varden), "spann_max_ore": max(varden),
                                  "m1_ore": mn.m1(), "m2_ore": mn.m2(), "kwh": k}
        print(f"{m}: M4b {punkt['varde']:.2f} öre/kWh (spann {min(varden):.2f}-{max(varden):.2f}), M1 {mn.m1():.2f}, M2 {mn.m2():.2f}")
    with open("data/forutsagelse_jul_sep.json", "w", encoding="utf-8") as f:
        json.dump(resultat, f, ensure_ascii=False, indent=2)
    # Samma data som skriptfil, så att sidan kan läsa den från file:// (se webbpaket i berakna_spotpris.py).
    # Rörliga kostnader förutsägs inte av någon modell: snitt (vägt med kWh) och spann av januari-juni används.
    rl = [(float(kr[m]["rorliga_ore"]), kr[m]["kwh_huvud"]) for m in kr]
    resultat["rorliga"] = {"snitt_ore": sum(v * w for v, w in rl) / sum(w for _, w in rl),
                           "min_ore": min(v for v, _ in rl), "max_ore": max(v for v, _ in rl),
                           "text": "Ingen modell: vägt snitt och spann av januari-juni"}
    with open("data/forutsagelse_data.js", "w", encoding="utf-8") as f:
        f.write("// Skapad av forutsag_spotpris.py. Förutsägelse gjord innan fakturornas spotpris lästes in.\n")
        f.write("window.FORUTSAGELSE = " + json.dumps(resultat, ensure_ascii=False, indent=1) + ";\n")
    print(f"Varmvattenandel av bad Jan-Jun: medel {andel_medel:.3f}, min {andel_min:.3f}, max {andel_max:.3f}")


if __name__ == "__main__":
    main()
