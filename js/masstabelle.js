/* Maßtabelle Terrassenüberdachungen – Sparren und Stützfüße je Breite.
 *
 * Quelle: „Maßtabelle Terrassenüberdachungen – BV AussenSysteme",
 * Stand 11.10.2026, vom Betriebsinhaber geprüft und ausdrücklich zur
 * öffentlichen Verwendung freigegeben. Die Tabelle enthält KEINE Preise.
 *
 * WARUM DIESE DATEI NEBEN js/bauteile.js STEHT
 * bauteile.js liest die vollständige Herstellermatrix aus dem
 * KV-Speicher über /api/bauteile. Solange der Namensraum DACHMATRIX
 * nicht gebunden ist, antwortet die Schnittstelle 503 – und vorher
 * zeigte der Konfigurator dann eine SCHÄTZUNG. Diese Datei schließt
 * genau diese Lücke mit echten Zahlen.
 *
 * REIHENFOLGE DER QUELLEN im Konfigurator:
 *   1. /api/bauteile (vollständige Matrix, wenn gebunden)
 *   2. diese Tabelle
 *   3. die Schätzung aus dem Achsabstand (nur noch Notnagel)
 *
 * VERDICHTUNG – nachgerechnet über alle 1316 Datensätze:
 *   · Sparren und Stützfüße hängen NUR von der Breite ab, nie von
 *     der Tiefe (0 Abweichungen)
 *   · Pfosten ohne Unterzug = Stützfüße + (Tiefe > 4500 ? 1 : 0)
 *   · Pfosten mit Unterzug  = Stützfüße + (Tiefe > 7000 ? 1 : 0)
 *   · Unterzug nötig ab Tiefe > 4500
 *   · Lieferbar bis Tiefe 7050 – das ist die letzte Spalte der Tabelle.
 *     Hier stand vorher 7000, und damit war im Konfigurator bei 7000 mm
 *     Schluss: „bei tds is die maximale tiefe 7050mm und maximale breite
 *     14080mm warum lässt sich das im konfigurator nicht einstellen"
 *     (Betreiber, 11.10.2026). Die 7000 waren der Punkt, ab dem ein
 *     Pfosten DAZUKOMMT – nicht das Höchstmaß. Zwei verschiedene Dinge,
 *     die in einem Wert steckten; deshalb stehen sie jetzt getrennt.
 *
 *     ACHTUNG, NICHT „KORRIGIEREN": Die Preislisten-PDF führt die Tiefe
 *     7050 bei TDS in allen 30 Breiten als LIEFERBAR=nein. Der Betreiber
 *     hat zweimal das Gegenteil gesagt – am 11.10.2026 zuerst
 *     („bei tds is die maximale tiefe 7050mm") und nach ausdrücklicher
 *     Rückfrage mit genau diesem Befund noch einmal: „7m war schon
 *     richtig, tiefe wie ich gesagt hab". Es gilt die Angabe des
 *     Betreibers; die PDF-Spalte ist an dieser Stelle überholt.
 *   · Innenkern ab Tiefe 4000 bis 4600 (einzige Stufe dort: 4600)
 * Deshalb stehen hier nur Breite → [Sparren, Stützfüße] und die
 * Liste der lieferbaren Tiefen. scripts/pruefe-masstabelle.js rechnet
 * die Regeln nach.
 *
 * Format je Eintrag: Breite: [Sparren, Stützfüße laut Preisliste]
 */
