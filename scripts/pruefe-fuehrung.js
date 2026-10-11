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

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
