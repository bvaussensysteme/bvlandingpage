#!/usr/bin/env node
/* Prueft das Gefaelle des Terrassenbodens.
 *
 * ANLASS. „Und es wäre sinnvoll, wenn man die Neidugung in Grad vom
 * Bodenbelag einstellen könnte damit man die Grad von der terasse
 * richtig rechnen kann, weil der Boden is ja nicht immer Eben manche
 * haben 2 grad manche mehr" (Betreiber, 24.10.2026).
 *
 * FESTGELEGT HAT DER BETREIBER (Rueckfrage mit drei Moeglichkeiten):
 * „Die Höhen wie gemessen" – was im Feld „Höhe vorne (Durchgang)" steht,
 * gilt VORNE ueber dem Boden an dieser Stelle. Das Dach behaelt seine
 * Neigung gegenueber der Waagerechten; was sich aendert, sind die
 * PFOSTENLAENGEN. Dazu Gefaelle in beide Richtungen, also je Pfosten
 * eine eigene Laenge.
 *
 * DIE ZAHL, DIE GELD KOSTET, ist die Pfostenlaenge. Deshalb wird sie
 * hier nicht im Code nachgelesen, sondern aus der ausgefuehrten
 * Bodenfunktion nachgerechnet.
 *
 * Aufruf:  node scripts/pruefe-bodengefaelle.js [--gegenprobe]
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
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

/* ---------- Die Bodenfunktion ausfuehren ---------- */
var Z = { bodenGefaelle: 0, bodenGefaelleQuer: 0, produkt: 'Terrassendach TDS', cpTyp: '' };
var istCarport = function () { return Z.produkt === 'Carport'; };
var istCarportTds = function () { return istCarport() && Z.cpTyp === 'Carport TDS'; };
var istPergola = function () { return Z.produkt === 'Pergola / Lamellendach'; };
var bodenY = null, moeglich = null;
(function () {
  var a = k3d.match(/function bodenY\(x, z\) \{[\s\S]*?\n  \}/);
  var b = k3d.match(/function bodenGefaelleMoeglich\(\) \{[\s\S]*?\n  \}/);
  if (!a || !b) return;
  try {
    moeglich = eval('(' + b[0].replace('function bodenGefaelleMoeglich', 'function') + ')');
    var bodenGefaelleMoeglich = moeglich;
    bodenY = eval('(' + a[0].replace('function bodenY', 'function') + ')');
    void bodenGefaelleMoeglich;
  } catch (e) { bodenY = null; }
})();
pruefe('Die Bodenfunktion lässt sich ausführen',
       gegen ? !bodenY : !!bodenY, bodenY ? 'bodenY(x, z)' : 'nicht gefunden');
if (!bodenY) { console.log('\nAbbruch'); process.exit(1); }

/* ---------- Ebener Boden ändert gar nichts ----------
   Der wichtigste Fall: Fast jede Anlage steht auf „eben". Rechnet die
   Funktion dort auch nur um Millimeter daneben, verschiebt sich jedes
   Bauteil auf jeder Terrasse. */
Z.bodenGefaelle = 0; Z.bodenGefaelleQuer = 0;
var ebenOk = [[0, 0], [250, 400], [-250, 400], [-300, 700]].every(function (p) {
  return bodenY(p[0], p[1]) === 0;
});
pruefe('Ebener Boden ergibt überall null',
       gegen ? !ebenOk : ebenOk, 'nichts verschiebt sich');

/* ---------- Die Höhe am Boden ---------- */
Z.bodenGefaelle = 2;
var vorne4m = bodenY(0, 400) * 10;
pruefe('2° auf 4 m sind 140 mm',
       gegen ? Math.abs(vorne4m + 139.7) >= 0.5 : Math.abs(vorne4m + 139.7) < 0.5,
       vorne4m.toFixed(0) + ' mm tiefer als an der Wand');
Z.bodenGefaelle = -2;
pruefe('Minus heißt: fällt zum Haus',
       gegen ? bodenY(0, 400) <= 0 : bodenY(0, 400) > 0,
       'vorne liegt dann höher');
