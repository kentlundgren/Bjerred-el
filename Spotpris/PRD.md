# PRD – Spotpris månad för månad, och jämförelse med Kraftringen och Eneas

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad
Mapp: `Spotpris/` (all utveckling sker inom denna mapp)
Status: Utkast 5, 2026-10-07 (förstudie 1–5 i avsnitt 4; beslut efter Kents svar 2026-10-07: förbrukningen uppskattas baklänges, sidan är öppen; verkliga öppettider inlagda; luft-värmepump till restaurangen antas; genomläst med nya ögon och klar för SPEC.md av beräkningsskriptet, se avsnitt 11–12)
Ansvarig: Kent Lundgren

> OBS! Siffrorna i förstudien (avsnitt 4) är framräknade ur spotpriser från elprisetjustnu.se och spotpriset på
> Kraftringens fakturor. De är inte granskade i den tvåstegsgranskning som gjorts för `Eneas_Samkop_av_El/`.
> Kontrollera mot källan innan något återges.

---

## 1. Bakgrund

Bjerreds Saltsjöbad köper el av Kraftringen. Fakturan för elhandeln består av tre poster som vi känner månad för månad
(Kraftringen, 2026): **spotpris**, **rörliga kostnader** och **fast påslag** (1,70 öre/kWh). Tillsammans är det
Kraftringens "allt elpris". I jämförelsen med Eneas (`Eneas_Samkop_av_El/`) fyller Eneas i sitt eget "allt elpris".

Det som saknas är **referensen i botten: själva spotpriset på elbörsen, månad för månad**. Med den kan vi svara på:

- Hur mycket tar Kraftringen över spotpriset (rörliga kostnader + påslag), månad för månad?
- Vad skulle Eneas pris innebära i förhållande till spotpriset, och hur stor är Eneas implicita marginal?
- Stämmer spotpriset på fakturan med börsens pris för vår förbrukning, eller skiljer det sig av en anledning vi kan förklara?

Spotpriset är dock olika för varje kvart (sedan 2025-10-01) eller timme (före det) och varierar kraftigt över dygnet. Att
få fram **ett** pris för en hel månad är därför inte en självklarhet. Det är kärnfrågan i det här dokumentet.

## 2. Mål

1. Ta fram spotpriset (elområde SE4) för varje månad, januari–juni 2026 och därefter framåt, på ett sätt som är
   **förklarat, reproducerbart och kontrollerbart**.
2. Visa spotpriset bredvid Kraftringens pris (spotpris, rörliga kostnader, fast påslag, allt elpris) och bredvid Eneas
   pris, i en tabell och ett diagram.
3. Kunna **förklara varför spotpriset på fakturan blir som det blir** för vår förbrukning, genom att reproducera det med
   börsens priser och vår förbrukning per kvart eller timme (M3), eller, tills sådana data finns, med en förbrukning som uppskattas
   baklänges ur fakturornas spotpris (M4b). Se avsnitt 3, 4.2 och 9.

Ej mål (i första versionen): prognoser framåt, automatisk handel eller byte av avtal, och ändringar i
`Eneas_Samkop_av_El/`, annat än eventuella länkar mellan sidorna.

## 3. Kärnfrågan: vad är "månadens genomsnittliga spotpris"?

Spotpriset ändras varje kvart (från 1 oktober 2025 är det kvartspriser på dagen före-marknaden, tidigare timpriser
(Varberg Energi, 2025)). Ett månadspris måste därför räknas fram. Det finns minst fyra rimliga sätt, och de ger olika svar:

| Metod | Beskrivning | Behöver förbrukningsdata? | Svarar på |
|-------|-------------|---------------------------|-----------|
| **M1** Enkelt snitt, dygnet runt | Medelvärdet av alla kvartar (eller timmar) i månaden. | Nej | Vad kostade elbörsen i genomsnitt under månaden? |
| **M2** Enkelt snitt, 06–22 | Medelvärdet av kvartarna mellan kl. 06:00 och 22:00 varje dag (anläggningens antagna förbrukningstid). | Nej | Vad kostade elbörsen i genomsnitt under våra öppettider? |
| **M3** Förbrukningsviktat snitt | Σ(pris × förbrukning) / Σ(förbrukning), kvart för kvart (eller timme för timme). | **Ja** | Vad betalade vi i genomsnitt per kWh för den el vi faktiskt förbrukade? |
| **M4a** Viktat mot en antagen profil | Som M3 men med en antagen förbrukningsprofil i stället för mätdata. Delarna (bastu, varmvatten, restaurang) har kända kWh per månad och antagna öppettider. | Nej (en antagen profil) | En uppskattning av M3 när mätdata saknas, utan att titta på fakturan. |
| **M4b** Kalibrerad profil ("baklänges") | Som M4a, men profilens okända delar (till exempel när uppvärmningen startar och när restaurangen drar el) anpassas så att det viktade spotpriset stämmer med fakturans spotpris. Förslag av Kent 2026-10-07. | Nej (men fakturans spotpris används) | Vilken förbrukning som är **förenlig** med fakturan. En uppskattning, inte en mätning. |

**Beslut 2026-10-07:** förbrukning per kvart går kanske att få fram, men tills vidare uppskattas förbrukningen "baklänges" ur fakturornas
spotpris (M4b). M3 byggs så snart mätdata finns och blir då facit för hur bra uppskattningen var. M4b ersätter inte M3: den är
en reservlösning med en tydlig osäkerhet (se förstudie 2 och avsnitt 9–10).

**Bedömning:** M3 är det riktiga svaret på "vilket spotpris betalar vi", eftersom det är så en elhandlare med kvartsavräkning
räknar. Fakturornas spotpris har fler decimaler än de två som visas (implicit pris 117,3807 i stället för 117,38 för
januari, enligt granskningen av fakturorna), vilket tyder på att beloppet räknas per kvart och inte som ett enkelt snitt. Det är
en slutsats och inte något Kraftringen har bekräftat. M1 och M2 behövs ändå, eftersom de går att räkna utan förbrukningsdata
och visar hur mycket viktningen betyder.

## 4. Förstudier (2026-10-07)

Fem förstudier gjordes i följd, och varje bygger på den förra. Skript, och för förstudie 5 diagrammet, ligger i [`forstudie/`](forstudie/).

### 4.1 Förstudie 1: M1 och M2 mot fakturornas spotpris

Spotpriser för SE4 hämtades för alla 181 dygn januari–juni 2026 från elprisetjustnu.se (96 kvartspriser per dygn, utom
2026-03-29 som har 92 på grund av sommartiden) och räknades fram till M1 och M2. Skripten ligger i
[`forstudie/`](forstudie/) (`hamta_forstudie.py`, `rakna_forstudie.py`).

