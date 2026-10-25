#!/usr/bin/env node
/* Prueft den Kurzlink im Worker – ohne Datenbank.
 *
 * ANLASS. „die links sind riesig, besser nen kurzlink wie bei bitly"
 * (Betreiber, 25.10.2026, mit Bild einer WhatsApp-Nachricht).
 *
 * WAS HIER GEHT UND WAS NICHT – ehrlich: Die Datenbank (Neon) ist ein
 * Secret der Live-Umgebung und steht hier nicht zur Verfuegung. Geprueft
 * wird deshalb alles, was OHNE sie entscheidbar ist, und zwar am echten
 * Worker-Modul, nicht am abgeschriebenen Code:
 *
 *   · Die Wege /api/teilen und /k/... werden ueberhaupt bedient.
 *   · Ein fehlender oder unsinniger Code wird abgewiesen (400), bevor
 *     irgendetwas gespeichert wuerde.
 *   · Ohne Datenbank kommt 503 bzw. die 404-Seite – und KEIN Absturz
 *     und keine Fehlermeldung aus der Datenbank an den Besucher.
 *   · Die Kennung ist kurz, vorlesbar (ohne I, L, O, U) und zur selben
 *     Planung immer dieselbe.
 *
 * NICHT geprueft, weil ohne Datenbank nicht pruefbar: Speichern,
 * Wiederfinden und die 302-Weiterleitung. Dafuer gilt der Durchlauf im
 * Browser nach dem Deploy – siehe docs/NEXT_TASK.md.
 *
 * Aufruf:  node scripts/pruefe-kurzlink.mjs [--gegenprobe]
 */
import worker from '../worker/index.js';
import { readFileSync } from 'node:fs';

const gegen = process.argv.includes('--gegenprobe');
let fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

const quelle = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
const ohneDb = { ASSETS: { fetch: () => new Response('asset', { status: 200 }) } };

function anfrage(pfad, method = 'GET', body = null) {
  return new Request('https://bv-aussensysteme.de' + pfad, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body
  });
}

/* ---------- Die Wege gibt es ---------- */
{
  const r = await worker.fetch(anfrage('/api/teilen', 'POST',
    JSON.stringify({ code: 'A'.repeat(40) })), ohneDb);
  pruefe('POST /api/teilen wird vom Worker bedient, nicht als Datei',
         gegen ? r.status === 200 : r.status !== 200,
         'Antwort ' + r.status + ' (ohne Datenbank 503 erwartet)');
  pruefe('Ohne Datenbank: 503, kein Absturz',
         gegen ? r.status !== 503 : r.status === 503, 'Antwort ' + r.status);
}
{
  const r = await worker.fetch(anfrage('/k/ABC234'), ohneDb);
  const text = await r.text();
  const kSeite = r.status === 404 && text.includes('Diesen Link gibt es nicht');
  pruefe('GET /k/… wird vom Worker bedient',
         gegen ? !kSeite : kSeite,
         'ohne Datenbank die verständliche 404-Seite');
  const stumm = !/neon|postgres|ANFRAGEN_DB|stack/i.test(text);
  pruefe('Die 404-Seite verrät nichts über die Technik',
         gegen ? !stumm : stumm,
         'keine Datenbankmeldung an den Besucher');
}

