#!/usr/bin/env node
/* Haben die Eigenschaftssymbole der Stoffseite einen Text fuer
 * Vorlesesoftware?
 *
 * WARUM (25.11.2026, Paket A8): 159 Symbole (Tropfen, Lichtechtheit,
 * UV-Schutz) waren nur per title beschriftet. title ist am Handy nicht
 * abrufbar und wird von Vorlesesoftware unzuverlaessig gelesen; 53
 * Tropfen standen ganz ohne Text da (WCAG 1.1.1).
 *
 * WIE: statisch in stoffe.html. Jedes <span class="ic"> muss einen
 * .sr-only-Text tragen, der seinem title entspricht, und seine Grafik
 * sowie das sichtbare Kuerzel (<b>) muessen aria-hidden sein, sonst
 * liest die Software doppelt.
 *
 * GEGENPROBE: --gegenprobe prueft stoffe.html im Stand vor A8 (Commit
 * a26cd34) aus git. Dann MUSS jedes Symbol auffallen.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const html = GEGENPROBE
  ? execFileSync('git', ['show', 'a26cd34:stoffe.html'], { cwd: W, encoding: 'utf8' })
  : readFileSync(join(W, 'stoffe.html'), 'utf8');
const ic = [...html.matchAll(/<span class="ic" title="([^"]+)">([\s\S]*?)<\/span>(?=\s*(?:<span class="ic"|<\/div>))/g)];
let rot = 0;
const gruende = {};
for (const [, titel, innen] of ic) {
  const f = [];
  if (!innen.includes('<span class="sr-only">' + titel + '</span>')) f.push('kein sr-only-Text');
  if (/<svg(?![^>]*aria-hidden="true")/.test(innen)) f.push('Grafik nicht aria-hidden');
  if (/<b>/.test(innen)) f.push('Kuerzel nicht aria-hidden');
  if (f.length) { rot++; for (const g of f) gruende[g] = (gruende[g] || 0) + 1; }
}
console.log((GEGENPROBE ? 'Gegenprobe (a26cd34): ' : 'Stoffsymbole: ') + ic.length + ' Symbole, ' + rot + ' mit Fehler');
for (const [g, n] of Object.entries(gruende)) console.log('  ' + n + 'x ' + g);
if (ic.length < 100) { console.log('Ergebnis: verdaechtig wenige Symbole gefunden'); process.exit(1); }
if (GEGENPROBE) {
  console.log('Ergebnis: ' + (rot === ic.length ? 'die Gegenprobe faellt bei allen auf' : 'GEGENPROBE VERSAGT'));
  process.exit(rot === ic.length ? 0 : 1);
}
console.log('Ergebnis: ' + (rot ? rot + ' Symbole ohne zugaenglichen Text' : 'alle Symbole haben zugaenglichen Text'));
process.exit(rot ? 1 : 0);
