#!/usr/bin/env node
/* Prüft die Aufdachmarkise TDS Linea A / Linea AZ gegen die Maße der
   Herstellerzeichnung („TDS_Linea A - Linea AZ", 01.07.2025).

   Zweiter Weg: Die Zahlen werden NICHT aus dem Modellcode übernommen,
   sondern hier noch einmal aus der Zeichnung notiert und mit dem
   verglichen, was in js/konfigurator-3d.js steht. Weicht eines ab,
   schlägt die Prüfung an.

   Aufruf:  node scripts/pruefe-markise.js [--gegenprobe]
   --gegenprobe verfälscht die Sollwerte und erwartet, dass jede
   Einzelprüfung anschlägt. */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var src = fs.readFileSync('js/konfigurator-3d.js', 'utf8');

/* Maße aus der Zeichnung, in mm */
var SOLL = {
  kasHoehe: 158, schieneH: 87, schieneB: 61, stuetzeH: 75,
  saeuleB: 80, platteB: 100, platteD: 6, feldMax: 1000
};
var SPANNE = { ersteStuetze: [345, 395], letzteStuetze: [150, 1000] };

var block = (src.match(/var MARKISE = \{[\s\S]*?\};/) || [''])[0];
if (!block) { console.error('FEHLER  MARKISE-Block nicht gefunden'); process.exit(1); }

function wert(name) {
  var m = block.match(new RegExp(name + ':\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) * 10 : null;   // cm im Code -> mm
}

var fehler = 0, geprueft = 0;
/* In der Gegenprobe werden die SOLLWERTE verfälscht. Jede Prüfung MUSS
   dann anschlagen – „FEHLER" ist dort also das erwünschte Ergebnis. */
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

Object.keys(SOLL).forEach(function (k) {
  var ist = wert(k), soll = SOLL[k] + (gegen ? 7 : 0);
  pruefe('Maß ' + k, ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (erwartet ' + soll + ')');
});

Object.keys(SPANNE).forEach(function (k) {
  var ist = wert(k), s = SPANNE[k];
  var u = s[0] + (gegen ? 1e6 : 0), o = s[1] + (gegen ? 1e6 : 0);
  pruefe('Lage ' + k + ' in der Spanne', ist !== null && ist >= u && ist <= o,
         ist + ' mm (erwartet ' + u + '–' + o + ')');
});

/* Die Kassette darf nicht in die Eindeckung schneiden: Schienenoberkante
   minus Kassettenhöhe muss über der Dachfläche bleiben. */
var luft = wert('stuetzeH') + wert('schieneH') - wert('kasHoehe') - (gegen ? 99 : 0);
pruefe('Kassette bleibt über der Eindeckung', luft > 0,
       luft.toFixed(0) + ' mm Luft');

/* Stützenabstand bei 6 m Tiefe darf das Höchstmaß nicht reißen */
var L = 6000, z1 = wert('kasTiefe') + wert('ersteStuetze');
var z2 = L - wert('letzteStuetze');
var felder = Math.max(1, Math.ceil((z2 - z1) / wert('feldMax')));
var abstand = (z2 - z1) / felder + (gegen ? 500 : 0);
pruefe('Stützenabstand bei 6 m Tiefe', abstand <= wert('feldMax') + 0.5,
       Math.round(abstand) + ' mm bei ' + (felder + 1) + ' Stützen je Seite');

/* Die Markise geht über die volle Dachbreite und -tiefe (Bestellmaß) */
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;
pruefe('Markise nutzt die volle Dachtiefe',
       new RegExp(q || 'dach\\.tiefe / Math\\.cos\\(neig\\)').test(src),
       'L = Tiefe / cos(Neigung)');
pruefe('Schienen schließen außen bündig ab',
       new RegExp(q || 'B / 2 - M\\.schieneB / 2').test(src), 'Achse = B/2 − 61/2');
pruefe('Hardware steht auch bei eingefahrenem Tuch',
       new RegExp(q || "if \\(m === 'Aufdachmarkise'\\) \\{").test(src),
       'kein aus > 0.02 davor');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
