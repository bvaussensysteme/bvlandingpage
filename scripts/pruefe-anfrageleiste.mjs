#!/usr/bin/env node
/* Ist die Anfrageleiste am unteren Rand bedienbar, ohne dass sich ihre
 * Knoepfe gegenseitig verdecken?
 *
 * WARUM (25.11.2026, Paket A5)
 * Das Schliessen-Kreuz war 14,8 x 21 px (WCAG 2.5.8: 24 x 24) und lag
 * am Handy auf dem WhatsApp-Knopf, 271 bis 310 px² Ueberdeckung bei
 * 320 bis 390 px. Bei 320 px ragte "Kostenlos anfragen" 19 px links aus
 * dem Bildschirm. pruefe-mitwachsend.mjs scrollt nicht und sah die
 * Leiste deshalb nie.
 *
 * WIE: Seite laden, weit scrollen, bis die Leiste erscheint, und bei
 * fuenf Breiten messen: Kreuz mindestens 24 x 24 px; keine Ueberdeckung
 * mit den Knoepfen der Leiste; kein anderes fest positioniertes Element
 * beruehrt das Kreuz (rechts darueber schwebt die Konfigurator-Blase);
 * kein Knopf ragt aus dem Bildschirm.
 *
 * GEGENPROBE: --gegenprobe liefert css/style.css im Stand vor A5 (Commit
 * 5cfc4f8) aus git. Dann MUSS jede Messung bei 320 bis 390 px auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8500 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
const FAELLE = [[320, 'index'], [360, 'index'], [390, 'index'], [430, 'index'], [1280, 'index'], [390, 'produkte/carport']];
let rot = 0, schmalRot = 0, schmal = 0;
try {
  for (const [w, s] of FAELLE) {
    const ctx = await br.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(/web3forms|formspree|\/api\/kontakt/i, (r) => r.abort());
    if (GEGENPROBE) {
      const alt = execFileSync('git', ['show', '5cfc4f8:css/style.css'], { cwd: W, encoding: 'utf8', maxBuffer: 64 << 20 });
      await ctx.route('**/css/style.css*', (r) => r.fulfill({ contentType: 'text/css; charset=utf-8', body: alt }));
    }
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/${s}.html`, { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    await pg.evaluate(() => { document.querySelector('#cookieBanner')?.remove(); scrollTo(0, 2500); });
    await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => {
      const x = document.querySelector('.sticky-close');
      if (!x || !x.offsetParent) return { fehler: ['Leiste nach dem Scrollen nicht sichtbar'] };
      const b = x.getBoundingClientRect();
      const schnitt = (o) => Math.max(0, Math.min(b.right, o.right) - Math.max(b.left, o.left)) * Math.max(0, Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top));
      const kn = [...x.parentElement.querySelectorAll('.sticky-btns > *')];
      const f = [];
      if (b.width < 24 || b.height < 24) f.push(`Kreuz ${b.width.toFixed(1)} x ${b.height.toFixed(1)} px`);
      const ueber = Math.max(0, ...kn.map((e) => schnitt(e.getBoundingClientRect())));
      if (ueber > 0) f.push(`Kreuz ueberdeckt einen Knopf (${ueber.toFixed(0)} px²)`);
      const fest = [...document.querySelectorAll('body *')].filter((e) => e !== x && !e.contains(x) &&
        getComputedStyle(e).position === 'fixed' && getComputedStyle(e).display !== 'none' &&
        getComputedStyle(e).visibility !== 'hidden' && schnitt(e.getBoundingClientRect()) > 0);
      if (fest.length) f.push('Kreuz beruehrt ' + fest.map((e) => e.id || e.className.toString().slice(0, 24)).join(', '));
      const raus = kn.filter((e) => { const o = e.getBoundingClientRect(); return o.left < -0.5 || o.right > innerWidth + 0.5; });
      if (raus.length) f.push(raus.length + ' Knopf/Knoepfe ragen aus dem Bildschirm');
      return { fehler: f, mass: `${b.width.toFixed(0)}x${b.height.toFixed(0)}` };
    });
    const ok = !r.fehler.length;
    if (!ok) rot++;
    if (w <= 390 && s === 'index') { schmal++; if (!ok) schmalRot++; }
    console.log('  ' + (ok ? 'ok    ' : 'FEHLER') + '  ' + String(w).padEnd(5) + s.padEnd(18) + (r.mass ? 'Kreuz ' + r.mass + ' px  ' : '') + r.fehler.join('; '));
    await ctx.close();
  }
} finally { await br.close(); srv.kill(); }
if (GEGENPROBE) {
  const ok = schmalRot === schmal;
  console.log('\nErgebnis: ' + (ok ? 'die Gegenprobe faellt bei allen ' + schmal + ' schmalen Breiten auf' : 'GEGENPROBE VERSAGT'));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot ? rot + ' von ' + FAELLE.length + ' Messungen mit Fehlern' : 'alle ' + FAELLE.length + ' Messungen in Ordnung'));
process.exit(rot ? 1 : 0);
