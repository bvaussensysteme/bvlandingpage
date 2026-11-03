/* ============================================================
   Prüft die eigene Reichweitenmessung im echten Browser.

   Warum zusätzlich zum Textprüfskript: Ob ein Paket wirklich abgeht,
   was darin steht und ob der Abschalter greift, steht nicht im
   Quelltext – das entscheidet der Browser. Abgefangen wird alles:
   /api/messung wird nie wirklich aufgerufen, gelesen wird nur, was
   abgegangen WÄRE.

   Aufruf:     node scripts/pruefe-messung.mjs
   Gegenprobe: node scripts/pruefe-messung.mjs --gegenprobe
   Braucht Playwright (npm i --no-save playwright).
   ============================================================ */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8791 + (GEGENPROBE ? 1 : 0);

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const ordner = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const letzter = ordner[ordner.length - 1];
  return letzter ? `${basis}/${letzter}/chrome-linux/chrome` : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0;
const ergebnisse = [];
function pruef(name, ok, info = '') {
  ergebnisse.push([name, !!ok]);
  if (!GEGENPROBE) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(50) + info);
  if (!ok) fehler++;
}

const browser = await chromium.launch({
  timeout: 60000, executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});

/* Eine Seite vorbereiten: Messpakete abfangen und sammeln. */
async function neueSeite(ctx, { abschalter = false } = {}) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const pakete = [];
  await page.route('**/api/messung', async (route) => {
    let daten = null;
    try { daten = JSON.parse(route.request().postData() || '{}'); } catch (e) { daten = {}; }
    pakete.push(daten);
    await route.fulfill({ status: 204, body: '' });
  });
  if (GEGENPROBE) {
    /* Drei eingebaute Fehler, jeder für eine eigene Zusage. */
    await page.route('**/js/messung.js*', async (route) => {
      const a = await route.fetch();
      let t = await a.text();
      t = t.replace("if (location.pathname.indexOf('/werkstatt') === 0) return;", '');
      t = t.replace("if (window.localStorage && localStorage.getItem(ABSCHALTER) === '1') return;", '');
      t = t.replace('gesammelt += Math.round((Date.now() - sichtbarSeit) / 1000);', 'gesammelt += 0;');
      await route.fulfill({ response: a, body: t,
        headers: { ...a.headers(), 'content-type': 'application/javascript' } });
    });
  }
  if (abschalter) {
    await page.addInitScript(() => {
      try { localStorage.setItem('bv_messung_aus', '1'); } catch (e) {}
    });
  }
  return { page, pakete };
}

/* Das Wegschalten des Tabs nachstellen: Genau daran hängt das Senden
   (visibilitychange → hidden). Die Eigenschaft wird überschrieben, damit
   der echte Zuhörer in js/messung.js seinen eigenen Zustand liest. */
async function wegschalten(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(400);
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const BASIS = `http://localhost:${PORT}`;

/* ---------- 1. Normaler Besuch ---------- */
{
  const { page, pakete } = await neueSeite(ctx);
  const fehlerSeite = [];
  page.on('pageerror', (e) => fehlerSeite.push(e.message));
  await page.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);

  const speicherVorher = await page.evaluate(() => ({
    keks: document.cookie,
    schluessel: Object.keys(localStorage).sort().join(',')
  }));

  /* Klick auf die Telefonnummer, ohne wirklich zu wählen. */
  const tel = await page.evaluate(() => {
    const a = document.querySelector('a[href^="tel:"]');
    if (!a) return false;
    a.addEventListener('click', (e) => e.preventDefault(), true);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  });
  pruef('Eine Telefonnummer zum Anklicken ist da', tel);
  await wegschalten(page);

  pruef('Ein Paket geht ab', pakete.length === 1, pakete.length + ' Paket(e)');
  const p = pakete[0] || {};
  pruef('Es nennt die Seite und zählt sie als neu',
    p.seite === '/index.html' && p.neu === true, JSON.stringify(p.seite) + ', neu=' + p.neu);
  pruef('Die Verweildauer ist gemessen, nicht geraten',
    p.dauer >= 2 && p.dauer < 30, p.dauer + ' s');
  pruef('Handy oder Rechner steht drin', p.geraet === 'rechner', String(p.geraet));
  pruef('Der Telefonklick ist dabei',
    Array.isArray(p.ereignisse) && p.ereignisse.some((e) => e.art === 'telefon'),
    JSON.stringify(p.ereignisse));
  pruef('Kein Kennzeichen für den Besucher im Paket',
    !/id|uuid|sitzung|besucher|fingerprint/i.test(Object.keys(p).join(',')),
    Object.keys(p).join(', '));

  const speicherNachher = await page.evaluate(() => ({
    keks: document.cookie,
    schluessel: Object.keys(localStorage).sort().join(',')
  }));
  pruef('Die Messung legt nichts im Browser ab',
    speicherVorher.keks === speicherNachher.keks &&
    speicherVorher.schluessel === speicherNachher.schluessel,
    'Kekse: "' + speicherNachher.keks + '", Speicher: "' + speicherNachher.schluessel + '"');
  pruef('Keine Fehler auf der Seite', fehlerSeite.length === 0, fehlerSeite.join(' | ').slice(0, 100));
  await page.close();
}

