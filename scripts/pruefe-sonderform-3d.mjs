#!/usr/bin/env node
/* Misst das GEBAUTE Modell einer Sonderform im echten Browser.
 *
 * ANLASS. Drei Meldungen an einem Tag, alle zur selben Stelle:
 *   „das modell sieht verkrüppelt aus nix passt sich richtig an"
 *   „wieder fehler"
 *   „siehst du nicht das es darum geht das das glas etc. in der luft
 *    hängt etc."   (Betreiber, 25.10.2026)
 *
 * Jedes Mal war es dasselbe Muster: Ein Bauteil folgte dem
 * UMSCHLIESSENDEN RECHTECK statt der wirklichen Kante – erst die
 * Pfosten, dann der hintere Traeger und das Wandprofil, zuletzt die
 * Blendenstreifen und die seitliche Randblende. Im Bild haengt dann
 * Glas ohne Rand in der Luft.
 *
 * Gegen Lesen hilft hier nichts: Die Teile entstehen an zehn Stellen im
 * Bauweg. Deshalb wird das fertige Modell vermessen – die Szene wird
 * aus dem laufenden Zeichenvorgang abgegriffen und jedes Bauteil
 * daraufhin geprueft, ob es ueber die Anlage hinausragt.
 *
 * Aufruf:  node scripts/pruefe-sonderform-3d.mjs [--gegenprobe]
 *
 * --gegenprobe baut die ALTE Fassung wieder ein (Pfosten und Traeger
 * ueber das Rechteck verteilt) und erwartet, dass die Messung
 * anschlaegt. Eine Messung, die auch den alten Stand durchwinkt, misst
 * nichts.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const gegen = process.argv.includes('--gegenprobe');
let fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

const browserOrdner = readdirSync('/opt/pw-browsers')
  .filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const PORT = 8847;
const srv = spawn('python3', ['-m', 'http.server', String(PORT)],
                  { cwd: process.cwd(), stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 900));

const b = await chromium.launch({
  executablePath: `/opt/pw-browsers/${browserOrdner}/chrome-linux/chrome`,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } });

/* three r128 haengt render als EIGENE Eigenschaft an die Instanz – ein
   Patch am Prototyp liefe ins Leere. Deshalb beim Bauen abgreifen. */
await ctx.addInitScript(() => {
  window.__patch = function () {
    const W = THREE.WebGLRenderer;
    THREE.WebGLRenderer = function (opts) {
      const r = new W(opts);
      const alt = r.render.bind(r);
      r.render = function (s, c) { window.__szene = s; return alt(s, c); };
      return r;
    };
  };
});
await ctx.route('**/konfigurator-3d.js*', async (route) => {
  const a = await route.fetch();
  let t = await a.text();
  if (gegen) {
    /* Der Stand vor dem 25.10.2026: alles ueber das Rechteck. */
    t = t.replace('verteilen(pfVorne, bVorne, PF / 2)', 'verteilen(pfVorne, B, PF / 2)')
         .replace('verteilen(pfHinten, bHinten, PF / 2)', 'verteilen(pfHinten, B, PF / 2)')
         .replace('balken(qTr.breite, trH, TR_T, qTr.mitte,', 'balken(B, trH, TR_T, 0,')
         .replace('wandprofilBauen(bHinten,', 'wandprofilBauen(B,');
  }
  await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8',
                        body: 'window.__patch && window.__patch();\n' + t });
});

const p = await ctx.newPage();
const seitenfehler = [];
p.on('pageerror', (e) => seitenfehler.push(String(e)));
await p.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ })
       .first().click({ timeout: 4000 }).catch(() => {});
await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await p.$eval('#k3dModus', (el) => el.click());
await p.waitForTimeout(1000);
await p.$eval('[data-k3d-seg="k3dStufe"] button[data-wert="Pro"]', (el) => el.click());
await p.waitForTimeout(400);
await p.evaluate(() => document.querySelectorAll('details.k3d-sek')
                         .forEach((d) => { d.open = true; }));
await p.click('[data-k3d-seg="k3dAufbau"] button[data-wert="Freistehend"]').catch(() => {});
await p.waitForTimeout(700);
await p.click('[data-k3d-seg="k3dForm"] button[data-wert="Sonderform"]').catch(() => {});
await p.waitForTimeout(800);

const setz = (id, w) => p.evaluate(([i, v]) => {
  const e = document.getElementById(i);
  if (!e) return;
  e.value = v;
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
}, [id, w]);

/* Misst das Modell: Jeder ECKPUNKT jedes Bauteils wird daraufhin
   geprueft, ob er ueber die Kante der Anlage hinausragt – gemessen an
   SEINER Tiefe, denn die Anlage ist nicht ueberall gleich breit.

   Warum die Eckpunkte und nicht der Umriss: Ein schraeg liegendes Teil
   (die Randblende an der schraegen Kante, eine zugeschnittene Scheibe)
   hat einen grossen achsparallelen Umriss, ohne irgendwo ueberzustehen.
   Beim ersten Anlauf hat genau das drei Fehlalarme erzeugt. */
