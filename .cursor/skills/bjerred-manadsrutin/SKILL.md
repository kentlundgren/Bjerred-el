---
name: bjerred-manadsrutin
description: Huvudchecklista och minnesfil för allt som ska göras när en ny månads underlag kommer i projektet "Elenergiförbrukning – Bjerreds Saltsjöbad" (Kraftringens faktura, bilden på debiteringsunderlaget, kWh från mätaren). Håller reda på vad som är gjort för varje månad hittills, och pekar vidare till skillsen bjerred-elprognos och bjerred-manadsdata för prognos och elöversikten. Använd när Kent säger "ny månad", "fakturan för [månad] har kommit", "vad ska göras för [månad]", "månadsrutinen", "uppdatera Spotpris för [månad]", "intern debitering för [månad]", "lägg in [månad] överallt", eller bifogar en Kraftringen-faktura (PDF) eller en bild på ett debiteringsunderlag.
---

# Bjerreds Saltsjöbad – Månadsrutin (huvudchecklista och minnesfil)

Den här filen är **en levande minnesfil**. Den gör två saker:

1. **Rutinen:** vad som ska göras, i vilken ordning, i vilka filer, när en ny månad kommer.
2. **Loggen:** vad som redan är gjort för varje månad (avsnittet "Läge per månad"). Uppdatera
   den varje gång något läggs in, så att nästa session ser exakt var vi är.

Den **ersätter inte** de andra skillarna, den samlar dem:

| Skill | Gäller | Används i steg |
|-------|--------|----------------|
| `bjerred-elprognos` | Prognos före månadsskiftet, kWh-facit, kostnadsfacit | 0, 1 och 2b |
| `bjerred-manadsdata` | De fyra ordinarie datafilerna (`data.md`, `index.html`, `fore_och_efter_ombyggnad.js`, `data.html`) | 1 och 2b |
| `bjerred-manadsrutin` (den här) | Allt annat som hör till månaden: Spotpris, intern debitering, länkar, versioner | 2c–2e |

Projektfakta (dataformat, konstanter, länkar) finns i `CLAUDE.md`.

## Så är den här filen tänkt att användas

- **Börja alltid med att läsa "Läge per månad" nedan.** Då syns vilka steg som redan är gjorda
  för månaden Kent pratar om, och inget görs två gånger.
- **Gå igenom checklistan i ordning** och bocka av i loggen när ett steg är klart och
  verifierat (inte när det är påbörjat).
- **Nya återkommande moment läggs till här** som ett eget numrerat steg, med: vad som görs, vilka
  filer som rörs, hur det kontrolleras, och eventuella fallgropar. Kent har sagt att fler moment
  kommer. Lägg dem under rubriken "Rutin per ny månad", inte i chatten.
- **Fråga hellre än gissa** när en siffra i en bild är oläslig eller två källor säger olika.
- **Committa eller pusha aldrig utan att Kent ber om det.** Terminalen är PowerShell (inga `&&`).
- **Lokal test:** filsökvägen har å/ä, så `file://` fungerar dåligt. Kör `python -m http.server 8765`
  i projektmappen, testa på `http://localhost:8765/...`, och stoppa servern efteråt. Webbläsaren
  cachar JS-filer hårt: ladda om med `fetch(url, {cache:'reload'})` om en ändring inte syns.

## Vilka underlag som kommer

| Underlag | Kommer | Läggs i | Filnamn |
|----------|--------|---------|---------|
| Mätaravläsning (kWh, bad och restaurang) | Månadsskiftet | Chatten eller skärmdump från `data.html` | – |
| **Kraftringens faktura** (PDF) | Kring den 8–10:e månaden efter | `Kraftringen/Fakturor/` | `ÅÅÅÅMM_Kraftringen_<Månad>_<år>_<OCR>.pdf` |
| **Debiteringsunderlag** (bild från Kents Excel) | När Kent har räknat klart | `Kraftringen/Intern_debitering/` | `ÅÅÅÅMM_Intern_debitering.jpg` |

Fakturan och bilden ger tillsammans nästan allt. Ta aldrig siffror ur minnet; läs dem ur filerna.

---

## Rutin per ny månad

### Steg 0 – Före månadsskiftet: prognos
Skillen `bjerred-elprognos`, läge 1. Inget annat i den här filen berörs.

### Steg 1 – Månadsskiftet: kWh-facit
Skillen `bjerred-elprognos`, läge 2a, som i sin tur följer `bjerred-manadsdata`.
`cost` och `costPerKwh` är `null` (inte 0) tills fakturan finns.

