/* ============================================================
   Prüft die eigene Reichweitenmessung im echten Browser.

   Warum zusätzlich zum Textprüfskript: Ob ein Paket wirklich abgeht,
   was darin steht und ob der Abschalter greift, steht nicht im
   Quelltext – das entscheidet der Browser. Abgefangen wird alles:
   /api/messung wird nie wirklich aufgerufen, gelesen wird nur, was
   abgegangen WÄRE.

   Aufruf:     node scripts/pruefe-messung.mjs
   Gegenprobe: node scripts/pruefe-messung.mjs --gegenprobe
   Braucht Playwright (npm i --no-save playwright).
   ============================================================ */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8791 + (GEGENPROBE ? 1 : 0);

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
  const ordner = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const letzter = ordner[ordner.length - 1];
  return letzter ? chromeIn(`${basis}/${letzter}`) : undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0;
const ergebnisse = [];
function pruef(name, ok, info = '') {
  ergebnisse.push([name, !!ok]);
  if (!GEGENPROBE) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(50) + info);
  if (!ok) fehler++;
}

const browser = await chromium.launch({
  timeout: 60000, executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});

/* Eine Seite vorbereiten: Messpakete abfangen und sammeln. */
async function neueSeite(ctx, { abschalter = false } = {}) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const pakete = [];
  await page.route('**/api/messung', async (route) => {
    let daten = null;
    try { daten = JSON.parse(route.request().postData() || '{}'); } catch (e) { daten = {}; }
    pakete.push(daten);
    await route.fulfill({ status: 204, body: '' });
  });
  if (GEGENPROBE) {
    /* Drei eingebaute Fehler, jeder für eine eigene Zusage. */
    await page.route('**/js/messung.js*', async (route) => {
      const a = await route.fetch();
      let t = await a.text();
      t = t.replace("if (location.pathname.indexOf('/werkstatt') === 0) return;", '');
      t = t.replace("if (window.localStorage && localStorage.getItem(ABSCHALTER) === '1') return;", '');
      t = t.replace('gesammelt += Math.round((Date.now() - sichtbarSeit) / 1000);', 'gesammelt += 0;');
      /* Die Lesetiefe bleibt stehen - dann steht in jedem Paket 0 %. */
      t = t.replace('if (p > tiefe) tiefe = Math.max(0, Math.min(100, p));', 'void p;');
      /* Die Beschriftung des Geklickten faellt weg. */
      t = t.replace("if (text) window.bvMessung('klick', 0, text.slice(0, 60));", 'void text;');
      await route.fulfill({ response: a, body: t,
        headers: { ...a.headers(), 'content-type': 'application/javascript' } });
    });
  }
  if (abschalter) {
    await page.addInitScript(() => {
      try { localStorage.setItem('bv_messung_aus', '1'); } catch (e) {}
    });
  }
  return { page, pakete };
}

/* Das Wegschalten des Tabs nachstellen: Genau daran hängt das Senden
   (visibilitychange → hidden). Die Eigenschaft wird überschrieben, damit
   der echte Zuhörer in js/messung.js seinen eigenen Zustand liest. */
