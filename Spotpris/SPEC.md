# SPEC – Beräkningsskript för spotpris (M1–M4b) och effektkurva

Projekt: Elenergiförbrukning – Bjerreds Saltsjöbad
Mapp: `Spotpris/`
Status: Utkast 1, 2026-10-07 (genomläst med nya ögon, gränserna i avsnitt 6.4 beslutade av Kent). Byggd och testad 2026-10-07: se `berakna_spotpris.py`, `hamta_spotpris.py` och `test_spotpris.py` (16 tester OK).
Hör till: [`PRD.md`](PRD.md), utkast 5 (avsnitt 3, 4, 7, 8, 9 och 11)
Ansvarig: Kent Lundgren

> Siffrorna i det här dokumentet är hämtade ur Kraftringens fakturor, Bjerreds Saltsjöbads debiteringsunderlag och spotpriser från elprisetjustnu.se, och är
> framräknade i förstudierna (`forstudie/`). De är inte granskade i en tvåstegsgranskning. Kontrollera mot källan innan något återges.

Det här dokumentet är till för den som bygger skriptet. Det beskriver **exakt hur** (indata, algoritmer, gränsfall, utdata, tester). *Vad* och *varför* står i PRD:n. Där de två säger olika saker gäller PRD:n, och
skillnaden ska rapporteras till Kent i stället för att lösas med en gissning.

---

## 1. Omfattning

Skriptet ska:

1. hämta och kontrollera spotpriser för elområde SE4 (PRD F1, F2),
2. räkna ut **M1, M2, M4a och M4b** per månad, med leave-one-out och ett band av alternativa passningar (PRD F3, F3b),
3. räkna ut en **uppskattad effektkurva** (PRD F11),
4. skriva resultaten som JSON som sidan senare läser (PRD F10).

**M3** (förbrukningsviktat snitt med mätdata per kvart) ligger **utanför första bygget**. Skriptet ska bara ha ett gränssnitt för det (avsnitt 9) så att det kan läggas till utan att ändra resten.
**Sidan** (`spotpris.html`, `.css`, `.js`) ligger utanför den här SPEC:en och bygger på skriptets utdata.

**Språk och miljö:** Python 3.10 eller senare, **bara standardbiblioteket** (inga paket), kommentarer i detalj på svenska, vid ändring `# UPPDATERING ÅÅÅÅ-MM-DD: ...`. Windows och PowerShell används, så undvik `&&` i exempel på kommandon.
Skripten körs från mappen `Spotpris/` med relativa sökvägar.

## 2. Filer

| Fil | Roll |
|-----|------|
| `hamta_spotpris.py` | Hämtar spotpriser dygn för dygn, kontrollerar, skriver `data/spot_SE4_ÅÅÅÅ-MM.json`. |
| `berakna_spotpris.py` | Läser `data/`, räknar M1–M4b, leave-one-out, band, effektkurva. Skriver resultat till `data/`. |
| `test_spotpris.py` | Tester enligt avsnitt 12. Körs med `python test_spotpris.py`. Skriver "OK" eller en lista på fel. |
| `data/kraftringen.json` | Indata: Kraftringens poster och kWh per del och månad (avsnitt 3.2). |
| `data/oppettider.json` | Indata: öppettider (avsnitt 3.3). |
| `data/sokrum.json` | Indata: sökrummet för M4b (avsnitt 6). |
| `data/spot_SE4_ÅÅÅÅ-MM.json` | Rådata per månad (avsnitt 3.1). Skrivs av `hamta_spotpris.py`. |
| `data/manadsnitt.json`, `data/m4b_resultat.json`, `data/effektkurva.json` | Utdata (avsnitt 10). |

## 3. Indata

### 3.1 Spotpriser, `data/spot_SE4_ÅÅÅÅ-MM.json`