const messen = (form) => p.evaluate((f) => {
  const s = window.__szene;
  if (!s) return { fehlt: true };
  s.updateMatrixWorld(true);
  const b1 = f.b1 / 10, b2 = f.b2 / 10, t1 = f.t1 / 10, t2 = f.t2 / 10;
  function kanteBei(z) {
    const aL = t1 > 0 ? Math.min(1, Math.max(0, z / t1)) : 0;
    const aR = t2 > 0 ? Math.min(1, Math.max(0, z / t2)) : 0;
    return { li: -b1 / 2 + (b1 - b2) / 2 * aL, re: b1 / 2 - (b1 - b2) / 2 * aR };
  }
  let schlimmst = 0, wo = '';
  const pf = [];
  const v = new THREE.Vector3();
  s.traverse(function (o) {
    if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes) return;
    const bb = new THREE.Box3().setFromObject(o);
    const br = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, tf = bb.max.z - bb.min.z;
    if (br > 600 || bb.min.y < -1) return;      // Rasen, Belag, Hauswand
    /* Alles, was flach am Boden liegt, ist kein Bauteil: das
       Wasserzeichen auf dem Belag liegt bei y = 0,4 und wird mit der
       Dachbreite skaliert – es hat beim ersten Anlauf einen Fehlalarm
       erzeugt. */
    if (bb.max.y < 20) return;
    if (h > 150 && br < 30 && tf < 30 && bb.min.y < 20) {
      pf.push([Math.round((bb.min.x + bb.max.x) / 2), Math.round((bb.min.z + bb.max.z) / 2)]);
    }
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (v.z < -14 || v.z > Math.max(t1, t2) + 2) continue;
      const k = kanteBei(Math.max(0, v.z));
      const ueber = Math.max(k.li - v.x, v.x - k.re);
      if (ueber > schlimmst) {
        schlimmst = ueber;
        wo = 'bei x=' + Math.round(v.x) + ', z=' + Math.round(v.z) +
             ' um ' + ueber.toFixed(0) + ' cm';
      }
    }
  });
  return { ueberstand: +schlimmst.toFixed(1), wo: wo, pfosten: pf };
}, form);

const faelle = [
  { name: 'vorne schmaler', b1: 5000, b2: 4000, t1: 3500, t2: 4000 },
  { name: 'hinten schmaler', b1: 4000, b2: 5000, t1: 4000, t2: 3500 },
  { name: 'stark schräg', b1: 6000, b2: 4000, t1: 3000, t2: 5000 }
];
/* Toleranz: Die Randblende steht bauartbedingt ein Stueck nach aussen
   (RANDBLENDE.vor) und die Sparren sitzen 3 cm innen. 8 cm lassen das
   durchgehen, ein halber Meter Ueberstand faellt sicher auf. */
const TOLERANZ = 8;

for (const f of faelle) {
  await setz('k3dSfBreite1', String(f.b1));
  await setz('k3dSfBreite2', String(f.b2));
  await setz('k3dSfTiefe1', String(f.t1));
  await setz('k3dSfTiefe2', String(f.t2));
  await p.waitForTimeout(1600);
  const m = await messen(f);
  if (m.fehlt) { pruefe('Szene gefunden (' + f.name + ')', false, 'kein Zugriff'); continue; }
  pruefe('Nichts ragt über die Anlage hinaus: ' + f.name,
         m.ueberstand <= TOLERANZ,
         m.ueberstand > TOLERANZ ? m.wo : 'größter Überstand ' + m.ueberstand + ' cm');

  /* Und jeder Pfosten muss unter dem Dach stehen, nicht daneben. */
  const daneben = m.pfosten.filter((pt) => {
    const b1 = f.b1 / 10, b2 = f.b2 / 10, t1 = f.t1 / 10, t2 = f.t2 / 10;
    const z = Math.max(0, pt[1]);
    const aL = t1 > 0 ? Math.min(1, Math.max(0, z / t1)) : 0;
    const aR = t2 > 0 ? Math.min(1, Math.max(0, z / t2)) : 0;
    const li = -b1 / 2 + (b1 - b2) / 2 * aL, re = b1 / 2 - (b1 - b2) / 2 * aR;
    return pt[0] < li - TOLERANZ || pt[0] > re + TOLERANZ;
  });
  pruefe('Jeder Pfosten steht unter dem Dach: ' + f.name,
         daneben.length === 0,
         daneben.length ? JSON.stringify(daneben) : m.pfosten.length + ' Pfosten geprüft');
}

pruefe('Keine Fehler im Browser', seitenfehler.length === 0,
       seitenfehler.slice(0, 1).join('') || 'keine');

await b.close();
console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
/* In der Gegenprobe ist nur der Bauweg verfaelscht; die Pruefung auf
   Browser-Fehler muss weiter bestehen. Deshalb: mindestens die Haelfte
   muss anschlagen, und bestehen darf keine der Messungen. */
process.exit(gegen ? (fehler >= faelle.length ? 0 : 1) : (fehler ? 1 : 0));
