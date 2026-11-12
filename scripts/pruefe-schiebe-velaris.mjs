#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft die Editoren von Schiebetuer und Velaris.

   ANLASS (05./06.11.2026, Betreiber): "genau so ein button auch fuer
   ... Schiebetuer bearbeiten ... und Velaris bearbeiten", auf
   Rueckfrage bestaetigt.

   BESONDERHEIT: Diese beiden Editoren fuehren KEINE eigene
   Einstellung. Zwei Stellen, die dieselbe Sache einstellen, laufen
   auseinander - dagegen hilft kein Abgleich, sondern nur: Es gibt die
   Einstellung genau einmal. Beide Dialoge SPIEGELN deshalb die Felder
   des Bedienfelds und loesen dort dasselbe Ereignis aus wie ein
   Mensch.

   Geprueft wird darum beides: dass der Dialog zeigt, was im Bedienfeld
   steht, UND dass eine Aenderung im Dialog bis ins Modell durchschlaegt.

   Gegenprobe:  node scripts/pruefe-schiebe-velaris.mjs --gegenprobe
   Ein Fehler allein: BV_FEHLER=<n>
   --------------------------------------------------------------- */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const NUR = process.env.BV_FEHLER ? parseInt(process.env.BV_FEHLER, 10) : null;
const WURZEL = new URL('..', import.meta.url).pathname;
const PORT = 8773;

/* Der Browser liegt je nach Umgebung in chrome-linux/ ODER in
   chrome-linux64/ (am 12.11.2026 umgestellt - danach fanden 18
   Pruefskripte den Browser nicht mehr und keine Browser-Pruefung lief
   noch). Deshalb wird der Pfad gesucht statt geraten. */
