#!/usr/bin/env node
/* Prüft die Sonderformen (TDS und SkyView).
 *
 * Warum das eine eigene Prüfung braucht: Die Formen sind KEIN freies Maß.
 * Es gibt genau die Formen des Katalogblatts, jede mit ihrer eigenen
 * Maßkette, und SkyView kennt nur drei davon unter EIGENEN Nummern
 * (SkyView 1/2/3 = TDS 3/4/5). Wer das verwechselt, lässt den Betrieb auf
 * dem falschen Blatt suchen oder bietet eine Form an, die es für das
 * System gar nicht gibt.
 *
 * Geprüft wird nicht nur, was im Code steht: Die Funktionen werden
 * ausgeführt und ihre Ergebnisse nachgemessen.
 *
 * Aufruf:  node scripts/pruefe-sonderform.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var k3d = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var html = fs.readFileSync('konfigurator.html', 'utf8');

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

/* ---------- Die echten Funktionen ausführen, nicht nachlesen ---------- */
function hol(re, name) {
  var m = k3d.match(re);
  if (!m) { console.log('  FEHLER  nicht gefunden im Code: ' + name); fehler++; geprueft++; }
  return m ? m[0] : '';
}
var quelle =
  hol(/var SONDERFORM = \{[\s\S]*?\n  \};/, 'SONDERFORM') + '\n' +
  hol(/function sonderformErlaubt\(\) \{[\s\S]*?\n  \}/, 'sonderformErlaubt') + '\n' +
  hol(/function sonderformMoeglich\(\) \{[^}]*\}/, 'sonderformMoeglich') + '\n' +
  hol(/function sonderformAktiv\(\) \{[\s\S]*?\n  \}/, 'sonderformAktiv') + '\n' +
  hol(/function sonderformNummer\(n\) \{[\s\S]*?\n  \}/, 'sonderformNummer') + '\n' +
  hol(/function sonderformJetzt\(\) \{[\s\S]*?\n  \}/, 'sonderformJetzt') + '\n' +
  hol(/function sonderBraucht\(feld\) \{[\s\S]*?\n  \}/, 'sonderBraucht') + '\n' +
  hol(/function sonderRechteck\(\) \{[\s\S]*?\n  \}/, 'sonderRechteck');

var Z = { produkt: 'Terrassendach TDS', form: 'Sonderform', sonderform: 3,
          sfA: 5000, sfA1: 2500, sfA2: 2500, sfB: 4000, sfB1: 2000, sfB2: 2000,
          sfB3: 1500, sfC1: 3500, sfC2: 2500, sfC3: 1500 };
/* Im strict-Modus bekommt eval einen eigenen Geltungsbereich - die dort
   angelegten Namen landen also NICHT hier draussen. Deshalb gibt der
   eval-Ausdruck sie am Ende als Objekt zurueck. Lesend kommt der Code
   trotzdem an das Z von hier heran, und genau das braucht er. */
var API = null;
try {
  API = eval(quelle + '\n;({ SONDERFORM: SONDERFORM,' +
    ' erlaubt: sonderformErlaubt, aktiv: sonderformAktiv,' +
    ' nummer: sonderformNummer, jetzt: sonderformJetzt,' +
    ' braucht: sonderBraucht, rechteck: sonderRechteck })');
} catch (e) { API = null; }
var geladen = !!(API && API.SONDERFORM);
var SONDERFORM = geladen ? API.SONDERFORM : {};
function sonderformErlaubt() { return API.erlaubt(); }
function sonderformAktiv() { return API.aktiv(); }
function sonderformNummer(n) { return API.nummer(n); }
function sonderBraucht(f) { return API.braucht(f); }
function sonderRechteck() { return API.rechteck(); }

pruefe('Die Formenlogik lässt sich ausführen', gegen ? !geladen : geladen,
       geladen ? Object.keys(SONDERFORM).length + ' Formen' : 'Fehler beim Laden');
if (!geladen) { console.log('\nAbbruch'); process.exit(1); }

/* ---------- Umfang ---------- */
pruefe('Zehn Formen aus dem TDS-Katalogblatt',
       gegen ? Object.keys(SONDERFORM).length !== 10
             : Object.keys(SONDERFORM).length === 10,
       Object.keys(SONDERFORM).length + ' Formen');

var ohneText = Object.keys(SONDERFORM).filter(function (n) {
  return !SONDERFORM[n].t || !SONDERFORM[n].f;
});
pruefe('Jede Form hat Maßkette und Beschreibung',
       gegen ? ohneText.length !== 0 : ohneText.length === 0,
       ohneText.length ? 'fehlt bei ' + ohneText.join(', ') : 'alle vollständig');

/* ---------- Je System die richtige Liste ----------
   „Bei Skyview geht nur das" (Betreiber, 23.10.2026) – drei Formen. */
Z.produkt = 'Terrassendach TDS';
var tds = sonderformErlaubt();
Z.produkt = 'Flachdach SkyView';
var sky = sonderformErlaubt();
pruefe('TDS kennt alle zehn Formen',
       gegen ? tds.length !== 10 : tds.length === 10, tds.join(', '));
pruefe('SkyView kennt genau die Formen 3, 4 und 5',
       gegen ? sky.join(',') !== '3,4,5' : sky.join(',') === '3,4,5', sky.join(', '));

