#!/usr/bin/env node
/* Liest den Text aus assets/broschuere/BV-Broschuere.pdf und legt ihn als
 * src/_data/katalogtext.json ab. Daraus baut src/broschuere.njk den
 * Abschnitt "Inhalt als Text".
 *
 * WARUM. Die 36 Katalogseiten sind BILDER. Eine Vorlesesoftware liest
 * davon nichts, eine Suchmaschine findet davon nichts, und kopieren
 * laesst sich auch nichts. Das PDF daneben hilft nicht: `pdfinfo` sagt
 * "Tagged: no", es traegt also keine Struktur fuer Hilfsmittel.
 * WCAG 1.4.5 (Bilder von Text, Stufe AA) verlangt dafuer eine
 * Textfassung. Sie steht sichtbar auf der Seite - aufklappbar, nicht
 * versteckt: Text, den nur Suchmaschinen sehen, waere Verschleierung.
 *
 * Aufruf:  node scripts/baue-katalogtext.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';

const PDF = 'assets/broschuere/BV-Broschuere.pdf';
const ZIEL = 'src/_data/katalogtext.json';
const ANZAHL = 36;

if (!existsSync(PDF)) {
  console.error('ABBRUCH: ' + PDF + ' fehlt.');
  process.exit(2);
}

function seitentext(nr) {
  const roh = execFileSync('pdftotext', ['-f', String(nr), '-l', String(nr), PDF, '-'],
    { encoding: 'utf8' });
  return roh
    .split('\n')
    .map((z) => z.replace(/\s+/g, ' ').trim())
    .filter((z) => z.length > 0)
    /* Seitenzahlen der Broschuere ("01", "34") tragen nichts bei,
       ebenso Trennzeichen, die im Layout als eigene Zeile stehen. */
    .filter((z) => !/^\d{1,3}$/.test(z))
    .filter((z) => z.length > 1 && /[A-Za-zÄÖÜäöüß0-9]/.test(z))
    /* Trennstriche am Zeilenende hat pdftotext schon aufgeloest. */
    .join('\n');
}

const seiten = [];
for (let i = 1; i <= ANZAHL; i++) {
  const text = seitentext(i);
  seiten.push({ nr: i, absaetze: text ? text.split('\n') : [] });
}

writeFileSync(ZIEL, JSON.stringify({ stand: new Date().toISOString().slice(0, 10), seiten }, null, 1), 'utf8');
const zeichen = seiten.reduce((s, x) => s + x.absaetze.join(' ').length, 0);
console.log(`${ZIEL} geschrieben: ${seiten.length} Seiten, ${zeichen} Zeichen.`);
const leer = seiten.filter((s) => !s.absaetze.length).map((s) => s.nr);
if (leer.length) console.log('Ohne Text (reine Bildseiten): ' + leer.join(', '));