function chromeIn(ordner) {
  const wege = [`${ordner}/chrome-linux/chrome`,
                `${ordner}/chrome-linux64/chrome`,
                `${ordner}/chrome`];
  for (const w of wege) if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${basis}/${o[o.length - 1]}`) : undefined;
}

const FEHLER = [
  /* Der Dialog zeigt nicht, was im Bedienfeld steht. */
  { von: "    ziel.innerHTML = quelle.innerHTML;\n    ziel.value = quelle.value;",
    nach: "    ziel.innerHTML = quelle.innerHTML;" },
  /* Die Wahl im Dialog kommt im Bedienfeld nicht an - und damit nirgends. */
  { von: "        q.dispatchEvent(new Event('change', { bubbles: true }));",
    nach: "        void q;" },
  /* Der Regler im Dialog bewegt den im Bedienfeld nicht. */
  { von: "        q.dispatchEvent(new Event('input', { bubbles: true }));",
    nach: "        void q;" },
  /* Die gemessenen Masse der Schiebetuer kommen nicht an. */
  { von: "        schiebeMassGemerkt[seite] = { b: Math.round(laenge * 10),",
    nach: "        schiebeMassGemerkt[seite] = { b: 0 && Math.round(laenge * 10)," },
  /* Dasselbe bei Velaris. */
  { von: "        velarisMassGemerkt[seite] = { b: Math.round(laenge * 10),",
    nach: "        velarisMassGemerkt[seite] = { b: 0 && Math.round(laenge * 10)," },
];

/* Lesehaken: was das Modell wirklich baut. */
const MESSHAKEN = [{
  von: "      if (seite) {\n        schiebeMassGemerkt[seite] = ",
  nach: "      if (seite) {\n        (window.__bvSchiebe = window.__bvSchiebe || {})[seite] =\n"
      + "          { fluegel: n, b: Math.round(laenge * 10) };\n"
      + "        schiebeMassGemerkt[seite] = "
}, {
  von: "      var gradOben = Math.min(90, Math.max(0, Z.velarisWinkelOben));",
  nach: "      var gradOben = Math.min(90, Math.max(0, Z.velarisWinkelOben));\n"
      + "      window.__bvVelarisGrad = gradOben;"
}];

/* ---------- Die Gegenprobe faehrt JEDEN Fehler einzeln ----------
   Mit allen auf einmal verdecken sie sich gegenseitig: Ist das Mass
   schon auf null gesetzt, kann der Fehler daneben nichts mehr zeigen.
   Der Sammellauf meldete deshalb "4 von 5" und behauptete, eine
   Pruefung sei blind - sie war es nicht (gemessen 06.11.2026).

   Eine Gegenprobe, die faelschlich Alarm schlaegt, ist fast so
   schaedlich wie eine, die schweigt: Man gewoehnt sich an das Rot.
   Darum ruft sich dieses Skript selbst auf, einmal je Fehler, und
   urteilt erst danach. Mit BV_FEHLER=<n> laeuft weiterhin einer
   allein, ohne diesen Umweg. */
if (GEGENPROBE && NUR == null && !process.env.BV_KIND) {
  const { spawnSync } = await import('node:child_process');
  console.log(`\n=== Schiebetür- und Velaris-Editor (GEGENPROBE, ${FEHLER.length} Fehler einzeln) ===\n`);
  let blind = 0;
  for (let i = 0; i < FEHLER.length; i++) {
    const r = spawnSync(process.execPath, [new URL(import.meta.url).pathname, '--gegenprobe'],
      { env: { ...process.env, BV_FEHLER: String(i), BV_KIND: '1' }, encoding: 'utf8' });
    const txt = (r.stdout || '') + (r.stderr || '');
    const roteZeilen = txt.split('\n').filter((z) => /^\s*FEHLER /.test(z));
    const veraltet = /ANKER VERALTET/.test(txt);
    if (veraltet) {
      console.log(`  ANKER   Fehler ${i}: kam nicht an – Anker veraltet`);
      blind++;
    } else if (!roteZeilen.length) {
      console.log(`  BLIND   Fehler ${i}: ${FEHLER[i].von.slice(0, 48).trim()}`);
      blind++;
    } else {
      console.log(`  scharf  Fehler ${i} → ${roteZeilen.length} Pruefung(en): `
        + roteZeilen[0].replace(/^\s*FEHLER\s+/, '').slice(0, 60));
    }
  }
  console.log(`\nGegenprobe: ${FEHLER.length} Fehler einzeln gefahren, ${blind} ohne Wirkung.`);
  if (blind) { console.log('MINDESTENS EINE PRUEFUNG IST BLIND.'); process.exit(1); }
  console.log('Gegenprobe in Ordnung.');
  process.exit(0);
}

let ankerKaputt = false;
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
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
await ctx.route('**/*', async (route) => {
  const pfad = new URL(route.request().url()).pathname;
  if (!pfad.endsWith('/js/konfigurator-3d.js')) return route.continue();
  const antwort = await route.fetch();
  let text = await antwort.text();
  const anwenden = (f) => {
    const n = text.split(f.von).length - 1;
    if (n !== 1) {
      console.error(`  !! Anker kommt ${n}x vor (erwartet 1x): ${f.von.slice(0, 50)}`);
      ankerKaputt = true;
    }
    text = text.replace(f.von, f.nach);
  };
  MESSHAKEN.forEach(anwenden);
  if (GEGENPROBE) (NUR == null ? FEHLER : [FEHLER[NUR]]).filter(Boolean).forEach(anwenden);
  return route.fulfill({ response: antwort, body: text });
});

const p = await ctx.newPage();
const seitenfehler = [];
p.on('pageerror', (e) => seitenfehler.push(String(e)));
await p.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
await p.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
await p.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await p.evaluate(() => {
  document.querySelectorAll('div,section,aside').forEach((e) => {
    if (!/Cookie/i.test(e.textContent || '')) return;
    const r = e.getBoundingClientRect();
    if (r.height > 60 && r.height < 460 && r.bottom > window.innerHeight - 200) e.style.display = 'none';
  });
});
await p.waitForTimeout(600);
const anschalten = (seite, was) => p.evaluate(([s2, w]) => {
  const b = document.querySelector(`[data-k3d-erw="${s2}"] button[data-erw="${w}"]`);
  if (b) b.click();
}, [seite, was]);
const radKlicken = (art) => p.evaluate((a) => {
  const k = document.querySelector(`[data-k3d-rad="${a}"]`);
  if (k) k.click();
}, art);

console.log(`\n=== Schiebetür- und Velaris-Editor ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

await p.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s) s.click();
});
await p.waitForTimeout(700);

/* ================= Schiebetuer ================= */
pruefe('Ohne Schiebetür gibt es kein Zahnrad',
  !(await p.evaluate(() => !!document.querySelector('[data-k3d-rad="Schiebetür"]:not([hidden])'))));

await anschalten('links', 'Schiebetür');
await p.waitForTimeout(1800);
pruefe('Mit Schiebetür erscheint das Zahnrad',
  await p.evaluate(() => {
    const k = document.querySelector('[data-k3d-rad="Schiebetür"]');
    return !!(k && !k.hidden && k.offsetParent);
  }));
/* Die Schiebetuer braucht einen Keil - der kommt automatisch mit, und
   dann steht dort auch sein Zahnrad. Beide duerfen sich nicht ins
   Gehege kommen. */
