# kanslighet_startpuls.py
# Känslighetsvariant: vad händer med träffen mot fakturan om bastuaggregaten ger en startpuls i första timmen?
#
# Bakgrund: bastun har två aggregat (ett per bastu, Harvia Qube 360, 36 kW vardera, Kent 2026-10-07). Modellen känner bara månadens kWh för
# bastun och sprider den jämnt från "öppning minus förvärmning" till 22:00. Här läggs i stället en startpuls i första timmen och resten
# sprids jämnt. Pulsen räknas som min(effekt x 1 timme, 90 % av dygnets bastu-kWh). Effekter som prövas: 0 (nuvarande modell), ett aggregat
# (36 kW), båda aggregaten (72 kW) och ett överdrivet fall (144 kW, bara för att visa riktningen).
#
# Tre delar skrivs till data/startpuls_data.js (window.STARTPULS):
#   1. rader:            antaganden U1 från januari-juni hålls fixa, bara pulsen ändras (efterhandsanalys).
#   2. omanpassning:     hela sökningen (252 kombinationer) körs om med pulsen som en fast del av modellen: bästa passning, leave-one-out,
#                        antal alternativ i bandet och blindprovets fel. Det är den rättvisa jämförelsen.
#   3. per_manad:        hur pulsen flyttar modellens värde i varje månad (pris kl. 05-06 mot bastuns snittpris) jämfört med felet utan puls.
# Primärkörningen (berakna_spotpris.py) ändras inte.
#
# Körning (från mappen Spotpris/):  python kanslighet_startpuls.py
#
# UPPDATERING 2026-10-07: Första versionen. Utökad samma dag med omanpassning och per_manad.
# UPPDATERING 2026-10-08: September 2026 tillagd (fel_sep, och en rad till i per_manad). Övriga värden är oförändrade.

import json
import math
import datetime

import berakna_spotpris as b
from forutsag_spotpris import p_av

AGGREGAT_ANTAL = 2
AGGREGAT_KW = 36.0
PULSER_KW = [0.0, AGGREGAT_KW, AGGREGAT_KW * AGGREGAT_ANTAL, 144.0]
# UPPDATERING 2026-10-08: september tillagd (huvud 21689, bastu 10101, varmvatten 1287, se data/omanpassning_indata.json). Juli och augusti oförändrade.
FACIT_JUL_AUG = {"2026-07": (21585, 8771, 1653), "2026-08": (21836, 8807, 1719), "2026-09": (21689, 10101, 1287)}     # huvud, bastu, varmvatten; namnet är historiskt, nu jul-sep
NPULS = 4                                                                               # pulsen varar en timme = 4 kvartar

_aktuell = {"mn": None, "puls": 0.0}
_forbrukning_original = b.forbrukning


def bastu_vikt(bo_q, pre_q):
    """Vikter för bastun med startpuls i första timmen. Pulsens andel beror på månadens bastu-kWh per dygn."""
    mn = _aktuell["mn"]
    start, slut = bo_q - pre_q, b.BASTU_STANGER_Q
    dag_kwh = mn.kwh_bastu / (mn.T / 24.0)
    andel = min(0.9, _aktuell["puls"] * 1.0 / dag_kwh) if _aktuell["puls"] else 0.0
    k = andel * ((slut - start) - NPULS) / (NPULS * (1 - andel)) if andel else 1.0
    return [[(k if q < start + NPULS else 1) if start <= q < slut else 0 for q in range(96)] for _ in range(7)]


def forbrukning_med_puls(mn, modell, p):
    _aktuell["mn"] = mn
    return _forbrukning_original(mn, modell, p)


def rms(lista):
    return math.sqrt(sum(x * x for x in lista) / len(lista))


