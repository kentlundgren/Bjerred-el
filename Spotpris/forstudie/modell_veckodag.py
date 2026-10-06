# modell_veckodag.py
# Förstudie 3 (2026-10-07) till Spotpris/PRD.md: veckodagsberoende profil med verkliga öppettider.
# Öppettider: bjerredskallbadhus.se/badet/ (badet 07.30-22.00 alla dagar) och /restaurangen-ny/
# (må-ti stängt, on-fr 16-22, lö 11-22, sö 11-22 -> sö 11-17). Osäkert om tiderna gällde jan-jun 2026 (Kent antar det).
# Kräver att hamta_forstudie.py har körts i samma mapp (mappen dag/). Anpassning mot fakturan är inte en oberoende validering.
# Förstudie 3: veckodagsberoende profil. Bastu, varmvatten och restaurang (med kylar) med kända kWh per månad.
import json, glob, os, datetime, itertools, collections
FAKT={1:117.38,2:116.68,3:86.59,4:63.12,5:88.19,6:100.09}
KWH={1:(35422,14729,4107),2:(32002,11839,3821),3:(28074,12743,5029),4:(26671,11225,3864),5:(23941,9024,2487),6:(20609,7431,1423)}
# S[m][wd][q]: summa pris (öre/kWh); C[m][wd][q]: antal. q = kvart på dygnet (0..95), wd = veckodag (0=måndag)
S=collections.defaultdict(lambda:[[0.0]*96 for _ in range(7)]); C=collections.defaultdict(lambda:[[0]*96 for _ in range(7)])
for f in sorted(glob.glob('dag/*.json')):
    dag=datetime.date.fromisoformat(os.path.basename(f)[:-5]); wd=dag.weekday(); m=dag.month
    for r in json.load(open(f,encoding='utf-8')):
        ts=r['time_start']; q=int(ts[11:13])*4+int(ts[14:16])//15
        S[m][wd][q]+=r['SEK_per_kWh']*100; C[m][wd][q]+=1
def mask_all(): return [[1]*96 for _ in range(7)]
def mask_win(start_q,end_q): return [[1 if start_q<=q<end_q else 0 for q in range(96)] for _ in range(7)]
def hhmm(h,m=0): return h*4+m//15
# Restaurangens öppettider (bjerredskallbadhus.se/restaurangen-ny/): må–ti stängt, on–fr 16–22, lö 11–22, sö 11–17
def mask_rest(prep_q=0):
    M=[[0]*96 for _ in range(7)]
    tider={2:(16,22),3:(16,22),4:(16,22),5:(11,22),6:(11,17)}
    for wd,(a,b) in tider.items():
        for q in range(max(0,a*4-prep_q),b*4): M[wd][q]=1
    return M
def pris(m,M):
    s=sum(S[m][wd][q]*M[wd][q] for wd in range(7) for q in range(96)); c=sum(C[m][wd][q]*M[wd][q] for wd in range(7) for q in range(96)); return s/c
def add(A,B): return [[A[wd][q]+B[wd][q] for q in range(96)] for wd in range(7)]
def predict(m,bastu_open_q,pre_q,beta,prep_q,varm):
    tot,bastu,vv=KWH[m]; rest=tot-bastu-vv
    Mb=mask_win(max(0,bastu_open_q-pre_q),hhmm(22))
    Mr_open=mask_rest(prep_q)
    Pb=pris(m,Mb)
    Pr=beta*pris(m,mask_all())+(1-beta)*pris(m,Mr_open)
    if varm=='24h': Pv=pris(m,mask_all())
    else: Pv=pris(m,add(mask_win(bastu_open_q,hhmm(22)),Mr_open))   # duschar (bastuns tider) + restaurang (öppettider)
    return (bastu*Pb+vv*Pv+rest*Pr)/tot
def rms(e): return (sum(x*x for x in e)/len(e))**.5
def fel(*a): return [predict(m,*a)-FAKT[m] for m in range(1,7)]
print('A. Rena schema (inga kylar, ingen uppvärmning): bastu öppnar, restaurang enligt hemsidan, varmvatten')
for name,bo in [('bastu 06:00-22',hhmm(6)),('bastu 07:30-22',hhmm(7,30))]:
    for varm in ('24h','tider'):
        e=fel(bo,0,0.0,0,varm); print(f'  {name}, varmvatten {varm:5}: RMS {rms(e):5.2f}  fel',' '.join(f'{x:+6.2f}' for x in e))
print('B. Med kylar: andel beta av restaurangens kWh är jämn dygnet runt (resten enligt öppettider); ingen uppvärmning')
for name,bo in [('bastu 06:00-22',hhmm(6)),('bastu 07:30-22',hhmm(7,30))]:
    for varm in ('24h','tider'):
        best=min(((rms(fel(bo,0,b/100,0,varm)),b) for b in range(0,81,5)))
        e=fel(bo,0,best[1]/100,0,varm); print(f'  {name}, varmvatten {varm:5}: bästa beta {best[1]:2d}% -> RMS {best[0]:5.2f}  fel',' '.join(f'{x:+6.2f}' for x in e))
print('C. Full sökning: bastu öppnar 06:00 eller 07:30, uppvärmning 0-6 h före, beta 0-80 %, restaurangens förberedelse 0-2 h, varmvatten 24h/tider')
res=[]
for bo,pre,beta,prep,varm in itertools.product([hhmm(6),hhmm(7,30)],range(0,25,2),range(0,81,5),[0,4,8],['24h','tider']):
    e=fel(bo,pre,beta/100,prep,varm); res.append((rms(e),bo,pre/4,beta,prep/4,varm,e))
res.sort(key=lambda r:r[0])
for r,bo,pre,beta,prep,varm,e in res[:8]:
    print(f'  bastu {bo/4:5.2f}  uppvärmning {pre:3.1f} h  kylar/baslast {beta:2d}%  restaurang förb. {prep:3.1f} h  varm {varm:5}: RMS {r:5.2f}  fel',' '.join(f'{x:+5.2f}' for x in e))
print('  kombinationer med RMS<1,0:',sum(1 for r in res if r[0]<1.0),' <2,0:',sum(1 for r in res if r[0]<2.0),' av',len(res))
# leave-one-out
print('D. Leave-one-out (anpassa på fem månader, förutsäg den sjätte):')
for ut in range(1,7):
    best=None
    for bo,pre,beta,prep,varm in itertools.product([hhmm(6),hhmm(7,30)],range(0,25,2),range(0,81,5),[0,4,8],['24h','tider']):
        e=[predict(m,bo,pre,beta/100,prep,varm)-FAKT[m] for m in range(1,7) if m!=ut]
        r=rms(e)
        if best is None or r<best[0]: best=(r,bo,pre,beta,prep,varm)
    r,bo,pre,beta,prep,varm=best; p=predict(ut,bo,pre,beta/100,prep,varm)
    print(f'  utelämnad mån {ut}: bastu {bo/4:.2f} uppv. {pre/4:.1f} h beta {beta}% prep {prep/4:.1f} h varm {varm}: förutsagt {p:7.2f} mot {FAKT[ut]:7.2f}  (fel {p-FAKT[ut]:+5.2f})')
