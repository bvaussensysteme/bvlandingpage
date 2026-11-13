#!/usr/bin/env node
/* Prueft, ob die Produktwahl von einer Produktseite im Anfrage-Assistenten
 * ankommt – im echten Browser, ueber einen echten Seitenwechsel.
 *
 * ANLASS (13.11.2026). Die beiden „Jetzt anfragen"-Karten auf
 * produkte/terrassenueberdachung.html setzten per onclick
 *     document.getElementById('produkt').value = 'Terrassenüberdachung'
 * – ein Feld, das es auf dieser Seite nicht gibt (nachgezaehlt: 0 Treffer).
 * Jeder Klick warf einen Fehler. Und selbst mit Feld waere nichts
 * angekommen: „Terrassenüberdachung" steht nicht in der Auswahlliste des
 * Schritts „produkt" (dort heisst es „Terrassendach TDS").
 *
 * WARUM IM BROWSER: Der Kern ist ein Seitenwechsel. Ob ein Wert ihn
 * uebersteht, steht in keiner Zeile Quelltext – window wird dabei
 * verworfen, sessionStorage nicht. Eine Textsuche im Quelltext wuerde
 * beide Faelle gleich aussehen lassen.
 *
 * Aufruf:  node scripts/pruefe-produktwahl.mjs [--gegenprobe]
 *
 * --gegenprobe schreibt einen Wert in den Speicher, der nicht in der
 * Auswahlliste steht. Dann MUSS der Assistent ihn verwerfen und beim
 * ersten Schritt stehen bleiben – sonst kaeme ein fremder Wert aus der
 * Adresszeile ueber die Antworten in die Anfrage-E-Mail.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8251;

function chromeIn(ordner) {
  for (const w of [`${ordner}/chrome-linux/chrome`, `${ordner}/chrome-linux64/chrome`, `${ordner}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${basis}/${o[o.length - 1]}`) : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(48)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(48)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: fremder Wert im Speicher' : 'Produktwahl von der Produktseite zum Assistenten');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const seite = await browser.newPage();
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));

const BASIS = `http://127.0.0.1:${PORT}`;
await seite.goto(`${BASIS}/produkte/terrassenueberdachung.html`, { waitUntil: 'domcontentloaded' });

/* 1. Der kaputte Aufruf darf nicht zurueckkommen. */
const kaputt = await seite.evaluate(() =>
  document.body.innerHTML.includes("getElementById('produkt')"));
pruef('Kein Zugriff mehr auf ein Feld, das es nicht gibt', !kaputt,
  kaputt ? "getElementById('produkt') steht wieder im Quelltext" : 'entfernt');

/* 2. Klick auf die erste Karte – echter Seitenwechsel. */
const knoepfe = seite.locator('.produkt-card a.btn-gold');
pruef('Beide Produktkarten haben einen Anfrage-Knopf', await knoepfe.count() === 2,
  `${await knoepfe.count()} Knopf/Knoepfe`);

await knoepfe.first().click();
await seite.waitForLoadState('domcontentloaded');

if (GEGENPROBE) {
  await seite.evaluate(() => sessionStorage.setItem('bv-produktwahl', 'Gartenzwerg XL'));
  await seite.reload({ waitUntil: 'domcontentloaded' });
}

pruef('Der Klick fuehrt auf die Startseite', new URL(seite.url()).pathname === '/',
  new URL(seite.url()).pathname);
pruef('Kein Javascript-Fehler beim Klick', konsole.length === 0,
  konsole.length ? konsole[0].slice(0, 70) : 'Konsole still');

await seite.waitForTimeout(700);

/* 3. Steht der Assistent beim richtigen Schritt? */
const stand = await seite.evaluate(() => {
  const t = document.getElementById('awTitle');
  return { titel: t ? t.textContent.trim() : '(awTitle FEHLT)',
           text: document.body.innerText.slice(0, 2000) };
});

/* Ohne diese Zeile bestuende die Pruefung hohl: Findet der Selektor den
   Titel nicht, waere „steht nicht mehr beim Produktschritt" automatisch
   wahr. Genau so lief sie beim ersten Versuch am 13.11.2026 durch -
   der Selektor war geraten und traf nichts. */
pruef('Der Titel des Assistenten ist ueberhaupt lesbar',
  stand.titel !== '(awTitle FEHLT)' && stand.titel.length > 0, stand.titel);

const beiProdukt = /Was möchten Sie kostenlos konfigurieren/i.test(stand.titel);

if (GEGENPROBE) {
  pruef('Fremder Wert wird verworfen: Assistent bleibt beim Produktschritt',
    beiProdukt, `Titel: ${stand.titel}`);
  pruef('Der fremde Wert steht nirgends auf der Seite',
    !stand.text.includes('Gartenzwerg'), 'nicht uebernommen');
} else {
  pruef('Der Assistent steht NICHT mehr beim Produktschritt', !beiProdukt,
    `Titel: ${stand.titel}`);
  const uebernommen = await seite.evaluate(() =>
    (sessionStorage.getItem('bv-produktwahl') === null));
  pruef('Die Wahl wird nach dem Uebernehmen geloescht', uebernommen,
    'bv-produktwahl ist leer');
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(GEGENPROBE ? (fehler === 0 ? 0 : 1) : (fehler === 0 ? 0 : 1));
