# Granskning 2 – oberoende kontroll av siffror och beräkningar

Datum: 2026-10-06
Granskat: `enea_jamforelse.js` (MANADER), `intern_debitering.js` (MANADER), `intern_underlag.js` (STANDARD), formeln i `README.md` ("Så räknas fakturan med Eneas") och `PRD.md` avsnitt 4.3 och 5.
Källor: Kraftringens sex fakturor (`Kraftringen/Fakturor/*.pdf`) och de sex bilderna av debiteringsunderlagen (`Kraftringen/Intern_debitering/*.jpg`).

> Siffrorna i rapporten är hämtade ur de angivna fakturorna och bilderna. De är inte kvalitetssäkrade i övrigt. Kontrollera mot källan innan något återges.

## Sammanfattning

- **Data.** 220 fältkontroller utan fel. Nio avvikelser är avrundning: huvudmätarens ställning i bilderna är ett heltal som ligger upp till 1 kWh från fakturans decimalvärde. Inga okända avvikelser.
- **Fakturornas egen räkning** stämmer alla sex månader: moms 25 %, delsummor, summa exkl. moms och totalbelopp med öresutjämning. Radbeloppen avviker från kWh × öre-pris med högst 1,48 kr (elöverföring, februari). Det beror på att fakturans öre-priser är avrundade till två decimaler. De är snitt av kvartspriser (se avsnitt 3).
- **README-formeln.** Sidan ger exakt samma belopp som formeln i alla 66 fall (11 prisuppsättningar × 6 månader). Restaurangsidan stämmer också exakt med sin formel i alla 66 fall. Räknat från grunden, utan fakturans belopp, avviker sidan med −1 till +3 kr. Det ligger inom gränsen på 3 kr.
- **Debiteringsunderlaget**, räknat från mätarställningarna för alla sex månader, avviker 0, 0, 0, −1, +1 och −2 kr från tidigare debiterat (rättat) belopp. Det ligger inom tillåtna 2 kr. Orsaken är avrundade mätarställningar.
- **Antaganden.** (b) och (c) är rimliga. (a), (d) och (e) är oklara, inte fel. De bör förklaras tydligare på sidan (avsnitt 5).
- **Två saker att rätta eller förtydliga (inga datafel):**
  1. Juni: restaurangens kWh är 11 756 i `intern_debitering.js` (från bilden) men 11 755 i underlaget (`intern_underlag.js`, från avrundade ställningar). Båda ligger inom toleransen, men de två delarna av samma sida använder olika kWh.
  2. Benämningen "El inkl Elcert (1,7 öre/kWh)" finns inte på fakturan. Där heter posten "Fast påslag 1,70 öre/kWh". Fakturan säger inget om att elcertifikat ingår (avsnitt 5a).

## 1. Metod

1. **Fakturorna** lästes med `pdftotext` (båda sidorna, alla sex månader). Raderna tolkades med ett eget Python-skript (`granska.py`). Februari, mars och maj kontrollerades också visuellt mot sidan som bild. Sida 4 i majfakturan är tom, bara sidnummer.
2. **Bilderna** lästes visuellt, alla sex och alla fält, och skrevs in för hand i skriptet. Varje avläsning kontrollerades sedan aritmetiskt: utgående − ingående = förbrukning, herr + dam = bastu totalt, kedjan mellan månaderna, belopp ÷ öre = kWh och summa × 1,25 = totalt. Alla avläsningar gick ihop. Det stärker att de är rätt avlästa.
3. **Koden.** Listorna lästes ur JS-filerna med skript, inte avskrivna. Formlerna testades genom att köra de riktiga sidorna `enea_jamforelse.html` och `intern_debitering.html` i Chromium (Playwright), fylla i de gula fälten och läsa av det sidan visar (`formler.py`).
4. **Egna beräkningar** gjordes med exakt decimalaritmetik (Python `Decimal`, avrundning halvt uppåt).

Skripten ligger bredvid rapporten i `kvalitetsgranskning/` som `granskning2_granska.py` och `granskning2_formler.py`, så att granskningen kan göras om:
`python3 -I granskning2_granska.py <mapp med fakturor> <mapp med js>` och `python3 -I granskning2_formler.py <mapp med sidans filer> granskning2_fakt.json`. Formelskriptet kräver Python-paketet `playwright` och Chromium. `granskning2_fakt.json` är fakturadata som det första skriptet läst ur PDF-filerna.

**Om oberoendet:** `KVALITETSGRANSKNING.md`, mappen `kvalitetsgranskning/` och avsnitt 13 i PRD.md lästes inte före rapporten. Två saker från egenkontrollen syntes ändå under arbetet, eftersom de står i filer som ingick i granskningen. Det ena är en kort testsammanfattning i slutet av PRD avsnitt 12 (−1, +1 och −2 kr). Det andra är "Teknik"-rutorna i HTML-filerna ("85 kontroller", "66 kontroller", "−2 till +1 kr"). Mina siffror är framräknade oberoende av dessa.

## 2. Data: alla kontrollerade fält

Kolumnen "Resultat": **OK** = exakt lika. **Avrundning** = tillåten avvikelse (mätarställning högst 1 kWh från fakturan). Inga fel hittades.
Källa: "Faktura ÅÅÅÅMM s.1/s.2" = fakturans sida, "Bild ÅÅÅÅMM" = `ÅÅÅÅMM_Intern_debitering.jpg`.
För april–juni är "förväntat" restaurangbelopp bildens rader utan fast nätavgift: (rörlig + el + energiskatt) × 1,25, avrundat (PRD 4.3).