Källa: `https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE4.json` (priser utan moms, tillägg och skatter). Ett anrop per dygn. Svaret är en lista med objekt:
`SEK_per_kWh`, `EUR_per_kWh`, `EXR`, `time_start`, `time_end` (ISO 8601 med lokal tidsförskjutning, till exempel `2026-01-15T00:15:00+01:00`).

Filens format:

```json
{
  "metadata": {
    "omrade": "SE4",
    "kalla": "elprisetjustnu.se",
    "url_monster": "https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE4.json",
    "hamtad": "2026-10-07",
    "antal_dygn": 31,
    "antal_intervall": 2976,
    "intervall_per_dygn": {"2026-01-01": 96, "...": 96},
    "avvikelser": []
  },
  "intervall": [
    {"start": "2026-01-01T00:00:00+01:00", "slut": "2026-01-01T00:15:00+01:00",
     "sek_per_kwh": 0.73534, "eur_per_kwh": 0.06861, "exr": 10.717706}
  ]
}
```

- `intervall` är sorterade stigande på `start`. Inga dubbletter, inga luckor.
- **Pris i öre/kWh** = `sek_per_kwh` × 100, utan avrundning. Alla beräkningar sker i öre/kWh.
- **Upplösning:** från och med 2025-10-01 är intervallen 15 minuter (96 per dygn). Före det är de 60 minuter (24 per dygn). Ett timintervall **ersätts av fyra kvartsintervall med samma pris** innan beräkning, så att all beräkning sker på kvartar.
  Första bygget gäller januari–juni 2026, men koden ska klara båda.

### 3.2 `data/kraftringen.json`

En post per månad. Värden som ska finnas i första versionen (källor: fakturorna och debiteringsunderlagen; kWh per del är heltal ur underlagen):

| Månad | `kwh_huvud` | `kwh_bastu` | `kwh_varmvatten` | `spot_ore` | `rorliga_ore` | `paslag_ore` | `manadsavgift_kr` |
|-------|-----------:|-----------:|-----------------:|-----------:|--------------:|-------------:|------------------:|
| 2026-01 | 35 422 | 14 729 | 4 107 | 117,38 | 3,16 | 1,70 | 0 |
| 2026-02 | 32 002 | 11 839 | 3 821 | 116,68 | 3,18 | 1,70 | 0 |
| 2026-03 | 28 074 | 12 743 | 5 029 | 86,59 | 4,58 | 1,70 | 0 |
| 2026-04 | 26 671 | 11 225 | 3 864 | 63,12 | 3,47 | 1,70 | 0 |
| 2026-05 | 23 941 | 9 024 | 2 487 | 88,19 | 5,11 | 1,70 | 0 |
| 2026-06 | 20 609 | 7 431 | 1 423 | 100,09 | 4,66 | 1,70 | 0 |

Härledda värden (skriptet räknar, de skrivs inte in): `kwh_rest = kwh_huvud − kwh_bastu − kwh_varmvatten` ("restposten", PRD avsnitt 4.3), och `allt_elpris_ore = spot_ore + rorliga_ore + paslag_ore`.
`allt_elpris_ore` ska stämma med `krOre` i `Eneas_Samkop_av_El/enea_jamforelse.js` (122,24, 121,56, 92,87, 68,29, 95,00 och 106,45) med skillnad under 0,005 öre/kWh, annars avbryts körningen. Saknas `Eneas_Samkop_av_El/enea_jamforelse.js` ger skriptet en varning och hoppar över kontrollen (tillägg efter bygget: utkast 1 sa ingenting om det).
Juni: `kwh_bastu` är 7 431 (summan av de avrundade mätarställningarna). Debiteringsunderlagets bild anger 7 430. Det är en känd skillnad (granskning 2) och 7 431 gäller här.

### 3.3 `data/oppettider.json`

```json
{
  "restaurang": {"0": null, "1": null, "2": ["16:00","22:00"], "3": ["16:00","22:00"], "4": ["16:00","22:00"],
                 "5": ["11:00","22:00"], "6": ["11:00","17:00"]},
  "bastu": {"oppnar_alternativ": ["06:00", "07:30"], "stanger": "22:00"}
}
```

