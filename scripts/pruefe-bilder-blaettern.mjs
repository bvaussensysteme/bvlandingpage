#!/usr/bin/env node
/* ============================================================
   BILDER BLAETTERN IN DEN LEISTUNGSKARTEN

   ANLASS (20.11.2026). Zuerst war hier eine Diaschau mit Takt und
   Anhalten-Knopf. Der Betreiber hat sie nach dem Ansehen verworfen:
   "Ich will nicht so eine Dia-Show mit einem Play-Button, sondern
   einfach nur, dass man die Bilder swipen kann." Diese Pruefung
   sichert deshalb AUCH ab, dass sich nichts mehr von allein bewegt
   und kein Anhalten-Knopf zurueckkommt.

   GEPRUEFT WIRD:
     1. Sieben Leistungskarten tragen eine Bildliste, jedes
        genannte Bild liegt im Repository.
     2. Ohne JavaScript steht das alte Bild unveraendert da.
     3. Am Rechner: zwei Pfeile je Karte, unsichtbar bis die Maus
        drueberfaehrt, 44 x 44 px, mit Namen. Klicken blaettert
        vor und zurueck.
     4. Nichts wechselt von allein, und es gibt keinen
        Anhalten-Knopf mehr.
     5. Am Telefon: KEINE Pfeile. Ein Knopf, der dort nie sichtbar
        wird, aber im Tab-Weg steht, waere genau der Fall aus
        WCAG 2.2, 2.4.11.
     6. Am Telefon blaettert waagerechtes Wischen, senkrechtes
        nicht (das ist Scrollen).
     7. Mit der Tastatur: Der Pfeil wird sichtbar, sobald er den
        Fokus hat.
     8. Keine Javascript-Fehler.
     9. Unter jedem Bild stehen Punkte, einer je Bild, der aktive
        in Gold und groesser. Sie liegen im Bild, tragen
        aria-hidden und sind KEINE Schaltflaechen: Ein 7-px-Punkt
        waere eine Tippflaeche weit unter den 24 x 24 px aus
        WCAG 2.2, 2.5.8.
    10. Daneben ein unsichtbarer Satz "Bild 2 von 6" fuer
        Hilfsmittel, der beim Blaettern mitgeht (WCAG 2.2, 4.1.3).
    11. Oben rechts die Zahl "1 / 6": klein, im Bild, mit
        aria-hidden (der Satz aus Punkt 10 sagt dasselbe in
        ganzen Worten), und sie geht beim Blaettern mit.

   Aufruf:     node scripts/pruefe-bilder-blaettern.mjs
   Gegenprobe: node scripts/pruefe-bilder-blaettern.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8811;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); fehler++; }
};

/* --- Teil 1: ohne Browser --- */
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const listen = [...html.matchAll(/data-bilder="([^"]*)"/g)].map((m) =>
  JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&')));
p('Sieben Leistungskarten tragen eine Bildliste', listen.length === 7, `${listen.length} gefunden`);
let fehlend = [], kurz = [];
for (const l of listen) {
  if (l.length < 2) kurz.push(l.length);
  for (const b of l) if (!fs.existsSync(path.join(WURZEL, b.d))) fehlend.push(b.d);
}
p('Jedes genannte Bild liegt im Repository', fehlend.length === 0,
  fehlend.length ? fehlend.slice(0, 2).join(', ') : `${listen.flat().length} Bilder`);
p('Keine Liste mit weniger als zwei Bildern', kurz.length === 0, kurz.join(', ') || 'alle >= 2');
p('Ohne JavaScript steht ein Bild in der Karte',
  (html.match(/<div class="leistung-img"[^>]*><picture>/g) || []).length >= 7, 'picture vorhanden');

/* --- Teil 2: im Browser --- */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

