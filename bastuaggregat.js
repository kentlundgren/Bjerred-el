/* ================================================================
   bastuaggregat.js
   Logik för sidan "Bastuaggregatet och bastustenarna"
   NY FIL 2026-09-28
   1. Stenkalkyl: räknar antal lådor, total vikt och kostnad
   2. Teknik-modal (samma mönster som prognoser.js)
   Ingen ES2023-funktionalitet används.
   ================================================================ */


/* ================================================================
   1. STENKALKYL
   ================================================================ */

// Läser ett inmatningsfält som tal; tomt eller negativt värde ger 0
function readNumber(id) {
    const value = parseFloat(document.getElementById(id).value);
    return isNaN(value) || value < 0 ? 0 : value;
}

// Svensk tusentalsformatering, t.ex. 1 390
function formatNumber(n) {
    return Math.round(n).toLocaleString('sv-SE');
}

function updateCalc() {
    const aggregat = readNumber('in-aggregat');
    const kgPerAggregat = readNumber('in-kg');
    const kgPerLada = readNumber('in-lada');
    const extraLador = readNumber('in-extra');
    const prisPerLada = readNumber('in-pris');
    const stenarPerLada = readNumber('in-stenar');
    const result = document.getElementById('calc-result');

    if (kgPerLada === 0) {
        result.textContent = 'Ange vikt per låda (större än 0).';
        return;
    }

    // Varje aggregat fylls med hela lådor, därför avrundas uppåt per aggregat
    const ladorPerAggregat = Math.ceil(kgPerAggregat / kgPerLada);
    const ladorFyllning = ladorPerAggregat * aggregat;
    const ladorTotalt = ladorFyllning + extraLador;
    const kgTotalt = ladorTotalt * kgPerLada;
    const kostnad = ladorTotalt * prisPerLada;
    const kgPerSten = (stenarPerLada > 0 && kgPerLada > 0) ? kgPerLada / stenarPerLada : 0;
    const stenarFyllning = (stenarPerLada > 0) ? ladorFyllning * stenarPerLada : 0;
    const stenarTotalt = (stenarPerLada > 0) ? ladorTotalt * stenarPerLada : 0;

    var stenRad = '';
    if (stenarPerLada > 0) {
        stenRad =
            'Ungefär <strong>' + formatNumber(stenarFyllning) + ' stenar</strong> för fyllning' +
            (extraLador > 0 ? ' och <strong>' + formatNumber(stenarTotalt) + ' st</strong> med reserv' : '') +
            ' (utgår från ' + formatNumber(stenarPerLada) + ' st per låda';
        if (kgPerSten > 0) {
            stenRad += ', cirka ' + kgPerSten.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' kg/st';
        }
        stenRad += ')<br>';
    }

    result.innerHTML =
        '<strong>' + formatNumber(ladorPerAggregat) + ' lådor per aggregat</strong> · ' +
        formatNumber(ladorFyllning) + ' lådor för att fylla ' + formatNumber(aggregat) +
        ' aggregat<br>' +
        'Med ' + formatNumber(extraLador) + ' i reserv: <strong>' + formatNumber(ladorTotalt) +
        ' lådor = ' + formatNumber(kgTotalt) + ' kg</strong><br>' +
        stenRad +
        'Kostnad: <strong>cirka ' + formatNumber(kostnad) + ' kr</strong>';
}

function initCalc() {
    ['in-aggregat', 'in-kg', 'in-lada', 'in-extra', 'in-pris', 'in-stenar'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', updateCalc);
    });
    updateCalc();
}


/* ================================================================
   2. VÄXLANDE STENBILDER (samma låda → 29 stenar)
   UPPDATERING 2026-10-24
   ================================================================ */
function initStoneSwap() {
    const root = document.getElementById('stone-swap');
    const hint = document.getElementById('stone-swap-hint');
    if (!root || !hint) return;

    const imgs = root.querySelectorAll('.stone-swap-img');
    if (imgs.length < 2) return;

    const hints = [
        'Bild 1 av 2: öppen låda à 20 kg (etikett 10–15 cm).',
        'Bild 2 av 2: alla 29 stenar från samma låda, utlagda och räknade.'
    ];
    var index = 0;

    function show(i) {
        for (var j = 0; j < imgs.length; j++) {
            imgs[j].classList.toggle('is-active', j === i);
        }
        hint.textContent = hints[i];
    }

    /* Vid reducerad rörelse: ingen växling; CSS visar båda bilderna under varandra */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (var k = 0; k < imgs.length; k++) {
            imgs[k].classList.add('is-active');
        }
        return;
    }

    var ms = parseInt(root.getAttribute('data-interval'), 10);
    if (isNaN(ms) || ms < 2000) ms = 5000;

    show(0);
    setInterval(function () {
        index = (index + 1) % imgs.length;
        show(index);
    }, ms);
}


/* ================================================================
   3. TEKNIK-MODAL
   ================================================================ */
function initModal() {
    const modal = document.getElementById('techModal');
    const openBtn = document.getElementById('techBtn');
    const closeBtn = document.getElementById('techClose');

    const open = () => modal.classList.add('show');
    const close = () => modal.classList.remove('show');

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}


/* ================================================================
   START
   ================================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initCalc();
    initStoneSwap();
    initModal();
});
