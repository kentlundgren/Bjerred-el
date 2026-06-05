# Eldata – Bjerreds Saltsjöbad

Denna fil är en **backup och referens** för all månadsdata kring elförbrukning och elkostnad.
Filen ska uppdateras varje gång ny månadsdata läggs till i `index.html`.

Senast uppdaterad: **2026-06-03**  
Dataperiod: **Augusti 2024 – Maj 2026** (22 månader)

---

## Månadsdata

| Månad | Typ | Bad kWh | Rest. kWh | Totalt kWh | kWh/dag | Kostnad (kr) | Kr/kWh |
|-------|-----|--------:|----------:|-----------:|--------:|-------------:|-------:|
| Aug 2024 | Bad + restaurang | 8 262 | 11 639 | 19 901 | 642 | 34 472 | 1,73 |
| Sep 2024 | Bad + restaurang | 8 273 | 10 998 | 19 271 | 642 | 30 158 | 1,56 |
| Okt 2024 | Bad + restaurang | 12 308 | 6 916 | 19 224 | 620 | 29 882 | 1,55 |
| Nov 2024 | Bad + restaurang | 8 010 | 14 839 | 22 849 | 759 | 51 492 | 2,26 |
| Dec 2024 | Bad + restaurang | 14 338 | 9 926 | 24 264 | 809 | 50 672 | 2,09 |
| Jan 2025 | Bad + restaurang | 12 250 | 14 565 | 26 815 | 865 | 58 462 | 2,18 |
| Feb 2025 | Badet stängde i februari | 11 605 | 11 624 | 23 229 | 830 | 60 285 | 2,60 |
| Mar 2025 | Bara restaurang | 0 | 12 573 | 12 573 | 406 | 26 141 | 2,08 |
| Apr 2025 | Bara restaurang | 0 | 12 160 | 12 160 | 405 | 24 516 | 2,02 |
| Maj 2025 | Bara restaurang | 0 | 11 775 | 11 775 | 380 | 23 812 | 2,02 |
| Jun 2025 | Bara restaurang | 0 | 12 073 | 12 073 | 402 | 21 763 | 1,80 |
| Jul 2025 | Badet öppnade mitten av juli | 4 389 | 13 365 | 17 754 | 573 | 32 490 | 1,83 |
| Aug 2025 | Bad + restaurang | 11 779 | 11 600 | 23 379 | 754 | 47 703 | 2,04 |
| Sep 2025 | Bad + restaurang | 11 236 | 10 288 | 21 524 | 717 | 45 699 | 2,12 |
| Okt 2025 | Bad + restaurang | 12 646 | 10 936 | 23 582 | 761 | 52 459 | 2,22 |
| Nov 2025 | Bad + restaurang | 16 608 | 10 825 | 27 433 | 914 | 64 248 | 2,34 |
| Dec 2025 | Bad + restaurang | 18 602 | 11 413 | 30 015 | 968 | 62 760 | 2,09 |
| Jan 2026 | Bad + restaurang | 18 836 | 16 586 | 35 422 | 1 143 | 90 779 | 2,56 |
| Feb 2026 | Bad + restaurang | 15 660 | 16 342 | 32 002 | 1 143 | 82 794 | 2,59 |
| Mar 2026 | Bad + restaurang | 17 772 | 10 302 | 28 074 | 906 | 63 389 | 2,26 |
| Apr 2026 | Bad + restaurang | 15 089 | 11 582 | 26 671 | 860 | 52 186 | 1,96 |
| Maj 2026 | Bad + restaurang | 11 511 | 12 426 | 23 937 | 772 | 60 000 | 2,51 |

---

## Noteringar

- **Feb–Jul 2025:** Badet stängt för ombyggnad (mitten av feb till mitten av jul 2025).
- **Jul 2025:** Badet öppnade igen i mitten av månaden – halvmånadsdata för badet.
- **Jan 2026:** Ovanligt hög total (35 422 kWh) och hög kostnad (90 779 kr) – troligen orsakat av kall vinter och hög elprisstopp.
- **Kostnad (kr):** Avser total fakturerad elkostnad för månaden (bad + restaurang gemensamt).
- **Bad kWh:** Elförbrukning för bastudelen (uppvärmning, ventilation m.m.).
- **Rest. kWh:** Elförbrukning för restaurangdelen.
- **Bad + Rest. = Totalt** för månader med bad öppet. Under stängningstiden = enbart restaurang.

---

## Kapacitetsdata – bastun

| Period | Platser/bastu | Antal bastuer | Totalt |
|--------|:-------------:|:-------------:|:------:|
| Före ombyggnad (–feb 2025) | 18 | 2 | 36 |
| Efter ombyggnad (aug 2025–) | 27 | 2 | 54 |

Öppettider: 06:00–22:00 (16 tim). Städning ca 2 tim/dag → **14 drifttimmar/dag**.

---

## Hur man lägger till ny månadsdata

1. Lägg till en ny rad i tabellen ovan (i denna fil) med korrekt data.
2. Lägg till motsvarande objekt i `monthlyData`-arrayen i `index.html`.
3. Om månaden tillhör "efter ombyggnad"-perioden, kontrollera om `foreData`/`efterData` i `fore_och_efter_ombyggnad.js` behöver uppdateras.
4. Kontrollräkna: `bad + restaurant = totalKWh`, `kwhPerDay ≈ totalKWh / daysInMonth`, `costPerKwh = cost / totalKWh`.
