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
/* Seit dem 24.10.2026 steht zwischen den beiden Attributen noch
   data-k3d-pro – die Neigung gehoert zu Pro. Geprueft wird weiter
   dasselbe: Sie steht im Schritt „Maße". */
pruefe('Neigung steht direkt unter der Durchgangshöhe',
       new RegExp(q || 'data-k3d-schritt="masse"[^>]*data-k3d-fuer="neigung"').test(html), '');

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
(function () {
  /* FRUEHER stand hier: die Winkelgrenze werde NUR fuer die
     Innenansicht angehoben. Das gilt nicht mehr - seit dem Wunsch
     „das man gut drunter gucken kann" darf die Kamera ueberall unter
     den Horizont. Die Pruefung haelt jetzt fest, was wirklich gilt: Die
     Innenansicht geht am weitesten, und keine der beiden Grenzen darf so
     weit gehen, dass das Bild auf dem Kopf steht. */
  var innen = parseFloat((js.match(/kam\.phiMax = Math\.PI \/ 2 \+ ([\d.]+)/) || [])[1]);
  var allg = parseFloat((js.match(/PHI_MAX_UNTEN = Math\.PI \/ 2 \+ ([\d.]+)/) || [])[1]);
  if (gegen) allg = 1.6;                       // weiter als senkrecht nach oben
  var falsch = 0, meld = [];
  if (!innen || !allg) { falsch++; meld.push('Grenzen nicht lesbar'); }
  if (allg >= Math.PI / 2) { falsch++; meld.push('Bild stuende auf dem Kopf'); }
  if (innen < allg) { falsch++; meld.push('Innenansicht geht weniger weit als der Rest'); }
  pruefe('Winkelgrenzen bleiben unter dem Ueberschlag', falsch === 0,
         falsch === 0 ? 'allgemein +' + allg + ', Innenansicht +' + innen : meld.join('; '));
})();
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
/* Zwischen lookAt und neuZeichnen steht jetzt die Durchsicht der
   Hauswand - sie darf dazwischen stehen, neuZeichnen aber nicht
   wegfallen. */
[['Kamerabewegung', 'kamera3\\.lookAt\\(kam\\.ziel\\);[\\s\\S]{0,60}neuZeichnen\\(\\)'],
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
           /* hAuf/yAuf statt hoch/yUnten seit 11.10.2026: Liegt eine
              Plankenwand darunter, faengt die Rahmenwand erst auf deren
              Oberkante an. Ohne Planken sind beide gleich. */
           /rahmenwand\(laenge, hAuf, achse, mitte, yAuf, quer, !bisDach,/.test(js) &&
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
       new RegExp(q || "classList\\.toggle\\('k3d-im-bild', imBild && !amLogo\\)").test(html),
       'nicht dauerhaft versteckt');
/* Zweite Bedingung: Spaetestens auf Hoehe des Firmenlogos in der
   Fusszeile sind die Knoepfe wieder da - sonst steht man auf einem
   hohen Bildschirm schon in der Fusszeile und hat keine. */
pruefe('Spaetestens am Firmenlogo wieder sichtbar',
       new RegExp(q || 'id="k3dFussLogo"').test(html) &&
       new RegExp(q || 'amLogo = eintraege\\[0\\]\\.isIntersecting').test(html), '');
(function () {
  /* Zweiter Weg: die Bedingung durchspielen. Versteckt NUR dann, wenn
     der Konfigurator im Bild ist und das Logo noch nicht. */
  function versteckt(imBild, amLogo) { return imBild && !amLogo; }
  var falsch = 0;
  if (!versteckt(true, false)) falsch++;        // oben im Konfigurator
  if (versteckt(true, true)) falsch++;          // Logo schon im Bild
  if (versteckt(false, false)) falsch++;        // weit darunter
  if (versteckt(false, true)) falsch++;         // Fusszeile
  if (gegen) falsch = falsch ? 0 : 1;
  pruefe('Regel durchgespielt', falsch === 0, 'vier Faelle');
})();
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


/* ---------- Ansichtsleiste am Handy ----------
   „in der breite bitte von bildschirmrand zu bildschirmrand" und „etwas
   schmaler in der hoehe, aber alles gut lesbar" (Betreiber, 11.10.2026). */
(function () {
  var block = (html.match(/@media \(max-width: 900px\)[\s\S]*?\n    \}/) || [''])[0];
  var leiste = (block.match(/\.k3d-leiste \{[\s\S]*?\}/) || [''])[0];
  var knopf = (block.match(/\.k3d-leiste button \{[^}]*\}/) || [''])[0];
  var falsch = 0, meld = [];
  if (!/left: 0; right: 0/.test(leiste)) { falsch++; meld.push('nicht randlos'); }
  if (!/border-radius: 0/.test(leiste)) { falsch++; meld.push('noch abgerundet'); }
  if (/right: 74px/.test(leiste)) { falsch++; meld.push('alter Abstand fuer die Knoepfe'); }
  /* Flacher ueber die Polster, nicht ueber die Schrift: die Schriftgroesse
     muss bleiben, sonst wird es unleserlich. */
  var fs = (knopf.match(/font-size: ([\d.]+)rem/) || [])[1];
  var pad = (knopf.match(/padding: (\d+)px/) || [])[1];
  if (gegen) { fs = '0.6'; pad = '14'; }
  if (!fs || parseFloat(fs) < 0.7) { falsch++; meld.push('Schrift zu klein (' + fs + 'rem)'); }
  /* Ein Bereich statt einer Zahl: zu flach ist genauso falsch wie zu
     hoch. Unter 5 px wird die Flaeche zum Antippen zu klein (Betreiber
     am iPhone 17 Pro), ueber 7 px ragt die Leiste wieder ins Bild. */
  var pz = parseInt(pad, 10);
  if (!pad || pz < 5 || pz > 7) { falsch++; meld.push('Polster ' + pad + 'px, erlaubt 5 bis 7'); }
  pruefe('Ansichtsleiste randlos und flacher', falsch === 0,
         falsch === 0 ? 'Schrift ' + fs + 'rem, Polster ' + pad + 'px' : meld.join('; '));
})();
pruefe('Platz fuer die Streifenleiste des iPhones',
       new RegExp(q || 'env\\(safe-area-inset-bottom').test(html),
       'sonst liegt sie ueber den Knoepfen');


/* ---------- Reihenfolge in der Ansichtsleiste ----------
   „die angaben maße, abend, drehen bitte vor der angabe perspektive mit
   trennstrich ... sonne und mond symbol davor" (Betreiber, 11.10.2026). */
(function () {
  var leiste = (html.match(/<div class="k3d-leiste"[\s\S]*?<\/div>/) || [''])[0];
  var folge = [];
  var re = /id="(k3dMasseLeiste|k3dAbend|k3dDrehen)"|class="k3d-trenn"|data-k3d-ansicht="Perspektive"/g, m;
  while ((m = re.exec(leiste))) folge.push(m[1] || (m[0].indexOf('trenn') > -1 ? 'trenn' : 'perspektive'));
  var soll = ['k3dMasseLeiste', 'k3dAbend', 'k3dDrehen', 'trenn', 'perspektive'];
  if (gegen) soll.reverse();
  var gleich = folge.length === soll.length && soll.every(function (x, i) { return folge[i] === x; });
  pruefe('Schalter stehen vor den Blickrichtungen', gleich, folge.join(' → '));
})();
pruefe('Sonne und Mond am Abend-Schalter',
       new RegExp(q || 'class="k3d-sym" aria-hidden="true">☾').test(html) &&
       new RegExp(q || "sym\\.textContent = Z\\.abend \\? '☀' : '☾'").test(js), '');
/* Das Symbol steht VOR der Beschriftung - wer weiter mit
   querySelector('span') schreibt, loescht es. */
pruefe('Beschriftung wird am eigenen Feld gesetzt',
       gegen ? /abendBtn\.querySelector\('span'\)/.test(js)
             : !/abendBtn\.querySelector\('span'\)/.test(js),
       'nicht mehr am ersten span');


/* ---------- Bild speichern am Handy ----------
   „bei mobile klappen auf handy die ersten 2 symbole nicht deswegen lass
   sie auf handy weg, mach den download button bissl breiter ... und wenn
   man draufdrueckt kann man direkt mehrere perspektiven in bilder
   runterladen" (Betreiber, 11.10.2026). */
(function () {
  var block = (html.match(/@media \(max-width: 900px\)[\s\S]*?\n    \}/) || [''])[0];
  var weg = /\.k3d-nurgross-knopf \{ display: none; \}/.test(block);
  /* Breiter, nicht hoeher: Das Polster an den Seiten muss deutlich
     groesser sein als oben und unten - die Zahl selbst darf sich
     aendern, die Form nicht. */
  var p = block.match(/#k3dBild \{ padding: (\d+)px (\d+)px/);
  var label = !!p && Number(p[2]) >= Number(p[1]) * 2;
  if (gegen) { weg = !weg; label = !label; }
  pruefe('Am Handy nur der Bild-Knopf, mit Beschriftung', weg && label,
         weg ? (label ? 'Bedienfeld und Vollbild weg, Knopf breiter'
                      : 'Knopf nicht breiter') : 'die beiden stehen noch da');
  /* Die Beschriftung darf NICHT die Klasse tragen, die am Handy
     ausgeblendet wird - sonst ist der Knopf breiter, aber leer. */
  var btn = (html.match(/id="k3dBild"[^>]*>[\s\S]*?<\/button>/) || [''])[0];
  var sichtbar = /class="k3d-immer"/.test(btn) && !/k3d-nurgross/.test(btn);
  if (gegen) sichtbar = !sichtbar;
  pruefe('Beschriftung bleibt am Handy sichtbar', sichtbar, '');
})();
(function () {
  var menu = (html.match(/<div class="k3d-bildmenu"[\s\S]*?<\/div>/) || [''])[0];
  var soll = ['jetzt', 'Perspektive', 'Vorne', 'Seite', 'Von oben', 'Darunter', 'alle'];
  var ist = (menu.match(/data-k3d-bild="([^"]+)"/g) || []).map(function (x) {
    return x.replace(/data-k3d-bild="|"/g, ''); });
  if (gegen) soll.push('gibtsnicht');
  var fehlt = soll.filter(function (x) { return ist.indexOf(x) === -1; });
  pruefe('Menue bietet jede Ansicht an', !fehlt.length,
         fehlt.length ? 'fehlt: ' + fehlt.join(', ') : ist.length + ' Einträge');
})();
/* Alles in EINER Datei statt fuenf Downloads: Handy-Browser lassen nur
   einen Download je Tipp zu, der Rest geht still verloren. Bis zum
   12.10.2026 war das ein PNG mit fuenf Feldern, seither ein PDF mit einer
   Seite je Ansicht – geprueft wird das Erzeugen selbst in
   scripts/pruefe-pdf.js, hier nur der Weg dorthin. */
pruefe('Alle Ansichten kommen als eine Datei',
       new RegExp(q || 'window\\.BV_PDF\\.erzeugen\\(seiten').test(js) &&
       new RegExp(q || "replace\\(/\\\\.png\\$/, '\\.pdf'\\)").test(js), '');
