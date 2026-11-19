#!/usr/bin/env node
/* ============================================================
   Ausfuehrungsbeispiele: Streifen und Grossansicht

   Geprueft wird auf allen Seiten mit Galerie:
     1. Die Bilder stehen OHNE JavaScript in der Seite.
     2. Jedes Bild hat einen Alternativtext und feste Masse
        (sonst springt das Layout beim Laden).
     3. Nur das erste Bild laedt sofort, der Rest mit loading="lazy".
     4. Der Streifen scrollt in sich, nichts ragt ueber den Rand.
     5. Die Grossansicht: oeffnet, blaettert, schliesst mit Escape,
        gibt den Fokus an die Kachel zurueck (WCAG 2.2: 2.1.2,
        2.4.3, 2.4.11), und ihre Knoepfe sind 44 x 44 px gross.
     6. Die Ueberschrift verspricht keine Referenzen: Es sind
        Herstellerdarstellungen, und das steht auch da.

   Aufruf:     node scripts/pruefe-galerie.mjs
   Gegenprobe: node scripts/pruefe-galerie.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8797;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(56)} ${beleg}`); }
  else { console.log(`  FEHLER  ${name.padEnd(56)} ${beleg}`); fehler++; }
};

const DATEN = JSON.parse(fs.readFileSync(path.join(WURZEL, 'src/_data/galerien.json'), 'utf8'));
const SEITEN = ['terrassenueberdachung', 'carport', 'gartenhaus',
                'kaltwintergarten', 'eingang', 'pergola'];

const FEHLER = [
  /* GEZIELT EIN GALERIEBILD treffen. Der erste Versuch ersetzte das
     erste alt der ganzen Seite - das gehoerte zum Produktbild oben,
     und die Galerie blieb heil. Die Pruefung meldete dann faelschlich
     "nicht bemerkt". Gemessen am 19.11.2026. */
  { name: 'Ein Alternativtext fehlt',
    machen: (t) => t.replace(/ alt="[^"]*Ausführungsbeispiel 1"/, ' alt=""') },
  { name: 'Die Masse am Bild fehlen', machen: (t) => t.replace(/ width="800" height="450"/g, '') },
  { name: 'Alle Bilder laden sofort', machen: (t) => t.replace(/loading="lazy" /g, '') },
  { name: 'Die Ueberschrift verspricht Referenzen',
    machen: (t) => t.replace('Ausführungsbeispiele', 'Unsere Referenzen')
                    .replace(/Darstellungen des Herstellers[^<]*/, '') },
];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

async function seiteOeffnen(name, mitJs, umbau) {
  const ctx = await browser.newContext({ javaScriptEnabled: mitJs,
    viewport: { width: 390, height: 800 }, isMobile: mitJs, hasTouch: mitJs,
    deviceScaleFactor: mitJs ? 2 : 1 });
  const s = await ctx.newPage();
  if (umbau) {
    await s.route(`**/produkte/${name}.html`, async (route) => {
      const a = await route.fetch();
      await route.fulfill({ response: a, body: umbau(await a.text()) });
    });
  }
  await s.goto(`http://127.0.0.1:${PORT}/produkte/${name}.html`, { waitUntil: 'load' });
  await s.waitForTimeout(mitJs ? 1200 : 400);
  return { ctx, s };
}

async function messen(name, umbau) {
  const { ctx, s } = await seiteOeffnen(name, true, umbau);
  const r = await s.evaluate(() => {
    const kacheln = [...document.querySelectorAll('.galerie-kachel')];
    const bilder = kacheln.map((k) => k.querySelector('img'));
    return {
      kacheln: kacheln.length,
      ohneAlt: bilder.filter((b) => !b || !b.getAttribute('alt')).length,
      ohneMass: bilder.filter((b) => !b || !b.getAttribute('width') || !b.getAttribute('height')).length,
      sofort: bilder.filter((b) => b && b.getAttribute('loading') !== 'lazy').length,
      ueberschrift: (document.querySelector('.galerie-streifen-sektion h2') || {}).textContent || '',
      hinweis: (document.querySelector('.galerie-streifen-hinweis') || {}).textContent || '',
      ueberRand: [...document.querySelectorAll('.galerie-streifen-sektion *')].filter((e) => {
        const b = e.getBoundingClientRect();
        let q = e.parentElement, g = false;
        while (q && q !== document.body) {
          if (getComputedStyle(q).overflowX !== 'visible') { g = true; break; }
          q = q.parentElement;
        }
        return !g && b.width > 0 && b.right > window.innerWidth + 2;
      }).length,
    };
  });
  await ctx.close();
  return r;
}

