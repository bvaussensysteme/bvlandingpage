#!/usr/bin/env node
/* Prüft die Markisenstoffe: Vollständigkeit, strikte Trennung der beiden
   Gruppen, vorhandene Bilder und dass beide Konfiguratoren dieselbe Liste
   benutzen.

   Warum das eine eigene Prüfung wert ist: Wer im Konfigurator einen
   Sergé-Stoff zu einer Aufdachmarkise wählen kann, schickt eine Anfrage
   los, die so nicht bestellbar ist. Das fällt erst beim Angebot auf –
   nach Rückruf und Aufmaß.

   Aufruf:  node scripts/pruefe-stoffe.js [--gegenprobe]
*/
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;

var quelle = fs.readFileSync('js/markisenstoffe.js', 'utf8');
var k3d = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var wiz = fs.readFileSync('js/anfrage-wizard.js', 'utf8');

var window = {};
eval(quelle);                                  // setzt window.BV_STOFFE
var S = window.BV_STOFFE || { dach: [], zip: [] };

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

/* 1. Umfang – aus der Stoffkarte abgezählt */
pruefe('53 Stoffe für die Dachmarkisen', S.dach.length === (gegen ? 54 : 53),
       S.dach.length + ' Stück');
pruefe('44 Stoffe für die Senkrechtmarkisen', S.zip.length === (gegen ? 45 : 44),
       S.zip.length + ' Stück');

/* 2. Keine Überschneidung – das ist der eigentliche Punkt */
var dachCodes = S.dach.map(function (x) { return x.c; });
var zipCodes = S.zip.map(function (x) { return x.c; });
var doppelt = dachCodes.filter(function (c) { return zipCodes.indexOf(c) > -1; });
if (gegen) doppelt = ['künstlich'];
pruefe('Kein Code steht in beiden Gruppen', doppelt.length === 0,
       doppelt.length ? doppelt.join(', ') : 'sauber getrennt');

/* 3. Keine Dubletten innerhalb einer Gruppe */
[['dach', dachCodes], ['zip', zipCodes]].forEach(function (p) {
  var n = p[1].length, u = p[1].filter(function (c, i) { return p[1].indexOf(c) === i; }).length;
  pruefe('Gruppe ' + p[0] + ' ohne Dubletten', gegen ? false : n === u, n + ' Codes, ' + u + ' verschieden');
});

/* 4. Bilder vorhanden. Fehlt eines, bleibt im Bedienfeld eine leere
      Kachel stehen – und im Modell das neutrale Beige. */
function da(pfad) { return fs.existsSync(pfad); }
var fehlend = [];
S.dach.forEach(function (x) {
  ['images/stoffe/mini/' + x.c + '.webp', 'images/stoffe/tex/' + x.c + '.webp']
    .forEach(function (f) { if (!da(f)) fehlend.push(f); });
});
S.zip.forEach(function (x) {
  ['A', 'B'].forEach(function (k) {
    ['images/stoffe/mini/' + x.c + '-' + k + '.webp',
     'images/stoffe/tex/' + x.c + '-' + k + '.webp']
      .forEach(function (f) { if (!da(f)) fehlend.push(f); });
});
});
if (gegen) fehlend = ['künstlich'];
pruefe('Alle Muster- und Texturbilder vorhanden', fehlend.length === 0,
       fehlend.length ? fehlend.slice(0, 3).join(', ') + ' …'
                      : (S.dach.length + S.zip.length * 2) * 2 + ' Dateien');

/* 5. Welche Markisenarten überhaupt einen dach-Stoff bekommen.
      Plissee und Sonnensegel stehen NICHT in der Produktgruppe der
      Stoffkarte (LINEA / SOLARA / PERGOLA / LUNA / LUXORA). */
var mList = (k3d.match(/var STOFF_DACH_MARKISEN = \[([^\]]*)\]/) || [, ''])[1];
pruefe('Nur Aufdach- und Unterdachmarkise bekommen einen dach-Stoff',
       !gegen && /'Aufdachmarkise'/.test(mList) && /'Unterdachmarkise'/.test(mList) &&
       !/Plissee|Sonnensegel/.test(mList), mList.replace(/\s+/g, ' ').trim());

/* 6. Beide Konfiguratoren greifen auf dieselbe Liste zu */
pruefe('3D-Konfigurator liest window.BV_STOFFE',
       new RegExp(q || 'window\\.BV_STOFFE').test(k3d), 'stoffListe()');
pruefe('Anfrage-Assistent liest window.BV_STOFFE',
       new RegExp(q || 'window\\.BV_STOFFE').test(wiz), 'stoffRaster()');
pruefe('Assistent trennt die Gruppen in den Schritten',
       new RegExp(q || "stoffRaster\\('dach', 'stoff'\\)").test(wiz) &&
       new RegExp(q || "stoffRaster\\('zip', 'stoffzip'\\)").test(wiz),
       'stoff / stoffzip');
pruefe('Übergabe aus dem 3D-Konfigurator kommt an',
       new RegExp(q || "'stoff', 'stoffzip'").test(wiz), 'felder-Liste');

/* 7. Jede Seite, die den Assistenten lädt, lädt auch die Stoffliste */
var seiten = fs.readdirSync('.').filter(function (f) { return /\.html$/.test(f); });
var ohne = seiten.filter(function (f) {
  var t = fs.readFileSync(f, 'utf8');
  return /anfrage-wizard\.js/.test(t) && !/markisenstoffe\.js/.test(t);
});
if (gegen) ohne = ['künstlich.html'];
pruefe('Jede Seite mit Assistent lädt die Stoffliste', ohne.length === 0,
       ohne.length ? ohne.join(', ') : seiten.length + ' Seiten geprüft');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
