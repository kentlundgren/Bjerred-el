# Elprognoser – Bjerreds Saltsjöbad

Denna fil är **backup och referens** för Kents egna prognoser av elförbrukningen,
och för hur väl de träffar det faktiska utfallet.

Prognosen görs några dagar före månadsskiftet: mätarställningen läses av och skrivs
fram till hela månaden. När den slutliga mätarställningen och fakturan kommit
(ca mitten av påföljande månad) stäms prognosen av mot facit.

Den lättlästa webbversionen finns i `prognoser.html`
(live: https://kentlundgren.github.io/Bjerred-el/prognoser.html).

Senast uppdaterad: **2026-08-29**

- **Avvikelse (kWh)** = prognos − utfall. Positivt tal = prognosen låg **för högt**.
- **Avvikelse (%)** = (prognos − utfall) / utfall × 100
- **MAPE** = medelvärdet av |avvikelse %| över alla avräknade prognoser (träffsäkerhet)
- **Bias** = medelvärdet av avvikelse % med tecken. Negativ bias = systematisk underskattning.

---

## Öppna prognoser (ännu utan facit)

| Månad | Prognosdatum | Underlag | Prognos bad kWh | Prognos rest. kWh | Prognos totalt kWh | kWh/dag | Prognos kostnad |
|-------|--------------|----------|----------------:|------------------:|-------------------:|--------:|----------------:|
| Augusti 2026 | 2026-08-28 | Linjär framskrivning (mätarställning t.o.m. 28 aug, uppräknat till 31 dygn) | 10 768 | 11 027 | 21 795 | 703 | – (ej prognostiserad) |

---

## Avräknade prognoser (prognos mot facit)

| Månad | Prognos totalt kWh | Utfall totalt kWh | Avvikelse kWh | Avvikelse % | Avvikelse bad % | Avvikelse rest. % | Kommentar |
|-------|-------------------:|------------------:|--------------:|------------:|----------------:|------------------:|-----------|
| _(inga avräknade prognoser ännu)_ | | | | | | | |

---

## Träffsäkerhet hittills

| Mått | Värde | Tolkning |
|------|-------|----------|
| Antal avräknade prognoser | 0 | – |
| MAPE (totalt kWh) | – | Beräknas efter första facit |
| Bias (totalt kWh) | – | – |
| Största missen | – | – |

---

## Noteringar

- **Augusti 2026:** Första registrerade prognosen. Kostnaden var inte känd vid
  prognostillfället och lämnades utanför (elfakturan kommer ca mitten av september).
- Preliminära prognoser läggs in i `monthlyData` i `index.html` med `preliminär: true`
  (beslut 2026-08-29). Flaggan gör att raden markeras i diagram och tabell men hålls
  utanför "förmodad förbrukning"-modellen och LÅT-summorna (löpande årstal).
  Se skillen `bjerred-elprognos`.

---

## Hur en prognos läggs till / stäms av

Sköts av skillen **`bjerred-elprognos`** (`.cursor/skills/bjerred-elprognos/SKILL.md`),
som triggas när Kent säger t.ex. "lägg in prognos för september" eller "facit för augusti".

1. **Registrera prognos:** ny rad i *Öppna prognoser* ovan + nytt objekt i `prognosData`
   i `prognoser.js`. Kontrollräkna `bad + restaurang = totalt`.
2. **Facit-avstämning:** fyll i utfallet, räkna avvikelsen, flytta raden till
   *Avräknade prognoser*, uppdatera *Träffsäkerhet hittills*, och lägg in månaden som
   ordinarie data i de fyra vanliga filerna via skillen `bjerred-manadsdata`.
