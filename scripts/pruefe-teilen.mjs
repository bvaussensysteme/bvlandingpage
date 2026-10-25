#!/usr/bin/env node
/* Prueft den Teilen-Link des Konfigurators – im echten Browser.
 *
 * ANLASS. „Ich will auch einen Teilen Button und dann so wie hier nur in
 * meinem Design das man nen link bekommt und diesen kann man dann
 * aufrufen um die konfiguration wieder zu sehen bzw. nochmal bearbeitet
 * etc." (Betreiber, 25.10.2026).
 *
 * WARUM IM BROWSER: Der Link ist nur dann etwas wert, wenn ein FREMDER
 * Aufruf dieselbe Planung zeigt. Das laesst sich nicht am Code ablesen –
 * es muss einmal durchlaufen: planen, teilen, Link in einem neuen Tab
 * oeffnen, Feld fuer Feld vergleichen. Genau das passiert hier.
 *
 * Beim ersten Durchlauf hat diese Pruefung zwei echte Fehler gefunden:
 * die Masse kamen als Produktvorgabe zurueck (aendern() ruft beim
 * Produktwechsel masseSetzen()), und der Unterzug wurde an der alten
 * Reglergrenze gekappt. Beides ist im Code begruendet behoben.
 *
 * Aufruf:  node scripts/pruefe-teilen.mjs [--gegenprobe]
 *
 * --gegenprobe verfaelscht den Link (ein Zeichen im Code getauscht) und
 * erwartet, dass die Wiederherstellung FEHLSCHLAEGT und der Besucher es
 * gesagt bekommt – eine Pruefung, die auch kaputte Links durchwinkt,
 * prueft nichts.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const gegen = process.argv.includes('--gegenprobe');
let fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

const browser = readdirSync('/opt/pw-browsers')
  .filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const PORT = 8831;
const srv = spawn('python3', ['-m', 'http.server', String(PORT)],
                  { cwd: process.cwd(), stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise(r => setTimeout(r, 900));

const b = await chromium.launch({
  executablePath: `/opt/pw-browsers/${browser}/chrome-linux/chrome`,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 1000, height: 780 } });

const seitenfehler = [];
async function oeffnen(url) {
  const p = await ctx.newPage();
  p.on('pageerror', e => seitenfehler.push(String(e)));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ })
         .first().click({ timeout: 4000 }).catch(() => {});
  await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
  await p.$eval('#k3dModus', el => el.click());
  await p.waitForTimeout(1200);
  return p;
}
const lesen = (p) => p.evaluate(() => {
  const f = {};
  document.querySelectorAll('input[id^=k3d], select[id^=k3d]').forEach(e => {
    /* Werkzeuge, keine Einstellungen – genau die, die auch nicht in den
       Link gehoeren. k3dTeilenLink ZEIGT den Link; stuende er im Link,
       wuerde der sich bei jedem Teilen verdoppeln. */
    if (e.id === 'k3dRalSuchFeld' || e.id === 'k3dTeilenLink') return;
    f[e.id.slice(3)] = (e.type === 'checkbox') ? (e.checked ? 1 : 0) : e.value;
  });
  const fa = document.querySelector('[data-k3d-farbe][aria-pressed="true"], [data-k3d-farbe].is-active');
  const seg = {};
  document.querySelectorAll('[data-k3d-seg]').forEach(g => {
    const a = g.querySelector('button[aria-pressed="true"], button.is-active');
    seg[g.getAttribute('data-k3d-seg')] = a ? a.getAttribute('data-wert') : null;
  });
  return { f, farbe: fa ? fa.getAttribute('data-k3d-farbe') : null, seg };
});
const setz = (p, id, w) => p.evaluate(([i, v]) => {
  const e = document.getElementById(i);
  e.value = v;
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
}, [id, w]);

const p1 = await oeffnen(`http://localhost:${PORT}/konfigurator.html`);
await p1.$eval('[data-k3d-seg="k3dStufe"] button[data-wert="Pro"]', el => el.click());
await p1.waitForTimeout(400);
await p1.evaluate(() => document.querySelectorAll('details.k3d-sek')
                          .forEach(d => { d.open = true; }));

/* Eine Planung, die sich in jeder Hinsicht von der Vorgabe unterscheidet:
   anderes Produkt, andere Masse, Sonderfarbe, andere Eindeckung,
   Bodengefaelle, Dachvorsprung. */
