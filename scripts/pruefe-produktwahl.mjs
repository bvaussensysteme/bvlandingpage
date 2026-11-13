#!/usr/bin/env node
/* Prueft, ob die Produktwahl von einer Produktseite im Anfrage-Assistenten
 * ankommt – im echten Browser, ueber einen echten Seitenwechsel.
 *
 * ANLASS (13.11.2026). Auf ALLEN SECHS Produktseiten setzten die
 * „Jetzt anfragen"-Knoepfe per onclick
 *     document.getElementById('produkt').value = '…'
 * – ein Feld, das es auf diesen Seiten nicht gibt. Jeder Klick warf einen
 * Fehler. Vier der sechs setzten ausserdem einen Wert, den der Schritt
 * „produkt" nicht kennt („Terrassenueberdachung", „Kaltwintergarten",
 * „Sonnenschutz / Markise", „Gelaender") – die Vorauswahl waere also auch
 * mit vorhandenem Feld verfallen.
 *
 * WARUM IM BROWSER: Der Kern ist ein Seitenwechsel. Ob ein Wert ihn
 * uebersteht, steht in keiner Zeile Quelltext – window wird dabei
 * verworfen, sessionStorage nicht. Eine Textsuche wuerde beide Faelle
 * gleich aussehen lassen.
 *
 * Aufruf:  node scripts/pruefe-produktwahl.mjs [--gegenprobe]
 *
 * --gegenprobe schiebt einen Schluessel in den Speicher, der in
 * PRODUKTWEGE nicht steht. Dann MUSS der Assistent ihn verwerfen und beim
 * ersten Schritt stehen bleiben – sonst kaeme Fremdes ueber die Antworten
 * in die Anfrage-E-Mail.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8251;
const PRODUKTSCHRITT = 'Was möchten Sie kostenlos konfigurieren?';
const NACHRICHTSCHRITT = 'Was können wir für Sie tun?';

/* Erwartung je Produktseite. „notiz" steht da, wo das Produkt im
   Assistenten keine eigene Kachel hat und ueber „Direkt anfragen" geht –
   dann MUSS der Name im Nachrichtenfeld stehen, sonst kommt die Anfrage
   ohne Produkt an. */
const SEITEN = [
  { datei: 'produkte/terrassenueberdachung.html', knoepfe: 2 },
  { datei: 'produkte/carport.html',               knoepfe: 3 },
  { datei: 'produkte/pergola.html',               knoepfe: 4 },
  { datei: 'produkte/kaltwintergarten.html',      knoepfe: 1, notiz: 'Kaltwintergarten' },
  { datei: 'produkte/sonnenschutz.html',          knoepfe: 4, notiz: 'Sonnenschutz / Markise' },
  { datei: 'produkte/gelaender.html',             knoepfe: 2, notiz: 'Geländer' },
  { datei: 'produkte/balkon-fassade.html',        knoepfe: 3 },
  { datei: 'produkte/bushaltestelle.html',        knoepfe: 1, notiz: 'Bushaltestelle' },
  { datei: 'produkte/eingang.html',               knoepfe: 4, notiz: 'Vordach FLY' },
  { datei: 'produkte/fahrradueberdachung.html',   knoepfe: 1, notiz: 'Fahrradüberdachung' },
  { datei: 'produkte/faltdach.html',              knoepfe: 1 },
  { datei: 'produkte/fassade.html',               knoepfe: 1, notiz: 'Fassadenverkleidung Deco Wall' },
  { datei: 'produkte/garten-aussenbereich.html',  knoepfe: 4, notiz: 'Gartenhaus TDS' },
  { datei: 'produkte/gartenhaus.html',            knoepfe: 1, notiz: 'Gartenhaus TDS' },
  { datei: 'produkte/sichtschutz.html',           knoepfe: 1, notiz: 'Sichtschutz Aluminium' },
  { datei: 'produkte/velaris.html',               knoepfe: 1 }
];

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

console.log(GEGENPROBE
  ? 'Gegenprobe: unbekannter Schlüssel im Speicher'
  : 'Produktwahl von den Produktseiten zum Assistenten');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const BASIS = `http://127.0.0.1:${PORT}`;

