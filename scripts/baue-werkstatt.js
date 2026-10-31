#!/usr/bin/env node
/* Erzeugt die WERKSTATT-Seite: werkstatt/index.html

   Die Werkstatt ist die nicht oeffentliche Erprobungsseite. Dort sind
   Sachen freigeschaltet, die auf der oeffentlichen Konfiguratorseite noch
   nichts zu suchen haben - zurzeit die Aussparung (Hausvorsprung).

   Warum ERZEUGT und nicht kopiert: Eine Kopie laeuft nach wenigen Tagen
   auseinander, und dann weiss niemand mehr, welche der beiden Seiten die
   richtige ist. Diese Datei wird bei jeder Aenderung an konfigurator.html
   neu geschrieben - sie ist ein Erzeugnis, keine zweite Quelle.

   Beide Seiten laden DIESELBE js/konfigurator-3d.js. Unterschiedlich ist
   nur, was freigeschaltet ist; das entscheidet der Pfad /werkstatt/.

   Aufruf:  node scripts/baue-werkstatt.js
            node scripts/baue-werkstatt.js --pruefen   (nur pruefen, nichts schreiben)   */

var fs = require('fs');
var path = require('path');
var wurzel = path.join(__dirname, '..');
var nurPruefen = process.argv.indexOf('--pruefen') > -1;

var quelle = path.join(wurzel, 'konfigurator.html');
var ziel = path.join(wurzel, 'werkstatt', 'index.html');
var html = fs.readFileSync(quelle, 'utf8');

/* 1. Alle relativen Verweise absolut machen. Die Werkstatt liegt eine
      Ebene tiefer; "js/..." wuerde dort zu "/werkstatt/js/..." und ins
      Leere laufen. */
var RELATIV = /\b(href|src)="(?!https?:|\/\/|\/|#|mailto:|tel:|data:|javascript:)([^"]+)"/g;
var umgebogen = 0;
html = html.replace(RELATIV, function (_, attr, wert) {
  umgebogen++;
  return attr + '="/' + wert + '"';
});

/* 2. Kopf: nicht indexieren, keine Kanonische, eigener Titel. Die Seite
      soll in keiner Suchmaschine auftauchen - weder ueber uns noch ueber
      einen Verweis von aussen. */
html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '');
html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '');
html = html.replace(/\s*<meta property="og:url"[^>]*>/g, '');
html = html.replace(/<title>[^<]*<\/title>/,
  '<title>Werkstatt – nicht veroeffentlicht</title>\n'
  + '  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">');

/* 3. Ein Streifen, der keinen Zweifel laesst, auf welcher Seite man ist.
      Bewusst nuechtern und in den Farben der Seite - er soll auffallen,
      aber nicht wie ein Fehler aussehen. */
var streifen = [
  '<div style="position:sticky;top:0;z-index:9999;background:#1f2a33;color:#fff;',
  'font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
  'padding:10px 16px;display:flex;gap:12px;align-items:center;justify-content:center;',
  'flex-wrap:wrap;text-align:center">',
  '<span style="background:#c8863a;border-radius:4px;padding:2px 8px">WERKSTATT</span>',
  '<span>Nicht veröffentlicht – Stand in Arbeit. ',
  'Änderungen hier sind für Kunden nicht sichtbar.</span>',
  '</div>'
].join('');
if (html.indexOf('WERKSTATT') < 0) {
  html = html.replace(/<body([^>]*)>/, '<body$1>\n' + streifen);
}

/* 4. Gegenprobe am eigenen Erzeugnis: Ist wirklich kein relativer
      Verweis uebrig? Ein einziger uebersehener wuerde auf der Werkstatt
      ins Leere zeigen, und das faellt erst im Browser auf. */
var rest = [];
var pruefRe = /\b(?:href|src)="(?!https?:|\/\/|\/|#|mailto:|tel:|data:|javascript:)([^"]+)"/g, m;
while ((m = pruefRe.exec(html)) !== null) rest.push(m[1]);
if (rest.length) {
  console.error('FEHLER: ' + rest.length + ' relative Verweise blieben stehen:');
  rest.slice(0, 10).forEach(function (r) { console.error('  ' + r); });
  process.exit(1);
}

/* 5. Und: Zeigt die Seite auf dieselben Dateiversionen wie das Original?
      Sonst laedt die Werkstatt alten Code und man sucht an der falschen
      Stelle nach dem Fehler. */
function versionen(t) {
  var a = (t.match(/[a-z0-9-]+\.(?:js|css)\?v=[0-9a-z]+/g) || []).slice().sort();
  return a.join(',');
}
if (versionen(html) !== versionen(fs.readFileSync(quelle, 'utf8'))) {
  console.error('FEHLER: Die Werkstatt zeigt auf andere Dateiversionen als konfigurator.html.');
  process.exit(1);
}

if (nurPruefen) {
  var vorhanden = fs.existsSync(ziel) ? fs.readFileSync(ziel, 'utf8') : '';
  if (vorhanden !== html) {
    console.error('FEHLER: werkstatt/index.html ist nicht auf dem Stand von konfigurator.html.');
    console.error('        Abhilfe: node scripts/baue-werkstatt.js');
    process.exit(1);
  }
  console.log('ok      werkstatt/index.html ist auf dem Stand von konfigurator.html');
  process.exit(0);
}

fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, html, 'utf8');
console.log('ok      ' + umgebogen + ' Verweise absolut gemacht');
console.log('ok      kein relativer Verweis uebrig');
console.log('ok      Dateiversionen stimmen mit konfigurator.html ueberein');
console.log('ok      noindex gesetzt, Kanonische entfernt');
console.log('\nwerkstatt/index.html geschrieben (' +
            (Buffer.byteLength(html) / 1024).toFixed(0) + ' kB)');
