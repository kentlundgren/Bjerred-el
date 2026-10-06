# modell_vader.py
# Förstudie 4 (2026-10-07) till Spotpris/PRD.md: väderberoende värme som del av restpostens baslast.
# Restposten (huvudmätare - bastu - varmvatten) delas i ventilation (jämn effekt V, kW), värme (H kW per grad under Tref,
# efter utetemperatur) och en driftdel enligt restaurangens öppettider. Jämför "bara V" med "V + H".
# Kräver hamta_forstudie.py (mappen dag/) och hamta_temperatur.py (temp.json). Anpassning mot fakturan är inte en oberoende validering.
# Resultat 2026-10-07: bästa passningen väljer H = 0; väderberoende värme förbättrar inte uppskattningen.
# Förstudie 4: som förstudie 3 men med väderberoende värme (gradtimmar) som en del av restpostens baslast.
import json, glob, os, datetime, itertools, collections
FAKT={1:117.38,2:116.68,3:86.59,4:63.12,5:88.19,6:100.09}
KWH={1:(35422,14729,4107),2:(32002,11839,3821),3:(28074,12743,5029),4:(26671,11225,3864),5:(23941,9024,2487),6:(20609,7431,1423)}
T=json.load(open('temp.json',encoding='utf-8'))['hourly']; TEMP={t:x for t,x in zip(T['time'],T['temperature_2m'])}  # 'ÅÅÅÅ-MM-DDTHH:00' -> °C
iv=collections.defaultdict(list)    # månad -> [(wd, q, pris, temp)]
for f in sorted(glob.glob('dag/*.json')):
    dag=datetime.date.fromisoformat(os.path.basename(f)[:-5]); wd=dag.weekday()
    for r in json.load(open(f,encoding='utf-8')):
        ts=r['time_start']; q=int(ts[11:13])*4+int(ts[14:16])//15
        iv[dag.month].append((wd,q,r['SEK_per_kWh']*100,TEMP[ts[:13]+':00']))
REST={2:(16,22),3:(16,22),4:(16,22),5:(11,22),6:(11,17)}
def rest_open(wd,q,prep):
    if wd not in REST: return False
    a,b=REST[wd]; return a*4-prep<=q<b*4
def wavg(m,wfun):
    s=w=0.0
    for wd,q,p,t in iv[m]:
        x=wfun(wd,q,t)
        if x: s+=x*p; w+=x
    return s/w if w>0 else None
# Förberäkna komponentpriser per månad
P={}
for m in range(1,7):
    P[m]={}
    P[m]['flat']=wavg(m,lambda wd,q,t:1)
    for bo in (24,30):                       # bastu öppnar 06:00 (q=24) eller 07:30 (q=30)
        for pre in range(0,7):
            P[m][('bastu',bo,pre)]=wavg(m,lambda wd,q,t,bo=bo,pre=pre: 1 if bo-pre*4<=q<88 else 0)
        P[m][('varm_tider',bo)]=wavg(m,lambda wd,q,t,bo=bo:(1 if bo<=q<88 else 0)+(1 if rest_open(wd,q,0) else 0))
    for prep in (0,4,8):
        P[m][('open',prep)]=wavg(m,lambda wd,q,t,prep=prep:1 if rest_open(wd,q,prep) else 0)
    for tref in (10,15,17,20):
        P[m][('heat',tref)]=wavg(m,lambda wd,q,t,tref=tref:max(0.0,tref-t))
HOURS={m:len(iv[m])/4 for m in range(1,7)}
DH={m:{tref:sum(max(0.0,tref-t) for wd,q,p,t in iv[m])/4 for tref in (10,15,17,20)} for m in range(1,7)}   # gradtimmar
def pred(m,bo,pre,prep,varm,V,H,tref):
    tot,bastu,vv=KWH[m]; rest=tot-bastu-vv
    Ev=V*HOURS[m]; Eh=H*DH[m][tref]; Ed=rest-Ev-Eh
    if Ed<0: return None                      # omöjlig kombination: baslasten större än restposten
    Pv=P[m]['flat'] if varm=='24h' else P[m][('varm_tider',bo)]
    Ph=P[m][('heat',tref)] if (Eh>0 and P[m][('heat',tref)] is not None) else P[m]['flat']
    Pr=(Ev*P[m]['flat']+Eh*Ph+Ed*P[m][('open',prep)])/rest
    return (bastu*P[m][('bastu',bo,pre)]+vv*Pv+rest*Pr)/tot
def rms(e): return (sum(x*x for x in e)/len(e))**.5
grid_pre=range(0,7); grid_prep=(0,4,8); grid_varm=('24h','tider'); grid_bo=(24,30)
grid_V=[float(v) for v in range(0,21)]; grid_H=[i/20 for i in range(0,25)]
def space(with_heat):
    for bo,pre,prep,varm in itertools.product(grid_bo,grid_pre,grid_prep,grid_varm):
        for V in grid_V:
            for H in (grid_H if with_heat else [0.0]):
                for tref in ((10,15,17,20) if (with_heat and H>0) else (17,)):
                    yield (bo,pre,prep,varm,V,H,tref)
def evalset(a,months):
    out=[]
    for m in months:
        p=pred(m,*a)
        if p is None: return None
        out.append(p-FAKT[m])
    return out
def best_of(months,wh):
    best=None; n=0; ok=0
    for a in space(wh):
        e=evalset(a,months)
        if e is None: continue
        r=rms(e); n+=1
        if best is None or r<best[0]: best=(r,a)
    return best
for label,wh in (('V  (bara ventilation: jämn effekt dygnet runt, kW)',False),('V+H (ventilation + värme efter utetemperatur)',True)):
    cands=[]
    for a in space(wh):
        e=evalset(a,range(1,7))
        if e is not None: cands.append((rms(e),a,e))
    cands.sort(key=lambda x:x[0])
    print(f'\n=== Modell {label}: {len(cands)} tillåtna kombinationer')
    for r,a,e in cands[:4]:
        print(f'  RMS {r:4.2f}  bastu {a[0]/4:4.1f} uppv {a[1]} h  förb {a[2]/4:.0f} h  varm {a[3]:5}  V {a[4]:4.1f} kW  H {a[5]:4.2f} kW/°C Tref {a[6]}  fel',' '.join(f'{x:+5.2f}' for x in e))
    print('  RMS<1,0:',sum(1 for r,_,_ in cands if r<1.0),'  RMS<2,0:',sum(1 for r,_,_ in cands if r<2.0))
    errs=[]
    for ut in range(1,7):
        tr=[m for m in range(1,7) if m!=ut]
        r,a=best_of(tr,wh)
        p=pred(ut,*a)
        errs.append(None if p is None else p-FAKT[ut])
    print('  leave-one-out fel per månad:',' '.join('  n/a' if x is None else f'{x:+5.2f}' for x in errs),'  RMS',round(rms([x for x in errs if x is not None]),2),' max',round(max(abs(x) for x in errs if x is not None),2))
