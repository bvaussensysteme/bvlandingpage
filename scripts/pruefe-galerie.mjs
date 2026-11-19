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
                    .replace(/Herstellerdarstellungen[^<]*/, '') },
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
      /Herstellerdarstellungen/.test(r0.hinweis),
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

    /* ---- Befunde der Pruefer vom 19.11.2026 ----
       Jede dieser Messungen gehoert zu einem gemeldeten Fehler. */

    /* Ein Klick in die 8 px zwischen den Pfeilen schloss die Ansicht. */
    var luecke = await s.evaluate(() => {
      const a = document.querySelector('.gg-zurueck').getBoundingClientRect();
      const c = document.querySelector('.gg-vor').getBoundingClientRect();
      return { x: Math.round((a.right + c.left) / 2), y: Math.round(a.top + a.height / 2) };
    });
    await s.mouse.click(luecke.x, luecke.y);
    await s.waitForTimeout(350);
    p('Ein Klick zwischen den Pfeilen schliesst NICHT',
      await s.evaluate(() => !document.querySelector('.galerie-gross').hidden),
      `Punkt ${luecke.x}/${luecke.y}`);

    /* Die schwebenden Knoepfe liegen hoeher und lagen darueber. */
    p('Die schwebenden Knoepfe sind waehrenddessen weg',
      0 === await s.evaluate(() => ['#bv-a11y-trigger', '#bvKonfigBubble', '#bv-scroll-top']
        .map((q) => document.querySelector(q))
        .filter((e) => e && getComputedStyle(e).visibility !== 'hidden').length),
      'keiner sichtbar');

    /* Der Rest der Seite ist fuer Hilfsmittel stillgelegt. */
    p('Der Hintergrund ist stillgelegt (inert)',
      await s.evaluate(() => !!document.querySelector('main[inert]')), 'main[inert]');

    /* Wischen statt den schmalen Pfeil treffen. */
    var vorWisch = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    await s.evaluate(() => {
      const b = document.querySelector('.gg-bild'); const r = b.getBoundingClientRect();
      const t = (typ, x) => { const tt = new Touch({ identifier: 1, target: b,
        clientX: x, clientY: r.top + r.height / 2 });
        b.dispatchEvent(new TouchEvent(typ, { touches: typ === 'touchend' ? [] : [tt],
          targetTouches: typ === 'touchend' ? [] : [tt], changedTouches: [tt],
          bubbles: true, cancelable: true })); };
      t('touchstart', r.right - 20); t('touchend', r.left + 20);
    });
    await s.waitForTimeout(350);
    var nachWisch = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    p('Wischen blaettert in der Grossansicht', vorWisch !== nachWisch,
      nachWisch.trim());

    await s.keyboard.press('Escape');
    await s.waitForTimeout(400);
    const zu = await s.evaluate(() => ({
      offen: !document.querySelector('.galerie-gross').hidden,
      fokus: document.activeElement.className,
      gesperrt: document.body.classList.contains('galerie-offen') }));
    p('Escape schliesst und gibt den Fokus zurueck',
      !zu.offen && /galerie-kachel/.test(zu.fokus) && !zu.gesperrt, JSON.stringify(zu));

    /* Der Fokusring der Kachel steht auf Weiss. --gold ergab 2,43:1,
       WCAG 2.2 1.4.11 verlangt 3:1 fuer Bedienelemente. */
    var ring = await s.evaluate(() => {
      const el = document.querySelector('.galerie-kachel'); el.focus();
      const z = (t) => (t.match(/\d+/g) || []).slice(0, 3).map(Number);
      const lum = (c) => { const v = c.map((x) => { x /= 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const l1 = lum(z(getComputedStyle(el).outlineColor)), l2 = lum([255, 255, 255]);
      return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
    });
    p('Der Fokusring der Kachel erfuellt 3:1', ring >= 3, ring + ':1');
    await ctx.close();

    /* ENG UND QUER: Bei 200 % Zoom und im Querformat muss alles
       erreichbar bleiben (WCAG 2.2, 1.4.4 und 1.4.10). */
    for (const [w, h, wie] of [[320, 256, '200 % Zoom'], [844, 390, 'Querformat']]) {
      const e = await browser.newContext({ viewport: { width: w, height: h },
        isMobile: w < 500, hasTouch: true, deviceScaleFactor: 1 });
      const es = await e.newPage();
      await es.goto(`http://127.0.0.1:${PORT}/produkte/carport.html`, { waitUntil: 'load' });
      await es.waitForTimeout(900);
      await es.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
      await es.waitForTimeout(600);
      await es.evaluate(() => { document.querySelector('.galerie-kachel').scrollIntoView();
                                document.querySelector('.galerie-kachel').click(); });
      await es.waitForTimeout(600);
      const r = await es.evaluate(() => {
        const im = (x) => { const b = x.getBoundingClientRect();
          return b.top >= -1 && b.left >= -1 && b.bottom <= innerHeight + 1
                 && b.right <= innerWidth + 1 && b.width > 0; };
        return { zu: im(document.querySelector('.gg-zu')),
                 vor: im(document.querySelector('.gg-vor')),
                 text: im(document.querySelector('.gg-text')) };
      });
      p(`${wie} (${w}x${h}): Schliessen, Blaettern und Text im Bild`,
        r.zu && r.vor && r.text, JSON.stringify(r));
      await e.close();
    }
  } else {
    for (const f of FEHLER) {
      const r = await messen('carport', f.machen);
      const bemerkt = r.ohneAlt > 0 || r.ohneMass > 0 || r.sofort !== 1 ||
        !/Ausführungsbeispiele/.test(r.ueberschrift) ||
        !/Herstellerdarstellungen/.test(r.hinweis);
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
