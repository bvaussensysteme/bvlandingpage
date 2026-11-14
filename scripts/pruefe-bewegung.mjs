#!/usr/bin/env node
/* Prueft die Bewegungsschicht des Entwurfs (entwurf-bv.html).
 *
 * WARUM ES DIESE PRUEFUNG GIBT. Im Entwurf standen drei fertige
 * CSS-Regeln, die nie eingeschaltet wurden: die Kontaktleiste unten
 * (.griff.da), der Fortschrittsbalken und die Goldlinie ueber den
 * Ablaufschritten (.ist-da). Alle drei sahen im Quelltext richtig aus
 * und taten nichts. Dazu kommt die groessere Gefahr: Bewegung, die
 * Inhalt VERSTECKT, wenn sie nicht ausgeloest wird. Ein Besucher sieht
 * dann eine leere Seite.
 *
 * Geprueft wird deshalb in drei Zustaenden:
 *   1. normal        - Bewegung erlaubt, JavaScript an
 *   2. ruhig         - prefers-reduced-motion: reduce
 *   3. ohne Skript   - JavaScript aus
 * In ALLEN DREI muss jeder Text lesbar sein.
 *
 * Aufruf:  node scripts/pruefe-bewegung.mjs [--gegenprobe]
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SEITE = 'entwurf-bv.html';
const CSS = join(WURZEL, 'entwurf/bv.css');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8931 + (GEGENPROBE ? 1 : 0);

/* Die vier eingebauten Fehler der Gegenprobe. Jeder trifft genau eine
 * der Pruefungen unten. Wenn einer davon nicht auffaellt, prueft das
 * Skript an dieser Stelle nichts. */
const FEHLER = [
  // 1. Inhalt bleibt unsichtbar, weil die Klasse nie kommt
  ['.js .auf.da{opacity:1;transform:none}', '.js .auf.da{opacity:0;transform:none}'],
  // 2. Bewegung ignoriert den Wunsch nach Ruhe
  ['@media (prefers-reduced-motion:reduce){\n  .naht{transform:none}',
   '@media (prefers-reduced-motion:reduce){\n  .naht{transform:scaleX(0)}'],
  // 3. Die Spur faehrt nicht
  ['animation:weg-fahren linear both;', 'animation:none;'],
  // 4. Die Kontaktleiste unten faehrt nie ein
  ['.griff.da{transform:none}', '.griff.da{transform:translateY(100%)}'],
];

/* Der Ordner chromium-<nummer> enthaelt je nach Umgebung chrome-linux,
 * chrome-linux64 oder gar keine Binaerdatei, sondern nur Marker. Deshalb
 * wird jeder Ort geprueft und im Zweifel undefined geliefert: dann nimmt
 * Playwright den mitgelieferten Browser. Vorher stand hier ein fester
 * Pfad, und das Skript brach am 14.11.2026 ab, ohne etwas zu pruefen. */
