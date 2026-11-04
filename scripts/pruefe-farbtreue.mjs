#!/usr/bin/env node
/* Prueft, ob die Farben der Bedienelemente IM BILD so ankommen, wie sie
 * gesetzt sind.
 *
 * ANLASS. Ueber Wochen derselbe Einwand des Betreibers: „die Farbe doch
 * etwas kraeftiger haben, dass man es besser sieht" (01.11.2026), „wir
 * brauchen bessere logos, kraeftige saftige farben" (04.11.2026),
 * „kraeftigere farben und sichtbare raender" (04.11.2026). Beantwortet
 * wurde das jedes Mal mit Gestaltung – groesser, satter, dickere Linien.
 *
 * DIE URSACHE WAR KEINE GESTALTUNGSFRAGE. Gemessen am 04.11.2026 mit der
 * verbauten three.js-Fassung (r128) und den Einstellungen dieses
 * Projekts:
 *
 *     gesetzt #C49A2A  ->  gezeigt #CBBD75     (Gold wurde Sandgrau)
 *     gesetzt #111111  ->  gezeigt #303030     (Schwarz wurde Mittelgrau)
 *
 * Zwei Umrechnungen fehlten: die Farbraum-Angabe an der Textur bzw. an
 * der Farbe, und das Abschalten der Tonwertkorrektur fuer Dinge, die
 * Oberflaeche sind und kein Bauteil. Die Begruendung steht im Quelltext
 * bei rgb() und uiBild() in js/konfigurator-3d.js.
 *
 * ZWEITER, ANDERS GEBAUTER WEG. Diese Pruefung liest keinen Quelltext,
 * um die Farbe zu beurteilen: Sie laedt den Konfigurator im Browser,
 * nimmt das FERTIGE BILD der Leinwand und sucht darin nach dem Gold der
 * Website. Was gezeichnet wurde, ist ihr gleichgueltig – es zaehlt, was
 * auf dem Schirm steht.
 *
 * GEGENPROBE (--gegenprobe): Die beiden Umrechnungen werden einzeln
 * wieder herausgenommen. Jede Pruefung muss in mindestens einem
 * Durchgang rot werden.
 *
 * Aufruf:  node scripts/pruefe-farbtreue.mjs [--gegenprobe]
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGEN = process.argv.includes('--gegenprobe');
const PORT = 8791;

/* Das Gold der Website (--gold in src/css/style.css) und der Wert, der
   vor dem 04.11.2026 stattdessen auf dem Schirm stand. */
const GOLD = [196, 154, 42];        // #C49A2A
const AUSGEWASCHEN = [203, 189, 117];  // #CBBD75, gemessen

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  const l = o[o.length - 1];
  return l ? `${basis}/${l}/chrome-linux/chrome` : undefined;
}

/* Je ein Fehler, den man beim Bauen wirklich macht: eine der beiden
   Umrechnungen vergessen. [ Name, Suchtext, Ersatz ] */
const FEHLER = [
  ['Die Tonwertkorrektur rechnet wieder mit',
   'toneMapped: false', 'toneMapped: true'],
  ['Die Farbraum-Angabe an den Texturen fehlt wieder',
   't.encoding = THREE.sRGBEncoding;\n    return t;\n  }', 'return t;\n  }'],
  ['Die Feldmarke geht nicht mehr durch uiBild()',
   'uiBild(new THREE.CanvasTexture(c))', 'new THREE.CanvasTexture(c)']
];

const QUELLE = readFileSync(new URL('../js/konfigurator-3d.js', import.meta.url), 'utf8');