async function seite(mobil) {
  const ctx = await browser.newContext(mobil
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const laerm = [];
  pg.on('console', (m) => { if (m.type() === 'error') laerm.push(m.text().slice(0, 60)); });
  if (GEGEN) await pg.route('**/js/bilder-blaettern.js*', (r) => r.abort());
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await pg.bringToFront();
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => {
    const e = document.querySelector('.leistung-img[data-bilder]');
    if (e) e.scrollIntoView({ block: 'center' });
  });
  await pg.waitForTimeout(400);
  return { ctx, pg, laerm };
}
const lesen = (pg) => pg.evaluate(() => {
  const e = document.querySelector('.leistung-img[data-bilder]');
  if (!e) return { pfeile: 0, src: '', alt: '' };
  const pf = e.querySelector('.bildwechsel-pfeil');
  const r = pf && pf.getBoundingClientRect();
  const pk = e.querySelector('.bildwechsel-punkte');
  const akt = pk && pk.querySelector('.ist-da');
  const kasten = e.getBoundingClientRect();
  const pr = pk && pk.getBoundingClientRect();
  return {
    pfeile: document.querySelectorAll('.bildwechsel-pfeil').length,
    punkte: pk ? pk.children.length : 0,
    aktiv: akt ? [...pk.children].indexOf(akt) + 1 : 0,
    aktivFarbe: akt ? getComputedStyle(akt).backgroundColor : '',
    aktivBreite: akt ? getComputedStyle(akt).width : '',
    ruhigBreite: pk && pk.children[1] ? getComputedStyle(pk.children[1]).width : '',
    punkteVersteckt: pk ? pk.getAttribute('aria-hidden') : '',
    punkteKnoepfe: pk ? pk.querySelectorAll('button,a').length : 0,
    punkteImBild: pr ? (pr.left >= kasten.left && pr.right <= kasten.right
      && pr.bottom <= kasten.bottom) : false,
    satz: (e.querySelector('.sr-only') || {}).textContent || '',
    zahl: (e.querySelector('.bildwechsel-zahl') || {}).textContent || '',
    zahlVersteckt: (e.querySelector('.bildwechsel-zahl') || {}).getAttribute
      ? e.querySelector('.bildwechsel-zahl').getAttribute('aria-hidden') : '',
    zahlImBild: (() => {
      const z = e.querySelector('.bildwechsel-zahl');
      if (!z) return false;
      const r = z.getBoundingClientRect();
      return r.left >= kasten.left && r.right <= kasten.right
        && r.top >= kasten.top && r.bottom <= kasten.bottom;
    })(),
    alleKarten: [...document.querySelectorAll('.leistung-img[data-bilder] .bildwechsel-punkte')]
      .map((x) => x.children.length),
    halt: document.querySelectorAll('.diaschau-halt').length,
    src: (e.querySelector('img').getAttribute('src') || '').split('/').pop(),
    alt: e.querySelector('img').getAttribute('alt') || '',
    deckkraft: pf ? getComputedStyle(pf).opacity : '-',
    groesse: r ? Math.round(r.width) + 'x' + Math.round(r.height) : '-',
    name: pf ? pf.getAttribute('aria-label') : '-',
  };
});

