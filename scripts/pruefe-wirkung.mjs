#!/usr/bin/env node
/* ============================================================
   KOMMT AN, WAS IM STILBLATT STEHT?

   Zwei Fragen, eine Ursache.

   ANLASS (23.11.2026). An einem Tag sind drei unsichtbare
   Fokusringe gefunden worden, und zwar keiner davon von einer der
   82 Pruefungen. Alle drei lagen bei 1,00:1 oder 1,06:1, also Ring
   und Untergrund in derselben Farbe:
     - die Kopfleiste, nachdem sie dunkel wurde
     - das neu gestaltete Cookie-Fenster
     - acht Beratungsbloecke am Seitenfuss, dazu die Bildpfeile
   pruefe-fokusring.mjs und pruefe-fokus-verdeckung.mjs waren jedes
   Mal gruen, denn sie fragen etwas anderes: Wird der Ring
   abgeschnitten, und liegt etwas darueber? Welche FARBE er hat,
   fragt keine Pruefung.

   Am selben Tag kam der zweite Fall dazu. start.css enthaelt
   ".start-premium p { font-weight: 400 }". Das ist eine Klasse plus
   ein Typ, Spezifitaet (0,1,1), und die Datei wird spaeter geladen.
   Damit ist JEDES font-weight in style.css, das an einem <p> per
   einzelner Klasse haengt, wirkungslos. Gemessen ueber 55 Seiten
   waren fuenf Regeln betroffen; der Text, der fett sein sollte, war
   normal. Auch das faellt keiner Pruefung auf.

   DIE GEMEINSAME URSACHE ist nicht "jemand hat sich vertan",
   sondern: Im Quelltext steht eine Absicht, und niemand vergleicht
   sie mit dem, was der Browser daraus macht. Ein Token kann in einer
   zweiten Datei umgesetzt sein (--radius ist in style.css 10 px und
   in start.css 14 px, --dark #1a1a1a gegen #1D2023), eine Regel kann
   von einer spezifischeren geschlagen werden, eine Liste dunkler
   Flaechen kann eine neue Flaeche nicht kennen. Alles drei sieht im
   Quelltext richtig aus.

   WAS DIESE PRUEFUNG MISST
   1. Fokusring: Fuer jedes per Tabulator erreichbare Element wird die
      tatsaechliche Ringfarbe gegen die tatsaechliche Hintergrundfarbe
      dahinter gerechnet. Verlangt sind 3:1 (WCAG 2.2, 1.4.11; dazu
      2.4.7 "Fokus sichtbar").
   2. Schriftgewicht: Aus src/css/style.css werden alle Regeln
      gelesen, die auf einer einzelnen Klasse ein font-weight setzen.
      Auf der Seite wird verglichen, was davon ankommt.

   ZWEI FALLEN, beide am 23.11.2026 selbst hineingetappt:
   - Ohne Fokus gemessen ist wertlos. :focus-visible greift dann
     nicht, und der gelesene outline-color hat mit dem Ring nichts zu
     tun. Die erste Fassung meldete 1,00:1, OBWOHL die Korrektur
     schon wirkte.
   - Nach einem Mausklick greift :focus-visible nicht mehr, Chromium
     schaltet in den Mausmodus. Deshalb klickt diese Pruefung NIE und
     bewegt sich ausschliesslich mit der Tabulatortaste.

   GRENZE, ehrlich. Der Untergrund wird aus den berechneten
   Hintergrundfarben der Vorfahren bestimmt. Liegt der Ring auf einem
   FOTO, stimmt das nicht; dort braucht es eine Bildpunktprobe. Die
   Pruefung meldet solche Stellen als "nicht beurteilbar" und laesst
   sie durchgehen, statt falschen Alarm zu schlagen. Alle drei
   Befunde vom 23.11.2026 waren Flaechenfaelle und waeren hier
   aufgefallen.

   Aufruf:     node scripts/pruefe-wirkung.mjs
   Gegenprobe: node scripts/pruefe-wirkung.mjs --gegenprobe

   Die Gegenprobe baut DREI Fehler ein, und zwar nur im Browser ueber
   ein eingespieltes Stilblatt. Sie fasst KEINE Datei im Repository
   an. Das ist Absicht: Eine Gegenprobe, die Dateien aendert und im
   finally-Block zuruecksetzt, laesst bei hartem Abbruch kaputte
   Dateien liegen, und css/style.css ist ein Bauerzeugnis.
   ============================================================ */
