# kanslighet_avlasning.py
# Känslighetsanalys: kan fel i tidpunkten för avläsningen av bastu- och varmvattenmätarna förklara att modellens fel (modell minus faktura) växlar
# mellan plus och minus från månad till månad?
#
# Tanken (Kent, 2026-10-07): om en mätare läses av den 1:a en månad och den 3:e nästa månad hamnar några dagars kWh i fel månad. Månaden före får
# för lite och månaden efter för mycket. Det syns som svängningar mellan månaderna, till exempel i fördelningen bad/restaurang i elöversikten.
#
# Beräkning, med antaganden U1 från januari-juni fixa: för varje månad flyttas delta kWh från restposten ("restaurang") till bastun, och vi
# tar reda på hur många kWh som hade behövts för att modellens fel ska bli noll. Delat med bastuns kWh per dag blir det ett antal dagar.
# Är det många dagar går det inte att förklara felet med en avläsning som är en eller några dagar fel.
#
# Huvudmätaren påverkas inte: Kraftringens fakturor läser av den den 1:a varje månad (kontrollerat ur fakturorna för januari-augusti 2026).
#
# Körning (från mappen Spotpris/):  python kanslighet_avlasning.py
# Skriver data/avlasning_data.js (window.AVLASNING).
#
# UPPDATERING 2026-10-07: Första versionen.

import datetime
import json

import berakna_spotpris as b
from forutsag_spotpris import p_av

FACIT_JUL_AUG = {"2026-07": (21585, 8771, 1653), "2026-08": (21836, 8807, 1719)}     # huvud, bastu, varmvatten (debiteringsunderlag)
SOK_GRANS_KWH = 4000                                                                    # sökintervall för delta: -4000..+4000 kWh
TRE_DAGAR = 3


def med_bastu(mn, delta):
    """Kopia av månaden där bastuns kWh är delta större (och restposten delta mindre)."""
    ny = b.Manad.__new__(b.Manad)
    ny.__dict__.update(mn.__dict__)
    ny.kwh_bastu = mn.kwh_bastu + delta
    ny.kwh_rest = mn.kwh_huvud - ny.kwh_bastu - mn.kwh_varm
    return ny


def main():
    ut = b.kor_allt(kontrollera_krore=False)
    modell = ut["modell"]
    p = p_av(json.load(open("data/m4b_resultat.json", encoding="utf-8"))["primar"]["u1"]["parametrar"])
    facit = json.load(open("data/facit_jul_sep.json", encoding="utf-8"))["manader"]
    manader = dict(ut["manader"])
    for m, (h, ba, va) in FACIT_JUL_AUG.items():
        manader[m] = b.Manad(m, b.ladda_spot_manad(m), {"kwh_huvud": h, "kwh_bastu": ba, "kwh_varmvatten": va,
                                                       "spot_ore": facit[m]["spot_ore"], "rorliga_ore": 0.0, "paslag_ore": 0.0})
    rader = []
    for m, mn in manader.items():
        dagar = mn.T / 24.0
        v0 = b.forbrukning(mn, modell, p)["varde"]
        v100 = b.forbrukning(med_bastu(mn, 100), modell, p)["varde"]
        kans = v100 - v0                                                # öre/kWh per 100 kWh flyttat från restposten till bastun
        basta = None
        for d in range(-SOK_GRANS_KWH, SOK_GRANS_KWH + 1, 10):
            f = b.forbrukning(med_bastu(mn, d), modell, p)
            if f is None:
                continue
            e = abs(f["varde"] - mn.spot_ore)
            if basta is None or e < basta[1]:
                basta = (d, e)
        bastu_dag = mn.kwh_bastu / dagar
        rader.append({"manad": m, "fel_nu_ore": v0 - mn.spot_ore, "bastu_kwh_per_dag": bastu_dag, "varmvatten_kwh_per_dag": mn.kwh_varm / dagar,
                      "kanslighet_ore_per_100kwh": kans, "kwh_som_kravs": basta[0], "dagar_som_kravs": basta[0] / bastu_dag,
                      "vid_grans": abs(basta[0]) >= SOK_GRANS_KWH - 10,
                      "effekt_av_tre_dagar_ore": TRE_DAGAR * bastu_dag * kans / 100.0})
        r = rader[-1]
        print(f"{m}: fel {r['fel_nu_ore']:+.2f} | känslighet {kans:+.3f} öre/100 kWh | krävs {r['kwh_som_kravs']:+d} kWh = {r['dagar_som_kravs']:+.1f} dagar{' (vid sökgränsen)' if r['vid_grans'] else ''} | 3 dagar ger {r['effekt_av_tre_dagar_ore']:+.2f} öre/kWh")
    res = {"metadata": {"gjord": datetime.date.today().isoformat(), "sokgrans_kwh": SOK_GRANS_KWH, "dagar_tankta": TRE_DAGAR,
                        "huvudmatare": "Kraftringens fakturor läser av huvudmätaren den 1:a varje månad (januari-augusti 2026)."}, "rader": rader}
    with open("data/avlasning_data.js", "w", encoding="utf-8") as f:
        f.write("// Skapad av kanslighet_avlasning.py\nwindow.AVLASNING = " + json.dumps(res, ensure_ascii=False, indent=1) + ";\n")


if __name__ == "__main__":
    main()
