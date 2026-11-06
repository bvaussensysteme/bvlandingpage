#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft den Editor der Plankenwand.

   ANLASS (05.11.2026, Betreiber): "genau so ein button auch fuer
   rahmenwand bearbeiten, Schiebetuer bearbeiten, Plankenwand
   bearbeiten ... bei Plankenwand noch h+" und "bei plankenwand noch ne
   option hinzufuegen nicht nur waagrecht auch hochkant moeglich".
   Dass VD hochkant liefert, ist seine Angabe - BELEGT.

   GEPRUEFT WIRD DAS ERGEBNIS IM MODELL, nicht nur die Oberflaeche: Ein
   Editor, dessen Wahl das Bild nicht erreicht, ist eine Attrappe. Die
   gebauten Planken werden ueber einen eingespritzten Lesehaken
   gezaehlt und vermessen.

   Gegenprobe:  node scripts/pruefe-planken-editor.mjs --gegenprobe
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
const PORT = 8769;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

/* Jeder Fehler muss mindestens EINE Pruefung rot machen, und jeder
   Anker muss genau einmal vorkommen - sonst landet der Fehler an der
   falschen Stelle und die Gegenprobe meldet faelschlich Erfolg. */
const FEHLER = [
  /* Die Richtung erreicht das Modell nicht. */
  { von: "      var hoch = richtung === 'hochkant';",
    nach: "      var hoch = false;" },
  /* Hochkant ohne Querschienen - die Planken haengen in der Luft. */
  { von: "      var schiene = Math.min(ZWISCHEN.breite, hoehe / 4);",
    nach: "      var schiene = 0;" },
  /* Die eingetragene Hoehe wird nicht benutzt. */
  { von: "        if (pwPlan.h == null) return vorgabe;",
    nach: "        if (true) return vorgabe;" },
  /* Die Hoehe wird nicht auf den Platz begrenzt. */
  { von: "        return Math.max(PLANKE_MIN_H / 10, Math.min(hoch, pwPlan.h / 10));",
    nach: "        return pwPlan.h / 10;" },
  /* Der Prozentregler zieht von der eigenen Hoehe noch einmal ab. */
  { von: "                pwPlan.h != null ? false : undefined, pwPlan.richtung);",
    nach: "                undefined, pwPlan.richtung);" },
  /* Der Plan faehrt im geteilten Link nicht mit. */
  { von: "    if (Z.plankenPlan && Object.keys(Z.plankenPlan).length) d.pp = Z.plankenPlan;",
    nach: "    void 0;" },
  /* Das Hoehenfeld klemmt wieder beim Tippen. */
  { von: "      if (v < PLANKE_MIN_H || (max && v > max)) return;",
    nach: "      if (v < PLANKE_MIN_H) { v = PLANKE_MIN_H; f.value = String(v); }" },
];

/* Fehler in CSS und Markup der Seite. */
const CSS_FEHLER = [
  /* Das Breitenfeld faellt aus der Familie. */
  { von: '<input type="text" id="k3dPlankenB" class="k3d-zahl" readonly',
    nach: '<input type="text" id="k3dPlankenB" readonly' },
  /* Die Einheit am Hoehenfeld fehlt. */
  { von: '<span class="k3d-bearb-einheit" aria-hidden="true">mm</span>\n              </span>\n              <p class="k3d-mini" id="k3dPlankenHHinweis">',
    nach: '\n              </span>\n              <p class="k3d-mini" id="k3dPlankenHHinweis">' },
];