| Månad | Kvartar | M1 dygnet runt (öre/kWh) | M2 06–22 (öre/kWh) | Spotpris på fakturan (öre/kWh) | Fakturan jämfört med M1 | Fakturan jämfört med M2 | Lägsta pris | Negativa kvartar |
|-------|--------:|-------------------------:|-------------------:|-------------------------------:|------------------------:|------------------------:|------------:|-----------------:|
| Jan | 2 976 | 112,99 | 125,76 | 117,38 | +4,39 | −8,38 | 2,7 | 0 |
| Feb | 2 688 | 113,29 | 125,16 | 116,68 | +3,39 | −8,48 | 11,4 | 0 |
| Mar | 2 972 | 84,59 | 89,20 | 86,59 | +2,00 | −2,61 | −3,1 | 26 |
| Apr | 2 880 | 66,54 | 65,41 | 63,12 | −3,42 | −2,29 | −6,1 | 115 |
| Maj | 2 976 | 94,61 | 86,24 | 88,19 | −6,42 | +1,95 | −17,0 | 128 |
| Jun | 2 880 | 103,72 | 96,46 | 100,09 | −3,63 | +3,63 | −1,9 | 59 |

**Vad förstudien visar:**

1. **Varken M1 eller M2 träffar fakturan.** Skillnaderna är 2–8 öre/kWh, alltså flera procent av priset.
2. **Fakturans spotpris ligger mellan M1 och M2 i fem av sex månader** (januari, februari, mars, maj, juni). April ligger
   under båda.
3. **Tolkning (hypotes, inte verifierad):** förbrukningen sker både dagtid och nattetid, och i april (115 negativa kvartar)
   och maj (128) kan förbrukning vid låga eller negativa priser dra ned snittet. Det går bara att avgöra med förbrukningsdata
   per kvart (M3).
4. M2 är högre än M1 i januari–mars och lägre i maj–juni. Skillnaden mellan dagtid och dygnet runt byter alltså tecken över året.
5. **Slutsats för PRD:n:** att anta "förbrukning 06–22" och räkna M2 ger ett missvisande resultat. **Att få förbrukningsdata
   per kvart eller timme är det viktigaste enskilda steget** (fråga 2 i avsnitt 5).

**Begränsningar i förstudien:** spotpriserna kommer från en sammanställning på elprisetjustnu.se, inte direkt från elbörsen
(se avsnitt 6). Fakturornas spotpris är avlästa ur PDF-fakturorna. Inget av dem är kontrollerat mot en andra källa än så här.

### 4.2 Förstudie 2: uppskattad förbrukning "baklänges" (2026-10-07)

**Utgångspunkter.** Kent uppger att bastun är öppen kl. 06–22 varje dag och att restaurangen är öppen eftermiddagar och kvällar. Vi har dessutom
**kWh per månad för varje del** ur debiteringsunderlagen: bastu (herr + dam), varmvatten och restaurangen (huvudmätaren minus bastu minus
varmvatten). Delarnas andel av månadens kWh varierar: bastu 36–45 %, varmvatten 7–18 %, restaurang 37–57 %. Skripten är
`forstudie/modell_profil.py` (kör efter `hamta_forstudie.py`).

**Modellerna.** Fel = modellens viktade spotpris minus fakturans (öre/kWh, plus betyder att modellen räknar för högt).

| Modell | Antagande om när el används | Fel per månad jan–jun | RMS-fel |
|--------|-----------------------------|-----------------------|--------:|
| **A** | En blandning av jämn förbrukning dygnet runt (M1) och jämn förbrukning 06–22 (M2). Lös blandningen per månad. | Går jämnt ut per definition, men blandningen blir 0,34, 0,29, 0,43, **3,02**, 0,77 och 0,50. | – |
| **B** (Kents öppettider) | Bastu jämn 06–22, varmvatten jämn dygnet runt, restaurang jämn 12–22. | +7,86, +5,15, +2,67, +0,18, −0,70, −0,45 | 4,00 |
| **C** (anpassad) | Bastu jämn 01–22 (uppvärmning före öppning), varmvatten jämn dygnet runt, restaurang jämn 10–24. | +1,63, +0,18, −1,59, −0,08, +1,33, +0,92 | 1,14 |
| M1 (för jämförelse) | Jämn förbrukning dygnet runt. | −4,39, −3,39, −2,00, +3,42, +6,42, +3,63 | 4,10 |
| M2 (för jämförelse) | Jämn förbrukning 06–22. | +8,38, +8,48, +2,61, +2,29, −1,95, −3,63 | 5,34 |

**Leave-one-out för modell C** (anpassa antagandena på fem månader och förutsäg den sjätte; fel i öre/kWh): jan +3,00, feb +1,05, mar −1,97,
apr −0,08, maj +1,33, jun +0,92.

**Vad förstudien visar:**

1. **Kents öppettider räcker inte ensamma** (modell B, RMS 4,0, i nivå med M1 på 4,1). De ger för högt pris i vintermånaderna, alltså att verklig förbrukning ligger mer i
   billiga timmar (natt och tidig morgon) än modellen antar. Modell A visar samma sak: april går inte att få ihop med någon blandning av jämn
   dygnsförbrukning och jämn 06–22-förbrukning (blandningen 3,02).
2. **Med en förbrukning som börjar före 06 och som restaurangen sträcker sig sent på kvällen** ligger modellen inom 2 öre/kWh per månad (RMS 1,1) och
   förutsäger en utelämnad månad inom 3 öre/kWh. Det är en klart bättre uppskattning än M1 och M2 (RMS 4,1 och 5,3, fel upp till 8,5 öre/kWh).
3. **Det går alltså att uppskatta M3 baklänges med några öre/kWh i osäkerhet.** Då kan även Kraftringens "påslag över spot" och Eneas marginal
   jämföras på en rimlig nivå.
4. **Profilen är inte entydig.** Modellen kan inte skilja uppvärmning av bastun före 06 från annan förbrukning på natten (kyl, ventilation, värme,
   belysning). Av 252 testade kombinationer hade 27 ett RMS-fel under 2 öre/kWh och ingen under 1,0. Förstudien visar **inte** att bastun faktiskt
   värms upp från kl. 01. Det är en hypotes som förbrukningsdata eller kunskap om bastuaggregatets drift kan bekräfta eller avfärda.
5. **Priset per timme styr resultatet.** I januari är det billigast nattetid (cirka 81–89 öre/kWh kl. 00–05) och dyrast kl. 16–18 (143–151). I maj är det
   tvärtom: lågt mitt på dagen (cirka 37–46 öre/kWh kl. 11–14), dyrt på kvällen (143–159 kl. 19–21). Därför skiljer sig en förbrukning på dagen och en på kvällen
   mycket mer i maj än i januari.

### 4.3 Förstudie 3: verkliga öppettider, veckodagar och baslast (2026-10-07)

