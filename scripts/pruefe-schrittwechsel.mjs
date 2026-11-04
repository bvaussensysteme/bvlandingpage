#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft: Nach "Weiter" steht man am Anfang des neuen Schritts -
   nicht irgendwo darunter.

   ANLASS (04.11.2026, Betreiber am iPhone): "außerdem sehr oft wenn
   man weiter drückt landet man nicht beim nächsten schritt sondern
   unten im footer".

   URSACHE: schrittWechseln() rollte .k3d-sl-rollen nach oben. Am
   grossen Bildschirm rollt das Bedienfeld wirklich in sich selbst.
   Am Handy steht .k3d-app { height: auto } - das Feld waechst mit
   seinem Inhalt, scrollTop ist immer 0, der Aufruf tat nichts.
   Gerollt hat die Seite, und die blieb stehen. War der neue Schritt
   kuerzer als der vorige, stand man danach in der Fusszeile.

   GEPRUEFT WIRD DAS ERGEBNIS, NICHT DER AUFRUF: Das Skript rollt
   vorher wirklich ans Seitenende und sieht danach nach, wo der
   Anfang des Bedienfelds liegt. Eine Pruefung auf "scrollTo wurde
   gerufen" waere genau die Pruefung, die den Fehler hatte.

   Gegenprobe: node scripts/pruefe-schrittwechsel.mjs --gegenprobe
   --------------------------------------------------------------- */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8268;
const WURZEL = new URL('..', import.meta.url).pathname;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

/* Jeder Fehler macht GENAU EINE Pruefung rot. */
const FEHLER = [
  // 1. Der alte Stand vom 04.11.2026: Am Handy rollt die Seite nicht.
  { datei: 'js/konfigurator-3d.js', von: '    var klebt = buehne && window.getComputedStyle',
    nach: '    if (1) return;\n    var klebt = buehne && window.getComputedStyle' },
  // 2. Hoehe des klebenden Bildes nicht abgezogen: Es verdeckt den Anfang.
  { datei: 'js/konfigurator-3d.js', von: 'var abzug = klebt ? buehne.getBoundingClientRect().height : 0;',
    nach: 'var abzug = 0;' },
  // 3. Der grosse Bildschirm faellt in den Handy-Zweig.
  { datei: 'js/konfigurator-3d.js', von: 'if (rollen.scrollHeight > rollen.clientHeight + 1) {',
    nach: 'if (false) {' },
];

