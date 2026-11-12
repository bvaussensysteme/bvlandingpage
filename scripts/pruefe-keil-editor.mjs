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
/* Dasselbe fuer die Fehler, die im CSS/Markup der Seite stecken. Ohne
   das liefen sie nur im Sammellauf mit, und ob JEDER von ihnen eine
   Pruefung rot macht, war nie gemessen - eine Luecke in der Gegenprobe
   selbst (05.11.2026). */
const NUR_CSS = process.env.BV_CSS_FEHLER ? parseInt(process.env.BV_CSS_FEHLER, 10) : null;
const EINZELN = NUR != null || NUR_CSS != null;
const PORT = 8277;
const WURZEL = new URL('..', import.meta.url).pathname;

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
  return o.length ? chromeIn(`${basis}/${o[o.length - 1]}`) : undefined;
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
  /* ANKER NACHGEZOGEN 05.11.2026: Das Setzen steckt jetzt in setzen(). */
  { von: "        if (schluessel === 'h1') { g.p.h1 = v; g.p.h2 = v - g.ab - g.vs; }",
    nach: "        if (schluessel === 'h1') { g.p.h1 = v; }" },
  /* ANKER MIT NACHBARZEILE 05.11.2026: Dieselbe Zeile steht jetzt
     zweimal - einmal beim Tippen, einmal beim Verlassen des Feldes. */
  { von: "        pv.versatz = neu;\n        if (pv.h1 != null) {\n          pv.h2 = pv.h1 - keilAbfall(keilEditorSeite) - pv.versatz;",
    nach: "        pv.versatz = neu;\n        if (pv.h1 != null) {\n          pv.h2 = pv.h1 - keilAbfall(keilEditorSeite);" },
  /* Die Sperre zu kleiner Teilungen. */
  { von: "    if (t.reihen > reihen) {", nach: "    if (false) {" },
  /* Die belegte Mindesthoehe vorne. */
  { von: "  var KEIL_MIN_VORNE = 150;   // mm, BELEGT",
    nach: "  var KEIL_MIN_VORNE = 1;   // mm, BELEGT" },
  /* Die Zuordnung der alten Glasnamen. */
  { von: "    return KEIL_GLAS_ALT[g] || g;", nach: "    return g;" },
  /* Der Bezugsfehler, der die Linien kreuzen liess. */
  { von: "    var h2Abs = Math.max(1, mass.h2 + vMm);",
    nach: "    var h2Abs = Math.max(1, mass.h2);" },
  /* Das Hoehenfeld klemmt wieder beim Tippen - der Fehler, den der
     Betreiber am iPhone gesehen hat. */
  { von: "        if (v < g.min || (g.max && v > g.max)) return;",
    nach: "        if (v < g.min) { v = g.min; f.value = String(v); }" },
  /* Die Einheit der Mindesthoehe - genau der Fehler vom 05.11.2026. */
  { von: "        var hoechstens = dachUk(zHoehenBezug) - keilVorneMm / 10 - yUnten - fuehrungH;",
    nach: "        var hoechstens = dachUk(zHoehenBezug) - keilVorneMm - yUnten - fuehrungH;" },
  /* Die Wand richtet sich wieder nach der Mindesthoehe statt nach dem
     eingestellten Keil - sichtbar erst bei eigener Hoehe. */
  { von: "          ? Math.max(KEIL_MIN_VORNE, kPlanHoehe.h2) : KEIL_MIN_VORNE;",
    nach: "          ? KEIL_MIN_VORNE : KEIL_MIN_VORNE;" },
  /* Die Grenze am Hoehenfeld - das zweite Loch. */
  /* ANKER NACHGEZOGEN am 05.11.2026: Aus den geratenen 50 mm wurde die
     belegte Grenze KEIL_MIN_VORNE (150 mm). */
  /* ANKER NACHGEZOGEN 05.11.2026: Die Grenzen stehen jetzt in grenzen(). */
  { von: "        var min = (schluessel === 'h1') ? ab + vs + KEIL_MIN_VORNE : KEIL_MIN_VORNE;",
    nach: "        var min = 0;" },
];

/* Der Handy-Fehler steckt im CSS, nicht im JavaScript: Der Dialog
   zurueck in den Stapelkontext des 3D-Bildes. */
const CSS_FEHLER = [
  { von: '      position: fixed; inset: 0; z-index: 200;',
    nach: '      position: absolute; inset: 0; z-index: 60;' },
  /* Das Breitenfeld faellt wieder aus der Familie. */
  { von: '<input type="text" id="k3dKeilB" class="k3d-zahl" readonly',
    nach: '<input type="text" id="k3dKeilB" readonly' },
  /* Die Einheit faengt den Tipper ab. */
  { von: 'font-size: .78rem; color: var(--muted); pointer-events: none;',
    nach: 'font-size: .78rem; color: var(--muted);' },
  /* Das (Optional) am Versatz faellt weg. */
  { von: '                  <span class="k3d-bearb-opt">(Optional)</span></label>',
    nach: '                  </label>' },
  /* Eine Einheit fehlt. */
  { von: '<span class="k3d-bearb-einheit" aria-hidden="true">mm</span>\n                </span>\n                <p class="k3d-mini" id="k3dKeilBHinweis">',
    nach: '\n                </span>\n                <p class="k3d-mini" id="k3dKeilBHinweis">' }
];

