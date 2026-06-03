'use strict';

/* ================================================================
   fore_och_efter_ombyggnad.js
   Analyssida: Elförbrukning före & efter ombyggnad 2025
   Bjerreds Saltsjöbad

   Innehåll:
   1. Konstanter & kapacitetsdata
   2. El-data (fore/efterData)
   3. Inpasseringsdata – fallback + Firebase REST API
   4. Hjälpfunktioner (beräkningar, formatering)
   5. Summary cards (nyckeltal)
   6. Diagram 1–4 (Chart.js)
   7. Jämförelsetabeller
   8. Extraanalyser
   9. Toggle-logik (faktiska badare / full kapacitet)
   10. Formulär för framtida el-data (localStorage)
   11. Initialisering (DOMContentLoaded)
   ================================================================ */


/* ================================================================
   1. KONSTANTER & KAPACITETSDATA
   ================================================================ */

const KAPACITET_FORE  = 36;   // 18 badare per bastu × 2 bastuer (gammal)
const KAPACITET_EFTER = 54;   // 27 badare per bastu × 2 bastuer (ny efter ombyggnad)

/* Beläggningsgrad: bastun är i drift 18 timmar/dag (öppen 06-22, minus 2 tim städning) */
const TIMMAR_PER_DAG  = 18;

/* Firebase REST API – öppen läsbehörighet, ingen auth krävs */
const FIREBASE_URL =
    'https://skylt-e0c45-default-rtdb.europe-west1.firebasedatabase.app' +
    '/bjerred-inpasseringar/data.json';

/* Månadsförkortningar och dagantal (ej skottår 2025–2026) */
const MANAD_ABBR = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
const DAGAR_PER_MANAD = [31,28,31,30,31,30,31,31,30,31,30,31];


/* ================================================================
   2. EL-DATA
   Källa: monthlyData i index.html
   Proportionell bad-kostnad = totalKostnad × (badKwh / totalKwh)
   ================================================================ */

/* Månader med bad öppet FÖRE ombyggnaden */
const foreData = [
    { manad:'Aug', manIdx:7,  ar:2024, badKwh:8262,  totalKwh:19901, kostnad:34472, dagar:31 },
    { manad:'Sep', manIdx:8,  ar:2024, badKwh:8273,  totalKwh:19271, kostnad:30158, dagar:30 },
    { manad:'Okt', manIdx:9,  ar:2024, badKwh:12308, totalKwh:19224, kostnad:29882, dagar:31 },
    { manad:'Nov', manIdx:10, ar:2024, badKwh:8010,  totalKwh:22849, kostnad:51492, dagar:30 },
    { manad:'Dec', manIdx:11, ar:2024, badKwh:14338, totalKwh:24264, kostnad:50672, dagar:31 },
    { manad:'Jan', manIdx:0,  ar:2025, badKwh:12250, totalKwh:26815, kostnad:58462, dagar:31 },
];

/* Månader med bad öppet EFTER ombyggnaden.
   null-värden = data saknas ännu (platshållare för framtida månader). */
const efterData = [
    { manad:'Aug', manIdx:7,  ar:2025, badKwh:11779, totalKwh:23379, kostnad:47703, dagar:31 },
    { manad:'Sep', manIdx:8,  ar:2025, badKwh:11236, totalKwh:21524, kostnad:45699, dagar:30 },
    { manad:'Okt', manIdx:9,  ar:2025, badKwh:12646, totalKwh:23582, kostnad:52459, dagar:31 },
    { manad:'Nov', manIdx:10, ar:2025, badKwh:16608, totalKwh:27433, kostnad:64248, dagar:30 },
    { manad:'Dec', manIdx:11, ar:2025, badKwh:18602, totalKwh:30015, kostnad:62760, dagar:31 },
    { manad:'Jan', manIdx:0,  ar:2026, badKwh:18836, totalKwh:35422, kostnad:90779, dagar:31 },
    { manad:'Feb', manIdx:1,  ar:2026, badKwh:15660, totalKwh:32002, kostnad:82794, dagar:28 },
    { manad:'Mar', manIdx:2,  ar:2026, badKwh:17772, totalKwh:28074, kostnad:63389, dagar:31 },
    { manad:'Apr', manIdx:3,  ar:2026, badKwh:15089, totalKwh:26671, kostnad:52186, dagar:30 },
    { manad:'Maj', manIdx:4,  ar:2026, badKwh:11511, totalKwh:23937, kostnad:60000, dagar:31 },
    /* Platshållare – fylls i via formuläret eller uppdateras automatiskt */
    { manad:'Jun', manIdx:5,  ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:30 },
    { manad:'Jul', manIdx:6,  ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:31 },
    { manad:'Aug', manIdx:7,  ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:31 },
    { manad:'Sep', manIdx:8,  ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:30 },
    { manad:'Okt', manIdx:9,  ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:31 },
    { manad:'Nov', manIdx:10, ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:30 },
    { manad:'Dec', manIdx:11, ar:2026, badKwh:null, totalKwh:null, kostnad:null, dagar:31 },
];

/* De 6 månadspar som kan jämföras direkt (samma kalendermånad, ett år isär) */
const jamforPar = [
    { manad:'Aug', fore: foreData[0], efter: efterData[0] },
    { manad:'Sep', fore: foreData[1], efter: efterData[1] },
    { manad:'Okt', fore: foreData[2], efter: efterData[2] },
    { manad:'Nov', fore: foreData[3], efter: efterData[3] },
    { manad:'Dec', fore: foreData[4], efter: efterData[4] },
    { manad:'Jan', fore: foreData[5], efter: efterData[5] },
];


/* ================================================================
   3. INPASSERINGSDATA
   Fallback: BASE_DATA hämtad ur GitHub-repot 2026-06-03
   Primär: Firebase REST API (hämtas asynkront vid start)

   Format: { år: { månadsIndex: totalAntal } }
   månadsIndex: Jan=0, Feb=1, ... Dec=11
   ================================================================ */
const INPASS_FALLBACK = {
    2024: { 7:4237, 8:5175, 9:4237, 10:4687, 11:4702 },
    2025: { 0:4769, 7:4524, 8:5344, 9:4938, 10:5689, 11:5507 },
    2026: { 0:4876, 1:3980, 2:5364, 3:4655 }
};

/* Aktiv inpasseringsdata – ersätts med Firebase-data när den laddas */
let inpassData = JSON.parse(JSON.stringify(INPASS_FALLBACK));


/* ================================================================
   4. GLOBALT STATE
   ================================================================ */
let viewMode = 'faktisk';   // 'faktisk' | 'max'
const charts  = {};         /* lagrar Chart.js-instanser */


/* ================================================================
   3a. FIREBASE – hämtning och parsning
   ================================================================ */