def main():
    ut = b.kor_allt(kontrollera_krore=False)
    modell, indata = ut["modell"], ut["indata"]
    u1 = json.load(open("data/m4b_resultat.json", encoding="utf-8"))["primar"]["u1"]["parametrar"]
    p = p_av(u1)
    facit = json.load(open("data/facit_jul_sep.json", encoding="utf-8"))["manader"]
    fit = ut["manader"]
    blind = {}
    for m, (h, ba, va) in FACIT_JUL_AUG.items():
        blind[m] = b.Manad(m, b.ladda_spot_manad(m), {"kwh_huvud": h, "kwh_bastu": ba, "kwh_varmvatten": va,
                                                     "spot_ore": facit[m]["spot_ore"], "rorliga_ore": 0.0, "paslag_ore": 0.0})
    alla = dict(fit)
    alla.update(blind)
    bo_alt = indata["oppettider"]["bastu"]["oppnar_alternativ"]
    komb = b.parametrar_kombinationer(indata["sokrum"]["primar"], bo_alt)

    b.forbrukning = forbrukning_med_puls
    modell.v_bastu = bastu_vikt

    # 1. U1 fixerad, bara pulsen ändras
    rader = []
    for pkw in PULSER_KW:
        _aktuell["puls"] = pkw
        fel = {m: forbrukning_med_puls(mn, modell, p)["varde"] - mn.spot_ore for m, mn in alla.items()}
        anp = [fel[m] for m in sorted(fel) if m <= "2026-06"]
        rader.append({"puls_kw": pkw, "rms_anpassning": rms(anp), "storsta_anpassning": max(abs(x) for x in anp),
                      "fel_jul": fel["2026-07"], "fel_aug": fel["2026-08"], "fel_sep": fel["2026-09"]})
        print(f"[fixerad U1] puls {pkw:5.0f} kW: RMS jan-jun {rader[-1]['rms_anpassning']:.2f}, jul {fel['2026-07']:+.2f}, aug {fel['2026-08']:+.2f}, sep {fel['2026-09']:+.2f}")

    # 2. hela sökningen körs om för varje puls
    omanp = []
    for pkw in PULSER_KW[:3]:
        _aktuell["puls"] = pkw
        giltiga, _, _ = b.sok(fit, modell, komb)
        v = b.valj(giltiga, "u1")
        loo = b.leave_one_out(fit, modell, komb)
        fel = {m: forbrukning_med_puls(mn, modell, v["p"])["varde"] - mn.spot_ore for m, mn in blind.items()}
        omanp.append({"puls_kw": pkw, "rms": v["rms"], "storsta": v["storsta"], "V_kw": v["p"]["V"], "varm": v["p"]["varm"],
                      "loo_storsta": loo["storsta_absolutfel"], "antal_i_band": sum(1 for g in giltiga if g["rms"] <= 1.5),
                      "fel_jul": fel["2026-07"], "fel_aug": fel["2026-08"], "fel_sep": fel["2026-09"]})
        print(f"[omanpassad] puls {pkw:5.0f} kW: bästa RMS {v['rms']:.2f}, LOO {loo['storsta_absolutfel']:.2f}, band {omanp[-1]['antal_i_band']}, jul/aug/sep {fel['2026-07']:+.2f}/{fel['2026-08']:+.2f}/{fel['2026-09']:+.2f}")

    # 3. per månad: pris kl. 05-06 mot bastuns snittpris, och hur mycket 72 kW-pulsen flyttar modellvärdet (U1 fixerad)
    per = []
    pkw = AGGREGAT_KW * AGGREGAT_ANTAL
    for m, mn in alla.items():
        _aktuell["puls"] = 0.0
        f0 = forbrukning_med_puls(mn, modell, p)
        start = p["bo_q"] - p["pre_q"]
        p_forsta, _ = mn.vikta([[1 if start <= q < start + NPULS else 0 for q in range(96)] for _ in range(7)])
        _aktuell["puls"] = pkw
        f1 = forbrukning_med_puls(mn, modell, p)
        per.append({"manad": m, "bastu_snittpris": f0["P_bastu"], "pris_forsta_timmen": p_forsta, "forskjutning": f1["varde"] - f0["varde"],
                    "fel_utan_puls": f0["varde"] - mn.spot_ore, "fel_med_puls": f1["varde"] - mn.spot_ore})
        print(f"{m}: förskjutning {per[-1]['forskjutning']:+.2f}, fel {per[-1]['fel_utan_puls']:+.2f} -> {per[-1]['fel_med_puls']:+.2f}")

    b.forbrukning = _forbrukning_original
    res = {"metadata": {"gjord": datetime.date.today().isoformat(), "aggregat_antal": AGGREGAT_ANTAL, "aggregat_kw": AGGREGAT_KW,
                        "text": "Efterhandsanalys. Primärkörningen är oförändrad."},
           "rader": rader, "omanpassning": omanp, "per_manad": per}
    with open("data/startpuls_data.js", "w", encoding="utf-8") as f:
        f.write("// Skapad av kanslighet_startpuls.py\nwindow.STARTPULS = " + json.dumps(res, ensure_ascii=False, indent=1) + ";\n")


if __name__ == "__main__":
    main()
