#!/usr/bin/env node
/* ============================================================
   INDEXIERT GOOGLE DIE RICHTIGEN SEITEN?

   ANLASS (22.11.2026). Ansage des Betreibers: "außerdem muss sie SEO
   Optimiert sein die Seite, das google die richtigen seiten
   indexiert und bei googlesuche anzeigt" und "Den 3D konf lassen wir
   noch gesperrt er is noch in entwicklung."

   Beides zusammen ergibt einen harten Widerspruch, der vorher in der
   Seite stand: /konfigurator.html lag in der Sitemap, der Worker
   antwortete dort aber mit 503. Google bekommt damit eine Adresse
   angeboten, die es nicht ausliefern kann.

   Diese Pruefung rechnet nicht mit Google, sondern mit dem, was im
   Haus liegt. Sie beantwortet fuenf Fragen:

   1. Gibt es zu jeder Adresse der Sitemap eine Datei?
   2. Traegt eine davon "noindex"? Dann widerspricht die Seite der
      Sitemap, und beides zusammen ist schlimmer als jedes einzeln.
   3. Steht eine Adresse drin, die der Worker sperrt (503)?
   4. Faellt die Sperre, fehlt der Eintrag dann? (Erinnerung)
   5. Zeigt das canonical jeder Seite auf sie selbst?

   WARUM OHNE NETZ. Die Sperre steht im Worker, nicht in den Dateien.
   Ein Abruf des lokalen Dateiservers wuerde 200 liefern und nichts
   finden. Deshalb wird die Sperre aus worker/index.js gelesen.

   Aufruf:     node scripts/pruefe-sitemap.mjs
   Gegenprobe: node scripts/pruefe-sitemap.mjs --gegenprobe
   Die Gegenprobe traegt eine gesperrte und eine noindex-Adresse in
   eine Kopie der Sitemap ein. Beide MUESSEN auffallen.
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const BASIS = 'https://bv-aussensysteme.de/';

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(52)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(52)} ${beleg || ''}`); }
}

/* ---- Was der Worker sperrt ---- */
const worker = readFileSync(WURZEL + 'worker/index.js', 'utf8');
const gesperrt = /const KONFIGURATOR_GESPERRT\s*=\s*true/.test(worker);
const pfadBlock = (worker.match(/const KONFIGURATOR_PFADE = new Set\(\[([\s\S]*?)\]\)/) || [, ''])[1];
const gesperrtePfade = [...pfadBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);

/* ---- Adressen der Sitemap ---- */
let sitemap = readFileSync(WURZEL + 'sitemap.xml', 'utf8');
if (GEGENPROBE) {
  sitemap = sitemap.replace('</urlset>',
    '  <url><loc>' + BASIS + 'konfigurator.html</loc></url>\n'
    + '  <url><loc>' + BASIS + 'danke.html</loc></url>\n'
    + '  <url><loc>' + BASIS + 'gibtesnicht.html</loc></url>\n</urlset>');
}
const adressen = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

console.log(GEGENPROBE
  ? 'Gegenprobe: gesperrte, noindex- und fehlende Adresse in die Sitemap gelegt'
  : `Sitemap: ${adressen.length} Adressen`);

/* Adresse -> Datei. "/" ist index.html, sonst der Pfad selbst. */
function datei(url) {
  if (!url.startsWith(BASIS)) return null;
  const rest = url.slice(BASIS.length);
  /* Eine Adresse, die auf / endet, liefert die index.html des
     Ordners. In der Sitemap stehen zwei davon: die Startseite und
     /ratgeber/. */
  if (rest === '' || rest.endsWith('/')) return WURZEL + rest + 'index.html';
  return WURZEL + rest;
}

const fehlend = [], mitNoindex = [], falschesCanonical = [], gesperrteDrin = [];
for (const url of adressen) {
  const d = datei(url);
  if (!d) { fehlend.push(url + ' (fremde Adresse)'); continue; }
  if (!existsSync(d)) { fehlend.push(url); continue; }
  const html = readFileSync(d, 'utf8');
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) mitNoindex.push(url);
  const can = (html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  /* Die Startseite darf auf "/" zeigen, nicht auf "/index.html". */
  const erwartet = url.endsWith('/index.html') ? url.replace(/index\.html$/, '') : url;
  if (!can) falschesCanonical.push(url + ' (keins)');
  else if (can.replace(/\/$/, '/') !== erwartet) falschesCanonical.push(`${url} -> ${can}`);

  const pfad = '/' + url.slice(BASIS.length);
  if (gesperrt && gesperrtePfade.includes(pfad)) gesperrteDrin.push(url);
}