async function hamtaFirebaseInpasseringar() {
    visaFirebaseStatus('loading', 'Hämtar inpasseringsdata från Firebase…');
    try {
        const resp = await fetch(FIREBASE_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const fbData = await resp.json();
        inpassData = parseFirebaseData(fbData);
        visaFirebaseStatus('ok', 'Inpasseringsdata live från Firebase');
    } catch (err) {
        console.warn('Firebase kunde ej nås:', err.message);
        visaFirebaseStatus('warning', 'Firebase ej nådd – använder inbyggd basdata');
    }
}

function visaFirebaseStatus(typ, text) {
    const el = document.getElementById('firebase-status');
    el.textContent = text;
    el.className = `firebase-status ${typ}`;
}

/* Parsar Firebases nästlade struktur till { år: { månadsIdx: total } }.
   Hanterar:
   - Platta arrayer (2024-struktur)
   - Nästlade objekt som { badbiljetter: [...] } (2025/2026-struktur)
   - Strängen "null" (lagras i Firebase som string, ej null) */
function parseFirebaseData(fbData) {
    const result = {};

    for (const [yearStr, categories] of Object.entries(fbData)) {
        const year  = parseInt(yearStr, 10);
        const totals = {};

        /* Lägg till värden från en array till månadstotalerna */
        function addArray(arr) {
            if (!Array.isArray(arr)) return;
            arr.forEach((val, idx) => {
                const n = (val === 'null' || val === null) ? null : Number(val);
                if (n !== null && !isNaN(n) && n > 0) {
                    totals[idx] = (totals[idx] ?? 0) + n;
                }
            });
        }

        /* Rekursiv genomgång av noder (array eller objekt) */
        function walk(node) {
            if (Array.isArray(node))              addArray(node);
            else if (node && typeof node === 'object') {
                for (const child of Object.values(node)) walk(child);
            }
        }

        for (const cat of Object.values(categories)) walk(cat);
        result[year] = totals;
    }
    return result;
}


/* ================================================================
   4. HJÄLPFUNKTIONER
   ================================================================ */

/* Hämta inpasseringar för givet år och månadsindex */
function getInpass(ar, manIdx) {
    return inpassData[ar]?.[manIdx] ?? null;
}

/* Avgör om en datarad tillhör "före"-perioden */
function isFore(d) { return foreData.includes(d); }

/* Returnerar antal badare för beräkningar beroende på vy */
function getBadare(d, mode) {
    if (mode === 'max') return isFore(d) ? KAPACITET_FORE : KAPACITET_EFTER;
    return getInpass(d.ar, d.manIdx);
}

/* Proportionell bad-kostnad (bad-kWh:s andel av total kostnad) */
function badKostnadKr(d) {
    if (!d.badKwh || !d.totalKwh || !d.kostnad) return null;
    return d.kostnad * (d.badKwh / d.totalKwh);
}

/* kWh per badare */
function kwhPerBadare(d, mode) {
    const n = getBadare(d, mode);
    return (d.badKwh && n) ? d.badKwh / n : null;
}

/* kr per badare */
function krPerBadare(d, mode) {
    const bk = badKostnadKr(d);
    const n  = getBadare(d, mode);
    return (bk && n) ? bk / n : null;
}

/* Procentuell förändring */
function pctDiff(a, b) {
    if (a == null || b == null || a === 0) return null;
    return ((b - a) / a) * 100;
}

/* Formatera tal med valfritt antal decimaler */
function fmt(n, dec = 1) {
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('sv-SE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/* Formatera procent med tecken (+/-) */
function fmtPct(n) {
    if (n == null) return '—';
    const sign = n >= 0 ? '+' : '';
    return `${sign}${fmt(n, 1)} %`;
}

/* Genomsnitt av en array, ignorerar null */
function snitt(arr) {
    const vals = arr.filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}


/* ================================================================
   5. SUMMARY CARDS (nyckeltal)
   ================================================================ */
function uppdateraSummaryCards() {
    const kwhDiffs = jamforPar.map(p =>
        pctDiff(kwhPerBadare(p.fore, viewMode), kwhPerBadare(p.efter, viewMode))
    );
    const krDiffs = jamforPar.map(p =>
        pctDiff(krPerBadare(p.fore, viewMode), krPerBadare(p.efter, viewMode))
    );
    const badKwhDiffs = jamforPar.map(p => pctDiff(p.fore.badKwh, p.efter.badKwh));

    document.getElementById('card-kwh-diff').textContent          = fmtPct(snitt(badKwhDiffs));
    document.getElementById('card-kwh-per-badare-diff').textContent = fmtPct(snitt(kwhDiffs));
    document.getElementById('card-kr-per-badare-diff').textContent  = fmtPct(snitt(krDiffs));

    const unit = viewMode === 'max' ? 'full kapacitet' : 'faktiska inpasseringar';
    document.getElementById('card-kwh-per-badare-unit').textContent = unit;
    document.getElementById('card-kr-per-badare-unit').textContent  = unit;
}


/* ================================================================
   6. DIAGRAM
   Diagram 1: Gruppat stapeldiagram – bad-kWh jämförbara månader
   Diagram 2: Linjediagram – kWh/badare jämförbara månader (toggle)
   Diagram 3: Linjediagram – kr/badare jämförbara månader (toggle)
   Diagram 4: Linjediagram – faktiska inpasseringar (faktisk-vy)
   ================================================================ */

const FORE_COLOR   = '#3498db';
const EFTER_COLOR  = '#e74c3c';
const FORE_BG      = 'rgba(52,152,219,0.55)';
const EFTER_BG     = 'rgba(231,76,60,0.55)';
const FORE_LINE_BG = 'rgba(52,152,219,0.12)';
const EFTER_LINE_BG = 'rgba(231,76,60,0.12)';

/* Delade Chart.js-options för stapeldiagram */
function stapelOptions(yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('sv-SE')} ${yLabel}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: v => v.toLocaleString('sv-SE') + ' ' + yLabel }
            }
        }
    };
}

/* Delade Chart.js-options för linjediagram */
function linjeOptions(yLabel, decimaler = 1) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, decimaler)} ${yLabel}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: v => fmt(v, decimaler) + ' ' + yLabel }
            }
        }
    };
}

/* --- Diagram 1: Bad-kWh per jämförbara månadspar --- */
function initChart1() {
    const ctx = document.getElementById('chart-kwh').getContext('2d');
    charts.kwh = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: jamforPar.map(p => p.manad),
            datasets: [
                {
                    label: `Före ombyggnad (${jamforPar[0].fore.ar}/${jamforPar[jamforPar.length-1].fore.ar})`,
                    data: jamforPar.map(p => p.fore.badKwh),
                    backgroundColor: FORE_BG,
                    borderColor: FORE_COLOR,
                    borderWidth: 1,
                },
                {
                    label: `Efter ombyggnad (${jamforPar[0].efter.ar}/${jamforPar[jamforPar.length-1].efter.ar})`,
                    data: jamforPar.map(p => p.efter.badKwh),
                    backgroundColor: EFTER_BG,
                    borderColor: EFTER_COLOR,
                    borderWidth: 1,
                }
            ]
        },
        options: stapelOptions('kWh')
    });
}

