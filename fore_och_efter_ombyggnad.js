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

/* Uppdatera diagram 2 och 3 när viewMode ändras */
function uppdateraChart2och3() {
    const mode = viewMode;

    charts.kwhPerPerson.data.datasets[0].data = jamforPar.map(p => kwhPerBadare(p.fore, mode));
    charts.kwhPerPerson.data.datasets[1].data = jamforPar.map(p => kwhPerBadare(p.efter, mode));
    charts.kwhPerPerson.update();

    charts.krPerPerson.data.datasets[0].data = jamforPar.map(p => krPerBadare(p.fore, mode));
    charts.krPerPerson.data.datasets[1].data = jamforPar.map(p => krPerBadare(p.efter, mode));
    charts.krPerPerson.update();
}

/* Återskapa diagram 4 (nödvändigt när inpassData förändrats) */
function ombyggChart4() {
    if (charts.inpass) {
        charts.inpass.destroy();
        delete charts.inpass;
    }
    initChart4();
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
   8. EXTRAANALYSER
   Beräknar och visar tre extraanalyser:
   - Merkostnad per extra kapacitetsplats (18 nya platser)
   - Säsongsanalys: sommar (Aug–Sep) vs vinter (Nov–Jan)
   - Beläggningsgrad: faktiska badare i % av teoretisk max per dag
   ================================================================ */
function byggExtraAnalyser() {
    const container = document.getElementById('extra-analyser');
    container.innerHTML = '';

    /* --- Extraanalys 1: Merkostnad per ny kapacitetsplats --- */
    const merkostnader = jamforPar.map(p => {
        const foreCost  = badKostnadKr(p.fore);
        const efterCost = badKostnadKr(p.efter);
        if (!foreCost || !efterCost) return null;
        return (efterCost - foreCost) / (KAPACITET_EFTER - KAPACITET_FORE); /* 18 nya platser */
    }).filter(v => v != null);

    const snittMerKostnad = snitt(merkostnader);

    /* --- Extraanalys 2: Säsongsanalys sommar vs vinter --- */
    const sommarPar  = jamforPar.filter(p => [7, 8].includes(p.fore.manIdx));      /* Aug, Sep */
    const vinterPar  = jamforPar.filter(p => [10, 11, 0].includes(p.fore.manIdx)); /* Nov, Dec, Jan */

    const snittSommar = snitt(sommarPar.map(p => pctDiff(p.fore.badKwh, p.efter.badKwh)));
    const snittVinter = snitt(vinterPar.map(p => pctDiff(p.fore.badKwh, p.efter.badKwh)));

    /* --- Extraanalys 3: Beläggningsgrad (faktisk vy) --- */
    /* kWh/badare (faktisk) / kWh/badare (max) × 100 ger ett mått på hur
       "full" bastun är relativt sin kapacitet, baserat på energianvändning */
    const belaggPar = jamforPar.map(p => {
        const faktE = kwhPerBadare(p.efter, 'faktisk');
        const maxE  = kwhPerBadare(p.efter, 'max');
        if (!faktE || !maxE) return null;
        /* Kvoten maxE/faktE visar hur kapacitetsutnyttjandet ser ut:
           om kWh/faktisk_badare > kWh/per_max_kapacitet = fler faktiska än max → ej möjligt
           Egentligen: faktiska inpasseringar / max_kapacitet × 100 */
        const faktInpass = getInpass(p.efter.ar, p.efter.manIdx);
        return faktInpass ? (faktInpass / KAPACITET_EFTER) * 100 : null;
    }).filter(v => v != null);

    const snittBelagg = snitt(belaggPar);

    /* --- Bygg HTML för extraanalyserna --- */
    const items = [
        {
            titel: 'Merkostnad per ny kapacitetsplats',
            varde: snittMerKostnad != null ? fmt(snittMerKostnad, 0) : '—',
            enhet: 'kr/plats/månad (snitt)',
            beskrivning: `Ombyggnaden lade till ${KAPACITET_EFTER - KAPACITET_FORE} platser (${KAPACITET_FORE} → ${KAPACITET_EFTER}). Genomsnittlig merkostnad i el per ny plats och månad för de jämförbara månaderna.`
        },
        {
            titel: 'Bad-kWh-förändring: sommar vs vinter',
            varde: `${fmtPct(snittSommar)} / ${fmtPct(snittVinter)}`,
            enhet: 'sommar (Aug–Sep) / vinter (Nov–Jan)',
            beskrivning: 'Den nya, större bastun kräver mer energi för uppvärmning. Skillnaden är störst på vintern då en större volym ska värmas, och minst på sommaren då grundtemperaturen är högre.'
        },
        {
            titel: 'Faktiska badare vs maxkapacitet (efter)',
            varde: snittBelagg != null ? fmt(snittBelagg, 0) + ' %' : '—',
            enhet: 'snitt beläggningsgrad (faktisk/max)',
            beskrivning: `Faktiska inpasseringar i förhållande till max ${KAPACITET_EFTER} badare per dag. Obs: kapaciteten är per samtidiga badare, inte per dag – faktisk daglig genomströmning kan vara flerfaldigt högre.`
        }
    ];

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'extra-item';
        div.innerHTML = `
            <h3>${item.titel}</h3>
            <p>${item.beskrivning}</p>
            <div class="extra-value">${item.varde}</div>
            <div class="extra-unit">${item.enhet}</div>
        `;
        container.appendChild(div);
    });
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

    /* Uppdatera beskrivningstexter */
    const base = nyVy === 'faktisk'
        ? 'Baserat på faktiska inpasseringar.'
        : `Baserat på antagen full kapacitet: ${KAPACITET_FORE} (före) och ${KAPACITET_EFTER} (efter) badare.`;
    document.getElementById('desc-chart2').textContent =
        'Hur mycket el används per besökare? ' + base;
    document.getElementById('desc-chart3').textContent =
        'Proportionell badkostnad per besökare. ' + base;

    uppdateraChart2och3();
    byggJamforTabell();
    byggEfterTabell();
    uppdateraSummaryCards();
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

    /* Bygg tabeller och extraanalyser */
    byggJamforTabell();
    byggEfterTabell();
    byggExtraAnalyser();

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

    /* Hämta live-data från Firebase och uppdatera sidan */
    await hamtaFirebaseInpasseringar();
    uppdateraAllt();
});
