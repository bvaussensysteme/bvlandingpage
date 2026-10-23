#!/usr/bin/env node
/* Prüft die Sonderform: ein Viereck aus vier Maßen.
 *
 * VORGESCHICHTE, damit niemand den Umweg wiederholt. Der Betrieb wollte
 * von Anfang an vier Felder: „Breite hinten, Breite vorne, Tiefe links,
 * Tiefe rechts". Ich kam stattdessen mit den zehn Katalogformen von VD
 * zurück (A, A1, A2, B, B1–B3, C1–C3). Das Urteil nach zwei Runden:
 * „die lösung is blöd, es funktioniert nicht. wäre besser wenn ich
 * Breite 1, Breite 2, Tiefe 1, Tiefe 2 hätte" (23.10.2026).
 *
 * Vier Maße legen ein Viereck eindeutig fest, und jedes davon kann man
 * am Objekt nachmessen. Die Vorderkante liegt mittig zur Hinterkante –
 * eine Festlegung, keine Herleitung, siehe sonderformEcken().
 *
 * Geprüft wird nicht nur, was im Code steht: Die Geometrie wird
 * ausgeführt und nachgemessen.
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
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

function hol(re, name) {
  var m = k3d.match(re);
  if (!m) { console.log('  FEHLER  nicht im Code: ' + name); fehler++; geprueft++; }
  return m ? m[0] : '';
}
var quelle =
  hol(/function sonderformErlaubt\(\) \{[\s\S]*?\n  \}/, 'sonderformErlaubt') + '\n' +
  hol(/function sonderformMoeglich\(\) \{[^}]*\}/, 'sonderformMoeglich') + '\n' +
  hol(/function sonderformAktiv\(\) \{[\s\S]*?\n  \}/, 'sonderformAktiv') + '\n' +
  hol(/function sonderformEcken\(\) \{[\s\S]*?\n  \}/, 'sonderformEcken') + '\n' +
  hol(/function sonderRechteck\(\) \{[\s\S]*?\n  \}/, 'sonderRechteck') + '\n' +
  hol(/function sonderformProfil\(x\) \{[\s\S]*?\n  \}/, 'sonderformProfil') + '\n' +
  hol(/function sonderformWiderspruch\(\) \{[\s\S]*?\n  \}/, 'sonderformWiderspruch') + '\n' +
  hol(/function sonderformVorderkanten\(Bcm, Tcm\) \{[\s\S]*?\n  \}/, 'sonderformVorderkanten');

var Z = { produkt: 'Terrassendach TDS', form: 'Sonderform',
          sfBreite1: 5000, sfBreite2: 5000, sfTiefe1: 3500, sfTiefe2: 3500 };
/* Im strict-Modus bekommt eval einen eigenen Geltungsbereich – die dort
   angelegten Namen landen nicht hier draußen. Deshalb gibt der Ausdruck
   sie als Objekt zurück. Lesend kommt der Code an das Z von hier heran,
   und genau das braucht er. */
var API = null;
try {
  API = eval(quelle + '\n;({ erlaubt: sonderformErlaubt, aktiv: sonderformAktiv,' +
    ' ecken: sonderformEcken, rechteck: sonderRechteck, profil: sonderformProfil,' +
    ' streit: sonderformWiderspruch, kanten: sonderformVorderkanten })');
} catch (e) { API = null; }
var geladen = !!(API && API.profil);
pruefe('Die Formenlogik lässt sich ausführen', gegen ? !geladen : geladen,
       geladen ? 'vier Maße, ein Viereck' : 'Fehler beim Laden');
if (!geladen) { console.log('\nAbbruch'); process.exit(1); }

function stelle(b1, b2, t1, t2) {
  Z.sfBreite1 = b1; Z.sfBreite2 = b2; Z.sfTiefe1 = t1; Z.sfTiefe2 = t2;
}
function tiefen() {
  var g = API.rechteck(), min = 1e9, max = -1e9;
  for (var i = 0; i <= 200; i++) {
    var pr = API.profil(g.breite * i / 200);
    var d = pr.vorne - pr.hinten;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min: min, max: max, g: g };
}

/* ---------- Wo es die Sonderform gibt ---------- */
var tds = API.erlaubt().length;
Z.produkt = 'Flachdach SkyView';
var sky = API.erlaubt().length;
Z.produkt = 'Carport';
var cp = API.erlaubt().length;
Z.produkt = 'Pergola / Lamellendach';
var pg = API.erlaubt().length;
Z.produkt = 'Terrassendach TDS';
pruefe('TDS und SkyView können die Sonderform',
       gegen ? !(tds > 0 && sky > 0) : (tds > 0 && sky > 0), 'beide');
pruefe('Carport und Pergola nicht',
       gegen ? !(cp === 0 && pg === 0) : (cp === 0 && pg === 0), 'beide leer');

