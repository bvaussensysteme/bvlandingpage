#!/usr/bin/env node
/* ============================================================
   DER REFERENZ-LAUF AUF DER STARTSEITE
   ("Projekte, die fuer sich sprechen")

   ANLASS (20.11.2026). Der Betreiber meldete nach dem Umbau auf
   Punkte zwei Dinge vom Telefon: "das wischen klappt nicht und man
   sieht ein stueck vom naechsten bild rechts am rand."

   Beides bestaetigt und behoben:
     - touch-action: pan-y stand am Lauf, mit dem Kommentar, das
       lasse waagerechtes Wischen zu. Das Gegenteil ist richtig:
       pan-y erlaubt dem Browser NUR senkrechtes Schieben. Gemessen:
       scrollLeft blieb 0. Ohne die Zeile gilt auto, und es geht.
     - Die Kacheln waren 86vw breit, der Lauf 362 px. Rund 27 px des
       naechsten Bildes ragten herein. Am Telefon jetzt volle Breite.

   WARUM EIN EIGENES SKRIPT: Kein bestehender Test hat den Fehler
   bemerkt, weil er nur mit einer ECHTEN Fingergeste auftritt.
   Nachgebaute TouchEvents aus einer Seite heraus loesen kein
   natives Scrollen aus; dafuer braucht es Input.dispatchTouchEvent
   ueber das Entwicklerprotokoll. Genau das macht dieses Skript.

   ACHTUNG beim Aendern: Vor der Geste muss das sanfte Scrollen aus
   sein (reducedMotion) und die Lage frisch gelesen werden. Sonst
   wandert der Lauf unter dem Finger weg, und die Pruefung meldet
   einen Fehler, den es nicht gibt. Genau das ist am 20.11.2026
   beim ersten Versuch passiert.

   Aufruf:     node scripts/pruefe-referenz-lauf.mjs
   Gegenprobe: node scripts/pruefe-referenz-lauf.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8827;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`); }
  else { console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); fehler++; }
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce',
  });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await pg.bringToFront();
  await pg.waitForTimeout(900);
  await pg.evaluate(() => { const k = document.querySelector('.cb-btn--necessary'); if (k) k.click(); });
  await pg.waitForTimeout(400);

  if (GEGEN) {
    /* Die beiden gemeldeten Fehler wieder einbauen. Beide muessen
       auffallen. */
    await pg.addStyleTag({ content:
      '.galerie-grid.ist-karussell{touch-action:pan-y!important}' +
      '@media(max-width:899px){.galerie-grid.ist-karussell>.galerie-item,' +
      '.galerie-grid.ist-karussell>.galerie-item.large{flex-basis:86vw!important}}' });
  }

  await pg.evaluate(() => {
    const g = document.querySelector('#galerie .galerie-grid');
    if (g) g.scrollIntoView({ block: 'center', behavior: 'auto' });
  });
  await pg.waitForTimeout(900);

  const bau = await pg.evaluate(() => {
    const g = document.querySelector('#galerie .galerie-grid');
    if (!g) return null;
    const pk = document.querySelector('#galerie .karussell-punkte');
    const akt = pk && pk.querySelector('.ist-da');
    const k1 = g.children[0], k2 = g.children[1];
    const rr = g.getBoundingClientRect();
    return {
      punkte: pk ? pk.children.length : 0,
      bilder: g.children.length,
      pfeile: document.querySelectorAll('.karussell-knopf').length,
      balken: document.querySelectorAll('.karussell-balken').length,
      aktivFarbe: akt ? getComputedStyle(akt).backgroundColor : '',
      aktivBreite: akt ? getComputedStyle(akt).width : '',
      ruhigBreite: pk && pk.children[1] ? getComputedStyle(pk.children[1]).width : '',
      versteckt: pk ? pk.getAttribute('aria-hidden') : '',
      knoepfeInPunkten: pk ? pk.querySelectorAll('button,a').length : 0,
      touchAction: getComputedStyle(g).touchAction,
      kachel: Math.round(k1.getBoundingClientRect().width),
      lauf: Math.round(rr.width),
      naechsteSichtbar: Math.round(Math.max(0, rr.right - k2.getBoundingClientRect().left)),
      gleicheHoehe: Math.abs(k1.getBoundingClientRect().height
        - k2.getBoundingClientRect().height) < 2,
    };
  });
  p('Der Lauf ist da und hat so viele Punkte wie Bilder',
    !!bau && bau.punkte === bau.bilder && bau.punkte > 2,
    bau ? `${bau.punkte} Punkte, ${bau.bilder} Bilder` : 'nicht gefunden');
  p('Keine Pfeile und kein Fortschrittsbalken mehr',
    bau.pfeile === 0 && bau.balken === 0, `${bau.pfeile} Pfeile, ${bau.balken} Balken`);
  p('Der aktive Punkt ist golden UND groesser (WCAG 1.4.1)',
    /^rgb\(1[0-9]{2}, 1[0-9]{2}, [0-9]{1,2}\)$/.test(bau.aktivFarbe)
      && parseFloat(bau.aktivBreite) > parseFloat(bau.ruhigBreite),
    `${bau.aktivFarbe}, ${bau.aktivBreite} gegen ${bau.ruhigBreite}`);
  p('Die Punkte sind Anzeige, keine Schaltflaechen (WCAG 2.5.8)',
    bau.versteckt === 'true' && bau.knoepfeInPunkten === 0,
    `aria-hidden ${bau.versteckt}, ${bau.knoepfeInPunkten} Knoepfe`);
  p('touch-action sperrt das waagerechte Wischen nicht',
    bau.touchAction !== 'pan-y' && bau.touchAction !== 'pan-y pinch-zoom',
    bau.touchAction);
  p('Am Telefon fuellt ein Bild den Lauf, kein Rest am Rand',
    bau.naechsteSichtbar === 0 && Math.abs(bau.kachel - bau.lauf) <= 1,
    `Kachel ${bau.kachel}, Lauf ${bau.lauf}, Rest ${bau.naechsteSichtbar} px`);
  p('Alle Kacheln sind gleich hoch', bau.gleicheHoehe, '');

  /* Die echte Fingergeste. */
  const r = await pg.locator('#galerie .galerie-grid').boundingBox();
  const y = Math.round(r.y + r.height / 2);
  async function wisch(x1, x2) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent',
        { type: 'touchMove', touchPoints: [{ x: Math.round(x1 + (x2 - x1) * i / 10), y }] });
      await new Promise((z) => setTimeout(z, 20));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  const lesen = () => pg.evaluate(() => {
    const g = document.querySelector('#galerie .galerie-grid');
    const akt = document.querySelector('#galerie .karussell-punkte .ist-da');
    return { links: Math.round(g.scrollLeft), seite: Math.round(window.scrollY),
      punkt: akt ? [...akt.parentNode.children].indexOf(akt) + 1 : 0 };
  });
  const vorher = await lesen();
  await wisch(Math.round(r.x + r.width - 40), Math.round(r.x + 40));
  await pg.waitForTimeout(1000);
  const nachher = await lesen();
  p('Wischen mit dem Finger schiebt den Lauf', nachher.links > vorher.links + 100,
    `scrollLeft ${vorher.links} auf ${nachher.links}`);
  p('Der Punkt geht mit', nachher.punkt === vorher.punkt + 1,
    `Punkt ${vorher.punkt} auf ${nachher.punkt}`);
  p('Die Seite springt dabei nicht', nachher.seite === vorher.seite,
    `${vorher.seite} / ${nachher.seite}`);
  await ctx.close();
} finally {
  await browser.close();
  server.kill();
}

if (GEGEN) {
  console.log(`\nGegenprobe: ${fehler >= 2
    ? `beide eingebauten Fehler bemerkt (${fehler} Beanstandungen)`
    : `NICHT genug bemerkt (${fehler})`}`);
  process.exit(fehler >= 2 ? 0 : 1);
}
console.log(`\nErgebnis: ${fehler ? `${fehler} von ${anzahl} Pruefungen beanstandet`
  : `alle ${anzahl} Pruefungen bestanden`}`);
process.exit(fehler ? 1 : 0);
