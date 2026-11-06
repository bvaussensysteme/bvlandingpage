#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prueft die zwei Angaben, die der Betreiber am 06.11.2026 bestellt
   hat:

   1. "Wenn der Kunde die Hoehe eingibt, soll er zusaetzlich auswaehlen
      koennen, auf welches Mass sich die Angabe bezieht ... damit
      spaeter eindeutig klar ist, welches Hoehenmass gemeint ist."
   2. "Bei der Auswahl der Fassadenart soll ein optionales Freitextfeld
      erscheinen ... So kann der Kunde direkt weitere Informationen zur
      Wand hinterlassen."

   GEPRUEFT WIRD BIS IN DIE ANFRAGE: Eine Angabe, die der Kunde macht
   und die niemanden erreicht, ist schlimmer als keine - er glaubt, er
   habe es gesagt. Darum wird nicht nur das Feld geprueft, sondern die
   Zusammenfassung, aus der die Anfrage gebaut wird, und der geteilte
   Link.

   Gegenprobe:  node scripts/pruefe-angaben-wand-hoehe.mjs --gegenprobe
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
const PORT = 8777;

function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const basis = '/opt/pw-browsers';
  if (!existsSync(basis)) return undefined;
  const o = readdirSync(basis).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? `${basis}/${o[o.length - 1]}/chrome-linux/chrome` : undefined;
}

const FEHLER = [
  /* Die Fassaden-Notiz erreicht die Anfrage nicht. */
  { von: "      if (Z.fassadeNotiz) teile.push('Zur Fassade: ' + Z.fassadeNotiz);",
    nach: "      void 0;" },
  /* Der Hoehenbezug erreicht die Anfrage nicht. */
  { von: "      teile.push('Höhenangabe bezieht sich auf: ' + hoeheBezugName());",
    nach: "      void 0;" },
  /* Der Name wird nicht aus der Auswahl gelesen, sondern bleibt der
     interne Schluessel - in der Anfrage stuende dann "wandOk". */
  { von: "        if (o.value === Z.hoeheBezug) txt = o.textContent.trim();",
    nach: "        void o;" },
  /* Der Freitext faellt unter den Tisch. */
  { von: "      txt += ' – ' + Z.hoeheBezugText;",
    nach: "      void 0;" },
  /* Das Freitextfeld wird nicht eingeblendet. */
  { von: "    if (feld) feld.hidden = !frei;",
    nach: "    if (feld) feld.hidden = true;" },
  /* Der Hinweis rechnet mit der falschen Profilhoehe. */
  { von: "    return Math.round(Z.hoeheHinten + WANDPROFIL.hoehe * 10);",
    nach: "    return Math.round(Z.hoeheHinten);" },
  /* Freitext faehrt im geteilten Link nicht mit. */
  { von: 'document.querySelectorAll(\'input[id^="k3d"], select[id^="k3d"], textarea[id^="k3d"]\'),',
    nach: 'document.querySelectorAll(\'input[id^="k3d"], select[id^="k3d"]\'),' },
];

/* Fehler im Anfrage-Assistenten (js/anfrage-wizard.js). Sie tragen
   wizard: true und werden nur dort eingebaut. */
FEHLER.push({
  wizard: true,
  /* Die Auswahl erscheint im Assistenten gar nicht. */
  von: "          selectField('awHoeheBezug', 'Worauf bezieht sich Ihre Höhenangabe? (optional)',\n"
     + "                      answers.hoehebezug || '', HOEHE_BEZUEGE) +",
  nach: "          '' +"
}, {
  wizard: true,
  /* Die Angabe erreicht die Anfrage nicht. */
  von: "      if (answers.hoehebezug) {\n"
     + "        p.push(['Höhenangabe bezieht sich auf', answers.hoehebezug\n"
     + "          + (answers.hoehebezug_text ? ' – ' + answers.hoehebezug_text : '')]);\n"
     + "      }",
  nach: "      void 0;"
}, {
  wizard: true,
  /* Der Wortlaut faellt auf den alten zurueck - dann fragen beide
     Konfiguratoren dasselbe mit verschiedenen Worten. */
  von: "Zusätzliche Angaben zur Fassade (optional)",
  nach: "Ergänzung zur Fassade (optional)"
});

