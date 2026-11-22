#!/usr/bin/env node
/* ============================================================
   TITEL UND BESCHREIBUNG JEDER SEITE

   ANLASS (22.11.2026). Ansage des Betreibers zu den zu langen
   Seitentiteln: "Kuerzen und mir hinterher zeigen". Gemessen waren
   damals 22 indexierbare Seiten ueber der Grenze, der laengste Titel
   94 Zeichen, die laengste Beschreibung 187.

   WARUM DAS MESSBAR IST UND NICHT GESCHMACK. Google schneidet ab,
   nicht nach Zeichen, sondern nach Pixelbreite: rund 580 px beim
   Titel, rund 920 px bei der Beschreibung. Als Faustzahl entspricht
   das 60 und 155 Zeichen. Was darueber steht, sieht der Suchende nie,
   und bei einem Titel, der mitten im Wort endet, verliert er die
   Aussage. Zu kurze Texte sind kein Fehler, nur eine verpasste
   Gelegenheit, deshalb wird hier nur die Obergrenze geprueft.

   WAS HIER NICHT GEPRUEFT WIRD, ausdruecklich benannt: ob der Titel
   gut ist. Ob er das richtige Stichwort traegt, ob er zum Inhalt
   passt, ob er jemanden zum Klicken bringt. Das steht in keinem
   Quelltext. Geprueft werden Laenge, Vorhandensein, Doppelungen und
   Gedankenstriche.

   GEMESSEN WIRD AM AUSGELIEFERTEN HTML, nicht an den Vorlagen unter
   src/. Die Haelfte der Seiten wird erzeugt, die andere von Hand
   gepflegt; nur das Ergebnis zaehlt. HTML-Entities werden vorher
   aufgeloest: "&amp;" sind fuenf Zeichen im Quelltext und eines auf
   dem Bildschirm, und am 22.11.2026 standen deshalb sechs Seiten
   faelschlich auf der Mangelliste.

   SEITEN MIT "noindex" werden bei Laenge und Beschreibung
   uebersprungen. Das sind Weiterleitungsseiten von rund 2 KB
   (kontakt.html, termin.html, produkte/balkonueberdachung.html,
   produkte/sonnenschutz-beschattung.html). Sie erscheinen nie in
   einem Suchergebnis, eine Beschreibung waere dort toter Text. Ein
   Titel wird trotzdem verlangt: den zeigt der Browser-Tab.

   Aufruf:  node scripts/pruefe-metatexte.mjs [--gegenprobe]
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const GEGENPROBE = process.argv.includes('--gegenprobe');
const TITEL_MAX = 60;
const BESCHR_MAX = 155;
const MARKE = '| BV AussenSysteme';
/* Rechtstexte werden auf Gedankenstriche NICHT beanstandet. Ansage des
 * Betreibers vom 14.11.2026: "rechtstexte nicht veraendern nur
 * aufmerksam machen auf moegliche fehler/gefahren." Die Gedankenstrich-
 * Regel endet an der Tuer zum Rechtstext. Was auffaellt, steht in
 * docs/rechtstexte-befunde.md, nicht hier als Fehler. */
const RECHTSTEXTE = ['agb.html', 'datenschutz.html', 'impressum.html', 'widerruf.html'];
/* Fragmente ohne eigenen Kopf: Dateien unter 500 Byte sind Stummel oder
 * Platzhalter und haben keinen Titel. Sie werden uebersprungen, statt
 * eine Fehlermeldung zu erzeugen, die niemand beheben kann. */
const MINDESTGROESSE = 500;
const AUS = ['node_modules', '_site', 'werkstatt', '.git', 'images', 'entwurf'];

/* Die Gegenprobe baut die Fehler in ZWEI VERSCHIEDENE Dateien ein.
 * Grund: Am 22.11.2026 fiel bei einer anderen Pruefung der zweite
 * Fehler nicht auf, weil beide in derselben Datei standen und der
 * erste die Datei schon unbrauchbar machte. */