window.BV_MASSTABELLE = {
  stand: '2026-10-11',
  regeln: {
    /* KORREKTUR 15.10.2026: Hier standen 4500 mm. Der Betreiber nach der
       TDS-Preisliste: „bis tiefe 4m nichts notwendig, ab 4m bis 4,6m
       reicht Innenkern Träger und ab 4,6m unterzug über die gesamte
       breite". Die lieferbaren Tiefen springen 4000 → 4600 → 5000; eine
       4500 gibt es gar nicht. Mit der alten Grenze verlangte das Modell
       bei 4600 mm einen Unterzug, obwohl dort der Innenkern reicht. */
    tiefeMaxOhneUnterzug: 4600,
    /* Ab dieser Tiefe reicht der Innenkern-Traeger im Sparren; darunter
       ist nichts noetig, darueber (ab tiefeMaxOhneUnterzug) der Unterzug
       ueber die ganze Breite. */
    innenkernAbTiefe: 4000,
    /* Ab dieser Tiefe kommt MIT Unterzug ein Pfosten dazu. */
    tiefeMaxMitUnterzug: 7000,
    /* Größte lieferbare Tiefe – die letzte Spalte der Tabelle. */
    tiefeMaxLieferbar: 7050,
    /* Die einzige lieferbare Tiefe im Band 4000 < T <= 4600. Bleibt als
       eigener Wert stehen, weil die Glasteilung daran haengt. */
    innenkernTiefe: 4600
  },
  /* Welche Serienfarben ein System führt – BELEGT aus dem Kopf der
     Preislisten-Maßtabelle (FARBEN_TDS, FARBEN_SKYVIEW,
     FARBEN_FLATLINE). Reinweiß 9010 gibt es NUR bei TDS. „sonderfarbe"
     ist im Konfigurator der Knopf „Andere / Beratung" und steht überall
     zur Verfügung, deshalb hier nicht aufgeführt. */
  farben: {
    'TDS':       ['7016', '9006', '9007', '9010'],
    'SkyView':   ['7016', '9006', '9007'],
    'Flat_Line': ['7016', '9006', '9007']
  },
  systeme: {
    'Flat_Line|Trapezblech': {
      montage: 'freistehend',
      tiefen: [2000, 2500, 3000, 3500, 5000, 6000, 7000],
      breiten: {
        3000: [4, 4], 4000: [5, 4], 5000: [6, 4], 6000: [7, 6], 7000: [8, 6],
        8000: [9, 6], 9000: [10, 6], 10000: [11, 6], 11000: [12, 8],
        12000: [13, 8], 13000: [14, 8], 14000: [15, 8]
      }
    },
    'SkyView|Glas': {
      montage: 'wandmontage',
      tiefen: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4600, 5000, 5500, 6000, 6500, 7000],
      breiten: {
        1000: [3, 2], 1500: [3, 2], 2000: [4, 2], 2200: [4, 2], 3000: [5, 2],
        3700: [6, 2], 4000: [7, 2], 4500: [7, 2], 5000: [8, 2], 5200: [8, 2],
        5900: [9, 3], 6000: [9, 3], 6700: [10, 3], 7000: [11, 3],
        7400: [11, 3], 8000: [13, 3], 8200: [13, 3], 8900: [13, 3],
        9000: [15, 3], 9600: [15, 3], 10000: [15, 3], 10400: [15, 3],
        11000: [17, 4], 11100: [17, 4], 11900: [17, 4], 12000: [19, 4],
        12600: [19, 4], 13000: [19, 4], 13300: [19, 4], 14000: [21, 4]
      }
    },
    'SkyView|Polycarbonat': {
      montage: 'wandmontage',
      tiefen: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000],
      breiten: {
        1000: [2, 2], 2000: [3, 2], 3000: [4, 2], 4000: [5, 2], 5000: [6, 2],
        6000: [7, 3], 7000: [8, 3], 8000: [9, 3], 9000: [10, 3],
        10000: [11, 3], 11000: [12, 4], 12000: [13, 4], 13000: [14, 4],
        14000: [15, 4]
      }
    },
    'TDS|Glas': {
      montage: 'wandmontage',
      tiefen: [550, 1050, 1550, 2050, 2550, 3050, 3550, 4050, 4600, 5050, 5550, 6050, 6550, 7050],
      breiten: {
        1080: [3, 2], 1500: [3, 2], 2080: [4, 2], 2200: [4, 2], 3080: [5, 2],
        3700: [6, 2], 4080: [7, 2], 4500: [7, 3], 5080: [8, 3], 5200: [8, 3],
        5900: [9, 3], 6080: [9, 3], 6700: [10, 3], 7080: [11, 3],
        7400: [11, 3], 8080: [13, 4], 8200: [13, 4], 8900: [13, 4],
        9080: [15, 4], 9600: [15, 4], 10080: [15, 5], 10400: [15, 5],
        11080: [17, 5], 11100: [17, 5], 11900: [17, 5], 12080: [19, 5],
        12600: [19, 5], 13080: [19, 5], 13300: [19, 5], 14080: [21, 5]
      }
    },
    'TDS|Polycarbonat': {
      montage: 'wandmontage',
      tiefen: [550, 1050, 1550, 2050, 2550, 3050, 3550, 4050, 4550, 5050, 5550, 6050, 6550, 7050],
      breiten: {
        1080: [2, 2], 2080: [3, 2], 3080: [4, 2], 4080: [5, 2], 5080: [6, 3],
        6080: [7, 3], 7080: [8, 3], 8080: [9, 4], 9080: [10, 4],
        10080: [11, 5], 11080: [12, 5], 12080: [13, 5], 13080: [14, 5],
        14080: [15, 5]
      }
    }
  }
};
