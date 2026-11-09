# bygg_gissningar_data.py
# Samlar de frusna gissningarna för månader efter blindprovet (oktober 2026 och senare) till data/gissningar_data.js,
# som spotpris.html laddar för att visa en rad per månad i Tabell 3.
#
#   python bygg_gissningar_data.py
#
# Läser data/forutsagelse_ÅÅÅÅ-MM.json (skrivna av forutsag_manad.py, Del A) för månader från och med 2026-10 och skriver
# window.GISSNINGAR. Filen innehåller bara det som redan står i de frusna gissningarna. Den ändrar inte gissningarna och rör
# inte blindprovet juli–september (data/forutsagelse_data.js, som skrivs av forutsag_spotpris.py och inte ska köras om).
# Bara standardbiblioteket.
#
# UPPDATERING 2026-11-06: Första versionen (1.0). Oktober 2026.
# UPPDATERING 2026-11-09: Versionen 1.1 läser också data/utfall_ÅÅÅÅ-MM.json (skrivs av forutsag_manad.py --facit, Del B) och lägger fakturans
#   värden (spot, rörliga kostnader, påslag, kWh) som "facit" på månaden, så att de gula fälten i Tabell 3 fylls i utan inmatning.
#   Kör skriptet igen varje gång en ny faktura har lagts in med forutsag_manad.py --facit.

import glob
import json
import os
import re

DATAMAPP = "data"
FORSTA_MANAD = "2026-10"


def las(sokvag):
    with open(sokvag, encoding="utf-8") as f:
        return json.load(f)


def rad(ver):
    return {"spot_ore": ver["spot_ore"]["punkt"], "spann_min_ore": ver["spot_ore"]["min"], "spann_max_ore": ver["spot_ore"]["max"],
            "allt_elpris_ore": ver["allt_elpris_ore"]["punkt"], "allt_min_ore": ver["allt_elpris_ore"]["min"], "allt_max_ore": ver["allt_elpris_ore"]["max"],
            "faktura_kr": ver["faktura_kr"]["punkt"], "faktura_min_kr": ver["faktura_kr"]["min"], "faktura_max_kr": ver["faktura_kr"]["max"]}


def main():
    manader = {}
    for fil in sorted(glob.glob(os.path.join(DATAMAPP, "forutsagelse_????-??.json"))):
        m = re.search(r"forutsagelse_(\d{4}-\d{2})\.json$", fil).group(1)
        if m < FORSTA_MANAD:
            continue
        r = las(fil)
        manader[m] = {
            "gjord": r["metadata"]["gjord"],
            "retrospektiv": r["metadata"].get("retrospektiv", False),
            "kwh_huvud": r["indata"]["kwh_huvud"],
            "ver1": rad(r["ver1"]),
            "ver2": rad(r["ver2"]),
            "rorliga": {"snitt_ore": r["antaganden"]["rorliga_ore"]["snitt"], "min_ore": r["antaganden"]["rorliga_ore"]["min"],
                        "max_ore": r["antaganden"]["rorliga_ore"]["max"]},
            "m1_ore": r["enkla_jamforelser"]["m1_ore"],
            "m2_ore": r["enkla_jamforelser"]["m2_ore"],
        }
        # UPPDATERING 2026-11-09: fakturans värden, om utfallsfilen finns (Del B är gjord)
        utf = os.path.join(DATAMAPP, "utfall_" + m + ".json")
        if os.path.exists(utf):
            fa = las(utf)["facit"]
            manader[m]["facit"] = {"spot_ore": fa["spot_ore"], "rorliga_ore": fa["rorliga_ore"], "paslag_ore": fa["paslag_ore"],
                                   "kwh_faktura": fa.get("kwh_faktura"), "faktura_kr": fa.get("faktura_kr")}
    ut = os.path.join(DATAMAPP, "gissningar_data.js")
    with open(ut, "w", encoding="utf-8") as f:
        f.write("// Skapad av bygg_gissningar_data.py ur data/forutsagelse_*.json. Frusna gissningar gjorda innan fakturorna lästes.\n")
        f.write("window.GISSNINGAR = " + json.dumps({"manader": manader}, ensure_ascii=False, indent=1) + ";\n")
    print("Skrev", ut, "med", ", ".join(manader) or "inga månader")


if __name__ == "__main__":
    main()
