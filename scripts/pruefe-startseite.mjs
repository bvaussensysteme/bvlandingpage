#!/usr/bin/env node
/* Prueft die Premium-Startseite (Stufe 5, 14.11.2026) im echten Browser.
 *
 * ANLASS. Die Startseite bekommt das freigegebene Designsystem
 * (docs/WEBSITE_DESIGN_SYSTEM.md) ueber eine eigene Schicht,
 * src/css/start.css, die nur unter <body class="start-premium"> wirkt.
 * Drei Dinge lassen sich dabei nicht am Quelltext ablesen:
 *   1. Ob die Schicht ueberhaupt greift (Reihenfolge, Spezifitaet).
 *   2. Ob die Seite am Handy waagerecht scrollt.
 *   3. Ob Gold als TEXT auf hellem Grund steht - die Regel aus dem
 *      Designsystem, die am leichtesten unbemerkt bricht: #C58A32
 *      erreicht auf Warmweiss nur 2,78:1 und ist dort keine Textfarbe.
 *
 * Ausserdem wird nachgesehen, dass die Bestandsfunktionen noch da sind -
 * der Auftrag schuetzt sie ausdruecklich.
 *
 * Aufruf:  node scripts/pruefe-startseite.mjs [--gegenprobe]
 *
 * --gegenprobe nimmt der Seite die Klasse `start-premium`. Dann MUSS die
 * Palettenpruefung anschlagen - sonst wuerde sie auch eine Schicht nicht
 * bemerken, die gar nicht greift.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8266;

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: Premium-Schicht abgeschaltet'
                       : 'Startseite – Premium-Schicht, Bedienung, Bestand');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const BASIS = `http://127.0.0.1:${PORT}`;

for (const [name, breite, hoehe] of [['Handy', 390, 844], ['Tablet', 768, 1024], ['Rechner', 1280, 900]]) {
  const seite = await browser.newPage();
  await seite.setViewportSize({ width: breite, height: hoehe });
  const konsole = [];
  seite.on('pageerror', (e) => konsole.push(String(e)));
  await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
  await seite.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
  await seite.waitForTimeout(700);

  if (GEGENPROBE) {
    await seite.evaluate(() => document.body.classList.remove('start-premium'));
    await seite.waitForTimeout(250);
  }

  const m = await seite.evaluate(() => {
    const st = getComputedStyle(document.body);
    const hol = (n) => st.getPropertyValue(n).trim().toUpperCase();
    const sicht = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { b: Math.round(r.width), h: Math.round(r.height) };
    };
    /* Gold als Text auf hellem Grund suchen: jedes sichtbare Textelement,
       dessen Farbe dem Markengold nahekommt und dessen naechster
       gefuellter Hintergrund hell ist. */
    const nah = (rgb, ziel) => {
      const m = rgb.match(/\d+/g); if (!m) return false;
      return Math.abs(+m[0] - ziel[0]) < 26 && Math.abs(+m[1] - ziel[1]) < 26 && Math.abs(+m[2] - ziel[2]) < 26;
    };
    const hell = (el) => {
      let e = el;
      while (e && e !== document.documentElement) {
        const bg = getComputedStyle(e).backgroundColor;
        const p = bg.match(/[\d.]+/g);
        if (p && (p.length < 4 || +p[3] > 0.5)) {
          const l = (0.299 * +p[0] + 0.587 * +p[1] + 0.114 * +p[2]);
          return l > 170;
        }
        e = e.parentElement;
      }
      return true;
    };
    const verstoesse = [];
    document.querySelectorAll('h1,h2,h3,h4,p,a,span,strong,li,td,th,label,button').forEach((el) => {
      /* Nur ECHTEN Text pruefen. Das Designsystem erlaubt Gold ausdruecklich
         als Dekor - "Symbol neben einem Text, der dasselbe sagt". Ein
         Element, das nur ein SVG enthaelt oder keinen eigenen Textknoten
         hat, ist kein Textträger. Ohne diese Zeilen meldete die Pruefung am
         14.11.2026 span.a11y-row-icon - ein Symbol mit Beschriftung daneben,
         dessen Farbe ausserdem fest in js/accessibility.js steht und gar
         nicht aus der Palette kommt. */
      if (el.querySelector('svg')) return;
      const eigener = [...el.childNodes]
        .filter((k) => k.nodeType === 3).map((k) => k.textContent).join('').trim();
      if (!eigener) return;
      if (!el.offsetParent && el.tagName !== 'BODY') return;
      const c = getComputedStyle(el).color;
      if (nah(c, [197, 138, 50]) && hell(el)) {
        verstoesse.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
      }
    });
    const prim = document.querySelector('.hs-slide--active a.btn-gold[href="#kontakt"]');
    const sek = document.querySelector('.hs-slide--active a[href="#leistungen"]');
    return {
      klasse: document.body.classList.contains('start-premium'),
      gold: hol('--gold'), goldText: hol('--gold-text'), schwarz: hol('--black'),
      schrift: st.fontFamily,
      h1: (document.querySelector('.hs-slide--active h1') || {}).textContent?.trim().slice(0, 48) || null,
      primaer: sicht(prim), sekundaer: sicht(sek),
      goldTextAufHell: [...new Set(verstoesse)],
      scrollW: document.documentElement.scrollWidth, fenster: window.innerWidth,
      // Bestandsfunktionen
      nav: document.querySelectorAll('.navbar a').length,
      assistent: !!document.getElementById('awTitle'),
      galerie: document.querySelectorAll('#galerie .galerie-item').length,
      leistungen: document.querySelectorAll('.leistungen-grid--neu .leistung-card').length,
      werkzeuge: !!document.querySelector('a[href*="windzonen"]') && !!document.querySelector('a[href*="baugenehmigung"]'),
      fuss: !!document.querySelector('footer'),
      konsoleLeer: true
    };
  });

  if (GEGENPROBE) {
    pruef(`${name}: ohne die Schicht greift die neue Palette nicht`,
      m.gold !== '#C58A32', `--gold: ${m.gold || '(leer)'}`);
    await seite.close();
    continue;
  }

  pruef(`${name}: Premium-Schicht liegt an`, m.klasse, 'body.start-premium');
  pruef(`${name}: Markengold ist gesetzt`, m.gold === '#C58A32', m.gold);
  pruef(`${name}: Textgold ist gesetzt`, m.goldText === '#896023', m.goldText);
  pruef(`${name}: Tiefschwarz ist gesetzt`, m.schwarz === '#0B0B0C', m.schwarz);
  pruef(`${name}: Manrope ist die erste Schriftwahl`, /Manrope/i.test(m.schrift), m.schrift.slice(0, 34));
  pruef(`${name}: Kein Gold als Text auf hellem Grund`,
    m.goldTextAufHell.length === 0,
    m.goldTextAufHell.length ? m.goldTextAufHell.slice(0, 3).join(' ') : 'keine Stelle');
  pruef(`${name}: Hauptueberschrift vorhanden`, !!m.h1, m.h1);
  pruef(`${name}: Anfrage-Knopf sichtbar und gross genug`,
    !!m.primaer && m.primaer.h >= 44, m.primaer ? `${m.primaer.b}x${m.primaer.h} px` : 'fehlt');
  pruef(`${name}: Zweiter Einstieg zu den Produkten`,
    !!m.sekundaer && m.sekundaer.h >= 44, m.sekundaer ? `${m.sekundaer.b}x${m.sekundaer.h} px` : 'fehlt');
  pruef(`${name}: Kein waagerechtes Scrollen`, m.scrollW <= m.fenster + 1, `${m.scrollW}/${m.fenster} px`);
  pruef(`${name}: Bestand – Navigation, Assistent, Galerie, Produkte`,
    m.nav > 3 && m.assistent && m.galerie >= 14 && m.leistungen === 9,
    `nav ${m.nav}, Galerie ${m.galerie}, Karten ${m.leistungen}`);
  pruef(`${name}: Bestand – Werkzeuge und Fuss`, m.werkzeuge && m.fuss, 'Rechner + Fuss da');
  pruef(`${name}: Kein Javascript-Fehler`, konsole.length === 0,
    konsole.length ? konsole[0].slice(0, 50) : 'Konsole still');
  await seite.close();
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
