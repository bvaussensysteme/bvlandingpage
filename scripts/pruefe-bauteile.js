#!/usr/bin/env node
/* Rechnet JEDE Zeile von daten/dachmatrix.csv gegen js/bauteile.js nach.
 *
 * Warum jede Zeile und nicht ein paar Beispiele: Die Sparrenanzahl folgt
 * keiner Formel. Sie springt unregelmäßig (TDS/Glas: 11 → 13 → 15, dann über
 * vier Breiten konstant). Wer fünf Beispiele prüft, bestätigt seine eigene
 * Annahme – erst die vollständige Gegenrechnung zeigt, ob die Tabelle
 * wirklich durchgereicht wird.
 *
 * Zwei Wege zum selben Ergebnis: Die Zahlen im Code stammen aus
 * daten/dachmatrix.json (über scripts/baue-dachmatrix.js), geprüft wird
 * gegen daten/dachmatrix.csv. Einzige Ausnahme ist das Tiefenraster, das die
 * JSON nicht führt – es kommt aus derselben CSV (siehe daten/README.md).
 *
 * Gegenprobe: node scripts/pruefe-bauteile.js --gegenprobe
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.dirname(__dirname);
const CSV = path.join(WURZEL, 'daten', 'dachmatrix.csv');
let MATRIX = [];
try { MATRIX = require(path.join(WURZEL, 'js', 'dachmatrix-daten.js')); } catch (e) { MATRIX = []; }
const B = require(path.join(WURZEL, 'js', 'bauteile.js'));

/* Der Datenordner liegt nicht im Repository – bvlandingpage ist öffentlich,
   die Herstellermatrix darf dort nicht liegen (siehe .gitignore). Zum
   Arbeiten die Dateien aus dem privaten Repository bv-crm,
   docs/konfigurator-daten/, nach daten/ kopieren. */
function datenFehlen(pfad) {
  if (fs.existsSync(pfad)) return false;
  console.log('Der Ordner daten/ fehlt – das ist so gewollt.');
  console.log('Dieses Repository ist öffentlich; die Herstellermatrix gehört nicht hinein.');
  console.log('Zum Arbeiten: Dateien aus bv-crm/docs/konfigurator-daten/ nach daten/ kopieren,');
  console.log('dann node scripts/baue-dachmatrix.js ausführen. Beides ist in .gitignore.');
  return true;
}

function zeilen() {
  const text = fs.readFileSync(CSV, 'utf8').split(/\r?\n/);
  const kopf = text[0].split(',');
  return text.slice(1).filter(function (z) { return z.trim(); }).map(function (z, i) {
    const s = z.split(',');
    const r = { _nr: i + 2 };
    kopf.forEach(function (k, j) { r[k] = s[j]; });
    return r;
  });
}

function pruefen(rows) {
  const fehler = [];
  rows.forEach(function (r) {
    const breite = parseInt(r.breite_mm, 10);
    const tiefe = parseInt(r.tiefe_mm, 10);
    const e = B.bauteile(r.system, r.material, breite, tiefe);
    function melde(t) {
      fehler.push('Zeile ' + r._nr + ' (' + r.system + '/' + r.material + ' ' +
                  breite + '×' + tiefe + '): ' + t);
    }
    if (e.fehler) { melde(e.fehler); return; }

    // Das Maß muss im Raster liegen – sonst stimmt das Raster nicht
    if (e.raster.breite !== breite) melde('Breite nicht im Raster, gewählt ' + e.raster.breite);
    if (e.raster.tiefe !== tiefe) melde('Tiefe nicht im Raster, gewählt ' + e.raster.tiefe);

    const sparren = parseInt(r.sparren, 10);
    const stuetz = parseInt(r.stuetzfuesse, 10);
    if (e.sparren !== sparren) melde('Sparren ' + e.sparren + ', erwartet ' + sparren);
    if (e.stuetzfuesse !== stuetz) melde('Stützfüße ' + e.stuetzfuesse + ', erwartet ' + stuetz);

    // Markierungen: aus der Preisliste muss exakt dasselbe herauskommen
    const ausListe = e.statiktraegerQuelle === 'preisliste';
    if (r.markierung === 'unterzug' && !ausListe) melde('Unterzug der Preisliste nicht erkannt');
    if (r.markierung !== 'unterzug' && ausListe) melde('Unterzug erkannt, steht aber nicht in der Liste');
    // Verglichen wird die Preislisten-Markierung. innenkernSparren ist weiter
    // gefasst: dort kommt das Tiefenband aus der Fußnote dazu (4000-4600 mm),
    // das die Farbmarkierung nicht abdeckt.
    const innen = r.markierung === 'innenkern_sparren';
    if (e.innenkernLautListe !== innen) {
      melde('Innenkern-Sparren laut Liste ' + e.innenkernLautListe + ', erwartet ' + innen);
    }
    // Geteilte Eindeckung gilt gemeinsam mit dem Unterzug
    if (r.markierung === 'unterzug' && !e.eindeckungGeteilt) melde('Eindeckung nicht geteilt');
  });
  return fehler;
}

