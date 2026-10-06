/*
  enea_hjalp.js
  Gemensamma hjälpfunktioner för sidorna i den här mappen. Ingen data ligger här,
  bara tolkning och formatering.

  Ingen kod med ES2023+ används (vanlig ES2015).

  UPPDATERING 2026-10-06: Utbruten ur enea_jamforelse.js.
*/
(function () {
  'use strict';

  // Tolkar svensk inmatning ("95,5", "95.5", "1 234,5"). Returnerar null om tomt eller ogiltigt.
  function tolka(text) {
    if (text === null || text === undefined) { return null; }
    var s = String(text).replace(/\s/g, '').replace(',', '.');
    if (s === '') { return null; }
    var n = Number(s);
    if (!isFinite(n) || n < 0) { return null; }
    return n;
  }

  // Formaterar tal med mellanslag som tusentalsavgränsare och decimalkomma. Minus skrivs som "-".
  function fmt(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) { return '–'; }
    dec = dec || 0;
    var s = Math.abs(n).toFixed(dec);
    var neg = n < 0 && Number(s) !== 0;
    var delar = s.split('.');
    var heltal = delar[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '-' : '') + heltal + (delar[1] ? ',' + delar[1] : '');
  }

  // Som fmt men med plustecken för positiva tal (skillnader).
  function fmtTecken(n, dec) {
    var t = fmt(n, dec);
    return (n > 0 && t !== '–' && t.charAt(0) !== '-' && Number(Math.abs(n).toFixed(dec || 0)) !== 0) ? '+' + t : t;
  }

  // CSS-klass för skillnader: "pos" = dyrare med Eneas, "neg" = billigare, tom = ingen skillnad.
  function klassForSkillnad(n) {
    if (n === null || n === undefined || !isFinite(n) || Math.abs(n) < 0.5) { return ''; }
    return n > 0 ? 'pos' : 'neg';
  }

  function htmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Teknik-modalen (nedre högra hörnet) är likadan på båda sidorna.
  function kopplaTeknikModal() {
    var overlay = document.getElementById('techOverlay');
    if (!overlay) { return; }
    document.getElementById('techBtn').addEventListener('click', function () { overlay.classList.add('show'); });
    document.getElementById('techClose').addEventListener('click', function () { overlay.classList.remove('show'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) { overlay.classList.remove('show'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { overlay.classList.remove('show'); } });
  }

  window.EneaHjalp = {
    MOMS: 1.25,                              // 25 % moms
    LAGRINGSNYCKEL: 'enea_jamforelse_v1',    // delad lagringsnyckel (samma webbläsare, samma adress)
    MAX_ORE: 1000,                           // rimlighetsgräns för ett pris i öre/kWh
    tolka: tolka,
    fmt: fmt,
    fmtTecken: fmtTecken,
    klassForSkillnad: klassForSkillnad,
    htmlEscape: htmlEscape,
    kopplaTeknikModal: kopplaTeknikModal
  };
})();
