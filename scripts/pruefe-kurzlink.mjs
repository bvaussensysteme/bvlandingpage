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

/* ---------- Der Server raeumt sich den Platz selbst ein ---------- */
/* ANLASS: Der Betreiber sollte die Tabelle einmal von Hand in der
   Neon-Konsole anlegen. „is mir zu kompliziert xd keine ahnung"
   (25.10.2026). Seitdem weicht der Server selbst aus. Diese Logik wird
   hier AUSGEFUEHRT – mit einer nachgebauten Datenbank, die genau die
   Fehler wirft, die live aufgetreten sind. */
function ortLogik() {
  /* Den Block aus der Quelle holen und ausfuehren: exportiert ist er
     nicht, und exportiert werden soll er auch nicht, nur zum Pruefen.
     Jeder Aufruf gibt einen frischen Satz – sonst merkt sich der zweite
     Fall den Ort aus dem ersten. */
  const block = (quelle.match(/let teilenOrt = null;[\s\S]*?return 'bv';\n\}/) || [''])[0];
  return new Function(block +
    "\nreturn { teilenOrtFinden, teilenOrtSuchen, TEILEN_SQL, teilenFehlerNr };")();
}

/* Eine Datenbank, die nur so tut. Sie merkt sich, was gefragt wurde. */
function datenbank(regeln) {
  const verlauf = [];
  const sql = function (teile) {
    const text = teile.join(' ? ').replace(/\s+/g, ' ').trim();
    verlauf.push(text);
    for (const r of regeln) {
      if (r.muster.test(text)) {
        if (r.fehler) {
          const e = new Error('nachgebaut'); e.code = r.fehler;
          return Promise.reject(e);
        }
        return Promise.resolve(r.zeilen || []);
      }
    }
    const e = new Error('unerwartete Abfrage: ' + text); e.code = 'XX000';
    return Promise.reject(e);
  };
  sql.verlauf = verlauf;
  return sql;
}

const FEHLT   = '42P01';   // Tabelle gibt es nicht
const KEIN_SCHEMA = '3F000';
const GESPERRT = '42501';  // keine Rechte

{
  /* Fall 1: alles normal – die Tabelle steht in „public". */
  const L = ortLogik();
  /* Gegenprobe: die Tabelle ist WEG – dann darf „public" nicht
     herauskommen, ohne dass etwas angelegt wurde. */
  const db = datenbank(gegen
    ? [{ muster: /^select 1 from teilen_links/, fehler: FEHLT },
        { muster: /^select 1 from bv\./, fehler: KEIN_SCHEMA },
        { muster: /./, zeilen: [] }]
    : [{ muster: /^select 1 from teilen_links/, zeilen: [] }]);
  let ort = null;
  try { ort = await L.teilenOrtFinden(db); } catch (e) { ort = 'Abbruch'; }
  pruefe('Steht die Tabelle in „public", bleibt alles wie bisher',
         ort === 'public' && !db.verlauf.some((t) => /create/i.test(t)),
         'Ort: ' + ort + ', ' + db.verlauf.length + ' Abfrage(n), kein CREATE');
  pruefe('Dann wird nichts angelegt',
         !db.verlauf.some((t) => /create/i.test(t)),
         'eine bestehende Tabelle wird nicht angefasst');
}

{
  /* Fall 2: genau die Lage auf dem Server – Tabelle fehlt, und „public"
     ist fuer die Rolle verschlossen (PostgreSQL 15). */
  const L = ortLogik();
  const db = datenbank([
    { muster: /^select 1 from teilen_links/,    fehler: FEHLT },
    { muster: /^select 1 from bv\.teilen_links/, fehler: KEIN_SCHEMA },
    { muster: /^create table if not exists teilen_links/, fehler: GESPERRT },
    /* Gegenprobe: auch das eigene Schema ist verboten – dann gibt es
       keinen Ort mehr, und das muss auffallen. */
    { muster: /^create schema if not exists bv/,
      fehler: gegen ? GESPERRT : null, zeilen: [] },
    { muster: /^create table if not exists bv\.teilen_links/, zeilen: [] }
  ]);
  let ort = null, kaputt = null;
  try { ort = await L.teilenOrtFinden(db); } catch (e) { kaputt = e; }
  pruefe('Ist „public" verschlossen, legt sich der Server ein eigenes Fach an',
         ort === 'bv',
         kaputt ? 'Abbruch: ' + kaputt.message : 'Ort: ' + ort);
  const machte = db.verlauf.some((t) => /^create schema if not exists bv/.test(t)) &&
                 db.verlauf.some((t) => /^create table if not exists bv\.teilen_links/.test(t));
  pruefe('Dafür legt er Schema und Tabelle wirklich an',
         machte,
         db.verlauf.length + ' Schritte bis zum Ziel');
}

