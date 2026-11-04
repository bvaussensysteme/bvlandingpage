#!/usr/bin/env node
/* ============================================================
   Prüft die eigene Reichweitenmessung – ohne Browser.

   Was hier geprüft wird, ist in erster Linie eine DATENSCHUTZ-Zusage:
   Die Messung läuft ohne Einwilligung, und das ist nur zulässig, solange
   sie nichts auf dem Gerät speichert, nichts von dort liest und kein
   Merkmal erfasst, mit dem sich ein Besucher wiedererkennen lässt. Diese
   Zusage steht so in der Datenschutzerklärung (Abschnitt 19). Fällt sie,
   ohne dass es jemand merkt, ist der Text dort falsch – deshalb prüft
   das hier eine Maschine und nicht das Gedächtnis.

   Die reinen Rechenfunktionen aus worker/index.js werden WIRKLICH
   ausgeführt, nicht nachgebaut: Sie werden aus der Datei herausgelöst
   und aufgerufen. Eine Kopie im Prüfskript würde früher oder später
   etwas anderes tun als der Worker.

   Aufruf:     node scripts/pruefe-messung.js
   Gegenprobe: node scripts/pruefe-messung.js --gegenprobe
   ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');
var wurzel = path.join(__dirname, '..');
var GEGENPROBE = process.argv.indexOf('--gegenprobe') > -1;

var fehler = 0, anzahl = 0, ergebnisse = [];
function pruef(name, ok, info) {
  anzahl++;
  ergebnisse.push([name, !!ok]);
  if (!GEGENPROBE) {
    console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(52) + (info || ''));
  }
  if (!ok) fehler++;
}
function lies(p) { return fs.readFileSync(path.join(wurzel, p), 'utf8'); }

var messung = lies('js/messung.js');
var worker = lies('worker/index.js');
var wrangler = lies('wrangler.jsonc');
var cookie = lies('js/cookie.js');
var datenschutz = lies('datenschutz.html');
var bauskript = lies('scripts/baue-werkstatt.js');
var zahlenSeite = lies('werkstatt/zahlen.html');
var startseite = lies('index.html');

/* Kommentare erklaeren, sie laden nichts und speichern nichts. Fuer
   jede Pruefung, die nach ECHTEN Zugriffen sucht, muessen sie weg -
   sonst schlaegt die Pruefung auf ihre eigene Begruendung an (genau
   das ist beim ersten Lauf passiert: fuenf Treffer, davon drei im
   Kommentar "kein Cookie, kein localStorage"). */
