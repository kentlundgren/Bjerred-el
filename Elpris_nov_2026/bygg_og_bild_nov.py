# -*- coding: utf-8 -*-
"""
bygg_og_bild_nov.py (version 1.0, SKAPAD 2026-11-10)

Bygger delningsbilden og-elpris-nov.jpg (1200 x 630 px) för sidan Elpris_nov_2026/index.html. Bilden visar spotpriset i SE4
hittills i november (328,89 öre/kWh, tio dagar) mot oktober (157,30 öre/kWh). Siffrorna kommer från elbruk.se (se sidan).

    python bygg_og_bild_nov.py

Kräver Pillow och typsnittet Segoe UI (Windows). Ändrar bara bildfilen. Ingen gul färg används.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
UT = HERE / "og-elpris-nov.jpg"
B, H = 1200, 630

OKT_ORE = 157.30
NOV_ORE = 328.89

BAKGRUND = (31, 45, 60)
BAKGRUND_2 = (22, 32, 44)
LJUS = (236, 240, 241)
DAMPAD = (170, 183, 195)
BLA = (86, 160, 220)
ROD = (231, 76, 60)

FONT_FETT = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_VANLIG = r"C:\Windows\Fonts\segoeui.ttf"


def font(s, fet=False):
    return ImageFont.truetype(FONT_FETT if fet else FONT_VANLIG, s)


def fmt(x):
    return ("%.2f" % x).replace(".", ",")


def main():
    bild = Image.new("RGB", (B, H), BAKGRUND)
    d = ImageDraw.Draw(bild)
    for y in range(H):
        t = y / H
        d.line([(0, y), (B, y)], fill=tuple(int(BAKGRUND[i] * (1 - t) + BAKGRUND_2[i] * t) for i in range(3)))

    # Rubrik
    d.text((60, 40), "Elpriset i november", font=font(60, True), fill=LJUS)
    d.text((60, 118), "Spotpris SE4, öre/kWh, hittills i november (10 dagar)", font=font(28), fill=DAMPAD)

    # Staplar
    botten = 520
    topp = 235
    hogsta = NOV_ORE
    skala = (botten - topp) / hogsta
    bredd = 250
    x_okt, x_nov = 110, 450
    h_okt, h_nov = OKT_ORE * skala, NOV_ORE * skala
    d.rectangle([x_okt, botten - h_okt, x_okt + bredd, botten], fill=BLA)
    d.rectangle([x_nov, botten - h_nov, x_nov + bredd, botten], fill=ROD)
    d.text((x_okt + bredd / 2, botten - h_okt - 14), fmt(OKT_ORE), font=font(46, True), fill=LJUS, anchor="ms")
    d.text((x_nov + bredd / 2, botten - h_nov - 14), fmt(NOV_ORE), font=font(52, True), fill=LJUS, anchor="ms")
    d.text((x_okt + bredd / 2, botten + 14), "Oktober", font=font(30), fill=DAMPAD, anchor="mt")
    d.text((x_nov + bredd / 2, botten + 14), "November, 1–10", font=font(30), fill=DAMPAD, anchor="mt")

    # Poängen till höger
    d.text((760, 240), "Drygt", font=font(42), fill=LJUS)
    d.text((760, 286), "dubbelt så högt", font=font(50, True), fill=LJUS)
    d.text((760, 350), "som i oktober", font=font(42), fill=LJUS)
    d.text((760, 440), "Tio dagar har räckt för att", font=font(28), fill=DAMPAD)
    d.text((760, 478), "dra upp månadens snitt.", font=font(28), fill=DAMPAD)

    d.text((60, 592), "Bjerreds Saltsjöbad  ·  Kent Lundgren  ·  Källa: elbruk.se (spotpris utan moms)", font=font(22), fill=DAMPAD)
    bild.save(UT, "JPEG", quality=88, optimize=True)
    print("Skrev", UT, UT.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    main()
