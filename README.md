# Elenergiförbrukning - Bjerreds Saltsjöbad

Ett interaktivt webbaserat analysverktyg för att visualisera och analysera elenergiförbrukning för Bjerreds Saltsjöbad.

## Live-versioner

| Sida | Länk |
|------|------|
| Huvudsida – Bjerreds Saltsjöbad | [kentlundgren.github.io/foreningar/BjerredsSaltsjobad/](https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/) |
| Elöversikt (index) | [kentlundgren.github.io/Bjerred-el/](https://kentlundgren.github.io/Bjerred-el/) |
| Elanalys: Före & efter ombyggnad | [kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) |
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

## Projektstruktur

```
Bjerred-el/
├── index.html                        # Elöversikt – alla diagram och tabeller
├── data.html                         # Administrativt verktyg för datahantering
├── fore_och_efter_ombyggnad.html     # Analyssida: före vs efter ombyggnad 2025
├── fore_och_efter_ombyggnad.css      # Styling för analyssidan
├── fore_och_efter_ombyggnad.js       # Logik, diagram och Firebase-hämtning
├── data.md                           # (tom – reserverad för datadokumentation)
├── .gitignore                        # Git-konfiguration
├── CLAUDE.md                         # Instruktioner för AI-assistenter
└── README.md                         # Denna fil
```

## Dataperiod

**Nuvarande data:** Augusti 2024 – Maj 2026

**Inpasseringsdata:** Hämtas live från Firebase (`skylt-e0c45-default-rtdb.europe-west1.firebasedatabase.app`), med BASE_DATA som fallback.

## Analyssida – Före & efter ombyggnad 2025

Sidan [fore_och_efter_ombyggnad.html](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) jämför elförbrukning och kostnad för bastuns bad-sektion före ombyggnaden (aug 2024–jan 2025) med efter ombyggnaden (aug 2025–). Analyssidan innehåller:

- Diagram: bad-kWh, kWh/badare, kr/badare, inpasseringar, beläggningsgrad
- Toggle: växla mellan "faktiska badare" (inpasseringar från Firebase) och "full kapacitet" (max 36/54)
- Beläggningsgradens formel: `(inpasseringar/2) × vistelsetid / (18 tim × dagar × max/bastu)`
- Jämförelsetabell med alla 6 jämförbara månadspar
- Extraanalyser: besöksökning, merkostnad, säsongsvariation
- Formulär för att lägga in framtida el-data (sparas i localStorage)
- Automatic Firebase-hämtning av inpasseringsdata vid sidladdning

**Nyckelresultat:**
- Kapacitetsökning: +50 % (36 → 54 platser)
- Fler besökare: +11 % per månad i snitt
- Mer el per badare: +26 % (snitt ~2,3 → ~2,9 kWh/besök)
- Lägre beläggningsgrad: −26 % (bastun är statistiskt "tommare" trots fler besökare)
- Merkostnad för badet: ca +13 500 kr/mån i el

## Om bastusystemet

- **Bastuaggregat:** Harvia Qube 360 (36 kW)
- **Styrenhet:** Harvia Pro C2
- **Kapacitet före ombyggnad:** 18 badare/bastu × 2 bastuer = 36 totalt
- **Kapacitet efter ombyggnad:** 27 badare/bastu × 2 bastuer = 54 totalt

Mer info: [kentlundgren.se/program/Bjerred/Harvia/](https://kentlundgren.se/program/Bjerred/Harvia/)

## Teknologi

- **HTML5 / CSS3 / JavaScript (ES6+)**
- **Chart.js** – interaktiva diagram
- **Firebase Realtime Database** – live inpasseringsdata

## Löpande Årstal (LÅT)

Systemet använder LÅT för att alltid visa de senaste 12 månadernas förbrukning och kostnad. När en ny månad läggs till rullar perioden automatiskt framåt.

## Uppdatera månadsdata

1. Öppna `data.html` i webbläsare
2. Lägg till eller ändra månadsdata
3. Generera ny JavaScript-kod
4. Uppdatera `monthlyData`-arrayen i `index.html`
5. Uppdatera även `foreData`/`efterData` i `fore_och_efter_ombyggnad.js` vid behov
6. Commit och push till GitHub

## Uppdateringshistorik

- **2026-06-03** – Analyssida `fore_och_efter_ombyggnad.html` skapad med diagram, beläggningsgrad, Firebase-integration och extraanalyser
- **2026-06-02** – Maj 2026-data inlagd (bad: 11 511 kWh, restaurang: 12 426 kWh)
- **2026-01** – Skapat administrativt verktyg för datahantering (`data.html`)
- **2026-01** – Initial version med data från augusti 2024 till september 2025

## Författare

**Kent Lundgren** – [kentlundgren.se](https://kentlundgren.se) · [@kentlundgren](https://github.com/kentlundgren)

---

[Elöversikt](https://kentlundgren.github.io/Bjerred-el/) | [Före & efter ombyggnad](https://kentlundgren.github.io/Bjerred-el/fore_och_efter_ombyggnad.html) | [Bjerreds Saltsjöbad](https://kentlundgren.github.io/foreningar/BjerredsSaltsjobad/)