**Nya uppgifter.** Kent: bastun var öppen 06–22 men har på sista tiden ändrat till 07.30–22. Restaurangen har ett par kylar. Varmvattenmätaren mäter kWh el
och gäller varmvatten till duschar och restaurang. Restaurangens tider antas ha gällt januari–juni, men det är inte säkert.
**Hemsidorna** (lästa 2026-10-07): badet är öppet 07.30–22.00 alla dagar, sista inpassering 21.30 och bastun stänger 21.45 (Bjerreds Saltsjöbad, u.å.a). Badavdelningarna
städas varje dag före 07.30, och från 1 maj är badet öppet hela dagen utan avbrott för städning (Bjerreds Saltsjöbad, u.å.a; tider för städavbrott före 1 maj anges inte).
Restaurangen är stängd måndag–tisdag, öppen onsdag–fredag 16.00–22.00, lördag 11.00–22.00 och söndag 11.00–17.00 (Bjerreds Saltsjöbad, u.å.b).

**Modellerna D1–D3** (kallas D för att skilja dem från A–C i förstudie 2). Profilen räknas per kvart och veckodag (skript `forstudie/modell_veckodag.py`): bastu jämn från öppning (minus eventuell uppvärmning) till 22, restaurangen som en
**baslast** (andel av kWh jämn dygnet runt) plus en **driftdel** enligt öppettiderna per veckodag (med eventuell förberedelse före öppning), och varmvatten antingen jämnt dygnet
runt eller enligt bastuns och restaurangens tider. Fel = modellens viktade spotpris minus fakturans (öre/kWh).

| Antagande | RMS-fel | Fel jan–jun |
|-----------|--------:|-------------|
| D1. Bara öppettider: bastu 06–22, varmvatten dygnet runt | 3,43 | +2,50, +1,17, +4,43, +3,43, −2,35, −5,10 |
| D1. Bara öppettider: bastu 07.30–22, varmvatten dygnet runt | 3,54 | +3,65, +1,66, +3,28, +1,80, −3,62, −5,65 |
| D2. Plus baslast 80 % av restaurangens kWh (bastu 07.30–22, varmvatten dygnet runt) | 1,38 | +2,39, +1,52, −0,19, +1,42, +0,88, −0,75 |
| D3. Bäst av 2 652 kombinationer: bastu 07.30–22 med uppvärmning 4,5 h före öppning, baslast 80 %, restaurangens förberedelse 1 h, varmvatten enligt tider | 1,16 | −0,22, −0,05, +0,03, +2,09, +1,25, −1,45 |
| D3. Leave-one-out (förutsäg utelämnad månad) | – | +2,39, −0,05, +0,03, +2,09, +1,25, −3,70 |

**Vad förstudie 3 visar:**

1. **Öppettiderna räcker inte ensamma** (RMS 3,4–3,5, i nivå med M1). Felet byter tecken: för högt pris i januari–april, för lågt i maj–juni.
2. **Det som kallas "restaurangen" är en restpost** (huvudmätaren minus bastu minus varmvatten): allt annat som drar el på anläggningen och inte har egen mätare ligger i den
   (till exempel ventilation, uppvärmning, belysning, kyl- och frysrum, kök och vinterträdgården, om de finns). Modellen blir klart bättre (RMS 1,4–1,7) när 75–80 % av den delen är jämn dygnet runt. Storleksordning: 75 % av restposten motsvarar 10–18 kW dygnet runt.
   Ett par kylar kan inte vara hela förklaringen (om en kylanläggning drar 0,2–0,5 kW blir det högst någon halv kW för ett par, ett grovt antagande av oss, inte en uppgift).
   Det måste alltså finnas större förbrukare som går dygnet runt. Det är en hypotes, och fråga 17 i avsnitt 5 gäller just det.
3. **Bästa träffen har uppvärmning av bastun 4–5 timmar före öppning (kring kl. 03).** Att badavdelningarna städas före 07.30 (hemsidan) stöder att det sker förbrukning före öppning,
   men **tidpunkten går inte att läsa ur modellen**: 728 av 2 652 testade kombinationer har RMS under 2 öre/kWh, och ingen under 1,0.
4. **Mer realistiska antaganden gav inte en bättre förutsägelse.** Passningen är i praktiken lika som i förstudie 2 (RMS 1,16 mot 1,14), och leave-one-out-felet är som störst 3,7 öre/kWh (juni),
   större än i förstudie 2 (3,0). Flera fria parametrar kan ge en passning som ser bättre ut än den är. Passning är inte förutsägelseförmåga.
5. **Slutsatsen från förstudie 2 gäller fortfarande:** att viktningen betyder 2–8 öre/kWh och går åt båda hållen är säkert. Profilen bakom är osäker, och förbrukningsdata per kvart eller timme (M3) är det som
   avgör saken.

### 4.4 Förstudie 4: väderberoende värme (2026-10-07)

**Ny uppgift (Kent):** ventilation, värme och belysning går dygnet runt. Det finns ingen golvvärme i vinterträdgården. Belysningen drar inte mycket mitt i natten. Det stöder
att restpostens stora baslast (förstudie 3) är ventilation och värme, inte belysning eller kylar.

**Test.** Värme är väderberoende: mer vid kallt väder, och kallt väder går ofta ihop med höga spotpriser. Restposten delades därför i ventilation (jämn effekt V, kW), värme (H kW per
grad under en gränstemperatur, efter utetemperaturen timme för timme) och en driftdel enligt restaurangens öppettider. Utetemperaturen hämtades från Open-Meteo (modellerad data för ett
rutnät vid Bjärred, inte en mätstation; månadsmedel januari −0,9, februari −0,9, mars 4,8, april 6,9, maj 11,8 och juni 17,0 °C). Skript: `forstudie/hamta_temperatur.py` och `modell_vader.py`.

| Modell | Bästa passning (RMS, öre/kWh) | Leave-one-out | Kombinationer med RMS under 2 |
|--------|------------------------------:|---------------|------------------------------:|
| Bara ventilation (jämn effekt) | 1,21 (V = 13 kW) | +2,73, −0,54, saknas, +2,74, +1,35, −3,59 | 334 av 1 176 |
| Ventilation + värme efter utetemperatur | 1,21 (bästa värmen: H = 0) | samma | 6 130 av 64 176 |

**Vad förstudie 4 visar:**

1. **Väderberoende värme förbättrar inte uppskattningen.** Den bästa passningen väljer att inte ha någon värme efter utetemperatur alls. Med bara sex månadsvärden går värmens bidrag inte att skilja från
   en jämn baslast.
