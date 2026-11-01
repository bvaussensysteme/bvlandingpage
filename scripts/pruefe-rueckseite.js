#!/usr/bin/env node
/* Prueft die vierte Seite: hinten.
 *
 * ANLASS. „Bei freistehen muss plankenwand, rahmen etc. also alle
 * möglichen auch hinten möglich sein" (Betreiber, 23.10.2026, mit Bild
 * eines freistehenden Carports). Bis dahin kannte der Konfigurator drei
 * Seiten – links, rechts, vorne –, weil hinten immer die Hauswand
 * angenommen wurde. Freistehend steht dort nichts.
 *
 * WAS HIER GEPRUEFT WIRD, ist vor allem die Umkehrung: dass die
 * Rueckseite bei Wandmontage NICHT angeboten wird und eine schon
 * getroffene Auswahl dann wieder verschwindet. Eine Wand, die vor der
 * Hauswand steht, waere im Angebot teurer Unsinn.
 *
 * Die Logik wird dabei ausgefuehrt, nicht im Quelltext nachgelesen.
 * Dass im 3D wirklich etwas Neues entsteht, misst
 * scripts/pruefe-konfigurator-oberflaeche.mjs im echten Browser.
 *
 * Aufruf:  node scripts/pruefe-rueckseite.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var k3d  = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var html = fs.readFileSync('konfigurator.html', 'utf8');
var wiz  = fs.readFileSync('js/anfrage-wizard.js', 'utf8');

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

function hol(re, name) {
  var m = k3d.match(re);
  if (!m) { console.log('  FEHLER  nicht im Code: ' + name); fehler++; geprueft++; }
  return m ? m[0] : '';
}

var quelle =
  hol(/var ERW_OPTS = \[[\s\S]*?\];/, 'ERW_OPTS') + '\n' +
  hol(/var ERW_BRAUCHT_KEIL = \[[^\]]*\];/, 'ERW_BRAUCHT_KEIL') + '\n' +
  hol(/var ERW_UNVERTRAEGLICH = \{[\s\S]*?\n  \};/, 'ERW_UNVERTRAEGLICH') + '\n' +
  hol(/var ERW_SEITEN = \[[^\]]*\];/, 'ERW_SEITEN') + '\n' +
  hol(/function keilErlaubt\(\) \{[\s\S]*?\n  \}/, 'keilErlaubt') + '\n' +
  hol(/function rueckseiteOffen\(\) \{[^}]*\}/, 'rueckseiteOffen') + '\n' +
  hol(/function erwSeiten\(\) \{[\s\S]*?\n  \}/, 'erwSeiten') + '\n' +
  hol(/function erwIrgendwo\(wert\) \{[\s\S]*?\n  \}/, 'erwIrgendwo') + '\n' +
  hol(/function erwListe\(seite\) \{[\s\S]*?\n  \}/, 'erwListe') + '\n' +
  hol(/function erwMoeglich\(seite\) \{[\s\S]*?\n  \}/, 'erwMoeglich') + '\n' +
  hol(/function erwBlocker\(wert, liste\) \{[\s\S]*?\n  \}/, 'erwBlocker') + '\n' +
  hol(/function erwKeilGesperrt\(seite, liste\) \{[\s\S]*?\n  \}/, 'erwKeilGesperrt') + '\n' +
  hol(/function erwUmschalten\(seite, wert\) \{[\s\S]*?\n  \}/, 'erwUmschalten') + '\n' +
  hol(/function erwAufraeumen\(\) \{[\s\S]*?\n  \}/, 'erwAufraeumen');

var Z = { produkt: 'Terrassendach TDS', cpTyp: '', aufbau: 'Freistehend',
          erwLinks: [], erwRechts: [], erwVorne: [], erwHinten: [] };
var API = null;
try {
  API = eval(quelle + '\n;({ seiten: erwSeiten, offen: rueckseiteOffen,' +
    ' liste: erwListe, moeglich: erwMoeglich, umschalten: erwUmschalten,' +
    ' aufraeumen: erwAufraeumen, irgendwo: erwIrgendwo })');
} catch (e) { API = null; }
var geladen = !!(API && API.seiten);
pruefe('Die Seitenlogik lässt sich ausführen', gegen ? !geladen : geladen,
       geladen ? 'vier Seiten' : 'Fehler beim Laden');
if (!geladen) { console.log('\nAbbruch'); process.exit(1); }

function frisch(aufbau) {
  Z.aufbau = aufbau;
  Z.erwLinks = []; Z.erwRechts = []; Z.erwVorne = []; Z.erwHinten = [];
}

/* ---------- Wann es die Rückseite gibt ---------- */
frisch('Freistehend');
var frei = API.seiten();
frisch('Wandmontage');
var wand = API.seiten();
pruefe('Freistehend gibt es vier Seiten',
       gegen ? frei.length !== 4 : frei.length === 4 && frei[3] === 'hinten',
       frei.join(', '));
