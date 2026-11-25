#!/usr/bin/env node
/* Stimmen die Garantiezahlen fuer Elektrik ueberall?
 *
 * WARUM (25.11.2026, Paket A2)
 * Feststehend laut CLAUDE.md (Abschnitt Garantie): 10 Jahre Aluminium,
 * 5 Jahre Markisen und Tuch, 2 Jahre Elektrik (Antriebe, Motoren, LED,
 * Lautsprecher, Steuerungen). Im Anfrage-Assistenten stand
 * "5 Jahre auf Markisen, Antriebe & Elektro", die Elektrik bekam also
 * 5 Jahre. Keine Pruefung hat es gesehen.
 *
 * WIE: statisch. In jeder ausgelieferten .html- und .js-Datei und in
 * src/**.njk (ohne Rechtstexte, die werden nur gemeldet, nie geaendert)
 * jede Stelle suchen, an der eine Jahreszahl innerhalb weniger Woerter
 * vor einem Elektrik-Begriff steht. Ist die Zahl nicht 2: Fehler.
 * Erkannt wird nur die Form "N Jahre ... Antriebe"; andere Satzbauten
 * sieht die Pruefung nicht. Kommentare im Code werden ausgelassen.
 *
 * GEGENPROBE: --gegenprobe prueft zusaetzlich den alten Wortlaut des
 * Assistenten im Speicher. Er MUSS auffallen.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const AUS = new Set(['node_modules', '.git', 'scripts', 'docs', '.claude', 'worker']);
const RECHT = /(^|\/)(agb|datenschutz|impressum|widerruf)\.(njk|html)$/;
function dateien(d) {
  const a = [];
  for (const e of readdirSync(d)) {
    if (AUS.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) a.push(...dateien(p));
    else if (/\.(html|js|njk)$/.test(e) && !/\.min\.js$/.test(e)) a.push(p);
  }
  return a;
}
/* Zwischen Zahl und Begriff kein "und": "auf Markisen 5 Jahre und auf
 * die Elektrik ... 2 Jahre" (index.html) ist richtig, die 5 gehoert zu
 * den Markisen. Der alte Fehler "5 Jahre auf Markisen, Antriebe &
 * Elektro" hat kein "und" und bleibt erkannt. */
const MUSTER = /(\d+)\s*Jahre\b(?:(?!\bund\b)[^.<\d]){0,40}?\b(Antrieb|Elektr|Motor|LED|Lautsprecher|Steuerung)/gi;
/* Kommentare zaehlen nicht, sie erklaeren oft gerade die Regel. */
const ohneKommentare = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\{#[\s\S]*?#\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
function pruefe(name, text) {
  const f = [];
  for (const m of ohneKommentare(text).replace(/<\/?strong>/g, '').matchAll(MUSTER)) if (m[1] !== '2') f.push(name + ': "' + m[0].replace(/\s+/g, ' ') + '"');
  return f;
}
let fehler = [], gelesen = 0;
for (const p of dateien(WURZEL)) {
  const rel = relative(WURZEL, p);
  if (RECHT.test(rel)) continue;
  gelesen++;
  fehler.push(...pruefe(rel, readFileSync(p, 'utf8')));
}
console.log('Garantie Elektrik = 2 Jahre, ' + gelesen + ' Dateien gelesen');
for (const f of fehler) console.log('  FEHLER  ' + f);
if (GEGENPROBE) {
  const alt = pruefe('alter Wortlaut', '<strong>10 Jahre auf Aluminium-Produkte</strong> und <strong>5 Jahre auf Markisen, Antriebe & Elektro</strong>');
  console.log(alt.length ? '  Probe erkannt: ' + alt[0] : '  Probe VERPASST');
  console.log('\nErgebnis: ' + (alt.length ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT'));
  process.exit(alt.length ? 0 : 1);
}
console.log('\nErgebnis: ' + (fehler.length ? fehler.length + ' falsche Angabe(n)' : 'keine falsche Angabe gefunden'));
process.exit(fehler.length ? 1 : 0);
