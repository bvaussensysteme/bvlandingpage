#!/usr/bin/env node
/* Prueft die Bedienung des Anfrage-Assistenten – im echten Browser.
 *
 * ANLASS. Zwei Beanstandungen vom 29.10.2026: „baue hier als sechste
 * kachel so ähnlich wie im 3d konfigurator wo man RAL farbe suchen oder
 * eingeben kann" und, nachdem die Eindeckungs-Fotos drin waren: „wieso
 * hast du die bronze kachel so großgemacht die sollen ale gleich groß
 * bleiben".
 *
 * WARUM IM BROWSER: Die Suche ist Bedienung. Ob ein Treffer erscheint,
 * ob er die Farbe setzt und ob das Eingabefeld beim Tippen den Fokus
 * behaelt, steht in keiner Zeile Quelltext – das zeigt sich erst am
 * laufenden Feld. Der Fokus ist dabei kein Schoenheitsfehler: Verliert
 * ihn das Feld nach dem ersten Zeichen, kann niemand einen Farbnamen
 * eintippen.
 *
 * Aufruf:  node scripts/pruefe-assistent.mjs [--gegenprobe]
 *
 * --gegenprobe laesst die Trefferliste leer. Dann MUESSEN die drei unten
 * genannten Pruefungen anschlagen.
 *
 * Warum nicht zusaetzlich die Kachel entfernen: Ohne Kachel oeffnet sich
 * das Suchfeld nicht, und alle folgenden Pruefungen werden uebersprungen
 * statt rot – eine Gegenprobe, die Pruefungen stillegt, prueft nichts.
 * Dass die Kachel da sein muss, sichert der normale Lauf: Fehlt sie,
 * faellt bereits die zweite Zeile.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8247;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
const gefallen = [];
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; gefallen.push(titel); console.log('  FEHLER  ' + titel.padEnd(50) + (info || '')); }
  else console.log('  ok      ' + titel.padEnd(50) + (info || ''));
}
const GEGEN_ERWARTET = [
  'Jede Produktkarte zeigt ein geladenes Foto',
  'Kein Produkt heißt mehr „Sonstiges"',
  'Der Direktweg nennt die Fälle, die dort gelandet sind',
  'Der Direktweg fragt Maße ab – freiwillig',
  'Ohne Maße geht es trotzdem weiter',
  'Der Schritt nennt den Aufpreis',
  'Alle Eindeckungs-Kacheln sind gleich groß',
  '„braun" findet Brauntöne',
  'Eine Nummer steht an erster Stelle',
  'Ein Treffer setzt die Farbe'
];

const browser = await chromium.launch({
  timeout: 60000, executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const seite = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const konsole = [];
seite.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
seite.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));

if (GEGENPROBE) {
  await seite.route('**/anfrage-wizard.js*', async (r) => {
    const a = await r.fetch();
    let t = await a.text();
    t = t.replace('var html = \'<div class="aw-ral-liste">\';',
                  'var html = \'<div class="aw-ral-liste">\'; tr = [];');
    /* Zweiter eingebauter Fehler: ohne --equal laeuft die letzte Karte
       bei ungerader Anzahl ueber die volle Breite – genau der Zustand,
       den der Betreiber an der Bronze-Kachel beanstandet hat. */
    t = t.replace("optionCards('verglasung', opts, 'aw-options--equal')",
                  "optionCards('verglasung', opts)");
    /* Vierter bis sechster eingebauter Fehler (04.11.2026), alle drei
       am Produktschritt:
         · die Balkonkarte verliert ihr Foto und faellt auf das
           Platzhalter-Symbol zurueck - der Zustand, den der Betreiber
           auf seinem Bildschirmfoto beanstandet hat,
         · „Sonstiges" kommt als Produkt zurueck,
         · der Direktweg nennt die Faelle nicht mehr, die vorher unter
           „Sonstiges" standen - dann sucht jemand mit einer Markise
           vergeblich. */
    t = t.replace("{ value: 'Balkonüberdachung', img: 'balkon', photo: true,",
                  "{ value: 'Balkonüberdachung', icon: I.sonst,");
    /* Siebter und achter eingebauter Fehler (04.11.2026): Die
       freiwilligen Masse im Direktweg fallen weg bzw. werden zur
       Pflicht - beides nimmt dem Weg genau das, wofuer er da ist. */
    t = t.replace("'<div class=\"aw-dims aw-dims--frei\">' +", "'' + (0 ? '' : '') +");
    t = t.replace("return answers.wunsch.trim() ? null : 'Bitte beschreiben Sie kurz Ihr Anliegen.';",
                  "if (!answers.breite || !answers.tiefe) return 'Bitte Maße angeben.';\n"
                  + "        return answers.wunsch.trim() ? null : 'Bitte beschreiben Sie kurz Ihr Anliegen.';");
    t = t.replace("{ value: 'Direkt anfragen', icon: I.brief,\n            hint: 'Markise, Geländer, Vordach … oder kurze Nachricht' }",
                  "{ value: 'Sonstiges', icon: I.sonst, hint: 'Markise, Geländer, Vordach …' },\n"
                  + "          { value: 'Direkt anfragen', icon: I.brief, hint: 'Ohne Fragen' }");
    /* Dritter eingebauter Fehler: der Aufpreis-Hinweis verschwindet. */
    t = t.replace('Die vier Standardfarben ohne Aufpreis – jede andere RAL-Farbe gegen Aufpreis.',
                  'Die Standardfarben.');
    await r.fulfill({ response: a, body: t,
                      headers: { ...a.headers(), 'content-type': 'application/javascript' } });
  });
}

