# modell_profil.py
# Förstudie 2 (2026-10-07) till Spotpris/PRD.md: uppskattad förbrukningsprofil "baklänges".
# Modell A: blandning av jämn 24h- och jämn 06-22-förbrukning. Modell B/C: tre delar (bastu, varmvatten, restaurang)
# med kända kWh per del och månad (ur debiteringsunderlagen) och antagna öppettider; anpassas mot fakturans spotpris.
# Kräver att hamta_forstudie.py har körts i samma mapp (mappen dag/). Fakturornas spotpris är lästa ur PDF-fakturorna.
# Obs: anpassning mot fakturan är inte en oberoende validering (se PRD avsnitt 9).
# Förstudie 2: uppskattad förbrukningsprofil ("baklänges") mot fakturans spotpris.
import json, glob, os, statistics, collections, itertools
FAKT={1:117.38,2:116.68,3:86.59,4:63.12,5:88.19,6:100.09}
# kWh per månad ur debiteringsunderlagen (heltal): huvudmätare, bastu (herr+dam), varmvatten, restaurang = huvud - bastu - varm
KWH={1:(35422,14729,4107),2:(32002,11839,3821),3:(28074,12743,5029),4:(26671,11225,3864),5:(23941,9024,2487),6:(20609,7431,1423)}
rows=collections.defaultdict(list)
for f in sorted(glob.glob('dag/*.json')):
    for r in json.load(open(f,encoding='utf-8')):
        ts=r['time_start']; rows[int(ts[5:7])].append((int(ts[11:13]),r['SEK_per_kWh']*100))
def pris(m,timmar):
    v=[p for h,p in rows[m] if h in timmar]; return statistics.mean(v)
H24=set(range(24)); BASTU=set(range(6,22))
# --- Modell A: en enda faktor alfa mellan jämn 24h-förbrukning (M1) och jämn 06-22-förbrukning (M2)
print('MODELL A: profil = (1-a)*jämn dygnet runt + a*jämn 06-22. Lös a så att viktat spotpris = fakturan')
for m in range(1,7):
    m1=pris(m,H24); m2=pris(m,BASTU); a=(FAKT[m]-m1)/(m2-m1)
    print(f'  mån {m}: M1 {m1:7.2f}  M2 {m2:7.2f}  faktura {FAKT[m]:7.2f}  => a = {a:6.2f}', '' if 0<=a<=1 else '  (utanför 0–1: ingen blandning av dessa två profiler kan ge fakturans pris)')
# --- Modell B: tre delar med kända kWh per månad. Bastu jämn 06-22, varmvatten jämn dygnet runt, restaurang jämn S..E.
print('\nMODELL B: bastu 06-22, varmvatten 24h, restaurang jämn mellan S och E (kända kWh per del och månad)')
def prognos(m,S,E,varm_h=H24):
    tot,bastu,varm=KWH[m]; rest=tot-bastu-varm
    return (bastu*pris(m,BASTU)+varm*pris(m,varm_h)+rest*pris(m,set(range(S,E))))/tot
res=[]
for S in range(6,20):
    for E in range(S+2,25):
        err=[prognos(m,S,E)-FAKT[m] for m in range(1,7)]
        rms=(sum(e*e for e in err)/6)**.5; res.append((rms,S,E,err))
res.sort()
print('  bäst (lägst RMS-fel, öre/kWh):')
for rms,S,E,err in res[:6]: print(f'    restaurang {S:02d}-{E:02d}: RMS {rms:5.2f}  fel per mån', ' '.join(f'{e:+5.2f}' for e in err))
print('  några rimliga antaganden:')
for S,E in [(11,22),(12,22),(14,22),(16,22),(12,23),(11,24)]:
    err=[prognos(m,S,E)-FAKT[m] for m in range(1,7)]; print(f'    restaurang {S:02d}-{E:02d}: RMS {(sum(e*e for e in err)/6)**.5:5.2f}  fel', ' '.join(f'{e:+5.2f}' for e in err))