/* --- Diagram 2: kWh per badare – jämförbara månader (uppdateras vid toggle) --- */
function initChart2() {
    const ctx = document.getElementById('chart-kwh-per-person').getContext('2d');
    charts.kwhPerPerson = new Chart(ctx, {
        type: 'line',
        data: {
            labels: jamforPar.map(p => p.manad),
            datasets: [
                {
                    label: 'Före ombyggnad (kWh/badare)',
                    data: jamforPar.map(p => kwhPerBadare(p.fore, viewMode)),
                    borderColor: FORE_COLOR,
                    backgroundColor: FORE_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, fill: true,
                },
                {
                    label: 'Efter ombyggnad (kWh/badare)',
                    data: jamforPar.map(p => kwhPerBadare(p.efter, viewMode)),
                    borderColor: EFTER_COLOR,
                    backgroundColor: EFTER_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, fill: true,
                }
            ]
        },
        options: linjeOptions('kWh')
    });
}

/* --- Diagram 3: kr per badare – jämförbara månader (uppdateras vid toggle) --- */
function initChart3() {
    const ctx = document.getElementById('chart-kr-per-person').getContext('2d');
    charts.krPerPerson = new Chart(ctx, {
        type: 'line',
        data: {
            labels: jamforPar.map(p => p.manad),
            datasets: [
                {
                    label: 'Före ombyggnad (kr/badare)',
                    data: jamforPar.map(p => krPerBadare(p.fore, viewMode)),
                    borderColor: FORE_COLOR,
                    backgroundColor: FORE_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, fill: true,
                },
                {
                    label: 'Efter ombyggnad (kr/badare)',
                    data: jamforPar.map(p => krPerBadare(p.efter, viewMode)),
                    borderColor: EFTER_COLOR,
                    backgroundColor: EFTER_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, fill: true,
                }
            ]
        },
        options: linjeOptions('kr', 0)
    });
}

/* --- Diagram 4: Faktiska inpasseringar (bara synligt i faktisk-vy) --- */
function initChart4() {
    const ctx = document.getElementById('chart-inpass').getContext('2d');

    const foreM = foreData.filter(d => getInpass(d.ar, d.manIdx) !== null);
    const efterM = efterData.filter(d => d.badKwh !== null && getInpass(d.ar, d.manIdx) !== null);

    charts.inpass = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                ...foreM.map(d => `${d.manad} ${d.ar}`),
                ...efterM.map(d => `${d.manad} ${d.ar}`)
            ],
            datasets: [
                {
                    label: 'Inpasseringar – före ombyggnad',
                    data: [
                        ...foreM.map(d => getInpass(d.ar, d.manIdx)),
                        ...efterM.map(() => null)
                    ],
                    borderColor: FORE_COLOR,
                    backgroundColor: FORE_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, spanGaps: false, fill: true,
                },
                {
                    label: 'Inpasseringar – efter ombyggnad',
                    data: [
                        ...foreM.map(() => null),
                        ...efterM.map(d => getInpass(d.ar, d.manIdx))
                    ],
                    borderColor: EFTER_COLOR,
                    backgroundColor: EFTER_LINE_BG,
                    pointRadius: 6, pointHoverRadius: 8,
                    tension: 0.3, spanGaps: false, fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            return v != null
                                ? ` ${ctx.dataset.label}: ${Math.round(v).toLocaleString('sv-SE')} badare`
                                : null;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { maxRotation: 45, minRotation: 30 } },
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('sv-SE') }
                }
            }
        }
    });
}

/* Uppdatera diagram 2 och 3 när viewMode ändras.
   UPPDATERING 2026-06-03: etiketter ändras till "per badplats" i max-vy */
function uppdateraChart2och3() {
    const mode    = viewMode;
    const enhet   = mode === 'faktisk' ? 'badare' : 'badplats';
    const yLblKwh = mode === 'faktisk' ? 'kWh' : 'kWh';
    const yLblKr  = mode === 'faktisk' ? 'kr'  : 'kr';

    charts.kwhPerPerson.data.datasets[0].label = `Före ombyggnad (kWh/${enhet})`;
    charts.kwhPerPerson.data.datasets[1].label = `Efter ombyggnad (kWh/${enhet})`;
    charts.kwhPerPerson.data.datasets[0].data  = jamforPar.map(p => kwhPerBadare(p.fore, mode));
    charts.kwhPerPerson.data.datasets[1].data  = jamforPar.map(p => kwhPerBadare(p.efter, mode));
    charts.kwhPerPerson.options.plugins.tooltip.callbacks.label =
        ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)} ${yLblKwh}/${enhet}`;
    charts.kwhPerPerson.update();

    charts.krPerPerson.data.datasets[0].label = `Före ombyggnad (${yLblKr}/${enhet})`;
    charts.krPerPerson.data.datasets[1].label = `Efter ombyggnad (${yLblKr}/${enhet})`;
    charts.krPerPerson.data.datasets[0].data  = jamforPar.map(p => krPerBadare(p.fore, mode));
    charts.krPerPerson.data.datasets[1].data  = jamforPar.map(p => krPerBadare(p.efter, mode));
    charts.krPerPerson.options.plugins.tooltip.callbacks.label =
        ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, 0)} ${yLblKr}/${enhet}`;
    charts.krPerPerson.update();
}

/* Återskapa diagram 4 och 5 (nödvändigt när inpassData förändrats) */
function ombyggChart4() {
    if (charts.inpass) {
        charts.inpass.destroy();
        delete charts.inpass;
    }
    initChart4();

    if (charts.belagg) {
        charts.belagg.destroy();
        delete charts.belagg;
    }
    initChartBelagg();
}


/* ================================================================
   7. JÄMFÖRELSETABELLER
   ================================================================ */

