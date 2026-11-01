#!/usr/bin/env node
/* Prueft die Bedienung je Fach: was steht in welchem Fach einer Seite.
 *
 * ANLASS. „bei dieser terassengroesse sind es zwei felder vorne wie man
 * auf screenshots sieht, man kann aber nur die stirnseite komplett
 * bearbeiten und nicht pro feld, also planken etc." (Betreiber,
 * 01.11.2026).
 *
 * ZWEITE FASSUNG, am selben Tag. Die erste war „etwas verwirrend und
 * kompliziert" (Betreiber): Auswahl fuer die ganze Seite, darunter eine
 * Zeile zum Korrigieren, und ein +, das sich unsichtbar ein Fach
 * merkte - zwei Wege fuer dieselbe Sache, einer davon unsichtbar, dazu
 * Nummern („Feld 1"), die nichts sagen. Jetzt bekommt jedes Fach einen
 * eigenen Block mit eigenen Knoepfen und einem NAMEN („rechtes Fach").
 *
 * DER WUNDE PUNKT ist die VORGABE. Steht keine Zuordnung da, muss ein
 * Element in ALLEN Faechern erscheinen - sonst verschwindet jede
 * bestehende Konfiguration, jeder alte Teilen-Link und jede Anlage mit
 * nur einem Fach aus dem Modell.
 *
 * DAZU EIN FUND vom selben Tag: Die Rueckseite wurde DREIMAL gebaut -
 * zweimal nach den Faechern der Vorderseite, einmal nach den eigenen.
 * Gemessen im Browser bei 7 m freistehend mit Plankenwand hinten.
 *
 * WAS HIER NICHT GEPRUEFT WERDEN KANN: wohin ein Klick wirklich fuehrt.
 * Das entscheidet der Browser (Reihenfolge im DOM, Sichtbarkeit, Fokus),
 * und genau dort steckte der Fehler, den diese Pruefung am 01.11.2026
 * nicht gesehen hat. Dafuer gibt es Pruefungen in
 * scripts/pruefe-konfigurator-oberflaeche.mjs, die wirklich tippen.
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
  /* ---------- Vorgabe und Datenmodell ---------- */
  ['Ohne Zuordnung gilt ein Element nur im ersten Fach', 'js',
   '    return f === FELD_ALLE || f.indexOf(feldNr) > -1;',
   '    return f.indexOf(feldNr) > -1;'],
  ['"In allen Faechern" wird gespeichert statt geloescht', 'js',
   '        (anzahl && faecher.length >= anzahl)) { delete Z.erwFeld[k]; return; }',
   '        (false)) { delete Z.erwFeld[k]; return; }'],
  ['Ein alter Link mit einer einzelnen Zahl wird nicht mehr gelesen', 'js',
   "    return (typeof v === 'number') ? [v] : v;", '    return v;'],
  ['Z kennt die Zuordnung nicht', 'js', '    erwFeld: {},', '    erwFeldAlt: {},'],
  ['Ein Fach abzuwaehlen nimmt das Element ueberall weg', 'js',
   '      for (var i = 0; i < anzahl; i++) if (i !== feldNr) liste.push(i);',
   '      liste = [];'],
  ['Verwaiste Zuordnungen bleiben stehen', 'js',
   '        if (!gilt) { delete Z.erwFeld[k]; return; }', '        void gilt;'],
  ['Ein weggefallenes Fach laesst das Element verschwinden', 'js',
   '          return n >= 0 && n < anzahl; }), anzahl);',
   '          return true; }), anzahl);'],

  /* ---------- Das Modell baut danach ---------- */
  ['Die Fachliste wird beim Bauen nicht benutzt', 'js',
   '      var liste = erwListeFeld(seite, feldNr);', '      var liste = erwListe(seite);'],
  ['Die Schiebetuerfuehrung richtet sich nach der ganzen Seite', 'js',
   "      var hatSchiebeHier = liste.indexOf('Schiebetür') > -1;",
   "      var hatSchiebeHier = erwListe(seite).indexOf('Schiebetür') > -1;"],

  /* ---------- Erst zaehlen, dann bauen ---------- */
  ['Die Fachzahl wird erst nach dem Bauen bestimmt', 'js',
   '    FELD_ANZAHL.vorne = faecher(achsen) || 1;', '    void faecher;'],
  ['Faecher ohne lichtes Mass werden mitgezaehlt', 'js',
   '        if (liste[i + 1] - PROFIL / 2 - (liste[i] + PROFIL / 2) > 0) n++;',
   '        n++;'],
  ['Die Fachnummer folgt wieder der Schleife statt den Faechern', 'js',
   "                feldMitte > 0 ? -1 : 1, feldNrV);\n      feldNrV++;",
   "                feldMitte > 0 ? -1 : 1, f);"],
  ['Hinten zaehlt wieder die Schleife', 'js',
   "                  hMitte > 0 ? -1 : 1, feldNrH);\n        feldNrH++;",
   "                  hMitte > 0 ? -1 : 1, fh);"],
  ['Die Rueckseite wird wieder doppelt gebaut', 'js',
   "      feldNrV++;",
   "      feldNrV++;\n      if (rueckseiteOffen()) {\n        eineSeite('hinten', hinten, feldMitte, feldLaenge, false,\n                  feldMitte > 0 ? -1 : 1, feldNrV);\n      }"],
  ['Die Rueckseite hat keine eigenen Faecher mehr', 'js',
   "        eineSeite('hinten', hinten, hMitte, hLaenge, false,",
   "        void eineSeite || (function () {})('hinten', hinten, hMitte, hLaenge, false,"],
  ['Die Faecher werden nach dem Bauen nicht nachgezogen', 'js',
   '    erwAnzeigen();\n    neuZeichnen();', '    neuZeichnen();'],

  /* ---------- Namen statt Nummern ---------- */
  ['Die Faecher tragen wieder Nummern statt Namen', 'js',
   "      return (laengs ? ['hinteres Fach', 'vorderes Fach']",
   "      return (laengs ? ['Feld 1', 'Feld 2']"],
  ['Laengsseiten und Stirnseiten bekommen dieselben Namen', 'js',
   "                     : ['rechtes Fach', 'linkes Fach'])[i];",
   "                     : ['hinteres Fach', 'vorderes Fach'])[i];"],
  ['Bei einem Fach wird trotzdem ein Name vergeben', 'js',
   "    if (!anzahl || anzahl < 2) return '';", "    if (false) return '';"],
  ['Der Zusatz steht auch bei nur einem Fach', 'js',
   "    if (f === FELD_ALLE || anzahl < 2) return '';",
   "    if (f === FELD_ALLE) return '';"],

  /* ---------- Ein Block je Fach ---------- */
  ['Die Faecherbloecke erscheinen auch bei einem Fach', 'js',
   "      var html = '';\n      if (anzahl > 1) {",
   "      var html = '';\n      if (anzahl > 0) {"],
  ['Die Reihe fuer die ganze Seite bleibt daneben stehen', 'js',
   '    if (reihe) reihe.hidden = anzahl > 1;', '    if (reihe) reihe.hidden = false;'],
  ['Die Bloecke werden bei jeder Aenderung neu gebaut (Fokus weg)', 'js',
   "    if (kasten.getAttribute('data-stand') !== stand) {", '    if (true) {'],
  /* MIT DER VORZEILE: "b.classList.toggle('is-active', drin)" steht
     auch in der Reihe fuer die ganze Seite. Ohne eindeutigen Anker
     wuerde dort beschaedigt und diese Pruefung bliebe gruen. */
  ['Der Stand der Faecher wird nicht nachgezogen', 'js',
   "        var drin = imFach.indexOf(wert) > -1;\n        b.classList.toggle('is-active', drin);",
   "        var drin = imFach.indexOf(wert) > -1;\n        void drin;"],
  ['Die Namensfunktion ist nicht mehr auffindbar', 'js',
   '  function feldName(seite, i, anzahl) {', '  function feldNamen(seite, i, anzahl) {'],
  ['Bei drei Faechern fehlt das mittlere', 'js',
   "      return (laengs ? ['hinteres Fach', 'mittleres Fach', 'vorderes Fach']",
   "      return (laengs ? ['hinteres Fach', 'zweites Fach', 'vorderes Fach']"],
  ['Bei vielen Faechern wird von der falschen Seite gezaehlt', 'js',
   "    return (i + 1) + '. Fach von ' + (laengs ? 'hinten' : 'rechts');",
   "    return (i + 1) + '. Fach von ' + (laengs ? 'vorne' : 'links');"],
  ['Die Stirnseiten tragen wieder Nummern', 'js',
   "                     : ['rechtes Fach', 'linkes Fach'])[i];",
   "                     : ['Feld 1', 'Feld 2'])[i];"],
  ['Das + merkt sich wieder ein Fach', 'js',
   '  function markeSpringen(m) {',
   '  var feldGemerkt = null;\n  function markeSpringen(m) {'],
  ['Unvertraegliches wird ueber die ganze Seite geprueft', 'js',
   '        var blocker = drin ? null : erwBlocker(wert, imFach);',
   '        var blocker = drin ? null : erwBlocker(wert, erwListe(seite));'],
  ['Ein neues Element landet in allen Faechern', 'js',
   '          erwFeldSetzen(seite, wert, [nr], anzahl);', '          void nr;'],
  ['Der Keil bleibt in allen Faechern', 'js',
   "            erwFeldSetzen(seite, 'Keil', [nr], anzahl);", '            void 0;'],
  ['Das letzte Fach abzuwaehlen laesst das Element stehen', 'js',
   '        } else if (!erwFeldUmschalten(seite, wert, nr, anzahl)) {',
   '        } else if (false) {'],
  ['Ein gesperrter Knopf wirkt trotzdem', 'js',
   '        if (!b || b === kasten || b.disabled) return;',
   '        if (!b || b === kasten) return;'],
  ['Der Platz fuer die Faecher fehlt in der Seite', 'html',
   '<div class="k3d-feldwahl" data-k3d-feldwahl="vorne"></div>', ''],

  /* ---------- Teilen-Link, Lamellendach, Anfrage ---------- */
  ['Der Teilen-Link vergisst die Zuordnung', 'js',
   '    if (Z.erwFeld && Object.keys(Z.erwFeld).length) d.ef = Z.erwFeld;',
   '    void 0;'],
  ['Der Teilen-Link liest die Zuordnung nicht zurueck', 'js',
   "    Z.erwFeld = (d.ef && typeof d.ef === 'object') ? d.ef : {};",
   '    void 0;'],
  ['Das Lamellendach erbt die Zuordnung des Terrassendachs', 'js',
   '      Z.erwFeld = {};\n      seitenErweiterungen(B, T, h, PFOSTEN, 0);',
   '      seitenErweiterungen(B, T, h, PFOSTEN, 0);'],
  ['Die Anfrage nennt das Fach nicht', 'js',
   "        seiten.push(seite + ': ' + (l.length ? l.map(function (w) {\n          return w + erwFeldZusatz(seite, w); }).join(' + ') : 'offen'));",
   "        seiten.push(seite + ': ' + (l.length ? l.join(' + ') : 'offen'));"],
  ['Die Anfrage nennt die Fachzahl nicht', 'js',
   "        teile.push('Faecher je Seite – ' + erwSeiten().map(function (seite) {",
   "        void 0 || (function () {})('Faecher je Seite ' + erwSeiten().map(function (seite) {"],
  ['Die Kurzfassung nennt das Fach nicht', 'js',
   "        if (l.length) se.push(seite + ': ' + l.map(function (w) {\n          return w + erwFeldZusatz(seite, w); }).join(' + '));",
   "        if (l.length) se.push(seite + ': ' + l.join(' + '));"],
  ['Das + springt nicht mehr in den Fachblock', 'js',
   "      : ['[data-k3d-feldwahl=\"' + m.seite + '\"] [data-fach=\"' + m.feld + '\"] button',\n         '[data-k3d-erw=\"' + m.seite + '\"] button'];",
   "      : ['[data-k3d-erw=\"' + m.seite + '\"] button'];"],
  ['Die Sprungziele werden wieder in EINER Abfrage gesucht', 'js',
   "    var wahlen = (m.art === 'dach')",
   "    var wahlen = [].concat((m.art === 'dach')"]
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
  /* feldName() wird herausgeschnitten und AUSGEFUEHRT - die Namen sind
     der Kern dieser Fassung, und ein falsch herum benanntes Fach faellt
     im Quelltext nicht auf. */
  var a = js.match(/function feldName\([\s\S]*?\n  \}/);
  var name = null;
  try {
    if (a) name = new Function('return (' + a[0].replace('function feldName', 'function') + ');')();
  } catch (e) { name = null; }
  return { js: js, html: html, name: name };
}

