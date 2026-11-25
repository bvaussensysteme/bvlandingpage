#!/usr/bin/env node
/* Haben die handgepflegten Ortsseiten und danke.html einen lesbaren,
 * bedienbaren Kopf?
 *
 * WARUM ES DIESE PRUEFUNG GIBT (25.11.2026, Paket A1)
 * Die 14 Ortsseiten (carport-*, pergola-*, terrassenueberdachung-*)
 * und danke.html trugen einen .site-header, fuer den es in keinem
 * Stilblatt eine Regel gab. Gemessen: weisse Menueschrift auf hellem
 * Grund, 1,07:1; am Handy 0 von 3 Menuepunkten sichtbar, kein Menue;
 * die Leiste scrollte weg. carport-koblenz.html stand schon in
 * pruefe-mitwachsend.mjs, aber das misst Ueberstand und Flaechen, nicht
 * den Kopf. Gemeldet hat es niemand.
 *
 * WAS SIE PRUEFT, je Seite bei 390 und 1280 px
 *   - es gibt eine .navbar und keinen .site-header mehr
 *   - die Leiste bleibt beim Scrollen oben
 *   - 1280: mindestens drei Menuepunkte sichtbar, jeder mit Kontrast
 *     >= 4,5:1 gegen seinen eigenen oder den Leistengrund
 *   - 390: Menueknopf sichtbar, ein Tippen oeffnet ein Menue mit
 *     sichtbaren Eintraegen
 *   - kein Verweis /#x im Kopf, dessen Ziel es auf der Startseite nicht gibt
 *
 * GEGENPROBE: --gegenprobe liefert die 15 Seiten so aus, wie sie vor A1
 * waren (Stand des Commits 56e5937, aus git gelesen, ueber eine
 * Playwright-Route, ohne eine Datei zu aendern). Dann MUSS jede der 15
 * Seiten auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const require = createRequire(join(WURZEL, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const ALT = '56e5937';

const SEITEN = readdirSync(WURZEL)
  .filter((f) => /^(carport|pergola|terrassenueberdachung)-.+\.html$/.test(f)).sort()
  .concat('danke.html');
if (SEITEN.length < 15) { console.log('  FEHLER  nur ' + SEITEN.length + ' Seiten gefunden, erwartet 15'); process.exit(1); }

const startIds = new Set([...readFileSync(join(WURZEL, 'index.html'), 'utf8')
  .matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const PORT = 8800 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();

const fehlerJeSeite = new Map(SEITEN.map((s) => [s, []]));
try {
  for (const seite of SEITEN) for (const breite of [390, 1280]) {
    const ctx = await br.newContext({ viewport: { width: breite, height: 800 } });
    await ctx.route(/web3forms|formspree/i, (r) => r.abort());
    if (GEGENPROBE) {
      const alt = execFileSync('git', ['show', ALT + ':' + seite], { cwd: WURZEL, encoding: 'utf8' });
      await ctx.route('**/' + seite, (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: alt }));
    }
    const pg = await ctx.newPage();
    const f = fehlerJeSeite.get(seite);
    const melde = (t) => f.push(breite + ' px: ' + t);
    await pg.goto(`http://127.0.0.1:${PORT}/${seite}`, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    await pg.evaluate(() => document.querySelector('#cookieBanner')?.remove());

    const z = await pg.evaluate(() => {
      const n = document.querySelector('.navbar');
      const rgb = (c) => { const m = c.match(/[\d.]+/g); return m && (m.length < 4 || +m[3] > 0.5) ? m.slice(0, 3).map(Number) : null; };
      let grund = null;
      for (let el = n; el && !grund; el = el.parentElement) grund = rgb(getComputedStyle(el).backgroundColor);
      const punkte = n ? [...n.querySelectorAll('.nav-links a')].filter((a) => {
        const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== 'hidden';
      }).map((a) => ({ text: a.textContent.trim(), farbe: rgb(getComputedStyle(a).color), grund: rgb(getComputedStyle(a).backgroundColor) })) : [];
      const kopfVerweise = [...document.querySelectorAll('.navbar a, .mobile-menu a')].map((a) => a.getAttribute('href'));
      const hb = document.querySelector('.hamburger');
      return { navbar: !!n, alterKopf: !!document.querySelector('.site-header'), grund, punkte, kopfVerweise,
               hamburger: !!hb && getComputedStyle(hb).display !== 'none' && hb.getBoundingClientRect().width > 0 };
    });
    if (!z.navbar) { melde('keine .navbar'); await ctx.close(); continue; }
    if (z.alterKopf) melde('alter .site-header steht noch da');
    for (const h of z.kopfVerweise) {
      const m = h && h.match(/^\/#(.+)$/);
      if (m && !startIds.has(m[1])) melde('Verweis ' + h + ' zeigt ins Leere');
    }
    if (breite === 1280) {
      if (z.punkte.length < 3) melde('nur ' + z.punkte.length + ' Menuepunkte sichtbar');
      for (const p of z.punkte) {
        const k = kontrast(p.farbe, p.grund || z.grund || [255, 255, 255]);
        if (k < 4.5) melde('"' + p.text + '" Kontrast ' + k.toFixed(2) + ':1');
      }
    } else {
      if (!z.hamburger) melde('kein sichtbarer Menueknopf');
      else {
        await pg.click('.hamburger');
        await pg.waitForTimeout(600);
        const sichtbar = await pg.evaluate(() => {
          const m = document.querySelector('.mobile-menu');
          return m ? [...m.querySelectorAll('a')].filter((a) => { const r = a.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }).length : 0;
        });
        if (sichtbar === 0) melde('Menueknopf oeffnet kein Menue');
        await pg.keyboard.press('Escape');
        await pg.waitForTimeout(400);
      }
    }
    await pg.evaluate(() => scrollTo(0, 1500));
    await pg.waitForTimeout(300);
    const oben = await pg.evaluate(() => Math.round(document.querySelector('.navbar').getBoundingClientRect().top));
    const gescrollt = await pg.evaluate(() => scrollY);
    if (gescrollt > 100 && Math.abs(oben) > 1) melde('Leiste scrollt weg (' + oben + ' px)');
    await ctx.close();
  }
} finally {
  await br.close();
  srv.kill();
}

console.log(GEGENPROBE
  ? 'Gegenprobe: Seiten im Stand vor A1 (' + ALT + '), jede MUSS auffallen'
  : 'Kopf der Ortsseiten und von danke.html, 390 und 1280 px');
let rot = 0;
for (const [s, f] of fehlerJeSeite) {
  if (f.length) rot++;
  console.log('  ' + (f.length ? 'FEHLER' : 'ok    ') + '  ' + s + (f.length ? '\n            ' + f.join('\n            ') : ''));
}
if (GEGENPROBE) {
  const ok = rot === SEITEN.length;
  console.log('\nErgebnis: ' + (ok ? 'die Gegenprobe faellt auf allen ' + rot + ' Seiten auf'
    : 'GEGENPROBE VERSAGT, nur ' + rot + ' von ' + SEITEN.length + ' Seiten fallen auf'));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot === 0 ? 'alle ' + SEITEN.length + ' Seiten in Ordnung' : rot + ' von ' + SEITEN.length + ' Seiten mit Fehlern'));
process.exit(rot === 0 ? 0 : 1);
