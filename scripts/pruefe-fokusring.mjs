#!/usr/bin/env node
/* ============================================================
   IST DER FOKUSRING UEBERHAUPT ZU SEHEN?

   WCAG 2.2, Erfolgskriterium 2.4.7 "Fokus sichtbar", Stufe AA.

   ANLASS (21.11.2026). Beim Einbau der Schaltflaechen in der
   Referenzgalerie fiel auf, dass der neue Fokusring im Browser gar
   nicht erschien. Gemessen statt geraten: Er lag 3 px AUSSERHALB
   der Kachel, und die Kachel hat overflow: hidden. Der Ring war
   vollstaendig weggeschnitten.

   Dieselbe Ursache traf 19 weitere Stellen: css/start.css setzt
   ".start-premium :focus-visible { outline-offset: 3px }" fuer die
   ganze Startseite. Diese Regel hat dieselbe Spezifitaet (0,2,0) wie
   die Regeln einzelner Bauteile in style.css, wird aber spaeter
   geladen und gewinnt. Wo ein Bauteil bewusst -3px gesetzt hatte,
   weil es in einem Kasten mit overflow: hidden sitzt, stand der Ring
   wieder aussen. Gemessen: 19 von 19 Fragen der Fragenliste auf
   index.html ohne sichtbaren Ring. Nach der Korrektur: 0.

   WARUM EIN EIGENES SKRIPT. pruefe-fokus-verdeckung.mjs prueft
   2.4.11: Liegt etwas Festes UEBER dem fokussierten Element? Das ist
   eine andere Frage. Hier geht es darum, ob der Ring vom eigenen
   Kasten abgeschnitten wird. Beide Pruefungen waren gruen, waehrend
   20 Ringe unsichtbar waren.

   WIE GEMESSEN WIRD. Ein Ring sitzt zwischen outline-offset und
   outline-offset + outline-width ausserhalb des Elements. Fuer jeden
   Vorfahren, der beschneidet (overflow hidden/clip/auto/scroll),
   wird der Abstand bis zu seiner Kante genommen. Bleibt auf einer
   Seite mehr Luft als der Abstand, ist dort etwas zu sehen. Ist auf
   KEINER der vier Seiten etwas zu sehen, ist der Ring weg.

   Ein Ring mit negativem Abstand liegt innen und kann so nicht
   abgeschnitten werden; er wird uebersprungen.

   Aufruf:     node scripts/pruefe-fokusring.mjs
   Gegenprobe: node scripts/pruefe-fokusring.mjs --gegenprobe
   Die Gegenprobe schiebt die Ringe der Fragenliste wieder nach
   aussen, genau wie vor der Korrektur. Dann MUSS es auffallen.
   ============================================================ */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8904;

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

const WURZEL = new URL('..', import.meta.url).pathname;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: WURZEL, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(46)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(46)} ${beleg || ''}`); }
}

/* Laeuft IM Browser. Gibt das fokussierte Element zurueck, wenn von
   seinem Ring nichts zu sehen ist. */
const MESSUNG = () => {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  const s = getComputedStyle(a);
  const breite = parseFloat(s.outlineWidth) || 0;
  if (s.outlineStyle === 'none' || breite === 0) {
    /* Kein Ring heisst nicht automatisch kein Fokus: Manche
       Bedienelemente zeigen ihn ueber Hintergrund oder Schatten.
       Das kann diese Pruefung nicht beurteilen, also meldet sie es
       getrennt. */
    const schatten = s.boxShadow && s.boxShadow !== 'none';
    return schatten ? null : { ohneRing: true,
      element: a.tagName.toLowerCase() + '.' + (a.className || '').toString().split(' ')[0] };
  }
  const abstand = parseFloat(s.outlineOffset) || 0;
  if (abstand < 0) return null;
  const r = a.getBoundingClientRect();
  let p = a.parentElement;
  const luft = { oben: Infinity, links: Infinity, rechts: Infinity, unten: Infinity };
  while (p && p !== document.documentElement) {
    const ps = getComputedStyle(p);
    if (/hidden|clip|auto|scroll/.test(ps.overflowX + ' ' + ps.overflowY)) {
      const pr = p.getBoundingClientRect();
      luft.oben = Math.min(luft.oben, r.top - pr.top);
      luft.links = Math.min(luft.links, r.left - pr.left);
      luft.rechts = Math.min(luft.rechts, pr.right - r.right);
      luft.unten = Math.min(luft.unten, pr.bottom - r.bottom);
    }
    p = p.parentElement;
  }
  const sichtbar = Object.keys(luft).filter((k) => luft[k] > abstand + 0.5);
  if (sichtbar.length > 0) return null;
  return {
    element: a.tagName.toLowerCase() + '.' + (a.className || '').toString().split(' ')[0],
    name: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26),
    abstand, breite,
  };
};

const SEITEN = ['index.html', 'kontakt.html', 'produkte/terrassendach-tds.html',
                'terrassenueberdachung-montabaur.html'];

console.log(GEGENPROBE ? 'Gegenprobe: Ringe der Fragenliste wieder nach aussen geschoben'
                       : 'Fokusring sichtbar? (WCAG 2.2, 2.4.7)');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
const BASIS = `http://127.0.0.1:${PORT}`;
let gesamtWeg = 0, gesamtOhneRing = 0;

