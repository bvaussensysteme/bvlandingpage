#!/usr/bin/env node
/* Prüft die geführte Reihenfolge im 3D-Konfigurator.

   Der wunde Punkt: Jede Bedieneinheit muss genau einem Schritt zugeordnet
   sein. Fehlt die Zuordnung, ist die Einstellung im geführten Modus
   UNSICHTBAR – und niemand merkt es, weil im Modus „Alles auf einen
   Blick" alles da ist.

   Aufruf:  node scripts/pruefe-fuehrung.js [--gegenprobe]
*/
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;
var html = fs.readFileSync('konfigurator.html', 'utf8');
var js = fs.readFileSync('js/konfigurator-3d.js', 'utf8');

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

var gruppen = html.match(/<div class="k3d-gruppe"[^>]*>/g) || [];
var ohne = gruppen.filter(function (g) { return !/data-k3d-schritt=/.test(g); });
if (gegen) ohne = ['künstlich'];
pruefe('Jede Bedieneinheit gehört zu einem Schritt', ohne.length === 0,
       gruppen.length + ' Gruppen, ' + ohne.length + ' ohne Zuordnung');

/* Schrittliste aus dem Code gegen die im HTML benutzten Namen */
var imCode = (js.match(/\{ id: '([a-z]+)'/g) || [])
  .map(function (x) { return x.replace(/.*'([a-z]+)'.*/, '$1'); });
var imHtml = {};
(html.match(/data-k3d-schritt="([a-z]+)"/g) || []).forEach(function (x) {
  imHtml[x.replace(/.*"([a-z]+)".*/, '$1')] = true;
});
var verwaist = Object.keys(imHtml).filter(function (k) { return imCode.indexOf(k) < 0; });
if (gegen) verwaist = ['künstlich'];
pruefe('Kein Schrittname im HTML ohne Eintrag in SCHRITTE', verwaist.length === 0,
       verwaist.length ? verwaist.join(', ') : imCode.length + ' Schritte');

var leer = imCode.filter(function (k) { return k !== 'fertig' && !imHtml[k]; });
if (gegen) leer = ['künstlich'];
pruefe('Kein Schritt ohne Bedieneinheiten', leer.length === 0,
       leer.length ? leer.join(', ') : 'alle belegt');

pruefe('Leere Schritte werden übersprungen',
       new RegExp(q || 'schrittHatInhalt').test(js), 'schrittSuchen()');
pruefe('Fortschritt zählt nur gültige Schritte',
       new RegExp(q || "'Schritt ' \\+ pos \\+ ' von ' \\+ gueltig\\.length").test(js), '');
pruefe('Umschalten auf „Alles auf einen Blick" vorhanden',
       new RegExp(q || 'k3dModus').test(js) && /id="k3dModus"/.test(html), '');
pruefe('Selten Gebrauchtes liegt hinter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr').test(js) &&
       (html.match(/data-k3d-mehr/g) || []).length >= 6,
       (html.match(/data-k3d-mehr/g) || []).length + ' Gruppen');

/* Die Anfrage muss ALLE drei Seiten nennen, auch die offenen – sonst
   steht in der Mail nicht, dass eine Seite offen bleiben SOLL. */
/* ---------- Höhe an der Wand ----------
   Zweiter Weg: Die Zahlen stehen hier noch einmal aus der
   Montageanleitung (Skizze S. 9 und Rechenbeispiel) und werden mit der
   Tabelle im Code nachgerechnet. Weicht eine ab, schlägt es an. */
