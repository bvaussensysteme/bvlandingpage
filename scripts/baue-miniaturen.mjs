/* ============================================================
   Erzeugt die Miniaturen für die Bildkarten im Konfigurator.

   WARUM EIGENE BILDER UND KEINE ZEICHNUNGEN: Das Vorbild, das der
   Betreiber am 03.11.2026 geschickt hat, zeigt Strichzeichnungen von
   Produkten und Eindeckungen. Die sind eigene Werke des fremden
   Anbieters - weder kopieren noch nachzeichnen (siehe
   docs/konfigurator-bedienung.md und CLAUDE.md, „Nachbauten").

   Statt zu zeichnen, FOTOGRAFIEREN WIR UNSER EIGENES MODELL: Der
   Konfigurator baut jedes Produkt ohnehin in 3D auf. Ein Bild davon ist
   originär, kostet nichts, zeigt unser echtes Erzeugnis in unseren
   Farben - und es stimmt immer mit dem überein, was der Kunde nach dem
   Klick sieht. Eine Zeichnung liefe mit jeder Änderung am Modell
   auseinander.

   Aufruf:   node scripts/baue-miniaturen.mjs
   Ergebnis: images/konfigurator/*.jpg (gehören ins Repository)
   Neu erzeugen, wenn sich das Modell sichtbar ändert.
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, statSync } from 'node:fs';

const PORT = 8951;
const WURZEL = new URL('..', import.meta.url).pathname;
const ZIEL = WURZEL + 'images/konfigurator/';
mkdirSync(ZIEL, { recursive: true });

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: WURZEL, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

const browser = await chromium.launch({
  timeout: 60000, executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
/* Doppelte Punktdichte, damit die Karten auf dem Handy nicht weich
   aussehen - ausgeliefert wird mit halber Kantenlänge. */
/* Format wie die Karte, nicht wie der Bildschirm: Beim ersten Versuch
   war die Leinwand 1440 x 520 - das Modell sass klein in viel Rasen.
   460 x 330 bei doppelter Punktdichte ergibt 920 x 660 und passt auf
   die Karte (rund 3:2). */
const page = await browser.newPage({
  viewport: { width: 340, height: 245 }, deviceScaleFactor: 2
});
page.on('pageerror', (e) => console.log('  PAGEERROR ' + e.message));
await page.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

/* Aufräumen: Was auf einer Miniatur nichts zu suchen hat - Banner,
   Hinweis, Maßlinien, Anklickpunkte, Bedienfeld. Die Bühne bekommt
   dadurch die ganze Breite. */
await page.evaluate(() => {
  const weg = (s) => document.querySelectorAll(s).forEach((e) => e.remove());
  weg('#cookieBanner');
  const ok = document.getElementById('k3dTestOk'); if (ok) ok.click();
  weg('.k3d-hinw');
  const panel = document.getElementById('k3dPanel'); if (panel) panel.style.display = 'none';
  /* Die Ansichtsleiste wird VERSTECKT, nicht entfernt. GEMESSEN am
     04.11.2026: Die sieben Miniaturen der Dacheindeckung zeigten alle
     dieselbe Schraegansicht wie die Produktbilder, und die Toenung war
     darin kaum zu sehen. Ursache: Weiter unten klickt das Skript auf
     „Von oben" - den Knopf gab es da schon nicht mehr. Ein Knopf mit
     display:none nimmt den Klick weiterhin an, ein geloeschter nicht. */
  const leiste = document.querySelector('.k3d-leiste');
  if (leiste) leiste.style.visibility = 'hidden';
  weg('.k3d-oben'); weg('.k3d-klickhinweis');
  /* Die Beschriftung oben links gehoert zur Buehne, nicht aufs Bild -
   beim ersten Versuch stand „Terrassendach TDS / 5000 x 3000 mm" quer
   ueber jeder Miniatur. Auf der Karte steht der Name ohnehin darunter. */
  ['k3dTitelBuehne', 'k3dSpec'].forEach((id) => {
    const e = document.getElementById(id);
    if (e && e.parentNode) e.parentNode.style.display = 'none';
  });
  /* DIE BUEHNE AUF DIE GANZE FLAECHE, fest und ganz oben: Alles andere
     kann dann nicht mehr hineinragen. GEMESSEN am 04.11.2026: Auf der
     Miniatur der Pergola stand die Kopfzeile der Website mit Logo im
     Bild - die Seite war beim Produktwechsel ein Stueck gescrollt, und
     der Ausschnitt der Leinwand lag darunter. Mit position:fixed ist
     das nicht mehr moeglich, egal wie hoch das Bedienfeld gerade ist. */
  const buehne = document.querySelector('.k3d-buehne');
  if (buehne) {
    buehne.style.cssText += ';position:fixed;left:0;top:0;right:0;bottom:0;'
      + 'width:100vw;height:100vh;z-index:2147483647;margin:0;';
  }
  document.body.style.overflow = 'hidden';
  /* ALLES WEG, WAS FEST UEBER DER SEITE LIEGT. Nach der Kopfzeile stand
     auf der naechsten Miniatur der runde Knopf der Bedienhilfe im Bild
     (accessibility.js, eigener z-index). Statt jede Einblendung einzeln
     zu kennen: Was fest positioniert ist und nicht zur Buehne gehoert,
     kommt raus. */
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('.k3d-buehne') || el.closest('.k3d-leiste')) return;
    const lage = getComputedStyle(el).position;
    if (lage === 'fixed' || lage === 'sticky') el.remove();
  });
  ['k3dMasse', 'k3dMarken'].forEach((id) => {
    const k = document.getElementById(id);
    if (k && k.checked) { k.checked = false; k.dispatchEvent(new Event('change', { bubbles: true })); }
  });
});
await page.waitForTimeout(1400);

