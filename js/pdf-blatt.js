/* ---------- PDF aus den Konfigurator-Ansichten ----------
   Erzeugt ein mehrseitiges PDF ohne jede fremde Bibliothek.

   WARUM SELBST GESCHRIEBEN: Die üblichen Werkzeuge (jsPDF, pdfmake)
   kommen über ein Fremd-CDN, wiegen mehrere hundert Kilobyte und müssten
   in die Inhaltssicherheitsrichtlinie aufgenommen werden. Gebraucht wird
   hier aber nur ein Bruchteil davon: Seiten mit je einem JPEG und ein
   paar Zeilen Text. Das sind die rund 200 Zeilen hier – nachlesbar,
   ohne Nachladen, ohne Abhängigkeit, die irgendwann nicht mehr gepflegt
   wird.

   AUFBAU EINER PDF-DATEI (PDF 1.4):
     %PDF-1.4
     nummerierte Objekte (Katalog, Seitenbaum, Schriften, je Seite eine
     Seite + ein Inhaltsstrom + ggf. ein Bild)
     xref – eine Tabelle mit der Byte-Position JEDES Objekts
     trailer mit Verweis auf den Katalog
   Die xref-Tabelle ist der Grund, warum hier mit Byte-Längen gerechnet
   wird und nicht mit Zeichenketten: Ein Umlaut ist ein Byte (WinAnsi),
   ein JPEG sind Rohbytes. Zählt man Zeichen statt Bytes, zeigt die
   Tabelle ins Leere und der Betrachter meldet eine beschädigte Datei.

   SCHRIFT: Helvetica und Helvetica-Bold sind in jedem PDF-Betrachter
   vorhanden (die „Base-14"-Schriften) und müssen nicht eingebettet
   werden. Dafür kennen sie nur WinAnsi – Umlaute, ß, °, × und € gehen,
   alles darüber wird ersetzt statt die Datei unlesbar zu machen. */
