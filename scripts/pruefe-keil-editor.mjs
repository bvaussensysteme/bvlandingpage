#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft den Keil-Editor.

   ANLASS (05.11.2026, Betreiber): "wenn man einen keil aktiviert hat,
   kann man diesen entweder im 3d modell anklicken und somit auswaehlen,
   oder man hat im menue am keil ein zahnrad ... man kann dann hoehe in
   mm H1 und H2 angeben, die Breite B kommt ja automatisch vom modell
   ... dann kann man auswaehlen ob die felder gleichmaessig sein sollen
   oder individuell ... und die auswahl soll man fuer jedes feld machen
   koennen".

   GEPRUEFT WIRD DAS ERGEBNIS IM MODELL, nicht nur die Oberflaeche. Ein
   Editor, dessen Wahl das Bild nicht erreicht, ist eine Attrappe - und
   genau das waere mit einer reinen Oberflaechenpruefung nicht
   aufgefallen. Darum zaehlt dieses Skript die Scheiben, die wirklich
   gebaut werden, ueber einen eingespritzten Lesehaken.

   Gegenprobe: node scripts/pruefe-keil-editor.mjs --gegenprobe
   --------------------------------------------------------------- */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGENPROBE = process.argv.includes('--gegenprobe');
/* ---------- Einen Fehler allein einbauen ----------
   BV_FEHLER=3 node scripts/pruefe-keil-editor.mjs --gegenprobe

   Noetig geworden am 05.11.2026: Mit allen Fehlern auf einmal
   zerfaellt die Zeichnung so weit, dass die Kantenpruefung ins Leere
   laeuft - sie blieb gruen, obwohl ihr Fehler eingebaut war. Ein
   Fehler kann einen anderen verdecken. Wer eine neue Pruefung
   hinzufuegt, sollte ihren Fehler EINZELN laufen lassen. */
const NUR = process.env.BV_FEHLER ? parseInt(process.env.BV_FEHLER, 10) : null;
const PORT = 8277;
const WURZEL = new URL('..', import.meta.url).pathname;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

/* Jeder Fehler muss GENAU EINE Pruefung rot machen, und jeder Anker
   muss genau einmal vorkommen - sonst landet der Fehler woanders und
   die Gegenprobe meldet faelschlich "blind". */
const FEHLER = [
  { von: "  var KEIL_GLAS = [\n    'Ohne Glas',",
    nach: "  var KEIL_GLAS = [\n    'Platzhalter'," },
  { von: "    { id: '8',   spalten: 4, reihen: 2, name: '8-teilig' }",
    nach: "" },
  { von: "    if (!name || name === 'Ohne Glas') return null;",
    nach: "    if (!name) return null;" },
  /* Die Messung selbst abschalten. Der erste Entwurf traf stattdessen
     keilMassWirksam() - die Breite im Editor kommt aber aus
     keilEditorMass(), und so blieb der Fehler folgenlos: sieben
     eingebaute Fehler, sechs rote Pruefungen. */
  { von: "          keilMassGemerkt[seite] = { b: Math.round(keilLaenge * 10),",
    nach: "          keilMassGemerkt[seite] = { b: 0," },
  { von: "        !keilGeklickt(e) &&\n", nach: "" },
  /* ANKER NACHGEZOGEN am 05.11.2026: Die Zeile wurde beim Einbau der
     Mindestoeffnung umgeschrieben. Der alte Anker fand nichts mehr -
     der Fehler kam gar nicht an, und die Gegenprobe meldete ihn als
     blind. Darum steht unten der Abbruch bei fehlendem Anker. */
  { von: "            p.h1 = v; p.h2 = v - ab - vs;",
    nach: "            p.h1 = v;" },
  { von: "          pv.h2 = pv.h1 - keilAbfall(keilEditorSeite) - pv.versatz;",
    nach: "          pv.h2 = pv.h1 - keilAbfall(keilEditorSeite);" },
  /* Der Bezugsfehler, der die Linien kreuzen liess. */
  { von: "    var h2Abs = Math.max(1, mass.h2 + vMm);",
    nach: "    var h2Abs = Math.max(1, mass.h2);" },
  /* Die Grenze am Hoehenfeld - das zweite Loch. */
  { von: "            if (v < ab + vs + 50) { v = ab + vs + 50; f.value = String(v); }",
    nach: "            if (v < -99999) { v = ab + vs + 50; f.value = String(v); }" },
];

