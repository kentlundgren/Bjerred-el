/*
  spotpris.js
  Logik för spotpris.html: läser window.SPOTPRIS (data/spotpris_data.js, skapad av berakna_spotpris.py), ritar tabeller och
  diagram (SVG, egen kod) och hanterar inmatningen av Eneas pris, kopiering och utskrift.

  Sidan räknar inte själv spotpriser eller modellen. Det enda som räknas här är skillnaderna i tabell 2 och viktade snitt.
  Ingen kod med ES2023+ används (vanlig ES2015). Inget nätverksanrop görs.

  UPPDATERING 2026-10-07: Första versionen (1.0).
*/
(function () {
  'use strict';

  var VERSION = '1.0';
  var VERSIONSDATUM = '2026-10-07';
  var LAGRING = 'spotpris_v1';                    // egen lagringsnyckel för Eneas pris (bara i den här webbläsaren)
  var LAGRING_JAMFORELSE = 'enea_jamforelse_v1';  // jämförelsesidans nyckel; läses (aldrig skrivs) om fältet här är tomt

  var D = window.SPOTPRIS;
  if (!D) {
    document.querySelector('main').insertAdjacentHTML('afterbegin',
      '<p class="notis"><strong>Datafilen data/spotpris_data.js kunde inte läsas.</strong> Kör berakna_spotpris.py och ladda om sidan.</p>');
    return;
  }

  var MAN = Object.keys(D.manadsnitt).sort();
  var KORT = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Maj', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dec' };
  var LANG = { '01': 'Januari', '02': 'Februari', '03': 'Mars', '04': 'April', '05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'Augusti', '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December' };
  function kort(m) { return KORT[m.slice(5, 7)]; }
  function lang(m) { return LANG[m.slice(5, 7)]; }
  var FARGER = ['#2a7fc4', '#6c8ea4', '#2a9d8f', '#e76f51', '#8e6bbf', '#a3261b'];   // en färg per månad (inte gult)

  // ---------------------------------------------------------------------------------------------------------
  // Hjälpfunktioner: tolkning och formatering
  // ---------------------------------------------------------------------------------------------------------
  function tolka(t) {
    if (t === null || t === undefined) { return null; }
    var s = String(t).replace(/\s/g, '').replace(',', '.');
    if (s === '') { return null; }
    var n = Number(s);
    return (isFinite(n) && n >= 0 && n <= 1000) ? n : null;
  }
  function fmt(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) { return '–'; }
    dec = (dec === undefined) ? 2 : dec;
    var s = Math.abs(n).toFixed(dec);
    var neg = n < 0 && Number(s) !== 0;
    var d = s.split('.');
    return (neg ? '-' : '') + d[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d[1] ? ',' + d[1] : '');
  }
  function fmtT(n, dec) {                        // med plustecken för positiva tal (skillnader)
    var t = fmt(n, dec);
    return (n > 0 && t !== '–' && Number(Math.abs(n).toFixed(dec === undefined ? 2 : dec)) !== 0) ? '+' + t : t;
  }
  function klass(n) { return (n === null || !isFinite(n) || Math.abs(n) < 0.005) ? '' : (n > 0 ? 'pos' : 'neg'); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function maxAbs(lista) { var m = 0; lista.forEach(function (x) { if (x !== null && isFinite(x)) { m = Math.max(m, Math.abs(x)); } }); return m; }
  function el(id) { return document.getElementById(id); }

  // ---------------------------------------------------------------------------------------------------------
  // Tillstånd: Eneas pris (bara i den här webbläsaren)
  // ---------------------------------------------------------------------------------------------------------
  var eneas = {};          // månad -> text som den skrevs
  var hamtatFranJamforelse = false;
  var facit = {};          // UPPDATERING 2026-10-07: månad -> {spot, rorliga} (text) som fakturorna för blindprovet (tabell 3)

  function lasEneas() {
    try {
      var s = localStorage.getItem(LAGRING);
      if (s) {
        var o = JSON.parse(s);
        if (o && o.eneas && typeof o.eneas === 'object') { eneas = o.eneas; }
        if (o && o.facit && typeof o.facit === 'object') { facit = o.facit; }
      }
      // Tomma månader fylls (utan att skrivas) från jämförelsesidans inmatning, om den finns i samma webbläsare.
      var j = localStorage.getItem(LAGRING_JAMFORELSE);
      if (j) {
        var oj = JSON.parse(j);
        if (oj && oj.ore && typeof oj.ore === 'object') {
          MAN.forEach(function (m) {
            if ((eneas[m] === undefined || eneas[m] === '') && oj.ore[m]) { eneas[m] = oj.ore[m]; hamtatFranJamforelse = true; }
          });
        }
      }
    } catch (e) { /* lagring blockerad: sidan fungerar ändå */ }
  }
  function sparaEneas() {
    try { localStorage.setItem(LAGRING, JSON.stringify({ eneas: eneas, facit: facit })); } catch (e) { /* ignoreras */ }
  }
  function eneasVarde(m) { return tolka(eneas[m]); }

  // ---------------------------------------------------------------------------------------------------------
  // Förklaringens slutsats (räknas ur datan)
  // ---------------------------------------------------------------------------------------------------------
  function renderForklaring() {
    var mellan = 0;
    MAN.forEach(function (m) {
      var v = D.manadsnitt[m], lo = Math.min(v.m1_ore, v.m2_ore), hi = Math.max(v.m1_ore, v.m2_ore);
      if (v.faktura.spot_ore >= lo && v.faktura.spot_ore <= hi) { mellan += 1; }
    });
    var f1 = MAN.map(function (m) { return D.manadsnitt[m].m1_ore - D.manadsnitt[m].faktura.spot_ore; });
    var f2 = MAN.map(function (m) { return D.manadsnitt[m].m2_ore - D.manadsnitt[m].faktura.spot_ore; });
    el('forklaring-slutsats').innerHTML = 'Fakturans spotpris ligger mellan M1 och M2 i ' + mellan + ' av ' + MAN.length + ' månader. Ingen av de enkla metoderna träffar fakturan: M1 avviker med upp till ' +
      fmt(maxAbs(f1)) + ' och M2 med upp till ' + fmt(maxAbs(f2)) + ' öre/kWh. Fakturan är viktad mot den verkliga förbrukningen. Därför uppskattas förbrukningens fördelning över dygnet (M4b).';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Tabell 1
  // ---------------------------------------------------------------------------------------------------------
  function td(t, k) { return '<td' + (k ? ' class="' + k + '"' : '') + '>' + t + '</td>'; }

  function renderTabell1() {
    var h = '', fm1 = [], fm2 = [], fm4 = [];
    MAN.forEach(function (m) {
      var v = D.manadsnitt[m], fak = v.faktura.spot_ore;
      var e1 = v.m1_ore - fak, e2 = v.m2_ore - fak, e4 = v.m4b.fel_ore;
      fm1.push(e1); fm2.push(e2); fm4.push(e4);
      h += '<tr>' + td(esc(lang(m))) + td(fmt(v.antal_intervall, 0)) + td(fmt(v.antal_negativa, 0)) + td(fmt(v.lagsta_ore)) + td(fmt(v.hogsta_ore)) +
           td(fmt(v.m1_ore)) + td(fmt(v.m2_ore)) + td(fmt(v.m4a.varde_ore)) + td(fmt(v.m4b.varde_ore), 'm4b') + td(fmt(fak)) +
           td(fmtT(e1), klass(e1)) + td(fmtT(e2), klass(e2)) + td(fmtT(e4), 'm4b ' + klass(e4)) + '</tr>';
    });
    document.querySelector('#tab-1 tbody').innerHTML = h;
    document.querySelector('#tab-1 tfoot').innerHTML = '<tr>' + td('Största fel') + td('') + td('') + td('') + td('') + td('') + td('') + td('') + td('') + td('') +
      td(fmt(maxAbs(fm1))) + td(fmt(maxAbs(fm2))) + td(fmt(maxAbs(fm4))) + '</tr>';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Tabell 2 (inmatning av Eneas pris)
  // ---------------------------------------------------------------------------------------------------------
  function byggTabell2() {
    var h = '';
    MAN.forEach(function (m) {
      var f = D.manadsnitt[m].faktura;
      h += '<tr>' + td(esc(lang(m))) + td(fmt(f.spot_ore)) + td(fmt(f.rorliga_ore)) + td(fmt(f.paslag_ore)) + td(fmt(f.allt_elpris_ore)) +
           td(fmt(f.allt_elpris_ore - f.spot_ore)) +
           '<td><input type="text" inputmode="decimal" autocomplete="off" class="gul" id="eneas-' + m + '" data-m="' + m + '" aria-label="Eneas allt elpris öre/kWh, ' + esc(lang(m)) + '"></td>' +
           '<td id="e-spot-' + m + '"></td><td id="e-kr-' + m + '"></td></tr>';
    });
    document.querySelector('#tab-2 tbody').innerHTML = h;
    MAN.forEach(function (m) { el('eneas-' + m).value = eneas[m] || ''; });
  }

  function viktat(varde) {                       // snitt över månader vägt med kWh (huvudmätare); varde(m) kan ge null
    var s = 0, w = 0;
    MAN.forEach(function (m) { var v = varde(m); if (v !== null && v !== undefined && isFinite(v)) { var k = D.kraftringen[m].kwh_huvud; s += v * k; w += k; } });
    return w > 0 ? s / w : null;
  }

  function uppdateraTabell2() {
    var fyllda = 0;
    MAN.forEach(function (m) {
      var f = D.manadsnitt[m].faktura, e = eneasVarde(m), c1 = el('e-spot-' + m), c2 = el('e-kr-' + m);
      if (e !== null) { fyllda += 1; }
      c1.textContent = e === null ? '–' : fmtT(e - f.spot_ore);
      c1.className = e === null ? '' : klass(e - f.spot_ore);
      c2.textContent = e === null ? '–' : fmtT(e - f.allt_elpris_ore);
      c2.className = e === null ? '' : klass(e - f.allt_elpris_ore);
      var inp = el('eneas-' + m);
      var v = inp.value.trim();
      inp.classList.toggle('ogiltig', v !== '' && tolka(v) === null);
    });
    var vf = function (g) { return viktat(function (m) { return g(D.manadsnitt[m].faktura); }); };
    var eneasFyllda = function (g) { return viktat(function (m) { var e = eneasVarde(m); return e === null ? null : g(e, D.manadsnitt[m].faktura); }); };
    var ejAlla = fyllda > 0 && fyllda < MAN.length;
    document.querySelector('#tab-2 tfoot').innerHTML = '<tr>' + td('Snitt, vägt med kWh') + td(fmt(vf(function (f) { return f.spot_ore; }))) + td(fmt(vf(function (f) { return f.rorliga_ore; }))) +
      td(fmt(vf(function (f) { return f.paslag_ore; }))) + td(fmt(vf(function (f) { return f.allt_elpris_ore; }))) + td(fmt(vf(function (f) { return f.allt_elpris_ore - f.spot_ore; }))) +
      td(fyllda ? fmt(eneasFyllda(function (e) { return e; })) : '–') +
      td(fyllda ? fmtT(eneasFyllda(function (e, f) { return e - f.spot_ore; })) : '–') +
      td(fyllda ? fmtT(eneasFyllda(function (e, f) { return e - f.allt_elpris_ore; })) : '–') + '</tr>';
    var not = hamtatFranJamforelse ? 'Några fält är förifyllda från jämförelsesidans inmatning i den här webbläsaren. ' : '';
    el('tab-2-not').textContent = not + (fyllda === 0 ? 'Fyll i Eneas allt elpris för att se skillnaderna.' :
      (ejAlla ? 'Eneas snitt gäller de ' + fyllda + ' av ' + MAN.length + ' månader som är ifyllda; Kraftringens snitt gäller alla månader.' : ''));
  }

  // ---------------------------------------------------------------------------------------------------------
  // Tabell 3: förutsagt mot faktura (januari-juni anpassade, juli-september blindprov)
  // ---------------------------------------------------------------------------------------------------------
  var F = window.FORUTSAGELSE;
  var FAST = 1.70;       // fast påslag, öre/kWh (enligt fakturorna)

  function byggTabell3() {
    var sek = el('sektion-tabell3');
    if (!F) { sek.style.display = 'none'; return; }
    var h = '';
    MAN.forEach(function (m) {
      h += '<tr id="t3-' + m + '">' + td(esc(lang(m))) + '<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    });
    Object.keys(F.manader).sort().forEach(function (m) {
      h += '<tr id="t3-' + m + '">' + td(esc(lang(m)) + ' <span class="metod uppskattning">blindprov</span>') + td(fmt(F.manader[m].m4b_ore)) +
           td(fmt(F.manader[m].spann_min_ore) + '–' + fmt(F.manader[m].spann_max_ore)) +
           '<td><input type="text" inputmode="decimal" autocomplete="off" class="gul" data-f="spot" data-m="' + m + '" aria-label="Fakturans spotpris öre/kWh, ' + esc(lang(m)) + '"></td>' +
           '<td id="t3-fel-' + m + '">–</td>' +
           td(fmt(F.rorliga.snitt_ore) + ' <span class="liten">(' + fmt(F.rorliga.min_ore) + '–' + fmt(F.rorliga.max_ore) + ')</span>') +
           '<td><input type="text" inputmode="decimal" autocomplete="off" class="gul" data-f="rorliga" data-m="' + m + '" aria-label="Fakturans rörliga kostnader öre/kWh, ' + esc(lang(m)) + '"></td>' +
           td(fmt(F.manader[m].m4b_ore + F.rorliga.snitt_ore + FAST)) +
           '<td id="t3-allt-' + m + '">–</td><td id="t3-feliallt-' + m + '">–</td></tr>';
    });
    document.querySelector('#tab-3 tbody').innerHTML = h;
    // Januari-juni: värdena finns redan (modellen anpassades på dem), inga inmatningsfält
    MAN.forEach(function (m) {
      var v = D.manadsnitt[m], c = el('t3-' + m).children, f = v.faktura;
      c[1].textContent = fmt(v.m4b.varde_ore);
      c[2].textContent = 'anpassad';
      c[3].textContent = fmt(f.spot_ore);
      c[4].textContent = fmtT(v.m4b.fel_ore); c[4].className = klass(v.m4b.fel_ore);
      c[5].textContent = '–';
      c[6].textContent = fmt(f.rorliga_ore);
      c[7].textContent = fmt(v.m4b.varde_ore + f.rorliga_ore + FAST);
      c[8].textContent = fmt(f.allt_elpris_ore);
      var fa = v.m4b.varde_ore + f.rorliga_ore + FAST - f.allt_elpris_ore;
      c[9].textContent = fmtT(fa); c[9].className = klass(fa);
    });
    Object.keys(F.manader).forEach(function (m) {
      var f = facit[m] || {}, ff = (F.facit || {})[m] || {};
      // Inmatat värde går före; annars fakturans värde ur data/facit_jul_sep.json (UPPDATERING 2026-10-07)
      var standard = { spot: ff.spot_ore, rorliga: ff.rorliga_ore };
      Array.prototype.forEach.call(document.querySelectorAll('#t3-' + m + ' input'), function (i) {
        var k = i.getAttribute('data-f');
        i.value = f[k] || (standard[k] !== undefined ? String(standard[k]).replace('.', ',') : '');
      });
    });
    uppdateraTabell3();
  }

  function uppdateraTabell3() {
    if (!F) { return; }
    var kompletta = 0, stor = 0;
    Object.keys(F.manader).forEach(function (m) {
      var spot = tolka(document.querySelector('#t3-' + m + ' input[data-f="spot"]').value), rl = tolka(document.querySelector('#t3-' + m + ' input[data-f="rorliga"]').value), p = F.manader[m].m4b_ore;
      var cf = el('t3-fel-' + m), ca = el('t3-allt-' + m), cfa = el('t3-feliallt-' + m);
      cf.textContent = spot === null ? '–' : fmtT(p - spot); cf.className = spot === null ? '' : klass(p - spot);
      if (spot !== null) { kompletta += 1; stor = Math.max(stor, Math.abs(p - spot)); }
      if (spot !== null && rl !== null) {
        var allt = spot + rl + FAST, fa = p + F.rorliga.snitt_ore + FAST - allt;
        ca.textContent = fmt(allt); cfa.textContent = fmtT(fa); cfa.className = klass(fa);
      } else { ca.textContent = '–'; cfa.textContent = '–'; cfa.className = ''; }
      Array.prototype.forEach.call(document.querySelectorAll('#t3-' + m + ' input'), function (i) { i.classList.toggle('ogiltig', i.value.trim() !== '' && tolka(i.value) === null); });
    });
    var grans = D.m4b.primar.kriterier.leave_one_out.grans;
    el('tab-3-not').textContent = 'Förutsägelserna gjordes innan fakturorna lästes in (' + F.metadata.gjord + '). Spannet kommer av osäkerheten i uppdelningen mellan bastu och varmvatten och av de alternativa antagandena. ' +
      'Rörliga kostnader förutsägs inte av någon modell: de är det vägda snittet av januari–juni (' + fmt(F.rorliga.snitt_ore) + ', spann ' + fmt(F.rorliga.min_ore) + '–' + fmt(F.rorliga.max_ore) + '). ' +
      'Sommarens öppettider är antagna lika som januari–juni och är inte kontrollerade. ' +
      (kompletta === 0 ? 'Fyll i fakturans spotpris för att se felen. Gräns att jämföra med: ' + fmt(grans, 1) + ' öre/kWh (leave-one-out).' :
        'Största fel i spotpriset hittills: ' + fmt(stor) + ' öre/kWh (gräns ' + fmt(grans, 1) + ').');
    renderBlindprov();
  }

  // ---------------------------------------------------------------------------------------------------------
  // Analys av blindprovet (UPPDATERING 2026-10-07)
  // ---------------------------------------------------------------------------------------------------------
  function rmsAv(l) { return l.length ? Math.sqrt(l.reduce(function (a, x) { return a + x * x; }, 0) / l.length) : null; }
  function tecken(x) { return x > 0 ? '+' : (x < 0 ? '−' : '0'); }
  function lag1(l) {                              // korrelation mellan varje fel och nästa månads fel (autokorrelation, fördröjning 1)
    if (l.length < 4) { return null; }
    var a = l.slice(0, -1), b = l.slice(1), ma = a.reduce(function (s, x) { return s + x; }, 0) / a.length, mb = b.reduce(function (s, x) { return s + x; }, 0) / b.length, sab = 0, saa = 0, sbb = 0;
    for (var i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); }
    return (saa > 0 && sbb > 0) ? sab / Math.sqrt(saa * sbb) : null;
  }

  function renderBlindprov() {
    if (!F) { return; }
    var rader = [], h = '';
    Object.keys(F.manader).sort().forEach(function (m) {
      var spot = tolka(document.querySelector('#t3-' + m + ' input[data-f="spot"]').value), d = F.manader[m];
      if (spot === null) { return; }
      var r = { m: m, spot: spot, m1: d.m1_ore, m2: d.m2_ore, m4: d.m4b_ore, i: spot >= d.spann_min_ore && spot <= d.spann_max_ore };
      rader.push(r);
      h += '<tr>' + td(esc(lang(m))) + td(fmt(spot)) + td(fmt(r.m1)) + td(fmt(r.m2)) + td(fmt(r.m4), 'm4b') + td(fmtT(r.m1 - spot), klass(r.m1 - spot)) + td(fmtT(r.m2 - spot), klass(r.m2 - spot)) +
           td(fmtT(r.m4 - spot), 'm4b ' + klass(r.m4 - spot)) + td(r.i ? 'ja' : 'nej') + '</tr>';
    });
    document.querySelector('#tab-blind tbody').innerHTML = h;
    var e = function (g) { return rader.map(g); };
    document.querySelector('#tab-blind tfoot').innerHTML = rader.length ?
      '<tr>' + td('RMS') + td('') + td('') + td('') + td('') + td(fmt(rmsAv(e(function (r) { return r.m1 - r.spot; })))) + td(fmt(rmsAv(e(function (r) { return r.m2 - r.spot; })))) +
      td(fmt(rmsAv(e(function (r) { return r.m4 - r.spot; })))) + td('') + '</tr>' : '';

    // Felets tecken i tur och ordning: januari-juni (anpassningen) och sedan blindprovet
    var felFit = MAN.map(function (m) { return D.manadsnitt[m].m4b.fel_ore; });
    var fel = felFit.concat(e(function (r) { return r.m4 - r.spot; }));
    var namn = MAN.map(kort).concat(e(function (r) { return kort(r.m); }));
    var rf = lag1(fel), rmsFit = rmsAv(felFit);
    var m2fel = MAN.map(function (m) { return D.manadsnitt[m].m2_ore - D.manadsnitt[m].faktura.spot_ore; });
    var m1fel = MAN.map(function (m) { return D.manadsnitt[m].m1_ore - D.manadsnitt[m].faktura.spot_ore; });
    var grans = D.m4b.primar.kriterier.leave_one_out.grans;
    var s = '';
    if (!rader.length) {
      s = '<p>Fyll i fakturans spotpris i tabell 3 för att se hur blindprovet gick.</p>';
    } else {
      var rm4 = rmsAv(e(function (r) { return r.m4 - r.spot; })), rm2 = rmsAv(e(function (r) { return r.m2 - r.spot; })), rm1 = rmsAv(e(function (r) { return r.m1 - r.spot; }));
      var utanfor = rader.filter(function (r) { return !r.i; }).length;
      var inom = rader.filter(function (r) { return Math.abs(r.m4 - r.spot) <= grans; }).length;
      s = '<div class="notis"><p><strong>Blindprovet (' + rader.length + ' månader): RMS-fel M4b ' + fmt(rm4) + ', M2 ' + fmt(rm2) + ' och M1 ' + fmt(rm1) + ' öre/kWh.</strong> På januari–juni, där M4b anpassades, var RMS-felet ' + fmt(rmsFit) +
          ' för M4b, ' + fmt(rmsAv(m2fel)) + ' för M2 och ' + fmt(rmsAv(m1fel)) + ' för M1. M4b blev alltså sämre utanför anpassningen, och ' + inom + ' av ' + rader.length + ' månader låg inom leave-one-out-gränsen ' + fmt(grans, 1) + ' öre/kWh. ' +
          'Spannet för M4b täckte inte utfallet i ' + utanfor + ' av ' + rader.length + ' månader, så det var för smalt.</p>' +
          '<p>Med så få månader säger siffrorna lite. M2 hade fel på upp till ' + fmt(maxAbs(m2fel)) + ' öre/kWh på januari–juni men träffade bäst i blindprovet, så ett bra utfall under en enstaka månad bevisar inte att en metod är bättre.</p></div>';
      s += '<h3>Går felet växelvis plus och minus?</h3><p>Felets tecken i tur och ordning (M4b): ' + namn.map(function (n, i) { return n + ' ' + tecken(fel[i]); }).join(', ') + '. ' +
           (rf === null ? '' : 'Samband mellan ett fel och nästa månads fel (autokorrelation, fördröjning 1): ' + fmt(rf) + '. Med ' + (fel.length - 1) + ' par krävs ett värde utanför cirka ±0,75 för att skiljas från slumpen (5 %-nivå, standardtabell för korrelation). ' +
           (Math.abs(rf) < 0.75 ? 'Det är inte uppnått, så det går inte att säga att felen växlar systematiskt. ' + (Math.abs(rf) > 0.6 ? 'Värdet ligger dock nära gränsen och talar för att det kan finnas ett växlande mönster, främst i de senaste månaderna. ' : '') : 'Det är uppnått. ') +
           'Med så få månader går det inte att avgöra om det är ett mönster eller slump.') + '</p>';
      var mek = rader.map(function (r) {
        return lang(r.m) + ': dagtidspriset (M2) ligger ' + fmt(Math.abs(r.m2 - r.m1), 1) + ' öre ' + (r.m2 < r.m1 ? 'under' : 'över') + ' dygnssnittet (M1), fakturan ' + fmt(Math.abs(r.spot - r.m1), 1) + ' öre ' + (r.spot < r.m1 ? 'under' : 'över') +
               ' och M4b ' + fmt(Math.abs(r.m4 - r.m1), 1) + ' öre ' + (r.m4 < r.m1 ? 'under' : 'över') + '.';
      });
      s += '<h3>En möjlig gemensam orsak: M4b följer prisformen för svagt</h3><p>' + mek.join(' ') + ' ' +
           'Fakturan rör sig alltså åt samma håll som dagtidspriset, men mer än M4b. Därför blir felet positivt när dagtid är billigare än dygnet och negativt när dagtid är dyrare: tecknet följer månadens prisform (dagtid mot dygn) och inte kalendern. ' +
           'Förbrukningen verkar i sommarmånaderna ligga mer på dagtid än modellen antar. Det är en tolkning av två månader och inget bevis.</p>';
    }
    document.getElementById('blindprov-sammanfattning').innerHTML = s;

    // Förutsägelse inför september, nedskriven innan fakturan; blir ett test när september fylls i
    var sep = F.manader['2026-09'], inpSep = document.querySelector('#t3-2026-09 input[data-f="spot"]'), spotSep = inpSep ? tolka(inpSep.value) : null;
    var hyp = '';
    if (sep) {
      hyp = '<h3>Förutsägelse inför september (nedskriven 2026-10-07, före fakturan)</h3><p>September: M4b ' + fmt(sep.m4b_ore) + ', M2 ' + fmt(sep.m2_ore) + ', M1 ' + fmt(sep.m1_ore) + ' öre/kWh. ' +
        'Om tolkningen ovan stämmer hamnar fakturans spotpris <strong>över M4b</strong>, närmare M2 (fel för M4b negativt). Är det slump blir tecknet ungefär lika ofta positivt som negativt. Ett utfall säger lite, men testet är nedskrivet innan svaret.</p>';
      if (spotSep !== null) {
        hyp += '<p><strong>Utfall:</strong> fakturans spotpris ' + fmt(spotSep) + ', fel för M4b ' + fmtT(sep.m4b_ore - spotSep) + ', fel för M2 ' + fmtT(sep.m2_ore - spotSep) + '. ' +
               (spotSep > sep.m4b_ore ? 'Utfallet hamnade över M4b, som förutsagt.' : 'Utfallet hamnade inte över M4b, så tolkningen fick inget stöd.') + '</p>';
      }
    }
    document.getElementById('blindprov-analys').innerHTML = hyp;

    // Vilken baslast hade passat varje månad (efterhandsanalys ur data/forutsagelse_data.js)
    var av = F.analys_v || [], t = '';
    av.forEach(function (a) {
      t += '<tr>' + td(esc(lang(a.manad))) + td(fmt(a.V_vald_kw, 0)) + td(fmtT(a.fel_vid_vald_V_ore), klass(a.fel_vid_vald_V_ore)) + td(fmt(a.V_bast_kw, 1)) +
           td(Math.abs(a.kvarstaende_fel_ore) < 0.05 ? '0,00' : fmtT(a.kvarstaende_fel_ore)) + '</tr>';
    });
    document.querySelector('#tab-v tbody').innerHTML = t;
    forklara(document.querySelector('main'));
    el('tab-v-not').textContent = av.length ?'Efterhandsanalys, inte en ny anpassning: vilken jämn baslast V (ventilation och värme) som hade gett bästa träff i varje månad med övriga antaganden oförändrade. ' +
      'Det bästa V hoppar mellan månaderna och följer inte årstiden, så en lägre baslast på sommaren förklarar inte felen. I augusti går det inte att nå fakturan ens med största möjliga V, eftersom restens energi då tar slut. ' +
      'Uppdelningen av bad i bastu och varmvatten för juli–augusti är antagen (23 % varmvatten).' : '';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Diagram (SVG, egen kod)
  // ---------------------------------------------------------------------------------------------------------
  function niceMax(v) { var s = v <= 100 ? 20 : 50; return Math.ceil(v / s) * s; }

  /* Linjediagram. serier: [{namn, varden:[...], farg, streck, tjocklek}], etiketter: x-etiketter (en per värde). */
  function linjediagram(etiketter, serier, ymin, ymax, ytitel) {
    var W = 900, H = 340, L = 56, R = 16, T = 16, B = 40, pw = W - L - R, ph = H - T - B, n = etiketter.length;
    var o = ['<svg class="diagram" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ytitel) + '">'];
    var X = function (i) { return L + (n === 1 ? pw / 2 : i * pw / (n - 1)); };
    var Y = function (v) { return T + ph - (v - ymin) / (ymax - ymin) * ph; };
    var steg = (ymax - ymin) / 5;
    for (var k = 0; k <= 5; k++) {
      var v = ymin + k * steg, y = Y(v);
      o.push('<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#e3e8e7"/><text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="12" fill="#5a6868">' + fmt(v, 0) + '</text>');
    }
    etiketter.forEach(function (e, i) { o.push('<text x="' + X(i).toFixed(1) + '" y="' + (H - 18) + '" text-anchor="middle" font-size="12" fill="#5a6868">' + esc(e) + '</text>'); });
    o.push('<text x="12" y="' + (T + ph / 2) + '" transform="rotate(-90 12 ' + (T + ph / 2) + ')" text-anchor="middle" font-size="12" fill="#5a6868">' + esc(ytitel) + '</text>');
    serier.forEach(function (s) {
      var pts = [];
      s.varden.forEach(function (val, i) { if (val !== null && isFinite(val)) { pts.push([X(i), Y(val)]); } });
      if (pts.length > 1) {
        o.push('<polyline fill="none" stroke="' + s.farg + '" stroke-width="' + (s.tjocklek || 2) + '"' + (s.streck ? ' stroke-dasharray="' + s.streck + '"' : '') +
               ' points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');
      }
      if (s.punkter !== false) { pts.forEach(function (p) { o.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" fill="' + s.farg + '"/>'); }); }
    });
    o.push('<rect x="' + L + '" y="' + T + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#9aa6a5"/></svg>');
    return o.join('');
  }
  function teckenforklaring(poster) {
    return poster.map(function (p) { return '<span style="--c:' + p[1] + '">' + esc(p[0]) + '</span>'; }).join('');
  }

  function renderDiagramManad() {
    var M = function (g) { return MAN.map(function (m) { return g(D.manadsnitt[m]); }); };
    var serier = [
      { namn: 'M1 dygnet runt', varden: M(function (v) { return v.m1_ore; }), farg: '#6c8ea4', streck: '5 4' },
      { namn: 'M2 kl. 06–22', varden: M(function (v) { return v.m2_ore; }), farg: '#8e6bbf', streck: '5 4' },
      { namn: 'M4b uppskattad', varden: M(function (v) { return v.m4b.varde_ore; }), farg: '#e76f51' },
      { namn: 'Fakturans spotpris', varden: M(function (v) { return v.faktura.spot_ore; }), farg: '#1c2a2a', tjocklek: 3 },
      { namn: 'Kraftringens allt elpris', varden: M(function (v) { return v.faktura.allt_elpris_ore; }), farg: '#2a9d8f' }
    ];
    var harEneas = MAN.some(function (m) { return eneasVarde(m) !== null; });
    if (harEneas) { serier.push({ namn: 'Eneas allt elpris', varden: MAN.map(function (m) { return eneasVarde(m); }), farg: '#2a7fc4', tjocklek: 2.5 }); }
    var alla = [];
    serier.forEach(function (s) { s.varden.forEach(function (v) { if (v !== null) { alla.push(v); } }); });
    el('diagram-manad').innerHTML = linjediagram(MAN.map(lang), serier, 0, niceMax(Math.max.apply(null, alla)), 'öre/kWh');
    el('tf-manad').innerHTML = teckenforklaring(serier.map(function (s) { return [s.namn, s.farg]; }));
  }

  function renderDiagramTimme() {
    var h = [];
    for (var i = 0; i < 24; i++) { h.push(('0' + i).slice(-2)); }
    var serier = MAN.map(function (m, i) { return { namn: lang(m), varden: D.manadsnitt[m].timprofil_ore, farg: FARGER[i % FARGER.length], tjocklek: 2, punkter: false }; });
    var alla = [];
    serier.forEach(function (s) { s.varden.forEach(function (v) { alla.push(v); }); });
    el('diagram-timme').innerHTML = linjediagram(h, serier, 0, niceMax(Math.max.apply(null, alla)), 'öre/kWh (klockslag, lokal tid)');
    el('tf-timme').innerHTML = teckenforklaring(serier.map(function (s) { return [s.namn, s.farg]; }));
  }

  // Effektkurva: en ruta per månad, staplade delar (trappsteg), grått band och en linje för summan.
  var EFFEKT_FARGER = { baslast: '#6c8ea4', varmvatten: '#2a9d8f', bastu: '#e76f51', drift: '#8e6bbf' };
  var EFFEKT_NAMN = { baslast: 'Ventilation/baslast', varmvatten: 'Varmvatten', bastu: 'Bastu', drift: 'Restaurang (drift)' };

  function effektRuta(m, e, ymax) {
    var W = 360, H = 250, L = 38, R = 8, T = 30, B = 26, pw = W - L - R, ph = H - T - B;
    var X = function (h) { return L + h / 24 * pw; }, Y = function (v) { return T + ph - v / ymax * ph; };
    var steg = function (varden) { var p = []; for (var h = 0; h < 24; h++) { p.push([X(h), Y(varden[h])], [X(h + 1), Y(varden[h])]); } return p; };
    var punkter = function (p) { return p.map(function (a) { return a[0].toFixed(1) + ',' + a[1].toFixed(1); }).join(' '); };
    var topp = 0, tid = 0;
    for (var h = 0; h < 24; h++) { if (e.summa[h] > topp) { topp = e.summa[h]; tid = h; } }
    var o = ['<svg class="diagram" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Uppskattad effektkurva ' + esc(lang(m)) + '">'];
    o.push('<text x="' + L + '" y="18" font-size="13" font-weight="700" fill="#1c2a2a">' + esc(lang(m)) + ' (medel ' + fmt(e.medeleffekt_kw, 0) + ' kW, topp ' + fmt(topp, 0) + ' kW kl. ' + ('0' + tid).slice(-2) + ')</text>');
    for (var v = 0; v <= ymax; v += 20) { var y = Y(v); o.push('<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#e3e8e7"/><text x="' + (L - 5) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#5a6868">' + v + '</text>'); }
    for (var t = 0; t <= 24; t += 3) { o.push('<text x="' + X(t).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#5a6868">' + ('0' + t).slice(-2) + '</text>'); }
    // band: övre kant framåt, nedre kant bakåt
    var band = steg(e.hogsta).concat(steg(e.lagsta).reverse());
    o.push('<polygon points="' + punkter(band) + '" fill="#c9cfcf" opacity="0.7"/>');
    var bas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    ['baslast', 'varmvatten', 'bastu', 'drift'].forEach(function (k) {
      var ny = bas.map(function (b0, i) { return b0 + e.delar[k][i]; });
      o.push('<polygon points="' + punkter(steg(ny).concat(steg(bas).reverse())) + '" fill="' + EFFEKT_FARGER[k] + '" opacity="0.85"/>');
      bas = ny;
    });
    o.push('<polyline fill="none" stroke="#1c2a2a" stroke-width="1.5" points="' + punkter(steg(e.summa)) + '"/>');
    o.push('<rect x="' + L + '" y="' + T + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#9aa6a5"/></svg>');
    return o.join('');
  }

  function renderEffekt() {
    var val = document.querySelector('input[name="effekt-val"]:checked').value;
    var data = D.effekt[val];
    var ymax = 0;
    MAN.forEach(function (m) { data[m].hogsta.forEach(function (v) { ymax = Math.max(ymax, v); }); });
    ymax = Math.ceil(ymax / 20) * 20;
    el('effekt-rutor').innerHTML = MAN.map(function (m) { return '<figure>' + effektRuta(m, data[m], ymax) + '</figure>'; }).join('');
    el('tf-effekt').innerHTML = teckenforklaring([['Ventilation/baslast', EFFEKT_FARGER.baslast], ['Varmvatten', EFFEKT_FARGER.varmvatten], ['Bastu', EFFEKT_FARGER.bastu],
      ['Restaurang (drift)', EFFEKT_FARGER.drift], ['Alternativa passningar (band)', '#c9cfcf'], ['Summa', '#1c2a2a']]);
    var r = D.m4b[val];
    el('effekt-not').textContent = D.effekt.markning + '. Bandet visar ' + r.antal_i_band + ' alternativa kombinationer som passar fakturan nästan lika bra (RMS högst 1,5 öre/kWh). ' +
      'Tidpunkten och höjden på toppen följer av antagandena (bland annat öppettiderna) och är inget som har mätts. ' +
      'Abonnemanget är 200 A, vilket för 3-fas 400 V motsvarar högst cirka 139 kW (en övre gräns, inte en uppgift om förbrukningen).';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Noggrannhet
  // ---------------------------------------------------------------------------------------------------------
  function renderNoggrannhet() {
    var r = D.m4b.primar, u = r.u1, p = u.parametrar, loo = r.leave_one_out, k = r.kriterier, k2 = D.m4b.kanslighet;
    var f12 = [];
    MAN.forEach(function (m) { f12.push(D.manadsnitt[m].m1_ore - D.manadsnitt[m].faktura.spot_ore); f12.push(D.manadsnitt[m].m2_ore - D.manadsnitt[m].faktura.spot_ore); });
    var ja = function (b) { return b ? 'uppfylld' : 'ej uppfylld'; };
    el('noggrannhet-text').innerHTML =
      '<div class="notis"><p><strong>Uppskattningen av månadens spotpris för vår förbrukning stämmer inom cirka ' + fmt(Math.ceil(u.storsta_absolutfel * 2) / 2, 1) + ' öre/kWh per månad mot fakturan, och inom cirka ' +
      fmt(Math.ceil(loo.storsta_absolutfel * 2) / 2, 1) + ' öre/kWh när en månad förutsägs utan att ingå i anpassningen.</strong> Det är en uppskattning och inte en mätning. ' +
      'Till jämförelse avviker M1 och M2 med upp till ' + fmt(maxAbs(f12), 1) + ' öre/kWh.</p></div>' +
      '<p>Valda antaganden (det urval som passar fakturan bäst): bastun öppnar ' + esc(p.bo) + ' och slås på ' + fmt(p.pre_timmar, 1) + ' timme före, restaurangens förberedelse är ' + fmt(p.prep_timmar, 0) +
      ' timmar, varmvattnet ' + (p.varm === '24h' ? 'går dygnet runt' : 'följer bastuns och restaurangens tider') + ' och den jämna baslasten är ' + fmt(p.V_kw, 0) + ' kW. RMS-felet är ' + fmt(u.rms) + ' öre/kWh. ' +
      r.antal_giltiga + ' av ' + r.antal_kombinationer + ' kombinationer är giltiga, ' + r.antal_i_band + ' passar nästan lika bra (RMS högst 1,5) och ' + r.antal_med_storsta_fel_max_2 +
      ' har ett största fel på högst 2 öre/kWh. <strong>Profilen är alltså inte entydig.</strong></p>' +
      '<p>Gränserna är ' + fmt(k.passning.grans, 1) + ' öre/kWh för passningen och ' + fmt(k.leave_one_out.grans, 1) + ' för leave-one-out (Kent, 2026-10-07). De sattes efter att utfallet var känt, så de är ett skydd mot försämring och inte ett bevis. ' +
      'Passning: <strong>' + ja(k.passning.uppfyllt) + '</strong> (' + fmt(k.passning.utfall) + '). Leave-one-out: <strong>' + ja(k.leave_one_out.uppfyllt) + '</strong> (' + fmt(k.leave_one_out.utfall) + '). ' +
      'Om bastun i stället slås på 0–6 timmar före öppning (känslighetskörningen) blir RMS-felet ' + fmt(k2.u1.rms) + ' och största leave-one-out-fel ' + fmt(k2.leave_one_out.storsta_absolutfel) + ' öre/kWh, och ' +
      (k2.leave_one_out.antal_saknas ? k2.leave_one_out.antal_saknas + ' månad (mars) går inte att förutsäga. ' : 'alla månader går att förutsäga. ') +
      'Beviset kommer först när förbrukning per kvart finns och M4b kan jämföras mot det förbrukningsviktade snittet (M3).</p>' +
      '<p><strong>Blindprov (UPPDATERING 2026-10-07):</strong> juli och augusti förutsades innan fakturorna lästes in. Felen blev större än på de månader som anpassningen gjordes på, och spannet var för smalt. ' +
      'Se <a href="#Blindprov">analysen av blindprovet</a>.</p>';
    var h = '';
    MAN.forEach(function (m) {
      var l = loo.fel_per_manad[m];
      h += '<tr>' + td(esc(lang(m))) + td(fmtT(u.fel_per_manad[m]), klass(u.fel_per_manad[m])) + td(typeof l === 'number' ? fmtT(l) : 'saknas', typeof l === 'number' ? klass(l) : '') + '</tr>';
    });
    document.querySelector('#tab-noggrannhet tbody').innerHTML = h;
    el('noggrannhet-not').textContent = 'Fel i öre/kWh = modellens värde minus fakturans spotpris. Leave-one-out: antagandena väljs på de andra månaderna och används för att förutsäga den utelämnade.';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Kopiera tabellerna (HTML + text) och skriv ut
  // ---------------------------------------------------------------------------------------------------------
  var C = 'border:1px solid #999;padding:4px 8px;text-align:right;font-family:Arial,sans-serif;font-size:13px;';
  var CV = 'border:1px solid #999;padding:4px 8px;text-align:left;font-family:Arial,sans-serif;font-size:13px;';
  var HD = 'border:1px solid #999;padding:4px 8px;text-align:right;background:#eee;font-family:Arial,sans-serif;font-size:13px;';
  var HV = 'border:1px solid #999;padding:4px 8px;text-align:left;background:#eee;font-family:Arial,sans-serif;font-size:13px;';

  function tabellKopia(rubrik, huvud, rader) {
    var html = '<p style="font-family:Arial,sans-serif;font-size:14px;margin:12px 0 4px;"><b>' + esc(rubrik) + '</b></p><table style="border-collapse:collapse;"><thead><tr>';
    huvud.forEach(function (x, i) { html += '<th style="' + (i === 0 ? HV : HD) + '">' + esc(x) + '</th>'; });
    html += '</tr></thead><tbody>';
    var text = rubrik + '\n' + huvud.join('\t') + '\n';
    rader.forEach(function (r) {
      html += '<tr>' + r.map(function (c, i) { return '<td style="' + (i === 0 ? CV : C) + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
      text += r.join('\t') + '\n';
    });
    return { html: html + '</tbody></table>', text: text + '\n' };
  }

  function byggKopia() {
    var rader1 = MAN.map(function (m) {
      var v = D.manadsnitt[m], f = v.faktura.spot_ore;
      return [lang(m), fmt(v.m1_ore), fmt(v.m2_ore), fmt(v.m4a.varde_ore), fmt(v.m4b.varde_ore) + ' (uppskattning)', fmt(f), fmtT(v.m1_ore - f), fmtT(v.m2_ore - f), fmtT(v.m4b.fel_ore)];
    });
    var t1 = tabellKopia('Tabell 1. Spotpris per månad, SE4 (öre/kWh, utan moms)',
      ['Månad', 'M1 dygnet runt', 'M2 06–22', 'M4a antagen', 'M4b uppskattad', 'Fakturans spotpris', 'Fel M1', 'Fel M2', 'Fel M4b'], rader1);
    var rader2 = MAN.map(function (m) {
      var f = D.manadsnitt[m].faktura, e = eneasVarde(m);
      return [lang(m), fmt(f.spot_ore), fmt(f.rorliga_ore), fmt(f.paslag_ore), fmt(f.allt_elpris_ore), fmt(f.allt_elpris_ore - f.spot_ore),
              e === null ? '–' : fmt(e), e === null ? '–' : fmtT(e - f.spot_ore), e === null ? '–' : fmtT(e - f.allt_elpris_ore)];
    });
    var t2 = tabellKopia('Tabell 2. Kraftringens och Eneas pris i förhållande till spotpriset (öre/kWh, utan moms)',
      ['Månad', 'Spotpris (fakturan)', 'Rörliga kostnader', 'Fast påslag', 'Kraftringens allt elpris', 'Kraftringens tillägg över spot', 'Eneas allt elpris', 'Eneas minus spot', 'Eneas minus Kraftringen'], rader2);
    var not = 'Spotpriser för SE4 från elprisetjustnu.se (utan moms, tillägg och skatter) och Kraftringens poster ur fakturorna. M4b är en uppskattning, inte en mätning. ' +
      'Siffrorna är inte granskade i en tvåstegsgranskning. Kontrollera mot källan innan något återges. Sammanställd av Kent Lundgren. Version ' + VERSION + ', ' + VERSIONSDATUM + '.';
    return { html: '<div style="font-family:Arial,sans-serif;"><p style="font-size:16px;"><b>Spotpris månad för månad, januari–juni 2026</b></p>' + t1.html + t2.html +
             '<p style="font-size:12px;color:#555;">' + esc(not) + '</p></div>', text: 'Spotpris månad för månad, januari–juni 2026\n\n' + t1.text + t2.text + not + '\n' };
  }

  function meddelande(t) {
    var e = el('meddelande');
    e.textContent = t;
    window.clearTimeout(meddelande.timer);
    meddelande.timer = window.setTimeout(function () { e.textContent = ''; }, 6000);
  }

  function kopieraReserv(k) {
    var d = document.createElement('div');
    d.innerHTML = k.html; d.style.position = 'fixed'; d.style.left = '-10000px';
    document.body.appendChild(d);
    var r = document.createRange(); r.selectNodeContents(d);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    s.removeAllRanges(); document.body.removeChild(d);
    return ok;
  }

  function kopiera() {
    var k = byggKopia();
    var klart = function () { meddelande('Tabellerna är kopierade. Klistra in dem i ett mejl.'); };
    var misslyckad = function () { meddelande('Kopieringen misslyckades. Markera tabellerna och kopiera med Ctrl+C.'); };
    if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
      var item = new ClipboardItem({ 'text/html': new Blob([k.html], { type: 'text/html' }), 'text/plain': new Blob([k.text], { type: 'text/plain' }) });
      navigator.clipboard.write([item]).then(klart).catch(function () { (kopieraReserv(k) ? klart : misslyckad)(); });
    } else { (kopieraReserv(k) ? klart : misslyckad)(); }
  }

  // ---------------------------------------------------------------------------------------------------------
  // Ordförklaringar (UPPDATERING 2026-10-07): fackord får en prickad understrykning och en förklaring vid pekning, fokus eller tryck.
  // Regeln (Kent): förklara förkortningar och facktermer, även där de visas i löptext som skapas av skriptet.
  // ---------------------------------------------------------------------------------------------------------
  var ORD = [
    { re: /RMS/, text: 'RMS (kvadratiskt medelfel, engelska root mean square): man kvadrerar varje månads fel, tar medelvärdet och drar roten ur. Det ger ett typiskt fel i öre/kWh där stora fel väger tyngre än små. RMS 1,35 betyder ungefär 1,35 öre/kWh i typiskt fel.' },
    { re: /leave-one-out/, text: 'Leave-one-out (utelämna en i taget): en månad hålls utanför, antagandena väljs på de andra månaderna och används för att förutsäga den utelämnade. Det är ett ärligare test än passningen, där månaden själv fått styra valet.' },
    { re: /autokorrelation/, text: 'Autokorrelation: samband mellan varje månads fel och nästa månads fel. Nära −1 betyder att felen växlar plus och minus, nära 0 betyder inget samband och nära +1 betyder att felen fortsätter åt samma håll.' },
    { re: /[Bb]lindprov(?:et)?/, text: 'Blindprov: en förutsägelse som gjordes och sparades innan facit (fakturans värde) lästes in, så att utfallet inte kunnat påverka den.' }
  ];
  var ORD_RE = new RegExp(ORD.map(function (o) { return '(' + o.re.source + ')'; }).join('|'), 'g');

  function forklara(rot) {
    var noder = [], w = document.createTreeWalker(rot, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) {
      var f = n.parentNode;
      if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|ABBR|CODE|PRE|A)$/.test(f.nodeName) || f.closest('.modal-overlay')) { continue; }
      ORD_RE.lastIndex = 0;
      if (ORD_RE.test(n.nodeValue)) { noder.push(n); }
    }
    noder.forEach(function (nod) {
      var frag = document.createDocumentFragment(), text = nod.nodeValue, siste = 0, m;
      ORD_RE.lastIndex = 0;
      while ((m = ORD_RE.exec(text))) {
        var i = 0;
        while (i < ORD.length && m[i + 1] === undefined) { i += 1; }
        frag.appendChild(document.createTextNode(text.slice(siste, m.index)));
        var a = document.createElement('abbr');
        a.className = 'ord'; a.tabIndex = 0; a.setAttribute('data-forklaring', ORD[i].text); a.textContent = m[0];
        frag.appendChild(a);
        siste = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(text.slice(siste)));
      nod.parentNode.replaceChild(frag, nod);
    });
  }

  var ruta = null;
  function visaRuta(a) {
    if (!ruta) { ruta = document.createElement('div'); ruta.className = 'ordruta'; ruta.setAttribute('role', 'tooltip'); document.body.appendChild(ruta); }
    ruta.textContent = a.getAttribute('data-forklaring');
    ruta.style.display = 'block';
    var r = a.getBoundingClientRect(), bredd = Math.min(320, window.innerWidth - 32);
    ruta.style.width = bredd + 'px';
    ruta.style.left = Math.max(16, Math.min(r.left, window.innerWidth - bredd - 16)) + 'px';
    var hojd = ruta.offsetHeight;
    ruta.style.top = (r.bottom + 8 + hojd > window.innerHeight && r.top - 8 - hojd > 0 ? r.top - 8 - hojd : r.bottom + 8) + 'px';
  }
  function doljRuta() { if (ruta) { ruta.style.display = 'none'; } }
  function ordHandelser() {
    var rot = document.querySelector('main');
    ['mouseover', 'focusin'].forEach(function (h) { rot.addEventListener(h, function (e) { if (e.target.classList && e.target.classList.contains('ord')) { visaRuta(e.target); } }); });
    ['mouseout', 'focusout'].forEach(function (h) { rot.addEventListener(h, function (e) { if (e.target.classList && e.target.classList.contains('ord')) { doljRuta(); } }); });
    rot.addEventListener('click', function (e) { if (e.target.classList && e.target.classList.contains('ord')) { visaRuta(e.target); } else { doljRuta(); } });   // tryck på pekskärm
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { doljRuta(); } });
  }

  // ---------------------------------------------------------------------------------------------------------
  // Start och händelser
  // ---------------------------------------------------------------------------------------------------------
  function start() {
    el('version').textContent = VERSION;
    el('versionsdatum').textContent = VERSIONSDATUM;
    el('datadatum').textContent = D.metadata.genererad;
    lasEneas();
    renderForklaring();
    renderTabell1();
    byggTabell2();
    uppdateraTabell2();
    byggTabell3();
    renderDiagramManad();
    renderDiagramTimme();
    renderEffekt();
    renderNoggrannhet();

    el('tab-3').addEventListener('input', function (e) {
      var m = e.target && e.target.getAttribute && e.target.getAttribute('data-m'), f = e.target.getAttribute('data-f');
      if (!m || !f) { return; }
      facit[m] = facit[m] || {};
      facit[m][f] = e.target.value;
      sparaEneas();
      uppdateraTabell3();
    });

    el('tab-2').addEventListener('input', function (e) {
      var m = e.target && e.target.getAttribute && e.target.getAttribute('data-m');
      if (!m) { return; }
      eneas[m] = e.target.value;
      sparaEneas();
      uppdateraTabell2();
      renderDiagramManad();
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="effekt-val"]'), function (r) { r.addEventListener('change', renderEffekt); });
    forklara(document.querySelector('main'));
    ordHandelser();
    el('btn-kopiera').addEventListener('click', kopiera);
    el('btn-skriv').addEventListener('click', function () { window.print(); });

    // Teknik-modal: knapp, stängknapp, klick utanför och Escape
    var ov = el('techOverlay');
    el('techBtn').addEventListener('click', function () { ov.classList.add('show'); });
    el('techClose').addEventListener('click', function () { ov.classList.remove('show'); });
    ov.addEventListener('click', function (e) { if (e.target === ov) { ov.classList.remove('show'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ov.classList.remove('show'); } });
  }

  start();
})();
