# hamta_temperatur.py
# Hämtar utetemperatur per timme (°C) för januari–juni 2026 vid Bjärred från Open-Meteo (historical weather API) och sparar temp.json.
# Obs: det är modellerad data (reanalys, rutnät), inte en mätstation. Källa: https://open-meteo.com/en/docs/historical-weather-api
# Villkor för användning och källhänvisning är inte verifierade här (licenssidan går inte att läsa med curl). Förstudie 2026-10-07.
import urllib.request
url = ('https://archive-api.open-meteo.com/v1/archive?latitude=55.72&longitude=13.03'
       '&start_date=2026-01-01&end_date=2026-06-30&hourly=temperature_2m&timezone=Europe%2FStockholm')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
open('temp.json', 'wb').write(urllib.request.urlopen(req, timeout=40).read())
print('sparade temp.json')