/* Deckt die Prüfung auch wirklich alle Zellen ab? Sonst könnte eine ganze
   Materialkombination fehlen, ohne dass etwas auffällt. */
function abdeckung(rows) {
  const ausCsv = new Set();
  rows.forEach(function (r) { ausCsv.add(r.system + '|' + r.material + '|' + r.breite_mm + '|' + r.tiefe_mm); });
  const ausCode = new Set();
  MATRIX.forEach(function (b) {
    B.breiten(b.system, b.material).forEach(function (br) {
      b.tiefen.forEach(function (t) { ausCode.add(b.system + '|' + b.material + '|' + br + '|' + t); });
    });
  });
  const fehlend = [...ausCode].filter(function (k) { return !ausCsv.has(k); });
  const ueber = [...ausCsv].filter(function (k) { return !ausCode.has(k); });
  return { ausCsv: ausCsv.size, ausCode: ausCode.size, fehlend: fehlend, ueber: ueber };
}

/* ---------- Belegte Einzelregeln ----------
   Nicht die Matrix, sondern die Sätze aus daten/technische-daten.md. Jede
   Zeile hier ist ein Zitat, das nachgerechnet wird. */
function regeln() {
  const f = [];
  function gleich(was, ist, soll) {
    if (ist !== soll) f.push(was + ': ' + ist + ', belegt ist ' + soll);
  }
  // In der Gegenprobe kann eine Kombination ganz wegfallen – dann gibt es
  // kein farben-Feld. Das ist ein Fehler, kein Absturzgrund.
  function farbzahl(e) { return (e && e.farben) ? e.farben.length : 0; }

  // 4.1 Grenzfälle der Pfosten-Tiefenregel (in der Quelle als getestet vermerkt)
  const ohne = { statiktraeger: false }, mit = { statiktraeger: true };
  gleich('Tiefe 4050 ohne Statikträger', B.bauteile('TDS', 'Glas', 4080, 4050, ohne).pfosten, 2);
  gleich('Tiefe 4600 ohne Statikträger', B.bauteile('TDS', 'Glas', 4080, 4600, ohne).pfosten, 3);
  gleich('Tiefe 6550 mit Statikträger',  B.bauteile('TDS', 'Glas', 4080, 6550, mit).pfosten, 2);
  gleich('Tiefe 7050 mit Statikträger',  B.bauteile('TDS', 'Glas', 4080, 7050, mit).pfosten, 3);

  // 6 Belegte Rechenbeispiele zur Neigung (UK Wand, UK Rinne, Tiefe, Grad)
  [[2800, 2500, 3000, 5.7], [3000, 2500, 4000, 7.1],
   [2600, 2500, 3000, 1.9], [3200, 2500, 4500, 8.8]].forEach(function (z) {
    const grad = Math.round(B.neigungAusHoehen(z[0], z[1], z[2]) * 10) / 10;
    gleich('Neigung ' + z[0] + '/' + z[1] + '/' + z[2], grad, z[3]);
  });
  // 6 Standardneigung 8° = 140 mm auf 1000 mm
  gleich('8° auf 1000 mm', Math.round(Math.tan(8 * Math.PI / 180) * 1000), 141);

  // 11 Freistehend bei TDS: zwei Pfosten und ein Statikträger kommen dazu
  const w = B.bauteile('TDS', 'Glas', 4080, 3050);
  const fr = B.bauteile('TDS', 'Glas', 4080, 3050, { freistehend: true });
  gleich('Freistehend: zusätzliche Pfosten', fr.pfosten - w.pfosten, 2);
  gleich('Freistehend: Statikträger', fr.statiktraegerStueck, 1);
  gleich('Freistehend: zwei Pfostenreihen', fr.pfostenReihen, 2);

  // 1 und 9 Systemeigenschaften
  gleich('TDS ist geneigt', B.bauteile('TDS', 'Glas', 4080, 3050).geneigt, true);
  gleich('SkyView ist Flachdach', B.bauteile('SkyView', 'Glas', 4000, 3000).geneigt === undefined ? 'Kombination fehlt' : B.bauteile('SkyView', 'Glas', 4000, 3000).geneigt, false);
  gleich('Flat Line ist Flachdach', B.bauteile('Flat Line', 'Trapezblech', 4000, 3000).geneigt, false);
  gleich('TDS führt vier Farben', farbzahl(B.bauteile('TDS', 'Glas', 4080, 3050)), 4);
  gleich('SkyView ohne Reinweiß', farbzahl(B.bauteile('SkyView', 'Glas', 4000, 3000)), 3);
  gleich('Flat Line ohne Reinweiß', farbzahl(B.bauteile('Flat Line', 'Trapezblech', 4000, 3000)), 3);

  // 2 Kein Zwischenmaß: 5300 mm muss auf 5900 mm gehen (Beispiel aus dem Auftrag)
  const r = B.bauteile('TDS', 'Glas', 5300, 3000);
  gleich('5300 mm wird zu', r.raster.breite, 5900);
  gleich('5300 mm nicht als im Raster gemeldet', r.imRaster, false);

  // 5.1 „Die Markierung läuft lückenlos nach unten"
  MATRIX.forEach(function (b) {
    const u = b.markierungen && b.markierungen.unterzug;
    if (!u) return;
    Object.keys(u).forEach(function (br) {
      const markiert = u[br];
      const alle = b.tiefen.filter(function (t) { return t >= Math.min.apply(null, markiert); });
      alle.forEach(function (t) {
        if (markiert.indexOf(t) === -1) {
          f.push(b.system + '/' + b.material + ' ' + br + ': Tiefe ' + t +
                 ' nicht markiert, obwohl kleinere markiert sind');
        }
      });
    });
  });

  return f;
}

