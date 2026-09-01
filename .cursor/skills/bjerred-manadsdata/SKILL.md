---
name: bjerred-manadsdata
description: Lägg in ny månadsdata för elförbrukning i projektet "Elenergiförbrukning – Bjerreds Saltsjöbad". Uppdaterar alla fyra filer (data.md, index.html, fore_och_efter_ombyggnad.js, data.html) och kontrollräknar värdena. Använd när Kent säger "lägg in data för [månad]", "uppdatera månadsdata", "lägg till [månad] [år]", eller klistrar in/bifogar en skärmdump från data.html med nya elvärden.
---

# Bjerreds Saltsjöbad – Lägg in ny el-månadsdata

Återkommande månadsprocedur: lägg in en ny månads elförbrukning och -kostnad i
**alla fyra** filer, kontrollräkna, och kommentera ändringen.

Projektfakta (dataformat, konstanter, länkar) finns i `CLAUDE.md`. Den här skillen
beskriver *hur* själva uppdateringen görs.

**Om månaden hade en preliminär prognos:** om Kent tidigare lagt in en prognos för
månaden (finns i `prognoser.md` / `data.md`-sektionen "Preliminära prognoser") ska
den här uppdateringen ske via skillen `bjerred-elprognos` läge 2a (kWh-facit) eller
2b (kostnadsfacit), som räknar ut prognosavvikelsen, flyttar prognosraden, och sedan
anropar den här proceduren. Kolla `prognoser.md` innan du börjar.

**Tvåstegs-inläggning:** kWh och kostnad kommer sällan samma dag. kWh kan läggas in
vid månadsskiftet; elfakturan kommer kring den **10:e i månaden efter** (t.ex.
augusti ~10 september). Tills fakturan finns: `cost: null, costPerKwh: null` (inte 0)
i `index.html`. Hoppa då över kontrollen `costPerKwh = cost / totalKWh`. kWh-LÅT
inkluderar månaden; kostnads-LÅT väntar tills `cost != null`.

## Indata – vad Kent lämnar

Kent lämnar oftast antingen ett färdigt objekt eller en **skärmdump** från `data.html`.
Fälten i skärmdumpen står i denna ordning (vänster → höger):

| # | Fält | Exempel (Juni 2026) | Kommentar |
|---|------|---------------------|-----------|
| 1 | månad (dropdown) | `Jun` | kort form |
| 2 | år | `2026` | |
| 3 | fullMonth | `Juni 2026` | långt namn |
| 4 | totalKWh | `20609` | |
| 5 | daysInMonth | `30` | dagar i månaden |
| 6 | kwhPerDay | `687` | grå/beräknad ruta |
| 7 | type | `Restaurang och bad` | |
| 8 | bad | `8853` | |
| 9 | restaurant | `11756` | |
| 10 | cost | `53134` | kr |
| 11 | costPerKwh | `2,58` | i JS skrivs `2.58` (punkt) |

Om något fält är svårläst i bilden: **fråga Kent** istället för att gissa.

## Kontrollräkning – gör ALLTID före du skriver

Räkna och bekräfta för Kent innan filerna uppdateras:

- `bad + restaurant = totalKWh`  → 8853 + 11756 = 20609 ✓
- `kwhPerDay ≈ totalKWh / daysInMonth` (avrundat till heltal) → 20609/30 = 687 ✓
- `costPerKwh = cost / totalKWh` (avrundat till 2 decimaler) → 53134/20609 = 2,58 ✓
  (hoppa över om kostnaden ännu saknas – fakturan kommer kring den 10:e i månaden efter)

Om något inte stämmer: stanna och fråga Kent.

## De fyra filer som ska uppdateras

Alla fyra måste uppdateras varje gång. `data.html` har en **egen hårdkodad kopia**
av all data – den synkas inte automatiskt med `index.html`.

### 1. `data.md` (backup/referens – GitHub-läsbar)
- Lägg till en ny rad sist i månadsdata-tabellen (före `---`).
- Format: mellanslag som tusentalsavgränsare (`8 853`, `20 609`), komma i kr/kWh (`2,58`).
- Kolumnordning: `| Månad | Typ | Bad kWh | Rest. kWh | Totalt kWh | kWh/dag | Kostnad (kr) | Kr/kWh |`
- Uppdatera huvudet: `Senast uppdaterad: **ÅÅÅÅ-MM-DD**` och
  `Dataperiod: **Augusti 2024 – [Månad] [År]** (N månader)` (öka månadsantalet med 1).

### 2. `index.html` – `monthlyData`-arrayen (~rad 1025)
- Lägg till nytt objekt sist. **Lägg till kommatecken** efter föregående sista rad.
- Sätt en kommentar ovanför: `// UPPDATERING ÅÅÅÅ-MM-DD: [Månad] [År] tillagd (bad: X kWh, restaurang: Y kWh, totalt: Z kWh, kostnad: K kr, D kr/kWh)`
- `month` här har formatet `"Jun 2026"` (kort månad + år), `fullMonth` = `"Juni 2026"`.

### 3. `fore_och_efter_ombyggnad.js` – `efterData`-arrayen (~rad 70)
- Gäller bara månader **aug 2025 och framåt**.
- Det finns redan **platshållare med `null`** för framtida månader. **Ersätt** rätt
  platshållare (matcha `manad`/`ar`), skapa inte en ny post.
- Fälten här är annorlunda: `{ manad:'Jun', manIdx:5, ar:2026, badKwh:8853, totalKwh:20609, kostnad:53134, dagar:30 }`
  (`manIdx` är 0=Jan … 11=Dec).
- Kommentera: `// UPPDATERING ÅÅÅÅ-MM-DD: [Månad] [År] tillagd (badKwh X, totalKwh Z, kostnad K kr)`
- **VIKTIGT:** rubba inte ordningen på de första 6 posterna – `jamforPar` refererar till
  `efterData[0..5]` via fasta index (Aug–Jan). Lägg nya månader *efter* de befintliga.

### 4. `data.html` – `originalData`-arrayen (~rad 450)
- Lägg till nytt objekt sist. **Lägg till kommatecken** efter föregående sista rad.
- Fälten skiljer sig lite från index.html: här är `month` kort (`"Jun"`) och `year` separat:
  `{ month: "Jun", year: 2026, fullMonth: "Juni 2026", totalKWh: 20609, daysInMonth: 30, kwhPerDay: 687, type: "Restaurang och bad", bad: 8853, restaurant: 11756, cost: 53134, costPerKwh: 2.58 }`
- Kommentera med samma `// UPPDATERING ÅÅÅÅ-MM-DD: ...`-mönster.

## `type`-värden (giltiga alternativ)
- `"Restaurang och bad"` (normalt, bad öppet)
- `"Bara restaurang"` (bad stängt)
- `"Badet stängde i februari"`
- `"Badet öppnade igen i mitten av juli"`

## Efter uppdatering
1. Kör lint-kontroll på de tre kodfilerna (`index.html`, `data.html`, `fore_och_efter_ombyggnad.js`).
2. Sammanfatta för Kent vilka fyra filer som ändrats + kontrollräkningen.
3. Notera om månaden saknar jämförbart "före"-par (feb–jul 2026 saknar par eftersom badet
   var stängt feb–jul 2025).
4. Fråga om Kent vill att du committar/pushar – gör det aldrig utan att fråga.

## Jämförbara månadspar (referens)
Endast dessa 6 par jämförs direkt på analyssidan: Aug, Sep, Okt, Nov, Dec (2024 vs 2025)
och Jan (2025 vs 2026).
