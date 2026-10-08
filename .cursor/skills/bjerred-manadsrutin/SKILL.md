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

## PÅMINNELSE: oktoberfakturan granskas extra noga (Kent, 2026-10-08)

Kraftringens elhandelsavtal ("Rörligt kvartspris med bindningstid") gällde **t.o.m. 2026-09-30**. Kent vet inte vad som
händer från 1 oktober och antar att leverantören fortfarande är Kraftringen, utan nytt avtal på plats. Oktoberfakturan
(fakturadatum cirka 10 november 2026, avser oktober) ska därför läsas och kontrolleras **extra noga**, i två steg,
innan något läggs in. **Säg detta till Kent så fort fakturan eller "ny månad" nämns, och stanna vid avvikelse.**

Kontrollera i ordning:
1. **Avtalsraderna** på sida 1–2: elnätsavtal, elhandelsavtal, "Gäller t.o.m." för elhandeln, avtalsform. Ny
   bindningstid? Annat avtalsnamn? Ny leverantör (Eneas eller annan) på fakturan?
2. **Alla prisrader mot septemberfakturan** (3199122106): spotpris, rörliga kostnader (sep 4,80 öre/kWh), fast påslag
   (1,70), månadsavgift elhandel (0 kr), elöverföring (sep 22,39 öre/kWh), energiskatt (36,00 öre/kWh), fast nätavgift
   (7 980 kr/mån). Avviker något ska det anges och förklaras, inte bara läggas in.
3. **Räkna om fakturan med kod** (inte för hand): kWh × (öre) + fasta avgifter, moms 25 %, och att summa exkl. moms +
   moms = totalbeloppet (öresutjämning högst ±1 kr). Jämför med fakturans egna delsummor.
4. **kWh och mätarställningar:** avläsning 2026-10-01 ska vara 408 737,96 (septemberfakturans slutställning) och
   användningen ska stämma med elmätaren i `index.html` (±1 kWh). Mätarnummer och anläggnings-id ska vara samma
   (3838826777640425, 735 999 133 000 151 451).
