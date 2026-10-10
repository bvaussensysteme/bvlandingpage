/* ============================================================
   Prüft die Oberfläche des 3D-Konfigurators im echten Browser.

   Warum im Browser und nicht mit Textsuche: Die Fragen, auf die es hier
   ankommt, lassen sich im Quelltext nicht beantworten. Ob das Bedienfeld
   neben dem Modell steht, ob ein Schiebeelement sich sichtbar bewegt, ob
   auf dem Handy die Seite scrollt statt eines zweiten Scrollbereichs im
   Bedienfeld – das entscheidet erst das Layout. Zwei Fehler, die dieses
   Skript gefunden hat:

     · Die Klasse k3d-seite am body traf die vorhandene Regel .k3d-seite
       (die Zeile „Links / Rechts / Vorne") und zog die ganze Anwendung auf
       62 px zusammen.
     · Die Notiz aus dem Konfigurator fiel aus der E-Mail, weil der Schritt
       „wunsch" bei den Standardprodukten nicht im Ablauf ist.

   Der letzte Teil liest zurück, was im Anfrage-Assistenten ankommt – nicht,
   was der Konfigurator losgeschickt hat. Abgesendet wird nichts: beide
   Versandwege werden abgefangen.

   Aufruf:     node scripts/pruefe-konfigurator-oberflaeche.mjs
   Gegenprobe: node scripts/pruefe-konfigurator-oberflaeche.mjs --gegenprobe

   Braucht Playwright und einen Chromium. Beides liegt nicht im Projekt:
     npm i --no-save playwright
   Der Browser wird unter /opt/pw-browsers erwartet (so ist die
   Arbeitsumgebung eingerichtet); mit BV_CHROMIUM=<pfad> überschreibbar.
   Den Webserver startet das Skript selbst.
   ============================================================ */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8783 + (GEGENPROBE ? 1 : 0);

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;        // Playwright sucht selbst
  const ordner = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const letzter = ordner[ordner.length - 1];
  return letzter ? `${basis}/${letzter}/chrome-linux/chrome` : undefined;
}

/* Bilder des Durchlaufs landen in pruefbilder/ – der Ordner ist in
   .gitignore, Prüfbilder gehören nicht ins Repository. */
mkdirSync(new URL('../pruefbilder', import.meta.url).pathname, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

const BASIS = `http://localhost:${PORT}/konfigurator.html`;
let fehler = 0;
const ergebnisse = [];
function pruef(name, ok, info = '') {
  ergebnisse.push([name, ok]);
  if (!GEGENPROBE) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(46) + info);
  if (!ok) fehler++;
}

const browser = await chromium.launch({
  timeout: 60000,
  executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});

// ---------- Desktop ----------
browser.contexts; 
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const konsole = [];
page.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
page.on('pageerror', e => konsole.push('pageerror: ' + e.message));
/* Gegenprobe: drei Fehler werden absichtlich eingebaut. Schlägt die
   Prüfung dann nicht an, prüft sie nichts. Fehler 3 ist genau der Fehler,
   der in der E-Mail die Notiz verschwinden ließ. */
if (GEGENPROBE) {
  await page.addStyleTag({ content: '.k3d-sl{width:62px!important} .k3d-buehne{width:0!important}' });
  await page.route('**/konfigurator-3d.js*', async (r) => {
    const a = await r.fetch();
    let t = await a.text();
    t = t.replace('function masseZeichnen() {', 'function masseZeichnen() { return;');
    await r.fulfill({ response: a, body: t, headers: { ...a.headers(), 'content-type': 'application/javascript' } });
  });
  await page.route('**/anfrage-wizard.js*', async (r) => {
    const a = await r.fetch();
    let t = await a.text();
    t = t.replace("if (answers.wunsch) {", "if (inFlow('wunsch') && answers.wunsch) {");
    await r.fulfill({ response: a, body: t, headers: { ...a.headers(), 'content-type': 'application/javascript' } });
  });
}

