/*
  elpris_nov.js
  Logik för Elpris_nov_2026/index.html: ritar två SVG-diagram och räknar fram tabell 1–4 och texterna ur siffrorna nedan.
  Ingen kod med ES2023+ används (vanlig ES2015). Inget nätverksanrop görs, ingenting sparas hos besökaren.

  TILLFÄLLIG analys skapad 2026-11-10 efter tio dagar av november. Uppdateras inte.

  UPPDATERING 2026-11-10: Första versionen (1.0).
  UPPDATERING 2026-11-10: Rekordavsnittet (Tabell 0): jämförelse med augusti 2022 (304,99 öre/kWh i SE4, Elbruk 2022) ersätter notisrutan överst. Version 1.1.
*/
(function () {
  'use strict';

  var VERSION = '1.1';
  var VERSIONSDATUM = '2026-11-10';

  // ===================================================================
  // 1. Indata
  // ===================================================================
  var MANADSNAMN = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'];
  var MANADSNAMN_LANGA = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november'];

  // Spotpris per elområde, öre/kWh, månadsmedel januari–november 2026 (november = dag 1–10). Källa: Elbruk (2026), avläst 2026-11-10.
  var ELBRUK = {
    SE1: [93.91, 98.75, 22.75, 26.09, 50.42, 44.84, 15.83, 38.77, 45.95, 30.53, 32.71],
    SE2: [94.16, 98.46, 21.13, 26.85, 53.25, 43.66, 17.30, 44.15, 51.50, 36.65, 31.32],
    SE3: [108.45, 110.23, 58.66, 56.08, 77.06, 77.98, 53.62, 66.66, 87.33, 82.35, 204.16],
    SE4: [112.99, 113.28, 84.58, 66.55, 94.66, 103.72, 86.44, 80.47, 120.20, 157.30, 328.89]
  };
  // Rekordmånaden augusti 2022 och tvåan december 2022, SE4, öre/kWh. Källa: Elbruk (2022). Ingen annan månad 2021–2026 i elbruks tabeller (SE4) ligger över 190 före november 2026, utom de två.
  var AUG_2022 = 304.99, DEC_2022 = 271.45;
  var NOV_DAGAR_HITTILLS = 10, NOV_DAGAR = 30, OKT_DAGAR = 31;

  // Priser i oktober ur Kraftringens faktura 3219468000 (öre/kWh, utan moms) och moms
  var OKT = { spot: 167.41, rorliga: 4.91, paslag: 2.50, nat: 24.36, skatt: 36.00 };
  var MOMS = 1.25;
  var FASTA_KR_INKL_MOMS = (7980 + 47.20) * MOMS;     // fast nätavgift 7 980 kr/mån + månadsavgift elhandel 47,20 kr/mån, inkl moms

  // Per månad januari–oktober: badets kWh (bastu + varmvatten, ur data.md), inpasseringar (summerade som analyssidan) och priserna
  // per kWh ur fakturorna/debiteringsunderlagen: nät = rörlig nätavgift, el = spot + rörliga + påslag, skatt = energiskatt (öre/kWh, utan moms).
  var MANADER = [
    { m: 0, bad: 18836, inp: 4893, nat: 21.87, el: 122.24, skatt: 36.00 },
    { m: 1, bad: 15660, inp: 3993, nat: 21.84, el: 121.56, skatt: 36.00 },
    { m: 2, bad: 17772, inp: 5402, nat: 20.33, el: 92.87, skatt: 36.00 },
    { m: 3, bad: 15089, inp: 4686, nat: 19.16, el: 68.29, skatt: 36.00 },
    { m: 4, bad: 11511, inp: 4839, nat: 20.39, el: 95.00, skatt: 36.00 },
    { m: 5, bad: 8853, inp: 4219, nat: 20.99, el: 106.45, skatt: 36.00 },
    { m: 6, bad: 10424, inp: 4584, nat: 19.95, el: 86.01, skatt: 36.00 },
    { m: 7, bad: 10526, inp: 5251, nat: 20.17, el: 90.02, skatt: 36.00 },
    { m: 8, bad: 11388, inp: 5243, nat: 22.39, el: 134.59, skatt: 36.00 },
    { m: 9, bad: 12088, inp: 4666, nat: 24.36, el: 174.82, skatt: 36.00 }
  ];
  var OKT_TOTAL_KWH = 21810, OKT_BAD_KWH = 12088;

  // ===================================================================
  // 2. Hjälpfunktioner
  // ===================================================================
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(x, d) {
    if (d === undefined) { d = 2; }
    return x.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmt0(x) { return fmt(Math.round(x), 0); }
  function tecken(x, d) { return (x > 0 ? '+' : (x < 0 ? '−' : '')) + fmt(Math.abs(x), d); }
  function satt(id, t) { var e = el(id); if (e) { e.textContent = t; } }

  // Rörlig kostnad per kWh inklusive moms, öre/kWh
  function rorlig(el_, nat, skatt) { return (el_ + nat + skatt) * MOMS; }

  // ===================================================================
  // 3. Beräkningar
  // ===================================================================
  var spotNov = ELBRUK.SE4[10], spotOkt = ELBRUK.SE4[9];
  var NOV = { spot: spotNov, rorliga: OKT.rorliga, paslag: OKT.paslag, nat: OKT.nat, skatt: OKT.skatt };     // scenario: övrigt som i oktober
  function komponenter(p) {
    var allt = p.spot + p.rorliga + p.paslag, exkl = allt + p.nat + p.skatt;
    return { allt: allt, exkl: exkl, moms: exkl * (MOMS - 1), inkl: exkl * MOMS };
  }
  var kOkt = komponenter(OKT), kNov = komponenter(NOV);

  // Tabell 2: kostnad per badare
  var rader2 = MANADER.map(function (r) {
    var rk = rorlig(r.el, r.nat, r.skatt);
    var kr = r.bad * rk / 100;
    return { m: r.m, bad: r.bad, inp: r.inp, kwhPerBadare: r.bad / r.inp, rk: rk, kr: kr, perBadare: kr / r.inp };
  });
  var summaKr = 0, summaInp = 0, summaBad = 0;
  rader2.forEach(function (r) { summaKr += r.kr; summaInp += r.inp; summaBad += r.bad; });
  var snitt2 = { bad: summaBad, inp: summaInp, kwhPerBadare: summaBad / summaInp, rk: summaKr / summaBad * 100, perBadare: summaKr / summaInp };
  var oktR = rader2[9];
  var novScen = { kwhPerBadare: oktR.kwhPerBadare, rk: kNov.inkl, perBadare: oktR.kwhPerBadare * kNov.inkl / 100 };

  // Tabell 3: hela november om priset ligger kvar
  var kwhDagOkt = OKT_TOTAL_KWH / OKT_DAGAR;
  var t3 = {
    okt: { dagar: OKT_DAGAR, kwh: OKT_TOTAL_KWH, bad: OKT_BAD_KWH, rk: kOkt.inkl },
    nov: { dagar: NOV_DAGAR, kwh: kwhDagOkt * NOV_DAGAR, bad: OKT_BAD_KWH / OKT_DAGAR * NOV_DAGAR, rk: kNov.inkl }
  };
  ['okt', 'nov'].forEach(function (k) {
    var t = t3[k];
    t.rorligKr = t.kwh * t.rk / 100;
    t.totalKr = t.rorligKr + FASTA_KR_INKL_MOMS;
    t.badKr = t.bad * t.rk / 100;
  });
  t3.nov.perBadare = novScen.perBadare;
  t3.okt.perBadare = oktR.perBadare;

  // Hur lågt måste resten av november ligga för att månadsmedlet ska hamna på oktobers nivå?
  var krav = (spotOkt * NOV_DAGAR - spotNov * NOV_DAGAR_HITTILLS) / (NOV_DAGAR - NOV_DAGAR_HITTILLS);

  // Rekordjämförelsen: samma elpris med dagens övriga poster (oktober 2026) och oktobers kWh per badare
  function perPris(spot) {
    var rk = komponenter({ spot: spot, rorliga: OKT.rorliga, paslag: OKT.paslag, nat: OKT.nat, skatt: OKT.skatt }).inkl;
    return { rk: rk, perBadare: oktR.kwhPerBadare * rk / 100 };
  }
  var kravRekord = (AUG_2022 * NOV_DAGAR - spotNov * NOV_DAGAR_HITTILLS) / (NOV_DAGAR - NOV_DAGAR_HITTILLS);
  var snittOmOkt = (spotNov * NOV_DAGAR_HITTILLS + spotOkt * (NOV_DAGAR - NOV_DAGAR_HITTILLS)) / NOV_DAGAR;

  // ===================================================================
  // 4. Diagram (SVG)
  // ===================================================================
  function diagram1() {
    var B = 760, H = 340, l = 46, r = 12, t = 28, b = 44, w = B - l - r, h = H - t - b, max = 350;
    var vals = ELBRUK.SE4, n = vals.length, steg = w / n, bw = steg * 0.62;
    var s = '<svg viewBox="0 0 ' + B + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" focusable="false">';
    [0, 100, 200, 300].forEach(function (v) {
      var y = t + h - v / max * h;
      s += '<line x1="' + l + '" x2="' + (B - r) + '" y1="' + y + '" y2="' + y + '" stroke="#d6dedc"/><text x="' + (l - 6) + '" y="' + (y + 4) + '" font-size="12" fill="#5a6868" text-anchor="end">' + v + '</text>';
    });
    s += '<text x="' + l + '" y="14" font-size="12" fill="#5a6868">öre/kWh, spotpris SE4</text>';
    vals.forEach(function (v, i) {
      var x = l + i * steg + (steg - bw) / 2, bh = v / max * h, y = t + h - bh, nov = (i === 10);
      var namn = nov ? 'November, dag 1–10' : MANADSNAMN_LANGA[i].charAt(0).toUpperCase() + MANADSNAMN_LANGA[i].slice(1);
      s += '<g class="stapel" tabindex="0"><title>' + esc(namn + ': ' + fmt(v) + ' öre/kWh') + '</title>' +
           '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" fill="' + (nov ? '#d9392b' : '#2a7fc4') + '" rx="2"/></g>' +
           '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" font-size="' + (nov ? 14 : 12) + '" font-weight="' + (nov ? 700 : 400) + '" fill="' + (nov ? '#d9392b' : '#1c2a2a') + '" text-anchor="middle">' + fmt(v) + '</text>' +
           '<text x="' + (x + bw / 2) + '" y="' + (t + h + 16) + '" font-size="12" fill="#1c2a2a" text-anchor="middle">' + MANADSNAMN[i] + '</text>';
      if (nov) { s += '<text x="' + (x + bw / 2) + '" y="' + (t + h + 31) + '" font-size="11" fill="#d9392b" text-anchor="middle">dag 1–10</text>'; }
    });
    s += '</svg>';
    el('diagram1').innerHTML = s;
  }

  function diagram2() {
    var omr = ['SE1', 'SE2', 'SE3', 'SE4'], B = 760, H = 220, l = 60, r = 70, t = 10, rad = 44, bh = 30, max = 340, w = B - l - r;
    var s = '<svg viewBox="0 0 ' + B + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" focusable="false">';
    omr.forEach(function (o, i) {
      var v = ELBRUK[o][10], y = t + i * rad, bl = v / max * w, sv4 = (o === 'SE4');
      s += '<text x="' + (l - 10) + '" y="' + (y + bh / 2 + 5) + '" font-size="14" font-weight="' + (sv4 ? 700 : 400) + '" text-anchor="end" fill="#1c2a2a">' + o + '</text>' +
           '<g class="stapel" tabindex="0"><title>' + esc(o + ': ' + fmt(v) + ' öre/kWh, november dag 1–10') + '</title>' +
           '<rect x="' + l + '" y="' + y + '" width="' + bl + '" height="' + bh + '" fill="' + (sv4 ? '#d9392b' : '#2a7fc4') + '" rx="2"/></g>' +
           '<text x="' + (l + bl + 8) + '" y="' + (y + bh / 2 + 5) + '" font-size="14" font-weight="' + (sv4 ? 700 : 400) + '" fill="' + (sv4 ? '#d9392b' : '#1c2a2a') + '">' + fmt(v) + '</text>';
    });
    s += '</svg>';
    el('diagram2').innerHTML = s;
  }

  // ===================================================================
  // 5. Tabeller och texter
  // ===================================================================
  function procent(a, b) { return (b / a - 1) * 100; }

  function tabell0() {
    var rader = [
      ['Augusti 2022 (rekordmånaden)', AUG_2022, perPris(AUG_2022), false],
      ['Oktober 2026', spotOkt, { rk: kOkt.inkl, perBadare: oktR.perBadare }, false],
      ['November 2026, dag 1–10', spotNov, perPris(spotNov), true]
    ];
    document.querySelector('#tab0 thead').innerHTML = '<tr><th>Månad</th><th>Spotpris SE4<br>(öre/kWh)</th><th>Skillnad mot<br>aug 2022 (öre/kWh)</th><th>Hela elpriset med dagens<br>avgifter, inkl. moms (öre/kWh)</th><th>Badets el per<br>badare (kr)</th></tr>';
    document.querySelector('#tab0 tbody').innerHTML = rader.map(function (r) {
      var d = r[1] - AUG_2022;
      return '<tr' + (r[3] ? ' class="scenario"' : '') + '><td>' + esc(r[0]) + '</td><td>' + fmt(r[1]) + '</td><td' + (d > 0.005 ? ' class="upp"' : '') + '>' + (Math.abs(d) < 0.005 ? '–' : tecken(d)) + '</td><td>' + fmt(r[2].rk, 1) + '</td><td>' + fmt(r[2].perBadare) + '</td></tr>';
    }).join('');
    satt('rek-aug', fmt(AUG_2022)); satt('rek-aug2', fmt(AUG_2022)); satt('rek-dec', fmt(DEC_2022)); satt('rek-nov', fmt(spotNov));
    satt('rek-diff', fmt(spotNov - AUG_2022)); satt('rek-pct', tecken(procent(AUG_2022, spotNov), 0));
    satt('rek-okt', fmt(spotOkt)); satt('rek-snitt', fmt(snittOmOkt) + ' öre/kWh'); satt('rek-krav', fmt(kravRekord, 0));
  }

  function tabell1() {
    var rader = [
      ['Spotpris (elbruks snitt för SE4)', OKT.spot, NOV.spot, false, 'Oktober: fakturans spotpris (167,41). November: elbruks 328,89.'],
      ['Rörliga kostnader (elhandlaren)', OKT.rorliga, NOV.rorliga],
      ['Fast påslag (elhandlaren)', OKT.paslag, NOV.paslag],
      ['Allt elpris (spot + rörliga + påslag)', kOkt.allt, kNov.allt, true],
      ['Rörlig nätavgift', OKT.nat, NOV.nat],
      ['Energiskatt', OKT.skatt, NOV.skatt],
      ['Summa utan moms', kOkt.exkl, kNov.exkl, true],
      ['Moms 25 %', kOkt.moms, kNov.moms],
      ['Rörlig kostnad inklusive moms', kOkt.inkl, kNov.inkl, true]
    ];
    var h = '<tr><th>Post</th><th>Oktober<br>(faktura)</th><th>November<br>(scenario)</th><th>Skillnad<br>(öre/kWh)</th><th>Skillnad<br>(%)</th></tr>';
    var b = rader.map(function (r) {
      var d = r[2] - r[1];
      return '<tr' + (r[3] ? ' class="summa"' : '') + '><td>' + esc(r[0]) + '</td><td>' + fmt(r[1]) + '</td><td>' + fmt(r[2]) + '</td><td' + (d > 0.005 ? ' class="upp"' : '') + '>' + (Math.abs(d) < 0.005 ? '–' : tecken(d)) +
             '</td><td>' + (Math.abs(d) < 0.005 ? '–' : tecken(procent(r[1], r[2]), 0)) + '</td></tr>';
    }).join('');
    document.querySelector('#tab1 thead').innerHTML = h;
    document.querySelector('#tab1 tbody').innerHTML = b;
    satt('t1-spotx', fmt(NOV.spot / OKT.spot, 1));
    satt('t1-totx', fmt(kNov.inkl / kOkt.inkl, 1));
  }

  function tabell2() {
    document.querySelector('#tab2 thead').innerHTML = '<tr><th>Månad</th><th>Badets<br>kWh</th><th>Inpasseringar<br>(badare)</th><th>kWh per<br>badare</th><th>Rörlig kostnad<br>inkl. moms<br>(öre/kWh)</th><th>Kostnad per<br>badare (kr)</th></tr>';
    var b = rader2.map(function (r) {
      return '<tr><td>' + MANADSNAMN_LANGA[r.m].charAt(0).toUpperCase() + MANADSNAMN_LANGA[r.m].slice(1) + (r.m === 9 ? ' (preliminärt antal badare)' : '') + '</td><td>' + fmt0(r.bad) + '</td><td>' + fmt0(r.inp) + '</td><td>' + fmt(r.kwhPerBadare) +
             '</td><td>' + fmt(r.rk, 1) + '</td><td>' + fmt(r.perBadare) + '</td></tr>';
    }).join('');
    b += '<tr class="scenario"><td>November, om priset ligger kvar (scenario)</td><td>–</td><td>–</td><td>' + fmt(novScen.kwhPerBadare) + '</td><td>' + fmt(novScen.rk, 1) + '</td><td class="upp">' + fmt(novScen.perBadare) + '</td></tr>';
    document.querySelector('#tab2 tbody').innerHTML = b;
    document.querySelector('#tab2 tfoot').innerHTML = '<tr><td>Januari–oktober, genomsnitt (viktat)</td><td>' + fmt0(snitt2.bad) + '</td><td>' + fmt0(snitt2.inp) + '</td><td>' + fmt(snitt2.kwhPerBadare) + '</td><td>' + fmt(snitt2.rk, 1) + '</td><td>' + fmt(snitt2.perBadare) + '</td></tr>';
    el('pb-text').innerHTML = 'I oktober kostade elen för badet <strong>' + fmt(oktR.perBadare) + ' kr per badare</strong>. Om novembers pris ligger kvar blir det <strong>' + fmt(novScen.perBadare) + ' kr</strong>, alltså ' +
      fmt(novScen.perBadare / oktR.perBadare, 1) + ' gånger oktober och ' + fmt(novScen.perBadare / snitt2.perBadare, 1) + ' gånger genomsnittet för året hittills (' + fmt(snitt2.perBadare) + ' kr). ' +
      'Kostnaden per badare följer både priset och hur mycket el som går åt per badare, och det varierar också: ' + fmt(rader2[0].kwhPerBadare) + ' kWh per badare i januari och ' + fmt(rader2[7].kwhPerBadare) + ' i augusti. ' +
      'Genomsnittet är viktat: summan av kostnaderna delad på summan av badarna.';
  }

  function tabell3() {
    var o = t3.okt, n = t3.nov;
    function rad(namn, a, b, d, sum) {
      d = d || 0;
      return '<tr' + (sum ? ' class="summa"' : '') + '><td>' + esc(namn) + '</td><td>' + fmt(a, d) + '</td><td>' + fmt(b, d) + '</td><td>' + (Math.abs(b - a) < 0.005 ? '–' : tecken(b - a, d)) + '</td></tr>';
    }
    document.querySelector('#tab3 thead').innerHTML = '<tr><th>Post</th><th>Oktober<br>(faktiskt)</th><th>November<br>(scenario)</th><th>Skillnad</th></tr>';
    document.querySelector('#tab3 tbody').innerHTML =
      rad('Antal dagar', o.dagar, n.dagar) +
      rad('Hela anläggningens förbrukning (kWh)', o.kwh, n.kwh) +
      rad('varav badet (kWh)', o.bad, n.bad) +
      rad('Rörlig kostnad, hela anläggningen, inkl. moms (kr)', o.rorligKr, n.rorligKr) +
      rad('Fasta avgifter inkl. moms (kr)', FASTA_KR_INKL_MOMS, FASTA_KR_INKL_MOMS) +
      rad('Summa elfaktura (kr)', o.totalKr, n.totalKr, 0, true) +
      rad('varav badets rörliga el (kr)', o.badKr, n.badKr) +
      rad('Badets rörliga el per badare (kr)', o.perBadare, n.perBadare, 2);
    // Heltalsvisning för kr och kWh (rad() skriver två decimaler bara när d = 2)
    var diffTot = n.totalKr - o.totalKr;
    el('t3-text').innerHTML = 'Oktoberfakturan var <strong>74 150 kr</strong> (räknad ovan: ' + fmt0(o.totalKr) + ' kr). Om elpriset ligger kvar på novembernivån hela månaden blir en elfaktura med samma förbrukning per dag ungefär <strong>' +
      fmt0(Math.round(n.totalKr / 100) * 100) + ' kr</strong>, alltså cirka ' + fmt0(Math.round(diffTot / 100) * 100) + ' kr mer (' + tecken(procent(o.totalKr, n.totalKr), 0) + ' %). Av ökningen hör cirka ' +
      fmt0(Math.round((n.badKr - o.badKr) / 100) * 100) + ' kr till badets el. De fasta avgifterna ändras inte med priset. Det här är ett räkneexempel och ingen förutsägelse.';
  }

  function tabell4() {
    var omr = ['SE1', 'SE2', 'SE3', 'SE4'];
    document.querySelector('#tab4 thead').innerHTML = '<tr><th>Månad</th>' + omr.map(function (o) { return '<th>' + o + '</th>'; }).join('') + '</tr>';
    var b = '';
    for (var i = 0; i < 11; i++) {
      b += '<tr' + (i === 10 ? ' class="scenario"' : '') + '><td>' + MANADSNAMN_LANGA[i].charAt(0).toUpperCase() + MANADSNAMN_LANGA[i].slice(1) + (i === 10 ? ' (dag 1–10)' : '') + '</td>' +
           omr.map(function (o) { return '<td>' + fmt(ELBRUK[o][i]) + '</td>'; }).join('') + '</tr>';
    }
    document.querySelector('#tab4 tbody').innerHTML = b;
  }

  function nyckeltal() {
    satt('kvot', '×' + fmt(spotNov / spotOkt, 1));
    satt('kvot-text', tecken(spotNov - spotOkt) + ' öre/kWh (' + tecken(procent(spotOkt, spotNov), 0) + ' %)');
    satt('krav', fmt(krav, 1));
    satt('rk-okt', fmt(kOkt.inkl, 0));
    satt('rk-nov', fmt(kNov.inkl, 0));
    satt('pb-nov', fmt(novScen.perBadare, 0));
    satt('pb-okt', fmt(oktR.perBadare));
    satt('pb-snitt', fmt(snitt2.perBadare));
    satt('x-norr', fmt(ELBRUK.SE4[10] / ELBRUK.SE1[10], 0));
  }

  // ===================================================================
  // 6. Teknik-modal och start
  // ===================================================================
  function modal() {
    var m = el('techModal'), b = el('techBtn'), c = el('techClose');
    function oppna() { m.classList.add('show'); }
    function stang() { m.classList.remove('show'); }
    b.addEventListener('click', oppna);
    c.addEventListener('click', stang);
    m.addEventListener('click', function (e) { if (e.target === m) { stang(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { stang(); } });
  }

  function start() {
    satt('version', VERSION);
    satt('versionsdatum', VERSIONSDATUM);
    diagram1(); diagram2(); tabell0(); tabell1(); tabell2(); tabell3(); tabell4(); nyckeltal(); modal();
  }

  start();
})();
