# ⚡ Elenergiförbrukning - Bjerreds Saltsjöbad

Ett interaktivt webbaserat analysverktyg för att visualisera och analysera elenergiförbrukning för Bjerreds Saltsjöbad.

## 🌐 Live Demo

**👉 [Visa live-versionen här](https://kentlundgren.github.io/Bjerred-el/)**

## 📖 Om Projektet

Detta projekt visualiserar elenergiförbrukning för Bjerreds Saltsjöbad från augusti 2024 och framåt. Elförbrukningen domineras av ett professionellt bastusystem med **Harvia Qube 360** bastuaggregat på 36 kW.

### Funktioner

- 📊 **Interaktiva diagram** - Visualiserar förbrukning, kostnad och pris per kWh över tid
- 💰 **Kostnadsanalys** - Visar både priser inklusive och exklusive moms
- 📅 **Löpande Årstal (LÅT)** - Visar alltid de senaste 12 månadernas förbrukning och kostnad för aktuell årsbild
- 🔄 **Jämförelsevärden** - Beräknar förmodade värden baserat på säsongsmönster
- 🏊‍♂️ **Fördelning** - Separat analys för bad och restaurang
- 📱 **Responsiv design** - Fungerar på desktop, tablet och mobil
- 🎨 **Modern UI** - Vacker och användarvänlig design

## 🛠️ Teknologi

- **HTML5** - Strukturerar innehållet
- **CSS3** - Styling med CSS-variabler, Grid och Flexbox
- **JavaScript (ES6+)** - Interaktivitet och databearbetning
- **Chart.js** - Interaktiva diagram och visualiseringar

## 📁 Projektstruktur

```
Bjerred-el/
├── index.html              # Huvudfil med visualiseringar och diagram
├── data.html               # Administrativt verktyg för datahantering
├── data.md                 # Dataöversikt
├── .gitignore              # Git-konfiguration
├── manadsforbrukning_el.jpg                    # Referensbild
├── Pris_per_kWh_Bjerreds_Saltsjöbad.jpg       # Referensbild
└── README.md               # Denna fil
```

## 🔧 Användning

### Visa Statistik och Diagram

1. Öppna [https://kentlundgren.github.io/Bjerred-el/](https://kentlundgren.github.io/Bjerred-el/) i din webbläsare
2. Utforska de olika diagrammen och sammanfattningskorten
3. Klicka på "Visa förmodade värden" för att se jämförelser
4. Klicka på "Visa detaljerad tabell" för detaljerad månadsöversikt

### Hantera och Lägga Till Data

1. Öppna `data.html` i din webbläsare
2. Redigera befintliga månader eller lägg till nya månader
3. Klicka på "Beräkna och generera kod"
4. Kopiera den genererade JavaScript-koden
5. Klistra in koden i `index.html` (ersätt den gamla `const monthlyData = [...]`)
6. Spara och ladda om sidan

## 📊 Dataperiod

**Nuvarande data:** Augusti 2024 - December 2025 (17 månader)

**Möjligt att lägga till:** Januari 2026 - December 2026 (och framåt)

## 📅 Löpande Årstal (LÅT)

Systemet använder **Löpande Årstal (LÅT)** för att visa en aktuell årsbild:

- **Vad är LÅT?** En rullande 12-månadersperiod som alltid visar de senaste 12 månaderna
- **Varför LÅT?** Ger en mer aktuell bild av årskostnaden jämfört med totalsummor
- **Automatisk uppdatering:** När ny månad läggs till rullar perioden framåt automatiskt

**Exempel:**
- Data t.o.m. december 2025 → LÅT visar januari 2025 - december 2025
- Data t.o.m. januari 2026 → LÅT visar februari 2025 - januari 2026

Detta säkerställer att årsförbrukning och årskostnad alltid reflekterar det senaste året.

## 🔥 Om Bastusystemet

Elförbrukningen domineras av ett professionellt bastusystem:

- **Bastuaggregat:** Harvia Qube 360 (36 kW)
- **Styrenhet:** Harvia Pro C2
- **Reläboxar:** Två enheter för att hantera hög effekt

Mer information om bastusystemet finns på: [kentlundgren.se/program/Bjerred/Harvia/](https://kentlundgren.se/program/Bjerred/Harvia/)

## 📈 Säsongsmönster

Projektet tar hänsyn till säsongsvariationer:

- **Vinter (nov-feb):** ~40% högre förbrukning pga uppvärmning
- **Sommar (jun-aug):** Lägre förbrukning
- **Vår/Höst (mar-maj, sep-okt):** Mellannivå

## 🏗️ Installation och Utveckling

### Kör Lokalt

1. Klona repositoryt:
```bash
git clone https://github.com/kentlundgren/Bjerred-el.git
```

2. Navigera till katalogen:
```bash
cd Bjerred-el
```

3. Öppna `index.html` i din webbläsare

### Uppdatera Data

1. Öppna `data.html` i webbläsare
2. Lägg till eller ändra månadsdata
3. Generera ny JavaScript-kod
4. Uppdatera `index.html`
5. Commit och push till GitHub

## 🤝 Bidrag

Detta är ett privat projekt för Bjerreds Saltsjöbad. För frågor eller förslag, kontakta projektägaren.

## 📝 Licens

Privat projekt - Alla rättigheter förbehållna

## 👤 Författare

**Kent Lundgren**
- Website: [kentlundgren.se](https://kentlundgren.se)
- GitHub: [@kentlundgren](https://github.com/kentlundgren)

## 📅 Uppdateringshistorik

- **2026-01** - Skapat administrativt verktyg för datahantering (data.html)
- **2026-01** - Initial version med data från augusti 2024 till september 2025
- **2026-01** - Publicerat på GitHub Pages

---

**🔗 [Öppna Live-versionen](https://kentlundgren.github.io/Bjerred-el/)** | **📊 [Se GitHub Repository](https://github.com/kentlundgren/Bjerred-el)**