/* Zwei Lesehaken, beide NUR lesend und nur im Test: eine Liste der
   wirklich gebauten Scheiben, und die Bildschirmlage einer davon.
   Die Lage wird GERECHNET, nicht geraten - beim Pfosten-Zeichen hat
   das Raten am 04.11.2026 einen halben Abend gekostet. */
const MESSHAKEN = {
  von: "                kf.userData.keilFeld = kNr;",
  nach: "                kf.userData.keilFeld = kNr;\n"
      + "                (window.__bvKeilScheiben = window.__bvKeilScheiben || []).push(seite + ':' + kNr);\n"
      + "                window.__bvKeilPunkt = (function (mesh) { return function () {\n"
      + "                  mesh.geometry.computeBoundingSphere();\n"
      + "                  var c = mesh.geometry.boundingSphere.center.clone();\n"
      + "                  mesh.localToWorld(c); c.project(kamera3);\n"
      + "                  var r = leinwand.getBoundingClientRect();\n"
      + "                  return { x: r.left + (c.x + 1) / 2 * r.width,\n"
      + "                           y: r.top + (1 - (c.y + 1) / 2) * r.height }; }; })(kf);"
};

/* Ein Anker, der nichts mehr findet, laesst den Fehler gar nicht
   ankommen - und die Gegenprobe meldet dann faelschlich eine blinde
   Pruefung (oder, schlimmer, gar nichts). Das MUSS den Lauf scheitern
   lassen: process.exitCode genuegt nicht, weil process.exit() am Ende
   ihn ueberschreibt. */