for (const pfad of SEITEN) {
  /* Eigener Kontext je Seite: ein wiederverwendeter Tab schleppt den
     Fokus der vorigen Seite mit, und dann misst man Gespenster. Genau
     das ist beim ersten Messen am 21.11.2026 passiert. */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const seite = await ctx.newPage();
  await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
  await seite.goto(`${BASIS}/${pfad}`, { waitUntil: 'domcontentloaded' });
  await seite.waitForTimeout(700);

  if (GEGENPROBE) {
    await seite.addStyleTag({ content:
      '.start-premium .faq-q:focus-visible, .faq-q:focus-visible { outline-offset: 3px !important; }' });
  }

  const weg = new Set(), ohneRing = new Set();
  for (let i = 0; i < 110; i++) {
    await seite.keyboard.press('Tab');
    await seite.waitForTimeout(20);
    const b = await seite.evaluate(MESSUNG);
    if (!b) continue;
    if (b.ohneRing) ohneRing.add(b.element);
    else weg.add(`${b.element} "${b.name}"`);
  }
  gesamtWeg += weg.size;
  gesamtOhneRing += ohneRing.size;
  pruef(`${pfad}: jeder Ring ist zu sehen`, weg.size === 0,
    weg.size ? [...weg].slice(0, 3).join(' | ') + (weg.size > 3 ? ` (+${weg.size - 3})` : '')
             : 'kein abgeschnittener Ring');
  if (ohneRing.size) {
    console.log(`          Hinweis: ${ohneRing.size} Element(e) ohne Ring und ohne Schatten: ` +
      [...ohneRing].slice(0, 3).join(', '));
  }
  await ctx.close();
}

/* ============================================================
   BILDERSTREIFEN: der Ring muss an ALLEN VIER Seiten zu sehen sein.

   ANLASS (22.11.2026). Die Pruefung oben laesst einen Ring
   durchgehen, sobald er auf EINER Seite zu sehen ist. Beim
   Stoffstreifen der Startseite war er nur rechts und unten zu
   sehen: overflow-x: auto macht overflow-y automatisch zu "auto",
   und der Streifen hatte oben und links 0 Innenabstand. Der
   Bildschirmabzug zeigte eine halb umrandete Kachel. Gruen war die
   Pruefung trotzdem.

   Hier wird deshalb die erste Kachel JEDES Streifens angesteuert
   und jede der vier Seiten einzeln gemessen. Nicht ueber die
   Tabulatortaste: Mit 53 Kacheln auf der Startseite kaeme die
   Schleife oben gar nicht mehr bis zum Seitenende.
   ============================================================ */
const STREIFEN_SEITEN = ['index.html', 'produkte/carport.html'];
for (const pfad of STREIFEN_SEITEN) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const seite = await ctx.newPage();
  await seite.route('**', (r) => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
  await seite.goto(`${BASIS}/${pfad}`, { waitUntil: 'domcontentloaded' });
  await seite.waitForTimeout(700);
  if (GEGENPROBE) {
    /* Gegenprobe: dem Streifen den Innenabstand wieder nehmen. Dann
       MUSS die Messung oben und links anschlagen. */
    await seite.addStyleTag({ content: '.galerie-streifen { padding: 0 0 10px !important; margin: 0 !important; }' });
    await seite.waitForTimeout(150);
  }
  /* :focus-visible setzt einen echten Tastendruck voraus. */
  await seite.keyboard.press('Tab');
  await seite.waitForTimeout(60);
  const befund = await seite.evaluate(() => {
    const aus = [];
    document.querySelectorAll('.galerie-streifen').forEach((s) => {
      const k = s.querySelector('.galerie-kachel');
      if (!k) return;
      k.focus();
      const st = getComputedStyle(k);
      const abstand = parseFloat(st.outlineOffset) + parseFloat(st.outlineWidth);
      if (!(abstand > 0)) return;
      const r = k.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const luft = { oben: r.top - sr.top, links: r.left - sr.left,
                     rechts: sr.right - r.right, unten: sr.bottom - r.bottom };
      const fehlt = Object.keys(luft).filter((w) => luft[w] < abstand - 0.5);
      aus.push({ id: s.id || s.getAttribute('data-galerie') || 'Streifen',
                 abstand: Math.round(abstand), fehlt });
    });
    return aus;
  });
  befund.forEach((b) => {
    pruef(`${pfad}: Ring der ersten Kachel rundherum zu sehen (${b.id})`,
      b.fehlt.length === 0,
      b.fehlt.length ? 'abgeschnitten: ' + b.fehlt.join(', ') : `${b.abstand} px Platz an allen vier Seiten`);
  });
  if (!befund.length) pruef(`${pfad}: Streifen gefunden`, false, 'kein .galerie-streifen auf der Seite');
  await ctx.close();
}

if (GEGENPROBE) {
  pruef('Die herausgeschobenen Ringe fallen auf', gesamtWeg > 0,
    `${gesamtWeg} Stelle(n) ohne sichtbaren Ring`);
}

await browser.close();
const echteFehler = GEGENPROBE ? (gesamtWeg > 0 ? 0 : 1) : fehler;
console.log(`\nErgebnis: ${echteFehler === 0
  ? (GEGENPROBE ? 'die Gegenprobe faellt auf' : `alle ${geprueft} Prüfungen bestanden`)
  : `${echteFehler} Prüfung(en) fehlgeschlagen`}`);
process.exit(echteFehler === 0 ? 0 : 1);