async function lauf(fehler) {
  const ergebnis = [];
  const p = (name, ok, info = '') => {
    ergebnis.push([name, ok]);
    if (!fehler) console.log((ok ? '  ok      ' : '  FEHLER  ') + name.padEnd(52) + info);
  };

  const browser = await chromium.launch({
    timeout: 60000, executablePath: chromiumPfad(),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  if (fehler) {
    await page.route('**/konfigurator-3d.js*', async (r) => {
      const a = await r.fetch();
      let t = await a.text();
      if (!t.includes(fehler[1])) { await r.fulfill({ response: a }); return; }
      t = t.split(fehler[1]).join(fehler[2]);
      await r.fulfill({ response: a, body: t });
    });
  }

  await page.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  /* ---------- Das fertige Bild auszaehlen ---------- */
  const m = await page.evaluate(([gold, alt]) => {
    const c = document.querySelector('canvas');
    if (!c || !c.width) return null;
    const o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    const g = o.getContext('2d');
    g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, o.width, o.height).data;
    let nahGold = 0, nahAlt = 0, bestGold = 999, dunkelste = 255;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 250) continue;
      const dg = Math.abs(d[i] - gold[0]) + Math.abs(d[i + 1] - gold[1]) + Math.abs(d[i + 2] - gold[2]);
      const da = Math.abs(d[i] - alt[0]) + Math.abs(d[i + 1] - alt[1]) + Math.abs(d[i + 2] - alt[2]);
      if (dg < bestGold) bestGold = dg;
      if (dg <= 6) nahGold++;
      if (da <= 12) nahAlt++;
      const hell = Math.max(d[i], d[i + 1], d[i + 2]);
      if (hell < dunkelste) dunkelste = hell;
    }
    return { nahGold, nahAlt, bestGold, dunkelste, flaeche: o.width * o.height };
  }, [GOLD, AUSGEWASCHEN]);

  if (!m) {
    p('Die Buehne zeichnet ein Bild', false, 'keine Leinwand mit Inhalt');
    await browser.close();
    return ergebnis;
  }

  p('Das Gold der Website steht unveraendert auf der Buehne',
    m.nahGold >= 100,
    `${m.nahGold} Bildpunkte auf #C49A2A, naechster Abstand ${m.bestGold}`);

  p('Kein ausgewaschenes Gold mehr im Bild',
    m.nahAlt === 0,
    `${m.nahAlt} Bildpunkte bei #CBBD75 (dem Wert von vor der Behebung)`);

  /* ---------- Die Regel selbst, am Quelltext ----------
     Nicht als Ersatz fuer die Messung oben, sondern damit ein NEUES
     Bedienelement im Bild nicht stillschweigend ohne die beiden
     Umrechnungen gebaut wird. */
  const q = fehler ? QUELLE.split(fehler[1]).join(fehler[2]) : QUELLE;
  const nUi = (q.match(/uiBild\(/g) || []).length;
  const nTon = (q.match(/toneMapped: false/g) || []).length;
  p('Jedes Bedienelement im Bild traegt beide Umrechnungen',
    /function uiBild\(t\) \{\s*t\.encoding = THREE\.sRGBEncoding;/.test(q) &&
    nUi >= 7 && nTon >= 7 &&
    !/MeshBasicMaterial\(\{ color: 0x/.test(q),
    `uiBild ${nUi}x, toneMapped:false ${nTon}x`);

  await browser.close();
  return ergebnis;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

if (!GEGEN) {
  const e = await lauf(null);
  const schlecht = e.filter(([, ok]) => !ok).length;
  console.log(`\nErgebnis: ${e.length - schlecht} bestanden, ${schlecht} nicht bestanden`);
  server.kill();
  process.exit(schlecht ? 1 : 0);
} else {
  const gut = await lauf(null);
  const offen = new Set(gut.filter(([, ok]) => ok).map(([n]) => n));
  if (gut.some(([, ok]) => !ok)) {
    console.log('ABBRUCH: Der normale Lauf ist nicht gruen – Gegenprobe sinnlos.');
    server.kill(); process.exit(1);
  }
  for (const f of FEHLER) {
    const e = await lauf(f);
    const rot = e.filter(([, ok]) => !ok).map(([n]) => n);
    if (!rot.length) {
      console.log(`FEHLER: Eingebauter Fehler "${f[0]}" bleibt unbemerkt.`);
      server.kill(); process.exit(1);
    }
    console.log(`  Fehler "${f[0]}": ${rot.length} Pruefung(en) schlagen an`);
    rot.forEach((n) => offen.delete(n));
  }
  if (offen.size) {
    console.log('FEHLER: Diese Pruefungen wurden von keinem Fehler rot:');
    offen.forEach((n) => console.log('   ' + n));
    server.kill(); process.exit(1);
  }
  console.log('\nGegenprobe in Ordnung: jede Pruefung schlaegt an.');
  server.kill(); process.exit(0);
}