/* Zwei Lesehaken, beide NUR lesend und nur im Test: eine Liste der
   wirklich gebauten Scheiben, und die Bildschirmlage einer davon.
   Die Lage wird GERECHNET, nicht geraten - beim Pfosten-Zeichen hat
   das Raten am 04.11.2026 einen halben Abend gekostet. */
const MESSHAKEN = [{
  /* Der Abstand zwischen der Oberkante des Elements und der Unterkante
     des Keilglases. yKeil IST die Oberkante des Elements, darum ist
     "Dachunterkante ueber yKeil minus Keilhoehe" genau dieser Abstand -
     in cm, hier in mm gemerkt.

     NICHT kUntenVorne nehmen: Das ist auf null geklemmt. Ein Element,
     das zu WEIT nach oben laeuft, haette sich damit nicht gezeigt -
     die Gegenprobe meldete den zweiten eingebauten Fehler als
     unbemerkt (05.11.2026). Negativ heisst hier: Element und Keil
     liegen ineinander. */
  von: "          var kUntenHinten = (kH1 != null)",
  nach: "          (window.__bvKeilLuecke = window.__bvKeilLuecke || {})[seite] = Math.round((kOben(zVorneK) - kH2) * 10);\n"
      + "          var kUntenHinten = (kH1 != null)"
}, {
  von: "                kf.userData.keilFeld = kNr;",
  nach: "                kf.userData.keilFeld = kNr;\n"
      + "                (window.__bvKeilScheiben = window.__bvKeilScheiben || []).push(seite + ':' + kNr);\n"
      + "                window.__bvKeilAltSetzen = function (seite) {\n"
      + "                  Z.keilPlan[seite] = Z.keilPlan[seite] || { teilung: '2s' };\n"
      + "                  Z.keilPlan[seite].glas = ['FRF23 Glas opal', 'FRF23 Glas grau'];\n"
      + "                };\n"
      + "                window.__bvKeilPunkt = (function (mesh) { return function () {\n"
      + "                  mesh.geometry.computeBoundingSphere();\n"
      + "                  var c = mesh.geometry.boundingSphere.center.clone();\n"
      + "                  mesh.localToWorld(c); c.project(kamera3);\n"
      + "                  var r = leinwand.getBoundingClientRect();\n"
      + "                  return { x: r.left + (c.x + 1) / 2 * r.width,\n"
      + "                           y: r.top + (1 - (c.y + 1) / 2) * r.height }; }; })(kf);\n"
      + "                window.__bvKeilPlatz = function (s) { return keilMassGemerkt[s] || null; };\n"
      + "                window.__bvKeilUeberhoch = function (s) {\n"
      + "                  var m = keilMassGemerkt[s] || {};\n"
      + "                  var ab = (m.h1 && m.h2) ? m.h1 - m.h2 : 0;\n"
      + "                  Z.keilPlan[s] = Z.keilPlan[s] || {};\n"
      + "                  Z.keilPlan[s].h1 = (m.platzH1 || 1000) + 300;\n"
      + "                  Z.keilPlan[s].h2 = Z.keilPlan[s].h1 - ab;\n"
      + "                };"
}];

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
async function routenSetzen(zielCtx) {
  await zielCtx.route('**/*', async (route) => {
  const pfad = new URL(route.request().url()).pathname;
  const istJs = pfad.endsWith('/js/konfigurator-3d.js');
  const istSeite = pfad.endsWith('/konfigurator.html');
  if (!istJs && !istSeite) return route.continue();
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
  /* Die JS-Fehler gehoeren ins JavaScript, der Handy-Fehler ins CSS
     der Seite. Ohne diese Trennung suchte der Fehlerbauer die
     JS-Anker in der HTML-Datei und meldete acht veraltete Anker. */
  if (istJs) {
    MESSHAKEN.forEach(anwenden);
    if (GEGENPROBE && NUR_CSS == null) {
      (NUR == null ? FEHLER : [FEHLER[NUR]]).filter(Boolean).forEach(anwenden);
    }
  } else if (GEGENPROBE && NUR == null) {
    (NUR_CSS == null ? CSS_FEHLER : [CSS_FEHLER[NUR_CSS]]).filter(Boolean).forEach(anwenden);
  }
    return route.fulfill({ response: antwort, body: text });
  });
}
await routenSetzen(ctx);

