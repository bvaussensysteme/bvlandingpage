#!/usr/bin/env node
/* Prueft die RAL-Tabelle und die Farbsuche im Konfigurator.
 *
 * ANLASS. „füge mehr RAL töne hinzu" und „hier daneben wäre vllr nen
 * button mit lupen symbol gut wenn man draufklickt kann man z.b eingeben
 * Braun, Blau etc, dann werden einem RAL Töne vorgeschlagen"
 * (Betreiber, 25.10.2026).
 *
 * WARUM NACHGERECHNET STATT NACHGELESEN: Eine Farbtabelle mit ueber 200
 * Zeilen liest niemand gegen. Ein vertauschter Farbwert faellt erst auf,
 * wenn ein Kunde nach dem Bild bestellt. Deshalb wird die Tabelle hier
 * AUSGEFUEHRT und die Suche mit echten Fragen aufgerufen.
 *
 * Aufruf:  node scripts/pruefe-ral.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var k3d  = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var html = fs.readFileSync('konfigurator.html', 'utf8');

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

/* ---------- Tabelle und Suche aus der Quelle holen ---------- */
var tabQuelle = (k3d.match(/var RAL = \{[\s\S]*?\n  \};/) || [''])[0];
var famQuelle = (k3d.match(/var RAL_FAMILIE = \{[\s\S]*?\n  \};/) || [''])[0];
var flachQ    = (k3d.match(/function ralFlach\(t\) \{[\s\S]*?\n  \}/) || [''])[0];
var suchQ     = (k3d.match(/function ralSuchen\(frage\) \{[\s\S]*?\n  \}/) || [''])[0];
var RAL = null, ralSuchen = null;
try {
  /* new Function statt eval: Dieses Skript laeuft im strict mode, und
     dort bleibt ein `var` aus eval in seinem eigenen Geltungsbereich –
     die Tabelle kaeme nie hier an. */
  var bauen = new Function(tabQuelle + '\n' + famQuelle + '\n' + flachQ +
                           '\n' + suchQ + '\nreturn [RAL, ralSuchen];');
  var holt = bauen();
  RAL = holt[0]; ralSuchen = holt[1];
} catch (e) { /* bleibt null, faellt unten auf */ }

pruefe('Tabelle und Suche lassen sich ausführen',
       gegen ? !(RAL && typeof ralSuchen === 'function')
             : !!(RAL && typeof ralSuchen === 'function'),
       'sonst ist alles Weitere wertlos');
if (!RAL || typeof ralSuchen !== 'function') {
  console.log('\nAbbruch: RAL-Tabelle nicht lesbar');
  process.exit(1);
}

var nummern = Object.keys(RAL);
/* Die RAL-Classic-Reihe hat gut 210 Toene. Vor dem 25.10.2026 waren 53
   hinterlegt – zu wenig, um „andere RAL-Farbe" ueberhaupt anzubieten. */
var genug = nummern.length >= 210 + (gegen ? 1000 : 0);
pruefe('Mindestens 210 RAL-Töne hinterlegt', genug, nummern.length + ' Töne');

(function () {
  var schlecht = nummern.filter(function (n) {
    var e = RAL[n];
    return !/^\d{4}$/.test(n) || !e || typeof e[0] !== 'number' ||
           e[0] < 0 || e[0] > 0xffffff || !e[1] ||
           /[­​]/.test(e[1]) || e[1].length > 30;
  });
  if (gegen) schlecht = schlecht.length ? [] : ['(Gegenprobe)'];
  pruefe('Jede Zeile hat vierstellige Nummer, Farbwert und Namen',
         schlecht.length === 0,
         schlecht.length ? 'auffällig: ' + schlecht.slice(0, 5).join(', ')
                         : 'weiche Trennstriche aus der Quelle mit geprüft');
})();

(function () {
  /* Stichproben, die jeder nachschlagen kann. Sie sichern die
     Zuordnung Nummer -> Name ab; ein verrutschter Tabellenblock faellt
     damit sofort auf. */
  var soll = [['7016', 'Anthrazitgrau'], ['9005', 'Tiefschwarz'],
              ['6005', 'Moosgrün'], ['8014', 'Sepiabraun'],
              ['1000', 'Grünbeige'], ['5002', 'Ultramarinblau'],
              ['9016', 'Verkehrsweiß'], ['3020', 'Verkehrsrot']];
  var falsch = soll.filter(function (s) {
    return !RAL[s[0]] || RAL[s[0]][1] !== (gegen ? s[1] + 'x' : s[1]);
  });
  pruefe('Stichproben Nummer → Name stimmen',
         falsch.length === 0,
         falsch.length ? falsch.map(function (f) { return f[0]; }).join(', ')
                       : soll.length + ' Töne geprüft');
})();

