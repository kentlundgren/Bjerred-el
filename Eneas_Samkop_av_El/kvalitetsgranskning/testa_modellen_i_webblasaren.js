/*
  testa_modellen_i_webblasaren.js
  Slumptest av beräkningen på enea_jamforelse.html (tabell 2). Körs genom att klistra in hela filen
  i webbläsarens konsol (F12) medan sidan enea_jamforelse.html är öppen, eller via ett verktyg som
  kör JavaScript på sidan. Rensar localStorage när den är klar.

  Referensdatan nedan är läst ur Kraftringens PDF-fakturor av lasa_fakturor.py (fakturor.json),
  inte skriven för hand. Referensberäkningen använder heltalsaritmetik (BigInt) och är därför
  oberoende av sidans flyttalsberäkning.

  Resultat 2026-10-06: 60 slumpade scenarier, 1 096 kontroller, 0 fel (se KVALITETSGRANSKNING.md).
*/
(function () {
  localStorage.clear();
  var REF = [
    { kwh: 35422.14, fak: 90779, kr: 122.24, nat: 21.87, skatt: 36, fast: 8824 },
    { kwh: 32002.14, fak: 82794, kr: 121.56, nat: 21.84, skatt: 36, fast: 8824 },
    { kwh: 28073.52, fak: 63389, kr: 92.87,  nat: 20.33, skatt: 36, fast: 8824 },
    { kwh: 26671.14, fak: 52186, kr: 68.29,  nat: 19.16, skatt: 36, fast: 8824 },
    { kwh: 23941.02, fak: 56338, kr: 95,     nat: 20.39, skatt: 36, fast: 8824 },
    { kwh: 20609.34, fak: 53134, kr: 106.45, nat: 20.99, skatt: 36, fast: 8824 }
  ];
  var KEYS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
  function g(id) { return document.getElementById(id); }
  function sett(id, v) { var e = g(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
  function num(t) { t = t.replace(/[ \s]/g, '').replace(',', '.'); return (t === '–' || t === '') ? null : Number(t); }

  // Seedad slumpgenerator så att testet kan upprepas med samma resultat
  var s = 20261006;
  function rnd() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }

  // Exakt referens: faktura idag + ((Eneas pris - Kraftringens pris)/100 × kWh + månadsavgift) × 1,25, hela kr
  function exakt(r, pTxt, avgTxt) {
    var p100 = BigInt(Math.round(Number(pTxt.replace(',', '.')) * 100));
    var kr100 = BigInt(Math.round(r.kr * 100));
    var kwh100 = BigInt(Math.round(r.kwh * 100));
    var ac = BigInt(Math.round(avgTxt === '' ? 0 : Number(avgTxt.replace(',', '.')) * 100));
    var D = (p100 - kr100) * kwh100 + ac * 10000n;       // mikrokronor exkl moms
    var tot4 = BigInt(r.fak) * 4000000n + D * 5n;         // × 4 (för 1,25 = 5/4)
    return Number((tot4 + 2000000n) / 4000000n);          // avrundat till hela kronor
  }

  var res = { fall: 0, kontroller: 0, fel: [], maxAvvFranGrunden: 0 };
  function check(n, mån, namn, ok, d) { res.kontroller++; if (!ok) { res.fel.push({ fall: n, mån: mån, namn: namn, d: d }); } }

  for (var n = 0; n < 60; n++) {
    KEYS.forEach(function (k) { sett('ore-' + k, ''); }); sett('avgift', '');
    var antal = 1 + Math.floor(rnd() * 6);
    var valda = KEYS.map(function (k, i) { return i; }).sort(function () { return rnd() - 0.5; }).slice(0, antal).sort();
    var avg = rnd() < 0.5 ? '' : (rnd() < 0.5 ? String(Math.floor(rnd() * 2000)) : (rnd() * 2000).toFixed(2).replace('.', ','));
    sett('avgift', avg);
    var pris = {};
    valda.forEach(function (i) {
      var p = 15 + rnd() * 200;
      pris[i] = rnd() < 0.3 ? String(Math.round(p)) : p.toFixed(2).replace('.', rnd() < 0.5 ? ',' : '.');
      sett('ore-' + KEYS[i], pris[i]);
    });
    res.fall++;
    var sumKwh = 0, sumEn = 0, sumId = 0, sumKwhP = 0;
    valda.forEach(function (i) {
      var r = REF[i], k = KEYS[i];
      var förv = exakt(r, pris[i], avg);
      var vis = num(g('e-fak-' + k).textContent), dkr = num(g('e-dkr-' + k).textContent), dpc = num(g('e-dpc-' + k).textContent);
      check(n, k, 'faktura med Eneas = exakt referens', vis === förv, { vis: vis, förv: förv });
      check(n, k, 'skillnad kr = Eneas - idag', dkr === förv - r.fak, { dkr: dkr, förv: förv });
      check(n, k, 'skillnad % = skillnad / idag', Math.abs(dpc - (förv - r.fak) / r.fak * 100) <= 0.051, { dpc: dpc });
      // Från grunden (utan förankring i fakturans belopp): ska ligga nära. Avvikelsen beror på att
      // Kraftringens öre-priser på fakturan är avrundade till två decimaler.
      var fg = (r.fast + r.kwh * (r.nat + r.skatt + Number(pris[i].replace(',', '.'))) / 100 + (avg === '' ? 0 : Number(avg.replace(',', '.')))) * 1.25;
      var avv = Math.abs(fg - förv); res.maxAvvFranGrunden = Math.max(res.maxAvvFranGrunden, avv);
      check(n, k, 'förankrad modell nära "från grunden" (max 4 kr)', avv <= 4, { fg: fg, förv: förv });
      sumKwh += r.kwh; sumEn += förv; sumId += r.fak; sumKwhP += r.kwh * Number(pris[i].replace(',', '.'));
    });
    var c = Array.prototype.map.call(document.querySelectorAll('#tab-eneas tfoot td'), function (x) { return x.textContent; });
    check(n, '', 'summa kWh', num(c[1]) === Math.round(sumKwh), { vis: c[1] });
    check(n, '', 'summa faktura Eneas', num(c[2]) === sumEn, { vis: c[2], sumEn: sumEn });
    check(n, '', 'vägt snitt öre/kWh', Math.abs(num(c[3]) - sumKwhP / sumKwh) <= 0.0051, { vis: c[3] });
    check(n, '', 'summa skillnad kr', num(c[7]) === sumEn - sumId, { vis: c[7] });
    check(n, '', 'summa skillnad %', Math.abs(num(c[8]) - (sumEn - sumId) / sumId * 100) <= 0.051, { vis: c[8] });
  }

  // Egenskapstester: Eneas pris = Kraftringens pris ger noll i skillnad; ogiltig inmatning ignoreras
  KEYS.forEach(function (k) { sett('ore-' + k, ''); }); sett('avgift', '');
  KEYS.forEach(function (k, i) { sett('ore-' + k, String(REF[i].kr).replace('.', ',')); });
  var likaGerNoll = KEYS.every(function (k) { return num(g('e-dkr-' + k).textContent) === 0; });
  sett('ore-2026-01', 'abc'); var o1 = g('e-fak-2026-01').textContent;
  sett('ore-2026-01', '5000'); var o2 = g('e-fak-2026-01').textContent;
  sett('ore-2026-01', '-5'); var o3 = g('e-fak-2026-01').textContent;
  localStorage.clear();
  return {
    fall: res.fall, kontroller: res.kontroller, antalFel: res.fel.length, fel: res.fel.slice(0, 5),
    maxAvvikelseFranGrundenKr: Number(res.maxAvvFranGrunden.toFixed(2)),
    likaPrisGerNoll: likaGerNoll, ogiltigInmatningGerStreck: [o1, o2, o3]
  };
})();
