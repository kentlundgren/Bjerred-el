# rakna_forstudie.py
# Räknar månadsmedel av spotpriset (SE4) på två sätt och jämför med spotpriset på Kraftringens fakturor:
#   M1 = enkelt medelvärde över alla kvartar/timmar i månaden (dygnet runt)
#   M2 = enkelt medelvärde över kvartar/timmar 06:00–22:00 lokal tid
# Kräver att hamta_forstudie.py har körts i samma mapp. Fakturornas spotpris är lästa ur PDF-fakturorna
# (öre/kWh): jan 117,38, feb 116,68, mar 86,59, apr 63,12, maj 88,19, jun 100,09.
# Förstudie 2026-10-07 till Spotpris/PRD.md.
import json, glob, os, statistics, collections
FAKT={1:117.38,2:116.68,3:86.59,4:63.12,5:88.19,6:100.09}
rows=collections.defaultdict(list)
antal_per_dag={}
for f in sorted(glob.glob('dag/*.json')):
    d=json.load(open(f,encoding='utf-8')); dag=os.path.basename(f)[:-5]
    antal_per_dag[dag]=len(d)
    for r in d:
        ts=r['time_start']; m=int(ts[5:7]); h=int(ts[11:13])
        rows[m].append((ts[:10],h,r['SEK_per_kWh']*100))
print('Dygn med annat antal intervall än 96:', {k:v for k,v in antal_per_dag.items() if v!=96})
print(f"{'Mån':4}{'n':>7}{'alla tim':>10}{'06-22':>9}{'faktura':>9}{'diff alla':>10}{'diff 06-22':>11}{'min':>8}{'max':>8}{'neg':>5}")
for m in range(1,7):
    v=rows[m]; allv=[x[2] for x in v]; dag=[x[2] for x in v if 6<=x[1]<22]
    a=statistics.mean(allv); b=statistics.mean(dag)
    print(f"{m:<4}{len(v):>7}{a:>10.2f}{b:>9.2f}{FAKT[m]:>9.2f}{a-FAKT[m]:>10.2f}{b-FAKT[m]:>11.2f}{min(allv):>8.1f}{max(allv):>8.1f}{sum(1 for x in allv if x<0):>5}")