(function () {
  /* Die Helligkeit muss zur Farbfamilie passen: Ein „Tiefschwarz", das
     hell herauskommt, ist ein vertauschter Wert. Gerechnet, nicht
     angesehen. */
  function hell(n) {
    var f = RAL[n][0];
    return (0.299 * ((f >> 16) & 255) + 0.587 * ((f >> 8) & 255) +
            0.114 * (f & 255)) / 255;
  }
  var dunkel = ['9005', '9011', '9017', '8022', '7021'];
  var licht  = ['9010', '9016', '9003', '9001', '7035'];
  var okD = dunkel.every(function (n) { return hell(n) < 0.25; });
  var okL = licht.every(function (n) { return hell(n) > 0.8; });
  if (gegen) { okD = !okD; okL = !okL; }
  pruefe('Schwarztöne sind dunkel, Weißtöne hell', okD && okL,
         'Tiefschwarz ' + hell('9005').toFixed(2) +
         ', Reinweiß ' + hell('9010').toFixed(2));
})();

/* ---------- Die Suche mit echten Fragen ---------- */
(function () {
  function nummern_(frage) {
    return ralSuchen(frage).map(function (t) { return t.nr; });
  }
  var faelle = [
    /* Frage, was mindestens dabei sein muss, erste Ziffer der Familie */
    ['Braun', '8014', '8'],
    ['blau', '5002', '5'],
    ['Grün', '6005', '6'],
    ['gruen', '6005', '6'],
    ['grau', '7016', '7'],
    ['Moos', '6005', null],
    ['Sepia', '8014', null],
    ['7016', '7016', null],
    ['70', '7001', null]
  ];
  var schief = [];
  faelle.forEach(function (f) {
    var tr = nummern_(gegen ? f[0] + 'zzz' : f[0]);
    if (tr.indexOf(f[1]) < 0) { schief.push(f[0] + ': ' + f[1] + ' fehlt'); return; }
    /* Bei einer Farbfrage muss der erste Treffer aus der Familie kommen –
       sonst steht „Rapsgelb" ganz oben, wenn jemand Braun sucht. */
    if (f[2] && tr.length && tr[0].charAt(0) !== f[2]) {
      schief.push(f[0] + ': erster Treffer ' + tr[0]);
    }
  });
  pruefe('Farbwörter und Nummern finden die richtigen Töne',
         schief.length === 0,
         schief.length ? schief.slice(0, 3).join(' | ')
                       : faelle.length + ' Fragen, jeweils mit erwartetem Treffer');

  var leer = ralSuchen(gegen ? 'braun' : 'qwertzuiop');
  pruefe('Unsinn findet nichts', leer.length === 0,
         'sonst schlägt die Suche irgendetwas vor');

  /* „7016" muss ganz oben stehen, nicht irgendwo in der Liste. */
  var erst = nummern_(gegen ? '9005' : '7016')[0];
  pruefe('Eine eingegebene Nummer steht an erster Stelle',
         erst === '7016', 'erster Treffer ' + erst);
})();

/* ---------- Bedienung ---------- */
(function () {
  var knopf = /id="k3dRalLupe"[\s\S]{0,400}?aria-controls="k3dRalSuche"/.test(html);
  var feld  = html.indexOf('id="k3dRalSuchFeld"') > -1;
  var liste = html.indexOf('id="k3dRalTreffer"') > -1;
  var drin  = /ralSucheAufbauen\(\);/.test(k3d) &&
              /function ralSucheAufbauen\(\)/.test(k3d);
  var ok = knopf && feld && liste && drin;
  if (gegen) ok = !ok;
  pruefe('Lupe, Suchfeld und Trefferliste sind verdrahtet', ok,
         'Knopf ' + knopf + ', Feld ' + feld + ', Liste ' + liste +
         ', Start ' + drin);
  /* Ein Treffer setzt die Nummer ins Eingabefeld und loest dort dasselbe
     Ereignis aus wie eine Eingabe von Hand – sonst sieht man die Farbe
     im Feld, aber nicht am Modell. */
  var weg = /eing\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/.test(k3d);
  pruefe('Ein Treffer geht denselben Weg wie eine Eingabe von Hand',
         gegen ? !weg : weg, 'sonst ändert sich das Modell nicht');
})();

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
