'use strict';

/* ================================================================
   prognoser.js
   Sidan "Träffar mina elprognoser rätt?" – Bjerreds Saltsjöbad

   Innehåll:
   1. prognosData  (hårdkodad kopia – underhålls av skillen bjerred-elprognos)
   2. Hjälpfunktioner (avvikelse, formatering)
   3. Nyckeltal (MAPE, bias, största missen)
   4. Diagram 1: prognos vs utfall (kWh)
   5. Diagram 2: avvikelse per månad (%)
   6. Tabell + sammanfattningstext
   7. Teknik-modal
   8. Initialisering
   ================================================================ */


/* ================================================================
   1. PROGNOSDATA
   Ett objekt per månad. utfall-fälten är null tills facit finns.
   Kontroll: prognos.bad + prognos.restaurang = prognos.totalt
   ================================================================ */
const prognosData = [
    // PROGNOS 2026-08-28: Augusti 2026. Bild visade bad 10769; text sa 10768 →
    // 10768 valt (10768 + 11027 = 21795). Kostnad ej prognostiserad.
    // FACIT 2026-09-01: utfall 21836 kWh (bad 10526, rest. 11310), avvikelse −0,2 %.
    //   Kostnad kommer kring 10 sep – utfall.kostnad lämnas null tills fakturan finns.
    {
        manad: 'Aug', ar: 2026, fullMonth: 'Augusti 2026',
        prognosDatum: '2026-08-28',
        underlag: 'Linjär framskrivning (avläst t.o.m. 28 aug, uppräknat till 31 dygn)',
        dagar: 31,
        prognos: { bad: 10768, restaurang: 11027, totalt: 21795, kostnad: null },
        utfall:  { bad: 10526, restaurang: 11310, totalt: 21836, kostnad: null }
    }
];

/* Månad räknas som "träff" om |avvikelse| ≤ denna gräns (procent) */
const TRAFF_GRANS_PROCENT = 3;


/* ================================================================
   2. HJÄLPFUNKTIONER
   ================================================================ */

/** Svensk tusentalsformatering, heltal. null → "–" */
function fmt(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '–';
    return Math.round(n).toLocaleString('sv-SE');
}

/** Procent med tecken och en decimal. null → "–" */
function fmtPct(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '–';
    const sign = n > 0 ? '+' : '';
    return sign + n.toFixed(1) + ' %';
}

/** Har månaden ett känt utfall? */
function harFacit(rad) {
    return rad.utfall && typeof rad.utfall.totalt === 'number';
}

/**
 * Avvikelse för en rad med facit.
 * Positivt = prognosen låg för högt.
 */
function berakna(rad) {
    const p = rad.prognos;
    const u = rad.utfall;
    const avvikelseKWh = p.totalt - u.totalt;
    const avvikelseProcent = (avvikelseKWh / u.totalt) * 100;
    const avvikelseBad = (u.bad && p.bad !== null)
        ? ((p.bad - u.bad) / u.bad) * 100 : null;
    const avvikelseRest = (u.restaurang && p.restaurang !== null)
        ? ((p.restaurang - u.restaurang) / u.restaurang) * 100 : null;
    return { avvikelseKWh, avvikelseProcent, avvikelseBad, avvikelseRest };
}

/** CSS-klass för en avvikelse i procent */
function avvikelseKlass(procent) {
    if (procent === null) return 'oppen';
    if (Math.abs(procent) <= TRAFF_GRANS_PROCENT) return 'traff';
    return procent > 0 ? 'for-hogt' : 'for-lagt';
}

function medel(arr) {
    if (!arr.length) return null;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}


/* ================================================================
   3. NYCKELTAL
   ================================================================ */
function renderNyckeltal() {
    const avraknade = prognosData.filter(harFacit).map((rad) => ({
        rad,
        ...berakna(rad)
    }));

    document.getElementById('card-antal').textContent = String(avraknade.length);

    if (!avraknade.length) {
        document.getElementById('card-mape').textContent = '–';
        document.getElementById('card-bias').textContent = '–';
        document.getElementById('card-varsta').textContent = '–';
        document.getElementById('card-varsta-unit').textContent =
            'väntar på första facit';
        return;
    }

    const mape = medel(avraknade.map((a) => Math.abs(a.avvikelseProcent)));
    const bias = medel(avraknade.map((a) => a.avvikelseProcent));

    document.getElementById('card-mape').textContent = mape.toFixed(1) + ' %';
    document.getElementById('card-bias').textContent = fmtPct(bias);
    document.getElementById('card-bias-unit').textContent =
        bias > 0 ? '+ = gissar för högt' : '– = gissar för lågt';

    const varsta = avraknade.reduce((a, b) =>
        Math.abs(b.avvikelseProcent) > Math.abs(a.avvikelseProcent) ? b : a);
    document.getElementById('card-varsta').textContent =
        fmtPct(varsta.avvikelseProcent);
    document.getElementById('card-varsta-unit').textContent =
        varsta.rad.fullMonth;
}


/* ================================================================
   4. DIAGRAM 1: PROGNOS VS UTFALL (kWh)
   ================================================================ */