await p1.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Carport"]').catch(() => {});
await p1.waitForTimeout(900);
await p1.selectOption('#k3dCpTyp', 'Carport TDS').catch(() => {});
await p1.waitForTimeout(900);
for (const [id, w] of [['k3dBreite', '6210'], ['k3dTiefe', '7000'],
                       ['k3dHoehe', '2650'], ['k3dBodenGefaelle', '6'],
                       ['k3dVorsprungHinten', '550']]) await setz(p1, id, w);
await p1.click('[data-k3d-farbe="Andere / Beratung"]').catch(() => {});
await p1.waitForTimeout(400);
await setz(p1, 'k3dRalCode', '8014');
await p1.click('[data-k3d-seg="k3dEindeckung"] button[data-wert="VSG opal"]').catch(() => {});
await p1.waitForTimeout(1400);
const vorher = await lesen(p1);

pruefe('Der Teilen-Knopf steht in der Werkzeugleiste',
       await p1.locator('#k3dTeilen').isVisible(), 'neben „Bild speichern"');
await p1.$eval('#k3dTeilen', el => el.click());
await p1.waitForTimeout(700);
pruefe('Der Dialog geht auf',
       await p1.locator('#k3dTeilenDialog').isVisible(), '');

let link = await p1.$eval('#k3dTeilenLink', e => e.value);
/* Der Link darf sich nicht selbst enthalten: Beim ersten Anlauf stand
   das Feld k3dTeilenLink mit im Zustand, und jedes Teilen verdoppelte
   die Laenge (im Link des Betreibers vom 25.10.2026 steckte ein
   vollstaendiger zweiter Link). */
{
  const roh = JSON.parse(Buffer.from(
    link.slice(link.indexOf('#k=') + 3).replace(/-/g, '+').replace(/_/g, '/'),
    'base64').toString('utf8'));
  const felder = Object.keys(roh.f || {});
  pruefe('Der Link enthält sich nicht selbst',
         !felder.includes('TeilenLink') &&
         !JSON.stringify(roh).includes('#k='),
         felder.length + ' Felder, kein zweiter Link darin');
}
pruefe('Der Link trägt die Planung selbst',
       link.includes('#k=') && link.length > 120 && link.length < 1600,
       link.length + ' Zeichen, nichts gespeichert, kein Dienst Dritter');

const wa = await p1.$eval('#k3dTeilenWa', e => e.href);
const mail = await p1.$eval('#k3dTeilenMail', e => e.href);
pruefe('WhatsApp- und E-Mail-Weg führen denselben Link mit',
       wa.startsWith('https://wa.me/?text=') &&
       wa.includes(encodeURIComponent('#k=')) &&
       mail.startsWith('mailto:?subject=') &&
       mail.includes(encodeURIComponent('#k=')), '');
pruefe('Der PDF-Knopf steht im Dialog',
       await p1.locator('#k3dTeilenPdf').isVisible(), 'ruft dieselbe Erzeugung wie das Bildmenü');

/* ---------- Kurzlink ----------
   „die links sind riesig, besser nen kurzlink wie bei bitly" (Betreiber,
   25.10.2026). Der kurze kommt vom eigenen Worker. Hier laeuft kein
   Worker, also wird zuerst geprueft, dass das NICHTS kaputt macht, und
   danach die Antwort des Servers nachgestellt. */
await p1.waitForTimeout(1500);
{
  const stand = await p1.$eval('#k3dTeilenStand', e => e.textContent);
  const immernoch = await p1.$eval('#k3dTeilenLink', e => e.value);
  pruefe('Ohne Kurzlink-Server bleibt der lange Link stehen',
         immernoch.includes('#k=') && /funktioniert immer/.test(stand),
         'und der Hinweis sagt es');
}
await ctx.route('**/api/teilen', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, id: 'K7M2QX' })
}));
await p1.$eval('#k3dTeilen', el => el.click());      // zu
await p1.$eval('#k3dTeilen', el => el.click());      // und wieder auf
await p1.waitForTimeout(1600);
{
  const kurz = await p1.$eval('#k3dTeilenLink', e => e.value);
  const wa2 = await p1.$eval('#k3dTeilenWa', e => e.href);
  const mail2 = await p1.$eval('#k3dTeilenMail', e => e.href);
  const stand = await p1.$eval('#k3dTeilenStand', e => e.textContent);
  pruefe('Antwortet der Server, steht der Kurzlink im Feld',
         /\/k\/K7M2QX$/.test(kurz) && kurz.length < 70 &&
         wa2.includes(encodeURIComponent('/k/K7M2QX')) &&
         mail2.includes(encodeURIComponent('/k/K7M2QX')) &&
         /Kurzlink von bv-aussensysteme/.test(stand),
         kurz + ' (' + kurz.length + ' Zeichen statt ' + link.length + ')');
}
await ctx.unroute('**/api/teilen');

