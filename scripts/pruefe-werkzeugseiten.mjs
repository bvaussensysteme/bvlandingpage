#!/usr/bin/env node
/* Prueft den Weg vom Rechnerergebnis zum Vorhaben auf den beiden
 * Werkzeugseiten: /windzonen und /baugenehmigung.
 *
 * ANLASS. In der eigenen Statistik ist /windzonen die Seite, die
 * BENUTZT wird: 11 Klicks auf 8 Aufrufe (dreimal „Standort ermitteln",
 * dreimal „Ausrechnen"), und sie ist die einzige Seite, von der aus
 * jemand auf „Jetzt anfragen" ging. Gefehlt hat der Schritt danach:
 * Zwischen dem Ergebnis und dem Knopf stand kein Satz, der sagt, was
 * die Zahl mit einer Ueberdachung zu tun hat, und zu den Produkten
 * fuehrte von dort gar kein Weg.
 *
 * ACHT AUFRUFE TRAGEN KEINE STATISTIK - das steht hier ausdruecklich.
 * Dass die Seite ein Werkzeug ist, ist aber an jedem einzelnen Klick
 * abzulesen, nicht aus einem Durchschnitt gerechnet.
 *
 * GEPRUEFT WIRD IM BROWSER, nicht im Quelltext: Der Block darf erst
 * NACH einem Ergebnis sichtbar sein - ein Weg, der schon vor der
 * Eingabe dasteht, fuehrt ins Leere.
 *
 * Aufruf:  node scripts/pruefe-windzonen-weg.mjs [--gegenprobe]
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8789;

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
  const l = o[o.length - 1];
  return l ? chromeIn(`${basis}/${l}`) : undefined;
}

/* Fehler, die man beim Bauen wirklich macht. */
const FEHLER = [
  ['Der Weg zu den Produkten faellt weg',
   '<a href="/produkte/terrassenueberdachung.html" class="btn btn-outline-white"', '<a hidden'],
  ['Der erklaerende Satz faellt weg',
   'Was heißt das für Ihr Vorhaben?', 'Ergebnis.'],
  ['Der Block steht schon vor dem Ergebnis da',
   '.wz-results.visible { display: block; }',
   '.wz-results { display: block !important; }'],
  /* MIT WIRKUNG, nicht nur mit geaenderter Zahl (04.11.2026): Die
     Hoehe der Knoepfe kommt aus Polsterung und Zeilenhoehe, nicht aus
     min-height. Ein Fehler, der nur die 46 auf 20 setzt, aendert
     nichts - die Gegenprobe hat das gemeldet. */
  ['Der ganze Block faellt weg', '<div class="wz-weiter">', '<div class="wz-weiter" hidden>'],
  ['Der Querverweis auf den Genehmigungs-Check faellt weg',
   '<a href="/baugenehmigung.html">Brauche ich eine Baugenehmigung?</a>',
   'Brauche ich eine Baugenehmigung?'],
  ['Der Weg zur Anfrage faellt weg',
   '<a href="/#kontakt" class="btn btn-gold">Kostenlos beraten lassen</a>',
   '<span class="btn btn-gold">Kostenlos beraten lassen</span>'],
  ['Die Knoepfe sind am Handy wieder zu klein',
   '.wz-weiter-knoepfe .btn { min-height: 46px; display: inline-flex; align-items: center; }',
   '.wz-weiter-knoepfe .btn { min-height:0; padding:0; font-size:9px; line-height:1; }'],
  /* ---------- Genehmigungs-Check ---------- */
  ['Der Genehmigungs-Check verweist nicht mehr auf die Lastzonen',
   '<a href="/windzonen.html">Welche Wind- und Schneelast gilt bei mir?</a>',
   'Welche Wind- und Schneelast gilt bei mir?'],
  ['Der Weg weiter steht beim Genehmigungs-Check schon vor dem Ergebnis',
   '.bg-results.visible { display: block; }', '.bg-results { display: block !important; }'],
  ['Beim Genehmigungs-Check faellt der Weg weiter ganz weg',
   '<p class="bg-weiter-naechste">', '<p class="bg-weiter-naechste" hidden>'],
  /* GANZER SATZ, nicht nur der erste Verweis (04.11.2026): Dort stehen
     drei Produktverweise nebeneinander. Ein Fehler, der nur einen
     entfernt, laesst die Pruefung gruen - die Gegenprobe hat das
     gemeldet. */
  ['Vom Genehmigungs-Check fuehrt kein Weg zu den Produkten',
   '<a href="/produkte/terrassenueberdachung.html">Terrassenüberdachungen</a>,\n          <a href="/produkte/carport.html">Carports</a> und\n          <a href="/produkte/pergola.html">Pergolen</a>.',
   'unsere Produkte.'],
];

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

