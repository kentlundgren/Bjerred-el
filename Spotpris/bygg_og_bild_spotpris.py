# -*- coding: utf-8 -*-
"""
bygg_og_bild_spotpris.py (version 1.0, SKAPAD 2026-11-06)

Bygger delningsbilden og-spotpris.jpg (1200 x 630 px) som visas när länken
https://kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html delas i LinkedIn, X (Twitter), Facebook m.fl.
(Open Graph-bild, se <meta property="og:image"> i spotpris.html).

Bilden visar blänkaren "Oktober i korthet": förutsagt allt elpris för den senaste gissade månaden mot fakturan månaden före.
Talen läses ur samma filer som sidan, så bilden och sidan stämmer:
  - data/gissningar_data.js (frusen gissning, M4b ver. 1): spotpris och allt elpris.
  - data/facit_jul_sep.json: fakturans spotpris och rörliga kostnader för månaden före (plus fast påslag 1,70 öre/kWh).
Öre/kWh utan moms, bara elhandeln. Staplarna är i samma skala.

    python bygg_og_bild_spotpris.py

Körs om när fakturan för oktober är inlagd eller när en ny månad gissats (bilden visar då ny månad), och sidans og-text i
spotpris.html behöver ändras för hand. Kräver Pillow och typsnitten Segoe UI (finns i Windows). Skriptet ändrar bara bildfilen.
Inget gult används (gult är reserverat för inmatningsfält).
"""
import datetime
import json
import math
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
UT = HERE / "og-spotpris.jpg"
B, H = 1200, 630
FAST = 1.70

BAKGRUND = (244, 248, 247)
TEXT = (28, 42, 42)
DAMPAD = (90, 104, 104)
MORK = (31, 95, 91)       # spotpris
BLA = (42, 127, 196)      # påslag
ORANGE = (217, 130, 43)   # förutsägelse (inte gult)
VIT = (255, 255, 255)

FETT = r"C:\Windows\Fonts\segoeuib.ttf"
VANLIG = r"C:\Windows\Fonts\segoeui.ttf"
MAN = {1: "Januari", 2: "Februari", 3: "Mars", 4: "April", 5: "Maj", 6: "Juni", 7: "Juli", 8: "Augusti",
       9: "September", 10: "Oktober", 11: "November", 12: "December"}


def sv(x, d=2):
    return f"{x:.{d}f}".replace(".", ",")


def font(sokvag, px):
    return ImageFont.truetype(sokvag, px)


def mitt(d, xm, y, s, f, fill):
    w = d.textlength(s, font=f)
    d.text((xm - w / 2, y), s, font=f, fill=fill)


def las_data():
    g = (HERE / "data" / "gissningar_data.js").read_text(encoding="utf-8")
    g = json.loads(re.search(r"window\.GISSNINGAR\s*=\s*(\{.*\})\s*;", g, re.S).group(1))
    m = sorted(g["manader"])[-1]
    gm = g["manader"][m]
    ar, mn = int(m[:4]), int(m[5:7])
    fd = datetime.date(ar, mn, 1) - datetime.timedelta(days=1)
    fm = f"{fd.year}-{fd.month:02d}"
    facit = json.loads((HERE / "data" / "facit_jul_sep.json").read_text(encoding="utf-8"))
    ff = (facit.get("manader") or facit)[fm]
    return {
        "ny_namn": f"{MAN[mn]} {ar}", "ny_spot": gm["ver1"]["spot_ore"], "ny_tot": gm["ver1"]["allt_elpris_ore"], "gjord": gm["gjord"][:10],
        "fore_namn": f"{MAN[fd.month]} {fd.year}", "fore_spot": ff["spot_ore"], "fore_pas": ff["rorliga_ore"] + FAST,
    }


def stapel(d, x0, bredd, botten, skala, spot, pas, streckad):
    hs, hp = spot * skala, pas * skala
    d.rectangle((x0, botten - hs, x0 + bredd, botten), fill=MORK)
    d.rectangle((x0, botten - hs - hp, x0 + bredd, botten - hs), fill=BLA)
    if streckad:
        topp, vanster, hoger = botten - hs - hp, x0, x0 + bredd
        x = vanster
        while x < hoger:
            d.line([(x, topp), (min(x + 14, hoger), topp)], fill=ORANGE, width=4)
            x += 22
        y = topp
        while y < botten:
            for xx in (vanster, hoger):
                d.line([(xx, y), (xx, min(y + 14, botten))], fill=ORANGE, width=4)
            y += 22
    return botten - hs - hp