await seite.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await seite.waitForTimeout(1200);

/* ---------- Der Produktschritt ----------
   ANLASS (04.11.2026, Bildschirmfoto vom iPhone): „Balkonüberdachung hat
   kein Foto, Sonstiges kann weg, weil den selben zweck erfüllt schon
   direkt anfragen."

   GEPRUEFT WIRD IM BROWSER, nicht im Quelltext: ob jedes Bild WIRKLICH
   geladen ist (naturalWidth > 0). Ein <img>, dessen Datei fehlt, steht
   im Quelltext genauso da wie eines, das ankommt. */
{
  /* Die Bilder tragen loading="lazy" - ausserhalb des Blickfelds laedt
     der Browser sie gar nicht erst, und naturalWidth bliebe 0, obwohl
     die Datei da ist. Erst in den Blick holen, dann messen. */
  await seite.evaluate(async () => {
    const bilder = [...document.querySelectorAll('#awBody .aw-option img')];
    bilder.forEach((b) => { b.loading = 'eager'; b.scrollIntoView({ block: 'nearest' }); });
    await Promise.all(bilder.map((b) => b.complete ? Promise.resolve()
      : new Promise((r) => { b.onload = r; b.onerror = r; setTimeout(r, 3000); })));
  });
  await seite.waitForTimeout(400);
  const karten = await seite.$$eval('#awBody .aw-option', (n) => n.map((k) => ({
    text: (k.innerText || '').replace(/\n/g, ' | '),
    bild: !!k.querySelector('img'),
    geladen: !!(k.querySelector('img') && k.querySelector('img').naturalWidth > 0)
  })));
  const produkte = karten.filter((k) => !/Direkt anfragen/.test(k.text));
  pruefe('Jede Produktkarte zeigt ein geladenes Foto',
    produkte.length >= 5 && produkte.every((k) => k.bild && k.geladen),
    produkte.filter((k) => !k.geladen).map((k) => k.text.split(' | ')[0]).join(', ')
      || produkte.length + ' Karten, alle mit geladenem Bild');
  pruefe('Kein Produkt heißt mehr „Sonstiges"',
    !karten.some((k) => /^Sonstiges/.test(k.text.trim())),
    karten.map((k) => k.text.split(' | ')[0]).join(' · '));
  pruefe('Der Direktweg nennt die Fälle, die dort gelandet sind',
    karten.some((k) => /Direkt anfragen/.test(k.text) && /Markise/.test(k.text)),
    (karten.find((k) => /Direkt anfragen/.test(k.text)) || {}).text || 'keine Karte');
}