Nyckeln är veckodag enligt Pythons `date.weekday()` (0 = måndag, 6 = söndag), räknad på det **lokala** datumet. `null` betyder stängt. Källa: hemsidorna 2026-10-07 (PRD avsnitt 4.3). Tiderna antas ha gällt januari–juni 2026.
Bastun stänger i verkligheten 21.45, men modellen använder 22.00 (som i förstudierna). Ändra inte det utan att fråga Kent.

### 3.4 Tid och sommartid

- All tid är lokal tid med den förskjutning som står i `start`. **Kvartsindex** `q = timme × 4 + minut // 15` (0–95), taget från de lokala tecknen i `start`.
- Ett dygn med sommartid har **92** (2026-03-29) eller **100** (2026-10-25) kvartar. Kvartar summeras per **verkligt intervall**, inte per klockslag, och inga intervall läggs till eller tas bort.
- **Timupplösning före 2025-10-01:** ett vanligt dygn har 24 intervall. Vid sommartid har dygnet 23 (sista söndagen i mars) eller 25 (sista söndagen i oktober) timintervall.
  (Tillägg 2026-10-07 efter bygget: utkast 1 angav bara 24.)
- Antal timmar i en månad = antal intervall / 4. Det ska användas överallt där effekt (kW) ska bli energi (kWh).

## 4. Definitioner

Notation: `i` = ett kvartsintervall, `p_i` = pris i öre/kWh, `q_i` = kvartsindex, `wd_i` = veckodag, `m` = månad. `Σ` över månadens intervall.

- **M1** = Σ p_i / N, över alla intervall i månaden.
- **M2** = medelvärdet av p_i för intervall med `24 ≤ q_i < 88` (kl. 06.00–22.00), alla veckodagar.
- **M3** = Σ(p_i × e_i) / Σ e_i, där `e_i` är uppmätt förbrukning (kWh) i intervall `i`. Utanför första bygget (avsnitt 9).
- **M4a** och **M4b**: viktat spotpris för en **modellerad** förbrukning, avsnitt 5. M4a använder antagandena som de är. M4b väljer de okända antagandena så att passningen mot fakturan blir bäst (avsnitt 6).

**Fel** = modellens värde minus fakturans `spot_ore` (öre/kWh). Plus betyder att modellen räknar för högt.

## 5. Förbrukningsmodellen (M4a och M4b)

Månadens förbrukning delas i tre delar med kända kWh: **bastu** (`kwh_bastu`), **varmvatten** (`kwh_varmvatten`) och **restpost** (`kwh_rest`). Varje del fördelas över månadens kvartar så här.
`N` är antalet intervall i månaden, `T = N / 4` timmar.

**Parametrar** (väljs i avsnitt 6): `bo` (bastun öppnar, i kvartsindex: 06:00 → 24, 07:30 → 30), `pre` (timmar som bastun slås på före öppning), `prep` (timmar som restaurangen
förbereder före öppning), `varm` (`"24h"` eller `"tider"`), `V` (ventilation och annan jämn baslast, kW).

1. **Bastu.** Aktiv i intervall där `bo − round(pre × 4) ≤ q < 88`, alla veckodagar. Energin `kwh_bastu` fördelas **lika** över de aktiva intervallen. Pris för delen = medelpriset över de aktiva intervallen (`P_bastu`).
2. **Varmvatten.** Om `varm = "24h"`: fördelas lika över alla N intervall (`P_varm` = M1). Om `varm = "tider"`: vikt i intervall `i` = (1 om `bo ≤ q < 88`, annars 0) + (1 om restaurangen är öppen då, utan förberedelse, annars 0).
   Energin fördelas i proportion till vikten, och `P_varm` är det viktade medelpriset (Σ vikt × p / Σ vikt). Summan av vikterna är alltid större än noll, så ingen division med noll kan uppstå.