/* Lesehaken: was wirklich gebaut wurde. NUR lesend, nur im Test. */
const MESSHAKEN = [{
  von: "      PLANKEN_IST = { anzahl: t.anzahl, gesamt: t.anzahl,\n                      fuge: Math.round(t.fuge * 100) / 10,\n                      hoehe: Math.round(hoehe * 10), lage: 'voll',\n                      richtung: 'hochkant',",
  nach: "      (window.__bvPlanken = window.__bvPlanken || []).push({ richtung: 'hochkant',\n        anzahl: t.anzahl, hoehe: Math.round(hoehe * 10), schiene: Math.round(schiene * 10) });\n"
      + "      PLANKEN_IST = { anzahl: t.anzahl, gesamt: t.anzahl,\n                      fuge: Math.round(t.fuge * 100) / 10,\n                      hoehe: Math.round(hoehe * 10), lage: 'voll',\n                      richtung: 'hochkant',"
}, {
  von: "  function plankenPlanSchreiben(seite, plan) {",
  nach: "  window.__bvPlankenUeberhoch = function (s) {\n"
      + "    if (!Z.plankenPlan) Z.plankenPlan = {};\n"
      + "    Z.plankenPlan[s] = { h: 99999, richtung: 'waagerecht' };\n"
      + "  };\n"
      + "  function plankenPlanSchreiben(seite, plan) {"
}, {
  von: "      PLANKEN_IST = { anzahl: a.anzahl, gesamt: t.anzahl,",
  nach: "      (window.__bvPlanken = window.__bvPlanken || []).push({ richtung: 'waagerecht',\n        anzahl: a.anzahl, hoehe: Math.round(hoch * 10), schiene: 0 });\n"
      + "      PLANKEN_IST = { anzahl: a.anzahl, gesamt: t.anzahl,"
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

/* fill() loest nur 'input' aus. Ein Mensch verlaesst das Feld auch -
   und erst dann wird geklemmt. */
async function tippe(sel, wert, ms = 4000) {
  await p.fill(sel, wert, { timeout: ms }).catch(() => {});
  await p.evaluate((s2) => { const e = document.querySelector(s2); if (e) e.blur(); }, sel);
}
const gebaut = () => p.evaluate(() => (window.__bvPlanken || []).slice(-1)[0] || null);
const leeren = () => p.evaluate(() => { window.__bvPlanken = []; });

console.log(`\n=== Planken-Editor ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

await p.evaluate(() => {
  const r = [...document.querySelectorAll('.k3d-reiter button[data-bereich]')];
  const s = r.find((b) => /Seiten/i.test(b.textContent || ''));
  if (s) s.click();
});
await p.waitForTimeout(700);

const radVorher = await p.evaluate(() =>
  !!document.querySelector('[data-k3d-rad="Plankenwand"]:not([hidden])'));
pruefe('Ohne Plankenwand gibt es kein Zahnrad', !radVorher,
  'ein Knopf ohne Bauteil waere eine falsche Zusage');

await p.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Plankenwand"]');
  if (b) b.click();
});
await p.waitForTimeout(1600);
pruefe('Mit Plankenwand erscheint das Zahnrad',
  await p.evaluate(() => {
    const k = document.querySelector('[data-k3d-rad="Plankenwand"]');
    return !!(k && !k.hidden && k.offsetParent);
  }));
/* Das Keil-Zahnrad darf dabei nicht mitkommen: Sie teilen sich die
   Huelle, und mit nur EINEM Attribut fuer alle holte der eine Knopf
   den anderen und benannte ihn um. */
pruefe('Das Keil-Zahnrad bleibt davon unberuehrt',
  await p.evaluate(() => {
    const k = document.querySelector('[data-k3d-rad="Keil"]');
    return !k || k.hidden;
  }), 'ohne Keil darf dort kein Keil-Knopf stehen');

await p.click('[data-k3d-rad="Plankenwand"]');
await p.waitForTimeout(800);
const auf = await p.evaluate(() => ({
  offen: !document.getElementById('k3dPlankenDialog').hidden,
  titel: (document.getElementById('k3dPlankenTitel') || {}).textContent || '',
  b: (document.getElementById('k3dPlankenB') || {}).value,
  kacheln: [...document.querySelectorAll('#k3dPlankenRichtung button')]
    .map((x) => x.getAttribute('data-richtung')),
  an: (document.querySelector('#k3dPlankenRichtung button.ist-an') || {})
    .getAttribute ? document.querySelector('#k3dPlankenRichtung button.ist-an')
      .getAttribute('data-richtung') : null,
}));
pruefe('Das Zahnrad oeffnet den Editor', auf.offen);
pruefe('Der Titel nennt die Seite', /linke Seite/.test(auf.titel), auf.titel);
pruefe('Beide Richtungen stehen zur Wahl',
  auf.kacheln.join(',') === 'waagerecht,hochkant', auf.kacheln.join(','));
pruefe('Waagerecht ist die Vorgabe', auf.an === 'waagerecht', String(auf.an));
pruefe('Die Breite kommt aus dem Modell', /^\d{3,5}$/.test(String(auf.b)), `B = ${auf.b}`);

/* ---------- Hochkant ---------- */
await leeren();
await p.evaluate(() =>
  document.querySelector('#k3dPlankenRichtung button[data-richtung="hochkant"]').click());
await p.waitForTimeout(1400);
const hk = await gebaut();
pruefe('Hochkant baut stehende Planken im Modell',
  !!hk && hk.richtung === 'hochkant' && hk.anzahl > 2,
  hk ? `${hk.richtung}, ${hk.anzahl} Planken` : 'nichts gebaut');
pruefe('Hochkant bekommt oben und unten eine Querschiene',
  !!hk && hk.schiene > 0, hk ? `Schiene ${hk.schiene} mm` : 'nichts gebaut');

/* ---------- Die Hoehe ---------- */
await leeren();
await tippe('#k3dPlankenH', '900');
await p.waitForTimeout(1400);
const h900 = await gebaut();
pruefe('Die eingetragene Hoehe kommt im Modell an',
  !!h900 && Math.abs(h900.hoehe - 900) <= 20,
  h900 ? `gebaut ${h900.hoehe} mm, erwartet 900` : 'nichts gebaut');

const platz = await p.evaluate(() => {
  const t = (document.getElementById('k3dPlankenHHinweis') || {}).textContent || '';
  const m = t.match(/(\d+) mm/);
  return m ? +m[1] : 0;
});
await leeren();
await tippe('#k3dPlankenH', String(platz + 1000));
await p.waitForTimeout(1400);
const zuHoch = await p.evaluate(() => +document.getElementById('k3dPlankenH').value);
const hMax = await gebaut();
pruefe('Eine zu grosse Hoehe wird auf den Platz begrenzt',
  platz > 0 && zuHoch === platz && !!hMax && Math.abs(hMax.hoehe - platz) <= 20,
  `Feld ${zuHoch}, Platz ${platz}, gebaut ${hMax ? hMax.hoehe : '-'}`);

/* ---------- Die Ruecktaste (derselbe iPhone-Fehler wie beim Keil) ---- */
await tippe('#k3dPlankenH', '900');
await p.waitForTimeout(600);
await p.locator('#k3dPlankenH').click({ timeout: 4000 }).catch(() => {});
await p.keyboard.press('End');
for (let i = 0; i < 4; i++) { await p.keyboard.press('Backspace'); await p.waitForTimeout(120); }
const nachLoeschen = await p.evaluate(() => document.getElementById('k3dPlankenH').value);
pruefe('Die Ruecktaste leert das Hoehenfeld wirklich',
  nachLoeschen === '', `im Feld steht "${nachLoeschen}"`);
await p.keyboard.type('50', { delay: 120 });
const beimTippen = await p.evaluate(() => document.getElementById('k3dPlankenH').value);
await p.evaluate(() => document.getElementById('k3dPlankenH').blur());
await p.waitForTimeout(900);
const beimVerlassen = await p.evaluate(() => document.getElementById('k3dPlankenH').value);
pruefe('Zu klein wird erst beim Verlassen berichtigt',
  beimTippen === '50' && +beimVerlassen >= 80,
  `beim Tippen "${beimTippen}", nach dem Verlassen "${beimVerlassen}"`);

/* ---------- Leer heisst: es gilt der Regler ---------- */
await leeren();
await tippe('#k3dPlankenH', '');
await p.waitForTimeout(1400);
const leer = await gebaut();
pruefe('Ein leeres Feld laesst dem Bedienfeld den Vortritt',
  !!leer && leer.hoehe > 0 && Math.abs(leer.hoehe - 900) > 20,
  leer ? `gebaut ${leer.hoehe} mm` : 'nichts gebaut');

/* ---------- Die Felder sehen aus wie die des Keils ---------- */
const rahmen = await p.evaluate(() =>
  ['k3dPlankenB', 'k3dPlankenH'].map((id) => {
    const c = getComputedStyle(document.getElementById(id));
    return [c.borderTopWidth, c.borderTopStyle, c.borderTopColor, c.borderTopLeftRadius].join('|');
  }));
pruefe('Beide Maszfelder tragen denselben Rahmen',
  new Set(rahmen).size === 1, rahmen.join('  /  '));
const einheiten = await p.evaluate(() =>
  ['k3dPlankenB', 'k3dPlankenH'].map((id) => {
    const e = document.getElementById(id).parentNode.querySelector('.k3d-bearb-einheit');
    return e && e.offsetParent !== null ? (e.textContent || '').trim() : '';
  }));
pruefe('Hinter jedem Maszfeld steht die Einheit',
  einheiten.every((t) => t === 'mm'), einheiten.join(', ') || 'keine');

/* ---------- Eine Hoehe aus einem ALTEN Link ----------
   Das Eingabefeld klemmt selbst, ueber die Oberflaeche kommt also nie
   ein zu grosser Wert an. Erreichbar ist der Fall nur ueber einen Link,
   der zu einem hoeheren Bau gehoerte - und dann MUSS die Zeichnung
   begrenzen, sonst steht die Wand durchs Dach. Darum wird der Plan
   direkt gesetzt, wie ein Link es tut. */
await leeren();
await p.evaluate(() => { if (window.__bvPlankenUeberhoch) window.__bvPlankenUeberhoch('links'); });
await p.evaluate(() => {
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Plankenwand"]');
  if (b) { b.click(); b.click(); }          // aus und wieder an: neu zeichnen
});
await p.waitForTimeout(1800);
const ueber = await gebaut();
pruefe('Eine Hoehe aus einem alten Link wird auf den Platz begrenzt',
  !!ueber && ueber.hoehe <= platz + 20,
  ueber ? `gebaut ${ueber.hoehe} mm, Platz ${platz}` : 'nichts gebaut');

/* ---------- Eigene Hoehe UND Prozentregler ----------
   Der Regler im Bedienfeld sagt, wie viel weggelassen wird. Stuende er
   zusaetzlich auf der eigenen Hoehe, zoege er ein zweites Mal ab: Aus
   900 mm wuerden rund 300. Zwei Mechanismen fuer dieselbe Zahl laufen
   immer auseinander - darum muss der Regler zurueckstehen, sobald eine
   Hoehe eingetragen ist. */
const reglerDa = await p.evaluate(() => {
  const f = document.getElementById('k3dPlankenHoeheAuto');
  const r = document.getElementById('k3dPlankenAnteil');
  if (!f || !r) return false;
  if (f.checked) { f.checked = false; f.dispatchEvent(new Event('change', { bubbles: true })); }
  r.value = '-66';
  r.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
});
await p.waitForTimeout(1200);
await p.evaluate(() => {
  const k = document.querySelector('[data-k3d-rad="Plankenwand"]');
  if (k) k.click();
});
await p.waitForTimeout(700);
await leeren();
await tippe('#k3dPlankenH', '900');
await p.waitForTimeout(1600);
const mitRegler = await gebaut();
pruefe('Der Regler zieht von der eigenen Hoehe nicht noch einmal ab',
  reglerDa && !!mitRegler && Math.abs(mitRegler.hoehe - 900) <= 20,
  reglerDa ? (mitRegler ? `gebaut ${mitRegler.hoehe} mm, erwartet 900` : 'nichts gebaut')
           : 'Regler im Bedienfeld nicht gefunden');

/* ---------- Der geteilte Link ----------
   Ein Plan, der den Link nicht uebersteht, geht dem Kunden beim
   Oeffnen stillschweigend verloren. Darum der ECHTE Rundlauf: teilen,
   Link in einem frischen Tab oeffnen, im Modell nachmessen. */
/* Richtung hier noch einmal setzen: Der Lesehaken fuer den "alten
   Link" weiter oben schreibt den GANZEN Plan neu, Richtung inbegriffen.
   Ohne das pruefte dieser Rundlauf eine Richtung, die vorher gar nicht
   gewaehlt war - und meldete einen Fehler, der keiner ist. */
await p.evaluate(() => {
  const b2 = document.querySelector('#k3dPlankenRichtung button[data-richtung="hochkant"]');
  if (b2) b2.click();
});
await p.waitForTimeout(1200);
await p.evaluate(() => { const d = document.getElementById('k3dPlankenDialog'); if (d) d.hidden = true; });
await p.evaluate(() => { const t = document.getElementById('k3dTeilen'); if (t) t.click(); });
await p.waitForTimeout(1200);
const link = await p.evaluate(() => (document.getElementById('k3dTeilenLink') || {}).value || '');
let ausLink = null;
if (link.indexOf('#k=') > -1) {
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => seitenfehler.push(String(e)));
  await p2.goto(link, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(2400);
  await p2.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
  await p2.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
  await p2.waitForTimeout(1400);
  ausLink = await p2.evaluate(() => (window.__bvPlanken || []).slice(-1)[0] || null);
}
pruefe('Richtung und Hoehe ueberstehen den geteilten Link',
  !!ausLink && ausLink.richtung === 'hochkant' && Math.abs(ausLink.hoehe - 900) <= 20,
  ausLink ? `${ausLink.richtung}, ${ausLink.hoehe} mm (erwartet hochkant, 900)`
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
  const b = document.querySelector('[data-k3d-erw="links"] button[data-erw="Plankenwand"]');
  if (b) b.click();
});
await ph.waitForTimeout(1600);
await ph.evaluate(() => {
  const k = document.querySelector('[data-k3d-rad="Plankenwand"]');
  if (k) k.click();
});
await ph.waitForTimeout(900);
const handyMass = await ph.evaluate(() => {
  const d = document.getElementById('k3dPlankenDialog');
  if (!d || d.hidden) return null;
  const r = d.getBoundingClientRect();
  return { breit: Math.round(r.width), hoch: Math.round(r.height),
           fenster: window.innerHeight,
           quer: document.documentElement.scrollWidth - window.innerWidth };
});
pruefe('Am Handy deckt der Dialog das ganze Fenster ab',
  !!handyMass && handyMass.hoch >= handyMass.fenster - 2,
  handyMass ? `${handyMass.breit} x ${handyMass.hoch} bei ${handyMass.fenster}` : 'Dialog zu');
pruefe('Am Handy kein waagerechtes Scrollen',
  !!handyMass && handyMass.quer <= 1, handyMass ? `${handyMass.quer} px` : '-');

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