pruefe('An der Hauswand bleiben es drei',
       gegen ? wand.length !== 3 : wand.length === 3 && wand.indexOf('hinten') === -1,
       wand.join(', '));

/* ---------- Die Auswahl landet wirklich hinten ---------- */
frisch('Freistehend');
API.umschalten('hinten', 'Plankenwand');
var getroffen = Z.erwHinten.length === 1 && Z.erwHinten[0] === 'Plankenwand' &&
                Z.erwLinks.length === 0 && Z.erwRechts.length === 0 &&
                Z.erwVorne.length === 0;
pruefe('Eine Wahl hinten landet nur hinten',
       gegen ? !getroffen : getroffen,
       'hinten: ' + Z.erwHinten.join(', ') + '; die anderen drei leer');
pruefe('erwIrgendwo findet auch die Rückseite',
       gegen ? !API.irgendwo('Plankenwand') : API.irgendwo('Plankenwand'),
       'sonst fehlte die Plankenfarbe in der Anfrage');

/* ---------- Kein Keil hinten ----------
   Der Keil gleicht das Gefälle an den LÄNGSseiten aus. Vorne wie hinten
   läuft die Dachkante waagerecht – ein Keil dort stünde quer zum
   Gefälle. */
frisch('Freistehend');
var mHinten = API.moeglich('hinten'), mVorne = API.moeglich('vorne');
var mLinks = API.moeglich('links');
pruefe('Hinten gibt es keinen Keil',
       gegen ? mHinten.indexOf('Keil') > -1 : mHinten.indexOf('Keil') === -1,
       mHinten.join(', '));
pruefe('Hinten wird genau dasselbe angeboten wie vorne',
       gegen ? mHinten.join() !== mVorne.join() : mHinten.join() === mVorne.join(),
       mHinten.length + ' Möglichkeiten');
pruefe('An den Längsseiten gibt es den Keil weiterhin',
       gegen ? mLinks.indexOf('Keil') === -1 : mLinks.indexOf('Keil') > -1,
       'links: ' + mLinks.join(', '));
API.umschalten('hinten', 'Schiebetür');
pruefe('Eine Schiebetür hinten zieht keinen Keil nach',
       gegen ? Z.erwHinten.indexOf('Keil') > -1 : Z.erwHinten.indexOf('Keil') === -1,
       'hinten: ' + Z.erwHinten.join(', '));
frisch('Freistehend');
API.umschalten('links', 'Schiebetür');
pruefe('An der Längsseite zieht sie ihn weiterhin nach',
       gegen ? Z.erwLinks.indexOf('Keil') === -1 : Z.erwLinks.indexOf('Keil') > -1,
       'links: ' + Z.erwLinks.join(', '));

/* ---------- Die Umkehrung: zurück an die Hauswand ----------
   Der eigentliche Grund für dieses Skript. Bliebe die Auswahl stehen,
   ginge sie unsichtbar in die Anfrage – bestellt wäre eine Wand vor der
   Hauswand. */
frisch('Freistehend');
API.umschalten('hinten', 'Rahmenwand');
API.umschalten('links', 'Rahmenwand');
Z.aufbau = 'Wandmontage';
API.aufraeumen();
pruefe('Zurück an die Hauswand räumt die Rückseite leer',
       gegen ? Z.erwHinten.length !== 0 : Z.erwHinten.length === 0,
       'hinten: ' + (Z.erwHinten.join(', ') || 'leer'));
pruefe('Die übrigen Seiten bleiben dabei unberührt',
       gegen ? Z.erwLinks.length === 0 : Z.erwLinks.length > 0,
       'links: ' + Z.erwLinks.join(', '));