| Nr | Fil | Månad | Fält | Förväntat (källa) | Värde i sidan/bild | Källa | Resultat |
|---:|-----|-------|------|------------------:|-------------------:|-------|----------|
| 1 | enea_jamforelse.js (MANADER) | jan | kwh | 35422,14 | 35422,14 | Faktura 202601 s.2 | OK |
| 2 | enea_jamforelse.js (MANADER) | jan | fakturaKr | 90779 | 90779 | Faktura 202601 s.1 | OK |
| 3 | enea_jamforelse.js (MANADER) | jan | krOre (spot+rörl+påslag) | 122,24 | 122,24 | Faktura 202601 s.2 | OK |
| 4 | enea_jamforelse.js (MANADER) | jan | natOre | 21,87 | 21,87 | Faktura 202601 s.2 | OK |
| 5 | enea_jamforelse.js (MANADER) | jan | skattOre | 36,00 | 36,00 | Faktura 202601 s.2 | OK |
| 6 | enea_jamforelse.js (MANADER) | jan | fastNatKr | 8824,00 | 8824 | Faktura 202601 s.2 | OK |
| 7 | intern_underlag.js (STANDARD) | jan | faktura | 90779 | 90779 | Faktura 202601 s.1 | OK |
| 8 | intern_underlag.js (STANDARD) | jan | nr | 3082197306 | 3082197306 | Faktura 202601 s.1 | OK |
| 9 | intern_underlag.js (STANDARD) | jan | kwhFaktura | 35422,14 | 35422,14 | Faktura 202601 s.2 | OK |
| 10 | intern_underlag.js (STANDARD) | jan | p.rorlig | 21,87 | 21,87 | Faktura 202601 s.2 | OK |
| 11 | intern_underlag.js (STANDARD) | jan | p.el | 122,24 | 122,24 | Faktura 202601 s.2 | OK |
| 12 | intern_underlag.js (STANDARD) | jan | p.skatt | 36,00 | 36,00 | Faktura 202601 s.2 | OK |
| 13 | intern_underlag.js (STANDARD) | jan | faktura (bild) | 90779 | 90779 | Bild 202601 | OK |
| 14 | intern_underlag.js (STANDARD) | jan | nr (bild) | 3082197306 | 3082197306 | Bild 202601 | OK |
| 15 | intern_underlag.js (STANDARD) | jan | e.huvud (utgående) | 212333 | 212333 | Bild 202601 | OK |
| 16 | intern_underlag.js (STANDARD) | jan | s.huvud (ingående) | 176911 | 176911 | Bild 202601 | OK |
| 17 | intern_underlag.js (STANDARD) | jan | e.herr (utgående) | 33683 | 33683 | Bild 202601 | OK |
| 18 | intern_underlag.js (STANDARD) | jan | s.herr (ingående) | 25833 | 25833 | Bild 202601 | OK |
| 19 | intern_underlag.js (STANDARD) | jan | e.dam (utgående) | 28997 | 28997 | Bild 202601 | OK |
| 20 | intern_underlag.js (STANDARD) | jan | s.dam (ingående) | 22118 | 22118 | Bild 202601 | OK |
| 21 | intern_underlag.js (STANDARD) | jan | e.varm (utgående) | 673964 | 673964 | Bild 202601 | OK |
| 22 | intern_underlag.js (STANDARD) | jan | s.varm (ingående) | 669857 | 669857 | Bild 202601 | OK |
| 23 | intern_underlag.js (STANDARD) | jan | p.rorlig (bild) | 21,87 | 21,87 | Bild 202601 | OK |
| 24 | intern_underlag.js (STANDARD) | jan | p.el (bild) | 122,24 | 122,24 | Bild 202601 | OK |
| 25 | intern_underlag.js (STANDARD) | jan | p.skatt (bild) | 36,00 | 36,00 | Bild 202601 | OK |
| 26 | bild mot faktura | jan | huvud ingående | 176910 | 176911 | Faktura 202601 s.2 / Bild 202601 | Avrundning (+1 kWh) |
| 27 | bild mot faktura | jan | huvud utgående | 212332 | 212333 | Faktura 202601 s.2 / Bild 202601 | Avrundning (+1 kWh) |
| 28 | bild mot faktura | jan | huvud förbrukning | 35422 | 35422 | Faktura 202601 s.2 / Bild 202601 | OK |
| 29 | bild mot faktura | jan | el inkl elcert | 122,24 | 122,24 | Faktura 202601 s.2 / Bild 202601 | OK |
| 30 | bild mot faktura | jan | rörlig nät | 21,87 | 21,87 | Faktura 202601 s.2 / Bild 202601 | OK |
| 31 | bild mot faktura | jan | energiskatt | 36,00 | 36,00 | Faktura 202601 s.2 / Bild 202601 | OK |
| 32 | intern_debitering.js (MANADER) | jan | krOre | 122,24 | 122,24 | Faktura 202601 s.2 | OK |
| 33 | intern_debitering.js (MANADER) | jan | hgKwh | 16586 | 16586 | Bild 202601 | OK |
| 34 | intern_debitering.js (MANADER) | jan | hgKr | 37341,00 | 37341 | Bild 202601 | OK |
| 35 | intern_underlag.js (STANDARD) | jan | facit | 37341,00 | 37341 | Bild 202601 | OK |
| 36 | enea_jamforelse.js (MANADER) | feb | kwh | 32002,14 | 32002,14 | Faktura 202602 s.2 | OK |
| 37 | enea_jamforelse.js (MANADER) | feb | fakturaKr | 82794 | 82794 | Faktura 202602 s.1 | OK |
| 38 | enea_jamforelse.js (MANADER) | feb | krOre (spot+rörl+påslag) | 121,56 | 121,56 | Faktura 202602 s.2 | OK |
| 39 | enea_jamforelse.js (MANADER) | feb | natOre | 21,84 | 21,84 | Faktura 202602 s.2 | OK |
| 40 | enea_jamforelse.js (MANADER) | feb | skattOre | 36,00 | 36,00 | Faktura 202602 s.2 | OK |
| 41 | enea_jamforelse.js (MANADER) | feb | fastNatKr | 8824,00 | 8824 | Faktura 202602 s.2 | OK |
| 42 | intern_underlag.js (STANDARD) | feb | faktura | 82794 | 82794 | Faktura 202602 s.1 | OK |
| 43 | intern_underlag.js (STANDARD) | feb | nr | 3098735503 | 3098735503 | Faktura 202602 s.1 | OK |
| 44 | intern_underlag.js (STANDARD) | feb | kwhFaktura | 32002,14 | 32002,14 | Faktura 202602 s.2 | OK |
| 45 | intern_underlag.js (STANDARD) | feb | p.rorlig | 21,84 | 21,84 | Faktura 202602 s.2 | OK |
| 46 | intern_underlag.js (STANDARD) | feb | p.el | 121,56 | 121,56 | Faktura 202602 s.2 | OK |
| 47 | intern_underlag.js (STANDARD) | feb | p.skatt | 36,00 | 36,00 | Faktura 202602 s.2 | OK |
| 48 | intern_underlag.js (STANDARD) | feb | faktura (bild) | 82794 | 82794 | Bild 202602 | OK |
| 49 | intern_underlag.js (STANDARD) | feb | nr (bild) | 3098735503 | 3098735503 | Bild 202602 | OK |
| 50 | intern_underlag.js (STANDARD) | feb | e.huvud (utgående) | 244335 | 244335 | Bild 202602 | OK |
| 51 | intern_underlag.js (STANDARD) | feb | e.herr (utgående) | 40360 | 40360 | Bild 202602 | OK |
| 52 | intern_underlag.js (STANDARD) | feb | e.dam (utgående) | 34159 | 34159 | Bild 202602 | OK |
| 53 | intern_underlag.js (STANDARD) | feb | e.varm (utgående) | 677785 | 677785 | Bild 202602 | OK |
| 54 | intern_underlag.js (STANDARD) | feb | p.rorlig (bild) | 21,84 | 21,84 | Bild 202602 | OK |
| 55 | intern_underlag.js (STANDARD) | feb | p.el (bild) | 121,56 | 121,56 | Bild 202602 | OK |
| 56 | intern_underlag.js (STANDARD) | feb | p.skatt (bild) | 36,00 | 36,00 | Bild 202602 | OK |
| 57 | bild mot faktura | feb | huvud ingående | 212332 | 212333 | Faktura 202602 s.2 / Bild 202602 | Avrundning (+1 kWh) |
| 58 | bild mot faktura | feb | huvud utgående | 244335 | 244335 | Faktura 202602 s.2 / Bild 202602 | OK |
| 59 | bild mot faktura | feb | huvud förbrukning | 32002 | 32002 | Faktura 202602 s.2 / Bild 202602 | OK |
| 60 | bild mot faktura | feb | el inkl elcert | 121,56 | 121,56 | Faktura 202602 s.2 / Bild 202602 | OK |
| 61 | bild mot faktura | feb | rörlig nät | 21,84 | 21,84 | Faktura 202602 s.2 / Bild 202602 | OK |
| 62 | bild mot faktura | feb | energiskatt | 36,00 | 36,00 | Faktura 202602 s.2 / Bild 202602 | OK |
| 63 | intern_debitering.js (MANADER) | feb | krOre | 121,56 | 121,56 | Faktura 202602 s.2 | OK |
| 64 | intern_debitering.js (MANADER) | feb | hgKwh | 16342 | 16342 | Bild 202602 | OK |
| 65 | intern_debitering.js (MANADER) | feb | hgKr | 36647,00 | 36647 | Bild 202602 | OK |
| 66 | intern_underlag.js (STANDARD) | feb | facit | 36647,00 | 36647 | Bild 202602 | OK |
| 67 | enea_jamforelse.js (MANADER) | mar | kwh | 28073,52 | 28073,52 | Faktura 202603 s.2 | OK |
| 68 | enea_jamforelse.js (MANADER) | mar | fakturaKr | 63389 | 63389 | Faktura 202603 s.1 | OK |
| 69 | enea_jamforelse.js (MANADER) | mar | krOre (spot+rörl+påslag) | 92,87 | 92,87 | Faktura 202603 s.2 | OK |
| 70 | enea_jamforelse.js (MANADER) | mar | natOre | 20,33 | 20,33 | Faktura 202603 s.2 | OK |
| 71 | enea_jamforelse.js (MANADER) | mar | skattOre | 36,00 | 36,00 | Faktura 202603 s.2 | OK |
| 72 | enea_jamforelse.js (MANADER) | mar | fastNatKr | 8824,00 | 8824 | Faktura 202603 s.2 | OK |
| 73 | intern_underlag.js (STANDARD) | mar | faktura | 63389 | 63389 | Faktura 202603 s.1 | OK |
| 74 | intern_underlag.js (STANDARD) | mar | nr | 3112109404 | 3112109404 | Faktura 202603 s.1 | OK |
| 75 | intern_underlag.js (STANDARD) | mar | kwhFaktura | 28073,52 | 28073,52 | Faktura 202603 s.2 | OK |
| 76 | intern_underlag.js (STANDARD) | mar | p.rorlig | 20,33 | 20,33 | Faktura 202603 s.2 | OK |
| 77 | intern_underlag.js (STANDARD) | mar | p.el | 92,87 | 92,87 | Faktura 202603 s.2 | OK |
| 78 | intern_underlag.js (STANDARD) | mar | p.skatt | 36,00 | 36,00 | Faktura 202603 s.2 | OK |
| 79 | intern_underlag.js (STANDARD) | mar | faktura (bild) | 63389 | 63389 | Bild 202603 | OK |
| 80 | intern_underlag.js (STANDARD) | mar | nr (bild) | 3112109404 | 3112109404 | Bild 202603 | OK |
| 81 | intern_underlag.js (STANDARD) | mar | e.huvud (utgående) | 272409 | 272409 | Bild 202603 | OK |
| 82 | intern_underlag.js (STANDARD) | mar | e.herr (utgående) | 46950 | 46950 | Bild 202603 | OK |
| 83 | intern_underlag.js (STANDARD) | mar | e.dam (utgående) | 40312 | 40312 | Bild 202603 | OK |
| 84 | intern_underlag.js (STANDARD) | mar | e.varm (utgående) | 682814 | 682814 | Bild 202603 | OK |
| 85 | intern_underlag.js (STANDARD) | mar | p.rorlig (bild) | 20,33 | 20,33 | Bild 202603 | OK |
| 86 | intern_underlag.js (STANDARD) | mar | p.el (bild) | 92,87 | 92,87 | Bild 202603 | OK |
| 87 | intern_underlag.js (STANDARD) | mar | p.skatt (bild) | 36,00 | 36,00 | Bild 202603 | OK |
| 88 | bild mot faktura | mar | huvud ingående | 244335 | 244335 | Faktura 202603 s.2 / Bild 202603 | OK |
| 89 | bild mot faktura | mar | huvud utgående | 272408 | 272409 | Faktura 202603 s.2 / Bild 202603 | Avrundning (+1 kWh) |
| 90 | bild mot faktura | mar | huvud förbrukning | 28074 | 28074 | Faktura 202603 s.2 / Bild 202603 | OK |
| 91 | bild mot faktura | mar | el inkl elcert | 92,87 | 92,87 | Faktura 202603 s.2 / Bild 202603 | OK |
| 92 | bild mot faktura | mar | rörlig nät | 20,33 | 20,33 | Faktura 202603 s.2 / Bild 202603 | OK |
| 93 | bild mot faktura | mar | energiskatt | 36,00 | 36,00 | Faktura 202603 s.2 / Bild 202603 | OK |
| 94 | intern_debitering.js (MANADER) | mar | krOre | 92,87 | 92,87 | Faktura 202603 s.2 | OK |
| 95 | intern_debitering.js (MANADER) | mar | hgKwh | 10302 | 10302 | Bild 202603 | OK |
| 96 | intern_debitering.js (MANADER) | mar | hgKr | 19213,00 | 19213 | Bild 202603 | OK |
| 97 | intern_underlag.js (STANDARD) | mar | facit | 19213,00 | 19213 | Bild 202603 | OK |
| 98 | enea_jamforelse.js (MANADER) | apr | kwh | 26671,14 | 26671,14 | Faktura 202604 s.2 | OK |
| 99 | enea_jamforelse.js (MANADER) | apr | fakturaKr | 52186 | 52186 | Faktura 202604 s.1 | OK |
| 100 | enea_jamforelse.js (MANADER) | apr | krOre (spot+rörl+påslag) | 68,29 | 68,29 | Faktura 202604 s.2 | OK |
| 101 | enea_jamforelse.js (MANADER) | apr | natOre | 19,16 | 19,16 | Faktura 202604 s.2 | OK |
| 102 | enea_jamforelse.js (MANADER) | apr | skattOre | 36,00 | 36,00 | Faktura 202604 s.2 | OK |
| 103 | enea_jamforelse.js (MANADER) | apr | fastNatKr | 8824,00 | 8824 | Faktura 202604 s.2 | OK |
| 104 | intern_underlag.js (STANDARD) | apr | faktura | 52186 | 52186 | Faktura 202604 s.1 | OK |
| 105 | intern_underlag.js (STANDARD) | apr | nr | 3126369101 | 3126369101 | Faktura 202604 s.1 | OK |
| 106 | intern_underlag.js (STANDARD) | apr | kwhFaktura | 26671,14 | 26671,14 | Faktura 202604 s.2 | OK |
| 107 | intern_underlag.js (STANDARD) | apr | p.rorlig | 19,16 | 19,16 | Faktura 202604 s.2 | OK |
| 108 | intern_underlag.js (STANDARD) | apr | p.el | 68,29 | 68,29 | Faktura 202604 s.2 | OK |
| 109 | intern_underlag.js (STANDARD) | apr | p.skatt | 36,00 | 36,00 | Faktura 202604 s.2 | OK |
| 110 | intern_underlag.js (STANDARD) | apr | faktura (bild) | 52186 | 52186 | Bild 202604 | OK |
| 111 | intern_underlag.js (STANDARD) | apr | nr (bild) | 3126369101 | 3126369101 | Bild 202604 | OK |
| 112 | intern_underlag.js (STANDARD) | apr | e.huvud (utgående) | 299080 | 299080 | Bild 202604 | OK |
| 113 | intern_underlag.js (STANDARD) | apr | e.herr (utgående) | 52762 | 52762 | Bild 202604 | OK |
| 114 | intern_underlag.js (STANDARD) | apr | e.dam (utgående) | 45725 | 45725 | Bild 202604 | OK |
| 115 | intern_underlag.js (STANDARD) | apr | e.varm (utgående) | 686678 | 686678 | Bild 202604 | OK |
| 116 | intern_underlag.js (STANDARD) | apr | p.rorlig (bild) | 19,16 | 19,16 | Bild 202604 | OK |
| 117 | intern_underlag.js (STANDARD) | apr | p.el (bild) | 68,29 | 68,29 | Bild 202604 | OK |
| 118 | intern_underlag.js (STANDARD) | apr | p.skatt (bild) | 36,00 | 36,00 | Bild 202604 | OK |
| 119 | bild mot faktura | apr | huvud ingående | 272408 | 272409 | Faktura 202604 s.2 / Bild 202604 | Avrundning (+1 kWh) |
| 120 | bild mot faktura | apr | huvud utgående | 299079 | 299080 | Faktura 202604 s.2 / Bild 202604 | Avrundning (+1 kWh) |
| 121 | bild mot faktura | apr | huvud förbrukning | 26671 | 26671 | Faktura 202604 s.2 / Bild 202604 | OK |
| 122 | bild mot faktura | apr | el inkl elcert | 68,29 | 68,29 | Faktura 202604 s.2 / Bild 202604 | OK |
| 123 | bild mot faktura | apr | rörlig nät | 19,16 | 19,16 | Faktura 202604 s.2 / Bild 202604 | OK |
| 124 | bild mot faktura | apr | energiskatt | 36,00 | 36,00 | Faktura 202604 s.2 / Bild 202604 | OK |
| 125 | intern_debitering.js (MANADER) | apr | krOre | 68,29 | 68,29 | Faktura 202604 s.2 | OK |
| 126 | intern_debitering.js (MANADER) | apr | hgKwh | 11582 | 11582 | Bild 202604 | OK |
| 127 | intern_debitering.js (MANADER) | apr | hgKr (rättat, utan fast avg.) | 17873 | 17873 | Bild 202604 minus fast avgift ×1,25 | OK |
| 128 | intern_underlag.js (STANDARD) | apr | facit (rättat) | 17873 | 17873 | Bild 202604 minus fast avgift ×1,25 | OK |
| 129 | enea_jamforelse.js (MANADER) | maj | kwh | 23941,02 | 23941,02 | Faktura 202605 s.2 | OK |
| 130 | enea_jamforelse.js (MANADER) | maj | fakturaKr | 56338 | 56338 | Faktura 202605 s.1 | OK |
| 131 | enea_jamforelse.js (MANADER) | maj | krOre (spot+rörl+påslag) | 95,00 | 95,00 | Faktura 202605 s.2 | OK |
| 132 | enea_jamforelse.js (MANADER) | maj | natOre | 20,39 | 20,39 | Faktura 202605 s.2 | OK |
| 133 | enea_jamforelse.js (MANADER) | maj | skattOre | 36,00 | 36,00 | Faktura 202605 s.2 | OK |
| 134 | enea_jamforelse.js (MANADER) | maj | fastNatKr | 8824,00 | 8824 | Faktura 202605 s.2 | OK |
| 135 | intern_underlag.js (STANDARD) | maj | faktura | 56338 | 56338 | Faktura 202605 s.1 | OK |
| 136 | intern_underlag.js (STANDARD) | maj | nr | 3141677009 | 3141677009 | Faktura 202605 s.1 | OK |
| 137 | intern_underlag.js (STANDARD) | maj | kwhFaktura | 23941,02 | 23941,02 | Faktura 202605 s.2 | OK |
| 138 | intern_underlag.js (STANDARD) | maj | p.rorlig | 20,39 | 20,39 | Faktura 202605 s.2 | OK |
| 139 | intern_underlag.js (STANDARD) | maj | p.el | 95,00 | 95,00 | Faktura 202605 s.2 | OK |
| 140 | intern_underlag.js (STANDARD) | maj | p.skatt | 36,00 | 36,00 | Faktura 202605 s.2 | OK |
| 141 | intern_underlag.js (STANDARD) | maj | faktura (bild) | 56338 | 56338 | Bild 202605 | OK |
| 142 | intern_underlag.js (STANDARD) | maj | nr (bild) | 3141677009 | 3141677009 | Bild 202605 | OK |
| 143 | intern_underlag.js (STANDARD) | maj | e.huvud (utgående) | 323021 | 323021 | Bild 202605 | OK |
| 144 | intern_underlag.js (STANDARD) | maj | e.herr (utgående) | 57338 | 57338 | Bild 202605 | OK |
| 145 | intern_underlag.js (STANDARD) | maj | e.dam (utgående) | 50173 | 50173 | Bild 202605 | OK |
| 146 | intern_underlag.js (STANDARD) | maj | e.varm (utgående) | 689165 | 689165 | Bild 202605 | OK |
| 147 | intern_underlag.js (STANDARD) | maj | p.rorlig (bild) | 20,39 | 20,39 | Bild 202605 | OK |
| 148 | intern_underlag.js (STANDARD) | maj | p.el (bild) | 95,00 | 95,00 | Bild 202605 | OK |
| 149 | intern_underlag.js (STANDARD) | maj | p.skatt (bild) | 36,00 | 36,00 | Bild 202605 | OK |
| 150 | bild mot faktura | maj | huvud ingående | 299079 | 299080 | Faktura 202605 s.2 / Bild 202605 | Avrundning (+1 kWh) |
| 151 | bild mot faktura | maj | huvud utgående | 323020 | 323021 | Faktura 202605 s.2 / Bild 202605 | Avrundning (+1 kWh) |
| 152 | bild mot faktura | maj | huvud förbrukning | 23941 | 23941 | Faktura 202605 s.2 / Bild 202605 | OK |
| 153 | bild mot faktura | maj | el inkl elcert | 95,00 | 95,00 | Faktura 202605 s.2 / Bild 202605 | OK |
| 154 | bild mot faktura | maj | rörlig nät | 20,39 | 20,39 | Faktura 202605 s.2 / Bild 202605 | OK |
| 155 | bild mot faktura | maj | energiskatt | 36,00 | 36,00 | Faktura 202605 s.2 / Bild 202605 | OK |
| 156 | intern_debitering.js (MANADER) | maj | krOre | 95,00 | 95,00 | Faktura 202605 s.2 | OK |
| 157 | intern_debitering.js (MANADER) | maj | hgKwh | 12430 | 12430 | Bild 202605 | OK |
| 158 | intern_debitering.js (MANADER) | maj | hgKr (rättat, utan fast avg.) | 23521 | 23521 | Bild 202605 minus fast avgift ×1,25 | OK |
| 159 | intern_underlag.js (STANDARD) | maj | facit (rättat) | 23521 | 23521 | Bild 202605 minus fast avgift ×1,25 | OK |
| 160 | enea_jamforelse.js (MANADER) | jun | kwh | 20609,34 | 20609,34 | Faktura 202606 s.2 | OK |
| 161 | enea_jamforelse.js (MANADER) | jun | fakturaKr | 53134 | 53134 | Faktura 202606 s.1 | OK |
| 162 | enea_jamforelse.js (MANADER) | jun | krOre (spot+rörl+påslag) | 106,45 | 106,45 | Faktura 202606 s.2 | OK |
| 163 | enea_jamforelse.js (MANADER) | jun | natOre | 20,99 | 20,99 | Faktura 202606 s.2 | OK |
| 164 | enea_jamforelse.js (MANADER) | jun | skattOre | 36,00 | 36,00 | Faktura 202606 s.2 | OK |
| 165 | enea_jamforelse.js (MANADER) | jun | fastNatKr | 8824,00 | 8824 | Faktura 202606 s.2 | OK |
| 166 | intern_underlag.js (STANDARD) | jun | faktura | 53134 | 53134 | Faktura 202606 s.1 | OK |
| 167 | intern_underlag.js (STANDARD) | jun | nr | 3154522605 | 3154522605 | Faktura 202606 s.1 | OK |
| 168 | intern_underlag.js (STANDARD) | jun | kwhFaktura | 20609,34 | 20609,34 | Faktura 202606 s.2 | OK |
| 169 | intern_underlag.js (STANDARD) | jun | p.rorlig | 20,99 | 20,99 | Faktura 202606 s.2 | OK |
| 170 | intern_underlag.js (STANDARD) | jun | p.el | 106,45 | 106,45 | Faktura 202606 s.2 | OK |
| 171 | intern_underlag.js (STANDARD) | jun | p.skatt | 36,00 | 36,00 | Faktura 202606 s.2 | OK |
| 172 | intern_underlag.js (STANDARD) | jun | faktura (bild) | 53134 | 53134 | Bild 202606 | OK |
| 173 | intern_underlag.js (STANDARD) | jun | nr (bild) | 3154522605 | 3154522605 | Bild 202606 | OK |
| 174 | intern_underlag.js (STANDARD) | jun | e.huvud (utgående) | 343630 | 343630 | Bild 202606 | OK |
| 175 | intern_underlag.js (STANDARD) | jun | e.herr (utgående) | 61254 | 61254 | Bild 202606 | OK |
| 176 | intern_underlag.js (STANDARD) | jun | e.dam (utgående) | 53688 | 53688 | Bild 202606 | OK |
| 177 | intern_underlag.js (STANDARD) | jun | e.varm (utgående) | 690588 | 690588 | Bild 202606 | OK |
| 178 | intern_underlag.js (STANDARD) | jun | p.rorlig (bild) | 20,99 | 20,99 | Bild 202606 | OK |
| 179 | intern_underlag.js (STANDARD) | jun | p.el (bild) | 106,45 | 106,45 | Bild 202606 | OK |
| 180 | intern_underlag.js (STANDARD) | jun | p.skatt (bild) | 36,00 | 36,00 | Bild 202606 | OK |
| 181 | bild mot faktura | jun | huvud ingående | 323020 | 323021 | Faktura 202606 s.2 / Bild 202606 | Avrundning (+1 kWh) |
| 182 | bild mot faktura | jun | huvud utgående | 343630 | 343630 | Faktura 202606 s.2 / Bild 202606 | OK |
| 183 | bild mot faktura | jun | huvud förbrukning | 20609 | 20609 | Faktura 202606 s.2 / Bild 202606 | OK |
| 184 | bild mot faktura | jun | el inkl elcert | 106,45 | 106,45 | Faktura 202606 s.2 / Bild 202606 | OK |
| 185 | bild mot faktura | jun | rörlig nät | 20,99 | 20,99 | Faktura 202606 s.2 / Bild 202606 | OK |
| 186 | bild mot faktura | jun | energiskatt | 36,00 | 36,00 | Faktura 202606 s.2 / Bild 202606 | OK |
| 187 | intern_debitering.js (MANADER) | jun | krOre | 106,45 | 106,45 | Faktura 202606 s.2 | OK |
| 188 | intern_debitering.js (MANADER) | jun | hgKwh | 11756 | 11756 | Bild 202606 | OK |
| 189 | intern_debitering.js (MANADER) | jun | hgKr (rättat, utan fast avg.) | 24017 | 24017 | Bild 202606 minus fast avgift ×1,25 | OK |
| 190 | intern_underlag.js (STANDARD) | jun | facit (rättat) | 24017 | 24017 | Bild 202606 minus fast avgift ×1,25 | OK |
| 191 | bild (kedja) | feb | huvud ingående = förra utgående | 212333 | 212333 | Bilder 202601/202602 | OK |
| 192 | bild (kedja) | feb | herr ingående = förra utgående | 33683 | 33683 | Bilder 202601/202602 | OK |
| 193 | bild (kedja) | feb | dam ingående = förra utgående | 28997 | 28997 | Bilder 202601/202602 | OK |
| 194 | bild (kedja) | feb | varm ingående = förra utgående | 673964 | 673964 | Bilder 202601/202602 | OK |
| 195 | bild (kedja) | feb | bastu ingående = förra utgående | 62680 | 62680 | Bilder 202601/202602 | OK |
| 196 | bild (kedja) | mar | huvud ingående = förra utgående | 244335 | 244335 | Bilder 202602/202603 | OK |
| 197 | bild (kedja) | mar | herr ingående = förra utgående | 40360 | 40360 | Bilder 202602/202603 | OK |
| 198 | bild (kedja) | mar | dam ingående = förra utgående | 34159 | 34159 | Bilder 202602/202603 | OK |
| 199 | bild (kedja) | mar | varm ingående = förra utgående | 677785 | 677785 | Bilder 202602/202603 | OK |
| 200 | bild (kedja) | mar | bastu ingående = förra utgående | 74519 | 74519 | Bilder 202602/202603 | OK |
| 201 | bild (kedja) | apr | huvud ingående = förra utgående | 272409 | 272409 | Bilder 202603/202604 | OK |
| 202 | bild (kedja) | apr | herr ingående = förra utgående | 46950 | 46950 | Bilder 202603/202604 | OK |
| 203 | bild (kedja) | apr | dam ingående = förra utgående | 40312 | 40312 | Bilder 202603/202604 | OK |
| 204 | bild (kedja) | apr | varm ingående = förra utgående | 682814 | 682814 | Bilder 202603/202604 | OK |
| 205 | bild (kedja) | apr | bastu ingående = förra utgående | 87262 | 87262 | Bilder 202603/202604 | OK |
| 206 | bild (kedja) | maj | huvud ingående = förra utgående | 299080 | 299080 | Bilder 202604/202605 | OK |
| 207 | bild (kedja) | maj | herr ingående = förra utgående | 52762 | 52762 | Bilder 202604/202605 | OK |
| 208 | bild (kedja) | maj | dam ingående = förra utgående | 45725 | 45725 | Bilder 202604/202605 | OK |
| 209 | bild (kedja) | maj | varm ingående = förra utgående | 686678 | 686678 | Bilder 202604/202605 | OK |
| 210 | bild (kedja) | maj | bastu ingående = förra utgående | 98487 | 98487 | Bilder 202604/202605 | OK |
| 211 | bild (kedja) | jun | huvud ingående = förra utgående | 323021 | 323021 | Bilder 202605/202606 | OK |
| 212 | bild (kedja) | jun | herr ingående = förra utgående | 57338 | 57338 | Bilder 202605/202606 | OK |
| 213 | bild (kedja) | jun | dam ingående = förra utgående | 50173 | 50173 | Bilder 202605/202606 | OK |
| 214 | bild (kedja) | jun | varm ingående = förra utgående | 689165 | 689165 | Bilder 202605/202606 | OK |
| 215 | bild (kedja) | jun | bastu ingående = förra utgående | 107511 | 107511 | Bilder 202605/202606 | OK |
| 216 | faktura (kedja) | feb | ingående = förra utgående | 212332,46 | 212332,46 | Fakturor | OK |
| 217 | faktura (kedja) | mar | ingående = förra utgående | 244334,60 | 244334,60 | Fakturor | OK |
| 218 | faktura (kedja) | apr | ingående = förra utgående | 272408,12 | 272408,12 | Fakturor | OK |
| 219 | faktura (kedja) | maj | ingående = förra utgående | 299079,26 | 299079,26 | Fakturor | OK |
| 220 | faktura (kedja) | jun | ingående = förra utgående | 323020,28 | 323020,28 | Fakturor | OK |