/* Tabell 1: Jämförbara månadspar */
function byggJamforTabell() {
    const tbody = document.querySelector('#jamfor-tabell tbody');
    tbody.innerHTML = '';

    jamforPar.forEach(par => {
        const f = par.fore;
        const e = par.efter;
        const mode = viewMode;

        const fBadare = getBadare(f, mode);
        const eBadare = getBadare(e, mode);
        const fKwh    = kwhPerBadare(f, mode);
        const eKwh    = kwhPerBadare(e, mode);
        const fKr     = krPerBadare(f, mode);
        const eKr     = krPerBadare(e, mode);

        const kwhPct = pctDiff(fKwh, eKwh);
        const krPct  = pctDiff(fKr, eKr);

        const badVisF = (mode === 'max')
            ? KAPACITET_FORE.toLocaleString('sv-SE') + ' (max)'
            : (fBadare != null ? fBadare.toLocaleString('sv-SE') : '—');

        const badVisE = (mode === 'max')
            ? KAPACITET_EFTER.toLocaleString('sv-SE') + ' (max)'
            : (eBadare != null ? eBadare.toLocaleString('sv-SE') : '—');

        const kwhKlass = kwhPct != null ? (kwhPct < 0 ? 'pos' : 'neg') : '';
        const krKlass  = krPct  != null ? (krPct  < 0 ? 'pos' : 'neg') : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="manad-cell">${par.manad}</td>
            <td>${f.ar}</td>
            <td>${f.badKwh.toLocaleString('sv-SE')}</td>
            <td>${badVisF}</td>
            <td>${fmt(fKwh)}</td>
            <td>${fmt(fKr, 0)}</td>
            <td>${e.ar}</td>
            <td>${e.badKwh.toLocaleString('sv-SE')}</td>
            <td>${badVisE}</td>
            <td>${fmt(eKwh)}</td>
            <td>${fmt(eKr, 0)}</td>
            <td class="${kwhKlass}">${fmtPct(kwhPct)}</td>
            <td class="${krKlass}">${fmtPct(krPct)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* Tabell 2: Månader efter ombyggnad utan jämförbart par */
function byggEfterTabell() {
    const tbody = document.querySelector('#efter-tabell tbody');
    tbody.innerHTML = '';

    /* Index för månader som ingår i jamforPar */
    const pareradNyckel = new Set(jamforPar.map(p => `${p.efter.manIdx}_${p.efter.ar}`));

    efterData.forEach(e => {
        if (!e.badKwh) return;  /* hoppa över platshållare */
        if (pareradNyckel.has(`${e.manIdx}_${e.ar}`)) return;

        const mode   = viewMode;
        const badare = getBadare(e, mode);
        const eKwh   = kwhPerBadare(e, mode);
        const eKr    = krPerBadare(e, mode);

        const badVis = (mode === 'max')
            ? KAPACITET_EFTER.toLocaleString('sv-SE') + ' (max)'
            : (badare != null ? badare.toLocaleString('sv-SE') : '—');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="manad-cell">${e.manad} ${e.ar}</td>
            <td>${e.badKwh.toLocaleString('sv-SE')}</td>
            <td>${badVis}</td>
            <td>${fmt(eKwh)}</td>
            <td>${fmt(eKr, 0)}</td>
        `;
        tbody.appendChild(tr);
    });
}


/* ================================================================
   7b. ANALYSTEXT UNDER kWh-PER-BADARE-DIAGRAMMET
   Beräknar och förklarar dynamiskt:
   - Varför september har lägst kWh/badare (hög besöksfrekvens + lägre uppvärmningsbehov)
   - Varför januari har högst kWh/badare efter ombyggnad (kall + stor bastu)
   - Genomsnittligt kWh/badare före respektive efter ombyggnad
   ================================================================ */
function byggAnalysKwhPerBadare() {
    const el = document.getElementById('analys-kwh-per-badare');
    if (!el) return;

    const mode = viewMode;

    /* Beräkna kWh/badare för alla jämförbara par */
    const varden = jamforPar.map(p => ({
        manad:      p.manad,
        manIdx:     p.fore.manIdx,
        foreKwh:    kwhPerBadare(p.fore, mode),
        efterKwh:   kwhPerBadare(p.efter, mode),
        foreInpass: getInpass(p.fore.ar, p.fore.manIdx),
        efterInpass: getInpass(p.efter.ar, p.efter.manIdx),
        foreBadKwh: p.fore.badKwh,
        efterBadKwh: p.efter.badKwh,
    }));

    /* Hitta lägst och högst */
    const foreMin  = varden.reduce((a, b) => (a.foreKwh  <= b.foreKwh  ? a : b));
    const efterMin = varden.reduce((a, b) => (a.efterKwh <= b.efterKwh ? a : b));
    const efterMax = varden.reduce((a, b) => (a.efterKwh >= b.efterKwh ? a : b));

    /* Genomsnitt */
    const snittFore  = snitt(varden.map(v => v.foreKwh));
    const snittEfter = snitt(varden.map(v => v.efterKwh));
    const snittPct   = pctDiff(snittFore, snittEfter);

    /* Förklaring till septembervärdet */
    const enhet = mode === 'faktisk' ? 'badare' : 'badplats';

    /* --- September-analys (beror på faktiska siffror) --- */
    let sepForeForklaring = '';
    let sepEfterForklaring = '';

    if (mode === 'faktisk') {
        /* September 2024: flest inpasseringar i föreperioden */
        const foreInpassMax = Math.max(...varden.map(v => v.foreInpass ?? 0));
        const foreKwhMin    = Math.min(...varden.map(v => v.foreBadKwh));
        const sepFore = varden.find(v => v.manIdx === 8); /* September = index 8 */

        if (sepFore) {
            const arFlest  = sepFore.foreInpass === foreInpassMax;
            const arLagElk = sepFore.foreBadKwh === foreKwhMin;
            sepForeForklaring = `September 2024 hade ` +
                `${sepFore.foreInpass?.toLocaleString('sv-SE') ?? '—'} inpasseringar – ` +
                (arFlest ? 'flest av alla jämförbara månader' : 'högt besökstal') +
                ` – samtidigt som bad-kWh var ${sepFore.foreBadKwh.toLocaleString('sv-SE')} kWh ` +
                (arLagElk ? '(lägst i perioden)' : '(relativt lågt)') +
                `. Septemberväder i Skåne är ännu relativt varmt, vilket minskar uppvärmningsbehovet.`;

            const sepEfter = varden.find(v => v.manIdx === 8);
            if (sepEfter) {
                sepEfterForklaring = `September 2025 upprepar mönstret med ` +
                    `${sepEfter.efterInpass?.toLocaleString('sv-SE') ?? '—'} inpasseringar ` +
                    `(flest i efterperioden) och relativt låg bad-kWh (${sepEfter.efterBadKwh.toLocaleString('sv-SE')} kWh). ` +
                    `Slutsats: lågt kWh per ${enhet} i september beror på kombinationen av ` +
                    `<em>hög besöksfrekvens</em> och <em>lägre uppvärmningsbehov</em> – inte på onormalt låg elkonsumtion.`;
            }
        }
    } else {
        /* Max-kapacitets-vy: fokus bara på el, inte på besökare */
        sepForeForklaring = `I "full kapacitets"-vyn reflekterar de låga septembervärdena ` +
            `att bad-kWh var relativt låg den månaden – inte att det var fler badare.`;
        sepEfterForklaring = `September 2025 hade också lägre bad-kWh jämfört med vintermånaderna, ` +
            `tack vare lägre uppvärmningsbehov i september.`;
    }

    /* --- Januarianalys --- */
    const janEfterForklaring = `Januari 2026 hade den högsta förbrukningen per ${enhet} ` +
        `efter ombyggnaden (${fmt(efterMax.efterKwh)} kWh/${enhet}). ` +
        (mode === 'faktisk'
            ? `Inpasseringarna var ${efterMax.efterInpass?.toLocaleString('sv-SE') ?? '—'} – ` +
              `inte rekordlåga – men bad-kWh var ${efterMax.efterBadKwh.toLocaleString('sv-SE')} kWh, ` +
              `det näst högsta i efterperioden. `
            : `Bad-kWh var ${efterMax.efterBadKwh.toLocaleString('sv-SE')} kWh. `) +
        `Kall januariluft kräver mer el för att värma den nu större bastun ` +
        `(större volym = mer värmeförlust vid kyla).`;

    /* --- Bygg HTML --- */
    el.innerHTML = `
        <h3>Analys: vad styr förbrukningen per ${enhet}?</h3>

        <div class="analys-grid">
            <div class="analys-punkt">
                <strong>Lägst kWh/${enhet}: ${foreMin.manad} – ${fmt(foreMin.foreKwh)} kWh/${enhet} (före ombyggnad)</strong>
                ${sepForeForklaring}
            </div>
            <div class="analys-punkt">
                <strong>Lägst kWh/${enhet}: ${efterMin.manad} – ${fmt(efterMin.efterKwh)} kWh/${enhet} (efter ombyggnad)</strong>
                ${sepEfterForklaring}
            </div>
            <div class="analys-punkt" style="grid-column: 1 / -1;">
                <strong>Högst kWh/${enhet}: ${efterMax.manad} – ${fmt(efterMax.efterKwh)} kWh/${enhet} (efter ombyggnad)</strong>
                ${janEfterForklaring}
            </div>
        </div>

        <div class="analys-snitt">
            <div class="snitt-kort fore">
                <span class="snitt-varde">${fmt(snittFore)} kWh</span>
                <span class="snitt-label">Typisk förbrukning per ${enhet}<br><em>före ombyggnad</em> (snitt ${jamforPar.length} månader)</span>
            </div>
            <div class="snitt-kort efter">
                <span class="snitt-varde">${fmt(snittEfter)} kWh</span>
                <span class="snitt-label">Typisk förbrukning per ${enhet}<br><em>efter ombyggnad</em> (snitt ${jamforPar.length} månader)</span>
            </div>
            <div class="snitt-kort">
                <span class="snitt-varde">${fmtPct(snittPct)}</span>
                <span class="snitt-label">Genomsnittlig förändring per ${enhet}<br>efter ombyggnaden</span>
            </div>
        </div>
    `;
}

/* ================================================================
   8. EXTRAANALYSER
   UPPDATERING 2026-06-03: Ersatte tidigare oklara mått med tre
   tydliga och korrekta nyckeltal:
   1. Besöksökning – fler badare per månad efter ombyggnad
   2. Merkostnad för badet – kr/mån mer i el för ny vs gammal bastu
   3. Säsongsanalys – bad-kWh-förändring sommar vs vinter
   ================================================================ */
function byggExtraAnalyser() {
    const container = document.getElementById('extra-analyser');
    container.innerHTML = '';

    /* --- Extraanalys 1: Besöksökning ---
       Genomsnittlig skillnad i faktiska inpasseringar per jämförbar månad */
    const inpassDiff = jamforPar.map(p => {
        const fInp = getInpass(p.fore.ar, p.fore.manIdx);
        const eInp = getInpass(p.efter.ar, p.efter.manIdx);
        return (fInp != null && eInp != null) ? eInp - fInp : null;
    }).filter(v => v != null);

    const snittForeInpass  = snitt(jamforPar.map(p => getInpass(p.fore.ar, p.fore.manIdx)));
    const snittEfterInpass = snitt(jamforPar.map(p => getInpass(p.efter.ar, p.efter.manIdx)));
    const snittInpassDiff  = snitt(inpassDiff);
    const inpassPct        = pctDiff(snittForeInpass, snittEfterInpass);

    /* --- Extraanalys 2: Merkostnad i el för badet per månad ---
       Genomsnittlig skillnad i proportionell bad-kostnad (efter minus före) */
    const badKostDiff = jamforPar.map(p => {
        const fc = badKostnadKr(p.fore);
        const ec = badKostnadKr(p.efter);
        return (fc != null && ec != null) ? ec - fc : null;
    }).filter(v => v != null);

    const snittForeBadKost  = snitt(jamforPar.map(p => badKostnadKr(p.fore)));
    const snittEfterBadKost = snitt(jamforPar.map(p => badKostnadKr(p.efter)));
    const snittBadKostDiff  = snitt(badKostDiff);
    const badKostPct        = pctDiff(snittForeBadKost, snittEfterBadKost);

    /* --- Extraanalys 3: Säsongsanalys – bad-kWh-förändring sommar vs vinter --- */
    const sommarPar = jamforPar.filter(p => [7, 8].includes(p.fore.manIdx));      /* Aug, Sep */
    const vinterPar = jamforPar.filter(p => [10, 11, 0].includes(p.fore.manIdx)); /* Nov, Dec, Jan */

    const snittSommar = snitt(sommarPar.map(p => pctDiff(p.fore.badKwh, p.efter.badKwh)));
    const snittVinter = snitt(vinterPar.map(p => pctDiff(p.fore.badKwh, p.efter.badKwh)));

    /* --- Beläggningsgradsförändring för tooltiptext ---
       Beräknas med 1 tims antagen vistelsetid som referens */
    const maxFore  = KAPACITET_FORE  / 2;
    const maxEfter = KAPACITET_EFTER / 2;
    const snittBelaggFore  = snitt(jamforPar.map(p => {
        const inp = getInpass(p.fore.ar, p.fore.manIdx);
        return belaggningsgrad(inp, maxFore, p.fore.dagar, 1);
    }));
    const snittBelaggEfter = snitt(jamforPar.map(p => {
        const inp = getInpass(p.efter.ar, p.efter.manIdx);
        return belaggningsgrad(inp, maxEfter, p.efter.dagar, 1);
    }));
    const belaggPct = pctDiff(snittBelaggFore, snittBelaggEfter);

    /* Paradox-tooltip: fler besökare men lägre beläggning */
    const paradoxTooltip = `
        <div class="paradox-tooltip" role="tooltip">
            <strong>Paradoxen: fler besökare – men tommare bastu!</strong>
            <div class="paradox-rad">
                <span>Besöksökning</span>
                <span>${fmtPct(inpassPct)} fler badare/mån</span>
            </div>
            <div class="paradox-rad">
                <span>Kapacitetsökning</span>
                <span>+50 % (18 → 27 platser/bastu)</span>
            </div>
            <div class="paradox-rad">
                <span>Beläggningsgrad (snitt, 1 tim vistelse)</span>
                <span>${fmt(snittBelaggFore, 1)} % → ${fmt(snittBelaggEfter, 1)} % (${fmtPct(belaggPct)})</span>
            </div>
            <div class="paradox-rad">
                Slutsats: kapaciteten ökade med 50 % men besöken ökade bara med ${fmtPct(inpassPct)}.
                Varje plats används statistiskt sett ${fmtPct(belaggPct)} mindre än förut –
                trots att det är fler personer i bastun totalt sett.
            </div>
        </div>`;

    /* --- Bygg HTML --- */
    const items = [
        {
            titel: 'Fler besökare efter ombyggnad',
            varde: snittInpassDiff != null
                ? (snittInpassDiff >= 0 ? '+' : '') + fmt(snittInpassDiff, 0)
                : '—',
            enhet: `badare/månad mer i snitt (${fmtPct(inpassPct)})`,
            beskrivning: `Genomsnittligt antal fler inpasseringar per månad efter ombyggnaden
                jämfört med samma kalendermånad året innan (${jamforPar.length} månader jämförs).
                Snitt före: ${fmt(snittForeInpass, 0)} besökare/mån →
                snitt efter: ${fmt(snittEfterInpass, 0)} besökare/mån.`,
            extraKlass: 'has-paradox',
            extra: `<p class="paradox-hint">&#9432; Hovra för en överraskande jämförelse med beläggningsgraden</p>${paradoxTooltip}`
        },
        {
            titel: 'Merkostnad för badet i el per månad',
            varde: snittBadKostDiff != null
                ? (snittBadKostDiff >= 0 ? '+' : '') + fmt(snittBadKostDiff, 0)
                : '—',
            enhet: `kr/månad mer i snitt (${fmtPct(badKostPct)})`,
            beskrivning: `Hur mycket mer kostar badets el per månad efter ombyggnaden?
                Beräknas som badets proportionella andel av total elkostnad (bad-kWh ÷ total-kWh × kostnad).
                Snitt före: ${fmt(snittForeBadKost, 0)} kr/mån →
                snitt efter: ${fmt(snittEfterBadKost, 0)} kr/mån.`,
            extraKlass: '',
            extra: ''
        },
        {
            titel: 'Bad-kWh-förändring: sommar vs vinter',
            varde: `${fmtPct(snittSommar)} / ${fmtPct(snittVinter)}`,
            enhet: 'sommar (Aug–Sep) / vinter (Nov–Jan)',
            beskrivning: `Den nya, större bastun kräver mer energi för uppvärmning av en större volym.
                Skillnaden mot den gamla bastun är störst på vintern
                (${fmtPct(snittVinter)} mer bad-kWh) och minst på sommaren
                (${fmtPct(snittSommar)} mer bad-kWh), då grundtemperaturen redan är högre.`,
            extraKlass: '',
            extra: ''
        }
    ];

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `extra-item ${item.extraKlass}`;
        div.innerHTML = `
            <h3>${item.titel}</h3>
            <p>${item.beskrivning}</p>
            <div class="extra-value">${item.varde}</div>
            <div class="extra-unit">${item.enhet}</div>
            ${item.extra}
        `;
        container.appendChild(div);
    });
}


/* ================================================================
   8b. BELÄGGNINGSGRAD – diagram och analys
   Beräkning:
     herrar = totalInpasseringar / 2  (50/50-antagande)
     timmar = TIMMAR_PER_DAG × dagar
     herrar_per_timme = herrar / timmar
     belaggning (%) = herrar_per_timme / (maxKapPerSauna) × 100
   maxKapPerSauna = KAPACITET / 2  (36/2=18 före, 54/2=27 efter)
   ================================================================ */

/* Hämta aktuell antagen vistelsetid från inmatningsfältet (default 1 timme) */
function getVistelseTim() {
    const el = document.getElementById('vistelse-timmar');
    if (!el) return 1;
    const v = parseFloat(el.value);
    return (!isNaN(v) && v > 0) ? v : 1;
}

/* Beräkna beläggningsgrad i procent.
   Formel: (herrar/timme × vistelsetid) / maxKapPerSauna × 100
   Antagande: varje besökare stannar 'vistelsetid' timmar.
   Om vistelsetiden fördubblas → beläggningsgraden fördubblas. */
function belaggningsgrad(inpasseringar, maxKapPerSauna, dagar, vistelseTim) {
    if (!inpasseringar || !maxKapPerSauna || !dagar) return null;
    const herrar       = inpasseringar / 2;
    const timmar       = TIMMAR_PER_DAG * dagar;
    const herrarPerTim = herrar / timmar;
    return (herrarPerTim * vistelseTim / maxKapPerSauna) * 100;
}

/* Diagram 5: Beläggningsgrad för jämförbara månadspar */
function initChartBelagg() {
    const ctx = document.getElementById('chart-belagg').getContext('2d');

    const maxFore    = KAPACITET_FORE  / 2;   /* 18 */
    const maxEfter   = KAPACITET_EFTER / 2;   /* 27 */
    const vistelse   = getVistelseTim();

    charts.belagg = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: jamforPar.map(p => p.manad),
            datasets: [
                {
                    label: `Före ombyggnad (max ${maxFore}/bastu)`,
                    data: jamforPar.map(p => {
                        const inp = getInpass(p.fore.ar, p.fore.manIdx);
                        return belaggningsgrad(inp, maxFore, p.fore.dagar, vistelse);
                    }),
                    backgroundColor: FORE_BG,
                    borderColor: FORE_COLOR,
                    borderWidth: 1,
                },
                {
                    label: `Efter ombyggnad (max ${maxEfter}/bastu)`,
                    data: jamforPar.map(p => {
                        const inp = getInpass(p.efter.ar, p.efter.manIdx);
                        return belaggningsgrad(inp, maxEfter, p.efter.dagar, vistelse);
                    }),
                    backgroundColor: EFTER_BG,
                    borderColor: EFTER_COLOR,
                    borderWidth: 1,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            return v != null
                                ? ` ${ctx.dataset.label}: ${fmt(v, 1)} %`
                                : null;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => fmt(v, 0) + ' %' },
                    title: { display: true, text: 'Beläggningsgrad (%)' }
                }
            }
        }
    });
}

