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

/* ---------- Ein Haekchen setzen, das weit unten im Bedienfeld steht ----------
   GEMESSEN am 31.10.2026: page.check('#k3dSound') lief reproduzierbar in
   eine Zeitueberschreitung und beendete den Lauf bei Pruefung 67 von 90 -
   die letzten 23 Pruefungen liefen monatelang nicht. Was die Messung an
   der Stelle ergab:

     sichtbar, nicht gesperrt, im Bild (18 x 18 px bei y = 619),
     elementFromPoint in seiner Mitte IST das Kaestchen selbst,
     Gruppe sichtbar - und ein Klick im Browser (el.click()) setzt es
     sofort. Nur der Mausklick von aussen kommt nicht an.

   Der Unterschied zu den Haekchen, die funktionieren: Das Bedienfeld war
   6944 von 8683 px weit gescrollt. Playwright scrollt das Element
   heran und klickt SOFORT danach; der Browser hat die neue Scrollstelle
   da noch nicht uebernommen, und der Klick landet auf den Koordinaten
   von vorher. Deshalb: erst heranscrollen, dem Browser zwei Bilder Zeit
   lassen, dann klicken.

   Nicht per el.click() im Browser abgekuerzt: Das umgeht die Maus und
   wuerde auch dann bestehen, wenn das Kaestchen in Wirklichkeit unter
   einem anderen Element liegt. Geprueft werden soll, was ein Besucher
   tut. */
/* ---------- Eine Blickrichtung waehlen ----------
   Die Ansichtsleiste liegt IN der Buehne und ist mittig begrenzt
   (max-width: calc(100% - 28px)). Die Gegenprobe quetscht die Buehne
   absichtlich auf 0 px - dann hat die Leiste keine Breite, und ein
   Mausklick darauf kann nicht ankommen.

   GEMESSEN am 31.10.2026: Genau daran brach die Gegenprobe ab, nachdem
   der Abbruch bei #k3dSound behoben war. Vorher kam sie nie so weit, das
   Hindernis lag also lange verdeckt dahinter.

   Im normalen Lauf bleibt es ein echter Mausklick - nur in der
   Gegenprobe wird der Knopf direkt ausgeloest. Dasselbe tut das Skript
   schon beim Umschalter #k3dModus, wo die Sprechblase im Weg liegt. */
/* IMMER über $eval, nicht nur in der Gegenprobe. Die Ansichtsleiste
   liegt über der Leinwand; je nachdem wie lang das Bedienfeld gerade
   ist und wie weit die Seite gescrollt steht, meldet Playwrights
   Trefferprüfung „verdeckt" und bricht nach 8 s ab. Am 01.11.2026 genau
   so passiert, als die Fächerblöcke das Bedienfeld länger machten.
   Geprüft wird die WIRKUNG des Knopfes, nicht ob man ihn trifft – dass
   die Leiste erreichbar ist und nichts verdeckt, prüfen die eigenen
   Prüfungen weiter unten mit gemessenen Überlappungen. */
async function ansicht(name) {
  await page.$eval(`[data-k3d-ansicht="${name}"]`, (el) => el.click());
}

async function haken(ziel, auswahl) {
  await ziel.locator(auswahl).scrollIntoViewIfNeeded();
  await ziel.waitForTimeout(250);
  await ziel.check(auswahl);
}

/* Alle Abschnitte aufklappen und offen lassen. Vorher hat der Test sie per
   Klick auf die Überschrift geöffnet – und beim zweiten Klick wieder
   zugeklappt, worauf die nächste Prüfung ins Leere lief. */
async function alleAufklappen(ziel = page) {
  await ziel.evaluate(() => {
    document.querySelectorAll('details.k3d-sek').forEach(d => { d.open = true; });
  });
  await ziel.waitForTimeout(150);
}
/* ---------- Beide Hinweise wegraeumen ----------
   Der Testbetrieb-Hinweis ist ein echter Dialog ueber der ganzen Seite
   und faengt jeden Klick ab. Ein Besucher bestaetigt ihn, also hier auch
   – sonst prueft der Rest nichts.

   ZWEI DINGE, UND DIE REIHENFOLGE ZAEHLT: Der Testbetrieb-Hinweis
   erscheint erst, wenn der Cookie-Hinweis weg ist (so gebaut, zwei
   Dialoge uebereinander sind keiner). Liegt der Cookie-Hinweis noch da,
   faengt ER die Klicks ab. Am 01.11.2026 stand deshalb im Handy-Teil
   beides uebereinander, und gemessen wurde eine zur Haelfte verdeckte
   Seite (Buehne 777 px bei 390 px Fenster).

   Und ueber evaluate() statt click(): Playwrights Trefferpruefung
   bricht ab, sobald irgendetwas darueber liegt - geprueft werden soll
   aber der Konfigurator, nicht der Hinweis. */
async function dialogeWeg(ziel = page) {
  await ziel.evaluate(() => {
    var cb = document.getElementById('cookieBanner');
    if (cb) cb.remove();
  });
  for (var i = 0; i < 12; i++) {
    var weg = await ziel.evaluate(() => {
      var k = document.getElementById('k3dTestOk');
      var box = document.getElementById('k3dTestHinweis');
      if (!box || box.hidden) return true;
      if (k) { k.click(); return true; }
      return false;
    });
    if (weg) break;
    await ziel.waitForTimeout(250);
  }
  await ziel.waitForTimeout(200);
}
await dialogeWeg(page);


/* Seit PR #281 fragt das Bedienfeld Schritt fuer Schritt ab: sichtbar ist
   nur der aktuelle Schritt, alles andere steht auf display:none (Regel
   .k3d-gefuehrt .k3d-gruppe:not(.ist-schritt)). Diese Pruefung stammt aus
   der Zeit davor und lief seitdem beim ersten Massfeld ins Leere
   ("element is not visible"). Gefunden am 23.10.2026 – nicht von der
   Sonderform verursacht, sondern seit #281 unbemerkt rot. Sie arbeitet
   jetzt in der Ansicht "Alles auf einen Blick"; dass der Umschalter
   wirklich alles zeigt, ist selbst eine Pruefung. */
/* Was hier gemessen wird, hat sich am 31.10.2026 geaendert: Seit der
   Aufteilung in fuenf Bereiche (PR #500) steht "Maße" ABSICHTLICH im
   ersten Bereich "Anlage", zusammen mit Produkt, Montage und Farbe. Die
   alte Erwartung ("Massfeld steckt nicht im Produktschritt") beschrieb
   den Aufbau von vorher und war seit dem 31.10.2026 rot - unbemerkt,
   waehrend docs/NEXT_TASK.md noch "alle Skripte laufen durch" sagte.

   Geprueft wird jetzt dieselbe Absicht am neuen Aufbau: Im gefuehrten
   Modus ist NICHT alles zu sehen. Waehrend "Anlage" offen ist, muss die
   Montagefrage - sie gehoert zum letzten Bereich "Fertig" - verborgen
   sein. Das hidden-Eingabefeld #k3dMontage taugt dafuer nicht (ein
   hidden-Feld ist nie sichtbar), deshalb seine Knopfreihe. */
