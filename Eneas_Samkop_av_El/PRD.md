# PRD – Jämförelse Kraftringen kontra Eneas samköp av el

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad
Mapp: `Eneas_Samkop_av_El/` (all utveckling sker inom denna mapp)
Status: Utkast 3, 2026-10-06 (databas och inloggning struket, se avsnitt 8; Del 2 internt debiteringsunderlag tillagd, se avsnitt 12; kontrollräkning i avsnitt 13)
Ansvarig: Kent Lundgren
Extern kontakt: Isak Cerwén, kundrådgivare, Eneas

> OBS! Siffror i detta dokument är hämtade ur fakturor och interndebiteringsunderlag
> i projektet (se källförteckningen). De är inte kvalitetssäkrade i övrigt. Kontrollera
> alltid mot originalfakturorna.

---

## 1. Bakgrund

Bjerreds Saltsjöbad köper idag el av Kraftringen Energi AB (elhandel) och
Kraftringen Nät AB (elnät). Eneas har skickat ett erbjudande om "Samköp av el"
(Eneas, 2026). Vi vill kunna jämföra vad vi betalade januari–juni 2026 med vad vi
hade betalat med Eneas som elhandlare.

Eneas beskriver sig som en oberoende aktör och uttryckligen "inte en elleverantör".
De förhandlar och köper in el gemensamt för över 45 000 företagskunder (Eneas, 2026).
Broschyren innehåller inga priser, så Isak måste lämna in prisuppgifterna separat.
Eneas erbjuder även tjänsten IMD (mätning och debitering för fastigheter med flera
hyresgäster) (Eneas, 2026). Den är relevant för vår interndebitering men ligger
utanför denna jämförelse.

## 2. Mål

1. Isak (Eneas) ska kunna anteckna vilka priser Eneas hade erbjudit för januari–juni
   2026 i en tabell på en webbsida, i samma upplägg som vi själva redovisar
   interndebiteringen. Det är en jämförelse i efterhand och ett försök: olika
   elleverantörer menar olika saker med "pris", så Isak ska också kunna förklara vad
   priset omfattar.
2. Sidan ska räkna ut vad hela fakturan och hyresgästens (restaurangens) andel hade
   blivit med Eneas, jämfört med faktiskt utfall hos Kraftringen, månad för månad.
3. Isak ska enkelt kunna kopiera tabellen (med sina anteckningar) och klistra in den
   i ett mejl till oss. Inget lagras på någon server (se avsnitt 8).

Ej mål: byte av nätägare (omöjligt, se avsnitt 3), prognoser framåt i tiden,
ändringar i `index.html`, databas och inloggning.

Projektet har två delar:
- **Del 1 (avsnitt 1–11): jämförelse Kraftringen kontra Eneas.** Riktar sig till Isak
  (Eneas). Visar ingen intern debitering av restaurangen med mätarställningar.
- **Del 2 (avsnitt 12): mall för internt debiteringsunderlag.** Internt för Kent. Visas
  inte för Eneas och länkas inte från Isaks sida. Avsnitt 5 beskriver hur underlaget
  räknas.

## 3. Nätavgiften – bekräftad mot fakturorna

Ja, nätavgiften fortsätter till Kraftringen. Fakturorna är "E-faktura elnät och
elhandel" och består av två delar från två olika bolag (Kraftringen, 2026):

| Del | Bolag | Vad som kan bytas |
|-----|-------|-------------------|
| Elnät | Kraftringen Nät AB | Ingenting. Nätägaren är fast för anläggningen. |
| Elhandel | Kraftringen Energi AB | Kan bytas till Eneas (samköp). |

Statliga och nätrelaterade poster är alltså lika i båda scenarierna. Det gäller fast
avgift, elöverföring (öre/kWh), energiskatt (36,00 öre/kWh) och moms. Det som jämförs
är enbart elhandeln.

## 4. Nuläge – vad Kraftringen tar betalt för (baslinje)

