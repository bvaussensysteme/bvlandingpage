#!/usr/bin/env node
/* ============================================================
   Haengt an jede Leistungskarte der Startseite die Bildliste
   ihrer Produktgruppe.

   ANLASS (20.11.2026). Der Betreiber: "In den einzelnen Leistungen
   kann man immer noch nicht mehrere Bilder angucken bzw. swipen,
   beziehungsweise ich wollte ja so eine Dia-Show haben, dass die
   Bilder nach einigen Zeit selber nach rechts swipen."

   WAS HIER PASSIERT: Die Karte bekommt ein Attribut data-diaschau
   mit den Bildern ihrer Gruppe aus src/_data/galerien.json. Das
   Bild im HTML bleibt unveraendert stehen; js/diaschau.js tauscht
   es spaeter aus. Faellt das Skript aus, steht genau das da, was
   heute da steht.

   WARUM NUR EIN ATTRIBUT UND KEINE 55 BILDER IM HTML: Die
   Startseite traegt ohnehin am meisten. 55 zusaetzliche img-Tags
   waeren Ladezeit fuer etwas, das man nacheinander sieht. Das
   Skript laedt immer nur das naechste Bild vor.

   ZUORDNUNG ueber den Verweis der Karte: produkte/<gruppe>.html.
   Drei Karten haben keine Gruppe im Portfolio (Sonnenschutz,
   Gelaender, Garten & Aussenbereich); sie behalten ihr einzelnes
   Bild. Nichts wird geraten.

   Aufruf: node scripts/baue-leistungen-diaschau.mjs
           node scripts/baue-leistungen-diaschau.mjs --entfernen
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ZIEL = path.join(WURZEL, 'index.html');
const DATEN = JSON.parse(fs.readFileSync(path.join(WURZEL, 'src/_data/galerien.json'), 'utf8'));
const ENTFERNEN = process.argv.includes('--entfernen');

/* Eine einzige Umdeutung, und sie ist belegt: Die Karte "Garten &
   Aussenbereich" fasst Gartenhaus, Fahrradueberdachung, Bushaltestelle
   und Faltdach zusammen. Bilder gibt es im Portfolio nur vom
   Gartenhaus, und genau eines davon steht heute schon auf der Karte
   (images/vd_prod_gartenhaus.jpg). Die weiteren drei zeigen dasselbe
   Produkt, das ist also keine erfundene Zuordnung. */
const UMDEUTUNG = { 'garten-aussenbereich': 'gartenhaus' };

export function listeFuer(gruppe) {
  gruppe = UMDEUTUNG[gruppe] || gruppe;
  const g = DATEN[gruppe];
  if (!g) return null;
  const bilder = g.bilder || g;
  return bilder.map((b) => ({ d: `images/portfolio/${gruppe}/${b.datei}`, a: b.alt }));
}

function maskieren(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* Eine Karte reicht von <article class="leistung-card" bis </article>. */
const KARTE = /<article class="leistung-card"[\s\S]*?<\/article>/g;

export function umbauen(html, entfernen) {
  let getroffen = 0, uebersprungen = [];
  const neu = html.replace(KARTE, (karte) => {
    const ohne = karte.replace(/(<div class="leistung-img)" data-diaschau="[^"]*"/, '$1"');
    if (entfernen) { if (ohne !== karte) getroffen++; return ohne; }
    const v = ohne.match(/class="leistung-link" href="produkte\/([a-z-]+)\.html"/);
    const titel = (ohne.match(/itemprop="name">([^<]*)</) || [])[1] || '?';
    if (!v) { uebersprungen.push(`${titel} (kein Produktverweis)`); return ohne; }
    const liste = listeFuer(v[1]);
    if (!liste) { uebersprungen.push(`${titel} (keine Bildgruppe "${v[1]}")`); return ohne; }
    getroffen++;
    return ohne.replace('<div class="leistung-img"',
      `<div class="leistung-img" data-diaschau="${maskieren(JSON.stringify(liste))}"`);
  });
  return { neu, getroffen, uebersprungen };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const vorher = fs.readFileSync(ZIEL, 'utf8');
  const { neu, getroffen, uebersprungen } = umbauen(vorher, ENTFERNEN);
  if (neu !== vorher) fs.writeFileSync(ZIEL, neu);
  console.log(ENTFERNEN
    ? `${getroffen} Karten zurueckgebaut.`
    : `${getroffen} Leistungskarten mit Bildliste versehen.`);
  for (const u of uebersprungen) console.log(`  ohne Diaschau: ${u}`);
}