### 2.1 Avvikelser i data, klassade

| Nr | Var | Avvikelse | Klass | Kommentar |
|---|---|---|---|---|
| 1 | Bilder, huvudmätare, 9 ställningar (jan in/ut, feb in, mar ut, apr in/ut, maj in/ut, jun in) | Bildens heltal är 1 kWh högre än fakturans avrundade ställning (t.ex. 176 910,32 → bild 176 911) | Avrundning | Förbrukningen per månad stämmer ändå med fakturan inom 1 kWh (35 422, 32 002, 28 074, 26 671, 23 941, 20 609). Underlaget avrundar inte alltid till närmaste heltal, men skillnaden är högst 1 kWh. |
| 2 | Maj, mätare bastu dam | Bilden visar förbrukning 4 449. Ställningarna i bilden (45 725 → 50 173) ger 4 448 | Avrundning | Kalkylbladet har decimaler bakom de visade heltalen. Sidan räknar 4 448. Bastu totalt (9 024) stämmer ändå. |
| 3 | Juni, bastu totalt / hyresgästens kWh | Bilden: bastu 7 430, hyresgäst 11 756. Ställningarna i bilden ger herr 3 916 + dam 3 515 = 7 431, hyresgäst 11 755 | Avrundning | Ger −2 kr mot debiterat i underlaget. `intern_debitering.js` använder 11 756 (bilden) och underlaget 11 755. Se förslag i avsnitt 6. |
| 4 | Bildernas kr-rader | Belopp ÷ öre ger hyresgäst-kWh med decimaler (t.ex. jan 16 585,78, apr 11 582,34), inte de visade heltalen | Avrundning | Förklarar att sidans kr-rader skiljer sig från bildens med några ören upp till ca 1 kr (juni el: 12 513,20 mot 12 514,21). Totalen ligger inom ±2 kr. |
| 5 | Bild jan och apr–jun, öre-summa | Bilden räknar med fast avgift i öre-summan (205,02 / 156,53 / 188,25 / 206,26). Sidan visar 180,11 / 123,45 / 151,39 / 163,44 | Tolkning | Följer beslutet att fast nätavgift aldrig debiteras (PRD 4.3). Rätt i sak. |
| 6 | Bild jan, fast avgift | 24,91 öre/kWh står i bilden, men kWh-kolumnen är 0 och beloppet 0,00 | Tolkning | 24,91 = 8 824 / 35 422,14. Januari debiterades redan utan fast avgift. |

