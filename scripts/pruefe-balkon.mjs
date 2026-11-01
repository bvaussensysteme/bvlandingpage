#!/usr/bin/env node
/* Prueft die Balkonueberdachung – am echten Modell im Browser.
 *
 * ANLASS. „Ich möchte noch eine Option und zwar, Balkonüberdachungen …
 * geht die tiefe nur bis zum geländer oder baut man wie auf dem foto auf
 * die mauer vorne" (Betreiber, 25.10.2026, mit zwei Zeichnungen).
 *
 * WARUM IM BROWSER UND NICHT AM QUELLTEXT: Ob ein Pfosten wirklich auf
 * der Bruestung steht, steht in keiner Zeile Code – es ergibt sich aus
 * Bruestungshoehe, Pfostenachse, Dachtiefe und Dachvorsprung zusammen.
 * Deshalb wird hier das fertige Modell vermessen: ECKPUNKTE der Koerper
 * in Weltkoordinaten, nicht achsparallele Huellquader (die luegen bei
 * geneigten Teilen) und nicht die Eingabefelder.
 *
 * Aufruf:  node scripts/pruefe-balkon.mjs [--gegenprobe]
 *
 * --gegenprobe baut den Fehler ein, der hier am ehesten passiert: Der
 * Pfostenfuss wird auf den Boden gesetzt statt auf die Bruestung. Dann
 * MUESSEN die Pruefungen anschlagen, sonst pruefen sie nichts.
 */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8243;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const ordner = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const letzter = ordner[ordner.length - 1];
  return letzter ? `${basis}/${letzter}/chrome-linux/chrome` : undefined;
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
  if (!ok) { fehler++; gefallen.push(titel); console.log('  FEHLER  ' + titel.padEnd(52) + (info || '')); }
  else console.log('  ok      ' + titel.padEnd(52) + (info || ''));
}

/* WAS DIE GEGENPROBE ABDECKT – und was nicht. Der eingebaute Fehler
   (Pfostenfuss ignoriert die Bruestung, Bruestung wird nicht gebaut)
   kann nicht ALLE Pruefungen zum Anschlagen bringen; ein Hinweistext
   verschwindet davon nicht. Deshalb steht hier namentlich, welche drei
   anschlagen MUESSEN. Eine Gegenprobe, die nur „irgendetwas ist rot"
   verlangt, bestuende auch dann, wenn der Fehler ganz woanders auffiele. */
const GEGEN_ERWARTET = [
  'Auf der Brüstung: der Pfosten beginnt oben auf der Mauer',
  'Die Brüstung steht im Modell',
  'Der Pfosten steht hinter der Brüstung, nicht in ihr',
  'Ohne Vorsprung endet das Dach an der Innenkante der Brüstung'
];

const browser = await chromium.launch({
  timeout: 60000, executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const konsole = [];
seite.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
seite.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));

/* Die Szene ist nicht nach aussen gereicht. Sie wird beim Bau des
   Renderers eingefangen – render ist eine EIGENE Eigenschaft der
   Instanz, ein Patch am Prototyp liefe ins Leere. */
await seite.route('**/konfigurator-3d.js*', async (r) => {
  const a = await r.fetch();
  let t = await a.text();
  t = 'window.__BV = {};\n' +
      '(function(){var O=THREE.WebGLRenderer;THREE.WebGLRenderer=function(o){' +
      'var r=new O(o);var alt=r.render.bind(r);' +
      'r.render=function(s,k){window.__BV.szene=s;window.__BV.kamera=k;return alt(s,k);};' +
      'return r;};THREE.WebGLRenderer.prototype=O.prototype;})();\n' + t;
  if (GEGENPROBE) {
    /* Der Fehler, der hier am naechsten liegt: Pfostenfuss ignoriert die
       Bruestung. Genau das soll auffallen. */
    t = t.replace('var pfFuss = pfostenAufBruestung() ? brH : 0;',
                  'var pfFuss = 0;');
    t = t.replace('bruestungBauen(B, brAussen, brH, brD, Z.bruestung);', '');
    /* Der zweite eingebaute Fehler: das Dach deckt die Bruestung IMMER
       mit ab, auch wenn die Pfosten dahinter stehen – genau der Zustand,
       den der Betreiber am 26.10.2026 beanstandet hat. */
    t = t.replace('var dachDecktBruestung = pfostenAufBruestung();',
                  'var dachDecktBruestung = true;');
  }
  await r.fulfill({ response: a, body: t,
                    headers: { ...a.headers(), 'content-type': 'application/javascript' } });
});