Elhandeln hos Kraftringen består av fyra poster (Kraftringen, 2026):
spotpris, rörliga kostnader, fast påslag (1,70 öre/kWh) och månadsavgift (0 kr).
Avtalsformen är "Rörligt kvartspris med bindningstid", giltigt t.o.m. 2026-09-30.
Elområde SE4, anläggning "Kallbadhus", Parkallén 15, Bjärred, kundnummer 130869.

Internt använder vi raden "El inkl Elcert (1,7 öre/kWh)". Den är summan av spotpris,
rörliga kostnader per kWh och fast påslag (1,70 öre/kWh). Exempel januari:
117,38 + 3,16 + 1,70 = 122,24 öre/kWh, vilket stämmer mot interndebiteringen.
Kontrollräknat för alla sex månaderna.

Det är den raden som Eneas pris ska ersätta i jämförelsen.

### 4.1 Faktiskt utfall januari–juni 2026

| Månad | Totalt kWh | Faktura inkl moms (kr) | El inkl elcert (öre/kWh) | Rörlig nätavgift (öre/kWh) |
|-------|-----------:|-----------------------:|-------------------------:|---------------------------:|
| Jan | 35 422 | 90 779 | 122,24 | 21,87 |
| Feb | 32 002 | 82 794 | 121,56 | 21,84 |
| Mar | 28 074 | 63 389 | 92,87 | 20,33 |
| Apr | 26 671 | 52 186 | 68,29 | 19,16 |
| Maj | 23 941 | 56 338 | 95,00 | 20,39 |
| Jun | 20 609 | 53 134 | 106,45 | 20,99 |
| Summa | 166 719 | 398 620 | | |

### 4.2 Hyresgästens (restaurangens) debitering

| Månad | Hyresgästens kWh | Totalt inkl moms (kr) |
|-------|-----------------:|----------------------:|
| Jan | 16 586 | 37 341 |
| Feb | 16 342 | 36 647 |
| Mar | 10 302 | 19 213 |
| Apr | 11 582 | 17 873 |
| Maj | 12 430 | 23 521 |
| Jun | 11 756 | 24 017 |
| Summa | 78 998 | 158 612 |

### 4.3 Rättelse april–juni (beslut 2026-10-06)

Hyresgästen ska inte betala fast nätavgift. Underlagen för april–juni visade en
fast avgift (3 831,44, 4 581,55 och 5 033,90 kr) som ett räkneexempel. Rätt belopp
är:

| Månad | Summa exkl. moms (kr) | Moms (kr) | Totalt, avrundat (kr) |
|-------|----------------------:|----------:|----------------------:|
| Apr | 14 298,40 | 3 574,60 | 17 873 |
| Maj | 18 817,15 | 4 704,29 | 23 521 |
| Jun | 19 213,92 | 4 803,48 | 24 017 |

Beräknat som summan av de tre kvarvarande raderna (rörlig nät, el inkl elcert,
energiskatt) × 1,25. Bilderna `202604`–`202606_Intern_debitering.jpg` i
`Kraftringen/Intern_debitering/` visar fortfarande de gamla beloppen och behöver
ersättas av rättade underlag. Kontrollera att rätt belopp är fakturerat till
restaurangen.

## 5. Interndebiteringens uppbyggnad (ska återskapas i sidan)

Underlaget "Debiteringsunderlag El [månad] 2026" räknar så (Bjerreds Saltsjöbad, 2026):

1. Huvudmätare vid bryggfästet: mätarställning vid månadens början och slut ger
   total förbrukning (kWh).
2. Hyresvärdens andel: mätare bastu herr + mätare bastu dam + mätare varmvatten (kWh).
3. Hyresgästens kWh = total förbrukning − bastu totalt − varmvatten.
   Exempel januari: 35 422 − 14 729 − 4 107 = 16 586 kWh.
4. Hyresgästens kostnad, per kWh-post (öre/kWh × hyresgästens kWh):
   - Nätavgift, fast avgift (alltid 0 kr, se nedan)
   - Nätavgift, rörlig (elöverföring)
   - El inkl elcert
   - Energiskatt
