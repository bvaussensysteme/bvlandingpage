#!/usr/bin/env node
/* Prueft die voruebergehende Sperre des oeffentlichen 3D-Konfigurators.

   Entscheidung des Betreibers am 31.10.2026: Der Konfigurator soll von
   der oeffentlichen Website verschwinden, bis er fertig ist. Gearbeitet
   wird solange in der Werkstatt.

   Geprueft wird beides:
   - die Sperre im Worker (ausgefuehrt, nicht gelesen)
   - dass keine Seite mehr aktiv dorthin verlinkt

   Beim Zurueckschalten ist dieses Skript die Gegenprobe: Es muss dann
   ROT werden. Genau dafuer ist es da.

   Gegenprobe (--gegenprobe): jeder Fehler EINZELN, jede Pruefung muss
   in mindestens einem Durchgang anschlagen.                           */

var fs = require('fs');
var path = require('path');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var wurzel = path.join(__dirname, '..');

/* ---------- Quellen einlesen ---------- */
var workerQuelle = fs.readFileSync(wurzel + '/worker/index.js', 'utf8');
var von = workerQuelle.indexOf('const KONFIGURATOR_GESPERRT');
if (von < 0) { console.error('FEHLER: Die Sperre wurde in worker/index.js nicht gefunden.'); process.exit(2); }
var WORKER_ORIGINAL = workerQuelle.slice(von);
var WRANGLER_ORIGINAL = fs.readFileSync(wurzel + '/wrangler.jsonc', 'utf8');

function htmlDateien() {
  var raus = {}, aus = { '.git': 1, 'node_modules': 1, 'export': 1, '_site': 1 };
  (function geh(ordner) {
    fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
      if (e.isDirectory()) { if (!aus[e.name]) geh(path.join(ordner, e.name)); return; }
      if (!/\.(html|njk)$/.test(e.name)) return;
      var p = path.join(ordner, e.name);
      raus[path.relative(wurzel, p)] = fs.readFileSync(p, 'utf8');
    });
  })(wurzel);
  return raus;
}
var DATEIEN_ORIGINAL = htmlDateien();

/* ---------- Fehler fuer die Gegenprobe ---------- */
var FEHLER = [
  ['Sperre abgeschaltet', 'worker',
   'const KONFIGURATOR_GESPERRT = true;', 'const KONFIGURATOR_GESPERRT = false;'],
  ['Alte Adresse mit .html vergessen', 'worker',
   "'/konfigurator', '/konfigurator/', '/konfigurator.html',",
   "'/konfigurator', '/konfigurator/',"],
  ['Antwort meldet 200 statt 503', 'worker', 'status: 503,', 'status: 200,'],
  ['Retry-After fehlt', 'worker', "'retry-after': '86400',", ''],
  ['Hinweisseite ohne Weg zur Anfrage', 'worker', 'href="/#kontakt"', 'href="#"'],
  ['Werkstatt faelschlich mitgesperrt', 'worker',
   "'/konfigurator', '/konfigurator/', '/konfigurator.html',",
   "'/konfigurator', '/konfigurator/', '/konfigurator.html', '/werkstatt/',"],
  ['Pfad fehlt in run_worker_first', 'wrangler', '"/konfigurator.html"', '"/nie-benutzt"'],
  ['Eine Seite verlinkt wieder aktiv', 'dateien', null, null],
  ['Teaser auf der Startseite wieder aktiv', 'dateien', null, null],
  ['Ratgeber-Verweise versehentlich mitentfernt', 'dateien', null, null]
];

function baue(nr) {
  var code = WORKER_ORIGINAL, wrangler = WRANGLER_ORIGINAL, dateien = DATEIEN_ORIGINAL;
  if (nr != null) {
    var f = FEHLER[nr];
    if (f[1] === 'worker' || f[1] === 'wrangler') {
      var ziel = f[1] === 'worker' ? code : wrangler;
      if (ziel.indexOf(f[2]) < 0) {
        console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
        process.exit(2);
      }
      if (f[1] === 'worker') code = code.replace(f[2], f[3]);
      else wrangler = wrangler.replace(f[2], f[3]);
    } else {
      dateien = {};
      for (var k in DATEIEN_ORIGINAL) dateien[k] = DATEIEN_ORIGINAL[k];
      if (f[0].indexOf('verlinkt wieder') > -1) {
        dateien['pruef-beispiel.html'] =
          '<li><a href="/konfigurator.html"><svg class="nav-icon"></svg>Konfigurator</a></li>';
      } else if (f[0].indexOf('Teaser') > -1) {
        dateien['index.html'] = '<section class="section konfigurator-teaser"></section>';
      } else {
        for (var j in dateien) {
          if (j.indexOf('ratgeber') > -1) dateien[j] = dateien[j].replace(/konfigurator/g, 'x');
        }
      }
    }
  }
  var umgebung = new Function(code +
    '\n;return { gesperrt: KONFIGURATOR_GESPERRT, pfade: KONFIGURATOR_PFADE,' +
    ' seite: konfiguratorGesperrtSeite };')();
  return { w: umgebung, wrangler: wrangler, dateien: dateien };
}

