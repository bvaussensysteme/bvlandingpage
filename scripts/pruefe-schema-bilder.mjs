#!/usr/bin/env node
/* Prueft die Bild-URLs im Product-Schema der Produktseiten.
 *
 * ANLASS (19.11.2026, eigener Fehler). Beim Ergaenzen von "image" in den
 * sieben Galerieseiten habe ich den Ordnerpfad vergessen: Im Schema stand
 * https://bv-aussensysteme.de/carport-01.webp statt
 * .../images/portfolio/carport/carport-01.webp. Alle 21 URLs waren falsch.
 * Aufgefallen ist es erst beim Abruf der Vorschau, denn meine eigene
 * Gegenprobe suchte nur URLs, die "images/" enthielten. Sie konnte den
 * Fehler also gar nicht finden und meldete trotzdem "0 fehlende Dateien".
 * Genau das ist eine Pruefung, die nur die eigene Arbeit bestaetigt.
 *
 * Drei Dinge werden gemessen, jedes auf einem anderen Weg:
 *  1. Jede Schema-URL ist absolut und zeigt auf die eigene Domain.
 *  2. Die Datei liegt wirklich im Repository.
 *  3. Das Bild ist auf DERSELBEN Seite auch sichtbar eingebunden. Google
 *     verlangt, dass strukturierte Daten den sichtbaren Inhalt abbilden;
 *     ein Bild im Schema, das die Seite nicht zeigt, ist ein Verstoss.
 *
 * Aufruf:  node scripts/pruefe-schema-bilder.mjs [--gegenprobe]
 *
 * --gegenprobe baut drei Fehler IM SPEICHER ein, einen je Weg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGENPROBE = process.argv.includes('--gegenprobe');
const DOMAIN = 'https://bv-aussensysteme.de/';
let ok = 0, fehler = 0;
function p(name, gut, info) {
  if (gut) { ok++; console.log(`  ok      ${name.padEnd(52)} ${info || ''}`); }
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(52)} ${info || ''}`); }
}

const alle = fs.readdirSync(path.join(WURZEL, 'produkte'))
  .filter((f) => f.endsWith('.html') && f !== '_template.html').sort();
/* Fuer die Gegenprobe zaehlen nur Seiten, die ueberhaupt ein Schema-Bild
   haben. Sonst landet ein eingebauter Fehler auf einer Seite ohne
   Galerie und bleibt wirkungslos. Genau das ist beim ersten Versuch
   passiert. */
const mitBild = alle.filter((f) =>
  /"image":\s*\[/.test(fs.readFileSync(path.join(WURZEL, 'produkte', f), 'utf8')));
const seiten = alle;

let gesamt = 0, nichtAbsolut = [], fehlendeDatei = [], nichtSichtbar = [], kaputt = [];
for (const datei of seiten) {
  let t = fs.readFileSync(path.join(WURZEL, 'produkte', datei), 'utf8');
  if (GEGENPROBE) {
    /* Drei Fehler, jeder auf einer anderen Seite MIT Galerie, damit jeder
       Weg einzeln anschlaegt. */
    const i = mitBild.indexOf(datei);
    if (i === 0) t = t.replace(/"https:\/\/bv-aussensysteme\.de\/(images\/portfolio\/[^"]+)"/, '"/$1"');
    if (i === 1) t = t.replace(/("https:\/\/bv-aussensysteme\.de\/images\/portfolio\/[^"]+)\.webp"/, '$1-gibtsnicht.webp"');
    if (i === 2) t = t.replace(/(<img[^>]+src="\/images\/portfolio\/[^"]+)"/, '$1?weg"');
  }
  for (const m of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o;
    try { o = JSON.parse(m[1]); } catch (e) { kaputt.push(`${datei}: ${e.message.slice(0, 50)}`); continue; }
    for (const x of (Array.isArray(o) ? o : [o])) {
      if (!x || x['@type'] !== 'Product' || !x.image) continue;
      for (const u of [].concat(x.image)) {
        gesamt++;
        if (typeof u !== 'string' || !u.startsWith(DOMAIN)) { nichtAbsolut.push(`${datei}: ${u}`); continue; }
        const rel = u.slice(DOMAIN.length);
        if (!fs.existsSync(path.join(WURZEL, rel))) fehlendeDatei.push(`${datei}: ${rel}`);
        if (!t.includes(`src="/${rel}"`)) nichtSichtbar.push(`${datei}: ${rel}`);
      }
    }
  }
}

p('Alle JSON-LD-Bloecke sind gueltiges JSON', kaputt.length === 0, kaputt.slice(0, 2).join(' | '));
p('Es gibt ueberhaupt Schema-Bilder', gesamt > 0, `${gesamt} URLs auf ${seiten.length} Seiten`);
p('Jede Schema-URL ist absolut und auf eigener Domain', nichtAbsolut.length === 0,
  nichtAbsolut.length ? nichtAbsolut.slice(0, 2).join(' | ') : `${gesamt} geprueft`);
p('Jede Schema-URL zeigt auf eine vorhandene Datei', fehlendeDatei.length === 0,
  fehlendeDatei.length ? fehlendeDatei.slice(0, 2).join(' | ') : `${gesamt} Dateien da`);
p('Jedes Schema-Bild ist auf der Seite sichtbar eingebunden', nichtSichtbar.length === 0,
  nichtSichtbar.length ? nichtSichtbar.slice(0, 2).join(' | ') : `${gesamt} sichtbar`);

if (GEGENPROBE) {
  const alleDrei = nichtAbsolut.length > 0 && fehlendeDatei.length > 0 && nichtSichtbar.length > 0;
  console.log(`\nGegenprobe: ${alleDrei ? 'alle 3 eingebauten Fehler bemerkt' : 'NICHT alle Fehler bemerkt'}`);
  process.exit(alleDrei ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} Prüfung(en) fehlgeschlagen` : `alle ${ok} Prüfungen bestanden`}`);
process.exit(fehler ? 1 : 0);
