# CLAUDE.md – Instruktioner för AI-assistenter

Den här filen ger kontext och riktlinjer för AI-assistenter som arbetar med projektet
"Elenergiförbrukning – Bjerreds Saltsjöbad".

## Vad projektet är

Ett HTML/CSS/JavaScript-projekt (inga ramverk, ingen byggprocess) som visualiserar
elförbrukning och badstatistik för Bjerreds Saltsjöbad (kallbadhus och bastu i Bjärred).
Alla filer är fristående – öppnas direkt i webbläsaren.

## Viktiga filer

| Fil | Innehåll |
|-----|----------|
| `index.html` | Allt-i-en: CSS + JS + data inline. Elöversikt med diagram och tabeller. |
| `data.html` | Administrativt verktyg för att generera ny `monthlyData`-kod. |
| `data.md` | **Backup och referens** – Markdown-tabell med all månadsdata (kWh, kostnad). Ska alltid hållas aktuell. |
| `fore_och_efter_ombyggnad.html` | Analyssida: före vs efter ombyggnad 2025. |
| `fore_och_efter_ombyggnad.css` | Styling för analyssidan. |
| `fore_och_efter_ombyggnad.js` | All logik för analyssidan. |
| `prognoser.html` | Sida: träffsäkerhet för Kents egna elprognoser (prognos vs utfall). |
| `prognoser.css` | Styling för prognossidan. |
| `prognoser.js` | Logik + inline `prognosData` för prognossidan. |
| `prognoser.md` | **Backup och referens** – logg över prognoser, utfall och avvikelser. |

## Prognosuppföljning

Kent gör en egen prognos för varje månads elförbrukning några dagar före
månadsskiftet (läser av mätaren, skriver fram till hela månaden). Prognoser och
deras träffsäkerhet hanteras separat från den faktiska månadsdatan:

- Prognoser loggas i `prognoser.md` + `prognosData` i `prognoser.js`.
- En preliminär prognos läggs in i `monthlyData` (`index.html`) med
  `cost: null, costPerKwh: null, preliminär: true` (beslut 2026-08-29, ändrat
  samma dag från "läggs inte in alls"). Flaggan `preliminär: true` gör att raden:
  - hålls utanför baslinjerna i "förmodad förbrukning"-modellen
    (`calculateExpectedValues`)
  - hålls utanför LÅT-summorna (`updateSummary` / `latWindow`)
  - markeras i diagrammen (lila punkt, streckad linje) och i tabellen ("(preliminär)",
    "–" i kostnadskolumnerna)
- `data.md` har en egen sektion "Preliminära prognoser (ännu utan facit)".
- Facit sker i **två steg** (se tidslinjen nedan): först kWh, sedan kostnad.
  Vid kWh-facit räknas avvikelsen ut, `preliminär`-flaggan tas bort, och månaden
  förs in via den vanliga fyrfilsproceduren med `cost: null` tills fakturan kommit.

Hela flödet – registrera prognos och stämma av mot facit – sköts av skillen
**`bjerred-elprognos`** (`.cursor/skills/bjerred-elprognos/SKILL.md`), som triggas
av t.ex. "lägg in prognos för september" eller "facit för augusti".

## Tidslinje för en el-månad

Så här kommer uppgifterna i praktiken, och så ska de läggas in:

1. **Några dagar före månadsskiftet** – Kent gör en prognos (mätaravläsning +
   linjär framskrivning). Läggs in med `preliminär: true`.
2. **Vid månadsskiftet / de första dagarna i nästa månad** – kWh-facit från
   elmätaren. Byter ut den preliminära raden mot faktisk förbrukning. Kostnad
   lämnas `null`.
3. **Kring den 10:e i månaden efter** – elfakturan kommer (t.ex. augusti-fakturan
   runt **10 september**). Då fylls `cost` och `costPerKwh` i.

**Viktigt:** tills fakturan finns ska `cost` vara `null`, inte `0`. kWh-LÅT
inkluderar månaden så fort förbrukningen är fastställd; kostnads-LÅT och
genomsnittspriset väntar tills `cost != null` (så att årskostnaden inte blir 0 kr
för den månaden).

## Månadsdata – format

