#!/usr/bin/env node
/* Prueft, ob der im Windzonen-Rechner gesuchte Standort im
 * Anfrage-Assistenten ankommt – im echten Browser, ueber einen echten
 * Seitenwechsel.
 *
 * ANLASS (13.11.2026). Der Rechner unter /windzonen verspricht im Text
 * „Schicken Sie uns Ihre Maße, dann rechnen wir das fuer Ihren Standort
 * durch" – gab den Standort aber nicht weiter. Wer dort gerade „56410
 * Montabaur" gesucht hatte, tippte PLZ und Ort im Anfrageformular ein
 * zweites Mal ein. /windzonen ist nach der Startseite die
 * zweithaeufigste Einstiegsseite (28 Aufrufe in 11 Tagen, 70 Sekunden
 * Verweildauer – die laengste von allen).
 *
 * WARUM IM BROWSER: Es geht um einen Seitenwechsel und um zwei Felder,
 * die erst beim Rendern des Kontaktschritts entstehen. Im Quelltext ist
 * beides nicht zu sehen.
 *
 * Aufruf:  node scripts/pruefe-standort-mitgeben.mjs [--gegenprobe]
 *
 * --gegenprobe legt statt eines Standorts Unsinn in den Speicher
 * („<img src=x onerror=alert(1)>" als Ort, „abcde" als PLZ). Beides MUSS
 * verworfen werden: Der Speicher liegt im Browser des Besuchers und
 * laesst sich von Hand aendern – was dort steht, darf nicht ungeprueft
 * in die Anfrage-E-Mail wandern.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8255;
const PLZ = '56410';
const ORT = 'Montabaur';

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
  if (ok) console.log(`  ok      ${name.padEnd(50)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(50)} ${beleg || ''}`); }
}

console.log(GEGENPROBE ? 'Gegenprobe: Unsinn im Speicher'
                       : 'Standort vom Windzonen-Rechner zum Assistenten');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const seite = await browser.newPage();
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));
const BASIS = `http://127.0.0.1:${PORT}`;

/* Externe Dienste sperren: Der Rechner fragt sonst einen Ortsdienst im
   Netz. Hier wird nicht die Ortssuche geprueft, sondern die Weitergabe. */
await seite.route('**', (r) =>
  r.request().url().startsWith(BASIS) ? r.continue() : r.abort());

await seite.goto(`${BASIS}/windzonen.html`, { waitUntil: 'domcontentloaded' });

/* Der Ergebnisblock (.wz-results) ist verborgen, bis eine Rechnung lief
   – darin steckt eine eigene Beobachtung, siehe docs/AUDIT-CUSTOMER-JOURNEY.md
   Befund 4: Wer die Seite nur liest, sieht diesen Weg nie. Hier wird NICHT
   die Ortssuche geprueft (die fragt einen Dienst im Netz, der gesperrt
   ist), sondern die Weitergabe. Deshalb wird der Block aufgedeckt. */
await seite.evaluate(() => {
  const r = document.querySelector('.wz-results');
  if (r) r.classList.add('visible');
});

const knopf = seite.locator('.wz-weiter-knoepfe a.btn-gold');
pruef('Der Beratungsknopf im Ergebnisblock ist da', await knopf.count() === 1,
  `${await knopf.count()} Knopf/Knoepfe`);
pruef('Er gibt den Standort weiter',
  /wzStandortMitgeben/.test(await knopf.first().getAttribute('onclick') || ''),
  'onclick gesetzt');

/* Das Suchfeld so fuellen, wie es nach einem Treffer aussieht. */
await seite.evaluate((v) => {
  document.getElementById('wz-address-input').value = v;
}, GEGENPROBE ? 'abcde <img src=x onerror=alert(1)>' : `${PLZ} ${ORT}`);

await knopf.first().click();
await seite.waitForLoadState('domcontentloaded');
await seite.waitForTimeout(500);