5. Summa exkl. moms, plus 25 % moms, avrundat till hela kronor. Totalt = fakturerat
   belopp till restaurangen.

Fältet för fast nätavgift är låst till 0 kr i sidan. Sidan redovisar restaurangens
kostnad med samma rader och i samma ordning som underlaget. Enda skillnaden är att
raden "El inkl Elcert" räknas med Eneas pris. Mätarställningar för bastu och
varmvatten behöver inte visas; hyresgästens kWh (avsnitt 4.2) är förifyllda.

## 6. Frågor och beslut

| Nr | Fråga | Status |
|----|-------|--------|
| 1 | Fast nätavgift för hyresgästen | **Besvarad 2026-10-06:** hyresgästen ska aldrig debiteras fast nätavgift. Raderna för april–juni i underlagen var ett räkneexempel och rättas (se 4.3). |
| 2 | Hur ser Eneas prismodell ut? | **Okänd för oss (2026-10-06).** Broschyren anger inga priser (Eneas, 2026). Isak anger vad priset omfattar (prismodell och fritext, se F1). Jämförelsen är ett försök, eftersom elleverantörer menar olika saker med "pris". |
| 3 | Vad är Eneas pris för januari–juni i efterhand? | **Isak fyller i** (F1). Om Eneas säkrar priser i förväg är det inte samma sak som ett spotpris. |
| 4 | Hela fakturan, hyresgästens andel, eller båda? | **Båda** (F2, F3). |
| 5 | Inloggning och databas | **Utgår (2026-10-06).** Plattformen är bara mellan Kent och Isak. Ingen Firebase, ingen inloggning. Isak kopierar tabellen och mejlar den (F6). Firebase Authentication (tidigare alternativ B) utgår också och byggs inte. |
| 6 | Är avräkningen hos Eneas månadsvis och baserad på samma mätvärden (kvartsvärden) som Kraftringens fakturering? | **Öppen.** Isak får en fritextruta där han kan förklara detta (F1). Timvärden och kvartsvärden kan ge skillnader. |

## 7. Funktionella krav

**F1 Inmatning i en tabell (Isak).** En enda sida med en tabell, en rad per månad
januari–juni 2026 plus en summarad, i samma upplägg som Kents debiteringsunderlag
(gula fält, samma rader och ordning).
- *Gula fält per månad (Isak fyller i):*
  - "El inkl Elcert (öre/kWh)": Eneas totala pris för själva elen. Det ska omfatta
    elcertifikat, påslag och eventuella profil- och balanskostnader, så att det går
    att jämföra med Kraftringens "spotpris + rörliga kostnader + 1,70 öre/kWh".
  - UPPDATERING 2026-10-06 (byggd version 1.0): bara "El inkl Elcert" är gult per månad,
    enligt Kents bild. Eneas fasta månadsavgift (kr/mån exkl. moms, valfri) är ett enda
    gult fält ovanför tabell 2. Övriga poster och anteckning per månad utgår; en gemensam
    fritext om vad priset omfattar finns i stället.
  - Isaks sida (`enea_jamforelse.*`) visar två tabeller: 1 idag (Kraftringen) och 2 med
    Eneas priser (samma kolumner som bilden plus skillnad i kr och %). Restaurangens andel
    (tidigare tabell 3) ligger inte längre i Isaks filer, varken som tabell eller som data i
    JavaScript. Den ligger i den interna sidan `intern_debitering.html` (avsnitt 12).
    Isaks sida har en nästan osynlig cirkel uppe till höger som länkar dit. Det är ingen
    åtkomstkontroll: sidan är publik för den som känner adressen (`noindex` är satt).
- *Gula fält en gång för hela jämförelsen:* prismodell (rullista: spot + påslag, fast
  pris, prissäkrad portfölj, annat), fritext om vad priset omfattar och inte omfattar,
  samt Isaks namn och datum.
