/*
  elpris_nov_kort.js
  Logik för Elpris_nov_2026_kort/index.html: ritar ett SVG-diagram över spotpriset i SE4 och spelar upp en animation:
  en pekare går igenom januari–oktober en månad i taget, rekordlinjen för augusti 2022 ritas in, och sedan slår novemberstapeln (dag 1–10) över toppen.
  Webbläsare som har minskad rörelse inställd (prefers-reduced-motion) får slutläget direkt, utan animation.
  Använder async/await (ES2017). Ingen kod med ES2023+ används. Inget nätverksanrop görs, ingenting sparas hos besökaren.

  TILLFÄLLIG sida skapad 2026-11-10 (tio dagar av november).

  UPPDATERING 2026-11-10: Första versionen (1.0).
*/
(function () {
  'use strict';

  var VERSION = '1.0';
  var VERSIONSDATUM = '2026-11-10';

  // Spotpris SE4, öre/kWh, månadsmedel januari–november 2026 (november = dag 1–10). Källa: Elbruk (2026), avläst 2026-11-10.
  var SE4 = [112.99, 113.28, 84.58, 66.55, 94.66, 103.72, 86.44, 80.47, 120.20, 157.30, 328.89];
  var AUG_2022 = 304.99;                       // Rekordmånaden, SE4. Källa: Elbruk (2022).
  var NAMN = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November'];
  var KORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'];

  var B = 760, H = 420, L = 46, R = 14, T = 46, BOT = 52, MAX = 350;
  var W = B - L - R, HH = H - T - BOT, STEG = W / SE4.length, BW = STEG * 0.62;

  function el(id) { return document.getElementById(id); }
  function fmt(x) { return x.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function yAv(v) { return T + HH - v / MAX * HH; }
  function xMitt(i) { return L + i * STEG + STEG / 2; }
  var minskadRorelse = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===================================================================
  // 1. Bygg diagrammet (SVG), allt dolt till att börja med
  // ===================================================================
  function bygg() {
    var s = '<svg viewBox="0 0 ' + B + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" focusable="false">';
    [0, 100, 200, 300].forEach(function (v) {
      var y = yAv(v);
      s += '<line x1="' + L + '" x2="' + (B - R) + '" y1="' + y + '" y2="' + y + '" stroke="#d6dedc"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" font-size="13" fill="#5a6868" text-anchor="end">' + v + '</text>';
    });
    s += '<text x="' + L + '" y="22" font-size="13" fill="#5a6868">öre/kWh, spotpris SE4</text>';
    SE4.forEach(function (v, i) {
      var nov = (i === 10), x = xMitt(i) - BW / 2, y = yAv(v), h = T + HH - y;
      s += '<g><title>' + (nov ? 'November, dag 1–10' : NAMN[i]) + ': ' + fmt(v) + ' öre/kWh</title>' +
           '<rect class="stapel' + (nov ? ' nov' : '') + '" id="s' + i + '" x="' + x + '" y="' + y + '" width="' + BW + '" height="' + h + '" rx="2" fill="' + (nov ? '#d9392b' : '#2a7fc4') + '"/></g>' +
           '<text class="varde" id="v' + i + '" x="' + xMitt(i) + '" y="' + (y - 7) + '" font-size="' + (nov ? 16 : 13) + '" font-weight="' + (nov ? 800 : 400) + '" fill="' + (nov ? '#d9392b' : '#1c2a2a') + '" text-anchor="middle">' + fmt(v) + '</text>' +
           '<text class="manad-namn" x="' + xMitt(i) + '" y="' + (T + HH + 18) + '" font-size="13" text-anchor="middle">' + KORT[i] + '</text>';
    });
    s += '<text class="nov-ledtext" id="nov-dagar" x="' + xMitt(10) + '" y="' + (T + HH + 34) + '" font-size="11" fill="#d9392b" text-anchor="middle">dag 1–10</text>';
    s += '<text class="nov-ledtext pulsar" id="nov-fraga" x="' + xMitt(10) + '" y="' + (yAv(170)) + '" font-size="38" font-weight="800" fill="#d9392b" text-anchor="middle">?</text>';
    var yr = yAv(AUG_2022);
    s += '<g class="rekordlinje" id="rekord"><line x1="' + L + '" x2="' + (B - R) + '" y1="' + yr + '" y2="' + yr + '" stroke="#d9392b" stroke-width="2"/>' +
         '<text x="' + (L + 8) + '" y="' + (yr - 8) + '" font-size="14" font-weight="700" fill="#d9392b">Rekord: augusti 2022, ' + fmt(AUG_2022) + ' öre/kWh</text></g>';
    s += '<g class="pekare" id="pekare" style="transform: translate(' + xMitt(0) + 'px, ' + (T + HH) + 'px)"><path d="M-8,-12 L8,-12 L0,0 Z" fill="#14507f"/></g>';
    s += '</svg>';
    el('diagram').innerHTML = s;
  }

  // ===================================================================
  // 2. Tidslinje
  // ===================================================================
  var kor = 0;                                   // löpnummer för pågående uppspelning; ändras vid omstart/hoppa över
  function vanta(ms, id) {
    return new Promise(function (res) { setTimeout(function () { res(id === kor); }, ms); });
  }
  function klass(id, k, pa) { var e = el(id); if (e) { e.classList.toggle(k, pa); } }
  function rubrik(t, stor) { var e = el('rubrik-dyn'); e.textContent = t; e.classList.toggle('stor', !!stor); }

  function nollstall() {
    SE4.forEach(function (_, i) { klass('s' + i, 'visas', false); klass('s' + i, 'aktiv', false); klass('v' + i, 'visas', false); });
    klass('rekord', 'visas', false); klass('pekare', 'visas', false); klass('nov-dagar', 'visas', false); klass('nov-fraga', 'visas', false);
    klass('stortal', 'visas', false); klass('flash', 'kor', false); klass('scen', 'skakar', false);
    el('stortal-tal').textContent = '0,00';
    rubrik(' ', false);
  }

  function slutlage() {
    SE4.forEach(function (_, i) { klass('s' + i, 'visas', true); klass('s' + i, 'aktiv', false); klass('v' + i, 'visas', true); });
    klass('rekord', 'visas', true); klass('pekare', 'visas', false); klass('nov-dagar', 'visas', true); klass('nov-fraga', 'visas', false);
    el('stortal-tal').textContent = fmt(SE4[10]);
    klass('stortal', 'visas', true);
    rubrik('REKORDHÖGT: ' + fmt(SE4[10]) + ' öre/kWh, redan efter tio dagar', true);
  }

  // Räknar upp det stora talet. Använder timer i stället för requestAnimationFrame, så att uppräkningen också går klart när fliken är i bakgrunden.
  function raknaUpp(till, ms, id) {
    return new Promise(function (res) {
      var start = Date.now(), tal = el('stortal-tal');
      function steg() {
        if (id !== kor) { res(false); return; }
        var p = Math.min(1, (Date.now() - start) / ms), e = 1 - Math.pow(1 - p, 3);
        tal.textContent = fmt(till * e);
        if (p < 1) { setTimeout(steg, 40); } else { res(true); }
      }
      steg();
    });
  }

  async function spela() {
    var id = ++kor;
    nollstall();
    if (minskadRorelse) { slutlage(); return; }
    if (!(await vanta(350, id))) { return; }

    // Januari–oktober, en månad i taget
    var pek = el('pekare');
    for (var i = 0; i < 10; i++) {
      pek.style.transform = 'translate(' + xMitt(i) + 'px, ' + (yAv(SE4[i]) - 22) + 'px)';
      klass('pekare', 'visas', true);
      if (i > 0) { klass('s' + (i - 1), 'aktiv', false); }
      klass('s' + i, 'aktiv', true);
      klass('s' + i, 'visas', true);
      klass('v' + i, 'visas', true);
      var extra = (i === 3) ? ' (lägst hittills)' : (i === 9 ? ' (dyrast hittills i år)' : '');
      rubrik(NAMN[i] + ': ' + fmt(SE4[i]) + ' öre/kWh' + extra, false);
      if (!(await vanta(i === 9 ? 900 : 520, id))) { return; }
    }
    klass('s9', 'aktiv', false);
    klass('pekare', 'visas', false);

    // Rekordet från augusti 2022
    rubrik('Dyraste månaden hittills (2021–2026): augusti 2022, ' + fmt(AUG_2022) + ' öre/kWh', false);
    klass('rekord', 'visas', true);
    if (!(await vanta(2200, id))) { return; }

    // Novembers tio första dagar
    rubrik('Och så november, de tio första dagarna …', false);
    klass('nov-dagar', 'visas', true);
    klass('nov-fraga', 'visas', true);
    if (!(await vanta(1500, id))) { return; }

    klass('nov-fraga', 'visas', false);
    klass('s10', 'visas', true);                 // bygger upp med överskjutande övergång (CSS)
    el('stortal-tal').textContent = '0,00';
    klass('stortal', 'visas', true);
    var fortsatt = raknaUpp(SE4[10], 1000, id);
    if (!(await vanta(560, id))) { return; }
    klass('v10', 'visas', true);
    klass('flash', 'kor', true);
    klass('scen', 'skakar', true);
    if (!(await fortsatt)) { return; }
    rubrik('REKORDHÖGT: ' + fmt(SE4[10]) + ' öre/kWh, redan efter tio dagar', true);
  }

  // ===================================================================
  // 3. Knappar, teknik-modal och start
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
    el('version').textContent = VERSION;
    el('versionsdatum').textContent = VERSIONSDATUM;
    bygg();
    modal();
    el('spela-igen').addEventListener('click', function () { spela(); });
    el('hoppa').addEventListener('click', function () { kor++; nollstall(); slutlage(); });
    spela();
  }

  start();
})();