var tabelle = {};
var mTab = js.match(/var NEIGUNG_PROZENT = \{([\s\S]*?)\}/);
if (mTab) mTab[1].split(',').forEach(function (teil) {
  var kv = teil.split(':');
  if (kv.length === 2) tabelle[parseInt(kv[0], 10)] = parseFloat(kv[1]);
});
/* Skizze der Anleitung: 8° ergibt 14 cm je Meter, also 140/280/420/560 mm */
[[1000, 140], [2000, 280], [3000, 420], [4000, 560]].forEach(function (f) {
  var ist = Math.round(f[0] * (tabelle[8] || 0) / 100) + (gegen ? 5 : 0);
  pruefe('Anstieg bei ' + (f[0] / 1000) + ' m und 8°', ist === f[1],
         ist + ' mm (Anleitung ' + f[1] + ')');
});
/* Rechenbeispiel der Anleitung: 200 cm innen, 3 m Ausfall -> 242 cm */
var beispiel = 2000 + Math.round(3000 * (tabelle[8] || 0) / 100) + (gegen ? 5 : 0);
pruefe('Rechenbeispiel der Anleitung', beispiel === 2420,
       beispiel + ' mm (Anleitung 2420)');
pruefe('Höhe an der Wand steht im Bedienfeld',
       /id="k3dWandHoehe"/.test(html) && new RegExp(q || 'k3dWandHoehe').test(js), '');
pruefe('Grad links, Prozent rechts in zwei Feldern',
       new RegExp(q || 'id="k3dNeigungZahl"').test(html) &&
       new RegExp(q || 'id="k3dNeigungProzent"').test(html) &&
       /class="k3d-felder"/.test(html), '');
pruefe('Gradfeld ist an den Regler gekoppelt',
       new RegExp(q || "\\['k3dNeigung', 'k3dNeigungZahl'\\]").test(js), '');
pruefe('Höhe an der Wand steht in der Anfrage',
       new RegExp(q || 'UK Wandprofil').test(js), 'textAktualisieren()');
pruefe('Neigung steht direkt unter der Durchgangshöhe',
       new RegExp(q || 'data-k3d-schritt="masse" data-k3d-fuer="neigung"').test(html), '');

/* ---------- Hinweis auf den Testbetrieb ---------- */
pruefe('Testhinweis ist vorhanden',
       /id="k3dTestHinweis"/.test(html) && new RegExp(q || 'k3dTestHinweis').test(js), '');
pruefe('Testhinweis startet verborgen',
       !gegen && /<div class="k3d-hinw" id="k3dTestHinweis" hidden>/.test(html),
       'ohne JS kein Dialog vor dem Inhalt');
pruefe('Testhinweis kommt einmal je Sitzung',
       new RegExp(q || 'sessionStorage').test(js) &&
       !new RegExp('localStorage.*bvTestHinweis').test(js), 'sessionStorage');
pruefe('Testhinweis wartet auf den Cookie-Hinweis',
       new RegExp(q || "cb-visible").test(js), 'keine zwei Dialoge');
pruefe('Testhinweis ist mit Tastatur bedienbar',
       new RegExp(q || "'Escape'").test(js) && /role="dialog"/.test(html), '');

/* ---------- Jeder Regler muss seine Anzeige nachfuehren ----------
   Der Dachvorsprung-Regler stand in keiner der beiden Listen: die
   Anzeige blieb auf „0 mm", waehrend sich im Modell sehr wohl etwas
   bewegte. Das faellt nicht auf, weil nichts kaputtgeht - es stimmt nur
   nicht. Deshalb wird es hier fuer ALLE Regler geprueft, nicht nur fuer
   den einen. */
var regler = (html.match(/id="(k3d[A-Za-z]+)" class="k3d-range"/g) || [])
  .map(function (x) { return x.match(/id="(k3d[A-Za-z]+)"/)[1]; });
var ohneAnzeige = [], ohneZahl = [];
regler.forEach(function (r) {
  if (html.indexOf('id="' + r + 'Wert"') > -1 && !new RegExp(r + 'Wert').test(js) &&
      !new RegExp("\\['" + r + "', '").test(js)) ohneAnzeige.push(r);
  if (html.indexOf('id="' + r + 'Zahl"') > -1 &&
      !new RegExp("\\['" + r + "', '" + r + "Zahl'\\]").test(js)) ohneZahl.push(r);
});
if (gegen) { ohneAnzeige = ['kuenstlich']; ohneZahl = ['kuenstlich']; }
pruefe('Jeder Regler führt seine Anzeige nach', ohneAnzeige.length === 0,
       ohneAnzeige.length ? ohneAnzeige.join(', ') : regler.length + ' Regler geprüft');
