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
 * Aufruf:  node scripts/pruefe-galerie.mjs [--gegenprobe]
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
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(54)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(54)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: ein Lightbox-Eintrag fehlt'
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
    const m = (k.getAttribute('onclick') || '').match(/openLightbox\((\d+)\)/);
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

if (GEGENPROBE) {
  await seite.evaluate(() => { window.lightboxImages.splice(0, 1); });
}

/* Jede Karte anklicken und nachsehen, welches Bild wirklich erscheint. */
let falsch = [];
for (let i = 0; i < daten.karten.length; i++) {
  await seite.evaluate((n) => {
    document.querySelectorAll('#galerie .galerie-item:not(.galerie-placeholder)')[n].click();
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
