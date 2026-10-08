/*
  intern_debitering.js
  Liten startfil för intern_debitering.html: visar versionen och kopplar knappen "teknik".
  Själva debiteringsunderlaget finns i intern_underlag.js.
  INTERN fil. Den ska inte länkas från eller laddas av Isaks sida (enea_jamforelse.html).

  Gemensamma hjälpfunktioner finns i enea_hjalp.js, som måste laddas före den här filen.
  Ingen kod med ES2023+ används (vanlig ES2015). Inget nätverksanrop görs.

  UPPDATERING 2026-10-06: Första versionen (1.0). Tabellen "Restaurangens andel" lyft hit
  från enea_jamforelse.js. Del 2 i PRD.md (fullständig mall för debiteringsunderlag) byggs
  vidare i intern_underlag.js.
  UPPDATERING 2026-10-08: Tabellen "Restaurangens andel januari–juni 2026" och jämförelsen med
  Eneas priser (beräkning, referensdata, kopiering och utskrift) är borttagna härifrån. De hörde
  inte till debiteringsunderlaget och förvillade. Jämförelsen med Eneas finns kvar i
  enea_jamforelse.js. Versionen är 1.3.
*/
(function () {
  'use strict';

  var H = window.EneaHjalp;

  // UPPDATERING 2026-10-08: version 1.4 (källlänkar för juli–september, tydlig avgränsning av granskningen).
  // Höj versionen och datumet här varje gång en ny månad läggs in (se skillen bjerred-manadsrutin).
  var VERSION = '1.4';
  var VERSIONSDATUM = '2026-10-08';

  function start() {
    document.getElementById('version').textContent = VERSION;
    document.getElementById('versionsdatum').textContent = VERSIONSDATUM;
    H.kopplaTeknikModal();
  }

  start();
})();