if (gegen) {
  /* Ein Zeichen im Code tauschen: Der Link muss dann als unlesbar
     erkannt werden, nicht halb angewandt. */
  const i = link.indexOf('#k=') + 8;
  link = link.slice(0, i) + (link[i] === 'A' ? 'B' : 'A') + link.slice(i + 1);
}

/* Der entscheidende Teil: Link in einem FRISCHEN Tab aufrufen. */
let gemeldet = false;
const p2 = await ctx.newPage();
p2.on('dialog', d => { gemeldet = true; d.dismiss().catch(() => {}); });
p2.on('pageerror', e => seitenfehler.push(String(e)));
await p2.goto(link, { waitUntil: 'networkidle' });
await p2.waitForTimeout(2200);
await p2.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ })
        .first().click({ timeout: 4000 }).catch(() => {});
await p2.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await p2.$eval('#k3dModus', el => el.click());
await p2.waitForTimeout(1800);
const nachher = await lesen(p2);

/* Der Unterzug wird aus der Tiefe gerechnet und liegt auf der
   Schrittweite des Reglers – ein Millimeter Unterschied ist die
   Rundung, kein Fehler. */
const TOLERANZ = { Unterzug: 2, UnterzugZahl: 2 };
const abw = Object.keys(vorher.f).filter(k => {
  const a = vorher.f[k], c = nachher.f[k];
  if (String(a) === String(c)) return false;
  const t = TOLERANZ[k];
  if (t && isFinite(+a) && isFinite(+c) && Math.abs(+a - +c) <= t) return false;
  return true;
});
const segAbw = Object.keys(vorher.seg).filter(k => vorher.seg[k] !== nachher.seg[k]);

if (gegen) {
  pruefe('Ein verfälschter Link wird erkannt und gemeldet',
         gemeldet && abw.length > 0,
         gemeldet ? 'Hinweis kam, ' + abw.length + ' Felder auf Grundeinstellung'
                  : 'KEIN Hinweis – der Besucher sähe stillschweigend etwas anderes');
} else {
  pruefe('Alle ' + Object.keys(vorher.f).length +
         ' Einstellungen kommen über den Link zurück',
         abw.length === 0,
         abw.length ? abw.slice(0, 6).join(' | ') : 'Feld für Feld verglichen');
  pruefe('Die Knopfreihen zeigen denselben Stand',
         segAbw.length === 0,
         segAbw.length ? segAbw.join(', ') : Object.keys(vorher.seg).length + ' Reihen');
  pruefe('Die Farbe kommt mit',
         vorher.farbe === nachher.farbe,
         String(vorher.farbe) + ' → ' + String(nachher.farbe));
  pruefe('Kein Hinweis auf einen kaputten Link',
         !gemeldet, 'ein gültiger Link darf nichts melden');
}
pruefe('Keine Fehler im Browser',
       seitenfehler.length === 0,
       seitenfehler.slice(0, 1).join('') || 'keine');

await b.close();
/* Die Gegenprobe dieses Skripts verfaelscht EINEN Link statt jede
   Pruefung einzeln – deshalb heisst bestanden hier: der verfaelschte
   Link wurde erkannt und gemeldet. Ein „x von y angeschlagen" waere
   an dieser Stelle irrefuehrend. */
console.log(gegen
  ? '\nGegenprobe: ' + (fehler
      ? 'FEHLGESCHLAGEN – ein verfälschter Link kam durch'
      : 'bestanden – der verfälschte Link wurde erkannt und gemeldet')
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
/* In der Gegenprobe wird nur EIN Fall verfaelscht (der Link selbst);
   die uebrigen Pruefungen pruefen den Dialog und muessen weiter
   bestehen. Deshalb hier: fehlerfrei heisst bestanden, und der
   verfaelschte Fall muss ok gemeldet haben. */
process.exit(fehler ? 1 : 0);
