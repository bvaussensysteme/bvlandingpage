#!/usr/bin/env node
/* Meldet der Anfrage-Assistent die erreichten Schritte, und NUR die?
 *
 * WARUM (26.11.2026, B8, Freigabe des Betreibers): Bisher war nur
 * "anfrage-gesendet" messbar, wo Leute aufhoeren nicht. Gemessen wird
 * jetzt der erreichte Schritt als Nummer und Name. Die
 * Datenschutzerklaerung (Abschnitt 19) sagt genau das; sie verspricht
 * auch, dass nie etwas Eingegebenes erfasst wird. Beides prueft dieses
 * Skript.
 *
 * WIE: Messpakete an /api/messung werden abgefangen, nichts geht hinaus.
 * Weg Terrassendach TDS, einige Schritte weiter, im Masse-Schritt wird
 * 4711 eingetippt. Dann muss jeder erreichte Schritt als 'anfrage-schritt'
 * mit steigender Nummer und Namen ankommen, auch wenn mehr als 20
 * Ereignisse anfallen; 4711 darf nirgends im Paket stehen und keine
 * Antwort in einer Schrittmeldung.
 *
 * GEGENPROBE: --gegenprobe liefert js/anfrage-wizard.js im Stand vor der
 * Messung (Commit 45871d9). Dann MUSS das Fehlen der Schritte auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8200 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route(/web3forms|formspree|\/api\/kontakt/i, (r) => r.abort());
const pakete = [];
await ctx.route('**/api/messung', async (r) => {
  try { pakete.push(r.request().postData() || ''); } catch (e) { pakete.push(''); }
  await r.fulfill({ status: 204, body: '' });
});
if (GEGENPROBE) {
  const alt = execFileSync('git', ['show', '45871d9:js/anfrage-wizard.js'], { cwd: W, encoding: 'utf8', maxBuffer: 64 << 20 });
  await ctx.route('**/js/anfrage-wizard.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: alt }));
}
const pg = await ctx.newPage();
const fehler = []; pg.on('pageerror', (e) => fehler.push(e.message));
let rot = 0;
const pruef = (t, ok, info) => { if (!ok) rot++; console.log('  ' + (ok ? 'ok    ' : 'FEHLER') + '  ' + t.padEnd(52) + (info || '')); };
try {
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await pg.waitForTimeout(1000);
  await pg.evaluate(() => document.querySelector('#cookieBanner')?.remove());
  await pg.click('#awBody .aw-option[data-value="Terrassendach TDS"]');
  /* Weit genug, dass mehr als 20 Ereignisse anfallen: So viele nimmt ein
     Paket hoechstens auf. Vor dem 26.11.2026 gingen die hinteren Schritte
     dabei verloren, weil erst beim Verlassen der Seite gesendet wurde. */
  var erreicht = 1;
  for (let i = 0; i < 12; i++) {
    for (const f of await pg.evaluate(() => [...new Set([...document.querySelectorAll('#awBody .aw-option[data-field]')].map((b) => b.dataset.field))]))
      if (!(await pg.$(`#awBody .aw-option[data-field="${f}"].is-active`))) await pg.click(`#awBody .aw-option[data-field="${f}"] >> nth=0`);
    for (const id of await pg.evaluate(() => [...document.querySelectorAll('#awBody .aw-dims input')].filter((x) => !x.value).map((x) => x.id)))
      await pg.fill('#' + id, '4711');
    for (const f of await pg.evaluate(() => [...new Set([...document.querySelectorAll('#awBody .aw-pill[data-pill]')].map((b) => b.dataset.pill))]))
      if (!(await pg.$(`#awBody .aw-pill[data-pill="${f}"].is-active`))) await pg.click(`#awBody .aw-pill[data-pill="${f}"] >> nth=0`);
    await pg.evaluate(() => document.activeElement?.blur()); await pg.waitForTimeout(150);
    if (await pg.$('#awBody #awHoeheBezug')) await pg.selectOption('#awHoeheBezug', { index: 1 });
    const vorher = await pg.$eval('#awTitle', (e) => e.textContent);
    await pg.click('#awNext'); await pg.waitForTimeout(250);
    if (await pg.$eval('#awTitle', (e) => e.textContent) !== vorher) erreicht++;
    if (await pg.$('#awBody #k_nachname')) break;
  }
  await pg.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await pg.waitForTimeout(600);
} finally { await br.close(); srv.kill(); }

const alles = pakete.join('\n');
if (process.argv.includes('--zeigen')) console.log(pakete.join('\n'));
const schritte = [];
for (const p of pakete) { try { for (const e of (JSON.parse(p).ereignisse || [])) if (e.art === 'anfrage-schritt') schritte.push(e); } catch (e) {} }
console.log((GEGENPROBE ? 'Gegenprobe (Assistent aus 45871d9): ' : '') + pakete.length + ' Paket(e), ' + schritte.length + ' Schrittmeldungen: '
  + schritte.map((s) => s.wert + ' ' + s.zusatz).join(', '));
pruef('Mindestens drei Schritte gemeldet', schritte.length >= 3, schritte.length + '');
pruef('Jeder erreichte Schritt kommt an (auch nach 20 Ereignissen)', schritte.length === erreicht - 1, (erreicht - 1) + ' Wechsel, ' + schritte.length + ' gemeldet');
pruef('Nummern steigen', schritte.every((s, i) => i === 0 || s.wert > schritte[i - 1].wert));
pruef('Jeder Schritt hat einen Namen', schritte.length > 0 && schritte.every((s) => /^[a-z_-]+$/.test(s.zusatz || '')));
pruef('Kein eingegebener Wert im Paket (4711)', !alles.includes('4711'));
/* Nur die Schrittmeldungen: Die Klickmessung erfasst seit 03.11.2026 die
   Beschriftung angeklickter Knoepfe, auch "Terrassendach TDS"; das ist
   eine feste Beschriftung und so in der Datenschutzerklaerung genannt. */
pruef('Keine gewaehlte Antwort in den Schrittmeldungen', !schritte.some((s) => /Terrassendach|Wandmontage|VSG|Rauputz/.test(s.zusatz || '')));
pruef('Keine JavaScript-Fehler', !fehler.length, fehler[0] || '');
/* Der Server wirft unbekannte Arten weg; ohne diesen Eintrag kaeme nichts an. */
const { readFileSync } = await import('node:fs');
pruef('Server nimmt "anfrage-schritt" an', GEGENPROBE || /MESSUNG_ARTEN = new Set\(\[[\s\S]*?'anfrage-schritt'/.test(readFileSync(join(W, 'worker/index.js'), 'utf8')));
pruef('Datenschutzerklaerung nennt den Schritt im Anfrage-Assistenten', GEGENPROBE || /Schritt im Anfrage-Assistenten/.test(readFileSync(join(W, 'src/datenschutz.njk'), 'utf8')));
if (GEGENPROBE) {
  const ok = schritte.length === 0 && rot > 0;
  console.log('\nErgebnis: ' + (ok ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT'));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot ? rot + ' Pruefung(en) fehlgeschlagen' : 'Schritte gemeldet, nichts Eingegebenes erfasst'));
process.exit(rot ? 1 : 0);
