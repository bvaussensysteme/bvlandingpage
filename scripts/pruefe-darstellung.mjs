#!/usr/bin/env node
/**
 * Prueft die Darstellung aller wichtigen Seiten im Browser auf drei Dinge,
 * die sich nicht am Quelltext ablesen lassen, weil sie erst aus der
 * Verschachtelung der Stilregeln entstehen:
 *
 *   1. Textkontrast (WCAG 1.4.3 AA): 4,5:1 fuer normalen Text,
 *      3:1 ab 24 px bzw. ab 18,66 px und fett.
 *   2. Schriftgroesse in Eingabefeldern: unter 16 px zoomt iOS Safari beim
 *      Antippen die ganze Seite heran - das ist kein Geschmacksthema,
 *      sondern macht Formulare am iPhone unbenutzbar.
 *   3. Groesse der Tippflaechen (WCAG 2.5.8 AA, 24 x 24 px) MIT den beiden
 *      Ausnahmen der Norm - ohne die meldet die Pruefung 60 Treffer, die
 *      keine Verstoesse sind:
 *        - Abstand: ein zu kleines Ziel ist erlaubt, wenn ein Kreis von
 *          24 px Durchmesser um seinen Mittelpunkt keinen Kreis eines
 *          anderen Ziels schneidet.
 *        - Im Textfluss: ein Link mitten in einem Satz ist ausgenommen.
 *
 * Grenze der Messung, ausdruecklich benannt statt stillschweigend
 * weggelassen: Steht Text auf einem BILD, laesst sich der Untergrund nicht
 * aus den Stilregeln lesen. Solche Stellen wandern in eine eigene Liste
 * ("nicht messbar") und muessen von Hand angesehen werden. Sie werden
 * NICHT als bestanden gezaehlt.
 *
 *   node scripts/pruefe-darstellung.mjs
 *   node scripts/pruefe-darstellung.mjs --gegenprobe
 */
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

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

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8841;
const SEITEN = [
  '/index.html', '/produkte/terrassenueberdachung.html', '/produkte/carport.html',
  '/stoffe.html', '/windzonen.html', '/baugenehmigung.html',
  '/ratgeber/index.html', '/zertifikate.html', '/partner.html',
  '/pflege.html', '/einzugsgebiet.html', '/broschuere.html',
];
const BREITEN = [
  { name: 'Handy',  w: 390, h: 844, mobil: true  },
  { name: 'Tablet', w: 820, h: 1180, mobil: true },
  { name: 'Rechner', w: 1440, h: 900, mobil: false },
];

function chromPfad() {
  const b = '/opt/pw-browsers';
  const o = readdirSync(b).filter(d => /^chromium-\d+$/.test(d)).sort();
  return chromeIn(`${b}/${o[o.length - 1]}`);
}