- *Grå, låsta fält (förifyllda från Kraftringens fakturor):* total kWh, faktura inkl.
  moms, rörlig nätavgift (öre/kWh), energiskatt (36,00 öre/kWh) och fast nätavgift
  (8 824 kr/mån) med förklaringen att den är Kraftringen Nät AB:s avgift och inte kan
  bytas. Hyresgästens kWh är också förifyllda (avsnitt 4.2).
- Kolumn och tabell ska vara lätta att läsa som text när den klistras in i ett mejl.

**F2 Beräkning.** För varje månad:
- Eneas elhandelskostnad = kWh × Eneas pris + fasta avgifter
- Hela fakturan med Eneas = Kraftringens elnät (oförändrat) + Eneas elhandel + moms
- Hyresgästens andel = samma upplägg som avsnitt 5, med Eneas pris på raden
  "El inkl Elcert"
- Skillnad mot Kraftringen i kr och i procent, per månad och totalt för sex månader

**F3 Redovisning.** Tabell per månad och sammanfattning. Diagram med Kraftringen
kontra Eneas (kr och öre/kWh). Tydlig text om vad som är lika (nät, skatt) och vad
som skiljer (elhandel).

**F4 (struken).** Databas utgår. Inget sparas på någon server.

**F5 Referensdata.** Kraftringens utfall (avsnitt 4.1–4.3) ligger inbakat i sidans
JavaScript. Sidan behöver inget nätverksanrop och fungerar öppnad direkt från fil.
Som bekvämlighet sparas Isaks inmatning i hans egen webbläsare (localStorage), så att
han inte tappar den om fliken stängs. Allt som rör localStorage ska ligga i try/catch,
och sidan ska fungera även utan.

**F6 Kopiera och skicka.** Isak ska kunna skicka resultatet till Kent i ett mejl:
- Knapp **"Kopiera tabellen"**: kopierar hela tabellen (Isaks priser och anteckningar,
  Kraftringens utfall, Eneas utfall och skillnad) både som HTML-tabell och som
  tabbseparerad text, så att den klistras in rent i Outlook, Gmail eller Word.
  Reservlösning om webbläsaren inte tillåter kopiering: markera tabellen så att Isak
  kan kopiera med Ctrl+C.
- Knapp **"Skriv ut / spara som PDF"** med print-CSS för en ren A4-sida (valfri
  extra).
- Ingen filnedladdning och ingen inbyggd e-postsändning.

## 8. Teknik (beslutad 2026-10-06)

- Rena filer utan ramverk och utan byggprocess, uppdelade i HTML, CSS och JS enligt
  projektregeln. Alla filer i `Eneas_Samkop_av_El/`, utan versionsnummer i filnamnet:
  `enea_jamforelse.html`, `enea_jamforelse.css`, `enea_jamforelse.js`.
- Version och datum ska visas i sidans sidfot, till exempel "Version 1.0 · 2026-10-06".
- Ingen databas, ingen Firebase, ingen inloggning, inga externa bibliotek. Diagrammet
  ritas i ren SVG eller canvas. Sidan är avsedd bara för Kent och Isak, och inget av
  Eneas priser lagras av oss på någon server.
- Datamodell i minnet (och i localStorage), nyckel `2026-01` till `2026-06`:

```
{
  eneasOrePerKwh: 0.00,        // Eneas pris för elhandel, öre/kWh
  eneasManadsavgiftKr: 0.00,   // fast avgift per månad, kr
  ovrigt: 0.00,                // övriga poster, kr
  kommentar: ""                // Isaks anteckning för månaden
}
```

  Dessutom en gång för hela jämförelsen: prismodell, fritext om vad priset omfattar,
  Isaks namn och datum.
- Beräkning, per månad, med kWh, nätavgifter och energiskatt från avsnitt 4:
  - Hela fakturan med Eneas = (fast nätavgift + rörlig nät × kWh + energiskatt × kWh +
    Eneas pris × kWh + Eneas månadsavgift + övrigt) × 1,25, avrundat till hela kronor.
  - Hyresgästen = (rörlig nät + Eneas pris + energiskatt) × hyresgästens kWh × 1,25,
    avrundat till hela kronor. Fast nätavgift är alltid 0.
