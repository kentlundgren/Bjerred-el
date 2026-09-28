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

    result.innerHTML =
        '<strong>' + formatNumber(ladorPerAggregat) + ' lådor per aggregat</strong> · ' +
        formatNumber(ladorFyllning) + ' lådor för att fylla ' + formatNumber(aggregat) +
        ' aggregat<br>' +
        'Med ' + formatNumber(extraLador) + ' i reserv: <strong>' + formatNumber(ladorTotalt) +
        ' lådor = ' + formatNumber(kgTotalt) + ' kg</strong><br>' +
        'Kostnad: <strong>cirka ' + formatNumber(kostnad) + ' kr</strong>';
}

function initCalc() {
    ['in-aggregat', 'in-kg', 'in-lada', 'in-extra', 'in-pris'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', updateCalc);
    });
    updateCalc();
}


/* ================================================================
   2. TEKNIK-MODAL
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
    initModal();
});