import { chromium } from 'playwright';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8913;

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const WURZEL = new URL('..', import.meta.url).pathname;

/* SEITEN WERDEN GESUCHT, NICHT AUFGEZAEHLT.
   Erweitert am 24.11.2026 von sechs Seiten auf alle.

   Grund: scripts/pruefe-mitwachsend.mjs hat eine feste Liste von
   sieben Seiten, die nie nachgezogen wurde. Genau deshalb standen
   produkte/fassade.html und produkte/sonnenschutz.html nicht darin,
   und genau dort lagen am 23.11.2026 zwei abgeschnittene
   Textstellen, die nur auffielen, weil jemand ausserhalb der Liste
   gemessen hat. In CLAUDE.md steht, solche Pruefungen sollen dafuer
   sorgen, dass "weder der Betreiber noch der Assistent daran denken"
   muss. Eine feste Liste leistet das nicht.
   Eine neue Seite ist ab sofort automatisch mitgeprueft. */
const AUSGENOMMEN = new Set([
  /* Vorlage, keine ausgelieferte Seite. */
  '/_template.html',
  /* Gesperrt, solange KONFIGURATOR_GESPERRT gilt: Besucher bekommen
     eine 503. Die Seite hat bekannte Altbefunde (.k3d-marke unter
     24 px), die hier jeden Lauf rot faerben wuerden, ohne dass sie
     jemand sieht. Faellt die Sperre, diese Zeile entfernen. */
  '/konfigurator.html',
]);
/* Die Werkstatt ist nicht oeffentlich und wird hier nicht geprueft.
   Wenn sie bedient wird, gilt dieselbe Anforderung; das waere ein
   eigener Schritt. */
const AUSGENOMMENE_ORDNER = ['/werkstatt/'];

function alleSeiten() {
  const aus = [];
  const suche = (unter, tiefe) => {
    for (const e of readdirSync(`${WURZEL}${unter}`, { withFileTypes: true })) {
      const pfad = `${unter}${e.name}`;
      if (e.isDirectory()) {
        if (tiefe > 0 && !/^(node_modules|_site|\.git|images|js|css|scripts|docs|src|worker|\.claude)$/.test(e.name)) {
          suche(`${pfad}/`, tiefe - 1);
        }
        continue;
      }
      if (!e.name.endsWith('.html')) continue;
      if (AUSGENOMMEN.has(pfad)) continue;
      if (AUSGENOMMENE_ORDNER.some((o) => pfad.startsWith(o))) continue;
      aus.push(pfad);
    }
  };
  suche('/', 1);
  return aus.sort();
}
const SEITEN = alleSeiten();

/* Hoechstens so viele Tabulatorschritte je Seite. Die Startseite hat
   deutlich mehr Haltepunkte; die Pruefung soll aber in Minuten
   fertig sein, nicht in Stunden. */
const SCHRITTE = 120;

/* BEKANNTE ALTBEFUNDE beim Schriftgewicht, gemessen am 23.11.2026
   ueber 55 Seiten. Sie stehen in docs/offene-nebenbefunde.md und
   warten auf eine Ansage des Betreibers, weil sie fuenf Seiten
   sichtbar fetter machen. Die Pruefung MELDET sie weiterhin, laesst
   sie aber nicht fehlschlagen. Neue Faelle schlagen fehl.
   Wer einen davon behebt, nimmt ihn hier heraus. */
const BEKANNT_GEWICHT = new Set([
  'kontakt-quick-lead', 'bg-search-label', 'bro-ende-frage', 'stoff-dessin',
  /* Nachgetragen 24.11.2026: Der fuenfte Fall stand im Bericht und
     fehlte hier. Er fiel erst auf, als die Seitenliste alle Seiten
     umfasste, denn .vd-model-tile gibt es nur auf den beiden
     Sonnenschutz-Seiten. */
  'vd-model-tile',
]);

/* ---- Absichten aus dem Stilblatt lesen ----
   Nur Regeln, deren Selektor EINE Klasse ist, auf Wunsch gefolgt von
   einem Typ (".stoff-dessin" oder ".vd-model-tile p"). Alles
   Komplexere waere nicht eindeutig einem Element zuzuordnen. */