/* ---------- Ein Durchgang ---------- */
var OHNE_KOMMENTARE = /<!--[\s\S]*?-->/g;
var MENUE = /<li><a href="[^"]*konfigurator\.html"><svg class="(?:nav-icon|footer-link-icon)"|<a href="[^"]*konfigurator\.html"><svg class="nav-icon"/;

async function lauf(u) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  /* Die Sperre selbst */
  p('Die Sperre ist eingeschaltet', u.w.gesperrt === true,
    'KONFIGURATOR_GESPERRT = ' + u.w.gesperrt);

  ['/konfigurator', '/konfigurator/', '/konfigurator.html'].forEach(function (pf) {
    p('Gesperrt: ' + pf, u.w.gesperrt && u.w.pfade.has(pf),
      u.w.pfade.has(pf) ? 'in der Sperrliste' : 'FEHLT in der Sperrliste');
  });

  var a = u.w.seite();
  p('Antwort ist 503 (voruebergehend), nicht 404 oder 200',
    a.status === 503, 'Status ' + a.status);
  p('Retry-After und no-store gesetzt',
    /\d/.test(a.headers.get('retry-after') || '') &&
    /no-store/.test(a.headers.get('cache-control') || ''),
    'retry-after: ' + a.headers.get('retry-after'));

  var text = await a.text();
  p('Die Hinweisseite fuehrt zur Anfrage und zum Telefon',
    text.indexOf('href="/#kontakt"') > -1 && text.indexOf('tel:+49') > -1,
    text.indexOf('href="/#kontakt"') > -1 ? 'Anfrage-Knopf und Rufnummer vorhanden'
                                          : 'KEIN Weg zur Anfrage');

  /* Die Werkstatt darf NICHT mitgesperrt sein - sonst koennte der
     Betreiber nicht weiterarbeiten. */
  p('Die Werkstatt ist nicht mitgesperrt',
    !u.w.pfade.has('/werkstatt/') && !u.w.pfade.has('/werkstatt'),
    u.w.pfade.has('/werkstatt/') ? 'WERKSTATT IST GESPERRT' : 'frei');

  p('Die Sperre laeuft durch den Worker (run_worker_first)',
    /"\/konfigurator"/.test(u.wrangler) && /"\/konfigurator\.html"/.test(u.wrangler),
    /"\/konfigurator\.html"/.test(u.wrangler) ? 'Eintraege vorhanden' : 'EINTRAG FEHLT');

  /* Die Seiten */
  var aktive = [];
  for (var k in u.dateien) {
    if (k.indexOf('werkstatt') === 0) continue;
    if (MENUE.test(u.dateien[k].replace(OHNE_KOMMENTARE, ''))) aktive.push(k);
  }
  p('Keine Seite verlinkt den Konfigurator noch aktiv im Menue',
    aktive.length === 0, aktive.length ? aktive.join(', ') : 'keine von ' +
    Object.keys(u.dateien).length + ' Dateien');

  var start = (u.dateien['index.html'] || '').replace(OHNE_KOMMENTARE, '');
  p('Der Teaser auf der Startseite ist ausgeblendet',
    start.indexOf('konfigurator-teaser') < 0,
    start.indexOf('konfigurator-teaser') < 0 ? 'nicht aktiv' : 'NOCH AKTIV');

  /* Bewusste Entscheidung festhalten: die Verweise IM TEXT der Ratgeber
     bleiben stehen. Sie landen weich auf der Hinweisseite; sie zu
     entfernen hiesse, zwanzig Artikel anzufassen und spaeter wieder. */
  var ratgeber = 0;
  for (var r in u.dateien) {
    if (r.indexOf('ratgeber') > -1 && u.dateien[r].indexOf('konfigurator') > -1) ratgeber++;
  }
  p('Die Verweise im Text der Ratgeber bleiben bestehen',
    ratgeber > 0, ratgeber + ' Ratgeberseiten verweisen weiter (so gewollt)');

  return e;
}

/* ---------- Ausfuehrung ---------- */
(async function () {
  if (!gegen) {
    console.log('\nKonfigurator: voruebergehende Sperre');
    var erg = await lauf(baue(null)), rot = 0;
    erg.forEach(function (x) {
      console.log((x.ok ? '  ok      ' : '  FEHLER  ') + x.name + '   ' + x.beleg);
      if (!x.ok) rot++;
    });
    console.log('\nErgebnis: ' + (erg.length - rot) + ' bestanden, ' + rot + ' nicht bestanden');
    process.exit(rot === 0 ? 0 : 1);
  }

  console.log('\nGegenprobe: jeder eingebaute Fehler einzeln\n');
  var namen = (await lauf(baue(null))).map(function (x) { return x.name; });
  var erwischt = namen.map(function () { return []; });
  var ohneWirkung = [];
  for (var nr = 0; nr < FEHLER.length; nr++) {
    var e = await lauf(baue(nr)), n = 0;
    e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(FEHLER[nr][0]); n++; } });
    console.log('  Fehler "' + FEHLER[nr][0] + '": ' + n + ' Pruefung(en) schlagen an');
    if (n === 0) ohneWirkung.push(FEHLER[nr][0]);
  }
  console.log('');
  var blind = [];
  namen.forEach(function (name, i) {
    if (!erwischt[i].length) { blind.push(name); console.log('  BLIND   ' + name); }
    else console.log('  scharf  ' + name);
  });
  console.log('\nErgebnis: ' + (namen.length - blind.length) + ' von ' + namen.length +
              ' Pruefungen schlagen an, ' + (FEHLER.length - ohneWirkung.length) +
              ' von ' + FEHLER.length + ' Fehlern werden bemerkt');
  if (blind.length || ohneWirkung.length) { console.log('GEGENPROBE FEHLGESCHLAGEN.'); process.exit(1); }
  console.log('Gegenprobe in Ordnung.');
})();
