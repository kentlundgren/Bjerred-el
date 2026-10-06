# Steg 1: fakturornas interna räkning.  Steg 2: sidornas data mot fakturorna.
import json
F = json.load(open('fakturor.json', encoding='utf-8'))
J = json.load(open('jsdata.json', encoding='utf-8'))
mån = ['januari 2026','februari 2026','mars 2026','april 2026','maj 2026','juni 2026']
ok = fel = 0
def kolla(namn, cond, detalj=''):
    global ok, fel
    if cond: ok += 1
    else:
        fel += 1; print('  AVVIKELSE:', namn, detalj)
print('=== STEG 1: fakturornas interna räkning (6 fakturor) ===')
for m in mån:
    d = F[m]; k = d['kwh_fakturan']
    # belopp = kWh × öre/100 (tolerans: öre-priset är avrundat till 2 decimaler på fakturan)
    for nm, ore, kr in [('elöverföring', d['nat_ore'], d['nat_kr']), ('energiskatt', d['skatt_ore'], d['skatt_kr']),
                         ('spotpris', d['spot_ore'], d['spot_kr']), ('rörliga', d['rorl_ore'], d['rorl_kr']), ('påslag', d['pasl_ore'], d['pasl_kr'])]:
        tol = k * 0.005 / 100 + 0.011
        kolla(f'{m} {nm}: kWh×öre', abs(k*ore/100 - kr) <= tol, f'{k*ore/100:.2f} vs {kr}')
    kolla(f'{m} mätarkedja', abs((d['mat_slut']-d['mat_start']) - k) < 0.011)
    nät_exkl = d['fast_nat_kr'] + d['nat_kr'] + d['skatt_kr']
    handel_exkl = d['spot_kr'] + d['rorl_kr'] + d['pasl_kr'] + d['manadsavgift']
    kolla(f'{m} moms elnät 25%', abs(nät_exkl*0.25 - d['moms_nat']) <= 0.011, f'{nät_exkl*0.25:.2f} vs {d["moms_nat"]}')
    kolla(f'{m} totalt elnät', abs(nät_exkl + d['moms_nat'] - d['tot_nat']) <= 0.011)
    kolla(f'{m} moms elhandel 25%', abs(handel_exkl*0.25 - d['moms_handel']) <= 0.011, f'{handel_exkl*0.25:.2f} vs {d["moms_handel"]}')
    kolla(f'{m} totalt elhandel', abs(handel_exkl + d['moms_handel'] - d['tot_handel']) <= 0.011)
    kolla(f'{m} summa exkl moms', abs(nät_exkl + handel_exkl - d['exkl_moms']) <= 0.011, f'{nät_exkl+handel_exkl:.2f} vs {d["exkl_moms"]}')
    kolla(f'{m} moms totalt', abs(d['moms_nat'] + d['moms_handel'] - d['moms']) <= 0.011)
    kolla(f'{m} total inkl moms ± öresutjämning', abs(d['exkl_moms'] + d['moms'] + d['ore_utj'] - d['total_inkl']) <= 0.011,
          f"{d['exkl_moms']+d['moms']+d['ore_utj']:.2f} vs {d['total_inkl']}")
    kolla(f'{m} månadsavgift handel 0', d['manadsavgift'] == 0)
    kolla(f'{m} fast påslag 1,70', d['pasl_ore'] == 1.70)
print(f'Steg 1: {ok} kontroller ok, {fel} avvikelser')

print('=== STEG 2: sidornas data mot fakturorna (läst ur PDF med kod) ===')
ok2 = fel2 = 0; ok = fel = 0
for i, m in enumerate(mån):
    d = F[m]; j = J['jamforelse'][i]; h = J['intern'][i]; u = J['underlag'][i]
    kolla(f'{m} kWh', abs(j['kwh'] - d['kwh_fakturan']) < 0.005, f"{j['kwh']} vs {d['kwh_fakturan']}")
    kolla(f'{m} faktura inkl moms', j['fakturaKr'] == d['total_inkl'], f"{j['fakturaKr']} vs {d['total_inkl']}")
    kolla(f'{m} El inkl elcert = spot+rörl+påslag', abs(j['krOre'] - round(d['spot_ore']+d['rorl_ore']+d['pasl_ore'], 2)) < 0.005, f"{j['krOre']} vs {d['spot_ore']+d['rorl_ore']+d['pasl_ore']:.2f}")
    kolla(f'{m} rörlig nät öre', j['natOre'] == d['nat_ore'])
    kolla(f'{m} energiskatt öre', j['skattOre'] == d['skatt_ore'])
    kolla(f'{m} fast nätavgift', j['fastNatKr'] == d['fast_nat_kr'])
    kolla(f'{m} intern krOre = jämförelsen', h['krOre'] == j['krOre'])
    kolla(f'{m} underlag: fakturanr', u['nr'] == d['nr'], f"{u['nr']} vs {d['nr']}")
    kolla(f'{m} underlag: faktura', float(u['faktura']) == d['total_inkl'])
    kolla(f'{m} underlag: kWh faktura', abs(float(u['kwhFaktura'].replace(',','.')) - d['kwh_fakturan']) < 0.005)
    kolla(f'{m} underlag: rörlig nät', float(u['p']['rorlig'].replace(',','.')) == d['nat_ore'])
    kolla(f'{m} underlag: el inkl elcert', float(u['p']['el'].replace(',','.')) == j['krOre'])
    kolla(f'{m} underlag: energiskatt', float(u['p']['skatt'].replace(',','.')) == d['skatt_ore'])
    # huvudmätare: ingående/utgående (avrundade) mot fakturans avläsningar (avrundade)
    if i == 0:
        kolla(f'{m} huvudmätare ingående', abs(float(u['s']['huvud']) - d['mat_start']) < 1.0)
    kolla(f'{m} huvudmätare utgående', abs(float(u['e']['huvud']) - d['mat_slut']) < 1.0, f"{u['e']['huvud']} vs {d['mat_slut']}")
print(f'Steg 2: {ok} kontroller ok, {fel} avvikelser')
