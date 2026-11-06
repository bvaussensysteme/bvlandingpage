#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft den Editor der Rahmenwand.

   ANLASS (05.11.2026, Betreiber): "genau so ein button auch fuer
   rahmenwand bearbeiten ...". Der zweite der vier Editoren.

   Zu waehlen gibt es die Aufteilung - JE SEITE. Bis dahin galt die
   Wahl im Bedienfeld fuer alle Seiten zugleich.

   GEPRUEFT WIRD DAS ERGEBNIS IM MODELL: Wie viele Sprossen wirklich
   gebaut werden, nicht nur, welche Kachel leuchtet.

   Gegenprobe:  node scripts/pruefe-rahmen-editor.mjs --gegenprobe
   Ein Fehler allein: BV_FEHLER=<n> bzw. BV_CSS_FEHLER=<n>
   --------------------------------------------------------------- */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const NUR = process.env.BV_FEHLER ? parseInt(process.env.BV_FEHLER, 10) : null;
const NUR_CSS = process.env.BV_CSS_FEHLER ? parseInt(process.env.BV_CSS_FEHLER, 10) : null;
const EINZELN = NUR != null || NUR_CSS != null;
const WURZEL = new URL('..', import.meta.url).pathname;
const PORT = 8771;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

const FEHLER = [
  /* Die Wahl am Bauteil erreicht die Zeichnung nicht. */
  { von: "      var eigen = seite ? rahmenPlanLesen(seite).teilung : '';",
    nach: "      var eigen = '';" },
  /* Die Wahl am Bauteil gilt wieder fuer alle Seiten. */
  { von: "      var wunsch = parseInt(eigen !== '' ? eigen : Z.rahmenTeilung, 10);",
    nach: "      var wunsch = parseInt(Z.rahmenTeilung, 10);" },
  /* Die gemessenen Masse kommen nicht im Editor an. */
  { von: "        rahmenMassGemerkt[seite] = { b: Math.round(laenge * 10),",
    nach: "        rahmenMassGemerkt[seite] = { b: 0 && Math.round(laenge * 10)," },
  /* Die Seite wird gar nicht erst durchgereicht. */
  { von: "                   bisDach ? function (pos) { return dachUk(pos) - yO; } : null,\n                   seite);",
    nach: "                   bisDach ? function (pos) { return dachUk(pos) - yO; } : null);" },
  /* Der Plan faehrt im geteilten Link nicht mit. */
  { von: "    if (Z.rahmenPlan && Object.keys(Z.rahmenPlan).length) d.rp = Z.rahmenPlan;",
    nach: "    void 0;" },
];

const CSS_FEHLER = [
  { von: '<input type="text" id="k3dRahmenB" class="k3d-zahl" readonly',
    nach: '<input type="text" id="k3dRahmenB" readonly' },
];

/* Lesehaken: welche Aufteilung wirklich gebaut wurde, je Seite. */
const MESSHAKEN = [{
  von: "      var t = rahmenwandTeilung(laenge, hoehe, seite);",
  nach: "      var t = rahmenwandTeilung(laenge, hoehe, seite);\n"
      + "      (window.__bvRahmen = window.__bvRahmen || {})[seite || '?'] =\n"
      + "        { senkrecht: t[0], waagerecht: t[1], b: Math.round(laenge * 10) };"
}];

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

async function routenSetzen(zielCtx) {
  await zielCtx.route('**/*', async (route) => {
    const pfad = new URL(route.request().url()).pathname;
    const istJs = pfad.endsWith('/js/konfigurator-3d.js');
    const istSeite = pfad.endsWith('/konfigurator.html');
    if (!istJs && !istSeite) return route.continue();
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
    if (istJs) {
      MESSHAKEN.forEach(anwenden);
      if (GEGENPROBE && NUR_CSS == null) {
        (NUR == null ? FEHLER : [FEHLER[NUR]]).filter(Boolean).forEach(anwenden);
      }
    } else if (GEGENPROBE && NUR == null) {
      (NUR_CSS == null ? CSS_FEHLER : [CSS_FEHLER[NUR_CSS]]).filter(Boolean).forEach(anwenden);
    }
    return route.fulfill({ response: antwort, body: text });
  });
}
await routenSetzen(ctx);

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

const gebaut = (seite) => p.evaluate((s2) => (window.__bvRahmen || {})[s2] || null, seite);
const anschalten = (seite, was) => p.evaluate(([s2, w]) => {
  const b = document.querySelector(`[data-k3d-erw="${s2}"] button[data-erw="${w}"]`);
  if (b) b.click();
}, [seite, was]);