### Steg 2 – När fakturan har kommit
Gör 2a först, eftersom de andra stegen hämtar siffror därifrån.

#### 2a. Läs fakturan med kod (inte för hand)
PyMuPDF (`fitz`) finns installerat. Kör från projektroten (PowerShell, UTF-8 på):

```python
import fitz, re
t = ' '.join(p.get_text() for p in fitz.open('Kraftringen/Fakturor/ÅÅÅÅMM_....pdf'))
t = re.sub(r'\s+', ' ', t)
for k in ['Avser', 'Avläsning', r'Spotpris \(', r'Rörliga kostnader', r'Fast påslag',
          r'Elöverföring', r'Energiskatt', r'Månadsavgift', r'Summa exkl', r'OCR-nummer']:
    for m in re.finditer(k + r'.{0,90}', t):
        print(m.group(0))
```

Det man behöver: fakturans **totalbelopp** (rubriken "Avser <månad> N kr"), **OCR-/fakturanummer**,
**kWh enligt fakturan**, och öre/kWh för **spotpris**, **rörliga kostnader**, **fast påslag (1,70)**,
**elöverföring (rörlig nätavgift)** och **energiskatt (36,00)**.

- *Allt elpris* (Kraftringens "El inkl elcert" / "El (spot + rörliga + påslag)") = spot + rörliga + påslag.
- Kontrollera att kWh enligt fakturan stämmer med månadens kWh i `index.html` (±1 kWh).

#### 2b. Kostnaden i de fyra ordinarie filerna
`cost` = fakturans totalbelopp i hela kronor (t.ex. 49 876), `costPerKwh = cost / totalKWh`
(2 decimaler). Följ `bjerred-elprognos` läge 2b / `bjerred-manadsdata`, inklusive `prognoser.js`
och `prognoser.md`.

#### 2c. Spotpris-sidan, tabell 3 (Förutsagt mot faktura)
Sidan: `Spotpris/spotpris.html`. **Obs, förväxlingsrisk:** det som fylls i är **tabell 3**, de gula
fälten "Fakturans spot" och "Fakturans rörliga kostnader". Tabell 2 (Kraftringens och Eneas pris
mot spotpriset) är något annat, se "Ännu inte gjort / öppna beslut".

1. Lägg till månaden i `Spotpris/data/facit_jul_sep.json` under `manader`, med nyckeln `"ÅÅÅÅ-MM"`:
   `{"spot_ore": 128.09, "rorliga_ore": 4.80, "paslag_ore": 1.70, "kwh_faktura": 21688.74}`.
   Uppdatera också `metadata.kalla` (vilken faktura, och att den lästes efter förutsägelsen).
2. Kör om `forutsag_spotpris.py` **från mappen `Spotpris/`** (`python forutsag_spotpris.py`).
   Det skriver om `data/forutsagelse_data.js` och `data/forutsagelse_jul_sep.json`. Förutsägelserna ska
   vara **oförändrade** (kontrollera med `git diff`); det som tillkommer är `facit`-blocket och en rad i `analys_v`.
3. **Skriptet stämplar om `"gjord"` till dagens datum.** Sätt tillbaka till datumet förutsägelsen
   gjordes (`2026-10-07`) i båda filerna, annars ser det ut som att förutsägelsen gjordes efter fakturan.
4. Verifiera på sidan (lokal server): rätt värden i de två rutorna, felen räknas ut, tabell 4 och 6
   har fått en rad, och sidans text om september (blindprovet) visar utfallet.
5. Ta bort `Spotpris/__pycache__/` om den skapats.
6. **Synka beskrivande texter** (annars blir de föråldrade, vilket hände med september):
   - `Spotpris/README.md`, avsnittet "Blindprov": vilka månader, felen, RMS, och om någon ren förutsägelse återstår.
   - `Spotpris/PRD.md`: statusraden överst, rubriken och tabellen i avsnitt 4.6 (en ny rad per månad), punkterna
     under tabellen (RMS, spann, tecken, rörliga, debiteringsunderlag) och stegen i listan i slutet.
   - Räkna om RMS och autokorrelation med **samma metod** som förut. RMS = rotmedelvärdet av felen för
     M4b. Autokorrelationen = Pearson-korrelationen mellan fel *t* och fel *t+1* (reproducerar −0,74 för åtta
     månader). Citera inte en siffra som inte går att reproducera.
   - Skriv det som mäts (siffrorna) skilt från tolkningen, och påstå inte mer än vad några få månader ger.
   - `grep` efter "återstående", "juli–augusti", "åtta månader" för att hitta sådant som blivit gammalt.