5. **Mottagare och uppgifter:** septemberfakturan hade ändrad mottagare ("Föreningen Bjerreds Saltsjöbad, Kerstin Gosse,
   Apotekarevägen 50") mot juli och augusti ("Bjärreds Saltsjöbad, Box 22"). Notera om den ändras igen. Kontrollera även
   fakturadatum, förfallodatum och att beloppet inte är dubbelfakturerat.
6. **Andra steget:** läs PDF:en en gång till som text (inte bara med kod) och jämför varje belopp med steg 3. Skriv
   det som inte kunde kontrolleras som "inte kontrollerat".
7. **Om villkoren har ändrats:** stanna och fråga Kent innan Spotpris tabell 2/3, intern debitering, Eneas-jämförelsen
   och prognosernas kostnad uppdateras. Alla bygger på dagens villkor (se steg 2a ovan).

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

### Överblick: två delar med cirka en veckas mellanrum (Kent, 2026-10-08)

Kent ser månaden som två deluppgifter, och steg 0–2 nedan hör ihop så här:

| Del | När | Vad | Steg |
|-----|-----|-----|------|
| **A. Gissa** | De första dagarna i nästa månad (t.ex. 1–5 november), **innan fakturan** (kommer cirka den 10:e) | Månadens kWh är fastställd. M4b används för att förutsäga fakturans spotpris (och därmed allt elpris), och förutsägelsen **skrivs ned med datum innan fakturan öppnas** | 1 (kWh-facit) + **1b** (förutsägelsen) |
| **B. Facit och analys** | Cirka den 10:e, när fakturan kommit | Fakturan läses och läggs in överallt. Sedan analyseras hur väl M4b gissade, och det beskrivs på Spotpris | 2a–2h, framför allt 2c och **2i** (analysen) |

Steg 0 (Kents egen kWh-prognos före månadsskiftet, cirka den 27:e) är ett tredje, tidigare tillfälle och en annan sak:
den gäller kWh, inte priset. Ordningen i tid är alltså 0 → 1 + 1b → 2.

**Verktyg:** båda delarna hanteras av ett skript som körs **varje månad**: `Spotpris/forutsag_manad.py`
(byggt 2026-10-08). Del A: `python forutsag_manad.py ÅÅÅÅ-MM --huvud … --bastu … --varm …`. Del B: samma skript med
`--facit`. Se steg 1b och 2i. (`forutsag_spotpris.py` är det gamla engångsskriptet för blindprovet juli–september och
ska inte köras om.) Spotpris-sidan (`spotpris.html`) visar än så länge bara juli–september, inte de nya månaderna.

### Steg 0 – Före månadsskiftet: prognos
Skillen `bjerred-elprognos`, läge 1. Inget annat i den här filen berörs.

### Steg 1 – Månadsskiftet: kWh-facit
Skillen `bjerred-elprognos`, läge 2a, som i sin tur följer `bjerred-manadsdata`.
`cost` och `costPerKwh` är `null` (inte 0) tills fakturan finns.

### Steg 1b – Del A: gissa fakturan med M4b, före fakturan (skript: `Spotpris/forutsag_manad.py`)
Görs de första dagarna i nästa månad, när steg 1 är klart och **innan fakturan har lästs**. Det som gör det ett
blindprov är att gissningen är nedskriven och daterad före facit. Läs aldrig fakturan först. **Körs varje månad.**

Gör så här (PowerShell, från mappen `Spotpris/`, **decimaltal med punkt**, annars kan PowerShell tappa siffror):
1. `python hamta_spotpris.py ÅÅÅÅ-MM` (hela månaden måste finnas, t.o.m. sista dygnet).
2. `python forutsag_manad.py ÅÅÅÅ-MM --huvud 21000 --bastu 8800 --varm 1500`
   Mätarställningarna (bastu = herr + dam, varmvatten) är bäst. Saknas de: `--bad 10300` (bastu + varmvatten) i stället,
   då antas andelen varmvatten ur tidigare månader (varningen står i filen). Fakturans villkor, om Kent känner till andra:
   `--paslag`, `--skatt`, `--fast`.
3. Läs resultatet och lämna det som det är. Skriptet skriver `data/forutsagelse_ÅÅÅÅ-MM.json` och `.md` (daterade) och vägrar
   skriva över dem eller köra om månaden har facit (`--retrospektivt` och `--skriv-over` finns men markeras/flyttar den gamla).
4. Committa gissningen **före** fakturan öppnas (Kent säger till när), så att datumet går att styrka.

**Vad som gissas** (båda modellversionerna sida vid sida, punkt och spann):
1. **Spotpriset** (öre/kWh), M4b. Jämförs också med M1 och M2.
2. **Allt elpris** (öre/kWh) = spot + rörliga kostnader + påslag. Rörliga kostnader är ingen modell: kWh-vägt snitt och spann av tidigare månader.
3. **Elöverföring** (rörlig nätavgift, öre/kWh) ur sambandet `a + b × allt elpris`, anpassat på tidigare månader
   (januari–september: `15,66 + 0,0503 × allt elpris`, största avvikelse 0,06 öre). Ett empiriskt samband i Kents data,
   inte kontrollerat mot Kraftringens prislista.
4. **Fakturabeloppet** (kr inkl moms) = (fast nätavgift + kWh × (allt elpris + elöverföring + skatt)/100) × 1,25.
   Formeln återger Kents fakturor för januari–september inom 1 kr när alla poster är kända.

**Vad ver. 1 och ver. 2 är:** båda är M4b-modellen med olika antaganden om när bastun öppnar.
Ver. 1 (referensen) är anpassad på januari–juni: bastun öppnar 06.00. Ver. 2 (försök) är anpassad på januari–september: bastun öppnar 07.30.
Allt annat är lika (förvärmning 1 h, restaurangens förberedelse 2 h, varmvatten dygnet runt, jämn baslast 13 kW).
Oktober förutsägs med båda (`data/omanpassning_kriterier.json`); bedömningen görs först efter oktober, november och december.

**Osäkra antaganden, redan flaggade av skriptet:** påslag 1,70, skatt 36,00 och fast nätavgift antas oförändrade från senaste fakturan,
men elhandelsavtalet gällde bara t.o.m. 2026-09-30. Därför kan gissningen för oktober bli fel av skäl som M4b inte
rår för. Skriv det i analysen (steg 2i) i stället för att skylla på modellen.

### Steg 2 – När fakturan har kommit (Del B)
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

- **Fast nätavgift** (raden "Fast avgift (1.00 mån à N kr/mån)"). Den var 8 824 kr/mån januari–juni men
  7 980 kr/mån juli–september. Läs den varje månad, anta den inte (behövs i `enea_jamforelse.js`, steg 2f).
- **Avtalsraderna** (rubriken "Avtal": elnät och "Elhandel Rörligt kvartspris med bindningstid, Gäller t.o.m. …").
  Elhandelsavtalet gällde **t.o.m. 2026-09-30**, så oktoberfakturan (kommer cirka 10 november) kan ha nya villkor:
  fast påslag (nu 1,70 öre/kWh), rörliga kostnader, månadsavgift (nu 0 kr), eller en annan leverantör. Jämför
  raderna med föregående månad. Avviker något: stanna och fråga Kent, eftersom Spotpris tabell 2, intern
  debitering och Eneas-jämförelsen bygger på dagens villkor.
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
2. (Gäller bara blindprovet juli–september och dess sida; för oktober och senare används `forutsag_manad.py`, steg 1b och 2i,
   och punkt 2–3 här hoppas över.) Kör om `forutsag_spotpris.py` **från mappen `Spotpris/`** (`python forutsag_spotpris.py`).
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

#### 2g. Källistor och fakturalänkar på sidorna (kontrollera efter 2c–2f)
Fakturalänkarna ska finnas i källistan på **alla** sidor som använder fakturan:
- `Eneas_Samkop_av_El/enea_jamforelse.html` (klart jul–sep, steg 2f) och `intern_debitering.html` (klart, steg 2e).
- `Spotpris/spotpris.html`, källan "Kraftringen (2026) E-faktura … januari–september 2026": fakturorna för
  juli–september inlagda 2026-10-08 (de används i tabell 3). **Nästa månad: lägg till fakturan här också.**
- `Eneas_Samkop_av_El/kvalitetsgranskning.html` gäller bara januari–juni och ska inte ändras.

#### 2i. Analys: hur väl gissade M4b? (Del B, direkt efter att fakturan lagts in)
Målet är en kort, ärlig beskrivning av hur gissningen från steg 1b stämde med fakturan. Gör så här:
1. Kör (PowerShell, `Spotpris/`, decimaltal med punkt):
   `python forutsag_manad.py ÅÅÅÅ-MM --facit --spot 95.12 --rorliga 4.80 --natoverf 20.45 --fast 7980 --faktura 51234 --kwh-faktura 21000.12`
   Värdena kommer från fakturan (steg 2a). Skriptet läser den **frusna** gissningen, skriver `data/utfall_ÅÅÅÅ-MM.json` och `.md`
   (gissat, facit, fel och om fakturan låg inom spannet, för spot, allt elpris, elöverföring och fakturabelopp, båda versionerna)
   och kontrollräknar fakturan ur posterna. Stor avvikelse i kontrollräkningen betyder att en post ändrats (t.ex. nytt påslag).
   Utfallsfilen används sedan som underlag för nästa månads rörliga kostnader.
2. Jämför mot den **nedskrivna** gissningen, inte mot en ny körning: tecknet på felet, om fakturan låg inom spannet,
   och hur det står sig mot M1 och M2. Skilj på fel som beror på M4b (spotpriset) och fel som beror på antaganden om
   avtal och nätavgift (allt elpris, elöverföring, fakturabelopp).
3. Spotpris-sidans tabell 3 (steg 2c) fylls i som förut med fakturans värden, om månaden ska visas där.
4. Uppdatera "Blindprovet: hur gick det" på `spotpris.html` (numera räknas mycket ur datan) och de statiska texter som
   räknar månader (se "Ännu inte gjort": känslighetsanalyserna, steg 2h).
5. **Bedöm inte efter en enda månad.** Kriterierna i `data/omanpassning_kriterier.json` säger att ver. 1 och ver. 2 först
   jämförs efter oktober, november och december. Skriv "en månad säger lite" och peka på antalet månader.
6. Skriv det som inte kunde kontrolleras som "inte kontrollerat".
7. Lägg månadens nyckeltal i loggen nedan (rad 1b och 2i) och ta bort `__pycache__`.

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
| 1b. Del A: M4b-gissning nedskriven före fakturan (från oktober: `forutsag_manad.py`) | ✓ 2026-10-07 (blindprov) | ✓ 2026-10-07 (blindprov) | ✓ 2026-10-07 (blindprov) |
| 2i. Del B: analys av hur väl M4b gissade | ✓ 2026-10-07 | ✓ 2026-10-07 | ✓ 2026-10-08 |
| 2g. Fakturalänkar i källistan på Spotpris | ✓ 2026-10-08 | ✓ 2026-10-08 | ✓ 2026-10-08 |
| 2h. Känslighetsanalyser (`kanslighet_*.py`, tabell 9 och 10, avläsning) med månaden | ✓ 2026-10-08 | ✓ 2026-10-08 | ✓ 2026-10-08 |
| 0. Prognos i `prognoser.md`/`prognoser.js` | ✗ (ingen loggad) | ✓ (avräknad 2026-09-01) | ✗ (ingen loggad, fråga Kent) |

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
- **Oktober: gissning med både ver. 1 och ver. 2, före fakturan.** Bestämt i `data/omanpassning_kriterier.json`
  (beslutsregeln) och **byggt 2026-10-08**: `Spotpris/forutsag_manad.py` (steg 1b och 2i). Provkört bakåt på september
  (värdena för M4b stämde med `omanpassning_resultat.json`: ver. 1 124,34 och ver. 2 125,48 öre/kWh, kontrollräkningen av fakturan −0,34 kr).
  Det har **inte** körts på oktober, eftersom oktobers spotfil och kWh saknas. Bedöm först efter oktober, november och december
  (tre månader). En månad räcker inte. Samma kriterier-före-körning-princip gäller för varje ny omanpassning.
- **Gissningarna syns inte på Spotpris-sidan än.** De ligger som filer i `data/forutsagelse_*` och `data/utfall_*`
  (json och md). Om Kent vill visa dem på sidan (t.ex. en tabell "Gissning mot facit, per månad") är det ett separat uppdrag.
- **`--bad` är provkört** (2026-10-08, augusti med `--retrospektivt --utmapp <tillfällig mapp>`): M4b ver. 1 gav 80,27 öre/kWh
  mot 80,26 i det ursprungliga blindprovet. Det används bara om bastu- och varmvattenmätarna inte kunnat läsas av.
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
- **Känslighetsanalyserna (`kanslighet_avlasning.py`, `kanslighet_startpuls.py`) är hårdkodade på månader.**
  September lades in 2026-10-08 (tabell 9 och 10, avläsningsanalysen, baslastanalysen; Spotpris v1.2).
  Körs inte om automatiskt när tabell 3 får en ny månad. För oktober: lägg månadens mätardifferenser
  (huvud, bastu, varmvatten) i `FACIT_JUL_AUG` i båda skripten (namnet är historiskt, det är jul–sep och senare), kör dem,
  lägg en kolumn i tabell 9 och 10 (`spotpris.html`, `spotpris.js`) och läs igenom texterna som nämner
  "juli, augusti och september". Kontrollera att gamla månader är oförändrade i de nya datafilerna.
  **Obs, `forutsag_spotpris.py` ska inte köras om:** det skriver över blindprovets frusna förutsägelse.
- **September förändrar bilden för avläsningsdagen:** där räcker 2,8 dagars felläsning av bastun för att
  nollställa felet (−3,75). Sidan säger det nu som ett undantag. Det är en hypotes att kontrollera mot det
  verkliga avläsningsdatumet, inte ett resultat.
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
