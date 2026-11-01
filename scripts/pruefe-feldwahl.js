#!/usr/bin/env node
/* Prueft die Zuordnung "welches Element sitzt in welchem Feld".
 *
 * ANLASS. „bei dieser terassengroesse sind es zwei felder vorne wie man
 * auf screenshots sieht, man kann aber nur die stirnseite komplett
 * bearbeiten und nicht pro feld, also planken etc." (Betreiber,
 * 01.11.2026, mit zwei Bildern).
 *
 * DER WUNDE PUNKT ist die VORGABE. Steht keine Zuordnung da, muss ein
 * Element in ALLEN Feldern erscheinen - sonst verschwindet jede
 * bestehende Konfiguration, jeder alte Teilen-Link und jede Anlage mit
 * nur einem Feld aus dem Modell. Diese Richtung wird hier mehrfach
 * festgehalten.
 *
 * DAZU EIN FUND vom selben Tag: Die Rueckseite wurde DREIMAL gebaut -
 * zweimal nach den Faechern der Vorderseite, einmal nach den eigenen.
 * Gemessen im Browser bei 7 m freistehend mit Plankenwand hinten. Rest
 * der Korrektur vom 24.10.2026, bei der die Rueckseite eigene Faecher
 * bekam: Der neue Block kam dazu, der alte Aufruf blieb stehen.
 *
 * GEGENPROBE (--gegenprobe): Es wird nicht das Kriterium aufgeweicht,
 * sondern die Quelle beschaedigt - JEDER FEHLER EINZELN.
 *
 * Aufruf:  node scripts/pruefe-feldwahl.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var JS_ORIG = fs.readFileSync(__dirname + '/../js/konfigurator-3d.js', 'utf8');
var HTML_ORIG = fs.readFileSync(__dirname + '/../konfigurator.html', 'utf8');

var FEHLER = [
  ['Ohne Zuordnung gilt ein Element nur im ersten Feld', 'js',
   '      return f === FELD_ALLE || f === feldNr;', '      return f === feldNr;'],
  ['Die Feldliste wird beim Bauen nicht benutzt', 'js',
   '      var liste = erwListeFeld(seite, feldNr);', '      var liste = erwListe(seite);'],
  ['Die Schiebetuerfuehrung richtet sich nach der ganzen Seite', 'js',
   "      var hatSchiebeHier = liste.indexOf('Schiebetür') > -1;",
   "      var hatSchiebeHier = erwListe(seite).indexOf('Schiebetür') > -1;"],
  ['Die Vorgabe wird gespeichert statt geloescht', 'js',
   '    if (feld == null || feld < 0) delete Z.erwFeld[k];',
   '    if (false) delete Z.erwFeld[k];'],
  ['Z kennt die Zuordnung nicht', 'js', '    erwFeld: {},', '    erwFeldAlt: {},'],
  ['Verwaiste Zuordnungen bleiben stehen', 'js',
   '        if (!gilt) delete Z.erwFeld[k];', '        void gilt;'],
  ['Ein weggefallenes Feld laesst das Element verschwinden', 'js',
   '                   Z.erwFeld[k] < (FELD_ANZAHL[seite] || 1);',
   '                   true;'],
  ['Die Feldzahl wird erst nach dem Bauen bestimmt', 'js',
   '    FELD_ANZAHL.vorne = faecher(achsen) || 1;', '    void faecher;'],
  ['Faecher ohne lichtes Mass werden mitgezaehlt', 'js',
   '        if (liste[i + 1] - PROFIL / 2 - (liste[i] + PROFIL / 2) > 0) n++;',
   '        n++;'],
  ['Die Feldnummer folgt wieder der Schleife statt den Faechern', 'js',
   "                feldMitte > 0 ? -1 : 1, feldNrV);\n      feldNrV++;",
   "                feldMitte > 0 ? -1 : 1, f);"],
  ['Hinten zaehlt wieder die Schleife', 'js',
   "                  hMitte > 0 ? -1 : 1, feldNrH);\n        feldNrH++;",
   "                  hMitte > 0 ? -1 : 1, fh);"],
  ['Die Rueckseite wird wieder doppelt gebaut', 'js',
   "      feldNrV++;",
   "      feldNrV++;\n      if (rueckseiteOffen()) {\n        eineSeite('hinten', hinten, feldMitte, feldLaenge, false,\n                  feldMitte > 0 ? -1 : 1, feldNrV);\n      }"],
  ['Der Teilen-Link vergisst die Zuordnung', 'js',
   '    if (Z.erwFeld && Object.keys(Z.erwFeld).length) d.ef = Z.erwFeld;',
   '    void 0;'],
  ['Der Teilen-Link liest die Zuordnung nicht zurueck', 'js',
   "    Z.erwFeld = (d.ef && typeof d.ef === 'object') ? d.ef : {};",
   '    void 0;'],
  ['Das Lamellendach erbt die Zuordnung des Terrassendachs', 'js',
   '      Z.erwFeld = {};\n      seitenErweiterungen(B, T, h, PFOSTEN, 0);',
   '      seitenErweiterungen(B, T, h, PFOSTEN, 0);'],
  ['Die Anfrage nennt das Feld nicht', 'js',
   "        seiten.push(seite + ': ' + (l.length ? l.map(function (w) {\n          return w + erwFeldZusatz(seite, w); }).join(' + ') : 'offen'));",
   "        seiten.push(seite + ': ' + (l.length ? l.join(' + ') : 'offen'));"],
  ['Die Kurzfassung nennt das Feld nicht', 'js',
   "        if (l.length) se.push(seite + ': ' + l.map(function (w) {\n          return w + erwFeldZusatz(seite, w); }).join(' + '));",
   "        if (l.length) se.push(seite + ': ' + l.join(' + '));"],
  ['Der Zusatz steht auch bei nur einem Feld', 'js',
   "    if (f === FELD_ALLE || (FELD_ANZAHL[seite] || 1) < 2) return '';",
   "    if (f === FELD_ALLE) return '';"],
  ['Die Feldwahl haengt der Feldzahl hinterher', 'js',
   '    erwAnzeigen();\n    neuZeichnen();', '    neuZeichnen();'],
  ['Die Feldwahl fehlt in der Seite', 'html',
   '<div class="k3d-feldwahl" data-k3d-feldwahl="vorne"></div>', ''],
  /* MIT DER VORZEILE, sonst trifft der Austausch ein gleichlautendes
     "if (anzahl > 1)" weiter oben im Programm - dann wird eine fremde
     Stelle beschaedigt und diese Pruefung bleibt gruen. Im ersten
     Anlauf genau so passiert. */
  ['Die Feldwahl erscheint auch bei einem Feld', 'js',
   "      var html = '';\n      if (anzahl > 1) {",
   "      var html = '';\n      if (anzahl > 0) {"],
  ['Die Rueckseite hat keine eigenen Faecher mehr', 'js',
   "        eineSeite('hinten', hinten, hMitte, hLaenge, false,",
   "        void eineSeite || (function () {})('hinten', hinten, hMitte, hLaenge, false,"],
  ['Die Anfrage nennt die Feldzahl nicht', 'js',
   "        teile.push('Felder je Seite \u2013 ' + erwSeiten().map(function (seite) {",
   "        void 0 || (function () {})('Felder je Seite ' + erwSeiten().map(function (seite) {"],
  ['Die Feldwahl wird bei jeder Aenderung neu gebaut (Fokus weg)', 'js',
   "    if (kasten.getAttribute('data-stand') !== stand) {", '    if (true) {'],
  ['Der Stand der Feldwahl wird nicht nachgezogen', 'js',
   "        b.classList.toggle('is-active', an);", '        void an;'],
  ['Die Sprungziele werden wieder in EINER Abfrage gesucht', 'js',
   "    var wahlen = (m.art === 'dach')",
   "    var wahlen = [].concat((m.art === 'dach')"],
  ['Das + merkt sich sein Feld nicht', 'js',
   "    feldGemerkt = (m.art === 'seite' && (FELD_ANZAHL[m.seite] || 1) > 1)",
   "    feldGemerkt = (false)"],
  ['Ein neu gewaehltes Element landet nicht im gemerkten Feld', 'js',
   '      if (!vorher && jetzt && feldGemerkt && feldGemerkt.seite === seite) {',
   '      if (false) {'],
  ['Das gemerkte Feld gilt mehr als einmal', 'js',
   '        feldGemerkt = null;\n      }\n      aendern();', '      }\n      aendern();'],
  ['Der Keil bleibt in allen Feldern', 'js',
   "          erwFeldSetzen(seite, 'Keil', feldGemerkt.feld);", '          void 0;'],
  ['Eine Zuordnung von Hand loescht das gemerkte Feld nicht', 'js',
   '        feldGemerkt = null;\n        aendern();', '        aendern();'],
  ['Das + springt nicht mehr in die Feldzeile', 'js',
   "      : ['[data-k3d-feldwahl=\"' + m.seite + '\"] button[data-feld=\"' + m.feld + '\"]',\n         '[data-k3d-erw=\"' + m.seite + '\"] button'];",
   "      : ['[data-k3d-erw=\"' + m.seite + '\"] button'];"]
];