3. **Restpost.** Delas i två:
   - **Baslast (ventilation, värme, belysning, kylar med mera):** effekt `V` kW konstant, alltså energin `E_v = V × T` kWh, fördelad lika över alla N intervall. Pris = M1.
   - **Driftdel:** `E_d = kwh_rest − E_v`. Fördelas lika över intervall där restaurangen är **öppen med förberedelse**: veckodagens öppettid `[a, b)` i kvartar, aktiv för `a·4 − round(prep × 4) ≤ q < b·4` (veckodagar med `null` är aldrig aktiva).
     Pris = medelpriset över de aktiva intervallen (`P_drift`).
   - **Omöjlig kombination:** om `E_d < 0` är kombinationen **ogiltig** (hoppas över, avsnitt 6). Om det inte finns några aktiva intervall för driftdelen i månaden (inte möjligt i januari–juni) avbryts körningen med ett fel.
4. **Modellens viktade spotpris för månaden:**

   `M4 = ( kwh_bastu × P_bastu + kwh_varmvatten × P_varm + E_v × M1 + E_d × P_drift ) / kwh_huvud`

   (kontroll: `kwh_bastu + kwh_varmvatten + E_v + E_d = kwh_huvud`, med skillnad under 0,001 kWh).

Inget värde avrundas. Väderberoende värme modelleras **inte** (PRD avsnitt 4.4).

## 6. Sökrum och urval (M4b)

### 6.1 Sökrum (godkänt av Kent 2026-10-07)

| Parameter | Primär körning | Känslighetskörning |
|-----------|----------------|--------------------|
| `bo` | 06:00 och 07:30 | samma |
| `pre` | **1,0** (Kent: bastun slås på ungefär en timme före öppning) | 0; 0,5; 1; 1,5; 2; 3; 4; 5; 6 |
| `prep` | 0; 1; 2 | samma |
| `varm` | `"24h"`, `"tider"` | samma |
| `V` | 0, 1, 2, …, 20 kW | samma |

Primär körning: 2 × 1 × 3 × 2 × 21 = **252** kombinationer, varav 168 giltiga i förstudien. Känslighetskörningen redovisas **bredvid** den primära och räknas inte mot godkänd-kriterierna.
Sökrummet ligger i `data/sokrum.json` och ska inte vara inbyggt i koden.

### 6.2 Urval

- **Mål:** för varje kombination som är giltig i **alla** månader som ingår i urvalet (jan–jun i första bygget), beräkna felet per månad och `RMS = sqrt( Σ fel² / antal månader )`.
- **U1 (primärt urval):** kombinationen med lägst RMS. Oavgjort (skillnad under 1e-9): lägst största absolutfel, därefter lägst `V`, därefter ordningen `bo`, `prep`, `varm`.
- **U2 (information):** kombinationen med lägst **största absolutfel**, med samma oavgjort-regler. Redovisas som ett alternativ. Det är inte det primära urvalet.
- **Band:** alla giltiga kombinationer med `RMS ≤ 1,5` öre/kWh. Antalet, och för varje månad spannet av effekt per timme (avsnitt 8), redovisas. Dessutom redovisas antalet kombinationer med `största absolutfel ≤ 2,0`.
- En kombination som är **ogiltig i någon månad** ingår inte i urvalet, men räknas i `antal_ogiltiga` med orsak (`E_d < 0` i vilken månad).

### 6.3 Leave-one-out

För varje månad `k` av de som ingår: välj U1 på de **övriga** månaderna (samma regler), räkna modellens värde för `k` med den kombinationen, och redovisa felet. Om kombinationen är **ogiltig för `k`** (`E_d < 0`)
redovisas månaden som `saknas` med orsaken. Någon annan kombination väljs **inte** i stället. LOO-RMS och största absolutfel räknas på de månader som finns, och antalet `saknas` redovisas.

