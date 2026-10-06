# -*- coding: utf-8 -*-
"""
Oberoende granskning, granskning 2 (2026-10-06).
Läser Kraftringens sex fakturor (pdftotext), kontrollerar fakturornas egen räkning,
jämför med datalistorna i JS-filerna och räknar debiteringsunderlagen från mätarställningar.
Bilddata (debiteringsunderlagen) är avläst för hand ur de sex JPG-bilderna och skrivs in nedan.
Kör: python3 -I granska.py <mapp med fakturor> <mapp med js>
"""
import re, subprocess, sys, glob, os, json
from decimal import Decimal as D, ROUND_HALF_UP

FAKT_DIR, JS_DIR = sys.argv[1], sys.argv[2]

def num(s):
    # Svenskt tal "8 824,00" eller "35422.14" -> Decimal
    return D(s.replace(' ', '').replace(' ', '').replace(',', '.'))

def r(x, n=0):
    q = D(1).scaleb(-n)
    return x.quantize(q, rounding=ROUND_HALF_UP)

# ---------------------------------------------------------------- 1. Läs fakturorna
FAKT = {}
for f in sorted(glob.glob(os.path.join(FAKT_DIR, '2026*.pdf'))):
    mon = os.path.basename(f)[:6]
    t = subprocess.run(['pdftotext', '-raw', f, '-'], capture_output=True, text=True).stdout
    t1 = re.sub(r'\s+', ' ', t)          # allt på en rad, så att radbrytningar inte stör
    def g(pat):
        m = re.search(pat, t1)
        if not m:
            raise SystemExit('Hittar inte %s i %s' % (pat, f))
        return m.groups()
    N = r'([\d ]+,\d{2})'
    d = {}
    d['totalt_avrundat'] = num(g(r'Avser \w+ 2026 ([\d ]+) kr')[0])
    d['oresutj'] = num(g(r'Öresutjämning (-?[\d,]+) \)')[0])
    d['exkl'] = num(g(r'Summa exkl\. moms ' + N)[0])
    d['moms'] = num(g(r'Moms ' + N + r' Bankgiro')[0])
    d['nr'] = g(r'Faktura/ OCR-nummer (\d+)')[0]
    d['fast_pris'], d['fast'] = [num(x) for x in g(r'Fast avgift \(1\.00 mån à ([\d ]+,\d{2}) kr/mån\) Avser \w+-26 ' + N)]
    a = g(r'Elöverföring \(([\d.]+) kWh à ([\d,]+) öre/kWh\) Avser \w+-26 ' + N)
    d['kwh'], d['nat_ore'], d['nat_kr'] = num(a[0]), num(a[1]), num(a[2])
    # pdftotext -raw kan lägga beloppet före eller efter "Avser"; ta båda fallen
    def rad(namn):
        m = re.search(namn + r' \(([\d.]+) kWh à ([\d,]+) öre/kWh\) Avser \w+-26 ' + N, t1)
        return num(m.group(1)), num(m.group(2)), num(m.group(3))
    for key, namn in [('skatt', 'Energiskatt'), ('spot', 'Spotpris'), ('rorl', 'Rörliga kostnader'), ('pasl', 'Fast påslag')]:
        k, o, kr = rad(namn)
        d[key + '_kwh'], d[key + '_ore'], d[key + '_kr'] = k, o, kr
    d['manadsavg'] = num(g(r'Månadsavgift \(1\.00 mån à ([\d,]+) kr/mån\)')[0])
    momsrader = re.findall(r'Moms \(25%\) ' + N, t1)
    d['moms_nat'], d['moms_handel'] = num(momsrader[0]), num(momsrader[1])
    d['tot_nat'] = num(g(r'Totalt Elnät ' + N)[0])
    d['tot_handel'] = num(g(r'Totalt Elhandel ' + N)[0])
    st = re.findall(r'Avläsning 2026-\d\d-01 ([\d ]+,\d{2})', t1)
    d['mst_start'], d['mst_slut'] = num(st[0]), num(st[1])
    d['anv'] = num(g(r'Avläsning 2026-\d\d-01 [\d ]+,\d{2} ([\d ]+,\d{2}) kWh')[0])
    FAKT[mon] = d