for (const s of SEITEN) {
  const kurz = s.datei.replace('produkte/', '').replace('.html', '');
  const seite = await browser.newPage();
  const konsole = [];
  seite.on('pageerror', (e) => konsole.push(String(e)));

  await seite.goto(`${BASIS}/${s.datei}`, { waitUntil: 'domcontentloaded' });

  const kaputt = await seite.evaluate(() =>
    document.body.innerHTML.includes("getElementById('produkt')"));
  pruef(`${kurz}: kein Zugriff auf ein Feld, das es nicht gibt`, !kaputt,
    kaputt ? 'alter Aufruf ist zurueck' : 'entfernt');

  /* Nicht die Knopfzahl raten, sondern im Dokument nachsehen: Jeder
     Anfrage-Knopf einer Produktkarte MUSS eine Vorauswahl tragen. So
     faellt auch eine kuenftig neu hinzugefuegte Karte ohne Vorauswahl
     auf, ohne dass dieses Skript geaendert werden muss. */
  const karten = await seite.evaluate(() => {
    const a = Array.from(document.querySelectorAll('.produkt-card a[href="/#kontakt"]'))
      .filter((x) => /Jetzt anfragen/.test(x.textContent));
    return { gesamt: a.length,
             ohne: a.filter((x) => !/bv-produktwahl/.test(x.outerHTML)).length };
  });
  pruef(`${kurz}: Anzahl der Produktkarten wie erwartet`, karten.gesamt === s.knoepfe,
    `${karten.gesamt} von ${s.knoepfe}`);
  pruef(`${kurz}: jede Karte hat eine Vorauswahl`, karten.ohne === 0,
    karten.ohne ? `${karten.ohne} ohne Vorauswahl` : 'alle');

  const knoepfe = seite.locator('.produkt-card a[href="/#kontakt"]');

  await knoepfe.first().click();
  await seite.waitForLoadState('domcontentloaded');

  if (GEGENPROBE) {
    await seite.evaluate(() => sessionStorage.setItem('bv-produktwahl', 'gartenzwerg-xl'));
    await seite.reload({ waitUntil: 'domcontentloaded' });
  }
  await seite.waitForTimeout(600);

  const stand = await seite.evaluate(() => {
    const t = document.getElementById('awTitle');
    const w = document.getElementById('awWunsch');
    return { titel: t ? t.textContent.trim() : '(awTitle FEHLT)',
             wunsch: w ? w.value : null,
             rest: (() => { try { return sessionStorage.getItem('bv-produktwahl'); }
                            catch (e) { return 'LESEFEHLER'; } })() };
  });

  /* Ohne diese Zeile bestuende die Pruefung hohl: Findet der Selektor den
     Titel nicht, waere „steht nicht mehr beim Produktschritt" automatisch
     wahr. Genau so lief sie beim ersten Versuch am 13.11.2026 durch. */
  pruef(`${kurz}: Titel des Assistenten ist lesbar`,
    stand.titel !== '(awTitle FEHLT)' && stand.titel.length > 0, stand.titel);

  pruef(`${kurz}: kein Javascript-Fehler`, konsole.length === 0,
    konsole.length ? konsole[0].slice(0, 60) : 'Konsole still');

  if (GEGENPROBE) {
    pruef(`${kurz}: fremder Schlüssel wird verworfen`,
      stand.titel === PRODUKTSCHRITT, stand.titel);
    pruef(`${kurz}: nichts Fremdes im Nachrichtenfeld`,
      !stand.wunsch || !/gartenzwerg/i.test(stand.wunsch), 'sauber');
  } else {
    pruef(`${kurz}: Assistent steht nicht mehr beim Produktschritt`,
      stand.titel !== PRODUKTSCHRITT, stand.titel);
    pruef(`${kurz}: Wahl ist nach dem Übernehmen gelöscht`,
      stand.rest === null, 'Speicher leer');
    if (s.notiz) {
      pruef(`${kurz}: geht über den Kurzweg`, stand.titel === NACHRICHTSCHRITT, stand.titel);
      pruef(`${kurz}: Produktname steht im Nachrichtenfeld`,
        stand.wunsch === s.notiz, JSON.stringify(stand.wunsch));
    }
  }
  await seite.close();
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