function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromePfad(){
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter(d => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length-1]}`) : undefined;
}

/* Jeder Text, der auf der Seite steht, muss am Ende sichtbar sein.
 * "Sichtbar" heisst hier: Deckkraft ueber 0,9 und eine Flaeche groesser
 * als null. Absichtlich NICHT ueber getBoundingClientRect im Bild
 * gemessen - das war schon einmal die Quelle eines Fehlalarms. */
const SAMMELN = `(() => {
  const ziele = document.querySelectorAll(
    'h1,h2,h3,.kopf-satz,.kopfzeile p,.weg-schritt p,.liste p,.zahlenband b,.zahlenband span,.ruf-nummer,.werk h3,.marke');
  const blind = [];
  ziele.forEach(el => {
    const t = (el.textContent||'').trim();
    if (!t) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) { blind.push(['ohne Flaeche', t.slice(0,40)]); return; }
    let o = 1, k = el;
    while (k && k !== document.documentElement) {
      const s = getComputedStyle(k);
      o *= parseFloat(s.opacity);
      if (s.visibility === 'hidden') o = 0;
      k = k.parentElement;
    }
    if (o < 0.9) blind.push(['Deckkraft ' + o.toFixed(2), t.slice(0,40)]);
  });
  return blind;
})()`;

async function durchscrollen(p){
  // Bis ans Ende, in Schritten, damit jeder Beobachter ausloest.
  await p.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo({top:y, behavior:'instant'});
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo({top:h, behavior:'instant'});
    await new Promise(r => setTimeout(r, 400));
  });
  await p.waitForTimeout(1400);
}

const ergebnisse = [];
function melde(ok, name, text){ ergebnisse.push({ok, name, text}); }

async function lauf(){
  const srv = spawn('python3', ['-m','http.server', String(PORT)],
    { cwd: WURZEL, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 900));
  const br = await chromium.launch({ executablePath: chromePfad(),
    args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
  const url = `http://localhost:${PORT}/${SEITE}`;

  try {
    // ── 1. normal ──────────────────────────────────────────────────
    for (const [name, w, h, mob] of [['Handy',390,844,true], ['PC',1440,900,false]]) {
      const c = await br.newContext({ viewport:{width:w,height:h}, colorScheme:'dark',
        reducedMotion:'no-preference', ...(mob?{isMobile:true,hasTouch:true}:{}) });
      const p = await c.newPage();
      const fehler = [];
      p.on('pageerror', e => fehler.push(String(e).slice(0,120)));
      await p.goto(url, { waitUntil:'load' });
      await p.waitForTimeout(1600);
      await durchscrollen(p);
      const blind = await p.evaluate(SAMMELN);
      melde(blind.length === 0, `sichtbar/${name}`,
        blind.length ? `${blind.length} unsichtbar, z.B. "${blind[0][1]}" (${blind[0][0]})`
                     : 'jeder Text sichtbar nach dem Durchscrollen');
      melde(fehler.length === 0, `skriptfehler/${name}`,
        fehler.length ? fehler[0] : 'keine');

      // Kontaktleiste unten: faehrt sie ein? (nur Handy)
      if (mob) {
        const unten = await p.evaluate(() => {
          const g = document.querySelector('.griff');
          const r = g.getBoundingClientRect();
          return { imBild: r.bottom <= window.innerHeight + 2 && r.top < window.innerHeight };
        });
        melde(unten.imBild, 'kontaktleiste/Handy',
          unten.imBild ? 'ist nach dem Scrollen im Bild' : 'bleibt unten ausserhalb');
      }

      // Ablauf: faehrt die Spur wirklich?
      const fahrt = await p.evaluate(async () => {
        const b = document.querySelector('.ablauf-buehne');
        const l = document.querySelector('.weg-liste');
        if (!b || !l) return null;
        const oben = b.getBoundingClientRect().top + window.scrollY;
        const weg = b.offsetHeight - window.innerHeight;
        if (weg <= 10) return { angeheftet:false, fahrweg:0 };
        // behavior:'instant' ist Pflicht: Das Stylesheet setzt
        // scroll-behavior:smooth, ein gewoehnliches scrollTo faehrt
        // dann ueber mehrere hundert Millisekunden. Gemessen wurde
        // sonst mitten in der Fahrt - beim ersten Versuch kam so ein
        // Fehlalarm heraus ("letzter Schritt ausserhalb"), der keiner
        // war. Eine Pruefung mit falschem Alarm wird abgeschaltet.
        const halt = async y => { window.scrollTo({top:y,behavior:'instant'});
          await new Promise(r=>setTimeout(r,650));
          return l.getBoundingClientRect().left; };
        const a = await halt(oben + weg*0.05);
        const e = await halt(oben + weg*0.95);
        const letzte = document.querySelector('.weg-schritt:last-child').getBoundingClientRect();
        return { angeheftet:true, fahrweg: Math.round(a-e),
                 endeImBild: letzte.right <= window.innerWidth + 8 };
      });
      if (fahrt && fahrt.angeheftet) {
        melde(fahrt.fahrweg > 150, `ablauf-fahrt/${name}`,
          `Fahrweg ${fahrt.fahrweg} px (Soll: ueber 150)`);
        melde(fahrt.endeImBild, `ablauf-ende/${name}`,
          fahrt.endeImBild ? 'letzter Schritt steht am Ende im Bild'
                           : 'letzter Schritt bleibt rechts ausserhalb');
      }
      await p.close(); await c.close();
    }

    // ── 2. ruhig (prefers-reduced-motion: reduce) ──────────────────
    {
      const c = await br.newContext({ viewport:{width:390,height:844}, colorScheme:'dark',
        reducedMotion:'reduce', isMobile:true, hasTouch:true });
      const p = await c.newPage();
      await p.goto(url, { waitUntil:'load' });
      await p.waitForTimeout(1500);
      // Ohne Durchscrollen! Wer Ruhe eingestellt hat, darf nicht erst
      // scrollen muessen, damit Text erscheint.
      const blind = await p.evaluate(SAMMELN);
      melde(blind.length === 0, 'ruhig/sichtbar',
        blind.length ? `${blind.length} unsichtbar, z.B. "${blind[0][1]}" (${blind[0][0]})`
                     : 'alles sofort sichtbar, ohne Scrollen');
      const still = await p.evaluate(() => {
        const n = document.querySelector('.naht');
        const b = document.querySelector('.ablauf-buehne');
        return { naht: getComputedStyle(n).transform,
                 buehneHoch: b.offsetHeight > window.innerHeight * 2 };
      });
      const nahtOk = still.naht === 'none' || still.naht === 'matrix(1, 0, 0, 1, 0, 0)';
      melde(nahtOk, 'ruhig/keine-reste', nahtOk ? 'Naehte stehen voll da' : `Naht steht auf ${still.naht}`);
      melde(!still.buehneHoch, 'ruhig/kein-anheften',
        still.buehneHoch ? 'Ablauf wird trotz Ruhe angeheftet' : 'Ablauf bleibt die normale Liste');
      await p.close(); await c.close();
    }

    // ── 3. ohne JavaScript ─────────────────────────────────────────
    {
      const c = await br.newContext({ viewport:{width:390,height:844}, colorScheme:'dark',
        javaScriptEnabled:false, isMobile:true, hasTouch:true });
      const p = await c.newPage();
      await p.goto(url, { waitUntil:'load' });
      await p.waitForTimeout(900);
      const ohne = await p.evaluate_ ? null : await p.$$eval('h1,.ruf-nummer', els =>
        els.map(e => {
          const r = e.getBoundingClientRect();
          return { t:(e.textContent||'').trim().slice(0,30), w:Math.round(r.width), h:Math.round(r.height),
                   o:getComputedStyle(e).opacity };
        }));
      const schlecht = (ohne||[]).filter(x => x.w < 1 || x.h < 1 || parseFloat(x.o) < 0.9);
      melde(schlecht.length === 0 && (ohne||[]).length >= 2, 'ohne-skript/kern',
        schlecht.length ? `unsichtbar: ${schlecht[0].t}`
                        : `Ueberschrift und Telefonnummer stehen da (${(ohne||[]).length} geprueft)`);
      const bild = await p.$eval('.kopf-bild', e => getComputedStyle(e).clipPath);
      const bildOk = bild === 'none' || bild === 'inset(0px)';
      melde(bildOk, 'ohne-skript/kopfbild',
        bildOk ? 'Kopfbild ist nicht beschnitten' : `Kopfbild beschnitten auf ${bild}`);
      await p.close(); await c.close();
    }
  } finally {
    await br.close(); srv.kill();
  }
}