(function (global) {
  'use strict';

  var A4_B = 842, A4_H = 595;        // A4 quer, in Punkt (72 dpi)
  var RAND = 36;

  /* Zeichen -> WinAnsi-Byte. Was es dort nicht gibt, wird ersetzt;
     ein fehlender Gedankenstrich ist besser als eine kaputte Datei. */
  var SONDER = {
    '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    '‰': 0x89, '‹': 0x8B, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94,
    '•': 0x95, '–': 0x96, '—': 0x97, '›': 0x9B
  };

  function winAnsi(s) {
    var aus = [], i, z, c;
    for (i = 0; i < s.length; i++) {
      z = s.charAt(i); c = s.charCodeAt(i);
      if (SONDER[z] !== undefined) aus.push(SONDER[z]);
      else if (c < 256) aus.push(c);
      else aus.push(0x3F);                              // '?'
    }
    return aus;
  }

  /* Klammern und Rückstrich sind in PDF-Zeichenketten Steuerzeichen. */
  function pdfText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function bytes(s) { return new Uint8Array(winAnsi(s)); }

  /* data:image/jpeg;base64,... -> Rohbytes */
  function ausDatenUrl(url) {
    var b64 = url.slice(url.indexOf(',') + 1);
    var roh = global.atob(b64);
    var a = new Uint8Array(roh.length), i;
    for (i = 0; i < roh.length; i++) a[i] = roh.charCodeAt(i);
    return a;
  }

  /* Breite und Höhe eines JPEG aus seinen Kopfdaten lesen. Das PDF muss
     das Seitenverhältnis kennen, sonst wird das Bild verzerrt. */
  function jpegMasse(a) {
    var i = 2;
    while (i < a.length) {
      if (a[i] !== 0xFF) { i++; continue; }
      var m = a[i + 1];
      // SOF0..SOF15, ohne die vier Marken, die keine Bildgroesse tragen
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return { hoch: (a[i + 5] << 8) | a[i + 6], breit: (a[i + 7] << 8) | a[i + 8] };
      }
      i += 2 + ((a[i + 2] << 8) | a[i + 3]);
    }
    return { breit: 16, hoch: 9 };
  }

  /* ---------- Seiteninhalt ----------
     Punkt-Koordinaten, Nullpunkt unten links. */
  function inhaltBild(bild, titel, unten, rechts) {
    var m = jpegMasse(bild.daten);
    var platzB = A4_B - RAND * 2;
    var platzH = A4_H - RAND * 2 - 46 - 26;           // Kopf und Fuss
    var f = Math.min(platzB / m.breit, platzH / m.hoch);
    var b = m.breit * f, h = m.hoch * f;
    var x = (A4_B - b) / 2, y = RAND + 26 + (platzH - h) / 2;
    var t = [];
    t.push('q ' + b.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' +
           x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im0 Do Q');
    t.push('BT /F2 17 Tf 0.08 0.09 0.10 rg ' + RAND + ' ' + (A4_H - RAND - 6) +
           ' Td (' + pdfText(titel) + ') Tj ET');
    if (rechts) {
      t.push('BT /F1 10 Tf 0.42 0.44 0.46 rg ' + RAND + ' ' + (A4_H - RAND - 22) +
             ' Td (' + pdfText(rechts) + ') Tj ET');
    }
    t.push('BT /F1 8 Tf 0.45 0.47 0.49 rg ' + RAND + ' ' + RAND +
           ' Td (' + pdfText(unten) + ') Tj ET');
    return t.join('\n');
  }

  function inhaltText(titel, zeilen, unten) {
    var t = [], y = A4_H - RAND - 6;
    t.push('BT /F2 17 Tf 0.08 0.09 0.10 rg ' + RAND + ' ' + y +
           ' Td (' + pdfText(titel) + ') Tj ET');
    y -= 34;
    /* Zwei Spalten, damit auch lange Konfigurationen auf eine Seite
       passen. Umgebrochen wird NICHT – zu lange Angaben werden gekuerzt;
       ein Umbruch mitten im Satz liest sich schlechter. */
    var proSpalte = Math.ceil(zeilen.length / 2);
    var spaltenB = (A4_B - RAND * 2 - 30) / 2;
    zeilen.forEach(function (z, i) {
      var sp = i < proSpalte ? 0 : 1;
      var zy = y - (i - sp * proSpalte) * 19;
      var x = RAND + sp * (spaltenB + 30);
      var fett = i === 0;
      var txt = String(z);
      /* Helvetica: rund 0,5 Punkt Breite je Punkt Schriftgroesse und
         Zeichen – reicht als Schaetzung fuers Kuerzen. */
      var max = Math.floor(spaltenB / (fett ? 6.1 : 5.0));
      if (txt.length > max) txt = txt.slice(0, max - 1) + '...';
      t.push('BT /F' + (fett ? 2 : 1) + ' ' + (fett ? 13 : 10) + ' Tf ' +
             (fett ? '0.77 0.60 0.16' : '0.13 0.14 0.15') + ' rg ' +
             x + ' ' + zy.toFixed(1) + ' Td (' + pdfText(txt) + ') Tj ET');
    });
    t.push('BT /F1 8 Tf 0.45 0.47 0.49 rg ' + RAND + ' ' + RAND +
           ' Td (' + pdfText(unten) + ') Tj ET');
    return t.join('\n');
  }

  /* ---------- Kern: fertige Inhaltsstroeme in eine Datei schreiben ----------
     Das hier ist der Teil, der NICHTS vom Layout weiss. Seit dem
     12.10.2026 benutzt ihn auch js/bg-pdf.js (Baugenehmigungs-Check);
     vorher hatte der eine zweite, eigene Fassung derselben 40 Zeilen –
     zwei Stellen, die xref-Tabellen bauen, laufen mit der Zeit
     auseinander, und ein Fehler darin faellt erst beim Kunden auf.

     seiten: [{ strom, breite, hoehe, bild }]
       strom  fertiger Inhaltsstrom (PDF-Operatoren)
       bild   JPEG-Rohbytes oder nichts; heisst im Strom /Im0
     meta:   { titel }

     WICHTIG fuer Aufrufer, die ihren Strom selbst zusammensetzen: Die
     Zeichen darin muessen bereits WinAnsi sein (Code < 256) und Klammern
     escaped. Hier wird nur noch Zeichen fuer Zeichen zu Bytes gemacht –
     ein zweites Umkodieren wuerde die Byte-Laengen verschieben und die
     xref-Tabelle ins Leere zeigen lassen. */
  function ausStroemen(seiten, meta) {
    var teile = [], laenge = 0, offsets = [];

    function schreib(u8) { teile.push(u8); laenge += u8.length; }
    function schreibS(s) { schreib(bytes(s)); }

    /* Objektnummern vorab festlegen: 1 Katalog, 2 Seitenbaum,
       3 Helvetica, 4 Helvetica-Bold, danach je Seite 2 oder 3. */
    var nr = 5, seitenNr = [], i;
    seiten.forEach(function (s) {
      seitenNr.push({ seite: nr++, inhalt: nr++, bild: s.bild ? nr++ : 0 });
    });
    var anzahlObj = nr - 1;

    function objAuf(n) { offsets[n] = laenge; }

    schreibS('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    objAuf(1);
    schreibS('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    objAuf(2);
    schreibS('2 0 obj\n<< /Type /Pages /Count ' + seiten.length + ' /Kids [' +
             seitenNr.map(function (p) { return p.seite + ' 0 R'; }).join(' ') +
             '] >>\nendobj\n');

    objAuf(3);
    schreibS('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica ' +
             '/Encoding /WinAnsiEncoding >>\nendobj\n');
    objAuf(4);
    schreibS('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold ' +
             '/Encoding /WinAnsiEncoding >>\nendobj\n');

    seiten.forEach(function (s, k) {
      var p = seitenNr[k];
      var inhaltB = bytes(s.strom);
      var br = s.breite || A4_B, ho = s.hoehe || A4_H;

      objAuf(p.seite);
      schreibS(p.seite + ' 0 obj\n<< /Type /Page /Parent 2 0 R ' +
               '/MediaBox [0 0 ' + br + ' ' + ho + '] ' +
               '/Resources << /Font << /F1 3 0 R /F2 4 0 R >>' +
               (p.bild ? ' /XObject << /Im0 ' + p.bild + ' 0 R >>' : '') +
               ' >> /Contents ' + p.inhalt + ' 0 R >>\nendobj\n');

      objAuf(p.inhalt);
      schreibS(p.inhalt + ' 0 obj\n<< /Length ' + inhaltB.length + ' >>\nstream\n');
      schreib(inhaltB);
      schreibS('\nendstream\nendobj\n');

      if (p.bild) {
        var m = jpegMasse(s.bild);
        objAuf(p.bild);
        /* DCTDecode heisst: Die Bytes sind ein JPEG und werden
           unveraendert uebernommen – kein Umkodieren, keine Qualitaets-
           verluste, kleine Datei. */
        schreibS(p.bild + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' +
                 m.breit + ' /Height ' + m.hoch +
                 ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ' +
                 '/Length ' + s.bild.length + ' >>\nstream\n');
        schreib(s.bild);
        schreibS('\nendstream\nendobj\n');
      }
    });

    /* Angaben, die im Betrachter unter „Dokumenteigenschaften" stehen. */
    var d = new Date();
    function zwei(n) { return (n < 10 ? '0' : '') + n; }
    var pdfDatum = 'D:' + d.getFullYear() + zwei(d.getMonth() + 1) + zwei(d.getDate()) +
                   zwei(d.getHours()) + zwei(d.getMinutes()) + zwei(d.getSeconds());
    var infoNr = anzahlObj + 1;
    objAuf(infoNr);
    schreibS(infoNr + ' 0 obj\n<< /Title (' + pdfText(meta.titel || 'Konfiguration') +
             ') /Author (BV AussenSysteme) /Creator (' +
             pdfText(meta.erzeuger || 'BV AussenSysteme Konfigurator') +
             ') /CreationDate (' + pdfDatum + ') >>\nendobj\n');

    var xref = laenge;
    var zeilen = ['xref', '0 ' + (infoNr + 1), '0000000000 65535 f '];
    for (i = 1; i <= infoNr; i++) {
      zeilen.push(('0000000000' + (offsets[i] || 0)).slice(-10) + ' 00000 n ');
    }
    schreibS(zeilen.join('\n') + '\n');
    schreibS('trailer\n<< /Size ' + (infoNr + 1) + ' /Root 1 0 R /Info ' +
             infoNr + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');

    return new global.Blob(teile, { type: 'application/pdf' });
  }

  /* ---------- Die Ansichtsseiten des Konfigurators ----------
     seiten: [{ titel, unten, rechts, bild: dataURL } | { titel, unten, zeilen: [] }]
     Rueckgabe: Blob. */
  function erzeugen(seiten, meta) {
    return ausStroemen(seiten.map(function (s) {
      if (s.bild) {
        var bild = { daten: ausDatenUrl(s.bild) };
        return {
          strom: inhaltBild(bild, s.titel, s.unten, s.rechts),
          bild: bild.daten
        };
      }
      return { strom: inhaltText(s.titel, s.zeilen || [], s.unten) };
    }), meta);
  }

  global.BV_PDF = {
    erzeugen: erzeugen,          // Ansichtsseiten des Konfigurators
    ausStroemen: ausStroemen,    // fertige Stroeme (nutzt js/bg-pdf.js)
    pdfText: pdfText,            // Klammern und Rueckstrich escapen
    winAnsi: winAnsi,
    jpegMasse: jpegMasse
  };
})(window);