const FEHLER = [
  ['index.html', /<title>([^<]*)<\/title>/,
   '<title>Terrassenueberdachung, Carport, Pergola, Markisen, Glasschiebewaende und Sonnenschutz aus Aluminium nach Mass im Westerwald | BV AussenSysteme</title>',
   'Titel zu lang'],
  ['stoffe.html', /<meta name="description" content="([^"]*)"/,
   '<meta name="description" content="Markisenstoffe in grosser Auswahl: AC-, PA- und ZIP-Stoffe fuer Markisen, Pergola und Senkrechtbeschattung, dazu Hinweise zu UV-Schutz, Lichtdurchlaessigkeit, Pflege, Reinigung, Garantie und Lieferzeit, und am Ende die Muster zum Bestellen."',
   'Beschreibung zu lang'],
  ['produkte/eingang.html', /<meta property="og:description" content="([^"]*)"/,
   '<meta property="og:description" content="Carports im Westerwald – TDS, Flat Line und Flat Box."',
   'Gedankenstrich im Teilen-Feld'],
];

function entitaeten(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
          .replace(/&shy;/g, '').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
}
function sauber(s) { return entitaeten(s.replace(/\s+/g, ' ').trim()); }

function seiten(ordner = WURZEL) {
  const raus = [];
  for (const e of readdirSync(ordner)) {
    if (AUS.includes(e) || e.startsWith('.')) continue;
    const p = join(ordner, e);
    if (statSync(p).isDirectory()) raus.push(...seiten(p));
    else if (e.endsWith('.html') && statSync(p).size >= MINDESTGROESSE) raus.push(p);
  }
  return raus;
}

function lies(pfad) {
  const t = readFileSync(pfad, 'utf8');
  const ti = t.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const be = t.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/);
  /* Auch die Felder fuers Teilen. Sie stehen in WhatsApp, Facebook und
   * LinkedIn unter der Vorschau und sind damit sichtbarer Text. Am
   * 22.11.2026 hatte diese Pruefung sie uebersehen, und es standen
   * noch 17 Gedankenstriche darin, nachdem Titel und Beschreibung
   * laengst sauber waren. */
  const teilen = [];
  const rx = /<meta\s+(?:property|name)="(og:(?:title|description)|twitter:(?:title|description))"\s+content="([\s\S]*?)"/g;
  let m;
  while ((m = rx.exec(t)) !== null) teilen.push([m[1], sauber(m[2])]);
  return {
    datei: relative(WURZEL, pfad),
    titel: ti ? sauber(ti[1]) : null,
    beschreibung: be ? sauber(be[1]) : null,
    teilen,
    noindex: /name="robots"\s+content="[^"]*noindex/.test(t),
  };
}

// ── Gegenprobe: Fehler einbauen ────────────────────────────────────
const gesichert = [];
let eingebaut = 0;
if (GEGENPROBE) {
  for (const [datei, muster, ersatz, was] of FEHLER) {
    const p = join(WURZEL, datei);
    const vor = readFileSync(p, 'utf8');
    if (!muster.test(vor)) { console.error('  ACHTUNG: Stelle nicht gefunden in', datei, '(' + was + ')'); continue; }
    gesichert.push([p, vor]);
    writeFileSync(p, vor.replace(muster, ersatz));
    eingebaut++;
  }
}

