#!/usr/bin/env node
/* Prüft die Daten des Baugenehmigungs-Checks auf Widersprüche.
 *
 * Hintergrund: Der Betreiber meldete "die entstehenden Infos sind teilweise
 * widersprüchlich". Die Prüfung ergab: Der Kaltwintergarten trug das Etikett
 * "genehmigungspflichtig", während der Text daneben genehmigungsfreie Fälle
 * nannte; derselbe Status hatte je nach Bundesland mal eine gelbe, mal eine
 * rote Farbe. Solche Widersprüche fallen Kunden sofort auf.
 *
 * Geprüft wird:
 *   1. Status nur aus dem festgelegten Wortschatz
 *   2. Farbe passt zum Status (grün/gelb/rot)
 *   3. Text widerspricht dem Etikett nicht
 *   4. Jedes Bundesland hat alle fünf Produkte
 *   5. "geprueft" steht nur bei den am Gesetzestext kontrollierten Ländern
 *
 * Gegenprobe: node scripts/pruefe-lbo-daten.js --gegenprobe
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.dirname(__dirname);
const DATEI = path.join(WURZEL, 'js', 'baugenehmigung-data.js');

const STATUS_FARBE = {
  'meistens genehmigungsfrei': 'green',
  'kommt auf die Ausführung an': 'yellow',
  'genehmigungspflichtig': 'red'
};
const PRODUKTE = ['terrassenueberdachung', 'carport', 'kaltwintergarten',
                  'glasschiebeanlage', 'aussenanlage'];
// Am Gesetzestext gegengeprüft – siehe docs/entscheidungen.md
const GEPRUEFT = ['Rheinland-Pfalz', 'Hessen', 'Nordrhein-Westfalen'];

function laden() {
  const quelle = fs.readFileSync(DATEI, 'utf8');
  return eval('(function(){' + quelle.replace(/^const /m, 'var ') + '; return LBO_DATA;})()');
}

function pruefen(daten) {
  const fehler = [];

  Object.keys(daten).forEach(function (land) {
    const v = daten[land];

    PRODUKTE.forEach(function (k) {
      if (!v.produkte || !v.produkte[k]) fehler.push(land + ': Produkt "' + k + '" fehlt');
    });

    if (v.geprueft && GEPRUEFT.indexOf(land) === -1) {
      fehler.push(land + ': als geprüft markiert, steht aber nicht auf der Liste der ' +
                  'am Gesetzestext kontrollierten Länder');
    }
    if (!v.geprueft && GEPRUEFT.indexOf(land) > -1) {
      fehler.push(land + ': sollte als geprüft markiert sein');
    }

    Object.keys(v.produkte || {}).forEach(function (k) {
      const p = v.produkte[k];
      const erwartet = STATUS_FARBE[p.status];

      if (!erwartet) {
        fehler.push(land + '/' + k + ': unbekannter Status "' + p.status + '"');
        return;
      }
      if (p.statusClass !== erwartet) {
        fehler.push(land + '/' + k + ': Status "' + p.status + '" müsste die Farbe "' +
                    erwartet + '" haben, hat aber "' + p.statusClass + '"');
      }

      // Der Text direkt unter dem Etikett darf ihm nicht widersprechen.
      const bed = String(p.bedingung || '');
      const sagtFrei = /genehmigungsfrei|verfahrensfrei/i.test(bed);
      const sagtPflicht = /genehmigungspflichtig/i.test(bed);
      if (p.status === 'meistens genehmigungsfrei' && sagtPflicht && !sagtFrei) {
        fehler.push(land + '/' + k + ': Etikett sagt genehmigungsfrei, der Text nennt nur ' +
                    'Genehmigungspflicht – "' + bed.slice(0, 60) + '"');
      }
      if (p.status === 'genehmigungspflichtig' && sagtFrei) {
        fehler.push(land + '/' + k + ': Etikett sagt genehmigungspflichtig, der Text nennt ' +
                    'genehmigungsfreie Fälle – "' + bed.slice(0, 60) + '"');
      }
    });
  });

  return fehler;
}

function gegenprobe() {
  console.log('Gegenprobe: absichtlich widersprüchliche Daten');
  const kaputt = {
    'Testland': {
      geprueft: '09/2026',          // steht nicht auf der Liste
      produkte: {
        terrassenueberdachung: {
          status: 'genehmigungspflichtig', statusClass: 'yellow',   // Farbe passt nicht
          bedingung: 'bis 50 m² genehmigungsfrei'                    // Text widerspricht
        },
        carport: { status: 'Fantasiewert', statusClass: 'green', bedingung: 'egal' }
        // die übrigen drei Produkte fehlen
      }
    }
  };
  const fehler = pruefen(kaputt);
  fehler.forEach(function (f) { console.log('  erkannt:  ' + f); });
  const erwartet = ['fehlt', 'Farbe', 'widerspricht|nennt', 'unbekannter Status', 'geprüft markiert'];
  const fehlend = erwartet.filter(function (e) {
    return !fehler.some(function (f) { return new RegExp(e).test(f); });
  });
  if (fehlend.length) {
    console.log('  FEHLGESCHLAGEN – nicht erkannt: ' + fehlend.join(', '));
    return 1;
  }
  console.log('  bestanden – alle eingebauten Widersprüche wurden gefunden');
  return 0;
}

function main() {
  if (process.argv.indexOf('--gegenprobe') > -1) return gegenprobe();

  const daten = laden();
  const laender = Object.keys(daten).length;
  const fehler = pruefen(daten);
  console.log('Baugenehmigungs-Daten: ' + laender + ' Bundesländer, davon ' +
              GEPRUEFT.length + ' am Gesetzestext geprüft');
  if (!fehler.length) {
    console.log('  ok      keine Widersprüche zwischen Etikett, Farbe und Text');
    console.log('Ergebnis: bestanden');
    return 0;
  }
  fehler.forEach(function (f) { console.log('  FEHLER  ' + f); });
  console.log('Ergebnis: nicht bestanden');
  return 1;
}

process.exit(main());
