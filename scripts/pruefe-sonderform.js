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
  hol(/function sonderRechteck\(\) \{[\s\S]*?\n  \}/, 'sonderRechteck') + '\n' +
  hol(/function sonderformMoeglich\(\) \{[^}]*\}/, 'sonderformMoeglich') + '\n' +
  hol(/function sonderformProfil\(x\) \{[\s\S]*?\n  \}/, 'sonderformProfil') + '\n' +
  hol(/function sonderformVorderkanten\(Bcm, Tcm\) \{[\s\S]*?\n  \}/, 'sonderformVorderkanten') + '\n' +
  hol(/var SONDERFORM_TEILE = \{[\s\S]*?\n  \};/, 'SONDERFORM_TEILE') + '\n' +
  hol(/function sonderformBreite\(\) \{[\s\S]*?\n  \}/, 'sonderformBreite') + '\n' +
  hol(/function sonderformWiderspruch\(\) \{[\s\S]*?\n  \}/, 'sonderformWiderspruch');

var Z = { produkt: 'Terrassendach TDS', form: 'Sonderform', sonderform: 3,
          sfA: 5000, sfA1: 2500, sfA2: 2500, sfB: 5000, sfB1: 2500, sfB2: 2500,
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
    ' braucht: sonderBraucht, rechteck: sonderRechteck,' +
    ' profil: sonderformProfil, kanten: sonderformVorderkanten,' +
    ' breite: sonderformBreite, streit: sonderformWiderspruch })');
} catch (e) { API = null; }
var geladen = !!(API && API.SONDERFORM);
var SONDERFORM = geladen ? API.SONDERFORM : {};
function sonderformErlaubt() { return API.erlaubt(); }
function sonderformAktiv() { return API.aktiv(); }
function sonderformNummer(n) { return API.nummer(n); }
function sonderBraucht(f) { return API.braucht(f); }
function sonderRechteck() { return API.rechteck(); }
function sonderformProfil(x) { return API.profil(x); }
function sonderformVorderkanten(b, t) { return API.kanten(b, t); }
function sonderformBreite() { return API.breite(); }
function sonderformWiderspruch() { return API.streit(); }

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
pruefe('Umschließendes Rechteck: Breite aus den Teilmaßen, größte Tiefe',
       gegen ? !(r.breite === 5000 && r.tiefe === 3500)
             : (r.breite === 5000 && r.tiefe === 3500),
       r.breite + ' × ' + r.tiefe + ' mm (B1 2500 + B2 2500, C1 3500, C2 2500)');

/* Ein Maß, das die Form NICHT kennt, darf das Rechteck nicht vergrößern.
   Form 7 kennt nur A, C1, C2 – das B von 9999 muss wirkungslos bleiben. */
Z.sonderform = 7;
var altB = Z.sfB; Z.sfB = 9999;
var r7 = sonderRechteck();
Z.sfB = altB;
pruefe('Ein Maß außerhalb der Form zählt nicht mit',
       gegen ? r7.breite === 9999 : r7.breite === 5000,
       'Form 7 kennt kein B – Rechteck bleibt ' + r7.breite + ' mm breit');

/* ---------- Die Form als Grundriss: über ALLE zehn Formen ----------
   Der gemeinsame Nenner aller Formen ist „Tiefe als Funktion der
   Breite". Damit lässt sich jede Form abtasten und auf zwei Dinge
   prüfen, die immer gelten müssen:

     1. Nirgends darf die Tiefe null oder negativ werden – dort stünde
        ein Sparren ohne Länge, und das 3D-Modell bekäme eine kaputte
        Geometrie.
     2. Nirgends darf die Form über das umschließende Rechteck
        hinausragen – sonst stimmt die Stückzahl nicht mehr.

   Das ist der Weg, der einen Lesefehler beim Übertragen vom
   Katalogblatt findet, ohne dass jemand hinschauen muss. */
