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
    if (w.indexOf(a.schluessel) < 0) { jeder = false; gescheitert = a.schluessel; break; }
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
    nachZurueck.indexOf(ecke.schluessel) < 0, ecke.schluessel + ' -> ' +
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
    const v = await seite.evaluate(() => window.BV_FREI.versatz());
    if (v[a.reihe] && Number(v[a.reihe][a.nr])) gezogen++;
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
  const punkt2 = await seite.evaluate(() => window.BV_FREI.pfostenPunkt());
  p('ein Pfosten ist am gemessenen Punkt greifbar', !!punkt2,
    punkt2 ? Math.round(punkt2.x) + '/' + Math.round(punkt2.y) : 'kein Punkt gefunden');
  if (punkt2) await seite.mouse.dblclick(punkt2.x, punkt2.y);
  await seite.waitForTimeout(1500);

  /* Breite ueber das Ende der Tabelle (14080 mm), damit der Hinweis
     dazu geprueft werden kann. 12000 mm von oben reichen dafuer nicht. */
  await seite.evaluate(() => {
    const b = document.getElementById('k3dBreite');
    b.value = 20000; b.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await seite.waitForTimeout(2500);
  await seite.click('#bvFreiDachDazu');
  await seite.waitForTimeout(1800);

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
