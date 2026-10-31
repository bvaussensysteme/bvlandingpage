#!/usr/bin/env node
/* MESSWERKZEUG (keine Prüfung!) – Aussparung im laufenden Modell nachmessen.

   Startet einen Webserver, laedt die Werkstatt in einem echten Browser,
   kapert den Renderer von three.js und liest die gebauten Teile aus:
   Wie viele Scheiben gibt es, wo liegen sie, wie lang sind sie, steht
   der Hausvorsprung an der richtigen Stelle, fehlen Dateien.

   WARUM ES DAS GIBT: Am 31.10.2026 sah die Aussparung im Bild kaputt aus
   ("sieht nicht aus wie auf den bildern"). Durch Lesen des Quelltextes
   war nicht zu klaeren, warum. Die Messung hat in einem Durchgang drei
   Dinge gezeigt, die vorher niemand sah:
     1. Die Scheiben FEHLTEN gar nicht - sie waren korrekt verkuerzt.
     2. Acht Bilder fehlten (Putz, Rasen, Steinplatten, Bodenlogo),
        weil die Werkstatt eine Ebene tiefer liegt.
     3. Es fehlte der Hausvorsprung selbst - ohne ihn ist die Aussparung
        ein Loch im Dach.

   EHRLICH DAZUGESAGT: Das hier ist ein Werkzeug zum Nachsehen, KEINE
   Pruefung im Sinne des Projekts - es hat keine --gegenprobe und faellt
   nicht rot aus. Die Formlogik selbst sichert scripts/pruefe-aussparung.js
   ab. Eine echte Pruefung mit Gegenprobe im Browser steht noch aus und
   ist in docs/NEXT_TASK.md vermerkt.

   Aufruf:  node scripts/miss-aussparung.mjs
   Braucht Playwright: npm i --no-save playwright
*/
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const PORT = 8794;
const server = spawn('python3', ['-m','http.server',String(PORT)], { cwd:'/home/user/bvlandingpage', stdio:'ignore' });
await new Promise(r=>setTimeout(r,900)); process.on('exit',()=>server.kill());
const exe = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath: exe, args:['--no-sandbox','--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const weg = [];
page.on('response', r => { if (r.status() >= 400) weg.push(r.url().split('/').slice(3).join('/')); });
page.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0,160)));

await page.addInitScript(() => {
  function mach(Orig) {
    function Wrapper(...a) {
      const r = new Orig(...a);
      const render = r.render.bind(r);
      r.render = function (s, c) { window.__szene = s; return render(s, c); };
      return r;
    }
    Wrapper.prototype = Orig.prototype;
    return Wrapper;
  }
  function haengAn(ziel) {
    if (!ziel || ziel.__gehaengt) return;
    ziel.__gehaengt = true;
    if (ziel.WebGLRenderer) { ziel.WebGLRenderer = mach(ziel.WebGLRenderer); return; }
    /* three.js legt sein Exportobjekt LEER an und fuellt es danach.
       Deshalb auf die Zuweisung von WebGLRenderer selbst warten. */
    let innen;
    Object.defineProperty(ziel, 'WebGLRenderer', {
      configurable: true,
      get() { return innen; },
      set(R) { innen = mach(R); }
    });
  }
  let echt;
  Object.defineProperty(window, 'THREE', {
    configurable: true,
    get() { return echt; },
    set(v) { echt = v; haengAn(v); }
  });
});

async function messen(abfrage, name) {
  await page.goto(`http://localhost:${PORT}/werkstatt/index.html${abfrage}`, { waitUntil:'load' });
  await page.waitForFunction(() => !!window.__szene, { timeout: 25000 });
  await page.waitForTimeout(2500);
  const d = await page.evaluate(() => {
    const raus = [];
    window.__szene.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const p = o.geometry.parameters || {};
      o.updateWorldMatrix(true, false);
      const v = new window.THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
      raus.push({ typ:o.geometry.type, w:p.width, h:p.height, t:p.depth,
                  x:+v.x.toFixed(1), y:+v.y.toFixed(1), z:+v.z.toFixed(1), dach:!!o.userData.dach });
    });
    return raus;
  });
  const glas = d.filter(m => m.dach && m.typ==='BoxGeometry' && m.h < 3 && m.w > 20);
  const vs = await page.evaluate(() => {
    let g = null;
    window.__szene.traverse(o => {
      if (o.isMesh && o.visible && o.geometry && o.geometry.type === 'BoxGeometry'
          && o.geometry.parameters.width === 1 && o.geometry.parameters.depth === 1) {
        o.updateWorldMatrix(true, false);
        g = { x:+o.position.x.toFixed(1), y:+o.position.y.toFixed(1), z:+o.position.z.toFixed(1),
              b:+o.scale.x.toFixed(1), h:+o.scale.y.toFixed(1), t:+o.scale.z.toFixed(1) };
      }
    });
    return g;
  });
  console.log('   Hausvorsprung:', vs ? `x=${vs.x} z=${vs.z} Breite=${vs.b} Tiefe=${vs.t} Hoehe=${vs.h}` : 'KEINER');
  console.log(`\n--- ${name} ---  Meshes ${d.length}, Dachteile ${d.filter(m=>m.dach).length}, Scheiben ${glas.length}`);
  glas.sort((a,b)=>a.x-b.x).forEach(g => console.log(
    `   x=${String(g.x).padStart(7)}  z=${String(g.z).padStart(6)}  y=${String(g.y).padStart(6)}  B=${g.w?.toFixed(1)}  L=${g.t?.toFixed(1)}`));
  return glas;
}
await messen('', 'Rechteck');
await messen('?form=rechts&ab=2000&at=1000', 'Aussparung rechts  (Luecke x = 50..250)');
console.log('\nFehlende Dateien:', [...new Set(weg)].length ? [...new Set(weg)] : 'keine');
await browser.close(); server.kill();