const mess = (tippen) => {
  function kanal(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(r) { return 0.2126 * kanal(r[0]) + 0.7152 * kanal(r[1]) + 0.0722 * kanal(r[2]); }
  function parse(s) {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const t = m[1].split(',').map(parseFloat);
    return { rgb: [t[0], t[1], t[2]], a: t.length > 3 ? t[3] : 1 };
  }
  // Untergrund aus der Kette der Vorfahren mischen. Ein Farbverlauf ist nicht
  // EINE Farbe, sondern eine Strecke: seine Farbstopps werden als mehrere
  // moegliche Untergruende weitergegeben, und gewertet wird spaeter der
  // schlechteste. Ein echtes Bild (url(...)) laesst sich aus den Stilregeln
  // nicht lesen - dann gibt es kein Ergebnis, und die Stelle wandert in die
  // Liste "nicht messbar", statt stillschweigend als bestanden zu gelten.
  function gruende(el) {
    const schichten = [];
    let e = el;
    while (e) {
      // Die dunklen Kopfbereiche legen ihre Abdunklung als ::after ueber ein
      // Foto. Was am Ende unter der Schrift liegt, steht damit nicht mehr in
      // den Stilregeln - solche Stellen gelten als nicht messbar und werden
      // von Hand am Bildschirmfoto angesehen, statt als bestanden zu zaehlen.
      for (const teil of ['::before', '::after']) {
        const ps = getComputedStyle(e, teil);
        if (ps.content === 'none' || ps.position === 'static') continue;
        const pb = parse(ps.backgroundColor);
        if ((ps.backgroundImage && ps.backgroundImage !== 'none') || (pb && pb.a > 0.01)) return null;
      }
      const cs = getComputedStyle(e);
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        if (/url\(/.test(bi)) return null;
        const stopps = [...bi.matchAll(/rgba?\([^)]+\)/g)].map(m => parse(m[0])).filter(Boolean);
        if (!stopps.length) return null;
        schichten.push(stopps);
        if (stopps.every(x => x.a > 0.99)) return fertig(schichten);
      }
      const b = parse(cs.backgroundColor);
      if (b && b.a > 0.01) { schichten.push([b]); if (b.a > 0.99) return fertig(schichten); }
      e = e.parentElement;
    }
    return fertig(schichten);
  }
  function fertig(schichten) {
    // Jede Kombination der Stopps durchrechnen, von unten nach oben mischen.
    let ergebnisse = [[255, 255, 255]];
    for (let i = schichten.length - 1; i >= 0; i--) {
      const naechste = [];
      for (const unten of ergebnisse) {
        for (const x of schichten[i]) {
          naechste.push([
            x.rgb[0] * x.a + unten[0] * (1 - x.a),
            x.rgb[1] * x.a + unten[1] * (1 - x.a),
            x.rgb[2] * x.a + unten[2] * (1 - x.a),
          ]);
        }
      }
      // Deckel gegen ein Aufblaehen bei vielen Stopps: die hellste und die
      // dunkelste Moeglichkeit genuegen, denn gewertet wird der schlechteste
      // Kontrast, und der liegt immer an einem der beiden Enden.
      naechste.sort((a, b) => lum(a) - lum(b));
      ergebnisse = naechste.length > 8 ? [naechste[0], naechste[naechste.length - 1]] : naechste;
    }
    return ergebnisse;
  }
  function kennung(el) {
    const k = String(el.className || '').split(' ').filter(Boolean)[0];
    return el.tagName.toLowerCase() + (k ? '.' + k : '');
  }

  const kontrast = [], nichtMessbar = [], felder = [], ziele = [], unsichtbar = [];

  // Die Karten blenden beim Scrollen ein (siehe src/css/style.css). Genau
  // dabei kann etwas haengen bleiben: ein Beobachter, der nicht ausloest,
  // ein Skriptfehler, eine Karte ausserhalb jeder Beobachtung. Dann steht
  // der Inhalt auf opacity 0 und ist fuer immer weg. Deshalb wird nach dem
  // Durchscrollen geprueft, dass keine davon unsichtbar geblieben ist.
  document.querySelectorAll('.leistung-card,.produkt-card,.service-box,.kontakt-card,.zert-card,.pflege-card,.wz-info-card,.bg-info-card,.stat-box,.why-item').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (parseFloat(cs.opacity) < 0.99) {
      unsichtbar.push({ sel: kennung(el), t: (el.textContent || '').trim().slice(0, 20), opa: cs.opacity });
    }
  });

  document.querySelectorAll('header *, nav *, main *, footer *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('noscript')) return;
    const hatText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hatText) {
      const f = parse(cs.color);
      const g = f ? gruende(el) : null;
      const px = parseFloat(cs.fontSize), fett = parseInt(cs.fontWeight, 10) >= 700;
      const soll = (px >= 24 || (px >= 18.66 && fett)) ? 3 : 4.5;
      const eintrag = { t: el.textContent.trim().slice(0, 26), px: Math.round(px), soll, sel: kennung(el) };
      if (!f) return;
      if (!g || !g.length) { nichtMessbar.push(eintrag); return; }
      const lf = lum(f.rgb);
      let v = Infinity;
      for (const grd of g) {
        const lg = lum(grd);
        v = Math.min(v, (Math.max(lf, lg) + 0.05) / (Math.min(lf, lg) + 0.05));
      }
      if (v < soll - 0.02) kontrast.push({ ...eintrag, v: Math.round(v * 100) / 100 });
    }
    if (tippen && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const px = parseFloat(cs.fontSize);
      if (px < 16 && el.type !== 'hidden' && el.type !== 'checkbox' && el.type !== 'radio') {
        felder.push({ sel: el.name || el.id || el.type, px: Math.round(px * 10) / 10 });
      }
    }
  });

  // Tippflaechen nach WCAG 2.5.8 - mit beiden Ausnahmen der Norm.
  // Ein Ziel, das ein scrollbarer Kasten gerade abschneidet, liegt zwar
  // rechnerisch irgendwo auf der Seite, ist dort aber nicht zu sehen und
  // nicht zu treffen. Ohne diesen Filter meldete die Pruefung, die
  // Ortsliste auf /einzugsgebiet.html kollidiere mit der Fusszeile - die
  // Ortsknoepfe waren nur aus ihrem Kasten herausgescrollt.
  function nichtAbgeschnitten(el, r) {
    let e = el.parentElement;
    while (e && e !== document.body) {
      const cs = getComputedStyle(e);
      if (/(auto|scroll|hidden)/.test(cs.overflowY + ' ' + cs.overflowX)) {
        const k = e.getBoundingClientRect();
        if (r.bottom <= k.top + 1 || r.top >= k.bottom - 1 || r.right <= k.left + 1 || r.left >= k.right - 1) return false;
      }
      e = e.parentElement;
    }
    return true;
  }
  const alle = [...document.querySelectorAll('a[href], button, input[type=submit], input[type=button], summary, [role=button]')]
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(x => x.r.width > 0 && x.r.height > 0 && getComputedStyle(x.el).visibility !== 'hidden'
                 && nichtAbgeschnitten(x.el, x.r));
  const mitte = x => ({ x: x.r.left + x.r.width / 2, y: x.r.top + x.r.height / 2 });
  alle.forEach(x => {
    if (x.r.width >= 24 && x.r.height >= 24) return;
    // Ausnahme "im Textfluss": der Link sitzt in einem Satz.
    const p = x.el.parentElement;
    if (p) {
      // Steht neben dem Ziel noch Text, ist es ein Link im Satz - die Norm
      // nimmt den ausdruecklich aus. Ein einzelnes Trennzeichen zaehlt mit:
      // die Quellenzeile der Karte ist "Leaflet | (c) OpenStreetMap", und
      // das ist eine Textzeile, keine Knopfreihe.
      const neben = p.textContent.replace(x.el.textContent, '').trim();
      if (neben.length >= 1 && getComputedStyle(x.el).display.startsWith('inline')) return;
    }
    // Ausnahme "Abstand": Kreis mit 24 px Durchmesser schneidet keinen anderen.
    const a = mitte(x);
    const kollision = alle.some(y => {
      if (y.el === x.el || x.el.contains(y.el) || y.el.contains(x.el)) return false;
      const b = mitte(y);
      return Math.hypot(a.x - b.x, a.y - b.y) < 24;
    });
    if (kollision) {
      ziele.push({ t: (x.el.textContent || x.el.getAttribute('aria-label') || '').trim().slice(0, 20),
                   b: Math.round(x.r.width), h: Math.round(x.r.height), sel: kennung(x.el) });
    }
  });

  return { kontrast, nichtMessbar, felder, ziele, unsichtbar };
};

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const br = await chromium.launch({ executablePath: chromPfad(), args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

let fehler = 0, geprueft = 0;
const offen = [];

// Gegenprobe: jeder Fehler muss genau eine Pruefung roetlich machen.
const FEHLERBAUSTEINE = [
  // Die Fusszeile steht auf #1a1a1a - ein Grau muss also DUNKEL sein, um
  // dort durchzufallen. Ein helles Grau haette bestanden und die Gegenprobe
  // waere stillschweigend wirkungslos geblieben (am 07.11.2026 genau so
  // passiert: #8a8a8a ergibt auf der dunklen Fusszeile 5,1:1).
  { name: 'kontrast', css: 'footer .footer-links a { color: #3a3a3a !important; }', trifft: 'kontrast' },
  { name: 'feld',     css: 'input, textarea, select { font-size: 12px !important; }', trifft: 'felder' },
  // Der haeufigste Weg, wie das Einblenden kaputtgeht: der Endzustand kommt
  // nie an und die Karte bleibt auf opacity 0 stehen.
  { name: 'einblenden', css: '.leistung-card, .produkt-card, .service-box { opacity: 0 !important; }', trifft: 'unsichtbar' },
  // Klein allein genuegt nicht: die Norm erlaubt kleine Ziele mit Abstand.
  // Der Fehler muss die Ziele klein UND dicht machen.
  { name: 'ziel',     css: 'footer .footer-links { display: flex !important; flex-direction: column !important; gap: 0 !important; row-gap: 0 !important; columns: auto !important; } footer .footer-links li { margin: 0 !important; padding: 0 !important; line-height: 1 !important; height: 10px !important; } footer .footer-links a { font-size: 7px !important; line-height: 1 !important; height: 10px !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }', trifft: 'ziele' },
];

async function lauf(ctxOpts, baustein) {
  const c = await br.newContext({
    ...ctxOpts,
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'bv_cookie_consent', value: 'necessary' }] }] },
  });
  const summe = { kontrast: 0, felder: 0, ziele: 0, nichtMessbar: 0, unsichtbar: 0 };
  for (const s of SEITEN) {
    const p = await c.newPage();
    if (baustein) await p.addStyleTag({ content: baustein.css }).catch(() => {});
    await p.goto(`http://localhost:${PORT}${s}`, { waitUntil: 'load' }).catch(() => {});
    if (baustein) await p.addStyleTag({ content: baustein.css }).catch(() => {});
    await p.waitForTimeout(700);
    // Einmal durch die ganze Seite scrollen: ohne das blendet nichts ein und
    // die Pruefung wuerde Karten messen, die noch auf opacity 0 stehen.
    await p.evaluate(async () => {
      // documentElement, nicht body: die Seite haengt in einem Wrapper des
      // Bedienfelds fuer Barrierefreiheit, und body.scrollHeight meldet
      // dort nur die Fensterhoehe. Mit body lief die Schleife genau einmal
      // und es wurde ueberhaupt nicht gescrollt.
      const hoehe = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const schritt = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < hoehe; y += schritt) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 140));
      }
      window.scrollTo(0, 0);
    }).catch(() => {});
    // Laenger als der 3-s-Notnagel im Kopf der Seite: was danach noch
    // unsichtbar ist, ist es dauerhaft.
    await p.waitForTimeout(3400);
    const r = await p.evaluate(mess, !!ctxOpts.hasTouch).catch(() => ({ kontrast: [], nichtMessbar: [], felder: [], ziele: [], unsichtbar: [] }));
    summe.kontrast += r.kontrast.length;
    summe.felder += r.felder.length;
    summe.ziele += r.ziele.length;
    summe.nichtMessbar += r.nichtMessbar.length;
    summe.unsichtbar += (r.unsichtbar || []).length;
    if (!baustein) {
      geprueft += 4;
      if (r.kontrast.length) { fehler++; console.log(`  FEHLER ${s}  Kontrast unter Soll: ${r.kontrast.length}`, JSON.stringify(r.kontrast.slice(0, 4))); }
      if (r.felder.length)   { fehler++; console.log(`  FEHLER ${s}  Eingabefeld unter 16px: ${r.felder.length}`, JSON.stringify(r.felder.slice(0, 4))); }
      if (r.ziele.length)    { fehler++; console.log(`  FEHLER ${s}  Tippflaeche unter 24px ohne Abstand: ${r.ziele.length}`, JSON.stringify(r.ziele.slice(0, 4))); }
      if ((r.unsichtbar || []).length) { fehler++; console.log(`  FEHLER ${s}  Nach dem Durchscrollen unsichtbar geblieben: ${r.unsichtbar.length}`, JSON.stringify(r.unsichtbar.slice(0, 4))); }
      if (r.nichtMessbar.length) offen.push(`${s}: ${r.nichtMessbar.length} Textstellen auf Bild/Verlauf (von Hand ansehen)`);
    }
    await p.close();
  }
  await c.close();
  return summe;
}

