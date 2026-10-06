/*
  enea_jamforelse.js
  Logik för enea_jamforelse.html (sidan som Isak på Eneas får): två tabeller (idag hos
  Kraftringen, och med Eneas priser), beräkning, sparande i webbläsaren och kopiering
  till mejl.

  Gemensamma hjälpfunktioner (tolkning, talformat) finns i enea_hjalp.js, som måste
  laddas före den här filen.

  Ingen kod med ES2023+ används. Allt är vanlig JavaScript (ES2015) som körs i alla
  vanliga webbläsare. Inget nätverksanrop görs.

  UPPDATERING 2026-10-06: Första versionen (1.0), Del 1 i PRD:n.
  UPPDATERING 2026-10-06: Tabell 3 och dess data borttagna ur filen,
  hjälpfunktionerna flyttade till enea_hjalp.js. Version 1.1.
*/
(function () {
  'use strict';

  var H = window.EneaHjalp;
  var tolka = H.tolka, fmt = H.fmt, fmtTecken = H.fmtTecken;
  var klassForSkillnad = H.klassForSkillnad, htmlEscape = H.htmlEscape;
  var MOMS = H.MOMS, LAGRINGSNYCKEL = H.LAGRINGSNYCKEL, MAX_ORE = H.MAX_ORE;

  // ===================================================================
  // 1. Version
  // ===================================================================
  var VERSION = '1.1';
  var VERSIONSDATUM = '2026-10-06';

  // ===================================================================
  // 2. Referensdata: Kraftringens faktiska utfall januari–juni 2026
  //    Källa: Kraftringens fakturor (se källistan på sidan). Inte kvalitetssäkrat.
  //    kwh        = användning enligt fakturan (med decimaler, används i beräkningen)
  //    fakturaKr  = fakturabelopp inkl moms, hela kronor (avrundat enligt fakturan)
  //    krOre      = "El inkl elcert" = spotpris + rörliga kostnader + 1,70 öre/kWh fast påslag
  //    natOre     = rörlig nätavgift (elöverföring), öre/kWh
  //    skattOre   = energiskatt, öre/kWh
  //    fastNatKr  = fast nätavgift, kr/månad (Kraftringen Nät AB, kan inte bytas)
  // ===================================================================
  var MANADER = [
    { key: '2026-01', namn: 'Jan', kwh: 35422.14, fakturaKr: 90779, krOre: 122.24, natOre: 21.87, skattOre: 36.00, fastNatKr: 8824 },
    { key: '2026-02', namn: 'Feb', kwh: 32002.14, fakturaKr: 82794, krOre: 121.56, natOre: 21.84, skattOre: 36.00, fastNatKr: 8824 },
    { key: '2026-03', namn: 'Mar', kwh: 28073.52, fakturaKr: 63389, krOre: 92.87,  natOre: 20.33, skattOre: 36.00, fastNatKr: 8824 },
    { key: '2026-04', namn: 'Apr', kwh: 26671.14, fakturaKr: 52186, krOre: 68.29,  natOre: 19.16, skattOre: 36.00, fastNatKr: 8824 },
    { key: '2026-05', namn: 'Maj', kwh: 23941.02, fakturaKr: 56338, krOre: 95.00,  natOre: 20.39, skattOre: 36.00, fastNatKr: 8824 },
    { key: '2026-06', namn: 'Jun', kwh: 20609.34, fakturaKr: 53134, krOre: 106.45, natOre: 20.99, skattOre: 36.00, fastNatKr: 8824 }
  ];

  // ===================================================================
  // 3. Inmatat tillstånd (det Isak fyller i)
  // ===================================================================
  var tillstand = {
    ore: {},          // { '2026-01': '95,5', ... } som text, precis som det skrevs
    avgift: '',       // Eneas fasta månadsavgift, kr/mån exkl moms
    modell: '',
    omfattar: '',
    namn: '',
    datum: ''
  };

  // ===================================================================
  // 4. Beräkning
  // ===================================================================

  // Beräknar allt som visas, utifrån MANADER och tillstand.
  function berakna() {
    var avgift = tolka(tillstand.avgift);
    if (avgift === null) { avgift = 0; }

    var rader = [];
    var tot = {
      kwhAlla: 0, fakturaAlla: 0, kwhOreAlla: 0,       // alla sex månader (tabell 1)
      antal: 0, kwhIfyllda: 0, idagIfyllda: 0, eneasSumma: 0, kwhOreEneas: 0
    };

    MANADER.forEach(function (m) {
      var ore = tolka(tillstand.ore[m.key]);
      if (ore !== null && ore > MAX_ORE) { ore = null; }
      var rad = { m: m, eneasOre: ore, eneasFaktura: null, diffKr: null, diffPct: null };

      tot.kwhAlla += m.kwh;
      tot.fakturaAlla += m.fakturaKr;
      tot.kwhOreAlla += m.kwh * m.krOre;

      if (ore !== null) {
        // Fakturan med Eneas = faktura idag + (prisskillnad × kWh + månadsavgift) × moms.
        // Räknat från Kraftringens faktiska fakturabelopp så att baslinjen stämmer exakt.
        var deltaExkl = (ore - m.krOre) / 100 * m.kwh + avgift;
        rad.eneasFaktura = Math.round(m.fakturaKr + deltaExkl * MOMS);
        rad.diffKr = rad.eneasFaktura - m.fakturaKr;
        rad.diffPct = rad.diffKr / m.fakturaKr * 100;

        tot.antal += 1;
        tot.kwhIfyllda += m.kwh;
        tot.idagIfyllda += m.fakturaKr;
        tot.eneasSumma += rad.eneasFaktura;
        tot.kwhOreEneas += m.kwh * ore;
      }
      rader.push(rad);
    });

    tot.snittIdag = tot.kwhAlla ? tot.kwhOreAlla / tot.kwhAlla : null;
    tot.snittEneas = tot.kwhIfyllda ? tot.kwhOreEneas / tot.kwhIfyllda : null;
    tot.diffKr = tot.antal ? tot.eneasSumma - tot.idagIfyllda : null;
    tot.diffPct = tot.antal ? tot.diffKr / tot.idagIfyllda * 100 : null;
    return { rader: rader, tot: tot, avgift: avgift };
  }

  // ===================================================================
  // 5. Bygg tabellerna (en gång) och uppdatera siffrorna (vid varje ändring)
  // ===================================================================

  function td(text, klass, id) {
    return '<td' + (klass ? ' class="' + klass + '"' : '') + (id ? ' id="' + id + '"' : '') + '>' + text + '</td>';
  }

  function byggTabeller() {
    // --- Tabell 1: idag (inget är ändringsbart) ---
    var r1 = '';
    MANADER.forEach(function (m) {
      r1 += '<tr>' + td(m.namn) + td(fmt(m.kwh)) + td(fmt(m.fakturaKr)) + td(fmt(m.krOre, 2)) +
            td(fmt(m.natOre, 2)) + td(fmt(m.skattOre, 2)) + td(fmt(m.fastNatKr)) + '</tr>';
    });
    document.querySelector('#tab-idag tbody').innerHTML = r1;

    // --- Tabell 2: med Eneas. Inmatningsfältet skapas här en gång så att fokus inte tappas. ---
    var r2 = '';
    MANADER.forEach(function (m) {
      r2 += '<tr>' + td(m.namn) + td(fmt(m.kwh)) +
            td('', null, 'e-fak-' + m.key) +
            '<td><input type="text" inputmode="decimal" autocomplete="off" class="gul" ' +
              'data-key="' + m.key + '" id="ore-' + m.key + '" aria-label="Eneas El inkl elcert öre/kWh, ' + m.namn + '"></td>' +
            td(fmt(m.natOre, 2)) + td(fmt(m.skattOre, 2)) + td(fmt(m.fastNatKr)) +
            td('', null, 'e-dkr-' + m.key) + td('', null, 'e-dpc-' + m.key) + '</tr>';
    });
    document.querySelector('#tab-eneas tbody').innerHTML = r2;
  }

  function satt(id, text, klass) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.textContent = text;
    if (klass !== undefined) { el.className = klass; }
  }

  function uppdatera() {
    var b = berakna();
    var t = b.tot;

    // Tabell 1: summarad
    document.querySelector('#tab-idag tfoot').innerHTML =
      '<tr>' + td('Summa') + td(fmt(t.kwhAlla)) + td(fmt(t.fakturaAlla)) + td(fmt(t.snittIdag, 2)) + td('') + td('') + td('') + '</tr>';

    // Tabell 2: rader
    b.rader.forEach(function (r) {
      var k = r.m.key;
      satt('e-fak-' + k, r.eneasFaktura === null ? '–' : fmt(r.eneasFaktura));
      satt('e-dkr-' + k, r.diffKr === null ? '–' : fmtTecken(r.diffKr), klassForSkillnad(r.diffKr));
      satt('e-dpc-' + k, r.diffPct === null ? '–' : fmtTecken(r.diffPct, 1), klassForSkillnad(r.diffKr));
    });

    // Tabell 2: summarad (bara ifyllda månader; kWh och skillnad räknas på samma månader)
    document.querySelector('#tab-eneas tfoot').innerHTML = t.antal === 0
      ? '<tr>' + td('Summa') + td('–') + td('–') + td('–') + td('') + td('') + td('') + td('–') + td('–') + '</tr>'
      : '<tr>' + td('Summa') + td(fmt(t.kwhIfyllda)) + td(fmt(t.eneasSumma)) + td(fmt(t.snittEneas, 2)) + td('') + td('') + td('') +
        td(fmtTecken(t.diffKr), klassForSkillnad(t.diffKr)) + td(fmtTecken(t.diffPct, 1), klassForSkillnad(t.diffKr)) + '</tr>';

    satt('tab-eneas-not',
      t.antal === 0 ? 'Fyll i de gula fälten för att se jämförelsen.'
      : (t.antal < MANADER.length
          ? 'Summaraden gäller de ' + t.antal + ' av ' + MANADER.length + ' månader som är ifyllda (kWh, kr och snitt räknas på samma månader). Idag för samma månader: ' + fmt(t.idagIfyllda) + ' kr.'
          : 'Summaraden gäller alla sex månader. Idag: ' + fmt(t.idagIfyllda) + ' kr. Med Eneas: ' + fmt(t.eneasSumma) + ' kr.'));
  }

  // ===================================================================
  // 6. Spara och läsa tillbaka från webbläsaren (localStorage)
  //    Allt inom try/catch: privat läge, blockerad lagring m.m. ska aldrig stoppa sidan.
  // ===================================================================

  function spara() {
    try {
      // Läs först det som redan ligger så att inget annat fält på den delade nyckeln skrivs över.
      var gammalt = {};
      var s = localStorage.getItem(LAGRINGSNYCKEL);
      if (s) { gammalt = JSON.parse(s) || {}; }
      var ny = {};
      Object.keys(gammalt).forEach(function (k) { ny[k] = gammalt[k]; });
      Object.keys(tillstand).forEach(function (k) { ny[k] = tillstand[k]; });
      localStorage.setItem(LAGRINGSNYCKEL, JSON.stringify(ny));
    } catch (e) { /* ignoreras */ }
  }

  function las() {
    try {
      var s = localStorage.getItem(LAGRINGSNYCKEL);
      if (!s) { return; }
      var o = JSON.parse(s);
      if (o && typeof o === 'object') {
        tillstand.ore = (o.ore && typeof o.ore === 'object') ? o.ore : {};
        tillstand.avgift = o.avgift || '';
        tillstand.modell = o.modell || '';
        tillstand.omfattar = o.omfattar || '';
        tillstand.namn = o.namn || '';
        tillstand.datum = o.datum || '';
      }
    } catch (e) { /* ignoreras */ }
  }

  // Skriver tillståndet till fälten (vid start och efter rensning).
  function tillFalt() {
    MANADER.forEach(function (m) {
      var el = document.getElementById('ore-' + m.key);
      if (el) { el.value = tillstand.ore[m.key] || ''; markeraOgiltigt(el); }
    });
    var a = document.getElementById('avgift'); a.value = tillstand.avgift; markeraOgiltigt(a);
    document.getElementById('modell').value = tillstand.modell;
    document.getElementById('omfattar').value = tillstand.omfattar;
    document.getElementById('namn').value = tillstand.namn;
    document.getElementById('datum').value = tillstand.datum;
  }

  // Röd ram om texten inte går att tolka som ett rimligt tal.
  function markeraOgiltigt(el) {
    var v = el.value.trim();
    var ogiltig = false;
    if (v !== '') {
      var n = tolka(v);
      ogiltig = (n === null) || (el.id !== 'avgift' && n > MAX_ORE);
    }
    el.classList.toggle('ogiltig', ogiltig);
  }

  // ===================================================================
  // 7. Kopiera tabellerna (HTML + text) och skriv ut
  // ===================================================================

  var CELL = 'border:1px solid #999;padding:4px 8px;text-align:right;font-family:Arial,sans-serif;font-size:13px;';
  var CELL_V = 'border:1px solid #999;padding:4px 8px;text-align:left;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD = 'border:1px solid #999;padding:4px 8px;text-align:right;background:#eee;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD_V = 'border:1px solid #999;padding:4px 8px;text-align:left;background:#eee;font-family:Arial,sans-serif;font-size:13px;';
  var GUL = 'background:#FFF9C4;';

  // Bygger en HTML-tabell med inline-stilar (så att den ser rätt ut när den klistras in i ett mejl)
  // och motsvarande tabbseparerad text.
  function tabellKopia(rubrik, huvud, rader, gulKolumn) {
    var html = '<p style="font-family:Arial,sans-serif;font-size:14px;margin:12px 0 4px;"><b>' + htmlEscape(rubrik) + '</b></p>' +
               '<table style="border-collapse:collapse;"><thead><tr>';
    huvud.forEach(function (h, i) { html += '<th style="' + (i === 0 ? HEAD_V : HEAD) + '">' + htmlEscape(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    var text = rubrik + '\n' + huvud.join('\t') + '\n';
    rader.forEach(function (rad) {
      html += '<tr>';
      rad.forEach(function (c, i) {
        html += '<td style="' + (i === 0 ? CELL_V : CELL) + (i === gulKolumn ? GUL : '') + '">' + htmlEscape(c) + '</td>';
      });
      html += '</tr>';
      text += rad.join('\t') + '\n';
    });
    html += '</tbody></table>';
    return { html: html, text: text + '\n' };
  }

  function byggKopia() {
    var b = berakna();
    var t = b.tot;

    // Tabell 1
    var h1 = ['Månad', 'Totalt kWh', 'Faktura inkl moms (kr)', 'El inkl elcert (öre/kWh)', 'Rörlig nätavgift (öre/kWh)', 'Energiskatt (öre/kWh)', 'Fast avgift (kr/månad)'];
    var r1 = MANADER.map(function (m) { return [m.namn, fmt(m.kwh), fmt(m.fakturaKr), fmt(m.krOre, 2), fmt(m.natOre, 2), fmt(m.skattOre, 2), fmt(m.fastNatKr)]; });
    r1.push(['Summa', fmt(t.kwhAlla), fmt(t.fakturaAlla), fmt(t.snittIdag, 2) + ' (snitt)', '', '', '']);
    var k1 = tabellKopia('Tabell 1. Idag: det som betalades till Kraftringen, januari–juni 2026', h1, r1, -1);

    // Tabell 2
    var h2 = h1.concat(['Skillnad mot idag (kr)', 'Skillnad (%)']);
    var r2 = b.rader.map(function (r) {
      var m = r.m;
      return [m.namn, fmt(m.kwh), fmt(r.eneasFaktura), r.eneasOre === null ? '–' : fmt(r.eneasOre, 2), fmt(m.natOre, 2), fmt(m.skattOre, 2), fmt(m.fastNatKr),
              r.diffKr === null ? '–' : fmtTecken(r.diffKr), r.diffPct === null ? '–' : fmtTecken(r.diffPct, 1)];
    });
    r2.push(t.antal === 0
      ? ['Summa', '–', '–', '–', '', '', '', '–', '–']
      : ['Summa (' + t.antal + ' av ' + MANADER.length + ' månader)', fmt(t.kwhIfyllda), fmt(t.eneasSumma), fmt(t.snittEneas, 2) + ' (snitt)', '', '', '', fmtTecken(t.diffKr), fmtTecken(t.diffPct, 1)]);
    var k2 = tabellKopia('Tabell 2. Med Eneas priser (gula fält ifyllda av Eneas)', h2, r2, 3);

    // Anteckningar
    var rader = [
      ['Fast månadsavgift Eneas (kr/mån exkl moms)', tillstand.avgift || '–'],
      ['Prismodell', tillstand.modell || '–'],
      ['Vad priset omfattar', tillstand.omfattar || '–'],
      ['Ifylld av', tillstand.namn || '–'],
      ['Datum', tillstand.datum || '–']
    ];
    var an = '<p style="font-family:Arial,sans-serif;font-size:14px;margin:12px 0 4px;"><b>Förklaring av Eneas pris</b></p><table style="border-collapse:collapse;">';
    var anText = 'Förklaring av Eneas pris\n';
    rader.forEach(function (r) {
      an += '<tr><td style="' + HEAD_V + '">' + htmlEscape(r[0]) + '</td><td style="' + CELL_V + GUL + '">' + htmlEscape(r[1]).replace(/\n/g, '<br>') + '</td></tr>';
      anText += r[0] + ':\t' + r[1].replace(/\n/g, ' ') + '\n';
    });
    an += '</table>';

    var not = 'Siffrorna är hämtade ur Kraftringens fakturor januari–juni 2026 och är inte kvalitetssäkrade. Kontrollera mot källan innan något återges. ' +
              'Sammanställd av Kent Lundgren. Jämförelsen är gjord i efterhand: nät, energiskatt och fast nätavgift är oförändrade, bara elhandeln byts ut. ' +
              'Version ' + VERSION + ', ' + VERSIONSDATUM + '.';

    return {
      html: '<div style="font-family:Arial,sans-serif;">' +
            '<p style="font-family:Arial,sans-serif;font-size:16px;"><b>Elkostnad januari–juni 2026: Kraftringen och Eneas</b></p>' +
            k1.html + k2.html + an +
            '<p style="font-family:Arial,sans-serif;font-size:12px;color:#555;">' + htmlEscape(not) + '</p></div>',
      text: 'Elkostnad januari–juni 2026: Kraftringen och Eneas\n\n' + k1.text + k2.text + anText + '\n' + not + '\n'
    };
  }

  function visaMeddelande(text) {
    var el = document.getElementById('meddelande');
    el.textContent = text;
    window.clearTimeout(visaMeddelande.timer);
    visaMeddelande.timer = window.setTimeout(function () { el.textContent = ''; }, 6000);
  }

  // Reservlösning om webbläsaren inte tillåter ClipboardItem: markera en dold kopia och kör "copy".
  function kopieraReserv(kopia) {
    var behallare = document.createElement('div');
    behallare.innerHTML = kopia.html;
    behallare.style.position = 'fixed';
    behallare.style.left = '-10000px';
    document.body.appendChild(behallare);
    var intervall = document.createRange();
    intervall.selectNodeContents(behallare);
    var val = window.getSelection();
    val.removeAllRanges();
    val.addRange(intervall);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    val.removeAllRanges();
    document.body.removeChild(behallare);
    return ok;
  }

  function kopiera() {
    var kopia = byggKopia();
    // Moderna webbläsare: lägg både HTML och text på urklipp.
    if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
      var item = new ClipboardItem({
        'text/html': new Blob([kopia.html], { type: 'text/html' }),
        'text/plain': new Blob([kopia.text], { type: 'text/plain' })
      });
      navigator.clipboard.write([item]).then(function () {
        visaMeddelande('Tabellerna är kopierade. Klistra in dem i ett mejl.');
      }).catch(function () {
        visaMeddelande(kopieraReserv(kopia) ? 'Tabellerna är kopierade. Klistra in dem i ett mejl.'
                                            : 'Kopieringen misslyckades. Markera tabellerna och kopiera med Ctrl+C.');
      });
    } else {
      visaMeddelande(kopieraReserv(kopia) ? 'Tabellerna är kopierade. Klistra in dem i ett mejl.'
                                          : 'Kopieringen misslyckades. Markera tabellerna och kopiera med Ctrl+C.');
    }
  }

  // ===================================================================
  // 8. Händelser
  // ===================================================================

  function kopplaHandelser() {
    // Gula prisfält i tabell 2 (delegerat på tabellen)
    document.getElementById('tab-eneas').addEventListener('input', function (e) {
      var el = e.target;
      if (el && el.getAttribute('data-key')) {
        tillstand.ore[el.getAttribute('data-key')] = el.value;
        markeraOgiltigt(el);
        spara();
        uppdatera();
      }
    });

    document.getElementById('avgift').addEventListener('input', function (e) {
      tillstand.avgift = e.target.value; markeraOgiltigt(e.target); spara(); uppdatera();
    });
    document.getElementById('modell').addEventListener('change', function (e) { tillstand.modell = e.target.value; spara(); });
    document.getElementById('omfattar').addEventListener('input', function (e) { tillstand.omfattar = e.target.value; spara(); });
    document.getElementById('namn').addEventListener('input', function (e) { tillstand.namn = e.target.value; spara(); });
    document.getElementById('datum').addEventListener('input', function (e) { tillstand.datum = e.target.value; spara(); });

    document.getElementById('btn-kopiera').addEventListener('click', kopiera);
    document.getElementById('btn-skriv').addEventListener('click', function () { window.print(); });
    document.getElementById('btn-rensa').addEventListener('click', function () {
      if (!window.confirm('Rensa allt som är ifyllt?')) { return; }
      tillstand = { ore: {}, avgift: '', modell: '', omfattar: '', namn: '', datum: '' };
      spara(); tillFalt(); uppdatera();
      visaMeddelande('Inmatningen är rensad.');
    });

    H.kopplaTeknikModal();
  }

  // ===================================================================
  // 9. Start
  // ===================================================================
  function start() {
    document.getElementById('version').textContent = VERSION;
    document.getElementById('versionsdatum').textContent = VERSIONSDATUM;
    byggTabeller();
    las();
    tillFalt();
    kopplaHandelser();
    uppdatera();
  }

  start();
})();