console.log(`\n=== Rahmen-Editor ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

await p.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s) s.click();
});
await p.waitForTimeout(700);

pruefe('Ohne Rahmenwand gibt es kein Zahnrad',
  !(await p.evaluate(() => !!document.querySelector('[data-k3d-rad="Rahmenwand"]:not([hidden])'))),
  'ein Knopf ohne Bauteil waere eine falsche Zusage');

await anschalten('links', 'Rahmenwand');
await p.waitForTimeout(1600);
pruefe('Mit Rahmenwand erscheint das Zahnrad',
  await p.evaluate(() => {
    const k = document.querySelector('[data-k3d-rad="Rahmenwand"]');
    return !!(k && !k.hidden && k.offsetParent);
  }));

await p.click('[data-k3d-rad="Rahmenwand"]');
await p.waitForTimeout(800);
const auf = await p.evaluate(() => ({
  offen: !document.getElementById('k3dRahmenDialog').hidden,
  titel: (document.getElementById('k3dRahmenTitel') || {}).textContent || '',
  b: (document.getElementById('k3dRahmenB') || {}).value,
  h: (document.getElementById('k3dRahmenH') || {}).value,
  kacheln: [...document.querySelectorAll('#k3dRahmenTeilungen button')]
    .map((x) => (x.querySelector('span') || {}).textContent),
  imFeld: [...document.querySelectorAll('#k3dRahmenTeilung option')]
    .map((o) => o.textContent.trim()),
}));
pruefe('Das Zahnrad oeffnet den Editor', auf.offen);
pruefe('Der Titel nennt die Seite', /linke Seite/.test(auf.titel), auf.titel);
pruefe('Alle neun Aufteilungen stehen zur Wahl', auf.kacheln.length === 9,
  `${auf.kacheln.length} Kacheln`);
/* EINE Quelle fuer die Namen: Stuenden sie zweimal im Code, hiesse
   dieselbe Aufteilung frueher oder spaeter an zwei Stellen anders. */
pruefe('Die Namen stammen aus dem Bedienfeld, nicht aus einer zweiten Liste',
  auf.kacheln.join('|') === auf.imFeld.join('|'),
  auf.kacheln.slice(0, 2).join(' / '));
pruefe('Breite und Hoehe kommen aus dem Modell',
  /^\d{3,5}$/.test(String(auf.b)) && /^\d{3,5}$/.test(String(auf.h)),
  `B = ${auf.b}, H = ${auf.h}`);

/* ---------- Die Wahl erreicht das Modell ---------- */
async function waehlen(id) {
  await p.evaluate((i) => {
    const b = document.querySelector(`#k3dRahmenTeilungen button[data-teilung="${i}"]`);
    if (b) b.click();
  }, id);
  await p.waitForTimeout(1300);
}
await waehlen('4');                       // 4-teilig, 3 senkrechte Sprossen
const vier = await gebaut('links');
pruefe('Die gewaehlte Aufteilung erreicht das Modell',
  !!vier && vier.senkrecht === 3 && vier.waagerecht === 0,
  vier ? `${vier.senkrecht} senkrecht, ${vier.waagerecht} waagerecht` : 'nichts gebaut');

await waehlen('1');                       // 2-teilig, 1 waagerechte Sprosse
const waag = await gebaut('links');
pruefe('Auch eine waagerechte Sprosse kommt an',
  !!waag && waag.senkrecht === 0 && waag.waagerecht === 1,
  waag ? `${waag.senkrecht} senkrecht, ${waag.waagerecht} waagerecht` : 'nichts gebaut');

/* ---------- Je Seite einzeln ----------
   Der eigentliche Zweck des Editors: Bis dahin galt die Wahl im
   Bedienfeld fuer ALLE Seiten zugleich. */
await p.evaluate(() => { document.getElementById('k3dRahmenDialog').hidden = true; });
await anschalten('rechts', 'Rahmenwand');
await p.waitForTimeout(1600);
await p.evaluate(() => {
  const k = [...document.querySelectorAll('[data-k3d-rad="Rahmenwand"]')]
    .find((x) => x.getAttribute('data-k3d-rad-seite') === 'rechts');
  if (k) k.click();
});
await p.waitForTimeout(800);
await waehlen('3');                       // 3-teilig, 2 senkrechte Sprossen
const li = await gebaut('links');
const re = await gebaut('rechts');
pruefe('Jede Seite behaelt ihre eigene Aufteilung',
  !!li && !!re && li.waagerecht === 1 && re.senkrecht === 2,
  `links ${li ? li.senkrecht + '/' + li.waagerecht : '-'}, `
  + `rechts ${re ? re.senkrecht + '/' + re.waagerecht : '-'}`);

