#!/usr/bin/env node
/* Steht der Heldenbereich der Startseite sofort und ruhig da?
 *
 * WARUM (26.11.2026, Paket B9)
 * Gemessen gegen die Vorschau, gedrosseltes Handyprofil: Das erste
 * Bild stand nach 2,66 s, der Browser meldete als LCP aber 9,31 s, weil
 * das Bild alle 6,5 s wechselte. Die Ueberschrift blieb bis 4,07 s auf
 * Deckkraft 0, weil die Einblendung an DOMContentLoaded hing und damit
 * auf alle verzoegerten Skripte wartete. Die Knopfreihe war erst nach
 * 1140 ms da, die Claim-Woerter kamen mit Ueberschwinger. Die ruhige
 * Fahrt lief auf vier bildschirmgrossen Ebenen, drei davon unsichtbar.
 * Entscheidung des Betreibers: siehe docs/entscheidungen.md, 26.11.2026.
 *
 * WIE: Startseite bei 390 und 1280 px laden und ohne Eingabe 8 s warten.
 * Gemessen wird: letzter LCP-Eintrag; kleinste Deckkraft der
 * Ueberschrift in jedem Bild ab ihrem Erscheinen; Ende und Kurve jeder
 * Einblendung im Startbild; Zahl der Bildebenen und der laufenden
 * Fahrten. Dann eine Mausbewegung, 7,5 s warten: jetzt muessen die
 * weiteren Bilder da sein, ein spaeteres sichtbar, weiter genau eine
 * Fahrt. Zuletzt mit "Bewegung reduzieren": das erste Bild muss
 * sichtbar sein.
 *
 * GEGENPROBE: --gegenprobe liefert index.html, js/karussell.js und
 * css/style.css im Stand vor B9 (Commit 88de4f0) aus git. Dann MUSS
 * jede der beiden Breiten auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const ALT = '88de4f0';
const PORT = 8500 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();

const alt = (p) => execFileSync('git', ['show', `${ALT}:${p}`], { cwd: W, encoding: 'utf8', maxBuffer: 64 << 20 });
async function kontext(opt) {
  const ctx = await br.newContext(opt);
  await ctx.route(/web3forms|formspree|\/api\//i, (r) => r.abort());
  if (GEGENPROBE) {
    const dateien = { 'index.html': 'text/html', 'js/karussell.js': 'text/javascript', 'css/style.css': 'text/css' };
    for (const [p, typ] of Object.entries(dateien)) {
      const inhalt = alt(p);
      const muster = p === 'index.html' ? /\/(index\.html)?(\?.*)?$/ : new RegExp('/' + p.replace(/[./]/g, '\\$&') + '(\\?.*)?$');
      await ctx.route(muster, (r) => r.fulfill({ contentType: typ + '; charset=utf-8', body: inhalt }));
    }
  }
  /* Laeuft vor jedem Skript der Seite: LCP mitschreiben, jedes Bild
     die Deckkraft der Ueberschrift und alle Einblendungen notieren. */
  await ctx.addInitScript(() => {
    const m = window.__held = { lcp: [], minUeber: 2, anim: new Map() };
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) m.lcp.push(Math.round(e.startTime)); })
        .observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
    const t0 = performance.now();
    (function schau() {
      const h = document.querySelector('.hero--neu .hs-heading');
      if (h) m.minUeber = Math.min(m.minUeber, parseFloat(getComputedStyle(h).opacity));
      if (document.getAnimations) for (const a of document.getAnimations()) {
        const z = a.effect && a.effect.target;
        if (!z || !z.closest || !z.closest('.hero--neu') || a.animationName === 'hintergrundFahrt') continue;
        if (m.anim.has(a)) continue;
        const t = a.effect.getTiming();
        /* Dauerschleifen (z. B. der Hinweispfeil "Alle Leistungen
           entdecken", heroScrollBounce) sind keine Einblendung. */
        if (t.iterations === Infinity) continue;
        const kf = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
        m.anim.set(a, {
          wer: (z.className || z.tagName).toString().slice(0, 30),
          ende: Math.round((t.delay || 0) + (typeof t.duration === 'number' ? t.duration : 0)),
          kurve: t.easing || '',
          skaliert: kf.some((k) => /scale/.test(k.transform || '')),
          ueberschrift: !!z.closest('.hs-heading')
        });
      }
      if (performance.now() - t0 < 3000) requestAnimationFrame(schau);
    })();
  });
  return ctx;
}

function ueberschwinger(kurve) {
  const c = /cubic-bezier\(([^)]+)\)/.exec(kurve);
  if (!c) return false;
  const [, y1, , y2] = c[1].split(',').map(Number);
  return y1 > 1 || y2 > 1 || y1 < 0 || y2 < 0;
}

