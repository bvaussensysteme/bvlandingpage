#!/usr/bin/env node
/* ============================================================
   Setzt den Bilderstreifen in die 14 Staedteseiten.

   WARUM EIN SKRIPT: Die Staedteseiten sind handgepflegtes HTML und
   laufen nicht durch Eleventy; der Include aus
   src/_includes/galerie.njk greift dort nicht. Statt den Block
   vierzehnmal von Hand zu kopieren, erzeugt ihn dieses Skript aus
   derselben Quelle wie die Produktseiten: src/_data/galerien.json.

   Es ist WIEDERHOLBAR: Ein vorhandener Block wird ersetzt, nicht
   verdoppelt. Nach jeder Aenderung an den Bildern oder Texten
   einfach noch einmal laufen lassen.

   Aufruf: node scripts/baue-staedte-galerie.mjs
           node scripts/baue-staedte-galerie.mjs --entfernen

   Die Gegenseite ist scripts/pruefe-staedte-galerie.mjs: Sie laedt
   dieses Modul, baut die Bloecke aus denselben Daten noch einmal und
   vergleicht sie mit dem, was wirklich in den 14 Dateien steht. Dafuer
   sind block(), ANFANG, ENDE und der Dateifilter unten exportiert, und
   der Schreib-Durchlauf laeuft nur beim direkten Aufruf.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATEN = JSON.parse(fs.readFileSync(path.join(WURZEL, 'src/_data/galerien.json'), 'utf8'));

/* Welche Seite zeigt welches Produkt, und wie viele Bilder.
   Vier reichen: Die Staedteseiten sind kurz, und wer mehr sehen
   will, geht auf die Produktseite. */
const ZUORDNUNG = { carport: 'carport', pergola: 'pergola',
                    terrassenueberdachung: 'terrassenueberdachung' };
const WIEVIEL = 4;
const VERSION = '20261119f';   /* Cache-Buster fuer js/galerie.js, hier EINE Quelle */
const ENTFERNEN = process.argv.includes('--entfernen');

export const ANFANG = '  <!-- ANFANG Ausfuehrungsbeispiele (erzeugt von scripts/baue-staedte-galerie.mjs) -->';
export const ENDE = '  <!-- ENDE Ausfuehrungsbeispiele -->';

export function block(schluessel, stadt) {
  const g = DATEN[schluessel];
  const bilder = g.bilder.slice(0, WIEVIEL);
  const kacheln = bilder.map((b, i) => `        <li><button type="button" class="galerie-kachel" data-nr="${i}" aria-label="${b.alt} groß anzeigen"><img src="/images/portfolio/${schluessel}/${b.datei}" alt="${b.alt}" width="800" height="450"${i > 0 ? ' loading="lazy"' : ''} decoding="async"></button></li>`).join('\n');
  return `${ANFANG}
  <section class="section galerie-streifen-sektion" aria-labelledby="galerieTitel-${schluessel}">
    <div class="container">
      <h2 id="galerieTitel-${schluessel}">Ausführungsbeispiele</h2>
      <div class="galerie-kopf">
        <p class="galerie-streifen-hinweis">${g.bezeichnung}: ${bilder.length} Ansichten zum Durchblättern. Herstellerdarstellungen, keine Fotos von uns gebauter Anlagen. Mehr Ansichten auf der <a href="/produkte/${schluessel}.html">Produktseite</a>.</p>
        <div class="galerie-steuer">
          <span class="galerie-zaehler" aria-hidden="true" data-zaehler="${schluessel}">1 / ${bilder.length}</span>
          <button type="button" class="galerie-pfeil galerie-pfeil--zurueck" data-pfeil="zurueck" aria-label="Vorherige Bilder zeigen"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
          <button type="button" class="galerie-pfeil galerie-pfeil--vor" data-pfeil="vor" aria-label="Weitere Bilder zeigen"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
      </div>
      <ul class="galerie-streifen" role="list" aria-labelledby="galerieTitel-${schluessel}" data-galerie="${schluessel}">
${kacheln}
      </ul>
    </div>
  </section>
${ENDE}`;
}