/* ---------- "automatisch" gibt das Bedienfeld zurueck ---------- */
await p.evaluate(() => {
  const sel = document.getElementById('k3dRahmenTeilung');
  if (sel) { sel.value = '7'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
});
await p.waitForTimeout(1200);
await waehlen('');
const zurueck = await gebaut('rechts');
pruefe('„automatisch" gibt dem Bedienfeld das Wort zurueck',
  !!zurueck && zurueck.senkrecht === 3 && zurueck.waagerecht === 1,
  zurueck ? `${zurueck.senkrecht} senkrecht, ${zurueck.waagerecht} waagerecht` : 'nichts gebaut');

/* ---------- Die Felder sehen aus wie ueberall ---------- */
const rahmen = await p.evaluate(() =>
  ['k3dRahmenB', 'k3dRahmenH'].map((id) => {
    const c = getComputedStyle(document.getElementById(id));
    return [c.borderTopWidth, c.borderTopStyle, c.borderTopColor, c.borderTopLeftRadius].join('|');
  }));
pruefe('Beide Maszfelder tragen denselben Rahmen',
  new Set(rahmen).size === 1, rahmen.join('  /  '));
const einheiten = await p.evaluate(() =>
  ['k3dRahmenB', 'k3dRahmenH'].map((id) => {
    const e = document.getElementById(id).parentNode.querySelector('.k3d-keil-einheit');
    return e && e.offsetParent !== null ? (e.textContent || '').trim() : '';
  }));
pruefe('Hinter jedem Maszfeld steht die Einheit',
  einheiten.every((t) => t === 'mm'), einheiten.join(', ') || 'keine');

/* ---------- Der geteilte Link ----------
   Ein Plan, der den Link nicht uebersteht, ist ein Plan, den der Kunde
   beim Oeffnen verliert - und zwar stillschweigend. Darum der ECHTE
   Rundlauf: teilen, Link in einem frischen Tab oeffnen, nachsehen. */
await p.evaluate(() => { document.getElementById('k3dRahmenDialog').hidden = true; });
await p.evaluate(() => { const t = document.getElementById('k3dTeilen'); if (t) t.click(); });
await p.waitForTimeout(1200);
const link = await p.evaluate(() => (document.getElementById('k3dTeilenLink') || {}).value || '');
const p2 = await ctx.newPage();
p2.on('pageerror', (e) => seitenfehler.push(String(e)));
let ausLink = null;
if (link.indexOf('#k=') > -1) {
  await p2.goto(link, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(2400);
  await p2.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
  await p2.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
  await p2.evaluate(() => {
    const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
    const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
    if (s) s.click();
  });
  await p2.waitForTimeout(1200);
  ausLink = await p2.evaluate(() => (window.__bvRahmen || {}).links || null);
}
pruefe('Die Aufteilung uebersteht den geteilten Link',
  !!ausLink && ausLink.senkrecht === 0 && ausLink.waagerecht === 1,
  ausLink ? `${ausLink.senkrecht} senkrecht, ${ausLink.waagerecht} waagerecht `
            + '(erwartet 0/1 wie vor dem Teilen)'
          : (link.indexOf('#k=') > -1 ? 'nichts gebaut' : 'kein Link erzeugt'));

pruefe('Keine Fehler im Browser', seitenfehler.length === 0, seitenfehler.slice(0, 2).join(' | '));

/* ---------- Am Handy ---------- */
const handy = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3,
});
await routenSetzen(handy);
const ph = await handy.newPage();
await ph.goto(`http://localhost:${PORT}/konfigurator.html`, { waitUntil: 'networkidle' });
await ph.waitForTimeout(2200);
await ph.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
await ph.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
await ph.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s) s.click();
});
await ph.waitForTimeout(700);
await ph.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Rahmenwand"]');
  if (b) b.click();
});
await ph.waitForTimeout(1600);
await ph.evaluate(() => {
  const k = document.querySelector('[data-k3d-rad="Rahmenwand"]');
  if (k) k.click();
});
await ph.waitForTimeout(900);
const handyMass = await ph.evaluate(() => {
  const d = document.getElementById('k3dRahmenDialog');
  if (!d || d.hidden) return null;
  const r = d.getBoundingClientRect();
  const k = [...document.querySelectorAll('#k3dRahmenTeilungen button')];
  const innen = k.every((b) => {
    const rb = b.getBoundingClientRect();
    return rb.left >= -1 && rb.right <= window.innerWidth + 1;
  });
  return { hoch: Math.round(r.height), fenster: window.innerHeight,
           quer: document.documentElement.scrollWidth - window.innerWidth,
           innen: innen, kacheln: k.length };
});
pruefe('Am Handy deckt der Dialog das ganze Fenster ab',
  !!handyMass && handyMass.hoch >= handyMass.fenster - 2,
  handyMass ? `${handyMass.hoch} bei ${handyMass.fenster}` : 'Dialog zu');
pruefe('Am Handy stehen alle Kacheln im Bild, ohne seitliches Schieben',
  !!handyMass && handyMass.innen && handyMass.quer <= 1,
  handyMass ? `${handyMass.kacheln} Kacheln, quer ${handyMass.quer} px` : '-');

await browser.close();
server.kill();

console.log(`\n${ok} bestanden, ${rot.length} offen`);
if (GEGENPROBE) {
  if (ankerKaputt) {
    console.log('ANKER VERALTET – mindestens ein Fehler kam nicht an.');
    process.exit(1);
  }
  const zahl = EINZELN ? 1 : FEHLER.length + CSS_FEHLER.length;
  const welcher = NUR != null ? ' (Nr. ' + NUR + ')'
                : NUR_CSS != null ? ' (CSS Nr. ' + NUR_CSS + ')' : '';
  console.log(`Gegenprobe: ${zahl} Fehler eingebaut${welcher}, ${rot.length} Pruefungen schlagen an.`);
  if (rot.length < zahl) { console.log('ZU WENIGE – mindestens eine Pruefung ist blind.'); process.exit(1); }
  process.exit(0);
}
process.exit(rot.length ? 1 : 0);
