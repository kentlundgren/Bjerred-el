# hamta_spotpris.py
# Hämtar spotpriser för elområde SE4 dygn för dygn från elprisetjustnu.se, kontrollerar dem och skriver
# data/spot_SE4_ÅÅÅÅ-MM.json (en fil per månad). Enligt Spotpris/SPEC.md avsnitt 2, 3.1, 3.4 och 11 (PRD F1, F2).
#
# Körning (från mappen Spotpris/, i PowerShell):
#     python hamta_spotpris.py                 hämtar månaderna i data/kraftringen.json (hoppar över filer som redan finns)
#     python hamta_spotpris.py 2026-07 2026-08 hämtar angivna månader
#     python hamta_spotpris.py --om            hämtar om även om filen finns
#
# Källa: https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE4.json
# Priserna är utan moms, tillägg och skatter. Källan ska anges vid offentlig visning (se PRD, källförteckningen).
# Bara standardbiblioteket används (ingen kod som kräver paket).
#
# UPPDATERING 2026-10-07: Första versionen (1.0).

import datetime
import json
import os
import sys
import time
import urllib.request
import concurrent.futures as cf

SKRIPT_VERSION = "1.0"
OMRADE = "SE4"
URL_MONSTER = "https://www.elprisetjustnu.se/api/v1/prices/{y}/{m:02d}-{d:02d}_SE4.json"
KVARTSOVERGANG = datetime.date(2025, 10, 1)      # från och med detta datum är intervallen 15 minuter
DATAMAPP = "data"


class DataFel(Exception):
    """Fel i spotdata eller indata. Körningen avbryts (SPEC avsnitt 11)."""


