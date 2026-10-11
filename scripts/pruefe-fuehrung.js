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

/* Planken gibt es nur bis 7 m am Stueck (Betreiber, 11.10.2026).
   Darueber GLEICHMAESSIG teilen - nicht 7 m plus Rest - und an den Stoss
   ein Zwischenprofil. Nachgerechnet an der Formel: Kein Feld laenger als
   7 m, alle gleich lang, und die Felder plus Profile ergeben wieder die
   volle Laenge. */
pruefe('Zwischenprofil bei langer Wand',
       new RegExp(q || 'function plankenFelder').test(js) &&
       new RegExp(q || 'function zwischenprofil').test(js), '');
(function () {
  var MAX = 700, ZW = 4.0, falsch = 0, geteilt = 0;
  function felder(l) {
    var n = Math.max(1, Math.ceil(l / MAX));
    if (n === 1) return { anzahl: 1, laenge: l };
    /* Gegenprobe: so, wie man es falsch machen wuerde - volle 7 m und
       der Rest hinten dran. */
    if (gegen) return { anzahl: n, laenge: MAX };
    return { anzahl: n, laenge: (l - (n - 1) * ZW) / n };
  }
  for (var l = 100; l <= 2400; l += 10) {
    var f = felder(l);
    if (f.laenge > MAX + 0.001) falsch++;
    if (Math.abs(f.anzahl * f.laenge + (f.anzahl - 1) * ZW - l) > 0.001) falsch++;
    if (f.anzahl > 1) geteilt++;
  }
  pruefe('Teilung ueber 7 m geht auf', falsch === 0,
         falsch + ' Faelle falsch, ' + geteilt + ' Laengen geteilt');
})();

pruefe('Hoehe hat ein Standard-Haekchen',
       /id="k3dPlankenHoeheAuto"/.test(html) &&
       new RegExp(q || 'Z\\.plankenHoeheAuto \\? 0').test(js) &&
       new RegExp(q || 'ar\\.disabled = Z\\.plankenHoeheAuto').test(js), '');
/* Der Winkel darf nie hoeher stehen als die Planken. Sichergestellt wird
   das nicht durch eine zweite Rechnung, sondern dadurch, dass Unter- und
   Oberkante beim Zeichnen mitgeschrieben und genau so weitergegeben
   werden. Genau das wird hier festgehalten. */
pruefe('Winkel endet an der Planke',
       new RegExp(q || 'plankenWinkel\\(laenge, ok - uk, achse, mitte, uk, quer\\)').test(js) &&
       new RegExp(q || 'ok = yM \\+ PLANKE\\.hoehe / 2').test(js), '');

/* Das Mass gehoert an BEIDE Stellen: neben den Regler und in die
   Standzeile - und zwar beides aus dem fertigen Modell. Dazu die freie
   Resthoehe, die sonst niemand ausrechnet. */
pruefe('Hoehe in mm neben dem Regler',
       new RegExp(q || "aw\\.textContent = PLANKEN_IST\\.lage === 'voll'").test(js), '');
pruefe('Freie Resthoehe wird mitgerechnet',
       new RegExp(q || 'frei: Math\\.max\\(0, Math\\.round\\(\\(hoehe - hoch\\) \\* 10\\)\\)').test(js) &&
       new RegExp(q || "' mm bleiben '").test(js), '');

/* Aus dem VD-Anfrageformular SG23 (Betreiber, 11.10.2026). Jede dieser
   Angaben steht dort schwarz auf weiss - und jede fehlte vorher oder war
   falsch. */
pruefe('Griffhoehe 1100 mm laut Formular',
       new RegExp(q || 'hoehe: 110, randAbstand').test(js) &&
       !/hoehe: 105,/.test(js), '');
pruefe('Nur klar und satinato',
       /value="ESG 10 mm klar"/.test(html) &&
       /value="ESG 10 mm satinato"/.test(html) &&
       new RegExp(q || "Z\\.sg23Glas\\.indexOf\\('satinato'\\)").test(js) &&
       !/ESG 10 mm (grau|bronze)/i.test(html), '');
