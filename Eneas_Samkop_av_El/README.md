# Elkostnad januari–juni 2026: Kraftringen och Eneas

- **Live:** [https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/enea_jamforelse.html](https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/enea_jamforelse.html)
- **Kvalitetsgranskning:** [https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/kvalitetsgranskning.html](https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/kvalitetsgranskning.html)
- **Intern sida:** [https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/intern_debitering.html](https://kentlundgren.github.io/Bjerred-el/Eneas_Samkop_av_El/intern_debitering.html) (debiteringsunderlag för restaurangen, internt för Kent Lundgren)
- **Lokal sökväg:** `D:\VåraFiler_primära_på_SSD\Kent_dokument\Data\HTML\kentlundgren_se\program\Bjerred\El\Eneas_Samkop_av_El\`
- **Repo:** [github.com/kentlundgren/Bjerred-el](https://github.com/kentlundgren/Bjerred-el)

En jämförelse av vad Bjerreds Saltsjöbad betalade för el till Kraftringen januari–juni 2026
och vad det hade blivit med Eneas priser (tjänsten Samköp av el). Sammanställd av Kent Lundgren.

> Siffrorna är hämtade ur Kraftringens fakturor och kontrollräknade mot dem i en tvåstegsgranskning
> (egenkontroll och oberoende granskning, se [kvalitetsgranskning.html](kvalitetsgranskning.html)).
> Antagandena i jämförelsen är inte avgjorda. Kontrollera mot källan innan något återges.

## Vad sidan gör

Eneas (Isak Cerwén) fyller i det pris per kWh som Eneas hade tagit för själva elen varje månad.
Sidan räknar ut vad fakturan hade blivit och visar skillnaden mot idag, månad för månad.

- **Tabell 1, idag:** det som faktiskt betalades till Kraftringen (kWh, fakturabelopp, elpris, nätavgift, energiskatt).
- **Tabell 2, med Eneas priser:** samma kolumner. De gula fälten fylls i av Eneas. Fakturan med Eneas och skillnaden mot idag (kr och %) räknas ut.
- **Kopiera tabellerna:** en knapp lägger tabellerna på urklipp så att de kan klistras in i ett mejl. Inget skickas från sidan och ingen databas används. Inmatningen sparas bara i den egna webbläsaren.

Nätavgift, energiskatt och fast nätavgift (Kraftringen Nät AB) är oförändrade oavsett elhandlare.
Bara elhandeln byts ut.

## Så räknas fakturan med Eneas

```
Faktura med Eneas = faktura idag
                  + ((Eneas pris − Kraftringens pris) × kWh / 100 + Eneas månadsavgift) × 1,25
```

Räknat från Kraftringens faktiska fakturabelopp, så att tabell 1 stämmer med fakturorna. Belopp
avrundas till hela kronor. Eneas pris ska omfatta allt som gäller själva elen (elcertifikat, påslag,
profil- och balanskostnader), på samma sätt som Kraftringens "El inkl elcert" (spotpris + rörliga
kostnader + 1,70 öre/kWh fast påslag).

## Filer

| Fil | Innehåll |
|-----|----------|
| `enea_jamforelse.html` | Sidan (tabeller, gula fält, knappar, källor). |
| `enea_jamforelse.css` | Utseende och utskriftsformat. |
| `enea_jamforelse.js` | Kraftringens utfall, beräkning, sparande i webbläsaren och kopiering. Juli–september (`MANADER_JUL_SEP`, sedan v2.3) visas under tabell 1 men ingår inte i jämförelsen med Eneas. |
| `enea_hjalp.js` | Gemensamma hjälpfunktioner (tolkning av tal, talformat). |
| `intern_debitering.html` | Intern sida: mall för debiteringsunderlag (som dagens underlag), januari–september 2026. Tabellen med restaurangens andel med Eneas priser togs bort 2026-10-08. |
| `intern_underlag.js` | Debiteringsunderlaget: månadsval, mätarställningar, beräkning, kontroller, kopiering och utskrift. |
| `intern_debitering.js` | Liten startfil: version och teknikruta. |
| `intern_debitering.css` | Utseendet på debiteringsunderlaget (liknar dagens underlag). |
| `PRD.md` | Kravdokument med bakgrund, beslut och kontrollräkning mot fakturorna. |
| `kvalitetsgranskning.html` | Redovisning av kvalitetsgranskningen: omfattning, metod och resultat (kort sammanfattning överst, fullständig redovisning nedan). Egen sida som går att länka till. |
| `KVALITETSGRANSKNING.md` | Egenkontrollen: hur siffrorna och beräkningarna granskades av den som byggde sidorna. Skript i `kvalitetsgranskning/`. |
| `kvalitetsgranskning/` | Skript, uppdraget till den oberoende granskningen (`granskning2_prompt.md`) och dess rapport (`granskning2_resultat.md`). |
| `Eneas Samkop av El 2026.pdf` | Eneas broschyr (innehåller inga priser). |

Rena HTML-, CSS- och JavaScript-filer utan ramverk och utan byggprocess. Öppnas direkt i webbläsaren.

## Status

Version 2.0 (2026-10-06). Kraftringens belopp är kontrollräknade månad för månad mot de sex
fakturorna (se `PRD.md`, avsnitt 13). Eneas priser är ännu inte inlagda.

## Källor

Kraftringen (2026) *E-faktura elnät och elhandel, januari–juni 2026* [fakturor, PDF]. Kraftringen Nät AB och
Kraftringen Energi AB. *Underlag för kWh, fakturabelopp, nätavgifter, energiskatt och Kraftringens elpris.*
Fakturor:
[januari](../Kraftringen/Fakturor/202601_Kraftringen_Januari-20265_3082197306.pdf),
[februari](../Kraftringen/Fakturor/202602_Kraftringen_Februari_2026_3098735503.pdf),
[mars](../Kraftringen/Fakturor/202603_Kraftringen_Mars_2026_3112109404.pdf),
[april](../Kraftringen/Fakturor/202604_Kraftfringen_April_3126369101.pdf),
[maj](../Kraftringen/Fakturor/202605_Kraftringen_Maj_2026_3141677009.pdf),
[juni](../Kraftringen/Fakturor/202606_Kraftringen_Juni_2026_3154522605.pdf).

Eneas (2026) *Samköp av el* [broschyr, PDF]. Eneas. *Beskriver tjänsten Samköp av el och innehåller inga priser.*
[Broschyren](Eneas%20Samkop%20av%20El%202026.pdf).