/* Analystext under beläggningsdiagrammet */
function byggAnalysBelagg() {
    const el = document.getElementById('analys-belagg');
    if (!el) return;

    const maxFore    = KAPACITET_FORE  / 2;
    const maxEfter   = KAPACITET_EFTER / 2;
    const vistelse   = getVistelseTim();

    /* Beräkna beläggningsgrad för alla jämförbara par */
    const bVarden = jamforPar.map(p => {
        const fInp = getInpass(p.fore.ar, p.fore.manIdx);
        const eInp = getInpass(p.efter.ar, p.efter.manIdx);
        return {
            manad:       p.manad,
            foreBelagg:  belaggningsgrad(fInp, maxFore,  p.fore.dagar,  vistelse),
            efterBelagg: belaggningsgrad(eInp, maxEfter, p.efter.dagar, vistelse),
            foreInpass:  fInp,
            efterInpass: eInp,
            foreHerrar:  fInp ? Math.round(fInp / 2) : null,
            efterHerrar: eInp ? Math.round(eInp / 2) : null,
            foreDagar:   p.fore.dagar,
            efterDagar:  p.efter.dagar,
        };
    });

    const snittFore  = snitt(bVarden.map(v => v.foreBelagg));
    const snittEfter = snitt(bVarden.map(v => v.efterBelagg));
    const snittPct   = pctDiff(snittFore, snittEfter);

    const foreMax  = bVarden.reduce((a, b) => ((a.foreBelagg  ?? 0) >= (b.foreBelagg  ?? 0) ? a : b));
    const efterMax = bVarden.reduce((a, b) => ((a.efterBelagg ?? 0) >= (b.efterBelagg ?? 0) ? a : b));

    /* Pedagogisk exempelberäkning för januari (efter ombyggnad) */
    const janEfter = bVarden.find(v => v.manad === 'Jan');
    let exempelText = '';
    if (janEfter && janEfter.efterHerrar) {
        const tim          = TIMMAR_PER_DAG * janEfter.efterDagar;
        const herrarPerTim = janEfter.efterHerrar / tim;
        exempelText = `
            <p style="margin-top:10px">
                <strong>Exempelberäkning – januari (efter ombyggnad):</strong><br>
                ${janEfter.efterHerrar.toLocaleString('sv-SE')} herrar
                ÷ (${TIMMAR_PER_DAG} tim/dag × ${janEfter.efterDagar} dagar = ${tim} tim)
                = <strong>${fmt(herrarPerTim, 2)} herrar/tim</strong>.
                Med antagen vistelsetid ${fmt(vistelse, 1)} tim är det i snitt
                <strong>${fmt(herrarPerTim * vistelse, 2)} herrar inne</strong> i bastun per givet ögonblick.
                Det ger ${fmt(herrarPerTim * vistelse, 2)} ÷ ${maxEfter} platser =
                <strong>${fmt(janEfter.efterBelagg, 1)} % beläggning</strong>.
            </p>`;
    }

    /* Visa vad 1 h vs 2 h ger för januarivärdet (pedagogiskt) */
    const janEfterInp = janEfter?.efterInpass;
    let vistelseJamforelse = '';
    if (janEfterInp) {
        const v1 = belaggningsgrad(janEfterInp, maxEfter, 31, 1);
        const v2 = belaggningsgrad(janEfterInp, maxEfter, 31, 2);
        vistelseJamforelse = `
            <p style="margin-top:8px; padding:10px 14px; background:#fff3cd; border-radius:6px; border-left:3px solid #f0ad4e">
                <strong>Vistelsetidens påverkan (januari 2026):</strong>
                1 tim vistelsetid → <strong>${fmt(v1, 1)} %</strong> beläggning &nbsp;|&nbsp;
                2 tim vistelsetid → <strong>${fmt(v2, 1)} %</strong> beläggning.
                Beläggningsgraden är direkt proportionell mot vistelsetiden –
                dubbel vistelsetid = dubbel beläggning.
                Prova att ändra fältet ovan!
            </p>`;
    }

    el.innerHTML = `
        <h3>Vad betyder beläggningsgraden?</h3>
        <p>
            Beläggningsgraden visar hur stor andel av bastuns maxkapacitet som i genomsnitt
            är <em>samtidigt</em> ockuperad under en öppen timme.
            Beräkningen bygger på att räkna ut hur många herrar som anländer per timme
            och sedan multiplicera med antagen vistelsetid för att få fram hur många som
            faktiskt är inne vid ett givet ögonblick.
        </p>
        ${exempelText}
        ${vistelseJamforelse}

        <div class="analys-grid" style="margin-top:14px">
            <div class="analys-punkt">
                <strong>Högst beläggning – före ombyggnad: ${foreMax.manad} (${fmt(foreMax.foreBelagg, 1)} %)</strong>
                ${foreMax.foreInpass
                    ? `${foreMax.foreInpass.toLocaleString('sv-SE')} inpasseringar gav i snitt
                       ${fmt(foreMax.foreBelagg / 100 * maxFore, 2)} herrar inne av totalt ${maxFore} platser
                       (vid ${fmt(vistelse, 1)} tim vistelsetid).`
                    : ''}
            </div>
            <div class="analys-punkt">
                <strong>Högst beläggning – efter ombyggnad: ${efterMax.manad} (${fmt(efterMax.efterBelagg, 1)} %)</strong>
                ${efterMax.efterInpass
                    ? `${efterMax.efterInpass.toLocaleString('sv-SE')} inpasseringar gav i snitt
                       ${fmt(efterMax.efterBelagg / 100 * maxEfter, 2)} herrar inne av totalt ${maxEfter} platser
                       (vid ${fmt(vistelse, 1)} tim vistelsetid).`
                    : ''}
            </div>
        </div>

        <div class="analys-snitt" style="margin-top:14px">
            <div class="snitt-kort fore">
                <span class="snitt-varde">${fmt(snittFore, 1)} %</span>
                <span class="snitt-label">Genomsnittlig beläggning<br><em>före ombyggnad</em> (max ${maxFore}/bastu)</span>
            </div>
            <div class="snitt-kort efter">
                <span class="snitt-varde">${fmt(snittEfter, 1)} %</span>
                <span class="snitt-label">Genomsnittlig beläggning<br><em>efter ombyggnad</em> (max ${maxEfter}/bastu)</span>
            </div>
            <div class="snitt-kort">
                <span class="snitt-varde">${fmtPct(snittPct)}</span>
                <span class="snitt-label">Förändring i beläggningsgrad<br>
                    <em>Lägre % = fler oanvända platser per timme</em></span>
            </div>
        </div>
        <p style="margin-top:12px; font-style:italic; color:#7f8c8d; font-size:0.85em">
            Antaganden: bastun i drift ${TIMMAR_PER_DAG} tim/dag (öppen 06–22, städning 2 tim),
            50 % herrar / 50 % damer. Faktiska dagantal per månad används.
            Aktuell vistelsetid: <strong>${fmt(vistelse, 1)} timmar</strong>.
        </p>
    `;
}