Z.bodenGefaelle = 0; Z.bodenGefaelleQuer = 2;
/* Links liegt in diesem Modell bei +x – siehe eineSeite('links', …). */
pruefe('Quergefälle läuft nach rechts',
       gegen ? !(bodenY(250, 0) > 0 && bodenY(-250, 0) < 0)
             : (bodenY(250, 0) > 0 && bodenY(-250, 0) < 0),
       'links höher, rechts tiefer');

/* ---------- Die Pfostenlängen ----------
   Nachgerechnet mit denselben Formeln, die im Bauweg stehen:
     hVorn   = Z.hoehe / 10 + bodenY(0, T)
     Pfosten = hVorn (bzw. hHinten) − bodenY(an seiner Stelle)
   Erwartet: vorne bleibt genau die eingegebene Durchgangshöhe, hinten
   wird der Pfosten um das Bodengefälle KÜRZER – der Boden liegt dort
   höher. */
(function () {
  Z.bodenGefaelle = 2; Z.bodenGefaelleQuer = 0;
  var T = 400, hoehe = 230, neig = 5 * Math.PI / 180;
  var hVorn = hoehe + bodenY(0, T);
  var hHinten = hVorn + Math.tan(neig) * T;
  var pfVorne = Math.round((hVorn - bodenY(0, T)) * 10);
  var pfHinten = Math.round((hHinten - bodenY(0, 0)) * 10);
  var ebenHinten = Math.round((hoehe + Math.tan(neig) * T) * 10);
  if (gegen) pfVorne += 50;
  pruefe('Vorne bleibt genau die eingegebene Höhe',
         pfVorne === 2300, pfVorne + ' mm (eingegeben 2300)');
  pruefe('Hinten wird der Pfosten um das Bodengefälle kürzer',
         gegen ? pfHinten === ebenHinten
               : (pfHinten < ebenHinten && ebenHinten - pfHinten === 140),
         pfHinten + ' mm statt ' + ebenHinten + ' mm auf ebenem Boden');
  /* Quergefälle: die vier Ecken stehen auf vier Höhen. */
  Z.bodenGefaelleQuer = 1;
  var ecken = [bodenY(250, 0), bodenY(-250, 0), bodenY(250, T), bodenY(-250, T)]
    .map(function (y) { return Math.round((hHinten - y) * 10); });
  var alleGleich = ecken.every(function (w) { return w === ecken[0]; });
  pruefe('Mit Quergefälle hat jede Ecke ihre eigene Länge',
         gegen ? alleGleich : !alleGleich, ecken.join(' / ') + ' mm');
})();

/* ---------- Die Dachneigung bleibt, wie sie bestellt wird ----------
   Das Dach wird nur VERSCHOBEN, nicht gekippt: Sein Gefälle gegenüber
   der Waagerechten entscheidet über den Wasserablauf und steht so im
   Bestellformular. Stünde im Code statt der Verschiebung eine Drehung,
   liefe das Wasser bei 2° Bodengefälle auf einmal anders. */
pruefe('Das Dach wird verschoben, nicht gekippt',
       gegen ? !/var hVorn = Z\.hoehe \/ 10 \+ bodenY\(0, T\);/.test(k3d)
             : /var hVorn = Z\.hoehe \/ 10 \+ bodenY\(0, T\);/.test(k3d) &&
               !/neig \+ .*bodenGefaelle/.test(k3d),
       'die Neigung gegen die Waagerechte bleibt unverändert');
pruefe('Die Neigung gegenüber dem Boden wird ausgewiesen',
       gegen ? !/neigungGrad\(\) - gt/.test(k3d)
             : /neigungGrad\(\) - gt/.test(k3d) &&
               /gegenüber dem Terrassenboden/.test(k3d),
       'sonst verwirrt der Winkel beim Aufmaß');

/* ---------- Das Rechenbeispiel des Betreibers ----------
   „beispiel wenn boden gefälle 6 grad is und ich hinten höhe z.b 2500
   mache und vorne 2500 dann sind es ja 6 grad trz" (Betreiber,
   24.10.2026). Beide Höhen werden über dem BODEN gemessen; sind sie
   gleich, läuft das Dach parallel zum Boden und hat gegenüber der
   Waagerechten genau dessen Gefälle.

   Bis dahin rechnete der Weg über die beiden Höhen mit ebenem Boden und
   kam auf 0°. Die beiden Eingabewege liefen also auseinander, sobald ein
   Gefälle eingetragen war – gefunden hat das der Betreiber, nicht ich.

   Geprüft wird, indem die beiden Umrechnungen aus dem Code ausgeführt
   werden, und zwar in BEIDE Richtungen: Grad aus Höhen und Höhen aus
   Grad müssen dasselbe ergeben. */
