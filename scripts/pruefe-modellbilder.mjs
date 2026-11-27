#!/usr/bin/env node
/* ============================================================
   MODELLBILDER AUF DEN PRODUKTSEITEN: antippen und wischen

   ANLASS (20.11.2026). Der Betreiber schickte einen Bildschirmabzug
   und schrieb dazu, er wolle "einfach nur, dass man die Bilder
   wischen kann". Gemeint waren die Bilder der Modelle in den
   Produktkarten, nicht die Ausfuehrungsbeispiele weiter unten:
   34 Bilder auf 16 Seiten, jedes ein totes Bild. Antippen tat nichts.

   GEPRUEFT WIRD:
     1. Jede Produktseite laedt js/galerie.js.
     2. Aus jedem Modellbild wird eine Schaltflaeche mit einem
        Namen, der den Alternativtext enthaelt.
     3. Antippen oeffnet die Grossansicht mit dem RICHTIGEN Bild.
     4. Wischen blaettert zum naechsten Modell derselben Seite.
     5. Escape schliesst, der Fokus kehrt auf das Bild zurueck
        (WCAG 2.2, 2.4.3).
     6. Bei nur einem Modell: keine Pfeile, kein "(1 von 1)".
     7. Ohne JavaScript bleibt das Bild sichtbar.

   Aufruf:     node scripts/pruefe-modellbilder.mjs
   Gegenprobe: node scripts/pruefe-modellbilder.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8807;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); fehler++; }
};

/* --- Teil 1: ohne Browser, alle 16 Seiten --- */
const seiten = fs.readdirSync(path.join(WURZEL, 'produkte'))
  .filter((f) => f.endsWith('.html') && f !== '_template.html').sort();
let ohneSkript = [], bilder = 0, ohneAlt = [];
for (const datei of seiten) {
  const t = fs.readFileSync(path.join(WURZEL, 'produkte', datei), 'utf8');
  const karten = t.match(/<div class="produkt-card-img">[\s\S]*?<\/div>/g) || [];
  const mitBild = karten.filter((k) => k.includes('<img'));
  if (!mitBild.length) continue;
  bilder += mitBild.length;
  if (!t.includes('js/galerie.js')) ohneSkript.push(datei);
  for (const k of mitBild) {
    const m = k.match(/alt="([^"]*)"/);
    if (!m || !m[1].trim()) ohneAlt.push(datei);
  }
}
p('Alle Seiten mit Modellbildern laden galerie.js', ohneSkript.length === 0,
  ohneSkript.length ? ohneSkript.join(', ') : `${seiten.length} Seiten geprueft`);
p('Jedes Modellbild hat einen Alternativtext', ohneAlt.length === 0,
  ohneAlt.length ? ohneAlt.join(', ') : `${bilder} Bilder`);
p('Es gibt ueberhaupt Modellbilder', bilder >= 30, `${bilder} gefunden`);

/* --- Teil 2: im echten Browser --- */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

/* Eine Seite mit mehreren Modellen und eine mit genau einem. */
const FAELLE = [
  /* Bis 27.11.2026 stand hier pergola.html. Seit Lamaxa auf Wunsch des
     Betreibers entfernt ist, hat die Seite nur noch ein Modellbild, also
     keine Pfeile und keinen Zaehler. Carport hat drei Modelle. */
  { datei: 'carport.html', mehrere: true },
  { datei: 'gartenhaus.html', mehrere: false },
];

try {
  for (const fall of FAELLE) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    });
    const pg = await ctx.newPage();
    if (GEGEN) {
      /* Eingebauter Fehler: Das Skript wird nicht geladen. Dann MUSS
         auffallen, dass aus den Bildern keine Schaltflaechen werden. */
      await pg.route('**/js/galerie.js*', (r) => r.abort());
    }
    await pg.goto(`http://127.0.0.1:${PORT}/produkte/${fall.datei}`, { waitUntil: 'load' });
    await pg.bringToFront();
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
    await pg.waitForTimeout(400);

    const stand = await pg.evaluate(() => {
      const k = document.querySelectorAll('.produkt-bild-knopf');
      const b = document.querySelectorAll('.produkt-card-img img');
      return { knoepfe: k.length, bilder: b.length,
               name: k.length ? k[0].getAttribute('aria-label') : '',
               alt: b.length ? b[0].getAttribute('alt') : '' };
    });
    p(`${fall.datei}: aus jedem Modellbild wird eine Schaltflaeche`,
      stand.knoepfe > 0 && stand.knoepfe === stand.bilder,
      `${stand.knoepfe} von ${stand.bilder}`);
    p(`${fall.datei}: der Name nennt das Bild`,
      !!stand.alt && stand.name.indexOf(stand.alt) === 0 && /groß anzeigen$/.test(stand.name),
      stand.name.slice(0, 44));

    if (stand.knoepfe) {
      await pg.evaluate(() => document.querySelector('.produkt-bild-knopf').click());
      await pg.waitForTimeout(600);
      const auf = await pg.evaluate(() => {
        const f = document.querySelector('.galerie-gross');
        const erstes = document.querySelector('.produkt-card-img img');
        return { offen: f && !f.hidden,
                 gleich: (document.querySelector('.gg-bild') || {}).src === (erstes || {}).src,
                 zaehler: (document.querySelector('.gg-zaehler') || {}).textContent || '',
                 pfeil: !(document.querySelector('.gg-vor') || {}).hidden };
      });
      p(`${fall.datei}: Antippen oeffnet das richtige Bild`, auf.offen && auf.gleich,
        auf.offen ? (auf.gleich ? 'passt' : 'falsches Bild') : 'blieb zu');
      if (fall.mehrere) {
        p(`${fall.datei}: Pfeile und Zaehler sind da`, auf.pfeil && /von/.test(auf.zaehler),
          auf.zaehler.trim());
        await pg.evaluate(() => {
          const el = document.querySelector('.gg-bild');
          const mk = (typ, x) => {
            const b = new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
            el.dispatchEvent(new TouchEvent(typ, { bubbles: true, cancelable: true,
              touches: typ === 'touchend' ? [] : [b], changedTouches: [b] }));
          };
          mk('touchstart', 300); mk('touchmove', 120); mk('touchend', 120);
        });
        await pg.waitForTimeout(500);
        const nach = await pg.evaluate(() => ({
          zaehler: (document.querySelector('.gg-zaehler') || {}).textContent || '',
          text: (document.querySelector('.galerie-gross figcaption') || {}).textContent || '',
        }));
        p(`${fall.datei}: Wischen blaettert zum naechsten Modell`, /\(2 von /.test(nach.zaehler),
          nach.text.slice(0, 40));
      } else {
        p(`${fall.datei}: ein Modell, keine Pfeile, kein "1 von 1"`,
          !auf.pfeil && auf.zaehler.trim() === '', `Zaehler "${auf.zaehler.trim()}"`);
      }
      await pg.keyboard.press('Escape');
      await pg.waitForTimeout(400);
      const zu = await pg.evaluate(() => ({
        zu: document.querySelector('.galerie-gross').hidden,
        fokus: document.activeElement.className,
      }));
      p(`${fall.datei}: Escape schliesst, Fokus kehrt zurueck`,
        zu.zu && /produkt-bild-knopf/.test(zu.fokus), zu.fokus.slice(0, 30));
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `fehlendes Skript bemerkt (${fehler} Beanstandungen)` : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
