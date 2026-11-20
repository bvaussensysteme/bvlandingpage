#!/usr/bin/env node
/* ============================================================
   Haengt an jede Leistungskarte der Startseite die Bildliste
   ihrer Produktgruppe.

   ANLASS (20.11.2026). Der Betreiber wollte zuerst eine Diaschau,
   hat sie nach dem ersten Ansehen verworfen und stattdessen gesagt:
   "einfach nur, dass man die Bilder swipen kann [...] dass links und
   rechts so zwei Pfeile auftauchen, wenn man drueber ueber das Bild
   faehrt mit der Maus". Die Bildliste bleibt dieselbe, nur das
   Blaettern ist jetzt von Hand.

   WAS HIER PASSIERT: Die Karte bekommt ein Attribut data-bilder
   mit den Bildern ihrer Gruppe aus src/_data/galerien.json. Das
   Bild im HTML bleibt unveraendert stehen; js/bilder-blaettern.js tauscht
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

   Aufruf: node scripts/baue-leistungen-bilder.mjs
           node scripts/baue-leistungen-bilder.mjs --entfernen
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

/* Hoechstens fuenf Bilder aus dem Portfolio je Karte. Mit dem Bild,
   das schon auf der Karte steht, sind es sechs.

   WARUM BEGRENZT (20.11.2026): Unter dem Bild stehen Punkte, die
   zeigen, wo man gerade ist. Neunzehn Punkte unter einem 360 x 200
   grossen Bild sind kein Hinweis mehr, sondern ein Muster. Der
   Betreiber hat von "1 von 6 oder 1 von 3" gesprochen, also von
   kleinen Zahlen. Die vollstaendige Gruppe steht weiterhin auf der
   Produktseite, einen Klick entfernt. Nebenher haelt es die
   Startseite klein: vorher 132 KB, mit allen Bildern waere sie
   weiter gewachsen. */
const HOECHSTENS = 5;

export function listeFuer(gruppe) {
  gruppe = UMDEUTUNG[gruppe] || gruppe;
  const g = DATEN[gruppe];
  if (!g) return null;
  const bilder = (g.bilder || g).slice(0, HOECHSTENS);
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
    /* Auch data-diaschau mit heraus: So hiess das Attribut am
       20.11.2026 fuer ein paar Stunden, als hier noch eine Diaschau
       stand. Nach dem Umbenennen blieben beide Attribute in der
       Seite stehen, weil der Generator den alten Namen nicht mehr
       kannte. Die Zeile raeumt das auf und darf erst weg, wenn
       sicher keine Seite mehr das alte Attribut traegt. */
    const ohne = karte
      .replace(/(<div class="leistung-img)" data-bilder="[^"]*"/, '$1"')
      .replace(/(<div class="leistung-img)" data-diaschau="[^"]*"/, '$1"')
      .replace(/ data-diaschau="[^"]*"/, '');
    if (entfernen) { if (ohne !== karte) getroffen++; return ohne; }
    const v = ohne.match(/class="leistung-link" href="produkte\/([a-z-]+)\.html"/);
    const titel = (ohne.match(/itemprop="name">([^<]*)</) || [])[1] || '?';
    if (!v) { uebersprungen.push(`${titel} (kein Produktverweis)`); return ohne; }
    const liste = listeFuer(v[1]);
    if (!liste) { uebersprungen.push(`${titel} (keine Bildgruppe "${v[1]}")`); return ohne; }
    getroffen++;
    return ohne.replace('<div class="leistung-img"',
      `<div class="leistung-img" data-bilder="${maskieren(JSON.stringify(liste))}"`);
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
  for (const u of uebersprungen) console.log(`  ohne Bilderwechsel: ${u}`);
}
