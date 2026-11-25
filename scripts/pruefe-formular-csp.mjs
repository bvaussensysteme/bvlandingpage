#!/usr/bin/env node
/* Darf jedes Formular der Seite unter der ausgelieferten
 * Sicherheitsrichtlinie ueberhaupt absenden?
 *
 * WARUM ES DIESE PRUEFUNG GIBT (25.11.2026)
 * Das Online-Widerrufsformular (src/widerruf.njk) sendet klassisch an
 * https://api.web3forms.com/submit. Die Richtlinie in _headers erlaubte
 * aber nur form-action 'self'. Der Browser blockierte das Absenden,
 * und der Nutzer sah nichts: keine Bestaetigung, keine Fehlermeldung.
 * Live seit mindestens dem 01.11.2026. Keine der 83 Pruefungen hat es
 * gesehen, weil alle gegen `python3 -m http.server` laufen, also ohne
 * _headers. Gefunden hat es erst ein Mensch, der _headers und das
 * Formular nebeneinander gelesen hat.
 *
 * WIE
 * Statisch und ohne Netz, damit es in jedem Lauf der Suite mitlaeuft:
 *   1. form-action aus der Content-Security-Policy in _headers lesen.
 *   2. Jedes <form> in jeder ausgelieferten HTML-Datei suchen.
 *   3. Fuer jedes Formular das Ziel bestimmen (action, sonst die Seite
 *      selbst) und gegen die erlaubten Quellen halten.
 * Ausgelassen werden Dateien, die .assetsignore nicht hochlaedt, und
 * Formulare, die per Skript senden (onsubmit, data-per-skript); die
 * laufen ueber connect-src, nicht ueber form-action.
 *
 * Diese Pruefung ersetzt nicht den Blick auf die Vorschau: Ob Cloudflare
 * die Kopfzeile so ausliefert, wie sie in _headers steht, sieht nur ein
 * Abruf. Am 25.11.2026 war beides wortgleich.
 *
 * GEGENPROBE: --gegenprobe nimmt https://api.web3forms.com aus den
 * erlaubten Quellen. Dann MUSS das Widerrufsformular auffallen. Es wird
 * keine Datei geaendert.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');

/* ---- 1. Richtlinie lesen ---- */
const headers = readFileSync(join(WURZEL, '_headers'), 'utf8');
const csp = headers.split('\n').find((z) => /^\s*Content-Security-Policy:/i.test(z));
if (!csp) { console.log('  FEHLER  Keine Content-Security-Policy in _headers gefunden'); process.exit(1); }
const fa = (csp.match(/form-action\s+([^;]+)/i) || [])[1];
if (!fa) { console.log('  FEHLER  Die Richtlinie hat kein form-action'); process.exit(1); }
let erlaubt = fa.trim().split(/\s+/);
if (GEGENPROBE) erlaubt = erlaubt.filter((q) => !/web3forms/.test(q));

const SEITE = 'https://bv-aussensysteme.de';
function zulaessig(ziel) {
  const u = new URL(ziel, SEITE + '/');
  for (const q of erlaubt) {
    if (q === "'self'" && u.origin === SEITE) return true;
    if (q === "'none'") return false;
    if (/^https?:\/\//.test(q)) {
      const muster = new URL(q.replace('*.', 'stern.'));
      const gleicherHost = q.includes('*.')
        ? u.hostname.endsWith(muster.hostname.replace(/^stern/, ''))
        : u.hostname === muster.hostname;
      if (u.protocol === muster.protocol && gleicherHost) return true;
    }
  }
  return false;
}

/* ---- 2. Ausgelieferte HTML-Dateien ---- */
const ignoriert = readFileSync(join(WURZEL, '.assetsignore'), 'utf8')
  .split('\n').map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
function wirdAusgeliefert(rel) {
  for (const m of ignoriert) {
    const kern = m.replace(/^\//, '').replace(/\/\*?$/, '');
    if (!kern) continue;
    if (kern.includes('*')) {
      const re = new RegExp('^' + kern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      if (re.test(rel) || re.test(rel.split('/').pop())) return false;
    } else if (rel === kern || rel.startsWith(kern + '/') || rel.split('/').pop() === kern) {
      return false;
    }
  }
  return true;
}
function seiten(dir) {
  const aus = [];
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', 'src', 'scripts', 'docs', 'worker', '.claude'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) aus.push(...seiten(p));
    else if (e.endsWith('.html')) aus.push(p);
  }
  return aus;
}

/* ---- 3. Formulare pruefen ---- */
let geprueft = 0, fehler = 0, perSkript = 0;
const funde = [];
for (const datei of seiten(WURZEL)) {
  const rel = relative(WURZEL, datei);
  if (!wirdAusgeliefert(rel)) continue;
  const html = readFileSync(datei, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of html.matchAll(/<form\b[^>]*>/gi)) {
    const tag = m[0];
    if (/\bonsubmit=|data-per-skript/i.test(tag)) { perSkript++; continue; }
    const action = (tag.match(/\baction="([^"]*)"/i) || [])[1] || '/' + rel;
    geprueft++;
    const ok = zulaessig(action);
    if (!ok) fehler++;
    funde.push({ rel, action, ok });
  }
}

console.log(GEGENPROBE
  ? 'Gegenprobe: web3forms aus form-action entfernt, das Widerrufsformular muss auffallen'
  : 'Formulare gegen die Sicherheitsrichtlinie (form-action)');
console.log('  erlaubt: ' + erlaubt.join(' '));
for (const f of funde)
  console.log('  ' + (f.ok ? 'ok    ' : 'FEHLER') + '  ' + f.rel.padEnd(28) + ' -> ' + f.action +
    (f.ok ? '' : '   (der Browser blockiert das Absenden)'));
console.log('  ' + perSkript + ' Formular(e) senden per Skript und laufen ueber connect-src');

if (GEGENPROBE) {
  const widerruf = funde.find((f) => /widerruf/.test(f.rel));
  const faellt = widerruf && !widerruf.ok;
  console.log('\nErgebnis: ' + (faellt ? 'die Gegenprobe faellt auf' : 'GEGENPROBE VERSAGT, das Widerrufsformular faellt nicht auf'));
  process.exit(faellt ? 0 : 1);
}
if (geprueft === 0) { console.log('\nErgebnis: kein klassisches Formular gefunden, das ist verdaechtig'); process.exit(1); }
console.log('\nErgebnis: ' + (fehler === 0
  ? 'alle ' + geprueft + ' Formulare duerfen absenden'
  : fehler + ' von ' + geprueft + ' Formularen werden vom Browser blockiert'));
process.exit(fehler === 0 ? 0 : 1);
