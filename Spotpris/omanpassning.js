/*
  omanpassning.js
  Bygger tabeller, diagram och de texter som innehåller siffror på omanpassning.html, ur window.OMANPASSNING (data/omanpassning_data.js).
  Sidan räknar inte själv: alla tal kommer från omanpassa_m4b.py. Texterna med siffror skrivs här (inte för hand i HTML) så att de inte kan avvika från data.
  Diagrammen ritas som SVG av egen kod, inga bibliotek.

  ES-nivå: ES2015 (const/let, mallsträngar, pilfunktioner). Inget ES2023 används.

  UPPDATERING 2026-10-08: Första versionen (1.0).
*/
(function () {
  'use strict';

  var VERSION = '1.0';
  var VERSIONSDATUM = '2026-10-08';
  var D = window.OMANPASSNING;
  if (!D) {
    document.getElementById('kort').textContent = 'Data saknas (data/omanpassning_data.js kunde inte läsas).';
    return;
  }
  var BLIND = (window.FORUTSAGELSE && window.FORUTSAGELSE.manader) ? window.FORUTSAGELSE : null;   // det frusna blindprovet (valfritt)
  var SVGNS = 'http://www.w3.org/2000/svg';

  // ---------------------------------------------------------------------------------------------------------------
  // Hjälpfunktioner
  // ---------------------------------------------------------------------------------------------------------------
  var MANAD = { '01': 'Januari', '02': 'Februari', '03': 'Mars', '04': 'April', '05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'Augusti', '09': 'September' };
  var KORT = { '01': 'jan', '02': 'feb', '03': 'mar', '04': 'apr', '05': 'maj', '06': 'jun', '07': 'jul', '08': 'aug', '09': 'sep', '10': 'okt', '11': 'nov', '12': 'dec' };
  function mnamn(m) { return MANAD[m.slice(5)] + ' ' + m.slice(0, 4); }
  function mkort(m) { return KORT[m.slice(5)]; }

  // Tal med decimalkomma och riktigt minustecken. plus = true ger "+" framför positiva tal (för fel).
  function fmt(x, d, plus) {
    if (x === null || x === undefined) { return '–'; }
    d = (d === undefined) ? 2 : d;
    var s = Math.abs(x).toFixed(d).replace('.', ',');
    if (Number(Math.abs(x).toFixed(d)) === 0) { return s; }
    return (x < 0 ? '\u2212' : (plus ? '+' : '')) + s;
  }
  function heltal(x) { return Math.round(x).toLocaleString('sv-SE').replace(/\u00a0/g, ' '); }

  function el(namn, attr, text) {
    var e = document.createElementNS(SVGNS, namn);
    Object.keys(attr || {}).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (text !== undefined) { e.textContent = text; }
    return e;
  }
  function html(id, h) { document.getElementById(id).innerHTML = h; }
  function rad(celler, klass) {
    var tr = document.createElement('tr');
    if (klass) { tr.className = klass; }
    tr.innerHTML = celler.join('');
    return tr;
  }
  function td(text, klass) { return '<td' + (klass ? ' class="' + klass + '"' : '') + '>' + text + '</td>'; }

  function bo(p) { return p.bo.replace(':', '.'); }
  function varmText(p) { return p.varm === '24h' ? 'dygnet runt' : 'enligt öppettiderna'; }
  function kombText(p) { return 'bastu ' + bo(p) + ', förberedelse ' + fmt(p.prep_timmar, 0) + ' h, varmvatten ' + (p.varm === '24h' ? 'dygnet runt' : 'enl. öppettider') + ', V ' + fmt(p.V_kw, 0) + ' kW'; }

  var M = D.manader;                                    // ['2026-01', ..., '2026-09']
  var PM = D.per_manad;
  var S = D.sammanfattning;
  var K = D.kriterier;
  var P1 = D.ver1.parametrar, P2 = D.ver2.parametrar;
  var JJ = D.anpassningsmanader_ver1;                   // januari–juni
  var JS = M.filter(function (m) { return JJ.indexOf(m) < 0; });   // juli–september
  var ENKEL_STORT = 3.0;                                // markera fel över gränsen K1 i tabell D

  // ---------------------------------------------------------------------------------------------------------------
  // Kort: det viktigaste
  // ---------------------------------------------------------------------------------------------------------------
  function byggKort() {
    var k1 = K.K1_passning, k2 = K.K2_leave_one_out, k3 = K.K3_framatprov;
    var bara_bo = (P1.pre_timmar === P2.pre_timmar && P1.prep_timmar === P2.prep_timmar && P1.varm === P2.varm && P1.V_kw === P2.V_kw);
    var h = '';
    h += '<p><strong>Omanpassning</strong> betyder här att samma modell (M4b) får välja sina inställningar på nio månader, januari–september, i stället för sex, januari–juni. Modellens form ändras inte.</p>';
    h += '<ul>';
    h += '<li><strong>Vad valdes?</strong> ' + (bara_bo
      ? 'Samma inställningar som förut, utom att bastun öppnar ' + bo(P2) + ' i stället för ' + bo(P1) + '. Restaurangens förberedelse (' + fmt(P2.prep_timmar, 0) + ' h), varmvatten ' + varmText(P2) + ' och baslasten (' + fmt(P2.V_kw, 0) + ' kW) är oförändrade.'
      : 'Ver. 2: ' + kombText(P2) + '. Ver. 1: ' + kombText(P1) + '.') + '</li>';
    h += '<li><strong>Passar den bättre?</strong> På alla nio månader sjunker RMS-felet från ' + fmt(S.jan_sep.fel_ver1.rms) + ' till ' + fmt(S.jan_sep.fel_ver2.rms) +
      ' öre/kWh. På januari–juni blir det något sämre (' + fmt(S.jan_jun.fel_ver1.rms) + ' till ' + fmt(S.jan_jun.fel_ver2.rms) + '), på juli–september bättre (' + fmt(S.jul_sep.fel_ver1.rms) + ' till ' + fmt(S.jul_sep.fel_ver2.rms) +
      '). Det senare är passning, eftersom ver. 2 har sett de månaderna.</li>';
    h += '<li><strong>Förutsäger den bättre?</strong> I framåtprovet (anpassa på månaderna före, förutsäg nästa) är RMS-felet ' + fmt(k3.utfall_rms) + ' öre/kWh för ver. 2, mot ' + fmt(S.jul_sep.fel_ver1.rms) +
      ' för ver. 1 med samma indata. Bara tre månader, och juli är identisk för de två versionerna.</li>';
    h += '<li><strong>Kriterierna</strong> (skrivna före körningen): passning ' + (k1.uppfyllt ? 'uppfyllt' : '<strong>ej uppfyllt</strong>') + ' (största fel ' + fmt(k1.utfall) + ' mot gränsen ' + fmt(k1.grans, 1) + '), leave-one-out ' +
      (k2.uppfyllt ? 'uppfyllt' : 'ej uppfyllt') + ' (' + fmt(k2.utfall) + ' mot ' + fmt(k2.grans, 1) + '), framåtprov ' + (k3.uppfyllt ? 'uppfyllt' : 'ej uppfyllt') + ' (största ' + fmt(k3.utfall_max) + ' mot ' + fmt(k3.grans_max, 1) + ', RMS ' + fmt(k3.utfall_rms) + ' mot ' + fmt(k3.grans_rms) + ').</li>';
    h += '<li><strong>Beslut enligt den förutbestämda regeln:</strong> ' + (K.alla_uppfyllda ? D.beslutsregel.alla_uppfyllda : D.beslutsregel.nagon_ej_uppfylld) + ' ' + D.beslutsregel.oavsett_utfall + '</li>';
    h += '<li><strong>Det viktigaste att förstå:</strong> felen i enskilda månader blev inte mindre än omkring tre öre/kWh. Det som begränsar är inte inställningarna utan modellens form (se avsnittet om vad resultatet säger).</li>';
    h += '</ul>';
    html('kort', h);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Tabell A: modellerna
  // ---------------------------------------------------------------------------------------------------------------
  function byggModeller() {
    var tb = document.querySelector('#tab-modeller tbody');
    // ingar = tre sanningsvärden (jan–jun, jul–sep, jan–sep): ● när ALLA månader i perioden ingick i anpassningen
    function celler(fk, ingar) {
      return ['jan_jun', 'jul_sep', 'jan_sep'].map(function (e, i) {
        return td(fmt(S[e][fk].rms) + (ingar[i] ? ' ●' : ''), '');
      }).join('');
    }
    var rader = [
      ['<td><strong>M1</strong></td>', '<td class="vansterjust">Medelvärdet av alla kvartar i månaden.</td>', td('0'), celler('fel_m1', [false, false, false])],
      ['<td><strong>M2</strong></td>', '<td class="vansterjust">Medelvärdet av kvartarna 06.00–22.00.</td>', td('0'), celler('fel_m2', [false, false, false])],
      ['<td><strong>M4a</strong></td>', '<td class="vansterjust">Priset viktat mot en modellerad förbrukning enligt antagna öppettider, utan baslast (V = 0). Inget väljs mot fakturan.</td>', td('0'), celler('fel_m4a', [false, false, false])],
      ['<td><strong>M4b ver. 1</strong></td>', '<td class="vansterjust">Som M4a, men fyra inställningar väljs så att passningen mot fakturan på <strong>januari–juni</strong> blir bäst.</td>', td('4'), celler('fel_ver1', [true, false, false])],
      ['<td><strong>M4b ver. 2</strong></td>', '<td class="vansterjust">Samma modell, men inställningarna väljs på <strong>januari–september</strong>.</td>', td('4'), celler('fel_ver2', [true, true, true])],
      ['<td><strong>M3</strong></td>', '<td class="vansterjust">Spotpriset viktat mot verklig förbrukning per kvart. <em>Inte byggd:</em> förbrukning per kvart saknas.</td>', td('–'), td('–') + td('–') + td('–')]
    ];
    rader.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = r.join('');
      tb.appendChild(tr);
    });
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Figur 1: vilka månader som anpassar (A) och prövar (T)
  // ---------------------------------------------------------------------------------------------------------------
  function figur1() {
    var rader = [
      { namn: 'Ver. 1 (frusen 2026-10-07)', celler: celltyper(0, 6, 6, 9) },
      { namn: 'Ver. 2 (frusen 2026-10-08)', celler: celltyper(0, 9, 9, 12) },
      { namn: 'Framåtprov: förutsäg juli', celler: celltyper(0, 6, 6, 7) },
      { namn: 'Framåtprov: förutsäg augusti', celler: celltyper(0, 7, 7, 8) },
      { namn: 'Framåtprov: förutsäg september', celler: celltyper(0, 8, 8, 9) },
      { namn: 'Leave-one-out (exempel: utan maj)', celler: celltyper(0, 9, 4, 5, true) }
    ];
    // celltyper(fran, aTill, tFran, tTill): A för månad i [fran, aTill), T för månad i [tFran, tTill). Med ritaHal: leave-one-out, där A är alla utom T.
    function celltyper(fran, aTill, tFran, tTill, hal) {
      var c = [];
      for (var i = 0; i < 12; i++) {
        if (hal) { c.push(i === tFran ? 'T' : (i < aTill ? 'A' : '-')); }
        else if (i >= tFran && i < tTill) { c.push('T'); }
        else if (i >= fran && i < aTill) { c.push('A'); }
        else { c.push('-'); }
      }
      return c;
    }
    var vl = 250, cb = 50, rh = 28, topp = 28;
    var w = vl + 12 * cb + 10, h = topp + rader.length * rh + 40;
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'diagram', role: 'img', 'aria-label': 'Schema över vilka månader som används för anpassning och prov' });
    ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'].forEach(function (m, i) {
      svg.appendChild(el('text', { x: vl + i * cb + cb / 2, y: 18, 'text-anchor': 'middle', 'class': 'liten-text' }, m));
    });
    var farg = { A: '#1f5f5b', T: '#2a7fc4', '-': '#e3e8e7' };
    rader.forEach(function (r, ri) {
      var y = topp + ri * rh;
      svg.appendChild(el('text', { x: 4, y: y + 18, 'class': 'mellan-text' }, r.namn));
      r.celler.forEach(function (c, i) {
        svg.appendChild(el('rect', { x: vl + i * cb + 1, y: y + 2, width: cb - 2, height: rh - 4, rx: 3, fill: farg[c] }));
        if (c !== '-') { svg.appendChild(el('text', { x: vl + i * cb + cb / 2, y: y + 19, 'text-anchor': 'middle', fill: '#fff', style: 'fill:#fff;font-weight:700;font-size:12px' }, c)); }
      });
    });
    var yl = topp + rader.length * rh + 18;
    [['A', 'Anpassning (modellen får se månaden)'], ['T', 'Prov (modellen ser inte månaden)'], ['-', 'Används inte']].forEach(function (l, i) {
      var x = 10 + i * 280;
      svg.appendChild(el('rect', { x: x, y: yl - 10, width: 14, height: 14, rx: 3, fill: farg[l[0]] }));
      svg.appendChild(el('text', { x: x + 20, y: yl + 2, 'class': 'liten-text' }, l[1]));
    });
    document.getElementById('fig1').appendChild(svg);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // "Vad som gjordes"
  // ---------------------------------------------------------------------------------------------------------------
  function byggGjort() {
    var andel = JS.map(function (m) { return Math.round(100 * PM[m].kwh.varmvatten / (PM[m].kwh.bastu + PM[m].kwh.varmvatten)); });
    var steg = [
      '<strong>Kriterierna skrevs först.</strong> Innan något kördes skrevs det ned vad som skulle räknas som godkänt (<a href="data/omanpassning_kriterier.json">omanpassning_kriterier.json</a>). ' +
      'Skälet: när gränserna för ver. 1 först sattes till 2,0 och 4,0 och sedan ändrades till 3,0 och 4,5 efter att utfallet var känt (SPEC avsnitt 6.4) blev de ett skydd mot försämring och inget bevis. Det ska inte upprepas. ' +
      'Gränserna 3,0 och 4,5 är oförändrade. Det som är nytt är framåtprovet. Förslaget till kriterier är skrivet av AI-assistenten, och det står i filen att de inte är oberoende av vad som redan var känt.',
      '<strong>Indata för juli–september togs ur debiteringsunderlagen.</strong> Det frusna blindprovet gissade att ' + 'varmvattnet var 23 procent av "bad" i juli–september. Underlagen har mätarställningar, och de ger ' + andel.join(', ') + ' procent. ' +
      'Det är alltså en ändring av indata, inte av modellen, och den förklarar en del av skillnaden mellan blindprovets fel och felen i tabell D.',
      '<strong>Kontroll av skriptet.</strong> Samma sökning på bara januari–juni måste ge exakt ver. 1 (samma kombination och samma RMS). Annars avbryter skriptet. Det visar att omanpassningen är samma modell som förut.',
      '<strong>Omanpassningen.</strong> Samma sökrum (252 kombinationer, ' + D.antal_giltiga + ' fysiskt möjliga), samma urvalsregel (lägst RMS) och samma modell, men på alla nio månader. Inget i sökrummet ändrades för att nå kriterierna.',
      '<strong>Tre prov</strong> (tabell F och G): passning, leave-one-out och framåtprov med växande fönster.',
      '<strong>Utvärdering mot kriterierna,</strong> och beslut enligt regeln som skrevs i förväg (tabell E).',
      '<strong>Frysning.</strong> Ver. 2:s inställningar är frusna med datum. Oktober förutsägs med både ver. 1 och ver. 2 innan fakturan läses, och först efter oktober, november och december bedöms vilken som är bäst.',
      '<strong>Det som inte rördes.</strong> Ver. 1, blindprovets förutsägelser och Spotpris-sidans tabeller ligger kvar oförändrade, så att blindprovet förblir ett blindprov.'
    ];
    html('gjort-lista', steg.map(function (s) { return '<li>' + s + '</li>'; }).join(''));
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Tabell C, D, E, F, G
  // ---------------------------------------------------------------------------------------------------------------
  function byggVal() {
    var tb = document.querySelector('#tab-val tbody');
    [['Ver. 1', P1, D.ver1.rms_pa_jan_jun, 'januari–juni'], ['Ver. 2', P2, D.ver2.rms, 'januari–september']].forEach(function (v) {
      tb.appendChild(rad([td('<strong>' + v[0] + '</strong>'), td(bo(v[1])), td(fmt(v[1].prep_timmar, 0) + ' h'), td(varmText(v[1])), td(fmt(v[1].V_kw, 0) + ' kW'), td(fmt(v[2]) + ' (' + v[3] + ')')]));
    });
  }

  function byggFel() {
    var tb = document.querySelector('#tab-fel tbody'), tf = document.querySelector('#tab-fel tfoot');
    M.forEach(function (m) {
      var v = PM[m];
      var blind = null;
      if (BLIND && BLIND.facit && BLIND.facit[m] && BLIND.manader[m]) { blind = BLIND.manader[m].m4b_ore - BLIND.facit[m].spot_ore; }
      function c(x, extra) { return td(fmt(x, 2, true), ((x !== null && Math.abs(x) > ENKEL_STORT) ? 'stort ' : '') + (extra || '')); }
      tb.appendChild(rad([td(mnamn(m)), td(fmt(v.faktura_ore)), c(v.fel_m1), c(v.fel_m2), c(v.fel_m4a), c(v.fel_ver1, 'm4b'), c(v.fel_ver2, 'm4b'), blind === null ? td('') : c(blind)],
        JJ.indexOf(m) < 0 ? 'blind' : ''));
    });
    [['jan_jun', 'RMS januari–juni'], ['jul_sep', 'RMS juli–september'], ['jan_sep', 'RMS januari–september']].forEach(function (e) {
      var s = S[e[0]];
      var blindrms = '';
      if (e[0] === 'jul_sep' && BLIND && BLIND.facit) {
        var f = JS.map(function (m) { return BLIND.manader[m].m4b_ore - BLIND.facit[m].spot_ore; });
        blindrms = fmt(Math.sqrt(f.reduce(function (a, x) { return a + x * x; }, 0) / f.length));
      }
      tf.appendChild(rad([td(e[1]), td(''), td(fmt(s.fel_m1.rms)), td(fmt(s.fel_m2.rms)), td(fmt(s.fel_m4a.rms)), td(fmt(s.fel_ver1.rms), 'm4b'), td(fmt(s.fel_ver2.rms), 'm4b'), td(blindrms)]));
    });
    html('fel-not',
      'Blå rader: månader som inte ingick i ver. 1:s anpassning (för ver. 1 är de blindprov, men fördelningen mellan bastu och varmvatten är här den verkliga). ' +
      '<sup>1</sup> Felet för ver. 1 i det frusna blindprovet, där fördelningen mellan bastu och varmvatten var antagen. Skillnaden mot kolumnen "Fel M4b ver. 1" beror alltså bara på indata (fördelningen), inte på modellen. ' +
      'M2 är nästan lika bra som M4b på sommarmånaderna (RMS ' + fmt(S.jul_sep.fel_m2.rms) + ' mot ' + fmt(S.jul_sep.fel_ver2.rms) + ' för ver. 2) men mycket sämre på vintern och våren (' + fmt(S.jan_jun.fel_m2.rms) + ' mot ' + fmt(S.jan_jun.fel_ver2.rms) + ').');
  }

  function byggKriterier() {
    var tb = document.querySelector('#tab-kriterier tbody');
    var k1 = K.K1_passning, k2 = K.K2_leave_one_out, k3 = K.K3_framatprov;
    function res(ok) { return '<td class="' + (ok ? 'ok' : 'ejok') + '">' + (ok ? '✓ uppfyllt' : '✗ ej uppfyllt') + '</td>'; }
    function vj(t) { return '<td class="vansterjust">' + t + '</td>'; }
    tb.appendChild(rad([vj('<strong>K1</strong> Passning'), vj('Största absoluta fel för den valda kombinationen på de nio månaderna'), td('≤ ' + fmt(k1.grans, 1)), td(fmt(k1.utfall)), res(k1.uppfyllt)]));
    tb.appendChild(rad([vj('<strong>K2</strong> Leave-one-out'), vj('Största absoluta fel när varje månad förutsägs av en anpassning på de övriga'), td('≤ ' + fmt(k2.grans, 1)), td(fmt(k2.utfall) + (k2.antal_saknas ? ' (' + k2.antal_saknas + ' månad saknas)' : '')), res(k2.uppfyllt)]));
    tb.appendChild(rad([vj('<strong>K3a</strong> Framåtprov, största fel'), vj('Största absoluta fel i tre förutsägelser: juli, augusti, september'), td('≤ ' + fmt(k3.grans_max, 1)), td(fmt(k3.utfall_max)), res(k3.uppfyllt_max)]));
    tb.appendChild(rad([vj('<strong>K3b</strong> Framåtprov, RMS'), vj('RMS över de tre förutsägelserna ska vara lägre än det frusna blindprovets RMS'), td('< ' + fmt(k3.grans_rms)), td(fmt(k3.utfall_rms)), res(k3.uppfyllt_rms)]));
    html('kriterier-not',
      'Resultat: ' + (K.alla_uppfyllda ? 'alla kriterier uppfyllda.' : '<strong>ett av kriterierna (K1) är inte uppfyllt</strong>, och därmed är inte beslutsregelns villkor "alla uppfyllda" uppfyllt.') +
      ' K1 missades med ' + fmt(k1.utfall - k1.grans) + ' öre/kWh i ' + worstMonth(2) + '. Kriteriet gäller det urval som är bestämt i förväg (lägst RMS, "U1"). Det alternativa urvalet som minimerar det största felet ("U2") ger ' + fmt(D.u2.storsta_absolutfel) +
      ' öre/kWh, alltså precis under gränsen. Det byts inte till i efterhand: gränsen avgjordes för U1. Men det visar att ingen kombination av de fyra inställningarna klarar sig mycket under 3 öre/kWh i varje månad.');
  }
  function worstMonth() {
    var best = M[0];
    M.forEach(function (m) { if (Math.abs(PM[m].fel_ver2) > Math.abs(PM[best].fel_ver2)) { best = m; } });
    return mnamn(best).toLowerCase().replace(/\s+\d{4}/, '');
  }

  function byggProv() {
    var tf = document.querySelector('#tab-framat tbody');
    Object.keys(D.framatprov).forEach(function (m) {
      var f = D.framatprov[m];
      var a = f.tranad_pa.split(' till ');
      tf.appendChild(rad([td(mnamn(m)), '<td class="vansterjust">' + mkort(a[0]) + '–' + mkort(a[1]) + ' (' + f.antal_tranings_manader + ' månader)</td>', '<td class="vansterjust">' + kombText(f.parametrar) + '</td>',
        td(fmt(f.forutsagt_ore)), td(fmt(f.faktura_ore)), td(fmt(f.fel_ore, 2, true))]));
    });
    var tl = document.querySelector('#tab-loo tbody');
    M.forEach(function (m) {
      var l = D.leave_one_out[m];
      tl.appendChild(rad([td(mnamn(m)), '<td class="vansterjust">' + kombText(l.parametrar) + '</td>', l.fel_ore === null ? '<td>saknas</td>' : td(fmt(l.fel_ore, 2, true))]));
    });
    var saknas = K.K2_leave_one_out.saknas_manader.map(function (m) { return mnamn(m).toLowerCase().replace(/\s+\d{4}/, ''); });
    html('loo-not',
      (saknas.length ? 'Månader som saknas: ' + saknas.join(', ') + '. När månaden utelämnas väljer anpassningen en baslast som är större än vad den utelämnade månadens restpost rymmer ' +
        '(' + fmt(D.bast_v_ver1['2026-03'].rest_kwh_per_timme, 1) + ' kW i snitt i mars), så kombinationen är omöjlig för just den månaden. Någon annan kombination väljs inte i stället (SPEC avsnitt 6.3). ' : '') +
      'Bastun öppnar ' + bo(P2) + ' i ' + Object.keys(D.leave_one_out).filter(function (m) { return D.leave_one_out[m].parametrar && D.leave_one_out[m].parametrar.bo === P2.bo; }).length + ' av ' + M.length + ' leave-one-out-anpassningar, och ' +
      bo(P1) + ' i ' + Object.keys(D.leave_one_out).filter(function (m) { return D.leave_one_out[m].parametrar && D.leave_one_out[m].parametrar.bo === P1.bo; }).length + '. I framåtprovet väljs ' + bo(P1) +
      ' för ' + Object.keys(D.framatprov).filter(function (m) { return D.framatprov[m].parametrar.bo === P1.bo; }).map(function (m) { return mnamn(m).toLowerCase().replace(/\s+\d{4}/, ''); }).join(', ') + ' (den förutsägelsen är identisk med ver. 1).');
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Figur 2: staplar per månad
  // ---------------------------------------------------------------------------------------------------------------
  function figur2() {
    var w = 900, h = 330, l = 54, r = 16, t = 20, b = 44;
    var ymin = -5, ymax = 5;
    var pw = w - l - r, ph = h - t - b;
    function X(i) { return l + (i + 0.5) * pw / M.length; }
    function Y(v) { return t + (ymax - v) * ph / (ymax - ymin); }
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'diagram', role: 'img', 'aria-label': 'Fel per månad för ver. 1 och ver. 2' });
    // bakgrund för månader utan i ver. 1:s anpassning
    var forsta = M.indexOf(JS[0]);
    svg.appendChild(el('rect', { x: l + forsta * pw / M.length, y: t, width: (M.length - forsta) * pw / M.length, height: ph, fill: '#e3f0fb' }));
    svg.appendChild(el('text', { x: l + forsta * pw / M.length + 6, y: t + 14, 'class': 'liten-text' }, 'Ingick inte i ver. 1:s anpassning'));
    for (var v = ymin; v <= ymax; v += 1) {
      svg.appendChild(el('line', { x1: l, x2: w - r, y1: Y(v), y2: Y(v), 'class': v === 0 ? 'axel' : 'rutnat' }));
      svg.appendChild(el('text', { x: l - 6, y: Y(v) + 4, 'text-anchor': 'end', 'class': 'liten-text' }, fmt(v, 0, true)));
    }
    [ENKEL_STORT, -ENKEL_STORT].forEach(function (g) {
      svg.appendChild(el('line', { x1: l, x2: w - r, y1: Y(g), y2: Y(g), stroke: '#a3261b', 'stroke-dasharray': '6 4', 'stroke-width': 1.2 }));
    });
    svg.appendChild(el('text', { x: w - r - 4, y: Y(ENKEL_STORT) - 4, 'text-anchor': 'end', 'class': 'liten-text', style: 'fill:#a3261b' }, 'gräns K1 ±' + fmt(ENKEL_STORT, 1)));
    var bw = 18;
    M.forEach(function (m, i) {
      [[PM[m].fel_ver1, -bw, '#8aa3a0'], [PM[m].fel_ver2, 0, '#1f5f5b']].forEach(function (s) {
        var y0 = Y(0), y1 = Y(s[0]);
        svg.appendChild(el('rect', { x: X(i) + s[1], y: Math.min(y0, y1), width: bw - 2, height: Math.max(1, Math.abs(y1 - y0)), fill: s[2] }));
        svg.appendChild(el('text', { x: X(i) + s[1] + (bw - 2) / 2, y: s[0] >= 0 ? y1 - 3 : y1 + 11, 'text-anchor': 'middle', 'class': 'liten-text' }, fmt(s[0], 1, true)));
      });
      svg.appendChild(el('text', { x: X(i), y: h - 24, 'text-anchor': 'middle', 'class': 'mellan-text' }, mkort(m)));
    });
    svg.appendChild(el('text', { x: 14, y: t + ph / 2, 'class': 'liten-text', transform: 'rotate(-90 14 ' + (t + ph / 2) + ')', 'text-anchor': 'middle' }, 'fel, öre/kWh'));
    [['#8aa3a0', 'Ver. 1'], ['#1f5f5b', 'Ver. 2']].forEach(function (s, i) {
      svg.appendChild(el('rect', { x: l + i * 90, y: h - 14, width: 12, height: 12, fill: s[0] }));
      svg.appendChild(el('text', { x: l + i * 90 + 18, y: h - 4, 'class': 'liten-text' }, s[1]));
    });
    document.getElementById('fig2').appendChild(svg);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Figur 3: RMS mot baslast V
  // ---------------------------------------------------------------------------------------------------------------
  function figur3() {
    var w = 900, h = 320, l = 54, r = 16, t = 16, b = 52;
    var pw = w - l - r, ph = h - t - b;
    var ymax = 4.2;
    function X(v) { return l + (v + 0.5) * pw / 21; }
    function Y(v) { return t + (ymax - v) * ph / ymax; }
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'diagram', role: 'img', 'aria-label': 'Lägsta RMS-fel för varje baslast' });
    var marsKw = D.bast_v_ver1['2026-03'].rest_kwh_per_timme;
    // ogiltigt område: V större än restposten i mars
    var xg = X(Math.floor(marsKw) + 0.5);
    svg.appendChild(el('rect', { x: xg, y: t, width: w - r - xg, height: ph, fill: '#eceff1' }));
    svg.appendChild(el('text', { x: xg + 8, y: t + 16, 'class': 'liten-text' }, 'Omöjligt: baslasten ryms inte i restposten i mars'));
    svg.appendChild(el('text', { x: xg + 8, y: t + 30, 'class': 'liten-text' }, '(restposten är ' + fmt(marsKw, 1) + ' kW i snitt)'));
    for (var y = 0; y <= 4; y += 1) {
      svg.appendChild(el('line', { x1: l, x2: w - r, y1: Y(y), y2: Y(y), 'class': y === 0 ? 'axel' : 'rutnat' }));
      svg.appendChild(el('text', { x: l - 6, y: Y(y) + 4, 'text-anchor': 'end', 'class': 'liten-text' }, String(y)));
    }
    for (var v = 0; v <= 20; v += 2) { svg.appendChild(el('text', { x: X(v), y: h - 28, 'text-anchor': 'middle', 'class': 'liten-text' }, String(v))); }
    svg.appendChild(el('text', { x: l + pw / 2, y: h - 12, 'text-anchor': 'middle', 'class': 'mellan-text' }, 'baslast V (kW)'));
    svg.appendChild(el('text', { x: 14, y: t + ph / 2, 'class': 'liten-text', transform: 'rotate(-90 14 ' + (t + ph / 2) + ')', 'text-anchor': 'middle' }, 'lägsta RMS-fel, öre/kWh'));
    [[D.rms_mot_v.jan_jun, '#8aa3a0', 'januari–juni (ver. 1)'], [D.rms_mot_v.jan_sep, '#1f5f5b', 'januari–september (ver. 2)']].forEach(function (s, i) {
      var pts = s[0].filter(function (p) { return p.rms_ore !== null; });
      svg.appendChild(el('polyline', { points: pts.map(function (p) { return X(p.V_kw) + ',' + Y(p.rms_ore); }).join(' '), fill: 'none', stroke: s[1], 'stroke-width': 2.5 }));
      pts.forEach(function (p) { svg.appendChild(el('circle', { cx: X(p.V_kw), cy: Y(p.rms_ore), r: 3, fill: s[1] })); });
      var sist = pts[pts.length - 1];
      svg.appendChild(el('text', { x: X(sist.V_kw) + 8, y: Y(sist.rms_ore) + 4, 'class': 'liten-text' }, fmt(sist.rms_ore) + ' vid ' + sist.V_kw + ' kW'));
    });
    document.getElementById('fig3').appendChild(svg);
    var tf = document.createElement('div');
    tf.className = 'tf';
    tf.innerHTML = '<span style="--c:#8aa3a0">januari–juni (ver. 1)</span><span style="--c:#1f5f5b">januari–september (ver. 2)</span><span style="--c:#eceff1">omöjligt område</span>';
    document.getElementById('fig3').appendChild(tf);
    var bv = D.bast_v_ver2, vals = M.map(function (m) { return bv[m].V_bast_kw; });
    html('fig3-text',
      'RMS-felet sjunker för varje kilowatt baslast hela vägen upp till ' + Math.floor(marsKw) + ' kW, för båda uppsättningarna månader. ' + (Math.floor(marsKw) + 1) + ' kW är omöjligt eftersom restposten i mars bara är ' + fmt(marsKw, 1) +
      ' kW i snitt. Det är alltså inte data som väljer ' + fmt(P2.V_kw, 0) + ' kW, utan den största baslast som mars tillåter. Och om man för varje månad för sig frågar vilken baslast som hade passat bäst (med övriga inställningar som i ver. 2) blir svaret ' +
      fmt(Math.min.apply(null, vals), 1) + ' kW för den lägsta månaden och ' + fmt(Math.max.apply(null, vals), 1) + ' kW för den högsta, utan tydligt samband med årstiden. En enda konstant baslast beskriver alltså inte verkligheten särskilt väl.');
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Tolkning, nästa steg
  // ---------------------------------------------------------------------------------------------------------------
  function byggTolkning() {
    var batt2 = [], batt1 = [];
    M.forEach(function (m) {
      var a = Math.abs(PM[m].fel_ver1), c = Math.abs(PM[m].fel_ver2);
      if (Math.abs(a - c) < 0.1) { return; }
      (c < a ? batt2 : batt1).push(mkort(m));
    });
    var h = '';
    h += '<div class="mattbox"><h3>Mätt</h3><ul>';
    h += '<li>Ver. 2 skiljer sig från ver. 1 bara i när bastun öppnar (' + bo(P2) + ' mot ' + bo(P1) + '). Ver. 2 ger lägre fel i ' + batt2.join(', ') + ', ver. 1 i ' + batt1.join(', ') + ' (skillnader under 0,1 öre/kWh räknas som lika).</li>';
    h += '<li>På de nio månaderna finns ' + D.antal_i_band + ' kombinationer med RMS-fel under 1,5 öre/kWh och ' + D.antal_med_storsta_fel_max_2 + ' med största fel under 2,0. På januari–juni var det 7 respektive 1. Ingen kombination av de fyra inställningarna passar alla nio månader mycket bättre än ' + fmt(D.ver2.rms) + ' öre/kWh i RMS.</li>';
    h += '<li>Den bästa möjliga kombinationen med avseende på <em>största</em> fel (U2) har största fel ' + fmt(D.u2.storsta_absolutfel) + ' öre/kWh. Det är golvet för den här modellformen i det här sökrummet: ' + fmt(D.u2.storsta_absolutfel, 1) + ' öre/kWh i den sämsta månaden.</li>';
    h += '<li>Felen i ver. 2, januari till september: ' + M.map(function (m) { return fmt(PM[m].fel_ver2, 1, true); }).join(', ') + '. De ligger åt båda hållen och följer inte tydligt årstiden.</li>';
    var loo = M.map(function (m) { return D.leave_one_out[m].parametrar; }).filter(function (p) { return p; });
    function antalOlika(f) { var u = {}; loo.forEach(function (p) { u[f(p)] = true; }); return Object.keys(u).length; }
    h += '<li>I de ' + loo.length + ' leave-one-out-anpassningarna väljs det antal olika varianter som anges här: bastuns öppettid ' + antalOlika(function (p) { return p.bo; }) + ', baslast ' + antalOlika(function (p) { return p.V_kw; }) +
      ', restaurangens förberedelse ' + antalOlika(function (p) { return p.prep_timmar; }) + ' (av tre möjliga) och varmvattnets tider ' + antalOlika(function (p) { return p.varm; }) +
      ' (av två möjliga). Få varianter betyder att inställningen är väl bestämd av data, många att flera val ger nästan samma passning.</li>';
    h += '<li>Ver. 2:s förbättring jämfört med ver. 1, mätt som RMS på juli–september med samma indata, är ' + fmt(S.jul_sep.fel_ver1.rms) + ' till ' + fmt(S.jul_sep.fel_ver2.rms) + ' öre/kWh. I framåtprovet, där månaden inte sågs, är den ' + fmt(S.jul_sep.fel_ver1.rms) + ' till ' + fmt(K.K3_framatprov.utfall_rms) + ' öre/kWh, men det är tre månader och juli är densamma.</li>';
    h += '</ul></div>';
    h += '<div class="tolkbox"><h3>Tolkning (inte bevis)</h3><ul>';
    h += '<li><strong>Bastuns öppettid kan ha ändrats under året.</strong> Hemsidan anger 07.30 idag. Att ' + bo(P2) + ' passar de flesta månaderna från april och framåt bäst, och ' + bo(P1) + ' passar januari och februari bäst, skulle stämma med att bastun öppnade tidigare på vintern. ' +
      'Mönstret är inte rent (juni passar ' + bo(P1) + ' något bättre) och skillnaderna per månad är små. Att kontrollera: när bastun började öppna 07.30. Då kan öppettiden anges per månad i stället för att anpassas, vilket inte ger modellen någon ny inställning.</li>';
    h += '<li><strong>Baslasten pressas mot sin gräns.</strong> RMS-felet sjunker så länge baslasten växer, och stannar bara vid ' + fmt(P2.V_kw, 0) + ' kW för att mars inte rymmer mer. Det kan betyda att förbrukningen i verkligheten är jämnare över dygnet än modellen kan beskriva med öppettiderna, eller att baslasten varierar med årstiden.</li>';
    h += '<li><strong>Kvarstående fel på omkring tre öre/kWh</strong> i enskilda månader, åt båda hållen, tyder på att modellen saknar något som inte löses genom att välja om fyra tal. Det kan också delvis vara slump: nio månader räcker inte för att skilja ett mönster från brus. Vad som saknas vet ingen ännu. Förslagen i nästa avsnitt är hypoteser.</li>';
    h += '<li><strong>M2 är en seriös konkurrent på sommaren.</strong> Utan någon inställning ligger M2 på RMS ' + fmt(S.jul_sep.fel_m2.rms) + ' i juli–september, jämfört med ' + fmt(S.jul_sep.fel_ver2.rms) + ' för ver. 2 (som sett månaderna). M4b är klart bättre bara under vinter och vår (januari–juni: ' + fmt(S.jan_jun.fel_ver2.rms) + ' mot ' + fmt(S.jan_jun.fel_m2.rms) + ').</li>';
    h += '</ul></div>';
    html('tolkning', h);
  }

  function byggNasta() {
    var h = '';
    h += '<h3>Det som är bestämt</h3><ul>';
    h += '<li>Ver. 2:s inställningar är frusna (' + D.frusen_ver2.datum + '): ' + kombText(D.frusen_ver2.parametrar) + '.</li>';
    h += '<li>Oktober 2026 förutsägs med <strong>både ver. 1 och ver. 2</strong> innan fakturan läses. Sedan jämförs de. Först efter oktober, november och december, alltså tre nya månader, bedöms vilken som är bäst. Ver. 1 är referensen tills dess.</li>';
    h += '</ul>';
    h += '<h3>Det som skulle kunna göra modellen bättre (idéer, inget är gjort)</h3>';
    h += '<p>Varje idé ändrar modellens <em>form</em> och bör provas som ett nytt blindprov på nya månader. Fler inställningar mot färre månader ökar risken för över-anpassning.</p>';
    h += '<ol class="stegrad">';
    h += '<li><strong>Öppettider per månad.</strong> Om det går att belägga när bastun började öppna 07.30 kan modellen använda rätt tid per månad. Det är ett faktum att kontrollera, inte en ny inställning att anpassa. Billigaste förbättringen, om underlaget finns.</li>';
    h += '<li><strong>Baslast som skiljer sig mellan säsonger.</strong> En ny inställning (till exempel vinter och sommar). Kräver fler månader för att kunna provas.</li>';
    h += '<li><strong>Förbrukning per kvart eller timme (M3).</strong> Skulle ersätta antagandena med mätning, och göra M4b till något som kan jämföras med facit. Det är den förbättring som ger mest, och den enda som inte bygger på gissningar om hur byggnaden används.</li>';
    h += '</ol>';
    html('nasta', h);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------------------------------------------
  byggKort();
  byggModeller();
  figur1();
  byggGjort();
  byggVal();
  byggFel();
  figur2();
  byggKriterier();
  byggProv();
  figur3();
  byggTolkning();
  byggNasta();
  document.getElementById('version').textContent = VERSION;
  document.getElementById('versionsdatum').textContent = VERSIONSDATUM;
  document.getElementById('datadatum').textContent = D.metadata.genererad;
})();