pruefe('Jedes Zahlenfeld ist an seinen Regler gekoppelt', ohneZahl.length === 0,
       ohneZahl.length ? ohneZahl.join(', ') : 'alle gekoppelt');

/* Feste Panelbreite liess lange Knopftexte mitten im Wort abbrechen. */
pruefe('Bedienfeld waechst mit der Bildschirmbreite',
       new RegExp(q || '--k3d-sl-breite: clamp\\(').test(html) &&
       !/width: 352px/.test(html), 'clamp statt feste 352px');
pruefe('Anfrage nennt auch die offenen Seiten',
       new RegExp(q || "'offen'\\)\\);").test(js) &&
       new RegExp(q || "'Seitenelemente – '").test(js), 'textAktualisieren()');
pruefe('Bedienfeld sagt im Klartext, welche Seite offen bleibt',
       new RegExp(q || 'seitenStandZeigen').test(js) &&
       /id="k3dSeitenStand"/.test(html), '');

/* ---------- Ansicht „Darunter" ----------
   „die ansicht darunter sollte eher aussehen wie hier auf dem bild also
   quasi als ob man im terrassendach etc drinsteht" (Betreiber,
   11.10.2026). Vorher stand die Kamera AUSSEN und schaute hinein. */
pruefe('Innenansicht als eigene Rechnung',
       gegen ? !/function ansichtInnen\(\)/.test(js) : /function ansichtInnen\(\)/.test(js), '');
pruefe('Blick geht nach vorne hinaus',
       gegen ? !/kam\.theta = Math\.PI;/.test(js) : /kam\.theta = Math\.PI;/.test(js), '');
pruefe('Winkelgrenze nur fuer diese Ansicht angehoben',
       /kam\.phiMax \|\| \(Math\.PI \/ 2 - 0\.04\)/.test(js) && !gegen ||
       gegen && /Math\.min\(Math\.max\(kam\.phi, 0\.18\), Math\.PI \/ 2 - 0\.04\)/.test(js),
       'sonst stuende das Bild auf dem Kopf');
pruefe('Ansicht ueberlebt die Massaenderung',
       gegen ? !/if \(kam\.ansicht === 'Darunter'\)/.test(js)
             : /if \(kam\.ansicht === 'Darunter'\)/.test(js), '');
pruefe('Eigenes Drehen verlaesst die Ansicht',
       gegen ? !/kam\.ansicht = '';/.test(js) : /kam\.ansicht = '';/.test(js), '');
/* Zweiter Weg: die Kameralage wirklich ausrechnen. */
(function () {
  var m = js.match(/var phi = Math\.PI \/ 2 \+ ([\d.]+);/);
  var ma = js.match(/var AUGENHOEHE = (\d+);/);
  if (!m || !ma) { pruefe('Kameralage rechenbar', false, 'Zeilen nicht gefunden'); return; }
  var phi = Math.PI / 2 + parseFloat(m[1]), auge = parseInt(ma[1], 10);
  var T = 300, zielZ = T + 150, kameraZ = T * 0.25;
  var r = (zielZ - kameraZ) / Math.sin(phi);
  var zielY = auge - r * Math.cos(phi);
  var camY = zielY + r * Math.cos(phi) + (gegen ? 120 : 0);
  var camZ = zielZ - r * Math.sin(phi);
  pruefe('Kamera steht auf Augenhoehe', Math.abs(camY - auge) < 1, camY.toFixed(0) + ' cm');
  /* Der Versatz muss die Kamera NACH DRAUSSEN schieben, damit die
     Pruefung in der Gegenprobe anschlaegt - ein Versatz an der Grenze
     macht sie nur noch leichter wahr. */
  var camZp = camZ + (gegen ? 500 : 0);
  pruefe('Kamera steht INNEN', camZp > 0 && camZp < T,
         camZp.toFixed(0) + ' cm von der Wand, Tiefe ' + T);
  pruefe('Blick geht nach oben', zielY > camY + (gegen ? 500 : 0),
         'Ziel ' + zielY.toFixed(0) + ' cm gegen Kamera ' + camY.toFixed(0) + ' cm');
})();