- Ingen kod med ES2023+ utan kommentar. All kod kommenteras i detalj, med
  `// UPPDATERING ÅÅÅÅ-MM-DD:` vid ändringar.

## 9. Acceptanskriterier

1. Kraftringens baslinje i sidan stämmer med avsnitt 4 för alla sex månader. Hela
   fakturan återskapas exakt (90 779, 82 794, 63 389, 52 186, 56 338 och 53 134 kr)
   genom att baslinjen förankras i fakturans faktiska belopp (se avsnitt 13).
2. Hyresgästens totalbelopp med Kraftringens pris återskapar exakt interndebiteringen
   (37 341, 36 647, 19 213, 17 873, 23 521 och 24 017 kr, de tre sista utan fast nätavgift, se 4.3),
   genom samma förankring. Skillnaden mot Eneas beräknas från den förankrade baslinjen.
3. Ändrar Isak ett pris uppdateras beräkning och diagram direkt.
4. Knappen "Kopiera tabellen" ger en tabell som klistras in läsbart i ett mejl, med
   Isaks priser och anteckningar. Sidan fungerar öppnad direkt från fil, utan nätverk.
5. Sidan är läsbar i mobil (16 px marginal, ingen sidledsrullning).
6. Version och datum syns i sidfoten. Sidan anger att siffrorna är hämtade ur
   Kraftringens fakturor och inte är kvalitetssäkrade, och att läsaren ska kontrollera
   mot källan. Kent Lundgren anges som avsändare.

## 10. Risker

- Eneas pris är troligen inte ett rent spotpris, så en jämförelse bakåt kan bli
  missvisande. Eneas skriver själva att historiska besparingar inte är någon garanti
  för framtida besparingar (Eneas, 2026).
- Eneas siffror om 14 % lägre pris än marknaden 2017–2024 gäller deras kundkollektiv
  och är beräknade av Eneas själva. De är ingen prognos för oss.
- Kraftringens avtal gäller t.o.m. 2026-09-30. Nuvarande avtalsperiod har alltså löpt
  ut vid dokumentets datum. Aktuellt avtal behöver bekräftas.

## 11. Nästa steg

1. Kent godkänner PRD:n (utkast 2).
2. Bygg tabellen med inmatning och beräkning, därefter diagram och kopieringsknappen.
3. Kent kontrollräknar baslinjen mot fakturorna (acceptanskriterium 1–2).
4. Kent skickar länken till Isak, som fyller i tabellen och mejlar tillbaka den.

---

## 12. Del 2 – Mall för internt debiteringsunderlag (internt, visas inte för Eneas)

**Syfte.** Ersätta bilderna i `Kraftringen/Intern_debitering/` med en sida som räknar och
visar "Debiteringsunderlag El [månad] 2026" i samma uppställning som idag, så att
underlaget kan upprepas varje månad och kontrolleras mot fakturan. Samma uppställning
används på Isaks sida för hyresgästens andel (F1).

**Filer.** `intern_debitering.html` och `intern_debitering.js` i `Eneas_Samkop_av_El/`
(byggda 2026-10-06, version 1.0: tabellen "Restaurangens andel" med egna gula prisfält för
Eneas). De delar stilmallen `enea_jamforelse.css` och hjälpfunktionerna i `enea_hjalp.js`
(ersätter den tidigare planerade `berakning.js`) med Isaks sida. Restaurangens data och
beräkning finns bara i `intern_debitering.js`, inte i Isaks filer. Eneas priser delar
lagringsnyckel (`localStorage`) med Isaks sida, så de räcker att fylla i på en av sidorna.
Del 2 bygger vidare i dessa filer. Obs: GitHub Pages är publikt för den som känner adressen;
sidan innehåller bara belopp som redan ligger i repot som bilder. Länken från Isaks sida är
dold men inte skyddad.

**Funktioner (D1–D6).**
- **D1 Månadsväljare** för januari–juni 2026, och möjlighet att lägga till senare
  månader.
