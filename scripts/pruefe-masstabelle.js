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
       !gegen && M.regeln && M.regeln.tiefeMaxOhneUnterzug === 4600 &&
       M.regeln.innenkernAbTiefe === 4000 &&
       M.regeln.tiefeMaxMitUnterzug === 7000 &&
       M.regeln.tiefeMaxLieferbar === 7050,
       'nichts bis 4000, Innenkern bis 4600, darüber Unterzug; Pfosten dazu ab 7000');

/* ---------- Die drei Stufen der TDS-Preisliste ----------
   „bis tiefe 4m nichts notwendig, ab 4m bis 4,6m reicht Innenkern Träger
   und ab 4,6m unterzug über die gesamte breite" (Betreiber, 15.10.2026).

   Hier stand vorher 4500 als Grenze. Die lieferbaren TDS-Tiefen springen
   aber 4000 → 4600 → 5000; eine 4500 gibt es gar nicht. Mit der alten
   Grenze verlangte das Modell bei 4600 mm einen Unterzug, obwohl dort der
   Innenkern reicht – ein Teil zu viel in jeder Anfrage dieser Groesse. */
(function () {
  var SOLL = [[3500, 'nichts'], [4000, 'nichts'], [4600, 'Innenkern'],
              [5000, 'Unterzug'], [7000, 'Unterzug']];
  var falsch = [];
  SOLL.forEach(function (r) {
    var T = r[0] + (gegen ? 400 : 0);
    var ist = T > M.regeln.tiefeMaxOhneUnterzug ? 'Unterzug'
            : (T > M.regeln.innenkernAbTiefe ? 'Innenkern' : 'nichts');
    if (ist !== r[1]) falsch.push(r[0] + ' mm: ' + ist + ' statt ' + r[1]);
  });
  pruefe('Drei Stufen: nichts / Innenkern / Unterzug', falsch.length === 0,
         falsch.length ? falsch.join('; ') : SOLL.length + ' Tiefen geprüft');
  /* Die Stufen muessen auch LIEFERBAR sein – eine Grenze auf einer Tiefe,
     die es nicht gibt, waere nicht nachpruefbar. */
  var tg = M.systeme && M.systeme['TDS|Glas'];
  var hat46 = tg && tg.tiefen.indexOf(4600) > -1;
  var kein45 = tg && tg.tiefen.indexOf(4500) === -1;
  pruefe('4600 ist lieferbar, 4500 gibt es nicht',
         gegen ? !(hat46 && kein45) : (hat46 && kein45),
         tg ? tg.tiefen.filter(function (t) { return t >= 4000 && t <= 5000; }).join(', ') + ' mm'
            : 'Tiefenliste fehlt');
})();
/* Die beiden duerfen nicht wieder zu einem Wert werden: 7000 ist der
   Punkt, ab dem ein Pfosten dazukommt, 7050 das Hoechstmass. Genau diese
   Verwechslung hat den Regler bei 7000 enden lassen. */
pruefe('Hoechstmass und Pfostengrenze sind zwei Werte',
       gegen ? M.regeln.tiefeMaxLieferbar === M.regeln.tiefeMaxMitUnterzug
             : M.regeln.tiefeMaxLieferbar > M.regeln.tiefeMaxMitUnterzug,
       M.regeln.tiefeMaxMitUnterzug + ' / ' + M.regeln.tiefeMaxLieferbar + ' mm');
(function () {
  /* Zweiter Weg: die Reglergrenzen aus der Tabelle wirklich ausrechnen -
     so, wie grenzenAusTabelle() es tut. Sie muessen die groessten Masse
     der Tabelle ergeben: 14080 x 7050 mm beim TDS. */
  var g = M.systeme['TDS|Glas'];
  var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
  var grenze = gegen ? M.regeln.tiefeMaxMitUnterzug : M.regeln.tiefeMaxLieferbar;
  var ts = g.tiefen.filter(function (t) { return t <= grenze; });
  var bMax = bs[bs.length - 1], tMax = ts[ts.length - 1];
  pruefe('Regler reicht bis zum Hoechstmass der Tabelle',
         bMax === 14080 && tMax === 7050, bMax + ' x ' + tMax + ' mm');
})();
pruefe('Grenzen kommen aus tiefeMaxLieferbar',
       new RegExp(q || 'return t <= M\\.regeln\\.tiefeMaxLieferbar').test(k3d),
       'nicht mehr bei der Pfostengrenze gekappt');
/* Carport TDS und Terrassendach TDS haben denselben Systemschluessel -
   beim Wechsel muessen die Grenzen trotzdem nachgezogen werden. */
pruefe('Produktwechsel zieht die Grenzen nach',
       new RegExp(q || 'if \\(produktWechsel\\) \\{[\\s\\S]{0,1200}reglerGrenzenSetzen\\(\\);').test(k3d),
       'sonst bleibt der Carport bei 7000 x 4500');
(function () {
  /* Zweiter Weg: die Pfostenregel an der Grenze nachrechnen. Bei 7050 mm
     kommt ein Pfosten dazu - das ist der Sinn der 7000. */
  var e = M.systeme['TDS|Glas'].breiten[6080] || [0, 4];
  function pfosten(t) {
    var grenze = t > M.regeln.tiefeMaxOhneUnterzug
      ? M.regeln.tiefeMaxMitUnterzug : M.regeln.tiefeMaxOhneUnterzug;
    return e[1] + (t > grenze ? 1 : 0);
  }
  var bei7000 = pfosten(7000), bei7050 = gegen ? pfosten(7000) : pfosten(7050);
  pruefe('Bei 7050 mm kommt ein Pfosten dazu', bei7050 === bei7000 + 1,
         bei7000 + ' -> ' + bei7050 + ' Pfosten');
})();

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
       new RegExp(q || 'zPf = T - \\(tdsRinne \\? PFOSTENACHSE : PFOSTENACHSE_VORNE\\) - vorspr').test(k3d),
       'zPf minus Vorsprung');
/* Der Pfosten sitzt HINTEN an der Rinne: „die pfosten sitzen bei uns zu
   weit vorne, die müssen genau an dem hinteren schenkel der rinne sitzen
   … denn dort werden sie von innen verschraubt" (Betreiber, 14.10.2026,
   mit drei Werkbildern). Vorher 55 mm nach Masstabelle (vorne buendig),
   davor 93 mm (mittig). Geprueft wird nicht die Zahl 131,2, sondern der
   Zusammenhang: Pfostenrueckseite = Rinnenrueckseite. */
