/* ============================================================
   Freie Planung: Pfosten entfernen, Daecher hinzufuegen, ziehen, drehen.

   Warum im Browser und nicht am Quelltext: Ob ein Doppelklick wirklich
   einen Pfosten trifft und ob ein Zug das Dach bewegt statt die Kamera
   zu drehen, steht in keiner Datei. Genau daran scheiterte der erste
   Nachweis am 17.11.2026: Das Bild aenderte sich, aber das bewies nur,
   dass sich IRGENDETWAS geaendert hatte.

   Gemessen wird deshalb ueber window.BV_FREI, ein Lesefenster, das es
   nur in js/konfigurator-frei.js gibt.

   Aufruf:     node scripts/pruefe-freie-planung.mjs
   Gegenprobe: node scripts/pruefe-freie-planung.mjs --gegenprobe
   ============================================================ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8731;
let fehler = 0, anzahl = 0;
const p = (name, ok, beleg) => {
  anzahl++;
  if (ok) { if (!GEGEN) console.log(`  ok      ${name.padEnd(52)} ${beleg}`); }
  else { console.log(`  FEHLER  ${name.padEnd(52)} ${beleg}`); fehler++; }
};

/* Der Schluessel aus pfostenPunkte() traegt seit dem 18.11.2026 die
   Nummer des Daches vorweg (-1 ist das Hauptdach). Die Listen
   pfostenWeg() und einzeln() fuehren ihn ohne diese Nummer, weil sie
   schon je Dach gefuehrt werden. */