function lauf(q) {
  var e = [];
  function p(nm, bed, beleg) { e.push({ name: nm, ok: !!bed, beleg: beleg }); }

  /* ---------- Die Namen der Faecher ----------
     AUSGEFUEHRT, nicht nachgelesen. Die Reihenfolge kommt aus dem
     Bauen: Vorne laufen die Faecher nach steigendem x, und +x ist in
     diesem Modell die LINKE Seite - Fach 0 liegt also rechts. An den
     Laengsseiten laufen sie von der Wand nach vorne. */
  if (!q.name) {
    p('feldName() laesst sich ausfuehren', false, 'nicht gefunden oder nicht lauffaehig');
  } else {
    p('feldName() laesst sich ausfuehren', true, 'aus js/konfigurator-3d.js herausgeschnitten');
    p('Bei einem Fach gibt es keinen Namen',
      q.name('vorne', 0, 1) === '', '"' + q.name('vorne', 0, 1) + '"');
    p('Vorne heisst Fach 0 rechts und Fach 1 links',
      q.name('vorne', 0, 2) === 'rechtes Fach' && q.name('vorne', 1, 2) === 'linkes Fach',
      q.name('vorne', 0, 2) + ' / ' + q.name('vorne', 1, 2));
    p('An den Laengsseiten heisst Fach 0 hinten',
      q.name('links', 0, 2) === 'hinteres Fach' && q.name('links', 1, 2) === 'vorderes Fach',
      q.name('links', 0, 2) + ' / ' + q.name('links', 1, 2));
    p('Bei drei Faechern gibt es ein mittleres',
      q.name('vorne', 1, 3) === 'mittleres Fach' && q.name('links', 1, 3) === 'mittleres Fach',
      q.name('vorne', 0, 3) + ' / ' + q.name('vorne', 1, 3) + ' / ' + q.name('vorne', 2, 3));
    p('Bei mehr als drei Faechern wird von der benannten Seite gezaehlt',
      /^1\. Fach von rechts$/.test(q.name('vorne', 0, 4)) &&
      /^1\. Fach von hinten$/.test(q.name('links', 0, 4)),
      q.name('vorne', 0, 4) + ' / ' + q.name('links', 0, 4));
    p('Kein Fach heisst "Feld 1"',
      ['vorne', 'hinten', 'links', 'rechts'].every(function (seite) {
        return [2, 3, 4].every(function (n) {
          for (var i = 0; i < n; i++) {
            if (/^Feld \d/.test(q.name(seite, i, n))) return false;
          }
          return true;
        });
      }), 'Nummern sagen nicht, welches Fach gemeint ist');
  }

  /* ---------- Vorgabe: ohne Zuordnung gilt ueberall ---------- */
  p('Ohne Zuordnung gilt ein Element in allen Faechern',
    /return f === FELD_ALLE \|\| f\.indexOf\(feldNr\) > -1;/.test(q.js) &&
    /var FELD_ALLE = -1;/.test(q.js),
    'alte Konfigurationen und Links bleiben damit unveraendert');
  p('"In allen Faechern" wird geloescht, nicht gespeichert',
    /\(anzahl && faecher\.length >= anzahl\)\) \{ delete Z\.erwFeld\[k\]; return; \}/.test(q.js),
    'haelt den Teilen-Link kurz und "nichts eingetragen" eindeutig');
  p('Ein Link mit einer einzelnen Zahl wird noch gelesen',
    /return \(typeof v === 'number'\) \? \[v\] : v;/.test(q.js),
    'Links vom Vormittag des 01.11.2026 tragen noch eine Zahl');
  p('Z kennt die Zuordnung', /^\s*erwFeld: \{\},$/m.test(q.js), 'Z.erwFeld');
  p('Ein Fach abzuwaehlen laesst die anderen stehen',
    /for \(var i = 0; i < anzahl; i\+\+\) if \(i !== feldNr\) liste\.push\(i\);/.test(q.js),
    'aus "ueberall" wird "ueberall ausser hier", nicht "nirgends"');

  /* ---------- Das Modell baut danach ---------- */
  p('Gebaut wird, was dem Fach zugeordnet ist',
    /var liste = erwListeFeld\(seite, feldNr\);/.test(q.js),
    'eineSeite() liest die Fachliste, nicht die der ganzen Seite');
  p('Die Schiebetuerfuehrung richtet sich nach dem Fach',
    /var hatSchiebeHier = liste\.indexOf\('Schiebetür'\) > -1;/.test(q.js),
    'sonst bliebe in einem Fach ohne Schiebetuer Platz dafuer frei');

  /* ---------- Aufraeumen ---------- */
  p('Verwaiste Zuordnungen werden geloescht',
    /if \(!gilt\) \{ delete Z\.erwFeld\[k\]; return; \}/.test(q.js),
    'abgewaehltes Element, weggefallene Seite');
  p('Ein weggefallenes Fach laesst das Element nicht verschwinden',
    /return n >= 0 && n < anzahl; \}\), anzahl\);/.test(q.js),
    'bleibt nichts uebrig, gilt wieder "alle Faecher"');

  /* ---------- Erst zaehlen, dann bauen ---------- */
  p('Die Fachzahl steht vor dem Bauen fest',
    /FELD_ANZAHL\.vorne = faecher\(achsen\) \|\| 1;[\s\S]{0,200}?erwAufraeumen\(\);[\s\S]{0,200}?felderLR\.forEach/.test(q.js),
    'zaehlen, aufraeumen, dann bauen');
  p('Nur Faecher mit lichtem Mass zaehlen',
    /if \(liste\[i \+ 1\] - PROFIL \/ 2 - \(liste\[i\] \+ PROFIL \/ 2\) > 0\) n\+\+;/.test(q.js),
    'genauso wie beim Bauen und in markenFelder()');
  p('Die Fachnummer zaehlt die Faecher, nicht die Schleife',
    /feldMitte > 0 \? -1 : 1, feldNrV\);\s*\n\s*feldNrV\+\+;/.test(q.js) &&
    /hMitte > 0 \? -1 : 1, feldNrH\);\s*\n\s*feldNrH\+\+;/.test(q.js),
    'sonst zeigt die Zuordnung auf ein Fach daneben');
  p('Die Faecher werden nach dem Bauen nachgezogen',
    /markenAufbauen\(\);[\s\S]{0,900}?erwAnzeigen\(\);\s*\n\s*neuZeichnen\(\);/.test(q.js),
    'sonst zeigen sie die Fachzahl des vorigen Aufbaus');

  /* ---------- Der Fund vom 01.11.2026 ---------- */
  var vorne = q.js.indexOf("eineSeite('vorne', vorne, feldMitte");
  var bisEnde = vorne > -1 ? q.js.slice(vorne, vorne + 1800) : '';
  p('Die Rueckseite wird nicht in der Schleife der Vorderseite gebaut',
    vorne > -1 && !/eineSeite\('hinten', hinten, feldMitte/.test(bisEnde),
    'sonst steht sie zweimal da - einmal nach fremden Faechern');
  p('Die Rueckseite hat ihre eigenen Faecher',
    /eineSeite\('hinten', hinten, hMitte, hLaenge/.test(q.js) &&
    /achsenH = \(pfostenHintenX && pfostenHintenX\.length > 1\)/.test(q.js),
    'hinten traegt der Statiktraeger, dort stehen weniger Pfosten');

  /* ---------- Ein Block je Fach ----------
     „grunglegen klappt es aber die umsetzung ist etwas verwirrend und
     kompliziert" (Betreiber). Verworfen: Auswahl fuer die Seite plus
     Korrekturzeile plus ein +, das sich unsichtbar ein Fach merkte. */
  p('Bei mehreren Faechern gibt es je Fach einen Block',
    /var html = '';\s*\n\s*if \(anzahl > 1\) \{/.test(q.js) &&
    /class="k3d-fach" data-fach="/.test(q.js),
    'mit denselben Knoepfen wie die Seite');
  p('Die Reihe fuer die ganze Seite wird dann ausgeblendet',
    /if \(reihe\) reihe\.hidden = anzahl > 1;/.test(q.js),
    'sonst waeren es wieder zwei Wege fuer dieselbe Sache');
  p('Das + merkt sich nichts mehr',
    q.js.indexOf('feldGemerkt') === -1,
    'ein unsichtbarer zweiter Weg war der Kern der Verwirrung');
  p('Die Bloecke werden nur bei Aenderung neu gebaut',
    /if \(kasten\.getAttribute\('data-stand'\) !== stand\) \{/.test(q.js),
    'sonst verliert ein Knopf unter dem Finger den Fokus');
  /* MIT DEM FACH-KONTEXT: Dieselbe Zeile steht auch in der Reihe fuer
     die ganze Seite. Ohne Kontext bliebe die Pruefung gruen, wenn die
     Faecherbloecke ihren Stand nicht mehr nachziehen. */
  p('Der Stand der Faecher wird immer nachgezogen',
    /var drin = imFach\.indexOf\(wert\) > -1;\s*\n\s*b\.classList\.toggle\('is-active', drin\);/.test(q.js),
    'sonst bliebe nach dem Klick der alte Knopf golden');
  p('Unvertraegliches wird JE FACH geprueft',
    /var blocker = drin \? null : erwBlocker\(wert, imFach\);/.test(q.js),
    'Plankenwand im einen und Rahmenwand im anderen Fach stoeren einander nicht');
  p('Ein neu gewaehltes Element landet nur in seinem Fach',
    /erwFeldSetzen\(seite, wert, \[nr\], anzahl\);/.test(q.js),
    'gewaehlt wird dort, wo es hingehoert');
  p('Der Keil folgt seinem Element ins Fach',
    /erwFeldSetzen\(seite, 'Keil', \[nr\], anzahl\);/.test(q.js),
    'sonst saesse die Wand in einem Fach und ihr Keil ueber beiden');
  p('Das letzte Fach abzuwaehlen nimmt das Element ganz weg',
    /\} else if \(!erwFeldUmschalten\(seite, wert, nr, anzahl\)\) \{[\s\S]{0,200}?erwUmschalten\(seite, wert\);/.test(q.js),
    'sonst bliebe es in der Seitenliste stehen, ohne irgendwo zu sitzen');
  p('Ein gesperrter Knopf wirkt nicht',
    /if \(!b \|\| b === kasten \|\| b\.disabled\) return;/.test(q.js),
    'disabled allein reicht bei einem Zuhoerer am Kasten nicht');
  p('Jede Seite hat einen Platz fuer die Faecher',
    ['links', 'rechts', 'vorne', 'hinten'].every(function (s) {
      return q.html.indexOf('data-k3d-feldwahl="' + s + '"') > -1;
    }), 'links, rechts, vorne, hinten');

  /* ---------- Teilen-Link ---------- */
  p('Der Teilen-Link traegt die Zuordnung',
    /if \(Z\.erwFeld && Object\.keys\(Z\.erwFeld\)\.length\) d\.ef = Z\.erwFeld;/.test(q.js),
    'nur wenn etwas zugeordnet ist - sonst bliebe er unnoetig lang');
  p('Ein Link ohne Zuordnung ergibt "alle Faecher"',
    /Z\.erwFeld = \(d\.ef && typeof d\.ef === 'object'\) \? d\.ef : \{\};/.test(q.js),
    'jeder aeltere Link zeigt dasselbe Bild wie damals');

  /* ---------- Lamellendach ---------- */
  p('Das Lamellendach erbt die Zuordnung nicht',
    /var merkF = Z\.erwFeld;[\s\S]{0,400}?Z\.erwFeld = \{\};[\s\S]{0,200}?seitenErweiterungen\(B, T, h, PFOSTEN, 0\);[\s\S]{0,200}?Z\.erwFeld = merkF;/.test(q.js),
    'dort gibt es keine Seitenauswahl, nur Glas oder nicht');

  /* ---------- Anfrage und Kurzfassung ---------- */
  p('Die Anfrage nennt das Fach',
    /seiten\.push\(seite \+ ': ' \+ \(l\.length \? l\.map\(function \(w\) \{\s*\n\s*return w \+ erwFeldZusatz\(seite, w\); \}\)/.test(q.js),
    'sonst bliebe offen, welches Fach welches Element bekommt');
  p('Die Anfrage nennt die Fachzahl je Seite',
    /Faecher je Seite – /.test(q.js) &&
    !/Feld 1 ist das linke/.test(q.js),
    'die Zahl ja, der alte Erklaersatz nicht mehr');
  p('Die Kurzfassung nennt das Fach',
    /if \(l\.length\) se\.push\(seite \+ ': ' \+ l\.map\(function \(w\) \{\s*\n\s*return w \+ erwFeldZusatz\(seite, w\); \}\)/.test(q.js),
    'dieselbe Schreibweise wie in der Anfrage');
  p('Bei nur einem Fach steht kein Zusatz',
    /if \(f === FELD_ALLE \|\| anzahl < 2\) return '';/.test(q.js),
    'ein Zusatz an einer ungeteilten Seite waere nur Ballast');

  /* ---------- Das Sprungziel ---------- */
  p('Die Sprungziele werden nacheinander gefragt',
    /var wahlen = \(m\.art === 'dach'\)/.test(q.js) &&
    /for \(var w = 0; w < wahlen\.length; w\+\+\) \{/.test(q.js),
    'sonst entscheidet die Reihenfolge im Dokument, nicht die Absicht');
  p('Das + springt in den Block seines Fachs',
    /\['\[data-k3d-feldwahl="' \+ m\.seite \+ '"\] \[data-fach="' \+ m\.feld \+ '"\] button',/.test(q.js) &&
    /'\[data-k3d-erw="' \+ m\.seite \+ '"\] button'\];/.test(q.js),
    'mit Rueckfall auf die Seitenreihe, wenn es nur ein Fach gibt');

  return e;
}

if (!gegen) {
  console.log('\nBedienung je Fach');
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
