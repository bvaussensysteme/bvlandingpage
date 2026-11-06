#!/usr/bin/env node
/* Prueft die Broschuerenseite /broschuere.html im Browser.
 *
 * WARUM IM BROWSER. Die Seite besteht fast nur aus Verhalten: 36
 * Bilder, von denen beim Start absichtlich nur zwei geladen sind, ein
 * Buch, das eine Bibliothek erst zur Laufzeit aufschlaegt, und eine
 * Bedienleiste, deren Knoepfe erst dann etwas tun. Im Quelltext ist
 * davon nichts zu sehen - deshalb wird hier geklickt, geblaettert und
 * gezaehlt, nicht gegrept.
 *
 * WAS BESONDERS WICHTIG IST
 *  - REIHENFOLGE. Eine Broschuere mit vertauschten Seiten ist
 *    schlimmer als keine. Geprueft wird die Liste der 36 Adressen in
 *    der Seite; dass jedes Bild auch die richtige PDF-Seite ZEIGT,
 *    prueft auf einem anderen Weg scripts/pruefe-broschuere-bilder.sh.
 *  - KEIN FREMDANBIETER. Die Bibliothek liegt lokal unter /assets/js/.
 *    Ginge beim Aufruf irgendetwas nach aussen, waere das ein
 *    Datenschutzproblem und keine Geschmacksfrage. Darum wird jede
 *    Netzanfrage mitgeschrieben und auf fremde Hosts geprueft.
 *  - DER WEG OHNE JAVASCRIPT. Wer kein JavaScript hat, muss trotzdem
 *    an die Broschuere kommen.
 *
 * Aufruf:  node scripts/pruefe-broschuere.mjs [--gegenprobe]
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8794;
const ANZAHL = 36;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const l = o[o.length - 1];
  return l ? `${basis}/${l}/chrome-linux/chrome` : undefined;
}
const nn = (i) => (i < 10 ? '0' : '') + i;

/* Fehler, die man beim Bauen wirklich macht.
   muster = URL, die umgeschrieben wird; suchen/ersetzen im Text,
   oder status fuer eine Datei, die plötzlich fehlt. */