## 3. Fakturornas egen räkning

Alla 30 kWh-rader (5 per månad), fast avgift, månadsavgift och mätarställningar:

| Månad | Rad | kWh | öre/kWh (fakturan) | kWh × öre / 100 | Belopp (fakturan) | Skillnad (kr) | Implicit öre/kWh | Klass |
|---|---|---:|---:|---:|---:|---:|---:|---|
| jan | Elöverföring | 35422,14 | 21,87 | 7746,82 | 7746,57 | -0,25 | 21,8693 | Avrundning av öre-priset |
| jan | Energiskatt | 35422,14 | 36,00 | 12751,97 | 12751,97 | 0,00 | 36,0000 | OK |
| jan | Spotpris | 35422,14 | 117,38 | 41578,51 | 41578,77 | 0,26 | 117,3807 | Avrundning av öre-priset |
| jan | Rörliga kostnader | 35422,14 | 3,16 | 1119,34 | 1119,34 | 0,00 | 3,1600 | OK |
| jan | Fast påslag | 35422,14 | 1,70 | 602,18 | 602,18 | 0,00 | 1,7000 | OK |
| jan | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| jan | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| jan | Mätarställning | 176910,32 → 212332,46 | – | 35422,14 | användning 35422,14 | 0,00 | – | OK |
| feb | Elöverföring | 32002,14 | 21,84 | 6989,27 | 6987,79 | -1,48 | 21,8354 | Avrundning av öre-priset |
| feb | Energiskatt | 32002,14 | 36,00 | 11520,77 | 11520,77 | 0,00 | 36,0000 | OK |
| feb | Spotpris | 32002,14 | 116,68 | 37340,10 | 37341,25 | 1,15 | 116,6836 | Avrundning av öre-priset |
| feb | Rörliga kostnader | 32002,14 | 3,18 | 1017,67 | 1017,67 | 0,00 | 3,1800 | OK |
| feb | Fast påslag | 32002,14 | 1,70 | 544,04 | 544,04 | 0,00 | 1,7000 | OK |
| feb | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| feb | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| feb | Mätarställning | 212332,46 → 244334,60 | – | 32002,14 | användning 32002,14 | 0,00 | – | OK |
| mar | Elöverföring | 28073,52 | 20,33 | 5707,35 | 5707,96 | 0,61 | 20,3322 | Avrundning av öre-priset |
| mar | Energiskatt | 28073,52 | 36,00 | 10106,47 | 10106,47 | 0,00 | 36,0000 | OK |
| mar | Spotpris | 28073,52 | 86,59 | 24308,86 | 24309,70 | 0,84 | 86,5930 | Avrundning av öre-priset |
| mar | Rörliga kostnader | 28073,52 | 4,58 | 1285,77 | 1285,77 | 0,00 | 4,5800 | OK |
| mar | Fast påslag | 28073,52 | 1,70 | 477,25 | 477,25 | 0,00 | 1,7000 | OK |
| mar | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| mar | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| mar | Mätarställning | 244334,60 → 272408,12 | – | 28073,52 | användning 28073,52 | 0,00 | – | OK |
| apr | Elöverföring | 26671,14 | 19,16 | 5110,19 | 5109,36 | -0,83 | 19,1569 | Avrundning av öre-priset |
| apr | Energiskatt | 26671,14 | 36,00 | 9601,61 | 9601,61 | 0,00 | 36,0000 | OK |
| apr | Spotpris | 26671,14 | 63,12 | 16834,82 | 16834,93 | 0,11 | 63,1204 | Avrundning av öre-priset |
| apr | Rörliga kostnader | 26671,14 | 3,47 | 925,49 | 925,48 | -0,01 | 3,4700 | Avrundning av öre-priset |
| apr | Fast påslag | 26671,14 | 1,70 | 453,41 | 453,41 | 0,00 | 1,7000 | OK |
| apr | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| apr | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| apr | Mätarställning | 272408,12 → 299079,26 | – | 26671,14 | användning 26671,14 | 0,00 | – | OK |
| maj | Elöverföring | 23941,02 | 20,39 | 4881,57 | 4882,62 | 1,05 | 20,3944 | Avrundning av öre-priset |
| maj | Energiskatt | 23941,02 | 36,00 | 8618,77 | 8618,77 | 0,00 | 36,0000 | OK |
| maj | Spotpris | 23941,02 | 88,19 | 21113,59 | 21114,59 | 1,00 | 88,1942 | Avrundning av öre-priset |
| maj | Rörliga kostnader | 23941,02 | 5,11 | 1223,39 | 1223,38 | -0,01 | 5,1100 | Avrundning av öre-priset |
| maj | Fast påslag | 23941,02 | 1,70 | 407,00 | 407,00 | 0,00 | 1,7000 | OK |
| maj | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| maj | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| maj | Mätarställning | 299079,26 → 323020,28 | – | 23941,02 | användning 23941,02 | 0,00 | – | OK |
| jun | Elöverföring | 20609,34 | 20,99 | 4325,90 | 4325,12 | -0,78 | 20,9862 | Avrundning av öre-priset |
| jun | Energiskatt | 20609,34 | 36,00 | 7419,36 | 7419,36 | 0,00 | 36,0000 | OK |
| jun | Spotpris | 20609,34 | 100,09 | 20627,89 | 20627,95 | 0,06 | 100,0903 | Avrundning av öre-priset |
| jun | Rörliga kostnader | 20609,34 | 4,66 | 960,40 | 960,39 | -0,01 | 4,6600 | Avrundning av öre-priset |
| jun | Fast påslag | 20609,34 | 1,70 | 350,36 | 350,36 | 0,00 | 1,7000 | OK |
| jun | Fast avgift | – | – | 1 mån × 8824,00 | 8824,00 | 0,00 | – | OK |
| jun | Månadsavgift elhandel | – | – | 1 mån × 0,00 | (inget belopp) | – | – | OK |
| jun | Mätarställning | 323020,28 → 343629,62 | – | 20609,34 | användning 20609,34 | 0,00 | – | OK |