await page.goto(BASIS, { waitUntil: 'networkidle' });
await page.waitForTimeout(1600);
if (GEGENPROBE) {
  await page.addStyleTag({ content: '.k3d-sl{width:62px!important} .k3d-buehne{width:0!important}' });
  await page.waitForTimeout(300);
}

/* /api/bauteile liefert ohne Cloudflare-KV nichts – lokal 404, veröffentlicht
   503. Das ist der vorgesehene Rückfall, kein Fehler. */
const echt = konsole.filter(t => !/api\/bauteile/.test(t) && !/404/.test(t));
pruef('Keine Fehler in der Konsole', echt.length === 0, echt.join(' | ').slice(0, 160));

// Layout: Bedienfeld links, Bühne rechts, beide gleichzeitig sichtbar
const sl = await page.locator('#k3dPanel').boundingBox();
const bu = await page.locator('.k3d-buehne').boundingBox();
/* Nicht nur „links davon": auch breit genug. Genau hier lag der
   Namenskonflikt – das Bedienfeld stand links und war 62 px breit. */
pruef('Bedienfeld links von der Bühne',
  sl.x + sl.width <= bu.x + 2 && sl.width > 300 && bu.width > 600,
  `Panel ${Math.round(sl.width)}px, Bühne ${Math.round(bu.width)}px`);
pruef('Bühne füllt die Resthöhe', bu.height > 600, `${Math.round(bu.height)}px hoch`);

// Canvas zeigt wirklich etwas (nicht einfarbig)
async function bildVielfalt() {
  return await page.evaluate(() => {
    const c = document.getElementById('k3dCanvas');
    const g = document.createElement('canvas');
    g.width = 160; g.height = 100;
    const x = g.getContext('2d');
    x.drawImage(c, 0, 0, 160, 100);
    const d = x.getImageData(0, 0, 160, 100).data;
    const s = new Set();
    for (let i = 0; i < d.length; i += 4) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
    return s.size;
  });
}
pruef('Modell wird gezeichnet', (await bildVielfalt()) > 40, (await bildVielfalt()) + ' Farben');

// Abschnittsköpfe zeigen die Auswahl
const sumP = await page.locator('#k3dSumProdukt').innerText();
pruef('Kurzfassung im Abschnittskopf', /5000 × 3000 mm/.test(sumP), sumP);
const spec = await page.locator('#k3dSpec').innerText();
pruef('Fläche auf der Bühne', /15,00 m²/.test(spec), spec);

// Zahlenfeld
await page.fill('#k3dBreiteZahl', '4200');
await page.waitForTimeout(500);
pruef('Zahlenfeld stellt den Regler',
  (await page.inputValue('#k3dBreite')) === '4200',
  'Regler: ' + await page.inputValue('#k3dBreite'));
pruef('Ausgabe folgt dem Zahlenfeld',
  (await page.locator('#k3dBreiteWert').innerText()) === '4200 mm');

// Zahlenfeld außerhalb des Bereichs wird markiert und beim Verlassen begrenzt
await page.fill('#k3dBreiteZahl', '9999');
await page.waitForTimeout(200);
const markiert = await page.locator('#k3dBreiteZahl').evaluate(e => e.classList.contains('ist-ausserhalb'));
await page.locator('#k3dBreiteZahl').blur();
await page.waitForTimeout(300);
const begrenzt = await page.inputValue('#k3dBreiteZahl');
pruef('Maß außerhalb wird markiert', markiert);
pruef('Maß außerhalb wird begrenzt', begrenzt === '7000', begrenzt + ' mm');

// Knopfreihe Produkt
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Carport"]');
await page.waitForTimeout(900);
pruef('Knopfreihe markiert die Wahl',
  await page.locator('[data-k3d-seg="k3dProdukt"] button[data-wert="Carport"]').evaluate(e => e.classList.contains('is-active')));
