#!/usr/bin/env node
/* Fuehrt jede Sprungmarke (#…) zu einer Stelle, die es gibt?
 *
 * WARUM (25.11.2026, Paket A10)
 * Die 14 Ortsseiten verwiesen im Menue auf "/#produkte", die Startseite
 * kennt aber nur id="leistungen" (behoben in A1). Ein Verweis ins Leere
 * sieht im Quelltext genauso aus wie ein richtiger; der Besucher landet
 * oben auf der Seite statt beim Abschnitt. Keine Pruefung hat es gesehen.
 *
 * WIE: statisch. In jeder ausgelieferten HTML-Datei (ohne das, was
 * .assetsignore zurueckhaelt) jedes href mit "#" aus dem Markup lesen,
 * ohne Kommentare und ohne <script>-Bloecke. Die Zielseite bestimmen
 * ("#x" = dieselbe Seite, "/" = index.html, "/a" und "/a.html" =
 * a.html, Ordner = index.html darin; Verweise auf bv-aussensysteme.de
 * zaehlen als eigene Seite, fremde Seiten werden uebersprungen) und
 * pruefen, ob dort id="x" oder name="x" steht.
 *
 * GRENZE: Ziele, die erst ein Skript erzeugt, und Verweise, die ein
 * Skript zusammenbaut (so war es bei A3, '/#kontakt?produkt=…'), sieht
 * diese Pruefung nicht. Dafuer gibt es pruefe-baugenehmigung-weiter.mjs.
 *
 * GEGENPROBE: --gegenprobe prueft zusaetzlich carport-koblenz.html im
 * Stand vor A1 (Commit 56e5937) aus git. Dort MUSS "/#produkte"
 * auffallen.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, dirname, posix } from 'node:path';

const W = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');
const AUS = new Set(['node_modules', '.git', 'src', 'scripts', 'docs', 'worker', '.claude']);

const ignoriert = readFileSync(join(W, '.assetsignore'), 'utf8').split('\n')
  .map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
function wirdAusgeliefert(rel) {
  for (const m of ignoriert) {
    const kern = m.replace(/^\//, '').replace(/\/\*?$/, '');
    if (!kern) continue;
    if (kern.includes('*')) {
      const re = new RegExp('^' + kern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      if (re.test(rel) || re.test(rel.split('/').pop())) return false;
    } else if (rel === kern || rel.startsWith(kern + '/') || rel.split('/').pop() === kern) return false;
  }
  return true;
}
function seiten(d) {
  const a = [];
  for (const e of readdirSync(d)) {
    if (AUS.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) a.push(...seiten(p));
    else if (e.endsWith('.html')) a.push(p);
  }
  return a;
}
const markup = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');
const idCache = new Map();
function ids(rel, inhalt) {
  if (!inhalt && idCache.has(rel)) return idCache.get(rel);
  const html = inhalt ?? (existsSync(join(W, rel)) ? readFileSync(join(W, rel), 'utf8') : null);
  const s = html === null ? null : new Set([...markup(html).matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1]));
  if (!inhalt) idCache.set(rel, s);
  return s;
}
function zielDatei(vonRel, pfad) {
  if (pfad === '') return vonRel;
  let p = pfad.startsWith('/') ? pfad.slice(1) : posix.join(dirname(vonRel), pfad);
  p = posix.normalize(p).replace(/^\.\//, '');
  if (p === '' || p === '.' || p.endsWith('/')) return (p === '.' ? '' : p) + 'index.html';
  if (!/\.[a-z0-9]+$/i.test(p)) return p + '.html';
  return p;
}
function pruefeSeite(rel, html, funde) {
  for (const m of markup(html).matchAll(/\shref="([^"]*#[^"]*)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let ohneHost = href;
    const h = href.match(/^https?:\/\/([^/]+)(\/[^#]*)?(#.*)$/i);
    if (h) {
      if (!/(^|\.)bv-aussensysteme\.de$/i.test(h[1])) continue;
      ohneHost = (h[2] || '/') + h[3];
    }
    const [pfadMitQuery, marke] = ohneHost.split('#');
    const pfad = pfadMitQuery.split('?')[0];
    if (!marke || marke === 'top' || marke.startsWith('!')) continue;
    const ziel = zielDatei(rel, pfad);
    geprueft++;
    const vorhanden = ziel === rel ? ids(rel, html) : ids(ziel);
    if (vorhanden === null) { funde.push(rel + ': ' + href + '  (Zielseite ' + ziel + ' fehlt)'); continue; }
    if (!vorhanden.has(decodeURIComponent(marke))) funde.push(rel + ': ' + href + '  (keine id="' + marke + '" in ' + ziel + ')');
  }
}

const funde = [];
let gelesen = 0;
var geprueft = 0;
for (const p of seiten(W)) {
  const rel = relative(W, p);
  if (!wirdAusgeliefert(rel)) continue;
  gelesen++;
  pruefeSeite(rel, readFileSync(p, 'utf8'), funde);
}
console.log(geprueft + ' Sprungmarken in ' + gelesen + ' ausgelieferten Seiten');
if (geprueft < 100) { console.log('  FEHLER  verdaechtig wenige Sprungmarken gefunden'); process.exit(1); }
for (const f of funde) console.log('  FEHLER  ' + f);

if (GEGENPROBE) {
  const alt = execFileSync('git', ['show', '56e5937:carport-koblenz.html'], { cwd: W, encoding: 'utf8' });
  const probe = [];
  pruefeSeite('carport-koblenz.html', alt, probe);
  const ok = probe.some((f) => f.includes('/#produkte'));
  console.log('\nGegenprobe (carport-koblenz.html aus 56e5937): ' + (ok ? 'erkannt: ' + probe.find((f) => f.includes('/#produkte')) : 'VERPASST'));
  console.log('Ergebnis: ' + (ok ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT'));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (funde.length ? funde.length + ' Sprungmarke(n) ins Leere' : 'alle Sprungmarken haben ein Ziel'));
process.exit(funde.length ? 1 : 0);