function renderChartPrognosUtfall() {
    const labels = prognosData.map((r) => r.fullMonth);
    const ctx = document.getElementById('chart-prognos-utfall').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Prognos',
                    data: prognosData.map((r) => r.prognos.totalt),
                    backgroundColor: 'rgba(155, 89, 182, 0.75)',
                    borderColor: '#9b59b6',
                    borderWidth: 1
                },
                {
                    label: 'Utfall',
                    data: prognosData.map((r) => harFacit(r) ? r.utfall.totalt : null),
                    backgroundColor: 'rgba(44, 62, 80, 0.75)',
                    borderColor: '#2c3e50',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'kWh' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)} kWh`
                    }
                }
            }
        }
    });
}


/* ================================================================
   5. DIAGRAM 2: AVVIKELSE PER MÅNAD (%)
   ================================================================ */
function renderChartAvvikelse() {
    const avraknade = prognosData.filter(harFacit);
    const canvas = document.getElementById('chart-avvikelse');
    const tomNote = document.getElementById('avvikelse-tom');
    const wrap = canvas.closest('.chart-wrap');

    if (!avraknade.length) {
        if (wrap) wrap.style.display = 'none';
        tomNote.hidden = false;
        return;
    }
    if (wrap) wrap.style.display = '';
    tomNote.hidden = true;

    const rows = avraknade.map((r) => ({ r, ...berakna(r) }));
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rows.map((x) => x.r.fullMonth),
            datasets: [{
                label: 'Avvikelse (%)',
                data: rows.map((x) => parseFloat(x.avvikelseProcent.toFixed(1))),
                backgroundColor: rows.map((x) => {
                    const k = avvikelseKlass(x.avvikelseProcent);
                    if (k === 'traff') return 'rgba(39, 174, 96, 0.75)';
                    if (k === 'for-hogt') return 'rgba(231, 76, 60, 0.75)';
                    return 'rgba(41, 128, 185, 0.75)';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: { display: true, text: '% (prognos − utfall)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (c) => `Avvikelse: ${fmtPct(c.parsed.y)}`
                    }
                }
            }
        }
    });
}


/* ================================================================
   6. TABELL + SAMMANFATTNING
   ================================================================ */
function renderTabell() {
    const tbody = document.querySelector('#prognos-tabell tbody');
    tbody.innerHTML = '';

    // Avräknade först, sedan öppna – båda i kronologisk ordning
    const avraknade = prognosData.filter(harFacit);
    const oppna = prognosData.filter((r) => !harFacit(r));
    const ordnad = [...avraknade, ...oppna];

    ordnad.forEach((rad) => {
        const tr = document.createElement('tr');
        let avvKWh = '–';
        let avvPct = '–';
        let pctKlass = 'oppen';

        if (harFacit(rad)) {
            const b = berakna(rad);
            avvKWh = (b.avvikelseKWh > 0 ? '+' : '') + fmt(b.avvikelseKWh);
            avvPct = fmtPct(b.avvikelseProcent);
            pctKlass = avvikelseKlass(b.avvikelseProcent);
        }

        tr.innerHTML = `
            <td class="manad-cell">${rad.fullMonth}</td>
            <td>${fmt(rad.prognos.bad)}</td>
            <td>${fmt(rad.prognos.restaurang)}</td>
            <td>${fmt(rad.prognos.totalt)}</td>
            <td>${harFacit(rad) ? fmt(rad.utfall.totalt) : '<span class="oppen">väntar på facit</span>'}</td>
            <td class="${pctKlass}">${avvKWh}</td>
            <td class="${pctKlass}">${avvPct}</td>
            <td class="manad-cell" style="font-weight:400;font-size:0.85em;color:#7f8c8d;">${rad.underlag}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSammanfattning() {
    const el = document.getElementById('analys-inneholl');
    const avraknade = prognosData.filter(harFacit).map((rad) => ({
        rad, ...berakna(rad)
    }));
    const oppna = prognosData.filter((r) => !harFacit(r));

    if (!avraknade.length) {
        const namn = oppna.map((r) => r.fullMonth).join(', ');
        el.innerHTML =
            `Ingen prognos har stämts av mot facit ännu. `
            + `Öppen prognos: <strong>${namn || 'ingen'}</strong>. `
            + `Så snart den slutliga mätarställningen finns räknas `
            + `avvikelsen ut här, och nyckeltalen ovan börjar fyllas.`;
        return;
    }

    const mape = medel(avraknade.map((a) => Math.abs(a.avvikelseProcent)));
    const bias = medel(avraknade.map((a) => a.avvikelseProcent));
    const traffar = avraknade.filter(
        (a) => Math.abs(a.avvikelseProcent) <= TRAFF_GRANS_PROCENT).length;

    let biasText;
    if (Math.abs(bias) < 1) {
        biasText = 'Prognoserna lutar varken tydligt åt för högt eller för lågt.';
    } else if (bias > 0) {
        biasText = `Prognoserna tenderar att ligga <strong>för högt</strong> `
            + `(i snitt ${fmtPct(bias)}).`;
    } else {
        biasText = `Prognoserna tenderar att ligga <strong>för lågt</strong> `
            + `(i snitt ${fmtPct(bias)}).`;
    }

    el.innerHTML =
        `Hittills har <strong>${avraknade.length}</strong> prognos(er) stämts av. `
        + `Medelavvikelsen (MAPE) är <strong>${mape.toFixed(1)} %</strong>, `
        + `och <strong>${traffar}</strong> av dem låg inom ±${TRAFF_GRANS_PROCENT} %. `
        + biasText
        + (oppna.length
            ? ` Öppen prognos som väntar på facit: `
              + `<strong>${oppna.map((r) => r.fullMonth).join(', ')}</strong>.`
            : '');
}


/* ================================================================
   7. TEKNIK-MODAL
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
   8. INITIALISERING
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderNyckeltal();
    renderChartPrognosUtfall();
    renderChartAvvikelse();
    renderTabell();
    renderSammanfattning();
    initModal();
});
