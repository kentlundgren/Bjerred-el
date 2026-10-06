# -*- coding: utf-8 -*-
"""
Granskning 2, punkt 3: formeltest.
Kör de riktiga sidorna (enea_jamforelse.html, intern_debitering.html) i Chromium via Playwright,
fyller i Eneas priser för elva prisuppsättningar och läser av vad sidan visar. Jämför med
(a) README-formeln räknad oberoende i Python (Decimal) och
(b) en beräkning från grunden (nät + skatt + Eneas pris + fast avgift + månadsavgift, × 1,25)
    som inte utgår från fakturans belopp.
Läser också debiteringsunderlaget (intern_underlag.js) för alla sex månader ur sidan.
Kör: python3 -I formler.py <mapp med sidans filer> <fakt.json>
"""
import sys, json
from decimal import Decimal as D, ROUND_HALF_UP
from playwright.sync_api import sync_playwright

SITE, FAKTJSON = sys.argv[1], sys.argv[2]
FAKT = json.load(open(FAKTJSON))['FAKT']
MON = ['202601', '202602', '202603', '202604', '202605', '202606']
KEY = {m: m[:4] + '-' + m[4:] for m in MON}

def r0(x):
    return int(x.quantize(D(1), rounding=ROUND_HALF_UP))

def num(s):
    s = s.replace('−', '-').replace(' ', '').replace(' ', '').replace(',', '.').replace('+', '')
    return None if s in ('–', '') else D(s)

# Kraftringens "El inkl elcert" och hyresgästdata enligt fakturor/bilder (granskade i granska.py)
EL = {m: D(FAKT[m]['spot_ore']) + D(FAKT[m]['rorl_ore']) + D(FAKT[m]['pasl_ore']) for m in MON}
HG = {'202601': (16586, 37341), '202602': (16342, 36647), '202603': (10302, 19213),
      '202604': (11582, 17873), '202605': (12430, 23521), '202606': (11756, 24017)}

# Elva prisuppsättningar (öre/kWh som text, precis som de skrivs in) och månadsavgift (kr/mån exkl moms)
def lika(v): return {m: v for m in MON}
SCEN = [
    ('S1 Samma som Kraftringen, ingen avgift', {m: str(EL[m]).replace('.', ',') for m in MON}, ''),
    ('S2 100 öre alla månader, ingen avgift', lika('100'), ''),
    ('S3 100 öre alla månader, avgift 500 kr', lika('100'), '500'),
    ('S4 Kraftringen − 10 öre, ingen avgift', {m: str(EL[m] - 10).replace('.', ',') for m in MON}, ''),
    ('S5 Kraftringen + 5 öre, avgift 250 kr', {m: str(EL[m] + 5).replace('.', ',') for m in MON}, '250'),
    ('S6 0 öre (gränsfall), ingen avgift', lika('0'), ''),
    ('S7 Decimaler och komma: 95,5 / 88.25 / 70,1 / 55,75 / 80,4 / 90,05, avgift "1 000"',
        dict(zip(MON, ['95,5', '88.25', '70,1', '55,75', '80,4', '90,05'])), '1 000'),
    ('S8 Varierande: 110 / 105 / 80 / 60 / 85 / 95, ingen avgift', dict(zip(MON, ['110', '105', '80', '60', '85', '95'])), ''),
    ('S9 Varierande som S8, avgift 399 kr', dict(zip(MON, ['110', '105', '80', '60', '85', '95'])), '399'),
    ('S10 250 öre alla månader, avgift 0', lika('250'), '0'),
    ('S11 Bara jan och jun ifyllda (120 / 100), avgift 100 kr', {'202601': '120', '202606': '100'}, '100'),
]

def readme_formel(m, ore, avg):
    # Faktura med Eneas = faktura idag + ((Eneas − Kraftringen) × kWh / 100 + avgift) × 1,25
    kwh = D(FAKT[m]['kwh']); idag = D(FAKT[m]['totalt_avrundat'])
    return r0(idag + ((ore - EL[m]) * kwh / 100 + avg) * D('1.25'))

def fran_grunden(m, ore, avg):
    # Hela fakturan utan att utgå från fakturans belopp: fast avgift + (nät + skatt + Eneas) × kWh + avgift, × 1,25
    f = FAKT[m]; kwh = D(f['kwh'])
    exkl = D(f['fast']) + kwh * (D(f['nat_ore']) + D(f['skatt_ore']) + ore) / 100 + avg
    return r0(exkl * D('1.25'))

