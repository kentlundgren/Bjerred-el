# (Förstudie 5, 2026-10-07, Spotpris/PRD.md.) Kräver modell_e.py (heter modell_vader.py i projektet: kopiera eller byt namn före körning), hamta_forstudie.py och hamta_temperatur.py i samma mapp.
# effektkurva.py
# Uppskattad medeleffekt (kW) per timme på dygnet, per månad, ur modellen "bara ventilation" (forstudie 4, modell V).
# Bästa passning mot fakturornas spotpris + ett band av alternativa lika bra passningar (RMS <= 1,5 öre/kWh).
# OBS: kurvan är en uppskattning. Nivån styrs av månadens kWh per del (bastu, varmvatten, rest). Formen är modellens antaganden.
import itertools, statistics
src=open('modell_e.py',encoding='utf-8').read(); src=src[:src.index("for label,wh in")]
g={}; exec(src,g)
iv=g['iv']; KWH=g['KWH']; HOURS=g['HOURS']; rest_open=g['rest_open']; FAKT=g['FAKT']
def curve(m,args):
    bo,pre,prep,varm,V,H,tref=args
    tot,bastu,vv=KWH[m]; rest=tot-bastu-vv
    Ev=V*HOURS[m]; Ed=rest-Ev
    N=len(iv[m]); comp={'bastu':[0.0]*24,'varm':[0.0]*24,'vent':[0.0]*24,'drift':[0.0]*24}; cnt=[0]*24
    cb=sum(1 for wd,q,p,t in iv[m] if bo-pre*4<=q<88)
    co=sum(1 for wd,q,p,t in iv[m] if rest_open(wd,q,prep))
    def wv(wd,q): return (1 if bo<=q<88 else 0)+(1 if rest_open(wd,q,0) else 0)
    sw=sum(wv(wd,q) for wd,q,p,t in iv[m])
    for wd,q,p,t in iv[m]:
        h=q//4; cnt[h]+=1
        comp['bastu'][h]+= bastu/(cb*0.25) if bo-pre*4<=q<88 else 0
        comp['varm'][h]+= (vv/(N*0.25)) if varm=='24h' else vv*wv(wd,q)/(sw*0.25)
        comp['vent'][h]+= V
        comp['drift'][h]+= Ed/(co*0.25) if rest_open(wd,q,prep) else 0
    return {k:[v[h]/cnt[h] for h in range(24)] for k,v in comp.items()}
def total(c): return [sum(c[k][h] for k in c) for h in range(24)]
# kombinationer
cands=[]
for a in g['space'](False):
    e=g['evalset'](a,range(1,7))
    if e is not None: cands.append((g['rms'](e),a))
cands.sort(key=lambda x:x[0]); best=cands[0]; band=[a for r,a in cands if r<=1.5]
print('bästa:',round(best[0],2),best[1],' antal i band (RMS<=1,5):',len(band))
curves={m:curve(m,best[1]) for m in range(1,7)}
tot_best={m:total(curves[m]) for m in range(1,7)}
lo={m:[1e9]*24 for m in range(1,7)}; hi={m:[-1e9]*24 for m in range(1,7)}
for a in band:
    for m in range(1,7):
        t=total(curve(m,a))
        for h in range(24): lo[m][h]=min(lo[m][h],t[h]); hi[m][h]=max(hi[m][h],t[h])
MAN=['Januari','Februari','Mars','April','Maj','Juni']
print('\nmån  medel kW   topp kW (timme)   lägsta kW (timme)   bandets bredd vid toppen (kW)')
stat={}
for m in range(1,7):
    t=tot_best[m]; hmax=max(range(24),key=lambda h:t[h]); hmin=min(range(24),key=lambda h:t[h]); avg=sum(t)/24
    stat[m]=(avg,t[hmax],hmax,t[hmin],hmin)
    print(f'{MAN[m-1]:9} {avg:7.1f}   {t[hmax]:7.1f} ({hmax:02d})        {t[hmin]:7.1f} ({hmin:02d})        {lo[m][hmax]:.0f}–{hi[m][hmax]:.0f}')