pruef('Titel folgt dem Produkt',
  /Carport/.test(await page.locator('#k3dTitelBuehne').innerText()),
  await page.locator('#k3dTitelBuehne').innerText());

// Verkleidung nur beim Carport
const verkSichtbar = await page.locator('details[data-k3d-fuer="verkleidung"]').isVisible();
const seitenSichtbar = await page.locator('details[data-k3d-fuer="terrasse pergola"]').isVisible();
pruef('Verkleidung erscheint beim Carport', verkSichtbar);
pruef('Seiten-Abschnitt beim Carport weg', !seitenSichtbar);

// Verkleidung einschalten -> Ausrichtung erscheint, Bild ändert sich
const vorVerk = await page.locator('#k3dCanvas').screenshot();
await page.locator('details[data-k3d-fuer="verkleidung"] summary').click();
await page.check('#k3dVerkLinks');
await page.waitForTimeout(800);
const nachVerk = await page.locator('#k3dCanvas').screenshot();
pruef('Verkleidung verändert das Modell', !vorVerk.equals(nachVerk));
pruef('Ausrichtung erscheint', await page.locator('[data-k3d-fuer="verk-richtung"]').isVisible());
pruef('Kurzfassung Verkleidung',
  /links/.test(await page.locator('#k3dSumVerk').innerText()),
  await page.locator('#k3dSumVerk').innerText());

// Zurück zum Terrassendach: Sonnenschutz und Schiebeelemente
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Terrassendach TDS"]');
await page.waitForTimeout(900);
await page.locator('details[data-k3d-fuer="terrasse pergola"] summary').click();
await page.selectOption('#k3dLinks', 'Schiebeelement');
await page.waitForTimeout(700);
pruef('Schiebe-Regler erscheint', await page.locator('[data-k3d-fuer="schiebe"]').isVisible());
const zu = await page.locator('#k3dCanvas').screenshot();
await page.click('#k3dGlasAuf');
await page.waitForTimeout(800);
const auf = await page.locator('#k3dCanvas').screenshot();
pruef('Schiebeelemente öffnen sich sichtbar', !zu.equals(auf),
  'Regler: ' + await page.inputValue('#k3dGlasOffen') + ' %');

/* Eindeckung: Polycarbonat darf nicht aussehen wie Glas. Beanstandet vom
   Betreiber – vorher war es dieselbe Glasfläche. Geprüft wird, dass jede
   Ausführung ein anderes Bild ergibt. */
const dachDetails = page.locator('details').filter({ hasText: 'Dach & Farbe' }).first();
await dachDetails.locator('summary').click();
const bilder = {};
for (const art of ['VSG klar', 'Polycarbonat klar', 'Polycarbonat opal',
                   'Polycarbonat graphit', 'Polycarbonat bronze']) {
  await page.click(`[data-k3d-seg="k3dEindeckung"] button[data-wert="${art}"]`);
  await page.waitForTimeout(650);
  bilder[art] = await page.locator('#k3dCanvas').screenshot();
}
pruef('Polycarbonat sieht anders aus als Glas',
  !bilder['VSG klar'].equals(bilder['Polycarbonat klar']));
pruef('Graphit und Bronze unterscheiden sich',
  !bilder['Polycarbonat graphit'].equals(bilder['Polycarbonat bronze']));
pruef('Opal unterscheidet sich von klar',
  !bilder['Polycarbonat klar'].equals(bilder['Polycarbonat opal']));
await page.click('[data-k3d-seg="k3dEindeckung"] button[data-wert="VSG klar"]');
await page.waitForTimeout(400);
await dachDetails.locator('summary').click();