pruef('Der Klick fuehrt auf die Startseite',
  new URL(seite.url()).pathname === '/', new URL(seite.url()).pathname);

/* Bis zum Kontaktschritt: Kurzweg waehlen, dann zweimal weiter. */
await seite.evaluate(() => {
  const k = [...document.querySelectorAll('#awBody .aw-option')]
    .find((x) => /Direkt anfragen/.test(x.textContent));
  if (k) k.click();
});
await seite.waitForTimeout(300);
/* Nicht blind zweimal klicken: Der Kurzweg hat vier Schritte, und wie
   viele davon vor dem Kontakt liegen, ist nicht Sache dieser Pruefung.
   Deshalb weiter, bis der Kontaktschritt steht - hoechstens fuenfmal,
   damit eine Endlosschleife ausgeschlossen ist. */
for (let i = 0; i < 5; i++) {
  const t = await seite.evaluate(() => {
    const e = document.getElementById('awTitle');
    return e ? e.textContent.trim() : '';
  });
  if (t === 'Ihre Kontaktdaten') break;
  /* Der Kurzweg verlangt eine Nachricht, sonst geht es nicht weiter -
     daran blieb diese Pruefung beim zweiten Lauf haengen. Ein Satz
     genuegt; geprueft wird der Standort, nicht der Freitext. */
  await seite.evaluate(() => {
    const w = document.getElementById('awWunsch');
    if (w && !w.value) {
      w.value = 'Testanfrage aus der Pruefung';
      w.dispatchEvent(new Event('input', { bubbles: true }));
      w.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await seite.locator('#awNext').click();
  await seite.waitForTimeout(350);
}

const f = await seite.evaluate(() => {
  const g = (id) => { const e = document.getElementById(id); return e ? e.value : null; };
  const t = document.getElementById('awTitle');
  return { titel: t ? t.textContent.trim() : '(awTitle FEHLT)',
           plz: g('k_plz'), ort: g('k_ort'),
           /* Achtung: [null,null].join('|') ergibt "|", nicht
              "null|null" - genau daran ist diese Pruefung beim ersten
              Lauf am 13.11.2026 falsch rot geworden. Deshalb explizit. */
           rest: (() => { try {
             const a = sessionStorage.getItem('bv-plz');
             const b = sessionStorage.getItem('bv-ort');
             return (a === null && b === null) ? 'leer' : `${a} / ${b}`;
           } catch (e) { return 'LESEFEHLER'; } })() };
});

/* Ohne diese Zeile bestuende die Pruefung hohl: Wird der Kontaktschritt
   nicht erreicht, sind plz und ort null - und "nichts uebernommen" waere
   in der Gegenprobe automatisch wahr. */
pruef('Der Kontaktschritt ist erreicht', f.titel === 'Ihre Kontaktdaten', f.titel);
pruef('Die Felder PLZ und Ort sind vorhanden', f.plz !== null && f.ort !== null,
  `plz=${JSON.stringify(f.plz)} ort=${JSON.stringify(f.ort)}`);
pruef('Kein Javascript-Fehler', konsole.length === 0,
  konsole.length ? konsole[0].slice(0, 60) : 'Konsole still');
pruef('Der Speicher ist nach dem Uebernehmen leer', f.rest === 'leer', f.rest);

if (GEGENPROBE) {
  pruef('Die unsinnige PLZ wird verworfen', f.plz === '', JSON.stringify(f.plz));
  pruef('Der unsinnige Ort wird verworfen', f.ort === '', JSON.stringify(f.ort));
  pruef('Nichts davon steht auf der Seite',
    !/onerror|alert\(1\)/.test(f.ort || ''), 'sauber');
} else {
  pruef('Die PLZ ist vorbelegt', f.plz === PLZ, JSON.stringify(f.plz));
  pruef('Der Ort ist vorbelegt', f.ort === ORT, JSON.stringify(f.ort));
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
