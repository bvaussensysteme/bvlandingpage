#!/usr/bin/env node
/* ============================================================
   DIASCHAU IN DEN LEISTUNGSKARTEN

   ANLASS (20.11.2026): Ansage des Betreibers, die Bilder sollen
   von allein weiterlaufen. Etwas, das von allein laeuft, ist in
   der Barrierefreiheit heikel, deshalb wird hier mehr geprueft
   als "es bewegt sich".

   GEPRUEFT WIRD:
     1. Sieben Leistungskarten tragen eine Bildliste, und jedes
        genannte Bild liegt wirklich im Repository.
     2. Ohne JavaScript steht das alte Bild unveraendert da.
     3. Das Bild wechselt von allein.
     4. WCAG 2.2, 2.2.2: Es laesst sich anhalten, der Knopf ist
        44 x 44 px gross, traegt einen Namen und aria-pressed,
        und nach dem Anhalten bewegt sich nichts mehr.
     5. prefers-reduced-motion: dann wechselt gar nichts von
        allein.
     6. Wischen blaettert von Hand weiter.
     7. Keine Javascript-Fehler.

   Aufruf:     node scripts/pruefe-diaschau.mjs
   Gegenprobe: node scripts/pruefe-diaschau.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8811;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(52)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(52)} ${beleg || ''}`); fehler++; }
};

/* --- Teil 1: ohne Browser --- */
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const listen = [...html.matchAll(/data-diaschau="([^"]*)"/g)].map((m) =>
  JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&')));
p('Sieben Leistungskarten tragen eine Bildliste', listen.length === 7, `${listen.length} gefunden`);
let fehlend = [], kurz = [];
for (const l of listen) {
  if (l.length < 2) kurz.push(l.length);
  for (const b of l) if (!fs.existsSync(path.join(WURZEL, b.d))) fehlend.push(b.d);
}
p('Jedes genannte Bild liegt im Repository', fehlend.length === 0,
  fehlend.length ? fehlend.slice(0, 2).join(', ') : `${listen.flat().length} Bilder`);
p('Keine Liste mit weniger als zwei Bildern', kurz.length === 0, kurz.join(', ') || 'alle >= 2');
p('Ohne JavaScript steht ein Bild in der Karte',
  (html.match(/<div class="leistung-img"[^>]*><picture>/g) || []).length >= 7,
  'picture-Element vorhanden');

/* --- Teil 2: im Browser --- */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

async function seite(ruhig) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: ruhig ? 'reduce' : 'no-preference',
  });
  const pg = await ctx.newPage();
  const laerm = [];
  pg.on('console', (m) => { if (m.type() === 'error') laerm.push(m.text().slice(0, 70)); });
  if (GEGEN) {
    /* Eingebauter Fehler: Das Skript wird blockiert. Dann MUSS
       auffallen, dass nichts wechselt und kein Knopf da ist. */
    await pg.route('**/js/diaschau.js*', (r) => r.abort());
  }
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await pg.bringToFront();
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
  await pg.waitForTimeout(400);
  return { ctx, pg, laerm };
}
const lesen = (pg) => pg.evaluate(() => {
  const e = document.querySelector('.leistung-img[data-diaschau]');
  const k = e && e.querySelector('.diaschau-halt');
  const r = k && k.getBoundingClientRect();
  return {
    knoepfe: document.querySelectorAll('.diaschau-halt').length,
    src: e ? e.querySelector('img').getAttribute('src') : '',
    alt: e ? e.querySelector('img').getAttribute('alt') : '',
    name: k ? k.getAttribute('aria-label') : '',
    gedrueckt: k ? k.getAttribute('aria-pressed') : '',
    groesse: r ? Math.round(r.width) + 'x' + Math.round(r.height) : '',
  };
});

try {
  /* a) Normalfall */
  let { ctx, pg, laerm } = await seite(false);
  await pg.evaluate(() => {
    const e = document.querySelector('.leistung-img[data-diaschau]');
    if (e) e.scrollIntoView();
  });
  await pg.waitForTimeout(400);
  const start = await lesen(pg);
  p('Jede Karte bekommt einen Anhalten-Knopf', start.knoepfe === 7, `${start.knoepfe} von 7`);
  p('Der Knopf ist 44 x 44 px und heisst etwas',
    start.groesse === '44x44' && /anhalten/i.test(start.name), `${start.groesse}, "${start.name}"`);
  p('Der Knopf meldet seinen Zustand (aria-pressed)', start.gedrueckt === 'false', start.gedrueckt);
  await pg.waitForTimeout(6500);
  const spaeter = await lesen(pg);
  p('Das Bild wechselt von allein', start.src !== spaeter.src,
    spaeter.src.split('/').pop());
  p('Der Alternativtext wandert mit', spaeter.alt !== start.alt && spaeter.alt.length > 5,
    spaeter.alt.slice(0, 34));

  /* b) Anhalten */
  await pg.evaluate(() => {
    const k = document.querySelector('.diaschau-halt');
    if (k) k.click();   /* In der Gegenprobe gibt es ihn nicht. */
  });
  const angehalten = await lesen(pg);
  p('Nach dem Druck heisst der Knopf anders', /weiterlaufen/i.test(angehalten.name)
    && angehalten.gedrueckt === 'true', angehalten.name);
  await pg.waitForTimeout(6500);
  const danach = await lesen(pg);
  p('Angehalten bleibt angehalten (WCAG 2.2.2)', angehalten.src === danach.src,
    danach.src.split('/').pop());

  /* c) Wischen, nachdem wieder losgelaufen ist */
  await pg.evaluate(() => {
    const e = document.querySelector('.leistung-img[data-diaschau]');
    if (!e) return;
    const mk = (typ, x) => {
      const b = new Touch({ identifier: 1, target: e, clientX: x, clientY: 60 });
      e.dispatchEvent(new TouchEvent(typ, { bubbles: true, cancelable: true,
        touches: typ === 'touchend' ? [] : [b], changedTouches: [b] }));
    };
    mk('touchstart', 300); mk('touchmove', 120); mk('touchend', 120);
  });
  await pg.waitForTimeout(700);
  const gewischt = await lesen(pg);
  p('Wischen blaettert von Hand weiter', gewischt.src !== danach.src,
    gewischt.src.split('/').pop());
  p('Keine Javascript-Fehler', laerm.length === 0, laerm.slice(0, 1).join(' ') || 'Konsole still');
  await ctx.close();

  /* d) Bewegung reduziert */
  const zweit = await seite(true);
  await zweit.pg.evaluate(() => {
    const e = document.querySelector('.leistung-img[data-diaschau]');
    if (e) e.scrollIntoView();
  });
  const r1 = await lesen(zweit.pg);
  await zweit.pg.waitForTimeout(7000);
  const r2 = await lesen(zweit.pg);
  p('Mit "Bewegung reduzieren" wechselt nichts von allein', r1.src === r2.src,
    r1.src.split('/').pop());
  await zweit.ctx.close();
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `blockiertes Skript bemerkt (${fehler} Beanstandungen)` : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