def sista_sondag(ar, manad):
    """Datum för sista söndagen i månaden (sommartidens byte sker då)."""
    dag = datetime.date(ar + (manad // 12), (manad % 12) + 1, 1) - datetime.timedelta(days=1)
    while dag.weekday() != 6:
        dag -= datetime.timedelta(days=1)
    return dag


def tillatna_antal(datum, upplosning_min):
    """Tillåtet antal intervall för ett dygn.
    Kvartsupplösning: 96, 92 (sista söndagen i mars) eller 100 (sista söndagen i oktober).
    Timupplösning (före 2025-10-01): 24 (23 och 25 vid sommartid). SPEC anger bara 24 för timmar;
    23 och 25 vid sommartid är en självklar utökning som SPEC bör kompletteras med."""
    if upplosning_min == 15:
        if datum == sista_sondag(datum.year, 3):
            return {92}
        if datum == sista_sondag(datum.year, 10):
            return {100}
        return {96}
    else:
        if datum == sista_sondag(datum.year, 3):
            return {23}
        if datum == sista_sondag(datum.year, 10):
            return {25}
        return {24}


def upplosning_min(intervall):
    """Intervallets längd i minuter, ur start och slut."""
    a = datetime.datetime.fromisoformat(intervall["start"])
    b = datetime.datetime.fromisoformat(intervall["slut"])
    return int(round((b - a).total_seconds() / 60))


def kontrollera_dygn(datum, intervall):
    """Kontrollerar ett dygns intervall. Kastar DataFel vid avvikelse."""
    if not intervall:
        raise DataFel(f"Inga intervall för {datum}")
    upplosningar = {upplosning_min(i) for i in intervall}
    if len(upplosningar) != 1 or upplosningar.pop() not in (15, 60):
        raise DataFel(f"Blandad eller ovanlig upplösning för {datum}")
    u = upplosning_min(intervall[0])
    forvantat = (u == 15) == (datum >= KVARTSOVERGANG)
    if not forvantat:
        raise DataFel(f"Upplösningen {u} min stämmer inte med datumet {datum} (kvartsövergång {KVARTSOVERGANG})")
    if len(intervall) not in tillatna_antal(datum, u):
        raise DataFel(f"{datum}: {len(intervall)} intervall, tillåtet {sorted(tillatna_antal(datum, u))}")
    starter = [i["start"] for i in intervall]
    if starter != sorted(starter) or len(set(starter)) != len(starter):
        raise DataFel(f"{datum}: intervallen är inte sorterade eller har dubbletter")
    if any(i["start"][:10] != datum.isoformat() for i in intervall):
        raise DataFel(f"{datum}: intervall med fel datum")


def hamta_dygn(datum, forsok=3):
    """Hämtar ett dygn. Tre försök med kort paus. Returnerar listan eller kastar DataFel."""
    url = URL_MONSTER.format(y=datum.year, m=datum.month, d=datum.day)
    senaste = None
    for n in range(forsok):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as svar:
                return json.loads(svar.read().decode("utf-8"))
        except Exception as e:                      # nätverks- eller tolkningsfel: nytt försök
            senaste = e
            time.sleep(1.0 + n)
    raise DataFel(f"Kunde inte hämta {datum} efter {forsok} försök: {senaste}")


def dagar_i_manad(manad):
    ar, m = int(manad[:4]), int(manad[5:7])
    d = datetime.date(ar, m, 1)
    ut = []
    while d.month == m:
        ut.append(d)
        d += datetime.timedelta(days=1)
    return ut


def hamta_manad(manad, datamapp=DATAMAPP, om=False):
    """Hämtar och skriver en månad. Ingen del av en månad skrivs om något dygn saknas eller är fel."""
    fil = os.path.join(datamapp, f"spot_{OMRADE}_{manad}.json")
    if os.path.exists(fil) and not om:
        print(f"{manad}: finns redan ({fil}), hoppar över (använd --om för att hämta om)")
        return fil
    dagar = dagar_i_manad(manad)
    with cf.ThreadPoolExecutor(6) as ex:
        resultat = list(ex.map(lambda d: (d, _forsok(d)), dagar))
    fel = [str(d) for d, r in resultat if isinstance(r, DataFel)]
    if fel:
        raise DataFel(f"{manad}: kunde inte hämta dygnen {', '.join(fel)}. Ingen fil skrevs.")
    alla = []
    per_dygn = {}
    for d, rader in resultat:
        intervall = [{
            "start": r["time_start"], "slut": r["time_end"],
            "sek_per_kwh": r["SEK_per_kWh"], "eur_per_kwh": r["EUR_per_kWh"], "exr": r["EXR"],
        } for r in rader]
        kontrollera_dygn(d, intervall)
        per_dygn[d.isoformat()] = len(intervall)
        alla.extend(intervall)
    avvikelser = [f"{k}: {n} intervall" for k, n in per_dygn.items() if n not in (96, 24)]
    innehall = {
        "metadata": {
            "omrade": OMRADE, "kalla": "elprisetjustnu.se", "url_monster": URL_MONSTER.replace("{y}", "ÅÅÅÅ").replace("{m:02d}", "MM").replace("{d:02d}", "DD"),
            "hamtad": datetime.date.today().isoformat(), "skript_version": SKRIPT_VERSION,
            "antal_dygn": len(dagar), "antal_intervall": len(alla),
            "intervall_per_dygn": per_dygn, "avvikelser": avvikelser,
            "anmarkning": "Priser utan moms, tillägg och skatter. sek_per_kwh är elbörsens pris omräknat till SEK/kWh.",
        },
        "intervall": alla,
    }
    os.makedirs(datamapp, exist_ok=True)
    with open(fil, "w", encoding="utf-8") as f:
        json.dump(innehall, f, ensure_ascii=False, indent=1)
    print(f"{manad}: {len(dagar)} dygn, {len(alla)} intervall, avvikelser: {avvikelser or 'inga'} -> {fil}")
    return fil


def _forsok(d):
    try:
        return hamta_dygn(d)
    except DataFel as e:
        return e


def manader_ur_kraftringen(datamapp=DATAMAPP):
    with open(os.path.join(datamapp, "kraftringen.json"), encoding="utf-8") as f:
        return sorted(json.load(f)["manader"].keys())


def main(argv):
    om = "--om" in argv
    manader = [a for a in argv if not a.startswith("--")] or manader_ur_kraftringen()
    for m in manader:
        hamta_manad(m, om=om)


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except DataFel as e:
        print("AVBRUTET:", e)
        sys.exit(1)
