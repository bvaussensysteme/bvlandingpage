#!/usr/bin/env node
/* Prüft den PDF-Erzeuger aus js/pdf-blatt.js.

   WARUM EIGENES SKRIPT: Das PDF entsteht erst im Browser des Kunden. Ein
   Fehler darin fällt nirgends auf – der Knopf lädt eine Datei herunter,
   und ob der Betrachter sie öffnen kann, sieht man erst beim Kunden.

   ZWEITER WEG: Erzeugt wird hier mit unserem Code, GELESEN wird mit
   pdfinfo und pdftotext aus poppler – fremden Werkzeugen, die nichts von
   unseren Annahmen wissen. Stimmt die xref-Tabelle nicht oder ist ein
   Byte zu viel gezählt, meldet poppler das, nicht wir selbst.

   --gegenprobe verfälscht JEDE Prüfung einzeln und erwartet, dass alle
   anschlagen. */
'use strict';
var fs = require('fs'), os = require('os'), path = require('path');
var cp = require('child_process');

var gegen = process.argv.indexOf('--gegenprobe') > -1;
var fehler = 0, geprueft = 0;
function pruefe(name, ok, info) {
  geprueft++;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok    ' : 'FEHLER') + '  ' + name + (info ? '   ' + info : ''));
}

var quelle = fs.readFileSync(path.join(__dirname, '..', 'js', 'pdf-blatt.js'), 'utf8');
var fenster = { atob: global.atob, Blob: global.Blob };
new Function('window', quelle)(fenster);
var PDF = fenster.BV_PDF;
pruefe('Modul meldet sich an', !!(PDF && PDF.erzeugen) && !gegen, 'window.BV_PDF');
if (!PDF) { process.exit(1); }

var jpg = fs.readFileSync(path.join(__dirname, '..', 'images', 'markise.jpg'));
var datenUrl = 'data:image/jpeg;base64,' + jpg.toString('base64');

/* Bildmasse: unser Parser gegen die Kopfdaten, die identify/pdfimages
   spaeter im PDF sehen. */
var m = PDF.jpegMasse(new Uint8Array(jpg));
pruefe('JPEG-Masse werden gelesen',
       m.breit > 0 && m.hoch > 0 && !gegen, m.breit + ' x ' + m.hoch + ' Pixel');

/* Umlaute, Anfuehrungszeichen und Grad-Zeichen muessen durch WinAnsi
   kommen – sonst steht im PDF Kauderwelsch, und zwar genau in den
   Massangaben. */
var wa = PDF.winAnsi(gegen ? 'Masse' : 'Maße 2,30 m × 90° „Grün"');
pruefe('Umlaute werden nach WinAnsi umgesetzt',
       wa.indexOf(0xDF) > -1 && wa.indexOf(0xD7) > -1 &&
       wa.indexOf(0xB0) > -1 && wa.indexOf(0x84) > -1,
       'ß, ×, ° und „ als je ein Byte');

var titel = ['Perspektive', 'Von oben', 'Darunter'];
var seiten = [
  { titel: titel[0], rechts: 'Terrassendach TDS, 5000 x 3000 mm',
    unten: 'Unverbindliche Darstellung', bild: datenUrl },
  { titel: titel[1], unten: 'Unverbindliche Darstellung', bild: datenUrl },
  { titel: 'Ihre Konfiguration', unten: 'Unverbindliche Darstellung',
    zeilen: ['Terrassendach TDS', 'Breite 5000 mm', 'Hoehe 2300 mm',
             'Dachneigung 8 Grad', 'Farbe Anthrazit'] },
  { titel: titel[2], unten: 'Unverbindliche Darstellung', bild: datenUrl }
];

var blob = PDF.erzeugen(seiten, { titel: 'Terrassendach TDS' });
var datei = path.join(os.tmpdir(), 'bv-pruefe-' + process.pid + '.pdf');