Obs: filnamnet `facit_jul_sep.json` och texterna "juli–september" är historiska. Blindprovet gällde
bara juli–september 2026. Hur oktober och senare ska hanteras är inte beslutat (se öppna beslut).

#### 2d. Intern debitering
Sidan: `Eneas_Samkop_av_El/intern_debitering.html`. Siffrorna ligger i `intern_underlag.js`
(arrayen `STANDARD`, fasta månader) och **inte** bara i webbläsarens localStorage. Annars syns inte
månaden för någon annan än Kent, och ingående mätarställning blir fel i en ren webbläsare.

1. **Läs bilden** `Kraftringen/Intern_debitering/ÅÅÅÅMM_Intern_debitering.jpg` (öppna den med Read-verktyget).
   Hämta de fyra **utgående** mätarställningarna (huvudmätare, bastu herr, bastu dam, varmvatten),
   rörlig nätavgift, el-pris, energiskatt, "Hela fakturan", fakturanummer och **"Totalt"** (= `facit`).
2. **Kedjekontroll:** bildens *ingående* ställningar ska vara lika med föregående månads *utgående*
   i `STANDARD`. Om inte: stanna och fråga.
3. Lägg till ett objekt sist i `STANDARD` (mönster: se septemberposten):
   `{ key:'ÅÅÅÅ-MM', faktura:'62294', nr:'3199122106', kwhFaktura:'21688,74', facit:24849, s:{}, e:{huvud, herr, dam, varm}, p:{rorlig:'22,39', el:'134,59', skatt:'36,00'} }`
   (kommatecken som decimaltecken i textfälten; `facit` som heltal).
4. Kontrollera att siffrorna **överensstämmer med fakturan** (2a): `nr`, `faktura`, `kwhFaktura`, öre/kWh.
5. Sätt `var valt` (standardmånad) till den nya månaden, och uppdatera texterna "Januari–[månad] 2026
   är fasta månader" (två ställen i `knappInfo`/kommentaren) och i teknikrutan i `intern_debitering.html`
   ("Januari–[månad] är förifyllda …") samt raden för filen i `Eneas_Samkop_av_El/README.md`.
6. Lägg en kommentar `// UPPDATERING ÅÅÅÅ-MM-DD: ...` ovanför.
7. **Verifiera lokalt:** sidan ska visa "✓ Huvudmätarens förbrukning … stämmer med fakturan" och
   "✓ Totalt N kr mot tidigare debiterat N kr". Avvikelse upp till 2 kr är normal (avrundade ställningar).
   Pröva också att öppna med en tom, sparad månad i localStorage (en tom `extra`-månad ska ersättas av
   de fasta värdena, se `las()` i `intern_underlag.js`).

#### 2e. Länkar och version på intern debitering (se Kents bild 2026-10-08)
På `intern_debitering.html`, avsnittet "Källor", och i sidfoten:

1. **Kraftringen-fakturan:** lägg till en länk för den nya månaden sist i listan "Fakturor:" (filen i
   `../Kraftringen/Fakturor/`). Uppdatera även rubrikens period ("januari–september 2026").
2. **Debiteringsunderlaget:** lägg till en länk för bilden sist i listan (filen i
   `../Kraftringen/Intern_debitering/`). Uppdatera även perioden.
3. **Ny version:** höj `VERSION` (och `VERSIONSDATUM`) i `intern_debitering.js`. Versionsraden i sidfoten
   hämtas därifrån.
4. Granskningsmeningen i sidans topp gäller bara januari–juni (tvåstegsgranskade). Ändra inte den till
   att gälla senare månader utan att granskningen gjorts.

#### 2f. Eneas jämförelsesida, tabell 1 (forts.) (Kents önskemål 2026-10-08)
Sidan `Eneas_Samkop_av_El/enea_jamforelse.html` jämför bara januari–juni med Eneas, och det ska den
fortsätta göra. Månader efter juni visas ändå under tabell 1 i en egen tabell ("Tabell 1 (forts.)").

