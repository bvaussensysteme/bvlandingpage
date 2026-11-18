#!/usr/bin/env node
/* ============================================================
   Gelaendehoehe ueber NN: Server (/api/hoehe) und Seite
   (/windzonen.html).

   Warum es diese Pruefung gibt: Der Wert landet in einem Feld, aus
   dem eine SCHNEELAST gerechnet wird. Eine falsche Hoehe faellt
   niemandem auf, die Zahl sieht immer plausibel aus. Geprueft wird
   deshalb beides: dass der Server nur sinnvolle Hoehen durchlaesst,
   und dass die Seite eine von Hand eingetragene Zahl NIE
   ueberschreibt.

   Der fremde Hoehendienst wird dabei NICHT angerufen. Er ist durch
   einen eigenen Ersatz ersetzt, der genau das antwortet, was die
   Pruefung gerade braucht: So laesst sich auch der Ausfall pruefen,
   ohne auf einen Ausfall zu warten.

   Aufruf:     node scripts/pruefe-hoehe.mjs
   Gegenprobe: node scripts/pruefe-hoehe.mjs --gegenprobe
   ============================================================ */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8747;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(54)} ${beleg}`); }
  else { console.log(`  FEHLER  ${name.padEnd(54)} ${beleg}`); fehler++; }
};

/* ---------- Teil 1: der Worker ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-hoehe-'));
const gebaut = path.join(tmp, 'worker.mjs');
execFileSync('npx', ['esbuild', path.join(WURZEL, 'worker', 'index.js'),
  '--bundle', '--format=esm', '--platform=neutral', '--outfile=' + gebaut],
  { stdio: ['ignore', 'ignore', 'inherit'] });
const worker = (await import('file://' + gebaut)).default;

/* Ein eigener Zwischenspeicher. In Node gibt es caches.default nicht. */
let speicher = new Map();
globalThis.caches = {
  default: {
    match: async (req) => {
      const t = speicher.get(req.url);
      return t ? new Response(t.body, { status: 200, headers: t.headers }) : undefined;
    },
    put: async (req, res) => {
      speicher.set(req.url, {
        body: await res.text(),
        headers: Object.fromEntries(res.headers.entries()),
      });
    },
  },
};

/* Ersatz fuer den fremden Dienst. `plan` sagt je Datensatz, was er
   antworten soll. */
let gerufen = [];
let plan = {};
const echterFetch = globalThis.fetch;
globalThis.fetch = async (eingabe, opt) => {
  const u = String(eingabe && eingabe.url ? eingabe.url : eingabe);
  if (!u.includes('opentopodata.org')) return echterFetch(eingabe, opt);
  gerufen.push(u);
  const satz = u.includes('eudem25m') ? 'eudem25m' : 'srtm30m';
  const a = plan[satz];
  if (a === 'fehler') return new Response('nein', { status: 500 });
  if (a === 'leer') return new Response(JSON.stringify({ results: [] }), { status: 200 });
  if (a === 'wirft') throw new Error('Netz weg');
  return new Response(JSON.stringify({
    results: [{ dataset: satz, elevation: a, location: {} }], status: 'OK',
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

async function hole(pfad) {
  const r = await worker.fetch(new Request('https://bv-aussensysteme.de' + pfad), {});
  const text = await r.text();
  let daten = null;
  try { daten = JSON.parse(text); } catch (e) { /* kein JSON */ }
  return { status: r.status, daten, headers: r.headers };
}

/* Dernbach, Westerwald. */
const DERN = 'lat=50.4565&lon=7.7885';

plan = { eudem25m: 259.5693054199219 };
gerufen = [];
let a = await hole('/api/hoehe?' + DERN);
p('eine gueltige Koordinate liefert die Hoehe',
  a.status === 200 && a.daten.hoehe === 260, JSON.stringify(a.daten));
p('die Quelle steht dabei',
  typeof a.daten.quelle === 'string' && a.daten.quelle.length > 3, a.daten.quelle);
p('die Antwort wird 30 Tage zwischengespeichert',
  a.headers.get('cache-control') === 'public, max-age=2592000',
  a.headers.get('cache-control'));
p('nur die gerundete Koordinate verlaesst den Server',
  gerufen.length === 1 && gerufen[0].includes('50.4565,7.7885')
  && !/\d\.\d{5}/.test(gerufen[0]),
  gerufen[0]);

/* Derselbe Punkt noch einmal: Der fremde Dienst darf nicht wieder
   angerufen werden. */
gerufen = [];
const b = await hole('/api/hoehe?' + DERN);
p('der zweite Abruf kommt aus dem Zwischenspeicher',
  b.status === 200 && b.daten.hoehe === 260 && gerufen.length === 0,
  gerufen.length + ' weitere Anfragen nach aussen');

/* Fuenf Nachkommastellen von der Seite werden auf vier gekuerzt. */
speicher = new Map(); gerufen = [];
plan = { eudem25m: 331.4 };
const c = await hole('/api/hoehe?lat=50.65764&lon=7.81092');
p('mehr Stellen werden gekuerzt, nicht weitergereicht',
  c.daten.hoehe === 331 && gerufen[0].includes('50.6576,7.8109'), gerufen[0]);

/* Ausserhalb Deutschlands und Unsinn. */
for (const [was, pfad] of [
  ['Wien', 'lat=48.2082&lon=16.3738'],
  ['Mitte des Atlantiks', 'lat=0&lon=0'],
  ['ohne Zahlen', 'lat=abc&lon=def'],
  ['ohne Werte', ''],
]) {
  speicher = new Map(); gerufen = [];
  const r = await hole('/api/hoehe?' + pfad);
  p(`${was}: abgewiesen, ohne jemanden zu fragen`,
    r.status === 400 && gerufen.length === 0, 'Status ' + r.status);
}

/* Faellt der erste Datensatz aus, kommt der zweite. */
speicher = new Map(); gerufen = [];
plan = { eudem25m: 'fehler', srtm30m: 259 };
const d = await hole('/api/hoehe?' + DERN);
p('faellt der erste Datensatz aus, antwortet der zweite',
  d.status === 200 && d.daten.hoehe === 259 && d.daten.datensatz === 'srtm30m',
  JSON.stringify(d.daten));

speicher = new Map(); gerufen = [];
plan = { eudem25m: 'leer', srtm30m: 'wirft' };
const e = await hole('/api/hoehe?' + DERN);
p('faellt alles aus, kommt ein ehrlicher Fehler statt einer Zahl',
  e.status === 503 && !('hoehe' in (e.daten || {})) && /Hand/.test(e.daten.hinweis || ''),
  JSON.stringify(e.daten));

/* Unsinnige Hoehen des Dienstes duerfen nicht durchgereicht werden:
   Aus ihnen wuerde eine Schneelast gerechnet. */
for (const [was, wert] of [['9000 m', 9000], ['minus 500 m', -500]]) {
  speicher = new Map(); gerufen = [];
  plan = { eudem25m: wert, srtm30m: 'leer' };
  const r = await hole('/api/hoehe?' + DERN);
  p(`${was} vom Dienst wird nicht durchgereicht`, r.status === 503,
    'Status ' + r.status + ' ' + JSON.stringify(r.daten));
}

/* Nichts wird gespeichert: kein Datenbankzugriff im ganzen Pfad. */
const quelle = fs.readFileSync(path.join(WURZEL, 'worker', 'index.js'), 'utf8');
const block = quelle.slice(quelle.indexOf('async function handleHoehe'),
                           quelle.indexOf('function cacheAntwort'));
p('der Hoehen-Pfad fasst keine Datenbank an',
  !/neon|DACHMATRIX|INSERT|env\./i.test(block), block.length + ' Zeichen geprueft');

/* ---------- Teil 2: die Seite ---------- */
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2000));
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  async function frischeSeite(hoehenAntwort) {
    const s = await ctx.newPage();
    const hoehenRufe = [];
    await s.route('**/photon.komoot.io/**', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ features: [{ type: 'Feature',
        geometry: { type: 'Point', coordinates: [7.7885, 50.4565] },
        properties: { countrycode: 'DE', name: 'Dernbach', postcode: '56428',
                      city: 'Dernbach', state: 'Rheinland-Pfalz' } }] }),
    }));
    await s.route('**/api/hoehe*', (route) => {
      hoehenRufe.push(route.request().url());
      route.fulfill(hoehenAntwort());
    });
    await s.goto(`http://127.0.0.1:${PORT}/windzonen.html?t=${Date.now()}`,
      { waitUntil: 'load' });
    await s.waitForTimeout(1200);
    return { s, hoehenRufe };
  }
  const guteAntwort = () => ({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ hoehe: 260, quelle: 'EU-DEM 25 m (Copernicus)',
                           datensatz: 'eudem25m' }) });

  /* Suchen, aber NICHT aufklappen: Es darf noch nichts geholt werden. */
  const A = await frischeSeite(guteAntwort);
  await A.s.fill('#wz-address-input', '56428 Dernbach');
  await A.s.click('#wz-search-btn');
  await A.s.waitForSelector('#wz-results.visible', { timeout: 15000 });
  await A.s.waitForTimeout(800);
  p('die Suche allein fragt noch keine Hoehe ab',
    A.hoehenRufe.length === 0, A.hoehenRufe.length + ' Abrufe');

  await A.s.click('#wz-hoehe-box > summary');
  await A.s.waitForTimeout(1200);
  const wert = await A.s.inputValue('#wz-hoehe-input');
  const quelleText = (await A.s.textContent('#wz-hoehe-quelle')) || '';
  p('das Aufklappen holt die Hoehe und traegt sie ein',
    A.hoehenRufe.length === 1 && wert === '260',
    `${A.hoehenRufe.length} Abruf, Feld "${wert}"`);
  p('die Quelle steht sichtbar daneben',
    /EU-DEM/.test(quelleText) && /überschreiben/.test(quelleText),
    quelleText.slice(0, 80));
  const skText = (await A.s.textContent('#wz-hoehe-result')) || '';
  p('der Schneelastwert wird gleich mitgerechnet',
    /kN\/m/.test(skText), skText.replace(/\s+/g, ' ').slice(0, 70));

  /* Ein zweites Aufklappen darf nicht noch einmal fragen. */
  await A.s.click('#wz-hoehe-box > summary');
  await A.s.waitForTimeout(300);
  await A.s.click('#wz-hoehe-box > summary');
  await A.s.waitForTimeout(900);
  p('das zweite Aufklappen fragt nicht noch einmal',
    A.hoehenRufe.length === 1, A.hoehenRufe.length + ' Abrufe');
  await A.s.close();

  /* Von Hand eingetragen: Die Zahl bleibt stehen. */
  const B = await frischeSeite(guteAntwort);
  await B.s.fill('#wz-address-input', '56428 Dernbach');
  await B.s.click('#wz-search-btn');
  await B.s.waitForSelector('#wz-results.visible', { timeout: 15000 });
  await B.s.click('#wz-hoehe-box > summary');
  await B.s.waitForTimeout(300);
  await B.s.fill('#wz-hoehe-input', '415');
  await B.s.waitForTimeout(1500);
  const vonHand = await B.s.inputValue('#wz-hoehe-input');
  p('eine von Hand eingetragene Hoehe wird nicht ueberschrieben',
    vonHand === '415', 'Feld "' + vonHand + '"');
  await B.s.close();

  /* Faellt der Server aus, steht da ein Hinweis und keine Zahl. */
  const C = await frischeSeite(() => ({ status: 503, contentType: 'application/json',
    body: JSON.stringify({ fehler: 'nein', hinweis: 'Bitte von Hand eintragen.' }) }));
  await C.s.fill('#wz-address-input', '56428 Dernbach');
  await C.s.click('#wz-search-btn');
  await C.s.waitForSelector('#wz-results.visible', { timeout: 15000 });
  await C.s.click('#wz-hoehe-box > summary');
  await C.s.waitForTimeout(1200);
  const leer = await C.s.inputValue('#wz-hoehe-input');
  const hinweis = (await C.s.textContent('#wz-hoehe-quelle')) || '';
  p('faellt der Abruf aus, bleibt das Feld leer und sagt es',
    leer === '' && /von Hand/.test(hinweis), `"${leer}" / ${hinweis.slice(0, 60)}`);

  /* Der Kontrast des Hinweises, gemessen statt behauptet. */
  const kontrast = await C.s.evaluate(() => {
    const el = document.getElementById('wz-hoehe-quelle');
    const lum = (c) => {
      const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const zahl = (s2) => (s2.match(/\d+/g) || []).slice(0, 3).map(Number);
    let hg = null, k = el;
    while (k && !hg) {
      const f = getComputedStyle(k).backgroundColor;
      if (f && !/rgba\(0, 0, 0, 0\)|transparent/.test(f)) hg = zahl(f);
      k = k.parentElement;
    }
    const l1 = lum(zahl(getComputedStyle(el).color)), l2 = lum(hg || [255, 255, 255]);
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
  });
  p('der Hinweistext erfuellt den Kontrast 4,5:1', kontrast >= 4.5, kontrast + ':1');
  await C.s.close();
  /* ---- Genau die eingetippte Adresse, nicht nur Ort und PLZ ----
     „ich möchte nämlich genau die richtige Adresse … Straße, Hausnummer,
     Ort, Postleitzahl" (Betreiber, 18.11.2026).

     Zwei Treffer mit demselben Straßennamen und derselben Postleitzahl,
     in zwei verschiedenen Orten. Photon stellt Astert nach vorne; gemeint
     ist Hachenburg. Die Hoehen liegen 53 m auseinander. */
  const HAUS_HBG = { type: 'Feature',
    geometry: { type: 'Point', coordinates: [7.82473, 50.66148] },
    properties: { countrycode: 'DE', osm_key: 'place', street: 'Hauptstraße',
                  housenumber: '1', postcode: '57627', city: 'Hachenburg',
                  state: 'Rheinland-Pfalz', name: 'Hauptstraße 1' } };
  const HAUS_AST = { type: 'Feature',
    geometry: { type: 'Point', coordinates: [7.78230, 50.69481] },
    properties: { countrycode: 'DE', osm_key: 'place', street: 'Hauptstraße',
                  housenumber: '1', postcode: '57627', city: 'Astert',
                  state: 'Rheinland-Pfalz', name: 'Hauptstraße 1' } };

  async function adressSeite() {
    const s = await ctx.newPage();
    const rufe = { suche: 0, vorschlag: 0, hoehe: [] };
    await s.route('**/photon.komoot.io/**', (route) => {
      const u = route.request().url();
      if (/limit=7/.test(u)) rufe.vorschlag++; else rufe.suche++;
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ features: [HAUS_AST, HAUS_HBG] }) });
    });
    await s.route('**/api/hoehe*', (route) => {
      const u = new URL(route.request().url());
      rufe.hoehe.push(u.searchParams.get('lat') + ',' + u.searchParams.get('lon'));
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ hoehe: 384, quelle: 'EU-DEM 25 m (Copernicus)',
                               datensatz: 'eudem25m' }) });
    });
    await s.goto(`http://127.0.0.1:${PORT}/windzonen.html?t=${Date.now()}`,
      { waitUntil: 'load' });
    await s.waitForTimeout(1200);
    return { s, rufe };
  }

  /* a) Knopf "Standort ermitteln" mit voll eingetippter Adresse. */
  const D = await adressSeite();
  await D.s.fill('#wz-address-input', 'Hauptstraße 1, 57627 Hachenburg');
  await D.s.click('#wz-search-btn');
  await D.s.waitForSelector('#wz-results.visible', { timeout: 15000 });
  const dAdr = (await D.s.textContent('#wz-addr-text')) || '';
  const dGenau = (await D.s.textContent('#wz-addr-genau')) || '';
  const dKoord = (await D.s.textContent('#wz-addr-coords')) || '';
  p('die Strasse und die Hausnummer stehen im Ergebnis',
    /Hauptstraße 1/.test(dAdr) && /57627/.test(dAdr) && /Hachenburg/.test(dAdr), dAdr);
  p('der richtige Ort gewinnt, nicht der erste Treffer',
    /Hachenburg/.test(dAdr) && !/Astert/.test(dAdr) && /50\.66148/.test(dKoord),
    dKoord);
  p('die Seite sagt, wie genau der Treffer ist',
    /hausgenau/.test(dGenau), dGenau);
  await D.s.click('#wz-hoehe-box > summary');
  await D.s.waitForTimeout(1200);
  p('die Hoehe wird fuer das Haus geholt, nicht fuer die Ortsmitte',
    D.rufe.hoehe.length === 1 && D.rufe.hoehe[0] === '50.66148,7.82473',
    D.rufe.hoehe.join(' '));
  await D.s.close();

  /* b) Vorschlag anklicken. Vorher ging dabei die Strasse verloren. */
  const E = await adressSeite();
  await E.s.fill('#wz-address-input', 'Hauptstraße 1, 57627 Hach');
  await E.s.waitForSelector('.wz-suggestion-item', { timeout: 15000 });
  const vorschlagText = (await E.s.textContent('.wz-suggestion-item:nth-child(2)')) || '';
  p('die Vorschlagsliste zeigt Strasse und Hausnummer',
    /Hauptstraße 1/.test(vorschlagText), vorschlagText.replace(/\s+/g, ' ').trim());
  const sucheVorher = E.rufe.suche;
  await E.s.click('.wz-suggestion-item:nth-child(2)');
  await E.s.waitForSelector('#wz-results.visible', { timeout: 15000 });
  const eFeld = await E.s.inputValue('#wz-address-input');
  const eAdr = (await E.s.textContent('#wz-addr-text')) || '';
  const eKoord = (await E.s.textContent('#wz-addr-coords')) || '';
  p('ein angeklickter Vorschlag behaelt Strasse und Hausnummer',
    /Hauptstraße 1/.test(eFeld) && /57627/.test(eFeld), 'Feld: ' + eFeld);
  p('und benutzt SEINE Koordinaten, ohne zweite Suche',
    /50\.66148/.test(eKoord) && E.rufe.suche === sucheVorher,
    eKoord + ' / ' + (E.rufe.suche - sucheVorher) + ' zusaetzliche Suchen');
  p('der zweite Vorschlag ist auch der zweite Ort',
    /Hachenburg/.test(eAdr) && !/Astert/.test(eAdr), eAdr);
  await E.s.close();

} finally {
  await browser.close();
  server.kill();
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* egal */ }
}

if (GEGEN) {
  console.log('\nGegenprobe: der fremde Dienst wird durch einen eigenen Ersatz');
  console.log('  ausgetauscht, der nacheinander eine gute Antwort, einen Fehler,');
  console.log('  eine leere Antwort, einen Abbruch und zwei unsinnige Hoehen');
  console.log('  (9000 m und minus 500 m) liefert. Jede dieser sechs Lagen wird');
  console.log('  oben als eigene Messung geprueft; reicht der Server eine davon');
  console.log('  durch, wird die Pruefung rot. Dasselbe fuer die Seite: Eine von');
  console.log('  Hand eingetragene 415 wird absichtlich gegen eine ankommende 260');
  console.log('  gestellt.');
  process.exit(fehler === 0 ? 0 : 1);
}
console.log();
if (fehler === 0) { console.log(`Ergebnis: alle ${anzahl} Pruefungen bestanden`); process.exit(0); }
console.log(`Ergebnis: ${fehler} von ${anzahl} Pruefungen beanstandet`);
process.exit(1);