### 6.4 Godkänd-kriterier (Kent, 2026-10-07)

- **Passning:** största absolutfel i U1 per månad **≤ 3,0** öre/kWh.
- **Leave-one-out:** största absolutfel **≤ 4,5** öre/kWh.

Skriptet **utvärderar och redovisar** kriterierna som `uppfyllt` eller `ej uppfyllt`, med de faktiska talen, och ändrar aldrig gränserna eller urvalet för att nå dem.

**Hur gränserna kom till (beslutshistorik, redovisas öppet).** Gränserna sattes först till 2,0 och 4,0 (godkända av Kent samma dag), innan förstudien med bastun påslagen en timme före öppning (`pre` = 1,0) var körd.
Den körningen gav 2,55 och 4,09, och Kent beslutade då att i stället ange noggrannheten till cirka 3 respektive 4–5 öre/kWh. **Gränserna är alltså satta efter att utfallet var känt.** Det är tillåtet, och Kent äger dem,
men det betyder att kriterierna fungerar som ett **skydd mot försämring** (en ändring i koden eller indata som flyttar resultatet över gränsen ska upptäckas), och **inte** som ett oberoende bevis på att uppskattningen är bra.
Beviset kommer först när M3 (förbrukning per kvart) finns och M4b jämförs mot den.

**Utfall i förstudien (2026-10-07, `pre` = 1,0 timme, januari–juni):** U1 gav RMS 1,35 (`bo` 06:00, `prep` 2 timmar, `varm` 24h, `V` 13 kW) med fel +0,40, +0,02, −0,04, **+2,55**, +1,28 och −1,65. **Passning: uppfylld** (2,55 ≤ 3,0).
Leave-one-out gav +1,91, +0,02, −0,04, +2,55, +1,28 och **−4,09**. **Leave-one-out: uppfylld** (4,09 ≤ 4,5), med en marginal på 0,41 öre/kWh.
Som mått på hur trång passningen är: endast **1 av 168** giltiga kombinationer har ett största absolutfel ≤ 2,0 (1,96: `bo` 07:30, `prep` 2 timmar, `varm` 24h, `V` 13 kW, RMS 1,43), och 6 har ≤ 2,5.
Observation (hypotes, inte verifierad): aprils pris är lägst mitt på dagen (22–32 öre/kWh kl. 11–15) och fakturan är lägre än modellen, vilket tyder på mer förbrukning mitt på dagen än modellen antar.

**Hur noggrannheten får beskrivas på sidan:** "Uppskattningen av månadens spotpris för vår förbrukning stämmer inom cirka 3 öre/kWh per månad mot fakturan, och inom cirka 4–5 öre/kWh när en månad förutsägs utan att ingå i
anpassningen. Det är en uppskattning och inte en mätning." (Till jämförelse avviker M1 och M2 med upp till 8,5 öre/kWh.)

## 7. Månadsvärden (M1, M2, M4a)

- **M1** och **M2** räknas för varje månad med spotdata, oberoende av `kraftringen.json`. Dessutom per månad: antal intervall, antal negativa intervall (`p < 0`), lägsta och högsta pris, och medelpris per timme på dygnet (24 värden, medel över månadens intervall med den lokala timmen).
- **M4a** räknas för en **angiven kombination** av parametrar (standard: de arbetsantaganden som PRD avsnitt 7 anger, alltså `bo` 07:30, `pre` 1,0, `prep` 0, `varm` `"24h"`, `V` 0). Det är alltså ett antagande utan kalibrering. `V` = 0 betyder att hela restposten följer öppettiderna, vilket är modell D1 i PRD avsnitt 4.3 (RMS 3,5). M4a redovisas med fel mot fakturan.
- **M4b** = M4 för den kombination som U1 väljer, per månad.
- Fakturans `spot_ore`, `rorliga_ore`, `paslag_ore` och `allt_elpris_ore` skrivs med i utdata, och skillnader i öre/kWh: `allt_elpris − M1`, `spot_ore − M1`, och `allt_elpris − spot_ore` (= `rorliga + paslag`).

