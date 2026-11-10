# -*- coding: utf-8 -*-
"""
bygg_og_bild_nov_kort.py (version 1.0, SKAPAD 2026-11-10)

Bygger delningsbilden og-elpris-nov-kort.jpg (1200 x 630 px) för sidan Elpris_nov_2026_kort/index.html. Bilden är slutläget av sidans
animerade diagram: spotpriset i SE4 januari–november 2026, rekordlinjen för augusti 2022 (304,99) och novemberstapeln (328,89, dag 1–10).
Siffrorna kommer från elbruk.se (se sidan).

    python bygg_og_bild_nov_kort.py

Kräver Pillow och typsnittet Segoe UI (Windows). Ändrar bara bildfilen. Ingen gul färg används.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
UT = HERE / "og-elpris-nov-kort.jpg"
B, H = 1200, 630

SE4 = [112.99, 113.28, 84.58, 66.55, 94.66, 103.72, 86.44, 80.47, 120.20, 157.30, 328.89]
KORT = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov"]
REKORD = 304.99

BAKGRUND = (31, 45, 60)
BAKGRUND_2 = (22, 32, 44)
LJUS = (236, 240, 241)
DAMPAD = (170, 183, 195)
RUTNAT = (58, 74, 92)
BLA = (86, 160, 220)
ROD = (231, 76, 60)

FONT_FETT = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_VANLIG = r"C:\Windows\Fonts\segoeui.ttf"


def font(s, fet=False):
    return ImageFont.truetype(FONT_FETT if fet else FONT_VANLIG, s)


def fmt(x):
    return ("%.2f" % x).replace(".", ",")


def streckad(d, x0, x1, y, farg, bredd=3, streck=14, mellan=9):
    x = x0
    while x < x1:
        d.line([(x, y), (min(x + streck, x1), y)], fill=farg, width=bredd)
        x += streck + mellan


def main():
    bild = Image.new("RGB", (B, H), BAKGRUND)
    d = ImageDraw.Draw(bild)
    for y in range(H):
        t = y / H
        d.line([(0, y), (B, y)], fill=tuple(int(BAKGRUND[i] * (1 - t) + BAKGRUND_2[i] * t) for i in range(3)))

    d.text((60, 30), "Elpriset i SE4, månad för månad", font=font(50, True), fill=LJUS)
    d.text((60, 92), "Spotpris, öre/kWh, 2026", font=font(26), fill=DAMPAD)

    # Diagramyta
    x0, x1 = 100, 1140
    y_botten, y_topp = 535, 160
    maxv = 350.0

    def y_av(v):
        return y_botten - v / maxv * (y_botten - y_topp)

    for v in (0, 100, 200, 300):
        y = y_av(v)
        d.line([(x0, y), (x1, y)], fill=RUTNAT, width=1)
        d.text((x0 - 10, y), str(v), font=font(20), fill=DAMPAD, anchor="rm")

    n = len(SE4)
    steg = (x1 - x0) / n
    bw = steg * 0.62
    for i, v in enumerate(SE4):
        cx = x0 + steg * i + steg / 2
        nov = i == n - 1
        d.rectangle([cx - bw / 2, y_av(v), cx + bw / 2, y_botten], fill=ROD if nov else BLA)
        d.text((cx, y_botten + 10), KORT[i], font=font(22), fill=LJUS, anchor="mt")
        if nov:
            d.text((cx, y_av(v) - 8), fmt(v), font=font(40, True), fill=ROD, anchor="ms")
        elif i == n - 2:
            d.text((cx, y_av(v) - 8), fmt(v), font=font(22), fill=LJUS, anchor="ms")
    d.text((x0 + steg * (n - 1) + steg / 2, y_botten + 36), "dag 1–10", font=font(18), fill=ROD, anchor="mt")

    # Rekordlinjen (augusti 2022)
    yr = y_av(REKORD)
    streckad(d, x0, x1, yr, ROD)
    d.text((x0 + 8, yr - 6), "Rekord: augusti 2022, " + fmt(REKORD) + " öre/kWh", font=font(24, True), fill=ROD, anchor="ls")

    # Poängen i tomrummet ovanför de blå staplarna
    d.text((x0 + 20, 340), "Rekordhögt", font=font(76, True), fill=LJUS, anchor="ls")
    d.text((x0 + 22, 390), "redan efter tio dagar i november", font=font(34), fill=DAMPAD, anchor="ls")

    d.text((60, 596), "Bjerreds Saltsjöbad  ·  Kent Lundgren  ·  Källa: elbruk.se (spotpris SE4, utan moms)", font=font(21), fill=DAMPAD)
    bild.save(UT, "JPEG", quality=88, optimize=True)
    print("Skrev", UT, UT.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    main()