{
  /* Fall 3: die Datenbank antwortet gar nicht. Dann darf nichts
     abstuerzen, und der Fehler muss NACH AUSSEN als Nummer sichtbar
     sein – ohne Zugang zu den Server-Protokollen ist er sonst nicht
     auffindbar. Genau daran hat diese Suche zwei Tage gehangen. */
  const L = ortLogik();
  const db = datenbank([{ muster: /./, fehler: '28P01' }]);
  let nr = null;
  try { await L.teilenOrtFinden(db); } catch (e) { nr = L.teilenFehlerNr(e); }
  pruefe('Ein Datenbankfehler kommt als Nummer zurück, nicht als Text',
         gegen ? nr !== '28P01' : nr === '28P01',
         'Nummer ' + nr + ' – ohne Rollen-, Host- oder Tabellennamen');
  /* Gemessen am fertigen Antwort-Aufruf, nicht am Quelltext drumherum:
     console.log(String(err)) ist richtig und soll bleiben – nur in
     jsonResponse(...) darf der Fehler nicht auftauchen. */
  const rumpf = (quelle.match(/async function handleTeilenNeu[\s\S]*?\n\}/) || [''])[0];
  const antworten = rumpf.match(/jsonResponse\(\{[^}]*\}/g) || [];
  /* Gegenprobe: eine erfundene Antwort, die den Fehler durchreicht –
     wird sie nicht beanstandet, prüft diese Prüfung nichts. */
  if (gegen) antworten.push("jsonResponse({ ok: false, text: String(err) }");
  /* teilenFehlerNr(err) ist erlaubt und gewollt – das gibt nur die
     fünfstellige Nummer heraus, geprüft eine Zeile weiter oben. Alles
     andere, was aus dem Fehler stammt, ist Text und darf nicht raus. */
  const verraet = antworten
    .map((a) => a.replace(/teilenFehlerNr\(err\)/g, 'NR'))
    .filter((a) => /\berr\b|String\(/.test(a));
  pruefe('Der Meldungstext geht nie an den Besucher',
         antworten.length >= 4 && verraet.length === 0,
         antworten.length + ' Antworten geprüft' +
         (verraet.length ? ': ' + verraet[0] : ', nur ok/schritt/nr/message'));
}

{
  /* Beide Satzgruppen muessen auch wirklich den Ort treffen, den sie
     versprechen. Gelesen wird der fertige Befehl, nicht der Quelltext. */
  const L = ortLogik();
  const db = datenbank([{ muster: /./, zeilen: [] }]);
  for (const schluessel of ['nachHash', 'nachId', 'code', 'beruehren']) {
    await L.TEILEN_SQL.public[schluessel](db, 'X');
    await L.TEILEN_SQL.bv[schluessel](db, 'X');
  }
  await L.TEILEN_SQL.public.einfuegen(db, 'A', 'B', 'C');
  await L.TEILEN_SQL.bv.einfuegen(db, 'A', 'B', 'C');
  const bvAlle = db.verlauf.filter((_, i) => i % 2 === 1)
                   .every((t) => /bv\.teilen_links/.test(t));
  const pubAlle = db.verlauf.filter((_, i) => i % 2 === 0)
                   .every((t) => /teilen_links/.test(t) && !/bv\.teilen_links/.test(t));
  pruefe('Jede Abfrage trifft das Fach, zu dem sie gehört',
         gegen ? !(bvAlle && pubAlle) : (bvAlle && pubAlle),
         db.verlauf.length + ' Befehle gegengelesen');
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