Huvuddatan finns i `monthlyData`-arrayen i `index.html` (~rad 965):

```javascript
{ month: "Maj 2026", fullMonth: "Maj 2026", totalKWh: 23941,
  daysInMonth: 31, kwhPerDay: 772, type: "Restaurang och bad",
  bad: 11511, restaurant: 12430, cost: 56338, costPerKwh: 2.35 }
```

- `bad + restaurant` ska alltid summera till `totalKWh`
- `kwhPerDay` = `totalKWh / daysInMonth` (avrundat)
- `costPerKwh` = `cost / totalKWh` (avrundat till 2 decimaler)
- `type`: `"Restaurang och bad"` | `"Bara restaurang"` | `"Badet stängde i februari"` | `"Badet öppnade igen i mitten av juli"`

## Analyssidan – nyckelkonstanter

```javascript
KAPACITET_FORE  = 36   // 18 badare/bastu × 2 bastuer (gammal)
KAPACITET_EFTER = 54   // 27 badare/bastu × 2 bastuer (ny, efter ombyggnad 2025)
TIMMAR_PER_DAG  = 14   // 16 öppettimmar (öppen 06–22) − 2 städtimmar
```

## Analyssidan – inpasseringsdata

Hämtas live från Firebase REST API (ingen autentisering krävs):
```
GET https://skylt-e0c45-default-rtdb.europe-west1.firebasedatabase.app/bjerred-inpasseringar/data.json
```

Fallback BASE_DATA finns inbakad i `fore_och_efter_ombyggnad.js`.
Firebase-strukturen är nästlad och inkonsekvent mellan år – se `parseFirebaseData()`.

Källdata för inpasseringar: https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/inpasseringar/

## Analyssidan – jämförbara månadspar

Dessa 6 par kan jämföras direkt (samma kalendermånad, ett år isär):

| Månad | Före | Efter |
|-------|------|-------|
| Aug | Aug 2024 | Aug 2025 |
| Sep | Sep 2024 | Sep 2025 |
| Okt | Okt 2024 | Okt 2025 |
| Nov | Nov 2024 | Nov 2025 |
| Dec | Dec 2024 | Dec 2025 |
| Jan | Jan 2025 | Jan 2026 |

Feb–Maj 2026 saknar "före"-par (badet var stängt feb–jul 2025).

## Beläggningsgrad – formel

```
herrar_per_timme = (inpasseringar / 2) / (TIMMAR_PER_DAG × dagar)
beläggningsgrad  = herrar_per_timme × vistelsetid / (maxKap / 2) × 100
```

Beläggningsgraden är proportionell mot antagen vistelsetid (default 1 timme).

## Uppdatera månadsdata

Varje gång ny månadsdata läggs till ska **alla fyra** filerna uppdateras
(`data.md`, `index.html`, `fore_och_efter_ombyggnad.js`, `data.html`) och värdena
kontrollräknas.

Den fullständiga steg-för-steg-proceduren – inklusive avläsning av skärmdump,
kontrollformler, exakta filpositioner och kommentarsmönster – finns i skillen
**`bjerred-manadsdata`** (`.cursor/skills/bjerred-manadsdata/SKILL.md`). Den triggas
automatiskt när du säger t.ex. "lägg in data för [månad]".

`data.md` är den lättlästa backup-referensen och ska alltid spegla det aktuella dataläget.

## Användarregler att följa

- Dela alltid upp kod i separata HTML/CSS/JS-filer (gäller nya sidor – index.html är legacy)
- Gul bakgrund (`#FFF9C4`) på alla inmatningsfält
- Kommentera tydligt – särskilt vid uppdateringar: `// UPPDATERING ÅÅÅÅ-MM-DD: ...`
- Fråga alltid om befintlig fil ska uppdateras eller om ny fil (`_verX`) ska skapas
- PowerShell används – undvik `&&` i terminalen, dela upp kommandon
- Ingen ES2023+ utan att kommentera det i koden

## Externa länkar

- Huvudsida: https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/
- Elöversikt live: https://kentlundgren.github.io/Bjerred-el/
- Analyssida live: https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html
- Inpasseringar: https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/inpasseringar/
- GitHub-repo: https://github.com/kentlundgren/Bjerred-el