print('Abonnemang 200 A, 3-fas 400 V:', round(200*400*3**.5/1000,1),'kW (övre gräns, inte förbrukning)')
# --- SVG
W,H=1200,740; cols=3; rows=2; pw,ph=330,230; ml,mt=60,100; gx,gy=40,80
ymax=max(max(hi[m]) for m in range(1,7)); ymax=((int(ymax)//10)+1)*10
col={'vent':'#6c8ea4','varm':'#2a9d8f','bastu':'#e76f51','drift':'#8e6bbf'}
names={'vent':'Ventilation/baslast','varm':'Varmvatten','bastu':'Bastu','drift':'Restaurang (drift)'}
o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, sans-serif" font-size="12">',
   '<rect width="100%" height="100%" fill="#ffffff"/>',
   '<text x="60" y="28" font-size="20" font-weight="700" fill="#1c2a2a">Uppskattad effektkurva per timme, januari–juni 2026 (kW)</text>',
   '<text x="60" y="50" fill="#5a6868">UPPSKATTNING ur modellen "bara ventilation", inte en mätning. Nivån styrs av månadens kWh per mätare; kurvans form är modellens antaganden. Grått band: alternativa lika bra passningar (RMS ≤ 1,5 öre/kWh).</text>']
def X(px,h): return px+h/24*pw
def Y(py,v): return py+ph-v/ymax*ph
for m in range(1,7):
    r=(m-1)//cols; c=(m-1)%cols; px=ml+c*(pw+gx); py=mt+r*(ph+gy)
    o.append(f'<text x="{px}" y="{py-8}" font-weight="700" font-size="14" fill="#1c2a2a">{MAN[m-1]}  (medel {stat[m][0]:.0f} kW, topp {stat[m][1]:.0f} kW kl. {stat[m][2]:02d})</text>')
    for v in range(0,ymax+1,20):
        yy=Y(py,v); o.append(f'<line x1="{px}" y1="{yy:.1f}" x2="{px+pw}" y2="{yy:.1f}" stroke="#e3e8e7"/><text x="{px-6}" y="{yy+4:.1f}" text-anchor="end" fill="#5a6868">{v}</text>')
    for h in range(0,25,3):
        xx=X(px,h); o.append(f'<line x1="{xx:.1f}" y1="{py+ph}" x2="{xx:.1f}" y2="{py+ph+4}" stroke="#5a6868"/><text x="{xx:.1f}" y="{py+ph+18}" text-anchor="middle" fill="#5a6868">{h:02d}</text>')
    # band
    pts=[]; 
    for h in range(24): pts+= [(X(px,h),Y(py,hi[m][h])),(X(px,h+1),Y(py,hi[m][h]))]
    for h in range(23,-1,-1): pts+= [(X(px,h+1),Y(py,lo[m][h])),(X(px,h),Y(py,lo[m][h]))]
    o.append('<polygon points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'" fill="#c9cfcf" opacity="0.7"/>')
    # staplade områden (bästa passning), nedifrån: vent, varm, bastu, drift
    base=[0.0]*24
    for k in ('vent','varm','bastu','drift'):
        top=[base[h]+curves[m][k][h] for h in range(24)]
        pts=[]
        for h in range(24): pts+=[(X(px,h),Y(py,top[h])),(X(px,h+1),Y(py,top[h]))]
        for h in range(23,-1,-1): pts+=[(X(px,h+1),Y(py,base[h])),(X(px,h),Y(py,base[h]))]
        o.append('<polygon points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)+f'" fill="{col[k]}" opacity="0.85"/>')
        base=top
    # totalt (linje)
    pts=[]
    for h in range(24): pts+=[(X(px,h),Y(py,tot_best[m][h])),(X(px,h+1),Y(py,tot_best[m][h]))]
    o.append('<polyline fill="none" stroke="#1c2a2a" stroke-width="1.6" points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'"/>')
    o.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="none" stroke="#9aa6a5"/>')
    if c==0: o.append(f'<text x="14" y="{py+ph/2}" transform="rotate(-90 14 {py+ph/2})" text-anchor="middle" fill="#5a6868">kW</text>')
ly=H-34; lx=60
for k in ('vent','varm','bastu','drift'):
    o.append(f'<rect x="{lx}" y="{ly}" width="14" height="14" fill="{col[k]}" opacity="0.85"/><text x="{lx+20}" y="{ly+12}" fill="#1c2a2a">{names[k]}</text>'); lx+=190
o.append(f'<line x1="{lx}" y1="{ly+7}" x2="{lx+24}" y2="{ly+7}" stroke="#1c2a2a" stroke-width="1.6"/><text x="{lx+30}" y="{ly+12}" fill="#1c2a2a">Summa, bästa passning</text>')
o.append(f'<rect x="{lx+190}" y="{ly}" width="14" height="14" fill="#c9cfcf" opacity="0.7"/><text x="{lx+210}" y="{ly+12}" fill="#1c2a2a">Alternativa passningar</text>')
o.append(f'<text x="60" y="{H-8}" fill="#5a6868" font-size="11">Källor: spotpris elprisetjustnu.se (SE4); Kraftringens fakturor; Bjerreds Saltsjöbads debiteringsunderlag; öppettider bjerredskallbadhus.se. Siffrorna är hämtade ur källorna, inte granskade. Kontrollera mot källan.</text>')
o.append('</svg>')
open('effektkurva.svg','w',encoding='utf-8').write('\n'.join(o)); print('skrev effektkurva.svg',len('\n'.join(o)),'tecken')