try {
  if (!GEGEN) {
    for (const name of SEITEN) {
      const soll = DATEN[name].bilder.length;
      const r = await messen(name);
      p(`${name}: alle Bilder stehen in der Seite`, r.kacheln === soll,
        `${r.kacheln} von ${soll}`);
      p(`${name}: jedes Bild hat Alternativtext und Masse`,
        r.ohneAlt === 0 && r.ohneMass === 0,
        `ohne Text ${r.ohneAlt}, ohne Masse ${r.ohneMass}`);
      p(`${name}: nur das erste Bild laedt sofort`, r.sofort === 1, `${r.sofort} sofort`);
      p(`${name}: nichts ragt ueber den rechten Rand`, r.ueberRand === 0,
        `${r.ueberRand} Element(e)`);

      const { ctx, s } = await seiteOeffnen(name, false);
      const ohneJs = await s.evaluate(() => document.querySelectorAll('.galerie-streifen img').length);
      await ctx.close();
      p(`${name}: ohne JavaScript sind die Bilder trotzdem da`, ohneJs === soll,
        `${ohneJs} von ${soll}`);
    }

    /* Die Ueberschrift darf keine Referenzen versprechen. */
    const r0 = await messen(SEITEN[0]);
    p('Die Ueberschrift verspricht keine ausgefuehrten Anlagen',
      /Ausführungsbeispiele/.test(r0.ueberschrift) && !/Referenz|Projekt/i.test(r0.ueberschrift),
      `"${r0.ueberschrift.trim()}"`);
    p('Der Hinweis nennt die Bilder Herstellerdarstellungen',
      /Darstellungen des Herstellers/.test(r0.hinweis),
      r0.hinweis.replace(/\s+/g, ' ').trim().slice(0, 60));

    /* Grossansicht, vollstaendig durchgespielt. */
    const { ctx, s } = await seiteOeffnen('carport', true);
    await s.locator('.galerie-kachel').first().scrollIntoViewIfNeeded();
    await s.locator('.galerie-kachel').first().click();
    await s.waitForTimeout(500);
    const auf = await s.evaluate(() => {
      const f = document.querySelector('.galerie-gross');
      const knopf = document.querySelector('.gg-zu').getBoundingClientRect();
      return { offen: !!f && !f.hidden, rolle: f.getAttribute('role'),
               modal: f.getAttribute('aria-modal'),
               fokus: document.activeElement.className,
               gesperrt: document.body.classList.contains('galerie-offen'),
               knopf: Math.round(knopf.width) + 'x' + Math.round(knopf.height),
               text: document.querySelector('.gg-text').textContent };
    });
    p('Die Grossansicht oeffnet als Dialog', auf.offen && auf.rolle === 'dialog' && auf.modal === 'true',
      `role=${auf.rolle}, aria-modal=${auf.modal}`);
    p('Der Fokus springt in die Grossansicht', /gg-zu/.test(auf.fokus), auf.fokus);
    p('Die Seite dahinter scrollt nicht mit', auf.gesperrt === true, 'body.galerie-offen');
    p('Die Knoepfe sind mindestens 44 x 44 px', auf.knopf === '44x44', auf.knopf);
    p('Die Grossansicht zeigt Beschriftung und Zaehler',
      /Ausführungsbeispiel 1 \(1 von 3\)/.test(auf.text), auf.text.trim());

    await s.locator('.gg-vor').click();
    await s.waitForTimeout(400);
    const weiter = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    p('Blaettern wechselt das Bild', /\(2 von 3\)/.test(weiter), weiter.trim());

    await s.keyboard.press('ArrowLeft');
    await s.waitForTimeout(300);
    const pfeil = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    p('Die Pfeiltasten blaettern auch', /\(1 von 3\)/.test(pfeil), pfeil.trim());

    await s.keyboard.press('Escape');
    await s.waitForTimeout(400);
    const zu = await s.evaluate(() => ({
      offen: !document.querySelector('.galerie-gross').hidden,
      fokus: document.activeElement.className,
      gesperrt: document.body.classList.contains('galerie-offen') }));
    p('Escape schliesst und gibt den Fokus zurueck',
      !zu.offen && /galerie-kachel/.test(zu.fokus) && !zu.gesperrt, JSON.stringify(zu));
    await ctx.close();
  } else {
    for (const f of FEHLER) {
      const r = await messen('carport', f.machen);
      const bemerkt = r.ohneAlt > 0 || r.ohneMass > 0 || r.sofort !== 1 ||
        !/Ausführungsbeispiele/.test(r.ueberschrift) ||
        !/Darstellungen des Herstellers/.test(r.hinweis);
      p(`eingebauter Fehler bemerkt: ${f.name}`, bemerkt,
        `ohneAlt ${r.ohneAlt}, ohneMass ${r.ohneMass}, sofort ${r.sofort}`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}

console.log();
if (fehler === 0) {
  console.log(GEGEN ? `Gegenprobe bestanden: alle ${anzahl} eingebauten Fehler bemerkt`
                    : `Ergebnis: alle ${anzahl} Pruefungen bestanden`);
  process.exit(0);
}
console.log(`Ergebnis: ${fehler} von ${anzahl} ${GEGEN ? 'Fehlern NICHT bemerkt' : 'Pruefungen beanstandet'}`);
process.exit(1);
