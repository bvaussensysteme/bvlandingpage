#!/usr/bin/env node
/* Prueft, ob der Bilderstreifen in den 14 Staedteseiten noch zu seiner
 * Quelle passt.
 *
 * ANLASS (19.11.2026, Befund des cto-Pruefers). Derselbe Block steht an
 * zwei Orten: als Nunjucks-Include in src/_includes/galerie.njk fuer die
 * Produktseiten und als erzeugtes HTML in den 14 handgepflegten
 * Staedteseiten. Zwei Wahrheiten laufen auseinander, und zwar lautlos:
 * Wer src/_data/galerien.json aendert und den Generator nicht noch einmal
 * laufen laesst, hat auf den Produktseiten die neuen Texte und auf den
 * Staedteseiten die alten. Niemand merkt es, weil beides funktioniert.
 *
 * WIE: Dieses Skript laedt den Generator als Modul, baut die Bloecke aus
 * src/_data/galerien.json noch einmal und vergleicht Zeichen fuer Zeichen
 * mit dem, was in den Dateien steht. Es schreibt nichts.
 *
 * Aufruf:  node scripts/pruefe-staedte-galerie.mjs [--gegenprobe]
 *
 * --gegenprobe baut zwei Fehler IM SPEICHER ein, einen fuer jede der
 * beiden Vergleichswege: in der ersten Datei eine geaenderte Bildhoehe
 * (muss der Generator-Vergleich finden), in der zweiten einen geloeschten
 * Alternativtext (muss der direkte Textvergleich finden). Dateien auf der
 * Platte werden nie angefasst.
 */
import fs from 'node:fs';
import path from 'node:path';
import { block, ANFANG, ENDE, VERSION, WURZEL, staedteseiten, teileAuf }
  from './baue-staedte-galerie.mjs';

const GEGENPROBE = process.argv.includes('--gegenprobe');
let ok = 0, fehler = 0;
function pruefe(name, gut, info) {
  if (gut) { ok++; console.log(`  ok      ${name.padEnd(54)} ${info || ''}`); }
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(54)} ${info || ''}`); }
}
const flucht = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SUCHE = new RegExp(flucht(ANFANG) + '[\\s\\S]*?' + flucht(ENDE));

const dateien = staedteseiten();
pruefe('Es sind 14 Staedteseiten', dateien.length === 14, `${dateien.length} gefunden`);

let abweichend = [];
for (const [i, datei] of dateien.entries()) {
  let t = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  if (GEGENPROBE && i === 0) t = t.replace('height="450"', 'height="451"');
  const treffer = t.match(SUCHE);
  if (!treffer) { abweichend.push(`${datei}: kein Block`); continue; }
  const { schluessel, stadt } = teileAuf(datei);
  if (treffer[0] !== block(schluessel, stadt)) abweichend.push(`${datei}: Block weicht ab`);
  if (!t.includes(`js/galerie.js?v=${VERSION}`)) abweichend.push(`${datei}: Skript-Version nicht ${VERSION}`);
}
pruefe('Jeder Block entspricht dem Generator', abweichend.length === 0,
  abweichend.length ? abweichend.slice(0, 4).join(' | ') : `${dateien.length} Dateien gleich`);

/* Zweiter, anders gebauter Weg: nicht den Generator fragen, sondern die
   Alternativtexte direkt aus der JSON im HTML wiederfinden. Faellt ein
   Text beim Erzeugen weg oder wird doppelt eingesetzt, sieht man es hier,
   auch wenn der Generator selbst falsch waere. */
const daten = JSON.parse(fs.readFileSync(path.join(WURZEL, 'src/_data/galerien.json'), 'utf8'));
let fehlende = [];
for (const [i, datei] of dateien.entries()) {
  let t = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const { schluessel } = teileAuf(datei);
  if (GEGENPROBE && i === 1) {
    const erster = (daten[schluessel].bilder || daten[schluessel])[0].alt;
    t = t.split(erster).join('WEG');
  }
  const bilder = (daten[schluessel].bilder || daten[schluessel]).slice(0, 4);
  for (const b of bilder) {
    const alt = b.alt.replace(/&/g, '&amp;');
    if (!t.includes(alt)) fehlende.push(`${datei}: "${b.alt.slice(0, 30)}..."`);
  }
}
pruefe('Alle Alternativtexte stehen im HTML', fehlende.length === 0,
  fehlende.length ? fehlende.slice(0, 3).join(' | ') : `${dateien.length * 4} Texte gefunden`);

console.log(`\nErgebnis: ${fehler ? `${fehler} Prüfung(en) fehlgeschlagen` : `alle ${ok} Prüfungen bestanden`}`);
process.exit(fehler ? 1 : 0);
