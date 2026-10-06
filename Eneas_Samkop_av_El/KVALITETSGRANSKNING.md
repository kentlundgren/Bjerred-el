# Kvalitetsgranskning av siffror och beräkningar

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad, mappen `Eneas_Samkop_av_El/`
Granskat: version 1.7 av `enea_jamforelse.*` och version 1.0 av `intern_debitering.*` / `intern_underlag.js`
Datum: 2026-10-06
Status: **Granskning 1 (egenkontroll) och granskning 2 (oberoende granskning) är klara 2026-10-06.**
Redovisning på egen sida: [kvalitetsgranskning.html](kvalitetsgranskning.html). Den oberoende rapporten:
[kvalitetsgranskning/granskning2_resultat.md](kvalitetsgranskning/granskning2_resultat.md). Uppdraget till den:
[kvalitetsgranskning/granskning2_prompt.md](kvalitetsgranskning/granskning2_prompt.md).
Texten under är egenkontrollen och skrevs innan granskning 2 var gjord. Avsnitt 5 ("rekommenderas") och 7 är
därför överspelade av granskning 2.

> Siffrorna i sidorna är hämtade ur Kraftringens fakturor och Bjerreds Saltsjöbads debiteringsunderlag.
> Den här granskningen visar att sidornas siffror och formler stämmer med de underlagen. Den visar inte att
> underlagen i sig är riktiga eller att jämförelsen med Eneas är rättvisande. Kontrollera mot källan.

---

## Tvåstegsgranskning

Granskningen kallas här **tvåstegsgranskning**. Det är vårt eget arbetsnamn, inte en standardbeteckning. Den består av
två steg: (1) en **egenkontroll** av den som byggde sidorna, med maskinell avstämning mot källdokumenten, och
(2) en **oberoende granskning** i en separat session som läser källorna själv och inte tar del av egenkontrollens
resultat förrän den egna rapporten är skriven. Båda stegen innehåller avstämning mot källdokument, omräkning och
stickprov eller fullständig omläsning. Det är en granskning av att sidornas siffror och formler stämmer med
underlagen, och inte en kvalitetssäkring av underlagen eller antagandena.

---

## 1. Vad som ska granskas

| Del | Fråga | Hur det kan kontrolleras |
|-----|-------|--------------------------|
| A. Fakturorna | Stämmer fakturornas egen räkning (kWh × öre = kr, moms, summor)? | Maskinellt: läs PDF-texten med kod och räkna om. |
| B. Sidornas data | Är de inbakade siffrorna lika med fakturorna? | Maskinellt: läs PDF med kod, läs ut JavaScript-datan, jämför fält för fält. |
| C. Modellen (jämförelsen) | Räknar sidan rätt när Eneas pris fylls i? | Slumptest mot en referens med heltalsaritmetik; egenskapstester. |
| D. Debiteringsunderlaget | Räknar mallen rätt från mätarställningar till totalbelopp? | Omräkning med exakt decimalaritmetik mot det sidan visar, och mot tidigare debiterade belopp. |
| E. Indata från bilder | Stämmer mätarställningarna och beloppen som lästs ur bilderna? | Går inte att läsa maskinellt. Stickprov med slumpade månader, och oberoende omläsning (granskning 2). |
| F. Antaganden | Är jämförelsen rimlig i sak? | Bedömning av en person med sakkunskap; kan inte avgöras med kod. |

## 2. Resultat av granskning 1 (egenkontroll, 2026-10-06)

Granskaren (den som byggde sidorna) är inte oberoende. Därför är allt som går att göra maskinellt gjort
med kod som läser siffrorna ur PDF-filerna, och inte med siffror som skrivits in för hand.