## 8. Effektkurva

För varje månad och den kombination som U1 väljer, samt för varje kombination i bandet:

- Effekt i intervall `i` (kW) = (summan av de delar som är aktiva i `i`: energin för delen i intervallet) / 0,25 timme. Energin per intervall är den som avsnitt 5 fördelar (lika över aktiva intervall, eller proportionell mot vikt för `varm = "tider"`). Baslasten ger exakt `V` kW i varje intervall.
- **Medeleffekt per timme på dygnet** `h` (0–23) = medelvärdet över månadens intervall med lokal timme `h` av summan av delarna.
- Utdata per månad: 24 värden per del (`bastu`, `varmvatten`, `baslast`, `drift`) och summan, samt `lagsta` och `hogsta` över bandets kombinationer för summan, per timme.
- **Kontroll:** medelvärdet av de 24 timvärdena (för summan) viktat med antal intervall per timme ska vara `kwh_huvud / T` med skillnad under 0,01 kW.
  (Januari: 35 422 / 744 = 47,6 kW.)
- Kurvan är en **uppskattning**. Utdata ska innehålla fältet `markning: "Uppskattning ur modell, inte en mätning"`, och sidan ska visa det.

## 9. Gränssnitt för M3 (inte byggt i första versionen)

Funktionen `m3(manad, forbrukning_kwh_per_intervall)` ska finnas som en tom funktion som avbryter med `NotImplementedError("M3 kräver förbrukning per kvart")`. Förväntat indataformat när det byggs: en lista (eller fil
`data/forbrukning_ÅÅÅÅ-MM.json`) med `start` (som i spotfilen) och `kwh`, sorterad och utan luckor, med exakt samma intervall som spotfilen. Då gäller M3 från avsnitt 4. Om M3 senare finns ska M4b jämföras mot M3
(PRD avsnitt 9, punkt 1b), men det är inte en del av den här SPEC:en.

## 10. Utdata

Alla tal skrivs med full precision (inga avrundningar), UTF-8, med indrag. Alla filer har `metadata` med `genererad` (datum), `skript_version` och `kalla`.

- **`data/manadsnitt.json`**: `manader["2026-01"]` med `m1_ore`, `m2_ore`, `antal_intervall`, `antal_negativa`, `lagsta_ore`, `hogsta_ore`, `timprofil_ore` (24 värden), `faktura` (`spot_ore`, `rorliga_ore`, `paslag_ore`, `allt_elpris_ore`), `skillnader_ore`,
  `m4a` (`parametrar`, `varde_ore`, `fel_ore`) och `m4b` (`varde_ore`, `fel_ore`).
- **`data/m4b_resultat.json`**: `primar` och `kanslighet`, var och en med `u1` och `u2` (`parametrar`, `rms`, `fel_per_manad`, `storsta_absolutfel`), `antal_kombinationer`, `antal_giltiga`, `antal_ogiltiga` (med orsak),
  `antal_i_band`, `antal_med_storsta_fel_max_2`, `leave_one_out` (`fel_per_manad` eller `"saknas"` med orsak, `rms`, `storsta_absolutfel`, `antal_saknas`) och `kriterier` (`passning`: `{gräns: 2.0, utfall, uppfyllt}`, `leave_one_out`: samma).
- **`data/effektkurva.json`**: `primar.manader["2026-01"]` och `kanslighet.manader["2026-01"]` (tillägg efter bygget: utkast 1 hade bara en nivå) med `delar` (24 värden per del), `summa` (24), `lagsta` (24), `hogsta` (24), `medeleffekt_kw`, `markning`.

## 11. Gränsfall och felhantering

