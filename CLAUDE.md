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
| `fore_och_efter_ombyggnad.html` | Analyssida: före vs efter ombyggnad 2025. |
| `fore_och_efter_ombyggnad.css` | Styling för analyssidan. |
| `fore_och_efter_ombyggnad.js` | All logik för analyssidan. |

## Månadsdata – format

Huvuddatan finns i `monthlyData`-arrayen i `index.html` (~rad 965):

```javascript
{ month: "Maj 2026", fullMonth: "Maj 2026", totalKWh: 23937,
  daysInMonth: 31, kwhPerDay: 772, type: "Restaurang och bad",
  bad: 11511, restaurant: 12426, cost: 60000, costPerKwh: 2.51 }
```

- `bad + restaurant` ska alltid summera till `totalKWh`
- `kwhPerDay` = `totalKWh / daysInMonth` (avrundat)
- `costPerKwh` = `cost / totalKWh` (avrundat till 2 decimaler)
- `type`: `"Restaurang och bad"` | `"Bara restaurang"` | `"Badet stängde i februari"` | `"Badet öppnade igen i mitten av juli"`

## Analyssidan – nyckelkonstanter

```javascript
KAPACITET_FORE  = 36   // 18 badare/bastu × 2 bastuer (gammal)
KAPACITET_EFTER = 54   // 27 badare/bastu × 2 bastuer (ny, efter ombyggnad 2025)
TIMMAR_PER_DAG  = 18   // 20 öppettimmar − 2 städtimmar
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