# ---------------------------------------------------------------- 2. Fakturornas egen räkning
print('=== 2. FAKTURORNAS EGEN RÄKNING ===')
for mon, d in FAKT.items():
    rows = []
    for key in ['nat', 'skatt', 'spot', 'rorl', 'pasl']:
        if key == 'nat':
            kwh, ore, kr = d['kwh'], d['nat_ore'], d['nat_kr']
        else:
            kwh, ore, kr = d[key + '_kwh'], d[key + '_ore'], d[key + '_kr']
        calc = kwh * ore / 100
        rows.append('%s %s×%s=%s (fakt %s, diff %s; implicit pris %s)' % (
            key, kwh, ore, r(calc, 2), kr, r(kr - calc, 2), r(kr / kwh * 100, 4)))
    natexkl = d['fast'] + d['nat_kr'] + d['skatt_kr']
    hexkl = d['spot_kr'] + d['rorl_kr'] + d['pasl_kr'] + d['manadsavg']
    chk = {
        'kwh_lika_alla_rader': len({d['kwh'], d['skatt_kwh'], d['spot_kwh'], d['rorl_kwh'], d['pasl_kwh']}) == 1,
        'mätare slut-start': str(d['mst_slut'] - d['mst_start']),
        'moms nät 25%': '%s vs %s' % (r(natexkl * D('0.25'), 2), d['moms_nat']),
        'tot nät': '%s vs %s' % (natexkl + d['moms_nat'], d['tot_nat']),
        'moms handel 25%': '%s vs %s' % (r(hexkl * D('0.25'), 2), d['moms_handel']),
        'tot handel': '%s vs %s' % (hexkl + d['moms_handel'], d['tot_handel']),
        'exkl': '%s vs %s' % (natexkl + hexkl, d['exkl']),
        'moms tot': '%s vs %s' % (d['moms_nat'] + d['moms_handel'], d['moms']),
        'totalt': '%s + öresutj %s = %s vs %s' % (d['exkl'] + d['moms'], d['oresutj'], d['exkl'] + d['moms'] + d['oresutj'], d['totalt_avrundat']),
        'el inkl elcert': str(d['spot_ore'] + d['rorl_ore'] + d['pasl_ore']),
        'el inkl elcert implicit (kr/kWh)': str(r((d['spot_kr'] + d['rorl_kr'] + d['pasl_kr']) / d['kwh'] * 100, 4)),
    }
    print(mon, d['nr'])
    for x in rows: print('   ', x)
    for k, v in chk.items(): print('   ', k, ':', v)

# ---------------------------------------------------------------- 3. Data i JS-filerna
def js_list(fil, namn):
    t = open(os.path.join(JS_DIR, fil), encoding='utf-8').read()
    m = re.search(r'var ' + namn + r' = \[(.*?)\n  \];', t, re.S)
    return m.group(1)

ej = js_list('enea_jamforelse.js', 'MANADER')
EJ = {}
for m in re.finditer(r"key: '(\d{4})-(\d\d)'.*?kwh: ([\d.]+), fakturaKr: (\d+), krOre: ([\d.]+),\s*natOre: ([\d.]+), skattOre: ([\d.]+), fastNatKr: (\d+)", ej):
    EJ[m.group(1) + m.group(2)] = dict(kwh=D(m.group(3)), fakturaKr=D(m.group(4)), krOre=D(m.group(5)), natOre=D(m.group(6)), skattOre=D(m.group(7)), fastNatKr=D(m.group(8)))