/* ---------- Fluessigkeit ----------
   „prüfe was man machen kann das die bewegungen smooother ohne laggs
   werden, aber ohne was am konfigurator kaputt zu machen" (Betreiber,
   11.10.2026). Drei Stellschrauben, alle ohne sichtbare Folge. */
pruefe('Gezeichnet wird nur bei Bedarf',
       gegen ? !/if \(frisch > 0 \|\| autoDreht \|\| zieht\)/.test(js)
             : /if \(frisch > 0 \|\| autoDreht \|\| zieht\)/.test(js),
       'nicht mehr 60-mal je Sekunde fuer ein stehendes Bild');
pruefe('Zaehler statt Schalter',
       gegen ? !/if \(!\(frisch > 4\)\) frisch = 4;/.test(js)
             : /if \(!\(frisch > 4\)\) frisch = 4;/.test(js),
       'verzoegerte Texturen kommen mit');
pruefe('Schattenkarte nicht mehr jedes Bild',
       gegen ? !/renderer\.shadowMap\.autoUpdate = false;/.test(js)
             : /renderer\.shadowMap\.autoUpdate = false;/.test(js), '');
pruefe('Schattenkarte wird nach jedem Bauen erneuert',
       gegen ? !/renderer\.shadowMap\.needsUpdate = true;\s*\n\s*neuZeichnen\(\);/.test(js)
             : /renderer\.shadowMap\.needsUpdate = true;\s*\n\s*neuZeichnen\(\);/.test(js),
       'sonst bliebe der alte Schatten stehen');
pruefe('Regler baut hoechstens einmal je Bild',
       gegen ? !/addEventListener\('input', aendernGebremst\)/.test(js)
             : /addEventListener\('input', aendernGebremst\)/.test(js), '');
pruefe('Loslassen bleibt ungebremst',
       gegen ? !/addEventListener\('change', aendern\)/.test(js)
             : /addEventListener\('change', aendern\)/.test(js), '');
/* Die Flagge MUSS an jeder Stelle gesetzt werden, die die Szene
   aendert - sonst bliebe das Bild stehen. Hier die vier Pflichtstellen. */
[['Kamerabewegung', 'kamera3\\.lookAt\\(kam\\.ziel\\);\\s*\\n\\s*neuZeichnen\\(\\)'],
 ['Groessenaenderung', 'kamera3\\.updateProjectionMatrix\\(\\);\\s*\\n\\s*neuZeichnen\\(\\)'],
 ['Nachgeladene Textur', 'texLader\\.load\\(pfad, function \\(t\\) \\{\\s*\\n\\s*neuZeichnen\\(\\)'],
 ['Stofftextur', "texLader\\.load\\('images/stoffe/tex/[^']*' \\+ wert \\+ '\\.webp', function \\(t\\) \\{\\s*\\n\\s*neuZeichnen\\(\\)"]
].forEach(function (f) {
  pruefe('Bild wird nachgezogen: ' + f[0],
         new RegExp(q || f[1]).test(js), '');
});

/* Ohne Herstellerzahlen bleibt der Kasten "Was daraus folgt" ganz weg
   (Betreiber, 11.10.2026: "lass das weg"). Zwei Dinge muessen dafuer
   stimmen: im Markup darf kein Ersatztext mehr stehen, und der Code
   muss den Kasten wirklich ausblenden. */