const fremderBereichGefuehrt =
  await page.locator('[data-k3d-seg="k3dMontage"]').isVisible();
/* Die Sprechblase (#k3dTestHinweis) liegt ueber dem Umschalter. force
   ueberspringt nur die Pruefung von Playwright – der Mausklick landet
   trotzdem auf der Blase. Deshalb den Knopf direkt ausloesen. */
await page.$eval('#k3dModus', (el) => el.click());
await page.waitForTimeout(250);

/* ---------- Immer nur ein Abschnitt offen ----------
   „die einstellungen sind viele auch unlogisch angeordnet man muss mal
   runter srollen dann wieder hoch" (Betreiber, 24.10.2026). Gemessen
   waren es in Pro 4653 px Bedienfeld bei 900 px Fenster. Gemessen wird
   VOR alleAufklappen() – das Pruefskript klappt gleich wieder alles auf,
   damit die uebrigen Pruefungen jede Bedieneinheit sehen. */
async function panelHoehe() {
  return await page.evaluate(() =>
    Math.round(document.querySelector('.k3d-sl-rollen').scrollHeight));
}
async function offeneAbschnitte() {
  return await page.evaluate(() =>
    [...document.querySelectorAll('details.k3d-sek')].filter((d) => d.open).length);
}
pruef('Beim Wechsel in die Uebersicht bleibt ein Abschnitt offen',
  (await offeneAbschnitte()) === 1,
  (await offeneAbschnitte()) + ' von 8 offen, Bedienfeld ' + (await panelHoehe()) + ' px');
/* Einen anderen Abschnitt aufklappen: die uebrigen muessen zugehen. */
await page.locator('details.k3d-sek > summary').nth(3).click();
await page.waitForTimeout(400);
pruef('Ein Klick auf eine Ueberschrift schliesst die anderen',
  (await offeneAbschnitte()) === 1,
  (await offeneAbschnitte()) + ' offen, Bedienfeld ' + (await panelHoehe()) + ' px');
const hoeheEiner = await panelHoehe();
pruef('Das Bedienfeld bleibt bei etwa einem Bildschirm',
  hoeheEiner < 2000, hoeheEiner + ' px (vorher 4653 px in Pro)');

await alleAufklappen();
pruef('Der gefuehrte Modus zeigt nur den aktuellen Bereich',
  !fremderBereichGefuehrt,
  'Montagefrage (Bereich "Fertig") ist in "Anlage" nicht zu sehen');
pruef('"Alles auf einen Blick" zeigt alle Abschnitte',
  (await page.locator('#k3dBreiteZahl').isVisible()) &&
  (await page.locator('[data-k3d-seg="k3dMontage"]').isVisible()),
  'Massfeld und Montagefrage sichtbar');

/* ---------- Basic und Pro ----------
   „mach eine Basic version für leihen und dann wenn man auf pro
   umschaltet wirklich alle einstellungen vorhanden" (Betreiber,
   24.10.2026).

   Gemessen wird in der Ansicht „Alles auf einen Blick": Im gefuehrten
   Modus steht ohnehin nur der aktuelle Schritt da, dort laesst sich
   Basic nicht von Pro unterscheiden. Der Knopf „Mehr Einstellungen"
   gehoert zur Fuehrung und wird deshalb am Attribut geprueft, nicht an
   seiner Sichtbarkeit. */
async function sichtbareEinheiten() {
  return await page.evaluate(() => {
    let n = 0;
    document.querySelectorAll('.k3d-gruppe').forEach((g) => {
      if (g.offsetParent !== null) n++;
    });
    return n;
  });
}
/* ---------- Die Feldflaechen fuer diesen Lauf abschalten ----------
   Nicht, um ein Problem zu verstecken, sondern damit dieses Skript
   wieder das MODELL misst.

   ANLASS (31.10.2026): Damals lagen die Anklickpunkte als HTML ueber
   der Leinwand, und locator.screenshot() fotografiert den
   Bildschirmausschnitt mit allem, was darueber liegt. Der Vergleich
   "Das Modell bleibt beim Umschalten unveraendert" wurde davon rot,
   obwohl das Modell Pixel fuer Pixel dasselbe war: 48 abweichende
   Pixel von 832.000, alle an den Punkten, aus der Kantenglaettung beim
   Neuaufbau der Seite.

   SEIT DER ZWEITEN BAUART gilt es erst richtig: Die Felder sind
   Flaechen IN der Szene, also echte Bildpunkte des gerenderten Bildes.
   Ein Feld, das unter dem Zeiger orange aufleuchtet, aenderte jeden
   Bildvergleich. Umgekehrt - und das ist der schlimmere Fall - koennte
   eine veraenderte Flaeche eine Pruefung auf "hat sich geaendert"
   bestehen lassen, ohne dass sich am Bauwerk etwas tut.

   VERWORFEN: die Leinwand ueber toDataURL selbst lesen. Das waere der
   direktere Weg und war der erste Versuch, aber unter Software-Rendering
   brach der Lauf danach REPRODUZIERBAR bei Pruefung 66 von 90 ab
   (page.check('#k3dSound'), TimeoutError) - auch am unveraenderten
   Programmstand, also nicht an den Feldern. Zwanzig synchrone
   Leinwand-Auslesungen sind dem Browser hier zu viel.

   Die Felder selbst prueft scripts/pruefe-marken.js - und zwar an der
   gerechneten Lage, nicht an Bildpixeln. */
