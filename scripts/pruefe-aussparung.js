#!/usr/bin/env node
/* Prueft die Form der Anlage mit Aussparung (Hausvorsprung an der Wandseite).

   Die Geometrie wird nicht im Quelltext nachgelesen, sondern AUSGEFUEHRT
   und nachgemessen: Die Formfunktionen werden aus js/konfigurator-3d.js
   herausgeschnitten und hier mit eigenen Werten laufen gelassen.

   Gegenprobe (--gegenprobe): Es wird NICHT das Kriterium aufgeweicht,
   sondern die Quelle beschaedigt - und zwar JEDER FEHLER EINZELN. Danach
   muss JEDE Pruefung in mindestens einem Durchgang rot geworden sein.
   Bei einem gemeinsamen Durchgang koennen sich zwei Fehler gegenseitig
   verdecken und eine Pruefung sieht scharf aus, obwohl sie nichts haelt -
   genau das ist am 25.10.2026 schon einmal passiert.                  */

var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var quelle = fs.readFileSync(__dirname + '/../js/konfigurator-3d.js', 'utf8');
var von = quelle.indexOf('  var PROBE_AUSSPARUNG = (function ()');
var bis = quelle.indexOf('  function bauenTerrasseGeschaetzt(');
if (von < 0 || bis < 0 || bis <= von) {
  console.error('FEHLER: Die Formfunktionen wurden im Quelltext nicht gefunden.');
  process.exit(2);
}
var ORIGINAL = quelle.slice(von, bis);

/* Je ein Fehler, den man beim Bauen wirklich machen kann. */
var FEHLER = [
  ['Hinterkante wandert nicht mit',
   'return inAussparung(sp, x) ? zHinten + sp.tiefe : zHinten;',
   'return zHinten;'],
  ['Rechts landet links',
   "else if (w.form === 'Aussparung rechts') von = B / 2 - b;",
   "else if (w.form === 'Aussparung rechts') von = -B / 2;"],
  ['Abstand wird nicht begrenzt',
   'von = -B / 2 + Math.min(Math.max(0, w.aa / 10), B - b);',
   'von = -B / 2 + w.aa / 10;'],
  ['Breite wird nicht gekappt',
   'if (b >= B) b = B;',
   'if (false) b = B;'],
  ['Tiefe wird nicht begrenzt',
   'tiefe: Math.min(w.at / 10, tMax)',
   'tiefe: w.at / 10'],
  ['Randsparren wird mit verkuerzt',
   'return !!sp && x > sp.von + 1e-6 && x < sp.bis - 1e-6;',
   'return !!sp && x >= sp.von && x <= sp.bis;'],
  ['Aussparung auch ohne Erprobungsschalter',
   'if (!aussparungAktiv()) return null;',
   'if (false) return null;'],
  ['Links landet in der Mitte',
   "if (w.form === 'Aussparung links')       von = -B / 2;",
   "if (w.form === 'Aussparung links')       von = 0;"],
  ['Abstand nur halb gerechnet',
   'Math.min(Math.max(0, w.aa / 10), B - b)',
   'Math.min(Math.max(0, w.aa / 20), B - b)'],
  ['Hinterkante schiesst ueber die Anlage hinaus',
   'zHinten + sp.tiefe : zHinten',
   'zHinten + sp.tiefe * 10 : zHinten']
];

