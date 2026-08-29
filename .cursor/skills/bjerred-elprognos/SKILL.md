---
name: bjerred-elprognos
description: Registrera Kents elförbruknings­prognoser för Bjerreds Saltsjöbad och stäm av dem mot faktiskt utfall. Använd när Kent säger "lägg in prognos för [månad]", "prognos för [månad]", "preliminära värden för [månad]", "stäm av prognosen för [månad]", "facit för [månad]", "träffar mina prognoser rätt", eller när han bifogar en skärmdump från data.html och kallar värdena prognos / preliminära / uppskattade. Uppdaterar prognoser.md och prognoser.js, och vid facit även de fyra ordinarie datafilerna via skillen bjerred-manadsdata.
---

# Bjerreds Saltsjöbad – Elprognoser och träffsäkerhet

Kent gör en egen prognos för varje månads elförbrukning några dagar före
månadsskiftet: han läser av elmätaren och skriver fram siffran till hela månaden.
Den här skillen håller reda på prognoserna och hur väl de träffar det faktiska
utfallet.

Projektfakta (dataformat, konstanter, länkar) finns i `CLAUDE.md`.
Den ordinarie månadsdata-proceduren finns i skillen `bjerred-manadsdata` – den
här skillen **ersätter den inte**, den kompletterar den med ett prognos-steg före
och en avstämning efter.

## Två lägen

| Läge | Utlöses av | Vad som händer |
|------|-----------|----------------|
| **1. Registrera prognos** | "lägg in prognos för sept", skärmdump kallad prognos/preliminär | Prognosen loggas i `prognoser.md` + `prognoser.js`. De fyra ordinarie datafilerna rörs **inte**. |
| **2. Facit-avstämning** | "facit för augusti", "stäm av prognosen", slutlig mätarställning + faktura finns | Avvikelsen räknas ut, prognosraden flyttas till *Avräknade*, träffsäkerheten uppdateras, och månaden läggs in som **faktisk** data via `bjerred-manadsdata`. |

---

## LÄGE 1 – Registrera prognos

### Indata Kent lämnar
- En **skärmdump från `data.html`** (samma fältordning som i `bjerred-manadsdata`:
  månad, år, fullMonth, totalKWh, daysInMonth, kwhPerDay, type, bad, restaurant,
  cost, costPerKwh) **eller** siffrorna i text.
