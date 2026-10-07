// Skapad av forutsag_spotpris.py. Förutsägelse gjord innan fakturornas spotpris lästes in.
window.FORUTSAGELSE = {
 "metadata": {
  "gjord": "2026-10-07",
  "text": "Förutsägelse gjord innan fakturornas spotpris lästes in. Antaganden från Jan-Jun, frusna.",
  "varmvattenandel": {
   "medel": 0.22964395041613883,
   "min": 0.16071831940365935,
   "max": 0.282973216295296
  },
  "u1": {
   "bo": "06:00",
   "pre_timmar": 1.0,
   "prep_timmar": 2.0,
   "varm": "24h",
   "V_kw": 13.0
  },
  "antal_i_band": 7
 },
 "manader": {
  "2026-07": {
   "m4b_ore": 82.55301559165605,
   "spann_min_ore": 81.66695309118658,
   "spann_max_ore": 83.08714071490276,
   "m1_ore": 86.48251948924731,
   "m2_ore": 77.86672379032245,
   "kwh": {
    "huvud": 21585,
    "bad": 10424
   }
  },
  "2026-08": {
   "m4b_ore": 80.26141218867154,
   "spann_min_ore": 79.7455356611332,
   "spann_max_ore": 80.73297940419731,
   "m1_ore": 80.45174899193549,
   "m2_ore": 83.14447832661277,
   "kwh": {
    "huvud": 21836,
    "bad": 10526
   }
  },
  "2026-09": {
   "m4b_ore": 123.67752937478295,
   "spann_min_ore": 122.64496857009718,
   "spann_max_ore": 125.34740031317702,
   "m1_ore": 120.12523506944446,
   "m2_ore": 133.00682031249985,
   "kwh": {
    "huvud": 21689,
    "bad": 11388
   }
  }
 },
 "rorliga": {
  "snitt_ore": 3.917991470678207,
  "min_ore": 3.16,
  "max_ore": 5.11,
  "text": "Ingen modell: vägt snitt och spann av januari-juni"
 },
 "facit": {
  "2026-07": {
   "spot_ore": 79.21,
   "rorliga_ore": 5.1,
   "paslag_ore": 1.7,
   "kwh_faktura": 21584.28
  },
  "2026-08": {
   "spot_ore": 83.72,
   "rorliga_ore": 4.6,
   "paslag_ore": 1.7,
   "kwh_faktura": 21835.32
  }
 },
 "analys_v": [
  {
   "manad": "2026-01",
   "V_bast_kw": 20.7,
   "kvarstaende_fel_ore": -0.002168867835635524,
   "fel_vid_vald_V_ore": 0.40046753100509136,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 22.293010752688172
  },
  {
   "manad": "2026-02",
   "V_bast_kw": 11.9,
   "kvarstaende_fel_ore": -0.000846349296466542,
   "fel_vid_vald_V_ore": 0.022645830046499782,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 24.31845238095238
  },
  {
   "manad": "2026-03",
   "V_bast_kw": 12.0,
   "kvarstaende_fel_ore": 0.0007416638440815859,
   "fel_vid_vald_V_ore": -0.04176391951916969,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 13.865410497981157
  },
  {
   "manad": "2026-04",
   "V_bast_kw": 0.7,
   "kvarstaende_fel_ore": 0.004546457523417757,
   "fel_vid_vald_V_ore": 2.545032615882384,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 16.086111111111112
  },
  {
   "manad": "2026-05",
   "V_bast_kw": 11.1,
   "kvarstaende_fel_ore": 0.0023451450719420563,
   "fel_vid_vald_V_ore": 1.2757963166072699,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 16.706989247311828
  },
  {
   "manad": "2026-06",
   "V_bast_kw": 15.0,
   "kvarstaende_fel_ore": -0.0158718286994457,
   "fel_vid_vald_V_ore": -1.6474801794199863,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 16.32638888888889
  },
  {
   "manad": "2026-07",
   "V_bast_kw": 6.4,
   "kvarstaende_fel_ore": -0.0028081339703902586,
   "fel_vid_vald_V_ore": 3.343015591656055,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 15.001344086021506
  },
  {
   "manad": "2026-08",
   "V_bast_kw": 15.2,
   "kvarstaende_fel_ore": -2.458502898935407,
   "fel_vid_vald_V_ore": -3.4585878113284565,
   "V_vald_kw": 13.0,
   "rest_kwh_per_timme": 15.201612903225806
  }
 ]
};