const p = await ctx.newPage();
const seitenfehler = [];
p.on('pageerror', (e) => seitenfehler.push(String(e)));
await p.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
/* Den Cookie-Hinweis sicher aus dem Weg raeumen. Der Klick oben kann
   danebengehen (anderer Text, anderer Zeitpunkt), und der Hinweis
   klebt unten am Bild - seit der Editor durch Versatz- und
   Sprossenfeld laenger ist, liegt er genau ueber "Feld 1 fuer alle
   uebernehmen". Drei Pruefungen wurden dadurch rot, ohne dass am
   Produkt etwas falsch war: Die Klicks gingen ins Leere, und das
   .catch() im Test hat es verschluckt. */
await p.evaluate(() => {
  document.querySelectorAll('div,section,aside').forEach((e) => {
    if (!/Cookie/i.test(e.textContent || '')) return;
    const r = e.getBoundingClientRect();
    if (r.height > 60 && r.height < 460 && r.bottom > window.innerHeight - 200) {
      e.style.display = 'none';
    }
  });
});
await p.waitForTimeout(800);

/* ---------- Tippen heisst: eingeben UND das Feld verlassen ----------
   fill() loest nur 'input' aus. Seit die Masse erst beim Verlassen des
   Feldes geklemmt werden (05.11.2026), prueft ein Test ohne blur() eine
   Bedienung, die es so nicht gibt. */
async function tippe(sel, wert, ms = 4000) {
  await p.fill(sel, wert, { timeout: ms }).catch(() => {});
  await p.evaluate((s2) => { const e = document.querySelector(s2); if (e) e.blur(); }, sel);
}

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
  const k = document.querySelector('[data-k3d-rad="Keil"]');
  return !!(k && !k.hidden);
});
pruefe('Ohne Keil gibt es kein Zahnrad', !radVorher, 'ein Knopf ohne Keil waere eine falsche Zusage');

await p.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Keil"]');
  if (b) b.click();
});
await p.waitForTimeout(1500);

const radNachher = await p.evaluate(() => {
  const k = document.querySelector('[data-k3d-rad="Keil"]');
  return !!(k && !k.hidden && k.offsetParent);
});
pruefe('Mit Keil erscheint das Zahnrad', radNachher);

await p.click('[data-k3d-rad="Keil"]');
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
await waehle('#k3dKeilGlas0', 'VSG Glas klar (Aufpreis)');
await waehle('#k3dKeilGlas1', 'ESG Glas opal (Standard)');
await waehle('#k3dKeilGlas2', 'VSG Glas grau (Aufpreis)');
await waehle('#k3dKeilGlas3', 'Ohne Glas');
/* Laenger warten: Jede Glaswahl baut das Modell neu, und erst danach
   steht die Oberflaeche wieder still. */
await p.waitForTimeout(1600);
const scheibenOhne = await scheibenZaehlen();
pruefe('"Ohne Glas" laesst das Feld wirklich leer', scheibenOhne === 3,
  `${scheibenOhne} Scheiben statt 3 - eine fast durchsichtige Scheibe waere eine Luege`);

/* ---------- Feld 1 fuer alle ---------- */
await p.click('#k3dKeilGlasAlle', { timeout: 10000 }).catch((e) => { console.error('  !! Klick auf k3dKeilGlasAlle fehlgeschlagen'); });
await p.waitForTimeout(700);
const alleGleich = await p.evaluate(() =>
  [...document.querySelectorAll('#k3dKeilGlasFelder select')].map((s) => s.value));
pruefe('"Feld 1 fuer alle uebernehmen" setzt jedes Feld',
  alleGleich.every((v) => v === 'VSG Glas klar (Aufpreis)'), alleGleich.join(' / '));
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
/* HOCH, nicht herunter (geaendert am 05.11.2026): Seit die Vorgabe
   die kleinste Hoehe ist (H2 = 150 mm), laesst sich von dort aus nicht
   mehr absenken - jedes kleinere H1 wird zu Recht auf die Grenze
   geklemmt, und die naechste Pruefung haette dann nicht den Versatz
   gemessen, sondern die Begrenzung. 200 mm Luft nach oben geben dem
   Versatz Platz, ohne an die Dachunterkante zu stossen. */
await tippe('#k3dKeilH1', String(vorher.h1 + 200), 4000);
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
await tippe('#k3dKeilV', '30', 4000);
await p.waitForTimeout(700);
const nachV = await p.evaluate(() => +document.getElementById('k3dKeilH2').value);
pruefe('Ein Versatz unten verkleinert H2 um genau sein Mass',
  nachV === nachH1.h2 - 30, `H2 ${nachV}, erwartet ${nachH1.h2 - 30}`);

/* Und er hat eine Obergrenze. Ohne sie schnitt die angehobene
   Unterkante die Dachschraege: Die Zeichnung zerfiel in sich
   ueberschneidende Flaechen, das Modell haette Scheiben mit negativer
   Hoehe gebaut (gemessen am 05.11.2026 mit V = 250 bei H2 = 150). */
