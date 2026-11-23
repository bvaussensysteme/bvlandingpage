#!/usr/bin/env node
/* ============================================================
   FAERBT EIN PLATTENBILD EIN.

   ANLASS (23.11.2026). Ansage des Betreibers: "erstelle so eine
   grafik auch für glas Grau/Graphit" und "und polycarbonat graphit".
   Fuer diese beiden Varianten gibt es beim Hersteller kein Bild:
   weder auf den Produktseiten noch im Katalog 2026 noch in den
   technischen Datenblaettern.

   WARUM EINFAERBEN UND NICHT NEU ZEICHNEN. Die vier vorhandenen
   Karten zeigen fotorealistische Platten. Eine selbst gezeichnete
   Platte daneben faellt sofort auf. Das Ausgangsbild hat einen
   DURCHSICHTIGEN Hintergrund (gemessen: 63 Prozent der Bildpunkte
   haben Alpha 0), deshalb trifft die Einfaerbung nur die Platte und
   nie den Hintergrund.

   WIE. Jeder Farbkanal wird mit dem Zielton multipliziert. Multiplik-
   ation statt Uebermalen, damit Glanzlichter und Kanten erhalten
   bleiben: Eine flach uebermalte Platte sieht aus wie Pappe.

   Aufruf:
     node scripts/faerbe-platte.mjs <quelle> <ziel> <#rrggbb> [staerke]
   staerke 0 bis 1, Vorgabe 1. Beispiel:
     node scripts/faerbe-platte.mjs images/vd_mat_vsg8_klar.webp \
          images/vd_mat_vsg8_graphit.webp '#6F7479'
   ============================================================ */
import { chromium } from 'playwright';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const [quelle, ziel, ton, staerkeRoh] = process.argv.slice(2);
if (!quelle || !ziel || !ton) {
  console.error('Aufruf: node scripts/faerbe-platte.mjs <quelle> <ziel> <#rrggbb> [staerke]');
  process.exit(2);
}
const staerke = staerkeRoh === undefined ? 1 : Number(staerkeRoh);
if (!/^#[0-9a-fA-F]{6}$/.test(ton)) { console.error('Ton muss #rrggbb sein.'); process.exit(2); }
if (!existsSync(`${WURZEL}/${quelle}`)) { console.error('Quelle fehlt:', quelle); process.exit(2); }
if (!basename(ziel).startsWith('vd_')) {
  /* Die Vorlage stammt vom Hersteller, das Ergebnis also auch. Es
   * gehoert unter dasselbe Praefix, sonst faellt es bei einem
   * Vertragsende durchs Raster. Siehe docs/VD-INHALTE-INVENTAR.md. */
  console.error('Zielname muss mit vd_ beginnen:', ziel);
  process.exit(2);
}

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
}
function chromePfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const PORT = 8966;
const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const br = await chromium.launch({ executablePath: chromePfad(), args: ['--no-sandbox'] });
try {
  const c = await br.newContext();
  const p = await c.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  const daten = await p.evaluate(async ([pfad, hex, kraft]) => {
    const bild = new Image();
    await new Promise((fertig, schief) => {
      bild.onload = fertig; bild.onerror = schief; bild.src = '/' + pfad;
    });
    const k = document.createElement('canvas');
    k.width = bild.naturalWidth; k.height = bild.naturalHeight;
    const ctx = k.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bild, 0, 0);
    const bd = ctx.getImageData(0, 0, k.width, k.height);
    const d = bd.data;
    const tr = parseInt(hex.slice(1, 3), 16) / 255;
    const tg = parseInt(hex.slice(3, 5), 16) / 255;
    const tb = parseInt(hex.slice(5, 7), 16) / 255;
    let getroffen = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;          // durchsichtig: nicht anfassen
      getroffen++;
      d[i]     = Math.round(d[i]     * (1 - kraft + kraft * tr));
      d[i + 1] = Math.round(d[i + 1] * (1 - kraft + kraft * tg));
      d[i + 2] = Math.round(d[i + 2] * (1 - kraft + kraft * tb));
    }
    ctx.putImageData(bd, 0, 0);
    return { url: k.toDataURL('image/webp', 0.92),
             groesse: k.width + ' x ' + k.height,
             anteil: Math.round(getroffen / (k.width * k.height) * 100) };
  }, [quelle, ton, staerke]);
  const roh = Buffer.from(daten.url.split(',')[1], 'base64');
  writeFileSync(`${WURZEL}/${ziel}`, roh);
  console.log(`${ziel} geschrieben: ${daten.groesse}, ${Math.round(roh.length / 1024)} KB, `
    + `${daten.anteil} % der Flaeche eingefaerbt mit ${ton} bei Staerke ${staerke}`);
} finally {
  await br.close();
  srv.kill();
}