let ok = 0; const rot = [];
function pruefe(was, bedingung, beleg) {
  if (bedingung) { ok++; console.log(`  ok      ${was}`); }
  else { rot.push(was); console.log(`  FEHLER  ${was}${beleg ? '  (' + beleg + ')' : ''}`); }
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1000));
const browser = await chromium.launch({
  executablePath: chromiumPfad(),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

async function seiteOeffnen(ctx) {
  const p = await ctx.newPage();
  if (GEGENPROBE) {
    /* EIN Handler je Adresse, und nach dem PFAD vergleichen: Das
       Skript kommt als konfigurator-3d.js?v=... - mit endsWith auf
       die ganze Adresse kaeme der Fehler nie an. */
    await p.route('**/*', async (route) => {
      const pfad = new URL(route.request().url()).pathname;
      const treffer = FEHLER.filter((f) => pfad.endsWith('/' + f.datei));

      if (!treffer.length) return route.continue();
      const antwort = await route.fetch();
      let text = await antwort.text();
      for (const f of treffer) {
        /* GENAU EINMAL, nicht "mindestens einmal": Der erste Versuch
           dieses Skripts setzte seinen Fehler in eine voellig andere
           Funktion, weil die Ankerzeile zweimal in der Datei stand.
           Die Gegenprobe blieb gruen und behauptete, die Pruefungen
           seien blind - dabei war der Fehler nur woanders gelandet. */
        const n = text.split(f.von).length - 1;
        if (n !== 1) {
          console.error(`  !! Anker kommt ${n}x vor (erwartet 1x): ${f.von.slice(0, 55)}`);
          process.exitCode = 2;
        }
        text = text.replace(f.von, f.nach);
      }
      return route.fulfill({ response: antwort, body: text });
    });
  }
  await p.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
  await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(600);
  return p;
}

console.log(`\n=== Schrittwechsel ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

/* ---------- Am Handy ---------- */
const handy = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
const ph = await seiteOeffnen(handy);

const stand = () => ph.evaluate(() => {
  const r = document.querySelector('.k3d-sl-rollen');
  const b = document.querySelector('.k3d-buehne');
  return {
    y: Math.round(window.pageYOffset),
    hoch: Math.round(document.documentElement.scrollHeight),
    panelOben: Math.round(r.getBoundingClientRect().top),
    buehneHoch: Math.round(b ? b.getBoundingClientRect().height : 0),
    buehneSichtbar: b ? Math.round(b.getBoundingClientRect().bottom) : 0,
    fussSichtbar: (() => {
      const f = document.querySelector('footer[role=contentinfo]');
      if (!f) return false;
      const r = f.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    })(),
  };
});

/* Erst ans Ende rollen - genau die Lage, aus der heraus der Fehler
   auftrat. Ohne diesen Schritt prueft man nichts. */
await ph.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await ph.waitForTimeout(500);
const vorher = await stand();
pruefe('Der Test steht vor dem Klick wirklich unten',
  vorher.y > 300, `pageYOffset ${vorher.y}`);

await ph.locator('#k3dWeiter').click();
await ph.waitForTimeout(1400);
const nachher = await stand();

/* Der Anfang des Bedienfelds muss im Bild stehen. Etwas Spielraum,
   weil das klebende Bild und der Abstand von 8 px mitzaehlen. */
pruefe('Nach "Weiter" steht der Anfang des Schritts im Bild',
  nachher.panelOben <= nachher.buehneHoch + 24,
  `Panelanfang bei ${nachher.panelOben} px, Bild ${nachher.buehneHoch} px hoch`);
/* Getrennte Pruefung, weil es zwei verschiedene Fehler sind: zu wenig
   gerollt (man steht noch unten) und zu weit gerollt (das klebende
   Bild liegt ueber dem Anfang des Schritts). */
pruefe('Das klebende 3D-Bild verdeckt den Anfang nicht',
  nachher.panelOben >= nachher.buehneHoch - 8,
  `Panelanfang bei ${nachher.panelOben} px, Bild ${nachher.buehneHoch} px hoch`);
/* Die Worte des Betreibers, direkt geprueft: "landet man ... unten im
   footer". NICHT ueber pageYOffset - die Seite wird beim Schrittwechsel
   kuerzer, der Browser kappt den Wert von allein, und ein Vergleich
   "nachher kleiner als vorher" waere auch im Fehlerfall wahr. */
pruefe('Die Fusszeile ist danach nicht mehr zu sehen',
  !nachher.fussSichtbar, 'die Fusszeile steht im Bild');

/* ---------- Am grossen Bildschirm ----------
   Zweiter, anders gebauter Weg: Dort rollt das Bedienfeld in sich
   selbst. Wuerde die neue Funktion dort die SEITE rollen, waere das
   eine Verschlimmbesserung, die niemand bemerkt. */
const rechner = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pr = await seiteOeffnen(rechner);
const rollt = await pr.evaluate(() => {
  const r = document.querySelector('.k3d-sl-rollen');
  return r.scrollHeight > r.clientHeight + 1;
});
pruefe('Am grossen Bildschirm rollt das Bedienfeld in sich selbst', rollt,
  'sonst greift der Handy-Zweig auch dort');
if (rollt) {
  await pr.evaluate(() => { document.querySelector('.k3d-sl-rollen').scrollTop = 400; });
  await pr.waitForTimeout(200);
  await pr.locator('#k3dWeiter').click();
  await pr.waitForTimeout(1200);
  const d = await pr.evaluate(() => ({
    oben: Math.round(document.querySelector('.k3d-sl-rollen').scrollTop),
    seite: Math.round(window.pageYOffset),
  }));
  pruefe('Am grossen Bildschirm faengt das Bedienfeld wieder oben an', d.oben <= 4, `scrollTop ${d.oben}`);
  pruefe('Am grossen Bildschirm bleibt die Seite stehen', d.seite <= 4, `pageYOffset ${d.seite}`);
}

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  console.log(`Gegenprobe: ${FEHLER.length} Fehler eingebaut, ${rot.length} Pruefungen schlagen an.`);
  if (rot.length < FEHLER.length) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