await tippe('#k3dKeilV', '99999', 4000);
await p.waitForTimeout(700);
const begrenzt = await p.evaluate(() => ({
  v: +document.getElementById('k3dKeilV').value,
  h2: +document.getElementById('k3dKeilH2').value,
  hinweis: (document.getElementById('k3dKeilVHinweis') || {}).textContent || ''
}));
pruefe('Ein zu grosser Versatz wird begrenzt, nicht gebaut',
  begrenzt.h2 >= 50 && begrenzt.v < 99999 && /h\u00f6chstens/.test(begrenzt.hinweis),
  `V ${begrenzt.v}, H2 ${begrenzt.h2}`);
await tippe('#k3dKeilV', '', 4000);
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
/* ALLE ACHT Teilungen mit Versatz, nicht nur eine. Beim ersten Anlauf
   lief diese Pruefung nur auf "2-teilig senkrecht" - also mit EINER
   Reihe. Der Fehler sass aber in der waagerechten Sprosse und blieb
   darum unentdeckt, bis der Betreiber ein Bild mit 6-teilig schickte.
   Eine Pruefung, die nur einen von acht Faellen ansieht, prueft einen
   von acht Faellen. */
await tippe('#k3dKeilV', '400', 4000);
await p.waitForTimeout(700);
const kaputt = [];
for (const t of ['1', '2w', '2s', '3s', '4s', '4sw', '6', '8']) {
  await p.click(`#k3dKeilTeilungen button[data-teilung="${t}"]`, { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(500);
  const k = await kantenPruefen();
  if (k.length) kaputt.push(t + ' (Feld ' + k.join(', ') + ')');
}
pruefe('Mit Versatz kreuzen sich in KEINER der acht Teilungen die Kanten',
  kaputt.length === 0, kaputt.join(' · '));
await p.click('#k3dKeilTeilungen button[data-teilung="4s"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(600);

/* Derselbe Zustand ueber den anderen Weg: erst Versatz, DANN H1
   absenken. Die Begrenzung sass zuerst nur am Versatzfeld - ein Loch,
   das nicht an der Stelle sass, an der es auffiel. */
const vorH1 = await p.evaluate(() => +document.getElementById('k3dKeilH1').value);
await tippe('#k3dKeilH1', '60', 4000);
await p.waitForTimeout(800);
const kreuzH = await kantenPruefen();
const h2Rest = await p.evaluate(() => +document.getElementById('k3dKeilH2').value);
pruefe('Auch ein zu kleines H1 nach einem Versatz kreuzt nichts',
  kreuzH.length === 0 && h2Rest >= 50,
  'gekreuzt: ' + (kreuzH.join(', ') || 'keins') + ', H2 ' + h2Rest);
await tippe('#k3dKeilV', '', 4000);
await tippe('#k3dKeilH1', String(vorH1), 4000);
await p.waitForTimeout(700);

/* ---------- Ein Keil, der nicht mehr unter das Dach passt ----------
   NEU GEDACHT am 05.11.2026. Vorher tippte diese Pruefung H1 = 300 ein
   und erwartete einen Hinweis. Das kann nicht mehr anschlagen: Das
   Hoehenfeld klemmt die Eingabe selbst auf den Platz unter dem Dach,
   eine zu hohe Zahl kommt dort gar nicht an.

   Erreichbar ist der Fall nur noch ueber einen GETEILTEN LINK: Der
   Link traegt eine Hoehe, die zu einem hoeheren Dach gehoerte. Wird er
   mit niedrigerem Dach geoeffnet, ragt der Keil hinaus - und genau
   dann muss der Hinweis kommen, samt dem Knopf, der die Masse
   zuruecksetzt. Also wird der Plan direkt gesetzt, wie ein Link es
   tut, und der Editor neu geoeffnet. */
await p.evaluate(() => { const d = document.getElementById('k3dKeilDialog'); if (d) d.hidden = true; });
await p.evaluate(() => { if (window.__bvKeilUeberhoch) window.__bvKeilUeberhoch('links'); });
await p.evaluate(() => { const k = document.querySelector('[data-k3d-rad="Keil"]'); if (k) k.click(); });
await p.waitForTimeout(900);
const warn = await p.evaluate(() => {
  const w = document.getElementById('k3dKeilWarnung');
  const z = document.getElementById('k3dKeilMasseZurueck');
  return { sichtbar: !!(w && !w.hidden), text: w ? w.textContent : '',
           zurueck: !!(z && !z.hidden) };
});
pruefe('Ein Keil, der nicht mehr unter das Dach passt, wird benannt',
  warn.sichtbar && /Dach/.test(warn.text) && warn.zurueck,
  (warn.text.slice(0, 70) || 'kein Hinweis') + (warn.zurueck ? '' : ' / ohne Zuruecksetzen-Knopf'));
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

/* ---------- Was nicht passt, ist nicht waehlbar ----------
   "einfach nicht waehlbar machen wenn die maße zu klein werden"
   (Betreiber, 05.11.2026). Dazu die belegte Grenze vom selben Tag:
   "vorne hoehe IMMER min 150mm".

   Eine Teilung anzubieten, die sich nicht bauen laesst, ist eine
   Zusage, die das Angebot zuruecknehmen muss.

   ERST HOCHSTELLEN (05.11.2026): Mit der Vorgabe H2 = 150 mm sind die
   vier zweireihigen Teilungen ZU RECHT gesperrt - 2 x 150 mm passen
   nicht in 150 mm. Vorher stand hier die alte Vorgabe (die gemessene
   Resthoehe), und die Pruefung las die Sperre faelschlich als Fehler.
   Also wird zuerst Platz geschaffen: 600 mm vorne, dann muessen alle
   acht offen sein. */
const vorRaum = await p.evaluate(() => ({
  h1: +document.getElementById('k3dKeilH1').value,
  h2: +document.getElementById('k3dKeilH2').value
}));
await tippe('#k3dKeilH1', String(vorRaum.h1 - vorRaum.h2 + 600), 8000);
await p.waitForTimeout(1400);
const vorSperre = await p.evaluate(() => ({
  h1: +document.getElementById('k3dKeilH1').value,
  h2: +document.getElementById('k3dKeilH2').value
}));
const offenVorher = await p.evaluate(() =>
  [...document.querySelectorAll('#k3dKeilTeilungen button')].filter((b) => !b.disabled).length);
pruefe('Bei ausreichenden Massen ist keine Teilung gesperrt', offenVorher === 8,
  `${offenVorher} von 8 waehlbar`);

/* H1 so weit absenken, dass vorne nur noch gut 200 mm bleiben - zu
   wenig fuer zwei Reihen (2 x 150 mm). */
await tippe('#k3dKeilH1', String(vorSperre.h1 - vorSperre.h2 + 220), 8000);
await p.waitForTimeout(1400);
const gesperrt = await p.evaluate(() =>
  [...document.querySelectorAll('#k3dKeilTeilungen button')]
    .filter((b) => b.disabled)
    .map((b) => b.getAttribute('data-teilung') + ':' + ((b.querySelector('.k3d-bearb-sperr') || {}).textContent || '')));
const sollGesperrt = ['2w', '4sw', '6', '8'];
pruefe('Zu flach: alle zweireihigen Teilungen sind gesperrt',
  sollGesperrt.every((id) => gesperrt.some((g) => g.indexOf(id + ':') === 0))
    && gesperrt.length === sollGesperrt.length,
  gesperrt.join(' ') || 'keine gesperrt');
pruefe('Die gesperrte Kachel nennt den Grund',
  gesperrt.every((g) => /zu flach|zu schmal/.test(g)), gesperrt.join(' '));
/* Eine gesperrte Kachel muss auch wirklich nicht waehlbar sein -
   disabled allein genuegt nicht, wenn ein Zuhoerer trotzdem feuert. */
const vorKlick = await p.evaluate(() =>
  (document.querySelector('#k3dKeilTeilungen button.ist-an') || {}).getAttribute
    ? document.querySelector('#k3dKeilTeilungen button.ist-an').getAttribute('data-teilung') : null);
await p.evaluate(() => {
  const b = document.querySelector('#k3dKeilTeilungen button[data-teilung="8"]');
  if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(900);
const nachKlick = await p.evaluate(() => {
  const b = document.querySelector('#k3dKeilTeilungen button.ist-an');
  return b ? b.getAttribute('data-teilung') : null;
});
pruefe('Ein Klick auf eine gesperrte Kachel aendert nichts',
  nachKlick === vorKlick, `${vorKlick} -> ${nachKlick}`);
/* Masse zurueck, damit die folgenden Pruefungen wieder Platz haben. */
await p.click('#k3dKeilMasseZurueck', { timeout: 8000 }).catch(() => {});
await p.waitForTimeout(1200);

/* ---------- Alte Namen aus geteilten Links ----------
   Bis zum 05.11.2026 hiessen die drei ESG-Glaeser nur "FRF23", bis
   der Betreiber klarstellte: "FRF Glas is ESG". Ein Link, der vorher
   verschickt wurde, traegt noch die alten Namen.

   GEPRUEFT WIRD DAS ERGEBNIS IM AUSWAHLFELD, nicht die Zuordnung im
   Quelltext: Nur so faellt auf, wenn die Umsetzung an der falschen
   Stelle sitzt und das Feld trotzdem leer bleibt - und genau das
   waere der Schaden: die Wahl stillschweigend weg. */
await p.evaluate(() => { if (window.__bvKeilAltSetzen) window.__bvKeilAltSetzen('links'); });
await p.evaluate(() => { const d = document.getElementById('k3dKeilDialog'); if (d) d.hidden = true; });
await p.evaluate(() => { const k = document.querySelector('[data-k3d-rad="Keil"]'); if (k) k.click(); });
await p.waitForTimeout(900);
const alteNamen = await p.evaluate(() =>
  [...document.querySelectorAll('#k3dKeilGlasFelder select')].slice(0, 2).map((s2) => s2.value));
pruefe('Ein alter Link behaelt seine Glaswahl',
  alteNamen[0] === 'ESG Glas opal (Standard)' && alteNamen[1] === 'ESG Glas grau (Standard)',
  alteNamen.join(' / ') + ' statt der umbenannten ESG-Glaeser');

/* ---------- Die Wand unter dem Keil ----------
   "was is mit der glasschiebewand da unten? da is doch was falsch"
   (Betreiber, 05.11.2026, mit Bild). Die Schiebewand hoerte bei 786 mm
   auf, darueber klaffte bis zum Keil eine Luecke von 1485 mm.

   Ursache war ein doppelter Name: Die Mindesthoehe des Keils stand
   zweimal in derselben Datei, einmal in Zentimetern (15) und einmal in
   Millimetern (150), beide im selben Gueltigkeitsbereich. Die Zeichnung
   reservierte deshalb 150 cm statt 15 cm.

   GEMESSEN WIRD DER ABSTAND IM MODELL, nicht die Konstante im
   Quelltext: yKeil ist die Oberkante des Elements, kUntenVorne der
   Abstand von dort bis zum Keilglas. Null heisst buendig. */
await tippe('#k3dKeilH1', '', 4000);
await p.waitForTimeout(900);
await p.evaluate(() => { const d = document.getElementById('k3dKeilDialog'); if (d) d.hidden = true; });
await p.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Schiebetür"]');
  if (b) b.click();
});
await p.waitForTimeout(1800);
const lueckeVorgabe = await p.evaluate(() => (window.__bvKeilLuecke || {}).links);
pruefe('Die Schiebewand reicht bis an den Keil',
  lueckeVorgabe != null && Math.abs(lueckeVorgabe) <= 10,
  `Luecke ${lueckeVorgabe} mm`);

/* Und bei eigener Hoehe ebenso: Wer den Keil hoeher stellt, braucht
   darunter eine kuerzere Wand - sonst laufen beide ineinander. */
await p.evaluate(() => { const k = document.querySelector('[data-k3d-rad="Keil"]'); if (k) k.click(); });
await p.waitForTimeout(800);
const paarW = await p.evaluate(() => ({
  h1: +document.getElementById('k3dKeilH1').value,
  h2: +document.getElementById('k3dKeilH2').value
}));
await tippe('#k3dKeilH1', String(paarW.h1 - paarW.h2 + 600), 8000);
await p.waitForTimeout(1800);
const lueckeHoch = await p.evaluate(() => (window.__bvKeilLuecke || {}).links);
pruefe('Auch ein hoeherer Keil sitzt ohne Luecke auf der Wand',
  lueckeHoch != null && Math.abs(lueckeHoch) <= 10,
  `H2 600 mm, Luecke ${lueckeHoch} mm`);

/* ---------- Die Ruecktaste muss loeschen koennen ----------
   "die 150mm lassen sich mit dem xpfeil nach links in der tastatur
   nicht löschen um ne andere zahl einzutragen" (Betreiber, 05.11.2026,
   mit Bild vom iPhone).

   Aus "150" wird beim Loeschen erst "15" - kleiner als die
   Mindesthoehe. Das Feld schrieb daraufhin bei JEDEM Tastendruck
   sofort wieder "150" hinein. Die Ruecktaste sah aus, als waere sie
   kaputt, und eine groessere Zahl liess sich nicht eintippen: Fuer
   "600" muss man erst "6" tippen, und das ist zu klein.

   GEPRUEFT WIRD MIT ECHTEN TASTENDRUECKEN, nicht mit fill(): fill()
   setzt den ganzen Wert auf einmal und haette den Fehler nie gezeigt. */
await p.evaluate(() => { const d = document.getElementById('k3dKeilDialog'); if (d) d.hidden = true; });
await p.evaluate(() => { const k = document.querySelector('[data-k3d-rad="Keil"]'); if (k) k.click(); });
await p.waitForTimeout(800);
await tippe('#k3dKeilH1', '');
await p.waitForTimeout(800);
await p.locator('#k3dKeilH2').click({ timeout: 4000 }).catch(() => {});
await p.keyboard.press('End');
for (let i = 0; i < 4; i++) { await p.keyboard.press('Backspace'); await p.waitForTimeout(120); }
const nachLoeschen = await p.evaluate(() => document.getElementById('k3dKeilH2').value);
pruefe('Die Ruecktaste leert das Hoehenfeld wirklich',
  nachLoeschen === '', `im Feld steht "${nachLoeschen}"`);

await p.keyboard.type('600', { delay: 120 });
const nachTippen = await p.evaluate(() => document.getElementById('k3dKeilH2').value);
pruefe('Eine groessere Zahl laesst sich eintippen',
  nachTippen === '600', `im Feld steht "${nachTippen}"`);

await p.evaluate(() => document.getElementById('k3dKeilH2').blur());
await p.waitForTimeout(900);
const nachVerlassen = await p.evaluate(() => ({
  feld: document.getElementById('k3dKeilH2').value,
  luecke: (window.__bvKeilLuecke || {}).links
}));
pruefe('Die getippte Hoehe kommt im Modell an',
  nachVerlassen.feld === '600' && nachVerlassen.luecke != null
    && Math.abs(nachVerlassen.luecke) <= 10,
  `Feld ${nachVerlassen.feld}, Luecke ${nachVerlassen.luecke} mm`);

/* Und eine zu kleine Zahl wird beim VERLASSEN geklemmt - nicht beim
   Tippen. Sonst waere der Fehler nur verschoben: Dann stuende am Ende
   eine Hoehe im Feld, die es nicht gibt. */
await p.locator('#k3dKeilH2').click({ timeout: 4000 }).catch(() => {});
await p.keyboard.press('End');
for (let i = 0; i < 4; i++) { await p.keyboard.press('Backspace'); await p.waitForTimeout(120); }
await p.keyboard.type('20', { delay: 120 });
const beimTippen = await p.evaluate(() => document.getElementById('k3dKeilH2').value);
await p.evaluate(() => document.getElementById('k3dKeilH2').blur());
await p.waitForTimeout(900);
const beimVerlassen = await p.evaluate(() => document.getElementById('k3dKeilH2').value);
pruefe('Zu klein wird erst beim Verlassen berichtigt',
  beimTippen === '20' && beimVerlassen === '150',
  `beim Tippen "${beimTippen}", nach dem Verlassen "${beimVerlassen}"`);

/* ---------- Die vier Maszfelder sind EINE Familie ----------
   "nirgens steht mm dahinter und die feste breite in dem linken oberen
   feld hat nen ganz anderen rahmen als die restlichen 3" (Betreiber,
   05.11.2026).

   Das Breitenfeld trug als einziges keine Klasse und bekam darum den
   Rahmen, den der Browser von sich aus zeichnet. GEMESSEN WIRD DER
   GERECHNETE STIL, nicht das Klassenattribut: Eine Klasse im Markup
   sagt noch nicht, dass auch dieselbe Regel greift. */
const rahmen = await p.evaluate(() =>
  ['k3dKeilB', 'k3dKeilH1', 'k3dKeilH2', 'k3dKeilV'].map((id) => {
    const c = getComputedStyle(document.getElementById(id));
    return [c.borderTopWidth, c.borderTopStyle, c.borderTopColor, c.borderTopLeftRadius].join('|');
  }));
pruefe('Alle vier Maszfelder tragen denselben Rahmen',
  new Set(rahmen).size === 1, rahmen.join('  /  '));

const einheiten = await p.evaluate(() =>
  ['k3dKeilB', 'k3dKeilH1', 'k3dKeilH2', 'k3dKeilV'].map((id) => {
    const e = document.getElementById(id).parentNode.querySelector('.k3d-bearb-einheit');
    return e && e.offsetParent !== null ? (e.textContent || '').trim() : '';
  }));
pruefe('Hinter jedem Maszfeld steht die Einheit',
  einheiten.every((t) => t === 'mm'), einheiten.join(', ') || 'keine');

/* Die Einheit darf den Tipper nicht abfangen: Wer rechts ins Feld
   tippt, muss im Feld landen und nicht auf einem Stueck Text. */
const trifft = await p.evaluate(() => {
  const e = document.querySelector('#k3dKeilH2').parentNode.querySelector('.k3d-bearb-einheit');
  if (!e) return 'keine Einheit';
  const r = e.getBoundingClientRect();
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return t ? (t.id || t.className || t.tagName) : 'nichts';
});
pruefe('Ein Tipper auf die Einheit landet im Feld',
  trifft === 'k3dKeilH2', `getroffen: ${trifft}`);

/* "Bei Versatz noch (Optional)" (Betreiber, 05.11.2026): Es stand nur
   im Hinweis UNTER dem Feld. Geprueft wird die sichtbare Beschriftung. */
const optTxt = await p.evaluate(() => {
  const l = document.querySelector('label[for="k3dKeilV"]');
  return l ? (l.textContent || '').replace(/\s+/g, ' ').trim() : '';
});
pruefe('Am Versatz steht, dass er optional ist',
  /\(Optional\)/.test(optTxt), optTxt.slice(0, 60));

pruefe('Keine Fehler im Browser', seitenfehler.length === 0, seitenfehler.slice(0, 2).join(' | '));

/* ---------- Am Handy ----------
   "du hast die mobile first anweisung nicht beachtet auf handy is es
   schlimm" (Betreiber, 05.11.2026, mit Bild).

   Der Dialog lag IM 3D-Bild, und das ist unter 900 px nur 45svh hoch
   und ausserdem sticky mit z-index 5 - also ein eigener
   Stapelkontext. Der Kasten konnte gar nicht groesser werden als
   dieser Streifen, und die klebende Kopfzeile der Seite lag darueber.

   GEPRUEFT WIRD DAS ERGEBNIS AUF DEM BILDSCHIRM: Deckt der Dialog das
   Fenster wirklich ab, liegt wirklich nichts darueber, ist "Fertig"
   wirklich zu sehen. Eine Pruefung auf "position: fixed" haette den
   Stapelkontext nicht bemerkt. */
const handy = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
});
if (GEGENPROBE) await routenSetzen(handy);
const ph = await handy.newPage();
await ph.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await ph.waitForTimeout(2400);
await ph.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
await ph.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await ph.evaluate(() => {
  document.querySelectorAll('div,section,aside').forEach((e) => {
    if (!/Cookie/i.test(e.textContent || '')) return;
    const r = e.getBoundingClientRect();
    if (r.height > 60 && r.height < 460 && r.bottom > window.innerHeight - 200) e.style.display = 'none';
  });
});
await ph.waitForTimeout(900);
await ph.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s2 = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s2) s2.click();
});
await ph.waitForTimeout(900);
await ph.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Keil"]');
  if (b) b.click();
});
await ph.waitForTimeout(1600);
await ph.evaluate(() => { const k = document.querySelector('[data-k3d-rad="Keil"]'); if (k) k.click(); });
await ph.waitForTimeout(1000);

