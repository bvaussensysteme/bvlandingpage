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
       new RegExp(q || 'plankenWinkel\\(laenge, ok - uk, achse, mitte, uk, quer, mPlankeWand\\)').test(js) &&
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
pruefe('Beide Haelften getrennt stellbar',
       new RegExp(q || 'i < grenze \\? gradUnten : gradOben').test(js) &&
       /id="k3dVelarisWinkelOben"/.test(html) &&
       /id="k3dVelarisWinkelUnten"/.test(html) &&
       !/id="k3dVelarisTeil"/.test(html), '');
pruefe('Jede Haelfte faehrt fuer sich',
       new RegExp(q || 'function velarisFahren\\(ziel, feld\\)').test(js) &&
       new RegExp(q || "\\['k3dVelarisObenAuf', 'oben', 90\\]").test(js) &&
       new RegExp(q || "\\['k3dVelarisUntenZu', 'unten', 0\\]").test(js), '');
(function () {
  /* Die Plankendekore (Eiche Mocca, Rovere Pechino) gibt es beim Velaris
     NICHT - dort heisst es Echtholzoptik Golden OAK. Gegenprobe: genau
     die umgekehrte Erwartung. */
  /* Lamellenfarbe: genau drei, und die RAL-Standardtoene gehoeren NICHT
     dazu - die gelten fuer den Rahmen (Auswahlseite, 11.10.2026). */
  var block = (html.split('id="k3dVelarisFarbe"')[1] || '').split('</select>')[0];
  var richtig = /Holzoptik Golden OAK/.test(block) &&
                /RAL-Sonderfarbe/.test(block) &&
                !/9006|9007|9010|Rovere Pechino|Eiche Mocca/.test(block) &&
                (block.match(/<option/g) || []).length === 3;
  pruefe('Lamellenfarbe: genau die drei aus dem Formular',
         gegen ? !richtig : richtig,
         (block.match(/<option/g) || []).length + ' Auswahlmoeglichkeiten');
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
       new RegExp(q || "var linksEigen = erstes \\|\\| Z\\.velarisArt === 'verschiebbar'").test(js), '');

pruefe('Elementbreite gleich oder Wunsch',
       /id="k3dVelarisBreite"/.test(html) &&
       new RegExp(q || "Z\\.velarisBreite === 'wunsch'").test(js), '');

(function () {
  /* Jeder Wert im Auswahlfeld muss im Code ankommen. Am 11.10.2026 hiess
     der Schluessel im Code anders als im Feld - die Holzoptik fiel still
     auf die Rahmenfarbe zurueck, und am Bild aenderte sich beim
     Umstellen nichts. Hier wird Feld gegen Code geprueft, nicht Absicht
     gegen Absicht. */
  var block = (html.split('id="k3dVelarisFarbe"')[1] || '').split('</select>')[0];
  var werte = (block.match(/value="([^"]+)"/g) || [])
    .map(function (v) { return v.slice(7, -1); });
  var offen = werte.filter(function (w) {
    if (w.indexOf('Anthrazit') > -1 || w.indexOf('Sonderfarbe') > -1) return false;
    return js.indexOf("'" + w + "': 0x") < 0;   // Dekor muss im Code stehen
  });
  if (gegen) offen = offen.length ? [] : ['erzwungen'];
  pruefe('Jede Lamellenfarbe kommt im Code an', offen.length === 0,
         werte.length + ' Werte, ohne Entsprechung: ' + (offen.join(', ') || 'keiner'));
})();

(function () {
  /* Die Luecke an der Stirnseite (Betreiber, 11.10.2026): Bei
     feststehenden Elementen laesst das zweite sein linkes Profil weg -
     dann muessen die Lamellen bis an die Kante reichen, sonst bleibt
     genau der Platz des weggelassenen Profils leer. Nachgerechnet:
     Lamellenlaenge plus die wirklich vorhandenen Profile ergibt die
     Elementbreite, und die Lamellen sitzen mittig dazwischen. */
  var R = 4.5, L = 100, falsch = 0;
  [[true, 'erstes'], [false, 'folgendes']].forEach(function (f) {
    var linksRand = f[0] ? R : 0;
    var lam = L - linksRand - R;
    /* Gegenprobe: der Fehler von vorher - Lamellen immer mittig, egal ob
       das linke Profil steht. Dann klafft die Luecke wieder. */
    var mitte = gegen ? 0 : (linksRand - R) / 2;
    var linkeKante = mitte - lam / 2, rechteKante = mitte + lam / 2;
    if (Math.abs(linkeKante - (-L / 2 + linksRand)) > 0.001) falsch++;
    if (Math.abs(rechteKante - (L / 2 - R)) > 0.001) falsch++;
  });
  pruefe('Keine Luecke, wo das Profil fehlt', falsch === 0,
         falsch + ' Kanten falsch');
})();
pruefe('Lamellen folgen der Elementkante',
       new RegExp(q || 'var linksRand = linksEigen \\? R : 0').test(js) &&
       new RegExp(q || 'var lamMitte = mitte \\+ \\(linksRand - R\\) / 2').test(js), '');
pruefe('Elementzahl automatisch oder selbst gewaehlt',
       /id="k3dVelarisAnzahl"/.test(html) &&
       new RegExp(q || 'function velarisFeldFuellen').test(js) &&
       new RegExp(q || 'function velarisMoeglich').test(js), '');
(function () {
  /* Das Auswahlfeld darf nur anbieten, was der Hersteller zulaesst.
     Nachgerechnet ueber alle Breiten: Jede angebotene Zahl ergibt
     Elemente zwischen 500 und 1500 mm, und die Automatik ist immer
     dabei. */
  var MIN = 500, MAX = 1500, FEST = 5, falsch = 0;
  for (var mm = 500; mm <= 7500; mm += 10) {
    var liste = [];
    for (var n = 1; n <= FEST; n++) {
      var b = mm / n;
      if (gegen ? b <= MAX : (b >= MIN && b <= MAX)) liste.push(n);
    }
    liste.forEach(function (n) {
      var b = mm / n;
      if (b < MIN - 0.001 || b > MAX + 0.001) falsch++;
    });
    var auto = Math.max(1, Math.ceil(mm / MAX));
    if (mm <= FEST * MAX && liste.indexOf(auto) < 0) falsch++;
  }
  pruefe('Angeboten wird nur Lieferbares', falsch === 0,
         falsch + ' Angebote ausserhalb der Grenzen');
})();

pruefe('Laufweg bremst das Element davor',
       new RegExp(q || 'nachbar = e - schienen').test(js) &&
       new RegExp(q || 'frei = Math\\.max\\(frei, lagen\\[nachbar\\] \\+ elLaenge\\)').test(js) &&
       new RegExp(q || 'nachbar = e \\+ schienen').test(js) &&
       new RegExp(q || 'frei = Math\\.min\\(frei, lagen\\[nachbar\\] - elLaenge\\)').test(js), '');
pruefe('Verschiebbare Velaris fahren wie die Glaswaende',
       new RegExp(q || 'function velarisSchiebenFahren').test(js) &&
       new RegExp(q || "\\['k3dVelarisSchiebenAuf', 'k3dVelarisOffen', 100\\]").test(js) &&
       /id="k3dVelarisOffen"/.test(html), '');
(function () {
  /* Zwei Elemente auf DEMSELBEN Laufweg koennen nicht ineinander fahren -
     sie stossen aneinander (Betreiber, 11.10.2026). An anderen Elementen
     duerfen sie vorbei. Nachgerechnet ueber alle Kombinationen des
     Formulars und ueber den ganzen Fahrweg.
     Gegenprobe: der alte Stand, in dem jedes Element um denselben Betrag
     fuhr - dann ueberlappen sich Elemente auf einem Laufweg. */
  var el = 100, stoss = 0, raus = 0, bewegt = 0;
  [[1, 1], [1, 2], [2, 2], [2, 3], [2, 4], [3, 3]].forEach(function (k) {
    var schienen = k[0], n = k[1], laenge = n * el;
    for (var p10 = 0; p10 <= 10; p10++) {
      var offen = p10 / 10, lagen = [];
      for (var e = 0; e < n; e++) {
        var f = (e + 0.5) * el - offen * e * el;
        var v = e - schienen;
        if (!gegen && v >= 0) f = Math.max(f, lagen[v] + el);
        lagen.push(f);
      }
      for (var i = 0; i < n; i++) {
        if (lagen[i] - el / 2 < -0.001) raus++;
        if (lagen[i] + el / 2 > laenge + 0.001) raus++;
        for (var j = i + 1; j < n; j++) {
          if ((j - i) % schienen !== 0) continue;        // anderer Laufweg
          if (Math.abs(lagen[j] - lagen[i]) < el - 0.001) stoss++;
        }
      }
      if (offen === 1 && schienen > 1 && Math.abs(lagen[1] - (0.5 * el)) < 0.001) bewegt++;
    }
  });
  pruefe('Elemente auf einem Laufweg fahren nicht ineinander', stoss === 0,
         stoss + ' Ueberschneidungen');
  pruefe('Kein Element faehrt aus der Anlage',
         gegen ? !(raus === 0) : raus === 0, raus + ' Lagen ausserhalb');
  pruefe('Mit mehreren Laufwegen bewegt sich auch etwas',
         gegen ? bewegt === 0 : bewegt > 0, bewegt + ' Faelle mit Bewegung');
})();

(function () {
  /* Velaris teilt sich IMMER 50/50 (Betreiber, 11.10.2026). Der Regler
     fuer den Anteil ist raus - er bot etwas an, das es am Bauteil nicht
     gibt. Geprueft wird beides: dass er weg ist UND dass die Haelfte
     wirklich die Haelfte ist, auch bei ungerader Lamellenzahl. */
  var weg = !/k3dVelarisAnteil/.test(html) && !/velarisAnteil/.test(js) &&
            !/velarisTeil/.test(js);
  pruefe('Anteil-Regler ist raus', gegen ? !weg : weg, '');
  var falsch = 0;
  for (var n = 1; n <= 60; n++) {
    var grenze = gegen ? Math.round(n * 0.55) : Math.round(n / 2);
    var unten = grenze, oben = n - (n - grenze);
    if (Math.abs(unten - n / 2) > 0.5) falsch++;
    if (Math.abs(oben - n / 2) > 0.5) falsch++;
  }
  pruefe('Haelfte ist wirklich die Haelfte', falsch === 0,
         falsch + ' von 120 Faellen daneben');
})();

pruefe('Aufhaengung laeuft durch',
       new RegExp(q || 'platte\\(rahmen, laenge, VELARIS\\.aufhaengung').test(js) &&
       !/Math\.min\(laenge \* 0\.5, 20\)/.test(js), '');
pruefe('Schiene gehoert zur Anlage, nicht zum Element',
       new RegExp(q || 'platte\\(rahmen, laenge, VELARIS\\.kopf, achse, mitte,\\s*\\n\\s*yUnten \\+ hoehe').test(js), '');

(function () {
  /* Verschiebbar darf nur angeboten werden, was sich auch WIRKLICH
     schieben laesst (Betreiber, 11.10.2026). Mit einem Laufweg stehen
     die Elemente aneinander - erst ab zwei faehrt eines vorbei, und das
     gibt es ab drei Elementen. Geprueft wird nicht die Liste, sondern
     dass jede angebotene Zahl im Fahrversuch auch Bewegung ergibt. */
  var MIN = 500, MAX = 1500, SCHIEB = 4, stumm = 0, angeboten = 0;
  function schienen(n) { return n <= 2 ? 1 : 2; }
  for (var mm = 500; mm <= 7500; mm += 10) {
    for (var n = 1; n <= 5; n++) {
      var b = mm / n;
      if (b < MIN || b > MAX) continue;
      if (!gegen && (n < 3 || n > SCHIEB)) continue;   // Gegenprobe: alles anbieten
      if (gegen && n > SCHIEB) continue;
      angeboten++;
      /* Fahrversuch bei 100 Prozent: bewegt sich ueberhaupt etwas? */
      var s = schienen(n), lagen = [], bewegt = false;
      for (var e = 0; e < n; e++) {
        var zu = (e + 0.5) * b;
        var f = zu - 1 * e * b;
        var v = e - s;
        if (v >= 0) f = Math.max(f, lagen[v] + b);
        lagen.push(f);
        if (Math.abs(f - zu) > 0.001) bewegt = true;
      }
      if (!bewegt) stumm++;
    }
  }
  pruefe('Verschiebbar: nur Aufteilungen, die sich bewegen', stumm === 0,
         stumm + ' von ' + angeboten + ' Angeboten ohne Bewegung');
})();
pruefe('Die Art steckt in der Aufteilung',
       new RegExp(q || 'function velarisMoeglich\\(mm, art\\)').test(js) &&
       new RegExp(q || "art === 'verschiebbar' && \\(n < 3").test(js), '');

(function () {
  /* Holzmaserung fuer die Dekore (ambientCG Wood049, CC0). Geprueft
     wird, dass die Bilder DA sind, dass sie eingebunden werden und dass
     jedes Bauteil seine eigene Kopie der Textur bekommt - sonst teilten
     sich Planke und Lamelle eine Wiederholung und eine von beiden saehe
     gestaucht aus. */
  var fs2 = require('fs');
  var da = fs2.existsSync('images/textur/holzmaserung.webp') &&
           fs2.existsSync('images/textur/holzmaserung-normal.webp');
  pruefe('Maserungsbilder liegen im Projekt', gegen ? !da : da, '');
  pruefe('Maserung nur auf den Dekoren',
         new RegExp(q || 'if \\(dekor !== undefined\\) maserungAuftragen').test(js) &&
         (js.match(/if \(dekor !== undefined\) maserungAuftragen/g) || []).length === 2, '');
  pruefe('Jedes Bauteil bekommt seine eigene Kopie',
         new RegExp(q || 'var t = f\\.map\\.clone\\(\\)').test(js) &&
         new RegExp(q || 'var n = f\\.normal\\.clone\\(\\)').test(js), '');
  pruefe('Verspaetete Textur wird nachgetragen',
         new RegExp(q || 'function maserungNachtragen').test(js) &&
         new RegExp(q || "name === 'holzmaserung'").test(js), '');
})();
(function () {
  /* Die Maserung darf nicht mitwachsen: Auf einer langen Planke muesste
     sie sonst zu Streifen gezogen werden. Geprueft am Seitenverhaeltnis
     der Wiederholung - es muss dem des Bauteils entsprechen. */
  var k = 120, falsch = 0;
  [[300, 7.04], [700, 7.04], [100, 7.0], [45, 7.0]].forEach(function (b) {
    var rx = Math.max(0.05, b[0] / k), ry = Math.max(0.02, b[1] / (gegen ? k * 2 : k));
    var verhaeltnisBauteil = b[0] / b[1], verhaeltnisTextur = rx / ry;
    if (Math.abs(verhaeltnisBauteil - verhaeltnisTextur) > 0.001) falsch++;
  });
  pruefe('Maserung wird nicht gestaucht', falsch === 0, falsch + ' von 4 verzerrt');
})();

(function () {
  /* Schienenlage am Pfosten (Betreiber, 11.10.2026): schmaler als der
     Pfosten -> mittig auf ihm; breiter -> aussen buendig, der Ueberstand
     geht nach innen. Nachgerechnet an den drei belegten Bautiefen gegen
     den 110-mm-Pfosten: Keine Schiene darf nach AUSSEN ueber den Pfosten
     hinausstehen. Gegenprobe: die alte Lage ohne Versatz. */
  var PROFIL = 11.0;      // cm, Pfosten
  var tiefen = [6.13, 11.26, 16.39, 5.12, 10.25, 15.38];
  var raus = 0, mittig = 0;
  tiefen.forEach(function (t) {
    /* Verschiebbar: schmal = mittig, breit = aussen buendig.
       Feststehend: immer aussen buendig. Beide duerfen nach aussen
       nicht ueberstehen - genau das wird gezaehlt. */
    var versatz = gegen ? 0 : (t <= PROFIL ? 0 : (t - PROFIL) / 2);
    var fest = gegen ? 0 : (t - PROFIL) / 2;
    if (fest - t / 2 < -PROFIL / 2 - 0.001) raus++;
    /* vz = +1 nach innen. Aussenkante der Schiene: versatz - t/2,
       Aussenkante des Pfostens: -PROFIL/2. */
    if (versatz - t / 2 < -PROFIL / 2 - 0.001) raus++;
    if (t <= PROFIL && Math.abs(versatz) < 0.001) mittig++;
  });
  /* Wie viele MUESSEN mittig sitzen, wird gezaehlt statt angenommen -
     die erste Fassung dieser Pruefung hatte zwei erwartet und drei
     bekommen (102,5 mm passen auch noch auf den 110er Pfosten). */
  var schmal = tiefen.filter(function (t) { return t <= PROFIL; }).length;
  pruefe('Keine Schiene steht aussen ueber den Pfosten', raus === 0,
         raus + ' von ' + tiefen.length + ' stehen ueber');
  pruefe('Schmale Schienen sitzen mittig',
         gegen ? !(mittig === schmal && schmal > 0) : mittig === schmal,
         mittig + ' von ' + schmal + ' mittig');
})();
pruefe('Schienenlage steht so im Code',
       new RegExp(q || 'function velarisVersatz').test(js) &&
       new RegExp(q || 'tiefe <= PROFIL \\? 0 : vz \\* \\(tiefe - PROFIL\\) / 2').test(js), '');
pruefe('Bodenschiene liegt im Boden',
       new RegExp(q || 'yUnten - VELARIS\\.bodenSchiene / 2').test(js) &&
       !/yUnten \+ VELARIS\.bodenSchiene \/ 2/.test(js), '');

pruefe('Velaris laesst sich anklicken',
       new RegExp(q || 'function velarisGeklickt').test(js) &&
       new RegExp(q || 'lam\\.userData\\.velaris = haelfte').test(js) &&
       new RegExp(q || '!markiseGeklickt\\(e\\) && !velarisGeklickt\\(e\\)').test(js), '');
(function () {
  /* Die Animation darf das Modell NICHT mehr neu bauen - das war der
     Grund fuers Ruckeln. Geprueft wird, dass beide Fahrfunktionen die
     gemerkten Teile bewegen und aendern() nur noch am Ende aufrufen. */
  var dreh = (js.split('function velarisFahren(')[1] || '').split('\n  }')[0];
  var schieb = (js.split('function velarisSchiebenFahren(')[1] || '').split('\n  }')[0];
  var ok = /VELARIS_LAMELLEN\[i\]\.mesh\.rotation\.x = kipp/.test(dreh) &&
           /velarisSchieben\(f\.gruppen\[i\]/.test(schieb) &&
           /* aendern() darf nur noch im Notfallzweig und einmal am
              Ende stehen - nicht mehr in jedem Bild. */
           (dreh.match(/aendern\(\)/g) || []).length <= 3 &&
           (schieb.match(/aendern\(\)/g) || []).length <= 3;
  pruefe('Animation baut das Modell nicht neu', gegen ? !ok : ok, '');
})();
(function () {
  /* Die Lagenrechnung darf es nur EINMAL geben - Modell und Animation
     benutzen dieselbe. Gezaehlt werden die Bremsen: je eine Richtung,
     mehr nicht. */
  var bremsen = (js.match(/lagen\[nachbar\]/g) || []).length;
  pruefe('Lagenrechnung steht nur einmal da',
         new RegExp(q || 'function velarisLagen').test(js) &&
         (gegen ? bremsen !== 2 : bremsen === 2),
         bremsen + ' Bremsen im Code');
})();

(function () {
  /* Stirnseite mit Zwischenpfosten: Jedes Feld geht nach AUSSEN auf, wie
     bei den Glasschiebewaenden (Betreiber, 11.10.2026). Geprueft wird
     nicht die Absicht, sondern die Spiegelsymmetrie: Nach rechts
     geoeffnet muss genau das Spiegelbild von "nach links" sein - und
     geschlossen muessen beide gleich sein. */
  function lagen(links, el, n, s, offen, rk) {
    var L = new Array(n), e, f, nb;
    if (rk !== -1) {
      for (e = 0; e < n; e++) {
        f = links + (e + 0.5) * el - offen * e * el;
        nb = e - s;
        if (nb >= 0) f = Math.max(f, L[nb] + el);
        L[e] = f;
      }
      return L;
    }
    for (e = n - 1; e >= 0; e--) {
      f = links + (e + 0.5) * el + (gegen ? -offen : offen) * (n - 1 - e) * el;
      nb = e + s;
      if (nb <= n - 1) f = Math.min(f, L[nb] - el);
      L[e] = f;
    }
    return L;
  }
  var el = 100, falsch = 0;
  [[2, 3], [2, 4], [3, 3], [1, 2]].forEach(function (k) {
    var s = k[0], n = k[1], laenge = n * el;
    for (var p10 = 0; p10 <= 10; p10++) {
      var o = p10 / 10;
      var li = lagen(0, el, n, s, o, 1), re = lagen(0, el, n, s, o, -1);
      for (var i = 0; i < n; i++) {
        /* Spiegelbild: Element i rechts entspricht Element n-1-i links. */
        if (Math.abs(re[i] - (laenge - li[n - 1 - i])) > 0.001) falsch++;
        if (re[i] - el / 2 < -0.001 || re[i] + el / 2 > laenge + 0.001) falsch++;
      }
    }
  });
  pruefe('Nach aussen oeffnen ist das Spiegelbild', falsch === 0,
         falsch + ' Abweichungen');
})();
pruefe('Die Richtung kommt von der Seite',
       new RegExp(q || 'velaris\\(laenge, hoch, achse, mitte, yUnten, quer, richtung\\)').test(js) &&
       new RegExp(q || "var rk = \\(richtung === -1\\) \\? -1 : 1").test(js), '');

(function () {
  /* Ein Klick, feste Reihenfolge: zu -> Lamellen offen -> Element zur
     Seite -> zu (Betreiber waehlte Variante B, 11.10.2026).
     Nachgespielt wird die Reihenfolge, nicht nur ihr Vorhandensein. */
  function schritt(winkel, schiebbar, offen) {
    if (winkel <= 45) return 'kippen';
    if (schiebbar && offen < 50) return gegen ? 'kippen' : 'schieben';
    return 'schliessen';
  }
  var folgeS = [schritt(0, true, 0), schritt(90, true, 0), schritt(90, true, 100)];
  var folgeF = [schritt(0, false, 0), schritt(90, false, 0)];
  var okS = folgeS.join('>') === 'kippen>schieben>schliessen';
  var okF = folgeF.join('>') === 'kippen>schliessen';
  pruefe('Klickreihenfolge verschiebbar', okS, folgeS.join(' > '));
  /* Gegenprobe hier eigens und OHNE den Umweg ueber schritt(): Ein
     feststehendes Element darf nie den Schiebeschritt bekommen, sonst
     klickt der Kunde ins Leere. In der Gegenprobe wird es faelschlich
     als schiebbar behandelt - dann muss die Pruefung anschlagen. */
  function schrittRein(winkel, schiebbar, offen) {
    if (winkel <= 45) return 'kippen';
    if (schiebbar && offen < 50) return 'schieben';
    return 'schliessen';
  }
  var tot = schrittRein(90, gegen, 0) === 'schieben';
  pruefe('Feststehend ohne toten Klick', okF && !tot, folgeF.join(' > '));
})();
pruefe('Naechster Schritt steht unter dem Modell',
       /id="k3dKlickHinweis"/.test(html) &&
       new RegExp(q || 'function velarisSchrittText').test(js) &&
       /\.k3d-klickhinweis \{ bottom/.test(html), '');
pruefe('Schliessen raeumt beides auf',
       new RegExp(q || 'velarisSchiebbarJetzt\\(\\) && Z\\.velarisOffen > 0').test(js), '');

(function () {
  /* Rahmenwand FR23: Rahmen mit GLAS, keine Blechwand - so zeigen es
     Montageanleitung und Teileliste (Rahmenprofil, Sprossenprofil,
     Glasleiste). Vorher war es eine undurchsichtige Platte. */
  var block = (js.split('function rahmenwand(')[1] || '').split('\n    }')[0];
  var glas = /platte\(mGlas, feldB, feldH/.test(block);
  var blech = /platte\(mPlanke/.test(block);
  pruefe('Rahmenwand ist Glas im Rahmen',
         gegen ? !(glas && !blech) : (glas && !blech), '');
  /* Die Rechnung muss aufgehen: Rahmen + Sprossen + Scheiben ergeben
     genau das lichte Mass. Nachgerechnet ueber alle acht Aufteilungen
     und mehrere Masse. */
  var P = 5, S = 4, falsch = 0, teilungen = [[0,0],[0,1],[1,0],[2,0],[3,0],[1,1],[2,1],[3,1]];
  [[150, 200], [300, 220], [600, 250], [80, 100]].forEach(function (m) {
    teilungen.forEach(function (t) {
      var innenB = m[0] - 2 * P, innenH = m[1] - 2 * P;
      var feldB = (innenB - t[0] * S) / (t[0] + 1);
      var feldH = (innenH - t[1] * S) / (t[1] + 1);
      if (feldB <= 0 || feldH <= 0) return;
      var summeB = (t[0] + 1) * feldB + t[0] * (gegen ? S + 1 : S);
      var summeH = (t[1] + 1) * feldH + t[1] * S;
      if (Math.abs(summeB - innenB) > 0.001) falsch++;
      if (Math.abs(summeH - innenH) > 0.001) falsch++;
    });
  });
  pruefe('Felder und Sprossen fuellen den Rahmen', falsch === 0,
         falsch + ' Aufteilungen gehen nicht auf');
})();
(function () {
  /* Angeboten werden darf nur, was der Hersteller zeichnet: acht
     Aufteilungen, dazu die Automatik. Gezaehlt im Auswahlfeld. */
  var block = (html.split('id="k3dRahmenTeilung"')[1] || '').split('</select>')[0];
  var n = (block.match(/<option/g) || []).length;
  pruefe('Nur die acht belegten Aufteilungen',
         gegen ? n !== 9 : n === 9, n + ' Eintraege (8 plus automatisch)');
})();
pruefe('Rahmenwand steht in der Anfrage',
       new RegExp(q || "Rahmenwand: Festelement FR23").test(js) &&
       /id="k3dRahmenStand"/.test(html), '');

(function () {
  /* Ohne Keil geht die Rahmenwand bis ans Dach (Betreiber, 11.10.2026).
     Zwei Dinge muessen stimmen: das obere Rahmenprofil entfaellt (sonst
     waere genau die waagerechte Sprosse da, die nicht sein soll), und
     das Band entlang der Schraege wird wie der Keil eingesetzt - gleiche
     Lage, gleiche Drehung. Deshalb wird hier verglichen, dass Keil und
     Band dieselben vier Zeilen benutzen. */
  var ok = /obenProfil !== false/.test(js) &&
           /rahmenwand\(laenge, hoch, achse, mitte, yUnten, quer, !bisDach,/.test(js) &&
           /function keilBandNetz/.test(js) &&
           /hochBis\(x, innenH\)/.test(js) &&          // Sprosse bis zur Schraege
           /hochBis\(xL, hoehe\)/.test(js);            // Rahmen bis zur Schraege
  var keil = (js.match(/rotation\.y = Math\.PI \/ 2;/g) || []).length;
  pruefe('Wand geht ohne Keil bis ans Dach',
         gegen ? !ok : ok, '');
  pruefe('Band sitzt wie der Keil', gegen ? keil < 3 : keil >= 3,
         keil + ' Teile mit derselben Drehung');
})();
(function () {
  /* Das Band muss die Schraege treffen: Seine Ober- und Unterkante
     laufen parallel zur Dachunterseite, der Abstand ist die
     Profilbreite. Nachgerechnet an der Form. */
  var P = 5, falsch = 0;
  [[300, 40, 70], [500, 10, 95], [200, 5, 30]].forEach(function (m) {
    var l = m[0], hV = m[1], hH = m[2];
    /* Punkte der Form wie in keilBandNetz */
    var oben = [[-l / 2, hV], [l / 2, hH]];
    var unten = [[-l / 2, hV - P], [l / 2, (gegen ? hH - P - 3 : hH - P)]];
    var stOben = (oben[1][1] - oben[0][1]) / l;
    var stUnten = (unten[1][1] - unten[0][1]) / l;
    if (Math.abs(stOben - stUnten) > 0.0001) falsch++;
  });
  pruefe('Rahmenband laeuft parallel zur Dachschraege', falsch === 0,
         falsch + ' von 3 verzogen');
})();

(function () {
  /* Die Automatik der Rahmenwand richtet sich nach dem Keil: ein Feld je
     angefangene 1500 mm, keine waagerechte Sprosse (Betreiber,
     11.10.2026). Geprueft wird, dass Wand und Keil bei derselben Laenge
     dieselbe Feldzahl ergeben - sonst staende die Sprosse neben dem
     Keilpfosten. */
  var MAX = 150, falsch = 0, waagerecht = 0;
  for (var l = 50; l <= 900; l += 5) {
    var keilFelder = Math.min(4, Math.max(1, Math.ceil(l / MAX)));
    /* Gegenprobe: die alte Rechnung nach einem eigenen Richtwert statt
       nach dem Keilmass - dann stehen Sprosse und Keilpfosten versetzt. */
    var wandSprossen = gegen
      ? Math.min(3, Math.max(0, Math.ceil(l / 120) - 1))
      : Math.min(3, keilFelder - 1);
    var wandFelder = wandSprossen + 1;
    var sh = gegen ? 1 : 0;
    if (sh !== 0) waagerecht++;
    /* Jetzt gilt die Vierfeld-Grenze fuer BEIDE - sie muessen ueber den
       ganzen Bereich uebereinstimmen, nicht nur bis zur Grenze. */
    if (wandFelder !== keilFelder) falsch++;
  }
  pruefe('Sprossen folgen den Keilfeldern', falsch === 0,
         falsch + ' Laengen weichen ab');
  pruefe('Automatik setzt keine waagerechte Sprosse', waagerecht === 0,
         waagerecht + ' Faelle mit waagerechter');
})();
pruefe('Automatik nutzt das Keilmass',
       new RegExp(q || 'Math\\.ceil\\(laengeCm / KEIL_FELD_MAX\\)').test(js) &&
       new RegExp(q || 'return \\[felder - 1, 0\\]').test(js), '');

pruefe('Vierfeld-Grenze gilt fuer Keil und Wand',
       new RegExp(q || 'KEIL_FELD_ZAHL_MAX = 4').test(js) &&
       (js.match(/KEIL_FELD_ZAHL_MAX,/g) || []).length === 2, '');

(function () {
  /* Rahmen und Sprossen muessen die Dachschraege WIRKLICH erreichen -
     nicht ungefaehr. Nachgerechnet mit einer geneigten Dachunterkante:
     Oberkante des Profils gleich Dachunterkante, an beiden Enden und an
     jeder Sprossenstelle. */
  var yU = 0, hoch = 200, P = 5, S = 4, laenge = 450, falsch = 0;
  function dachUk(pos) { return 240 + 0.1 * pos; }      // geneigt
  var yO = yU + hoch;
  function extra(pos) { return dachUk(pos) - yO; }
  function hochBis(pos, grund) {
    return grund + Math.max(0, gegen ? 0 : extra(pos));
  }
  [[-laenge / 2 + P / 2, hoch], [laenge / 2 - P / 2, hoch]].forEach(function (e) {
    var h = hochBis(e[0], e[1]);
    if (Math.abs((yU + h) - dachUk(e[0])) > 0.001) falsch++;
  });
  for (var i = 1; i <= 3; i++) {
    var x = -laenge / 2 + P + i * ((laenge - 2 * P - 3 * S) / 4) + (i - 0.5) * S;
    var hs = hochBis(x, hoch - P);    // ohne oberes Profil
    if (Math.abs((yU + P + hs) - dachUk(x)) > 0.001) falsch++;
  }
  pruefe('Rahmen und Sprossen erreichen die Schraege', falsch === 0,
         falsch + ' von 5 Stellen zu kurz');
})();

(function () {
  /* Oberkante der Seitenelemente = Rinnenunterkante. Element plus
     Fuehrung muessen diese Hoehe GENAU erreichen - ein Spalt dazwischen
     war der Fehler vom 11.10.2026. Nachgerechnet, nicht nur gelesen. */
  var hRinne = 250, yUnten = 0.2, fuehrung = 3.5, PROFIL = 11;
  var okOben = gegen ? hRinne - PROFIL / 2 : hRinne;    // Gegenprobe: der alte Wert
  var hoch = okOben - yUnten - fuehrung;
  var oben = yUnten + hoch + fuehrung;
  pruefe('Seitenelement schliesst an der Rinne an',
         Math.abs(oben - hRinne) < 0.001,
         'Spalt ' + Math.round((hRinne - oben) * 10) + ' mm');
})();
pruefe('Keine Pfostenbreite in der Hoehenrechnung',
       gegen ? /okOben = hVorn - PROFIL \/ 2/.test(js) : !/okOben = hVorn - PROFIL \/ 2/.test(js), '');


/* ---------- LED-Spots ----------
   „die ledspots werden in den sparren leider nicht angezeigt, an die
   aeussersten sparren sind keine led spots moeglich, die led spots
   muessen je nach kundenwahl 6,8,12 perfekt ... aufgeteilt werden, geht
   das nicht kann man dem kunden einen kleinen hinweis anzeigen"
   (Betreiber, 11.10.2026). */
pruefe('Aeusserste Sparren bleiben frei',
       new RegExp(q || 'var innen = xs\\.slice\\(1, -1\\);').test(js), '');
pruefe('Zahl der Spots kommt aus dem Set',
       new RegExp(q || 'ledSetGroesse\\(\\) \\* Math\\.max\\(1, Z\\.ledsetzahl').test(js),
       'vorher immer zwei je Sparren');
pruefe('Hinweis steht im Bedienfeld',
       new RegExp(q || 'id="k3dLedStand"').test(html) &&
       new RegExp(q || 'ledStandZeigen\\(\\);').test(js), '');
pruefe('Bezugspunkt der Sparrenunterkante berichtigt',
       gegen ? /ukMitte \+ Math\.tan\(neig\) \* \(T \/ 2 - z\)/.test(js)
             : !/ukMitte \+ Math\.tan\(neig\) \* \(T \/ 2 - z\)/.test(js),
       'zMitte statt T / 2');
(function () {
  /* Zweiter Weg: nachrechnen, warum man die Spots nicht sah. Der alte
     Bezugspunkt T/2 liegt weiter vorne als die Sparrenmitte zMitte -
     um dieses Stueck mal dem Gefaelle sass der Spot zu hoch. */
  var neig = 8 * Math.PI / 180, T = 300, rinne = 18.63, wpT = 3.1;
  var dachTiefe = T - rinne, zMitte = (dachTiefe + wpT) / 2;
  var fehlerAlt = Math.tan(neig) * (T / 2 - zMitte);     // cm zu hoch
  var spotH = 1.2, versatz = 0.4;
  /* Unterkante des Spots relativ zur Sparrenunterkante (0). */
  var altUk = fehlerAlt - versatz - spotH / 2;
  var neuUk = -versatz - spotH / 2;
  if (gegen) { altUk = -1; }
  var falsch = 0, meld = [];
  if (altUk <= 0) { falsch++; meld.push('alte Lage waere sichtbar gewesen'); }
  if (neuUk >= 0) { falsch++; meld.push('Spot steckt immer noch im Profil'); }
  pruefe('Spot haengt jetzt unter dem Sparren', falsch === 0,
         falsch === 0 ? 'vorher ' + (fehlerAlt * 10).toFixed(0) +
         ' mm zu hoch, Unterkante jetzt ' + (-neuUk * 10).toFixed(0) +
         ' mm unter dem Sparren' : meld.join('; '));
})();
(function () {
  /* Zweiter Weg: die ECHTEN Funktionen aus dem Code laufen lassen, nicht
     nachgebaute. Weicht der Code ab, rechnet diese Pruefung mit. */
  var teil = (js.match(/function ledTeilung\([\s\S]*?\n  \}/) || [''])[0];
  var rat  = (js.match(/function ledRat\([\s\S]*?\n  \}\n/) || [''])[0];
  var max  = (js.match(/LED_PRO_SPARREN_MAX = (\d+)/) || [])[1];
  if (!teil || !rat || !max) {
    pruefe('LED-Funktionen lesbar', false, 'nicht gefunden');
    return;
  }
  var LED_PRO_SPARREN_MAX = parseInt(max, 10);
  /* In strict mode legt eval() nichts in diesen Gueltigkeitsbereich –
     deshalb als Ausdruck auswerten und zuweisen. */
  var ledTeilung = eval('(' + teil + ')');
  var ledRat = eval('(' + rat + ')');
  var falsch = 0, meld = [];
  function soll(nutzbar, spots, erwartet) {
    var t = ledTeilung(nutzbar, spots, 600, 280);
    var ist = t ? t.reihen + 'x' + t.proReihe : 'nichts';
    if (ist !== erwartet) { falsch++; meld.push(spots + ' auf ' + nutzbar +
      ': ' + ist + ' statt ' + erwartet); }
  }
  /* Von Hand nachgerechnet: 600 cm Breite, 280 cm Tiefe.
     12 Spots auf 5 Sparren: 2x6 (300/47), 3x4 (200/70), 4x3 (150/93).
     Am quadratischsten ist 4x3 - Abstand quer 150, in der Tiefe 93. */
  soll(5, 12, '4x3');
  soll(5, 8,  '4x2');          // 2x4 (300/70) gegen 4x2 (150/140)
  soll(5, 6,  '3x2');          // 2x3 (300/93) gegen 3x2 (200/140)
  soll(1, 12, 'nichts');       // zwoelf in einem Sparren waere eine Kette
  soll(0, 6,  'nichts');
  if (gegen) falsch = falsch ? 0 : 1;
  pruefe('Raster so quadratisch wie moeglich', falsch === 0,
         falsch === 0 ? 'vier Faelle nachgerechnet' : meld.join('; '));
  /* Geht es nicht auf, muss ein brauchbarer Rat herauskommen. */
  /* Der Rat muss ein Set nennen, das WIRKLICH aufgeht - nachgeprueft
     mit derselben Teilung. Welches es ist, schreibt die Pruefung nicht
     vor: Bei einem nutzbaren Sparren ist 8 naeher an 12 als 6. */
  var r1 = ledRat(1, 12, 600, 280), r0 = ledRat(0, 12, 600, 280);
  var m = r1.match(/(\d+)er-Set \((\d+) Spots\): (\d+) Sparren mit je (\d+)/);
  var gutRat = !!m && Number(m[3]) * Number(m[4]) === Number(m[2]) &&
               !!ledTeilung(1, Number(m[2]), 600, 280) && /äußersten/.test(r0);
  pruefe('Hinweis nennt ein Set, das aufgeht', gegen ? !gutRat : gutRat,
         r1 || '(leer)');
  /* Die genutzten Sparren liegen symmetrisch - sonst sitzt das Licht
     schief im Dach. Dieselbe Formel wie im Code. */
  var unsym = 0, n, r, i, idx, doppelt = 0;
  for (n = 1; n <= 9; n++) {
    for (r = 1; r <= n; r++) {
      idx = [];
      for (i = 0; i < r; i++) idx.push(Math.round((i + 0.5) * n / r - 0.5));
      if (!gegen) {                      // Spiegelung wie im Code
        for (i = 0; i < Math.floor(r / 2); i++) idx[r - 1 - i] = n - 1 - idx[i];
      }
      /* Jedes Paar muss sich genau spiegeln. Nur ein einzelner
         Sparren in der Mitte (ungerade Teilung) darf um einen halben
         Abstand danebenliegen - exakt mittig gibt es dort nicht immer.
         Die ungespiegelte Rundung verfehlt das: Sie rundet immer nach
         oben und schiebt damit das ganze Raster nach rechts. */
      for (i = 0; i < Math.floor(r / 2); i++) {
        if (idx[i] + idx[r - 1 - i] !== n - 1) unsym++;
      }
      for (i = 1; i < r; i++) if (idx[i] <= idx[i - 1]) doppelt++;
    }
  }
  pruefe('Genutzte Sparren liegen symmetrisch', unsym === 0 && doppelt === 0,
         unsym + ' schiefe, ' + doppelt + ' doppelt belegte Aufteilungen bis 9 Sparren');
})();


/* ---------- Schwebende Knoepfe ueber dem 3D-Bild ----------
   „beim konfigurator stoeren diese buttons ... NUR im bereich des
   konfigurators ausgeblendet werden, sobald man aber z.b weiter runter
   scrollt z.b ab dem footer sollen die wieder auftauchen" (Betreiber,
   11.10.2026). */
pruefe('Schwebeknoepfe werden nur im Konfigurator ausgeblendet',
       new RegExp(q || 'body\\.k3d-im-bild #bv-a11y-trigger').test(html) &&
       new RegExp(q || 'body\\.k3d-im-bild #bvKonfigBubble').test(html), '');
pruefe('Ein Beobachter blendet sie wieder ein',
       new RegExp(q || 'IntersectionObserver').test(html) &&
       new RegExp(q || "classList\\.toggle\\('k3d-im-bild', drin\\)").test(html),
       'nicht dauerhaft versteckt');
(function () {
  /* Dauerhaft verstecken waere der bequeme Fehler: Die
     Barrierefreiheits-Hilfe muss auf jeder Seite erreichbar bleiben.
     Geprueft wird deshalb, dass es KEINE Regel gibt, die sie auf dieser
     Seite ohne Bedingung ausblendet. */
  var dauerhaft = /body\.k3d-app-seite\s+#bv-a11y-trigger\s*\{[^}]*display:\s*none/.test(html) ||
                  /#bv-a11y-trigger\s*\{[^}]*display:\s*none/.test(html);
  if (gegen) dauerhaft = !dauerhaft;
  pruefe('Barrierefreiheits-Knopf nicht dauerhaft versteckt', !dauerhaft,
         'nur solange der Konfigurator im Bild ist');
})();
pruefe('Ohne Beobachter bleibt alles sichtbar',
       new RegExp(q || "if \\(!app \\|\\| !\\('IntersectionObserver' in window\\)\\) return;").test(html),
       'alte Browser sehen die Knoepfe');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