idb = js_list('intern_debitering.js', 'MANADER')
ID = {}
for m in re.finditer(r"key: '(\d{4})-(\d\d)'.*?krOre: ([\d.]+),\s*hgKwh: (\d+), hgKr: (\d+)", idb):
    ID[m.group(1) + m.group(2)] = dict(krOre=D(m.group(3)), hgKwh=D(m.group(4)), hgKr=D(m.group(5)))
us = js_list('intern_underlag.js', 'STANDARD')
US = {}
blocks = re.split(r"\{ key: '", us)[1:]
for b in blocks:
    mon = b[:7].replace('-', '')
    def q(p):
        mm = re.search(p, b)
        return mm.group(1) if mm else None
    US[mon] = dict(
        faktura=num(q(r"faktura: '(\d+)'")), nr=q(r"nr: '(\d+)'"), kwhFaktura=num(q(r"kwhFaktura: '([\d,]+)'")),
        facit=D(q(r"facit: (\d+)")),
        s=dict((k, D(v)) for k, v in re.findall(r"(huvud|herr|dam|varm): '(\d+)'", (re.search(r"s: \{(.*?)\}", b).group(1)))),
        e=dict((k, D(v)) for k, v in re.findall(r"(huvud|herr|dam|varm): '(\d+)'", (re.search(r"e: \{(.*?)\}", b).group(1)))),
        p=dict((k, num(v)) for k, v in re.findall(r"(rorlig|el|skatt): '([\d,]+)'", b)))

print('\nAntal månader inlästa: EJ', len(EJ), 'ID', len(ID), 'US', len(US))

# ---------------------------------------------------------------- 4. Bilddata (avläst för hand ur JPG)
# Ordning: faktura, nr, huvud start/slut/förbr, herr start/slut/förbr, dam start/slut/förbr,
# bastuTOT start/slut/förbr, varm start/slut/förbr, hgKwh, öre (fast, rörlig, el, skatt),
# kr (fast, rörlig, el, skatt), öresumma, exkl, moms, totalt
BILD = {
 '202601': dict(faktura=90779, nr='3082197306', huvud=(176911, 212333, 35422), herr=(25833, 33683, 7850), dam=(22118, 28997, 6879),
                bastu=(47950, 62680, 14729), varm=(669857, 673964, 4107), hg=16586,
                ore=('24,91', '21,87', '122,24', '36,00'), kr=('0,00', '3627,31', '20274,45', '5970,88'),
                oresumma='205,02', exkl='29872,63', moms='7468,16', tot='37341,00'),
 '202602': dict(faktura=82794, nr='3098735503', huvud=(212333, 244335, 32002), herr=(33683, 40360, 6677), dam=(28997, 34159, 5162),
                bastu=(62680, 74519, 11839), varm=(673964, 677785, 3821), hg=16342,
                ore=('0', '21,84', '121,56', '36,00'), kr=('0,00', '3569,06', '19865,14', '5883,06'),
                oresumma='179,4', exkl='29317,26', moms='7329,32', tot='36647,00'),
 '202603': dict(faktura=63389, nr='3112109404', huvud=(244335, 272409, 28074), herr=(40360, 46950, 6590), dam=(34159, 40312, 6153),
                bastu=(74519, 87262, 12743), varm=(677785, 682814, 5029), hg=10302,
                ore=('0', '20,33', '92,87', '36,00'), kr=('0,00', '2094,40', '9567,47', '3708,72'),
                oresumma='149,2', exkl='15370,58', moms='3842,65', tot='19213,00'),
 '202604': dict(faktura=52186, nr='3126369101', huvud=(272409, 299080, 26671), herr=(46950, 52762, 5812), dam=(40312, 45725, 5413),
                bastu=(87262, 98487, 11225), varm=(682814, 686678, 3864), hg=11582,
                ore=('33,08', '19,16', '68,29', '36,00'), kr=('3831,44', '2219,18', '7909,58', '4169,64'),
                oresumma='156,53', exkl='18129,84', moms='4532,46', tot='22662,00'),
 '202605': dict(faktura=56338, nr='3141677009', huvud=(299080, 323021, 23941), herr=(52762, 57338, 4576), dam=(45725, 50173, 4449),
                bastu=(98487, 107511, 9024), varm=(686678, 689165, 2487), hg=12430,
                ore=('36,86', '20,39', '95,00', '36,00'), kr=('4581,55', '2534,39', '11808,11', '4474,65'),
                oresumma='188,25', exkl='23398,70', moms='5849,68', tot='29248,00'),
 '202606': dict(faktura=53134, nr='3154522605', huvud=(323021, 343630, 20609), herr=(57338, 61254, 3916), dam=(50173, 53688, 3515),
                bastu=(107511, 114941, 7430), varm=(689165, 690588, 1423), hg=11756,
                ore=('42,82', '20,99', '106,45', '36,00'), kr=('5033,90', '2467,57', '12514,21', '4232,14'),
                oresumma='206,26', exkl='24247,82', moms='6061,96', tot='30310,00'),
}

