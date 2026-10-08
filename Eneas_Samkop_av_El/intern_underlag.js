/*
  intern_underlag.js
  Del 2 i PRD.md: mall för internt debiteringsunderlag ("Debiteringsunderlag El [månad] 2026").
  INTERN fil. Den ska inte länkas från eller laddas av Isaks sida (enea_jamforelse.html).

  Underlaget följer uppställningen i dagens underlag (bilderna i Kraftringen/Intern_debitering/):
    huvudmätare vid bryggfästet, hyresvärdens andel (bastu herr, bastu dam, varmvatten) och
    hyresgästens andel (fast avgift 0, rörlig nätavgift, el inkl elcert, energiskatt, moms, totalt).

  Regler (PRD.md, avsnitt 5):
    - Hyresgästens kWh = total förbrukning - bastu totalt - varmvatten.
    - Hyresgästen betalar aldrig fast nätavgift (raden är låst till 0).
    - Summa exkl moms + 25 % moms, totalt avrundat till hela kronor.
    - Ingående mätarställning = föregående månads utgående (kedjan är kontrollerad för
      januari–juni 2026, se PRD.md avsnitt 13). Första månaden fylls i för hand.

  Gemensamma hjälpfunktioner finns i enea_hjalp.js, som måste laddas före den här filen.
  Ingen kod med ES2023+ används (vanlig ES2015). Inget nätverksanrop görs.

  Mätarställningarna för januari–juni är avlästa ur bilderna och är avrundade heltal. Det kan ge
  avvikelser på någon krona mot tidigare debiterade belopp. Kent godtog det 2026-10-06.

  UPPDATERING 2026-10-06: Första versionen (1.0).
  UPPDATERING 2026-10-08: Juli, augusti och september 2026 inlagda som fasta månader (se STANDARD).
  UPPDATERING 2026-10-06: Raden "El inkl Elcert (1,7 öre/kWh)" heter nu "El (spot + rörliga + påslag)",
  eftersom fakturan inte säger att elcertifikat ingår (granskning 2, avsnitt 5a).
*/
(function () {
  'use strict';

  var H = window.EneaHjalp;
  var tolka = H.tolka, fmt = H.fmt, htmlEscape = H.htmlEscape, MOMS = H.MOMS;
  var LAGRINGSNYCKEL = 'intern_underlag_v1';   // egen nyckel, skild från Eneas priser

  var MANADSNAMN = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  var KORTNAMN = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

  // ===================================================================
  // 1. Förifyllda månader (januari–juni 2026), avlästa ur debiteringsunderlagen
  //    s = ingående mätarställning (bara januari används; övriga hämtas från föregående månad)
  //    e = utgående mätarställning
  //    p = öre/kWh: rörlig nätavgift, el inkl elcert, energiskatt
  //    kwhFaktura = användning enligt Kraftringens faktura (kontroll)
  //    facit = tidigare debiterat belopp till restaurangen inkl moms (rättat, PRD 4.3)
  //    Källa: Kraftringens fakturor och Bjerreds Saltsjöbads debiteringsunderlag. Granskad 2026-10-06 (tvåstegsgranskning, se kvalitetsgranskning.html).
  // ===================================================================
  var STANDARD = [
    { key: '2026-01', faktura: '90779', nr: '3082197306', kwhFaktura: '35422,14', facit: 37341,
      s: { huvud: '176911', herr: '25833', dam: '22118', varm: '669857' },
      e: { huvud: '212333', herr: '33683', dam: '28997', varm: '673964' },
      p: { rorlig: '21,87', el: '122,24', skatt: '36,00' } },
    { key: '2026-02', faktura: '82794', nr: '3098735503', kwhFaktura: '32002,14', facit: 36647,
      s: {},
      e: { huvud: '244335', herr: '40360', dam: '34159', varm: '677785' },
      p: { rorlig: '21,84', el: '121,56', skatt: '36,00' } },
    { key: '2026-03', faktura: '63389', nr: '3112109404', kwhFaktura: '28073,52', facit: 19213,
      s: {},
      e: { huvud: '272409', herr: '46950', dam: '40312', varm: '682814' },
      p: { rorlig: '20,33', el: '92,87', skatt: '36,00' } },
    { key: '2026-04', faktura: '52186', nr: '3126369101', kwhFaktura: '26671,14', facit: 17873,
      s: {},
      e: { huvud: '299080', herr: '52762', dam: '45725', varm: '686678' },
      p: { rorlig: '19,16', el: '68,29', skatt: '36,00' } },
    { key: '2026-05', faktura: '56338', nr: '3141677009', kwhFaktura: '23941,02', facit: 23521,
      s: {},
      e: { huvud: '323021', herr: '57338', dam: '50173', varm: '689165' },
      p: { rorlig: '20,39', el: '95,00', skatt: '36,00' } },
    { key: '2026-06', faktura: '53134', nr: '3154522605', kwhFaktura: '20609,34', facit: 24017,
      s: {},
      e: { huvud: '343630', herr: '61254', dam: '53688', varm: '690588' },
      p: { rorlig: '20,99', el: '106,45', skatt: '36,00' } },
    // UPPDATERING 2026-10-08: juli, augusti och september 2026 inlagda som fasta månader.
    //   Mätarställningar och belopp avlästa ur Kraftringen/Intern_debitering/202607..202609_Intern_debitering.jpg.
    //   Fakturanummer, fakturabelopp, öre/kWh och kWh är kontrollerade mot fakturorna (PDF) i Kraftringen/Fakturor/.
    //   facit = "Totalt" i Kents debiteringsunderlag (Excel) för månaden.
    //   Juli och augusti låg tidigare bara i Kents webbläsare (localStorage); de behövs här så att
    //   ingående mätarställning för september (= augusti utgående) blir rätt även i en ren webbläsare.
    { key: '2026-07', faktura: '48277', nr: '3165925102', kwhFaktura: '21584,28', facit: 19804,
      s: {},
      e: { huvud: '365214', herr: '65896', dam: '57817', varm: '692241' },
      p: { rorlig: '19,95', el: '86,01', skatt: '36,00' } },
    { key: '2026-08', faktura: '49876', nr: '3185333204', kwhFaktura: '21835,32', facit: 20667,
      s: {},
      e: { huvud: '387050', herr: '70572', dam: '61947', varm: '693960' },
      p: { rorlig: '20,17', el: '90,02', skatt: '36,00' } },
    { key: '2026-09', faktura: '62294', nr: '3199122106', kwhFaktura: '21688,74', facit: 24849,
      s: {},
      e: { huvud: '408739', herr: '75815', dam: '66805', varm: '695247' },
      p: { rorlig: '22,39', el: '134,59', skatt: '36,00' } }
  ];

  function kopia(o) { return JSON.parse(JSON.stringify(o)); }

  // ===================================================================
  // 2. Tillstånd: data per månad (nyckel "ÅÅÅÅ-MM") och vald månad
  // ===================================================================
  var data = {};
  var valt = '2026-09';   // UPPDATERING 2026-10-08: senaste fasta månad (var 2026-06)

  function laddaStandard() {
    data = {};
    STANDARD.forEach(function (m) { data[m.key] = kopia(m); });
    // Ingående mätarställningar för januari (övriga hämtas från föregående månad)
    data['2026-01'].s = { huvud: '176911', herr: '25833', dam: '22118', varm: '669857' };
  }

  function las() {
    laddaStandard();
    try {
      var s = localStorage.getItem(LAGRINGSNYCKEL);
      if (!s) { return; }
      var o = JSON.parse(s);
      if (o && o.data && typeof o.data === 'object') {
        Object.keys(o.data).forEach(function (k) {
          var sparad = o.data[k];
          // UPPDATERING 2026-10-08: en månad som tidigare lades till för hand (extra) och som nu finns som fast månad,
          // men där ingen utgående huvudmätare fyllts i, ersätts av de fasta värdena. Annars skulle en tom, sparad
          // månad dölja de nyinlagda värdena. Har användaren fyllt i något behålls det.
          var tomExtra = sparad && sparad.extra && (!sparad.e || !sparad.e.huvud);
          if (tomExtra && data[k]) { return; }
          data[k] = sparad;
        });
      }
      if (o && o.valt && data[o.valt]) { valt = o.valt; }
    } catch (e) { /* ignoreras */ }
  }

  function spara() {
    try { localStorage.setItem(LAGRINGSNYCKEL, JSON.stringify({ data: data, valt: valt })); } catch (e) { /* ignoreras */ }
  }

  function nycklar() { return Object.keys(data).sort(); }

  // Ingående mätarställning: föregående månads utgående, eller egen (första månaden).
  function startText(key, f) {
    var k = nycklar();
    var i = k.indexOf(key);
    if (i > 0) { return data[k[i - 1]].e[f] || ''; }
    return (data[key].s && data[key].s[f]) || '';
  }

  function arForstaManaden(key) { return nycklar().indexOf(key) === 0; }

  // ===================================================================
  // 3. Beräkning
  // ===================================================================
  function r2(x) { return Math.round(x * 100) / 100; }

  function berakna(key) {
    var d = data[key];
    var res = { fel: [] };
    var f = ['huvud', 'herr', 'dam', 'varm'];
    f.forEach(function (m) {
      var s = tolka(startText(key, m)), e = tolka(d.e[m]);
      res[m] = (s !== null && e !== null) ? r2(e - s) : null;
      if (res[m] !== null && res[m] < 0) { res.fel.push('Utgående mätarställning är lägre än ingående (' + m + ').'); }
    });
    res.bastu = (res.herr !== null && res.dam !== null) ? r2(res.herr + res.dam) : null;
    res.hg = (res.huvud !== null && res.bastu !== null && res.varm !== null) ? r2(res.huvud - res.bastu - res.varm) : null;
    if (res.hg !== null && res.hg < 0) { res.fel.push('Hyresgästens kWh blir negativ. Kontrollera mätarställningarna.'); }

    var pris = { rorlig: tolka(d.p.rorlig), el: tolka(d.p.el), skatt: tolka(d.p.skatt) };
    res.kr = { rorlig: null, el: null, skatt: null };
    ['rorlig', 'el', 'skatt'].forEach(function (p) {
      if (res.hg !== null && pris[p] !== null) { res.kr[p] = res.hg * pris[p] / 100; }
    });
    res.sumOre = (pris.rorlig !== null && pris.el !== null && pris.skatt !== null) ? r2(pris.rorlig + pris.el + pris.skatt) : null;
    if (res.kr.rorlig !== null && res.kr.el !== null && res.kr.skatt !== null) {
      res.exkl = res.kr.rorlig + res.kr.el + res.kr.skatt;
      res.moms = res.exkl * (MOMS - 1);
      res.tot = Math.round(res.exkl + res.moms);     // hela kronor
    } else { res.exkl = null; res.moms = null; res.tot = null; }
    return res;
  }

  // kWh visas utan decimaler om värdet är ett heltal, annars med två.
  function fmtKwh(x) {
    if (x === null || x === undefined) { return '–'; }
    return fmt(x, Math.abs(x - Math.round(x)) < 0.005 ? 0 : 2);
  }
  function fmtKr(x) { return x === null || x === undefined ? '–' : fmt(x, 2); }

  // ===================================================================
  // 4. Visning
  // ===================================================================
  function el(id) { return document.getElementById(id); }
  function text(id, t) { var e = el(id); if (e) { e.textContent = t; } }

  function datumText(key) {
    var y = Number(key.slice(0, 4)), m = Number(key.slice(5, 7));
    var sista = new Date(y, m, 0).getDate();
    return { start: key + '-01', slut: key + '-' + (sista < 10 ? '0' : '') + sista };
  }

  function manadsNamn(key) {
    return MANADSNAMN[Number(key.slice(5, 7)) - 1] + ' ' + key.slice(0, 4);
  }

  function byggNav() {
    var h = '';
    nycklar().forEach(function (k) {
      h += '<button type="button" role="tab" data-key="' + k + '" aria-selected="' + (k === valt) + '">' +
           KORTNAMN[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(2, 4) + '</button>';
    });
    h += '<button type="button" class="ny" id="btn-ny" title="Lägg till nästa månad">+ Ny månad</button>';
    el('manadsval').innerHTML = h;
  }

  // Fyller alla fält för vald månad (vid byte av månad och vid återställning).
  function fyllFalt() {
    var d = data[valt];
    el('ark-titel').textContent = 'Debiteringsunderlag El ' + manadsNamn(valt);
    var dt = datumText(valt);
    text('datum-start', dt.start);
    text('datum-slut', dt.slut);
    el('f-faktura').value = d.faktura || '';
    el('f-nr').value = d.nr || '';
    el('f-kwh').value = d.kwhFaktura || '';
    ['huvud', 'herr', 'dam', 'varm'].forEach(function (m) {
      var s = el('s-' + m);
      s.value = startText(valt, m);
      var forsta = arForstaManaden(valt);
      s.readOnly = !forsta;
      s.className = forsta ? 'gul' : 'last';
      el('e-' + m).value = d.e[m] || '';
    });
    el('p-rorlig').value = d.p.rorlig || '';
    el('p-el').value = d.p.el || '';
    el('p-skatt').value = d.p.skatt || '';
    // "Ta bort månaden" visas bara för en tillagd månad och bara för den sista (annars skulle
    // kedjan av ingående mätarställningar brytas). Januari–september 2026 kan aldrig tas bort.
    var k = nycklar();
    var arSista = k[k.length - 1] === valt;
    el('btn-u-ta-bort').hidden = !(d.extra && arSista);
    knappInfo(d, arSista);
  }

  // Förklarar för användaren vad "Återställ" och "Ta bort" gör för den valda månaden.
  function knappInfo(d, arSista) {
    var namn = manadsNamn(valt);
    var h = '';
    if (!d.extra) {
      h += '<li><b>Återställ månaden:</b> sätter tillbaka de fasta värdena för ' + htmlEscape(namn) +
           ' (hämtade ur fakturan och dagens underlag). Det du själv har ändrat för månaden försvinner.</li>';
      h += '<li>Januari–september 2026 är fasta månader och <b>kan inte tas bort</b>.</li>';
    } else {
      h += '<li><b>Återställ månaden:</b> tömmer alla fält för ' + htmlEscape(namn) + ' (månaden finns kvar).</li>';
      h += arSista
        ? '<li><b>Ta bort månaden:</b> tar bort hela månaden ' + htmlEscape(namn) + ' och det du fyllt i. Går inte att ångra. Fasta månader påverkas inte.</li>'
        : '<li>Bara den sista månaden kan tas bort. Ta bort de senare månaderna först.</li>';
    }
    el('knapp-info').innerHTML = h;
  }

  function uppdateraBeraknat() {
    var b = berakna(valt);
    text('u-huvud', fmtKwh(b.huvud));
    text('u-herr', fmtKwh(b.herr));
    text('u-dam', fmtKwh(b.dam));
    text('u-bastu', fmtKwh(b.bastu));
    text('u-varm', fmtKwh(b.varm));
    // Bastu TOT: ingående och utgående som summor av herr och dam
    var sh = tolka(startText(valt, 'herr')), sd = tolka(startText(valt, 'dam'));
    var eh = tolka(data[valt].e.herr), ed = tolka(data[valt].e.dam);
    text('t-bastu-s', (sh !== null && sd !== null) ? fmtKwh(r2(sh + sd)) : '–');
    text('t-bastu-e', (eh !== null && ed !== null) ? fmtKwh(r2(eh + ed)) : '–');

    ['1', '2', '3'].forEach(function (i) { text('h-kwh-' + i, fmtKwh(b.hg)); });
    text('h-kr-1', fmtKr(b.kr.rorlig));
    text('h-kr-2', fmtKr(b.kr.el));
    text('h-kr-3', fmtKr(b.kr.skatt));
    text('h-sumore', b.sumOre === null ? '–' : fmt(b.sumOre, 2));
    text('h-exkl', fmtKr(b.exkl));
    text('h-moms', fmtKr(b.moms));
    text('h-tot', b.tot === null ? '–' : fmt(b.tot, 2));
    el('kontroll-resultat').innerHTML = kontrollHtml(b);
  }

  // Kontroller: kWh mot fakturan, belopp mot tidigare debiterat, och uppenbara fel.
  function kontrollHtml(b) {
    var d = data[valt], h = '';
    b.fel.forEach(function (f) { h += '<p class="varning">⚠ ' + htmlEscape(f) + '</p>'; });

    var fk = tolka(d.kwhFaktura);
    if (fk !== null && b.huvud !== null) {
      var diff = r2(b.huvud - fk);
      h += Math.abs(diff) <= 1
        ? '<p class="ok">✓ Huvudmätarens förbrukning (' + fmtKwh(b.huvud) + ' kWh) stämmer med fakturan (' + fmtKwh(fk) + ' kWh).</p>'
        : '<p class="varning">⚠ Huvudmätaren (' + fmtKwh(b.huvud) + ' kWh) avviker från fakturan (' + fmtKwh(fk) + ' kWh) med ' + fmt(diff, 2) + ' kWh.</p>';
    }
    if (typeof d.facit === 'number' && b.tot !== null) {
      var avv = b.tot - d.facit;
      h += Math.abs(avv) <= 2
        ? '<p class="ok">✓ Totalt ' + fmt(b.tot) + ' kr mot tidigare debiterat ' + fmt(d.facit) + ' kr (avvikelse ' + fmt(avv) + ' kr, avrundade mätarställningar).</p>'
        : '<p class="varning">⚠ Totalt ' + fmt(b.tot) + ' kr avviker från tidigare debiterat ' + fmt(d.facit) + ' kr med ' + fmt(avv) + ' kr.</p>';
    }
    if (h === '') { h = '<p>Fyll i utgående mätarställningar och priser för att se kontrollerna.</p>'; }
    return h;
  }

  function visa() {
    byggNav();
    fyllFalt();
    uppdateraBeraknat();
  }

  // ===================================================================
  // 5. Inmatning och knappar
  // ===================================================================
  function visaMeddelande(t) {
    var e = el('meddelande-u');
    e.textContent = t;
    window.clearTimeout(visaMeddelande.timer);
    visaMeddelande.timer = window.setTimeout(function () { e.textContent = ''; }, 6000);
  }

  function inmatning(e) {
    var id = e.target.id, v = e.target.value, d = data[valt];
    if (!id) { return; }
    var del = id.split('-');
    if (id === 'f-faktura') { d.faktura = v; }
    else if (id === 'f-nr') { d.nr = v; }
    else if (id === 'f-kwh') { d.kwhFaktura = v; }
    else if (del[0] === 'e' && d.e.hasOwnProperty(del[1])) { d.e[del[1]] = v; }
    else if (del[0] === 's' && arForstaManaden(valt)) { d.s[del[1]] = v; }
    else if (del[0] === 'p' && d.p.hasOwnProperty(del[1])) { d.p[del[1]] = v; }
    else { return; }
    spara();
    uppdateraBeraknat();
  }

  function nastaNyckel() {
    var k = nycklar();
    var sista = k[k.length - 1];
    var y = Number(sista.slice(0, 4)), m = Number(sista.slice(5, 7)) + 1;
    if (m > 12) { m = 1; y += 1; }
    return y + '-' + (m < 10 ? '0' : '') + m;
  }

  function nyManad() {
    var key = nastaNyckel();
    data[key] = { key: key, extra: true, faktura: '', nr: '', kwhFaktura: '', facit: null, s: {},
                  e: { huvud: '', herr: '', dam: '', varm: '' },
                  p: { rorlig: '', el: '', skatt: '36,00' } };
    valt = key;
    spara();
    visa();
    visaMeddelande('Ny månad tillagd: ' + manadsNamn(key) + '. Ingående mätarställningar hämtas från föregående månad.');
  }

  function aterstall() {
    var arFast = !data[valt].extra;
    if (!window.confirm(arFast
        ? 'Återställ ' + manadsNamn(valt) + ' till de fasta värdena? Det du själv har ändrat för månaden försvinner.'
        : 'Töm alla fält för ' + manadsNamn(valt) + '? Månaden finns kvar.')) { return; }
    var std = null;
    STANDARD.forEach(function (m) { if (m.key === valt) { std = kopia(m); } });
    if (std) {
      if (valt === '2026-01') { std.s = { huvud: '176911', herr: '25833', dam: '22118', varm: '669857' }; }
      data[valt] = std;
    } else {
      data[valt] = { key: valt, extra: true, faktura: '', nr: '', kwhFaktura: '', facit: null, s: {},
                     e: { huvud: '', herr: '', dam: '', varm: '' }, p: { rorlig: '', el: '', skatt: '36,00' } };
    }
    spara(); visa();
    visaMeddelande('Månaden är återställd.');
  }

  function taBort() {
    // Skydd: bara en tillagd månad, och bara den sista, kan tas bort. Fasta månader (jan–jun 2026) aldrig.
    var k = nycklar();
    if (!data[valt].extra || k[k.length - 1] !== valt) { return; }
    if (!window.confirm('Ta bort ' + manadsNamn(valt) + '? Månaden och det du fyllt i försvinner. Det går inte att ångra.')) { return; }
    delete data[valt];
    var k = nycklar();
    valt = k[k.length - 1];
    spara(); visa();
    visaMeddelande('Månaden är borttagen.');
  }

  // ===================================================================
  // 6. Kopiera underlaget (HTML + text) och skriv ut
  // ===================================================================
  var CELL = 'border:1px solid #999;padding:3px 8px;text-align:right;font-family:Arial,sans-serif;font-size:13px;';
  var CELL_V = 'border:1px solid #999;padding:3px 8px;text-align:left;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD = 'border:1px solid #999;padding:3px 8px;text-align:right;background:#eee;font-family:Arial,sans-serif;font-size:13px;';
  var HEAD_V = 'border:1px solid #999;padding:3px 8px;text-align:left;background:#eee;font-family:Arial,sans-serif;font-size:13px;';

  function tabell(huvud, rader) {
    var h = '<table style="border-collapse:collapse;margin-bottom:10px;"><thead><tr>';
    huvud.forEach(function (c, i) { h += '<th style="' + (i === 0 ? HEAD_V : HEAD) + '">' + htmlEscape(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    var t = huvud.join('\t') + '\n';
    rader.forEach(function (r) {
      h += '<tr>';
      r.forEach(function (c, i) { h += '<td style="' + (i === 0 ? CELL_V : CELL) + '">' + htmlEscape(c) + '</td>'; });
      h += '</tr>';
      t += r.join('\t') + '\n';
    });
    return { html: h + '</tbody></table>', text: t + '\n' };
  }

  function byggKopia() {
    var d = data[valt], b = berakna(valt), dt = datumText(valt);
    var rubrik = 'Debiteringsunderlag El ' + manadsNamn(valt);
    var rad1 = 'Kundnummer: 130869. Hela fakturan: ' + (d.faktura ? fmt(tolka(d.faktura)) : '–') + ' kr. Fakturanummer: ' + (d.nr || '–') + '.';
    function mrad(namn, f) { return [namn, fmtKwh(tolka(startText(valt, f))), fmtKwh(tolka(d.e[f])), fmtKwh(b[f])]; }
    var t1 = tabell(['Mätare', dt.start, dt.slut, 'Förbrukning (kWh)'], [
      mrad('Huvudmätare vid bryggfästet', 'huvud'),
      mrad('Mätare bastu herr', 'herr'),
      mrad('Mätare bastu dam', 'dam'),
      ['Mätare bastu TOT', '', '', fmtKwh(b.bastu)],
      mrad('Mätare varmvatten', 'varm')
    ]);
    var t2 = tabell(['Hyresgästens andel', 'kWh', 'öre/kWh', 'kr'], [
      ['Nätavgift, fast avgift', '0', '0', '0,00'],
      ['Nätavgift, rörlig', fmtKwh(b.hg), d.p.rorlig || '–', fmtKr(b.kr.rorlig)],
      ['El (spot + rörliga + påslag)', fmtKwh(b.hg), d.p.el || '–', fmtKr(b.kr.el)],
      ['Energiskatt', fmtKwh(b.hg), d.p.skatt || '–', fmtKr(b.kr.skatt)],
      ['Summa exkl moms', '', b.sumOre === null ? '–' : fmt(b.sumOre, 2), fmtKr(b.exkl)],
      ['Moms', '', '', fmtKr(b.moms)],
      ['Totalt', '', '', b.tot === null ? '–' : fmt(b.tot, 2)]
    ]);
    var not = 'Hyresgästen betalar ingen fast nätavgift. Siffrorna är hämtade ur Kraftringens fakturor och kontrollräknade mot dem i en tvåstegsgranskning. Hur restaurangens kWh delas upp är inte avgjort. Kontrollera mot källan. Sammanställd av Kent Lundgren.';
    return {
      html: '<div style="font-family:Arial,sans-serif;"><p style="font-size:16px;"><b>' + htmlEscape(rubrik) + '</b></p><p style="font-size:13px;">' +
            htmlEscape(rad1) + '</p>' + t1.html + t2.html + '<p style="font-size:12px;color:#555;">' + htmlEscape(not) + '</p></div>',
      text: rubrik + '\n' + rad1 + '\n\n' + t1.text + t2.text + not + '\n'
    };
  }

  function kopieraReserv(k) {
    var d = document.createElement('div');
    d.innerHTML = k.html;
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
    var k = byggKopia();
    var klart = function () { visaMeddelande('Underlaget är kopierat.'); };
    var misslyckad = function () { visaMeddelande('Kopieringen misslyckades. Markera underlaget och kopiera med Ctrl+C.'); };
    if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
      var item = new ClipboardItem({
        'text/html': new Blob([k.html], { type: 'text/html' }),
        'text/plain': new Blob([k.text], { type: 'text/plain' })
      });
      navigator.clipboard.write([item]).then(klart).catch(function () { (kopieraReserv(k) ? klart : misslyckad)(); });
    } else {
      (kopieraReserv(k) ? klart : misslyckad)();
    }
  }

  // Skriver bara ut underlaget: klassen skriv-underlag döljer jämförelsen i utskriftsstilen (CSS).
  function skrivUt() {
    document.body.classList.add('skriv-underlag');
    var klar = function () { document.body.classList.remove('skriv-underlag'); window.removeEventListener('afterprint', klar); };
    window.addEventListener('afterprint', klar);
    window.print();
    window.setTimeout(klar, 1500);   // reserv om afterprint inte utlöses
  }

  // ===================================================================
  // 7. Start
  // ===================================================================
  function start() {
    las();
    visa();
    el('ark').addEventListener('input', inmatning);
    el('manadsval').addEventListener('click', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-key');
      if (k && data[k]) { valt = k; spara(); visa(); }
      else if (e.target && e.target.id === 'btn-ny') { nyManad(); }
    });
    el('btn-u-kopiera').addEventListener('click', kopiera);
    el('btn-u-skriv').addEventListener('click', skrivUt);
    el('btn-u-aterstall').addEventListener('click', aterstall);
    el('btn-u-ta-bort').addEventListener('click', taBort);
  }

  start();
})();
