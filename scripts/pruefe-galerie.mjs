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
                'kaltwintergarten', 'eingang', 'pergola', 'balkon-fassade'];

const FEHLER = [
  /* GEZIELT EIN GALERIEBILD treffen. Der erste Versuch ersetzte das
     erste alt der ganzen Seite - das gehoerte zum Produktbild oben,
     und die Galerie blieb heil. Die Pruefung meldete dann faelschlich
     "nicht bemerkt". Gemessen am 19.11.2026. */
  /* Den Alternativtext des ERSTEN Galeriebildes leeren. Frueher stand
     hier "Ausführungsbeispiel 1"; seit dem 19.11.2026 sind es echte
     Saetze, und das Muster traf nichts mehr. Getroffen wird jetzt das
     Bild innerhalb einer Galeriekachel. */
  { name: 'Ein Alternativtext fehlt',
    machen: (t) => t.replace(/(class="galerie-kachel"[\s\S]{0,400}?<img[^>]*?) alt="[^"]*"/, '$1 alt=""') },
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
    /* NICHT auf einen bestimmten Text pruefen: Die Alternativtexte
       sind seit dem 19.11.2026 echte Saetze und aendern sich, wenn
       jemand sie verbessert. Geprueft wird die Form des Zaehlers und
       dass die Beschriftung aus den Daten kommt. */
    var sollCarport = DATEN.carport.bilder.length;
    p('Die Grossansicht zeigt Beschriftung und Zaehler',
      auf.text.indexOf(DATEN.carport.bilder[0].alt) === 0 &&
      auf.text.indexOf('(1 von ' + sollCarport + ')') > 0, auf.text.trim().slice(0, 70));

    await s.locator('.gg-vor').click();
    await s.waitForTimeout(400);
    const weiter = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    p('Blaettern wechselt das Bild',
      weiter.indexOf('(2 von ' + sollCarport + ')') > 0, weiter.trim().slice(0, 70));

    await s.keyboard.press('ArrowLeft');
    await s.waitForTimeout(300);
    const pfeil = await s.evaluate(() => document.querySelector('.gg-text').textContent);
    p('Die Pfeiltasten blaettern auch',
      pfeil.indexOf('(1 von ' + sollCarport + ')') > 0, pfeil.trim().slice(0, 70));

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

    /* ---- Zaehler und Pfeile am Streifen (19.11.2026) ----
       Am Schreibtisch, denn nur dort gibt es die Pfeile. */
    const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ds = await dctx.newPage();
    await ds.goto(`http://127.0.0.1:${PORT}/produkte/balkon-fassade.html`, { waitUntil: 'load' });
    await ds.waitForTimeout(1200);
    await ds.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
    await ds.waitForTimeout(500);
    const sollB = DATEN['balkon-fassade'].bilder.length;
    const lesen = () => ds.evaluate(() => ({
      zaehler: document.querySelector('[data-zaehler]').textContent,
      /* aria-disabled, nicht disabled: ein disabled-Knopf verliert am
         Anschlag den Tastaturfokus (WCAG 2.2, 2.4.3). Geaendert
         19.11.2026 nach dem Befund des qa-Pruefers. */
      zurueckAus: document.querySelector('[data-pfeil="zurueck"]').getAttribute('aria-disabled') === 'true',
      vorAus: document.querySelector('[data-pfeil="vor"]').getAttribute('aria-disabled') === 'true',
      hartGesperrt: document.querySelector('[data-pfeil="zurueck"]').disabled
        || document.querySelector('[data-pfeil="vor"]').disabled,
      anzeige: getComputedStyle(document.querySelector('.galerie-pfeil')).display,
      groesse: (() => { const r = document.querySelector('.galerie-pfeil').getBoundingClientRect();
        return Math.round(r.width) + 'x' + Math.round(r.height); })(),
    }));
    const start = await lesen();
    p('Der Zaehler steht am Anfang auf 1',
      start.zaehler.trim() === '1 / ' + sollB && start.zurueckAus && !start.vorAus,
      start.zaehler.trim());
    p('Die Pfeile sind am Schreibtisch da und 44 x 44 px gross',
      start.anzeige !== 'none' && start.groesse === '44x44', start.groesse);
    p('Kein Pfeil ist hart disabled (Fokus bleibt erreichbar)',
      !start.hartGesperrt, start.hartGesperrt ? 'disabled gesetzt' : 'nur aria-disabled');
    await ds.click('[data-pfeil="vor"]');
    await ds.waitForTimeout(700);
    const weiter2 = await lesen();
    p('Ein Klick auf den Pfeil schiebt genau eine Kachel',
      weiter2.zaehler.trim() === '2 / ' + sollB && !weiter2.zurueckAus, weiter2.zaehler.trim());
    await ds.evaluate(() => { const st = document.querySelector('.galerie-streifen');
      st.scrollLeft = st.scrollWidth; });
    await ds.waitForTimeout(700);
    const ende = await lesen();
    p('Am rechten Anschlag steht die letzte Nummer',
      ende.zaehler.trim() === sollB + ' / ' + sollB && ende.vorAus, ende.zaehler.trim());
    await dctx.close();

    /* Am Telefon gibt es keine Pfeile, dort wischt man. */
    const tctx = await browser.newContext({ viewport: { width: 390, height: 800 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const ts = await tctx.newPage();
    await ts.goto(`http://127.0.0.1:${PORT}/produkte/balkon-fassade.html`, { waitUntil: 'load' });
    await ts.waitForTimeout(1200);
    const tel = await ts.evaluate(() => ({
      pfeil: getComputedStyle(document.querySelector('.galerie-pfeil')).display,
      versteckt: document.querySelector('[data-zaehler]').getAttribute('aria-hidden') }));
    p('Am Telefon keine Pfeile, der Zaehler bleibt still',
      tel.pfeil === 'none' && tel.versteckt === 'true', JSON.stringify(tel));
    await tctx.close();

    /* ---- Staedteseiten (19.11.2026) ----
       Sie sind handgepflegtes HTML und laufen nicht durch Eleventy;
       ihr Block kommt aus scripts/baue-staedte-galerie.mjs. Deshalb
       hier eigens geprueft: Ohne das faellt es niemandem auf, wenn
       der Generator nicht mehr laeuft. */
    for (const [seite, schluessel] of [['carport-koblenz.html', 'carport'],
                                       ['pergola-neuwied.html', 'pergola'],
                                       ['terrassenueberdachung-hachenburg.html', 'terrassenueberdachung']]) {
      const soll = Math.min(4, DATEN[schluessel].bilder.length);
      const sctx = await browser.newContext({ viewport: { width: 390, height: 800 },
        isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const ss = await sctx.newPage();
      const vierNullVier = [];
      ss.on('response', (r) => { if (r.status() >= 400) vierNullVier.push(r.url().split('/').pop()); });
      await ss.goto(`http://127.0.0.1:${PORT}/${seite}`, { waitUntil: 'load' });
      await ss.waitForTimeout(1100);
      const r = await ss.evaluate(() => ({
        kacheln: document.querySelectorAll('.galerie-kachel').length,
        zaehler: (document.querySelector('[data-zaehler]') || {}).textContent || '',
        verweis: !!document.querySelector('.galerie-streifen-hinweis a'),
        ohneAlt: [...document.querySelectorAll('.galerie-kachel img')]
          .filter((b) => !b.getAttribute('alt')).length,
      }));
      p(`${seite}: Bilderstreifen steht in der Seite`,
        r.kacheln === soll && r.ohneAlt === 0 && vierNullVier.length === 0,
        `${r.kacheln} von ${soll}, ohne Text ${r.ohneAlt}` +
        (vierNullVier.length ? ', fehlt: ' + vierNullVier[0] : ''));
      p(`${seite}: Zaehler und Verweis auf die Produktseite`,
        r.zaehler.trim() === '1 / ' + soll && r.verweis, r.zaehler.trim());
      await sctx.close();
    }

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