function gewichtsAbsichten() {
  const quelle = readFileSync(`${WURZEL}/src/css/style.css`, 'utf8');
  const ohneKommentare = quelle.replace(/\/\*[\s\S]*?\*\//g, '');
  const aus = [];
  const block = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = block.exec(ohneKommentare))) {
    const selektor = m[1].trim();
    if (!/^\.[A-Za-z0-9_-]+( [a-z]+)?$/.test(selektor)) continue;
    const g = /(?:^|;)\s*font-weight\s*:\s*(\d{3})\s*(?:;|$)/.exec(m[2]);
    if (!g) continue;
    aus.push({ selektor, soll: Number(g[1]),
               klasse: selektor.slice(1).split(' ')[0] });
  }
  return aus;
}

/* ---- Kontrast ---- */
const leuchte = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const zahlen = (s) => (String(s).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const kontrast = (a, b) => {
  const x = leuchte(...zahlen(a)), y = leuchte(...zahlen(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: WURZEL, stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0, bekanntGemeldet = 0, nichtBeurteilbar = 0;
function pruef(name, ok, beleg, nurMelden) {
  geprueft++;
  if (ok) { console.log(`  ok      ${name.padEnd(52)} ${beleg || ''}`); return; }
  if (nurMelden) { bekanntGemeldet++; console.log(`  bekannt ${name.padEnd(52)} ${beleg || ''}`); return; }
  fehler++;
  console.log(`  FEHLER  ${name.padEnd(52)} ${beleg || ''}`);
}

/* Laeuft IM Browser: liest zum aktuell fokussierten Element die
   Ringfarbe und die Hintergrundfarbe dahinter. */
const RING_MESSUNG = () => {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return null;
  if (!a.matches(':focus-visible')) return null;
  const s = getComputedStyle(a);
  const breite = parseFloat(s.outlineWidth) || 0;
  if (s.outlineStyle === 'none' || breite === 0) return null;


  /* Untergrund: der erste Vorfahr mit deckender Hintergrundfarbe.
     Liegt dazwischen ein Bild, ist die Farbe nicht massgeblich. */
  /* WO LIEGT DER RING? Bei outline-offset >= 0 ausserhalb des
     Elements, also auf der Flaeche des ELTERNTEILS. Wer hier beim
     Element selbst zu suchen anfaengt, misst die eigene Flaeche:
     Ein goldener Knopf im dunklen Abschnitt ergaebe dann Champagner
     gegen Gold (2,15:1) statt Champagner gegen Dunkel (11,80:1),
     also lauter Fehlalarme. Nur ein negativer Abstand legt den Ring
     nach innen. */
  const abstand = parseFloat(s.outlineOffset) || 0;

  /* SCHWEBENDE BEDIENELEMENTE sind nicht beurteilbar. Was hinter
     einem position: fixed liegt, ist das, was gerade darunter
     scrollt, und das steht in keinem Vorfahren. Wer sie trotzdem
     rechnet, bekommt Zahlen wie 2,78:1 oder 1,97:1, die nichts
     bedeuten. Sie brauchen eine Bildpunktprobe. */
  for (let q = a; q && q !== document.documentElement; q = q.parentElement) {
    const qs = getComputedStyle(q).position;
    if (qs === 'fixed' || qs === 'sticky') return { schwebend: true,
      element: a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : '') };
  }

  /* EIN INNENBAND ZAEHLT ALS UNTERGRUND. Liegt der Ring innen
     (negativer Abstand) und hat das Element ein inset-box-shadow,
     dann sitzt der Ring auf diesem Band und nicht auf der eigenen
     Flaeche. Das ist kein Sonderfall, sondern die uebliche Technik,
     wenn ein Ring auf einem Foto tragen muss: ein dunkles Band
     unterlegen und den hellen Ring darauf setzen.
     Ohne diese Zeile meldet die Pruefung ausgerechnet die sorgfaeltig
     gebauten Stellen als kaputt. Gemessen am 23.11.2026 an
     .galerie-oeffnen: gegen die weisse Kachel 1,39:1, gegen das Band
     13,6:1. Richtig ist das Band. */
  if (abstand < 0 && s.boxShadow && s.boxShadow.includes('inset')) {
    const f = s.boxShadow.match(/rgba?\([^)]+\)/);
    if (f) return { ring: s.outlineColor, grund: f[0], aufBild: false,
      element: a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : ''),
      name: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24) };
  }

  let p = abstand < 0 ? a : (a.parentElement || a), grund = null, aufBild = false;
  while (p && p !== document.documentElement) {
    const ps = getComputedStyle(p);
    const bg = ps.backgroundColor;
    const alpha = (bg.match(/[\d.]+/g) || [])[3];
    if (bg && bg !== 'transparent' && alpha !== '0' && Number(alpha ?? 1) > 0.9) {
      grund = bg;
      /* NUR die Flaeche, die den Grund wirklich stellt, zaehlt. Vorher
         genuegte irgendein Vorfahr mit Hintergrundbild, und damit
         galten 230 von rund 300 Ringen als nicht beurteilbar. Eine
         Pruefung, die drei Viertel ihrer Faelle entschuldigt, prueft
         nichts. */
      /* NUR ein echtes Bild macht den Untergrund unbestimmbar. Ein
         VERLAUF ist farbaehnlich und sehr wohl beurteilbar. Vorher
         galt jede Flaeche mit background-image als nicht
         beurteilbar, und damit die ganze Fusszeile: 41 Haltepunkte
         je Seite. Ausgerechnet dort lag frueher schon ein
         unsichtbarer Ring (siehe Kommentar 1 in src/css/start.css). */
      if (/url\(/.test(ps.backgroundImage)) aufBild = true;
      break;
    }
    p = p.parentElement;
  }
  if (!grund) grund = getComputedStyle(document.body).backgroundColor;

  /* Sitzt der Ring ueber einem <img>, das die Flaeche ueberdeckt?
     Dann sagt die Hintergrundfarbe nichts. */
  /* Nicht EIN Punkt, sondern vier, je einer knapp ausserhalb der
     vier Kanten, und erst eine Mehrheit zaehlt. Mit einem einzelnen
     Punkt galten 227 von rund 300 Ringen als nicht beurteilbar: Ein
     Verweis neben einem Bild reichte schon. */
  const r = a.getBoundingClientRect();
  const d = Math.max(2, abstand + 1);
  const proben = [
    [r.left + r.width / 2, r.top - d], [r.left + r.width / 2, r.bottom + d],
    [r.left - d, r.top + r.height / 2], [r.right + d, r.top + r.height / 2],
  ];
  let aufBildPunkte = 0;
  for (const [x, y] of proben) {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    const el = document.elementFromPoint(x, y);
    if (el && (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'CANVAS')) aufBildPunkte++;
  }
  if (aufBildPunkte >= 2) aufBild = true;

  return {
    ring: s.outlineColor, grund, aufBild,
    element: a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : ''),
    name: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24),
  };
};