| Steg | Omfattning | Resultat |
|------|------------|----------|
| A. Fakturornas interna räkning | 6 fakturor, 90 kontroller | **0 avvikelser** |
| B. Sidornas data mot fakturorna | 6 månader, 85 kontroller (kWh, faktura, elpris, nätavgift, energiskatt, fast avgift, fakturanummer, mätarställning) | **0 avvikelser** |
| C. Modellens matematik | 60 slumpade scenarier, 1 096 kontroller | **0 fel** |
| D. Debiteringsunderlaget | 6 månader, 66 kontroller | **0 avvikelser** mot omräkning |
| E. Stickprov mot bilderna | 3 slumpade månader (jan, mar, apr), alla mätarställningar, priser, fakturanummer och belopp | **Inga avvikelser** |

Detaljer:

- **A.** Kontrollerat per faktura: kWh × öre = kr för elöverföring, energiskatt, spotpris, rörliga kostnader och
  fast påslag; mätarens slut minus början = användning; moms 25 % på elnät och elhandel; summa exkl. moms; summa
  moms; totalbelopp inklusive öresutjämning; månadsavgift elhandel = 0; fast påslag = 1,70 öre/kWh.
- **B.** Även "El inkl elcert" = spotpris + rörliga kostnader + 1,70 öre/kWh, för alla sex månader.
- **C.** Referensen använder heltalsaritmetik (BigInt) och är därför oberoende av sidans flyttalsberäkning.
  Kontrollerat: faktura med Eneas, skillnad i kr och %, summaraden (kWh, faktura, vägt snitt, skillnad),
  Eneas pris lika med Kraftringens pris ger exakt noll, och ogiltig inmatning (text, för stort tal, negativt tal)
  ignoreras. Modellen byter ut bara elhandelsdelen i fakturans faktiska belopp. Räknad från grunden i stället
  (utan förankring i fakturan) skiljer sig resultatet högst 2,98 kr per månad, vilket beror på att fakturans
  öre-priser är avrundade till två decimaler.
- **D.** Totalbelopp mot tidigare debiterat (kr): jan 37 341 (0), feb 36 647 (0), mar 19 213 (0), apr 17 872 (−1),
  maj 23 522 (+1), jun 24 015 (−2). Avvikelserna beror på att mätarställningarna i underlagen är avrundade till
  heltal (se punkt 3). Kent godtog avrundningsfel på någon krona.
- **E.** Fakturanummer och "Hela fakturan" för alla sex månader är dessutom kontrollerade maskinellt (steg B).

## 3. Observationer

1. **Mätarställningarna i underlagen är upp till 0,9 kWh högre än på fakturorna.** Exempel: fakturan visar
   212 332,46 och underlaget 212 333; fakturan 272 408,12 och underlaget 272 409. Förbrukningen stämmer ändå
   med fakturan inom avrundning, eftersom både ingående och utgående ställning är avrundade.
2. **Underlagens belopp per rad skiljer sig något från mallen.** Januari: el inkl elcert 20 274,45 kr i
   underlaget mot 20 274,73 kr i mallen; summa exkl. moms 29 872,63 mot 29 873,04. Underlaget verkar räkna med
   hyresgäst-kWh med decimaler (cirka 16 585,8 enligt beloppen; en slutsats, inte kontrollerad mot kalkylbladet)
   medan mallen använder det avrundade heltalet. Mars stämmer
   exakt på alla rader. Totalbeloppen stämmer inom 2 kr.
3. **Juni avviker mest (−2 kr).** Underlaget visar bastu herr 3 916 + dam 3 515 = 7 431, men bastu TOT 7 430.
   Ställningarna är alltså avrundade i underlaget. Med ställningar med decimaler försvinner avvikelsen.
4. **Rättade belopp april–juni** (17 873, 23 521, 24 017 kr) är härledda ur de gamla underlagen minus fast
   nätavgift (PRD.md, avsnitt 4.3) och kan inte kontrolleras mot något originaldokument. Härledningen stämmer
   (till exempel april: 22 662 − 3 831,44 × 1,25 = 17 872,70 kr).

## 4. Det som inte är kontrollerat (begränsningar)

- **Granskaren är inte oberoende.** Samma person byggde sidorna och granskade dem. Maskinella kontroller
  minskar risken, men en oberoende granskning rekommenderas (se avsnitt 5).