const maengel = [];
let rechtMitStrich = [];
try {
  const alle = seiten().map(lies).sort((a, b) => a.datei.localeCompare(b.datei));
  const indexierbar = alle.filter(s => !s.noindex);

  for (const s of alle) {
    if (!s.titel) { maengel.push([s.datei, 'kein Titel', '']); continue; }
    /* "enthaelt", nicht "endet mit": Die Produktseiten heissen
     * "... | BV AussenSysteme Westerwald", und der Ortszusatz dahinter
     * ist Absicht. Eine Pruefung auf das Zeilenende hat am 22.11.2026
     * 13 solche Seiten faelschlich beanstandet. */
    if (!s.titel.includes(MARKE)) maengel.push([s.datei, 'Titel ohne Marke', s.titel]);
    if (/[–—]/.test(s.titel) && !RECHTSTEXTE.includes(s.datei))
      maengel.push([s.datei, 'Gedankenstrich im Titel', s.titel]);
    if (!RECHTSTEXTE.includes(s.datei)) {
      for (const [feld, wert] of s.teilen || []) {
        if (/[–—]/.test(wert))
          maengel.push([s.datei, 'Gedankenstrich in ' + feld, wert.slice(0, 70) + '...']);
      }
    }
  }
  for (const s of indexierbar) {
    if (s.titel && s.titel.length > TITEL_MAX)
      maengel.push([s.datei, `Titel ${s.titel.length} Zeichen (max ${TITEL_MAX})`, s.titel]);
    if (!s.beschreibung) { maengel.push([s.datei, 'keine Beschreibung', '']); continue; }
    if (s.beschreibung.length > BESCHR_MAX)
      maengel.push([s.datei, `Beschreibung ${s.beschreibung.length} Zeichen (max ${BESCHR_MAX})`, s.beschreibung.slice(0, 60) + '...']);
    if (/[–—]/.test(s.beschreibung) && !RECHTSTEXTE.includes(s.datei))
      maengel.push([s.datei, 'Gedankenstrich in der Beschreibung', s.beschreibung.slice(0, 60) + '...']);
  }

  /* Doppelte Titel und Beschreibungen. Zwei Seiten mit demselben Titel
   * konkurrieren in der Suche gegeneinander, und Google waehlt dann
   * selbst eine aus. Bei Ortsseiten ist das die haeufigste Ursache. */
  for (const [feld, name] of [['titel', 'Titel'], ['beschreibung', 'Beschreibung']]) {
    const topf = new Map();
    for (const s of indexierbar) if (s[feld]) {
      if (!topf.has(s[feld])) topf.set(s[feld], []);
      topf.get(s[feld]).push(s.datei);
    }
    for (const [wert, wo] of topf)
      if (wo.length > 1) maengel.push([wo.join(', '), `${name} doppelt`, wert.slice(0, 55) + '...']);
  }

  console.log(`\nTitel und Beschreibungen: ${alle.length} Seiten, davon ${indexierbar.length} indexierbar`);
  console.log(`Grenzen: Titel ${TITEL_MAX}, Beschreibung ${BESCHR_MAX} Zeichen (Entities aufgeloest)\n`);
  rechtMitStrich = alle.filter(x => RECHTSTEXTE.includes(x.datei) &&
    /[\u2013\u2014]/.test((x.titel || '') + ' ' + (x.beschreibung || '')));
  if (!maengel.length) console.log('  ok    kein Mangel');
  for (const [wo, was, text] of maengel) console.log(`  FEHLER ${wo}\n         ${was}${text ? '\n         ' + text : ''}`);
} finally {
  for (const [p, vor] of gesichert) writeFileSync(p, vor);
}

if (!GEGENPROBE && rechtMitStrich.length) {
  console.log(`\n  Hinweis, kein Fehler: ${rechtMitStrich.length} Rechtstext(e) mit Gedankenstrich ` +
    `(${rechtMitStrich.map(x => x.datei).join(', ')}). Rechtstexte werden nicht geaendert, ` +
    `nur gemeldet. Siehe docs/rechtstexte-befunde.md.`);
}
console.log('');
if (GEGENPROBE) {
  console.log(`${maengel.length} Beanstandungen bei ${eingebaut} eingebauten Fehlern.`);
  const ok = maengel.length >= eingebaut && eingebaut === FEHLER.length;
  console.log(ok ? 'Gegenprobe bestanden: jeder eingebaute Fehler faellt auf.'
                 : 'Gegenprobe NICHT bestanden.');
  process.exit(ok ? 0 : 1);
}
console.log(maengel.length ? `Ergebnis: ${maengel.length} Mangel` : 'Ergebnis: bestanden');
process.exit(maengel.length ? 1 : 0);