| Fall | Beteende |
|------|----------|
| Ett dygn saknas i en månad | Avbryt med en lista på saknade dygn. Skriv inga utdata. |
| Antal intervall per dygn är något annat än 96, 92 (sista söndagen i mars), 100 (sista söndagen i oktober), eller före 2025-10-01 24, 23 och 25 | Avbryt med datum och antal. |
| API-anrop misslyckas | Tre försök per dygn med en kort paus. Misslyckas alla: avbryt och lista dygnen. Ingen del av en månad får skrivas som komplett. |
| Negativt pris | Tillåtet. Ingår i alla medelvärden utan avrundning till noll. Antalet räknas. |
| `E_d < 0` för en kombination | Kombinationen är ogiltig (avsnitt 6.2). Inte ett fel i körningen. |
| `allt_elpris_ore` avviker från `krOre` med 0,005 eller mer | Avbryt (avsnitt 3.2). |
| Månad i `kraftringen.json` utan spotfil | Hoppa inte över tyst: redovisa månaden som `saknas` och avbryt om den ska ingå i urvalet. |
| Skriptet körs två gånger med samma indata | Samma utdata, byte för byte, bortsett från `genererad`. Inget slumpmoment får finnas. |
| Ändrad indata (ny månad) | Utdata räknas om från grunden. Inget cache-beroende. |

## 12. Tester (`test_spotpris.py`)

Referensvärdena kommer från förstudiernas skript (2026-10-07). Avviker implementationen ska orsaken utredas innan något annat ändras.

| Nr | Test | Förväntat | Tolerans |
|----|------|-----------|----------|
| T1 | M1 per månad jan–jun (öre/kWh) | 112,99; 113,29; 84,59; 66,54; 94,61; 103,72 | 0,005 |
| T1b | M2 per månad | 125,76; 125,16; 89,20; 65,41; 86,24; 96,46 | 0,005 |
| T2 | Antal intervall per månad, och antal dygn | 2 976; 2 688; 2 972; 2 880; 2 976; 2 880; 181 dygn | exakt |
| T3 | Dygnet 2026-03-29 | 92 intervall, och `T` för mars är 743 timmar | exakt |
| T4 | Negativa intervall per månad | 0; 0; 26; 115; 128; 59 | exakt |
| T5 | Primär körning, U1 | RMS 1,35; `bo` 06:00, `pre` 1,0, `prep` 2, `varm` 24h, `V` 13; fel +0,40, +0,02, −0,04, +2,55, +1,28, −1,65 | 0,01 |
| T6 | Primär körning, leave-one-out | +1,91; +0,02; −0,04; +2,55; +1,28; −4,09 | 0,01 |
| T7 | Primär körning, antal giltiga kombinationer | 168 av 252. Antal med största absolutfel ≤ 2,0: 1 | exakt |
| T8 | Primär körning, U2 | `bo` 07:30, `prep` 2, `varm` 24h, `V` 13; största absolutfel 1,96; RMS 1,43 | 0,01 |
| T7b | Antal kombinationer i bandet (RMS ≤ 1,5): primär 7, känslighetskörning 81 | Förstudie 5 visar 66 i bandet, eftersom den körde ett glesare `pre`-steg (hela timmar 0–6). Känslighetskörningen här har tätare steg (0; 0,5; 1; 1,5; 2; 3; 4; 5; 6) och därför fler. | exakt |
| T9 | Känslighetskörning, U1 | RMS 1,21; `bo` 07:30, `pre` 5, `prep` 1, `varm` tider, `V` 13 | 0,01 |
| T10 | Effektkurvans medelvärde per månad | 47,6; 47,6; 37,8; 37,0; 32,2; 28,6 kW (jämfört med `kwh_huvud / T`, tolerans 0,01 kW). Förstudiens topp i januari (76,6 kW kl. 16) gäller för **känslighetskörningen** och är inte ett krav på den primära. | 0,01 |
| T11 | Kriterieutvärdering | Passning: `uppfyllt` (2,55 ≤ 3,0). Leave-one-out: `uppfyllt` (4,09 ≤ 4,5). Skriptet ändrar inte gränserna. Dessutom ett test med en konstruerad indata där felet blir större än gränsen, som ska ge `ej uppfyllt`. | – |
| T12 | Omöjlig kombination | En konstruerad kombination med `V` större än `kwh_rest / T` i någon månad räknas som ogiltig och ger ingen krasch. | – |
| T13 | Avbrott vid saknat dygn | Ett testdygn som tas bort ger ett avbrott med dygnets datum. | – |
| T14 | Determinism | Två körningar ger samma utdata (utom `genererad`). | byte för byte |
| T15 | `allt_elpris_ore` mot `krOre` | De sex värdena i avsnitt 3.2 stämmer. | 0,005 |