- **Prognosdatum** – vilket datum mätaren lästes av (t.ex. "28 aug, tre dagar före
  månadsskiftet"). Fråga om det inte framgår.
- **Underlag** – hur helmånadssiffran togs fram. Vanligast: *linjär framskrivning*
  (mätarställning hittills delat på antal dygn, uppräknat till hela månaden).
  Fråga om det är oklart; skriv in det ordagrant i loggen.

### Kontrollräkning – gör ALLTID före du skriver
- `prognos.bad + prognos.restaurang = prognos.totalt` (exakt)
- `kwhPerDay ≈ prognos.totalt / daysInMonth` (avrundat till heltal)
- Om bild och text säger olika (det hände i augusti 2026: bild 10 769, text 10 768):
  **fråga Kent**, och välj den siffra som får summan att stämma tills han svarat.
- **Kostnad:** oftast okänd vid prognostillfället. Sätt `kostnad: null` och notera
  att den inte prognostiserades. Prognostisera bara kostnad om Kent uttryckligen
  ger ett värde.

### Filer att uppdatera (bara dessa två)

**1. `prognoser.md` – tabellen "Öppna prognoser"**
- Lägg till en rad: `| [Månad] [År] | [prognosdatum] | [underlag] | [bad] | [rest.] | [totalt] | [kWh/dag] | [kostnad el. "–"] |`
- Format som i `data.md`: mellanslag som tusentalsavgränsare (`10 768`).
- Uppdatera `Senast uppdaterad: **ÅÅÅÅ-MM-DD**` i huvudet.
- Lägg vid behov en rad under `## Noteringar`.

**2. `prognoser.js` – `prognosData`-arrayen (~rad 30)**
- Lägg till ett objekt sist. **Kommatecken** efter föregående sista objekt.
- Kommentar ovanför: `// PROGNOS ÅÅÅÅ-MM-DD: [Månad] [År]. [ev. avvikelse bild/text]. [ev. kostnad ej prognostiserad].`
- Struktur:
  ```javascript
  {
      manad: 'Sep', ar: 2026, fullMonth: 'September 2026',
      prognosDatum: '2026-09-27',
      underlag: 'Linjär framskrivning (avläst t.o.m. 27 sep, uppräknat till 30 dygn)',
      dagar: 30,
      prognos: { bad: 0, restaurang: 0, totalt: 0, kostnad: null },
      utfall:  { bad: null, restaurang: null, totalt: null, kostnad: null }
  }
  ```

**3. `data.md` – sektionen "Preliminära prognoser (ännu utan facit)"**
- Lägg till en rad i den tabellen (inte i huvudtabellen "Månadsdata" – den är
  bara faktisk data). Uppdatera `Senast uppdaterad`.

### Rör INTE i läge 1
`index.html` (`monthlyData`), `fore_och_efter_ombyggnad.js` (`efterData`),
`data.html` (`originalData`). Beslut 2026-08-29: preliminära siffror ska inte in i
"förmodad förbrukning"-modellen eller LÅT-summorna på elöversikten.

### Efter läge 1
1. Verifiera `prognoser.html` i webbläsaren (lokal server – filsökvägen har å/ä så
   `file://` renderas som statisk snapshot utan JS; kör `python -m http.server` i
   projektmappen istället).
2. Kontrollera i konsolen att inga fel kastas.
3. Sammanfatta för Kent: prognosen som lagts in, kontrollräkningen, och att
   elöversikten är orörd tills facit finns.
4. Fråga om Kent vill att du committar/pushar – gör det aldrig utan att bli ombedd.

---

## LÄGE 2 – Facit-avstämning

Utlöses när Kent har den slutliga mätarställningen och (oftast) elfakturan för en
månad som har en öppen prognos.

### Steg

**1. Räkna avvikelsen** (positivt = prognosen låg för högt):
```
avvikelse_kWh      = prognos.totalt − utfall.totalt
avvikelse_%        = (prognos.totalt − utfall.totalt) / utfall.totalt × 100
avvikelse_bad_%    = (prognos.bad − utfall.bad) / utfall.bad × 100
avvikelse_rest_%   = (prognos.restaurang − utfall.restaurang) / utfall.restaurang × 100
```
En månad räknas som "träff" om `|avvikelse_%| ≤ 3` (samma gräns som
`TRAFF_GRANS_PROCENT` i `prognoser.js`).

**2. Uppdatera `prognoser.js`:** fyll `utfall`-objektet för månaden med de faktiska
värdena. Kommentar: `// FACIT ÅÅÅÅ-MM-DD: [Månad] utfall [totalt] kWh, avvikelse [±X.X] %`.

**3. Uppdatera `prognoser.md`:**
- Flytta raden från *Öppna prognoser* till *Avräknade prognoser* (annat kolumnformat
  – se tabellhuvudet där).
- Räkna om **Träffsäkerhet hittills**:
  - `Antal avräknade prognoser` = antal rader i *Avräknade*
  - `MAPE` = medelvärdet av `|avvikelse_%|` över alla avräknade
  - `Bias` = medelvärdet av `avvikelse_%` med tecken (negativ = underskattar systematiskt)
  - `Största missen` = raden med störst `|avvikelse_%|`
- Uppdatera `Senast uppdaterad`.

**4. Uppdatera `data.md`:** ta bort månadens rad ur "Preliminära prognoser"-sektionen
(den blir nu en vanlig rad i huvudtabellen via nästa steg).

**5. Lägg in månaden som faktisk data** – följ skillen `bjerred-manadsdata` punkt
för punkt: `data.md` (huvudtabellen), `index.html` (`monthlyData`),
`fore_och_efter_ombyggnad.js` (ersätt `null`-platshållaren), `data.html`
(`originalData`). Kontrollräkna enligt den skillen.

**6. Rapportera till Kent:**
- Prognos vs utfall för månaden (totalt, bad, restaurang, ev. kostnad)
- Avvikelse i kWh och %
- Om mönstret hittills lutar åt över- eller underskattning (bias), och om
  träffsäkerheten (MAPE) förbättras eller försämras över tid

### Efter läge 2
1. Verifiera både `prognoser.html` och `index.html` i webbläsaren.
2. Sammanfatta alla ändrade filer (2 prognos-filer + 4 ordinarie).
3. Fråga om commit/push.

---

## Filpositioner (snabböversikt)

| Fil | Vad | Ungefärlig rad |
|-----|-----|----------------|
| `prognoser.js` | `prognosData`-arrayen | ~30 |
| `prognoser.js` | `TRAFF_GRANS_PROCENT` | ~45 |
| `prognoser.md` | "Öppna prognoser" / "Avräknade prognoser" / "Träffsäkerhet hittills" | – |
| `data.md` | "Preliminära prognoser (ännu utan facit)" | efter huvudtabellen |
| `index.html` | nav-länk "🎯 Träffar prognoserna?" | ~654 |

## Kommentarsmönster
- `// PROGNOS ÅÅÅÅ-MM-DD: ...` när en prognos registreras
- `// FACIT ÅÅÅÅ-MM-DD: ...` när den stäms av
- `// UPPDATERING ÅÅÅÅ-MM-DD: ...` för övriga ändringar (samma som resten av projektet)

## Bakgrund
Skapad 2026-08-29 på Kents begäran ("en förmåga som hjälper mig se om mina prognoser
träffar rätt"). Första prognosen: augusti 2026 (bad 10 768, restaurang 11 027,
totalt 21 795 kWh, avläst 28 aug, linjär framskrivning, kostnad ej prognostiserad).