print('  jämförelse, M1 resp. M2 fel (öre/kWh):', ' '.join(f'{pris(m,H24)-FAKT[m]:+5.2f}' for m in range(1,7)), '|', ' '.join(f'{pris(m,BASTU)-FAKT[m]:+5.2f}' for m in range(1,7)))
# --- Modell B med varmvatten också dagtid (06-22)
print('\nMODELL B2: som B men varmvatten jämn 06-22')
res2=[]
for S in range(6,20):
    for E in range(S+2,25):
        err=[prognos(m,S,E,BASTU)-FAKT[m] for m in range(1,7)]; res2.append(((sum(e*e for e in err)/6)**.5,S,E,err))
res2.sort()
for rms,S,E,err in res2[:3]: print(f'    restaurang {S:02d}-{E:02d}: RMS {rms:5.2f}  fel', ' '.join(f'{e:+5.2f}' for e in err))
# --- Hur stor del av förbrukningen är vad
print('\nandel av kWh: bastu / varmvatten / restaurang')
for m in range(1,7):
    t,b,v=KWH[m]; print(f'  mån {m}: {b/t:5.1%} / {v/t:5.1%} / {(t-b-v)/t:5.1%}')

# --- Modell C: bastun värms upp före öppning. Bastu jämn Bs..22, varmvatten 24h, restaurang S..E
print('\nMODELL C: bastu jämn Bs-22 (uppvärmning före 06), varmvatten 24h, restaurang S-E')
def prognosC(m,Bs,S,E):
    tot,bastu,varm=KWH[m]; rest=tot-bastu-varm
    return (bastu*pris(m,set(range(Bs,22)))+varm*pris(m,H24)+rest*pris(m,set(range(S,E))))/tot
resC=[]
for Bs in range(0,7):
    for S in range(9,18):
        for E in (21,22,23,24):
            err=[prognosC(m,Bs,S,E)-FAKT[m] for m in range(1,7)]
            resC.append(((sum(e*e for e in err)/6)**.5,Bs,S,E,err))
resC.sort()
for rms,Bs,S,E,err in resC[:8]: print(f'  bastu {Bs:02d}-22, restaurang {S:02d}-{E:02d}: RMS {rms:5.2f}  fel', ' '.join(f'{e:+5.2f}' for e in err))
print('  antal kombinationer med RMS < 1,0:', sum(1 for r in resC if r[0]<1.0), 'av', len(resC), ' | RMS < 2,0:', sum(1 for r in resC if r[0]<2.0))
print('  restaurang 12-22 med bastu 06-22 (Kents öppettider) RMS:', round(next(r[0] for r in resC if r[1]==6 and r[2]==12 and r[3]==22),2))
print('  restaurang 12-22 med bastu från 04: RMS:', round(next(r[0] for r in resC if r[1]==4 and r[2]==12 and r[3]==22),2), ' från 03:', round(next(r[0] for r in resC if r[1]==3 and r[2]==12 and r[3]==22),2))
# Leave-one-out: välj bästa (Bs,S,E) på 5 månader, förutsäg den sjätte
print('\nLeave-one-out (anpassa på fem månader, förutsäg den sjätte), Modell C:')
for ut in range(1,7):
    best=None
    for Bs in range(0,7):
        for S in range(9,18):
            for E in (21,22,23,24):
                err=[prognosC(m,Bs,S,E)-FAKT[m] for m in range(1,7) if m!=ut]
                r=(sum(e*e for e in err)/5)**.5
                if best is None or r<best[0]: best=(r,Bs,S,E)
    r,Bs,S,E=best
    print(f'  utelämnad månad {ut}: valde bastu {Bs:02d}-22, restaurang {S:02d}-{E:02d}; förutsagt {prognosC(ut,Bs,S,E):7.2f} mot faktura {FAKT[ut]:7.2f}  (fel {prognosC(ut,Bs,S,E)-FAKT[ut]:+5.2f} öre/kWh)')
# Medelpris per timme på dygnet (för diagram): jan och maj
print('\nMedelpris per timme (öre/kWh), jan | maj:')
for h in range(24):
    print(f'  {h:02d}: {pris(1,{h}):7.1f} | {pris(5,{h}):7.1f}')