pruef('Zu jeder Adresse gibt es eine Datei', fehlend.length === 0,
  fehlend.length ? fehlend.slice(0, 3).join(', ') : `${adressen.length} Dateien da`);
pruef('Keine Adresse traegt noindex', mitNoindex.length === 0,
  mitNoindex.length ? mitNoindex.slice(0, 3).join(', ') : 'keine');
pruef('Keine vom Worker gesperrte Adresse in der Sitemap', gesperrteDrin.length === 0,
  gesperrteDrin.length ? gesperrteDrin.join(', ')
    : (gesperrt ? 'Konfigurator gesperrt und nicht gelistet' : 'nichts gesperrt'));
pruef('Jedes canonical zeigt auf die eigene Adresse', falschesCanonical.length === 0,
  falschesCanonical.length ? falschesCanonical.slice(0, 2).join(' | ') : 'alle stimmen');

/* Erinnerung in die andere Richtung: Faellt die Sperre, muss der
   Eintrag zurueck. Sonst bleibt die Seite unsichtbar fuer Google. */
if (!GEGENPROBE) {
  const konfDrin = adressen.some((u) => u.endsWith('/konfigurator.html'));
  pruef('Konfigurator: Sperre und Sitemap passen zusammen',
    gesperrt ? !konfDrin : konfDrin,
    gesperrt ? 'gesperrt, deshalb nicht in der Sitemap'
             : (konfDrin ? 'offen und gelistet' : 'SPERRE IST GEFALLEN: Eintrag wieder aufnehmen'));
}

/* Umgekehrt: Seiten, die es gibt und die NICHT in der Sitemap stehen,
   obwohl sie indexiert werden sollen. Nur melden, nicht bewerten -
   welche Seite oeffentlich sein soll, entscheidet der Betreiber. */
if (!GEGENPROBE) {
  /* Was gar nicht erst hochgeladen wird, kann auch nicht indexiert
     werden. .assetsignore ist die eine Quelle dafuer. */
  const nichtAusgeliefert = new Set(
    readFileSync(WURZEL + '.assetsignore', 'utf8').split('\n')
      .map((z) => z.trim()).filter((z) => z && !z.startsWith('#')));
  const inSitemap = new Set(adressen.map((u) => {
    const r = u.slice(BASIS.length);
    return r === '' || r.endsWith('/') ? r + 'index.html' : r;
  }));
  const alle = execSync("git ls-files '*.html'", { cwd: WURZEL, encoding: 'utf8' })
    .split('\n').map((z) => z.trim()).filter(Boolean);
  const fehltInSitemap = alle.filter((d) => {
    if (inSitemap.has(d)) return false;
    if (nichtAusgeliefert.has(d)) return false;
    if (/^werkstatt\//.test(d)) return false;
    const html = readFileSync(WURZEL + d, 'utf8');
    return !/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html);
  });
  /* NUR MELDEN, nicht bewerten. Welche Seite oeffentlich sein soll,
     entscheidet der Betreiber. Die Pruefung weiss nicht, ob eine
     Seite absichtlich draussen ist. */
  console.log(`          Hinweis: ${fehltInSitemap.length} Seite(n) ohne noindex und ohne `
    + `Sitemap-Eintrag${fehltInSitemap.length ? ': ' + fehltInSitemap.slice(0, 6).join(', ') : ''}`);
}

if (GEGENPROBE) {
  const faellt = fehlend.length > 0 && mitNoindex.length > 0 && gesperrteDrin.length > 0;
  console.log(`\nGegenprobe: ${faellt ? 'alle drei Faelle fallen auf' : 'FEHLER, nicht alles fiel auf'}`);
  process.exit(faellt ? 0 : 1);
}

console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