/* ================================================================
   9. TOGGLE-LOGIK
   ================================================================ */
function byttVy(nyVy) {
    if (nyVy === viewMode) return;
    viewMode = nyVy;

    document.getElementById('btn-faktisk').classList.toggle('active', nyVy === 'faktisk');
    document.getElementById('btn-faktisk').setAttribute('aria-pressed', String(nyVy === 'faktisk'));
    document.getElementById('btn-max').classList.toggle('active', nyVy === 'max');
    document.getElementById('btn-max').setAttribute('aria-pressed', String(nyVy === 'max'));

    /* Diagram 4 (inpasseringar) visas bara i faktisk-vy */
    document.getElementById('chart4-section').style.display =
        nyVy === 'faktisk' ? '' : 'none';

    /* UPPDATERING 2026-06-03: Rubrik och beskrivning ändras med vyn –
       "per badare" (faktiska inpasseringar) vs "per badplats" (maxkapacitet) */
    const perEnhet = nyVy === 'faktisk' ? 'per badare' : 'per badplats';

    document.getElementById('h2-chart2').textContent =
        `kWh ${perEnhet} – jämförbara månader`;
    document.getElementById('h2-chart3').textContent =
        `Elkostnad ${perEnhet} (kr) – jämförbara månader`;

    const base = nyVy === 'faktisk'
        ? 'Baserat på faktiska inpasseringar.'
        : `Baserat på antagen full kapacitet: ${KAPACITET_FORE} platser (före) och ${KAPACITET_EFTER} platser (efter).`;
    document.getElementById('desc-chart2').textContent =
        `Hur mycket el används per ${nyVy === 'faktisk' ? 'besökare' : 'badplats'}? ` + base;
    document.getElementById('desc-chart3').textContent =
        `Proportionell badkostnad per ${nyVy === 'faktisk' ? 'besökare' : 'badplats'}. ` + base;

    uppdateraChart2och3();
    byggJamforTabell();
    byggEfterTabell();
    uppdateraSummaryCards();
    byggAnalysKwhPerBadare();
}