const CSS_FEHLER = [
  /* Die versteckte Beschriftung steht trotzdem da - genau der Fehler,
     der am 06.11.2026 im Bild auffiel. */
  { von: '    .k3d-label[hidden] { display: none; }',
    nach: '' },
];

/* ---------- Die Gegenprobe faehrt JEDEN Fehler einzeln ----------
   Mit allen auf einmal verdecken sie sich gegenseitig: Wird die Auswahl
   gar nicht erst gezeichnet, koennen die Fehler daneben nichts mehr
   zeigen. Der Sammellauf meldete "11 eingebaut, 9 schlagen an" und
   behauptete, eine Pruefung sei blind - sie war es nicht (gemessen
   06.11.2026, jeder Fehler einzeln nachgefahren).

   Eine Gegenprobe, die falschen Alarm schlaegt, ist fast so schaedlich
   wie eine, die schweigt: Man gewoehnt sich an das Rot. Darum ruft sich
   dieses Skript selbst auf, einmal je Fehler, und urteilt erst danach.
   Mit BV_FEHLER=<n> bzw. BV_CSS_FEHLER=<n> laeuft einer allein, ohne
   diesen Umweg. */
if (GEGENPROBE && !EINZELN && !process.env.BV_KIND) {
  const { spawnSync } = await import('node:child_process');
  const selbst = new URL(import.meta.url).pathname;
  const alle = FEHLER.map((f, i) => ['BV_FEHLER', i, f.von])
    .concat(CSS_FEHLER.map((f, i) => ['BV_CSS_FEHLER', i, f.von]));
  console.log(`\n=== Höhenbezug und Fassaden-Notiz (GEGENPROBE, ${alle.length} Fehler einzeln) ===\n`);
  let blind = 0;
  for (const [schalter, nr, von] of alle) {
    const r = spawnSync(process.execPath, [selbst, '--gegenprobe'],
      { env: { ...process.env, [schalter]: String(nr), BV_KIND: '1' }, encoding: 'utf8' });
    const txt = (r.stdout || '') + (r.stderr || '');
    const roteZeilen = txt.split('\n').filter((z) => /^\s*FEHLER /.test(z));
    const marke = (schalter === 'BV_CSS_FEHLER' ? 'CSS ' : '') + nr;
    if (/ANKER VERALTET/.test(txt)) {
      console.log(`  ANKER   Fehler ${marke}: kam nicht an – Anker veraltet`);
      blind++;
    } else if (!roteZeilen.length) {
      console.log(`  BLIND   Fehler ${marke}: ${String(von).slice(0, 48).trim()}`);
      blind++;
    } else {
      console.log(`  scharf  Fehler ${marke} → ${roteZeilen.length} Pruefung(en): `
        + roteZeilen[0].replace(/^\s*FEHLER\s+/, '').slice(0, 58));
    }
  }
  console.log(`\nGegenprobe: ${alle.length} Fehler einzeln gefahren, ${blind} ohne Wirkung.`);
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
async function routenSetzen(zielCtx) {
  await zielCtx.route('**/*', async (route) => {
    const pfad = new URL(route.request().url()).pathname;
    const istJs = pfad.endsWith('/js/konfigurator-3d.js');
    const istSeite = pfad.endsWith('/konfigurator.html');
    const istWizard = pfad.endsWith('/js/anfrage-wizard.js');
    if (!istJs && !istSeite && !istWizard) return route.continue();
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
    if (istJs || istWizard) {
      if (GEGENPROBE && NUR_CSS == null) {
        (NUR == null ? FEHLER : [FEHLER[NUR]]).filter(Boolean)
          .filter((f) => (f.wizard ? istWizard : istJs))
          .forEach(anwenden);
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
  const panel = document.querySelector('.k3d-panel');
  if (panel) panel.classList.remove('k3d-gefuehrt');
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
});
await p.waitForTimeout(1400);

const setz = (id, wert) => p.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  if (!e) return false;
  e.value = w;
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}, [id, wert]);
const fassung = () => p.evaluate(() =>
  (document.getElementById('k3dZusammenfassung') || {}).textContent || '');

console.log(`\n=== Höhenbezug und Fassaden-Notiz ===${GEGENPROBE ? '  (GEGENPROBE – Fehler eingebaut)' : ''}\n`);

/* ---------- Die Auswahl selbst ---------- */
const auswahl = await p.evaluate(() => {
  const s = document.getElementById('k3dHoeheBezug');
  if (!s) return null;
  const hoehe = document.getElementById('k3dHoehe');
  return {
    werte: [...s.options].map((o) => o.value),
    namen: [...s.options].map((o) => o.textContent.trim()),
    stand: s.value,
    /* Sie muss BEIM Hoehenfeld stehen, nicht irgendwo: Eine Angabe,
       die man erst zwei Schritte weiter findet, bezieht niemand auf
       die Zahl, die er gerade getippt hat. */
    beiDerHoehe: !!(hoehe && hoehe.closest('.k3d-gruppe')
                    && hoehe.closest('.k3d-gruppe').contains(s)),
  };
});
pruefe('Die Auswahl gibt es', !!auswahl);
pruefe('Sie steht beim Höhenfeld, nicht woanders', !!auswahl && auswahl.beiDerHoehe);
pruefe('Drei Möglichkeiten, und die Vorgabe ist die Durchgangshöhe',
  !!auswahl && auswahl.werte.length === 3 && auswahl.stand === 'durchgang',
  auswahl ? auswahl.werte.join(', ') + ' – steht auf ' + auswahl.stand : '-');
pruefe('Die Namen sagen in Worten, was gemeint ist',
  !!auswahl && /Durchgangshöhe.*Unterkante/.test(auswahl.namen[0])
  && /Hauswand.*Oberkante/.test(auswahl.namen[1])
  && /Sonstiges/.test(auswahl.namen[2]),
  auswahl ? auswahl.namen.join(' | ') : '-');

/* Bei der Vorgabe steht nichts Zusaetzliches da - weder Hinweis noch
   Freitextfeld noch dessen Beschriftung. */
const vorgabe = await p.evaluate(() => ({
  hinweis: (document.getElementById('k3dHoeheBezugHinweis') || {}).textContent || '',
  feld: !!(document.getElementById('k3dHoeheBezugText') || {}).offsetParent,
  label: !!(document.getElementById('k3dHoeheBezugTextLabel') || {}).offsetParent,
}));
pruefe('Bei der Vorgabe steht kein zusätzlicher Hinweis',
  vorgabe.hinweis.trim() === '', vorgabe.hinweis.slice(0, 40));
pruefe('Und das Freitextfeld ist samt Beschriftung wirklich weg',
  !vorgabe.feld && !vorgabe.label,
  `Feld ${vorgabe.feld ? 'sichtbar' : 'weg'}, Beschriftung ${vorgabe.label ? 'sichtbar' : 'weg'}`);
pruefe('Die Vorgabe steht NICHT in der Anfrage',
  !/bezieht sich auf/.test(await fassung()),
  'eine Zeile, die immer dasteht, wird überlesen');

/* ---------- Oberkante Hauswand ---------- */
await setz('k3dHoeheBezug', 'wandOk');
await p.waitForTimeout(1400);
const wand = await p.evaluate(() => ({
  hinweis: (document.getElementById('k3dHoeheBezugHinweis') || {}).textContent || '',
  hinten: +((document.getElementById('k3dHoeheHintenZahl') || {}).value || 0),
}));
/* Die genannte Zahl muss die sein, die das Modell an dieser Stelle
   misst: Unterkante Wandprofil plus dessen Hoehe (143,6 mm, BELEGT). */
const erwartet = Math.round(wand.hinten + 143.6);
const genannt = +((wand.hinweis.match(/(\d{3,5})\s*mm/) || [])[1] || 0);
pruefe('Der Hinweis nennt das Maß, das das Modell an der Hauswand misst',
  genannt === erwartet,
  `genannt ${genannt} mm, Unterkante Wandprofil ${wand.hinten} mm + 143,6 = ${erwartet}`);
pruefe('Und er sagt dazu, dass das Feld oben die Durchgangshöhe ist',
  /Durchgangshöhe/.test(wand.hinweis), wand.hinweis.slice(0, 50));
pruefe('Die Wahl steht in der Anfrage, im Klartext',
  /bezieht sich auf: Maximale Höhe an der Hauswand/.test(await fassung()),
  (await fassung()).slice(-90));

/* ---------- Sonstiges ---------- */
await setz('k3dHoeheBezug', 'sonstiges');
await p.waitForTimeout(1200);
const frei = await p.evaluate(() => ({
  feld: !!(document.getElementById('k3dHoeheBezugText') || {}).offsetParent,
  label: !!(document.getElementById('k3dHoeheBezugTextLabel') || {}).offsetParent,
}));
pruefe('„Sonstiges" blendet Feld und Beschriftung ein',
  frei.feld && frei.label,
  `Feld ${frei.feld ? 'da' : 'fehlt'}, Beschriftung ${frei.label ? 'da' : 'fehlt'}`);
await setz('k3dHoeheBezugText', 'Oberkante Mauerabdeckung');
await p.waitForTimeout(1200);
pruefe('Der Freitext steht in der Anfrage',
  /Oberkante Mauerabdeckung/.test(await fassung()), (await fassung()).slice(-90));

/* ---------- Fassaden-Notiz ---------- */
const notiz = await p.evaluate(() => {
  const t = document.getElementById('k3dFassadeNotiz');
  if (!t) return null;
  const lab = document.querySelector('label[for="k3dFassadeNotiz"]');
  const grp = t.closest('.k3d-gruppe');
  const seg = grp && grp.querySelector('[data-k3d-seg="k3dFassade"]');
  return { platz: t.placeholder, text: lab ? lab.textContent.trim() : '',
           beiDerFassade: !!seg, pflicht: t.required };
});
pruefe('Das Notizfeld steht bei der Fassadenauswahl', !!notiz && notiz.beiDerFassade);
pruefe('Beschriftung und Platzhalter sind die bestellten',
  !!notiz && notiz.text === 'Zusätzliche Angaben zur Fassade (optional)'
  && /Wanddämmung, Dämmstärke oder Mauerwerk/.test(notiz.platz),
  notiz ? `"${notiz.text}" / "${notiz.platz}"` : '-');
pruefe('Es ist optional, kein Pflichtfeld', !!notiz && !notiz.pflicht);

await setz('k3dFassadeNotiz', '120 mm WDVS, dahinter Kalksandstein');
await p.waitForTimeout(1400);
pruefe('Die Notiz steht in der Anfrage',
  /Zur Fassade: 120 mm WDVS, dahinter Kalksandstein/.test(await fassung()),
  (await fassung()).slice(-110));

/* ---------- Der geteilte Link ----------
   Eine Angabe, die der Kunde macht und die beim Oeffnen des Links weg
   ist, hat er trotzdem gemacht - er merkt es nur nicht. */
await p.evaluate(() => { const t = document.getElementById('k3dTeilen'); if (t) t.click(); });
await p.waitForTimeout(1300);
const link = await p.evaluate(() => (document.getElementById('k3dTeilenLink') || {}).value || '');
let ausLink = null;
if (link.indexOf('#k=') > -1) {
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => seitenfehler.push(String(e)));
  await p2.goto(link, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(2600);
  await p2.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 4000 }).catch(() => {});
  await p2.locator('#k3dTestOk').click({ timeout: 4000 }).catch(() => {});
  await p2.waitForTimeout(1600);
  ausLink = await p2.evaluate(() => ({
    bezug: (document.getElementById('k3dHoeheBezug') || {}).value,
    text: (document.getElementById('k3dHoeheBezugText') || {}).value,
    notiz: (document.getElementById('k3dFassadeNotiz') || {}).value,
  }));
}
pruefe('Beide Angaben überstehen den geteilten Link',
  !!ausLink && ausLink.bezug === 'sonstiges'
  && /Oberkante Mauerabdeckung/.test(ausLink.text || '')
  && /WDVS/.test(ausLink.notiz || ''),
  ausLink ? `Bezug "${ausLink.bezug}", Text "${ausLink.text}", Notiz "${(ausLink.notiz || '').slice(0, 24)}"`
          : 'kein Link erzeugt');