/* Achsabstand der Sparren gegen das dokumentierte Feldbreiten-Band.
   Die Ausnahmen sind hier namentlich festgehalten: Kommt eine neue dazu,
   schlägt die Prüfung an. Das ist der Zweck – nicht, das Band zu bestätigen. */
const BAND_AUSNAHMEN = [
  'TDS/Glas 1080', 'TDS/Glas 8080', 'TDS/Glas 9080', 'TDS/Glas 12080',
  'TDS/Polycarbonat 6080', 'TDS/Polycarbonat 7080', 'TDS/Polycarbonat 8080',
  'TDS/Polycarbonat 9080', 'TDS/Polycarbonat 10080', 'TDS/Polycarbonat 11080',
  'TDS/Polycarbonat 12080', 'TDS/Polycarbonat 13080', 'TDS/Polycarbonat 14080',
  'SkyView/Glas 1000', 'SkyView/Glas 2000', 'SkyView/Glas 4000',
  'SkyView/Glas 8000', 'SkyView/Glas 9000', 'SkyView/Glas 12000'
].concat([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000]
  .map(function (b) { return 'SkyView/Polycarbonat ' + b; }));

function achsabstand() {
  const f = [], aussen = [];
  MATRIX.forEach(function (b) {
    B.breiten(b.system, b.material).forEach(function (br) {
      const fb = B.feldbreite(b.system, b.material, br);
      if (!fb || !fb.band) return;
      if (!fb.imBand) {
        const schl = b.system + '/' + b.material + ' ' + br;
        aussen.push(schl + ' = ' + fb.achsabstand + ' mm');
        if (BAND_AUSNAHMEN.indexOf(schl) === -1) {
          f.push('Neu außerhalb des Feldbreiten-Bandes: ' + schl + ' = ' + fb.achsabstand + ' mm');
        }
      }
    });
  });
  BAND_AUSNAHMEN.forEach(function (schl) {
    if (!aussen.some(function (a) { return a.indexOf(schl + ' ') === 0; })) {
      f.push('Ausnahme nicht mehr nötig: ' + schl + ' liegt jetzt im Band');
    }
  });
  return { fehler: f, aussen: aussen };
}