const zustand = () => {
  const ebenen = [...document.querySelectorAll('.hero--neu .hs-slide--active .hs-slide-bg')];
  const fahrten = document.getAnimations().filter((a) => a.animationName === 'hintergrundFahrt' && a.playState === 'running');
  const sichtbar = ebenen.filter((e) => parseFloat(getComputedStyle(e).opacity) > 0.5);
  return {
    ebenen: ebenen.length,
    fahrten: fahrten.length,
    sichtbarWeiter: sichtbar.some((e) => e.classList.contains('hs-slide-bg--weiter')),
    fahrtAufSichtbarer: fahrten.every((a) => parseFloat(getComputedStyle(a.effect.target).opacity) > 0.5)
  };
};

const ergebnis = [];
try {
  for (const w of [390, 1280]) {
    const f = [];
    const ctx = await kontext({ viewport: { width: w, height: w < 500 ? 844 : 800 } });
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
    await pg.waitForTimeout(8000);
    const vor = await pg.evaluate(() => ({ lcp: window.__held.lcp, minUeber: window.__held.minUeber, anim: [...window.__held.anim.values()] }));
    const z1 = await pg.evaluate(zustand);
    const spaet = vor.lcp.filter((t) => t > 5000);
    if (spaet.length) f.push(`LCP-Eintrag nach ${spaet.join(', ')} ms (ohne Eingabe)`);
    if (vor.minUeber < 0.99) f.push(`Ueberschrift zeitweise Deckkraft ${vor.minUeber}`);
    if (vor.anim.some((a) => a.ueberschrift)) f.push('Ueberschrift wird eingeblendet');
    const lang = vor.anim.filter((a) => a.ende > 600);
    if (lang.length) f.push(`${lang.length} Einblendung(en) laenger als 600 ms (bis ${Math.max(...lang.map((a) => a.ende))} ms)`);
    const wipp = vor.anim.filter((a) => ueberschwinger(a.kurve) || a.skaliert);
    if (wipp.length) f.push(`${wipp.length} Einblendung(en) mit Ueberschwinger oder Skalierung`);
    if (z1.ebenen !== 1) f.push(`vor jeder Eingabe ${z1.ebenen} Bildebenen statt 1`);
    if (z1.fahrten !== 1) f.push(`vor jeder Eingabe ${z1.fahrten} laufende Fahrten statt 1`);

    await pg.mouse.move(w / 2, 300);
    await pg.mouse.move(w / 2 + 40, 340);
    await pg.waitForTimeout(7500);
    const z2 = await pg.evaluate(zustand);
    if (z2.ebenen !== 4) f.push(`nach Eingabe ${z2.ebenen} Bildebenen statt 4`);
    if (!z2.sichtbarWeiter) f.push('nach Eingabe kein spaeteres Bild sichtbar');
    if (z2.fahrten !== 1 || !z2.fahrtAufSichtbarer) f.push(`nach Eingabe ${z2.fahrten} laufende Fahrt(en), auf sichtbarer Ebene: ${z2.fahrtAufSichtbarer}`);
    await ctx.close();

    const rctx = await kontext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
    const rp = await rctx.newPage();
    await rp.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
    await rp.waitForTimeout(1500);
    const r = await rp.evaluate(() => {
      const b = document.querySelector('.hero--neu .hs-slide--active .hs-slide-bg');
      const h = document.querySelector('.hero--neu .hs-heading');
      return { bild: b ? parseFloat(getComputedStyle(b).opacity) : -1, ueber: h ? parseFloat(getComputedStyle(h).opacity) : -1 };
    });
    if (r.bild < 0.99) f.push(`Bewegung reduziert: erstes Bild Deckkraft ${r.bild}`);
    if (r.ueber < 0.99) f.push(`Bewegung reduziert: Ueberschrift Deckkraft ${r.ueber}`);
    await rctx.close();

    const lcpLetzt = vor.lcp.length ? vor.lcp[vor.lcp.length - 1] : '-';
    const endeMax = vor.anim.length ? Math.max(...vor.anim.map((a) => a.ende)) : 0;
    ergebnis.push(!f.length);
    console.log(`  ${f.length ? 'FEHLER' : 'ok    '}  ${String(w).padEnd(5)} LCP ${lcpLetzt} ms, Einblendung bis ${endeMax} ms, Ebenen ${z1.ebenen}->${z2.ebenen}, Fahrten ${z1.fahrten}/${z2.fahrten}  ${f.join('; ')}`);
  }
} finally { await br.close(); srv.kill(); }

if (GEGENPROBE) {
  const ok = ergebnis.every((x) => !x);
  console.log('\nErgebnis: ' + (ok ? `die Gegenprobe faellt bei allen ${ergebnis.length} Breiten auf` : 'GEGENPROBE VERSAGT'));
  process.exit(ok ? 0 : 1);
}
const rot = ergebnis.filter((x) => !x).length;
console.log('\nErgebnis: ' + (rot ? `${rot} von ${ergebnis.length} Breiten mit Fehlern` : `alle ${ergebnis.length} Breiten in Ordnung`));
process.exit(rot ? 1 : 0);