2. **Mer flexibilitet gör osäkerheten större:** 6 130 kombinationer ger RMS under 2 öre/kWh. Modellen kan inte avgöra *vad* baslasten består av, bara att en stor jämn baslast (cirka 12–13 kW) passar.
3. **Mars kunde inte förutsägas i leave-one-out.** De fem andra månaderna gav en baslast på 14 kW, som ger 10 402 kWh i mars, medan marsmånadens hela restpost är 10 302 kWh. Det visar att baslast och
   driftdel inte kan fås ur sex månadsvärden samtidigt. Med baslasten fast blir driftdelen dessutom 37–42 % av restposten i januari–februari men 13–16 % i april–juni, alltså något som i verkligheten
   mer liknar vinterns extra uppvärmning än restaurangens drift. Modellen kan inte avgöra det.
4. **Beslut för första bygget:** utetemperatur ingår **inte**. Den kräver en extra datakälla med oklara villkor och ger ingen förbättring. Frågan kan tas upp igen när förbrukningsdata per kvart (M3) finns, eftersom
   värmens väderberoende då går att se direkt (fråga 20).

### 4.5 Förstudie 5: uppskattad effektkurva (2026-10-07)

Kent föreslog att modellen också borde ge en **ungefärlig effektkurva**: medeleffekt (kW) timme för timme. Det går, eftersom modellen fördelar varje del av månadens kWh över dygnet.
Diagrammet [`forstudie/effektkurva.svg`](forstudie/effektkurva.svg) visar medeleffekt per timme på dygnet för varje månad, uppdelad på ventilation/baslast, varmvatten, bastu och restaurangens drift, med
ett grått band för 66 alternativa lika bra passningar (RMS högst 1,5 öre/kWh). Skript: `forstudie/effektkurva.py`.

| Månad | Medeleffekt (kW) | Topp (kW, kl.) | Bandet vid toppen (kW) | Lägsta (kW) |
|-------|-----------------:|---------------:|-----------------------:|------------:|
| Januari | 47,6 | 76,6 (16) | 69–90 | 13,0 |
| Februari | 47,6 | 80,6 (16) | 72–95 | 13,0 |
| Mars | 37,8 | 50,9 (16) | 45–61 | 13,0 |
| April | 37,0 | 53,0 (16) | 47–64 | 13,0 |
| Maj | 32,2 | 46,0 (16) | 42–57 | 13,0 |
| Juni | 28,6 | 39,8 (16) | 38–51 | 13,0 |

**Vad det visar och inte visar:**

1. **Medeleffekten är känd och säker:** den är månadens kWh delat på timmarna (januari 35 422 kWh / 744 h = 47,6 kW).
2. **Kurvans form är modellens antaganden, inte en mätning.** Varje del är ett jämnt block mellan antagna tider, så kurvan är en trappa. Nivån i varje block styrs av månadens kWh, men *när* effekten
   tas ut styrs av antagandena. Förstudien visar inte att bastuns uppvärmning verkligen börjar kl. 03, eller att toppen verkligen ligger kl. 16.
3. **Toppen är en timmedel.** Verkliga toppar (till exempel när bastuaggregaten och köket går samtidigt) är kortvariga och högre än ett timmedel, och syns bara i kvartsdata.
4. **Sanity-check:** abonnemanget är 200 A (fakturorna), vilket för 3-fas 400 V motsvarar högst cirka 139 kW. Uppskattade timtoppar på 40–81 kW (band upp till 95 kW) ligger under det. Det är en övre gräns, inte
   en uppgift om förbrukningen.
5. **Det som skulle göra kurvan till en effektkurva på riktigt är förbrukning per kvart eller timme** (fråga 2). Då kan den uppskattade kurvan prövas mot den verkliga, och M4b får sin validering.
6. **Användning:** kurvan kan visa var i dygnet effekten ligger (till exempel om toppen sammanfaller med dyra timmar) och hur stor spridningen mellan lika bra antaganden är. Den ska märkas som en uppskattning
   överallt där den visas.

## 5. Frågor som måste redas ut

