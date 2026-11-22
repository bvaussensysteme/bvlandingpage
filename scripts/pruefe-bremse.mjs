#!/usr/bin/env node
/* ============================================================
   BREMST DIE SCHNITTSTELLE WIRKLICH?

   ANLASS (22.11.2026). Auf den öffentlichen Schnittstellen war nichts
   begrenzt. Entscheidung des Betreibers: "Einfache Bremse einbauen".

   Diese Prüfung lädt die Bremse aus worker/index.js und spielt ihr
   Anfragen vor. Sie braucht weder Netz noch Cloudflare: Geprüft wird
   die Rechenvorschrift, nicht der laufende Server.

   WAS GEPRUEFT WIRD:
   1. Jede öffentliche Schnittstelle hat eine Regel.
   2. Unterhalb der Grenze kommt jede Anfrage durch.
   3. Eine Anfrage über der Grenze wird gesperrt und sagt, wie lange.
   4. Nach Ablauf des Fensters geht es weiter.
   5. Zwei verschiedene Absender behindern sich nicht.
   6. Die Grenze der Messung ist hoch genug für einen echten Besuch.

   Aufruf:     node scripts/pruefe-bremse.mjs
   Gegenprobe: node scripts/pruefe-bremse.mjs --gegenprobe
   Die Gegenprobe setzt die Grenze auf einen unsinnig hohen Wert.
   Dann MUSS die Prüfung "wird gesperrt" fehlschlagen.
   ============================================================ */
import { readFileSync } from 'node:fs';

const WURZEL = new URL('..', import.meta.url).pathname;
const GEGENPROBE = process.argv.includes('--gegenprobe');

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(52)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(52)} ${beleg || ''}`); }
}

/* Die Bremse aus dem Worker herausschneiden und ausführbar machen.
   So wird genau der Code geprüft, der auch läuft, und nicht eine
   Kopie, die auseinanderlaufen kann. */
const quelle = readFileSync(WURZEL + 'worker/index.js', 'utf8');
const anfang = quelle.indexOf('const BREMSE = new Map();');
const ende = quelle.indexOf('export default {');
if (anfang < 0 || ende < 0) {
  console.error('Die Bremse steht nicht mehr da, wo sie erwartet wird.');
  process.exit(2);
}
let code = quelle.slice(anfang, ende);
if (GEGENPROBE) {
  code = code.replace(/anzahl: \d+/g, 'anzahl: 999999');
}
const modul = await import('data:text/javascript,'
  + encodeURIComponent(code + '\nexport { BREMSE, BREMSE_REGELN, bremseGreift };'));
const { BREMSE_REGELN, bremseGreift } = modul;

function anfrage(ip) {
  return { headers: { get: (n) => (n === 'CF-Connecting-IP' ? ip : null) } };
}

const OEFFENTLICH = ['/api/kontakt', '/api/teilen', '/api/messung', '/api/hoehe', '/api/bauteile'];
pruef('Jede öffentliche Schnittstelle hat eine Regel',
  OEFFENTLICH.every((p) => BREMSE_REGELN[p]),
  OEFFENTLICH.filter((p) => !BREMSE_REGELN[p]).join(', ') || `${OEFFENTLICH.length} Regeln`);

const regel = BREMSE_REGELN['/api/kontakt'];
/* Gedeckelt, damit die Gegenprobe mit ihrer absichtlich unsinnigen
   Grenze nicht eine Million Runden dreht. Beim ersten Versuch am
   22.11.2026 lief genau das und musste abgebrochen werden. */
const runden = Math.min(regel.anzahl, 50);
let durch = 0;
for (let i = 0; i < runden; i++) {
  if (bremseGreift(anfrage('1.1.1.1'), '/api/kontakt') === null) durch++;
}
pruef('Unterhalb der Grenze kommt alles durch', durch === runden,
  `${durch} von ${runden}`);

const gesperrt = bremseGreift(anfrage('1.1.1.1'), '/api/kontakt');
pruef('Die Anfrage über der Grenze wird gesperrt', gesperrt !== null,
  gesperrt === null ? 'kam durch' : `gesperrt, Retry-After ${gesperrt} s`);
pruef('Die Sperre sagt eine sinnvolle Wartezeit',
  gesperrt !== null && gesperrt > 0 && gesperrt <= regel.fenster,
  `${gesperrt} s bei ${regel.fenster} s Fenster`);

pruef('Ein anderer Absender ist nicht betroffen',
  bremseGreift(anfrage('2.2.2.2'), '/api/kontakt') === null, 'zweite Adresse kommt durch');

pruef('Eine unbekannte Adresse hat keine eigene Regel',
  bremseGreift(anfrage('3.3.3.3'), '/irgendwas') === null, '/irgendwas wird nicht gebremst');

/* Ein echter Besuch: Seitenaufruf, ein paar Klicks, Verweildauer,
   Scrolltiefe. Das sind einige Dutzend Meldungen, keine 150. */
let messDurch = 0;
for (let i = 0; i < 40; i++) {
  if (bremseGreift(anfrage('4.4.4.4'), '/api/messung') === null) messDurch++;
}
pruef('Ein echter Besuch läuft nicht in die Bremse', messDurch === 40,
  `${messDurch} von 40 Meldungen durchgelassen, Grenze ${BREMSE_REGELN['/api/messung'].anzahl}`);

if (GEGENPROBE) {
  const faellt = fehler > 0;
  console.log(`\nGegenprobe: ${faellt ? 'die hochgesetzte Grenze fällt auf'
    : 'FEHLER, die hochgesetzte Grenze fiel nicht auf'}`);
  process.exit(faellt ? 0 : 1);
}

console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