const amHandy = await ph.evaluate(() => {
  const d = document.getElementById('k3dKeilDialog');
  const r = d.getBoundingClientRect();
  const kopf = document.querySelector('.k3d-bearb-kopf');
  const kr = kopf.getBoundingClientRect();
  const obenDrauf = document.elementFromPoint(Math.round(kr.left + kr.width / 2), Math.round(kr.top + 6));
  const f = document.getElementById('k3dKeilFertig');
  const fr = f.getBoundingClientRect();
  const kacheln = [...document.querySelectorAll('#k3dKeilTeilungen button')];
  return {
    deckt: Math.round(r.top) === 0 && Math.round(r.height) >= window.innerHeight - 1,
    kopfFrei: !!(obenDrauf && d.contains(obenDrauf)),
    kopfOben: Math.round(kr.top) <= 1,
    fertigImBild: fr.top < window.innerHeight && fr.bottom > 0 && fr.height >= 44,
    quer: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    kachelZahl: kacheln.length,
    kachelnSichtbar: kacheln.filter((b) => {
      const br = b.getBoundingClientRect();
      return br.left >= -1 && br.right <= window.innerWidth + 1;
    }).length
  };
});
pruefe('Am Handy deckt der Dialog das ganze Fenster ab', amHandy.deckt,
  'der Kasten lag im 3D-Bild und war nur so hoch wie dieses');
