#!/usr/bin/env node
/* ============================================================
   DAS EINWILLIGUNGSFENSTER (COOKIE-BANNER)

   ANLASS (23.11.2026). Ansage des Betreibers: das Fenster solle so
   gebaut sein, "das leute einfach alles akzeptieren druecken weil die
   kb haben inn die einstellungen etc zu gehen", und zwar "alles im
   legalen rahmen". Beides zusammen geht nur bis zu einer klaren
   Grenze, und die ist messbar. Diese Pruefung zieht sie.

   WAS HIER GEPRUEFT WIRD UND WARUM AUSGERECHNET DAS.

   Eine Einwilligung ist nur wirksam, wenn sie freiwillig und ohne
   Nachteil verweigert werden kann (Art. 4 Nr. 11 und Art. 7 DSGVO,
   dazu § 25 TDDDG fuer das Speichern auf dem Geraet). Daraus folgen
   drei Dinge, die sich in Pixeln nachmessen lassen:

     1. Ablehnen muss mit EINEM Klick gehen, auf derselben Ebene wie
        Annehmen. Ein Weg ueber "Einstellungen" zaehlt nicht.
     2. Beide Knoepfe muessen gleich auffaellig sein: gleiche Groesse,
        gleiche Schrift, beide lesbar. Der kleinere, blassere oder
        ausgegraute Ablehnen-Knopf ist der haeufigste Abmahngrund bei
        Cookie-Fenstern.
     3. Vorangekreuzt werden darf nichts. Ein Haken, der schon drin
        ist, ist keine Handlung des Besuchers.

   WAS HIER NICHT GEPRUEFT WIRD: ob die Texte inhaltlich reichen, ob
   die Dienste richtig benannt sind, ob die Datenschutzerklaerung
   dazu passt. Das ist Sache des Anwalts. Diese Pruefung misst die
   Form, nicht den Inhalt, und ersetzt keine Rechtsberatung.

   WER DIESE PRUEFUNG REISST, AENDERT DIE RECHTSLAGE MIT. Sie darf
   nicht "angepasst" werden, damit sie wieder gruen wird. Wenn die
   Gestaltung sich aendern soll, gehoert das vorher besprochen.

   Aufruf:  node scripts/pruefe-einwilligung.mjs [--gegenprobe]
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8961 + (GEGENPROBE ? 1 : 0);
const SEITE = '/index.html';

/* Zwei eingebaute Fehler, in ZWEI VERSCHIEDENEN Dateien. Beide sind
 * genau das, was in echten Abmahnungen steht. */
const FEHLER = [
  /* Die ausgelieferte CSS-Datei ist zusammengepresst: dort steht
   * ".cb-btn--necessary{" ohne Leerzeichen. Mit dem Leerzeichen fand
   * die Gegenprobe am 23.11.2026 nichts und baute nur einen der zwei
   * Fehler ein. */
  ['css/style.css',
   '.cb-btn--necessary{',
   '.cb-btn--necessary{transform:scale(0.72);opacity:0.55;',
   'Ablehnen kleiner und blasser'],
  ['js/cookie.js',
   "id=\"cbAnalytics\"",
   "id=\"cbAnalytics\" checked",
   'Haken schon gesetzt'],
];

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromePfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const ergebnisse = [];
const melde = (ok, name, text) => ergebnisse.push({ ok, name, text });

const IM_BROWSER = `(() => {
  const rgb = (x) => (String(x).match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
  const alpha = (x) => { const m = String(x).match(/[\\d.]+/g); return m && m.length > 3 ? +m[3] : 1; };
  const lum = (c) => { const f = c.map((v) => { v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const kontrast = (a, b) => { const l1 = lum(a), l2 = lum(b);
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100; };
  const misch = (v, a, h) => [0, 1, 2].map((i) => Math.round(v[i] * a + h[i] * (1 - a)));

  const kasten = document.querySelector('.cb-inner');
  if (!kasten) return { fehlt: true };
  const grund = rgb(getComputedStyle(kasten).backgroundColor);
  const masse = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const a = alpha(cs.backgroundColor);
    const flaeche = a === 0 ? grund : misch(rgb(cs.backgroundColor), a, grund);
    return {
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim(),
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      schrift: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      gewicht: parseInt(cs.fontWeight, 10) || 400,
      deckkraft: Math.round(parseFloat(cs.opacity) * 100) / 100,
      kontrast: kontrast(rgb(cs.color), flaeche),
      sichtbar: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 2 && r.height > 2,
    };
  };
  const knoepfe = [...kasten.querySelectorAll('button')];
  const finde = (rx) => knoepfe.find((b) => rx.test((b.textContent || '').trim()));
  const ab = finde(/^(Nur notwendige|Ablehnen|Alle ablehnen)$/i);
  const an = finde(/^Alle akzeptieren$/i);

  /* Reihenfolge im Quelltext: Verweigern darf nicht hinter dem
     Annehmen versteckt sein. */
  const reihenfolge = ab && an
    ? (ab.compareDocumentPosition(an) & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING
    : false;

  /* Vorangekreuzte Kaestchen im Einstellungsteil. */
  const kaestchen = [...kasten.querySelectorAll('input[type="checkbox"]')]
    .filter((c) => !c.disabled)
    .map((c) => ({ id: c.id || '(ohne id)', an: c.checked }));

  return {
    fehlt: false,
    ablehnen: ab ? masse(ab) : null,
    annehmen: an ? masse(an) : null,
    reihenfolge,
    kaestchen,
    vorangekreuzt: kaestchen.filter((c) => c.an).map((c) => c.id),
    anzahlKnoepfeOben: kasten.querySelectorAll('.cb-actions button').length,
  };
})()`;