**Summor, moms och totalbelopp per faktura:**

| Månad | Fakturanr | kWh | Max avvikelse kWh × öre mot radbelopp (kr) | Moms elnät 25 % | Moms elhandel 25 % | Summa exkl. moms | Totalt inkl. öresutjämning | Spot + rörliga + påslag (öre/kWh) |
|---|---|---:|---|---|---|---|---|---:|
| jan | 3082197306 | 35422,14 | spotpris 0,26 kr | 7330,64 räknat, 7330,64 fakturan | 10825,07 räknat, 10825,07 fakturan | 72622,83 = 72622,83 | 90778,54 + 0,46 = 90779,00 (fakturan 90779) | 122,24 |
| feb | 3098735503 | 32002,14 | elöverföring -1,48 kr | 6833,14 räknat, 6833,14 fakturan | 9725,74 räknat, 9725,73 fakturan | 66235,52 = 66235,52 | 82794,39 + -0,39 = 82794,00 (fakturan 82794) | 121,56 |
| mar | 3112109404 | 28073,52 | spotpris 0,84 kr | 6159,61 räknat, 6159,61 fakturan | 6518,18 räknat, 6518,19 fakturan | 50711,15 = 50711,15 | 63388,95 + 0,05 = 63389,00 (fakturan 63389) | 92,87 |
| apr | 3126369101 | 26671,14 | elöverföring -0,83 kr | 5883,74 räknat, 5883,75 fakturan | 4553,46 räknat, 4553,45 fakturan | 41748,79 = 41748,79 | 52185,99 + 0,01 = 52186,00 (fakturan 52186) | 68,29 |
| maj | 3141677009 | 23941,02 | elöverföring 1,05 kr | 5581,35 räknat, 5581,35 fakturan | 5686,24 räknat, 5686,25 fakturan | 45070,36 = 45070,36 | 56337,96 + 0,04 = 56338,00 (fakturan 56338) | 95,00 |
| jun | 3154522605 | 20609,34 | elöverföring -0,78 kr | 5142,12 räknat, 5142,12 fakturan | 5484,68 räknat, 5484,67 fakturan | 42507,18 = 42507,18 | 53133,97 + 0,03 = 53134,00 (fakturan 53134) | 106,45 |


**Slutsats om fakturorna:** Fakturorna räknar rätt.

- Energiskatt, rörliga kostnader och fast påslag stämmer på öret (rörliga kostnader i april–juni på 0,01 kr).
- Elöverföring och spotpris avviker med upp till 1,48 kr. Det implicita priset (belopp ÷ kWh) har fler decimaler än fakturans öre-pris, till exempel 117,3807 i stället för 117,38. Det tyder på att beloppet räknas per kvart och att öre-priset är ett avrundat snitt. Det är avrundning, inte fel.
- Momsraderna avviker högst 0,01 kr från 25 % av delsumman (avrundning per rad).
- Summa exkl. moms + moms + öresutjämning = totalbeloppet varje månad.
- "Spot + rörliga + påslag" ger exakt de värden som står i sidans `krOre`.

## 4. Formler

### 4.1 Faktura med Eneas: README-formeln mot sidan och mot beräkning från grunden

- **README-formeln (egen beräkning):** faktura idag + ((Eneas − Kraftringens "El inkl elcert") × kWh / 100 + månadsavgift) × 1,25, avrundat till hela kronor.
- **Från grunden:** (fast nätavgift 8 824 + kWh × (elöverföring + energiskatt + Eneas pris) / 100 + månadsavgift) × 1,25, avrundat. Allt med fakturans öre-priser och kWh, utan fakturans belopp.
- **Restaurang, formel:** debiterat idag + (Eneas − Kraftringen) / 100 × hyresgäst-kWh × 1,25 (som `intern_debitering.js`).
- **Restaurang, grunden:** (rörlig nät + Eneas + energiskatt) × hyresgäst-kWh / 100 × 1,25.

"Sidan" = det belopp som `enea_jamforelse.html` respektive `intern_debitering.html` visade i Chromium efter att priserna fyllts i.

Prisuppsättningar:
S1 = samma som Kraftringen.
S2 = 100 öre.
S3 = 100 öre + 500 kr/mån.
S4 = Kraftringen − 10 öre.
S5 = Kraftringen + 5 öre + 250 kr/mån.
S6 = 0 öre.
S7 = decimaler, komma och punkt (95,5 / 88.25 / 70,1 / 55,75 / 80,4 / 90,05) + avgift skriven "1 000".
S8 = 110 / 105 / 80 / 60 / 85 / 95.
S9 = som S8 + 399 kr/mån.
S10 = 250 öre.
S11 = bara januari (120) och juni (100) + 100 kr/mån.