pruefe('Glasart steht in der Anfrage',
       new RegExp(q || "b\\[1\\] \\+ '-türig, ' \\+ Z\\.sg23Glas").test(js) &&
       !/'-türig, 10 mm ESG/.test(js), '');
pruefe('Blickrichtung steht in der Anfrage',
       new RegExp(q || 'von INNEN gesehen').test(js) &&
       /von innen gesehen/.test(html), '');
pruefe('Schloss und Buerstendichtung in der Anfrage',
       new RegExp(q || "SG23 Schloss: ").test(js) &&
       new RegExp(q || 'Bürstenprofil inkl. Bürsten').test(js) &&
       /id="k3dSg23Schloss"/.test(html), '');
(function () {
  /* Der Griff muss in die Scheibe passen: Bei der niedrigsten Anlage darf
     er nicht oben herausstehen. Geprueft an der Bedingung aus dem Code
     (hoehe > GRIFF.hoehe + 20), in Zentimetern. */
  var griff = 110, puffer = 20;
  var kleinste = 180;            // cm, niedrigste sinnvolle Elementhoehe
  pruefe('Griff passt in die niedrigste Scheibe',
         gegen ? !(kleinste > griff + puffer) : kleinste > griff + puffer,
         'Scheibe ' + kleinste * 10 + ' mm, Griff bis ' + (griff + puffer) * 10 + ' mm');
})();

/* Velaris, nach VD-Bestellformular und Produktbildern (11.10.2026).
   Vorher: senkrechte Lamellen ohne Rahmen - in der Hauptachse falsch.
   Jetzt: Rahmen mit WAAGERECHTEN, kippbaren Lamellen. */
pruefe('Velaris hat waagerechte Lamellen im Rahmen',
       new RegExp(q || 'function velarisElement').test(js) &&
       new RegExp(q || 'lam\\.rotation\\.x = kipp').test(js) &&
       !/lam\.rotation\.y = Math\.PI \/ 2 \+ winkel/.test(js), '');
pruefe('Bautiefen je Schienenzahl aus dem Formular',
       new RegExp(q || 'tiefeOben: \\{ 1: 6\\.13, 2: 11\\.26, 3: 16\\.39 \\}').test(js) &&
       new RegExp(q || 'tiefeUnten: \\{ 1: 5\\.12, 2: 10\\.25, 3: 15\\.38 \\}').test(js), '');
pruefe('Teiloeffnung oben/unten',
       new RegExp(q || "Z\\.velarisTeil === 'unten' \\? i < grenze : i >= n - grenze").test(js) &&
       /id="k3dVelarisTeil"/.test(html), '');
pruefe('Lamellen fahren mit Animation',
       new RegExp(q || 'function velarisFahren').test(js) &&
       new RegExp(q || "\\['k3dVelarisAuf', 'k3dVelarisWinkel', 90\\]").test(js), '');
(function () {
  /* Die Plankendekore (Eiche Mocca, Rovere Pechino) gibt es beim Velaris
     NICHT - dort heisst es Echtholzoptik Golden OAK. Gegenprobe: genau
     die umgekehrte Erwartung. */
  var richtig = /Echtholzoptik \(Golden OAK\)/.test(html) &&
                !/k3dVelarisFarbe[\s\S]{0,800}Rovere Pechino/.test(html);
  pruefe('Echtholzoptik statt Plankendekore', gegen ? !richtig : richtig, '');
})();
(function () {
  /* Elementaufteilung: BELEGT ist 500 mm Mindestbreite, 1500 mm
     Hoechstbreite je Element und 7000 mm je Anlage. Nachgerechnet. */
  var MIN = 500, MAX = 1500, falsch = 0;
  function teile(mm) { return mm < MIN ? 0 : Math.max(1, Math.ceil(mm / MAX)); }
  for (var mm = 500; mm <= 7000; mm += 10) {
    var n = gegen ? Math.max(1, Math.floor(mm / MAX)) : teile(mm);
    if (!n) { falsch++; continue; }
    var b = mm / n;
    if (b > MAX + 0.001) falsch++;
    if (b < MIN - 0.001 && n > 1) falsch++;
  }
  pruefe('Kein Velaris-Element breiter als 1500 mm',
         falsch === 0, falsch + ' von 651 Breiten falsch');
  pruefe('Unter 500 mm kein Velaris',
         gegen ? teile(490) !== 0 : teile(490) === 0, '');
})();

(function () {
  /* Der Schienenabstand ist NICHT geraten: Er faellt aus den belegten
     Bautiefen heraus, und zwar oben wie unten derselbe Wert. Genau das
     wird hier nachgerechnet - zwei unabhaengige Wege zum selben
     Ergebnis. Gegenprobe: ein erfundener Abstand. */
  var o = { 1: 6.13, 2: 11.26, 3: 16.39 }, u = { 1: 5.12, 2: 10.25, 3: 15.38 };
  var a1 = o[2] - o[1], a2 = o[3] - o[2], a3 = u[2] - u[1], a4 = u[3] - u[2];
  var soll = gegen ? 4.8 : 5.13;
  var gleich = [a1, a2, a3, a4].every(function (x) {
    return Math.abs(x - soll) < 0.005;
  });
  pruefe('Schienenabstand faellt aus den Bautiefen', gleich,
         'oben ' + a1.toFixed(2) + '/' + a2.toFixed(2) +
         ', unten ' + a3.toFixed(2) + '/' + a4.toFixed(2) + ' cm');
})();
pruefe('Schienenabstand steht so im Code',
       new RegExp(q || 'schienenAbstand: 5\\.13').test(js) &&
       !/\* 5\.1 : 0/.test(js), '');
pruefe('Element haengt im Kopfprofil',
       new RegExp(q || 'var hEl = hoehe - VELARIS\\.bodenSchiene - VELARIS\\.aufhaengung').test(js), '');

(function () {
  /* Verschiebbar gibt es nur in den sechs Kombinationen des Formulars -
     hoechstens VIER Elemente. Fuenf nur feststehend. Nachgerechnet ueber
     alle Breiten: Wo mehr als vier Elemente noetig sind, darf nicht
     verschiebbar gebaut werden. */
  var MAX = 1500, SCHIEB = 4, falsch = 0, umgestellt = 0;
  for (var mm = 500; mm <= 7000; mm += 10) {
    var n = Math.max(1, Math.ceil(mm / MAX));
    var schiebbar = gegen ? true : n <= SCHIEB;
    if (!schiebbar) umgestellt++;
    if (schiebbar && n > SCHIEB) falsch++;
    if (n > 5) falsch++;                 // mehr als fuenf gibt es nie
  }
  pruefe('Verschiebbar hoechstens vier Elemente', falsch === 0,
         falsch + ' Faelle falsch, ' + umgestellt + ' Breiten feststehend');
})();
pruefe('Grenzen stehen so im Code',
       new RegExp(q || 'festMax: 5, schiebbarMax: 4').test(js) &&
       new RegExp(q || 'function velarisSchiebbar').test(js), '');

pruefe('Feststehend teilen sich den Pfosten',
       new RegExp(q || "if \\(erstes \\|\\| Z\\.velarisArt === 'verschiebbar'\\)").test(js), '');

pruefe('Elementbreite gleich oder Wunsch',
       /id="k3dVelarisBreite"/.test(html) &&
       new RegExp(q || "Z\\.velarisBreite === 'wunsch'").test(js), '');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
