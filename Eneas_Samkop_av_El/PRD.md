# PRD – Jämförelse Kraftringen kontra Eneas samköp av el

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad
Mapp: `Eneas_Samkop_av_El/` (all utveckling sker inom denna mapp)
Status: Utkast 1, 2026-10-06
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

1. Isak (Eneas) ska kunna mata in Eneas priser för januari–juni 2026 direkt i en
   webbsida, i samma upplägg som vi själva redovisar interndebiteringen.
2. Sidan ska visa vad hela fakturan och hyresgästens (restaurangens) andel hade
   blivit med Eneas, jämfört med faktiskt utfall hos Kraftringen.
3. Uppgifterna ska sparas i en databas så att jämförelsen finns kvar och går att
   dela med styrelsen.

Ej mål: byte av nätägare (omöjligt, se avsnitt 3), prognoser framåt i tiden, och
ändringar i `index.html`.

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

Fältet för fast nätavgift är låst till 0 kr i sidan. Isak ska mata in på samma sätt: gula fält, samma rader, samma ordning. Enda
skillnaden är att raden "El inkl Elcert" fylls i med Eneas pris.

## 6. Öppna frågor (måste besvaras före bygget)

| Nr | Fråga | Varför |
|----|-------|--------|
| 1 | ~~Fast nätavgift för hyresgästen~~ **Besvarad 2026-10-06:** hyresgästen ska aldrig debiteras fast nätavgift. Raderna för april–juni i underlagen var ett räkneexempel och rättas (se 4.3). | Löst. |
| 2 | Hur ser Eneas prismodell ut? Spotpris plus påslag, fast pris, eller prissäkrad portfölj ("samköp")? Finns månadsavgift, elcertifikat och profilkostnader (uttagsprofil) separat? | Avgör vilka fält Isak ska fylla i. Broschyren anger inga priser (Eneas, 2026). |
| 3 | Vad är Eneas pris för januari–juni i efterhand? Om Eneas säkrar priser i förväg är det inte samma sak som ett spotpris. | Jämförelsen ska göras på samma förbrukning. |
| 4 | Ska jämförelsen visa hela fakturan, hyresgästens andel, eller båda? Förslag: båda. | Styr layout. |
| 5 | Hur loggar Isak in? Se avsnitt 8. | Säkerhet. |
| 6 | Är avräkningen hos Eneas månadsvis och baserad på samma mätvärden (kvartsvärden) som Kraftringens fakturering? | Rörligt kvartspris hos Kraftringen. Timvärden och kvartsvärden kan ge skillnader. |

## 7. Funktionella krav

**F1 Inmatningssida (Isak).** Månadsväljare januari–juni 2026. Gula fält (`#FFF9C4`)
enligt projektets regel. Fält per månad: Eneas pris för elhandel (öre/kWh),
eventuell fast månadsavgift (kr), eventuella övriga poster, och en kommentarsruta.
Förbrukningen (kWh) är förifylld från Kraftringens fakturor och ska inte kunna
ändras av Isak.

**F2 Beräkning.** För varje månad:
- Eneas elhandelskostnad = kWh × Eneas pris + fasta avgifter
- Hela fakturan med Eneas = Kraftringens elnät (oförändrat) + Eneas elhandel + moms
- Hyresgästens andel = samma upplägg som avsnitt 5, med Eneas pris på raden
  "El inkl Elcert"
- Skillnad mot Kraftringen i kr och i procent, per månad och totalt för sex månader

**F3 Redovisning.** Tabell per månad och sammanfattning. Diagram med Kraftringen
kontra Eneas (kr och öre/kWh). Tydlig text om vad som är lika (nät, skatt) och vad
som skiljer (elhandel).

**F4 Databas.** Spara Isaks inmatning med tidsstämpel. Visa vem och när senast ändrat.

**F5 Referensdata.** Kraftringens utfall och interndebiteringens mätarvärden
(avsnitt 4–5) finns inbakade som fallback i sidans JavaScript, så att sidan fungerar
även utan databaskontakt (samma mönster som `fore_och_efter_ombyggnad.js`).

**F6 Export.** Knapp för att kopiera tabellen så att den kan klistras in i Word.

## 8. Teknik och datamodell (förslag)

- Rena filer utan ramverk: `enea_jamforelse.html`, `enea_jamforelse.css`,
  `enea_jamforelse.js` samt `enea_isak.html` för inmatningen (kod delas upp i
  separata filer enligt projektregeln). Alla filer i `Eneas_Samkop_av_El/`.
- Databas: Firebase Realtime Database via REST API, som projektet redan gör för
  inpasseringar (`skylt-e0c45`). Förslag: ny nod `bjerred-enea-offert/` så att
  befintlig data inte påverkas.
- Datamodell per månad, nyckel `2026-01` till `2026-06`:

```
{
  eneasOrePerKwh: 0.00,        // Eneas pris för elhandel, öre/kWh
  eneasManadsavgiftKr: 0.00,   // fast avgift per månad, kr
  ovrigt: 0.00,                // övriga poster, kr
  kommentar: "",
  uppdaterad: "ISO-tidsstämpel",
  uppdateradAv: "Isak"
}
```

- Säkerhet: projektets databas har idag öppen läsning. För skrivning krävs en
  säkerhetsregel. Alternativ A: delad inmatningslänk med lösenordskod, regeln tillåter
  skrivning enbart till noden `bjerred-enea-offert`. Alternativ B: Firebase
  Authentication med inloggning för Isak. Rekommendation: B om uppgifterna är
  affärskänsliga, annars A. Detta behöver beslutas (fråga 5).
- Ingen kod med ES2023+ utan kommentar. All kod kommenteras i detalj, med
  `// UPPDATERING ÅÅÅÅ-MM-DD:` vid ändringar.

## 9. Acceptanskriterier

1. Kraftringens baslinje i sidan stämmer med avsnitt 4 för alla sex månader.
2. Hyresgästens totalbelopp med Kraftringens pris återskapar exakt interndebiteringen
   (37 341, 36 647, 19 213, 17 873, 23 521 och 24 017 kr, de tre sista utan fast nätavgift, se 4.3).
3. Ändrar Isak ett pris uppdateras beräkning och diagram direkt.
4. Sidan fungerar vid databasfel genom att visa senast kända värden och ett tydligt
   felmeddelande.
5. Sidan är läsbar i mobil (16 px marginal, ingen sidledsrullning).

## 10. Risker

- Eneas pris är troligen inte ett rent spotpris, så en jämförelse bakåt kan bli
  missvisande. Eneas skriver själva att historiska besparingar inte är någon garanti
  för framtida besparingar (Eneas, 2026).
- Eneas siffror om 14 % lägre pris än marknaden 2017–2024 gäller deras kundkollektiv
  och är beräknade av Eneas själva. De är ingen prognos för oss.
- Kraftringens avtal gäller t.o.m. 2026-09-30. Nuvarande avtalsperiod har alltså löpt
  ut vid dokumentets datum. Aktuellt avtal behöver bekräftas.

## 11. Nästa steg

1. Kent svarar på öppna frågor 2–6 (fråga 1 är besvarad).
2. Kent bekräftar om nya filer ska skapas (`_ver1`) i `Eneas_Samkop_av_El/`.
3. Bygg inmatningssidan och beräkningen, därefter databaskopplingen och diagrammen.
4. Isak provar med januari–juni, och Kent kontrollräknar mot fakturorna.

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
