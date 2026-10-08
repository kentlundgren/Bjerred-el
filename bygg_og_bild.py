# -*- coding: utf-8 -*-
"""
bygg_og_bild.py (version 1.0, SKAPAD 2026-10-09)

Bygger delningsbilden images/elforbrukning-og.png (1200 x 630 px) som visas när länken
https://kentlundgren.github.io/Bjerred-el/index.html delas i Facebook, LinkedIn, X (Twitter), Messenger m.fl.
(Open Graph-bild, se <meta property="og:image"> i index.html.)

Bilden innehåller bara titel och en dekorativ kurva ritad av månadsvärdena (totalKWh) i index.html.
Den innehåller inga siffror eller datum i text, så den behöver INTE göras om varje månad.
Kör skriptet bara om du vill ha en uppdaterad kurva eller ett nytt utseende:

    python bygg_og_bild.py

Kräver Pillow (pip install pillow) och typsnitten Segoe UI (finns i Windows).
Ingen ES2023 eller annat webbspråk berörs. Skriptet ändrar bara bildfilen.
"""
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
UT = HERE / "images" / "elforbrukning-og.png"
B, H = 1200, 630

# Färger hämtade från sidans menyfält och rubriker (mörkblått, blått, ljus text). Inget gult.
BAKGRUND = (44, 62, 80)
BAKGRUND_2 = (31, 45, 60)
BLA = (52, 152, 219)
LJUS = (236, 240, 241)
DAMPAD = (170, 183, 195)

FONT_FETT = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_VANLIG = r"C:\Windows\Fonts\segoeui.ttf"


def hamta_kwh():
    """Läser månadsvärdena (totalKWh) ur monthlyData i index.html. Rader utan fullMonth hoppas över."""
    text = (HERE / "index.html").read_text(encoding="utf-8")
    varden = [int(m.group(1)) for m in re.finditer(r'month:\s*"[^"]+",\s*fullMonth:[^}]*?totalKWh:\s*(\d+)', text)]
    if len(varden) < 12:
        sys.exit("Hittade för få månadsvärden i index.html (" + str(len(varden)) + ").")
    return varden


def main():
    kwh = hamta_kwh()
    bild = Image.new("RGB", (B, H), BAKGRUND)
    d = ImageDraw.Draw(bild)

    # Svag övertoning: mörkare mot botten
    for y in range(H):
        t = y / H
        rad = tuple(int(BAKGRUND[i] * (1 - t) + BAKGRUND_2[i] * t) for i in range(3))
        d.line([(0, y), (B, y)], fill=rad)

    # Kurvan: fyller nederdelen av bilden
    x0, x1 = 60, B - 60
    y_topp, y_botten = 330, H - 70
    lo, hi = min(kwh) * 0.9, max(kwh) * 1.05
    punkter = []
    for i, v in enumerate(kwh):
        x = x0 + (x1 - x0) * i / (len(kwh) - 1)
        y = y_botten - (y_botten - y_topp) * (v - lo) / (hi - lo)
        punkter.append((x, y))
    # Ifylld yta under kurvan (halvgenomskinlig blå)
    lager = Image.new("RGBA", (B, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lager)
    ld.polygon(punkter + [(x1, y_botten), (x0, y_botten)], fill=BLA + (70,))
    bild = Image.alpha_composite(bild.convert("RGBA"), lager).convert("RGB")
    d = ImageDraw.Draw(bild)
    d.line(punkter, fill=BLA, width=6, joint="curve")
    px, py = punkter[-1]
    d.ellipse([px - 11, py - 11, px + 11, py + 11], fill=LJUS, outline=BLA, width=5)
    d.line([(x0, y_botten + 12), (x1, y_botten + 12)], fill=(90, 108, 126), width=2)

    # Text
    f_stor = ImageFont.truetype(FONT_FETT, 78)
    f_mellan = ImageFont.truetype(FONT_VANLIG, 40)
    f_liten = ImageFont.truetype(FONT_VANLIG, 28)
    d.text((60, 60), "Elförbrukning", font=f_stor, fill=LJUS)
    d.text((60, 160), "Bjerreds Saltsjöbad", font=f_stor, fill=BLA)
    d.text((62, 262), "Månad för månad, kostnad och Månadens flash", font=f_mellan, fill=DAMPAD)
    d.text((B - 60, H - 48), "kentlundgren.github.io/Bjerred-el", font=f_liten, fill=DAMPAD, anchor="ra")

    UT.parent.mkdir(exist_ok=True)
    bild.save(UT, optimize=True)
    print("Sparade", UT, bild.size, UT.stat().st_size, "byte; månader:", len(kwh))


if __name__ == "__main__":
    main()
