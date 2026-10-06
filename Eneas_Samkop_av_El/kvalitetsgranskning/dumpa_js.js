// Läser ut datatabellerna ur sidornas JavaScript-filer (utan att köra resten av koden).
const fs = require('fs'), vm = require('vm');
const BAS = 'D:/VåraFiler_primära_på_SSD/Kent_dokument/Data/HTML/kentlundgren_se/program/Bjerred/El/Eneas_Samkop_av_El/';
function hamta(fil, namn) {
  const t = fs.readFileSync(BAS + fil, 'utf8');
  const start = t.indexOf('var ' + namn + ' = [');
  const slut = t.indexOf('\n  ];', start);
  return vm.runInNewContext(t.slice(start + ('var ' + namn + ' = ').length, slut + 4));
}
const ut = {
  jamforelse: hamta('enea_jamforelse.js', 'MANADER'),
  intern: hamta('intern_debitering.js', 'MANADER'),
  underlag: hamta('intern_underlag.js', 'STANDARD')
};
fs.writeFileSync('jsdata.json', JSON.stringify(ut, null, 1));
console.log('rader:', ut.jamforelse.length, ut.intern.length, ut.underlag.length);
