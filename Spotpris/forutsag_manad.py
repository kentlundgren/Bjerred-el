# forutsag_manad.py
# Månadsrutinens Del A och Del B i ett skript (Kents tvådelade rutin, se .cursor/skills/bjerred-manadsrutin/SKILL.md steg 1b och 2i).
#
# DEL A: gissa fakturan INNAN den har lästs.   Körs de första dagarna i nästa månad, när månadens kWh är känd.
#   python forutsag_manad.py 2026-10 --huvud 21000 --bastu 8800 --varm 1500
#   (eller med --bad i stället för --bastu och --varm, om bara uppdelningen bastu+varmvatten saknas, t.ex. --huvud 21000 --bad 10300)
#   Förutsäger, med M4b ver. 1 och ver. 2:
#     1. spotpriset (öre/kWh)            M4b-modellen
#     2. allt elpris (öre/kWh)           spot + rörliga kostnader + påslag
#     3. rörlig nätavgift/elöverföring   ur ett samband med allt elpris (se SAMBAND nedan)
#     4. fakturabeloppet (kr inkl moms)  (fast nätavgift + kWh × (allt elpris + elöverföring + skatt)) × 1,25
#   Skriver data/forutsagelse_ÅÅÅÅ-MM.json och .md, daterade. Filerna är en frusen gissning och skrivs inte över (se --skriv-over).
#
# DEL B: stäm av mot fakturan.   Körs när fakturan har kommit (cirka den 10:e).
#   python forutsag_manad.py 2026-10 --facit --spot 95.12 --rorliga 4.80 --natoverf 20.45 --fast 7980 --faktura 51234 --kwh-faktura 21000.12
#   Läser den frusna gissningen och skriver data/utfall_ÅÅÅÅ-MM.json och .md med gissning, facit och fel (modell minus faktura) för båda versionerna.
#   Utfallsfilen läses också som källa till rörliga kostnader och uppdelning bastu/varmvatten nästa månad.
#
# Antaganden (alla frusna eller flaggade i filen):
#   - M4b ver. 1: parametrar anpassade på januari–juni (data/m4b_resultat.json, primar.u1). Referensen.
#   - M4b ver. 2: omanpassad på januari–september (data/omanpassning_resultat.json, frusen_ver2), bastun öppnar 07:30. Ett försök.
#     Oktober 2026 förutsägs med båda (data/omanpassning_kriterier.json) och först efter oktober, november och december bedöms vilken som är bäst.
#   - Rörliga kostnader: ingen modell, kWh-vägt snitt och spann av tidigare månader.
#   - Påslag 1,70 öre/kWh, energiskatt 36,00 öre/kWh, fast nätavgift = senaste månadens, moms 25 %. ALLA kan ha ändrats (elhandelsavtalet gällde t.o.m.
#     2026-09-30), och det står som varning i filen. Ändra med --paslag, --skatt, --fast om fakturan visar annat.
#   - SAMBAND: rörlig nätavgift = a + b × allt elpris, anpassat på tidigare månader (januari–september: a≈15,66, b≈0,0503, största avvikelse 0,06 öre).
#     Det är ett EMPIRISKT samband i Kents data, inte ett villkor som är kontrollerat mot Kraftringens prislista.
#
# VIKTIGT i PowerShell: skriv decimaltal med PUNKT (95.12). Med decimalkomma och utan citattecken tolkar PowerShell talet som en lista
# och skickar något annat: 128,09 blev 128,9 (nollan försvann) utan felmeddelande. Provat 2026-10-08.
# Körning görs från mappen Spotpris/. Spotfilen för månaden måste finnas och vara komplett: python hamta_spotpris.py ÅÅÅÅ-MM
# Bara standardbiblioteket (plus berakna_spotpris.py i samma mapp). Ingen ES2023-motsvarighet är aktuell här (Python).
#
# UPPDATERING 2026-10-08: Första versionen. Generaliserar forutsag_spotpris.py (som har juli–september hårdkodat och inte får köras om).

import argparse
import datetime
import json
import os
import re
import sys

import berakna_spotpris as b

SKRIPT_VERSION = "1.0"
MOMS = 1.25
STANDARD_PASLAG_ORE = 1.70      # fakturorna januari–september
STANDARD_SKATT_ORE = 36.00      # fakturorna januari–september
ENEAS_JS = "../Eneas_Samkop_av_El/enea_jamforelse.js"


