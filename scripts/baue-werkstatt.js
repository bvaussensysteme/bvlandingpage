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
/* Knopf zum Neuladen und die Versionsnummer der geladenen
   Konfigurator-Datei. Betreiber: "bau in der werkstatt den reload button
   um die seite neu zu laden um neue aenderunge zu sehen".

   Warum die Version dabeisteht: Ein Neuladen allein beantwortet nicht die
   Frage, ob der neue Stand schon da ist - nach dem Zusammenfuehren
   braucht die Veroeffentlichung etwa eine Minute. Mit der Nummer sieht
   man es: aendert sie sich nicht, ist der neue Stand noch unterwegs. */
var werkzeug = [
  '<button type="button" onclick="location.reload()" ',
  'style="background:#fff;color:#1f2a33;border:0;border-radius:6px;',
  'padding:5px 11px;font:inherit;font-weight:700;cursor:pointer">',
  /* Eigenes Symbol statt des Zeichens U+21BB: Das stellt iOS als
     farbiges Emoji dar - „benutz bitte keine imogis das is nicht
     serioes" (Betreiber, 31.10.2026). Das Sprite steht in
     konfigurator.html und kommt mit dieser Datei mit. */
  '<svg class="bvs" aria-hidden="true" style="vertical-align:-.16em">',
  '<use href="#bvs-neuladen"></use></svg> Neu laden</button>',
  '<span id="wkVersion" style="opacity:.75;font-weight:500"></span>',
  /* Erst wenn die Seite steht: Die Skript-Tags stehen am Seitenende,
     der Streifen aber ganz oben. Beim ersten Versuch lief die Abfrage
     waehrend des Einlesens und fand nichts - angezeigt wurde dann
     "Stand unbekannt". */
  '<script>document.addEventListener("DOMContentLoaded",function(){',
  'var s=document.querySelector(\'script[src*="konfigurator-3d.js"]\');',
  'var m=s&&s.src.match(/[?&]v=([0-9a-z]+)/);',
  'var e=document.getElementById("wkVersion");',
  'if(e)e.textContent=m?("Stand "+m[1]):"Stand unbekannt";',
  '});<\/script>'
].join('');

var streifen = [
  '<div style="position:sticky;top:0;z-index:9999;background:#1f2a33;color:#fff;',
  'font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
  'padding:10px 16px;display:flex;gap:12px;align-items:center;justify-content:center;',
  'flex-wrap:wrap;text-align:center">',
  '<span style="background:#c8863a;border-radius:4px;padding:2px 8px">WERKSTATT</span>',
  '<span>Nicht veröffentlicht – Stand in Arbeit. ',
  'Änderungen hier sind für Kunden nicht sichtbar.</span>',
  werkzeug,
  '</div>'
].join('');
if (html.indexOf('WERKSTATT') < 0) {
  html = html.replace(/<body([^>]*)>/, '<body$1>\n' + streifen);
}

/* 3b. Bilder, die aus dem JAVASCRIPT geladen werden, umbiegen.
      Schritt 1 oben fasst nur href/src im HTML an. Die Texturen (Putz,
      Steinplatten, Rasen, Holz, Stoffmuster) und das Bodenlogo laedt
      konfigurator-3d.js selbst mit relativen Pfaden wie
      'images/textur/putz.webp'. Von /werkstatt/ aus zeigen die auf
      /werkstatt/images/... und laufen ins Leere - gemessen: vier 404er,
      darunter Wandputz, Steinplatten und das Logo. Genau deshalb sah die
      Werkstatt anders aus als die echte Seite.

      Kein <base href="/">: Das wuerde auch alle Sprungmarken (#...) auf
      die Startseite umbiegen. Stattdessen nur die Ladewege von three.js,
      an einer Stelle und ohne Nebenwirkung. */
/* Die Ladewege der Bilder werden von js/werkstatt-pfade.js umgebogen -
   als eigene, ebenfalls aufgeschobene Datei. Begruendung steht dort. */
var dreiJs = /<script[^>]*three(?:\.min)?\.js[^>]*><\/script>/.exec(html);
if (!dreiJs) {
  console.error('FEHLER: three.js wurde in der Seite nicht gefunden.');
  process.exit(1);
}
var version = (html.match(/konfigurator-3d\.js\?v=([0-9a-z]+)/) || [])[1] || '1';
var umbiegen = '<script src="/js/werkstatt-pfade.js?v=' + version + '" defer><\/script>';
var nachDrei = dreiJs.index + dreiJs[0].length;
html = html.slice(0, nachDrei) + umbiegen + html.slice(nachDrei);

/* 3c. Nachgeprueft: Steht das Umbiegen wirklich hinter three.js und
      vor konfigurator-3d.js? Sonst wirkt es nicht, und das faellt erst
      an fehlenden Texturen im Bild auf. */
var iDrei = html.search(/<script[^>]*three(?:\.min)?\.js/);
var iUm   = html.indexOf('werkstatt-pfade.js');
var iKonf = html.search(/<script[^>]*konfigurator-3d\.js[^>]*><\/script>/);
if (!(iDrei < iUm && iUm < iKonf)) {
  console.error('FEHLER: Das Umbiegen der Bildpfade steht an der falschen Stelle.');
  console.error('  three.js bei ' + iDrei + ', Umbiegen bei ' + iUm + ', Konfigurator bei ' + iKonf);
  process.exit(1);
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
/* Verglichen werden nur die GEMEINSAMEN Dateien. js/werkstatt-pfade.js
   gibt es nur hier und darf den Vergleich nicht ausloesen. */
function versionen(t) {
  var a = (t.match(/[a-z0-9-]+\.(?:js|css)\?v=[0-9a-z]+/g) || [])
            .filter(function (v) { return v.indexOf('werkstatt-pfade') < 0; })
            .slice().sort();
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