/* ---------- Der Direktweg: Maße freiwillig ----------
   Mit dem Wegfall von „Sonstiges" kam eine Markisen-Anfrage nur noch
   als Freitext an - ohne Maße, also mit einer Rueckfrage als erstem
   Schritt. Jetzt stehen zwei FREIWILLIGE Felder dort.

   GEPRUEFT WIRD BEIDES: dass die Felder da sind, UND dass man ohne
   sie weiterkommt. Nur das zweite macht sie freiwillig; ohne diese
   Pruefung koennte aus dem Angebot unbemerkt eine Pflicht werden. */
{
  await seite.evaluate(() => {
    const k = [...document.querySelectorAll('#awBody .aw-option')]
      .find((b) => /Direkt anfragen/.test(b.innerText || ''));
    if (k) k.click();
  });
  await seite.waitForTimeout(500);
  await seite.locator('#awNext').click();
  await seite.waitForTimeout(700);
  const felder = await seite.$$eval('#awBody .aw-dims--frei input', (n) => n.map((e) => e.id));
  pruefe('Der Direktweg fragt Maße ab – freiwillig',
    felder.includes('aw_breite') && felder.includes('aw_tiefe'), felder.join(' '));
  /* Nur den Freitext ausfuellen, die Masse leer lassen - und weiter. */
  await seite.evaluate(() => {
    const t = document.getElementById('awWunsch');
    if (t) { t.value = 'Markise über der Terrasse, ca. 4 m'; t.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await seite.locator('#awNext').click();
  await seite.waitForTimeout(700);
  const weiter = await seite.evaluate(() => {
    const f = document.querySelector('#awBody .aw-fehler, #awBody .aw-error');
    const t = (document.querySelector('#awBody') || {}).innerText || '';
    return { fehler: f ? f.innerText : '', text: t.slice(0, 80).replace(/\n/g, ' ') };
  });
  pruefe('Ohne Maße geht es trotzdem weiter',
    !/Maße/i.test(weiter.fehler) && !/aw_breite/.test(weiter.text),
    weiter.fehler ? 'Meldung: ' + weiter.fehler : 'weitergekommen: ' + weiter.text);
  /* Zurueck auf Anfang, damit die folgenden Pruefungen ihren Stand
     vorfinden - sie klicken sich selbst durch den Produktweg. */
  await seite.reload({ waitUntil: 'load' });
  await seite.waitForTimeout(1200);
}

/* ---------- Bis zum Farbschritt klicken ---------- */
let titel = '';
let kachelnGemessen = false;
for (let i = 0; i < 26; i++) {
  titel = (await seite.locator('#awTitle').textContent()) || '';
  if (/Wunschfarbe/.test(titel)) break;
  /* Je Schritt kann es MEHRERE Auswahlen geben (Eindeckung und darunter
     die Glasstärke). Wird nur die erste angeklickt, bleibt der Schritt
     stehen und die Schleife dreht sich – genau das ist beim ersten Lauf
     passiert. Deshalb: je Feld die erste Karte. */
  const felder = await seite.$$eval('#awBody .aw-option[data-field]',
    (ns) => Array.from(new Set(ns.map((n) => n.getAttribute('data-field')))));
  for (const f of felder) {
    /* Bei der Eindeckung bewusst Polycarbonat: VSG-Glas verlangt
       anschliessend noch die Glasstaerke, und die steckt in einer
       anderen Bedieneinheit – der Schritt bliebe sonst stehen. Fuer
       diese Pruefung zaehlt nur, zum Farbschritt zu kommen. */
    const w = await seite.$$eval('#awBody .aw-option[data-field="' + f + '"]',
      (ns) => ns.map((n) => n.getAttribute('data-value')));
    /* Immer die schlichteste Antwort nehmen: „Nein" und „Ohne" ziehen
       keine Folgefragen nach sich, Polycarbonat erspart die Glasstärke.
       Diese Prüfung will nur zum Farbschritt – was unterwegs gewählt
       wird, ist gleichgültig, solange es weitergeht. */
    const ziel = w.find((v) => /^(Nein|Ohne|Nichts|Keine)/.test(v)) ||
                 w.find((v) => /Polycarbonat/.test(v)) || w[0];
    if (ziel) {
      await seite.locator('#awBody .aw-option[data-field="' + f + '"][data-value="' +
                          ziel.replace(/"/g, '\\"') + '"]').first().click();
      await seite.waitForTimeout(120);
    }
  }
  /* Der Masse-Schritt hat keine Karten, sondern Zahlenfelder – ohne
     Eingabe geht es dort nicht weiter, und die Schleife liefe leer. */
  /* ---------- Unterwegs: die Eindeckungs-Kacheln vermessen ----------
     Der ungerade Fall ist der riskante: Bei VSG-Glas entfaellt „Noch
     unsicher", dann sind es sieben Karten und die letzte (Bronze) stand
     allein in der Zeile. Deshalb hier VSG waehlen, messen, und erst
     danach auf Polycarbonat zurueck. */
  if (/Eindeckung/.test(titel) && !kachelnGemessen) {
    const vsg = seite.locator('#awBody .aw-option[data-value="VSG-Glas klar"]');
    if (await vsg.count()) {
      await vsg.first().click();
      await seite.waitForTimeout(350);
      const m = await seite.$$eval('#awBody .aw-option[data-field="verglasung"]',
        (ns) => ns.map((n) => {
          const r = n.getBoundingClientRect();
          return Math.round(r.width) + 'x' + Math.round(r.height);
        }));
      const satz = new Set(m);
      pruefe('Alle Eindeckungs-Kacheln sind gleich groß',
             m.length >= 7 && satz.size === 1,
             m.length + ' Karten, ' + satz.size + ' Größe(n): ' +
             Array.from(satz).join(', '));
      kachelnGemessen = true;
    }
  }
  const zahlen = seite.locator('#awBody .aw-dim input');
  const n = await zahlen.count();
  /* Hoehe BEWUSST leer lassen: Seit dem 06.11.2026 muss beantwortet
     werden, worauf sie sich bezieht, sobald eine dasteht - und darum
     geht es in dieser Pruefung nicht. Ohne Hoehe entfaellt die Frage,
     der Schritt bleibt gueltig. Geprueft wird die Pflicht in
     scripts/pruefe-angaben-wand-hoehe.mjs. */
  for (let k = 0; k < n; k++) {
    const id = await zahlen.nth(k).getAttribute('id');
    if (id === 'aw_hoehe') continue;
    await zahlen.nth(k).fill(['4000', '3000'][k] || '');
  }
  await seite.waitForTimeout(150);
  await seite.locator('#awNext').click();
  await seite.waitForTimeout(350);
}
pruefe('Der Schritt „Wunschfarbe" wird erreicht', /Wunschfarbe/.test(titel), titel.trim());

/* ---------- Die Kachel ---------- */
const kachel = seite.locator('#awBody [data-ral-open]');
pruefe('Die sechste Kachel steht im Farbschritt',
       (await kachel.count()) === 1,
       (await kachel.count()) + ' Kachel(n)');

if (await kachel.count()) {
  await kachel.first().click();
  await seite.waitForTimeout(300);
}
const feld = seite.locator('#awRalFeld');
pruefe('Ein Klick öffnet das Suchfeld', (await feld.count()) === 1);

/* ---------- Suchen ---------- */
async function suchen(text) {
  await seite.fill('#awRalFeld', text);
  await seite.waitForTimeout(250);
  return seite.$$eval('[data-ral-pick]', (ns) => ns.map((n) => n.getAttribute('data-ral-pick')));
}
if (await feld.count()) {
  const braun = await suchen('braun');
  pruefe('„braun" findet Brauntöne',
         braun.length > 0 && braun[0].charAt(0) === '8',
         braun.length + ' Treffer, erster ' + (braun[0] || '–'));

  const nr = await suchen('7016');
  pruefe('Eine Nummer steht an erster Stelle',
         nr[0] === '7016', 'erster Treffer ' + (nr[0] || '–'));

  const nix = await suchen('qwertzu');
  const hinweis = await seite.locator('.aw-ral-stand').first().textContent().catch(() => '');
  pruefe('Unsinn zeigt einen verständlichen Hinweis statt einer leeren Liste',
         nix.length === 0 && /keinen RAL-Ton/.test(hinweis || ''),
         (hinweis || '').slice(0, 40).trim() + '…');

  /* Der Fokus-Fall: nach dem Tippen muss das Feld noch den Fokus haben.
     Vorher leeren – type() haengt an, und beim ersten Lauf stand noch
     „qwertzu" darin, sodass die Suche nichts fand und der Klick auf
     einen Treffer ins Leere ging. */
  await seite.fill('#awRalFeld', '');
  await seite.click('#awRalFeld');
  await seite.type('#awRalFeld', 'braun', { delay: 40 });
  await seite.waitForTimeout(250);
  const fokus = await seite.evaluate(() => document.activeElement && document.activeElement.id);
  pruefe('Das Eingabefeld behält beim Tippen den Fokus',
         fokus === 'awRalFeld', 'Fokus liegt auf: ' + fokus);

  /* ---------- Auswählen ---------- */
  const treffer = seite.locator('[data-ral-pick="8014"]');
  if (await treffer.count()) await treffer.first().click();
  await seite.waitForTimeout(400);
  const beschriftung = await seite.locator('#awBody [data-ral-open] .aw-option-lbl')
    .textContent().catch(() => '');
  pruefe('Ein Treffer setzt die Farbe',
         /RAL 8014/.test(beschriftung || ''),
         'Kachel zeigt: ' + (beschriftung || 'nichts').trim());

  const aktiv = await seite.locator('#awBody [data-ral-open].is-active').count();
  pruefe('Die Kachel ist danach als gewählt markiert', aktiv === 1);
}

/* ---------- Aufpreis ----------
   „bei wunschfarbe feht hinweis das es aufpreispflichtig is" (Betreiber,
   29.10.2026). Ohne diesen Satz waehlt jemand eine Sonderfarbe im guten
   Glauben, sie koste nichts – und erfaehrt das Gegenteil erst im
   Angebot. Geprueft wird der sichtbare Text, nicht der Quelltext. */
{
  const sichtbar = await seite.locator('#awBody').innerText();
  const unter = await seite.locator('#awSub').textContent().catch(() => '');
  pruefe('Der Schritt nennt den Aufpreis',
         /Aufpreis/.test(unter || ''),
         (unter || '').trim());
  pruefe('Auch in der Suche steht der Aufpreis-Hinweis',
         /aufpreispflichtig/i.test(sichtbar) && /mit dem Angebot/.test(sichtbar),
         'ohne Betrag – der hängt von Menge und Oberfläche ab');
}

pruefe('Keine Javascript-Fehler',
       konsole.filter((z) => !/Failed to load resource/.test(z)).length === 0,
       konsole[0] ? konsole[0].slice(0, 50) : 'Konsole still');

await browser.close();
server.kill();

if (GEGENPROBE) {
  const fehlen = GEGEN_ERWARTET.filter((t) => gefallen.indexOf(t) < 0);
  console.log('\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen');
  if (fehlen.length) {
    console.log('  NICHT angeschlagen, obwohl sie müssten:');
    fehlen.forEach((t) => console.log('    · ' + t));
    console.log('\nGegenprobe: fehlgeschlagen');
    process.exit(1);
  }
  console.log('\nGegenprobe: bestanden');
  process.exit(0);
}
console.log('\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden'
                                    : 'alle ' + geprueft + ' Prüfungen bestanden'));
process.exit(fehler ? 1 : 0);
