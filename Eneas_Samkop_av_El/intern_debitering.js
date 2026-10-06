/*
  intern_debitering.js
  Logik för intern_debitering.html: restaurangens (hyresgästens) andel idag och med Eneas priser.
  INTERN fil. Den ska inte länkas från eller laddas av Isaks sida (enea_jamforelse.html).

  Gemensamma hjälpfunktioner finns i enea_hjalp.js, som måste laddas före den här filen.
  Ingen kod med ES2023+ används (vanlig ES2015). Inget nätverksanrop görs.

  UPPDATERING 2026-10-06: Första versionen (1.0). Tabellen "Restaurangens andel" lyft hit
  från enea_jamforelse.js. Del 2 i PRD.md (fullständig mall för debiteringsunderlag) byggs
  vidare här.
*/
(function () {
  'use strict';

  var H = window.EneaHjalp;
  var tolka = H.tolka, fmt = H.fmt, fmtTecken = H.fmtTecken;
  var klassForSkillnad = H.klassForSkillnad, htmlEscape = H.htmlEscape;
  var MOMS = H.MOMS, LAGRINGSNYCKEL = H.LAGRINGSNYCKEL, MAX_ORE = H.MAX_ORE;

  var VERSION = '1.2';
  var VERSIONSDATUM = '2026-10-06';

  // ===================================================================
  // Referensdata: restaurangens andel januari–juni 2026
  //   krOre = Kraftringens "El inkl elcert" (öre/kWh), samma värden som i enea_jamforelse.js.
  //   hgKwh = restaurangens kWh = total - bastu - varmvatten (debiteringsunderlagen).
  //   hgKr  = restaurangens debiterade belopp inkl moms, hela kronor. Fast nätavgift ingår
  //           aldrig (PRD 4.3, beslut 2026-10-06), så april–juni är de rättade beloppen.
  //   Källa: Kraftringens fakturor och Bjerreds Saltsjöbads debiteringsunderlag. Granskad 2026-10-06 (tvåstegsgranskning, se kvalitetsgranskning.html).
  // ===================================================================
  var MANADER = [
    { key: '2026-01', namn: 'Jan', krOre: 122.24, hgKwh: 16586, hgKr: 37341 },
    { key: '2026-02', namn: 'Feb', krOre: 121.56, hgKwh: 16342, hgKr: 36647 },
    { key: '2026-03', namn: 'Mar', krOre: 92.87,  hgKwh: 10302, hgKr: 19213 },
    { key: '2026-04', namn: 'Apr', krOre: 68.29,  hgKwh: 11582, hgKr: 17873 },
    { key: '2026-05', namn: 'Maj', krOre: 95.00,  hgKwh: 12430, hgKr: 23521 },
    // UPPDATERING 2026-10-06: juni använder 11 755 kWh (inte bildens 11 756), så att jämförelsen och
    // debiteringsunderlaget (intern_underlag.js) räknar med samma kWh. Underlaget räknar från bildens
    // avrundade mätarställningar (bastu 7 431 i stället för 7 430). Bildens värde är 11 756. Ändra tillbaka
    // här om du hellre vill följa bilden (granskning 2, avsnitt 6 punkt 1).
    { key: '2026-06', namn: 'Jun', krOre: 106.45, hgKwh: 11755, hgKr: 24017 }
  ];

  // Det som är inmatat (Eneas priser som text, delas med enea_jamforelse.html)
  var ore = {};

  // ---------------------------------------------------------------
  // Beräkning
  // ---------------------------------------------------------------
  function berakna() {
    var rader = [];
    var tot = { kwhAlla: 0, idagAlla: 0, antal: 0, kwhIfyllda: 0, idagIfyllda: 0, eneas: 0 };
    MANADER.forEach(function (m) {
      var p = tolka(ore[m.key]);
      if (p !== null && p > MAX_ORE) { p = null; }
      var rad = { m: m, p: p, eneas: null, diff: null };
      tot.kwhAlla += m.hgKwh;
      tot.idagAlla += m.hgKr;
      if (p !== null) {
        // Bara prisskillnaden på elen räknas om; nät och energiskatt är oförändrade och fast avgift är 0.
        rad.eneas = Math.round(m.hgKr + (p - m.krOre) / 100 * m.hgKwh * MOMS);
        rad.diff = rad.eneas - m.hgKr;
        tot.antal += 1;
        tot.kwhIfyllda += m.hgKwh;
        tot.idagIfyllda += m.hgKr;
        tot.eneas += rad.eneas;
      }
      rader.push(rad);
    });
    tot.diff = tot.antal ? tot.eneas - tot.idagIfyllda : null;
    return { rader: rader, tot: tot };
  }

  function td(text, klass, id) {
    return '<td' + (klass ? ' class="' + klass + '"' : '') + (id ? ' id="' + id + '"' : '') + '>' + text + '</td>';
  }

  function byggTabell() {
    var r = '';
    MANADER.forEach(function (m) {
      r += '<tr>' + td(m.namn) + td(fmt(m.hgKwh)) + td(fmt(m.hgKr)) + td(fmt(m.krOre, 2)) +
           '<td><input type="text" inputmode="decimal" autocomplete="off" class="gul" data-key="' + m.key +
           '" id="ore-' + m.key + '" aria-label="Eneas El inkl elcert öre/kWh, ' + m.namn + '"></td>' +
           td('', null, 'h-eneas-' + m.key) + td('', null, 'h-diff-' + m.key) + '</tr>';
    });
    document.querySelector('#tab-hg tbody').innerHTML = r;
  }

  function satt(id, text, klass) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.textContent = text;
    if (klass !== undefined) { el.className = klass; }
  }

  function uppdatera() {
    var b = berakna(), t = b.tot;
    b.rader.forEach(function (r) {
      satt('h-eneas-' + r.m.key, r.eneas === null ? '–' : fmt(r.eneas));
      satt('h-diff-' + r.m.key, r.diff === null ? '–' : fmtTecken(r.diff), klassForSkillnad(r.diff));
    });
    document.querySelector('#tab-hg tfoot').innerHTML = t.antal === 0
      ? '<tr>' + td('Summa') + td(fmt(t.kwhAlla)) + td(fmt(t.idagAlla)) + td('') + td('') + td('–') + td('–') + '</tr>'
      : '<tr>' + td('Summa') + td(fmt(t.kwhIfyllda)) + td(fmt(t.idagIfyllda)) + td('') + td('') + td(fmt(t.eneas)) +
        td(fmtTecken(t.diff), klassForSkillnad(t.diff)) + '</tr>';
    satt('tab-hg-not', t.antal === 0 ? 'Fyll i de gula fälten för att se jämförelsen.'
      : (t.antal < MANADER.length ? 'Summaraden gäller de ' + t.antal + ' av ' + MANADER.length + ' månader som är ifyllda.'
                                  : 'Summaraden gäller alla sex månader.'));
  }

  // ---------------------------------------------------------------
  // Lagring (localStorage, alltid inom try/catch). Delar nyckel med enea_jamforelse.js,
  // så vi läser hela objektet och ändrar bara fältet "ore" när vi sparar.
  // ---------------------------------------------------------------
  function las() {
    try {
      var s = localStorage.getItem(LAGRINGSNYCKEL);
      if (s) {
        var o = JSON.parse(s);
        if (o && o.ore && typeof o.ore === 'object') { ore = o.ore; }
      }
    } catch (e) { /* ignoreras */ }
  }

  function spara() {
    try {
      var s = localStorage.getItem(LAGRINGSNYCKEL);
      var o = s ? (JSON.parse(s) || {}) : {};
      o.ore = ore;
      localStorage.setItem(LAGRINGSNYCKEL, JSON.stringify(o));
    } catch (e) { /* ignoreras */ }
  }

  function markeraOgiltigt(el) {
    var v = el.value.trim();
    var n = tolka(v);
    el.classList.toggle('ogiltig', v !== '' && (n === null || n > MAX_ORE));
  }

  function tillFalt() {
    MANADER.forEach(function (m) {
      var el = document.getElementById('ore-' + m.key);
      el.value = ore[m.key] || '';
      markeraOgiltigt(el);
    });
  }

  // ---------------------------------------------------------------
  // Kopiera tabellen (HTML + text) till urklipp
  // ---------------------------------------------------------------
  var CELL = 'border:1px solid #999;padding:4px 8px;text-align:right;font-family:Arial,sans-serif;font-size:13px;';
  var CELL_V = 'border:1px solid #999;padding:4px 8px;text-align:left;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD = 'border:1px solid #999;padding:4px 8px;text-align:right;background:#eee;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD_V = 'border:1px solid #999;padding:4px 8px;text-align:left;background:#eee;font-family:Arial,sans-serif;font-size:13px;';

  function byggKopia() {
    var b = berakna(), t = b.tot;
    var huvud = ['Månad', 'Restaurangens kWh', 'Idag (kr inkl moms)', 'El inkl elcert Kraftringen (öre/kWh)', 'El inkl elcert Eneas (öre/kWh)', 'Med Eneas (kr inkl moms)', 'Skillnad (kr)'];
    var rader = b.rader.map(function (r) {
      return [r.m.namn, fmt(r.m.hgKwh), fmt(r.m.hgKr), fmt(r.m.krOre, 2), r.p === null ? '–' : fmt(r.p, 2),
              r.eneas === null ? '–' : fmt(r.eneas), r.diff === null ? '–' : fmtTecken(r.diff)];
    });
    rader.push(t.antal === 0 ? ['Summa', fmt(t.kwhAlla), fmt(t.idagAlla), '', '', '–', '–']
                             : ['Summa', fmt(t.kwhIfyllda), fmt(t.idagIfyllda), '', '', fmt(t.eneas), fmtTecken(t.diff)]);
    var rubrik = 'Intern debitering: restaurangens andel januari–juni 2026';
    var not = 'Intern sammanställning av Kent Lundgren. Siffrorna är hämtade ur Kraftringens fakturor och debiteringsunderlag och kontrollräknade mot dem i en tvåstegsgranskning. Antagandena i jämförelsen är inte avgjorda. Kontrollera mot källan. Version ' + VERSION + ', ' + VERSIONSDATUM + '.';
    var html = '<p style="font-family:Arial,sans-serif;font-size:14px;"><b>' + htmlEscape(rubrik) + '</b></p><table style="border-collapse:collapse;"><thead><tr>';
    var text = rubrik + '\n' + huvud.join('\t') + '\n';
    huvud.forEach(function (h, i) { html += '<th style="' + (i === 0 ? HEAD_V : HEAD) + '">' + htmlEscape(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    rader.forEach(function (rad) {
      html += '<tr>';
      rad.forEach(function (c, i) { html += '<td style="' + (i === 0 ? CELL_V : CELL) + (i === 4 ? 'background:#FFF9C4;' : '') + '">' + htmlEscape(c) + '</td>'; });
      html += '</tr>';
      text += rad.join('\t') + '\n';
    });
    html += '</tbody></table><p style="font-family:Arial,sans-serif;font-size:12px;color:#555;">' + htmlEscape(not) + '</p>';
    return { html: html, text: text + '\n' + not + '\n' };
  }

  function visaMeddelande(text) {
    var el = document.getElementById('meddelande');
    el.textContent = text;
    window.clearTimeout(visaMeddelande.timer);
    visaMeddelande.timer = window.setTimeout(function () { el.textContent = ''; }, 6000);
  }

  // Reservlösning om ClipboardItem saknas eller nekas: markera en dold kopia och kör "copy".
  function kopieraReserv(kopia) {
    var d = document.createElement('div');
    d.innerHTML = kopia.html;
    d.style.position = 'fixed';
    d.style.left = '-10000px';
    document.body.appendChild(d);
    var intervall = document.createRange();
    intervall.selectNodeContents(d);
    var val = window.getSelection();
    val.removeAllRanges();
    val.addRange(intervall);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    val.removeAllRanges();
    document.body.removeChild(d);
    return ok;
  }

  function kopiera() {
    var kopia = byggKopia();
    var klart = function () { visaMeddelande('Tabellen är kopierad.'); };
    var misslyckad = function () { visaMeddelande('Kopieringen misslyckades. Markera tabellen och kopiera med Ctrl+C.'); };
    if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
      var item = new ClipboardItem({
        'text/html': new Blob([kopia.html], { type: 'text/html' }),
        'text/plain': new Blob([kopia.text], { type: 'text/plain' })
      });
      navigator.clipboard.write([item]).then(klart).catch(function () { (kopieraReserv(kopia) ? klart : misslyckad)(); });
    } else {
      (kopieraReserv(kopia) ? klart : misslyckad)();
    }
  }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  function start() {
    document.getElementById('version').textContent = VERSION;
    document.getElementById('versionsdatum').textContent = VERSIONSDATUM;
    byggTabell();
    las();
    tillFalt();
    document.getElementById('tab-hg').addEventListener('input', function (e) {
      var el = e.target;
      if (el && el.getAttribute('data-key')) {
        ore[el.getAttribute('data-key')] = el.value;
        markeraOgiltigt(el);
        spara();
        uppdatera();
      }
    });
    document.getElementById('btn-kopiera').addEventListener('click', kopiera);
    document.getElementById('btn-skriv').addEventListener('click', function () { window.print(); });
    H.kopplaTeknikModal();
    uppdatera();
  }

  start();
})();