(function () {
  var kaputt = [], draussen = [];
  Object.keys(SONDERFORM).forEach(function (n) {
    Z.sonderform = Number(n);
    var g = sonderRechteck(), min = 1e9, max = -1e9;
    for (var i = 0; i <= 200; i++) {
      var pr = sonderformProfil(g.breite * i / 200);
      var t = pr.vorne - pr.hinten;
      if (t < min) min = t;
      if (pr.vorne > max) max = pr.vorne;
    }
    if (!(min > 0)) kaputt.push('Form ' + n + ': ' + min.toFixed(0) + ' mm');
    if (max > g.tiefe + 1) draussen.push('Form ' + n + ': ' + max.toFixed(0) +
                                         ' > ' + g.tiefe);
  });
  Z.sonderform = 3;
  pruefe('Keine Form hat irgendwo die Tiefe null',
         gegen ? kaputt.length !== 0 : kaputt.length === 0,
         kaputt.length ? kaputt.join(', ') : 'alle zehn Formen abgetastet');
  pruefe('Keine Form ragt über das umschließende Rechteck hinaus',
         gegen ? draussen.length !== 0 : draussen.length === 0,
         draussen.length ? draussen.join(', ') : 'Stückzahl bleibt gültig');
})();

/* Die Stufen müssen auch wirklich da sein: Bei Form 3 ist links tief
   (C1) und rechts flach (C2). Wäre das Blatt spiegelverkehrt gelesen,
   käme es genau hier heraus. */
(function () {
  Z.sonderform = 3;
  var links = sonderformProfil(100).vorne;
  var rechts = sonderformProfil(sonderRechteck().breite - 100).vorne;
  pruefe('Form 3 ist links tief und rechts flach',
         gegen ? !(links === Z.sfC1 && rechts === Z.sfC2)
               : (links === Z.sfC1 && rechts === Z.sfC2),
         'links ' + links + ' (C1 ' + Z.sfC1 + '), rechts ' + rechts +
         ' (C2 ' + Z.sfC2 + ')');
  Z.sonderform = 4;
  var links4 = sonderformProfil(100).vorne;
  var rechts4 = sonderformProfil(sonderRechteck().breite - 100).vorne;
  pruefe('Form 4 ist die gespiegelte Form 3',
         gegen ? !(links4 === Z.sfC2 && rechts4 === Z.sfC1)
               : (links4 === Z.sfC2 && rechts4 === Z.sfC1),
         'links ' + links4 + ', rechts ' + rechts4);
  /* Trapez: die Tiefe muss von links nach rechts durchlaufen, nicht
     springen. Geprüft an Form 10 (C1 links, C2 rechts). */
  Z.sonderform = 10;
  var b10 = sonderRechteck().breite;
  var a10 = sonderformProfil(0).vorne, m10 = sonderformProfil(b10 / 2).vorne,
      e10 = sonderformProfil(b10).vorne;
  var mittig = Math.abs(m10 - (a10 + e10) / 2) < 1;
  pruefe('Trapez läuft gleichmäßig durch, statt zu springen',
         gegen ? !(a10 === Z.sfC1 && e10 === Z.sfC2 && mittig)
               : (a10 === Z.sfC1 && e10 === Z.sfC2 && mittig),
         'links ' + a10 + ', Mitte ' + m10.toFixed(0) + ', rechts ' + e10);
  Z.sonderform = 3;
})();

/* ---------- Kein eingegebenes Maß darf verschwinden ----------
   Am 23.10.2026 hat der Betrieb bei Form 1 „A – Breite vorne 5000" und
   „B – Breite hinten 7600" eingegeben. Gezeichnet wurde ein Dach, das
   vorne 7600 mm breit war: Die Funktion nahm schlicht max(A, B) und
   verwarf A. Gemerkt hat es niemand – bis das fertige Bild zeigte, dass
   die Eindeckung rechts über die Konstruktion hinaussteht.

   „jeder buchstabe hat ja sein maß" (Betreiber). Genau. Deshalb gilt
   jetzt: Wo es Teilbreiten gibt, bestimmen SIE die Form – sie legen die
   Stufen fest. Was dazu nicht passt, wird gemeldet statt verworfen. */
