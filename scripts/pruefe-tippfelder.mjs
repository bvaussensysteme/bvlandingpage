#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft: Kein Tippfeld der Seite ist am Handy kleiner als 16 px.

   ANLASS (04.11.2026, Betreiber am iPhone): "wenn man auf mobile auf
   RAL Ton suchen drueckt, zoomt alles so rein". iOS Safari zieht die
   ganze Seite heran, sobald ein Eingabefeld mit einer Schrift unter
   16 px den Fokus bekommt - und zoomt danach nicht von selbst wieder
   heraus. Die Messung fand es auf der ganzen Seite: 53 von 56
   Feldern lagen darunter, auch die des Widerrufsformulars.

   WARUM NICHT "maximum-scale=1": Das verbietet das Aufziehen mit
   zwei Fingern fuer die GANZE Seite und bricht WCAG 1.4.4. Darum
   prueft dieses Skript auch, dass kein Viewport das enthaelt - sonst
   koennte jemand den Zoomfehler spaeter gegen eine Sperre tauschen.

   ZWEITER, ANDERS GEBAUTER WEG: Die Regel haengt an
   (pointer: coarse). Das Skript misst darum zweimal - einmal mit
   nachgestellter Tippbedienung, einmal als Maus-Geraet. Nur wenn die
   Felder an der Maus WEITERHIN klein sind, greift die Regel wirklich
   am Finger und ist nicht versehentlich ueberall aktiv.

   ACHTUNG, DIESE PRUEFUNG WAR SCHON EINMAL BLIND: Ein Chromium ohne
   hasTouch meldet (pointer: fine). Die Messung lief dann gegen eine
   Regel, die gar nicht galt, und haette jede Groesse durchgewunken.
   Darum unten die Kontrolle, dass die beiden Zusammenhaenge sich
   tatsaechlich unterscheiden.

   Gegenprobe: node scripts/pruefe-tippfelder.mjs --gegenprobe
   --------------------------------------------------------------- */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8266;
const WURZEL = new URL('..', import.meta.url).pathname;

/* Der Browser liegt je nach Umgebung in chrome-linux/ ODER in
   chrome-linux64/ (am 12.11.2026 umgestellt - danach fanden 18
   Pruefskripte den Browser nicht mehr und keine Browser-Pruefung lief
   noch). Deshalb wird der Pfad gesucht statt geraten. */
