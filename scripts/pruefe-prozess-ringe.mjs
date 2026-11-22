#!/usr/bin/env node
/* ============================================================
   DIE RINGE IM ABLAUF: FUELLEN SIE SICH, UND RUHEN SIE AUCH?

   ANLASS (22.11.2026). Meldung des Betreibers vom iPhone, mit Bild:
   „die animation der kreise is auch nicht wie auf pc das sich der
   kreis im kreis fuellt und dann der naechste, sondern es blinken die
   kreise nacheinander komplett auf". Auf dem Geraet war „Bewegung
   reduzieren" eingeschaltet.

   Gemessen war das Verhalten damals so:
     - normal:  14 bis 15 Messpunkte mitten im Fuellen je Ring
     - ruhig:    0 Messpunkte dazwischen, dafuer drei vollstaendige
                 Durchlaeufe in 13 Sekunden, also ein Blinken ohne Ende

   ZWEI FRAGEN, ZWEI RICHTUNGEN:
     1. Ohne die Einstellung MUSS sich der Ring allmaehlich fuellen.
        Sonst waere die Animation kaputt.
     2. MIT der Einstellung darf sich NICHTS bewegen, und zwar
        dauerhaft nicht. Nicht schneller, sondern gar nicht. Sonst
        macht die Seite aus „weniger Bewegung" ein Blinken, und das
        beruehrt WCAG 2.2.2.

   WIE GEMESSEN WIRD. Im Browser wird alle 120 ms der
   strokeDashoffset aller vier Ringe abgelesen, 13 Sekunden lang
   (0 = voll, 188,5 = leer). Gezaehlt werden die Werte dazwischen.
   Nicht die CSS-Regel wird geprueft, sondern was wirklich passiert.

   Aufruf:     node scripts/pruefe-prozess-ringe.mjs
   Gegenprobe: node scripts/pruefe-prozess-ringe.mjs --gegenprobe
   Die Gegenprobe stellt den alten Zustand wieder her: Sie laesst die
   Ringe auch bei „ruhig" durchlaufen. Dann MUSS es auffallen.
   ============================================================ */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8925;
const DAUER_MS = 13000;

function chromeIn(o) {
  for (const w of [o + '/chrome-linux/chrome', o + '/chrome-linux64/chrome', o + '/chrome'])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(b + '/' + o[o.length - 1]) : undefined;
}

const WURZEL = new URL('..', import.meta.url).pathname;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log('  ok      ' + name.padEnd(46) + ' ' + (beleg || ''));
  else { fehler++; console.log('  FEHLER  ' + name.padEnd(46) + ' ' + (beleg || '')); }
}

const MITSCHRIFT = () => {
  window.__verlauf = [];
  setInterval(() => {
    const r = document.querySelectorAll('.prozess-ring-fg');
    if (!r.length) return;
    window.__verlauf.push([...r].map((e) =>
      Math.round(parseFloat(getComputedStyle(e).strokeDashoffset) || 0)));
  }, 120);
};

console.log(GEGENPROBE ? 'Gegenprobe: Ringe laufen auch bei "Bewegung reduzieren"'
                       : 'Ablauf-Ringe: fuellen und ruhen');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });

async function messen(breite, hoehe, handy, bewegung) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe },
    hasTouch: handy, isMobile: handy, reducedMotion: bewegung });
  const seite = await ctx.newPage();
  await seite.addInitScript(() => { try { localStorage.setItem('bv_cookie_consent', 'all'); } catch (e) {} });
  if (GEGENPROBE && bewegung === 'reduce') {
    /* Alten Zustand nachbauen: kurze Zeiten statt gar keiner Bewegung.
       Dafuer wird die Abfrage der Einstellung ueberschrieben, bevor
       das Skript laeuft. */
    await seite.addInitScript(() => {
      const echt = window.matchMedia.bind(window);
      window.matchMedia = function (q) {
        const m = echt(q);
        if (/prefers-reduced-motion/.test(q)) {
          return { matches: false, media: q, addListener() {}, removeListener() {},
                   addEventListener() {}, removeEventListener() {}, onchange: null };
        }
        return m;
      };
    });
  }
  await seite.addInitScript(MITSCHRIFT);
  await seite.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await seite.waitForTimeout(DAUER_MS);
  const v = await seite.evaluate(() => window.__verlauf || []);
  await ctx.close();
  if (!v.length) return null;
  const ringe = v[0].length;
  const aus = [];
  for (let k = 0; k < ringe; k++) {
    const reihe = v.map((z) => z[k]);
    aus.push({
      zwischen: reihe.filter((x) => x > 5 && x < 183).length,
      wechsel: reihe.filter((x, i) => i > 0 && x !== reihe[i - 1]).length,
      ende: reihe[reihe.length - 1],
    });
  }
  return { ringe, aus };
}

/* ---- 1. Ohne die Einstellung: der Ring muss sich fuellen ---- */
for (const [name, b, h, handy] of [['Telefon', 390, 844, true], ['Rechner', 1440, 900, false]]) {
  const m = await messen(b, h, handy, 'no-preference');
  if (!m) { pruef(name + ': Ringe gefunden', false, 'keine .prozess-ring-fg'); continue; }
  const schwach = m.aus.filter((r) => r.zwischen < 5).length;
  pruef(name + ': jeder Ring fuellt sich allmaehlich', schwach === 0,
    m.aus.map((r) => r.zwischen).join('/') + ' Messpunkte mitten im Fuellen (mindestens 5 je Ring)');
}

/* ---- 2. Mit der Einstellung: nichts darf sich bewegen ---- */
const ruhig = await messen(390, 844, true, 'reduce');
if (!ruhig) {
  pruef('Bei "Bewegung reduzieren" Ringe gefunden', false, 'keine .prozess-ring-fg');
} else {
  const bewegt = ruhig.aus.filter((r) => r.wechsel > 0).length;
  const leer = ruhig.aus.filter((r) => r.ende !== 0).length;
  const name = 'Bei "Bewegung reduzieren" bewegt sich nichts';
  if (GEGENPROBE) {
    pruef('Das wiederhergestellte Blinken faellt auf', bewegt > 0,
      bewegt + ' von ' + ruhig.ringe + ' Ringen wechseln ihren Wert');
  } else {
    pruef(name, bewegt === 0,
      bewegt === 0 ? 'in ' + (DAUER_MS / 1000) + ' s kein einziger Wechsel'
                   : bewegt + ' von ' + ruhig.ringe + ' Ringen blinken');
    pruef('Bei "Bewegung reduzieren" sind alle Ringe voll', leer === 0,
      leer === 0 ? ruhig.ringe + ' Ringe gefuellt' : leer + ' Ringe bleiben leer');
  }
}

await browser.close();
console.log('\nErgebnis: ' + (fehler === 0
  ? (GEGENPROBE ? 'die Gegenprobe faellt auf' : 'alle ' + geprueft + ' Prüfungen bestanden')
  : fehler + ' von ' + geprueft + ' Prüfungen fehlgeschlagen'));
process.exit(fehler === 0 ? 0 : 1);
