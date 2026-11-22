#!/usr/bin/env node
/* Prueft: Laeuft sichtbarer Text aus seinem Kasten heraus?
 *
 * Hintergrund: Am 14.11.2026 stand im Kopf von sieben Ortsseiten bei
 * 390 px "Terrassenueberdach" und dann nichts mehr. Die Ueberschrift
 * brauchte 451 px in einem 362 px breiten Kasten. Die Seite scrollte
 * dabei NICHT waagerecht, es gab also kein Zeichen, dass etwas fehlt.
 * Gefunden hat es ein Pruefer von Hand; keine der 56 Pruefungen sah es.
 *
 * Deutsche Komposita sind lang. Diese Pruefung gehoert deshalb
 * dauerhaft dazu und nicht nur einmal nach dem Vorfall.
 *
 * Gemessen wird scrollWidth gegen clientWidth je Element. Ein Element
 * gilt als beschnitten, wenn sein Inhalt breiter ist als sein Kasten
 * UND der Ueberhang nicht gewollt ist (Scrollbereiche sind ausgenommen,
 * siehe AUSGENOMMEN unten).
 *
 * Gegenprobe: node scripts/pruefe-umbruch.mjs --gegenprobe
 * setzt eine Ueberschrift auf eine Groesse, bei der sie nicht mehr
 * passt, und erwartet, dass die Pruefung anschlaegt.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const PORT = 8841;
const BREITEN = [320, 390];
const gegenprobe = process.argv.includes('--gegenprobe');

/* AUSGENOMMEN: Elemente, deren Ueberhang Absicht ist. Ein waagerecht
 * scrollbarer Kasten (Tabelle, Bildergalerie) ist kein Fehler, sondern
 * eine Bedienidee. Erkannt wird das an overflow-x. */
const SELEKTOR = 'h1, h2, h3, h4, button, .btn, a.btn, .leistung-link, label, strong';

function seiten() {
  const liste = [];
  for (const d of ['.', 'produkte', 'ratgeber']) {
    const pfad = join(WURZEL, d);
    if (!existsSync(pfad)) continue;
    for (const f of readdirSync(pfad)) {
      if (!f.endsWith('.html')) continue;
      if (f.startsWith('entwurf') || f === '_template.html' || f === 'vorschau.html') continue;
      liste.push(d === '.' ? f : `${d}/${f}`);
    }
  }
  return liste.sort();
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: WURZEL, stdio: 'ignore' });
process.on('exit', () => server.kill());
await new Promise((r) => setTimeout(r, 900));