| Nr | Fråga | Varför | Förslag |
|----|-------|--------|---------|
| 1 | Vilken metod är den primära för "månadens spotpris"? | Styr hela jämförelsen. | **Besvarad 2026-10-07:** förbrukningen uppskattas baklänges (M4b) tills förbrukningsdata finns. M3 när data finns. M1, M2 och M4a redovisas som jämförelse, och varje värde märks med metod. |
| 2 | **Går det att få förbrukningen per kvart eller timme** för januari–juni 2026 (och framåt) och från vem? Kraftringen Nät AB som nätägare, Kraftringen Energi AB som elhandlare, eller via mätaren? I vilket format (CSV, Excel)? Är det samma mätvärden som Kraftringen fakturerar på? | Krävs för M3 och för att kontrollera antagandet om 06–22. | Kent undersöker. Uppgiften är **inte verifierad här**: vi vet inte vad Kraftringen lämnar ut. |
| 3 | Stämmer det att anläggningen förbrukar el bara kl. 06–22? | Bygger M2 och M4a på ett antagande som kan vara fel. Kyl, varmvatten och värme drar normalt även på natten. | **Besvarad 2026-10-07 (nej, enligt förstudie 2 och 3):** bastun var öppen 06–22, nu 07.30–22. Restaurangen: må–ti stängt, on–fr 16–22, lö 11–22, sö 11–17 (hemsidan, antas ha gällt jan–jun). Öppettider är inte samma sak som elförbrukning: förstudierna tyder på en stor baslast dygnet runt och förbrukning före öppning. |
| 4 | Ska spotpriset visas exklusive eller inklusive moms? | Spotpriset är utan moms, skatter och tillägg (elprisetjustnu.se, u.å.). Kraftringens "allt elpris" på sidorna är också utan moms, men fakturabeloppen är med moms. | Jämför alltid i öre/kWh **exklusive moms**. Visa ev. inklusive moms (× 1,25) som extra rad. |
| 5 | Räcker elprisetjustnu.se som källa, eller ska Nord Pool eller ENTSO-E vara facit? | Elprisetjustnu.se är en sammanställning. Ursprungskällan anges inte i den dokumentation vi läst. | Använd elprisetjustnu.se som arbetskälla. Stickprova mot Nord Pool eller ENTSO-E (vad som kräver registrering och nyckel är **inte kontrollerat**). |
| 6 | Hur hanteras sommartid? | 2026-03-29 har 92 kvartar och 2026-10-25 förväntas ha 100 (kalendern). En enkel tolkning av "96 per dygn" blir fel. | All tid i lokal tid med förskjutning (som i API:ts `time_start`). Summera per verklig kvart, inte per klockslag. |
| 7 | Hur hanteras negativa priser? | Förekommer (26–128 kvartar per månad mars–juni). | Ingår i alla snitt, utan avrundning till noll. Antalet negativa kvartar redovisas. |
| 8 | Hur räknas månader före 2025-10-01 (timpriser)? | Gäller om vi vill gå bakåt utanför januari–juni 2026. | Timmar används som de är. En timme ersätter fyra kvartar med samma pris. |
| 9 | Ska jämförelsen gälla fler månader än jan–jun, till exempel juli–september 2026? | Kraftringens avtal gällde t.o.m. 2026-09-30. Nya fakturor behövs. | Första versionen: jan–jun 2026. Fler månader när fakturor och förbrukning finns. |
| 10 | Hur jämförs ett Eneas-pris med spotpriset? | Eneas säkrar priser i förväg och beskriver sig inte som en elleverantör (Eneas, 2026). Ett prissäkrat pris följer inte månadens spotpris. | Visa Eneas pris minus spotpris (implicit marginal) per månad, med en tydlig upplysning om att ett prissäkrat pris inte är jämförbart månad för månad. |
| 11 | Ingår elcertifikatet i spotpriset? | Fakturan säger inte i vilken post det ingår (granskning 2, avsnitt 5a). | Nej: spotpriset är elbörsens energipris. Elcertifikatet finns någon annanstans i Kraftringens pris, men var framgår inte. Redovisas som en känd osäkerhet. |
| 12 | Hur uppdateras data? | Månaderna tillkommer. | Ett skript hämtar och sparar data i repot, och sidan läser filen (fungerar utan nätverk). Kent kör skriptet efter varje månadsskifte. Alternativ: sidan hämtar live. Se avsnitt 7. |
| 13 | Är sidan intern eller öppen? | Förbrukningsdata kan vara känslig. Spotpriset är offentligt. | **Besvarad 2026-10-07:** sidan får vara öppen. Hela sidan, inklusive den uppskattade profilen (M4b), publiceras alltså. Om kvartsdata från mätaren senare används ska den bara redovisas som sammanvägda månadsvärden eller timprofil, inte per kvart. |
| 14 | Var länkas sidan? | Navigering. | Från elöversikten (`index.html`) och från `Eneas_Samkop_av_El/` när den är klar. |
| 15 | Hur kommer Eneas pris in i spotprissidan? | Isaks inmatning finns bara i hans egen webbläsare (och i mejlet han skickar), så den här sidan kan inte läsa den själv. | Kent skriver in priserna som en ifylld datafil (`data/eneas_pris.json`) eller i ett gult fält på sidan, när Isaks mejl kommit. |
| 16 | Räcker Kraftringens poster per månad? | `enea_jamforelse.js` har bara summan "allt elpris" (`krOre`), inte spotpris, rörliga kostnader och påslag var för sig. | Lägg in de tre posterna per månad ur fakturorna i en egen datafil här (värdena finns i förstudien och i granskningsrapporten) och kontrollera dem mot fakturorna. |
| 17 | **Vad är det som drar el dygnet runt i "restaurangens" del?** | Förstudie 3: 75–80 % av restposten ser ut att vara jämn dygnet runt, 10–18 kW. | **Delvis besvarad 2026-10-07 (Kent):** ventilation, värme och belysning går dygnet runt. Det finns ingen golvvärme i vinterträdgården. Belysningen drar inte mycket mitt i natten. Alltså är ventilation och värme de stora jämna förbrukarna (och kylar). **Uppvärmning (Kent, 2026-10-07):** bastuarna värms med el, omklädningsrummen med vattenburen el och restaurangen med el. Kent sade först att det inte finns någon värmepump, och tillade sedan att det kanske finns en värmepump till restaurangen. **Arbetsantagande 2026-10-07 (Kent): det finns en luft-värmepump till restaurangen.** Det ska bekräftas. **Kvar att besvara:** hur stor och hur styrd luft-värmepumpen är, om ventilation eller värme har nattsänkning eller timer, och om bastuns uppvärmning startar före öppning. Modellen kan inte skilja bastuns uppvärmning från annan nattförbrukning. En värmepump ändrar inte siffrorna i förstudierna (värmen är en del av baslasten, och väderberoende värme gav ingen förbättring, förstudie 4), men den ändrar hur baslasten ska tolkas och hur väderberoende den kan förväntas vara. |
| 18 | Gällde restaurangens tider (må–ti stängt, on–fr 16–22, lö 11–22, sö 11–17) och badets 07.30–22 hela januari–juni 2026? När ändrades bastuns tid från 06–22 till 07.30–22? Fanns städavbrott före 1 maj, och när? | Tiderna i modellen kommer från hemsidorna 2026-10-07. Kent antar att de gällde jan–jun. | Kent bekräftar eller anger tider per månad. Modellen tar tider per månad. |
| 19 | ~~Är varmvattenmätaren i kWh el?~~ | **Besvarad 2026-10-07 (Kent):** den mäter kWh el, för varmvatten till duschar och restaurang. | När värms vattnet (tank, timer, effektbegränsning) är fortfarande okänt. Modellen provar dygnet runt och enligt bastuns och restaurangens tider. |
| 20 | Ska utetemperatur ingå i modellen? | Värme är väderberoende. Förstudie 4 gav ingen förbättring, och källan (Open-Meteo, modellerad data) har oklara villkor. | **Nej i första bygget.** Tas upp igen när förbrukningsdata per kvart finns, då värmens väderberoende kan ses direkt. |
| 21 | Hur ska effektkurvan användas och visas? (Bara i PRD och förstudie, eller på spotprissidan? Per månad, per veckodag, eller typdygn?) | En uppskattad kurva kan misstas för en mätning. Sidan är öppen. | Visa den på sidan, tydligt märkt som uppskattning med bandet synligt. Kent beslutar. |

## 6. Datakällor

| Behov | Källa | Läget |
|-------|-------|-------|
| Spotpris SE4 per kvart/timme | **elprisetjustnu.se**, API: `https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE4.json` | **Kontrollerat 2026-10-07.** JSON med `SEK_per_kWh`, `EUR_per_kWh`, `EXR` (växelkurs) och `time_start`/`time_end` med lokal tidsförskjutning. 96 rader per dygn efter 2025-10-01, 24 före. Historik från 2022-11-01. Priser utan moms, tillägg och skatter. Öppet (`access-control-allow-origin: *`). Ska anges som källa vid offentlig visning. |
| Spotpris, primärkälla | **Nord Pool** (elbörsen) och **ENTSO-E Transparency Platform** | Webbplatserna svarar. Villkor, format och krav på registrering eller API-nyckel är **inte undersökta** och ska kontrolleras om vi väljer en primärkälla. |
| Kraftringens poster | Fakturorna (`Kraftringen/Fakturor/`): spotpris, rörliga kostnader, fast påslag, månadsavgift, per månad | Finns. Redan inlästa i `Eneas_Samkop_av_El/enea_jamforelse.js`. |
| Eneas pris | Isaks inmatning ("Allt elpris") på `enea_jamforelse.html` | Finns bara i Isaks webbläsare och i den ifyllda tabell han mejlar. Hur det förs in här är en öppen fråga (avsnitt 5, fråga 15). |
| Förbrukning per kvart/timme | Kraftringen Nät AB eller Kraftringen Energi AB (mätvärden) | **Okänt om och hur det går att få.** Fråga 2. |
| Utetemperatur per timme (bara förstudie 4) | **Open-Meteo**, historical weather API | Kontrollerat 2026-10-07: timdata för alla 4 344 timmar jan–jun 2026 vid Bjärred. Det är **modellerad data** (reanalys, rutnät), inte en mätstation. Villkor och källhänvisning **inte verifierade** (licenssidan går inte att läsa utan JavaScript). Används inte i första bygget (fråga 20). |