/* ================= Dasselbe im Anfrage-Assistenten =================
   "also mit konfigurator meinte ich nicht nur den 3d konfigurator
   sondern unseren auf der webseite auch" (Betreiber, 06.11.2026). */

/* ---------- Die Namen muessen Wort fuer Wort uebereinstimmen ----------
   Der 3D-Konfigurator uebergibt seine Wahl an das Feld im Assistenten.
   Was dort nicht genau passt, landet auf "Bitte waehlen ..." - und die
   Angabe waere stillschweigend weg. Darum hier gegen den QUELLTEXT
   beider Seiten geprueft, nicht gegen eine dritte Liste im Test. */
{
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(WURZEL + 'konfigurator.html', 'utf8');
  const wiz = readFileSync(WURZEL + 'js/anfrage-wizard.js', 'utf8');
  const ausHtml = [...html.matchAll(/<option value="(?:durchgang|wandOk|sonstiges)">([^<]+)<\/option>/g)]
    .map((m) => m[1].trim());
  const block = (wiz.match(/var HOEHE_BEZUEGE = \[([\s\S]*?)\];/) || [])[1] || '';
  const ausWiz = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  pruefe('Beide Konfiguratoren nennen dieselben drei Bezüge, Wort für Wort',
    ausHtml.length === 3 && ausHtml.join('|') === ausWiz.join('|'),
    '3D: ' + ausHtml.join(' / ') + '   Assistent: ' + ausWiz.join(' / '));
}