async function setzen(feld, wert) {
  await page.evaluate(([f, w]) => {
    const reihe = document.querySelector('[data-k3d-seg="' + f + '"]');
    if (reihe) {
      const k = reihe.querySelector('button[data-wert="' + w + '"]');
      if (k) { k.click(); return; }
    }
    const el = document.getElementById(f);
    if (el) { el.value = w; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, [feld, wert]);
  await page.waitForTimeout(1500);
}

/* Naeher heran: Die Vorgabeansicht zeigt viel Umgebung. Ein paar
   Raddrehungen auf der Leinwand holen das Modell gross ins Bild - genau
   das, was ein Besucher auch tun wuerde. */
async function heranholen(schritte) {
  const kasten = await page.locator('#k3dCanvas').boundingBox();
  for (let i = 0; i < schritte; i++) {
    await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(400);
}

async function bild(name) {
  const datei = ZIEL + name + '.jpg';
  /* Das ganze Fenster, nicht das Element: Die Buehne fuellt es
     vollstaendig (siehe oben), und so kann nichts aus der Seite
     hineinragen. */
  await page.screenshot({ path: datei, type: 'jpeg', quality: 70 });
  const kb = Math.round(statSync(datei).size / 1024);
  console.log('  ' + (name + '.jpg').padEnd(34) + kb + ' kB');
  return kb;
}

console.log('Miniaturen aus dem eigenen Modell');
let gesamt = 0;
await heranholen(4);

/* 1. Die fünf Produkte */
const PRODUKTE = [
  ['Terrassendach TDS', 'produkt-terrassendach'],
  ['Flachdach SkyView', 'produkt-skyview'],
  ['Carport', 'produkt-carport'],
  ['Balkonüberdachung', 'produkt-balkon'],
  ['Pergola / Lamellendach', 'produkt-pergola']
];
for (const [wert, name] of PRODUKTE) {
  await setzen('k3dProdukt', wert);
  gesamt += await bild(name);
}

/* 2. Aufbau: an der Wand oder freistehend (am Terrassendach) */
await setzen('k3dProdukt', 'Terrassendach TDS');
for (const [wert, name] of [['Wandmontage', 'aufbau-wand'], ['Freistehend', 'aufbau-frei']]) {
  await setzen('k3dAufbau', wert);
  gesamt += await bild(name);
}
await setzen('k3dAufbau', 'Wandmontage');

/* 3. Eindeckung - hier zählt die Fläche, deshalb von schräg oben */
const vonOben = await page.evaluate(() => {
  const k = document.querySelector('[data-k3d-ansicht="Von oben"]');
  if (!k) return 'Knopf fehlt';
  k.click();
  return k.classList.contains('is-active') ? 'ok' : 'Klick ohne Wirkung';
});
if (vonOben !== 'ok') {
  console.log('  ABBRUCH: Ansicht „Von oben" nicht gesetzt (' + vonOben + ')');
  console.log('  Ohne sie zeigen alle sieben Eindeckungen dasselbe Bild.');
  await browser.close(); server.kill(); process.exit(1);
}
await page.waitForTimeout(1200);
await heranholen(3);
for (const [wert, name] of [
  ['VSG klar', 'dach-glas-klar'], ['VSG opal', 'dach-glas-opal'],
  ['VSG graphit', 'dach-glas-graphit'], ['Polycarbonat klar', 'dach-poly-klar'],
  ['Polycarbonat opal', 'dach-poly-opal'], ['Polycarbonat graphit', 'dach-poly-graphit'],
  ['Polycarbonat bronze', 'dach-poly-bronze']
]) {
  await setzen('k3dEindeckung', wert);
  gesamt += await bild(name);
}

console.log('\nErgebnis: ' + (PRODUKTE.length + 2 + 7) + ' Bilder, zusammen '
  + gesamt + ' kB in images/konfigurator/');
await browser.close();
server.kill();
