# hamta_forstudie.py
# Hämtar spotpriser för elområde SE4 (dygn för dygn) från elprisetjustnu.se, januari–juni 2026,
# och sparar varje dygn som en JSON-fil i undermappen dag/ (skapas här, ska inte checkas in).
# Källa: https://www.elprisetjustnu.se/elpris-api  (priser utan moms, tillägg och skatter).
# Förstudie 2026-10-07 till Spotpris/PRD.md. Ingen kod med ES2023+ (Python 3).
import json, urllib.request, datetime, concurrent.futures as cf, os

dagar = []
d = datetime.date(2026, 1, 1)
while d <= datetime.date(2026, 6, 30):
    dagar.append(d)
    d += datetime.timedelta(days=1)
os.makedirs('dag', exist_ok=True)

def hamta(d):
    f = f'dag/{d.isoformat()}.json'
    if os.path.exists(f):
        return d, True
    u = f'https://www.elprisetjustnu.se/api/v1/prices/{d.year}/{d.month:02d}-{d.day:02d}_SE4.json'
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    for _ in range(3):                       # tre försök per dygn
        try:
            open(f, 'wb').write(urllib.request.urlopen(req, timeout=30).read())
            return d, True
        except Exception:
            pass
    return d, False

with cf.ThreadPoolExecutor(6) as ex:
    res = list(ex.map(hamta, dagar))
print('hämtade', sum(1 for _, ok in res if ok), 'av', len(dagar), 'dygn; misslyckade:', [str(x) for x, ok in res if not ok])
