/* ============================================================
   BV AussenSysteme – Stückliste aus Breite, Tiefe und Material

   Diese Datei ist die **einzige** Stelle, die Herstellerzahlen auslegt.
   Die 3D-Schicht fragt nur `bauteile(system, material, breite, tiefe)` und
   rechnet selbst nichts aus. Kommt eine neue Preisliste, wird
   daten/dachmatrix.json ersetzt und scripts/baue-dachmatrix.js ausgeführt –
   an dieser Datei ändert sich nichts.

   HERKUNFT JEDER ZAHL
   Über jeder Konstanten steht, woher sie stammt:
     BELEGT     – aus daten/dachmatrix.json bzw. daten/technische-daten.md
     BETRIEB    – Regel des Betriebsinhabers, nicht aus der Preisliste
     GESCHÄTZT  – nirgends belegt, siehe daten/offene-punkte.md

   KEINE FORMELN FÜR STÜCKZAHLEN. Die Sparrenanzahl folgt keiner Regel
   „Breite / x" – sie springt unregelmäßig (bei TDS/Glas 11 → 13 → 15, dann
   über vier Breiten konstant). Jede Zahl kommt aus der Tabelle.
   ============================================================ */
(function (global) {
  'use strict';

  /* Die Matrix liegt bewusst NICHT in diesem Repository: bvlandingpage ist
     öffentlich, und die Sparren-/Stützfußmatrix ist eine systematische
     Übernahme aus den Preislisten des Herstellers (Datenbankherstellerrecht,
     §§ 87a ff. UrhG). Quelle und Begründung stehen im privaten Repository
     bv-crm unter docs/konfigurator-daten/README.md.
     Fehlt sie, liefert bauteile() null – der Konfigurator zeigt dann die
     geschätzte Skizze statt falscher Zahlen. */
  /* Diese Datei enthält selbst KEINE Herstellerdaten und lädt auch keine.
     Wer sie benutzt, reicht die Matrix über matrixSetzen() herein:
       · der Worker aus dem KV-Speicher (siehe worker/index.js)
       · die Prüfskripte aus daten/ (lokal, nicht im Repository)
       · der Browser gar nicht – dort kommt nur das fertige Ergebnis an
     Ohne Matrix liefert bauteile() einen Fehler statt falscher Zahlen. */
  var MATRIX = [];

  /* ---------- Belegte Konstanten ---------- */

  // BELEGT: technische-daten.md 5.4, aus src/lib/aufmass.ts
  var TIEFE_MAX_OHNE_UNTERZUG = 4500;   // harte Betriebsgrenze
  var TIEFE_MAX_MIT_UNTERZUG  = 7000;   // darüber nicht lieferbar

  // BELEGT: technische-daten.md 6
  var NEIGUNG_MIN_GRAD = 2;
  var NEIGUNG_MAX_GRAD = 14;
  var NEIGUNG_STANDARD_GRAD = 8;        // = 140 mm/m, Montageanleitung S. 9/11
  var TERRASSENGEFAELLE_STANDARD_PROZENT = 2;
  var DURCHGANGSHOEHE_MIN_MM = 2000;    // Empfehlung, keine Sperre

  /* BELEGT: technische-daten.md 1 – SkyView und Flat Line sind Flachdächer
     und haben kein Neigungsfeld. Nur TDS ist geneigt. */
  var GENEIGT = { 'TDS': true, 'SkyView': false, 'Flat Line': false };

  // BELEGT: technische-daten.md 4.3 – Standardlänge der Stützen
  var STUETZENLAENGE_MM = { 'TDS': 2500, 'SkyView': 3000, 'Flat Line': 3000 };

  // BELEGT: Einzelteileliste, Artikel 15190 bzw. 15187
  var PFOSTEN_MM = { breite: 110, tiefe: 110, wand: 2.5 };
  var PFOSTEN_ALTERNATIV_MM = { breite: 60, tiefe: 60 };   // Art. 10727
  var STATIKTRAEGER_MM = { hoehe: 189, breite: 117 };      // Art. 15187

  /* BELEGT: VD-Montageanleitung S. 25 – der einzige belegte Positionswert.
     Die Pfostenachse steht 55 mm hinter der Vorderkante des Daches. */
  var PFOSTENACHSE_VON_VORDERKANTE_MM = 55;

  // BELEGT: technische-daten.md 4.3 – Einbindung je Gründung
  var EINBINDUNG_MM = {
    'Punktfundament': 600,          // 550 oder 600; 550 braucht zusätzlich U-Profil 50 mm
    'Punktfundament 550': 550,
    'Boden-Stahlkonsole': 0,
    'U-Profil': 0
  };

  // BELEGT: technische-daten.md 8.3 – Trapezprofil T35M-0,75, nur Flat Line
  var TRAPEZBLECH_MM = { profilhoehe: 35, blechstaerke: 0.75 };

  /* BELEGT: technische-daten.md 3.1/8.2 – die Sparrenzahl richtet sich nach
     der größten zulässigen Feldbreite der Eindeckung.
     ⚠️ Das Band stimmt NICHT für alle Rastermaße, siehe feldbreite() unten. */
  var FELDBREITE_BAND = {
    'Glas': [680, 770],              // max. Scheibenbreite VSG 8 mm: 720 mm
    'Polycarbonat': [1016, 1080]     // Stegplattenbreite
  };

  /* BELEGT: technische-daten.md 8.1 – Glasanteil am Rohmaß. Die Differenz
     ist der Rahmen; das Rastermaß ist also größer als die Glasfläche. */
  var GLASANTEIL = { 'TDS': [0.969, 0.985], 'SkyView': [0.950, 0.959] };

  /* BELEGT: technische-daten.md 5.2 – Innenkern-Sparren.
     TDS und SkyView: 4000–4600 mm Tiefe, nicht im Preis enthalten.
     Flat Line: 5000–6000 mm, Verstärkung im Grundpreis enthalten. */
  var INNENKERN_BAND = {
    'TDS':       { von: 4000, bis: 4600, imPreis: false },
    'SkyView':   { von: 4000, bis: 4600, imPreis: false },
    'Flat Line': { von: 5000, bis: 6000, imPreis: true }
  };

  /* BELEGT: technische-daten.md 7 – Lieferlängen erzwingen Stöße.
     Rinnenkopplung und Innenkern Rinne ab Breite über 7 m (im Grundpreis). */
  var STOSS_AB_BREITE_MM = 7000;
  var TEILUNG_WAEHLBAR_AB_MM = { 'TDS': 7080, 'SkyView': 7080, 'Flat Line': 7001 };

  /* BELEGT: technische-daten.md 2 – Stegplattenmaße ohne Zuschnitt vor Ort
     (Montageanleitung S. 11). Bei Polycarbonat bevorzugt vorschlagen. */
  var STEGPLATTEN_OHNE_ZUSCHNITT = {
    breiten: [2060, 3060, 4060, 5060, 6060, 7060],
    tiefen: [3050, 3550, 4050, 4550, 5050, 5550, 6050, 6550, 7050]
  };

  /* BELEGT: technische-daten.md 11 – freistehend bei TDS/SkyView wird aus
     Teilen gebaut: ein Statikträger über die volle Breite trägt die hintere
     Kante, dazu eine Blende und zwei zusätzliche Pfosten. */
  var FREISTEHEND_ZUSATZ = { statiktraeger: 1, statiktraegerblende: 1, pfosten: 2 };

  // BELEGT: farben.ts – nur TDS führt Reinweiß 9010
  var FARBEN = {
    '7016': 'Anthrazit', '9006': 'Weißaluminium',
    '9007': 'Graualuminium', '9010': 'Reinweiß'
  };
  var FARBEN_JE_SYSTEM = {
    'TDS':       ['7016', '9006', '9007', '9010'],
    'SkyView':   ['7016', '9006', '9007'],
    'Flat Line': ['7016', '9006', '9007']
  };

  // BELEGT: technische-daten.md 8.3 – Standard der Matrixpreise
  var EINDECKUNG_STANDARD = {
    'Glas': 'VSG-Glas 8 mm',
    'Polycarbonat': 'Sechsfachstegplatten 16 mm',
    'Trapezblech': 'Trapezblech T35M-0,75'
  };

  /* ---------- GESCHÄTZTE Querschnitte ----------
     Nichts davon steht in unseren Daten; belegt sind nur Pfosten und
     Statikträger (oben). Alle Werte hier sind Annahmen, damit das Modell
     überhaupt gebaut werden kann – siehe daten/offene-punkte.md, Punkt A.
     Sie gehören ersetzt, sobald VD Systemschnitte oder DXF liefert.
     Die Oberfläche muss sie als Schätzung kenntlich machen. */
  var PROFILE_GESCHAETZT = {
    // GESCHÄTZT: Sparren (Träger TD / Träger Flat) – Punkt A
    sparren:        { breite: 60,  hoehe: 110 },
    // GESCHÄTZT: Rinne 2 TD, Vorderkante – Punkt A
    rinne:          { hoehe: 150, tiefe: 120 },
    // GESCHÄTZT: Wandprofil TD – Punkt A
    wandprofil:     { hoehe: 110, ausladung: 70 },
    // GESCHÄTZT: Glasleiste oben auf dem Sparren – Punkt A
    glasleiste:     { breite: 60,  hoehe: 20 },
    // GESCHÄTZT: Seiten-/Rinnenblende, bestimmt die Silhouette – Punkt A
    blende:         { hoehe: 150, staerke: 20 },
    // GESCHÄTZT: Statikträgerblende, verkleidet den Unterzug – Punkt A
    traegerblende:  { hoehe: 200, staerke: 20 },
    // GESCHÄTZT: Sparrenüberstand vorne über die Rinne – Punkt H
    sparrenueberstand: 0
  };
  // Jeder Schlüssel hier ist geschätzt – die Oberfläche kann das auslesen,
  // statt die Liste ein zweites Mal zu pflegen.
  var GESCHAETZTE_WERTE = Object.keys(PROFILE_GESCHAETZT);

  /* ---------- Nachschlagen ---------- */
  function block(system, material) {
    for (var i = 0; i < MATRIX.length; i++) {
      if (MATRIX[i].system === system && MATRIX[i].material === material) return MATRIX[i];
    }
    return null;
  }

  function systeme() {
    var s = [];
    MATRIX.forEach(function (b) { if (s.indexOf(b.system) === -1) s.push(b.system); });
    return s;
  }

  function materialien(system) {
    return MATRIX.filter(function (b) { return b.system === system; })
                 .map(function (b) { return b.material; });
  }

  function breiten(system, material) {
    var b = block(system, material);
    if (!b) return [];
    return Object.keys(b.sparrenJeBreite).map(Number).sort(function (x, y) { return x - y; });
  }

  function tiefen(system, material) {
    var b = block(system, material);
    return b ? b.tiefen.slice() : [];
  }

  /* Nächstgrößeres Rastermaß. Zwischenmaße gibt es nicht; wer 5300 mm will,
     bekommt 5900 mm angezeigt – und sieht beides. Über dem größten Maß wird
     auf das größte begrenzt und das gemeldet. */
  function naechstesRaster(liste, wunsch) {
    for (var i = 0; i < liste.length; i++) if (liste[i] >= wunsch) return liste[i];
    return liste[liste.length - 1];
  }

  function hatMarkierung(b, art, breite, tiefe) {
    var m = b.markierungen && b.markierungen[art];
    if (!m) return false;
    var liste = m[String(breite)];
    return !!liste && liste.indexOf(tiefe) > -1;
  }

  /* Achsabstand der Sparren. Die Sparren teilen die Breite, die Randsparren
     liegen außen – also (Sparren − 1) Felder.
     ⚠️ Die Selbstkontrolle aus der Begleitdoku („muss im Band 680–770 bzw.
     1016–1080 mm liegen") trifft NICHT auf alle Rastermaße zu. Die vier
     Bandgrenzen sind genau die Extremwerte der TDS-Reihen; SkyView und
     Flat Line liegen teils darunter. Das Band beschreibt also TDS, nicht
     die ganze Matrix. Deshalb nur ein Hinweis, keine Sperre – die genaue
     Auswertung steht in bv-crm, docs/konfigurator-daten/. */
  function feldbreite(system, material, breite) {
    var b = block(system, material);
    if (!b) return null;
    var n = b.sparrenJeBreite[String(breite)];
    if (!n || n < 2) return null;
    var achs = breite / (n - 1);
    var band = FELDBREITE_BAND[material] || null;
    return {
      achsabstand: Math.round(achs * 10) / 10,
      felder: n - 1,
      band: band,
      imBand: band ? (achs >= band[0] - 0.5 && achs <= band[1] + 0.5) : null
    };
  }

  /* ---------- Hauptfunktion ----------
     optionen.statiktraeger – erzwingt bzw. unterdrückt den Unterzug
     optionen.freistehend   – TDS/SkyView ohne Hauswand (Zusatzteile)
     optionen.gruendung     – Schlüssel aus EINBINDUNG_MM, für die Pfostenlänge
     optionen.ukRinneMm     – lichte Höhe vorne, für die Pfostenlänge */
  function bauteile(system, material, breiteWunsch, tiefeWunsch, optionen) {
    optionen = optionen || {};
    var b = block(system, material);
    if (!b) {
      return { fehler: 'Unbekannte Kombination: ' + system + ' / ' + material };
    }

    var bL = breiten(system, material), tL = tiefen(system, material);
    var breite = naechstesRaster(bL, breiteWunsch);
    var tiefe = naechstesRaster(tL, tiefeWunsch);

    var sparren = b.sparrenJeBreite[String(breite)];
    var stuetzfuesse = b.stuetzfuesseJeBreite[String(breite)];

    var hinweise = [];
    function hin(art, text) { hinweise.push({ art: art, text: text }); }

    if (breite !== breiteWunsch || tiefe !== tiefeWunsch) {
      hin('raster', 'Zwischenmaße gibt es nicht. Gewünscht ' + breiteWunsch + ' × ' +
          tiefeWunsch + ' mm, gezeigt wird das nächste Rastermaß ' +
          breite + ' × ' + tiefe + ' mm.');
    }
    if (breiteWunsch > bL[bL.length - 1] || tiefeWunsch > tL[tL.length - 1]) {
      hin('grenze', 'Größer als das Raster des Systems (max. ' + bL[bL.length - 1] +
          ' × ' + tL[tL.length - 1] + ' mm).');
    }

    /* Unterzug / Statikträger.
       BELEGT für TDS aus der Preislistenfarbe. Für SkyView und Flat Line sind
       keine Markierungen hinterlegt (offene-punkte.md, Punkt E) – dort greift
       allein die Betriebsgrenze: über 4500 mm Tiefe Unterzug erforderlich. */
    var unterzugLautListe = hatMarkierung(b, 'unterzug', breite, tiefe);
    var markierungenVorhanden = !!(b.markierungen && b.markierungen.unterzug);
    var unterzugLautBetrieb = tiefe > TIEFE_MAX_OHNE_UNTERZUG;
    var unterzugPflicht = unterzugLautListe || unterzugLautBetrieb;
    var unterzugQuelle = unterzugLautListe ? 'preisliste'
      : (unterzugLautBetrieb ? (markierungenVorhanden ? 'betriebsregel' : 'annahme') : null);

    var statiktraeger = (optionen.statiktraeger === undefined)
      ? unterzugPflicht : !!optionen.statiktraeger;

    if (unterzugLautBetrieb && !unterzugLautListe && markierungenVorhanden) {
      // Die beiden Grenzen widersprechen sich leicht – bewusst nicht geglättet
      hin('statik', 'Die Preisliste führt diese Tiefe ohne Unterzug-Markierung, die ' +
          'Betriebsgrenze liegt aber bei ' + TIEFE_MAX_OHNE_UNTERZUG +
          ' mm. Angewendet wird die härtere Grenze: Statikträger nötig.');
    }
    if (unterzugQuelle === 'annahme') {
      hin('annahme', 'Für ' + system + ' sind in der Preisliste keine ' +
          'Statik-Markierungen hinterlegt. Der Unterzug folgt hier allein der ' +
          'Betriebsgrenze von ' + TIEFE_MAX_OHNE_UNTERZUG + ' mm – ungeprüfte Annahme.');
    }

    /* Pfosten: Zahl aus der Preisliste plus Tiefenregel des Betriebs.
       BETRIEB (Inhaber, 07.08.2026): „bis 4500 mm geht es auf 2 Pfosten, ab
       4500 mm wird ein 3. Pfosten benötigt. Kommt aber ein Statikträger ins
       Spiel, hebt das diese Regel auf – dann braucht man erst über 7000 mm
       wieder einen 3. Pfosten."
       ⚠️ ANNAHME: Ob die Regel addiert oder die Zahl aus der Liste ersetzt,
       ist unbeantwortet; die CRM-Plattform addiert. Ebenso offen, ob
       „2 statt 3 Pfosten" je Seite oder insgesamt gilt. */
    var zusatzpfosten = statiktraeger
      ? (tiefe > TIEFE_MAX_MIT_UNTERZUG) : (tiefe > TIEFE_MAX_OHNE_UNTERZUG);
    var pfosten = stuetzfuesse + (zusatzpfosten ? 1 : 0);
    if (zusatzpfosten) {
      hin('pfosten', 'Wegen der Tiefe kommt ein Pfosten dazu (' + stuetzfuesse +
          ' + 1). Betriebsregel, nicht aus der Preisliste – ob sie addiert oder ' +
          'ersetzt, ist beim Hersteller offen.');
    }

    /* Freistehend. BELEGT (technische-daten.md 11): TDS und SkyView liegen in
       der Preisliste nur als Wandmontage-Sets vor; freistehend wird aus Teilen
       gebaut – ein Statikträger über die volle Breite anstelle des
       Wandprofils, eine Blende dazu und zwei zusätzliche Pfosten.
       Flat Line ist von Haus aus freistehend. */
    var systemFreistehend = b.montageart === 'freistehend';
    var freistehend = systemFreistehend || !!optionen.freistehend;
    var statiktraegerStueck = statiktraeger ? 1 : 0;
    if (freistehend && !systemFreistehend) {
      pfosten += FREISTEHEND_ZUSATZ.pfosten;
      statiktraegerStueck += FREISTEHEND_ZUSATZ.statiktraeger;
      hin('freistehend', 'Freistehend ist kein Set: Es kommen ' +
          FREISTEHEND_ZUSATZ.pfosten + ' Pfosten und ein Statikträger über die ' +
          'volle Breite samt Blende dazu (statt des Wandprofils).');
    }

    /* Pfostenreihen. Bei Wandmontage trägt hinten das Wandprofil – eine Reihe.
       Freistehende Anlagen brauchen zwei. Bei Flat Line ist BELEGT, dass die
       Pfosten nur an den beiden Breitenseiten stehen und die Träger in der
       Tiefe laufen. ⚠️ NICHT belegt (offene-punkte.md, Punkt D): ob die
       Stützfußzahl der Preisliste die Gesamtzahl oder die je Reihe ist. */
    var reihen = freistehend ? 2 : 1;
    var pfostenJeReihe = freistehend ? Math.ceil(pfosten / 2) : pfosten;
    if (systemFreistehend) {
      hin('annahme', 'Freistehendes System: angenommen, die ' + pfosten +
          ' Pfosten verteilen sich auf zwei Reihen. Ob die Preisliste die ' +
          'Gesamtzahl oder die Zahl je Reihe nennt, ist offen.');
    }

    /* Innenkern-Sparren. Zwei belegte Quellen, die sich nicht decken: die
       Fußnote nennt ein Tiefenband, die Preislistenfarbe nur einzelne Zellen.
       Beides wird ausgegeben, nicht verrechnet (offene-punkte.md, Punkt E). */
    var innenLaut = hatMarkierung(b, 'innenkern_sparren', breite, tiefe);
    var bandIK = INNENKERN_BAND[system];
    var innenLautBand = !!bandIK && tiefe >= bandIK.von && tiefe <= bandIK.bis;
    if (innenLautBand && !innenLaut) {
      hin('statik', 'Tiefe liegt im Innenkern-Band des Systems (' + bandIK.von +
          '–' + bandIK.bis + ' mm). Die Preisliste markiert diese Zelle nicht – ' +
          'die Fußnote der Liste nennt das Band aber ausdrücklich.');
    }
    if (innenLautBand && bandIK && !bandIK.imPreis) {
      hin('preis', 'Innenkern-Sparren sind erforderlich und **nicht** im ' +
          'Preis enthalten (je Sparren einer).');
    }

    /* Stöße. BELEGT: Rinnenkopplung und Innenkern Rinne ab Breite über 7 m,
       im Grundpreis enthalten. Wie der Stoß aussieht, ist nicht belegt. */
    var stoss = breite > STOSS_AB_BREITE_MM;
    if (stoss) {
      hin('stoss', 'Über ' + STOSS_AB_BREITE_MM + ' mm Breite werden Rinne, ' +
          'Wandprofil und Statikträger gestoßen (Rinnenkopplung, im Grundpreis). ' +
          'Wie der Stoß aussieht, ist nicht belegt – im Modell nicht dargestellt.');
    }

    /* Stegplatten ohne Zuschnitt vor Ort. BELEGT, Montageanleitung S. 11. */
    if (material === 'Polycarbonat') {
      var ohneZuschnitt = STEGPLATTEN_OHNE_ZUSCHNITT.breiten.indexOf(breite) > -1 &&
                          STEGPLATTEN_OHNE_ZUSCHNITT.tiefen.indexOf(tiefe) > -1;
      if (!ohneZuschnitt) {
        hin('montage', 'Bei diesem Maß müssen die Stegplatten vor Ort ' +
            'zugeschnitten werden. Ohne Zuschnitt gehen Breiten ' +
            STEGPLATTEN_OHNE_ZUSCHNITT.breiten.join(', ') + ' mm mit Tiefen ' +
            STEGPLATTEN_OHNE_ZUSCHNITT.tiefen.join(', ') + ' mm.');
      }
    }

    /* Neigung. BELEGT: SkyView und Flat Line sind Flachdächer ohne
       Neigungsfeld; nur TDS ist geneigt (Standard 8°). */
    var geneigt = GENEIGT[system] !== false;

    /* Pfostenlänge = UK Rinne + Einbindung, ausdrücklich OHNE Terrassengefälle. */
    var einbindung = EINBINDUNG_MM[optionen.gruendung] ;
    var pfostenlaenge = (optionen.ukRinneMm && einbindung !== undefined)
      ? optionen.ukRinneMm + einbindung : null;

    var fb = feldbreite(system, material, breite);
    if (fb && fb.band && !fb.imBand) {
      hin('pruefung', 'Achsabstand der Sparren ' + fb.achsabstand + ' mm liegt ' +
          'außerhalb des dokumentierten Bandes ' + fb.band[0] + '–' + fb.band[1] +
          ' mm. Das Band stammt aus den TDS-Reihen und gilt nicht für alle ' +
          'Rastermaße – die Stückzahl kommt unverändert aus der Preisliste.');
    }

    return {
      system: system,
      material: material,
      montageart: freistehend ? 'freistehend' : b.montageart,
      angefragt: { breite: breiteWunsch, tiefe: tiefeWunsch },
      raster:    { breite: breite, tiefe: tiefe },
      imRaster:  breite === breiteWunsch && tiefe === tiefeWunsch,

      sparren: sparren,
      feldbreite: fb,
      stuetzfuesse: stuetzfuesse,          // wie in der Preisliste
      pfosten: pfosten,                    // inklusive Tiefenregel und freistehend
      pfostenReihen: reihen,
      pfostenJeReihe: pfostenJeReihe,
      zusatzpfostenWegenTiefe: zusatzpfosten,
      pfostenachseVonVorderkante: PFOSTENACHSE_VON_VORDERKANTE_MM,
      pfostenlaenge: pfostenlaenge,
      stuetzenlaengeStandard: STUETZENLAENGE_MM[system] || null,

      freistehend: freistehend,
      statiktraeger: statiktraeger || statiktraegerStueck > 0,
      statiktraegerStueck: statiktraegerStueck,
      statiktraegerPflicht: unterzugPflicht,
      statiktraegerQuelle: unterzugQuelle,
      /* Die Quelle spricht ausdrücklich von der *Glas*eindeckung, die bei
         Unterzug aus zwei Teilen besteht; die Markierung gibt es nur für
         Glas und Polycarbonat. Trapezblech kommt in langen Bahnen – dort
         wird nicht geteilt. */
      eindeckungGeteilt: statiktraeger && material !== 'Trapezblech',
      innenkernLautListe: innenLaut,       // nur die Preislisten-Markierung
      innenkernSparren: innenLaut || innenLautBand,
      innenkernImPreis: bandIK ? bandIK.imPreis : null,
      stoss: stoss,
      geneigt: geneigt,
      eindeckung: EINDECKUNG_STANDARD[material] || material,
      glasanteil: GLASANTEIL[system] || null,

      masse: {
        pfosten: PFOSTEN_MM,
        pfostenAlternativ: PFOSTEN_ALTERNATIV_MM,
        statiktraeger: STATIKTRAEGER_MM,
        trapezblech: material === 'Trapezblech' ? TRAPEZBLECH_MM : null,
        geschaetzt: PROFILE_GESCHAETZT
      },
      farben: (FARBEN_JE_SYSTEM[system] || []).map(function (r) {
        return { ral: r, name: FARBEN[r] };
      }),
      hinweise: hinweise
    };
  }

  /* Neigung ist kein Systemwert, sondern ein Messwert vom Aufmaß
     (offene-punkte.md, Punkt E in der Vorfassung). Hier nur die Grenzen. */
  var NEIGUNG = {
    min: NEIGUNG_MIN_GRAD, max: NEIGUNG_MAX_GRAD, standard: NEIGUNG_STANDARD_GRAD,
    durchgangshoeheMin: DURCHGANGSHOEHE_MIN_MM,
    terrassengefaelleProzent: TERRASSENGEFAELLE_STANDARD_PROZENT
  };

  /* Sparrenlänge: die Tiefe ist waagerecht gemessen (Grundrissmaß), das Dach
     liegt schräg darüber. BELEGT, technische-daten.md 6. */
  function sparrenlaenge(tiefeMm, neigungGrad) {
    return tiefeMm / Math.cos(neigungGrad * Math.PI / 180);
  }
  function hoeheHinten(ukRinneMm, tiefeMm, neigungGrad, gefaelleAusgleichMm) {
    return Math.round(ukRinneMm - (gefaelleAusgleichMm || 0) +
                      Math.tan(neigungGrad * Math.PI / 180) * tiefeMm);
  }
  function neigungAusHoehen(ukWandprofilMm, ukRinneMm, tiefeMm, gefaelleAusgleichMm) {
    return Math.atan((ukWandprofilMm - ukRinneMm + (gefaelleAusgleichMm || 0)) / tiefeMm)
           * 180 / Math.PI;
  }
  function gefaelleAusgleich(tiefeMm, prozent) {
    return Math.round(tiefeMm * prozent / 100);
  }

  /* Die Matrix kann auch zur Laufzeit gesetzt werden. Der Worker lädt sie
     aus dem KV-Speicher und reicht sie hier herein; im Browser bleibt sie
     leer, dort kommt nur das fertige Ergebnis über /api/bauteile an. */
  function matrixSetzen(daten) {
    MATRIX = (daten && daten.length) ? daten : [];
    return MATRIX.length;
  }
  function matrixVorhanden() { return MATRIX.length > 0; }

  var API = {
    bauteile: bauteile, feldbreite: feldbreite,
    matrixSetzen: matrixSetzen, matrixVorhanden: matrixVorhanden,
    systeme: systeme, materialien: materialien,
    breiten: breiten, tiefen: tiefen,
    NEIGUNG: NEIGUNG, GENEIGT: GENEIGT,
    sparrenlaenge: sparrenlaenge, hoeheHinten: hoeheHinten,
    neigungAusHoehen: neigungAusHoehen, gefaelleAusgleich: gefaelleAusgleich,
    PROFILE_GESCHAETZT: PROFILE_GESCHAETZT,
    GESCHAETZTE_WERTE: GESCHAETZTE_WERTE,
    STEGPLATTEN_OHNE_ZUSCHNITT: STEGPLATTEN_OHNE_ZUSCHNITT,
    EINBINDUNG_MM: EINBINDUNG_MM,
    STUETZENLAENGE_MM: STUETZENLAENGE_MM,
    TIEFE_MAX_OHNE_UNTERZUG: TIEFE_MAX_OHNE_UNTERZUG,
    TIEFE_MAX_MIT_UNTERZUG: TIEFE_MAX_MIT_UNTERZUG
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.BVBauteile = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
