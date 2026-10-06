# Steg 4: oberoende omräkning av debiteringsunderlaget med Decimal (exakt decimalaritmetik),
# från mätarställningarna i sidans förifyllda data, mot det sidan faktiskt visade.
from decimal import Decimal as D, ROUND_HALF_UP
import json
J = json.load(open('jsdata.json', encoding='utf-8'))
U = J['underlag']
# Det sidan visade (hämtat ur webbläsaren, tusentalsavgränsare borttagna)
VIS = [
 dict(huvud='35422',bastu='14729',varm='4107',hg='16586',kr1='3627,36',kr2='20274,73',kr3='5970,96',sumore='180,11',exkl='29873,04',moms='7468,26',tot='37341,00'),
 dict(huvud='32002',bastu='11839',varm='3821',hg='16342',kr1='3569,09',kr2='19865,34',kr3='5883,12',sumore='179,40',exkl='29317,55',moms='7329,39',tot='36647,00'),
 dict(huvud='28074',bastu='12743',varm='5029',hg='10302',kr1='2094,40',kr2='9567,47',kr3='3708,72',sumore='149,20',exkl='15370,58',moms='3842,65',tot='19213,00'),
 dict(huvud='26671',bastu='11225',varm='3864',hg='11582',kr1='2219,11',kr2='7909,35',kr3='4169,52',sumore='123,45',exkl='14297,98',moms='3574,49',tot='17872,00'),
 dict(huvud='23941',bastu='9024',varm='2487',hg='12430',kr1='2534,48',kr2='11808,50',kr3='4474,80',sumore='151,39',exkl='18817,78',moms='4704,44',tot='23522,00'),
 dict(huvud='20609',bastu='7431',varm='1423',hg='11755',kr1='2467,37',kr2='12513,20',kr3='4231,80',sumore='163,44',exkl='19212,37',moms='4803,09',tot='24015,00'),
]
FACIT = [37341, 36647, 19213, 17873, 23521, 24017]  # tidigare debiterat (rättat), ur debiteringsunderlagen
d = lambda s: D(s.replace(',', '.'))
q2 = lambda x: x.quantize(D('0.01'), rounding=ROUND_HALF_UP)
ok = fel = 0
def kolla(namn, a, b):
    global ok, fel
    if a == b: ok += 1
    else: fel += 1; print('  AVVIKELSE', namn, 'förväntat', a, 'sidan visar', b)
slut_prev = None
for i, u in enumerate(U):
    v = VIS[i]
    # mätarkedja: ingående = föregående utgående (utom första månaden)
    st = {k: d(u['s'][k]) for k in ('huvud','herr','dam','varm')} if i == 0 else slut_prev
    sl = {k: d(u['e'][k]) for k in ('huvud','herr','dam','varm')}
    slut_prev = sl
    huvud = sl['huvud'] - st['huvud']; herr = sl['herr'] - st['herr']; dam = sl['dam'] - st['dam']; varm = sl['varm'] - st['varm']
    bastu = herr + dam; hg = huvud - bastu - varm
    kolla(f'mån{i+1} huvud', str(huvud), v['huvud']); kolla(f'mån{i+1} bastu', str(bastu), v['bastu'])
    kolla(f'mån{i+1} varm', str(varm), v['varm']); kolla(f'mån{i+1} hyresgäst kWh', str(hg), v['hg'])
    p = {k: d(u['p'][k]) for k in ('rorlig','el','skatt')}
    kr = {k: q2(hg * p[k] / 100) for k in p}
    kolla(f'mån{i+1} kr rörlig', f"{kr['rorlig']}".replace('.',','), v['kr1'])
    kolla(f'mån{i+1} kr el', f"{kr['el']}".replace('.',','), v['kr2'])
    kolla(f'mån{i+1} kr skatt', f"{kr['skatt']}".replace('.',','), v['kr3'])
    kolla(f'mån{i+1} summa öre', f"{q2(p['rorlig']+p['el']+p['skatt'])}".replace('.',','), v['sumore'])
    exkl = hg * (p['rorlig'] + p['el'] + p['skatt']) / 100
    kolla(f'mån{i+1} summa exkl moms', f'{q2(exkl)}'.replace('.',','), v['exkl'])
    kolla(f'mån{i+1} moms', f'{q2(exkl*D("0.25"))}'.replace('.',','), v['moms'])
    tot = (exkl * D('1.25')).quantize(D('1'), rounding=ROUND_HALF_UP)
    kolla(f'mån{i+1} totalt', f'{tot},00', v['tot'])
    avv = int(tot) - FACIT[i]
    print(f'  månad {i+1}: totalt {tot} kr, tidigare debiterat {FACIT[i]} kr, avvikelse {avv:+d} kr')
    assert abs(avv) <= 2
print(f'Steg 4: {ok} kontroller ok, {fel} avvikelser')
