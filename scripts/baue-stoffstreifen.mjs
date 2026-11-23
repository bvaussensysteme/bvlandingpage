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

/* Die Farbwelten stehen in js/markisenstoffe.js, der einzigen Liste
 * im Projekt. Sie wird hier gelesen statt abgeschrieben: Zwei Listen
 * mit denselben Angaben laufen frueher oder spaeter auseinander.
 *
 * ANLASS (23.11.2026). Zuerst stand in der Beschriftung die Stoffart
 * ("Acrylstoff"). Ansage des Betreibers: "da soll nicht acrylstoff
 * oderso stehen sondern der farbname, das mit acrylstoff etc steht
 * dann auf der grossen markisenstoffe seite".
 *
 * WAS ES AN FARBNAMEN WIRKLICH GIBT: Die 53 Dachstoffe tragen in der
 * Stoffkarte keine einzelnen Farbnamen, sondern gehoeren zu einer von
 * sechs Farbwelten (Sunset, Beach, Ocean, Mountain, Canyon,
 * Greenery). Nur die 44 ZIP-Stoffe haben eigene Namen wie "UNI
 * SCHWARZ". Erfunden wird hier nichts: Was in der Beschriftung steht,
 * steht so in der Liste. */
export function farbwelten() {
  const roh = readFileSync(WURZEL + 'js/markisenstoffe.js', 'utf8');
  const anfang = roh.indexOf('dach:');
  const ende = roh.indexOf('zip:');
  if (anfang < 0 || ende < 0 || ende < anfang) {
    console.error('js/markisenstoffe.js: die Abschnitte "dach:" und "zip:" sind nicht zu finden.');
    process.exit(2);
  }
  /* Bevorzugt den echten Farbnamen (Feld n), sonst die Gruppe (f).
   * Stand 23.11.2026 haben die 53 Dachstoffe KEIN n, deshalb steht
   * dort die Gruppe. Ansage des Betreibers: "das sind die Stoff
   * unterordnungen aber ich meine wirklich den stofffarbnamen".
   * Sobald die Namen in js/markisenstoffe.js stehen, nimmt die
   * Beschriftung sie von selbst, ohne Aenderung an diesem Skript. */
  const karte = new Map();
  const rx = /\{\s*c:\s*'([^']+)'([^}]*)\}/g;
  let m;
  const teil = roh.slice(anfang, ende);
  while ((m = rx.exec(teil)) !== null) {
    const rest = m[2];
    const name = /\bn:\s*'([^']+)'/.exec(rest);      // Herstellername
    const farbe = /\bfb:\s*'([^']+)'/.exec(rest);    // unsere Beschreibung
    const gruppe = /\bf:\s*'([^']+)'/.exec(rest);    // Kollektionsgruppe
    const wert = name ? name[1] : (farbe ? farbe[1] : (gruppe ? gruppe[1] : null));
    if (wert) karte.set(m[1], { text: wert, istName: !!(name || farbe) });
  }
  return karte;
}

export function dessins() {
  return readFileSync(WURZEL + 'scripts/stoff-reihenfolge.txt', 'utf8')
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z && !z.startsWith('#'));
}

export function block() {
  const zeilen = [ANFANG];
  const welten = farbwelten();
  const ohne = dessins().filter((d) => !welten.has(d));
  if (ohne.length) {
    console.error('Keine Farbwelt in js/markisenstoffe.js fuer: ' + ohne.join(', '));
    process.exit(2);
  }
  const ohneNamen = dessins().filter((d) => !welten.get(d).istName);
  if (ohneNamen.length) {
    console.log(`Hinweis: ${ohneNamen.length} von ${dessins().length} Dessins haben weder`
      + ' Herstellernamen (n) noch gemessene Farbe (fb). Dort steht die Gruppe.');
  }
  dessins().forEach((d, i) => {
    const welt = welten.get(d).text;
    const faul = i < SOFORT ? '' : ' loading="lazy"';
    zeilen.push('      <li>');
    zeilen.push(`        <a class="galerie-kachel" href="/stoffe.html" data-nr="${i}"`);
    zeilen.push(`           aria-label="Dessin ${d}, ${welt}, auf der Stoffseite ansehen">`);
    zeilen.push(`          <img src="/images/stoffe/startseite/${d}.webp"`);
    zeilen.push(`               alt="Markisenstoff Dessin ${d}, ${welt}, Musterausschnitt"`);
    zeilen.push(`               width="240" height="240"${faul} decoding="async">`);
    /* Die Beschriftung, die beim Drueberfahren erscheint. Ansage des
     * Betreibers vom 23.11.2026: "wenn man ueber nen stoff mit der
     * maus faehrt ne info steht welcher das is mit code".
     * aria-hidden, weil das aria-label des Links dasselbe schon sagt:
     * Ohne das liest eine Vorlesesoftware den Namen zweimal. */
    zeilen.push(`          <span class="kachel-info" aria-hidden="true"><b>${d}</b>${welt}</span>`);
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
