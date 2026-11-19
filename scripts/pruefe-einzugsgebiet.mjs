#!/usr/bin/env node
/* ============================================================
   Einzugsgebiet: Die Orte stehen in der Seite, nicht erst im
   Browser.

   ANLASS (14.11.2026 gefunden, 19.11.2026 behoben): Das <ul> war
   leer und wurde erst im Browser gefuellt. Gemessen: ohne
   JavaScript 0 Eintraege, mit 31. Die Seite beantwortete ihre
   eigene Frage ("Kommt ihr zu mir?") also nur mit Skript, und
   Suchmaschinen sahen ein Geruest.

   Geprueft wird deshalb BEIDES: ohne JavaScript muss die Liste
   vollstaendig dastehen, und mit JavaScript darf sie sich nicht
   verdoppeln und muss weiterhin auf Klicks reagieren.

   Aufruf:     node scripts/pruefe-einzugsgebiet.mjs
   Gegenprobe: node scripts/pruefe-einzugsgebiet.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8795;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(52)} ${beleg}`); }
  else { console.log(`  FEHLER  ${name.padEnd(52)} ${beleg}`); fehler++; }
};

/* Die Quelle der Wahrheit: dieselbe Datei, aus der die Seite gebaut wird. */
const ORTE = JSON.parse(fs.readFileSync(path.join(WURZEL, 'src', '_data', 'orte.json'), 'utf8'));
const SOLL = ORTE.length;
const MIT_HINWEIS = ORTE.filter((o) => o.hinweis).length;

/* Die eingebauten Fehler der Gegenprobe. Jeder stellt genau den
   Zustand her, den es frueher gab oder der beim naechsten Umbau
   entstehen koennte. */
const FEHLER = [
  { name: 'Die Liste ist wieder leer im HTML',
    machen: (t) => t.replace(/(<ul class="orte-list" id="orteListe">)[\s\S]*?(<\/ul>)/, '$1$2') },
  { name: 'Ein Ort fehlt in der Seite',
    machen: (t) => t.replace(/<li><button type="button" data-ort="3"[\s\S]*?<\/li>/, '') },
  { name: 'Die Hinweiszeichen fehlen',
    machen: (t) => t.replace(/ <span class="info-badge" data-tip="[^"]*">i<\/span>/g, '') },
  { name: 'Das Skript baut die Liste noch einmal dazu',
    machen: (t) => t.replace('var liste = document.getElementById(\'orteListe\');',
      'var liste = document.getElementById(\'orteListe\');\n  orte.forEach(function (o) { var li = document.createElement("li"); li.innerHTML = "<button type=\\"button\\">" + o.name + "</button>"; liste.appendChild(li); });') },
];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1800));
const browser = await chromium.launch();

async function messen(mitJs, umbau) {
  const ctx = await browser.newContext({ javaScriptEnabled: mitJs,
    viewport: { width: 390, height: 800 } });
  const s = await ctx.newPage();
  if (umbau) {
    await s.route('**/einzugsgebiet.html', async (route) => {
      const a = await route.fetch();
      await route.fulfill({ response: a, body: umbau(await a.text()) });
    });
  }
  await s.goto(`http://127.0.0.1:${PORT}/einzugsgebiet.html`, { waitUntil: 'load' });
  await s.waitForTimeout(mitJs ? 1800 : 500);
  const r = await s.evaluate(() => ({
    eintraege: document.querySelectorAll('#orteListe li').length,
    knoepfe: document.querySelectorAll('#orteListe button').length,
    namen: [...document.querySelectorAll('#orteListe button')].map((b) => b.textContent.trim()),
    badges: document.querySelectorAll('#orteListe .info-badge').length,
    haupt: document.querySelectorAll('#orteListe .orte-dot.hauptort').length,
  }));
  if (mitJs) {
    try {
      await s.click('#orteListe button[data-ort="4"]', { timeout: 3000 });
      await s.waitForTimeout(400);
      r.aktiv = await s.evaluate(() =>
        (document.querySelector('#orteListe button.active') || {}).textContent || '');
    } catch (e) { r.aktiv = ''; }
  }
  await ctx.close();
  return r;
}

try {
  if (!GEGEN) {
    const ohne = await messen(false);
    p('OHNE JavaScript steht die ganze Liste da',
      ohne.eintraege === SOLL && ohne.knoepfe === SOLL,
      `${ohne.eintraege} von ${SOLL} Eintraegen`);
    p('OHNE JavaScript stehen die Ortsnamen da',
      ORTE.every((o) => ohne.namen.some((n) => n.indexOf(o.name) === 0)),
      ohne.namen.slice(0, 2).join(' / ') + ' …');
    p('OHNE JavaScript sind die Randzonen-Hinweise da',
      ohne.badges === MIT_HINWEIS, `${ohne.badges} von ${MIT_HINWEIS}`);

    const mit = await messen(true);
    p('MIT JavaScript bleibt die Liste gleich lang',
      mit.eintraege === SOLL, `${mit.eintraege} von ${SOLL}`);
    p('MIT JavaScript reagiert ein Ort auf den Klick',
      mit.aktiv.indexOf(ORTE[4].name) === 0, `markiert: "${mit.aktiv}"`);
    p('Die Daten stehen nur EINMAL in der Seite',
      (await (await fetch(`http://127.0.0.1:${PORT}/einzugsgebiet.html`)).text())
        .split('"lat"').length - 1 === SOLL,
      `${SOLL} Koordinatenpaare erwartet`);
  } else {
    for (const f of FEHLER) {
      const ohne = await messen(false, f.machen);
      const mit = await messen(true, f.machen);
      const bemerkt = ohne.eintraege !== SOLL || ohne.knoepfe !== SOLL ||
        ohne.badges !== MIT_HINWEIS || mit.eintraege !== SOLL ||
        !ORTE.every((o) => ohne.namen.some((n) => n.indexOf(o.name) === 0));
      p(`eingebauter Fehler bemerkt: ${f.name}`, bemerkt,
        `ohne JS ${ohne.eintraege}/${ohne.badges}, mit JS ${mit.eintraege}`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}

console.log();
if (fehler === 0) {
  console.log(GEGEN ? `Gegenprobe bestanden: alle ${anzahl} eingebauten Fehler bemerkt`
                    : `Ergebnis: alle ${anzahl} Pruefungen bestanden`);
  process.exit(0);
}
console.log(`Ergebnis: ${fehler} von ${anzahl} ${GEGEN ? 'eingebauten Fehlern NICHT bemerkt' : 'Pruefungen beanstandet'}`);
process.exit(1);