function gegenprobe() {
  const rows = zeilen();
  const faelle = [
    ['Sparrenzahl verfälscht', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Glas'; });
      const alt = b.sparrenJeBreite['8080']; b.sparrenJeBreite['8080'] = 12;
      return function () { b.sparrenJeBreite['8080'] = alt; };
    }, /Sparren 12, erwartet \d+/],
    ['Stützfußzahl verfälscht', function () {
      const b = MATRIX.find(function (x) { return x.system === 'SkyView' && x.material === 'Glas'; });
      const alt = b.stuetzfuesseJeBreite['14000']; b.stuetzfuesseJeBreite['14000'] = 5;
      return function () { b.stuetzfuesseJeBreite['14000'] = alt; };
    }, /Stützfüße 5, erwartet \d+/],
    ['Unterzug-Markierung entfernt', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Glas'; });
      const alt = b.markierungen.unterzug['5080']; delete b.markierungen.unterzug['5080'];
      return function () { b.markierungen.unterzug['5080'] = alt; };
    }, /Unterzug der Preisliste nicht erkannt/],
    ['Rastertiefe entfernt', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Polycarbonat'; });
      const alt = b.tiefen.slice(); b.tiefen = b.tiefen.filter(function (t) { return t !== 2550; });
      return function () { b.tiefen = alt; };
    }, /Tiefe nicht im Raster/]
  ];

  const regelFaelle = [
    ['Farbpalette verfälscht', function () {
      const b = MATRIX.find(function (x) { return x.system === 'SkyView' && x.material === 'Glas'; });
      const alt = b.system; b.system = 'TDS';   // zieht die TDS-Palette und -Neigung
      return function () { b.system = alt; };
    }, function (f) { return f.some(function (x) { return /Reinweiß|Flachdach/.test(x); }); }],
    ['Rasterbreite entfernt (5300 mm trifft dann anders)', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Glas'; });
      const alt = b.sparrenJeBreite['5900']; delete b.sparrenJeBreite['5900'];
      return function () { b.sparrenJeBreite['5900'] = alt; };
    }, function (f) { return f.some(function (x) { return /5300 mm wird zu/.test(x); }); }],
    ['Lücke in die Unterzug-Markierung gerissen', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Glas'; });
      const alt = b.markierungen.unterzug['5080'].slice();
      b.markierungen.unterzug['5080'] = alt.filter(function (t) { return t !== 6050; });
      return function () { b.markierungen.unterzug['5080'] = alt; };
    }, function (f) { return f.some(function (x) { return /nicht markiert, obwohl kleinere/.test(x); }); }],
    ['Sparrenzahl so verändert, dass der Achsabstand kippt', function () {
      const b = MATRIX.find(function (x) { return x.system === 'TDS' && x.material === 'Glas'; });
      const alt = b.sparrenJeBreite['5080']; b.sparrenJeBreite['5080'] = 4;
      return function () { b.sparrenJeBreite['5080'] = alt; };
    }, function () { return achsabstand().fehler.some(function (x) { return /TDS\/Glas 5080/.test(x); }); }]
  ];

  console.log('Gegenprobe: vier absichtliche Fehler in den Daten');
  let schlecht = 0;
  faelle.forEach(function (f) {
    const zurueck = f[1]();
    const fehler = pruefen(rows);
    zurueck();
    const erkannt = fehler.some(function (x) { return f[2].test(x); });
    console.log('  ' + (erkannt ? 'erkannt      ' : 'NICHT ERKANNT') + '  ' + f[0]);
    if (!erkannt) schlecht++;
  });
  console.log('Gegenprobe: vier absichtliche Fehler in den Regeln');
  regelFaelle.forEach(function (f) {
    const zurueck = f[1]();
    const erkannt = f[2](regeln());
    zurueck();
    console.log('  ' + (erkannt ? 'erkannt      ' : 'NICHT ERKANNT') + '  ' + f[0]);
    if (!erkannt) schlecht++;
  });

  if (schlecht) { console.log('Ergebnis: FEHLGESCHLAGEN'); return 1; }
  console.log('Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden');
  return 0;
}

function main() {
  if (datenFehlen(CSV)) return 0;
  if (process.argv.indexOf('--gegenprobe') > -1) return gegenprobe();

  const rows = zeilen();
  const fehler = pruefen(rows).concat(regeln());
  const ab = achsabstand();
  fehler.push.apply(fehler, ab.fehler);
  const a = abdeckung(rows);
  console.log('Stückliste gegen Preisliste: ' + rows.length + ' CSV-Zeilen, ' +
              a.ausCsv + ' Zellen, ' + a.ausCode + ' Zellen im Code');
  console.log('  Hinweis Achsabstand: ' + ab.aussen.length + ' von 100 Breiten liegen ' +
              'außerhalb des dokumentierten Feldbreiten-Bandes (bekannt und einzeln ' +
              'festgehalten, siehe BAND_AUSNAHMEN im Skript)');
  if (a.fehlend.length) console.log('  FEHLER  im Code, aber nicht in der CSV: ' + a.fehlend.slice(0, 5).join(', '));
  if (a.ueber.length) console.log('  FEHLER  in der CSV, aber nicht im Code: ' + a.ueber.slice(0, 5).join(', '));
  if (!fehler.length && !a.fehlend.length && !a.ueber.length) {
    console.log('  ok      Sparren, Stützfüße, Raster und Markierungen stimmen in jeder Zeile');
    console.log('  ok      belegte Einzelregeln: Pfosten-Grenzfälle, Neigungsbeispiele, ' +
                'Farbpaletten, Flachdach-Kennzeichen, lückenlose Markierungen');
    console.log('Ergebnis: bestanden');
    return 0;
  }
  fehler.slice(0, 20).forEach(function (f) { console.log('  FEHLER  ' + f); });
  if (fehler.length > 20) console.log('  … und ' + (fehler.length - 20) + ' weitere');
  console.log('Ergebnis: nicht bestanden');
  return 1;
}

process.exit(main());