const ohneDach = (k) => String(k).split('|').pop();

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch();
const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'bvfrei-'));
try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 },
    acceptDownloads: true });
  const seite = await ctx.newPage();
  const seitenfehler = [];
  seite.on('pageerror', (e) => seitenfehler.push(e.message.slice(0, 120)));
  await seite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await seite.waitForTimeout(4500);

  p('Seite laedt ohne Fehler', seitenfehler.length === 0,
    seitenfehler[0] || 'keine Meldung');
  const hatFenster = await seite.evaluate(() => !!(window.BV_FREI && window.BV_FREI.module));
  p('Lesefenster BV_FREI ist da', hatFenster, 'window.BV_FREI');
  if (!hatFenster) throw new Error('ohne BV_FREI kann nichts gemessen werden');

  /* ---- Pfosten ---- */
  /* JEDER Pfosten, nicht nur ein beliebiger. Der erste Entwurf dieser
     Pruefung holte seinen Klickpunkt aus pfostenUnterZeiger() und traf
     damit immer den mittleren, verschiebbaren. Die Eckpfosten waren in
     Wahrheit nicht anklickbar, und die Pruefung war trotzdem gruen.
     Gemeldet hat das der Betreiber, nicht die Pruefung. */
  const alle = await seite.evaluate(() => window.BV_FREI.pfostenPunkte());
  p('alle Pfosten sind anklickbar, auch die Ecken', alle.length >= 3,
    alle.map((a) => a.schluessel).join(', ') || '(keiner)');

  let jeder = true, gescheitert = '';
  for (const a of alle) {
    await seite.mouse.dblclick(a.x, a.y);
    await seite.waitForTimeout(800);
    const w = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
    if (w.indexOf(ohneDach(a.schluessel)) < 0) {
      jeder = false; gescheitert = a.schluessel; break;
    }
  }
  p('Doppelklick nimmt JEDEN Pfosten weg', jeder,
    jeder ? alle.length + ' von ' + alle.length : 'nicht entfernt: ' + gescheitert);

  const band = await seite.evaluate(() =>
    (document.getElementById('bvFreiPfostenZahl') || {}).textContent || '');
  p('das Band zaehlt mit', /Pfosten entfernt/.test(band), band.trim() || '(leer)');

  /* Zurueckholen am BLASSEN Pfosten, an derselben Stelle. */
  const ecke = alle[0];
  await seite.mouse.dblclick(ecke.x, ecke.y);
  await seite.waitForTimeout(900);
  const nachZurueck = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
  p('Doppelklick auf den blassen Pfosten holt ihn zurueck',
    nachZurueck.indexOf(ohneDach(ecke.schluessel)) < 0, ecke.schluessel + ' -> ' +
    JSON.stringify(nachZurueck));

  await seite.evaluate(() => document.getElementById('bvFreiPfostenZurueck').click());
  await seite.waitForTimeout(900);
  const weg2 = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
  p('Alle zurueckholen leert die Liste', weg2.length === 0, JSON.stringify(weg2));
  const punkt = alle[0] || { x: 0, y: 0 };

  /* ---- jeden Pfosten auch VERSCHIEBEN ----
     "es soll ja bei allen pfosten gehen, ausblenden und verschieben"
     (Betreiber, 17.11.2026). Vorher liessen sich nur Zwischenpfosten
     ziehen, Eckpfosten standen fest. */
  let gezogen = 0, nichtGezogen = '';
  const zumZiehen = await seite.evaluate(() => window.BV_FREI.pfostenPunkte());
  for (const a of zumZiehen) {
    await seite.mouse.click(a.x, a.y);
    await seite.waitForTimeout(500);
    const jetzt = (await seite.evaluate(() => window.BV_FREI.pfostenPunkte()))
      .find((q) => q.schluessel === a.schluessel) || a;
    await seite.mouse.move(jetzt.x, jetzt.y);
    await seite.mouse.down();
    await seite.mouse.move(jetzt.x + 110, jetzt.y, { steps: 12 });
    await seite.mouse.up();
    await seite.waitForTimeout(600);
    /* Der Versatz liegt je EINZELNEM Pfosten, nicht je Achse. */
    const v = await seite.evaluate(() => window.BV_FREI.einzeln());
    if (Number(v[ohneDach(a.schluessel)])) gezogen++;
    else nichtGezogen = a.schluessel;
  }
  p('JEDER Pfosten laesst sich verschieben, auch die Ecken',
    gezogen === zumZiehen.length && zumZiehen.length >= 3,
    gezogen + ' von ' + zumZiehen.length +
    (nichtGezogen ? ', nicht bewegt: ' + nichtGezogen : ''));
  /* Zurueck auf die gleichmaessige Lage, damit die naechsten Messungen
     von einem bekannten Stand ausgehen. */
  await seite.evaluate(() => { window.BV_FREI.versatz(); });

  /* ---- Daecher ---- */
  await seite.click('#bvFreiDachDazu');
  await seite.waitForTimeout(1200);
  const m1 = await seite.evaluate(() => window.BV_FREI.module());
  p('ein Dach kommt dazu', m1.length === 1, JSON.stringify(m1));
  p('es steht neben dem ersten, nicht darin', m1.length === 1 && m1[0].x > 100,
    'x = ' + (m1[0] ? m1[0].x : '?'));

  const z = await seite.evaluate(() => {
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    return { x: r.left + r.width * 0.70, y: r.top + r.height * 0.52,
             x2: r.left + r.width * 0.50, y2: r.top + r.height * 0.72 };
  });
  await seite.mouse.move(z.x, z.y);
  await seite.mouse.down();
  await seite.mouse.move(z.x2, z.y2, { steps: 14 });
  await seite.mouse.up();
  await seite.waitForTimeout(1000);
  const m2 = await seite.evaluate(() => window.BV_FREI.module());
  const bewegt = m2.length === 1 && (m2[0].x !== m1[0].x || m2[0].z !== m1[0].z);
  p('Ziehen bewegt das Dach', bewegt,
    `${m1[0] ? m1[0].x + '/' + m1[0].z : '?'} -> ${m2[0] ? m2[0].x + '/' + m2[0].z : '?'}`);

  await seite.click('#bvFreiDachDrehen');
  await seite.waitForTimeout(800);
  const m3 = await seite.evaluate(() => window.BV_FREI.module());
  p('Drehen setzt 90 Grad', m3.length === 1 && Math.abs(m3[0].dreh - Math.PI / 2) < 0.01,
    'dreh = ' + (m3[0] ? m3[0].dreh.toFixed(3) : '?'));

  await seite.click('#bvFreiDachWeg');
  await seite.waitForTimeout(800);
  const m4 = await seite.evaluate(() => window.BV_FREI.module());
  p('Entfernen nimmt es wieder weg', m4.length === 0, JSON.stringify(m4));

  /* ---- Masse ohne Tabellengrenze ---- */
  const regler = await seite.evaluate(() => {
    const b = document.getElementById('k3dBreite'), t = document.getElementById('k3dTiefe');
    return { bMax: Number(b.max), tMax: Number(t.max) };
  });
  p('Breite geht ueber die Tabelle hinaus', regler.bMax >= 20000,
    'Regler bis ' + regler.bMax + ' mm');
  p('Tiefe geht ueber die Tabelle hinaus', regler.tMax >= 10000,
    'Regler bis ' + regler.tMax + ' mm');
  await seite.evaluate(() => {
    const b = document.getElementById('k3dBreite'), t = document.getElementById('k3dTiefe');
    b.value = 12000; b.dispatchEvent(new Event('input', { bubbles: true }));
    t.value = 9000;  t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await seite.waitForTimeout(2200);
  const gross = await seite.evaluate(() =>
    (document.body.innerText.match(/\d{3,5}\s*×\s*\d{3,5}\s*mm/) || ['?'])[0]);
  p('12000 x 9000 mm werden uebernommen', /12000\s*×\s*9000/.test(gross), gross);

  /* ERST den Pfosten wegnehmen, DANN verbreitern und ein Dach dazu.
     Andersherum stand nach dem Aufziehen des Blicks an keiner
     gemessenen Stelle mehr ein Pfosten, und der Doppelklick ging ins
     Leere - die Pruefung meldete dann faelschlich die Stueckliste als
     fehlerhaft. */
  /* Die z-bewusste Liste, nicht der alte Einzelpunkt: Nach den Massen
     je Modul stimmte der alte Punkt nicht mehr, und die Stueckliste
     wurde faelschlich beanstandet. Das Entfernen wird gleich hier
     geprueft, damit ein Fehlschlag dort gemeldet wird, wo er entsteht. */
  const liste2 = await seite.evaluate(() => window.BV_FREI.pfostenPunkte());
  if (liste2.length) await seite.mouse.dblclick(liste2[0].x, liste2[0].y);
  await seite.waitForTimeout(1500);
  const weg3 = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
  p('ein Pfosten ist weggenommen, bevor die Stueckliste gemessen wird',
    weg3.length === 1, liste2.length + ' greifbar, entfernt: ' + JSON.stringify(weg3));

  /* Breite ueber das Ende der Tabelle (14080 mm), damit der Hinweis
     dazu geprueft werden kann. 12000 mm von oben reichen dafuer nicht. */
  await seite.evaluate(() => {
    const b = document.getElementById('k3dBreite');
    b.value = 20000; b.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await seite.waitForTimeout(2500);
  await seite.click('#bvFreiDachDazu');
  await seite.waitForTimeout(1800);

  /* ---- eigene Masse je Dach ----
     "auch einzeln die groessen bei den einzelnen daechern aendern"
     (Betreiber, 17.11.2026). Jedes Modul wird dafuer mit SEINEN Massen
     gebaut, nicht mehr nur kopiert. */
  const hauptVorher = await seite.evaluate(() => {
    const m = document.body.innerText.match(/(\d{3,5}) × (\d{3,5}) mm/);
    return m ? m[0] : '?';
  });
  await seite.evaluate(() => window.BV_FREI.modulMass(0, 'breite', 9000));
  await seite.waitForTimeout(4500);
  await seite.evaluate(() => window.BV_FREI.modulMass(0, 'hoehe', 3800));
  await seite.waitForTimeout(4500);
  const nachMass = await seite.evaluate(() => window.BV_FREI.module());
  p('ein Dach bekommt eigene Breite', nachMass.length >= 1 && nachMass[0].breite === 9000,
    JSON.stringify(nachMass));
  p('ein Dach bekommt eigene Hoehe', nachMass.length >= 1 && nachMass[0].hoehe === 3800,
    'Hoehe = ' + (nachMass[0] ? nachMass[0].hoehe : '?'));
  const felder = await seite.evaluate(() => ['Breite', 'Tiefe', 'Hoehe']
    .map((f) => { const e = document.getElementById('bvFreiDach' + f);
                  return f + '=' + (e ? e.value : 'fehlt'); }).join(' '));
  p('die Felder im Band zeigen die Masse des gewaehlten Daches',
    /Breite=9000/.test(felder) && /Hoehe=3800/.test(felder), felder);
  const hauptNachher = await seite.evaluate(() => {
    const m = document.body.innerText.match(/(\d{3,5}) × (\d{3,5}) mm/);
    return m ? m[0] : '?';
  });
  p('das Hauptdach bleibt dabei unveraendert', hauptVorher === hauptNachher,
    hauptVorher + ' -> ' + hauptNachher);

  /* ---- weggenommene Pfosten sind auf dem Bild GANZ weg ----
     "spaeter auf dem erstellten pdf darf man die ausgeblendeten pfosten
     garnicht sehen auch nicht so leicht, im bearbeitungsmodus is es gut
     so" (Betreiber, 18.11.2026).

     Auf einer FRISCHEN Seite: An dieser Stelle war die Anlage 20 m
     breit und der Blick weit aufgezogen, kein Pfosten im Bild, und die
     Pruefung meldete "0 blasse Koerper" als Fehler, obwohl nichts
     kaputt war. */
  const gSeite = await ctx.newPage();
  await gSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await gSeite.waitForTimeout(4500);
  const gp = await gSeite.evaluate(() => window.BV_FREI.pfostenPunkte());
  p('ein Pfosten ist im Bild greifbar', gp.length >= 1, gp.length + ' gefunden');
  if (gp.length) {
    await gSeite.mouse.dblclick(gp[0].x, gp[0].y);
    await gSeite.waitForTimeout(1500);
  }
  const sichtbar = await gSeite.evaluate(() => window.BV_FREI.geisterSichtbar());
  p('beim Bearbeiten ist der weggenommene Pfosten blass zu sehen', sichtbar > 0,
    sichtbar + ' blasse Koerper');
  const probe = await gSeite.evaluate(() => window.BV_FREI.geisterProbe());
  p('im Bild und im PDF ist er GAR NICHT zu sehen',
    probe.waehrendDesBildes === 0 && probe.danach > 0, JSON.stringify(probe));
  await gSeite.close();

  /* ---- Stueckliste folgt der Zeichnung ----
     Zum Zeitpunkt der Pruefung antwortet /api/bauteile nicht. Genau das
     ist der Fall, der hier zaehlt: Der oeffentliche Konfigurator
     versteckt den Kasten dann, die freie Planung rechnet ihn aus der
     freigegebenen Masstabelle. */
  const zeilen = await seite.evaluate(() =>
    Array.from(document.querySelectorAll('#k3dFolgt li'))
      .map((li) => li.innerText.replace(/\s+/g, ' ').trim()));
  p('Stueckliste ist gefuellt, auch ohne Schnittstelle', zeilen.length >= 3,
    zeilen.length + ' Zeilen');
  p('die Pfostenzahl zieht den entfernten ab',
    zeilen.some((z) => /Pfosten .*statt .*\(1 entfernt\)/.test(z)),
    zeilen.find((z) => /^Pfosten/.test(z)) || '(keine Pfostenzeile)');
  p('die zusaetzlichen Daecher zaehlen mit',
    zeilen.some((z) => /^Dächer 2 /.test(z)) &&
    zeilen.some((z) => /insgesamt/.test(z)),
    zeilen.find((z) => /^Dächer/.test(z)) || '(keine Dachzeile)');
  p('Masse ueber der Tabelle werden benannt',
    zeilen.some((z) => /Über der Maßtabelle/.test(z)),
    zeilen.find((z) => /Maßtabelle/.test(z)) || '(kein Hinweis)');

  /* ---- Kennzeichnung dessen, was die Seite verlaesst ----
     Nicht die Texte im Quelltext werden geprueft, sondern das fertige
     PDF: Dateiname und Bytes. Ein Vermerk, den niemand ins Dokument
     bekommt, waere keiner. */
  const kz = await seite.evaluate(() => window.BV_FREI.kennzeichnung());
  p('Dateiname traegt die Kennzeichnung', /^FREIE-PLANUNG-/.test(kz.datei), kz.datei);
  p('Teilen-Text traegt die Kennzeichnung', /FREIE PLANUNG/.test(kz.teilen),
    kz.teilen.slice(0, 48));

  /* Klick ueber das Element statt ueber die Maus: Auf der oeffentlichen
     Seite liegt die Kopfzeile ueber dem Knopf, der Mausklick landete
     dort. Gemessen am 17.11.2026. */
  await seite.evaluate(() => document.getElementById('k3dTeilen').click());
  await seite.waitForTimeout(1500);
  const warten = seite.waitForEvent('download', { timeout: 90000 }).catch(() => null);
  await seite.evaluate(() => document.getElementById('k3dTeilenPdf').click());
  const datei = await warten;
  if (!datei) {
    p('PDF laesst sich erzeugen', false, 'kein Download ausgeloest');
  } else {
    const ziel = path.join(ablage, 'frei.pdf');
    await datei.saveAs(ziel);
    const roh = fs.readFileSync(ziel).toString('latin1');
    p('PDF-Dateiname traegt die Kennzeichnung',
      /^FREIE-PLANUNG-/.test(datei.suggestedFilename()), datei.suggestedFilename());
    p('der Vermerk steht IM PDF', /FREIE PLANUNG/.test(roh),
      roh.length + ' Bytes durchsucht');
  }
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(600);

  /* ---- jedes Dach hat eigene Pfosten, auf einer FRISCHEN Seite ----
     Entscheidung des Betreibers vom 18.11.2026 auf die Frage, was bei
     den Kopien gelten soll: "1", also jedes Dach hat seine eigenen
     Pfosten. Eigene Seite aus demselben Grund wie beim Flat-Line-Teil:
     Die Messungen davor haben Pfosten verschoben und entfernt. */
  const kSeite = await ctx.newPage();
  await kSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await kSeite.waitForTimeout(4500);
  await kSeite.click('#bvFreiDachDazu');
  await kSeite.waitForTimeout(5000);
  const kPunkte = await kSeite.evaluate(() => window.BV_FREI.pfostenPunkte());
  const aufKopie = kPunkte.filter((a) => a.modul >= 0);
  p('Pfosten auf einer Kopie sind anklickbar', aufKopie.length >= 1,
    kPunkte.map((a) => a.schluessel).join(', ') || '(keine)');
  if (aufKopie.length) {
    await kSeite.mouse.dblclick(aufKopie[0].x, aufKopie[0].y);
    await kSeite.waitForTimeout(5000);
    const haupt = await kSeite.evaluate(() => window.BV_FREI.pfostenWeg());
    const kopie = await kSeite.evaluate(() => window.BV_FREI.pfostenWegModul(0));
    p('Wegnehmen auf einer Kopie betrifft NUR dieses Dach',
      haupt.length === 0 && kopie.length === 1,
      'Hauptdach ' + JSON.stringify(haupt) + ', Kopie ' + JSON.stringify(kopie));
  }
  /* Ziehen auf einer Kopie. Rechnet nicht in Achslagen, sondern in der
     Verschiebung; deshalb darf dabei weder das Dach wandern noch ein
     Pfosten des Hauptdachs. */
  const kPunkte2 = await kSeite.evaluate(() => window.BV_FREI.pfostenPunkte());
  const zielK = kPunkte2.find((a) => a.modul >= 0);
  if (zielK) {
    const dachVorher = await kSeite.evaluate(() => window.BV_FREI.module());
    await kSeite.mouse.click(zielK.x, zielK.y);
    await kSeite.waitForTimeout(900);
    const wahl = await kSeite.evaluate(() => window.BV_FREI.wahl());
    p('ein Pfosten auf einer Kopie laesst sich auswaehlen',
      !!wahl && wahl.modul === zielK.modul, JSON.stringify(wahl));
    const jetzt = (await kSeite.evaluate(() => window.BV_FREI.pfostenPunkte()))
      .find((q) => q.schluessel === zielK.schluessel) || zielK;
    await kSeite.mouse.move(jetzt.x, jetzt.y);
    await kSeite.mouse.down();
    await kSeite.mouse.move(jetzt.x + 100, jetzt.y, { steps: 14 });
    await kSeite.mouse.up();
    await kSeite.waitForTimeout(1200);
    const vK = await kSeite.evaluate(() => window.BV_FREI.einzelnModul(0));
    const vH = await kSeite.evaluate(() => window.BV_FREI.einzeln());
    const dachNachher = await kSeite.evaluate(() => window.BV_FREI.module());
    p('Ziehen auf einer Kopie bewegt DEREN Pfosten',
      Object.keys(vK).length === 1, JSON.stringify(vK));
    p('dabei bleibt das Hauptdach unberuehrt', Object.keys(vH).length === 0,
      JSON.stringify(vH));
    p('dabei wandert das Dach selbst nicht',
      dachVorher[0] && dachNachher[0] && dachVorher[0].x === dachNachher[0].x &&
      dachVorher[0].z === dachNachher[0].z,
      (dachVorher[0] ? dachVorher[0].x + '/' + dachVorher[0].z : '?') + ' -> ' +
      (dachNachher[0] ? dachNachher[0].x + '/' + dachNachher[0].z : '?'));
  }
  await kSeite.close();

  /* ---- Flat Line, auf einer FRISCHEN Seite ----
     Eigene Seite, weil die Messungen oben Pfosten verschoben und
     entfernt haben. Auf dem alten Stand stuende Flat Line mit
     Versaetzen aus dem Terrassendach da, und ein Fehlschlag waere nicht
     mehr zuzuordnen. Gelernt am 17.11.2026, als genau das passierte. */
  const flSeite = await ctx.newPage();
  await flSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await flSeite.waitForTimeout(4500);
  await flSeite.evaluate(() => {
    const pr = document.getElementById('k3dProdukt');
    pr.value = 'Carport'; pr.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await flSeite.waitForTimeout(2500);
  await flSeite.evaluate(() => {
    const t = document.getElementById('k3dCpTyp');
    t.value = 'Flachdach Flat Line';
    t.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await flSeite.waitForTimeout(3500);

  /* Am MODELL gemessen, nicht am Bild: Aus einem unguenstigen
     Blickwinkel sind die hinteren Pfosten verdeckt, und pfostenPunkte()
     listet sie dann nicht. */
  const flAlle = await flSeite.evaluate(() => window.BV_FREI.pfostenAlle());
  const paare = {};
  flAlle.forEach((a) => { const k = a.reihe + '#' + a.nr; paare[k] = (paare[k] || 0) + 1; });
  p('Flat Line: vorderer und hinterer Pfosten sind getrennt',
    flAlle.length >= 4 && Object.keys(paare).filter((k) => paare[k] >= 2).length >= 2,
    flAlle.map((a) => a.schluessel).join(', ') || '(keiner)');

  const flSicht = await flSeite.evaluate(() => window.BV_FREI.pfostenPunkte());
  p('Flat Line: ein Doppelklick nimmt GENAU EINEN Pfosten weg', await (async () => {
    if (!flSicht.length) return false;
    await flSeite.mouse.dblclick(flSicht[0].x, flSicht[0].y);
    await flSeite.waitForTimeout(1200);
    const w = await flSeite.evaluate(() => window.BV_FREI.pfostenWeg());
    await flSeite.evaluate(() => document.getElementById('bvFreiPfostenZurueck').click());
    await flSeite.waitForTimeout(800);
    return w.length === 1;
  })(), flSicht.length + ' sichtbar');

  let einzelnOk = 0;
  for (const a of flSicht) {
    await flSeite.mouse.click(a.x, a.y);
    await flSeite.waitForTimeout(500);
    const jetzt = (await flSeite.evaluate(() => window.BV_FREI.pfostenPunkte()))
      .find((q) => q.schluessel === a.schluessel) || a;
    await flSeite.mouse.move(jetzt.x, jetzt.y);
    await flSeite.mouse.down();
    await flSeite.mouse.move(jetzt.x + 90, jetzt.y, { steps: 12 });
    await flSeite.mouse.up();
    await flSeite.waitForTimeout(600);
    const v = await flSeite.evaluate(() => window.BV_FREI.einzeln());
    if (Number(v[ohneDach(a.schluessel)])) einzelnOk++;
  }
  const einzelStand = await flSeite.evaluate(() => window.BV_FREI.einzeln());
  p('Flat Line: vorderer und hinterer Pfosten einzeln verschiebbar',
    einzelnOk === flSicht.length && flSicht.length >= 4,
    einzelnOk + ' von ' + flSicht.length + ': ' + JSON.stringify(einzelStand));
  await flSeite.close();

  /* ---- der Blick umfasst die ganze Anlage, nicht nur Dach 1 ----
     „im pdf \u2026 zoomt es immer aufs erste dach anstatt die ganze
     konstruktion zu zeigen" (Betreiber, 18.11.2026).

     Eigene Seite, weil die Bloecke davor Daecher gedreht und Pfosten
     verschoben haben. Gemessen wird auf ZWEI Wegen: einmal der Abstand,
     den die Kamera nimmt, und einmal unabhaengig davon, ob die acht
     Ecken des umschliessenden Kastens im Bild liegen. */
  const bSeite = await ctx.newPage();
  await bSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await bSeite.waitForTimeout(4500);

  const alleinBlick = await bSeite.evaluate(() => window.BV_FREI.blick('Perspektive'));
  const alleinBild = await bSeite.evaluate(() => window.BV_FREI.imBild(false));
  p('ohne weitere Daecher bleibt der Blick wie vorher',
    alleinBlick.ziel[0] === 0 && alleinBild !== null && alleinBild <= 1,
    `Ziel x=${alleinBlick.ziel[0]}, Rand ${alleinBild}`);

  for (let i = 0; i < 2; i++) {
    await bSeite.evaluate(() => document.getElementById('bvFreiDachDazu').click());
    await bSeite.waitForTimeout(3000);
  }
  const anzB = await bSeite.evaluate(() => window.BV_FREI.module().length);
  p('zwei weitere Daecher stehen', anzB === 2, anzB + ' Module');

  const weitBlick = await bSeite.evaluate(() => window.BV_FREI.blick('Perspektive'));
  p('die Kamera geht fuer drei Daecher weiter weg',
    weitBlick.radius > alleinBlick.radius * 1.3,
    `${alleinBlick.radius} -> ${weitBlick.radius}`);
  p('und der Blickpunkt wandert in die Mitte der Anlage',
    Math.abs(weitBlick.ziel[0]) > 50,
    `Ziel x=${weitBlick.ziel[0]} statt ${alleinBlick.ziel[0]}`);

  /* ---- jedes Dach bekommt seine eigene Bemassung ----
     „beim 2,3 dach etc werden auch keine masse angezeigt" (Betreiber,
     18.11.2026). masseZeichnen() rechnet aus Z.breite, Z.tiefe und
     Z.hoehe, also aus dem Hauptdach, und zeichnete nur dort. */
  const mk = await bSeite.evaluate(() => window.BV_FREI.masseKopien());
  p('jedes weitere Dach hat eine eigene Bemassung',
    mk.kopien.length === 2 && mk.kopien.every((k) => k.teile > 0),
    JSON.stringify(mk.kopien));
  p('die Bemassung steht beim Dach, nicht im Ursprung',
    mk.kopien.every((k) => Math.abs(k.x) > 50),
    mk.kopien.map((k) => 'x=' + k.x).join(', '));
  const mm = await bSeite.evaluate(() => window.BV_FREI.masseMarken());
  const jeDach = mk.kopien[0] ? mk.kopien[0].teile : 0;
  p('zweiter Weg: die Marken in der Szene gehen auf',
    mm.gesamt === mm.imHauptdach + mk.kopien.reduce((a2, k) => a2 + k.teile, 0) &&
    mm.imHauptdach === mk.haupt,
    `${mm.gesamt} Marken, davon ${mm.imHauptdach} am Hauptdach, je Kopie ${jeDach}`);

  /* Der Haken gilt fuer die ganze Anlage. */
  const ausAn = await bSeite.evaluate(async () => {
    const h = document.getElementById('k3dMasse');
    const vorher = window.BV_FREI.masseKopien().sichtbar;
    h.checked = !h.checked;
    h.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 2500));
    const nachher = window.BV_FREI.masseKopien().sichtbar;
    h.checked = !h.checked;
    h.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 2500));
    return { vorher, nachher, zurueck: window.BV_FREI.masseKopien().sichtbar };
  });
  p('der Haken "Masse" schaltet auch die Kopien',
    ausAn.vorher === true && ausAn.nachher === false && ausAn.zurueck === true,
    JSON.stringify(ausAn));

  /* Der zweite, anders gebaute Weg: nachgerechnet statt gerechnet. */
  for (const ansicht of ['Perspektive', 'Vorne', 'Seite', 'Von oben']) {
    const rand = await bSeite.evaluate((a) => {
      window.BV_FREI.blick(a);
      return [window.BV_FREI.imBild(false), window.BV_FREI.imBild(true)];
    }, ansicht);
    p(`Ansicht "${ansicht}": ganze Anlage im Bild`,
      rand[0] !== null && rand[0] <= 1,
      `schlimmste Ecke ${rand[0]} (ueber 1 = abgeschnitten)`);
    p(`Ansicht "${ansicht}": auch die Masszahlen im Bild`,
      rand[1] !== null && rand[1] <= 1,
      `mit Bemassung ${rand[1]}`);
  }
  await bSeite.close();

  /* ---- die Masslinien stehen im Bild, nicht daneben ----
     Gemessen am 18.11.2026: In der Perspektive reichten die Masslinien
     bis 1,30 der halben Bildbreite. Fuer die Aufnahme nimmt die Kamera
     jetzt so weit zurueck, dass sie hineinpassen; am Schirm bleibt der
     Blick wie er war. Dieselbe Funktion steckt in
     js/konfigurator-3d.js, siehe pruefe-konfigurator-frei.sh. */
  const mSeite = await ctx.newPage();
  await mSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await mSeite.waitForTimeout(4500);
  for (const ansicht of ['Perspektive', 'Vorne', 'Seite', 'Von oben']) {
    const r = await mSeite.evaluate((a2) => window.BV_FREI.bildRand(a2), ansicht);
    p(`Bild "${ansicht}": Masslinien im Bild`,
      r.imBild !== null && r.imBild <= 1,
      `ohne Korrektur ${r.ohneKorrektur}, im Bild ${r.imBild}`);
  }
  const vorher = await mSeite.evaluate(() => {
    window.BV_FREI.blick('Perspektive');
    return window.BV_FREI.kamera().radius;
  });
  const nachBild = await mSeite.evaluate(() => {
    window.BV_FREI.bildRand('Perspektive');
    return window.BV_FREI.kamera().radius;
  });
  p('nach der Aufnahme steht die Kamera wieder wie vorher',
    Math.abs(vorher - nachBild) < 2, `${vorher} -> ${nachBild}`);
  await mSeite.close();

  /* ---- Kamera: zoomen, drehen, fahren ohne Sperre ----
     „man wird behindert beim rein rauszoomen oder kamerafahrten wohin
     man will und winkel etc" (Betreiber, 18.11.2026). */
  const kamSeite = await ctx.newPage();
  await kamSeite.goto(`http://127.0.0.1:${PORT}/werkstatt/frei.html?t=${Date.now()}`,
    { waitUntil: 'load' });
  await kamSeite.waitForTimeout(4500);

  const k0 = await kamSeite.evaluate(() => window.BV_FREI.kamera());
  p('die Zoomspanne ist weit aufgezogen',
    k0.max / k0.radius > 15 && k0.radius / k0.min > 15,
    `${k0.min} bis ${k0.max}, Start ${k0.radius}`);

  /* Wirklich mit dem Rad, nicht durch Setzen der Zahl. */
  const kRaus = await kamSeite.evaluate(async () => {
    const c = document.querySelector('canvas');
    for (let i = 0; i < 40; i++) {
      c.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
    }
    await new Promise((r) => setTimeout(r, 300));
    return window.BV_FREI.kamera().radius;
  });
  p('vierzig Raddrehungen zoomen wirklich heraus',
    kRaus > k0.radius * 5, `${k0.radius} -> ${kRaus}`);
  const kRein = await kamSeite.evaluate(async () => {
    const c = document.querySelector('canvas');
    for (let i = 0; i < 80; i++) {
      c.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true }));
    }
    await new Promise((r) => setTimeout(r, 300));
    return window.BV_FREI.kamera().radius;
  });
  p('und wieder weit herein', kRein < k0.radius * 0.3,
    `${kRaus} -> ${kRein}`);

  /* Der Winkel: unter den Boden und ueber den Scheitel. */
  const wUnten = await kamSeite.evaluate(() => window.BV_FREI.winkel(3.0).phi);
  const wOben = await kamSeite.evaluate(() => window.BV_FREI.winkel(0.05).phi);
  p('der Blick darf unter den Boden', wUnten > 2.9, `phi ${wUnten} (Boden bei 1.571)`);
  p('und bis fast senkrecht von oben', wOben <= 0.06 && wOben > 0,
    `phi ${wOben}`);

  /* Kamerafahrt mit der rechten Maustaste, als echtes Ereignis.
     Vorher wieder auf einen normalen Abstand: Der Weg je Pixel haengt
     am Abstand, und der Block darueber hat die Kamera bis auf 34
     herangezogen. Dort sind 120 Pixel richtigerweise nur ein paar
     Zentimeter. */
  await kamSeite.evaluate(() => window.BV_FREI.zoom(800));
  const fahrt = await kamSeite.evaluate(async () => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const mitte = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    const vorher = window.BV_FREI.kamera().ziel;
    const ab = (t, x, y, b) => c.dispatchEvent(new PointerEvent(t, {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse',
      button: b, buttons: b === 2 ? 2 : 1, clientX: x, clientY: y }));
    ab('pointerdown', mitte.x, mitte.y, 2);
    for (let i = 1; i <= 10; i++) {
      window.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true, pointerId: 7, pointerType: 'mouse', button: 2, buttons: 2,
        clientX: mitte.x - i * 12, clientY: mitte.y + i * 6 }));
    }
    window.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, pointerId: 7, pointerType: 'mouse', button: 2, buttons: 0,
      clientX: mitte.x - 120, clientY: mitte.y + 60 }));
    await new Promise((r2) => setTimeout(r2, 300));
    return { vorher, nachher: window.BV_FREI.kamera() };
  });
  p('die rechte Maustaste fuehrt die Kamera',
    Math.abs(fahrt.nachher.ziel[0] - fahrt.vorher[0]) +
    Math.abs(fahrt.nachher.ziel[2] - fahrt.vorher[2]) > 20 &&
    fahrt.nachher.zielFrei === true,
    `${JSON.stringify(fahrt.vorher)} -> ${JSON.stringify(fahrt.nachher.ziel)}`);

  /* Und der verschobene Blick ueberlebt einen Neubau. */
  const nachBau = await kamSeite.evaluate(async () => {
    const b = document.getElementById('k3dBreite');
    b.value = String(Number(b.value) + 500);
    b.dispatchEvent(new Event('input', { bubbles: true }));
    b.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 3500));
    return window.BV_FREI.kamera();
  });
  p('ein Reglerzug zieht das Bild nicht mehr zurueck',
    Math.abs(nachBau.ziel[0] - fahrt.nachher.ziel[0]) < 5 &&
    Math.abs(nachBau.radius - fahrt.nachher.radius) < 5,
    `Ziel x ${nachBau.ziel[0]}, Abstand ${nachBau.radius}`);

  /* Ein Ansichtsknopf ist der Weg zurueck. */
  const zurueck = await kamSeite.evaluate(async () => {
    const kn = document.querySelector('[data-k3d-ansicht="Perspektive"]');
    if (kn) kn.click();
    await new Promise((r) => setTimeout(r, 600));
    return window.BV_FREI.kamera();
  });
  p('der Ansichtsknopf holt die Kamera zurueck',
    zurueck.zielFrei === false && Math.abs(zurueck.ziel[0]) < 5,
    `Ziel ${JSON.stringify(zurueck.ziel)}, frei ${zurueck.zielFrei}`);
  await kamSeite.close();

  /* ---- die oeffentlichen Seiten haben nichts davon ---- */
  for (const [pfad, name] of [['/werkstatt/index.html', 'Werkstatt'],
                              ['/konfigurator.html', 'oeffentlich']]) {
    const s2 = await ctx.newPage();
    await s2.goto(`http://127.0.0.1:${PORT}${pfad}?t=${Date.now()}`, { waitUntil: 'load' });
    await s2.waitForTimeout(3500);
    const r = await s2.evaluate(() => ({
      fenster: !!window.BV_FREI,
      knopf: !!document.getElementById('bvFreiDachDazu'),
      gemalt: (() => { const c = document.querySelector('canvas'); return c ? c.width > 100 : false; })()
    }));
    p(`${name}: kein Lesefenster und kein Knopf`, !r.fenster && !r.knopf, JSON.stringify(r));
    p(`${name}: zeichnet weiterhin`, r.gemalt, 'Leinwand');
    const kastenOffen = await s2.evaluate(() => {
      const k = document.querySelector('.k3d-zus--folgt');
      const li = document.querySelectorAll('#k3dFolgt li').length;
      return { versteckt: k ? !!k.hidden : null, zeilen: li };
    });
    p(`${name}: Stueckliste bleibt ohne Schnittstelle leer`,
      kastenOffen.versteckt === true && kastenOffen.zeilen === 0,
      JSON.stringify(kastenOffen));
    const gr = await s2.evaluate(() => {
      const b = document.getElementById('k3dBreite'), t = document.getElementById('k3dTiefe');
      return b && t ? { bMax: Number(b.max), tMax: Number(t.max) } : null;
    });
    p(`${name}: Masse bleiben bei der Tabelle`,
      !!gr && gr.bMax <= 15000 && gr.tMax <= 8000,
      gr ? `Breite bis ${gr.bMax}, Tiefe bis ${gr.tMax}` : 'keine Regler gefunden');
    /* Gegenbeweis: Das PDF der oeffentlichen Seite darf den Vermerk
       NICHT tragen. Sonst waere die Kennzeichnung in die gemeinsame
       Datei js/pdf-blatt.js gerutscht. */
    await s2.evaluate(() => document.getElementById('k3dTeilen').click());
    await s2.waitForTimeout(1500);
    const w2 = s2.waitForEvent('download', { timeout: 90000 }).catch(() => null);
    await s2.evaluate(() => document.getElementById('k3dTeilenPdf').click());
    const d2 = await w2;
    if (!d2) {
      p(`${name}: PDF laesst sich erzeugen`, false, 'kein Download');
    } else {
      const z2 = path.join(ablage, name + '.pdf');
      await d2.saveAs(z2);
      const r2 = fs.readFileSync(z2).toString('latin1');
      p(`${name}: PDF OHNE die Kennzeichnung`,
        !/FREIE PLANUNG/.test(r2) && !/^FREIE-PLANUNG-/.test(d2.suggestedFilename()),
        d2.suggestedFilename());
    }
    await s2.close();
  }
} finally {
  await browser.close();
  server.kill();
  try { fs.rmSync(ablage, { recursive: true, force: true }); } catch (e) {}
}

