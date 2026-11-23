/* Misst die Farbe jedes Musterausschnitts aus dem Bild selbst.
 * Kein Raten: Gelesen werden die Bildpunkte, nicht der Dateiname. */
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const chromeIn = (o) => ['/chrome-linux/chrome', '/chrome-linux64/chrome', '/chrome']
  .map((w) => o + w).find(existsSync);
const basis = '/opt/pw-browsers';
const ordner = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
const WURZEL = '/home/user/bvlandingpage/';

const dessins = readFileSync(WURZEL + 'scripts/stoff-reihenfolge.txt', 'utf8')
  .split('\n').map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));

const srv = spawn('python3', ['-m', 'http.server', '8969'], { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const br = await chromium.launch({ executablePath: chromeIn(basis + '/' + ordner[ordner.length - 1]),
  args: ['--no-sandbox'] });
const c = await br.newContext({ viewport: { width: 400, height: 300 } });
const s = await c.newPage();
await s.goto('http://127.0.0.1:8969/index.html', { waitUntil: 'domcontentloaded' });

const werte = await s.evaluate(async (liste) => {
  const lese = (pfad) => new Promise((fertig) => {
    const bild = new Image();
    bild.onload = () => {
      const k = document.createElement('canvas');
      k.width = 64; k.height = 64;
      const ctx = k.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bild, 0, 0, 64, 64);
      const p = ctx.getImageData(0, 0, 64, 64).data;
      /* Haeufigste Farbe, auf 16er-Stufen gerundet: Bei einem Muster
       * mit Streifen ist der Mittelwert ein Grau, das es gar nicht
       * gibt. Die haeufigste Farbe ist die, die man sieht. */
      const topf = new Map();
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i + 3] < 128) continue;
        const r = p[i], g = p[i + 1], b = p[i + 2];
        sr += r; sg += g; sb += b; n++;
        const key = `${r >> 4}_${g >> 4}_${b >> 4}`;
        topf.set(key, (topf.get(key) || 0) + 1);
      }
      if (!n) { fertig(null); return; }
      let bestKey = null, best = 0;
      for (const [k2, v] of topf) if (v > best) { best = v; bestKey = k2; }
      const [hr, hg, hb] = bestKey.split('_').map((x) => (+x) * 16 + 8);
      const mittel = [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
      /* Streuung: Wie weit liegt der Mittelwert von der haeufigsten
       * Farbe weg? Viel Abstand heisst gemustert oder meliert. */
      const streuung = Math.round(Math.sqrt(
        (mittel[0] - hr) ** 2 + (mittel[1] - hg) ** 2 + (mittel[2] - hb) ** 2));
      const anteil = Math.round((best / n) * 100);
      fertig({ haeufig: [hr, hg, hb], mittel, streuung, anteil });
    };
    bild.onerror = () => fertig(null);
    bild.src = pfad;
  });
  const aus = [];
  for (const d of liste) {
    aus.push({ d, ...(await lese('/images/stoffe/startseite/' + d + '.webp') || { fehlt: true }) });
  }
  return aus;
}, dessins);

function wort(r, g, b) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    if (max === rr) h = 60 * (((gg - bb) / d) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
    if (h < 0) h += 360;
  }
  /* 1. Fast ohne Farbe: reine Grauwerte. */
  if (sat < 0.10) {
    if (l > 0.88) return 'Weiß';
    if (l > 0.66) return 'Hellgrau';
    if (l > 0.36) return 'Grau';
    return 'Anthrazit';
  }
  /* 2. Gedeckt, also wenig Farbe im Grau. Das ist der groesste Teil
   *    dieser Kollektion, und hier hat die erste Fassung danebengelegen:
   *    Sie nannte ein helles Taupe "Terracotta". */
  if (sat < 0.28) {
    if (h >= 16 && h < 70) {
      if (l > 0.86) return 'Creme';
      if (l > 0.68) return 'Beige';
      if (l > 0.44) return 'Taupe';
      return 'Graubraun';
    }
    if (h >= 70 && h < 175) return l > 0.66 ? 'Hellgraugrün' : 'Graugrün';
    if (h >= 175 && h < 265) return l > 0.66 ? 'Hellgraublau' : 'Graublau';
    if (l > 0.80) return 'Rosé';
    return l > 0.55 ? 'Altrosa' : 'Grau';
  }
  /* 3. Kraeftige Farben. */
  if (h < 16 || h >= 345) return l > 0.66 ? 'Altrosa' : 'Rot';
  if (h < 45) {
    /* Ab 38 Grad wird aus dem Orange ein Gold: AC421 (#F8C858) ist
     * ein goldenes Gelb, kein Orange. */
    if (h >= 38 && l > 0.58) return 'Goldgelb';
    if (sat > 0.70 && l <= 0.66) return 'Orange';
    if (l > 0.76) return 'Sand';
    if (l > 0.52) return 'Terracotta';
    return 'Rostrot';
  }
  if (h < 66) return l > 0.72 ? 'Hellgelb' : 'Gelb';
  if (h < 95) return l > 0.58 ? 'Hellgrün' : 'Olivgrün';
  if (h < 160) return l > 0.58 ? 'Hellgrün' : 'Grün';
  if (h < 195) return l < 0.30 ? 'Dunkelgrün' : 'Türkis';
  if (h < 245) return l > 0.66 ? 'Hellblau' : (l > 0.38 ? 'Blau' : 'Dunkelblau');
  if (h < 275) return 'Dunkelblau';
  if (h < 320) return 'Violett';
  return 'Beere';
}

const zeilen = [];
console.log('Dessin   haeufigste  Anteil  Streuung  Vorschlag');
for (const w of werte) {
  if (w.fehlt) { console.log(w.d + '  BILD FEHLT'); continue; }
  const [r, g, b] = w.haeufig;
  const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0').toUpperCase()).join('');
  const v = wort(r, g, b);
  const merk = w.streuung > 26 ? '  << gemustert, Einzelwort unsicher' : '';
  console.log(`${w.d.padEnd(8)} ${hex}     ${String(w.anteil).padStart(3)} %   ${String(w.streuung).padStart(4)}     ${v}${merk}`);
  zeilen.push({ d: w.d, hex, anteil: w.anteil, streuung: w.streuung, wort: v });
}
writeFileSync('/tmp/claude-0/-home-user-bvlandingpage/09b9eb8a-f9dc-5324-b4fd-7a30c34d3ccc/scratchpad/stofffarben.json',
  JSON.stringify(zeilen, null, 1));
await br.close();
srv.kill();
