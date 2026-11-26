#!/usr/bin/env node
/* Kommt man von einer Produktseite mit dem Produkt vorausgewaehlt im
 * Anfrage-Assistenten an?
 *
 * WARUM (26.11.2026, B8, Entscheidung des Betreibers "Ja, vorauswaehlen"):
 * Die Knoepfe an den Produktkarten gaben die Vorauswahl schon mit, der
 * grosse Knopf oben und der am Seitenende nicht. Wer dort anfragte,
 * musste sein Produkt im Formular noch einmal waehlen.
 *
 * WIE: Auf jeder Seite mit genau einem Produkt den ersten und den letzten
 * Knopf nach /#kontakt klicken. Danach darf der Assistent NICHT mehr bei
 * der Produktfrage stehen. Seiten mit mehreren Produkten (Terrassen-
 * ueberdachung, Balkon/Fassade, Eingang, Garten) bleiben bewusst ohne
 * Vorauswahl und werden nicht geprueft. Versand wird abgefangen.
 *
 * GEGENPROBE: --gegenprobe liefert die Seiten im Stand vor der Aenderung
 * (Commit 9f97ebb) aus git. Dann MUSS jede Seite auffallen.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const SEITEN = ['bushaltestelle', 'carport', 'fahrradueberdachung', 'faltdach', 'fassade', 'gartenhaus',
  'gelaender', 'kaltwintergarten', 'pergola', 'sichtschutz', 'sonnenschutz', 'velaris'];
const PRODUKTFRAGE = /Was möchten Sie konfigurieren/;
const PORT = 8300 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
let rot = 0, faelle = 0;
try {
  for (const s of SEITEN) for (const welcher of ['erster', 'letzter']) {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route(/web3forms|formspree|\/api\/kontakt/i, (r) => r.abort());
    if (GEGENPROBE) {
      const alt = execFileSync('git', ['show', `9f97ebb:produkte/${s}.html`], { cwd: W, encoding: 'utf8' });
      await ctx.route(`**/produkte/${s}.html`, (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: alt }));
    }
    const pg = await ctx.newPage();
    const fehler = []; pg.on('pageerror', (e) => fehler.push(e.message));
    await pg.goto(`http://127.0.0.1:${PORT}/produkte/${s}.html`, { waitUntil: 'load' });
    await pg.waitForTimeout(500);
    await pg.evaluate(() => document.querySelector('#cookieBanner')?.remove());
    /* Alle Anfrageknoepfe des Inhalts; Menue, Anfrageleiste und Fusszeile
       zaehlen nicht. Der letzte ist der grosse Knopf am Seitenende. */
    const knoepfe = pg.locator('a.btn[href="/#kontakt"]:not(.navbar *):not(.mobile-menu *):not(#stickyCta *):not(footer *)');
    const anzahl = await knoepfe.count();
    if (!anzahl) { console.log('  FEHLER  ' + s + ': kein Anfrageknopf gefunden'); rot++; faelle++; await ctx.close(); continue; }
    await knoepfe.nth(welcher === 'erster' ? 0 : anzahl - 1).click();
    await pg.waitForURL(/index\.html#kontakt|\/#kontakt/, { timeout: 8000 }).catch(() => {});
    await pg.waitForTimeout(1300);
    const titel = await pg.evaluate(() => document.getElementById('awTitle')?.textContent.trim() || '(kein Assistent)');
    const ok = !PRODUKTFRAGE.test(titel) && titel !== '(kein Assistent)' && !fehler.length;
    faelle++; if (!ok) rot++;
    console.log('  ' + (ok ? 'ok    ' : 'FEHLER') + '  ' + s.padEnd(20) + welcher.padEnd(8) + 'Schritt "' + titel.slice(0, 40) + '"' + (fehler.length ? '  JS: ' + fehler[0] : ''));
    await ctx.close();
  }
} finally { await br.close(); srv.kill(); }
if (GEGENPROBE) {
  const ok = rot === faelle;
  console.log('\nErgebnis: ' + (ok ? 'die Gegenprobe faellt in ' + rot + ' von ' + faelle + ' Faellen auf' : 'GEGENPROBE VERSAGT, nur ' + rot));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot ? rot + ' von ' + faelle + ' ohne Vorauswahl' : 'alle ' + faelle + ' Knoepfe waehlen vor'));
process.exit(rot ? 1 : 0);