Kontrollerat om prisdatan är konsekvent: `SEK_per_kWh` är `EUR_per_kWh` × `EXR` (exempel 2026-01-15 kl. 00:00: 0,06861 × 10,717706 ≈ 0,7354).

## 7. Lösningsförslag

**Principer:** rena HTML-, CSS- och JavaScript-filer utan ramverk och utan byggprocess, som övriga delar av projektet. Dela upp i separata
filer, kommentera i detalj, gul bakgrund bara på inmatningsfält. Källor i Harvardformat med klickbara, kontrollerade länkar.

**Datalager (förslag):**

- `Spotpris/data/spot_SE4_ÅÅÅÅ-MM.json`: rådata per månad (kvart eller timme, med lokal tid), plus metadata: källa, URL, hämtdatum, antal
  intervall och eventuella avvikelser (till exempel sommartidens 92 eller 100 kvartar).
- `Spotpris/data/manadsnitt.json`: beräknade månadsvärden (M1, M2, M3 när data finns, antal kvartar, antal negativa, lägsta och högsta).
- `Spotpris/hamta_spotpris.py`: skript som hämtar dygn för dygn, kontrollerar att alla dygn finns och att antalet intervall är rimligt, och skriver filerna.
  (Förstudiens `forstudie/hamta_forstudie.py` är ett första utkast.)

**Sida:** `Spotpris/spotpris.html`, `spotpris.css`, `spotpris.js` (versionsnummer och datum i sidfoten).

- **Tabell per månad:** M1, M2 (och M3 om data finns), Kraftringens spotpris enligt fakturan, rörliga kostnader, fast påslag, Kraftringens allt elpris,
  Eneas allt elpris (om ifyllt), skillnader i öre/kWh. Allt utan moms.
- **Diagram:** (1) månadsvärdena som staplar eller linjer, (2) medelpris per timme på dygnet för varje månad, så att skillnaden mellan natt och dag
  syns och antagandet om 06–22 går att pröva.
- **Förklaring:** en kort ruta överst om vad "månadens spotpris" betyder och varför det finns flera sätt att räkna det.
- **Hörn och teknik-modal** som på övriga sidor, med djuplänkar (`#`) vid avsnitten.

**Beräkning:** funktioner för M1, M2, M3, M4a och M4b i en egen, väl kommenterad fil, så att de går att testa mot fakturorna.

**Uppskattad förbrukningsprofil (M4a och M4b), beslutad 2026-10-07:**

- **Delar:** bastu, varmvatten och "restaurang", med kända kWh per månad (ur debiteringsunderlagen) och en förbrukningsprofil per del: vilka kvartar på dygnet och veckan
  delen drar el. "Restaurang" är en **restpost** (huvudmätaren minus bastu minus varmvatten), alltså allt utom bastu och varmvatten, och modelleras som en baslast (jämn
  dygnet runt) plus en driftdel enligt öppettiderna per veckodag. Profilerna är data (tider per del, veckodag och månad), inte inbyggda i koden, så att de går att ändra utan att räkna om för hand.
- **M4a:** profilerna sätts utifrån öppettider och driftuppgifter (Kent, fråga 17–19) utan att titta på fakturan.
- **M4b:** de okända gränserna (till exempel när bastuns uppvärmning börjar, när restaurangen slutar dra el) provas inom rimliga intervall, och den kombination
  väljs som ger lägst fel mot fakturornas spotpris. Sidan visar vilka antaganden som valdes och hur bra de passar månad för månad. Skriptet redovisar även
  hur många kombinationer som passar nästan lika bra, så att osäkerheten syns (förstudie 2: 27 av 252 under 2 öre/kWh).
- **Leave-one-out** (anpassa på alla månader utom en, förutsäg den utelämnade) körs och redovisas för M4b. Anpassning mot fakturan är **inte** en oberoende
  validering, eftersom samma faktura både styr valet och används som facit.
- **Märkning:** varje värde på sidan visar om det är M1, M2, M3, M4a eller M4b, och M4b märks tydligt som en uppskattning.

**Arbetsantaganden för M4a och M4b (2026-10-07).** Antagandena ska ligga som data och visas på sidan:

- **Bastu:** öppen 07.30–22.00 alla dagar enligt hemsidan (var 06–22 tidigare; när ändringen skedde är okänt, så båda provas). Bastuaggregaten värms med el. Om uppvärmningen startar före öppning
  är okänt och provas 0–6 timmar före.
- **Varmvatten:** kWh el, för duschar och restaurang. Provas jämnt dygnet runt och enligt bastuns och restaurangens tider.
- **Restaurang:** stängd måndag–tisdag, onsdag–fredag 16–22, lördag 11–22, söndag 11–17. Antas ha gällt januari–juni.
- **Restposten** (huvudmätaren minus bastu minus varmvatten) innehåller allt annat: ventilation, uppvärmning med el (omklädningsrum vattenburen el, restaurangen el, antagen luft-värmepump),
  belysning, kylar och kök. Ventilation, värme och belysning går dygnet runt, men belysningen drar lite på natten. Ingen golvvärme i vinterträdgården. Värmen ingår i den jämna baslasten och
  modelleras inte efter väder (förstudie 4).
- **Priser:** spotpris för SE4, utan moms, per kvart (från 2025-10-01). Månadens kWh per del hämtas ur debiteringsunderlagen.

## 8. Funktionella krav

