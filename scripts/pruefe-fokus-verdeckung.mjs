#!/usr/bin/env node
/* ============================================================
   Verdeckt beim Durchtabben irgendetwas den Fokus?

   WCAG 2.2, Erfolgskriterium 2.4.11 "Fokus nicht verdeckt
   (Minimum)", Stufe AA: Wenn ein Bedienelement den
   Tastaturfokus bekommt, darf es nicht VOLLSTAENDIG durch
   Inhalte der Seite verdeckt sein.

   ANLASS: Punkt 3.10 in docs/NEXT_TASK.md, offen seit dem
   13.11.2026 mit dem Vermerk "nur im Browser pruefbar,
   rechnerisch nicht". Genau das stimmt: Der typische Fall
   entsteht erst beim Scrollen. Der Browser holt ein
   fokussiertes Element in den SICHTBAREN BEREICH, nicht
   unter eine klebende Kopfzeile. Fehlt der Seite
   scroll-padding-top, landet das Element unter der Leiste
   und ist weg, obwohl es den Fokus hat.

   GEMESSEN WIRD, je Seite und Breite:
     1. Durchtabben, bis zu 70 Schritte.
     2. Nach jedem Schritt: Liegt das fokussierte Element noch
        im sichtbaren Bereich?
     3. Und: Ist es an allen neun Messpunkten von einem
        Element mit position:fixed oder position:sticky
        ueberdeckt? Nur dann ist es vollstaendig verdeckt.
        Ueberdeckung durch normal fliessenden Inhalt zaehlt
        nicht; das ist kein Fall von 2.4.11.
     4. Zwei Durchgaenge: mit offenem Cookie-Hinweis und
        danach. Der Hinweis ist eine feste Leiste am unteren
        Rand und der wahrscheinlichste Verdecker.

   NICHT GEMESSEN: 2.4.12 (AAA, kein Teil darf verdeckt sein)
   und Verdeckung durch Inhalte, die der Nutzer selbst
   verschieben kann.

   Aufruf:     node scripts/pruefe-fokus-verdeckung.mjs
   Gegenprobe: node scripts/pruefe-fokus-verdeckung.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8799;
const SCHRITTE = 70;

const SEITEN = [
  '/index.html', '/produkte/terrassenueberdachung.html', '/produkte/carport.html',
  '/windzonen.html', '/baugenehmigung.html', '/einzugsgebiet.html',
  '/carport-koblenz.html',
];
const BREITEN = [
  { name: 'Handy', w: 390, h: 844, mobil: true },
  { name: 'Rechner', w: 1440, h: 900, mobil: false },
];

let fehler = 0, anzahl = 0, befunde = [];
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(50)} ${beleg}`); }
  else { console.log(`  FEHLER  ${name.padEnd(50)} ${beleg}`); fehler++; }
};

/* Laeuft IM BROWSER. Gibt den Zustand des fokussierten Elements zurueck. */
const MESSEN = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { leer: true };
  const r = el.getBoundingClientRect();
  const marke = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34)
    || el.getAttribute('name') || el.id || '';
  const wer = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string'
    ? '.' + el.className.split(/\s+/)[0] : ''} "${marke}"`;
  if (r.width < 1 || r.height < 1) return { wer, unsichtbar: true };

  const vw = innerWidth, vh = innerHeight;
  if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw)
    return { wer, verdeckt: true, grund: 'ganz ausserhalb des Bildes',
             lage: `top ${Math.round(r.top)}, hoehe ${Math.round(r.height)}` };

  const x0 = Math.max(0, r.left), x1 = Math.min(vw, r.right);
  const y0 = Math.max(0, r.top), y1 = Math.min(vh, r.bottom);
  let frei = 0, decker = '';
  for (const fx of [0.12, 0.5, 0.88]) for (const fy of [0.12, 0.5, 0.88]) {
    const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy;
    const kette = document.elementsFromPoint(x, y);
    const i = kette.findIndex((n) => n === el || el.contains(n) || n.contains(el));
    if (i === 0) { frei++; continue; }
    const oben = kette.slice(0, i < 0 ? kette.length : i);
    /* Nur feste und klebende Elemente zaehlen als Verdecker. Ein
       normal fliessender Kasten kann ein fokussiertes Element nicht
       verdecken, ohne dass die Seite ohnehin kaputt waere. */
    const b = oben.find((n) => {
      const s = getComputedStyle(n);
      return s.position === 'fixed' || s.position === 'sticky';
    });
    if (!b) { frei++; continue; }
    decker = `${b.tagName.toLowerCase()}${b.className && typeof b.className === 'string'
      ? '.' + b.className.split(/\s+/)[0] : ''}`;
  }
  if (frei === 0) return { wer, verdeckt: true, grund: `verdeckt von ${decker}`,
                           lage: `top ${Math.round(r.top)}` };
  return { wer, ok: true };
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

try {
  for (const seite of SEITEN) {
    for (const b of BREITEN) {
      /* reducedMotion: Die Seite setzt html{scroll-behavior:smooth}.
         Nach jedem Tab laeuft dann eine Scroll-Animation, und eine
         Messung direkt danach trifft das Element noch auf dem Weg.
         Der erste Lauf am 20.11.2026 meldete deshalb hunderte Elemente
         als "ganz ausserhalb des Bildes", mit Werten wie top 1810 und
         top -2938. Reine Messfehler. Mit prefers-reduced-motion greift
         die eigene Regel der Seite (style.css Z. 2575) und schaltet auf
         scroll-behavior:auto; gemessen wird damit der Endzustand, und
         genau der ist fuer 2.4.11 gemeint. */
      const ctx = await browser.newContext({
        viewport: { width: b.w, height: b.h },
        hasTouch: b.mobil, isMobile: b.mobil,
        reducedMotion: 'reduce',
      });
      const pg = await ctx.newPage();
      await pg.goto(`http://127.0.0.1:${PORT}${seite}`, { waitUntil: 'load' });
      await pg.bringToFront();
      await pg.waitForTimeout(900);

      if (GEGEN) {
        /* Eingebauter Fehler: eine undurchsichtige feste Leiste ueber
           die obersten 220 px. Danach MUSS mindestens ein fokussiertes
           Element vollstaendig verdeckt sein. */
        await pg.addStyleTag({ content:
          '#gegenprobe-leiste{position:fixed;top:0;left:0;right:0;height:220px;' +
          'background:#000;z-index:2147483645;}' });
        await pg.evaluate(() => {
          const d = document.createElement('div');
          d.id = 'gegenprobe-leiste';
          document.body.appendChild(d);
        });
      }

      for (const durchgang of ['mit Cookie-Hinweis', 'ohne Cookie-Hinweis']) {
        if (durchgang === 'ohne Cookie-Hinweis') {
          await pg.evaluate(() => {
            const k = document.querySelector('.cb-btn--necessary');
            if (k) k.click();
          });
          await pg.waitForTimeout(400);
        }
        await pg.evaluate(() => { window.scrollTo(0, 0); document.body.focus(); });
        await pg.waitForTimeout(150);

        const schlecht = [];
        const gesehen = new Set();
        for (let i = 0; i < SCHRITTE; i++) {
          await pg.keyboard.press('Tab');
          /* Zwei Bilder abwarten: Der Browser holt das Element erst beim
             naechsten Zeichnen herein. */
          await pg.evaluate(() => new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r))));
          const z = await pg.evaluate(MESSEN);
          if (!z || z.leer) continue;
          if (gesehen.has(z.wer)) continue;          /* Runde zu Ende */
          gesehen.add(z.wer);
          if (z.verdeckt) schlecht.push(`${z.wer}: ${z.grund} (${z.lage})`);
        }
        const marke = `${seite} ${b.name}, ${durchgang}`;
        p(marke, schlecht.length === 0,
          schlecht.length ? schlecht.slice(0, 2).join(' | ')
                          : `${gesehen.size} Elemente, keines verdeckt`);
        if (schlecht.length) befunde.push(`${marke}: ${schlecht.join(' | ')}`);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `eingebaute Verdeckung bemerkt (${fehler} von ${anzahl} Faellen)`
    : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
if (befunde.length) {
  console.log('\nAlle Befunde:');
  for (const b of befunde) console.log('  ' + b);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Faellen mit verdecktem Fokus`
  : `alle ${anzahl} Faelle ohne verdeckten Fokus`}`);
process.exit(fehler ? 1 : 0);