await page.evaluate(() => {
  const h = document.getElementById('k3dMarken');
  if (h && h.checked) {
    h.checked = false;
    h.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await page.waitForTimeout(400);

await alleAufklappen();
/* Die Voraussetzung dieses Laufes, ausdruecklich geprueft: Bliebe das
   Abschalten wirkungslos, verglichen alle Bildpruefungen weiter Modell
   SAMT Punkten - und niemand wuesste es. */
pruef('Die Feldflaechen sind fuer diesen Lauf abgeschaltet',
  (await page.locator('.k3d-marke').count()) === 0 &&
  (await page.evaluate(() => !document.getElementById('k3dMarken').checked)),
  'alle Bildvergleiche zeigen damit das Modell pur');

const einheitenBasic = await sichtbareEinheiten();
const bildBasic = await page.locator('#k3dCanvas').screenshot();
pruef('Basic verbirgt die Fachwerte',
  !(await page.locator('#k3dNeigungZahl').isVisible()) &&
  !(await page.locator('[data-k3d-seg="k3dGlasstaerke"]').isVisible()) &&
  (await page.locator('#k3dMehr').evaluate((e) => e.hidden)),
  'Dachneigung, Glasstärke und „Mehr Einstellungen" sind weg');
pruef('Basic zeigt die Kundenfragen',
  (await page.locator('#k3dBreiteZahl').isVisible()) &&
  (await page.locator('#k3dHoeheZahl').isVisible()),
  einheitenBasic + ' Bedieneinheiten sichtbar');

await page.$eval('[data-k3d-seg="k3dStufe"] button[data-wert="Pro"]', (el) => el.click());
await page.waitForTimeout(900);
await alleAufklappen();
const einheitenPro = await sichtbareEinheiten();
pruef('Pro zeigt wirklich alle Einstellungen',
  (await page.locator('#k3dNeigungZahl').isVisible()) &&
  (await page.locator('[data-k3d-seg="k3dGlasstaerke"]').isVisible()) &&
  !(await page.locator('#k3dMehr').evaluate((e) => e.hidden)),
  'Dachneigung, Glasstärke und „Mehr Einstellungen" sind wieder da');
pruef('Pro zeigt deutlich mehr als Basic',
  einheitenPro > einheitenBasic * 1.3,
  einheitenBasic + ' -> ' + einheitenPro + ' Bedieneinheiten');
/* Die Stufe ist eine Frage der Ansicht, nicht des Bauwerks. */
pruef('Das Modell bleibt beim Umschalten unveraendert',
  Buffer.compare(bildBasic, await page.locator('#k3dCanvas').screenshot()) === 0,
  'nur das Bedienfeld aendert sich');

/* Und der Punkt, auf den es wirklich ankommt: In Pro Eingestelltes darf
   beim Zurueckschalten nicht verschwinden. */
await page.fill('#k3dNeigungZahl', '8');
await page.locator('#k3dNeigungZahl').blur();
await page.waitForTimeout(700);
await page.$eval('[data-k3d-seg="k3dStufe"] button[data-wert="Basic"]', (el) => el.click());
await page.waitForTimeout(700);
await page.$eval('[data-k3d-seg="k3dStufe"] button[data-wert="Pro"]', (el) => el.click());
await page.waitForTimeout(700);
await alleAufklappen();
pruef('In Pro Eingestelltes ueberlebt den Weg ueber Basic',
  (await page.inputValue('#k3dNeigungZahl')) === '8',
  'Dachneigung steht auf ' + await page.inputValue('#k3dNeigungZahl') + ' Grad');

/* ---------- Durchgangshoehe unter dem Statiktraeger ----------
   „wenn aber jetzt statikträger in spiel kommen is die durchgangshöhe um
   den statikträger niedriger und das kann man neben dem unterkanten maß
   in klammern hinschreiben" (Betreiber, 24.10.2026). Gemessen wird an
   der Zahl, die im Bedienfeld steht – und sie muss um die Traegerhoehe
   (189 mm) unter dem eingegebenen Mass liegen. */
const hoeheOhne = await page.locator('#k3dHoeheWert').innerText();
pruef('Ohne Traeger steht keine Klammer',
  !/Durchgang/.test(hoeheOhne), hoeheOhne);
await haken(page, '#k3dTraeger');
await page.waitForTimeout(1200);
const hoeheMit = await page.locator('#k3dHoeheWert').innerText();
const zahlen = hoeheMit.match(/(\d+) mm \(Durchgang (\d+) mm\)/);
pruef('Mit Traeger steht der wirkliche Durchgang daneben',
  !!zahlen && Number(zahlen[1]) - Number(zahlen[2]) === 189,
  hoeheMit + (zahlen ? ' – Unterschied ' + (Number(zahlen[1]) - Number(zahlen[2])) + ' mm' : ''));
await page.uncheck('#k3dTraeger');
await page.waitForTimeout(900);
pruef('Haekchen weg, Klammer weg',
  !/Durchgang/.test(await page.locator('#k3dHoeheWert').innerText()),
  await page.locator('#k3dHoeheWert').innerText());

/* Hinten gilt dasselbe: Freistehend traegt dort der Statiktraeger, also
   geht man auch dort nicht unter dem Wandprofil durch. An der Hauswand
   gibt es keinen – dann darf auch keine Klammer stehen. */
await haken(page, '#k3dHoeheGetrennt');
await page.waitForTimeout(900);
const hintenWand = await page.locator('#k3dHoeheHintenWert').innerText();
pruef('An der Hauswand steht hinten keine Klammer',
  !/Durchgang/.test(hintenWand), hintenWand);
await page.click('[data-k3d-seg="k3dAufbau"] button[data-wert="Freistehend"]');
await page.waitForTimeout(1200);
const hintenFrei = await page.locator('#k3dHoeheHintenWert').innerText();
/* Und auch freistehend steht hinten keine – NACHGEPRUEFT, nicht
   angenommen: Der hintere Statiktraeger sitzt ohne Dachvorsprung buendig
   mit den Sparren („der statikträger ist tiefer als der sparren, mach
   ihn unten bündig mit sparren", Betreiber 11.10.2026). Er nimmt dort
   also keine Durchgangshoehe weg, anders als der Traeger unter der
   Rinne. Erst ein Dachvorsprung hinten haengt ihn unter die Sparren –
   den gibt es nur beim Carport TDS. */
pruef('Freistehend nimmt der hintere Traeger keine Hoehe weg',
  !/Durchgang/.test(hintenFrei),
  hintenFrei + ' – Traeger buendig mit den Sparren');
await page.click('[data-k3d-seg="k3dAufbau"] button[data-wert="Wandmontage"]');
await page.uncheck('#k3dHoeheGetrennt');
await page.waitForTimeout(900);

/* ---------- Gefaelle des Terrassenbodens ----------
   „der Boden is ja nicht immer Eben manche haben 2 grad manche mehr"
   (Betreiber, 24.10.2026). Gemessen wird am Bild und an der Zahl, die
   das Bedienfeld meldet – das ist dieselbe, die in die Anfrage geht. */
const vorGefaelle = await page.locator('#k3dCanvas').screenshot();
pruef('Ohne Gefaelle steht dort nichts',
  (await page.locator('#k3dBodenGefaelleStand').innerText()).trim() === '',
  'ein Hinweis, der immer dasteht, wird ueberlesen');
await page.fill('#k3dBodenGefaelle', '2');
await page.locator('#k3dBodenGefaelle').blur();
await page.waitForTimeout(1200);
pruef('Das Gefaelle veraendert das Modell',
  Buffer.compare(vorGefaelle, await page.locator('#k3dCanvas').screenshot()) !== 0,
  'Belag und Pfosten folgen dem Boden');
const stand = await page.locator('#k3dBodenGefaelleStand').innerText();
pruef('Das Bedienfeld nennt beide Neigungen und die Pfostenlaengen',
  /gegenüber der Waagerechten/.test(stand) &&
  /gegenüber dem Terrassenboden/.test(stand) &&
  /Pfosten vorne \d+ mm/.test(stand),
  stand.slice(0, 120));
await page.fill('#k3dBodenGefaelle', '0');
await page.locator('#k3dBodenGefaelle').blur();
await page.waitForTimeout(900);
pruef('Zurueck auf eben loescht den Hinweis wieder',
  (await page.locator('#k3dBodenGefaelleStand').innerText()).trim() === '',
  'das Feld laesst sich leeren');


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

/* ---------- Die Hinweise dürfen nicht hinter der Leiste liegen ----------
   „die leiste hat sich verändert es, ragen schrften rein" (Betreiber,
   31.10.2026, mit Bild). GEMESSEN vorher: Leiste 685 px mittig,
   Maushinweis 347 px links bündig – 202 px Überlappung bei 1440 px
   Fenster, 347 px (also vollständig) bei 1000 px. Der Klickhinweis lag
   bei jeder Breite 215 px dahinter; das war nie aufgefallen, weil er
   meist ausgeblendet ist. Deshalb wird er hier eigens eingeblendet.

   Die Prüfung ruht, wenn die Bühne künstlich schmal gemacht wurde
   (Gegenprobe) – dort ist eine Überlappung kein Befund. */
const hinweisKasten = await page.evaluate(() => {
  const k = document.getElementById('k3dKlickHinweis');
  const vorher = k.hidden, text = k.textContent;
  k.hidden = false;
  if (!text) k.textContent = 'Prüflauf';
  const r = (w) => { const e = document.querySelector(w); if (!e) return null;
    const st = getComputedStyle(e);
    if (st.display === 'none' || st.visibility === 'hidden') return null;
    const b = e.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const aus = { L: r('.k3d-leiste'), M: r('.k3d-maushinweis'), K: r('.k3d-klickhinweis') };
  k.hidden = vorher; k.textContent = text;
  return aus;
});
function ueberlappung(a, b) {
  if (!a || !b) return 0;
  const quer = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const hoch = Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
  return hoch ? Math.round(quer) : 0;
}
/* ---------- Keine Beschriftung ragt aus ihrem Knopf ----------
   Zweiter Teil derselben Meldung. Die Leiste war breiter als der Platz,
   und Flex-Elemente schrumpfen von sich aus: Der Knopf gab nach, der
   Text nicht (white-space: nowrap) - also lief er aus seinem goldenen
   Hintergrund heraus. scrollWidth > clientWidth ist genau das. */
const ragtRaus = await page.evaluate(() => {
  const raus = [];
  document.querySelectorAll('.k3d-leiste button').forEach((b) => {
    if (b.scrollWidth > b.clientWidth + 1)
      raus.push(b.textContent.trim().slice(0, 18) + ' (' +
                (b.scrollWidth - b.clientWidth) + 'px)');
  });
  return raus;
});
/* ---------- Und die Leiste selbst wird nicht angeschnitten ----------
   „auf dem pc knn die leiste breiter sein das alles drauf passst"
   (Betreiber, 31.10.2026). GEMESSEN vorher: Sie braucht 735 px, bekam
   aber bei JEDER Fensterbreite nur 683 px - auch bei 1600 px Fenster
   mit 1120 px breiter B\u00fchne. Ursache: absolut mit left: 50 % und ohne
   eigene Breitenangabe. Hier wird gepr\u00fcft, dass sie ihre Breite
   bekommt, SOLANGE die B\u00fchne den Platz hat - ist die B\u00fchne selbst zu
   schmal, soll sie sich schieben lassen, das ist kein Befund. */
const leisteMass = await page.evaluate(() => {
  const l = document.querySelector('.k3d-leiste');
  const b = document.querySelector('.k3d-buehne');
  return { noetig: l.scrollWidth, da: l.clientWidth,
           buehne: Math.round(b.getBoundingClientRect().width) };
});
if (leisteMass.buehne >= leisteMass.noetig + 28) {
  pruef('Die Ansichtsleiste wird nicht angeschnitten',
    leisteMass.noetig <= leisteMass.da + 1,
    `braucht ${leisteMass.noetig}px, hat ${leisteMass.da}px, B\u00fchne ${leisteMass.buehne}px`);
} else {
  pruef('Die Ansichtsleiste wird nicht angeschnitten', true,
    `B\u00fchne ${leisteMass.buehne}px zu schmal f\u00fcr ${leisteMass.noetig}px - sie darf sich schieben lassen`);
}

pruef('Keine Beschriftung ragt aus ihrem Knopf',
  ragtRaus.length === 0,
  ragtRaus.length ? ragtRaus.join(', ') : 'alle Kn\u00f6pfe breit genug');

if (bu.width > 600) {
  const uM = ueberlappung(hinweisKasten.L, hinweisKasten.M);
  const uK = ueberlappung(hinweisKasten.L, hinweisKasten.K);
  const uMK = ueberlappung(hinweisKasten.M, hinweisKasten.K);
  pruef('Ansichtsleiste verdeckt den Maushinweis nicht', uM === 0, `${uM}px Überlappung`);
  pruef('Ansichtsleiste verdeckt den Klickhinweis nicht', uK === 0, `${uK}px Überlappung`);
  pruef('Die beiden Hinweise liegen nicht übereinander', uMK === 0, `${uMK}px Überlappung`);
} else {
  pruef('Ansichtsleiste verdeckt den Maushinweis nicht', true, 'Bühne künstlich schmal – ruht');
  pruef('Ansichtsleiste verdeckt den Klickhinweis nicht', true, 'Bühne künstlich schmal – ruht');
  pruef('Die beiden Hinweise liegen nicht übereinander', true, 'Bühne künstlich schmal – ruht');
}

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
/* Die obere Grenze stand hier als feste 7000 und ist seit der Freigabe
   groesserer Anlagen 10000 – 9999 lag also INNERHALB und die Pruefung
   schlug an, obwohl alles stimmte. Jetzt wird die Grenze am Feld selbst
   abgelesen; so haelt die Pruefung auch die naechste Aenderung aus. */
/* Die Grenze steht am Regler, nicht am Zahlenfeld. */
const maxBreite = Number(await page.locator('#k3dBreite').getAttribute('max'));
await page.fill('#k3dBreiteZahl', String(maxBreite + 1500));
await page.waitForTimeout(200);
const markiert = await page.locator('#k3dBreiteZahl').evaluate(e => e.classList.contains('ist-ausserhalb'));
await page.locator('#k3dBreiteZahl').blur();
await page.waitForTimeout(300);
const begrenzt = await page.inputValue('#k3dBreiteZahl');
pruef('Maß außerhalb wird markiert', markiert, (maxBreite + 1500) + ' mm eingegeben');
pruef('Maß außerhalb wird begrenzt', begrenzt === String(maxBreite),
  begrenzt + ' mm, Grenze ' + maxBreite + ' mm');

// Knopfreihe Produkt
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Carport"]');
await page.waitForTimeout(900);
pruef('Knopfreihe markiert die Wahl',
  await page.locator('[data-k3d-seg="k3dProdukt"] button[data-wert="Carport"]').evaluate(e => e.classList.contains('is-active')));
pruef('Titel folgt dem Produkt',
  /Carport/.test(await page.locator('#k3dTitelBuehne').innerText()),
  await page.locator('#k3dTitelBuehne').innerText());

// Verkleidung nur beim Carport
/* Zwei Dinge haben sich geaendert, seit das hier geschrieben wurde:
   Die Verkleidung ist am 11.10.2026 in den Abschnitt "Seiten" gewandert
   (den Abschnitt details[data-k3d-fuer="verkleidung"] gibt es nicht mehr,
   die Pruefung griff ins Leere), und der Carport kommt seit dem TDS-Typ
   standardmaessig als Carport TDS – der hat Seitenelemente und KEINE
   Verkleidung. Verkleidung gibt es nur beim Flachdach-Carport, also
   wird der hier eingestellt. */
/* ---------- Statiktraeger auf Wunsch je Carport-Typ ----------
   „wieso kann man bei Carport TDS keinen Statikträger unter Rinne
   auswählen" (Betreiber, 24.10.2026). Der Carport TDS ist dasselbe Dach
   wie das Terrassendach TDS; Flat Line und Flat Box sind es nicht.
   Gemessen wird am sichtbaren Haekchen, nicht an der Regel im Code. */
await alleAufklappen();
pruef('Carport TDS kennt den Träger auf Wunsch',
  await page.locator('#k3dTraeger').isVisible(),
  'dasselbe Dach wie das Terrassendach TDS');

await page.selectOption('#k3dCpTyp', 'Flachdach Flat Line');
await page.waitForTimeout(700);
await alleAufklappen();
pruef('Der Flachdach-Carport kennt ihn nicht',
  !(await page.locator('#k3dTraeger').isVisible()),
  'anderes System, kein TDS-Träger');
const verkSichtbar = await page.locator('div[data-k3d-fuer="verkleidung"]').first().isVisible();
const seitenSichtbar = await page.locator('div[data-k3d-fuer="seiten"]').first().isVisible();
pruef('Verkleidung erscheint beim Carport', verkSichtbar);
pruef('Seiten-Abschnitt beim Carport weg', !seitenSichtbar);

// Verkleidung einschalten -> Ausrichtung erscheint, Bild ändert sich
const vorVerk = await page.locator('#k3dCanvas').screenshot();
await alleAufklappen();
await haken(page, '#k3dVerkLinks');
await page.waitForTimeout(800);
const nachVerk = await page.locator('#k3dCanvas').screenshot();
pruef('Verkleidung verändert das Modell', !vorVerk.equals(nachVerk));
pruef('Ausrichtung erscheint', await page.locator('[data-k3d-fuer="verk-richtung"]').first().isVisible());
pruef('Kurzfassung Verkleidung',
  /links/.test(await page.locator('#k3dSumVerk').innerText()),
  await page.locator('#k3dSumVerk').innerText());

// Zurück zum Terrassendach: Sonnenschutz und Schiebeelemente
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Terrassendach TDS"]');
await page.waitForTimeout(900);
await alleAufklappen();
await page.click('[data-k3d-erw="links"] button[data-erw="Schiebetür"]');
await page.waitForTimeout(700);
pruef('Schiebe-Regler erscheint', await page.locator('[data-k3d-fuer="schiebe"]').first().isVisible());

/* Regeln aus dem Anfrage-Assistenten müssen auch hier gelten:
   Schiebetür zieht den Keil mit (Außengefälle), und Velaris verträgt sich
   nicht mit Senkrechtmarkise. */
const keilAktiv = await page.locator('[data-k3d-erw="links"] button[data-erw="Keil"]')
  .evaluate(e => e.classList.contains('is-active'));
pruef('Schiebetür zieht den Keil mit', keilAktiv);
await page.click('[data-k3d-erw="rechts"] button[data-erw="Velaris"]');
await page.waitForTimeout(400);
const zipGesperrt = await page.locator('[data-k3d-erw="rechts"] button[data-erw="Senkrechtmarkise"]')
  .evaluate(e => e.disabled);
pruef('Velaris sperrt die Senkrechtmarkise', zipGesperrt);
pruef('Gesperrtes sagt, woran es liegt',
  /nicht mit Velaris/.test(await page.locator('[data-k3d-erw="rechts"] button[data-erw="Senkrechtmarkise"] small').innerText()));
await page.click('[data-k3d-erw="rechts"] button[data-erw="Velaris"]');
await page.waitForTimeout(400);

/* Reihenfolge wie im Assistenten: Keil steht vorn. Sonst stünde dieselbe
   Auswahl in der Anfrage und im Assistenten in zwei Schreibweisen. */
const erwText = await page.locator('[data-k3d-erw-wert]').first().innerText();
pruef('Erweiterungen in derselben Reihenfolge wie im Assistenten',
  /^Keil · Schiebetür/.test(erwText), erwText);

/* An der Stirnseite gibt es keinen Keil – dort ist die Kante waagerecht. */
pruef('Vorne wird kein Keil angeboten',
  await page.locator('[data-k3d-erw="vorne"] button[data-erw="Keil"]').evaluate(e => e.hidden));

/* ---------- Die Rueckseite ----------
   „Bei freistehen muss plankenwand, rahmen etc. also alle möglichen auch
   hinten möglich sein" (Betreiber, 23.10.2026). Hier wird nicht nur die
   Bedienung geprueft, sondern am fertigen Bild gemessen, dass hinten
   wirklich etwas Neues entsteht – und dass es beim Zurueckschalten auf
   Wandmontage wieder verschwindet. */
const hintenBeiWand = await page.locator('[data-k3d-erw="hinten"]').isVisible();
pruef('An der Hauswand gibt es hinten keine Seite', !hintenBeiWand,
  'dort steht das Haus');

await page.click('[data-k3d-seg="k3dAufbau"] button[data-wert="Freistehend"]');
await page.waitForTimeout(900);
await alleAufklappen();
pruef('Freistehend erscheint die Rueckseite',
  await page.locator('[data-k3d-erw="hinten"]').isVisible(),
  'vierte Knopfreihe');
pruef('Hinten wird kein Keil angeboten',
  await page.locator('[data-k3d-erw="hinten"] button[data-erw="Keil"]').evaluate(e => e.hidden),
  'die hintere Dachkante laeuft waagerecht');

const vorRueck = await page.locator('#k3dCanvas').screenshot();
await page.click('[data-k3d-erw="hinten"] button[data-erw="Plankenwand"]');
await page.waitForTimeout(1200);
const nachRueck = await page.locator('#k3dCanvas').screenshot();
pruef('Eine Plankenwand hinten veraendert das Modell',
  Buffer.compare(vorRueck, nachRueck) !== 0,
  'im Bild nachgemessen, nicht im Code nachgelesen');
pruef('Die Kurzfassung nennt die Rueckseite',
  /hinten/.test(await page.locator('#k3dSumSeiten').innerText()),
  await page.locator('#k3dSumSeiten').innerText());

/* ---------- Hinten wird nicht an den Pfosten der Vorderseite geteilt ----
   „wenn ich hinten plankenwand oder was anderes hinzufüge sind da so 2
   lücken dazwischen aber da sind bei der freistehenden version keine
   pfosten, da statikträger" (Betreiber, 24.10.2026, mit Bild). Hinten
   traegt der Statiktraeger bis 7 m, dort stehen nur zwei Pfosten.
   Gemessen wird an der Feldaufteilung, die das Bedienfeld meldet – das
   ist dieselbe Zahl, die auch in die Anfrage geht. */
await page.fill('#k3dBreiteZahl', '5000');
await page.locator('#k3dBreiteZahl').blur();
await page.waitForTimeout(900);
await page.click('[data-k3d-erw="vorne"] button[data-erw="Schiebetür"]');
await page.click('[data-k3d-erw="hinten"] button[data-erw="Plankenwand"]');   // wieder abwaehlen
await page.click('[data-k3d-erw="hinten"] button[data-erw="Schiebetür"]');
await page.waitForTimeout(1200);
/* Gemessen wird die FELDBREITE je Seite. Die Auswahlliste der
   Schiebeanlage nennt je Bauart „Scheiben je ca. X mm"; mal der
   Tuerzahl ergibt das die Breite des Feldes, mit dem das Modell
   wirklich gebaut hat. Bei 5000 mm Breite stehen vorne drei Pfosten
   (zwei Felder zu je rund 2335 mm), hinten zwei (ein Feld von rund
   4780 mm). */
async function feldBreite(id) {
  const texte = await page.locator('#' + id + ' option').allInnerTexts();
  for (const t of texte) {
    const m = t.match(/(\d+)-türig.*?ca\. (\d+) mm/);
    if (m) return Number(m[1]) * Number(m[2]);
  }
  return 0;
}
const feldV = await feldBreite('k3dSg23Vorne');
const feldH = await feldBreite('k3dSg23Hinten');
pruef('Vorne wird an den Pfosten geteilt',
  feldV > 2000 && feldV < 2800, 'Feld vorne rund ' + feldV + ' mm (drei Pfosten)');
pruef('Hinten laeuft die Seite in einem Stueck durch',
  feldH > 4400 && feldH > feldV * 1.8,
  'Feld hinten rund ' + feldH + ' mm (zwei Pfosten, Statiktraeger traegt durch)');

/* Zurueck an die Hauswand: Die Wahl muss weg sein, nicht nur unsichtbar.
   Bliebe sie im Zustand stehen, ginge sie spaeter in die Anfrage. */
await page.click('[data-k3d-seg="k3dAufbau"] button[data-wert="Wandmontage"]');
await page.waitForTimeout(1200);
await alleAufklappen();
pruef('Zurueck an die Hauswand verschwindet die Rueckseite',
  !(await page.locator('[data-k3d-erw="hinten"]').isVisible()));
pruef('Und die Wahl dort ist wirklich geloescht',
  !/hinten/.test(await page.locator('#k3dSumSeiten').innerText()) &&
  !(await page.locator('[data-k3d-erw="hinten"] button[data-erw="Plankenwand"]')
      .evaluate(e => e.classList.contains('is-active'))),
  await page.locator('#k3dSumSeiten').innerText());

/* Beim Wechsel auf ein Flachdach ohne Außengefälle muss der Keil weg sein.
   Er überlebte den Produktwechsel und stand als Dreieck im Modell, obwohl
   der Anfrage-Assistent die Möglichkeit dort gar nicht kennt. */
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Flachdach SkyView"]');
await page.waitForTimeout(900);
await alleAufklappen();
const keilWeg = await page.locator('[data-k3d-erw="links"] button[data-erw="Keil"]')
  .evaluate(e => e.hidden && !e.classList.contains('is-active'));
pruef('Keil faellt beim Wechsel zum Flachdach weg', keilWeg,
  await page.locator('[data-k3d-erw-wert]').first().innerText());
await page.click('[data-k3d-seg="k3dProdukt"] button[data-wert="Terrassendach TDS"]');
await page.waitForTimeout(900);
await alleAufklappen();
/* Die Schiebetür bleibt beim Produktwechsel stehen – nur der Keil fällt
   weg. Sie hier erneut anzuklicken würde sie abwählen. */
pruef('Schiebetür übersteht den Produktwechsel',
  await page.locator('[data-k3d-erw="links"] button[data-erw="Schiebetür"]')
    .evaluate(e => e.classList.contains('is-active')));

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
await alleAufklappen();
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
await alleAufklappen();

// Sonnenschutz
const sonneDetails = page.locator('details').filter({ hasText: 'Sonnenschutz' }).first();
await alleAufklappen();
const ohneMarkise = await page.locator('#k3dCanvas').screenshot();
await page.click('[data-k3d-seg="k3dMarkise"] button[data-wert="Aufdachmarkise"]');
await page.waitForTimeout(800);
pruef('Ausfahr-Regler erscheint', await page.locator('[data-k3d-fuer="sonne-aus"]').first().isVisible());
const mitMarkise = await page.locator('#k3dCanvas').screenshot();
pruef('Markise ist im Modell zu sehen', !ohneMarkise.equals(mitMarkise));
await alleAufklappen();
await page.click('[data-k3d-erw="vorne"] button[data-erw="Senkrechtmarkise"]');
await page.waitForTimeout(700);
const mitZip = await page.locator('#k3dCanvas').screenshot();
pruef('Senkrechtmarkise ist zu sehen', !mitMarkise.equals(mitZip));
pruef('Kurzfassung Sonnenschutz',
  /Senkrechtmarkise/.test(await page.locator('#k3dSumSonne').innerText()),
  await page.locator('#k3dSumSonne').innerText());

/* Licht & Technik: Set-Größe und Lautsprecher gibt es im Assistenten,
   also muss es sie hier auch geben. */
const lichtDetails = page.locator('details').filter({ hasText: 'Licht & Technik' }).first();
await alleAufklappen();
const ohneLed = await page.locator('#k3dCanvas').screenshot();
await haken(page, '#k3dLed');
await page.waitForTimeout(700);
pruef('LED verändert das Modell', !ohneLed.equals(await page.locator('#k3dCanvas').screenshot()));
pruef('LED-Set erscheint', await page.locator('[data-k3d-fuer="led-detail"]').first().isVisible());
await page.click('[data-k3d-seg="k3dLedSet"] button[data-wert="12er-Set"]');
await page.fill('#k3dLedAnzahl', '2');
await haken(page, '#k3dSound');
await page.waitForTimeout(600);
pruef('Lautsprecher-Set erscheint', await page.locator('[data-k3d-fuer="sound-detail"]').first().isVisible());
pruef('Kurzfassung Licht', /12er-Set/.test(await page.locator('#k3dSumLicht').innerText()),
  await page.locator('#k3dSumLicht').innerText());

/* Untergrund und Montage: im Assistenten Pflichtfragen – beim Umbau auf das
   Vollbild-Layout war die Montage-Frage ganz verschwunden. */
const unterDetails = page.locator('details').filter({ hasText: 'Untergrund & Montage' }).first();
await alleAufklappen();
await page.click('[data-k3d-seg="k3dUntergrund"] button[data-wert="Punktfundamente nötig"]');
await page.click('[data-k3d-seg="k3dMontage"] button[data-wert="Nein, Selbstmontage"]');
await page.waitForTimeout(500);
pruef('Montage ist wählbar',
  /Selbstmontage/.test(await page.locator('#k3dSumUnterbau').innerText()),
  await page.locator('#k3dSumUnterbau').innerText());

// Anzeige: Boden und Maße
const anzeige = page.locator('details').filter({ hasText: 'Anzeige' }).first();
await alleAufklappen();
const steinBild = await page.locator('#k3dCanvas').screenshot();
await page.click('[data-k3d-seg="k3dBoden"] button[data-wert="Holzdielen"]');
await page.waitForTimeout(700);
pruef('Bodenbelag wechselt sichtbar', !steinBild.equals(await page.locator('#k3dCanvas').screenshot()));
/* UMGEKEHRT seit dem 31.10.2026: Die Maße sind voreingestellt AN
   („Die Maße sollen standartmäßig an sein", Betreiber). Das Häkchen
   anzuhaken war damit wirkungslos – check() tut nichts, wenn der Haken
   schon sitzt, das Bild blieb gleich und die Prüfung wurde rot, ohne
   dass etwas kaputt war. Jetzt wird ABGESCHALTET und danach wieder
   eingeschaltet, damit die folgenden Bildvergleiche denselben Stand
   sehen wie vorher. */
/* GEZAEHLT, NICHT NUR VERGLICHEN. Bis zum 01.11.2026 stand hier ein
   Vergleich zweier Bildschirmfotos auf Gleichheit. Der wurde in der
   Gegenprobe blind: Seit das Bedienfeld seine Laenge aendert (die
   Faecherbloecke), verschiebt sich die Buehne beim Umschalten ein
   wenig - und schon sind die Bilder "verschieden", auch wenn die Masse
   gar nicht gezeichnet werden. Gezaehlt wird deshalb, WIE VIELE
   Bildpunkte sich aendern; Masse ueber das halbe Bild sind Tausende,
   ein Versatz um ein Pixel ist es nicht.

   Zwei Leseraenge der Leinwand, nicht zwanzig - zwanzig haben den Lauf
   unter Software-Rendering zum Abbruch gebracht (siehe weiter oben). */
await page.evaluate(() => {
  window.__lesen = () => {
    const c = document.getElementById('k3dCanvas');
    const t = document.createElement('canvas');
    t.width = c.width; t.height = c.height;
    t.getContext('2d').drawImage(c, 0, 0);
    return t.getContext('2d').getImageData(0, 0, t.width, t.height).data;
  };
  window.__merk = () => { window.__b = window.__lesen(); return true; };
  window.__diff = () => {
    const a = window.__lesen(), b = window.__b;
    if (!b || a.length !== b.length || a.length === 0) return 0;
    let n = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
          Math.abs(a[i + 2] - b[i + 2]) > 18) n++;
    }
    return n;
  };
});
await page.evaluate(() => window.__merk());
await page.locator('#k3dMasse').scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await page.uncheck('#k3dMasse');
await page.waitForTimeout(800);
const massWeg = await page.evaluate(() => window.__diff());
pruef('Maße lassen sich im Modell abschalten', massWeg > 2000,
  massWeg + ' Bildpunkte geändert – voreingestellt an, Haken weg');
await haken(page, '#k3dMasse');
await page.waitForTimeout(800);

/* Bedienfeld zuklappen. ÜBER $eval, NICHT page.click(): Der Knopf liegt
   oben im Bedienfeld, und je nachdem wie lang das Bedienfeld gerade ist,
   schiebt sich die Navigationsleiste oder die Leinwand darüber – dann
   bricht Playwrights Trefferprüfung mit einem Timeout ab. Am 01.11.2026
   genau so passiert, als die Fächerblöcke das Bedienfeld länger machten.
   Geprüft wird die WIRKUNG des Knopfes, nicht ob man ihn trifft; dasselbe
   Vorgehen steht schon beim Moduswechsel weiter oben. */
const vorher = (await page.locator('.k3d-buehne').boundingBox()).width;
await page.$eval('#k3dPanelAn', (el) => el.click());
await page.waitForTimeout(600);
const nachher = (await page.locator('.k3d-buehne').boundingBox()).width;
pruef('Bedienfeld klappt zu', nachher > vorher + 200, `${Math.round(vorher)} → ${Math.round(nachher)} px`);
await page.$eval('#k3dPanelAn', (el) => el.click());
await page.waitForTimeout(500);

// Ansicht „Darunter"
await ansicht('Darunter');
await page.waitForTimeout(600);
pruef('Ansicht „Darunter" zeichnet', (await bildVielfalt()) > 25);

// Übergabe an den Anfrage-Assistenten
await ansicht('Perspektive');
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
await haken(page, '#k_consent');
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
pruef('Erweiterungen kommen im Assistenten an', /Schiebetür/.test(zus),
  (zus.match(/Erweiterung[^\n]*\n[^\n]*/) || ['nicht gefunden'])[0].replace(/\n/g, ' '));
pruef('LED-Set kommt an', /12er-Set/.test(zus));
pruef('Untergrund kommt an', /Punktfundamente/.test(zus));
pruef('Montage kommt an', /Selbstmontage/.test(zus));

if (!GEGENPROBE) await page.screenshot({ path: 'pruefbilder/k3d-desktop.png' });

/* ---------- Ein Block je Fach ----------
   „man kann aber nur die stirnseite komplett bearbeiten und nicht pro
   feld" (Betreiber, 01.11.2026) und danach, zur ersten Fassung:
   „grunglegen klappt es aber die umsetzung ist etwas verwirrend und
   kompliziert". Jetzt bekommt jedes Fach einen eigenen Block.

   In einer EIGENEN Seite, damit der Lauf oben nicht gestört wird.
   Geprüft wird die WIRKUNG, nicht der Quelltext – wohin ein Klick
   führt, entscheidet der Browser, und genau dort steckte der Fehler,
   den die Quelltextprüfung am 01.11.2026 nicht gesehen hat. */
{
  const fw = await browser.newPage();
  await fw.goto(BASIS, { waitUntil: 'networkidle' });
  await fw.waitForTimeout(1600);
  await dialogeWeg(fw);
  await fw.evaluate(() => { document.getElementById('k3dModus').click(); });
  await fw.waitForTimeout(600);
  await alleAufklappen(fw);

  /* Bei der Standardbreite 5000 mm hat die Stirnseite bereits zwei
     Fächer (Mittelpfosten). */
  const bloecke = await fw.evaluate(() => Array.from(
    document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach]'))
    .map(f => f.querySelector('.k3d-fach-kopf').textContent.trim().split(' ').slice(0, 2).join(' ')));
  pruef('Jedes Fach hat einen eigenen Block mit Namen',
    bloecke.length === 2 && /Feld 1/.test(bloecke[0]) && /Feld 2/.test(bloecke[1]),
    bloecke.join(' | ') || 'keine Blöcke');
  pruef('Die Reihe für die ganze Seite ist dann weg',
    await fw.evaluate(() => document.querySelector('[data-k3d-erw="vorne"]').hidden),
    'sonst gäbe es zwei Wege für dieselbe Sache');

  /* Das + springt in den Block SEINES Fachs. Genau das ging in der
     ersten Fassung nicht: querySelectorAll liefert in der Reihenfolge
     des Dokuments, nicht in der der Abfrage. */
  await fw.evaluate(() => {
    const k = Array.from(document.querySelectorAll('.k3d-marke'))
      .find(b => /Vorne/.test(b.getAttribute('aria-label') || '') &&
                 /Feld 2 von 2/.test(b.getAttribute('aria-label') || ''));
    if (k) k.click();
  });
  await fw.waitForTimeout(1000);
  pruef('Das + führt in den Block seines Fachs',
    await fw.evaluate(() => {
      const a = document.activeElement;
      const f = a && a.closest ? a.closest('[data-fach]') : null;
      return !!f && f.getAttribute('data-fach') === '1';
    }), 'Fokus liegt im zweiten Fach');

  const vorher = await fw.locator('#k3dCanvas').screenshot();
  await fw.evaluate(() => {
    const b = Array.from(document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach="0"] button'))
      .find(x => x.getAttribute('data-erw') === 'Plankenwand');
    b.click();
  });
  await fw.waitForTimeout(1300);
  pruef('Die Wahl im Block ändert das Modell',
    !vorher.equals(await fw.locator('#k3dCanvas').screenshot()),
    'die Plankenwand steht jetzt im rechten Fach');
  const stand = await fw.evaluate(() => {
    const k = document.querySelector('[data-k3d-feldwahl="vorne"]');
    const voll = f => k.querySelector('[data-fach="' + f + '"] [data-fach-wert]').textContent.trim();
    const z = document.querySelector('[data-k3d-erw="vorne"]').parentNode
      .querySelector('[data-k3d-erw-wert]').textContent.trim();
    return { rechts: voll(0), links: voll(1), zeile: z };
  });
  pruef('Die Wahl steht nur in ihrem Fach',
    stand.rechts === 'Plankenwand' && stand.links === 'offen',
    'rechts: ' + stand.rechts + ' · links: ' + stand.links);
  pruef('Die Zusammenfassung nennt das Fach',
    /Plankenwand \(Feld 1\)/.test(stand.zeile), stand.zeile);

  /* ---------- Jedes Fach fuer sich ----------
     „Die Felder untereinander sind komplett getrennte Felder … wenn ich
     in einem Feld Velaris habe, kann ich in dem zweiten alles andere
     reinmachen" (Betreiber, 01.11.2026). Vorher lief das Umschalten
     über die Liste der ganzen Seite: Der Knopf im zweiten Fach liess
     sich drücken und tat nichts. */
  await fw.evaluate(() => {
    const b = Array.from(document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach="0"] button'))
      .find(x => x.getAttribute('data-erw') === 'Velaris');
    if (b) b.click();
  });
  await fw.waitForTimeout(1300);
  await fw.evaluate(() => {
    const b = Array.from(document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach="1"] button'))
      .find(x => x.getAttribute('data-erw') === 'Schiebet\u00fcr');
    if (b) b.click();
  });
  await fw.waitForTimeout(1300);
  const getrennt = await fw.evaluate(() => {
    const k = document.querySelector('[data-k3d-feldwahl="vorne"]');
    const voll = f => k.querySelector('[data-fach="' + f + '"] [data-fach-wert]').textContent.trim();
    const gesperrt = f => Array.from(k.querySelectorAll('[data-fach="' + f + '"] button'))
      .filter(b => b.disabled).map(b => b.getAttribute('data-erw')).join(',');
    return { f1: voll(0), f2: voll(1), s1: gesperrt(0), s2: gesperrt(1) };
  });
  pruef('Velaris im einen Fach sperrt das andere nicht',
    /Schiebet\u00fcr/.test(getrennt.f2) && /Velaris/.test(getrennt.f1),
    'Feld 1: ' + getrennt.f1 + ' · Feld 2: ' + getrennt.f2);
  pruef('Unverträgliches bleibt im eigenen Fach gesperrt',
    /Schiebet\u00fcr/.test(getrennt.s1) && /Velaris/.test(getrennt.s2),
    'Feld 1 sperrt: ' + getrennt.s1 + ' · Feld 2 sperrt: ' + getrennt.s2);
  /* Wieder abraeumen, damit der Rest des Blocks sauber anfaengt. */
  await fw.evaluate(() => {
    const k = document.querySelector('[data-k3d-feldwahl="vorne"]');
    const weg = (f, w) => { const b = Array.from(k.querySelectorAll('[data-fach="' + f + '"] button'))
      .find(x => x.getAttribute('data-erw') === w && x.classList.contains('is-active'));
      if (b) b.click(); };
    weg(0, 'Velaris'); weg(1, 'Schiebet\u00fcr');
  });
  await fw.waitForTimeout(1300);

  /* Abwählen im Fach nimmt es auch aus der Seite – es sitzt dann
     nirgends mehr. */
  await fw.evaluate(() => {
    const b = Array.from(document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach="0"] button'))
      .find(x => x.getAttribute('data-erw') === 'Plankenwand');
    b.click();
  });
  await fw.waitForTimeout(1200);
  pruef('Abwählen im Fach nimmt es ganz weg',
    await fw.evaluate(() => document.querySelector('[data-k3d-erw="vorne"]').parentNode
      .querySelector('[data-k3d-erw-wert]').textContent.trim() === 'offen'),
    'es sitzt dann in keinem Fach mehr');

  /* Eine Seite mit nur EINEM Fach zeigt keine Blöcke, sondern wieder
     die Reihe für die ganze Seite. */
  await fw.evaluate(() => {
    const e = document.getElementById('k3dBreiteZahl');
    e.value = 3000; e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await fw.waitForTimeout(1500);
  const einFach = await fw.evaluate(() => ({
    bloecke: document.querySelectorAll('[data-k3d-feldwahl="vorne"] [data-fach]').length,
    reiheDa: !document.querySelector('[data-k3d-erw="vorne"]').hidden
  }));
  pruef('Bei einem Fach gibt es keine Blöcke', einFach.bloecke === 0,
    einFach.bloecke + ' Block/Blöcke bei 3000 mm Breite');
  pruef('Bei einem Fach kommt die Seitenreihe zurück', einFach.reiheDa,
    'sonst liesse sich dort gar nichts mehr wählen');
  await fw.close();
}

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
await dialogeWeg(m);
await m.$eval('#k3dModus', (el) => el.click());          // wie oben: alles sichtbar, sonst scrollt die Seite nicht
await m.waitForTimeout(250);
await alleAufklappen(m);

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

/* Die Leiste war einmal mittig und schmal, deshalb stand hier "laesst
   rechts Platz". Seit dem 11.10.2026 geht sie auf dem Handy bewusst ueber
   die ganze Breite (Betreiber: "auf iphone 17 pro is es leicht zu
   schmal"), also schlug die alte Pruefung auf etwas an, das so gewollt
   ist. Geblieben ist die Sorge dahinter: Die Leiste darf den Hinweis
   darueber nicht verdecken, und sie darf die Seite nicht breiter machen
   als das Fenster. */
const leiste = await m.locator('.k3d-leiste').boundingBox();
const breiterAlsFenster = await m.evaluate(() =>
  document.documentElement.scrollWidth > window.innerWidth + 1);
pruef('Handy: Werkzeugleiste macht die Seite nicht breiter', !breiterAlsFenster,
  `Leiste ${Math.round(leiste.width)}px bei ${await m.evaluate(() => window.innerWidth)}px Fenster`);
const hinwDa = await m.locator('.k3d-klickhinweis').isVisible().catch(() => false);
if (hinwDa) {
  const hinw = await m.locator('.k3d-klickhinweis').boundingBox();
  pruef('Handy: Werkzeugleiste verdeckt den Hinweis nicht',
    hinw.y + hinw.height <= leiste.y + 1,
    `Hinweis endet bei y=${Math.round(hinw.y + hinw.height)}, Leiste beginnt bei y=${Math.round(leiste.y)}`);
} else {
  pruef('Handy: Werkzeugleiste verdeckt den Hinweis nicht', true,
    'kein Hinweis eingeblendet');
}

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
  'Maße lassen sich im Modell abschalten',
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