/* ---------- Bei normaler Form bleibt alles unberührt ---------- */
Z.form = 'Normal';
var ruhig = !API.aktiv() && API.rechteck().breite === 0 && API.streit().length === 0;
var normKante = API.kanten(500, 300);
Z.form = 'Sonderform';
pruefe('Bei normaler Form rechnet die Sonderform nicht mit',
       gegen ? !ruhig : ruhig, 'kein Rechteck, keine Meldung');
pruefe('Normale Form ergibt genau einen Rinnenabschnitt über die volle Breite',
       gegen ? !(normKante.length === 1 && normKante[0].x0 === -250 &&
                 normKante[0].x1 === 250 && normKante[0].z0 === 300)
             : (normKante.length === 1 && normKante[0].x0 === -250 &&
                normKante[0].x1 === 250 && normKante[0].z0 === 300),
       normKante.length + ' Abschnitt, 500 cm breit bei 300 cm Tiefe');

/* ---------- Das umschließende Rechteck ---------- */
stelle(7000, 5000, 3000, 4000);
var r = API.rechteck();
pruefe('Umschließendes Rechteck ist das größte Maß in jeder Richtung',
       gegen ? !(r.breite === 7000 && r.tiefe === 4000)
             : (r.breite === 7000 && r.tiefe === 4000),
       r.breite + ' × ' + r.tiefe + ' mm aus 7000/5000 und 3000/4000');

/* ---------- Das Rechteck ist der Sonderfall ---------- */
stelle(5000, 5000, 3500, 3500);
var gl = tiefen();
pruefe('Alle vier Maße gleich ergibt überall dieselbe Tiefe',
       gegen ? !(Math.abs(gl.min - 3500) < 1 && Math.abs(gl.max - 3500) < 1)
             : (Math.abs(gl.min - 3500) < 1 && Math.abs(gl.max - 3500) < 1),
       gl.min.toFixed(0) + ' bis ' + gl.max.toFixed(0) + ' mm');

/* ---------- Schräge Vorderkante ---------- */
stelle(5000, 5000, 3000, 4000);
var sk = tiefen();
var kante = API.kanten(500, 400)[0];
pruefe('Verschiedene Tiefen ergeben eine schräge Vorderkante',
       gegen ? !(Math.abs(kante.z0 - 300) < 0.1 && Math.abs(kante.z1 - 400) < 0.1)
             : (Math.abs(kante.z0 - 300) < 0.1 && Math.abs(kante.z1 - 400) < 0.1),
       'Rinne links ' + kante.z0.toFixed(0) + ', rechts ' + kante.z1.toFixed(0) + ' cm');
pruefe('Die Tiefe läuft gleichmäßig von links nach rechts durch',
       gegen ? !(Math.abs(sk.min - 3000) < 5 && Math.abs(sk.max - 4000) < 5)
             : (Math.abs(sk.min - 3000) < 5 && Math.abs(sk.max - 4000) < 5),
       sk.min.toFixed(0) + ' bis ' + sk.max.toFixed(0) + ' mm');

/* ---------- Die Vorderkante liegt mittig ----------
   Mit vier Zahlen allein wäre nicht gesagt, wo ein Breitenunterschied
   sitzt. Festgelegt ist: gleichmäßig auf beide Seiten. Das muss gelten,
   sonst stimmt die Skizze nicht mit dem Modell überein. */
stelle(7000, 5000, 3500, 3500);
var e = API.ecken();
var mittig = Math.abs(e[3].x + 2500) < 0.001 && Math.abs(e[2].x - 2500) < 0.001 &&
             Math.abs(e[0].x + 3500) < 0.001 && Math.abs(e[1].x - 3500) < 0.001;
pruefe('Die Vorderkante liegt mittig zur Hinterkante',
       gegen ? !mittig : mittig,
       'hinten ±3500, vorne ±2500 – der Unterschied teilt sich');

/* ---------- Nie ein Sparren ohne Länge ----------
   An den Ecken läuft ein Trapez spitz zu; dort darf die Tiefe gegen
   null gehen, aber nie null oder negativ werden – sonst bekäme das
   3D-Modell eine kaputte Geometrie. */
var kaputt = [];
[[5000, 5000, 3500, 3500], [7000, 5000, 3500, 3500], [5000, 7000, 3500, 3500],
 [5000, 5000, 2000, 4500], [4000, 5000, 7600, 8000], [3000, 9000, 2500, 2500]
].forEach(function (f) {
  stelle(f[0], f[1], f[2], f[3]);
  var t = tiefen();
  if (!(t.min > 0)) kaputt.push(f.join('/') + ': ' + t.min.toFixed(1));
});
pruefe('Keine Einstellung ergibt irgendwo die Tiefe null',
       gegen ? kaputt.length !== 0 : kaputt.length === 0,
       kaputt.length ? kaputt.join(', ') : 'sechs Formen über je 200 Stellen abgetastet');