function baue(fehlerNr) {
  var code = ORIGINAL;
  if (fehlerNr != null) {
    var f = FEHLER[fehlerNr];
    if (code.indexOf(f[1]) < 0) {
      console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    code = code.replace(f[1], f[2]);
  }
  return function (zustand, suche) {
    var bau = new Function('Z', 'location', code +
      '\n;return { aktiv: aussparungAktiv, spanne: aussparungSpanne,' +
      ' drin: inAussparung, kante: hinterkanteBei };');
    return bau(zustand, { search: suche });
  };
}

var Z0 = { form: 'Rechteck', ausBreite: 2000, ausTiefe: 1000, ausAbstand: 1200,
           breite: 5000, tiefe: 4000 };
function zustand(zusatz) {
  var z = {}; for (var k in Z0) z[k] = Z0[k];
  for (var j in (zusatz || {})) z[j] = zusatz[j];
  return z;
}

var B = 500;        // Anlagenbreite in cm
var T = 400;        // Anlagentiefe in cm

/* Ein Durchgang: liefert je Pruefung Name, Ergebnis und Beleg. */
function lauf(lade) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  var sp0 = lade(zustand(), '').spanne(B);
  p('Ohne ?probe=aussparung bleibt es das Rechteck', sp0 === null,
    'aussparungSpanne() liefert ' + (sp0 === null ? 'null' : 'eine Form'));

  var r = lade(zustand(), '?probe=aussparung&form=rechts&ab=2000&at=1000').spanne(B);
  p('Aussparung rechts liegt an der rechten Kante',
    r && Math.abs(r.bis - B / 2) < 1e-6 && Math.abs(r.bis - r.von - 200) < 1e-6,
    r ? 'von ' + r.von + ' bis ' + r.bis + ' cm' : 'keine Form');

  var l = lade(zustand(), '?probe=aussparung&form=links&ab=2000&at=1000').spanne(B);
  p('Aussparung links liegt an der linken Kante',
    l && Math.abs(l.von + B / 2) < 1e-6,
    l ? 'von ' + l.von + ' bis ' + l.bis + ' cm' : 'keine Form');

  var m = lade(zustand(), '?probe=aussparung&form=mittig&ab=2000&at=1000&aa=1200').spanne(B);
  p('Aussparung mittig haelt den Abstand von links',
    m && Math.abs(m.von - (-B / 2 + 120)) < 1e-6,
    m ? 'von ' + m.von + ' cm, erwartet ' + (-B / 2 + 120) : 'keine Form');

  var m2 = lade(zustand(), '?probe=aussparung&form=mittig&ab=2000&at=1000&aa=9000').spanne(B);
  p('Zu grosser Abstand schiebt die Aussparung nicht hinaus',
    m2 && m2.bis <= B / 2 + 1e-6 && m2.von >= -B / 2 - 1e-6,
    m2 ? 'von ' + m2.von + ' bis ' + m2.bis + ' (Rand ' + (-B / 2) + '/' + (B / 2) + ')' : 'keine Form');

  var m3 = lade(zustand(), '?probe=aussparung&form=links&ab=99000&at=1000').spanne(B);
  p('Breiter als die Anlage wird gekappt',
    m3 && (m3.bis - m3.von) <= B + 1e-6,
    m3 ? 'Breite ' + (m3.bis - m3.von) + ' cm bei Anlage ' + B : 'keine Form');

  var t = lade(zustand({ tiefe: T * 10 }), '?probe=aussparung&form=rechts&ab=2000&at=9000').spanne(B);
  p('Die Aussparung frisst die Anlage nicht auf',
    t && t.tiefe <= T - 80 + 1e-6,
    t ? 'Tiefe ' + t.tiefe + ' cm bei ' + T + ' cm Anlagentiefe (hoechstens ' + (T - 80) + ')' : 'keine Form');

  var A = lade(zustand(), '?probe=aussparung&form=rechts&ab=2000&at=1000');
  var spr = A.spanne(B), zH = 12;
  var innen  = spr ? A.kante(spr, B / 2 - 50, zH) : null;
  var aussen = spr ? A.kante(spr, -B / 2 + 50, zH) : null;
  p('In der Aussparung liegt die Hinterkante weiter vorne',
    spr && Math.abs(innen - (zH + spr.tiefe)) < 1e-6 && Math.abs(aussen - zH) < 1e-6,
    spr ? 'innen ' + innen + ' cm, aussen ' + aussen + ' cm (Tiefe ' + spr.tiefe + ')' : 'keine Form');

  /* Der Randsparren steht GENAU auf der Kante. Wird er mit verkuerzt,
     haengt die Dachkante in der Luft. Gemessen wird knapp daneben nach
     aussen - dort muss die volle Tiefe stehen. */
  p('Randsparren auf der Kante bleibt lang',
    spr && Math.abs(A.kante(spr, spr.von, zH) - zH) < 1e-6 &&
           Math.abs(A.kante(spr, spr.bis, zH) - zH) < 1e-6,
    spr ? 'bei x=' + spr.von + ' und x=' + spr.bis + ' bleibt ' + zH + ' cm' : 'keine Form');

  /* Ueber die ganze Breite abgetastet - wie bei der alten Sonderform. */
  var dachTiefe = T - 18.6, schlimmste = Infinity, stelle = 0;
  if (spr) {
    for (var i = 0; i <= 200; i++) {
      var x = -B / 2 + B * i / 200;
      var rest = dachTiefe - A.kante(spr, x, zH);
      if (rest < schlimmste) { schlimmste = rest; stelle = x; }
    }
  }
  p('Kein Sparren bekommt Laenge null', spr && schlimmste > 0,
    spr ? 'geringste Resttiefe ' + schlimmste.toFixed(1) + ' cm bei x = ' +
          stelle.toFixed(0) + ' cm (200 Stellen abgetastet)' : 'keine Form');

  return e;
}

/* ---------- Normaler Durchgang ---------- */
if (!gegen) {
  console.log('\nForm der Anlage: Aussparung');
  var erg = lauf(baue(null)), rot = 0;
  erg.forEach(function (x) {
    console.log((x.ok ? '  ok      ' : '  FEHLER  ') + x.name + '   ' + x.beleg);
    if (!x.ok) rot++;
  });
  console.log('\nErgebnis: ' + (erg.length - rot) + ' bestanden, ' + rot + ' nicht bestanden');
  process.exit(rot === 0 ? 0 : 1);
}

/* ---------- Gegenprobe: jeder Fehler einzeln ---------- */
console.log('\nGegenprobe: jeder eingebaute Fehler einzeln\n');
var namen = lauf(baue(null)).map(function (x) { return x.name; });
var erwischt = namen.map(function () { return []; });
FEHLER.forEach(function (f, nr) {
  var e = lauf(baue(nr)), n = 0;
  e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(f[0]); n++; } });
  console.log('  Fehler "' + f[0] + '": ' + n + ' Pruefung(en) schlagen an');
  if (n === 0) console.log('    ACHTUNG: Dieser Fehler faellt niemandem auf.');
});
console.log('');
var blind = [];
namen.forEach(function (name, i) {
  if (erwischt[i].length === 0) { blind.push(name); console.log('  BLIND   ' + name); }
  else console.log('  scharf  ' + name + '   (durch: ' + erwischt[i].join(', ') + ')');
});
var ohneWirkung = FEHLER.filter(function (f, nr) {
  return lauf(baue(nr)).every(function (x) { return x.ok; });
});
console.log('\nErgebnis: ' + (namen.length - blind.length) + ' von ' + namen.length +
            ' Pruefungen schlagen an, ' + (FEHLER.length - ohneWirkung.length) +
            ' von ' + FEHLER.length + ' Fehlern werden bemerkt');
if (blind.length || ohneWirkung.length) {
  console.log('GEGENPROBE FEHLGESCHLAGEN.');
  process.exit(1);
}
console.log('Gegenprobe in Ordnung.');
process.exit(0);