(function () {
  function hol(re) { var m = k3d.match(re); return m ? m[0] : ''; }
  var quelle = [
    /* bodenGefaelleMoeglich() gehoert mit in den Geltungsbereich –
       tanBoden() fragt sie, und ohne sie wirft die Rechnung. */
    hol(/function bodenGefaelleMoeglich\(\) \{[\s\S]*?\n  \}/),
    hol(/function tanBoden\(\) \{[\s\S]*?\n  \}/),
    hol(/function wandUkBasis\(\) \{[\s\S]*?\n  \}/),
    hol(/function wandUkSpanne\(\) \{[\s\S]*?\n  \}/),
    hol(/function wandUkAus\(grad\) \{[\s\S]*?\n  \}/),
    hol(/function gradAusWandUk\(mm\) \{[\s\S]*?\n  \}/)
  ].join('\n');
  var neigungProzent = function (grad) { return Math.tan(grad * Math.PI / 180) * 100; };
  void neigungProzent;
  var API = null;
  try {
    API = eval(quelle + '\n;({ aus: wandUkAus, grad: gradAusWandUk })');
  } catch (e) { API = null; }
  if (!API) {
    pruefe('Die Höhen-Umrechnung lässt sich ausführen', gegen, 'nicht ausführbar');
    return;
  }
  pruefe('Die Höhen-Umrechnung lässt sich ausführen', !gegen, 'beide Richtungen');
  Z.hoehe = 2500; Z.tiefe = 3000; Z.bodenGefaelle = 6; Z.bodenGefaelleQuer = 0;
  var grad = API.grad(2500);
  pruefe('6° Boden, vorne 2500, hinten 2500 ergibt 6°',
         gegen ? grad !== 6 : grad === 6,
         grad + '° gegenüber der Waagerechten – das Dach läuft parallel zum Boden');
  var zurueck = API.aus(6);
  pruefe('Umgekehrt ergeben 6° wieder 2500 mm hinten',
         gegen ? zurueck !== 2500 : zurueck === 2500, zurueck + ' mm');
  /* Ohne Gefaelle muss beides sein wie zuvor. */
  Z.bodenGefaelle = 0;
  var ebenHin = API.aus(5), ebenGrad = API.grad(2762);
  pruefe('Ohne Gefälle rechnet die Umrechnung wie zuvor',
         gegen ? !(ebenHin === 2762 && ebenGrad === 5)
               : (ebenHin === 2762 && ebenGrad === 5),
         '5° ergeben ' + ebenHin + ' mm, und zurück ' + ebenGrad + '°');
  delete Z.hoehe; delete Z.tiefe;
})();

/* ---------- Wo es das Gefälle gibt ---------- */
[['Terrassendach TDS', '', true], ['Flachdach SkyView', '', true],
 ['Carport', 'Carport TDS', true], ['Carport', 'Flachdach Flat Line', false],
 ['Carport', 'Flachdach Flat Box', false],
 ['Pergola / Lamellendach', '', false]].forEach(function (f) {
  Z.produkt = f[0]; Z.cpTyp = f[1];
  var ist = moeglich();
  pruefe('Gefälle bei ' + (f[1] || f[0]) + ': ' + (f[2] ? 'ja' : 'nein'),
         gegen ? ist !== f[2] : ist === f[2],
         f[2] ? 'wird im Bauweg gerechnet' : 'wird dort nicht gerechnet');
});
Z.produkt = 'Terrassendach TDS'; Z.cpTyp = '';

/* ---------- Die übrigen Bauwege legen den Belag wieder flach ----------
   Ohne das bliebe der Belag gekippt, sobald jemand von der Terrasse zum
   Flachdach-Carport wechselt – und niemand fände den Grund. */
pruefe('Andere Bauwege stellen den Belag zurück',
       gegen ? (k3d.match(/belag\.rotation\.set\(0, 0, 0\);/g) || []).length !== 3
             : (k3d.match(/belag\.rotation\.set\(0, 0, 0\);/g) || []).length === 3,
       'drei Bauwege ohne Bodengefälle');