/* ---------- Im Assistenten selbst ---------- */
const pw = await ctx.newPage();
pw.on('pageerror', (e) => seitenfehler.push(String(e)));
await pw.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await pw.waitForTimeout(1500);
/* Durchklicken, bis der Schritt mit den Maszen da ist: auf jedem
   Schritt die erste Karte waehlen, falls noch nichts gewaehlt ist. */
let gefunden = false;
let fassadeWortlaut = null;
for (let i = 0; i < 9 && !gefunden; i++) {
  /* Im Vorbeigehen den Wortlaut der Fassaden-Notiz mitlesen - der
     Schritt liegt vor den Maszen. */
  if (!fassadeWortlaut) {
    fassadeWortlaut = await pw.evaluate(() => {
      const t = document.getElementById('fassadeText');
      if (!t) return null;
      const l = document.querySelector('label[for="fassadeText"]');
      return { text: l ? l.textContent.trim() : '', platz: t.placeholder };
    });
  }
  gefunden = await pw.evaluate(() => !!document.getElementById('awHoeheBezug'));
  if (gefunden) break;
  await pw.evaluate(() => {
    /* In JEDER Kartengruppe die erste waehlen, in der noch nichts
       gewaehlt ist - nicht nur einmal je Schritt. Die Eindeckung fragt
       zum Beispiel Glasart UND Glasstaerke; mit nur einem Klick blieb
       der Test dort haengen (gemessen 06.11.2026). */
    [...document.querySelectorAll('#awBody .aw-options, #awBody .aw-subchoice')]
      .forEach((grp) => {
        const k = [...grp.querySelectorAll('.aw-option')];
        if (k.length && !grp.querySelector('.aw-option.is-active')) k[0].click();
      });
    const lose = [...document.querySelectorAll('#awBody .aw-option')]
      .filter((e) => !e.closest('.aw-options') && !e.closest('.aw-subchoice'));
    if (lose.length && !lose.some((e) => e.classList.contains('is-active'))) lose[0].click();
    /* Die Glasstaerke sind keine Karten, sondern Pillen (.aw-pill mit
       data-pill). Ohne sie blieb der Test bei "Bitte waehlen Sie die
       Glasstaerke" stehen - ein Schritt, der mit Karten allein nicht zu
       beantworten ist. */
    const felder = {};
    [...document.querySelectorAll('#awBody [data-pill]')].forEach((b2) => {
      const f2 = b2.getAttribute('data-pill');
      (felder[f2] = felder[f2] || []).push(b2);
    });
    Object.keys(felder).forEach((f2) => {
      const g = felder[f2];
      if (!g.some((b2) => b2.classList.contains('is-active'))) g[0].click();
    });
  });
  await pw.waitForTimeout(350);
  await pw.locator('#awNext').click({ timeout: 4000 }).catch(() => {});
  await pw.waitForTimeout(650);
}
pruefe('Im Assistenten gibt es die Auswahl beim Maßschritt', gefunden,
  gefunden ? '' : 'in neun Schritten nicht gefunden');