async function lauf() {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)],
    { cwd: WURZEL, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const br = await chromium.launch({ executablePath: chromePfad(), args: ['--no-sandbox'] });
  try {
    for (const [name, w, mob] of [['Rechner', 1280, false], ['Handy', 390, true]]) {
      const c = await br.newContext({ viewport: { width: w, height: 900 },
        isMobile: mob, hasTouch: mob });
      const p = await c.newPage();
      await p.goto(`http://127.0.0.1:${PORT}${SEITE}`, { waitUntil: 'load' });
      await p.waitForTimeout(2200);
      const d = await p.evaluate(IM_BROWSER);

      if (d.fehlt) {
        melde(false, `${name}: Fenster erscheint`, 'kein .cb-inner gefunden');
        await c.close();
        continue;
      }
      melde(true, `${name}: Fenster erscheint`, 'beim ersten Besuch da');
      melde(!!d.ablehnen && d.ablehnen.sichtbar, `${name}: Ablehnen in einem Klick`,
        d.ablehnen ? `"${d.ablehnen.text}"` : 'kein Ablehnen-Knopf auf der ersten Ebene');
      melde(!!d.annehmen && d.annehmen.sichtbar, `${name}: Annehmen in einem Klick`,
        d.annehmen ? `"${d.annehmen.text}"` : 'kein Annehmen-Knopf');

      if (d.ablehnen && d.annehmen) {
        const ab = d.ablehnen, an = d.annehmen;
        const breiteGleich = Math.abs(ab.breite - an.breite) <= Math.max(4, an.breite * 0.05);
        melde(breiteGleich, `${name}: Gleiche Breite`,
          `Ablehnen ${ab.breite} px, Annehmen ${an.breite} px`);
        melde(Math.abs(ab.hoehe - an.hoehe) <= 3, `${name}: Gleiche Hoehe`,
          `${ab.hoehe} px gegen ${an.hoehe} px`);
        melde(Math.abs(ab.schrift - an.schrift) <= 0.6 && Math.abs(ab.gewicht - an.gewicht) <= 50,
          `${name}: Gleiche Schrift`,
          `${ab.schrift} px / ${ab.gewicht} gegen ${an.schrift} px / ${an.gewicht}`);
        melde(ab.deckkraft >= 0.99, `${name}: Ablehnen nicht ausgegraut`,
          `Deckkraft ${ab.deckkraft}`);
        melde(ab.kontrast >= 4.5, `${name}: Ablehnen lesbar`, `${ab.kontrast}:1 (Soll 4,5)`);
        melde(an.kontrast >= 4.5, `${name}: Annehmen lesbar`, `${an.kontrast}:1 (Soll 4,5)`);
        melde(Math.min(ab.hoehe, an.hoehe) >= 44, `${name}: Tippflaeche 44 px`,
          `kleinste Hoehe ${Math.min(ab.hoehe, an.hoehe)} px`);
        melde(d.reihenfolge, `${name}: Ablehnen steht zuerst`,
          d.reihenfolge ? 'vor dem Annehmen' : 'erst nach dem Annehmen');
      }
      melde(d.vorangekreuzt.length === 0, `${name}: Nichts vorangekreuzt`,
        d.vorangekreuzt.length ? `gesetzt: ${d.vorangekreuzt.join(', ')}`
                               : `${d.kaestchen.length} Kaestchen, alle leer`);
      await c.close();
    }
  } finally {
    await br.close();
    srv.kill();
  }
}

/* ── Gegenprobe ───────────────────────────────────────────────── */
const gesichert = [];
let eingebaut = 0;
if (GEGENPROBE) {
  for (const [datei, alt, neu, was] of FEHLER) {
    const pfad = join(WURZEL, datei);
    const vor = readFileSync(pfad, 'utf8');
    if (!vor.includes(alt)) { console.error('  ACHTUNG: Stelle nicht gefunden in', datei, '(' + was + ')'); continue; }
    gesichert.push([pfad, vor]);
    writeFileSync(pfad, vor.replace(alt, neu));
    eingebaut++;
  }
}

try {
  await lauf();
} finally {
  for (const [pfad, vor] of gesichert) writeFileSync(pfad, vor);
}

const schlecht = ergebnisse.filter((e) => !e.ok);
console.log(GEGENPROBE ? `\nGegenprobe: ${eingebaut} eingebaute Fehler\n`
                       : '\nEinwilligungsfenster auf der Startseite\n');
ergebnisse.forEach((e) =>
  console.log(`  ${e.ok ? 'ok    ' : 'FEHLER'}  ${e.name.padEnd(34)} ${e.text}`));
console.log('');
if (GEGENPROBE) {
  console.log(`${schlecht.length} Beanstandungen bei ${eingebaut} eingebauten Fehlern.`);
  const ok = schlecht.length >= eingebaut && eingebaut === FEHLER.length;
  console.log(ok ? 'Gegenprobe bestanden: jeder eingebaute Fehler faellt auf.'
                 : 'Gegenprobe NICHT bestanden.');
  process.exit(ok ? 0 : 1);
}
console.log(schlecht.length ? `Ergebnis: ${schlecht.length} Beanstandung(en)`
                            : 'Ergebnis: bestanden');
process.exit(schlecht.length ? 1 : 0);
