#!/usr/bin/env node
/* ============================================================
   FUEHRT EIN VERWEIS INS LEERE?

   ANLASS (22.11.2026). Ansage des Betreibers: "Den 3D konf lassen
   wir noch gesperrt er is noch in entwicklung." Der Worker antwortet
   unter /konfigurator.html mit 503. Gleichzeitig standen 24 aktive
   Verweise dorthin in der Seite: sechs Werbekaesten auf
   Produktseiten, zehn Fusszeilen von Stadtseiten, ein Satz im
   Ratgeber, dazu die erzeugten Fassungen davon. Besucher landeten
   auf einer Wartungsseite, Google auf einem Fehler.

   Entscheidung des Betreibers am selben Tag: ausblenden, solange die
   Sperre gilt, und zurueckholen, wenn sie faellt.

   Diese Pruefung haelt beide Richtungen fest:

   - Sperre AN  -> kein aktiver Verweis auf /konfigurator.html.
   - Sperre AUS -> die ausgeblendeten Stellen muessen zurueck sein,
                   sonst bleibt ein fertiger Konfigurator unsichtbar.

   WAS "AKTIV" HEISST. Auskommentierte Stellen zaehlen nicht. Dafuer
   werden HTML-Kommentare und Nunjucks-Kommentare vorher entfernt.

   NICHT GEPRUEFT: /werkstatt/*. Das sind interne Seiten hinter einer
   Anmeldung, sie stehen nicht im Index und werden nicht beworben.

   Aufruf:     node scripts/pruefe-konfigurator-verweise.mjs
   Gegenprobe: node scripts/pruefe-konfigurator-verweise.mjs --gegenprobe
   Die Gegenprobe legt einen aktiven Verweis in eine Kopie im
   Speicher. Er MUSS auffallen.
   ============================================================ */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const MARKE = 'KONFIGURATOR GESPERRT, ausgeblendet am';

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(50)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(50)} ${beleg || ''}`); }
}

const worker = readFileSync(WURZEL + 'worker/index.js', 'utf8');
const gesperrt = /const KONFIGURATOR_GESPERRT\s*=\s*true/.test(worker);

const dateien = execSync("git ls-files '*.html' '*.njk'", { cwd: WURZEL, encoding: 'utf8' })
  .split('\n').map((z) => z.trim())
  .filter((d) => d && !d.startsWith('werkstatt/')
    && !d.endsWith('_template.html') && d !== 'konfigurator.html');

const aktiv = [], ausgeblendet = [];
for (const d of dateien) {
  let t = readFileSync(WURZEL + d, 'utf8');
  if (GEGENPROBE && d === 'index.html') {
    t = t.replace('</body>', '<a href="/konfigurator.html">Jetzt konfigurieren</a></body>');
  }
  if (t.includes(MARKE)) ausgeblendet.push(d);
  const ohne = t.replace(/<!--[\s\S]*?-->/g, '').replace(/\{#[\s\S]*?#\}/g, '');
  const n = (ohne.match(/href="[^"]*konfigurator\.html"/g) || []).length;
  if (n) aktiv.push(`${d} (${n})`);
}

if (gesperrt) {
  pruef('Gesperrt: kein aktiver Verweis auf den Konfigurator', aktiv.length === 0,
    aktiv.length ? aktiv.slice(0, 4).join(', ') : `${ausgeblendet.length} Stellen ausgeblendet`);
} else {
  /* Die Sperre ist gefallen. Jetzt muessen die Stellen zurueck. */
  pruef('Sperre gefallen: ausgeblendete Stellen sind zurueck', ausgeblendet.length === 0,
    ausgeblendet.length
      ? `noch ausgeblendet: ${ausgeblendet.slice(0, 4).join(', ')}`
      : `${aktiv.length} aktive Verweise`);
  pruef('Sperre gefallen: es gibt wieder Verweise', aktiv.length > 0,
    `${aktiv.length} aktive Verweise`);
}

if (GEGENPROBE) {
  const faellt = aktiv.some((z) => z.startsWith('index.html'));
  console.log(`\nGegenprobe: ${faellt ? 'der eingelegte Verweis fällt auf'
    : 'FEHLER, der eingelegte Verweis fiel nicht auf'}`);
  process.exit(faellt ? 0 : 1);
}

console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`} `
  + `(Sperre ist ${gesperrt ? 'an' : 'aus'})`);
process.exit(fehler === 0 ? 0 : 1);