let ankerKaputt = false;
let ok = 0; const rot = [];
function pruefe(was, bedingung, beleg) {
  if (bedingung) { ok++; console.log(`  ok      ${was}`); }
  else { rot.push(was); console.log(`  FEHLER  ${was}${beleg ? '  (' + beleg + ')' : ''}`); }
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const browser = await chromium.launch({
  executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });

/* EIN Handler je Adresse. Der Lesehaken geht IMMER mit, die Fehler nur
   in der Gegenprobe - beides durch denselben Handler, sonst hebt die
   zweite Route die erste auf und nichts kommt an. */
await ctx.route('**/*', async (route) => {
  const pfad = new URL(route.request().url()).pathname;
  if (!pfad.endsWith('/js/konfigurator-3d.js')) return route.continue();
  const antwort = await route.fetch();
  let text = await antwort.text();
  const anwenden = (f) => {
    const n = text.split(f.von).length - 1;
    if (n !== 1) {
      console.error(`  !! Anker kommt ${n}x vor (erwartet 1x): ${f.von.slice(0, 50)}`);
      ankerKaputt = true;
    }
    text = text.replace(f.von, f.nach);
  };
  anwenden(MESSHAKEN);
  if (GEGENPROBE) {
    (NUR == null ? FEHLER : [FEHLER[NUR]]).filter(Boolean).forEach(anwenden);
  }
  return route.fulfill({ response: antwort, body: text });
});

const p = await ctx.newPage();
const seitenfehler = [];
p.on('pageerror', (e) => seitenfehler.push(String(e)));
await p.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await p.waitForTimeout(800);

console.log(`\n=== Keil-Editor ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

/* In den Bereich "Seiten" - sonst ist die Gruppe verborgen, und das
   Zahnrad waere zu Recht unsichtbar. */
await p.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s) s.click();
});
await p.waitForTimeout(800);

const radVorher = await p.evaluate(() => {
  const k = document.querySelector('[data-k3d-keil-rad]');
  return !!(k && !k.hidden);
});
pruefe('Ohne Keil gibt es kein Zahnrad', !radVorher, 'ein Knopf ohne Keil waere eine falsche Zusage');

await p.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Keil"]');
  if (b) b.click();
});
await p.waitForTimeout(1500);

const radNachher = await p.evaluate(() => {
  const k = document.querySelector('[data-k3d-keil-rad]');
  return !!(k && !k.hidden && k.offsetParent);
});
pruefe('Mit Keil erscheint das Zahnrad', radNachher);

await p.click('[data-k3d-keil-rad]');
await p.waitForTimeout(700);

const auf = await p.evaluate(() => {
  const d = document.getElementById('k3dKeilDialog');
  return {
    offen: !!(d && !d.hidden),
    kacheln: document.querySelectorAll('#k3dKeilTeilungen button').length,
    b: (document.getElementById('k3dKeilB') || {}).value,
    h1: (document.getElementById('k3dKeilH1') || {}).value,
    h2: (document.getElementById('k3dKeilH2') || {}).value,
    glasOptionen: [...document.querySelectorAll('#k3dKeilGlas0 option')].map((o) => o.value),
  };
});
pruefe('Das Zahnrad oeffnet den Editor', auf.offen);
pruefe('Alle acht Teilungen stehen zur Wahl', auf.kacheln === 8, `${auf.kacheln} Kacheln`);
pruefe('Die Breite kommt aus dem Modell', /^\d{3,5}$/.test(String(auf.b)), `B = ${auf.b}`);
pruefe('H1 und H2 sind aus dem Modell vorbelegt',
  /^\d+$/.test(String(auf.h1)) && /^\d+$/.test(String(auf.h2)), `H1 ${auf.h1}, H2 ${auf.h2}`);
pruefe('"Ohne Glas" steht zur Wahl',
  auf.glasOptionen.indexOf('Ohne Glas') > -1, auf.glasOptionen.join(', '));

/* ---------- Teilung wirkt auf Zeichnung, Liste UND Modell ---------- */
async function scheibenZaehlen() {
  await p.evaluate(() => { window.__bvKeilScheiben = []; });
  /* Ein Neuzeichnen ausloesen, ohne etwas zu veraendern: dieselbe
     Teilung noch einmal waehlen. */
  await p.evaluate(() => {
    const an = document.querySelector('#k3dKeilTeilungen button.ist-an');
    if (an) an.click();
  });
  await p.waitForTimeout(900);
  /* VERSCHIEDENE Felder zaehlen, nicht Eintraege: Ein Klick loest zwei
     Renderdurchgaenge aus (der Knopf ruft aendern(), und das
     Neuzeichnen des Dialogs tut es auch). Gezaehlt wurden dadurch
     sechs Scheiben statt drei - der Fehler lag im Test, nicht im
     Modell. */
  return p.evaluate(() =>
    new Set(window.__bvKeilScheiben || []).size);
}

await p.click('#k3dKeilTeilungen button[data-teilung="4s"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(900);
const vier = await p.evaluate(() => ({
  skizze: document.querySelectorAll('#k3dKeilSkizze .k3d-keil-feld').length,
  zeilen: document.querySelectorAll('#k3dKeilGlasFelder .k3d-keil-glaszeile').length,
}));
pruefe('4-teilig: vier Felder in der Zeichnung', vier.skizze === 4, `${vier.skizze}`);
pruefe('4-teilig: vier Zeilen fuer das Glas', vier.zeilen === 4, `${vier.zeilen}`);
const scheiben4 = await scheibenZaehlen();
pruefe('4-teilig: vier Scheiben im Modell', scheiben4 === 4, `${scheiben4} Scheiben`);

/* ---------- Glas je Feld ---------- */
/* Jeder Bedienschritt einzeln abgesichert. In der Gegenprobe sind
   Fehler eingebaut, die genau diese Schritte unmoeglich machen - ohne
   catch bricht der Lauf ab, und eine Pruefung, die nicht bis zum Ende
   kommt, meldet nichts. Sie soll ROT werden, nicht abstuerzen. */
async function waehle(id, wert) {
  await p.selectOption(id, wert, { timeout: 4000 }).catch(() => {});
}
await waehle('#k3dKeilGlas0', 'VSG Glas klar');
await waehle('#k3dKeilGlas1', 'FRF23 Glas opal');
await waehle('#k3dKeilGlas2', 'VSG Glas grau');
await waehle('#k3dKeilGlas3', 'Ohne Glas');
await p.waitForTimeout(900);
const scheibenOhne = await scheibenZaehlen();
pruefe('"Ohne Glas" laesst das Feld wirklich leer', scheibenOhne === 3,
  `${scheibenOhne} Scheiben statt 3 - eine fast durchsichtige Scheibe waere eine Luege`);

/* ---------- Feld 1 fuer alle ---------- */
await p.click('#k3dKeilGlasAlle', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);
const alleGleich = await p.evaluate(() =>
  [...document.querySelectorAll('#k3dKeilGlasFelder select')].map((s) => s.value));
pruefe('"Feld 1 fuer alle uebernehmen" setzt jedes Feld',
  alleGleich.every((v) => v === 'VSG Glas klar'), alleGleich.join(' / '));
const scheibenAlle = await scheibenZaehlen();
pruefe('Danach stehen wieder vier Scheiben im Modell', scheibenAlle === 4, `${scheibenAlle}`);

/* ---------- Ausgewaehltes Feld ---------- */
await p.evaluate(() => {
  document.querySelectorAll('#k3dKeilSkizze .k3d-keil-feld')[2]
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
const wahl = await p.evaluate(() => ({
  gedrueckt: [...document.querySelectorAll('#k3dKeilSkizze .k3d-keil-feld')]
    .map((g) => g.getAttribute('aria-pressed')),
  zeilen: [...document.querySelectorAll('#k3dKeilGlasFelder .k3d-keil-glaszeile')]
    .map((z) => z.classList.contains('ist-an')),
}));
pruefe('Ein Klick in der Zeichnung waehlt genau ein Feld',
  wahl.gedrueckt.filter((v) => v === 'true').length === 1 && wahl.gedrueckt[2] === 'true',
  wahl.gedrueckt.join(','));
pruefe('Die Glaszeile desselben Feldes ist hervorgehoben',
  wahl.zeilen.filter(Boolean).length === 1 && wahl.zeilen[2] === true,
  wahl.zeilen.join(','));

/* ---------- H1 und H2 haengen zusammen ----------
   "wenn bei versatz nix eingetragen wird, muss die unterseite waagrecht
   fest bleiben, das heisst es kann passieren wenn man h1 eintraegt das
   h2 sich mit anpasst" (Betreiber, 05.11.2026). Die Dachschraege ist
   fest - mit einer Hoehe ist die andere bestimmt. */
const vorher = await p.evaluate(() => ({
  h1: +document.getElementById('k3dKeilH1').value,
  h2: +document.getElementById('k3dKeilH2').value
}));
const abfall = vorher.h1 - vorher.h2;
/* Nur 20 mm absenken. Mit 100 lag H2 anschliessend genau auf der
   Mindestoeffnung von 50 mm, und jeder Versatz wurde danach zu Recht
   auf null begrenzt - die naechste Pruefung haette dann nicht den
   Versatz geprueft, sondern die Begrenzung. */
await p.fill('#k3dKeilH1', String(vorher.h1 - 20), { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);
const nachH1 = await p.evaluate(() => ({
  h1: +document.getElementById('k3dKeilH1').value,
  h2: +document.getElementById('k3dKeilH2').value
}));
pruefe('H2 passt sich an, wenn H1 eingetragen wird',
  nachH1.h2 === nachH1.h1 - abfall,
  `H1 ${nachH1.h1}, H2 ${nachH1.h2}, erwartet H2 ${nachH1.h1 - abfall}`);

/* Der Versatz hebt die Unterkante vorne an - H2 wird um genau diesen
   Betrag kleiner. */
await p.fill('#k3dKeilV', '30', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);
const nachV = await p.evaluate(() => +document.getElementById('k3dKeilH2').value);
pruefe('Ein Versatz unten verkleinert H2 um genau sein Mass',
  nachV === nachH1.h2 - 30, `H2 ${nachV}, erwartet ${nachH1.h2 - 30}`);

/* Und er hat eine Obergrenze. Ohne sie schnitt die angehobene
   Unterkante die Dachschraege: Die Zeichnung zerfiel in sich
   ueberschneidende Flaechen, das Modell haette Scheiben mit negativer
   Hoehe gebaut (gemessen am 05.11.2026 mit V = 250 bei H2 = 150). */
await p.fill('#k3dKeilV', '99999', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);
const begrenzt = await p.evaluate(() => ({
  v: +document.getElementById('k3dKeilV').value,
  h2: +document.getElementById('k3dKeilH2').value,
  hinweis: (document.getElementById('k3dKeilVHinweis') || {}).textContent || ''
}));
pruefe('Ein zu grosser Versatz wird begrenzt, nicht gebaut',
  begrenzt.h2 >= 50 && begrenzt.v < 99999 && /h\u00f6chstens/.test(begrenzt.hinweis),
  `V ${begrenzt.v}, H2 ${begrenzt.h2}`);
await p.fill('#k3dKeilV', '', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(600);

/* ---------- Die Kanten duerfen sich nie kreuzen ----------
   "da is ein fehler es ueberschneiden sich die linien wenn man versatz
   auswaehlt" (Betreiber, 05.11.2026). Ursache war der Bezug: H2 ist
   die LICHTE Hoehe ueber der angehobenen Unterkante, wurde aber von
   der Grundlinie aus abgetragen.

   GEPRUEFT WIRD DIE ZEICHNUNG SELBST, nicht die Rechnung dahinter:
   Jedes Feld ist ein Viereck aus oben-links, oben-rechts, unten-rechts,
   unten-links. Liegt eine Oberkante auf oder unter ihrer Unterkante,
   kreuzen sich die Linien. */
async function kantenPruefen() {
  return p.evaluate(() => {
    const g = [...document.querySelectorAll('#k3dKeilSkizze .k3d-keil-feld polygon')];
    const schlimm = [];
    g.forEach((pg, i) => {
      const pts = pg.getAttribute('points').trim().split(/\s+/).map((t) => t.split(',').map(Number));
      const [ol, or_, ur, ul] = pts;
      if (ol[1] >= ul[1] - 0.5 || or_[1] >= ur[1] - 0.5) schlimm.push(i + 1);
    });
    return schlimm;
  });
}
await p.fill('#k3dKeilV', '400', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(800);
const kreuzV = await kantenPruefen();
pruefe('Mit Versatz kreuzen sich die Kanten nicht', kreuzV.length === 0,
  'Felder mit gekreuzten Kanten: ' + kreuzV.join(', '));

/* Derselbe Zustand ueber den anderen Weg: erst Versatz, DANN H1
   absenken. Die Begrenzung sass zuerst nur am Versatzfeld - ein Loch,
   das nicht an der Stelle sass, an der es auffiel. */
const vorH1 = await p.evaluate(() => +document.getElementById('k3dKeilH1').value);
await p.fill('#k3dKeilH1', '60', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(800);
const kreuzH = await kantenPruefen();
const h2Rest = await p.evaluate(() => +document.getElementById('k3dKeilH2').value);
pruefe('Auch ein zu kleines H1 nach einem Versatz kreuzt nichts',
  kreuzH.length === 0 && h2Rest >= 50,
  'gekreuzt: ' + (kreuzH.join(', ') || 'keins') + ', H2 ' + h2Rest);
await p.fill('#k3dKeilV', '', { timeout: 4000 }).catch(() => {});
await p.fill('#k3dKeilH1', String(vorH1), { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);

/* ---------- Abweichende Masse werden benannt ---------- */
await p.fill('#k3dKeilH1', '300', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);
const warn = await p.evaluate(() => {
  const w = document.getElementById('k3dKeilWarnung');
  return { sichtbar: !!(w && !w.hidden), text: w ? w.textContent : '' };
});
pruefe('Eine Abweichung vom Modell wird benannt, nicht verschwiegen',
  warn.sichtbar && /Spalt|hinaus/.test(warn.text), warn.text.slice(0, 70));
await p.click('#k3dKeilMasseZurueck', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(700);

/* Dialog zu, damit er den Klick ins Modell nicht abfaengt. */
await p.evaluate(() => { const d = document.getElementById('k3dKeilDialog'); if (d) d.hidden = true; });
await p.waitForTimeout(600);

/* ---------- Der Keil im Modell oeffnet den Editor ---------- */
const trefferPunkt = await p.evaluate(() => {
  /* Den Mittelpunkt einer gebauten Keilscheibe auf den Bildschirm
     rechnen - nicht raten, wo der Keil liegt. */
  if (!window.__bvKeilPunkt) return null;
  return window.__bvKeilPunkt();
});
if (trefferPunkt) {
  await p.mouse.click(trefferPunkt.x, trefferPunkt.y);
  await p.waitForTimeout(800);
  const offen = await p.evaluate(() => {
    const d = document.getElementById('k3dKeilDialog');
    return !!(d && !d.hidden);
  });
  pruefe('Ein Klick auf den Keil im Modell oeffnet den Editor', offen);
} else {
  pruefe('Ein Klick auf den Keil im Modell oeffnet den Editor', false,
    'Messpunkt nicht verfuegbar');
}

pruefe('Keine Fehler im Browser', seitenfehler.length === 0, seitenfehler.slice(0, 2).join(' | '));

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  if (ankerKaputt) {
    console.log('ANKER VERALTET – mindestens ein Fehler kam nicht an.');
    process.exit(1);
  }
  const zahl = NUR == null ? FEHLER.length : 1;
  console.log(`Gegenprobe: ${zahl} Fehler eingebaut${NUR == null ? '' : ' (Nr. ' + NUR + ')'}, `
    + `${rot.length} Pruefungen schlagen an.`);
  if (rot.length < zahl) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