pruefe('Schiebetür- und Keil-Zahnrad stehen nebeneinander',
  await p.evaluate(() => {
    const a = document.querySelector('[data-k3d-rad="Schiebetür"]');
    const b = document.querySelector('[data-k3d-rad="Keil"]');
    return !!(a && b && a !== b
      && /Schiebetür bearbeiten/.test(a.textContent)
      && /Keil bearbeiten/.test(b.textContent));
  }), 'jeder Knopf traegt seine eigene Beschriftung');

/* ---------- Erst im Bedienfeld etwas EINSTELLEN ----------
   Sonst steht dort die Vorgabe, und ein Dialog, der gar nichts
   uebernimmt, zeigt zufaellig dasselbe: Eine frisch befuellte Auswahl
   steht von sich aus auf der ersten Option. Die Pruefung "zeigt
   denselben Stand" war damit blind (gemessen 06.11.2026). */
const vorgestellt = await p.evaluate(() => {
  const sel = document.getElementById('k3dSg23Links');
  const anders = [...sel.options].find((o) => o.value);
  if (!anders) return null;
  sel.value = anders.value;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return anders.value;
});
await p.waitForTimeout(1600);
pruefe('Das Bedienfeld laesst sich ueberhaupt verstellen', !!vorgestellt,
  'sonst prueft alles Weitere nichts');

await radKlicken('Schiebetür');
await p.waitForTimeout(900);
const sAuf = await p.evaluate(() => ({
  offen: !document.getElementById('k3dSchiebeDialog').hidden,
  titel: (document.getElementById('k3dSchiebeTitel') || {}).textContent || '',
  b: (document.getElementById('k3dSchiebeB') || {}).value,
  h: (document.getElementById('k3dSchiebeH') || {}).value,
  fluegel: (document.getElementById('k3dSchiebeFluegel') || {}).value,
  teilung: [...document.querySelectorAll('#k3dSchiebeTeilung option')].map((o) => o.value),
  imFeld: [...document.querySelectorAll('#k3dSg23Links option')].map((o) => o.value),
  wert: (document.getElementById('k3dSchiebeTeilung') || {}).value,
  wertFeld: (document.getElementById('k3dSg23Links') || {}).value,
  glas: [...document.querySelectorAll('#k3dSchiebeGlas option')].length,
}));
pruefe('Das Zahnrad öffnet den Editor', sAuf.offen);
pruefe('Der Titel nennt die Seite', /linke Seite/.test(sAuf.titel), sAuf.titel);
pruefe('Breite, Höhe und Flügelzahl kommen aus dem Modell',
  /^\d{3,5}$/.test(String(sAuf.b)) && /^\d{3,5}$/.test(String(sAuf.h))
  && /^\d$/.test(String(sAuf.fluegel)),
  `B ${sAuf.b}, H ${sAuf.h}, ${sAuf.fluegel} Flügel`);
pruefe('Die Aufteilung zeigt dieselben Möglichkeiten wie das Bedienfeld',
  sAuf.teilung.length > 1 && sAuf.teilung.join('|') === sAuf.imFeld.join('|'),
  `${sAuf.teilung.length} im Dialog, ${sAuf.imFeld.length} im Bedienfeld`);
pruefe('Und denselben Stand – auch wenn das nicht die Vorgabe ist',
  sAuf.wert === sAuf.wertFeld && sAuf.wert === vorgestellt,
  `Dialog "${sAuf.wert}", Bedienfeld "${sAuf.wertFeld}", vorher gestellt auf "${vorgestellt}"`);
pruefe('Glas und Schloss stehen ebenfalls im Dialog', sAuf.glas > 1,
  `${sAuf.glas} Glasarten`);

/* Eine andere Aufteilung waehlen - und im MODELL nachsehen. */
const vorFl = await p.evaluate(() => ((window.__bvSchiebe || {}).links || {}).fluegel);
const gewaehlt = await p.evaluate(() => {
  const sel = document.getElementById('k3dSchiebeTeilung');
  const anders = [...sel.options].find((o) => o.value && o.value !== sel.value);
  if (!anders) return null;
  sel.value = anders.value;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return anders.value;
});
await p.waitForTimeout(1800);
const nachFl = await p.evaluate(() => ((window.__bvSchiebe || {}).links || {}).fluegel);
const imFeldNach = await p.evaluate(() => (document.getElementById('k3dSg23Links') || {}).value);
pruefe('Eine Wahl im Dialog kommt im Bedienfeld an',
  !!gewaehlt && imFeldNach === gewaehlt,
  `gewählt "${gewaehlt}", im Bedienfeld "${imFeldNach}"`);
