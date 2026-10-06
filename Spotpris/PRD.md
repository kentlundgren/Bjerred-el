# PRD – Spotpris månad för månad, och jämförelse med Kraftringen och Eneas

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad
Mapp: `Spotpris/` (all utveckling sker inom denna mapp)
Status: Utkast 3, 2026-10-07 (förstudie 1–3 i avsnitt 4; beslut efter Kents svar 2026-10-07: förbrukningen uppskattas baklänges, sidan är öppen; verkliga öppettider inlagda)
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

**Min bedömning:** M3 är det riktiga svaret på "vilket spotpris betalar vi", eftersom det är så en elhandlare med kvartsavräkning
räknar. Fakturornas spotpris har fler decimaler än de två som visas (implicit pris 117,3807 i stället för 117,38 för
januari, enligt granskningen av fakturorna), vilket tyder på att beloppet räknas per kvart och inte som ett enkelt snitt. Det är
en slutsats och inte något Kraftringen har bekräftat. M1 och M2 behövs ändå, eftersom de går att räkna utan förbrukningsdata
och visar hur mycket viktningen betyder.

## 4. Förstudie: M1 och M2 mot fakturornas spotpris (2026-10-07)

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
4. **Profilen är inte entydig.** Modellen kan inte skilja uppvärmning av bastun före 06 från annan förbrukning på natten (kyl, varmvatten, golvvärme,
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

**Modellen.** Profilen räknas per kvart och veckodag (skript `forstudie/modell_veckodag.py`): bastu jämn från öppning (minus eventuell uppvärmning) till 22, restaurangen som en
**baslast** (andel av kWh jämn dygnet runt) plus en **driftdel** enligt öppettiderna per veckodag (med eventuell förberedelse före öppning), och varmvatten antingen jämnt dygnet
runt eller enligt bastuns och restaurangens tider. Fel = modellens viktade spotpris minus fakturans (öre/kWh).

| Antagande | RMS-fel | Fel jan–jun |
|-----------|--------:|-------------|
| A. Bara öppettider: bastu 06–22, varmvatten dygnet runt | 3,43 | +2,50, +1,17, +4,43, +3,43, −2,35, −5,10 |
| A. Bara öppettider: bastu 07.30–22, varmvatten dygnet runt | 3,54 | +3,65, +1,66, +3,28, +1,80, −3,62, −5,65 |
| B. Plus baslast 80 % av restaurangens kWh (bastu 07.30–22, varmvatten dygnet runt) | 1,38 | +2,39, +1,52, −0,19, +1,42, +0,88, −0,75 |
| C. Bäst av 2 652 kombinationer: bastu 07.30–22 med uppvärmning 4,5 h före öppning, baslast 80 %, restaurangens förberedelse 1 h, varmvatten enligt tider | 1,16 | −0,22, −0,05, +0,03, +2,09, +1,25, −1,45 |
| C. Leave-one-out (förutsäg utelämnad månad) | – | +2,39, −0,05, +0,03, +2,09, +1,25, −3,70 |

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
| 17 | **Vad är det som drar el dygnet runt i "restaurangens" del?** Ventilation, uppvärmning (direktverkande el, värmepump, golvvärme i vinterträdgården), belysning (inomhus, brygga, utomhus), kyl- och frysrum, kök? Hur värms bastun upp, och startar uppvärmningen före öppning (timer)? | Förstudie 3: 75–80 % av restposten ser ut att vara jämn dygnet runt, 10–18 kW. Ett par kylar förklarar inte det. Det är en hypotes, och modellen kan inte skilja uppvärmning av bastun från annan förbrukning på natten. | Kent beskriver driften. Läggs in som antaganden i M4a, och bara det som är okänt kalibreras (M4b). |
| 18 | Gällde restaurangens tider (må–ti stängt, on–fr 16–22, lö 11–22, sö 11–17) och badets 07.30–22 hela januari–juni 2026? När ändrades bastuns tid från 06–22 till 07.30–22? Fanns städavbrott före 1 maj, och när? | Tiderna i modellen kommer från hemsidorna 2026-10-07. Kent antar att de gällde jan–jun. | Kent bekräftar eller anger tider per månad. Modellen tar tider per månad. |
| 19 | ~~Är varmvattenmätaren i kWh el?~~ | **Besvarad 2026-10-07 (Kent):** den mäter kWh el, för varmvatten till duschar och restaurang. | När värms vattnet (tank, timer, effektbegränsning) är fortfarande okänt. Modellen provar dygnet runt och enligt bastuns och restaurangens tider. |

## 6. Datakällor

| Behov | Källa | Läget |
|-------|-------|-------|
| Spotpris SE4 per kvart/timme | **elprisetjustnu.se**, API: `https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE4.json` | **Kontrollerat 2026-10-07.** JSON med `SEK_per_kWh`, `EUR_per_kWh`, `EXR` (växelkurs) och `time_start`/`time_end` med lokal tidsförskjutning. 96 rader per dygn efter 2025-10-01, 24 före. Historik från 2022-11-01. Priser utan moms, tillägg och skatter. Öppet (`access-control-allow-origin: *`). Ska anges som källa vid offentlig visning. |
| Spotpris, primärkälla | **Nord Pool** (elbörsen) och **ENTSO-E Transparency Platform** | Webbplatserna svarar. Villkor, format och krav på registrering eller API-nyckel är **inte undersökta** och ska kontrolleras om vi väljer en primärkälla. |
| Kraftringens poster | Fakturorna (`Kraftringen/Fakturor/`): spotpris, rörliga kostnader, fast påslag, månadsavgift, per månad | Finns. Redan inlästa i `Eneas_Samkop_av_El/enea_jamforelse.js`. |
| Eneas pris | Isaks inmatning ("Allt elpris") på `enea_jamforelse.html` | Finns bara i Isaks webbläsare och i den ifyllda tabell han mejlar. Hur det förs in här är en öppen fråga (avsnitt 5, fråga 15). |
| Förbrukning per kvart/timme | Kraftringen Nät AB eller Kraftringen Energi AB (mätvärden) | **Okänt om och hur det går att få.** Fråga 2. |

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

**SPEC.md-checkpoint: behövs ett SPEC.md-steg härifrån?** Nej, som separat dokument. Sidan är en tabell och ett diagram i samma mönster som övriga
sidor. De tekniska gränsfallen som en agent behöver veta är redan gjorda explicita i det här dokumentet: indata och källa (avsnitt 6), tidsupplösning
och sommartid (fråga 6, krav F2), negativa priser (fråga 7) och metoderna M1–M4b (avsnitt 3 och 7). Skulle hämtnings- och beräkningsskriptet bli
mer komplext (flera källor, automatisk körning), prövas frågan igen.

## 12. Nästa steg

1. **Kent svarar på frågorna i avsnitt 5.** Fråga 1 (metod: uppskattning baklänges) och 13 (öppen sida) är besvarade 2026-10-07. Kvar i första hand: fråga 17–19 (bastuns uppvärmning och nattförbrukning, restaurangens tider, varmvattenmätaren), fråga 2 (förbrukningsdata) och fråga 15 (hur Eneas pris förs in).
2. Kent undersöker om och hur förbrukning per kvart eller timme kan fås ut, och i vilket format. Det är inte ett hinder för bygget: M4b byggs först och M3 läggs till när data finns.
2b. Kent beskriver bastuns uppvärmning och nattförbrukningen, och restaurangens exakta tider (fråga 17–19), så att M4a kan sättas utan att titta på fakturan.
3. Besluta om Nord Pool eller ENTSO-E ska användas som facit för stickprov, och kontrollera då villkor och åtkomst.
4. Bygg datalagret och skriptet, därefter sidan, och kör valideringen i avsnitt 9 punkt 1.
5. Tvåstegsgranskning, därefter README för `Spotpris/` (Live Page-länk överst, lokal sökväg) och länkar från `index.html`.

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

ENTSO-E (u.å.) *ENTSO-E Transparency Platform*. Tillgänglig: [https://transparency.entsoe.eu/](https://transparency.entsoe.eu/) (hämtad 2026-10-07).
*(Möjlig primärkälla för spotpriser. Åtkomst och villkor är inte undersökta här.)*

Elprisetjustnu.se (u.å.) *Elpris-API*. Tillgänglig: [https://www.elprisetjustnu.se/elpris-api](https://www.elprisetjustnu.se/elpris-api) (hämtad 2026-10-07).
*(Arbetskälla för spotpriser per kvart och timme i SE4. Anger att priserna är utan moms, tillägg och skatter, att historik finns från 1 november 2022 och att källan ska anges vid offentlig visning.)*

Eneas (2026) *Samköp av el* [broschyr, PDF]. Eneas. Tillgänglig: [Eneas Samkop av El 2026.pdf](../Eneas_Samkop_av_El/Eneas%20Samkop%20av%20El%202026.pdf) (lokal fil i projektet).
*(Beskriver Eneas som oberoende aktör som prissäkrar. Ingår för att prissäkrade priser inte följer månadens spotpris, avsnitt 5 fråga 10.)*

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor, PDF]. Kraftringen Nät AB och Kraftringen Energi AB. Lokalt i projektet:
[`../Kraftringen/Fakturor/`](../Kraftringen/Fakturor/).
*(Källa för spotpris, rörliga kostnader och fast påslag per månad, och för elområde SE4 och avtalsformen "Rörligt kvartspris med bindningstid".)*

Nord Pool (u.å.) *Nord Pool Data Portal*. Tillgänglig: [https://data.nordpoolgroup.com/](https://data.nordpoolgroup.com/) (hämtad 2026-10-07).
*(Möjlig primärkälla för spotpriser. Åtkomst och villkor är inte undersökta här.)*

Varberg Energi (2025) *Vilka effekter har kvartspriser fått på elmarknaden?*, 10 december. Tillgänglig:
[https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden](https://www.varbergenergi.se/nyheter/vilka-effekter-har-kvartspriser-fatt-pa-elmarknaden) (hämtad 2026-10-07).
*(Bekräftar att dagen före-marknaden gick från timpriser till kvartspriser den 1 oktober 2025.)*
