#!/usr/bin/env node
/* ============================================================
   SIND DIE STRUKTURIERTEN DATEN UEBERHAUPT LESBAR?

   ANLASS (22.11.2026). Beim Entfernen einer erfundenen Angabe habe
   ich selbst einen HTML-Kommentar in einen JSON-LD-Block gesetzt.
   Damit war der Block kaputt: JSON kennt keine Kommentare. Keine
   der 77 vorhandenen Pruefungen hat das bemerkt, aufgefallen ist es
   nur, weil ich zufaellig von Hand nachgerechnet habe. Google haette
   den Block stillschweigend verworfen, und niemand haette es
   gemerkt, bis die Snippets verschwinden.

   Diese Pruefung liest JEDEN <script type="application/ld+json">
   auf JEDER ausgelieferten Seite und versucht, ihn zu lesen.

   Dazu eine zweite Frage, aus demselben Anlass: Verspricht ein Block
   eine SearchAction, also eine Suchfunktion unter ?q=..., die es auf
   der Seite gar nicht gibt? Strukturierte Daten duerfen nur
   beschreiben, was die Seite wirklich kann.

   Aufruf:     node scripts/pruefe-schema-gueltig.mjs
   Gegenprobe: node scripts/pruefe-schema-gueltig.mjs --gegenprobe
   Die Gegenprobe legt einen Kommentar und eine erfundene
   SearchAction in eine Kopie im Speicher. Beides MUSS auffallen.
   ============================================================ */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(50)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(50)} ${beleg || ''}`); }
}

/* Was nicht hochgeladen wird, kann Google auch nicht lesen. */
const nichtAusgeliefert = new Set(
  readFileSync(WURZEL + '.assetsignore', 'utf8').split('\n')
    .map((z) => z.trim()).filter((z) => z && !z.startsWith('#')));

const seiten = execSync("git ls-files '*.html'", { cwd: WURZEL, encoding: 'utf8' })
  .split('\n').map((z) => z.trim())
  .filter((d) => d && !nichtAusgeliefert.has(d) && !d.startsWith('werkstatt/'));

console.log(GEGENPROBE
  ? 'Gegenprobe: Kommentar und erfundene Suche in die Daten gelegt'
  : `Strukturierte Daten: ${seiten.length} Seiten`);

const kaputt = [], erfundeneSuche = [];
let bloecke = 0;

for (const d of seiten) {
  let html = readFileSync(WURZEL + d, 'utf8');
  /* Die beiden Faelle muessen in VERSCHIEDENE Dateien, sonst
     verdeckt der kaputte Block den anderen Befund: Ein Block, der
     sich nicht lesen laesst, wird nicht weiter untersucht. Genau das
     ist beim ersten Versuch am 22.11.2026 passiert. */
  if (GEGENPROBE && d === 'index.html') {
    html = html.replace('<script type="application/ld+json">',
      '<script type="application/ld+json">\n<!-- kaputt -->');
  }
  if (GEGENPROBE && d === 'carport-koblenz.html') {
    html = html.replace('"@type": "BreadcrumbList"',
      '"potentialAction": {"@type": "SearchAction", "target": "https://x/?q={search_term_string}"}, "@type": "BreadcrumbList"');
  }
  const treffer = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  treffer.forEach((m, i) => {
    bloecke++;
    let daten = null;
    try { daten = JSON.parse(m[1]); }
    catch (e) { kaputt.push(`${d} Block ${i + 1}: ${String(e.message).slice(0, 44)}`); return; }
    /* Eine versprochene Suche muss die Seite auch auswerten. */
    if (/"SearchAction"/.test(m[1])) {
      const wertetAus = /URLSearchParams|location\.search/.test(html);
      if (!wertetAus) erfundeneSuche.push(`${d} Block ${i + 1}`);
    }
    if (!daten['@context']) kaputt.push(`${d} Block ${i + 1}: ohne @context`);
  });
}

pruef('Jeder JSON-LD-Block ist lesbar', kaputt.length === 0,
  kaputt.length ? kaputt.slice(0, 3).join(' | ') : `${bloecke} Blöcke auf ${seiten.length} Seiten`);
pruef('Keine versprochene Suche ohne Suchfunktion', erfundeneSuche.length === 0,
  erfundeneSuche.length ? erfundeneSuche.join(', ') : 'keine SearchAction ohne ?q=-Auswertung');

if (GEGENPROBE) {
  const faellt = kaputt.length > 0 && erfundeneSuche.length > 0;
  console.log(`\nGegenprobe: ${faellt ? 'beide Fälle fallen auf' : 'FEHLER, nicht beides fiel auf'}`);
  process.exit(faellt ? 0 : 1);
}

console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
