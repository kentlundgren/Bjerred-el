/*
  alternativ.js
  Liten logik för alternativ.html: (1) kolumnrubriker som etiketter i kort-läget på smal skärm,
  (2) förklaringar vid hovring, fokus och tryck, (3) teknik-modalen (EneasHjalp, enea_hjalp.js).
  Ingen data och ingen server. Vanlig ES2015, ingen ES2023+.

  UPPDATERING 2026-11-06: Första versionen (1.0).
  UPPDATERING 2026-11-06: Versionen delas av alternativ.html och sammanfattning.html. Version 1.1: sammanfattningssidan, växlare, Tabell 5 och Diagram 2 (påslag över spot),
  fråga F18, brödsmulor och delningsbild (og) på sammanfattningen.
  UPPDATERING 2026-11-06: länkar till Spotpris-sidan (sammanfattningen och "Vad jag vet om priset"). Version 1.2.
  UPPDATERING 2026-11-06: korsreferenser ("Se också") till Spotpris-sidan i brödsmulorna (dokument.json, nyckeln se_ocksa). Version 1.3.
*/
(function () {
  'use strict';

  var VERSION = '1.3';
  var VERSIONSDATUM = '2026-11-06';

  // (1) Varje td får en data-label från tabellens kolumnrubrik (används av CSS på smal skärm).
  function sattEtiketter() {
    var tabeller = document.querySelectorAll('table.rt');
    Array.prototype.forEach.call(tabeller, function (tabell) {
      var rubriker = Array.prototype.map.call(tabell.querySelectorAll('thead th'), function (th) {
        return th.textContent.trim();
      });
      Array.prototype.forEach.call(tabell.querySelectorAll('tbody tr'), function (rad) {
        Array.prototype.forEach.call(rad.children, function (cell, i) {
          if (cell.tagName === 'TD' && rubriker[i]) { cell.setAttribute('data-label', rubriker[i]); }
        });
      });
    });
  }

  // (2) Förklaringar: position fixed, hålls innanför skärmen. Fungerar med mus, tangentbord och tryck.
  function doljAlla() {
    Array.prototype.forEach.call(document.querySelectorAll('.term-text'), function (t) { t.style.display = ''; });
  }
  function visa(term) {
    var tip = term.querySelector('.term-text');
    if (!tip) { return; }
    doljAlla();
    tip.style.display = 'block';
    var w = tip.offsetWidth;
    var r = term.getBoundingClientRect();
    var vänster = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    tip.style.left = vänster + 'px';
    tip.style.top = (r.bottom + 4) + 'px';
  }
  function kopplaForklaringar() {
    Array.prototype.forEach.call(document.querySelectorAll('.term'), function (term) {
      term.addEventListener('mouseenter', function () { visa(term); });
      term.addEventListener('mouseleave', doljAlla);
      term.addEventListener('focus', function () { visa(term); });
      term.addEventListener('blur', doljAlla);
      term.addEventListener('click', function (e) { e.stopPropagation(); visa(term); });
    });
    document.addEventListener('click', doljAlla);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { doljAlla(); } });
    window.addEventListener('scroll', doljAlla, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    sattEtiketter();
    kopplaForklaringar();
    if (window.EneaHjalp) { window.EneaHjalp.kopplaTeknikModal(); }
    document.getElementById('version').textContent = VERSION;
    document.getElementById('versionsdatum').textContent = VERSIONSDATUM;
  });
})();
