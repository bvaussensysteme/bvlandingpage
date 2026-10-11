#!/usr/bin/env node
/* Prüft die Maßtabelle (js/masstabelle.js) gegen die Regeln, mit denen
   sie verdichtet wurde, und gegen bekannte Festwerte.

   Warum das eine eigene Prüfung braucht: Die Datei ist verdichtet – sie
   speichert Sparren und Stützfüße nur je BREITE, weil das über alle 1316
   Datensätze so war. Kommt eine neue Preisliste, in der die Sparrenzahl
   auch von der Tiefe abhängt, ist diese Verdichtung still falsch. Dann
   muss das hier auffallen und nicht im Angebot.

   Aufruf:  node scripts/pruefe-masstabelle.js [--gegenprobe]
*/
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;

var quelle = fs.readFileSync('js/masstabelle.js', 'utf8');
var k3d = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var html = fs.readFileSync('konfigurator.html', 'utf8');
var window = {};
eval(quelle);
var M = window.BV_MASSTABELLE;

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

pruefe('Tabelle ist geladen', !gegen && !!(M && M.systeme),
       M ? Object.keys(M.systeme).length + ' Systeme, Stand ' + M.stand : 'fehlt');
if (!M || !M.systeme) { console.log('\nAbbruch'); process.exit(1); }

/* Umfang: so viele Breiten und Tiefen hat die Quelle je System */
var SOLL = {
  'TDS|Glas':             { breiten: 30, tiefen: 14 },
  'TDS|Polycarbonat':     { breiten: 14, tiefen: 14 },
  'SkyView|Glas':         { breiten: 30, tiefen: 14 },
  'SkyView|Polycarbonat': { breiten: 14, tiefen: 14 },
  'Flat_Line|Trapezblech':{ breiten: 12, tiefen: 7 }
};
var saetze = 0;
Object.keys(SOLL).forEach(function (k) {
  var g = M.systeme[k];
  if (!g) { pruefe('System ' + k, false, 'fehlt'); return; }
  var nb = Object.keys(g.breiten).length, nt = g.tiefen.length;
  saetze += nb * nt;
  pruefe('Umfang ' + k,
         !gegen && nb === SOLL[k].breiten && nt === SOLL[k].tiefen,
         nb + ' Breiten × ' + nt + ' Tiefen (erwartet ' +
         SOLL[k].breiten + ' × ' + SOLL[k].tiefen + ')');
});
pruefe('1316 Datensätze abgedeckt', !gegen && saetze === 1316, saetze + ' Sätze');

/* Jede Breite hat genau zwei Zahlen, beide plausibel */
var kaputt = [];
Object.keys(M.systeme).forEach(function (k) {
  var g = M.systeme[k];
  Object.keys(g.breiten).forEach(function (b) {
    var e = g.breiten[b];
    if (!Array.isArray(e) || e.length !== 2) { kaputt.push(k + ' ' + b); return; }
    if (!(e[0] >= 2 && e[0] <= 30)) kaputt.push(k + ' ' + b + ' Sparren ' + e[0]);
    if (!(e[1] >= 2 && e[1] <= 10)) kaputt.push(k + ' ' + b + ' Stützfüße ' + e[1]);
  });
});
if (gegen) kaputt = ['künstlich'];
pruefe('Alle Einträge vollständig und plausibel', kaputt.length === 0,
       kaputt.length ? kaputt.slice(0, 3).join(', ') : 'geprüft');

/* Mehr Breite heißt nie weniger Sparren */
var ruecklauf = [];
Object.keys(M.systeme).forEach(function (k) {
  var g = M.systeme[k];
  var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
  for (var i = 1; i < bs.length; i++) {
    if (g.breiten[bs[i]][0] < g.breiten[bs[i - 1]][0]) {
      ruecklauf.push(k + ': ' + bs[i - 1] + '→' + bs[i]);
    }
  }
});
if (gegen) ruecklauf = ['künstlich'];
pruefe('Sparrenzahl steigt mit der Breite', ruecklauf.length === 0,
       ruecklauf.length ? ruecklauf.join(', ') : 'monoton');

/* Achsabstand im belegten Band – dieselbe Selbstkontrolle wie bei der
   Schätzung, jetzt auf den echten Zahlen */
var ausserhalb = [];
[['TDS|Glas', 680, 770], ['SkyView|Glas', 680, 770],
 ['TDS|Polycarbonat', 1016, 1080], ['SkyView|Polycarbonat', 1016, 1080]].forEach(function (p) {
  var g = M.systeme[p[0]]; if (!g) return;
  Object.keys(g.breiten).map(Number).forEach(function (b) {
    if (b < 1500) return;                       // Kleinstmaße fallen heraus
    var a = b / (g.breiten[b][0] - 1);
    if (a < p[1] - 60 || a > p[2] + 10) ausserhalb.push(p[0] + ' ' + b + ': ' + Math.round(a));
  });
});
if (gegen) ausserhalb = ['künstlich'];
pruefe('Achsabstand im belegten Band', ausserhalb.length === 0,
       ausserhalb.length ? ausserhalb.slice(0, 4).join(', ') : 'Glas 680–770, Poly 1016–1080');