const pfad = chromiumPfad();
const browser = await chromium.launch(pfad ? { executablePath: pfad } : {});
const absichten = gewichtsAbsichten();
console.log(`Wirkung: kommt an, was im Stilblatt steht?`);
console.log(`  ${absichten.length} Gewichtsregeln aus src/css/style.css gelesen\n`);

let gegenprobeRing = 0, gegenprobeGewicht = 0;

for (const seite of SEITEN) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}${seite}`, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  if (GEGENPROBE) {
    /* Drei eingebaute Fehler, nur im Browser:
       1. Ringfarbe gleich der Seitenfarbe auf hellem Grund,
       2. Ringfarbe gleich der Flaechenfarbe auf dunklem Grund,
       3. jedes Klassengewicht auf 400 gedrueckt. */
    await page.addStyleTag({ content: `
      :focus-visible { outline-color: #F8F7F4 !important; }
      .pr-dunkel :focus-visible, .navbar :focus-visible { outline-color: #0B0B0C !important; }
      .start-premium p, p { font-weight: 400 !important; }
    ` });
    await page.waitForTimeout(150);
  }

  /* ---- 1. Fokusringe, ausschliesslich per Tabulator ---- */
  let schwach = [], aufBild = 0, schwebend = 0, gesehen = 0;
  const bildBeispiele = [];
  const schonGesehen = new Set();
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < SCHRITTE; i++) {
    await page.keyboard.press('Tab');
    const m = await page.evaluate(RING_MESSUNG);
    if (!m) continue;
    const schluessel = m.element + '|' + m.name;
    if (schonGesehen.has(schluessel)) continue;
    schonGesehen.add(schluessel);
    gesehen++;
    if (m.schwebend) { schwebend++; continue; }
    if (m.aufBild) { aufBild++; bildBeispiele.push(m.element); continue; }
    const k = kontrast(m.ring, m.grund);
    if (k < 3) schwach.push({ ...m, k: k.toFixed(2) });
  }
  nichtBeurteilbar += aufBild + schwebend;

  if (GEGENPROBE) {
    gegenprobeRing += schwach.length;
    pruef(`${seite}: eingebaute Ringfehler fallen auf`, schwach.length > 0,
      `${schwach.length} von ${gesehen} Haltepunkten unter 3:1`);
  } else {
    pruef(`${seite}: Fokusringe mindestens 3:1`, schwach.length === 0,
      schwach.length
        ? schwach.slice(0, 3).map((s) => `${s.element} ${s.k}:1`).join(', ')
        : `${gesehen} Haltepunkte` + (aufBild ? `, ${aufBild} auf Bild` : '')
          + (schwebend ? `, ${schwebend} schwebend` : ''));
    if (process.argv.includes('--zeige-ausnahmen') && bildBeispiele.length) {
      console.log('          auf Bild: ' + [...new Set(bildBeispiele)].slice(0, 8).join(', '));
    }
  }

  /* ---- 2. Schriftgewichte ---- */
  const treffer = await page.evaluate((liste) => {
    const aus = [];
    for (const a of liste) {
      let el;
      try { el = document.querySelector(a.selektor); } catch (e) { continue; }
      if (!el) continue;
      aus.push({ ...a, ist: Number(getComputedStyle(el).fontWeight), tag: el.tagName });
    }
    return aus;
  }, absichten);

  /* NUR der echte Fehlerfall: Das Gewicht faellt auf den Grundwert
     400 zurueck, obwohl style.css mehr wollte. Genau so sieht es
     aus, wenn eine allgemeine Regel die Absicht schlaegt.
     Ein bewusstes Ueberschreiben auf einen ANDEREN Wert (start.css
     setzt .hero-slogan absichtlich auf 600 statt 700) ist eine
     Entscheidung und kein verlorener Wert. Wer das auch melden
     wollte, bekaeme Fehlalarme und wuerde die Pruefung abschalten. */
  const abweichend = treffer.filter((t) => t.ist === 400 && t.soll > 400);
  if (GEGENPROBE) {
    gegenprobeGewicht += abweichend.length;
    /* Der eingebaute Gewichtsfehler trifft nur Absaetze. Eine Seite,
       auf der keine Gewichtsregel einen <p> trifft, kann ihn gar
       nicht bemerken. Das ist keine fehlgeschlagene Gegenprobe,
       sondern eine Seite ohne Angriffsflaeche. */
    const absatzRegeln = treffer.filter((x) => x.tag === 'P').length;
    pruef(`${seite}: eingebaute Gewichtsfehler fallen auf`,
      abweichend.length > 0 || absatzRegeln === 0,
      absatzRegeln === 0
        ? 'keine Gewichtsregel trifft hier einen Absatz'
        : `${abweichend.length} von ${absatzRegeln} Absatzregeln kommen nicht an`);
  } else {
    const neu = abweichend.filter((t) => !BEKANNT_GEWICHT.has(t.klasse));
    const alt = abweichend.filter((t) => BEKANNT_GEWICHT.has(t.klasse));
    for (const t of alt) {
      pruef(`${seite}: ${t.selektor} kommt an`, false,
        `soll ${t.soll}, ist ${t.ist} (bekannt, docs/offene-nebenbefunde.md)`, true);
    }
    pruef(`${seite}: Gewichte aus style.css kommen an`, neu.length === 0,
      neu.length
        ? neu.slice(0, 3).map((t) => `${t.selektor} soll ${t.soll}, ist ${t.ist}`).join(', ')
        : `${treffer.length} Regeln auf dieser Seite geprueft`);
  }

  await ctx.close();
}

await browser.close();

if (GEGENPROBE) {
  pruef('Beide eingebauten Fehlerarten fallen auf',
    gegenprobeRing > 0 && gegenprobeGewicht > 0,
    `${gegenprobeRing} Ringbefunde, ${gegenprobeGewicht} Gewichtsbefunde`);
}

const echteFehler = GEGENPROBE
  ? (gegenprobeRing > 0 && gegenprobeGewicht > 0 ? 0 : 1)
  : fehler;
console.log(`\nErgebnis: ${echteFehler === 0
  ? (GEGENPROBE ? 'die Gegenprobe faellt auf' : `alle ${geprueft} Prüfungen bestanden`)
  : `${echteFehler} Prüfung(en) fehlgeschlagen`}`
  + (!GEGENPROBE && bekanntGemeldet ? `, dazu ${bekanntGemeldet} bekannte Altbefunde` : '')
  + (!GEGENPROBE && nichtBeurteilbar ? `, ${nichtBeurteilbar} Ringe auf Bild nicht beurteilbar` : ''));
process.exit(echteFehler === 0 ? 0 : 1);
