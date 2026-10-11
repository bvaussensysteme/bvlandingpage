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
/* Die Markise muss bis an die Rinne laufen, nicht nur bis zum Sparrenende.
   Deshalb bekommt sie T und nicht dachTiefe. */
pruefe('Markise bekommt die volle Dachtiefe bis zur Rinne',
       new RegExp(q || 'tiefe: T,').test(src) &&
       !new RegExp('tiefe: dachTiefe').test(src),
       'tiefe: T statt dachTiefe');
pruefe('Hardware steht auch bei eingefahrenem Tuch',
       new RegExp(q || "if \\(m === 'Aufdachmarkise'\\) \\{").test(src),
       'kein aus > 0.02 davor');

/* ---------- Unterdachmarkise TDS Linea U / Linea UZ ---------- */
var SOLL_U = {
  kasHoehe: 162, kasTiefe: 238, kastenH: 80, endkappe: 41, konsoleH: 19,
  luftSparren: 5, saeuleB: 80, platteB: 100,
  breiteAbzug: 142, tiefeAbzug: 45, feldMax: 1000
};
var blockU = (src.match(/var MARKISE_U = \{[\s\S]*?\};/) || [''])[0];
if (!blockU) { console.error('FEHLER  MARKISE_U-Block nicht gefunden'); process.exit(1); }
function wertU(name) {
  var m = blockU.match(new RegExp(name + ':\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) * 10 : null;
}
Object.keys(SOLL_U).forEach(function (k) {
  var ist = wertU(k), soll = SOLL_U[k] + (gegen ? 7 : 0);
  pruefe('Linea U – Maß ' + k, ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (erwartet ' + soll + ')');
});
Object.keys(SPANNE).forEach(function (k) {
  var n = k === 'ersteStuetze' ? 'ersteKonsole' : 'letzteKonsole';
  var ist = wertU(n), sp = SPANNE[k];
  var u = sp[0] + (gegen ? 1e6 : 0), o = sp[1] + (gegen ? 1e6 : 0);
  pruefe('Linea U – Lage ' + n + ' in der Spanne',
         ist !== null && ist >= u && ist <= o,
         ist + ' mm (erwartet ' + u + '–' + o + ')');
});

/* Gegenbeleg fuer das Sparrenraster: Achse 30 mm vom Rand plus halbe
   Sparrenbreite 30,5 mm ergibt die Innenkante; abzueglich 2 x 10 mm Luft
   muss der Breitenabzug der Zeichnung herauskommen. */
var ausRaster = 2 * (30 + 61 / 2) + 2 * 10 + (gegen ? 30 : 0);
pruefe('Linea U – 142 mm decken sich mit dem Sparrenraster',
       Math.abs(ausRaster - wertU('breiteAbzug')) <= 1.5,
       'aus dem Raster ' + ausRaster + ' mm, Zeichnung ' + wertU('breiteAbzug') + ' mm');

/* Die Unterdachmarkise haengt an den Sparren – sie braucht deren
   Unterkante, nicht die Oberkante der Eindeckung. */
pruefe('Linea U – haengt an der Sparrenunterkante',
       new RegExp(q || 'dach\\.uk\\(0\\)').test(src), 'mu.position aus dach.uk(0)');
pruefe('Linea U – Tiefe aus der Sparrenlaenge',
       new RegExp(q || 'dach\\.sparrenL - M\\.tiefeAbzug').test(src),
       'Sparrenlaenge − 45 mm');
pruefe('Linea U – Breite aus der Dachbreite',
       new RegExp(q || 'B - M\\.breiteAbzug').test(src), 'Dachbreite − 142 mm');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