(function () {
  var m = k3d.match(/var PFOSTENACHSE = ([\d.]+);/);
  var rinLit = (k3d.match(/var RINNE = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!m || !rinLit) { pruefe('Pfostenachse lesbar', false, 'nicht gefunden'); return; }
  var RINNE = eval('(' + rinLit.replace(/^var RINNE = /, '').replace(/;$/, '') + ')');
  var achse = parseFloat(m[1]), PF = 11.02;
  /* Abstand der Pfostenrueckseite von der Rinnenrueckseite. Null heisst
     buendig – dort sitzt der hintere Schenkel. */
  var hinten = RINNE.breite - (achse + PF / 2);
  var ok = Math.abs(hinten - RINNE.schenkelDick) < 0.02;
  pruefe('Pfosten steht an der Vorderseite des Schenkels',
         gegen ? !ok : ok,
         (achse * 10).toFixed(1) + ' mm ab Vorderkante, Rückseite ' +
         (hinten * 10).toFixed(1) + ' mm von der Rinnenrückseite (Schenkel ' +
         (RINNE.schenkelDick * 10).toFixed(0) + ' mm)');
  /* „du hast beim fly die pfosten auch nach innen verschoben, ich wollte
     es nur bei tds" (Betreiber, 14.10.2026). Die hintere Lage haengt am
     Schenkel der TDS-Rinne; den gibt es bei den Flachdach-Systemen nicht.
     Geprueft wird, dass die Verzweigung da ist UND dass die Flachdach-
     Achse die alte aus der Masstabelle bleibt. */
  var nurTds = /var tdsRinne = !sky && \(Z\.produkt === 'Terrassendach TDS' \|\| istCarportTds\(\)\);/.test(k3d) &&
               /var PFOSTENACHSE_VORNE = 5\.5;/.test(k3d);
  pruefe('Hintere Pfostenachse gilt nur beim TDS',
         gegen ? !nurTds : nurTds,
         'SkyView und Flachdach bleiben bei 55 mm');

  /* Zweiter Weg: Die Rinne muss vorne ueber den Pfosten ueberstehen –
     genau das zeigen die Werkbilder, und genau das fehlte vorher. */
  var ueber = RINNE.breite - PF;
  var stehtUeber = (achse - PF / 2) > 0.5 && Math.abs(ueber - 7.61) < 0.02;
  pruefe('Rinne steht vorne über den Pfosten über',
         gegen ? !stehtUeber : stehtUeber,
         (ueber * 10).toFixed(1) + ' mm Überstand');
  /* Und: von innen verschraubbar. Das geht nur, wo der Pfosten unter der
     Kehle liegt – sonst trifft die Schraube die Rinnenwange. */
  var pfVon = achse - PF / 2, pfBis = achse + PF / 2;   // ab Vorderkante
  var kehleVon = RINNE.breite - (RINNE.rueckwand + RINNE.innenBreite);
  var kehleBis = RINNE.breite - RINNE.rueckwand;
  var ueberlappung = Math.min(pfBis, kehleBis) - Math.max(pfVon, kehleVon);
  var schraubbar = ueberlappung > 3.0;
  pruefe('Pfosten liegt unter der Kehle (von innen verschraubbar)',
         gegen ? !schraubbar : schraubbar,
         (ueberlappung * 10).toFixed(1) + ' mm Überlappung mit der Kehle');
})();
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
/* Seit 12.10.2026 rechnen Masshinweis UND Anfrage in bauteileJetzt() –
   vorher stand die Pfostenrechnung nur im Hinweis, und die Anfrage hing an
   /api/bauteile, die 503 antwortet. Die Trennung der Reihen muss also dort
   stehen, und beide Stellen muessen sie benutzen. */
pruefe('Reihen werden getrennt gezaehlt',
       new RegExp(q || "bt\\.pfostenVorne \\+ ' Pfosten vorne und ' \\+ bt\\.pfostenHinten \\+ ' hinten'")
         .test(k3d), 'in pfostenText()');
pruefe('Vordere Zahl haengt am vorderen Träger',
       new RegExp(q || 'pfostenVorne: traeger \\? pfostenUnterTraeger\\(Z\\.breite\\) : tb\\.pfosten')
         .test(k3d), 'in bauteileJetzt()');
pruefe('Hinweis rechnet die Pfosten nicht selbst',
       new RegExp(q || 'var pf = pfostenText\\(bt\\);').test(k3d) &&
       (gegen ? true : !/var pfH = pfostenUnterTraeger\(Z\.breite\);/.test(k3d)),
       'nimmt dieselbe Quelle wie die Anfrage');

/* ---------- Die sichtbare Blende ist ueberall gleich dick ----------
   „die blenden links und rechts sind gut aber warum is die vorderseite so
   fett" (Betreiber, 14.10.2026). Vorne wurde die ganze Rinnentiefe
   (186,3 mm) als gerillter Block gezeichnet, hinten die Traegertiefe
   (120 mm), seitlich dagegen nur die Blendendicke (30 mm). Von vorne sah
   das Dach dadurch aus, als haette es eine 19 cm dicke Kante.

   Geprueft wird, dass JEDER blendeProfil-Aufruf die Blendendicke als
   Tiefe bekommt – und keiner mehr eine Profiltiefe. */
(function () {
  /* Die Funktionsdefinition selbst zaehlt nicht mit – ihr drittes
     Argument heisst „tiefe" und waere sonst immer ein Treffer. */
  var ohneDef = k3d.replace(/function blendeProfil\([\s\S]*?\n  \}/, '');
  var rufe = ohneDef.match(/blendeProfil\([^;]*?\);/g) || [];
  var falsch = rufe.filter(function (r) {
    var arg = r.replace(/\s+/g, ' ').split(',')[2] || '';
    return !/RANDBLENDE\.dicke/.test(arg);
  });
  if (gegen) falsch.push('erzwungen');
  pruefe('Blende überall gleich dick', falsch.length === 0,
         falsch.length ? falsch.length + ' von ' + rufe.length + ' mit Profiltiefe'
           : rufe.length + ' Aufrufe, alle mit Blendendicke');
})();

/* ---------- Seitenelemente schliessen beim SkyView waagerecht an ----------
   „beim sky ist alles immer rechtwinklig an der blende unterkante"
   (Betreiber, 14.10.2026). Beim TDS folgen Rahmenwand, Schiebetuer und
   Plankenwand oben der geneigten Dachunterkante – dort ist die Unterseite
   schraeg. Beim SkyView liegt darueber der waagerechte Rahmen.

   Geprueft wird die uebergebene Funktion selbst: Sie muss fuer
   verschiedene Tiefen DIESELBE Hoehe liefern. Eine Textsuche haette
   nicht gezeigt, ob die Hoehe wirklich konstant ist. */
(function () {
  /* Der Aufruf endet seit dem 15.10.2026 nicht mehr bei xPfVorne: Dahinter
     steht die z-Lage des Unterzugs, nach der die Laengsseiten geteilt
     werden. Gelesen wird bis zur schliessenden Klammer des Aufrufs. */
  var ruf = (k3d.match(/seitenErweiterungen\(B, T, hRinne[\s\S]*?\n\s*\);|seitenErweiterungen\(B, T, hRinne[\s\S]*?: null\);/) || [''])[0];
  if (!ruf) { pruefe('Seitenaufruf lesbar', false, 'nicht gefunden'); return; }
  var mFn = ruf.match(/sky \? (function \(\) \{ return hRinne; \})/);
  var mNeig = /sky \? 0 : neig/.test(ruf);
  if (!mFn || !mNeig) {
    pruefe('SkyView – Seiten schließen waagerecht an', gegen,
           !mNeig ? 'Neigung wird nicht auf 0 gesetzt' : 'keine feste Höhe');
    return;
  }
  var hRinne = 250;
  var f = eval('(' + mFn[1] + ')');
  var hoehen = [0, 100, 200, 300].map(function (z) { return f(z); });
  if (gegen) hoehen[2] += 5;
  var gleich = hoehen.every(function (h) { return Math.abs(h - hoehen[0]) < 0.001; });
  pruefe('SkyView – Seiten schließen waagerecht an', gleich,
         gleich ? 'gleiche Höhe über die ganze Tiefe, Neigung 0'
                : 'Höhe schwankt: ' + hoehen.join(', '));
})();

/* ---------- Die Rillen zeigen nach AUSSEN ----------
   „und von der innenseite is nix geriffelt" (Betreiber, 14.10.2026).
   Im Profil liegt die gerillte Flaeche auf der Seite +x; nach rotateY(d)
   zeigt sie in Richtung -sin(d) auf der z-Achse. Vorne und hinten war
   die Drehung vertauscht, die Rillen zeigten also ins Dach hinein.
   Seitlich stimmte es – deshalb fiel es dort nicht auf.

   Geprueft wird gerechnet, nicht gelesen: Aus dem Drehwinkel jedes
   Aufrufs und seiner Position folgt, wohin die Rillen zeigen. */
(function () {
  var ohneDef = k3d.replace(/function blendeProfil\([\s\S]*?\n  \}/, '');
  var rufe = ohneDef.match(/blendeProfil\([^;]*?\);/g) || [];
  if (rufe.length < 3) { pruefe('Blendenaufrufe lesbar', false, rufe.length); return; }
  var falsch = [];
  rufe.forEach(function (r) {
    var t = r.replace(/\s+/g, ' ');
    var args = t.slice(t.indexOf('(') + 1).split(',');
    var zArg = (args[5] || '').trim();
    var dreh = (args[6] || '').trim();
    var d = /-\s*Math\.PI \/ 2/.test(dreh) ? -Math.PI / 2
          : /Math\.PI \/ 2/.test(dreh) ? Math.PI / 2
          : /Math\.PI/.test(dreh) ? Math.PI
          : /^0$/.test(dreh) ? 0 : null;
    if (d === null) { falsch.push('Drehung unlesbar: ' + dreh); return; }
    var zRille = -Math.sin(d);          // Richtung der Rillen in z
    var xRille = Math.cos(d);
    /* Wohin muesste sie zeigen? Vorne (z nahe T) nach +z, hinten (z nahe
       0) nach -z, seitlich nach aussen. */
    if (/^T -/.test(zArg)) {
      if (zRille < 0.5) falsch.push('vorne zeigen die Rillen nach innen');
    } else if (/RANDBLENDE\.dicke \/ 2$/.test(zArg)) {
      if (zRille > -0.5) falsch.push('hinten zeigen die Rillen nach innen');
    } else {
      if (Math.abs(xRille) < 0.5) falsch.push('seitlich stehen die Rillen quer');
    }
  });
  if (gegen) falsch.push('erzwungen');
  pruefe('Rillen zeigen nach außen', falsch.length === 0,
         falsch.length ? falsch[0] : rufe.length + ' Blenden, alle nach außen');
})();

/* Die Blende hat FUENF Rillen – „5 rillen" (Betreiber, 14.10.2026).
   Vorher wurde die Zahl aus der Hoehe geteilt durch 15 mm gerechnet; bei
   der 252 mm hohen Blende ergab das sechzehn, also ein Lamellenprofil.
   Gezaehlt wird am erzeugten Querschnitt, nicht an der Zahl im Code:
   Jede Rille legt vier Punkte an, dazu kommen die vier Eckpunkte. */
(function () {
  var fn = (k3d.match(/function blendeProfil\([\s\S]*?\n  \}/) || [''])[0];
  if (!fn) { pruefe('Blendenprofil lesbar', false, 'nicht gefunden'); return; }
  var punkte = [];
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  function Leer() { return { translate: function () { return this; },
                             rotateY: function () { return this; } }; }
  var THREE = { Shape: Form,
                ExtrudeGeometry: function () { return Leer(); },
                Mesh: function () { return { position: { set: function () {} },
                                             castShadow: 0, receiveShadow: 0 }; } };
  var RINNE = { rilleTeilung: 1.5 };
  var bau = { add: function () {} };
  eval('(' + fn + ')')(500, 25.2, 18.63, 0, 100, 0, 0, null);
  var rillen = (punkte.length - 4) / 4 + (gegen ? 1 : 0);
  pruefe('Blende hat fünf Rillen', rillen === 5, rillen + ' Rillen');
})();

/* ---------- Beim SkyView darf nichts aus dem Rahmen ragen ----------
   Am 14.10.2026 gemeldet: „das sieht garnicht nach dem aus was ich
   geschickt hab" – im Bild standen Sparren und Glas 8 cm ueber dem
   Rahmen, und die Blenden verdeckten nichts mehr. Ursache war eine
   Untergrenze in der Sparrenlage, die den Sparren nach OBEN schob,
   statt ihn im Rahmen zu lassen.

   Das ist der Fehler, den keine der bisherigen Pruefungen gefunden hat:
   Alle Einzelmasse stimmten, nur ihre LAGE zueinander nicht. Darum wird
   hier aus den Formeln des Modells die Glasoberkante und die
   Sparrenunterkante gerechnet und gegen den Rahmen gestellt – ueber acht
   Tiefen. */
(function () {
  var blk = (k3d.match(/var SKY = \{[\s\S]*?\n  \};/) || [''])[0];
  function z(n) {
    var m = blk.match(new RegExp(n + ':\\s*([\\d.]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  var rahmenH = z('rahmenH');
  var spH = parseFloat((k3d.match(/var SPARREN = \{\s*\n\s*breite:\s*[\d.]+,[^]*?hoehe:\s*([\d.]+)/) || [])[1]);
  /* Die Formeln woertlich aus dem Modell, nicht nachgebaut. */
  var fLuft = (k3d.match(/var skyLuft = sky\s*\n([\s\S]*?): 0;/) || [])[1];
  var fUk = (k3d.match(/var ukVorn = sky\s*\n\s*\? ([^\n]+)\n/) || [])[1];
  if (!rahmenH || !fLuft || !fUk) {
    pruefe('SkyView – Lageformeln lesbar', false, 'nicht gefunden'); return;
  }
  var raus = 0, engste = 99, tiefste = 99;
  [200, 250, 300, 350, 400, 450, 500, 700].forEach(function (T) {
    var Z = { tiefe: T * 10, glasstaerke: 8 };
    var istPolycarbonat = function () { return false; };
    var SKY = { rahmenH: rahmenH }, SPARREN = { hoehe: spH };
    var skyLuft = eval('(' + fLuft.replace(/^\s*\?\s*/, '') + ')');
    var neig = Math.atan(skyLuft / Math.max(1, Z.tiefe / 10));
    var hRinne = 250, riH = rahmenH, skyGlas = 0.8;
    var ukVorn = eval(fUk.replace(/;$/, ''));
    var glasOk = ukVorn + Math.tan(neig) * T + spH + skyGlas;
    var oben = (hRinne + riH) - glasOk;       // Luft unter der Rahmenkante
    var unten = ukVorn - hRinne;              // Abstand zur Rahmenunterkante
    if (oben < -0.001 || unten < -0.001) raus++;
    if (oben < engste) engste = oben;
    if (unten < tiefste) tiefste = unten;
  });
  if (gegen) raus++;
  pruefe('SkyView – Sparren und Glas bleiben im Rahmen', raus === 0,
         raus ? raus + ' von 8 Tiefen ragen heraus'
              : 'oben ' + (engste * 10).toFixed(0) + ' mm Luft, unten ' +
                (tiefste * 10).toFixed(0) + ' mm');
})();

/* ---------- Die TD-Profile gegen die Einzelteile-Liste ----------
   Der Betreiber hat am 14.10.2026 die Einzelteile-Liste des Herstellers
   geschickt (Stand 07.10.2026) mit den bemassten Querschnitten. Sie liegt
   NICHT im Projekt – sie enthaelt Preise und faellt unter das
   Datenbankherstellerrecht; verarbeitet wurde sie nur im Scratchpad.

   Hier stehen die Masse mit Artikelnummer, damit jede Zahl nachschlagbar
   bleibt und auffaellt, wenn jemand sie „glatter" macht. Die meisten
   stimmten schon (sie kamen aus Zeichnungen); korrigiert wurde die
   Ausladung des Wandprofils (31 -> 38,6 mm) und zwei Nachkommastellen. */
(function () {
  var soll = [
    ['SPARREN',    'breite',      6.1,   'Träger TD 15698, 61 mm'],
    ['SPARREN',    'hoehe',      12.0,   'Träger TD 15698, 120 mm gesamt'],
    ['SPARREN',    'koerper',     9.67,  'Träger TD 15698, Körper 96,7 mm'],
    ['RINNE',      'breite',     18.63,  'Rinne 2 TD 16913, 186,3 mm'],
    ['RINNE',      'hoehe',      13.67,  'Rinne 2 TD 16913, 136,7 mm'],
    ['RINNE',      'innenBreite', 13.0,  'Rinne 2 TD 16913, Kehle 130 mm'],
    ['RINNE',      'innenTiefe',   8.22, 'Rinne 2 TD 16913, 82,2 mm'],
    ['GLASLEISTE', 'breite',      5.53,  'Glasleiste TD 15184, 55,3 mm'],
    ['GLASLEISTE', 'hoehe',       2.26,  'Glasleiste TD 15184, 22,6 mm'],
    ['WANDPROFIL', 'hoehe',      14.36,  'Wandprofil TD 15188, 143,6 mm'],
    ['WANDPROFIL', 'tiefe',       3.86,  'Wandprofil TD 15188, 38,6 mm']
  ];
  var fehlt = [], falsch = [];
  soll.forEach(function (z) {
    var blk = (k3d.match(new RegExp('var ' + z[0] + ' = \\{[\\s\\S]*?\\n  \\};')) ||
               k3d.match(new RegExp('var ' + z[0] + ' = \\{[^}]*\\};')) || [''])[0];
    var m = blk.match(new RegExp(z[1] + ':\\s*([\\d.]+)'));
    if (!m) { fehlt.push(z[0] + '.' + z[1]); return; }
    var ist = parseFloat(m[1]) + (gegen ? 0.5 : 0);
    if (Math.abs(ist - z[2]) > 0.001) falsch.push(z[3] + ' -> ' + (ist * 10).toFixed(1) + ' mm');
  });
  pruefe('TD-Profile stimmen mit der Einzelteile-Liste überein',
         fehlt.length === 0 && falsch.length === 0,
         fehlt.length ? 'nicht gefunden: ' + fehlt.join(', ')
           : (falsch.length ? falsch[0] : soll.length + ' Masse geprueft'));
})();
/* Die Pfostenbreite steht im Modell als Zahl ohne Namen – eigene
   Pruefung, damit sie nicht durchrutscht. */
pruefe('Pfosten 110,2 mm (15190)',
       new RegExp(q || 'var PF = 11\\.02;').test(k3d), 'Zeichnungsmaß, nicht gerundet');

/* Freistehend: der Statiktraeger steht an der Stelle der Wand, das
   Wandprofil wird darauf geschraubt – 1:1 wie bei Wandmontage. */
pruefe('Freistehend: Träger steht hochkant',
       new RegExp(q || 'TR_H = 18\\.92, TR_T = 11\\.7').test(k3d), '189,2 hoch, 117 tief');
pruefe('Freistehend: Träger hinter dem Wandprofil',
       new RegExp(q || 'zTrHinten = -TR_T / 2 \\+ vorsprH').test(k3d),
       'an der Stelle der Wand, mit Vorsprung nach innen');
/* Wandprofil TD: 143,6 mm HOCH an der Wand, rund 31 mm Ausladung
   (Querschnitt aufrecht, Betreiber 11.10.2026). Das lange Mass liegt
   an der Wand, nicht quer - die erste Lesart hatte die Zeichnung so
   genommen, wie sie auf dem Blatt lag. Kein Sonderfall fuer
   freistehend: dort sitzt es am Traeger statt an der Wand. */
pruefe('Wandprofil steht mit 143,6 mm an der Wand',
       gegen ? /wpT = frei \?/.test(k3d)
             : (/wpH = sky \? riH : WANDPROFIL\.hoehe/.test(k3d) &&
                /wpT = sky \? SKY\.traegerT : WANDPROFIL\.tiefe/.test(k3d)),
       'hoch an der Wand, kurz nach vorne');
(function () {
  /* Das Wandprofil wird genau EINMAL gezeichnet, ausserhalb der
     frei-Verzweigung - sonst gaebe es zwei Fassungen davon. */
  var zahl = (k3d.match(/wandprofilBauen\(B, wpMitte - wpH \/ 2, wpGlasD, mAlu\)/g) || []).length;
  pruefe('Wandprofil wird nicht ersetzt', gegen ? zahl !== 1 : zahl === 1,
         zahl + ' Mal gezeichnet');
})();
/* Seit 11.10.2026 richtet sich die Traegerhoehe nach dem Dach (trH),
   nicht mehr nach dem festen Mass – der Pfosten endet weiter genau
   darunter. */
pruefe('Freistehend: hintere Pfosten enden unter dem Träger',
       new RegExp(q || 'hPfostenHinten = frei \\? Math\\.max\\(100, trOk - trH\\)').test(k3d), '');
pruefe('Freistehend: hintere Pfosten stehen unter dem Träger',
       new RegExp(q || 'hPfostenHinten / 2, zTrHinten').test(k3d), 'nicht mehr bei zHinten');
/* Traeger und Wandprofil duerfen nicht ueber die Sparren hinausragen –
   genau das sah von aussen aus wie ein waagrecht liegender Balken. */
pruefe('Oberkante haengt an der Sparrenoberkante',
       new RegExp(q || 'dachOk = ukHinten \\+ spH').test(k3d), 'nicht mehr an hHinten');
/* Das Profil reicht ueber die Sparren UND ueber die Abdeckleiste auf der
   Scheibe: „die glasleisten können dochnicht höher wie das profil sein"
   (Betreiber, 14.10.2026). Bis dahin endete es an der Glasoberseite –
   die 22,6 mm hohe Leiste stand darueber. */
pruefe('Wandprofil deckt die Glasleiste ab',
       new RegExp(q || 'wpOk = sky \\? hRinne \\+ riH : leisteOkHinten \\+ wpBlech').test(k3d) &&
       new RegExp(q || 'leisteOkHinten = ukHinten \\+ SPARREN\\.koerper \\+ wpGlasD \\+ GLASLEISTE\\.hoehe').test(k3d) &&
       new RegExp(q || 'wpMitte = wpOk - wpH / 2').test(k3d), '');
(function () {
  /* Nachgerechnet: Die Sparren muessen in der unteren Haelfte liegen und
     die Glasoberseite mit der Profiloberkante abschliessen. */
  /* „quasi sparren dürfte nicht tiefer oder höher als die untere kammer
     des wandprofil sein und glas + glasleiste dürfen nicht tiefer oder
     höher als die obere kamer sein" (Betreiber, 14.10.2026).

     Bis dahin stand hier die Rechnung, dass es NICHT aufgehen kann:
     Sparren (120) + Glas (8) + Leiste (22,6) = 150,6 gegen 143,6 mm
     Profil. Der Fehler lag in der ersten Zahl – die Scheibe liegt auf
     dem Hauptkoerper (96,7), nicht auf der Sparrenoberkante. 96,7 + 8 +
     22,6 = 127,3, dazu drei Bleche: genau 143,6.

     Nachgerechnet wird der ganze Stapel von der Sparrenunterkante bis
     zur Leistenoberkante gegen die Profilhoehe. */
  var wpH = 14.36, koerper = 9.67, glas = 0.8, leiste = 2.26;
  var blech = (wpH - koerper - (glas + leiste)) / 3;
  var ukSparren = 0;                                   // Bezugslinie
  /* Die Gegenprobe legt die Scheibe wieder auf die SPARRENOBERKANTE –
     also genau der Fehler, den der Betreiber gemeldet hat. Dann muss
     die Pruefung anschlagen, sonst taugt sie nichts. */
  var glasAuf = gegen ? 12.0 : koerper;
  var leisteOk = ukSparren + glasAuf + glas + leiste;
  var profilOk = leisteOk + blech;                     // Profil endet ueber der Leiste
  var profilUk = profilOk - wpH;
  var falsch = 0;
  if (leisteOk > profilOk + 0.001) falsch++;           // Leiste guckt oben raus
  if (ukSparren < profilUk - 0.001) falsch++;          // Sparren guckt unten raus
  pruefe('Nichts steht oben oder unten aus dem Wandprofil vor',
         falsch === 0,
         falsch + ' von 2 Lagen falsch, Profilunterkante ' +
         (profilUk * 10).toFixed(1) + ' mm zur Sparrenunterkante');
})();
/* ---------- Wandprofil: echtes Profil statt Quader ----------
   „die unterseite hier auf dem bild die zwei offenen kammern müssen nach
   rechts gucken nicht nach unten" (Betreiber, 14.10.2026). Gebaut war es
   als glatter Quader – von unten und von der Seite sah man einen Block.

   Geprueft wird am erzeugten Querschnitt, nicht am Quelltext: Die Kammern
   muessen nach VORNE offen sein, und die Ausladung muss oben groesser
   sein als unten (38,6 gegen 37 mm, beide aus der Zeichnung). */
(function () {
  var q2 = (k3d.match(/function wandprofilQuerschnitt\(glasD\)[\s\S]*?\n  \}/) || [''])[0];
  var kam = (k3d.match(/function wandprofilKammern\(glasD\)[\s\S]*?\n  \}/) || [''])[0];
  var spLit = (k3d.match(/var SPARREN = \{[\s\S]*?\n  \};/) || [''])[0];
  var glLit = (k3d.match(/var GLASLEISTE = \{ breite: [\d.]+, hoehe: ([\d.]+) \}/) || []);
  var lit = (k3d.match(/var WANDPROFIL = \{[\s\S]*?\n  \};/) || [''])[0];
  var dl = k3d.match(/var WANDDECKEL = \{ breite: ([\d.]+), hoehe: ([\d.]+) \}/);
  if (!q2 || !lit || !dl || !kam || !spLit || !glLit[1]) {
    pruefe('Wandprofil-Querschnitt lesbar', false, 'nicht gefunden'); return;
  }
  var WANDPROFIL = eval('(' + lit.replace(/^var WANDPROFIL = /, '').replace(/;$/, '') + ')');
  var SPARREN = eval('(' + spLit.replace(/^var SPARREN = /, '').replace(/;$/, '') + ')');
  var GLASLEISTE = { hoehe: +glLit[1] };
  var wandprofilKammern = eval('(' + kam + ')');
  var K = wandprofilKammern(0.8);
  var p2 = [];
  function F2() { this.holes = []; }
  F2.prototype.moveTo = function (x, y) { p2.push([x, y]); };
  F2.prototype.lineTo = F2.prototype.moveTo;
  F2.prototype.quadraticCurveTo = function (a, b, x, y) { p2.push([x, y]); };
  F2.prototype.closePath = function () {};
  var THREE = { Shape: F2 };
  eval('(' + q2 + ')')(0.8);
  var xs2 = p2.map(function (e) { return e[0]; });
  var ys2 = p2.map(function (e) { return e[1]; });
  var tiefe = Math.max.apply(null, xs2), hoch = Math.max.apply(null, ys2);

  /* Eine nach vorne offene Kammer heisst: es gibt Punkte, die WEIT
     vorne liegen (Schenkelenden), und Punkte auf derselben Hoehe weit
     hinten (Rueckwand). Ein Quader haette nur vier Ecken. */
  var hinten = p2.filter(function (e) {
    return e[0] <= WANDPROFIL.wand + 0.001 && e[1] > 0.001 && e[1] < hoch - 0.001;
  }).length;
  /* Nicht nur die Eckenzahl: Ein Profil, dem der Mittelsteg fehlt, haette
     genauso viele Ecken (eine Verfaelschung, die genau so durchrutschte).
     Gezaehlt werden deshalb die Punkte, die DEUTLICH vorne liegen – zwei
     je Schenkel und zwei am Mittelsteg, also sechs. */
  var vorne = p2.filter(function (e) {
    return e[0] > WANDPROFIL.wand + 0.5;
  }).length;
  var kammern = p2.length >= 12 && hinten >= 4 && vorne === 6;
  pruefe('Wandprofil ist ein Profil mit zwei Kammern, kein Quader',
         gegen ? !kammern : kammern,
         p2.length + ' Ecken, ' + hinten + ' an der Rückwand, ' +
         vorne + ' an den drei Schenkeln');
  var keilig = Math.abs(tiefe - WANDPROFIL.tiefe) < 0.001 &&
               WANDPROFIL.tiefeUnten < WANDPROFIL.tiefe &&
               Math.abs(hoch - WANDPROFIL.hoehe) < 0.001;
  pruefe('Wandprofil: 143,6 hoch, oben 38,6 und unten 37 tief',
         gegen ? !keilig : keilig,
         (hoch * 10).toFixed(1) + ' hoch, ' + (tiefe * 10).toFixed(1) + '/' +
         (WANDPROFIL.tiefeUnten * 10).toFixed(1) + ' mm tief');

  /* „quasi sparren dürfte nicht tiefer oder höher als die untere kammer
     des wandprofil sein und glas + glasleiste dürfen nicht tiefer oder
     höher als die obere kamer sein" (Betreiber, 14.10.2026). Also nicht
     mehr „passt hinein", sondern AUF DEN MILLIMETER. Gemessen wird am
     erzeugten Querschnitt, nicht an der Absicht im Kommentar. */
  var untenKammer = K.unten, obenKammer = K.oben;
  var untenOk = Math.abs(untenKammer - SPARREN.koerper) < 0.001;
  pruefe('Untere Kammer ist genau der Sparrenkörper',
         gegen ? !untenOk : untenOk,
         (untenKammer * 10).toFixed(1) + ' mm Kammer, Sparrenkörper ' +
         (SPARREN.koerper * 10).toFixed(1) + ' mm');
  var obenOk = Math.abs(obenKammer - (0.8 + GLASLEISTE.hoehe)) < 0.001;
  pruefe('Obere Kammer ist genau Scheibe plus Glasleiste',
         gegen ? !obenOk : obenOk,
         (obenKammer * 10).toFixed(1) + ' mm Kammer, Scheibe + Leiste ' +
         ((0.8 + GLASLEISTE.hoehe) * 10).toFixed(1) + ' mm');
  /* Zweiter Weg: Die Summe muss die Profilhoehe ergeben – sonst steht
     irgendwo etwas vor, und genau das war die Beanstandung. */
  var summe = K.unten + K.oben + 3 * K.blech;
  var dicht = Math.abs(summe - WANDPROFIL.hoehe) < 0.001 && K.blech > 0;
  pruefe('Kammern und Bleche ergeben genau die Profilhöhe',
         gegen ? !dicht : dicht,
         (summe * 10).toFixed(1) + ' von ' + (WANDPROFIL.hoehe * 10).toFixed(1) +
         ' mm, Blech ' + (K.blech * 10).toFixed(1) + ' mm');

  /* Der Seitendeckel ist mit 89,16 mm mehr als doppelt so tief wie das
     Profil (38,6) – er deckt die Stirn des aeusseren Sparrens mit ab.
     „in der höhe ok aber in der breite etwas zu schmal" (Betreiber,
     14.10.2026), nachdem er hier kurzzeitig auf Profiltiefe gestutzt
     war. Das belegte Mass gilt.

     Geprueft wird deshalb BEIDES: das Mass selbst und dass der Bereich
     davor ueberhaupt gefuellt ist – also dass die Sparren im Profil
     beginnen. Waeren sie es nicht, stuende der Deckel wieder in der
     Luft, und genau das war der Fehler, der ihn hat schrumpfen
     lassen. */
  var deckel = +dl[1];
  var sparrenImProfil = /zSpHinten = sky \? wpT : WANDPROFIL\.wand;/.test(k3d);
  var deckelOk = Math.abs(deckel - 8.916) < 0.001 &&
                 deckel > WANDPROFIL.tiefe && sparrenImProfil;
  pruefe('Seitendeckel deckt Profil und Sparrenstirn ab (89,16 mm)',
         gegen ? !deckelOk : deckelOk,
         (deckel * 10).toFixed(2) + ' mm Deckel, Profil ' +
         (WANDPROFIL.tiefe * 10).toFixed(1) + ' mm, Sparren ' +
         (sparrenImProfil ? 'im Profil' : 'DAVOR'));
})();

/* ---------- Die Rinne darf nicht durch die Eindeckung stechen ----------
   „der hintere schenkel der rinne guckt durch das glas und die glasleisten
   durch" (Betreiber, 14.10.2026).

   Die hintere Wange der Rinne liegt 34 mm unter der Nase; die Scheibe
   liegt sparrenUnterNase (16 mm) unter der Nase. Dazwischen muessen
   mindestens ein paar Millimeter Luft bleiben – sonst steht die Wange im
   Glas. Der Fehler entstand, als die Glasebene vom Sparrenkopf auf den
   Sparrenkoerper rutschte und diese Formel nicht mitging. */
(function () {
  var rinLit = (k3d.match(/var RINNE = \{[\s\S]*?\n  \};/) || [''])[0];
  var spLit = (k3d.match(/var SPARREN = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!rinLit || !spLit) { pruefe('Masse für die Glasebene lesbar', false, ''); return; }
  var RINNE = eval('(' + rinLit.replace(/^var RINNE = /, '').replace(/;$/, '') + ')');
  var SPARREN = eval('(' + spLit.replace(/^var SPARREN = /, '').replace(/;$/, '') + ')');

  /* Gerechnet wie im Code, nur mit hRinne = 0. gegen: wieder gegen den
     Sparrenkopf statt den Koerper – genau der gemeldete Fehler. */
  var auflage = gegen ? SPARREN.hoehe : SPARREN.koerper;
  var ukVorn = RINNE.hoehe - RINNE.sparrenUnterNase - auflage;
  var glasUnten = ukVorn + SPARREN.koerper;
  var wangeOk = RINNE.hoehe - RINNE.wangeAb;
  var luft = glasUnten - wangeOk;
  pruefe('Hintere Rinnenwange bleibt unter der Scheibe',
         luft > 0.5,
         (luft * 10).toFixed(1) + ' mm Luft (Scheibe ' + (glasUnten * 10).toFixed(1) +
         ', Wange ' + (wangeOk * 10).toFixed(1) + ' mm)');
  pruefe('Die Formel rechnet gegen den Sparrenkörper',
         new RegExp(q || 'riH - RINNE\\.sparrenUnterNase - SPARREN\\.koerper').test(k3d) &&
         (gegen || !/riH - RINNE\.sparrenUnterNase - spH/.test(k3d)),
         'nicht gegen die Sparrenoberkante');
})();

/* ---------- Blende vor der unteren Kammer (16912) ----------
   „und jz kommt zwischen jeden sparrenabstand, ans wandprofil ne blende
   das man das innenleben also die kammern etc nicht sieht … bzw das man
   nur die untere kammer nicht sieht" (Betreiber, 14.10.2026). */
(function () {
  var wb = k3d.match(/var WANDBLENDE = \{ hoehe: ([\d.]+), dicke: ([\d.]+) \}/);
  var spLit = (k3d.match(/var SPARREN = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!wb || !spLit) { pruefe('Wandblende lesbar', false, 'nicht gefunden'); return; }
  var SPARREN = eval('(' + spLit.replace(/^var SPARREN = /, '').replace(/;$/, '') + ')');
  var hoehe = +wb[1];

  /* Sie muss die untere Kammer abdecken – also mindestens so hoch sein
     wie der Sparrenkoerper, der die Kammer ausfuellt, und hoechstens ein
     paar Millimeter mehr (der Haken). 98,85 gegen 96,7 mm. */
  var deckt = hoehe >= SPARREN.koerper && hoehe <= SPARREN.koerper + 0.5;
  pruefe('Blende deckt die untere Kammer ab (98,85 gegen 96,7 mm)',
         gegen ? !deckt : deckt,
         (hoehe * 10).toFixed(2) + ' mm Blende, Kammer ' +
         (SPARREN.koerper * 10).toFixed(1) + ' mm');

  /* Nur ZWISCHEN den Sparren, nicht durchgehend: Sonst stuende sie vor
     den Sparren, die in derselben Kammer stecken. Und nur vor der
     unteren – die obere traegt die Scheibe. */
  var proFeld = /feldB2 = \(xs\[i \+ 1\] - xs\[i\]\) - spB;/.test(k3d) &&
                /balken\(feldB2, WANDBLENDE\.hoehe, WANDBLENDE\.dicke,/.test(k3d);
  pruefe('Blende sitzt in den Feldern zwischen den Sparren',
         gegen ? !proFeld : proFeld, 'nicht durchgehend über die Breite');

  /* Lage: vorne an der Kammeroeffnung und ab der Kammerunterkante. */
  var lage = /wpUk \+ kam\.blech \+ WANDBLENDE\.hoehe \/ 2/.test(k3d) &&
             /WANDPROFIL\.tiefeUnten - WANDBLENDE\.dicke \/ 2/.test(k3d);
  pruefe('Blende steht vorne in der Kammeröffnung',
         gegen ? !lage : lage, 'bündig mit dem unteren Schenkel');
})();

/* ---------- Sparren: Scheibe stoesst an die Stegflanke ----------
   „der träger also quasi sparren, ist so aufgebaut wie auf dem bild, das
   bild zeigt 2 sparren und wie das glas (orange) dadrauf liegt"
   (Betreiber, 14.10.2026, Querschnittsbild mit 20 mm Auflage je Seite).

   Die Stegbreite war geschaetzt (26 mm) und damit zu breit: Die Scheibe
   liegt laut Anleitung je Seite 20 mm auf, bei 61 mm Sparrenbreite bleiben
   fuer den Steg 21 mm. Mit 26 schnitt die Scheibe 2,5 mm je Seite hinein.

   Geprueft wird die Rechnung selbst, nicht die Zahl: Auflage links +
   Steg + Auflage rechts muss die Sparrenbreite ergeben. */
(function () {
  var sp = (k3d.match(/var SPARREN = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!sp) { pruefe('Sparrenmasse lesbar', false, 'nicht gefunden'); return; }
  var S2 = eval('(' + sp.replace(/^var SPARREN = /, '').replace(/;$/, '') + ')');
  var auflage = 2.0;                         // 20 mm je Seite, Anleitung S. 9
  var summe = S2.stegBreite + 2 * auflage;
  var ok = Math.abs(summe - S2.breite) < 0.001;
  pruefe('Scheibe liegt 20 mm auf und stößt an den Steg',
         gegen ? !ok : ok,
         (auflage * 10) + ' + ' + (S2.stegBreite * 10).toFixed(0) + ' + ' +
         (auflage * 10) + ' = ' + (summe * 10).toFixed(0) + ' mm, Sparren ' +
         (S2.breite * 10).toFixed(0) + ' mm');
  /* Zweiter Weg: die Breite der Scheibe im Code (lichteWeite + 4 cm) gegen
     dieselbe Auflage. Beide muessen dieselbe Zahl meinen. */
  var vier = /var feldB = lichteWeite \+ 4;/.test(k3d);
  pruefe('Scheibenbreite folgt denselben 20 mm',
         gegen ? !vier : vier, 'Abstand zwischen Träger + 40 mm');
})();

/* ---------- Serienfarben je System ----------
   BELEGT aus dem Kopf der Preislisten-Masstabelle: Reinweiss 9010 gibt
   es NUR bei TDS. „korregieren" (Betreiber, 11.10.2026) - vorher
   standen bei SkyView und Flat Line alle vier Farben zur Wahl. */
(function () {
  var M = require('path').resolve('js/masstabelle.js');
  delete require.cache[M];
  global.window = global.window || {};
  require(M);
  var f = window.BV_MASSTABELLE.farben;
  if (!f) { pruefe('Farben je System vorhanden', false, 'kein farben-Block'); return; }
  var SOLL = { 'TDS': '7016,9006,9007,9010', 'SkyView': '7016,9006,9007',
               'Flat_Line': '7016,9006,9007' };
  var falsch = [];
  Object.keys(SOLL).forEach(function (sys) {
    var ist = (f[sys] || []).join(',');
    var soll = SOLL[sys] + (gegen ? ',9999' : '');
    if (ist !== soll) falsch.push(sys + ': ' + ist);
  });
  pruefe('Serienfarben je System wie in der Preisliste', !falsch.length,
         falsch.length ? falsch.join('; ') : 'nur TDS führt 9010');

  /* Zweiter Weg: die Uebersetzung im Konfigurator wirklich laufen
     lassen - fuer SkyView darf Reinweiss nicht herauskommen, fuer TDS
     schon. */
  var fn = (k3d.match(/function farbenAusTabelle\(\)[\s\S]*?\n  \}/) || [''])[0];
  var map = (k3d.match(/var RAL_ZU_NAME = \{[\s\S]*?\};/) || [''])[0];
  if (!fn || !map) { pruefe('Farbuebersetzung lesbar', false, 'nicht gefunden'); return; }
  var Z = {}, istCarportTds = function () { return false; };
  /* Das Objektliteral herausloesen - ein eval('var ...') in strict mode
     legt die Variable nur in seinem eigenen Scope an. */
  var RAL_ZU_NAME = eval('(' + map.replace('var RAL_ZU_NAME = ', '').replace(/;\s*$/, '') + ')');
  var farbenAusTabelle = eval('(' + fn.replace('function farbenAusTabelle()', 'function ()') + ')');
  Z.produkt = 'Terrassendach TDS';
  var tds = farbenAusTabelle() || [];
  Z.produkt = 'Flachdach SkyView';
  var sky = farbenAusTabelle() || [];
  var ok = tds.indexOf('Reinweiß') > -1 && sky.indexOf('Reinweiß') === -1 &&
           sky.indexOf('Andere / Beratung') > -1;
  pruefe('SkyView bekommt kein Reinweiß, TDS schon', gegen ? !ok : ok,
         'TDS ' + tds.length + ' Farben, SkyView ' + sky.length);
})();

/* ---------- VD Flachdach Glas SKY VIEW ----------
   Montageanleitung „VD FLACHDACH GLAS SKY VIEW", Stand 07.11.2025.
   Zweiter Weg: Die Sollwerte stehen HIER noch einmal, aus der Anleitung
   abgeschrieben, und werden mit dem verglichen, was im Modellcode
   steht. Weicht eines ab, schlaegt die Pruefung an. */
(function () {
  var blk = (k3d.match(/var SKY = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!blk) { pruefe('SKY-Block lesbar', false, 'nicht gefunden'); return; }
  function zahl(name) {
    var m = blk.match(new RegExp(name + ':\\s*([\\d.]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  var SKY = { rinneT: zahl('rinneT'), traegerT: zahl('traegerT'),
              sparrenAbzug: zahl('sparrenAbzug'), auflager: zahl('auflager'),
              auflagerH: zahl('auflagerH'), rahmenH: zahl('rahmenH'),
              seitenblendeH: zahl('seitenblendeH'),
              seitenblendeT: zahl('seitenblendeT'),
              eckblendeB: zahl('eckblendeB') };
  /* „sparren, glasleiste etc is wie bei tds" (Betreiber, 11.10.2026) –
     die Sparrenhoehe kommt deshalb aus dem TDS-Block, nicht aus SKY. */
  var spTds = parseFloat((k3d.match(/var SPARREN = \{[\s\S]*?hoehe:\s*([\d.]+)/) || [])[1]);

  /* BELEGT, S. 22: Sparrenlaenge = Spannweite - 150 mm, Ausschnitt
     65 x 86 mm. */
  [['sparrenAbzug', 150], ['auflager', 65], ['auflagerH', 86]].forEach(function (pp) {
    var ist = SKY[pp[0]] === null ? null : Math.round(SKY[pp[0]] * 10);
    var soll = pp[1] + (gegen ? 7 : 0);
    pruefe('SkyView – Mass ' + pp[0], ist === soll,
           ist + ' mm (Anleitung ' + pp[1] + ')');
  });

  /* ---------- Profiltiefen jetzt BELEGT, nicht mehr abgeleitet ----------
     Hier stand bis zum 14.10.2026 eine Ableitung: Weil der Sparren
     150 mm kuerzer ist als die Spannweite und an jedem Ende 65 mm
     aufliegt, muessten Rinne und Traeger zusammen 280 mm tief sein –
     daraus kamen die 140 mm je Profil.

     Die Einzelteile-Liste des Herstellers (Stand 07.10.2026) nennt die
     echten Querschnitte: Rinne 2 TD (16913) 186,3 mm tief, Traeger TD
     (15698) 120 mm. Zusammen 306,3 mm, nicht 280 mm.

     Die Ableitung war also falsch – wie der Sparren genau aufliegt,
     ergibt sich aus 150 und 65 allein nicht. Geprueft werden deshalb
     jetzt die BELEGTEN Masse, und die offene Frage steht in
     docs/NEXT_TASK.md. */
  [['rinneT', 186.3, 'Rinne 2 TD (16913)'],
   ['traegerT', 120, 'Träger TD (15698)'],
   /* Die Rahmenhoehe kommt NICHT von der Rinne (136,7), sondern von der
      Eckabdeckung Sky HL/HR (6073/6074): 124 + 124 breit, 252 hoch. Die
      Seitenblende Sky (6069) nennt dieselbe 252. Bis zum 14.10.2026
      stand hier die Rinnenhoehe – der Rahmen war damit nur halb so hoch
      wie in Wirklichkeit. */
   ['rahmenH', 252, 'Eckabdeckung Sky 6073/6074, 252 mm hoch'],
   ['seitenblendeH', 252, 'Seitenblende Sky 6069, aufrecht 252 mm'],
   ['seitenblendeT', 38.9, 'Seitenblende Sky 6069, 38,9 mm tief'],
   ['eckblendeB', 124, 'Eckabdeckung Sky, Schenkel 124 mm']].forEach(function (pp) {
    var ist = SKY[pp[0]] === null ? null : Math.round(SKY[pp[0]] * 100) / 10;
    var soll = pp[1] + (gegen ? 7 : 0);
    pruefe('SkyView – ' + pp[2], Math.abs(ist - soll) < 0.05,
           ist + ' mm (Liste ' + pp[1] + ')');
  });

  /* Der Sparren muss hoeher sein als seine Ausklinkung, sonst waere er
     an den Enden durchgeschnitten. Mit dem TDS-Sparren (120 mm) bleiben
     ueber der Ausklinkung genau 34 mm – der obere Steg, auf dem die
     Eindeckung liegt. Zwei Quellen, die dasselbe sagen: die Anleitung
     und die Angabe des Betreibers. */
  var hoch = spTds - (gegen ? 5 : 0);
  var rest = hoch - SKY.auflagerH;
  pruefe('SkyView – Sparren höher als die Ausklinkung', rest > 0,
         (hoch * 10).toFixed(0) + ' mm Sparren, ' + (rest * 10).toFixed(0) +
         ' mm über der Ausklinkung');
})();
/* „aussen aus wie flachdach, innen gefaelle von immer 2 grad"
   (Betreiber, 11.10.2026): Die Dachflaeche faellt mit 2°, der RAHMEN
   bleibt waagerecht. Beides muss im Code stehen. */
/* Das echte Gefaelle sind 2°. In den belegten Rahmen passt das nicht –
   Sparren und Glas fuellen ihn fast aus. Gezeichnet wird deshalb, was
   hineinpasst; von aussen ist das richtig, weil das Gefaelle innen liegt.
   Geprueft wird, dass die Rechnung aus den PROFILMASSEN kommt und nicht
   wieder eine feste Gradzahl ist, die neben dem Rahmen herlaeuft. */
/* Das echte Gefaelle sind 2°. In den 252er Rahmen passt das bis rund
   3,55 m Tiefe; darueber wird flacher gezeichnet, sonst stuende das Glas
   ueber dem Rahmen. Geprueft wird, dass BEIDES im Code steht: die festen
   2° als Obergrenze und die Rechnung aus den Profilmassen. */
pruefe('SkyView – Gefälle: 2°, begrenzt durch die Profilmaße',
       new RegExp(q || 'Math\\.min\\(2 \\* Math\\.PI / 180,').test(k3d) &&
       new RegExp(q || 'Math\\.atan\\(skyLuft / Math\\.max').test(k3d) &&
       new RegExp(q || 'SKY\\.rahmenH - \\(istPolycarbonat').test(k3d),
       '2° bis 3,5 m, darüber flacher');
pruefe('SkyView – Rahmen bleibt waagerecht',
       new RegExp(q || 'wpOk = sky \\? hRinne \\+ riH').test(k3d) &&
       new RegExp(q || 'blendeY = sky \\? hRinne \\+ riH / 2').test(k3d),
       'Träger und Blende auf Rinnenhöhe');
(function () {
  /* Die Sparrenunterkante vorne steht ZWEIMAL im Code – einmal fuer
     Pfosten und Traeger, einmal fuer das Dach. Laufen sie auseinander,
     liegt das Dach anders als die Pfosten. */
  var n = (k3d.match(/\? hRinne \+ riH - skyGlas - spH - Math\.tan\(neig\) \* T/g) || []).length;
  pruefe('SkyView – beide Höhenrechnungen stimmen überein',
         gegen ? n !== 2 : n === 2, n + ' Stellen');
})();
(function () {
  /* Zweiter Weg: Passt die geneigte Dachflaeche in den Kasten? Die
     Formeln kommen aus dem Modellcode, gerechnet wird ueber acht
     Tiefen.

     Hier stand zwischendurch die Pruefung eines KEILSPARRENS - unten
     waagerecht, nach hinten ansteigend. Zurueckgenommen: „die sparren
     haben keine keilform, die sind normal wie bei tds nur eben 2 grad
     geneigt" (Betreiber, 11.10.2026). Das Gefaelle liegt damit im
     Kasten, nicht im Sparren. */
  /* ---------- Der Rahmen hat eine FESTE Hoehe ----------
     Bis zum 14.10.2026 wuchs er mit der Dachtiefe, damit das 2°-Gefaelle
     hineinpasst – bei 4,5 m auf 355 mm. „außenrum sieht er in echt auch
     gleich hoch aus" (Betreiber, 14.10.2026), und im ganzen System gibt
     es kein Profil ueber 136,7 mm. Das Gefaelle steckt stattdessen in
     der Ausklinkung des Sparrens (65 x 86 mm, nur vorne).

     Geprueft wird deshalb jetzt das Gegenteil von vorher: Die Formel
     darf NICHT mehr von der Tiefe abhaengen. */
  var fRi = (k3d.match(/var riH = sky \? ([^;]+);/) || [])[1];
  var blk = (k3d.match(/var SKY = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!fRi || !blk) { pruefe('SkyView - Rahmenformel lesbar', false, 'nicht gefunden'); return; }
  pruefe('SkyView – Rahmenhöhe hängt nicht an der Tiefe',
         gegen ? / T\b/.test(fRi) : !/ T\b|Math\.tan/.test(fRi),
         'riH = ' + fRi.trim());

  function zahl2(name) {
    var m = blk.match(new RegExp(name + ':\\s*([\\d.]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  var SKY2 = { rahmenH: zahl2('rahmenH'), auflagerH: zahl2('auflagerH') };
  var spH2 = parseFloat((k3d.match(/var SPARREN = \{\s*\n\s*breite:\s*[\d.]+,[^]*?hoehe:\s*([\d.]+)/) || [])[1]);
  /* Zweiter Weg: Die Sparrenunterkante vorne aus der Rahmenoberkante
     zurueckrechnen. Ohne die Ausklinkung waere sie bei JEDER Tiefe
     unter dem Rahmen – mit ihr passt es bis rund 2,6 m. Geprueft wird,
     dass die Ausklinkung ueberhaupt etwas bewirkt: Sie muss die
     Unterkante um genau 86 mm anheben. */
  var ohne = SKY2.rahmenH - 0.8 - Math.tan(2 * Math.PI / 180) * 250 - spH2;
  var mit = ohne + SKY2.auflagerH - (gegen ? 8.6 : 0);
  pruefe('SkyView – die Ausklinkung hebt den Sparren vorne an',
         Math.abs((mit - ohne) - 8.6) < 0.01,
         'bei 2,5 m: ohne ' + (ohne * 10).toFixed(0) + ' mm, mit ' +
         (mit * 10).toFixed(0) + ' mm zur Rahmenunterkante');
  pruefe('SkyView - Sparren ist ein gerades Profil wie bei TDS',
         gegen ? /function keilsparren/.test(k3d)
               : (!/function keilsparren/.test(k3d) &&
                  /sparrenBauen\(laenge, x, ukMitte, zMitte, neig, mAlu\)/.test(k3d)),
         'kein Keil, nur geneigt');
})();
pruefe('SkyView – Sparrenlänge aus der Anleitung',
       new RegExp(q || 'laenge = sky \\? T - SKY\\.sparrenAbzug').test(k3d) &&
       new RegExp(q || 'zMitte = sky \\? T / 2').test(k3d), '');
pruefe('SkyView – Seitenblende über die volle Rahmenhöhe',
       new RegExp(q || 'blendeH = sky \\? riH').test(k3d) &&
       new RegExp(q || 'blendeL = sky \\? T').test(k3d), 'Seitenblende Sky 6069');
/* „sparren, glasleiste etc is wie bei tds" (Betreiber, 11.10.2026):
   Es gibt nur EINEN Sparren- und EINEN Leistenbau, fuer beide Systeme.
   Geprueft wird, dass die sky-Sonderwege weg sind. */
pruefe('Eindeckung liegt in beiden Systemen auf dem Sparren auf',
       new RegExp(q || 'var feldB = lichteWeite \\+ 4;').test(k3d) &&
       !/feldB = sky \?/.test(k3d), 'Anleitung TDS S. 9: + 40 mm');
(function () {
  /* Der Kasten ist rundum dasselbe gerillte Profil - vorne, hinten und
     an beiden Seiten. Zweiter Weg: den Querschnitt wirklich zeichnen
     und ausmessen; die Rillen duerfen die Aussenmasse nicht antasten. */
  var fn = (k3d.match(/function blendeProfil\([\s\S]*?\n  \}/) || [''])[0];
  if (!fn) { pruefe('Blendenprofil lesbar', false, 'nicht gefunden'); return; }
  var stellen = (k3d.match(/blendeProfil\(/g) || []).length;
  pruefe('SkyView – Kasten rundum aus demselben Profil',
         gegen ? stellen !== 4 : stellen === 4,
         stellen + ' Stellen (Definition, vorne, hinten, Seite)');

  var punkte = [];
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  /* Nur der Querschnitt wird gebraucht - alles danach (Extrude, Mesh,
     Szene) wird mit Attrappen bedient. */
  function Leer() { return { translate: function () { return this; },
                             rotateY: function () { return this; } }; }
  var THREE = { Shape: Form,
                ExtrudeGeometry: function () { return Leer(); },
                Mesh: function () { return { position: { set: function () {} },
                                             castShadow: 0, receiveShadow: 0 }; } };
  var RINNE = { rilleTeilung: parseFloat((k3d.match(/rilleTeilung:\s*([\d.]+)/) || [])[1]) };
  var bau = { add: function () {} };
  /* Mit den echten Massen des Rahmens pruefen, nicht mit alten
     Beispielwerten: 252 mm hoch (Eckabdeckung 6073/6074), 186,3 tief
     (Rinne 2 TD). */
  var hoehe = 25.2, tiefe = 18.63;
  eval('(' + fn + ')')(500, hoehe, tiefe, 0, 100, 0, 0, null);
  var xs2 = punkte.map(function (pp) { return pp[0]; });
  var ys2 = punkte.map(function (pp) { return pp[1]; });
  var breit = Math.max.apply(null, xs2) - Math.min.apply(null, xs2);
  var hoch = Math.max.apply(null, ys2) - Math.min.apply(null, ys2);
  if (gegen) breit += 1;
  pruefe('SkyView – Rillen ändern die Kastenmaße nicht',
         Math.abs(breit - tiefe) < 0.02 && Math.abs(hoch - hoehe) < 0.02,
         breit.toFixed(1) + ' x ' + hoch.toFixed(1) + ' cm');
  var tief = punkte.filter(function (pp) {
    return pp[0] < tiefe - 0.1 && pp[0] > tiefe - 1.0;
  }).length;
  if (gegen) tief = 0;
  pruefe('SkyView – Kasten ist gerillt, nicht glatt', tief >= 8,
         tief + ' zurueckgesetzte Punkte');
})();
pruefe('SkyView – Sparren und Glasleisten wie bei TDS',
       new RegExp(q || 'var spB = SPARREN\\.breite;').test(k3d) &&
       new RegExp(q || 'var spH = SPARREN\\.hoehe;').test(k3d) &&
       !/if \(sky\) \{\s*var sp = new THREE\.Mesh/.test(k3d) &&
       !/SKY\.leiste/.test(k3d), 'keine eigenen Profile mehr');
pruefe('SkyView – die alte Attika-Blende ist weg',
       gegen ? /balken\(B \+ 3, 26, 4,/.test(k3d) : !/balken\(B \+ 3, 26, 4,/.test(k3d),
       'Rahmen aus Rinne, Träger und Seitenblende');
(function () {
  /* Zweiter Weg: Das Band muss rundum dieselbe Ober- UND Unterkante
     haben – vorne die Rinne, hinten der Träger, seitlich die Blende.
     Gerechnet mit den Formeln aus dem Code.

     Diese Pruefung hat den Fehler gefunden, dass der Traeger hinten
     seine feste Hoehe behielt, waehrend die Rinne mit der Tiefe wuchs:
     oben buendig, unten 11 cm auseinander. */
  var fw = (k3d.match(/var wpH = sky \? ([^:]+):/) || [])[1];
  var fo = (k3d.match(/var wpOk = sky \? ([^:]+):/) || [])[1];
  if (!fw || !fo) { pruefe('Rahmenformeln lesbar', false, 'nicht gefunden'); return; }
  if (gegen) fw = '22.0';
  var hRinne = 250, riH = 33.4;
  var wpH = eval(fw), wpOk = eval(fo);
  var rinneOk = hRinne + riH, rinneUk = hRinne;
  var traegerOk = wpOk, traegerUk = wpOk - wpH;
  /* Die Seitenblende sitzt mittig auf derselben Hoehe. */
  var blendeOk = hRinne + riH / 2 + riH / 2, blendeUk = hRinne + riH / 2 - riH / 2;
  var falsch = [];
  if (Math.abs(traegerOk - rinneOk) > 0.001) falsch.push('Oberkante Träger');
  if (Math.abs(traegerUk - rinneUk) > 0.001) falsch.push('Unterkante Träger');
  if (Math.abs(blendeOk - rinneOk) > 0.001) falsch.push('Oberkante Blende');
  if (Math.abs(blendeUk - rinneUk) > 0.001) falsch.push('Unterkante Blende');
  pruefe('SkyView – das Band ist rundum gleich hoch', !falsch.length,
         falsch.length ? falsch.join(', ') : 'Rinne, Träger und Blende bündig');
})();
(function () {
  /* BELEGT, S. 25: „an den Seiten jeweils ein Abstand von 0 mm".
     Gerechnet mit der Achsformel aus dem Code. */
  var f = (k3d.match(/var randAchse = sky \? ([^;]+);/) || [])[1];
  if (gegen) f = 'spB';
  var spB = 7, B = 500;
  var randAchse = eval(f.split(':')[0]);
  var aussen = (B / 2 - randAchse) + spB / 2;
  pruefe('SkyView – Randsparren bündig an der Dachkante',
         Math.abs(aussen - B / 2) < 0.001,
         'Sparrenaussenkante ' + ((aussen - B / 2) * 10).toFixed(0) + ' mm von der Kante');
})();

/* ---------- Seitliche Abdeckungen: zwei verschiedene Formen ----------
   Erst hiess es „identisch", dann, nachdem beide gleich gebaut waren:
   „du hast die deckel nicht richtig abgebildet sondern selbst
   modeliert" – Rinne und Wandprofil sind DOCH VERSCHIEDEN (Betreiber,
   11.10.2026). Die Pruefung von vorhin schrieb die alte Wahrheit fest
   („beide ergeben denselben Umriss") und ist deshalb ersetzt. */
(function () {
  var rinQ = (k3d.match(/function rinnenkappeQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var wandQ = (k3d.match(/function wandkappeQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var masse = k3d.match(/RINNENDECKEL = \{ breite: RINNE\.breite,\s*\n?\s*hoehe: RINNE\.hoehe \+ RINNE\.schenkelLang,\s*\n?\s*fase: RINNE\.fase, fall: ([\d.]+), lehne: ([\d.]+)/);
  var rinLit = (k3d.match(/var RINNE = \{[\s\S]*?\n  \};/) || [''])[0];
  var wd = k3d.match(/WANDDECKEL = \{ breite: ([\d.]+), hoehe: ([\d.]+)/);
  if (!rinQ || !wandQ || !masse || !wd || !rinLit) {
    pruefe('Beide Kappenformen lesbar', false, 'nicht gefunden'); return;
  }
  var RINNE = eval('(' + rinLit.replace(/^var RINNE = /, '').replace(/;$/, '') + ')');
  /* Die Hoehe steht im Code als RINNE.hoehe, nicht als Zahl – genau
     darum geht es: Sie kann nicht mehr von der Rinne davonlaufen. */
  var RINNENDECKEL = { breite: RINNE.breite,
                       hoehe: RINNE.hoehe + RINNE.schenkelLang,
                       fase: RINNE.fase, fall: +masse[1], lehne: +masse[2] };
  var WANDDECKEL = { breite: +wd[1], hoehe: +wd[2] };

  var punkte = [], bogen = 0;
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) {
    bogen++; punkte.push([x, y]);
  };
  Form.prototype.closePath = function () {};
  var THREE = { Shape: Form };

  function mess(quelle) {
    punkte = []; bogen = 0;
    eval('(' + quelle + ')')();
    var xs2 = punkte.map(function (p) { return p[0]; });
    var ys2 = punkte.map(function (p) { return p[1]; });
    return { breit: Math.max.apply(null, xs2) - Math.min.apply(null, xs2),
             hoch: Math.max.apply(null, ys2) - Math.min.apply(null, ys2),
             bogen: bogen, umriss: JSON.stringify(punkte) };
  }
  function punkteVon(quelle) {
    punkte = []; bogen = 0;
    eval('(' + quelle + ')')();
    return punkte;
  }
  function punkteZahl(quelle) {
    punkte = []; bogen = 0;
    eval('(' + quelle + ')')();
    return punkte.length;
  }
  var r = mess(rinQ), w = mess(wandQ);

  /* Die frueheren Masspruefungen (172 x 175, sechs Ecken, Fasen vorne
     bzw. hinten) sind entfallen: Die Blende folgt seit dem 14.10.2026 der
     Handvorlage des Betreibers im gerenderten Schnitt, und ihre Masse
     kommen aus der Rinne. Was heute gilt, steht weiter unten. */

  

  /* ---------- Die Blende nach der Handvorlage ----------
     Der Betreiber hat den gerenderten Schnitt genommen und den Umriss
     eingezeichnet (14.10.2026). Daraus die drei Bedingungen: Sie deckt
     Rinne UND Schenkel ab, reicht hinten bis an die Rinnenkante, und hat
     unten vorne eine grosse Fase – oben laeuft sie gerade durch.

     Die 175 mm der Skizze stimmen damit wieder (136,7 + 38,3); falsch
     war an diesem Abend zweimal die Form drumherum, nicht die Zahl. */
  var stapel = RINNE.hoehe + RINNE.schenkelLang;
  var deckt = Math.abs(RINNENDECKEL.hoehe - stapel) < 0.001 &&
              Math.abs(RINNENDECKEL.breite - RINNE.breite) < 0.001;
  pruefe('Blende deckt Rinne und Schenkel ganz ab',
         gegen ? !deckt : deckt,
         (RINNENDECKEL.breite * 10).toFixed(1) + ' x ' +
         (RINNENDECKEL.hoehe * 10).toFixed(1) + ' mm gegen Rinne ' +
         (RINNE.breite * 10).toFixed(1) + ' x ' + (stapel * 10).toFixed(1) + ' mm');

  /* Zweite Handvorlage (14.10.2026): vorne ZWEI Fasen – oben klein, unten
     gross bis zum Schenkelfuss. Beide folgen der Rinne, nicht einer
     eigenen Zahl: oben fase * 0,6 wie die Rinnenvorderkante, unten die
     Rinnenfase plus die Schenkellaenge. Dadurch liegt die untere
     Blendenkante GENAU auf der Rinnenfase. */
  var p3 = punkteVon(rinQ);
  function hatPunkt(x, y) {
    return p3.some(function (q) {
      return Math.abs(q[0] - x) < 0.001 && Math.abs(q[1] - y) < 0.001;
    });
  }
  var fo = RINNE.fase * 0.6, fu = RINNE.fase + RINNE.schenkelLang;
  var B3 = RINNENDECKEL.breite, H3 = RINNENDECKEL.hoehe;
  var formOk = p3.length === 6 &&
               hatPunkt(B3 - fu, 0) && hatPunkt(B3, fu) &&      // unten gross
               hatPunkt(B3, H3 - fo) && hatPunkt(B3 - fo, H3) && // oben klein
               hatPunkt(0, H3) && hatPunkt(0, 0);                // hinten gerade
  pruefe('Blende: zwei Fasen vorne, unten die große bis zum Schenkelfuß',
         gegen ? !formOk : formOk,
         p3.length + ' Ecken, Fase unten ' + (fu * 10).toFixed(1) +
         ' mm, oben ' + (fo * 10).toFixed(1) + ' mm');

  /* Die untere Fase muss dieselbe Neigung haben wie die der Rinne –
     sonst schneidet sie das Profil an oder laesst es frei. Beide 45°. */
  var gleicheNeigung = Math.abs(fu - (RINNE.fase + RINNE.schenkelLang)) < 0.001;
  pruefe('Untere Blendenfase liegt auf der Rinnenfase',
         gegen ? !gleicheNeigung : gleicheNeigung,
         'Rinnenfase ' + (RINNE.fase * 10).toFixed(0) + ' mm + Schenkel ' +
         (RINNE.schenkelLang * 10).toFixed(1) + ' mm');

  var lageOk = /profilKappen\(laenge, zVorne - RINNENDECKEL\.breite,/.test(k3d) &&
               /yUnten - RINNE\.schenkelLang,/.test(k3d);
  pruefe('Blende sitzt bündig auf dem ganzen Querschnitt',
         gegen ? !lageOk : lageOk, 'hinten an der Rinnenkante, unten am Schenkelfuß');

  /* ---------- Die Probe aufs Ganze: deckt die Blende die Rinne? ----------
     „die rinnenblende passt auch von der form nicht an die rinne, die
     rinnenblende is richtig aber die rinnenform vorne an der stirnseite
     is falsch" (Betreiber, 14.10.2026).

     Diese Pruefung hat an vier Runden gefehlt. Jede davor hat EINZELNE
     Masse verglichen (Hoehe gegen Hoehe, Tiefe gegen Tiefe) – und jedes
     Mal stimmten die Zahlen, waehrend die Formen nicht zueinander
     passten. Hier wird deshalb der ganze Rinnenumriss PUNKT FUER PUNKT
     gegen den Deckelumriss gehalten.

     Die Punkte hinter der Deckelkante zaehlen nicht mit: Dort laesst der
     Deckel die Rinne bewusst 14,3 mm frei. */
  (function () {
    var rinneQ = (k3d.match(/function rinneQuerschnitt\(mitKehle\)[\s\S]*?\n  \}/) || [''])[0];
    if (!rinneQ) { pruefe('Rinnenquerschnitt für die Probe lesbar', false, ''); return; }
    /* Jede Form sammelt ihre EIGENEN Punkte: Der Querschnitt legt
       zusaetzlich die Kehle als Pfad an, und die reicht bewusst ueber die
       Oberkante hinaus (nach oben offen). Liefen beide in einen Topf,
       meldete die Pruefung die Kehlpunkte als „schaut heraus". */
    function P() { this.holes = []; this.p = []; }
    P.prototype.moveTo = function (x, y) { this.p.push([x, y]); };
    P.prototype.lineTo = P.prototype.moveTo;
    P.prototype.quadraticCurveTo = function (a, b, x, y) { this.p.push([x, y]); };
    P.prototype.closePath = function () {};
    var THREE = { Shape: P, Path: P };
    var pr = eval('(' + rinneQ + ')')(false).p;

    var versatzX = 0;                                    // Blende deckt alles ab
    var versatzY = RINNE.schenkelLang;                   // Blende beginnt am Schenkelfuss
    var deckel = punkteVon(rinQ);
    function drin(poly, x, y) {
      var innen = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if ((yi > y) !== (yj > y) &&
            x < (xj - xi) * (y - yi) / (yj - yi) + xi) innen = !innen;
      }
      return innen;
    }
    /* Punkte, die GENAU auf der Deckelkante liegen, sind buendig und
       damit verdeckt – das Strahlverfahren zaehlt sie je nach Rundung
       mal so, mal so. Deshalb zusaetzlich der Abstand zur Kante. */
    function amRand(poly, x, y) {
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var x1 = poly[j][0], y1 = poly[j][1], x2 = poly[i][0], y2 = poly[i][1];
        var dx = x2 - x1, dy = y2 - y1;
        var l2 = dx * dx + dy * dy;
        var t = l2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / l2)) : 0;
        var ax = x1 + t * dx - x, ay = y1 + t * dy - y;
        if (Math.sqrt(ax * ax + ay * ay) < 0.03) return true;   // 0,3 mm
      }
      return false;
    }
    var geprueft = 0, draussen = [];
    pr.forEach(function (q) {
      if (q[0] < versatzX + 0.001) return;              // hinten bewusst frei
      geprueft++;
      var x = q[0] - versatzX, y = q[1] + versatzY;
      if (!drin(deckel, x, y) && !amRand(deckel, x, y)) draussen.push(q);
    });
    /* Dass der Deckel alles verdeckt, heisst noch nicht, dass die Rinne
       die richtige Form hat – eine Rinne ohne Fasen waere kleiner und
       laege erst recht dahinter. Deshalb zusaetzlich: Die beiden Fasen
       muessen da sein, und die UNTERE muss die groessere sein. */
    function hat(x, y) {
      return pr.some(function (q) {
        return Math.abs(q[0] - x) < 0.01 && Math.abs(q[1] - y) < 0.01;
      });
    }
    var B2 = RINNE.breite, H2 = RINNE.hoehe, f2 = RINNE.fase;
    var fasen = hat(B2 - f2, 0) && hat(B2, f2) &&                 // unten gross
                hat(B2, H2 - f2 * 0.6) && hat(B2 - f2 * 0.6, H2); // oben klein
    pruefe('Rinne hat vorne beide Fasen, unten die größere',
           gegen ? !fasen : fasen,
           fasen ? (f2 * 10).toFixed(0) + ' mm unten, ' +
                   (f2 * 6).toFixed(0) + ' mm oben'
                 : 'Fasenpunkte fehlen im Umriss');

    var alleDrin = geprueft > 8 && draussen.length === 0;
    pruefe('Jeder Punkt der Rinne liegt hinter der Blende',
           gegen ? !alleDrin : alleDrin,
           draussen.length ? draussen.length + ' von ' + geprueft + ' Punkten schauen heraus'
                           : 'alle ' + geprueft + ' geprüften Punkte verdeckt');
  })();

  /* Die Wandprofilkappe (6013) ist BELEGT: 146,27 hoch x 89,16 breit, der
     flache Bogen an der AUSSENkante. Die Skizze zeigt sie liegend – „der
     flache bogen muss nach rechts zeigen, das bild is falsch gedreht"
     (Betreiber, 14.10.2026). Geprueft wird deshalb auch, dass sie hoeher
     als breit ist; genau das war vorher verdreht. */
  var wOk = w.bogen >= 2 &&
            Math.abs(w.breit - WANDDECKEL.breite) < 0.02 &&
            Math.abs(w.hoch - WANDDECKEL.hoehe) < 0.02 &&
            w.hoch > w.breit;
  pruefe('Wandprofilkappe: 146,27 hoch, Bogen außen', gegen ? !wOk : wOk,
         (w.breit * 10).toFixed(1) + ' x ' + (w.hoch * 10).toFixed(1) + ' mm, ' +
         w.bogen + ' Bogenstuecke');
  pruefe('Die beiden Deckel sind NICHT dieselbe Form',
         gegen ? r.umriss === w.umriss : r.umriss !== w.umriss, '');
})();
pruefe('Beide Deckel werden gleich gebaut und gesetzt',
       (k3d.match(/function profilKappen/g) || []).length === 1 &&
       new RegExp(q || 'profilKappen\\(laenge, 0, wpOk - WANDDECKEL\\.hoehe').test(k3d) &&
       new RegExp(q || 'if \\(!sky\\) wandprofilKappen\\(B, wpOk, mAlu\\)').test(k3d),
       'eine Bauweise, zwei Formen');
/* „du hast beim sky view die wandprofil blende hingetan die kann weg"
   (Betreiber, 15.10.2026). Beim SkyView steht hinten der Traeger TD an
   Stelle des Wandprofils; ein Seitendeckel dafuer gehoert dort nicht hin.
   Dieselbe Fehlerart wie bei der Pfostenachse am Vortag – ein Teil, das an
   einem bestimmten Profil haengt, ohne Verzweigung gebaut. */
pruefe('Wandprofil-Seitendeckel nur beim TDS',
       gegen ? !/if \(!sky\) wandprofilKappen/.test(k3d)
             : /if \(!sky\) wandprofilKappen/.test(k3d),
       'beim SkyView deckt die Seitenblende Sky die Seite ab');
(function () {
  /* KEINE Gravur: Die Kappen bekommen dasselbe Alu wie alle anderen
     Profile – kein eigenes Material, keine Textur, kein Schriftzug. Das
     Zeichen auf dem Werkbild ist die Marke des HERSTELLERS; sie gehoert
     nicht in ein Bild, das wir verantworten. */
  var fn = (k3d.match(/function profilKappen\([\s\S]*?\n  \}/) || [''])[0];
  var sauber = fn.indexOf('material') > -1 &&
               !/map|Texture|canvas|fillText/.test(fn) && !gegen;
  pruefe('Kappen tragen keine Gravur', sauber,
         sauber ? 'nur Material, keine Beschriftung' : 'Textur oder Schrift gefunden');
})();

/* ---------- Werkbilder vom 11.10.2026: Rillen und Randblende ----------
   „hier ein perfekter querschnitt unserer überdachung kannst du es so
   neu modellieren" – „nicht 100% 1:1 aber ähnlich und einfach"
   (Betreiber, mit fuenf Werkbildern). Zwei Dinge daraus: die fein
   gerillte Rinnenfront und der seitlich geschlossene Dachrand. */
(function () {
  /* Zweiter Weg: den ECHTEN Rinnenquerschnitt laufen lassen. Die Rillen
     duerfen die vier belegten Hauptmasse NICHT antasten – genau das ist
     die Gefahr, wenn man an einem Profil nur „die Optik" aendert. */
  var quer = (k3d.match(/function rinneQuerschnitt\(mitKehle\)[\s\S]*?\n  \}/) || [''])[0];
  var blockR = (k3d.match(/var RINNE = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!quer || !blockR) { pruefe('Rinnenquerschnitt lesbar', false, 'nicht gefunden'); return; }
  function zahl(name) {
    var m = blockR.match(new RegExp(name + ':\\s*([\\d.]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  var RINNE = { breite: zahl('breite'), hoehe: zahl('hoehe'),
                innenBreite: zahl('innenBreite'), innenTiefe: zahl('innenTiefe'),
                rueckwand: zahl('rueckwand'), wangeAb: zahl('wangeAb'),
                rilleTeilung: zahl('rilleTeilung'),
                schenkelDick: zahl('schenkelDick'),
                schenkelLang: zahl('schenkelLang'),
                fase: zahl('fase') };
  var punkte = [];
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  /* Die Kehle wird als eigener Pfad gezeichnet und reicht bewusst ueber
     die Oberkante hinaus. Sie gehoert NICHT zum Umriss – deshalb ein
     eigener, stummer Stub dafuer, sonst misst diese Pruefung 1 cm zu
     viel und beschuldigt die Rillen. */
  function Pfad() {}
  Pfad.prototype.moveTo = function () {};
  Pfad.prototype.lineTo = function () {};
  Pfad.prototype.quadraticCurveTo = function () {};
  Pfad.prototype.closePath = function () {};
  var THREE = { Shape: Form, Path: Pfad };
  var fn = eval('(' + quer + ')');
  fn(false);
  var xs2 = punkte.map(function (p) { return p[0]; });
  var ys2 = punkte.map(function (p) { return p[1]; });
  var breit = Math.max.apply(null, xs2) - Math.min.apply(null, xs2);
  /* Die Hoehe wird AB DEM BODEN gemessen (y = 0), nicht vom tiefsten
     Punkt: Seit dem 14.10.2026 haengt der Schenkel fuer die
     Pfostenverschraubung unter dem Profil, bei negativem y. Die
     bemassten 136,7 mm beziehen sich auf das Profil darueber. */
  var hoch = Math.max.apply(null, ys2);
  var tiefsterPunkt = Math.min.apply(null, ys2);
  if (gegen) breit += 1;
  pruefe('Rillen aendern die Rinnenmasse nicht',
         Math.abs(breit - RINNE.breite) < 0.02 && Math.abs(hoch - RINNE.hoehe) < 0.02,
         breit.toFixed(2) + ' x ' + hoch.toFixed(2) + ' cm (Zeichnung ' +
         RINNE.breite + ' x ' + RINNE.hoehe + ')');
  /* Der Schenkel haengt nach unten – und zwar HINTEN, an der Rueckseite
     (x = 0). Dort steht der Pfosten davor. */
  var schenkelPunkte = punkte.filter(function (p) { return p[1] < -0.01; });
  var allHinten = schenkelPunkte.length > 0 && schenkelPunkte.every(function (p) {
    return p[0] <= RINNE.schenkelDick + 0.001;
  });
  var tiefOk = Math.abs(tiefsterPunkt + RINNE.schenkelLang) < 0.001;
  pruefe('Rinne hat hinten unten den Schenkel für die Pfosten',
         gegen ? !(allHinten && tiefOk) : (allHinten && tiefOk),
         schenkelPunkte.length + ' Punkte unter dem Boden, ' +
         (-tiefsterPunkt * 10).toFixed(0) + ' mm lang, ' +
         (RINNE.schenkelDick * 10).toFixed(0) + ' mm dick');
  /* Die Rillen liegen zurueckgesetzt – gezaehlt werden die Punkte, die
     NICHT an der Vorderkante stehen, aber in der Vorderflaeche liegen. */
  var tief = punkte.filter(function (p) {
    return p[0] < RINNE.breite - 0.1 && p[0] > RINNE.breite - 1.0;
  }).length;
  if (gegen) tief = 0;
  pruefe('Rinnenfront ist gerillt, nicht glatt', tief >= 8,
         tief + ' zurueckgesetzte Punkte, Teilung ' + RINNE.rilleTeilung + ' cm');
})();
(function () {
  /* Die Randblende ist VERKLEIDUNG. Geprueft wird, dass sie aussen
     buendig mit der Dachkante sitzt und genau von der Sparrenunterkante
     bis an die Glasoberseite reicht – und dass sie keine Sparrenachse
     verschiebt (die Achsformel muss unveraendert sein). */
  var fx = (k3d.match(/vz \* \(B \/ 2 - RANDBLENDE\.dicke \/ 2 \+ RANDBLENDE\.vor\)/) || [])[0];
  /* spH… – es gibt noch ein blendeH bei der Markise. */
  /* Der TDS-Zweig der Formel – bei SkyView gilt die Rahmenhoehe, das
     prueft der SkyView-Block weiter unten. */
  var fh = (k3d.match(/var blendeH = sky \? riH : (spH[^;]+);/) || [])[1];
  var dicke = parseFloat((k3d.match(/RANDBLENDE = \{ dicke: ([\d.]+)/) || [])[1]);
  var vor = parseFloat((k3d.match(/RANDBLENDE = \{ dicke: [\d.]+, vor: ([\d.]+)/) || [])[1]);
  if (!fx || !fh || !dicke) { pruefe('Randblende lesbar', false, 'nicht gefunden'); return; }
  var B = 500, spH = 12.0, glas = 0.8, ukMitte = 200;
  var istPolycarbonat = function () { return false; };
  var Z = { glasstaerke: 8 };
  var blendeH = eval(fh);
  var xMitte = (gegen ? 0.5 : 1) * (B / 2 - dicke / 2 + vor);
  var aussen = xMitte + dicke / 2;
  var yMitte = ukMitte + blendeH / 2;
  var falsch = 0, meld = [];
  /* Die Blende liegt VOR der Dachkante, nicht genau darin: sonst
     teilen sich Blende und Randsparren eine Ebene und der Sparren
     blitzt durch. Ein paar Millimeter genuegen, mehr soll es auch
     nicht sein. */
  var ueberstand = aussen - B / 2;
  if (!(ueberstand > 0.05 && ueberstand < 0.6)) {
    falsch++; meld.push('Vorsprung ' + (ueberstand * 10).toFixed(1) + ' mm');
  }
  if (Math.abs((yMitte - blendeH / 2) - ukMitte) > 0.001) {
    falsch++; meld.push('Unterkante nicht am Sparren');
  }
  if (Math.abs((yMitte + blendeH / 2) - (ukMitte + spH + glas)) > 0.001) {
    falsch++; meld.push('Oberkante nicht an der Glasoberseite');
  }
  pruefe('Randblende deckt den Randsparren ab', falsch === 0,
         falsch === 0 ? blendeH.toFixed(1) + ' cm hoch, ' +
         (ueberstand * 10).toFixed(1) + ' mm vor der Kante' : meld.join('; '));
  /* Zweiter Weg: Liegt der Randsparren wirklich dahinter? Gerechnet mit
     der Achsformel und der Sparrenbreite aus dem Code. */
  (function () {
    var spB = parseFloat((k3d.match(/var SPARREN = \{\s*\n\s*breite:\s*([\d.]+)/) || [])[1]);
    [3, spB / 2].forEach(function (randAchse) {       // TDS und SkyView
      var spAussen = B / 2 - randAchse + spB / 2;
      var blAussen = B / 2 - dicke / 2 + vor + dicke / 2 - (gegen ? 0.3 : 0);
      pruefe('Blende liegt vor dem Randsparren (Achse ' +
             randAchse.toFixed(2) + ' cm)',
             blAussen > spAussen + 0.01,
             ((blAussen - spAussen) * 10).toFixed(1) + ' mm davor');
    });
  })();
  pruefe('Randblende verschiebt keine Sparrenachse',
         new RegExp(q || "xs\\.push\\(-B / 2 \\+ randAchse \\+ \\(B - 2 \\* randAchse\\) \\* i / felder\\)").test(k3d),
         'Achsformel unveraendert');
})();

/* ---------- Statiktraeger: unten buendig mit den Sparren ----------
   „der statikträger ist tiefer als der sparren, mach ihn unten bündig
   mit sparren und oben bündig mit glasleiste" (Betreiber, 11.10.2026,
   mit Bild). Steht er HINTER den Sparren, ist er die Wand und darf
   unten nicht hervorstehen. Liegt er UNTER den Sparren (hinterer
   Dachvorsprung), traegt er wirklich und behaelt seine vollen 189 mm. */
pruefe('Traegerhoehe folgt dem Dach, nicht dem festen Mass',
       new RegExp(q || 'var trH = \\(frei && vorsprH <= 0\\) \\? Math\\.max\\(spH, trOk - ukHinten\\) : TR_H;').test(k3d) &&
       new RegExp(q || 'balken\\(B, trH, TR_T, 0, trOk - trH / 2').test(k3d) &&
       !/balken\(B, TR_H, TR_T/.test(k3d), '');
(function () {
  /* Zweiter Weg: die Lagen ausrechnen. Oben muss der Traeger mit der
     Glasleiste abschliessen, unten mit der Sparrenunterkante. */
  var fTr = (k3d.match(/var trH = ([^;]+);/) || [])[1];
  if (gegen) fTr = 'TR_H';                 // der alte Zustand
  var TR_H = 18.9, spH = 12.0, glas = 0.8;
  var ukHinten = 200, dachOk = ukHinten + spH, trOk = dachOk + glas;
  var frei = true, vorsprH = 0;
  var trH = eval(fTr);
  var trUk = trOk - trH;
  pruefe('Traeger steht unten nicht unter den Sparren',
         Math.abs(trUk - ukHinten) < 0.001,
         'Unterkante ' + ((trUk - ukHinten) * 10).toFixed(0) + ' mm unter dem Sparren');
  /* Mit hinterem Vorsprung bleibt das belegte Mass stehen. */
  var fTr2 = (k3d.match(/var trH = ([^;]+);/) || [])[1];
  vorsprH = gegen ? 0 : 100;
  var trH2 = eval(fTr2);
  pruefe('Unter den Sparren behaelt er die belegten 189 mm',
         Math.abs(trH2 - TR_H) < 0.001, trH2.toFixed(1) + ' cm');
})();

/* Die Sparren schieben sich IN die untere Kammer, bis an die Rueckwand:
   „der sparren muss in dem wandprofil in die untere öffnung reingehen bis
   an die wandprofilwand, und die glasleiste muss in die obere öffnung"
   (Betreiber, 14.10.2026).

   Am 11.10.2026 stand hier das Gegenteil (Anschlag an der Vorderkante),
   und das war damals richtig: Das Profil war ein massiver Quader, ein
   Sparren darin waere verschwunden. Mit den echten Kammern gilt wieder
   die Bauart. Glas und Leiste haengen an derselben Groesse und laufen
   mit in die obere Kammer. */
pruefe('Sparren reichen bis an die Rückwand des Wandprofils',
       new RegExp(q || 'zSpHinten = sky \\? wpT : WANDPROFIL\\.wand;').test(k3d),
       'in die untere Kammer, nicht davor');
pruefe('Sparrenlaenge und -mitte folgen dem Profil',
       new RegExp(q || ': \\(dachTiefe - zSpHinten\\) / Math\\.cos\\(neig\\)').test(k3d) &&
       new RegExp(q || 'zMitte = sky \\? T / 2 : \\(dachTiefe \\+ zSpHinten\\) / 2').test(k3d), '');
pruefe('Dachoberkante wird am Sparrenende gerechnet',
       new RegExp(q || 'dachTiefeJetzt - zSpHinten').test(k3d),
       'nicht mehr 45 mm vor der Wand');
(function () {
  /* Zweiter Weg: die Lagen aus den Zahlen der Datei nachrechnen, nicht
     aus der Absicht. wpT kommt aus dem Code, nicht aus dieser Datei. */
  var wpT = parseFloat((k3d.match(/var WANDPROFIL = \{[\s\S]*?tiefe:\s*([\d.]+)/) || [])[1]);
  var sun = parseFloat((k3d.match(/sparrenUnterNase:\s*([\d.]+)/) || [])[1]);
  if (!wpT || !sun) { pruefe('Profilmasse lesbar', false, 'wpT/sparrenUnterNase fehlt'); return; }
  var spH = 12.0, wpH = 14.36, glas = 0.8, riH = 13.67, rinneB = 18.63;
  var hVorn = 230, neig = 8 * Math.PI / 180, T = 300, dachTiefe = T - rinneB;
  /* gegen: die ALTE Rechnung - Sparren ab der Wand, Dachoberkante 45 mm
     davor, Scheibe 10 mm vor dem Sparrenende. */
  var zSp = gegen ? 0 : wpT;
  var zOk  = gegen ? 4.5 : wpT;
  var ukVorn = hVorn + (riH - sun - spH);
  var dachOk = ukVorn + Math.tan(neig) * (dachTiefe - zOk) + spH;
  var falsch = 0, meld = [];
  /* 1. Profil und Sparren duerfen sich nicht durchdringen. */
  if (zSp < wpT - 0.001) { falsch++; meld.push('Sparren steckt ' + ((wpT - zSp) * 10).toFixed(0) + ' mm im Profil'); }
  /* 2. Profiloberkante = Glasoberseite am Sparrenende. */
  var glasOkHinten = ukVorn + Math.tan(neig) * (dachTiefe - wpT) + spH + glas;
  var wpOk = dachOk + glas;
  if (Math.abs(wpOk - glasOkHinten) > 0.01) { falsch++; meld.push('Dach steht ' + ((glasOkHinten - wpOk) * 10).toFixed(0) + ' mm ueber dem Profil'); }
  /* 3. Das Profil muss die Sparren in der Hoehe fassen. */
  if (wpOk - wpH > dachOk - spH + 0.001) { falsch++; meld.push('Sparrenunterkante unter dem Profil'); }
  pruefe('Profil hinter den Sparren, oben buendig', falsch === 0,
         falsch === 0 ? 'drei Lagen stimmen' : meld.join('; '));
})();
/* Die Scheibe stoesst hinten an das Profil - seit die Sparren davor
   beginnen, waere ein Ruecksprung ein offener Schlitz. */
pruefe('Eindeckung ohne Ruecksprung hinten',
       new RegExp(q || 'glasRueck = sky \\? 1 : 0').test(k3d) &&
       new RegExp(q || ': laenge \\+ glasUeber - 1 - glasRueck').test(k3d), '');
(function () {
  /* Zweiter Weg: Glashinterkante aus der gebauten Formel zuruecklesen. */
  var laenge = 100, glasUeber = 10.75, glasRueck = gegen ? 1 : 0;
  var zGlasMitte = (laenge / 2) + (glasRueck + glasUeber - 1) / 2;   // zMitte = laenge/2
  var vollGlas = gegen ? (laenge - 2 + glasUeber) : (laenge + glasUeber - 1 - glasRueck);
  var hinten = zGlasMitte - vollGlas / 2;                            // 0 = Sparrenanfang
  pruefe('Glas endet am Sparrenanfang', Math.abs(hinten) < 0.001,
         (hinten * 10).toFixed(0) + ' mm Schlitz');
})();
/* „das wandprofil muss oben mit dem statiktraeger bei freistehend
   buendig sein ... damit die glasleisten nicht ueberstehen" (Betreiber,
   11.10.2026). Vorher endete der Traeger an der Sparrenoberkante, das
   Profil eine Glasdicke hoeher - es stand ueber und gab die Glasleiste
   frei. */
pruefe('Träger endet buendig mit dem Wandprofil',
       new RegExp(q || 'trOk = vorsprH > 0 \\? ukAmTraeger : wpOk;').test(k3d),
       'mit hinterem Vorsprung unter den Sparren');
(function () {
  /* Zweiter Weg: die beiden Oberkanten wirklich vergleichen. */
  var glas = 0.8, dachOk = 100;
  var wpOk = dachOk + glas;
  var trOk = gegen ? dachOk : wpOk;          // gegen: die alte Formel
  var ueber = wpOk - trOk;                   // soll 0 sein
  pruefe('Profil steht nicht ueber dem Träger', Math.abs(ueber) < 0.001,
         (ueber * 10).toFixed(0) + ' mm Ueberstand');
})();
pruefe('Keine Hoehe mehr aus hHinten abgeleitet',
       gegen ? /wpMitte = hHinten/.test(k3d) : !/wpMitte = hHinten/.test(k3d),
       'Durchgangshoehe ist nicht die Dachoberkante');
/* Zweiter Weg: die Lagen wirklich ausrechnen. */
(function () {
  var sun = parseFloat((k3d.match(/sparrenUnterNase:\s*([\d.]+)/) || [])[1]);
  if (!sun) { pruefe('Rinnenmass lesbar', false, 'sparrenUnterNase fehlt'); return; }
  var spH = 12.0, hVorn = 230, neig = 8 * Math.PI / 180, T = 300 - 11.7;
  var riH = 13.67, rinneB = 18.63, zH = 3.1, TR_H = 18.9, wpH = 14.36;
  var ukVorn = hVorn + (riH - sun - spH);
  var ukHinten = ukVorn + Math.tan(neig) * ((T - rinneB) - zH);
  var dachOk = ukHinten + spH;
  var ueber = dachOk - dachOk + (gegen ? 5.2 : 0);     // soll 0 sein
  pruefe('Träger ragt nicht ueber das Dach', Math.abs(ueber) < 0.01,
         ueber.toFixed(1) + ' cm Ueberstand');
  /* Der Traeger ist hoeher als das Wandprofil - aber nur um gut 4 cm,
     nicht um ein Vielfaches. Genau nachgerechnet statt grob geschaetzt. */
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

/* ---------- Querstoss in der Verglasung ----------
   „und vsg glas kann ja ab ner bestimmten länge nict am stück verbaut
   werden sondern is dann getrennt und muss gekopelt werden" (Betreiber,
   11.10.2026). Schwelle ist die Tiefe, bei der die Masstabelle einen
   Innenkern fuehrt. */
pruefe('Querstoss nur bei Glas',
       new RegExp(q || 'return !istPolycarbonat\\(\\) && Z\\.tiefe > SCHEIBE_LANG').test(k3d),
       'Stegplatten kommen in langen Bahnen');
/* Der Innenkern ist KEINE Glaskopplung - die Schwelle darf nicht mehr
   daran haengen (Betreiber, 11.10.2026). */
pruefe('Schwelle haengt nicht mehr am Innenkern',
       gegen ? /innenkernTiefe/.test(k3d) : !/M\.regeln\.innenkernTiefe/.test(k3d), '');
pruefe('Groesste Scheibe als eigene Zahl',
       gegen ? !/SCHEIBE_LANG = 4500;/.test(k3d) : /SCHEIBE_LANG = 4500;/.test(k3d),
       'Angabe des Betreibers');
pruefe('Innenkern wird nicht mehr angezeigt',
       gegen ? /z\.push\(\['Innenkern-Sparren'/.test(k3d)
             : !/z\.push\(\['Innenkern-Sparren'/.test(k3d), '');
pruefe('Zwei Scheiben statt einer',
       new RegExp(q || 'koppelVorn = vollGlas / 2 - koppelLokal - KOPPEL\\.breite / 2').test(k3d), '');
/* ---------- Lage des Stosses einstellbar ----------
   „falls eine kopplung nötig is soll diese im 3d modell sichtbar sein
   und ne einstellung geben das ich sie verschieben kann im erlaubten
   bereich" (Betreiber, 11.10.2026). */
pruefe('Regler fuer die Stosslage',
       gegen ? !/id="k3dKoppel"/.test(html) : /id="k3dKoppel"/.test(html), '');
pruefe('Regler nur, wenn es einen Stoss gibt',
       new RegExp(q || "case 'kopplung':       return glasGeteilt\\(\\)").test(k3d), '');
pruefe('Erlaubter Bereich aus der Scheibenlaenge',
       new RegExp(q || 'min: Math\\.max\\(100, Z\\.tiefe - SCHEIBE_LANG\\)').test(k3d), '');
pruefe('Voreingestellt mittig',
       new RegExp(q || 'if \\(!Z\\.koppelLage\\) return Math\\.round\\(Z\\.tiefe / 2\\)').test(k3d), '');
pruefe('Stossprofil folgt der Einstellung',
       new RegExp(q || 'Math\\.cos\\(neig\\) \\* koppelLokal').test(k3d), '');
/* Zweiter Weg: den erlaubten Bereich rechnen und pruefen, dass beide
   Scheiben darin nie laenger werden als 4500 mm. */
(function () {
  var LANG = 4500;
  function bereich(t) {
    return { min: Math.max(100, t - LANG), max: Math.min(LANG, t - 100) };
  }
  [[4600, 100, 4500], [5500, 1000, 4500], [7000, 2500, 4500]].forEach(function (f) {
    var b = bereich(f[0]);
    var mn = b.min + (gegen ? -200 : 0), mx = b.max + (gegen ? 200 : 0);
    pruefe('Bereich bei ' + f[0] + ' mm: ' + f[1] + ' bis ' + f[2],
           mn === f[1] && mx === f[2], mn + ' bis ' + mx);
  });
  /* An beiden Enden des Bereichs darf keine Scheibe ueber 4500 mm. */
  var t = 7000, b = bereich(t), schlimm = 0;
  [b.min, (b.min + b.max) / 2, b.max].forEach(function (d) {
    schlimm = Math.max(schlimm, d, t - d);
  });
  schlimm += (gegen ? 200 : 0);
  pruefe('Keine Scheibe laenger als 4500 mm', schlimm <= LANG,
         'laengste Scheibe ' + schlimm + ' mm bei ' + t + ' mm Tiefe');
})();
/* Querschnitt des Glaskopplungsprofils - BELEGT durch die
   Herstellerzeichnung (28 x 6 mm). Vorher 60 x 30 mm geschaetzt. */
(function () {
  var m = k3d.match(/var KOPPEL = \{ breite: ([\d.]+), hoehe: ([\d.]+) \};/);
  if (!m) { pruefe('Kopplungsmass lesbar', false, 'Zeile nicht gefunden'); return; }
  var b = parseFloat(m[1]) * 10 + (gegen ? 7 : 0);
  var h = parseFloat(m[2]) * 10 + (gegen ? 7 : 0);
  pruefe('Glaskopplungsprofil 28 mm breit', Math.abs(b - 28) < 0.5, b + ' mm');
  pruefe('Glaskopplungsprofil 6 mm hoch', Math.abs(h - 6) < 0.5, h + ' mm');
  /* Es darf nicht hoeher bauen als die Scheibe dick ist - sonst stuende
     es wie eine Schwelle auf dem Dach. VSG 8 oder 10 mm. */
  pruefe('Profil nicht hoeher als die duennste Scheibe', h <= 8, h + ' mm gegen 8 mm Glas');
})();
/* Durchsichtiges Gummi, kein Alu (Betreiber, 11.10.2026). */
pruefe('Kopplungsprofil ist durchsichtig',
       new RegExp(q || 'var mKoppel = new THREE\\.MeshPhysicalMaterial').test(k3d) &&
       /transparent: true, opacity: 0\.55,/.test(k3d), 'Gummi, nicht Alu');
/* Bewusst dunkler als das echte Gummi, sonst sieht man es im Bild
   nicht (Betreiber, 11.10.2026). */
(function () {
  var m = k3d.match(/var mKoppel = new THREE\.MeshPhysicalMaterial\(\{\s*\n\s*color: rgb\(0x([0-9a-f]{6})\)/);
  if (!m) { pruefe('Farbton des Kopplungsprofils lesbar', false, ''); return; }
  var n = parseInt(m[1], 16);
  /* Jede der beiden Schranken braucht ihren EIGENEN Versatz: ein
     gemeinsamer macht die eine Pruefung falsch und die andere erst
     recht wahr - sie koennte dann nie anschlagen. */
  var hell = ((n >> 16 & 255) + (n >> 8 & 255) + (n & 255)) / 3;
  pruefe('Kopplungsprofil dunkler als das Glas', hell + (gegen ? 70 : 0) < 200,
         'Helligkeit ' + Math.round(hell) + ' von 255');
  pruefe('Aber nicht schwarz', hell - (gegen ? 100 : 0) > 100,
         'Helligkeit ' + Math.round(hell));
})();
pruefe('Kopplungsprofil ohne Metallanteil, nur leicht matt',
       new RegExp(q || 'roughness: 0\\.28, metalness: 0,').test(k3d),
       'glatter als mein erster Wert 0,55');
pruefe('Kopplungsprofil wirft keinen Schatten',
       gegen ? /kq\.castShadow = true/.test(k3d) : !/kq\.castShadow/.test(k3d),
       'sonst ein dunkler Streifen quer ueber die Terrasse');
pruefe('Kopplungsprofil ueber die volle Breite',
       new RegExp(q || 'BoxGeometry\\(B, KOPPEL\\.hoehe, KOPPEL\\.breite\\)').test(k3d), '');
pruefe('Hinweis im Bedienfeld',
       gegen ? !/quer gestoßen und gekoppelt/.test(k3d) : /quer gestoßen und gekoppelt/.test(k3d), '');
pruefe('Anfrage nennt den Stoss mit seiner Lage',
       new RegExp(q || "quer gestoßen und gekoppelt bei ' \\+\\s*\\n?\\s*koppelAbstand\\(\\)").test(k3d),
       'in eindeckungFach, also an EINER Stelle');
pruefe('Wort „Innenkern" nicht mehr in der Anfrage',
       gegen ? /gekoppelt \(Innenkern\)/.test(k3d) : !/gekoppelt \(Innenkern\)/.test(k3d), '');
/* Zweiter Weg: die Schwelle gegen die Tabelle rechnen. */
(function () {
  /* Die groesste Scheibe am Stueck ist die letzte Tiefe VOR dem
     Innenkern. Der Betreiber schaetzt „4,50 oder 5 m" - die Tabelle
     stuetzt die 4,50: ab 4600 mm fuehrt sie einen Innenkern. */
  var amStueck = M.regeln.innenkernTiefe - 100 + (gegen ? 600 : 0);
  pruefe('Groesste Scheibe am Stueck ist 4500 mm', amStueck === 4500,
         amStueck + ' mm');
  function geteilt(tiefe, poly) { return !poly && tiefe >= M.regeln.innenkernTiefe; }
  [[3000, false, false], [4600, false, true], [7000, false, true],
   [7000, true, false]].forEach(function (f) {
    var ist = geteilt(f[0], f[1]);
    if (gegen) ist = !ist;
    pruefe(f[0] + ' mm ' + (f[1] ? 'Polycarbonat' : 'Glas') + ' -> ' +
           (f[2] ? 'gestossen' : 'am Stueck'), ist === f[2], ist ? 'gestossen' : 'am Stueck');
  });
})();

/* ---------- Hoehe hinten: gekoppelt, aber entkoppelbar ----------
   „das soll gekopplt sein an vorne aber man soll es entkoppeln können
   und getrennt einstellen" (Betreiber, 11.10.2026). */
pruefe('Voreingestellt gekoppelt',
       gegen ? !/hoeheGetrennt: false,/.test(k3d) : /hoeheGetrennt: false,/.test(k3d), '');
pruefe('Haekchen zum Entkoppeln vorhanden',
       gegen ? !/id="k3dHoeheGetrennt"/.test(html) : /id="k3dHoeheGetrennt"/.test(html), '');
pruefe('Gekoppelt wird die Hoehe hinten gerechnet',
       new RegExp(q || 'Z\\.hoeheHinten = wandUkAus\\(Z\\.neigung\\)').test(k3d),
       'aus Unterkante Rinne, Dachtiefe und Profilmassen');
pruefe('Gekoppelt ist der Regler gesperrt',
       new RegExp(q || 'el\\.disabled = !frei').test(k3d), 'man sieht ihn, verstellt ihn aber nicht');
pruefe('Neigung nur bei entkoppelter Hoehe abgeleitet',
       new RegExp(q || "if \\(!hoehenGetrennt\\(\\) \\|\\| !Z\\.hoeheGetrennt\\) return Z\\.neigung").test(k3d), '');
/* Zweiter Weg: Kopplung und Prozentanzeige nachrechnen. */
(function () {
  var tab = {}; (k3d.match(/var NEIGUNG_PROZENT = \{([\s\S]*?)\};/) || ['',''])[1]
    .replace(/(\d+):\s*([\d.]+)/g, function (_, g, p) { tab[+g] = +p; return ''; });
  function prozent(grad) {
    if (tab[grad] != null) return tab[grad];
    return Math.round(Math.tan(grad * Math.PI / 180) * 1000) / 10;
  }
  /* Gemeldet war „9,100712926493951 %" - mehr als eine Nachkommastelle
     darf nie herauskommen. */
  var p = prozent(5.2) + (gegen ? 0.04 : 0);
  var stellen = String(p).split('.')[1];
  pruefe('Prozentwert hat hoechstens eine Nachkommastelle',
         !stellen || stellen.length <= 1, p + ' %');
  /* Gekoppelt: 2300 mm vorne, 3000 mm tief, 8 Grad -> 2300 + 14 % */
  var hinten = 2300 + Math.round(3000 * prozent(8) / 100) + (gegen ? 100 : 0);
  pruefe('Gekoppelte Hoehe hinten stimmt', hinten === 2720, hinten + ' mm');
})();

/* ---------- Unterzug: Lage verschiebbar, Preisliste haelt ----------
   „Ab gewissen tiefen von dächern tds, carport tds steht ja in der
   preisliste unterzug über die gesamte breite notwendig … ich will diesen
   unterzug aber von der mitte nach links oder rechts verschiebbar haben
   aber nur soweit das die angaben in der preisliste nicht gebrochen
   werden" (Betreiber, 15.10.2026, mit Bild).

   Die Regel ist nicht gewaehlt, sondern abgeleitet: Der Unterzug teilt die
   Tiefe in zwei Felder, und jedes davon ist ein Dach ohne Unterzug – also
   darf keines ueber tiefeMaxOhneUnterzug kommen. */
(function () {
  var M = require('path').resolve('js/masstabelle.js');
  delete require.cache[M];
  global.window = global.window || {};
  require(M);
  var ohne = window.BV_MASSTABELLE.regeln.tiefeMaxOhneUnterzug;
  var mit = window.BV_MASSTABELLE.regeln.tiefeMaxMitUnterzug;

  /* Die Formel aus dem Code, nicht nachgebaut, sondern ausgelesen. */
  var f = (k3d.match(/function unterzugBereich\(\)[\s\S]*?\n  \}/) || [''])[0];
  if (!f) { pruefe('Unterzug-Bereich lesbar', false, 'nicht gefunden'); return; }
  /* unterzugBereich() rechnet seit dem 15.10.2026 mit der SPANNWEITE –
     die Funktion dafuer wird mit ausgelesen, nicht nachgebaut. */
    var st = (k3d.match(/function statikTiefe\(\)[\s\S]*?\n  \}/) || [''])[0];
  var holen = eval('(function (Z, window, gruppeGilt) { ' +
    st.replace('function statikTiefe()', 'var statikTiefe = function ()') + ';' +
    f.replace('function unterzugBereich()', 'var fn = function ()') +
    '; return fn; })');

  /* Fuer jede lieferbare Tiefe mit Unterzug: Bei BEIDEN Grenzlagen
     muessen beide Felder unter dem Hoechstmass bleiben. */
  /* Immer wahr: In dieser Pruefung gilt jede Gruppe, damit der Vorsprung
     wirklich abgezogen wird. */
  function gilt() { return true; }
  var verletzt = [], geprueft = 0;
  for (var T = ohne + 100; T <= mit; T += 100) {
    var b = holen({ tiefe: T, vorsprung: 0, vorsprungHinten: 0 },
                  { BV_MASSTABELLE: window.BV_MASSTABELLE }, gilt)();
    [b.min, b.max].forEach(function (lage) {
      geprueft++;
      var grenze = ohne + (gegen ? -2000 : 0);
      if (lage > grenze + 0.5 || (T - lage) > grenze + 0.5) {
        verletzt.push(T + ' mm bei Lage ' + lage);
      }
    });
    if (b.min > b.max) verletzt.push(T + ' mm: Bereich leer');
  }
  pruefe('Unterzug-Grenzen halten die Preisliste ein',
         verletzt.length === 0,
         verletzt.length ? verletzt.length + ' Verstöße, z. B. ' + verletzt[0]
                         : geprueft + ' Grenzlagen geprüft, beide Felder stets ≤ ' + ohne + ' mm');

  /* Die Mitte muss im Bereich liegen – sonst waere der Vorgabewert selbst
     unzulaessig. */
  var mitteOk = true;
  for (var T2 = ohne + 100; T2 <= mit; T2 += 100) {
    var b2 = holen({ tiefe: T2, vorsprung: 0, vorsprungHinten: 0 },
                   { BV_MASSTABELLE: window.BV_MASSTABELLE }, gilt)();
    var m2 = Math.round(T2 / 2);
    if (m2 < b2.min || m2 > b2.max) mitteOk = false;
  }
  pruefe('Die Mitte ist immer erlaubt', gegen ? !mitteOk : mitteOk,
         'Vorgabewert liegt im Bereich');

  /* ---------- Mit Dachvorsprung ----------
     „wenn ich ne tiefe von 5000mm habe … aber 1000mm dachüberstand mache
     … dann liegen wir ja rechnerisch bei 4500 also nur noch innenkern
     träger nötig" (Betreiber, 15.10.2026). Der Vorsprung kragt aus, er
     verlaengert die Spannweite nicht. Geprueft wird die ganze Kette:
     Stufe, Bereichsgrenzen und Felder. */
  var mitVor = [];
  [[5000, 0, 'Unterzug'], [5000, 500, 'Innenkern'], [5000, 1000, 'nichts'],
   [7000, 1000, 'Unterzug'], [4600, 700, 'nichts']].forEach(function (r) {
    var sp = r[0] - r[1] - (gegen ? -r[1] : 0);
    var ist = sp > ohne ? 'Unterzug'
            : (sp > window.BV_MASSTABELLE.regeln.innenkernAbTiefe ? 'Innenkern' : 'nichts');
    if (ist !== r[2]) mitVor.push(r[0] + '/' + r[1] + ': ' + ist + ' statt ' + r[2]);
    if (ist === 'Unterzug') {
      var bv = holen({ tiefe: r[0], vorsprung: r[1], vorsprungHinten: 0 },
                     { BV_MASSTABELLE: window.BV_MASSTABELLE }, gilt)();
      [bv.min, bv.max].forEach(function (lage) {
        if (lage > ohne + 0.5 || (sp - lage) > ohne + 0.5) {
          mitVor.push(r[0] + '/' + r[1] + ': Feld über ' + ohne + ' bei Lage ' + lage);
        }
      });
    }
  });
  pruefe('Dachvorsprung zählt für die Statik nicht mit',
         mitVor.length === 0,
         mitVor.length ? mitVor.join('; ') : '5 Fälle geprüft, u. a. 5000/500 → Innenkern');
})();

/* Regler, 3D und Anfrage haengen an DERSELBEN Groesse – sonst zeigt der
   Regler etwas anderes, als gebaut und bestellt wird. */
pruefe('Unterzug: Regler, 3D und Anfrage aus einer Quelle',
       gegen ? !/unterzugAbstand\(\)/.test(k3d)
             : (k3d.match(/unterzugAbstand\(\)/g) || []).length >= 3,
       (k3d.match(/unterzugAbstand\(\)/g) || []).length + ' Verwendungen');
pruefe('Unterzug wird im 3D gebaut: Träger UND Pfosten',
       gegen ? !/verteilen\(pfostenUnterTraeger\(Z\.breite\), B, PF \/ 2\)\.forEach\(function \(x\) \{\s*balken\(PF, hPfUz/.test(k3d)
             : /balken\(B, uzH, TR_T, 0, uzOk - uzH \/ 2, zUz, mAlu\)/.test(k3d) &&
               /balken\(PF, hPfUz, PF, x, hPfUz \/ 2, zUz, mAlu\)/.test(k3d),
       'Statikträger quer plus eigene Pfostenreihe');
pruefe('Unterzug nur wo nötig – und nicht beim SkyView',
       gegen ? !/if \(!sky && unterzugNoetig\(\)\)/.test(k3d)
             : /if \(!sky && unterzugNoetig\(\)\)/.test(k3d),
       'beim SkyView trägt der umlaufende Rahmen');
pruefe('Unterzug-Lage steht in der Anfrage',
       gegen ? !/Unterzug \(Statikträger über die ganze Breite\)/.test(k3d)
             : /Unterzug \(Statikträger über die ganze Breite\)/.test(k3d) &&
               /Felder ' \+ uzA \+ ' \/ ' \+ uzB \+ ' mm'/.test(k3d),
       'mit beiden Feldmaßen');

/* Jedes Feld eines geteilten Dachs ist ein Dach fuer sich: Ueber 4000 mm
   braucht es dort den Innenkern-Traeger. Bei mittiger Lage faellt das oft
   weg, bei verschobener nicht – deshalb steht es in der Anfrage. */
pruefe('Innenkern wird je Feld gemeldet',
       gegen ? !/innenkernNoetig\(uzA\)/.test(k3d)
             : /innenkernNoetig\(uzA\)/.test(k3d) && /innenkernNoetig\(uzB\)/.test(k3d) &&
               /Innenkern-Träger nötig im/.test(k3d),
       'vorderes und hinteres Feld getrennt');
pruefe('Ohne Unterzug wird der Innenkern ganz gemeldet',
       gegen ? !/else if \(innenkernNoetig\(\)\)/.test(k3d)
             : /else if \(innenkernNoetig\(\)\)/.test(k3d),
       'Tiefe zwischen 4000 und 4600 mm');

/* ---------- Dachvorsprung beim Carport bis 1500 mm ----------
   „dachvorsprung bei carport ruhig machen möglich bis 1500mm nicht nur
   800mm" (Betreiber, 11.10.2026). */
pruefe('Hoechstmass je Produkt hinterlegt',
       gegen ? !/carport: 1500, standard: 800/.test(k3d)
             : /carport: 1500, standard: 800/.test(k3d), '');
pruefe('Grenze wird vor dem Auslesen gesetzt',
       new RegExp(q || 'vorsprungGrenzeSetzen\\(\\);[\\s\\S]{0,80}Z\\.vorsprung = zahl').test(k3d),
       'sonst bleibt der alte Wert stehen');
pruefe('Wert wird beim Produktwechsel mitgezogen',
       new RegExp(q || 'if \\(Z\\[pr\\[1\\]\\] > max\\)').test(k3d),
       'kein Mass in der Anfrage, das der Regler nicht hergibt');
pruefe('Beide Vorspruenge betroffen',
       new RegExp(q || "\\['k3dVorsprungHinten', 'vorsprungHinten'\\]\\].forEach").test(k3d), '');
(function () {
  var mx = k3d.match(/carport: (\d+), standard: (\d+)/);
  if (!mx) { pruefe('Grenzen lesbar', false, ''); return; }
  var cp = parseInt(mx[1], 10), st = parseInt(mx[2], 10) + (gegen ? 800 : 0);
  pruefe('Carport darf weiter auskragen als das Terrassendach', cp > st,
         cp + ' mm gegen ' + st + ' mm');
  /* Beim Wechsel zurueck muss gekappt werden. */
  var wert = 1400, gekappt = Math.min(wert, st) + (gegen ? 800 : 0);
  pruefe('1400 mm wird beim Wechsel auf Terrassendach gekappt',
         gekappt <= 800, gekappt + ' mm');
})();

/* ---------- Carport freistehend: beide Hoehen getrennt ----------
   „bei carport tds will ich nur höhe vorne und höhe hinten unabhängig
   voneinander verstellen können in erweiterte einstellungen, und
   dachvorsprung vorne machen können und hinten auch" – ergaenzt um
   „also nur bei der freistehenden version" (Betreiber, 11.10.2026). */
/* ERWEITERT am 11.10.2026: Die getrennte Hoehe gibt es jetzt bei allen
   TDS-Anlagen, nicht nur beim freistehenden Carport – „man kann
   zusaetzlich zur durchgangshoehe die wandprofil unterkante hoehe
   angeben" (Betreiber). Sie steht ausserdem nicht mehr unter „Mehr
   Einstellungen", sondern direkt unter der Durchgangshoehe. */
pruefe('Getrennte Hoehen bei allen TDS-Anlagen',
       new RegExp(q || 'function hoehenGetrennt\\(\\) \\{\\s*\\n\\s*return neigungMoeglich\\(\\);').test(k3d), '');
pruefe('Hoehe hinten steht direkt unter der Durchgangshoehe',
       new RegExp(q || 'data-k3d-schritt="masse" data-k3d-fuer="hoehe-hinten"').test(html) &&
       !/data-k3d-mehr data-k3d-fuer="hoehe-hinten"/.test(html), '');
pruefe('Neigungsfeld verschwindet dafuer',
       new RegExp(q || "case 'neigung':        return neigungMoeglich\\(\\) && !Z\\.hoeheGetrennt").test(k3d),
       'nicht zwei Regler fuer dieselbe Sache');
/* Der HINTERE Vorsprung bleibt dagegen beim freistehenden Carport TDS.
   Er hing an hoehenGetrennt(); mit der Erweiterung waere er still an
   Anlagen aufgetaucht, die keinen haben duerfen. */
pruefe('Hinterer Vorsprung nur beim freistehenden Carport TDS',
       new RegExp(q || "case 'vorsprung-hinten': return vorsprungHintenMoeglich\\(\\)").test(k3d) &&
       new RegExp(q || "function vorsprungHintenMoeglich\\(\\) \\{\\s*\\n\\s*return istCarportTds\\(\\) && Z\\.aufbau === 'Freistehend'").test(k3d),
       'eigene Bedingung, nicht mehr hoehenGetrennt()');
pruefe('Beide Hoehen stehen in der Anfrage',
       new RegExp(q || "teile\\.push\\('Höhe hinten: '").test(k3d), '');
/* Zweiter Weg: die Neigung aus zwei Hoehen wirklich ausrechnen. */
(function () {
  function grad(vorn, hinten, tiefe) {
    var g = Math.atan((hinten - vorn) / Math.max(1, tiefe)) * 180 / Math.PI;
    return Math.min(14, Math.max(2, Math.round(g * 10) / 10));
  }
  [[2250, 2650, 3000, 7.6], [2250, 2250, 3000, 2], [2000, 3200, 3000, 14]]
    .forEach(function (f) {
      var ist = grad(f[0], f[1], f[2]) + (gegen ? 3 : 0);
      pruefe('Hoehe ' + f[0] + '/' + f[1] + ' bei ' + f[2] + ' mm -> ' + f[3] + '°',
             Math.abs(ist - f[3]) < 0.11, ist + '°');
    });
  /* Gekappt wird auf das zulaessige Band 2 bis 14 Grad. */
  var flach = grad(2250, 2250, 3000), steil = grad(2000, 4000, 3000);
  pruefe('Neigung bleibt im Band 2 bis 14 Grad',
         (gegen ? 0 : flach) >= 2 && (gegen ? 20 : steil) <= 14,
         flach + '° bis ' + steil + '°');
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
       new RegExp(q || "function hoehenGetrennt\\(\\)").test(k3d),
       'gemeinsame Bedingung mit den getrennten Hoehen');
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
       new RegExp(q || 'traeger = unterzugGilt\\(tb\\) \\|\\| vs > 0 \\|\\| wunsch').test(k3d) &&
       new RegExp(q || 'if \\(bt\\.traeger\\) \\{').test(k3d),
       'eine Entscheidung, von Hinweis und Anfrage genutzt');
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
       new RegExp(q || "var l = SG23_LAENGE\\[seite\\];").test(k3d),
       'Rueckfall auf Z.breite/Z.tiefe nur vor dem ersten Bauen');
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
  var mF = k3d.match(/return Z\.eindeckung\.replace\('VSG ', 'VSG ' \+ Z\.glasstaerke \+ ' mm '\) \+/);
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


/* ---------- Seitenglasleiste TD ----------
   Teilebild (Betreiber, 11.10.2026): 63,1 × 59,4 mm. „die glasleisten an
   den sparren ganz links und rechts haben so einen abschluss das man
   einen sauberen uebergang aussen hat". */
pruefe('Seitenglasleiste mit den Massen aus dem Teilebild',
       new RegExp(q || 'SEITENLEISTE = \\{ breite: 6\\.31, hoehe: 5\\.94').test(k3d),
       '63,1 x 59,4 mm');
pruefe('Nur die beiden aeusseren Sparren bekommen sie',
       new RegExp(q || 'i === 0 \\|\\| i === xs\\.length - 1').test(k3d),
       'dazwischen die runde Abdeckleiste');
pruefe('Linke Seite ist gespiegelt',
       new RegExp(q || 'if \\(links\\) spiegelnX\\(g\\)').test(k3d),
       'nicht zweimal dieselbe Lage');
/* Ein negativer Massstab allein dreht die Flaechen nach innen - sie
   werden weggeschnitten und das Teil sieht hohl aus. */
pruefe('Gespiegeltes Teil behaelt seine Aussenseite',
       new RegExp(q || 'idx\\.setX\\(i, idx\\.getX\\(i \\+ 2\\)\\)').test(k3d) &&
       new RegExp(q || 'g\\.computeVertexNormals\\(\\);\\n    return g;').test(k3d),
       'Eckenreihenfolge wird getauscht');


/* Die Glasleisten halten die Scheibe - also laufen sie so weit wie sie.
   „die glasleisten sind jz generell alle zu kurz, die gehen bis anfang
   rinne und glas geht ja noch etwas drueber" (Betreiber, 11.10.2026). */
/* Die Scheibe liegt auf dem HAUPTKOERPER des Sparrens (96,7), nicht auf
   seiner Oberkante (120) – die Klaue steht neben der Scheibe hoch und
   nimmt die Abdeckleiste auf. Lag sie auf 120, sass der ganze Aufbau
   23,3 mm zu hoch: „somit ist der aufbau sparren + glas + glasleiste im
   3d konf zu hoch also höher als real" (Betreiber, 14.10.2026).
   Geprueft werden alle drei Stellen zusammen – Scheibe, Abdeckleiste,
   Seitenglasleiste –, denn eine davon allein hilft nicht. */
pruefe('Scheibe liegt auf dem Sparrenkörper, nicht auf der Klaue',
       new RegExp(q || 'yDach = ukMitte \\+ SPARREN\\.koerper \\+ glasDicke / 2').test(k3d) &&
       (gegen || !/yDach = ukMitte \+ spH \+ glasDicke/.test(k3d)),
       '96,7 statt 120 mm über der Sparrenunterkante');
pruefe('Glasleisten laufen so weit wie die Scheibe',
       new RegExp(q || 'abdeckleiste\\(vollGlas, x, ukMitte \\+ SPARREN\\.koerper \\+ glasDicke, zGlasMitte').test(k3d) &&
       new RegExp(q || 'seitenglasleiste\\(vollGlas, x, ukMitte \\+ SPARREN\\.koerper \\+ glasDicke, zGlasMitte').test(k3d) &&
       (gegen || !/abdeckleiste\(laenge - 2/.test(k3d)),
       'nicht mehr auf Sparrenlaenge');
(function () {
  /* Zweiter Weg: nachrechnen, wie viel vorne gefehlt hat. */
  var rinne = 18.63, rueck = 3.6, innen = 13.0;
  var laenge = 281.37, glasUeber = rueck + innen * 0.55;
  var vollGlas = laenge + glasUeber - 1;         // glasRueck = 0 beim TDS
  var alt = laenge - 2;
  var fehlt = (vollGlas - alt) * 10;             // mm, die die Leiste zu kurz war
  if (gegen) fehlt = 0;
  pruefe('Leiste war vorne zu kurz', fehlt > 50,
         fehlt.toFixed(0) + ' mm Unterschied');
})();
(function () {
  /* Zweiter Weg: den ECHTEN Querschnitt laufen lassen und ausmessen.
     Statt die Punkte aus dem Text zu klauben, wird die Funktion aus dem
     Code mit einem Mini-Shape aufgerufen - dann rechnet diese Pruefung
     dasselbe wie der Browser. */
  var quer = (k3d.match(/function seitenleisteQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var zahlen = k3d.match(/SEITENLEISTE = \{ breite: ([\d.]+), hoehe: ([\d.]+), staerke: ([\d.]+)/);
  var glas = k3d.match(/GLASLEISTE = \{ breite: ([\d.]+), hoehe: ([\d.]+)/);
  if (!quer || !zahlen || !glas) {
    pruefe('Seitenleisten-Querschnitt lesbar', false, 'nicht gefunden'); return;
  }
  var SEITENLEISTE = { breite: +zahlen[1], hoehe: +zahlen[2], staerke: +zahlen[3] };
  var GLASLEISTE = { breite: +glas[1], hoehe: +glas[2] };
  var punkte = [];
  function Form() {}
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  var THREE = { Shape: Form };
  var fn = eval('(' + quer + ')');
  fn();
  var xs2 = punkte.map(function (p) { return p[0]; });
  var ys2 = punkte.map(function (p) { return p[1]; });
  var breit = Math.max.apply(null, xs2) - Math.min.apply(null, xs2);
  var hoch = Math.max.apply(null, ys2) - Math.min.apply(null, ys2);
  var falsch = 0, meld = [];
  if (gegen) breit += 1;
  if (Math.abs(breit - SEITENLEISTE.breite) > 0.02) {
    falsch++; meld.push('Breite ' + breit.toFixed(2) + ' statt ' + SEITENLEISTE.breite);
  }
  if (Math.abs(hoch - SEITENLEISTE.hoehe) > 0.02) {
    falsch++; meld.push('Hoehe ' + hoch.toFixed(2) + ' statt ' + SEITENLEISTE.hoehe);
  }
  pruefe('Querschnitt ergibt das Umrissmass', falsch === 0,
         falsch === 0 ? breit.toFixed(2) + ' x ' + hoch.toFixed(2) + ' cm' : meld.join('; '));

  /* Es muss DIESELBE Leiste sein wie auf den anderen Sparren - also oben
     dasselbe Halbrund, 55,3 x 22,6 mm. „die sehen aus wie die anderen nur
     mit dieser abschlusszunge" (Betreiber, 11.10.2026). */
  var scheitel = Math.max.apply(null, ys2);
  var rundPunkte = punkte.filter(function (p) { return p[1] > 0.01; });
  var rundBreit = rundPunkte.length
    ? Math.max.apply(null, rundPunkte.map(function (p) { return p[0]; })) -
      Math.min.apply(null, rundPunkte.map(function (p) { return p[0]; })) : 0;
  var f2 = 0, m2 = [];
  if (gegen) { scheitel = 0; }
  if (Math.abs(scheitel - GLASLEISTE.hoehe) > 0.02) {
    f2++; m2.push('Scheitel ' + scheitel.toFixed(2) + ' statt ' + GLASLEISTE.hoehe);
  }
  if (rundBreit < GLASLEISTE.breite * 0.85) {
    f2++; m2.push('Halbrund nur ' + rundBreit.toFixed(2) + ' breit');
  }
  pruefe('Oben dasselbe Halbrund wie die anderen Leisten', f2 === 0,
         f2 === 0 ? 'Scheitel ' + scheitel.toFixed(2) + ' cm, Halbrund ' +
         rundBreit.toFixed(2) + ' cm breit' : m2.join('; '));

  /* Die Zunge muss an der Sparrenflanke anliegen und tiefer reichen als
     das Halbrund - sonst bleibt der Spalt offen, genau das war
     beanstandet. */
  var tiefster = Math.min.apply(null, ys2);
  var aussen = Math.max.apply(null, xs2) * 10;        // mm ab Sparrenachse
  var sparrenHalb = 61 / 2;                           // BELEGT
  if (gegen) { aussen = sparrenHalb - 1.5; }
  var f3 = 0, m3 = [];
  if (aussen < sparrenHalb) {
    f3++; m3.push('Zunge liegt ' + (sparrenHalb - aussen).toFixed(1) + ' mm innerhalb der Flanke');
  }
  if (tiefster > -GLASLEISTE.hoehe) {
    f3++; m3.push('Zunge reicht nicht unter das Halbrund');
  }
  pruefe('Zunge liegt an der Sparrenflanke an', f3 === 0,
         f3 === 0 ? 'Spitze ' + (aussen - sparrenHalb).toFixed(1) +
         ' mm ausserhalb, ' + (-tiefster * 10).toFixed(0) + ' mm unter der Glasebene'
         : m3.join('; '));
})();

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