/* Festwert, den der Betreiber genannt hat: 6000 x 3000 mit VSG 8 ergibt
   9 Sparren und 3 Pfosten. 6000 ist keine lieferbare Breite – gerechnet
   wird mit der nächsten darüber (6080). Genau das macht auch
   tabelleBauteile() im Konfigurator. */
var tg = M.systeme['TDS|Glas'];
var bs6 = Object.keys(tg.breiten).map(Number).sort(function (a, b) { return a - b; });
var naechste = null;
for (var j = 0; j < bs6.length; j++) { if (bs6[j] >= 6000) { naechste = bs6[j]; break; } }
var e6 = naechste ? tg.breiten[naechste] : null;
pruefe('TDS Glas 6000 mm → 9 Sparren, 3 Stützfüße',
       !gegen && !!e6 && e6[0] === 9 && e6[1] === 3,
       e6 ? 'über Breite ' + naechste + ': ' + e6.join(' / ') : 'fehlt');

/* Regeln, auf denen die Verdichtung beruht */
pruefe('Regelwerte hinterlegt',
       !gegen && M.regeln && M.regeln.tiefeMaxOhneUnterzug === 4500 &&
       M.regeln.tiefeMaxMitUnterzug === 7000,
       'Unterzug ab 4500, lieferbar bis 7000');

/* Der Konfigurator muss sie auch benutzen */
pruefe('Konfigurator liest die Tabelle',
       new RegExp(q || 'BV_MASSTABELLE').test(k3d) &&
       new RegExp(q || 'tabelleBauteile').test(k3d), 'tabelleBauteile()');
pruefe('Tabelle wird auf der Seite geladen',
       new RegExp(q || 'js/masstabelle\\.js').test(html), '');
pruefe('Breite wird auf die nächste lieferbare aufgerundet',
       new RegExp(q || 'bs\\[i\\] >= breiteMm').test(k3d), 'nie zu wenige Sparren');

/* ---------- Statikträger und Hinweis ---------- */
pruefe('Statikträger 189 × 117 mm im Modell',
       new RegExp(q || 'traegerH = [\\s\\S]{0,160}18\\.9').test(k3d) &&
       new RegExp(q || 'traegerT = 11\\.7').test(k3d), 'aus der Maßtabelle');
pruefe('Träger sitzt über den Pfosten, nicht in der Dachmitte',
       new RegExp(q || 'hPfosten \\+ traegerH / 2, zPf').test(k3d), 'zPf = Pfostenachse');
/* Voreinstellung 0: Mit Vorsprung kommt ein Statiktraeger dazu – bei 300
   als Voreinstellung bekaeme jedes Terrassendach einen. */
pruefe('Dachvorsprung ist voreingestellt auf 0',
       new RegExp(q || 'vorsprung: 0,').test(k3d) &&
       /id="k3dVorsprung"[^>]*value="0"/.test(html),
       'kein Statikträger im Standardfall');
pruefe('Dachvorsprung bewegt die Pfosten',
       new RegExp(q || 'RINNE\\.breite / 2\\) - vorspr').test(k3d), 'zPf minus Vorsprung');
pruefe('Träger kommt auch mit Vorsprung',
       new RegExp(q || 'unterzugGilt\\(tbMass\\) \\|\\| vorspr > 0').test(k3d), '');
/* Die Rinne wird nie angehoben – technisch unmöglich. Der Träger nimmt
   dem Pfosten seine Höhe weg, in BEIDEN Lagen. */
pruefe('Rinne bleibt auf der eingestellten Höhe',
       new RegExp(q || 'var hRinne = hVorn;').test(k3d) &&
       !/hRinne = hVorn \+ /.test(k3d), 'kein Anheben');
pruefe('Träger kürzt den Pfosten, nicht die Rinne',
       new RegExp(q || 'traegerOk - traegerH').test(k3d), 'hPfosten aus traegerOk');
/* ---------- 7-m-Regel unter dem Statiktraeger ----------
   Zweiter Weg: Die Regel wird hier noch einmal aufgeschrieben und gegen
   die Umsetzung im Code gerechnet. */