(function () {
  var frueher = { A: Z.sfA, B: Z.sfB, A1: Z.sfA1, A2: Z.sfA2 };
  Z.sonderform = 1;
  Z.sfA = 5000; Z.sfA1 = 2500; Z.sfA2 = 2500; Z.sfB = 7600;
  var br = sonderformBreite();
  var streit = sonderformWiderspruch();
  pruefe('Die Breite kommt aus den Teilmaßen, nicht aus max(A, B)',
         gegen ? br !== 5000 : br === 5000,
         br + ' mm aus A1 + A2, nicht 7600 aus B');
  pruefe('Ein Maß, das nicht passt, wird gemeldet statt verworfen',
         gegen ? streit.length === 0 : streit.length >= 2,
         streit.length + ' Meldung(en): ' + (streit[0] || '\u2013'));
  /* Und wenn alles zusammenpasst, darf keine Meldung kommen – sonst
     stumpft die Warnung ab und wird überlesen. */
  Z.sfB = 5000;
  var sauber = sonderformWiderspruch();
  pruefe('Passende Maße ergeben keine Meldung',
         gegen ? sauber.length !== 0 : sauber.length === 0,
         sauber.length ? sauber.join(' ') : 'still, solange alles stimmt');
  /* Ein fehlendes Maß ist auch ein Widerspruch. */
  Z.sfA1 = 0;
  var fehlt = sonderformWiderspruch();
  pruefe('Ein fehlendes Maß fällt auf',
         gegen ? fehlt.length === 0 : fehlt.length > 0,
         fehlt.length + ' Meldung(en), wenn A1 leer ist');
  Z.sfA = frueher.A; Z.sfB = frueher.B;
  Z.sfA1 = frueher.A1; Z.sfA2 = frueher.A2;
  Z.sonderform = 3;
})();

pruefe('Der Widerspruch steht im Bedienfeld, nicht nur im Code',
       gegen ? !/k3d-mass-streit/.test(k3d)
             : /k3d-mass-streit/.test(k3d) && html.indexOf('k3d-mass-streit') > -1,
       'rot hervorgehoben \u00fcber dem Rechteck-Hinweis');
pruefe('Der Widerspruch geht auch in die interne Notiz',
       gegen ? !/ACHTUNG Sonderform: /.test(k3d) : /ACHTUNG Sonderform: /.test(k3d),
       'damit es im Betrieb auff\u00e4llt, nicht erst beim Aufma\u00df');

/* ---------- Die Vorderkante als Abschnitte ----------
   „trz bleibt z.b die rinne rechteckig" (Betreiber, 23.10.2026, mit
   Bild): Sparren und Glas folgten der Form, die Rinne lief weiter über
   die ganze Breite an EINER Tiefe und stand vor den verkürzten
   Abschnitten in der Luft.

   Geprüft wird, dass die Zerlegung der Vorderkante zur Form passt – und
   zwar für jede Form. Ein Abschnitt zu wenig heißt: dort fehlt die
   Rinne. */
(function () {
  /* Bei normaler Form muss genau EIN Abschnitt über die volle Breite
     herauskommen, sonst baut der Bauweg etwas anderes als bisher. */
  Z.form = 'Normal';
  var norm = sonderformVorderkanten(500, 300);
  Z.form = 'Sonderform';
  pruefe('Normale Form ergibt genau einen Rinnenabschnitt',
         gegen ? !(norm.length === 1 && norm[0].z0 === 300 &&
                   norm[0].x0 === -250 && norm[0].x1 === 250)
               : (norm.length === 1 && norm[0].z0 === 300 &&
                  norm[0].x0 === -250 && norm[0].x1 === 250),
         norm.length + ' Abschnitt über die volle Breite');

  /* So viele Abschnitte hat jede Form: Stufenformen zwei oder drei,
     Trapeze einen durchgehenden. */
  var soll = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3,
               7: 1, 8: 1, 9: 1, 10: 1 };
  var schief = [];
  Object.keys(soll).forEach(function (n) {
    Z.sonderform = Number(n);
    var g = sonderRechteck();
    var k = sonderformVorderkanten(g.breite / 10, g.tiefe / 10);
    if (k.length !== soll[n]) {
      schief.push('Form ' + n + ': ' + k.length + ' statt ' + soll[n]);
    }
  });
  Z.sonderform = 3;
  pruefe('Jede Form bekommt so viele Rinnenabschnitte wie sie Stufen hat',
         gegen ? schief.length !== 0 : schief.length === 0,
         schief.length ? schief.join(', ') : '1\u20136 gestuft, 7\u201310 durchgehend');

  /* Die Abschnitte müssen die Breite lückenlos abdecken – eine Lücke
     wäre ein Stück Dachkante ohne Rinne. */
  var luecken = [];
  Object.keys(soll).forEach(function (n) {
    Z.sonderform = Number(n);
    var g = sonderRechteck();
    var bc = g.breite / 10;
    var k = sonderformVorderkanten(bc, g.tiefe / 10);
    if (Math.abs(k[0].x0 + bc / 2) > 0.2) luecken.push('Form ' + n + ' links');
    if (Math.abs(k[k.length - 1].x1 - bc / 2) > 0.2) luecken.push('Form ' + n + ' rechts');
    for (var i = 0; i < k.length - 1; i++) {
      if (Math.abs(k[i].x1 - k[i + 1].x0) > 0.2) luecken.push('Form ' + n + ' bei ' + i);
    }
  });
  Z.sonderform = 3;
  pruefe('Die Rinnenabschnitte decken die Breite lückenlos ab',
         gegen ? luecken.length !== 0 : luecken.length === 0,
         luecken.length ? luecken.join(', ') : 'kein Stück Dachkante ohne Rinne');

  /* Trapeze: 7 und 8 haben laut Katalog eine GERADE Rinne (das
     Wandprofil ist schräg), 9 und 10 eine schräge. */
  var falschHerum = [];
  [[7, false], [8, false], [9, true], [10, true]].forEach(function (f) {
    Z.sonderform = f[0];
    var g = sonderRechteck();
    var k = sonderformVorderkanten(g.breite / 10, g.tiefe / 10)[0];
    var schraeg = Math.abs(k.z1 - k.z0) > 0.1;
    if (schraeg !== f[1]) falschHerum.push('Form ' + f[0]);
  });
  Z.sonderform = 3;
  pruefe('Bei 7 und 8 ist die Rinne gerade, bei 9 und 10 schräg',
         gegen ? falschHerum.length !== 0 : falschHerum.length === 0,
         falschHerum.length ? falschHerum.join(', ') : 'wie auf dem Katalogblatt');
})();