function messung(sel) {
  const raus = [];
  for (const n of document.querySelectorAll(sel)) {
    const stil = getComputedStyle(n);
    if (stil.display === 'none' || stil.visibility === 'hidden') continue;
    if (!n.offsetParent && stil.position !== 'fixed') continue;
    /* Gewollter Scrollbereich: am Element selbst oder an einem Elternteil */
    let gewollt = false;
    for (let e = n; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') { gewollt = true; break; }
    }
    if (gewollt) continue;
    /* Absichtlich versteckte Kaesten ueberspringen. Die Marken-Leiste im
       3D-Modell (.k3d-marken) ist 1x1 px gross mit overflow:hidden und
       clip-path, und klappt erst bei Tastaturfokus auf. Ihre Knoepfe sind
       dann natuerlich "beschnitten". Das ist das uebliche Muster fuer
       Sprunglinks und Screenreader-Hilfen, kein Fehler. Ohne diese
       Ausnahme meldete die Pruefung am 14.11.2026 zehn solcher Faelle. */
    let versteckt = false;
    for (let e = n; e && e !== document.body; e = e.parentElement) {
      const s2 = getComputedStyle(e);
      const winzig = e.clientWidth <= 1 || e.clientHeight <= 1;
      if ((winzig && s2.overflow !== 'visible') || /inset\(\s*50%/.test(s2.clipPath)) {
        versteckt = true; break;
      }
    }
    if (versteckt) continue;
    /* Nur Elemente, die ueberhaupt Text zeigen. Ein reiner Symbolknopf,
       dessen Grafik absichtlich ueber den Rand ragt, ist kein
       beschnittener Text. Pseudoelemente zaehlen mit: .k3d-marke traegt
       seine Beschriftung ueber ::after und waere sonst unsichtbar fuer
       diese Pruefung. */
    const pseudo = getComputedStyle(n, '::after').content + getComputedStyle(n, '::before').content;
    const hatText = (n.innerText || '').trim() !== '' || /[a-zA-Z0-9äöüÄÖÜß]/.test(pseudo);
    if (!hatText) continue;
    if (n.scrollWidth - n.clientWidth > 2) {
      raus.push({
        tag: n.tagName.toLowerCase(),
        text: (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 55),
        inhalt: n.scrollWidth, kasten: n.clientWidth
      });
    }
  }
  return raus;
}

/* ---------------------------------------------------------------
   WORTWAISEN (22.11.2026)

   ANLASS. Ansage des Betreibers zu "10 J. Alu · 5 J. Markisen":
   "achte bitte auf solche umbrueche die sind maximal ass lass es
   pruefen die ganze seite". Auf dem Bildschirmabzug stand dort
   "10 J. Alu · 5 J." und darunter allein "Markisen".

   Das ist kein Ueberlauf, die Pruefung oben sah es deshalb nicht.
   Gemessen wird hier der UMBRUCH selbst: Ein Textstueck wird Zeile
   fuer Zeile ausgemessen (Range.getClientRects liefert je Zeile ein
   Rechteck). Bleibt auf der letzten Zeile ein einzelnes Wort stehen,
   das schmaler ist als ein Viertel der breitesten Zeile, gilt das
   als Waise.

   WARUM EIN VIERTEL. Gemessen an den vorhandenen Ueberschriften:
   Ein normaler Flattersatz endet selten unter 30 Prozent. Die
   Schwelle faengt die auffaelligen Faelle und laesst gewollte
   kurze Schlusszeilen in Ruhe. Die Zahl ist gesetzt, nicht
   errechnet, und darf angepasst werden, wenn sie zu viel meldet.
   --------------------------------------------------------------- */
function waisen(sel) {
  const raus = [];
  for (const n of document.querySelectorAll(sel)) {
    const stil = getComputedStyle(n);
    if (stil.display === 'none' || stil.visibility === 'hidden') continue;
    if (!n.offsetParent && stil.position !== 'fixed') continue;
    const text = (n.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length < 8) continue;
    /* Nur Elemente, deren Text direkt darin steht. Sonst misst man
       ein Sammelelement und bekommt dessen Kinder als "Zeilen". */
    const nurText = Array.prototype.every.call(n.childNodes,
      (k) => k.nodeType === 3 || k.nodeName === 'BR' || k.nodeName === 'SPAN'
             || k.nodeName === 'STRONG' || k.nodeName === 'EM' || k.nodeName === 'B');
    if (!nurText) continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    /* RECHTECKE NACH ZEILEN ZUSAMMENFASSEN. getClientRects liefert ein
       Rechteck je INLINE-KASTEN, nicht je Zeile. Ein Verweis wie
       "Carport entdecken <span>→</span>" ergibt also zwei Rechtecke in
       derselben Zeile, und der Pfeil sah wie eine eigene Zeile aus.
       Beim ersten Versuch am 22.11.2026 meldete die Pruefung deshalb
       71 Waisen, die gar keine waren. Gruppiert wird nach der
       Oberkante, auf 2 px gerundet. */
    const roh = Array.from(r.getClientRects()).filter((z) => z.width > 1 && z.height > 1);
    const nachZeile = new Map();
    for (const z of roh) {
      const schluessel = Math.round(z.top / 2) * 2;
      const vorhanden = nachZeile.get(schluessel);
      if (vorhanden) {
        vorhanden.links = Math.min(vorhanden.links, z.left);
        vorhanden.rechts = Math.max(vorhanden.rechts, z.right);
      } else {
        nachZeile.set(schluessel, { links: z.left, rechts: z.right });
      }
    }
    const zeilen = [...nachZeile.entries()].sort((a, b) => a[0] - b[0])
      .map(([, v]) => ({ width: v.rechts - v.links }));
    if (zeilen.length < 2) continue;
    const breiteste = Math.max.apply(null, zeilen.map((z) => z.width));
    const letzte = zeilen[zeilen.length - 1];
    if (breiteste <= 0) continue;
    const anteil = letzte.width / breiteste;
    if (anteil >= 0.25) continue;
    /* Steht auf der letzten Zeile wirklich nur ein Wort? */
    const woerter = text.split(' ');
    const letztesWort = woerter[woerter.length - 1];
    raus.push({
      tag: n.tagName.toLowerCase(),
      text: text.slice(0, 48),
      wort: letztesWort,
      anteil: Math.round(anteil * 100),
      zeilen: zeilen.length
    });
  }
  return raus;
}

const browser = await chromium.launch();
const seite = await browser.newPage();
let fehler = 0, geprueft = 0, waisenZahl = 0;

async function pruefe(datei, breite, vorher) {
  await seite.setViewportSize({ width: breite, height: 900 });
  await seite.goto(`http://127.0.0.1:${PORT}/${datei}`, { waitUntil: 'load' });
  await seite.waitForTimeout(220);
  if (vorher) await seite.evaluate(vorher);
  return seite.evaluate(messung, SELEKTOR);
}

async function pruefeWaisen(datei, breite, vorher) {
  await seite.setViewportSize({ width: breite, height: 900 });
  await seite.goto(`http://127.0.0.1:${PORT}/${datei}`, { waitUntil: 'load' });
  await seite.waitForTimeout(220);
  if (vorher) await seite.evaluate(vorher);
  return seite.evaluate(waisen, 'h1, h2, h3, strong, .btn, .leistung-link, .tag');
}

if (gegenprobe) {
  console.log('Gegenprobe: eine Ueberschrift wird kuenstlich zu gross gesetzt.');
  const ohne = await pruefe('index.html', 390, null);
  const mit = await pruefe('index.html', 390, () => {
    const h = document.querySelector('h1');
    h.style.fontSize = '140px';
    h.style.whiteSpace = 'nowrap';
    h.style.overflow = 'hidden';
  });
  const ok = ohne.length === 0 && mit.length > 0;
  console.log(`  ohne Eingriff: ${ohne.length} Befunde`);
  console.log(`  mit Eingriff:  ${mit.length} Befunde`);
  console.log(ok ? '\nGegenprobe: der eingebaute Fehler wurde erkannt.'
                 : '\nGegenprobe FEHLGESCHLAGEN: die Pruefung schlaegt nicht an.');
  await browser.close();
  process.exit(ok ? 0 : 1);
}

for (const datei of seiten()) {
  for (const breite of BREITEN) {
    geprueft++;
    const raus = await pruefe(datei, breite, null);
    for (const r of raus) {
      console.log(`  FEHLER  ${datei} bei ${breite}px: <${r.tag}> "${r.text}" braucht ${r.inhalt}px in ${r.kasten}px`);
      fehler++;
    }
    const w = await pruefeWaisen(datei, breite, null);
    for (const r of w) {
      console.log(`  WAISE   ${datei} bei ${breite}px: <${r.tag}> "${r.text}" endet mit "${r.wort}" allein (${r.anteil}% der breitesten Zeile, ${r.zeilen} Zeilen)`);
      waisenZahl++;
    }
  }
}

await browser.close();
console.log(`\n${geprueft} Seiten-Breiten-Kombinationen geprueft.`);
console.log(fehler === 0
  ? 'Ergebnis: kein Text laeuft aus seinem Kasten'
  : `Ergebnis: ${fehler} Stelle(n) beschnitten, vor dem Veroeffentlichen beheben`);
/* Waisen sind haesslich, aber nicht kaputt. Sie werden gezaehlt und
   genannt, lassen die Pruefung aber nicht scheitern: Welcher Umbruch
   gewollt ist, entscheidet der Betreiber am Text. */
console.log(waisenZahl === 0
  ? 'Umbrueche: keine Zeile endet mit einem einzelnen Wort'
  : `Umbrueche: ${waisenZahl} Stelle(n) mit einem einzelnen Wort auf der letzten Zeile (siehe oben)`);
process.exit(fehler === 0 ? 0 : 1);