1. Lägg ett objekt sist i `MANADER_JUL_SEP` i `enea_jamforelse.js` (**inte** i `MANADER`, annars hamnar månaden i
   tabell 2, summorna och det som kopieras). Fälten: `kwh`, `fakturaKr`, `krOre` (spot + rörliga + 1,70 påslag),
   `natOre`, `skattOre`, `fastNatKr`. Läs **fast nätavgift ur fakturan**: den var 8 824 kr/mån januari–juni men
   7 980 kr/mån från juli.
2. Lägg en fakturalänk i källistan i `enea_jamforelse.html`, uppdatera rubriken/perioden i den nya tabellen vid behov
   (ändra rubrik och text om fler än tre månader), och höj `VERSION`/`VERSIONSDATUM`.
3. Verifiera lokalt (dubbelklicka på ordet "Kraftringen" för att visa tabell 1) att kolumnerna ligger rakt under
   januari–juni-tabellen och att summaraden stämmer.

### Steg 3 – Avslut varje månad
1. Verifiera alla berörda sidor på en lokal server (Spotpris, intern debitering, `index.html`).
2. Stoppa servern. Ta bort `__pycache__`.
3. Uppdatera **Läge per månad** nedan.
4. Fråga Kent om han vill att du committar och pushar. Gör det inte oombedd.

---

## Läge per månad (loggen)

Förklaring: ✓ klart och verifierat, ✗ inte gjort, – gäller inte. Datum = när det gjordes.

| Steg | Jul 2026 | Aug 2026 | Sep 2026 |
|------|----------|----------|----------|
| 1. kWh i de fyra ordinarie filerna | ✓ | ✓ | ✓ 2026-10-04 |
| 2a. Faktura läst (PDF → siffror) | ✓ 2026-10-07 | ✓ 2026-10-07 | ✓ 2026-10-08 |
| 2b. Kostnad i de fyra ordinarie filerna | ✓ | ✓ | ✓ 2026-10-08 (62 294 kr, 2,87 kr/kWh) |
| 2c. Spotpris, tabell 3 (`facit_jul_sep.json`) | ✓ 2026-10-07 | ✓ 2026-10-07 | ✓ 2026-10-08 |
| 2c-doc. Blindprovstexter i `Spotpris/README.md` och `PRD.md` | ✓ 2026-10-08 | ✓ 2026-10-08 | ✓ 2026-10-08 |
| 2d. Intern debitering (`STANDARD`) | ✓ 2026-10-08 | ✓ 2026-10-08 | ✓ 2026-10-08 |
| 2e. Källlänkar och version (intern debitering) | ✓ 2026-10-08 (v1.4) | ✓ 2026-10-08 (v1.4) | ✓ 2026-10-08 (v1.4) |
| 2f. Eneas jämförelsesida, tabell 1 (forts.) | ✓ 2026-10-08 (v2.3) | ✓ 2026-10-08 (v2.3) | ✓ 2026-10-08 (v2.3) |

Januari–juni 2026 lades in vid bygget av Eneas-sidorna och Spotpris-sidan (2026-10-06 och 2026-10-07)
och hanteras i `kraftringen.json` (Spotpris) och `STANDARD` (intern debitering).

### Det som gjordes den 2026-10-08, kort
- Spotpris tabell 3: septembers fakturaspot 128,09 öre/kWh och rörliga 4,80 öre/kWh inlagda. Felet för
  M4b blev −4,41 öre/kWh (gräns 4,5), och fakturan hamnade utanför det förutsagda spannet.
- Intern debitering: juli, augusti och september inlagda som fasta månader (september 24 849 kr).
  Tabellen "Restaurangens andel januari–juni 2026" och jämförelsen med Eneas priser togs bort från
  den sidan (de hör hemma på Eneas-sidan och förvillade). Version 1.4.
- Kostnaden för september (62 294 kr, 2,87 kr/kWh) inlagd i `index.html`, `data.html`, `data.md` och
  `fore_och_efter_ombyggnad.js` (`prognoser.*` berörs inte, de gäller kWh).
- **Omanpassning av M4b** (Kent bad om den): nytt skript `omanpassa_m4b.py` med tester `test_omanpassning.py`,
  kriterier skrivna före körningen (`data/omanpassning_kriterier.json`), indata ur debiteringsunderlagen
  (`data/omanpassning_indata.json`) och en extrasida `Spotpris/omanpassning.html` (länkad från `spotpris.html`).
  Resultat: ver. 2 = bastun öppnar 07.30, RMS 1,99 mot 2,26 på nio månader; K1 ej uppfyllt (3,23 > 3,0),
  K2 och K3 uppfyllda. Ver. 1 med verklig bastu/varmvatten-fördelning ger i september −3,75, inte −4,41
  (blindprovet antog 23 % varmvatten, verkligt är 11 %).
