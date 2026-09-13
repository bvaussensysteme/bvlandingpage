/* ============================================================
   BV AussenSysteme – PDF-Erzeugung für den Baugenehmigungs-Check

   Warum eigener Generator statt window.print()?
   Safari auf dem iPhone ignoriert window.print() stillschweigend –
   auf dem Handy passierte beim Antippen schlicht nichts. Und eine
   PDF-Bibliothek (jsPDF & Co.) wären mehrere hundert Kilobyte
   zusätzliche Ladelast plus eine weitere externe Abhängigkeit.

   Deshalb wird die PDF-Datei hier direkt erzeugt: reiner Text mit
   den in jedem PDF-Reader eingebauten Standardschriften
   (Helvetica / Helvetica-Bold), dadurch nur wenige Kilobyte gross
   und ohne Schrift-Einbettung. Ausgeliefert wird sie als echter
   Download – das funktioniert auf iPhone, Android und Desktop
   gleichermassen, ohne Druckdialog.

   Öffentliche Schnittstelle:
     bvBgPdf.erzeugen(daten)  -> Blob
     bvBgPdf.speichern(daten, dateiname)
   ============================================================ */
(function () {
  'use strict';

  var SEITE = { breite: 595.28, hoehe: 841.89 };   // A4 in Punkt
  var RAND  = { links: 40, rechts: 40, oben: 40, unten: 34 };

  var FARBE = {
    text:    [0.07, 0.07, 0.07],
    grau:    [0.36, 0.36, 0.36],
    hellgrau:[0.55, 0.55, 0.55],
    gold:    [0.769, 0.604, 0.165],
    linie:   [0.847, 0.831, 0.796],
    fuellung:[0.976, 0.973, 0.965],
    gruenBg: [0.910, 0.960, 0.925], gruenTx: [0.102, 0.431, 0.102],
    gelbBg:  [0.992, 0.949, 0.878], gelbTx:  [0.541, 0.380, 0.000],
    rotBg:   [0.992, 0.925, 0.925], rotTx:   [0.702, 0.149, 0.118]
  };

  /* ---------- Text nach WinAnsi (Latin-1 + Sonderzeichen) ---------- */
  var SONDER = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F
  };

  function kodieren(text) {
    var raus = '';
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      var b = c < 256 ? c : (SONDER[c] || 0x3F); // Unbekanntes wird zu "?"
      var z = String.fromCharCode(b);
      if (z === '(' || z === ')' || z === '\\') raus += '\\';
      raus += z;
    }
    return raus;
  }

  /* ---------- Textbreite messen ----------
     Gemessen wird über die Canvas-API mit Helvetica/Arial. Beide haben
     praktisch identische Zeichenbreiten wie die PDF-Standardschrift,
     der kleine Sicherheitsaufschlag faengt Restabweichungen ab. */
  var messer = null;
  function breite(text, groesse, fett) {
    if (!messer) messer = document.createElement('canvas').getContext('2d');
    messer.font = (fett ? 'bold ' : '') + groesse + 'px Helvetica, Arial, sans-serif';
    return messer.measureText(text).width * 1.02;
  }

  function umbrechen(text, maxBreite, groesse, fett) {
    var worte = String(text == null ? '' : text).trim().split(/\s+/);
    var zeilen = [], aktuell = '';
    for (var i = 0; i < worte.length; i++) {
      var probe = aktuell ? aktuell + ' ' + worte[i] : worte[i];
      if (!aktuell || breite(probe, groesse, fett) <= maxBreite) {
        aktuell = probe;
      } else {
        zeilen.push(aktuell);
        aktuell = worte[i];
      }
    }
    if (aktuell) zeilen.push(aktuell);
    return zeilen.length ? zeilen : [''];
  }

  /* ---------- Zeichenfläche ----------
     y wird von oben gerechnet, das ist beim Layouten angenehmer.
     Die Umrechnung auf das PDF-Koordinatensystem (Nullpunkt unten
     links) passiert erst hier. */
  function Blatt() {
    this.ops = [];
  }

  Blatt.prototype.farbe = function (c, fuellen) {
    this.ops.push(c[0].toFixed(3) + ' ' + c[1].toFixed(3) + ' ' + c[2].toFixed(3) + (fuellen ? ' rg' : ' RG'));
  };

  Blatt.prototype.text = function (x, y, inhalt, o) {
    o = o || {};
    var groesse = o.groesse || 9;
    this.farbe(o.farbe || FARBE.text, true);
    this.ops.push('BT /' + (o.fett ? 'F2' : 'F1') + ' ' + groesse + ' Tf ' +
      (o.sperr ? o.sperr + ' Tc ' : '') +
      '1 0 0 1 ' + x.toFixed(2) + ' ' + (SEITE.hoehe - y - groesse).toFixed(2) + ' Tm (' +
      kodieren(String(inhalt)) + ') Tj ET');
    if (o.sperr) this.ops.push('BT 0 Tc ET');
  };

  Blatt.prototype.kasten = function (x, y, b, h, o) {
    o = o || {};
    var pfad = x.toFixed(2) + ' ' + (SEITE.hoehe - y - h).toFixed(2) + ' ' +
               b.toFixed(2) + ' ' + h.toFixed(2) + ' re';
    if (o.fuellung) this.farbe(o.fuellung, true);
    if (o.rahmen) { this.farbe(o.rahmen, false); this.ops.push((o.staerke || 0.6).toFixed(2) + ' w'); }
    this.ops.push(pfad + ' ' + (o.fuellung && o.rahmen ? 'B' : o.fuellung ? 'f' : 'S'));
  };

  Blatt.prototype.linie = function (x1, y1, x2, y2, c, staerke) {
    this.farbe(c || FARBE.linie, false);
    this.ops.push((staerke || 0.6).toFixed(2) + ' w ' +
      x1.toFixed(2) + ' ' + (SEITE.hoehe - y1).toFixed(2) + ' m ' +
      x2.toFixed(2) + ' ' + (SEITE.hoehe - y2).toFixed(2) + ' l S');
  };

  /* Mehrzeiliger Absatz, gibt die neue y-Position zurueck */
  Blatt.prototype.absatz = function (x, y, text, maxBreite, o) {
    o = o || {};
    var groesse = o.groesse || 8;
    var abstand = o.zeile || groesse * 1.32;
    var zeilen = umbrechen(text, maxBreite, groesse, o.fett);
    for (var i = 0; i < zeilen.length; i++) {
      this.text(x, y, zeilen[i], o);
      y += abstand;
    }
    return y;
  };

  /* ---------- PDF-Datei zusammensetzen ---------- */
  function alsBlob(ops, titel) {
    var strom = ops.join('\n');
    var datum = new Date();
    function zwei(n) { return (n < 10 ? '0' : '') + n; }
    var pdfDatum = 'D:' + datum.getFullYear() + zwei(datum.getMonth() + 1) + zwei(datum.getDate()) +
                   zwei(datum.getHours()) + zwei(datum.getMinutes()) + zwei(datum.getSeconds());

    var objekte = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + SEITE.breite + ' ' + SEITE.hoehe + '] ' +
        '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
      '<< /Length ' + strom.length + ' >>\nstream\n' + strom + '\nendstream',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      '<< /Title (' + kodieren(titel || 'Baugenehmigungs-Check') + ') ' +
        '/Author (BV AussenSysteme) /Creator (bv-aussensysteme.de) ' +
        '/CreationDate (' + pdfDatum + ') >>'
    ];

    var pdf = '%PDF-1.4\n';
    var stellen = [];
    for (var i = 0; i < objekte.length; i++) {
      stellen.push(pdf.length);
      pdf += (i + 1) + ' 0 obj\n' + objekte[i] + '\nendobj\n';
    }
    var xref = pdf.length;
    pdf += 'xref\n0 ' + (objekte.length + 1) + '\n0000000000 65535 f \n';
    for (i = 0; i < stellen.length; i++) {
      pdf += ('0000000000' + stellen[i]).slice(-10) + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size ' + (objekte.length + 1) + ' /Root 1 0 R /Info ' + objekte.length + ' 0 R >>\n' +
           'startxref\n' + xref + '\n%%EOF';

    // Alle Zeichen liegen unter 256, dadurch stimmen die Byte-Offsets
    var bytes = new Uint8Array(pdf.length);
    for (i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xFF;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  /* ---------- Layout ----------
     Wird mit einem Verkleinerungsfaktor aufgerufen. Passt der Inhalt
     nicht auf eine Seite, laeuft er mit kleinerem Faktor erneut durch.
     So bleibt es garantiert bei einer Seite. */
  function zeichnen(d, f) {
    var b = new Blatt();
    var x = RAND.links;
    var innen = SEITE.breite - RAND.links - RAND.rechts;
    var y = RAND.oben;

    /* Kopf */
    b.text(x, y, 'BV AussenSysteme', { groesse: 11 * f, fett: true });
    y += 13 * f;
    b.text(x, y, 'Baugenehmigungs-Check', { groesse: 19 * f, fett: true });
    y += 23 * f;
    if (d.standort) { b.text(x, y, d.standort, { groesse: 7.8 * f, farbe: FARBE.grau }); y += 10 * f; }
    b.text(x, y, d.erstellt, { groesse: 7.8 * f, farbe: FARBE.grau });
    y += 11 * f;
    b.linie(x, y, x + innen, y, FARBE.gold, 1.4 * f);
    y += 13 * f;

    /* Zuständige Behörde */
    var kopfHoehe = 15 * f;
    var spalte = (innen - 2 * 10 * f - 16 * f) / 2;
    var eintraege = d.behoerde || [];
    var zeilenHoehen = [], i;
    for (i = 0; i < eintraege.length; i++) {
      var zn = umbrechen(eintraege[i].wert, spalte, 8.2 * f, false).length;
      zeilenHoehen.push(9 * f + zn * 10.4 * f + 4 * f);
    }
    var linkeH = 0, rechteH = 0;
    for (i = 0; i < zeilenHoehen.length; i++) {
      if (i % 2 === 0) linkeH += zeilenHoehen[i]; else rechteH += zeilenHoehen[i];
    }
    var kastenH = kopfHoehe + Math.max(linkeH, rechteH) + 12 * f;
    b.kasten(x, y, innen, kastenH, { fuellung: [1, 1, 1], rahmen: FARBE.linie });
    b.text(x + 10 * f, y + 8 * f, 'Zuständige Behörde', { groesse: 10.5 * f, fett: true });
    var yL = y + kopfHoehe + 10 * f, yR = yL;
    for (i = 0; i < eintraege.length; i++) {
      var links = (i % 2 === 0);
      var sx = x + 10 * f + (links ? 0 : spalte + 16 * f);
      var sy = links ? yL : yR;
      b.text(sx, sy, eintraege[i].feld.toUpperCase(), { groesse: 6.6 * f, fett: true, farbe: FARBE.hellgrau, sperr: 0.5 * f });
      sy = b.absatz(sx, sy + 9 * f, eintraege[i].wert, spalte, { groesse: 8.2 * f, zeile: 10.4 * f });
      if (links) yL = sy + 4 * f; else yR = sy + 4 * f;
    }
    y += kastenH + 8 * f;

    /* Rechtsquelle */
    if (d.quelle) {
      var qH = 8 * f + umbrechen(d.quelle, innen - 16 * f, 7.4 * f, false).length * 9.6 * f + 6 * f;
      b.kasten(x, y, innen, qH, { fuellung: FARBE.fuellung, rahmen: FARBE.linie });
      b.absatz(x + 8 * f, y + 6 * f, d.quelle, innen - 16 * f, { groesse: 7.4 * f, zeile: 9.6 * f, farbe: FARBE.grau });
      y += qH + 10 * f;
    }

    /* Überschrift Produkte */
    b.text(x, y, 'GENEHMIGUNGSPFLICHT JE PRODUKT', { groesse: 6.8 * f, fett: true, farbe: FARBE.gold, sperr: 0.9 * f });
    y += 10 * f;
    b.text(x, y, d.ueberschrift, { groesse: 11.5 * f, fett: true });
    y += 16 * f;

    /* Produktkarten, zweispaltig */
    var luecke = 9 * f;
    var kartenB = (innen - luecke) / 2;
    var karten = d.karten || [];

    function kartenHoehe(k, bb) {
      var inn = bb - 16 * f;
      var h = 8 * f;
      h += umbrechen(k.name, inn, 9.4 * f, true).length * 11 * f;
      h += 13.5 * f;                                        // Status-Etikett
      h += umbrechen(k.bedingung, inn, 7.9 * f, false).length * 9.9 * f + 3 * f;
      if (k.hinweis) h += umbrechen(k.hinweis, inn, 7.4 * f, false).length * 9.2 * f + 3 * f;
      if (k.abstand) h += umbrechen(k.abstand, inn - 10 * f, 7.4 * f, false).length * 9.2 * f + 9 * f;
      return h + 7 * f;
    }

    function karteZeichnen(k, kx, ky, bb) {
      var h = kartenHoehe(k, bb);
      var inn = bb - 16 * f;
      b.kasten(kx, ky, bb, h, { fuellung: [1, 1, 1], rahmen: FARBE.linie });
      var ty = ky + 7 * f;
      ty = b.absatz(kx + 8 * f, ty, k.name, inn, { groesse: 9.4 * f, fett: true, zeile: 11 * f });
      // Status-Etikett
      var eBg = k.status === 'gruen' ? FARBE.gruenBg : k.status === 'rot' ? FARBE.rotBg : FARBE.gelbBg;
      var eTx = k.status === 'gruen' ? FARBE.gruenTx : k.status === 'rot' ? FARBE.rotTx : FARBE.gelbTx;
      var eText = String(k.statusText || '').toUpperCase();
      var eBreite = breite(eText, 6.8 * f, true) + 12 * f;
      if (eBreite > inn) eBreite = inn;
      b.kasten(kx + 8 * f, ty + 1 * f, eBreite, 11 * f, { fuellung: eBg });
      b.text(kx + 14 * f, ty + 3.4 * f, eText, { groesse: 6.8 * f, fett: true, farbe: eTx });
      ty += 13.5 * f + 3 * f;
      ty = b.absatz(kx + 8 * f, ty, k.bedingung, inn, { groesse: 7.9 * f, zeile: 9.9 * f }) + 3 * f;
      if (k.hinweis) {
        ty = b.absatz(kx + 8 * f, ty, k.hinweis, inn, { groesse: 7.4 * f, zeile: 9.2 * f, farbe: FARBE.grau }) + 3 * f;
      }
      if (k.abstand) {
        var aZ = umbrechen(k.abstand, inn - 10 * f, 7.4 * f, false);
        var aH = aZ.length * 9.2 * f + 6 * f;
        b.kasten(kx + 8 * f, ty, inn, aH, { fuellung: FARBE.fuellung });
        b.absatz(kx + 13 * f, ty + 3 * f, k.abstand, inn - 10 * f, { groesse: 7.4 * f, zeile: 9.2 * f, farbe: FARBE.grau });
      }
      return h;
    }

    for (i = 0; i < karten.length; i += 2) {
      var letzteAllein = (i === karten.length - 1);
      if (letzteAllein) {
        // Ungerade Kartenzahl: die letzte Karte nutzt die volle Breite
        y += karteZeichnen(karten[i], x, y, innen) + luecke;
      } else {
        var h1 = kartenHoehe(karten[i], kartenB), h2 = kartenHoehe(karten[i + 1], kartenB);
        var hoch = Math.max(h1, h2);
        karteZeichnen(karten[i], x, y, kartenB);
        karteZeichnen(karten[i + 1], x + kartenB + luecke, y, kartenB);
        y += hoch + luecke;
      }
    }
    y += 2 * f;

    /* Hinweis-Kasten */
    if (d.hinweis) {
      var hZ = umbrechen(d.hinweis, innen - 16 * f, 7.2 * f, false);
      var hH = hZ.length * 9.4 * f + 12 * f;
      b.kasten(x, y, innen, hH, { fuellung: FARBE.fuellung, rahmen: FARBE.linie });
      b.absatz(x + 8 * f, y + 6 * f, d.hinweis, innen - 16 * f, { groesse: 7.2 * f, zeile: 9.4 * f, farbe: FARBE.grau });
      y += hH + 10 * f;
    }

    /* Rechtlicher Fuss */
    b.linie(x, y, x + innen, y, FARBE.linie, 0.6);
    y += 7 * f;
    for (i = 0; i < (d.fuss || []).length; i++) {
      y = b.absatz(x, y, d.fuss[i], innen, { groesse: 6.9 * f, zeile: 8.8 * f, farbe: FARBE.grau }) + 3 * f;
    }
    if (d.kontakt) {
      y = b.absatz(x, y, d.kontakt, innen, { groesse: 6.9 * f, zeile: 8.8 * f, fett: true });
    }

    return { blatt: b, hoehe: y };
  }

  /* ---------- Öffentliche Funktionen ---------- */
  function erzeugen(daten) {
    var platz = SEITE.hoehe - RAND.unten;
    var ergebnis = null;
    // Nur so weit verkleinern wie noetig – sonst bleibt es bei voller Groesse
    for (var f = 1; f >= 0.74; f -= 0.04) {
      ergebnis = zeichnen(daten, f);
      if (ergebnis.hoehe <= platz) break;
    }
    return alsBlob(ergebnis.blatt.ops, daten.titel);
  }

  function speichern(daten, dateiname) {
    var blob = erzeugen(daten);
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = dateiname || 'Baugenehmigungs-Check.pdf';
    // Faellt das download-Attribut aus (sehr alte Browser), oeffnet die Datei
    // wenigstens in einem neuen Tab, statt die Seite zu verlassen.
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 10000);
    return url;
  }

  window.bvBgPdf = { erzeugen: erzeugen, speichern: speichern };
})();