try {
  /* a) Rechner */
  const { ctx, pg, laerm } = await seite(false);
  const ruhe = await lesen(pg);
  p('Am Rechner: zwei Pfeile je Karte', ruhe.pfeile === 14, `${ruhe.pfeile} Pfeile`);
  p('Die Pfeile sind unsichtbar, solange die Maus wegbleibt',
    ruhe.deckkraft === '0', `Deckkraft ${ruhe.deckkraft}`);
  /* GEAENDERT 23.11.2026. Hier stand "genau 44 x 44 px". Auf Ansage
   * des Betreibers ("mach diese pfeile links/rechts etwas kleiner und
   * platziere sie links von den unteren punkten und rechts") sind die
   * Pfeile jetzt 36 px gross und sitzen in einer Leiste unten.
   *
   * Geprueft wird deshalb nicht mehr eine Wunschgroesse, sondern die
   * Untergrenze, die wirklich gilt: 24 x 24 px aus WCAG 2.2, 2.5.8.
   * Darunter darf es nie gehen, auch nicht auf Zuruf. Die 44 px, die
   * wir uns sonst vornehmen, sind hier bewusst unterschritten: Der
   * Pfeil ist eine Zusatzhilfe, Wischen und Antippen des Bildes
   * bleiben. */
  const [pb, ph] = String(ruhe.groesse || '0x0').split('x').map(Number);
  p('Die Pfeile sind mindestens 24 x 24 px und heissen etwas',
    pb >= 24 && ph >= 24 && /Bild$/.test(ruhe.name || ''), `${ruhe.groesse}, "${ruhe.name}"`);
  if (ruhe.pfeile) {
    await pg.hover('.leistung-img[data-bilder]');
    await pg.waitForTimeout(400);
    const drueber = await lesen(pg);
    p('Beim Drueberfahren tauchen sie auf', drueber.deckkraft === '1',
      `Deckkraft ${drueber.deckkraft}`);
    await pg.click('.bildwechsel-vor');
    await pg.waitForTimeout(700);
    const weiter = await lesen(pg);
    p('Klick rechts blaettert weiter', weiter.src !== ruhe.src, weiter.src);
    await pg.click('.bildwechsel-zurueck');
    await pg.waitForTimeout(700);
    const zurueck = await lesen(pg);
    p('Klick links blaettert zurueck', zurueck.src === ruhe.src, zurueck.src);
    p('Die Zahl geht beim Blaettern mit',
      weiter.zahl.trim() === '2 / ' + weiter.punkte
        && zurueck.zahl.trim() === '1 / ' + zurueck.punkte,
      `${weiter.zahl.trim()} -> ${zurueck.zahl.trim()}`);
    p('Der Punkt und der vorgelesene Satz gehen mit',
      weiter.aktiv === 2 && /Bild 2 von \d/.test(weiter.satz)
        && zurueck.aktiv === 1 && /Bild 1 von \d/.test(zurueck.satz),
      `${weiter.satz} -> ${zurueck.satz}`);
    /* Tastatur: Fokus macht sichtbar (WCAG 2.2, 2.4.11) */
    const sichtbar = await pg.evaluate(() => {
      const k = document.querySelector('.bildwechsel-pfeil');
      k.focus();
      return getComputedStyle(k).opacity;
    });
    p('Mit dem Fokus wird der Pfeil sichtbar', sichtbar === '1', `Deckkraft ${sichtbar}`);
  }
  const vor = await lesen(pg);
  await pg.waitForTimeout(7000);
  const nach = await lesen(pg);
  p('Nichts wechselt von allein', vor.src === nach.src, nach.src);
  p('Kein Anhalten-Knopf mehr', nach.halt === 0, `${nach.halt} gefunden`);
  p('Keine Javascript-Fehler', laerm.length === 0, laerm.slice(0, 1).join(' ') || 'Konsole still');

  /* Punkte: der Hinweis, dass es mehr als ein Bild gibt. */
  const pu = await lesen(pg);
  p('Jede Karte hat so viele Punkte wie Bilder',
    pu.alleKarten.length === 7 && pu.alleKarten.every((n) => n >= 2 && n <= 6),
    pu.alleKarten.join(', '));
  p('Der aktive Punkt ist golden UND groesser (WCAG 1.4.1)',
    /^rgb\(19[0-9], 1[0-9]{2}, [0-9]{1,2}\)$/.test(pu.aktivFarbe)
      && parseFloat(pu.aktivBreite) > parseFloat(pu.ruhigBreite),
    `${pu.aktivFarbe}, ${pu.aktivBreite} gegen ${pu.ruhigBreite}`);
  p('Die Punkte liegen im Bild und ragen nirgends heraus', pu.punkteImBild, '');
  p('Oben rechts steht die Zahl, im Bild und mit aria-hidden',
    /^\d+ \/ \d+$/.test(pu.zahl.trim()) && pu.zahlImBild && pu.zahlVersteckt === 'true',
    `"${pu.zahl.trim()}", im Bild ${pu.zahlImBild}`);
  p('Die Punkte sind Anzeige, keine Schaltflaechen (WCAG 2.5.8)',
    pu.punkteVersteckt === 'true' && pu.punkteKnoepfe === 0,
    `aria-hidden ${pu.punkteVersteckt}, ${pu.punkteKnoepfe} Knoepfe`);
  await ctx.close();

  /* b) Telefon */
  const m = await seite(true);
  const t1 = await lesen(m.pg);
  p('Am Telefon gibt es keine Pfeile (WCAG 2.4.11)', t1.pfeile === 0, `${t1.pfeile} gefunden`);
  p('Am Telefon sind die Punkte trotzdem da', t1.punkte >= 2 && t1.punkteImBild,
    `${t1.punkte} Punkte`);
  const wischen = (dx, dy) => m.pg.evaluate(([dx, dy]) => {
    const e = document.querySelector('.leistung-img[data-bilder]');
    if (!e) return;
    const mk = (typ, x, y) => {
      const b = new Touch({ identifier: 1, target: e, clientX: x, clientY: y });
      e.dispatchEvent(new TouchEvent(typ, { bubbles: true, cancelable: true,
        touches: typ === 'touchend' ? [] : [b], changedTouches: [b] }));
    };
    mk('touchstart', 300, 60); mk('touchmove', 300 + dx, 60 + dy); mk('touchend', 300 + dx, 60 + dy);
  }, [dx, dy]);
  await wischen(-180, 2);
  await m.pg.waitForTimeout(700);
  const t2 = await lesen(m.pg);
  p('Waagerechtes Wischen blaettert', t2.src !== t1.src, t2.src);
  await wischen(5, 240);
  await m.pg.waitForTimeout(600);
  const t3 = await lesen(m.pg);
  p('Senkrechtes Wischen blaettert nicht (das ist Scrollen)', t3.src === t2.src, t3.src);
  await m.ctx.close();
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler > 0
    ? `blockiertes Skript bemerkt (${fehler} Beanstandungen)` : 'NICHT bemerkt'}`);
  process.exit(fehler > 0 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