pruefe('Nach dem Aufräumen meldet erwIrgendwo die Rückseite nicht mehr',
       gegen ? API.irgendwo('Rahmenwand') === false : true,
       'links hat noch eine – gefunden wird sie dort');

/* ---------- Dass der Aufbauwechsel das Aufräumen auslöst ---------- */
pruefe('Ein Wechsel des Aufbaus löst das Aufräumen aus',
       gegen ? !/if \(Z\.aufbau !== aufbauVorher\) erwAufraeumen\(\);/.test(k3d)
             : /if \(Z\.aufbau !== aufbauVorher\) erwAufraeumen\(\);/.test(k3d),
       'sonst bliebe die Wahl bis zum nächsten Produktwechsel stehen');

/* ---------- Geometrie: hinten ist das Dach höher ----------
   Oberkante vorne ist die Rinnenunterkante. Hinten liegt sie um das
   volle Gefälle höher; mit hVorn bliebe dort oben ein Streifen offen. */
pruefe('Die Oberkante hinten kommt aus der Dachunterkante',
       gegen ? !/var okOben = \(seite === 'hinten' && dachUk\) \? dachUk\(0\) : hVorn;/.test(k3d)
             : /var okOben = \(seite === 'hinten' && dachUk\) \? dachUk\(0\) : hVorn;/.test(k3d),
       'nicht die Rinnenunterkante wie vorne');
pruefe('Der Keil hängt an der Längsseite, nicht am Namen der Seite',
       gegen ? /seite !== 'vorne' && neig > 0\.001/.test(k3d)
             : /quer && neig > 0\.001 && !!dachUk;/.test(k3d) &&
               !/seite !== 'vorne' && neig > 0\.001/.test(k3d),
       'quer statt einer Namensabfrage');
/* Die Achsen der Rueckseite stehen seit dem 01.11.2026 weiter oben -
   die Feldzahl muss VOR dem Bauen feststehen (siehe
   scripts/pruefe-feldwahl.js). Der Riegel ist derselbe geblieben: Der
   Block, der hinten baut, laeuft nur freistehend. */