def main():
    v = las_data()
    ny_pas = v["ny_tot"] - v["ny_spot"]
    fore_tot = v["fore_spot"] + v["fore_pas"]
    bild = Image.new("RGB", (B, H), BAKGRUND)
    d = ImageDraw.Draw(bild)

    for lager, (farg, amp, fas) in enumerate([((205, 226, 223), 7, 0.0), ((170, 205, 200), 6, 1.4)]):
        pkt = [(x, H - 22 + lager * 8 + amp * math.sin(x / 38 + fas)) for x in range(0, B + 1, 4)]
        d.polygon(pkt + [(B, H), (0, H)], fill=farg)

    d.text((60, 28), f"Elpriset: {v['ny_namn'].split()[0].lower()} mot {v['fore_namn'].split()[0].lower()}", font=font(FETT, 46), fill=TEXT)
    d.text((62, 98), "Elområde SE4, kallbadhuset i Bjärred · öre per kWh, utan moms, bara elhandeln", font=font(VANLIG, 25), fill=DAMPAD)

    f_et = font(FETT, 21)
    et = "Förutsägelse före fakturan"
    w = d.textlength(et, font=f_et)
    d.rounded_rectangle((B - 60 - w - 28, 36, B - 60, 78), radius=21, outline=ORANGE, width=3, fill=VIT)
    d.text((B - 60 - w - 14, 44), et, font=f_et, fill=ORANGE)

    botten, hojd_max, bredd = 528, 270, 250
    skala = hojd_max / max(v["ny_tot"], fore_tot)
    x_fore, x_ny = 190, 760
    t1 = stapel(d, x_fore, bredd, botten, skala, v["fore_spot"], v["fore_pas"], False)
    t2 = stapel(d, x_ny, bredd, botten, skala, v["ny_spot"], ny_pas, True)

    for x0, topp, tot, spot, pas, namn, sub in ((x_fore, t1, fore_tot, v["fore_spot"], v["fore_pas"], v["fore_namn"], "faktura"),
                                                 (x_ny, t2, v["ny_tot"], v["ny_spot"], ny_pas, v["ny_namn"], "förutsagt")):
        xm = x0 + bredd / 2
        mitt(d, xm, topp - 106, sv(tot), font(FETT, 58), TEXT)
        mitt(d, xm, topp - 38, f"spotpris {sv(spot)} + påslag {sv(pas)}", font(VANLIG, 22), DAMPAD)
        mitt(d, xm, botten + 6, f"{namn}, {sub}", font(FETT, 22), TEXT)

    # skillnad mellan staplarna
    dt = v["ny_tot"] - fore_tot
    xm, ym = (x_fore + bredd + x_ny) / 2, (min(t1, t2) + botten) / 2
    pill = f"{'+' if dt >= 0 else '−'}{sv(abs(dt))} öre"
    f_p = font(FETT, 30)
    w = d.textlength(pill, font=f_p)
    d.rounded_rectangle((xm - w / 2 - 22, ym - 28, xm + w / 2 + 22, ym + 28), radius=28, fill=VIT, outline=MORK, width=3)
    d.text((xm - w / 2, ym - 24), pill, font=f_p, fill=MORK)
    mitt(d, xm, ym + 36, f"({'+' if dt >= 0 else '−'}{abs(dt / fore_tot * 100):.0f} %)", font(VANLIG, 24), DAMPAD)

    d.text((60, H - 56), f"Källor: elprisetjustnu.se, Kraftringens fakturor, modellen M4b (gissning gjord {v['gjord']}). Påslag = rörliga kostnader + fast {sv(FAST)}. Staplarna är i samma skala.",
           font=font(VANLIG, 16), fill=DAMPAD)

    bild.save(UT, "JPEG", quality=88, optimize=True, progressive=True)
    print("Skrev", UT, UT.stat().st_size // 1024, "kB", "|", v["ny_namn"], sv(v["ny_tot"]), "mot", v["fore_namn"], sv(fore_tot), "| skillnad", sv(dt))


if __name__ == "__main__":
    main()