# ----------------------------------------------------------------------------------------------------------------
# Små hjälpare
# ----------------------------------------------------------------------------------------------------------------

def tal(s):
    """Tolkar '95,12' och '95.12' (svenskt decimalkomma) som flyttal."""
    return float(str(s).replace(" ", "").replace(",", "."))


def las(sokvag):
    with open(sokvag, encoding="utf-8") as f:
        return json.load(f)


def skriv_json(sokvag, data):
    with open(sokvag, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def foregaende_manader(manad, alla):
    return sorted(m for m in alla if m < manad)


def p_av(par):
    """Parameterdict i det format som berakna_spotpris.forbrukning() vill ha."""
    return {"bo": par["bo"], "bo_q": b.tid_till_q(par["bo"]), "pre": float(par["pre_timmar"]), "pre_q": int(round(par["pre_timmar"] * 4)),
            "prep": float(par["prep_timmar"]), "prep_q": int(round(par["prep_timmar"] * 4)), "varm": par["varm"], "V": float(par["V_kw"]),
            "ordning": (0, 0, 0)}


# ----------------------------------------------------------------------------------------------------------------
# Tidigare månaders fakturaposter (underlag för rörliga kostnader, elöverföring, fast avgift och andel varmvatten)
# ----------------------------------------------------------------------------------------------------------------

def las_tidigare(utmapp):
    """Returnerar dict månad -> fakturaposter. Källor (i den ordning de fylls på):
       data/kraftringen.json (jan–jun), data/facit_jul_sep.json + data/omanpassning_indata.json (jul–sep),
       data/utfall_*.json (månader som lagts in med --facit), och Eneas-sidans MANADER (krOre, natOre, skattOre, fastNatKr)."""
    m = {}
    for namn, v in las(os.path.join(b.DATAMAPP, "kraftringen.json"))["manader"].items():
        m.setdefault(namn, {}).update({"kwh_huvud": v["kwh_huvud"], "kwh_bastu": v["kwh_bastu"], "kwh_varm": v["kwh_varmvatten"],
                                      "spot_ore": v["spot_ore"], "rorliga_ore": v["rorliga_ore"], "paslag_ore": v["paslag_ore"]})
    sokv = os.path.join(b.DATAMAPP, "facit_jul_sep.json")
    if os.path.exists(sokv):
        for namn, v in las(sokv)["manader"].items():
            m.setdefault(namn, {}).update({"spot_ore": v["spot_ore"], "rorliga_ore": v["rorliga_ore"], "paslag_ore": v["paslag_ore"]})
    sokv = os.path.join(b.DATAMAPP, "omanpassning_indata.json")
    if os.path.exists(sokv):
        for namn, v in las(sokv)["manader"].items():
            m.setdefault(namn, {}).update({"kwh_huvud": v["kwh_huvud"], "kwh_bastu": v["kwh_bastu"], "kwh_varm": v["kwh_varmvatten"]})
    for fil in sorted(os.listdir(utmapp)) if os.path.isdir(utmapp) else []:
        if fil.startswith("utfall_") and fil.endswith(".json"):
            u = las(os.path.join(utmapp, fil))
            f, i = u["facit"], u["indata"]
            m.setdefault(u["metadata"]["manad"], {}).update({
                "kwh_huvud": i["kwh_huvud"], "kwh_bastu": i.get("kwh_bastu"), "kwh_varm": i.get("kwh_varm"),
                "spot_ore": f["spot_ore"], "rorliga_ore": f["rorliga_ore"], "paslag_ore": f["paslag_ore"]})
    if os.path.exists(ENEAS_JS):
        text = open(ENEAS_JS, encoding="utf-8").read()
        for mm in re.finditer(r"key:\s*'(\d{4}-\d{2})'[^}]*?krOre:\s*([0-9.]+),\s*natOre:\s*([0-9.]+),\s*skattOre:\s*([0-9.]+),\s*fastNatKr:\s*([0-9.]+)", text):
            m.setdefault(mm.group(1), {}).update({"allt_ore": float(mm.group(2)), "nat_ore": float(mm.group(3)),
                                                  "skatt_ore": float(mm.group(4)), "fast_kr": float(mm.group(5))})
    return m


def linjar_anpassning(x, y):
    """Minsta kvadrat: y = a + b x. Returnerar (a, b, största absoluta avvikelse)."""
    n = len(x)
    mx, my = sum(x) / n, sum(y) / n
    bb = sum((p - mx) * (q - my) for p, q in zip(x, y)) / sum((p - mx) ** 2 for p in x)
    a = my - bb * mx
    return a, bb, max(abs(q - (a + bb * p)) for p, q in zip(x, y))


# ----------------------------------------------------------------------------------------------------------------
# Del A: gissningen
# ----------------------------------------------------------------------------------------------------------------

def modellvarden(manad, intervall, kwh, andelar, modell, p_huvud, p_andra):
    """M4b-värde (öre/kWh) för en parameterkombination, plus spannet över p_andra (och över andelar om uppdelningen är antagen)."""
    def mn(andel_varm):
        if kwh.get("uppdelning") == "uppmatt":
            bastu, varm = kwh["bastu"], kwh["varm"]
        else:
            varm = round(kwh["bad"] * andel_varm)
            bastu = kwh["bad"] - varm
        return b.Manad(manad, intervall, {"kwh_huvud": kwh["huvud"], "kwh_bastu": bastu, "kwh_varmvatten": varm,
                                          "spot_ore": 0.0, "rorliga_ore": 0.0, "paslag_ore": 0.0})
    medel = sum(andelar) / len(andelar)
    punkt = b.forbrukning(mn(medel), modell, p_huvud)
    if punkt is None:
        sys.exit("Huvudparametrarna är ogiltiga för månaden (den jämna baslasten blir större än restförbrukningen). Kontrollera kWh-värdena.")
    varden = []
    for a in ([min(andelar), medel, max(andelar)] if kwh.get("uppdelning") != "uppmatt" else [medel]):
        m_a = mn(a)
        for p in [p_huvud] + p_andra:
            f = b.forbrukning(m_a, modell, p)
            if f is not None:
                varden.append(f["varde"])
    return {"punkt": punkt["varde"], "min": min(varden), "max": max(varden)}, mn(medel)


def del_a(args):
    manad, utmapp = args.manad, args.utmapp
    mal = os.path.join(utmapp, f"forutsagelse_{manad}.json")
    tidigare = las_tidigare(utmapp)
    tidiga = foregaende_manader(manad, tidigare)
    # Skydd: en gissning ska göras före facit och får inte skrivas över.
    har_facit = os.path.exists(os.path.join(utmapp, f"utfall_{manad}.json")) or (manad in tidigare and "spot_ore" in tidigare[manad])
    if har_facit and not args.retrospektivt:
        sys.exit(f"{manad} har redan facit i data/. Det blir inte en gissning i förväg. Använd --retrospektivt om det är medvetet (markeras då i filen).")
    if os.path.exists(mal) and not args.skriv_over:
        sys.exit(f"{mal} finns redan. En gissning är frusen och skrivs inte över. Vill du ändå: --skriv-over (den gamla flyttas till .gammal).")

    # kWh
    if args.bastu is not None and args.varm is not None:
        kwh = {"huvud": tal(args.huvud), "bastu": tal(args.bastu), "varm": tal(args.varm), "uppdelning": "uppmatt"}
    elif args.bad is not None:
        kwh = {"huvud": tal(args.huvud), "bad": tal(args.bad), "uppdelning": "antagen andel varmvatten"}
    else:
        sys.exit("Ange antingen --bastu och --varm (mätarställningar) eller --bad (bastu + varmvatten).")

    # Andel varmvatten av bad (tidigare månader med uppmätt uppdelning)
    andelar = [t["kwh_varm"] / (t["kwh_bastu"] + t["kwh_varm"]) for mm, t in tidigare.items()
               if mm in tidiga and t.get("kwh_bastu") and t.get("kwh_varm") is not None]
    if not andelar:
        sys.exit("Inga tidigare månader med uppdelning bastu/varmvatten hittades.")

    # Modellernas parametrar
    u1 = las(os.path.join(b.DATAMAPP, "m4b_resultat.json"))["primar"]["u1"]["parametrar"]
    omp = las(os.path.join(b.DATAMAPP, "omanpassning_resultat.json"))
    u2 = omp["frusen_ver2"]["parametrar"]
    ut = b.kor_allt(kontrollera_krore=False)
    band1 = [g["p"] for g in ut["giltiga_primar"] if g["rms"] <= ut["indata"]["sokrum"]["band_rms_max"]]
    band2 = [p_av(t["parametrar"]) for t in omp["topp5"]]
    modell = ut["modell"]

    intervall = b.ladda_spot_manad(manad)
    v1, mn = modellvarden(manad, intervall, kwh, andelar, modell, p_av(u1), band1)
    v2, _ = modellvarden(manad, intervall, kwh, andelar, modell, p_av(u2), band2)

    # Rörliga kostnader: kWh-vägt snitt och spann av tidigare månader med rörliga ore
    rl = [(t["rorliga_ore"], t["kwh_huvud"]) for mm, t in tidigare.items() if mm in tidiga and "rorliga_ore" in t and "kwh_huvud" in t]
    rorl = {"snitt": sum(a * w for a, w in rl) / sum(w for _, w in rl), "min": min(a for a, _ in rl), "max": max(a for a, _ in rl), "antal_manader": len(rl)}

    # Samband nätavgift ~ allt elpris
    sam = [(t["allt_ore"], t["nat_ore"]) for mm, t in tidigare.items() if mm in tidiga and "allt_ore" in t and "nat_ore" in t]
    if len(sam) < 3:
        sys.exit("För få månader med nätavgift i Eneas-sidans data för att anpassa sambandet.")
    a, bb, avv = linjar_anpassning([s[0] for s in sam], [s[1] for s in sam])

    # Fast nätavgift, skatt, påslag
    senaste = max(m for m in tidiga if "fast_kr" in tidigare[m])
    fast = tal(args.fast) if args.fast else tidigare[senaste]["fast_kr"]
    skatt = tal(args.skatt) if args.skatt else STANDARD_SKATT_ORE
    paslag = tal(args.paslag) if args.paslag else STANDARD_PASLAG_ORE

    def faktura(spot, rorl_ore):
        allt = spot + rorl_ore + paslag
        nat = a + bb * allt
        return allt, nat, (fast + kwh["huvud"] * (allt + nat + skatt) / 100.0) * MOMS

    def sida(v):
        allt_p, nat_p, kr_p = faktura(v["punkt"], rorl["snitt"])
        allt_lo, nat_lo, kr_lo = faktura(v["min"], rorl["min"])
        allt_hi, nat_hi, kr_hi = faktura(v["max"], rorl["max"])
        ra = lambda p, lo, hi: {"punkt": p, "min": lo, "max": hi}
        return {"spot_ore": v, "allt_elpris_ore": ra(allt_p, allt_lo, allt_hi), "eloverforing_ore": ra(nat_p, nat_lo, nat_hi),
                "faktura_kr": ra(kr_p, kr_lo, kr_hi)}

    varningar = [
        f"Påslag {paslag:.2f} öre/kWh, energiskatt {skatt:.2f} öre/kWh och fast nätavgift {fast:.0f} kr/mån är antagna oförändrade från senaste fakturan. "
        "Elhandelsavtalet gällde t.o.m. 2026-09-30. Kontrollera fakturan extra noga (se bjerred-manadsrutin, påminnelsen).",
        "Spannet för allt elpris och faktura lägger alla osäkerheter (spotspannet, rörliga kostnader) på sin lägsta resp. högsta nivå samtidigt, så det är brett.",
        f"Sambandet elöverföring = {a:.2f} + {bb:.4f} × allt elpris är anpassat på {len(sam)} månader (största avvikelse {avv:.2f} öre). Det är empiriskt, inte kontrollerat mot Kraftringens prislista.",
    ]
    if kwh["uppdelning"] != "uppmatt":
        varningar.append("Uppdelningen bastu/varmvatten är antagen (andel varmvatten av 'bad': medel " + f"{sum(andelar)/len(andelar):.3f}, spann {min(andelar):.3f}–{max(andelar):.3f}). "
                         "Verkliga mätarställningar ger säkrare gissning.")
    if args.retrospektivt:
        varningar.append("RETROSPEKTIV körning: månaden hade redan facit. Detta är inte en gissning i förväg.")

    resultat = {
        "metadata": {"manad": manad, "gjord": datetime.datetime.now().isoformat(timespec="minutes"), "skript_version": SKRIPT_VERSION,
                     "text": "Gissning gjord INNAN fakturan lästes. Frusen: ändras inte efteråt. Fel = modell minus faktura.",
                     "retrospektiv": bool(args.retrospektivt), "varningar": varningar},
        "indata": {"kwh_huvud": kwh["huvud"], "kwh_bastu": kwh.get("bastu"), "kwh_varm": kwh.get("varm"), "kwh_bad": kwh.get("bad"), "uppdelning": kwh["uppdelning"]},
        "antaganden": {"paslag_ore": paslag, "skatt_ore": skatt, "fast_nat_kr": fast, "moms": MOMS, "rorliga_ore": rorl,
                       "samband_nat": {"a": a, "b": bb, "storsta_avvikelse_ore": avv, "antal_manader": len(sam)},
                       "ver1_parametrar": u1, "ver2_parametrar": u2, "antal_i_band_ver1": len(band1), "kombinationer_i_spann_ver2": len(band2)},
        "ver1": sida(v1), "ver2": sida(v2),
        "enkla_jamforelser": {"m1_ore": mn.m1(), "m2_ore": mn.m2(),
                              "text": "M1 = medel alla kvartar, M2 = medel 06–22. Samma fakturasteg som M4b ger kr om man vill."},
    }
    for namn, r in (("m1", mn.m1()), ("m2", mn.m2())):
        allt, nat, kr = faktura(r, rorl["snitt"])
        resultat["enkla_jamforelser"][namn + "_faktura_kr"] = kr
    if os.path.exists(mal):
        os.replace(mal, mal.replace(".json", ".gammal.json"))
    skriv_json(mal, resultat)
    md = md_gissning(resultat)
    with open(os.path.join(utmapp, f"forutsagelse_{manad}.md"), "w", encoding="utf-8") as f:
        f.write(md)
    print(md)
    print(f"\nSkrivet: {mal}")


# ----------------------------------------------------------------------------------------------------------------
# Del B: facit och fel
# ----------------------------------------------------------------------------------------------------------------

def del_b(args):
    manad, utmapp = args.manad, args.utmapp
    fil = os.path.join(utmapp, f"forutsagelse_{manad}.json")
    if not os.path.exists(fil):
        sys.exit(f"{fil} saknas. Det finns ingen gissning i förväg att stämma av mot (kör Del A först).")
    g = las(fil)
    mal = os.path.join(utmapp, f"utfall_{manad}.json")
    if os.path.exists(mal) and not args.skriv_over:
        sys.exit(f"{mal} finns redan. Använd --skriv-over för att räkna om.")
    obl = {"spot": args.spot, "rorliga": args.rorliga, "natoverf": args.natoverf, "fast": args.fast, "faktura": args.faktura}
    saknas = [k for k, v in obl.items() if v is None]
    if saknas:
        sys.exit("Del B (--facit) behöver: --" + ", --".join(saknas))
    paslag = tal(args.paslag) if args.paslag else g["antaganden"]["paslag_ore"]
    skatt = tal(args.skatt) if args.skatt else g["antaganden"]["skatt_ore"]
    spot, rorl, nat = tal(args.spot), tal(args.rorliga), tal(args.natoverf)
    allt = spot + rorl + paslag
    fakt = tal(args.faktura)
    facit = {"spot_ore": spot, "rorliga_ore": rorl, "paslag_ore": paslag, "allt_elpris_ore": allt, "eloverforing_ore": nat,
             "skatt_ore": skatt, "fast_nat_kr": tal(args.fast), "faktura_kr": fakt, "kwh_faktura": tal(args.kwh_faktura) if args.kwh_faktura else None}
    # Kontrollräkna fakturan ur posterna
    kwh = facit["kwh_faktura"] or g["indata"]["kwh_huvud"]
    kontroll = (facit["fast_nat_kr"] + kwh * (allt + nat + skatt) / 100.0) * MOMS
    facit["kontrollrakning_kr"] = kontroll
    facit["kontrollrakning_avvikelse_kr"] = kontroll - fakt

    def fel(ver):
        r = {}
        for nyckel, fk in (("spot_ore", "spot_ore"), ("allt_elpris_ore", "allt_elpris_ore"), ("eloverforing_ore", "eloverforing_ore"), ("faktura_kr", "faktura_kr")):
            v = g[ver][nyckel]
            r[nyckel] = {"gissat": v["punkt"], "min": v["min"], "max": v["max"], "facit": facit[fk], "fel": v["punkt"] - facit[fk],
                         "inom_spannet": v["min"] <= facit[fk] <= v["max"]}
        return r
    resultat = {"metadata": {"manad": manad, "gjord": datetime.datetime.now().isoformat(timespec="minutes"), "skript_version": SKRIPT_VERSION,
                             "gissning_gjord": g["metadata"]["gjord"], "retrospektiv": g["metadata"]["retrospektiv"],
                             "text": "Gissning (frusen) mot facit. Fel = modell minus faktura. En månad säger lite: ver. 1 och ver. 2 jämförs först efter oktober–december."},
                "indata": g["indata"], "facit": facit, "ver1": fel("ver1"), "ver2": fel("ver2"),
                "enkla_jamforelser": {"m1_spot_fel_ore": g["enkla_jamforelser"]["m1_ore"] - spot, "m2_spot_fel_ore": g["enkla_jamforelser"]["m2_ore"] - spot}}
    skriv_json(mal, resultat)
    md = md_utfall(resultat)
    with open(os.path.join(utmapp, f"utfall_{manad}.md"), "w", encoding="utf-8") as f:
        f.write(md)
    print(md)
    print(f"\nSkrivet: {mal}")
    print("\nPÅMINNELSE: lägg också in månaden i Eneas-sidan (MANADER_JUL_SEP), Spotpris tabell 3 och källistorna enligt bjerred-manadsrutin steg 2.")


# ----------------------------------------------------------------------------------------------------------------
# Markdown-mallarna
# ----------------------------------------------------------------------------------------------------------------

def f2(x):
    return f"{x:,.2f}".replace(",", " ").replace(".", ",")


def f0(x):
    return f"{x:,.0f}".replace(",", " ")


def md_gissning(r):
    m = r["metadata"]
    rader = [("Spotpris (öre/kWh)", "spot_ore", f2), ("Allt elpris (öre/kWh)", "allt_elpris_ore", f2),
             ("Elöverföring (öre/kWh)", "eloverforing_ore", f2), ("Faktura inkl moms (kr)", "faktura_kr", f0)]
    t = [f"# Gissning för {m['manad']}", "",
         f"Gjord {m['gjord'].replace('T', ' kl ')}, innan fakturan lästes. Frusen. {'RETROSPEKTIV körning (månaden hade redan facit).' if m['retrospektiv'] else ''}", "",
         f"Underlag: {f0(r['indata']['kwh_huvud'])} kWh (huvudmätare), uppdelning bastu/varmvatten: {r['indata']['uppdelning']}.", "",
         "| Gissat | M4b ver. 1 (punkt) | spann | M4b ver. 2 (punkt) | spann | Facit |", "|---|---:|---:|---:|---:|---|"]
    for namn, nyckel, fmt in rader:
        a, c = r["ver1"][nyckel], r["ver2"][nyckel]
        t.append(f"| {namn} | {fmt(a['punkt'])} | {fmt(a['min'])}–{fmt(a['max'])} | {fmt(c['punkt'])} | {fmt(c['min'])}–{fmt(c['max'])} | _fylls i efter fakturan_ |")
    e = r["enkla_jamforelser"]
    t += ["", f"Enkla jämförelser för spotpriset: M1 {f2(e['m1_ore'])} öre/kWh, M2 {f2(e['m2_ore'])} öre/kWh (fakturabelopp: M1 {f0(e['m1_faktura_kr'])} kr, M2 {f0(e['m2_faktura_kr'])} kr).", "",
          "## Varningar och antaganden", ""] + [f"- {v}" for v in m["varningar"]]
    return "\n".join(t) + "\n"


def md_utfall(r):
    m, f = r["metadata"], r["facit"]
    rader = [("Spotpris (öre/kWh)", "spot_ore", f2), ("Allt elpris (öre/kWh)", "allt_elpris_ore", f2),
             ("Elöverföring (öre/kWh)", "eloverforing_ore", f2), ("Faktura inkl moms (kr)", "faktura_kr", f0)]
    t = [f"# Utfall för {m['manad']}: gissning mot facit", "",
         f"Gissningen gjord {m['gissning_gjord'].replace('T', ' kl ')}, facit inlagt {m['gjord'].replace('T', ' kl ')}. Fel = modell minus faktura (plus = gissade för högt).", "",
         "| | Facit | Ver. 1 gissat | Fel | Inom spannet | Ver. 2 gissat | Fel | Inom spannet |", "|---|---:|---:|---:|---|---:|---:|---|"]
    for namn, nyckel, fmt in rader:
        a, c = r["ver1"][nyckel], r["ver2"][nyckel]
        t.append(f"| {namn} | {fmt(a['facit'])} | {fmt(a['gissat'])} | {fmt(a['fel'])} | {'ja' if a['inom_spannet'] else 'nej'} | "
                 f"{fmt(c['gissat'])} | {fmt(c['fel'])} | {'ja' if c['inom_spannet'] else 'nej'} |")
    e = r["enkla_jamforelser"]
    t += ["", f"Spotpris, enkla jämförelser (fel): M1 {f2(e['m1_spot_fel_ore'])}, M2 {f2(e['m2_spot_fel_ore'])} öre/kWh.", "",
          f"Kontrollräkning av fakturan ur posterna: {f0(f['kontrollrakning_kr'])} kr mot {f0(f['faktura_kr'])} kr (avvikelse {f2(f['kontrollrakning_avvikelse_kr'])} kr). "
          "Stora avvikelser betyder att en post på fakturan har ändrats eller missats.", "",
          "En månad säger lite. Ver. 1 och ver. 2 jämförs först efter oktober, november och december."]
    return "\n".join(t) + "\n"


# ----------------------------------------------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Gissa (Del A) och stäm av (Del B) månadens faktura. Se filhuvudet.")
    ap.add_argument("manad", help="ÅÅÅÅ-MM, t.ex. 2026-10")
    ap.add_argument("--huvud", help="kWh huvudmätare för månaden")
    ap.add_argument("--bastu", help="kWh bastu (herr + dam)")
    ap.add_argument("--varm", help="kWh varmvatten")
    ap.add_argument("--bad", help="kWh bastu + varmvatten, om uppdelningen saknas")
    ap.add_argument("--paslag", help="öre/kWh, standard 1,70")
    ap.add_argument("--skatt", help="öre/kWh, standard 36,00")
    ap.add_argument("--fast", help="fast nätavgift kr/mån, standard senaste månadens")
    ap.add_argument("--retrospektivt", action="store_true", help="tillåt en gissning för en månad som redan har facit (markeras)")
    ap.add_argument("--skriv-over", action="store_true", help="skriv över en befintlig fil (den gamla sparas som .gammal.json för gissningen)")
    ap.add_argument("--utmapp", default=b.DATAMAPP, help="mapp för utdatafilerna (standard data)")
    ap.add_argument("--facit", action="store_true", help="Del B: läs in fakturans värden och räkna fel")
    ap.add_argument("--spot", help="Del B: fakturans spotpris öre/kWh")
    ap.add_argument("--rorliga", help="Del B: fakturans rörliga kostnader öre/kWh")
    ap.add_argument("--natoverf", help="Del B: elöverföring öre/kWh")
    ap.add_argument("--faktura", help="Del B: fakturabelopp inkl moms, kr")
    ap.add_argument("--kwh-faktura", help="Del B: kWh enligt fakturan (med decimaler), om den skiljer sig från mätaravläsningen")
    args = ap.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}", args.manad):
        sys.exit("Månaden ska anges som ÅÅÅÅ-MM.")
    try:
        if args.facit:
            if args.fast is None:
                sys.exit("Del B behöver --fast (fast nätavgift enligt fakturan).")
            del_b(args)
        else:
            if args.huvud is None:
                sys.exit("Del A behöver --huvud (kWh huvudmätare).")
            del_a(args)
    except b.DataFel as e:
        sys.exit(f"Dataproblem: {e}\nOm spotfilen saknas eller är ofullständig: python hamta_spotpris.py {args.manad}")


if __name__ == "__main__":
    main()