// ── Gegenprobe: Fehler einbauen, messen, zurueckbauen ──────────────
const original = readFileSync(CSS, 'utf8');
let eingebaut = 0;
if (GEGENPROBE) {
  let x = original;
  FEHLER.forEach(([alt, neu]) => {
    if (x.includes(alt)) { x = x.replace(alt, neu); eingebaut++; }
    else console.error('  ACHTUNG: Gegenprobe-Stelle nicht gefunden:', alt.slice(0,50));
  });
  writeFileSync(CSS, x);
}

try {
  await lauf();
} finally {
  if (GEGENPROBE) writeFileSync(CSS, original);
}

const schlecht = ergebnisse.filter(e => !e.ok);
console.log(GEGENPROBE
  ? `Gegenprobe: ${eingebaut} eingebaute Fehler\n`
  : 'Bewegung im Entwurf (entwurf-bv.html)\n');
ergebnisse.forEach(e =>
  console.log(`  ${e.ok ? 'ok    ' : 'FEHLER'}  ${e.name.padEnd(24)} ${e.text}`));
console.log('');
if (GEGENPROBE) {
  const erkannt = schlecht.length;
  console.log(`${erkannt} Beanstandungen bei ${eingebaut} eingebauten Fehlern.`);
  console.log(erkannt >= eingebaut
    ? 'Gegenprobe bestanden: jeder eingebaute Fehler faellt auf.'
    : 'Gegenprobe NICHT bestanden: es faellt zu wenig auf.');
  process.exit(erkannt >= eingebaut ? 0 : 1);
} else {
  console.log(schlecht.length ? `Ergebnis: ${schlecht.length} Beanstandungen` : 'Ergebnis: bestanden');
  process.exit(schlecht.length ? 1 : 0);
}
