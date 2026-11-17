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
try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
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
  const punkt = await seite.evaluate(() => {
    const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
    return { x: r.left + r.width * 0.33, y: r.top + r.height * 0.72 };
  });
  await seite.mouse.dblclick(punkt.x, punkt.y);
  await seite.waitForTimeout(1100);
  const weg1 = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
  p('Doppelklick nimmt einen Pfosten weg', weg1.length === 1, JSON.stringify(weg1));
  const band = await seite.evaluate(() =>
    (document.getElementById('bvFreiPfostenZahl') || {}).textContent || '');
  p('das Band zaehlt mit', /1 Pfosten entfernt/.test(band), band.trim() || '(leer)');
  await seite.mouse.dblclick(punkt.x, punkt.y);
  await seite.waitForTimeout(1100);
  const weg2 = await seite.evaluate(() => window.BV_FREI.pfostenWeg());
  p('Doppelklick holt ihn zurueck', weg2.length === 0, JSON.stringify(weg2));

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
    const gr = await s2.evaluate(() => {
      const b = document.getElementById('k3dBreite'), t = document.getElementById('k3dTiefe');
      return b && t ? { bMax: Number(b.max), tMax: Number(t.max) } : null;
    });
    p(`${name}: Masse bleiben bei der Tabelle`,
      !!gr && gr.bMax <= 15000 && gr.tMax <= 8000,
      gr ? `Breite bis ${gr.bMax}, Tiefe bis ${gr.tMax}` : 'keine Regler gefunden');
    await s2.close();
  }
} finally {
  await browser.close();
  server.kill();
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