(function () {
  /* Zweiter Weg: zaehlen, wie oft beim Sammeln wirklich geladen wird.
     Mehr als einmal waere genau der Fehler, den die eine Datei vermeiden
     soll – Handy-Browser verwerfen den Rest still. Gezaehlt wird im Zweig
     'alle' des Knopfes und in pdfSeiten(): die Funktion sammelt nur die
     Seiten und gibt sie weiter, laden darf sie nicht. */
  var zweig = (js.match(/if \(was === 'alle'\) \{[\s\S]*?return;\n        \}/) || [''])[0];
  var fn = (js.match(/function pdfSeiten\([\s\S]*?\n  \}/) || [''])[0];
  var male = (zweig.match(/pdfLaden\(|bildLaden\(/g) || []).length + (gegen ? 1 : 0);
  var inFn = (fn.match(/pdfLaden\(|bildLaden\(/g) || []).length;
  pruefe('PDF laedt genau einmal', male === 1 && inFn === 0,
         male + ' Download(s) im Zweig, ' + inFn + ' in pdfSeiten');
})();
pruefe('Nach dem Speichern steht die Ansicht wie vorher',
       new RegExp(q || 'if \\(vorherAnsicht\\) ansichtAnwenden\\(vorherAnsicht\\)').test(js) &&
       new RegExp(q || 'vorher && vorher !== name\\) ansichtAnwenden\\(vorher\\)').test(js),
       'kein Sprung in eine andere Ansicht');

/* ---------- Blick von hinten durch die Hauswand ----------
   „sobald man so hinter die wand scrollt soll die wand durchsichtig
   werden, man soll aber noch leicht sehen das da ne wand is aber nicht
   zu krass" (Betreiber, 11.10.2026). */
pruefe('Wand wird durchsichtig, wenn die Kamera dahinter steht',
       new RegExp(q || 'function wandDurchsicht\\(\\)').test(js) &&
       new RegExp(q || 'kamera3\\.position\\.z < vorne').test(js), '');
pruefe('Bei jeder Kamerabewegung geprueft',
       (js.match(/wandDurchsicht\(\);/g) || []).length === (gegen ? 1 : 2),
       'Kamera und Neubau');
(function () {
  /* Nicht zu krass: Die Wand muss sichtbar bleiben. Unter 10 % sieht man
     sie nicht mehr, ueber 40 % verdeckt sie weiter die Anlage. */
  var o = parseFloat((js.match(/WAND_DURCHSICHT = ([\d.]+)/) || [])[1]);
  if (gegen) o = 0.02;
  pruefe('Wand bleibt erkennbar, verdeckt aber nicht', o >= 0.1 && o <= 0.4,
         Math.round(o * 100) + ' % Deckkraft');
})();
(function () {
  /* Zweiter Weg: die Grenze nachrechnen. Vor der Wand voll, dahinter
     durchsichtig - gerechnet mit den Zahlen aus dem Modell. */
  var mitte = -12, tiefe = 24;               // wand.position.z, BoxGeometry-Tiefe
  var vorne = mitte + tiefe / 2;
  function durch(z) { return z < vorne; }
  var falsch = 0;
  if (durch(300)) falsch++;                  // Standardblick von vorne
  if (durch(50)) falsch++;                   // schraeg seitlich
  if (!durch(-40)) falsch++;                 // dahinter
  if (!durch(-13)) falsch++;                 // knapp dahinter
  if (gegen) falsch = falsch ? 0 : 1;
  pruefe('Grenze liegt an der Wandvorderkante', falsch === 0,
         'Vorderkante z = ' + vorne);
})();
/* Eine durchsichtige Wand, die vollen Schatten wirft, sieht aus wie ein
   Fehler - und die Tuer darf nicht allein im Bild schweben. */
pruefe('Schatten und Tuer gehen mit',
       new RegExp(q || 'wand\\.castShadow = !dahinter').test(js) &&
       new RegExp(q || '\\[wand\\.material, tuer\\.material\\]').test(js), '');

/* Die Zeile im Bild nennt nur noch Mass und Quadratmeter. */
pruefe('Infozeile ohne die Worte „ueberdachte Flaeche"',
       gegen ? /m² überdachte Fläche/.test(js) : !/m² überdachte Fläche/.test(js),
       'nur Mass und m²');
pruefe('Mass und Quadratmeter stehen weiter da',
       new RegExp(q || "Z\\.breite \\+ ' × ' \\+ Z\\.tiefe \\+ ' mm · '").test(js) &&
       new RegExp(q || "qm\\.toFixed\\(2\\)\\.replace\\('\\.', ','\\) \\+ ' m²'").test(js), '');


/* ---------- Unter das Dach schauen ----------
   „man kann momentan nicht unter die ueberdachung scrollen oder mit der
   kamera fahren weil der boden blockiert, das soll gehen und der boden
   soll nur in diesem kamerabereich fuer diesen moment durchsichtig
   werden ... das man gut drunter gucken kann" (Betreiber, 11.10.2026). */
pruefe('Kamera darf unter den Horizont',
       new RegExp(q || 'PHI_MAX_UNTEN = Math\\.PI / 2 \\+ ').test(js) &&
       new RegExp(q || 'kam\\.phiMax \\|\\| PHI_MAX_UNTEN').test(js),
       'nicht mehr bei 90 Grad Schluss');
pruefe('Boden wird nur in dieser Lage durchsichtig',
       new RegExp(q || 'function bodenDurchsicht\\(\\)').test(js) &&
       new RegExp(q || 'kamera3\\.position\\.y < 0').test(js) &&
       new RegExp(q || 'bodenDurchsicht\\(\\);').test(js), '');
pruefe('Bodenschatten geht mit aus',
       new RegExp(q || 'rasen\\.receiveShadow = !drunter').test(js) &&
       new RegExp(q || 'belag\\.receiveShadow = !drunter').test(js),
       'sonst liegt er als Fleck in der Luft');
(function () {
  /* Zweiter Weg: nachrechnen, ob man damit wirklich unter das Dach
     kommt. Gerechnet mit den Zahlen aus dem Code und einem Dach von
     2300 mm Durchgangshoehe. */
  var phiMax = parseFloat((js.match(/PHI_MAX_UNTEN = Math\.PI \/ 2 \+ ([\d.]+)/) || [])[1]);
  var o = parseFloat((js.match(/BODEN_DURCHSICHT = ([\d.]+)/) || [])[1]);
  if (!phiMax || !o) { pruefe('Werte lesbar', false, 'nicht gefunden'); return; }
  var phi = Math.PI / 2 + (gegen ? -0.04 : phiMax);
  var zielY = 230 * 0.48, radius = 600;          // cm
  var kameraY = zielY + radius * Math.cos(phi);
  var falsch = 0, meld = [];
  if (kameraY > -50) { falsch++; meld.push('Kamera kommt nur auf ' + kameraY.toFixed(0) + ' cm'); }
  if (phi >= Math.PI) { falsch++; meld.push('Bild stuende auf dem Kopf'); }
  if (!(o >= 0.05 && o <= 0.3)) { falsch++; meld.push('Boden zu ' + Math.round(o * 100) + ' % deckend'); }
  pruefe('Man kommt wirklich unter das Dach', falsch === 0,
         falsch === 0 ? 'Kamera bis ' + kameraY.toFixed(0) + ' cm unter dem Ziel, Boden ' +
         Math.round(o * 100) + ' %' : meld.join('; '));
})();

(function () {
  /* Kopfzeile und Bild-Knopf so flach wie die Leiste unten - aber die
     Schrift bleibt lesbar. „die beiden sachen in der hoehe bissl
     schmaler aehnlich wie die leiste unten" (Betreiber, 11.10.2026). */
  var block = (html.match(/@media \(max-width: 900px\)[\s\S]*?\n    \}/) || [''])[0];
  function zahl(muster) {
    var m = block.match(muster);
    return m ? parseFloat(m[1]) : NaN;
  }
  var polsterLeiste = zahl(/\.k3d-leiste button \{ padding: (\d+)px/);
  var polsterOben = zahl(/\.k3d-oben button \{ padding: (\d+)px/);
  var polsterBild = zahl(/#k3dBild \{ padding: (\d+)px/);
  var schriftBild = zahl(/#k3dBild \{ padding: \d+px \d+px; font-size: ([\d.]+)rem/);
  var schriftInfo = zahl(/\.k3d-info p \{ font-size: ([\d.]+)rem/);
  /* Gegenprobe mit deutlich hoeheren Polstern - knapp daneben wuerde
     die Pruefung nicht anschlagen, seit die Leiste selbst 6 px hat. */
  if (gegen) { polsterOben = 14; polsterBild = 18; }
  var falsch = 0, meld = [];
  if (!(polsterOben <= polsterLeiste + 1)) { falsch++; meld.push('Kopfknoepfe ' + polsterOben + 'px gegen ' + polsterLeiste + 'px unten'); }
  if (!(polsterBild <= polsterLeiste + 2)) { falsch++; meld.push('Bild-Knopf ' + polsterBild + 'px'); }
  if (!(schriftBild >= 0.7) || !(schriftInfo >= 0.7)) { falsch++; meld.push('Schrift unter 0,7rem'); }
  pruefe('Kopfzeile so flach wie die Leiste unten', falsch === 0,
         falsch === 0 ? 'Polster ' + polsterOben + '/' + polsterBild + 'px, Leiste ' +
         polsterLeiste + 'px, Schrift ' + schriftInfo + '/' + schriftBild + 'rem'
         : meld.join('; '));
})();

/* „das erstellen alles 5 bilder in einem bild funktioniert nicht, steht
   nur wird erstellt, passiert nix" (Betreiber, 11.10.2026): Der erste
   Versuch wartete auf fuenf Image-onload. Bleibt eines aus, wartet der
   Knopf fuer immer. */
(function () {
  /* Geprueft wird der SAMMELBILD-Block, nicht die ganze Datei: Ein
     Image.onload an anderer Stelle (das Logo im Wasserzeichen) ist
     harmlos – dort wartet kein Knopf darauf. */
  var blk = (js.split('function bildAlle(')[1] || '').split('\n  }')[0];
  var hat = /onload = function/.test(blk) || gegen;
  pruefe('Sammelbild kommt ohne Rueckruf aus', !hat,
         'Leinwand direkt in Leinwand gezeichnet');
})();
pruefe('Knopf faellt auch bei einem Fehler zurueck',
       new RegExp(q || 'finally \\{ zurueck\\(\\); \\}').test(js),
       'nicht fuer immer „Wird erstellt"');

/* „die angabe muss im abendmodus weiss werden sonst kann man es nicht
   lesen" (Betreiber, 11.10.2026). */
pruefe('Abendmodus schaltet die Schrift ueber dem Bild um',
       new RegExp(q || "classList\\.toggle\\('ist-abend', !!Z\\.abend\\)").test(js) &&
       new RegExp(q || '\\.k3d-buehne\\.ist-abend \\.k3d-info h2').test(html) &&
       new RegExp(q || '\\.k3d-buehne\\.ist-abend \\.k3d-info p').test(html), '');
(function () {
  /* Beide Zeilen - Produktname UND Massangabe - muessen hell werden.
     Eine allein genuegt nicht; genau die Massangabe war beanstandet. */
  var regel = (html.match(/\.k3d-buehne\.ist-abend[\s\S]*?\}/) || [''])[0];
  var hell = /color: #fff/.test(regel) && /text-shadow/.test(regel);
  var beide = /h2,[\s\S]*?\.k3d-info p/.test(regel);
  if (gegen) hell = !hell;
  pruefe('Ueberschrift und Massangabe werden beide hell', hell && beide,
         beide ? '' : 'nur eine der beiden Zeilen');
})();
/* Umgeschaltet wird an EINER Stelle - dort, wo der Abend sowieso
   gesetzt wird. Zwei Stellen laufen beim naechsten Umbau auseinander. */
pruefe('Nur eine Stelle schaltet den Abend um',
       (js.match(/classList\.toggle\('ist-abend'/g) || []).length === (gegen ? 2 : 1),
       'in stimmung()');

/* „bei dem erstellten bild is ja unten rechts ... dieses schwarze freie
   rechteck, dort koennte man z.b die wichtigsten eckdaten schreiben"
   (Betreiber, 11.10.2026). */
pruefe('Eckdaten kommen aus derselben Liste wie die Anfrage',
       gegen ? /zusammenfassung\(\)\.join\(' · '\), rand/.test(js)
             : !/zusammenfassung\(\)\.join\(' · '\), rand/.test(js),
       'keine winzige Zeile mehr unter dem Blatt');
(function () {
  /* Zweiter Weg: nachrechnen, dass das Feld wirklich im Blatt liegt -
     mit denselben Formeln wie der Code. */
  var breit = 900, hoch = 600, rand = 14, kopf = 26;
  var blattH = (hoch + kopf) * 3 + rand * 4;
  var blattB = breit * 2 + rand * 3;
  var ex = rand + (breit + rand);
  var ey = rand + 2 * (hoch + kopf + rand) + kopf;
  if (gegen) ey += 200;
  var falsch = 0, meld = [];
  if (ex + breit > blattB - rand + 0.001) { falsch++; meld.push('ragt rechts heraus'); }
  if (ey + hoch > blattH - rand + 0.001) { falsch++; meld.push('ragt unten heraus'); }
  /* Und es muss das SECHSTE Feld sein, also neben dem fuenften. */
  var fuenftX = rand + 0 * (breit + rand);
  if (ex <= fuenftX) { falsch++; meld.push('liegt nicht neben Darunter'); }
  pruefe('Eckdatenfeld liegt im Blatt, unten rechts', falsch === 0,
         falsch === 0 ? 'x ' + ex + ', y ' + ey + ' in ' + blattB + ' x ' + blattH
                      : meld.join('; '));
})();
pruefe('Vorbehalt steht auf dem Blatt',
       new RegExp(q || 'Unverbindliche Darstellung').test(js),
       'verbindlich ist das Angebot nach Aufmass');

(function () {
  /* „bei ansicht ,darunter' sollte es so aussehen rausgescrollt wie auf
     meinem screen" (Betreiber, 11.10.2026). Zweiter Weg: die sichtbare
     Breite an der Dachvorderkante ausrechnen - mit dem Bildwinkel aus
     dem Code und dem Abstandsfaktor aus ansichtInnen(). */
  var fov = parseFloat((js.match(/new THREE\.PerspectiveCamera\((\d+)/) || [])[1]);
  var weit = parseFloat((js.match(/var WEIT = ([\d.]+);/) || [])[1]);
  var augen = parseFloat((js.match(/AUGENHOEHE = (\d+)/) || [])[1]);
  if (!fov || !weit || !augen) { pruefe('Werte der Innenansicht lesbar', false, ''); return; }
  if (gegen) weit = 1.0;                       // der alte, zu nahe Abstand
  var T = 300, phi = Math.PI / 2 + 0.30;
  var zielZ = T + 150, kameraZ = T * 0.25;
  var r = (zielZ - kameraZ) / Math.sin(phi);
  var kamZ = zielZ - Math.sin(phi) * r * weit;
  var kamY = (augen + Math.abs(Math.cos(phi)) * r) - Math.abs(Math.cos(phi)) * r * weit;
  var breiteSicht = 2 * (T - kamZ) * Math.tan(fov / 2 * Math.PI / 180);   // Seitenverhaeltnis 1
  var falsch = 0, meld = [];
  if (breiteSicht < 450) { falsch++; meld.push('nur ' + (breiteSicht / 100).toFixed(2) + ' m im Bild'); }
  if (kamY < -60) { falsch++; meld.push('Kamera ' + kamY.toFixed(0) + ' cm unter dem Boden'); }
  pruefe('Darunter zeigt das ganze Dach', falsch === 0,
         falsch === 0 ? (breiteSicht / 100).toFixed(2) + ' m Breite im Bild, Kamera ' +
         kamY.toFixed(0) + ' cm hoch' : meld.join('; '));
})();
pruefe('Hineinzoomen bleibt moeglich',
       new RegExp(q || 'kam\\.radiusMin = r \\* 0\\.45').test(js),
       'bei halbem Abstand steht man wieder darunter');

(function () {
  /* „dieser bereich kann weg damit mehr platz fuer den konfigurator
     entsteht ... weil is selbsterklaerend" (Betreiber, 11.10.2026).
     Der Kopfblock ist weg - die Seite braucht aber weiter GENAU EINE
     sichtbare Hauptueberschrift: ohne sie ordnet Google die Seite
     schlechter ein und Screenreader haben keinen Einstieg. */
  var h1 = (html.match(/<h1[^>]*>/g) || []);
  var kopfWeg = !/k3d-sl-kopf/.test(html);
  var imBild = /<h1 id="k3dTitelBuehne"/.test(html);
  if (gegen) { kopfWeg = !kopfWeg; }
  var falsch = 0, meld = [];
  if (!kopfWeg) { falsch++; meld.push('Kopfblock steht noch da'); }
  if (h1.length !== 1) { falsch++; meld.push(h1.length + ' Hauptueberschriften'); }
  if (!imBild) { falsch++; meld.push('Ueberschrift nicht im Bild'); }
  pruefe('Kopfblock weg, Ueberschrift sichtbar im Bild', falsch === 0,
         falsch === 0 ? 'eine h1, im Bild' : meld.join('; '));
  /* Verstecken statt umziehen waere Verschleierung - die Ueberschrift
     darf nicht per CSS unsichtbar gemacht werden. */
  var versteckt = /#k3dTitelBuehne[^}]*display:\s*none/.test(html) ||
                  /\.k3d-info[^}]*visibility:\s*hidden/.test(html);
  if (gegen) versteckt = !versteckt;
  pruefe('Ueberschrift ist nicht versteckt', !versteckt,
         'kein Text nur fuer Suchmaschinen');
})();

(function () {
  /* „das 3d modell soll obere bildschirmhälfte bzw. bildschirmdrittel
     ... stehen bleiben und unten der konfigurator soll sich scrollen
     lassen" (Betreiber, 11.10.2026). */
  var block = (html.match(/@media \(max-width: 900px\)[\s\S]*?\n    \}/) || [''])[0];
  var buehne = (block.match(/\.k3d-buehne \{[\s\S]*?\}/) || [''])[0];
  var klebt = /position: sticky/.test(buehne) && /top: 0/.test(buehne);
  var hoehe = parseFloat((buehne.match(/height: ([\d.]+)svh/) || [])[1]);
  if (gegen) { klebt = !klebt; hoehe = 80; }
  var falsch = 0, meld = [];
  if (!klebt) { falsch++; meld.push('Bild bleibt nicht stehen'); }
  /* Nicht mehr als die Haelfte: sonst bleibt fuer das Bedienfeld nur ein
     Schlitz, und genau das sollte die Aenderung ja verhindern. */
  if (!(hoehe >= 30 && hoehe <= 50)) { falsch++; meld.push(hoehe + ' svh hoch'); }
  pruefe('3D-Bild bleibt am Handy oben stehen', falsch === 0,
         falsch === 0 ? hoehe + ' svh, klebt oben' : meld.join('; '));
  /* fixed waere falsch: Dann laege das Bild auch ueber Fusszeile und
     Impressum. */
  pruefe('Nicht fest ueber der ganzen Seite',
         gegen ? /\.k3d-buehne \{[^}]*position: fixed/.test(block)
               : !/\.k3d-buehne \{[^}]*position: fixed/.test(block),
         'sticky, nicht fixed');
})();

(function () {
  /* Der haeufigste Grund, warum position: sticky nicht wirkt: ein
     Vorfahr mit overflow-x: hidden. Genau das steht in css/style.css
     fuer html und body. */
  var css = fs.readFileSync('css/style.css', 'utf8');
  var global = /body,html\{overflow-x:hidden/.test(css) || /html,body\{overflow-x:hidden/.test(css);
  var geheilt = /html\.k3d-html, body\.k3d-app-seite \{ overflow-x: clip; \}/.test(html) &&
                /<html lang="de" class="k3d-html">/.test(html);
  if (gegen) geheilt = !geheilt;
  pruefe('Kein Scrollbehaelter bricht das klebende Bild',
         !global || geheilt,
         global ? (geheilt ? 'overflow-x: clip auf dieser Seite'
                           : 'html/body haben overflow-x: hidden')
                : 'keine globale Regel');
})();

/* ---------- Sonderfarbe nach RAL ----------
   „wenn man das waehlt soll ... nen feld (optionales feld) auftauchen wo
   man einen anderen RAL code eintragen kann, der 3d konfi soll diesen
   dann berechnen und anzeigen ... und aufpreis hinweis" (Betreiber,
   11.10.2026). */
pruefe('Feld erscheint nur bei „Andere / Beratung"',
       new RegExp(q || "case 'ral-sonder':     return Z\\.farbe === 'Andere / Beratung'").test(js) &&
       new RegExp(q || 'data-k3d-fuer="ral-sonder"').test(html), '');
pruefe('Aufpreis steht im Bedienfeld und in der Anfrage',
       new RegExp(q || 'Sonderfarben sind aufpreispflichtig').test(html) &&
       new RegExp(q || 'Sonderfarbe, aufpreispflichtig').test(js),
       'ohne Zahl - die haengt von Menge und Oberflaeche ab');
(function () {
  /* Die Nachschlagezeile darf es nur noch EINMAL geben: in
     gestellFarbe(). Vorher stand sie an vier Stellen - vier Stellen, die
     beim naechsten Mal auseinanderlaufen. */
  var male = (js.match(/FARBEN\[Z\.farbe\] \|\| FARBEN\['Anthrazit'\]/g) || []).length + (gegen ? 1 : 0);
  var drin = /function gestellFarbe\(\)[\s\S]{0,400}FARBEN\[Z\.farbe\] \|\| FARBEN\['Anthrazit'\]/.test(js);
  pruefe('Alle Bauteile nehmen dieselbe Farbquelle', male === 1 && drin,
         male + ' Nachschlagezeile(n), in gestellFarbe: ' + drin);
})();
(function () {
  /* Zweiter Weg: die ECHTE Funktion laufen lassen. Bekannte Nummer ->
     deren Ton, unbekannte -> Anthrazit (nicht geraten), Schreibweise
     egal. */
  var tab = (js.match(/var RAL = \{[\s\S]*?\n  \};/) || [''])[0];
  var fn = (js.match(/function ralNummer\(\)[\s\S]*?\n  \}/) || [''])[0];
  var gf = (js.match(/function gestellFarbe\(\)[\s\S]*?\n  \}/) || [''])[0];
  if (!tab || !fn || !gf) { pruefe('RAL-Teile lesbar', false, 'nicht gefunden'); return; }
  var FARBEN = { 'Anthrazit': 0x383b3d, 'Reinweiß': 0xf1f1ec };
  var Z = { farbe: 'Andere / Beratung', ralCode: '' };
  /* In strict mode legt eval() nichts in diesen Gueltigkeitsbereich -
     deshalb als Ausdruck auswerten und zuweisen. */
  var RAL = eval('(' + tab.replace(/^var RAL = /, '').replace(/;\s*$/, '') + ')');
  var ralNummer = eval('(' + fn + ')');
  var gestellFarbe = eval('(' + gf + ')');
  var falsch = 0, meld = [];
  ['7016', 'RAL 7016', 'ral7016', ' 7016 '].forEach(function (eingabe) {
    Z.ralCode = eingabe;
    /* RAL haelt jetzt [Farbwert, Name] - der Farbwert steht an [0]. */
    if (gestellFarbe() !== RAL['7016'][0]) { falsch++; meld.push('„' + eingabe + '" nicht erkannt'); }
  });
  Z.ralCode = '1234';                       // gibt es nicht
  if (gestellFarbe() !== FARBEN['Anthrazit']) { falsch++; meld.push('unbekannte Nummer wird geraten'); }
  Z.farbe = 'Reinweiß'; Z.ralCode = '7016';
  if (gestellFarbe() !== FARBEN['Reinweiß']) { falsch++; meld.push('RAL schlaegt die gewaehlte Farbe'); }
  if (gegen) falsch = falsch ? 0 : 1;
  pruefe('RAL-Eingabe wird richtig umgesetzt', falsch === 0,
         falsch === 0 ? Object.keys(RAL).length + ' Toene hinterlegt' : meld.join('; '));
})();

/* ---------- Glas im Keil ----------
   „die glasschiebetueren gibts ja in satinato, hab vergessen das glas
   bei den keilen auch" (Betreiber, 11.10.2026). */
pruefe('Keilglas ist waehlbar und erscheint nur mit Keil',
       new RegExp(q || 'id="k3dKeilGlas"').test(html) &&
       new RegExp(q || "case 'keil-glas':      return erwIrgendwo\\('Keil'\\)").test(js), '');
pruefe('Keil nimmt sein eigenes Glas',
       new RegExp(q || 'var mKeil = keilGlas\\(\\);').test(js) &&
       (gegen || !/keilNetz\([^)]*mGlas\)/.test(js)),
       'nicht mehr das Standardglas');
pruefe('Satinato steht an EINER Stelle',
       new RegExp(q || 'function satiniert\\(m\\)').test(js) &&
       (js.match(/m\.opacity = 0\.62;/g) || []).length === (gegen ? 2 : 1),
       'Schiebeelement und Keil teilen die Rechnung');
pruefe('Keilglas geht in die Anfrage',
       new RegExp(q || "teile\\.push\\('Glas im Keil: ' \\+ Z\\.keilGlas\\)").test(js),
       'satinato ist eine andere Scheibe, nicht nur eine Ansicht');
(function () {
  /* Zweiter Weg: die echte Funktion laufen lassen - klar bleibt klar,
     satinato wird matt, und die Wahl der Schiebeelemente faerbt NICHT
     auf den Keil ab. */
  var fn = (js.match(/function keilGlas\(\)[\s\S]*?\n  \}/) || [''])[0];
  var sat = (js.match(/function satiniert\(m\)[\s\S]*?\n  \}/) || [''])[0];
  if (!fn || !sat) { pruefe('Keilglas lesbar', false, 'nicht gefunden'); return; }
  var Z = { keilGlas: 'ESG klar', sg23Glas: 'ESG 10 mm satinato' };
  function rgb(x) { return x; }
  function seitenglas() { return { opacity: 0.3, roughness: 0.04 }; }
  var satiniert = eval('(' + sat + ')');
  var keilGlas = eval('(' + fn + ')');
  var falsch = 0, meld = [];
  if (keilGlas().opacity !== 0.3) { falsch++; meld.push('klar ist nicht klar'); }
  Z.keilGlas = 'ESG satinato';
  if (keilGlas().opacity !== 0.62) { falsch++; meld.push('satinato wirkt nicht'); }
  Z.keilGlas = 'ESG klar'; Z.sg23Glas = 'ESG 10 mm satinato';
  if (keilGlas().opacity !== 0.3) { falsch++; meld.push('Schiebewahl faerbt auf den Keil ab'); }
  if (gegen) falsch = falsch ? 0 : 1;
  pruefe('Keilglas rechnet unabhaengig', falsch === 0,
         falsch === 0 ? 'drei Faelle' : meld.join('; '));
})();

(function () {
  /* „das mit den ralfarben von eben klappt noch nicht" (Betreiber,
     11.10.2026): Der Klick auf ein Farbfeld rief nur bauen() und
     textAktualisieren(). Welche Bedienfelder sichtbar sind, entscheidet
     aber panelAnpassen() - und das steckt in aendern(). Das Feld fuer
     den RAL-Ton erschien deshalb nie.

     Geprueft wird die Kette: Klick -> aendern -> panelAnpassen. */
  /* Der Klick-Behandler, nicht die gleichnamige Schleife in
     panelAnpassen: gesucht wird der Block um farbeSetzen(...). */
  var i = js.indexOf("farbeSetzen(b.getAttribute('data-k3d-farbe'))");
  var klick = i > -1 ? js.slice(i, i + 900) : '';
  var ruftAendern = /aendern\(\);/.test(klick);
  var alteKette = /bauen\(\);\s*\n\s*textAktualisieren\(\);/.test(klick);
  var panelInAendern = /function aendern\(\)[\s\S]*?panelAnpassen\(\);/.test(js);
  if (gegen) { ruftAendern = alteKette; }
  var falsch = 0, meld = [];
  if (!ruftAendern) { falsch++; meld.push('Klick ruft aendern() nicht'); }
  if (alteKette && !gegen) { falsch++; meld.push('alte Kette steht noch da'); }
  if (!panelInAendern) { falsch++; meld.push('panelAnpassen nicht in aendern'); }
  pruefe('Farbklick stellt auch das Bedienfeld nach', falsch === 0,
         falsch === 0 ? 'Klick → aendern → panelAnpassen' : meld.join('; '));
})();

(function () {
  /* „bitte neben den button ,Andere / Beratung' nicht dadrunter"
     (Betreiber, 11.10.2026): Das Eingabefeld steht als eigene Zelle IM
     Farbraster, direkt hinter dem Knopf. */
  var raster = (html.match(/<div class="k3d-farben"[\s\S]*?<\/div>\s*\n/) || [''])[0];
  var drin = /id="k3dRalCode"/.test(raster);
  var hinterKnopf = raster.indexOf('data-k3d-farbe="Andere / Beratung"') <
                    raster.indexOf('id="k3dRalCode"');
  if (gegen) drin = !drin;
  pruefe('RAL-Feld steht neben dem Knopf', drin && (gegen || hinterKnopf),
         drin ? 'im Farbraster, hinter „Andere / Beratung"' : 'steht darunter');
})();
pruefe('Unbekannter Ton faellt auf',
       new RegExp(q || "classList\\.toggle\\('ist-warnung', warnt\\)").test(js) &&
       new RegExp(q || 'k3d-mini\\.ist-warnung').test(html),
       'sonst wirkt die Eingabe wirkungslos');

(function () {
  /* „wenn man ein code eingetragen hat und der erkannt wurde sollte
     daneben auftauchen wie er heisst z.b bei 9005 Tiefschwarz"
     (Betreiber, 11.10.2026). Der Name ist die Kontrolle: Eine vertippte
     Ziffer faellt am Namen auf, am Farbfleck nicht. */
  var tab = (js.match(/var RAL = \{[\s\S]*?\n  \};/) || [''])[0];
  var RAL = eval('(' + tab.replace(/^\s*var RAL = /, '').replace(/;\s*$/, '') + ')');
  var ohneNamen = Object.keys(RAL).filter(function (k) {
    return !Array.isArray(RAL[k]) || typeof RAL[k][1] !== 'string' || !RAL[k][1];
  });
  if (gegen) ohneNamen.push('kuenstlich');
  pruefe('Jeder hinterlegte Ton hat einen Namen', !ohneNamen.length,
         ohneNamen.length ? 'ohne Namen: ' + ohneNamen.join(', ')
                          : Object.keys(RAL).length + ' Toene');
  var probe = RAL['9005'];
  pruefe('9005 heisst Tiefschwarz',
         gegen ? !(probe && probe[1] === 'Tiefschwarz')
               : !!(probe && probe[1] === 'Tiefschwarz'),
         probe ? probe[1] : 'fehlt');
  pruefe('Name steht im Bedienfeld und in der Anfrage',
         new RegExp(q || 'id="k3dRalName"').test(html) &&
         new RegExp(q || "nameEl\\.textContent = \\(n && RAL\\[n\\]\\) \\? RAL\\[n\\]\\[1\\] : ''").test(js) &&
         new RegExp(q || "RAL\\[n\\] \\? ' ' \\+ RAL\\[n\\]\\[1\\] : ''").test(js), '');
})();

(function () {
  /* „es sollte erst angezeigt werden wenn man andere ausgewaehlt hat
     nicht immer" (Betreiber, 11.10.2026): Eine eigene display-Angabe
     schlaegt das Attribut hidden - dann steht das Feld immer da. Wer
     display setzt, MUSS die [hidden]-Regel mitliefern.

     Geprueft wird das fuer jede Bedieneinheit mit eigener
     display-Angabe, nicht nur fuer die RAL-Zelle. */
  /* Der erste <style>-Block ist nur der Vorab-Stil; gesucht wird im
     ganzen Dokument. */
  var stil = html;
  var regeln = stil.match(/\.[a-z0-9-]*k3d-[a-z0-9-]*\s*\{[^}]*display:\s*(flex|grid|block|inline-flex)[^}]*\}/g) || [];
  var fehlt = [];
  regeln.forEach(function (r) {
    var name = (r.match(/^\.([a-z0-9-]+)/) || [])[1];
    if (!name) return;
    /* Nur Bedieneinheiten, die ueber hidden gesteuert werden. */
    /* \shidden, nicht einfach hidden: sonst zaehlt aria-hidden mit. */
    if (!new RegExp('class="[^"]*' + name + '[^"]*"[^>]*\\shidden[\\s>=]').test(html) &&
        !new RegExp('class="[^"]*' + name + '[^"]*"[^>]*data-k3d-fuer').test(html)) return;
    if (!new RegExp('\\.' + name + '\\[hidden\\]\\s*\\{[^}]*display:\\s*none').test(stil)) {
      fehlt.push(name);
    }
  });
  if (gegen) fehlt.push('kuenstlich');
  pruefe('Jede versteckbare Einheit hat ihre [hidden]-Regel', !fehlt.length,
         fehlt.length ? 'fehlt bei: ' + fehlt.join(', ') : regeln.length + ' Regeln geprueft');
})();
/* ---------- Dach als Schaltflaeche fuer die Beschattung ----------
   „nur das dach also sparren oder glas anklicken damit die animation
   öffnen / schließen stattfindet" (Betreiber, 11.10.2026). Bei
   eingefahrener Beschattung ist das Tuch wenige Zentimeter breit – am
   Handy nicht zu treffen. Geprueft wird deshalb dreierlei: dass die
   Dachteile gekennzeichnet sind, dass der Klick sie annimmt, und dass
   Velaris und Schiebeanlage NICHT verlieren (nur das vorderste Teil
   zaehlt – steht ein Element vor dem Dach, gehoert ihm der Klick). */
(function () {
  var treffer = (js.match(/dachTeil\(/g) || []).length;
  /* Sparren (2 Wege), Abdeckleiste, Seitenglasleiste, Eindeckung ganz
     und geteilt, SkyView-Sparren – plus die zwei Definitionszeilen. */
  pruefe('Dachteile sind gekennzeichnet', gegen ? treffer < 8 : treffer >= 8,
         treffer + ' Stellen mit dachTeil()');
})();
pruefe('Klick auf das Dach fährt die Beschattung',
       new RegExp(q || 'istMarkise\\(treffer\\[i\\]\\.object\\) \\|\\| istDach\\(treffer\\[i\\]\\.object\\)').test(js) &&
       new RegExp(q || 'function istDach').test(js), '');
(function () {
  /* Zweiter Weg: die echten Funktionen laufen lassen, statt nur den
     Text zu lesen. Ein Teil tief in einer Gruppe muss als Dach gelten,
     ein fremdes Teil nicht. */
  var dachTeil = eval('(' + (js.match(/function dachTeil\(m\)[^\n]*\n/) || [''])[0]
    .replace(/^\s*function/, 'function') + ')');
  var istDach = eval('(' + (js.split('function istDach(')[1] || '')
    .split('\n  }')[0].replace(/^/, 'function istDach(') + '\n})');
  var tief = { userData: {} };
  var gruppe = dachTeil({ userData: {} });
  tief.parent = gruppe;
  var fremd = { userData: {} };
  var ok = istDach(gruppe) === true && istDach(tief) === true &&
           istDach(fremd) === false;
  pruefe('istDach findet das Dach auch in einer Gruppe', gegen ? !ok : ok, '');
})();
(function () {
  var klick = (js.split('function markiseGeklickt(')[1] || '').split('\n  }')[0];
  var ok = /break;/.test(klick);
  pruefe('Nur das vorderste Teil zählt – Velaris/Schiebe behalten ihren Klick',
         gegen ? !ok : ok, '');
})();
pruefe('Der Hinweis nennt das Dach, nicht die Markise',
       new RegExp(q || 'direkt im Bild auf das Dach').test(html) &&
       !/Sie können die Markise auch direkt im Bild/.test(html), '');
/* ---------- Wasserzeichen auf dem Boden ----------
   „auf dem terassenboden indirekt aber trz gut sichtbar unser
   BV AussenSysteme Logo mit copyright symbol" (Betreiber, 11.10.2026).
   Es liegt IN der Szene, damit es auf jedem Bildschirmfoto und in jedem
   Download mit drauf ist. */
(function () {
  /* „das logo bitte einiges sichtbarer und größer", dann „15%
     sichtbarer" (Betreiber, 11.10.2026). Gelesen als 15 Prozentpunkte
     mehr als die ersten 28 %. Die Zahlen stehen an EINER Stelle; hier
     wird nachgesehen, dass sie nicht versehentlich zurueckfallen. */
  var blk = (js.match(/var WZ = \{[^}]*\}/) || [''])[0];
  function w(name) {
    var t = blk.match(new RegExp(name + ':\\s*([\\d.]+)'));
    return t ? parseFloat(t[1]) : null;
  }
  var d = w('deckkraft'), a = w('anteil'), h = w('hoechstens');
  var ok = d !== null && Math.abs(d - 0.43) < 0.001 && a >= 0.6 && h >= 400;
  pruefe('Wasserzeichen ist deutlich sichtbar', gegen ? !ok : ok,
         'Deckkraft ' + (d === null ? '?' : Math.round(d * 100) + ' %') +
         ', Breite ' + a + ' der Anlage, hoechstens ' + h + ' cm');
})();
pruefe('Wasserzeichen liegt flach auf dem Boden',
       new RegExp(q || 'wasserzeichen\\.rotation\\.x = -Math\\.PI / 2').test(js) &&
       new RegExp(q || 'wasserzeichen\\.position\\.set\\(0, 0\\.4').test(js) &&
       new RegExp(q || 'depthWrite: false').test(js), '');
pruefe('Wasserzeichen wird bei jeder Stimmung neu gesetzt',
       new RegExp(q || 'wasserzeichenSetzen\\(\\);').test(js) &&
       /function stimmung\(\)[\s\S]*?wasserzeichenSetzen\(\);/.test(js), '');
(function () {
  /* „bei tag logo hell bei abend logo dunkel" (Betreiber). Zweiter Weg:
     die Zuordnung aus dem Code holen und mit beiden Werten ausrechnen,
     statt den Dateinamen nur zu lesen. */
  var blk = (js.split('function wasserzeichenTextur(')[1] || '').split('\n  }')[0];
  var f = (blk.match(/var schl = ([^;]+);/) || [])[1];
  if (gegen) f = "abend ? 'hell' : 'dunkel'";
  var abend = false, tag = f ? eval(f) : null;
  abend = true;
  var nacht = f ? eval(f) : null;
  pruefe('Tag helles Logo, Abend dunkles', tag === 'hell' && nacht === 'dunkel',
         'Tag ' + tag + ', Abend ' + nacht);
})();
(function () {
  /* Betrieb: Fehlt die Datei, zeichnet der Konfigurator nur die
     Textzeile – das faellt niemandem auf. Deshalb hier nachsehen. */
  var fehlt = ['hell', 'dunkel'].filter(function (k) {
    return !fs.existsSync('images/logo-' + k + (gegen ? '-gibtsnicht' : '') + '.png');
  });
  pruefe('Beide Logodateien sind da', !fehlt.length,
         fehlt.length ? 'fehlt: ' + fehlt.join(', ') : 'logo-hell, logo-dunkel');
})();
(function () {
  /* RECHT: Das ©-Zeichen darf an eigene Werke. Ein ® steht NUR einer
     eingetragenen Marke zu – ohne Eintrag ist es irrefuehrend und
     abmahnfaehig (§ 5 UWG). Solange der Eintrag nicht belegt ist, darf
     im Konfigurator kein ® auftauchen. */
  /* Gesucht wird in dem, was ANGEZEIGT wird: Zeichenketten im Code und
     der HTML-Text. Die Begruendung im Quelltext nennt das ® selbst –
     sie darf die Pruefung nicht ausloesen. */
  var sichtbar = (js.match(/'[^'\n]*'|"[^"\n]*"/g) || []).join('\n');
  var hat = /®/.test(sichtbar) || /®/.test(html) || gegen;
  pruefe('Kein ® ohne belegte Markeneintragung', !hat,
         hat ? 'irgendwo steht ein ®' : 'nur ©');
  pruefe('Das © steht am Wasserzeichen',
         new RegExp(q || "'© ' \\+ new Date\\(\\)\\.getFullYear\\(\\)").test(js),
         'mit laufendem Jahr');
})();
/* ---------- Zwei Wege zur Dachneigung ----------
   „hier darunter soll man noch die grad der neigung einstellen koennen,
   Moeglichkeit 1: man gibt die grad zahl ein und es wird geguckt wie die
   hoehe an der wand ausfaellt, Moeglichkeit 2: man kann die wandprofil
   unterkante hoehe angeben und es wird daraus die grad zahl berechnet"
   (Betreiber, 11.10.2026, mit Bildschirmfoto).

   Beide Wege waren gebaut – aber unsichtbar: Die Gruppe hing an
   datenSystem(), also an der Antwort von /api/bauteile, und die kommt
   nicht (503). */
pruefe('Neigung haengt nicht mehr an der Serverantwort',
       new RegExp(q || 'function neigungMoeglich').test(js) &&
       new RegExp(q || "case 'neigung':        return neigungMoeglich\\(\\)").test(js) &&
       !/case 'neigung':\s*return !!d/.test(js), 'ohne /api/bauteile sichtbar');
/* Die Beschriftungen folgen dem Bestellformular des Herstellers:
   „Moechten Sie die Dachneigung oder die Unterkante Rinne und die
   Unterkante Wandprofil angeben?" – damit beim Uebertragen in die
   Bestellung nichts verwechselt wird. */
pruefe('Beschriftung wie im Bestellformular',
       new RegExp(q || 'Unterkante Rinne').test(html) &&
       new RegExp(q || 'Unterkante Wandprofil').test(html) &&
       new RegExp(q || 'Mindestgefälle 2–3°').test(html), '');
/* Weg 1 (Grad) und Weg 2 (Unterkanten) sind gleichwertige Arten, dasselbe
   anzugeben – sie duerfen nie auf zwei Ebenen landen. Frueher hiess das:
   Weg 2 nicht unter „Mehr Einstellungen". Seit Basic/Pro (24.10.2026)
   heisst es zusaetzlich: beide tragen data-k3d-pro oder keiner. Sonst
   stuende in Basic die hintere Hoehe ohne die Neigung daneben. */
(function () {
  var wege = (html.match(/<div class="k3d-gruppe[^>]*data-k3d-fuer="(neigung|hoehe-hinten)"[^>]*>/g) || []);
  var proNeig = wege.some(function (t) { return /"neigung"/.test(t) && /data-k3d-pro/.test(t); });
  var proHint = wege.some(function (t) { return /"hoehe-hinten"/.test(t) && /data-k3d-pro/.test(t); });
  pruefe('Weg 2 steht neben Weg 1, nicht unter „Mehr Einstellungen“',
         wege.length === 2 &&
         new RegExp(q || 'data-k3d-schritt="masse"[^>]*data-k3d-fuer="hoehe-hinten"').test(html) &&
         !/data-k3d-mehr[^>]*data-k3d-fuer="hoehe-hinten"/.test(html) &&
         proNeig === proHint,
         'beide auf derselben Ebene (Pro: ' + proNeig + '/' + proHint + ')');
})();
(function () {
  /* Zweiter Weg: die beiden Rechnungen gegeneinander laufen lassen. Aus
     Grad die Unterkante des Wandprofils, daraus zurueck die Grad - es
     muss wieder dasselbe herauskommen. Beide Funktionen stammen aus dem
     Code, samt der Kette aus Rinnen-, Sparren- und Profilmassen. */
  var teile = ['neigungProzent', 'wandUkBasis', 'wandUkSpanne', 'wandUkAus',
               'gradAusWandUk'];
  var fehlt = teile.filter(function (n) {
    return !new RegExp('function ' + n + '\\(').test(js);
  });
  if (fehlt.length) { pruefe('Neigungsrechnungen lesbar', false, fehlt.join(',')); return; }
  var Z = { glasstaerke: 8 }, istPolycarbonat = function () { return false; };
  var NEIGUNG_PROZENT = eval('(' +
    (js.match(/var NEIGUNG_PROZENT = (\{[\s\S]*?\});/) || [])[1] + ')');
  var RINNE = eval('(' + (js.match(/var RINNE = (\{[\s\S]*?\n  \});/) || [])[1] + ')');
  var WANDPROFIL = eval('(' +
    (js.match(/var WANDPROFIL = (\{[^}]*\});/) || [])[1] + ')');
  function hol(n) {
    var f = (js.match(new RegExp('function ' + n + '\\([\\s\\S]*?\\n  \\}')) || [''])[0];
    return eval('(' + f.replace('function ' + n, 'function') + ')');
  }
  var neigungProzent = hol('neigungProzent');
  var wandUkBasis = hol('wandUkBasis');
  var wandUkSpanne = hol('wandUkSpanne');
  var wandUkAus = hol('wandUkAus');
  var gradAusWandUk = hol('gradAusWandUk');
  var schlimmste = 0, faelle = 0;
  [2500, 3500, 5000, 7050].forEach(function (T) {
    [2, 5, 8, 11, 14].forEach(function (grad) {
      Z.tiefe = T; Z.hoehe = 2300;
      var mm = wandUkAus(grad);
      var zurueck = gradAusWandUk(mm) + (gegen ? 1.5 : 0);
      var ab = Math.abs(zurueck - grad);
      if (ab > schlimmste) schlimmste = ab;
      faelle++;
    });
  });
  pruefe('Beide Wege kommen auf dieselbe Neigung', schlimmste <= 0.1,
         faelle + ' Faelle, groesste Abweichung ' + schlimmste.toFixed(2) + '°');

  /* ---------- Jeder Millimeter muss eingebbar sein ----------
     „das übernimmt nicht mein maß habe 2600 eingegeben es macht daraus
     2602" (Betreiber, 12.10.2026, mit Bild). Ursache: Der Schieberegler
     hatte step="50", seine Untergrenze ist aber wandUkAus(2) und damit
     krumm. Der Browser rastet auf min + n * step – also auf 2402, 2452,
     2502, 2552, 2602. Die 2600 gab es in diesem Raster gar nicht.

     Geprueft wird deshalb GERECHNET, nicht nur die Zahl im HTML gelesen:
     Laesst sich mit diesem min und diesem step ein glatter Wert treffen? */
  (function () {
    var regler = (html.match(/<input[^>]*id="k3dHoeheHinten"[^>]*>/) || [''])[0];
    var step = parseInt((regler.match(/step="(\d+)"/) || [0, 0])[1], 10);
    if (gegen) step = 50;
    Z.hoehe = 2300; Z.tiefe = 3000;
    var min = wandUkAus(2);
    /* Alle glatten Hunderter im zulaessigen Bereich muessen erreichbar sein. */
    var max = wandUkAus(14), unerreichbar = [], w;
    for (w = Math.ceil(min / 100) * 100; w <= max; w += 100) {
      if ((w - min) % step !== 0) unerreichbar.push(w);
    }
    pruefe('Jeder glatte Millimeterwert ist einstellbar', unerreichbar.length === 0,
           'step=' + step + ', min=' + min + (unerreichbar.length
             ? ', nicht erreichbar: ' + unerreichbar.slice(0, 3).join(', ') + ' …'
             : ', alle Hunderter erreichbar'));
  })();

  /* ---------- Angezeigt werden ganze Grad ----------
     „kene neigung wie 5,7 oderso angeben runde es nach den richtigen
     regeln auf oder ab" (Betreiber). Gerechnet wird weiter genau – nur
     die Anzeige rundet, sonst zeichnete das Modell eine andere Hoehe
     hinten als die eingegebene. */
  (function () {
    var f = (js.match(/function neigungAnzeige\(\)[\s\S]*?\n  \}/) || [''])[0];
    if (!f) { pruefe('Neigungsanzeige lesbar', false, 'nicht gefunden'); return; }
    var hoehenGetrennt = function () { return true; };
    /* neigungAnzeige() stuetzt sich auf neigungGrad() – also beide aus dem
       Code holen, statt die Rundung hier nachzubauen. Nicht ueber hol():
       das wertet im aeusseren Scope aus, wo das hoehenGetrennt() von hier
       nicht sichtbar waere. */
    var qg = (js.match(/function neigungGrad\([\s\S]*?\n  \}/) || [''])[0];
    var neigungGrad = eval('(' + qg.replace('function neigungGrad', 'function') + ')');
    var neigungAnzeige = eval('(' + f.replace('function neigungAnzeige', 'function') + ')');
    Z.hoehe = 2300; Z.tiefe = 3000;
    var krumm = [], treffer = [];
    [2400, 2500, 2600, 2700, 2800, 2900].forEach(function (mm) {
      Z.hoeheGetrennt = true; Z.hoeheHinten = mm;
      var a = neigungAnzeige() + (gegen ? 0.5 : 0);
      treffer.push(mm + '->' + a + '°');
      if (a !== Math.round(a)) krumm.push(mm);
    });
    pruefe('Angezeigte Neigung ist eine ganze Zahl', krumm.length === 0,
           krumm.length ? 'krumm bei ' + krumm.join(', ') : treffer.slice(0, 3).join('  '));
    /* Kaufmaennisch, nicht immer abwaerts: 5,7° muss 6° werden. */
    Z.hoeheGetrennt = true; Z.hoeheHinten = 2600;
    var sechs = neigungAnzeige() + (gegen ? 1 : 0);
    pruefe('Wird auf- und abgerundet, nicht abgeschnitten', sechs === 6,
           '2600 mm ergibt genau 5,7° und wird als ' + sechs + '° angezeigt');
  })();

  /* Beleg aus der Montageanleitung (Seite „Standarddachneigung"), woertlich:
     „Nehmen Sie die gewuenschte Hoehe an der Innenseite, zum Beispiel
     200 cm. Die Ueberdachung hat einen festen Gefaellewinkel von 14%.
     ... Wenn der Ausfall 3 m betraegt, dann liegt die Unterkante des
     Wandanschlussprofils 3 x 14 cm hoeher als die Unterkante der Rinne.
     In diesem Beispiel wuerde das Wandanschlussprofil also in einer Hoehe
     von 242 cm angebracht."
     Also: ueber die volle Bestelltiefe, ohne Abzug fuer Rinne oder
     Profile. Genau das muss unsere Rechnung treffen. */
  Z.hoehe = 2000; Z.tiefe = 3000;
  var beispiel = wandUkAus(8) + (gegen ? 30 : 0);
  pruefe('Rechenbeispiel der Montageanleitung trifft zu (200 cm, 3 m, 8°)',
         beispiel === 2420, 'ergibt ' + beispiel + ' mm, Anleitung sagt 2420 mm');

  /* Die Masskette im selben Bild: 14 / 28 / 42 / 56 cm bei 1 bis 4 m. */
  var kette = [[1000, 2140], [2000, 2280], [3000, 2420], [4000, 2560]];
  var trifft = kette.every(function (f) {
    Z.tiefe = f[0];
    return wandUkAus(8) + (gegen ? 30 : 0) === f[1];
  });
  pruefe('Masskette des Bildes trifft zu (14 cm je Meter)', trifft,
         '1 bis 4 m gegen 214 / 228 / 242 / 256 cm');

  /* Beleg aus dem Bestellformular (Betreiber, 12.10.2026): 5000 breit,
     3000 tief, Unterkante Rinne 2200, Unterkante Wandprofil 2500 ergibt
     laut Hersteller 6°. Das Formular zeigt ganze Grad, darum wird hier
     gerundet verglichen. */
  Z.hoehe = 2200; Z.tiefe = 3000;
  var ref = Math.round(gradAusWandUk(2500)) + (gegen ? 2 : 0);
  pruefe('Referenzfall des Bestellformulars trifft zu', ref === 6,
         'ergibt ' + ref + '°, Hersteller sagt 6°');

  /* Ehrlich festhalten, was dabei auseinanderlaeuft: Das Bedienfeld zeigt
     die Bestellzahl des Herstellers, das Modell zeichnet mit seinen
     eigenen (teils geschaetzten) Profilmassen. Der Abstand darf klein
     bleiben - waechst er, stimmt ein Profilmass nicht mehr. */
  Z.tiefe = 3500; Z.hoehe = 2300;
  var spH = parseFloat((js.match(/var SPARREN = \{\s*\n\s*breite:\s*[\d.]+,[^]*?hoehe:\s*([\d.]+)/) || [])[1]);
  var tan = Math.tan(8 * Math.PI / 180);
  var ukVorn = Z.hoehe / 10 + (RINNE.hoehe - RINNE.sparrenUnterNase - spH);
  var ukHinten = ukVorn + tan * (Z.tiefe / 10 - RINNE.breite - WANDPROFIL.tiefe);
  var modell = Math.round((ukHinten + spH + 0.8 - WANDPROFIL.hoehe) * 10);
  var ab = Math.abs(wandUkAus(8) - modell) + (gegen ? 200 : 0);
  pruefe('Modell bleibt nah an der Bestellzahl', ab <= 80,
         'Bedienfeld ' + wandUkAus(8) + ' mm, Modell ' + modell
         + ' mm, Abstand ' + ab + ' mm');
})();
(function () {
  /* Die Reglergrenzen muessen die zulaessigen 2 bis 14 Grad hergeben -
     sonst kappt der Regler eine Hoehe, die das Dach trotzdem haette.
     Gerechnet mit denselben Funktionen wie oben. */
  var f = (js.match(/function hoeheHintenGrenzen\([\s\S]*?\n  \}/) || [''])[0];
  if (!f) { pruefe('Reglergrenzen lesbar', false, 'nicht gefunden'); return; }
  var Z = { hoehe: 2300, tiefe: 7050, hoeheHinten: 2500, glasstaerke: 8 };
  var istPolycarbonat = function () { return false; };
  var NEIGUNG_PROZENT = eval('(' +
    (js.match(/var NEIGUNG_PROZENT = (\{[\s\S]*?\});/) || [])[1] + ')');
  var RINNE = eval('(' + (js.match(/var RINNE = (\{[\s\S]*?\n  \});/) || [])[1] + ')');
  var WANDPROFIL = eval('(' + (js.match(/var WANDPROFIL = (\{[^}]*\});/) || [])[1] + ')');
  function hol(n) {
    var q2 = (js.match(new RegExp('function ' + n + '\\([\\s\\S]*?\\n  \\}')) || [''])[0];
    return eval('(' + q2.replace('function ' + n, 'function') + ')');
  }
  var neigungProzent = hol('neigungProzent');
  var wandUkBasis = hol('wandUkBasis');
  var wandUkSpanne = hol('wandUkSpanne');
  var wandUkAus = hol('wandUkAus');
  var document = { getElementById: function () { return null; } };
  var g = eval('(' + f.replace('function hoeheHintenGrenzen()', 'function ()') + ')')();
  var soll = wandUkAus(14) + (gegen ? 300 : 0);
  pruefe('Regler reicht bis 14 Grad bei 7 m Tiefe', g.max === soll,
         g.min + ' bis ' + g.max + ' mm (erwartet bis ' + soll + ')');
})();
/* SkyView hat ein festes Gefaelle. „bei skyview sind es immer 2 grad man
   kann keine unterkante rinne und unterkante wandprofil eingeben"
   (Betreiber, 12.10.2026). Beides muss zusammen stimmen: Das Modell neigt
   die Sparren fest um 2°, UND die beiden Eingabewege duerfen dort gar
   nicht erst auftauchen - sonst steht in der Anfrage eine Neigung, die
   das System nicht hat. */
pruefe('SkyView neigt nicht nach Z.neigung',
       new RegExp(q || 'var neig = sky\\s*\\n\\s*\\? Math\\.min\\(2 \\* Math\\.PI / 180,').test(js) &&
       (gegen ? true : !/var neig = sky \? neigungGrad/.test(js)),
       'feste 2°, begrenzt durch die Profilmaße');
pruefe('SkyView bietet keine Neigungseingabe',
       new RegExp(q || "return Z\\.produkt === 'Terrassendach TDS' \\|\\| istCarportTds\\(\\)")
         .test(js) &&
       !/neigungMoeglich[\s\S]{0,120}Flachdach SkyView/.test(js),
       'neigungMoeglich deckt nur TDS');
pruefe('SkyView bietet keine Unterkanten-Eingabe',
       new RegExp(q || 'function hoehenGetrennt\\(\\) \\{\\s*\n\\s*return neigungMoeglich\\(\\);')
         .test(js), 'haengt an derselben Regel');

/* ---------- Was in der Anfrage ankommt ----------
   Gefunden am 12.10.2026: Sparrenzahl, Pfostenzahl, Statiktraeger,
   Dachneigung und Hoehe an der Wand hingen allein an stueckliste(), also
   an /api/bauteile. Die antwortet 503, solange DACHMATRIX nicht gebunden
   ist – diese Angaben standen damit in KEINER Anfrage. Das faellt nicht
   auf, weil die Anfrage trotzdem plausibel aussieht. Darum hier festhalten. */
(function () {
  var zus = (js.match(/function anfrageTexte?\(|teile\.push\('Eindeckung: '/) || [])[0];
  var block = js.slice(js.indexOf("if (istCarport()) {\n      teile.push('Ausführung"),
                       js.indexOf("teile.push('Eindeckung: ' + eindeckungFach());",
                                  js.indexOf('var ed = ')) + 200);
  if (!block || block.length < 200) {
    pruefe('Anfragetext lesbar', false, 'Block nicht gefunden'); return;
  }
  /* Abwesenheitspruefung: Die Gegenprobe baut den alten Aufruf wieder
     ein – schlaegt sie dann nicht an, prueft sie nichts. */
  var blockGeprueft = gegen ? block + '\n      var ed = stueckliste();' : block;
  pruefe('Anfrage haengt nicht mehr an /api/bauteile',
         !/stueckliste\(\)/.test(blockGeprueft),
         'Sparren, Pfosten und Traeger kommen aus bauteileJetzt()');
  pruefe('Anfrage nennt Sparren, Pfosten und Traeger',
         new RegExp(q || "' Sparren, ' \\+ pfostenText\\(ed\\)").test(block) &&
         new RegExp(q || "ec\\.traeger \\? ', mit Statikträger'").test(block),
         '');
  /* Die Neigung darf NUR beim Terrassendach TDS dastehen – SkyView hat
     ein festes Gefaelle von 2°, das nicht bestellt wird. */
  pruefe('Neigung steht nur beim Terrassendach TDS in der Anfrage',
         new RegExp(q || "if \\(Z\\.produkt === 'Terrassendach TDS'\\) \\{\\s*\\n\\s*teile\\.push\\('Dachneigung: ")
           .test(block), '');
  /* Alter Fehler: Hier stand neigungProzent(Z.neigung) statt der wirklich
     geltenden Neigung – bei Weg 2 (Unterkante eingegeben) also die falsche
     Zahl in der Bestellung. */
  pruefe('Hoehe an der Wand nimmt die eingegebene Zahl',
         new RegExp(q || "\\? Z\\.hoeheHinten : wandUkAus\\(neigungGrad\\(\\)\\)").test(block) &&
         (gegen ? true : !/neigungProzent\(Z\.neigung\)/.test(block)),
         'nicht aus den gerundeten Grad zurueckgerechnet');
})();
/* Keine zwei Wahrheiten: Hinweis unter den Massen und Anfrage muessen
   dieselbe Pfostenzahl nennen. Beide rechnen in bauteileJetzt(). */
pruefe('Hinweis und Anfrage rechnen an einer Stelle',
       new RegExp(q || 'function bauteileJetzt\\(').test(js) &&
       (js.match(new RegExp(q || 'bauteileJetzt\\(\\)', 'g')) || []).length >= 3 &&
       (js.match(new RegExp(q || 'pfostenText\\(', 'g')) || []).length >= 3,
       'bauteileJetzt() und pfostenText() an beiden Stellen');

/* ---------- Alle Ansichten als PDF (12.10.2026) ----------
   „wenn man auf alle bilder sichern geht sol anstatt ein bild, eine pdf
   erstell werden ... die normalen ansichtsbilder alles im offenen zustnd"
   (Betreiber). Auf Rueckfrage festgelegt: Hauptansichten mit EINGEFAHRENER
   Markise und AUFGESCHOBENEN Schiebeelementen, Zusatzseiten umgekehrt. */
pruefe('Menue bietet das PDF an',
       new RegExp(q || '>PDF erstellen<').test(html) &&
       (gegen ? true : !/Alle fünf in einem Bild/.test(html)), '');
pruefe('PDF-Modul ist eingebunden',
       new RegExp(q || 'js/pdf-blatt\\.js\\?v=').test(html), '');
pruefe('Knopf stellt die alte Beschriftung wieder her',
       new RegExp(q || "b\\.textContent = 'PDF erstellen';").test(js),
       'sonst steht dort fuer immer „Wird erstellt"');
pruefe('Fehlendes Modul meldet sich, statt stumm zu bleiben',
       new RegExp(q || 'if \\(!window\\.BV_PDF\\)').test(js), '');
/* Zustand MUSS ueber die Formularfelder gesetzt werden: aendern() liest
   die Werte aus den Feldern zurueck und wuerde ein direkt gesetztes Z.*
   sofort ueberschreiben. */
pruefe('Zustand wird ueber die Felder gesetzt, nicht ueber Z',
       new RegExp(q || 'function feldSetzen\\(id, wert\\)').test(js) &&
       new RegExp(q || 'function zustandSetzen\\(felder\\)').test(js), '');
pruefe('Hauptansichten: Markise eingefahren, Schiebeelemente offen',
       new RegExp(q || "grund\\.k3dSonneAus = 0").test(js) &&
       new RegExp(q || "grund\\.k3dGlasOffen = 100").test(js), '');
pruefe('Zusatzseite: Markise ausgefahren',
       new RegExp(q || "felder: \\{ k3dSonneAus: 100 \\}").test(js), '');
pruefe('Zusatzseite: Schiebeelemente geschlossen',
       new RegExp(q || "felder: \\{ k3dGlasOffen: 0 \\}").test(js), '');
pruefe('Zusatzseite: Lamellen geschlossen',
       new RegExp(q || "felder: \\{ k3dLamellen: 0 \\}").test(js), '');
/* Wer ein PDF speichert, will danach nicht woanders stehen als vorher –
   das galt schon fuer das einzelne Bild. */
pruefe('Ansicht und Zustand werden zurueckgesetzt',
       new RegExp(q || 'zustandSetzen\\(altGrund\\)').test(js) &&
       new RegExp(q || 'Z\\.offenLinks = vorherOffen\\.links').test(js) &&
       new RegExp(q || 'if \\(vorherAnsicht\\) ansichtAnwenden\\(vorherAnsicht\\)').test(js),
       'auch die Oeffnungsgrade je Seite');
pruefe('Leinwand wird fuer den Druck vergroessert und zurueckgestellt',
       new RegExp(q || 'renderer\\.setSize\\(PDF_BREIT').test(js) &&
       new RegExp(q || 'renderer\\.setPixelRatio\\(altR\\)').test(js) &&
       new RegExp(q || 'renderer\\.setSize\\(altB, altH, false\\)').test(js), '');
(function () {
  /* „die seite Ihre Konfiguration also die zusammenfassung soll das letzte
     blatt sein" (Betreiber, 12.10.2026). Geprueft wird die REIHENFOLGE im
     Code, nicht nur das Vorkommen: Die Seite muss NACH der Schleife ueber
     die Zustandsseiten angehaengt werden, sonst rutscht sie wieder in die
     Mitte, sobald eine Anlage bewegliche Teile hat. */
  var fn = (js.match(/function pdfSeiten\([\s\S]*?\n  \}/) || [''])[0];
  var zu = fn.indexOf('zustandsSeiten().forEach');
  var ko = fn.indexOf("titel: 'Ihre Konfiguration'");
  var ok = zu > -1 && ko > zu;
  pruefe('Die Konfiguration ist das letzte Blatt', gegen ? !ok : ok,
         ok ? 'nach den Zustandsseiten' : 'steht vor den Zustandsseiten');
})();
pruefe('Die Konfigurationsseite kommt aus derselben Liste wie die Anfrage',
       new RegExp(q || 'var zus = zusammenfassung\\(\\);').test(js) &&
       new RegExp(q || 'gruppen: pdfGruppen\\(zus\\)').test(js),
       'keine zweite Quelle');
(function () {
  /* ---------- Es darf keine Angabe verschwinden ----------
     Die PDF-Seite sortiert die Zeilen aus zusammenfassung() nach Themen.
     Das ist der gefaehrliche Teil: Kommt spaeter eine neue Zeile dazu,
     die auf kein Muster passt, faellt sie still aus dem Blatt – der Kunde
     bekaeme ein Angebot ohne seine Schiebetuer.

     Darum wird hier gerechnet, nicht gelesen: pdfGruppen() aus dem Code
     holen, eine Liste durchschicken und zaehlen, ob jede Zeile genau
     einmal wieder herauskommt. Die Auffanggruppe „Weitere Angaben" ist
     dabei ausdruecklich erlaubt – sie ist der Grund, dass nichts
     verlorengeht. */
  var fg = (js.match(/function pdfGruppen\([\s\S]*?\n  \}/) || [''])[0];
  var tab = (js.match(/var PDF_GRUPPEN = (\[[\s\S]*?\n  \]);/) || [])[1];
  if (!fg || !tab) { pruefe('Gruppierung lesbar', false, 'nicht gefunden'); return; }
  var PDF_GRUPPEN = eval('(' + tab + ')');
  /* pdfGruppen() filtert die Kopfzeilen ueber dieses Muster – also auch
     aus dem Code holen, nicht hier nachbauen. */
  var PDF_IM_KOPF = eval((js.match(/var PDF_IM_KOPF = (\/.*\/);/) || [])[1]);
  /* pdfGruppen() schickt jede Zeile durch ohneLieferant() – also auch das
     aus dem Code holen, damit hier dieselbe Filterung laeuft wie spaeter
     im Browser. */
  var fo = (js.match(/function ohneLieferant\([\s\S]*?\n  \}/) || [''])[0];
  var ohneLieferant = eval('(' + fo.replace('function ohneLieferant', 'function') + ')');
  var fv = (js.match(/function ohneVorbehalt\([\s\S]*?\n  \}/) || [''])[0];
  var ohneVorbehalt = eval('(' + fv.replace('function ohneVorbehalt', 'function') + ')');
  /* Seit 15.10.2026 entscheidet nicht mehr ein einzelnes Muster, was nur
     den Betrieb angeht, sondern die Liste NUR_INTERN samt nurIntern().
     Beide werden mit ausgelesen – nachgebaut waere es eine zweite Wahrheit. */
  var internSrc = (js.match(/var NUR_INTERN = \[[\s\S]*?\n  \}/) || [''])[0];
  var nurIntern = eval('(function () { ' + internSrc + '; return nurIntern; })')();
  var pdfGruppen = eval('(' + fg.replace('function pdfGruppen', 'function') + ')');
  var liste = [
    'Terrassendach TDS', 'Wandmontage',
    '5000 × 3500 mm, Durchgangshöhe 2200 mm',
    '8 Sparren, 3 Pfosten je Reihe',
    'Gerechnet mit der nächsten lieferbaren Breite: 5080 mm',
    'Dachneigung: 7° (12,3 %)', 'Höhe an der Wand (UK Wandprofil): 2600 mm',
    'Eindeckung: VSG 8 mm klar', 'Farbe: Anthrazit',
    'Seitenelemente – links: Keil + Schiebetür · rechts: Keil',
    'Glas im Keil: ESG klar',
    'Schiebetür im Bild geöffnet: links 100 %, rechts 100 %',
    'Schiebeanlage links: 3390 mm licht – SG23, 3-rails, 3-türig',
    'SG23 Griffhöhe: 1100 mm (Standard), runder eingelassener Griff',
    'Beschattung: Aufdachmarkise',
    'Markisenstoff: AC219 · Greenery · Wassersäule 350 mm',
    'LED-Spots: 12er-Set', 'Hauswand: Rauputz',
    'Untergrund: Tragender Untergrund vorhanden',
    'Montage durch BV AussenSysteme',
    'Ein Eintrag, den noch kein Muster kennt'
  ];
  var g = pdfGruppen(liste);
  var raus = [];
  g.forEach(function (x) { x.zeilen.forEach(function (z) { raus.push(z); }); });
  /* Erwartet wird die Liste ohne das, was bewusst wegfaellt (Kopfzeilen,
     interne Angaben) und in der Form, die der Filter erzeugt. Geprueft
     bleibt damit das Entscheidende: dass nichts UNBEABSICHTIGT verschwindet
     und nichts doppelt auftaucht. */
  var soll = liste.slice(2)
    .filter(function (z) { return !PDF_IM_KOPF.test(z) && !nurIntern(z); })
    .map(ohneLieferant).map(ohneVorbehalt);
  if (gegen) soll.push('Diese Zeile hat nie jemand uebergeben');
  var fehlt = soll.filter(function (z) { return raus.indexOf(z) === -1; });
  var doppelt = raus.filter(function (z, i) { return raus.indexOf(z) !== i; });
  pruefe('Keine Angabe geht beim Gruppieren verloren',
         fehlt.length === 0 && doppelt.length === 0,
         fehlt.length ? 'fehlt: ' + fehlt[0]
           : (doppelt.length ? 'doppelt: ' + doppelt[0]
             : soll.length + ' Zeilen in ' + g.length + ' Gruppen'));
  /* Der unbekannte Eintrag MUSS in der Auffanggruppe landen – sonst ist
     sie nicht wirksam und der Schutz oben nur zufaellig erfuellt. */
  var auffang = g.filter(function (x) { return x.titel === 'Weitere Angaben'; })[0];
  pruefe('Unbekannte Eintraege landen in „Weitere Angaben"',
         !!auffang && auffang.zeilen.indexOf(
           gegen ? 'Farbe: Anthrazit' : 'Ein Eintrag, den noch kein Muster kennt') > -1,
         auffang ? auffang.zeilen.length + ' Eintrag/Eintraege' : 'Gruppe fehlt');
  /* Produkt und Masse stehen im Kopf – nicht noch einmal in der Liste. */
  /* ---------- Kein Lieferantenname auf dem Kundenblatt ----------
     „von VD soll nix drin stehen" (Betreiber, 12.10.2026), auf Rueckfrage
     eingegrenzt auf die woertliche Nennung und auf das PDF.

     Geprueft wird am ERGEBNIS von pdfGruppen(), nicht an der
     Filterfunktion allein: Wer spaeter eine neue Zeile mit „VD" einbaut
     und dabei vergisst, sie durch den Filter zu schicken, faellt hier auf.
     Zugleich darf der Filter nicht zu viel wegnehmen – „VSG 8 mm" enthaelt
     die Buchstaben, ist aber die Glasart und muss stehen bleiben. */
  var mitVd = liste.concat([
    'SG23 Richtungsangaben: von INNEN gesehen (links/rechts wie im VD-Anfrageformular)',
    'Keilglas: ESG klar (laut VD-Formular nur diese zwei)'
  ]);
  var rausVd = [];
  pdfGruppen(mitVd).forEach(function (x) {
    x.zeilen.forEach(function (z) { rausVd.push(z); });
  });
  var nennung = rausVd.filter(function (z) { return /\bVD\b/.test(z); });
  if (gegen) nennung.push('erzwungener Treffer');
  pruefe('Kein „VD" auf dem Kundenblatt', nennung.length === 0,
         nennung.length ? 'noch drin: ' + nennung[0].slice(0, 50) : rausVd.length + ' Zeilen geprueft');
  var glas = rausVd.filter(function (z) { return /VSG 8 mm klar/.test(z); });
  pruefe('Der Filter nimmt nicht zu viel weg',
         (gegen ? 0 : glas.length) === 1 &&
         rausVd.indexOf('SG23 Richtungsangaben: von INNEN gesehen (links/rechts)') > -1,
         'Glasart bleibt, Klammerzusatz faellt weg');

  /* ---------- Interne Angaben und Einzel-Vorbehalte ----------
     „das mit nächste lieferbare breite weglassen … is nur für mich intern
     wichtig für den preis" und „du musst nicht bei jedem element schreiben
     (vorschlag, Aufteilung nach aufmaß) reicht wenn es unten im rechtstext
     einmal alles drinsteht" (Betreiber, 12.10.2026).

     BEIDES NUR IM PDF: In der Anfrage an den Betrieb bleibt die lieferbare
     Breite stehen – daran haengt der Preis. Geprueft wird deshalb beides:
     dass es aus dem PDF verschwindet UND dass zusammenfassung() es
     weiterhin erzeugt. */
  var mitIntern = liste.concat([
    'Gerechnet mit der nächsten lieferbaren Breite: 5080 mm',
    'Schiebeanlage vorne: 2335 mm licht (Vorschlag, Aufteilung nach Aufmaß)',
    'SG23 Bürstendichtung: Bürstenprofil, Lieferlänge 2500 mm – Bedarf nach Aufmaß'
  ]);
  var rausI = [];
  pdfGruppen(mitIntern).forEach(function (x) {
    x.zeilen.forEach(function (z) { rausI.push(z); });
  });
  var intern = rausI.filter(function (z) { return /lieferbaren Breite/.test(z); });
  if (gegen) intern.push('erzwungen');
  pruefe('Die naechste lieferbare Breite steht nicht im PDF', intern.length === 0,
         'Kalkulationsgroesse, kein Kundenmass');
  var vorb = rausI.filter(function (z) {
    return /\(Vorschlag|Bedarf nach Aufmaß/.test(z);
  });
  if (gegen) vorb.push('erzwungen');
  pruefe('Kein Vorbehalt mehr an der einzelnen Angabe', vorb.length === 0,
         'steht einmal unten im Fusstext');
  /* Der Filter darf die Angabe nicht verstuemmeln – die Masse muessen
     vollstaendig bleiben, nur der Zusatz faellt weg. */
  var bleibt = rausI.filter(function (z) {
    return z === 'Schiebeanlage vorne: 2335 mm licht';
  });
  pruefe('Nur der Zusatz faellt weg, nicht die Angabe',
         (gegen ? 0 : bleibt.length) === 1, 'Mass bleibt vollstaendig');
  /* Gegenprobe der anderen Richtung: In der ANFRAGE muss die lieferbare
     Breite erhalten bleiben. Geprueft am Quelltext, weil zusammenfassung()
     hier nicht lauffaehig ist. */
  pruefe('Die lieferbare Breite bleibt in der Anfrage',
         new RegExp(q || "teile\\.push\\('Gerechnet mit der nächsten lieferbaren Breite: '")
           .test(js), 'dort haengt der Preis daran');

  /* „Weitere Angaben" ist die Auffanggruppe. Steht dort bei einer
     gewoehnlichen Konfiguration etwas drin, fehlt ein Muster – das sah
     der Betreiber am 12.10.2026 im Bild („Stoff Senkrechtmarkise"). */
  var echt = liste.filter(function (z) {
    return z !== 'Ein Eintrag, den noch kein Muster kennt';
  }).concat(['Stoff Senkrechtmarkise: T71813 SCHWARZ BRONZE · Sergé · Konfektion A']);
  var auffang2 = pdfGruppen(echt).filter(function (x) {
    return x.titel === 'Weitere Angaben';
  })[0];
  pruefe('Gewoehnliche Angaben landen nicht in der Auffanggruppe',
         gegen ? !!auffang2 : !auffang2,
         auffang2 ? 'ohne Muster: ' + auffang2.zeilen[0].slice(0, 46) : 'jede Zeile hat ihre Gruppe');

  /* Produkt, Montageart UND die Massangabe stehen im Kopf bzw. in den
     Kacheln – in der Liste waeren sie eine Dopplung, die Platz frisst. */
  var dopplung = ['Terrassendach TDS', 'Wandmontage',
                  '5000 × 3500 mm, Durchgangshöhe 2200 mm'];
  if (gegen) dopplung = ['Farbe: Anthrazit'];
  var drin = dopplung.filter(function (z) { return raus.indexOf(z) > -1; });
  pruefe('Kopfzeilen stehen nicht doppelt in der Liste', drin.length === 0,
         drin.length ? 'doppelt: ' + drin[0] : 'Produkt, Montageart und Masse nur oben');
})();

pruefe('RAL-Feld ist breit genug',
       new RegExp(q || 'grid-column: span 2').test(html) &&
       new RegExp(q || 'placeholder="7016"').test(html),
       'zwei Spalten, kurzer Platzhalter');


/* ---------- Unterzug-Regler, am laufenden Code durchgespielt ----------
   „wenn ein unterzug nötig ist sollte dieser erst mal automatisch perfekt
   mittig platziert werden und dann falls man will mit regler gechoben
   werden können p.s. der regler klappt nicht" (Betreiber, 15.10.2026).

   Der Fehler war eine Reihenfolge: unterzugGrenzeSetzen() schrieb den
   Regler nach, lief aber VOR dem Auslesen – jeder Schiebeversuch wurde
   also ueberschrieben, bevor ihn jemand gelesen hatte. Ein Blick in den
   Quelltext findet so etwas nicht; deshalb wird hier die Bedienung
   nachgespielt: schieben, einlesen, nachziehen, wieder lesen. */
(function () {
  function holen(name) {
    var m = js.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n  \\}'));
    return m ? m[0] : '';
  }
  var namen = ['statikTiefe', 'unterzugAchsen', 'unterzugBereich', 'unterzugMitte',
               'unterzugAbstand', 'unterzugEinlesen', 'unterzugGrenzeSetzen',
               /* seit 16.10.2026: die Grenzen haengen am System */
               'regelnJetzt', 'systemName'];
  var quellen = namen.map(holen).join('\n');
  var fehltEcht = namen.filter(function (n) { return !holen(n); });
  /* Die Gegenprobe sucht zusaetzlich einen Namen, den es nicht gibt –
     sonst waere diese Prüfung die einzige, die nie anschlägt. Abgebrochen
     wird nur, wenn wirklich eine Funktion fehlt; sonst käme der Rest des
     Blocks in der Gegenprobe gar nicht zum Laufen. */
  var fehlend = gegen ? fehltEcht.concat('unterzugGibtEsNicht') : fehltEcht;
  pruefe('Alle sieben Funktionen des Unterzugs sind auffindbar',
         fehlend.length === 0,
         fehlend.length ? 'fehlt: ' + fehlend.join(', ') : 'aus dem Quelltext gelesen');
  if (fehltEcht.length) return;

  /* Ein Regler und ein Zahlenfeld, so viel wie der Code davon benutzt. */
  function bau(gegenReihenfolge, gruppenGelten) {
    var el = { value: '', min: '', max: '', step: '' };
    var zf = { value: '' };
    var doc = { getElementById: function (id) {
      return id === 'k3dUnterzug' ? el : (id === 'k3dUnterzugZahl' ? zf : null);
    }, activeElement: null };
    var Z = { tiefe: 5000, vorsprung: 0, vorsprungHinten: 0,
              unterzugLage: 0, unterzugAuto: true,
              produkt: 'Terrassendach TDS' };
    var umgebung = {
      Z: Z, document: doc,
      window: { BV_MASSTABELLE: { regeln: { tiefeMaxOhneUnterzug: 4600,
                                            innenkernAbTiefe: 4000 } } },
      /* Gilt die Gruppe nicht, zählt der Vorsprung für die Statik nicht –
         genau das prüft der Vorsprung-Fall weiter unten. */
      gruppeGilt: function () { return gruppenGelten !== false; },
      wert: function (id) { var e = doc.getElementById(id); return e ? e.value : null; },
      zahl: function (id, ersatz) {
        var v = parseInt(umgebung.wert(id), 10);
        return isNaN(v) ? ersatz : v;
      }
    };
    var pa = (js.match(/var PFOSTENACHSE = [\d.]+;/) || [''])[0];
    var pv = (js.match(/var PFOSTENACHSE_VORNE = [\d.]+;/) || [''])[0];
    var api = eval('(function (Z, document, window, gruppeGilt, wert, zahl, istCarportTds) { ' +
      'var uzGesetzt = null;' + pa + pv + quellen +
      '; return { einlesen: unterzugEinlesen, setzen: unterzugGrenzeSetzen,' +
      '           mitte: unterzugMitte, bereich: unterzugBereich,' +
      '           achsen: unterzugAchsen, abstand: unterzugAbstand }; })')(
      umgebung.Z, umgebung.document, umgebung.window, umgebung.gruppeGilt,
      umgebung.wert, umgebung.zahl, function () { return false; });
    /* Ein Durchlauf von aendern(), auf das Wesentliche verkuerzt.
       Die Verfaelschung dreht genau die Reihenfolge um, die der Fehler war. */
    function aendern() {
      if (gegenReihenfolge) { api.setzen(); Z.unterzugLage = api.einlesen(); }
      else { Z.unterzugLage = api.einlesen(); api.setzen(); }
    }
    return { el: el, zf: zf, Z: Z, api: api, aendern: aendern };
  }

  // 1. Erster Aufbau: mittig, ohne dass jemand etwas eingestellt hat.
  //    Verfälschung: So sah der Zustand vor dem 15.10.2026 aus – kein
  //    Automatik-Schalter, dafür eine Lage, die irgendwo stehengeblieben war.
  var s0 = bau(false);
  if (gegen) { s0.Z.unterzugAuto = false; s0.Z.unterzugLage = 1000; }
  s0.aendern();
  /* 5000 mm Tiefe, Pfostenachse 124,2 mm hinter der Dachkante → die
     Auflager stehen 4875,8 mm auseinander, die Mitte liegt bei 2438 mm.
     Vorher wurde hier 2500 erwartet – die Mitte der DACHTIEFE, also 62 mm
     zu weit vorn: „er ist nicht 100% MITTIG" (Betreiber, 15.10.2026). */
  var mitteSoll = Math.round((5000 - 124.2) / 2);
  pruefe('Der Unterzug liegt von selbst mittig',
         Number(s0.el.value) === mitteSoll && s0.Z.unterzugAuto === true,
         'Auflager 0 … ' + (5000 - 124.2) + ' mm → ' + s0.el.value +
         ' mm ab Wand (erwartet ' + mitteSoll + '), Automatik ' +
         (s0.Z.unterzugAuto ? 'an' : 'aus'));

  var w = bau(gegen);
  w.aendern();

  // 2. Der Nutzer schiebt – und der Wert muss stehen bleiben
  w.el.value = '1500';
  w.aendern();
  pruefe('Ein geschobener Regler springt nicht zurück',
         Number(w.el.value) === 1500 && w.Z.unterzugLage === 1500,
         'geschoben auf 1500, danach steht ' + w.el.value + ' mm im Regler');

  pruefe('Nach dem Schieben gilt der Wunsch, nicht die Mitte',
         w.Z.unterzugAuto === false,
         'Automatik ' + (w.Z.unterzugAuto ? 'noch an – die Lage wird überschrieben' : 'aus'));

  // 3. Noch zwei Durchlaeufe ohne Zutun: der Wert darf nicht wandern
  w.aendern(); w.aendern();
  pruefe('Er bleibt auch nach weiteren Änderungen stehen',
         Number(w.el.value) === 1500,
         'nach zwei weiteren Durchläufen ' + w.el.value + ' mm');

  // 4. Solange niemand schiebt, wandert die Mitte mit dem Mass
  var a = bau(false);
  a.aendern();
  var vorher = Number(a.el.value);
  a.Z.tiefe = 6000;
  if (gegen) a.Z.unterzugAuto = false;   // so verhielt sich die alte Fassung
  a.aendern();
  pruefe('Die automatische Mitte wandert mit der Spannweite',
         vorher === mitteSoll && Number(a.el.value) === Math.round((6000 - 124.2) / 2),
         '5000 mm → ' + vorher + ' mm, 6000 mm → ' + a.el.value + ' mm');

  // 5. Dachvorsprung: die Mitte liegt zwischen den Auflagern, nicht im Dach
  var b = bau(false, !gegen);
  b.Z.tiefe = 6000; b.Z.vorsprung = 1000;
  b.aendern();
  pruefe('Der Dachvorsprung verschiebt die Mitte nach vorn',
         Number(b.el.value) === mitteSoll,
         '6000 mm Tiefe, 1000 mm Vorsprung → Auflager bis ' + (5000 - 124.2) +
         ' mm, Mitte ' + b.el.value + ' mm');

  /* ---------- Der Träger steht dort, wo der Regler sagt ----------
     „reger klappt immernoch nicht": Gezeichnet wurde mit
     „T − unterzugAbstand() / 10", also von der DACHKANTE rueckwaerts,
     waehrend der Regler ab der WAND zaehlt. Der Traeger lief damit der
     Hand entgegen; nur bei genau mittiger Lage faellt das nicht auf. */
  var c0 = bau(false);
  c0.aendern();
  c0.el.value = '1500';
  c0.aendern();
  /* Die Lage kommt aus unterzugZcm(); gespiegelt waere „T − Abstand". */
  var zFalsch = /T - unterzugAbstand\(\) \/ 10/.test(js);
  var zQuelle = (js.match(/unterzugAbstand\(\) \/ 10/g) || []).length;
  var zNutzer = (js.match(/unterzugZcm\(sky\)/g) || []).length;
  pruefe('Gezeichnet wird ab der Wand, nicht ab der Dachkante',
         gegen ? zFalsch : !zFalsch,
         zFalsch ? 'noch gespiegelt (T − Abstand)' : 'keine gespiegelte Formel mehr');

  /* ---------- Nur EINE Stelle rechnet die Lage aus ----------
     „wenn mann unterzug verschoben hat, passen sich die keile und ndere
     sachen nicht an" (Betreiber, 15.10.2026, mit Bild). Die Spiegelung
     stand an ZWEI Stellen gleich geschrieben und wurde nur an einer
     berichtigt: Der Traeger stand danach ab Wand, die Seitenelemente
     teilten sich weiter gespiegelt. Bei mittiger Lage faellt das nicht
     auf, weil beide Rechnungen dort zusammenfallen – genau deshalb hat
     die Pruefung „der Bauaufruf gibt die Lage weiter" es nicht gefunden:
     Sie sah nur, DASS etwas uebergeben wird, nicht WAS. */
  pruefe('Die Lage des Unterzugs wird nur an einer Stelle gerechnet',
         gegen ? zQuelle !== 1 : zQuelle === 1,
         zQuelle + ' × „unterzugAbstand() / 10" im Code (erwartet 1, in unterzugZcm)');
  pruefe('Träger und Seitenelemente fragen dieselbe Stelle',
         gegen ? zNutzer < 2 : zNutzer >= 2,
         zNutzer + ' Verwender von unterzugZcm(sky) – Trägerbau und Seitenaufteilung');
  pruefe('Regler und Modell meinen dieselbe Stelle',
         c0.api.abstand() === (gegen ? -1 : 1500),
         'Regler 1500 mm → Modell ' + c0.api.abstand() + ' mm ab Wand');

  // 6. Die Mitte muss mit der Schrittweite des Reglers auch erreichbar sein
  var c = bau(false);
  c.Z.tiefe = 5000; c.Z.vorsprung = 250;
  c.aendern();
  var schritt = gegen ? 50 : Number(c.el.step);
  var mitte = Number(c.el.value), untergrenze = Number(c.el.min);
  pruefe('Die automatische Mitte ist auch einstellbar',
         (mitte - untergrenze) % schritt === 0,
         'Spannweite 4750, Mitte ' + mitte + ' mm, Regler ab ' + untergrenze +
         ' in ' + schritt + '-mm-Schritten');
})();


/* ---------- Längsseiten teilen sich am Unterzug ----------
   „hier die ganzen sachen, müssen den unterzug dann natürlich
   dementsprechend auch beachten und sich zu der neuen aufteilung
   anpassen" (Betreiber, 15.10.2026, mit Bild der sechs Seitenelemente:
   Keil, Rahmenwand, Schiebetür, Plankenwand, Senkrechtmarkise, Velaris).

   Die äußersten Unterzug-Pfosten stehen auf ±(B/2 − PF/2) – genau in der
   Achse der Seitenelemente. Ein durchgehendes Element ginge mitten
   hindurch. Gerechnet wird mit der echten Funktion, nicht mit einer
   Kopie ihrer Formel. */
(function () {
  var zFest = /var zHintenK = 0;/.test(js);
  var f = (js.match(/function seitenFelder\([\s\S]*?\n  \}/) || [''])[0];
  /* In der Gegenprobe wird zusaetzlich nach einer Funktion gesucht, die es
     nicht gibt – sonst waere dies die einzige Pruefung hier, die nie
     anschlaegt. */
  var fPruef = gegen ? js.match(/function seitenFelderGibtEsNicht\(/) : f;
  pruefe('seitenFelder() ist auffindbar', !!fPruef,
         f ? 'aus dem Quelltext gelesen' : 'nicht gefunden');
  if (!f) return;
  function bauen(quelle) {
    return eval('(' + quelle.replace('function seitenFelder', 'function') + ')');
  }
  var seitenFelder = bauen(f);
  /* Zwei Verfaelschungen, weil die Pruefungen in beide Richtungen zeigen:
     die eine Haelfte faellt auf, wenn gar nicht mehr geteilt wird (so war
     es vor dem 15.10.2026), die andere, wenn IMMER geteilt wird. */
  var nieTeilen = bauen(f.replace(/var teilt = [\s\S]*?;\n/, 'var teilt = false;\n'));
  var immerTeilen = bauen(f.replace(/var teilt = [\s\S]*?;\n/,
                                    'var teilt = unterzugZcm != null;\n'));
  var PF = 11;                       // Pfostenbreite in cm, wie im Modell

  // Ohne Unterzug bleibt alles wie vorher: ein Feld über die ganze Seite
  var ohne = seitenFelder(0, 500, gegen ? 250 : null, PF);
  pruefe('Ohne Unterzug bleibt die Seite ein Stück',
         ohne.length === 1 && ohne[0].laenge === 500 && ohne[0].richtung === -1,
         ohne.length + ' Feld, ' + ohne[0].laenge + ' cm, Richtung ' + ohne[0].richtung);

  // Mit Unterzug: zwei Felder, das Pfostenfach dazwischen fällt weg
  var mit = (gegen ? nieTeilen : seitenFelder)(0, 500, 250, PF);
  var summe = mit.reduce(function (a, x) { return a + x.laenge; }, 0);
  var m1 = mit[1] || { mitte: 0, laenge: 0, richtung: 0 };   // in der Gegenprobe fehlt es
  pruefe('Mit Unterzug zerfällt die Seite in zwei Felder',
         mit.length === 2, mit.length + ' Felder');
  pruefe('Das Pfostenfach bleibt frei',
         Math.abs(summe - (500 - PF)) < 0.01,
         'zusammen ' + summe + ' cm von 500 cm, Pfosten ' + PF + ' cm');
  pruefe('Kein Feld überlappt den Pfosten',
         mit.length === 2 &&
         mit[0].mitte + mit[0].laenge / 2 <= 250 - PF / 2 + 0.01 &&
         m1.mitte - m1.laenge / 2 >= 250 + PF / 2 - 0.01,
         'hinten bis ' + (mit[0].mitte + mit[0].laenge / 2) + ' cm, vorne ab ' +
         (m1.mitte - m1.laenge / 2) + ' cm');

  // Laufrichtung: von der Mitte nach außen
  pruefe('Schiebetüren laufen von der Mitte nach außen',
         mit[0].richtung === 1 && m1.richtung === -1,
         'hinteres Feld stapelt zur Wand (' + mit[0].richtung +
         '), vorderes nach vorn (' + m1.richtung + ')');

  // Verschobener Unterzug: die Felder gehen mit
  var links = (gegen ? nieTeilen : seitenFelder)(0, 500, 150, PF);
  var rechts = (gegen ? nieTeilen : seitenFelder)(0, 500, 400, PF);
  pruefe('Die Felder folgen dem verschobenen Unterzug',
         Math.abs(links[0].laenge - (150 - PF / 2)) < 0.01 &&
         Math.abs(rechts[0].laenge - (400 - PF / 2)) < 0.01,
         'Unterzug bei 150 cm → hinteres Feld ' + links[0].laenge +
         ' cm; bei 400 cm → ' + rechts[0].laenge + ' cm');

  // Steht der Unterzug ganz am Rand, entsteht kein Reststück
  /* 12 cm von der Wand: Nach Abzug der halben Pfostenbreite blieben 6,5 cm
     Restfeld – da passt kein Element hinein. Die Laengen sind trotzdem
     positiv, der Fall faellt also nicht von selbst weg, sondern nur durch
     die Randbedingung in seitenFelder(). Genau die prueft dieser Fall. */
  var randH = (gegen ? immerTeilen : seitenFelder)(0, 500, 12, PF);
  var randV = (gegen ? immerTeilen : seitenFelder)(0, 500, 488, PF);
  pruefe('Kein Feld von wenigen Zentimetern am Rand',
         randH.length === 1 && randV.length === 1,
         'Unterzug 12 cm vor der Wand bzw. hinter der Vorderkante → ' +
         randH.length + ' bzw. ' + randV.length + ' Feld statt eines 6,5-cm-Restes');

  // Die Teilung muss am Aufrufer wirklich ankommen
  /* Seit dem 24.10.2026 folgt dem Unterzug noch ein Argument: die Achsen
     der HINTEREN Pfosten, weil sich die Rueckseite an ihnen teilt und
     nicht an denen der Vorderseite. Geprueft wird weiter dasselbe – dass
     die Lage des Unterzugs beim Seitenbau ankommt. */
  pruefe('Der Bauaufruf gibt die Lage des Unterzugs weiter',
         new RegExp(q || "xPfVorne,[\\s\\S]{0,200}unterzugZcm\\(sky\\),").test(js),
         'seitenErweiterungen(…, unterzugZcm(sky), …)');
  pruefe('Und die Achsen der hinteren Pfosten',
         new RegExp(q || "frei \\? xPfHinten : null\\);").test(js),
         'sonst teilt sich die Rueckseite falsch');
  pruefe('Beide Längsseiten kommen aus derselben Aufteilung',
         new RegExp(q || "seitenFelder\\(hinten, vorne, unterzugZcm, PROFIL\\)\\.forEach").test(js),
         'links und rechts im selben Durchlauf');

  /* ---------- Der Keil bleibt in seinem Feld ----------
     „keil is nicht gleichmäßig und hat komische viele rechteckige
     unterteilungen" (Betreiber, 15.10.2026, mit zwei Bildern). Der Keil
     begann fest bei z = 0 statt an der Feldkante: Das vordere Feld baute
     seinen Keil von der Wand bis zur eigenen Vorderkante und legte ihn
     damit komplett über den des hinteren – zwei Keile übereinander, jeder
     mit eigener Sprossenteilung. */
  pruefe('Der Keil beginnt an der Feldkante, nicht an der Wand',
         new RegExp(q || "var zHintenK = mitte - laenge / 2;").test(js),
         zFest ? 'noch fest auf z = 0' : 'zHintenK = mitte − laenge / 2');
  pruefe('Kein fester Nullwert mehr für die Keil-Hinterkante',
         gegen ? zFest : !zFest,
         zFest ? 'var zHintenK = 0 steht noch da' : 'entfernt');
})();


/* ---------- Jedes Bedienelement muss etwas auslösen ----------
   „das klapt immernoch nicht" (Betreiber, 15.10.2026, mit Bild des
   Unterzug-Reglers). Der Regler stand im HTML, hatte ein Zahlenfeld
   daneben, seine Grenzen wurden gesetzt – aber er fehlte in der Liste der
   Elemente, die aendern() auslösen. Schieben bewirkte nichts; erst beim
   nächsten beliebigen Ereignis wurde sein Wert gelesen und der Träger
   sprang dorthin.

   Diese Prüfung ist bewusst allgemein: Sie zählt die Bedienelemente im
   HTML und verlangt für jedes einen Weg zu aendern(). Eine Prüfung nur
   für den Unterzug hätte den nächsten vergessenen Regler wieder nicht
   gefunden. */
(function () {
  var ids = (html.match(/<(?:input|select|textarea)[^>]*\bid="k3d[A-Za-z0-9]+"/g) || [])
    .map(function (t) { return { tag: t, id: t.replace(/.*id="(k3d[A-Za-z0-9]+)".*/, '$1') }; });

  var block = (js.match(/\['k3dProdukt',[\s\S]*?\]\.forEach\(function \(id\) \{/) || [''])[0];
  var verdrahtet = {};
  (block.match(/'(k3d[A-Za-z0-9]+)'/g) || []).forEach(function (x) {
    verdrahtet[x.replace(/'/g, '')] = true;
  });
  /* Zahlenfelder haengen an ihrem Regler (eigene Kopplung weiter unten),
     versteckte Felder werden von den Bildkacheln gesetzt, die selbst
     aendern() rufen. */
  (js.match(/\['(k3d[A-Za-z0-9]+)', '(k3d[A-Za-z0-9]+Zahl)'\]/g) || []).forEach(function (x) {
    verdrahtet[x.replace(/.*'(k3d[A-Za-z0-9]+Zahl)'.*/, '$1')] = true;
  });

  var offen = ids.filter(function (e) {
    if (verdrahtet[e.id]) return false;
    if (/type="hidden"/.test(e.tag)) return false;      // Kachelauswahl
    return true;
  }).map(function (e) { return e.id; });
  if (gegen) offen = [];          // Verfaelschung: angeblich ist alles verdrahtet

  pruefe('Jedes sichtbare Bedienelement löst ein Neuzeichnen aus',
         gegen ? offen.length > 0 : offen.length === 0,
         offen.length ? 'ohne Verdrahtung: ' + offen.join(', ')
                      : ids.length + ' Elemente geprüft, keines ohne Weg zu aendern()');

  /* Und der Regler, um den es ging, namentlich – damit die Meldung beim
     nächsten Mal sofort lesbar ist. */
  pruefe('Der Unterzug-Regler ist verdrahtet',
         gegen ? !verdrahtet.k3dUnterzug : !!verdrahtet.k3dUnterzug,
         verdrahtet.k3dUnterzug ? 'k3dUnterzug ruft aendern()' : 'fehlt in der Liste');

  /* Die Schrittweite im HTML muss zu der passen, die der Code setzt –
     sonst rastet der Regler beim ersten Anfassen auf ein anderes Raster
     als die berechnete Mitte. */
  var htmlStep = (html.match(/id="k3dUnterzug"[^>]*step="(\d+)"/) || [])[1];
  var codeStep = (js.match(/el\.step = (\d+);[\s\S]{0,80}unterzugAbstand/) || [])[1] ||
                 (js.match(/\/\* Schritt 1 mm[\s\S]*?el\.step = (\d+);/) || [])[1];
  pruefe('HTML und Code sind sich über die Schrittweite einig',
         gegen ? htmlStep !== codeStep : htmlStep === codeStep,
         'HTML ' + htmlStep + ' mm, Code ' + codeStep + ' mm');

  /* Der Startwert im HTML darf nicht unter der Untergrenze liegen: Der
     Browser klemmt ihn sonst stumm, und der erste gelesene Wert ist ein
     anderer als der geschriebene – was die Automatik abschaltet. */
  var hMin = Number((html.match(/id="k3dUnterzug"[^>]*min="(\d+)"/) || [])[1]);
  var hVal = Number((html.match(/id="k3dUnterzug"[^>]*value="(\d+)"/) || [])[1]);
  pruefe('Der Startwert des Reglers liegt in seinen Grenzen',
         gegen ? !(hVal >= hMin) : hVal >= hMin,
         'Startwert ' + hVal + ' mm, Untergrenze ' + hMin + ' mm');
})();


/* ---------- Beide Bauwege bauen denselben Unterzug ----------
   „immernoch" (Betreiber, 15.10.2026, mit Bild). Der Grund für vier
   vergebliche Runden: Es gibt ZWEI Bauwege. bauen() nimmt
   bauenAusDaten(), sobald Herstellerdaten vorliegen – also im Normalfall –
   und bauenTerrasseGeschaetzt() nur sonst. Der Regler, die Mitte zwischen
   den Auflagern und die geteilten Seitenelemente steckten allein im
   geschätzten Weg; der andere hatte seine eigene Zeile „var zUnterzug =
   T / 2;" und gab den Seiten keine Unterzuglage mit. Was ich prüfte, war
   jedes Mal der Weg, den der Betreiber gar nicht sah.

   Deshalb prüft das hier nicht eine Stelle, sondern die Decke: Jeder
   Bauweg, der einen Unterzug zeichnet, muss seine Lage aus derselben
   Funktion holen. */
(function () {
  function block(name) {
    var m = js.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n  \\}\\n'));
    return m ? m[0] : '';
  }
  var wege = ['bauenAusDaten', 'bauenTerrasseGeschaetzt'];
  var ohneQuelle = wege.filter(function (n) {
    var b = block(n);
    return !b || b.indexOf('unterzugZcm(') === -1;
  });
  if (gegen) ohneQuelle = wege.slice(0, 1);
  pruefe('Jeder Bauweg holt die Unterzug-Lage aus derselben Funktion',
         ohneQuelle.length === 0,
         ohneQuelle.length ? 'ohne unterzugZcm: ' + ohneQuelle.join(', ')
                           : wege.join(' und ') + ' rufen unterzugZcm()');

  /* Die alte Eigenrechnung darf nicht zurückkommen: „T / 2" als LAGE des
     Unterzugs (nicht als Rückfall in der Zeile darunter). */
  /* Nur echter Code: am Zeilenanfang nach Einrueckung. Ohne den Anker
     schlug die Prüfung auf dem Kommentar an, der die alte Zeile zitiert. */
  var eigen = /^\s*var zUnterzug = T \/ 2;/m.test(js);
  pruefe('Kein Bauweg rechnet die Unterzug-Lage selbst',
         gegen ? eigen : !eigen,
         eigen ? 'var zUnterzug = T / 2 steht wieder da' : 'nur unterzugZcm()');

  /* Und: Wo Keile entstehen (der Aufruf übergibt eine Dachunterkante),
     muss auch die Unterzuglage mitgehen – sonst teilen sich die Seiten an
     einer anderen Stelle, als der Träger steht. */
  /* Die Argumentliste wird ueber ZAEHLEN der Klammern gelesen, nicht mit
     einem Muster bis zur naechsten „);". Der Aufruf im geschaetzten Weg
     enthaelt eine Pfeilfunktion mit „(zMitte - z);" darin – ein naives
     Muster hoerte dort auf und sah die Lage am Ende nicht mehr. */
  function argumente(ab) {
    var i = js.indexOf('(', ab), tiefe = 0, j = i;
    for (; j < js.length; j++) {
      if (js[j] === '(') tiefe++;
      else if (js[j] === ')') { tiefe--; if (tiefe === 0) break; }
    }
    return js.slice(i, j + 1);
  }
  var rufe = [], pos = 0;
  while ((pos = js.indexOf('seitenErweiterungen(', pos)) > -1) {
    if (js.slice(Math.max(0, pos - 9), pos) !== 'function ') {
      rufe.push(argumente(pos));
    }
    pos += 20;
  }
  var mitDach = rufe.filter(function (r) { return /dachUk|function \(z\)/.test(r); });
  var ohneLage = mitDach.filter(function (r) { return r.indexOf('unterzugZcm(') === -1; });
  if (gegen) ohneLage = mitDach.slice(0, 1);
  pruefe('Jeder Seitenaufruf mit Keil bekommt die Unterzug-Lage',
         ohneLage.length === 0 && mitDach.length >= 2,
         ohneLage.length ? ohneLage.length + ' von ' + mitDach.length + ' ohne Lage'
                         : mitDach.length + ' Aufrufe mit Dachunterkante, alle mit Lage');

  /* Der Unterzug trägt nur mit eigenen Pfosten – im Datenweg fehlten sie. */
  var daten = block('bauenAusDaten');
  var hatPfosten = /verteilen\(pfostenUnterTraeger\(Z\.breite\), B, pf \/ 2\)/.test(daten);
  pruefe('Auch im Datenweg stehen Pfosten unter dem Unterzug',
         gegen ? !hatPfosten : hatPfosten,
         hatPfosten ? 'eigene Pfostenreihe' : 'Träger schwebt');
})();


/* ---------- Die Keil-Unterkante läuft über die ganze Seite durch ----------
   „allerdings passt sich der hintere keil nicht an die höhe des vorderen
   an" (Betreiber, 15.10.2026, mit Bild). Jedes Feld begrenzte die Höhe
   seiner Elemente an der Dachunterkante am EIGENEN vorderen Ende. Das
   hintere Feld endet am Unterzugspfosten, wo das Dach noch höher liegt –
   dort blieb mehr Höhe übrig, der Keil saß höher, und an der Trennstelle
   entstand ein Absatz. */
(function () {
  var zeile = (js.match(/var zHoehenBezug = [^;]*;/) || [''])[0];
  pruefe('Der Höhenbezug des Keils steht im Code',
         gegen ? !zeile : !!zeile,
         zeile || 'nicht gefunden');
  if (!zeile) return;

  function bauBezug(ersatz) {
    return eval('(function (quer, dachVorne, zVorneK) { ' +
      (ersatz || zeile) + ' return zHoehenBezug; })');
  }
  var bezug = bauBezug(null);
  /* Zwei Verfaelschungen in verschiedene Richtungen, weil die Pruefungen
     in verschiedene Richtungen zeigen: „alt" ist der Zustand von vorher
     (jedes Feld misst bei sich selbst), „immer" nimmt die Dachkante auch
     dort, wo sie nicht gilt. */
  var alt = bauBezug('var zHoehenBezug = zVorneK;');
  var immer = bauBezug('var zHoehenBezug = dachVorne;');

  /* Zwei Felder einer Längsseite: hinten endet bei 244,5 cm (am Pfosten),
     vorne bei 489 cm (Dachkante). Beide müssen denselben Bezug liefern. */
  var b2 = gegen ? alt : bezug;
  var hinten = b2(true, 489, 244.5);
  var vorn = b2(true, 489, 489);
  pruefe('Beide Keilfelder messen an derselben Stelle',
         hinten === vorn && hinten === 489,
         'hinteres Feld → ' + hinten + ' cm, vorderes → ' + vorn +
         ' cm (erwartet beide 489, die Dachvorderkante)');

  /* Die Stirnseite rechnet in x, nicht in z – dort bleibt es beim alten
     Bezug, sonst würde eine Breite als Tiefe gelesen. */
  var b3 = gegen ? immer : bezug;
  pruefe('Die Stirnseite behält ihren eigenen Bezug',
         b3(false, 489, 120) === 120,
         'quer = false → ' + b3(false, 489, 120) + ' (der eigene Wert)');

  /* Ohne Dachvorderkante (Bauwege ohne Keil) darf nichts umkippen. */
  var b4 = gegen ? immer : bezug;
  pruefe('Ohne Dachvorderkante bleibt der eigene Wert',
         b4(true, null, 300) === 300,
         'dachVorne = null → ' + b4(true, null, 300));
})();


/* ---------- Die Ansicht folgt dem Schritt ----------
   „is es möglich das wenn man zum schritt 4 kommt eindeckung, die 3d
   ansicht direkt auf ''von oben'' schwenkt das man das dach sieht und im
   nächsten schritt 5 wieder auf perspektive" (Betreiber, 16.10.2026). */
(function () {
  var f = (js.match(/function ansichtZumSchritt\([\s\S]*?\n  \}/) || [''])[0];
  pruefe('ansichtZumSchritt() ist auffindbar',
         gegen ? !js.match(/function ansichtZumSchrittGibtEsNicht\(/) && false : !!f,
         f ? 'aus dem Quelltext gelesen' : 'nicht gefunden');
  if (!f) return;

  /* Die echte Funktion, mit einer Attrappe für ansichtWaehlen: So steht
     am Ende da, WELCHE Ansicht wann gesetzt wurde. */
  var lauf = [];
  var api = eval('(function (ansichtWaehlen) { var zuletztSchritt = null; ' + f +
    '; return { ruf: ansichtZumSchritt, stand: function () { return zuletztSchritt; } }; })')(
    function (n) { lauf.push(n); });

  /* Der Weg durch die Schritte: produkt → aufbau → masse → dach → farbe */
  ['produkt', 'aufbau', 'masse', 'dach', 'farbe'].forEach(api.ruf);
  pruefe('Beim Dachschritt von oben, danach wieder Perspektive',
         gegen ? lauf.join() !== 'Von oben,Perspektive'
               : lauf.join() === 'Von oben,Perspektive',
         lauf.length ? lauf.join(' → ') : 'nichts geschaltet');

  /* Dieselbe Schritt-ID noch einmal (so ruft aendern() es bei jeder
     Änderung) darf NICHTS tun – sonst springt die Ansicht zurück,
     sobald man im Dachschritt etwas einstellt. */
  var vorher = lauf.length;
  api.ruf('farbe'); api.ruf('farbe');
  pruefe('Gleicher Schritt schaltet nicht noch einmal',
         gegen ? lauf.length !== vorher : lauf.length === vorher,
         'nach zwei weiteren Aufrufen: ' + (lauf.length - vorher) + ' zusätzliche Schaltungen');

  /* Zurückblättern aus dem Dachschritt: ebenfalls Perspektive. */
  var lauf2 = [];
  var api2 = eval('(function (ansichtWaehlen) { var zuletztSchritt = null; ' + f +
    '; return ansichtZumSchritt; })')(function (n) { lauf2.push(n); });
  ['masse', 'dach', 'masse'].forEach(api2);
  pruefe('Auch rückwärts aus dem Dachschritt heraus',
         gegen ? lauf2.join() !== 'Von oben,Perspektive'
               : lauf2.join() === 'Von oben,Perspektive',
         lauf2.join(' → ') || 'nichts geschaltet');

  /* Beide Wege – Klick und Schrittwechsel – über dieselbe Funktion. */
  pruefe('Klick und Schrittwechsel nutzen dieselbe Stelle',
         new RegExp(q || "ansichtWaehlen\\(b\\.getAttribute\\('data-k3d-ansicht'\\)\\)").test(js),
         'der Ansichtsknopf ruft ansichtWaehlen()');
  pruefe('Die Leiste wird mitgeführt',
         new RegExp(q || "x\\.classList\\.toggle\\('is-active'").test(js),
         'sonst zeigt sie eine andere Ansicht an als das Bild');
  pruefe('Im Modus „Alles auf einen Blick" greift sie nicht',
         new RegExp(q || "zuletztSchritt = null;\\s*return;").test(js),
         'Merker fällt zurück, kein Schalten ohne Schritte');
})();

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
