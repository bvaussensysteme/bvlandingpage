#!/usr/bin/env node
/* Hat jedes sichtbare Eingabefeld einen Namen fuer Vorlesesoftware?
 *
 * WARUM (25.11.2026): Im Widerrufsformular hatten alle sieben
 * Beschriftungen kein for und die Felder keine id; Vorlesesoftware las
 * die Felder ohne Namen, ein Klick auf die Beschriftung setzte den
 * Cursor nicht ins Feld (WCAG 1.3.1, 3.3.2, 4.1.2). Mit Freigabe des
 * Betreibers verknuepft, Wortlaut unveraendert.
 *
 * WIE: Jede ausgelieferte Seite im Browser laden und jedes sichtbare
 * input, select und textarea pruefen: es braucht eine verknuepfte
 * Beschriftung (el.labels), aria-label oder aria-labelledby. Felder,
 * die erst ein Skript nach einer Bedienung erzeugt (Anfrage-Assistent ab
 * Schritt 2), sieht diese Pruefung nicht; dafuer gibt es
 * pruefe-assistent-tastatur.mjs.
 *
 * GEGENPROBE: --gegenprobe liefert widerruf.html im Stand vor der
 * Verknuepfung (Commit aa947ee) aus git. Dann MUSS sie auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const AUS = new Set(['node_modules', '.git', 'src', 'scripts', 'docs', 'worker', '.claude']);
const ignoriert = readFileSync(join(W, '.assetsignore'), 'utf8').split('\n').map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
const wirdAusgeliefert = (rel) => !ignoriert.some((m) => {
  const k = m.replace(/^\//, '').replace(/\/\*?$/, '');
  if (!k) return false;
  if (k.includes('*')) { const re = new RegExp('^' + k.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'); return re.test(rel) || re.test(rel.split('/').pop()); }
  return rel === k || rel.startsWith(k + '/') || rel.split('/').pop() === k;
});
const seiten = (d) => readdirSync(d).flatMap((e) => AUS.has(e) ? [] : statSync(join(d, e)).isDirectory() ? seiten(join(d, e)) : e.endsWith('.html') ? [join(d, e)] : []);
const liste = GEGENPROBE ? ['widerruf.html'] : seiten(W).map((p) => relative(W, p)).filter(wirdAusgeliefert);

const PORT = 8400 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route(/web3forms|formspree|\/api\/kontakt|googletagmanager|metricool/i, (r) => r.abort());
if (GEGENPROBE) {
  const alt = execFileSync('git', ['show', 'aa947ee:widerruf.html'], { cwd: W, encoding: 'utf8' });
  await ctx.route('**/widerruf.html', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: alt }));
}
let felder = 0; const funde = [];
try {
  for (const rel of liste) {
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/${rel}`, { waitUntil: 'load' }).catch(() => {});
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => [...document.querySelectorAll('input, select, textarea')].filter((e) => {
      if (e.type === 'hidden' || e.name === 'botcheck') return false;
      const s = getComputedStyle(e);
      return s.display !== 'none' && s.visibility !== 'hidden' && e.closest('[hidden]') === null;
    }).map((e) => ({ name: e.name || e.id || e.type, ok: e.labels.length > 0 || !!e.getAttribute('aria-label') || !!e.getAttribute('aria-labelledby') })));
    felder += r.length;
    for (const f of r) if (!f.ok) funde.push(rel + ': Feld "' + f.name + '" ohne Namen');
    await pg.close();
  }
} finally { await br.close(); srv.kill(); }
console.log((GEGENPROBE ? 'Gegenprobe (widerruf.html aus aa947ee): ' : '') + felder + ' sichtbare Felder auf ' + liste.length + ' Seite(n)');
for (const f of funde) console.log('  FEHLER  ' + f);
if (GEGENPROBE) { console.log('Ergebnis: ' + (funde.length ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT')); process.exit(funde.length ? 0 : 1); }
console.log('Ergebnis: ' + (funde.length ? funde.length + ' Feld(er) ohne Namen' : 'jedes sichtbare Feld hat einen Namen'));
process.exit(funde.length ? 1 : 0);