# ---------------------------------------------------------------- 5. Jämför fält
TAB = []   # (fil, månad, fält, förväntat, i sidan, källa, status)
def jmf(fil, mon, falt, forv, sida, kalla, tol=D(0), klass_om_avvik='FEL'):
    forv_d, sida_d = D(str(forv)), D(str(sida))
    diff = sida_d - forv_d
    if diff == 0:
        st = 'OK'
    elif abs(diff) <= tol:
        st = 'OK (avrundning, diff %s)' % diff
    else:
        st = '%s (diff %s)' % (klass_om_avvik, diff)
    TAB.append((fil, mon, falt, str(forv), str(sida), kalla, st))

for mon, d in FAKT.items():
    src = 'Faktura %s s.2' % mon
    ej, idd, u, bi = EJ[mon], ID[mon], US[mon], BILD[mon]
    el = d['spot_ore'] + d['rorl_ore'] + d['pasl_ore']
    # enea_jamforelse.js
    jmf('enea_jamforelse.js', mon, 'kwh', d['kwh'], ej['kwh'], src)
    jmf('enea_jamforelse.js', mon, 'fakturaKr', d['totalt_avrundat'], ej['fakturaKr'], 'Faktura %s s.1' % mon)
    jmf('enea_jamforelse.js', mon, 'krOre (spot+rörl+påslag)', el, ej['krOre'], src)
    jmf('enea_jamforelse.js', mon, 'natOre', d['nat_ore'], ej['natOre'], src)
    jmf('enea_jamforelse.js', mon, 'skattOre', d['skatt_ore'], ej['skattOre'], src)
    jmf('enea_jamforelse.js', mon, 'fastNatKr', d['fast'], ej['fastNatKr'], src)
    # intern_underlag.js mot faktura
    jmf('intern_underlag.js', mon, 'faktura', d['totalt_avrundat'], u['faktura'], 'Faktura %s s.1' % mon)
    jmf('intern_underlag.js', mon, 'nr', int(d['nr']), int(u['nr']), 'Faktura %s s.1' % mon)
    jmf('intern_underlag.js', mon, 'kwhFaktura', d['kwh'], u['kwhFaktura'], src)
    jmf('intern_underlag.js', mon, 'p.rorlig', d['nat_ore'], u['p']['rorlig'], src)
    jmf('intern_underlag.js', mon, 'p.el', el, u['p']['el'], src)
    jmf('intern_underlag.js', mon, 'p.skatt', d['skatt_ore'], u['p']['skatt'], src)
    # intern_underlag.js mot bild
    bsrc = 'Bild %s_Intern_debitering.jpg' % mon
    jmf('intern_underlag.js', mon, 'faktura (bild)', bi['faktura'], u['faktura'], bsrc)
    jmf('intern_underlag.js', mon, 'nr (bild)', int(bi['nr']), int(u['nr']), bsrc)
    for f in ['huvud', 'herr', 'dam', 'varm']:
        jmf('intern_underlag.js', mon, 'e.%s (utgående)' % f, bi[f][1], u['e'][f], bsrc)
        if mon == '202601':
            jmf('intern_underlag.js', mon, 's.%s (ingående)' % f, bi[f][0], u['s'][f], bsrc)
    jmf('intern_underlag.js', mon, 'p.rorlig (bild)', num(bi['ore'][1]), u['p']['rorlig'], bsrc)
    jmf('intern_underlag.js', mon, 'p.el (bild)', num(bi['ore'][2]), u['p']['el'], bsrc)
    jmf('intern_underlag.js', mon, 'p.skatt (bild)', num(bi['ore'][3]), u['p']['skatt'], bsrc)
    # huvudmätare, bild mot faktura (avrundning)
    jmf('bild mot faktura', mon, 'huvud ingående', r(d['mst_start']), bi['huvud'][0], src + ' / ' + bsrc, tol=D(1), klass_om_avvik='AVVIKELSE')
    jmf('bild mot faktura', mon, 'huvud utgående', r(d['mst_slut']), bi['huvud'][1], src + ' / ' + bsrc, tol=D(1), klass_om_avvik='AVVIKELSE')
    jmf('bild mot faktura', mon, 'huvud förbrukning', r(d['kwh']), bi['huvud'][2], src + ' / ' + bsrc, tol=D(1), klass_om_avvik='AVVIKELSE')
    jmf('bild mot faktura', mon, 'el inkl elcert', el, num(bi['ore'][2]), src + ' / ' + bsrc)
    jmf('bild mot faktura', mon, 'rörlig nät', d['nat_ore'], num(bi['ore'][1]), src + ' / ' + bsrc)
    jmf('bild mot faktura', mon, 'energiskatt', d['skatt_ore'], num(bi['ore'][3]), src + ' / ' + bsrc)
    # intern_debitering.js
    jmf('intern_debitering.js', mon, 'krOre', el, idd['krOre'], src)
    jmf('intern_debitering.js', mon, 'hgKwh', bi['hg'], idd['hgKwh'], bsrc)
    # facit: jan-mar = bildens totalt; apr-jun = bild utan fast avgift
    if mon in ('202601', '202602', '202603'):
        jmf('intern_debitering.js', mon, 'hgKr', num(bi['tot']), idd['hgKr'], bsrc)
        jmf('intern_underlag.js', mon, 'facit', num(bi['tot']), u['facit'], bsrc)
    else:
        utan = num(bi['kr'][1]) + num(bi['kr'][2]) + num(bi['kr'][3])
        rattat = r(utan * D('1.25'))
        jmf('intern_debitering.js', mon, 'hgKr (rättat, utan fast avg.)', rattat, idd['hgKr'], bsrc + ' minus fast avgift ×1,25')
        jmf('intern_underlag.js', mon, 'facit (rättat)', rattat, u['facit'], bsrc + ' minus fast avgift ×1,25')

