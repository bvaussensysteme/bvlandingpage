#!/usr/bin/env node
/* Prüft den Worker-Endpunkt /api/bauteile, ohne ihn zu veröffentlichen.
 *
 * Der Endpunkt gibt es, damit die Herstellermatrix den Server nie verlässt:
 * Er bekommt ein Maß und antwortet mit einer Stückliste. Diese Prüfung baut
 * den Worker genauso wie Cloudflare (esbuild, ESM), hängt einen erfundenen
 * KV-Speicher davor und stellt echte Anfragen.
 *
 * Besonders wichtig ist die letzte Prüfung: **Es darf keine Antwort geben,
 * in der die Matrix steckt.** Deshalb wird jede Antwort daraufhin
 * durchsucht, ob Felder der Rohdaten (sparrenJeBreite, stuetzfuesseJeBreite,
 * markierungen) darin vorkommen.
 *
 * Gegenprobe: node scripts/pruefe-api-bauteile.mjs --gegenprobe
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MATRIX_DATEI = path.join(WURZEL, 'js', 'dachmatrix-daten.json');

if (!fs.existsSync(MATRIX_DATEI)) {
  console.log('js/dachmatrix-daten.json fehlt – das ist so gewollt.');
  console.log('Dieses Repository ist öffentlich; die Herstellermatrix gehört nicht hinein.');
  console.log('Zum Arbeiten: Dateien aus bv-crm/docs/konfigurator-daten/ nach daten/ kopieren,');
  console.log('dann node scripts/baue-dachmatrix.js ausführen.');
  process.exit(0);
}

const matrix = JSON.parse(fs.readFileSync(MATRIX_DATEI, 'utf8'));

/* Worker so bauen, wie Cloudflare ihn baut */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-worker-'));
const gebaut = path.join(tmp, 'worker.mjs');
execFileSync('npx', ['esbuild', path.join(WURZEL, 'worker', 'index.js'),
  '--bundle', '--format=esm', '--platform=neutral', '--outfile=' + gebaut],
  { stdio: ['ignore', 'ignore', 'inherit'] });
/* Jeder Aufruf gibt einen frischen Worker. Der Worker merkt sich die
   geladene Matrix im Isolat – für die Gegenprobe braucht es deshalb einen
   unbenutzten Zustand, sonst antwortet er aus dem Zwischenspeicher. */
let zaehler = 0;
async function frischerWorker() {
  return (await import('file://' + gebaut + '?n=' + (++zaehler))).default;
}
const worker = await frischerWorker();

function umgebung({ kv = matrix } = {}) {
  return {
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) },
    DACHMATRIX: kv === null ? undefined : {
      get: async (schluessel, opt) => (schluessel === 'matrix'
        ? (opt && opt.type === 'json' ? kv : JSON.stringify(kv)) : null),
    },
  };
}

async function hole(pfad, env) {
  const antwort = await worker.fetch(new Request('https://bv-aussensysteme.de' + pfad), env);
  const text = await antwort.text();
  let daten = null;
  try { daten = JSON.parse(text); } catch (e) { /* kein JSON */ }
  return { status: antwort.status, text, daten, headers: antwort.headers };
}

/* Verräterische Felder der Rohdaten – sie dürfen in keiner Antwort stehen.
   Eine Längenschwelle taugt dafür nicht: Die ganze Matrix ist nur rund
   4,8 KB und damit kaum größer als eine ausführliche Stückliste. */
const ROHFELDER = ['sparrenJeBreite', 'stuetzfuesseJeBreite', 'markierungen'];
function enthaeltMatrix(text) {
  return ROHFELDER.some((feld) => text.includes(feld));
}

