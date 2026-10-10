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
   darf aber nicht übersehen werden: „Was daraus folgt" bleibt so leer.

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
    farbe: 'Anthrazit',
    fassade: 'Rauputz',        // nur bei Wandmontage
    vorsprung: 300,            // Dachvorsprung, nur TDS
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
    glasOffen: 0,            // Schiebeelemente: 0 = geschlossen, 100 = ganz offen
    markise: 'Ohne',         // Beschattung am Dach, Werte wie im Assistenten
    sonneAus: 85,            // wie weit Markisen ausgefahren sind, in Prozent
    verkRueck: false, verkLinks: false, verkRechts: false,
    verkRichtung: 'waagerecht'
  };

  var FARBEN = {
    'Anthrazit':      0x383b3d,
    'Weißaluminium':  0xd3d4d2,
    'Graualuminium':  0x9a9c9b,
    'Reinweiß':       0xf1f1ec
  };

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
  renderer.outputEncoding = THREE.sRGBEncoding;
  // Ohne Tonwertkurve brennen helle Rahmen und Glasflaechen aus
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;

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
    wand: 0.25         // GESCHÄTZT
  };

  /* Querschnitt der Rinne in der XY-Ebene: x läuft nach vorne (vom Haus
     weg), y nach oben. Gezeichnet wird der volle Umriss, die Rinnenkehle
     ist als Aussparung darin ausgeführt. */
  function rinneQuerschnitt() {
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
    f.holes.push(kehle);
    return f;
  }

  /* Rinne über die volle Breite. laenge = Breite der Anlage in x,
     zVorne = Lage der Vorderkante in der Tiefe. */
  function rinneBauen(laenge, zVorne, yUnten, material) {
    var g = new THREE.ExtrudeGeometry(rinneQuerschnitt(),
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

     BELEGT ist, DASS sie da ist. Breite und Höhe stehen nicht in der
     Anleitung und sind GESCHÄTZT (50 × 12 mm, halbrund). */
  function abdeckleiste(laenge, x, y, z, neig, material) {
    var g = new THREE.CylinderGeometry(2.5, 2.5, laenge, 12, 1, false, 0, Math.PI);
    g.rotateZ(Math.PI / 2);          // Achse entlang z legen
    g.rotateY(Math.PI / 2);
    g.scale(1, 0.48, 1);             // flach gedrückt: 50 mm breit, 12 mm hoch
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
  function schild(text) {
    var c = document.createElement('canvas');
    var g = c.getContext('2d');
    var schrift = 'bold 40px Arial, Helvetica, sans-serif';
    g.font = schrift;
    var breit = Math.ceil(g.measureText(text).width) + 26;
    c.width = breit; c.height = 58;
    g = c.getContext('2d');
    g.font = schrift;
    g.fillStyle = 'rgba(17,17,17,.86)';
    g.fillRect(0, 0, breit, 58);
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    g.fillText(text, 13, 30);
    var t = new THREE.Texture(c);
    t.needsUpdate = true;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
    s.scale.set(breit / 58 * 24, 24, 1);
    return s;
  }

  function masslinie(a, b, text) {
    var linie = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a, b]),
      new THREE.LineBasicMaterial({ color: 0x1a1a1a })
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
    var B = Z.breite / 10, T = Z.tiefe / 10, H = Z.hoehe / 10;
    var vorn = T + 30;
    masslinie(new V(-B / 2, 2, vorn), new V(B / 2, 2, vorn), Z.breite + ' mm');
    var seite = B / 2 + 30;
    masslinie(new V(seite, 2, 0), new V(seite, 2, T), Z.tiefe + ' mm');
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
    else if (istCarport()) bauenGeschaetzt();
    else bauenTerrasseGeschaetzt();
    stimmung();
    masseZeichnen();
    kameraAnpassen();
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
    var B = Z.breite / 10, T = Z.tiefe / 10;                 // mm -> cm
    var pf = m.pfosten.breite / 10;                          // 110 mm, BELEGT
    var spB = g.sparren.breite / 10, spH = g.sparren.hoehe / 10;   // GESCHÄTZT
    var riH = g.rinne.hoehe / 10, riT = g.rinne.tiefe / 10;        // GESCHÄTZT
    var wpH = g.wandprofil.hoehe / 10, wpA = g.wandprofil.ausladung / 10;
    var stH = m.statiktraeger.hoehe / 10, stB = m.statiktraeger.breite / 10;

    // BELEGT (Montageanleitung S. 25): Pfostenachse 55 mm hinter der Vorderkante
    var zPfosten = T - e.pfostenachseVonVorderkante / 10;
    var neig = e.geneigt ? Z.neigung * Math.PI / 180 : 0;
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
    if (e.freistehend) {
      balken(B, stH, stB, 0, hHinten + stH / 2, stB / 2, mAlu);
    } else {
      balken(B, wpH, wpA, 0, hHinten + wpH / 2, wpA / 2, mAlu);
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

    /* Seitenelemente nur bei den Wandsystemen */
    if (!e.freistehend) seitenErweiterungen(B, T, hVorn, pf, neig);
    if (!istCarport()) sonnenschutz(B, T, hVorn, neig, pf);
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
  var FLUEGEL_BREITE = 150;   // cm, GESCHÄTZT

  function fluegelAnzahl(laenge) {
    return Math.max(2, Math.round(laenge / FLUEGEL_BREITE));
  }

  /* Ein Dreieck als Keil. Die Form wird in der XY-Ebene gebaut und dann in
     die Ebene der Seite gedreht – so braucht es nur eine Geometrie für
     Seiten und Stirnseite. */
  function keilNetz(laenge, hoehe, dicke, material) {
    var form = new THREE.Shape();
    form.moveTo(-laenge / 2, 0);
    form.lineTo(laenge / 2, 0);
    form.lineTo(-laenge / 2, hoehe);
    form.closePath();
    var g = new THREE.ExtrudeGeometry(form, { depth: dicke, bevelEnabled: false });
    g.translate(0, 0, -dicke / 2);
    return new THREE.Mesh(g, material);
  }

  function seitenErweiterungen(B, T, hVorn, PROFIL, neig) {
    var mGlas = seitenglas();
    var rahmen = alu();
    var offen = Z.glasOffen / 100;
    var mPlanke = blech();
    var mStoff = new THREE.MeshStandardMaterial({
      color: 0x4a4f52, roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });

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

    function rahmenKante(laenge, achse, mitte, y, quer, versatz) {
      platte(rahmen, laenge, 5, achse, mitte, y, quer, versatz, 5);
    }

    /* Schiebetür: einzelne Flügel, die sich übereinander schieben. Nur so
       zeigt der Regler „geöffnet" etwas Echtes – einer bleibt stehen. */
    function schiebetuer(laenge, hoehe, achse, mitte, yUnten, quer) {
      var n = fluegelAnzahl(laenge);
      var flB = laenge / n;
      var start = mitte - laenge / 2 + flB / 2;
      for (var i = 0; i < n; i++) {
        var lage = start + flB * i - offen * flB * i;
        var spur = (i % 2) * 2.4;                       // zwei Laufschienen
        platte(mGlas, flB, hoehe, achse, lage, yUnten + hoehe / 2, quer, spur);
        rahmenKante(flB, achse, lage, yUnten + 2.5, quer, spur);
        rahmenKante(flB, achse, lage, yUnten + hoehe - 2.5, quer, spur);
      }
    }

    /* Plankenwand: waagerechte Alu-Planken mit Fuge. 140 mm Paneelhöhe wie
       bei den Sichtschutzpaneelen auf unserer Produktseite. */
    function planken(laenge, hoehe, achse, mitte, yUnten, quer) {
      var PAN = 14, FUGE = 1.2;
      var n = Math.max(1, Math.floor(hoehe / (PAN + FUGE)));
      for (var i = 0; i < n; i++) {
        platte(mPlanke, laenge, PAN, achse, mitte, yUnten + (i + 0.5) * (PAN + FUGE),
               quer, 0, 4);
      }
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

    function eineSeite(seite, achse, mitte, laenge, quer) {
      var liste = erwListe(seite);
      if (!liste.length) return;
      var hoch = hVorn - PROFIL;
      var yUnten = PROFIL / 2;
      var hatRahmen = liste.indexOf('Rahmenwand') > -1;
      var hatSchiebe = liste.indexOf('Schiebetür') > -1;
      var hatPlanken = liste.indexOf('Plankenwand') > -1;

      /* Rahmenwand unten, Schiebetür darüber – so steht es als Hinweis im
         Anfrage-Assistenten, und so wird es montiert. */
      if (hatRahmen && hatSchiebe) {
        var unten = hoch * 0.38;
        platte(mPlanke, laenge, unten, achse, mitte, yUnten + unten / 2, quer, 0, 5);
        rahmenKante(laenge, achse, mitte, yUnten + unten, quer, 0);
        schiebetuer(laenge, hoch - unten, achse, mitte, yUnten + unten, quer);
      } else if (hatSchiebe) {
        schiebetuer(laenge, hoch, achse, mitte, yUnten, quer);
      } else if (hatRahmen) {
        platte(mPlanke, laenge, hoch, achse, mitte, yUnten + hoch / 2, quer, 0, 5);
        rahmenKante(laenge, achse, mitte, yUnten + 2.5, quer, 0);
        rahmenKante(laenge, achse, mitte, yUnten + hoch - 2.5, quer, 0);
      } else if (hatPlanken) {
        planken(laenge, hoch, achse, mitte, yUnten, quer);
      }
      // Plankenwand zusätzlich zu Rahmen/Schiebe: als unteres Drittel davor
      if (hatPlanken && (hatRahmen || hatSchiebe)) {
        planken(laenge, hoch * 0.34, achse, mitte, yUnten, quer);
      }

      // Zubehör VOR der Fläche
      var aussen = (seite === 'links' ? -1 : 1) * 4;
      if (seite === 'vorne') aussen = 4;
      if (liste.indexOf('Senkrechtmarkise') > -1) {
        var h = hoch * (Z.sonneAus / 100);
        if (h > 5) {
          platte(mStoff, laenge, h, achse, mitte, yUnten + hoch - h / 2, quer, aussen, 1.2);
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
      if (liste.indexOf('Keil') > -1 && keilErlaubt() && seite !== 'vorne' && neig > 0.001) {
        var hoeheKeil = Math.tan(neig) * laenge;
        var k = keilNetz(laenge, hoeheKeil, 1.4, mGlas);
        k.position.set(quer ? achse : mitte, yUnten + hoch, quer ? mitte : achse);
        if (quer) k.rotation.y = Math.PI / 2 * (seite === 'links' ? 1 : -1);
        k.castShadow = true;
        bau.add(k);
      }
    }

    eineSeite('links',  -B / 2 + PROFIL / 2, T / 2, T - PROFIL * 2, true);
    eineSeite('rechts',  B / 2 - PROFIL / 2, T / 2, T - PROFIL * 2, true);
    eineSeite('vorne',   T - PROFIL,         0,     B - PROFIL * 2, false);
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
  function sonnenschutz(B, T, hVorn, neig, PROFIL) {
    var aus = Z.sonneAus / 100;
    var mStoff = new THREE.MeshStandardMaterial({
      color: 0xd9d3c5, roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });
    var hHinten = hVorn + Math.tan(neig) * T;
    var m = Z.markise;

    /* Aufdach liegt auf der Eindeckung, Unterdach darunter – im Modell ist
       das der Unterschied. Plissees laufen zwischen den Sparren, das
       Sonnensegel spannt frei darüber. „Noch unsicher" zeichnet nichts;
       die Angabe geht trotzdem in die Anfrage. */
    if ((m === 'Aufdachmarkise' || m === 'Unterdachmarkise') && aus > 0.02) {
      var oben = m === 'Aufdachmarkise';
      var laenge = (T - PROFIL) * aus;
      var zm = PROFIL / 2 + laenge / 2;
      var y = hHinten - Math.tan(neig) * zm + (oben ? 8 : -7);
      var tuch = new THREE.Mesh(
        new THREE.BoxGeometry(B - PROFIL * 2, 2.2, laenge), mStoff);
      tuch.position.set(0, y, zm);
      tuch.rotation.x = neig;
      tuch.castShadow = oben;
      tuch.receiveShadow = true;
      bau.add(tuch);
      balken(B - PROFIL * 2, 13, 13, 0,
             hHinten + (oben ? 14 : -14), PROFIL + 5, alu());
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
    if (Z.verkRueck)  flaeche(B - PROFIL,  0,              PROFIL / 2, false);
    if (Z.verkLinks)  flaeche(T - PROFIL, -B / 2 + 2,      T / 2,      true);
    if (Z.verkRechts) flaeche(T - PROFIL,  B / 2 - 2,      T / 2,      true);
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
    var neig = (sky ? 2 : Z.neigung) * Math.PI / 180;
    var B = Z.breite / 10, T = Z.tiefe / 10;
    var hVorn = Z.hoehe / 10;
    var hHinten = hVorn + Math.tan(neig) * T;
    var frei = Z.aufbau === 'Freistehend';
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
       BREITE ist GESCHÄTZT – die steht in der Herstellermatrix. Die Lage in
       der TIEFE ist BELEGT (Montageanleitung S. 25): „Der Mittelpunkt des
       Alupfostens wird entsprechend der Dachtiefe platziert, zum Beispiel
       bei 300 cm = 294,5 cm (-5,5 cm)" – also 55 mm hinter der Vorderkante. */
    var zPf = T - 5.5;
    verteilen(B > 500 ? 3 : 2, B, PF / 2).forEach(function (x) {
      balken(PF, hVorn, PF, x, hVorn / 2, zPf, mAlu);
      if (frei) balken(PF, hHinten, PF, x, hHinten / 2, PF / 2, mAlu);
    });

    /* Rinne vorne. hVorn ist die Durchgangshöhe, also die UNTERKANTE der
       Rinne – so wird aufgemessen und so steht es auch im Datenpfad. */
    if (sky) {
      balken(B, riH, riT, 0, hVorn + riH / 2, T - riT / 2, mAlu);
    } else {
      rinneBauen(B, T, hVorn, mAlu);
    }
    balken(B, sky ? 20 : 14, frei ? 12 : 9, 0,
           hHinten + (sky ? 10 : 7), frei ? 6 : 4.5, mAlu);              // Wandprofil/Träger

    /* Sparrenraster BELEGT (Montageanleitung S. 33): „Dachbreite minus
       60 mm, geteilt durch die Anzahl der Felder" ergibt den Abstand von
       Sparrenmitte zu Sparrenmitte. Die äußeren Sparrenachsen liegen damit
       30 mm vom Rand – bisher stand hier die Annahme „Randsparren außen
       bündig". Die ANZAHL der Felder bleibt geschätzt; sie steht in der
       Herstellermatrix. */
    var felder = Math.max(2, Math.round(B / SPARREN_ABSTAND));
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
    var glasUeber = sky ? 0 : 6;        // GESCHÄTZT: bis in die Kehle

    /* Der Sparren liegt in der Rinne: seine Oberkante schließt vorne mit
       der Rinnenoberkante ab, damit das Wasser von der Eindeckung in die
       Rinnenkehle läuft. Daraus folgt die Unterkante vorne – und mit dem
       Gefälle die Unterkante in der Mitte. */
    /* Der Sparren endet auf der HINTEREN Wange der Rinne, die tiefer
       liegt als die Vorderkante – sonst entwässert das Dach nach außen
       über die Nase statt in die Kehle. */
    var ukVorn = hVorn + (sky ? riH * 0.25 : riH - RINNE.wangeAb - spH);
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
    var glasDicke = istPolycarbonat() ? 1.6 : 0.8;
    var mF = dachfuellung();
    var yDach = ukMitte + spH + glasDicke / 2;
    for (i = 0; i < xs.length - 1; i++) {
      /* BELEGT (Montageanleitung S. 9): „Breite der Eindeckung = Abstand
         zwischen Träger + 40 mm" – die Scheibe liegt also beidseitig
         20 mm auf dem Sparren auf. Vorher war sie um den Steg schmaler
         und lag damit auf nichts. */
      var lichteWeite = (xs[i + 1] - xs[i]) - spB;
      var feldB = sky ? lichteWeite : lichteWeite + 4;
      if (feldB <= 0) continue;
      var pl = new THREE.Mesh(
        new THREE.BoxGeometry(feldB, glasDicke, laenge - 2 + glasUeber), mF);
      pl.position.set((xs[i] + xs[i + 1]) / 2, yDach, zMitte + glasUeber / 2);
      pl.rotation.x = neig;
      pl.receiveShadow = true;
      bau.add(pl);
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
    seitenErweiterungen(B, T, hVorn, PF, neig);
    sonnenschutz(B, T, hVorn, neig, PF);

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
        color: 0x4a4f52, roughness: 0.95, side: THREE.DoubleSide
      });
      [-B / 2 + RAHMEN_B, B / 2 - RAHMEN_B].forEach(function (x) {
        var zip = new THREE.Mesh(new THREE.BoxGeometry(T - RAHMEN_B * 2, h - 4, 1.2), mZip);
        zip.position.set(x, (h - 4) / 2 + 2, T / 2);
        zip.rotation.y = Math.PI / 2;
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

    /* Hauswand nach der Fassadenart */
    if (wand.visible) {
      var wt = wandTextur(Z.fassade);
      wand.material.map = wt;
      if (wt) {
        wt.repeat.set(Math.max(1, Math.round(wand.scale.x / 110)),
                      Math.max(1, Math.round(wand.scale.y / 55)));
        wand.material.color.setHex(Z.abend ? 0x9a938c : 0xffffff);
      }
      wand.material.needsUpdate = true;
    }

    /* Bodenbelag. Vor dem Carport liegt eine Zufahrt, kein Terrassenbelag –
       dort bleibt die graue Fläche ohne Muster stehen. */
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
    kam.ziel.set(0, Z.hoehe / 10 * 0.48, Z.tiefe / 10 * 0.42);
    kameraSetzen();
  }

  function kameraSetzen() {
    kam.phi = Math.min(Math.max(kam.phi, 0.18), Math.PI / 2 - 0.04);
    var x = kam.radius * Math.sin(kam.phi) * Math.sin(kam.theta);
    var y = kam.radius * Math.cos(kam.phi);
    var z = kam.radius * Math.sin(kam.phi) * Math.cos(kam.theta);
    kamera3.position.set(kam.ziel.x + x, kam.ziel.y + y, kam.ziel.z + z);
    kamera3.lookAt(kam.ziel);
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
    'Darunter':    { theta: 0.0, phi: 1.5, nah: 0.58, unterDach: true }
  };

  /* ---------- Bedienung ---------- */
  var zieht = false, letzteX = 0, letzteY = 0, letzterAbstand = 0;

  function abstand(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  leinwand.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    zieht = true; autoDreht = false;
    letzteX = e.clientX; letzteY = e.clientY;
    if (leinwand.setPointerCapture) { try { leinwand.setPointerCapture(e.pointerId); } catch (x) {} }
  });

  window.addEventListener('pointermove', function (e) {
    if (!zieht) return;
    kam.theta -= (e.clientX - letzteX) * 0.007;
    kam.phi   -= (e.clientY - letzteY) * 0.007;
    letzteX = e.clientX; letzteY = e.clientY;
    kameraSetzen();
  });

  window.addEventListener('pointerup', function () { zieht = false; });
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
  }
  window.addEventListener('resize', groesseAnpassen);

  /* ---------- Schleife ---------- */
  function zeichnen() {
    if (autoDreht) { kam.theta += 0.0035; kameraSetzen(); }
    renderer.render(szene, kamera3);
    requestAnimationFrame(zeichnen);
  }

  /* ---------- Oberfläche ---------- */
  function wert(id) { var e = document.getElementById(id); return e ? e.value : null; }
  function zahl(id, ersatz) {
    var v = parseInt(wert(id), 10);
    return isNaN(v) ? ersatz : v;
  }
  function istCarport() { return Z.produkt === 'Carport'; }
  function istCarportTds() { return istCarport() && Z.cpTyp === 'Carport TDS'; }
  function istPergola() { return Z.produkt === 'Pergola / Lamellendach'; }
  function istLamellen() { return istPergola() && Z.pgDachart === 'Lamellendach'; }

  /* Welche Bedienfelder gelten für das gewählte Produkt? Die Gruppen im
     HTML tragen dazu data-k3d-fuer mit einem oder mehreren Stichworten. */
  function gruppeGilt(stichwort) {
    var d = datenSystem();
    switch (stichwort) {
      case 'terrasse':       return !istCarport() && !istPergola();
      case 'carport':        return istCarport();
      case 'pergola':        return istPergola();
      case 'pg-lamellen':    return istLamellen();
      // Aufbau (Wand oder freistehend) gibt es überall außer beim Carport,
      // dort steckt die Montageart in der Ausführung
      case 'aufbau':         return !istCarport();
      case 'glas':           return (!istCarport() && !istPergola()) || istCarportTds();
      case 'cp-flachdach':   return istCarport() && !istCarportTds() &&
                                    Z.cpTyp !== 'Flachdach Flat Line';
      case 'cp-ueberstand':  return istCarport() && Z.cpVariante === 'Carport mit Überstand';
      // Der Regler „geöffnet" erscheint nur, wenn es etwas zu schieben gibt
      case 'schiebe':        return erwIrgendwo('Schiebetür') ||
                                    (istPergola() && Z.pgSeitenschutz === 'Glas-Schiebeelemente');
      case 'sonne-aus':      return Z.markise !== 'Ohne' || erwIrgendwo('Senkrechtmarkise');
      // Fassadenart interessiert nur, wenn an eine Wand montiert wird
      case 'fassade':        return istCarport()
                                    ? Z.cpVariante === 'Carport mit Wandmontage'
                                    : Z.aufbau === 'Wandmontage';
      // Dachvorsprung gibt es nur beim TDS (so auch im Anfrage-Assistenten)
      case 'vorsprung':      return Z.produkt === 'Terrassendach TDS';
      case 'led-detail':     return Z.led;
      // Lautsprecher bietet VD beim Carport nicht an
      case 'sound':          return !istCarport();
      case 'sound-detail':   return !istCarport() && Z.sound;
      // Heizstrahler und Wetter-Automatik stehen im Assistenten im Schritt
      // „Komfort & Technik" – dort nur beim Lamellendach
      case 'komfort':        return istPergola();
      // Flat Box ist in manchen Ausführungen schon verkleidet – dann würden
      // Paneele und Blechwand übereinander liegen
      case 'verkleidung':    return istCarport() && Z.cpVariante.indexOf('verkleidet') === -1;
      case 'verk-richtung':  return Z.verkRueck || Z.verkLinks || Z.verkRechts;
      // Maße sind immer frei – gebaut wird nach Kundenmaß. Das Raster ist
      // nur die Abrechnungsgrundlage und steht als Hinweis im Ergebnis.
      case 'geschaetzt':     return !d;
      // Neigung nur bei TDS. SkyView und Flat Line sind Flachdächer und
      // haben laut Hersteller kein Neigungsfeld (BELEGT).
      case 'neigung':        return !!d && d.system === 'TDS';
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
    var m = MASSE[Z.produkt] || MASSE['Terrassendach TDS'];
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
  function reglerGrenzenSetzen() {
    var d = datenSystem();
    if (!d) return;
    var listen = RASTER[d.system + '|' + d.material];
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
      teile.push('Ausführung: ' + Z.cpVariante);
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchfahrtshöhe ' + Z.hoehe + ' mm');
      if (Z.cpVariante === 'Carport mit Überstand') teile.push('Dachüberstand: ' + Z.ueberstand + ' mm');
      var ec = stueckliste();
      if (ec && !ec.fehler) {
        teile.push(ec.sparren + ' Sparren, ' + ec.pfosten + ' Pfosten in zwei Reihen');
        teile.push('Dach: ' + ec.eindeckung);
      } else {
        /* Beim Flachdach-Carport ist die Eindeckung immer Trapezblech;
           Solar und Begrünung kommen darauf. Vorher stand hier „Dach: Solar",
           was wie eine Alternative zum Blech klang. */
        teile.push(istCarportTds()
          ? 'Eindeckung: ' + Z.eindeckung
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
        if (ed.geneigt) teile.push('Dachneigung: ' + Z.neigung + '°');
      }
      teile.push('Eindeckung: ' + Z.eindeckung);
      teile.push('Farbe: ' + Z.farbe);
      var seiten = [];
      if (Z.erwLinks.length) seiten.push('links: ' + Z.erwLinks.join(' + '));
      if (Z.erwRechts.length) seiten.push('rechts: ' + Z.erwRechts.join(' + '));
      if (Z.erwVorne.length) seiten.push('vorne: ' + Z.erwVorne.join(' + '));
      teile.push(seiten.length ? 'Erweiterungen – ' + seiten.join(' · ') : 'Seiten: offen');
      if (erwIrgendwo('Schiebetür') && Z.glasOffen > 0) {
        teile.push('Schiebetür im Bild ' + Z.glasOffen + ' % geöffnet');
      }
      if (Z.markise !== 'Ohne') teile.push('Beschattung: ' + Z.markise);
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
    var systemSchl = dJetzt ? dJetzt.system + '|' + dJetzt.material : 'geschaetzt';
    if (systemSchl !== letztesSystem) {
      if (dJetzt) reglerGrenzenSetzen();
      letztesSystem = systemSchl;
    }
    Z.breite = parseInt(wert('k3dBreite'), 10) || Z.breite;
    Z.tiefe = parseInt(wert('k3dTiefe'), 10) || Z.tiefe;
    Z.hoehe = parseInt(wert('k3dHoehe'), 10) || Z.hoehe;
    Z.neigung = parseInt(wert('k3dNeigung'), 10) || Z.neigung;
    Z.ueberstand = parseInt(wert('k3dUeberstand'), 10) || Z.ueberstand;
    Z.eindeckung = wert('k3dEindeckung') || Z.eindeckung;
    var ledEl = document.getElementById('k3dLed');
    Z.led = ledEl ? ledEl.checked : Z.led;
    Z.montage = wert('k3dMontage') || Z.montage;

    Z.glasOffen = zahl('k3dGlasOffen', Z.glasOffen);
    Z.markise = wert('k3dMarkise') || Z.markise;
    Z.sonneAus = zahl('k3dSonneAus', Z.sonneAus);
    Z.verkRichtung = wert('k3dVerkRichtung') || Z.verkRichtung;
    Z.boden = wert('k3dBoden') || Z.boden;
    Z.fassade = wert('k3dFassade') || Z.fassade;
    Z.untergrund = wert('k3dUntergrund') || Z.untergrund;
    Z.vorsprung = zahl('k3dVorsprung', Z.vorsprung);
    Z.ledset = wert('k3dLedSet') || Z.ledset;
    Z.ledsetzahl = Math.min(20, Math.max(1, zahl('k3dLedAnzahl', Z.ledsetzahl)));
    Z.soundset = wert('k3dSoundSet') || Z.soundset;
    [['verkRueck', 'k3dVerkRueck'], ['verkLinks', 'k3dVerkLinks'],
     ['verkRechts', 'k3dVerkRechts'], ['masseZeigen', 'k3dMasse'],
     ['sound', 'k3dSound'], ['heizung', 'k3dHeizung'],
     ['wettersensor', 'k3dWetter']].forEach(function (pr) {
      var el = document.getElementById(pr[1]);
      if (el) Z[pr[0]] = el.checked;
    });

    [['k3dBreite', 'breite'], ['k3dTiefe', 'tiefe'], ['k3dHoehe', 'hoehe'],
     ['k3dUeberstand', 'ueberstand']].forEach(function (paar) {
      var a = document.getElementById(paar[0] + 'Wert');
      if (a) a.textContent = Z[paar[1]] + ' mm';
      /* Das Zahlenfeld wird nachgeführt – aber nicht, während jemand darin
         tippt. Sonst springt die Zahl unter dem Finger weg. */
      var zf = document.getElementById(paar[0] + 'Zahl');
      if (zf && document.activeElement !== zf) zf.value = Z[paar[1]];
    });
    var nw = document.getElementById('k3dNeigungWert');
    if (nw) nw.textContent = Z.neigung + '°';
    var lw = document.getElementById('k3dLamellenWert');
    if (lw) lw.textContent = Z.lamellen + '° geöffnet';
    var gw = document.getElementById('k3dGlasOffenWert');
    if (gw) gw.textContent = Z.glasOffen + ' %';
    var sw = document.getElementById('k3dSonneAusWert');
    if (sw) sw.textContent = Z.sonneAus + ' %';

    panelAnpassen();
    erwAnzeigen();
    titelAnpassen();
    summenSetzen();
    /* Sofort zeichnen – mit den Stückzahlen, die gerade vorliegen. Beim
       Ziehen am Regler ändert sich das Maß stetig, die Sparrenzahl aber nur
       an den Rasterkanten. Die genaue Antwort kommt gebremst nach, sonst
       feuert jeder Pixel eine Abfrage. */
    bauen();
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
    var e = stueckliste();
    if (!e || e.fehler) {
      box.innerHTML = '<li>Für dieses Produkt liegen uns noch keine ' +
        'Herstellerzahlen vor. Die Darstellung ist eine Skizze.</li>';
      if (hinBox) hinBox.innerHTML = '';
      return;
    }
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
    if (e.innenkernSparren) {
      z.push(['Innenkern-Sparren', 'erforderlich' +
              (e.innenkernImPreis === false ? ', nicht im Preis enthalten' : '')]);
    }
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

  function eindeckungKurz() {
    if (Z.eindeckung === 'VSG klar') return 'Glas klar';
    if (Z.eindeckung === 'VSG opal') return 'Glas opal';
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

    var vk = [];
    if (Z.verkRueck) vk.push('hinten');
    if (Z.verkLinks) vk.push('links');
    if (Z.verkRechts) vk.push('rechts');
    text('k3dSumVerk', vk.length ? Z.verkRichtung + ': ' + vk.join(', ') : 'keine');

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
   'k3dHeizung', 'k3dWetter'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.addEventListener('input', aendern);
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
   ['k3dHoehe', 'k3dHoeheZahl'], ['k3dUeberstand', 'k3dUeberstandZahl']].forEach(function (pr) {
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
      var a = ANSICHTEN[b.getAttribute('data-k3d-ansicht')];
      if (!a) return;
      autoDreht = false;
      kam.theta = a.theta; kam.phi = a.phi;
      if (a.nah) kam.radius = Math.max(kam.radiusMin, (kam.passend || kam.radius) * a.nah);
      else if (kam.passend) kam.radius = kam.passend;
      kam.ziel.set(0, Z.hoehe / 10 * (a.unterDach ? 0.94 : 0.48), Z.tiefe / 10 * 0.42);
      kameraSetzen();
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
        v.carportvariante = Z.cpVariante;
        if (Z.cpVariante === 'Carport mit Überstand') v.ueberstand = String(Z.ueberstand);
        if (istCarportTds()) v.verglasung = VORGABE_VERGLASUNG[Z.eindeckung];
        else v.dach = Z.cpDach;
      } else {
        v.produkt = Z.produkt;
        v.aufbau = Z.aufbau === 'Wandmontage' ? 'Wandmontage' : 'Freistehend';
        v.verglasung = VORGABE_VERGLASUNG[Z.eindeckung];
        if (Z.markise !== 'Ohne') v.markise = Z.markise;
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