| Nr | Krav |
|----|------|
| F1 | Hämta spotpris för SE4 för valda månader och spara som rådata med källa och hämtdatum. |
| F2 | Kontrollera data: alla dygn finns, antal intervall är 96 (92 och 100 vid sommartid) eller 24 före 2025-10-01, inga luckor. Avvikelser loggas. |
| F3 | Beräkna M1, M2, M4a och M4b och, om förbrukningsdata finns, M3. M4a/M4b enligt profilerna i avsnitt 7. Alla utan avrundning före visning. |
| F3b | M4b: pröva kombinationer av de okända gränserna inom angivna intervall, välj den med lägst fel mot fakturornas spotpris, visa valda antaganden, fel per månad, antal nästan lika bra kombinationer och leave-one-out-fel. |
| F4 | Visa en tabell per månad enligt avsnitt 7, med öre/kWh med två decimaler. |
| F5 | Visa månadsvärden och medelpris per timme på dygnet i diagram (SVG eller canvas, inga externa bibliotek). |
| F6 | Kraftringens tre poster (spotpris, rörliga kostnader, fast påslag) per månad ligger i en egen datafil, kontrollerad mot fakturorna (fråga 16). Summan "allt elpris" ska stämma med `krOre` i `Eneas_Samkop_av_El/enea_jamforelse.js`. |
| F7 | Visa Eneas allt elpris om det är ifyllt (fråga 15), och skillnaden mot spotpris och mot Kraftringen. |
| F8 | Visa tydligt vilken metod varje värde bygger på, och vilka värden som inte går att räkna (till exempel M3 utan förbrukningsdata). |
| F9 | Kopiera tabellen till urklipp så att den går att klistra in i ett mejl (samma mönster som på `enea_jamforelse.html`). |
| F10 | Fungera öppnad från fil och utan nätverk, med data från filerna i `data/`. |
| F11 | Visa en uppskattad effektkurva (kW per timme på dygnet, per månad) uppdelad på delar, med ett band för alternativa lika bra passningar, enligt förstudie 5. Märkt som uppskattning. Prövas mot förbrukningsdata när sådana finns. |

## 9. Acceptanskriterier

1. **Validering mot fakturorna:** när förbrukningsdata finns ska M3 återskapa fakturans spotpris för varje månad januari–juni 2026. Förslag på
   gräns: **högst 0,5 öre/kWh** i skillnad. Gränsen är ett förslag och fastställs efter att vi sett det första utfallet (fakturans öre-pris är avrundat
   till två decimaler). Stämmer det inte ska avvikelsen förklaras, inte döljas.
1b. **M4b (utan förbrukningsdata):** M4b ska redovisas med passning per månad och leave-one-out-fel per månad. **Gränserna fastställs av Kent innan bygget körs**, så att de inte
   flyttas efter utfallet. Förstudierna gav som utfall: passning högst 1,6 öre/kWh per månad och leave-one-out högst 3,0 (förstudie 2) respektive 3,7 (förstudie 3). Förslag att utgå från:
   passning högst 2 och leave-one-out högst 4 öre/kWh. Kriteriet är medvetet **svagare** än punkt 1: M4b anpassas mot fakturan och kan därför inte valideras mot den. När M3 finns
   jämförs M4b mot M3, och det är den jämförelsen som visar hur bra uppskattningen var.
2. M1 och M2 stämmer med förstudiens värden (avsnitt 4) för januari–juni 2026.
3. Alla dygn januari–juni 2026 finns (181 dygn) och antalet intervall stämmer med avsnitt 8, F2.
4. Sommartiden hanteras rätt: 2026-03-29 har 92 kvartar och månadsmedlen räknas på verkliga kvartar.
5. En ändrad metod eller en ny månad uppdaterar tabellen och diagrammen.
6. Sidan fungerar utan nätverk, är läsbar i mobil (16 px marginal, ingen sidledsrullning för sidan) och visar versionsnummer och datum.
7. Källor anges i Harvardformat med klickbara, kontrollerade länkar, och sidan anger att priserna är utan moms och hämtade ur angiven källa.
8. Tvåstegsgranskning (avsnitt 11) är gjord innan texten säger att siffrorna är granskade.
9. **Effektkurvan:** medeleffekten per månad är månadens kWh delat på antal timmar (kontrolleras mot huvudmätarens förbrukning), kurvan är tydligt märkt som uppskattning och bandet av alternativa passningar visas.

## 10. Risker

- **Förbrukningsdata går inte att få** (fråga 2). Då återstår M1, M2, M4a och M4b. M1 och M2 träffar inte fakturan. Slutsatsen blir då
  en uppskattning (M4b) med en tydlig osäkerhet på några öre/kWh.
- **Flera förklaringar passar lika bra (M4b).** Modellen kan inte avgöra om förbrukningen före kl. 06 är bastuuppvärmning eller annan nattförbrukning. Att
  profilen passar fakturan betyder inte att den är den verkliga. Resultaten ska därför beskrivas som "förenliga med fakturan", inte som "så här förbrukade vi".
- **Överanpassning:** sex månader och några få fria parametrar ger en passning som ser bättre ut än den är. Leave-one-out och en oberoende granskning behövs.
- **Fel källa eller fel pris:** elprisetjustnu.se är en sammanställning, och ursprungskällan anges inte där. Stickprov mot en primärkälla minskar risken.
- **Sommartid och kvartar** ger fel om dygn och klockslag förenklas (fråga 6).
- **Avtalsformen:** ett prissäkrat Eneas-pris går inte att jämföra med spotpriset månad för månad (fråga 10).
- **Kvartsövergången 2025-10-01:** data före och efter har olika upplösning. Endast aktuellt om vi går bakåt före oktober 2025.
- **Offentlig sida (beslut 2026-10-07):** förbrukningsdata per kvart kan visa när anläggningen är öppen eller stängd. Sidan får vara öppen, men rådata per kvart
  från mätaren publiceras inte. Bara sammanvägda värden per månad och medelprofil per timme visas (fråga 13). Den uppskattade profilen (M4b) är en modell och inte en mätning.
- **Oavsiktlig jämförelse av äpplen och päron:** Kraftringens spotpris på fakturan är viktat mot vår förbrukning, medan M1 och M2 är oviktade. Det måste
  framgå i varje tabell och diagram.

## 11. Kvalitetsgranskning och SPEC.md-checkpoint

**Kvalitetsgranskning.** Samma tvåstegsgranskning som i `Eneas_Samkop_av_El/` (egenkontroll med maskinell avstämning, därefter en oberoende granskning
med ett skriftligt uppdrag och godkänd-kriterier som fastställs före körningen). Stickprov av spotpriserna mot en primärkälla ingår. Texten på sidorna
anger "kontrollräknade" först när det är gjort.

**SPEC.md-checkpoint: behövs ett SPEC.md-steg härifrån?** **Ja, för beräkningsskriptet. Nej, för sidan.** (Utkast 1 svarade nej. Svaret ändrades efter förstudierna.)

Det som började som tre tal per månad har blivit en modell med ett sökrum (när bastun öppnar och värms upp, restaurangens förberedelse, baslastens storlek, varmvattnets fördelning),
leave-one-out, ett band av alternativa passningar, sommartid, negativa priser och regler för omöjliga kombinationer. Där gissar en agent lätt fel om inget är skrivet exakt. En SPEC.md ska därför fastställa:

- indata och format: spotpriser per kvart (lokal tid, 92–100 kvartar vid sommartid), kWh per del och månad, fakturornas spotpris, öppettider som data;
- sökrymdens gränser och stegstorlek, och hur "lika bra passning" räknas (RMS-gräns, antal kombinationer);
- hur oavgjort bryts, och vad som händer vid en omöjlig kombination (baslasten större än restposten);
- leave-one-out-förfarandet, och hur en månad som inte går att förutsäga redovisas;
- avrundning (ingen före visning) och teckenkonvention (fel = modell minus faktura);
- utdataformat för sidans tabell och diagram (månadsvärden, valda antaganden, fel per månad, band, effektkurva).

Sidan (tabell, diagram och förklaringar i samma mönster som övriga sidor) behöver ingen egen SPEC.md. Den beskrivs i det här dokumentet och bygger på skriptets utdata.

## 12. Nästa steg

**Bedömning efter genomläsning med nya ögon (2026-10-07): PRD:n är klar för att skriva SPEC.md för beräkningsskriptet.** Det som är oavgjort (fråga 2, 15, 17, 18, 19 och 21) påverkar inte skriptet, utom tre beslut som
bör tas innan SPEC.md skrivs:

- **A. Gränserna för M4b** (acceptanskriterium 1b): förslag passning högst 2 och leave-one-out högst 4 öre/kWh. Fastställs av Kent innan körning.
- **B. Sökrymden för M4b:** godkänn intervallen (bastun öppnar 06.00 eller 07.30, uppvärmning 0–6 timmar före öppning, restaurangens förberedelse 0–2 timmar, baslast 0–20 kW, varmvatten dygnet runt eller enligt tider)
  och att el-värmen och den antagna luft-värmepumpen ingår i baslasten utan egen modellering.
- **C. Fråga 21:** ska effektkurvan visas på sidan? Förslag: ja, märkt som uppskattning med bandet synligt.

**Sidan väntar** på fråga 15 (hur Eneas pris förs in) och fråga 14 (länkning), och på fråga 18 om tiderna ska gälla olika per månad. De hindrar inte skriptet.

Ordning:

1. Kent beslutar A–C (eller godkänner förslagen).
2. SPEC.md för beräkningsskriptet skrivs (`Spotpris/SPEC.md`), därefter en fräscha-ögon-genomläsning av den.
3. Datalager och skript byggs, och kontrolleras mot förstudiernas värden (acceptanskriterium 2, 3 och 4).
4. Sidan byggs.
5. Tvåstegsgranskning, därefter README för `Spotpris/` (Live Page-länk överst, lokal sökväg) och länkar från `index.html`.

**Pågår parallellt, utan att blockera:** Kent undersöker om och hur förbrukning per kvart eller timme kan fås ut (fråga 2), och besvarar resten av fråga 17–19. Beslut om Nord Pool eller ENTSO-E ska vara facit för stickprov
av spotpriserna (fråga 5) behövs före granskningen.

---

## Källförteckning

Alfabetisk ordning. Externa länkar kontrollerades 2026-10-07.

Bjerreds Saltsjöbad (2026) *Kvalitetsgranskning av siffror och beräkningar* [webbsida]. Tillgänglig:
[kvalitetsgranskning.html](../Eneas_Samkop_av_El/kvalitetsgranskning.html) (lokal fil i projektet).
*(Redovisar den tvåstegsgranskning som avsnitt 11 hänvisar till, och granskningens resultat för fakturornas data och antaganden.)*

Bjerreds Saltsjöbad (u.å.a) *Badet* [webbsida]. Tillgänglig: [https://bjerredskallbadhus.se/badet/](https://bjerredskallbadhus.se/badet/) (hämtad 2026-10-07).
*(Öppettider för badet (07.30–22.00 alla dagar), sista inpassering, bastuns stängning och att badavdelningarna städas före 07.30. Beskriver nuläget, inte nödvändigtvis januari–juni 2026.)*

Bjerreds Saltsjöbad (u.å.b) *Restaurangen* [webbsida]. Tillgänglig: [https://bjerredskallbadhus.se/restaurangen-ny/](https://bjerredskallbadhus.se/restaurangen-ny/) (hämtad 2026-10-07).
*(Restaurangens öppettider: måndag–tisdag stängt, onsdag–fredag 16–22, lördag 11–22, söndag 11–17. Beskriver nuläget, inte nödvändigtvis januari–juni 2026.)*

Elprisetjustnu.se (u.å.) *Elpris-API*. Tillgänglig: [https://www.elprisetjustnu.se/elpris-api](https://www.elprisetjustnu.se/elpris-api) (hämtad 2026-10-07).
*(Arbetskälla för spotpriser per kvart och timme i SE4. Anger att priserna är utan moms, tillägg och skatter, att historik finns från 1 november 2022 och att källan ska anges vid offentlig visning.)*

Eneas (2026) *Samköp av el* [broschyr, PDF]. Eneas. Tillgänglig: [Eneas Samkop av El 2026.pdf](../Eneas_Samkop_av_El/Eneas%20Samkop%20av%20El%202026.pdf) (lokal fil i projektet).
*(Beskriver Eneas som oberoende aktör som prissäkrar. Ingår för att prissäkrade priser inte följer månadens spotpris, avsnitt 5 fråga 10.)*

ENTSO-E (u.å.) *ENTSO-E Transparency Platform*. Tillgänglig: [https://transparency.entsoe.eu/](https://transparency.entsoe.eu/) (hämtad 2026-10-07).
*(Möjlig primärkälla för spotpriser. Åtkomst och villkor är inte undersökta här.)*

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor, PDF]. Kraftringen Nät AB och Kraftringen Energi AB. Lokalt i projektet:
[`../Kraftringen/Fakturor/`](../Kraftringen/Fakturor/).
*(Källa för spotpris, rörliga kostnader och fast påslag per månad, och för elområde SE4 och avtalsformen "Rörligt kvartspris med bindningstid".)*

Nord Pool (u.å.) *Nord Pool Data Portal*. Tillgänglig: [https://data.nordpoolgroup.com/](https://data.nordpoolgroup.com/) (hämtad 2026-10-07).
*(Möjlig primärkälla för spotpriser. Åtkomst och villkor är inte undersökta här.)*

Open-Meteo (u.å.) *Historical Weather API*. Tillgänglig: [https://open-meteo.com/en/docs/historical-weather-api](https://open-meteo.com/en/docs/historical-weather-api) (hämtad 2026-10-07).
*(Timdata för utetemperatur från reanalys (ERA5 m.fl.), alltså modellerad data. Användes i förstudie 4. Villkor för användning och källhänvisning är inte verifierade.)*

Varberg Energi (2025) *Vilka effekter har kvartspriser fått på elmarknaden?*, 10 december. Tillgänglig:
[https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden](https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden) (hämtad 2026-10-07).
*(Bekräftar att dagen före-marknaden gick från timpriser till kvartspriser den 1 oktober 2025.)*