| Scenario | Månad | Eneas öre/kWh | Månadsavgift (kr) | Sidan (kr) | README-formel, egen (kr) | Från grunden (kr) | Sidan − grunden | Restaurang, sidan | Restaurang, formel | Restaurang, grunden |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| S1 | jan | 122,24 | 0 | 90779 | 90779 | 90779 | +0 | 37341 | 37341 | 37341 |
| S1 | feb | 121,56 | 0 | 82794 | 82794 | 82795 | -1 | 36647 | 36647 | 36647 |
| S1 | mar | 92,87 | 0 | 63389 | 63389 | 63387 | +2 | 19213 | 19213 | 19213 |
| S1 | apr | 68,29 | 0 | 52186 | 52186 | 52187 | -1 | 17873 | 17873 | 17872 |
| S1 | maj | 95,00 | 0 | 56338 | 56338 | 56335 | +3 | 23521 | 23521 | 23522 |
| S1 | jun | 106,45 | 0 | 53134 | 53134 | 53135 | -1 | 24017 | 24017 | 24018 |
| S2 | jan | 100 | 0 | 80932 | 80932 | 80931 | +1 | 32730 | 32730 | 32730 |
| S2 | feb | 100 | 0 | 74169 | 74169 | 74170 | -1 | 32243 | 32243 | 32243 |
| S2 | mar | 100 | 0 | 65891 | 65891 | 65889 | +2 | 20131 | 20131 | 20131 |
| S2 | apr | 100 | 0 | 62758 | 62758 | 62759 | -1 | 22464 | 22464 | 22463 |
| S2 | maj | 100 | 0 | 57834 | 57834 | 57832 | +2 | 24298 | 24298 | 24299 |
| S2 | jun | 100 | 0 | 51472 | 51472 | 51473 | -1 | 23069 | 23069 | 23070 |
| S3 | jan | 100 | 500 | 81557 | 81557 | 81556 | +1 | 32730 | 32730 | 32730 |
| S3 | feb | 100 | 500 | 74794 | 74794 | 74795 | -1 | 32243 | 32243 | 32243 |
| S3 | mar | 100 | 500 | 66516 | 66516 | 66514 | +2 | 20131 | 20131 | 20131 |
| S3 | apr | 100 | 500 | 63383 | 63383 | 63384 | -1 | 22464 | 22464 | 22463 |
| S3 | maj | 100 | 500 | 58459 | 58459 | 58457 | +2 | 24298 | 24298 | 24299 |
| S3 | jun | 100 | 500 | 52097 | 52097 | 52098 | -1 | 23069 | 23069 | 23070 |
| S4 | jan | 112,24 | 0 | 86351 | 86351 | 86351 | +0 | 35268 | 35268 | 35268 |
| S4 | feb | 111,56 | 0 | 78794 | 78794 | 78795 | -1 | 34604 | 34604 | 34604 |
| S4 | mar | 82,87 | 0 | 59880 | 59880 | 59878 | +2 | 17925 | 17925 | 17925 |
| S4 | apr | 58,29 | 0 | 48852 | 48852 | 48853 | -1 | 16425 | 16425 | 16425 |
| S4 | maj | 85,00 | 0 | 53345 | 53345 | 53343 | +2 | 21967 | 21967 | 21968 |
| S4 | jun | 96,45 | 0 | 50558 | 50558 | 50559 | -1 | 22548 | 22548 | 22548 |
| S5 | jan | 127,24 | 250 | 93305 | 93305 | 93305 | +0 | 38378 | 38378 | 38378 |
| S5 | feb | 126,56 | 250 | 85107 | 85107 | 85107 | +0 | 37668 | 37668 | 37668 |
| S5 | mar | 97,87 | 250 | 65456 | 65456 | 65454 | +2 | 19857 | 19857 | 19857 |
| S5 | apr | 73,29 | 250 | 54165 | 54165 | 54166 | -1 | 18597 | 18597 | 18596 |
| S5 | maj | 100,00 | 250 | 58147 | 58147 | 58144 | +3 | 24298 | 24298 | 24299 |
| S5 | jun | 111,45 | 250 | 54735 | 54735 | 54735 | +0 | 24752 | 24752 | 24752 |
| S6 | jan | 0 | 0 | 36654 | 36654 | 36653 | +1 | 11998 | 11998 | 11998 |
| S6 | feb | 0 | 0 | 34167 | 34167 | 34168 | -1 | 11815 | 11815 | 11815 |
| S6 | mar | 0 | 0 | 30799 | 30799 | 30797 | +2 | 7254 | 7254 | 7254 |
| S6 | apr | 0 | 0 | 29419 | 29419 | 29420 | -1 | 7986 | 7986 | 7986 |
| S6 | maj | 0 | 0 | 27908 | 27908 | 27905 | +3 | 8760 | 8760 | 8762 |
| S6 | jun | 0 | 0 | 25711 | 25711 | 25712 | -1 | 8374 | 8374 | 8375 |
| S7 | jan | 95,5 | 1000 | 80189 | 80189 | 80189 | +0 | 31797 | 31797 | 31797 |
| S7 | feb | 88,25 | 1000 | 70719 | 70719 | 70720 | -1 | 29843 | 29843 | 29843 |
| S7 | mar | 70,1 | 1000 | 56649 | 56649 | 56647 | +2 | 16281 | 16281 | 16281 |
| S7 | apr | 55,75 | 1000 | 49255 | 49255 | 49256 | -1 | 16058 | 16058 | 16057 |
| S7 | maj | 80,4 | 1000 | 53219 | 53219 | 53216 | +3 | 21253 | 21253 | 21254 |
| S7 | jun | 90,05 | 1000 | 50159 | 50159 | 50160 | -1 | 21607 | 21607 | 21608 |
| S8 | jan | 110 | 0 | 85359 | 85359 | 85359 | +0 | 34803 | 34803 | 34804 |
| S8 | feb | 105 | 0 | 76170 | 76170 | 76170 | +0 | 33264 | 33264 | 33264 |
| S8 | mar | 80 | 0 | 58873 | 58873 | 58871 | +2 | 17556 | 17556 | 17556 |
| S8 | apr | 60 | 0 | 49422 | 49422 | 49423 | -1 | 16673 | 16673 | 16672 |
| S8 | maj | 85 | 0 | 53345 | 53345 | 53343 | +2 | 21967 | 21967 | 21968 |
| S8 | jun | 95 | 0 | 50184 | 50184 | 50185 | -1 | 22334 | 22334 | 22335 |
| S9 | jan | 110 | 399 | 85858 | 85858 | 85858 | +0 | 34803 | 34803 | 34804 |
| S9 | feb | 105 | 399 | 76668 | 76668 | 76669 | -1 | 33264 | 33264 | 33264 |
| S9 | mar | 80 | 399 | 59371 | 59371 | 59370 | +1 | 17556 | 17556 | 17556 |
| S9 | apr | 60 | 399 | 49921 | 49921 | 49922 | -1 | 16673 | 16673 | 16672 |
| S9 | maj | 85 | 399 | 53844 | 53844 | 53842 | +2 | 21967 | 21967 | 21968 |
| S9 | jun | 95 | 399 | 50683 | 50683 | 50684 | -1 | 22334 | 22334 | 22335 |
| S10 | jan | 250 | 0 | 147348 | 147348 | 147348 | +0 | 63829 | 63829 | 63829 |
| S10 | feb | 250 | 0 | 134173 | 134173 | 134174 | -1 | 62884 | 62884 | 62884 |
| S10 | mar | 250 | 0 | 118529 | 118529 | 118527 | +2 | 39447 | 39447 | 39448 |
| S10 | apr | 250 | 0 | 112766 | 112766 | 112767 | -1 | 44180 | 44180 | 44180 |
| S10 | maj | 250 | 0 | 102724 | 102724 | 102721 | +3 | 47604 | 47604 | 47605 |
| S10 | jun | 250 | 0 | 90115 | 90115 | 90116 | -1 | 45112 | 45112 | 45112 |
| S11 | jan | 120 | 100 | 89912 | 89912 | 89912 | +0 | 36877 | 36877 | 36877 |
| S11 | jun | 100 | 100 | 51597 | 51597 | 51598 | -1 | 23069 | 23069 | 23070 |


**Resultat.**

- Sidan = README-formeln i 66 av 66 fall. Restaurangsidan = sin formel i 66 av 66 fall.
- Sidan − från grunden: −1 till +3 kr (helfakturan) och −2 till +1 kr (restaurangen). Det ligger inom 3 kr.
- Månadsavgiften läggs på hela fakturan exkl. moms och får moms: 500 kr ger +625 kr per månad (S3 mot S2). Komma, punkt och mellanslag i "1 000" tolkas rätt (S7).
- Skillnaden mellan formel och grunden kommer från två saker. Den ena är fakturans egen avrundning av öre-priserna (elöverföring och spotpris, högst 1,48 kr exkl. moms). Den andra är öresutjämningen.
- README-formeln drar bort Kraftringens el som `krOre` × kWh. Fakturans faktiska elbelopp (spot + rörliga + påslag i kr) är 0,05–1,15 kr högre per månad. Det ger högst 1,44 kr inkl. moms (februari) i Eneas belopp. Det är avrundning och godtagbart.

**Summarader (tabell 2, `enea_jamforelse.html`)**, avlästa ur sidan: kWh | faktura med Eneas | vägt snitt öre | skillnad kr | skillnad %. Kontrollräknade: till exempel S2 är 80 932 + 74 169 + 65 891 + 62 758 + 57 834 + 51 472 = 393 056, och 393 056 − 398 620 = −5 564. S11 räknar bara de två ifyllda månaderna (56 031 kWh = 35 422,14 + 20 609,34).