function ohneKommentar(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

/* Für die Gegenprobe werden die Dateien verändert, nicht das Prüfskript:
   Genau die Zeilen, auf die es ankommt, fallen weg. Schlägt die Prüfung
   dann nicht an, prüft sie nichts. */
if (GEGENPROBE) {
  messung = messung
    .replace("if (location.pathname.indexOf('/werkstatt') === 0) return;", '')
    .replace("if (window.localStorage && localStorage.getItem(ABSCHALTER) === '1') return;",
             "var unbenutzt = 1;")
    .replace('var geraet = (Math.min(window.innerWidth || 0, screen.width || 0) <= 640)',
             'var geraet = (navigator.userAgent.indexOf("iPhone") > -1)');
  worker = worker
    .replace("if (s.charAt(0) !== '/') return null;", '')
    .replace("+ 'zeit INTEGER, land TEXT, region TEXT, tiefe INTEGER)'",
             "+ 'zeit INTEGER, land TEXT, region TEXT, tiefe INTEGER, ip TEXT)'")
    .replace("if (!roh || roh.length > MESSUNG_MAX_BODY) return new Response(null, { status: 204 });",
             'if (!roh) return new Response(null, { status: 204 });')
    /* ---------- Fehler rund um das Tageskennzeichen (04.11.2026) ----------
       Alle drei sind Fehler, die man beim Bauen wirklich macht: die
       IP "nur zur Sicherheit" mitschreiben, sie ein zweites Mal
       auslesen, und das Salz einmal setzen statt taeglich wechseln.
       Jeder einzelne hebelt die Zusage der Datenschutzerklaerung aus,
       und keiner davon ist am Bildschirm zu sehen. */
    .replace("+ 'browser, system) '", "+ 'browser, system, ip) '")
    .replace("const ip = request.headers.get('cf-connecting-ip') || '';",
             "const ip = request.headers.get('cf-connecting-ip') || '';\n"
             + "    void request.headers.get('cf-connecting-ip');")
    .replace("await env.MESSUNG.prepare('DELETE FROM salz WHERE tag < ?1').bind(tag).run();",
             'void tag;');
  cookie = cookie.replace("'<input type=\"checkbox\" id=\"cbExternal\" />' +",
                          "'<input type=\"checkbox\" id=\"cbExternal\" checked />' +");
  /* MIT NACHBARTEXT VERANKERT (04.11.2026): § 25 TDDDG steht seit dem
     Tageskennzeichen ZWEIMAL im Text. Ein Fehler, der nur das erste
     Vorkommen trifft, blieb unbemerkt - die Gegenprobe hat das
     gemeldet. */
  datenschutz = datenschutz.replace(
    'Einwilligung nach\n            § 25 TDDDG ist dafür deshalb nicht erforderlich',
    'Einwilligung nach irgendeiner Vorschrift ist nicht erforderlich')
    .replace('§ 25 TDDDG', 'irgendeiner Vorschrift');
  bauskript = bauskript.replace("['Eigene Reichweitenmessung',", "['Nichts',");
  /* Neunter eingebauter Fehler: Die Vorab-Verbindung zu Google ist
     wieder da - der Zustand vom 03.11.2026 vor dieser Runde. */
  startseite = startseite.replace('<link rel="dns-prefetch" href="https://formspree.io" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
    + '<link rel="dns-prefetch" href="https://formspree.io" />');
}

/* ---------- 1. Die Zusage: kein Zugriff auf das Gerät ---------- */
(function () {
  /* Erlaubt ist genau EIN Speicherzugriff: das Lesen des Abschalters,
     mit dem der Betrieb seine eigenen Besuche ausnimmt. Alles andere
     wäre ein Zugriff im Sinne des § 25 TDDDG – und damit
     einwilligungspflichtig. */
  var code = ohneKommentar(messung);
  var zugriffe = code.match(/localStorage|sessionStorage|document\.cookie|indexedDB/g) || [];
  var erlaubt = (code.match(/localStorage\.getItem\(ABSCHALTER\)|window\.localStorage/g) || []).length;
  pruef('Messung greift nur für den Abschalter auf den Speicher zu',
    zugriffe.length === erlaubt && zugriffe.length <= 2,
    zugriffe.length + ' Zugriffe, davon ' + erlaubt + ' erlaubt');
  pruef('Messung schreibt nichts auf das Gerät',
    !/localStorage\.setItem|sessionStorage\.setItem|document\.cookie\s*=/.test(code));
  pruef('Messung liest keinen User-Agent', !/navigator\.userAgent/.test(code));
  pruef('Messung liest keinen Fingerabdruck',
    !/canvas|getImageData|fonts\.check|hardwareConcurrency|deviceMemory/i.test(code));
  pruef('Messung lässt die Werkstatt aus',
    messung.indexOf("location.pathname.indexOf('/werkstatt') === 0") > -1);
  pruef('Messung hat einen Abschalter für eigene Besuche',
    /localStorage\.getItem\(ABSCHALTER\) === '1'\) return/.test(messung));
  pruef('Messung sendet an die eigene Adresse',
    /ZIEL = '\/api\/messung'/.test(messung) && /navigator\.sendBeacon\(ZIEL/.test(messung));
  pruef('Gezählt wird nur, was auf der Liste steht',
    /KLICKZIELE/.test(messung) && !/addEventListener\('click'[\s\S]{0,400}ziel\.tagName/.test(messung));
})();

/* ---------- 2. Der Worker: Tabelle und Annahme ---------- */
(function () {
  var code = ohneKommentar(messung);
  var tabelle = (worker.match(/CREATE TABLE IF NOT EXISTS ereignis[\s\S]{0,400}?\)'/) || [''])[0];
  /* GEAENDERT 04.11.2026. Hier stand, die Tabelle duerfe keine Spalte
     fuer "besucher" haben - seit dem Tageskennzeichen hat sie eine,
     und zwar mit Absicht. Die Pruefung waere also entweder rot oder,
     schlimmer, stillschweigend gegenstandslos geworden: Sie las nur
     den CREATE-Teil, und die neuen Spalten kamen ueber ALTER dazu.

     GEPRUEFT WIRD JETZT DAS, WORAUF ES ANKOMMT: dass IP-Adresse und
     Browserkennung NIRGENDS gespeichert werden. Sie duerfen in die
     Pruefsumme eingehen - und sonst nirgendwohin. */
  var einfuegen = (worker.match(/INSERT INTO ereignis[\s\S]{0,400}?VALUES[^']*'/) || [''])[0];
  pruef('Keine Spalte für IP oder rohe Browserkennung',
    einfuegen.length > 50 && !/\bip\b|adresse|user_?agent|fingerprint/i.test(einfuegen),
    einfuegen.length ? 'Spaltenliste des INSERT geprüft' : 'INSERT nicht gefunden');
  pruef('Die IP wird nur für die Prüfsumme gelesen',
    (worker.match(/cf-connecting-ip/g) || []).length === 1 &&
    /crypto\.subtle\.digest\('SHA-256'/.test(worker),
    'einmal gelesen, danach nur noch als Prüfsumme');
  pruef('Das Salz wechselt täglich und wird aufgeräumt',
    /DELETE FROM salz WHERE tag < \?1/.test(worker) &&
    /crypto\.getRandomValues/.test(worker),
    'neue Zufallszahl je Tag, ältere gelöscht');
  pruef('Browser und System nur als Familie, ohne Fassungsnummer',
    /function messungBrowser/.test(worker) &&
    !/\\d+\\.\\d+/.test((worker.match(/function messungBrowser[\s\S]*?\n}/) || [''])[0]),
    'keine Versionsnummern im Quelltext');
  pruef('Nur POST nimmt Messdaten an',
    /url\.pathname === '\/api\/messung' && request\.method === 'POST'/.test(worker));
  pruef('Rumpf ist begrenzt',
    /roh\.length > MESSUNG_MAX_BODY/.test(worker) && /MESSUNG_MAX_BODY = 4 \* 1024/.test(worker));
  pruef('Nur bekannte Ereignisarten kommen durch',
    /MESSUNG_ARTEN\.has\(art\)/.test(worker) && /const MESSUNG_ARTEN = new Set\(/.test(worker));
  pruef('Höchstens 20 Ereignisse je Sendung', /\.slice\(0, 20\)/.test(worker));
  pruef('Auswertung liegt hinter dem Werkstatt-Tor',
    worker.indexOf('await werkstattTor(request, env, url)') <
    worker.indexOf("url.pathname === '/werkstatt/api/zahlen'"));
  pruef('Alte Daten werden gelöscht',
    /DELETE FROM ereignis WHERE tag < \?1/.test(worker) && /400 \* 86400000/.test(worker));
  pruef('Ohne Datenbank läuft die Seite weiter',
    /if \(!env\.MESSUNG\) return new Response\(null, \{ status: 204 \}\)/.test(worker));
  /* Der zweite Ausbau bringt Herkunft, Lesetiefe und Klickbeschriftung.
     Jede dieser drei Angaben ist eine neue Zusage in der
     Datenschutzerklaerung - und jede hat ihre eigene Grenze. */
  pruef('Die Herkunft kommt von Cloudflare, nicht aus der IP-Adresse',
    /const cf = request\.cf \|\| \{\};/.test(worker) &&
    /messungText\(cf\.country, 4\)/.test(worker) &&
    !/cf\.city|cf\.postalCode|cf\.latitude|cf\.longitude/.test(worker),
    'weder Stadt noch Postleitzahl noch Koordinaten');
  pruef('Das Bundesland nur innerhalb Deutschlands',
    /land === 'DE'\) \? messungText\(cf\.region/.test(worker));
  pruef('Geklickt wird nur an Knöpfen und Verweisen gelesen',
    /ziel\.closest\('a\[href\], button'\)/.test(code) &&
    !/input|textarea|\.value/.test(code),
    'keine Eingabefelder');
  pruef('Die Lesetiefe merkt nur den tiefsten Punkt',
    /if \(p > tiefe\) tiefe = Math\.max\(0, Math\.min\(100, p\)\);/.test(code));
  pruef('Datenbank ist gebunden und liegt in der EU',
    /"binding": "MESSUNG"/.test(wrangler) &&
    /"database_id": "[0-9a-f]{8}-[0-9a-f]{4}-/.test(wrangler) && /WEUR|EU/.test(wrangler));
})();

/* ---------- 3. Die Rechenfunktionen WIRKLICH ausführen ---------- */
(function () {
  /* Herauslösen statt nachbauen: Die Funktion wird aus worker/index.js
     geschnitten und hier aufgerufen. Ändert sie sich dort, prüft dieses
     Skript die geänderte Fassung. */
  function holeFunktion(name) {
    var start = worker.indexOf('function ' + name + '(');
    if (start < 0) return null;
    var i = worker.indexOf('{', start), tiefe = 0, j = i;
    for (; j < worker.length; j++) {
      if (worker[j] === '{') tiefe++;
      else if (worker[j] === '}') { tiefe--; if (!tiefe) break; }
    }
    return worker.slice(start, j + 1);
  }
  var quelltext = ['messungText', 'messungZahl', 'messungSeite', 'messungZeit']
    .map(holeFunktion).join('\n');
  pruef('Alle vier Rechenfunktionen gefunden',
    quelltext.split('function ').length - 1 === 4);
  var f;
  try {
    f = new Function(quelltext +
      '; return { messungSeite: messungSeite, messungZahl: messungZahl, ' +
      'messungText: messungText, messungZeit: messungZeit };')();
  } catch (e) { f = null; }
  pruef('Rechenfunktionen laufen', !!f, f ? '' : 'nicht ausführbar');
  if (f) {
    pruef('Pfad ohne Fragezeichen und Raute',
      f.messungSeite('/konfigurator.html?x=1#k=abc') === '/konfigurator.html',
      String(f.messungSeite('/konfigurator.html?x=1#k=abc')));
    pruef('Fremde Adresse wird abgelehnt',
      f.messungSeite('https://beispiel.de/spam') === null &&
      f.messungSeite('beispiel') === null);
    pruef('Pfad wird gekürzt', f.messungSeite('/' + 'a'.repeat(300)).length === 120);
    pruef('Zahlen werden begrenzt',
      f.messungZahl(99999, 0, 3600) === 3600 && f.messungZahl(-5, 0, 3600) === 0 &&
      f.messungZahl('abc', 0, 10) === null);
    pruef('Steuerzeichen fallen aus dem Text',
      f.messungText('ab\u0007cd', 40) === 'ab cd', JSON.stringify(f.messungText('ab\u0007cd', 40)));
    var z = f.messungZeit(new Date('2026-06-14T22:30:00Z'));
    /* Sommerzeit: 22:30 UTC ist in Berlin der 15. Juni, 0:30 Uhr. Genau
       dafür steht die Zeitzone im Code – nach Wochentagen ist gefragt,
       und in UTC wäre der Samstagabend halb Sonntag. */
    pruef('Tag und Stunde in unserer Zeitzone',
      z.tag === '2026-06-15' && z.stunde === 0, z.tag + ' / ' + z.stunde + ' Uhr');
  } else {
    ['Pfad ohne Fragezeichen und Raute', 'Fremde Adresse wird abgelehnt',
     'Pfad wird gekürzt', 'Zahlen werden begrenzt', 'Steuerzeichen fallen aus dem Text',
     'Tag und Stunde in unserer Zeitzone'].forEach(function (n) {
      pruef(n, false, 'Funktionen nicht ausführbar');
    });
  }
})();

/* ---------- 4. Einbau in die Seiten ---------- */
(function () {
  var seiten = [], fehlend = [];
  (function sammle(ordner) {
    fs.readdirSync(path.join(wurzel, ordner), { withFileTypes: true }).forEach(function (e) {
      var rel = ordner ? ordner + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (['node_modules', 'export', 'werkstatt', 'src', 'docs', 'scripts',
             'images', 'daten', 'data', '.git', 'pruefbilder', 'audits',
             'improvements', 'roadmap', 'agents', 'dokumente'].indexOf(e.name) > -1) return;
        sammle(rel);
      } else if (/\.html$/.test(e.name) && rel !== 'vorschau.html' && rel !== '_template.html') {
        var t = fs.readFileSync(path.join(wurzel, rel), 'utf8');
        if (t.indexOf('js/metricool.js') < 0) return;      // nur echte Seiten
        seiten.push(rel);
        if (t.indexOf('/js/messung.js') < 0) fehlend.push(rel);
      }
    });
  })('');
  pruef('Alle öffentlichen Seiten messen mit', seiten.length > 40 && !fehlend.length,
    seiten.length + ' Seiten' + (fehlend.length ? ', ohne: ' + fehlend.slice(0, 3).join(', ') : ''));
  pruef('In der Werkstatt wird nicht gemessen',
    lies('werkstatt/index.html').indexOf('messung.js') < 0);
  pruef('Das Bauskript nimmt die Messung dort heraus',
    /\['Eigene Reichweitenmessung',/.test(bauskript));
  pruef('Die Zahlenseite liegt in der Werkstatt und holt von dort',
    /\/werkstatt\/api\/zahlen/.test(zahlenSeite) && /bv_messung_aus/.test(zahlenSeite));
  pruef('Konfigurator meldet seine Schritte',
    /bvMessung\('konfig-schritt', pos, ber\.id\)/.test(lies('js/konfigurator-3d.js')));
  pruef('Nur bei einem Bereichswechsel, nicht bei jedem Haken',
    /bereichNr !== messungBereich/.test(lies('js/konfigurator-3d.js')));
  pruef('Abgeschickte Anfrage wird gemeldet',
    /bvMessung\('anfrage-gesendet'\)/.test(lies('js/anfrage-wizard.js')));
})();

/* ---------- 5. Datenschutzerklärung und Cookie-Banner ---------- */
(function () {
  pruef('Datenschutzerklärung hat den Abschnitt',
    /id="eigene-messung"/.test(datenschutz) &&
    /Eigene Reichweitenmessung/.test(datenschutz));
  pruef('Abschnitt steht im Inhaltsverzeichnis',
    /href="#eigene-messung"/.test(datenschutz));
  pruef('Sie nennt die Vorschrift, die Dauer und den Standort',
    /§ 25 TDDDG/.test(datenschutz) && /400/.test(datenschutz) &&
    /Europ(ä|&auml;)ischen Union/.test(datenschutz));
  /* GEAENDERT 04.11.2026: Seit dem Tageskennzeichen stimmt die alte
     Zusage („keine IP, auch nicht als Hashwert") nicht mehr. Geprueft
     wird jetzt, dass der Text die NEUE Wahrheit vollstaendig sagt -
     und zwar alle vier Punkte, auf denen die Zulaessigkeit beruht.
     Faellt einer weg, ist die Erklaerung unvollstaendig, und das ist
     ein eigener Verstoss. */
  pruef('Das Tageskennzeichen ist vollständig erklärt',
    /Prüfsumme/.test(datenschutz) &&
    /täglich um\s*Mitternacht neu gezogen|täglich wechselt/.test(datenschutz) &&
    /IP-Adresse und Ihre Browserkennung werden nicht\s*gespeichert/.test(datenschutz) &&
    /über den Tag hinaus nicht möglich/.test(datenschutz),
    'Prüfsumme, täglicher Wechsel, nichts gespeichert, keine Wiedererkennung');
  pruef('Sie nennt die Grundlage und das Widerspruchsrecht',
    /Art\. 6 Abs\. 1 lit\. f DSGVO/.test(datenschutz) &&
    /jederzeit formlos widersprechen/.test(datenschutz) &&
    /§ 25 TDDDG/.test(datenschutz),
    'berechtigtes Interesse, Art. 21, § 25 TDDDG');
  pruef('Sie nennt Browser- und Systemfamilie und die utm-Felder',
    /Familie/.test(datenschutz) && /utm_source/.test(datenschutz) &&
    /ohne Versionsnummern/.test(datenschutz));
  pruef('Die neuen Angaben stehen auch darin',
    /gescrollt/.test(datenschutz) && /Bundesland/.test(datenschutz) &&
    /Beschriftung/.test(datenschutz) &&
    /keine Stadt, keine\s*Postleitzahl|keine Stadt, keine Postleitzahl/.test(datenschutz),
    'Scrolltiefe, Bundesland, Klickbeschriftung');
  /* Vorbelegte Einwilligung: Der Haken bei „Externe Dienste" war bis zum
     03.11.2026 gesetzt. Nach EuGH (Planet49) ist das keine Einwilligung. */
  pruef('Kein vorbelegter Haken im Cookie-Banner',
    !/id="cbExternal" checked/.test(cookie) && !/id="cbAnalytics" checked/.test(cookie));
  pruef('Fehlt das Kästchen, gilt das als Ablehnung',
    /var external  = cbE \? cbE\.checked : false/.test(cookie));
  /* GEPRÜFT WIRD DER VERBINDUNGSAUFBAU, nicht die Erwähnung: Google
     Fonts steht im Kopf der Startseite weiterhin – aber in einer
     Funktion, die erst nach der Einwilligung läuft. Falsch sind nur
     <link rel="preconnect"> und <link rel="dns-prefetch">, denn die
     verbinden sofort, bevor jemand zugestimmt hat. */
  var hinweise = (startseite.replace(/<!--[\s\S]*?-->/g, '')
    .match(/<link[^>]+rel="(?:preconnect|dns-prefetch)"[^>]*>/g) || []).join(' ');
  pruef('Keine Vorab-Verbindung zu Google',
    !/googleapis|gstatic|googletagmanager|google-analytics/.test(hinweise),
    hinweise.length ? hinweise.replace(/<[^ ]+ /g, '').slice(0, 70) : 'keine Hinweise im Kopf');
})();

if (!GEGENPROBE) {
  console.log(fehler === 0
    ? '\nErgebnis: alle ' + anzahl + ' Prüfungen bestanden'
    : '\nErgebnis: ' + fehler + ' von ' + anzahl + ' Prüfung(en) nicht bestanden');
  process.exit(fehler === 0 ? 0 : 1);
}

var sollenScheitern = [
  'Messung lässt die Werkstatt aus',
  'Messung hat einen Abschalter für eigene Besuche',
  'Messung liest keinen User-Agent',
  'Fremde Adresse wird abgelehnt',
  'Rumpf ist begrenzt',
  'Das Bauskript nimmt die Messung dort heraus',
  'Sie nennt die Vorschrift, die Dauer und den Standort',
  'Keine Spalte für IP oder rohe Browserkennung',
  'Die IP wird nur für die Prüfsumme gelesen',
  'Das Salz wechselt täglich und wird aufgeräumt',
  'Kein vorbelegter Haken im Cookie-Banner',
  'Keine Vorab-Verbindung zu Google'
];
var luecken = 0;
sollenScheitern.forEach(function (name) {
  var t = ergebnisse.filter(function (e) { return e[0] === name; })[0];
  if (!t) { console.log('  FEHLGESCHLAGEN ' + name + ' - Prüfung gar nicht gelaufen'); luecken++; }
  else if (t[1]) { console.log('  FEHLGESCHLAGEN ' + name + ' - eingebauten Fehler NICHT bemerkt'); luecken++; }
  else console.log('  erkannt        ' + name);
});
console.log(luecken === 0
  ? 'Ergebnis: bestanden - alle eingebauten Fehler wurden gefunden'
  : 'Ergebnis: ' + luecken + ' eingebaute Fehler blieben unbemerkt');
process.exit(luecken === 0 ? 0 : 1);
