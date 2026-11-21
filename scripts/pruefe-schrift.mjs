#!/usr/bin/env node
/* ============================================================
   EINE SCHRIFT AUF ALLEN SEITEN

   ANLASS (21.11.2026). Ansage des Betreibers: "alle seiten manrope
   machen, alle seiten design anpassen, erst mobile, dann tablet,
   dann pc". Damit war die Frage entschieden, die
   docs/WEBSITE_DESIGN_SYSTEM.md offen gelassen hatte.

   WARUM ES DIESE PRUEFUNG BRAUCHT. Am 20.11.2026 meldete
   pruefe-startseite.mjs tagelang "Manrope ist die erste
   Schriftwahl", weil sie nur die Schrift am <body> las. Daneben
   standen 38 Textstellen in Barlow Condensed und Inter. Eine
   Pruefung, die nur die Wurzel ansieht, sieht genau das nicht, was
   abweicht. Diese hier geht jede Textstelle einzeln durch.

   GEPRUEFT WIRD je Seite:
     1. Jede Textstelle steht in Manrope, bis auf die Ausnahmen
        unten.
     2. Die Seite laedt keine andere Schriftfamilie nach.
     3. Die Ausweichschrift im Kopf ist die Systemkette, nicht
        Arial Black. Sie steht dort fuer die Sekunden vor dem
        Nachladen; ein zu anderer Ton laesst die Seite springen.

   AUSNAHMEN, jede mit Grund:
     - .a11y-range-val und <code>: Monospace. Zahlen, die beim
       Schieben nicht springen sollen, und Quelltext.
     - <text> in SVG: gehoert zur Symbolsammlung, kein Seitentext.
     - .info-badge und .vd-badge-i: ein kursives "i" als Zeichen,
       keine Textstelle.
     - Die Lesehilfe im Bedienhilfen-Panel setzt ihre Schrift mit
       !important. Sie muss gewinnen.

   Aufruf:     node scripts/pruefe-schrift.mjs
   Gegenprobe: node scripts/pruefe-schrift.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8865;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(46)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(46)} ${beleg || ''}`); fehler++; }
};

const SEITEN = ['/index.html', '/produkte/carport.html', '/produkte/terrassenueberdachung.html',
  '/stoffe.html', '/windzonen.html', '/baugenehmigung.html', '/ratgeber/index.html',
  '/zertifikate.html', '/partner.html', '/pflege.html', '/einzugsgebiet.html',
  '/broschuere.html', '/carport-koblenz.html', '/konfigurator.html', '/impressum.html',
  '/datenschutz.html', '/agb.html', '/widerruf.html', '/danke.html'];

/* --- Teil 1: ohne Browser, ALLE Seiten --- */
const htmls = [];
const sammeln = (d) => {
  for (const e of fs.readdirSync(path.join(WURZEL, d), { withFileTypes: true })) {
    if (e.isDirectory() && ['produkte', 'werkstatt', 'ratgeber'].includes(e.name)) sammeln(path.join(d, e.name));
    else if (e.isFile() && e.name.endsWith('.html')) htmls.push(path.join(d, e.name));
  }
};
sammeln('.');
let fremdeFamilie = [], altesAusweich = [];
for (const f of htmls) {
  const t = fs.readFileSync(path.join(WURZEL, f), 'utf8');
  for (const m of t.matchAll(/fonts\.googleapis\.com\/css2\?family=([^'"&]*)/g)) {
    if (m[1].split(':')[0] !== 'Manrope') fremdeFamilie.push(`${f}: ${m[1].split(':')[0]}`);
  }
  if (/--font-heading:\s*'Arial Black'/.test(t)) altesAusweich.push(f);
}
p(`Keine Seite laedt eine andere Familie als Manrope`, fremdeFamilie.length === 0,
  fremdeFamilie.length ? fremdeFamilie.slice(0, 2).join(', ') : `${htmls.length} Dateien geprueft`);
p('Keine Seite hat noch Arial Black als Ausweichschrift', altesAusweich.length === 0,
  altesAusweich.length ? altesAusweich.slice(0, 2).join(', ') : 'alle auf Systemkette');

/* --- Teil 2: im Browser --- */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

try {
  for (const breite of [390, 1440]) {
    const ctx = await browser.newContext({
      viewport: { width: breite, height: 900 },
      isMobile: breite < 768, hasTouch: breite < 768, reducedMotion: 'reduce',
    });
    const abweichend = {};
    let geprueft = 0;
    for (const u of SEITEN) {
      const pg = await ctx.newPage();
      try { await pg.goto(`http://127.0.0.1:${PORT}${u}`, { waitUntil: 'load' }); }
      catch (e) { await pg.close(); continue; }
      await pg.bringToFront();
      await pg.waitForTimeout(400);
      await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
      await pg.waitForTimeout(180);
      if (GEGEN) {
        /* Eingebauter Fehler: eine einzige Stelle zurueck auf die alte
           Schrift. Das MUSS auffallen, sonst sieht die Pruefung wieder
           nur die Wurzel. */
        await pg.addStyleTag({ content: '.container p:first-of-type{font-family:"Times New Roman",serif!important}' });
      }
      const treffer = await pg.evaluate(() => {
        const raus = [];
        document.querySelectorAll('body *').forEach((e) => {
          if (e.children.length || !e.textContent.trim()) return;
          const f = getComputedStyle(e).fontFamily.split(',')[0].replace(/['"]/g, '');
          if (f === 'Manrope') return;
          const t = e.tagName.toLowerCase();
          if (t === 'code' || t === 'kbd' || t === 'samp' || t === 'pre') return;
          if (t === 'text' || e.closest('svg')) return;
          if (e.classList.contains('a11y-range-val')) return;
          if (e.classList.contains('info-badge') || e.classList.contains('vd-badge-i')) return;
          raus.push(f + ' an ' + t + '.' + (e.className || '').toString().split(/\s+/)[0]);
        });
        return [...new Set(raus)];
      });
      geprueft++;
      treffer.forEach((k) => { abweichend[k] = (abweichend[k] || 0) + 1; });
      await pg.close();
    }
    const liste = Object.keys(abweichend);
    p(`${breite} px: jede Textstelle in Manrope`, liste.length === 0,
      liste.length ? liste.slice(0, 3).join(' | ') : `${geprueft} Seiten ohne Abweichung`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `fremde Schrift bemerkt (${fehler} Beanstandungen)` : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