async function pruefen() {
  const f = [];
  function gleich(was, ist, soll) {
    if (ist !== soll) f.push(was + ': ' + JSON.stringify(ist) + ', erwartet ' + JSON.stringify(soll));
  }
  const env = umgebung();

  // 1. Eine Zelle – die Zahlen müssen stimmen
  const a = await hole('/api/bauteile?system=TDS&material=Glas&breite=5080&tiefe=3050', env);
  gleich('Status einer gültigen Anfrage', a.status, 200);
  gleich('Sparren', a.daten && a.daten.sparren, 8);
  gleich('Pfosten', a.daten && a.daten.pfosten, 3);
  gleich('Antwort wird zwischengespeichert',
         a.headers.get('cache-control'), 'public, max-age=3600');

  // 2. Zwischenmaß wird auf das Raster gehoben und das gesagt
  const b = await hole('/api/bauteile?system=TDS&material=Glas&breite=5300&tiefe=3000', env);
  gleich('5300 mm wird zu', b.daten && b.daten.raster && b.daten.raster.breite, 5900);
  gleich('und als nicht im Raster gemeldet', b.daten && b.daten.imRaster, false);

  // 3. Rasterlisten
  const c = await hole('/api/bauteile?raster=1', env);
  gleich('Rasterabfrage', c.status, 200);
  const tdsGlas = c.daten && c.daten.raster && c.daten.raster['TDS|Glas'];
  gleich('Breiten TDS/Glas', tdsGlas && tdsGlas.breiten.length, 30);
  gleich('Tiefen TDS/Glas', tdsGlas && tdsGlas.tiefen.length, 14);

  // 4. Unsinn wird abgewiesen, nicht geraten
  gleich('fehlende Angaben', (await hole('/api/bauteile?system=TDS', env)).status, 400);
  gleich('unbekanntes System',
         (await hole('/api/bauteile?system=Mondhaus&material=Glas&breite=5000&tiefe=3000', env)).status, 404);
  gleich('Buchstaben als Maß',
         (await hole('/api/bauteile?system=TDS&material=Glas&breite=abc&tiefe=3000', env)).status, 400);

  // 5. Ohne KV-Binding: verständlicher 503, kein Absturz
  const ohne = await hole('/api/bauteile?system=TDS&material=Glas&breite=5080&tiefe=3050',
                          umgebung({ kv: null }));
  gleich('ohne Herstellerdaten', ohne.status, 503);
  if (!(ohne.daten && /geschätzt/i.test(ohne.daten.hinweis || ''))) {
    f.push('ohne Herstellerdaten: Meldung nennt die geschätzte Darstellung nicht');
  }

  // 6. Andere Pfade gehen weiter an die statischen Dateien
  gleich('normale Seite', (await hole('/konfigurator.html', env)).status, 200);

  // 7. DAS WICHTIGSTE: In keiner Antwort steckt die Matrix
  for (const [name, antwort] of [['Zelle', a], ['Zwischenmaß', b], ['Raster', c]]) {
    if (enthaeltMatrix(antwort.text)) {
      f.push('Antwort „' + name + '" enthält ein Rohdatenfeld der Matrix');
    }
  }
  // Die Zellantwort ist eine einzelne Stückliste, keine Liste von Blöcken
  if (Array.isArray(a.daten)) f.push('Zellantwort ist eine Liste – sieht nach Rohdaten aus');
  return f;
}

async function gegenprobe() {
  console.log('Gegenprobe: drei absichtliche Fehler');
  let schlecht = 0;
  const faelle = [
    ['Leck-Erkennung schlägt bei echten Rohdaten an', async () => {
      // Würde der Endpunkt die Matrix durchreichen, sähe die Antwort so aus
      return enthaeltMatrix(JSON.stringify(matrix)) === true
          && enthaeltMatrix(JSON.stringify({ sparren: 8, pfosten: 3 })) === false;
    }],
    ['verfälschte Matrix schlägt auf die Antwort durch', async () => {
      const kaputt = JSON.parse(JSON.stringify(matrix));
      kaputt.find((x) => x.system === 'TDS' && x.material === 'Glas').sparrenJeBreite['5080'] = 99;
      const w = await frischerWorker();
      const r = await w.fetch(
        new Request('https://x/api/bauteile?system=TDS&material=Glas&breite=5080&tiefe=3050'),
        umgebung({ kv: kaputt }));
      const d = await r.json();
      return d.sparren === 99;   // die Prüfung oben erwartet 8 und schlüge an
    }],
    ['ohne KV kein Absturz, sondern 503', async () => {
      const w = await frischerWorker();
      const r = await w.fetch(
        new Request('https://x/api/bauteile?system=TDS&material=Glas&breite=5080&tiefe=3050'),
        umgebung({ kv: null }));
      return r.status === 503;
    }],
  ];
  for (const [name, fn] of faelle) {
    let ok = false;
    try { ok = await fn(); } catch (e) { ok = false; }
    console.log('  ' + (ok ? 'erkannt      ' : 'NICHT ERKANNT') + '  ' + name);
    if (!ok) schlecht++;
  }
  return schlecht ? 1 : 0;
}

let code = 0;
if (process.argv.includes('--gegenprobe')) {
  code = await gegenprobe();
  console.log(code ? 'Ergebnis: FEHLGESCHLAGEN'
                   : 'Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden');
} else {
  const f = await pruefen();
  console.log('Worker-Endpunkt /api/bauteile');
  if (!f.length) {
    console.log('  ok      Zahlen, Rasterhinweis, Fehlerfälle und der Weg ohne Daten stimmen');
    console.log('  ok      keine Antwort enthält die Herstellermatrix');
    console.log('Ergebnis: bestanden');
  } else {
    f.forEach((x) => console.log('  FEHLER  ' + x));
    console.log('Ergebnis: nicht bestanden');
    code = 1;
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(code);
