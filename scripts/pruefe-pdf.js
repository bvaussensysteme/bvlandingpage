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

  /* ---------- Zweispaltige Seiten richtig zurueckzulesen ----------
     Der erste Versuch las die Seite mit „pdftotext -layout" am Stueck.
     Ergebnis: 29 von 34 Zeilen schienen zu fehlen, obwohl sie im Bild
     alle dastehen. Grund: pdftotext liest ueber BEIDE Spalten hinweg;
     eine umgebrochene Angabe wird dann vom Text der Nachbarspalte
     unterbrochen und ist als Ganzes nicht mehr zu finden.

     Darum wird jede Spalte einzeln ausgeschnitten (-x/-W) und erst
     danach zusammengehaengt. Haette ich dem ersten Ergebnis geglaubt,
     haette ich einen Fehler gesucht, den es nicht gibt – und womoeglich
     das Layout dafuer kaputtgemacht. */
  function textSpaltenweise(datei, anzahlSeiten) {
    var ganz = '', sp;
    for (var nr = 1; nr <= anzahlSeiten; nr++) {
      [[28, 384], [408, 402]].forEach(function (s) {
        sp = lauf('pdftotext', ['-f', String(nr), '-l', String(nr),
                                '-x', String(s[0]), '-y', '0',
                                '-W', String(s[1]), '-H', '595',
                                '-layout', datei, '-']);
        ganz += ' ' + sp;
      });
    }
    return ganz.replace(/\s+/g, ' ');
  }

  /* ---------- Nichts wird abgeschnitten ----------
     „alle infos sollen lesbar bleiben" (Betreiber, 12.10.2026). Vorher
     kuerzte die Konfigurationsseite zu lange Angaben mit „…" – betroffen
     waren ausgerechnet die Schiebeanlagen, also das Teuerste am Dach.

     Geprueft wird deshalb am ENDPRODUKT: Die Seite wird gebaut, als PDF
     geschrieben und mit pdftotext zurueckgelesen. Jede uebergebene Zeile
     muss sich darin wiederfinden – ueber Zeilenumbrueche hinweg, darum
     werden beim Vergleich alle Leerraeume vereinheitlicht. */
  var langeZeilen = [
    'Schiebeanlage rechts: 3390 mm licht - SG23, 3-rails, 3-tuerig, ESG 10 mm klar, Griff rund',
    'SG23 Richtungsangaben: von INNEN gesehen (links/rechts wie im VD-Anfrageformular)',
    'SG23 Buerstendichtung: Buerstenprofil inkl. Buersten, Lieferlaenge 2500 mm - zwei Stueck',
    'Markisenstoff: AC219 - Greenery - Wassersaeule 350 mm - Lichtechtheit 4/5'
  ];
  var konfSeite = {
    titel: 'Ihre Konfiguration',
    kopf: 'Terrassendach TDS  -  Wandmontage',
    kacheln: [
      { label: 'Breite x Tiefe', wert: '5000 x 3500 mm' },
      { label: 'Durchgangshoehe', wert: '2200 mm' },
      { label: 'Eindeckung', wert: 'VSG 8 mm klar' },
      { label: 'Farbe', wert: 'Anthrazit' }
    ],
    gruppen: [
      { titel: 'Konstruktion und Masse',
        zeilen: ['8 Sparren, 3 Pfosten je Reihe', 'Dachneigung: 7 Grad (12,3 %)',
                 'Schiebeanlage links: 2890 mm licht (Vorschlag, Aufteilung nach Aufmass)'] },
      { titel: 'Seiten und Verglasung', zeilen: langeZeilen.slice(0, 3) },
      { titel: 'Komfort und Zubehoer', zeilen: [langeZeilen[3], 'LED-Spots: 12er-Set'] }
    ],
    unten: 'Unverbindliche Darstellung',
    ruf: 'Kostenloses Aufmass vor Ort: 0156 78696609'
  };
  var kBlob = PDF.erzeugen([konfSeite], { titel: 'Konfiguration' });
  kBlob.arrayBuffer().then(function (kAb) {
    var kDatei = path.join(os.tmpdir(), 'bv-pruefe-konf-' + process.pid + '.pdf');
    fs.writeFileSync(kDatei, Buffer.from(kAb));
    var kText = textSpaltenweise(kDatei, 1);
    var suche = langeZeilen.concat(gegen ? ['Diese Angabe wurde nie uebergeben'] : []);
    var abgeschnitten = suche.filter(function (z) {
      return kText.indexOf(z.replace(/\s+/g, ' ')) === -1;
    });
    pruefe('Lange Angaben stehen vollstaendig im PDF', abgeschnitten.length === 0,
           abgeschnitten.length ? 'fehlt oder gekuerzt: ' + abgeschnitten[0].slice(0, 46) + '…'
             : suche.length + ' lange Zeilen vollstaendig');
    pruefe('Keine Auslassungszeichen mehr',
           kText.indexOf(gegen ? 'Konfiguration' : '…') === -1,
           'nichts mit „…" gekuerzt');
    pruefe('Gruppentitel und Kacheln stehen da',
           kText.indexOf('SEITEN UND VERGLASUNG') > -1 &&
           kText.indexOf(gegen ? 'SCHNEELAST' : 'DURCHGANGSHOEHE') > -1, '');
    /* ---------- Fett und kursiv ----------
       „arbeite auch mit dicken schriften und cursiv vllt. wo nötig"
       (Betreiber, 12.10.2026). Kursiv traegt hier eine Bedeutung: Was
       unter Vorbehalt steht („Vorschlag, Aufteilung nach Aufmass"), wird
       abgesetzt. Geht die Schrift verloren, faellt das niemandem auf –
       der Text bleibt ja lesbar. Darum pdffonts: Es liest aus der
       fertigen Datei, WELCHE Schriften wirklich benutzt werden. */
    var schriften = lauf('pdffonts', [kDatei]);
    if (schriften.indexOf('\x00FEHLER') > -1) {
      pruefe('Alle drei Schriftschnitte sind in Gebrauch', false,
             'pdffonts nicht verfuegbar');
    } else {
      var soll3 = ['Helvetica', 'Helvetica-Bold',
                   gegen ? 'Times-Italic' : 'Helvetica-Oblique'];
      var fehlt3 = soll3.filter(function (f) {
        return !new RegExp('^' + f + '\\s', 'm').test(schriften);
      });
      pruefe('Alle drei Schriftschnitte sind in Gebrauch', fehlt3.length === 0,
             fehlt3.length ? 'fehlt: ' + fehlt3.join(', ')
               : 'mager, fett und kursiv');
    }
    /* Der Vorbehalt steht abgesetzt, die Praezisierung nicht: „(12,3 %)"
       hinter der Dachneigung gehoert in dieselbe Zeile – der erste
       Versuch riss sie heraus und setzte sie kursiv.

       Geprueft wird an den ROHEN Zeilen, nicht am normalisierten Text:
       Es geht ja gerade darum, WAS in derselben Zeile steht. Der erste
       Versuch verglich normalisiert und suchte „7 Grad (12,3" – das ist
       ein Teilstring des richtigen Textes und war damit immer wahr, auch
       in der Gegenprobe. Eine Pruefung, die nie anschlaegt, beweist
       nichts. */
    var rohZeilen = lauf('pdftotext', ['-x', '28', '-y', '0', '-W', '384',
                                       '-H', '595', '-layout', kDatei, '-'])
                    .split('\n').map(function (z) { return z.trim(); });
    var zusammen = rohZeilen.filter(function (z) {
      return /7 Grad \(12,3 %\)/.test(z);
    }).length;
    var abgesetzt = rohZeilen.filter(function (z) {
      return /^\(Vorschlag/.test(z);
    }).length;
    pruefe('Praezisierung bleibt in der Zeile', (gegen ? 0 : zusammen) === 1,
           '„7 Grad (12,3 %)" steht zusammen');
    pruefe('Vorbehalt steht abgesetzt', (gegen ? 0 : abgesetzt) >= 1,
           '„(Vorschlag …)" beginnt eine eigene Zeile');

    pruefe('Der naechste Schritt steht auf dem Blatt',
           kText.indexOf(gegen ? '0800 000000' : '0156 78696609') > -1,
           'Aufmass-Hinweis als Abschluss');
    try { fs.unlinkSync(kDatei); } catch (e) { /* egal */ }

    /* ---------- Der eigentliche Anlass: VIEL Ausstattung ----------
       „wenn die austattung größer wird, wird diese liste unübersichtlich"
       (Betreiber). Also genau das pruefen: Eine Konfiguration, die auf
       eine Seite nicht passt, muss auf mehrere umbrechen – und dabei darf
       keine einzige Zeile verschwinden. Das ist der Fall, in dem ein
       Fehler am teuersten waere: Je mehr bestellt ist, desto mehr steht
       auf dem Spiel. */
    var vieleZeilen = [];
    function viel(titel, n) {
      var z = [];
      for (var i = 1; i <= n; i++) {
        var t = titel + ' Position ' + i + ': 3390 mm licht - SG23, 3-rails, ' +
                '3-tuerig, ESG 10 mm klar, runder eingelassener Griff';
        z.push(t); vieleZeilen.push(t);
      }
      return { titel: titel, zeilen: z };
    }
    var grossSeite = {
      titel: 'Ihre Konfiguration', kopf: 'Terrassendach TDS - Freistehend',
      kacheln: konfSeite.kacheln,
      gruppen: [viel('Konstruktion', 6), viel('Seiten und Verglasung', 14),
                viel('Komfort', 9), viel('Montage', 5)],
      unten: 'Unverbindliche Darstellung',
      ruf: 'Kostenloses Aufmass vor Ort: 0156 78696609',
      schritte: ['Kostenloses Aufmass vor Ort', 'Verbindliches Angebot',
                 'Fertigung und Montage']
    };
    PDF.erzeugen([grossSeite], { titel: 'Viel' }).arrayBuffer().then(function (vAb) {
      var vDatei = path.join(os.tmpdir(), 'bv-pruefe-viel-' + process.pid + '.pdf');
      fs.writeFileSync(vDatei, Buffer.from(vAb));
      var vInfo = lauf('pdfinfo', [vDatei]);
      var vSeiten = parseInt((vInfo.match(/Pages:\s*(\d+)/) || [0, 0])[1], 10);
      pruefe('Viel Ausstattung bricht auf mehrere Seiten um',
             vSeiten >= 2 && !gegen, vSeiten + ' Seiten');
      var vText = textSpaltenweise(vDatei, vSeiten);
      var soll = vieleZeilen.slice();
      if (gegen) soll.push('Eine Zeile, die niemand uebergeben hat');
      var weg = soll.filter(function (z) {
        return vText.indexOf(z.replace(/\s+/g, ' ')) === -1;
      });
      pruefe('Auch beim Seitenumbruch geht keine Zeile verloren', weg.length === 0,
             weg.length ? weg.length + ' von ' + soll.length + ' fehlen, z. B. '
                          + weg[0].slice(0, 40) + '…'
               : soll.length + ' Zeilen vollstaendig auf ' + vSeiten + ' Seiten');
      /* Eine geteilte Gruppe muss ihre Ueberschrift mitnehmen, sonst steht
         irgendwo eine Liste ohne Zusammenhang. */
      pruefe('Geteilte Gruppen tragen „(Fortsetzung)"',
             vText.indexOf(gegen ? 'SCHNEELAST' : '(FORTSETZUNG)') > -1, '');
      pruefe('Der Abschluss steht auf der letzten Seite',
             vText.indexOf(gegen ? 'SOFORT KAUFEN' : 'SO GEHT ES WEITER') > -1,
             'Ablauf in drei Schritten');
      try { fs.unlinkSync(vDatei); } catch (e) { /* egal */ }
      weiter();
    });
  });

  function weiter() {
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
  }

  function abschluss() {
  try { fs.unlinkSync(datei); } catch (e) { /* egal */ }

  console.log(gegen
    ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
    : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
  process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
  }
});
