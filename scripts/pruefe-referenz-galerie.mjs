#!/usr/bin/env node
/* Prueft, ob die Referenz-Galerie auf der Startseite und die Lightbox
 * zusammenpassen – im echten Browser.
 *
 * ANLASS (13.11.2026). Beim Einbau einer eigenen Carport-Referenz mussten
 * zwei Karten MITTEN in die Galerie. Die Karten rufen openLightbox(N) mit
 * einer festen Nummer auf, die in das Feld lightboxImages in js/main.js
 * zeigt. Jede Einfuegung verschiebt alle folgenden Nummern. Geht das
 * schief, oeffnet eine Karte das falsche Bild – und zwar lautlos: kein
 * Fehler in der Konsole, kein kaputtes Bild, nur die falsche Referenz
 * unter der falschen Beschriftung. Bei Fremd- und Eigenaufnahmen
 * nebeneinander ist das keine Schoenheitsfrage: Dann stuende ein
 * Herstellerfoto unter „Referenz BV AussenSysteme".
 *
 * UMBENANNT am 19.11.2026. Die Datei hiess bis dahin
 * scripts/pruefe-galerie.mjs. An dem Tag entstand eine ZWEITE, voellig
 * andere Pruefung fuer die neuen Produkt-Galerien ("Ausfuehrungsbeispiele")
 * und bekam versehentlich denselben Dateinamen. Dabei ging dieser Inhalt
 * verloren; aufgefallen ist es dem cto-Pruefer am selben Tag. Seitdem:
 * pruefe-referenz-galerie.mjs = Startseite, pruefe-galerie.mjs =
 * Produkt- und Staedteseiten. Zwei Pruefungen, zwei Namen.
 *
 * Aufruf:  node scripts/pruefe-referenz-galerie.mjs [--gegenprobe]
 *
 * --gegenprobe entfernt im geladenen Dokument den ersten Eintrag aus
 * lightboxImages. Dann MUSS die Zuordnung auffallen.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8258;

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

const WURZEL = new URL('..', import.meta.url).pathname;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: WURZEL, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
/* In der Gegenprobe sind drei Dinge absichtlich kaputt gemacht. Die
   betroffenen Pruefungen MUESSEN dort fehlschlagen; gewertet wird
   stattdessen, ob die Sabotage auffaellt (siehe unten). */
const SABOTIERT = ['Tabulator erreicht jedes Bild', 'Fokus kehrt zum Bild zurueck',
                   'Jede Karte oeffnet ihr eigenes Bild'];
function pruef(name, ok, beleg) {
  if (GEGENPROBE && SABOTIERT.includes(name)) {
    console.log('  (sabotiert) ' + name.padEnd(48) + ' ' + (beleg || ''));
    return;
  }
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: Eintrag verschoben, Tastaturweg gekappt, Rueckkehr gekappt'
                       : 'Referenz-Galerie und Lightbox');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const seite = await browser.newPage();
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));
const BASIS = `http://127.0.0.1:${PORT}`;
await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
await seite.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
await seite.waitForTimeout(600);

