# Startprompt för Cursor – Eneas samköp av el

Klistra in allt under linjen i en ny chatt i Cursor, öppnad i mappen
`Bjerred-el` på din dator. Jobba med lokala filer. Du committar och pushar själv.

---

Du hjälper mig att bygga en jämförelsesida i mappen `Eneas_Samkop_av_El/` i
projektet Bjerred-el (HTML, CSS och JavaScript, inga ramverk, ingen byggprocess).

## Arbetssätt (viktigt)

- Arbeta direkt med de lokala filerna. Skapa inga grenar och inga pull requests.
- Kör inga git-kommandon (add, commit, push). Jag committar och pushar själv i Cursor.
- Håll dig inom mappen `Eneas_Samkop_av_El/`. Ändra inte `index.html` eller andra filer
  utanför mappen utan att fråga.
- Om något är oklart: fråga mig innan du skriver kod eller text.
- Kommentera koden i detalj på svenska. Vid ändringar: `// UPPDATERING ÅÅÅÅ-MM-DD: ...`.
- Dela upp i separata HTML-, CSS- och JS-filer. Gul bakgrund (`#FFF9C4`) på alla inmatningsfält.
- Ingen ES2023+ utan kommentar. PowerShell används, så undvik `&&` i terminalkommandon.
- Källor anges i Harvardformat. Länkar ska vara klickbara och kontrollerade.
- Siffror är hämtade ur fakturor och underlag och är inte kvalitetssäkrade. Skriv det.

## Läs först

1. `CLAUDE.md` i projektets rot.
2. `Eneas_Samkop_av_El/PRD.md` (kravdokumentet, avsnitt 4.3 har rättade belopp).
3. `Eneas_Samkop_av_El/Eneas Samkop av El 2026.pdf` (Eneas broschyr, inga priser).
4. `Kraftringen/Fakturor/` (sex fakturor januari–juni 2026).
5. `Kraftringen/Intern_debitering/` (sex bilder med debiteringsunderlag).

## Uppgift

Bygg en sida där Isak Cerwén (Eneas) kan mata in Eneas priser för januari–juni 2026,
och som visar vad vi hade betalat med Eneas jämfört med Kraftringen.

Inmatningen ska följa samma upplägg som vårt debiteringsunderlag: gula fält, samma
rader, samma ordning. Raden "El inkl Elcert" fylls i med Eneas pris (öre/kWh).

Nyckelfakta:
- Nätavgiften går fortsatt till Kraftringen Nät AB (nätägare). Bara elhandeln jämförs.
- Hyresgästen (restaurangen) debiteras ALDRIG fast nätavgift. Fältet är låst till 0 kr.
- Hyresgästens kWh = total förbrukning − bastu totalt − varmvatten.
- Hyresgästens kostnad = kWh × öre/kWh för rörlig nätavgift, El inkl elcert och
  energiskatt (36,00 öre/kWh), plus 25 % moms, avrundat till hela kronor.
- Kraftringens "El inkl elcert" = spotpris + rörliga kostnader per kWh + 1,70 öre/kWh.
- Resultat som beräkningen ska återskapa (hyresgäst, kr inkl moms):
  jan 37 341, feb 36 647, mar 19 213, apr 17 873, maj 23 521, jun 24 017.
- Hela fakturan från Kraftringen (kr): jan 90 779, feb 82 794, mar 63 389,
  apr 52 186, maj 56 338, jun 53 134.

Databas: Firebase Realtime Database via REST (projektet använder redan
`skylt-e0c45`). Föreslagen ny nod: `bjerred-enea-offert/`. Fråga mig hur Isak ska
logga in innan du bygger skrivningen. Sidan ska ha inbakad fallback-data så att den
fungerar även om databasen inte svarar.

## Första steget

Ställ först dina frågor till mig, särskilt om Eneas prismodell (spot plus påslag,
fast pris eller prissäkring), inloggning för Isak och om jag vill ha nya filer
(`_ver1`) eller uppdatera befintliga. Börja inte koda förrän jag har svarat.
Föreslå därefter en filstruktur och vänta på mitt OK.
