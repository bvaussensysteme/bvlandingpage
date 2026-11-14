#!/usr/bin/env node
/* Prueft: Laeuft sichtbarer Text aus seinem Kasten heraus?
 *
 * Hintergrund: Am 14.11.2026 stand im Kopf von sieben Ortsseiten bei
 * 390 px "Terrassenueberdach" und dann nichts mehr. Die Ueberschrift
 * brauchte 451 px in einem 362 px breiten Kasten. Die Seite scrollte
 * dabei NICHT waagerecht, es gab also kein Zeichen, dass etwas fehlt.
 * Gefunden hat es ein Pruefer von Hand; keine der 56 Pruefungen sah es.
 *
 * Deutsche Komposita sind lang. Diese Pruefung gehoert deshalb
 * dauerhaft dazu und nicht nur einmal nach dem Vorfall.
 *
 * Gemessen wird scrollWidth gegen clientWidth je Element. Ein Element
 * gilt als beschnitten, wenn sein Inhalt breiter ist als sein Kasten
 * UND der Ueberhang nicht gewollt ist (Scrollbereiche sind ausgenommen,
 * siehe AUSGENOMMEN unten).
 *
 * Gegenprobe: node scripts/pruefe-umbruch.mjs --gegenprobe
 * setzt eine Ueberschrift auf eine Groesse, bei der sie nicht mehr
 * passt, und erwartet, dass die Pruefung anschlaegt.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const PORT = 8841;
const BREITEN = [320, 390];
const gegenprobe = process.argv.includes('--gegenprobe');

/* AUSGENOMMEN: Elemente, deren Ueberhang Absicht ist. Ein waagerecht
 * scrollbarer Kasten (Tabelle, Bildergalerie) ist kein Fehler, sondern
 * eine Bedienidee. Erkannt wird das an overflow-x. */
const SELEKTOR = 'h1, h2, h3, h4, button, .btn, a.btn, .leistung-link, label, strong';

function seiten() {
  const liste = [];
  for (const d of ['.', 'produkte', 'ratgeber']) {
    const pfad = join(WURZEL, d);
    if (!existsSync(pfad)) continue;
    for (const f of readdirSync(pfad)) {
      if (!f.endsWith('.html')) continue;
      if (f.startsWith('entwurf') || f === '_template.html' || f === 'vorschau.html') continue;
      liste.push(d === '.' ? f : `${d}/${f}`);
    }
  }
  return liste.sort();
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
process.on('exit', () => server.kill());
await new Promise((r) => setTimeout(r, 900));

function messung(sel) {
  const raus = [];
  for (const n of document.querySelectorAll(sel)) {
    const stil = getComputedStyle(n);
    if (stil.display === 'none' || stil.visibility === 'hidden') continue;
    if (!n.offsetParent && stil.position !== 'fixed') continue;
    /* Gewollter Scrollbereich: am Element selbst oder an einem Elternteil */
    let gewollt = false;
    for (let e = n; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') { gewollt = true; break; }
    }
    if (gewollt) continue;
    if (n.scrollWidth - n.clientWidth > 2) {
      raus.push({
        tag: n.tagName.toLowerCase(),
        text: (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 55),
        inhalt: n.scrollWidth, kasten: n.clientWidth
      });
    }
  }
  return raus;
}

const browser = await chromium.launch();
const seite = await browser.newPage();
let fehler = 0, geprueft = 0;

async function pruefe(datei, breite, vorher) {
  await seite.setViewportSize({ width: breite, height: 900 });
  await seite.goto(`http://127.0.0.1:${PORT}/${datei}`, { waitUntil: 'load' });
  await seite.waitForTimeout(220);
  if (vorher) await seite.evaluate(vorher);
  return seite.evaluate(messung, SELEKTOR);
}

if (gegenprobe) {
  console.log('Gegenprobe: eine Ueberschrift wird kuenstlich zu gross gesetzt.');
  const ohne = await pruefe('index.html', 390, null);
  const mit = await pruefe('index.html', 390, () => {
    const h = document.querySelector('h1');
    h.style.fontSize = '140px';
    h.style.whiteSpace = 'nowrap';
    h.style.overflow = 'hidden';
  });
  const ok = ohne.length === 0 && mit.length > 0;
  console.log(`  ohne Eingriff: ${ohne.length} Befunde`);
  console.log(`  mit Eingriff:  ${mit.length} Befunde`);
  console.log(ok ? '\nGegenprobe: der eingebaute Fehler wurde erkannt.'
                 : '\nGegenprobe FEHLGESCHLAGEN: die Pruefung schlaegt nicht an.');
  await browser.close();
  process.exit(ok ? 0 : 1);
}

for (const datei of seiten()) {
  for (const breite of BREITEN) {
    geprueft++;
    const raus = await pruefe(datei, breite, null);
    if (raus.length === 0) continue;
    for (const r of raus) {
      console.log(`  FEHLER  ${datei} bei ${breite}px: <${r.tag}> "${r.text}" braucht ${r.inhalt}px in ${r.kasten}px`);
      fehler++;
    }
  }
}

await browser.close();
console.log(`\n${geprueft} Seiten-Breiten-Kombinationen geprueft.`);
console.log(fehler === 0
  ? 'Ergebnis: kein Text laeuft aus seinem Kasten'
  : `Ergebnis: ${fehler} Stelle(n) beschnitten, vor dem Veroeffentlichen beheben`);
process.exit(fehler === 0 ? 0 : 1);
