#!/usr/bin/env node
/* Laesst sich der Anfrage-Assistent nur mit der Tastatur bedienen, und
 * erfaehrt Vorlesesoftware, was gewaehlt ist?
 *
 * WARUM (25.11.2026, Paket A4)
 * Gemessen vom Barrierefreiheits-Pruefer: Nach einer Auswahl per
 * Tastatur fiel der Fokus auf BODY, weil jeder Schritt mit innerHTML
 * neu gezeichnet wird. Gewaehlt und aufgeklappt stand nur als
 * CSS-Klasse da. Die Lupe an den Erweiterungsfotos war ein nacktes
 * <span> in einem Knopf, die Grossansicht per Tastatur nicht zu
 * oeffnen. Platzhalter 3,70:1. Im Kontaktschritt blieb der Fokus nach
 * einem Fehler auf "Weiter", das bemaengelte Feld lag weit darueber.
 *
 * WIE
 * Startseite, Weg "Terrassendach TDS". Jedes Bedienelement wird per
 * focus() angesteuert und mit Enter, Leertaste oder Pfeiltaste bedient,
 * nie per Mausklick. Nach jeder Aktion: steht der Fokus auf BODY?
 * Dazu je Schritt die ARIA-Zustaende, die Lupe samt Grossansicht, die
 * Platzhalterfarbe und der Fehlerfall im Kontaktschritt. Vor dem
 * Absenden ist Schluss; Anfragen an /api/kontakt, Web3Forms und
 * Formspree werden abgefangen, es geht nichts hinaus.
 *
 * GEGENPROBE: --gegenprobe liefert js/anfrage-wizard.js und
 * css/style.css im Stand vor A4 (Commit 777eaef) aus git. Dann MUSS die
 * Pruefung auffallen, und zwar in mindestens vier der fuenf Bereiche
 * (Fokus, ARIA, Lupe, Platzhalter, Fehlerfall).
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const W = new URL('..', import.meta.url).pathname;
const require = createRequire(join(W, 'package.json'));
const { chromium } = require('playwright');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const ALT = '777eaef';
const PORT = 8600 + Math.floor(Math.random() * 90);

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.route(/web3forms|formspree|\/api\/kontakt/i, (r) => r.abort());
if (GEGENPROBE) {
  for (const [muster, datei, typ] of [['**/js/anfrage-wizard.js*', 'js/anfrage-wizard.js', 'application/javascript'],
                                     ['**/css/style.css*', 'css/style.css', 'text/css']]) {
    const alt = execFileSync('git', ['show', ALT + ':' + datei], { cwd: W, encoding: 'utf8', maxBuffer: 64 << 20 });
    await ctx.route(muster, (r) => r.fulfill({ contentType: typ + '; charset=utf-8', body: alt }));
  }
}
const pg = await ctx.newPage();
const jsFehler = [];
pg.on('pageerror', (e) => jsFehler.push(e.message));

const bereiche = { Fokus: [], ARIA: [], Lupe: [], Platzhalter: [], Fehlerfall: [] };
const melde = (b, t) => { if (!bereiche[b].includes(t)) bereiche[b].push(t); };
let aktionen = 0;

async function fokus(was) {
  await pg.waitForTimeout(120);
  aktionen++;
  const f = await pg.evaluate(() => { const a = document.activeElement; return !a || a === document.body; });
  if (f) melde('Fokus', was + ': Fokus auf BODY');
}
async function bediene(sel, taste, was) {
  const el = pg.locator('#awBody ' + sel).first();
  await el.focus();
  await pg.keyboard.press(taste);
  await fokus(was);
}
const titel = () => pg.evaluate(() => document.getElementById('awTitle')?.textContent.trim() || '');

await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
await pg.waitForTimeout(1200);
await pg.evaluate(() => { document.querySelector('#cookieBanner')?.remove(); document.getElementById('kontakt')?.scrollIntoView(); });