/* ================================================================
   10. FORMULÄR FÖR FRAMTIDA EL-DATA (localStorage)
   ================================================================ */
const LS_NYCKEL = 'fore_efter_extra_eldata_v1';

function hamtaExtraEldata() {
    try { return JSON.parse(localStorage.getItem(LS_NYCKEL) || '[]'); }
    catch { return []; }
}

function sparaExtraEldata(arr) {
    localStorage.setItem(LS_NYCKEL, JSON.stringify(arr));
}

/* Slår ihop localStorage-data med efterData-platshållare */
function slagSammanExtraEldata() {
    const extra = hamtaExtraEldata();
    extra.forEach(item => {
        const idx = efterData.findIndex(d => d.ar === item.ar && d.manIdx === item.manIdx);
        if (idx >= 0) {
            efterData[idx] = { ...efterData[idx], ...item };
        }
    });
}

function initFormular() {
    const form = document.getElementById('el-form');
    form.addEventListener('submit', e => {
        e.preventDefault();

        const ar         = parseInt(document.getElementById('form-ar').value, 10);
        const manIdx     = parseInt(document.getElementById('form-manad').value, 10);
        const badKwh     = parseFloat(document.getElementById('form-bad-kwh').value);
        const restKwh    = parseFloat(document.getElementById('form-restaurang-kwh').value);
        const kostnad    = parseFloat(document.getElementById('form-kostnad').value);

        if ([ar, manIdx, badKwh, restKwh, kostnad].some(isNaN)) {
            alert('Fyll i alla fält med giltiga siffror.');
            return;
        }

        const totalKwh = badKwh + restKwh;
        const nyPost   = {
            ar, manIdx,
            manad:    MANAD_ABBR[manIdx],
            badKwh,   totalKwh, kostnad,
            dagar:    DAGAR_PER_MANAD[manIdx]
        };

        const extra = hamtaExtraEldata();
        const exIdx = extra.findIndex(d => d.ar === ar && d.manIdx === manIdx);
        if (exIdx >= 0) extra[exIdx] = nyPost;
        else extra.push(nyPost);

        sparaExtraEldata(extra);
        slagSammanExtraEldata();
        uppdateraAllt();

        form.reset();
        const bekr = document.getElementById('form-bekraftelse');
        bekr.textContent = `${MANAD_ABBR[manIdx]} ${ar} sparad!`;
        setTimeout(() => { bekr.textContent = ''; }, 3500);
    });
}