await seite.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'load' });
await seite.waitForTimeout(3000);

/* ---------- Auf die Balkonueberdachung umschalten ---------- */
async function setzen(id, wert) {
  await seite.evaluate(([i, w]) => {
    const el = document.getElementById(i);
    if (!el) return;
    el.value = w;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [id, wert]);
  await seite.waitForTimeout(700);
}
/* Umgeschaltet wird ueber das versteckte Feld, nicht ueber den Knopf:
   Auf der Startansicht liegt der Einstiegs-Hinweis ueber der Leiste und
   faengt den Klick ab. Das Feld ist der Weg, den der Knopf selbst geht. */
await setzen('k3dProdukt', 'Balkonüberdachung');
await seite.waitForTimeout(1200);

const produkt = await seite.evaluate(() => document.getElementById('k3dProdukt').value);
pruefe('Das Produkt lässt sich wählen', produkt === 'Balkonüberdachung', produkt);

/* ---------- Messen: Eckpunkte in Weltkoordinaten ---------- */
async function messen() {
  return seite.evaluate(() => {
    const s = window.__BV.szene;
    if (!s) return null;
    const teile = [];
    s.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes ||
          !o.geometry.attributes.position) return;
      /* DIE BEMASSUNG IST KEIN BAUTEIL. Sie haengt in derselben Szene,
         und seit dem 01.11.2026 enden die Masslinien in Pfeilspitzen.
         GEMESSEN: Die Spitze des Hoehenmasses (Radius 1,8 cm) reichte
         bis z = 131,8 cm und wurde als Dachkante gezaehlt - die liegt
         bei 130,0 cm. Markiert wird in masseZeichnen(). */
      if (o.userData && o.userData.mass) return;
      o.updateWorldMatrix(true, false);
      const p = o.geometry.attributes.position;
      const v = new THREE.Vector3();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
        z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z);
      }
      teile.push({ x0, x1, y0, y1, z0, z1,
                   bx: x1 - x0, by: y1 - y0, bz: z1 - z0, sichtbar: o.visible });
    });
    return teile;
  });
}

/* Ein Pfosten ist ein schlanker, hoher Koerper von 11 x 11 cm. */
function pfosten(teile) {
  return teile.filter((t) => t.sichtbar && t.by > 30 &&
                             Math.abs(t.bx - 11) < 2 && Math.abs(t.bz - 11) < 2);
}

{
  const teile = await messen();
  pruefe('Das Modell wird gebaut', !!teile && teile.length > 20,
         teile ? teile.length + ' Körper' : 'keine Szene');

  const pf = pfosten(teile);
  pruefe('Es stehen Pfosten im Modell', pf.length >= 2, pf.length + ' Pfosten');

  /* Voreinstellung: Mauer 1000 mm, Pfosten AUF der Brüstung.
     Der Pfostenfuß muss dann auf 100 cm liegen, nicht auf 0. */
  const tiefste = Math.min.apply(null, pf.map((p) => p.y0));
  pruefe('Auf der Brüstung: der Pfosten beginnt oben auf der Mauer',
         Math.abs(tiefste - 100) < 3,
         'Pfostenfuß bei ' + tiefste.toFixed(1) + ' cm (erwartet 100)');

  /* Die Brüstung selbst: ein breiter, flacher Körper vorne, 100 cm hoch. */
  /* Die Brüstung ist breit, steht VORNE (z deutlich positiv) und hört
     bei gut einem Meter auf. Ohne die beiden letzten Bedingungen fängt
     der Filter die Hauswand mit ein – sie ist auch breit und fängt auch
     am Boden an. Genau das ist beim ersten Lauf passiert. */
  const br = teile.filter((t) => t.sichtbar && t.bx > 100 &&
                                 t.y0 < 5 && t.y1 > 80 && t.y1 < 160 &&
                                 t.bz < 30 && t.z0 > 50);
  pruefe('Die Brüstung steht im Modell',
         br.length >= 1,
         br.length ? 'Oberkante ' + Math.max.apply(null, br.map((b) => b.y1)).toFixed(1) + ' cm'
                   : 'nicht gefunden');

  /* Das Dach muss über die Brüstung hinausreichen – sonst tropft die
     Rinne auf die Brüstung. Gemessen am vordersten Punkt überhaupt
     gegenüber der Außenkante der Brüstung. */
  const brVorne = br.length ? Math.max.apply(null, br.map((b) => b.z1)) : 0;
  const dachVorne = Math.max.apply(null, teile.filter((t) => t.sichtbar && t.y1 > 150)
                                              .map((t) => t.z1));
  pruefe('Das Dach reicht bis zur Außenkante der Brüstung',
         dachVorne >= brVorne - 1,
         'Dach bis ' + dachVorne.toFixed(1) + ' cm, Brüstung bis ' + brVorne.toFixed(1));
}