export function staedteseiten() {
  return fs.readdirSync(WURZEL)
    .filter((f) => /^(carport|pergola|terrassenueberdachung)-[a-z-]+\.html$/.test(f))
    .sort();
}
export function teileAuf(datei) {
  return { schluessel: ZUORDNUNG[datei.split('-')[0]],
           stadt: datei.replace(/^[a-z]+-/, '').replace('.html', '') };
}
export { WURZEL, VERSION };

/* Nur beim direkten Aufruf schreiben. Beim Import durch die Pruefung
   darf nichts angefasst werden. */
const DIREKT = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!DIREKT) { /* Modulbetrieb: Rest ueberspringen */ }

const dateien = DIREKT ? staedteseiten() : [];
let geaendert = 0;

/* --entfernen macht die Aenderung rueckgaengig: Block heraus, Skript-Zeile
   heraus, sonst nichts. ANLASS (19.11.2026): Der cto-Pruefer fand, dass
   docs/VD-INHALTE-INVENTAR.md eine Rueckrollbarkeit behauptete, die es
   fuer die 14 Staedteseiten nicht gab. Die Seiten sind von Hand gepflegt
   und nicht erzeugt, ein "git checkout" wuerde also auch fremde
   Aenderungen mitnehmen. Deshalb ein Schalter, der nur den eigenen Block
   trifft. */
for (const datei of dateien) {
  const schluessel = ZUORDNUNG[datei.split('-')[0]];
  const stadt = datei.replace(/^[a-z]+-/, '').replace('.html', '');
  const pfad = path.join(WURZEL, datei);
  let t = fs.readFileSync(pfad, 'utf8');

  /* Vorhandenen Block ersetzen statt verdoppeln. */
  const alt = new RegExp(ANFANG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + ENDE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (ENTFERNEN) {
    if (!alt.test(t)) { console.log(`  ${datei.padEnd(42)} kein Block, nichts zu tun`); continue; }
    /* Die Leerzeile VOR dem Block gehoert dazu: eingefuegt wird
       '\n\n' + Block, also muss beides wieder weg, sonst bleibt bei
       jedem Rueckbau eine Leerzeile stehen. */
    t = t.replace(new RegExp('\n*' + alt.source), '');
    t = t.replace(/^.*js\/galerie\.js.*\n/m, '');
    fs.writeFileSync(pfad, t);
    geaendert++;
    console.log(`  ${datei.padEnd(42)} Block und Skript entfernt`);
    continue;
  }

  if (alt.test(t)) {
    t = t.replace(alt, block(schluessel, stadt));
  } else {
    /* Vor den letzten dunklen Abschluss-Abschnitt. */
    const stellen = [...t.matchAll(/\n  <section class="section" style="background:var\(--dark\);text-align:center;">/g)];
    const stelle = stellen.length ? stellen[stellen.length - 1].index : t.lastIndexOf('\n  </main>');
    if (stelle < 0) { console.log('  KEIN ANKER:', datei); continue; }
    t = t.slice(0, stelle) + '\n\n' + block(schluessel, stadt) + t.slice(stelle);
  }
  if (!t.includes('js/galerie.js')) {
    t = t.replace('</body>', `  <script src="/js/galerie.js?v=${VERSION}" defer></script>\n</body>`);
  } else {
    /* Version mitziehen. Ohne das blieb der Cache-Buster beim ersten Wert
       stehen, obwohl js/galerie.js sich geaendert hatte. */
    t = t.replace(/(js\/galerie\.js\?v=)[0-9a-z]+/, `$1${VERSION}`);
  }
  fs.writeFileSync(pfad, t);
  geaendert++;
  console.log(`  ${datei.padEnd(42)} ${schluessel}, ${WIEVIEL} Bilder`);
}
if (DIREKT) console.log(`\n${geaendert} Staedteseiten ${ENTFERNEN ? 'zurueckgebaut' : 'mit Bilderstreifen versehen'}.`);