/* ================================================================
   11. UPPDATERA ALLT (kallas efter ny data eller toggle)
   ================================================================ */
function uppdateraAllt() {
    uppdateraSummaryCards();
    uppdateraChart2och3();
    ombyggChart4();
    byggJamforTabell();
    byggEfterTabell();
    byggExtraAnalyser();
    byggAnalysKwhPerBadare();
    byggAnalysBelagg();
}


/* ================================================================
   12. INITIALISERING
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {

    /* Läs in ev. localStorage-data (slår ihop med efterData-platshållare) */
    slagSammanExtraEldata();

    /* Initiera alla diagram med fallback-inpasseringsdata */
    initChart1();
    initChart2();
    initChart3();
    initChart4();
    initChartBelagg();

    /* Bygg tabeller, extraanalyser och analystexter */
    byggJamforTabell();
    byggEfterTabell();
    byggExtraAnalyser();
    byggAnalysKwhPerBadare();
    byggAnalysBelagg();

    /* Beräkna nyckeltal */
    uppdateraSummaryCards();

    /* Toggle-knappar */
    document.getElementById('btn-faktisk').addEventListener('click', () => byttVy('faktisk'));
    document.getElementById('btn-max').addEventListener('click',     () => byttVy('max'));

    /* Manuell Firebase-uppdatering */
    document.getElementById('btn-uppdatera-firebase').addEventListener('click', async () => {
        await hamtaFirebaseInpasseringar();
        uppdateraAllt();
    });

    /* Formulär för framtida el-data */
    initFormular();

    /* Vistelsetid – uppdatera beläggningsdiagram och analys direkt vid ändring */
    document.getElementById('vistelse-timmar').addEventListener('input', () => {
        ombyggChart4();        /* återskapar chart-belagg med ny vistelsetid */
        byggAnalysBelagg();
    });

    /* Hämta live-data från Firebase och uppdatera sidan */
    await hamtaFirebaseInpasseringar();
    uppdateraAllt();
});