blob.arrayBuffer().then(function (ab) {
  var buf = Buffer.from(ab);
  fs.writeFileSync(datei, buf);

  function lauf(befehl, args) {
    var r = cp.spawnSync(befehl, args, { encoding: 'utf8' });
    return (r.status === 0 ? (r.stdout || '') : '') + (r.status !== 0 ? '\x00FEHLER' : '');
  }

  /* JEDE Pruefung bekommt ihre EIGENE Verfaelschung. Der erste Versuch
     kippte ein Byte in der xref-Tabelle und erwartete, dass alles
     anschlaegt – poppler repariert eine kaputte xref aber stillschweigend,
     und acht von elf Pruefungen liefen weiter durch. Eine Gegenprobe, die
     nicht anschlaegt, beweist nichts. */

  /* Oeffnen: eine ZWEITE Datei, abgeschnitten nach 400 Bytes, damit die
     echte fuer die uebrigen Pruefungen heil bleibt.
     Erst den %PDF-Kopf zu ueberschreiben reichte NICHT – poppler sucht
     ihn im ganzen Vorspann und las die Datei trotzdem. Eine abgeschnittene
     Datei kann es nicht retten: Die Objekte fehlen einfach. */
  var pruefDatei = datei;
  if (gegen) {
    pruefDatei = datei.replace('.pdf', '-kaputt.pdf');
    fs.writeFileSync(pruefDatei, buf.slice(0, 400));
  }
  var infoK = lauf('pdfinfo', [pruefDatei]);
  pruefe('poppler kann die Datei oeffnen', infoK.indexOf('\x00FEHLER') === -1,
         infoK.indexOf('\x00FEHLER') === -1 ? 'pdfinfo liest sie' : 'pdfinfo meldet einen Fehler');
  if (gegen) { try { fs.unlinkSync(pruefDatei); } catch (e) { /* egal */ } }

  var info = lauf('pdfinfo', [datei]);
  pruefe('Seitenzahl stimmt',
         new RegExp('Pages:\\s*' + (gegen ? 5 : 4) + '\\b').test(info),
         (info.match(/Pages:\s*\d+/) || ['keine Angabe'])[0]);
  pruefe('Querformat A4',
         new RegExp('Page size:\\s*' + (gegen ? '595 x 842' : '842 x 595')).test(info),
         (info.match(/Page size:[^\n]*/) || ['keine Angabe'])[0]);
  pruefe('Titel steht in den Dateiangaben',
         new RegExp('Title:\\s*' + (gegen ? 'Carport' : 'Terrassendach TDS')).test(info), '');

  var text = lauf('pdftotext', [datei, '-']);
  var suche = gegen ? titel.concat(['Seitenansicht von hinten']) : titel;
  var fehlt = suche.filter(function (t) { return text.indexOf(t) === -1; });
  pruefe('Alle Ueberschriften stehen im Text', fehlt.length === 0,
         fehlt.length ? 'fehlt: ' + fehlt.join(', ') : titel.length + ' Ansichten');
  pruefe('Die Textseite steht drin',
         text.indexOf('Ihre Konfiguration') > -1 &&
         text.indexOf(gegen ? 'Schneelast' : 'Dachneigung') > -1, '');
  pruefe('Die Fusszeile steht auf jeder Seite',
         (text.match(/Unverbindliche Darstellung/g) || []).length === (gegen ? 5 : 4),
         (text.match(/Unverbindliche Darstellung/g) || []).length + ' von 4');

  /* Dritter Weg: Das eingebettete Bild zurueckmessen. pdfimages kennt
     unseren Code nicht und liest die Masse aus dem PDF selbst. */
  var bilder = lauf('pdfimages', ['-list', datei]);
  if (bilder.indexOf('\x00FEHLER') > -1) {
    pruefe('Bilder liegen in voller Groesse im PDF', false, 'pdfimages nicht verfuegbar');
  } else {
    var zeilen = bilder.split('\n').filter(function (z) { return /image/.test(z); });
    var sollB = m.breit + (gegen ? 1 : 0);
    var passt = zeilen.length === 3 && zeilen.every(function (z) {
      var t = z.trim().split(/\s+/);
      return Number(t[3]) === sollB && Number(t[4]) === m.hoch;
    });
    pruefe('Bilder liegen in voller Groesse im PDF', passt,
           zeilen.length + ' Bilder, erwartet 3 mit ' + sollB + ' x ' + m.hoch);
  }

  /* ---------- Der Baugenehmigungs-Check auf demselben Unterbau ----------
     js/bg-pdf.js hatte bis zum 12.10.2026 seinen eigenen Dateiaufbau und
     war NIRGENDS geprueft. Jetzt baut es auf ausStroemen() auf – also muss
     hier auch sein PDF einmal wirklich entstehen und von poppler lesbar
     sein, sonst merkt den Bruch niemand.

     EHRLICH DAZU: Geprueft wird der Dateiaufbau, nicht die Typografie.
     Die Textbreite misst bg-pdf ueber die Canvas-API des Browsers; die
     gibt es hier nicht, darum misst der Ersatz unten grob ueber die
     Zeichenzahl. Zeilenumbrueche koennen deshalb anders fallen als im
     Browser – ob die Datei gueltig ist und ihr Text ankommt, sagt das
     trotzdem. */
  var bgQuelle = fs.readFileSync(path.join(__dirname, '..', 'js', 'bg-pdf.js'), 'utf8');
  var bgFenster = {
    atob: global.atob, Blob: global.Blob, BV_PDF: PDF,
    document: {
      createElement: function () {
        return { getContext: function () {
          return { font: '', measureText: function (t) {
            var gr = parseFloat((this.font.match(/([\d.]+)px/) || [0, 10])[1]);
            return { width: String(t).length * gr * 0.5 };
          } };
        } };
      }
    }
  };
  bgFenster.window = bgFenster;
  new Function('window', 'document', 'Blob',
               bgQuelle)(bgFenster, bgFenster.document, global.Blob);
  var BG = bgFenster.bvBgPdf;
  pruefe('Baugenehmigungs-Check meldet sich an', !!(BG && BG.erzeugen) && !gegen,
         'window.bvBgPdf');

  if (BG && BG.erzeugen) {
    var bgBlob = BG.erzeugen({
      titel: 'Baugenehmigungs-Check Montabaur',
      standort: 'Montabaur, Rheinland-Pfalz',
      erstellt: 'Erstellt am 12.10.2026',
      behoerde: [
        { feld: 'Bauaufsicht', wert: 'Kreisverwaltung Westerwaldkreis' },
        { feld: 'Anschrift', wert: 'Peter-Altmeier-Platz 1, 56410 Montabaur' }
      ],
      quelle: 'LBauO Rheinland-Pfalz, Anlage zu § 62',
      hinweis: 'Diese Auskunft ersetzt keine Bauvoranfrage.',
      fuss: ['Unverbindliche Auskunft nach bestem Wissen.'],
      kontakt: 'BV AussenSysteme, bv-aussensysteme.de'
    });
    bgBlob.arrayBuffer().then(function (bgAb) {
      var bgDatei = path.join(os.tmpdir(), 'bv-pruefe-bg-' + process.pid + '.pdf');
      var bgBuf = Buffer.from(bgAb);
      fs.writeFileSync(bgDatei, bgBuf);
      /* Eigene Verfaelschung, wie oben: eine abgeschnittene Kopie, damit
         die echte Datei fuer die uebrigen Pruefungen heil bleibt. */
      var bgPruef = bgDatei;
      if (gegen) {
        bgPruef = bgDatei.replace('.pdf', '-kaputt.pdf');
        fs.writeFileSync(bgPruef, bgBuf.slice(0, 400));
      }
      var bgOffen = lauf('pdfinfo', [bgPruef]);
      pruefe('Baugenehmigungs-PDF laesst sich oeffnen',
             bgOffen.indexOf('\x00FEHLER') === -1 && /Pages:\s*1\b/.test(bgOffen),
             (bgOffen.match(/Pages:\s*\d+/) || ['nicht lesbar'])[0]);
      if (gegen) { try { fs.unlinkSync(bgPruef); } catch (e) { /* egal */ } }
      var bgInfo = lauf('pdfinfo', [bgDatei]);
      pruefe('Baugenehmigungs-PDF ist A4 hoch',
             new RegExp('Page size:\\s*' + (gegen ? '842 x 595' : '595.28 x 841.89'))
               .test(bgInfo),
             (bgInfo.match(/Page size:[^\n]*/) || ['keine Angabe'])[0]);
      var bgText = lauf('pdftotext', [bgDatei, '-']);
      pruefe('Baugenehmigungs-PDF traegt seinen Inhalt',
             bgText.indexOf('Westerwaldkreis') > -1 &&
             bgText.indexOf(gegen ? 'Schneelastzone' : 'Baugenehmigungs-Check') > -1, '');
      /* Umlaute gehen durch denselben Weg wie beim Konfigurator – hier
         aber aus bg-pdfs eigenem kodieren(). Laeuft einer der beiden
         Wege doppelt, steht hier Kauderwelsch. */
      pruefe('Baugenehmigungs-PDF: Umlaute kommen an',
             bgText.indexOf(gegen ? 'Zustaendige' : 'Zuständige') > -1,
             'kein doppeltes Umkodieren');
      try { fs.unlinkSync(bgDatei); } catch (e) { /* egal */ }
      abschluss();
    });
  } else { abschluss(); }

  function abschluss() {
  try { fs.unlinkSync(datei); } catch (e) { /* egal */ }

  console.log(gegen
    ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
    : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
  process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
  }
});
