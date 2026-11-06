# -*- coding: utf-8 -*-
"""
bygg_diagram_paslag.py (version 1.1, SKAPAD 2026-11-06)

Räknar ut och ritar Diagram 2 i alternativ.html: totalt påslag över spotpris januari–juni 2026, Kraftringen mot Eneas
(Eneas inklusive arvode). Diagrammet skrivs som inbäddad SVG mellan markeringarna
<!-- diagram2:start --> och <!-- diagram2:slut --> i alternativ.html.

    python bygg_diagram_paslag.py

Indata (öre/kWh exklusive moms om inget annat anges):
  - Förbrukning (kWh), spotpris och rörliga kostnader per månad: Kraftringens fakturor jan–jun 2026 (raderna för elhandel).
  - Fast påslag Kraftringen: 1,70 öre/kWh.
  - Eneas pris per månad: det pris som är inlagt i jämförelsen (enea_jamforelse.js, uppgifter ur Isak Cerwéns mejl 2026-10-07).
  - Eneas arvode: 415,83 kr/månad exkl. moms (4 990 kr/år), fördelat på månadens förbrukning.
Definitioner:
  - Totalt påslag över spotpris, Kraftringen = rörliga kostnader + fast påslag.
  - Totalt påslag över spotpris, Eneas = Eneas pris minus spotpriset på Kraftringens faktura + arvode per kWh
    (en approximation, se bildtexten).
  - Alla medelvärden är viktade med förbrukningen (kWh).
Inget gult används (gult är reserverat för inmatningsfält).
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
MAL = HERE / "alternativ.html"

MANADER = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun"]
KWH = [35422.14, 32002.14, 28073.52, 26671.14, 23941.02, 20609.34]
SPOT = [117.38, 116.68, 86.59, 63.12, 88.19, 100.09]
ROR = [3.16, 3.18, 4.58, 3.47, 5.11, 4.66]
FAST = 1.70
ENEAS = [111.65, 113.62, 91.79, 69.32, 89.75, 104.15]
ARVODE_KR_MAN = 415.83

KR_FARG = "#1f5f5b"
KR_MELLAN = "#3f8c85"
KR_LJUS = "#96c4bf"
EN_FARG = "#2a7fc4"
EN_LJUS = "#a9cdea"
TEXT = "#1c2a2a"
DAMPAD = "#5a6868"
RUTNAT = "#d6dedc"


def sv(x, d=2):
    """Svensk decimalkomma, minustecken som '−'."""
    s = f"{abs(x):.{d}f}".replace(".", ",")
    return ("−" if x < 0 and float(f"{abs(x):.{d}f}") != 0 else "") + s


def kr(x):
    return f"{round(x):,}".replace(",", " ")


def berakna():
    K = sum(KWH)
    v = lambda xs: sum(x * k for x, k in zip(xs, KWH)) / K
    kr_pas = [r + FAST for r in ROR]
    en_over_spot = [e - s for e, s in zip(ENEAS, SPOT)]
    arv_ore_man = [ARVODE_KR_MAN * 100 / k for k in KWH]       # arvode per kWh, per månad
    en_tot = [a + b for a, b in zip(en_over_spot, arv_ore_man)]
    res = dict(K=K, kr_pas=kr_pas, en_tot=en_tot, en_over_spot=en_over_spot,
               kr_snitt=v(kr_pas), ror_snitt=v(ROR), en_over_snitt=v(en_over_spot),
               arvode_ore=ARVODE_KR_MAN * 6 / K * 100)
    res["en_snitt"] = v(en_tot)
    res["skillnad"] = res["kr_snitt"] - res["en_snitt"]
    res["kr_skillnad"] = res["skillnad"] * K / 100
    res["kr_skillnad_moms"] = res["kr_skillnad"] * 1.25
    netto = [(a - b) * k / 100 for a, b, k in zip(kr_pas, en_tot, KWH)]   # kr exkl moms per månad, efter arvode
    res["netto"] = netto
    res["jan_feb_andel"] = sum(netto[:2]) / sum(netto)
    return res


def rita(r):
    W = 640
    H = 600
    o = []
    a = o.append
    a(f'<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="d2t d2d" xmlns="http://www.w3.org/2000/svg" '
      f'style="width:100%;height:auto;font-family:system-ui,-apple-system,\'Segoe UI\',Roboto,Arial,sans-serif">')
    a('<title id="d2t">Totalt påslag över spotpris januari–juni 2026: Kraftringen och Eneas</title>')
    a(f'<desc id="d2d">Medelpåslag över spotpris, viktat med förbrukningen: Kraftringen {sv(r["kr_snitt"])} öre/kWh, '
      f'Eneas {sv(r["en_snitt"])} öre/kWh inklusive arvode. Skillnaden är {sv(r["skillnad"])} öre/kWh.</desc>')
    a(f'<rect width="{W}" height="{H}" fill="#ffffff"/>')

    # ---------- Panel A ----------
    a(f'<text x="8" y="22" font-size="16" font-weight="700" fill="{TEXT}">A. Totalt påslag över spotpris, januari–juni 2026</text>')
    a(f'<text x="8" y="42" font-size="13" fill="{DAMPAD}">snitt i öre per kWh, exklusive moms, viktat med förbrukningen (166 719 kWh)</text>')
    x0, sk, h = 205, 62.0, 42
    a(f'<text x="8" y="89" font-size="15" fill="{TEXT}">Kraftringen</text>')
    a(f'<text x="8" y="149" font-size="15" fill="{TEXT}">Eneas, inklusive arvode</text>')
    # Kraftringen
    w_fast = FAST * sk
    w_ror = r["ror_snitt"] * sk
    a(f'<rect x="{x0}" y="62" width="{w_fast:.1f}" height="{h}" fill="{KR_LJUS}"/>')
    a(f'<rect x="{x0 + w_fast:.1f}" y="62" width="{w_ror:.1f}" height="{h}" fill="{KR_MELLAN}"/>')
    a(f'<text x="{x0 + w_fast / 2:.1f}" y="88" font-size="13" text-anchor="middle" fill="{TEXT}">fast {sv(FAST)}</text>')
    a(f'<text x="{x0 + w_fast + w_ror / 2:.1f}" y="88" font-size="13" text-anchor="middle" fill="#ffffff">rörliga kostnader {sv(r["ror_snitt"])}</text>')
    a(f'<text x="{x0 + (w_fast + w_ror) + 8:.1f}" y="89" font-size="17" font-weight="700" fill="{TEXT}">{sv(r["kr_snitt"])}</text>')
    # Eneas: pris över spot + arvode
    w_e = r["en_over_snitt"] * sk
    w_a = r["arvode_ore"] * sk
    a(f'<rect x="{x0}" y="122" width="{w_e:.1f}" height="{h}" fill="{EN_FARG}"/>')
    a(f'<rect x="{x0 + w_e:.1f}" y="122" width="{w_a:.1f}" height="{h}" fill="{EN_LJUS}"/>')
    xt = x0 + w_e + w_a + 8
    a(f'<text x="{xt:.1f}" y="149" font-size="17" font-weight="700" fill="{TEXT}">{sv(r["en_snitt"])}</text>')
    a(f'<text x="{xt + 52:.1f}" y="147" font-size="13" fill="{DAMPAD}">= {sv(r["en_over_snitt"])} över spot + {sv(r["arvode_ore"])} arvode</text>')
    a(f'<line x1="{x0}" y1="56" x2="{x0}" y2="170" stroke="{DAMPAD}" stroke-width="1.5"/>')
    a(f'<text x="8" y="200" font-size="15" fill="{TEXT}"><tspan font-weight="700">Skillnad:</tspan> '
      f'{sv(r["skillnad"])} öre/kWh, {kr(r["kr_skillnad"])} kr exkl. moms ({kr(r["kr_skillnad_moms"])} kr inkl. moms)</text>')

    # ---------- Panel B ----------
    a(f'<line x1="0" y1="224" x2="{W}" y2="224" stroke="{RUTNAT}" stroke-width="1.5"/>')
    a(f'<text x="8" y="250" font-size="16" font-weight="700" fill="{TEXT}">B. Totalt påslag över spotpris per månad</text>')
    a(f'<text x="8" y="270" font-size="13" fill="{DAMPAD}">öre per kWh, exklusive moms, Eneas inklusive arvode</text>')
    a(f'<rect x="8" y="282" width="14" height="14" fill="{KR_FARG}"/><text x="28" y="294" font-size="14" fill="{TEXT}">Kraftringen</text>')
    a(f'<rect x="130" y="282" width="14" height="14" fill="{EN_FARG}"/><text x="150" y="294" font-size="14" fill="{TEXT}">Eneas</text>')
    skala = 15.0
    y0 = 318 + 9 * skala        # nolllinje, plats för upp till 9 öre uppåt
    xl, xr = 58, 628
    for t in (-5, 0, 5):
        yy = y0 - t * skala
        a(f'<line x1="{xl}" y1="{yy:.1f}" x2="{xr}" y2="{yy:.1f}" stroke="{RUTNAT if t else DAMPAD}" stroke-width="{1 if t else 1.5}"/>')
        a(f'<text x="{xl - 6}" y="{yy + 5:.1f}" font-size="13" text-anchor="end" fill="{DAMPAD}">{sv(t, 0)}</text>')
    bw = 30
    for i, m in enumerate(MANADER):
        cx = 118 + i * 90
        for val, dx, farg in ((r["kr_pas"][i], -bw - 2, KR_FARG), (r["en_tot"][i], 2, EN_FARG)):
            hh = abs(val) * skala
            y = y0 - hh if val >= 0 else y0
            a(f'<rect x="{cx + dx}" y="{y:.1f}" width="{bw}" height="{hh:.1f}" fill="{farg}"/>')
            ty = y - 5 if val >= 0 else y + hh + 15
            a(f'<text x="{cx + dx + bw / 2}" y="{ty:.1f}" font-size="13" text-anchor="middle" fill="{TEXT}">{sv(val, 1)}</text>')
        a(f'<text x="{cx}" y="{y0 + 5 * skala + 40:.1f}" font-size="14" text-anchor="middle" fill="{TEXT}">{m}</text>')
    a('</svg>')
    return "\n".join(o)


def main():
    r = berakna()
    svg = rita(r)
    text = MAL.read_text(encoding="utf-8")
    ny = "<!-- diagram2:start (genereras av bygg_diagram_paslag.py) -->\n" + svg + "\n<!-- diagram2:slut -->"
    nytt, n = re.subn(r"<!-- diagram2:start.*?<!-- diagram2:slut -->", lambda m: ny, text, flags=re.S)
    if n != 1:
        raise SystemExit("Hittade inte markeringarna diagram2:start/slut i alternativ.html")
    MAL.write_text(nytt, encoding="utf-8", newline="")
    print("Kraftringen totalt påslag, vägt:", round(r["kr_snitt"], 3), "(rörliga", round(r["ror_snitt"], 3), "+ fast 1,70)")
    print("Eneas totalt påslag inkl arvode, vägt:", round(r["en_snitt"], 3), "(över spot", round(r["en_over_snitt"], 3), "+ arvode", round(r["arvode_ore"], 3), ")")
    print("Skillnad:", round(r["skillnad"], 3), "öre/kWh =", round(r["kr_skillnad"]), "kr exkl moms,", round(r["kr_skillnad_moms"]), "kr inkl moms")
    print("Per månad Kraftringen:", [round(x, 2) for x in r["kr_pas"]])
    print("Per månad Eneas inkl arvode:", [round(x, 2) for x in r["en_tot"]])
    print("Netto per månad (kr exkl moms):", [round(x) for x in r["netto"]], "summa", round(sum(r["netto"])))
    print("Andel jan–feb av nettobesparingen:", round(r["jan_feb_andel"] * 100, 1), "%")


if __name__ == "__main__":
    main()