# kedjan: utgående förra månaden = ingående denna (bild)
mons = sorted(BILD)
for i in range(1, len(mons)):
    for f in ['huvud', 'herr', 'dam', 'varm', 'bastu']:
        jmf('bild (kedja)', mons[i], '%s ingående = förra utgående' % f, BILD[mons[i-1]][f][1], BILD[mons[i]][f][0], 'Bilder %s/%s' % (mons[i-1], mons[i]))
# fakturans mätarkedja
for i in range(1, len(mons)):
    jmf('faktura (kedja)', mons[i], 'ingående = förra utgående', FAKT[mons[i-1]]['mst_slut'], FAKT[mons[i]]['mst_start'], 'Fakturor')

print('\n=== 5. FÄLTJÄMFÖRELSE ===')
for t in TAB:
    print(' | '.join(t))
print('Antal kontroller:', len(TAB), ' ej OK:', sum(1 for t in TAB if not t[6].startswith('OK')))

# ---------------------------------------------------------------- 6. Debiteringsunderlaget från mätarställningar (PRD avsnitt 5)
print('\n=== 6. DEBITERINGSUNDERLAG FRÅN MÄTARSTÄLLNINGAR ===')
UND = {}
prev = None
for mon in mons:
    u = US[mon]
    s = u['s'] if mon == '202601' else US[prev]['e']
    forb = {f: u['e'][f] - s[f] for f in ['huvud', 'herr', 'dam', 'varm']}
    bastu = forb['herr'] + forb['dam']
    hg = forb['huvud'] - bastu - forb['varm']
    kr = {p: hg * u['p'][p] / 100 for p in ['rorlig', 'el', 'skatt']}
    exkl = sum(kr.values())
    moms = exkl * D('0.25')
    tot = r(exkl + moms)
    UND[mon] = dict(forb=forb, bastu=bastu, hg=hg, kr=kr, exkl=exkl, moms=moms, tot=tot)
    bi = BILD[mon]
    print(mon, 'huvud', forb['huvud'], '(bild', bi['huvud'][2], ', faktura', FAKT[mon]['kwh'], ')',
          'herr', forb['herr'], '(bild', bi['herr'][2], ') dam', forb['dam'], '(bild', bi['dam'][2], ')',
          'bastu', bastu, '(bild', bi['bastu'][2], ') varm', forb['varm'], '(bild', bi['varm'][2], ')',
          'hg', hg, '(bild', bi['hg'], ')')
    print('     kr rörlig %s el %s skatt %s | exkl %s moms %s TOT %s | facit %s diff %s' % (
        r(kr['rorlig'], 2), r(kr['el'], 2), r(kr['skatt'], 2), r(exkl, 2), r(moms, 2), tot, u['facit'], tot - u['facit']))
    # bildens egen räkning: kr-rader, summa, moms, totalt
    krb = [num(x) for x in bi['kr']]
    oreb = [num(x) for x in bi['ore']]
    impl = [r(k / (o / 100), 2) if o else None for k, o in zip(krb, oreb)]
    print('     bild: implicit hg-kWh per rad (kr/öre) =', impl,
          '| summa rader', sum(krb), 'vs', bi['exkl'], '| moms 25%', r(num(bi['exkl']) * D('0.25'), 2), 'vs', bi['moms'],
          '| exkl+moms', num(bi['exkl']) + num(bi['moms']), '-> avr', r(num(bi['exkl']) + num(bi['moms'])), 'vs', bi['tot'],
          '| öresumma', sum(oreb), 'vs', bi['oresumma'])
    # fast avgift öre/kWh i bilden = 8824 / faktura-kWh?
    print('     fast avgift 8824/kWh*100 =', r(D(8824) / FAKT[mon]['kwh'] * 100, 4), ' bild', bi['ore'][0])
    # rättat belopp (PRD 4.3) räknat på bildens kr-rader
    utan = krb[1] + krb[2] + krb[3]
    print('     bild utan fast avgift: exkl %s moms %s tot %s (avr %s)' % (utan, r(utan * D('0.25'), 2), utan * D('1.25'), r(utan * D('1.25'))))
    prev = mon

# Med fakturans decimaler på huvudmätaren (bildens bastu och varmvatten)
print('\n--- Hyresgäst-kWh med fakturans decimal-kWh (bastu/varmvatten från bilden) ---')
for mon in mons:
    hgdec = FAKT[mon]['kwh'] - BILD[mon]['bastu'][2] - BILD[mon]['varm'][2]
    print(mon, hgdec)

json.dump({'FAKT': {k: {kk: str(vv) for kk, vv in v.items()} for k, v in FAKT.items()}}, open(os.path.join(os.path.dirname(__file__), 'fakt.json'), 'w'), indent=1)
json.dump(TAB, open(os.path.join(os.path.dirname(__file__), 'tab.json'), 'w'), ensure_ascii=False, indent=0)