- **D2 Gula inmatningsfält** (`#FFF9C4`), som i underlaget: fakturanummer, hela fakturan
  (kr), mätarställning vid månadens slut för huvudmätaren, bastu herr, bastu dam och
  varmvatten, samt öre/kWh för rörlig nätavgift, "El inkl Elcert" och energiskatt.
  Mätarställningar tas emot med decimaler (se avsnitt 13).
- **D3 Mätarställning vid månadens början** förifylls från föregående månads slut och
  är låst (kedjan stämmer alla sex månader, se avsnitt 13). Första månaden fylls i
  manuellt.
- **D4 Beräkning enligt avsnitt 5:** förbrukning per mätare, bastu totalt, hyresgästens
  kWh = total − bastu − varmvatten, kostnad per rad, summa exkl. moms, moms 25 %,
  totalt avrundat till hela kronor. Fast nätavgift är låst till 0 kr.
- **D5 Avstämning mot fakturan**, per månad: total kWh jämförs med kWh på Kraftringens
  faktura (tolerans ±1 kWh), "El inkl Elcert" jämförs med spotpris + rörliga kostnader
  + 1,70 öre/kWh, och fakturanumret kontrolleras. Avvikelse visas som en tydlig varning.
- **D6 Utskrift och kopiering:** "Skriv ut / spara som PDF" (A4) och "Kopiera tabellen".
  Inmatningen sparas i webbläsaren (localStorage, inom try/catch). Januari–juni 2026 är
  förifyllda som fallback i JavaScript.

**Beslut för Del 2 (2026-10-06).**
1. Avrundningsfel på någon krona godtas. Mätarställningarna för januari–juni är därför de
   avrundade heltalen ur bilderna.
2. "Hela fakturan" är ett gult fält (förifyllt för januari–juni, ifylls från fakturan för nya
   månader). Det räknas inte ut.
3. Underlaget ska ha ungefär samma utseende som dagens underlag, så att Kent känner igen sig.

**Byggt (version 1.0, 2026-10-06).** `intern_debitering.html` visar "arket" först, därefter
jämförelsen med Eneas priser. Filer: `intern_underlag.js` (logik och data), `intern_debitering.css`
(arkets utseende). Funktioner:
- D1 Månadsväljare jan–jun 2026 och knappen "+ Ny månad" (nästa månad, ingående mätarställningar
  hämtas från föregående). Tillagda månader kan tas bort; standardmånader kan återställas.
- D2–D4 Gula fält som i dagens underlag och beräkning enligt avsnitt 5. Fast nätavgift är låst till 0.
- D5 Kontroller: huvudmätarens förbrukning mot kWh på fakturan (±1 kWh) och totalbelopp mot tidigare
  debiterat (varning om avvikelsen är över 2 kr), samt varning för utgående under ingående och för
  negativ hyresgäst-kWh.
- Skydd för fasta månader (2026-10-06): januari–juni 2026 kan aldrig tas bort. "Återställ månaden"
  sätter tillbaka de fasta värdena för en fast månad och tömmer fälten för en tillagd månad.
  "Ta bort månaden" visas bara för den sista tillagda månaden (annars bryts kedjan av ingående
  mätarställningar). Sidan förklarar detta under knapparna, och bekräftelsedialogerna beskriver
  vad som händer.
- D6 "Kopiera underlaget" (HTML + text), "Skriv ut underlaget" (bara arket, A4) och sparande i
  webbläsaren (egen nyckel `intern_underlag_v1`).

**Testresultat med förifyllda värden (totalt kr mot tidigare debiterat):** jan 37 341 (0),
feb 36 647 (0), mar 19 213 (0), apr 17 872 (−1), maj 23 522 (+1), jun 24 015 (−2). Juni avviker mest
eftersom de avrundade ställningarna ger bastu 7 431 kWh i stället för 7 430 (avsnitt 13).

## 13. Kontrollräkning av kWh och belopp (2026-10-06)

Gjord mot de sex fakturorna i `Kraftringen/Fakturor/` och de sex debiteringsunderlagen i
`Kraftringen/Intern_debitering/`. Siffrorna är avlästa ur fakturor och bilder och är inte
kvalitetssäkrade i övrigt; kontrollera mot originalen.

