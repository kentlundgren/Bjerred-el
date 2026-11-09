/* manadens_flash_data.js
   Texterna till "Månadens flash" på index.html. Det är den ENDA filen som ändras varje månad.

   SKAPAD 2026-10-09 (version 1.0).

   Så här läggs en ny månad till (se även steg 2k i .cursor/skills/bjerred-manadsrutin/SKILL.md):
     1. Lägg en ny post FÖRST i listan nedan (nyaste först). Sidan visar alltid den första posten som månadens flash,
        och resten ligger i arkivet ("Tidigare månader").
     2. `id` ska vara unikt (ÅÅÅÅ-MM). Webbläsaren använder det för att komma ihåg att besökaren har sett posten.
     3. Skriv för läsaren av sidan (föreningens medlemmar), inte som svar i en chatt. Bara siffror som går att belägga
        ur fakturan eller månadsdatan. Skriv inte orsaker som inte är kända. Nämn inte Eneas priser.
     4. Kontrollräkna varje siffra mot fakturan och data.md innan posten publiceras.

   Fält:
     id         unikt id, ÅÅÅÅ-MM
     manad      visningsnamn, t.ex. "September 2026"
     publicerad datum då flashen lades in, ÅÅÅÅ-MM-DD
     rubrik     en rubrik på cirka 12 ord. Visas i den lilla rutan och som rubrik i arkivet.
     nyckelrad  en rad med en nyckelsiffra. Visas under rubriken i den lilla rutan.
     text       lista med stycken (visas i "Läs mer")
     lar        valfritt: en rad "Bra att veta" (pedagogisk, en sak per månad)
     lank       valfritt: { text: "...", href: "..." } till en sida med mer
     kalla      valfritt: var siffrorna kommer från
*/
window.MANADENS_FLASH = [
  {
    id: '2026-10',
    manad: 'Oktober 2026',
    publicerad: '2026-11-09',
    rubrik: 'Oktober: 19 % dyrare el, nästan samma förbrukning',
    nyckelrad: 'Elbörsens pris steg från 128,09 till 167,41 öre/kWh.',
    text: [
      'Fakturan för oktober blev 74 150 kr mot 62 294 kr i september, alltså 11 856 kr (cirka 19 %) mer.',
      'Förbrukningen var i stort sett oförändrad (21 810 kWh mot 21 689 kWh i september, +0,6 %), så ökningen beror mest på priset: ' +
        'spotpriset på fakturan var 167,41 öre/kWh i oktober mot 128,09 öre/kWh i september.',
      'Från oktober gäller elhandelsavtalet "Rörligt kvartspris" tillsvidare, utan bindningstid. Det fasta påslaget är 2,50 öre/kWh ' +
        '(tidigare 1,70) och en månadsavgift på 47,20 kr exkl. moms har tillkommit (tidigare 0 kr). Tillsammans motsvarar det ' +
        'cirka 300 kr av ökningen, inklusive moms.'
    ],
    lar: 'Ett fast påslag är elhandlarens ersättning per kWh och växer med förbrukningen. En månadsavgift är en fast summa per månad, ' +
         'oavsett hur mycket el som används.',
    lank: { text: 'Spotpris månad för månad', href: 'Spotpris/spotpris.html' },
    kalla: 'Kraftringens fakturor för september och oktober 2026.'
  },
  {
    id: '2026-09',
    manad: 'September 2026',
    publicerad: '2026-10-09',
    rubrik: 'September: 25 % dyrare el, men samma förbrukning',
    nyckelrad: 'Elbörsens pris steg från 83,72 till 128,09 öre/kWh.',
    text: [
      'Fakturan för september blev 62 294 kr mot 49 876 kr i augusti, alltså 12 418 kr (cirka 25 %) mer.',
      'Förbrukningen var i stort sett oförändrad (21 689 kWh mot 21 835 kWh i augusti, −0,7 %), så ökningen beror på priset: ' +
        'spotpriset på fakturan var 128,09 öre/kWh i september mot 83,72 öre/kWh i augusti.'
    ],
    lar: 'Spotpriset är elbörsens pris för elområde SE4. Det är bara en del av fakturan: därtill kommer elhandlarens påslag och rörliga kostnader, ' +
         'nätavgiften (fast och rörlig), energiskatten och moms.',
    lank: { text: 'Spotpris månad för månad', href: 'Spotpris/spotpris.html' },
    kalla: 'Kraftringens fakturor för augusti och september 2026.'
  }
];
