#!/usr/bin/env node
/* ============================================================
   Schreibt den Stoffstreifen der Startseite neu.

   ANLASS (22.11.2026). Erst waren es acht Muster von Hand im
   Quelltext. Ansage des Betreibers: "mach nicht nur 8 Muster zum
   Durchblaettern, sondern schon, ich sag mal so, kannst ja auch
   alle" und "die beliebten Farbmuster sollen ganz vorne sein und
   je nach Beliebtheitsgrad dann weiter wischen".

   53 Kacheln von Hand im HTML waeren rund 320 Zeilen, die bei jeder
   Umsortierung neu geschrieben werden muessten. Deshalb ein
   Erzeuger, wie ihn die Staedteseiten schon haben
   (scripts/baue-staedte-galerie.mjs).

   DIE REIHENFOLGE steht in scripts/stoff-reihenfolge.txt, eine
   Zeile je Dessin. Dort steht auch, warum sie nicht gemessen ist.

   Aufruf:
     node scripts/baue-stoffstreifen.mjs            schreibt index.html
     node scripts/baue-stoffstreifen.mjs --pruefen  nur vergleichen
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const WURZEL = new URL('..', import.meta.url).pathname;
const PRUEFEN = process.argv.includes('--pruefen');
export const ANFANG = '      <!-- ANFANG Stoffmuster (erzeugt von scripts/baue-stoffstreifen.mjs) -->';
export const ENDE = '      <!-- ENDE Stoffmuster -->';

/* Die ersten drei Kacheln stehen sofort im Bild und werden normal
   geladen. Alles weitere liegt rechts ausserhalb und wird erst beim
   Wischen geholt: 53 Bilder sind zusammen 220 KB, aber niemand sieht
   sie alle. */
const SOFORT = 3;

export function dessins() {
  return readFileSync(WURZEL + 'scripts/stoff-reihenfolge.txt', 'utf8')
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z && !z.startsWith('#'));
}

export function block() {
  const zeilen = [ANFANG];
  dessins().forEach((d, i) => {
    const art = d.startsWith('AC') ? 'Acrylstoff' : 'Polyesterstoff';
    const faul = i < SOFORT ? '' : ' loading="lazy"';
    zeilen.push('      <li>');
    zeilen.push(`        <a class="galerie-kachel" href="/stoffe.html" data-nr="${i}"`);
    zeilen.push(`           aria-label="${art} Dessin ${d} auf der Stoffseite ansehen">`);
    zeilen.push(`          <img src="/images/stoffe/startseite/${d}.webp"`);
    zeilen.push(`               alt="${art} Dessin ${d}, Musterausschnitt"`);
    zeilen.push(`               width="240" height="240"${faul} decoding="async">`);
    zeilen.push('        </a>');
    zeilen.push('      </li>');
  });
  zeilen.push(ENDE);
  return zeilen.join('\n');
}

const pfad = WURZEL + 'index.html';
const alt = readFileSync(pfad, 'utf8');
const a = alt.indexOf(ANFANG);
const e = alt.indexOf(ENDE);
if (a < 0 || e < 0) {
  console.error('Die Marken fehlen in index.html. Erwartet:\n' + ANFANG + '\n' + ENDE);
  process.exit(2);
}
const neu = alt.slice(0, a) + block() + alt.slice(e + ENDE.length);

/* Jedes Bild muss auch wirklich dasein. Ein Dessin in der
   Reihenfolge ohne Datei waere ein leerer Kasten auf der Startseite. */
const fehlend = dessins().filter(
  (d) => !existsSync(WURZEL + 'images/stoffe/startseite/' + d + '.webp'));
if (fehlend.length) {
  console.error('Keine Miniatur fuer: ' + fehlend.join(', ')
    + '\nErst "bash scripts/baue-stoff-miniaturen.sh" laufen lassen.');
  process.exit(2);
}

if (PRUEFEN) {
  if (neu === alt) { console.log(`ok: ${dessins().length} Kacheln, index.html stimmt mit der Reihenfolge ueberein`); }
  else { console.error('FEHLER: index.html weicht vom Erzeuger ab. "node scripts/baue-stoffstreifen.mjs" laufen lassen.'); process.exit(1); }
} else {
  writeFileSync(pfad, neu);
  console.log(`index.html geschrieben: ${dessins().length} Kacheln, davon ${SOFORT} sofort geladen`);
}
