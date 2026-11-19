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

const ANFANG = '  <!-- ANFANG Ausfuehrungsbeispiele (erzeugt von scripts/baue-staedte-galerie.mjs) -->';
const ENDE = '  <!-- ENDE Ausfuehrungsbeispiele -->';

function block(schluessel, stadt) {
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

const dateien = fs.readdirSync(WURZEL)
  .filter((f) => /^(carport|pergola|terrassenueberdachung)-[a-z-]+\.html$/.test(f));
let geaendert = 0;
for (const datei of dateien) {
  const schluessel = ZUORDNUNG[datei.split('-')[0]];
  const stadt = datei.replace(/^[a-z]+-/, '').replace('.html', '');
  const pfad = path.join(WURZEL, datei);
  let t = fs.readFileSync(pfad, 'utf8');

  /* Vorhandenen Block ersetzen statt verdoppeln. */
  const alt = new RegExp(ANFANG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + ENDE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
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
    t = t.replace('</body>', '  <script src="/js/galerie.js?v=20261119e" defer></script>\n</body>');
  }
  fs.writeFileSync(pfad, t);
  geaendert++;
  console.log(`  ${datei.padEnd(42)} ${schluessel}, ${WIEVIEL} Bilder`);
}
console.log(`\n${geaendert} Staedteseiten mit Bilderstreifen versehen.`);
