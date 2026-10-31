#!/usr/bin/env node
/* Prueft die Passwortschranke vor der Werkstatt (worker/index.js).

   Warum mit eigenem Skript: Ein Zugangsschutz versagt still. Steht die
   Tuer offen, sieht die Seite genauso aus wie vorher - nur dass jeder
   hineinkommt. Deshalb wird hier nicht der Quelltext gelesen, sondern
   die Schranke AUSGEFUEHRT und ihre Antwort nachgemessen.

   Gegenprobe (--gegenprobe): Jeder Fehler wird EINZELN eingebaut, und
   jede Pruefung muss in mindestens einem Durchgang anschlagen.        */

var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var quelle = fs.readFileSync(__dirname + '/../worker/index.js', 'utf8');
var von = quelle.indexOf("const WERKSTATT_KEKS = 'bv_werkstatt';");
if (von < 0) { console.error('FEHLER: Die Schranke wurde in worker/index.js nicht gefunden.'); process.exit(2); }
var ORIGINAL = quelle.slice(von);
var WRANGLER_ORIGINAL = fs.readFileSync(__dirname + '/../wrangler.jsonc', 'utf8');
var WRANGLER = WRANGLER_ORIGINAL;
/* Die ERZEUGTE Werkstattseite. Sie gehoert in die Gegenprobe wie der
   Worker: Was hier schiefgeht, sieht man der Seite im Browser an, aber
   keiner Quelldatei. */
var WK_ORIGINAL = fs.readFileSync(__dirname + '/../werkstatt/index.html', 'utf8');
var WK = WK_ORIGINAL;
/* Und die OEFFENTLICHE Seite. Sie gehoert in die Gegenprobe, weil der
   schlimmere Fehler dort liegt: Faellt eine Einblendung versehentlich
   auch oeffentlich weg, fehlte das Cookie-Banner - und das faellt
   niemandem sofort auf. */
var QUELLE_ORIGINAL = fs.readFileSync(__dirname + '/../konfigurator.html', 'utf8');
var QUELLE = QUELLE_ORIGINAL;

var FEHLER = [
  ['Ohne hinterlegtes Passwort offen',
   'if (!passwort) {', 'if (false) {'],
  ['Jedes Passwort wird angenommen',
   '  let rest = 0;', '  let rest = 0; return true;'],
  ['Jeder beliebige Keks reicht',
   "if (gleichInKonstanterZeit(keksLesen(request, WERKSTATT_KEKS) || '', erwartet)) {",
   "if (keksLesen(request, WERKSTATT_KEKS) !== null) {"],
  ['Keks ohne HttpOnly',
   "; HttpOnly; Secure; SameSite=Lax'", "; Secure; SameSite=Lax'"],
  ['Passwort steht im Klartext im Keks',
   "WERKSTATT_KEKS + '=' + erwartet", "WERKSTATT_KEKS + '=' + passwort"],
  ['Anmeldeseite darf zwischengespeichert werden',
   "'cache-control': 'no-store',\n        'x-robots-tag'",
   "'cache-control': 'public, max-age=600',\n        'x-robots-tag'"],
  ['Unangemeldete werden einfach durchgelassen',
   "  return anmeldeSeite('');\n}", '  return null;\n}'],
  ['Anmeldung leitet nicht weiter',
   '      status: 303,', '      status: 200,'],
  ['Gueltige Anmeldung wird abgewiesen',
   '    return null;                        // durchlassen',
   "    return anmeldeSeite('');            // faelschlich zu"],
  ['Werkstatt laeuft am Worker vorbei', '"/werkstatt/*"', '"/nie-benutzt/*"', 'wrangler'],
  ['Leerraum im Secret wird nicht abgeschnitten',
   "const passwort = String(env.WERKSTATT_PASSWORT || '').trim();",
   'const passwort = env.WERKSTATT_PASSWORT;'],
  ['Leerraum in der Eingabe wird nicht abgeschnitten',
   "eingabe = String(daten.get('passwort') || '').trim();",
   "eingabe = String(daten.get('passwort') || '');"],
  /* Die vier Fehler, die am 31.10.2026 wirklich passiert sind oder
     unmittelbar drohen: Der Streifen landete im Stylesheet, weil der
     Baukasten ein "<body>" in einem Kommentar traf. */
  ['Streifen landet im Stylesheet statt im Koerper', 'werkstatt',
   '\n<body class="k3d-app-seite">',
   '\n<style>.wk-leiste{}</style><div class="wk-leiste"></div>\n<body class="k3d-app-seite">'],
  ['Ein zweiter body-Anfang schleicht sich ein', 'werkstatt',
   '\n<body class="k3d-app-seite">', '\n<body>\n<body class="k3d-app-seite">'],
  ['Ein Stilblock wird zerrissen', 'werkstatt', '<div class="wk-leiste">',
   '</style><div class="wk-leiste">'],
  ['Der Streifen darf wieder umbrechen', 'werkstatt',
   'white-space:nowrap;overflow-x:auto', 'flex-wrap:wrap;overflow-x:auto'],
  /* Die Einblendungen duerfen NUR in der Werkstatt fehlen. */
  ['Cookie-Banner steht wieder in der Werkstatt', 'werkstatt',
   '<script src="/js/metricool.js"',
   '<script src="/js/cookie.js" defer></script><script src="/js/metricool.js"'],
  ['Testbetrieb-Hinweis steht wieder in der Werkstatt', 'werkstatt',
   '<div class="wk-leiste">', '<div class="k3d-hinw" id="k3dTestHinweis" hidden></div><div class="wk-leiste">'],
  ['Bedienhilfe steht wieder in der Werkstatt', 'werkstatt',
   '<script src="/js/metricool.js"',
   '<script src="/js/accessibility.js" defer></script><script src="/js/metricool.js"'],
  /* Und dasselbe andersherum: auf der oeffentlichen Seite entfernt. */
  ['Cookie-Banner faellt auch oeffentlich weg', 'quelle',
   '<script src="js/cookie.js" defer></script>', ''],
  ['Bedienhilfe faellt auch oeffentlich weg', 'quelle',
   '<script src="js/accessibility.js" defer></script>', ''],
  ['Testbetrieb-Hinweis faellt auch oeffentlich weg', 'quelle',
   'id="k3dTestHinweis"', 'id="k3dHinweisTest"']
];