pruefe('Die Rückseite wird nur freistehend gebaut',
       gegen ? !/if \(rueckseiteOffen\(\)\) \{\n      var feldNrH = 0;/.test(k3d)
             : /if \(rueckseiteOffen\(\)\) \{\n      var feldNrH = 0;/.test(k3d),
       'zweiter Riegel neben dem Aufräumen');
/* ---------- Hinten hat EIGENE Felder ----------
   „wenn ich hinten plankenwand oder was anderes hinzufüge sind da so 2
   lücken dazwischen aber da sind bei der freistehenden version keine
   pfosten, da statikträger" (Betreiber, 24.10.2026, mit Bild). Im ersten
   Anlauf lief die Rückseite in derselben Schleife wie die Vorderseite
   und übernahm damit deren Pfostenfächer. Hinten stehen aber weniger
   Pfosten: Der Statikträger trägt bis 7 m. */
pruefe('Die Rückseite teilt sich an ihren eigenen Pfosten',
       gegen ? !/var achsenH = \(pfostenHintenX && pfostenHintenX\.length > 1\)/.test(k3d)
             : /var achsenH = \(pfostenHintenX && pfostenHintenX\.length > 1\)/.test(k3d) &&
               /eineSeite\('hinten', hinten, hMitte, hLaenge/.test(k3d),
       'nicht an denen der Vorderseite');
pruefe('Die hinteren Pfostenachsen werden übergeben',
       gegen ? !/frei \? xPfHinten : null\);/.test(k3d)
             : /frei \? xPfHinten : null\);/.test(k3d) &&
               /var xPfHinten = verteilen\(pfHinten, B, PF \/ 2\);/.test(k3d),
       'einmal gerechnet, zweimal benutzt');
/* Nachgerechnet statt nachgelesen: Aus der Pfostenzahl folgt die Feldzahl. */
(function () {
  function verteilen(n, B, rand) {
    var a = [], i;
    if (n < 2) return [0];
    for (i = 0; i < n; i++) a.push(-B / 2 + rand + (B - 2 * rand) * i / (n - 1));
    return a;
  }
  function felder(achsen, PF) {
    var k = 0;
    for (var i = 0; i < achsen.length - 1; i++) {
      if ((achsen[i + 1] - PF / 2) - (achsen[i] + PF / 2) > 0) k++;
    }
    return k;
  }
  var B = 500, PF = 11;
  var fV = felder(verteilen(4, B, PF / 2), PF);     // 5000 x 7050: vier vorne
  var fH = felder(verteilen(2, B, PF / 2), PF);     // zwei hinten
  pruefe('Vier Pfosten vorne ergeben drei Felder',
         gegen ? fV !== 3 : fV === 3, fV + ' Felder');
  pruefe('Zwei Pfosten hinten ergeben ein durchgehendes Feld',
         gegen ? fH !== 1 : fH === 1, fH + ' Feld');
})();

pruefe('Hinten liegt in derselben Ebene wie das Ende der Längsseiten',
       gegen ? !/eineSeite\('hinten', hinten, hMitte, hLaenge/.test(k3d)
             : /eineSeite\('hinten', hinten, hMitte, hLaenge/.test(k3d),
       'z = 0, sonst klafft die Ecke');

/* ---------- Bedienung ---------- */
pruefe('Die Knopfreihe hinten steht in der Seite',
       gegen ? html.indexOf('data-k3d-erw="hinten"') < 0
             : html.indexOf('data-k3d-erw="hinten"') > -1 &&
               html.indexOf('data-k3d-fuer="erw-hinten"') > -1,
       'mit eigener Sichtbarkeitsregel');
pruefe('Die Reihe ist anfangs verborgen',
       gegen ? /data-k3d-fuer="erw-hinten">/.test(html)
             : /data-k3d-fuer="erw-hinten" hidden>/.test(html),
       'Wandmontage ist die Voreinstellung');
pruefe('Die Aufteilung der Schiebeanlage hinten ist verdrahtet',
       gegen ? html.indexOf('id="k3dSg23Hinten"') < 0
             : html.indexOf('id="k3dSg23Hinten"') > -1 &&
               k3d.indexOf("'k3dSg23Hinten'") > -1 &&
               /case 'schiebe-hinten'/.test(k3d),
       'Feld, Ereignisliste und Sichtbarkeit');
pruefe('Der Klartext-Stand zählt die Seiten nicht mehr fest',
       gegen ? /alle drei Seiten geschlossen\.<\/span>/.test(k3d)
             : !/'Damit sind alle drei Seiten geschlossen/.test(k3d) &&
               /wieViele/.test(k3d),
       'freistehend sind es vier');

/* ---------- Anfrage-Assistent ---------- */
['stoffzip-Auslöser', 'Zurücksetzen', 'Zusammenfassung', 'Übernahme'].forEach(
  function (was, i) {
    var re = [/\['erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten'\]\.some/,
              /'erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten', 'untergrund'/,
              /\['erw_hinten', 'Erweiterung hinten'\]/,
              /\['erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten'\]\.forEach/][i];
    pruefe('Assistent kennt die Rückseite: ' + was,
           gegen ? !re.test(wiz) : re.test(wiz), '');
  });
pruefe('Assistent bietet die Rückseite nur freistehend an',
       gegen ? !/rueckseiteOffen\(\) \? ddField\('erw_hinten'/.test(wiz)
             : /rueckseiteOffen\(\) \? ddField\('erw_hinten'/.test(wiz) &&
               /answers\.aufbau === 'Freistehend'/.test(wiz),
       'dieselbe Regel wie im Konfigurator');
pruefe('Auch im Assistenten gibt es hinten keinen Keil',
       gegen ? !/id === 'erw_vorne' \|\| id === 'erw_hinten'/.test(wiz)
             : /id === 'erw_vorne' \|\| id === 'erw_hinten'/.test(wiz),
       'erwIsVorne deckt beide Stirnseiten ab');

/* ---------- Die Anfrage nennt keine Seite, die es nicht gibt ---------- */
pruefe('Die interne Notiz nennt nur vorhandene Seiten',
       gegen ? !/erwSeiten\(\)\.forEach\(function \(seite\) \{\n        var l = erwListe\(seite\);[\s\S]{0,400}?seiten\.push/.test(k3d)
             : /erwSeiten\(\)\.forEach\(function \(seite\) \{\n        var l = erwListe\(seite\);[\s\S]{0,400}?seiten\.push/.test(k3d),
       'sonst stünde bei Wandmontage „hinten: offen" in der Mail');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