const daten = await seite.evaluate(() => {
  /* Die Platzhalter-Kachel am Ende ("Ihr Traumplatz entsteht gerade")
     hat absichtlich kein Bild und keine Nummer - sie wirbt fuer die
     naechste Referenz und wird hier ausgenommen. */
  const karten = [...document.querySelectorAll('#galerie .galerie-item:not(.galerie-placeholder)')].map((k) => {
    const img = k.querySelector('img');
    /* Die Nummer stand bis zum 21.11.2026 am div selbst. Seit die
       Bilder mit der Tastatur zu oeffnen sind, traegt sie die
       Schaltflaeche .galerie-oeffnen darin. */
    const knopf = k.querySelector('.galerie-oeffnen');
    const m = ((knopf || k).getAttribute('onclick') || '').match(/openLightbox\((\d+)/);
    const b = k.querySelector('.vd-badge-tip');
    return { nummer: m ? Number(m[1]) : null,
             bild: img ? img.getAttribute('src') : null,
             alt: img ? (img.getAttribute('alt') || '') : '',
             breite: img ? img.getAttribute('width') : null,
             hoehe: img ? img.getAttribute('height') : null,
             quelle: b ? b.textContent.trim() : '' };
  });
  return { karten, lightbox: (window.lightboxImages || []).map((x) => x.src) };
});

pruef('Es gibt Karten in der Galerie', daten.karten.length > 0, `${daten.karten.length} Karten`);
pruef('Jede Karte hat eine Lightbox-Nummer',
  daten.karten.every((k) => k.nummer !== null), 'alle');
pruef('Die Nummern sind fortlaufend ab 0',
  daten.karten.every((k, i) => k.nummer === i),
  daten.karten.map((k) => k.nummer).join(','));
pruef('Ebenso viele Lightbox-Eintraege wie Karten',
  daten.lightbox.length === daten.karten.length,
  `${daten.karten.length} Karten, ${daten.lightbox.length} Eintraege`);
pruef('Jede Karte hat einen Alternativtext',
  daten.karten.every((k) => k.alt.length > 10),
  daten.karten.filter((k) => k.alt.length <= 10).length + ' ohne');
pruef('Jede Karte nennt ihre Herkunft',
  daten.karten.every((k) => /Referenz/.test(k.quelle)), 'alle');
pruef('Jede Karte gibt Breite und Hoehe an',
  daten.karten.every((k) => k.breite && k.hoehe), 'alle');

/* Gehoert das Vollbild zur Kachel? Gleicher Name plus "-full",
   Dateiendung egal (die eigenen Bilder liegen teils als .jpg vor). */
const stamm = (p) => (p || '').split('/').pop().replace(/\?.*$/, '').replace(/-full/, '').replace(/\.[a-z]+$/i, '');
pruef('Vollbild und Kachel gehoeren zusammen',
  daten.karten.every((k, i) => stamm(k.bild) === stamm(daten.lightbox[i])),
  daten.karten.map((k, i) => stamm(k.bild) === stamm(daten.lightbox[i]) ? '' : `${i}:${stamm(k.bild)}≠${stamm(daten.lightbox[i])}`).filter(Boolean).join(' ') || 'alle');

/* ============================================================
   TASTATUR (ab 21.11.2026)

   ANLASS: Bis zum 21.11.2026 hing das onclick an einem div. Mit der
   Tastatur liess sich kein einziges der 14 Bilder oeffnen - WCAG 2.2,
   2.1.1, Stufe A. Gemessen am 20.11.2026, behoben am 21.11.2026.

   AM GEGENSTAND, NICHT AM MUSTER: Hier wird nicht geprueft, ob ein
   <button> im HTML steht. Gezaehlt wird, welche Kachel nach ECHTEN
   Tastendruecken (Playwright schickt native Ereignisse, keine
   nachgebauten) wirklich die Grossansicht oeffnet, und wohin der
   Fokus danach zurueckkehrt. Ein button mit tabindex="-1" oder einer
   unter einem anderen Element wuerde hier auffallen.
   ============================================================ */
if (GEGENPROBE) {
  /* Sabotage 1: Tastaturweg kappen. */
  await seite.evaluate(() => {
    document.querySelectorAll('#galerie .galerie-oeffnen').forEach((k) => k.setAttribute('tabindex', '-1'));
  });
  /* Sabotage 2: Rueckkehr des Fokus kappen. */
  await seite.evaluate(() => {
    window.__echtesSchliessen = window.closeLightbox;
    window.closeLightbox = function () {
      document.getElementById('lightbox').classList.remove('open');
      document.body.style.overflow = '';
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    };
  });
}

/* Keine Schaltflaeche in einer Schaltflaeche. Das waere ungueltiges
   HTML und genau die Falle, an der die Korrektur haengen blieb: in
   jeder Kachel sitzt schon das Herkunfts-Abzeichen. */
const verschachtelt = await seite.$$eval('#galerie button button', (e) => e.length);
pruef('Keine Schaltflaeche in einer Schaltflaeche', verschachtelt === 0, verschachtelt + ' gefunden');

/* Erreicht der Tabulator die Bilder? Echte Tab-Druecke, ab der
   Ueberschrift des Abschnitts. 60 Druecke reichen fuer 14 Bilder,
   14 Abzeichen und Beiwerk. */
await seite.evaluate(() => {
  const h = document.getElementById('galerie-h');
  h.setAttribute('tabindex', '-1');
  h.focus();
});
const ertabbt = new Set();
for (let i = 0; i < 60; i++) {
  await seite.keyboard.press('Tab');
  const n = await seite.evaluate(() => {
    const a = document.activeElement;
    if (!a || !a.classList || !a.classList.contains('galerie-oeffnen')) return -1;
    return [...document.querySelectorAll('#galerie .galerie-oeffnen')].indexOf(a);
  });
  if (n >= 0) ertabbt.add(n);
}
pruef('Tabulator erreicht jedes Bild', ertabbt.size === daten.karten.length,
  ertabbt.size + ' von ' + daten.karten.length + ' Bildern');

/* Oeffnet die Eingabetaste, und kommt der Fokus danach zurueck?
   An allen Kacheln gemessen, nicht an einer Stichprobe. */
let stummeTaste = [], fokusVerloren = [];
for (let i = 0; i < daten.karten.length; i++) {
  const lagRichtig = await seite.evaluate((n) => {
    const k = document.querySelectorAll('#galerie .galerie-oeffnen')[n];
    /* Ohne Schaltflaeche ist die Pruefung nicht bestanden, sondern
       fehlgeschlagen. Beim Messen des alten Standes am 21.11.2026
       brach das Skript hier mit einer Ausnahme ab, statt einen
       Fehler zu melden. */
    if (!k) return false;
    k.focus();
    return document.activeElement === k;
  }, i);
  await seite.keyboard.press('Enter');
  await seite.waitForTimeout(90);
  const offen = await seite.evaluate(() =>
    document.getElementById('lightbox').classList.contains('open'));
  if (!offen || !lagRichtig) { stummeTaste.push(i); continue; }
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(90);
  const zurueck = await seite.evaluate((n) =>
    document.activeElement === document.querySelectorAll('#galerie .galerie-oeffnen')[n], i);
  if (!zurueck) fokusVerloren.push(i);
  await seite.evaluate(() => {
    const b = document.getElementById('lightbox');
    if (b) b.classList.remove('open');
    document.body.style.overflow = '';
  });
}
pruef('Eingabetaste oeffnet jedes Bild', stummeTaste.length === 0,
  stummeTaste.length ? 'stumm: ' + stummeTaste.join(',') : daten.karten.length + ' Bilder');
pruef('Fokus kehrt zum Bild zurueck', fokusVerloren.length === 0,
  fokusVerloren.length ? 'verloren bei: ' + fokusVerloren.join(',') : daten.karten.length + ' Bilder');

if (GEGENPROBE) {
  await seite.evaluate(() => {
    if (window.__echtesSchliessen) window.closeLightbox = window.__echtesSchliessen;
    document.querySelectorAll('#galerie .galerie-oeffnen').forEach((k) => k.removeAttribute('tabindex'));
    /* Sabotage 3: ein Eintrag verschwindet, alle Nummern verschieben sich. */
    window.lightboxImages.splice(0, 1);
  });
}

/* Jede Karte anklicken und nachsehen, welches Bild wirklich erscheint. */
let falsch = [];
for (let i = 0; i < daten.karten.length; i++) {
  await seite.evaluate((n) => {
    const k = document.querySelectorAll('#galerie .galerie-oeffnen')[n];
    if (k) k.click();   /* fehlt sie, faellt es oben schon auf */
  }, i);
  await seite.waitForTimeout(120);
  const gezeigt = await seite.evaluate(() => {
    const e = document.getElementById('lightbox-img');
    return e ? e.getAttribute('src') : null;
  });
  if (stamm(gezeigt) !== stamm(daten.karten[i].bild)) falsch.push(`${i}: zeigt ${stamm(gezeigt)}`);
  await seite.evaluate(() => {
    const b = document.getElementById('lightbox');
    if (b) b.classList.remove('open');
    document.body.style.overflow = '';
  });
}

if (GEGENPROBE) {
  pruef('Der gekappte Tastaturweg faellt auf', ertabbt.size < daten.karten.length,
    'nur ' + ertabbt.size + ' von ' + daten.karten.length + ' ertabbt');
  pruef('Die gekappte Rueckkehr faellt auf', fokusVerloren.length > 0,
    fokusVerloren.length + ' Bilder ohne Rueckkehr');
  pruef('Die Verschiebung faellt auf', falsch.length > 0,
    `${falsch.length} Karte(n) zeigen das falsche Bild`);
} else {
  pruef('Jede Karte oeffnet ihr eigenes Bild', falsch.length === 0,
    falsch.length ? falsch.slice(0, 3).join(' | ') : `${daten.karten.length} Karten geprueft`);
  pruef('Kein Javascript-Fehler', konsole.length === 0,
    konsole.length ? konsole[0].slice(0, 60) : 'Konsole still');
}

/* Liegen alle Dateien ueberhaupt? */
const fehlend = [];
for (const pfad of [...daten.karten.map((k) => k.bild), ...daten.lightbox]) {
  const rein = (pfad || '').replace(/\?.*$/, '');
  if (!existsSync(`${WURZEL}${rein}`)) fehlend.push(rein);
}
pruef('Alle Bilddateien liegen im Repository', fehlend.length === 0,
  fehlend.length ? fehlend.slice(0, 3).join(' ') : `${daten.karten.length * 2} Dateien`);

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
