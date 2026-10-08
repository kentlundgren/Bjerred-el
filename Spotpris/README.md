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
| `spotpris.html`, `.css`, `.js` | Sidan. Fungerar från fil och offline. Eneas pris i tabell 2 är dolt: tre snabba klick på rubriken "Tabell 2" fyller i det, och tre klick till tar bort det (v1.1, konstanten `ENEAS_PRIS_ORE`). |
| `PRD.md`, `SPEC.md` | Krav och exakt specifikation |
| `hamta_spotpris.py` | Hämtar spotpriser per kvart (hoppar över filer som redan finns, `--om` hämtar om) |
| `berakna_spotpris.py` | Beräknar månadsvärden, M4b och effektkurvor; skriver `data/*.json` och `data/spotpris_data.js` |
| `test_spotpris.py` | Tester T1–T17 (skriver "OK" när alla passerar) |
| `forutsag_spotpris.py` | Blindprov: förutsäger spotpriset för juli–september med antagandena från januari–juni. Skriver `data/forutsagelse_jul_sep.json` och `data/forutsagelse_data.js` |
| `omanpassning.html`, `.css`, `.js` | Extrasida: hur M4b anpassades om på januari–september (ver. 2), teori, kriterier och resultat. Länkas från `spotpris.html` |
| `omanpassa_m4b.py` | Omanpassningen. Skriver bara `data/omanpassning_resultat.json` och `data/omanpassning_data.js`, rör inte de frusna filerna |
| `test_omanpassning.py` | Tester för omanpassningen (skriver inga filer) |
| `kanslighet_startpuls.py` | Känslighetsvariant: startpuls när bastuaggregaten slås på. Skriver `data/startpuls_data.js`. Ändrar inte primärkörningen |
| `data/` | Indata (`kraftringen.json`, `oppettider.json`, `sokrum.json`, `spot_SE4_*.json`, `facit_jul_sep.json`) och utdata |
| `forstudie/` | Förstudiernas skript och figur |

## Köra

```
python hamta_spotpris.py
python berakna_spotpris.py
python test_spotpris.py
```

Öppna sedan `spotpris.html` direkt i webbläsaren. `data/spotpris_data.js` behövs eftersom webbläsare
blockerar inläsning av JSON från `file://`.

## Blindprov och känslighetsvarianter

- **Blindprov (juli–september):** de förutsades innan fakturorna lästes in. M4b (uppskattningen) fick fel på +3,34, −3,46 och −4,41 öre/kWh, alltså inom gränsen 4,5 (september knappt) men större än på de månader som antagandena anpassades på (RMS-fel, typiskt fel, 3,77 mot 1,35). Spannet var för smalt och täckte inte utfallet i någon av månaderna. Alla tre fakturor är nu lästa, så det finns ingen ren förutsägelse kvar att vänta på. Analys och tolkning finns på sidan under "Blindprovet" och i [PRD.md](PRD.md), avsnitt 4.6.
- **Startpuls för bastuaggregaten:** bastun har två aggregat (ett per bastu, Harvia Qube 360, 36 kW vardera). Sidans effektkurva har en tredje knapp som visar en morgontopp. Det är en illustration: med övriga antaganden fixa blir träffen mot fakturorna sämre ju större puls, och primärkörningen är oförändrad.
- Fakturavärdena för juli–september ligger i `data/facit_jul_sep.json` och inte i `kraftringen.json`, så att anpassningen på januari–juni (ver. 1) och blindprovet förblir orörda. Omanpassningen på januari–september (ver. 2) görs av `omanpassa_m4b.py` utan att ändra dem.
- **Omanpassning (2026-10-08):** M4b anpassades om på nio månader, med kriterier skrivna före körningen. Ver. 2 skiljer sig från ver. 1 bara i att bastun öppnar 07.30 i stället för 06.00. RMS-felet på januari–september är 1,99 mot 2,26 (ver. 1). Passningskriteriet (största fel ≤ 3,0) uppfylldes inte (3,23 i augusti), leave-one-out (3,51) och framåtprovet (RMS 2,98) uppfylldes. Därför är ver. 2 ett försök och ver. 1 fortsatt referens; oktober–december avgör. Teori, tabeller och diagram finns på [omanpassning.html](omanpassning.html) och i [PRD.md](PRD.md), avsnitt 4.7. Körning: `python omanpassa_m4b.py` och `python test_omanpassning.py`.

## Status

Sidan är byggd och testad i webbläsare (inte på pekskärm). Testerna T1–T17 går igenom. Tvåstegsgranskning är inte gjord (beskriven i sidans teknik-modal, med en färdig promt).

## Eneas pris

Eneas allt elpris fylls i i de gula fälten i tabell 2. Det sparas bara i den egna webbläsaren och
förifylls från jämförelsesidans inmatning om fältet är tomt. Sidan är intern och länkas inte från
Isaks sida.