/* ---------- Nichts ragt über das Rechteck hinaus ---------- */
var raus = [];
[[7000, 5000, 3000, 4000], [5000, 7000, 4000, 3000], [4000, 5000, 7600, 8000]
].forEach(function (f) {
  stelle(f[0], f[1], f[2], f[3]);
  var g = API.rechteck();
  for (var i = 0; i <= 100; i++) {
    var pr = API.profil(g.breite * i / 100);
    if (pr.vorne > g.tiefe + 1) raus.push(f.join('/'));
  }
});
pruefe('Nichts ragt über das umschließende Rechteck hinaus',
       gegen ? raus.length !== 0 : raus.length === 0,
       raus.length ? raus.join(', ') : 'Stückzahl bleibt gültig');

/* ---------- Ein fehlendes Maß fällt auf ---------- */
stelle(5000, 5000, 3500, 3500);
var sauber = API.streit().length;
stelle(5000, 0, 3500, 3500);
var leer = API.streit();
stelle(5000, 5000, 3500, 3500);
pruefe('Vollständige Maße ergeben keine Meldung',
       gegen ? sauber !== 0 : sauber === 0, 'still, solange alles da ist');
pruefe('Ein fehlendes Maß wird gemeldet',
       gegen ? leer.length === 0 : leer.length === 1,
       leer.length ? leer[0] : 'keine Meldung');

/* ---------- Bedienung ---------- */
['Breite1', 'Breite2', 'Tiefe1', 'Tiefe2'].forEach(function (k) {
  pruefe('Feld ' + k + ' steht in der Seite und ist verdrahtet',
         gegen ? html.indexOf('id="k3dSf' + k + '"') < 0
               : html.indexOf('id="k3dSf' + k + '"') > -1 &&
                 k3d.indexOf("'k3dSf" + k + "'") > -1,
         'Eingabefeld und Ereignisliste');
});
pruefe('Die Auswahl Normal/Sonderform steht in der Seite',
       gegen ? html.indexOf('data-k3d-seg="k3dForm"') < 0
             : html.indexOf('data-k3d-seg="k3dForm"') > -1 &&
               html.indexOf('data-k3d-fuer="form-wahl"') > -1,
       'nur bei Systemen, die sie können');
pruefe('Keine Reste der alten Katalogformen',
       gegen ? /SONDERFORM\b/.test(k3d)
             : !/SONDERFORM\b/.test(k3d) && !/k3dSonderform"/.test(html) &&
               !/data-k3d-fuer="sf-/.test(html),
       'weder Tabelle noch Auswahlliste noch Teilmaß-Felder');

/* ---------- Die Skizze kommt aus derselben Quelle wie das Modell ---------- */
pruefe('Die Skizze zeichnet aus sonderformProfil',
       gegen ? !/function sonderformSkizze\(\)[\s\S]*?sonderformProfil\(/.test(k3d)
             : /function sonderformSkizze\(\)[\s\S]*?sonderformProfil\(/.test(k3d),
       'keine zweite Vorstellung von der Form');
pruefe('Die Skizze beschriftet im Klartext, nicht mit Buchstaben',
       gegen ? !/'Breite hinten', Z\.sfBreite1/.test(k3d)
             : /'Breite hinten', Z\.sfBreite1/.test(k3d),
       '„Breite hinten" statt „B"');

/* ---------- Beide Bauwege ----------
   bauenAusDaten() baut ein Rechteck aus der Serverantwort und weiß von
   Sonderformen nichts – dieselbe Falle wie am 11., 15. und 16.10.2026. */
pruefe('Sonderform geht nie in den Datenweg',
       gegen ? !/if \(e && !e\.fehler && !sonderformAktiv\(\)\) bauenAusDaten\(e\);/.test(k3d)
             : /if \(e && !e\.fehler && !sonderformAktiv\(\)\) bauenAusDaten\(e\);/.test(k3d),
       'nur der geschätzte Bauweg kennt die Form');
pruefe('Rinne, Pfosten und Blende folgen der Form',
       gegen ? !/var kanten = sonderformVorderkanten\(B, T\);/.test(k3d)
             : /var kanten = sonderformVorderkanten\(B, T\);/.test(k3d) &&
               /zPfBei\(x\)/.test(k3d) && /blendeMassBei\(vz\)/.test(k3d),
       'nicht nur die Sparren');

/* ---------- Der Preisaufschlag gehört nicht hierher ---------- */
var aufschlag = /\+?\s*30\s*%\s*Aufschlag/i;
pruefe('Kein Preisaufschlag im Konfigurator',
       gegen ? aufschlag.test(k3d) || aufschlag.test(html)
             : !aufschlag.test(k3d) && !aufschlag.test(html),
       'der +30%-Hinweis des Katalogblatts bleibt draußen');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
