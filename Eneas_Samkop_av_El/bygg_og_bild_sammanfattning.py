# -*- coding: utf-8 -*-
"""
bygg_og_bild_sammanfattning.py (version 1.0, SKAPAD 2026-11-06)

Bygger delningsbilden og-sammanfattning.jpg (1200 x 630 px) som visas när länken
https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/sammanfattning.html delas i LinkedIn, X (Twitter),
Facebook m.fl. (Open Graph-bild, se <meta property="og:image"> i sammanfattning.html).

Bilden jämför vad priset består av hos Kraftringen och i Eneas avtal. Alla uppgifter står på sammanfattningen
och i Tabell 5 på alternativ.html:
  - Kraftringen: spotpris, rörliga kostnader 3,2-5,1 öre/kWh och fast påslag 1,70 öre/kWh (fakturor jan-sep 2026).
  - Eneas: "Förvaltat pris" som Eneas fastställer varje månad (ingen formel i avtalet) och arvode 4 990 kr/år
    (Tjänsteavtal om samköp av el, ver. 20260609).
Staplarna är inte i skala. Ändras siffrorna på sidan: ändra dem här och kör om skriptet.

    python bygg_og_bild_sammanfattning.py

Kräver Pillow (pip install pillow) och typsnitten Segoe UI (finns i Windows). Skriptet ändrar bara bildfilen.
Inget gult används (gult är reserverat för inmatningsfält).
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
UT = HERE / "og-sammanfattning.jpg"
B, H = 1200, 630

BAKGRUND = (244, 248, 247)
TEXT = (28, 42, 42)
DAMPAD = (90, 104, 104)
MORK = (31, 95, 91)          # spotpris, sidans accentfärg
MELLAN = (63, 140, 133)      # rörliga kostnader
LJUS = (150, 196, 191)       # fast påslag
GRAA = (120, 144, 156)       # arvode
ORANGE = (217, 130, 43)      # osäkert (inte gult)
VIT = (255, 255, 255)

FETT = r"C:\Windows\Fonts\segoeuib.ttf"
VANLIG = r"C:\Windows\Fonts\segoeui.ttf"


def font(sökväg, px):
    return ImageFont.truetype(sökväg, px)


def text_mitt(d, xmitt, y, s, f, fill):
    w = d.textlength(s, font=f)
    d.text((xmitt - w / 2, y), s, font=f, fill=fill)


def streckad_ruta(d, x0, y0, x1, y1, färg, tjocklek=4, streck=16, lucka=10):
    x = x0
    while x < x1:
        d.line([(x, y0), (min(x + streck, x1), y0)], fill=färg, width=tjocklek)
        d.line([(x, y1), (min(x + streck, x1), y1)], fill=färg, width=tjocklek)
        x += streck + lucka
    y = y0
    while y < y1:
        d.line([(x0, y), (x0, min(y + streck, y1))], fill=färg, width=tjocklek)
        d.line([(x1, y), (x1, min(y + streck, y1))], fill=färg, width=tjocklek)
        y += streck + lucka


def main():
    bild = Image.new("RGB", (B, H), BAKGRUND)
    d = ImageDraw.Draw(bild)

    # Våg längst ned: kallbadhuset vid vattnet
    for lager, (färg, amp, fas) in enumerate([((205, 226, 223), 7, 0.0), ((170, 205, 200), 6, 1.4)]):
        punkter = [(x, H - 22 + lager * 8 + amp * math.sin(x / 38 + fas)) for x in range(0, B + 1, 4)]
        d.polygon(punkter + [(B, H), (0, H)], fill=färg)

    # Rubrik
    d.text((60, 30), "Vad ingår i elpriset?", font=font(FETT, 58), fill=TEXT)
    d.text((62, 102), "Elavtal för kallbadhuset i Bjärred: Kraftringen eller Eneas", font=font(VANLIG, 27), fill=DAMPAD)

    # Etikett uppe till höger
    f_et = font(FETT, 21)
    et = "Underlag, inte beslut"
    w = d.textlength(et, font=f_et)
    d.rounded_rectangle((B - 60 - w - 28, 38, B - 60, 80), radius=21, outline=MORK, width=3, fill=VIT)
    d.text((B - 60 - w - 14, 46), et, font=f_et, fill=MORK)

    botten = 540
    bredd = 400
    xk0 = 120                # Kraftringen
    xe0 = B - 120 - bredd    # Eneas
    f_box = font(FETT, 25)
    f_liten = font(VANLIG, 21)

    # --- Kraftringen: tre lager ---
    hojder = [(170, MORK, "Spotpris", "börsens pris för elen", VIT),
              (78, MELLAN, "Rörliga kostnader", "3,2–5,1 öre/kWh", VIT),
              (54, LJUS, "Fast påslag", "1,70 öre/kWh", TEXT)]
    y = botten
    for h, färg, rad1, rad2, tfärg in hojder:
        y0 = y - h
        d.rectangle((xk0, y0, xk0 + bredd, y), fill=färg, outline=VIT, width=3)
        if h >= 100:
            text_mitt(d, xk0 + bredd / 2, y0 + h / 2 - 34, rad1, f_box, tfärg)
            text_mitt(d, xk0 + bredd / 2, y0 + h / 2 + 4, rad2, f_liten, tfärg)
        else:
            text_mitt(d, xk0 + bredd / 2, y0 + h / 2 - 17, rad1 + ": " + rad2, font(FETT, 22), tfärg)
        y = y0
    topp_k = y
    text_mitt(d, xk0 + bredd / 2, topp_k - 78, "Kraftringen", font(FETT, 34), TEXT)
    text_mitt(d, xk0 + bredd / 2, topp_k - 36, "tydligt: spotpris + 4,9–6,8 öre/kWh", font(VANLIG, 22), MORK)

    # --- Eneas: arvode + "förvaltat pris" med frågetecken ---
    totalh = botten - topp_k
    h_arvode = 54
    y_arvode0 = topp_k
    d.rectangle((xe0, y_arvode0, xe0 + bredd, y_arvode0 + h_arvode), fill=GRAA, outline=VIT, width=3)
    text_mitt(d, xe0 + bredd / 2, y_arvode0 + h_arvode / 2 - 17, "Arvode: 4 990 kr/år", font(FETT, 22), VIT)
    y_f0 = y_arvode0 + h_arvode + 6
    d.rectangle((xe0, y_f0, xe0 + bredd, botten), fill=VIT)
    streckad_ruta(d, xe0 + 2, y_f0 + 2, xe0 + bredd - 2, botten - 2, ORANGE)
    text_mitt(d, xe0 + bredd / 2, y_f0 + 8, "?", font(FETT, 96), ORANGE)
    text_mitt(d, xe0 + bredd / 2, y_f0 + 118, "”Förvaltat pris”", f_box, TEXT)
    text_mitt(d, xe0 + bredd / 2, y_f0 + 152, "Eneas fastställer det", f_liten, DAMPAD)
    text_mitt(d, xe0 + bredd / 2, y_f0 + 178, "varje månad. Ingen formel", f_liten, DAMPAD)
    text_mitt(d, xe0 + bredd / 2, y_f0 + 204, "i avtalet.", f_liten, DAMPAD)
    text_mitt(d, xe0 + bredd / 2, topp_k - 78, "Eneas", font(FETT, 34), TEXT)
    text_mitt(d, xe0 + bredd / 2, topp_k - 36, "mer osäkert: formel saknas", font(VANLIG, 22), ORANGE)

    # "mot" mellan staplarna
    xm = B / 2
    ym = (topp_k + botten) / 2
    d.ellipse((xm - 34, ym - 34, xm + 34, ym + 34), fill=VIT, outline=DAMPAD, width=3)
    text_mitt(d, xm, ym - 20, "mot", font(FETT, 24), DAMPAD)

    # Källrad
    d.text((60, H - 86 + 6), "Källor: Kraftringens fakturor jan–sep 2026 · Eneas tjänsteavtal ver. 20260609. Staplarna är inte i skala.",
           font=font(VANLIG, 17), fill=DAMPAD)

    bild.save(UT, "JPEG", quality=88, optimize=True, progressive=True)
    print("Skrev", UT, UT.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    main()
