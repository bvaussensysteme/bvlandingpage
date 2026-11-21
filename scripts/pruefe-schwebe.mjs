#!/usr/bin/env node
/* ============================================================
   SCHWEBE-ZUSTAND DER GOLDENEN KNOEPFE

   ANLASS (21.11.2026). Meldung des Betreibers: "wenn man ueber
   whatsapp mit der maus faehrt wirds weiss (was ich gut finde) bei
   kostenlos anfragen passiert das nicht". Dazu: "suche ueberall
   nach diesem fehler korregiere ihn ueberall".

   Gemessen war der Unterschied echt, aber nicht dort, wo man ihn
   vermutet: style.css gibt .btn-gold:hover laengst --gold-text mit
   weisser Schrift. Auf der STARTSEITE ueberschrieb start.css das
   mit --gold-dark und schwarzer Schrift, weil die Regel dasselbe
   Gewicht hat und spaeter geladen wird. Auf allen anderen Seiten
   war es immer richtig.

   GEPRUEFT WIRD, je Seite und je sichtbarem goldenen Knopf:
     1. Der Schwebe-Zustand aendert ueberhaupt etwas.
     2. Die Schrift wird WEISS.
     3. Weiss auf dem neuen Grund erreicht mindestens 4,5:1
        (WCAG 2.2, 1.4.3).
     4. Alle goldenen Knoepfe einer Seite verhalten sich GLEICH.
        Das war der eigentliche Fehler: nicht ein kaputter Knopf,
        sondern zwei verschiedene Antworten auf dieselbe Geste.

   Geprueft wird nur mit Maus (hover: hover), denn die Regeln
   stehen in genau dieser Medienabfrage.

   Aufruf:     node scripts/pruefe-schwebe.mjs
   Gegenprobe: node scripts/pruefe-schwebe.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8875;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(50)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(50)} ${beleg || ''}`); fehler++; }
};
const leuchte = (x) => {
  const [r, g, b] = x.match(/\d+/g).slice(0, 3).map(Number)
    .map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (a, b) => {
  const x = leuchte(a), y = leuchte(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const SEITEN = ['/index.html', '/produkte/carport.html', '/windzonen.html',
  '/baugenehmigung.html', '/carport-koblenz.html'];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  for (const u of SEITEN) {
    const pg = await ctx.newPage();
    try { await pg.goto(`http://127.0.0.1:${PORT}${u}`, { waitUntil: 'load' }); }
    catch (e) { await pg.close(); continue; }
    await pg.bringToFront();
    await pg.waitForTimeout(600);
    await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
    await pg.waitForTimeout(250);
    if (GEGEN) {
      /* Eingebauter Fehler: der alte Zustand der Startseite, auf allen
         Seiten. Schrift bleibt schwarz. */
      await pg.addStyleTag({ content:
        '@media (hover:hover) and (pointer:fine){.btn-gold:hover{background:#A3701F!important;color:#0B0B0C!important}}' });
    }
    await pg.evaluate(() => window.scrollTo(0, 1500));
    await pg.waitForTimeout(700);

    const n = await pg.evaluate(() => document.querySelectorAll('.btn-gold, .btn-whatsapp').length);
    const antworten = new Set();
    let stumm = [], nichtWeiss = [], schwach = [], gezaehlt = 0;
    for (let i = 0; i < n; i++) {
      const vor = await pg.evaluate((i) => {
        const e = document.querySelectorAll('.btn-gold, .btn-whatsapp')[i];
        if (!e || !e.offsetParent) return null;
        const cs = getComputedStyle(e);
        return { bg: cs.backgroundColor, c: cs.color, text: e.textContent.trim().slice(0, 18) };
      }, i);
      if (!vor) continue;
      try { await pg.hover(`.btn-gold, .btn-whatsapp >> nth=${i}`, { timeout: 2500 }); }
      catch (e) { continue; }
      await pg.waitForTimeout(260);
      const nach = await pg.evaluate((i) => {
        const e = document.querySelectorAll('.btn-gold, .btn-whatsapp')[i];
        const cs = getComputedStyle(e);
        return { bg: cs.backgroundColor, c: cs.color };
      }, i);
      await pg.mouse.move(2, 2);
      await pg.waitForTimeout(120);
      gezaehlt++;
      antworten.add(nach.bg + ' / ' + nach.c);
      if (nach.bg === vor.bg && nach.c === vor.c) stumm.push(vor.text);
      if (nach.c !== 'rgb(255, 255, 255)') nichtWeiss.push(`${vor.text}: ${nach.c}`);
      else if (kontrast(nach.c, nach.bg) < 4.5) schwach.push(`${vor.text}: ${kontrast(nach.c, nach.bg).toFixed(2)}:1`);
    }
    const kurz = u.replace('.html', '');
    p(`${kurz}: jeder goldene Knopf antwortet auf die Maus`, stumm.length === 0,
      stumm.length ? stumm.slice(0, 2).join(', ') : `${gezaehlt} Knoepfe`);
    p(`${kurz}: die Schrift wird weiss`, nichtWeiss.length === 0,
      nichtWeiss.length ? nichtWeiss.slice(0, 2).join(', ') : `${gezaehlt} Knoepfe`);
    p(`${kurz}: weiss auf dem neuen Grund haelt 4,5:1`, schwach.length === 0,
      schwach.length ? schwach.slice(0, 2).join(', ') : 'alle');
    p(`${kurz}: alle Knoepfe antworten GLEICH`, antworten.size <= 1,
      [...antworten].slice(0, 2).join(' UND '));
    await pg.close();
  }
  await ctx.close();
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `alter Zustand bemerkt (${fehler} Beanstandungen)` : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