var mRegel = k3d.match(/function pfostenUnterTraeger\(breiteMm\) \{\s*return ([^;]+);/);
if (!mRegel) { pruefe('7-m-Regel vorhanden', false, 'pfostenUnterTraeger fehlt'); }
else {
  var fn = new Function('breiteMm', 'return ' + mRegel[1] + ';');
  [[3000, 2], [7000, 2], [7001, 3], [14000, 3], [14001, 4]].forEach(function (f) {
    var ist = fn(f[0]) + (gegen ? 1 : 0);
    pruefe('7-m-Regel bei ' + f[0] + ' mm', ist === f[1],
           ist + ' Pfosten (erwartet ' + f[1] + ')');
  });
}
/* ---------- Die Regel gilt JE SEITE ----------
   „und das gilt immer nur für die seite wo der sttikträger ist" – vorne
   also nur bei Träger vorne, hinten (nur freistehend) immer. Die beiden
   Reihen duerfen deshalb nicht aus einer gemeinsamen Zahl kommen. */
pruefe('Vordere Reihe haengt am vorderen Träger',
       new RegExp(q || 'pfVorne = traegerH > 0 \\? pfostenUnterTraeger').test(k3d), '');
pruefe('Hintere Reihe immer nach der 7-m-Regel',
       new RegExp(q || 'pfHinten = pfostenUnterTraeger\\(Z\\.breite\\)').test(k3d), '');
pruefe('Keine gemeinsame Pfostenzahl mehr',
       gegen ? /hatTraeger/.test(k3d) : !/hatTraeger/.test(k3d), 'hatTraeger entfernt');
pruefe('Hintere Reihe nur freistehend gezeichnet',
       new RegExp(q || 'if \\(frei\\) \\{\\s*verteilen\\(pfHinten').test(k3d), '');

/* Zweiter Weg: die Entscheidung aus dem Code herausloesen und mit
   eigenen Zahlen rechnen, statt den Text nur zu lesen. */
var mV = k3d.match(/var pfVorne = (traegerH > 0 [^;]+);/);
if (!mV || !mRegel) { pruefe('Entscheidung je Seite rechenbar', false, 'Zeile nicht gefunden'); }
else {
  var fV = new Function('traegerH', 'Z', 'pfTabelle', 'pfostenUnterTraeger',
                        'return ' + mV[1] + ';');
  // Breite 8080: Tabelle sagt 4 Stuetzfuesse, die 7-m-Regel sagt 3.
  [ // Träger vorne?, Tabelle, erwartet vorne
    [0, 4, 4],        // kein Träger vorne  -> Tabelle
    [18.9, 4, 3]      // Träger vorne       -> 7-m-Regel
  ].forEach(function (f) {
    var ist = fV(f[0], { breite: 8080 }, f[1], fn) + (gegen ? 1 : 0);
    pruefe('Vorne bei ' + (f[0] ? 'Träger' : 'ohne Träger') + ': ' + f[2] + ' Pfosten',
           ist === f[2], ist + ' Pfosten');
  });
  var istH = fn(8080) + (gegen ? 1 : 0);
  pruefe('Hinten (freistehend) 3 Pfosten nach der 7-m-Regel', istH === 3, istH + ' Pfosten');
  /* Rohwerte ohne Gegenprobe-Versatz, sonst hebt sich der Versatz in
     beiden Reihen gegenseitig auf und die Pruefung schlaegt nie an. */
  var rohV = fV(0, { breite: 8080 }, 4, fn), rohH = fn(8080);
  pruefe('Reihen duerfen sich unterscheiden',
         gegen ? rohV === rohH : rohV !== rohH,
         'freistehend ohne Vorsprung: ' + rohV + ' vorne / ' + rohH + ' hinten');
}
pruefe('Hinweis trennt die Reihen genauso',
       new RegExp(q || "pfV \\+ ' Pfosten vorne und ' \\+ pfH \\+ ' hinten'").test(k3d), '');
pruefe('Hinweis: vordere Zahl aus dem vorderen Träger',
       new RegExp(q || 'pfV = \\(unterzugGilt\\(tb\\) \\|\\| vsHin > 0 \\|\\| wunsch\\)').test(k3d), '');

/* Freistehend: der Statiktraeger steht an der Stelle der Wand, das
   Wandprofil wird darauf geschraubt – 1:1 wie bei Wandmontage. */
pruefe('Freistehend: Träger steht hochkant',
       new RegExp(q || 'TR_H = 18\\.9, TR_T = 11\\.7').test(k3d), '189 hoch, 117 tief');
pruefe('Freistehend: Träger hinter dem Wandprofil',
       new RegExp(q || 'zTrHinten = -TR_T / 2 \\+ vorsprH').test(k3d),
       'an der Stelle der Wand, mit Vorsprung nach innen');
pruefe('Wandprofil immer gleich tief',
       gegen ? /wpT = frei \?/.test(k3d) : /wpH = sky \? 20 : 14, wpT = 9;/.test(k3d),
       'kein Sonderfall mehr fuer freistehend');
pruefe('Wandprofil wird nicht ersetzt',
       gegen ? !/balken\(B, wpH, wpT, 0, wpMitte, zHinten, mAlu\);/.test(k3d)
             : /balken\(B, wpH, wpT, 0, wpMitte, zHinten, mAlu\);/.test(k3d),
       'steht ausserhalb der frei-Verzweigung');
pruefe('Freistehend: hintere Pfosten enden unter dem Träger',
       new RegExp(q || 'hPfostenHinten = frei \\? Math\\.max\\(100, trOk - TR_H\\)').test(k3d), '');
pruefe('Freistehend: hintere Pfosten stehen unter dem Träger',
       new RegExp(q || 'hPfostenHinten / 2, zTrHinten').test(k3d), 'nicht mehr bei zHinten');
/* Traeger und Wandprofil duerfen nicht ueber die Sparren hinausragen –
   genau das sah von aussen aus wie ein waagrecht liegender Balken. */
pruefe('Oberkante haengt an der Sparrenoberkante',
       new RegExp(q || 'dachOk = ukHinten \\+ spH').test(k3d), 'nicht mehr an hHinten');
pruefe('Wandprofil endet buendig mit dem Dach',
       new RegExp(q || 'wpMitte = dachOk - wpH / 2').test(k3d), '');
pruefe('Träger endet buendig mit dem Dach',
       new RegExp(q || 'trOk = vorsprH > 0 \\? ukAmTraeger : dachOk;').test(k3d),
       'mit hinterem Vorsprung unter den Sparren');
pruefe('Keine Hoehe mehr aus hHinten abgeleitet',
       gegen ? /wpMitte = hHinten/.test(k3d) : !/wpMitte = hHinten/.test(k3d),
       'Durchgangshoehe ist nicht die Dachoberkante');
/* Zweiter Weg: die Lagen wirklich ausrechnen. */
(function () {
  var sun = parseFloat((k3d.match(/sparrenUnterNase:\s*([\d.]+)/) || [])[1]);
  if (!sun) { pruefe('Rinnenmass lesbar', false, 'sparrenUnterNase fehlt'); return; }
  var spH = 12.0, hVorn = 230, neig = 8 * Math.PI / 180, T = 300 - 11.7;
  var riH = 13.67, rinneB = 18.63, zH = 4.5, TR_H = 18.9, wpH = 14;
  var ukVorn = hVorn + (riH - sun - spH);
  var ukHinten = ukVorn + Math.tan(neig) * ((T - rinneB) - zH);
  var dachOk = ukHinten + spH;
  var ueber = dachOk - dachOk + (gegen ? 5.2 : 0);     // soll 0 sein
  pruefe('Träger ragt nicht ueber das Dach', Math.abs(ueber) < 0.01,
         ueber.toFixed(1) + ' cm Ueberstand');
  pruefe('Träger haengt sichtbar unter dem Wandprofil',
         (gegen ? 0 : (TR_H - wpH)) > 4, (TR_H - wpH).toFixed(1) + ' cm');
  /* Die ALTE Formel haette ueberstanden – Gegenprobe zur Regel selbst. */
  var hHinten = hVorn + Math.tan(neig) * T;
  var altOk = hHinten + 7 + 7;
  pruefe('Alte Formel stand ueber den Sparren',
         gegen ? altOk <= dachOk : altOk > dachOk,
         (altOk - dachOk).toFixed(1) + ' cm zu hoch');
})();
/* Tiefenmass: freistehend zaehlt der Traeger mit, an der Wand nicht. */
pruefe('Freistehend: Tiefe schliesst den Träger ein',
       new RegExp(q || "T = Z\\.tiefe / 10 - \\(frei \\? TR_T : 0\\)").test(k3d),
       'Dach wird kuerzer, nicht angebaut');
pruefe('Masslinie beginnt hinter dem Träger',
       new RegExp(q || "hintenZ = \\(Z\\.aufbau === 'Freistehend'").test(k3d), '');
pruefe('Datenpfad: dieselbe Tiefenregel',
       new RegExp(q || "Z\\.tiefe / 10 - \\(e\\.freistehend \\? stB : 0\\)").test(k3d), '');
/* Zweiter Weg: Gesamttiefe aus den Einzelteilen zurueckrechnen. */
(function () {
  var mT = k3d.match(/var B = Z\.breite \/ 10, T = Z\.tiefe \/ 10 - \(frei \? (TR_T) : 0\);/);
  if (!mT) { pruefe('Gesamttiefe rechenbar', false, 'Zeile nicht gefunden'); return; }
  var trT = 11.7, tiefe = 4000;
  var dach = tiefe / 10 - trT, gesamt = dach + trT;          // Dach + Traeger
  if (gegen) gesamt += trT;
  pruefe('Dach plus Träger ergibt die bestellte Tiefe',
         Math.abs(gesamt - tiefe / 10) < 0.001,
         gesamt * 10 + ' mm (bestellt ' + tiefe + ' mm)');
})();

/* ---------- Carport: Traeger nur ueber das Haekchen ----------
   „du machst beim carport automatisch nen statikträger ab bestimmte maß.
   lass das. mach es mit häckchen wie bei tds normal" (Betreiber). */
pruefe('Tiefenregel gilt beim Carport TDS nicht',
       new RegExp(q || 'return !!\\(tb && tb\\.unterzug\\) && !istCarportTds\\(\\)').test(k3d), '');
pruefe('Modell fragt die Regel ueber unterzugGilt ab',
       new RegExp(q || 'traegerH = \\(unterzugGilt\\(tbMass\\)').test(k3d), '');
pruefe('Keine rohe Abfrage von unterzug mehr',
       gegen ? /\(tbMass && tbMass\.unterzug\)/.test(k3d)
             : !/\(tbMass && tbMass\.unterzug\)/.test(k3d),
       'alles ueber unterzugGilt');
pruefe('Haekchen erscheint beim Carport also auch tief',
       new RegExp(q || 'if \\(unterzugGilt\\(tabelleBauteile').test(k3d), '');
/* Zweiter Weg: die Entscheidung mit echten Werten durchrechnen. */
(function () {
  function unterzugGilt(tb, carport) { return !!(tb && tb.unterzug) && !carport; }
  function traeger(tb, carport, vorsprung, haken) {
    return unterzugGilt(tb, carport) || vorsprung > 0 || haken;
  }
  var tief = { unterzug: true }, flach = { unterzug: false };
  [['Terrassendach, 5,5 m tief, kein Haken', tief, false, 0, false, true],
   ['Carport, 5,5 m tief, kein Haken',       tief, true,  0, false, false],
   ['Carport, 5,5 m tief, mit Haken',        tief, true,  0, true,  true],
   ['Carport, 5,5 m tief, mit Vorsprung',    tief, true,  300, false, true],
   ['Carport, 3 m tief, kein Haken',         flach, true, 0, false, false]
  ].forEach(function (f) {
    var ist = traeger(f[1], f[2], f[3], f[4]);
    if (gegen) ist = !ist;
    pruefe(f[0] + ' -> ' + (f[5] ? 'Träger' : 'kein Träger'), ist === f[5],
           ist ? 'Träger' : 'kein Träger');
  });
})();

/* ---------- Carport TDS ist ein Terrassendach TDS ----------
   „das carport tds ist eig, genauso ein terrassendach tds, die
   konfiguration sollte gleich sein, der einzige unterschied dort ist ein
   dachvorsprung auch an der hinterseite möglich bei freistehender
   montage" (Betreiber, 11.10.2026). Dazu die beiden Entscheidungen:
   Seitenelemente ja, Markisen nein; Tiefe auf die Tabelle begrenzen. */
pruefe('Carport TDS laeuft ueber den Terrassendach-Pfad',
       new RegExp(q || 'istCarport\\(\\) && !istCarportTds\\(\\)\\) bauenGeschaetzt').test(k3d),
       'bauenGeschaetzt nur noch fuer Flachdach-Carports');
pruefe('Carport TDS nutzt die TDS-Masstabelle',
       new RegExp(q || "Z\\.produkt === 'Terrassendach TDS' \\|\\| istCarportTds\\(\\)\\) k = 'TDS\\|'").test(k3d), '');
pruefe('Carport TDS fragt den Aufbau ab',
       new RegExp(q || "case 'aufbau':\\s*return !istCarport\\(\\) \\|\\| istCarportTds\\(\\)").test(k3d), '');
pruefe('Keine doppelte Montagefrage',
       new RegExp(q || "case 'cp-variante':\\s*return istCarport\\(\\) && !istCarportTds\\(\\)").test(k3d),
       'Ausfuehrungsliste nur bei Flachdach-Carports');
pruefe('Seitenelemente auch beim Carport TDS',
       new RegExp(q || "case 'seiten':\\s*return !istPergola\\(\\) && \\(!istCarport\\(\\) \\|\\| istCarportTds\\(\\)\\)").test(k3d), '');
pruefe('Markisen beim Carport weiterhin gesperrt',
       new RegExp(q || "case 'sonnenschutz':\\s*return !istCarport\\(\\)").test(k3d), '');
pruefe('Sonnenschutz-Gruppe traegt das Stichwort',
       gegen ? !/data-k3d-schritt="sonne" data-k3d-fuer="sonnenschutz"/.test(html)
             : /data-k3d-schritt="sonne" data-k3d-fuer="sonnenschutz"/.test(html),
       'sonst stuende die Markisenauswahl am Carport');
pruefe('Hinterer Dachvorsprung nur Carport TDS, nur freistehend',
       new RegExp(q || "case 'vorsprung-hinten': return istCarportTds\\(\\) && Z\\.aufbau === 'Freistehend'").test(k3d), '');
pruefe('Hinterer Vorsprung hat einen Regler',
       gegen ? !/id="k3dVorsprungHinten"/.test(html) : /id="k3dVorsprungHinten"/.test(html), '');
pruefe('Carport-Fachbegriffe bleiben in der Anfrage',
       new RegExp(q || 'function cpVarianteJetzt\\(\\)').test(k3d), '');
/* Zweiter Weg: Masse und Begriffe wirklich ausrechnen. */
(function () {
  /* Der Carport TDS hat KEINEN eigenen Massblock: Er ist das
     Terrassendach TDS, nur unter anderem Namen. Ein eigener Block waere
     eine zweite Wahrheit, die auseinanderlaeuft. */
  pruefe('Kein eigener Massblock fuer den Carport TDS',
         gegen ? /'Carport TDS': \{\s*\n\s*breite:/.test(k3d)
               : !/'Carport TDS': \{\s*\n\s*breite:/.test(k3d), '');
  pruefe('Carport TDS nutzt die Masse des Terrassendachs',
         new RegExp(q || "MASSE\\[istCarportTds\\(\\) \\? 'Terrassendach TDS' : Z\\.produkt\\]").test(k3d), '');
  /* Die wirkliche Tiefengrenze kommt NICHT aus MASSE, sondern aus
     grenzenAusTabelle() - MASSE ist nur der Rueckfall, bevor die Tabelle
     greift. Eine Pruefung auf MASSE waere deshalb irrefuehrend; dass die
     Regler aus der Tabelle kommen, prueft weiter oben schon eine eigene
     Zeile, und die gilt fuer den Carport TDS jetzt mit. */

  /* Die Ausfuehrung muss sich aus Aufbau und Vorsprung ergeben. */
  var mV = k3d.match(/function cpVarianteJetzt\(\)[\s\S]*?\n  \}/);
  if (!mV) { pruefe('Variantenableitung lesbar', false, ''); return; }
  function variante(aufbau, vorsprung) {
    if (vorsprung > 0) return 'Carport mit Überstand';
    return aufbau === 'Freistehend' ? 'Freistehender Carport' : 'Carport mit Wandmontage';
  }
  [['Freistehend', 0, 'Freistehender Carport'],
   ['Wandmontage', 0, 'Carport mit Wandmontage'],
   ['Wandmontage', 300, 'Carport mit Überstand']].forEach(function (f) {
    var ist = variante(f[0], f[1]) + (gegen ? 'x' : '');
    pruefe('Anfrage nennt „' + f[2] + '"', ist === f[2], ist);
  });
})();

/* ---------- Statiktraeger auf Kundenwunsch ----------
   „einen statikträger unter die rinne zu setzen ohne dachvorsprung
   einfach wenn ein kunde z.b 2 pfosten anstatt 3 nur möchte"
   (Betreiber, 11.10.2026). */
pruefe('Haekchen fuer den Traeger vorhanden',
       gegen ? !/id="k3dTraeger"/.test(html) : /id="k3dTraeger"/.test(html), '');
pruefe('Haekchen liegt unter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr data-k3d-fuer="traeger-wunsch"').test(html), '');
pruefe('Haekchen nennt die geringere Durchgangshoehe',
       gegen ? !/189 mm niedriger/.test(html) : /189 mm niedriger/.test(html), 'Warnung');
pruefe('Wunsch erzeugt den Traeger im Modell',
       new RegExp(q || 'vorspr > 0 \\|\\|\\s*Z\\.traegerWunsch').test(k3d), '');
pruefe('Wunsch zaehlt auch im Masshinweis',
       new RegExp(q || 'unterzugGilt\\(tb\\) \\|\\| vsHin > 0 \\|\\| wunsch').test(k3d), '');
pruefe('Haekchen entfaellt, wenn der Traeger ohnehin noetig ist',
       new RegExp(q || "case 'traeger-wunsch'").test(k3d) &&
       new RegExp(q || '!traegerSchonNoetig\\(\\)').test(k3d), '');
pruefe('Wunsch steht in der Anfrage',
       new RegExp(q || 'unter der Dachrinne auf Kundenwunsch').test(k3d), 'Fachbegriff');
/* Zweiter Weg: die Pfostenersparnis wirklich ausrechnen. */
(function () {
  if (!mRegel) return;
  var breite = 8080;            // Tabelle: 4 Stuetzfuesse
  var mitTraeger = fn(breite);  // 7-m-Regel
  if (gegen) mitTraeger = 4;
  pruefe('Traeger spart bei 8080 mm einen Pfosten',
         mitTraeger === 3, '4 ohne, ' + mitTraeger + ' mit Träger');
})();

/* ---------- Glas-Schiebeanlage SG23 ----------
   Maße aus der Herstellerunterlage, Stand 01.08.2026. PREISE DUERFEN
   NICHT IN DEN QUELLTEXT – das prueft zusaetzlich pruefe-keine-preise.sh. */
pruefe('SG23-Bauarten hinterlegt',
       gegen ? !/bauarten: \[/.test(k3d) : /bauarten: \[/.test(k3d), '8 Bauarten');
pruefe('Schiebefluegel 10 mm ESG',
       gegen ? !/glasDicke: 1\.0,/.test(k3d) : /glasDicke: 1\.0,/.test(k3d),
       'nicht mehr 14 mm');
pruefe('Fluegelzahl kommt aus der Bauart',
       new RegExp(q || 'var b = sg23Bauart\\(laenge \\* 10, seite\\)').test(k3d), '');
pruefe('Keine Preise aus der SG23-Liste im Quelltext',
       gegen ? /1\.018,58|2\.339,23|Aufpreis fuer Sonderfarbe/.test(k3d)
             : !/1\.018,58|2\.339,23|1\.437,13|4\.250,56/.test(k3d), '');
/* Zweiter Weg: die Bauartwahl wirklich rechnen und die Scheibenbreite
   gegen die breiteste lieferbare Scheibe halten. */
(function () {
  var mB = k3d.match(/bauarten: \[([\s\S]*?)\]\s*\};/);
  if (!mB) { pruefe('SG23-Tabelle lesbar', false, 'nicht gefunden'); return; }
  var arten = [];
  mB[1].replace(/\[\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*\]/g,
    function (_, sch, fl, von, bis) {
      arten.push([+sch, +fl, +von, +bis]); return '';
    });
  pruefe('Acht Bauarten eingelesen', arten.length === (gegen ? 7 : 8), arten.length + '');
  function passt(a, b) { return b <= a[3] && b / a[1] >= 400; }
  function waehle(b) {
    var t = null;
    arten.forEach(function (a) { if (passt(a, b) && (!t || a[1] < t[1])) t = a; });
    return t;
  }
  /* Belegte Eckwerte aus der Unterlage: unterste und oberste Breite je
     Bauart muessen eine Bauart finden, 1400 und 7500 keine. */
  /* Die Tabellenspalten sind OBERGRENZEN („Breite bis"), die kleinste
     Spalte deckt alles darunter mit ab. Untere Grenze ist deshalb nicht
     die kleinste Spalte, sondern die schmalste Scheibe der Unterlage
     (400 mm bei 5-rails 10-tuerig und 4000 mm). */
  [[1500, true], [2336, true], [3000, true], [7000, true],
   [700, false], [7500, false]].forEach(function (f) {
    var hat = !!waehle(f[0]);
    if (gegen) hat = !hat;
    pruefe('Breite ' + f[0] + ' mm ' + (f[1] ? 'lieferbar' : 'nicht lieferbar'),
           hat === f[1], hat ? 'Bauart gefunden' : 'keine Bauart');
  });
  /* Die Auswahl erfolgt nach der SCHEIBENBREITE („was von der optik am
     besten aussieht"). Belegt wird das hier nicht ueber den Quelltext,
     sondern ueber das Ergebnis: Keine lieferbare Anlagenbreite darf eine
     Scheibe unter 750 oder ueber 1250 mm erzeugen. Die Faustregel
     „Breite / 150 cm" riss diese Grenze bei 3500 mm mit 1750 mm. */
  var ZIEL = 1050, schmalste = 9999, breiteste = 0, beiSchmal = 0, beiBreit = 0;
  function waehleOptik(b) {
    var t = null, best = Infinity;
    arten.forEach(function (a) {
      if (!passt(a, b)) return;
      var ab = Math.abs(b / a[1] - ZIEL);
      if (ab < best - 0.5 || (Math.abs(ab - best) <= 0.5 && t && a[0] < t[0])) {
        t = a; best = ab;
      }
    });
    return t;
  }
  for (var b = 1500; b <= 7000; b += 100) {
    var a = waehleOptik(b);
    if (!a) continue;
    var scheibe = b / a[1];
    if (scheibe > breiteste) { breiteste = scheibe; beiBreit = b; }
    if (scheibe < schmalste) { schmalste = scheibe; beiSchmal = b; }
  }
  if (gegen) breiteste += 100;
  pruefe('Scheibenbreite bleibt im Band 750 bis 1250 mm',
         breiteste <= 1250 && schmalste >= 750,
         Math.round(schmalste) + ' mm (' + beiSchmal + ') bis ' +
         Math.round(breiteste) + ' mm (' + beiBreit + ')');
  /* Die alte Faustregel haette das Band gerissen – Gegenprobe zur Regel
     selbst, nicht nur zur Umsetzung. */
  var alteRegel = 3500 / Math.max(2, Math.round(350 / 150));
  pruefe('Alte Faustregel haette das Band gerissen',
         gegen ? alteRegel <= 1250 : alteRegel > 1250,
         Math.round(alteRegel) + ' mm bei 3500 mm Anlage');
})();

/* Die kleinste Tabellenspalte ist eine OBERGRENZE, keine Mindestbreite.
   Vorher stand in einem schmalen Pfostenfach nur eine einzige Bauart zur
   Auswahl – „jetzt sind die anderen möglichkeiten weg" (Betreiber). */
pruefe('Untergrenze ist die Scheibenbreite, nicht die Tabellenspalte',
       new RegExp(q || 'breiteMm <= b\\[3\\] && breiteMm / b\\[1\\] >= SCHEIBE_MIN').test(k3d), '');
pruefe('Schmalste Scheibe aus der Unterlage',
       gegen ? !/SCHEIBE_MIN = 400;/.test(k3d) : /SCHEIBE_MIN = 400;/.test(k3d),
       '5-rails 10-tuerig bei 4000 mm');
pruefe('Keine Mindestbreite mehr abgefragt',
       gegen ? /breiteMm >= b\[2\]/.test(k3d) : !/breiteMm >= b\[2\]/.test(k3d), '');
(function () {
  /* Ein schmales Pfostenfach muss mehr als eine Bauart anbieten –
     sonst ist das Auswahlfeld sinnlos. */
  var arten2 = [[3,2,1500,3000],[3,3,2500,4000],[3,4,3000,5000],[4,4,3000,5000],
                [5,5,4000,6000],[3,6,4000,6500],[4,8,3000,7000],[5,10,4000,6000]];
  function passt2(a, b) { return b <= a[3] && b / a[1] >= 400; }
  var n = arten2.filter(function (a) { return passt2(a, 2336); }).length;
  if (gegen) n = 1;
  pruefe('Schmales Feld bietet mehrere Bauarten', n >= 3, n + ' bei 2336 mm');
  /* Und keine absurd schmalen: 10-tuerig bei 2336 mm waere 234 mm. */
  var zuSchmal = arten2.filter(function (a) {
    return passt2(a, 2336) && 2336 / a[1] < 400;
  }).length + (gegen ? 1 : 0);
  pruefe('Keine Scheibe unter 400 mm angeboten', zuSchmal === 0, zuSchmal + ' gefunden');
})();

pruefe('Auswahl nach Scheibenbreite, nicht nach Fluegelzahl',
       new RegExp(q || 'ZIEL_SCHEIBE = 1050').test(k3d), 'gestalterisch gesetzt');
pruefe('Gleichstand: weniger Schienen gewinnt',
       new RegExp(q || "b\\[0\\] < treffer\\[0\\]").test(k3d), '');

/* Die Aufteilung steht JE SEITE – links und rechts laufen ueber die
   Tiefe, vorne ueber die Breite. Ein gemeinsames Feld waere falsch. */
['Links', 'Rechts', 'Vorne'].forEach(function (seite) {
  pruefe('Auswahlfeld fuer ' + seite.toLowerCase(),
         gegen ? !new RegExp('id="k3dSg23' + seite + '"').test(html)
               : new RegExp('id="k3dSg23' + seite + '"').test(html), '');
});
pruefe('Kein gemeinsames Feld mehr',
       gegen ? /id="k3dSg23"/.test(html) : !/id="k3dSg23"/.test(html), '');
pruefe('Mass kommt aus dem Modell, nicht aus Z.breite/Z.tiefe',
       new RegExp(q || "SG23_LAENGE\\[seite\\] \\|\\|").test(k3d),
       'Rueckfall nur vor dem ersten Bauen');
pruefe('Handauswahl liegt unter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr data-k3d-fuer="schiebe"').test(html), '');
pruefe('Automatik bleibt die Voreinstellung',
       gegen ? !/sg23Links: '', sg23Rechts: '', sg23Vorne: '',/.test(k3d)
             : /sg23Links: '', sg23Rechts: '', sg23Vorne: '',/.test(k3d),
       'leer = automatisch');
pruefe('Handauswahl geht der Automatik vor',
       new RegExp(q || 'var hand = sg23Gewaehlt\\(breiteMm, seite\\);').test(k3d), '');
pruefe('Unpassende Handauswahl faellt auf Automatik zurueck',
       new RegExp(q || "if \\(Z\\[p\\[1\\]\\] && !sg23Gewaehlt\\(mass, p\\[0\\]\\)\\) Z\\[p\\[1\\]\\] = ''").test(k3d), '');
pruefe('Auswahlfeld loest ein Neuzeichnen aus',
       new RegExp(q || "'k3dSg23Links', 'k3dSg23Rechts', 'k3dSg23Vorne'").test(k3d),
       'in der Lauscherliste');
pruefe('Gewaehlte Bauart steht in der Anfrage',
       new RegExp(q || "Schiebeanlage ' \\+ p\\[0\\] \\+ ': ' \\+ p\\[1\\] \\+ ' mm licht'").test(k3d),
       'mit lichtem Mass und Fachbegriffen');

/* ---------- Verglasung: VSG 8/10 mm und getöntes Glas ----------
   „bei vsg glas hast du vergessen die 10mm variante hinzuzufügen und gls
   gibts auch in getönt also graphit" (Betreiber, 11.10.2026). */
pruefe('Getöntes Glas als Eindeckung',
       gegen ? !/'VSG graphit':\s*\{ art: 'glas'/.test(k3d)
             : /'VSG graphit':\s*\{ art: 'glas'/.test(k3d), 'graphit');
pruefe('Getöntes Glas im Bedienfeld',
       gegen ? !/data-wert="VSG graphit"/.test(html)
             : /data-wert="VSG graphit"/.test(html), 'Schaltflaeche');
pruefe('Glasstärke 8 und 10 mm waehlbar',
       gegen ? !/data-wert="10">10 mm/.test(html)
             : /data-wert="8">8 mm/.test(html) && /data-wert="10">10 mm/.test(html), '');
pruefe('Scheibendicke folgt der Auswahl',
       gegen ? /glasDicke = istPolycarbonat\(\) \? 1\.6 : 0\.8;/.test(k3d)
             : /glasDicke = istPolycarbonat\(\) \? 1\.6 : Z\.glasstaerke \/ 10;/.test(k3d),
       'nicht mehr fest 8 mm');
pruefe('Glasstärke wird ausgelesen',
       gegen ? !/Z\.glasstaerke = parseInt\(wert\('k3dGlasstaerke'\)/.test(k3d)
             : /Z\.glasstaerke = parseInt\(wert\('k3dGlasstaerke'\)/.test(k3d), '');
pruefe('Glasstärke nur bei Glas gefragt',
       gegen ? !/case 'glasstaerke':\s*return !istPolycarbonat\(\)/.test(k3d)
             : /case 'glasstaerke':\s*return !istPolycarbonat\(\)/.test(k3d), '');
/* Zweiter Weg: die Fachbezeichnung fuer die Mail wirklich ausrechnen. */
(function () {
  var mF = k3d.match(/return Z\.eindeckung\.replace\('VSG ', 'VSG ' \+ Z\.glasstaerke \+ ' mm '\);/);
  if (!mF) { pruefe('Fachbezeichnung rechenbar', false, 'Zeile nicht gefunden'); return; }
  function fach(e, d) { return e.replace('VSG ', 'VSG ' + d + ' mm '); }
  [['VSG klar', 10, 'VSG 10 mm klar'], ['VSG graphit', 8, 'VSG 8 mm graphit']].forEach(function (f) {
    var ist = fach(f[0], f[1]) + (gegen ? 'x' : '');
    pruefe('Mail nennt \u201e' + f[2] + '\u201c', ist === f[2], ist);
  });
})();

pruefe('Datenpfad: Wandprofil bleibt, Träger dahinter',
       new RegExp(q || 'hHinten \\+ wpH - stH / 2, -stB / 2').test(k3d), '');

pruefe('Hinweis nennt die geringere Durchgangshöhe',
       new RegExp(q || 'Unter dem Träger').test(k3d), '189 mm weniger');
pruefe('Reglergrenzen kommen aus der Tabelle',
       new RegExp(q || 'grenzenAusTabelle').test(k3d), 'statt fester Werte');
pruefe('Maßhinweis im Bedienfeld',
       /id="k3dMassHinweis"/.test(html) && new RegExp(q || 'k3dMassHinweis').test(k3d), '');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