Obs T5–T10: dessa värden gäller **bara** med `kraftringen.json` enligt avsnitt 3.2, öppettiderna i avsnitt 3.3 och sökrummet i avsnitt 6.1. Ändras något av dem ska testvärdena räknas om och ändringen dokumenteras.

## 13. Kända begränsningar och antaganden

- **Profilen är inte entydig.** Många kombinationer passar nästan lika bra (förstudie 4: 6 130 av 64 176 under 2 öre/kWh i en bredare modell). Resultatet är "förenligt med fakturan", inte "så här förbrukade vi".
- **Anpassning mot fakturan är inte en oberoende validering.** Därför leave-one-out, och därför att M3 (när mätdata finns) blir facit.
- **Öppettiderna gällde kanske inte hela januari–juni** (Kent antar det). Bastun kan ha öppnat 06.00 före ändringen till 07.30. Därför provas båda.
- **"Slås på ungefär en timme före öppning"** (Kent) gäller bastun. Det gäller `pre = 1,0` i den primära körningen. Hur exakt "ungefär" är redovisas i känslighetskörningen.
- **Luft-värmepump till restaurangen** antas finnas (Kent). Den ingår i baslasten utan egen modellering.
- **Spotpriserna kommer från en sammanställning** (elprisetjustnu.se), inte direkt från elbörsen. Stickprov mot Nord Pool eller ENTSO-E ska göras i granskningen (PRD fråga 5).
- **Fakturans spotpris** (117,38 med flera) är avrundat till två decimaler. Det ger en osäkerhet på högst 0,005 öre/kWh i felen, vilket är försumbart mot kriterierna.

## 14. Ej i omfattning

M3 (utöver gränssnittet), väderberoende värme (PRD fråga 20), sidan och dess kopiering och diagram, Eneas pris (PRD fråga 15) och publicering. Nord Pool och ENTSO-E som källa är inte byggda.

---

## Källor

Alfabetisk ordning. De fullständiga referenserna, med annoteringar och kontrollerade länkar, finns i [`PRD.md`](PRD.md), avsnittet Källförteckning.

Bjerreds Saltsjöbad (u.å.a) *Badet* [webbsida]. [https://bjerredskallbadhus.se/badet/](https://bjerredskallbadhus.se/badet/) (hämtad 2026-10-07).
*(Öppettider för badet och bastun.)*

Bjerreds Saltsjöbad (u.å.b) *Restaurangen* [webbsida]. [https://bjerredskallbadhus.se/restaurangen-ny/](https://bjerredskallbadhus.se/restaurangen-ny/) (hämtad 2026-10-07).
*(Restaurangens öppettider per veckodag.)*

Elprisetjustnu.se (u.å.) *Elpris-API*. [https://www.elprisetjustnu.se/elpris-api](https://www.elprisetjustnu.se/elpris-api) (hämtad 2026-10-07).
*(Spotpriser SE4 per kvart och timme, utan moms, tillägg och skatter.)*

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor, PDF]. Lokalt i projektet: [`../Kraftringen/Fakturor/`](../Kraftringen/Fakturor/).
*(Spotpris, rörliga kostnader och fast påslag per månad.)*
