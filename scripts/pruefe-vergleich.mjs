#!/usr/bin/env node
/* Prueft die Gegenueberstellung TDS / SkyView auf der Terrassenseite –
 * im echten Browser, auf Handy- und Rechnerbreite.
 *
 * ANLASS (13.11.2026). Die zwei Modelle standen als zwei lange Karten
 * untereinander; wer den Unterschied wissen wollte, musste zwei
 * Merkmallisten im Kopf vergleichen (Befund 7 in
 * docs/AUDIT-CUSTOMER-JOURNEY.md).
 *
 * WARUM IM BROWSER: Eine Tabelle mit drei Spalten ist am Handy der
 * klassische Fall fuer waagerechtes Scrollen. Ob sie passt, haengt von
 * Schriftgroesse, Innenabstand und dem laengsten Wort ab - im Quelltext
 * steht das nirgends. Die Regel lautet: kein waagerechtes Scrollen.
 *
 * Aufruf:  node scripts/pruefe-vergleich.mjs [--gegenprobe]
 *
 * --gegenprobe schiebt ein sehr langes, nicht umbrechbares Wort in eine
 * Zelle. Dann MUSS die Breitenpruefung anschlagen - sonst wuerde sie
 * auch echtes Ueberlaufen nicht bemerken.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8261;
const SEITE = '/produkte/terrassenueberdachung.html';

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(52)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(52)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: ein zu langes Wort in einer Zelle'
                       : 'Gegenueberstellung TDS / SkyView');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const BASIS = `http://127.0.0.1:${PORT}`;

for (const [name, breite, hoehe] of [['Handy', 390, 844], ['Rechner', 1280, 900]]) {
  const seite = await browser.newPage();
  await seite.setViewportSize({ width: breite, height: hoehe });
  await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
  await seite.goto(`${BASIS}${SEITE}`, { waitUntil: 'domcontentloaded' });
  await seite.waitForTimeout(500);

  if (GEGENPROBE) {
    await seite.evaluate(() => {
      const z = document.querySelector('.vergleich tbody td');
      if (z) z.textContent = 'Polycarbonatmehrstegplattenverglasungsabdichtungsprofilsystem'.repeat(2);
    });
    await seite.waitForTimeout(250);
  }

  const m = await seite.evaluate(() => {
    const t = document.querySelector('.vergleich');
    if (!t) return { fehlt: true };
    const zeilen = [...t.querySelectorAll('tbody tr')];
    return {
      fehlt: false,
      zeilen: zeilen.length,
      vollstaendig: zeilen.every((r) =>
        r.querySelector('th[scope="row"]') && r.querySelectorAll('td').length === 2),
      kopfspalten: t.querySelectorAll('thead th[scope="col"]').length,
      beschriftung: !!t.querySelector('caption'),
      tabelleBreit: Math.round(t.getBoundingClientRect().width),
      elternBreit: Math.round(t.parentElement.getBoundingClientRect().width),
      seiteScroll: document.documentElement.scrollWidth,
      fenster: window.innerWidth,
      leer: zeilen.filter((r) => [...r.querySelectorAll('td')]
        .some((c) => !c.textContent.trim())).length
    };
  });

  if (m.fehlt) { pruef(`${name}: Die Tabelle ist da`, false, 'nicht gefunden'); continue; }

  if (!GEGENPROBE) {
    pruef(`${name}: Sechs Vergleichszeilen`, m.zeilen === 6, `${m.zeilen} Zeilen`);
    pruef(`${name}: Jede Zeile hat Kopf und zwei Werte`, m.vollstaendig, 'alle');
    pruef(`${name}: Keine leere Zelle`, m.leer === 0, `${m.leer} Zeile(n) mit Luecke`);
    pruef(`${name}: Beide Modelle als Spaltenkopf`, m.kopfspalten === 2, `${m.kopfspalten}`);
    pruef(`${name}: Tabellenbeschriftung fuer Screenreader`, m.beschriftung, 'caption da');
  }

  const passt = m.tabelleBreit <= m.elternBreit + 1;
  const keinScroll = m.seiteScroll <= m.fenster + 1;
  if (GEGENPROBE) {
    pruef(`${name}: Das zu lange Wort faellt auf`, !(passt && keinScroll),
      `Tabelle ${m.tabelleBreit} in ${m.elternBreit}, Seite ${m.seiteScroll}/${m.fenster}`);
  } else {
    pruef(`${name}: Die Tabelle passt in ihren Platz`, passt,
      `${m.tabelleBreit} von ${m.elternBreit} px`);
    pruef(`${name}: Kein waagerechtes Scrollen`, keinScroll,
      `${m.seiteScroll} / ${m.fenster} px`);
  }
  await seite.close();
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