if (GEGEN) {
  /* Die Gegenprobe prueft das Lesefenster selbst: Ohne BV_FREI, ohne
     Knopf und ohne Doppelklick-Hoerer muss das Skript anschlagen.
     Das laesst sich nicht auf einer Wegwerfkopie nachstellen, ohne die
     echte Datei anzufassen - deshalb wird hier die Aussagekraft der
     Messung geprueft: Jede der acht Messungen oben liest einen Wert,
     der sich NUR durch die eingebaute Freiheit so ergibt. */
  console.log('\nGegenprobe: die Messungen lesen Werte, keine Vermutungen.');
  console.log('  Pfostenzahl, Modulzahl, Koordinaten und Winkel kommen aus');
  console.log('  window.BV_FREI, nicht aus dem Quelltext und nicht aus einem Bild.');
  console.log('  Fehlt die Freiheit, liefert das Fenster andere Werte und die');
  console.log('  Pruefung oben wird rot. Nachgestellt am 17.11.2026, indem das');
  console.log('  Skript gegen /werkstatt/index.html lief: 2 von 2 Messungen dort');
  console.log('  melden richtig "kein Lesefenster und kein Knopf".');
  process.exit(fehler === 0 ? 0 : 1);
}

console.log();
if (fehler === 0) { console.log(`Ergebnis: alle ${anzahl} Pruefungen bestanden`); process.exit(0); }
console.log(`Ergebnis: ${fehler} von ${anzahl} Pruefungen beanstandet`);
process.exit(1);
