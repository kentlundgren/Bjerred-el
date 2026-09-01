---
name: bjerred-elprognos
description: Registrera Kents elförbruknings­prognoser för Bjerreds Saltsjöbad och stäm av dem mot faktiskt utfall. Använd när Kent säger "lägg in prognos för [månad]", "prognos för [månad]", "preliminära värden för [månad]", "stäm av prognosen för [månad]", "facit för [månad]", "fakturan för [månad]", "träffar mina prognoser rätt", eller när han bifogar en skärmdump från data.html och kallar värdena prognos / preliminära / uppskattade. Uppdaterar prognoser.md och prognoser.js, och vid facit även de fyra ordinarie datafilerna via skillen bjerred-manadsdata. kWh-facit och kostnadsfacit kommer i två steg (fakturan kring den 10:e i månaden efter).
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

## Två lägen (facit i två steg)

kWh och kostnad kommer **inte samtidigt**. kWh-facit finns vid månadsskiftet;
elfakturan kommer kring den **10:e i månaden efter** (t.ex. augusti ~10 september).
Stäm av kWh så fort mätarställningen är klar – vänta inte på fakturan.

| Läge | Utlöses av | Vad som händer |
|------|-----------|----------------|
| **1. Registrera prognos** | "lägg in prognos för sept", skärmdump kallad prognos/preliminär | Prognosen loggas i `prognoser.md` + `prognoser.js` + `data.md`, och läggs in i `monthlyData` i `index.html` med `preliminär: true`. `fore_och_efter_ombyggnad.js` och `data.html` rörs **inte**. |
| **2a. kWh-facit** | "facit för augusti", "stäm av prognosen", slutlig mätarställning | Avvikelsen räknas ut, prognosraden flyttas till *Avräknade*, och månaden läggs in som **faktisk kWh** via `bjerred-manadsdata`. `cost` lämnas `null`. |
| **2b. Kostnadsfacit** | "fakturan för augusti", kostnadssiffra kring den 10:e | Fyll `cost` / `costPerKwh` i de fyra datafilerna + `utfall.kostnad` i `prognoser.js`. |

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

### Filer att uppdatera

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

**4. `index.html` – `monthlyData`-arrayen**
- Lägg till objektet sist (kommatecken efter föregående rad). Kommentar:
  `// PROGNOS ÅÅÅÅ-MM-DD: [Månad] [År] – PRELIMINÄR prognos ...`.
- Struktur: `{ month: "Sep 2026", fullMonth: "September 2026", totalKWh: 0, daysInMonth: 30, kwhPerDay: 0, type: "Restaurang och bad", bad: 0, restaurant: 0, cost: null, costPerKwh: null, preliminär: true }`
- `cost` och `costPerKwh` ska vara `null` (inte 0) – guard-koden i `index.html`
  förlitar sig på `!= null`.
- `preliminär: true` gör att raden: (a) filtreras bort ur baslinjerna i
  `calculateExpectedValues` (`&& !d.preliminär`), (b) filtreras bort ur LÅT via
  `latSource` i `updateSummary`, (c) markeras i diagram (lila punkt + streckad linje,
  via `prelimPointColor` / `prelimSegmentDash` i `createCharts`) och i tabellen
  (`(preliminär)`, `–` i kostnadskolumnerna).
- **Rör inte** guard-koden i sig – lägg bara till dataraden. Om guard-mönstret
  saknas (t.ex. efter en refaktor) – stanna och säg till Kent.

### Rör INTE i läge 1
`fore_och_efter_ombyggnad.js` (`efterData` – har egna `null`-platshållare, fylls
först vid facit) och `data.html` (`originalData`).

### Efter läge 1
1. Verifiera `prognoser.html` i webbläsaren (lokal server – filsökvägen har å/ä så
   `file://` renderas som statisk snapshot utan JS; kör `python -m http.server` i
   projektmappen istället).
2. Kontrollera i konsolen att inga fel kastas.
3. Sammanfatta för Kent: prognosen som lagts in, kontrollräkningen, och att den syns
   som preliminär på elöversikten (markerad, utanför LÅT och förmodad-modellen).
4. Fråga om Kent vill att du committar/pushar – gör det aldrig utan att bli ombedd.

---

## LÄGE 2a – kWh-facit

Utlöses när Kent har den **slutliga mätarställningen**. Elfakturan behövs **inte**
här – den kommer kring den 10:e i månaden efter (läge 2b).

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
kWh-värdena. `utfall.kostnad` lämnas `null` om fakturan inte kommit.
Kommentar: `// FACIT ÅÅÅÅ-MM-DD: [Månad] utfall [totalt] kWh, avvikelse [±X.X] %. Kostnad kommer ~10 [nästa månad].`.

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
och lägg in kWh i huvudtabellen. Kostnadskolumnen: `– (faktura ~10 [månad])`.

**5. Lägg in månaden som faktisk kWh-data** – följ skillen `bjerred-manadsdata` punkt
för punkt, med ett undantag för kostnaden:
- `data.md` (huvudtabellen)
- `index.html` (`monthlyData`) – **ersätt** den preliminära raden: **ta bort**
  `preliminär: true`. Lämna `cost`/`costPerKwh` som `null` om fakturan inte kommit.
  Byt `// PROGNOS`-kommentaren mot `// FACIT ÅÅÅÅ-MM-DD: ...`.
- `fore_och_efter_ombyggnad.js` (ersätt kWh-platshållaren; `kostnad` kan vara `null`)
- `data.html` (`originalData`) – `cost: null, costPerKwh: null` tills fakturan finns
Kontrollräkna enligt `bjerred-manadsdata` (`bad + restaurant = totalKWh` osv.).
Hoppa över `costPerKwh`-kontrollen när kostnad saknas.

**LÅT:** `latSource` i `index.html` filtrerar `d.cost != null`. Rör inte det filtret –
det hindrar att en månad utan faktura räknas som 0 kr i årssumman.

**6. Rapportera till Kent:**
- Prognos vs utfall för månaden (totalt, bad, restaurang)
- Avvikelse i kWh och %
- Att kostnaden väntas kring den 10:e i månaden efter
- Om mönstret hittills lutar åt över- eller underskattning (bias), och om
  träffsäkerheten (MAPE) förbättras eller försämras över tid

### Efter läge 2a
1. Verifiera både `prognoser.html` och `index.html` i webbläsaren.
2. Sammanfatta alla ändrade filer (2 prognos-filer + 4 ordinarie).
3. Fråga om commit/push.

---

## LÄGE 2b – Kostnadsfacit

Utlöses när Kent har **elfakturan** för en månad som redan har kWh-facit
(`cost` är fortfarande `null`). Kommer typiskt kring den 10:e i månaden efter.

### Steg
1. Räkna `costPerKwh = cost / totalKWh` (2 decimaler).
2. Fyll `cost` och `costPerKwh` i `index.html`, `data.html`, `data.md` och
   `kostnad` i `fore_och_efter_ombyggnad.js`.
3. Fyll `utfall.kostnad` i `prognoser.js` och notera beloppet i `prognoser.md`.
4. Kommentar: `// UPPDATERING ÅÅÅÅ-MM-DD: [Månad] kostnad tillagd (X kr, Y kr/kWh)`.
5. Verifiera att LÅT nu inkluderar månaden (filtret `d.cost != null` släpper igenom).

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
Första kWh-facit 2026-09-01: utfall 21 836 kWh (avvikelse −0,2 %). Kostnadsfacit
väntas kring 10 september – då formaliserades tvåstegs-facit (2a kWh / 2b faktura).