async function lauf(fehler) {
  const ergebnis = [];
  const p = (name, ok, info = '') => {
    ergebnis.push([name, ok]);
    if (!fehler) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(48) + info);
    if (!ok && fehler) { /* still */ }
  };
  const browser = await chromium.launch({
    timeout: 60000, executablePath: chromiumPfad(),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  /* Handybreite: Dort entscheidet sich, ob die Knoepfe zu treffen sind. */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  if (fehler) {
    await page.route('**/windzonen.html*', async (r) => {
      const a = await r.fetch();
      let t = await a.text();
      t = t.split(fehler[1]).join(fehler[2]);
      await r.fulfill({ response: a, body: t });
    });
  }
  await page.goto(`http://localhost:${PORT}/windzonen.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const sichtbar = () => page.evaluate(() => {
    const e = document.querySelector('.wz-weiter');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return (r.width > 0 && r.height > 0);
  });

  p('Vor dem Ergebnis ist der Weg nicht zu sehen', sichtbar() !== null && !(await sichtbar()),
    'ein Weg vor der Eingabe führt ins Leere');

  /* Ergebnis erzwingen: die Seite zeigt den Block, sobald #wz-results
     sichtbar geschaltet wird - genau das tut wzShowResults(). */
  await page.evaluate(() => {
    const r = document.getElementById('wz-results');
    if (r) r.classList.add('visible');
  });
  await page.waitForTimeout(400);

  p('Nach dem Ergebnis steht der Weg da', !!(await sichtbar()));
  const text = await page.evaluate(() => {
    const e = document.querySelector('.wz-weiter');
    return e ? e.innerText : '';
  });
  p('Der Satz sagt, was die Zahl mit dem Vorhaben zu tun hat',
    /Was heißt das für Ihr Vorhaben/.test(text) && /Pfosten|Sparren|Eindeckung/.test(text),
    text.slice(0, 60).replace(/\n/g, ' '));
  const ziele = await page.$$eval('.wz-weiter a[href]', (n) => n.map((a) => a.getAttribute('href')));
  p('Von hier führt ein Weg zur Anfrage', ziele.some((h) => /#kontakt/.test(h)), ziele.join(' '));
  p('Und ein Weg zu den Produkten',
    ziele.some((h) => /\/produkte\//.test(h)), ziele.join(' '));
  /* Die zweite Frage. Wer seine Last kennt, fragt als Naechstes nach
     der Genehmigung - und umgekehrt. Beide Werkzeuge bedienen
     denselben Besucher in derselben Lage. */
  p('Der Weg zum zweiten Werkzeug steht dabei',
    ziele.some((h) => /baugenehmigung/.test(h)), ziele.join(' '));
  const klein = await page.$$eval('.wz-weiter .btn',
    (n) => n.filter((b) => b.getBoundingClientRect().height < 44).length);
  p('Am Handy sind die Knöpfe mit dem Daumen zu treffen', klein === 0,
    klein ? klein + ' Knöpfe unter 44 px hoch' : 'alle mindestens 44 px hoch');

  /* ---------- Zweite Werkzeugseite: der Genehmigungs-Check ----------
     Derselbe Besucher in derselben Lage, dieselbe Frage danach.
     Geprueft wird hier nur der Weg weiter - den Rechner selbst prueft
     scripts/pruefe-lbo-daten.js. */
  const bgSeite = await ctx.newPage();
  bgSeite.setDefaultTimeout(15000);
  if (fehler) {
    await bgSeite.route('**/baugenehmigung.html*', async (r) => {
      const a = await r.fetch();
      let t = await a.text();
      t = t.split(fehler[1]).join(fehler[2]);
      await r.fulfill({ response: a, body: t });
    });
  }
  await bgSeite.goto(`http://localhost:${PORT}/baugenehmigung.html`, { waitUntil: 'load' });
  await bgSeite.waitForTimeout(900);
  const bgSichtbar = () => bgSeite.evaluate(() => {
    const e = document.querySelector('.bg-weiter-naechste');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return (r.width > 0 && r.height > 0);
  });
  p('Genehmigungs-Check: vor dem Ergebnis kein Weg weiter',
    (await bgSichtbar()) === false, 'erst nach der Auskunft');
  await bgSeite.evaluate(() => {
    const r = document.getElementById('bg-results');
    if (r) r.classList.add('visible');
  });
  await bgSeite.waitForTimeout(300);
  p('Genehmigungs-Check: nach dem Ergebnis steht er da', !!(await bgSichtbar()));
  const bgZiele = await bgSeite.$$eval('.bg-weiter-naechste a[href]',
    (n) => n.map((a) => a.getAttribute('href')));
  p('Genehmigungs-Check verweist auf die Lastzonen',
    bgZiele.some((h) => /windzonen/.test(h)), bgZiele.join(' '));
  p('Genehmigungs-Check führt zu den Produkten',
    bgZiele.some((h) => /\/produkte\//.test(h)), bgZiele.join(' '));

  await browser.close();
  return ergebnis;
}

if (!GEGEN) {
  const e = await lauf(null);
  const schlecht = e.filter(([, ok]) => !ok).length;
  console.log(`\nErgebnis: ${e.length - schlecht} bestanden, ${schlecht} nicht bestanden`);
  server.kill();
  process.exit(schlecht ? 1 : 0);
} else {
  const gut = await lauf(null);
  if (gut.some(([, ok]) => !ok)) {
    console.log('ABBRUCH: Der normale Lauf ist nicht grün – Gegenprobe sinnlos.');
    server.kill(); process.exit(1);
  }
  const offen = new Set(gut.map(([n]) => n));
  for (const f of FEHLER) {
    const e = await lauf(f);
    const rot = e.filter(([, ok]) => !ok).map(([n]) => n);
    if (!rot.length) {
      console.log(`FEHLER: Eingebauter Fehler "${f[0]}" bleibt unbemerkt.`);
      server.kill(); process.exit(1);
    }
    console.log(`  Fehler "${f[0]}": ${rot.length} Prüfung(en) schlagen an`);
    rot.forEach((n) => offen.delete(n));
  }
  if (offen.size) {
    console.log('FEHLER: Diese Prüfungen wurden von keinem Fehler rot:');
    offen.forEach((n) => console.log('   ' + n));
    server.kill(); process.exit(1);
  }
  console.log('\nGegenprobe in Ordnung: jede Prüfung schlägt an.');
  server.kill(); process.exit(0);
}