- **Bilderna** (debiteringsunderlagen) går inte att läsa maskinellt. Stickprovet omfattar tre av sex månader.
  Bastu- och varmvattenmätarna för februari, maj och juni är bara kontrollerade genom att mätarkedjan stämmer
  (varje månads ingående ställning är föregående månads utgående), inte genom omläsning.
- **Antaganden i jämförelsen kan inte avgöras med kod:**
  - Att Kraftringens "El inkl elcert" (spotpris + rörliga kostnader + 1,70 öre/kWh) är jämförbart med Eneas pris.
    Fakturan anger inte vad de rörliga kostnaderna innehåller (till exempel elcertifikat).
  - Att nät, energiskatt och fast nätavgift är oförändrade, och att Eneas fakturerar med 25 % moms.
  - Att kvartspris (Kraftringen) och Eneas avräkning ger jämförbara månadsvärden.
  - Att restaurangens kWh (total minus bastu minus varmvatten) är rätt uppdelning.
- **Mallens knappar och utskrift** (kopiering, PDF-utskrift) är funktionstestade men inte provklistrade i
  Outlook eller Gmail.

## 5. Granskning 2: oberoende granskning (rekommenderas)

Vad en oberoende granskare bör göra, utan att ta del av egenkontrollens slutsatser före sin egen genomgång:

1. Läs fakturorna själv (PDF) och jämför alla siffror i `enea_jamforelse.js` (`MANADER`) och i
   `intern_underlag.js` (`STANDARD`).
2. Läs de sex bilderna i `Kraftringen/Intern_debitering/` och jämför varje mätarställning, pris, fakturanummer och
   belopp med `intern_underlag.js`. Slumpa gärna månaderna och ta alla sex.
3. Räkna om formlerna ur `README.md` (avsnittet "Så räknas fakturan med Eneas") och avsnitt 5 i `PRD.md` för
   minst tio slumpade prisuppsättningar, för hand eller i ett eget program, och jämför med sidan.
4. Bedöm antagandena i avsnitt 4 och föreslå hur de bör redovisas på sidan.
5. Rapportera avvikelser i en tabell: fil, fält, förväntat värde, värde i sidan, källa.

## 6. Så körs egenkontrollen om

Filerna ligger i mappen `kvalitetsgranskning/`. Kör i den ordningen, med arbetsmappen satt till den mappen:

```powershell
python lasa_fakturor.py        # läser PDF-fakturorna med kod, skriver fakturor.json
node dumpa_js.js               # läser ut datatabellerna ur sidornas JavaScript, skriver jsdata.json
python granska_data.py         # steg A och B
python granska_intern.py       # steg D (kräver att värdena i listan VIS är aktuella, se skriptet)
```

`testa_modellen_i_webblasaren.js` (steg C) klistras in i webbläsarens konsol på `enea_jamforelse.html`.
Skripten kräver `python` med paketet `pymupdf` och `node`.

## 7. Förslag på justering av texten på sidan

UPPDATERING 2026-10-06: Sidorna sa tidigare att siffrorna "inte är kvalitetssäkrade". Det stämde tills en oberoende
granskning var gjord. Efter granskning 2 ändrades texten (beslut av Kent) till "kontrollräknade mot dem. Antagandena i
jämförelsen är inte avgjorda", på alla sidor och i alla dokument utom granskarens egen rapport och den ursprungliga
`Cursor_startprompt.md`. Orden "kvalitetssäkrade" undviks medvetet: det som gjorts är en granskning (se avsnittet
"Tvåstegsgranskning" överst), inte en kvalitetssäkring.

Tidigare förslag, för historiken:
Efter den kan texten ändras till vad som faktiskt är gjort, till exempel: "Siffrorna är hämtade ur Kraftringens
fakturor och kontrollräknade mot dem (se granskningen). Antagandena i jämförelsen är inte granskade."
Det är Kents beslut när och hur texten ändras.
