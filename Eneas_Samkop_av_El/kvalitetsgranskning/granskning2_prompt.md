# Granskning 2: uppdraget till den oberoende granskaren

Det här är uppdraget som gavs till den oberoende granskningen 2026-10-06, ordagrant. Resultatet står i
`granskning2_resultat.md`. Uppdraget sparades i projektet först efter att granskningen var körd.

Godkänd-kriterierna längre ned fanns med i uppdraget innan granskningen kördes. Utfallet mot kriterierna redovisas
på sidan `kvalitetsgranskning.html`.

---

```text
Du ska göra en oberoende kvalitetsgranskning av siffror och beräkningar i en liten webbsida. Du får inte lita på att
något redan är kontrollerat. Läs källorna själv. Ändra ingenting i projektets filer. Skriv bara din rapport till
den fil som anges sist. Skicka ingenting till någon.

VIKTIGT FÖR OBEROENDET: Läs INTE filerna Eneas_Samkop_av_El/KVALITETSGRANSKNING.md, mappen
Eneas_Samkop_av_El/kvalitetsgranskning/ eller avsnitt 13 i Eneas_Samkop_av_El/PRD.md förrän du är klar med
din egen genomgång och har skrivit din rapport. Där finns en tidigare egenkontroll som inte ska påverka dig.

Projektmapp: Bjerred-el (mappen du har fått tillgång till).

Bakgrund: Bjerreds Saltsjöbad köper el av Kraftringen. Webbsidorna jämför vad som betalades januari–juni 2026 med
vad det hade blivit med en annan elhandlare (Eneas), och räknar ut restaurangens (hyresgästens) andel.

Källor (sanningen):
1. Kraftringen/Fakturor/*.pdf: sex fakturor, en per månad.
2. Kraftringen/Intern_debitering/*.jpg: sex bilder av debiteringsunderlag (kalkylblad). Läs varje bild själv.
   Obs: bilderna för april–juni visar det gamla beloppet med fast nätavgift. Hyresgästen ska aldrig betala fast
   nätavgift, så rätt belopp är det utan den (se PRD.md avsnitt 4.3).

Det som ska granskas (läs koden):
- Eneas_Samkop_av_El/enea_jamforelse.js, listan MANADER
- Eneas_Samkop_av_El/intern_debitering.js, listan MANADER
- Eneas_Samkop_av_El/intern_underlag.js, listan STANDARD
- Formler: Eneas_Samkop_av_El/README.md (avsnittet "Så räknas fakturan med Eneas") och
  Eneas_Samkop_av_El/PRD.md avsnitt 5 och 4.3

Gör så här:
1. DATA. Läs alla sex fakturor (kWh, belopp, öre-priser, nätavgift, energiskatt, fast avgift, fakturanummer) och
   jämför med enea_jamforelse.js och intern_underlag.js. Läs alla sex bilder (alla mätarställningar, priser,
   fakturanummer, Hela fakturan, totalbelopp) och jämför med intern_underlag.js och intern_debitering.js. Ta alla
   sex månader och alla fält, inte ett urval.
2. FAKTURORNAS EGEN RÄKNING. Kontrollera att kWh × öre/kWh = belopp (fakturans öre-priser är avrundade till två
   decimaler, så små skillnader är väntade), att moms är 25 %, och att summorna och totalbeloppet stämmer.
3. FORMLER. Räkna med eget program eller för hand fram minst tio olika prisuppsättningar (Eneas öre/kWh för olika
   månader, med och utan månadsavgift) och jämför med vad formeln i README ger. Räkna också debiteringsunderlaget
   från mätarställningar till totalbelopp för alla sex månader enligt PRD.md avsnitt 5. Visa hur du räknat så att
   det går att göra om.
4. ANTAGANDEN. Bedöm om jämförelsen är rimlig i sak och ange för varje punkt: rimligt, oklart eller problematiskt,
   med en kort motivering och ett förslag på hur det bör formuleras på sidan:
   (a) att Kraftringens "El inkl elcert" (spotpris + rörliga kostnader + 1,70 öre/kWh) är jämförbart med ett
       Eneas-pris, och om elcertifikat ingår,
   (b) att nät, energiskatt och fast nätavgift är oförändrade,
   (c) att moms är 25 % och gäller på samma sätt hos Eneas,
   (d) att restaurangens kWh = total − bastu − varmvatten är en rimlig uppdelning,
   (e) kvartspris (Kraftringen) mot månadsvärden.

Så bedöms din rapport (godkänd-kriterier):
- En tabell över alla kontrollerade fält: fil, fält, förväntat värde, värde i sidan, källa (fil och sida/bild).
- Inga okända avvikelser i data. Tillåtna avvikelser: mätarställningar som är avrundade heltal (högst 1 kWh från
  fakturans) och totalbelopp som avviker högst 2 kr från tidigare debiterat på grund av detta. Klassa varje
  avvikelse du hittar som fel, avrundning eller tolkning.
- Egna beräkningar enligt punkt 3 som kan göras om. Faktura med Eneas ska stämma exakt med README:ns formel, eller
  inom 3 kr om du räknar från grunden utan att utgå från fakturans belopp.
- En bedömning av varje antagande enligt punkt 4.
- En lista över det du inte kunde kontrollera (till exempel en bild eller PDF som inte gick att läsa) och hur säker
  du är på rapporten som helhet.

Regler: Hitta inte på siffror. Skriv "kunde inte läsa" om något inte går att läsa. Gissa inte. Skriv på svenska.

Spara rapporten som Eneas_Samkop_av_El/kvalitetsgranskning/granskning2_resultat.md. När du är klar kan du läsa
den tidigare egenkontrollen och kort jämföra: skriv då en separat rubrik "Jämförelse med egenkontrollen" sist.
```