/* ---------- Unsinn wird abgewiesen, BEVOR gespeichert wird ---------- */
{
  const faelle = [
    ['leerer Code', JSON.stringify({ code: '' })],
    ['zu kurz', JSON.stringify({ code: 'abc' })],
    ['fremde Zeichen', JSON.stringify({ code: 'A'.repeat(30) + '<script>' })],
    ['kein JSON', 'das ist kein json'],
    ['zu lang', JSON.stringify({ code: 'A'.repeat(6500) })]
  ];
  let alle400 = true, schlecht = [];
  for (const [name, body] of faelle) {
    const r = await worker.fetch(anfrage('/api/teilen', 'POST', body), ohneDb);
    /* 400 = abgewiesen. 503 waere auch „nichts gespeichert", wuerde aber
       heissen: erst Datenbank, dann pruefen. Genau das soll es nicht. */
    if (r.status !== 400 && r.status !== 413) { alle400 = false; schlecht.push(name + ': ' + r.status); }
  }
  if (gegen) alle400 = !alle400;
  pruefe('Unsinn wird abgewiesen, bevor die Datenbank angefasst wird',
         alle400, schlecht.length ? schlecht.join(', ') : faelle.length + ' Fälle, alle 400/413');
}

/* ---------- Die Kennung ---------- */
{
  /* teilenId und das Zeichenvorrat aus der Quelle holen und ausfuehren –
     exportiert sind sie nicht, und exportiert werden sollen sie auch
     nicht, nur um geprueft zu werden. */
  const zeichen = (quelle.match(/const TEILEN_ZEICHEN = '([^']+)'/) || [])[1] || '';
  const fn = (quelle.match(/function teilenId\(hash, laenge\) \{[\s\S]*?\n\}/) || [''])[0];
  const teilenId = new Function('TEILEN_ZEICHEN', fn + '\nreturn teilenId;')(zeichen);
  const hash = 'a3f19c7e4b2d8061' + '0'.repeat(48);

  pruefe('Keine verwechselbaren Zeichen in der Kennung',
         gegen ? /[ILOU]/.test(zeichen) : !/[ILOU]/.test(zeichen) && zeichen.length >= 28,
         zeichen.length + ' Zeichen, ohne I, L, O, U');

  const a = teilenId(hash, 6), b = teilenId(hash, 6);
  const gleich = a === b && a.length === 6 && /^[0-9A-Z]{6}$/.test(a);
  pruefe('Dieselbe Planung ergibt dieselbe Kennung',
         gegen ? !gleich : gleich,
         'z. B. ' + a);

  const anders = teilenId('b3f19c7e4b2d8061' + '0'.repeat(48), 6);
  pruefe('Eine andere Planung ergibt eine andere Kennung',
         gegen ? anders === a : anders !== a, a + ' vs. ' + anders);

  pruefe('Die längere Kennung baut auf der kurzen auf',
         gegen ? teilenId(hash, 8).indexOf(a) !== 0 : teilenId(hash, 8).indexOf(a) === 0,
         'eine Stelle mehr bei Kollision, kein neuer Wurf');
}

/* ---------- Was gespeichert wird ---------- */
{
  const tab = (quelle.match(/create table if not exists teilen_links \(([\s\S]*?)\)\s*`/) || [])[1] || '';
  const spalten = tab.toLowerCase();
  const heikel = /(ip|adresse|name|email|mail|telefon|agent)/.test(spalten);
  pruefe('In der Tabelle steht nichts Persönliches',
         gegen ? heikel : !heikel,
         'Spalten: id, code, code_hash, erstellt, zuletzt');
  const eindeutig = /code_hash\s+text not null unique/.test(tab) &&
                    /select id from teilen_links where code_hash/.test(quelle);
  pruefe('Gleiche Planung wird nicht doppelt gespeichert',
         gegen ? !eindeutig : eindeutig,
         'Prüfsumme ist eindeutig');
}

/* ---------- Der Browser kommt ohne Kurzlink aus ---------- */
{
  const k3d = readFileSync(new URL('../js/konfigurator-3d.js', import.meta.url), 'utf8');
  const faellt = /\.catch\(function \(\) \{\s*\n\s*if \(meins !== teilenLauf\) return;\s*\n\s*if \(stand\) stand\.textContent = STAND_LANG;/.test(k3d);
  pruefe('Antwortet der Server nicht, bleibt der lange Link stehen',
         gegen ? !faellt : faellt,
         'der lange Link funktioniert ohne Server');
}

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