try {
  /* Produkt */
  await bediene('.aw-option[data-value="Terrassendach TDS"]', 'Enter', 'Produkt');
  const pr = await pg.evaluate(() => [...document.querySelectorAll('#awBody .aw-option[data-field="produkt"]')]
    .map((b) => [b.getAttribute('data-value'), b.getAttribute('aria-pressed')]));
  const tds = pr.find((p) => p[0] === 'Terrassendach TDS');
  if (!tds || tds[1] !== 'true' || pr.some((p) => p[0] !== 'Terrassendach TDS' && p[1] !== 'false'))
    melde('ARIA', 'Produktkarten ohne passendes aria-pressed');

  let lupeGeprueft = false;
  for (let schritt = 0; schritt < 25; schritt++) {
    const t = await titel();
    if (/Kontakt|erreichen|Ihre Daten/i.test(t) || await pg.$('#awBody #k_nachname')) break;

    /* Einfachauswahl: jede Gruppe ohne Wahl bekommt die erste Karte */
    for (let runde = 0; runde < 6; runde++) {
      const feld = await pg.evaluate(() => {
        const gruppen = {};
        document.querySelectorAll('#awBody .aw-option[data-field]').forEach((b) => {
          const f = b.getAttribute('data-field'); gruppen[f] = gruppen[f] || b.classList.contains('is-active');
        });
        return Object.keys(gruppen).find((f) => !gruppen[f]) || null;
      });
      if (!feld) break;
      await bediene(`.aw-option[data-field="${feld}"]`, 'Enter', t + ' / ' + feld);
      const a = await pg.evaluate((f) => document.querySelector(`#awBody .aw-option[data-field="${f}"]`)?.getAttribute('aria-pressed'), feld);
      if (a !== 'true') melde('ARIA', t + ': gewaehlte Karte ohne aria-pressed="true"');
    }
    /* Pills ohne Wahl */
    for (let runde = 0; runde < 4; runde++) {
      const p = await pg.evaluate(() => {
        const g = {};
        document.querySelectorAll('#awBody .aw-pill[data-pill]').forEach((b) => {
          const f = b.getAttribute('data-pill'); g[f] = g[f] || b.classList.contains('is-active');
        });
        return Object.keys(g).find((f) => !g[f]) || null;
      });
      if (!p) break;
      await bediene(`.aw-pill[data-pill="${p}"]`, 'Space', t + ' / ' + p);
      const a = await pg.evaluate((f) => document.querySelector(`#awBody .aw-pill[data-pill="${f}"]`)?.getAttribute('aria-pressed'), p);
      if (a !== 'true') melde('ARIA', t + ': gewaehlte Pill ohne aria-pressed="true"');
    }
    /* Masse: leere Zahlenfelder per Tastatur fuellen, dann Tab */
    const felder = await pg.evaluate(() => [...document.querySelectorAll('#awBody .aw-dims input, #awBody input[inputmode="numeric"]')]
      .filter((i) => !i.value && i.offsetParent).map((i) => i.id).filter(Boolean));
    for (const id of felder) {
      await pg.locator('#' + id).focus();
      await pg.keyboard.type('400');
      await pg.keyboard.press('Tab');
      await fokus(t + ' / ' + id + ' verlassen');
    }
    if (await pg.$('#awBody #awHoeheBezug')) {
      await bediene('#awHoeheBezug', 'ArrowDown', t + ' / Hoehenbezug');
    }
    /* Aufklappfelder der Erweiterungen */
    const dds = await pg.evaluate(() => [...document.querySelectorAll('#awBody .aw-dd-toggle')].map((b) => b.getAttribute('data-dd-toggle')));
    for (const id of dds) {
      await bediene(`.aw-dd-toggle[data-dd-toggle="${id}"]`, 'Enter', t + ' / ' + id + ' aufklappen');
      const ex = await pg.evaluate((i) => document.querySelector(`#awBody .aw-dd-toggle[data-dd-toggle="${i}"]`)?.getAttribute('aria-expanded'), id);
      if (ex !== 'true') melde('ARIA', t + ': Aufklappfeld ohne aria-expanded="true"');
      const opt = await pg.evaluate((i) => {
        const o = [...document.querySelectorAll(`#awBody .aw-dd-opt[data-dd-pick="${i}"]`)].filter((b) => b.getAttribute('data-value') !== 'Keine Angabe');
        return o.length ? o[0].getAttribute('data-value') : null;
      }, id);
      if (opt) {
        await bediene(`.aw-dd-opt[data-dd-pick="${id}"][data-value="${opt}"]`, 'Enter', t + ' / ' + id + ' waehlen');
        const a = await pg.evaluate(([i, v]) => document.querySelector(`#awBody .aw-dd-opt[data-dd-pick="${i}"][data-value="${v}"]`)?.getAttribute('aria-pressed'), [id, opt]);
        if (a !== 'true') melde('ARIA', t + ': gewaehlte Erweiterung ohne aria-pressed="true"');
      }
      /* Lupe einmal pruefen */
      if (!lupeGeprueft) {
        const zb = await pg.$('#awBody .aw-dd-zoombtn');
        const alteLupe = await pg.$('#awBody .aw-dd-thumb[data-zoom]');
        if (!zb) {
          if (alteLupe) melde('Lupe', 'Lupe ist kein fokussierbarer Knopf');
        } else {
          lupeGeprueft = true;
          await zb.focus();
          await pg.keyboard.press('Enter');
          await pg.waitForTimeout(250);
          const d = await pg.evaluate(() => {
            const lb = document.querySelector('.aw-lightbox');
            return lb ? { dialog: lb.getAttribute('role') === 'dialog', drin: lb.contains(document.activeElement) } : null;
          });
          if (!d) melde('Lupe', 'Enter auf der Lupe oeffnet keine Grossansicht');
          else {
            if (!d.dialog) melde('Lupe', 'Grossansicht ohne role="dialog"');
            if (!d.drin) melde('Lupe', 'Fokus nicht in der Grossansicht');
            await pg.keyboard.press('Escape');
            await pg.waitForTimeout(200);
            const zurueck = await pg.evaluate(() => document.activeElement?.classList.contains('aw-dd-zoombtn'));
            if (!zurueck) melde('Lupe', 'Nach Escape kehrt der Fokus nicht zur Lupe zurueck');
          }
        }
      }
      /* wieder zuklappen */
      await bediene(`.aw-dd-toggle[data-dd-toggle="${id}"]`, 'Enter', t + ' / ' + id + ' zuklappen');
    }
    /* Weiter */
    await pg.locator('#awNext').focus();
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(250);
    if (await pg.$('#awError')) {
      console.log('  Hinweis: Schritt "' + t + '" laesst sich mit dieser Fuellung nicht abschliessen: ' +
        await pg.evaluate(() => document.getElementById('awError').textContent.trim()));
      break;
    }
    if ((await titel()) === t) { console.log('  Hinweis: Schritt "' + t + '" bewegt sich nicht'); break; }
  }
  if (!lupeGeprueft && !bereiche.Lupe.length) melde('Lupe', 'auf dem Weg keine Lupe angetroffen');

  /* Kontaktschritt */
  if (!(await pg.$('#awBody #k_nachname'))) {
    melde('Fehlerfall', 'Kontaktschritt nicht erreicht (' + await titel() + ')');
  } else {
    const pflicht = await pg.evaluate(() => ['k_nachname', 'k_email', 'k_telefon', 'k_plz', 'k_ort', 'k_consent']
      .filter((id) => { const e = document.getElementById(id); return !e || !(e.required || e.getAttribute('aria-required') === 'true'); }));
    if (pflicht.length) melde('Fehlerfall', 'ohne required/aria-required: ' + pflicht.join(', '));
    /* Platzhalter gegen den tatsaechlichen Grund des Feldes */
    const k = await pg.evaluate(() => {
      const rgba = (c) => { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
      const grund = (el) => {
        const lagen = [];
        for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) lagen.push(c); if (c[3] >= 1) break; }
        let r = [255, 255, 255];
        for (const l of lagen.reverse()) r = r.map((v, i) => v * (1 - l[3]) + l[i] * l[3]);
        return r;
      };
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const i = document.getElementById('k_email');
      const g = grund(i), p = rgba(getComputedStyle(i, '::placeholder').color);
      const farbe = g.map((v, n) => v * (1 - p[3]) + p[n] * p[3]);
      const a = lum(farbe), b = lum(g);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    console.log('  Platzhalter im Kontaktschritt: ' + k.toFixed(2) + ':1');
    if (k < 4.5) melde('Platzhalter', 'Platzhalter ' + k.toFixed(2) + ':1');
    /* Fehlerfall: leer absenden */
    await pg.locator('#awNext').focus();
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const e = await pg.evaluate(() => {
      const a = document.activeElement;
      return { fehler: !!document.getElementById('awError'), aufWeiter: a && a.id === 'awNext',
               aufFeld: !!(a && a.closest && a.closest('#awBody')),
               invalid: !!document.querySelector('#awBody [aria-invalid="true"]') };
    });
    if (!e.fehler) melde('Fehlerfall', 'leerer Kontaktschritt meldet keinen Fehler');
    if (e.aufWeiter || !e.aufFeld) melde('Fehlerfall', 'Fokus bleibt nach dem Fehler nicht beim bemaengelten Feld');
    if (!e.invalid) melde('Fehlerfall', 'kein aria-invalid am bemaengelten Feld');
    /* Nachname leer, Rest gefuellt: Fokus muss auf den Nachnamen */
    await pg.evaluate(() => document.querySelector('#awBody .aw-pill[data-pill="k_anrede"]')?.focus());
    await pg.keyboard.press('Space');
    await pg.locator('#k_email').fill('test@beispiel.invalid');
    await pg.locator('#awNext').focus();
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const n = await pg.evaluate(() => ({ id: document.activeElement?.id, inv: document.getElementById('k_nachname')?.getAttribute('aria-invalid') }));
    if (n.id !== 'k_nachname' || n.inv !== 'true') melde('Fehlerfall', 'fehlender Nachname: Fokus auf "' + n.id + '", aria-invalid=' + n.inv);
  }
} catch (err) {
  melde('Fokus', 'Ablauf abgebrochen: ' + err.message.split('\n')[0]);
}
if (jsFehler.length) melde('Fokus', 'JavaScript-Fehler: ' + jsFehler[0]);
await br.close();
srv.kill();

console.log((GEGENPROBE ? 'Gegenprobe (Stand ' + ALT + ')' : 'Anfrage-Assistent mit der Tastatur') + ', ' + aktionen + ' Tastaturaktionen');
let rot = 0;
for (const [b, f] of Object.entries(bereiche)) {
  if (f.length) rot++;
  console.log('  ' + (f.length ? 'FEHLER' : 'ok    ') + '  ' + b + (f.length ? '\n            ' + f.join('\n            ') : ''));
}
if (GEGENPROBE) {
  const ok = rot >= 4;
  console.log('\nErgebnis: ' + (ok ? 'die Gegenprobe faellt in ' + rot + ' von 5 Bereichen auf' : 'GEGENPROBE VERSAGT, nur ' + rot + ' von 5 Bereichen'));
  process.exit(ok ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot ? rot + ' von 5 Bereichen mit Fehlern' : 'alle 5 Bereiche in Ordnung'));
process.exit(rot ? 1 : 0);