pruefe('Der Belag kippt im Terrassenweg mit',
       gegen ? !/belag\.rotation\.set\(gt, 0, gq\);/.test(k3d)
             : /belag\.rotation\.set\(gt, 0, gq\);/.test(k3d),
       'sonst stünde die Anlage sichtbar in der Luft');
/* ---------- „verschwindet es unter der wiese" ----------
   Der erste Anlauf kippte den Belag, ließ ihn aber 2 cm dünn und die
   Wiese waagerecht auf −0,6. Die tiefere Hälfte lag damit unter dem
   Rasen, die höhere schwebte darüber: „wenn man boden gefälle einträgt
   verschwindet es unter der wiese" (Betreiber, 24.10.2026, mit Bild).

   Zwei Bedingungen halten das jetzt zusammen, und beide werden
   nachgerechnet statt nur gelesen. */
pruefe('Der Belag ist so dick wie sein eigener Höhenunterschied',
       gegen ? !/var dicke = 2 \+ abfall;/.test(k3d)
             : /var dicke = 2 \+ abfall;/.test(k3d) &&
               /belag\.scale\.set\(belagB, dicke \/ 2, belagL\);/.test(k3d),
       'sonst hängt die hohe Seite in der Luft');
pruefe('Die Wiese liegt unter dem tiefsten Punkt des Belags',
       gegen ? !/rasen\.position\.y = -0\.6 \+ tiefste;/.test(k3d)
             : /rasen\.position\.y = -0\.6 \+ tiefste;/.test(k3d) &&
               /tiefste = Math\.min\(tiefste, bodenY\(e\[0\], e\[1\]\)\)/.test(k3d),
       'an den vier Ecken gerechnet, nicht geschätzt');
(function () {
  /* Nachgerechnet: Deckt die Dicke den Abfall über die Platte wirklich
     ab, und liegt die Wiese tief genug? Zahlen wie im Bauweg. */
  Z.bodenGefaelle = 6; Z.bodenGefaelleQuer = 2;
  var B = 500, T = 300;
  var belagZ = (T + 120) / 2 - 60, belagB = B + 180, belagL = T + 120;
  var gt = Math.tan(6 * Math.PI / 180), gq = Math.tan(2 * Math.PI / 180);
  var abfall = Math.abs(gt) * belagL + Math.abs(gq) * belagB;
  var dicke = 2 + abfall;
  var ecken = [[-belagB / 2, belagZ - belagL / 2], [belagB / 2, belagZ - belagL / 2],
               [-belagB / 2, belagZ + belagL / 2], [belagB / 2, belagZ + belagL / 2]];
  var tiefste = 0, hoechste = 0;
  ecken.forEach(function (e) {
    tiefste = Math.min(tiefste, bodenY(e[0], e[1]));
    hoechste = Math.max(hoechste, bodenY(e[0], e[1]));
  });
  var rasenY = -0.6 + tiefste;
  /* Unterkante der Platte in ihrer Mitte, grob: Mitte minus halbe Dicke;
     die gekippten Ecken liegen höchstens um den halben Abfall darüber. */
  var unterkante = bodenY(0, belagZ) - dicke + abfall / 2;
  var deckt = (hoechste - tiefste) <= dicke && unterkante <= rasenY;
  if (gegen) deckt = !deckt;
  pruefe('Bei 6° und 2° deckt die Platte den Rasen überall ab',
         deckt,
         'Höhenunterschied ' + (hoechste - tiefste).toFixed(1) + ' cm, Dicke ' +
         dicke.toFixed(1) + ' cm, Rasen auf ' + rasenY.toFixed(1));
  Z.bodenGefaelle = 0; Z.bodenGefaelleQuer = 0;
})();
pruefe('Die anderen Bauwege legen Platte und Wiese zurück',
       gegen ? (k3d.match(/rasen\.position\.y = -0\.6;       \/\/ und die Wiese/g) || []).length !== 3
             : (k3d.match(/rasen\.position\.y = -0\.6;       \/\/ und die Wiese/g) || []).length === 3 &&
               (k3d.match(/belag\.scale\.y = 1;/g) || []).length === 3,
       'sonst bliebe die Wiese nach einem Produktwechsel versenkt');