/* ---------- Pfosten dahinter auf dem Boden ---------- */
await setzen('k3dPfostenAuf', 'Boden');
{
  const teile = await messen();
  const pf = pfosten(teile);
  const tiefste = Math.min.apply(null, pf.map((p) => p.y0));
  pruefe('Auf dem Boden: der Pfosten beginnt am Balkonboden',
         Math.abs(tiefste) < 3,
         'Pfostenfuß bei ' + tiefste.toFixed(1) + ' cm (erwartet 0)');

  const br = teile.filter((t) => t.sichtbar && t.bx > 100 &&
                                 t.y0 < 5 && t.y1 > 80 && t.y1 < 160 &&
                                 t.bz < 30 && t.z0 > 50);
  const brInnen = br.length ? Math.min.apply(null, br.map((b) => b.z0)) : 1e9;
  const pfVorne = Math.max.apply(null, pf.map((p) => p.z1));
  /* br.length gehoert ins Kriterium: Fehlt die Bruestung ganz, waere
     brInnen unendlich und der Vergleich immer wahr – die Pruefung
     bestuende dann ausgerechnet in dem Fall, den sie finden soll. Genau
     das hat die Gegenprobe am 25.10.2026 aufgedeckt. */
  pruefe('Der Pfosten steht hinter der Brüstung, nicht in ihr',
         br.length >= 1 && pfVorne <= brInnen + 0.6,
         br.length ? 'Pfostenkante ' + pfVorne.toFixed(1) + ' cm, Brüstung innen ' +
                     brInnen.toFixed(1)
                   : 'keine Brüstung gefunden – nichts, wovor der Pfosten stehen könnte');

  /* ---------- Die Rinne wandert mit ----------
     „wenn man hinter der brüstung auswählt, wandert die rinne nicht mit
     den pfosten" (Betreiber, 26.10.2026, mit Bildschirmfoto). Die Rinne
     stand 26 cm vor dem vordersten Pfosten in der Luft. Gemessen wird
     der vorderste Punkt des DACHES gegen die Vorderkante der Pfosten –
     ohne Dachvorsprung müssen sie zusammenfallen, so wie bei jedem
     anderen Produkt auch. */
  const dachVorne2 = Math.max.apply(null, teile.filter((t) => t.sichtbar && t.y1 > 150)
                                               .map((t) => t.z1));
  /* Gemessen wird gegen die INNENKANTE der Brüstung, nicht gegen die
     Pfostenvorderkante: Die TDS-Rinne steht konstruktiv rund 7 cm über
     den Pfosten über (RINNE.breite - PF, belegt in der Maßtabelle). Was
     der Betreiber beanstandet hat, war der Sprung über die ganze
     Brüstung – und genau das misst diese Zeile. */
  pruefe('Ohne Vorsprung endet das Dach an der Innenkante der Brüstung',
         br.length >= 1 && Math.abs(dachVorne2 - brInnen) < 1.5,
         'Dach bis ' + dachVorne2.toFixed(1) + ' cm, Brüstung innen ' +
         (br.length ? brInnen.toFixed(1) : 'nicht gefunden'));

  /* Und der Kunde muss erfahren, was das fürs Wasser bedeutet. */
  const hinw = await seite.evaluate(() => {
    const el = document.getElementById('k3dBalkonHinweis');
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  });
  pruefe('Der Hinweis nennt den fehlenden Dachvorsprung',
         !!hinw && /\d+ mm mehr Dachvorsprung/.test(hinw),
         hinw ? hinw.slice(0, 54) + '…' : 'fehlt');
}

/* Bild des beanstandeten Falls, zum Gegenlesen durch den Betreiber. */
await seite.evaluate(() => {
  document.querySelectorAll('.k3d-hinw, [class*="cookie"]').forEach((el) => el.remove());
});
{
  const b = await seite.$('#k3dBuehne, .k3d-buehne, canvas');
  if (b) await b.screenshot({ path: 'pruefbilder/balkon-pfosten-dahinter.png' });
}