function chromeIn(ordner) {
  const wege = [`${ordner}/chrome-linux/chrome`,
                `${ordner}/chrome-linux64/chrome`,
                `${ordner}/chrome`];
  for (const w of wege) if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${basis}/${o[o.length - 1]}`) : undefined;
}

/* Fehler fuer die Gegenprobe. Jeder muss GENAU EINE Pruefung rot
   machen - sonst sagt die Gegenprobe nichts ueber die einzelne. */
const FEHLER = [
  { datei: 'konfigurator.html', von: '.k3d-select,\n      .k3d-teilen-feld input { font-size: 16px; }',
    nach: '.k3d-teilen-feld input { font-size: 16px; }' },
  /* Anker gegen das MINIFIKAT, nicht gegen src/css/style.css - der
     Browser bekommt css/style.css. */
  { datei: 'css/style.css', von: '.aw-dim-in input,', nach: '' },
  { datei: 'css/style.css', von: ',.wr-feld{font-size:16px}', nach: '{font-size:16px}' },
  { datei: 'windzonen.html', von: '.wz-hoehe-input-wrap input, .wz-hoehe-select { font-size: 16px; }',
    nach: '.wz-hoehe-select { font-size: 16px; }' },
  { datei: 'konfigurator.html', von: 'content="width=device-width, initial-scale=1.0"',
    nach: 'content="width=device-width, initial-scale=1.0, maximum-scale=1"' },
  { datei: 'konfigurator.html', von: '@media (pointer: coarse) {\n      .k3d-zahl,',
    nach: '@media (pointer: fine), (pointer: coarse) {\n      .k3d-zahl,' },
];

let ok = 0; const rot = [];
function pruefe(was, bedingung, beleg) {
  if (bedingung) { ok++; console.log(`  ok    ${was}`); }
  else { rot.push(was); console.log(`  FEHLT ${was}${beleg ? '  (' + beleg + ')' : ''}`); }
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });

/* EIN Handler je Adresse. Zwei Routen auf dieselbe URL heben sich
   auf - der eingebaute Fehler kaeme dann nie an, und die Gegenprobe
   bliebe gruen, ohne dass es auffaellt (Fund vom 04.11.2026). */
async function routen(ctx) {
  if (!GEGENPROBE) return;
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    /* Nach dem PFAD vergleichen, nicht nach der ganzen Adresse: Das
       Stylesheet kommt als css/style.css?v=... - mit endsWith auf die
       Adresse fand der Fehler seine Datei nie, und die Gegenprobe
       blieb gruen, ohne etwas geprueft zu haben (Fund 04.11.2026). */
    const pfad = new URL(url).pathname;
    const treffer = FEHLER.filter((f) => pfad.endsWith('/' + f.datei));
    if (!treffer.length) return route.continue();
    const antwort = await route.fetch();
    let text = await antwort.text();
    for (const f of treffer) {
      if (!text.includes(f.von)) { console.error(`  !! Anker nicht gefunden in ${f.datei}: ${f.von.slice(0, 40)}`); process.exitCode = 2; }
      text = text.replace(f.von, f.nach);
    }
    return route.fulfill({ response: antwort, body: text });
  });
}

const SAMMELN = `(() => {
  const TIPP = new Set(['text','search','email','tel','url','number','password','date','time','month','week','datetime-local']);
  document.querySelectorAll('details').forEach(d => { d.open = true; });
  document.querySelectorAll('[hidden]').forEach(e => { e.hidden = false; });
  const out = [];
  for (const el of document.querySelectorAll('input,select,textarea')) {
    if (el.tagName === 'INPUT' && !TIPP.has((el.type||'text').toLowerCase())) continue;
    out.push({ kennung: el.id || el.name || el.className || el.type,
               px: Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10 });
  }
  return out;
})()`;

const SEITEN = ['konfigurator.html', 'widerruf.html', 'windzonen.html', 'baugenehmigung.html', 'index.html'];

console.log(`\n=== Tippfelder am Handy ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

/* ---------- 1. Am Finger: alles mindestens 16 px ---------- */
const finger = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
await routen(finger);
const s1 = await finger.newPage();

for (const p of SEITEN) {
  await s1.goto(`http://localhost:${PORT}/${p}`, { waitUntil: 'load' });
  await s1.waitForTimeout(700);
  const felder = await s1.evaluate(SAMMELN);
  const klein = felder.filter((f) => f.px < 16);
  pruefe(`${p}: alle ${felder.length} Tippfelder mindestens 16 px`,
    felder.length > 0 || p === 'index.html' ? klein.length === 0 : false,
    klein.slice(0, 3).map((f) => `${f.kennung} ${f.px}px`).join(', '));
  const quer = await s1.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  pruefe(`${p}: kein waagerechtes Scrollen bei 390 px`, quer <= 0, `${quer}px`);
  const vp = await s1.evaluate(() => (document.querySelector('meta[name=viewport]') || {}).content || '');
  pruefe(`${p}: Viewport sperrt das Aufziehen nicht`,
    !/maximum-scale|user-scalable\s*=\s*no/i.test(vp), vp);
}

/* ---------- 2. Der Assistent, durchgeklickt ----------
   Nicht die Klassen im Stylesheet nachsehen, sondern die Felder
   anfassen, die der Assistent wirklich baut. Sonst bliebe die
   Pruefung gruen, wenn jemand im JavaScript eine Klasse umbenennt. */
await s1.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await s1.waitForTimeout(900);
await s1.evaluate(() => {
  const k = [...document.querySelectorAll('#awBody .aw-option')].find((b) => /Direkt anfragen/.test(b.innerText || ''));
  if (k) k.click();
});
await s1.waitForTimeout(500);
await s1.locator('#awNext').click();
await s1.waitForTimeout(800);
const awFelder = await s1.evaluate(SAMMELN);
const awKlein = awFelder.filter((f) => f.px < 16);
pruefe(`Assistent, Wunsch-Schritt: alle ${awFelder.length} Tippfelder mindestens 16 px`,
  awFelder.length >= 3 && awKlein.length === 0,
  awFelder.length < 3 ? 'Schritt nicht erreicht' : awKlein.map((f) => `${f.kennung} ${f.px}px`).join(', '));

/* ---------- 3. An der Maus: unveraendert klein ----------
   Belegt, dass die Regel wirklich an (pointer: coarse) haengt. Waere
   sie versehentlich allgemein, wuerde das Bedienfeld am Rechner
   breiter - und niemand haette es gemessen. */
const maus = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await routen(maus);
const s2 = await maus.newPage();
await s2.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'load' });
await s2.waitForTimeout(700);
const amRechner = await s2.evaluate(SAMMELN);
/* Eine Ausnahme ist echt und alt: Das Neigungsfeld ist bewusst gross
   (20,8 px) - es zeigt den Wert an, statt ihn in eine Zeile zu
   quetschen. Sie wird namentlich zugelassen, nicht die Schwelle
   angehoben: Sonst rutschte spaeter ein zweites Feld unbemerkt mit. */
const gross = amRechner.filter((f) => f.px >= 16).map((f) => f.kennung);
pruefe('An der Maus bleiben die Felder so klein wie bisher',
  amRechner.length > 20 && gross.length === 1 && gross[0] === 'k3dNeigungZahl',
  gross.join(', ') || 'keins');
const auswahl = await s2.evaluate(() => {
  const e = document.querySelector('.k3d-select');
  return e ? getComputedStyle(e).fontSize : '-';
});
pruefe('An der Maus stehen die Auswahlfelder weiter auf 13,8 px', auswahl === '13.76px', auswahl);

/* ---------- 4. Die Pruefung ist nicht blind ----------
   Wenn Finger- und Maus-Messung dasselbe ergeben, stellt der
   Testbrowser die Tippbedienung nicht nach, und Punkt 1 wuerde jede
   Groesse durchwinken. */
const ff = await s1.evaluate(() => matchMedia('(pointer: coarse)').matches);
const mm = await s2.evaluate(() => matchMedia('(pointer: coarse)').matches);
pruefe('Der Testbrowser unterscheidet Finger und Maus wirklich', ff === true && mm === false, `Finger=${ff} Maus=${mm}`);

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  console.log(`Gegenprobe: ${FEHLER.length} Fehler eingebaut, ${rot.length} Pruefungen schlagen an.`);
  if (rot.length < FEHLER.length) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