**Stämmer (kontrollerat för alla sex månader):**
- Total kWh i underlaget (avrundat) = kWh på fakturan (35 422,14 / 32 002,14 / 28 073,52 /
  26 671,14 / 23 941,02 / 20 609,34).
- Mätarkedjan: varje månads startställning = föregående månads slutställning, för
  huvudmätare, bastu herr, bastu dam och varmvatten.
- Hyresgästens kWh = total − bastu − varmvatten = 16 586 / 16 342 / 10 302 / 11 582 /
  12 430 / 11 756.
- Fakturanummer, "Hela fakturan" och "El inkl Elcert" (spotpris + rörliga kostnader +
  1,70 öre/kWh) stämmer mot fakturorna. Hyresgästens totaler 37 341, 36 647 och 19 213 kr
  återskapas exakt av avrundade indata.

**Avvikelser och orsak:**
- Beräknat från avrundade öre-priser och kWh (utan förankring) blir hela fakturan fel med
  1–3 kr (februari 82 795 mot 82 794, mars 63 387 mot 63 389, maj 56 335 mot 56 338
  med flera). Orsaken är att Kraftringen räknar med öre-priser i fler decimaler än de två
  som fakturan visar.
- Hyresgästen april–juni blir 17 872, 23 522 och 24 015 kr mot rättade 17 873, 23 521 och
  24 017 kr (−1, +1 och −2 kr). Orsaken är att mätarställningarna har decimaler som kalkylbladet
  bara visar avrundade: bastu dam maj visas som 4 449 men skillnaden mellan avrundade
  ställningar är 4 448, och juni visar 3 916 + 3 515 = 7 431 mot summan 7 430.
  UPPDATERING 2026-10-06 (rättelse efter granskning 2): avsnittet angav tidigare 24 018 kr för
  juni. Det värdet fås med bildens hyresgäst-kWh (11 756). Debiteringsunderlaget räknar från de
  avrundade ställningarna (11 755 kWh) och ger 24 015 kr. Jämförelsesidan använder 11 756 kWh,
  underlaget 11 755: de skiljer 1 kWh, vilket bör hanteras (se KVALITETSGRANSKNING.md).
- Åtgärd: baslinjen förankras i fakturans faktiska belopp. Eneas-scenariot beräknas som
  fakturan (och hyresgästens debitering) idag plus prisskillnaden (Eneas pris minus Kraftringens
  "El inkl elcert" i öre/kWh) × kWh × 1,25. UPPDATERING 2026-10-06 (rättelse efter granskning 2):
  det står inte, som tidigare, "minus Kraftringens elhandel plus Eneas elhandel". Koden drar bort
  `krOre` × kWh och inte fakturans faktiska elbelopp i kr. Skillnaden är högst 1,15 kr exkl.
  moms (1,44 kr inkl. moms) per månad. Fördelen är att Eneas pris lika med Kraftringens pris ger
  exakt noll. Del 2 tar emot mätarställningar med decimaler.

**Kraftringens elhandel per månad (kr exkl. moms, spotpris + rörliga kostnader + fast påslag,
månadsavgift 0 kr):** jan 43 300,29, feb 38 902,96, mar 26 072,72, apr 18 213,82, maj 22 744,97,
jun 21 938,70.

---

## Källförteckning

Eneas (2026) *Samköp av el* [broschyr, PDF]. Eneas. Lagrad i projektet:
`Eneas_Samkop_av_El/Eneas Samkop av El 2026.pdf`. Hämtad 2026-10-06.

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor,
PDF]. Kraftringen Nät AB och Kraftringen Energi AB, kundnummer 130869.
Lagrade i projektet: `Kraftringen/Fakturor/`.

Bjerreds Saltsjöbad (2026) *Debiteringsunderlag El januari–juni 2026* [interndebitering,
bilder]. Eget underlag. Lagrade i projektet:
`Kraftringen/Intern_debitering/`.
