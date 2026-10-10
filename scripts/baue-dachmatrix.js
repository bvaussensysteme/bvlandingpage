#!/usr/bin/env node
/* Übersetzt daten/dachmatrix.json in js/dachmatrix-daten.js.
 *
 * Warum überhaupt eine Übersetzung? Die Website lädt einfache Skripte ohne
 * Bundler; ein `import` der JSON-Datei gibt es dort nicht, und ein `fetch`
 * wäre ein zusätzlicher Netzaufruf, der beim Öffnen scheitern kann. Deshalb
 * wird die JSON-Datei maschinell in eine Zuweisung gegossen – **abgetippt
 * wird nichts.** Kommt eine neue Preisliste, wird nur die JSON ersetzt und
 * dieses Skript erneut ausgeführt.
 *
 * Aufruf: node scripts/baue-dachmatrix.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.dirname(__dirname);
const QUELLE = path.join(WURZEL, 'daten', 'dachmatrix.json');
const QUELLE_CSV = path.join(WURZEL, 'daten', 'dachmatrix.csv');
const ZIEL = path.join(WURZEL, 'js', 'dachmatrix-daten.js');

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

if (datenFehlen(QUELLE)) process.exit(0);
const daten = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));

/* Das Tiefenraster steht NICHT in der JSON – die führt nur Breiten. Es wird
   deshalb aus der CSV gelesen (siehe daten/README.md). Abgetippt wird nichts. */
const tiefen = {};
fs.readFileSync(QUELLE_CSV, 'utf8').split(/\r?\n/).slice(1).forEach(function (z) {
  if (!z.trim()) return;
  const s = z.split(',');
  const schl = s[0] + '|' + s[2];
  tiefen[schl] = tiefen[schl] || [];
  const t = parseInt(s[4], 10);
  if (tiefen[schl].indexOf(t) === -1) tiefen[schl].push(t);
});
Object.keys(tiefen).forEach(function (k) { tiefen[k].sort(function (a, b) { return a - b; }); });

/* Markierungen zusammenfassen: In der Quelle steht jede Zelle doppelt
   (Export-Eigenheit). Für die Abfrage genügt je Breite die Liste der Tiefen. */
const kompakt = daten.map(function (b) {
  const nachArt = {};
  (b.markierungen || []).forEach(function (m) {
    const schl = m.art;
    nachArt[schl] = nachArt[schl] || {};
    nachArt[schl][m.breite_mm] = nachArt[schl][m.breite_mm] || [];
    if (nachArt[schl][m.breite_mm].indexOf(m.tiefe_mm) === -1) {
      nachArt[schl][m.breite_mm].push(m.tiefe_mm);
    }
  });
  Object.keys(nachArt).forEach(function (art) {
    Object.keys(nachArt[art]).forEach(function (br) {
      nachArt[art][br].sort(function (a, b2) { return a - b2; });
    });
  });
  return {
    system: b.system,
    montageart: b.montageart,
    material: b.material,
    sparrenJeBreite: b.sparrenJeBreite,
    stuetzfuesseJeBreite: b.stuetzfuesseJeBreite,
    tiefen: tiefen[b.system + '|' + b.material] || [],
    markierungen: nachArt
  };
});

const kopf = '/* MASCHINELL ERZEUGT – nicht von Hand ändern.\n' +
  '   Quelle: daten/dachmatrix.json (VD-Preislisten, Stand 10.10.2026)\n' +
  '   Neu erzeugen: node scripts/baue-dachmatrix.js\n' +
  '   Erzeugt am: ' + new Date().toISOString().slice(0, 10) + ' */\n';

const inhalt = kopf +
  '(function (global) {\n  \'use strict\';\n  var DACHMATRIX = ' +
  JSON.stringify(kompakt) + ';\n' +
  '  if (typeof module !== \'undefined\' && module.exports) module.exports = DACHMATRIX;\n' +
  '  else global.BV_DACHMATRIX = DACHMATRIX;\n' +
  '})(typeof window !== \'undefined\' ? window : this);\n';

fs.writeFileSync(ZIEL, inhalt);
const zellen = kompakt.reduce(function (n, b) {
  return n + Object.keys(b.sparrenJeBreite).length;
}, 0);
console.log('js/dachmatrix-daten.js geschrieben: ' + kompakt.length + ' Blöcke, ' +
            zellen + ' Breiten, ' + Math.round(inhalt.length / 1024) + ' KB');