pruefe('Am Handy liegt nichts ueber der Kopfzeile des Dialogs',
  amHandy.kopfFrei && amHandy.kopfOben, 'die klebende Kopfzeile der Seite lag darueber');
pruefe('Am Handy ist "Fertig" zu sehen und gross genug', amHandy.fertigImBild);
pruefe('Am Handy kein waagerechtes Scrollen', amHandy.quer <= 0, `${amHandy.quer}px`);
pruefe('Am Handy stehen alle acht Teilungen im Bild, ohne seitliches Schieben',
  amHandy.kachelZahl === 8 && amHandy.kachelnSichtbar === 8,
  `${amHandy.kachelnSichtbar} von ${amHandy.kachelZahl} sichtbar`);

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  if (ankerKaputt) {
    console.log('ANKER VERALTET – mindestens ein Fehler kam nicht an.');
    process.exit(1);
  }
  /* MITZAEHLEN, was wirklich eingebaut wurde: Die CSS-Fehler fehlten in
     dieser Zahl, der Bericht nannte 15 statt 19 (05.11.2026). Eine
     Gegenprobe, die sich selbst zu klein rechnet, kann nicht auffallen,
     wenn eine Pruefung blind wird. */
  const zahl = EINZELN ? 1 : FEHLER.length + CSS_FEHLER.length;
  const welcher = NUR != null ? ' (Nr. ' + NUR + ')'
                : NUR_CSS != null ? ' (CSS Nr. ' + NUR_CSS + ')' : '';
  console.log(`Gegenprobe: ${zahl} Fehler eingebaut${welcher}, `
    + `${rot.length} Pruefungen schlagen an.`);
  if (rot.length < zahl) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
