#!/usr/bin/env node
/* Prueft die Gebietspruefung im Anfrage-Assistenten, im echten Browser.
 *
 * ANLASS (14.11.2026), Betreiber: "waere auch gut im konfigurator, wenn
 * man am ende seine daten eintraegt und die plz ort etc. das das system
 * prueft, ob das in unserem 60km radius ab 56422 dernbach is".
 *
 * Die wichtigste Pruefung ist NICHT, ob der Hinweis erscheint, sondern ob
 * er AUSBLEIBT, wenn die PLZ nicht passt. Der Besucher darf nie eine
 * Absage lesen - die eigene FAQ sagt "Bei groesseren Auftraegen kommen wir
 * auch weiter". Der Hinweis fuer den Betrieb gehoert in die E-Mail, nicht
 * auf den Bildschirm. Genau das waere beim Bauen am 14.11.2026 beinahe
 * schiefgegangen: Die Zeile stand zuerst auch in der Zusammenfassung, die
 * der Besucher sieht.
 *
 * Aufruf:  node scripts/pruefe-einzugsgebiet.mjs [--gegenprobe]
 *
 * --gegenprobe traegt eine PLZ weit ausserhalb ein (Hamburg) und verlangt,
 * dass der Hinweis NICHT erscheint. Zusaetzlich wird geprueft, dass das
 * Wort "ausserhalb" nirgends auf der Seite steht.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8271;

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

console.log(GEGENPROBE ? 'Gegenprobe: PLZ weit ausserhalb'
                       : 'Gebietspruefung im Anfrage-Assistenten');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const seite = await browser.newPage();
await seite.setViewportSize({ width: 1280, height: 900 });
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));
const BASIS = `http://127.0.0.1:${PORT}`;
await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
await seite.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
await seite.waitForTimeout(700);

/* Ueber den Kurzweg zum Kontaktschritt. */
await seite.evaluate(() => {
  const k = [...document.querySelectorAll('#awBody .aw-option')]
    .find((x) => /Direkt anfragen/.test(x.textContent));
  if (k) k.click();
});
await seite.waitForTimeout(250);
for (let i = 0; i < 5; i++) {
  const t = await seite.evaluate(() => {
    const e = document.getElementById('awTitle'); return e ? e.textContent.trim() : '';
  });
  if (t === 'Ihre Kontaktdaten') break;
  await seite.evaluate(() => {
    const w = document.getElementById('awWunsch');
    if (w && !w.value) { w.value = 'Testanfrage'; w.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await seite.locator('#awNext').click();
  await seite.waitForTimeout(320);
}

const titel = await seite.evaluate(() => {
  const e = document.getElementById('awTitle'); return e ? e.textContent.trim() : '(fehlt)';
});
pruef('Der Kontaktschritt ist erreicht', titel === 'Ihre Kontaktdaten', titel);
pruef('Das Hinweisfeld ist angelegt',
  await seite.evaluate(() => !!document.getElementById('aw-gebiet')), 'aw-gebiet da');

async function tippe(plz, ort) {
  await seite.evaluate(([p, o]) => {
    const pf = document.getElementById('k_plz'), of = document.getElementById('k_ort');
    if (pf) { pf.value = p; pf.dispatchEvent(new Event('input', { bubbles: true })); }
    if (of) { of.value = o; of.dispatchEvent(new Event('input', { bubbles: true })); }
  }, [plz, ort]);
  await seite.waitForTimeout(200);
  return seite.evaluate(() => {
    const f = document.getElementById('aw-gebiet');
    return { sichtbar: f ? !f.hidden : false, text: f ? f.textContent.trim() : '' };
  });
}

if (GEGENPROBE) {
  const a = await tippe('20095', 'Hamburg');
  pruef('Weit ausserhalb: kein Hinweis', !a.sichtbar, a.text || 'nichts angezeigt');
  const b = await tippe('80331', 'München');
  pruef('Noch weiter weg: kein Hinweis', !b.sichtbar, b.text || 'nichts angezeigt');
  /* Nur im Bedienfeld pruefen, nicht auf der ganzen Seite: Die FAQ fragt
     voellig zu Recht "Kommen Sie auch ausserhalb des Westerwaldkreises?".
     Daran ist nichts falsch - die Pruefung war beim ersten Lauf am
     14.11.2026 zu grob und hat genau das gemeldet. */
  const wort = await seite.evaluate(() => {
    const w = document.querySelector('.anfrage-wizard') || document.getElementById('awBody');
    return w ? /außerhalb|ausserhalb/i.test(w.innerText) : false;
  });
  pruef('Keine Absage im Bedienfeld', !wort, 'sauber');
} else {
  const a = await tippe('56410', 'Montabaur');
  pruef('Montabaur: Hinweis erscheint', a.sichtbar, a.text.slice(0, 54));
  pruef('Der Ort wird genannt', /Montabaur/.test(a.text), 'Ortsname im Text');
  const b = await tippe('56422', 'Dernbach');
  pruef('Der eigene Standort liegt im Gebiet', b.sichtbar, b.text.slice(0, 40));
  const c = await tippe('65549', 'Limburg');
  pruef('Limburg: Hinweis erscheint', c.sichtbar, c.text.slice(0, 40));
  const r = await tippe('53604', 'Bad Honnef');
  pruef('Randlage Bad Honnef: Hinweis erscheint ebenfalls', r.sichtbar, r.text.slice(0, 40));
  const d = await tippe('20095', 'Hamburg');
  pruef('Hamburg: KEIN Hinweis und keine Absage', !d.sichtbar, 'nichts angezeigt');
  const m = await tippe('56766', 'Ulmen');
  pruef('Ulmen (rund 85 km): KEIN Hinweis', !m.sichtbar, 'nichts angezeigt');
  const e = await tippe('123', 'Unfertig');
  pruef('Unvollstaendige PLZ: kein Hinweis', !e.sichtbar, 'nichts behauptet');
  const f = await seite.evaluate(() => {
    const w = document.querySelector('.anfrage-wizard') || document.getElementById('awBody');
    return w ? /außerhalb|ausserhalb/i.test(w.innerText) : false;
  });
  pruef('Nie eine Absage im Bedienfeld', !f, 'kein „außerhalb" im Assistenten');
  pruef('Kein Javascript-Fehler', konsole.length === 0,
    konsole.length ? konsole[0].slice(0, 50) : 'Konsole still');
}

await browser.close();
console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