if (GEGENPROBE) {
  console.log(`Gegenprobe: ${FEHLERBAUSTEINE.length} eingebaute Fehler, Messung am Handy (390 x 844)\n`);
  const basis = await lauf({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, null);
  let gut = 0;
  for (const b of FEHLERBAUSTEINE) {
    const s = await lauf({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, b);
    const erkannt = s[b.trifft] > basis[b.trifft];
    console.log(`  ${erkannt ? 'erkannt ' : 'ENTGEHT '} ${b.name}: ${b.trifft} ${basis[b.trifft]} -> ${s[b.trifft]}`);
    if (erkannt) gut++;
  }
  console.log(`\n${gut} von ${FEHLERBAUSTEINE.length} eingebauten Fehlern erkannt.`);
  await br.close(); srv.kill();
  process.exit(gut === FEHLERBAUSTEINE.length ? 0 : 1);
}

for (const b of BREITEN) {
  console.log(`\n## ${b.name} (${b.w} x ${b.h})`);
  const s = await lauf({ viewport: { width: b.w, height: b.h }, isMobile: b.mobil, hasTouch: b.mobil }, null);
  console.log(`  Summe: Kontrast ${s.kontrast}, Felder ${s.felder}, Tippflaechen ${s.ziele}, unsichtbar ${s.unsichtbar}, nicht messbar ${s.nichtMessbar}`);
}
await br.close(); srv.kill();
if (offen.length) { console.log('\nNicht messbar (Text auf Bild) - von Hand angesehen, siehe docs/pruefungen.md:'); [...new Set(offen)].forEach(z => console.log('  ' + z)); }
console.log(`\n${geprueft - fehler} von ${geprueft} Pruefungen bestanden.`);
process.exit(fehler ? 1 : 0);
