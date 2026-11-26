#!/usr/bin/env node
/* Passt die Seitenuebersicht /sitemap.html zur sitemap.xml, und ist sie
 * von jeder Seite aus erreichbar?
 *
 * WARUM (26.11.2026, Wunsch des Betreibers): eine aufrufbare,
 * strukturierte Sitemap mit Verweis in der Fusszeile. Eine solche Seite
 * veraltet still: Kommt eine Seite dazu und steht nur in sitemap.xml,
 * fehlt sie in der Uebersicht, ohne dass es jemand sieht.
 *
 * WIE, statisch:
 *   1. Jede <loc> aus sitemap.xml ist in sitemap.html verlinkt.
 *   2. Jeder interne Verweis in sitemap.html zeigt auf eine vorhandene Datei.
 *   3. sitemap.html steht selbst in sitemap.xml.
 *   4. Jede ausgelieferte Seite mit Fusszeile verlinkt /sitemap.html.
 *
 * GEGENPROBE: --gegenprobe nimmt im Speicher den Carport aus der
 * Uebersicht und prueft index.html im Stand vor der Sitemap (Commit
 * a2c6ea4). Beides MUSS auffallen.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
const W = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const HOST = 'https://bv-aussensysteme.de';
const datei = (pfad) => { let p = pfad.split('#')[0].split('?')[0].replace(/^\//, ''); if (p === '' || p.endsWith('/')) p += 'index.html'; return p; };

const xml = readFileSync(join(W, 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(HOST, '') || '/');
let uebersicht = readFileSync(join(W, 'sitemap.html'), 'utf8');
if (GEGENPROBE) uebersicht = uebersicht.replace('<li><a href="/produkte/carport.html">Carport</a></li>', '');
const main = uebersicht.slice(uebersicht.indexOf('<main'), uebersicht.indexOf('</main>'));
const verweise = new Set([...main.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1].split('#')[0] || '/'));

const fehler = [];
for (const l of locs) if (l !== '/sitemap.html' && !verweise.has(l)) fehler.push('fehlt in der Uebersicht: ' + l);
for (const v of verweise) if (!existsSync(join(W, datei(v)))) fehler.push('Verweis ins Leere: ' + v);
if (!locs.includes('/sitemap.html')) fehler.push('sitemap.html steht nicht in sitemap.xml');

const AUS = new Set(['node_modules', '.git', 'src', 'scripts', 'docs', 'worker', '.claude', 'werkstatt', 'assets']);
const seiten = (d) => readdirSync(d).flatMap((e) => AUS.has(e) ? [] : statSync(join(d, e)).isDirectory() ? seiten(join(d, e)) : e.endsWith('.html') ? [join(d, e)] : []);
let mitFuss = 0;
for (const p of seiten(W)) {
  const rel = relative(W, p);
  let t = readFileSync(p, 'utf8');
  if (GEGENPROBE && rel === 'index.html') t = execFileSync('git', ['show', 'a2c6ea4:index.html'], { cwd: W, encoding: 'utf8' });
  if (!/<footer\b/.test(t)) continue;
  mitFuss++;
  const fuss = t.slice(t.indexOf('<footer'));
  if (!/href="\/?sitemap\.html"/.test(fuss)) fehler.push('Fusszeile ohne Sitemap: ' + rel);
}

console.log((GEGENPROBE ? 'Gegenprobe: ' : '') + locs.length + ' Adressen in sitemap.xml, ' + verweise.size + ' Verweise in der Uebersicht, ' + mitFuss + ' Seiten mit Fusszeile');
for (const f of fehler) console.log('  FEHLER  ' + f);
if (GEGENPROBE) {
  const ok = fehler.some((f) => f.includes('/produkte/carport.html')) && fehler.some((f) => f.includes('Fusszeile ohne Sitemap: index.html'));
  console.log('Ergebnis: ' + (ok ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT'));
  process.exit(ok ? 0 : 1);
}
console.log('Ergebnis: ' + (fehler.length ? fehler.length + ' Fehler' : 'Uebersicht vollstaendig, alle Verweise gueltig, ueberall in der Fusszeile'));
process.exit(fehler.length ? 1 : 0);