// Sonnenschutz
const sonneDetails = page.locator('details').filter({ hasText: 'Sonnenschutz' }).first();
await sonneDetails.locator('summary').click();
const ohneMarkise = await page.locator('#k3dCanvas').screenshot();
await page.click('[data-k3d-seg="k3dSonne"] button[data-wert="Aufdachmarkise"]');
await page.waitForTimeout(800);
pruef('Ausfahr-Regler erscheint', await page.locator('[data-k3d-fuer="sonne-aus"]').isVisible());
const mitMarkise = await page.locator('#k3dCanvas').screenshot();
pruef('Markise ist im Modell zu sehen', !ohneMarkise.equals(mitMarkise));
await page.check('#k3dZipV');
await page.waitForTimeout(700);
const mitZip = await page.locator('#k3dCanvas').screenshot();
pruef('Senkrechtmarkise ist zu sehen', !mitMarkise.equals(mitZip));
pruef('Kurzfassung Sonnenschutz',
  /Senkrechtmarkise/.test(await page.locator('#k3dSumSonne').innerText()),
  await page.locator('#k3dSumSonne').innerText());

// Anzeige: Boden und Maße
const anzeige = page.locator('details').filter({ hasText: 'Anzeige' }).first();
await anzeige.locator('summary').click();
const steinBild = await page.locator('#k3dCanvas').screenshot();
await page.click('[data-k3d-seg="k3dBoden"] button[data-wert="Holzdielen"]');
await page.waitForTimeout(700);
pruef('Bodenbelag wechselt sichtbar', !steinBild.equals(await page.locator('#k3dCanvas').screenshot()));
const ohneMasse = await page.locator('#k3dCanvas').screenshot();
await page.check('#k3dMasse');
await page.waitForTimeout(800);
pruef('Maße erscheinen im Modell', !ohneMasse.equals(await page.locator('#k3dCanvas').screenshot()));

// Bedienfeld zuklappen
const vorher = (await page.locator('.k3d-buehne').boundingBox()).width;
await page.click('#k3dPanelAn');
await page.waitForTimeout(600);
const nachher = (await page.locator('.k3d-buehne').boundingBox()).width;
pruef('Bedienfeld klappt zu', nachher > vorher + 200, `${Math.round(vorher)} → ${Math.round(nachher)} px`);
await page.click('#k3dPanelAn');
await page.waitForTimeout(500);

// Ansicht „Darunter"
await page.click('[data-k3d-ansicht="Darunter"]');
await page.waitForTimeout(600);
pruef('Ansicht „Darunter" zeichnet', (await bildVielfalt()) > 25);

// Übergabe an den Anfrage-Assistenten
await page.click('[data-k3d-ansicht="Perspektive"]');
const konfigBreite = await page.inputValue('#k3dBreite');
await page.click('#k3dAnfrage');
await page.waitForTimeout(1200);
const panelOffen = await page.locator('#bvKonfigPanel').isVisible().catch(() => false);
pruef('Anfrage-Assistent öffnet sich', panelOffen);

/* Nichts darf wirklich verschickt werden – beide Wege werden abgefangen. */
await page.route('**/api/kontakt', r => r.fulfill({ status: 200, body: '{"ok":true}' }));
await page.route('https://api.web3forms.com/**', r => r.fulfill({ status: 200, body: '{"success":true}' }));

/* Rücklesen über die Zusammenfassung des Assistenten. Das ist die ehrliche
   Prüfung: dort steht genau das, was in die E-Mail geht. Der Assistent
   springt nach der Übergabe direkt zu den Kontaktdaten – also ausfüllen und
   einen Schritt weiter, aber NICHT absenden. */
const anrede = page.locator('#bvKonfigPanel button', { hasText: /^Frau$/ }).first();
if (await anrede.count()) await anrede.click();
await page.fill('#k_nachname', 'Testfall');
await page.fill('#k_email', 'pruefung@bv-aussensysteme.de');
await page.fill('#k_telefon', '026311234567');
await page.fill('#k_plz', '57537');
await page.fill('#k_ort', 'Hirtscheid');
await page.check('#k_consent');
await page.click('#awNext');
await page.waitForTimeout(500);

