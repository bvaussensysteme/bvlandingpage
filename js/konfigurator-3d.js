/* ============================================================
   BV AussenSysteme – 3D-Konfigurator

   Zeigt die gewählte Konfiguration als dreidimensionales Modell:
   Produkt, Maße, Aufbau, Eindeckung, Farbe und Seitenelemente
   wirken sich sofort auf das Bild aus.

   Produkte:
     · Terrassendach TDS   – klassisch geneigtes Profildach
     · Flachdach SkyView   – flachere Neigung, schmalere Profile,
                             hohe gerade Frontblende
     · Carport             – Carport TDS (geneigt, Glas/Polycarbonat),
                             Flat Line und Flat Box (Flachdach mit
                             umlaufender Blende, optional verkleidet)

   Warum eigene Kamerasteuerung statt OrbitControls?
   OrbitControls liegt nicht im Kern von three.js und käme von einem
   zweiten CDN. Die paar Zeilen hier kosten weniger als eine weitere
   Abhängigkeit – und wir können das Verhalten auf dem Handy selbst
   bestimmen (ein Finger dreht, zwei Finger schieben und zoomen,
   die Seite dahinter scrollt dabei nicht mit).

   three.js liegt bewusst im eigenen Verzeichnis js/vendor statt auf
   einem CDN: kein zusätzlicher Drittanbieter, keine IP-Übermittlung
   an Dritte und damit kein neuer Punkt in der Datenschutzerklärung.

   ACHTUNG Datenpfad: /api/bauteile liefert die Stückliste aus der
   Herstellermatrix. Der dafür nötige KV-Speicher ist derzeit NICHT
   angebunden (wrangler.jsonc), die Schnittstelle antwortet mit 503 –
   geprüft am 10.10.2026 gegen die veröffentlichte Seite. Alle Produkte
   laufen deshalb über die geschätzten Zeichnungen. Das ist vorgesehen,
   darf aber nicht übersehen werden: „Was daraus folgt" bleibt dann ganz weg.

   Der Zustand führt alle Maße in Millimeter – so, wie im Aufmaß
   gearbeitet wird. Für die Geometrie wird intern durch zehn geteilt,
   weil sich in Zentimetern angenehmer mit den Profilmaßen rechnen lässt.

   Die Werte, die an den Anfrage-Assistenten gehen (VORGABE_* weiter
   unten), müssen wörtlich den Auswahlmöglichkeiten im Assistenten
   entsprechen. Sonst steht im Angebot eine Angabe, die der Assistent
   nicht kennt – geprüft von scripts/pruefe-konfigurator.js.
   ============================================================ */
(function () {
  'use strict';

  var leinwand = document.getElementById('k3dCanvas');
  if (!leinwand || !window.THREE) return;

  /* ---------- Zustand ---------- */
  var Z = {
    produkt: 'Terrassendach TDS',
    cpTyp: 'Carport TDS',
    cpVariante: 'Freistehender Carport',
    cpDach: 'Trapezblech (Standard)',
    pgDachart: 'Lamellendach',
    pgAusfuehrung: 'SunPro',
    pgSeitenschutz: 'Nichts / später entscheiden',
    lamellen: 35,          // Öffnungswinkel der Lamellen in Grad
    ueberstand: 1000,
    neigung: 8,            // Grad; BELEGT als Standard, nur bei TDS einstellbar
    aufbau: 'Wandmontage',
    breite: 5000,
    tiefe: 3000,
    hoehe: 2300,
    eindeckung: 'VSG klar',   // siehe EINDECKUNGEN
    glasstaerke: 8,           // mm, nur bei Glas – 8 oder 10 (VSG)
    /* Aufteilung der Schiebeanlage JE SEITE – '' heißt automatisch.
       „soll pro seite sein, also für links,rechts und vorne" (Betreiber,
       11.10.2026). Eine gemeinsame Wahl war falsch gedacht: links und
       rechts laufen über die TIEFE, vorne über die BREITE. Das sind zwei
       verschiedene Maße, zu denen oft gar nicht dieselbe Bauart passt. */
    sg23Links: '', sg23Rechts: '', sg23Vorne: '',
    sg23Glas: 'ESG 10 mm klar',
    keilGlas: 'ESG klar',   // laut VD-Formular gibt es nur diese zwei
    sg23Schloss: 'ohne',          // ohne | links | rechts
    /* Beide Hälften haben ihre EIGENE Stellung: „man kann obere hälfte
       und untere hälfte seprat öffnen/schließen" (Betreiber,
       11.10.2026). Ein gemeinsamer Winkel mit Auswahlfeld daneben
       wäre nur die halbe Wahrheit – zu ist nicht dasselbe wie
       „gehört gerade nicht dazu". */
    velarisWinkelOben: 45,        // Lamellenstellung oben, 0 = zu
    velarisWinkelUnten: 45,       // Lamellenstellung unten, 0 = zu
    velarisArt: 'feststehend',    // feststehend | verschiebbar
    velarisBreite: 'gleich',      // gleich | wunsch (Formularfeld Elementbreite)
    velarisAnzahl: '',            // '' = automatisch, sonst gewünschte Elementzahl
    velarisOffen: 0,              // Prozent, nur verschiebbar
    rahmenTeilung: '',            // '' = automatisch, sonst Nummer der Aufteilung
    velarisFarbe: 'Anthrazit RAL 7016',
    traegerWunsch: false,     // Statikträger unter der Rinne auf Kundenwunsch
    vorsprungHinten: 0,       // mm, nur Carport TDS freistehend
    /* Nur Carport TDS: Höhe hinten wird DIREKT eingestellt, die Neigung
       ergibt sich daraus. Beim Terrassendach ist es umgekehrt – dort
       gibt man die Neigung vor und liest die Wandhöhe ab. */
    hoeheHinten: 2500,
    /* Voreingestellt FOLGT die hintere Höhe der vorderen: Neigung
       eingeben, Höhe hinten ablesen. Wer das Häkchen setzt, stellt sie
       frei ein – dann ist die Neigung das Ergebnis. „das soll gekopplt
       sein an vorne aber man soll es entkoppeln können und getrennt
       einstellen" (Betreiber, 11.10.2026). */
    hoeheGetrennt: false,
    /* Abstand der Glaskopplung von der Rinne, in mm. 0 heißt „mittig" –
       der Konfigurator setzt dann selbst. Siehe koppelBereich(). */
    koppelLage: 0,
    /* Lage des Unterzugs in mm ab der Wand. 0 = noch nichts eingestellt,
       dann mittig. Nur wenn die Tiefe einen Unterzug verlangt. */
    unterzugLage: 0,
    /* true, solange niemand den Unterzug-Regler angefasst hat: Dann liegt
       der Unterzug mittig und wandert bei jeder Massaenderung mit.
       „wenn ein unterzug nötig ist sollte dieser erst mal automatisch
       perfekt mittig platziert werden und dann falls man will mit regler
       gechoben werden können" (Betreiber, 15.10.2026). */
    unterzugAuto: true,
    farbe: 'Anthrazit',
    fassade: 'Rauputz',        // nur bei Wandmontage
    /* Voreinstellung 0: Mit Vorsprung kommt ein Statikträger dazu (siehe
       bauenTerrasseGeschaetzt). Bei 300 mm bekam damit JEDES Terrassendach
       einen Träger, auch das kleinste. Angabe des Betreibers am
       11.10.2026: Voreinstellung 0 – der Vorsprung ist eine Option, nicht
       die Normalausführung. */
    vorsprung: 0,              // Dachvorsprung in mm, nur TDS
    untergrund: 'Tragender Untergrund vorhanden',

    /* Seitliche Erweiterungen – dieselben Möglichkeiten wie im
       Anfrage-Assistenten, je Seite mehrere gleichzeitig. */
    erwLinks: [],
    erwRechts: [],
    erwVorne: [],

    led: false,
    ledset: '8er-Set',
    ledsetzahl: 1,
    sound: false,
    soundset: '2er-Set',
    heizung: false,
    wettersensor: false,
    montage: 'Ja, mit Fachmontage',
    abend: false,

    /* Darstellung und Zubehör */
    boden: 'Steinplatten',
    masseZeigen: false,
    glasOffen: 0,            // Regler: setzt alle drei Seiten auf einmal
    /* Je Seite, damit sich eine Anlage im Bild einzeln öffnen lässt:
       „wie bei den markisen, die jeweilige schiebeanlage die man im
       3dmodell anklickt geht auf oder zu" (Betreiber, 11.10.2026).
       Der Regler bleibt – er setzt beim Ziehen alle drei gleich. */
    offenLinks: 0, offenRechts: 0, offenVorne: 0,
    markise: 'Ohne',         // Beschattung am Dach, Werte wie im Assistenten
    stoff: '',               // Markisenstoff der Dachmarkise, z. B. 'AC420'
    stoffZip: '',            // Stoff der Senkrechtmarkise, z. B. 'T30812-A'
    sonneAus: 85,            // wie weit Markisen ausgefahren sind, in Prozent
    verkRueck: false, verkLinks: false, verkRechts: false,
    verkRichtung: 'waagerecht',
    ralCode: '',
    plankenFarbe: 'Wie das Gestell',
    /* Farben aus den VD-Bestellformularen, siehe SEGEL_FARBEN /
       PLISSEE_STOFF. Vorgabe ist je die hellste gängige. */
    segelStoff: 'Perlmutt',
    segelArt: 'Ohne Verstärkung',
    /* Die Befestigungsart fragt das Bestellformular ab, der Kunde aber
       nicht: Das Segel hängt an UNSEREM Terrassendach, und das ist aus
       Aluminium. „diese frage kann weg es is intern" (Betreiber,
       11.10.2026). Der Wert steht fest und geht trotzdem in die Anfrage,
       damit VD ihn nicht erfragen muss. */
    segelMontage: 'Aluminium oder Stahl',
    segelStange: true,
    plisseeStoff: 'Hellgrau',
    plisseeGestell: 'Alu',
    plisseeStab: 'Schwarz',
    plankenFuge: 10,         // Luft zwischen zwei Planken in mm, 0 = bündig
    plankenAuto: true,       // true = das System rechnet die Fuge aus
    plankenAnteil: 0,        // 0 = volle Höhe, <0 wächst von unten, >0 hängt oben
    plankenHoeheAuto: true   // true = volle Höhe, Regler gesperrt
  };

  var FARBEN = {
    'Anthrazit':      0x383b3d,
    'Weißaluminium':  0xd3d4d2,
    'Graualuminium':  0x9a9c9b,
    'Reinweiß':       0xf1f1ec
  };

  /* ---------- Sonderfarbe nach RAL ----------
     „wenn man das wählt soll in dem freien feld rechts daneben nen feld
     (optionales feld) auftauchen wo man einen anderen RAL code eintragen
     kann, der 3d konfi soll diesen dann berechnen und anzeigen"
     (Betreiber, 11.10.2026).

     Die Zahlen hier sind NÄHERUNGEN. RAL ist in Lab festgelegt, und
     derselbe Ton sieht matt, glänzend oder in Feinstruktur verschieden
     aus; ein Bildschirm kann ihn ohnehin nur annähern. Deshalb steht
     der Vorbehalt auch im Bedienfeld: verbindlich ist der RAL-Fächer,
     nicht das Bild.

     Hinterlegt sind die Töne, die im Metallbau wirklich vorkommen. Eine
     unbekannte Nummer wird NICHT geraten – dann bleibt das Modell
     anthrazit und sagt das auch. Ein falscher Ton wäre schlimmer als
     keiner: Der Kunde bestellt nach dem, was er gesehen hat. */
  /* Nummer -> [Farbwert, Name]. Der Name gehört dazu: „wenn man ein
     code eingetragen hat und der erkannt wurde sollte daneben
     auftauchen wie er heißt z.b bei 9005 Tiefschwarz" (Betreiber,
     11.10.2026). Er zeigt sofort, ob die Nummer die gemeinte ist –
     eine vertippte Ziffer fällt am Namen auf, am Farbfleck nicht. */
  var RAL = {
    '1013': [0xe3d9c6, 'Perlweiß'],
    '1015': [0xe6d2b5, 'Hellelfenbein'],
    '1021': [0xf0ca00, 'Rapsgelb'],
    '2004': [0xe25303, 'Reinorange'],
    '3000': [0xa72920, 'Feuerrot'],
    '3004': [0x6b1c23, 'Purpurrot'],
    '3005': [0x59191f, 'Weinrot'],
    '3020': [0xc1121c, 'Verkehrsrot'],
    '5010': [0x0e294b, 'Enzianblau'],
    '5014': [0x606e8c, 'Taubenblau'],
    '5024': [0x5d9b9b, 'Pastellblau'],
    '6005': [0x0f4336, 'Moosgrün'],
    '6009': [0x27352a, 'Tannengrün'],
    '6011': [0x587246, 'Resedagrün'],
    '6021': [0x89ac76, 'Blassgrün'],
    '7001': [0x8f999f, 'Silbergrau'],
    '7004': [0x969992, 'Signalgrau'],
    '7012': [0x4e5452, 'Basaltgrau'],
    '7015': [0x434b4d, 'Schiefergrau'],
    '7016': [0x383e42, 'Anthrazitgrau'],
    '7021': [0x2f3234, 'Schwarzgrau'],
    '7022': [0x4c4a44, 'Umbragrau'],
    '7024': [0x45494e, 'Graphitgrau'],
    '7030': [0x939388, 'Steingrau'],
    '7031': [0x5d6970, 'Blaugrau'],
    '7035': [0xd7d7d7, 'Lichtgrau'],
    '7036': [0x9c9c9c, 'Platingrau'],
    '7037': [0x7d7f7d, 'Staubgrau'],
    '7038': [0xb5b8b1, 'Achatgrau'],
    '7039': [0x6c6960, 'Quarzgrau'],
    '7040': [0x9da3a6, 'Fenstergrau'],
    '7042': [0x8d948d, 'Verkehrsgrau A'],
    '7043': [0x4e5452, 'Verkehrsgrau B'],
    '7044': [0xc5c7c4, 'Seidengrau'],
    '7045': [0x91969a, 'Telegrau 1'],
    '7046': [0x82898f, 'Telegrau 2'],
    '8014': [0x4a3526, 'Sepiabraun'],
    '8017': [0x442f29, 'Schokoladenbraun'],
    '8019': [0x3d3635, 'Graubraun'],
    '8022': [0x1a1718, 'Schwarzbraun'],
    '9001': [0xe9e0d2, 'Cremeweiß'],
    '9002': [0xd7d5c9, 'Grauweiß'],
    '9003': [0xf4f4f4, 'Signalweiß'],
    '9004': [0x282828, 'Signalschwarz'],
    '9005': [0x0a0a0a, 'Tiefschwarz'],
    '9006': [0xa5a5a5, 'Weißaluminium'],
    '9007': [0x8f8f8c, 'Graualuminium'],
    '9010': [0xf1f0ea, 'Reinweiß'],
    '9011': [0x1c1c1c, 'Graphitschwarz'],
    '9016': [0xf1f1f1, 'Verkehrsweiß'],
    '9017': [0x1e1e1e, 'Verkehrsschwarz'],
    '9018': [0xcfd3cd, 'Papyrusweiß'],
    '9023': [0x787b7a, 'Perldunkelgrau']
  };

  /* Aus „RAL 7016", „ral7016" oder „7016" die Nummer herausziehen. */
  function ralNummer() {
    var m = String(Z.ralCode || '').match(/(\d{4})/);
    return m ? m[1] : '';
  }

  /* Die Farbe des Gestells – eine Stelle für alle Bauteile. Ohne
     Sonderwunsch die gewählte Farbe, mit Sonderwunsch der RAL-Ton,
     falls er hinterlegt ist. */
  function gestellFarbe() {
    if (Z.farbe === 'Andere / Beratung') {
      var n = ralNummer();
      if (RAL[n]) return RAL[n][0];
    }
    return FARBEN[Z.farbe] || FARBEN['Anthrazit'];
  }

  /* ---------- Plankenwand ----------
     Rechteckprofil 25 x 70: nach der Herstellerzeichnung 70,4 mm breit
     und 25,3 mm hoch (BELEGT, Betreiber 11.10.2026). Waagerecht verbaut
     zeigt es die 70,4 mm als sichtbare Plankenhöhe; 25,3 mm ist die
     Dicke. Dazu der Winkel 40 x 20, der an den Pfosten geschraubt wird –
     an ihm hängen die Planken (BELEGT in den Schenkellängen).

     GESCHÄTZT bleiben zwei Dinge, beide als Rückfrage notiert:
     die Materialstärke des Winkels (hier 2 mm) und die Fugenbreite.
     Die Fuge ist allerdings kein fester Wert mehr, siehe planken(). */
  var PLANKE = { hoehe: 7.04, dicke: 2.53 };
  var FUGE_MAX = 60;       // mm; darüber ist es kein Sichtschutz mehr
  /* Zielwert, auf den die automatische Teilung zugeht. 10 mm ist der
     Wert, mit dem Alu-Plankenwände üblicherweise gesetzt werden –
     GESCHÄTZT, als Rückfrage notiert. Die tatsächliche Fuge weicht
     davon ab, weil die Wand oben und unten bündig schließen soll. */
  var FUGE_AUTO = 10;
  /* Was im Modell wirklich gebaut wurde – das Bedienfeld liest es
     zurück, statt dieselbe Rechnung ein zweites Mal zu machen.
     Zweiter Weg zum selben Ergebnis, wie bei den Schiebeanlagen. */
  var PLANKEN_IST = { anzahl: 0, gesamt: 0, fuge: 0, hoehe: 0, lage: 'voll',
                      felder: 1, feldLaenge: 0 };
  var WINKEL = { lang: 4.0, kurz: 2.0, staerke: 0.2 };
  /* Längstes lieferbares Plankenmaß: 7 m (Betreiber, 11.10.2026).
     Darüber wird gleichmäßig geteilt, an der Stoßstelle steht ein
     Zwischenprofil. Dessen Breite ist GESCHÄTZT – 40 mm, wie der
     Schenkel des Winkels, damit es im Bild zusammenpasst. */
  /* ---------- Velaris ----------
     Quelle: VD-Bestellformular Velaris (Betreiber, 11.10.2026) und die
     Produktbilder. Ein Rahmen aus Aluminium mit WAAGERECHTEN, kippbaren
     Lamellen, oben ein überstehendes Kopfprofil. Das Modell zeigte
     vorher senkrechte Lamellen ohne Rahmen – in der Hauptachse falsch.

     BELEGT aus dem Formular:
     - Element mindestens 500 mm, höchstens 1500 mm breit
     - Anlage höchstens 7000 mm breit
     - feststehend 1 bis 5 Elemente
     - verschiebbar: 1 Schiene/1 Element, 1/2, 2 Schienen/2, 2/3, 2/4, 3/3
     - Lamellenfarbe NUR Anthrazit RAL 7016 oder Holzoptik Golden OAK
     - Rahmenfarbe in den vier bekannten RAL-Tönen
     - Bautiefen je Schienenzahl (Querschnitte im Formular):
         1 Schiene  oben 61,3 mm   unten 51,2 mm
         2 Schienen oben 112,6 mm  unten 102,5 mm
         3 Schienen oben 163,9 mm  unten 153,8 mm

     GESCHÄTZT bleibt die Ansichtshöhe einer Lamelle (70 mm) und die
     Ansichtsbreite der Rahmenprofile (45 mm) – beides steht im Formular
     nicht und ist an den Bildern abgegriffen. Rückfrage notiert. */
  var VELARIS = {
    elMin: 500, elMax: 1500, anlageMax: 7000,   // mm, BELEGT
    festMax: 5, schiebbarMax: 4,                // Elemente, BELEGT
    tiefeOben: { 1: 6.13, 2: 11.26, 3: 16.39 }, // cm, BELEGT
    tiefeUnten: { 1: 5.12, 2: 10.25, 3: 15.38 },// cm, BELEGT
    /* Achsabstand zweier Schienen – nachgerechnet aus den belegten
       Bautiefen, nicht geraten: (112,6 − 61,3) = 51,3 mm, und
       (163,9 − 112,6) = 51,3 mm. Beide Male derselbe Wert, das stützt
       die Rechnung. */
    schienenAbstand: 5.13,
    /* Die Elemente HÄNGEN im Kopfprofil – in der Querschnittzeichnung
       sitzt über jedem Element ein kurzer Träger, darunter beginnt erst
       der Rahmen. Deshalb ein sichtbarer Spalt oben; auf den
       Produktbildern ist das der dunkle Streifen unter dem Kopfprofil.
       Höhe GESCHÄTZT. */
    aufhaengung: 3.0,
    /* Die Bodenschiene ist nur FÜHRUNG, nicht Auflager: In der
       Zeichnung steht das Element nicht darauf, sondern läuft darin.
       Sie ist flach. Höhe GESCHÄTZT. */
    bodenSchiene: 1.0,
    rahmen: 4.5,      // GESCHÄTZT: Ansichtsbreite der Rahmenprofile
    kopf: 6.0,        // GESCHÄTZT: Höhe des Kopfprofils
    lamelle: 7.0,     // GESCHÄTZT: Ansichtshöhe einer Lamelle
    dicke: 1.6,       // GESCHÄTZT
    teilung: 6.0      // Achsabstand, kleiner als die Lamelle: geschlossen
                      // überlappen sie sich (so zeigen es die Bilder)
  };
  /* Oberflächen laut Farbtafel auf vd-alusysteme.de/produkt/velaris:
     die vier RAL-Standardtöne, dazu Echtholzoptik gegen Aufpreis
     (im Bestellformular „Holzoptik Golden OAK" genannt). Der
     Farbwert ist am Musterfeld abgegriffen – GESCHÄTZT.
     ACHTUNG Widerspruch: Das Bestellformular lässt für die
     LAMELLEN nur Anthrazit oder Holzoptik zu, die Farbtafel nennt
     alle vier RAL-Töne. Hier stehen alle fünf zur Wahl; die Frage
     ist als Rückfrage notiert. */
  var RAHMENW_IST = { senkrecht: 0, waagerecht: 0, teile: 1 };
  var VELARIS_IST = { elemente: 0, breite: 0, schienen: 0, licht: 0 };
  /* ---------- Velaris: bewegliche Teile merken ----------
     Die Animation baute bisher das GANZE Modell neu, 25-mal je
     Sekunde – Dach, Pfosten, Texturen, alles. Daher das Ruckeln.
     Jetzt merkt sich das Modell, welche Lamellen zu welcher Hälfte
     gehören und welche Gruppe welches Element ist; die Animation
     dreht bzw. verschiebt nur noch diese Teile. Gebaut wird erst
     wieder, wenn die Fahrt zu Ende ist. */
  var VELARIS_LAMELLEN = [];     // {mesh, haelfte}
  var VELARIS_FAHRT = null;      // {gruppen, lagenZu, elLaenge, schienen, quer}

  /* Wo steht welches Element bei einem Öffnungsgrad? Element i läuft
     auf Laufweg i % Schienen und wird an dem gebremst, das auf
     SEINEM Weg davor liegt. Dieselbe Rechnung braucht das Modell
     beim Bauen und die Animation beim Fahren – deshalb steht sie
     hier einmal und nicht zweimal. */
  function velarisLagen(links, elLaenge, anzahl, schienen, offen, rk) {
    var lagen = new Array(anzahl), e, frei, nachbar;
    if (rk !== -1) {
      /* Öffnet nach links: Das erste Element bleibt stehen, die übrigen
         fahren darauf zu und werden an dem gebremst, das auf IHREM
         Laufweg davor liegt. */
      for (e = 0; e < anzahl; e++) {
        frei = links + (e + 0.5) * elLaenge - offen * e * elLaenge;
        nachbar = e - schienen;
        if (nachbar >= 0) frei = Math.max(frei, lagen[nachbar] + elLaenge);
        lagen[e] = frei;
      }
      return lagen;
    }
    /* Öffnet nach rechts – dasselbe spiegelbildlich: Das LETZTE Element
       bleibt stehen, gerechnet wird von hinten nach vorn. Gebraucht
       wird das an der Stirnseite mit Zwischenpfosten, wo jedes Feld
       nach außen aufgehen soll. */
    for (e = anzahl - 1; e >= 0; e--) {
      frei = links + (e + 0.5) * elLaenge + offen * (anzahl - 1 - e) * elLaenge;
      nachbar = e + schienen;
      if (nachbar <= anzahl - 1) frei = Math.min(frei, lagen[nachbar] - elLaenge);
      lagen[e] = frei;
    }
    return lagen;
  }

  /* Links/rechts laufen über die Tiefe (z), vorne über die Breite (x). */
  function velarisSchieben(gruppe, quer, weg) {
    if (quer) gruppe.position.z = weg; else gruppe.position.x = weg;
  }
  /* Welche Elementzahlen für ein lichtes Maß überhaupt gehen. Steht
     auf Modulebene, weil Modell UND Bedienfeld dieselbe Antwort
     brauchen – zwei Rechnungen wären zwei Wahrheiten. */
  function velarisMoeglich(mm, art) {
    var liste = [];
    for (var n = 1; n <= VELARIS.festMax; n++) {
      var b = mm / n;
      if (b < VELARIS.elMin || b > VELARIS.elMax) continue;
      /* Verschiebbar: nur anbieten, was sich auch wirklich schieben
         lässt (Betreiber, 11.10.2026). Bei einem Laufweg stehen die
         Elemente aneinander und können nirgendwohin – erst ab zwei
         Laufwegen fährt eines am anderen vorbei. Zwei Laufwege gibt es
         ab drei Elementen, mehr als vier Elemente gibt es verschiebbar
         nicht. Also bleiben drei und vier. */
      if (art === 'verschiebbar' && (n < 3 || n > VELARIS.schiebbarMax)) continue;
      liste.push(n);
    }
    return liste;
  }
  /* LAMELLENFARBE: genau drei, so wie das Formular sie führt – Anthrazit
     RAL 7016, Holzoptik Golden OAK oder eine RAL-Sonderfarbe gegen
     Aufpreis. Die vier RAL-Standardtöne gelten für den RAHMEN.

     ACHTUNG: Der Schlüssel muss WÖRTLICH dem Wert im Auswahlfeld
     entsprechen. Er hieß hier einmal anders als im Feld – dann fällt die
     Holzoptik stillschweigend auf die Rahmenfarbe zurück und am Bild
     ändert sich beim Umstellen nichts. Genau das war am 11.10.2026 zu
     sehen. Eine Prüfung vergleicht jetzt Feld und Code. */
  var VELARIS_FARBEN = { 'Holzoptik Golden OAK': 0x9c6a46 };

  /* ---------- Rahmenwand FR23 / FRF23 ----------
     Quelle: VD-Montageanleitung FR23/FRF23 und die Übersicht der
     Festelemente (Betreiber, 11.10.2026). Es ist KEINE Blechwand,
     sondern ein Aluminiumrahmen mit Glasfüllung – genau das zeigen die
     Zeichnungen: Rahmenprofil, Sprossenprofil, Glasleiste.

     Geteilt wird mit Sprossen. Belegt sind diese Aufteilungen:
       1-teilig ohne Sprosse
       2-teilig mit 1 waagerechter Sprosse
       2-teilig mit 1 senkrechten Sprosse
       3-teilig mit 2 senkrechten
       4-teilig mit 3 senkrechten
       4-teilig mit 1 senkrechten und 1 waagerechten
       6-teilig mit 2 senkrechten und 1 waagerechten
       8-teilig mit 3 senkrechten und 1 waagerechten

     GESCHÄTZT sind alle Profilmaße: Die Anleitung zeigt die Profile,
     bemaßt sie aber nicht. Rückfrage notiert. */
  var RAHMENW = {
    profil: 5.0,     // cm Ansichtsbreite des Rahmenprofils, GESCHÄTZT
    sprosse: 4.0,    // cm Ansichtsbreite des Sprossenprofils, GESCHÄTZT
    tiefe: 5.0,      // cm Bautiefe, GESCHÄTZT
    glas: 0.8,       // cm Glasstärke, GESCHÄTZT
    /* Richtwerte für die automatische Aufteilung. Höchstmaße einer
       Scheibe stehen in keiner Unterlage – diese Werte sind GESCHÄTZT
       und die wichtigste offene Frage an den Hersteller. */
    scheibeBreitMax: 120,
    scheibeHochMax: 160
  };
  /* Die acht belegten Aufteilungen: [senkrechte Sprossen, waagerechte]. */
  var RAHMENW_TEILUNGEN = [
    [0, 0], [0, 1], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1]
  ];

  var PLANKE_MAX = 700;    // cm
  var ZWISCHEN = { breite: 4.0 };

  /* Dekore und RAL-Töne der Planken (Betreiber, 11.10.2026). Die vier
     RAL-Töne sind dieselben wie beim Gestell, deshalb stehen sie unter
     ihren Namen. Die beiden Holzdekore sind nach den Produktbildern
     GESCHÄTZTE Farbwerte – ein Dekorbild des Herstellers haben wir
     nicht, die Maserung fehlt im Modell deshalb. */
  var PLANKEN_FARBEN = {
    'Eiche Mocca':           0x8a5a30,
    'Rovere Pechino – Hell': 0xbe7120
  };
  var PLANKEN_WAHL = ['Wie das Gestell', 'Anthrazit', 'Weißaluminium',
                      'Graualuminium', 'Reinweiß',
                      'Eiche Mocca', 'Rovere Pechino – Hell'];

  /* ---------- Fotorealistische Texturen (CC0) ----------
     Rasen, Bodenbelag und Hauswand waren einfarbige Flaechen bzw. grob
     gezeichnete Canvas-Muster. Der Betreiber am 11.10.2026: „ich haette
     gerne fuer den boden, die hauswand die wiese etc. besser aufloesende
     texturen ... ohne lizenz ... ohne wasserzeichen".

     Quelle: ambientCG.com, Lizenz CC0 1.0 (Public Domain Dedication).
     Keine Namensnennung noetig, keine Wasserzeichen, kommerzielle
     Nutzung erlaubt. Welche Datei aus welchem Material stammt, steht in
     docs/texturen.md.

     Die Dateien liegen IM PROJEKT unter images/textur/ und werden nicht
     von einem fremden Server geladen – kein neuer Drittanbieter, kein
     neuer Eintrag in der Datenschutzerklaerung, keine fremde
     Infrastruktur im Ladepfad.

     Faellt das Laden aus (Datei fehlt, kein WebP, Netz weg), bleibt das
     bisher gezeichnete Canvas-Muster stehen. Genau deshalb ist der
     Canvas-Weg unten NICHT entfernt worden – er ist der Notnagel. */
  var TEXTUR_DATEI = {
    rasen:        'images/textur/rasen.webp',
    steinplatten: 'images/textur/steinplatten.webp',
    holzdielen:   'images/textur/holzdielen.webp',
    putz:         'images/textur/putz.webp',
    klinker:      'images/textur/klinker.webp',
    zufahrt:      'images/textur/zufahrt.webp',
    /* Holzmaserung für die Dekore (Golden OAK, Eiche Mocca,
       Rovere Pechino). Quelle: ambientCG.com Wood049, Lizenz CC0 –
       Eiche, feine WAAGERECHTE Maserung, nahtlos kachelbar.
       Für uns entsättigt und aufgehellt, damit die Dekorfarbe
       darübergelegt werden kann: Die Maserung bringt die Struktur,
       die Farbe kommt aus dem Dekor. Ein Dekorbild des Herstellers
       ist das NICHT – das bleibt Rückfrage. */
    holzmaserung: 'images/textur/holzmaserung.webp'
  };
  /* Kantenlaenge einer Kachel in cm. GESCHAETZT nach Augenmass an der
     Vorlage – davon haengt ab, ob eine Platte wie 40 cm oder wie 2 m
     wirkt. Wer das aendert, aendert den Massstab im Bild. */
  var TEXTUR_KACHEL = {
    rasen: 200, steinplatten: 240, holzdielen: 120,
    putz: 220, klinker: 180, zufahrt: 220, holzmaserung: 120
  };
  var texLader = null, texMaxAniso = 1;
  var FOTO_TEXTUR = {};

  function fotoTextur(name) {
    if (FOTO_TEXTUR[name] !== undefined) return FOTO_TEXTUR[name];
    var pfad = TEXTUR_DATEI[name];
    if (!pfad || !texLader) { FOTO_TEXTUR[name] = false; return false; }
    var eintrag = { map: null, normal: null };
    FOTO_TEXTUR[name] = eintrag;
    texLader.load(pfad, function (t) {
      neuZeichnen();          // Textur kommt verzögert – Bild nachziehen
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.encoding = THREE.sRGBEncoding;      // Farbbild, kein Datenbild
      t.anisotropy = texMaxAniso;           // sonst matscht der flache Boden
      eintrag.map = t;
      if (name === 'holzmaserung') maserungNachtragen();
      /* Ohne diesen Anstoss erschiene die Textur erst, wenn jemand das
         naechste Mal etwas umstellt – stimmung() laeuft nur bei
         Aenderungen, der Zeichen-Takt dagegen staendig. */
      stimmung();
    }, undefined, function () { FOTO_TEXTUR[name] = false; });
    texLader.load(pfad.replace('.webp', '-normal.webp'), function (t) {
      neuZeichnen();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = texMaxAniso;           // Normalmap bleibt linear
      eintrag.normal = t;
      stimmung();
    }, undefined, function () { /* ohne Normalmap wirkt es nur flacher */ });
    return eintrag;
  }

  /* Legt Farb- und Normalmap auf ein Material und stellt die Kachelung
     auf die tatsaechliche Flaechengroesse ein. Gibt false zurueck, wenn
     das Foto (noch) nicht da ist – dann greift der Canvas-Notnagel. */
  /* ---------- Holzmaserung auf ein Bauteil legen ----------
     Die Maserung liegt als EIN Bild vor und wird je Bauteil anders
     wiederholt – deshalb bekommt jedes Material seine eigene Kopie der
     Textur. Ohne Kopie teilten sich Planke und Lamelle eine
     Wiederholung, und eine von beiden sähe gestaucht aus.

     Die Textur kommt verzögert. Wer vorher fragt, landet in der
     Warteliste und wird beim Eintreffen nachträglich bedient – ein
     Neubau des Modells ist dafür nicht nötig. */
  var MASERUNG_WARTET = [];

  function maserungNachtragen() {
    var liste = MASERUNG_WARTET;
    MASERUNG_WARTET = [];
    liste.forEach(function (a) { maserungAuftragen(a[0], a[1], a[2]); });
    neuZeichnen();
  }

  function maserungAuftragen(material, laengeCm, hoeheCm) {
    var f = fotoTextur('holzmaserung');
    if (!f) return;
    if (!f.map) { MASERUNG_WARTET.push([material, laengeCm, hoeheCm]); return; }
    var k = TEXTUR_KACHEL.holzmaserung;
    /* Seitenverhältnis beibehalten: Die Maserung darf nicht mitwachsen,
       sonst wird sie auf einer langen Planke zu Streifen gezogen. */
    var t = f.map.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(0.05, laengeCm / k), Math.max(0.02, hoeheCm / k));
    t.needsUpdate = true;
    material.map = t;
    if (f.normal) {
      var n = f.normal.clone();
      n.wrapS = n.wrapT = THREE.RepeatWrapping;
      n.repeat.copy(t.repeat);
      n.needsUpdate = true;
      material.normalMap = n;
      if (material.normalScale) material.normalScale.set(0.45, 0.45);
    }
    material.needsUpdate = true;
  }

  function fotoAuftragen(material, name, breiteCm, tiefeCm, abend) {
    var f = fotoTextur(name);
    if (!f || !f.map) return false;
    var k = TEXTUR_KACHEL[name] || 200;
    var wx = Math.max(1, breiteCm / k), wy = Math.max(1, tiefeCm / k);
    f.map.repeat.set(wx, wy);
    material.map = f.map;
    if (f.normal) {
      f.normal.repeat.set(wx, wy);
      material.normalMap = f.normal;
      if (material.normalScale) material.normalScale.set(0.85, 0.85);
    }
    /* Die Textur bringt ihre eigene Farbe mit – multipliziert wird nur
       noch die Stimmung. Weiss bei Tag, gedaempft am Abend. */
    material.color.copy(rgb(abend ? 0x8b9099 : 0xffffff));
    material.needsUpdate = true;
    return true;
  }

  /* ---------- Bodenbelag als gezeichnete Textur ----------
     Eine Fläche in Volltonfarbe sieht aus wie Beton, egal was man wählt.
     Das Muster wird deshalb einmal auf ein Canvas gezeichnet und gekachelt:
     kostet keine Datei, keinen Drittanbieter und keine Ladezeit – und ist
     der einzige Grund, warum im Bild überhaupt zu erkennen ist, ob da
     Platten oder Dielen liegen. */
  var BODEN_TEXTUR = {};
  function bodenTextur(art) {
    if (BODEN_TEXTUR[art]) return BODEN_TEXTUR[art];
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');
    var i;
    if (art === 'Holzdielen') {
      g.fillStyle = '#9b7a52'; g.fillRect(0, 0, 256, 256);
      for (i = 0; i < 8; i++) {
        g.fillStyle = (i % 2) ? '#ab8759' : '#92714b';
        g.fillRect(0, i * 32, 256, 30);
      }
    } else {
      g.fillStyle = '#8e8880'; g.fillRect(0, 0, 256, 256);
      for (i = 0; i < 4; i++) {
        g.fillStyle = (i % 3) ? '#a5a09a' : '#99938c';
        g.fillRect((i % 2) * 128 + 3, Math.floor(i / 2) * 128 + 3, 122, 122);
      }
    }
    var t = new THREE.Texture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;     // gezeichnete Farben sind sRGB
    t.needsUpdate = true;
    BODEN_TEXTUR[art] = t;
    return t;
  }

  /* Hauswand: Rauputz oder Klinker. Die Frage steht so im
     Anfrage-Assistenten – im Modell beantwortet sie sich von selbst, wenn
     man die Wand sieht, an die gebaut wird. */
  var WAND_TEXTUR = {};
  function wandTextur(art) {
    if (art !== 'Verklinkert') return null;          // Putz bleibt glatt
    if (WAND_TEXTUR[art]) return WAND_TEXTUR[art];
    var c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#9d6a52'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = 'rgba(60,35,25,.35)';
    for (var r = 0; r < 4; r++) {
      g.fillRect(0, r * 16 + 14, 128, 2);            // Lagerfuge
      for (var k = 0; k < 4; k++) {
        var x = k * 32 + (r % 2 ? 16 : 0);
        g.fillRect(x % 128, r * 16, 2, 14);          // Stoßfuge
      }
    }
    var t = new THREE.Texture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.needsUpdate = true;
    WAND_TEXTUR[art] = t;
    return t;
  }

  /* Maßbereiche je Produkt: [min, max, Schrittweite, Voreinstellung].
     Ein Carport ist deutlich tiefer als ein Terrassendach (Fahrzeuglänge
     plus Bewegungsraum), dafür niedriger – deshalb eigene Bereiche. */
  var MASSE = {
    'Terrassendach TDS': {
      breite: [2500, 7000, 100, 5000],
      tiefe:  [2000, 4500, 100, 3000],
      hoehe:  [2000, 2700,  50, 2300]
    },
    'Flachdach SkyView': {
      breite: [2500, 7000, 100, 5000],
      tiefe:  [2000, 4500, 100, 3000],
      hoehe:  [2000, 2700,  50, 2400]
    },
    'Carport': {
      breite: [2700, 6500, 100, 3200],
      tiefe:  [4500, 8000, 100, 5500],
      hoehe:  [2000, 2600,  50, 2200]
    },
    /* GESCHÄTZT bis auf die Obergrenze: „Bis 7 × 4,5 m" steht als
       Produktangabe zu SunPro im Anfrage-Assistenten. Eine Preismatrix für
       Lamellendächer liegt nicht vor. */
    'Pergola / Lamellendach': {
      breite: [2500, 7000, 100, 4000],
      tiefe:  [2000, 4500, 100, 3500],
      hoehe:  [2200, 2800,  50, 2500]
    }
  };

  /* Ausführungen je Carport-Typ – wörtlich wie im Anfrage-Assistenten */
  var CP_VARIANTEN = {
    'Carport TDS': [
      ['Freistehender Carport', 'Freistehend'],
      ['Carport mit Wandmontage', 'An der Hauswand'],
      ['Carport mit Überstand', 'Mit Dachüberstand']
    ],
    'Flachdach Flat Line': [
      ['Flat Line', 'Reines Flachdach'],
      ['Flat Line mit Nebenraum', 'Mit Abstellraum']
    ],
    'Flachdach Flat Box': [
      ['Flat Box – Seiten & Hinterwand verkleidet', 'Teilverkleidet'],
      ['Flat Box – rundum verkleidet mit Garagentor', 'Mit Garagentor'],
      ['Flat Box – mit Nebenraum', 'Mit Abstellraum']
    ]
  };

  /* ---------- Eindeckungen ----------
     BELEGT (daten/technische-daten.md, Abschnitt Profile; Artikelliste
     daten/profile-und-eindeckung.csv, Art. 6077/6025/6126/6127):
     Polycarbonat ist eine SECHSFACHSTEGPLATTE 16 mm in vier Ausführungen –
     klar, opal, graphit, bronce. Die Artikelliste schreibt „Bronce", im
     Sprachgebrauch heißt es Bronze; sichtbar steht hier Bronze.

     Vorher gab es im Konfigurator nur „Polycarbonat" – und das sah im
     Modell aus wie Glas. Beanstandet vom Betreiber, 10.10.2026.

     lichtRest ist der Anteil Licht, der NICHT durchkommt, also die
     Deckkraft im Modell. Grundlage sind die Lichtdurchlässigkeiten aus
     Händler-Datenblättern (klar ca. 76 %, opal ca. 48 %, bronze ca. 35 %).
     Für GRAPHIT war nichts zu finden – der Wert ist GESCHÄTZT und steht als
     Rückfrage in daten/rueckfragen-an-vd.md. */
  var EINDECKUNGEN = {
    'VSG klar':             { art: 'glas', farbe: 0xd8ecf2, deckkraft: 0.34, rauheit: 0.04 },
    'VSG opal':             { art: 'glas', farbe: 0xeff3f5, deckkraft: 0.72, rauheit: 0.35 },
    /* Getöntes VSG, „graphit" – vom Betreiber nachgereicht (11.10.2026):
       „gls gibts auch in getönt also graphit". Farbe und Deckkraft sind
       GESCHÄTZT, angelehnt an das graphitfarbene Polycarbonat, aber
       klarer (Glas streut nicht). Ein Lichtwert liegt nicht vor. */
    'VSG graphit':          { art: 'glas', farbe: 0x5b6165, deckkraft: 0.78, rauheit: 0.06 },
    'Polycarbonat klar':    { art: 'steg', farbe: 0xdfe9ea, deckkraft: 0.42, rauheit: 0.3 },
    'Polycarbonat opal':    { art: 'steg', farbe: 0xeef0ec, deckkraft: 0.84, rauheit: 0.55 },
    'Polycarbonat graphit': { art: 'steg', farbe: 0x4e5356, deckkraft: 0.9,  rauheit: 0.42 },
    'Polycarbonat bronze':  { art: 'steg', farbe: 0x8d6a3f, deckkraft: 0.82, rauheit: 0.38 }
  };

  function istPolycarbonat() { return Z.eindeckung.indexOf('Polycarbonat') === 0; }

  /* ---------- Seitliche Erweiterungen ----------
     Dieselben sechs Möglichkeiten und dieselben Regeln wie im
     Anfrage-Assistenten (js/anfrage-wizard.js, ERW_OPTS). Zwei Listen an
     zwei Stellen sind eine Gefahr – deshalb prüft
     scripts/pruefe-konfigurator.js, dass sie übereinstimmen.

     Die Regeln stammen aus dem Assistenten:
     · Velaris, Senkrechtmarkise und Schiebetür brauchen den Keil und
       sperren ihn (nur wo es ein Außengefälle gibt, also bei TDS).
     · Velaris verträgt sich nicht mit Senkrechtmarkise, Schiebetür und
       Rahmenwand.
     · An der Stirnseite (vorne) gibt es keinen Keil. */
  var ERW_OPTS = ['Keil', 'Rahmenwand', 'Schiebetür', 'Plankenwand',
                  'Senkrechtmarkise', 'Velaris'];
  var ERW_BRAUCHT_KEIL = ['Velaris', 'Senkrechtmarkise', 'Schiebetür'];
  var ERW_UNVERTRAEGLICH = {
    'Velaris':          ['Senkrechtmarkise', 'Schiebetür', 'Rahmenwand'],
    'Senkrechtmarkise': ['Velaris'],
    'Schiebetür':       ['Velaris'],
    'Rahmenwand':       ['Velaris']
  };

  /* Keil gleicht das Außengefälle aus – nur dort nötig, wo es eines gibt.
     SkyView und Pergola haben innenliegendes bzw. gar kein Gefälle. */
  function keilErlaubt() {
    if (Z.produkt === 'Terrassendach TDS') return true;
    if (Z.produkt === 'Carport' && Z.cpTyp === 'Carport TDS') return true;
    return false;
  }
  function erwIrgendwo(wert) {
    return Z.erwLinks.indexOf(wert) > -1 || Z.erwRechts.indexOf(wert) > -1 ||
           Z.erwVorne.indexOf(wert) > -1;
  }
  function erwListe(seite) {
    return seite === 'links' ? Z.erwLinks : (seite === 'rechts' ? Z.erwRechts : Z.erwVorne);
  }
  function erwMoeglich(seite) {
    return (seite === 'vorne' || !keilErlaubt())
      ? ERW_OPTS.filter(function (o) { return o !== 'Keil'; })
      : ERW_OPTS;
  }
  // Welche bereits gewählte Option blockiert diese hier? sonst null
  function erwBlocker(wert, liste) {
    for (var i = 0; i < liste.length; i++) {
      var g = liste[i];
      if ((ERW_UNVERTRAEGLICH[wert] || []).indexOf(g) > -1) return g;
      if ((ERW_UNVERTRAEGLICH[g] || []).indexOf(wert) > -1) return g;
    }
    return null;
  }
  function erwKeilGesperrt(seite, liste) {
    if (seite === 'vorne' || !keilErlaubt()) return false;
    for (var i = 0; i < ERW_BRAUCHT_KEIL.length; i++) {
      if (liste.indexOf(ERW_BRAUCHT_KEIL[i]) > -1) return true;
    }
    return false;
  }
  /* Umschalten mit denselben Folgen wie im Assistenten: keilpflichtige
     Auswahl zieht den Keil mit, und ohne sie fällt er wieder weg. */
  function erwUmschalten(seite, wert) {
    var liste = erwListe(seite);
    var drin = liste.indexOf(wert);
    if (drin > -1) {
      if (wert === 'Keil' && erwKeilGesperrt(seite, liste)) return;   // gesperrt
      liste.splice(drin, 1);
    } else {
      if (erwBlocker(wert, liste)) return;
      liste.push(wert);
      if (seite !== 'vorne' && keilErlaubt() &&
          ERW_BRAUCHT_KEIL.indexOf(wert) > -1 && liste.indexOf('Keil') === -1) {
        liste.push('Keil');
      }
    }
    /* Reihenfolge wie im Anfrage-Assistenten (dort sortiert erwToggle nach
       erwIndex). Ohne das stünde in der Anfrage „Schiebetür, Keil“, im
       Assistenten aber „Keil, Schiebetür“ – dieselbe Auswahl in zwei
       Schreibweisen, und niemand wüsste, welche stimmt. */
    liste.sort(function (a, b) { return ERW_OPTS.indexOf(a) - ERW_OPTS.indexOf(b); });
  }

  /* Beim Produktwechsel fällt weg, was es beim neuen Produkt nicht gibt.
     Der Assistent löscht beim Produktwechsel die ganze Konfiguration
     (resetConfig); hier genügt es, das Unmögliche zu entfernen, weil das
     Modell sichtbar stehen bleibt und ein kompletter Reset den Besucher
     seine Maße kosten würde.

     Ohne diese Reinigung überlebte ein auf dem Terrassendach TDS gewählter
     Keil den Wechsel zum Flachdach SkyView: dort gibt es kein
     Außengefälle, der Assistent kennt die Möglichkeit gar nicht – und im
     Modell stand ein Dreieck, das niemand bestellt hatte. */
  function erwAufraeumen() {
    ['links', 'rechts', 'vorne'].forEach(function (seite) {
      var liste = erwListe(seite);
      var moeglich = erwMoeglich(seite);
      for (var i = liste.length - 1; i >= 0; i--) {
        if (moeglich.indexOf(liste[i]) === -1) liste.splice(i, 1);
      }
    });
  }

  /* Übersetzung in die Auswahlwerte des Anfrage-Assistenten.
     Die Eindeckung heißt dort ausführlicher ("VSG-Glas Opal (milchig)").
     Vorher ging nur "VSG-Glas" hinüber – die Unterscheidung klar/opal
     ging damit auf dem Weg in die Anfrage verloren. */
  var VORGABE_VERGLASUNG = {
    'VSG klar':             'VSG-Glas klar',
    'VSG opal':             'VSG-Glas Opal (milchig)',
    /* GEGENZULESEN: Ob der Anfrage-Assistent diese Option schon kennt, ist
       offen – getöntes Glas kam erst am 11.10.2026 dazu. Kennt er sie
       nicht, bleibt das Feld dort leer und die Angabe steht nur im
       Freitext der Anfrage. */
    'VSG graphit':          'VSG-Glas Graphit (getönt)',
    'Polycarbonat klar':    'Polycarbonat klar',
    'Polycarbonat opal':    'Polycarbonat Opal (milchig)',
    'Polycarbonat graphit': 'Polycarbonat Graphit',
    'Polycarbonat bronze':  'Polycarbonat Bronze'
  };
  var VORGABE_LED = {
    ja:   'Ja, mit LED-Spots',
    nein: 'Nein, ohne Beleuchtung'
  };
  /* Die Farben führen im Assistenten die RAL-Nummer mit. Ohne Übersetzung
     war im Assistenten keine Farbe markiert, obwohl eine gewählt war. */
  var VORGABE_FARBE = {
    'Anthrazit':     'Anthrazit (RAL 7016)',
    'Weißaluminium': 'Weißaluminium (RAL 9006)',
    'Graualuminium': 'Graualuminium (RAL 9007)',
    'Reinweiß':      'Reinweiß (RAL 9010)',
    /* „Andere / Beratung" ist im Assistenten eine echte Auswahl – wer eine
       Sonderfarbe will, soll das hier sagen können. Im Modell wird dann
       Anthrazit gezeigt (FARBEN kennt den Wert nicht und fällt zurück). */
    'Andere / Beratung': 'Andere / Beratung'
  };
  /* Beim Lamellendach heißt dieselbe RAL-Nummer 9010 im Assistenten
     „Creme-Weiß", und Weißaluminium gibt es dort nicht. Das ist kein
     Schreibfehler, sondern das VD-Standardtrio für Lamellendächer. */
  var VORGABE_FARBE_PERGOLA = { 'Reinweiß': 'Creme-Weiß (RAL 9010)' };
  var FARBEN_PERGOLA = ['Anthrazit', 'Graualuminium', 'Reinweiß', 'Andere / Beratung'];

  /* Beim Lamellendach heißt die Beleuchtung im Assistenten anders als beim
     Terrassendach – dort „LED-Spots", hier allgemein „Beleuchtung". */
  var VORGABE_LED_PERGOLA = { ja: 'Ja, mit Beleuchtung', nein: 'Nein, ohne Beleuchtung' };

  var SPARREN_ABSTAND = 110; // Richtwert, nur für die geschätzten Carports

  /* ---------- Maßtabelle: echte Zahlen ohne Serverantwort ----------
     Die Daten stehen in js/masstabelle.js – dort auch, woher sie kommen
     und warum sie öffentlich sein dürfen.

     Reihenfolge der Quellen:
       1. /api/bauteile – die vollständige Herstellermatrix, sobald der
          KV-Namensraum DACHMATRIX gebunden ist
       2. DIESE TABELLE – deckt Terrassendach TDS, Flachdach SkyView und
          Flat Line vollständig ab
       3. sparrenGeschaetzt() – nur noch Notnagel für alles andere
          (Pergola) und für Breiten außerhalb der Tabelle

     Die Tabelle wurde über alle 1316 Datensätze gegen die Herstellermatrix
     gerechnet: 1316 von 1316 Sparrenzahlen gleich.

     BREITE ZWISCHEN ZWEI TABELLENWERTEN: Es wird auf die nächste
     LIEFERBARE Breite nach oben gegangen – so wird auch bestellt. Ein
     Dach mit 5,80 m bekommt die Sparren der 6-m-Breite, nicht die der
     5,50-m-Breite; zu wenige Sparren wären der teurere Irrtum. */
  function tabelleGruppe() {
    var M = window.BV_MASSTABELLE;
    if (!M || !M.systeme) return null;
    var mat = istPolycarbonat() ? 'Polycarbonat' : 'Glas';
    var k = null;
    /* Carport TDS rechnet mit derselben Tabelle wie das Terrassendach –
       es ist dasselbe System. */
    if (Z.produkt === 'Terrassendach TDS' || istCarportTds()) k = 'TDS|' + mat;
    else if (Z.produkt === 'Flachdach SkyView') k = 'SkyView|' + mat;
    else if (Z.produkt === 'Carport' && Z.cpTyp === 'Flachdach Flat Line') {
      k = 'Flat_Line|Trapezblech';
    }
    return k ? (M.systeme[k] || null) : null;
  }

  /* ---------- Pfostenzahl unter einem Statikträger ----------
     Vorgabe des Betreibers (11.10.2026): „unter einem statikträger gilt
     nicht mehr die 4000mm regel mit 3, 4, 5 pfosten etc, sondern da
     greift die 7000mm regel also alle 7000mm 3,4,5 pfosten".

     Ohne Träger kommen die Stützfüße aus der Maßtabelle; dort springt
     die Zahl bei 4500, 8080 und 10080 mm – also grob alle 4 m. Trägt ein
     Statikträger die Last über die volle Breite, braucht es weniger
     Pfosten: erst alle 7 m einen mehr.

     Das ist die Breitenregel. Die TIEFENregel („ab 4500 mm ein dritter,
     mit Unterzug erst ab 7000 mm") steckt getrennt davon in
     tabelleBauteile() und bleibt unberührt.

     Gilt für alles, was einen Träger hat: Tiefe über 4500 mm,
     Dachvorsprung oder freistehend. */
  function pfostenUnterTraeger(breiteMm) {
    return 2 + Math.floor((breiteMm - 1) / 7000);
  }

  /* Liefert { sparren, pfosten, unterzug, lieferbar } oder null. */
  function tabelleBauteile(breiteMm, tiefeMm) {
    var g = tabelleGruppe();
    if (!g) return null;
    var M = window.BV_MASSTABELLE;
    var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
    if (!bs.length) return null;
    var treffer = null, i;
    for (i = 0; i < bs.length; i++) {
      if (bs[i] >= breiteMm) { treffer = bs[i]; break; }
    }
    if (treffer === null) treffer = bs[bs.length - 1];   // breiter als die Tabelle
    var e = g.breiten[treffer];
    var grenze = tiefeMm > M.regeln.tiefeMaxOhneUnterzug
      ? M.regeln.tiefeMaxMitUnterzug : M.regeln.tiefeMaxOhneUnterzug;
    return {
      sparren: e[0],
      pfosten: e[1] + (tiefeMm > grenze ? 1 : 0),
      unterzug: tiefeMm > M.regeln.tiefeMaxOhneUnterzug,
      lieferbar: tiefeMm <= M.regeln.tiefeMaxLieferbar,
      breiteTabelle: treffer
    };
  }

  /* ---------- Sparrenzahl, wenn die Herstellermatrix fehlt ----------
     Vorher stand hier „Breite / 110 cm". Bei 6 m Breite kamen damit
     6 Sparren heraus, also 120 cm Achsabstand – weit außerhalb dessen,
     was mit VSG 8 mm überhaupt geht. Vom Betreiber beanstandet: „bei vsg
     glas 8mm, wären es bei breite 6000mm und tiefe 3000mm, 3pfoten und
     9 sparren".

     BELEGT (daten/technische-daten.md, Abschnitt 3): Der Achsabstand
     liegt bei **VSG 8 mm zwischen 680 und 770 mm** (max. Scheibenbreite
     720 mm) und bei **Polycarbonat zwischen 1016 und 1080 mm**
     (Stegplattenbreite). Daraus folgt die kleinste Sparrenzahl, deren
     Achsabstand das Höchstmaß nicht reißt.

     GEGENGERECHNET an der Beispieltabelle „TDS · Glas" derselben Quelle –
     die Regel trifft alle sieben Zeilen:
       1080→3, 1500→3, 2080→4, 2200→4, 3080→5, 3700→6, 4080→7
     und zusätzlich die Angabe des Betreibers: 6000→9 (750 mm Achsabstand).
     scripts/pruefe-konfigurator.js rechnet das jedes Mal nach.

     Das bleibt trotzdem eine SCHÄTZUNG: Die echte Matrix springt
     unregelmäßig (siehe Kopf von js/bauteile.js). Sobald DACHMATRIX
     gebunden ist, liefert /api/bauteile die verbindlichen Zahlen und
     diese Funktion wird nicht mehr aufgerufen. */
  var FELD_MAX = { glas: 77, poly: 108 };    // cm, BELEGT (Obergrenze)

  function sparrenGeschaetzt(B) {
    var max = istPolycarbonat() ? FELD_MAX.poly : FELD_MAX.glas;
    return Math.max(3, Math.ceil(B / max) + 1);
  }

  /* Welches Produkt steht in welcher Preisliste? Was hier null liefert, hat
     keine Herstellerdaten und wird geschätzt gebaut. Carport Flat Line läuft
     über die Flat-Line-Matrix – dort ist das System als freistehendes
     Flachdach mit Trapezblech geführt, unabhängig davon, dass der Betrieb es
     als Carport verkauft. */
  function datenSystem() {
    if (!RASTER) return null;        // ohne Serverantwort: geschätzte Skizze
    var mat = istPolycarbonat() ? 'Polycarbonat' : 'Glas';
    var d = null;
    if (Z.produkt === 'Terrassendach TDS') d = { system: 'TDS', material: mat };
    else if (Z.produkt === 'Flachdach SkyView') d = { system: 'SkyView', material: mat };
    else if (Z.produkt === 'Carport' && Z.cpTyp === 'Flachdach Flat Line') {
      d = { system: 'Flat Line', material: 'Trapezblech' };
    }
    if (!d || !RASTER[d.system + '|' + d.material]) return null;
    return d;
  }

  /* ---------- Stückliste: der Server rechnet ----------
     Die Sparren- und Stützfußmatrix des Herstellers bleibt auf dem Server.
     Der Browser schickt ein Maß an /api/bauteile und bekommt genau eine
     Stückliste zurück – nie die Tabelle. Das ist keine Vorsichtsmaßnahme
     aus Bequemlichkeit: An der Matrix besteht ein Datenbankherstellerrecht,
     und die Quelle erlaubt ausdrücklich nur, Ergebnisse zu zeigen.

     Antwortet der Server nicht, bleibt der Konfigurator benutzbar – dann
     zeigt er die geschätzte Skizze statt falscher Zahlen. */
  var RASTER = null;          // welche Maße es gibt, einmal beim Laden geholt
  var LETZTE = null;          // zuletzt geholte Stückliste
  var LETZTER_SCHLUESSEL = null;
  var laufendeNr = 0;

  function stueckliste() { return LETZTE; }

  function anfrageSchluessel(d) {
    return [d.system, d.material, Z.breite, Z.tiefe,
            Z.aufbau === 'Freistehend' ? 1 : 0].join('|');
  }

  function rasterHolen(fertig) {
    fetch('/api/bauteile?raster=1', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { RASTER = (j && j.raster) ? j.raster : null; fertig(); })
      .catch(function () { RASTER = null; fertig(); });
  }

  function stuecklisteHolen(fertig) {
    var d = datenSystem();
    if (!d) { LETZTE = null; LETZTER_SCHLUESSEL = null; fertig(); return; }
    var schl = anfrageSchluessel(d);
    if (schl === LETZTER_SCHLUESSEL && LETZTE) { fertig(); return; }
    var nr = ++laufendeNr;
    var frage = '/api/bauteile?system=' + encodeURIComponent(d.system) +
                '&material=' + encodeURIComponent(d.material) +
                '&breite=' + Z.breite + '&tiefe=' + Z.tiefe +
                (Z.aufbau === 'Freistehend' ? '&freistehend=1' : '');
    fetch(frage, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (nr !== laufendeNr) return;        // überholte Antwort verwerfen
        LETZTE = (j && !j.fehler) ? j : null;
        LETZTER_SCHLUESSEL = LETZTE ? schl : null;
        fertig();
      })
      .catch(function () {
        if (nr !== laufendeNr) return;
        LETZTE = null; LETZTER_SCHLUESSEL = null; fertig();
      });
  }

  /* ---------- Szene ---------- */
  var renderer = new THREE.WebGLRenderer({
    canvas: leinwand, antialias: true,
    preserveDrawingBuffer: true   // ohne das liefert toDataURL ein leeres Bild
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* Nur neu rechnen, wenn sich etwas geändert hat – siehe bauen(). */
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  // Ohne Tonwertkurve brennen helle Rahmen und Glasflaechen aus
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  texLader = new THREE.TextureLoader();
  texMaxAniso = renderer.capabilities.getMaxAnisotropy();

  var szene = new THREE.Scene();
  var kamera3 = new THREE.PerspectiveCamera(42, 1, 1, 6000);

  var himmel = new THREE.HemisphereLight(0xdfeaf5, 0x8d8268, 0.5);
  szene.add(himmel);
  var sonne = new THREE.DirectionalLight(0xfff1d6, 1.45);
  sonne.position.set(-420, 620, 380);
  sonne.castShadow = true;
  /* 2048 statt 1024: bei 1024 franst der Schatten eines 70 mm breiten
     Sparrens über 5 m Breite sichtbar aus. normalBias verhindert die
     Streifen auf den Profilen (Schattenakne). */
  sonne.shadow.mapSize.set(2048, 2048);
  sonne.shadow.camera.left = -700; sonne.shadow.camera.right = 700;
  sonne.shadow.camera.top = 700;  sonne.shadow.camera.bottom = -700;
  sonne.shadow.camera.far = 2200;
  sonne.shadow.bias = -0.0004;
  sonne.shadow.normalBias = 0.6;
  szene.add(sonne);
  var fuell = new THREE.DirectionalLight(0xdce8f2, 0.3);
  fuell.position.set(400, 300, -300);
  szene.add(fuell);

  /* ---------- Umgebung für Spiegelungen ----------
     Aluminium ohne Umgebung sieht aus wie grauer Kunststoff: Metall lebt
     davon, dass sich etwas darin spiegelt. Statt eine HDRI-Datei von einem
     Fremdserver zu laden (neuer Drittanbieter, neue Ladezeit, neuer Punkt
     in der Datenschutzerklärung), wird hier ein einfacher Verlauf gezeichnet
     – oben Himmel, unten Boden – und daraus eine Umgebung gerechnet. Das
     genügt: man sieht keine Spiegelbilder, sondern den Helligkeitsverlauf
     auf den Kanten, und genau der macht den Unterschied.

     Der Verlauf wird bei Tag und Abend neu gebaut (siehe stimmung). */
  var pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  var umgebungJetzt = null;

  function verlaufsTextur(obenFarbe, mitteFarbe, untenFarbe) {
    var c = document.createElement('canvas');
    c.width = 16; c.height = 256;
    var g = c.getContext('2d');
    var v = g.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, obenFarbe);
    v.addColorStop(0.48, mitteFarbe);
    v.addColorStop(0.52, untenFarbe);
    v.addColorStop(1, untenFarbe);
    g.fillStyle = v;
    g.fillRect(0, 0, 16, 256);
    var t = new THREE.Texture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.needsUpdate = true;
    return t;
  }

  /* Die Umgebung wird NUR beim Wechsel Tag/Abend neu gerechnet.
     stimmung() läuft bei jeder Änderung – also auch bei jedem Pixel, den
     man am Maßregler zieht. Eine PMREM-Berechnung je Reglerschritt würde
     das Bild zum Ruckeln bringen; gerechnet wird deshalb nur, wenn sich
     die Lichtstimmung wirklich geändert hat. */
  var umgebungZustand = null;
  function umgebungSetzen(oben, mitte, unten) {
    var schluessel = oben + mitte + unten;
    if (schluessel === umgebungZustand) return;
    var quelle = verlaufsTextur(oben, mitte, unten);
    var ziel = pmrem.fromEquirectangular(quelle);
    if (umgebungJetzt) umgebungJetzt.dispose();
    umgebungJetzt = ziel.texture;
    szene.environment = umgebungJetzt;
    umgebungZustand = schluessel;
    quelle.dispose();
  }

  /* Boden: angedeutete Terrassen- bzw. Stellfläche auf Rasen */
  var rasen = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: rgb(0x6d7a5c), roughness: 1 })
  );
  rasen.rotation.x = -Math.PI / 2;
  rasen.position.y = -0.6;
  rasen.receiveShadow = true;
  szene.add(rasen);

  var belag = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: rgb(0x8e867a), roughness: 0.85 })
  );
  belag.receiveShadow = true;
  szene.add(belag);

  /* ---------- Wasserzeichen auf dem Terrassenboden ----------
     Wunsch des Betreibers (11.10.2026): „ich hätte gerne auf dem
     terassenboden indirekt aber trz gut sichtbar unser BV AussenSysteme
     Logo mit copyright symbol falls erlaubt quasi als waserzeichen das
     keine andere firma unsern konfigurator ausnutzt".

     RECHTLICHES, kurz: Das ©-Zeichen darf jeder an eigene Werke setzen.
     In Deutschland ist es keine Voraussetzung für den Schutz (der
     entsteht mit dem Werk), aber es ist zulässig und macht die
     Urheberschaft sichtbar. Ein ® wäre etwas ANDERES: Das steht nur
     einer eingetragenen Marke zu; ohne Eintrag ist es irreführend und
     abmahnfähig (§ 5 UWG). Deshalb hier © und kein ®. Ist
     „BV AussenSysteme" als Marke eingetragen, kann das ® dazu – das
     weiß der Betreiber.

     Das Zeichen liegt IN der Szene, nicht als Rahmen um das Bild: So
     ist es auf jedem Bildschirmfoto und in jedem Download mit drauf,
     gleich aus welcher Richtung geschaut wird, und lässt sich nicht
     wegschneiden, ohne das Bild zu zerstören.

     „bei tag logo hell bei abend logo dunkel" (Betreiber) – gemeint
     sind die beiden Logodateien: images/logo-hell.png (dunkle Schrift,
     für den hellen Belag am Tag), images/logo-dunkel.png (weiße
     Schrift, für den dunklen Abend). */
  /* Erste Fassung war zu zurueckhaltend: „das logo bitte einiges
     sichtbarer und größer", dann genauer: „15% sichtbarer" (Betreiber,
     11.10.2026, mit Bild). Gelesen als 15 PROZENTPUNKTE mehr Deckkraft:
     28 % + 15 = 43 %. Dazu zwei Drittel der Breite statt knapp der
     Haelfte und eine hoehere Obergrenze (4,6 statt 3,2 m).
     Feiner stellen heisst: diese eine Zeile aendern. */
  var WZ = { deckkraft: 0.43, anteil: 0.66, hoechstens: 460 };

  var WZ_TEXTUR = {};
  function wasserzeichenTextur(abend) {
    var schl = abend ? 'dunkel' : 'hell';
    if (WZ_TEXTUR[schl]) return WZ_TEXTUR[schl];
    var lw = document.createElement('canvas');
    lw.width = 1024; lw.height = 320;
    var c = lw.getContext('2d');
    var t = new THREE.CanvasTexture(lw);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy
      ? renderer.capabilities.getMaxAnisotropy() : 1;
    WZ_TEXTUR[schl] = t;

    function zeile() {
      c.textAlign = 'center';
      c.fillStyle = abend ? '#ffffff' : '#111111';
      c.font = '600 54px Inter, Arial, sans-serif';
      c.fillText('© ' + new Date().getFullYear() + ' BV AussenSysteme',
                 512, 296);
      t.needsUpdate = true;
      neuZeichnen();
    }

    var bild = new Image();
    bild.onload = function () {
      /* Beide Logodateien sind JPEG-artige PNG OHNE Alphakanal – sie
         haben einen weißen bzw. schwarzen Hintergrund. Als Rechteck auf
         dem Belag sähe das aus wie ein aufgeklebtes Schild. Deshalb
         wird der Hintergrund hier freigestellt: Beim hellen Logo zählt
         die Dunkelheit als Deckung, beim dunklen die Helligkeit.
         Schlägt das fehl (gesperrter Canvas), bleibt die Textzeile –
         lieber ein schlichtes Wasserzeichen als gar keins. */
      var h = document.createElement('canvas');
      h.width = bild.width; h.height = bild.height;
      var hc = h.getContext('2d');
      hc.drawImage(bild, 0, 0);
      try {
        var d = hc.getImageData(0, 0, h.width, h.height), p = d.data, i;
        for (i = 0; i < p.length; i += 4) {
          var dunkel = 255 - Math.min(p[i], p[i + 1], p[i + 2]);
          var hell = Math.max(p[i], p[i + 1], p[i + 2]);
          p[i + 3] = abend ? hell : dunkel;
        }
        hc.putImageData(d, 0, 0);
      } catch (e) { /* ohne Freistellung weiter */ }
      var br = 900, ho = br * bild.height / bild.width;
      c.drawImage(h, (1024 - br) / 2, 40, br, ho);
      zeile();
    };
    bild.onerror = function () {
      c.textAlign = 'center';
      c.fillStyle = abend ? '#ffffff' : '#111111';
      c.font = '700 110px Inter, Arial, sans-serif';
      c.fillText('BV AussenSysteme', 512, 170);
      zeile();
    };
    bild.src = 'images/logo-' + schl + '.png';
    return t;
  }

  var wasserzeichen = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    /* Basic, nicht Standard: Das Zeichen soll am Abend genauso lesbar
       bleiben wie am Tag – es ist eine Kennzeichnung, kein Bauteil.
       depthWrite aus, damit es den Belag nicht aussticht. */
    new THREE.MeshBasicMaterial({ transparent: true, opacity: WZ.deckkraft,
                                  depthWrite: false })
  );
  wasserzeichen.rotation.x = -Math.PI / 2;
  wasserzeichen.renderOrder = 2;
  szene.add(wasserzeichen);

  /* Liegt mittig unter der Überdachung, etwas vor der Mitte – dort ist
     es aus den üblichen Blickrichtungen zu sehen und steht nicht im
     Schatten der Rückwand. Die Größe wächst mit der Anlage, hat aber
     eine Obergrenze: Es soll das Bild kennzeichnen, nicht beherrschen. */
  function wasserzeichenSetzen() {
    var br = Math.min(Z.breite / 10 * WZ.anteil, WZ.hoechstens);
    wasserzeichen.scale.set(br, br * 320 / 1024, 1);
    wasserzeichen.position.set(0, 0.4, Z.tiefe / 10 * 0.55);
    var t = wasserzeichenTextur(!!Z.abend);
    if (wasserzeichen.material.map !== t) {
      wasserzeichen.material.map = t;
      wasserzeichen.material.needsUpdate = true;
    }
  }

  /* Hauswand – nur bei Wandmontage sichtbar */
  var wand = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 24),
    new THREE.MeshStandardMaterial({ color: rgb(0xcfc7b8), roughness: 0.95 })
  );
  wand.castShadow = true; wand.receiveShadow = true;
  szene.add(wand);

  /* ---------- Terrassentür an der Hauswand ----------
     Der Betreiber am 11.10.2026: „vllt. noch so ne terassentür/balkontür
     einfach als bild nix 3d modelieren das macht den ganzen konfigurator
     langsamer". Genau so gebaut: EINE Fläche aus zwei Dreiecken mit einer
     gezeichneten Textur. Eine echte Tür mit Rahmen, zwei Flügeln, Sprossen
     und Griffen wären schnell 60 Flächen – und sie würde nichts erklären,
     was das Bild nicht auch zeigt.

     Maße 180 × 220 cm: gängige zweiflügelige Terrassentür. GESCHÄTZT, es
     geht um den Maßstabsvergleich, nicht um ein Bauteil. */
  function tuerTextur() {
    var c = document.createElement('canvas');
    c.width = 360; c.height = 440;
    var g = c.getContext('2d');
    var rahmen = '#3a3d3f';
    g.clearRect(0, 0, 360, 440);
    g.fillStyle = rahmen; g.fillRect(0, 0, 360, 440);          // Blendrahmen
    [[14, 14], [186, 14]].forEach(function (p) {               // zwei Flügel
      var x = p[0], y = p[1], b = 160, h = 412;
      g.fillStyle = rahmen; g.fillRect(x, y, b, h);
      var gl = g.createLinearGradient(x, y, x + b, y + h);
      gl.addColorStop(0, '#cfe0ec'); gl.addColorStop(0.45, '#9fb6c6');
      gl.addColorStop(0.55, '#b8cedd'); gl.addColorStop(1, '#6d8597');
      g.fillStyle = gl; g.fillRect(x + 12, y + 12, b - 24, h - 24);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + 20, y + h - 30); g.lineTo(x + b - 24, y + 40); g.stroke();
    });
    g.fillStyle = '#d6d8d9';                                   // Griffe
    g.fillRect(168, 210, 7, 56); g.fillRect(185, 210, 7, 56);
    var t = new THREE.Texture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = texMaxAniso;
    t.needsUpdate = true;
    return t;
  }
  var tuer = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 220),
    new THREE.MeshStandardMaterial({
      map: tuerTextur(), roughness: 0.45, metalness: 0.15
    })
  );
  tuer.position.set(0, 111, 0.8);
  tuer.receiveShadow = true;
  szene.add(tuer);

  /* ---------- Blick von hinten durch die Hauswand ----------
     „sobald man so hinter die wand scrollt soll die wand durchsichtig
     werden, man soll aber noch leicht sehen das da ne wand is aber nicht
     zu krass" (Betreiber, 11.10.2026, mit Bildschirmfoto: Die Wand stand
     wie eine weiße Platte vor dem ganzen Dach).

     Die Wand liegt zwischen z = -24 und z = 0, die Anlage davor bei
     positivem z. Steht die Kamera hinter der Wandvorderkante, schaut sie
     also durch die Wand auf das Bauwerk – dann wird die Wand fast
     durchsichtig. „Fast": 18 % bleiben stehen, damit man die Mauer noch
     als Mauer erkennt und nicht meint, die Anlage stehe frei.

     Die Tür gehört zur Wand und verblasst mit, sonst schwebt sie allein
     im Bild. Der Schattenwurf der Wand geht in dieser Lage aus – eine
     durchsichtige Wand, die einen vollen Schatten wirft, sieht aus wie
     ein Fehler. */
  /* Rund 26° unter den Horizont – genug, um unter das Dach zu schauen,
     ohne dass das Bild kippt. */
  var PHI_MAX_UNTEN = Math.PI / 2 + 0.45;

  var WAND_DURCHSICHT = 0.18;
  var wandDurchsichtig = null;            // noch nichts gesetzt

  function wandDurchsicht() {
    /* Vorderkante der Wand: Mitte plus halbe Tiefe. Beides kommt aus dem
       Modell, damit die Grenze mitwandert, wenn die Wand einmal anders
       steht. */
    var vorne = wand.position.z + (wand.geometry.parameters.depth * wand.scale.z) / 2;
    var dahinter = wand.visible && kamera3.position.z < vorne;
    if (dahinter === wandDurchsichtig) return;
    wandDurchsichtig = dahinter;
    [wand.material, tuer.material].forEach(function (m) {
      m.transparent = dahinter;
      m.opacity = dahinter ? WAND_DURCHSICHT : 1;
      m.depthWrite = !dahinter;
      m.needsUpdate = true;
    });
    wand.castShadow = !dahinter;
    renderer.shadowMap.needsUpdate = true;
    neuZeichnen();
  }

  /* ---------- Blick von unten ----------
     Sobald die Kamera unter die Bodenebene fährt, liegt der Belag
     zwischen Auge und Bauwerk – man sähe eine graue Fläche statt der
     Dachunterseite. Für diesen Moment wird der Boden fast durchsichtig;
     kommt die Kamera wieder hoch, ist er sofort wieder da.

     Der Rasen ist eine einseitige Fläche und von unten ohnehin
     unsichtbar; der Belag ist ein Körper und muss ausgeblendet werden.
     Beide werden gleich behandelt, damit es am Rand keinen Bruch gibt. */
  var BODEN_DURCHSICHT = 0.12;
  var bodenDurchsichtig = null;

  function bodenDurchsicht() {
    var drunter = kamera3.position.y < 0;
    if (drunter === bodenDurchsichtig) return;
    bodenDurchsichtig = drunter;
    [rasen.material, belag.material].forEach(function (m) {
      m.transparent = drunter;
      m.opacity = drunter ? BODEN_DURCHSICHT : 1;
      m.depthWrite = !drunter;
      m.needsUpdate = true;
    });
    /* Der Schatten auf dem Boden gehört zum Boden: Ohne ihn auszuschalten
       läge er als dunkler Fleck in der Luft. */
    rasen.receiveShadow = !drunter;
    belag.receiveShadow = !drunter;
    renderer.shadowMap.needsUpdate = true;
    neuZeichnen();
  }

  var bau = new THREE.Group();   // alles, was sich bei Änderungen neu aufbaut
  szene.add(bau);
  var masseGruppe = new THREE.Group();   // Maßbänder, getrennt vom Bauwerk
  szene.add(masseGruppe);

  /* ---------- Werkstoffe ----------
     ACHTUNG Farbraum: Der Renderer gibt in sRGB aus
     (outputEncoding = sRGBEncoding), rechnet intern aber linear. three.js
     r128 wandelt Materialfarben NICHT automatisch um – ein als 0x383b3d
     angegebenes Anthrazit wird als linearer Wert gelesen und kommt im Bild
     als Mittelgrau heraus. Genau das war zu sehen: RAL 7016 sah aus wie
     ein helles Grau.

     Deshalb läuft jede Oberflächenfarbe durch rgb(): einmal von sRGB nach
     linear. Lichtfarben bleiben unverändert – die sind keine Oberflächen. */
  function rgb(hex) {
    return new THREE.Color(hex).convertSRGBToLinear();
  }

  /* ---------- Werkstoffe ---------- */
  /* Pulverbeschichtetes Aluminium: nicht blank, aber auch nicht matt.
     metalness hoch und roughness mittel ergibt zusammen mit der Umgebung
     den typischen weichen Glanz auf den Kanten; vorher war es ohne
     Umgebung ein flaches Grau. envMapIntensity dosiert, wie stark sich der
     Himmel darin zeigt – zu viel und das Profil wirkt verchromt. */
  /* Pulverbeschichtetes Aluminium ist physikalisch LACK, kein blankes
     Metall: eine dünne, farbige Schicht auf dem Profil. Deshalb niedrige
     metalness – sonst spiegelt das Profil den Himmel und Anthrazit wird
     hellgrau (im ersten Versuch genau passiert). Der typische seidige
     Glanz kommt aus dem clearcoat, nicht aus der Metallität. */
  function alu() {
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(gestellFarbe()),
      metalness: 0.1, roughness: 0.52,
      clearcoat: 0.12, clearcoatRoughness: 0.4
    });
    m.envMapIntensity = 0.25;
    return m;
  }

  /* Planken: dasselbe pulverbeschichtete Aluminium, aber in eigener
     Farbe – sie darf vom Gestell abweichen. Holzdekore sind matter als
     eine Pulverbeschichtung, deshalb die höhere Rauheit. */
  function plankeMaterial(laengeCm) {
    var dekor = PLANKEN_FARBEN[Z.plankenFarbe];
    var hex = dekor !== undefined ? dekor
            : FARBEN[Z.plankenFarbe] || gestellFarbe();
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(hex),
      metalness: dekor !== undefined ? 0 : 0.1,
      roughness: dekor !== undefined ? 0.78 : 0.65,
      clearcoat: 0.1, clearcoatRoughness: 0.5
    });
    m.envMapIntensity = dekor !== undefined ? 0.2 : 0.45;
    /* Nur die Holzdekore bekommen eine Maserung – ein RAL-Ton ist
       pulverbeschichtetes Aluminium und hat keine. */
    if (dekor !== undefined) maserungAuftragen(m, laengeCm || 300, PLANKE.hoehe);
    return m;
  }

  /* Verkleidungsbleche sind matter als die tragenden Profile */
  function blech() {
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(gestellFarbe()),
      metalness: 0.1, roughness: 0.65,
      clearcoat: 0.1, clearcoatRoughness: 0.5
    });
    m.envMapIntensity = 0.45;
    return m;
  }

  /* Stegplatten-Textur: feine Längsstreifen.
     Eine Stegplatte ist innen durch Stege unterteilt; von außen sieht man
     deshalb ein regelmäßiges Streifenmuster und keine spiegelnde Fläche.
     Genau daran erkennt man Polycarbonat – und genau das fehlte, weshalb
     es im Modell wie Glas aussah. Der Streifenabstand ist zeichnerisch
     gewählt; der echte Stegabstand einer 16-mm-Sechsfachplatte liegt weit
     unter dem, was in dieser Darstellung sichtbar wäre. */
  var STEG_TEXTUR = null;
  function stegTextur() {
    if (STEG_TEXTUR) return STEG_TEXTUR;
    var c = document.createElement('canvas');
    c.width = 32; c.height = 4;
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 32, 4);
    g.fillStyle = 'rgba(120,130,135,.55)';   // Steg
    g.fillRect(0, 0, 3, 4);
    g.fillStyle = 'rgba(255,255,255,.75)';   // Lichtkante neben dem Steg
    g.fillRect(3, 0, 2, 4);
    var t = new THREE.Texture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 1);
    t.needsUpdate = true;
    STEG_TEXTUR = t;
    return t;
  }

  function dachfuellung() {
    var e = EINDECKUNGEN[Z.eindeckung] || EINDECKUNGEN['VSG klar'];
    var werte = {
      color: rgb(e.farbe),
      transparent: true,
      opacity: e.deckkraft,
      roughness: e.rauheit,
      metalness: 0,
      side: THREE.DoubleSide
    };
    /* Glas bleibt spiegelnd, Polycarbonat nicht: eine Stegplatte wirkt
       matter und zeigt das Stegmuster. */
    if (e.art === 'steg') {
      werte.map = stegTextur();
      werte.clearcoat = 0;
    } else {
      /* Klares Glas ist fast unsichtbar, solange sich nichts darin
         spiegelt – erst der Himmel im Glas macht es im Bild sichtbar. */
      werte.clearcoat = 0.6;
      werte.clearcoatRoughness = 0.05;
    }
    var mat = new THREE.MeshPhysicalMaterial(werte);
    mat.envMapIntensity = e.art === 'steg' ? 0.35 : 1.1;
    return mat;
  }

  /* Trapezblech T35M-0,75 – blickdicht. Rippenabstand und Deckbreite sind
     nicht belegt (offene-punkte.md, Punkt F), deshalb eine glatte Fläche
     statt einer falschen Welle. */
  function trapezblechMaterial() {
    var m = new THREE.MeshStandardMaterial({
      color: rgb(gestellFarbe()),
      metalness: 0.2, roughness: 0.55
    });
    m.envMapIntensity = 0.4;
    return m;
  }

  /* Satinato ist geätztes ESG: Es lässt das Licht durch, aber kein Bild.
     Im Modell heißt das: deutlich weniger durchsichtig, viel rauer und
     keine Spiegelung – sonst sähe es aus wie klares Glas mit Schleier.
     Laut VD-Anfrageformular gibt es für SG23 NUR klar und satinato. */
  function satiniert(m) {
    m.color = rgb(0xe8eef0);
    m.opacity = 0.62;
    m.roughness = 0.55;
    m.clearcoat = 0.1;
    m.clearcoatRoughness = 0.5;
    m.envMapIntensity = 0.35;
    return m;
  }

  function schiebeGlas() {
    var m = seitenglas();
    return Z.sg23Glas.indexOf('satinato') === -1 ? m : satiniert(m);
  }

  /* Das Glas im KEIL – dem Dreieck über einer Wand oder Schiebeanlage.
     „die glasschiebetüren gibts ja in satinato, hab vergessen das glas
     bei den keilen auch" (Betreiber, 11.10.2026).

     Eigene Wahl und nicht an die Schiebeelemente gekoppelt: Der Keil
     sitzt oben, da geht es um Sonne und Einblick von der Seite; unten
     will man oft klare Sicht in den Garten. Beides zusammenzulegen
     hieße, dem Kunden eine Entscheidung abzunehmen, die er so nicht
     treffen würde. */
  function keilGlas() {
    var m = seitenglas();
    return String(Z.keilGlas || '').indexOf('satinato') === -1 ? m : satiniert(m);
  }

  function seitenglas() {
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(0xd8ecf2), transparent: true, opacity: 0.3,
      roughness: 0.04, metalness: 0, side: THREE.DoubleSide,
      clearcoat: 0.6, clearcoatRoughness: 0.05
    });
    m.envMapIntensity = 1.1;
    return m;
  }

  /* ---------- Regenrinne des TDS-Systems ----------
     Maße aus der Querschnittszeichnung des Betreibers (10.10.2026):
     Gesamtbreite 186,3 mm, Gesamthöhe 136,7 mm, innen 130 mm breit und
     82,2 mm tief. Alles in Millimetern; hier wird wie überall in
     Zentimetern gerechnet.

     ZU BESTÄTIGEN: Die Zuordnung der vier Maße ist aus einer kleinen
     Abbildung gelesen. Welche Zahl wofür steht, muss der Betreiber noch
     bestätigen – siehe docs/NEXT_TASK.md. Die Wandstärke 2,5 mm und die
     Rundung der Vorderkante sind GESCHÄTZT.

     Warum ein echtes Profil und kein Kasten: Die Rinne ist das, was man
     von einem Terrassendach als Erstes sieht. Ein glatter Quader sieht
     aus wie ein Balken; erst die offene Rinnenform mit der hochgezogenen
     Vorderkante macht daraus ein Terrassendach. */
  var RINNE = {
    breite: 18.63,     // 186,3 mm, Zeichnung
    hoehe: 13.67,      // 136,7 mm, Zeichnung
    innenBreite: 13.0, // 130 mm, Zeichnung
    innenTiefe: 8.22,  // 82,2 mm, Zeichnung
    /* Wie sich die Differenz 186,3 − 130 = 56,3 mm auf Vorder- und
       Rückwange verteilt, steht nicht in der Zeichnung. Hinten liegen
       Sparren und Eindeckung auf, vorne genügt eine schmale Wange –
       deshalb 36 zu 20 mm. GESCHÄTZT. */
    rueckwand: 3.6,    // GESCHÄTZT
    /* Um so viel liegt die hintere Wange unter der Vorderkante. Dieses
       Gefälle ist der Grund, warum das Wasser in die Kehle läuft. Der
       Wert steht nicht in der Zeichnung – GESCHÄTZT. */
    wangeAb: 3.4,      // GESCHÄTZT
    /* Um so viel liegt die Oberkante des Sparrens – und damit die
       Unterseite der Eindeckung – unter der Nase der Rinne. Daraus
       ergibt sich, dass das Glas ÜBER der Kehle endet und das Wasser
       hineinläuft statt gegen die Rinnenwand zu laufen. Zusammen mit
       wangeAb steht die Scheibe damit 18 mm über der hinteren Wange.
       GESCHÄTZT; vom Betreiber beanstandet, dass die Rinne vorher zu
       hoch stand. */
    sparrenUnterNase: 1.6,   // GESCHÄTZT
    /* Abstand der waagerechten Rillen in der Vorderfläche, GESCHÄTZT
       nach den Werkbildern des Betreibers (11.10.2026). */
    rilleTeilung: 1.5,
    wand: 0.25,        // GESCHÄTZT
    /* Hinten unten geht ein Schenkel GERADE NACH UNTEN, an dem der
       Pfosten verschraubt wird: „siehst du die rinne hat unten links nen
       schenkel der grade nach unten geht und an diesem schenkel wird der
       pfosten verschraubt" (Betreiber, 14.10.2026). In der Zeichnung zu
       16913 ist er zu sehen, aber nicht bemasst. Er haengt UNTER dem
       Profil, also bei negativem y; die bemassten 136,7 mm Hoehe
       bleiben davon unberuehrt.

       Die LAENGE ist seit dem 14.10.2026 nicht mehr geschaetzt, sondern
       ausgerechnet – und zwar aus dem Seitendeckel: Der ist mit 175 mm
       bemasst (Skizze 6017), die Rinne mit 136,7. Die Differenz von
       38,3 mm ist genau der Schenkel, denn der Deckel deckt beides ab,
       von der Nase bis zum Schenkelfuss. Damit loest sich der letzte
       Widerspruch zwischen den beiden Zeichnungen auf: „entweder is der
       seitendeckel rinne zu klein oder die rinne is zu groß oder falsche
       form" (Betreiber) – keines von beidem, es fehlte der Schenkel in
       der Rechnung. Vorher standen hier 40 mm, am Bild abgegriffen.
       Die DICKE bleibt geschaetzt. */
    schenkelDick: 0.7,
    schenkelLang: 3.83,
    /* Die Fase der vorderen Kante, oben wie unten (unten 0,6 davon).
       34 mm sind BELEGT – aus der Skizze zu 6017, denn der Seitendeckel
       deckt genau diese Kante ab und hat dort seine Fase. Der Wert steht
       deshalb HIER und nicht beim Deckel: Das Profil gibt die Form vor,
       der Deckel uebernimmt sie. Andersherum haengt sonst das Bauteil am
       Blech davor. */
    fase: 3.4
  };

  /* Querschnitt der Rinne in der XY-Ebene: x läuft nach vorne (vom Haus
     weg), y nach oben. Gezeichnet wird der volle Umriss, die Rinnenkehle
     ist als Aussparung darin ausgeführt. */
  function rinneQuerschnitt(mitKehle) {
    var B = RINNE.breite, H = RINNE.hoehe;
    var iB = RINNE.innenBreite, iT = RINNE.innenTiefe;
    var hinten = RINNE.rueckwand;
    var hHinten = H - RINNE.wangeAb;      // Oberkante der hinteren Wange
    var f = new THREE.Shape();

    /* Umriss, gegen den Uhrzeigersinn. x = 0 ist die RÜCKSEITE (zum
       Haus), x = B die Vorderkante, y = 0 die Unterkante.

       Drei Dinge, die das Profil ausmachen und vorher fehlten:

       · Die hintere Wange ist NIEDRIGER als die Vorderkante. Nur deshalb
         läuft das Wasser von der Eindeckung in die Kehle und nicht über
         die Nase nach außen. Der Sparren endet ebenfalls auf dieser
         Höhe – vorher lag er bündig mit der Vorderkante, das Dach hätte
         nach außen entwässert.
       · Die Vorderkante läuft oben in einer Nase aus und ist unten
         zurückgesetzt. Das ist das, was man von der Terrasse aus sieht;
         ein durchgehender Quader wirkt dort wie ein Balken.
       · Zwei schmale Schattenfugen in der Vorderfläche. Sie kosten vier
         Linien und nehmen dem Profil optisch die Hälfte der Höhe.

       Die vier Hauptmaße stehen in der Zeichnung des Betreibers. Nase,
       Fase, Fugen und die Aufteilung der Wangen sind GESCHÄTZT. */
    var rU = 0.8, rO = 2.8;
    var faseH = 2.6, faseT = 1.4;         // zurückgesetzter Fuß, GESCHÄTZT
    var fuge = 0.35;                      // Tiefe der Schattenfuge, GESCHÄTZT

    /* Der Schenkel haengt hinten unter dem Profil. Er wird im selben Zug
       gezogen, ist also Teil des Querschnitts und kein eigenes Teil. */
    f.moveTo(0, -RINNE.schenkelLang);
    f.lineTo(RINNE.schenkelDick, -RINNE.schenkelLang);
    f.lineTo(RINNE.schenkelDick, 0);
    /* Untere Vorderecke: dieselbe Fase wie am Deckel (dort fase * 0,6),
       aus demselben Grund wie oben. Vorher eine eigene, flachere Form
       mit zwei Knicken – die stand unten aus der Blende heraus. */
    f.lineTo(B - RINNE.fase, 0);
    f.lineTo(B, RINNE.fase);

    /* ---------- Rillenband in der Vorderfläche ----------
       „hier ein perfekter querschnitt unserer überdachung kannst du es
       so neu modellieren … nicht 100% 1:1 aber ähnlich und einfach"
       (Betreiber, 11.10.2026, mit fünf Werkbildern).

       Auf den Bildern ist die Rinnenfront nicht glatt, sondern fein
       waagerecht gerillt – das ist das Erste, was man von der Terrasse
       aus sieht. Vorher standen hier zwei einzelne Schattenfugen; jetzt
       läuft ein gleichmäßiges Band über die ganze Höhe. Es kostet nur
       Linien im Querschnitt, keine zusätzlichen Teile: Die Rinne wird
       weiter in EINEM Zug gezogen.

       Teilung und Tiefe sind GESCHÄTZT – auf den Bildern ist nichts
       bemaßt. Die vier Hauptmaße des Profils bleiben unangetastet. */
    /* Das Rillenband laeuft zwischen den beiden Fasen – es endet dort,
       wo die Kante abknickt, nicht einen Millimeter darueber. Vorher
       hing die Obergrenze an der alten Rundung (rO) und stand damit
       1 mm ueber der Fase; im Bild schaute die Rinne dort aus der
       Blende heraus. */
    var vonY = RINNE.fase + 1.0, bisY = H - RINNE.fase * 0.6;
    var rillen = Math.max(2, Math.round((bisY - vonY) / RINNE.rilleTeilung));
    var schritt = (bisY - vonY) / rillen;
    for (var k = 0; k < rillen; k++) {
      var y0 = vonY + k * schritt;
      f.lineTo(B, y0 + schritt * 0.30);
      f.lineTo(B - fuge, y0 + schritt * 0.45);
      f.lineTo(B - fuge, y0 + schritt * 0.70);
      f.lineTo(B, y0 + schritt * 0.85);
    }
    f.lineTo(B, bisY);

    /* ---------- Vordere Oberkante: GERADE FASE, keine Rundung ----------
       „die rinnenblende passt auch von der form nicht an die rinne, die
       rinnenblende is richtig aber die rinnenform vorne an der stirnseite
       is falsch" (Betreiber, 14.10.2026).

       Hier stand eine Rundung mit 28 mm Radius. Der Seitendeckel hat an
       derselben Stelle eine GERADE Fase von 34 mm (belegt aus der Skizze
       zu 6017) – die Rundung schaute damit oben aus der Blende heraus.
       Die Zeichnung zu 16913 zeigt dort ebenfalls eine gerade Kante, kein
       Rund. Beide Fasen kommen jetzt aus derselben Quelle: Was am Deckel
       belegt ist, gibt die Form der Rinne vor. */
    f.lineTo(B, H - RINNE.fase * 0.6);
    f.lineTo(B - RINNE.fase * 0.6, H);
    f.lineTo(hinten + iB, H);

    /* Hintere Wange, niedriger – hier liegt die Eindeckung auf */
    f.lineTo(hinten + iB, hHinten);
    f.lineTo(0, hHinten);
    f.closePath();

    /* Die Kehle liegt nicht mittig: hinten bleibt eine breitere Wange
       stehen, auf der Sparren und Eindeckung aufliegen. Nach oben offen,
       deshalb reicht die Aussparung über die Oberkante hinaus. */
    var unten = H - iT;
    var r = 0.9;
    var kehle = new THREE.Path();
    kehle.moveTo(hinten, H + 1);
    kehle.lineTo(hinten, unten + r);
    kehle.quadraticCurveTo(hinten, unten, hinten + r, unten);
    kehle.lineTo(hinten + iB - r, unten);
    kehle.quadraticCurveTo(hinten + iB, unten, hinten + iB, unten + r);
    kehle.lineTo(hinten + iB, H + 1);
    kehle.closePath();
    if (mitKehle !== false) f.holes.push(kehle);
    return f;
  }

  /* Rinne über die volle Breite. laenge = Breite der Anlage in x,
     zVorne = Lage der Vorderkante in der Tiefe. */
  function rinneBauen(laenge, zVorne, yUnten, material) {
    var g = new THREE.ExtrudeGeometry(rinneQuerschnitt(true),
      { depth: laenge, bevelEnabled: false, curveSegments: 6 });
    /* Das Profil entsteht in der XY-Ebene und wird in z gezogen. Gedreht
       liegt es quer: Querschnitt in der ZY-Ebene, Länge in x.

       Die Drehrichtung ist wichtig: Bei +90° zeigt die gerundete
       Vorderkante nach HINTEN, und das Profil landet um seine eigene
       Breite zu weit innen – im Bild stand die Rinne dann hinter den
       Pfosten. Vom Betreiber bemerkt. Mit −90° läuft die Querschnitts-
       breite in +z, die Vorderkante liegt vorne. */
    g.rotateY(-Math.PI / 2);
    g.translate(laenge / 2, yUnten, zVorne - RINNE.breite);
    var m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    bau.add(m);
    return m;
  }

  /* Seitendeckel der Rinne („Seitendeckel Rinne 2 TD beidseitig",
     Teileliste der Montageanleitung S. 6). Teilebild vom Betreiber,
     11.10.2026: eine FLACHE PLATTE mit geraden Kanten und einer
     abgeschrägten Ecke – nicht die Silhouette des Rinnenprofils, wie hier
     ursprünglich gezeichnet war. Maß 172 × 175 mm, BELEGT.

     LAGE: Das Teil ist in der einen Richtung schmaler, in der anderen
     höher als unsere Rinnenöffnung (186,3 × 136,7 mm). Vorgabe des
     Betreibers dazu: „gleich den deckel mittig aus huptsache vorne is
     bündig." Also:
       · vorne BÜNDIG mit der Rinnenvorderkante,
       · in der Höhe MITTIG zur Rinne.
     Hinten bleiben dadurch rund 14 mm der Öffnung frei, oben und unten
     steht der Deckel je rund 19 mm über. Das ist so gewollt und nicht
     übersehen – die Vorderkante ist das, was man sieht.

     Die Schräge liegt an der Vorderkante oben: „die niedrigere seite is
     die vorderseite" (Betreiber). */
  /* 172 x 175 mm und die Fase BELEGT aus der Skizze zu 6017
     („Seitendeckel Rinne 2 TD beidseitig"). Der Fall der Oberkante ist am
     Foto von 6011/6012 ABGESCHAETZT – fuer die gibt es keine bemasste
     Skizze.

     LEHNE UND LAGE stammen aus der Zeichnung des Betreibers vom
     14.10.2026: Er hat in den Rinnenquerschnitt (16913) den Umriss des
     Deckels in Gelb eingezeichnet, dazu Dachsparren, Glas und Pfosten.
     Nachgemessen ist der gelbe Umriss dort 503 x 522 Pixel, die Rinne
     186,3 mm breit bei 540 Pixeln – also rund 169 x 176 mm. Das deckt
     sich mit den 172 x 175 der Skizze und raeumt den Widerspruch aus,
     der hier zwei Tage als „passt nicht zusammen" stand: Der Deckel ist
     NICHT so gross wie der Rinnenquerschnitt, sondern

       · vorne buendig mit der Rinnenvorderkante,
       · oben ueber die Nase hinaus,
       · unten deutlich unter den Rinnenboden – dort deckt er den
         Uebergang zum Pfosten ab,
       · hinten um rund 14 mm kuerzer, der untere Flansch der Rinne
         schaut heraus (im Bild gut zu sehen),
       · und seine HINTERE KANTE steht schraeg: oben liegt sie rund
         32 mm weiter vorne als unten.

     Die Schraege war bis heute nicht abgebildet – der Deckel hatte eine
     senkrechte Hinterkante. Alle vier Werte sind am markierten Bild
     ABGEMESSEN, Genauigkeit rund +/- 5 mm. */
  /* ---------- Form und Lage des Seitendeckels ----------
     Der Betreiber hat den gerenderten Schnitt genommen und den Umriss
     der Blende mit der Hand eingezeichnet (14.10.2026, nach „alter?").
     Das ist die belastbarste Vorlage, die es fuer dieses Teil gibt –
     belastbarer als die beiden Zeichnungen, die sich widersprechen.

     Aus dem Umriss:
       · Er deckt den GANZEN Querschnitt ab: Rinne samt dem Schenkel,
         der hinten unter ihr nach unten geht.
       · Hinten reicht er bis an die Rinnenkante; die 14,3 mm Luecke von
         vorher gibt es nicht.
       · Oben laeuft die Kante durchgehend gerade, auch ueber der
         niedrigeren hinteren Wange – also KEINE Fase dort.
       · Unten vorne eine grosse Fase.

     Damit stimmen auch die 175 mm der Skizze zu 6017 wieder:
     136,7 (Rinne) + 38,3 (Schenkel) = 175,0. Die Herleitung war also
     richtig, falsch war die Form drumherum – die Fasen sassen hinten
     statt unten vorne, und die Blende war hinten zu kurz.

     Die Tiefe nimmt die RINNENTIEFE (186,3) statt der 172 aus der
     Skizze: Die Blende soll die Rinne abdecken, und dazu muss sie so
     tief sein wie diese. Woher die 172 kommen, bleibt offen. */
  var RINNENDECKEL = { breite: RINNE.breite,
                       hoehe: RINNE.hoehe + RINNE.schenkelLang,
                       fase: RINNE.fase, fall: 0, lehne: 0 };

  /* ---------- Seitliche Abdeckungen ----------
     „miir is wichtig das die abdeckungen links rechts von rinne und von
     wandprofil abdeckung links rechts identisch sind aber ohne vd
     gravur" (Betreiber, 11.10.2026) – und auf Nachfrage, nachdem die
     erste Fassung beide gleich baute: „du hast die deckel nicht richtig
     abgebildet sondern selbst modeliert", Rinne und Wandprofil sind
     DOCH VERSCHIEDEN (Betreiber, 11.10.2026).

     Deshalb zwei Formen, jede nach ihrem Bild:

       · RINNE: eckig, mit gerader Schräge an der oberen Vorderecke.
         172 × 175 mm, Fase 34 mm – das ist BELEGT aus dem Teilebild.
       · WANDPROFIL: rund. Die vordere Kante läuft in einem großen Bogen
         aus, statt in einer Schräge. Maße GESCHÄTZT, das Werkbild ist
         nicht bemaßt.

     Was beide teilen, ist die Machart: dieselbe Bauweise, dasselbe
     Material – und KEINE GRAVUR. Auf den Werkbildern trägt die Kappe
     das Zeichen des Herstellers. Das ist dessen Marke; wir sind
     Verarbeiter. Ein fremdes Markenzeichen im eigenen Konfigurator
     nachzubilden wäre weder rechtlich sauber noch sachlich richtig,
     denn es stünde an einem Bild, das WIR verantworten. */

  /* x = 0 ist hinten, x = b vorne; nach dem rotateY beim Bauen läuft die
     Querschnittsbreite in +z, und +z ist vorne. */
  /* ---------- Form nach dem Teilebild von 6011/6012 ----------
     „beim tds gefallen mir die rinnenblenden und die wandprofilblenden
     links und rechts nicht, suche die richtigen in der einzelteileliste:
     Seitendeckel Rinne 2 links 6011, rechts 6012" (Betreiber, 14.10.2026).

     Bis dahin stand hier die Form des Artikels 6017 („Seitendeckel
     Rinne 2 TD beidseitig") – ein Rechteck mit EINER abgeschraegten Ecke.
     Die seitenspezifischen Deckel 6011/6012 haben zwei: oben UND unten an
     der Vorderkante, dazu eine leicht fallende Oberkante.

     Die Hauptmasse 172 x 175 stammen weiter aus der bemassten Skizze von
     6017 – 6011/6012 sind in der Liste nur als Foto abgebildet. Die
     Fasentiefe und der Fall der Oberkante sind daran ABGESCHAETZT. */
  function rinnenkappeQuerschnitt() {
    var b = RINNENDECKEL.breite, h = RINNENDECKEL.hoehe;
    /* Zweite Handvorlage des Betreibers im gerenderten Schnitt
       (14.10.2026): vorne ZWEI Fasen – oben eine kleine, unten eine
       grosse, die bis zum Schenkelfuss durchlaeuft. Hinten und oben
       laeuft die Kante gerade.

       Die Masse sind nicht geschaetzt, sondern folgen der Rinne:
         · oben dieselbe Fase wie die Rinnenvorderkante (fase * 0,6),
         · unten die Rinnenfase PLUS die Schenkellaenge – beide in 45°,
           damit liegt die Blendenkante genau auf der Rinnenfase und
           laeuft von dort bis zum Schenkelfuss weiter.
       Nachgerechnet deckt die Blende den Rinnenumriss damit exakt ab,
       ohne ihn irgendwo zu schneiden. */
    var fo = RINNE.fase * 0.6;
    var fu = RINNE.fase + RINNE.schenkelLang;
    var f = new THREE.Shape();
    f.moveTo(0, 0);                    // hinten unten
    f.lineTo(b - fu, 0);               // Unterkante
    f.lineTo(b, fu);                   // grosse Fase unten vorne
    f.lineTo(b, h - fo);               // Vorderkante
    f.lineTo(b - fo, h);               // kleine Fase oben vorne
    f.lineTo(0, h);                    // Oberkante, gerade
    f.closePath();                     // Hinterkante
    return f;
  }

  /* ---------- Seitendeckel Wandprofil TD (6013) ----------
     BELEGT aus der Einzelteile-Liste: 146,27 x 89,16 mm. Die Skizze zeigt
     ihn LIEGEND mit dem Bogen oben; eingebaut steht er: „146,27 is höhe,
     89,16 is breite", „der flache bogen muss nach rechts zeigen, das bild
     is falsch gedreht" (Betreiber, 14.10.2026).

     Zum sechsten Mal dieselbe Falle – ein Querschnitt sagt nichts ueber
     die Einbaulage. Diesmal hat der Betreiber es gesagt, bevor es im
     Modell stand.

     Vorher standen hier 140 x 175 mit Radius 70, alle drei am Werkbild
     abgeschaetzt: zu schmal, zu hoch und mit dem Bogen nur ueber der
     oberen Ecke statt ueber der ganzen Aussenkante.

     WARUM 89,16 MM, OBWOHL DAS PROFIL NUR 38,6 AUSLAEDT (14.10.2026):
     Am selben Tag war der Deckel kurzzeitig auf Profiltiefe gestutzt,
     weil er im Bild 5 cm frei vor dem Profil zu schweben schien („das
     wandprofil is zu tief brudiiiiiii"). Der Betreiber hat das
     korrigiert: „der seitendeckel für das wandprofil ist
     unterdeminsioniert bzw. in der höhe ok aber in der breite etwas zu
     schmal".

     Damit ist klar, was die 89,16 mm sind: Der Deckel deckt nicht nur
     das Profil ab, sondern auch die Stirnseite des aeusseren Sparrens,
     der seit heute IN der unteren Kammer steckt und nach vorne
     weiterlaeuft (38,6 + rund 50 = 88,6 – das kommt hin). Frei
     schwebte er nur, solange die Sparren erst vor dem Profil begannen.

     Beide Masse sind damit BELEGT und bleiben unangetastet. */
  var WANDDECKEL = { breite: 8.916, hoehe: 14.627 };

  function wandkappeQuerschnitt() {
    var b = WANDDECKEL.breite, h = WANDDECKEL.hoehe;
    var f = new THREE.Shape();
    /* Links die gerade Kante an der Wand, rechts der flache Bogen nach
       aussen. Oben und unten laufen die Kanten leicht ein – so zeigt es
       die Skizze (dort, um 90° gedreht, als die beiden schraegen Seiten
       unter dem Bogen). */
    f.moveTo(0, 0);
    f.lineTo(b * 0.62, 0);
    f.quadraticCurveTo(b, h * 0.16, b, h * 0.5);
    f.quadraticCurveTo(b, h * 0.84, b * 0.62, h);
    f.lineTo(0, h);
    f.closePath();
    return f;
  }

  function profilKappen(laenge, zHinten, yStart, form, material) {
    var dicke = 0.4;
    [-1, 1].forEach(function (seite) {
      var g = new THREE.ExtrudeGeometry(form,
        { depth: dicke, bevelEnabled: false, curveSegments: 8 });
      g.rotateY(-Math.PI / 2);
      g.translate(seite * (laenge / 2 + dicke) + (seite > 0 ? 0 : dicke),
                  yStart, zHinten);
      var m = new THREE.Mesh(g, material);
      m.castShadow = true; m.receiveShadow = true;
      bau.add(m);
    });
  }

  /* Der Deckel am Wandprofil sitzt hinten an der Wand und reicht nach
     vorne unter das Dach; oben schließt er mit der Profiloberkante ab.
     Beides ist ANGENOMMEN – belegt ist nur die Lage an der Rinne. */
  function wandprofilKappen(laenge, wpOk, material) {
    profilKappen(laenge, 0, wpOk - WANDDECKEL.hoehe,
                 wandkappeQuerschnitt(), material);
  }

  function rinnenblenden(laenge, zVorne, yUnten, material) {
    /* Unten am SCHENKELFUSS, oben an der Nase – das sind zusammen genau
       die 175 mm des Teils. Vorne buendig; die 14,3 mm, die hinten frei
       bleiben, sind die Differenz der beiden bemassten Breiten.

       Vorher stand hier dreimal etwas anderes (mittig / an der Nase mit
       Ueberstand / hinten buendig auf dem Boden). Alle drei waren
       Versuche, zwei Masse zusammenzubringen, zwischen denen der
       Schenkel fehlte. */
    profilKappen(laenge, zVorne - RINNENDECKEL.breite,
                 yUnten - RINNE.schenkelLang,
                 rinnenkappeQuerschnitt(), material);
  }



  /* ---------- Dachsparren des TDS-Systems ----------
     Maße aus der Querschnittszeichnung des Betreibers (10.10.2026):
     61 mm breit, 120 mm hoch insgesamt, davon 96,7 mm Hauptkörper. Auf der
     Zeichnung liegt das Profil auf der Seite; der schmale Steg gehört nach
     OBEN – dort liegt die Eindeckung auf.

     GESCHÄTZT ist allein die Breite des oberen Stegs (26 mm) und die
     Wandstärke – beides steht nicht in der Zeichnung.

     Vorher waren hier 70 × 130 mm angenommen. Der Sparren ist das Bauteil,
     das man unter einem Terrassendach am häufigsten ansieht; ein zu
     klobiges Profil lässt die ganze Anlage schwer wirken. */
  var SPARREN = {
    breite: 6.1,       // 61 mm, Zeichnung
    hoehe: 12.0,       // 120 mm gesamt, Zeichnung
    koerper: 9.67,     // 96,7 mm Hauptkörper, Zeichnung
    /* 21 mm. Nicht mehr geschaetzt, sondern AUSGERECHNET aus dem
       Querschnittsbild des Betreibers (14.10.2026, zwei Sparren mit
       aufliegender Scheibe): Die Scheibe liegt je Seite 20 mm auf, der
       Sparren ist 61 mm breit – fuer den Steg in der Mitte bleiben
       61 − 2 × 20 = 21 mm. Dieselben 20 mm nennt die Montageanleitung
       S. 9 („Breite der Eindeckung = Abstand zwischen Träger + 40 mm").

       Mit den vorher geschaetzten 26 mm schnitt die Scheibe beidseitig
       2,5 mm IN den Steg. Jetzt stoesst ihre Kante genau an die
       Stegflanke – so, wie es das Bild zeigt. */
    stegBreite: 2.1
  };

  /* Querschnitt des Sparrens in der XY-Ebene: x quer, y nach oben.
     Unten der Hauptkörper mit leicht gebrochenen Kanten, darüber der
     schmale Steg, auf dem die Eindeckung aufliegt. */
  function sparrenQuerschnitt() {
    var b = SPARREN.breite, h = SPARREN.koerper;
    var sb = SPARREN.stegBreite, sh = SPARREN.hoehe - SPARREN.koerper;
    var r = 0.35;                       // gebrochene Kante, GESCHÄTZT
    var f = new THREE.Shape();
    f.moveTo(-b / 2 + r, 0);
    f.lineTo(b / 2 - r, 0);
    f.quadraticCurveTo(b / 2, 0, b / 2, r);
    f.lineTo(b / 2, h - r);
    f.quadraticCurveTo(b / 2, h, b / 2 - r, h);
    f.lineTo(sb / 2, h);
    f.lineTo(sb / 2, h + sh);           // Steg nach oben
    f.lineTo(-sb / 2, h + sh);
    f.lineTo(-sb / 2, h);
    f.lineTo(-b / 2 + r, h);
    f.quadraticCurveTo(-b / 2, h, -b / 2, h - r);
    f.lineTo(-b / 2, r);
    f.quadraticCurveTo(-b / 2, 0, -b / 2 + r, 0);
    f.closePath();
    return f;
  }

  /* Ein Sparren. laenge = Länge in Dachrichtung, (x, y, z) = Mitte,
     neig = Dachneigung. Der Nullpunkt des Querschnitts liegt an der
     UNTERKANTE des Profils – so lässt sich die Lage direkt aus der
     Durchgangshöhe ableiten. */
  function sparrenBauen(laenge, x, yUnten, z, neig, material) {
    var g = new THREE.ExtrudeGeometry(sparrenQuerschnitt(),
      { depth: laenge, bevelEnabled: false, curveSegments: 3 });
    g.translate(0, 0, -laenge / 2);
    var m = new THREE.Mesh(g, material);
    m.position.set(x, yUnten, z);
    m.rotation.x = neig;
    m.castShadow = true; m.receiveShadow = true;
    dachTeil(m);
    bau.add(m);
    return m;
  }

  /* Abdeckprofil („Rundleiste", Montageanleitung S. 34/35): Auf jedem
     Sparren sitzt nach dem Verlegen der Eindeckung eine Abdeckleiste, an
     den äußeren Trägern eine Seitenabdeckleiste. Sie hält die Scheiben und
     ist das, was man von unten und von der Seite sieht – ohne sie wirkt
     das Dach wie eine lose aufgelegte Glasplatte.

     Maße BELEGT: Das Teilebild „Glasleiste TD" (Betreiber, 11.10.2026)
     nennt 55,3 mm Breite und 22,6 mm Höhe. Vorher standen hier
     geschätzte 50 × 12 mm – vom Betreiber beanstandet: „die hast du
     bissl zu klein modelliert". Vor allem die Höhe war nur halb so groß,
     und das sieht man: Die Leiste ist das, was man auf dem Dach zwischen
     den Scheiben erkennt. */
  var GLASLEISTE = { breite: 5.53, hoehe: 2.26 };   // cm, BELEGT

  function abdeckleiste(laenge, x, y, z, neig, material) {
    /* Halbzylinder: Der Radius gibt die halbe Breite, die Stauchung in y
       die Höhe. r = 55,3/2 = 2,765; 2,765 × 0,8174 = 2,26. */
    var r = GLASLEISTE.breite / 2;
    var g = new THREE.CylinderGeometry(r, r, laenge, 14, 1, false, 0, Math.PI);
    g.rotateZ(Math.PI / 2);          // Achse entlang z legen
    g.rotateY(Math.PI / 2);
    g.scale(1, GLASLEISTE.hoehe / r, 1);
    var m = new THREE.Mesh(g, material);
    m.position.set(x, y, z);
    m.rotation.x = neig;
    m.castShadow = true; m.receiveShadow = true;
    dachTeil(m);
    bau.add(m);
    return m;
  }

  /* Seitenglasleiste TD – die Leiste auf dem ÄUSSERSTEN Sparren links
     und rechts. „die glasleisten an den sparren ganz links und rechts
     haben so einen abschluss das man einen sauberen übergang außen hat
     … hier auf dem bild is sie liegend, einmal nach rechts drehen, dann
     is sie richtig für die rechte seite und gespiegelt für die linke
     seite" (Betreiber, 11.10.2026, mit Teilebild).

     BELEGT aus dem Teilebild: 63,1 × 59,4 mm. Das Bild zeigt den
     Querschnitt LIEGEND – aufgestellt ist die 63,1 die Breite quer zum
     Dach, die 59,4 die Höhe des Schenkels, der außen über den Sparren
     herunterreicht. Genau diese Verwechslung ist heute schon dreimal
     passiert (SG23-Profile, Velaris-Aufhängung, Wandprofil), deshalb
     steht der Querschnitt hier gleich in der EINBAULAGE, nicht so, wie
     er auf dem Blatt liegt.

     GESCHÄTZT ist die Form dazwischen: Wandstärke, Radius und die Nase,
     die ins Glas greift – das Teilebild ist dafür zu klein. Das
     Umrissmaß stimmt, die Rundung ist nachempfunden. */
  var SEITENLEISTE = { breite: 6.31, hoehe: 5.94, staerke: 0.3 };  // cm

  /* Querschnitt für die RECHTE Seite: x nach außen (+), y nach unten ab
     Glasoberkante. Die linke Seite ist dieselbe Form, gespiegelt. */
  function seitenleisteQuerschnitt() {
    var b = SEITENLEISTE.breite, h = SEITENLEISTE.hoehe, t = SEITENLEISTE.staerke;
    var a = b / 2;
    /* KORREKTUR 11.10.2026: „du hast die äußeren glasleisten jz komplett
       verändert, die sehen aus wie die anderen nur mit dieser
       abschlusszunge, abschlussprofil was den spalt schließt"
       (Betreiber).

       Richtig: Es ist DIESELBE Leiste wie auf den anderen Sparren – das
       halbrunde Profil, 55,3 × 22,6 mm – nur außen um die Zunge
       verlängert. Der erste Versuch hatte daraus ein eigenes, flaches
       Kastenprofil gemacht; im Bild fiel die Dachkante dadurch aus der
       Reihe.

       Die 63,1 × 59,4 mm aus dem Teilebild sind das Umrissmaß des
       GANZEN Teils: in der Breite das Halbrund plus die Außenwange, in
       der Höhe vom Scheitel des Halbrunds bis zur Zungenspitze. */
    var rund = GLASLEISTE.hoehe;                 // 22,6 mm, wie die anderen
    var r = GLASLEISTE.breite / 2;               // 27,65 mm
    var xm = -a + r;                             // Mitte des Halbrunds
    var f = new THREE.Shape();
    f.moveTo(-a, 0);
    /* Halbrund von innen nach außen, als Polygonzug – damit es sich
       nachrechnen lässt. */
    var i, n = 12, w;
    for (i = 1; i <= n; i++) {
      w = Math.PI - Math.PI * i / n;
      f.lineTo(xm + r * Math.cos(w), rund * Math.sin(w));
    }
    /* Außen weiter auf die Wange und als Zunge nach unten. */
    f.lineTo(a - 0.3, 0);
    f.quadraticCurveTo(a, 0, a, -0.4);
    f.lineTo(a, rund - h);                       // Zungenspitze
    f.lineTo(a - t, rund - h);
    f.quadraticCurveTo(a - t, -0.4, a - 0.3, -t);
    f.lineTo(-a + 0.9, -t);
    f.lineTo(-a + 0.9, -t - 0.6);                // Nase, die aufs Glas greift
    f.lineTo(-a, -t - 0.6);
    f.closePath();
    return f;
  }

  /* Spiegeln an der x-Achse. Ein negativer Maßstab allein dreht die
     Flächen nach innen – sie werden dann weggeschnitten und das Teil
     sieht von außen hohl aus. Deshalb wird zusätzlich die Reihenfolge
     der Dreiecksecken getauscht. */
  function spiegelnX(g) {
    g.scale(-1, 1, 1);
    var pos = g.attributes.position, i, j, tmp;
    if (g.index) {
      var idx = g.index;
      for (i = 0; i < idx.count; i += 3) {
        tmp = idx.getX(i); idx.setX(i, idx.getX(i + 2)); idx.setX(i + 2, tmp);
      }
      idx.needsUpdate = true;
    } else {
      for (i = 0; i < pos.count; i += 3) {
        for (j = 0; j < 3; j++) {
          tmp = pos.array[i * 3 + j];
          pos.array[i * 3 + j] = pos.array[(i + 2) * 3 + j];
          pos.array[(i + 2) * 3 + j] = tmp;
        }
      }
      pos.needsUpdate = true;
    }
    g.computeVertexNormals();
    return g;
  }

  function seitenglasleiste(laenge, x, y, z, neig, links, material) {
    var g = new THREE.ExtrudeGeometry(seitenleisteQuerschnitt(),
      { depth: laenge, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -laenge / 2);
    if (links) spiegelnX(g);
    var m = new THREE.Mesh(g, material);
    m.position.set(x, y, z);
    m.rotation.x = neig;
    m.castShadow = true; m.receiveShadow = true;
    dachTeil(m);
    bau.add(m);
    return m;
  }

  /* ---------- Seitliche Randblende ----------
     „hier ein perfekter querschnitt unserer überdachung kannst du es so
     neu modellieren" – „nicht 100% 1:1 aber ähnlich und einfach"
     (Betreiber, 11.10.2026, mit fünf Werkbildern).

     Auf den Bildern ist der Dachrand SEITLICH geschlossen: Die Anlage
     hat einen umlaufenden Rahmen – vorne die Rinne, hinten das
     Wandprofil, und an beiden Seiten ein ebenso hohes, glattes Profil.
     Im Modell endete das Dach seitlich bisher mit dem nackten
     Sparrenprofil; man sah von außen in die Sparrenkammer.

     Gebaut wird deshalb eine Blende, die außen am Randsparren liegt und
     mit ihm läuft: von der Sparrenunterkante bis an die Glasoberseite,
     bündig mit der Dachkante. Sie ist VERKLEIDUNG, kein tragendes Teil –
     die Sparrenachsen, die Statik und alle daran hängenden Rechnungen
     bleiben unberührt. Das war die Bedingung dafür, dass sich aus einer
     Optikänderung kein Maßfehler einschleicht.

     Die Dicke ist GESCHÄTZT; auf den Bildern ist nichts bemaßt. */
  /* dicke: Ansichtsbreite der Blende. vor: wie weit ihre Außenfläche
     vor der Dachkante liegt.

     Die 2,5 mm sind kein Bauteilmaß, sondern Zeichentechnik und müssen
     bleiben: „an den außenblenden links und rechts sieht man die
     sparren durch, die blende sind ja dafür da um die sparren eben
     nicht zu sehen" (Betreiber, 11.10.2026). Der Randsparren endet
     bündig an der Dachkante, die Blende lag genau davor – zwei Flächen
     auf derselben Ebene. Welche davon der Bildschirm zeigt, entscheidet
     dann die Rechengenauigkeit, und zwar Pixel für Pixel neu: Die
     Sparren blitzen durch die Blende. Mit dem Vorsprung liegt die
     Blende eindeutig davor. */
  /* BELEGT (Maßtabelle, Kopfzeile PFOSTENACHSE_AB_VORDERKANTE_MM=55):
     Abstand der Pfostenachse von der Vorderkante der Rinne, in cm. */
  /* Wandprofil TD, cm. Stand bisher nur als Zahl im Modellaufbau; seit
     die Unterkante im Bedienfeld angezeigt und rückwärts gerechnet
     wird, brauchen beide dieselbe Quelle. */
  /* Wandprofil TD (15188), BELEGT aus der Einzelteile-Liste des
     Herstellers (Stand 07.10.2026): 143,6 x 38,6/37 mm. Die beiden
     Hoehenmasse sind die Enden – das Profil laeuft leicht keilig, damit
     das Dachgefaelle anschliesst; gezeichnet wird mit dem groesseren.

     EINGEBAUT STEHT ES AUFRECHT: 143,6 mm hoch an der Wand, 38,6 mm
     Ausladung. Die Zeichnung zeigt es liegend – „der Querschnitt sagt
     nichts ueber die Einbaulage" (Lehre vom 11.10.2026, dort dreimal
     derselbe Fehler). Die Einbaulage hat der Betreiber am 11.10.2026
     bestaetigt.

     Die Ausladung stand bis zum 14.10.2026 auf 31 mm – geschaetzt aus
     einer frueheren Zeichnung. Die Liste nennt 38,6 mm. */
  var WANDPROFIL = {
    hoehe: 14.36,       // 143,6 mm – „143,6 is höhe" (Betreiber, 14.10.2026)
    tiefe: 3.86,        // Ausladung OBEN: „38,6 is breite oben"
    tiefeUnten: 3.70,   // Ausladung UNTEN: „37 is breite unten"
    wand: 0.25,         // Blechstaerke, GESCHAETZT
    /* Die Lage des Mittelstegs steht NICHT mehr hier: Sie wird in
       wandprofilKammern() aus den Teilen gerechnet, die hineingehoeren.
       Siehe dort – ein zweiter Wert an dieser Stelle wuerde davonlaufen. */
    stegTiefe: 2.90     // Mittelsteg ist kuerzer als die Schenkel, GESCHAETZT
  };

  /* ---------- Querschnitt des Wandprofils ----------
     „die unterseite hier auf dem bild die zwei offenen kammern müssen
     nach rechts gucken nicht nach unten" (Betreiber, 14.10.2026, zur
     Zeichnung von 15188).

     In der Zeichnung LIEGT das Profil: die geschlossene Wand oben, die
     drei Schenkel nach unten, dazwischen zwei offene Kammern. Eingebaut
     steht es: die geschlossene Wand am Haus, die Schenkel nach VORNE,
     die Kammern zur Terrasse hin offen.

     Bis heute war es ein glatter Quader (balken(...)). Von der Seite und
     von unten sah man deshalb einen massiven Block statt eines Profils.

     x = 0 ist die Wand, x waechst nach vorne; y = 0 ist die Unterkante.
     Oben laedt es 38,6 mm aus, unten 37 – das Profil laeuft leicht
     keilig, beide Masse stehen in der Zeichnung.

     WARUM keilig: „links die flache seite muss bündig an der wand
     anliegen quasi is das profil dann etwas geneigt" und „ja die
     vorderseite is geneigt weil die sparren die in der kammer liegen
     haben ja gefälle nach vorne" (Betreiber, 14.10.2026). Die flache
     Rueckseite liegt an der Wand, die Vorderkante steht schraeg – die
     grosse Kammer nimmt die Sparren auf, und die haben Gefaelle. */
  /* Die beiden Kammern fassen GENAU die Teile, die hineingehoeren:
     „quasi sparren dürfte nicht tiefer oder höher als die untere kammer
     des wandprofil sein und glas + glasleiste dürfen nicht tiefer oder
     höher als die obere kamer sein" (Betreiber, 14.10.2026).

     Deshalb wird hier nichts geschaetzt, sondern gerechnet:
       untere Kammer = Hauptkoerper des Sparrens (96,7 mm; die Klaue
                       darueber steht neben der Scheibe und gehoert
                       nach oben),
       obere Kammer  = Scheibe + Abdeckleiste,
       Blechstaerke  = was von den 143,6 mm uebrig bleibt, auf die drei
                       waagerechten Bleche verteilt (unterer Schenkel,
                       Mittelsteg, oberer Schenkel).

     Bei 8 mm Glas sind das 5,4 mm je Blech. Die Zeichnung bemasst weder
     den Steg noch die Blechstaerke – diese ist damit die einzige
     Unbekannte und faengt den Rest auf. Waere sie in Wirklichkeit
     duenner, haette das Profil irgendwo Luft; dann sagt der Betreiber,
     wo. Was NICHT mehr passiert: dass oben die Leiste und unten der
     Sparren herausschaut. */
  function wandprofilKammern(glasD) {
    var unten = SPARREN.koerper;
    var oben = glasD + GLASLEISTE.hoehe;
    return { unten: unten, oben: oben,
             blech: (WANDPROFIL.hoehe - unten - oben) / 3 };
  }

  function wandprofilQuerschnitt(glasD) {
    var K = wandprofilKammern(glasD);
    var H = WANDPROFIL.hoehe, w = WANDPROFIL.wand, t = K.blech;
    var ob = WANDPROFIL.tiefe, ub = WANDPROFIL.tiefeUnten;
    var ms = WANDPROFIL.stegTiefe;
    var ys = t + K.unten;                        // Unterkante des Mittelstegs
    var f = new THREE.Shape();
    f.moveTo(0, 0);
    f.lineTo(ub, 0);                 // unterer Schenkel nach vorne
    f.lineTo(ub, t);
    f.lineTo(w, t);                  // zurueck an die Rueckwand
    f.lineTo(w, ys);                 // untere Kammer, nach vorne offen
    f.lineTo(ms, ys);                // Mittelsteg
    f.lineTo(ms, ys + t);
    f.lineTo(w, ys + t);
    f.lineTo(w, H - t);              // obere Kammer, nach vorne offen
    f.lineTo(ob, H - t);
    f.lineTo(ob, H);                 // oberer Schenkel
    f.lineTo(0, H);
    f.closePath();
    return f;
  }

  /* laenge = Dachbreite in x, yUnten = Unterkante, z = 0 ist die Wand. */
  function wandprofilBauen(laenge, yUnten, glasD, material) {
    var g = new THREE.ExtrudeGeometry(wandprofilQuerschnitt(glasD),
      { depth: laenge, bevelEnabled: false });
    /* Wie bei der Rinne: Mit −90° laeuft die Querschnittstiefe in +z,
       die Kammern zeigen damit nach vorne und nicht zur Wand. */
    g.rotateY(-Math.PI / 2);
    g.translate(laenge / 2, yUnten, 0);
    var m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    bau.add(m);
    return m;
  }

  /* ---------- Wand-Rinnen Blende 2 TD (16912) ----------
     BELEGT aus der Einzelteile-Liste: ein duenner Schenkel von 98,85 mm
     mit einem 23,7 mm hohen Haken am Ende. Eingebaut steht der lange
     Schenkel senkrecht vor der unteren Kammer des Wandprofils, der Haken
     greift oben in den Mittelsteg. Die 98,85 mm decken die 96,7 mm hohe
     Kammer genau ab – daran ist zu erkennen, dass es dieses Teil ist.
     Die Dicke steht nicht in der Zeichnung, 2 mm GESCHAETZT. */
  var WANDBLENDE = { hoehe: 9.885, dicke: 0.2 };

  /* KORREKTUR 14.10.2026: „und die pfosten sitzen bei uns zu weit vorne,
     die müssen genau an dem hinteren schenkel der rinne sitzen wie in
     meiner skizze weiter oben, denn dort werden sie von innen
     verschraubt" (Betreiber, mit drei Werkbildern der Rinne auf dem
     Pfosten – auf allen steht die Rinne vorne deutlich ueber).

     Dritte Lage an dieser Stelle, deshalb die ganze Geschichte:
       10.10.2026  93 mm – „mittig unter der Rinne"
       11.10.2026  55 mm – „dann mach es nach liste", nachdem die
                   Masstabelle im Kopf PFOSTENACHSE_AB_VORDERKANTE_MM=55
                   nannte. Damit stand die Pfostenvorderkante buendig
                   mit der Rinnenvorderkante.
       14.10.2026  124,2 mm – hinten, an dem Schenkel, der unter der
                   Rinne gerade nach unten geht: „an diesem schenkel wird
                   der pfosten verschraubt". Der Pfosten steht an dessen
                   VORDERSEITE, also 186,3 − 7 (Schenkel) − 55 (halber
                   Pfosten) = 124,2 mm ab Vorderkante.

     Warum das die 55 mm aus der Tabelle schlaegt: Die Tabelle ist von
     mir aus den Preislisten zusammengestellt, die Zahl stand dort ohne
     Zeichnung. Der Betreiber nennt den Grund, den keine Tabelle liefert
     – der Pfosten wird am Schenkel verschraubt, und der sitzt hinten. */
  var PFOSTENACHSE = 12.42;
  /* Die Achse der Masstabelle, Pfostenvorderkante buendig mit der
     Dachkante. Gilt weiter fuer alles ausser dem TDS – siehe oben. */
  var PFOSTENACHSE_VORNE = 5.5;

  var RANDBLENDE = { dicke: 3.0, vor: 0.25 };

  /* ---------- Gerillte Blende des SkyView ----------
     Auf dem Querschnittsbild des Betreibers (11.10.2026) ist der
     Außenkasten nicht glatt, sondern fein waagerecht gerillt – dieselbe
     Oberfläche wie bei der TDS-Rinnenfront. Es ist das Erste, was man
     an der Anlage sieht.

     Gebaut wird der Kasten deshalb als gezogenes Profil mit gerillter
     AUSSENseite statt als glatter Balken. Die Rillenteilung ist
     dieselbe wie an der Rinne (RINNE.rilleTeilung) – auf den Bildern
     sehen beide gleich aus, und ein zweiter Wert, den niemand pflegt,
     liefe davon weg.

     dreh: 0 = Außenseite nach +z (vorne), Math.PI = nach -z (hinten),
     ±Math.PI/2 = zur Seite. */
  function blendeProfil(laenge, hoehe, tiefe, x, yMitte, z, dreh, material) {
    var f = new THREE.Shape();
    f.moveTo(0, 0);
    f.lineTo(tiefe, 0);
    var vonY = 0.8, bisY = hoehe - 0.8;
    /* FÜNF Rillen, nicht nach Teilung gerechnet: „5 rillen" (Betreiber,
       14.10.2026) auf die Frage, ob die Blende glatt oder gerillt ist.
       Vorher ergab die feste Teilung von 15 mm bei einer 252 mm hohen
       Blende sechzehn Rillen – das sieht aus wie ein Lamellenprofil,
       nicht wie die Blende auf den Produktbildern. Die Zahl gilt für
       alle drei Blenden (vorne, hinten, seitlich), die alle dieselbe
       Höhe haben. */
    var n = 5;
    var schritt = (bisY - vonY) / n, fuge = 0.3, k;
    for (k = 0; k < n; k++) {
      var y0 = vonY + k * schritt;
      f.lineTo(tiefe, y0 + schritt * 0.30);
      f.lineTo(tiefe - fuge, y0 + schritt * 0.45);
      f.lineTo(tiefe - fuge, y0 + schritt * 0.70);
      f.lineTo(tiefe, y0 + schritt * 0.85);
    }
    f.lineTo(tiefe, hoehe);
    f.lineTo(0, hoehe);
    f.closePath();
    var g = new THREE.ExtrudeGeometry(f, { depth: laenge, bevelEnabled: false });
    g.translate(-tiefe / 2, -hoehe / 2, -laenge / 2);
    g.rotateY(dreh);
    var m = new THREE.Mesh(g, material);
    m.position.set(x, yMitte, z);
    m.castShadow = true; m.receiveShadow = true;
    bau.add(m);
    return m;
  }

  /* ---------- VD FLACHDACH GLAS SKY VIEW ----------
     Quelle: Montageanleitung „VD FLACHDACH GLAS SKY VIEW", VD
     AluSysteme, Stand 07.11.2025, vom Betreiber am 11.10.2026
     geschickt und vollständig gelesen.

     BELEGT daraus:
       · „Die Oberkante des Daches muss an allen Punkten in WAAGE
         sitzen" (Seite 8). SkyView hat also KEIN Gefälle in der
         Konstruktion – das Wasser läuft innen in der Rinne und von dort
         durch den Pfosten ab. Vorher waren hier 2° angenommen.
       · Sparrenlänge = Spannweite − 150 mm, an jedem Ende ein
         rechteckiger Ausschnitt 65 mm tief × 86 mm hoch, mit dem der
         Sparren auf Rinne bzw. Träger aufliegt (Seite 22).
       · Die Sparren werden gleichmäßig verteilt, „an den Seiten jeweils
         ein Abstand von 0 mm" (Seite 25) – die Randsparren liegen also
         bündig an der Dachkante, anders als bei TDS (dort 30 mm).
       · Pfosten 110 × 110 mm (15190), Fallrohr Ø 75 mm im Pfosten,
         Öffnung Ø 92 mm, 100 mm über Unterkante, 55 mm von der Kante.
       · Rinnenablauf Ø 68 mm, Laubfänger (6020) darin.
       · Die seitliche Blende (Seitenblende Sky 6069) „wird in der Regel
         5 cm länger geliefert" (Seite 20) – ein LIEFERMASS, kein
         Einbaumaß; vor Ort wird sie gekürzt. Deshalb steht sie im
         Modell nicht über.
       · Glasleisten (15184) auf den Sparren, erste Schraube 100 mm vom
         Rand, dann alle 300 mm (Seite 32).

     ABGELEITET (nicht gedruckt, aber aus zwei belegten Maßen
     gerechnet): Sparrenlänge = Spannweite − 150 mm bei 65 mm Auflager
     je Seite ergibt für Rinne und Träger zusammen 280 mm Bautiefe,
     also je 140 mm. Vorher standen hier 90 mm als reine Schätzung.

     SPARREN UND GLASLEISTEN SIND DIE DES TDS-SYSTEMS: „sparren,
     glasleiste etc is wie bei tds" (Betreiber, 11.10.2026). Hier
     standen vorher geschätzte 70 × 110 mm und eine erfundene flache
     Leiste. Die Angabe passt zur Anleitung: Der TDS-Sparren ist 120 mm
     hoch, die Ausklinkung 86 mm – es bleiben 34 mm, genau der obere
     Steg, auf dem die Eindeckung liegt. Zwei unabhängige Quellen, die
     dasselbe sagen.

     GESCHÄTZT bleiben nur noch: Rahmenhöhe (220 mm) und Blendendicke.
     Querschnittszeichnungen zu Rinne, Träger und Seitenblende gibt es
     noch nicht; sie stehen als offener Punkt in docs/NEXT_TASK.md. */
  /* ---------- SkyView: die Profile, jetzt belegt ----------
     Bis zum 14.10.2026 waren fast alle Masse hier geschaetzt, und der
     Aussenrahmen wuchs mit der Dachtiefe (bei 4,5 m auf 355 mm). Der
     Betreiber: „wieso sind im 3d konfigurator die pfosten von skyview so
     dünn wir haben pfosten die sind 110x110" – die Pfosten stimmten, der
     Rahmen darueber war doppelt so hoch wie er sein darf.

     Grundlage sind jetzt die Querschnitte aus der Einzelteile-Liste des
     Herstellers (Stand 07.10.2026). Die Liste selbst liegt NICHT im
     Projekt (Preise, Datenbankherstellerrecht) – hier stehen nur die
     Masse, die das Modell braucht, mit Artikelnummer zum Nachschlagen.

     Im ganzen System gibt es KEIN Profil ueber 136,7 mm Hoehe. Der
     Aussenrahmen kann also nicht hoeher sein.

     WIE DAS GEFAELLE HINEINPASST: „außenrum sieht er in echt auch gleich
     hoch aus" (Betreiber, 14.10.2026). Der Rahmen ist ringsum gleich
     hoch gebaut; das Glas liegt hinten dicht unter seiner Oberkante und
     vorne um das Gefaelle tiefer. Der Rahmen verdeckt genau diesen
     Unterschied – darum sieht es aussen aus wie ein Flachdach. Bei 3 m
     Tiefe sind das 105 mm in 136,7 mm Rahmenhoehe.

     Ab etwa 3,9 m Tiefe reicht die Rahmenhoehe dafuer rechnerisch nicht
     mehr (bei 4,5 m waeren es 157 mm). Dann haengt vorne die Rinne
     entsprechend tiefer – sie ist das vorderste Teil. Ob der Hersteller
     das so loest oder dort das Gefaelle flacher ausfuehrt, ist nicht
     belegt; siehe docs/NEXT_TASK.md. */
  var SKY = {
    /* ---------- Hoehe des umlaufenden Rahmens: 252 mm ----------
       BELEGT durch zwei Teile der Einzelteile-Liste, die zusammenpassen:
         Eckabdeckung Sky HL/HR (6073/6074): 124 + 124 breit, 252 HOCH –
           sie steckt ueber die Rahmenecke, also ist der Rahmen dort
           252 mm hoch.
         Seitenblende Sky (6069): 252 x 38,9 – dieselbe 252.
       „ja richtig" (Betreiber, 14.10.2026) auf die Rueckfrage, ob ein
       25-cm-Rahmen ueber einem 11-cm-Pfosten stimmt.

       ZUR SEITENBLENDE: Ihre Skizze zeigt 252 waagerecht und 38,9
       senkrecht; ich hatte sie deshalb fuer ein flaches, liegendes
       Winkelprofil gehalten und die 136,7 der Rinne fuer die
       Rahmenhoehe. Mit der Eckabdeckung daneben ist klar: 252 ist die
       HOEHE, 38,9 die Tiefe des Schenkels. Zum fuenften Mal derselbe
       Fehler – ein Querschnitt sagt nichts ueber die Einbaulage (siehe
       SG23, Velaris, Wandprofil, Seitenglasleiste).

       Die Rinne 2 TD (136,7 hoch) sitzt INNERHALB dieses Rahmens; sie
       ist nicht seine Aussenkante. */
    rahmenH: 25.2,
    rinneT: 18.63,
    /* Traeger TD (15698): Kasten 96,7 x 61, mit Nut 120 breit. BELEGT.
       Steht bei SkyView hinten an Stelle des Wandprofils. */
    traegerT: 12.0,
    traegerH: 6.1,
    /* Rinnen Blende Sky (6079): 89,3 breit, 29,8 / 55 hoch. BELEGT.
       Sitzt aussen vor der Rinne. */
    blendeT: 8.93,
    blendeH: 5.5,
    /* Seitenblende Sky (6069): 252 hoch x 38,9 tief. BELEGT.
       Aufrecht eingebaut – sie IST die hohe Aussenblende. */
    seitenblendeH: 25.2,
    seitenblendeT: 3.89,
    /* Eckabdeckung Sky HL/HR (6073/6074): 124 + 124 breit, 252 hoch.
       BELEGT. Sie deckt die Fuge, wo Seitenblende und Rinnenblende
       zusammenstossen. Im Modell laufen die Blenden durch, es gibt dort
       keine Fuge – gezeichnet wird sie deshalb nicht; sie steht hier als
       Beleg fuer die Rahmenhoehe. */
    eckblendeB: 12.4,
    sparrenAbzug: 15.0, // BELEGT: Spannweite - 150 mm
    auflager: 6.5,      // BELEGT: Ausschnitt 65 mm tief
    auflagerH: 8.6,     // BELEGT: Ausschnitt 86 mm hoch
    /* Wie tief die Glasebene hinten unter der Rahmenoberkante liegt.
       GESCHAETZT – gross genug, dass die Glasleiste darauf Platz hat. */
    glasUnter: 2.5
  };

  function randblende(laenge, hoehe, x, yMitte, z, neig, material) {
    var m = new THREE.Mesh(
      new THREE.BoxGeometry(RANDBLENDE.dicke, hoehe, laenge), material);
    m.position.set(x, yMitte, z);
    m.rotation.x = neig;
    m.castShadow = true; m.receiveShadow = true;
    dachTeil(m);
    bau.add(m);
    return m;
  }

  /* ---------- Hilfsfunktionen ---------- */
  function balken(breite, hoehe, tiefe, x, y, z, material) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(breite, hoehe, tiefe), material);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    bau.add(m);
    return m;
  }

  function leeren(gruppe) {
    for (var i = gruppe.children.length - 1; i >= 0; i--) {
      var k = gruppe.children[i];
      gruppe.remove(k);
      if (k.geometry) k.geometry.dispose();
      if (k.material) {
        if (Array.isArray(k.material)) k.material.forEach(function (m) { m.dispose(); });
        else k.material.dispose();
      }
    }
  }

  /* Gleichmäßig verteilte x-Positionen für Pfosten oder Sparren */
  function verteilen(anzahl, B, rand) {
    var xs = [];
    for (var i = 0; i < anzahl; i++) {
      xs.push(-B / 2 + rand + (B - 2 * rand) * (anzahl === 1 ? 0.5 : i / (anzahl - 1)));
    }
    return xs;
  }

  /* LED-Spots. unterkante(z) liefert die Unterkante des Bauteils, in das
     die Spots eingelassen sind – beim Terrassendach ist das die Unterseite
     der SPARREN, nicht die Dachfläche.

     Vorher standen hier die Mitten ZWISCHEN den Sparren: die Spots saßen
     mitten in der Verglasung, wo nichts sie halten könnte. Beanstandet vom
     Betreiber. Eingelassen werden sie in das Sparrenprofil – deshalb
     bekommt diese Funktion jetzt die Sparrenpositionen.

     Der Spot ragt bewusst ein Stück heraus (halbe Bauhöhe), sonst
     verschwindet er im Profil und man sieht gar kein Licht. */
  function ledSpots(xs, zs, unterkante) {
    var mLicht = new THREE.MeshBasicMaterial({ color: Z.abend ? 0xfff2cd : 0xe9e4d6 });
    /* BELEGT (Montageanleitung S. 17): Bohrungen mit 44 mm Durchmesser
       an den Sparren. Abends minimal groesser, damit der Lichtfleck
       ueberhaupt zu sehen ist. */
    var r = Z.abend ? 2.6 : 2.2;        // 44 mm, BELEGT
    xs.forEach(function (x) {
      zs.forEach(function (z) {
        var spot = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 12), mLicht);
        spot.position.set(x, unterkante(z) - 0.4, z);
        bau.add(spot);
      });
    });
    if (Z.abend) {
      var mitteZ = zs.length ? zs.reduce(function (a, b) { return a + b; }, 0) / zs.length : 0;
      var schein = new THREE.PointLight(0xffd79a, 0.9, 900, 2);
      schein.position.set(0, unterkante(mitteZ) - 20, mitteZ);
      bau.add(schein);
    }
  }

  /* ---------- LED-Spots verteilen ----------
     Drei Vorgaben des Betreibers (11.10.2026): „an die äußersten sparren
     sind keine led spots möglich, die led spots müssen je nach kundenwahl
     6,8,12 perfekt wie es schön aussehen würde in den sparren aufgeteilt
     werden, geht das nicht kann man dem kunden einen kleinen hinweis
     anzeigen z.b welche set oder wieviele von welchem led set besser
     wären".

     Vorher hing die Zahl der gezeichneten Spots an gar nichts: Es waren
     immer zwei je Sparren, über ALLE Sparren – unabhängig davon, ob ein
     6er- oder ein 12er-Set bestellt war. Ein Kunde sah also nicht, was er
     bestellt.

     Jetzt bestimmt die bestellte Zahl das Raster: gleich viele Spots je
     Sparren, und die genutzten Sparren liegen symmetrisch über dem Dach.
     Von mehreren Möglichkeiten gewinnt die, deren Abstände quer und in
     der Tiefe am ähnlichsten sind – das ist es, was „schön aufgeteilt"
     im Bild bedeutet. */
  var LED_IST = { spots: 0, reihen: 0, proReihe: 0, nutzbar: 0, rat: '' };
  /* Mehr als acht Spots in einem Sparren ist keine Beleuchtung mehr,
     sondern eine Lichterkette. GESCHÄTZT, aus dem Bild. */
  var LED_PRO_SPARREN_MAX = 8;

  function ledSetGroesse() { return parseInt(Z.ledset, 10) || 8; }
  function ledSpotZahl() {
    return ledSetGroesse() * Math.max(1, Z.ledsetzahl || 1);
  }

  /* Teilt spots auf hoechstens nutzbar Sparren auf – gleich viele je
     Sparren. Gibt es mehrere Wege, gewinnt das quadratischste Raster.
     Geht keiner auf, kommt null zurueck; dann entscheidet der Aufrufer. */
  function ledTeilung(nutzbar, spots, breite, tiefe) {
    var best = null, r, pro, note;
    for (r = 1; r <= nutzbar; r++) {
      if (spots % r) continue;
      pro = spots / r;
      if (pro > LED_PRO_SPARREN_MAX) continue;
      note = Math.abs(breite / r - tiefe / pro);
      if (!best || note < best.note) best = { reihen: r, proReihe: pro, note: note };
    }
    return best;
  }

  /* Welches Set waere besser? Gesucht wird die Bestellung, die sich auf
     diesem Dach gleichmaessig verteilen laesst und der gewuenschten Zahl
     am naechsten kommt. */
  function ledRat(nutzbar, spots, breite, tiefe) {
    if (nutzbar < 1) {
      return 'In die äußersten beiden Sparren kommt kein Spot – bei diesem' +
             ' Dach bleibt dafür kein Sparren übrig.';
    }
    var best = null;
    [6, 8, 12].forEach(function (satz) {
      for (var c = 1; c <= 6; c++) {
        var t = ledTeilung(nutzbar, satz * c, breite, tiefe);
        if (!t) continue;
        var weite = Math.abs(satz * c - spots);
        if (!best || weite < best.weite ||
            (weite === best.weite && t.reihen > best.t.reihen)) {
          best = { satz: satz, c: c, t: t, weite: weite };
        }
      }
    });
    if (!best) return '';
    return 'Gleichmäßig aufgehen würde ' + (best.c > 1 ? best.c + ' × ' : '') +
           best.satz + 'er-Set (' + (best.satz * best.c) + ' Spots): ' +
           best.t.reihen + ' Sparren mit je ' + best.t.proReihe + '.';
  }

  /* Zeichnet die Spots in die Sparren. xs sind ALLE Sparrenachsen – die
     beiden äußersten fallen hier heraus, dort ist kein Platz. */
  function ledInSparren(xs, zAb, zBis, unterkante) {
    var innen = xs.slice(1, -1);
    var spots = ledSpotZahl();
    var breite = xs.length > 1 ? xs[xs.length - 1] - xs[0] : 100;
    var tiefe = Math.max(10, zBis - zAb);
    LED_IST = { spots: spots, reihen: 0, proReihe: 0, nutzbar: innen.length, rat: '' };
    if (!innen.length) { LED_IST.rat = ledRat(0, spots, breite, tiefe); return; }
    var t = ledTeilung(innen.length, spots, breite, tiefe);
    if (!t) {
      /* Geht die bestellte Zahl nicht gleichmäßig auf, wird NICHT
         krumm verteilt: Gezeichnet wird das nächstkleinere gleichmäßige
         Raster, und der Hinweis sagt, was besser passt. Lieber ein
         ehrliches Bild als eines, das eine Aufteilung vortäuscht. */
      var pro = Math.max(1, Math.min(LED_PRO_SPARREN_MAX,
                                     Math.floor(spots / innen.length)));
      t = { reihen: Math.max(1, Math.floor(spots / pro)), proReihe: pro };
      if (t.reihen > innen.length) t.reihen = innen.length;
    }
    var idx = [], i;
    for (i = 0; i < t.reihen; i++) {
      idx.push(Math.round((i + 0.5) * innen.length / t.reihen - 0.5));
    }
    /* Gespiegelt: Die hintere Hälfte wird aus der vorderen gebildet.
       Ohne das sitzt das Raster bei ungerader Teilung schief – gerundet
       wird immer nach oben, und das schiebt alles nach rechts. Genau
       rechnerisch mittig geht nur, wenn Sparrenzahl und Teilung
       zusammenpassen; sonst bleibt ein halber Abstand Rest. */
    for (i = 0; i < Math.floor(t.reihen / 2); i++) {
      idx[t.reihen - 1 - i] = innen.length - 1 - idx[i];
    }
    var zs = [];
    for (i = 0; i < t.proReihe; i++) {
      zs.push(zAb + tiefe * (i + 0.5) / t.proReihe);
    }
    ledSpots(idx.map(function (j) { return innen[j]; }), zs, unterkante);
    LED_IST.reihen = t.reihen;
    LED_IST.proReihe = t.proReihe;
    if (t.reihen * t.proReihe !== spots) {
      LED_IST.rat = ledRat(innen.length, spots, breite, tiefe);
    }
  }

  /* ---------- Maßbänder ----------
     Die Zahl im Bild ist dieselbe Zahl wie im Bedienfeld und später im
     Aufmaß – in Millimetern, ohne Umrechnung und ohne Rundung. Sobald hier
     gerundet würde, stünden zwei verschiedene Maße auf demselben Bild. */
  /* Maßschilder: filigran, nicht plakativ.

     „die maßangaben etwas kleiner filigraner machen das es nicht so
     stört" (Betreiber, 11.10.2026, mit Bildschirmfoto). Vorher: fette
     40-px-Schrift auf einem fast deckenden schwarzen Kasten, im Bild
     40 % so hoch wie das ganze Seitenelement. Die Maße sollen abzulesen
     sein, nicht die Hauptsache.

     Geändert: normale statt fetter Schrift, abgerundeter Kasten mit
     weniger Deckkraft und schmalerem Rand, und die Sprite-Höhe von 24
     auf 14 – das Schild wird damit im Bild gut zwei Fünftel kleiner.
     Die Leinwand bleibt hochaufgelöst (40 px Schrift), damit der Text
     auch beim Heranzoomen scharf bleibt; verkleinert wird erst beim
     Anzeigen. */
  var SCHILD_HOCH = 14;         // Welt-Einheiten, vorher 24

  function schild(text) {
    var c = document.createElement('canvas');
    var g = c.getContext('2d');
    var schrift = '40px Arial, Helvetica, sans-serif';
    g.font = schrift;
    var hoch = 54, rund = 10;
    var breit = Math.ceil(g.measureText(text).width) + 22;
    c.width = breit; c.height = hoch;
    g = c.getContext('2d');
    g.font = schrift;
    g.fillStyle = 'rgba(17,17,17,.62)';
    /* Abgerundete Ecken von Hand – roundRect kennen aeltere Browser
       nicht, und ein eckiger Kasten wirkt schwerer als er ist. */
    g.beginPath();
    g.moveTo(rund, 0);
    g.lineTo(breit - rund, 0);
    g.quadraticCurveTo(breit, 0, breit, rund);
    g.lineTo(breit, hoch - rund);
    g.quadraticCurveTo(breit, hoch, breit - rund, hoch);
    g.lineTo(rund, hoch);
    g.quadraticCurveTo(0, hoch, 0, hoch - rund);
    g.lineTo(0, rund);
    g.quadraticCurveTo(0, 0, rund, 0);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    g.fillText(text, 11, hoch / 2 + 1);
    var t = new THREE.Texture(c);
    t.needsUpdate = true;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
    s.scale.set(breit / hoch * SCHILD_HOCH, SCHILD_HOCH, 1);
    return s;
  }

  function masslinie(a, b, text) {
    var linie = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a, b]),
      new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.55 })
    );
    masseGruppe.add(linie);
    var s = schild(text);
    s.position.copy(a).add(b).multiplyScalar(0.5);
    masseGruppe.add(s);
  }

  function masseZeichnen() {
    leeren(masseGruppe);
    if (!Z.masseZeigen) return;
    var V = THREE.Vector3;
    var B = Z.breite / 10, H = Z.hoehe / 10;
    /* Freistehend zaehlt der Statiktraeger zur Tiefe (siehe
       bauenTerrasseGeschaetzt). Die Masslinie beginnt deshalb an seiner
       Rueckseite bei negativem z, nicht an der Dachkante. */
    var hintenZ = (Z.aufbau === 'Freistehend' && !istCarport() && !istPergola())
      ? -11.7 : 0;
    var T = hintenZ + Z.tiefe / 10;
    var vorn = T + 30;
    masslinie(new V(-B / 2, 2, vorn), new V(B / 2, 2, vorn), Z.breite + ' mm');
    var seite = B / 2 + 30;
    masslinie(new V(seite, 2, hintenZ), new V(seite, 2, T), Z.tiefe + ' mm');
    masslinie(new V(-B / 2 - 16, 0, T + 6), new V(-B / 2 - 16, H, T + 6), Z.hoehe + ' mm');
  }

  /* ---------- Modell aufbauen ----------
     Nullpunkt liegt mittig an der Wand auf Bodenhöhe. Die Tiefe läuft
     nach +z (vom Haus weg), die Breite nach +/-x. */
  function bauen() {
    var e = stueckliste();
    /* Gehört das Produkt in die Preisliste, liegt die Antwort aber noch
       nicht vor, bleibt die vorige Zeichnung stehen. Sonst zeichnete hier
       kurz ein Carport, wo ein Terrassendach hingehört. */
    if (!e && datenSystem()) return;
    leeren(bau);
    if (e && !e.fehler) bauenAusDaten(e);
    else if (istPergola()) bauenPergola();
    /* Der Carport TDS ist baulich dasselbe wie ein Terrassendach TDS –
       „das carport tds ist eig, genauso ein terrassendach tds, die
       konfiguration sollte gleich sein" (Betreiber, 11.10.2026). Er läuft
       deshalb über denselben Pfad und bekommt damit echte Stückzahlen
       aus der Maßtabelle statt der Faustregel. bauenGeschaetzt() bleibt
       für die Flachdach-Carports (Flat Line, Flat Box). */
    else if (istCarport() && !istCarportTds()) bauenGeschaetzt();
    else bauenTerrasseGeschaetzt();
    stimmung();
    masseZeichnen();
    kameraAnpassen();
    /* Die Schattenkarte wird NICHT mehr jedes Bild neu gerechnet – das
       ist bei 2048 × 2048 und weichen Schatten der teuerste Posten der
       Schleife. Sie ändert sich nur, wenn sich das Modell oder das Licht
       ändert, also genau hier. */
    renderer.shadowMap.needsUpdate = true;
    /* Nach dem Neubau kann die Wand neu sichtbar oder verschwunden sein –
       dann muss die Durchsicht neu entschieden werden. */
    wandDurchsichtig = null;
    wandDurchsicht();
    bodenDurchsichtig = null;
    bodenDurchsicht();
    neuZeichnen();
  }

  /* ---------- Modell aus der Stückliste ----------
     Für TDS, SkyView und Flat Line. Jede Stückzahl kommt aus bauteile();
     hier wird nichts gezählt und nichts gerundet. Die Querschnitte sind bis
     auf Pfosten und Statikträger geschätzt – siehe daten/offene-punkte.md. */
  function bauenAusDaten(e) {
    var m = e.masse, g = m.geschaetzt;
    /* Gezeichnet wird das KUNDENMASS – gebaut wird danach. Aus dem
       Rasterfeld kommen nur die Stückzahlen (Sparren, Pfosten) und die
       Statik, weil danach abgerechnet wird. Die beiden nicht verwechseln. */
    var pf = m.pfosten.breite / 10;                          // 110 mm, BELEGT
    var spB = g.sparren.breite / 10, spH = g.sparren.hoehe / 10;   // GESCHÄTZT
    var riH = g.rinne.hoehe / 10, riT = g.rinne.tiefe / 10;        // GESCHÄTZT
    var wpH = g.wandprofil.hoehe / 10, wpA = g.wandprofil.ausladung / 10;
    var stH = m.statiktraeger.hoehe / 10, stB = m.statiktraeger.breite / 10;
    /* Freistehend zaehlt der Statiktraeger zur bestellten Tiefe mit, bei
       Wandmontage nicht – dieselbe Regel wie in bauenTerrasseGeschaetzt. */
    var B = Z.breite / 10;                                   // mm -> cm
    var T = Z.tiefe / 10 - (e.freistehend ? stB : 0);

    // BELEGT (Montageanleitung S. 25): Pfostenachse 55 mm hinter der Vorderkante
    var zPfosten = T - e.pfostenachseVonVorderkante / 10;
    var neig = e.geneigt ? neigungGrad() * Math.PI / 180 : 0;
    var hVorn = Z.hoehe / 10;                                // UK Rinne
    var hHinten = hVorn + Math.tan(neig) * T;
    var mAlu = alu();
    var trapez = e.material === 'Trapezblech';

    /* Umgebung */
    belag.scale.set(B + 180, 1, T + (e.freistehend ? 240 : 120));
    belag.position.set(0, -1, (T + 120) / 2 - 60);
    wand.visible = !e.freistehend;
    wand.scale.set(B + 420, hHinten + 190, 1);
    wand.position.set(0, (hHinten + 190) / 2, -12);

    /* Pfosten. Die Verteilung über die Breite ist NICHT belegt
       (offene-punkte.md, Punkt D) – hier gleichmäßig, Eckpfosten bündig. */
    var xP = verteilen(e.pfostenJeReihe, B, pf / 2);
    xP.forEach(function (x) {
      balken(pf, hVorn, pf, x, hVorn / 2, zPfosten, mAlu);
      if (e.freistehend) balken(pf, hHinten, pf, x, hHinten / 2, pf / 2, mAlu);
    });

    /* Rinne vorne über die volle Breite */
    balken(B, riH, riT, 0, hVorn + riH / 2, T - riT / 2, mAlu);

    /* Hinten: Wandprofil bei Wandmontage, sonst Statikträger plus Blende.
       BELEGT (technische-daten.md 11): freistehend ersetzt das Wandprofil
       durch einen Statikträger über die volle Breite samt Blende. */
    /* Das Wandprofil bleibt in BEIDEN Fällen – freistehend wird es an den
       Statikträger geschraubt statt an die Mauer, nicht durch ihn ersetzt
       (Betreiber 11.10.2026). Der Träger steht hochkant an der Stelle der
       Wand, also hinter dem Wandprofil bei negativem z. */
    balken(B, wpH, wpA, 0, hHinten + wpH / 2, wpA / 2, mAlu);
    if (e.freistehend) {
      balken(B, stH, stB, 0, hHinten + wpH - stH / 2, -stB / 2, mAlu);
    }

    /* Sparren: genau e.sparren Stück. Randsparren außen bündig – ANNAHME
       (offene-punkte.md, Punkt C). Länge = Tiefe / cos(Neigung), weil die
       Tiefe das waagerechte Grundrissmaß ist (BELEGT). */
    var xS = verteilen(e.sparren, B, spB / 2);
    var laenge = T / Math.cos(neig);
    var mitteY = (hVorn + hHinten) / 2 + riH * 0.25 + spH / 2;
    xS.forEach(function (x) {
      var sp = new THREE.Mesh(new THREE.BoxGeometry(spB, spH, laenge), mAlu);
      sp.position.set(x, mitteY, T / 2);
      sp.rotation.x = neig;
      sp.castShadow = true; sp.receiveShadow = true;
      bau.add(sp);
    });

    /* Statikträger als Unterzug quer unter den Sparren.
       GESCHÄTZT ist seine Lage in der Tiefe: Die Quelle sagt nur, dass die
       Eindeckung an ihm quer geteilt wird – also muss er dort liegen, wo die
       Fuge sitzt. Mittig ist die einzige Lage, bei der beide Hälften gleich
       lang werden. „unter Rinne" oder „überstehend" sind die belegten
       Varianten; welche hier gilt, ist offen (offene-punkte.md, Punkt F). */
    var zUnterzug = T / 2;
    if (e.eindeckungGeteilt) {
      var yU = hVorn + Math.tan(neig) * (T - zUnterzug) - stH / 2 + 2;
      balken(B, stH, stB, 0, yU, zUnterzug, mAlu);
      balken(B, g.traegerblende.hoehe / 10, g.traegerblende.staerke / 10,
             0, yU + stH / 2 + g.traegerblende.hoehe / 20, zUnterzug + stB / 2, mAlu);
    }

    /* Eindeckung: ein Feld je Sparrenzwischenraum. Bei geteilter Eindeckung
       zwei Platten übereinander mit Fuge am Unterzug. */
    var mFuell = trapez ? trapezblechMaterial() : dachfuellung();
    var yDach = mitteY + spH / 2;
    for (var f = 0; f < xS.length - 1; f++) {
      var mitteX = (xS[f] + xS[f + 1]) / 2;
      var feldB = (xS[f + 1] - xS[f]) - spB;
      if (feldB <= 0) continue;
      if (e.eindeckungGeteilt) {
        [[0, zUnterzug], [zUnterzug, T]].forEach(function (ab) {
          var l = (ab[1] - ab[0]) / Math.cos(neig) - 1.5;
          var zm = (ab[0] + ab[1]) / 2;
          var pl = new THREE.Mesh(new THREE.BoxGeometry(feldB, 1.6, l), mFuell);
          pl.position.set(mitteX, yDach + Math.tan(neig) * (T / 2 - zm), zm);
          pl.rotation.x = neig;
          bau.add(pl);
        });
      } else {
        var platte = new THREE.Mesh(new THREE.BoxGeometry(feldB, 1.6, laenge - 2), mFuell);
        platte.position.set(mitteX, yDach, T / 2);
        platte.rotation.x = neig;
        bau.add(platte);
      }
    }

    /* Flat Line: blickdichtes Blech, dazu die umlaufende Blende */
    if (trapez) {
      var bl = g.blende.hoehe / 10, bs = g.blende.staerke / 10;
      [-B / 2 - bs / 2, B / 2 + bs / 2].forEach(function (x) {
        balken(bs, bl, T, x, hVorn + bl / 2, T / 2, mAlu);
      });
    }

    /* Seitenelemente nur bei den Wandsystemen.

       Die Pfostenachsen MÜSSEN mit – sonst läuft die Schiebeanlage über
       die ganze Vorderseite statt je Pfostenfach. Genau das ist hier
       passiert: Die Aufteilung war nur im geschätzten Pfad eingebaut,
       und dieser Datenpfad rief dieselbe Funktion ohne die Achsen auf.
       Der Rückfall in seitenErweiterungen (zwei Eckpfosten) sieht dann
       aus wie „nicht aufgeteilt" – vom Betreiber im Bild bemerkt
       (11.10.2026). Dasselbe gilt für dachUk und dachVorne: ohne sie
       fehlt der Keil ganz. */
    /* Dachunterkante – dieselbe Rechnung, die unten schon der
       Sonnenschutz und die LED-Spots verwenden. Eine zweite Formel
       daneben würde beim nächsten Umbau auseinanderlaufen. */
    function dachUkDaten(z) {
      return mitteY + Math.tan(neig) * (T / 2 - z) - spH / 2;
    }
    if (!e.freistehend) {
      seitenErweiterungen(B, T, hVorn, pf, neig, dachUkDaten,
                          zPfosten - pf / 2, xP);
    }
    if (!istCarport()) sonnenschutz(B, T, hVorn, neig, pf, {
      tiefe: T,
      ok: function (z) { return yDach + Math.tan(neig) * (T / 2 - z) + 0.8; },
      sparren: xS,
      sparrenB: spB,
      sparrenH: spH,
      sparrenL: laenge,
      uk: dachUkDaten
    });
    else verkleidung(B, T, hVorn - 1, pf);

    if (Z.led) {
      /* In die Sparren, nicht dazwischen: xS sind die Sparrenachsen.
         Die Unterkante des Sparrens liegt spH unter seiner Mitte und folgt
         dem Gefälle. */
      ledInSparren(xS, 0, T, function (z) {
        return mitteY + Math.tan(neig) * (T / 2 - z) - spH / 2;
      });
    }
  }

  /* ---------- Seitliche und vordere Erweiterungen ----------
     Gezeichnet wird, was im Anfrage-Assistenten wählbar ist. Jede Seite
     kann mehrere Teile tragen; sie liegen übereinander, so wie sie auch
     montiert werden:

       Rahmenwand unten, Schiebetür darüber  (Hinweis im Assistenten)
       Keil als Dreieck oben, gleicht das Außengefälle aus
       Senkrechtmarkise und Velaris sitzen VOR der Fläche, sie sind Zubehör

     Die Flügelbreite von 1500 mm für Schiebetüren ist eine ANNAHME für die
     Darstellung – wie viele Flügel es wirklich werden, entscheidet das
     Aufmaß. */
  /* ---------- Glas-Schiebeanlage „Slide Glas 23" (SG23) ----------
     BELEGT: Herstellerunterlage zu SG23, Stand 01.08.2026. Entnommen sind
     ausschließlich Maße und Bauarten – PREISE STEHEN HIER BEWUSST NICHT
     und dürfen auch nicht nachgetragen werden („nur bitte die preise
     nirgendwo übernehmen oder sichtbar machen", Betreiber 11.10.2026).
     Zur Preisfreiheit der Seite siehe scripts/pruefe-keine-preise.sh.

     Vorher stand hier FLUEGEL_BREITE = 150 cm und „Breite / 150,
     gerundet" – GESCHÄTZT. Bei 3500 mm kamen damit 2 Flügel à 1750 mm
     heraus; so breit baut der Hersteller keinen einzigen Flügel.

     Die Anlage gibt es in acht Bauarten, je aus Schienenzahl und
     Flügelzahl. Jede deckt einen eigenen Breitenbereich ab: */
  var SG23 = {
    glasDicke: 1.0,            // cm – 10 mm ESG, unisoliertes Kaltelement
    hoeheMaxAussen: 2450,      // mm – Grenze durch Windlast
    hoeheMaxInnen: 2600,       // mm – ohne Windlast
    breiteSchritt: 500,        // mm – „immer in Schritten von 500 mm"
    /* [Schienen, Flügel, Breite von, Breite bis] in mm */
    bauarten: [
      [3,  2, 1500, 3000],
      [3,  3, 2500, 4000],
      [3,  4, 3000, 5000],
      [4,  4, 3000, 5000],
      [5,  5, 4000, 6000],
      [3,  6, 4000, 6500],
      [4,  8, 3000, 7000],
      [5, 10, 4000, 6000]
    ]
  };

  /* Die Bereiche überlappen sich – zu 4000 mm passen 3-, 4-, 6- und
     8-türig. Welche nehmen?

     „der konfigurator soll immer das am besten passendste für das maß was
     der kunde auswählt nehmen. was von der optik am besten aussieht"
     (Betreiber, 11.10.2026).

     Entschieden wird also nach der SCHEIBENBREITE, nicht nach der Zahl
     der Flügel. Eine 1500 mm breite Scheibe (2-türig bei 3000 mm) wirkt
     schwer und plump, eine 500 mm schmale (10-türig bei 5000 mm) macht
     die Front zum Lamellenvorhang. Dazwischen liegt das, was wie eine
     Tür aussieht.

     ZIEL_SCHEIBE ist eine gestalterische Festlegung, keine
     Herstellerangabe – 1050 mm, also etwa Terrassentürbreite. Mit ihr
     landet jede lieferbare Anlagenbreite zwischen 750 und 1250 mm
     Scheibenbreite; scripts/pruefe-masstabelle.js rechnet das Band für
     alle Breiten bis 7000 mm nach. GEGENZULESEN: Wenn im Verkauf
     eine andere Aufteilung üblich ist, ist das die eine Zahl, die man
     dafür ändert.

     Gleichstand (bei 4000 mm liefern 3-rails-4-türig und
     4-rails-4-türig beide 1000 mm): weniger Schienen gewinnt. Die
     Bodenschiene wird dadurch schmaler, man stolpert über weniger. */
  var ZIEL_SCHEIBE = 1050;   // mm, gestalterisch gesetzt

  /* ---------- Welche Bauart ist in einem Maß möglich? ----------
     KORREKTUR 11.10.2026: „jetzt sind die anderen möglichkeiten weg"
     (Betreiber). Bei einem schmalen Pfostenfach von 2336 mm stand nur
     noch eine einzige Bauart zur Auswahl.

     Ursache war meine Leseart der Unterlage. Dort steht über jeder
     Spalte „Breite bis" – die Spalten sind also OBERGRENZEN, und die
     kleinste Spalte deckt alles darunter mit ab. Ich hatte die kleinste
     Spalte als MINDESTBREITE gelesen: 3-türig „ab 2500 mm". Richtig ist:
     3-türig bis 2500 mm, also auch bei 2336 mm bestellbar.

     Eine untere Grenze gibt es trotzdem, sonst stünden bei 2336 mm auch
     10 Flügel à 234 mm zur Wahl. Als Grenze dient die SCHMALSTE SCHEIBE,
     die die Unterlage selbst führt: 5-rails 10-türig bei 4000 mm, also
     400 mm. Was der Hersteller tabelliert, baut er auch. */
  var SCHEIBE_MIN = 400;     // mm, schmalste Scheibe der Unterlage

  function sg23Passt(b, breiteMm) {
    return breiteMm <= b[3] && breiteMm / b[1] >= SCHEIBE_MIN;
  }

  /* HANDAUSWAHL. „system machts automatisch, aber bei erweiterte
     einstellungen kann man es selbst wählen" (Betreiber, 11.10.2026).

     Die Automatik bleibt der Standard – der Laie soll nichts entscheiden
     müssen, was er nicht beurteilen kann. Wer die Aufteilung kennt,
     findet sie unter „Mehr Einstellungen".

     Passt die Handauswahl zur jeweiligen Seite nicht (links/rechts
     laufen über die Tiefe, vorne über die Breite – das sind zwei
     verschiedene Maße), greift für DIESE Seite wieder die Automatik.
     Eine Bauart zu zeichnen, die es in dieser Breite nicht gibt, wäre
     die schlechtere Antwort als eine Seite anders aufzuteilen. */
  /* Was das Modell je Seite TATSAECHLICH gebaut hat, in mm. Vorher
     rechnete das Bedienfeld selbst: vorne Z.breite, an den Seiten
     Z.tiefe. Beides stimmte nicht.

     Vorne wird seit dem 11.10.2026 je Pfostenfach geteilt – zu einer
     Anlage von 5780 mm lichter Breite stand dort die volle Breite von
     6000 mm, und eine Bauart, die nur zur vollen Breite passt, fiel beim
     Zeichnen still auf Automatik zurueck. Genau das hat der Betreiber
     gemeldet: „das funktioniert nicht auf stirnseite prüfe alle seiten".

     An den SEITEN ist Z.tiefe ebenfalls falsch: Das Element laeuft von
     der Wand bis zur Dachvorderkante, also Tiefe minus Rinne minus
     halber Pfosten, bei Dachvorsprung noch weniger.

     Statt diese Rechnungen im Bedienfeld zu wiederholen – zwei Wahrheiten,
     die auseinanderlaufen – meldet das Modell sie beim Bauen. */
  var SG23_LAENGE = { links: 0, rechts: 0, vorne: 0 };
  var SG23_FELDER = 1;                 // Anzahl Felder auf der Stirnseite

  var SG23_SEITEN = [['links', 'sg23Links', 'k3dSg23Links'],
                     ['rechts', 'sg23Rechts', 'k3dSg23Rechts'],
                     ['vorne', 'sg23Vorne', 'k3dSg23Vorne']];

  /* Welches Maß läuft auf welcher Seite? Links und rechts über die Tiefe,
     vorne über die Breite. */
  /* Das gemeldete Mass gilt. Nur solange noch nichts gebaut wurde,
     greift die grobe Schaetzung – sonst stuende das Feld beim ersten
     Aufruf leer. */
  function sg23Mass(seite) {
    return SG23_LAENGE[seite] || (seite === 'vorne' ? Z.breite : Z.tiefe);
  }

  function sg23Gewaehlt(breiteMm, seite) {
    var wahl = '';
    SG23_SEITEN.forEach(function (p) { if (p[0] === seite) wahl = Z[p[1]]; });
    if (!wahl) return null;
    var teile = wahl.split('|');
    var sch = parseInt(teile[0], 10), fl = parseInt(teile[1], 10);
    var hit = null;
    SG23.bauarten.forEach(function (b) {
      if (b[0] === sch && b[1] === fl && sg23Passt(b, breiteMm)) hit = b;
    });
    return hit;
  }

  function sg23Bauart(breiteMm, seite) {
    var hand = sg23Gewaehlt(breiteMm, seite);
    if (hand) return hand;
    var treffer = null, bestAbstand = Infinity;
    SG23.bauarten.forEach(function (b) {
      if (!sg23Passt(b, breiteMm)) return;
      var abstand = Math.abs(breiteMm / b[1] - ZIEL_SCHEIBE);
      if (abstand < bestAbstand - 0.5 ||
          (Math.abs(abstand - bestAbstand) <= 0.5 && treffer && b[0] < treffer[0])) {
        treffer = b; bestAbstand = abstand;
      }
    });
    return treffer;
  }

  var FLUEGEL_BREITE = 150;   // cm, nur noch Rückfall ohne passende Bauart

  /* Die Vorderseite des Keils darf nicht kleiner als 150 mm sein,
     Rahmen eingerechnet (Angabe des Betreibers, 10.10.2026). Ist der
     Spalt zwischen Elementoberkante und Dach vorne kleiner, wird das
     Element darunter entsprechend kürzer – nicht der Keil schmaler. */
  var KEIL_MIN_VORNE = 15;    // cm, BELEGT durch den Betreiber

  /* Je angefangene 1,5 m Tiefe bekommt der Keil eine Unterteilung: bei
     3 m also eine, bei 4,5 m zwei. Angabe des Betreibers. */
  var KEIL_FELD_MAX = 150;    // cm, BELEGT durch den Betreiber

  /* Mehr als vier Felder gibt es beim Hersteller nicht – mehr als drei
     Sprossen zeigt keine der acht Festelement-Zeichnungen. Damit Keil
     und Rahmenwand übereinanderstehen, gilt die Grenze für beide:
     „dann mach beim keil bei 7000 auch 4 felder wenn der hersteller
     mehr nicht hergibt" (Betreiber, 11.10.2026).

     ACHTUNG, hier stoßen zwei Angaben des Betreibers aneinander: Bei
     7 m Tiefe wird ein Keilfeld damit 1750 mm breit und überschreitet
     die 1,5 m von oben. Gewollt ist die gemeinsame Teilung; ob die
     breiteren Felder zulässig sind, muss VD bestätigen. */
  var KEIL_FELD_ZAHL_MAX = 4;

  function fluegelAnzahl(laenge, seite) {
    var b = sg23Bauart(laenge * 10, seite);    // cm -> mm
    if (b) return b[1];
    /* Außerhalb der lieferbaren Breiten (unter 1500, über 7000 mm):
       die alte Schätzung, damit überhaupt etwas gezeichnet wird. Der
       Hinweis im Bedienfeld sagt dann, dass das Maß nicht lieferbar ist. */
    return Math.max(2, Math.round(laenge / FLUEGEL_BREITE));
  }

  /* Ein Dreieck als Keil. Die Form wird in der XY-Ebene gebaut und dann in
     die Ebene der Seite gedreht – so braucht es nur eine Geometrie für
     Seiten und Stirnseite. */
  /* Keil: die Fläche zwischen der waagerechten Oberkante des
     Seitenelements und der geneigten Dachunterkante.

     Kein Dreieck, sondern ein TRAPEZ: Vorne bleibt zwischen Element und
     Dach ebenfalls ein Spalt, nur ein kleinerer. Als Dreieck gebaut ragte
     der Keil oben über das Dach hinaus – im Bild gut zu sehen, vom
     Betreiber bemerkt.

     Die hohe Seite liegt bei +x; beide Seiten werden gleich gedreht
     (+90° bildet lokal +x auf −z ab, also nach hinten zur Wand). */
  function keilNetz(laenge, hVorne, hHinten, dicke, material) {
    var form = new THREE.Shape();
    form.moveTo(-laenge / 2, 0);
    form.lineTo(laenge / 2, 0);
    form.lineTo(laenge / 2, hHinten);
    form.lineTo(-laenge / 2, hVorne);
    form.closePath();
    var g = new THREE.ExtrudeGeometry(form, { depth: dicke, bevelEnabled: false });
    g.translate(0, 0, -dicke / 2);
    return new THREE.Mesh(g, material);
  }

  /* Ein schmales Band entlang der Dachschräge – die Oberkante der
     Rahmenwand, wenn sie bis ans Dach geht. Gebaut wie der Keil und mit
     derselben Lage und Drehung eingesetzt: So kann die Schräge nicht in
     die falsche Richtung zeigen, ohne dass es auch beim Keil auffiele. */
  function keilBandNetz(laenge, hVorne, hHinten, band, dicke, material) {
    var form = new THREE.Shape();
    form.moveTo(-laenge / 2, hVorne - band);
    form.lineTo(laenge / 2, hHinten - band);
    form.lineTo(laenge / 2, hHinten);
    form.lineTo(-laenge / 2, hVorne);
    form.closePath();
    var g = new THREE.ExtrudeGeometry(form, { depth: dicke, bevelEnabled: false });
    g.translate(0, 0, -dicke / 2);
    return new THREE.Mesh(g, material);
  }

  function seitenErweiterungen(B, T, hVorn, PROFIL, neig, dachUk, dachVorne, pfostenX) {
    var mGlas = seitenglas();
    var mSchiebe = schiebeGlas();
    var mKeil = keilGlas();
    var rahmen = alu();
    function offenSeite(seite) {
      if (seite === 'links') return Z.offenLinks / 100;
      if (seite === 'rechts') return Z.offenRechts / 100;
      if (seite === 'vorne') return Z.offenVorne / 100;
      return Z.glasOffen / 100;
    }
    var mPlanke = blech();

    var mStoff = new THREE.MeshStandardMaterial({
      color: rgb(0x4a4f52), roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });
    /* Der Senkrechtmarkise liegt die EZIP-Stoffliste zugrunde, nicht die
       der Dachmarkise – siehe js/markisenstoffe.js. */
    stoffAuftragen(mStoff, Z.stoffZip, B);

    /* Eine Scheibe oder Platte in der Ebene einer Seite.
       quer = Seite läuft in z-Richtung (links/rechts), sonst in x (vorne). */
    /* Wohin die Teile kommen. Normalerweise direkt ins Modell; beim
       Velaris in die Gruppe des Elements, damit sie sich gemeinsam
       verschieben lässt, ohne neu gebaut zu werden. */
    var zielGruppe = null;

    function platte(material, laenge, hoehe, achse, mitte, yMitte, quer, versatz, dicke) {
      var d = dicke || 1.4;
      var g = quer ? [d, hoehe, laenge] : [laenge, hoehe, d];
      var m = new THREE.Mesh(new THREE.BoxGeometry(g[0], g[1], g[2]), material);
      m.position.set(quer ? achse + (versatz || 0) : mitte,
                     yMitte,
                     quer ? mitte : achse + (versatz || 0));
      m.castShadow = true; m.receiveShadow = true;
      (zielGruppe || bau).add(m);
      return m;
    }

    /* Halbrunde Kassette der Serie Z-R: oben flach, unten rund. Der
       Nullpunkt des Querschnitts liegt in der flachen Oberseite, deshalb
       ist okKas direkt die Oberkante. */
    function zipKassette(laenge, achse, mitte, okKas, quer, versatz) {
      if (!KASSETTE_RUND) {
        platte(rahmen, laenge, ZIP.kassette, achse, mitte,
               okKas - ZIP.kassette / 2, quer, versatz, ZIP.kassette);
        return;
      }
      var g = new THREE.ExtrudeGeometry(zipQuerschnitt(ZIP.kassette / 2),
        { depth: laenge, bevelEnabled: false, curveSegments: 10 });
      g.translate(0, 0, -laenge / 2);
      if (!quer) g.rotateY(Math.PI / 2);        // Stirnseite laeuft in x
      var m = new THREE.Mesh(g, rahmen);
      m.position.set(quer ? achse + (versatz || 0) : mitte, okKas,
                     quer ? mitte : achse + (versatz || 0));
      m.castShadow = true; m.receiveShadow = true;
      (zielGruppe || bau).add(m);
      return m;
    }


    /* ---------- Türschwelle und Schiebetürführung ----------
       BELEGT: SG23-Profilschnitte des Herstellers (Betreiber,
       11.10.2026): „Türschwelle sind die laufschienen unten,
       schiebetürführung ist das was oben ist wo die tür drin läuft".

       Vorher stand hier eine erfundene „Bodenschiene" mit 55 × 60 mm und
       oben gar nichts – die Flügel hingen an einer Rahmenkante in der
       Luft. Jetzt beide Profile mit ihren echten Maßen, und zwar je nach
       Gleiszahl, denn mit jedem Gleis wird das Profil tiefer:

         Türschwelle (unten)      3-fach  76,2 · 4-fach 100,2 · 5-fach 115,5 mm
         Schiebetürführung (oben) 3-gl.   78,4 · 4-gl.  104,0 · 5-gl.  129,6 mm

       Höhen: Schwelle 36 mm (Stege über dem Grundkörper), Führung 35 mm.
       Die Gleiszahl kommt aus der gewählten Bauart – eine 8-türige Anlage
       läuft 4-gleisig und braucht deshalb die tiefere Schwelle. */
    /* Die Schwelle wird EINGELASSEN, nicht aufgesetzt: „das wird ja
       eingelassen in den boden das es barrierefrei is" (Betreiber,
       11.10.2026). Vorher stand sie mit ihren vollen 36 mm auf dem Belag
       – eine Stolperkante, die es in echt nicht gibt, und sie hätte die
       Barrierefreiheit zunichte gemacht, für die das System gebaut wird.

       Gezeichnet wird sie deshalb bis auf einen Hauch unter Belagsniveau.
       Die 2 mm Überstand sind kein Bauteilmaß, sondern Zeichentechnik:
       Läge die Oberfläche exakt auf dem Belag, flimmerten beide Flächen
       ineinander (z-fighting). Sichtbar bleibt damit die Laufschiene als
       Linie im Boden – genau wie in Wirklichkeit. */
    var SCHWELLE = { hoehe: 3.6, ueberstand: 0.2,
                     tiefe: { 3: 7.62, 4: 10.02, 5: 11.55 } };
    var FUEHRUNG = { hoehe: 3.5, tiefe: { 3: 7.84, 4: 10.40, 5: 12.96 } };

    /* ---------- Profile des Flügels ----------
       BELEGT: SG23-Profilschnitte des Herstellers.

         Tür-Einfaßprofil     25 × 35 mm     – Rahmen um den Flügel
         H-Glaseinfaßprofil   19,2 × 61,4 mm – senkrechtes Stoßprofil
         Bürstenprofil        12 × 15,7 mm   – Dichtung

       Vorher lag um die Scheibe eine erfundene Kante von 50 × 50 mm.
       25 mm Tiefe passt auch rechnerisch: 10 mm Glas plus beidseitig
       7,5 mm Profilwange.

       Das Bürstenprofil wird NICHT gezeichnet. Mit 12 mm Breite wäre es
       im Bild kleiner als ein Pixel und kostet nur Rechenzeit; das Maß
       steht hier, damit es nicht verlorengeht. */
    /* Das Tür-Einfaßprofil ist das Profil AN DER WAND – aufgelöst vom
       Betreiber (11.10.2026): „das tür einfassprofil war ja das an der
       wand und die anderen kannst du weglasen".

       Es wird deshalb beim Wandanschluss gebraucht (siehe WANDPR unten)
       und nicht am Flügel. H-Glaseinfaßprofil und Bürstenprofil sind
       damit erledigt und stehen hier nicht mehr – ein Maß ohne Einbauort
       ist kein Wissen, sondern nur Ballast. */
    var TUER_PR = { tiefe: 2.5, hoehe: 3.5 };      // 25 × 35 mm, BELEGT

    /* ---------- Muschelgriff ----------
       „an die vorderste tür an der mn quasi zieht zum aufmachen nen
       runden eingelassenen edelstahlgriff machen also keinen
       herausstehenden wäre ja unlogisch" (Betreiber, 11.10.2026).

       Der Einwand trifft die Bauart: Die Flügel laufen dicht
       aneinander vorbei, ein vorstehender Griff würde am nächsten
       Flügel anschlagen. Deshalb ein Muschelgriff – eine runde
       Edelstahlschale, die IN der Scheibe sitzt und mit ihr bündig
       abschließt.

       RECHERCHIERT (11.10.2026), weil die Unterlage nur „inklusive
       2 Griff" ohne Maß nennt:
         · Durchmesser 50 mm – das ist das übliche Bohrungsmaß für
           Griffmuscheln in Glas (Handelsangaben OBI, Hornbach).
         · Höhe 1050 mm über OFF – die übliche Drückerhöhe. Eine Norm
           für Muschelgriffe gibt es nicht; DIN 18040 nennt für
           barrierefreie Bedienung 850 mm bei einem zulässigen Band von
           750 bis 1200 mm (HEWI-Datenblätter). 1050 mm liegt darin.
       Wer barrierefrei bauen muss, bekommt den Griff tiefer – das ist
       eine Beratungsfrage und steht nicht im Konfigurator.

       Die SEITE des Griffs ergibt sich aus der Laufrichtung: Er sitzt an
       der Kante, die im geschlossenen Zustand außen liegt, also auf der
       dem Stapel abgewandten Seite. Vorher saß er an der Innenkante –
       dort greift niemand. */
    /* Griffhöhe 1100 mm: BELEGT aus dem VD-Anfrageformular SG23
       („Griffhöhe: ☐ 1100 mm Standard, ☐ andere Höhe ___ mm").
       Vorher standen hier 1050 mm aus einer Netzrecherche zur üblichen
       Drückerhöhe – das war eine Annahme und 50 mm daneben. */
    var GRIFF = { durchmesser: 5.0, hoehe: 110, randAbstand: 9 };

    function muschelgriff(achse, lage, yUnten, quer, versatz, dicke) {
      var g = new THREE.Mesh(
        new THREE.CylinderGeometry(GRIFF.durchmesser / 2, GRIFF.durchmesser / 2,
                                   dicke * 1.02, 20),
        new THREE.MeshStandardMaterial({
          color: rgb(0xc9cdd0), roughness: 0.28, metalness: 0.9
        }));
      /* Die Scheibenebene entscheidet, wohin die Zylinderachse zeigt:
         links/rechts steht die Scheibe in der x-Ebene, vorne in der z. */
      if (quer) g.rotation.z = Math.PI / 2;
      else g.rotation.x = Math.PI / 2;
      g.position.set(quer ? achse + (versatz || 0) : lage,
                     yUnten + GRIFF.hoehe,
                     quer ? lage : achse + (versatz || 0));
      g.castShadow = true;
      bau.add(g);
      return g;
    }

    function gleise(seite, laenge) {
      var b = sg23Bauart(laenge * 10, seite);
      return b ? b[0] : 3;
    }

    /* Wohin ist „innen"? Die Achse jeder Seite liegt auf der INNENSEITE
       der Pfosten; von dort aus baut die Schiene nach innen auf.

       „die führungsleisten unten und oben müssen mit der pfosten
       innenseite bündig sein" (Betreiber, 11.10.2026, mit Bild). Vorher
       saßen Schwelle und Führung mittig auf der Achse – die halbe
       Profiltiefe, bei 5 Gleisen also knapp 58 mm, stand nach außen über
       den Pfosten hinaus.

       Vorne läuft „innen" nach -z (zur Hauswand), an den Seiten zur
       Mitte hin, also entgegen dem Vorzeichen der Achse. */
    function innenRichtung(achse, quer) {
      return quer ? (achse > 0 ? -1 : 1) : -1;
    }

    /* Wo genau liegt die Schiene quer zur Seite?

       „nur wenn die schiene dicker wird als der pfosten dann vermitteln"
       (Betreiber, 11.10.2026). Also:

         Schiene schmaler als der Pfosten -> bündig zur Innenseite, sie
         verschwindet damit vollständig hinter dem Pfosten.
         Schiene tiefer als der Pfosten  -> mittig auf dem Pfosten, dann
         steht sie beidseitig gleich weit über statt nur nach außen.

       Betroffen sind die tiefen Profile: die 5-gleisige Schwelle
       (115,5 mm) und die 4- wie 5-gleisige Führung (104 bzw. 129,6 mm)
       gegen 110 mm Pfosten. */
    function schienenVersatz(achse, quer, tiefe) {
      var vz = innenRichtung(achse, quer);
      return (tiefe <= PROFIL) ? vz * tiefe / 2 : -vz * PROFIL / 2;
    }

    /* ok = Oberkante der Schwelle. Ohne Angabe liegt sie im Belag;
       steht die Anlage auf einer Plankenwand, wird deren Oberkante
       uebergeben – sonst bliebe die Schwelle unten liegen, waehrend die
       Tuer darueber anfaengt. */
    function tuerschwelle(laenge, achse, mitte, quer, g, ok) {
      var t = SCHWELLE.tiefe[g] || SCHWELLE.tiefe[3];
      platte(rahmen, laenge, SCHWELLE.hoehe, achse, mitte,
             (ok == null ? SCHWELLE.ueberstand : ok) - SCHWELLE.hoehe / 2,
             quer, schienenVersatz(achse, quer, t), t);
    }

    function schiebefuehrung(laenge, achse, mitte, quer, okOben, g) {
      var t = FUEHRUNG.tiefe[g] || FUEHRUNG.tiefe[3];
      platte(rahmen, laenge, FUEHRUNG.hoehe, achse, mitte,
             okOben - FUEHRUNG.hoehe / 2, quer,
             schienenVersatz(achse, quer, t), t);
    }

    /* Rahmen- und Plankenwand sind keine Schiebeanlage – sie laufen in
       keiner Schwelle. Damit unten trotzdem kein Spalt bleibt, stehen sie
       direkt auf dem Belag; dafür genügt die Schwellenhöhe als Sockel. */
    function bodenschiene(laenge, achse, mitte, quer, ok) {
      var t = SCHWELLE.tiefe[3];
      platte(rahmen, laenge, SCHWELLE.hoehe, achse, mitte,
             (ok == null ? SCHWELLE.ueberstand : ok) - SCHWELLE.hoehe / 2,
             quer, schienenVersatz(achse, quer, t), t);
    }

    /* ---------- Wandanschlussprofil ----------
       „bei glasschiebewänden ich kein abdeckprofil an der wand in
       terrassenüberdachungsfarbe" (Betreiber, 11.10.2026).

       An der Hauswand deckt ein senkrechtes Profil in der Farbe der
       Überdachung die Fuge ab. Es fehlte ganz; die Scheiben endeten frei
       vor der Mauer. Es läuft von der Bodenschiene bis zur Oberkante des
       Elements und gibt es nur an den Seiten (links/rechts), nicht vorne.

       BELEGT: Es ist das SG23 Tür-Einfaßprofil, 25 × 35 mm (Betreiber,
       11.10.2026). Vorher standen hier geschätzte 50 × 25 mm.
       Die 35 mm laufen in der Fläche der Wand, die 25 mm stehen davor –
       dieselbe Tiefe wie die Scheibe samt Luft. */
    var WANDPR_B = TUER_PR.hoehe, WANDPR_T = TUER_PR.tiefe;

    function wandAnschluss(achse, zWand, hOben, quer) {
      if (!quer) return;                       // vorne gibt es keine Wand
      platte(rahmen, WANDPR_T, hOben, achse, zWand + WANDPR_T / 2,
             hOben / 2, true, 0, WANDPR_B);
    }

    /* Schiebetür: einzelne Flügel, die sich übereinander schieben. Nur so
       zeigt der Regler „geöffnet" etwas Echtes – einer bleibt stehen. */
    function schiebetuer(laenge, hoehe, achse, mitte, yUnten, quer, seite, richtung) {
      var n = fluegelAnzahl(laenge, seite);
      var flB = laenge / n;
      var offen = offenSeite(seite);
      /* richtung = -1: die Flügel stapeln sich am linken Ende (Standard,
         so war es immer). richtung = +1: spiegelbildlich am rechten.
         Gebraucht wird das, seit die Vorderseite je Pfostenfach eine
         eigene Anlage ist und von der Mitte nach außen öffnen soll. */
      var rk = (richtung === 1) ? 1 : -1;
      var start = mitte - rk * (laenge / 2 - flB / 2);
      for (var i = 0; i < n; i++) {
        var lage = start + rk * flB * i - rk * offen * flB * i;
        /* Die Flügel laufen IN der Schiene. Seit diese nach innen
           aufbaut, muss auch die Spur dorthin: vorher stand der zweite
           Flügel um 24 mm NACH AUSSEN versetzt, also vor dem Pfosten. */
        var spur = innenRichtung(achse, quer) * (1.5 + (i % 2) * 2.4);
        /* Die Scheibe traegt die Seite, zu der sie gehoert – daran
           erkennt der Klick spaeter, welche Anlage gemeint ist. */
        schiebeTeil(platte(mSchiebe, flB, hoehe, achse, lage, yUnten + hoehe / 2,
                           quer, spur, SG23.glasDicke), seite);
        /* KEIN Rahmen um den Flügel. „bei dem sg23 modell sind nur
           glasschiebetüren du hast da jz aber rahmen dran gemacht das
           ist so falsch" (Betreiber, 11.10.2026, mit Bildschirmfoto).

           Das ist der Punkt des Systems: Die Scheibe läuft rahmenlos,
           sichtbar sind nur Schwelle unten und Führung oben. Ich hatte
           aus den Profilschnitten geschlossen, die Profile lägen um
           jeden Flügel – ein Schluss aus einem Querschnitt auf eine
           Einbaulage, die dort gar nicht steht. Das Tür-Einfaßprofil
           sitzt an der WAND, nicht am Flügel (siehe WANDPR). */

        /* Griff nur am Flügel, der am weitesten fährt – das ist der,
           an dem gezogen wird. i = 0 steht fest, i = n-1 bewegt sich am
           meisten (siehe lage oben). Bei nur einem Flügel ist es
           derselbe. Der Griff sitzt an der ZIEHKANTE, also der vom
           Stapel abgewandten Seite. */
        if (i === n - 1 && hoehe > GRIFF.hoehe + 20) {
          /* Der Griff sitzt an der SCHLIESSKANTE – der Kante, die im
             geschlossenen Zustand am Pfosten bzw. an der Wand anliegt.
             Welche das ist, folgt aus der Laufrichtung und war zweimal
             falsch herum; nachgerechnet am 11.10.2026:

               rk = -1  stapelt nach +x, der ziehende Flügel schließt
                        bei -x  -> Griff an der linken Kante
               rk = +1  stapelt nach -x, er schließt bei +x
                        -> Griff an der rechten Kante

             Also plus rk, nicht minus. „er muss einmal gegenüber"
             (Betreiber). */
          var kante = lage + rk * (flB / 2 - GRIFF.randAbstand);
          schiebeTeil(muschelgriff(achse, kante, yUnten, quer, spur,
                                   SG23.glasDicke), seite);
        }
      }
    }

    /* ---------- Rahmenwand ----------
       Rahmen aus vier Profilen, darin Glas, bei Bedarf durch Sprossen
       geteilt. Welche der acht belegten Aufteilungen genommen wird,
       rechnet das System aus dem lichten Maß aus; in den erweiterten
       Einstellungen lässt sie sich wählen – wie bei den Schiebeanlagen. */
    function rahmenwandTeilung(laengeCm, hoeheCm) {
      var wunsch = parseInt(Z.rahmenTeilung, 10);
      if (!isNaN(wunsch) && RAHMENW_TEILUNGEN[wunsch]) return RAHMENW_TEILUNGEN[wunsch];
      /* Automatik (Betreiber, 11.10.2026): „bei der automatischen
         auswahl soll keine wagrechte sprosse sein und die senkrechten
         sollen sich nach den selben maßen orientieren wie der keil".

         Der Keil bekommt alle KEIL_FELD_MAX (1500 mm, BELEGT) einen
         Pfosten. Die Rahmenwand teilt sich nach derselben Zahl – dann
         stehen Sprosse und Keilpfosten übereinander statt versetzt.
         Waagerechte Sprossen setzt die Automatik keine; von Hand lassen
         sie sich weiterhin wählen.

         Mehr als drei senkrechte Sprossen gibt es beim Hersteller
         nicht. Bei sehr langen Seiten bleibt es deshalb bei vier
         Feldern, auch wenn sie dann breiter als 1500 mm werden – das
         ist eine Grenze der dokumentierten Aufteilungen, keine
         Rechenschwäche. */
      var felder = Math.min(KEIL_FELD_ZAHL_MAX,
                            Math.max(1, Math.ceil(laengeCm / KEIL_FELD_MAX)));
      return [felder - 1, 0];
    }

    /* extraOben(pos) sagt, wie weit es an dieser Stelle noch bis zum Dach
       ist. Damit laufen die senkrechten Profile und die Sprossen bis zur
       Schräge weiter, statt an der Oberkante des Rechtecks aufzuhören –
       „da oben beim dreieck is kein rahmen und der mittelsprossen geht
       nicht bis hoch" (Betreiber, 11.10.2026, mit Bild). */
    function rahmenwand(laenge, hoehe, achse, mitte, yUnten, quer, obenProfil,
                        extraOben) {
      if (laenge <= 2 * RAHMENW.profil || hoehe <= 2 * RAHMENW.profil) return;
      var P = RAHMENW.profil, S = RAHMENW.sprosse, T = RAHMENW.tiefe;
      var t = rahmenwandTeilung(laenge, hoehe);
      var sv = t[0], sh = t[1];
      RAHMENW_IST = { senkrecht: sv, waagerecht: sh, teile: (sv + 1) * (sh + 1),
                      bisDach: false };

      /* Rahmen: links, rechts, oben, unten. Die senkrechten Profile gehen
         bis ans Dach, wo die Wand bis ans Dach geht. */
      function hochBis(pos, grund) {
        var zu = extraOben ? Math.max(0, extraOben(pos)) : 0;
        return grund + zu;
      }
      var xL = mitte - laenge / 2 + P / 2, xR = mitte + laenge / 2 - P / 2;
      var hL = hochBis(xL, hoehe), hR = hochBis(xR, hoehe);
      platte(rahmen, P, hL, achse, xL, yUnten + hL / 2, quer, 0, T);
      platte(rahmen, P, hR, achse, xR, yUnten + hR / 2, quer, 0, T);
      platte(rahmen, laenge, P, achse, mitte, yUnten + P / 2, quer, 0, T);
      /* Das obere Profil entfällt, wenn die Wand ohne Keil bis ans Dach
         geht: Dort schließt das Band entlang der Schräge ab, und ein
         waagerechtes Profil wäre genau die Sprosse, die nicht sein
         soll. */
      if (obenProfil !== false) {
        platte(rahmen, laenge, P, achse, mitte, yUnten + hoehe - P / 2, quer, 0, T);
      }

      /* Lichte Fläche und die Felder darin. */
      /* Ohne oberes Profil reicht die lichte Fläche eine Profilbreite
         höher – dort sitzt kein Rahmen, sondern die Wand läuft weiter
         bis zur Schräge. Sonst endeten Glas und Sprossen 50 mm zu
         tief, und genau das war im Bild zu sehen. */
      var innenB = laenge - 2 * P;
      var innenH = hoehe - P - (obenProfil === false ? 0 : P);
      var feldB = (innenB - sv * S) / (sv + 1);
      var feldH = (innenH - sh * S) / (sh + 1);
      if (feldB <= 0 || feldH <= 0) return;

      var i, j, x, y;
      for (i = 0; i <= sv; i++) {
        for (j = 0; j <= sh; j++) {
          x = mitte - laenge / 2 + P + i * (feldB + S) + feldB / 2;
          y = yUnten + P + j * (feldH + S) + feldH / 2;
          /* Das Glas sitzt in der Mitte der Bautiefe, nicht vorne auf –
             sonst klebte die Scheibe außen am Rahmen. */
          platte(mGlas, feldB, feldH, achse, x, y, quer, 0, RAHMENW.glas);
        }
      }
      /* Sprossen zwischen den Feldern. */
      for (i = 1; i <= sv; i++) {
        x = mitte - laenge / 2 + P + i * feldB + (i - 0.5) * S;
        /* Die Sprosse läuft bis zur Dachschräge durch – sonst hört sie
           mitten in der Fläche auf. */
        var hs = hochBis(x, innenH);
        platte(rahmen, S, hs, achse, x, yUnten + P + hs / 2, quer, 0, T);
      }
      for (j = 1; j <= sh; j++) {
        y = yUnten + P + j * feldH + (j - 0.5) * S;
        platte(rahmen, innenB, S, achse, mitte, y, quer, 0, T);
      }
    }

    /* Plankenwand: waagerechte Rechteckprofile 25 x 70 an Winkeln 40 x 20,
       die an den Pfosten sitzen.

       „anhand der terrassenüberdachung lichten maße wo die planken
       hinkommen, und an den maßen der planken sollen sie gleichmäßig
       verteilt werden" (Betreiber, 11.10.2026): Die Fuge ist deshalb
       KEIN fester Wert. Gerechnet wird andersherum – wie viele Planken
       passen in das lichte Maß, wenn die Fuge ungefähr 10 mm sein soll?
       Diese Zahl wird gerundet, danach ergibt sich die Fuge aus dem Rest.
       Unterste und oberste Planke liegen damit immer bündig am Rand, und
       alle Fugen sind gleich breit. Bliebe die Fuge fest, stünde oben je
       nach Höhe ein unterschiedlich breiter Streifen offen – genau das
       war vorher zu sehen. */
    function plankenTeilung(hoehe) {
      var ziel = (Z.plankenAuto ? FUGE_AUTO : (Z.plankenFuge || 0)) / 10;
      /* Bündig ist ein eigener Fall: Dann gibt es nichts zu verteilen,
         die Planken liegen aufeinander und oben bleibt der Rest offen.
         Alles andere wäre erfunden – ohne Fuge kann man nicht strecken. */
      if (ziel <= 0) {
        return { anzahl: Math.max(1, Math.floor(hoehe / PLANKE.hoehe)), fuge: 0 };
      }
      var n = Math.round((hoehe + ziel) / (PLANKE.hoehe + ziel));
      n = Math.max(1, n);
      /* Mehr Planken als Platz ist unmöglich - lieber eine weniger. */
      while (n > 1 && n * PLANKE.hoehe > hoehe) n--;
      var fuge = n > 1 ? (hoehe - n * PLANKE.hoehe) / (n - 1) : 0;
      return { anzahl: n, fuge: fuge };
    }

    /* Teilhohe Wand („wenn jemand nur zur hälfte planken will oder nur 2/3
       etc.", Betreiber 11.10.2026): Die Teilung bleibt die der VOLLEN
       Höhe – es werden nur Planken weggelassen, nicht die übrigen
       gestreckt. Sonst änderte sich mit dem Regler auch die Fuge, und die
       halbe Wand sähe anders aus als die ganze.
       Minus heißt: oben weglassen, die Wand wächst von unten.
       Plus heißt: unten weglassen, die Wand hängt oben. */
    function plankenAnteil(n) {
      var a = Z.plankenHoeheAuto ? 0 : (Z.plankenAnteil || 0);
      if (!a) return { von: 0, anzahl: n, lage: 'voll' };
      var bleibt = Math.max(1, n - Math.round(Math.abs(a) / 100 * n));
      return a < 0 ? { von: 0, anzahl: bleibt, lage: 'unten' }
                   : { von: n - bleibt, anzahl: bleibt, lage: 'oben' };
    }

    /* ---------- Plankenwand ZUSAMMEN mit Rahmenwand/Schiebetür ----------
       „bei der plankenwnd funktioniert die einstellung der höhe etc
       nicht mehr, das soll funktionieren und die rahmenwand soll sich
       dazu anpassen" (Betreiber, 11.10.2026).

       Vorher nahm die Plankenwand in dieser Kombination starr 34 % der
       Höhe – der Regler „Wie hoch zugesetzt" lief ins Leere.

       Jetzt gilt derselbe Regler wie bei der Plankenwand allein, und er
       bedeutet dasselbe: Er sagt, wie viel WEGGELASSEN wird. Bei −66
       bleiben also 34 % Planken, der Rest darüber ist Rahmenwand bzw.
       Tür. Das Vorzeichen bestimmt wie gewohnt die Lage: nach links
       wachsen die Planken von unten (Rahmenwand darüber), nach rechts
       hängen sie oben (Rahmenwand darunter).

       Der Standard bleibt das bisherige Drittel: „ganz zugesetzt" (0
       bzw. Haken gesetzt) kann hier nicht gelten, sonst bliebe für die
       Rahmenwand nichts übrig. Gerechnet wird über die Plankenzahl der
       VOLLEN Wand, nicht über die nackte Höhe – so bleibt die Fuge
       dieselbe wie bei der ganzen Wand, und die Planken schließen oben
       und unten bündig ab. */
    function plankenKombi(hoch) {
      var a = (Z.plankenHoeheAuto || !Z.plankenAnteil) ? -66 : Z.plankenAnteil;
      var t = plankenTeilung(hoch);
      var schritt = PLANKE.hoehe + t.fuge;
      var bleibt = Math.max(1, t.anzahl - Math.round(Math.abs(a) / 100 * t.anzahl));
      /* Der Rahmenwand muss ein Rest bleiben, sonst steht ein Element
         mit null Höhe im Modell. */
      if (bleibt > t.anzahl - 1) bleibt = Math.max(1, t.anzahl - 1);
      var h = Math.min(bleibt * schritt - t.fuge, hoch * 0.9);
      return { hoehe: h, oben: a > 0 };
    }

    /* Über 7 m gibt es keine Planke am Stück. Geteilt wird GLEICHMÄSSIG -
       zwei Felder zu 3,8 m sehen richtig aus, 7 m plus 0,6 m nicht. Die
       Stoßstelle bekommt ein Zwischenprofil, an dem beide Plankenenden
       sitzen; ohne das hinge das Ende frei in der Luft. */
    function plankenFelder(laenge) {
      var n = Math.max(1, Math.ceil(laenge / PLANKE_MAX));
      if (n === 1) return { anzahl: 1, laenge: laenge };
      return { anzahl: n, laenge: (laenge - (n - 1) * ZWISCHEN.breite) / n };
    }

    function planken(laenge, hoehe, achse, mitte, yUnten, quer, teilbar) {
      if (laenge <= 0 || hoehe < PLANKE.hoehe) return;
      var fe = plankenFelder(laenge);
      if (fe.anzahl > 1) {
        var schrittF = fe.laenge + ZWISCHEN.breite;
        var start = mitte - laenge / 2 + fe.laenge / 2;
        for (var k = 0; k < fe.anzahl; k++) {
          plankenFeld(fe.laenge, hoehe, achse, start + k * schrittF, yUnten, quer, teilbar);
          /* Zwischenprofil in jede Fuge zwischen zwei Feldern */
          if (k < fe.anzahl - 1) {
            zwischenprofil(hoehe, achse, start + k * schrittF + schrittF / 2,
                           yUnten, quer, teilbar);
          }
        }
        PLANKEN_IST.felder = fe.anzahl;
        PLANKEN_IST.feldLaenge = Math.round(fe.laenge * 10);
        return;
      }
      plankenFeld(laenge, hoehe, achse, mitte, yUnten, quer, teilbar);
      PLANKEN_IST.felder = 1;
      PLANKEN_IST.feldLaenge = Math.round(laenge * 10);
    }

    /* Das Zwischenprofil steht senkrecht und geht über die Höhe, die die
       Planken wirklich einnehmen – bei halbhoher Wand also nicht weiter. */
    function zwischenprofil(hoehe, achse, lage, yUnten, quer, teilbar) {
      var t = plankenTeilung(hoehe);
      var schritt = PLANKE.hoehe + t.fuge;
      var a = teilbar === false ? { von: 0, anzahl: t.anzahl }
                                : plankenAnteil(t.anzahl);
      var hoch = a.anzahl * schritt - t.fuge;
      platte(plankeMaterial(ZWISCHEN.breite), ZWISCHEN.breite, hoch, achse, lage,
             yUnten + a.von * schritt + hoch / 2, quer, 0, PLANKE.dicke);
    }

    function plankenFeld(laenge, hoehe, achse, mitte, yUnten, quer, teilbar) {
      var mPlankeWand = plankeMaterial(laenge);
      var t = plankenTeilung(hoehe);
      var schritt = PLANKE.hoehe + t.fuge;
      var a = teilbar === false ? { von: 0, anzahl: t.anzahl, lage: 'voll' }
                                : plankenAnteil(t.anzahl);
      var hoch = a.anzahl * schritt - t.fuge;
      PLANKEN_IST = { anzahl: a.anzahl, gesamt: t.anzahl,
                      fuge: Math.round(t.fuge * 100) / 10,
                      hoehe: Math.round(hoch * 10), lage: a.lage,
                      /* Was offen bleibt, gehört genauso ins Bedienfeld wie
                         das, was zugesetzt ist: „auch maß anzeigen wv mm die
                         entweder von unten sind die planken bis zur
                         ausgewählten höhe und von oben andersherum auch"
                         (Betreiber, 11.10.2026). Gerechnet aus der lichten
                         Höhe, die wirklich gebaut wurde. */
                      frei: Math.max(0, Math.round((hoehe - hoch) * 10)),
                      licht: Math.round(hoehe * 10) };
      /* Unter- und Oberkante werden beim Zeichnen MITGESCHRIEBEN, nicht
         zweimal gerechnet. Der Winkel bekommt genau diese Werte, damit er
         nie höher stehen kann als die Planken, die er trägt – „die winkel
         sollen auch nur so hoch gehen wie die planken nicht höher"
         (Betreiber, 11.10.2026). Eine zweite Rechnung daneben würde
         früher oder später auseinanderlaufen. */
      var uk = null, ok = null;
      for (var i = 0; i < a.anzahl; i++) {
        var yM = yUnten + PLANKE.hoehe / 2 + (a.von + i) * schritt;
        platte(mPlankeWand, laenge, PLANKE.hoehe, achse, mitte, yM, quer, 0, PLANKE.dicke);
        if (uk === null) uk = yM - PLANKE.hoehe / 2;
        ok = yM + PLANKE.hoehe / 2;
      }
      if (uk === null) return;
      plankenWinkel(laenge, ok - uk, achse, mitte, uk, quer, mPlankeWand);
    }

    /* Der Winkel läuft senkrecht am Pfosten hoch; die Planken werden an
       ihn geschraubt. Welcher Schenkel am Pfosten liegt, geht aus der
       Zeichnung nicht hervor – hier liegt der lange (40 mm) am Pfosten in
       der Wandebene, der kurze (20 mm) zeigt nach innen hinter die
       Planken. ANNAHME, gegenzulesen. */
    function plankenWinkel(laenge, hoehe, achse, mitte, yUnten, quer, mPlankeWand) {
      var rIn = innenRichtung(achse, quer);
      var yM = yUnten + hoehe / 2;
      var tief = PLANKE.dicke / 2 + WINKEL.staerke / 2;
      [-1, 1].forEach(function (s) {
        if (laenge < WINKEL.lang * 2.5) return;
        platte(mPlankeWand, WINKEL.lang, hoehe, achse,
               mitte + s * (laenge / 2 - WINKEL.lang / 2), yM, quer,
               rIn * tief, WINKEL.staerke);
        platte(mPlankeWand, WINKEL.staerke, hoehe, achse,
               mitte + s * (laenge / 2 - WINKEL.staerke / 2), yM, quer,
               rIn * (tief + WINKEL.staerke / 2 + WINKEL.kurz / 2), WINKEL.kurz);
      });
    }

    /* Velaris: senkrecht stehende, drehbare Lamellen. Der Winkel folgt dem
       Lamellenregler, damit sichtbar wird, was das System kann. */
    /* Velaris: Rahmen mit waagerechten, kippbaren Lamellen.

       Die Lamellen drehen um ihre LÄNGSACHSE, und die liegt in der Ebene
       des Elements. Beim Seitenelement (quer) zeigt sie in z, vorne in x.
       Deshalb hängt jede Lamelle in einer Gruppe: Die Gruppe dreht das
       Element in die Wandebene, die Lamelle kippt darin. Ohne diese
       Trennung kippen sie beim Seitenelement um die falsche Achse – genau
       das war vorher der Fehler, nur fiel es nicht auf, weil sie dort
       senkrecht standen. */
    function velarisMaterial(laengeCm) {
      var dekor = VELARIS_FARBEN[Z.velarisFarbe];
      var hex = dekor !== undefined ? dekor
              : (Z.velarisFarbe.indexOf('Anthrazit') > -1 ? FARBEN['Anthrazit']
                 : gestellFarbe());
      var m = new THREE.MeshPhysicalMaterial({
        color: rgb(hex),
        metalness: dekor !== undefined ? 0 : 0.1,
        roughness: dekor !== undefined ? 0.78 : 0.6,
        clearcoat: 0.1, clearcoatRoughness: 0.5
      });
      m.envMapIntensity = dekor !== undefined ? 0.2 : 0.4;
      if (dekor !== undefined) maserungAuftragen(m, laengeCm || 100, VELARIS.lamelle);
      return m;
    }

    /* Aufteilung der Anlage in Elemente. BELEGT: ein Element ist
       mindestens 500 und höchstens 1500 mm breit. Also so wenige
       Elemente wie möglich, aber keines breiter als 1500 mm – und
       untereinander gleich breit, so wie die Bilder im Formular es
       zeigen. Unter 500 mm lichter Breite gibt es kein Velaris. */
    function velarisElemente(laengeCm) {
      var mm = laengeCm * 10;
      if (mm < VELARIS.elMin) return 0;
      var moeglich = velarisMoeglich(mm, Z.velarisArt);
      /* Die Automatik nimmt die wenigsten Elemente, die gehen. Bei
         verschiebbar sind das die wenigsten, die sich auch bewegen
         lassen; geht dort gar keines, fällt die Anlage auf feststehend
         zurück – das steht dann unter dem Feld und in der Anfrage. */
      var auto = moeglich.length ? moeglich[0]
               : Math.max(1, Math.ceil(mm / VELARIS.elMax));
      /* Wie bei den Schiebeanlagen: Das System rechnet die Aufteilung
         aus, in den erweiterten Einstellungen lässt sie sich selbst
         wählen – aber nur im Bereich, den der Hersteller zulässt. Ein
         Wunsch, der kein Element zwischen 500 und 1500 mm ergibt, wird
         stillschweigend auf die Automatik zurückgenommen; was wirklich
         gebaut wurde, steht unter dem Feld. */
      var wunsch = parseInt(Z.velarisAnzahl, 10);
      if (!wunsch || isNaN(wunsch)) return auto;
      return moeglich.indexOf(wunsch) > -1 ? wunsch : auto;
    }


    /* Schienen: feststehend braucht keine, dort steht das 1-Schienen-Profil.
       Verschiebbar folgt der Liste im Formular - bis 2 Elemente eine
       Schiene, bis 4 zwei, darüber drei. */
    /* BELEGT aus dem Formular: verschiebbar gibt es nur in diesen sechs
       Kombinationen – 1 Schiene/1, 1/2, 2 Schienen/2, 2/3, 2/4 und
       3 Schienen/3. Fünf Elemente gibt es NUR feststehend (Betreiber,
       11.10.2026: „5 elemente möglich nur bei feststehend, bei schiebbar
       nur so"). Verschiebbar endet damit bei vier Elementen, also bei
       4 × 1500 = 6000 mm Anlagenbreite. */
    function velarisSchienen(n) {
      if (!velarisSchiebbar(n)) return 1;
      return n <= 2 ? 1 : 2;
    }

    /* Wo liegen Kopfprofil und Bodenschiene quer zur Seite?

       „mach es bei schienen die schmaler als der pfosten sind vermittelt
       im pfosten und bei breiteren schienen als der pfosten pfosten
       außen bündig" (Betreiber, 11.10.2026) – vorher standen sie auf der
       Elementebene und schauten seitlich aus dem Pfosten heraus.

         Schiene schmaler als der Pfosten -> mittig auf dem Pfosten
         Schiene breiter als der Pfosten  -> außen bündig, der Überstand
                                             geht nach innen

       ACHTUNG: Für die SG23-Schiebeanlagen gilt eine ANDERE Regel
       (schmaler = bündig innen, breiter = mittig, siehe
       schienenVersatz). Beide stammen vom Betreiber, für verschiedene
       Bauteile. Nicht vereinheitlichen, ohne zu fragen. */
    function velarisVersatz(achse, quer, tiefe) {
      var vz = innenRichtung(achse, quer);
      /* Feststehend liegt die Schiene IMMER außen bündig am Pfosten
         („bei feststehenden velaris kannst du sie bündig pfosten außen
         machen", Betreiber, 11.10.2026) – dort gibt es nur eine Schiene,
         und bündig sieht man von außen nur den Pfosten.
         Verschiebbar bleibt es bei der Regel von vorhin: schmaler als
         der Pfosten mittig, breiter außen bündig. */
      if (Z.velarisArt !== 'verschiebbar') return vz * (tiefe - PROFIL) / 2;
      return tiefe <= PROFIL ? 0 : vz * (tiefe - PROFIL) / 2;
    }

    function velarisSchiebbar(n) {
      return Z.velarisArt === 'verschiebbar' && n <= VELARIS.schiebbarMax;
    }

    function velaris(laenge, hoehe, achse, mitte, yUnten, quer, richtung) {
      if (laenge <= 0 || hoehe <= VELARIS.rahmen * 2) return;
      var anzahl = velarisElemente(laenge);
      if (!anzahl) { VELARIS_IST = { elemente: 0, breite: 0, schienen: 0 }; return; }
      var schienen = velarisSchienen(anzahl);
      VELARIS_IST = { elemente: anzahl,
                      breite: Math.round(laenge * 10 / anzahl),
                      schienen: schienen,
                      /* Gewünscht ist nicht immer möglich: Über vier
                         Elementen gibt es verschiebbar nicht. Was wirklich
                         gebaut wurde, steht hier – daraus liest das
                         Bedienfeld den Hinweis. */
                      art: velarisSchiebbar(anzahl) ? 'verschiebbar' : 'feststehend',
                      gewuenscht: Z.velarisArt,
                      licht: Math.round(laenge * 10) };
      /* Schiene und Kopfprofil über die ganze Anlage – einmal, und auf
         dem Pfosten statt daneben (siehe velarisVersatz). */
      var tOben = VELARIS.tiefeOben[schienen] || VELARIS.tiefeOben[1];
      var tUnten = VELARIS.tiefeUnten[schienen] || VELARIS.tiefeUnten[1];
      platte(rahmen, laenge, VELARIS.kopf, achse, mitte,
             yUnten + hoehe + VELARIS.kopf / 2, quer,
             velarisVersatz(achse, quer, tOben), tOben);
      /* Die Bodenschiene liegt IM Boden, nicht darauf: „bodenschiene ist
         im boden barrierefrei eingelassen" (Betreiber). Ihre Oberkante
         schließt mit dem Belag ab, der Rest steckt darin. */
      platte(rahmen, laenge, VELARIS.bodenSchiene, achse, mitte,
             yUnten - VELARIS.bodenSchiene / 2, quer,
             velarisVersatz(achse, quer, tUnten), tUnten);
      var elLaenge = laenge / anzahl;
      /* Verschiebbar: Die Elemente fahren wie die Glasschiebewände zur
         Seite – ABER nur, soweit die Schienen es zulassen.

         „wenn 2 elemente auf 1 laufweg sind kann man die ja nicht
         ineinander schieben die stoßen ja gegeneinander" (Betreiber,
         11.10.2026). Genau das war falsch: Bisher fuhr jedes Element um
         denselben Betrag, egal auf welchem Laufweg – zwei Elemente auf
         demselben Weg schoben sich glatt ineinander.

         Richtig ist: Element i läuft auf Laufweg i % Schienenzahl.
         Vorbei darf es nur an Elementen auf ANDEREN Wegen. Deshalb wird
         die Lage der Reihe nach gerechnet und jedes Element an dem
         gebremst, das auf SEINEM Weg davor liegt – es darf höchstens
         bündig anstoßen. Daraus folgt von selbst: Auf einem einzigen
         Laufweg bewegt sich nichts, zwei Laufwege lassen je ein Element
         vorbeifahren. */
      var offen = velarisSchiebbar(anzahl) ? Math.min(100, Math.max(0, Z.velarisOffen)) / 100 : 0;
      if (anzahl > 1) {
        var links = mitte - laenge / 2;
        /* Laufrichtung wie bei den Glasschiebewänden: An der Stirnseite
           mit Zwischenpfosten geht jedes Feld nach AUSSEN auf, also vom
           Pfosten in der Mitte weg („auf der stirnseite soll es wie bei
           glasschiebewände sein bei zwischenpfosten gehen die module von
           der mitte nach außen auf", Betreiber, 11.10.2026). An den
           Seiten bleibt es bei der bisherigen Richtung. */
        var rk = (richtung === -1) ? -1 : 1;
        var lagen = velarisLagen(links, elLaenge, anzahl, schienen, offen, rk);
        var zu = velarisLagen(links, elLaenge, anzahl, schienen, 0, rk);
        VELARIS_FAHRT = { gruppen: [], lagenZu: zu, links: links,
                          elLaenge: elLaenge, anzahl: anzahl,
                          schienen: schienen, quer: quer, rk: rk };
        for (var e = 0; e < anzahl; e++) {
          /* Jedes Element in eine eigene Gruppe: Dann verschiebt die
             Animation nur noch deren Position statt alles neu zu bauen. */
          var g = new THREE.Group();
          bau.add(g);
          VELARIS_FAHRT.gruppen.push(g);
          zielGruppe = g;
          velarisElement(elLaenge, hoehe, achse, zu[e],
                         yUnten, quer, schienen, e, e === 0 || offen > 0);
          zielGruppe = null;
          velarisSchieben(g, quer, lagen[e] - zu[e]);
        }
        return;
      }
      velarisElement(laenge, hoehe, achse, mitte, yUnten, quer, schienen, 0, true);
    }

    function velarisElement(laenge, hoehe, achse, mitte, yUnten, quer, schienen, nr,
                            erstes) {
      var mLam = velarisMaterial(laenge);
      var R = VELARIS.rahmen;
      /* Verschiebbare Elemente laufen in getrennten Schienen – im Bild
         ist das der Versatz in der Tiefe. Feststehend liegen alle in
         einer Ebene. */
      /* Jedes Element hängt in SEINEM Laufweg. Die Laufwege liegen
         symmetrisch um die Mitte der Schiene, im Abstand von 51,3 mm –
         der Wert fällt aus den belegten Bautiefen heraus. Gemessen wird
         ab der Schiene, nicht ab dem Pfosten: Sonst läge das Element
         neben seiner eigenen Schiene, sobald diese versetzt sitzt. */
      var vz = innenRichtung(achse, quer);
      var tSchiene = VELARIS.tiefeOben[schienen] || VELARIS.tiefeOben[1];
      var spur = velarisVersatz(achse, quer, tSchiene) +
                 vz * ((nr % schienen) - (schienen - 1) / 2) * VELARIS.schienenAbstand;
      achse = achse + spur;

      /* Das Element hängt: Es beginnt über der Bodenschiene und endet
         unter dem Kopfprofil. Was dazwischen fehlt, ist die Aufhängung –
         genau der Streifen, den die Querschnittzeichnung und die
         Produktbilder oben zeigen. */
      var ukEl = yUnten + VELARIS.bodenSchiene;
      var hEl = hoehe - VELARIS.bodenSchiene - VELARIS.aufhaengung;
      if (hEl <= R * 2) return;

      /* Rahmen: zwei senkrechte Profile an den Seiten, je eines oben und
         unten. Alle vier liegen in der Ebene des Elements. */
      /* Feststehend teilen sich zwei Elemente EINEN Pfosten – so zeigt es
         die Zeichnung im Formular: zwischen zwei Feldern steht ein
         Profil, nicht zwei nebeneinander. Deshalb bekommt nur das erste
         Element sein linkes Profil, die übrigen schließen am rechten des
         Nachbarn an. Verschiebbar laufen die Elemente in eigenen
         Schienen und haben jedes seinen eigenen Rahmen. */
      var linksEigen = erstes || Z.velarisArt === 'verschiebbar';
      if (linksEigen) {
        platte(rahmen, R, hEl, achse, mitte - laenge / 2 + R / 2,
               ukEl + hEl / 2, quer, 0, VELARIS.tiefeUnten[1]);
      }
      platte(rahmen, R, hEl, achse, mitte + laenge / 2 - R / 2,
             ukEl + hEl / 2, quer, 0, VELARIS.tiefeUnten[1]);
      platte(rahmen, laenge, R, achse, mitte, ukEl + R / 2, quer, 0,
             VELARIS.tiefeUnten[1]);
      platte(rahmen, laenge, R, achse, mitte, ukEl + hEl - R / 2, quer, 0,
             VELARIS.tiefeUnten[1]);
      /* Die Aufhängung läuft über die GANZE Elementbreite, nicht als
         kurzes Stück in der Mitte: „es is ja durchgehende schiene pro
         tür etc, bzw. die 2er 3er schiene is ja durchgehend lichtes
         maß" (Betreiber, 11.10.2026). Ein Stummel hätte ein Element
         gezeigt, das an einem Punkt hängt – so hängt es an der Schiene
         über seine volle Länge. Das Kopfprofil darüber geht ohnehin
         durch; es gehört zur Anlage und wird dort gezeichnet. */
      platte(rahmen, laenge, VELARIS.aufhaengung, achse, mitte,
             ukEl + hEl + VELARIS.aufhaengung / 2, quer, 0, 1.6);
      /* Kopfprofil oben und Bodenschiene unten. Ihre BAUTIEFE steht im
         Bestellformular und hängt an der Schienenzahl – bei drei
         Schienen ist das Kopfprofil fast dreimal so tief wie bei einer.
         Genau daran sieht man im Bild, was man bestellt. */
      /* Kopfprofil und Bodenschiene gehören zur ANLAGE, nicht zum
         Element: Sie bleiben stehen, wenn ein Element fährt. Deshalb
         zeichnet sie velaris() einmal über die ganze Länge, nicht
         velarisElement() je Element. */

      /* Lamellen im Lichten des Rahmens. Die Zahl folgt aus der lichten
         Höhe und der Teilung – gleichmäßig, wie bei der Plankenwand. */
      /* Wo KEIN eigenes linkes Profil steht, reichen die Lamellen bis an
         die Elementkante – sonst bliebe dort genau die Lücke stehen, die
         der Betreiber an der Stirnseite gesehen hat (11.10.2026): Das
         Profil war weggelassen, der Platz dafür aber nicht. */
      var licht = hEl - 2 * R;
      var linksRand = linksEigen ? R : 0;
      var lamLaenge = laenge - linksRand - R;
      var lamMitte = mitte + (linksRand - R) / 2;
      var n = Math.max(1, Math.floor(licht / VELARIS.teilung));
      if (n < 1 || lamLaenge <= 0) return;
      var schritt = licht / n;
      /* Teilöffnung: „man kann velars teilöffnen also den unteren oder
         oberen teil oder alles auf oder zu" (Betreiber, 11.10.2026) – so
         zeigt es auch das Produktbild „teilgeöffnet": oben offen, unten
         zu. Die Grenze liegt bei einem Anteil der Lamellenzahl, nicht
         der Höhe: Eine Lamelle lässt sich nicht halb kippen. */
      var gradOben = Math.min(90, Math.max(0, Z.velarisWinkelOben));
      var gradUnten = Math.min(90, Math.max(0, Z.velarisWinkelUnten));
      /* Die Anlage teilt sich IMMER in zwei Hälften – „die velaris sind
         immer in 2 hälften geteilt also 50/50" (Betreiber, 11.10.2026).
         Ein Regler für den Anteil stand hier und ist raus: Er bot eine
         Einstellung an, die es am Bauteil nicht gibt. Bei ungerader
         Lamellenzahl bekommt die untere Hälfte die eine mehr. */
      /* Die Anlage teilt sich IMMER in zwei Hälften (Betreiber,
         11.10.2026). Bei ungerader Lamellenzahl bekommt die untere die
         eine mehr. */
      var grenze = Math.round(n / 2);
      for (var i = 0; i < n; i++) {
        var y = ukEl + R + (i + 0.5) * schritt;
        /* i zählt von UNTEN: die ersten gehören zur unteren Hälfte. */
        var kipp = (90 - (i < grenze ? gradUnten : gradOben)) * Math.PI / 180;
        var lam = new THREE.Mesh(
          new THREE.BoxGeometry(lamLaenge, VELARIS.dicke, VELARIS.lamelle), mLam);
        lam.rotation.x = kipp;
        lam.castShadow = true; lam.receiveShadow = true;
        /* Anklickbar: Am Teil selbst steht, zu welcher Hälfte es gehört –
           nicht an der Klickposition. Sonst öffnete sich die falsche,
           nur weil sie zufällig dahinterliegt. */
        var haelfte = i < grenze ? 'unten' : 'oben';
        lam.userData.velaris = haelfte;
        VELARIS_LAMELLEN.push({ mesh: lam, haelfte: haelfte });
        var g = new THREE.Group();
        g.add(lam);
        if (quer) { g.rotation.y = Math.PI / 2; g.position.set(achse, y, lamMitte); }
        else { g.position.set(lamMitte, y, achse); }
        (zielGruppe || bau).add(g);
      }
    }

    function eineSeite(seite, achse, mitte, laenge, quer, richtung, feldNr) {
      var liste = erwListe(seite);
      if (!liste.length) return;
      /* Die Elemente stehen jetzt IN der Bodenschiene – Unterkante also
         auf deren Oberkante, nicht frei in der Luft. Die Gesamthöhe
         bleibt unverändert, es verschiebt sich nur, was unten sitzt. */
      /* Unterkante auf der Schwelle, Oberkante unter der Führung –
         dazwischen läuft der Flügel. Vorher war oben nichts, die Höhe
         reichte bis unter das Dach. */
      var gl = gleise(seite, laenge);
      /* Oberkante = Rinnenunterkante. Hier stand einmal
         `hVorn - PROFIL / 2`, also eine halbe PFOSTENBREITE abgezogen –
         ein Maß aus der Breite, von einer Höhe abgezogen. Zusammen mit
         der Schiebetürführung blieb dadurch an der Stirnseite ein Spalt
         von rund 90 mm zum Dach: „wieso gehen die glasschiebetüren an
         den stirnseiten nicht oben bis zur rinnenunterkante so entsteht
         sonst ein spalt" (Betreiber, 11.10.2026, mit Bild).

         hVorn ist an dieser Stelle die Rinnenunterkante (der Aufrufer
         übergibt hRinne). Element und Führung zusammen reichen jetzt
         genau bis dorthin. An den Seiten ist das zugleich der tiefste
         Punkt des Daches – darüber schließt der Keil an. */
      var okOben = hVorn;
      /* Die Elemente stehen jetzt praktisch auf dem Belag – die Schwelle
         liegt darin, nicht darauf. Die Durchgangshöhe darunter bleibt
         damit die eingestellte. */
      var yUnten = SCHWELLE.ueberstand;
      var hatSchiebeHier = erwListe(seite).indexOf('Schiebetür') > -1;
      var fuehrungH = hatSchiebeHier ? FUEHRUNG.hoehe : 0;
      var hoch = okOben - yUnten - fuehrungH;
      /* Der Keil läuft IMMER bis nach hinten durch: bei Wandmontage bis
         an die Wand, freistehend bis an den hinteren Pfosten (Angabe des
         Betreibers). Das Element darunter endet dagegen zwischen den
         Pfosten – Keil und Element sind deshalb nicht gleich lang. */
      /* Vorne endet der Keil an der DACHVORDERKANTE, nicht am Ende des
         Seitenelements: Davor sitzt die Rinne, dort ist kein Dach mehr,
         an das er anschließen könnte. Vorher ragte er darüber hinaus und
         stand frei in der Luft – vom Betreiber bemerkt („was gucken da
         für Stangen raus"). */
      var zVorneK = Math.min(mitte + laenge / 2,
                             dachVorne != null ? dachVorne : mitte + laenge / 2);
      /* Hinten endet der Keil jetzt in BEIDEN Fällen bündig bei z = 0.
         Die frühere Ausnahme („freistehend bis an den hinteren Pfosten",
         zHintenK = PROFIL) stammt aus der Zeit, als der hintere Pfosten
         noch unter dem Dach stand. Seit der Statikträger die Wand ersetzt,
         steht er dahinter – ein Versatz nach vorne hinterließe genau die
         Lücke, die der Betreiber an der Wandseite schon beanstandet hat. */
      var zHintenK = 0;
      var keilLaenge = zVorneK - zHintenK;
      var keilMitte = (zVorneK + zHintenK) / 2;
      var hatKeil = liste.indexOf('Keil') > -1 && keilErlaubt() &&
                    seite !== 'vorne' && neig > 0.001 && !!dachUk;
      if (hatKeil) {
        /* Mindesthöhe des Keils vorne einhalten, siehe KEIL_MIN_VORNE.
           Die Schiebetürführung zählt mit: Sie sitzt zwischen Flügel und
           Keil, nimmt also von der Höhe weg, die dem Keil bleibt. */
        var hoechstens = dachUk(zVorneK) - KEIL_MIN_VORNE - yUnten - fuehrungH;
        if (hoch > hoechstens) hoch = Math.max(20, hoechstens);
      }
      var hatRahmen = liste.indexOf('Rahmenwand') > -1;
      var hatSchiebe = liste.indexOf('Schiebetür') > -1;
      var hatPlanken = liste.indexOf('Plankenwand') > -1;

      /* ---------- Plankenwand und Rahmenwand liegen nicht ineinander ----
         „eine rahmenwand und plankenwand dürfen nicht ineinander liegen,
         wenn eine plankenwand vorhanden is, kann die rahmenwand nur bis
         zur plankenwand gehen und nicht in sie rein" (Betreiber,
         11.10.2026, mit Bild).

         Vorher lief die Rahmenwand über die volle Höhe durch, und die
         Planken standen als unteres Drittel DAVOR – zwei Bauteile im
         selben Raum, im Bild sah man die Sprossen durch die Planken.
         Jetzt teilt die Plankenwand die Höhe auf: sie belegt den unteren
         Teil, Rahmenwand bzw. Schiebetür setzen darauf auf. Die
         Gesamthöhe bleibt gleich, nur die Aufteilung ändert sich.

         Dasselbe gilt für die Schiebetür: Eine Tür, die in der
         Plankenwand steckt, ist derselbe Fehler. Ob diese Kombination
         überhaupt angeboten werden soll, ist eine Produktfrage und steht
         in docs/NEXT_TASK.md. */
      var kombi = (hatPlanken && (hatRahmen || hatSchiebe))
        ? plankenKombi(hoch) : null;
      var hPlanke = kombi ? kombi.hoehe : 0;
      var plankeOben = !!(kombi && kombi.oben);
      /* Liegen die Planken oben, beginnt die Rahmenwand unten – sonst
         umgekehrt. Zusammen ergeben beide immer die volle Höhe. */
      var yAuf = yUnten + (plankeOben ? 0 : hPlanke);   // Unterkante Rahmen/Tür
      var hAuf = hoch - hPlanke;                        // was ihr bleibt
      var yPlanke = yUnten + (plankeOben ? hAuf : 0);

      /* Rahmenwand unten, Schiebetür darüber – so steht es als Hinweis im
         Anfrage-Assistenten, und so wird es montiert. */
      if (hatRahmen && hatSchiebe) {
        var unten = hAuf * 0.38;
        rahmenwand(laenge, unten, achse, mitte, yAuf, quer);
        schiebetuer(laenge, hAuf - unten, achse, mitte, yAuf + unten, quer, seite, richtung);
      } else if (hatSchiebe) {
        schiebetuer(laenge, hAuf, achse, mitte, yAuf, quer, seite, richtung);
      } else if (hatRahmen) {
        /* Ohne Keil geht die Wand bis ans Dach – „wie mit keil nur ohne
           waagrechte sprosse" (Betreiber, 11.10.2026, mit Bild). Vorher
           endete sie waagerecht, darüber blieb das Dreieck offen.
           Deshalb: kein oberes Rahmenprofil, stattdessen Glas bis zur
           Schräge und das Rahmenband obendrauf. */
        var bisDach = !hatKeil && quer && seite !== 'vorne' &&
                      neig > 0.001 && !!dachUk;
        var yO = yUnten + hoch;
        rahmenwand(laenge, hAuf, achse, mitte, yAuf, quer, !bisDach,
                   bisDach ? function (pos) { return dachUk(pos) - yO; } : null);
        if (bisDach) {
          var hVo = Math.max(0, dachUk(zVorneK) - yO);
          var hHi = Math.max(0, dachUk(zHintenK) - yO);
          if (hHi > 1) {
            var gl = keilNetz(keilLaenge, hVo, hHi, RAHMENW.glas, mKeil);
            gl.position.set(achse, yO, keilMitte);
            gl.rotation.y = Math.PI / 2;
            gl.castShadow = true; gl.receiveShadow = true;
            bau.add(gl);
            var bd = keilBandNetz(keilLaenge, hVo, hHi, RAHMENW.profil,
                                  RAHMENW.tiefe, rahmen);
            bd.position.set(achse, yO, keilMitte);
            bd.rotation.y = Math.PI / 2;
            bd.castShadow = true; bd.receiveShadow = true;
            bau.add(bd);
            RAHMENW_IST.bisDach = true;
          }
        }
      } else if (hatPlanken) {
        planken(laenge, hoch, achse, mitte, yUnten, quer);
      }
      // Plankenwand zusätzlich zu Rahmen/Schiebe: als unteres Drittel davor
      if (hatRahmen && hatSchiebe) {
        /* Rahmenwand unten, Schiebetür darüber – das untere Band ist
           ebenfalls ein Rahmenelement, kein Blech. */
      }
      if (hPlanke > 0) {
        planken(laenge, hPlanke, achse, mitte, yPlanke, quer, false);
        /* Dem Bedienfeld die WIRKLICHE Lage melden. planken() baut die
           zugewiesene Höhe voll aus und meldet deshalb „volle Höhe" –
           das stimmt für das Plankenband, nicht für die Seite. Was
           darüber (oder darunter) bleibt, ist nicht frei, sondern
           Rahmenwand bzw. Tür; das steht in der Zeile daneben. */
        PLANKEN_IST.lage = plankeOben ? 'oben' : 'unten';
        PLANKEN_IST.frei = 0;
        PLANKEN_IST.licht = Math.round(hoch * 10);
      }

      /* Bodenschiene und Wandanschluss gehören zu jedem geschlossenen
         Element – ohne sie steht die Scheibe frei in der Luft bzw. frei
         vor der Mauer. Eine Senkrechtmarkise bekommt beides NICHT: sie
         läuft in eigenen Führungsschienen und hat unten eine Fallstange. */
      /* Dem Bedienfeld melden, womit hier wirklich gerechnet wurde. */
      if (hatSchiebe) SG23_LAENGE[seite] = Math.round(laenge * 10);

      if (hatRahmen || hatSchiebe || hatPlanken) {
        if (hatSchiebe) {
          /* Steht die Anlage auf Planken, sitzt die Schwelle auf deren
             Oberkante – sonst läge sie unter der Plankenwand. */
          tuerschwelle(laenge, achse, mitte, quer, gl,
                       hPlanke > 0 && !plankeOben ? yAuf : null);
          /* Die Führung sitzt DIREKT auf dem Flügel. Ein fester Platz
             oben am Dach wäre falsch, sobald ein Keil die Elementhöhe
             kürzt – dann hinge sie frei in der Luft. */
          schiebefuehrung(laenge, achse, mitte, quer, yUnten + hoch + fuehrungH, gl);
        } else {
          /* Das untere Abschlussprofil der Rahmenwand – auf dem Belag
             oder, bei Planken darunter, auf deren Oberkante. */
          bodenschiene(laenge, achse, mitte, quer,
                       hPlanke > 0 && !plankeOben ? yAuf : null);
        }
        wandAnschluss(achse, mitte - laenge / 2, yUnten + hoch + fuehrungH, quer);
      }

      // Zubehör VOR der Fläche
      // nach außen, also vom Mittelpunkt weg – unabhängig vom Namen der Seite
      var aussen = (seite === 'vorne' || achse >= 0) ? 4 : -4;
      if (liste.indexOf('Senkrechtmarkise') > -1) {
        /* Aufbau nach der Montageanleitung eZIP 105/125, Abb. 2:
           Kassette oben, je Seite eine Einzelfuehrungsschiene, unten die
           Fallstange am Tuchende. Vorher hing hier ein nacktes Rechteck
           in der Luft. Masse und Herleitung stehen bei ZIP. */
        var hZ = hoch * (Z.sonneAus / 100);
        var okKas = yUnten + hoch;                 // unter der Dachkante
        sonneTeil(zipKassette(laenge, achse, mitte, okKas, quer, aussen));

        [-1, 1].forEach(function (v) {
          var m = mitte + v * (laenge - ZIP.schieneB) / 2;
          sonneTeil(platte(rahmen, ZIP.schieneB, hoch, achse, m,
                 yUnten + hoch / 2, quer, aussen, ZIP.schieneT));
        });

        /* BELEGT (Anleitung S. 5): ab 400 cm Markisenbreite kommt eine
           Kastenunterstuetzung dazu. */
        if (laenge > ZIP.stuetzeAb) {
          sonneTeil(platte(rahmen, 6, 6, achse, mitte, okKas + 3, quer, aussen, 6));
        }

        if (hZ > 5) {
          /* KORREKTUR 11.10.2026: „die senkrechtmarkisen lnks rechts
             haben oben noch so ne durchsichtige lücke die is falsch"
             (Betreiber). Das Tuch begann eine volle Kassettenhoehe
             unter der Oberkante – bei der halbrunden Kassette (Serie
             Z-R) reichte die aber nur mit ihrem RADIUS nach unten. Die
             Differenz stand offen: ein durchsichtiger Streifen zwischen
             Kassette und Tuch.

             Jetzt laeuft das Tuch bis zur Kassettenoberkante durch und
             verschwindet oben HINTER der Kassette – so wie in echt, wo
             es auf der Welle im Kasten sitzt. Damit kann dort keine
             Luecke mehr entstehen, gleich welche Kassettenform
             gezeichnet wird. */
          var tuchH = Math.max(1, hZ);
          sonneTeil(platte(mStoff, laenge - ZIP.schieneB * 2, tuchH, achse, mitte,
                 okKas - tuchH / 2, quer, aussen, 1.2));
          sonneTeil(platte(rahmen, laenge - ZIP.schieneB * 2, ZIP.fallstange, achse,
                 mitte, okKas - tuchH + ZIP.fallstange / 2, quer, aussen, 3.2));
        }
      }
      if (liste.indexOf('Velaris') > -1) {
        /* Die Pfostenachse, nicht die Elementebene: Wo die Schienen
           liegen, hängt am Pfosten – siehe velarisVersatz(). */
        velaris(laenge, hoch, achse, mitte, yUnten, quer, richtung);
      }

      /* Keil: das Dreieck zwischen waagerechter Oberkante des Elements und
         dem geneigten Dach. Ohne Außengefälle gibt es ihn nicht. */
      /* Doppelt gesichert: der Keil wird nur dort gezeichnet, wo es ihn
         geben darf. Die Auswahlliste wird beim Produktwechsel gereinigt –
         diese zweite Bedingung fängt den Fall ab, dass das einmal nicht
         greift. Ein Dreieck im Bild wäre eine Zusage. */
      if (hatKeil) {
        /* Der Keil beginnt ÜBER der Schiebetürführung, nicht über dem
           Flügel. Vorher lag er direkt auf dem Flügel, während die
           Führung weiter oben am Dach hing – dazwischen klaffte der
           Spalt, den der Betreiber im Bild gezeigt hat (11.10.2026:
           „zwischen schiebewand und keil is ne lücke darf nicht sein"). */
        var yKeil = yUnten + hoch + fuehrungH;
        var hV = Math.max(0, dachUk(zVorneK) - yKeil);
        var hH = Math.max(0, dachUk(zHintenK) - yKeil);
        if (hH > 1) {
          var k = keilNetz(keilLaenge, hV, hH, 1.4, mKeil);
          k.position.set(achse, yKeil, keilMitte);
          k.rotation.y = Math.PI / 2;   // beide Seiten gleich: hoch zur Wand
          k.castShadow = true;
          bau.add(k);

          /* Der Keil ist kein nacktes Glasdreieck: er sitzt in einem
             Rahmen in der Farbe der Überdachung. Vom Betreiber
             beanstandet. Rahmenbreite 40 mm GESCHÄTZT. */
          var rb = 4;
          platte(rahmen, keilLaenge, rb, achse, keilMitte, yKeil + rb / 2, quer, 0, rb);
          /* Stirnseiten und Unterteilungen: je angefangene 1,5 m Tiefe
             ein Pfosten im Keil (KEIL_FELD_MAX). */
          var felderK = Math.min(KEIL_FELD_ZAHL_MAX,
                                 Math.max(1, Math.ceil(keilLaenge / KEIL_FELD_MAX)));
          var stiele = [zHintenK + rb / 2, zVorneK - rb / 2];
          for (var fk = 1; fk < felderK; fk++) {
            stiele.push(zHintenK + (keilLaenge / felderK) * fk);
          }
          stiele.forEach(function (zs) {
            var hs = Math.max(0, dachUk(zs) - yKeil);
            if (hs < 1) return;
            var sr = new THREE.Mesh(new THREE.BoxGeometry(rb, hs, rb), rahmen);
            sr.position.set(achse, yKeil + hs / 2, zs);
            sr.castShadow = true;
            bau.add(sr);
          });
          var schraegL = Math.sqrt(keilLaenge * keilLaenge + (hH - hV) * (hH - hV));
          var sg = new THREE.Mesh(new THREE.BoxGeometry(rb, rb, schraegL), rahmen);
          sg.position.set(achse, yKeil + (hV + hH) / 2 - rb / 2, keilMitte);
          /* Vorzeichen: Eine POSITIVE Drehung um x senkt das Ende bei +z –
             und +z ist vorne. Die Schräge muss vorne tief und hinten hoch
             sein, also positiv. Mit dem Minus davor stieg sie nach vorne
             an, schnitt durch die Dachfläche und ragte vorne heraus: die
             „gespiegelte" Stange, die der Betreiber dreimal gemeldet hat. */
          sg.rotation.x = Math.atan2(hH - hV, keilLaenge);
          sg.castShadow = true;
          bau.add(sg);
        }
      }
    }

    /* ---------- Welche Seite ist links? ----------
       Links und rechts werden so bestimmt, wie man auf der Terrasse mit
       dem Rücken zur Wand steht und nach draußen schaut. Wer so steht,
       blickt in +z; links liegt dann bei +x.

       Vorher war es umgekehrt: Der Besucher wählte „links" und im Modell
       erschien die rechte Seite – und genau so wäre es auch in die
       Anfrage und ins Angebot gegangen. Vom Betreiber bemerkt. */
    /* Vorne enden Seitenelement UND Keil an derselben Stelle: an der
       DACHVORDERKANTE, also an der Rückwand der Rinne.

       Genau hier steckte die Stange, die der Betreiber dreimal bemängelt
       hat. Zwei Anläufe lagen daneben:
         · Element bis T − Pfostenbreite, Keil bis zur Dachkante: die
           Oberkante des Elements ragte gut 7 cm über den Keil hinaus.
         · Beide bis zur Rückseite des vorderen Pfostens: Die liegt vor
           der Dachkante – dort ist kein Dach mehr, an das der Keil
           anschließen könnte, und die Schräge hing frei.

       Beides ist überholt: Seit dem 11.10.2026 endet das Element an der
       HINTEREN PFOSTENFLÄCHE, nicht an der Dachkante. Über dem Stück
       dazwischen liegt die Rinne, das Element hängt dort also nicht frei
       – und der Spalt zum Pfosten ist weg. Siehe den Aufruf in
       bauenTerrasseGeschaetzt.

       HINTEN beginnt das Element bei z = 0, also an der Wand. Vorher
       begann es bei PROFIL und ließ damit 11 cm Luft zur Hauswand stehen
       – vom Betreiber beanstandet: „die senkrechtmarkisen haben spalt zur
       wand, das muss auch bündig sein". Freistehend steht dort der hintere
       Pfosten, dessen Rückseite ebenfalls bei z = 0 liegt; derselbe Wert
       passt also für beide Fälle. */
    var vorne = (dachVorne != null) ? dachVorne : T - PROFIL;
    var hinten = 0;
    var seitenMitte = (hinten + vorne) / 2;
    var seitenLaenge = vorne - hinten;

    SG23_LAENGE.links = SG23_LAENGE.rechts = SG23_LAENGE.vorne = 0;
    VELARIS_LAMELLEN = [];
    VELARIS_FAHRT = null;
    eineSeite('links',   B / 2 - PROFIL / 2, seitenMitte, seitenLaenge, true);
    eineSeite('rechts', -B / 2 + PROFIL / 2, seitenMitte, seitenLaenge, true);

    /* ---------- Vorderseite: ein Feld je Pfostenfach ----------
       „wenn wir ein mittelpfosten haben wie hier oder mehrre pfosten,
       müssen für die schiebeanlage jeweils die lichten maße von pfosten
       zu pfosten genommen werden, also werden es quasi mehrere
       schibeanlagen. und die sollen dann von innen nach außen öffnen
       also von dermitte zu den rändern links und rechts sliden"
       (Betreiber, 11.10.2026).

       Vorher lief über die ganze Vorderseite EINE Anlage – über die
       Mittelpfosten hinweg, was baulich nicht geht. Jetzt wird je Fach
       zwischen zwei Pfosten eine eigene Anlage gerechnet, mit dem
       LICHTEN Maß: Pfostenachsen minus je eine halbe Pfostenbreite.

       Das ändert auch die Stückzahlen: Aus 6000 mm in einem Stück
       (8-türig) werden zwei Felder à rund 2890 mm (je 3-türig). Genau
       so wird es auch bestellt – die Anfrage-Mail nennt deshalb jedes
       Feld einzeln.

       Öffnungsrichtung: von der Mitte nach außen. Felder links der Mitte
       schieben nach links, Felder rechts der Mitte nach rechts. Ein Feld
       GENAU in der Mitte (ungerade Pfostenzahl gibt es nicht, aber ein
       einzelnes Feld über die volle Breite schon) behält die
       Voreinstellung. */
    var achsen = (pfostenX && pfostenX.length > 1)
      ? pfostenX.slice().sort(function (a, b) { return a - b; })
      : [-B / 2 + PROFIL / 2, B / 2 - PROFIL / 2];
    SG23_FELDER = Math.max(1, achsen.length - 1);
    for (var f = 0; f < achsen.length - 1; f++) {
      var lichtVon = achsen[f] + PROFIL / 2;
      var lichtBis = achsen[f + 1] - PROFIL / 2;
      var feldMitte = (lichtVon + lichtBis) / 2;
      var feldLaenge = lichtBis - lichtVon;
      if (feldLaenge <= 0) continue;
      /* Laufrichtung. rk = +1 stapelt nach -x (links), rk = -1 nach +x
         (rechts) – nachgerechnet, nicht geschätzt.

           Feld links der Mitte  -> nach links   -> +1
           Feld rechts der Mitte -> nach rechts  -> -1
           EIN Feld über die ganze Breite (kein Mittelpfosten, feldMitte
           liegt dann bei 0) -> nach links, wie es vorher auch war.

         Der letzte Fall ist der Grund für „> 0" statt „< 0": Bei einer
         Abfrage auf „< 0" fiele das einzelne Feld in den rechten Zweig
         und öffnete auf einmal andersherum als bisher. Genau das ist am
         11.10.2026 passiert („sie geht jz zur falschen seite auf") – ich
         hatte beim Griff-Fehler zwei Dinge geändert, obwohl nur eines
         falsch war. */
      eineSeite('vorne', vorne, feldMitte, feldLaenge, false,
                feldMitte > 0 ? -1 : 1, f);
    }
  }

  /* ---------- Aufdachmarkise TDS Linea A / Linea AZ ----------
     Maße aus der technischen Zeichnung des Herstellers
     („TDS_Linea A - Linea AZ", Stand 01.07.2025), vom Betreiber am
     10.10.2026 geschickt. BELEGT sind daraus:
       · Bestellmaß Breite = Dachbreite, Bestellmaß Tiefe = Dachtiefe –
         die Markise läuft also über die ganze Dachfläche, nicht nur über
         einen Teil davon
       · Kassette 158 mm hoch, Korpus 150 mm
       · Führungsschiene 87 mm hoch; die Seitensparren darunter 61 mm
       · 37 mm von der Außenkante bis zur Befestigungsachse
       · Stütze: 75 mm von der Dachfläche bis zur Schienenunterkante,
         Säule 80 mm, Fußplatte 100 mm breit, 6 mm dick
       · erste Stütze 345–395 mm hinter dem Kassettenende, letzte
         150–1000 mm vor dem vorderen Ende, dazwischen gleichmäßig („=")

     GESCHÄTZT ist allein die Kassettentiefe (~230 mm, aus der Zeichnung
     abgegriffen – sie ist dort nicht bemaßt) sowie Tuchdicke und Farbe.

     Warum eine eigene Gruppe: Die Markise liegt AUF der Dachfläche und
     folgt deren Gefälle. Alles in einer um `neig` gedrehten Gruppe zu
     rechnen ist der einzige Weg, bei dem Stützenhöhe und Schienenlage
     Maße der Zeichnung bleiben und nicht jedes Mal neu mit dem Gefälle
     verrechnet werden müssen. */
  var MARKISE = {
    kasHoehe:      15.8,   // 158 mm BELEGT
    kasTiefe:      23.0,   // ~230 mm GESCHÄTZT (in der Zeichnung ohne Maß)
    schieneH:       8.7,   // 87 mm BELEGT
    schieneB:       6.1,   // 61 mm BELEGT (Breite des Seitensparrens)
    stuetzeH:       7.5,   // 75 mm BELEGT
    saeuleB:        8.0,   // 80 mm BELEGT
    platteB:       10.0,   // 100 mm BELEGT
    platteD:        0.6,   // 6 mm BELEGT
    ersteStuetze:  37.0,   // min. 345 / max. 395 mm BELEGT – Mitte genommen
    letzteStuetze: 25.0,   // min. 150 / max. 1000 mm BELEGT – innerhalb
    feldMax:      100.0    // max. 1000 mm BELEGT zwischen zwei Stützen
  };

  /* Querschnitt der Kassette in der XY-Ebene: x = Tiefe ab der Wandseite,
     y = Höhe ab Kassettenunterkante. Die Form ist aus der Seitenansicht
     der Zeichnung abgezeichnet: hinten rund, vorne fast senkrecht – dort
     tritt das Tuch aus. Eine Box sähe an dieser Stelle falsch aus, weil
     die runde Kassette das ist, was man vom Dach aus sieht. */
  function markisenKassette() {
    var t = MARKISE.kasTiefe, h = MARKISE.kasHoehe;
    var f = new THREE.Shape();
    f.moveTo(t, h);
    f.lineTo(t * 0.34, h);
    f.quadraticCurveTo(t * 0.06, h * 0.97, t * 0.035, h * 0.66);
    f.quadraticCurveTo(t * 0.012, h * 0.34, t * 0.14, h * 0.13);
    f.quadraticCurveTo(t * 0.27, h * -0.03, t * 0.47, h * 0.06);
    f.quadraticCurveTo(t * 0.66, h * 0.16, t * 0.81, h * 0.33);
    f.lineTo(t, h * 0.45);
    f.closePath();
    return f;
  }

  /* B = Dachbreite, neig = Dachneigung, aus = Ausfahrgrad 0..1,
     dach.ok(z) = Oberkante der Eindeckung bei der Tiefe z,
     dach.tiefe = überdachte Tiefe (waagerecht gemessen). */
  function aufdachmarkise(B, neig, aus, mStoff, dach) {
    var M = MARKISE, mAlu = alu();
    var L = dach.tiefe / Math.cos(neig);        // Länge IN der Dachebene
    var mk = new THREE.Group();
    mk.userData.sonne = true;          // im Bild anklickbar
    mk.position.set(0, dach.ok(0), 0);
    mk.rotation.x = neig;
    bau.add(mk);

    function teil(mesh) {
      mesh.castShadow = true; mesh.receiveShadow = true;
      mk.add(mesh);
      return mesh;
    }

    var ukSchiene = M.stuetzeH;                 // über der Dachfläche
    var okSchiene = ukSchiene + M.schieneH;
    /* Die Schienen sitzen auf den äußeren Sparren – deren Achse liegt
       30 mm vom Rand (Montageanleitung S. 33), die Schiene ist 61 mm
       breit und schließt damit außen bündig ab. */
    var xS = [B / 2 - M.schieneB / 2, -B / 2 + M.schieneB / 2];
    var schieneL = L - 1;

    xS.forEach(function (x) {
      teil(new THREE.Mesh(
        new THREE.BoxGeometry(M.schieneB, M.schieneH, schieneL), mAlu))
        .position.set(x, ukSchiene + M.schieneH / 2, schieneL / 2 + 0.5);
    });

    /* Kassette über die volle Dachbreite. Ihre Oberkante schließt mit der
       Schienenoberkante ab (Zeichnung: 158 mm Kassette, 87 mm Schiene auf
       75 mm Stütze – die Unterkante bleibt knapp über dem Glas). */
    var gk = new THREE.ExtrudeGeometry(markisenKassette(),
      { depth: B, bevelEnabled: false, curveSegments: 8 });
    gk.rotateY(-Math.PI / 2);
    gk.translate(B / 2, okSchiene - M.kasHoehe, 0.5);
    teil(new THREE.Mesh(gk, mAlu));

    /* Stützen gleichmäßig zwischen erster und letzter Lage */
    var z1 = M.kasTiefe + M.ersteStuetze;
    var z2 = Math.max(z1 + 1, L - M.letzteStuetze);
    var felder = Math.max(1, Math.ceil((z2 - z1) / M.feldMax));
    for (var i = 0; i <= felder; i++) {
      var z = z1 + (z2 - z1) * i / felder;
      xS.forEach(function (x) {
        teil(new THREE.Mesh(new THREE.BoxGeometry(
          M.platteB, M.platteD, M.platteB), mAlu))
          .position.set(x, M.platteD / 2, z);
        teil(new THREE.Mesh(new THREE.BoxGeometry(
          M.saeuleB, ukSchiene - M.platteD, M.saeuleB * 0.55), mAlu))
          .position.set(x, M.platteD + (ukSchiene - M.platteD) / 2, z);
      });
    }

    /* Das Tuch läuft zwischen den Schienen aus der Kassette nach vorne.
       Es sitzt IN der Schiene, nicht darüber – deshalb liegt es auf
       knapp zwei Dritteln der Schienenhöhe. */
    if (aus > 0.02) {
      var start = M.kasTiefe * 0.95;
      var lang = Math.max(1, (L - start - 2) * aus);
      var tuchB = Math.max(1, B - M.schieneB * 2 - 0.6);
      var yTuch = ukSchiene + M.schieneH * 0.62;
      /* TUCHDICKE 14 mm, nicht 3 mm: Ein 3 mm dünner Körper fällt im
         Schattenpuffer durch die Tiefenkorrektur (shadow.bias −0,0004 bei
         far = 2200 entspricht rund 9 mm) und wirft dann keinen Schatten
         mehr. Der Betreiber hat genau das gemeldet: „die markisen machen
         iwi keinen schatten in der überdachung". 14 mm sind für ein Tuch
         mit Saum und Wickelwelle auch realistischer. */
      var tuch = new THREE.Mesh(
        new THREE.BoxGeometry(tuchB, 1.4, lang), mStoff);
      tuch.position.set(0, yTuch, start + lang / 2);
      tuch.castShadow = true; tuch.receiveShadow = true;
      mk.add(tuch);
      /* Ausfallprofil am vorderen Tuchende */
      teil(new THREE.Mesh(
        new THREE.BoxGeometry(tuchB + 1.2, 5.4, 3.2), mAlu))
        .position.set(0, yTuch - 1.6, start + lang);
    }
  }

  /* ---------- Unterdachmarkise TDS Linea U / Linea UZ ----------
     Maße aus der technischen Zeichnung des Herstellers
     („TDS_Linea U - Linea UZ", Stand 01.07.2025), vom Betreiber am
     11.10.2026 geschickt. BELEGT sind daraus:
       · Bestellmaß Breite = Dachbreite − 142 mm
       · Bestellmaß Tiefe  = Sparrenlänge − 45 mm (ausdrücklich „TDS:")
       · Kassette 162 mm hoch, Korpus 150 mm, Tiefe 238 mm (oben 227 mm)
       · Kasten/Endkappe vorne 80 mm hoch, Endkappe 41 mm
       · Konsole 19 mm über der Kastenoberkante, 5 mm Luft zur
         Sparrenunterkante, Säule 80 mm, Fußplatte 100 mm
       · 10 mm Luft zwischen Sparren-Innenkante und Markisenkante
       · 37 mm von der Markisenkante bis zur Befestigungsachse
       · erste Konsole 345–395 mm hinter der Kassette, letzte
         150–1000 mm vor dem Ende, dazwischen gleichmäßig („=")

     Die 142 mm sind ein unabhängiger Gegenbeleg für unser Sparrenraster:
     Achse 30 mm vom Rand (Montageanleitung S. 33) plus halbe Sparren-
     breite 30,5 mm ergibt die Innenkante bei 60,5 mm, also ein Innenmaß
     von B − 121 mm; abzüglich zweimal 10 mm Luft bleibt B − 141 mm. Die
     Zeichnung sagt 142. Zwei Wege, dieselbe Zahl.

     GESCHÄTZT sind: die Breite der seitlichen Führungsschienen (in
     dieser Zeichnung nicht bemaßt) und die Frage, WO die 45 mm Abzug in
     der Tiefe sitzen – hier je zur Hälfte vorne und hinten.

     Widerspruch in der Zeichnung, GEGENZULESEN: Von der Sparren-
     Innenkante bis zur Befestigungsachse wären es 10 + 37 = 47 mm,
     bemaßt sind 60 mm. Vermutlich meinen die 60 mm die Außenkante der
     Konsole, nicht die Achse. Fürs Modell ohne Folgen, fürs Aufmaß nicht. */
  var MARKISE_U = {
    kasHoehe:      16.2,   // 162 mm BELEGT
    kasTiefe:      23.8,   // 238 mm BELEGT (oben 227 mm)
    kastenH:        8.0,   // 80 mm BELEGT
    endkappe:       4.1,   // 41 mm BELEGT
    konsoleH:       1.9,   // 19 mm BELEGT
    luftSparren:    0.5,   // 5 mm BELEGT
    saeuleB:        8.0,   // 80 mm BELEGT
    platteB:       10.0,   // 100 mm BELEGT
    platteD:        0.6,   // GESCHÄTZT, wie bei Linea A
    schieneB:       6.0,   // GESCHÄTZT, in dieser Zeichnung ohne Maß
    breiteAbzug:   14.2,   // 142 mm BELEGT
    tiefeAbzug:     4.5,   // 45 mm BELEGT
    ersteKonsole:  37.0,   // min. 345 / max. 395 mm BELEGT
    letzteKonsole: 25.0,   // min. 150 / max. 1000 mm BELEGT
    feldMax:      100.0    // max. 1000 mm BELEGT
  };

  /* Querschnitt der Kassette, gespiegelt zur Aufdachmarkise: Sie hängt
     unter dem Dach, die Rundung zeigt nach unten, die Oberkante ist
     gerade und liegt an den Konsolen an. x = Tiefe ab der Wandseite,
     y = Höhe ab Kassettenunterkante. */
  function markisenKassetteU() {
    var t = MARKISE_U.kasTiefe, h = MARKISE_U.kasHoehe;
    var f = new THREE.Shape();
    f.moveTo(t, h);
    f.lineTo(t * 0.33, h);
    f.quadraticCurveTo(t * 0.06, h * 0.97, t * 0.035, h * 0.66);
    f.quadraticCurveTo(t * 0.012, h * 0.34, t * 0.14, h * 0.13);
    f.quadraticCurveTo(t * 0.27, h * -0.03, t * 0.47, h * 0.06);
    f.quadraticCurveTo(t * 0.66, h * 0.16, t * 0.81, h * 0.33);
    f.lineTo(t, h * 0.45);
    f.closePath();
    return f;
  }

  /* B = Dachbreite, neig = Dachneigung, aus = Ausfahrgrad 0..1,
     dach.uk(z) = Unterkante der Sparren bei der Tiefe z,
     dach.sparrenL = Sparrenlänge in der Dachebene. */
  function unterdachmarkise(B, neig, aus, mStoff, dach) {
    var M = MARKISE_U, mAlu = alu();
    var L = Math.max(60, dach.sparrenL - M.tiefeAbzug);   // Bestellmaß Tiefe
    var z0 = M.tiefeAbzug / 2;                            // GESCHÄTZT: halbe/halbe
    var breite = Math.max(60, B - M.breiteAbzug);         // Bestellmaß Breite

    var mu = new THREE.Group();
    mu.userData.sonne = true;          // im Bild anklickbar
    mu.position.set(0, dach.uk(0), 0);
    mu.rotation.x = neig;
    bau.add(mu);

    function teil(mesh) {
      mesh.castShadow = true; mesh.receiveShadow = true;
      mu.add(mesh);
      return mesh;
    }

    /* Alles hängt unter der Sparrenunterkante (y = 0), deshalb negativ. */
    var okKasten = -(M.luftSparren + M.konsoleH);
    var ukKasten = okKasten - M.kastenH;
    var xS = [breite / 2 - M.schieneB / 2, -breite / 2 + M.schieneB / 2];

    /* Seitliche Führungsschienen über die ganze Tiefe */
    xS.forEach(function (x) {
      teil(new THREE.Mesh(
        new THREE.BoxGeometry(M.schieneB, M.kastenH, L), mAlu))
        .position.set(x, ukKasten + M.kastenH / 2, z0 + L / 2);
    });

    /* Kassette hinten, Oberkante bündig mit der Kastenoberkante */
    var gk = new THREE.ExtrudeGeometry(markisenKassetteU(),
      { depth: breite, bevelEnabled: false, curveSegments: 8 });
    gk.rotateY(-Math.PI / 2);
    gk.translate(breite / 2, okKasten - M.kasHoehe, z0);
    teil(new THREE.Mesh(gk, mAlu));

    /* Endkappe vorne, 80 mm hoch */
    teil(new THREE.Mesh(
      new THREE.BoxGeometry(breite, M.kastenH, M.endkappe), mAlu))
      .position.set(0, ukKasten + M.kastenH / 2, z0 + L - M.endkappe / 2);

    /* Konsolen: sie greifen nach OBEN an die Sparren, nicht nach unten
       auf das Dach – das ist der Unterschied zur Aufdachmarkise. */
    var z1 = z0 + M.kasTiefe + M.ersteKonsole;
    var z2 = Math.max(z1 + 1, z0 + L - M.letzteKonsole);
    var felder = Math.max(1, Math.ceil((z2 - z1) / M.feldMax));
    for (var i = 0; i <= felder; i++) {
      var z = z1 + (z2 - z1) * i / felder;
      xS.forEach(function (x) {
        teil(new THREE.Mesh(new THREE.BoxGeometry(
          M.platteB, M.platteD, M.platteB), mAlu))
          .position.set(x, -M.platteD / 2, z);
        teil(new THREE.Mesh(new THREE.BoxGeometry(
          M.saeuleB, M.konsoleH, M.saeuleB * 0.55), mAlu))
          .position.set(x, okKasten + M.konsoleH / 2, z);
      });
    }

    /* Das Tuch läuft im Kasten zwischen den Schienen nach vorne.
       Von unten sieht man genau das – deshalb liegt es knapp unter der
       Kastenmitte. */
    if (aus > 0.02) {
      var start = z0 + M.kasTiefe * 0.95;
      var lang = Math.max(1, (z0 + L - start - M.endkappe) * aus);
      var tuchB = Math.max(1, breite - M.schieneB * 2 - 0.6);
      var yTuch = ukKasten + M.kastenH * 0.38;
      /* castShadow hat hier GEFEHLT – das Tuch hing unter dem Dach und
         warf keinen Schatten auf die Terrasse, obwohl es genau dafür da
         ist. Zur Tuchdicke siehe die Aufdachmarkise. */
      var tuch = new THREE.Mesh(
        new THREE.BoxGeometry(tuchB, 1.4, lang), mStoff);
      tuch.position.set(0, yTuch, start + lang / 2);
      tuch.castShadow = true; tuch.receiveShadow = true;
      mu.add(tuch);
      /* Ausfallprofil am vorderen Tuchende */
      teil(new THREE.Mesh(
        new THREE.BoxGeometry(tuchB + 1.2, 4.6, 3.2), mAlu))
        .position.set(0, yTuch - 1.2, start + lang);
    }
  }

  /* ---------- Sonnensegel und Plissee ----------
     Farben und Aufbau stammen aus den Bestellformularen von VD
     AluSysteme (Betreiber, 11.10.2026). Angekreuzt werden kann nur, was
     hier steht – eine sechste Segelfarbe gibt es nicht.

     Sonnensegel: Bahnen zwischen den Sparren, die in Wellen durchhängen.
     Bestellt wird je Bahn Breite und Länge, bis zu 15 Bahnen, dazu „ohne
     oder mit Verstärkung", die Installationsart (Holz / Aluminium oder
     Stahl) und eine Teleskopstange zum Bedienen.

     Plissee: je Bahn zwei seitliche Schienen auf den Sparren, dazwischen
     der Stoff in Falten. Bestellt wird Breite × Tiefe in mm, die Zahl
     der Bahnen, die Gestellfarbe, die Stofffarbe und ein Bedienstab von
     120 cm in Weiß oder Schwarz. */
  var SEGEL_FARBEN = {
    'Platin': 0xc8c6bf, 'Perlmutt': 0xded9ce, 'Gold': 0xc5a654,
    'Taupe': 0xa38f7d, 'Grau': 0x6d6862
  };
  var PLISSEE_STOFF = {
    'Weiss': 0xe6e4df, 'Hellgrau': 0xc0c0b8, 'Grau': 0x6d6a65,
    'Anthrazit': 0x3a3a3c, 'Hellbeige': 0xd6c9ab, 'Braun': 0x58422f
  };
  var PLISSEE_GESTELL = {
    'Weiss': 0xeceae6, 'Alu': 0xb6b9bb, 'Anthrazit': 0x3b3f42, 'Schwarz': 0x1d1d1f
  };

  /* Ein Tuch als EINE Fläche statt als Reihe von Kästen. Das ist nicht
     nur hübscher, es ist auch billiger: Vorher entstanden je Bahn bis zu
     zwanzig Meshes, jetzt ist es eines. verformen(t) liefert zu jeder
     Stelle (t = 0 hinten, 1 vorne) den Abstand nach unten. */
  function tuchFlaeche(breite, laenge, segmente, verformen) {
    var g = new THREE.PlaneGeometry(breite, laenge, 1, segmente);
    g.rotateX(-Math.PI / 2);                  // liegt jetzt waagerecht
    var pos = g.attributes.position, i;
    for (i = 0; i < pos.count; i++) {
      var t = (pos.getZ(i) + laenge / 2) / laenge;
      pos.setY(i, -verformen(t));
    }
    g.computeVertexNormals();
    return g;
  }

  /* Jede Bahn wird einzeln von Hand mit einer Stange bedient. Deshalb
     fahren sie nicht gemeinsam, sondern nacheinander – von links nach
     rechts, mit einem Versatz je Bahn. Der Versatz ist absichtlich
     deutlich: Er erklärt dem Kunden die Bedienung, ohne dass ein Satz
     dazu nötig wäre. */
  var SONNE_BAHNEN = [];
  /* Was gebaut wurde – für die Standzeile und für die Anfrage. Die Zahl
     der Bahnen fragt das Bestellformular ab; hier ergibt sie sich aus dem
     Dach (je Sparrenfeld eine), also wird sie berechnet statt erfragt. */
  var SONNE_IST = { bahnen: 0, breite: 0, laenge: 0 };
  var SONNE_P = 1;                 // zuletzt gezeichneter Stand, 0 bis 1
  /* KORREKTUR 11.10.2026: „plissees und sonnensegel öffnen in der
     animation alle noch gleichzeitig, mach es etwas versetzt"
     (Betreiber).

     Der erste Versuch verschob nur die ANIMATION um 220 ms je Bahn. Das
     greift aber nur, wenn überhaupt animiert wird – am Regler wurde
     jeder kleine Schritt sofort gesetzt, und dort bewegte sich alles
     gemeinsam.

     Jetzt steckt der Versatz in der Aufteilung selbst: Jede Bahn hat
     ihren eigenen Anteil am Weg. Bahn 1 ist schon offen, während Bahn 3
     noch anfängt – egal ob am Regler gezogen oder angeklickt wird. Das
     ist auch das richtige Bild: Man geht mit der Stange die Felder
     nacheinander durch, nicht alle auf einmal. */
  var SONNE_LAG = 0.35;            // Versatz je Bahn, als Anteil einer Bahn
  /* NICHT sonneLaeuft nennen – so heißt schon die Fahrt der Markise.
     Zwei var mit demselben Namen im selben Gültigkeitsbereich: die
     zweite gewinnt, und eine der beiden Animationen läuft ins Leere.
     Von der Prüfung gefunden, nicht im Bild. */
  var bahnLaeuft = null;

  /* Zusammenschieben heißt stauchen, nicht kürzen: Falten und Wellen
     rücken zusammen. Die Bahn bleibt mit ihrer Hinterkante stehen. */
  function bahnStellen(b, p) {
    p = Math.max(0.02, Math.min(1, p));
    var l = b.lMax * p;
    b.mesh.scale.z = p;
    b.mesh.position.set(b.x, b.uk(b.zAb + l / 2) + b.hoch, b.zAb + l / 2);
  }
  /* Anteil der Bahn i am Gesamtweg p. Bei 0 sind alle zu, bei 1 alle
     offen – dazwischen laufen sie nacheinander. */
  function bahnAnteil(i, n, p) {
    var weg = 1 + Math.max(0, n - 1) * SONNE_LAG;
    return Math.max(0, Math.min(1, p * weg - i * SONNE_LAG));
  }
  function bahnenSetzen(p) {
    var n = SONNE_BAHNEN.length;
    SONNE_BAHNEN.forEach(function (b, i) { bahnStellen(b, bahnAnteil(i, n, p)); });
  }
  function bahnenFahren(ziel) {
    if (bahnLaeuft) clearInterval(bahnLaeuft);
    var von = SONNE_P, t0 = Date.now();
    /* Länger als eine Markisenfahrt: Der Weg ist durch den Versatz
       länger geworden, sonst wirkt es gehetzt. */
    var dauer = FAHRDAUER * 1.8;
    bahnLaeuft = setInterval(function () {
      var t = Math.min(1, (Date.now() - t0) / dauer);
      bahnenSetzen(von + (ziel - von) * weich(t));
      neuZeichnen();
      if (t >= 1) {
        clearInterval(bahnLaeuft); bahnLaeuft = null;
        SONNE_P = ziel;
        neuZeichnen();
      }
    }, 40);
  }

  /* ---------- Sonnenschutz ----------
     Die Aufdachmarkise liegt auf der Eindeckung und hält die Hitze vor dem
     Glas ab, die Unterdachmarkise läuft darunter und bleibt im Trockenen –
     im Modell unterscheiden sie sich genau dadurch, auf welcher Seite der
     Sparren das Tuch liegt. Beide fahren von der Wand nach vorne aus.
     Die Senkrechtmarkise hängt am vorderen oder seitlichen Profil nach
     unten; sie ist das, was abends gegen die flache Sonne hilft.

     Tuchdicke, Kassettenmaß und der Abstand zur Eindeckung sind GESCHÄTZT.
     Es geht um das Bild, nicht um ein Fertigungsmaß. */
  function sonnenschutz(B, T, hVorn, neig, PROFIL, dach) {
    var aus = Z.sonneAus / 100;
    var mStoff = new THREE.MeshStandardMaterial({
      color: rgb(0xd9d3c5), roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });
    /* Gewaehlter Stoff schlaegt die Standardfarbe. Ohne Wahl bleibt das
       neutrale Beige – es soll nicht so aussehen, als sei schon etwas
       bestellt. */
    stoffAuftragen(mStoff, Z.stoff, B);
    var hHinten = hVorn + Math.tan(neig) * T;
    var m = Z.markise;

    /* Aufdach liegt auf der Eindeckung, Unterdach darunter – im Modell ist
       das der Unterschied. Plissees laufen zwischen den Sparren, das
       Sonnensegel spannt frei darüber. „Noch unsicher" zeichnet nichts;
       die Angabe geht trotzdem in die Anfrage. */
    if (m === 'Aufdachmarkise') {
      /* Kassette, Schienen und Stuetzen stehen auch bei eingefahrenem
         Tuch da - sie sind montiert, nicht ausgefahren. Vorher wurde bei
         0 % gar nichts gezeichnet; dann sah ein Dach mit Markise aus wie
         eines ohne. */
      aufdachmarkise(B, neig, aus, mStoff, dach || {
        tiefe: T - PROFIL,
        ok: function (z) { return hHinten - Math.tan(neig) * z + 13; }
      });
    } else if (m === 'Unterdachmarkise') {
      /* Wie bei der Aufdachmarkise: Kasten und Konsolen stehen auch bei
         eingefahrenem Tuch da, sie sind montiert. */
      unterdachmarkise(B, neig, aus, mStoff, dach || {
        sparrenL: (T - PROFIL) / Math.cos(neig),
        uk: function (z) { return hHinten - Math.tan(neig) * z - 12; }
      });
    } else if (m === 'Plissees' || m === 'Sonnensegel') {
      /* KORREKTUR 11.10.2026. „sonnensegel und plisees sind noch falsch
         abgebildet" (Betreiber), dazu die beiden Bestellformulare.

         Falsch war beides: Das Sonnensegel lag ÜBER dem Dach und war
         fünf gerade Streifen über die ganze Breite. Nach dem Formular
         hängt es UNTER dem Glas, je Sparrenfeld eine Bahn, und es hängt
         in Wellen durch. Das Plissee bestand aus versetzten Kästchen
         ohne Schienen; zu jeder Bahn gehören zwei seitliche Schienen.

         Zweite Korrektur am selben Tag: „die plissees und sonnensegel
         sind in der 3d ansicht zu tief sie sitzen genau zwischen den
         sparren sind quasi an den sparren links und rechts jeweils
         befestigt". Beide hingen bis zu 12 cm unter der Sparrenunterkante.
         Jetzt sitzen sie ZWISCHEN den Sparren: Aufhängung oben an deren
         Flanken, tiefster Punkt noch über der Unterkante. */
      var segel = m === 'Sonnensegel';
      var mTuch = new THREE.MeshStandardMaterial({
        color: rgb(segel ? (SEGEL_FARBEN[Z.segelStoff] || SEGEL_FARBEN['Perlmutt'])
                         : (PLISSEE_STOFF[Z.plisseeStoff] || PLISSEE_STOFF['Hellgrau'])),
        roughness: 0.95, metalness: 0, side: THREE.DoubleSide
      });
      /* Die Sparrenachsen aus dem Dachbau. Fehlen sie (Pergola), bleibt
         der alte Richtwert – dort gibt es keine Sparren. */
      var achsen = dach && dach.sparren && dach.sparren.length > 1
        ? dach.sparren : null;
      var spBr = (dach && dach.sparrenB) || 6.1;
      var spHoehe = (dach && dach.sparrenH) || 12;
      var felder = [], fi;
      if (achsen) {
        for (fi = 0; fi < achsen.length - 1; fi++) {
          felder.push({ x: (achsen[fi] + achsen[fi + 1]) / 2,
                        b: achsen[fi + 1] - achsen[fi] - spBr });
        }
      } else {
        var nF = Math.max(2, Math.round(B / SPARREN_ABSTAND));
        for (fi = 0; fi < nF; fi++) {
          felder.push({ x: -B / 2 + (B / nF) * (fi + 0.5), b: B / nF - spBr });
        }
      }
      var zAb = PROFIL / 2, lMax = Math.max(20, T - PROFIL);
      /* Unterkante der Sparren an der Stelle z. Ohne Dachangabe die alte
         Schätzung. */
      var ukZ = function (z) {
        return dach && dach.uk ? dach.uk(z) : hHinten - Math.tan(neig) * z;
      };

      /* GEBAUT WIRD IMMER IN VOLLER LÄNGE, bewegt wird danach.

         „bei plissee und sonnensegel hinweis das diese einzeln pro
         sparrenzwischenraum handbetrieben sind mit einer stange die dafür
         gedacht is deswegen würde ich bei der animation es so machen das
         sie nacheinander versetzt schließen und öffnen" (Betreiber,
         11.10.2026).

         Deshalb trägt jede Bahn ihren eigenen Stand. Zusammengeschoben
         wird sie gestaucht statt neu gebaut – das ist auch physikalisch
         das Richtige: Falten und Wellen rücken zusammen, sie
         verschwinden nicht. Und es erspart der Animation den Neubau des
         Modells, der sie früher zäh gemacht hat. */
      SONNE_BAHNEN = [];
      SONNE_IST = { bahnen: 0, breite: 0, laenge: Math.round(lMax * 10) };
      felder.forEach(function (fe) {
        if (fe.b <= 2) return;
        var hoch, tuch;
        if (segel) {
          /* Befestigt oben an den Sparrenflanken, durchhängend bis knapp
             über deren Unterkante – mehr Platz ist zwischen den Sparren
             nicht. Wellenlänge und Durchhang GESCHÄTZT, aus den Fotos
             des Formulars abgegriffen. */
          var wellen = Math.max(1, Math.round(lMax / 65));
          var bauch = spHoehe * 0.55;
          hoch = spHoehe * 0.78;
          tuch = new THREE.Mesh(tuchFlaeche(fe.b, lMax, wellen * 8,
            function (t) {
              return bauch * (1 - Math.cos(2 * Math.PI * wellen * t)) / 2;
            }), mTuch);
        } else {
          /* Falten quer zur Tiefe, wie in der Zeichnung des Formulars:
             waagerechte Linien über die Breite, gestapelt über die Tiefe.
             Faltentiefe GESCHÄTZT, begrenzt durch die Sparrenhöhe. */
          var falten = Math.max(3, Math.round(lMax / 9));
          var tief = Math.min(2.4, spHoehe * 0.22);
          hoch = spHoehe * 0.52 + tief / 2;
          tuch = new THREE.Mesh(tuchFlaeche(fe.b, lMax, falten * 2,
            function (t) {
              var fr = (t * falten) % 1;
              return tief * (fr < 0.5 ? fr * 2 : (1 - fr) * 2);
            }), mTuch);
        }
        tuch.rotation.x = neig;
        tuch.castShadow = true; tuch.receiveShadow = true;
        sonneTeil(tuch);
        bau.add(tuch);
        SONNE_BAHNEN.push({ mesh: tuch, x: fe.x, zAb: zAb, lMax: lMax,
                            hoch: hoch, uk: ukZ });
        SONNE_IST.bahnen++;
        SONNE_IST.breite = Math.round(fe.b * 10);
      });

      if (!segel) {
        /* Die Schienen gehören zum Gestell: Sie sind montiert und bleiben
           stehen, auch wenn der Stoff ganz zurückgeschoben ist. Sie
           sitzen an den Sparrenflanken, links und rechts der Bahn.
           Querschnitt GESCHÄTZT. */
        var mGest = new THREE.MeshStandardMaterial({
          color: rgb(PLISSEE_GESTELL[Z.plisseeGestell] || PLISSEE_GESTELL['Alu']),
          roughness: 0.4, metalness: 0.75
        });
        var schB = 2.4, kanten = [];
        felder.forEach(function (fe) {
          if (fe.b <= 2) return;
          kanten.push(fe.x - fe.b / 2 + schB / 2);
          kanten.push(fe.x + fe.b / 2 - schB / 2);
        });
        kanten.forEach(function (x) {
          var sch = new THREE.Mesh(
            new THREE.BoxGeometry(schB, 3.4, lMax / Math.cos(neig)), mGest);
          sch.position.set(x, ukZ(zAb + lMax / 2) + spHoehe * 0.5, zAb + lMax / 2);
          sch.rotation.x = neig;
          sch.castShadow = true;
          sonneTeil(sch);
          bau.add(sch);
        });
      }
      /* Die Bahnen auf ihren Stand bringen: entweder sofort oder – bei
         einem größeren Sprung – nacheinander, wie von Hand mit der
         Stange. */
      if (Math.abs(SONNE_P - aus) > 0.2) bahnenFahren(aus);
      else { SONNE_P = aus; bahnenSetzen(aus); }
    }

    /* Heizstrahler und Lautsprecher sitzen am Wandprofil bzw. in den
       Sparren – kleine Teile, aber sie beantworten die Frage „sieht man
       das?". Maße sind GESCHÄTZT. */
    if (Z.heizung) {
      var mHeiz = new THREE.MeshStandardMaterial({
        color: Z.abend ? 0x8c2f1c : 0x3a3d3f, roughness: 0.5, metalness: 0.4
      });
      var anzahlH = Math.max(1, Math.round(B / 250));
      verteilen(anzahlH, B - PROFIL * 2, 30).forEach(function (x) {
        var hz = new THREE.Mesh(new THREE.BoxGeometry(92, 9, 11), mHeiz);
        hz.position.set(x, hHinten - 22, PROFIL + 14);
        bau.add(hz);
      });
    }
    if (Z.sound) {
      var mBox = new THREE.MeshStandardMaterial({
        color: 0x2b2e30, roughness: 0.7, metalness: 0.2
      });
      var anzahlL = Z.soundset === '4er-Set' ? 4 : 2;
      verteilen(anzahlL, B - PROFIL * 4, 40).forEach(function (x) {
        var lb = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 2.4, 14), mBox);
        lb.position.set(x, hHinten - Math.tan(neig) * (T * 0.45) - 6, T * 0.45);
        bau.add(lb);
      });
    }
  }

  /* ---------- Verkleidung aus Sichtschutzpaneelen ----------
     Paneelhöhe 140 mm – so steht es auf unserer Produktseite zu den
     Aluminium-Sichtschutzpaneelen. Der Fugenanteil von 12 mm ist
     GESCHÄTZT; wie das Fugenbild am Ende aussieht, legt das Aufmaß fest.
     Deshalb steht derselbe Hinweis auch im Bedienfeld. */
  function verkleidung(B, T, hWand, PROFIL) {
    if (!Z.verkRueck && !Z.verkLinks && !Z.verkRechts) return;
    var m = blech();
    var PAN = 14, FUGE = 1.2;             // cm
    function flaeche(laenge, x, z, quer) {
      var i, n;
      if (Z.verkRichtung === 'waagerecht') {
        n = Math.max(1, Math.floor(hWand / (PAN + FUGE)));
        for (i = 0; i < n; i++) {
          var y = (i + 0.5) * (PAN + FUGE);
          if (quer) balken(4, PAN, laenge, x, y, z, m);
          else balken(laenge, PAN, 4, x, y, z, m);
        }
      } else {
        n = Math.max(1, Math.floor(laenge / (PAN + FUGE)));
        for (i = 0; i < n; i++) {
          var d = -laenge / 2 + (i + 0.5) * (laenge / n);
          if (quer) balken(4, hWand, PAN, x, hWand / 2, z + d, m);
          else balken(PAN, hWand, 4, x + d, hWand / 2, z, m);
        }
      }
    }
    /* Links und rechts wie bei den Seitenelementen: mit dem Rücken zur
       Wand nach draußen geschaut, also links bei +x. */
    if (Z.verkRueck)  flaeche(B - PROFIL,  0,              PROFIL / 2, false);
    if (Z.verkLinks)  flaeche(T - PROFIL,  B / 2 - 2,      T / 2,      true);
    if (Z.verkRechts) flaeche(T - PROFIL, -B / 2 + 2,      T / 2,      true);
  }

  /* ---------- Modell ohne Herstellerdaten ----------
     Carport TDS und Flat Box kommen in der gelieferten Preismatrix nicht
     vor. Bis die Zahlen da sind, bleibt hier die maßstäbliche Skizze von
     vorher: Sparrenabstand als Richtwert, Pfostenmaß 140 mm, Blendenhöhe
     260 mm – alles GESCHÄTZT. Die Oberfläche weist darauf hin.
     Flat Line läuft NICHT hierüber, dafür gibt es Daten. */
  function bauenGeschaetzt() {
    var tds = Z.cpTyp === 'Carport TDS';
    var variante = Z.cpVariante;
    var anWand = variante === 'Carport mit Wandmontage';
    var ueberstand = (variante === 'Carport mit Überstand') ? Z.ueberstand / 10 : 0;
    var verkleidet = variante.indexOf('verkleidet') > -1;
    var garagentor = variante.indexOf('Garagentor') > -1;
    var nebenraum = variante.indexOf('Nebenraum') > -1;

    var PROFIL = 14;                                   // Carport-Stützen sind kräftiger
    /* BELEGT (technische-daten.md 1, dieselbe Quelle wie GENEIGT in
       js/bauteile.js): Flat Line ist ein Flachdach ohne Neigungsfeld, und
       Flat Box ist Flat Line mit Wänden. Hier standen vorher 1,5° – damit
       stand die Zeichnung im Widerspruch zu unseren eigenen Daten, und das
       Dach kippte sichtbar nach vorn. Vom Betreiber beanstandet, 10.10.2026.
       Nur der Carport TDS ist geneigt. */
    var NEIGUNG = (tds ? 6 : 0) * Math.PI / 180;
    var B = Z.breite / 10, T = Z.tiefe / 10;
    var hVorn = Z.hoehe / 10;                          // Durchfahrtshöhe vorne
    var hHinten = hVorn + Math.tan(NEIGUNG) * T;
    var mAlu = alu();

    /* Umgebung: gepflasterte Zufahrt statt Terrassenbelag */
    belag.scale.set(B + 200, 1, T + 260);
    belag.position.set(0, -1, (T + 260) / 2 - 130);
    wand.visible = anWand;
    wand.scale.set(B + 420, hHinten + 190, 1);
    wand.position.set(0, (hHinten + 190) / 2, -12);

    /* Pfosten: vorne immer, hinten nur ohne Wandmontage */
    var paare = B > 450 ? 3 : 2;
    var xPos = verteilen(paare, B, PROFIL / 2);
    xPos.forEach(function (x) {
      balken(PROFIL, hVorn, PROFIL, x, hVorn / 2, T - PROFIL / 2, mAlu);
      if (!anWand) balken(PROFIL, hHinten, PROFIL, x, hHinten / 2, PROFIL / 2, mAlu);
    });

    /* Längsträger links und rechts – tragen die Dachlast zwischen den Pfosten */
    var traegerL = Math.sqrt(T * T + Math.pow(hHinten - hVorn, 2));
    [-B / 2 + PROFIL / 2, B / 2 - PROFIL / 2].forEach(function (x) {
      var tr = new THREE.Mesh(new THREE.BoxGeometry(PROFIL * 0.8, PROFIL * 1.3, traegerL), mAlu);
      tr.position.set(x, (hVorn + hHinten) / 2 + PROFIL * 0.65, T / 2);
      tr.rotation.x = NEIGUNG;
      tr.castShadow = true; tr.receiveShadow = true;
      bau.add(tr);
    });

    if (tds) {
      /* Geneigtes Profildach wie beim Terrassendach, auf Wunsch mit
         Dachüberstand über die vorderen Pfosten hinaus. */
      var TD = T + ueberstand;
      var hKante = hHinten - Math.tan(NEIGUNG) * TD;   // Dachkante vorne
      balken(B, PROFIL * 1.6, PROFIL * 1.3, 0, hKante + PROFIL * 0.8, TD - PROFIL / 2, mAlu);
      balken(B, PROFIL * 1.4, PROFIL, 0, hHinten + PROFIL * 0.7, PROFIL / 2, mAlu);

      var felder = Math.max(2, Math.round(B / SPARREN_ABSTAND));
      var sparrenX = [];
      for (var s = 0; s <= felder; s++) sparrenX.push(-B / 2 + (B * s / felder));
      var laenge = Math.sqrt(TD * TD + Math.pow(hHinten - hKante, 2));
      var mitteY = (hKante + hHinten) / 2 + PROFIL * 0.9;
      var mitteZ = TD / 2;

      sparrenX.forEach(function (x) {
        var sp = new THREE.Mesh(new THREE.BoxGeometry(PROFIL * 0.7, PROFIL, laenge), mAlu);
        sp.position.set(x, mitteY, mitteZ);
        sp.rotation.x = NEIGUNG;
        sp.castShadow = true; sp.receiveShadow = true;
        dachTeil(sp);
        bau.add(sp);
      });

      var mFuellung = dachfuellung();
      for (var f = 0; f < felder; f++) {
        var platte = new THREE.Mesh(
          new THREE.BoxGeometry((B / felder) - PROFIL * 0.7, 1.6, laenge - 2), mFuellung);
        platte.position.set((sparrenX[f] + sparrenX[f + 1]) / 2, mitteY + PROFIL * 0.35, mitteZ);
        platte.rotation.x = NEIGUNG;
        bau.add(platte);
      }

      if (Z.led) {
        // in die Sparren (sparrenX), nicht in die Felder dazwischen
        ledSpots(sparrenX, [T * 0.25, T * 0.6, T * 0.92], function (z) {
          return mitteY + Math.tan(NEIGUNG) * (mitteZ - z) - PROFIL / 2;
        });
      }
    } else {
      /* Flachdach hinter umlaufender Blende (Attika).
         Das Dach liegt WAAGERECHT – kein Gefälle, auch keins nach innen.
         Vorher fiel das Blech hier nach vorne ab; das war eine Annahme von
         uns und falsch (siehe NEIGUNG oben). Entwässert wird über die
         Attika, wo genau, ist nicht belegt und wird deshalb nicht
         gezeichnet. */
      var blendeH = 26;
      var oben = hVorn + blendeH;
      var mBlech = blech();

      balken(B + 4, blendeH, 5, 0, hVorn + blendeH / 2, T + 1, mBlech);   // vorne
      balken(B + 4, blendeH, 5, 0, hVorn + blendeH / 2, -1, mBlech);      // hinten
      [-B / 2 - 1, B / 2 + 1].forEach(function (x) {
        balken(5, blendeH, T + 4, x, hVorn + blendeH / 2, T / 2, mBlech);
      });

      /* Eindeckung ist Trapezblech – und soll auch danach aussehen.
         BELEGT ist das Profil T35M-0,75: 35 mm Profilhöhe, 0,75 mm Blech
         (technische-daten.md, Abschnitt Profile). GESCHÄTZT ist der
         Rippenabstand; er ist der einzige fehlende Wert und steht als
         Rückfrage 5 in daten/rueckfragen-an-vd.md. Sobald er da ist, nur
         RIPPE_ABSTAND ändern.

         Das Blech läuft in der Farbe des Gestells, wie im Datenpfad
         (trapezblechMaterial). Ob der Hersteller das Blech wirklich in der
         RAL-Farbe liefert, ist nicht belegt – gegenzulesen. */
      var BLECH_DICKE = 0.9;        // Grundblech, zeichnerisch
      var RIPPE_HOCH = 3.5;         // 35 mm, BELEGT
      var RIPPE_ABSTAND = 20;       // GESCHÄTZT, Rückfrage 5 an VD
      var yDeck = oben - 5;
      var mTrapez = trapezblechMaterial();

      var grund = new THREE.Mesh(new THREE.BoxGeometry(B - 2, BLECH_DICKE, T), mTrapez);
      grund.position.set(0, yDeck, T / 2);
      grund.castShadow = true; grund.receiveShadow = true;
      bau.add(grund);

      /* Rippen laufen in Gefällerichtung, also in der Tiefe – so liegt ein
         Trapezblech, damit Wasser in den Tälern abläuft. */
      var rippen = Math.max(3, Math.floor((B - 4) / RIPPE_ABSTAND));
      for (var ri = 0; ri < rippen; ri++) {
        var xr = -B / 2 + 2 + ((B - 4) / rippen) * (ri + 0.5);
        var rippe = new THREE.Mesh(
          new THREE.BoxGeometry(RIPPE_ABSTAND * 0.45, RIPPE_HOCH, T), mTrapez);
        rippe.position.set(xr, yDeck + RIPPE_HOCH / 2, T / 2);
        rippe.castShadow = true; rippe.receiveShadow = true;
        bau.add(rippe);
      }
      var obenBlech = yDeck + RIPPE_HOCH;

      /* Solar und Dachbegrünung liegen AUF dem Trapezblech, sie ersetzen es
         nicht – deshalb bleibt das Blech darunter sichtbar. */
      if (Z.cpDach === 'Solar (PV-Anlage)') {
        var mModul = new THREE.MeshStandardMaterial({
          color: 0x1d2a40, metalness: 0.3, roughness: 0.35
        });
        var reihen = Math.max(2, Math.floor((T - 40) / 100));
        var spalten = Math.max(2, Math.floor((B - 30) / 100));
        for (var r = 0; r < reihen; r++) {
          for (var c = 0; c < spalten; c++) {
            var zm = 30 + ((T - 60) / reihen) * (r + 0.5);
            var modul = new THREE.Mesh(new THREE.BoxGeometry(
              (B - 30) / spalten - 6, 2, (T - 60) / reihen - 6), mModul);
            modul.position.set(-B / 2 + 15 + ((B - 30) / spalten) * (c + 0.5),
                               obenBlech + 1.5, zm);
            bau.add(modul);
          }
        }
      } else if (Z.cpDach === 'Dachbegrünung') {
        var gruen = new THREE.Mesh(
          new THREE.BoxGeometry(B - 10, 6, T - 10),
          new THREE.MeshStandardMaterial({ color: 0x5c7a3f, roughness: 0.95 })
        );
        gruen.position.set(0, obenBlech + 3, T / 2);
        bau.add(gruen);
      }

      if (Z.led) {
        ledSpots(verteilen(Math.max(2, Math.round(B / 130)), B, 40),
                 [T * 0.25, T * 0.6, T * 0.92],
                 function () { return hVorn - 1; });
      }
    }

    /* Verkleidung der Flat Box: Seitenwände und Hinterwand, auf Wunsch
       vorne ein Sektionaltor. Die Felder reichen von der Bodenplatte bis
       unter die Blende. */
    var hWand = hVorn - 1;
    var mVerkl = blech();
    if (verkleidet) {
      [-B / 2 + 2, B / 2 - 2].forEach(function (x) {
        balken(4, hWand, T - 4, x, hWand / 2, T / 2, mVerkl);
      });
      if (!anWand) balken(B - 8, hWand, 4, 0, hWand / 2, 2, mVerkl);
      if (garagentor) {
        balken(B - 10, hWand - 2, 5, 0, (hWand - 2) / 2, T - 4, mVerkl);
        var mFuge = alu();
        for (var s2 = 1; s2 <= 5; s2++) {
          var fuge = new THREE.Mesh(new THREE.BoxGeometry(B - 12, 1.2, 2), mFuge);
          fuge.position.set(0, (hWand - 2) * s2 / 6, T - 7);
          bau.add(fuge);
        }
      }
    }

    /* Nebenraum: abgetrennter Abstellraum im hinteren Teil, unter demselben
       Dach. Tiefe bewusst gedeckelt – mehr als etwa 1,6 m nimmt dem
       Fahrzeug den Platz. */
    if (nebenraum) {
      var tNR = Math.min(160, T * 0.3);
      if (!verkleidet) {
        [-B / 2 + 2, B / 2 - 2].forEach(function (x) {
          balken(4, hWand, tNR, x, hWand / 2, tNR / 2, mVerkl);
        });
        if (!anWand) balken(B - 8, hWand, 4, 0, hWand / 2, 2, mVerkl);
      }
      balken(B - 8, hWand, 4, 0, hWand / 2, tNR, mVerkl);          // Trennwand
      var mTuer = alu();
      balken(Math.min(100, B * 0.45), hWand - 8, 3, -B * 0.18, (hWand - 8) / 2, tNR + 3.5, mTuer);
    }

    /* Zusätzliche Sichtschutzpaneele. Bei den bereits verkleideten
       Flat-Box-Ausführungen ist die Auswahl ausgeblendet (gruppeGilt),
       sonst lägen zwei Wände übereinander. */
    verkleidung(B, T, hWand, PROFIL);
  }

  /* ---------- Terrassendach und Flachdach ohne Herstellerdaten ----------
     Solange /api/bauteile keine Stückliste liefert, muss auch das
     Terrassendach gezeichnet werden. Genau das ist derzeit der Fall: der
     KV-Speicher mit der Herstellermatrix ist nicht angebunden (siehe
     wrangler.jsonc), die Schnittstelle antwortet mit 503.

     Vorher lief dieser Fall in bauenGeschaetzt() – und das ist die
     CARPORT-Skizze. Über der Überschrift „Terrassendach TDS" stand also ein
     Carport, und Seitenelemente fehlten ganz, weil sie nur im Datenpfad
     gezeichnet wurden. Gefunden beim Umbau auf das Vollbild-Layout, bestätigt
     mit curl gegen die veröffentlichte Schnittstelle.

     Jede Zahl hier ist GESCHÄTZT – außer dem Pfostenmaß 110 mm (BELEGT) und
     dem Sparrenabstand 1100 mm (Richtwert SPARREN_ABSTAND). Sobald die
     Matrix angebunden ist, übernimmt wieder bauenAusDaten(). */
  function bauenTerrasseGeschaetzt() {
    var sky = Z.produkt === 'Flachdach SkyView';
    /* Pfosten 110 x 110 x 2,5 mm (15190). Das Aussenmass der Zeichnung
       ist 110,2 – die Produktbezeichnung rundet auf 110. BELEGT. */
    var PF = 11.02;
    /* SkyView: außen Flachdach, innen Gefälle. „das sky view sieht von
       außen aus wie flachdach hat aber ein innenliegendes gefälle von
       immer 2 grad" (Betreiber, 11.10.2026).

       Die Montageanleitung sagt „Oberkante des Daches an allen Punkten
       in WAAGE" (S. 8) – gemeint ist der RAHMEN, nicht die Dachfläche.
       Beides zusammen ergibt das System: Rinne, Träger und Seitenblende
       bilden ein waagerechtes Band, die Sparren und die Eindeckung
       darin fallen mit 2° zur Rinne. Von außen sieht man nur das Band.

       Deshalb steht hier wieder der feste Winkel – aber der Rahmen
       richtet sich jetzt nicht mehr nach der geneigten Dachfläche,
       sondern bleibt rundum gleich hoch (siehe riH weiter unten). */
    /* ---------- Wie flach das Gefaelle gezeichnet wird ----------
       Das echte SkyView hat 2° Innengefaelle. In den belegten Rahmen
       passt das NICHT: Sparren (120 mm) und Glas (8 mm) fuellen die
       136,7 mm fast aus, fuer das Gefaelle bleiben 8,7 mm.

       Bis zum 14.10.2026 schob der Code den Sparren deshalb nach oben
       aus dem Rahmen heraus – im Bild ragten Sparren und Glas 8 cm
       darueber, und die Blenden verdeckten nichts mehr: „das sieht
       garnicht nach dem aus was ich geschickt hab" (Betreiber, mit
       Bildschirmfoto).

       Gezeichnet wird jetzt das, was in den Rahmen passt. Von aussen
       ist das richtig – das Gefaelle liegt ohnehin INNEN und ist durch
       Rahmen und Blenden verdeckt; genau das macht die Optik eines
       Flachdachs aus.

       OFFEN BLEIBT, welche Angabe fehlt: Entweder hat SkyView ein
       flacheres Sparrenprofil als das TDS, oder die Sparren haengen
       unten aus dem Rahmen heraus, oder der Rahmen ist an den Seiten
       hoeher als die Rinne. Drei Moeglichkeiten, keine belegt – siehe
       docs/NEXT_TASK.md. Was hier gezeichnet wird, ist die aeussere
       Erscheinung, nicht die Statik. */
    var skyLuft = sky
      ? Math.max(0, SKY.rahmenH - (istPolycarbonat() ? 1.6 : Z.glasstaerke / 10)
                    - SPARREN.hoehe)
      : 0;
    /* Das echte Gefaelle sind 2°. In den 252er Rahmen passt das bis rund
       3,55 m Tiefe (124 mm Luft, 2° brauchen bei 3,5 m 122 mm). Darueber
       wird im Modell flacher gezeichnet – sonst stuende das Glas wieder
       ueber dem Rahmen, der Fehler vom 14.10.2026. Was dort real
       passiert, ist nicht belegt (docs/NEXT_TASK.md). */
    var neig = sky
      ? Math.min(2 * Math.PI / 180,
                 Math.atan(skyLuft / Math.max(1, Z.tiefe / 10)))
      : neigungGrad() * Math.PI / 180;
    var frei = Z.aufbau === 'Freistehend';
    /* Statiktraeger 189 x 117 mm (15187). Die Zeichnung nennt 189,2 x
       117; der Pfostenkopf liegt mit 110,2 darunter. BELEGT (Liste und
       Masstabelle). */
    var TR_H = 18.92, TR_T = 11.7;

    /* TIEFENMASS: „bei freistehend das tiefe maß is immer inkl.
       statikträger, bei wandmontage ja nicht" (Betreiber, 11.10.2026).

       An der Wand misst die Tiefe ab der Mauer – das Wandprofil liegt
       innerhalb. Freistehend tritt der Träger an die Stelle der Mauer und
       zählt MIT. Das Dach wird also um die Trägertiefe kürzer, statt dass
       der Träger hinten angebaut wird; sonst stünde die Anlage 117 mm
       tiefer da als bestellt. Der Nullpunkt bleibt die Rückseite des
       Trägers bzw. die Mauerflucht. */
    var B = Z.breite / 10, T = Z.tiefe / 10 - (frei ? TR_T : 0);
    var hVorn = Z.hoehe / 10;

    /* ---------- Statikträger unter der Rinne ----------
       Vorgabe des Betreibers (11.10.2026): „beachte nur bei den nötigen
       maßen den statikträger unter der dachrinne, die maße vom
       statikträger stehen ja im pdf".

       BELEGT (Maßtabelle): Querschnitt 189 × 117 mm, Länge = volle
       Dachbreite, nötig ab einer Tiefe von mehr als 4500 mm.

       Er sitzt UNTER der Rinne und AUF den Pfosten. Dadurch bleibt die
       eingestellte Durchgangshöhe das, was man darunter hat – Rinne und
       Dach rücken um die Trägerhöhe nach oben, nicht der Durchgang nach
       unten. ANNAHME: 189 mm ist die Höhe, 117 mm die Tiefe; die Tabelle
       nennt nur „189x117". Andersherum wäre der Träger flacher als breit,
       was für einen tragenden Unterzug wenig Sinn ergibt. GEGENZULESEN. */
    /* ---------- Dachvorsprung und Statikträger ----------
       Beanstandet vom Betreiber (11.10.2026): „der schieberegler für den
       dachüberstand funktioniert nicht". Er hatte recht – Z.vorsprung
       wurde gelesen und in die Anfrage geschrieben, aber NIRGENDS in der
       Geometrie verwendet. Am Modell bewegte sich nichts.

       Was der Vorsprung bedeutet: „bei dachüberstand wandern die pfosten
       ja nach innen um die ausgewählten mm und da kommt auch der
       statikträger ins spiel, da ist er nicht unter der rinne wäre ja
       unlogisch, sondern über den pfosten unter den sparren".

       Daraus folgen ZWEI Lagen für denselben Träger:
         · OHNE Vorsprung steht der Pfosten unter der Rinne. Der Träger
           liegt dann zwischen Pfostenkopf und Rinne.
         · MIT Vorsprung steht der Pfosten weiter innen, die Rinne kragt
           aus. Ein Träger unter der Rinne trüge dort nichts – er liegt
           über den Pfosten UNTER DEN SPARREN.

       IN BEIDEN FÄLLEN bleibt die Rinne, wo sie ist, und der Pfosten
       wird um die Trägerhöhe kürzer. Der Durchgang unter dem Träger ist
       also 189 mm niedriger als die eingestellte Höhe.

       Hier stand vorher, die Rinne rücke um die Trägerhöhe nach oben und
       die Durchgangshöhe bleibe. Beides falsch, vom Betreiber
       richtiggestellt: „rinne rückt nicht hoch", „geht technisch nicht",
       „auch da wird die durchgangshöhe um 189mm niedriger". Die Rinne
       sitzt auf dem Dach, nicht auf einem Stapel – sie lässt sich nicht
       anheben, nur der Pfosten darunter kürzen.

       Der Träger kommt, wenn die Maßtabelle ihn verlangt (Tiefe über
       4500 mm) ODER wenn ein Vorsprung eingestellt ist – dann hängt die
       Rinne frei und braucht ihn. */
    var tbMass = tabelleBauteile(Z.breite, Z.tiefe);
    var vorspr = gruppeGilt('vorsprung') ? Z.vorsprung / 10 : 0;   // cm
    /* Ein Statikträger entsteht auf drei Wegen: ab 4500 mm Tiefe
       zwingend (Tabelle), mit Dachvorsprung bauartbedingt – oder weil der
       Kunde ihn WILL.

       „wenn ein kunde z.b 2 pfosten anstatt 3 nur möchte" (Betreiber,
       11.10.2026). Unter dem Träger gilt die 7-m-Regel statt der
       Stützfußspalte, es stehen also weniger Pfosten. Bezahlt wird das
       mit Durchgangshöhe: der Träger sitzt zwischen Pfostenkopf und
       Rinne und nimmt dort 189 mm weg. Deshalb steht neben dem Häkchen
       der Hinweis – wer ihn nicht liest, plant mit 2,30 m und hat
       2,11 m. */
    /* Beim CARPORT entfällt die Tiefenregel: „du machst beim carport
       automatisch nen statikträger ab bestimmte maß. lass das. mach es
       mit häckchen wie bei tds normal" (Betreiber, 11.10.2026). Dort
       kommt der Träger also nur über das Häkchen oder über einen
       Dachvorsprung. */
    var traegerH = (unterzugGilt(tbMass) || vorspr > 0 ||
                    Z.traegerWunsch) ? 18.9 : 0;
    var traegerT = 11.7;
    /* Die Rinne liegt immer auf der eingestellten Höhe – sie rückt nie
       nach oben. Der Träger nimmt dem PFOSTEN seine Höhe weg. */
    var hRinne = hVorn;
    var hHinten = hRinne + Math.tan(neig) * T;
    var mAlu = alu();
    /* TDS bekommt die echten Profile aus den Querschnittszeichnungen des
       Betreibers. SkyView ist ein anderes System – dafür liegt keine
       Zeichnung vor, dort bleiben die geschätzten Kästen stehen und sind
       hier als solche benannt. */
    /* Sparren und Glasleisten sind bei beiden Systemen dieselben Teile
       (Betreiber, 11.10.2026). */
    var spB = SPARREN.breite;
    var spH = SPARREN.hoehe;

    /* ---------- SkyView: außen Flachdach, innen Gefälle ----------
       „nur die sparren sind 2grad geneigt, der kasten außen die
       verblendung ist wie flachdach, da is nix geneigt" und „die blende
       außen is immer gleich, einfach rechteckig" (Betreiber,
       11.10.2026).

       Der Kasten hat deshalb eine FESTE Höhe und ist rundum dasselbe
       Rechteckprofil. Das Gefälle steckt im Sparren, der nach hinten
       höher wird (siehe keilsparren).

       Die Ausnahme steht hier offen: Ab etwa 5 m Tiefe braucht das
       Gefälle mehr Platz, als der Kasten hat – dann wächst er so weit
       mit, dass die Eindeckung noch darin liegt. Wie das echte System
       das löst (höheres Profil? flacheres Gefälle?), ist die offene
       Frage in docs/NEXT_TASK.md. */
    var skyGlas = istPolycarbonat() ? 1.6 : Z.glasstaerke / 10;
    /* ---------- Der SkyView-Rahmen hat eine FESTE Hoehe ----------
       Bis zum 14.10.2026 wuchs er mit der Tiefe (bei 4,5 m auf 355 mm),
       weil ich das 2°-Gefaelle darin unterbringen wollte. Das war falsch:
       Im System gibt es kein Profil ueber 136,7 mm, und „außenrum sieht
       er in echt auch gleich hoch aus" (Betreiber, 14.10.2026).

       Das Gefaelle verschwindet nicht im Rahmen, sondern IM SPARREN: Er
       ist vorne ausgeklinkt (Ausschnitt 86 mm hoch, 65 mm tief –
       Montageanleitung) und taucht damit in die Rinne ein. Hinten liegt
       er voll auf dem Traeger. Seine Unterkante faellt nach vorne also
       nur um das, was Gefaelle MINUS Ausklinkung uebrig laesst – bei 3 m
       sind das 19 mm statt 105 mm. So bleibt er im Rahmen, und der
       Rahmen bleibt rundum gleich hoch.

       Die Sparren selbst sind dieselben wie beim TDS: „sparren sind
       gleich bis auf beim flatline dach da sind sie anders" (Betreiber,
       14.10.2026). */
    var riH = sky ? SKY.rahmenH : RINNE.hoehe;
    var riT = sky ? SKY.rinneT : RINNE.breite;

    belag.scale.set(B + 180, 1, T + (frei ? 240 : 120));
    belag.position.set(0, -1, (T + 120) / 2 - 60);
    wand.visible = !frei;
    wand.scale.set(B + 420, hHinten + 190, 1);
    wand.position.set(0, (hHinten + 190) / 2, -12);

    /* Pfosten: zwei, bei breiten Anlagen drei. Die Verteilung über die
       BREITE bleibt GESCHÄTZT – die Maßtabelle führt sie ausdrücklich
       unter „nicht belegt, nicht raten, sondern nachfragen".

       Die Lage in der TIEFE ist dagegen BELEGT: Die Maßtabelle
       (Stand 11.10.2026, Quelle VD-Preislisten) nennt im Kopf
       PFOSTENACHSE_AB_VORDERKANTE_MM=55. Hier standen zwischendurch
       93 mm („mittig unter der Rinne", Angabe vom 10.10.2026); auf
       Vorlage des Tabellenbefunds hat der Betreiber am 11.10.2026
       entschieden: „dann mach es nach liste".

       Die Pfostenvorderkante steht damit bündig mit der Rinnenvorder-
       kante (55 mm Achse bei 110 mm Pfosten). Das gilt für alle
       Systeme – die Tabelle trennt dort nicht. */
    /* NUR BEIM TDS (14.10.2026): „du hast beim fly die pfosten auch nach
       innen verschoben, ich wollte es nur bei tds" (Betreiber).

       Die hintere Lage hat ihren Grund in der TDS-Rinne: Der Pfosten wird
       an dem Schenkel verschraubt, der hinten unter ihr nach unten geht.
       Diesen Schenkel gibt es bei den Flachdach-Systemen nicht – dort
       bleibt es bei der Achse aus der Masstabelle (55 mm, Pfosten vorne
       buendig). Die Einschraenkung ist also nicht nur ein Wunsch,
       sondern folgt der Begruendung der Aenderung selbst. */
    var tdsRinne = !sky && (Z.produkt === 'Terrassendach TDS' || istCarportTds());
    /* Mit Vorsprung wandert der Pfosten um genau dieses Maß nach innen. */
    var zPf = T - (tdsRinne ? PFOSTENACHSE : PFOSTENACHSE_VORNE) - vorspr;

    /* Unterkante der Sparren an der Pfostenachse – nur mit Vorsprung
       gebraucht, dort endet der Pfosten unter dem Träger. ukVorn wird
       weiter unten noch einmal gebraucht und ist dieselbe Rechnung. */
    /* Dieselbe Rechnung wie weiter unten bei ukVorn – sie steht hier ein
       zweites Mal, weil Pfosten- und Trägerhöhe sie schon brauchen,
       bevor das Dach gebaut wird. Beide müssen übereinstimmen, sonst
       liegt die Rahmenoberkante woanders als die Glasebene. */
    /* Sparrenunterkante vorne. Beim SkyView rueckwaerts aus der
       Rahmenoberkante: Glas liegt darunter, der Sparren darunter, und
       die Ausklinkung hebt ihn vorne wieder an. Bei grossen Tiefen
       reicht das rechnerisch nicht – dann wird er vorne staerker
       ausgeklinkt gezeichnet (die Untergrenze), sonst haengt er unter
       dem Rahmen heraus. Ob das echte System dort flacher neigt oder
       tiefer ausklinkt, ist nicht belegt (docs/NEXT_TASK.md). */
    /* Sparrenunterkante vorne. Beim SkyView von der Rahmenoberkante nach
       unten: Das Glas schliesst oben mit dem Rahmen ab, darunter der
       Sparren, und nach vorne faellt er um die Luft, die uebrig bleibt
       (siehe skyLuft). So bleibt alles im Rahmen – das war der Fehler
       vom 14.10.2026, der die Sparren oben herausstehen liess. */
    /* KORREKTUR 14.10.2026: „der hintere schenkel der rinne guckt durch
       das glas und die glasleisten durch" (Betreiber).

       sparrenUnterNase sagt, wie weit die EINDECKUNG unter der Rinnennase
       liegt. Gerechnet wurde sie bis heute gegen die Sparrenoberkante
       (spH, 120 mm) – seit die Scheibe auf dem Hauptkoerper liegt
       (96,7 mm), sind das 23,3 mm zu tief. Die Scheibe lag damit UNTER
       der Oberkante der hinteren Rinnenwange (die 34 mm unter der Nase
       liegt), und die Wange stach durch Glas und Leisten.

       Nachgerechnet bei hRinne = 0: Glasunterseite jetzt 120,7 mm,
       hintere Wange 102,7 mm – 18 mm Luft. Vorher lag die Scheibe bei
       97,4 mm, also 5,3 mm UNTER der Wange. */
    var ukVornJetzt = sky
      ? hRinne + riH - skyGlas - spH - Math.tan(neig) * T
      : hRinne + (riH - RINNE.sparrenUnterNase - SPARREN.koerper);
    var dachTiefeJetzt = sky ? T : T - RINNE.breite;
    var ukAnPfosten = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zPf);
    /* Oberkante des Trägers: ohne Vorsprung die Rinnenunterkante, mit
       Vorsprung die Sparrenunterkante an der Pfostenachse. Der Pfosten
       endet jeweils darunter – eine Rechnung für beide Fälle. */
    var traegerOk = vorspr > 0 ? ukAnPfosten : hVorn;
    var hPfosten = traegerH ? Math.max(100, traegerOk - traegerH) : hVorn;

    /* ---------- Freistehend: Statikträger statt Wand ----------
       Vorgabe des Betreibers (11.10.2026): „bei der freistehenden
       methode, kommt das wandprofil anstatt an die wand an den
       statikträger, und die pfosten sind unter dem statiträger ganz
       normal wie sie es jetzt schon bei dachüberstand sind".

       Hinten gibt es also dieselben drei Lagen wie vorne mit Vorsprung:
       Sparren oben, darunter der Statikträger über die volle Breite,
       darunter die Pfosten. Das Wandprofil hängt an der Vorderseite des
       Trägers – es verschwindet nicht, es bekommt nur einen anderen
       Halt. */
    /* KORREKTUR 11.10.2026. Vorher lag der Träger WAAGERECHT UNTER den
       Sparren, das Wandprofil davor. Betreiber am Bild: „der statikträger
       is immer hochkant nicht wagrecht wie hier und er ist nicht unter den
       sparren sondern hinter den sparren … quasi du machst es 1:1 als
       wäre der statikträger die wand, wandprofil ist am statikträger
       festgeschraubt".

       Also: Alles vor dem Wandprofil bleibt Zeile für Zeile so wie bei
       Wandmontage. Der Träger steht hochkant GENAU DORT, WO SONST DIE
       MAUER IST – hinter dem Wandprofil, also bei negativem z. Das
       Wandprofil wird nicht ersetzt, es bekommt nur eine andere
       Schraubfläche. */
    /* Wandprofil TD – der Querschnitt AUFRECHT gestellt, Wand links
       (Betreiber, 11.10.2026: „so wäre es quasi richtig wenn links die
       wand wäre"). Also: ein hoher, geschlossener Rücken an der Wand,
       aus dem drei kurze Schenkel nach vorne stehen.

       BELEGT: 143,6 mm Höhe – das lange Maß liegt an der Wand.
       GESCHÄTZT: 31 mm Ausladung, am Maßbild abgegriffen.

       Die Fassung davor hatte den Querschnitt FALSCH HERUM gelesen:
       143,6 mm waagerecht als Ausladung, 26,5 mm hoch. Das war die
       Zeichnung so, wie sie auf dem Blatt lag, nicht so, wie das Profil
       montiert wird. */
    /* Bei SkyView steht hinten der Träger TD (15698) an Stelle des
       Wandprofils: genauso hoch und tief wie die Rinne, damit die
       Oberkante rundum in WAAGE liegt. */
    /* riH, nicht das feste Maß: Rinne und Träger müssen gleich hoch sein,
       sonst wäre der Kasten nur oben gerade und unten versetzt. */
    var wpH = sky ? riH : WANDPROFIL.hoehe,
        wpT = sky ? SKY.traegerT : WANDPROFIL.tiefe;

    /* KORREKTUR 11.10.2026, dritter Anlauf. „jetzt liegt es waagrecht im
       3d unter den sparren, es muss ja hinten an den sparren dran sein"
       (Betreiber).

       Was falsch war: Die Sparren begannen bei z = 0, also an der Wand –
       GENAU DORT, wo das Wandprofil steht. Die ersten 31 mm jedes
       Sparrens lagen damit IM Profil, und vom Profil selbst blieb nur
       der Rand sichtbar, der unten und oben ein Stück heraussteht: ein
       durchgehendes waagerechtes Band unter den Sparren, über die ganze
       Breite. Dass das Profil dahinter aufrecht steht, war nicht zu
       sehen.

       Was jetzt gilt: Das Profil steht an der Wand, die Sparren fangen
       an seiner VORDERKANTE an und sind mit ihrer Stirnseite daran
       angeschraubt. Damit liegt es hinter den Sparren statt in ihnen.
       Die Dachoberkante wird nicht mehr an einer frei gewählten Stelle
       gerechnet (vorher 45 mm vor der Wand), sondern genau am
       Sparrenende – nur dort kann die Profiloberkante mit der
       Glasoberseite abschließen. Vorher stand das Dach dort 6 mm höher
       als das Profil. */
    /* KORREKTUR 14.10.2026: „wie ich schon gesagt hatte der sparren muss
       in dem wandprofil in die untere öffnung reingehen bis an die
       wandprofilwand, und die glasleiste muss in die obere öffnung"
       (Betreiber, mit Bild von unten).

       Die Sparren begannen an der PROFILVORDERKANTE und stiessen stumpf
       davor. Das war am 11.10.2026 richtig, solange das Profil ein
       massiver Quader war – da waere ein Sparren darin verschwunden.
       Seit es ein echtes Profil mit zwei Kammern ist, gilt wieder, wie
       es gebaut wird: Der Sparren schiebt sich in die UNTERE Kammer bis
       an die Rueckwand. Glas und Abdeckleiste haengen an derselben
       Groesse und laufen damit in die OBERE Kammer.

       Bei SkyView steht hinten der Traeger statt des Wandprofils, dort
       bleibt es beim bisherigen Anschlag. */
    var zSpHinten = sky ? wpT : WANDPROFIL.wand;
    /* Hinterer Dachvorsprung – nur beim freistehenden Carport TDS.
       Wie vorne wandern die Pfosten um das Maß nach innen, der
       Statikträger bleibt am Dachrand. Das Dach selbst wird nicht
       länger: Das Tiefenmaß ist das Bestellmaß. */
    var vorsprH = gruppeGilt('vorsprung-hinten') ? Z.vorsprungHinten / 10 : 0;

    /* KORREKTUR 11.10.2026, zweiter Anlauf. „der statikträger hochkant
       hinter den sparren is richtig als wäre er die wand, aber er darf
       nicht höher sein als die sparren bzw. wandprofil" (Betreiber).

       Nachgerechnet bei 5000 × 3000 mm, 8°, Durchgangshöhe 2300:
         Sparren hinten   Oberkante 279,3 cm
         Wandprofil       Oberkante 284,5 cm   ← 52 mm zu hoch
         Statikträger     Oberkante 284,5 cm   ← 52 mm zu hoch
       Beide standen über das Dach hinaus und sahen von außen aus wie ein
       Balken, der oben AUF dem Dach liegt – daher „waagrecht".

       Die alte Formel hing an hHinten, also an der Durchgangshöhe. Die
       hat mit der Dachoberkante nichts zu tun: dazwischen liegt das
       Gefälle über die ganze Tiefe, bei 3 m und 8° sind das 42 cm. Jetzt
       hängt beides an der SPARRENOBERKANTE – und zwar in beiden
       Montagearten, denn an der Wand stand das Profil genauso über. */
    var ukHinten = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zSpHinten);
    var dachOk = ukHinten + spH;                // Sparrenoberkante hinten

    /* Mit hinterem Dachvorsprung wandern Pfosten UND Träger nach innen;
       das Wandprofil bleibt am Dachrand. Der Träger liegt dann unter den
       SPARREN statt hinter ihnen – dieselbe Lage wie vorne mit
       Vorsprung. Ohne Vorsprung bleibt alles wie bisher. */
    var zTrHinten = -TR_T / 2 + vorsprH;
    var ukAmTraeger = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zTrHinten);
    /* „in die untere hälfte kommen die sparren und oben drüber halt
       glas, glasleisten etc." (Betreiber, 11.10.2026). Das Profil endet
       also NICHT an der Sparrenoberkante, sondern reicht über die
       Eindeckung: Unten liegen die Sparren darin, darüber das Glas mit
       seiner Leiste. Deshalb hängt die Oberkante an der GLASOBERSEITE.
       Vorher stand sie an der Sparrenoberkante – dort hätte die
       Glasleiste keinen Halt. */
    var wpGlasD = istPolycarbonat() ? 1.6 : Z.glasstaerke / 10;
    /* KORREKTUR 11.10.2026: „das wandprofil muss oben mit dem
       statikträger bei freistehend bündig sein bzw sogar leicht
       dahinter, damit die glasleisten nicht überstehen und das
       wandprofil soll die glasleisten abdecken also selbe höhe bis zu
       den glasleisten" (Betreiber, mit Bildschirmfoto).

       Vorher endete der Träger an der SPARRENOBERKANTE, das Wandprofil
       aber eine Glasdicke höher – es stand also über den Träger hinaus
       und gab die Glasleiste frei. Jetzt enden beide auf derselben
       Höhe: an der Oberkante des Wandprofils, das die Glasleiste
       verdeckt. Der Träger steht damit genau so hoch wie das Profil
       davor, keinen Millimeter höher. */
    /* Der Kasten ist rundum waagerecht: Der Träger hinten endet auf
       derselben Höhe wie die Rinne vorne, er folgt NICHT der geneigten
       Dachfläche. */
    /* KORREKTUR 14.10.2026: „die glasleisten können dochnicht höher wie
       das profil sein" (Betreiber, mit Bildschirmfoto der Seitenansicht).

       Die Oberkante hing an der GLASOBERSEITE – aber auf dem Glas sitzt
       noch die Abdeckleiste, 22,6 mm hoch. Genau um dieses Mass stand
       die Leiste ueber dem Profil. Die Vorgabe dazu steht seit dem
       11.10.2026 im Code („das wandprofil soll die glasleisten abdecken
       also selbe höhe bis zu den glasleisten") – umgesetzt war sie nur
       bis zur Scheibe. */
    /* Die Scheibe liegt auf dem Sparrenkoerper (96,7), nicht auf der
       Sparrenoberkante – siehe yDach weiter unten. Darueber die
       Abdeckleiste, darueber das Blech des oberen Schenkels: Genau dort
       endet das Profil, und damit liegt die Leiste IN der oberen Kammer
       statt darueber. */
    var wpBlech = wandprofilKammern(wpGlasD).blech;
    var leisteOkHinten = ukHinten + SPARREN.koerper + wpGlasD + GLASLEISTE.hoehe;
    var wpOk = sky ? hRinne + riH : leisteOkHinten + wpBlech;
    var wpMitte = wpOk - wpH / 2;
    var trOk = vorsprH > 0 ? ukAmTraeger : wpOk;
    /* KORREKTUR 11.10.2026: „der statikträger ist tiefer als der
       sparren, mach ihn unten bündig mit sparren und oben bündig mit
       glasleiste" (Betreiber, mit Bildschirmfoto).

       Steht der Träger HINTER den Sparren (freistehend ohne hinteren
       Vorsprung), ist er die Wand – dann darf er unten nicht unter den
       Sparren hervorstehen. Oben schließt er mit der Glasleiste ab, das
       war schon so; unten endet er jetzt an der Sparrenunterkante. Seine
       Höhe ergibt sich damit aus dem Dach: Sparrenhöhe plus Eindeckung,
       nicht mehr aus dem festen Querschnittsmaß.

       ABWEICHUNG VOM BELEGTEN MASS, bewusst: Die Maßtabelle nennt den
       Träger mit 189 mm Höhe. Hier wird er flacher gezeichnet, weil er
       sonst im Bild 6 cm unter den Sparren heraussteht. Welches Profil
       an dieser Stelle wirklich sitzt, ist eine Frage an den Hersteller
       – sie steht in docs/NEXT_TASK.md. Die TIEFE (117 mm) bleibt
       unangetastet; an ihr hängt das Tiefenmaß der ganzen Anlage.

       Liegt der Träger dagegen UNTER den Sparren (hinterer Vorsprung),
       trägt er wirklich und behält seine vollen 189 mm. */
    var trH = (frei && vorsprH <= 0) ? Math.max(spH, trOk - ukHinten) : TR_H;
    var hPfostenHinten = frei ? Math.max(100, trOk - trH) : hHinten;

    /* Pfostenzahl – JE REIHE getrennt.

       „und das gilt immer nur für die seite wo der sttikträger ist, ist
       er auf beiden seiten z.b bei freistehend und dachvorsprung dann
       gilts für beide seiten" (Betreiber, 11.10.2026).

       Die 7-m-Regel hängt also nicht am Bauwerk, sondern am einzelnen
       Träger. Vorne gilt sie, wenn dort einer liegt (Tiefe über 4500 mm
       oder Dachvorsprung). Hinten gibt es eine Reihe nur freistehend –
       und dort liegt immer einer, also gilt sie dort immer.

       Beide Reihen mit derselben Zahl zu zeichnen wäre der bequeme
       Fehler: Bei freistehend OHNE Vorsprung und unter 4,5 m Tiefe
       stünden vorne nach Tabelle drei Pfosten, hinten nach der 7-m-Regel
       zwei. */
    var pfTab = tbMass;
    var pfTabelle = pfTab ? pfTab.pfosten : (B > 500 ? 3 : 2);
    var pfVorne = traegerH > 0 ? pfostenUnterTraeger(Z.breite) : pfTabelle;
    var pfHinten = pfostenUnterTraeger(Z.breite);

    /* Die Achsen der VORDEREN Pfosten werden unten noch gebraucht: Die
       Schiebeanlage läuft je Pfostenfach, nicht über die ganze Breite. */
    var xPfVorne = verteilen(pfVorne, B, PF / 2);
    xPfVorne.forEach(function (x) {
      balken(PF, hPfosten, PF, x, hPfosten / 2, zPf, mAlu);
    });
    if (frei) {
      verteilen(pfHinten, B, PF / 2).forEach(function (x) {
        balken(PF, hPfostenHinten, PF, x, hPfostenHinten / 2, zTrHinten, mAlu);
      });
    }

    /* ---------- Unterzug ueber die ganze Breite ----------
       „Ab gewissen tiefen … steht in der preisliste unterzug über die
       gesamte breite notwendig … ich denke damit ist gemeint das z.b nochmal
       in der mitte 2 pfosten + statikträger hin müssten" (Betreiber,
       15.10.2026, mit Bild). Genau so: ein Statiktraeger quer unter den
       Sparren und eine eigene Pfostenreihe darunter.

       Seine Lage ist einstellbar (siehe unterzugBereich) – gezeichnet wird
       sie aus demselben Wert, den der Regler zeigt und die Anfrage nennt.
       Beim SkyView gibt es ihn nicht: Dort traegt der umlaufende Rahmen. */
    if (!sky && unterzugNoetig()) {
      var zUz = T - unterzugAbstand() / 10;      // Regler zaehlt ab der WAND
      var ukUz = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zUz);
      var uzOk = ukUz;                            // Traegeroberkante = Sparrenunterkante
      /* Volle 189 mm: Dieser Traeger liegt UNTER den Sparren und traegt
         wirklich – anders als der hintere, der als Wand dient und deshalb
         auf Sparrenhoehe gekuerzt wird (siehe trH). */
      var uzH = TR_H;
      var hPfUz = Math.max(100, uzOk - uzH);
      balken(B, uzH, TR_T, 0, uzOk - uzH / 2, zUz, mAlu);
      verteilen(pfostenUnterTraeger(Z.breite), B, PF / 2).forEach(function (x) {
        balken(PF, hPfUz, PF, x, hPfUz / 2, zUz, mAlu);
      });
    }

    /* Rinne vorne. hRinne ist die Unterkante der Rinne. Ohne Statikträger
       ist das die Durchgangshöhe; mit Träger liegt sie um dessen Höhe
       darüber, weil er zwischen Pfosten und Rinne sitzt. */
    if (sky) {
      /* Der Kasten vorne: gerillte Außenseite nach vorne (+z). Die
         Drehung legt die Profillänge in x, deshalb Math.PI / 2. */
      /* ---------- Sichtbar ist nur die vorderste Schicht ----------
         „die blenden links und rechts sind gut aber warum is die
         vorderseite so fett" (Betreiber, 14.10.2026, mit Bildschirmfoto).

         Vorher wurde hier die ganze Rinnentiefe (186,3 mm) als gerillter
         Block gezeichnet – von vorne sah das Dach damit aus, als haette
         es eine 19 cm dicke Kante. In Wirklichkeit ist die Blende so
         duenn wie an den Seiten; die Rinne liegt DAHINTER und ist von
         aussen nicht zu sehen.

         Darum zwei Teile: vorne die gerillte Blende in Blendendicke,
         dahinter ein glatter Kasten ueber die restliche Rinnentiefe. Der
         schliesst die Unteransicht, ohne nach vorne aufzutragen. */
      /* DREHUNG: Die Rillen liegen im Profil auf der Seite +x. Nach
         rotateY(d) zeigt diese Flaeche in Richtung -sin(d) auf der
         z-Achse – fuer „nach vorne" (+z) braucht es also -90°, nicht
         +90°. „und von der innenseite is nix geriffelt" (Betreiber,
         14.10.2026): Vorne und hinten waren sie nach innen gedreht,
         seitlich stimmten sie – deshalb fiel es dort nicht auf. */
      blendeProfil(B, riH, RANDBLENDE.dicke, 0, hRinne + riH / 2,
                   T - RANDBLENDE.dicke / 2, -Math.PI / 2, mAlu);
      balken(B, riH, riT - RANDBLENDE.dicke, 0, hRinne + riH / 2,
             T - RANDBLENDE.dicke - (riT - RANDBLENDE.dicke) / 2, mAlu);
    } else {
      rinneBauen(B, T, hRinne, mAlu);
      rinnenblenden(B, T, hRinne, mAlu);
    }
    if (traegerH) {
      /* Volle Dachbreite, immer über den Pfosten. Ohne Vorsprung heißt
         das „unter der Rinne", mit Vorsprung „unter den Sparren" – die
         Höhe ergibt sich aus der Pfostenlage, nicht aus einer zweiten
         Regel. */
      balken(B, traegerH, traegerT, 0, hPfosten + traegerH / 2, zPf, mAlu);
    }
    /* Wandprofil – IMMER dasselbe Teil an derselben Stelle. Freistehend
       sitzt dahinter der Träger statt der Mauer, mehr ändert sich nicht. */
    /* Der geschlossene Rücken steht an der Wand bzw. am Statikträger
       (z = 0), die Schenkel ragen von dort nach vorne. */
    if (sky) {
      /* Hinten dieselbe Blende, Außenseite nach hinten (-z). */
      /* Hinten dasselbe: gerillte Blende in Blendendicke, der Traeger
         als glatter Kasten dahinter. Bei Wandmontage sieht man davon
         nichts, freistehend schon. */
      blendeProfil(B, wpH, RANDBLENDE.dicke, 0, wpMitte,
                   RANDBLENDE.dicke / 2, Math.PI / 2, mAlu);
      balken(B, wpH, wpT - RANDBLENDE.dicke, 0, wpMitte,
             RANDBLENDE.dicke + (wpT - RANDBLENDE.dicke) / 2, mAlu);
    } else {
      /* Kein Quader mehr: das echte Profil mit zwei nach vorne offenen
         Kammern. wpMitte bleibt die Bezugsgroesse der uebrigen Rechnung,
         gebaut wird ab der Unterkante. */
      wandprofilBauen(B, wpMitte - wpH / 2, wpGlasD, mAlu);
    }
    /* Seitliche Abdeckung links und rechts – eigene, runde Form, siehe
       wandkappeQuerschnitt.

       NUR BEIM TDS (15.10.2026): „du hast beim sky view die wandprofil
       blende hingetan die kann weg" (Betreiber). Beim SkyView steht
       hinten der Traeger TD an Stelle des Wandprofils – ein Seitendeckel
       fuer ein Profil, das dort gar nicht sitzt, gehoert nicht ins Bild.
       Die Seite deckt dort die Seitenblende Sky (6069) ueber die ganze
       Tiefe ab.

       Derselbe Fehler wie bei der Pfostenachse am Vortag: ein Teil, das
       an einem bestimmten Profil haengt, ohne Verzweigung gebaut. */
    if (!sky) wandprofilKappen(B, wpOk, mAlu);
    if (frei) {
      balken(B, trH, TR_T, 0, trOk - trH / 2, zTrHinten, mAlu);
    }

    /* Sparrenraster BELEGT (Montageanleitung S. 33): „Dachbreite minus
       60 mm, geteilt durch die Anzahl der Felder" ergibt den Abstand von
       Sparrenmitte zu Sparrenmitte. Die äußeren Sparrenachsen liegen damit
       30 mm vom Rand – bisher stand hier die Annahme „Randsparren außen
       bündig".

       Die ANZAHL kommt normalerweise aus der Herstellermatrix über
       /api/bauteile. Liefert die nichts – zurzeit immer, weil die
       KV-Namensraum-Bindung DACHMATRIX fehlt und die Schnittstelle 503
       antwortet –, greift die Maßtabelle aus js/masstabelle.js. Erst wenn
       auch die nichts hergibt, wird geschätzt. */
    var ausTabelle = tabelleBauteile(Z.breite, Z.tiefe);
    var felder = (ausTabelle ? ausTabelle.sparren : sparrenGeschaetzt(B)) - 1;
    var randAchse = sky ? spB / 2 : 3;
    var xs = [], i;
    for (i = 0; i <= felder; i++) {
      xs.push(-B / 2 + randAchse + (B - 2 * randAchse) * i / felder);
    }
    /* Die Sparren enden an der Rückwand der Rinne, nicht an der
       Vorderkante – dahinter liegt die Rinne selbst. Die Eindeckung reicht
       ein Stück weiter, damit das Wasser in die Kehle läuft und nicht auf
       die Rinnenrückwand tropft. */
    var dachTiefe = sky ? T : T - RINNE.breite;
    /* Hinten enden die Sparren an der Vorderkante des Wandprofils, nicht
       an der Wand – sonst steckt ihr Anfang im Profil (siehe die
       Korrektur oben bei zSpHinten). */
    /* SkyView: Die Sparren liegen zwischen Rinne und Träger und greifen
       mit ihrer Ausklinkung auf beide auf – „Anlagebreite − 150 mm"
       (Montageanleitung S. 22). Sie laufen waagerecht, nicht geneigt. */
    var laenge = sky ? T - SKY.sparrenAbzug
                     : (dachTiefe - zSpHinten) / Math.cos(neig);
    var zMitte = sky ? T / 2 : (dachTiefe + zSpHinten) / 2;
    /* Die Eindeckung ragt über das Sparrenende hinaus, bis etwa in die
       Mitte der Kehle – sonst tropft das Wasser auf die Rinnenrückwand
       statt in die Rinne. GESCHÄTZT. */
    var glasUeber = sky ? 0 : RINNE.rueckwand + RINNE.innenBreite * 0.55;

    /* Der Sparren liegt in der Rinne: seine Oberkante schließt vorne mit
       der Rinnenoberkante ab, damit das Wasser von der Eindeckung in die
       Rinnenkehle läuft. Daraus folgt die Unterkante vorne – und mit dem
       Gefälle die Unterkante in der Mitte. */
    /* Der Sparren endet auf der HINTEREN Wange der Rinne, die tiefer
       liegt als die Vorderkante – sonst entwässert das Dach nach außen
       über die Nase statt in die Kehle. */
    /* Bei SkyView liegt die Eindeckung auf Rahmen UND Sparren, und die
       Rahmenoberkante steht um die Scheibendicke darüber – sie deckt das
       Glas seitlich ab. Daraus folgt die Sparrenunterkante. Vorher stand
       hier ein Viertel der Rahmenhöhe, also eine reine Schätzung. */
    /* Dieselbe Rechnung wie oben bei ukVornJetzt – beide müssen
       übereinstimmen, sonst liegt die Rahmenoberkante woanders als die
       Glasebene und das Dach anders als die Pfosten. */
    var ukVorn = sky
      ? hRinne + riH - skyGlas - spH - Math.tan(neig) * T
      : hRinne + (riH - RINNE.sparrenUnterNase - SPARREN.koerper);

    /* KORREKTUR 11.10.2026, zweiter Anlauf. Zwischendurch stand hier ein
       KEILSPARREN: unten waagerecht, nach hinten ansteigend, damit das
       Gefälle in einen 26 cm hohen Kasten passt. Im Bild war das Ergebnis
       eindeutig: „ehhhhm wasn da passiert" (Betreiber, mit
       Bildschirmfoto). Vorne liefen die Sparren spitz aus, hinten waren
       sie 18 cm hoch – das sieht nach allem aus, nur nicht nach einem
       Dach.

       Deshalb wieder das, was ein Sparren ist: ein schlankes Profil von
       120 mm, geneigt eingebaut. Das Gefälle liegt dann zwangsläufig im
       Kasten, und der wird bei tiefen Anlagen höher – siehe riH. Beides
       zusammen (schlanke Sparren UND niedriger Kasten) geht nicht: Bei
       4 m Tiefe sind 2° genau 14 cm, die müssen irgendwo hin. */
    var ukMitte = ukVorn + Math.tan(neig) * (dachTiefe - zMitte);
    var mitteY = ukMitte + spH / 2;                // Mitte, für LED und Glas

    xs.forEach(function (x) {
      sparrenBauen(laenge, x, ukMitte, zMitte, neig, mAlu);
    });

    /* ---------- Blende vor der unteren Kammer ----------
       „und jz kommt zwischen jeden sparrenabstand, ans wandprofil ne
       blende das man das innenleben also die kammern etc nicht sieht …
       bzw das man nur die untere kammer nicht sieht" (Betreiber,
       14.10.2026).

       Die untere Kammer ist nach vorne offen. Wo ein Sparren steckt,
       fuellt er sie aus; DAZWISCHEN sieht man hinein. Die Blende sitzt
       deshalb nur in den Feldern zwischen den Sparren, nicht durchgehend
       – sonst stuende sie vor den Sparren.

       Die OBERE Kammer bleibt offen: dort liegt die Scheibe. */
    if (!sky) {
      var kam = wandprofilKammern(wpGlasD);
      var wpUk = wpMitte - wpH / 2;
      for (i = 0; i < xs.length - 1; i++) {
        var feldB2 = (xs[i + 1] - xs[i]) - spB;
        if (feldB2 <= 0) continue;
        balken(feldB2, WANDBLENDE.hoehe, WANDBLENDE.dicke,
               (xs[i] + xs[i + 1]) / 2,
               wpUk + kam.blech + WANDBLENDE.hoehe / 2,
               WANDPROFIL.tiefeUnten - WANDBLENDE.dicke / 2, mAlu);
      }
    }

    /* Seitliche Randblende – siehe RANDBLENDE. Sie liegt außen am
       Randsparren und schließt oben an der Glasoberseite ab, so dass
       der Dachrand rundum geschlossen wirkt. Die Außenkante ist die
       Dachkante; nach innen überlappt sie den Sparren. */
    /* Bei SkyView ist das die Seitenblende Sky (6069): Sie deckt die
       ganze Rahmenhöhe ab, von der Rinnenunterkante bis zur Oberkante,
       und läuft über die volle Tiefe – nicht nur über die Sparrenhöhe.
       Geliefert wird sie 5 cm länger und vor Ort gekürzt (S. 20); im
       Modell steht sie deshalb nicht über. */
    var blendeH = sky ? riH : spH + (istPolycarbonat() ? 1.6 : Z.glasstaerke / 10);
    var blendeL = sky ? T : laenge;
    var blendeY = sky ? hRinne + riH / 2 : ukMitte + blendeH / 2;
    var blendeZ = sky ? T / 2 : zMitte;
    [-1, 1].forEach(function (vz) {
      if (sky) {
        /* Seitlich dieselbe gerillte Blende, Außenseite nach außen. */
        blendeProfil(blendeL, blendeH, RANDBLENDE.dicke,
                     vz * (B / 2 - RANDBLENDE.dicke / 2 + RANDBLENDE.vor),
                     blendeY, blendeZ,
                     vz > 0 ? 0 : Math.PI, mAlu);
      } else {
        randblende(blendeL, blendeH,
                   vz * (B / 2 - RANDBLENDE.dicke / 2 + RANDBLENDE.vor),
                   blendeY, blendeZ, neig, mAlu);
      }
    });

    /* Die Eindeckung liegt AUF dem schmalen Steg des Sparrens – bei TDS
       also 120 mm über dessen Unterkante. VSG 8 mm ist BELEGT
       (technische-daten.md); Polycarbonat ist mit 16 mm dicker. */
    /* Scheibendicke in cm. Polycarbonat ist die 16-mm-Stegplatte; Glas
       gibt es als VSG 8 und VSG 10 mm (Betreiber, 11.10.2026). */
    var glasDicke = istPolycarbonat() ? 1.6 : Z.glasstaerke / 10;
    var mF = dachfuellung();
    /* KORREKTUR 14.10.2026: „der 3d konf macht das falsch somit ist der
       aufbau sparren + glas + glasleiste im 3d konf zu hoch also höher
       als real" (Betreiber).

       Die Scheibe lag auf der SPARRENOBERKANTE (120 mm). Sie liegt aber
       auf dem HAUPTKOERPER (96,7 mm) – die Klaue darueber steht neben
       der Scheibe hoch und nimmt die Abdeckleiste auf. So zeigt es das
       Querschnittsbild des Betreibers. Der ganze Aufbau sass damit
       23,3 mm zu hoch; deshalb schaute oben die Leiste und unten der
       Sparren aus dem Wandprofil. */
    var yDach = ukMitte + SPARREN.koerper + glasDicke / 2;

    /* Lage des Glasstoßes, in der Ebene der Scheibe gerechnet.
       zGlasMitte ist die Mitte der ungeteilten Scheibe; koppelLokal der
       Versatz des Stoßes davon aus, längs der Dachschräge. Positiv
       heißt: Richtung Rinne. */
    /* Hinten stößt die Scheibe an das Wandprofil, sie endet nicht davor:
       „in die untere hälfte kommen die sparren und oben drüber halt glas,
       glasleisten etc." (Betreiber, 11.10.2026). Vorher blieb dort ein
       Rücksprung von 10 mm – solange die Sparren im Profil steckten, fiel
       das nicht auf; seit sie davor beginnen, wäre es ein offener Schlitz
       unter der Glasleiste. Vorne bleibt der Rücksprung von 10 mm. */
    /* Nur für TDS: Bei SkyView bekommt die Scheibe ihre Lage weiter
       unten aus der Rahmentiefe, dort spielt dieser Wert keine Rolle. */
    var glasRueck = sky ? 1 : 0;              // Rücksprung hinten, cm
    /* SkyView: Die Scheibe liegt zwischen Rinne und Träger und ruht auf
       beiden auf – zwei Zentimeter Auflage je Seite (GESCHÄTZT; die
       Anleitung nennt dafür kein Maß). Sie ist damit kürzer als der
       Sparren, der mit seiner Ausklinkung weiter unter die Profile
       greift. */
    var skyAuflage = 2.0;
    var zGlasMitte = sky ? T / 2 : zMitte + (glasRueck + glasUeber - 1) / 2;
    var vollGlas = sky ? Math.max(10, T - SKY.rinneT - SKY.traegerT + 2 * skyAuflage)
                       : laenge + glasUeber - 1 - glasRueck;
    var koppelZ = dachTiefe - koppelAbstand() / 10;      // mm -> cm
    var koppelLokal = (koppelZ - zGlasMitte) / Math.cos(neig);
    var koppelVorn = vollGlas / 2 - koppelLokal - KOPPEL.breite / 2;
    var koppelHinten = vollGlas / 2 + koppelLokal - KOPPEL.breite / 2;
    for (i = 0; i < xs.length - 1; i++) {
      /* BELEGT (Montageanleitung S. 9): „Breite der Eindeckung = Abstand
         zwischen Träger + 40 mm" – die Scheibe liegt also beidseitig
         20 mm auf dem Sparren auf. Vorher war sie um den Steg schmaler
         und lag damit auf nichts. */
      /* Gilt für beide Systeme, seit die Sparren dieselben sind: Die
         Scheibe liegt auf dem Sparrensteg auf, nicht zwischen den
         Sparren. Vorher war sie bei SkyView um die Auflage schmaler. */
      var lichteWeite = (xs[i + 1] - xs[i]) - spB;
      var feldB = lichteWeite + 4;
      if (feldB <= 0) continue;
      var xMitte = (xs[i] + xs[i + 1]) / 2;
      if (!glasGeteilt()) {
        var pl = new THREE.Mesh(new THREE.BoxGeometry(feldB, glasDicke, vollGlas), mF);
        pl.position.set(xMitte, yDach, zGlasMitte);
        pl.rotation.x = neig;
        pl.receiveShadow = true;
        dachTeil(pl);
        bau.add(pl);
      } else {
        /* Zwei Scheiben hintereinander, dazwischen die Kopplung. Die
           Lage kommt aus koppelAbstand() – voreingestellt mittig, im
           Bedienfeld im erlaubten Bereich verschiebbar. */
        [1, -1].forEach(function (vz) {
          var laengeT = vz > 0 ? koppelVorn : koppelHinten;
          if (laengeT <= 0) return;
          var teil = new THREE.Mesh(new THREE.BoxGeometry(feldB, glasDicke, laengeT), mF);
          var o = koppelLokal + vz * (KOPPEL.breite / 2 + laengeT / 2);
          teil.position.set(xMitte,
                            yDach - Math.sin(neig) * o,
                            zGlasMitte + Math.cos(neig) * o);
          teil.rotation.x = neig;
          teil.receiveShadow = true;
          dachTeil(teil);
          bau.add(teil);
        });
      }
    }
    /* Kopplungsprofil quer über die ganze Dachbreite, auf Scheibenhöhe. */
    if (glasGeteilt()) {
      /* Durchsichtiges Gummi, kein Alu (Betreiber, 11.10.2026). Deshalb
         halbtransparent, GANZ LEICHT matt (Betreiber: „also ganz leicht
         matt", also deutlich glatter als mein erster Wert 0,55) und ohne
         Metallanteil.

         Der Farbton ist bewusst dunkler als das echte Gummi: „mach das
         kopplungsprofil leicht dunkler das man es besser im 3d sieht"
         (Betreiber). Ein nahezu farbloses Profil auf durchsichtigem Glas
         verschwindet am Bildschirm – hier geht Erkennbarkeit vor
         Naturtreue, und das steht hier, damit es niemand später als
         Farbfehler „korrigiert".

         Es wirft
         keinen Schatten, sonst läge ein dunkler Streifen quer über die
         Terrasse, den es in echt nicht gibt. */
      var mKoppel = new THREE.MeshPhysicalMaterial({
        color: rgb(0x9fa8ad), roughness: 0.28, metalness: 0,
        transparent: true, opacity: 0.55, side: THREE.DoubleSide
      });
      var kq = new THREE.Mesh(
        new THREE.BoxGeometry(B, KOPPEL.hoehe, KOPPEL.breite), mKoppel);
      kq.position.set(0,
                      yDach + KOPPEL.hoehe / 2 - glasDicke / 2 - Math.sin(neig) * koppelLokal,
                      zGlasMitte + Math.cos(neig) * koppelLokal);
      kq.rotation.x = neig;
      kq.receiveShadow = true;
      bau.add(kq);
    }

    /* Abdeckleisten auf den Sparren – erst nach der Eindeckung, sie halten
       die Scheiben (Montageanleitung S. 34/35). */
    {
      xs.forEach(function (x, i) {
        /* Außen links und rechts sitzt die SEITENglasleiste: Sie schließt
           das Dach zur Seite ab, statt nur zwischen zwei Scheiben zu
           liegen. Dazwischen die runde Abdeckleiste. */
        /* KORREKTUR 11.10.2026: „die glasleisten sind jz generell alle zu
           kurz, die gehen bis anfang rinne und glas geht ja noch etwas
           drüber" (Betreiber, mit Bildschirmfoto).

           Die Leisten hingen an der SPARRENlänge und endeten damit an
           der hinteren Rinnenwange. Die Eindeckung reicht aber weiter,
           bis über die Kehle – dort lag sie frei. Jetzt laufen die
           Leisten genau so weit wie die Scheibe, mit demselben Maß und
           derselben Mitte: Sie halten das Glas, also gehören sie auf
           seine Länge, nicht auf die des Sparrens. */
        if (i === 0 || i === xs.length - 1) {
          seitenglasleiste(vollGlas, x, ukMitte + SPARREN.koerper + glasDicke, zGlasMitte,
                           neig, i === 0, mAlu);
        } else {
          abdeckleiste(vollGlas, x, ukMitte + SPARREN.koerper + glasDicke, zGlasMitte, neig, mAlu);
        }
      });
    }

    /* Die frühere Attika-Blende rundum entfällt: Sie war der Versuch, das
       kubische Aussehen ohne die echten Profile nachzustellen, und stand
       26 cm hoch ÜBER dem Dach. Nach der Montageanleitung bilden Rinne,
       Träger und Seitenblende den Rahmen – alle mit derselben Oberkante
       in WAAGE. Die Glasleisten darauf sind dieselben wie bei TDS und
       werden deshalb oben für beide Systeme gebaut. */

    /* Seitenelemente und Sonnenschutz sind Zubehör und hängen nicht am
       Dachsystem – deshalb auch freistehend. */
    /* Vorderes Ende der Seitenelemente: die HINTERE Pfostenfläche, nicht
       die Dachkante. Die Dachkante liegt 186 mm hinter der Rinnenvorder-
       kante, die Pfostenachse 55 mm – dazwischen blieb Luft, und genau
       die war im Bild als Spalt zwischen Keil bzw. Senkrechtmarkise und
       Pfosten zu sehen. Vom Betreiber beanstandet:
       „die markise und keil haben lücke zum pfosten die müssen bündig
       sein". Jetzt stossen sie an den Pfosten.

       Über dem Stück zwischen Dachkante und Pfosten ist kein Dach mehr,
       sondern die Rinne – das Element haengt dort also nicht frei. */
    /* hRinne statt hVorn: Mit Statikträger liegt die Dachfläche um dessen
       Höhe höher – die Seitenelemente müssen bis dorthin reichen, sonst
       bliebe oben ein Spalt. */
    /* ---------- Beim SkyView schliessen die Seiten WAAGERECHT an ----------
       „man sieht beim sky das rahmenwand, etc. der rahmen oben schief
       unter die blende geht, beim sky ist alles immer rechtwinklig an der
       blende unterkante" (Betreiber, 14.10.2026, mit Bildschirmfoto).

       Beim TDS folgen Rahmenwand, Schiebetuer und Plankenwand oben der
       geneigten Dachunterkante – dort IST die Unterseite schraeg. Beim
       SkyView liegt darueber der waagerechte Rahmen; das Gefaelle steckt
       innen und ist verdeckt. Die Elemente enden deshalb an der
       Blendenunterkante (hRinne), und zwar rechtwinklig.

       Uebergeben wird dafuer BEIDES: Neigung 0 und eine Dachunterkante,
       die fuer jedes z dieselbe Hoehe liefert. Nur eines von beiden
       reichte nicht – die Profile richten sich nach der Neigung, ihre
       Laenge nach der Unterkante. */
    seitenErweiterungen(B, T, hRinne, PF, sky ? 0 : neig,
      sky ? function () { return hRinne; }
          : function (z) { return ukMitte + Math.tan(neig) * (zMitte - z); },
      zPf - PF / 2, xPfVorne);
    /* Die Markise bekommt die VOLLE Tiefe T, nicht dachTiefe. dachTiefe
       endet dort, wo die Sparren enden – an der Rückwand der Rinne. Mit
       diesem Maß hörten Schiene und Tuch rund 19 cm vor der Rinne auf und
       hingen in der Luft; vom Betreiber beanstandet. Die Zeichnung sagt
       „Bestellmaß Tiefe = Terrassendach Tiefe", die Markise läuft also
       über die ganze Dachtiefe bis an die Rinne. */
    sonnenschutz(B, T, hRinne, neig, PF, {
      tiefe: T,
      ok: function (z) {
        return ukMitte + SPARREN.koerper + glasDicke + Math.tan(neig) * (zMitte - z);
      },
      /* Plissee und Sonnensegel sitzen in den Sparrenfeldern – dafür
         brauchen sie die echten Achsen, nicht den Richtwert 110 cm. */
      sparren: xs,
      sparrenB: spB,
      sparrenH: spH,
      /* Die Unterdachmarkise haengt an den SPARREN, nicht auf dem Glas –
         sie braucht deren Unterkante und deren Laenge. */
      sparrenL: laenge,
      uk: function (z) { return ukMitte + Math.tan(neig) * (zMitte - z); }
    });

    if (Z.led) {
      // in die Sparren (xs sind die Sparrenachsen), nicht in die Verglasung
      /* Der Bezugspunkt war FALSCH: Die Sparrenunterkante wurde ab
         T / 2 gerechnet, die Sparren liegen aber zwischen Wandprofil
         und Rinne – ihre Mitte ist zMitte. Bei 3 m Tiefe und 8° saßen
         die Spots dadurch 11 mm zu hoch, also IM Profil statt darunter:
         „die ledspots werden in den sparren leider nicht angezeigt"
         (Betreiber, 11.10.2026). */
      ledInSparren(xs, zSpHinten, dachTiefe, function (z) {
        return ukMitte + Math.tan(neig) * (zMitte - z);
      });
    }
  }

  /* ---------- Pergola und Lamellendach ----------
     Für dieses System gibt es KEINE Herstellermatrix. Jede Zahl hier ist
     GESCHÄTZT: Pfosten 120 mm, Rahmen 160 mm hoch, Lamellenabstand 200 mm,
     Lamelle 180 × 25 mm. Die Obergrenze 7 × 4,5 m stammt aus der
     Produktangabe zu SunPro. Die Oberfläche weist darauf hin.

     Die drehbaren Lamellen sind das Kennzeichen des Systems – deshalb
     bekommen sie einen eigenen Regler. 0° steht für geschlossen (Regen
     läuft ab), 90° für senkrecht offen. */
  function bauenPergola() {
    var PFOSTEN = 12;        // GESCHÄTZT
    var RAHMEN_H = 16;       // GESCHÄTZT, Höhe des umlaufenden Profils
    var RAHMEN_B = 10;       // GESCHÄTZT, Dicke des umlaufenden Profils
    var LAM_ABSTAND = 20;    // GESCHÄTZT, Achsabstand der Lamellen
    var LAM_DICKE = 2.5;     // GESCHÄTZT
    /* Die Lamellenbreite leitet sich aus dem Abstand ab, mit Überlappung:
       Ein Lamellendach ist geschlossen regendicht, die Lamellen greifen
       ineinander. Eine feste Breite ließe bei 0° Lücken stehen. GESCHÄTZT. */
    var LAM_UEBERLAPPUNG = 1.08;

    var B = Z.breite / 10, T = Z.tiefe / 10;
    var h = Z.hoehe / 10;                       // lichte Höhe unter dem Rahmen
    var frei = Z.aufbau === 'Freistehend';
    var mAlu = alu();

    belag.scale.set(B + 160, 1, T + 140);
    belag.position.set(0, -1, (T + 140) / 2 - 70);
    wand.visible = !frei;
    wand.scale.set(B + 420, h + RAHMEN_H + 190, 1);
    wand.position.set(0, (h + RAHMEN_H + 190) / 2, -12);

    /* Pfosten: vorne immer zwei, hinten nur freistehend. Breite Anlagen
       bekommen einen dritten – GESCHÄTZT, keine Herstellerregel. */
    var anzahl = B > 500 ? 3 : 2;
    var xP = verteilen(anzahl, B, PFOSTEN / 2);
    xP.forEach(function (x) {
      balken(PFOSTEN, h, PFOSTEN, x, h / 2, T - PFOSTEN / 2, mAlu);
      if (frei) balken(PFOSTEN, h, PFOSTEN, x, h / 2, PFOSTEN / 2, mAlu);
    });

    /* Umlaufender Rahmen – beim Lamellendach trägt er die Lamellenachsen */
    var yR = h + RAHMEN_H / 2;
    balken(B, RAHMEN_H, RAHMEN_B, 0, yR, T - RAHMEN_B / 2, mAlu);      // vorne
    balken(B, RAHMEN_H, RAHMEN_B, 0, yR, RAHMEN_B / 2, mAlu);          // hinten
    [-B / 2 + RAHMEN_B / 2, B / 2 - RAHMEN_B / 2].forEach(function (x) {
      balken(RAHMEN_B, RAHMEN_H, T, x, yR, T / 2, mAlu);
    });

    var innenB = B - RAHMEN_B * 2;
    var innenT = T - RAHMEN_B * 2;

    if (Z.pgDachart === 'Lamellendach') {
      var n = Math.max(3, Math.round(innenT / LAM_ABSTAND));
      var winkel = Z.lamellen * Math.PI / 180;
      var mLam = alu();
      var lamBreite = (innenT / n) * LAM_UEBERLAPPUNG;
      for (var i = 0; i < n; i++) {
        var z = RAHMEN_B + (innenT / n) * (i + 0.5);
        var lam = new THREE.Mesh(
          new THREE.BoxGeometry(innenB, LAM_DICKE, lamBreite), mLam);
        lam.position.set(0, yR, z);
        lam.rotation.x = winkel;      // 0 = geschlossen, 90 = senkrecht offen
        lam.castShadow = true; lam.receiveShadow = true;
        bau.add(lam);
      }
    } else if (Z.pgDachart === 'Faltdach') {
      /* Textiles Dach: angedeutete Falten statt einer glatten Fläche */
      var mTuch = new THREE.MeshStandardMaterial({
        color: 0xded8c9, roughness: 0.95, metalness: 0, side: THREE.DoubleSide
      });
      var falten = Math.max(4, Math.round(innenT / 45));
      for (var f = 0; f < falten; f++) {
        var zf = RAHMEN_B + (innenT / falten) * (f + 0.5);
        var tuch = new THREE.Mesh(
          new THREE.BoxGeometry(innenB, 3, innenT / falten - 1.5), mTuch);
        tuch.position.set(0, yR + (f % 2 ? 2.5 : 0), zf);
        tuch.castShadow = true;
        bau.add(tuch);
      }
    } else {
      /* Velaris: verschiebbare Elemente – drei Felder, eines übergeschoben */
      var mEl = new THREE.MeshStandardMaterial({
        color: 0xe6e3dc, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide
      });
      for (var e = 0; e < 3; e++) {
        var tiefeEl = innenT / 3;
        var ze = RAHMEN_B + tiefeEl * (e + 0.5) - (e === 2 ? tiefeEl * 0.45 : 0);
        var el = new THREE.Mesh(
          new THREE.BoxGeometry(innenB - 2, 4, tiefeEl - 1), mEl);
        el.position.set(0, yR + (e === 2 ? 5 : 0), ze);
        el.castShadow = true;
        bau.add(el);
      }
    }

    /* Seitlicher Schutz an beiden Seiten – ZIP-Markise oder Glas */
    if (Z.pgSeitenschutz === 'ZIP-Senkrechtmarkise') {
      var mZip = new THREE.MeshStandardMaterial({
        color: rgb(0x4a4f52), roughness: 0.95, side: THREE.DoubleSide
      });
      stoffAuftragen(mZip, Z.stoffZip, T);
      [-B / 2 + RAHMEN_B, B / 2 - RAHMEN_B].forEach(function (x) {
        var zip = new THREE.Mesh(new THREE.BoxGeometry(T - RAHMEN_B * 2, h - 4, 1.2), mZip);
        zip.position.set(x, (h - 4) / 2 + 2, T / 2);
        zip.rotation.y = Math.PI / 2;
        sonneTeil(zip);
        bau.add(zip);
      });
    } else if (Z.pgSeitenschutz === 'Glas-Schiebeelemente') {
      /* Vorher stand hier der Aufruf ohne Vorgabe – und damit die
         Seitenauswahl des Terrassendachs, die beim Lamellendach gar nicht
         zu sehen ist und auf „offen" steht. Ergebnis: Man wählte Glas und
         im Bild änderte sich nichts. */
      /* Beim Lamellendach gibt es keine Auswahl je Seite, sondern nur
         „mit Glas" oder „ohne" – gezeichnet werden deshalb beide Seiten als
         Schiebetür. Die eigentliche Seitenauswahl bleibt unberührt. */
      var merkL = Z.erwLinks, merkR = Z.erwRechts, merkV = Z.erwVorne;
      Z.erwLinks = ['Schiebetür']; Z.erwRechts = ['Schiebetür']; Z.erwVorne = [];
      seitenErweiterungen(B, T, h, PFOSTEN, 0);
      Z.erwLinks = merkL; Z.erwRechts = merkR; Z.erwVorne = merkV;
    }

    if (Z.led) {
      ledSpots(verteilen(Math.max(2, Math.round(B / 150)), B, 40),
               [T * 0.3, T * 0.72], function () { return h - 1; });
    }
  }

  /* Hintergrund als Verlauf statt Volltonfläche. Ein einfarbiger Himmel
     wirkt wie eine Wand hinter dem Modell; ein Verlauf gibt dem Bild
     Tiefe – und dieselbe Textur dient als Spiegelungsvorlage. */
  var HIMMEL_CACHE = {};
  function himmelsVerlauf(oben, mitte, unten) {
    var schluessel = oben + mitte + unten;
    if (HIMMEL_CACHE[schluessel]) return HIMMEL_CACHE[schluessel];
    var c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    var g = c.getContext('2d');
    var v = g.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, oben);
    v.addColorStop(0.55, mitte);
    v.addColorStop(0.62, unten);
    v.addColorStop(1, unten);
    g.fillStyle = v;
    g.fillRect(0, 0, 8, 256);
    var t = new THREE.Texture(c);
    t.needsUpdate = true;
    HIMMEL_CACHE[schluessel] = t;
    return t;
  }

  /* ---------- Tag und Abend ---------- */
  function stimmung() {
    /* Die Schrift über dem Bild gehört zur Stimmung: „die angabe muss im
       abendmodus weiß werden sonst kann man es nicht lesen" (Betreiber,
       11.10.2026). Dunkle Schrift auf dunklem Abendhimmel war nicht zu
       entziffern. Umgeschaltet wird mit einer Klasse an der Bühne – die
       Farben stehen damit im Stilblatt, nicht im Code, und es gibt nur
       EINE Stelle, an der der Abend ein- und ausgeht. */
    var buehne = document.querySelector('.k3d-buehne');
    if (buehne) buehne.classList.toggle('ist-abend', !!Z.abend);

    /* Zufahrt grauer als Terrassenbelag – sonst wirkt der Carport,
       als stünde er auf einer Holzterrasse. */
    var belagTag = Z.produkt === 'Carport' ? 0x9c968d : 0x8e867a;
    if (Z.abend) {
      /* Der Verlauf als Hintergrundbild wird von three je nach Seiten-
         verhältnis gestreckt und zeigte eine sichtbare Kante. Hintergrund
         bleibt deshalb einfarbig; der Verlauf dient nur noch als Vorlage
         für die Spiegelungen, und genau dort wirkt er. */
      szene.background = new THREE.Color(0x1b2430);
      szene.fog = new THREE.Fog(0x1b2430, 1400, 3400);
      umgebungSetzen('#2b3a52', '#3d4a5c', '#2a2b26');
      himmel.intensity = 0.35; himmel.color.setHex(0x6f86a8); himmel.groundColor.setHex(0x2a2f36);
      sonne.intensity = 0.5; sonne.color.setHex(0xaec4e8);
      fuell.intensity = 0.12;
      renderer.toneMappingExposure = 0.95;
      rasen.material.color.copy(rgb(0x47503c));
      belag.material.color.copy(rgb(0x8f8c87));
      wand.material.color.copy(rgb(0x8e8b85));
    } else {
      szene.background = new THREE.Color(0xbcd3e6);
      szene.fog = new THREE.Fog(0xbcd3e6, 1800, 4200);
      umgebungSetzen('#9ac4e8', '#dfeaf3', '#8d9478');
      himmel.intensity = 0.5; himmel.color.setHex(0xdfeaf5); himmel.groundColor.setHex(0x8d8268);
      sonne.intensity = 1.45; sonne.color.setHex(0xfff1d6);
      fuell.intensity = 0.3;
      renderer.toneMappingExposure = 0.72;
      rasen.material.color.copy(rgb(0x6d7a5c));
      belag.material.color.copy(rgb(belagTag));
      wand.material.color.copy(rgb(0xcfc7b8));
    }

    /* Die Tuer gehoert zur Hauswand – ohne Wand steht sie frei im Raum. */
    tuer.visible = wand.visible;

    /* Rasen: die Wiese ist die groesste Flaeche im Bild. Eine Volltonfarbe
       verraet sofort, dass es eine Zeichnung ist. */
    fotoAuftragen(rasen.material, 'rasen', 4000, 4000, Z.abend);

    /* Hauswand nach der Fassadenart */
    if (wand.visible) {
      var wandFoto = Z.fassade === 'Verklinkert' ? 'klinker' : 'putz';
      if (!fotoAuftragen(wand.material, wandFoto,
                         wand.scale.x, wand.scale.y, Z.abend)) {
        /* Notnagel: das gezeichnete Muster von vorher */
        var wt = wandTextur(Z.fassade);
        wand.material.map = wt;
        wand.material.normalMap = null;
        if (wt) {
          wt.repeat.set(Math.max(1, Math.round(wand.scale.x / 110)),
                        Math.max(1, Math.round(wand.scale.y / 55)));
          wand.material.color.setHex(Z.abend ? 0x9a938c : 0xffffff);
        }
        wand.material.needsUpdate = true;
      }
    }

    /* Bodenbelag. Vor dem Carport liegt eine Zufahrt, kein Terrassenbelag –
       dort bleibt die graue Fläche ohne Muster stehen. */
    var bodenFoto = Z.produkt === 'Carport' ? 'zufahrt'
                  : (Z.boden === 'Holzdielen' ? 'holzdielen' : 'steinplatten');
    if (!fotoAuftragen(belag.material, bodenFoto,
                       belag.scale.x, belag.scale.z, Z.abend)) {
      /* Notnagel: gezeichnetes Muster, vor dem Carport gar keins */
      belag.material.normalMap = null;
      if (Z.produkt === 'Carport') {
        belag.material.map = null;
      } else {
        var tex = bodenTextur(Z.boden);
        tex.repeat.set(Math.max(1, Math.round(belag.scale.x / 90)),
                       Math.max(1, Math.round(belag.scale.z / 90)));
        belag.material.map = tex;
        if (!Z.abend) belag.material.color.copy(rgb(0xffffff));
      }
      belag.material.needsUpdate = true;
    }

    /* Das Wasserzeichen gehört zum Boden und wechselt mit der Stimmung
       die Fassung – deshalb steht es hier und nicht im Modellaufbau. */
    wasserzeichenSetzen();
  }

  /* ---------- Kamera ---------- */
  var kam = { radius: 1000, theta: 0.78, phi: 1.3, ziel: new THREE.Vector3(0, 120, 120) };
  var autoDreht = false;

  function kameraAnpassen() {
    /* Der Abstand haengt an der Groesse des Bauwerks, damit auch ein 8 m
       tiefer Carport vollstaendig ins Bild passt. Eine selbst gewaehlte
       Zoomstufe bleibt erhalten, solange das Modell dabei nicht
       angeschnitten wird - erst wenn es aus dem Bild laufen wuerde,
       rueckt die Kamera nach. */
    var spanne = Math.max(Z.breite / 10 * 1.12, (Z.tiefe / 10 + 120) * 1.3, Z.hoehe / 10 * 2.4);
    var passend = spanne / (2 * Math.tan(kamera3.fov * Math.PI / 360)) * 1.18;
    if (kamera3.aspect < 1) passend /= Math.max(0.62, kamera3.aspect);  // Hochformat
    kam.passend = passend;
    kam.radiusMin = passend * 0.45;
    kam.radiusMax = passend * 2.4;
    if (!kameraAnpassen.einmal || kam.radius < passend * 0.9 || kam.radius > passend * 1.9) {
      kam.radius = passend;
      kameraAnpassen.einmal = true;
    }
    /* Eine gewählte Ansicht überlebt die Maßänderung – sie wird mit den
       neuen Maßen neu gerechnet, statt in die Standardlage zu springen. */
    if (kam.ansicht === 'Darunter') { ansichtInnen(); kameraSetzen(); return; }
    kam.ziel.set(0, Z.hoehe / 10 * 0.48, Z.tiefe / 10 * 0.42);
    kameraSetzen();
  }

  function kameraSetzen() {
    /* Wie weit darf die Kamera heruntergehen? „man kann momentan nicht
       unter die überdachung scrollen oder mit der kamera fahren weil der
       boden blockiert, das soll gehen … das man gut drunter gucken kann"
       (Betreiber, 11.10.2026).

       Vorher endete sie knapp über dem Horizont (90° minus ein Haar) –
       von unten an die Dachunterseite kam man damit nicht. Jetzt geht es
       bis gut 25° darunter; der Boden wird dabei durchsichtig (siehe
       bodenDurchsicht). Weiter als das nicht: Bei 90° plus einem rechten
       Winkel stünde das Bild auf dem Kopf. */
    kam.phi = Math.min(Math.max(kam.phi, 0.18),
                       kam.phiMax || PHI_MAX_UNTEN);
    var x = kam.radius * Math.sin(kam.phi) * Math.sin(kam.theta);
    var y = kam.radius * Math.cos(kam.phi);
    var z = kam.radius * Math.sin(kam.phi) * Math.cos(kam.theta);
    kamera3.position.set(kam.ziel.x + x, kam.ziel.y + y, kam.ziel.z + z);
    kamera3.lookAt(kam.ziel);
    wandDurchsicht();
    bodenDurchsicht();
    neuZeichnen();
  }

  var ANSICHTEN = {
    'Perspektive': { theta: 0.78, phi: 1.3 },
    'Vorne':       { theta: 0.0, phi: 1.45 },
    'Seite':       { theta: Math.PI / 2, phi: 1.45 },
    'Von oben':    { theta: 0.0, phi: 0.22 },
    /* Von unten nach oben schauen ist mit einer Kugelkamera nicht möglich –
       phi ist bei 90° begrenzt, darüber stünde das Bild auf dem Kopf.
       „Darunter" rückt deshalb flach und nah an die Vorderkante und hebt
       den Blickpunkt unter das Dach: dasselbe Ergebnis, nämlich der Blick
       auf die Dachunterseite. */
    /* „die ansicht darunter sollte eher aussehen wie hier auf dem bild
       also quasi als ob man im terrassendach etc drinsteht" (Betreiber,
       11.10.2026, mit Bildschirmfoto aus dem Lamellendach).

       Vorher stand die Kamera AUSSEN vor der Vorderkante und schaute
       hinein. Jetzt steht sie DRIN, auf Augenhöhe, und schaut nach
       draußen und leicht nach oben – die Dachunterseite füllt dabei den
       oberen Bildrand, so wie wenn man unter der Überdachung steht. */
    'Darunter':    { innen: true }
  };

  var AUGENHOEHE = 160;      // cm – Augenhöhe eines stehenden Menschen

  /* Kamera INS Bauwerk setzen. Gerechnet, nicht geraten: Das Blickziel
     liegt draußen vor der Anlage und über Augenhöhe, die Kamera steht
     dahinter im Inneren. Aus beiden ergeben sich Winkel und Abstand. */
  function ansichtInnen() {
    var T = Z.tiefe / 10;
    var phi = Math.PI / 2 + 0.30;          // leicht nach oben geneigt
    var zielZ = T + 150;                   // Blickpunkt im Garten
    var kameraZ = T * 0.25;                // Standort: hinteres Viertel
    var r = (zielZ - kameraZ) / Math.sin(phi);
    /* KORREKTUR 11.10.2026: „bei ansicht ‚darunter' sollte es so
       aussehen rausgescrollt wie auf meinem screen" (Betreiber, mit
       Bildschirmfoto: das ganze Dach von unten, beide Pfosten im Bild).

       Mit dem alten Abstand stand die Kamera auf Augenhöhe mitten unter
       dem Dach – bei 42° Bildwinkel waren davon nur rund 1,7 m Breite zu
       sehen, also ein Ausschnitt. Der doppelte Abstand rückt sie nach
       hinten und tiefer; an der Dachvorderkante sind damit gut 4,6 m im
       Bild, bei breiteren Bildschirmen mehr. Dass sie dabei hinter der
       Wand und knapp über dem Boden steht, ist kein Problem mehr: beides
       wird in dieser Lage durchsichtig.

       Hineinzoomen bleibt möglich – bei etwa halbem Abstand steht man
       wieder mitten darunter. */
    var WEIT = 2.0;
    kam.phiMax = Math.PI / 2 + 0.5;
    kam.theta = Math.PI;                   // nach vorne hinaus schauen
    kam.phi = phi;
    kam.radius = r * WEIT;
    kam.radiusMin = r * 0.45;
    kam.radiusMax = r * 3.0;
    kam.ziel.set(0, AUGENHOEHE - r * Math.cos(phi), zielZ);
  }

  /* Eine Ansicht anwenden. Steht hier als eigene Funktion, weil sie auch
     nach jedem Neubau gebraucht wird: Sonst sprang die Kamera bei jeder
     Maßänderung in die Standardlage zurück. */
  function ansichtAnwenden(name) {
    var a = ANSICHTEN[name];
    if (!a) return;
    kam.ansicht = name;
    if (a.innen) { ansichtInnen(); kameraSetzen(); return; }
    kam.phiMax = 0;
    kam.theta = a.theta; kam.phi = a.phi;
    if (a.nah) kam.radius = Math.max(kam.radiusMin, (kam.passend || kam.radius) * a.nah);
    else if (kam.passend) kam.radius = kam.passend;
    kam.ziel.set(0, Z.hoehe / 10 * 0.48, Z.tiefe / 10 * 0.42);
    kameraSetzen();
  }

  /* ---------- Bedienung ---------- */
  /* Grad zu Prozent, BELEGT aus der Tabelle der Montageanleitung TDS.
     Abgedeckt ist der einstellbare Bereich 2° bis 14°; alles darüber
     hinaus rechnet der Tangens, damit die Funktion nicht stillschweigend
     falsche Zahlen liefert, falls der Regler je erweitert wird. */
  var NEIGUNG_PROZENT = {
    2: 3.4, 3: 5.2, 4: 7, 5: 8.8, 6: 10.5, 7: 12.3, 8: 14,
    9: 15.8, 10: 17.6, 11: 19.4, 12: 21.2, 13: 23, 14: 24.9
  };
  /* ---------- Querstoß in der Verglasung ----------
     „und vsg glas kann ja ab ner bestimmten länge nict am stück verbaut
     werden sondern is dann getrennt und muss gekopelt werden"
     (Betreiber, 11.10.2026).

     Das betrifft nur GLAS. Polycarbonat-Stegplatten kommen in langen
     Bahnen und werden nicht gestoßen.

     GRÖSSTE SCHEIBE AM STÜCK: 4500 mm. Der Betreiber hatte erst „4,50
     oder 5m am stück" geschätzt und am 11.10.2026 auf Rückfrage
     entschieden: „4,50". Damit ist die Zahl keine Schätzung mehr,
     sondern seine Festlegung.

     KORREKTUR aus demselben Tag: Ich hatte sie zuvor zusätzlich aus dem
     „Innenkern" der Maßtabelle hergeleitet (dort ab Tiefe 4600 mm) und
     das als zweite, unabhängige Quelle ausgegeben. „innenkern is keine
     glaskopplung das is für das 3d modell egal" – die Herleitung war
     falsch. Zwei Dinge, die zufällig in derselben Gegend liegen, sind
     nicht dasselbe. Dass die hergeleitete Zahl so gut passte, war
     Zufall und hätte misstrauisch machen müssen, nicht sicher.

     Der Querschnitt des Kopplungsprofils ist BELEGT – siehe KOPPEL. */
  /* BELEGT: Querschnittszeichnung „Glaskopplungsprofil" des Herstellers
     (Betreiber, 11.10.2026) – 28 mm breit, 6 mm hoch. Vorher standen
     hier geschätzte 60 × 30 mm; das war mehr als doppelt so breit und
     fünfmal so hoch wie das echte Teil. Die Zeichnung zeigt ein flaches
     T-Profil: oben die 28 mm breite Auflage, darunter ein schmaler Steg
     zwischen den Scheiben. Modelliert wird nur die sichtbare Auflage –
     der Steg liegt im Stoß und ist von außen nicht zu sehen. */
  var KOPPEL = { breite: 2.8, hoehe: 0.6 };   // cm, BELEGT
  var SCHEIBE_LANG = 4500;                  // mm, größte Scheibe am Stück

  /* Gestoßen wird, sobald die Tiefe die größte Scheibe übersteigt.
     Früher hing das an der Innenkerntiefe der Maßtabelle – der Innenkern
     ist aber etwas anderes und hat mit der Verglasung nichts zu tun. */
  function glasGeteilt() {
    return !istPolycarbonat() && Z.tiefe > SCHEIBE_LANG;
  }

  /* Wo darf der Stoß liegen? Beide Scheiben müssen für sich am Stück
     machbar bleiben, also höchstens SCHEIBE_LANG lang. Gemessen wird ab
     der RINNE – das ist die Kante, die man im Bild sieht.

       Abstand von vorne mindestens  Tiefe − 4500   (hintere Scheibe)
       Abstand von vorne höchstens   4500           (vordere Scheibe)

     Bei 7000 mm Tiefe bleibt damit der Bereich 2500 bis 4500 mm; bei
     4600 mm ist er mit 100 bis 4500 mm fast frei. */
  function koppelBereich() {
    return { min: Math.max(100, Z.tiefe - SCHEIBE_LANG),
             max: Math.min(SCHEIBE_LANG, Z.tiefe - 100) };
  }

  /* Der tatsächlich verwendete Abstand: die Einstellung, in den
     erlaubten Bereich gezwungen. 0 heißt „noch nichts eingestellt" –
     dann mittig, das ist die Lage mit der größten Reserve nach beiden
     Seiten. */
  function koppelAbstand() {
    var b = koppelBereich();
    if (!Z.koppelLage) return Math.round(Z.tiefe / 2);
    return Math.min(b.max, Math.max(b.min, Z.koppelLage));
  }

  function koppelGrenzeSetzen() {
    var el = document.getElementById('k3dKoppel');
    var zf = document.getElementById('k3dKoppelZahl');
    if (!el) return;
    var b = koppelBereich();
    el.min = b.min; el.max = b.max; el.step = 50;
    var wert = koppelAbstand();
    if (Z.koppelLage && Z.koppelLage !== wert) Z.koppelLage = wert;
    el.value = wert;
    if (zf && document.activeElement !== zf) zf.value = wert;
  }

  /* ---------- Unterzug ----------
     „Ab gewissen tiefen von dächern tds, carport tds steht ja in der
     preisliste unterzug über die gesamte breite notwendig … ich will
     diesen unterzug aber von der mitte nach links oder rechts
     verschiebbar haben aber nur soweit das die angaben in der preisliste
     nicht gebrochen werden" (Betreiber, 15.10.2026, mit Bild).

     Die Maßtabelle nennt zwei Grenzen: ohne Unterzug sind 4500 mm Tiefe
     moeglich, mit Unterzug 7000. Daraus folgt die Regel fuer die Lage:
     Der Unterzug teilt die Tiefe in ZWEI Felder, und jedes davon ist ein
     Dach ohne Unterzug – also darf keines ueber 4500 mm kommen.

     Bei 7000 mm Tiefe heisst das: zwischen 2500 und 4500 mm ab Wand.
     Mittig (3500) ist die Lage mit der groessten Reserve, deshalb der
     Vorgabewert. Die Grenzen sind damit nicht geschaetzt, sondern aus
     derselben Tabellenzeile abgeleitet, die den Unterzug ueberhaupt
     verlangt. */
  /* ---------- Statisch wirksame Tiefe ----------
     „wenn ich ne tiefe von 5000mm habe und einen unterzug brauche dann
     aber 1000mm dachüberstand mache also wandern die pfosten 1000mm nach
     innen dann liegen wir ja rechnerisch bei 4500 also nur noch
     innenkern träger nötig" (Betreiber, 15.10.2026).

     Fuer die Statik zaehlt der Abstand der AUFLAGER, nicht das Dachmass:
     Der Dachvorsprung ist ein Kragarm, er verlaengert die Spannweite
     nicht. Mit Vorsprung wandern die Pfosten um genau dieses Mass nach
     innen (siehe zPf), hinten beim freistehenden Carport ebenso.

     Die Preisliste nennt dazu nichts – sie fuehrt nur Tiefen auf. Die
     Regel kommt vom Betreiber und ist statisch zwingend: Ein Dach mit
     5000 mm Tiefe und 1000 mm Vorsprung spannt 4000 mm, nicht 5000. */
  function statikTiefe() {
    var v = gruppeGilt('vorsprung') ? (Z.vorsprung || 0) : 0;
    var vh = gruppeGilt('vorsprung-hinten') ? (Z.vorsprungHinten || 0) : 0;
    return Math.max(0, Z.tiefe - v - vh);
  }

  function unterzugNoetig() {
    var tb = tabelleBauteile(Z.breite, statikTiefe());
    return !!(tb && tb.unterzug);
  }

  /* Die drei Stufen der TDS-Preisliste (Betreiber, 15.10.2026):
     bis 4000 mm nichts, bis 4600 der Innenkern-Traeger im Sparren,
     darueber der Unterzug ueber die ganze Breite. Die Funktion gilt auch
     fuer ein einzelnes FELD eines geteilten Dachs – dort ist jedes Feld
     ein Dach fuer sich. */
  function innenkernNoetig(tiefeMm) {
    var M = window.BV_MASSTABELLE;
    if (!M || !M.regeln) return false;
    var t = tiefeMm == null ? statikTiefe() : tiefeMm;
    return t > M.regeln.innenkernAbTiefe && t <= M.regeln.tiefeMaxOhneUnterzug;
  }

  function unterzugBereich() {
    var M = window.BV_MASSTABELLE;
    var ohne = (M && M.regeln && M.regeln.tiefeMaxOhneUnterzug) || 4600;
    /* Gerechnet wird mit der SPANNWEITE, nicht mit der Dachtiefe: Beide
       Felder liegen zwischen den Auflagern, der Vorsprung kragt davor
       aus. Die Lage selbst wird weiter ab der Wand gemessen – dort faengt
       auch die Spannweite an (hinterer Vorsprung abgezogen). */
    var sp = statikTiefe();
    return { min: Math.max(500, sp - ohne), max: Math.min(ohne, sp - 500) };
  }

  /* Die Mitte der Spannweite – gemessen ab der Wand, wo die Spannweite
     anfaengt. Geklemmt auf den erlaubten Bereich: Bei sehr grossen Tiefen
     ist die geometrische Mitte zugleich die einzige Lage, bei der beide
     Felder unter dem Hoechstmass bleiben. */
  function unterzugMitte() {
    var b = unterzugBereich();
    return Math.min(b.max, Math.max(b.min, Math.round(statikTiefe() / 2)));
  }

  function unterzugAbstand() {
    if (Z.unterzugAuto) return unterzugMitte();
    var b = unterzugBereich();
    return Math.min(b.max, Math.max(b.min, Z.unterzugLage || unterzugMitte()));
  }

  /* Was zuletzt in den Regler geschrieben wurde. Daran – und nur daran –
     laesst sich erkennen, ob der naechste Wert vom Nutzer kommt oder von
     uns selbst: Steht etwas anderes im Regler als das, was wir
     hineingeschrieben haben, hat ihn jemand bewegt. Ein Vergleich mit der
     aktuellen Mitte taugt dafuer nicht, weil die sich mit jeder
     Massaenderung verschiebt. */
  var uzGesetzt = null;

  function unterzugEinlesen() {
    var el = document.getElementById('k3dUnterzug');
    if (!el) return Z.unterzugLage;
    var v = zahl('k3dUnterzug', Z.unterzugLage);
    if (Z.unterzugAuto && uzGesetzt != null && v !== uzGesetzt) {
      Z.unterzugAuto = false;      // ab jetzt gilt der Wunsch des Nutzers
    }
    return v;
  }

  function unterzugGrenzeSetzen() {
    var el = document.getElementById('k3dUnterzug');
    var zf = document.getElementById('k3dUnterzugZahl');
    if (!el) return;
    var b = unterzugBereich();
    el.min = b.min; el.max = b.max;
    /* Schritt 1 mm, nicht 50: Ein Bereichsregler rastet auf min + n × step
       ein. Bei 50er-Schritten war die Mitte der Spannweite meist gar nicht
       einstellbar – „perfekt mittig" ging dann nicht. */
    el.step = 1;
    var wert = unterzugAbstand();
    Z.unterzugLage = wert;
    /* Nur schreiben, wenn sich etwas aendert. Diese Zeile stand hier
       vorher bedingungslos UND vor dem Auslesen des Reglers: Jeder
       Schiebeversuch wurde damit sofort wieder ueberschrieben – „der
       regler klappt nicht" (Betreiber, 15.10.2026). */
    if (String(el.value) !== String(wert)) el.value = wert;
    uzGesetzt = wert;
    if (zf && document.activeElement !== zf) zf.value = wert;
  }

  function neigungProzent(grad) {
    var p = NEIGUNG_PROZENT[grad];
    /* Die Tabelle kennt nur ganze Grad. Seit der Carport die Neigung aus
       zwei Höhen ableitet, kommen auch Zwischenwerte vor – dann wird
       gerechnet und auf eine Nachkommastelle gerundet. Ohne das Runden
       stand im Bedienfeld „9,100712926493951 %" (vom Betreiber im Bild
       gemeldet, 11.10.2026). */
    if (p != null) return p;
    return Math.round(Math.tan(grad * Math.PI / 180) * 1000) / 10;
  }

  /* ---------- Geführte Reihenfolge ----------
     Der Betreiber am 11.10.2026: „du musst dir vorstellen da sitzt nen
     60 jähriger ahnungsloser opa am pc oder handy. der konfigurator muss
     für jeden leihen einfach bedienbar sein" – und: „quasi genauso wie
     jetzt schon im nicht 3d konfigurator".

     Deshalb dieselbe Reihenfolge wie im Anfrage-Assistenten: eine Frage
     nach der anderen, Weiter und Zurück, Fortschrittsbalken.

     Was hier NICHT passiert: die Bedienelemente werden nicht neu gebaut.
     Jede Gruppe im Bedienfeld trägt data-k3d-schritt und gehört damit zu
     genau einem Schritt; gesteuert wird nur, welche gerade sichtbar ist.
     Dadurch bleibt „Alles auf einen Blick" ohne Zusatzaufwand möglich,
     und es gibt keine zweite Stelle, an der dieselbe Einstellung lebt.

     data-k3d-mehr markiert, was selten gebraucht wird (Dachneigung,
     Dachvorsprung, Schiebe-Regler, Bodenbelag, Abendansicht). Das liegt
     hinter „Mehr Einstellungen" und verlängert den Hauptweg nicht.

     Schritte ohne sichtbare Gruppe werden ÜBERSPRUNGEN. Beispiel: Beim
     Carport gibt es keine Seitenelemente, beim Terrassendach keine
     Verkleidung. Ohne das Überspringen stünde man vor einer leeren Seite
     und wüsste nicht, was zu tun ist. */
  var SCHRITTE = [
    { id: 'produkt',     t: 'Was möchten Sie bauen?',
      s: 'Wählen Sie Ihr Produkt – alles Weitere richtet sich danach.' },
    { id: 'aufbau',      t: 'Wo soll es stehen?',
      s: 'An der Hauswand oder frei im Garten?' },
    { id: 'masse',       t: 'Wie groß soll es werden?',
      s: 'Ungefähre Maße genügen. Das genaue Maß nehmen wir vor Ort.' },
    { id: 'dach',        t: 'Welches Dach?',
      s: 'Klares Glas lässt am meisten Licht durch, mattes blendet weniger.' },
    { id: 'farbe',       t: 'Welche Farbe?',
      s: 'Die Farbe gilt für alle Profile – Pfosten, Dach und Seiten.' },
    { id: 'seiten',      t: 'Sollen Seiten geschlossen werden?',
      s: 'Schon eine geschlossene Seite bringt Wind- und Sichtschutz. Sie dürfen auch alles offen lassen.' },
    /* Die Verkleidung war bis 11.10.2026 ein eigener Schritt. Sie ist
       dieselbe Frage wie oben – was passiert mit den Seiten – und steht
       deshalb jetzt im Schritt „seiten". */
    { id: 'sonne',       t: 'Brauchen Sie Sonnenschutz?',
      s: 'Eine Markise hält die Hitze ab, bevor sie unter dem Dach ankommt.' },
    { id: 'technik',     t: 'Licht und Technik?',
      s: 'Alles freiwillig – Sie können jeden Punkt auch später nachrüsten.' },
    { id: 'umgebung',    t: 'Untergrund und Montage',
      s: 'Zwei Fragen, die wir für das Angebot brauchen.' },
    { id: 'fertig',      t: 'Fertig – das haben Sie zusammengestellt',
      s: 'Schicken Sie uns die Konfiguration. Sie bekommen ein Angebot nach dem kostenlosen Aufmaß.' }
  ];

  var schrittNr = 0;
  var gefuehrt = true;
  var zeigtMehr = false;

  function schrittGruppen(id, nurSichtbar) {
    return Array.prototype.filter.call(
      document.querySelectorAll('[data-k3d-schritt="' + id + '"]'),
      function (g) { return !nurSichtbar || !g.hidden; });
  }

  function schrittHatInhalt(i) {
    if (!SCHRITTE[i]) return false;
    if (SCHRITTE[i].id === 'fertig') return true;
    return schrittGruppen(SCHRITTE[i].id, true).length > 0;
  }

  function schrittSuchen(von, richtung) {
    var i = von + richtung;
    while (i >= 0 && i < SCHRITTE.length && !schrittHatInhalt(i)) i += richtung;
    if (i < 0 || i >= SCHRITTE.length) return von;
    return i;
  }

  function schrittZeigen() {
    var panel = document.getElementById('k3dPanel');
    if (!panel) return;
    panel.classList.toggle('k3d-gefuehrt', gefuehrt);

    if (!gefuehrt) {
      Array.prototype.forEach.call(document.querySelectorAll('.k3d-gruppe'),
        function (g) { g.classList.remove('ist-schritt'); });
      panel.classList.remove('ist-letzter');
      return;
    }

    /* Im geführten Modus sind die Abschnitte immer offen – zugeklappt
       sähe der aktuelle Schritt aus wie eine leere Seite. */
    Array.prototype.forEach.call(document.querySelectorAll('.k3d-sek'),
      function (d) { d.open = true; });

    if (!schrittHatInhalt(schrittNr)) {
      var weiter = schrittSuchen(schrittNr, 1);
      schrittNr = weiter !== schrittNr ? weiter : schrittSuchen(schrittNr, -1);
    }
    var sch = SCHRITTE[schrittNr];

    Array.prototype.forEach.call(document.querySelectorAll('.k3d-gruppe'),
      function (g) {
        var dazu = g.getAttribute('data-k3d-schritt') === sch.id;
        var mehr = g.hasAttribute('data-k3d-mehr');
        g.classList.toggle('ist-schritt', dazu && (!mehr || zeigtMehr));
      });

    /* Gezählt werden nur Schritte, die es in dieser Konfiguration gibt –
       „Schritt 7 von 11" wäre gelogen, wenn vier davon übersprungen
       werden. */
    var gueltig = [], i;
    for (i = 0; i < SCHRITTE.length; i++) if (schrittHatInhalt(i)) gueltig.push(i);
    var pos = gueltig.indexOf(schrittNr) + 1;
    var zahl = document.getElementById('k3dSchrittZahl');
    if (zahl) zahl.textContent = 'Schritt ' + pos + ' von ' + gueltig.length;
    var balken = document.getElementById('k3dBalken');
    if (balken) balken.style.width = (pos / gueltig.length * 100) + '%';
    var tEl = document.getElementById('k3dSchrittTitel');
    if (tEl) tEl.textContent = sch.t;
    var sEl = document.getElementById('k3dSchrittUnter');
    if (sEl) sEl.textContent = sch.s;

    var letzter = sch.id === 'fertig';
    panel.classList.toggle('ist-letzter', letzter);

    var zurueck = document.getElementById('k3dZurueck');
    if (zurueck) zurueck.disabled = pos <= 1;
    var weiterKnopf = document.getElementById('k3dWeiter');
    if (weiterKnopf) weiterKnopf.hidden = letzter;

    /* „Mehr Einstellungen" nur anbieten, wo es welche gibt. */
    var mehrKnopf = document.getElementById('k3dMehr');
    if (mehrKnopf) {
      var hatMehr = schrittGruppen(sch.id, true).some(function (g) {
        return g.hasAttribute('data-k3d-mehr');
      });
      mehrKnopf.hidden = !hatMehr;
      mehrKnopf.textContent = zeigtMehr ? 'Weniger Einstellungen ▴'
                                        : 'Mehr Einstellungen ▾';
      mehrKnopf.setAttribute('aria-expanded', zeigtMehr ? 'true' : 'false');
    }
  }

  /* Klartext, welche Seite zu ist und welche offen bleibt.

     Anlass: Ein Kunde hatte nur links Schiebetüren gewählt und später
     gefragt, ob es rundherum sei (Betreiber, 11.10.2026). Die Knöpfe
     allein haben das nicht beantwortet – sie zeigen, was man ANKLICKEN
     kann, nicht, was am Ende steht. Deshalb hier ein Satz in Worten, und
     offene Seiten werden ausdrücklich genannt statt weggelassen. */
  function seitenStandZeigen() {
    var el = document.getElementById('k3dSeitenStand');
    if (!el) return;
    var zu = [], offen = [];
    [['links', 'links'], ['rechts', 'rechts'], ['vorne', 'vorne']].forEach(function (p) {
      var l = erwListe(p[0]);
      if (l && l.length) zu.push('<b>' + p[1] + ':</b> ' + l.join(', '));
      else offen.push(p[1]);
    });
    if (!zu.length) {
      el.innerHTML = '<span class="offen">Zurzeit bleiben <b>alle drei Seiten '
        + 'offen</b> – links, rechts und vorne.</span>';
      return;
    }
    el.innerHTML = 'So steht es gerade: ' + zu.join(' · ') +
      (offen.length
        ? '.<br><span class="offen">' +
          (offen.length === 1 ? 'Offen bleibt: ' : 'Offen bleiben: ') +
          offen.join(' und ') + '.</span>'
        : '.<br><span class="offen">Damit sind alle drei Seiten geschlossen.</span>') +
      sg23Hinweis();
  }

  /* ---------- Grenzen der Schiebeanlage ----------
     BELEGT (SG23-Unterlage, Stand 01.08.2026): außen höchstens 2450 mm
     hoch (Windlast), Breite bis 7000 mm, gerechnet in
     Schritten von 500 mm.

     Das ist keine Spielerei: Die Durchgangshöhe geht im Konfigurator bis
     2700 mm. Wer 2700 einstellt und rundum Schiebetüren wählt, bekommt
     ein Bild, das so nicht baubar ist – und eine Anfrage, auf die VD mit
     „geht nicht" antwortet, nachdem der Kunde sich schon entschieden hat.
     Lieber steht es vorher da. */
  /* Fachzeilen für die Anfrage-Mail: je geschlossener Seite die Bauart,
     die der Konfigurator gewählt hat, mit Scheibenbreite. Das ist der
     Vorschlag des Hauses – der Kunde kann im Aufmaß eine andere Bauart
     bekommen, dann steht hier, wovon abgewichen wird. */
  /* Jedes der drei Felder zeigt nur, was es im Maß DIESER Seite wirklich
     gibt – sonst stünden dort Bauarten, die der Hersteller für diese
     Breite nicht liefert. Ist die Seite offen, bleibt das Feld leer und
     wird ausgeblendet. */
  /* Zeigt, was wirklich gebaut wurde: Zahl der Planken und die Fuge in
     Millimetern. Gelesen wird aus PLANKEN_IST, also aus dem fertigen
     Modell – nicht aus der Eingabe. Sonst stünde dort der Wunsch und
     nicht das Ergebnis. */
  /* Wie bei den Planken: zurueckgelesen aus dem fertigen Modell. Die
     Zeile steht deshalb NACH dem Bauen, nicht in summenSetzen - dort
     waere sie immer einen Schritt hinterher. */
  /* Das Auswahlfeld fuellt sich aus dem FERTIGEN Modell: Erst dort steht
     das lichte Mass, das wirklich gebaut wurde. Vorher gerechnet stuenden
     Moeglichkeiten drin, die es an dieser Seite gar nicht gibt. */
  function velarisFeldFuellen() {
    var sel = document.getElementById('k3dVelarisAnzahl');
    if (!sel) return;
    var moeglich = VELARIS_IST.licht
      ? velarisMoeglich(VELARIS_IST.licht, Z.velarisArt) : [];
    var neu = ['<option value="">automatisch (' +
               (VELARIS_IST.elemente || '–') + ')</option>'];
    moeglich.forEach(function (n) {
      neu.push('<option value="' + n + '">' + n + ' Element' +
               (n > 1 ? 'e' : '') + ' à ' +
               Math.round(VELARIS_IST.licht / n) + ' mm</option>');
    });
    var war = Z.velarisAnzahl;
    sel.innerHTML = neu.join('');
    sel.value = moeglich.indexOf(parseInt(war, 10)) > -1 ? war : '';
    sel.disabled = moeglich.length < 2;
  }

  /* Was wirklich gebaut wurde – aus dem fertigen Modell gelesen. */
  function rahmenStandZeigen() {
    var e = document.getElementById('k3dRahmenStand');
    if (!e) return;
    if (!erwIrgendwo('Rahmenwand')) { e.textContent = ''; return; }
    var sv = RAHMENW_IST.senkrecht, sh = RAHMENW_IST.waagerecht;
    e.textContent = 'Gebaut: ' + RAHMENW_IST.teile + '-teilig' +
      (sv + sh === 0 ? ' ohne Sprosse'
        : ' mit ' + (sv ? sv + ' senkrechten' : '') +
          (sv && sh ? ' und ' : '') + (sh ? sh + ' waagerechten' : '') + ' Sprossen') + '.';
  }

  function velarisStandZeigen() {
    velarisFeldFuellen();
    var hin = document.getElementById('k3dKlickHinweis');
    if (hin) {
      var t = velarisSchrittText();
      hin.textContent = t;
      hin.hidden = !t;
    }
    var e = document.getElementById('k3dVelarisStand');
    if (!e) return;
    if (!VELARIS_IST.elemente) { e.textContent = ''; return; }
    e.textContent = 'Gebaut: ' + VELARIS_IST.elemente + ' Element(e) à ' +
      VELARIS_IST.breite + ' mm, ' + VELARIS_IST.art +
      (VELARIS_IST.art === 'verschiebbar'
        ? ' in ' + VELARIS_IST.schienen + ' Schiene(n).' : '.') +
      (VELARIS_IST.gewuenscht === 'verschiebbar' && VELARIS_IST.art !== 'verschiebbar'
        ? ' Verschiebbar braucht drei oder vier Elemente (1500 bis 6000 mm' +
          ' lichte Breite) – hier geht das nicht, deshalb feststehend.'
        : '');
  }

  /* Was von den bestellten Spots wirklich im Bild steht – und wenn es
     nicht aufgeht, welches Set besser passen würde. */
  function ledStandZeigen() {
    var e = document.getElementById('k3dLedStand');
    if (!e) return;
    if (!Z.led || !LED_IST.spots) { e.textContent = ''; return; }
    if (!LED_IST.reihen) { e.textContent = LED_IST.rat; return; }
    var gezeichnet = LED_IST.reihen * LED_IST.proReihe;
    e.textContent = 'Gebaut: ' + gezeichnet + ' Spots in ' + LED_IST.reihen +
      ' von ' + LED_IST.nutzbar + ' nutzbaren Sparren, je ' + LED_IST.proReihe +
      '. In die äußersten beiden Sparren kommt keiner.' +
      (gezeichnet !== LED_IST.spots
        ? ' Bestellt sind ' + LED_IST.spots + ' – diese Zahl geht hier nicht' +
          ' gleichmäßig auf. ' + LED_IST.rat
        : '');
  }

  /* Was gebaut wurde – dieselbe Zahl, die in der Anfrage steht. */
  function sonneStandZeigen() {
    ['k3dSegelStand', 'k3dPlisseeStand'].forEach(function (id) {
      var e = document.getElementById(id);
      if (!e) return;
      e.textContent = SONNE_IST.bahnen
        ? 'Gebaut: ' + SONNE_IST.bahnen + ' Bahnen à ca. ' + SONNE_IST.breite +
          ' × ' + SONNE_IST.laenge + ' mm – je Sparrenfeld eine.'
        : '';
    });
  }

  function plankenStandZeigen() {
    var e = document.getElementById('k3dPlankenStand');
    if (!e) return;
    if (!PLANKEN_IST.anzahl) { e.textContent = ''; return; }
    /* Dieselbe Zahl auch neben den Regler – dort wird sie gesucht. */
    var aw = document.getElementById('k3dPlankenAnteilWert');
    if (aw) {
      aw.textContent = PLANKEN_IST.lage === 'voll'
        ? 'volle Höhe, ' + PLANKEN_IST.hoehe + ' mm'
        : PLANKEN_IST.hoehe + ' mm ' +
          (PLANKEN_IST.lage === 'unten' ? 'ab Boden' : 'unter dem Dach');
    }
    e.textContent = 'Gebaut: ' + PLANKEN_IST.anzahl +
      (PLANKEN_IST.lage === 'voll' ? '' : ' von ' + PLANKEN_IST.gesamt) +
      ' Planken, Fuge ' + String(PLANKEN_IST.fuge).replace('.', ',') + ' mm' +
      ', ' + PLANKEN_IST.hoehe + ' mm hoch ' +
      (PLANKEN_IST.lage === 'oben' ? 'unter dem Dach' : 'ab Boden') +
      (PLANKEN_IST.frei > 0
        ? ' (' + PLANKEN_IST.frei + ' mm bleiben ' +
          (PLANKEN_IST.lage === 'oben' ? 'unten' : 'oben') + ' frei)'
        : '') +
      (PLANKEN_IST.felder > 1
        ? '. Über 7 m nicht am Stück lieferbar: ' + PLANKEN_IST.felder +
          ' gleiche Felder zu je ' + PLANKEN_IST.feldLaenge +
          ' mm mit Zwischenprofil.'
        : '.');
  }

  function sg23FeldFuellen() {
    SG23_SEITEN.forEach(function (p) {
      var sel = document.getElementById(p[2]);
      if (!sel) return;
      var mass = sg23Mass(p[0]);
      var zu = erwListe(p[0]).indexOf('Schiebetür') > -1;
      if (!zu) { sel.innerHTML = ''; return; }
      var auto = sg23Bauart(mass, null);
      var html = '<option value="">Automatisch' +
        (auto ? ' – ' + auto[1] + '-türig' : '') + '</option>';
      SG23.bauarten.forEach(function (b) {
        if (!sg23Passt(b, mass)) return;
        html += '<option value="' + b[0] + '|' + b[1] + '">' + b[1] +
          '-türig, ' + b[0] + ' Schienen – Scheiben je ca. ' +
          Math.round(mass / b[1]) + ' mm</option>';
      });
      sel.innerHTML = html;
      /* Passt die gespeicherte Wahl zum neuen Maß nicht mehr, zurück auf
         Automatik – sonst zeigt das Feld etwas anderes als das Modell. */
      if (Z[p[1]] && !sg23Gewaehlt(mass, p[0])) Z[p[1]] = '';
      sel.value = Z[p[1]];
    });
  }

  function sg23Zeilen() {
    var zeilen = [];
    ['links', 'rechts', 'vorne'].forEach(function (seite) {
      if (erwListe(seite).indexOf('Schiebetür') === -1) return;
      var p = [seite, sg23Mass(seite)];
      var zusatz = (seite === 'vorne' && SG23_FELDER > 1)
        ? ' · ' + SG23_FELDER + ' Felder zwischen den Pfosten, Maß je Feld' : '';
      var b = sg23Bauart(p[1], p[0]);
      if (!b) {
        zeilen.push('Schiebeanlage ' + p[0] + ': ' + p[1] +
          ' mm – außerhalb der Standardbreiten (bis 7000 mm, Scheibe mindestens ' +
          SCHEIBE_MIN + ' mm), Aufteilung nach Aufmaß');
        return;
      }
      zeilen.push('Schiebeanlage ' + p[0] + ': ' + p[1] + ' mm licht' + zusatz +
        ' – SG23, ' + b[0] + '-rails, ' + b[1] + '-türig, ' + Z.sg23Glas + ', Scheiben je ca. ' +
        Math.round(p[1] / b[1]) + ' mm (Vorschlag, Aufteilung nach Aufmaß)');
    });
    return zeilen;
  }

  function sg23Hinweis() {
    if (!erwIrgendwo('Schiebetür')) return '';
    var saetze = [];
    var hoehe = Z.hoehe;
    if (hoehe > SG23.hoeheMaxAussen) {
      saetze.push('Die Schiebeanlage ist im Freien bis <b>' +
        SG23.hoeheMaxAussen + ' mm</b> hoch lieferbar – eingestellt sind ' +
        hoehe + ' mm. Das Aufmaß klärt, wie die Fläche aufgeteilt wird.');
    }
    /* Die Elemente laufen in der Tiefe (links/rechts) bzw. in der Breite
       (vorne) – die längste geschlossene Seite entscheidet. */
    var laengen = [];
    /* Dieselben Maße wie im Modell, nicht Z.breite/Z.tiefe – an den
       Seiten ist das Element kürzer als die Tiefe, vorne je Feld
       schmaler als die Breite. */
    ['links', 'rechts', 'vorne'].forEach(function (st) {
      if (erwListe(st).indexOf('Schiebetür') > -1) laengen.push(sg23Mass(st));
    });
    var maxL = Math.max.apply(null, laengen.concat([0]));
    if (maxL > 0 && !sg23Bauart(maxL)) {
      saetze.push('Für <b>' + maxL + ' mm</b> gibt es keine Standard-Bauart ' +
        '(lieferbar bis 7000 mm) – die Seite wird geteilt.');
    }
    var teile = [];
    SG23_SEITEN.forEach(function (p) {
      if (erwListe(p[0]).indexOf('Schiebetür') === -1) return;
      var bb = sg23Bauart(sg23Mass(p[0]), p[0]);
      if (bb) teile.push(p[0] + ' ' + bb[1] + '-türig');
    });
    if (teile.length) {
      saetze.push('Vorgeschlagen: <b>' + teile.join(', ') +
        '</b>. Die genaue Aufteilung besprechen wir beim Aufmaß.');
    }
    if (!saetze.length) return '';
    return '<br><span class="hinweis">' + saetze.join(' ') + '</span>';
  }

  function schrittWechseln(richtung) {
    var ziel = schrittSuchen(schrittNr, richtung);
    if (ziel === schrittNr) return;
    schrittNr = ziel;
    zeigtMehr = false;            // jeder Schritt beginnt schlank
    schrittZeigen();
    var rollen = document.querySelector('.k3d-sl-rollen');
    if (rollen && rollen.scrollTo) rollen.scrollTo({ top: 0, behavior: 'smooth' });
    else if (rollen) rollen.scrollTop = 0;
  }

  /* ---------- Markise im Bild anklicken ----------
     Wunsch des Betreibers (11.10.2026): „wenn man die markise anklickt
     egal ob aufdah, unterdach oder senkrecht, soll diese
     öffnen/schließen".

     Jedes Markisenteil traegt dafuer userData.sonne. Beim Klick wird der
     Strahl durch das Bild geschossen und am Treffer nach oben durch die
     Eltern gelaufen – so zaehlt auch ein Treffer auf ein Teil, das in
     einer Gruppe steckt (Auf- und Unterdachmarkise sind Gruppen).

     Unterschieden wird Klick von Drehen: Wer die Kamera dreht, bewegt
     den Zeiger. Erst unter 6 Pixel Weg und unter einer halben Sekunde
     gilt es als Klick. */
  function sonneTeil(m) { if (m) m.userData.sonne = true; return m; }

  /* Dachteile – Sparren, Eindeckung, Leisten. Sie sind die Fläche, die
     man anklickt, um die Beschattung zu öffnen oder zu schließen:
     „ändere es so man muss, wenn eine davon ausgewählt is, nur das dach
     also sparren oder glas anklicken damit die animation öffnen /
     schließen stattfindet" (Betreiber, 11.10.2026).

     Vorher musste man das Tuch selbst treffen. Bei eingefahrener Markise
     ist das ein Streifen von wenigen Zentimetern – am Handy mit dem
     Finger kaum zu treffen, und wer ihn verfehlt, denkt, es sei kaputt. */
  function dachTeil(m) { if (m) m.userData.dach = true; return m; }

  function istDach(objekt) {
    for (var o = objekt; o; o = o.parent) if (o.userData && o.userData.dach) return true;
    return false;
  }

  /* Wie lange Markise und Schiebeanlage zum Auf- und Zufahren brauchen.
     EINE Zahl für beide, damit sie nicht auseinanderlaufen – vorher
     stand die 650 zweimal im Code.

     „kannst du überall die öffnungs und schließ animation nen ticken
     langsamer machen" (Betreiber, 11.10.2026). 650 auf 950 ms: gut ein
     Drittel langsamer, aber noch keine Wartezeit. Die Bewegung IST das,
     was gezeigt werden soll – zu schnell wirkt sie wie ein Sprung. */
  var FAHRDAUER = 950;   // ms

  var strahl = new THREE.Raycaster();
  var klickStart = null;

  function istMarkise(objekt) {
    for (var o = objekt; o; o = o.parent) if (o.userData && o.userData.sonne) return true;
    return false;
  }

  /* Faehrt die Markise weich aus oder ein, statt sie springen zu lassen –
     das Ausfahren IST die Bewegung, um die es geht. Der Takt entspricht
     dem, was beim Ziehen am Regler ohnehin passiert. */
  var sonneLaeuft = null;
  /* Lamellen fahren lassen – dieselbe Dauer und dieselbe weiche Kurve
     wie bei Markise und Schiebetür, damit sich alles gleich anfühlt. */
  var velarisLaeuft = null, velarisSchiebtLaeuft = null;
  /* Verschieben wie bei den Glasschiebewänden – dieselbe Dauer, dieselbe
     Kurve. „die schiebbaren lassen sich wie die glasschiebewände
     verschieben" (Betreiber, 11.10.2026). */
  /* Weiche Kurve – einmal, statt in jeder Fahrfunktion neu. */
  function weich(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  function velarisSchiebenFahren(ziel) {
    if (velarisSchiebtLaeuft) clearInterval(velarisSchiebtLaeuft);
    var start = Z.velarisOffen, t0 = Date.now();
    var regler = document.getElementById('k3dVelarisOffen');
    velarisSchiebtLaeuft = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / FAHRDAUER);
      var w = Math.round(start + (ziel - start) * weich(p));
      if (regler) regler.value = w;
      Z.velarisOffen = w;
      /* Während der Fahrt werden nur die Element-Gruppen verschoben –
         kein Neubau. Erst am Ende läuft aendern() einmal, damit
         Zusammenfassung und Anfrage wieder stimmen. */
      var f = VELARIS_FAHRT;
      if (f) {
        var jetzt = velarisLagen(f.links, f.elLaenge, f.anzahl, f.schienen,
                                 w / 100, f.rk);
        for (var i = 0; i < f.gruppen.length; i++) {
          velarisSchieben(f.gruppen[i], f.quer, jetzt[i] - f.lagenZu[i]);
        }
        neuZeichnen();
      } else {
        aendern();
      }
      if (p >= 1) {
        clearInterval(velarisSchiebtLaeuft); velarisSchiebtLaeuft = null;
        aendern();
      }
    }, 40);
  }
  /* Jede Hälfte faehrt fuer sich – deshalb nimmt die Funktion das Feld
     entgegen, das sie bewegt, statt eines festen. */
  function velarisFahren(ziel, feld) {
    if (velarisLaeuft) clearInterval(velarisLaeuft);
    var schluessel = feld === 'unten' ? 'velarisWinkelUnten' : 'velarisWinkelOben';
    var id = feld === 'unten' ? 'k3dVelarisWinkelUnten' : 'k3dVelarisWinkelOben';
    var start = Z[schluessel], t0 = Date.now();
    var regler = document.getElementById(id);
    velarisLaeuft = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / FAHRDAUER);
      var w = Math.round(start + (ziel - start) * weich(p));
      if (regler) regler.value = w;
      Z[schluessel] = w;
      /* Nur die Lamellen dieser Hälfte drehen – kein Neubau. */
      if (VELARIS_LAMELLEN.length) {
        var kipp = (90 - w) * Math.PI / 180;
        for (var i = 0; i < VELARIS_LAMELLEN.length; i++) {
          if (VELARIS_LAMELLEN[i].haelfte === feld) {
            VELARIS_LAMELLEN[i].mesh.rotation.x = kipp;
          }
        }
        neuZeichnen();
      } else {
        aendern();
      }
      if (p >= 1) {
        clearInterval(velarisLaeuft); velarisLaeuft = null;
        aendern();
      }
    }, 40);
  }

  function sonneFahren(ziel) {
    if (sonneLaeuft) clearInterval(sonneLaeuft);
    var start = Z.sonneAus, t0 = Date.now(), dauer = FAHRDAUER;
    var regler = document.getElementById('k3dSonneAus');
    sonneLaeuft = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dauer);
      var w = Math.round(start + (ziel - start) * (p < 0.5
        ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2));
      if (regler) regler.value = w;
      Z.sonneAus = w;
      aendern();
      if (p >= 1) { clearInterval(sonneLaeuft); sonneLaeuft = null; }
    }, 40);
  }

  /* ---------- Schiebeanlage anklicken ----------
     Dasselbe Verhalten wie bei der Markise, nur je Seite. Geklickt wird
     auf eine Scheibe oder ihren Rahmen; welche Anlage gemeint ist, steht
     am Teil selbst, nicht an der Klickposition – sonst würde eine Seite
     mitgeöffnet, nur weil sie zufällig dahinter liegt. */
  function schiebeTeil(m, seite) { if (m) m.userData.schiebe = seite; return m; }

  function schiebeSeiteVon(objekt) {
    for (var o = objekt; o; o = o.parent) {
      if (o.userData && o.userData.schiebe) return o.userData.schiebe;
    }
    return null;
  }

  var schiebeLaeuft = {};
  function schiebeFahren(seite, ziel) {
    var feld = seite === 'links' ? 'offenLinks'
             : seite === 'rechts' ? 'offenRechts' : 'offenVorne';
    if (schiebeLaeuft[seite]) clearInterval(schiebeLaeuft[seite]);
    var start = Z[feld], t0 = Date.now(), dauer = FAHRDAUER;
    schiebeLaeuft[seite] = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dauer);
      Z[feld] = Math.round(start + (ziel - start) * (p < 0.5
        ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2));
      bauen();
      zusammenfassung();
      if (p >= 1) { clearInterval(schiebeLaeuft[seite]); schiebeLaeuft[seite] = null; }
    }, 40);
  }

  function schiebeGeklickt(e) {
    if (!erwIrgendwo('Schiebetür')) return false;
    var r = leinwand.getBoundingClientRect();
    strahl.setFromCamera(new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1), kamera3);
    var treffer = strahl.intersectObjects(bau.children, true);
    for (var i = 0; i < treffer.length; i++) {
      var seite = schiebeSeiteVon(treffer[i].object);
      if (seite) {
        var feld = seite === 'links' ? 'offenLinks'
                 : seite === 'rechts' ? 'offenRechts' : 'offenVorne';
        schiebeFahren(seite, Z[feld] > 50 ? 0 : 100);
        return true;
      }
      break;                         // nur das vorderste Teil zaehlt
    }
    return false;
  }

  /* ---------- Velaris anklicken ----------
     „wie bei glasschiebeelementen machen, anklicken öffnet/schließt das
     jeweilige modul" (Betreiber, 11.10.2026). Geklickt wird auf eine
     Lamelle; welche Hälfte gemeint ist, steht am Teil selbst. */
  function velarisHaelfteVon(objekt) {
    for (var o = objekt; o; o = o.parent) {
      if (o.userData && o.userData.velaris) return o.userData.velaris;
    }
    return null;
  }

  /* Ein Klick, feste Reihenfolge – so, wie man das Bauteil auch bedient:

       zu  ->  Lamellen offen  ->  Element zur Seite  ->  zu

     Zwei Bedeutungen auf dieselbe Fläche zu legen (Lamelle kippen,
     Rahmen schieben) wäre am Handy nicht zu treffen: Der Rahmen ist
     45 mm breit. Deshalb EIN Ziel und eine Reihenfolge, und unter dem
     Modell steht, was der nächste Klick tut. Bei feststehenden Anlagen
     entfällt der Schiebeschritt von selbst – kein toter Klick. */
  function velarisSchiebbarJetzt() {
    return Z.velarisArt === 'verschiebbar' &&
           VELARIS_IST.art === 'verschiebbar' && VELARIS_IST.elemente > 1;
  }

  function velarisSchritt(h) {
    var winkel = h === 'unten' ? Z.velarisWinkelUnten : Z.velarisWinkelOben;
    if (winkel <= 45) return 'kippen';
    if (velarisSchiebbarJetzt() && Z.velarisOffen < 50) return 'schieben';
    return 'schliessen';
  }

  /* Für die Zeile unter dem Modell: Welcher Schritt steht an? Gefragt
     wird die Hälfte, die als Nächstes dran wäre – geschlossen vor
     offen, damit der Hinweis zum sichtbaren Zustand passt. */
  function velarisSchrittText() {
    if (!erwIrgendwo('Velaris')) return '';
    var h = (Z.velarisWinkelOben <= 45) ? 'oben'
          : (Z.velarisWinkelUnten <= 45 ? 'unten' : 'oben');
    var schritt = velarisSchritt(h);
    if (schritt === 'kippen') return 'Velaris anklicken: Lamellen öffnen';
    if (schritt === 'schieben') return 'Velaris anklicken: Element zur Seite schieben';
    return 'Velaris anklicken: schließen';
  }

  function velarisGeklickt(e) {
    if (!erwIrgendwo('Velaris')) return false;
    var r = leinwand.getBoundingClientRect();
    strahl.setFromCamera(new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1), kamera3);
    var treffer = strahl.intersectObjects(bau.children, true);
    for (var i = 0; i < treffer.length; i++) {
      var h = velarisHaelfteVon(treffer[i].object);
      if (h) {
        var schritt = velarisSchritt(h);
        if (schritt === 'kippen') velarisFahren(90, h);
        else if (schritt === 'schieben') velarisSchiebenFahren(100);
        else {
          /* Schließen heißt: beides zu. Sonst bliebe die Anlage
             halb geschoben stehen und der nächste Klick öffnete
             wieder – man käme nie in den Ausgangszustand zurück. */
          velarisFahren(0, h);
          if (velarisSchiebbarJetzt() && Z.velarisOffen > 0) velarisSchiebenFahren(0);
        }
        return true;
      }
      break;                         // nur das vorderste Teil zaehlt
    }
    return false;
  }

  function markiseGeklickt(e) {
    if (!gruppeGilt('sonne-aus')) return false;
    var r = leinwand.getBoundingClientRect();
    strahl.setFromCamera(new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1), kamera3);
    var treffer = strahl.intersectObjects(bau.children, true);
    for (var i = 0; i < treffer.length; i++) {
      /* Das Dach gilt als Schalter: Tuch, Sparren oder Glas – alles
         löst dieselbe Bewegung aus. */
      if (istMarkise(treffer[i].object) || istDach(treffer[i].object)) {
        /* Plissee und Sonnensegel fahren NICHT ueber die Markisenfahrt:
           Die rechnet das Modell je Bild neu und laesst alle Bahnen
           gemeinsam laufen. Hier wird einmal umgestellt – den Versatz
           Bahn fuer Bahn macht bahnenFahren beim naechsten Aufbau. */
        if (Z.markise === 'Plissees' || Z.markise === 'Sonnensegel') {
          var zielB = Z.sonneAus > 50 ? 0 : 100;
          var rB = document.getElementById('k3dSonneAus');
          if (rB) rB.value = zielB;
          Z.sonneAus = zielB;
          aendern();
        } else {
          sonneFahren(Z.sonneAus > 50 ? 0 : 100);
        }
        return true;
      }
      break;                       // nur das vorderste Teil zaehlt
    }
    return false;
  }

  /* ---------- Hinweis auf den Testbetrieb ----------
     Wunsch des Betreibers (11.10.2026): „bevor das jemand für fertige
     version hält". Der Konfigurator wird gerade gebaut und getestet.

     Einmal je BROWSER-SITZUNG, nicht bei jedem Aufruf: Wer zwischen
     Konfigurator und Website hin- und herspringt, soll nicht jedes Mal
     wegklicken müssen. sessionStorage statt localStorage, damit der
     Hinweis beim nächsten Besuch wieder kommt – solange er stimmt, soll
     er auch gesehen werden.

     Erst NACH dem Cookie-Hinweis: Zwei Dialoge übereinander sind keiner.
     Der Cookie-Hinweis wird von js/cookie.js erzeugt und bekommt beim
     Einblenden die Klasse cb-visible; verschwindet sie, ist er weg.
     Findet sich nach 20 Sekunden immer noch einer, wird trotzdem
     gezeigt – lieber einmal übereinander als gar nicht.

     Schlägt sessionStorage fehl (privates Fenster, gesperrte Daten),
     wird der Hinweis gezeigt. Das ist die sichere Richtung. */
  (function () {
    var box = document.getElementById('k3dTestHinweis');
    var ok = document.getElementById('k3dTestOk');
    if (!box || !ok) return;

    var SCHLUESSEL = 'bvTestHinweisGesehen';
    try {
      if (window.sessionStorage && sessionStorage.getItem(SCHLUESSEL)) return;
    } catch (e) { /* kein Speicher: zeigen */ }

    var vorher = null;

    function schliessen() {
      box.hidden = true;
      document.removeEventListener('keydown', aufTaste);
      try {
        if (window.sessionStorage) sessionStorage.setItem(SCHLUESSEL, '1');
      } catch (e) { /* nicht schlimm, dann kommt er noch einmal */ }
      if (vorher && vorher.focus) vorher.focus();
    }
    function aufTaste(e) {
      if (e.key === 'Escape' || e.key === 'Esc') schliessen();
    }

    function zeigen() {
      vorher = document.activeElement;
      box.hidden = false;
      document.addEventListener('keydown', aufTaste);
      ok.focus();
    }

    ok.addEventListener('click', schliessen);
    box.addEventListener('click', function (e) {
      if (e.target === box) schliessen();      // Klick daneben schließt
    });

    var versuche = 0;
    (function warten() {
      var cb = document.getElementById('cookieBanner');
      var sichtbar = cb && cb.classList.contains('cb-visible');
      if (!sichtbar || versuche > 40) { zeigen(); return; }
      versuche++;
      setTimeout(warten, 500);
    })();
  })();

  /* Bedienung der geführten Reihenfolge */
  (function () {
    var w = document.getElementById('k3dWeiter');
    if (w) w.addEventListener('click', function () { schrittWechseln(1); });
    var z = document.getElementById('k3dZurueck');
    if (z) z.addEventListener('click', function () { schrittWechseln(-1); });
    var m = document.getElementById('k3dMehr');
    if (m) m.addEventListener('click', function () {
      zeigtMehr = !zeigtMehr;
      schrittZeigen();
    });
    var mo = document.getElementById('k3dModus');
    if (mo) mo.addEventListener('click', function () {
      gefuehrt = !gefuehrt;
      mo.textContent = gefuehrt ? 'Alles auf einen Blick' : 'Schritt für Schritt';
      mo.setAttribute('aria-pressed', gefuehrt ? 'false' : 'true');
      /* Beim Umschalten auf „alles" bleiben die Abschnitte offen, sonst
         stünde man vor acht zugeklappten Überschriften. */
      schrittZeigen();
    });
  })();

  var zieht = false, letzteX = 0, letzteY = 0, letzterAbstand = 0;

  function abstand(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  leinwand.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    zieht = true; autoDreht = false;
    /* Wer selbst dreht, hat die Ansicht verlassen – sonst spränge die
       Kamera beim nächsten Neubau in die gespeicherte Lage zurück. Die
       angehobene Winkelgrenze bleibt, damit der Blick nach oben beim
       Weiterdrehen nicht plötzlich abschneidet. */
    kam.ansicht = '';
    letzteX = e.clientX; letzteY = e.clientY;
    klickStart = { x: e.clientX, y: e.clientY, t: Date.now() };
    if (leinwand.setPointerCapture) { try { leinwand.setPointerCapture(e.pointerId); } catch (x) {} }
  });

  window.addEventListener('pointermove', function (e) {
    if (!zieht) return;
    kam.theta -= (e.clientX - letzteX) * 0.007;
    kam.phi   -= (e.clientY - letzteY) * 0.007;
    letzteX = e.clientX; letzteY = e.clientY;
    kameraSetzen();
  });

  window.addEventListener('pointerup', function (e) {
    zieht = false;
    if (!klickStart) return;
    var weg = Math.abs(e.clientX - klickStart.x) + Math.abs(e.clientY - klickStart.y);
    var zeit = Date.now() - klickStart.t;
    klickStart = null;
    /* Erst die Markise, dann die Schiebeanlage: Liegt eine Markise vor
       dem Glas, ist sie gemeint. Beide duerfen nicht zugleich reagieren. */
    if (weg < 6 && zeit < 500 && !markiseGeklickt(e) && !velarisGeklickt(e)) {
      schiebeGeklickt(e);
    }
  });
  window.addEventListener('pointercancel', function () { zieht = false; });

  leinwand.addEventListener('wheel', function (e) {
    e.preventDefault();
    kam.radius = Math.min(Math.max(kam.radius * (1 + Math.sign(e.deltaY) * 0.1),
                                   kam.radiusMin), kam.radiusMax);
    kameraSetzen();
  }, { passive: false });

  // Zwei Finger: zoomen. touch-action: none im CSS verhindert, dass die
  // Seite dahinter mitscrollt.
  leinwand.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) { zieht = false; letzterAbstand = abstand(e); }
  }, { passive: true });

  leinwand.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    var jetzt = abstand(e);
    if (letzterAbstand) {
      kam.radius = Math.min(Math.max(kam.radius * (letzterAbstand / jetzt),
                                     kam.radiusMin), kam.radiusMax);
      kameraSetzen();
    }
    letzterAbstand = jetzt;
  }, { passive: false });

  /* ---------- Größe ---------- */
  function groesseAnpassen() {
    var kasten = leinwand.parentNode.getBoundingClientRect();
    var breite = Math.max(240, Math.round(kasten.width));
    var hoehe = Math.max(220, Math.round(kasten.height));
    renderer.setSize(breite, hoehe, false);
    kamera3.aspect = breite / hoehe;
    kamera3.updateProjectionMatrix();
    neuZeichnen();
  }
  window.addEventListener('resize', groesseAnpassen);

  /* ---------- Schleife ----------
     „prüfe was man machen kann das die bewegungen smooother ohne laggs
     werden, aber ohne was am konfigurator kaputt zu machen" (Betreiber,
     11.10.2026).

     Vorher wurde JEDE Bildschirmaktualisierung neu gerendert – auch
     wenn sich nichts bewegte, also 60-mal je Sekunde für ein stehendes
     Bild. Auf einem älteren Rechner oder Handy frisst das die Leistung,
     die beim Drehen fehlt.

     Jetzt wird nur gezeichnet, wenn es etwas zu zeigen gibt. `frisch`
     ist ein Zähler, kein Schalter: Jede Änderung setzt ihn auf mehrere
     Bilder, damit auch verzögerte Dinge (nachgeladene Texturen, eine
     noch nicht fertige Schattenkarte) sicher mitkommen. Wer dreht oder
     zieht, bekommt ohnehin jedes Bild.

     Das ist der vorsichtige Weg: Im Zweifel wird einmal zu viel
     gezeichnet, nie zu wenig. */
  var frisch = 6;
  /* Bewusst ohne Math.max: Sollte neuZeichnen() je aufgerufen werden,
     bevor frisch gesetzt ist, läge sonst NaN im Zähler – und dann würde
     NIE wieder gezeichnet. Ein stehendes Bild wäre der schlimmste
     denkbare Fehler dieser Optimierung. */
  function neuZeichnen() { if (!(frisch > 4)) frisch = 4; }

  function zeichnen() {
    if (autoDreht) { kam.theta += 0.0035; kameraSetzen(); }
    if (frisch > 0 || autoDreht || zieht) {
      renderer.render(szene, kamera3);
      if (frisch > 0) frisch--;
    }
    requestAnimationFrame(zeichnen);
  }

  /* ---------- Oberfläche ----------
     Am Schieberegler feuert „input" mit jeder Mausbewegung, also bis zu
     mehrmals je Bild. aendern() baut jedes Mal das GANZE Modell neu –
     beim Ziehen war das der eigentliche Grund für das Haken.

     Gebremst heißt: Es wird höchstens EINMAL je Bild gebaut, mit dem
     dann aktuellen Reglerstand. Nichts geht verloren, weil aendern()
     die Werte ohnehin frisch aus den Feldern liest. „change" bleibt
     ungebremst – das feuert nur beim Loslassen. */
  var gebremstLaeuft = false;
  function aendernGebremst() {
    if (gebremstLaeuft) return;
    gebremstLaeuft = true;
    requestAnimationFrame(function () { gebremstLaeuft = false; aendern(); });
  }

  function wert(id) { var e = document.getElementById(id); return e ? e.value : null; }
  function zahl(id, ersatz) {
    var v = parseInt(wert(id), 10);
    return isNaN(v) ? ersatz : v;
  }
  function istCarport() { return Z.produkt === 'Carport'; }
  function istCarportTds() { return istCarport() && Z.cpTyp === 'Carport TDS'; }
  function istPergola() { return Z.produkt === 'Pergola / Lamellendach'; }

  /* Liegt der Träger schon aus Tiefe oder Dachvorsprung fest? */
  /* ---------- Dachneigung ----------
     Beim Carport TDS stellt der Betreiber Höhe vorne UND hinten
     getrennt ein: „bei carport tds will ich nur höhe vorne und höhe
     hinten unabhängig voneinander verstellen können" (11.10.2026). Die
     Neigung ist dort also ein ERGEBNIS, kein Eingabewert.

     Beim Terrassendach bleibt es umgekehrt: Neigung eingeben, Wandhöhe
     ablesen. Beides gleichzeitig anzubieten wäre zwei Regler für
     dieselbe Sache – wer an einem dreht, verstellt den anderen.

     Gekappt wird auf 2 bis 14°, das zulässige Band des Systems. Wer
     extremere Höhen einstellt, sieht das gekappte Dach; die eingegebene
     Höhe hinten steht trotzdem in der Anfrage, damit das Aufmaß sie
     sieht. */
  /* Beide Höhen getrennt gibt es NUR beim freistehenden Carport – „also
     nur bei der freistehenden version" (Betreiber, 11.10.2026). An der
     Hauswand bestimmt die Wand die hintere Höhe; dort bleibt es bei
     Neigung eingeben, Wandhöhe ablesen. Dasselbe gilt für den hinteren
     Dachvorsprung: An einer Wand kann das Dach nicht nach hinten
     auskragen. */
  /* Welche Produkte überhaupt eine einstellbare Neigung haben: die
     TDS-Systeme. SkyView liegt fest bei 2°, die Pergola ist waagerecht,
     Flat Line ist ein Flachdach.

     Das hing vorher an datenSystem(), also an der Antwort von
     /api/bauteile – und die kommt nicht (503). Damit war die
     Neigungseinstellung beim Terrassendach UNSICHTBAR; genau das war im
     Bedienfeld zu sehen: unter „Höhe vorne" kam gleich „Mehr
     Einstellungen". Ob ein TDS-Dach geneigt ist, weiß das Modell aber
     auch ohne Server. */
  function neigungMoeglich() {
    return Z.produkt === 'Terrassendach TDS' || istCarportTds();
  }

  /* Zwei Wege zur Neigung, beide vom Betreiber gewünscht (11.10.2026):
       1. Grad eingeben – daraus folgt die Höhe an der Wand.
       2. Höhe an der Wand (Unterkante Wandprofil) eingeben – daraus
          folgt die Gradzahl.
     Der zweite Weg stand bisher nur beim freistehenden Carport TDS zur
     Verfügung und auch dort nur unter „Mehr Einstellungen". */
  function hoehenGetrennt() {
    return neigungMoeglich();
  }

  /* Der HINTERE Dachvorsprung bleibt, wo er war: nur beim freistehenden
     Carport TDS. „also nur bei der freistehenden version" (Betreiber,
     11.10.2026) – an der Wand gibt es hinten nichts, was überstehen
     könnte.

     Er hing bis eben an hoehenGetrennt(); seit die getrennte Höhe für
     alle TDS gilt, braucht er seine eigene Bedingung. Sonst wäre aus
     einer Erweiterung der Neigungseingabe still ein Dachvorsprung an
     Anlagen geworden, die keinen haben dürfen. */
  function vorsprungHintenMoeglich() {
    return istCarportTds() && Z.aufbau === 'Freistehend';
  }

  /* ---------- Höchstmaß des Dachvorsprungs ----------
     „dachvorsprung bei carport ruhig machen möglich bis 1500mm nicht nur
     800mm" (Betreiber, 11.10.2026). Beim Terrassendach bleibt es bei
     800 mm.

     Die Grenze wird am Regler gesetzt und der Wert mitgezogen: Wer am
     Carport 1400 mm einstellt und dann auf Terrassendach wechselt,
     bekäme sonst ein Maß, das der Regler gar nicht mehr hergibt – und
     es stünde trotzdem in der Anfrage. */
  var VORSPRUNG_MAX = { carport: 1500, standard: 800 };

  /* Gekoppelt: Die hintere Höhe wird aus Höhe vorne, Tiefe und Neigung
     gerechnet und in Regler und Zahlenfeld geschrieben – man sieht also,
     was herauskommt, kann es aber nicht verstellen. Entkoppelt bleibt
     der eingestellte Wert stehen. */
  /* Die Grenzen des Reglers sind die zulässigen Neigungen, umgerechnet
     in Höhen: 2° bis 14° bei der eingestellten Tiefe. Fest eingetragene
     2000–3200 mm reichten dafür nicht – bei 7 m Tiefe sind 14° allein
     1745 mm Anstieg, der Regler hätte bei 3200 dichtgemacht und einen
     Wert gezeigt, der nicht der gebaute ist. Gerechnet wird mit
     derselben Funktion wie in der Gegenrichtung, damit beide Wege nicht
     auseinanderlaufen. */
  function hoeheHintenGrenzen() {
    var el = document.getElementById('k3dHoeheHinten');
    var zf = document.getElementById('k3dHoeheHintenZahl');
    var min = wandUkAus(2);
    var max = wandUkAus(14);
    [el, zf].forEach(function (e) {
      if (!e) return;
      e.min = min;
      e.max = max;
    });
    if (Z.hoeheHinten < min) Z.hoeheHinten = min;
    if (Z.hoeheHinten > max) Z.hoeheHinten = max;
    return { min: min, max: max };
  }

  function hoeheHintenKoppeln() {
    var el = document.getElementById('k3dHoeheHinten');
    var zf = document.getElementById('k3dHoeheHintenZahl');
    var frei = hoehenGetrennt() && Z.hoeheGetrennt;
    if (el) el.disabled = !frei;
    if (zf) zf.disabled = !frei;
    var g = hoeheHintenGrenzen();
    if (frei) {
      /* Im freien Weg steht der eingestellte Wert; nur die Anzeige wird
         nachgezogen, falls die Grenzen ihn gerade gekappt haben. */
      if (el) el.value = Z.hoeheHinten;
      if (zf && document.activeElement !== zf) zf.value = Z.hoeheHinten;
      return;
    }
    Z.hoeheHinten = wandUkAus(Z.neigung);
    if (el) el.value = Math.min(g.max, Math.max(g.min, Z.hoeheHinten));
    if (zf && document.activeElement !== zf) zf.value = Z.hoeheHinten;
  }

  function vorsprungGrenzeSetzen() {
    var max = istCarportTds() ? VORSPRUNG_MAX.carport : VORSPRUNG_MAX.standard;
    [['k3dVorsprung', 'vorsprung'],
     ['k3dVorsprungHinten', 'vorsprungHinten']].forEach(function (pr) {
      var el = document.getElementById(pr[0]);
      if (!el) return;
      el.max = max;
      if (Z[pr[1]] > max) {
        Z[pr[1]] = max;
        el.value = max;
        var zf = document.getElementById(pr[0] + 'Zahl');
        if (zf) zf.value = max;
      }
    });
  }

  /* ---------- Unterkante Rinne und Unterkante Wandprofil ----------
     „Hersteller koppelt die berechnung an Unterkante Rinne und
     Unterkante Wandprofil, dann wird durch die tiefe des daches und
     andere angaben die grad zahl berechnet" (Betreiber, 12.10.2026),
     dazu das Bestellformular und ein Rechenbeispiel:

       5000 breit, 3000 tief, UK Rinne 2200, UK Wandprofil 2500
       → 6° laut Hersteller.

     DIESER FALL ENTSCHEIDET NICHT ALLES. Durchgerechnet wurden vier
     Varianten, und alle vier runden auf 6°:
       über die volle Tiefe                      5,71°
       über die Dachtiefe ohne Rinne             6,09°
       ohne Rinne und Wandprofil                 6,15°
       zusätzlich mit den Profilhöhen gerechnet  6,46°
     Weil das Formular nur ganze Grad zeigt, bleibt offen, welche es
     ist. Gewählt ist die einfachste – „durch die tiefe des daches",
     also über das Bestellmaß, ohne Abzüge. Ein zweiter Fall mit großer
     Tiefe würde sie trennen (bei 7000 mm Tiefe und denselben Höhen:
     2° über die volle Tiefe gegen 3° bei allen anderen); die Frage
     steht in docs/NEXT_TASK.md.

     Vorher stand hier kurzzeitig die Variante mit den Profilhöhen. Sie
     ist zurückgenommen: Die Zahl im Bedienfeld ist die, die in die
     Bestellung geht – sie muss der Hersteller nachrechnen können.

     WAS DAS BEDEUTET: Die gezeichnete Unterkante des Wandprofils liegt
     je nach Neigung 20 bis 70 mm unter dieser Zahl, weil das Modell mit
     den (teils geschätzten) Profilmaßen baut. Welches Maß dafür nicht
     stimmt – der Sparrensitz in der Rinne ist nur geschätzt –, gehört
     geprüft; auch das steht in docs/NEXT_TASK.md. Alles in Millimetern. */
  function wandUkBasis() {
    return Z.hoehe;
  }

  function wandUkSpanne() {
    return Math.max(1, Z.tiefe);
  }

  function wandUkAus(grad) {
    return Math.round(wandUkBasis() + wandUkSpanne() * neigungProzent(grad) / 100);
  }

  function gradAusWandUk(mm) {
    var grad = Math.atan((mm - wandUkBasis()) / wandUkSpanne()) * 180 / Math.PI;
    return Math.min(14, Math.max(2, Math.round(grad * 10) / 10));
  }

  function neigungGrad() {
    if (!hoehenGetrennt() || !Z.hoeheGetrennt) return Z.neigung;
    return gradAusWandUk(Z.hoeheHinten);
  }

  /* ---------- Was angezeigt und bestellt wird: ganze Grad ----------
     „kene neigung wie 5,7 oderso angeben runde es nach den richtigen
     regeln auf oder ab" (Betreiber, 12.10.2026). Das Bestellformular des
     Herstellers zeigt ebenfalls ganze Grad.

     GERECHNET wird weiter mit der genauen Neigung: Bindend sind die
     beiden Höhen, die der Kunde eingibt – danach wird gebaut, die
     Gradzahl ist das abgeleitete Maß. Würde das Modell nach der
     gerundeten Zahl zeichnen, stünde im Bedienfeld eine Höhe hinten, die
     das Bild nicht zeigt. Deshalb rundet NUR die Anzeige.

     Dass die beiden dadurch leicht auseinanderliegen (bei 2600 mm sind es
     genau 5,7°, angezeigt werden 6°), ist dieselbe Ungenauigkeit, die das
     Herstellerformular hat. Beide Höhen stehen in der Anfrage, damit es
     nachrechenbar bleibt. */
  function neigungAnzeige() {
    return Math.min(14, Math.max(2, Math.round(neigungGrad())));
  }

  /* Greift die Tiefenregel der Maßtabelle? Beim Carport TDS nicht – dort
     entscheidet allein das Häkchen bzw. der Dachvorsprung (Betreiber,
     11.10.2026). Ein Carport ist von Haus aus tief; die Regel hätte dort
     praktisch immer gegriffen und dem Kunden die Wahl genommen. */
  function unterzugGilt(tb) {
    return !!(tb && tb.unterzug) && !istCarportTds();
  }

  function traegerSchonNoetig() {
    if (unterzugGilt(tabelleBauteile(Z.breite, Z.tiefe))) return true;
    return gruppeGilt('vorsprung') && Z.vorsprung > 0;
  }
  /* ---------- Sparren, Pfosten, Traeger: EINE Quelle ----------
     Diese Zahlen stehen an zwei Stellen: im Hinweis unter den Maßen und in
     der Anfrage, die beim Betrieb ankommt. Bis zum 12.10.2026 rechnete der
     Hinweis mit der Maßtabelle, die Anfrage dagegen allein mit der Antwort
     von /api/bauteile. Die antwortet 503, solange der KV-Namensraum
     DACHMATRIX nicht gebunden ist – also standen Sparrenzahl, Pfostenzahl,
     Statikträger und Dachneigung in KEINER Anfrage. Aufgefallen beim
     Nachsehen, nicht durch eine Beschwerde.

     Darum rechnen beide jetzt hier. Reihenfolge der Quellen wie überall:
     Maßtabelle (js/masstabelle.js), und erst wo die nichts hergibt, gar
     nichts – lieber keine Zahl in der Anfrage als eine geschätzte.
     Sobald DACHMATRIX gebunden ist, gehört hier die Antwort von
     /api/bauteile davorgeschaltet (stueckliste()). */
  function bauteileJetzt() {
    var tb = tabelleBauteile(Z.breite, Z.tiefe);
    if (!tb) return null;
    var vs = gruppeGilt('vorsprung') ? Z.vorsprung : 0;
    var wunsch = gruppeGilt('traeger-wunsch') && Z.traegerWunsch;
    var traeger = unterzugGilt(tb) || vs > 0 || wunsch;
    return {
      sparren: tb.sparren,
      /* Unter einem Träger gilt die 7-m-Regel, sonst die Stützfußspalte
         der Tabelle – siehe pfostenUnterTraeger(). */
      pfostenVorne: traeger ? pfostenUnterTraeger(Z.breite) : tb.pfosten,
      pfostenHinten: pfostenUnterTraeger(Z.breite),
      traeger: traeger,
      vorsprung: vs,
      wunsch: wunsch,
      lieferbar: tb.lieferbar,
      breiteTabelle: tb.breiteTabelle
    };
  }

  /* Pfosten in Worten, für Hinweis und Anfrage gleich. */
  function pfostenText(bt) {
    return (Z.aufbau === 'Freistehend' && bt.pfostenHinten !== bt.pfostenVorne)
      ? bt.pfostenVorne + ' Pfosten vorne und ' + bt.pfostenHinten + ' hinten'
      : bt.pfostenVorne + ' Pfosten je Reihe';
  }

  function istLamellen() { return istPergola() && Z.pgDachart === 'Lamellendach'; }

  /* Welche Bedienfelder gelten für das gewählte Produkt? Die Gruppen im
     HTML tragen dazu data-k3d-fuer mit einem oder mehreren Stichworten. */
  function gruppeGilt(stichwort) {
    var d = datenSystem();
    switch (stichwort) {
      case 'terrasse':       return !istCarport() && !istPergola();
      /* Seitenelemente gibt es beim Carport TDS auch – Glaswände und
         Schiebetüren am Carport sind üblich. Markisen dagegen nicht;
         die bleiben über 'sonnenschutz' gesperrt (Betreiber). */
      case 'seiten':         return !istPergola() && (!istCarport() || istCarportTds());
      case 'sonnenschutz':   return !istCarport();
      case 'carport':        return istCarport();
      case 'pergola':        return istPergola();
      case 'pg-lamellen':    return istLamellen();
      // Aufbau (Wand oder freistehend) gibt es überall außer beim Carport,
      // dort steckt die Montageart in der Ausführung
      case 'aufbau':         return !istCarport() || istCarportTds();
      case 'glas':           return (!istCarport() && !istPergola()) || istCarportTds();
      // Glasstärke nur fragen, wenn auch Glas gewählt ist
      case 'glasstaerke':    return !istPolycarbonat() &&
                                    ((!istCarport() && !istPergola()) || istCarportTds());
      case 'cp-flachdach':   return istCarport() && !istCarportTds() &&
                                    Z.cpTyp !== 'Flachdach Flat Line';
      /* Der eigene Überstand-Regler gilt nur noch den Flachdach-Carports.
         Beim Carport TDS übernimmt der Dachvorsprung des Terrassendachs. */
      case 'cp-ueberstand':  return istCarport() && !istCarportTds() &&
                                    Z.cpVariante === 'Carport mit Überstand';
      /* Die Ausführungs-Auswahl entfällt beim Carport TDS: Ihre drei
         Einträge sind genau die drei Aufbauarten, und die stehen jetzt
         im Feld „Aufbau". Zwei Felder für dieselbe Frage verwirren. */
      case 'cp-variante':    return istCarport() && !istCarportTds();
      // Der Regler „geöffnet" erscheint nur, wenn es etwas zu schieben gibt
      case 'schiebe-links':  return erwListe('links').indexOf('Schiebetür') > -1;
      case 'schiebe-rechts': return erwListe('rechts').indexOf('Schiebetür') > -1;
      case 'schiebe-vorne':  return erwListe('vorne').indexOf('Schiebetür') > -1;
      case 'schiebe':        return erwIrgendwo('Schiebetür') ||
                                    (istPergola() && Z.pgSeitenschutz === 'Glas-Schiebeelemente');
      case 'sonne-aus':      return Z.markise !== 'Ohne' || erwIrgendwo('Senkrechtmarkise');
      /* Stoff nur fragen, wenn es ein Tuch gibt, das einen braucht.
         Plissee und Sonnensegel gehoeren NICHT zur Stoffgruppe der
         Stoffkarte – dort steht LINEA / SOLARA / PERGOLA / LUNA / LUXORA. */
      case 'stoff-dach':     return STOFF_DACH_MARKISEN.indexOf(Z.markise) > -1;
      /* Sonnensegel und Plissee haben eigene Farbkarten – die aus den
         Bestellformularen, nicht die der Markisenstoffe. */
      /* Das Feld für den RAL-Ton erscheint nur bei „Andere / Beratung“. */
      case 'ral-sonder':     return Z.farbe === 'Andere / Beratung';
      /* Glas im Keil fragen wir nur, wenn irgendwo ein Keil sitzt. */
      case 'keil-glas':      return erwIrgendwo('Keil');
      case 'stoff-segel':    return Z.markise === 'Sonnensegel';
      case 'stoff-plissee':  return Z.markise === 'Plissees';
      case 'stoff-zip':      return erwIrgendwo('Senkrechtmarkise') ||
                                    Z.pgSeitenschutz === 'ZIP-Senkrechtmarkise';
      // Fassadenart interessiert nur, wenn an eine Wand montiert wird
      case 'fassade':        return (istCarport() && !istCarportTds())
                                    ? Z.cpVariante === 'Carport mit Wandmontage'
                                    : Z.aufbau === 'Wandmontage';
      // Dachvorsprung gibt es nur beim TDS (so auch im Anfrage-Assistenten)
      case 'vorsprung':      return Z.produkt === 'Terrassendach TDS' || istCarportTds();
      /* NUR beim Carport TDS und nur freistehend: „der einzige
         unterschied dort ist ein dachvorsprung auch an der hinterseite
         möglich bei freistehender montage" (Betreiber, 11.10.2026). */
      case 'vorsprung-hinten': return vorsprungHintenMoeglich();
      /* Der Regler erscheint nur, wenn die Tiefe einen Unterzug verlangt –
         sonst gaebe es nichts zu verschieben. Gilt fuer Terrassendach UND
         Carport TDS: „dächer tds, carport tds" (Betreiber, 15.10.2026). */
      case 'unterzug': return (Z.produkt === 'Terrassendach TDS' || istCarportTds()) &&
                              unterzugNoetig();
      /* Der Träger auf Wunsch wird nur gefragt, wenn ohnehin noch keiner
         da ist – ein Häkchen, das nichts ändert, verwirrt mehr als es
         hilft. Beim Carport und bei der Pergola gibt es die Bauweise
         nicht. */
      case 'traeger-wunsch': return !istCarport() && !istPergola() &&
                                    !traegerSchonNoetig();
      case 'led-detail':     return Z.led;
      // Lautsprecher bietet VD beim Carport nicht an
      case 'sound':          return !istCarport();
      case 'sound-detail':   return !istCarport() && Z.sound;
      // Heizstrahler und Wetter-Automatik stehen im Assistenten im Schritt
      // „Komfort & Technik" – dort nur beim Lamellendach
      case 'komfort':        return istPergola();
      // Flat Box ist in manchen Ausführungen schon verkleidet – dann würden
      // Paneele und Blechwand übereinander liegen
      /* Verkleidung bietet VD nur bei den Flachdach-Carports an. */
      case 'verkleidung':    return istCarport() && !istCarportTds() &&
                                    Z.cpVariante.indexOf('verkleidet') === -1;
      case 'verk-richtung':  return Z.verkRueck || Z.verkLinks || Z.verkRechts;
      /* Die Farbe der Planken fragen wir nur, wenn es Planken gibt. */
      case 'planken':        return erwIrgendwo('Plankenwand');
      case 'velaris':        return erwIrgendwo('Velaris');
      case 'rahmenwand':     return erwIrgendwo('Rahmenwand');
      // Maße sind immer frei – gebaut wird nach Kundenmaß. Das Raster ist
      // nur die Abrechnungsgrundlage und steht als Hinweis im Ergebnis.
      // Neigung nur bei TDS. SkyView und Flat Line sind Flachdächer und
      // haben laut Hersteller kein Neigungsfeld (BELEGT).
      /* Neigung eingeben: nur beim Terrassendach. Beim Carport ergibt
         sie sich aus den beiden Höhen. */
      /* Neigung eingeben, solange die hintere Höhe gekoppelt ist. Nur
         eines von beidem darf Eingabe sein, sonst verstellen sie sich
         gegenseitig. */
      /* Nicht mehr an datenSystem() gebunden – siehe neigungMoeglich(). */
      case 'neigung':        return neigungMoeglich() && !Z.hoeheGetrennt;
      case 'hoehe-hinten':   return hoehenGetrennt();
      // Die Lage des Glasstoßes nur fragen, wenn es einen gibt
      case 'kopplung':       return glasGeteilt();
      default:               return true;
    }
  }

  /* Serienfarben des Systems aus der Maßtabelle, als Namen der
     Bedienfeld-Knöpfe. Die Tabelle führt RAL-Nummern; hier werden sie
     übersetzt. „Andere / Beratung" (die Sonderfarbe) steht immer zur
     Verfügung und kommt deshalb unabhängig davon dazu. Gibt die Tabelle
     für ein Produkt nichts her, bleibt alles stehen wie bisher. */
  var RAL_ZU_NAME = {
    '7016': 'Anthrazit', '9006': 'Weißaluminium',
    '9007': 'Graualuminium', '9010': 'Reinweiß'
  };

  function farbenAusTabelle() {
    var M = window.BV_MASSTABELLE;
    if (!M || !M.farben) return null;
    var sys = (Z.produkt === 'Terrassendach TDS' || istCarportTds()) ? 'TDS'
            : (Z.produkt === 'Flachdach SkyView') ? 'SkyView'
            : (Z.produkt === 'Carport' && Z.cpTyp === 'Flachdach Flat Line') ? 'Flat_Line'
            : null;
    var liste = sys ? M.farben[sys] : null;
    if (!liste) return null;
    return liste.map(function (r) { return RAL_ZU_NAME[r] || r; })
                .concat(['Andere / Beratung']);
  }

  function panelAnpassen() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-fuer]'), function (el) {
      var gilt = el.getAttribute('data-k3d-fuer').split(/\s+/).some(gruppeGilt);
      el.hidden = !gilt;
    });

    /* Farbfelder: welche Farben das System führt. Erste Quelle ist die
       Stückliste des Herstellers; liefert die nichts – zurzeit immer,
       weil /api/bauteile 503 antwortet –, greift die Maßtabelle.

       Dort ist belegt, dass Reinweiß 9010 NUR bei TDS geführt wird.
       „korregieren" (Betreiber, 11.10.2026): Vorher blieben bei SkyView
       und Flat Line alle vier Farben stehen, und der Kunde konnte eine
       Farbe anfragen, die es für sein System nicht gibt. */
    var e = stueckliste();
    var erlaubt = (e && e.farben && e.farben.length)
      ? e.farben.map(function (f) { return f.name; })
      : (istPergola() ? FARBEN_PERGOLA : farbenAusTabelle());
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (b) {
      b.hidden = !!erlaubt && erlaubt.indexOf(b.getAttribute('data-k3d-farbe')) === -1;
    });
    // Ist die gewählte Farbe beim neuen Produkt nicht lieferbar, zurück auf
    // Anthrazit – sonst stünde in der Anfrage eine Farbe, die es nicht gibt.
    var aktiv = document.querySelector('[data-k3d-farbe="' + Z.farbe + '"]');
    if (aktiv && aktiv.hidden) farbeSetzen('Anthrazit');
  }

  /* ---------- Knopfreihen ----------
     Produkt, Aufbau, Eindeckung und Boden stehen als Knopfreihe da und nicht
     in einem Auswahlfeld: Man sieht alle Möglichkeiten gleichzeitig, und auf
     dem Handy entfällt das Systemmenü. Der Wert steht weiterhin in einem
     versteckten Feld – damit bleibt die Auswertung in aendern() unverändert
     und es gibt nur eine Stelle, an der der Wert steht. */
  function segSetzen(id, w) {
    var feld = document.getElementById(id);
    if (!feld || w == null) return;
    feld.value = w;
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-k3d-seg="' + id + '"] button'),
      function (b) {
        var ist = b.getAttribute('data-wert') === w;
        b.classList.toggle('is-active', ist);
        b.setAttribute('aria-pressed', ist ? 'true' : 'false');
      });
  }

  /* Wie die Farbe in der Anfrage heißt. Bei einer Sonderfarbe gehört die
     RAL-Nummer dazu – sonst steht in der Mail „Andere / Beratung“ und
     niemand weiß, was der Kunde eingetippt hat. */
  function farbeText() {
    if (Z.farbe !== 'Andere / Beratung') return Z.farbe;
    var n = ralNummer();
    /* Der Aufpreis gehört in die Mail: Sonst geht eine Anfrage mit
       Sonderfarbe durch, als wäre sie zum Standardpreis zu haben. Eine
       Zahl steht hier bewusst nicht – die hängt von Menge und
       Oberfläche ab und wird im Angebot genannt. */
    return n ? 'RAL ' + n + (RAL[n] ? ' ' + RAL[n][1] : '') +
                 ' (Sonderfarbe, aufpreispflichtig)'
             : 'Andere / Beratung (Sonderfarbe, aufpreispflichtig)';
  }

  /* Was aus der Eingabe geworden ist – im Bedienfeld, in Worten. */
  function ralStandZeigen() {
    var e = document.getElementById('k3dRalStand');
    if (!e) return;
    if (Z.farbe !== 'Andere / Beratung') { e.textContent = ''; return; }
    var n = ralNummer();
    var warnt = false;
    var nameEl = document.getElementById('k3dRalName');
    if (nameEl) {
      nameEl.textContent = (n && RAL[n]) ? RAL[n][1] : '';
      nameEl.hidden = !(n && RAL[n]);
    }
    if (!n) {
      e.textContent = 'Ohne Nummer zeigen wir Anthrazit. Wir beraten Sie gern.';
    } else if (RAL[n]) {
      e.textContent = 'RAL ' + n + ' ' + RAL[n][1] + ' wird angezeigt – der Ton' +
        ' am Bildschirm ist angenähert, verbindlich ist der RAL-Fächer.';
    } else {
      /* Deutlich sichtbar: Sonst sieht es aus, als wäre die Eingabe
         wirkungslos – und genau so kam es beim Betreiber an. */
      e.textContent = 'RAL ' + n + ' können wir im Modell noch nicht darstellen.' +
        ' Das Bild bleibt anthrazit – lieferbar ist die Farbe trotzdem, sie' +
        ' steht in Ihrer Anfrage.';
      warnt = true;
    }
    e.classList.toggle('ist-warnung', warnt);
  }

  function farbeSetzen(name) {
    Z.farbe = name;
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (x) {
      var ist = x.getAttribute('data-k3d-farbe') === name;
      x.classList.toggle('is-active', ist);
      x.setAttribute('aria-pressed', ist ? 'true' : 'false');
    });
  }

  /* Ausführungen des gewählten Carport-Typs in das Auswahlfeld schreiben */
  /* Beim Carport TDS fragt der Konfigurator die Montageart über „Aufbau"
     ab, nicht mehr über die Ausführungsliste. Für die Anfrage-Mail muss
     daraus wieder der Begriff des Anfrage-Assistenten werden – „mach es
     schlau aber einfach, wir müssen die anfrage die per mail kommt
     natürlich in fachbegriffen etc haben" (Betreiber). */
  function cpVarianteJetzt() {
    if (!istCarportTds()) return Z.cpVariante;
    if (Z.vorsprung > 0) return 'Carport mit Überstand';
    return Z.aufbau === 'Freistehend' ? 'Freistehender Carport'
                                      : 'Carport mit Wandmontage';
  }

  function cpVariantenSetzen() {
    var sel = document.getElementById('k3dCpVariante');
    if (!sel) return;
    var liste = CP_VARIANTEN[Z.cpTyp] || [];
    sel.innerHTML = liste.map(function (v) {
      return '<option value="' + v[0] + '">' + v[1] + '</option>';
    }).join('');
    var vorhanden = liste.some(function (v) { return v[0] === Z.cpVariante; });
    Z.cpVariante = vorhanden ? Z.cpVariante : (liste[0] ? liste[0][0] : '');
    sel.value = Z.cpVariante;
  }

  /* Schieberegler auf die Maßbereiche des Produkts stellen. Beim Wechsel
     greift die Voreinstellung – ein 3 m tiefes Terrassendach wäre als
     Carport nicht nutzbar, eine stille Umrechnung wäre irritierender. */
  function masseSetzen() {
    /* Der Carport TDS IST das Terrassendach TDS – „du hast dafür aber was
       komplett neues gemacht obwohl sich eig nur der name zu carport
       ändert mehr nicht" (Betreiber, 11.10.2026).

       Ich hatte ihm einen eigenen Maßblock mit eigenen Voreinstellungen
       gegeben (3200 × 5500 mm, Höhe 2300). Das ist genau die zweite
       Wahrheit, die beim nächsten Umbau auseinanderläuft. Es gibt keinen
       eigenen Block mehr: Er greift auf den des Terrassendachs zu,
       Grenzen und Voreinstellungen inbegriffen. Was bleibt, ist der
       Name – und der steckt in produktName() und in der Anfrage-Mail. */
    var m = MASSE[istCarportTds() ? 'Terrassendach TDS' : Z.produkt] ||
            MASSE['Terrassendach TDS'];
    [['k3dBreite', 'breite'], ['k3dTiefe', 'tiefe'], ['k3dHoehe', 'hoehe']].forEach(function (paar) {
      var el = document.getElementById(paar[0]);
      var b = m[paar[1]];
      if (!el || !b) return;
      el.min = b[0]; el.max = b[1]; el.step = b[2]; el.value = b[3];
      Z[paar[1]] = b[3];
    });
    kameraAnpassen.einmal = false;   // neues Produkt, neuer Bildausschnitt
  }

  /* Die Schieberegler laufen über den Maßbereich des Systems. Die Grenzen
     kommen aus dem Herstellerraster – nicht, weil nur diese Maße baubar
     wären (gebaut wird nach Kundenmaß), sondern weil darüber hinaus keine
     Abrechnungsgrundlage existiert. Schrittweite 10 mm: so wird aufgemessen. */
  /* Grenzen aus der Maßtabelle, wenn die Schnittstelle nichts liefert.

     Vorher standen die Grenzen fest im Code: Terrassendach bis 7000 ×
     4500 mm. Der Betreiber: „laut tds maßtabelle sind das aber nicht die
     maximalmaße wieso begrenzt du es so". Zu Recht – die Tabelle geht bei
     TDS bis 14080 mm Breite und 7000 mm Tiefe. Die festen Werte stammten
     aus der Zeit vor der Tabelle und waren eine ANNAHME, keine Grenze des
     Systems. Wer 9 m braucht, konnte es nicht einmal eingeben.

     Die Tiefe wird bei tiefeMaxMitUnterzug gekappt: Die Tabelle führt
     auch 7050 mm, markiert sie aber als nicht lieferbar. */
  function grenzenAusTabelle() {
    var g = tabelleGruppe();
    if (!g) return null;
    var M = window.BV_MASSTABELLE;
    var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
    var ts = g.tiefen.filter(function (t) { return t <= M.regeln.tiefeMaxLieferbar; });
    if (!bs.length || !ts.length) return null;
    return { breiten: bs, tiefen: ts };
  }

  function reglerGrenzenSetzen() {
    var listen = null;
    var d = datenSystem();
    if (d && RASTER) listen = RASTER[d.system + '|' + d.material];
    if (!listen) listen = grenzenAusTabelle();
    if (!listen) return;
    [['k3dBreite', 'breiten', 'breite'], ['k3dTiefe', 'tiefen', 'tiefe']].forEach(function (p) {
      var el = document.getElementById(p[0]);
      var liste = listen[p[1]] || [];
      if (!el || !liste.length) return;
      el.min = liste[0];
      el.max = liste[liste.length - 1];
      el.step = 10;
      if (Z[p[2]] < liste[0]) Z[p[2]] = liste[0];
      if (Z[p[2]] > liste[liste.length - 1]) Z[p[2]] = liste[liste.length - 1];
      el.value = Z[p[2]];
    });
  }

  function produktName() {
    if (istPergola()) return Z.pgDachart === 'Lamellendach'
      ? 'Lamellendach ' + Z.pgAusfuehrung : Z.pgDachart;
    if (!istCarport()) return Z.produkt;
    return Z.cpTyp === 'Carport TDS' ? 'Carport TDS' : 'Carport ' + Z.cpTyp.replace('Flachdach ', '');
  }

  /* Was nur wir lesen sollen: die internen Hinweise aus der Stueckliste.
     Geloescht sind sie nicht – beim Gegenlesen einer Anfrage muss man
     sehen, wo eine Annahme steckt oder zwei Quellen sich widersprechen. */
  function hinweiseIntern() {
    var e = stueckliste();
    if (!e || e.fehler || !e.hinweise) return [];
    return e.hinweise.filter(function (h) { return h.fuer === 'intern'; })
                     .map(function (h) { return h.text; });
  }

  /* Die Kurzfassung fuer den Anfrage-Assistenten. Dort steht der ganze
     Text in EINEM Feld („Aus dem 3D-Konfigurator") – als Fachwurst aus
     dreissig mit · getrennten Teilen liest sie niemand. Sie nennt, was
     der Kunde selbst eingestellt hat, nicht die Fertigungsangaben.
     Der vollstaendige Fachtext geht weiter mit, nur still (v.fachnotiz). */
  function zusammenfassungKurz() {
    var k = [produktName()];
    k.push(istCarport() ? cpVarianteJetzt() : Z.aufbau);
    k.push(Z.breite + ' × ' + Z.tiefe + ' mm, Höhe ' + Z.hoehe + ' mm');
    if (istPergola()) {
      k.push(Z.pgDachart);
      if (Z.pgSeitenschutz !== 'Nichts / später entscheiden') {
        k.push('Seitenschutz: ' + Z.pgSeitenschutz);
      }
    } else if (istCarport() && !istCarportTds()) {
      k.push('Dach: ' + Z.cpDach);
    } else {
      k.push('Eindeckung: ' + Z.eindeckung);
    }
    k.push('Farbe: ' + farbeName());
    if (!istPergola() && !istCarport()) {
      var se = [];
      [['links', Z.erwLinks], ['rechts', Z.erwRechts],
       ['vorne', Z.erwVorne]].forEach(function (pr) {
        if (pr[1].length) se.push(pr[0] + ': ' + pr[1].join(' + '));
      });
      k.push(se.length ? 'Seiten – ' + se.join(' · ') : 'Seiten offen');
      if (Z.markise !== 'Ohne') k.push('Sonnenschutz: ' + Z.markise);
    }
    if (gruppeGilt('verkleidung')) {
      var vk = [];
      if (Z.verkRueck) vk.push('hinten');
      if (Z.verkLinks) vk.push('links');
      if (Z.verkRechts) vk.push('rechts');
      if (vk.length) k.push('Verkleidung ' + Z.verkRichtung + ': ' + vk.join(', '));
    }
    if (gruppeGilt('fassade')) k.push('Fassade: ' + Z.fassade);
    var komfort = [];
    if (Z.led) komfort.push('Beleuchtung');
    if (!istCarport() && Z.sound) komfort.push('Lautsprecher');
    if (istPergola() && Z.heizung) komfort.push('Heizstrahler');
    if (istPergola() && Z.wettersensor) komfort.push('Wetter-Automatik');
    if (komfort.length) k.push('Mit ' + komfort.join(', '));
    k.push(Z.montage === 'Ja, mit Fachmontage'
      ? 'Montage durch BV AussenSysteme' : 'Selbstmontage');
    return k;
  }

  function zusammenfassung() {
    var teile = [produktName()];
    if (istPergola()) {
      teile.push(Z.aufbau);
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchgangshöhe ' + Z.hoehe + ' mm');
      if (istLamellen()) teile.push('Lamellen ' + Z.lamellen + '° geöffnet');
      if (Z.pgSeitenschutz !== 'Nichts / später entscheiden') {
        teile.push('Seitenschutz: ' + Z.pgSeitenschutz);
      }
      // Beim Lamellendach heißt RAL 9010 „Creme-Weiß" – so steht es später
      // auch im Angebot, deshalb hier schon derselbe Name.
      teile.push('Farbe: ' + (Z.farbe === 'Reinweiß' ? 'Creme-Weiß' : farbeText()));
      if (Z.led) teile.push('mit Beleuchtung');
      teile.push(Z.montage === 'Ja, mit Fachmontage' ? 'Montage durch BV AussenSysteme' : 'Selbstmontage');
      return teile;
    }
    if (istCarport()) {
      teile.push('Ausführung: ' + cpVarianteJetzt());
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchfahrtshöhe ' + Z.hoehe + ' mm');
      if (istCarportTds()) {
        if (Z.vorsprung > 0) teile.push('Dachvorsprung vorne: ' + Z.vorsprung + ' mm');
        /* Freistehend stehen beide Höhen in der Anfrage – aus ihnen
           ergibt sich die Neigung, nach der gefertigt wird. */
        if (hoehenGetrennt()) {
          teile.push('Höhe hinten: ' + Z.hoeheHinten + ' mm');
          teile.push('Daraus Dachneigung: ' + neigungAnzeige() + '° (' +
            String(neigungProzent(neigungAnzeige())).replace('.', ',') + ' %)');
        }
        if (gruppeGilt('vorsprung-hinten') && Z.vorsprungHinten > 0) {
          teile.push('Dachvorsprung hinten: ' + Z.vorsprungHinten + ' mm');
        }
        /* Der Unterzug ist keine Ausstattung, sondern eine Vorgabe der
           Preisliste – seine Lage muss in der Anfrage stehen, sonst wird
           nach Standard gefertigt und der Kunde bekommt ihn in der Mitte.
           Die Felder dazu, weil der Betrieb daran sofort sieht, dass
           beide unter 4500 mm bleiben. */
        /* Weicht die Spannweite von der Dachtiefe ab, steht sie in der
           Anfrage – sonst sieht der Betrieb bei 5000 mm Tiefe keinen
           Unterzug und haelt das fuer einen Fehler. */
        if (statikTiefe() !== Z.tiefe) {
          teile.push('Statisch wirksame Spannweite: ' + statikTiefe() +
            ' mm (Dachtiefe ' + Z.tiefe + ' mm abzüglich Dachvorsprung)');
        }
        if (gruppeGilt('unterzug')) {
          var uzA = unterzugAbstand(), uzB = statikTiefe() - uzA;
          teile.push('Unterzug (Statikträger über die ganze Breite): ' +
            uzA + ' mm ab Wand' +
            (Z.unterzugAuto ? ' (mittig)' : ' (verschoben)') +
            ' – Felder ' + uzA + ' / ' + uzB + ' mm');
          /* Jedes Feld ist ein Dach fuer sich: Ueber 4000 mm braucht es
             dort den Innenkern-Traeger. Bei mittiger Lage faellt das oft
             weg, bei verschobener nicht – deshalb gehoert es in die
             Anfrage und nicht in eine Fussnote. */
          var kerne = [innenkernNoetig(uzA) ? 'hinteres' : null,
                       innenkernNoetig(uzB) ? 'vorderes' : null]
                      .filter(function (x) { return x; });
          if (kerne.length) {
            teile.push('Innenkern-Träger nötig im ' + kerne.join(' und ') +
              ' Feld (über 4000 mm)');
          }
        } else if (innenkernNoetig()) {
          teile.push('Innenkern-Träger im Sparren nötig (Tiefe über 4000 mm)');
        }
      } else if (Z.cpVariante === 'Carport mit Überstand') {
        teile.push('Dachüberstand: ' + Z.ueberstand + ' mm');
      }
      var ec = bauteileJetzt();
      if (ec) {
        teile.push(ec.sparren + ' Sparren, ' + ec.pfostenVorne +
                   ' Pfosten in zwei Reihen' +
                   (ec.traeger ? ', mit Statikträger' : ''));
        if (ec.breiteTabelle !== Z.breite) {
          teile.push('Gerechnet mit der nächsten lieferbaren Breite: ' +
                     ec.breiteTabelle + ' mm');
        }
        if (!ec.lieferbar) {
          /* Vorher „ACHTUNG: … so nicht lieferbar". Die Zeile steht auf dem
             Bildschirm und auf dem Kundenblatt; in Werkssprache liest sie
             sich wie ein Fehler des Kunden. Die Aussage bleibt, auch fuer
             uns eindeutig. */
          teile.push('Tiefe über dem Höchstmaß des Systems – so nicht ' +
                     'lieferbar, Klärung beim Aufmaß');
        }
      }
      /* Beim Flachdach-Carport ist die Eindeckung immer Trapezblech;
         Solar und Begrünung kommen darauf. Vorher stand hier „Dach: Solar",
         was wie eine Alternative zum Blech klang. */
      teile.push(istCarportTds()
        ? 'Eindeckung: ' + eindeckungFach()
        : 'Eindeckung: Trapezblech' +
          (Z.cpDach === 'Trapezblech (Standard)' ? '' : ', darauf ' + Z.cpDach));
      teile.push('Farbe: ' + farbeText());
    } else {
      teile.push(Z.aufbau);
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchgangshöhe ' + Z.hoehe + ' mm');
      var ed = bauteileJetzt();
      if (ed) {
        teile.push(ed.sparren + ' Sparren, ' + pfostenText(ed) +
                   (ed.traeger ? ', mit Statikträger' : ''));
        if (ed.breiteTabelle !== Z.breite) {
          teile.push('Gerechnet mit der nächsten lieferbaren Breite: ' +
                     ed.breiteTabelle + ' mm');
        }
        if (!ed.lieferbar) {
          /* Vorher „ACHTUNG: … so nicht lieferbar". Die Zeile steht auf dem
             Bildschirm und auf dem Kundenblatt; in Werkssprache liest sie
             sich wie ein Fehler des Kunden. Die Aussage bleibt, auch fuer
             uns eindeutig. */
          teile.push('Tiefe über dem Höchstmaß des Systems – so nicht ' +
                     'lieferbar, Klärung beim Aufmaß');
        }
      }
      /* Nur das Terrassendach TDS wird nach Grad gefertigt. SkyView hat
         ein festes Gefälle von 2° („bei skyview sind es immer 2 grad",
         Betreiber 12.10.2026) – dort darf keine Neigung in der Anfrage
         stehen, sonst wird nach einer Zahl bestellt, die es nicht gibt.

         Die Höhe an der Wand gehört mit in die Anfrage, nicht nur ins
         Bild: Danach wird das Wandprofil angerissen, und sie ergibt sich
         erst aus Durchgangshöhe, Tiefe und Neigung zusammen. Hat der
         Kunde sie selbst eingegeben (Weg 2), steht genau seine Zahl da –
         nicht die über die gerundeten Grad zurückgerechnete. */
      if (Z.produkt === 'Terrassendach TDS') {
        teile.push('Dachneigung: ' + neigungAnzeige() + '° (' +
          String(neigungProzent(neigungAnzeige())).replace('.', ',') + ' %)');
        teile.push('Höhe an der Wand (UK Wandprofil): ' +
          ((hoehenGetrennt() && Z.hoeheGetrennt)
            ? Z.hoeheHinten : wandUkAus(neigungGrad())) + ' mm');
      }
      teile.push('Eindeckung: ' + eindeckungFach());
      teile.push('Farbe: ' + farbeText());
      /* ALLE drei Seiten nennen, auch die offenen. Vorher standen nur
         die geschlossenen in der Anfrage – ein Kunde hatte nur links
         Schiebetüren gewählt und später gefragt, ob es rundherum sei
         (Betreiber, 11.10.2026). Wenn in der Mail „links: Schiebetür"
         allein steht, ist auch für uns nicht festgehalten, dass rechts
         und vorne offen bleiben SOLLEN und nicht bloß vergessen wurden.
         Die Fachbegriffe bleiben – die Mail ist für uns, nicht für den
         Kunden. */
      var seiten = [];
      [['links', Z.erwLinks], ['rechts', Z.erwRechts],
       ['vorne', Z.erwVorne]].forEach(function (pr) {
        seiten.push(pr[0] + ': ' + (pr[1].length ? pr[1].join(' + ') : 'offen'));
      });
      teile.push('Seitenelemente – ' + seiten.join(' · '));
      /* Das Keilglas gehört in die Bestellung: satinato ist eine andere
         Scheibe, nicht nur eine andere Ansicht. */
      if (erwIrgendwo('Keil')) teile.push('Glas im Keil: ' + Z.keilGlas);
      /* Die Planken haben eine eigene Farbe – sie muss in die Mail, sonst
         wird im Zweifel in der Gestellfarbe bestellt. Profil und Winkel
         gehören fachlich dazu: Danach wird kalkuliert. */
      if (erwIrgendwo('Plankenwand')) {
        teile.push('Plankenwand: Rechteckprofil 25 × 70 (70,4 × 25,3 mm) ' +
                   'an Winkel 40 × 20, Oberfläche ' +
                   (Z.plankenFarbe === 'Wie das Gestell'
                     ? 'wie Gestell (' + Z.farbe + ')' : Z.plankenFarbe) +
                   ', Fuge ' + (Z.plankenAuto
                     ? 'nach Aufteilung (' + String(PLANKEN_IST.fuge).replace('.', ',') +
                       ' mm bei ' + PLANKEN_IST.anzahl + ' Planken im Modell)'
                     : (Z.plankenFuge > 0
                         ? 'Kundenwunsch rund ' + Z.plankenFuge + ' mm'
                         : 'bündig ohne Fuge')) +
                   ', gleichmäßig auf das lichte Maß verteilt' +
                   (PLANKEN_IST.lage === 'voll' ? ', volle Höhe'
                     : ', nur ' + PLANKEN_IST.anzahl + ' von ' + PLANKEN_IST.gesamt +
                       ' Planken (rund ' + PLANKEN_IST.hoehe + ' mm, ' +
                       (PLANKEN_IST.lage === 'unten' ? 'ab Boden' : 'unter dem Dach') +
                       ', ' + PLANKEN_IST.frei + ' mm offen)') +
                   (PLANKEN_IST.felder > 1
                     ? '; über 7 m gestoßen: ' + PLANKEN_IST.felder +
                       ' Felder zu je ' + PLANKEN_IST.feldLaenge + ' mm mit Zwischenprofil'
                     : ''));
      }
      var offenTeile = [];
      [['links', Z.offenLinks], ['rechts', Z.offenRechts],
       ['vorne', Z.offenVorne]].forEach(function (pr) {
        if (erwListe(pr[0]).indexOf('Schiebetür') > -1 && pr[1] > 0) {
          offenTeile.push(pr[0] + ' ' + pr[1] + ' %');
        }
      });
      if (offenTeile.length) {
        teile.push('Schiebetür im Bild geöffnet: ' + offenTeile.join(', '));
      }
      /* Die gewählte Bauart gehört in die Mail, nicht nur ins Bild.
         „man kann es später mim kunden eh nochmal besprechen und ändern"
         (Betreiber) – besprechen kann man aber nur, was dasteht. Ohne
         diese Zeile müsste man die Aufteilung aus dem Bild abzählen. */
      sg23Zeilen().forEach(function (zeile) { teile.push(zeile); });
      /* Drei Angaben, die das VD-Anfrageformular verlangt und die wir
         bisher nirgends festgehalten haben. Die Blickrichtung steht dort
         rot hervorgehoben: „Ansicht der Elemente von Innen gesehen!"
         Ohne diesen Satz kann dieselbe Angabe spiegelverkehrt gelesen
         werden – und das merkt niemand vor der Montage. */
      if (erwIrgendwo('Rahmenwand')) {
        teile.push('Rahmenwand: Festelement FR23 (Rahmenprofil, Glasleiste), ' +
                   RAHMENW_IST.teile + '-teilig' +
                   (RAHMENW_IST.senkrecht ? ', ' + RAHMENW_IST.senkrecht + ' senkrechte' : '') +
                   (RAHMENW_IST.waagerecht ? ', ' + RAHMENW_IST.waagerecht + ' waagerechte' : '') +
                   (RAHMENW_IST.senkrecht + RAHMENW_IST.waagerecht ? ' Sprosse(n)' : ' ohne Sprosse') +
                   ' – Aufteilung nach Aufmaß');
      }
      if (erwIrgendwo('Velaris')) {
        teile.push('Velaris ' + VELARIS_IST.art + ': ' +
                   (VELARIS_IST.elemente || '–') + ' Element(e) à ca. ' +
                   VELARIS_IST.breite + ' mm, ' + VELARIS_IST.schienen +
                   ' Schiene(n), Elementbreite ' +
                   (Z.velarisBreite === 'wunsch'
                     ? 'WUNSCH-BREITE individuell nach Aufmaß (Modell zeigt die gleichmäßige Aufteilung)'
                     : 'gleichmäßige Aufteilung') +
                   ' (Bautiefe oben ' +
                   String(VELARIS.tiefeOben[VELARIS_IST.schienen] * 10 || '')
                     .replace('.', ',') + ' mm)');
        teile.push('Velaris: waagerechte Alu-Lamellen im Rahmen, Stellung im Bild ' +
                   'obere Hälfte ' + (Z.velarisWinkelOben <= 0 ? 'geschlossen'
                     : Z.velarisWinkelOben + '° offen') +
                   ', untere Hälfte ' + (Z.velarisWinkelUnten <= 0 ? 'geschlossen'
                     : Z.velarisWinkelUnten + '° offen') +
                   ', Lamellenfarbe ' + Z.velarisFarbe +
                   (Z.velarisFarbe.indexOf('Sonderfarbe') > -1
                     ? ' – RAL-Nummer noch offen, Aufpreis' : '') +
                   ', Rahmenfarbe ' + Z.farbe +
                   ' – Lamellen- und Rahmenmaße nach Herstellerangabe');
      }
      if (erwIrgendwo('Schiebetür')) {
        teile.push('SG23 Richtungsangaben: von INNEN gesehen (links/rechts ' +
                   'wie im VD-Anfrageformular)');
        teile.push('SG23 Griffhöhe: 1100 mm (Standard), runder eingelassener Griff');
        teile.push('SG23 Schloss: ' + (Z.sg23Schloss === 'ohne'
          ? 'nicht vorgesehen' : Z.sg23Schloss + ' (Stückzahl nach Aufmaß)'));
        teile.push('SG23 Bürstendichtung: Bürstenprofil inkl. Bürsten, ' +
                   'Lieferlänge 2500 mm – Bedarf nach Aufmaß');
      }
      if (gruppeGilt('traeger-wunsch') && Z.traegerWunsch) {
        teile.push('Statikträger 189 × 117 mm unter der Dachrinne auf Kundenwunsch ' +
          '(weniger Pfosten, Durchgangshöhe darunter ' + (Z.hoehe - 189) + ' mm)');
      }
      if (Z.markise !== 'Ohne') teile.push('Beschattung: ' + Z.markise);
      if (Z.stoff && gruppeGilt('stoff-dach')) teile.push('Markisenstoff: ' + stoffText(Z.stoff));
      if (gruppeGilt('stoff-segel')) {
        teile.push('Sonnensegel-Stofffarbe: ' + Z.segelStoff);
        teile.push('Sonnensegel-Ausführung: ' + Z.segelArt);
        teile.push('Befestigung: ' + Z.segelMontage + ' (unser Dach)');
        teile.push('Teleskopstange: ' + (Z.segelStange ? 'ja' : 'nein'));
        if (SONNE_IST.bahnen) {
          teile.push('Bahnen: ' + SONNE_IST.bahnen + ' Stück, je ca. ' +
            SONNE_IST.breite + ' × ' + SONNE_IST.laenge +
            ' mm (je Sparrenfeld eine, Aufmaß vor Ort)');
        }
      }
      if (gruppeGilt('stoff-plissee')) {
        teile.push('Plissee-Stofffarbe: ' + Z.plisseeStoff);
        teile.push('Plissee-Gestellfarbe: ' + Z.plisseeGestell);
        teile.push('Bedienstab 120 cm: ' + Z.plisseeStab);
        if (SONNE_IST.bahnen) {
          teile.push('Bahnen: ' + SONNE_IST.bahnen + ' Stück, je ca. ' +
            SONNE_IST.breite + ' × ' + SONNE_IST.laenge +
            ' mm (je Sparrenfeld eine, Aufmaß vor Ort)');
        }
      }
      if (Z.stoffZip && gruppeGilt('stoff-zip')) teile.push('Stoff Senkrechtmarkise: ' + stoffText(Z.stoffZip));
      if (Z.produkt === 'Terrassendach TDS' && Z.vorsprung) {
        teile.push('Dachvorsprung: ' + Z.vorsprung + ' mm');
      }
    }
    if (istCarport()) {
      var vk = [];
      if (Z.verkRueck) vk.push('hinten');
      if (Z.verkLinks) vk.push('links');
      if (Z.verkRechts) vk.push('rechts');
      if (vk.length) {
        teile.push('Sichtschutzpaneele ' + Z.verkRichtung + ': ' + vk.join(', '));
      }
    }
    if (Z.led) {
      teile.push('LED-Spots: ' + (Z.ledsetzahl > 1 ? Z.ledsetzahl + ' × ' : '') + Z.ledset);
    }
    if (!istCarport() && Z.sound) teile.push('Lautsprecher: ' + Z.soundset);
    if (istPergola() && Z.heizung) teile.push('mit Heizstrahler');
    if (istPergola() && Z.wettersensor) teile.push('mit Wetter-Automatik');
    if (gruppeGilt('fassade')) teile.push('Hauswand: ' + Z.fassade);
    teile.push('Untergrund: ' + Z.untergrund);
    teile.push(Z.montage === 'Ja, mit Fachmontage' ? 'Montage durch BV AussenSysteme' : 'Selbstmontage');
    return teile;
  }

  function textAktualisieren() {
    var box = document.getElementById('k3dZusammenfassung');
    if (!box) return;
    box.innerHTML = zusammenfassungKunde().map(function (t) {
      return '<li>' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</li>';
    }).join('');
  }

  function aendern() {
    var neuProdukt = wert('k3dProdukt') || Z.produkt;
    var produktWechsel = neuProdukt !== Z.produkt;
    Z.produkt = neuProdukt;

    var neuTyp = wert('k3dCpTyp') || Z.cpTyp;
    var typWechsel = neuTyp !== Z.cpTyp;
    Z.cpTyp = neuTyp;
    if (typWechsel || produktWechsel) cpVariantenSetzen();
    Z.cpVariante = wert('k3dCpVariante') || Z.cpVariante;
    Z.cpDach = wert('k3dCpDach') || Z.cpDach;
    Z.pgDachart = wert('k3dPgDachart') || Z.pgDachart;
    Z.pgAusfuehrung = wert('k3dPgAusfuehrung') || Z.pgAusfuehrung;
    Z.pgSeitenschutz = wert('k3dPgSeitenschutz') || Z.pgSeitenschutz;
    Z.ralCode = (wert('k3dRalCode') || '').trim();
    Z.plankenFarbe = wert('k3dPlankenFarbe') || Z.plankenFarbe;
    Z.segelStoff = wert('k3dSegelStoff') || Z.segelStoff;
    Z.segelArt = wert('k3dSegelArt') || Z.segelArt;
    var stangeEl = document.getElementById('k3dSegelStange');
    Z.segelStange = stangeEl ? stangeEl.checked : Z.segelStange;
    Z.plisseeStoff = wert('k3dPlisseeStoff') || Z.plisseeStoff;
    Z.plisseeGestell = wert('k3dPlisseeGestell') || Z.plisseeGestell;
    Z.plisseeStab = wert('k3dPlisseeStab') || Z.plisseeStab;
    Z.lamellen = parseInt(wert('k3dLamellen'), 10);
    if (isNaN(Z.lamellen)) Z.lamellen = 35;

    if (produktWechsel) {
      masseSetzen();
      /* KORREKTUR 11.10.2026: „warum lässt sich das im konfigurator vor
         allem bei carport tds nicht einstellen" (Betreiber).

         masseSetzen() stellt die Regler auf den Maßblock des Produkts
         (7000 × 4500 mm) – aufgezogen auf das echte Raster der Tabelle
         (14080 × 7050) wurden sie erst unten, und zwar nur, wenn sich
         der SYSTEMschlüssel ändert. Carport TDS und Terrassendach TDS
         haben aber denselben Schlüssel (TDS|Glas). Beim Wechsel vom
         Terrassendach zum Carport blieb es deshalb bei 7000 × 4500 –
         genau die Beobachtung des Betreibers.

         Beim Produktwechsel werden die Grenzen jetzt immer nachgezogen. */
      reglerGrenzenSetzen();
    }
    // keilErlaubt() hängt am Produkt UND am Carport-Typ
    if (produktWechsel || typWechsel) erwAufraeumen();

    Z.aufbau = wert('k3dAufbau') || Z.aufbau;
    /* Die Reglergrenzen hängen am System, nicht nur am Produkt: Ein Wechsel
       des Carport-Typs oder der Eindeckung bringt ein anderes Maßraster mit.
       Deshalb wird der Systemschlüssel verglichen, nicht nur das Produkt. */
    var dJetzt = datenSystem();
    /* Auch ohne Serverantwort hat die Maßtabelle ein Raster – deshalb
       zaehlt hier Produkt plus Eindeckung, nicht nur das Serversystem.
       Vorher wurde ohne Serverantwort gar nicht nachgestellt, und die
       festen Grenzen aus MASSE blieben stehen. */
    var systemSchl = dJetzt ? dJetzt.system + '|' + dJetzt.material
      : Z.produkt + '|' + Z.cpTyp + '|' + (istPolycarbonat() ? 'Poly' : 'Glas');
    if (systemSchl !== letztesSystem) {
      reglerGrenzenSetzen();
      letztesSystem = systemSchl;
    }
    Z.breite = parseInt(wert('k3dBreite'), 10) || Z.breite;
    Z.tiefe = parseInt(wert('k3dTiefe'), 10) || Z.tiefe;
    Z.hoehe = parseInt(wert('k3dHoehe'), 10) || Z.hoehe;
    Z.neigung = parseInt(wert('k3dNeigung'), 10) || Z.neigung;
    Z.hoeheHinten = zahl('k3dHoeheHinten', Z.hoeheHinten);
    Z.koppelLage = zahl('k3dKoppel', Z.koppelLage);
    Z.ueberstand = parseInt(wert('k3dUeberstand'), 10) || Z.ueberstand;
    Z.eindeckung = wert('k3dEindeckung') || Z.eindeckung;
    Z.glasstaerke = parseInt(wert('k3dGlasstaerke'), 10) || Z.glasstaerke;
    SG23_SEITEN.forEach(function (p) {
      var sel = document.getElementById(p[2]);
      if (sel && sel.options.length) Z[p[1]] = sel.value;
    });
    var ledEl = document.getElementById('k3dLed');
    Z.led = ledEl ? ledEl.checked : Z.led;
    Z.montage = wert('k3dMontage') || Z.montage;

    var offenNeu = zahl('k3dGlasOffen', Z.glasOffen);
    if (offenNeu !== Z.glasOffen) {
      /* Am Regler gezogen: Er gilt fuer die ganze Anlage, also alle drei
         Seiten gleich. Nur so bleibt er das, was er vorher war. */
      Z.glasOffen = offenNeu;
      Z.offenLinks = Z.offenRechts = Z.offenVorne = offenNeu;
    }
    Z.markise = wert('k3dMarkise') || Z.markise;
    var sf = document.getElementById('k3dStoff');
    if (sf) Z.stoff = sf.value || '';
    var sz = document.getElementById('k3dStoffZip');
    if (sz) Z.stoffZip = sz.value || '';
    Z.sonneAus = zahl('k3dSonneAus', Z.sonneAus);
    Z.plankenFuge = zahl('k3dPlankenFuge', Z.plankenFuge);
    Z.plankenAnteil = zahl('k3dPlankenAnteil', Z.plankenAnteil);
    Z.rahmenTeilung = wert('k3dRahmenTeilung') || '';
    Z.sg23Glas = wert('k3dSg23Glas') || Z.sg23Glas;
    Z.keilGlas = wert('k3dKeilGlas') || Z.keilGlas;
    Z.sg23Schloss = wert('k3dSg23Schloss') || Z.sg23Schloss;
    Z.velarisWinkelOben = zahl('k3dVelarisWinkelOben', Z.velarisWinkelOben);
    Z.velarisWinkelUnten = zahl('k3dVelarisWinkelUnten', Z.velarisWinkelUnten);
    Z.velarisFarbe = wert('k3dVelarisFarbe') || Z.velarisFarbe;
    Z.velarisArt = wert('k3dVelarisArt') || Z.velarisArt;
    Z.velarisBreite = wert('k3dVelarisBreite') || Z.velarisBreite;
    Z.velarisAnzahl = wert('k3dVelarisAnzahl') || '';
    Z.velarisOffen = zahl('k3dVelarisOffen', Z.velarisOffen);
    Z.verkRichtung = wert('k3dVerkRichtung') || Z.verkRichtung;
    Z.boden = wert('k3dBoden') || Z.boden;
    Z.fassade = wert('k3dFassade') || Z.fassade;
    Z.untergrund = wert('k3dUntergrund') || Z.untergrund;
    vorsprungGrenzeSetzen();
    hoeheHintenKoppeln();
    koppelGrenzeSetzen();
    Z.vorsprung = zahl('k3dVorsprung', Z.vorsprung);
    Z.vorsprungHinten = zahl('k3dVorsprungHinten', Z.vorsprungHinten);
    /* Erst LESEN, dann Grenzen setzen – in dieser Reihenfolge, nicht
       umgekehrt: unterzugGrenzeSetzen() schreibt den Regler nach, und was
       es schreibt, haengt an der Spannweite. Die wiederum steht erst nach
       den Vorspruengen fest. Lief das Setzen vorher, war der gerade
       geschobene Wert schon weg, bevor ihn jemand gelesen hat. */
    Z.unterzugLage = unterzugEinlesen();
    unterzugGrenzeSetzen();
    Z.ledset = wert('k3dLedSet') || Z.ledset;
    Z.ledsetzahl = Math.min(20, Math.max(1, zahl('k3dLedAnzahl', Z.ledsetzahl)));
    Z.soundset = wert('k3dSoundSet') || Z.soundset;
    [['verkRueck', 'k3dVerkRueck'], ['verkLinks', 'k3dVerkLinks'],
     ['verkRechts', 'k3dVerkRechts'], ['masseZeigen', 'k3dMasse'],
     ['sound', 'k3dSound'], ['heizung', 'k3dHeizung'],
     ['wettersensor', 'k3dWetter'],
     ['traegerWunsch', 'k3dTraeger'],
     ['hoeheGetrennt', 'k3dHoeheGetrennt'],
     ['plankenAuto', 'k3dPlankenAuto'],
     ['plankenHoeheAuto', 'k3dPlankenHoeheAuto']].forEach(function (pr) {
      var el = document.getElementById(pr[1]);
      if (el) Z[pr[0]] = el.checked;
    });

    /* k3dVorsprung gehört hier mit hinein. Es fehlte – deshalb blieb die
       Anzeige auf „0 mm" stehen, während sich im Modell sehr wohl etwas
       bewegte. Vom Betreiber bemerkt: „die anzeige bleibt immer bei 0 mm
       stehen aber in 3d passiert die änderung". */
    [['k3dBreite', 'breite'], ['k3dTiefe', 'tiefe'], ['k3dHoehe', 'hoehe'],
     ['k3dUeberstand', 'ueberstand'], ['k3dVorsprung', 'vorsprung'],
     ['k3dVorsprungHinten', 'vorsprungHinten'],
     ['k3dHoeheHinten', 'hoeheHinten'],
     ['k3dKoppel', 'koppelLage'],
     ['k3dUnterzug', 'unterzugLage']].forEach(function (paar) {
      var a = document.getElementById(paar[0] + 'Wert');
      /* Beim Unterzug steht dabei, ob die Lage noch die automatische
         Mitte ist – sonst sieht man nicht, dass sie mitwandert. */
      if (a) {
        a.textContent = Z[paar[1]] + ' mm' +
          (paar[1] === 'unterzugLage' && Z.unterzugAuto ? ' (mittig)' : '');
      }
      /* Das Zahlenfeld wird nachgeführt – aber nicht, während jemand darin
         tippt. Sonst springt die Zahl unter dem Finger weg. */
      var zf = document.getElementById(paar[0] + 'Zahl');
      if (zf && document.activeElement !== zf) zf.value = Z[paar[1]];
    });
    /* Grad links, Prozent rechts, Höhe an der Wand darunter.

       BELEGT (Montageanleitung TDS, S. 9): „Die Überdachung hat einen
       festen Gefällewinkel von 14 %. Das bedeutet, dass sie von der Rinne
       aus gesehen um 14 cm pro Meter ansteigt. Wenn der Ausfall 3 m
       beträgt, dann liegt die Unterkante des Wandanschlussprofils
       3 × 14 cm höher als die Unterkante der Rinne." Rechenbeispiel der
       Anleitung: 200 cm innen + 42 cm = 242 cm.

       Gerechnet wird mit der GRAD-ZU-PROZENT-TABELLE der Anleitung, nicht
       mit dem Tangens. Der Unterschied ist klein, aber er ist da: tan 8°
       sind 14,05 %, die Tabelle sagt 14 %. Auf 3 m Tiefe macht das 422
       statt 420 mm – und 420 steht im Rechenbeispiel. Wer die Zahl im
       Konfigurator mit der Anleitung vergleicht, soll dieselbe sehen.

       Warum die Zahl überhaupt hier steht: Danach wird an der Wand
       angerissen. Wer sie selbst ausrechnen muss, rechnet sie irgendwann
       falsch – und ein um 4 cm falsch gesetztes Wandprofil merkt man
       erst, wenn das Dach liegt. */
    /* Was aus Breite und Tiefe folgt – in Worten, nicht nur im Bild.

       Drei Dinge, die der Kunde sonst erst im Angebot erfährt:
         · nach welcher lieferbaren Breite gerechnet wird (sein Maß liegt
           fast immer dazwischen),
         · dass ab 4,5 m Tiefe ein Statikträger über die volle Breite
           dazukommt,
         · dass über 7 m Tiefe nichts mehr geht.
       Alles drei steht in der Maßtabelle; es hier zu verschweigen hieße,
       es im Angebot erklären zu müssen. */
    var mh = document.getElementById('k3dMassHinweis');
    if (mh) {
      var tb = tabelleBauteile(Z.breite, Z.tiefe);
      var M = window.BV_MASSTABELLE;
      var saetze = [], warnung = false;
      if (tb) {
        /* Unter einem Statikträger gilt die 7-m-Regel, nicht die
           Stützfußspalte der Tabelle – siehe pfostenUnterTraeger(). Der
           Hinweis muss dieselbe Zahl nennen wie das Modell. */
        /* Dieselbe Trennung wie im Modell: vorne nach dem Träger dort,
           hinten nur freistehend und dann immer nach der 7-m-Regel.
           Gerechnet in bauteileJetzt(), damit die Anfrage dieselben
           Zahlen nennt wie dieser Hinweis. */
        var bt = bauteileJetzt();
        var vsHin = bt.vorsprung;
        var wunsch = bt.wunsch;
        var pfV = bt.pfostenVorne;
        var pf = pfostenText(bt);
        if (tb.breiteTabelle !== Z.breite) {
          saetze.push('Gerechnet wird mit der nächsten lieferbaren Breite: <b>' +
            tb.breiteTabelle + ' mm</b> – daraus folgen ' + tb.sparren +
            ' Sparren und ' + pf + '.');
        } else {
          saetze.push('<b>' + tb.sparren + ' Sparren</b> und <b>' + pf +
            '</b> bei diesem Maß.');
        }
        var vs = vsHin;
        if (bt.traeger) {
          var grund = unterzugGilt(tb)
            ? 'Ab ' + (M.regeln.tiefeMaxOhneUnterzug / 1000).toFixed(1).replace('.', ',') +
              ' m Tiefe kommt ein <b>Statikträger</b> (189 × 117 mm) über die volle Breite dazu.'
            : (vs > 0
              ? 'Mit Dachvorsprung kommt ein <b>Statikträger</b> (189 × 117 mm) über die volle Breite dazu.'
              : 'Sie haben den <b>Statikträger</b> (189 × 117 mm) gewählt – er läuft über ' +
                'die volle Breite und spart ' + (tb.pfosten - pfV) + ' Pfosten.');
          var lage = vs > 0
            ? ' Die Pfosten stehen ' + vs + ' mm weiter innen; der Träger liegt ' +
              'über ihnen unter den Sparren, weil die Rinne dort auskragt.'
            : ' Er sitzt zwischen Pfostenkopf und Rinne.';
          /* Der Träger nimmt dem Pfosten seine Höhe weg – darunter ist
             weniger Durchgang als eingestellt. Das muss dastehen, sonst
             plant jemand mit 2,30 m und hat 2,11 m.

             Ohne Vorsprung ist es genau die Trägerhöhe. Mit Vorsprung
             sitzt der Träger weiter innen und damit etwas höher, weil
             das Dach ansteigt – dann ist „rund" ehrlicher als eine Zahl,
             die hier nur grob nachgerechnet wäre. */
          saetze.push(grund + lage + (vs > 0
            ? ' <b>Unter dem Träger ist der Durchgang rund 189 mm niedriger</b> ' +
              'als die eingestellten ' + Z.hoehe + ' mm.'
            : ' <b>Unter dem Träger bleiben ' + (Z.hoehe - 189) + ' mm</b> ' +
              'statt der eingestellten ' + Z.hoehe + ' mm.'));
          warnung = true;
        }
        if (glasGeteilt()) {
          saetze.push('VSG-Glas gibt es bis <b>4,50 m</b> am Stück. Bei dieser ' +
            'Tiefe werden die Scheiben <b>quer gestoßen und gekoppelt</b> – im ' +
            'Bild als Querprofil zu sehen.');
        }
        if (!tb.lieferbar) {
          saetze.push('Diese Tiefe liegt über dem Höchstmaß von ' +
            (M.regeln.tiefeMaxLieferbar / 1000).toFixed(2).replace('.', ',') +
            ' m – <b>so nicht lieferbar</b>. Sprechen Sie uns an, wir finden eine Lösung.');
          warnung = true;
        }
      }
      mh.innerHTML = saetze.join(' ');
      mh.classList.toggle('ist-warnung', warnung);
    }

    var nz = document.getElementById('k3dNeigungZahl');
    if (nz && document.activeElement !== nz) nz.value = Z.neigung;
    var prozent = neigungProzent(neigungAnzeige());
    /* Beim Carport die Neigung ANZEIGEN, nicht abfragen – sie ist dort
       das Ergebnis der beiden Höhen. Gerundet auf ganze Grad, und der
       Prozentwert aus der Tabelle zu genau dieser Gradzahl – sonst
       stünden dort zwei Zahlen, die nicht zueinander passen. */
    var nh = document.getElementById('k3dNeigungHinten');
    if (nh) {
      nh.textContent = neigungAnzeige() + '° (' +
        String(prozent).replace('.', ',') + ' %)';
    }
    var np = document.getElementById('k3dNeigungProzent');
    if (np) np.textContent = String(prozent).replace('.', ',');
    var wh = document.getElementById('k3dWandHoehe');
    if (wh) wh.textContent = wandUkAus(neigungGrad());
    var whi = document.getElementById('k3dWandHoeheInfo');
    if (whi) {
      /* Nicht „Durchgang + Anstieg": Gerechnet wird vom selben Punkt aus
         wie beim Hersteller, über die Dachtiefe ohne Rinne und
         Wandprofil. */
      whi.textContent = 'Von Unterkante Rinne (' + Z.hoehe + ' mm) über '
        + (wandUkSpanne() / 1000).toFixed(2).replace('.', ',')
        + ' m Dachtiefe – so rechnet auch das Bestellformular.';
    }
    var lw = document.getElementById('k3dLamellenWert');
    if (lw) lw.textContent = Z.lamellen + '° geöffnet';
    var gw = document.getElementById('k3dGlasOffenWert');
    if (gw) gw.textContent = Z.glasOffen + ' %';
    var sw = document.getElementById('k3dSonneAusWert');
    if (sw) sw.textContent = Z.sonneAus + ' %';
    var fw = document.getElementById('k3dPlankenFugeWert');
    if (fw) {
      fw.textContent = Z.plankenAuto ? 'automatisch'
                     : (Z.plankenFuge > 0 ? Z.plankenFuge + ' mm' : 'bündig');
    }
    var aw = document.getElementById('k3dPlankenAnteilWert');
    if (aw) {
      aw.textContent = (Z.plankenHoeheAuto || !Z.plankenAnteil) ? 'volle Höhe'
                     : (Z.plankenAnteil < 0 ? 'von unten' : 'von oben');
    }
    [['k3dVelarisWinkelObenWert', Z.velarisWinkelOben],
     ['k3dVelarisWinkelUntenWert', Z.velarisWinkelUnten]].forEach(function (pr) {
      var el = document.getElementById(pr[0]);
      if (el) el.textContent = pr[1] <= 0 ? 'geschlossen' : pr[1] + '° offen';
    });
    var vo = document.getElementById('k3dVelarisOffenWert');
    if (vo) vo.textContent = Z.velarisOffen + ' %';
    var vor = document.getElementById('k3dVelarisOffen');
    if (vor) vor.disabled = Z.velarisArt !== 'verschiebbar';
    var ar = document.getElementById('k3dPlankenAnteil');
    if (ar) ar.disabled = Z.plankenHoeheAuto;
    var fr = document.getElementById('k3dPlankenFuge');
    if (fr) fr.disabled = Z.plankenAuto;
    var fz = document.getElementById('k3dPlankenFugeZahl');
    if (fz) { fz.disabled = Z.plankenAuto; if (Z.plankenAuto) fz.value = Z.plankenFuge; }

    panelAnpassen();
    markiseAnzeigen();
    stoffAnzeigen();
    seitenStandZeigen();
    schrittZeigen();
    erwAnzeigen();
    titelAnpassen();
    summenSetzen();
    /* Sofort zeichnen – mit den Stückzahlen, die gerade vorliegen. Beim
       Ziehen am Regler ändert sich das Maß stetig, die Sparrenzahl aber nur
       an den Rasterkanten. Die genaue Antwort kommt gebremst nach, sonst
       feuert jeder Pixel eine Abfrage. */
    bauen();
    /* ERST nach dem Bauen: Die Auswahlfelder zeigen die Bauarten zum
       tatsaechlich gebauten Mass, und das meldet erst bauen(). */
    sg23FeldFuellen();
    plankenStandZeigen();
    ralStandZeigen();
    ledStandZeigen();
    sonneStandZeigen();
    velarisStandZeigen();
    rahmenStandZeigen();
    textAktualisieren();
    folgtAktualisieren();
    gebremstHolen();
  }

  var letztesSystem = null;
  var bremse = null;
  function gebremstHolen() {
    if (bremse) clearTimeout(bremse);
    bremse = setTimeout(function () {
      bremse = null;
      stuecklisteHolen(function () {
        panelAnpassen();      // Farbpalette hängt an der Stückliste
        bauen();
        textAktualisieren();
        folgtAktualisieren();
        var ladeHinweis = document.getElementById('k3dLaden');
        if (ladeHinweis) ladeHinweis.remove();
      });
    }, 220);
  }

  /* „Was daraus folgt" – die Zahlen aus der Preisliste, sichtbar gemacht.
     Nicht Zierde: Der Kunde soll sehen, dass die Sparrenzahl keine Schätzung
     ist, und der Betrieb erkennt beim Gegenlesen sofort einen Fehler. */
  function folgtAktualisieren() {
    var box = document.getElementById('k3dFolgt');
    var hinBox = document.getElementById('k3dHinweise');
    if (!box) return;
    /* Ohne Herstellerzahlen bleibt der ganze Kasten weg – nicht etwa mit
       einem Hinweis gefüllt. „lass das weg" (Betreiber, 11.10.2026): Ein
       Kasten, der nur erklärt, dass er nichts zu sagen hat, verunsichert
       beim Produkt, statt zu informieren. Das Modell ist auch ohne ihn
       richtig gezeichnet. */
    var kasten = box.closest ? box.closest('.k3d-zus--folgt') : null;
    var e = stueckliste();
    if (!e || e.fehler) {
      box.innerHTML = '';
      if (hinBox) hinBox.innerHTML = '';
      if (kasten) kasten.hidden = true;
      return;
    }
    if (kasten) kasten.hidden = false;
    var z = [];
    z.push(['Ihr Maß', e.angefragt.breite + ' × ' + e.angefragt.tiefe + ' mm']);
    if (!e.imRaster) {
      /* Vorher „Abrechnung nach": Das klang wie „Sie zahlen fuer mehr, als
         Sie bekommen". Gebaut wird nach Kundenmass; das Rasterfeld bestimmt
         Sparren- und Pfostenzahl. Genau das steht jetzt da. */
      z.push(['Nächstes Standardmaß', e.raster.breite + ' × ' + e.raster.tiefe +
              ' mm (daraus Sparren- und Pfostenzahl)']);
    }
    z.push(['Sparren', e.sparren + (e.feldbreite ? ' · Achsabstand ' +
            e.feldbreite.achsabstand + ' mm' : '')]);
    z.push(['Pfosten', e.pfosten + (e.pfostenReihen > 1
            ? ' (zwei Reihen zu je ' + e.pfostenJeReihe + ')' : '')]);
    if (e.statiktraeger) z.push(['Statikträger', '189 × 117 mm über die volle Breite']);
    if (e.eindeckungGeteilt) z.push(['Teilung', 'Eindeckung quer geteilt, mit Querfuge']);
    /* Der Innenkern stand hier als eigene Zeile. Er hat mit der
       Verglasung und mit dem 3D-Modell nichts zu tun – „innenkern is
       keine glaskopplung das is für das 3d modell egal … das kann raus"
       (Betreiber, 11.10.2026). Die Felder innenkernSparren und
       innenkernImPreis kommen weiterhin aus der Matrix; sie werden hier
       nur nicht mehr angezeigt. */
    z.push(['Eindeckung', e.eindeckung]);
    box.innerHTML = z.map(function (r) {
      return '<li><span>' + esc(r[0]) + '</span> ' + esc(r[1]) + '</li>';
    }).join('');

    if (hinBox) {
      /* Nur was den Kunden angeht. Die internen Hinweise (Preisliste,
         offene Annahmen, Beleglage) tragen in js/bauteile.js fuer:
         'intern' und gehen allein in die Anfrage-Mail – „nicht jeder
         hinweis hat den kunden was anzugehen" (Betreiber, 15.10.2026).
         Der Rasterhinweis ist einer davon; er stand hier ohnehin nie,
         weil die Zeile darueber dasselbe sagt. */
      hinBox.innerHTML = e.hinweise.filter(function (h) { return h.fuer !== 'intern'; }).map(function (h) {
        return '<li class="k3d-hin k3d-hin--' + esc(h.art) + '">' + esc(h.text) + '</li>';
      }).join('');
    }
  }

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- Kurzfassung in den Abschnittsköpfen ----------
     Zugeklappt muss jeder Abschnitt verraten, was darin gewählt ist – sonst
     muss man alles aufklappen, um die eigene Konfiguration zu lesen. */
  function text(id, t) {
    var e = document.getElementById(id);
    if (e) e.textContent = t;
  }

  function farbeName() {
    return (istPergola() && Z.farbe === 'Reinweiß') ? 'Creme-Weiß' : Z.farbe;
  }

  /* Fachbezeichnung für die Anfrage-Mail – dort muss die Glasstärke
     mitstehen, im Bedienfeld interessiert sie den Kunden kaum.
     („mach es schlau aber einfach, wir müssen die anfrage die per mail
     kommt natürlich in fachbegriffen etc haben") */
  function eindeckungFach() {
    if (istPolycarbonat()) return Z.eindeckung + ', Sechsfachstegplatte 16 mm';
    /* Der Querstoß gehört in die Anfrage, nicht nur ins Bild – er ist
       eine Kopplung mit eigenem Profil. NICHT „Innenkern" nennen: Das
       ist bei TDS etwas anderes (Betreiber, 11.10.2026). */
    return Z.eindeckung.replace('VSG ', 'VSG ' + Z.glasstaerke + ' mm ') +
           (glasGeteilt() ? ', quer gestoßen und gekoppelt bei ' +
                            koppelAbstand() + ' mm ab Rinne' : '');
  }

  function eindeckungKurz() {
    if (Z.eindeckung === 'VSG klar') return 'Glas klar';
    if (Z.eindeckung === 'VSG opal') return 'Glas opal';
    if (Z.eindeckung === 'VSG graphit') return 'Glas graphit';
    return 'Polycarbonat';
  }

  function summenSetzen() {
    text('k3dSumProdukt', Z.breite + ' × ' + Z.tiefe + ' mm · Höhe ' + Z.hoehe + ' mm');

    var d = [];
    if (istPergola()) d.push(Z.pgDachart + (istLamellen() ? ' ' + Z.lamellen + '°' : ''));
    else if (istCarport() && !istCarportTds()) d.push(Z.cpDach);
    else d.push(eindeckungKurz());
    d.push(farbeName());
    if (Z.led) d.push('LED');
    text('k3dSumDach', d.join(' · '));

    if (istPergola()) {
      text('k3dSumSeiten', Z.pgSeitenschutz === 'Nichts / später entscheiden'
        ? 'offen' : Z.pgSeitenschutz);
    } else {
      var se = [];
      if (Z.erwLinks.length) se.push('links');
      if (Z.erwRechts.length) se.push('rechts');
      if (Z.erwVorne.length) se.push('vorne');
      if (erwIrgendwo('Plankenwand') && Z.plankenFarbe !== 'Wie das Gestell') {
        se.push(Z.plankenFarbe);
      }
      text('k3dSumSeiten', se.length ? se.join(', ') : 'offen');
    }

    var so = [];
    if (Z.markise !== 'Ohne') so.push(Z.markise.replace('markise', ''));
    if (erwIrgendwo('Senkrechtmarkise')) so.push('Senkrechtmarkise');
    text('k3dSumSonne', so.length ? so.join(' · ') : 'keiner');

    var lt = [];
    if (Z.led) lt.push('LED ' + Z.ledset);
    if (!istCarport() && Z.sound) lt.push('Lautsprecher');
    if (istPergola() && Z.heizung) lt.push('Heizung');
    if (istPergola() && Z.wettersensor) lt.push('Wetter-Automatik');
    text('k3dSumLicht', lt.length ? lt.join(' · ') : 'ohne');
    text('k3dSumUnterbau',
         (gruppeGilt('fassade') ? Z.fassade + ' · ' : '') +
         (Z.montage === 'Ja, mit Fachmontage' ? 'Fachmontage' : 'Selbstmontage'));

    /* Seiten und Verkleidung teilen sich seit 11.10.2026 einen Abschnitt.
       Im zugeklappten Kopf darf trotzdem nur das stehen, was zum Produkt
       gehoert – sonst stuende beim Carport „offen" neben der Verkleidung. */
    if (gruppeGilt('verkleidung')) {
      var vk = [];
      if (Z.verkRueck) vk.push('hinten');
      if (Z.verkLinks) vk.push('links');
      if (Z.verkRechts) vk.push('rechts');
      text('k3dSumSeiten', '');
      text('k3dSumVerk', vk.length ? Z.verkRichtung + ': ' + vk.join(', ') : 'keine');
    } else {
      text('k3dSumVerk', '');
    }

    text('k3dSumAnzeige', Z.boden + (Z.masseZeigen ? ' · mit Maßen' : ''));

    /* Angabe im Bild: Maß und Fläche. Die Fläche ist das, wonach gefragt
       wird („wie viel Quadratmeter?"), und sie ist eine reine Rechnung aus
       Breite und Tiefe – keine zweite Quelle, die auseinanderlaufen kann. */
    text('k3dTitelBuehne', produktName());
    var qm = (Z.breite * Z.tiefe) / 1000000;
    /* Nur Maß und Quadratmeter: „die wörter überdachte fläche weg, nur
       maße und qm stehen lassen" (Betreiber, 11.10.2026). Die Zeile stand
       zweizeilig im Bild und hat oben links Platz gekostet, den das Modell
       besser gebrauchen kann. */
    text('k3dSpec', Z.breite + ' × ' + Z.tiefe + ' mm · ' +
         qm.toFixed(2).replace('.', ',') + ' m²');
  }

  /* Überschrift und Hinweistext folgen dem Produkt – sonst stünde über
     einem Carport weiterhin „Terrassendach TDS“. */
  function titelAnpassen() {
    /* Die Überschrift steht seit dem 11.10.2026 im Bild statt über dem
       Bedienfeld; k3dTitelBuehne wird in textAktualisieren() gesetzt.
       Der alte Platz existiert nicht mehr. */
    var c = document.getElementById('k3dCanvas');
    if (c) c.setAttribute('aria-label', '3D-Ansicht des konfigurierten Produkts: ' + produktName());
    // Flat Line und Flat Box haben keine sichtbaren Sparren – dort sitzen die
    // Spots im umlaufenden Dachrand.
    var l = document.getElementById('k3dLedText');
    if (l) l.textContent = (istCarport() && !istCarportTds())
      ? 'LED-Beleuchtung im Dachrand'
      : 'LED-Beleuchtung in den Sparren';
  }

  ['k3dProdukt', 'k3dCpTyp', 'k3dCpVariante', 'k3dCpDach', 'k3dAufbau',
   'k3dPgDachart', 'k3dPgAusfuehrung', 'k3dPgSeitenschutz', 'k3dLamellen',
   'k3dBreite', 'k3dTiefe', 'k3dHoehe',
   'k3dNeigung', 'k3dUeberstand', 'k3dEindeckung',
   'k3dLinks', 'k3dRechts', 'k3dFront', 'k3dLed', 'k3dMontage',
   'k3dGlasOffen', 'k3dMarkise', 'k3dSonneAus',
   'k3dVerkRueck', 'k3dVerkLinks', 'k3dVerkRechts', 'k3dVerkRichtung',
   'k3dBoden', 'k3dMasse', 'k3dFassade', 'k3dUntergrund', 'k3dVorsprung',
   'k3dLedSet', 'k3dLedAnzahl', 'k3dSound', 'k3dSoundSet',
   'k3dHeizung', 'k3dWetter', 'k3dGlasstaerke', 'k3dTraeger', 'k3dVorsprungHinten',
   'k3dHoeheHinten', 'k3dHoeheGetrennt', 'k3dKoppel',
   'k3dSg23Links', 'k3dSg23Rechts', 'k3dSg23Vorne',
   'k3dSg23Glas', 'k3dKeilGlas', 'k3dSg23Schloss', 'k3dRahmenTeilung', 'k3dVelarisWinkelOben', 'k3dVelarisWinkelUnten', 'k3dVelarisFarbe',
   'k3dVelarisArt', 'k3dVelarisBreite',
   'k3dVelarisAnzahl', 'k3dVelarisOffen',
   'k3dRalCode', 'k3dPlankenFarbe', 'k3dPlankenFuge', 'k3dPlankenAuto',
   'k3dSegelStoff', 'k3dSegelArt', 'k3dSegelStange',
   'k3dPlisseeStoff', 'k3dPlisseeGestell', 'k3dPlisseeStab',
   'k3dPlankenAnteil', 'k3dPlankenHoeheAuto'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.addEventListener('input', aendernGebremst);
    e.addEventListener('change', aendern);
  });

  // Knopfreihen
  Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-seg]'), function (reihe) {
    var id = reihe.getAttribute('data-k3d-seg');
    reihe.addEventListener('click', function (ev) {
      var b = ev.target;
      while (b && b !== reihe && b.tagName !== 'BUTTON') b = b.parentNode;
      if (!b || b === reihe || !b.getAttribute('data-wert')) return;
      segSetzen(id, b.getAttribute('data-wert'));
      aendern();
    });
    var feld = document.getElementById(id);
    segSetzen(id, feld ? feld.value : null);
  });

  /* Zahlenfeld neben dem Regler. Begrenzt wird erst beim Verlassen des
     Feldes: Wer „4000" tippt, hat nach der ersten Ziffer eine 4 im Feld –
     würde sofort begrenzt, stünde dort gleich die Untergrenze. */
  [['k3dBreite', 'k3dBreiteZahl'], ['k3dTiefe', 'k3dTiefeZahl'],
   ['k3dHoehe', 'k3dHoeheZahl'], ['k3dUeberstand', 'k3dUeberstandZahl'],
   ['k3dNeigung', 'k3dNeigungZahl'],
   ['k3dVorsprung', 'k3dVorsprungZahl'],
   ['k3dVorsprungHinten', 'k3dVorsprungHintenZahl'],
   ['k3dHoeheHinten', 'k3dHoeheHintenZahl'],
   ['k3dKoppel', 'k3dKoppelZahl'],
   ['k3dUnterzug', 'k3dUnterzugZahl'],
   ['k3dPlankenFuge', 'k3dPlankenFugeZahl']].forEach(function (pr) {
    var r = document.getElementById(pr[0]), n = document.getElementById(pr[1]);
    if (!r || !n) return;
    n.addEventListener('input', function () {
      var v = parseInt(n.value, 10);
      var min = parseInt(r.min, 10), max = parseInt(r.max, 10);
      n.classList.toggle('ist-ausserhalb', !isNaN(v) && (v < min || v > max));
      if (isNaN(v) || v < min || v > max) return;
      r.value = v;
      aendern();
    });
    n.addEventListener('change', function () {
      var v = parseInt(n.value, 10);
      if (isNaN(v)) v = parseInt(r.value, 10);
      v = Math.min(Math.max(v, parseInt(r.min, 10)), parseInt(r.max, 10));
      n.value = v; r.value = v;
      n.classList.remove('ist-ausserhalb');
      aendern();
    });
  });

  /* Knöpfe, die einen Regler auf einen Endwert stellen. 85 statt 100 beim
     Ausfahren, weil eine Markise im Bild ganz ausgefahren wie ein Brett
     aussieht – 85 % zeigt, dass sie beweglich ist. */
  [['k3dVelarisObenZu', 'oben', 0], ['k3dVelarisObenAuf', 'oben', 90],
   ['k3dVelarisUntenZu', 'unten', 0], ['k3dVelarisUntenAuf', 'unten', 90]
  ].forEach(function (pr) {
    var k = document.getElementById(pr[0]);
    if (k) k.addEventListener('click', function () { velarisFahren(pr[2], pr[1]); });
  });

  [['k3dVelarisSchiebenZu', 'k3dVelarisOffen', 0],
   ['k3dVelarisSchiebenAuf', 'k3dVelarisOffen', 100],
   ['k3dVelarisZu', 'k3dVelarisWinkel', 0], ['k3dVelarisAuf', 'k3dVelarisWinkel', 90],
   ['k3dLamZu', 'k3dLamellen', 0], ['k3dLamAuf', 'k3dLamellen', 85],
   ['k3dGlasZu', 'k3dGlasOffen', 0], ['k3dGlasAuf', 'k3dGlasOffen', 100],
   ['k3dSonneEin', 'k3dSonneAus', 0], ['k3dSonneRaus', 'k3dSonneAus', 85]
  ].forEach(function (pr) {
    var b = document.getElementById(pr[0]), r = document.getElementById(pr[1]);
    if (!b || !r) return;
    b.addEventListener('click', function () {
      r.value = Math.min(Math.max(pr[2], parseInt(r.min, 10)), parseInt(r.max, 10));
      aendern();
    });
  });

  /* Erweiterungen je Seite: mehrere gleichzeitig, mit denselben Regeln wie
     im Anfrage-Assistenten. Gesperrte Möglichkeiten bleiben sichtbar und
     sagen, woran es liegt – wegnehmen würde die Frage aufwerfen, wo sie
     hin sind. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-erw]'), function (reihe) {
    var seite = reihe.getAttribute('data-k3d-erw');
    reihe.addEventListener('click', function (ev) {
      var b = ev.target;
      while (b && b !== reihe && b.tagName !== 'BUTTON') b = b.parentNode;
      if (!b || b === reihe) return;
      var wert = b.getAttribute('data-erw');
      if (!wert) return;
      erwUmschalten(seite, wert);
      aendern();
    });
  });

  /* ---------- Senkrechtmarkise VD eZIP 105 / 125 ----------
     Masse aus der Montageanleitung „Senkrechtmarkise VD EZIP105,
     VD EZIP125" (VD AluSysteme, 2025), vom Betreiber am 11.10.2026
     geschickt. BELEGT daraus:

       · Serie Z-R: HALBRUNDE Kassette, Durchmesser 105 oder 125 mm
         (Seite 5). Serie Z-E: quaderfoermige Kassette, Kantenlaenge
         105 oder 125 mm. Welche der beiden wir verkaufen, stand nicht
         in den Unterlagen; der Betreiber hat es am 11.10.2026
         beantwortet: „Z-E Eckig". Deshalb KASSETTE_RUND = false. Die
         runde Form bleibt im Code, falls die Serie einmal dazukommt.
       · Ab 400 cm Markisenbreite kommt eine zusaetzliche
         Kastenunterstuetzung dazu (Seite 5).
       · Groesstmasse (Seite 26): die 105er Baugroesse max. 4000 mm
         breit, die 125er max. 5000 mm. Breiter geht nur geteilt.
       · Aufbau (Abb. 2, Seite 5): Kassette, Fallstange am unteren
         Tuchende, je Seite eine Einzelfuehrungsschiene aus Rueckteil,
         Z-Schiene und Vorderteil, hinten von der Schienenblende
         verschlossen.

     Der Schienenquerschnitt ist in Abb. 3 (Seite 13) gezeichnet und mit
     10,7 / 18,9 / 19,9 mm bemasst – das sind die Bohrkanaele, nicht die
     Aussenmasse. Die Aussenmasse sind ueber diesen Massstab aus der
     Zeichnung ABGEGRIFFEN: rund 48 mm tief, 41 mm breit. Also kein
     gedrucktes Mass, aber auch nicht geraten. */
  var ZIP = {
    kassette:   10.5,   // 105 mm BELEGT (eZIP 105; eZIP 125 waere 12,5)
    schieneT:    4.8,   // ~48 mm, aus Abb. 3 abgegriffen
    schieneB:    4.1,   // ~41 mm, aus Abb. 3 abgegriffen
    fallstange:  4.5,   // GESCHAETZT, in der Anleitung ohne Mass
    stuetzeAb: 400,     // cm, BELEGT: ab 400 cm Markisenbreite
    maxBreite: 500      // cm, BELEGT: Baugroesse 125 max. 5000 mm
  };
  var KASSETTE_RUND = false;  // Serie Z-E (eckig), Angabe des Betreibers

  /* Halbrunder Kassettenquerschnitt: oben flach (dort haengt sie am
     Dach), unten rund. x quer, y nach oben, Nullpunkt in der Achse. */
  function zipQuerschnitt(r) {
    var f = new THREE.Shape();
    f.moveTo(-r, 0);
    f.lineTo(r, 0);
    f.absarc(0, 0, r, 0, -Math.PI, true);
    f.closePath();
    return f;
  }

  /* ---------- Markisenstoffe ----------
     Die Liste steht in js/markisenstoffe.js – dort auch die Begruendung,
     warum die beiden Gruppen streng getrennt bleiben muessen. Kurz: Ein
     Serge-Stoff ist fuer eine Aufdachmarkise nicht bestellbar. Wer ihn
     trotzdem waehlen koennte, schickt eine Anfrage los, die erst beim
     Angebot auffliegt – nach Rueckruf und Aufmass.

     Plissee und Sonnensegel stehen bewusst NICHT in STOFF_DACH_MARKISEN:
     Die Stoffkarte nennt als Produktgruppe LINEA / SOLARA / PERGOLA /
     LUNA / LUXORA, und diese beiden gehoeren nicht dazu. */
  var STOFF_DACH_MARKISEN = ['Aufdachmarkise', 'Unterdachmarkise'];

  function stoffListe(gruppe) {
    var q = window.BV_STOFFE;
    return (q && q[gruppe]) ? q[gruppe] : [];
  }

  /* Findet den Datensatz zu einem Wert. Bei zip steht hinter dem Code noch
     die Konfektion ('T30812-A'). */
  function stoffDaten(wert) {
    if (!wert) return null;
    var code = wert.split('-')[0], i;
    var alle = stoffListe('dach').concat(stoffListe('zip'));
    for (i = 0; i < alle.length; i++) if (alle[i].c === code) return alle[i];
    return null;
  }

  function stoffText(wert) {
    var d = stoffDaten(wert);
    if (!d) return '';
    var t = d.c + (d.n ? ' ' + d.n : '') + ' · ' + d.f;
    if (d.w) t += ' · Wassersäule ' + d.w + ' mm · Lichtechtheit 4/5';
    if (wert.indexOf('-') > -1) t += ' · Konfektion ' + wert.split('-')[1];
    return t;
  }

  function stoffKachel(wert, bild, beschriftung) {
    return '<button type="button" class="k3d-stoff" data-stoff="' + wert +
           '" aria-pressed="false" title="' + beschriftung + '">' +
           '<img src="images/stoffe/mini/' + bild + '.webp" alt="" loading="lazy" ' +
           'width="96" height="24"><span>' + beschriftung + '</span></button>';
  }

  /* Baut das Bildraster einmal auf – 53 bzw. 88 Kacheln. Die Bilder laden
     verzoegert (loading="lazy"), sonst zieht das Bedienfeld beim Oeffnen
     hundert Dateien auf einmal. */
  function stoffRasterBauen(behaelter, gruppe) {
    if (!behaelter || behaelter.getAttribute('data-fertig')) return;
    var liste = stoffListe(gruppe);
    if (!liste.length) return;
    var html = '<div class="k3d-stoffe">' +
      '<button type="button" class="k3d-stoff k3d-stoff--leer" data-stoff="" ' +
      'aria-pressed="false"><span>Noch offen – bitte beraten</span></button></div>';
    var fam = null;
    liste.forEach(function (st) {
      if (st.f !== fam) {
        if (fam !== null) html += '</div>';
        html += '<p class="k3d-stoff-fam">' + st.f + '</p><div class="k3d-stoffe">';
        fam = st.f;
      }
      if (gruppe === 'zip') {
        ['A', 'B'].forEach(function (k) {
          html += stoffKachel(st.c + '-' + k, st.c + '-' + k, st.c + ' ' + k);
        });
      } else {
        html += stoffKachel(st.c, st.c, st.c);
      }
    });
    if (fam !== null) html += '</div>';
    behaelter.innerHTML = html;
    behaelter.setAttribute('data-fertig', '1');
    behaelter.addEventListener('click', function (ev) {
      var b = ev.target;
      while (b && b !== behaelter && b.tagName !== 'BUTTON') b = b.parentNode;
      if (!b || b === behaelter) return;
      var feld = document.getElementById(
        gruppe === 'zip' ? 'k3dStoffZip' : 'k3dStoff');
      if (feld) feld.value = b.getAttribute('data-stoff') || '';
      aendern();
    });
  }

  function stoffMarkieren(behaelter, wert) {
    if (!behaelter) return;
    Array.prototype.forEach.call(behaelter.querySelectorAll('.k3d-stoff'),
      function (b) {
        var ist = (b.getAttribute('data-stoff') || '') === (wert || '');
        b.classList.toggle('is-active', ist);
        b.setAttribute('aria-pressed', ist ? 'true' : 'false');
      });
  }

  function stoffAnzeigen() {
    var d = document.getElementById('k3dStoffeDach');
    var z = document.getElementById('k3dStoffeZip');
    if (gruppeGilt('stoff-dach')) stoffRasterBauen(d, 'dach');
    if (gruppeGilt('stoff-zip')) stoffRasterBauen(z, 'zip');
    stoffMarkieren(d, Z.stoff);
    stoffMarkieren(z, Z.stoffZip);
    var i1 = document.getElementById('k3dStoffInfo');
    if (i1) i1.textContent = Z.stoff ? stoffText(Z.stoff)
      : 'Ohne Angabe schlagen wir im Angebot etwas Passendes vor.';
    /* BELEGT (Montageanleitung eZIP, S. 26): eine Senkrechtmarkise gibt
       es bis 5000 mm Breite (Baugroesse 125). Eine breitere Seite muss geteilt
       werden – das gehoert in die Anfrage, nicht erst ins Angebot. */
    var zuBreit = [];
    if (Z.erwLinks.indexOf('Senkrechtmarkise') > -1 && Z.tiefe > ZIP.maxBreite * 10) zuBreit.push('links');
    if (Z.erwRechts.indexOf('Senkrechtmarkise') > -1 && Z.tiefe > ZIP.maxBreite * 10) zuBreit.push('rechts');
    if (Z.erwVorne.indexOf('Senkrechtmarkise') > -1 && Z.breite > ZIP.maxBreite * 10) zuBreit.push('vorne');

    var i2 = document.getElementById('k3dStoffZipInfo');
    if (i2) {
      i2.textContent = (zuBreit.length
        ? 'Hinweis: ' + zuBreit.join(' und ') + ' über 5 m breit – eine '
          + 'Senkrechtmarkise gibt es bis 5 m am Stück, darüber geteilt. '
        : '') + (Z.stoffZip ? stoffText(Z.stoffZip)
          : 'Jeder Stoff gibt es in zwei Mustern – Konfektion A und B.');
    }
  }

  /* Das Tuch im Modell bekommt das echte Muster. Geladen wird erst, wenn
     jemand einen Stoff waehlt – 97 Texturen im Voraus waeren unsinnig. */
  var STOFF_TEX = {};
  function stoffTextur(wert) {
    if (!wert) return null;
    if (STOFF_TEX[wert] !== undefined) return STOFF_TEX[wert] || null;
    STOFF_TEX[wert] = null;
    if (!texLader) return null;
    texLader.load('images/stoffe/tex/' + wert + '.webp', function (t) {
      neuZeichnen();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = texMaxAniso;
      STOFF_TEX[wert] = t;
      bauen();            // Tuch neu aufbauen, damit das Muster sitzt
    }, undefined, function () { STOFF_TEX[wert] = false; });
    return null;
  }

  /* Legt das Muster auf ein Stoffmaterial. breiteCm bestimmt, wie oft sich
     die Bahn ueber die Breite wiederholt – eine Musterbahn ist rund
     120 cm breit (GESCHAETZT, die Stoffkarte nennt keine Bahnbreite). */
  function stoffAuftragen(material, wert, breiteCm) {
    var t = stoffTextur(wert);
    if (!t) return false;
    t.repeat.set(Math.max(1, Math.round((breiteCm || 300) / 120)), 1);
    material.map = t;
    material.color.copy(rgb(0xffffff));
    material.needsUpdate = true;
    return true;
  }

  /* ---------- Welche Beschattung zu welchem Dach passt ----------
     Die Aufdachmarkise liegt mit Schienen und Stuetzen AUF der Eindeckung
     und wird auf die aeusseren Sparren der geneigten Dachflaeche
     geschraubt. Das Flachdach SkyView hat beides nicht: kein Aussen-
     gefaelle und eine umlaufende hohe Blende, ueber die Kassette und
     Schienen hinausstuenden.

     Beanstandet vom Betreiber am 11.10.2026: „bei sky view is keine
     aufdachmarkise moeglich". Die Regel fehlte im 3D-Konfigurator UND im
     Anfrage-Assistenten – beide boten sie an. Sie steht jetzt an beiden
     Stellen; scripts/pruefe-konfigurator.js vergleicht die Tabellen. */
  var MARKISE_NICHT = {
    'Flachdach SkyView': ['Aufdachmarkise']
  };
  function markiseGesperrt(wert) {
    var liste = MARKISE_NICHT[Z.produkt];
    return !!(liste && liste.indexOf(wert) > -1);
  }
  function markiseAnzeigen() {
    /* Wer beim TDS eine Aufdachmarkise gewaehlt hat und dann auf SkyView
       wechselt, haette sie sonst unsichtbar weiter in der Anfrage. */
    if (markiseGesperrt(Z.markise)) {
      Z.markise = 'Ohne';
      segSetzen('k3dMarkise', 'Ohne');
    }
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-k3d-seg="k3dMarkise"] button'),
      function (b) {
        var aus = markiseGesperrt(b.getAttribute('data-wert'));
        b.disabled = aus;
        b.classList.toggle('ist-gesperrt', aus);
        if (aus) b.setAttribute('title', 'Beim Flachdach SkyView nicht moeglich');
        else b.removeAttribute('title');
      });
  }

  function erwAnzeigen() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-erw]'), function (reihe) {
      var seite = reihe.getAttribute('data-k3d-erw');
      var liste = erwListe(seite);
      var moeglich = erwMoeglich(seite);
      Array.prototype.forEach.call(reihe.querySelectorAll('button[data-erw]'), function (b) {
        var wert = b.getAttribute('data-erw');
        var drin = liste.indexOf(wert) > -1;
        b.hidden = moeglich.indexOf(wert) === -1;
        b.classList.toggle('is-active', drin);
        b.setAttribute('aria-pressed', drin ? 'true' : 'false');
        var blocker = drin ? null : erwBlocker(wert, liste);
        var gesperrt = drin && wert === 'Keil' && erwKeilGesperrt(seite, liste);
        b.disabled = !!blocker;
        b.classList.toggle('ist-gesperrt', !!blocker || gesperrt);
        var note = b.querySelector('small');
        if (note) {
          note.textContent = blocker ? 'nicht mit ' + blocker : (gesperrt ? 'erforderlich' : '');
        }
      });
      var zeile = reihe.parentNode.querySelector('[data-k3d-erw-wert]');
      if (zeile) zeile.textContent = liste.length ? liste.join(' · ') : 'offen';
    });
  }

  // Farbfelder
  Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (b) {
    b.addEventListener('click', function () {
      farbeSetzen(b.getAttribute('data-k3d-farbe'));
      /* KORREKTUR 11.10.2026: „das mit den ralfarben von eben klappt noch
         nicht" (Betreiber).

         Hier standen bauen() und textAktualisieren(). Beide zeichnen neu,
         aber KEINES von beiden entscheidet, welche Bedienfelder sichtbar
         sind – das macht panelAnpassen(), und das steckt in aendern().
         Folge: Das Feld für den RAL-Ton tauchte nach dem Klick auf
         „Andere / Beratung" gar nicht erst auf.

         aendern() macht beides und liest zusätzlich die Felder ein; die
         gewählte Farbe steht in Z und wird dabei nicht überschrieben. */
      aendern();
    });
  });

  // Ansichten
  Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-ansicht]'), function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-k3d-ansicht');
      if (!ANSICHTEN[name]) return;
      autoDreht = false;
      ansichtAnwenden(name);
      Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-ansicht]'), function (x) {
        x.classList.remove('is-active');
      });
      b.classList.add('is-active');
    });
  });

  var abendBtn = document.getElementById('k3dAbend');
  if (abendBtn) {
    abendBtn.addEventListener('click', function () {
      Z.abend = !Z.abend;
      abendBtn.classList.toggle('is-active', Z.abend);
      abendBtn.setAttribute('aria-pressed', Z.abend ? 'true' : 'false');
      /* Beschriftung UND Symbol: Mond, solange der Abend erst kommt,
         Sonne, wenn man zurück in den Tag schalten kann. Vorher wurde
         mit querySelector('span') das erste span beschrieben – seit dort
         das Symbol steht, wäre es damit überschrieben worden. */
      var txt = abendBtn.querySelector('.k3d-txt');
      var sym = abendBtn.querySelector('.k3d-sym');
      if (txt) txt.textContent = Z.abend ? 'Tag' : 'Abend';
      if (sym) sym.textContent = Z.abend ? '☀' : '☾';
      bauen();
    });
  }

  /* ---------- Maße ein-/ausblenden ----------
     „solte man solche einstelungen wie maße im 3d anzeige anzeigen nicht
     erst am ende vorgeschlagen bekommen, es solte ne einstellung sein wie
     bei tag/nacht modus etc." (Betreiber, 11.10.2026).

     Das Häkchen im Bedienfeld bleibt, steht aber im letzten Schritt
     „Umgebung" – wer die Maße während des Konfigurierens sehen will,
     findet es dort nicht. Der Schalter in der Ansichtsleiste liegt neben
     Abend und Drehen und wirkt sofort. Beide halten denselben Wert, nicht
     zwei: Wer hier schaltet, sieht das Häkchen mitgehen und umgekehrt. */
  var masseBtn = document.getElementById('k3dMasseLeiste');
  function masseKnopfStand() {
    if (!masseBtn) return;
    masseBtn.classList.toggle('is-active', Z.masseZeigen);
    masseBtn.setAttribute('aria-pressed', Z.masseZeigen ? 'true' : 'false');
  }
  if (masseBtn) {
    masseBtn.addEventListener('click', function () {
      Z.masseZeigen = !Z.masseZeigen;
      var haken = document.getElementById('k3dMasse');
      if (haken) haken.checked = Z.masseZeigen;
      masseKnopfStand();
      masseZeichnen();
      zusammenfassung();
    });
  }
  var hakenMasse = document.getElementById('k3dMasse');
  if (hakenMasse) hakenMasse.addEventListener('change', masseKnopfStand);
  masseKnopfStand();

  var drehBtn = document.getElementById('k3dDrehen');
  if (drehBtn) {
    drehBtn.addEventListener('click', function () {
      autoDreht = !autoDreht;
      drehBtn.classList.toggle('is-active', autoDreht);
      drehBtn.setAttribute('aria-pressed', autoDreht ? 'true' : 'false');
    });
  }

  /* ---------- Bild speichern ----------
     „mach den download button bissl breiter das man sieht bild download,
     und wenn man draufdrückt kann man direkt mehrere perspektiven in
     bilder runterladen" (Betreiber, 11.10.2026).

     Der Knopf öffnet jetzt ein kleines Menü: die aktuelle Ansicht, jede
     der fünf Ansichten einzeln – oder alle fünf in EINEM Bild.

     Warum alle fünf in einem Bild und nicht fünf Dateien nacheinander:
     Handy-Browser lassen in der Regel nur einen Download je Tipp zu, der
     Rest wird still verworfen. Ein Blatt mit fünf Ansichten kommt immer
     an und lässt sich außerdem als Ganzes weiterschicken. */
  function bildName(zusatz) {
    return produktName().replace(/[^A-Za-zÄÖÜäöüß0-9]+/g, '-').replace(/^-|-$/g, '') +
           '-' + Z.breite + 'x' + Z.tiefe + 'mm' +
           (zusatz ? '-' + zusatz.replace(/[^A-Za-zÄÖÜäöüß0-9]+/g, '-') : '') + '.png';
  }

  function bildLaden(datenUrl, name) {
    var a = document.createElement('a');
    a.href = datenUrl;
    a.download = name;
    a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
  }

  /* Eine Ansicht einstellen, zeichnen, Bild zurückgeben. Die vorherige
     Ansicht wird danach wiederhergestellt – wer ein Bild speichert, will
     nicht woanders stehen als vorher. */
  function bildVonAnsicht(name) {
    var vorher = kam.ansicht;
    if (name && ANSICHTEN[name]) ansichtAnwenden(name);
    renderer.render(szene, kamera3);
    var bild = renderer.domElement.toDataURL('image/png');
    if (name && ANSICHTEN[name] && vorher && vorher !== name) ansichtAnwenden(vorher);
    return bild;
  }

  /* ---------- Alle Ansichten als PDF ----------
     Bis zum 12.10.2026 entstand hier EIN PNG mit fünf Ansichten
     nebeneinander. „wenn man auf alle bilder sichern geht sol anstatt ein
     bild, eine pdf erstell werden mit den wichtigsten ansichten, + wenn so
     sachen gibt wie aufdach ode unterdachmarkisen, etc. auch davon bilder
     im geschlossenen zustand, die normalen ansichtsbilder alles im offenen
     zustnd" (Betreiber, 12.10.2026).

     Also: eine Seite je Ansicht, dazu Seiten für die beweglichen Teile im
     jeweils anderen Zustand. Was „offen" heißt, hat der Betreiber auf
     Rückfrage festgelegt: In den fünf Hauptansichten sind die Markisen
     EINGEFAHREN (das Dach ist zu sehen) und die Schiebeelemente
     AUFGESCHOBEN. Die Zusatzseiten zeigen das Gegenteil.

     Der Lamellenwinkel bleibt in den Hauptansichten so, wie der Kunde ihn
     eingestellt hat – er ist Teil der Konfiguration, kein Betriebszustand
     wie eine Markise. Nur die Zusatzseite zeigt ihn geschlossen. */

  /* Ein Formularfeld setzen und den alten Wert zurückgeben. Es reicht
     NICHT, Z.* direkt zu setzen: aendern() liest die Werte aus den
     Feldern zurück und würde die Änderung sofort überschreiben – derselbe
     Weg, den auch sonneFahren() geht. */
  function feldSetzen(id, wert) {
    var e = document.getElementById(id);
    if (!e) return null;
    var alt = e.value;
    e.value = wert;
    return alt;
  }

  function zustandSetzen(felder) {
    var alt = {};
    Object.keys(felder).forEach(function (id) {
      alt[id] = feldSetzen(id, felder[id]);
    });
    aendern();
    return alt;
  }

  /* Welche beweglichen Teile hat diese Anlage? Jeder Eintrag wird zu einer
     zusätzlichen Seite im anderen Zustand. */
  function zustandsSeiten() {
    var liste = [];
    if (gruppeGilt('sonne-aus')) {
      liste.push({
        titel: 'Sonnenschutz ausgefahren',
        hinweis: markiseName() + ' in Betrieb',
        felder: { k3dSonneAus: 100 }
      });
    }
    if (erwIrgendwo('Schiebetür')) {
      liste.push({
        titel: 'Schiebeelemente geschlossen',
        hinweis: 'Glaswände und Schiebetüren zugeschoben',
        felder: { k3dGlasOffen: 0 }
      });
    }
    if (gruppeGilt('pg-lamellen')) {
      liste.push({
        titel: 'Lamellen geschlossen',
        hinweis: 'Lamellendach bei Regen',
        felder: { k3dLamellen: 0 }
      });
    }
    if (istPergola() && Z.pgDachart === 'Velaris') {
      liste.push({
        titel: 'Velaris geschlossen',
        hinweis: 'Lamellen zu' + (Z.velarisArt === 'verschiebbar'
          ? ', Elemente zusammengeschoben' : ''),
        felder: {
          k3dVelarisWinkelOben: 0, k3dVelarisWinkelUnten: 0,
          k3dVelarisOffen: Z.velarisArt === 'verschiebbar' ? 100 : 0
        }
      });
    }
    return liste;
  }

  function markiseName() {
    if (Z.markise && Z.markise !== 'Ohne') return Z.markise;
    return erwIrgendwo('Senkrechtmarkise') ? 'Senkrechtmarkise' : 'Sonnenschutz';
  }

  /* ---------- Die Konfiguration fürs PDF gliedern ----------
     „wenn die austattung größer wird, wird diese liste unübersichtlich"
     (Betreiber, 12.10.2026). Darum die Angaben nach Themen sortiert.

     QUELLE BLEIBT zusammenfassung() – dieselbe Liste, die in die Anfrage
     geht. Hier wird NUR umsortiert, nichts umformuliert und nichts
     weggelassen: Was auf kein Muster passt, landet unter „Weitere
     Angaben". Eine Prüfung in scripts/pruefe-fuehrung.js rechnet nach,
     dass jede Zeile genau einmal vorkommt – sonst verschwindet beim
     nächsten neuen Eintrag still eine Angabe aus dem Blatt.

     Die Reihenfolge der Gruppen ist nicht beliebig: erst das Tragwerk
     (das ist die Anlage), dann was man sieht (Dach, Seiten), dann der
     Komfort, zuletzt die Montage. */
  var PDF_GRUPPEN = [
    ['Konstruktion und Maße', [
      /^\d+ Sparren/, /^Gerechnet mit der nächsten/, /^ACHTUNG/,
      /^Dachneigung/, /^Daraus Dachneigung/, /^Höhe an der Wand/,
      /^Höhe hinten/, /^Dachvorsprung/, /^Dachüberstand/, /^Lamellen /,
      /^Statikträger/
    ]],
    ['Dach und Farbe', [
      /^Eindeckung/, /^Dach:/, /^Farbe/, /^Glas im Keil/, /^Keilglas/,
      /^Glasart/, /^Glaskopplung/
    ]],
    ['Seiten und Verglasung', [
      /^Seitenelemente/, /^Seitenschutz/, /^Schiebeanlage/,
      /^Schiebetür im Bild/, /^SG23/, /^Rahmenwand/, /^Planken/,
      /^Teilhöhe/, /^Blickrichtung/, /^Velaris/
    ]],
    ['Komfort und Zubehör', [
      /^Beschattung/, /^Markisenstoff/, /^Sonnensegel/, /^Plissee/,
      /^LED/, /^mit Beleuchtung$/, /^Sound/, /^Heizung/, /^Wettersensor/,
      /^Stoff /, /^Senkrechtmarkise/, /^Volant/, /^Ausfahr/
    ]],
    ['Aufbau und Montage', [
      /^Hauswand/, /^Untergrund/, /^Montage/, /^Selbstmontage$/,
      /^Wandmontage$/, /^Freistehend$/, /^Ausführung/
    ]]
  ];

  /* Steht schon im Kopf oder in den Kacheln, darf also nicht noch einmal
     in der Liste auftauchen. Die Maßzeile wird über ihr Muster erkannt,
     nicht über ihre Position: Beim Carport steht an zweiter Stelle die
     Ausführung, beim Terrassendach die Montageart. */
  var PDF_IM_KOPF = /^[\d\s]+×[\d\s]+mm, Durch(gangs|fahrts)höhe/;

  /* ---------- Kein Lieferantenname auf dem Kundenblatt ----------
     „von VD soll nix drin stehen" (Betreiber, 12.10.2026). Auf Rückfrage
     festgelegt: nur die wörtliche Nennung, und nur im PDF. Die
     Anfrage-Mail an den Betrieb behält sie – dort wird nach ihr bestellt.

     Die Systembezeichnungen (TDS, SkyView, SG23, FR23) bleiben: Sie sagen
     einem Kunden nichts über den Lieferanten, und mit den Produktnamen
     wird geworben.

     WICHTIG: Die Prüfung in scripts/pruefe-fuehrung.js sucht im fertigen
     PDF-Text nach „VD" – damit fällt auch eine künftig neu hinzugefügte
     Zeile auf, die den Namen wieder hereinträgt. Hier zu ergänzen reicht
     also nicht, wenn jemand den Text an anderer Stelle neu formuliert. */
  /* ---------- Was nur den Betrieb angeht ----------
     „das mit nächste lieferbare breite weglassen, es wird nach kundenmaß
     gefertig das nächst lieferbare maß is nur für mich intern wichtig für
     den preis" (Betreiber, 12.10.2026).

     Gefertigt wird nach Kundenmaß – die nächste lieferbare Breite ist
     eine Kalkulationsgröße. Auf dem Kundenblatt würde sie nur die Frage
     aufwerfen, warum dort ein anderes Maß steht als bestellt.

     Die Zeile bleibt in der Anfrage an den Betrieb: Dort hängt der Preis
     daran. */
  /* Dieselbe Trennung gilt seit 15.10.2026 fuer jede Stelle, an der der
     Kunde den Fachtext zu sehen bekommt: den Kasten „Ihre Konfiguration"
     auf der Seite, das Kundenblatt im PDF und die Zusammenfassung im
     Anfrage-Assistenten. Vorher filterte allein das PDF – auf dem
     Bildschirm stand alles. Was hier steht, geht nur in die Mail:
     Kalkulations- und Statikgroessen, die der Kunde nicht einordnen kann
     („es stehen teilweise sachen drin die sind für uns relevant der kunde
     kann damit nix anfangen", Betreiber 15.10.2026).

     NICHT in dieser Liste: der Unterzug. Er steht als zwei Pfosten
     mitten im Modell, der Kunde hat seine Lage selbst eingestellt. */
  var NUR_INTERN = [
    /^Gerechnet mit der nächsten lieferbaren Breite/,
    /^Statisch wirksame Spannweite/,
    /^Innenkern-Träger/
  ];
  function nurIntern(zeile) {
    return NUR_INTERN.some(function (r) { return r.test(zeile); });
  }
  /* Der Fachtext, wie ihn der Kunde sehen darf: ohne die internen Zeilen
     und ohne Lieferantennennung. Eine Quelle (zusammenfassung()), eine
     Filterregel – sonst laufen Bildschirm, PDF und Mail auseinander. */
  function zusammenfassungKunde() {
    return zusammenfassung().filter(function (z) { return !nurIntern(z); })
                            .map(ohneLieferant);
  }

  /* ---------- Vorbehalte nur einmal, unten ----------
     „du musst nicht bei jedem element schreiben (vorschlag, Aufteilung
     nach aufmaß) reicht wenn es unten im rechtstext einmal alles
     drinsteht" (Betreiber, 12.10.2026).

     Bei drei Schiebeanlagen stand derselbe Satz dreimal – das liest
     niemand mehr, und wiederholte Einschränkungen lassen ein Angebot
     unsicher wirken. Jetzt steht er einmal im Fußtext und gilt für alles. */
  function ohneVorbehalt(zeile) {
    return String(zeile)
      .replace(/\s*\((?:Vorschlag|Bedarf)[^)]*\)/g, '')
      .replace(/\s*[–-]\s*(?:Bedarf|Aufteilung) nach Aufmaß/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;])/g, '$1')
      .trim();
  }

  function ohneLieferant(zeile) {
    return String(zeile)
      /* „(links/rechts wie im VD-Anfrageformular)" -> „(links/rechts)" */
      .replace(/\s*wie im VD-[^)]*/g, '')
      /* Sicherheitsnetz für alles, was später dazukommt: ein Klammerzusatz,
         in dem VD steht, fällt ganz weg. */
      .replace(/\s*\((?:[^()]*\bVD\b[^()]*)\)/g, '')
      .replace(/\s*[–-]\s*(?:laut|nach)\s+VD\b[^,.;]*/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function pdfGruppen(zeilen) {
    /* Die ersten beiden Zeilen (Produkt und Montageart bzw. Ausführung)
       stehen im Kopf des Blattes. */
    var rest = zeilen.slice(2).filter(function (z) {
      return !PDF_IM_KOPF.test(z) && !nurIntern(z);
    }).map(ohneLieferant).map(ohneVorbehalt);
    var gruppen = PDF_GRUPPEN.map(function (g) {
      return { titel: g[0], muster: g[1], zeilen: [] };
    });
    var weitere = { titel: 'Weitere Angaben', zeilen: [] };
    rest.forEach(function (z) {
      var passt = null;
      gruppen.some(function (g) {
        if (g.muster.some(function (m) { return m.test(z); })) { passt = g; return true; }
        return false;
      });
      (passt || weitere).zeilen.push(z);
    });
    gruppen.push(weitere);
    return gruppen.filter(function (g) { return g.zeilen.length; })
                  .map(function (g) { return { titel: g.titel, zeilen: g.zeilen }; });
  }

  /* Die vier Zahlen, nach denen zuerst gesucht wird. Sie stehen oben als
     Kacheln – gefunden werden sie in derselben Liste, damit auch hier
     keine zweite Wahrheit entsteht. */
  function pdfKacheln(zeilen) {
    function such(muster, wieVor) {
      var treffer = null;
      zeilen.forEach(function (z) {
        if (treffer === null && muster.test(z)) {
          treffer = ohneLieferant(wieVor ? z.replace(muster, '').trim() : z);
        }
      });
      return treffer;
    }
    var k = [
      { label: 'Breite × Tiefe', wert: Z.breite + ' × ' + Z.tiefe + ' mm' },
      { label: istCarport() ? 'Durchfahrtshöhe' : 'Durchgangshöhe',
        wert: Z.hoehe + ' mm' }
    ];
    var ein = such(/^Eindeckung:\s*/, true) || such(/^Dach:\s*/, true);
    if (ein) k.push({ label: 'Eindeckung', wert: ein });
    var fa = such(/^Farbe:\s*/, true);
    if (fa) k.push({ label: 'Farbe', wert: fa });
    return k;
  }

  /* ---------- Die Bilder fürs PDF ----------
     Die Leinwand wird dafür kurz auf Druckauflösung gestellt. Ohne das
     käme das Bild in Bildschirmgröße ins PDF und wäre auf A4 quer sichtbar
     grob – auf dem Handy sind das keine 400 Pixel Breite.
     pixelRatio geht dabei auf 1, sonst rechnet three.js die Zielgröße ein
     zweites Mal hoch und die Leinwand kommt in falscher Größe zurück. */
  var PDF_BREIT = 1800;

  function pdfSeiten() {
    var namen = ['Perspektive', 'Vorne', 'Seite', 'Von oben', 'Darunter'];
    var lw = renderer.domElement;
    var altB = lw.width, altH = lw.height, altR = renderer.getPixelRatio();
    var vorherAnsicht = kam.ansicht;
    /* Die Öffnungsgrade je Seite stehen nur in Z – aendern() setzt sie
       bloß, wenn sich der gemeinsame Regler ändert. Darum von Hand
       sichern und am Ende zurückschreiben. */
    var vorherOffen = {
      links: Z.offenLinks, rechts: Z.offenRechts, vorne: Z.offenVorne
    };

    if (altB < PDF_BREIT) {
      renderer.setPixelRatio(1);
      renderer.setSize(PDF_BREIT, Math.round(PDF_BREIT * altH / altB), false);
    }

    function schuss(ansicht) {
      ansichtAnwenden(ansicht);
      renderer.render(szene, kamera3);
      /* JPEG statt PNG: Das PDF übernimmt die JPEG-Bytes unverändert
         (DCTDecode). Ein PNG müsste erst entpackt und neu verpackt
         werden – mehr Code und eine deutlich größere Datei. */
      return renderer.domElement.toDataURL('image/jpeg', 0.9);
    }

    /* Zwei Zeilen: zuerst der Vorbehalt, der für ALLE Maße gilt (er stand
       vorher hinter jeder einzelnen Schiebeanlage), dann der übliche
       Hinweis. Beides kursiv – siehe Eintrag vom 12.10.2026. */
    var fuss = [
      'Alle Maße und Aufteilungen sind Vorschläge und werden beim kostenlosen ' +
      'Aufmaß vor Ort verbindlich festgelegt; gefertigt wird nach Ihrem Maß.',
      'Unverbindliche Darstellung – verbindlich ist unser Angebot. © ' +
      new Date().getFullYear() + ' BV AussenSysteme'
    ];
    var kopf = produktName() + ', ' + Z.breite + ' x ' + Z.tiefe + ' mm';
    var seiten = [];

    /* 1. Grundzustand: Markisen eingefahren, Schiebeelemente offen. */
    var hatSchiebe = erwIrgendwo('Schiebetür');
    var grund = {};
    if (gruppeGilt('sonne-aus')) grund.k3dSonneAus = 0;
    if (hatSchiebe) grund.k3dGlasOffen = 100;
    var altGrund = zustandSetzen(grund);

    namen.forEach(function (name) {
      seiten.push({
        titel: name, rechts: kopf, unten: fuss, bild: schuss(name)
      });
    });

    /* 2. Je bewegliches Teil eine Seite im anderen Zustand. */
    zustandsSeiten().forEach(function (zu) {
      var alt = zustandSetzen(zu.felder);
      seiten.push({
        titel: zu.titel, rechts: zu.hinweis, unten: fuss,
        bild: schuss('Perspektive')
      });
      zustandSetzen(alt);
    });

    /* 3. Zum Schluss die Konfiguration in Worten – dieselbe Liste wie in
       der Anfrage, damit beide nicht auseinanderlaufen. „die seite Ihre
       Konfiguration also die zusammenfassung soll das letzte blatt sein"
       (Betreiber, 12.10.2026): Wer blättert, sieht erst die Anlage und
       hat die Angaben am Ende beisammen – auch wenn später noch
       Zustandsseiten dazukommen, bleibt sie die letzte. */
    var zus = zusammenfassung();
    seiten.push({
      titel: 'Ihre Konfiguration',
      kopf: ohneLieferant(zus[0] + (zus[1] ? '  ·  ' + zus[1] : '')),
      kacheln: pdfKacheln(zus),
      gruppen: pdfGruppen(zus),
      unten: fuss,
      /* Der naechste Schritt gehoert aufs Blatt, nicht nur ins Gespraech:
         Wer es spaeter wieder in die Hand nimmt, soll nicht erst suchen
         muessen, wie es weitergeht. */
      ruf: 'Kostenloses Aufmass vor Ort: 0156 78696609',
      /* Der tatsächliche Ablauf des Betriebs – keine Versprechen, die im
         Angebot dann anders aussehen. Dieselbe Reihenfolge, die auch der
         Fußtext voraussetzt („verbindlich ist unser Angebot nach dem
         kostenlosen Aufmaß vor Ort"). */
      schritte: ['Kostenloses Aufmass vor Ort',
                 'Verbindliches Angebot',
                 'Fertigung und Montage']
    });

    /* Alles zurück auf den Stand von vor dem Knopfdruck. */
    zustandSetzen(altGrund);
    Z.offenLinks = vorherOffen.links;
    Z.offenRechts = vorherOffen.rechts;
    Z.offenVorne = vorherOffen.vorne;
    if (altB < PDF_BREIT) {
      renderer.setPixelRatio(altR);
      renderer.setSize(altB, altH, false);
    }
    if (vorherAnsicht) ansichtAnwenden(vorherAnsicht);
    aendern();
    neuZeichnen();
    return seiten;
  }

  function pdfLaden(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 4000);
  }

  var bildBtn = document.getElementById('k3dBild');
  var bildMenu = document.getElementById('k3dBildMenu');
  if (bildBtn && bildMenu) {
    var menuZeigen = function (auf) {
      bildMenu.hidden = !auf;
      bildBtn.setAttribute('aria-expanded', auf ? 'true' : 'false');
    };
    bildBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menuZeigen(bildMenu.hidden);
    });
    document.addEventListener('click', function (e) {
      if (!bildMenu.hidden && !bildMenu.contains(e.target)) menuZeigen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !bildMenu.hidden) menuZeigen(false);
    });
    Array.prototype.forEach.call(bildMenu.querySelectorAll('[data-k3d-bild]'), function (b) {
      b.addEventListener('click', function () {
        var was = b.getAttribute('data-k3d-bild');
        autoDreht = false;
        if (was === 'alle') {
          /* Das PDF entsteht in einem Durchgang und blockiert dabei kurz.
             Damit „Wird erstellt …" vorher auch wirklich auf dem Schirm
             steht, wird erst nach zwei Bildern losgelegt – sonst rechnet
             der Browser, bevor er den neuen Text gezeichnet hat. Und
             falls unterwegs etwas schiefgeht, steht am Knopf wieder die
             Beschriftung statt für immer „Wird erstellt". */
          b.classList.add('ist-laeuft');
          b.textContent = 'Wird erstellt …';
          var zurueck = function () {
            b.classList.remove('ist-laeuft');
            b.textContent = 'PDF erstellen';
          };
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              try {
                /* Fehlt das PDF-Modul (alter Zwischenspeicher im
                   Browser), bleibt der Knopf nicht stumm stehen. */
                if (!window.BV_PDF) {
                  alert('Das PDF konnte nicht erstellt werden. ' +
                        'Bitte die Seite neu laden und noch einmal versuchen.');
                  return;
                }
                var seiten = pdfSeiten();
                pdfLaden(window.BV_PDF.erzeugen(seiten, { titel: produktName() }),
                         bildName('Ansichten').replace(/\.png$/, '.pdf'));
                menuZeigen(false);
              } finally { zurueck(); }
            });
          });
          return;
        }
        var name = was === 'jetzt' ? null : was;
        bildLaden(bildVonAnsicht(name), bildName(name || kam.ansicht));
        neuZeichnen();
        menuZeigen(false);
      });
    });
  }

  /* Übergabe an den Anfrage-Assistenten: die Konfiguration wandert als
     Vorgabe in den Assistenten, damit niemand alles zweimal eingibt.
     Die Werte müssen wörtlich zu den Auswahlmöglichkeiten dort passen –
     sonst erscheint im Assistenten keine Auswahl als gewählt und die
     Angabe fehlt später in der E-Mail. */
  /* Bedienfeld zuklappen – für den Blick auf das Modell allein. Nach dem
     Zuklappen ändert sich die Breite der Bühne, deshalb muss die Leinwand
     neu vermessen werden; das passiert am Ende der Bewegung. */
  var panelBtn = document.getElementById('k3dPanelAn');
  var panel = document.getElementById('k3dPanel');
  if (panelBtn && panel) {
    panelBtn.addEventListener('click', function () {
      var zu = panel.classList.toggle('ist-zu');
      panelBtn.setAttribute('aria-expanded', zu ? 'false' : 'true');
      setTimeout(groesseAnpassen, 280);
    });
    panel.addEventListener('transitionend', groesseAnpassen);
  }

  var vollBtn = document.getElementById('k3dVollbild');
  var app = document.getElementById('k3dApp');
  if (vollBtn && app) {
    vollBtn.addEventListener('click', function () {
      /* Vollbild braucht auf iPhones den Webkit-Namen, und auf manchen
         Geräten gibt es es gar nicht – dann bleibt der Knopf wirkungslos
         statt eine Fehlermeldung zu werfen. */
      var rein = app.requestFullscreen || app.webkitRequestFullscreen;
      var raus = document.exitFullscreen || document.webkitExitFullscreen;
      var drin = document.fullscreenElement || document.webkitFullscreenElement;
      try {
        if (drin && raus) raus.call(document);
        else if (rein) rein.call(app);
      } catch (x) { return; }
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        var drin = !!(document.fullscreenElement || document.webkitFullscreenElement);
        vollBtn.setAttribute('aria-pressed', drin ? 'true' : 'false');
        setTimeout(groesseAnpassen, 120);
      });
    });
  }

  /* Taste R dreht das Modell – aber nicht, während jemand in ein Feld tippt */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'r' && e.key !== 'R') return;
    var a = document.activeElement;
    if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return;
    if (drehBtn) drehBtn.click();
  });

  var anfrageBtn = document.getElementById('k3dAnfrage');
  if (anfrageBtn) {
    anfrageBtn.addEventListener('click', function () {
      var v = {
        breite: String(Z.breite),            // der Assistent rechnet ebenfalls in Millimetern
        tiefe: String(Z.tiefe),
        hoehe: String(Z.hoehe),
        farbe: VORGABE_FARBE[Z.farbe] || Z.farbe,
        led: Z.led ? VORGABE_LED.ja : VORGABE_LED.nein,
        montage: Z.montage,
        untergrund: Z.untergrund,
        /* notiz zeigt der Assistent dem Kunden in der Zusammenfassung –
           deshalb die Kurzfassung. fachnotiz sieht nur der Betrieb:
           Fachtext samt der internen Hinweise aus der Stueckliste
           (js/anfrage-wizard.js nimmt sie allein in den Versand). */
        notiz: zusammenfassungKurz().join(' · '),
        fachnotiz: zusammenfassung().join(' · ') +
          (hinweiseIntern().length
            ? ' || Interne Hinweise: ' + hinweiseIntern().join(' || ') : '')
      };
      /* Alles, was der Assistent als eigenes Feld kennt, geht auch als
         eigenes Feld hinüber – nicht nur als Text in der Notiz. Sonst
         steht es zwar in der E-Mail, aber im Assistenten ist nichts
         markiert, und beim Zurückblättern ist die Angabe weg. */
      if (gruppeGilt('fassade')) v.fassade = Z.fassade;
      if (Z.led) {
        v.ledset = Z.ledset;
        if (Z.ledsetzahl > 1) v.ledsetzahl = String(Z.ledsetzahl);
      }
      if (!istCarport()) {
        v.sound = Z.sound ? 'Ja, mit Lautsprechern' : 'Nein, ohne Lautsprecher';
        if (Z.sound) v.soundset = Z.soundset;
      }
      if (istPergola()) {
        v.produkt = 'Pergola / Lamellendach';
        v.dachart = Z.pgDachart;
        if (istLamellen()) v.dachausfuehrung = Z.pgAusfuehrung;
        v.aufbau = Z.aufbau === 'Wandmontage' ? 'Wandmontage' : 'Freistehend';
        v.seitenschutz = Z.pgSeitenschutz;
        v.farbe = VORGABE_FARBE_PERGOLA[Z.farbe] || VORGABE_FARBE[Z.farbe] || Z.farbe;
        v.led = Z.led ? VORGABE_LED_PERGOLA.ja : VORGABE_LED_PERGOLA.nein;
        v.heizung = Z.heizung ? 'Ja, mit Heizstrahler' : 'Nein, ohne Heizung';
        v.wettersensor = Z.wettersensor ? 'Ja, mit Wetter-Automatik' : 'Nein';
      } else if (istCarport()) {
        v.produkt = 'Carport';
        v.carporttyp = Z.cpTyp;
        v.carportvariante = cpVarianteJetzt();
        if (istCarportTds()) {
          if (Z.vorsprung > 0) v.ueberstand = String(Z.vorsprung);
        } else if (Z.cpVariante === 'Carport mit Überstand') {
          v.ueberstand = String(Z.ueberstand);
        }
        if (istCarportTds()) v.verglasung = VORGABE_VERGLASUNG[Z.eindeckung];
        /* Der Assistent fragt die Glasstaerke als eigenes Feld ab
           (js/anfrage-wizard.js, Schritt „verglasung") – Werte „8 mm"
           und „10 mm". Ohne diese Zeile stuende die Anfrage dort leer. */
        if (!istPolycarbonat()) v.glasstaerke = Z.glasstaerke + ' mm';
        else v.dach = Z.cpDach;
      } else {
        v.produkt = Z.produkt;
        v.aufbau = Z.aufbau === 'Wandmontage' ? 'Wandmontage' : 'Freistehend';
        v.verglasung = VORGABE_VERGLASUNG[Z.eindeckung];
        /* Der Assistent fragt die Glasstaerke als eigenes Feld ab
           (js/anfrage-wizard.js, Schritt „verglasung") – Werte „8 mm"
           und „10 mm". Ohne diese Zeile stuende die Anfrage dort leer. */
        if (!istPolycarbonat()) v.glasstaerke = Z.glasstaerke + ' mm';
        if (Z.markise !== 'Ohne') v.markise = Z.markise;
        /* Roher Code, nicht der Fliesstext: Der Assistent markiert damit
           die richtige Kachel. Den lesbaren Satz baut er selbst aus
           derselben Liste. */
        if (Z.stoff && gruppeGilt('stoff-dach')) v.stoff = Z.stoff;
        if (gruppeGilt('stoff-segel')) {
          v.segelstoff = Z.segelStoff;
          v.segelart = Z.segelArt;
          v.segelmontage = Z.segelMontage;
          v.segelstange = Z.segelStange ? 'ja' : 'nein';
        }
        if (gruppeGilt('stoff-plissee')) {
          v.plisseestoff = Z.plisseeStoff;
          v.plisseegestell = Z.plisseeGestell;
          v.plisseestab = Z.plisseeStab;
        }
        if (SONNE_IST.bahnen && (gruppeGilt('stoff-segel') || gruppeGilt('stoff-plissee'))) {
          v.bahnen = String(SONNE_IST.bahnen);
        }
        if (Z.stoffZip && gruppeGilt('stoff-zip')) v.stoffzip = Z.stoffZip;
        if (Z.produkt === 'Terrassendach TDS' && Z.vorsprung) {
          v.vorsprung = String(Z.vorsprung);
        }
        // Die Erweiterungen sind Listen – der Assistent führt sie ebenso
        if (Z.erwLinks.length) v.erw_links = Z.erwLinks.slice();
        if (Z.erwRechts.length) v.erw_rechts = Z.erwRechts.slice();
        if (Z.erwVorne.length) v.erw_vorne = Z.erwVorne.slice();
      }
      window.bvKonfigVorgabe = v;
      var bubble = document.getElementById('bvKonfigBubble');
      if (bubble) bubble.click();
      // Der Assistent hoert darauf und springt direkt zu den Kontaktdaten
      document.dispatchEvent(new CustomEvent('bv-konfig-vorgabe'));
    });
  }

  /* ---------- Start ----------
     Die Anwendung soll unter der Navigationsleiste anfangen und bis zum
     unteren Bildrand reichen. Deren Höhe steht nirgends im CSS dieser
     Seite – also einmal messen und als Variable hinterlegen, statt eine
     Zahl zu raten, die sich beim nächsten Navi-Umbau still verschiebt. */
  function navHoehe() {
    var nav = document.querySelector('.navbar');
    var h = nav ? Math.round(nav.getBoundingClientRect().height) : 72;
    document.documentElement.style.setProperty('--k3d-nav', h + 'px');
  }
  navHoehe();
  window.addEventListener('resize', navHoehe);

  groesseAnpassen();
  cpVariantenSetzen();
  kameraSetzen();
  zeichnen();

  /* Zuerst fragen, welche Maße es überhaupt gibt. Erst danach steht fest,
     ob die Rasterauswahl oder die geschätzte Skizze gilt. */
  rasterHolen(function () {
    reglerGrenzenSetzen();
    aendern();   // entfernt den Ladehinweis, sobald die erste Antwort da ist
  });
})();