pruefe('Kein Skizzen-Hinweis mehr im Markup',
       gegen ? /keine Herstellerzahlen/.test(html)
             : !/keine Herstellerzahlen/.test(html), '');
pruefe('Kasten wird ohne Zahlen ausgeblendet',
       new RegExp(q || 'kasten\\.hidden = true').test(js) &&
       new RegExp(q || 'kasten\\.hidden = false').test(js), '');

/* Der Fehler vom 11.10.2026: Die Verkleidungs-Gruppe hatte kein eigenes
   Stichwort. Ihr Abschnitt war beim Terrassendach ausgeblendet, die
   Gruppe selbst aber nicht - und weil das Ueberspringen an der GRUPPE
   haengt, stand man vor einem leeren Schritt "Waende verkleiden?".
   Deshalb: In einem produktabhaengigen Abschnitt braucht jede Gruppe ihr
   eigenes data-k3d-fuer. */
(function () {
  var offen = [];
  (html.split('<details class="k3d-sek"').slice(1)).forEach(function (a) {
    var kopf = a.slice(0, a.indexOf('>'));
    if (kopf.indexOf('data-k3d-fuer') < 0) return;
    (a.split('</details>')[0].match(/<div class="k3d-gruppe"[^>]*>/g) || [])
      .forEach(function (g) { if (g.indexOf('data-k3d-fuer') < 0) offen.push(g); });
  });
  pruefe('Kein leerer Schritt moeglich',
         gegen ? offen.length > 0 : offen.length === 0,
         offen.length + ' Gruppe(n) ohne eigenes Stichwort');
})();
pruefe('Verkleidung steht im Schritt "seiten"',
       new RegExp(q || 'data-k3d-schritt="seiten" data-k3d-fuer="verkleidung"').test(html) &&
       !/id: 'verkleidung'/.test(js), '');

/* Plankenwand (Betreiber, 11.10.2026): Rechteckprofil 25 x 70 misst
   70,4 x 25,3 mm, der Winkel 40 x 20. Und: Die Planken fuellen das
   lichte Mass vollstaendig und gleichmaessig - oben und unten buendig,
   alle Fugen gleich. Nachgerechnet wird das hier an der Formel selbst,
   nicht an der Absicht. */
pruefe('Plankenmass aus der Zeichnung',
       new RegExp(q || 'hoehe: 7\\.04, dicke: 2\\.53').test(js), '');
pruefe('Winkel 40 x 20',
       new RegExp(q || 'lang: 4\\.0, kurz: 2\\.0').test(js), '');
(function () {
  var H = { hoehe: 7.04, fugeZiel: 1.0 };
  function teilung(h) {
    var n = Math.round((h + H.fugeZiel) / (H.hoehe + H.fugeZiel));
    n = Math.max(1, n);
    while (n > 1 && n * H.hoehe > h) n--;
    return { n: n, f: n > 1 ? (h - n * H.hoehe) / (n - 1) : 0 };
  }
  var schlecht = 0, engste = 99;
  for (var h = 60; h <= 260; h += 1) {
    var t = teilung(h);
    /* Gegenprobe: so, wie es vorher war - feste Fuge. Dann bleibt oben
       ein Rest stehen, und genau das muss auffallen. */
    var summe = gegen ? t.n * H.hoehe + (t.n - 1) * H.fugeZiel
                      : t.n * H.hoehe + (t.n - 1) * t.f;
    if (Math.abs(summe - h) > 0.001) schlecht++;
    if (t.f < engste) engste = t.f;
  }
  pruefe('Planken fuellen das lichte Mass genau',
         schlecht === 0, schlecht + ' von 201 Hoehen gehen nicht auf');
  pruefe('Fuge bleibt eine Fuge',
         gegen ? !(engste > 0.2) : engste > 0.2,
         'engste Fuge ' + Math.round(engste * 10) + ' mm');
})();
pruefe('Plankenfarbe geht in die Anfrage',
       new RegExp(q || "teile\\.push\\('Plankenwand: ").test(js) &&
       /id="k3dPlankenFarbe"/.test(html), '');

