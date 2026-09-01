# Elprognoser – Bjerreds Saltsjöbad

Denna fil är **backup och referens** för Kents egna prognoser av elförbrukningen,
och för hur väl de träffar det faktiska utfallet.

Prognosen görs några dagar före månadsskiftet: mätarställningen läses av och skrivs
fram till hela månaden. kWh-facit kommer vid månadsskiftet; elfakturan kring den
**10:e i månaden efter** (t.ex. augusti ~10 september). Prognosavvikelsen för kWh
kan alltså stämmas av innan kostnaden är känd.

Den lättlästa webbversionen finns i `prognoser.html`
(live: https://kentlundgren.github.io/Bjerred-el/prognoser.html).

Senast uppdaterad: **2026-09-01**

- **Avvikelse (kWh)** = prognos − utfall. Positivt tal = prognosen låg **för högt**.
- **Avvikelse (%)** = (prognos.totalt − utfall.totalt) / utfall.totalt × 100
- **MAPE** = medelvärdet av |avvikelse %| över alla avräknade prognoser (träffsäkerhet)
- **Bias** = medelvärdet av avvikelse % med tecken. Negativ bias = systematisk underskattning.

---

## Öppna prognoser (ännu utan facit)

| Månad | Prognosdatum | Underlag | Prognos bad kWh | Prognos rest. kWh | Prognos totalt kWh | kWh/dag | Prognos kostnad |
|-------|--------------|----------|----------------:|------------------:|-------------------:|--------:|----------------:|
| _(inga öppna prognoser)_ | | | | | | | |

---

## Avräknade prognoser (prognos mot facit)

| Månad | Prognos totalt kWh | Utfall totalt kWh | Avvikelse kWh | Avvikelse % | Avvikelse bad % | Avvikelse rest. % | Kommentar |
|-------|-------------------:|------------------:|--------------:|------------:|----------------:|------------------:|-----------|
| Augusti 2026 | 21 795 | 21 836 | −41 | −0,2 % | +2,3 % | −2,5 % | Totalt träff. Bad för högt, restaurang för lågt (tar ut varandra). Kostnad ~10 sep. |

---

## Träffsäkerhet hittills

| Mått | Värde | Tolkning |
|------|-------|----------|
| Antal avräknade prognoser | 1 | Första facit (augusti 2026) |
| MAPE (totalt kWh) | 0,2 % | Mycket låg avvikelse totalt |
| Bias (totalt kWh) | −0,2 % | Svag underskattning – bara en månad, inget mönster än |
| Största missen | Augusti 2026 (−0,2 %) | Inom träffgränsen ±3 % |

---

## Noteringar

- **Augusti 2026:** Första registrerade prognosen (avläst 28 aug, linjär framskrivning).
  kWh-facit 2026-09-01: totalt 21 836 (bad 10 526, restaurang 11 310). Prognosen låg
  41 kWh för lågt (−0,2 %). Kostnaden var inte känd vid vare sig prognos eller
  kWh-facit; elfakturan väntas kring 10 september.
- Preliminära prognoser läggs in i `monthlyData` i `index.html` med `preliminär: true`
  (beslut 2026-08-29). Flaggan gör att raden markeras i diagram och tabell men hålls
  utanför "förmodad förbrukning"-modellen och LÅT-summorna (löpande årstal).
  Vid kWh-facit tas flaggan bort; `cost` lämnas `null` tills fakturan kommer.
  Se skillen `bjerred-elprognos`.

---

## Hur en prognos läggs till / stäms av

Sköts av skillen **`bjerred-elprognos`** (`.cursor/skills/bjerred-elprognos/SKILL.md`),
som triggas när Kent säger t.ex. "lägg in prognos för september" eller "facit för augusti".

1. **Registrera prognos:** ny rad i *Öppna prognoser* ovan + nytt objekt i `prognosData`
   i `prognoser.js`. Kontrollräkna `bad + restaurang = totalt`.
2. **kWh-facit:** fyll i utfallet, räkna avvikelsen, flytta raden till
   *Avräknade prognoser*, uppdatera *Träffsäkerhet hittills*, och lägg in månaden som
   ordinarie kWh-data i de fyra vanliga filerna via skillen `bjerred-manadsdata`.
   Kostnad kan vänta till steg 3.
3. **Kostnadsfacit:** när elfakturan kommit (kring den 10:e i månaden efter) fylls
   `cost` / `costPerKwh` i.