- **S1 Samma som Kraftringen, ingen avgift:** Summa / vägt snitt | 166 719 | 398 620 | 102,67 | 0 | 0,0
- **S2 100 öre alla månader, ingen avgift:** Summa / vägt snitt | 166 719 | 393 056 | 100,00 | -5 564 | -1,4
- **S3 100 öre alla månader, avgift 500 kr:** Summa / vägt snitt | 166 719 | 396 806 | 100,00 | -1 814 | -0,5
- **S4 Kraftringen − 10 öre, ingen avgift:** Summa / vägt snitt | 166 719 | 377 780 | 92,67 | -20 840 | -5,2
- **S5 Kraftringen + 5 öre, avgift 250 kr:** Summa / vägt snitt | 166 719 | 410 915 | 107,67 | +12 295 | +3,1
- **S6 0 öre (gränsfall), ingen avgift:** Summa / vägt snitt | 166 719 | 184 658 | 0,00 | -213 962 | -53,7
- **S7 Decimaler och komma: 95,5 / 88.25 / 70,1 / 55,75 / 80,4 / 90,05, avgift "1 000":** Summa / vägt snitt | 166 719 | 360 190 | 80,63 | -38 430 | -9,6
- **S8 Varierande: 110 / 105 / 80 / 60 / 85 / 95, ingen avgift:** Summa / vägt snitt | 166 719 | 373 353 | 90,55 | -25 267 | -6,3
- **S9 Varierande som S8, avgift 399 kr:** Summa / vägt snitt | 166 719 | 376 345 | 90,55 | -22 275 | -5,6
- **S10 250 öre alla månader, avgift 0:** Summa / vägt snitt | 166 719 | 705 655 | 250,00 | +307 035 | +77,0
- **S11 Bara jan och jun ifyllda (120 / 100), avgift 100 kr:** Summa / vägt snitt | 56 031 | 141 509 | 112,64 | -2 404 | -1,7

### 4.2 Debiteringsunderlaget från mätarställningar (PRD avsnitt 5), alla sex månader

Räknat med de mätarställningar som står i `intern_underlag.js` (alla lika med bilderna, avsnitt 2). Ingående ställning = föregående månads utgående. Fast nätavgift = 0.

Exempel januari:
- Förbrukning: huvud 212 333 − 176 911 = 35 422. Herr 33 683 − 25 833 = 7 850. Dam 28 997 − 22 118 = 6 879. Bastu totalt 14 729. Varmvatten 673 964 − 669 857 = 4 107.
- Hyresgästens kWh: 35 422 − 14 729 − 4 107 = 16 586.
- Kostnad per rad: 16 586 × 21,87 / 100 = 3 627,36; 16 586 × 122,24 / 100 = 20 274,73; 16 586 × 36,00 / 100 = 5 970,96.
- Summa exkl. moms 29 873,04, moms 7 468,26, totalt 37 341,30, avrundat 37 341.

| Månad | Huvud kWh | Herr | Dam | Bastu | Varmv. | Hyresgäst kWh | Rörlig nät kr | El inkl elcert kr | Energiskatt kr | Exkl. moms | Moms | Totalt (egen = sidan) | Debiterat (rättat) | Diff | Klass |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| jan | 35 422 | 7 850 | 6 879 | 14 729 | 4 107 | 16 586 | 3 627,36 | 20 274,73 | 5 970,96 | 29 873,04 | 7 468,26 | 37 341 | 37 341 | 0 | OK |
| feb | 32 002 | 6 677 | 5 162 | 11 839 | 3 821 | 16 342 | 3 569,09 | 19 865,34 | 5 883,12 | 29 317,55 | 7 329,39 | 36 647 | 36 647 | 0 | OK |
| mar | 28 074 | 6 590 | 6 153 | 12 743 | 5 029 | 10 302 | 2 094,40 | 9 567,47 | 3 708,72 | 15 370,58 | 3 842,65 | 19 213 | 19 213 | 0 | OK |
| apr | 26 671 | 5 812 | 5 413 | 11 225 | 3 864 | 11 582 | 2 219,11 | 7 909,35 | 4 169,52 | 14 297,98 | 3 574,49 | 17 872 | 17 873 | −1 | Avrundning |
| maj | 23 941 | 4 576 | 4 448 | 9 024 | 2 487 | 12 430 | 2 534,48 | 11 808,50 | 4 474,80 | 18 817,78 | 4 704,44 | 23 522 | 23 521 | +1 | Avrundning |
| jun | 20 609 | 3 916 | 3 515 | 7 431 | 1 423 | 11 755 | 2 467,37 | 12 513,20 | 4 231,80 | 19 212,37 | 4 803,09 | 24 015 | 24 017 | −2 | Avrundning |

Sidan (`intern_debitering.html`, månad för månad i Chromium) visade exakt samma förbrukning, kr per rad, exkl. moms, moms och totalt som min egen beräkning.

**Kontroll av de rättade beloppen i PRD 4.3**, räknade på bildernas kr-rader utan fast avgift:
- April: 2 219,18 + 7 909,58 + 4 169,64 = 14 298,40, moms 3 574,60, totalt 17 873,00.
- Maj: 18 817,15, moms 4 704,29, totalt 23 521,44 → 23 521.
- Juni: 19 213,92, moms 4 803,48, totalt 24 017,40 → 24 017.

Alla tre stämmer med PRD 4.3. Bildernas gamla totalbelopp med fast avgift (22 662, 29 248 och 30 310) stämmer också med bildens egen räkning (summa × 1,25).

**PRD 4.1 och 4.2** stämmer med källorna:
- kWh-summa 166 719 (166 719,30).
- Fakturasumma 398 620.
- Restaurangens kWh 78 998 och belopp 158 612 kr.

## 5. Antaganden