- Texterna som beskrev september som "återstående" uppdaterades i `Spotpris/README.md` och `Spotpris/PRD.md`
  (avsnitt 4.6, steg 7). Autokorrelationen räknades om med samma metod som tidigare (korrelationen mellan
  på varandra följande fel): −0,74 med åtta månader, −0,00 med nio.

## Ännu inte gjort / öppna beslut

Här samlas sådant som Kent har sagt ska göras men som inte är gjort, eller som inte är avgjort.
Stryk eller flytta upp till rutinen när det är avgjort.

- **Omanpassningen av M4b är gjord 2026-10-08** (se `Spotpris/omanpassning.html`, `omanpassa_m4b.py`,
  `Spotpris/PRD.md` avsnitt 4.7). Den gjordes **separat**: `kraftringen.json`, `m4b_resultat.json`,
  `forutsagelse_*` och Spotpris-sidans tabell 1–6 är oförändrade, så att blindprovet förblir orört.
  Utfall: ver. 2 (bastun öppnar 07.30, övrigt som ver. 1) är ett **försök**, eftersom kriterium K1
  (största fel ≤ 3,0) missades med 3,23 i augusti. **Ver. 1 är fortsatt referens.** Flytta *inte*
  juli–september till `kraftringen.json` utan ett nytt beslut av Kent: det skulle ändra tabell 1, 2, 4 och 6
  och göra blindprovet obrukbart.
- **Oktober: förutsägelse med både ver. 1 och ver. 2, före fakturan.** Det är bestämt i
  `data/omanpassning_kriterier.json` (beslutsregeln), men **inte byggt**: `forutsag_spotpris.py` har
  juli–september hårdkodat och stöder bara ver. 1. Bygg ut det (eller ett nytt skript) innan oktoberfakturan
  läses, skriv ned förutsägelsen med datum, och bedöm först efter oktober, november och december
  (tre månader). En månad räcker inte. Samma kriterier-före-körning-princip gäller för varje ny omanpassning.
- **Fråga till Kent (underlag saknas):** när började bastun öppna 07.30? Om det kan beläggas kan öppettiden
  anges per månad i stället för att anpassas (se `omanpassning.html`, "Tolkning").
- **Nya månader och omanpassningssidan:** `omanpassning.html` visar Jan–Sep. När fler månader kommit och
  en ny omanpassning görs: kör om `omanpassa_m4b.py` med de nya månaderna (kräver att skriptet byggs ut från
  nio månader, där Jul–Sep läses ur `omanpassning_indata.json` och `facit_jul_sep.json`), behåll gamla
  resultat som versioner, och skriv kriterierna först.
- **Spotpris, tabell 1 och 2** bygger på `data/kraftringen.json` (januari–juni) och modellen ver. 1.
  Juli–september ligger bara i `facit_jul_sep.json` (tabell 3, 4 och 6).
- **Oktober och senare på Spotpris:** blindprovet gällde juli–september. Det är inte bestämt om nya
  månader ska in i samma tabell 3, i en ny tabell, eller vänta på omanpassningen. Fråga Kent.
- **Texter på Spotpris som fortfarande säger "juli och augusti":** tabell 9 och 10, diagram 1,
  blindprovstexten och `startpuls_data.js` / `avlasning_data.js` (skapas av `kanslighet_*.py`).
  Körs inte om automatiskt när tabell 3 får en ny månad.
- **Eneas jämförelsesida** (`enea_jamforelse.*`): jämförelsen med Eneas (tabell 2) gäller fortfarande bara
  januari–juni. Juli–september visas sedan 2026-10-08 under tabell 1 (se steg 2f), utan att ingå i jämförelsen.
- **Granskning:** juli–september på intern debitering är inte tvåstegsgranskade.
- **Fler månadsmoment kommer.** Kent har sagt att fler saker ska göras varje månad. Lägg dem som nya steg
  under "Rutin per ny månad".

## Bakgrund

Skapad 2026-10-08 på Kents begäran efter att Spotpris tabell 3 och intern debitering uppdaterats
för september. Syftet: att månadsrutinen inte ska ligga i chatthistoriken. Placeringen bredvid
`bjerred-elprognos` och `bjerred-manadsdata` följer projektets vana att ha en skill per återkommande
procedur; den här är den överordnade checklistan som pekar på de andra.