function baue(nr) {
  var js = JS_ORIG, html = HTML_ORIG;
  if (nr != null) {
    var f = FEHLER[nr];
    var quelle = f[1] === 'js' ? js : html;
    if (quelle.indexOf(f[2]) < 0) {
      console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    if (f[1] === 'js') js = js.replace(f[2], f[3]);
    else html = html.replace(f[2], f[3]);
  }
  return { js: js, html: html };
}

function lauf(q) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  /* ---------- Die Vorgabe: ohne Zuordnung gilt ueberall ---------- */
  p('Ohne Zuordnung gilt ein Element in allen Feldern',
    /return f === FELD_ALLE \|\| f === feldNr;/.test(q.js) &&
    /var FELD_ALLE = -1;/.test(q.js),
    'alte Konfigurationen und Links bleiben damit unveraendert');
  p('Die Vorgabe wird geloescht, nicht gespeichert',
    /if \(feld == null \|\| feld < 0\) delete Z\.erwFeld\[k\];/.test(q.js),
    'haelt den Teilen-Link kurz und "nichts eingetragen" eindeutig');
  p('Z kennt die Zuordnung',
    /^\s*erwFeld: \{\},$/m.test(q.js), 'Z.erwFeld');

  /* ---------- Das Modell baut danach ---------- */
  p('Gebaut wird, was dem Feld zugeordnet ist',
    /var liste = erwListeFeld\(seite, feldNr\);/.test(q.js),
    'eineSeite() liest die Feldliste, nicht die der ganzen Seite');
  p('Die Schiebetuerfuehrung richtet sich nach dem Feld',
    /var hatSchiebeHier = liste\.indexOf\('Schiebetür'\) > -1;/.test(q.js),
    'sonst bliebe in einem Feld ohne Schiebetuer Platz dafuer frei');

  /* ---------- Aufraeumen ---------- */
  p('Verwaiste Zuordnungen werden geloescht',
    /if \(!gilt\) delete Z\.erwFeld\[k\];/.test(q.js) &&
    /erwListe\(seite\)\.indexOf\(wert\) > -1 &&/.test(q.js),
    'abgewaehltes Element, weggefallene Seite, weggefallenes Feld');
  p('Ein weggefallenes Feld laesst das Element nicht verschwinden',
    /Z\.erwFeld\[k\] < \(FELD_ANZAHL\[seite\] \|\| 1\);/.test(q.js),
    'es faellt zurueck auf "alle Felder" - sichtbar bleiben ist sicher');

  /* ---------- Erst zaehlen, dann bauen ----------
     Sonst raeumt erwAufraeumen() mit der Feldzahl des VORIGEN Aufbaus
     auf, und ein Element waere einen Aufbau lang unsichtbar. */
  p('Die Feldzahl steht vor dem Bauen fest',
    /FELD_ANZAHL\.vorne = faecher\(achsen\) \|\| 1;[\s\S]{0,200}?erwAufraeumen\(\);[\s\S]{0,200}?felderLR\.forEach/.test(q.js),
    'zaehlen, aufraeumen, dann bauen');
  p('Nur Faecher mit lichtem Mass zaehlen',
    /if \(liste\[i \+ 1\] - PROFIL \/ 2 - \(liste\[i\] \+ PROFIL \/ 2\) > 0\) n\+\+;/.test(q.js),
    'genauso wie beim Bauen und in markenFelder()');
  p('Die Feldnummer zaehlt die Faecher, nicht die Schleife',
    /feldMitte > 0 \? -1 : 1, feldNrV\);\s*\n\s*feldNrV\+\+;/.test(q.js) &&
    /hMitte > 0 \? -1 : 1, feldNrH\);\s*\n\s*feldNrH\+\+;/.test(q.js),
    'sonst zeigt die Zuordnung auf ein Fach daneben');

  /* ---------- Der Fund vom 01.11.2026 ----------
     GEMESSEN im Browser, 7 m freistehend mit Plankenwand hinten: drei
     Aufbauten statt einem. Danach: einer. */
  var vorne = q.js.indexOf("eineSeite('vorne', vorne, feldMitte");
  var bisEnde = vorne > -1 ? q.js.slice(vorne, vorne + 1800) : '';
  p('Die Rueckseite wird nicht in der Schleife der Vorderseite gebaut',
    vorne > -1 && !/eineSeite\('hinten', hinten, feldMitte/.test(bisEnde),
    'sonst steht sie zweimal da - einmal nach fremden Faechern');
  p('Die Rueckseite hat ihre eigenen Faecher',
    /eineSeite\('hinten', hinten, hMitte, hLaenge/.test(q.js) &&
    /achsenH = \(pfostenHintenX && pfostenHintenX\.length > 1\)/.test(q.js),
    'hinten traegt der Statiktraeger, dort stehen weniger Pfosten');

  /* ---------- Teilen-Link ---------- */
  p('Der Teilen-Link traegt die Zuordnung',
    /if \(Z\.erwFeld && Object\.keys\(Z\.erwFeld\)\.length\) d\.ef = Z\.erwFeld;/.test(q.js),
    'nur wenn etwas zugeordnet ist - sonst bliebe er unnoetig lang');
  p('Ein Link ohne Zuordnung ergibt "alle Felder"',
    /Z\.erwFeld = \(d\.ef && typeof d\.ef === 'object'\) \? d\.ef : \{\};/.test(q.js),
    'jeder Link von vor dem 01.11.2026 zeigt dasselbe Bild wie damals');

  /* ---------- Lamellendach ---------- */
  p('Das Lamellendach erbt die Zuordnung nicht',
    /var merkF = Z\.erwFeld;[\s\S]{0,400}?Z\.erwFeld = \{\};[\s\S]{0,200}?seitenErweiterungen\(B, T, h, PFOSTEN, 0\);[\s\S]{0,200}?Z\.erwFeld = merkF;/.test(q.js),
    'dort gibt es keine Seitenauswahl, nur Glas oder nicht');

  /* ---------- Anfrage und Kurzfassung ---------- */
  p('Die Anfrage nennt das Feld',
    /seiten\.push\(seite \+ ': ' \+ \(l\.length \? l\.map\(function \(w\) \{\s*\n\s*return w \+ erwFeldZusatz\(seite, w\); \}\)/.test(q.js),
    'sonst bliebe offen, welches Fach welches Element bekommt');
  p('Die Anfrage nennt die Feldzahl je Seite',
    /Felder je Seite – /.test(q.js) &&
    /Feld 1 ist das linke bzw\. das hintere/.test(q.js),
    'ohne das ist "Feld 2" in der Mail nicht nachvollziehbar');
  p('Die Kurzfassung nennt das Feld',
    /if \(l\.length\) se\.push\(seite \+ ': ' \+ l\.map\(function \(w\) \{\s*\n\s*return w \+ erwFeldZusatz\(seite, w\); \}\)/.test(q.js),
    'dieselbe Schreibweise wie in der Anfrage');
  p('Bei nur einem Feld steht kein Zusatz',
    /if \(f === FELD_ALLE \|\| \(FELD_ANZAHL\[seite\] \|\| 1\) < 2\) return '';/.test(q.js),
    '"(Feld 1)" an einer ungeteilten Seite waere nur Ballast');

  /* ---------- Bedienung ---------- */
  /* GEMESSEN am 01.11.2026 von pruefe-konfigurator-oberflaeche.mjs:
     Nach dem Verkleinern von 7000 auf 3000 mm standen vorne weiter zwei
     Feldzeilen da. erwAnzeigen() laeuft in aendern() VOR bauen(), die
     Feldzahl steht aber erst waehrend des Bauens fest. */
  p('Die Feldwahl wird nach dem Bauen nachgezogen',
    /markenAufbauen\(\);[\s\S]{0,900}?erwAnzeigen\(\);\s*\n\s*neuZeichnen\(\);/.test(q.js),
    'sonst zeigt sie die Feldzahl des vorigen Aufbaus');
  p('Jede Seite hat einen Platz fuer die Feldwahl',
    ['links', 'rechts', 'vorne', 'hinten'].every(function (s) {
      return q.html.indexOf('data-k3d-feldwahl="' + s + '"') > -1;
    }), 'links, rechts, vorne, hinten');
  p('Die Feldwahl erscheint nur bei mehr als einem Feld',
    /var anzahl = FELD_ANZAHL\[seite\] \|\| 1;[\s\S]{0,400}?if \(anzahl > 1\) \{/.test(q.js),
    'bei einem Feld waere die Frage sinnlos');
  p('Die Feldwahl wird nur bei Aenderung neu gebaut',
    /if \(kasten\.getAttribute\('data-stand'\) !== stand\) \{/.test(q.js),
    'sonst verliert ein Knopf unter dem Finger den Fokus');
  p('Der Stand der Feldwahl wird immer nachgezogen',
    /b\.classList\.toggle\('is-active', an\);/.test(q.js),
    'sonst bliebe nach dem Klick der alte Knopf golden');
  /* ---------- Der Fehler, den die Quelltextpruefung NICHT gesehen hat ----------
     Mit EINER Abfrage „Feldzeile, sonst Elementknopf" landete der
     Sprung immer auf einem Elementknopf: querySelectorAll liefert in
     der Reihenfolge des DOKUMENTS, nicht in der der Abfrage, und die
     Feldzeilen stehen unter den Elementknoepfen. Die alte Pruefung hat
     nachgelesen, dass die Abfrage dasteht - nicht, wohin sie fuehrt.
     Gefunden hat es erst der Browserlauf. */
  p('Die Sprungziele werden nacheinander gefragt',
    /var wahlen = \(m\.art === 'dach'\)/.test(q.js) &&
    /for \(var w = 0; w < wahlen\.length; w\+\+\) \{/.test(q.js),
    'sonst entscheidet die Reihenfolge im Dokument, nicht die Absicht');

  /* ---------- Das + bedient sein Feld ----------
     „bedient ueber das + im Feld" (Entscheidung des Betreibers,
     01.11.2026). Nur zu springen reicht nicht: Wer auf das + im zweiten
     Fach tippt und dann „Plankenwand" waehlt, meint sie IN DIESEM FACH. */
  p('Das + merkt sich sein Feld',
    /feldGemerkt = \(m\.art === 'seite' && \(FELD_ANZAHL\[m\.seite\] \|\| 1\) > 1\)/.test(q.js),
    'nur wenn die Seite ueberhaupt mehrere Felder hat');
  p('Ein neu gewaehltes Element landet im gemerkten Feld',
    /if \(!vorher && jetzt && feldGemerkt && feldGemerkt\.seite === seite\) \{/.test(q.js) &&
    /erwFeldSetzen\(seite, wert, feldGemerkt\.feld\);/.test(q.js),
    'nur beim Hinzufuegen, nicht beim Abwaehlen');
  p('Das gemerkte Feld gilt nur einmal',
    /erwFeldSetzen\(seite, wert, feldGemerkt\.feld\);[\s\S]{0,500}?feldGemerkt = null;/.test(q.js),
    'sonst landete auch eine viel spaetere Auswahl noch in diesem Fach');
  p('Der Keil folgt seinem Element ins Feld',
    /erwFeldSetzen\(seite, 'Keil', feldGemerkt\.feld\);/.test(q.js),
    'sonst saesse die Wand in einem Fach und ihr Keil ueber beiden');
  p('Eine Zuordnung von Hand loescht das gemerkte Feld',
    /feldGemerkt = null;\s*\n\s*aendern\(\);/.test(q.js),
    'wer selbst zuordnet, hat die Frage beantwortet');

  p('Das + springt in die Zeile seines Feldes',
    /\['\[data-k3d-feldwahl="' \+ m\.seite \+ '"\] button\[data-feld="' \+ m\.feld \+ '"\]',/.test(q.js) &&
    /'\[data-k3d-erw="' \+ m\.seite \+ '"\] button'\];/.test(q.js),
    'mit Rueckfall auf die Elementknoepfe, wenn es noch nichts zuzuordnen gibt');

  return e;
}

if (!gegen) {
  console.log('\nZuordnung Element -> Feld');
  var erg = lauf(baue(null)), rot = 0;
  erg.forEach(function (x) {
    console.log((x.ok ? '  ok      ' : '  FEHLER  ') + x.name + '   ' + x.beleg);
    if (!x.ok) rot++;
  });
  console.log('\nErgebnis: ' + (erg.length - rot) + ' bestanden, ' + rot + ' nicht bestanden');
  process.exit(rot === 0 ? 0 : 1);
}

console.log('\nGegenprobe: jeder eingebaute Fehler einzeln\n');
var namen = lauf(baue(null)).map(function (x) { return x.name; });
var erwischt = namen.map(function () { return []; });
var ohneWirkung = [];
FEHLER.forEach(function (f, nr) {
  var e = lauf(baue(nr)), n = 0;
  e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(f[0]); n++; } });
  console.log('  Fehler "' + f[0] + '": ' + n + ' Pruefung(en) schlagen an');
  if (n === 0) { ohneWirkung.push(f[0]); console.log('    ACHTUNG: Dieser Fehler faellt niemandem auf.'); }
});
console.log('');
var blind = [];
namen.forEach(function (name, i) {
  if (erwischt[i].length === 0) { blind.push(name); console.log('  BLIND   ' + name); }
  else console.log('  scharf  ' + name + '   (durch: ' + erwischt[i].join(', ') + ')');
});
console.log('\nErgebnis: ' + (namen.length - blind.length) + ' von ' + namen.length +
            ' Pruefungen schlagen an, ' + (FEHLER.length - ohneWirkung.length) +
            ' von ' + FEHLER.length + ' Fehlern werden bemerkt');
if (blind.length || ohneWirkung.length) { console.log('GEGENPROBE FEHLGESCHLAGEN.'); process.exit(1); }
console.log('Gegenprobe in Ordnung.');
process.exit(0);