/* Die Nummern müssen auf das Blatt des jeweiligen Systems passen. */
var skyNr = sky.map(function (n) { return sonderformNummer(n); }).join(',');
pruefe('SkyView zeigt seine eigenen Nummern 1, 2, 3',
       gegen ? skyNr !== '1,2,3' : skyNr === '1,2,3',
       'TDS 3/4/5 heißen bei SkyView ' + skyNr.split(',').join('/'));
Z.produkt = 'Terrassendach TDS';
var tdsNr = [3, 4, 5].map(function (n) { return sonderformNummer(n); }).join(',');
pruefe('TDS zeigt dieselben Formen unter 3, 4, 5',
       gegen ? tdsNr !== '3,4,5' : tdsNr === '3,4,5', tdsNr);

/* ---------- Kein anderes System bekommt Sonderformen ---------- */
var andere = ['Carport', 'Pergola / Lamellendach'];
var durchgerutscht = andere.filter(function (pr) {
  Z.produkt = pr;
  return sonderformErlaubt().length > 0;
});
Z.produkt = 'Terrassendach TDS';
pruefe('Carport und Pergola haben keine Sonderform',
       gegen ? durchgerutscht.length !== 0 : durchgerutscht.length === 0,
       durchgerutscht.length ? durchgerutscht.join(', ') : 'beide leer');

/* ---------- Ohne Sonderform ändert sich nichts ---------- */
Z.form = 'Normal';
var ausGeschaltet = !sonderformAktiv() && !sonderBraucht('A') && sonderRechteck().breite === 0;
Z.form = 'Sonderform';
pruefe('Bei normaler Form bleibt alles unberührt',
       gegen ? !ausGeschaltet : ausGeschaltet,
       'kein Maß gefordert, kein Rechteck gerechnet');

/* ---------- Nachgerechnet: das umschließende Rechteck ---------- */
Z.sonderform = 3;                       // braucht A B B1 B2 C1 C2
var r = sonderRechteck();
pruefe('Umschließendes Rechteck ist die größte Breite mal größte Tiefe',
       gegen ? !(r.breite === 5000 && r.tiefe === 3500)
             : (r.breite === 5000 && r.tiefe === 3500),
       r.breite + ' × ' + r.tiefe + ' mm (A 5000, B 4000, C1 3500, C2 2500)');

/* Ein Maß, das die Form NICHT kennt, darf das Rechteck nicht vergrößern.
   Form 7 kennt nur A, C1, C2 – das B von 9999 muss wirkungslos bleiben. */
Z.sonderform = 7;
var altB = Z.sfB; Z.sfB = 9999;
var r7 = sonderRechteck();
Z.sfB = altB;
pruefe('Ein Maß außerhalb der Form zählt nicht mit',
       gegen ? r7.breite === 9999 : r7.breite === 5000,
       'Form 7 kennt kein B – Rechteck bleibt ' + r7.breite + ' mm breit');

/* ---------- Jedes Maß hat ein Feld in der Seite ---------- */
var alleFelder = {};
Object.keys(SONDERFORM).forEach(function (n) {
  SONDERFORM[n].f.split(' ').forEach(function (k) { alleFelder[k] = true; });
});
var ohneEingabe = Object.keys(alleFelder).filter(function (k) {
  return html.indexOf('id="k3dSf' + k + '"') < 0;
});
pruefe('Jedes Maß der Formen hat ein Eingabefeld',
       gegen ? ohneEingabe.length !== 0 : ohneEingabe.length === 0,
       ohneEingabe.length ? 'fehlt: ' + ohneEingabe.join(', ')
                          : Object.keys(alleFelder).length + ' Maße geprüft');
var ohneGruppe = Object.keys(alleFelder).filter(function (k) {
  return html.indexOf('data-k3d-fuer="sf-' + k + '"') < 0;
});
pruefe('Jedes Feld blendet sich nach der Form ein und aus',
       gegen ? ohneGruppe.length !== 0 : ohneGruppe.length === 0,
       ohneGruppe.length ? 'ohne Gruppe: ' + ohneGruppe.join(', ')
                         : 'alle an gruppeGilt gebunden');
var ohneSchalter = Object.keys(alleFelder).filter(function (k) {
  return k3d.indexOf("'k3dSf" + k + "'") < 0;
});
pruefe('Jedes Feld löst ein Neuzeichnen aus',
       gegen ? ohneSchalter.length !== 0 : ohneSchalter.length === 0,
       ohneSchalter.length ? 'nicht verdrahtet: ' + ohneSchalter.join(', ')
                           : 'alle in der Ereignisliste');

/* ---------- Die Auswahl selbst ---------- */
pruefe('Die Auswahl Normal/Sonderform steht in der Seite',
       gegen ? html.indexOf('data-k3d-seg="k3dForm"') < 0
             : html.indexOf('data-k3d-seg="k3dForm"') > -1 &&
               html.indexOf('data-k3d-fuer="form-wahl"') > -1,
       'nur bei Systemen, die Sonderformen kennen');

/* ---------- Der Preisaufschlag gehört NICHT hierher ----------
   Auf dem Katalogblatt steht „+30% Aufschlag für die Konstruktion und
   Glas". Das ist eine Preisangabe und hat im Konfigurator der Website
   nichts zu suchen. */
var aufschlag = /\+?\s*30\s*%\s*Aufschlag/i;
pruefe('Kein Preisaufschlag im Konfigurator',
       gegen ? aufschlag.test(k3d) || aufschlag.test(html)
             : !aufschlag.test(k3d) && !aufschlag.test(html),
       'der +30%-Hinweis des Katalogblatts bleibt draußen');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