async function wegschalten(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(400);
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const BASIS = `http://localhost:${PORT}`;

/* ---------- 1. Normaler Besuch ---------- */
{
  const { page, pakete } = await neueSeite(ctx);
  const fehlerSeite = [];
  page.on('pageerror', (e) => fehlerSeite.push(e.message));
  await page.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);

  const speicherVorher = await page.evaluate(() => ({
    keks: document.cookie,
    schluessel: Object.keys(localStorage).sort().join(',')
  }));

  /* Klick auf die Telefonnummer, ohne wirklich zu wählen. */
  const tel = await page.evaluate(() => {
    const a = document.querySelector('a[href^="tel:"]');
    if (!a) return false;
    a.addEventListener('click', (e) => e.preventDefault(), true);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  });
  pruef('Eine Telefonnummer zum Anklicken ist da', tel);
  await wegschalten(page);

  pruef('Ein Paket geht ab', pakete.length === 1, pakete.length + ' Paket(e)');
  const p = pakete[0] || {};
  pruef('Es nennt die Seite und zählt sie als neu',
    p.seite === '/index.html' && p.neu === true, JSON.stringify(p.seite) + ', neu=' + p.neu);
  pruef('Die Verweildauer ist gemessen, nicht geraten',
    p.dauer >= 2 && p.dauer < 30, p.dauer + ' s');
  pruef('Handy oder Rechner steht drin', p.geraet === 'rechner', String(p.geraet));
  pruef('Der Telefonklick ist dabei',
    Array.isArray(p.ereignisse) && p.ereignisse.some((e) => e.art === 'telefon'),
    JSON.stringify(p.ereignisse));
  pruef('Die Lesetiefe fährt mit',
    typeof p.tiefe === 'number' && p.tiefe > 0 && p.tiefe <= 100, p.tiefe + ' %');
  pruef('Die Beschriftung des Geklickten fährt mit',
    Array.isArray(p.ereignisse) && p.ereignisse.some(function (e) {
      return e.art === 'klick' && e.zusatz && e.zusatz.length > 2;
    }),
    JSON.stringify((p.ereignisse || []).filter((e) => e.art === 'klick')));
  pruef('Kein Kennzeichen für den Besucher im Paket',
    !/id|uuid|sitzung|besucher|fingerprint/i.test(Object.keys(p).join(',')),
    Object.keys(p).join(', '));

  const speicherNachher = await page.evaluate(() => ({
    keks: document.cookie,
    schluessel: Object.keys(localStorage).sort().join(',')
  }));
  pruef('Die Messung legt nichts im Browser ab',
    speicherVorher.keks === speicherNachher.keks &&
    speicherVorher.schluessel === speicherNachher.schluessel,
    'Kekse: "' + speicherNachher.keks + '", Speicher: "' + speicherNachher.schluessel + '"');
  pruef('Keine Fehler auf der Seite', fehlerSeite.length === 0, fehlerSeite.join(' | ').slice(0, 100));
  await page.close();
}