def hg_formel(m, ore):
    kwh, kr = HG[m]
    return r0(D(kr) + (ore - EL[m]) / 100 * kwh * D('1.25'))

def hg_grunden(m, ore):
    kwh, _ = HG[m]; f = FAKT[m]
    return r0((D(f['nat_ore']) + ore + D(f['skatt_ore'])) * kwh / 100 * D('1.25'))

def tolka(s):
    return D(s.replace(' ', '').replace(',', '.'))

res = {'scen': [], 'underlag': {}}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    for namn, priser, avg in SCEN:
        ctx = b.new_context(); pg = ctx.new_page()
        pg.goto('file://' + SITE + '/enea_jamforelse.html')
        pg.fill('#avgift', avg)
        for m in MON:
            pg.fill('#ore-' + KEY[m], priser.get(m, ''))
        sida = {m: num(pg.inner_text('#e-fak-' + KEY[m])) for m in MON}
        sida_dkr = {m: num(pg.inner_text('#e-dkr-' + KEY[m])) for m in MON}
        sum_eneas = pg.inner_text('#tab-eneas tfoot').strip()
        # Intern sida (delar lagringsnyckel, men vi fyller i själva för säkerhets skull)
        pg2 = ctx.new_page(); pg2.goto('file://' + SITE + '/intern_debitering.html')
        for m in MON:
            pg2.fill('#ore-' + KEY[m], priser.get(m, ''))
        sida_hg = {m: num(pg2.inner_text('#h-eneas-' + KEY[m])) for m in MON}
        avgD = tolka(avg) if avg.strip() else D(0)
        rows = []
        for m in MON:
            if m not in priser:
                rows.append(dict(m=m, ore=None)); continue
            ore = tolka(priser[m])
            rows.append(dict(m=m, ore=str(ore), sida=str(sida[m]), readme=readme_formel(m, ore, avgD),
                             grunden=fran_grunden(m, ore, avgD), idag=FAKT[m]['totalt_avrundat'], sida_diff=str(sida_dkr[m]),
                             hg_sida=str(sida_hg[m]), hg_formel=hg_formel(m, ore), hg_grunden=hg_grunden(m, ore)))
        res['scen'].append(dict(namn=namn, avgift=str(avgD), rows=rows, summarad=sum_eneas))
        ctx.close()
    # Debiteringsunderlaget, alla sex månader ur sidan
    ctx = b.new_context(); pg = ctx.new_page()
    pg.goto('file://' + SITE + '/intern_debitering.html')
    for m in MON:
        pg.click('#manadsval button[data-key="%s"]' % KEY[m])
        res['underlag'][m] = {i: pg.inner_text('#' + i) for i in
            ['u-huvud', 'u-herr', 'u-dam', 'u-bastu', 'u-varm', 'h-kwh-1', 'h-kr-1', 'h-kr-2', 'h-kr-3', 'h-sumore', 'h-exkl', 'h-moms', 'h-tot']}
    b.close()

json.dump(res, open(SITE + '/../formler_res.json', 'w'), ensure_ascii=False, indent=1, default=str)
# Utskrift
for s in res['scen']:
    print('\n' + s['namn'], '| avgift', s['avgift'])
    for r in s['rows']:
        if r['ore'] is None:
            print('  ', r['m'], 'ej ifylld'); continue
        print('   %s öre %-7s sida %-7s README %-7s %s | grunden %-7s (sida−grund %s) | idag %s diff %s || HG sida %s formel %s %s grunden %s (diff %s)' % (
            r['m'], r['ore'], r['sida'], r['readme'], 'OK' if int(D(r['sida'])) == r['readme'] else 'AVVIKER',
            r['grunden'], int(D(r['sida'])) - r['grunden'], r['idag'], r['sida_diff'],
            r['hg_sida'], r['hg_formel'], 'OK' if int(D(r['hg_sida'])) == r['hg_formel'] else 'AVVIKER',
            r['hg_grunden'], int(D(r['hg_sida'])) - r['hg_grunden']))
    print('   summarad:', s['summarad'].replace('\n', ' | ').replace('\t', ' | '))
print('\nUnderlag ur sidan:')
for m, v in res['underlag'].items():
    print(m, v)