const FEHLER = [
  { name: 'Die Beschreibung fehlt', muster: '**/broschuere.html*',
    suchen: '<meta name="description"', ersetzen: '<meta name="beschreibung"' },
  { name: 'Das Open-Graph-Bild zeigt ins Leere', muster: '**/broschuere.html*',
    suchen: '/assets/broschuere/og-broschuere.jpg', ersetzen: '/assets/broschuere/gibtsnicht.jpg' },
  { name: 'Zwei Seiten sind vertauscht', muster: '**/broschuere.html*',
    suchen: 'seite-05.webp', ersetzen: 'seite-06.webp' },
  { name: 'Alle 36 Bilder werden sofort geladen', muster: '**/broschuere.html*',
    suchen: 'data-src="/assets/broschuere/seite-', ersetzen: 'src="/assets/broschuere/seite-' },
  { name: 'Ein Fremdanbieter steht wieder in der Seite', muster: '**/broschuere.html*',
    suchen: '<div id="broBuch" class="bro-buch">',
    ersetzen: '<img src="https://beispiel-fremd.invalid/zaehler.gif" alt="" /><div id="broBuch" class="bro-buch">' },
  { name: 'Die Bibliothek laedt nicht', muster: '**/page-flip.browser.js*', suchen: null, status: 200, leer: true },
  { name: 'Die Seitenzahl ist falsch gerechnet', muster: '**/js/broschuere.js*',
    suchen: 'var ANZAHL = 36;', ersetzen: 'var ANZAHL = 30;' },
  { name: 'Der Weiter-Knopf ist nicht angeschlossen', muster: '**/broschuere.html*',
    suchen: 'id="broWeiter"', ersetzen: 'id="broWeiterAnders"' },
  { name: 'Die Pfeiltasten blaettern nicht mehr', muster: '**/js/broschuere.js*',
    suchen: "ev.key === 'ArrowRight'", ersetzen: "ev.key === 'ArrowRechts'" },
  { name: 'Es werden keine Bilder nachgeladen', muster: '**/js/broschuere.js*',
    suchen: 'for (var i = nr - 2; i <= nr + 3; i++)', ersetzen: 'for (var i = nr; i < nr; i++)' },
  { name: 'Die Seitenuebersicht zeigt zu wenige Seiten', muster: '**/js/broschuere.js*',
    suchen: 'for (var i = 1; i <= ANZAHL; i++) {', ersetzen: 'for (var i = 1; i <= 10; i++) {' },
  { name: 'Der Sprung aus der Uebersicht geht nicht', muster: '**/js/broschuere.js*',
    suchen: 'buch.turnToPage(ziel - 1)', ersetzen: 'buch.turnToSeite(ziel - 1)' },
  { name: 'Der Zoom vergroessert nicht', muster: '**/js/broschuere.js*',
    suchen: 'var STUFEN = [1, 1.5, 2.5, 4];', ersetzen: 'var STUFEN = [1, 1, 1, 1];' },
  { name: 'Der Vollbild-Knopf fehlt', muster: '**/broschuere.html*',
    suchen: 'id="broVollbild"', ersetzen: 'id="broVollbildAnders"' },
  { name: 'Das PDF fehlt', muster: '**/BV-Broschuere.pdf', suchen: null, status: 404 },
  { name: 'Ein Seitenbild fehlt', muster: '**/seite-07.webp', suchen: null, status: 404 },
  { name: 'Ohne JavaScript fuehrt kein Weg zum PDF', muster: '**/broschuere.html*',
    suchen: '<a href="/assets/broschuere/BV-Broschuere.pdf">\n            <img src="/assets/broschuere/vorschau/seite-01.webp"',
    ersetzen: '<a href="/">\n            <img src="/assets/broschuere/vorschau/seite-01.webp"' },
  { name: 'Die Knoepfe sind am Handy zu klein', muster: '**/broschuere.html*',
    suchen: 'min-height:44px; min-width:44px; padding:10px 16px;',
    ersetzen: 'min-height:12px; min-width:12px; padding:0; font-size:8px; line-height:1;' },
  { name: 'Am Handy stehen zwei Seiten nebeneinander', muster: '**/js/broschuere.js*',
    suchen: 'usePortrait: true,', ersetzen: 'usePortrait: false,' },
  { name: 'Wischen blaettert nicht mehr', muster: '**/js/broschuere.js*',
    suchen: 'swipeDistance: 15', ersetzen: 'swipeDistance: 9000' },
  { name: 'Das Menue hinter den drei Punkten geht nicht auf', muster: '**/broschuere.html*',
    suchen: 'id="broMehr"', ersetzen: 'id="broMehrAnders"' },
  { name: 'Teilen gibt die falsche Adresse weiter', muster: '**/js/broschuere.js*',
    suchen: 'url: window.location.href', ersetzen: "url: '/assets/broschuere/BV-Broschuere.pdf'" },
  { name: 'Die Navigation fuehrt nicht zur Broschuere', muster: '**/stoffe.html*',
    suchen: '/broschuere.html', ersetzen: '/nirgendwohin.html' },
  { name: 'Die Startseite fuehrt nicht zur Broschuere', muster: '**/index.html*',
    suchen: '/broschuere.html', ersetzen: '/nirgendwohin.html' },
  { name: 'Der Zoom wird wieder vom globalen img-max-width gedeckelt', muster: '**/broschuere.html*',
    suchen: 'flex-shrink:0; max-width:none; }', ersetzen: 'flex-shrink:0; }' },
  { name: 'Das Buch wird breiter als sein Rahmen', muster: '**/js/broschuere.js*',
    suchen: 'minWidth: MIN_SEITE,', ersetzen: 'minWidth: 900,' },
  { name: 'Der Fokus kehrt nicht zum Mehr-Knopf zurueck', muster: '**/js/broschuere.js*',
    suchen: 'if ((fokusZurueck || drin) && knopfMehr.focus) knopfMehr.focus();',
    ersetzen: 'if (false) knopfMehr.focus();' },
  { name: 'Die Schwebe-Knoepfe liegen wieder ueber der Ebene', muster: '**/broschuere.html*',
    suchen: 'body.bro-ebene-offen .sticky-cta { display:none !important; }',
    ersetzen: 'body.bro-ebene-offen .nichts-dergleichen { display:none; }' },
  { name: 'Der Fokus kann die offene Ebene verlassen', muster: '**/js/broschuere.js*',
    suchen: "if (ev.key !== 'Tab') return;", ersetzen: "if (ev.key !== 'TabulatorX') return;" },
  { name: 'Das Buch wird bei jeder Groessenmeldung neu gerechnet', muster: '**/js/broschuere.js*',
    suchen: 'if (breiteGleich && kleineHoehe) return;', ersetzen: 'if (false) return;' },
  { name: 'Bedienflaechen lassen sich wieder markieren', muster: '**/broschuere.html*',
    suchen: '    user-select:none; -webkit-user-select:none; -webkit-touch-callout:none;\n    font-family:inherit;',
    ersetzen: '    font-family:inherit;' },
  { name: 'Am Ende des Katalogs steht nichts', muster: '**/broschuere.html*',
    suchen: 'id="broEnde"', ersetzen: 'id="broEndeWeg"' },
  { name: 'Der Weg zurueck auf Seite 1 fehlt', muster: '**/broschuere.html*',
    suchen: 'id="broVonVorn"', ersetzen: 'id="broVonVornWeg"' },
  { name: 'Der Hinweis nennt am Handy die Pfeiltasten', muster: '**/broschuere.html*',
    suchen: '  .bro-nur-maus { display:none; }', ersetzen: '  .bro-nur-maus { display:inline; }' },
  { name: 'Die Adresse merkt sich die Seite nicht', muster: '**/js/broschuere.js*',
    suchen: "'#seite-' + nr", ersetzen: "''" },
  { name: 'Die Textfassung des Katalogs fehlt', muster: '**/broschuere.html*',
    suchen: 'id="katalogtext"', ersetzen: 'id="katalogtext-weg"' },
  { name: 'Der Zugang zum Katalog rutscht aus dem Hero', muster: '**/index.html*',
    suchen: '<a href="/broschuere.html" class="btn btn-outline-white hero-katalog-btn">',
    ersetzen: '<a href="/woanders.html" class="btn btn-outline-white hero-katalog-btn">' },
  { name: 'Die Broschuere fehlt in der sitemap', muster: '**/sitemap.xml',
    suchen: 'broschuere.html', ersetzen: 'broschuere-weg.html' },
  { name: 'Eine Uebersetzung fehlt', muster: '**/js/i18n.js*',
    suchen: "['Seitenübersicht','Page overview','Обзор страниц'],", ersetzen: '' },
  { name: 'Die Uebersetzungsdatei hat einen Syntaxfehler', muster: '**/js/i18n.js*',
    suchen: 'Das war’s', ersetzen: "Das war's" }
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
    if (!fehler) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(52) + info);
  };

  const browser = await chromium.launch({
    timeout: 60000, executablePath: chromiumPfad(),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });

  async function strecke(seite) {
    if (!fehler) return;
    await seite.route(fehler.muster, async (r) => {
      if (fehler.status === 404) { await r.fulfill({ status: 404, body: '' }); return; }
      if (fehler.leer) { await r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); return; }
      const a = await r.fetch();
      const t = (await a.text()).split(fehler.suchen).join(fehler.ersetzen);
      await r.fulfill({ response: a, body: t });
    });
  }

  /* ---------- Schreibtisch ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const seite = await ctx.newPage();
  seite.setDefaultTimeout(20000);
  const fremd = [];
  seite.on('request', (r) => {
    try {
      const h = new URL(r.url()).hostname;
      if (h !== 'localhost' && h !== '127.0.0.1') fremd.push(r.url());
    } catch (e) {}
  });
  await strecke(seite);
  await seite.goto(`http://localhost:${PORT}/broschuere.html`, { waitUntil: 'load' });
  await seite.waitForTimeout(1500);

  /* Nur was die SEITE selbst anfordert, zaehlt als fremd - die
     Pruefungen weiter unten holen sich absichtlich Dateien nach. */
  const fremdBeimLaden = fremd.slice();

  const titel = await seite.title();
  const beschr = await seite.$eval('meta[name="description"]', (m) => m.content).catch(() => '');
  p('Titel und Beschreibung stehen in der Seite',
    /Produktkatalog/.test(titel) && beschr.length > 50 && /Broschüre|Terrassen/.test(beschr),
    titel.slice(0, 30));

  const og = await seite.$eval('meta[property="og:image"]', (m) => m.content).catch(() => '');
  /* Das Open-Graph-Bild MUSS eine vollstaendige Adresse sein, sonst
     zeigt kein Netzwerk eine Vorschau. Geholt wird hier nur der Pfad,
     damit die Pruefung ohne Netz laeuft. */
  const ogPfad = og ? (() => { try { return new URL(og).pathname; } catch (e) { return ''; } })() : '';
  const ogDa = ogPfad ? await seite.evaluate(async (u) => {
    try { const r = await fetch(u); return r.status; } catch (e) { return 0; }
  }, ogPfad) : 0;
  p('Open-Graph-Bild ist die Titelseite und liegt da',
    /^https:\/\/bv-aussensysteme\.de\/.*og-broschuere\.jpg$/.test(og) && ogDa === 200,
    (og.split('/').pop() || '-') + ' ' + ogDa);

  const adressen = await seite.$$eval('#broBuch .bro-bild',
    (n) => n.map((i) => i.getAttribute('data-src') || i.getAttribute('src') || ''));
  const soll = Array.from({ length: ANZAHL }, (_, k) => '/assets/broschuere/seite-' + ((k + 1 < 10 ? '0' : '') + (k + 1)) + '.webp');
  p('36 Seiten in der richtigen Reihenfolge',
    adressen.length === ANZAHL && adressen.every((a, k) => a === soll[k]),
    adressen.length + ' Seiten');

  const geladenJetzt = () => seite.$$eval('#broBuch .bro-bild',
    (n) => n.filter((i) => i.getAttribute('src')).length);
  const vorher = await geladenJetzt();
  p('Beim Start sind nur wenige Seitenbilder geladen', vorher >= 1 && vorher <= 6,
    vorher + ' von ' + ANZAHL);

  p('Kein Fremdanbieter auf der Seite', fremdBeimLaden.length === 0,
    fremdBeimLaden.length ? fremdBeimLaden[0].slice(0, 50) : 'alles von hier');

  p('Das Buch ist aufgeschlagen', await seite.$('.stf__parent') !== null);

  /* Klicken darf das Skript nicht abbrechen: Ein eingebauter Fehler
     der Gegenprobe blendet Knoepfe absichtlich aus. Dann soll die
     Pruefung ROT werden - nicht der Lauf abstuerzen. */
  const klick = async (ziel, wo = seite) => {
    try { await wo.click(ziel, { timeout: 4000 }); return true; }
    catch (e) { return false; }
  };
  const zaehler = () => seite.$eval('#broZaehler', (e) => e.textContent.trim()).catch(() => '-');
  p('Der Zähler zeigt 1 / 36', (await zaehler()) === '1 / ' + ANZAHL, await zaehler());

  await klick('#broWeiter');
  await seite.waitForTimeout(1300);
  const nachKlick = await zaehler();
  p('Der Weiter-Knopf blättert', nachKlick !== '1 / ' + ANZAHL, nachKlick);

  const vorTaste = await zaehler();
  await seite.keyboard.press('ArrowRight');
  await seite.waitForTimeout(1300);
  const nachTaste = await zaehler();
  p('Die Pfeiltaste rechts blättert', nachTaste !== vorTaste, vorTaste + ' -> ' + nachTaste);

  const nachher = await geladenJetzt();
  p('Nach dem Blättern werden Bilder nachgeladen', nachher > vorher,
    vorher + ' -> ' + nachher);

  await klick('#broUebersicht');
  await seite.waitForTimeout(500);
  const kacheln = await seite.$$eval('#broRaster .bro-raster-knopf', (n) => n.length);
  p('Die Seitenübersicht zeigt 36 Vorschaubilder', kacheln === ANZAHL, kacheln + ' Kacheln');

  await klick('#broRaster .bro-raster-knopf[data-ziel="20"]');
  await seite.waitForTimeout(1200);
  const nachSprung = await zaehler();
  p('Klick in der Übersicht springt zur Seite', /\b20\b/.test(nachSprung), nachSprung);

  await klick('#broZoom');
  await seite.waitForTimeout(400);
  const breite1 = await seite.$eval('#broZoomFlaeche img', (i) => i.getBoundingClientRect().width).catch(() => 0);
  await klick('#broZoomGroesser');
  await seite.waitForTimeout(300);
  const breite2 = await seite.$eval('#broZoomFlaeche img', (i) => i.getBoundingClientRect().width).catch(() => 0);
  p('Der Zoom vergrößert die Seite', breite1 > 0 && breite2 > breite1 + 10,
    Math.round(breite1) + ' -> ' + Math.round(breite2) + ' px');

  /* AUF DIE HOECHSTE STUFE. Hier faellt auf, was die Messung oben
     nicht sieht: style.css setzt global img { max-width:100% }; damit
     blieb das Bild am Fenster haengen und der Zoom tat ab einer
     gewissen Stufe NICHTS mehr (gemessen am Handy: 150 % und 200 %
     ergaben beide 362 px). Deshalb wird hier verlangt, dass das Bild
     BREITER als sein Kasten werden kann und dass der linke Rand nach
     dem Zurueckscrollen erreichbar ist. */
  for (let i = 0; i < 4; i++) { await klick('#broZoomGroesser'); await seite.waitForTimeout(160); }
  const gross = await seite.evaluate(() => {
    const ebene = document.getElementById('broZoomEbene');
    const kasten = ebene.querySelector('.bro-ebene-koerper');
    const bild = ebene.querySelector('#broZoomFlaeche img');
    if (!kasten || !bild) return null;
    kasten.scrollLeft = 0;
    return {
      bild: Math.round(bild.getBoundingClientRect().width),
      kasten: Math.round(kasten.clientWidth),
      linkerRand: Math.round(bild.getBoundingClientRect().left - kasten.getBoundingClientRect().left)
    };
  });
  p('Der Zoom geht über die Fensterbreite hinaus',
    !!gross && gross.bild > gross.kasten + 40,
    gross ? gross.bild + ' px Bild in ' + gross.kasten + ' px Kasten' : 'nichts gemessen');
  p('Der linke Rand der Seite bleibt erreichbar',
    !!gross && gross.linkerRand >= -2,
    gross ? 'linker Rand bei ' + gross.linkerRand + ' px' : '-');

  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(200);

  const vollSichtbar = await seite.$eval('#broVollbild',
    (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).catch(() => false);
  p('Der Vollbild-Knopf ist bedienbar', vollSichtbar === true);

  const pdf = await seite.evaluate(async () => {
    try {
      const r = await fetch('/assets/broschuere/BV-Broschuere.pdf');
      const b = await r.blob();
      return { s: r.status, g: b.size };
    } catch (e) { return { s: 0, g: 0 }; }
  });
  p('Das PDF liegt bereit', pdf.s === 200 && pdf.g > 1000000,
    Math.round(pdf.g / 1024 / 1024 * 10) / 10 + ' MB');

  const liste = [];
  for (let i = 1; i <= ANZAHL; i++) {
    liste.push('/assets/broschuere/seite-' + nn(i) + '.webp');
    liste.push('/assets/broschuere/vorschau/seite-' + nn(i) + '.webp');
  }
  const fehlend = await seite.evaluate(async (ls) => {
    const schlecht = [];
    for (const u of ls) {
      try { const r = await fetch(u); if (r.status !== 200) schlecht.push(u); }
      catch (e) { schlecht.push(u); }
    }
    return schlecht;
  }, liste);
  p('Alle 72 Bilddateien sind abrufbar', fehlend.length === 0,
    fehlend.length ? fehlend.length + ' fehlen: ' + fehlend[0] : '36 Seiten + 36 Vorschauen');

  const ohneJs = await seite.$eval('noscript', (e) => e.textContent).catch(() => '');
  p('Ohne JavaScript bleibt der Weg zum PDF',
    /vorschau\/seite-01\.webp/.test(ohneJs) &&
    /<a href="\/assets\/broschuere\/BV-Broschuere\.pdf">\s*<img/.test(ohneJs),
    ohneJs ? 'Titelbild verweist aufs PDF' : 'kein noscript');

  /* Drei-Punkte-Menue: zuerst zu, nach dem Antippen PDF und Teilen. */
  const menueOffen = () => seite.evaluate(() => {
    const m = document.getElementById('broMehrMenue');
    if (!m) return null;
    const r = m.getBoundingClientRect();
    return { sichtbar: r.width > 0 && r.height > 0, text: m.innerText.replace(/\s+/g, ' ').trim(),
             pdf: !!m.querySelector('a[href$=".pdf"][download]') };
  });
  const vorAuf = await menueOffen();
  await klick('#broMehr');
  await seite.waitForTimeout(350);
  const nachAuf = await menueOffen();
  p('Die drei Punkte öffnen PDF und Teilen',
    !!vorAuf && vorAuf.sichtbar === false && !!nachAuf && nachAuf.sichtbar === true &&
    nachAuf.pdf === true && /Diesen Katalog teilen/.test(nachAuf.text),
    nachAuf ? nachAuf.text.slice(0, 40) : 'kein Menü');

  /* Teilen reicht die Adresse der SEITE weiter, nicht die der Datei.
     navigator.share gibt es im Testbrowser nicht - also wird es
     eingesetzt und mitgeschrieben, was es bekommen haette. */
  await seite.evaluate(() => {
    window.__geteilt = null;
    navigator.share = function (d) { window.__geteilt = d; return Promise.resolve(); };
  });
  await klick('#broTeilen');
  await seite.waitForTimeout(350);
  const geteilt = await seite.evaluate(() => window.__geteilt);
  const istSeite = await zaehler();
  const nrJetzt = parseInt(String(istSeite).replace(/[^0-9].*$/, ''), 10);
  p('Teilen gibt die Adresse der Seite weiter – mitsamt Seitenzahl',
    !!geteilt && /\/broschuere\.html(#seite-\d+)?$/.test(String(geteilt.url || '')) &&
    (nrJetzt <= 1 || String(geteilt.url).endsWith('#seite-' + nrJetzt)),
    geteilt ? String(geteilt.url).replace(/^https?:\/\/[^/]+/, '') + ' bei ' + istSeite : 'nichts geteilt');
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(200);

  /* DAS ENDE. Wer bis zur Rueckseite blaettert, hat Interesse - dort
     darf keine Sackgasse stehen (Peak-End-Regel). Vorher aber auch
     nicht: sonst waere es Beiwerk.
     Eigene Seite statt Weiterklicken: So haengt die Pruefung nicht an
     dem, was die Pruefungen davor im Fenster hinterlassen haben. */
  const endeVorher = await seite.evaluate(() => {
    const e = document.getElementById('broEnde');
    return e ? (e.hidden || e.getBoundingClientRect().height === 0) : null;
  });
  const letzte = await ctx.newPage();
  letzte.setDefaultTimeout(20000);
  await strecke(letzte);
  await letzte.goto(`http://localhost:${PORT}/broschuere.html#seite-36`, { waitUntil: 'load' });
  await letzte.waitForTimeout(2800);
  const endeNachher = await letzte.evaluate(() => {
    const e = document.getElementById('broEnde');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { sichtbar: !e.hidden && r.height > 0,
             kontakt: !!e.querySelector('a[href*="#kontakt"]'),
             vonVorn: !!e.querySelector('#broVonVorn') };
  });
  p('Am Ende des Katalogs steht, wie es weitergeht',
    endeVorher === true && !!endeNachher && endeNachher.sichtbar &&
    endeNachher.kontakt && endeNachher.vonVorn,
    endeNachher ? 'vorher verborgen: ' + endeVorher + ', am Schluss: ' + JSON.stringify(endeNachher)
      : 'kein Block');
  await letzte.click('#broVonVorn').catch(() => {});
  await letzte.waitForTimeout(1600);
  const zurueckAufEins = await letzte.$eval('#broZaehler', (e) => e.textContent.trim()).catch(() => '-');
  p('„Noch einmal von vorn" führt zurück auf Seite 1',
    zurueckAufEins === '1 / ' + ANZAHL, zurueckAufEins);
  await letzte.close();

  /* TASTATUR. Wer das Menue mit Escape schliesst, darf den Fokus nicht
     verlieren - sonst beginnt das Tabben wieder ganz vorn. */
  await seite.focus('#broMehr');
  await seite.keyboard.press('Enter');
  await seite.waitForTimeout(300);
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(300);
  const fokusNachMenue = await seite.evaluate(() => document.activeElement.id || document.activeElement.tagName);
  p('Nach Escape liegt der Fokus wieder auf den drei Punkten',
    fokusNachMenue === 'broMehr', fokusNachMenue);

  /* aria-modal="true" verspricht, dass der Rest ruht. Ohne Fokusfang
     landet man nach ein paar Mal Tab hinter der Ebene - gemessen am
     06.11.2026 auf den Knoepfen der Fusszeile. */
  await klick('#broUebersicht');
  await seite.waitForTimeout(600);
  let raus = 0;
  for (let i = 0; i < 12; i++) {
    await seite.keyboard.press('Tab');
    const drin = await seite.evaluate(() =>
      document.getElementById('broUebersichtEbene').contains(document.activeElement));
    if (!drin) raus++;
  }
  p('Der Fokus bleibt in der offenen Ebene', raus === 0,
    raus ? raus + ' von 12 Schritten lagen dahinter' : '12 Schritte, alle drinnen');

  /* Liegt die Ebene wirklich obenauf? z-index allein reicht nicht:
     die schwebenden Knoepfe der Website gehen bis 2147483647.
     Gemessen wird an vier Punkten, was der Browser dort anfasst. */
  const obenauf = await seite.evaluate(() => {
    const el = document.getElementById('broUebersichtEbene');
    const w = window.innerWidth, h = window.innerHeight;
    const punkte = [[w - 40, h - 40], [w - 40, 60], [40, h - 40], [w / 2, h / 2]];
    return punkte.map(([x, y]) => {
      const t = document.elementFromPoint(x, y);
      if (t && el.contains(t)) return null;
      /* Das Einwilligungsbanner DARF oben liegen - es muss bedienbar
         bleiben, solange niemand entschieden hat. Alles andere nicht. */
      if (t && t.closest && t.closest('#cookieBanner')) return null;
      return t ? (t.id || String(t.className).split(' ')[0] || t.tagName) : 'nichts';
    }).filter(Boolean);
  });
  p('Nichts liegt über der offenen Ebene', obenauf.length === 0,
    obenauf.length ? 'davor liegt: ' + obenauf.join(', ') : '4 Punkte, alle in der Ebene');
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(300);

  /* DIE ADRESSE MUSS MITWANDERN, sonst landet jeder Geteilte auf dem
     Titel statt auf der gemeinten Seite. */
  const hashNachBlaettern = await seite.evaluate(() => window.location.hash);
  p('Die Adresse trägt die Seitenzahl', /^#seite-\d+$/.test(hashNachBlaettern),
    hashNachBlaettern || '(leer)');

  const tiefLink = await ctx.newPage();
  tiefLink.setDefaultTimeout(20000);
  await strecke(tiefLink);
  await tiefLink.goto(`http://localhost:${PORT}/broschuere.html#seite-12`, { waitUntil: 'load' });
  await tiefLink.waitForTimeout(2600);
  const beiZwoelf = await tiefLink.$eval('#broZaehler', (e) => e.textContent.trim()).catch(() => '-');
  p('Ein Link auf eine Seite öffnet auch diese Seite', /\b12\b/.test(beiZwoelf), beiZwoelf);

  /* WCAG 1.4.5: Die Katalogseiten sind Bilder von Text. Eine
     Textfassung muss daneben stehen - sichtbar, nicht nur fuer
     Suchmaschinen. */
  const textfassung = await tiefLink.evaluate(() => {
    const ab = document.getElementById('katalogtext');
    if (!ab) return null;
    const auf = ab.querySelectorAll('details');
    /* textContent, nicht innerText: In einem zugeklappten <details>
       steht der Text im Dokument (Vorlesesoftware und Suchmaschinen
       finden ihn), innerText meldet ihn aber nicht. Zusaetzlich wird
       darum aufgeklappt und nachgesehen, dass er dann WIRKLICH zu
       sehen ist - sonst waere es versteckter Text. */
    window.__vorher = ab.innerText.length;
    /* ALLE aufklappen, nicht nur die erste: Die Titelseite traegt nur
       drei Woerter, daran waere nicht zu erkennen, ob das Aufklappen
       wirklich Text sichtbar macht. */
    auf.forEach(function (d) { d.open = true; });
    return { seiten: auf.length, zeichen: ab.textContent.length,
             probe: /Klassisch geneigt/.test(ab.textContent),
             sichtbar: ab.getBoundingClientRect().height > 0 };
  });
  await tiefLink.waitForTimeout(300);
  const aufgeklappt = await tiefLink.evaluate(() => {
    const ab = document.getElementById('katalogtext');
    if (!ab) return false;
    const nachher = ab.innerText.length;
    ab.querySelectorAll('details').forEach(function (d) { d.open = false; });
    return nachher > (window.__vorher || 0) + 5000;
  });
  p('Der Katalog steht auch als Text da',
    !!textfassung && textfassung.seiten >= 30 && textfassung.zeichen > 15000 &&
    textfassung.probe && textfassung.sichtbar && aufgeklappt,
    textfassung ? textfassung.seiten + ' Seiten, ' + textfassung.zeichen + ' Zeichen, aufklappbar: ' +
      aufgeklappt : 'kein Abschnitt');
  await tiefLink.close();

  /* Verweise und Nebendateien - durch den Browser gelesen, damit die
     Gegenprobe sie genauso umschreiben kann wie die Seite selbst. */
  const text = async (u) => seite.evaluate(async (x) => {
    try { const r = await fetch(x); return r.ok ? await r.text() : ''; } catch (e) { return ''; }
  }, u);

  const unterseite = await text('/stoffe.html');
  p('Die Navigation führt zur Broschüre',
    /href="\/broschuere\.html"/.test(unterseite), 'in /stoffe.html');

  const start = await text('/index.html');
  const startTreffer = (start.match(/\/broschuere\.html/g) || []).length;
  p('Die Startseite führt zur Broschüre', startTreffer >= 2,
    startTreffer + ' Verweise');

  const karte = await text('/sitemap.xml');
  p('Die Broschüre steht in der sitemap',
    /<loc>https:\/\/bv-aussensysteme\.de\/broschuere\.html<\/loc>/.test(karte));

  const uebersetzung = await text('/js/i18n.js');
  const braucht = ['Katalog ansehen', 'Seitenübersicht', 'Vollbild', 'Seite vergrößern',
    'Unser Produktkatalog', 'PDF herunterladen', 'Diesen Katalog teilen'];
  const fehltUeb = braucht.filter((b) => !uebersetzung.includes("['" + b + "'") &&
    !uebersetzung.includes("['" + b + "',"));
  p('Die Übersetzungen sind eingetragen', fehltUeb.length === 0,
    fehltUeb.length ? 'fehlt: ' + fehltUeb.join(', ') : braucht.length + ' Einträge');

  const laeuft = await seite.evaluate(() => typeof window.setLanguage === 'function');
  p('Die Übersetzungsdatei läuft ohne Fehler', laeuft === true,
    laeuft ? 'setLanguage da' : 'Skript bricht ab');

  await ctx.close();

  /* ---------- Handy ---------- */
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 2
  });
  const mseite = await mctx.newPage();
  mseite.setDefaultTimeout(20000);
  await strecke(mseite);
  await mseite.goto(`http://localhost:${PORT}/broschuere.html`, { waitUntil: 'load' });
  await mseite.waitForTimeout(1600);

  const klein = await mseite.$$eval('.bro-leiste .bro-knopf',
    (n) => n.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && (r.height < 44 || r.width < 44);
    }).length);
  /* Der Hinweis muss zum Geraet passen: "Pfeiltasten" hilft am Telefon
     niemandem. Geprueft wird, was dort WIRKLICH zu lesen ist. */
  const hinweisHandy = await mseite.evaluate(() => {
    const e = document.getElementById('broHinweis');
    return e ? e.innerText.replace(/\s+/g, ' ').trim() : '';
  });
  p('Der Hinweis zum Blättern passt zum Gerät',
    /Wischen/.test(hinweisHandy) && !/Pfeiltasten/.test(hinweisHandy),
    hinweisHandy.slice(0, 48));

  p('Am Handy sind die Knöpfe mit dem Daumen zu treffen', klein === 0,
    klein ? klein + ' zu klein' : 'alle mindestens 44 px');

  /* WISCHEN IST AM HANDY DER HAUPTWEG - wichtiger als jeder Knopf.
     Die Bibliothek hoert touchstart am Buch und touchmove/touchend am
     Fenster ab; genau so werden die Ereignisse hier ausgeloest. */
  const mZaehler = () => mseite.$eval('#broZaehler', (e) => e.textContent.trim()).catch(() => '-');
  const vorWisch = await mZaehler();
  await mseite.evaluate(() => {
    var el = document.querySelector('#broBuch .stf__block') || document.getElementById('broBuch');
    if (!el) return;
    var r = el.getBoundingClientRect();
    var y = r.top + r.height * 0.6;
    var x1 = r.left + r.width * 0.85, x2 = r.left + r.width * 0.15;
    function mach(typ, x, ziel) {
      var t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
      ziel.dispatchEvent(new TouchEvent(typ, {
        touches: typ === 'touchend' ? [] : [t],
        targetTouches: typ === 'touchend' ? [] : [t],
        changedTouches: [t], bubbles: true, cancelable: true
      }));
    }
    mach('touchstart', x1, el);
    mach('touchmove', (x1 + x2) / 2, window);
    mach('touchmove', x2, window);
    mach('touchend', x2, window);
  });
  await mseite.waitForTimeout(1500);
  const nachWisch = await mZaehler();
  p('Am Handy blättert eine Wischgeste', nachWisch !== vorWisch,
    vorWisch + ' -> ' + nachWisch);

  /* ERST EINMAL BLAETTERN. Auf der Titelseite liegt ohnehin nur ein
     Blatt offen (showCover) - gezaehlt wird also im Inneren, sonst
     waere die Pruefung blind gegen usePortrait. Die Gegenprobe hat
     genau das gemeldet (06.11.2026). */
  await klick('#broWeiter', mseite);
  await mseite.waitForTimeout(1400);
  const sichtbareSeiten = await mseite.$$eval('#broBuch .bro-seite',
    (n) => n.filter((s) => s.getBoundingClientRect().width > 50).length);
  p('Am Handy steht nur eine Seite', sichtbareSeiten === 1,
    sichtbareSeiten + ' Seite(n) sichtbar nach dem Blättern');

  /* DER ZUGANG ZUM KATALOG MUSS OBEN STEHEN. Gemessen wird nicht, ob
     irgendwo ein Verweis liegt, sondern ob er beim Aufschlagen der
     Startseite OHNE SCROLLEN zu sehen und mit dem Daumen zu treffen
     ist - am Handy, wo der Platz knapp ist. */
  const mstart = await mctx.newPage();
  mstart.setDefaultTimeout(20000);
  await strecke(mstart);
  await mstart.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await mstart.waitForTimeout(1400);
  const zugang = await mstart.evaluate(() => {
    const a = document.querySelector('#heroSlider a[href="/broschuere.html"]');
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return { oben: Math.round(r.top), unten: Math.round(r.bottom), hoehe: Math.round(r.height),
             fenster: window.innerHeight, text: a.textContent.trim() };
  });
  /* QUERFORMAT. Hier ist die Hoehe knapp; vorher rechnete der
     Stilblatt-Haltepunkt eine andere Breite aus als die Bibliothek
     und das Buch stand links und rechts ueber seinem Rahmen
     (gemessen 844 x 390: Rahmen 226 px, Buch 330 px). */
  await mseite.setViewportSize({ width: 844, height: 390 });
  await mseite.waitForTimeout(900);
  const quer = await mseite.evaluate(() => {
    const r = document.querySelector('.bro-rahmen');
    const w = document.querySelector('.stf__wrapper');
    if (!r || !w) return null;
    return { rahmen: Math.round(r.getBoundingClientRect().width),
             buch: Math.round(w.getBoundingClientRect().width),
             ueberhang: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  p('Im Querformat passt das Buch in seinen Rahmen',
    !!quer && quer.buch <= quer.rahmen + 2 && quer.ueberhang === 0,
    quer ? 'Buch ' + quer.buch + ' px in Rahmen ' + quer.rahmen + ' px' : 'nichts gemessen');
  await mseite.setViewportSize({ width: 390, height: 844 });
  await mseite.waitForTimeout(700);

  /* DIE ADRESSZEILE DARF DAS BUCH NICHT VERSTELLEN. Auf dem Telefon
     meldet der Browser eine Groessenaenderung, sobald sie ein- oder
     ausklappt - die Breite bleibt dabei gleich. Wuerde das Buch dann
     neu gerechnet, zappelte es beim Scrollen. */
  const breiteVorher = await mseite.evaluate(() =>
    Math.round(document.querySelector('.bro-rahmen').getBoundingClientRect().width));
  await mseite.setViewportSize({ width: 390, height: 784 });
  await mseite.waitForTimeout(800);
  const breiteNachher = await mseite.evaluate(() =>
    Math.round(document.querySelector('.bro-rahmen').getBoundingClientRect().width));
  await mseite.setViewportSize({ width: 390, height: 844 });
  await mseite.waitForTimeout(600);
  p('Das Buch zappelt nicht, wenn die Adresszeile einklappt',
    breiteVorher === breiteNachher, breiteVorher + ' -> ' + breiteNachher + ' px');

  /* Langes Antippen darf Knopfbeschriftungen nicht markieren. */
  const markierbar = await mseite.evaluate(() => {
    const schlecht = [];
    document.querySelectorAll('.bro-leiste .bro-knopf, #broBuch .bro-bild').forEach(function (e) {
      const cs = getComputedStyle(e);
      if ((cs.webkitUserSelect || cs.userSelect) !== 'none') schlecht.push(e.id || e.className);
    });
    return schlecht;
  });
  p('Langes Antippen markiert keine Bedienflächen', markierbar.length === 0,
    markierbar.length ? markierbar.join(', ') : 'Knöpfe und Seiten gesperrt');

  p('Der Katalog steht am Handy ohne Scrollen bereit',
    !!zugang && zugang.oben >= 0 && zugang.unten <= zugang.fenster && zugang.hoehe >= 44,
    zugang ? `"${zugang.text}" bei ${zugang.oben} von ${zugang.fenster} px` : 'kein Weg im Hero');

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
      console.log(`FEHLER: Eingebauter Fehler "${f.name}" bleibt unbemerkt.`);
      server.kill(); process.exit(1);
    }
    console.log(`  Fehler "${f.name}": ${rot.length} Prüfung(en) schlagen an`);
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
