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

  /* ---------- Textbreite in Helvetica ----------
     Die amtlichen Zeichenbreiten der PDF-Standardschrift, in Tausendstel
     der Schriftgroesse. Damit laesst sich VOR dem Zeichnen ausrechnen,
     wie breit eine Zeile wird – und zwar hier wie im Pruefskript gleich.

     WARUM NICHT UEBER DIE CANVAS-API messen, wie js/bg-pdf.js es tut:
     Die gibt es nur im Browser. Eine Tabelle rechnet ueberall dasselbe
     und ist genauer, weil sie genau die Schrift beschreibt, die im PDF
     dann wirklich steht.

     Zeichen, die hier fehlen, bekommen den Mittelwert 556 – das sind nur
     Sonderzeichen, die in Massangaben nicht vorkommen. Umlaute sind so
     breit wie ihr Grundbuchstabe (so ist Helvetica gebaut). */
  function breitenTafel(def) {
    var t = {}, i;
    def.split('|').forEach(function (gruppe) {
      var teil = gruppe.split(':');
      var w = parseInt(teil[1], 10);
      for (i = 0; i < teil[0].length; i++) t[teil[0].charAt(i)] = w;
    });
    return t;
  }
  /* Die amtlichen Werte der Adobe-Metriken (AFM) fuer Helvetica und
     Helvetica-Bold. Der erste Versuch fasste Zeichen grob zu Gruppen
     zusammen – im fertigen Blatt klafften dann Luecken hinter den
     Doppelpunkten, weil die geschaetzte Breite groesser war als die
     wirkliche. Jetzt steht hier jedes Zeichen mit seinem echten Wert.
     Umlaute sind so breit wie ihr Grundbuchstabe, so ist die Schrift
     gebaut. */
  var BREIT_REG = breitenTafel(
    " ,./:;[\\]ftI·:278|'`ijl:222||:260|()-r\u201a\u201e\u201c\u201d:333|{}:334|" +
    '":355|*:389|\u00b0:400|^:469|JckKsvxyz:500|' +
    '#$_0123456789Labdeghnopqu?\u2013\u00df\u00e4\u00f6\u00fc:556|' +
    '+<=>~\u00d7:584|FTZ:611|&ABEKSVXY\u00c4:667|CDHNRUw\u00dc:722|' +
    'GOQ\u00d6:778|Mm:833|%:889|W:944|@:1015');
  var BREIT_FETT = breitenTafel(
    " ',./ijlI·`:278||:280|!()-:333|:;ft:333|*r{}:389|\":474|\u00b0:400|" +
    '#$_0123456789JackKsvxy\u2013\u00e4:556|z:500|+<=>^~\u00d7:584|' +
    'FLTZ?bdghnopqu\u00df\u00f6\u00fc:611|ESVXY:667|' +
    'ABCDHNRU\u00c4\u00dc:722|GOQ\u00d6:778|M:833|%m:889|W:944|@:975');

  /* stil: true oder 'fett' -> Helvetica-Bold, 'kursiv' -> Oblique
     (gleiche Breiten wie gerade), sonst Helvetica. */
  function textBreite(text, groesse, stil) {
    var t = (stil === true || stil === 'fett') ? BREIT_FETT : BREIT_REG;
    var summe = 0, i;
    for (i = 0; i < text.length; i++) summe += (t[text.charAt(i)] || 556);
    return summe * groesse / 1000;
  }

  /* Zeilenumbruch an Wortgrenzen. Ein Wort, das allein schon zu breit ist
     (eine lange Massangabe ohne Leerzeichen), wird hart getrennt – lieber
     getrennt als abgeschnitten: „alle infos sollen lesbar bleiben"
     (Betreiber, 12.10.2026). */
  function umbrechen(text, maxBreite, groesse, stil) {
    var worte = String(text == null ? '' : text).split(/\s+/);
    var zeilen = [], aktuell = '';
    worte.forEach(function (wort) {
      var probe = aktuell ? aktuell + ' ' + wort : wort;
      if (textBreite(probe, groesse, stil) <= maxBreite) { aktuell = probe; return; }
      if (aktuell) { zeilen.push(aktuell); aktuell = ''; }
      while (textBreite(wort, groesse, stil) > maxBreite && wort.length > 1) {
        var n = 1;
        while (n < wort.length &&
               textBreite(wort.slice(0, n + 1), groesse, stil) <= maxBreite) n++;
        zeilen.push(wort.slice(0, n));
        wort = wort.slice(n);
      }
      aktuell = wort;
    });
    if (aktuell) zeilen.push(aktuell);
    return zeilen.length ? zeilen : [''];
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

  /* ---------- Die Konfigurationsseite ----------
     „wenn die austattung größer wird, wird diese liste unübersichtlich,
     mache es übersichtlich, design technisch ansprechend, alle infos
     sollen lesbar bleiben, verkaufspsychologisch stark" (Betreiber,
     12.10.2026, mit Bild).

     Vorher: eine Liste in zwei Spalten, zu lange Angaben mit „…"
     abgeschnitten – gerade bei den Schiebeanlagen, also bei dem, was am
     meisten kostet und am meisten erklaert werden muss.

     Jetzt:
     · Kopf mit dem Produkt und den Massen – das Erste, was ins Auge faellt
     · vier Eckdaten als Kacheln: die Zahlen, nach denen jeder zuerst sucht
     · darunter die Angaben nach Themen gruppiert, mit Zwischentiteln
     · Zeilen werden UMGEBROCHEN, nie abgeschnitten; passt es nicht mehr,
       entsteht eine zweite Seite statt eines „…"
     · Fuss mit dem naechsten Schritt (kostenloses Aufmass) – der Grund,
       warum das Blatt ueberhaupt beim Kunden liegt

     Rueckgabe: ein Array von Stroemen, einer je Seite. */
  function inhaltKonfig(s) {
    var G = { gold: '0.77 0.60 0.16', text: '0.11 0.12 0.13',
              grau: '0.42 0.44 0.46', hell: '0.58 0.60 0.62',
              linie: '0.86 0.86 0.84', kachel: '0.96 0.955 0.94' };
    var GR = 8.6, ZH = 11.4;              // Schriftgroesse und Zeilenabstand
    var innen = A4_B - RAND * 2;
    var spaltenB = (innen - 34) / 2;

    /* ---------- Erst messen, dann zeichnen ----------
       Der erste Entwurf fuellte die linke Spalte, bis sie voll war, und
       schob den Rest nach rechts. Ergebnis: links lief eine Gruppe mitten
       im Satz in die zweite Spalte, rechts blieb die halbe Seite leer.

       Jetzt wird jede Gruppe zuerst vermessen und erst dann verteilt. Das
       Messen liefert gleich die fertig umbrochenen Zeilen – gezeichnet
       wird genau das, was gemessen wurde, sonst stimmt die Hoehe nicht. */
    function gruppeMessen(g) {
      /* ---------- Eine Label-Spalte je Gruppe ----------
         Vorher begann jeder Wert direkt hinter seinem eigenen Label – bei
         unterschiedlich langen Labeln sprangen die Werte von Zeile zu
         Zeile hin und her, und das Auge findet keine Kante zum Entlanglesen.
         Jetzt beginnen alle Werte einer Gruppe an derselben Stelle.

         Ein Label, das laenger ist als 45 % der Spalte, wuerde die Spalte
         fuer alle anderen zu schmal machen – so eines bekommt seine eigene
         Zeile, der Wert steht eingerueckt darunter. */
      var roh = g.zeilen.map(function (z) {
        var teile = String(z).split(/:\s(.+)/);
        var hatLabel = teile.length > 1 &&
                       textBreite(teile[0], GR, true) < spaltenB * 0.6;
        var kopf = hatLabel ? teile[0] + ': ' : '';
        var wert = hatLabel ? teile[1] : String(z);
        /* Vorbehalte wie „(Vorschlag, Aufteilung nach Aufmass)" wurden
           hier bis zum 12.10.2026 je Zeile abgetrennt und kursiv
           abgesetzt. „du musst nicht bei jedem element schreiben
           (vorschlag, Aufteilung nach aufmaß) reicht wenn es unten im
           rechtstext einmal alles drinsteht" (Betreiber) – sie stehen
           jetzt einmal im Fuss und gelten fuer alles. Kursiv bleibt die
           Auszeichnung fuer genau diese Art Aussage, nur eben dort. */
        return {
          kopf: kopf,
          vorn: textBreite(kopf, GR, true),
          rest: wert
        };
      });
      var labelB = 0;
      roh.forEach(function (r) { if (r.kopf && r.vorn > labelB) labelB = r.vorn; });
      labelB = Math.min(labelB, spaltenB * 0.45);

      var zeilen = roh.map(function (r) {
        var eigen = !!r.kopf && r.vorn > labelB;
        var ein = r.kopf ? (eigen ? 10 : labelB) : 0;
        /* ---------- Kurze Werte fett ----------
           Ein Wert, der in eine Zeile passt, ist die Kernangabe
           („Anthrazit", „2600 mm", „12er-Set") – die darf ins Auge
           springen. Lange, beschreibende Werte bleiben mager, sonst
           wird die Spalte zur Bleiwueste und das Hervorheben bedeutet
           nichts mehr. */
        var umbr = umbrechen(r.rest, spaltenB - ein, GR, false);
        /* Nur KNAPPE Werte werden fett. Beim ersten Versuch reichte
           „passt in eine Zeile" – damit stand fast die halbe Spalte fett
           und das Hervorheben sagte nichts mehr. 22 Zeichen trennen die
           Kernangabe („Graualuminium", „2774 mm", „12er-Set") von der
           Beschreibung („Tragender Untergrund vorhanden"). */
        var kurz = umbr.length === 1 && !!r.kopf && r.rest.length <= 22 &&
                   /* Was NICHT gewaehlt wurde, wird nicht hervorgehoben –
                      „nicht vorgesehen" fett zu setzen betont ausgerechnet
                      die Luecke im Angebot. */
                   !/^(nicht|ohne|kein)\b/i.test(r.rest) &&
                   textBreite(r.rest, GR, true) <= spaltenB - ein;
        if (kurz) umbr = umbrechen(r.rest, spaltenB - ein, GR, true);
        return {
          kopf: r.kopf, kopfEigen: eigen, ein: ein,
          stil: kurz ? 'fett' : false,
          zeilen: umbr
        };
      });
      return { titel: g.titel, zeilen: zeilen, hoehe: teilHoehe(zeilen) };
    }

    /* Hoehe eines Gruppenblocks: Titel und Trennstrich, die Zeilen, der
       Abstand danach. Wird zum Verteilen UND zum Teilen gebraucht –
       darum an einer Stelle. */
    function teilHoehe(zeilen) {
      var h = 27;
      zeilen.forEach(function (z) { h += zeilenHoehe(z); });
      return h;
    }

    function zeilenHoehe(z) {
      return ((z.kopfEigen ? 1 : 0) + z.zeilen.length) * ZH + 1.6;
    }

    /* Eine Gruppe aufteilen, wenn sie nicht ganz in den Rest der Spalte
       passt. Der zweite Teil traegt den Titel noch einmal mit dem Zusatz
       „(Fortsetzung)" – ohne ihn staende irgendwo eine Liste ohne
       Ueberschrift, und niemand wuesste, wozu sie gehoert.

       Geteilt wird nur, wenn BEIDE Teile mindestens zwei Zeilen behalten:
       eine einzelne Zeile unter einer Ueberschrift sieht nach Fehler aus. */
    function teilen(g, frei) {
      var h = 27, n = 0, i;
      for (i = 0; i < g.zeilen.length; i++) {
        var zh = zeilenHoehe(g.zeilen[i]);
        if (h + zh > frei) break;
        h += zh; n++;
      }
      if (n < 2 || g.zeilen.length - n < 2) return null;
      var a = g.zeilen.slice(0, n), b = g.zeilen.slice(n);
      return [
        { titel: g.titel, zeilen: a, hoehe: teilHoehe(a) },
        { titel: g.titel + ' (Fortsetzung)', zeilen: b, hoehe: teilHoehe(b) }
      ];
    }

    var gemessen = (s.gruppen || []).filter(function (g) { return g.zeilen.length; })
                                    .map(gruppeMessen);

    /* ---------- Auf Spalten verteilen ----------
       Ziel ist die Haelfte der Gesamthoehe, damit beide Spalten etwa
       gleich weit reichen – ein Blatt, dessen rechte Haelfte leer ist,
       wirkt unfertig. Passt eine Gruppe nicht mehr, faengt die naechste
       Spalte an; sind beide voll, folgt eine zweite Seite. */
    var kopfHoehe = 52 + ((s.kacheln && s.kacheln.length) ? 62 : 0);
    var schlussH = (s.schritte && s.schritte.length) ? 66 : 0;
    var platzErste = A4_H - RAND - kopfHoehe - (RAND + 26);
    var platzWeiter = A4_H - RAND - 52 - (RAND + 26);

    function verteilen(liste, platz) {
      /* Zielhoehe fuer die linke Spalte ist die Haelfte des Ganzen – dann
         reichen beide etwa gleich weit. Passt alles zusammen nicht mehr
         auf diese Seite, wird die linke Spalte voll ausgenutzt und der
         Rest geht auf die naechste.

         Der erste Entwurf suchte nur den besten Schnitt ZWISCHEN zwei
         Gruppen. Das Ergebnis war rechnerisch optimal und sah trotzdem
         schief aus: Eine einzelne grosse Gruppe (die Schiebeanlagen)
         bestimmte alles, links blieb die halbe Spalte leer. Seit die
         Gruppe geteilt werden darf, geht es auf. */
      var rest = liste.slice();
      var ganz = rest.reduce(function (sum, g) { return sum + g.hoehe; }, 0);
      var spalten = [[], []], i;
      for (i = 0; i < 2; i++) {
        var kap = (i === 0 && ganz <= 2 * platz) ? Math.min(platz, ganz / 2) : platz;
        var h = 0;
        while (rest.length) {
          var g = rest[0];
          /* Die erste Gruppe einer Spalte kommt immer hinein, auch wenn
             sie das Ziel schon reisst – sonst bliebe die Spalte leer und
             die Schleife kaeme nicht voran. */
          if (h + g.hoehe <= kap || !spalten[i].length) {
            if (h + g.hoehe > platz && spalten[i].length) break;
            spalten[i].push(g); h += g.hoehe; rest.shift();
            continue;
          }
          var tt = teilen(g, Math.max(kap, h + 40) - h);
          if (tt) { spalten[i].push(tt[0]); rest[0] = tt[1]; }
          break;
        }
      }
      return { spalten: spalten, rest: rest };
    }

    var seiten = [], t = [], y;

    function schriftNr(stil) {
      return (stil === 'kursiv') ? 3 : ((stil === true || stil === 'fett') ? 2 : 1);
    }
    function zeile(txt, gr, stil, farbe, x) {
      t.push('BT /F' + schriftNr(stil) + ' ' + gr + ' Tf ' + farbe + ' rg ' +
             x.toFixed(1) + ' ' + y.toFixed(1) + ' Td (' + pdfText(txt) + ') Tj ET');
    }
    function strich(x, ys, b, farbe, dick) {
      t.push(farbe + ' RG ' + (dick || 0.6) + ' w ' + x.toFixed(1) + ' ' +
             ys.toFixed(1) + ' m ' + (x + b).toFixed(1) + ' ' + ys.toFixed(1) + ' l S');
    }

    function kopfZeichnen(erste) {
      y = A4_H - RAND - 8;
      zeile(erste ? s.titel : s.titel + ' (Fortsetzung)', 19, true, G.text, RAND);
      y -= 19;
      if (erste && s.kopf) { zeile(s.kopf, 12, false, G.gold, RAND); y -= 13; }
      strich(RAND, y, innen, G.gold, 1.6);
      y -= 20;
      if (erste && s.kacheln && s.kacheln.length) {
        var n = s.kacheln.length, kb = innen / n, kh = 46, oben = y;
        t.push(G.kachel + ' rg ' + RAND + ' ' + (y - kh).toFixed(1) + ' ' +
               innen.toFixed(1) + ' ' + kh + ' re f');
        s.kacheln.forEach(function (k, i) {
          var kx = RAND + i * kb + 13;
          y = oben - 17;
          zeile(k.label.toUpperCase(), 7, true, G.hell, kx);
          y = oben - 33;
          var wert = k.wert, gr = 13;
          while (textBreite(wert, gr, true) > kb - 26 && gr > 7.5) gr -= 0.5;
          zeile(wert, gr, true, G.text, kx);
        });
        y = oben - kh - 16;
      }
      return y;
    }

    /* ---------- Was als Naechstes passiert ----------
       Steht unten auf der letzten Seite, wenn dort Platz ist. „verkaufs-
       psychologisch stark" (Betreiber, 12.10.2026): Ein Blatt, das nur
       aufzaehlt, was gewaehlt wurde, endet im Stapel. Hier steht der
       Ablauf, den der Betrieb ohnehin faehrt – keine Versprechen, die im
       Angebot dann anders aussehen.

       Fehlt der Platz, entfaellt der Block ersatzlos: Lieber keine
       Schlusszeile als eine, die in die Tabelle darueber laeuft. */
    function schlussZeichnen(tiefste) {
      if (!s.schritte || !s.schritte.length) return;
      /* Knapp bemessen, mit Absicht: Beim ersten Versuch war der Block
         40 Punkte hoch und fiel deshalb um 0,8 Punkte aus der Seite –
         jede Zugabe hier kostet genau den Platz, an dem es scheitert. */
      var hoehe = 34, fuss = RAND + 26, oben = fuss + hoehe;
      if (tiefste < oben + 8) return;
      t.push(G.kachel + ' rg ' + RAND + ' ' + fuss + ' ' +
             innen.toFixed(1) + ' ' + hoehe + ' re f');
      y = oben - 13;
      zeile('SO GEHT ES WEITER', 7.6, true, G.gold, RAND + 13);
      y -= 15;
      var x = RAND + 13;
      s.schritte.forEach(function (schritt, i) {
        var nr = (i + 1) + '';
        zeile(nr, 10, true, G.gold, x);
        x += textBreite(nr, 10, true) + 5;
        zeile(schritt, 9.4, false, G.text, x);
        x += textBreite(schritt, 9.4, false) + 22;
      });
    }

    function fussZeichnen() {
      /* Der Fuss traegt den Vorbehalt, der fuer ALLE Masse gilt – kursiv,
         weil er genau die Art Aussage ist, die oben einmal pro Zeile
         stand. Mehrere Zeilen sind erlaubt; die letzte steht unten,
         darueber die weiteren. */
      var fz = (s.unten instanceof Array) ? s.unten : [s.unten];
      fz.forEach(function (txt, i) {
        t.push('BT /F3 7.6 Tf ' + G.hell + ' rg ' + RAND + ' ' +
               (RAND - 4 + (fz.length - 1 - i) * 10) +
               ' Td (' + pdfText(txt) + ') Tj ET');
      });
      if (s.ruf) {
        var b = textBreite(s.ruf, 9, true);
        t.push('BT /F2 9 Tf ' + G.gold + ' rg ' +
               (A4_B - RAND - b).toFixed(1) + ' ' + (RAND - 5) +
               ' Td (' + pdfText(s.ruf) + ') Tj ET');
      }
      seiten.push(t.join('\n'));
      t = [];
    }

    function gruppeZeichnen(g, x, oben) {
      y = oben;
      zeile(g.titel.toUpperCase(), 7.6, true, G.gold, x);
      y -= 5;
      strich(x, y, spaltenB, G.linie);
      y -= 13;
      g.zeilen.forEach(function (z) {
        if (z.kopf) {
          zeile(z.kopf, GR, true, G.grau, x);
          if (z.kopfEigen) y -= ZH;
        }
        z.zeilen.forEach(function (w) {
          zeile(w, GR, z.stil, G.text, x + z.ein);
          y -= ZH;
        });
        y -= 1.6;
      });
      return y - 9;
    }

    var offen = gemessen, erste = true;
    while (offen.length) {
      var start = kopfZeichnen(erste);
      var platz = erste ? platzErste : platzWeiter;
      var v = verteilen(offen, platz);
      /* ---------- Platz fuer den Abschluss, aber nicht um jeden Preis ----------
         Der Block unten ist der Teil, der sagt, wie es weitergeht – er
         soll nicht daran scheitern, dass der Inhalt ein paar Punkte zu
         tief reicht (so fiel er beim ersten Versuch weg: 107 statt 108
         Punkte). Ihm den Platz aber fest zu reservieren, drueckte eine
         ganze Gruppe auf eine zweite, fast leere Seite – auch keine
         Verbesserung.

         Darum zweistufig: erst ohne Reservierung verteilen; reicht es
         nicht, noch einmal mit. Entstuende dadurch eine zusaetzliche
         Seite, bleibt es bei der ersten Verteilung und der Block
         entfaellt. Eine volle Seite ohne Abschluss ist besser als zwei
         halbe mit. */
      if (schlussH && !v.rest.length) {
        var hoch = Math.max(
          v.spalten[0].reduce(function (a, g) { return a + g.hoehe; }, 0),
          v.spalten[1].reduce(function (a, g) { return a + g.hoehe; }, 0));
        if (start - hoch < RAND + 26 + 34 + 8) {
          var v2 = verteilen(offen, platz - schlussH);
          if (!v2.rest.length) v = v2;
        }
      }
      var tiefste = start;
      v.spalten.forEach(function (sp, i) {
        var x = RAND + i * (spaltenB + 34), oben = start;
        sp.forEach(function (g) { oben = gruppeZeichnen(g, x, oben); });
        if (oben < tiefste) tiefste = oben;
      });
      if (!v.rest.length) schlussZeichnen(tiefste);
      fussZeichnen();
      offen = v.rest;
      erste = false;
    }
    if (!seiten.length) { kopfZeichnen(true); fussZeichnen(); }
    return seiten;
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
    var nr = 6, seitenNr = [], i;
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
    /* Kursiv: Helvetica-Oblique gehoert ebenfalls zu den Schriften, die
       jeder Betrachter mitbringt – sie muss also nicht eingebettet
       werden. Ihre Zeichenbreiten sind dieselben wie bei der geraden
       Helvetica (nur geneigt), darum rechnet textBreite() damit. */
    objAuf(5);
    schreibS('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique ' +
             '/Encoding /WinAnsiEncoding >>\nendobj\n');

    seiten.forEach(function (s, k) {
      var p = seitenNr[k];
      var inhaltB = bytes(s.strom);
      var br = s.breite || A4_B, ho = s.hoehe || A4_H;

      objAuf(p.seite);
      schreibS(p.seite + ' 0 obj\n<< /Type /Page /Parent 2 0 R ' +
               '/MediaBox [0 0 ' + br + ' ' + ho + '] ' +
               '/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>' +
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
    var fertig = [];
    seiten.forEach(function (s) {
      if (s.bild) {
        var bild = { daten: ausDatenUrl(s.bild) };
        fertig.push({
          strom: inhaltBild(bild, s.titel, s.unten, s.rechts),
          bild: bild.daten
        });
        return;
      }
      /* Eine Seite mit Gruppen kann zu mehreren werden – darum liefert
         inhaltKonfig() ein Array. Die schlichte Liste bleibt fuer
         Aufrufer, die keine Gruppen uebergeben. */
      if (s.gruppen) {
        inhaltKonfig(s).forEach(function (strom) { fertig.push({ strom: strom }); });
        return;
      }
      fertig.push({ strom: inhaltText(s.titel, s.zeilen || [], s.unten) });
    });
    return ausStroemen(fertig, meta);
  }

  global.BV_PDF = {
    erzeugen: erzeugen,          // Ansichtsseiten des Konfigurators
    ausStroemen: ausStroemen,    // fertige Stroeme (nutzt js/bg-pdf.js)
    pdfText: pdfText,            // Klammern und Rueckstrich escapen
    textBreite: textBreite,      // Helvetica-Breite, zum Pruefen
    umbrechen: umbrechen,
    winAnsi: winAnsi,
    jpegMasse: jpegMasse
  };
})(window);