/* Die Fuge rechnet das System aus, laesst sich aber selbst einstellen -
   wie bei den Schiebeanlagen (Betreiber, 11.10.2026). Dazu gehoert, dass
   das Bedienfeld die GEBAUTE Fuge zurueckliest und nicht die Eingabe
   wiederholt: zweiter Weg zum selben Ergebnis. */
pruefe('Fuge automatisch, Umschalter vorhanden',
       new RegExp(q || "Z\\.plankenAuto \\? FUGE_AUTO").test(js) &&
       /id="k3dPlankenAuto"/.test(html), '');
pruefe('Regler gesperrt, solange automatisch',
       new RegExp(q || 'fr\\.disabled = Z\\.plankenAuto').test(js), '');
pruefe('Gebaute Fuge wird zurueckgelesen',
       new RegExp(q || 'PLANKEN_IST = \\{ anzahl: a\\.anzahl, gesamt: t\\.anzahl').test(js) &&
       new RegExp(q || 'function plankenStandZeigen').test(js), '');
(function () {
  /* Buendig ist ein eigener Fall und darf NICHT durch die Verteilung
     laufen - sonst zoege sie die Planken wieder auseinander. */
  var treffer = /if \(ziel <= 0\) \{[\s\S]{0,160}?fuge: 0/.test(js);
  pruefe('Buendig bleibt buendig', gegen ? !treffer : treffer, '');
})();

/* Teilhohe Plankenwand (Betreiber, 11.10.2026): Regler in der Mitte =
   ganz zu, nach links bleibt unten stehen, nach rechts oben. Wichtig
   dabei: Die FUGE darf sich nicht mitaendern - sonst saehe die halbe
   Wand anders aus als die ganze. */
pruefe('Teilhoehe: Regler und Zustand',
       new RegExp(q || 'function plankenAnteil').test(js) &&
       /id="k3dPlankenAnteil"/.test(html), '');
pruefe('Regler steht in der Mitte auf voll',
       new RegExp(q || 'id="k3dPlankenAnteil"[^>]*min="-90"[^>]*value="0"').test(html), '');
(function () {
  /* Gegenprobe: dieselbe Rechnung mit vertauschtem Vorzeichen - also
     genau der Fehler, der sonst niemandem auffiele, weil die Zahl der
     Planken stimmt und nur die Seite falsch ist. */
  function anteil(a, n) {
    if (!a) return { von: 0, anzahl: n, lage: 'voll' };
    var bleibt = Math.max(1, n - Math.round(Math.abs(a) / 100 * n));
    return (gegen ? a > 0 : a < 0)
      ? { von: 0, anzahl: bleibt, lage: 'unten' }
      : { von: n - bleibt, anzahl: bleibt, lage: 'oben' };
  }
  var n = 24, falsch = 0, haelfte = anteil(-50, n);
  /* Die Haelfte muss die Haelfte sein - nachgerechnet, nicht geglaubt. */
  if (haelfte.anzahl !== 12) falsch++;
  /* Links beginnt unten, rechts endet oben. Beides pruefen, sonst faellt
     ein vertauschtes Vorzeichen nicht auf. */
  if (anteil(-50, n).von !== 0) falsch++;
  if (anteil(50, n).von + anteil(50, n).anzahl !== n) falsch++;
  /* Ganz aussen bleibt mindestens eine Planke stehen. */
  if (anteil(90, n).anzahl < 1) falsch++;
  pruefe('Teilhoehe rechnet richtig', falsch === 0, falsch + ' Faelle falsch');
})();
pruefe('Teilhoehe steht in der Anfrage',
       new RegExp(q || "PLANKEN_IST\\.lage === 'voll' \\? ', volle Höhe'").test(js), '');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