if (gefunden) {
  const wizWahl = await pw.evaluate(() => {
    const s2 = document.getElementById('awHoeheBezug');
    const dims = document.querySelector('#awBody .aw-dims');
    return {
      namen: [...s2.options].slice(1).map((o) => o.textContent.trim()),
      vorgabe: s2.value,
      /* Sie muss BEI den Maßen stehen, nicht in einem anderen Schritt. */
      beiDenMassen: !!(dims && dims.parentNode && dims.parentNode.contains(s2)),
    };
  });
  pruefe('Sie steht bei den Maßen', wizWahl.beiDenMassen);
  pruefe('Nichts ist vorausgewählt',
    wizWahl.vorgabe === '',
    'eine vorgewählte Antwort legte dem Kunden etwas in den Mund');
  pruefe('Die drei Möglichkeiten stehen zur Wahl',
    wizWahl.namen.length === 3, wizWahl.namen.join(' | '));

  await pw.evaluate(() => {
    const s2 = document.getElementById('awHoeheBezug');
    s2.value = 'Sonstiges';
    s2.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pw.waitForTimeout(900);
  const freiDa = await pw.evaluate(() => !!document.getElementById('awHoeheBezugText'));
  pruefe('„Sonstiges" blendet auch hier ein Freitextfeld ein', freiDa);
  if (freiDa) {
    await pw.evaluate(() => {
      const t = document.getElementById('awHoeheBezugText');
      t.value = 'Oberkante Mauerabdeckung';
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  /* Masse eintragen, damit der Schritt weitergeht. */
  await pw.evaluate(() => {
    [['aw_breite', '4000'], ['aw_tiefe', '3000'], ['aw_hoehe', '2500']].forEach(([id, v]) => {
      const e = document.getElementById(id);
      if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
    });
  });
  await pw.waitForTimeout(400);
  /* Bis zur Zusammenfassung weiterklicken. */
  let fassungTxt = '';
  for (let i = 0; i < 12; i++) {
    await pw.evaluate(() => {
      /* In JEDER Kartengruppe die erste waehlen, in der noch nichts
         gewaehlt ist - nicht nur einmal je Schritt. Die Eindeckung fragt
         zum Beispiel Glasart UND Glasstaerke; mit nur einem Klick blieb
         der Test dort haengen (gemessen 06.11.2026). */
      [...document.querySelectorAll('#awBody .aw-options, #awBody .aw-subchoice')]
        .forEach((grp) => {
          const k = [...grp.querySelectorAll('.aw-option')];
          if (k.length && !grp.querySelector('.aw-option.is-active')) k[0].click();
        });
      const lose = [...document.querySelectorAll('#awBody .aw-option')]
        .filter((e) => !e.closest('.aw-options') && !e.closest('.aw-subchoice'));
      if (lose.length && !lose.some((e) => e.classList.contains('is-active'))) lose[0].click();
      /* Die Glasstaerke sind keine Karten, sondern Pillen (.aw-pill mit
         data-pill). Ohne sie blieb der Test bei "Bitte waehlen Sie die
         Glasstaerke" stehen - ein Schritt, der mit Karten allein nicht zu
         beantworten ist. */
      const felder = {};
      [...document.querySelectorAll('#awBody [data-pill]')].forEach((b2) => {
        const f2 = b2.getAttribute('data-pill');
        (felder[f2] = felder[f2] || []).push(b2);
      });
      Object.keys(felder).forEach((f2) => {
        const g = felder[f2];
        if (!g.some((b2) => b2.classList.contains('is-active'))) g[0].click();
      });
      /* Der Kontaktschritt laesst sich ohne Angaben nicht verlassen -
         ohne ihn kaeme der Test nie bis zur Zusammenfassung, und genau
         die soll hier geprueft werden. Erfundene, aber gueltige Daten;
         abgeschickt wird nichts. */
      [...document.querySelectorAll('#awBody input, #awBody select')].forEach((e) => {
        if (e.type === 'hidden' || e.value) return;
        if (e.tagName === 'SELECT') {
          const opt = [...e.options].find((o) => o.value);
          if (opt) { e.value = opt.value; e.dispatchEvent(new Event('change', { bubbles: true })); }
          return;
        }
        const n = (e.id + ' ' + (e.name || '') + ' ' + (e.type || '')).toLowerCase();
        /* Eine Adresse, die die Fake-Erkennung des Assistenten
           durchlaesst - "example.org" tut sie nicht, und der Test kam
           damit nie ueber den Kontaktschritt hinaus. */
        e.value = /mail/.test(n) ? 'a.mueller@web.de'
                : /tel|phone/.test(n) ? '02601 1234567'
                : /plz|zip/.test(n) ? '56410'
                : /ort|city/.test(n) ? 'Montabaur'
                : /name/.test(n) ? 'Mueller'
                : e.type === 'number' ? '1'
                : 'Pruefung';
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true }));
      });
      /* Die Zustimmung zur Datenschutzerklaerung ist Pflicht - ohne sie
         kommt der Test nie zur Zusammenfassung. GEKLICKT, nicht
         gesetzt: Das Haekchen haengt an einem Klick-Lauscher, ein
         gesetztes .checked allein erreicht ihn nicht. */
      [...document.querySelectorAll('#awBody input[type=checkbox]')].forEach((c) => {
        if (!c.checked) c.click();
      });
    });
    await pw.waitForTimeout(350);
    await pw.locator('#awNext').click({ timeout: 4000 }).catch(() => {});
    await pw.waitForTimeout(600);
    fassungTxt = await pw.evaluate(() => (document.getElementById('awBody') || {}).textContent || '');
    if (/Höhenangabe bezieht sich auf/.test(fassungTxt)) break;
  }
  /* Wo der Test haengen blieb, gehoert in den Beleg - sonst steht da
     "nicht gefunden" und man sucht an der falschen Stelle. */
  const standEnde = await pw.evaluate(() => ({
    titel: ((document.querySelector('#awTitle, #awBody h2, #awBody h3') || {}).textContent || '').trim(),
    fehler: ((document.querySelector('.aw-error, #awError') || {}).textContent || '').trim(),
  }));
  pruefe('Die Angabe steht in der Zusammenfassung des Assistenten',
    /Höhenangabe bezieht sich auf/.test(fassungTxt)
    && /Oberkante Mauerabdeckung/.test(fassungTxt),
    `zuletzt bei "${standEnde.titel}"`
    + (standEnde.fehler ? ', Meldung: ' + standEnde.fehler : ''));
}

/* ---------- Der Wortlaut bei der Fassade ----------
   GEPRUEFT WIRD, WAS DER KUNDE SIEHT, nicht die Datei auf der Platte:
   Beim ersten Anlauf las diese Pruefung den Quelltext und war damit
   blind - der eingebaute Fehler kommt durch den Browser (06.11.2026). */
pruefe('Der Assistent fragt die Fassaden-Notiz mit denselben Worten',
  !!fassadeWortlaut
  && fassadeWortlaut.text === 'Zusätzliche Angaben zur Fassade (optional)'
  && /Wanddämmung, Dämmstärke oder Mauerwerk/.test(fassadeWortlaut.platz),
  fassadeWortlaut
    ? `"${fassadeWortlaut.text}" / "${fassadeWortlaut.platz}"`
    : 'Fassadenschritt nicht erreicht');

pruefe('Keine Fehler im Browser', seitenfehler.length === 0, seitenfehler.slice(0, 2).join(' | '));

/* ---------- Am Handy ----------
   Ein Textfeld unter 16 px laesst iOS beim Antippen hineinzoomen, und
   der Zoom geht von allein nicht wieder weg - derselbe Fehler, den der
   Betreiber am 05.11.2026 am RAL-Suchfeld gemeldet hat. */
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
  const panel = document.querySelector('.k3d-panel');
  if (panel) panel.classList.remove('k3d-gefuehrt');
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
  const s = document.getElementById('k3dHoeheBezug');
  if (s) { s.value = 'sonstiges'; s.dispatchEvent(new Event('change', { bubbles: true })); }
});
await ph.waitForTimeout(1400);
const handyMass = await ph.evaluate(() => {
  const gr = (id) => {
    const e = document.getElementById(id);
    return e ? parseFloat(getComputedStyle(e).fontSize) : 0;
  };
  return { notiz: gr('k3dFassadeNotiz'), frei: gr('k3dHoeheBezugText'),
           wahl: gr('k3dHoeheBezug'),
           quer: document.documentElement.scrollWidth - window.innerWidth };
});
pruefe('Am Handy sind die Textfelder mindestens 16 px gross',
  handyMass.notiz >= 16 && handyMass.frei >= 16 && handyMass.wahl >= 16,
  `Notiz ${handyMass.notiz}, Freitext ${handyMass.frei}, Auswahl ${handyMass.wahl}`);
pruefe('Am Handy kein waagerechtes Scrollen', handyMass.quer <= 1, `${handyMass.quer} px`);

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