/* ---------- 2. Der Abschalter des Betriebs ---------- */
{
  const { page, pakete } = await neueSeite(ctx, { abschalter: true });
  await page.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await wegschalten(page);
  pruef('Mit Abschalter wird nichts gesendet', pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 3. In der Werkstatt wird nicht gemessen ---------- */
{
  const { page, pakete } = await neueSeite(ctx);
  await page.goto(`${BASIS}/werkstatt/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await wegschalten(page);
  pruef('Die Werkstatt sendet nichts', pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 3b. Und zwar aus ZWEI Gründen unabhängig voneinander ----------
   Block 3 beweist nur den ersten: scripts/baue-werkstatt.js nimmt das
   Skript dort heraus, es ist also gar nicht geladen. GEFUNDEN IN DER
   GEGENPROBE AM 03.11.2026: Der eingebaute Fehler (Pfadabfrage in
   js/messung.js entfernt) blieb damit unbemerkt – Block 3 hätte auch
   bestanden, wenn die zweite Sperre längst kaputt wäre.

   Deshalb wird hier das Skript absichtlich in die Werkstattseite
   eingesetzt. Jetzt hängt alles an der Pfadabfrage – und die wird
   geprüft. */
{
  const { page, pakete } = await neueSeite(ctx);
  await page.route('**/werkstatt/index.html', async (route) => {
    const a = await route.fetch();
    const t = (await a.text()).replace('</body>',
      '<script src="/js/messung.js"></script></body>');
    await route.fulfill({ response: a, body: t,
      headers: { ...a.headers(), 'content-type': 'text/html; charset=utf-8' } });
  });
  await page.goto(`${BASIS}/werkstatt/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const geladen = await page.evaluate(() =>
    !!document.querySelector('script[src*="messung.js"]'));
  await wegschalten(page);
  pruef('Eingesetzt ist das Skript dort wirklich geladen', geladen);
  pruef('Auch geladen würde in der Werkstatt nicht gemessen',
    pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 4. Die Zahlenseite zeigt, was ankommt ---------- */
{
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const fehlerSeite = [];
  page.on('pageerror', (e) => fehlerSeite.push(e.message));
  /* Beispielzahlen statt der echten Datenbank: Geprüft wird die
     Darstellung, nicht der Worker. Der 14.11.2026 ist ein Samstag -
     damit muss der Wochentagsblock den Samstag als stärksten zeigen. */
  await page.route('**/werkstatt/api/zahlen*', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      von: '2026-11-01', tage: 30,
      tageReihe: [{ tag: '2026-11-13', aufrufe: 10 }, { tag: '2026-11-14', aufrufe: 90 }],
      seiten: [{ seite: '/konfigurator.html', aufrufe: 70, dauer: 185 },
               { seite: '/', aufrufe: 30, dauer: 42 }],
      quellen: [{ quelle: 'google.de', aufrufe: 60 }, { quelle: 'direkt', aufrufe: 40 }],
      geraete: [{ geraet: 'handy', aufrufe: 80 }, { geraet: 'rechner', aufrufe: 20 }],
      handlungen: [{ art: 'telefon', anzahl: 7 }, { art: 'anfrage-gesendet', anzahl: 3 }],
      trichter: [{ nr: 1, name: 'anlage', anzahl: 50 }, { nr: 2, name: 'dach', anzahl: 20 }],
      stunden: [{ stunde: 20, aufrufe: 55 }]
    })
  }));
  await page.goto(`${BASIS}/werkstatt/zahlen.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const text = await page.locator('body').innerText();
  pruef('Die Zahlenseite zeigt die Summe', /100/.test(text), 'Seitenaufrufe');
  pruef('Sie zeigt die abgeschickten Anfragen', /Anfragen abgeschickt/.test(text) && /\b3\b/.test(text));
  pruef('Sie zeigt den stärksten Wochentag',
    /Samstag/.test(text) && /90,0|90\.0/.test(text.replace(/\s+/g, ' ')),
    (text.match(/Samstag[^\n]*/) || [''])[0].trim());
  pruef('Sie zeigt die Verweildauer in Minuten', /3:05 min/.test(text),
    (text.match(/konfigurator[^\n]*/i) || [''])[0].trim());
  pruef('Sie zeigt den Trichter', /1\. anlage/.test(text) && /40 %/.test(text),
    (text.match(/2\. dach[^\n]*/) || [''])[0].trim());
  pruef('Der Abschalter steht auf der Seite',
    await page.locator('#abschalter').isVisible());
  pruef('Zahlenseite ohne Fehler', fehlerSeite.length === 0, fehlerSeite.join(' | ').slice(0, 100));
  await page.close();
}

await browser.close();
server.kill();

if (!GEGENPROBE) {
  console.log(fehler === 0
    ? `\nErgebnis: alle ${ergebnisse.length} Prüfungen bestanden`
    : `\nErgebnis: ${fehler} von ${ergebnisse.length} Prüfung(en) nicht bestanden`);
  process.exit(fehler === 0 ? 0 : 1);
}

const sollenScheitern = [
  'Auch geladen würde in der Werkstatt nicht gemessen',
  'Mit Abschalter wird nichts gesendet',
  'Die Verweildauer ist gemessen, nicht geraten'
];
let luecken = 0;
sollenScheitern.forEach((name) => {
  const t = ergebnisse.find((e) => e[0] === name);
  if (!t) { console.log('  FEHLGESCHLAGEN ' + name + ' – Prüfung gar nicht gelaufen'); luecken++; }
  else if (t[1]) { console.log('  FEHLGESCHLAGEN ' + name + ' – eingebauten Fehler NICHT bemerkt'); luecken++; }
  else console.log('  erkannt        ' + name);
});
console.log(luecken === 0
  ? 'Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden'
  : `Ergebnis: ${luecken} eingebaute Fehler blieben unbemerkt`);
process.exit(luecken === 0 ? 0 : 1);