pruefe('Und sie erreicht das Modell',
  !!gewaehlt && nachFl === parseInt(String(gewaehlt).split('|')[1], 10),
  `vorher ${vorFl} Flügel, jetzt ${nachFl}, gewählt ${gewaehlt}`);

/* ================= Velaris ================= */
await p.evaluate(() => { document.getElementById('k3dSchiebeDialog').hidden = true; });
await anschalten('links', 'Schiebetür');          // wieder aus
await p.waitForTimeout(1200);
await anschalten('rechts', 'Velaris');
await p.waitForTimeout(1800);
pruefe('Mit Velaris erscheint das Zahnrad',
  await p.evaluate(() => {
    const k = document.querySelector('[data-k3d-rad="Velaris"]');
    return !!(k && !k.hidden && k.offsetParent);
  }));
await radKlicken('Velaris');
await p.waitForTimeout(900);
const vAuf = await p.evaluate(() => ({
  offen: !document.getElementById('k3dVelarisDialog').hidden,
  titel: (document.getElementById('k3dVelarisTitel') || {}).textContent || '',
  b: (document.getElementById('k3dVelarisB') || {}).value,
  h: (document.getElementById('k3dVelarisH') || {}).value,
  farben: [...document.querySelectorAll('#k3dVelarisEdFarbe option')].map((o) => o.value),
  imFeld: [...document.querySelectorAll('#k3dVelarisFarbe option')].map((o) => o.value),
  oben: (document.getElementById('k3dVelarisEdOben') || {}).value,
  obenFeld: (document.getElementById('k3dVelarisWinkelOben') || {}).value,
  hinweis: document.getElementById('k3dVelarisDialog').textContent,
}));
pruefe('Das Zahnrad öffnet den Velaris-Editor', vAuf.offen);
pruefe('Der Titel nennt die Seite', /rechte Seite/.test(vAuf.titel), vAuf.titel);
pruefe('Breite und Höhe kommen aus dem Modell',
  /^\d{3,5}$/.test(String(vAuf.b)) && /^\d{3,5}$/.test(String(vAuf.h)),
  `B ${vAuf.b}, H ${vAuf.h}`);
pruefe('Die Lamellen-Oberflächen sind dieselben wie im Bedienfeld',
  vAuf.farben.length > 1 && vAuf.farben.join('|') === vAuf.imFeld.join('|'),
  `${vAuf.farben.length} im Dialog, ${vAuf.imFeld.length} im Bedienfeld`);
pruefe('Der Winkelregler steht auf demselben Wert', vAuf.oben === vAuf.obenFeld,
  `Dialog ${vAuf.oben}, Bedienfeld ${vAuf.obenFeld}`);
/* Ein Dialog, der etwas fuer die ganze Anlage aendert, muss das sagen -
   sonst glaubt man, nur diese Seite zu verstellen. */
pruefe('Der Dialog sagt, dass diese Einstellungen für die ganze Anlage gelten',
  /ganze Anlage/.test(vAuf.hinweis), '');

const vorGrad = await p.evaluate(() => window.__bvVelarisGrad);
await p.evaluate(() => {
  const r = document.getElementById('k3dVelarisEdOben');
  r.value = String(Math.max(0, Math.min(90, (+r.value || 45) === 0 ? 90 : 0)));
  r.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(1800);
const nachGrad = await p.evaluate(() => window.__bvVelarisGrad);
const obenFeldNach = await p.evaluate(() => (document.getElementById('k3dVelarisWinkelOben') || {}).value);
pruefe('Der Regler im Dialog bewegt den im Bedienfeld',
  String(obenFeldNach) !== String(vAuf.obenFeld),
  `vorher ${vAuf.obenFeld}, jetzt ${obenFeldNach}`);
pruefe('Und die Lamellen stellen sich im Modell wirklich um',
  vorGrad !== undefined && nachGrad !== undefined && vorGrad !== nachGrad,
  `vorher ${vorGrad}°, jetzt ${nachGrad}°`);

pruefe('Keine Fehler im Browser', seitenfehler.length === 0, seitenfehler.slice(0, 2).join(' | '));

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  if (ankerKaputt) {
    console.log('ANKER VERALTET – mindestens ein Fehler kam nicht an.');
    process.exit(1);
  }
  const zahl = NUR == null ? FEHLER.length : 1;
  console.log(`Gegenprobe: ${zahl} Fehler eingebaut${NUR == null ? '' : ' (Nr. ' + NUR + ')'}, `
    + `${rot.length} Pruefungen schlagen an.`);
  if (rot.length < zahl) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