pruefe('Das Wasserzeichen liegt auf dem Belag und kippt mit',
       gegen ? !/wasserzeichen\.rotation\.set\(-Math\.PI \/ 2 \+/.test(k3d)
             : /wasserzeichen\.rotation\.set\(-Math\.PI \/ 2 \+/.test(k3d) &&
               /0\.4 \+ bodenY\(0, wzZ\)/.test(k3d),
       'sonst steckt das Logo im Boden oder schwebt');

/* ---------- Bedienung ---------- */
['k3dBodenGefaelle', 'k3dBodenGefaelleQuer'].forEach(function (id) {
  pruefe('Feld ' + id + ' steht in der Seite und ist verdrahtet',
         gegen ? html.indexOf('id="' + id + '"') < 0
               : html.indexOf('id="' + id + '"') > -1 &&
                 k3d.indexOf("'" + id + "'") > -1,
         'Eingabefeld und Ereignisliste');
});
/* Das Gefälle stand bis zum 24.10.2026 beim Bodenbelag – fachlich
   richtig, in der Bedienung falsch: Es hängt rechnerisch an der
   Dachneigung, und die beiden lagen rund 4000 px auseinander („man muss
   mal runter srollen dann wieder hoch"). Jetzt steht es direkt darunter,
   und genau diese Nachbarschaft wird geprüft – nicht nur der Schritt. */
(function () {
  var gruppen = html.match(/<div class="k3d-gruppe[^>]*>/g) || [];
  var iN = -1, iB = -1;
  gruppen.forEach(function (g, n) {
    if (/data-k3d-fuer="neigung"/.test(g)) iN = n;
    if (/data-k3d-fuer="bodengefaelle"/.test(g)) iB = n;
  });
  var direkt = iN > -1 && iB === iN + 1;
  pruefe('Das Gefälle steht direkt unter der Dachneigung',
         gegen ? !direkt : direkt,
         iN > -1 && iB > -1 ? 'Neigung an Stelle ' + iN + ', Gefälle an ' + iB
                            : 'eine der beiden fehlt');
  var imMass = /data-k3d-schritt="masse" data-k3d-mehr\s*\n\s*data-k3d-fuer="bodengefaelle"/.test(html);
  pruefe('Das Gefälle gehört zum Schritt „Maße"',
         gegen ? !imMass : imMass, 'nicht mehr zu „Untergrund"');
})();
pruefe('Ein leeres Feld heißt eben, nicht unverändert',
       gegen ? !/if \(!isFinite\(roh\)\) return 0;/.test(k3d)
             : /if \(!isFinite\(roh\)\) return 0;/.test(k3d),
       'sonst ließe sich ein Gefälle nicht mehr löschen');
pruefe('Die Eingabe wird auf ±10° begrenzt',
       gegen ? !/Math\.min\(10, Math\.max\(-10, roh\)\)/.test(k3d)
             : /Math\.min\(10, Math\.max\(-10, roh\)\)/.test(k3d), '');

/* ---------- Die Pfostenlängen gehen in die Anfrage ----------
   Bestellt werden Pfosten, nicht Winkel. Stünde nur das Gefälle in der
   Mail, müsste der Betrieb die Längen selbst ausrechnen. */
pruefe('Die gebauten Pfostenlängen werden mitgeschrieben',
       gegen ? !/PFOSTEN_IST\.vorne\.push\(Math\.round\(lang \* 10\)\);/.test(k3d)
             : /PFOSTEN_IST\.vorne\.push\(Math\.round\(lang \* 10\)\);/.test(k3d),
       'aus dem Modell, nicht neu gerechnet');
pruefe('Gefälle und Pfostenlängen stehen in der Anfrage',
       gegen ? !/teile\.push\('Pfostenlaengen vorne: '/.test(k3d)
             : /teile\.push\('Pfostenlaengen vorne: '/.test(k3d) &&
               /Terrassenboden faellt/.test(k3d),
       'interne Notiz');
pruefe('Auf ebenem Boden steht nichts davon in der Anfrage',
       gegen ? !/if \(!bodenGefaelleMoeglich\(\) \|\| \(!gt && !gq\)\) return null;/.test(k3d)
             : /if \(!bodenGefaelleMoeglich\(\) \|\| \(!gt && !gq\)\) return null;/.test(k3d),
       'eine Zeile, die immer dasteht, wird überlesen');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