function baue(nr) {
  var code = ORIGINAL;
  WRANGLER = WRANGLER_ORIGINAL;
  WK = WK_ORIGINAL;
  QUELLE = QUELLE_ORIGINAL;
  if (nr != null && FEHLER[nr][1] === 'quelle') {
    var fq = FEHLER[nr];
    if (QUELLE.indexOf(fq[2]) < 0) {
      console.error('FEHLER: Gegenprobe "' + fq[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    QUELLE = QUELLE.replace(fq[2], fq[3]);
    nr = null;
  }
  if (nr != null && FEHLER[nr][1] === 'werkstatt') {
    var fw = FEHLER[nr];
    if (WK.indexOf(fw[2]) < 0) {
      console.error('FEHLER: Gegenprobe "' + fw[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    WK = WK.replace(fw[2], fw[3]);
    nr = null;
  }
  if (nr != null && FEHLER[nr][3] === 'wrangler') {
    if (WRANGLER.indexOf(FEHLER[nr][1]) < 0) {
      console.error('FEHLER: Gegenprobe "' + FEHLER[nr][0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    WRANGLER = WRANGLER.replace(FEHLER[nr][1], FEHLER[nr][2]);
    nr = null;
  }
  if (nr != null) {
    var f = FEHLER[nr];
    if (code.indexOf(f[1]) < 0) {
      console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    code = code.replace(f[1], f[2]);
  }
  return new Function(code + '\n;return { tor: werkstattTor, token: werkstattToken };')();
}

var PW = 'Geheim-2026!x';

function anfrage(methode, keks, koerper) {
  var kopf = {};
  if (keks) kopf.cookie = keks;
  var o = { method: methode, headers: kopf };
  if (koerper) {
    o.body = new URLSearchParams(koerper);
    kopf['content-type'] = 'application/x-www-form-urlencoded';
  }
  return new Request('https://bv-aussensysteme.de/werkstatt/', o);
}
var URL_ = new URL('https://bv-aussensysteme.de/werkstatt/');

async function lauf(w) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  /* 1 - Ohne hinterlegtes Passwort: zu, nicht offen. */
  var a1 = await w.tor(anfrage('GET'), {}, URL_);
  p('Ohne hinterlegtes Passwort bleibt die Seite gesperrt',
    a1 !== null && a1.status === 503,
    a1 === null ? 'DURCHGELASSEN' : 'Status ' + a1.status);

  /* 2 - Mit Passwort, aber ohne Anmeldung: Anmeldeseite, nicht die Seite. */
  var a2 = await w.tor(anfrage('GET'), { WERKSTATT_PASSWORT: PW }, URL_);
  p('Ohne Anmeldung kommt die Anmeldeseite, nicht die Werkstatt',
    a2 !== null && a2.status === 200,
    a2 === null ? 'DURCHGELASSEN' : 'Status ' + a2.status);

  /* 3 - Falsches Passwort. */
  var a3 = await w.tor(anfrage('POST', null, { passwort: 'falsch' }),
                       { WERKSTATT_PASSWORT: PW }, URL_);
  p('Falsches Passwort wird abgewiesen',
    a3 !== null && a3.status === 401 && !a3.headers.get('set-cookie'),
    a3 === null ? 'DURCHGELASSEN' : 'Status ' + a3.status +
      (a3.headers.get('set-cookie') ? ', setzt trotzdem einen Keks' : ''));

  /* 4 - Richtiges Passwort: Weiterleitung und ein sicher gesetzter Keks. */
  var a4 = await w.tor(anfrage('POST', null, { passwort: PW }),
                       { WERKSTATT_PASSWORT: PW }, URL_);
  var sc = a4 && a4.headers.get('set-cookie') || '';
  p('Richtiges Passwort meldet an',
    a4 !== null && a4.status === 303 && sc.indexOf('bv_werkstatt=') === 0,
    a4 === null ? 'DURCHGELASSEN' : 'Status ' + a4.status + ', Keks: ' + (sc ? 'ja' : 'nein'));
  p('Der Keks ist HttpOnly, Secure und SameSite',
    /HttpOnly/i.test(sc) && /Secure/i.test(sc) && /SameSite=Lax/i.test(sc),
    sc.replace(/^[^;]*/, '(Wert)') || 'kein Keks');
  p('Das Passwort steht nicht im Klartext im Keks',
    sc.indexOf(PW) < 0, sc.indexOf(PW) < 0 ? 'nur der abgeleitete Wert' : 'KLARTEXT IM KEKS');

  /* 5 - Mit gueltigem Keks durchlassen. */
  var gut = await w.token(PW);
  var a5 = await w.tor(anfrage('GET', 'bv_werkstatt=' + gut), { WERKSTATT_PASSWORT: PW }, URL_);
  p('Mit gueltiger Anmeldung wird durchgelassen', a5 === null,
    a5 === null ? 'durchgelassen' : 'Status ' + a5.status);

  /* 6 - Keks vom alten Passwort gilt nicht mehr. */
  var alt = await w.token('altes-passwort');
  var a6 = await w.tor(anfrage('GET', 'bv_werkstatt=' + alt), { WERKSTATT_PASSWORT: PW }, URL_);
  p('Nach Passwortwechsel gilt die alte Anmeldung nicht mehr',
    a6 !== null, a6 === null ? 'DURCHGELASSEN' : 'Status ' + a6.status);

  /* 7 - Ein erfundener Keks reicht nicht. */
  var a7 = await w.tor(anfrage('GET', 'bv_werkstatt=irgendwas'), { WERKSTATT_PASSWORT: PW }, URL_);
  p('Ein erfundener Keks reicht nicht',
    a7 !== null, a7 === null ? 'DURCHGELASSEN' : 'Status ' + a7.status);

  /* 8 - Die Anmeldeseite darf nirgends liegen bleiben. */
  p('Anmeldeseite wird nicht zwischengespeichert und nicht indexiert',
    a2 !== null && /no-store/.test(a2.headers.get('cache-control') || '') &&
    /noindex/.test(a2.headers.get('x-robots-tag') || ''),
    a2 ? 'cache-control: ' + a2.headers.get('cache-control') : '-');

  /* 8b - Unsichtbarer Leerraum darf niemanden aussperren. Beim
     Einfuegen in die Cloudflare-Maske rutscht leicht ein Leerzeichen
     oder Zeilenumbruch mit; sichtbar ist er nicht. */
  var a8 = await w.tor(anfrage('POST', null, { passwort: PW }),
                       { WERKSTATT_PASSWORT: PW + '\n' }, URL_);
  p('Leerraum im hinterlegten Passwort sperrt niemanden aus',
    a8 !== null && a8.status === 303,
    a8 === null ? 'DURCHGELASSEN' : 'Status ' + a8.status);

  var a9 = await w.tor(anfrage('POST', null, { passwort: '  ' + PW + ' ' }),
                       { WERKSTATT_PASSWORT: PW }, URL_);
  p('Leerraum in der Eingabe sperrt niemanden aus',
    a9 !== null && a9.status === 303,
    a9 === null ? 'DURCHGELASSEN' : 'Status ' + a9.status);

  var a10 = await w.tor(anfrage('GET'), { WERKSTATT_PASSWORT: '   ' }, URL_);
  p('Ein Passwort aus lauter Leerzeichen gilt als nicht gesetzt',
    a10 !== null && a10.status === 503,
    a10 === null ? 'DURCHGELASSEN' : 'Status ' + a10.status);

  /* 9 - Wird die Schranke ueberhaupt aufgerufen? Cloudflare liefert
     vorhandene Dateien am Worker VORBEI aus, wenn der Pfad nicht in
     run_worker_first steht. Ohne diesen Eintrag ist die ganze Schranke
     wirkungslos - und man sieht es der Seite nicht an. */
  var wr = WRANGLER;
  p('Die Werkstatt laeuft durch den Worker (run_worker_first)',
    /"\/werkstatt\/\*"/.test(wr) && /"\/werkstatt"/.test(wr),
    /"\/werkstatt\/\*"/.test(wr) ? 'Eintrag vorhanden' : 'EINTRAG FEHLT in wrangler.jsonc');

  /* 10 - Sitzt der Streifen an der richtigen Stelle?

     GEFUNDEN AM 31.10.2026, nachdem es schon veroeffentlicht war: Der
     Baukasten setzte den Streifen hinter das erste "<body>" IM TEXT -
     und das stand in einem Kommentar im Stilblock. Der Streifen landete
     mitten im Stylesheet; das </style> darin schloss den Stilblock der
     Seite viel zu frueh, und der Rest der Gestaltung wurde zu sichtbarem
     Text. Im Browser sah man einen zerrissenen Seitenkopf.

     Gemessen wird die ERZEUGTE Datei, nicht der Baukasten gelesen. */
  var wkDatei = WK;
  var quellDatei = QUELLE;
  function zaehleStil(t) { return (t.match(/<\/style>/g) || []).length; }
  var anfaenge = (wkDatei.match(/^<body[^>]*>/gm) || []).length;
  var koerper = wkDatei.search(/^<body[^>]*>/m);
  var leiste = wkDatei.indexOf('<div class="wk-leiste">');
  p('Genau ein body-Anfang in der Werkstatt', anfaenge === 1,
    anfaenge + ' gefunden');
  p('Der Streifen steht hinter dem body-Anfang',
    koerper > -1 && leiste > koerper,
    'body bei ' + koerper + ', Streifen bei ' + leiste);
  var sollStil = zaehleStil(quellDatei) + 1, istStil = zaehleStil(wkDatei);
  p('Kein Stilblock zerrissen', istStil === sollStil,
    istStil + ' Stilbloecke, erwartet ' + sollStil);

  /* Flach heisst: EINE Zeile. „mach das flacher es schneidet zuviel
     seite weg" (Betreiber, 31.10.2026). Wer den Umbruch zurueckholt,
     nimmt dem Modell den Platz wieder weg. */
  var stilStueck = wkDatei.slice(wkDatei.indexOf('.wk-leiste{'),
                                 wkDatei.indexOf('.wk-marke{'));
  /* 11 - Drei Einblendungen fliegen NUR in der Werkstatt raus.
     „cookies, testbetrieb popup, und die 2 runden buttons … kannst du
     NUR in der Werkstattseite entfernen, auf der normalen internetseite
     bleibt es bestehen" (Betreiber, 31.10.2026).

     Beide Haelften zaehlen, und die zweite ist die wichtigere: Faellt
     eine davon aus Versehen auch auf der oeffentlichen Seite weg,
     fehlte dort das Cookie-Banner - ein Datenschutzproblem, das
     niemandem sofort auffaellt. */
  [['Cookie-Banner', 'js/cookie.js'],
   ['Bedienhilfe (die beiden runden Knoepfe)', 'js/accessibility.js'],
   ['Hinweis auf den Testbetrieb', 'k3dTestHinweis']].forEach(function (x) {
    p(x[0] + ' ist in der Werkstatt weg',
      wkDatei.indexOf(x[1]) < 0, x[1]);
    p(x[0] + ' bleibt auf der oeffentlichen Seite',
      quellDatei.indexOf(x[1]) > -1, x[1] + ' in konfigurator.html');
  });

  p('Der Streifen bleibt einzeilig',
    /white-space:nowrap/.test(stilStueck) && !/flex-wrap:\s*wrap/.test(stilStueck),
    'white-space:nowrap, kein Umbruch');

  return e;
}

(async function () {
  if (!gegen) {
    console.log('\nWerkstatt: Passwortschranke');
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