**(a) Att Kraftringens "El inkl elcert" är jämförbart med ett Eneas-pris, och om elcertifikat ingår. Bedömning: oklart.**
- Det som stämmer: summan spotpris + rörliga kostnader + fast påslag är hela Kraftringens elhandel. Månadsavgiften är 0 kr. Att byta ut just den summan mot Eneas pris är alltså rätt avgränsning.
- Det som är oklart: fakturan nämner inte elcertifikat. Posten heter "Fast påslag (1,70 öre/kWh)". Rubriken "El inkl Elcert (1,7 öre/kWh)" kommer från det interna kalkylbladet och kan läsas som att 1,7 öre är elcertifikat. Det stöds inte av fakturan.
- Elleverantörer är kvotpliktiga, och kostnaden för elcertifikat brukar ingå i elpriset till kunden ([Ekonomifakta, 2010](https://www.ekonomifakta.se/sakomraden/energi/elkonsumentens-del-i-elcertifikatsystemet_1208586.html)). Den ligger troligen någonstans i spotpris, rörliga kostnader eller påslag, men var framgår inte. Regeringen har dessutom gett Energimyndigheten i uppdrag att föreslå ett tidigare avslut av elcertifikatsystemet ([Regeringskansliet, 2026](https://regeringen.se/regeringsuppdrag/2026/06/uppdrag-till-statens-energimyndighet-att-ta-fram-forslag-for-att-mojliggora-ett-tidigare-avslut-av-elcertifikatsystemet/)).
- Det viktiga är att Eneas pris omfattar samma saker som Kraftringens tre poster tillsammans.
- *Förslag till formulering:* "Kraftringens pris för elen är summan av spotpris, rörliga kostnader och fast påslag (1,70 öre/kWh) enligt fakturan. Fakturan anger inte om elcertifikat ingår, eller i vilken post. Eneas pris ska därför omfatta allt som Eneas tar betalt för själva elen (elcertifikat, påslag, profil- och balanskostnader, avgifter per kWh), så att det motsvarar de tre posterna tillsammans." Byt gärna rubriken "El inkl Elcert (1,7 öre/kWh)" mot "El (spot + rörliga + påslag)".

**(b) Att nät, energiskatt och fast nätavgift är oförändrade. Bedömning: rimligt.**
- Elnätsföretaget kan inte bytas, bara elhandelsföretaget ([Energimarknadsbyrån, u.å.](https://energimarknadsbyran.se/media/1093/byta-elhandelsforetag.pdf)).
- Energiskatten tas ut av nätinnehavaren ([Skatteverket, u.å.a](https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/energiskatter/skattpael)) och står under "Elnät" på fakturan. Den är 36,0 öre/kWh från 1 januari 2026 ([Skatteverket, 2025](https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/nyheterinompunktskatter/2025/nyheterinompunktskatter/sanktskattpael1januari2026.5.1522bf3f19aea8075ba96f.html)), vilket stämmer med fakturorna.
- En reservation: efter ett byte kommer oftast två fakturor (Energimarknadsbyrån, u.å.). Om nätbolaget eller Eneas tar en faktureringsavgift fångas den inte i dag, utom via Eneas månadsavgift.
- *Förslag till formulering:* "Elnätet (Kraftringen Nät AB) kan inte bytas. Fast avgift, elöverföring och energiskatt (36,00 öre/kWh 2026) är därför desamma med Eneas. Eventuella nya avgifter vid separata fakturor ska anges som Eneas månadsavgift."

**(c) Att moms är 25 % och gäller på samma sätt hos Eneas. Bedömning: rimligt.**
- 25 % är den generella momssatsen ([Skatteverket, u.å.b](https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momssatspavarorochtjanster.4.58d555751259e4d66168000409.html)). Fakturorna har 25 % på både elnät och elhandel. Samma sats gäller för elhandel oavsett leverantör.
- En reservation: om Bjerreds Saltsjöbad drar av ingående moms är jämförelsen exkl. moms den relevanta. Skillnaden i procent blir då en annan, eftersom fakturan idag har öresutjämning och fast avgift med i underlaget.
- *Förslag till formulering:* "Beloppen är inklusive 25 % moms, samma sats hos båda leverantörerna. Skillnaden exkl. moms är skillnaden inkl. moms delad med 1,25."

**(d) Att restaurangens kWh = total − bastu − varmvatten. Bedömning: oklart.**
- Räkningen följer dagens underlag och PRD avsnitt 5 och är rätt utförd.
- I sak betyder den att all el som inte går genom bastu- eller varmvattenmätarna läggs på restaurangen: belysning, gemensamma utrymmen, pumpar, utomhusbelysning och eventuella förluster. Det kan vara avtalat, men det kan inte kontrolleras ur källorna.
- Varmvattenmätarens enhet framgår inte av bilden. Den antas vara kWh el.
- Uppdelningen påverkar inte jämförelsen med Eneas för hela fakturan, bara restaurangens andel.
- *Förslag till formulering:* "Restaurangens förbrukning räknas som huvudmätaren minus bastu och varmvatten, enligt hyresavtalet [hänvisning]. All övrig förbrukning i huset ingår alltså i restaurangens andel." Om detta inte står i hyresavtalet bör det klaras ut.

**(e) Kvartspris (Kraftringen) mot månadsvärden. Bedömning: oklart.**
- Avtalet är "Rörligt kvartspris med bindningstid". Kvartspriser infördes på dagenföremarknaden 1 oktober 2025 ([Varberg Energi, 2025](https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden)).
- Fakturans spotpris är ett förbrukningsviktat snitt för månaden (implicit pris med fyra decimaler, avsnitt 3). Det är därför rätt att jämföra med ett månadsvärde, men bara om Eneas månadspris också är viktat mot anläggningens egen förbrukning per kvart (eller timme). Ett oviktat månadssnitt plus påslag ger en annan siffra.
- Skillnaden kan gå åt båda hållen. Kraftringens "rörliga kostnader" (3,16–5,11 öre/kWh, varierar per månad) kan innehålla profil- och balanskostnader. Jämförelsen är ett försök, som sidan redan säger.
- *Förslag till formulering:* "Kraftringens pris är ett snitt per månad, viktat mot vår förbrukning kvart för kvart. Eneas pris bör räknas på samma sätt, viktat mot samma mätvärden. Ange om priset är viktat mot vår förbrukning eller ett snitt för hela månaden."

## 6. Förslag (inga datafel, men bör åtgärdas)

1. Använd samma hyresgäst-kWh för juni i båda delarna av den interna sidan (11 755 eller 11 756), eller skriv i sidan varför de skiljer 1 kWh.
2. Byt eller förklara rubriken "El inkl Elcert (1,7 öre/kWh)" (avsnitt 5a).
3. Skriv i den interna sidan att Eneas månadsavgift inte fördelas på restaurangen. `intern_debitering.js` räknar bara prisskillnaden per kWh. Det är en tolkning som bör vara ett uttalat beslut.
4. Valfritt: för att få bort avvikelsen på upp till 1,44 kr i README-formeln kan Kraftringens elbelopp i kr (spot + rörliga + påslag ur fakturan) användas i stället för `krOre` × kWh.

## 7. Det som inte kunde kontrolleras, och säkerhet

**Inte kontrollerat eller inte kontrollerbart:**
- Bilderna är skärmbilder av ett kalkylblad. Decimalerna bakom de visade heltalen syns inte och kunde inte läsas. De har räknats fram indirekt (belopp ÷ öre), men exakta mätarställningar med decimaler för bastu och varmvatten finns inte i källorna.
- Varmvattenmätarens enhet (kWh el eller annat) framgår inte.
- Om elcertifikat ingår i Kraftringens pris och i vilken post (fakturan säger inget).
- Hur Kraftringen räknar fram "rörliga kostnader" (fakturan specificerar inte).
- Hyresavtalets regler för vad restaurangen ska betala.
- Eneas priser och prismodell. De finns inte i projektet; broschyren saknar priser.
- `enea_jamforelse.css`, `intern_debitering.css`, kopierings- och utskriftsfunktionerna och lagringen i webbläsaren ingick inte i granskningen. Sidorna kördes utan CSS.
- Det som går att läsa gick att läsa. Ingen PDF och ingen bild var oläslig. Sida 4 i majfakturan är tom.

**Säkerhet:**
- Hög för data och räkning. Alla fält i alla sex månader är jämförda mot källan. Fakturorna är maskinlästa och stickprovskontrollerade visuellt. Bildavläsningarna går ihop aritmetiskt i alla led, och formlerna är testade genom att köra de riktiga sidorna.
- Medel för antagandena i avsnitt 5. De är bedömningar, och flera vilar på uppgifter som saknas i källorna (elcertifikat, viktning, hyresavtal).

## Källförteckning

Bjerreds Saltsjöbad (2026) *Debiteringsunderlag El januari–juni 2026* [kalkylblad, bilder JPG]. `Kraftringen/Intern_debitering/202601–202606_Intern_debitering.jpg`. *Underlag för mätarställningar, hyresgästens kWh och debiterade belopp.*

Ekonomifakta (2010) *Elkonsumentens del i elcertifikatsystemet*. Tillgänglig: [https://www.ekonomifakta.se/sakomraden/energi/elkonsumentens-del-i-elcertifikatsystemet_1208586.html](https://www.ekonomifakta.se/sakomraden/energi/elkonsumentens-del-i-elcertifikatsystemet_1208586.html) (hämtad 2026-10-06). *Visar att elleverantörer är kvotpliktiga och att kostnaden ingår i elpriset. Äldre artikel; systemets slutdatum kan ha ändrats.*

Energimarknadsbyrån (u.å.) *Att byta elhandelsföretag* [PDF]. Tillgänglig: [https://energimarknadsbyran.se/media/1093/byta-elhandelsforetag.pdf](https://energimarknadsbyran.se/media/1093/byta-elhandelsforetag.pdf) (hämtad 2026-10-06). *Stöd för att elnätsföretaget inte kan bytas och att två fakturor är vanligt efter byte.*

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor, PDF]. Kraftringen Nät AB och Kraftringen Energi AB. `Kraftringen/Fakturor/`. *Huvudkälla för kWh, öre-priser, belopp och fakturanummer.*

Regeringskansliet (2026) *Uppdrag till Statens energimyndighet att ta fram förslag för att möjliggöra ett tidigare avslut av elcertifikatsystemet*, 10 juni. Tillgänglig: [https://regeringen.se/regeringsuppdrag/2026/06/uppdrag-till-statens-energimyndighet-att-ta-fram-forslag-for-att-mojliggora-ett-tidigare-avslut-av-elcertifikatsystemet/](https://regeringen.se/regeringsuppdrag/2026/06/uppdrag-till-statens-energimyndighet-att-ta-fram-forslag-for-att-mojliggora-ett-tidigare-avslut-av-elcertifikatsystemet/) (hämtad 2026-10-06). *Visar att elcertifikatsystemet kan komma att avslutas i förtid.*

Skatteverket (2025) *Sänkt skatt på el 1 januari 2026*, 11 december. Tillgänglig: [https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/nyheterinompunktskatter/2025/nyheterinompunktskatter/sanktskattpael1januari2026.5.1522bf3f19aea8075ba96f.html](https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/nyheterinompunktskatter/2025/nyheterinompunktskatter/sanktskattpael1januari2026.5.1522bf3f19aea8075ba96f.html) (hämtad 2026-10-06). *Bekräftar energiskatten 36,0 öre/kWh 2026.*

Skatteverket (u.å.a) *Skatt på el*. Tillgänglig: [https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/energiskatter/skattpael](https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/energiskatter/skattpael) (hämtad 2026-10-06). *Visar att nätinnehavaren är skattskyldig, alltså att energiskatten följer elnätet.*

Skatteverket (u.å.b) *Momssatser och undantag från moms*. Tillgänglig: [https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momssatspavarorochtjanster.4.58d555751259e4d66168000409.html](https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momssatspavarorochtjanster.4.58d555751259e4d66168000409.html) (hämtad 2026-10-06). *Generell momssats 25 %.*

Varberg Energi (2025) *Vilka effekter har kvartspriser fått på elmarknaden?*, 10 december. Tillgänglig: [https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden](https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden) (hämtad 2026-10-06). *Kvartspriser på dagenföremarknaden från 1 oktober 2025.*

## Jämförelse med egenkontrollen

Läst efter att rapporten ovan var skriven: `KVALITETSGRANSKNING.md` och PRD.md avsnitt 13.

**Samma resultat:**
- Fakturornas egen räkning stämmer.
- Sidornas data är lika med fakturorna.
- Debiteringsunderlaget ger 0, 0, 0, −1, +1 och −2 kr mot debiterat.
- Beräkning från grunden avviker upp till ca 3 kr (egenkontrollen: högst 2,98 kr).
- Mätarställningarna i bilderna ligger upp till 1 kWh över fakturans.
- Juni bastu (7 431 mot 7 430) och maj bastu dam (4 448 mot 4 449).
- Kraftringens elhandel per månad i PRD 13 (43 300,29 … 21 938,70 kr) stämmer med mina fakturavärden (spot + rörliga + påslag).

**Det granskning 2 lägger till:**
- Alla sex bilder är lästa och kontrollerade. Egenkontrollen tog stickprov på tre (jan, mar, apr).
- Formlerna är testade genom att köra de riktiga sidorna och läsa av det som visas, både helfakturan och restaurangen.
- Antagandena (a)–(e) är bedömda, med förslag till text.
- Benämningen "El inkl Elcert (1,7 öre/kWh)" finns inte på fakturan, där posten heter "Fast påslag" (avsnitt 5a).
- Eneas månadsavgift fördelas inte på restaurangen. Det bör vara ett uttalat beslut.

**Motstridigheter i projektets egna texter:**
1. PRD avsnitt 13 anger restaurangens juni till **24 018 kr** "räknat från avrundade indata". Avsnitt 12, `KVALITETSGRANSKNING.md` och denna granskning ger **24 015 kr**. 24 018 fås med hyresgäst-kWh 11 756 från bilden (11 756 × 163,44 / 100 × 1,25 = 24 017,51). 24 015 fås med 11 755 från de avrundade ställningarna. Det är samma 1-kWh-fråga som i avsnitt 6 punkt 1, men PRD 13 bör rättas så att den stämmer med sidan.
2. PRD 13 säger att Eneas-scenariot räknas som "faktura minus Kraftringens elhandel plus Eneas elhandel". Koden drar dock bort `krOre` × kWh, inte elhandelns faktiska belopp i kr. Skillnaden är högst 1,15 kr exkl. moms (1,44 kr inkl. moms) per månad (avsnitt 4.1 och 6 punkt 4). Antingen texten eller koden bör justeras.

**Det egenkontrollen gjorde som inte gjorts här:** test av ogiltig inmatning (text, negativa tal, för stora tal) och kopierings- och utskriftsknapparna. Ingen av dem ändrar resultaten ovan.