const zus = await page.locator('#bvKonfigPanel').innerText();
pruef('Zusammenfassung erreicht', /absenden/i.test(await page.locator('#awNext').textContent()));
pruef('Maß ist im Assistenten angekommen',
  zus.indexOf(konfigBreite + ' × ') > -1,
  'Konfigurator ' + konfigBreite + ' mm · ' +
  (zus.match(/Maße[^\n]*\n([^\n]*)/) || ['', 'nicht gefunden'])[1]);
pruef('Sonnenschutz steht in der Anfrage', /Aufdachmarkise/.test(zus));
pruef('Senkrechtmarkise steht in der Anfrage', /Senkrechtmarkise/.test(zus));
pruef('Notiz des Konfigurators geht mit', /Aus dem 3D-Konfigurator/.test(zus));

if (!GEGENPROBE) await page.screenshot({ path: 'pruefbilder/k3d-desktop.png' });

// ---------- Handy ----------
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
const m = await mctx.newPage();
m.setDefaultTimeout(8000);
const mFehler = [];
m.on('pageerror', e => mFehler.push(e.message));
await m.goto(BASIS, { waitUntil: 'networkidle' });
await m.waitForTimeout(1600);

const mbu = await m.locator('.k3d-buehne').boundingBox();
const msl = await m.locator('#k3dPanel').boundingBox();
pruef('Handy: Modell oben, Bedienfeld darunter', msl.y >= mbu.y + mbu.height - 2,
  `Bühne ${Math.round(mbu.height)}px, Panel ab y=${Math.round(msl.y)}`);
pruef('Handy: Bedienfeld über die ganze Breite', msl.width > 380);
pruef('Handy: keine Fehler', mFehler.length === 0, mFehler.join(' | ').slice(0, 120));

// Die Seite muss scrollen (das Bedienfeld hat KEINEN eigenen Scrollbereich)
const scrollbar = await m.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 50);
const innenScroll = await m.evaluate(() => {
  const e = document.querySelector('.k3d-sl-rollen');
  return e.scrollHeight > e.clientHeight + 20;
});
pruef('Handy: die Seite scrollt', scrollbar);
pruef('Handy: kein zweiter Scrollbereich im Bedienfeld', !innenScroll);

// Werkzeugleiste darf die Sprechblase nicht überdecken
const leiste = await m.locator('.k3d-leiste').boundingBox();
pruef('Handy: Werkzeugleiste lässt rechts Platz', leiste.x + leiste.width < 330,
  `endet bei x=${Math.round(leiste.x + leiste.width)}`);

if (!GEGENPROBE) await m.screenshot({ path: 'pruefbilder/k3d-handy.png' });

await browser.close();
server.kill();

if (!GEGENPROBE) {
  console.log(fehler === 0
    ? `\nErgebnis: alle ${ergebnisse.length} Prüfungen bestanden`
    : `\nErgebnis: ${fehler} von ${ergebnisse.length} Prüfung(en) nicht bestanden`);
  process.exit(fehler === 0 ? 0 : 1);
}

/* Diese Prüfungen MÜSSEN bei eingebauten Fehlern anschlagen. */
const sollenScheitern = [
  'Bedienfeld links von der Bühne',
  'Maße erscheinen im Modell',
  'Notiz des Konfigurators geht mit'
];
let luecken = 0;
sollenScheitern.forEach((name) => {
  const treffer = ergebnisse.find((e) => e[0] === name);
  if (!treffer) {
    console.log('  FEHLGESCHLAGEN ' + name + ' – Prüfung gar nicht gelaufen');
    luecken++;
  } else if (treffer[1]) {
    console.log('  FEHLGESCHLAGEN ' + name + ' – hat den eingebauten Fehler NICHT bemerkt');
    luecken++;
  } else {
    console.log('  erkannt        ' + name);
  }
});
console.log(luecken === 0
  ? 'Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden'
  : `Ergebnis: ${luecken} eingebaute Fehler blieben unbemerkt`);
process.exit(luecken === 0 ? 0 : 1);
