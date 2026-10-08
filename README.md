# Elenergiförbrukning - Bjerreds Saltsjöbad

Ett interaktivt webbaserat analysverktyg för att visualisera och analysera elenergiförbrukning för Bjerreds Saltsjöbad (kallbadhus och bastu i Bjärred).

## Live-versioner

| Sida | Länk |
|------|------|
| Huvudsida – Bjerreds Saltsjöbad | [kentlundgren.github.io/foreningar/BjerredsSaltsjobad/](https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/) |
| Elöversikt (index) | [kentlundgren.github.io/Bjerred-el/](https://kentlundgren.github.io/Bjerred-el/) |
| Elanalys: Före & efter ombyggnad | [kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) |
| Elprognoser: träffar de rätt? | [kentlundgren.github.io/Bjerred-el/prognoser.html](https://kentlundgren.github.io/Bjerred-el/prognoser.html) |
| Bastuaggregatet och bastustenarna | [kentlundgren.github.io/Bjerred-el/bastuaggregat.html](https://kentlundgren.github.io/Bjerred-el/bastuaggregat.html) |
| Spotpris månad för månad | [kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html](https://kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html) |
| Elkostnad: Kraftringen och Eneas | [kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/enea_jamforelse.html](https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/enea_jamforelse.html) |
| GitHub-repository | [github.com/kentlundgren/Bjerred-el](https://github.com/kentlundgren/Bjerred-el) |

## Om projektet

Projektet visualiserar elenergiförbrukning för Bjerreds Saltsjöbad från augusti 2024 och framåt. Elförbrukningen domineras av ett professionellt bastusystem med **Harvia Qube 360** (36 kW). Anläggningen byggdes om under 2025: bastun var stängd från mitten av februari till mitten av juli 2025, och öppnade sedan med utökad kapacitet (18 → 27 platser per bastu).

## Funktioner

- **Interaktiva diagram** – förbrukning, kostnad och pris per kWh över tid
- **Löpande Årstal (LÅT)** – alltid de senaste 12 månadernas förbrukning och kostnad
- **Jämförelsevärden** – beräknade förmodade värden baserade på säsongsmönster
- **Fördelning bad/restaurang** – separat analys för respektive del
- **Responsiv design** – fungerar på desktop, tablet och mobil
- **Elanalys före & efter ombyggnad** – djupanalys med inpasseringsdata från Firebase
- **Prognosuppföljning** – egna månadsprognoser jämförda med faktiskt utfall
- **Spotpris och elhandlarjämförelse** – spotpris i elområde SE4 mot Kraftringens fakturor, och en jämförelse med Eneas prisförslag

## Sidor och mappar

| Sida eller mapp | Innehåll |
|-----------------|----------|
| `index.html` | Elöversikt med diagram och tabeller över månadsdata |
| `fore_och_efter_ombyggnad.html` | Jämförelse av bad-sektionen före och efter ombyggnaden 2025 |
| `prognoser.html` | Träffsäkerhet för månadsprognoserna (prognos mot utfall) |
| `bastuaggregat.html` | Vilken sten bastuaggregaten ska ha, stenkalkyl, inköpsställen och underhåll, med källförteckning |
| `Spotpris/` | Spotpris per månad för SE4 mot Kraftringens fakturor, med Python-skript, data, tester och blindprov. Se [Spotpris/README.md](Spotpris/README.md) |
| `Eneas_Samkop_av_El/` | Kraftringens fakturerade elkostnad januari–juni 2026 och vad den hade blivit med Eneas priser. Se [Eneas_Samkop_av_El/README.md](Eneas_Samkop_av_El/README.md) |
| `Kraftringen/` | Kraftringens fakturor (PDF) och underlag för intern debitering, som källmaterial till månadsdata och jämförelserna |
| `data.html` | Administrativt verktyg som genererar ny `monthlyData`-kod |

## Projektstruktur

```
Bjerred-el/
├── index.html                        # Elöversikt – alla diagram och tabeller
├── data.html                         # Administrativt verktyg för datahantering
├── data.md                           # Backup och referens: all månadsdata (kWh, kostnad) som tabell
├── fore_och_efter_ombyggnad.html     # Analyssida: före vs efter ombyggnad 2025
├── fore_och_efter_ombyggnad.css      # Styling för analyssidan
├── fore_och_efter_ombyggnad.js       # Logik, diagram och Firebase-hämtning
├── prognoser.html / .css / .js       # Prognosuppföljning (prognosData ligger i .js)
├── prognoser.md                      # Backup och referens: logg över prognoser och utfall
├── bastuaggregat.html / .css / .js   # Sida om bastuaggregatet och bastustenarna
├── Spotpris/                         # Spotpris månad för månad (sida, skript, data, tester)
├── Eneas_Samkop_av_El/               # Jämförelse Kraftringen och Eneas (sidor, PRD, kvalitetsgranskning)
├── Kraftringen/                      # Fakturor och underlag för intern debitering
├── images/                           # Bilder (t.ex. delningsbild)
├── .cursor/                          # Regler och skills för AI-assistenten (månadsdata, prognoser)
├── .gitignore                        # Git-konfiguration
├── CLAUDE.md                         # Instruktioner för AI-assistenter
└── README.md                         # Denna fil
```

## Dataperiod

**Nuvarande data:** Augusti 2024 – September 2026 (26 månader).

Kostnaden för en månad läggs in när elfakturan kommit, vanligen kring den 10:e i månaden efter. Fram till dess visas månadens förbrukning (kWh) men kostnaden är tom. Se [data.md](data.md) för den aktuella tabellen.

**Inpasseringsdata:** Hämtas live från Firebase (`skylt-e0c45-default-rtdb.europe-west1.firebasedatabase.app`), med BASE_DATA som fallback.

## Analyssida – Före & efter ombyggnad 2025

Sidan [fore_och_efter_ombyggnad.html](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) jämför elförbrukning och kostnad för bastuns bad-sektion före ombyggnaden (aug 2024–jan 2025) med efter ombyggnaden (aug 2025–). Analyssidan innehåller:

- Diagram: bad-kWh, kWh/badare, kr/badare, inpasseringar, beläggningsgrad
- Toggle: växla mellan "faktiska badare" (inpasseringar från Firebase) och "full kapacitet" (max 36/54)
- Beläggningsgradens formel: `(inpasseringar/2) × vistelsetid / (18 tim × dagar × max/bastu)`
- Jämförelsetabell med alla 6 jämförbara månadspar
- Extraanalyser: besöksökning, merkostnad, säsongsvariation
- Formulär för att lägga in framtida el-data (sparas i localStorage)
- Automatisk Firebase-hämtning av inpasseringsdata vid sidladdning

**Nyckelresultat:**

- Kapacitetsökning: +50 % (36 → 54 platser)
- Fler besökare: +11 % per månad i snitt
- Mer el per badare: +26 % (snitt ~2,3 → ~2,9 kWh/besök)
- Lägre beläggningsgrad: −26 % (bastun är statistiskt "tommare" trots fler besökare)
- Merkostnad för badet: ca +13 500 kr/mån i el

## Prognosuppföljning

Varje månad görs en prognos för elförbrukningen några dagar före månadsskiftet: mätaren läses av och förbrukningen skrivs fram linjärt till hela månaden. Sidan [prognoser.html](https://kentlundgren.github.io/Bjerred-el/prognoser.html) visar prognos mot utfall, avvikelse per månad samt träffsäkerhet (MAPE och bias). Loggen finns även i [prognoser.md](prognoser.md).

En preliminär prognos visas i diagram och tabell på elöversikten (markerad som preliminär) men räknas inte in i baslinjerna för förmodad förbrukning eller i LÅT-summorna. När kWh-utfallet är känt ersätts den av faktisk förbrukning.

## Tidslinje för en el-månad

1. **Några dagar före månadsskiftet** – prognos baserad på mätaravläsning.
2. **Vid månadsskiftet** – kWh-utfall från elmätaren. Kostnaden lämnas tom.
3. **Kring den 10:e månaden efter** – elfakturan kommer och kostnad och pris per kWh fylls i.

## Spotpris och elhandlarjämförelse

- **[Spotpris/](Spotpris/README.md)** – ett månadsvärde för spotpriset i elområde SE4 enligt fem metoder (enkelt medel, medel 06–22, förbrukningsviktat m.fl.), jämfört med spotpriset, de rörliga kostnaderna och det fasta påslaget på Kraftringens fakturor. Förbrukning per kvart saknas, så förbrukningsprofilen uppskattas baklänges ur fakturorna. Modellen har prövats med blindprov på juli–augusti 2026. Skripten är skrivna i Python, och sidan är ren HTML/CSS/JS som fungerar direkt från fil.
- **[Eneas_Samkop_av_El/](Eneas_Samkop_av_El/README.md)** – en jämförelse av vad badet betalade till Kraftringen januari–juni 2026 och vad det hade blivit med Eneas priser (tjänsten Samköp av el). Kraftringens belopp är kontrollräknade mot fakturorna i en tvåstegsgranskning, och redovisningen finns på en egen sida.

## Om bastusystemet

- **Bastuaggregat:** Harvia Qube 360 (36 kW)
- **Styrenhet:** Harvia Pro C2
- **Kapacitet före ombyggnad:** 18 badare/bastu × 2 bastuer = 36 totalt
- **Kapacitet efter ombyggnad:** 27 badare/bastu × 2 bastuer = 54 totalt
- **Stenar:** 100 kg kantig olivindiabas, 10–15 cm, per aggregat (200 kg totalt). Se [bastuaggregat.html](https://kentlundgren.github.io/Bjerred-el/bastuaggregat.html) för stenkalkyl, inköpsställen och källor.

Mer info: [kentlundgren.se/program/Bjerred/Harvia/](https://kentlundgren.se/program/Bjerred/Harvia/)

## Teknologi

- **HTML5 / CSS3 / JavaScript (ES6+)** – inga ramverk och ingen byggprocess, filerna öppnas direkt i webbläsaren
- **Chart.js** – interaktiva diagram
- **Firebase Realtime Database** – live inpasseringsdata
- **Python** – skript för spotprisberäkningar och granskning (mapparna `Spotpris/` och `Eneas_Samkop_av_El/`)

## Löpande Årstal (LÅT)

Systemet använder LÅT för att alltid visa de senaste 12 månadernas förbrukning och kostnad. När en ny månad läggs till rullar perioden automatiskt framåt. Kostnads-LÅT och genomsnittspris räknar bara med månader där fakturan har kommit.

## Uppdatera månadsdata

1. Öppna `data.html` i webbläsare
2. Lägg till eller ändra månadsdata
3. Generera ny JavaScript-kod
4. Uppdatera `monthlyData`-arrayen i `index.html`
5. Uppdatera även `data.md` och `fore_och_efter_ombyggnad.js` (`BASE_DATA`/`foreData`/`efterData`) vid behov
6. Kontrollräkna: `bad + restaurang = totalKWh`, `kwhPerDay = totalKWh / dagar`, `costPerKwh = cost / totalKWh`
7. Commit och push till GitHub

## Uppdateringshistorik

- **2026-10-07** – Spotpris månad för månad (`Spotpris/`) med Python-skript, tester, blindprov för juli–september och känslighetsvarianter. Fakturor för juli och augusti 2026 inlagda
- **2026-10-06** – Jämförelsen Kraftringen och Eneas (`Eneas_Samkop_av_El/`) med kvalitetsgranskning. Kraftringens fakturor och underlag för intern debitering januari–juni 2026 inlagda
- **2026-10-04** – September 2026 inlagd (bad: 11 388 kWh, restaurang: 10 301 kWh). Kostnad inväntar fakturan. `data.html` fick automatisk månadshantering
- **2026-09-28** – Sidan `bastuaggregat.html` om aggregatet och bastustenarna skapad
- **2026-08-29** – Prognosuppföljning (`prognoser.html`) skapad. Preliminära prognoser markeras i diagram och tabell
- **2026-06-03** – Analyssida `fore_och_efter_ombyggnad.html` skapad med diagram, beläggningsgrad, Firebase-integration och extraanalyser
- **2026-06-02** – Maj 2026-data inlagd (bad: 11 511 kWh, restaurang: 12 430 kWh)
- **2026-01** – Skapat administrativt verktyg för datahantering (`data.html`)
- **2026-01** – Initial version med data från augusti 2024 till september 2025

## Författare

**Kent Lundgren** – [kentlundgren.se](https://kentlundgren.se) · [@kentlundgren](https://github.com/kentlundgren)

---

[Elöversikt](https://kentlundgren.github.io/Bjerred-el/) | [Före & efter ombyggnad](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) | [Elprognoser](https://kentlundgren.github.io/Bjerred-el/prognoser.html) | [Bastuaggregatet](https://kentlundgren.github.io/Bjerred-el/bastuaggregat.html) | [Spotpris](https://kentlundgren.github.io/Bjerred-el/Spotpris/spotpris.html) | [Bjerreds Saltsjöbad](https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/)