/* Die Rinne muss die Abschnitte auch wirklich benutzen, und die
   vorderen Pfosten müssen unter IHREM Abschnitt stehen. */
pruefe('Die Rinne wird aus den Abschnitten gebaut',
       gegen ? !/var kanten = sonderformVorderkanten\(B, T\);/.test(k3d)
             : /var kanten = sonderformVorderkanten\(B, T\);/.test(k3d) &&
               /rinneBauen\(lang, zm, hRinne, mAlu, xm, -dreh\);/.test(k3d),
       'ein Rinnenstück je Abschnitt, bei Bedarf gedreht');
pruefe('Die vorderen Pfosten stehen unter ihrem Abschnitt',
       gegen ? !/balken\(PF, hPfosten, PF, x, hPfosten \/ 2, zPfBei\(x\), mAlu\);/.test(k3d)
             : /balken\(PF, hPfosten, PF, x, hPfosten \/ 2, zPfBei\(x\), mAlu\);/.test(k3d),
       'nicht mehr alle auf derselben Tiefe');

/* ---------- Die Skizze kommt aus derselben Quelle wie das Modell ----------
   „was bedeutet was man weiß es ja nicht es gibt ja keine skizze"
   (Betreiber, 23.10.2026). Die Skizze darf keine zweite Vorstellung von
   der Form sein – sonst zeigt sie etwas anderes, als gebaut wird. */
pruefe('Die Skizze zeichnet aus sonderformProfil',
       gegen ? !/function sonderformSkizze\(\)[\s\S]*?sonderformProfil\(/.test(k3d)
             : /function sonderformSkizze\(\)[\s\S]*?sonderformProfil\(/.test(k3d),
       'dieselbe Funktion wie das 3D-Modell, keine zweite Zeichnung');
pruefe('Die Skizze hat einen Platz in der Seite',
       gegen ? html.indexOf('id="k3dSonderformSkizze"') < 0
             : html.indexOf('id="k3dSonderformSkizze"') > -1,
       'unter der Formenauswahl');

/* ---------- Beide Bauwege ----------
   bauenAusDaten() baut ein Rechteck aus der Serverantwort und weiß von
   Sonderformen nichts. Liefe eine Sonderform dort hinein, wäre das Bild
   je nach Serverantwort mal geformt und mal nicht – dieselbe Falle wie
   am 11., 15. und 16.10.2026. */
pruefe('Sonderform geht nie in den Datenweg',
       gegen ? !/if \(e && !e\.fehler && !sonderformAktiv\(\)\) bauenAusDaten\(e\);/.test(k3d)
             : /if \(e && !e\.fehler && !sonderformAktiv\(\)\) bauenAusDaten\(e\);/.test(k3d),
       'nur der geschätzte Bauweg kennt die Form');

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
