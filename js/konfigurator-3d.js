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
    plankenFarbe: 'Wie das Gestell',
    plankenFuge: 10,         // Luft zwischen zwei Planken in mm, 0 = bündig
    plankenAuto: true,       // true = das System rechnet die Fuge aus
    plankenAnteil: 0         // 0 = volle Höhe, <0 wächst von unten, >0 hängt oben
  };

  var FARBEN = {
    'Anthrazit':      0x383b3d,
    'Weißaluminium':  0xd3d4d2,
    'Graualuminium':  0x9a9c9b,
    'Reinweiß':       0xf1f1ec
  };

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
  var PLANKEN_IST = { anzahl: 0, gesamt: 0, fuge: 0, hoehe: 0, lage: 'voll' };
  var WINKEL = { lang: 4.0, kurz: 2.0, staerke: 0.2 };

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
    zufahrt:      'images/textur/zufahrt.webp'
  };
  /* Kantenlaenge einer Kachel in cm. GESCHAETZT nach Augenmass an der
     Vorlage – davon haengt ab, ob eine Platte wie 40 cm oder wie 2 m
     wirkt. Wer das aendert, aendert den Massstab im Bild. */
  var TEXTUR_KACHEL = {
    rasen: 200, steinplatten: 240, holzdielen: 120,
    putz: 220, klinker: 180, zufahrt: 220
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
      lieferbar: tiefeMm <= M.regeln.tiefeMaxMitUnterzug,
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
      color: rgb(FARBEN[Z.farbe] || FARBEN['Anthrazit']),
      metalness: 0.1, roughness: 0.52,
      clearcoat: 0.12, clearcoatRoughness: 0.4
    });
    m.envMapIntensity = 0.25;
    return m;
  }

  /* Planken: dasselbe pulverbeschichtete Aluminium, aber in eigener
     Farbe – sie darf vom Gestell abweichen. Holzdekore sind matter als
     eine Pulverbeschichtung, deshalb die höhere Rauheit. */
  function plankeMaterial() {
    var dekor = PLANKEN_FARBEN[Z.plankenFarbe];
    var hex = dekor !== undefined ? dekor
            : FARBEN[Z.plankenFarbe] || FARBEN[Z.farbe] || FARBEN['Anthrazit'];
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(hex),
      metalness: dekor !== undefined ? 0 : 0.1,
      roughness: dekor !== undefined ? 0.78 : 0.65,
      clearcoat: 0.1, clearcoatRoughness: 0.5
    });
    m.envMapIntensity = dekor !== undefined ? 0.2 : 0.45;
    return m;
  }

  /* Verkleidungsbleche sind matter als die tragenden Profile */
  function blech() {
    var m = new THREE.MeshPhysicalMaterial({
      color: rgb(FARBEN[Z.farbe] || FARBEN['Anthrazit']),
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
      color: rgb(FARBEN[Z.farbe] || FARBEN['Anthrazit']),
      metalness: 0.2, roughness: 0.55
    });
    m.envMapIntensity = 0.4;
    return m;
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
    wand: 0.25         // GESCHÄTZT
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

    f.moveTo(0, rU);
    f.quadraticCurveTo(0, 0, rU, 0);
    f.lineTo(B - faseT - rU, 0);
    f.quadraticCurveTo(B - faseT, 0, B - faseT, rU);
    f.lineTo(B - faseT, faseH - 0.6);
    f.lineTo(B, faseH + 0.4);             // Fase läuft nach außen aus

    /* Untere Schattenfuge */
    f.lineTo(B, faseH + 1.3);
    f.lineTo(B - fuge, faseH + 1.5);
    f.lineTo(B - fuge, faseH + 2.1);
    f.lineTo(B, faseH + 2.3);

    /* Flache Vorderfläche bis zur oberen Fuge */
    f.lineTo(B, H - rO - 1.6);
    f.lineTo(B - fuge, H - rO - 1.4);
    f.lineTo(B - fuge, H - rO - 0.8);
    f.lineTo(B, H - rO - 0.6);

    /* Nase */
    f.lineTo(B, H - rO);
    f.quadraticCurveTo(B, H, B - rO, H);
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
  var RINNENDECKEL = { breite: 17.2, hoehe: 17.5, fase: 3.4 };   // cm, BELEGT

  function rinnenblendeQuerschnitt() {
    var b = RINNENDECKEL.breite, h = RINNENDECKEL.hoehe, fase = RINNENDECKEL.fase;
    /* x = 0 ist hinten, x = b vorne; nach dem rotateY unten läuft die
       Querschnittsbreite in +z, und +z ist vorne. */
    var f = new THREE.Shape();
    f.moveTo(0, 0);
    f.lineTo(b, 0);
    f.lineTo(b, h - fase);
    f.lineTo(b - fase, h);
    f.lineTo(0, h);
    f.closePath();
    return f;
  }

  function rinnenblenden(laenge, zVorne, yUnten, material) {
    var dicke = 0.4;
    var zHinten = zVorne - RINNENDECKEL.breite;                   // vorne bündig
    var yStart = yUnten + (RINNE.hoehe - RINNENDECKEL.hoehe) / 2; // mittig
    [-1, 1].forEach(function (seite) {
      var g = new THREE.ExtrudeGeometry(rinnenblendeQuerschnitt(),
        { depth: dicke, bevelEnabled: false, curveSegments: 2 });
      g.rotateY(-Math.PI / 2);
      g.translate(seite * (laenge / 2 + dicke) + (seite > 0 ? 0 : dicke),
                  yStart, zHinten);
      var m = new THREE.Mesh(g, material);
      m.castShadow = true; m.receiveShadow = true;
      bau.add(m);
    });
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
    stegBreite: 2.6    // GESCHÄTZT – steht nicht in der Zeichnung
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
      sparrenL: laenge,
      uk: dachUkDaten
    });
    else verkleidung(B, T, hVorn - 1, pf);

    if (Z.led) {
      /* In die Sparren, nicht dazwischen: xS sind die Sparrenachsen.
         Die Unterkante des Sparrens liegt spH unter seiner Mitte und folgt
         dem Gefälle. */
      ledSpots(xS, [T * 0.3, T * 0.72], function (z) {
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

  function seitenErweiterungen(B, T, hVorn, PROFIL, neig, dachUk, dachVorne, pfostenX) {
    var mGlas = seitenglas();
    var rahmen = alu();
    function offenSeite(seite) {
      if (seite === 'links') return Z.offenLinks / 100;
      if (seite === 'rechts') return Z.offenRechts / 100;
      if (seite === 'vorne') return Z.offenVorne / 100;
      return Z.glasOffen / 100;
    }
    var mPlanke = blech();
    var mPlankeWand = plankeMaterial();
    var mStoff = new THREE.MeshStandardMaterial({
      color: rgb(0x4a4f52), roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });
    /* Der Senkrechtmarkise liegt die EZIP-Stoffliste zugrunde, nicht die
       der Dachmarkise – siehe js/markisenstoffe.js. */
    stoffAuftragen(mStoff, Z.stoffZip, B);

    /* Eine Scheibe oder Platte in der Ebene einer Seite.
       quer = Seite läuft in z-Richtung (links/rechts), sonst in x (vorne). */
    function platte(material, laenge, hoehe, achse, mitte, yMitte, quer, versatz, dicke) {
      var d = dicke || 1.4;
      var g = quer ? [d, hoehe, laenge] : [laenge, hoehe, d];
      var m = new THREE.Mesh(new THREE.BoxGeometry(g[0], g[1], g[2]), material);
      m.position.set(quer ? achse + (versatz || 0) : mitte,
                     yMitte,
                     quer ? mitte : achse + (versatz || 0));
      m.castShadow = true; m.receiveShadow = true;
      bau.add(m);
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
      bau.add(m);
      return m;
    }

    function rahmenKante(laenge, achse, mitte, y, quer, versatz) {
      return platte(rahmen, laenge, 5, achse, mitte, y, quer, versatz, 5);
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
    var GRIFF = { durchmesser: 5.0, hoehe: 105, randAbstand: 9 };

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

    function tuerschwelle(laenge, achse, mitte, quer, g) {
      var t = SCHWELLE.tiefe[g] || SCHWELLE.tiefe[3];
      platte(rahmen, laenge, SCHWELLE.hoehe, achse, mitte,
             SCHWELLE.ueberstand - SCHWELLE.hoehe / 2,
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
    function bodenschiene(laenge, achse, mitte, quer) {
      var t = SCHWELLE.tiefe[3];
      platte(rahmen, laenge, SCHWELLE.hoehe, achse, mitte,
             SCHWELLE.ueberstand - SCHWELLE.hoehe / 2,
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
        schiebeTeil(platte(mGlas, flB, hoehe, achse, lage, yUnten + hoehe / 2,
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
      var a = Z.plankenAnteil || 0;
      if (!a) return { von: 0, anzahl: n, lage: 'voll' };
      var bleibt = Math.max(1, n - Math.round(Math.abs(a) / 100 * n));
      return a < 0 ? { von: 0, anzahl: bleibt, lage: 'unten' }
                   : { von: n - bleibt, anzahl: bleibt, lage: 'oben' };
    }

    function planken(laenge, hoehe, achse, mitte, yUnten, quer, teilbar) {
      if (laenge <= 0 || hoehe < PLANKE.hoehe) return;
      var t = plankenTeilung(hoehe);
      var schritt = PLANKE.hoehe + t.fuge;
      var a = teilbar === false ? { von: 0, anzahl: t.anzahl, lage: 'voll' }
                                : plankenAnteil(t.anzahl);
      var hoch = a.anzahl * schritt - t.fuge;
      PLANKEN_IST = { anzahl: a.anzahl, gesamt: t.anzahl,
                      fuge: Math.round(t.fuge * 100) / 10,
                      hoehe: Math.round(hoch * 10), lage: a.lage };
      for (var i = 0; i < a.anzahl; i++) {
        platte(mPlankeWand, laenge, PLANKE.hoehe, achse, mitte,
               yUnten + PLANKE.hoehe / 2 + (a.von + i) * schritt, quer, 0, PLANKE.dicke);
      }
      /* Die Winkel stehen nur dort, wo auch Planken hängen – sie tragen
         sie ja. Ein Winkel über der letzten Planke hätte nichts zu halten. */
      plankenWinkel(laenge, hoch, achse, mitte, yUnten + a.von * schritt, quer);
    }

    /* Der Winkel läuft senkrecht am Pfosten hoch; die Planken werden an
       ihn geschraubt. Welcher Schenkel am Pfosten liegt, geht aus der
       Zeichnung nicht hervor – hier liegt der lange (40 mm) am Pfosten in
       der Wandebene, der kurze (20 mm) zeigt nach innen hinter die
       Planken. ANNAHME, gegenzulesen. */
    function plankenWinkel(laenge, hoehe, achse, mitte, yUnten, quer) {
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
    function velaris(laenge, hoehe, achse, mitte, yUnten, quer) {
      var LAM = 16, FUGE = 1.5;
      var n = Math.max(2, Math.floor(laenge / (LAM + FUGE)));
      var winkel = (Z.lamellen || 35) * Math.PI / 180;
      for (var i = 0; i < n; i++) {
        var d = -laenge / 2 + (i + 0.5) * (laenge / n);
        var lam = new THREE.Mesh(new THREE.BoxGeometry(LAM, hoehe, 2.4), blech());
        if (quer) {
          lam.position.set(achse, yUnten + hoehe / 2, mitte + d);
          lam.rotation.y = Math.PI / 2 + winkel;
        } else {
          lam.position.set(mitte + d, yUnten + hoehe / 2, achse);
          lam.rotation.y = winkel;
        }
        lam.castShadow = true;
        bau.add(lam);
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
      var okOben = hVorn - PROFIL / 2;
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

      /* Rahmenwand unten, Schiebetür darüber – so steht es als Hinweis im
         Anfrage-Assistenten, und so wird es montiert. */
      if (hatRahmen && hatSchiebe) {
        var unten = hoch * 0.38;
        platte(mPlanke, laenge, unten, achse, mitte, yUnten + unten / 2, quer, 0, 5);
        rahmenKante(laenge, achse, mitte, yUnten + unten, quer, 0);
        schiebetuer(laenge, hoch - unten, achse, mitte, yUnten + unten, quer, seite, richtung);
      } else if (hatSchiebe) {
        schiebetuer(laenge, hoch, achse, mitte, yUnten, quer, seite, richtung);
      } else if (hatRahmen) {
        platte(mPlanke, laenge, hoch, achse, mitte, yUnten + hoch / 2, quer, 0, 5);
        rahmenKante(laenge, achse, mitte, yUnten + 2.5, quer, 0);
        rahmenKante(laenge, achse, mitte, yUnten + hoch - 2.5, quer, 0);
      } else if (hatPlanken) {
        planken(laenge, hoch, achse, mitte, yUnten, quer);
      }
      // Plankenwand zusätzlich zu Rahmen/Schiebe: als unteres Drittel davor
      if (hatPlanken && (hatRahmen || hatSchiebe)) {
        planken(laenge, hoch * 0.34, achse, mitte, yUnten, quer, false);
      }

      /* Bodenschiene und Wandanschluss gehören zu jedem geschlossenen
         Element – ohne sie steht die Scheibe frei in der Luft bzw. frei
         vor der Mauer. Eine Senkrechtmarkise bekommt beides NICHT: sie
         läuft in eigenen Führungsschienen und hat unten eine Fallstange. */
      /* Dem Bedienfeld melden, womit hier wirklich gerechnet wurde. */
      if (hatSchiebe) SG23_LAENGE[seite] = Math.round(laenge * 10);

      if (hatRahmen || hatSchiebe || hatPlanken) {
        if (hatSchiebe) {
          tuerschwelle(laenge, achse, mitte, quer, gl);
          /* Die Führung sitzt DIREKT auf dem Flügel. Ein fester Platz
             oben am Dach wäre falsch, sobald ein Keil die Elementhöhe
             kürzt – dann hinge sie frei in der Luft. */
          schiebefuehrung(laenge, achse, mitte, quer, yUnten + hoch + fuehrungH, gl);
        } else {
          bodenschiene(laenge, achse, mitte, quer);
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
        var ukKas = okKas - ZIP.kassette;
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
          var tuchH = Math.max(1, hZ - ZIP.kassette);
          sonneTeil(platte(mStoff, laenge - ZIP.schieneB * 2, tuchH, achse, mitte,
                 ukKas - tuchH / 2, quer, aussen, 1.2));
          sonneTeil(platte(rahmen, laenge - ZIP.schieneB * 2, ZIP.fallstange, achse,
                 mitte, ukKas - tuchH + ZIP.fallstange / 2, quer, aussen, 3.2));
        }
      }
      if (liste.indexOf('Velaris') > -1) {
        velaris(laenge, hoch, achse + aussen * 1.6, mitte, yUnten, quer);
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
          var k = keilNetz(keilLaenge, hV, hH, 1.4, mGlas);
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
          var felderK = Math.max(1, Math.ceil(keilLaenge / KEIL_FELD_MAX));
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
         · Beide bis zur Rückseite des vorderen Pfostens: der Pfosten
           steht mittig unter der Rinne, seine Rückseite liegt damit
           38 mm VOR der Dachkante – dort ist kein Dach mehr, an das der
           Keil anschließen könnte, und die Schräge hing frei.

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
    } else if (m === 'Plissees' && aus > 0.02) {
      /* Plissee: gerafftes Tuch zwischen den Sparren, von Hand bedient.
         Gezeichnet als Falten – daran erkennt man es vom Glas. */
      var felder = Math.max(2, Math.round(B / SPARREN_ABSTAND));
      var lp = (T - PROFIL) * aus;
      var falten = Math.max(3, Math.round(lp / 24));
      for (var f = 0; f < felder; f++) {
        var xm = -B / 2 + (B / felder) * (f + 0.5);
        for (var q = 0; q < falten; q++) {
          var zq = PROFIL / 2 + (lp / falten) * (q + 0.5);
          var yq = hHinten - Math.tan(neig) * zq - 8;
          var fa = new THREE.Mesh(
            new THREE.BoxGeometry(B / felder - 8, 2.6, lp / falten - 1.2), mStoff);
          fa.position.set(xm, yq + (q % 2 ? 1.6 : 0), zq);
          fa.rotation.x = neig;
          fa.castShadow = true;        // fehlte, wie bei der Unterdachmarkise
          sonneTeil(fa);
          bau.add(fa);
        }
      }
    } else if (m === 'Sonnensegel' && aus > 0.02) {
      /* Sonnensegel: frei gespanntes Tuch, leicht durchhängend. Es gehört
         nicht zum Dach – deshalb sitzt es darüber und in anderer Farbe. */
      var mSegel = new THREE.MeshStandardMaterial({
        color: 0xc9bca4, roughness: 1, metalness: 0, side: THREE.DoubleSide
      });
      var ls = (T - PROFIL) * aus;
      var bahnen = 5;
      for (var i = 0; i < bahnen; i++) {
        var zi = PROFIL / 2 + (ls / bahnen) * (i + 0.5);
        var durchhang = Math.sin(Math.PI * (i + 0.5) / bahnen) * 6;
        var bahn = new THREE.Mesh(
          new THREE.BoxGeometry(B - PROFIL, 2, ls / bahnen - 0.8), mSegel);
        bahn.position.set(0, hHinten - Math.tan(neig) * zi + 16 - durchhang, zi);
        bahn.rotation.x = neig;
        bahn.castShadow = true;
        sonneTeil(bahn);
        bau.add(bahn);
      }
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
    var PF = 11;                                   // Pfosten 110 mm, BELEGT
    var neig = (sky ? 2 : neigungGrad()) * Math.PI / 180;
    var frei = Z.aufbau === 'Freistehend';
    var TR_H = 18.9, TR_T = 11.7;              // Statikträger, BELEGT (Maßtabelle)

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
    var riH = sky ? 22 : RINNE.hoehe;
    var riT = sky ? 9 : RINNE.breite;
    var spB = sky ? 7 : SPARREN.breite;
    var spH = sky ? 11 : SPARREN.hoehe;

    belag.scale.set(B + 180, 1, T + (frei ? 240 : 120));
    belag.position.set(0, -1, (T + 120) / 2 - 60);
    wand.visible = !frei;
    wand.scale.set(B + 420, hHinten + 190, 1);
    wand.position.set(0, (hHinten + 190) / 2, -12);

    /* Pfosten: zwei, bei breiten Anlagen drei. Die Verteilung über die
       BREITE ist GESCHÄTZT – die steht in der Herstellermatrix.

       Die Lage in der TIEFE: Der Pfosten steht MITTIG UNTER DER RINNE
       (Angabe des Betreibers, 10.10.2026) – also 93 mm hinter der
       Vorderkante, bei 186,3 mm Rinnenbreite. Vorher standen hier 55 mm
       aus der Montageanleitung S. 25 („bei 300 cm = 294,5 cm"); damit
       stand der Pfosten vorne an der Rinnenkante statt darunter. Die
       55 mm beziehen sich offenbar auf einen anderen Bezugspunkt als die
       Vorderkante der Rinne – GEGENZULESEN, siehe docs/NEXT_TASK.md. */
    /* Mit Vorsprung wandert der Pfosten um genau dieses Maß nach innen. */
    var zPf = (sky ? T - 5.5 : T - RINNE.breite / 2) - vorspr;

    /* Unterkante der Sparren an der Pfostenachse – nur mit Vorsprung
       gebraucht, dort endet der Pfosten unter dem Träger. ukVorn wird
       weiter unten noch einmal gebraucht und ist dieselbe Rechnung. */
    var ukVornJetzt = hRinne + (sky ? riH * 0.25 : riH - RINNE.sparrenUnterNase - spH);
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
    var zHinten = 4.5;                          // Wandprofil – frei wie an der Wand
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
    var ukHinten = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zHinten);
    var dachOk = ukHinten + spH;                // Sparrenoberkante hinten

    /* Mit hinterem Dachvorsprung wandern Pfosten UND Träger nach innen;
       das Wandprofil bleibt am Dachrand. Der Träger liegt dann unter den
       SPARREN statt hinter ihnen – dieselbe Lage wie vorne mit
       Vorsprung. Ohne Vorsprung bleibt alles wie bisher. */
    var zTrHinten = -TR_T / 2 + vorsprH;
    var ukAmTraeger = ukVornJetzt + Math.tan(neig) * (dachTiefeJetzt - zTrHinten);
    var wpH = sky ? 20 : 14, wpT = 9;
    var wpMitte = dachOk - wpH / 2;             // Oberkante bündig, nie darüber
    var trOk = vorsprH > 0 ? ukAmTraeger : dachOk;
    var hPfostenHinten = frei ? Math.max(100, trOk - TR_H) : hHinten;

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

    /* Rinne vorne. hRinne ist die Unterkante der Rinne. Ohne Statikträger
       ist das die Durchgangshöhe; mit Träger liegt sie um dessen Höhe
       darüber, weil er zwischen Pfosten und Rinne sitzt. */
    if (sky) {
      balken(B, riH, riT, 0, hRinne + riH / 2, T - riT / 2, mAlu);
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
    balken(B, wpH, wpT, 0, wpMitte, zHinten, mAlu);
    if (frei) {
      balken(B, TR_H, TR_T, 0, trOk - TR_H / 2, zTrHinten, mAlu);
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
    var laenge = dachTiefe / Math.cos(neig);
    var zMitte = dachTiefe / 2;
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
    var ukVorn = hRinne + (sky ? riH * 0.25 : riH - RINNE.sparrenUnterNase - spH);
    var ukMitte = ukVorn + Math.tan(neig) * (dachTiefe / 2);
    var mitteY = ukMitte + spH / 2;                // Mitte, für LED und Glas

    xs.forEach(function (x) {
      if (sky) {
        var sp = new THREE.Mesh(new THREE.BoxGeometry(spB, spH, laenge), mAlu);
        sp.position.set(x, mitteY, zMitte);
        sp.rotation.x = neig;
        sp.castShadow = true; sp.receiveShadow = true;
        bau.add(sp);
      } else {
        sparrenBauen(laenge, x, ukMitte, zMitte, neig, mAlu);
      }
    });

    /* Die Eindeckung liegt AUF dem schmalen Steg des Sparrens – bei TDS
       also 120 mm über dessen Unterkante. VSG 8 mm ist BELEGT
       (technische-daten.md); Polycarbonat ist mit 16 mm dicker. */
    /* Scheibendicke in cm. Polycarbonat ist die 16-mm-Stegplatte; Glas
       gibt es als VSG 8 und VSG 10 mm (Betreiber, 11.10.2026). */
    var glasDicke = istPolycarbonat() ? 1.6 : Z.glasstaerke / 10;
    var mF = dachfuellung();
    var yDach = ukMitte + spH + glasDicke / 2;

    /* Lage des Glasstoßes, in der Ebene der Scheibe gerechnet.
       zGlasMitte ist die Mitte der ungeteilten Scheibe; koppelLokal der
       Versatz des Stoßes davon aus, längs der Dachschräge. Positiv
       heißt: Richtung Rinne. */
    var zGlasMitte = zMitte + glasUeber / 2;
    var vollGlas = laenge - 2 + glasUeber;
    var koppelZ = dachTiefe - koppelAbstand() / 10;      // mm -> cm
    var koppelLokal = (koppelZ - zGlasMitte) / Math.cos(neig);
    var koppelVorn = vollGlas / 2 - koppelLokal - KOPPEL.breite / 2;
    var koppelHinten = vollGlas / 2 + koppelLokal - KOPPEL.breite / 2;
    for (i = 0; i < xs.length - 1; i++) {
      /* BELEGT (Montageanleitung S. 9): „Breite der Eindeckung = Abstand
         zwischen Träger + 40 mm" – die Scheibe liegt also beidseitig
         20 mm auf dem Sparren auf. Vorher war sie um den Steg schmaler
         und lag damit auf nichts. */
      var lichteWeite = (xs[i + 1] - xs[i]) - spB;
      var feldB = sky ? lichteWeite : lichteWeite + 4;
      if (feldB <= 0) continue;
      var xMitte = (xs[i] + xs[i + 1]) / 2;
      if (!glasGeteilt()) {
        var pl = new THREE.Mesh(new THREE.BoxGeometry(feldB, glasDicke, vollGlas), mF);
        pl.position.set(xMitte, yDach, zGlasMitte);
        pl.rotation.x = neig;
        pl.receiveShadow = true;
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
    if (!sky) {
      xs.forEach(function (x) {
        abdeckleiste(laenge - 2, x, ukMitte + spH + glasDicke, zMitte, neig, mAlu);
      });
    }

    /* SkyView ist das kubische System: hohe gerade Blende rundum, die
       Neigung liegt innen und ist von außen nicht zu sehen. */
    if (sky) {
      var mB = blech();
      balken(B + 3, 26, 4, 0, hVorn + riH + 7, T + 1, mB);
      [-B / 2 - 1.5, B / 2 + 1.5].forEach(function (x) {
        balken(4, 26, T, x, hVorn + riH + 7, T / 2, mB);
      });
    }

    /* Seitenelemente und Sonnenschutz sind Zubehör und hängen nicht am
       Dachsystem – deshalb auch freistehend. */
    /* Vorderes Ende der Seitenelemente: die HINTERE Pfostenfläche, nicht
       die Dachkante. Die Dachkante liegt 186 mm hinter der Rinnenvorder-
       kante, der Pfosten steht mittig unter der Rinne – dazwischen blieben
       38 mm Luft, und genau die war im Bild als Spalt zwischen Keil bzw.
       Senkrechtmarkise und Pfosten zu sehen. Vom Betreiber beanstandet:
       „die markise und keil haben lücke zum pfosten die müssen bündig
       sein". Jetzt stossen sie an den Pfosten.

       Über dem Stück zwischen Dachkante und Pfosten ist kein Dach mehr,
       sondern die Rinne – das Element haengt dort also nicht frei. */
    /* hRinne statt hVorn: Mit Statikträger liegt die Dachfläche um dessen
       Höhe höher – die Seitenelemente müssen bis dorthin reichen, sonst
       bliebe oben ein Spalt. */
    seitenErweiterungen(B, T, hRinne, PF, neig, function (z) {
      return ukMitte + Math.tan(neig) * (zMitte - z);
    }, zPf - PF / 2, xPfVorne);
    /* Die Markise bekommt die VOLLE Tiefe T, nicht dachTiefe. dachTiefe
       endet dort, wo die Sparren enden – an der Rückwand der Rinne. Mit
       diesem Maß hörten Schiene und Tuch rund 19 cm vor der Rinne auf und
       hingen in der Luft; vom Betreiber beanstandet. Die Zeichnung sagt
       „Bestellmaß Tiefe = Terrassendach Tiefe", die Markise läuft also
       über die ganze Dachtiefe bis an die Rinne. */
    sonnenschutz(B, T, hRinne, neig, PF, {
      tiefe: T,
      ok: function (z) {
        return ukMitte + spH + glasDicke + Math.tan(neig) * (zMitte - z);
      },
      /* Die Unterdachmarkise haengt an den SPARREN, nicht auf dem Glas –
         sie braucht deren Unterkante und deren Laenge. */
      sparrenL: laenge,
      uk: function (z) { return ukMitte + Math.tan(neig) * (zMitte - z); }
    });

    if (Z.led) {
      // in die Sparren (xs sind die Sparrenachsen), nicht in die Verglasung
      ledSpots(xs, [T * 0.3, T * 0.72], function (z) {
        return ukMitte + Math.tan(neig) * (T / 2 - z);
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
    /* Normalerweise endet die Kamera auf Augenhöhe des Modells – über
       90° stünde sie unter dem Ziel und das Bild auf dem Kopf. Für die
       Innenansicht ist genau das erwünscht: von unten nach oben schauen.
       Deshalb darf diese eine Ansicht die Grenze anheben. */
    kam.phi = Math.min(Math.max(kam.phi, 0.18),
                       kam.phiMax || (Math.PI / 2 - 0.04));
    var x = kam.radius * Math.sin(kam.phi) * Math.sin(kam.theta);
    var y = kam.radius * Math.cos(kam.phi);
    var z = kam.radius * Math.sin(kam.phi) * Math.cos(kam.theta);
    kamera3.position.set(kam.ziel.x + x, kam.ziel.y + y, kam.ziel.z + z);
    kamera3.lookAt(kam.ziel);
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
    kam.phiMax = Math.PI / 2 + 0.5;
    kam.theta = Math.PI;                   // nach vorne hinaus schauen
    kam.phi = phi;
    kam.radius = r;
    kam.radiusMin = r * 0.5;
    kam.radiusMax = r * 1.8;
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
  function plankenStandZeigen() {
    var e = document.getElementById('k3dPlankenStand');
    if (!e) return;
    if (!PLANKEN_IST.anzahl) { e.textContent = ''; return; }
    e.textContent = 'Gebaut: ' + PLANKEN_IST.anzahl +
      (PLANKEN_IST.lage === 'voll' ? '' : ' von ' + PLANKEN_IST.gesamt) +
      ' Planken, Fuge ' + String(PLANKEN_IST.fuge).replace('.', ',') + ' mm' +
      (PLANKEN_IST.lage === 'voll'
        ? '' : ', ' + PLANKEN_IST.hoehe + ' mm hoch ' +
               (PLANKEN_IST.lage === 'unten' ? 'ab Boden' : 'unter dem Dach')) + '.';
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
        ' – SG23, ' + b[0] + '-rails, ' + b[1] + '-türig, 10 mm ESG, Scheiben je ca. ' +
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

  function markiseGeklickt(e) {
    if (!gruppeGilt('sonne-aus')) return false;
    var r = leinwand.getBoundingClientRect();
    strahl.setFromCamera(new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1), kamera3);
    var treffer = strahl.intersectObjects(bau.children, true);
    for (var i = 0; i < treffer.length; i++) {
      if (istMarkise(treffer[i].object)) {
        sonneFahren(Z.sonneAus > 50 ? 0 : 100);
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
    if (weg < 6 && zeit < 500 && !markiseGeklickt(e)) schiebeGeklickt(e);
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
  function hoehenGetrennt() {
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
  function hoeheHintenKoppeln() {
    var el = document.getElementById('k3dHoeheHinten');
    var zf = document.getElementById('k3dHoeheHintenZahl');
    var frei = hoehenGetrennt() && Z.hoeheGetrennt;
    if (el) el.disabled = !frei;
    if (zf) zf.disabled = !frei;
    if (frei) return;
    Z.hoeheHinten = Z.hoehe + Math.round(Z.tiefe * neigungProzent(Z.neigung) / 100);
    if (el) el.value = Math.min(el.max, Math.max(el.min, Z.hoeheHinten));
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

  function neigungGrad() {
    if (!hoehenGetrennt() || !Z.hoeheGetrennt) return Z.neigung;
    var grad = Math.atan((Z.hoeheHinten - Z.hoehe) / Math.max(1, Z.tiefe))
               * 180 / Math.PI;
    return Math.min(14, Math.max(2, Math.round(grad * 10) / 10));
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
      case 'vorsprung-hinten': return hoehenGetrennt();
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
      // Maße sind immer frei – gebaut wird nach Kundenmaß. Das Raster ist
      // nur die Abrechnungsgrundlage und steht als Hinweis im Ergebnis.
      // Neigung nur bei TDS. SkyView und Flat Line sind Flachdächer und
      // haben laut Hersteller kein Neigungsfeld (BELEGT).
      /* Neigung eingeben: nur beim Terrassendach. Beim Carport ergibt
         sie sich aus den beiden Höhen. */
      /* Neigung eingeben, solange die hintere Höhe gekoppelt ist. Nur
         eines von beidem darf Eingabe sein, sonst verstellen sie sich
         gegenseitig. */
      case 'neigung':        return !!d && d.system === 'TDS' &&
                                    !(hoehenGetrennt() && Z.hoeheGetrennt);
      case 'hoehe-hinten':   return hoehenGetrennt();
      // Die Lage des Glasstoßes nur fragen, wenn es einen gibt
      case 'kopplung':       return glasGeteilt();
      default:               return true;
    }
  }

  function panelAnpassen() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-fuer]'), function (el) {
      var gilt = el.getAttribute('data-k3d-fuer').split(/\s+/).some(gruppeGilt);
      el.hidden = !gilt;
    });

    /* Farbfelder: welche Farben das System führt, steht in der Stückliste.
       Belegt ist, dass nur TDS Reinweiß 9010 führt – SkyView und Flat Line
       nicht. Ohne Herstellerdaten bleiben alle vier stehen. */
    var e = stueckliste();
    var erlaubt = (e && e.farben && e.farben.length)
      ? e.farben.map(function (f) { return f.name; })
      : (istPergola() ? FARBEN_PERGOLA : null);
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
    var ts = g.tiefen.filter(function (t) { return t <= M.regeln.tiefeMaxMitUnterzug; });
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
      teile.push('Farbe: ' + (Z.farbe === 'Reinweiß' ? 'Creme-Weiß' : Z.farbe));
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
          teile.push('Daraus Dachneigung: ' + neigungGrad() + '° (' +
            String(neigungProzent(neigungGrad())).replace('.', ',') + ' %)');
        }
        if (gruppeGilt('vorsprung-hinten') && Z.vorsprungHinten > 0) {
          teile.push('Dachvorsprung hinten: ' + Z.vorsprungHinten + ' mm');
        }
      } else if (Z.cpVariante === 'Carport mit Überstand') {
        teile.push('Dachüberstand: ' + Z.ueberstand + ' mm');
      }
      var ec = stueckliste();
      if (ec && !ec.fehler) {
        teile.push(ec.sparren + ' Sparren, ' + ec.pfosten + ' Pfosten in zwei Reihen');
        teile.push('Dach: ' + ec.eindeckung);
      } else {
        /* Beim Flachdach-Carport ist die Eindeckung immer Trapezblech;
           Solar und Begrünung kommen darauf. Vorher stand hier „Dach: Solar",
           was wie eine Alternative zum Blech klang. */
        teile.push(istCarportTds()
          ? 'Eindeckung: ' + eindeckungFach()
          : 'Eindeckung: Trapezblech' +
            (Z.cpDach === 'Trapezblech (Standard)' ? '' : ', darauf ' + Z.cpDach));
      }
      teile.push('Farbe: ' + Z.farbe);
    } else {
      teile.push(Z.aufbau);
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchgangshöhe ' + Z.hoehe + ' mm');
      var ed = stueckliste();
      if (ed && !ed.fehler) {
        teile.push(ed.sparren + ' Sparren, ' + ed.pfosten + ' Pfosten' +
                   (ed.statiktraeger ? ', mit Statikträger' : ''));
        if (ed.geneigt) {
          /* Die Höhe an der Wand gehört in die Anfrage, nicht nur ins
             Bild: Danach wird das Wandprofil angerissen, und sie ergibt
             sich erst aus Durchgangshöhe, Tiefe und Neigung zusammen. */
          teile.push('Dachneigung: ' + neigungGrad() + '° (' +
            String(neigungProzent(neigungGrad())).replace('.', ',') + ' %)');
          teile.push('Höhe an der Wand (UK Wandprofil): ' +
            (Z.hoehe + Math.round(Z.tiefe * neigungProzent(Z.neigung) / 100)) + ' mm');
        }
      }
      teile.push('Eindeckung: ' + eindeckungFach());
      teile.push('Farbe: ' + Z.farbe);
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
                       (PLANKEN_IST.lage === 'unten' ? 'ab Boden' : 'unter dem Dach') + ')'));
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
      if (gruppeGilt('traeger-wunsch') && Z.traegerWunsch) {
        teile.push('Statikträger 189 × 117 mm unter der Dachrinne auf Kundenwunsch ' +
          '(weniger Pfosten, Durchgangshöhe darunter ' + (Z.hoehe - 189) + ' mm)');
      }
      if (Z.markise !== 'Ohne') teile.push('Beschattung: ' + Z.markise);
      if (Z.stoff && gruppeGilt('stoff-dach')) teile.push('Markisenstoff: ' + stoffText(Z.stoff));
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
    box.innerHTML = zusammenfassung().map(function (t) {
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
    Z.plankenFarbe = wert('k3dPlankenFarbe') || Z.plankenFarbe;
    Z.lamellen = parseInt(wert('k3dLamellen'), 10);
    if (isNaN(Z.lamellen)) Z.lamellen = 35;

    if (produktWechsel) masseSetzen();
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
    Z.verkRichtung = wert('k3dVerkRichtung') || Z.verkRichtung;
    Z.boden = wert('k3dBoden') || Z.boden;
    Z.fassade = wert('k3dFassade') || Z.fassade;
    Z.untergrund = wert('k3dUntergrund') || Z.untergrund;
    vorsprungGrenzeSetzen();
    hoeheHintenKoppeln();
    koppelGrenzeSetzen();
    Z.vorsprung = zahl('k3dVorsprung', Z.vorsprung);
    Z.vorsprungHinten = zahl('k3dVorsprungHinten', Z.vorsprungHinten);
    Z.ledset = wert('k3dLedSet') || Z.ledset;
    Z.ledsetzahl = Math.min(20, Math.max(1, zahl('k3dLedAnzahl', Z.ledsetzahl)));
    Z.soundset = wert('k3dSoundSet') || Z.soundset;
    [['verkRueck', 'k3dVerkRueck'], ['verkLinks', 'k3dVerkLinks'],
     ['verkRechts', 'k3dVerkRechts'], ['masseZeigen', 'k3dMasse'],
     ['sound', 'k3dSound'], ['heizung', 'k3dHeizung'],
     ['wettersensor', 'k3dWetter'],
     ['traegerWunsch', 'k3dTraeger'],
     ['hoeheGetrennt', 'k3dHoeheGetrennt'],
     ['plankenAuto', 'k3dPlankenAuto']].forEach(function (pr) {
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
     ['k3dKoppel', 'koppelLage']].forEach(function (paar) {
      var a = document.getElementById(paar[0] + 'Wert');
      if (a) a.textContent = Z[paar[1]] + ' mm';
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
        var vsHin = gruppeGilt('vorsprung') ? Z.vorsprung : 0;
        var freiHin = Z.aufbau === 'Freistehend';
        /* Dieselbe Trennung wie im Modell: vorne nach dem Träger dort,
           hinten nur freistehend und dann immer nach der 7-m-Regel. */
        var wunsch = gruppeGilt('traeger-wunsch') && Z.traegerWunsch;
        var pfV = (unterzugGilt(tb) || vsHin > 0 || wunsch)
          ? pfostenUnterTraeger(Z.breite) : tb.pfosten;
        var pfH = pfostenUnterTraeger(Z.breite);
        var pf = (freiHin && pfH !== pfV)
          ? pfV + ' Pfosten vorne und ' + pfH + ' hinten'
          : pfV + ' Pfosten je Reihe';
        if (tb.breiteTabelle !== Z.breite) {
          saetze.push('Gerechnet wird mit der nächsten lieferbaren Breite: <b>' +
            tb.breiteTabelle + ' mm</b> – daraus folgen ' + tb.sparren +
            ' Sparren und ' + pf + '.');
        } else {
          saetze.push('<b>' + tb.sparren + ' Sparren</b> und <b>' + pf +
            '</b> bei diesem Maß.');
        }
        var vs = vsHin;
        if (unterzugGilt(tb) || vs > 0 || wunsch) {
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
            (M.regeln.tiefeMaxMitUnterzug / 1000).toFixed(1).replace('.', ',') +
            ' m – <b>so nicht lieferbar</b>. Sprechen Sie uns an, wir finden eine Lösung.');
          warnung = true;
        }
      }
      mh.innerHTML = saetze.join(' ');
      mh.classList.toggle('ist-warnung', warnung);
    }

    var nz = document.getElementById('k3dNeigungZahl');
    if (nz && document.activeElement !== nz) nz.value = Z.neigung;
    var prozent = neigungProzent(neigungGrad());
    /* Beim Carport die Neigung ANZEIGEN, nicht abfragen – sie ist dort
       das Ergebnis der beiden Höhen. */
    var nh = document.getElementById('k3dNeigungHinten');
    if (nh) {
      nh.textContent = String(neigungGrad()).replace('.', ',') + '° (' +
        String(prozent).replace('.', ',') + ' %)';
    }
    var np = document.getElementById('k3dNeigungProzent');
    if (np) np.textContent = String(prozent).replace('.', ',');
    var anstieg = Math.round(Z.tiefe * prozent / 100);
    var wh = document.getElementById('k3dWandHoehe');
    if (wh) wh.textContent = Z.hoehe + anstieg;
    var whi = document.getElementById('k3dWandHoeheInfo');
    if (whi) {
      whi.textContent = Z.hoehe + ' mm Durchgang + ' + anstieg + ' mm Anstieg auf '
        + (Z.tiefe / 1000).toFixed(2).replace('.', ',') + ' m Tiefe.';
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
      aw.textContent = !Z.plankenAnteil ? 'volle Höhe'
                     : (Z.plankenAnteil < 0 ? 'von unten' : 'von oben');
    }
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
      z.push(['Abrechnung nach', e.raster.breite + ' × ' + e.raster.tiefe +
              ' mm (nächstes Rasterfeld)']);
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
      // Der Rasterhinweis steht schon als eigene Zeile darüber – nicht doppelt
      hinBox.innerHTML = e.hinweise.filter(function (h) { return h.art !== 'raster'; }).map(function (h) {
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
    text('k3dSpec', Z.breite + ' × ' + Z.tiefe + ' mm · ' +
         qm.toFixed(2).replace('.', ',') + ' m² überdachte Fläche');
  }

  /* Überschrift und Hinweistext folgen dem Produkt – sonst stünde über
     einem Carport weiterhin „Terrassendach TDS“. */
  function titelAnpassen() {
    var t = document.getElementById('k3dTitel');
    if (t) t.textContent = produktName();
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
   'k3dPlankenFarbe', 'k3dPlankenFuge', 'k3dPlankenAuto',
   'k3dPlankenAnteil'].forEach(function (id) {
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
  [['k3dLamZu', 'k3dLamellen', 0], ['k3dLamAuf', 'k3dLamellen', 85],
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
         105 oder 125 mm. Welche der beiden Serien wir verkaufen, steht
         nirgends in unseren Unterlagen – hier ist Z-R gezeichnet,
         GEGENZULESEN. Umstellen ist eine Zeile: KASSETTE_RUND.
       · Ab 400 cm Markisenbreite kommt eine zusaetzliche
         Kastenunterstuetzung dazu (Seite 5).
       · Groesstmasse (Seite 26): Z-R105 max. 4000 mm breit, Z-R125
         max. 5000 mm. Breiter geht nur geteilt.
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
    maxBreite: 500      // cm, BELEGT: Z-R125 max. 5000 mm
  };
  var KASSETTE_RUND = true;   // Serie Z-R; false waere die eckige Z-E

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
       es bis 5000 mm Breite (Z-R125). Eine breitere Seite muss geteilt
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
      bauen();
      textAktualisieren();
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
      abendBtn.querySelector('span').textContent = Z.abend ? 'Tag' : 'Abend';
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

  var bildBtn = document.getElementById('k3dBild');
  if (bildBtn) {
    bildBtn.addEventListener('click', function () {
      renderer.render(szene, kamera3);   // sicherstellen, dass der Puffer gefüllt ist
      var a = document.createElement('a');
      a.href = renderer.domElement.toDataURL('image/png');
      a.download = produktName().replace(/[^A-Za-zÄÖÜäöüß0-9]+/g, '-').replace(/^-|-$/g, '') +
                   '-' + Z.breite + 'x' + Z.tiefe + 'mm.png';
      a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
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
        notiz: zusammenfassung().join(' · ')
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