/* ---------- 2. Der Abschalter des Betriebs ---------- */
{
  const { page, pakete } = await neueSeite(ctx, { abschalter: true });
  await page.goto(`${BASIS}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await wegschalten(page);
  pruef('Mit Abschalter wird nichts gesendet', pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 3. In der Werkstatt wird nicht gemessen ---------- */
{
  const { page, pakete } = await neueSeite(ctx);
  await page.goto(`${BASIS}/werkstatt/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await wegschalten(page);
  pruef('Die Werkstatt sendet nichts', pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 3b. Und zwar aus ZWEI Gründen unabhängig voneinander ----------
   Block 3 beweist nur den ersten: scripts/baue-werkstatt.js nimmt das
   Skript dort heraus, es ist also gar nicht geladen. GEFUNDEN IN DER
   GEGENPROBE AM 03.11.2026: Der eingebaute Fehler (Pfadabfrage in
   js/messung.js entfernt) blieb damit unbemerkt – Block 3 hätte auch
   bestanden, wenn die zweite Sperre längst kaputt wäre.

   Deshalb wird hier das Skript absichtlich in die Werkstattseite
   eingesetzt. Jetzt hängt alles an der Pfadabfrage – und die wird
   geprüft. */
{
  const { page, pakete } = await neueSeite(ctx);
  await page.route('**/werkstatt/index.html', async (route) => {
    const a = await route.fetch();
    const t = (await a.text()).replace('</body>',
      '<script src="/js/messung.js"></script></body>');
    await route.fulfill({ response: a, body: t,
      headers: { ...a.headers(), 'content-type': 'text/html; charset=utf-8' } });
  });
  await page.goto(`${BASIS}/werkstatt/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const geladen = await page.evaluate(() =>
    !!document.querySelector('script[src*="messung.js"]'));
  await wegschalten(page);
  pruef('Eingesetzt ist das Skript dort wirklich geladen', geladen);
  pruef('Auch geladen würde in der Werkstatt nicht gemessen',
    pakete.length === 0, pakete.length + ' Paket(e)');
  await page.close();
}

/* ---------- 4. Die Zahlenseite ----------
   GEMESSEN WIRD DIE GERENDERTE BREITE, nicht der Text. Am 03.11.2026 hat
   der Betreiber ein Bild geschickt: nackte Balken mit Zahlen, keine
   einzige Beschriftung. Die Namensspalte hatte max-width:0 - ein Trick,
   der nur mit table-layout:fixed wirkt; ohne das quetscht der Browser
   sie auf null Pixel. Die damalige Pruefung hat „Samstag" im innerText
   gefunden und war zufrieden: innerText kennt die abgeschnittene Breite
   nicht. Deshalb misst sie jetzt jede Beschriftung einzeln. */
{
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const fehlerSeite = [];
  page.on('pageerror', (e) => fehlerSeite.push(e.message));

  /* Beispielzahlen statt der echten Datenbank: Geprüft wird die
     Darstellung, nicht der Worker. Der 14.11.2026 ist ein Samstag -
     damit muss der Wochentagsblock den Samstag als stärksten zeigen. */
  const BEISPIEL = {
    von: '2026-10-16', tage: 30,
    tageReihe: [{ tag: '2026-11-12', aufrufe: 0 }, { tag: '2026-11-13', aufrufe: 10 },
                { tag: '2026-11-14', aufrufe: 90 }],
    seiten: [{ seite: '/konfigurator.html', aufrufe: 70, dauer: 185, tiefe: 72, einstiege: 20 },
             { seite: '/', aufrufe: 30, dauer: 42, tiefe: 38, einstiege: 25 }],
    quellen: [{ quelle: 'google.de', aufrufe: 60 }, { quelle: 'direkt', aufrufe: 40 }],
    geraete: [{ geraet: 'handy', aufrufe: 80 }, { geraet: 'rechner', aufrufe: 20 }],
    handlungen: [{ art: 'telefon', anzahl: 7 }, { art: 'anfrage-gesendet', anzahl: 3 }],
    trichter: [{ nr: 1, name: 'anlage', anzahl: 50 }, { nr: 2, name: 'dach', anzahl: 20 }],
    stunden: [{ stunde: 20, aufrufe: 55 }],
    matrix: [{ wtag: 6, stunde: 20, aufrufe: 55 }, { wtag: 5, stunde: 9, aufrufe: 10 }],
    laender: [{ land: 'DE', aufrufe: 95 }, { land: 'AT', aufrufe: 5 }],
    regionen: [{ region: 'Rheinland-Pfalz', aufrufe: 70 },
               { region: 'Nordrhein-Westfalen', aufrufe: 25 }],
    klicks: [{ was: 'Jetzt anfragen', seite: '/', anzahl: 12 },
             { was: '0156 7869 6609', seite: '/', anzahl: 7 },
             { was: 'Knopf 1', seite: '/', anzahl: 6 },
             { was: 'Knopf 2', seite: '/', anzahl: 5 },
             { was: 'Knopf 3', seite: '/', anzahl: 4 },
             { was: 'Knopf 4', seite: '/', anzahl: 3 },
             { was: 'Knopf 5', seite: '/', anzahl: 2 },
             { was: 'Knopf 6', seite: '/', anzahl: 6 },
             { was: 'Knopf 7', seite: '/', anzahl: 5 },
             { was: 'Knopf 8', seite: '/', anzahl: 4 },
             { was: 'Knopf 9', seite: '/', anzahl: 3 },
             { was: 'Knopf 10', seite: '/', anzahl: 2 }],
    live: [{ seite: '/konfigurator.html', aufrufe: 2 }],
    /* AUSBAU 04.11.2026: Besucher, Sitzungen, Einstiege, Kampagnen,
       Browser, System - und der ECHTE Datenbeginn. Der liegt hier
       ABSICHTLICH nach dem Beginn des gewaehlten Zeitraums: Genau
       diesen Fall hat die Seite vorher verschwiegen. */
    datenBeginn: '2026-11-12', datenBeginnZeit: 1794000000, tageMitDaten: 3,
    aufrufe: 100, besucher: 40, sitzungen: 50, absprunge: 20,
    seitenJeSitzung: 2, handlungenGesamt: 10,
    besucherReihe: [{ tag: '2026-11-13', besucher: 10 },
                    { tag: '2026-11-14', besucher: 30 }],
    einstiege: [{ seite: '/', einstiege: 30 },
                { seite: '/windzonen', einstiege: 20 }],
    kampagnen: [{ kampagne: 'herbst26', medium: 'flyer', quelle: 'postwurf', aufrufe: 12 }],
    browser: [{ browser: 'Safari', aufrufe: 60 }, { browser: 'Chrome', aufrufe: 40 }],
    systeme: [{ system: 'iOS', aufrufe: 55 }, { system: 'Windows', aufrufe: 45 }],
    vorher: { von: '2026-10-14', aufrufe: 50, dauer: 60,
              besucher: 20, sitzungen: 25, absprunge: 15, seitenJeSitzung: 2,
              handlungen: [{ art: 'anfrage-gesendet', anzahl: 2 }] }
  };
  await page.route('**/werkstatt/api/zahlen*', (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(BEISPIEL)
  }));
  if (GEGENPROBE) {
    /* Siebter und achter Fehler, beide in der Zahlenseite selbst:
       die Umrechnung von SQLites Sonntag=0 auf Montag=0 faellt weg,
       und der CSV-Datei fehlt die Byte-Order-Mark fuer Excel. */
    await page.route('**/werkstatt/zahlen.html', async (route) => {
      const a = await route.fetch();
      let t = await a.text();
      t = t.replace('var i = ((Number(r.wtag) + 6) % 7);', 'var i = (Number(r.wtag) % 7);');
      /* Neunter Fehler: Die Wolke am Diagramm bleibt stumm - auf dem
         Handy gaebe es dann gar keine Zahl zur Saeule. */
      t = t.replace("svg.addEventListener('pointermove', zeigen);", 'void zeigen;');
      t = t.replace("var blob = new Blob(['\\ufeff' + csvBauen(letzteDaten)],",
                    'var blob = new Blob([csvBauen(letzteDaten)],');
      await route.fulfill({ response: a, body: t,
        headers: { ...a.headers(), 'content-type': 'text/html; charset=utf-8' } });
    });
  }
  await page.goto(`${BASIS}/werkstatt/zahlen.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  if (GEGENPROBE) {
    /* Vierter eingebauter Fehler: genau der Fehler aus dem Bild des
       Betreibers - die Beschriftung wird auf null Pixel gequetscht. */
    await page.addStyleTag({ content: '.reihe .nam{max-width:0!important;flex:0 0 0!important}' });
    await page.waitForTimeout(200);
  }

  /* 4a. JEDE Beschriftung muss wirklich Platz auf dem Bildschirm haben. */
  /* Nur SICHTBARE Zeilen messen: Lange Listen sind seit dem
     Gestaltungsdurchgang eingeklappt, und was nicht gerendert wird, hat
     naturgemaess null Breite. Dass das Aufklappen wirklich etwas
     hervorholt, prueft der eigene Punkt weiter unten. */
  const beschriftungen = await page.$$eval('.reihe .nam', (nodes) => nodes
    .filter((n) => n.offsetParent !== null)
    .map((n) => ({
      text: (n.textContent || '').trim(),
      breite: Math.round(n.getBoundingClientRect().width)
    })));
  const schmal = beschriftungen.filter((b) => b.breite < 60 || !b.text);
  pruef('Jede Zeile trägt eine sichtbare Beschriftung',
    beschriftungen.length >= 20 && schmal.length === 0,
    `${beschriftungen.length} Zeilen, schmalste ${
      beschriftungen.length ? Math.min(...beschriftungen.map((b) => b.breite)) : 0} px`);

  const text = await page.locator('body').innerText();
  const hatName = (n) => beschriftungen.some((b) => b.text.indexOf(n) > -1 && b.breite >= 60);
  pruef('Die Namen stehen wirklich da, nicht nur die Balken',
    hatName('Samstag') && hatName('google.de') && hatName('Handy')
    && hatName('Anfrage abgeschickt') && hatName('/konfigurator.html'),
    beschriftungen.slice(0, 3).map((b) => `"${b.text}" (${b.breite}px)`).join(', '));

  /* 4b. Kennzahlen mit Vergleich zum Zeitraum davor */
  const kacheln = await page.$$eval('.kz', (n) => n.map((k) => k.innerText.replace(/\n/g, ' | ')));
  const zeitraumText = await page.$eval('#zeitraum', (e) => e.innerText.replace(/\n/g, ' '));
  /* GEAENDERT 04.11.2026: Die Kacheln sind nicht mehr sechs, und sie
     werden nicht mehr ueber ihre Position angesprochen - eine neue
     Kachel in der Mitte haette sonst jede folgende Pruefung verschoben.
     Gesucht wird ueber die UEBERSCHRIFT. */
  const kachelMit = (wort) => kacheln.find((k) => new RegExp(wort, 'i').test(k)) || '';
  pruef('Die Kennzahlenreihe ist vollständig', kacheln.length >= 9,
    kacheln.length + ' Kacheln');
  pruef('Besucher und Besuche stehen oben',
    /\b40\b/.test(kachelMit('^besucher \\|')) && /\b50\b/.test(kachelMit('^besuche \\|')),
    kachelMit('^besucher \\|') + '   ' + kachelMit('^besuche \\|'));
  pruef('Die Summe stimmt', /\b100\b/.test(kachelMit('seitenaufrufe')),
    kachelMit('seitenaufrufe'));
  pruef('Der Vergleich zum Zeitraum davor steht dabei',
    /\+100 % gegenüber davor/.test(kachelMit('seitenaufrufe')),
    kachelMit('seitenaufrufe'));
  /* 20 von 50 Sitzungen sahen nur eine Seite - das sind 40 %. Vorher
     waren es 15 von 25, also 60 %: Die Zahl ist GEFALLEN, und das ist
     hier eine Verbesserung. Deshalb muss der Pfeil gruen sein. */
  pruef('Nur eine Seite wird als Quote gezeigt, und weniger ist besser',
    /40 %/.test(kachelMit('nur eine seite')), kachelMit('nur eine seite'));
  pruef('Der Durchschnitt rechnet durch die Tage MIT Daten',
    /\b33\b/.test(kachelMit('im schnitt am tag')),
    kachelMit('im schnitt am tag') + '  (100 Aufrufe auf 3 Tage, nicht auf 30)');
  /* Ohne das i schlaegt das hier fehl, obwohl alles stimmt: innerText
     liefert die GERENDERTE Schreibweise, und die Kachelueberschrift steht
     per text-transform in Grossbuchstaben. */
  pruef('Kontaktaufnahmen werden eigens ausgewiesen',
    /\b10\b/.test(kachelMit('kontaktaufnahmen')), kachelMit('kontaktaufnahmen'));
  /* DER FEHLER, DER DIESE RUNDE AUSGELOEST HAT: Die Seite schrieb
     „30 Tage", obwohl erst seit zwei Tagen gemessen wurde. */
  pruef('Ein zu früh gewählter Zeitraum wird benannt',
    /gemessen wird erst seit/i.test(zeitraumText) && /3 Tagen/.test(zeitraumText),
    zeitraumText);

  /* 4c. Diagramm, Vollständigkeit der Listen */
  /* .saeule.tag, nicht .saeule: Die Stunden zeichnen inzwischen eigene
     Saeulen, und die wuerden hier mitgezaehlt. */
  const saeulen = await page.$$eval('.saeule.tag', (n) => n.length);
  pruef('Das Diagramm zeichnet je Tag eine Säule', saeulen === 3, saeulen + ' Säulen');
  /* Die Uhrzeit ist seit dem Umbau ein Diagramm und keine Liste aus 24
     Zeilen mehr - 24 Nullen untereinander haben die Seite auseinander
     gezogen. Geprueft wird jetzt, dass alle 24 Saeulen da sind und die
     staerkste Stunde im Klartext darunter steht. */
  const stunden = await page.$$eval('.saeule.stunde', (n) => n.length);
  pruef('Alle 24 Stunden im Diagramm', stunden === 24, stunden + ' Säulen');
  pruef('Die stärkste Stunde steht im Klartext',
    /Stärkste Stunde: 20:00 Uhr mit 55 Aufrufen/.test(text),
    (text.match(/Stärkste Stunde[^\n]*/) || [''])[0]);
  const handlungen = beschriftungen.filter((b) =>
    /angeklickt|abgeschickt|geöffnet|geteilt|erzeugt|angefragt/.test(b.text)).length;
  pruef('Auch Handlungen mit null werden gezeigt', handlungen === 9, handlungen + ' Handlungen');
  pruef('Der Trichter nennt den Ausstieg',
    /60 % steigen hier aus/.test(text), (text.match(/2\. dach[^\n]*/) || [''])[0].trim());
  pruef('Die Verweildauer steht bei der Seite', /3:05 Min\./.test(text));
  /* ---------- Der zweite Ausbau ---------- */
  pruef('Gerade aktiv wird angezeigt',
    /2 Aufrufe in den letzten 30 Minuten/.test(text),
    (text.match(/.*letzten 30 Minuten/) || [''])[0].trim());
  pruef('Das Bundesland steht da',
    hatName('Rheinland-Pfalz') && /Aus welchem Bundesland/.test(text));
  pruef('Das Land wird ausgeschrieben', hatName('Deutschland'));
  pruef('Worauf geklickt wird, steht da', hatName('Jetzt anfragen'));
  pruef('Die Lesetiefe steht bei der Seite', /% gelesen/.test(text),
    (text.match(/\d+ % gelesen/) || [''])[0]);
  pruef('Einstiege werden ausgewiesen', /Einstieg/.test(text));
  const zellen = await page.$$eval('.matrix .zelle', (n) => n.length);
  pruef('Die Wochentag-Stunden-Matrix hat 168 Felder', zellen === 168, zellen + ' Felder');
  /* Samstag 20 Uhr ist der staerkste Punkt im Beispiel - dort muss die
     dunkelste Zelle sitzen, sonst stimmt die Umrechnung von SQLites
     Sonntag=0 auf Montag=0 nicht. */
  const dunkelste = await page.$$eval('.matrix tr', (zeilen) => {
    let best = { tag: '', stunde: -1, deckung: -1 };
    zeilen.forEach((tr) => {
      const name = (tr.querySelector('th.tag') || {}).textContent || '';
      Array.from(tr.querySelectorAll('.zelle')).forEach((z, i) => {
        /* ZWEI SCHREIBWEISEN, und daran ist diese Pruefung zuerst
           gescheitert: Chromium gibt rgba(...,1) als rgb(...) zurueck -
           ausgerechnet die DUNKELSTE Zelle sah damit aus wie keine
           Farbe. Also: Goldton erkennen, Deckung 1, wenn keine
           angegeben ist. Der graue Grundton zaehlt als 0. */
        const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/
          .exec(getComputedStyle(z).backgroundColor);
        const gold = m && m[1] === '196' && m[2] === '154' && m[3] === '42';
        const d = gold ? (m[4] === undefined ? 1 : parseFloat(m[4])) : 0;
        if (d > best.deckung) best = { tag: name, stunde: i, deckung: d };
      });
    });
    return best;
  });
  pruef('Die dunkelste Zelle sitzt Samstag um 20 Uhr',
    dunkelste.tag === 'Sa' && dunkelste.stunde === 20,
    dunkelste.tag + ', ' + dunkelste.stunde + ' Uhr');
  pruef('Was auffällt steht in Sätzen',
    /Dein stärkster Tag ist/.test(text) && /schauen vom Handy/.test(text)
    && /sitzen in/.test(text),
    (text.match(/Dein stärkster Tag[^\n]*/) || [''])[0]);
  pruef('Die Anfragequote wird ausgerechnet',
    /Aus je 33 Seitenaufrufen/.test(text),
    (text.match(/Aus je[^\n]*/) || [''])[0]);

  /* CSV: nicht nur der Knopf, sondern sein Inhalt. */
  /* ROH gelesen, nicht als Text: blob.text() entfernt die
     Byte-Order-Mark beim Dekodieren - genau die, die Excel braucht.
     Ueber den Text waere sie nie nachzuweisen. */
  const csvRoh = await page.evaluate(() => new Promise((fertig) => {
    const echt = URL.createObjectURL;
    URL.createObjectURL = function (blob) {
      blob.arrayBuffer().then((b) => fertig(Array.from(new Uint8Array(b))));
      URL.createObjectURL = echt;
      return 'blob:test';
    };
    document.getElementById('csv').click();
  }));
  const csv = new TextDecoder('utf-8').decode(new Uint8Array(csvRoh)).replace(/^\ufeff/, '');
  const csvOk = {
    tag: /"Tag";"2026-11-14";"90"/.test(csv),
    land: /"Bundesland";"Rheinland-Pfalz";"70"/.test(csv),
    bom: csvRoh[0] === 0xef && csvRoh[1] === 0xbb && csvRoh[2] === 0xbf
  };
  pruef('Die CSV-Datei trägt die Zahlen', csvOk.tag && csvOk.land && csvOk.bom,
    csv.split('\r\n').length + ' Zeilen · ' + JSON.stringify(csvOk)
    + ' · Anfang: ' + JSON.stringify(csv.slice(0, 60)));

  /* Das Bild VOR den Bedienproben: Danach steht die Seite mitten im
     Farbuebergang des Tonwechsels, und auf dem Bild saehe alles blass
     aus - beim ersten Versuch genau so passiert. */
  if (!GEGENPROBE) await page.screenshot({ path: 'pruefbilder/werkstatt-zahlen.png', fullPage: true });

  /* ---------- Gestaltung und Bedienung ---------- */
  const vorMehr = await page.$$eval('.reihe', (n) => n.filter((r) => r.offsetParent !== null).length);
  const mehrKnopf = page.locator('button[data-mehr]').first();
  if (await mehrKnopf.count()) {
    await mehrKnopf.click();
    await page.waitForTimeout(250);
  }
  const nachMehr = await page.$$eval('.reihe', (n) => n.filter((r) => r.offsetParent !== null).length);
  pruef('Lange Listen lassen sich aufklappen', nachMehr > vorMehr,
    vorMehr + ' → ' + nachMehr + ' sichtbare Zeilen');

  const spitzen = await page.$$eval('.reihe.spitze .nam', (n) => n.map((x) => x.textContent.trim()));
  pruef('Nur der Spitzenwert ist golden, nicht alles',
    spitzen.length > 2 && spitzen.length < 14 && spitzen.indexOf('/konfigurator.html') > -1,
    spitzen.length + ' hervorgehobene Zeilen');

  /* Die Wolke am Diagramm: Ein <title> im SVG zeigt das Handy nicht an,
     deshalb eine eigene. Geprueft wird, dass sie beim Zeigen erscheint
     und den richtigen Tag nennt. */
  /* Erst heranscrollen: boundingBox() liefert die Lage im Fenster, und
     was unterhalb davon liegt, kann die Maus nicht erreichen - der
     Zeiger landete sonst neben der Seite. */
  await page.locator('.diagramm.tage svg').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const svgKasten = await page.locator('.diagramm.tage svg').boundingBox();
  await page.mouse.move(svgKasten.x + svgKasten.width * 0.88, svgKasten.y + svgKasten.height / 2);
  await page.waitForTimeout(200);
  const wolke = await page.locator('.diagramm.tage .wolke').innerText().catch(() => '');
  const wolkeDa = await page.locator('.diagramm.tage .wolke.an').count();
  pruef('Das Diagramm zeigt beim Zeigen eine Wolke',
    wolkeDa === 1 && /90 Aufrufe/.test(wolke) && /Samstag/.test(wolke),
    wolke.replace(/\n/g, ' · '));

  const ton = await page.evaluate(() => {
    const k = document.getElementById('ton');
    k.click();                                   // automatisch -> hell
    const a = document.documentElement.getAttribute('data-ton');
    k.click();                                   // hell -> dunkel
    return { a: a, b: document.documentElement.getAttribute('data-ton'), text: k.textContent };
  });
  pruef('Hell und dunkel lassen sich umschalten',
    ton.a === 'hell' && ton.b === 'dunkel' && /dunkel/.test(ton.text),
    ton.a + ' → ' + ton.b);
  /* NACH dem Farbuebergang messen: body hat transition:background .2s,
     und waehrend des Uebergangs liefert getComputedStyle die gerade
     angezeigte Zwischenfarbe - beim ersten Versuch also noch die helle.
     Nicht die Seite war falsch, sondern der Zeitpunkt der Messung. */
  await page.waitForTimeout(400);
  const dunkelGrund = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor);
  pruef('Im dunklen Ton ist der Grund wirklich dunkel',
    /^rgb\((\d+), (\d+), (\d+)\)$/.test(dunkelGrund)
    && Number(RegExp.$1) < 60 && Number(RegExp.$2) < 60, dunkelGrund);
  await page.evaluate(() => {
    document.getElementById('ton').click();      // zurueck auf automatisch
  });

  /* ---------- Am Handy ----------
     Die Auswertung schaut sich der Betrieb unterwegs an. Eine Seite,
     die seitlich wegläuft, ist dort unbrauchbar - geprüft wird deshalb
     die wirkliche Breite, nicht der Eindruck. Die Matrix darf scrollen,
     aber in ihrem eigenen Kasten, nicht die ganze Seite. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const handy = await page.evaluate(() => {
    const w = window.innerWidth;
    /* Nicht nur MELDEN, dass etwas herausragt, sondern WAS. Eine
       Pruefung, die nur „zu breit" sagt, kostet jedes Mal eine eigene
       Suche. Die Matrix und ihr Inhalt duerfen herausragen - sie hat
       ihren eigenen Scrollkasten. */
    const schuld = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.closest('.matrix')) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > w + 1 || r.left < -1)) {
        schuld.push(el.tagName.toLowerCase() + '.'
          + String(el.className || '').split(' ')[0]
          + ' [' + Math.round(r.left) + '…' + Math.round(r.right) + ']');
      }
    });
    return {
      breiter: document.documentElement.scrollWidth > w + 1,
      schuld: schuld.slice(0, 5),
      kachelBreite: Math.round(document.querySelector('.kz').getBoundingClientRect().width),
      matrixScrollt: (() => {
        const m = document.querySelector('.matrix');
        return !!m && m.scrollWidth > m.clientWidth;
      })()
    };
  });
  pruef('Am Handy läuft nichts seitlich weg', !handy.breiter,
    handy.breiter ? handy.schuld.join(' | ')
                  : 'Kachelbreite ' + handy.kachelBreite + ' px bei 390 px Fenster');
  pruef('Die Matrix scrollt in ihrem eigenen Kasten', handy.matrixScrollt);
  /* Der Seitenname darf am Handy nicht zur Unkenntlichkeit schrumpfen -
     aus „/konfigurator.html" wurde vorher „/...". */
  const namBreiten = await page.$$eval('.reihe .nam', (n) => n
    .filter((x) => x.offsetParent !== null)
    .map((x) => Math.round(x.getBoundingClientRect().width)));
  pruef('Am Handy bleiben die Namen lesbar',
    namBreiten.length > 10 && Math.min(...namBreiten) >= 150,
    'schmalster Name ' + Math.min(...namBreiten) + ' px');
  if (!GEGENPROBE) await page.screenshot({ path: 'pruefbilder/werkstatt-zahlen-handy.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);

  pruef('Der Abschalter steht auf der Seite', await page.locator('#abschalter').isVisible());
  pruef('Zahlenseite ohne Fehler', fehlerSeite.length === 0, fehlerSeite.join(' | ').slice(0, 100));
  await page.close();
}

/* ---------- 5. Dieselbe Seite ohne jede Zahl ----------
   So sah sie am ersten Tag aus, und so darf sie nicht kaputtgehen. */
{
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const fehlerSeite = [];
  page.on('pageerror', (e) => fehlerSeite.push(e.message));
  await page.route('**/werkstatt/api/zahlen*', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ von: '2026-11-03', tage: 30, tageReihe: [], seiten: [],
      quellen: [], geraete: [], handlungen: [], trichter: [], stunden: [],
      vorher: { aufrufe: 0, dauer: 0, handlungen: [] } })
  }));
  await page.goto(`${BASIS}/werkstatt/zahlen.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const leerText = await page.locator('body').innerText();
  pruef('Ohne Daten erklärt die Seite, warum',
    /Noch nichts zu sehen/.test(leerText) && /3\. November 2026/.test(leerText));
  pruef('Ohne Daten sagt der Trichter, woran es liegt',
    /öffentliche Konfigurator ist gesperrt/.test(leerText));
  pruef('Ohne Daten keine Fehler', fehlerSeite.length === 0,
    fehlerSeite.join(' | ').slice(0, 100));
  await page.close();
}

await browser.close();
server.kill();

if (!GEGENPROBE) {
  console.log(fehler === 0
    ? `\nErgebnis: alle ${ergebnisse.length} Prüfungen bestanden`
    : `\nErgebnis: ${fehler} von ${ergebnisse.length} Prüfung(en) nicht bestanden`);
  process.exit(fehler === 0 ? 0 : 1);
}

const sollenScheitern = [
  'Das Diagramm zeigt beim Zeigen eine Wolke',
  'Die Lesetiefe fährt mit',
  'Die Beschriftung des Geklickten fährt mit',
  'Die dunkelste Zelle sitzt Samstag um 20 Uhr',
  'Die CSV-Datei trägt die Zahlen',
  'Jede Zeile trägt eine sichtbare Beschriftung',
  'Die Namen stehen wirklich da, nicht nur die Balken',
  'Auch geladen würde in der Werkstatt nicht gemessen',
  'Mit Abschalter wird nichts gesendet',
  'Die Verweildauer ist gemessen, nicht geraten'
];
let luecken = 0;
sollenScheitern.forEach((name) => {
  const t = ergebnisse.find((e) => e[0] === name);
  if (!t) { console.log('  FEHLGESCHLAGEN ' + name + ' – Prüfung gar nicht gelaufen'); luecken++; }
  else if (t[1]) { console.log('  FEHLGESCHLAGEN ' + name + ' – eingebauten Fehler NICHT bemerkt'); luecken++; }
  else console.log('  erkannt        ' + name);
});
console.log(luecken === 0
  ? 'Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden'
  : `Ergebnis: ${luecken} eingebaute Fehler blieben unbemerkt`);
process.exit(luecken === 0 ? 0 : 1);