/* ---------- Geländer statt Mauer ---------- */
await setzen('k3dBruestung', 'Geländer');
{
  const sichtbar = await seite.evaluate(() => {
    const g = document.querySelector('[data-k3d-fuer="balkon-mauer"]');
    return g ? !g.hidden : null;
  });
  pruefe('Beim Geländer verschwindet die Pfosten-Auswahl',
         sichtbar === false, 'sichtbar: ' + sichtbar);

  const teile = await messen();
  const pf = pfosten(teile);
  const tiefste = Math.min.apply(null, pf.map((p) => p.y0));
  pruefe('Am Geländer stehen die Pfosten immer auf dem Boden',
         Math.abs(tiefste) < 3, 'Pfostenfuß bei ' + tiefste.toFixed(1) + ' cm');
}

/* ---------- Was beim Balkon nicht gefragt werden darf ---------- */
{
  const aufbau = await seite.evaluate(() => {
    const g = document.querySelector('[data-k3d-fuer="aufbau"]');
    return { versteckt: g ? g.hidden : null,
             wert: document.getElementById('k3dAufbau').value };
  });
  pruefe('„Freistehend" wird beim Balkon nicht angeboten',
         aufbau.versteckt === true, 'Feld versteckt: ' + aufbau.versteckt);

  const hinweis = await seite.evaluate(() => {
    const g = document.querySelector('.k3d-notiz[data-k3d-fuer="balkon"]');
    return g && !g.hidden ? g.textContent.replace(/\s+/g, ' ').trim() : null;
  });
  pruefe('Der Hinweis zum Baurecht steht da',
         !!hinweis && /ebenerdige/.test(hinweis) && /Bauamt/.test(hinweis),
         hinweis ? hinweis.slice(0, 48) + '…' : 'fehlt');
}

/* ---------- Die Anfrage nennt, was den Balkon ausmacht ---------- */
{
  await setzen('k3dBruestung', 'Mauer');
  await setzen('k3dPfostenAuf', 'Brüstung');
  const kurz = await seite.evaluate(() =>
    (document.getElementById('k3dSumProduktName') || {}).textContent || '');
  pruefe('Brüstung und Pfostenlage stehen in der Kurzfassung',
         /Brüstung/.test(kurz) && /Pfosten auf der Brüstung/.test(kurz),
         kurz.replace(/\s+/g, ' ').slice(0, 60));
}

/* ---------- Keine Fehler in der Konsole ---------- */
/* /api/bauteile beantwortet der lokale Dateiserver nicht – das ist kein
   Fehler des Konfigurators, sondern der Normalfall ohne Worker (und
   derselbe Zustand wie live, solange der KV-Namensraum fehlt). Gezaehlt
   wird deshalb alles ausser fehlgeschlagenen Ladevorgaengen. */
const echteFehler = konsole.filter((z) => !/Failed to load resource/.test(z));
pruefe('Keine Javascript-Fehler beim Umschalten',
       echteFehler.length === 0,
       echteFehler.length ? echteFehler[0].slice(0, 60) : 'Konsole still');

/* ---------- Bild zum Gegenlesen ----------
   Ohne die beiden Einblendungen (Testhinweis, Cookie-Banner) – sie
   verdecken genau das, was auf dem Bild zu sehen sein soll. Das Bild
   ist kein Pruefmittel, sondern die Vorlage fuer den Betreiber. */
await seite.evaluate(() => {
  ['k3dTestHinweis', 'cookie-banner', 'cookieBanner'].forEach((i) => {
    const el = document.getElementById(i);
    if (el) el.remove();
  });
  document.querySelectorAll('.k3d-hinw, .cookie, [class*="cookie"]').forEach((el) => el.remove());
});
await seite.waitForTimeout(400);
const buehne = await seite.$('#k3dBuehne, .k3d-buehne, canvas');
if (buehne) await buehne.screenshot({ path: 'pruefbilder/balkon.png' });
else await seite.screenshot({ path: 'pruefbilder/balkon.png' });

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
  console.log('  alle drei erwarteten Prüfungen haben angeschlagen');
  console.log('\nGegenprobe: bestanden');
  process.exit(0);
}
console.log('\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden'
                                      : 'alle ' + geprueft + ' Prüfungen bestanden'));
process.exit(fehler ? 1 : 0);
