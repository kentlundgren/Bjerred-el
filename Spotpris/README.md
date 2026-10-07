# Spotpris månad för månad, januari–juni 2026

- **Live:** [https://kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html](https://kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html)

Ett månadsvärde för spotpriset i elområde SE4, jämfört med spotpriset, de rörliga kostnaderna och
det fasta påslaget på Kraftringens fakturor, och med Eneas "allt elpris". Sammanställd av Kent Lundgren.

> Spotpriserna är hämtade från elprisetjustnu.se och Kraftringens poster ur fakturorna. M4b är en
> uppskattning, inte en mätning. Siffrorna är inte granskade i en tvåstegsgranskning. Kontrollera mot
> källan innan något återges.

## Lokalt repo

Repo-rot lokalt:

`D:\VåraFiler_primära_på_SSD\Kent_dokument\Data\HTML\kentlundgren_se\program\Bjerred\El\`

Den här mappen lokalt:

`D:\VåraFiler_primära_på_SSD\Kent_dokument\Data\HTML\kentlundgren_se\program\Bjerred\El\Spotpris\`

På GitHub: <https://github.com/kentlundgren/Bjerred-el/tree/main/Spotpris>

## Problemet och metoderna

Spotpriset ändras varje kvart. Månadens värde beror på hur man väger kvartarna:

| Metod | Beskrivning |
|---|---|
| M1 | Enkelt medel av alla kvartar |
| M2 | Medel av kvartarna 06–22 |
| M3 | Viktat med förbrukning per kvart (byggs när kvartsdata finns) |
| M4a | Viktat med en antagen förbrukningsprofil |
| M4b | Profilen anpassad så att den stämmer med fakturans spotpris (uppskattning) |

Förbrukning per kvart saknas, så förbrukningen uppskattas baklänges ur fakturan (M4b). Modellen delar
upp förbrukningen i bastu, varmvatten och restaurang (en jämn baslast plus drift under öppettiderna).
Noggrannhetskriterierna är 3,0 öre/kWh för passningen och 4,5 för leave-one-out. De sattes efter att
utfallet var känt och är ett skydd mot försämring, inte ett bevis. Se [PRD.md](PRD.md) och [SPEC.md](SPEC.md).

## Filer

| Fil | Innehåll |
|---|---|
| `spotpris.html`, `.css`, `.js` | Sidan. Fungerar från fil och offline. |
| `PRD.md`, `SPEC.md` | Krav och exakt specifikation |
| `hamta_spotpris.py` | Hämtar spotpriser per kvart (hoppar över filer som redan finns, `--om` hämtar om) |
| `berakna_spotpris.py` | Beräknar månadsvärden, M4b och effektkurvor; skriver `data/*.json` och `data/spotpris_data.js` |
| `test_spotpris.py` | Tester T1–T17 (skriver "OK" när alla passerar) |
| `data/` | Indata (`kraftringen.json`, `oppettider.json`, `sokrum.json`, `spot_SE4_*.json`) och utdata |
| `forstudie/` | Förstudiernas skript och figur |

## Köra

```
python hamta_spotpris.py
python berakna_spotpris.py
python test_spotpris.py
```

Öppna sedan `spotpris.html` direkt i webbläsaren. `data/spotpris_data.js` behövs eftersom webbläsare
blockerar inläsning av JSON från `file://`.

## Eneas pris

Eneas allt elpris fylls i i de gula fälten i tabell 2. Det sparas bara i den egna webbläsaren och
förifylls från jämförelsesidans inmatning om fältet är tomt. Sidan är intern och länkas inte från
Isaks sida.
