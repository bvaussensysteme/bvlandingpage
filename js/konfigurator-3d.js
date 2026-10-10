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
    ueberstand: 1000,
    neigung: 8,            // Grad; BELEGT als Standard, nur bei TDS einstellbar
    aufbau: 'Wandmontage',
    breite: 5000,
    tiefe: 3000,
    hoehe: 2300,
    eindeckung: 'VSG klar',
    farbe: 'Anthrazit',
    links: 'offen',
    rechts: 'offen',
    front: 'offen',
    led: false,
    montage: 'Ja, mit Fachmontage',
    abend: false
  };

  var FARBEN = {
    'Anthrazit':      0x383b3d,
    'Weißaluminium':  0xd3d4d2,
    'Graualuminium':  0x9a9c9b,
    'Reinweiß':       0xf1f1ec
  };

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

  /* Übersetzung in die Auswahlwerte des Anfrage-Assistenten.
     Die Eindeckung heißt dort ausführlicher ("VSG-Glas Opal (milchig)").
     Vorher ging nur "VSG-Glas" hinüber – die Unterscheidung klar/opal
     ging damit auf dem Weg in die Anfrage verloren. */
  var VORGABE_VERGLASUNG = {
    'VSG klar':     'VSG-Glas klar',
    'VSG opal':     'VSG-Glas Opal (milchig)',
    'Polycarbonat': 'Polycarbonat klar'
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
    'Reinweiß':      'Reinweiß (RAL 9010)'
  };

  var SPARREN_ABSTAND = 110; // Richtwert, nur für die geschätzten Carports

  /* Welches Produkt steht in welcher Preisliste? Was hier null liefert, hat
     keine Herstellerdaten und wird geschätzt gebaut. Carport Flat Line läuft
     über die Flat-Line-Matrix – dort ist das System als freistehendes
     Flachdach mit Trapezblech geführt, unabhängig davon, dass der Betrieb es
     als Carport verkauft. */
  function datenSystem() {
    if (!RASTER) return null;        // ohne Serverantwort: geschätzte Skizze
    var mat = Z.eindeckung === 'Polycarbonat' ? 'Polycarbonat' : 'Glas';
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
  sonne.shadow.mapSize.set(1024, 1024);
  sonne.shadow.camera.left = -700; sonne.shadow.camera.right = 700;
  sonne.shadow.camera.top = 700;  sonne.shadow.camera.bottom = -700;
  sonne.shadow.camera.far = 2200;
  szene.add(sonne);
  var fuell = new THREE.DirectionalLight(0xdce8f2, 0.3);
  fuell.position.set(400, 300, -300);
  szene.add(fuell);

  /* Boden: angedeutete Terrassen- bzw. Stellfläche auf Rasen */
  var rasen = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: 0x5f7544, roughness: 1 })
  );
  rasen.rotation.x = -Math.PI / 2;
  rasen.position.y = -0.6;
  rasen.receiveShadow = true;
  szene.add(rasen);

  var belag = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x8e867a, roughness: 0.85 })
  );
  belag.receiveShadow = true;
  szene.add(belag);

  /* Hauswand – nur bei Wandmontage sichtbar */
  var wand = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 24),
    new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.95 })
  );
  wand.castShadow = true; wand.receiveShadow = true;
  szene.add(wand);

  var bau = new THREE.Group();   // alles, was sich bei Änderungen neu aufbaut
  szene.add(bau);

  /* ---------- Werkstoffe ---------- */
  function alu() {
    return new THREE.MeshStandardMaterial({
      color: FARBEN[Z.farbe] || FARBEN['Anthrazit'],
      metalness: 0.55, roughness: 0.45
    });
  }

  /* Verkleidungsbleche sind matter als die tragenden Profile */
  function blech() {
    return new THREE.MeshStandardMaterial({
      color: FARBEN[Z.farbe] || FARBEN['Anthrazit'],
      metalness: 0.4, roughness: 0.68
    });
  }

  function dachfuellung() {
    if (Z.eindeckung === 'VSG opal') {
      return new THREE.MeshPhysicalMaterial({
        color: 0xeff3f5, transparent: true, opacity: 0.72,
        roughness: 0.35, metalness: 0, side: THREE.DoubleSide
      });
    }
    if (Z.eindeckung === 'Polycarbonat') {
      return new THREE.MeshPhysicalMaterial({
        color: 0xdbe6ea, transparent: true, opacity: 0.45,
        roughness: 0.3, metalness: 0, side: THREE.DoubleSide
      });
    }
    return new THREE.MeshPhysicalMaterial({        // VSG klar
      color: 0xd8ecf2, transparent: true, opacity: 0.26,
      roughness: 0.05, metalness: 0, side: THREE.DoubleSide
    });
  }

  /* Trapezblech T35M-0,75 – blickdicht. Rippenabstand und Deckbreite sind
     nicht belegt (offene-punkte.md, Punkt F), deshalb eine glatte Fläche
     statt einer falschen Welle. */
  function trapezblechMaterial() {
    return new THREE.MeshStandardMaterial({
      color: FARBEN[Z.farbe] || FARBEN['Anthrazit'],
      metalness: 0.45, roughness: 0.62
    });
  }

  function seitenglas() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xd8ecf2, transparent: true, opacity: 0.3,
      roughness: 0.05, metalness: 0, side: THREE.DoubleSide
    });
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

  /* LED-Spots an der Dachunterseite. hoeheBei(z) liefert die Unterkante
     an der jeweiligen Stelle, damit die Spots auch im Gefälle sitzen. */
  function ledSpots(xs, zs, hoeheBei) {
    var mLicht = new THREE.MeshBasicMaterial({ color: Z.abend ? 0xfff2cd : 0xe9e4d6 });
    var r = Z.abend ? 4.2 : 3.2;
    xs.forEach(function (x) {
      zs.forEach(function (z) {
        var spot = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 12), mLicht);
        spot.position.set(x, hoeheBei(z) - 2, z);
        bau.add(spot);
      });
    });
    if (Z.abend) {
      var mitteZ = zs.length ? zs.reduce(function (a, b) { return a + b; }, 0) / zs.length : 0;
      var schein = new THREE.PointLight(0xffd79a, 0.9, 900, 2);
      schein.position.set(0, hoeheBei(mitteZ) - 20, mitteZ);
      bau.add(schein);
    }
  }

  /* ---------- Modell aufbauen ----------
     Nullpunkt liegt mittig an der Wand auf Bodenhöhe. Die Tiefe läuft
     nach +z (vom Haus weg), die Breite nach +/-x. */
  function bauen() {
    leeren(bau);
    var e = stueckliste();
    if (e && !e.fehler) bauenAusDaten(e);
    else bauenGeschaetzt();
    stimmung();
    kameraAnpassen();
  }

  /* ---------- Modell aus der Stückliste ----------
     Für TDS, SkyView und Flat Line. Jede Stückzahl kommt aus bauteile();
     hier wird nichts gezählt und nichts gerundet. Die Querschnitte sind bis
     auf Pfosten und Statikträger geschätzt – siehe daten/offene-punkte.md. */
  function bauenAusDaten(e) {
    var m = e.masse, g = m.geschaetzt;
    var B = e.raster.breite / 10, T = e.raster.tiefe / 10;   // mm -> cm
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
    if (!e.freistehend) seitenelemente(B, T, hVorn, pf);

    if (Z.led) {
      var mitten = [];
      for (var i = 0; i < xS.length - 1; i++) mitten.push((xS[i] + xS[i + 1]) / 2);
      ledSpots(mitten, [T * 0.3, T * 0.72], function (z) {
        return hVorn + Math.tan(neig) * (T - z) + riH * 0.2;
      });
    }
  }

  /* Seitliche und vordere Glaselemente – unverändert, sie hängen nicht an
     der Preisliste, sondern sind Zubehör. */
  function seitenelemente(B, T, hVorn, PROFIL) {
    function seite(art, x) {
      if (art === 'offen') return;
      var hoch = hVorn - PROFIL;
      var breiteEl = T - PROFIL * 2;
      var mGlas = seitenglas();
      var rahmen = alu();
      var scheibe = new THREE.Mesh(new THREE.BoxGeometry(breiteEl, hoch, 1.4), mGlas);
      scheibe.position.set(x, hoch / 2 + PROFIL / 2, T / 2);
      scheibe.rotation.y = Math.PI / 2;
      bau.add(scheibe);
      var r1 = new THREE.Mesh(new THREE.BoxGeometry(6, 5, breiteEl), rahmen);
      r1.position.set(x, PROFIL / 2, T / 2); r1.castShadow = true; bau.add(r1);
      var r2 = new THREE.Mesh(new THREE.BoxGeometry(6, 5, breiteEl), rahmen);
      r2.position.set(x, hoch + PROFIL / 2, T / 2); r2.castShadow = true; bau.add(r2);
      if (art === 'Schiebeelement') {
        for (var t = 1; t <= 2; t++) {
          var teiler = new THREE.Mesh(new THREE.BoxGeometry(6, hoch, 4), rahmen);
          teiler.position.set(x, hoch / 2 + PROFIL / 2, T / 2 - breiteEl / 2 + breiteEl * t / 3);
          bau.add(teiler);
        }
      }
    }
    seite(Z.links, -B / 2 + PROFIL / 2);
    seite(Z.rechts, B / 2 - PROFIL / 2);

    if (Z.front !== 'offen') {
      var hochF = hVorn - PROFIL;
      var scheibeF = new THREE.Mesh(new THREE.BoxGeometry(B - PROFIL * 2, hochF, 1.4), seitenglas());
      scheibeF.position.set(0, hochF / 2 + PROFIL / 2, T - PROFIL);
      bau.add(scheibeF);
      var rahmenF = alu();
      var ru = new THREE.Mesh(new THREE.BoxGeometry(B - PROFIL * 2, 5, 6), rahmenF);
      ru.position.set(0, PROFIL / 2, T - PROFIL); bau.add(ru);
      if (Z.front === 'Schiebeelement') {
        var anzahl = Math.max(2, Math.round(B / 160));
        for (var q = 1; q < anzahl; q++) {
          var tf = new THREE.Mesh(new THREE.BoxGeometry(4, hochF, 6), rahmenF);
          tf.position.set(-B / 2 + B * q / anzahl, hochF / 2 + PROFIL / 2, T - PROFIL);
          bau.add(tf);
        }
      }
    }
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
    var NEIGUNG = (tds ? 6 : 1.5) * Math.PI / 180;
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
        var mittenX = [];
        for (var g = 0; g < felder; g++) mittenX.push((sparrenX[g] + sparrenX[g + 1]) / 2);
        ledSpots(mittenX, [T * 0.25, T * 0.6, T * 0.92], function (z) {
          return hHinten + PROFIL * 0.8 - Math.tan(NEIGUNG) * z;
        });
      }
    } else {
      /* Flachdach hinter umlaufender Blende (Attika). Die Blende bleibt
         waagerecht; das Dachblech darin fällt nach vorne ab, die Rinne
         liegt verdeckt dahinter – genau das macht die Flat-Line-Optik. */
      var blendeH = 26;
      var oben = hVorn + blendeH;
      var mBlech = blech();

      balken(B + 4, blendeH, 5, 0, hVorn + blendeH / 2, T + 1, mBlech);   // vorne
      balken(B + 4, blendeH, 5, 0, hVorn + blendeH / 2, -1, mBlech);      // hinten
      [-B / 2 - 1, B / 2 + 1].forEach(function (x) {
        balken(5, blendeH, T + 4, x, hVorn + blendeH / 2, T / 2, mBlech);
      });

      var gefaelle = Math.tan(NEIGUNG) * T;
      var deckL = Math.sqrt(T * T + gefaelle * gefaelle);
      var deck = new THREE.Mesh(
        new THREE.BoxGeometry(B - 2, 4, deckL),
        new THREE.MeshStandardMaterial({
          color: 0x6f7377, metalness: 0.45, roughness: 0.62   // Trapezblech
        })
      );
      deck.position.set(0, oben - 6 - gefaelle / 2, T / 2);
      deck.rotation.x = NEIGUNG;
      deck.castShadow = true; deck.receiveShadow = true;
      bau.add(deck);

      if (Z.cpDach === 'Solar (PV-Anlage)') {
        var mModul = new THREE.MeshStandardMaterial({
          color: 0x1d2a40, metalness: 0.3, roughness: 0.35
        });
        var reihen = Math.max(2, Math.floor((T - 40) / 100));
        var spalten = Math.max(2, Math.floor((B - 30) / 100));
        for (var r = 0; r < reihen; r++) {
          for (var c = 0; c < spalten; c++) {
            var zm = 30 + ((T - 60) / reihen) * (r + 0.5);
            var modul = new THREE.Mesh(new THREE.BoxGeometry((B - 30) / spalten - 6, 2, (T - 60) / reihen - 6), mModul);
            modul.position.set(-B / 2 + 15 + ((B - 30) / spalten) * (c + 0.5),
                               oben - 3 - gefaelle * (zm / T), zm);
            modul.rotation.x = NEIGUNG;
            bau.add(modul);
          }
        }
      } else if (Z.cpDach === 'Dachbegrünung') {
        var gruen = new THREE.Mesh(
          new THREE.BoxGeometry(B - 10, 6, T - 10),
          new THREE.MeshStandardMaterial({ color: 0x5c7a3f, roughness: 0.95 })
        );
        gruen.position.set(0, oben - 6 - gefaelle / 2, T / 2);
        gruen.rotation.x = NEIGUNG;
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
  }

  /* ---------- Tag und Abend ---------- */
  function stimmung() {
    /* Zufahrt grauer als Terrassenbelag – sonst wirkt der Carport,
       als stünde er auf einer Holzterrasse. */
    var belagTag = Z.produkt === 'Carport' ? 0x9c968d : 0x8e867a;
    if (Z.abend) {
      szene.background = new THREE.Color(0x1b2430);
      szene.fog = new THREE.Fog(0x1b2430, 1400, 3400);
      himmel.intensity = 0.35; himmel.color.setHex(0x6f86a8); himmel.groundColor.setHex(0x2a2f36);
      sonne.intensity = 0.5; sonne.color.setHex(0xaec4e8);
      fuell.intensity = 0.12;
      renderer.toneMappingExposure = 0.95;
      rasen.material.color.setHex(0x3c4733);
      belag.material.color.setHex(0x6d6a64);
      wand.material.color.setHex(0x8e8b85);
    } else {
      szene.background = new THREE.Color(0xbcd3e6);
      szene.fog = new THREE.Fog(0xbcd3e6, 1800, 4200);
      himmel.intensity = 0.5; himmel.color.setHex(0xdfeaf5); himmel.groundColor.setHex(0x8d8268);
      sonne.intensity = 1.45; sonne.color.setHex(0xfff1d6);
      fuell.intensity = 0.3;
      renderer.toneMappingExposure = 0.72;
      rasen.material.color.setHex(0x5f7544);
      belag.material.color.setHex(belagTag);
      wand.material.color.setHex(0xcfc7b8);
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
    'Von oben':    { theta: 0.0, phi: 0.22 }
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
  function istCarport() { return Z.produkt === 'Carport'; }
  function istCarportTds() { return istCarport() && Z.cpTyp === 'Carport TDS'; }

  /* Welche Bedienfelder gelten für das gewählte Produkt? Die Gruppen im
     HTML tragen dazu data-k3d-fuer mit einem oder mehreren Stichworten. */
  function gruppeGilt(stichwort) {
    var d = datenSystem();
    switch (stichwort) {
      case 'terrasse':       return !istCarport();
      case 'carport':        return istCarport();
      case 'glas':           return !istCarport() || istCarportTds();
      case 'cp-flachdach':   return istCarport() && !istCarportTds() &&
                                    Z.cpTyp !== 'Flachdach Flat Line';
      case 'cp-ueberstand':  return istCarport() && Z.cpVariante === 'Carport mit Überstand';
      // Maße: Rasterauswahl, wo es Herstellerdaten gibt – sonst Schieberegler
      case 'raster':         return !!d;
      case 'frei':           return !d;
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
      ? e.farben.map(function (f) { return f.name; }) : null;
    Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (b) {
      b.hidden = !!erlaubt && erlaubt.indexOf(b.getAttribute('data-k3d-farbe')) === -1;
    });
    // Ist die gewählte Farbe beim neuen Produkt nicht lieferbar, zurück auf
    // Anthrazit – sonst stünde in der Anfrage eine Farbe, die es nicht gibt.
    var aktiv = document.querySelector('[data-k3d-farbe="' + Z.farbe + '"]');
    if (aktiv && aktiv.hidden) farbeSetzen('Anthrazit');
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

  /* Rasterauswahl füllen. Zwischenmaße gibt es nicht – deshalb eine Liste
     der echten Maße statt eines Schiebereglers. Die Liste hängt am Material:
     Polycarbonat hat bei TDS nur 14 Breiten, Glas 30. */
  function rasterSetzen() {
    var d = datenSystem();
    if (!d) return;
    var listen = RASTER[d.system + '|' + d.material];
    if (!listen) return;
    [['k3dBreiteR', 'breiten', 'breite'], ['k3dTiefeR', 'tiefen', 'tiefe']].forEach(function (p) {
      var sel = document.getElementById(p[0]);
      if (!sel) return;
      var liste = listen[p[1]] || [];
      if (!liste.length) return;
      sel.setAttribute('data-k3d-liste', d.system + '|' + d.material);
      sel.innerHTML = liste.map(function (v) {
        return '<option value="' + v + '">' + (v / 1000).toFixed(v % 1000 ? 2 : 1).replace('.', ',') +
               ' m  ·  ' + v + ' mm</option>';
      }).join('');
      // nächstliegendes Maß beibehalten, damit ein Materialwechsel nicht springt
      var ziel = liste.reduce(function (a, b2) {
        return Math.abs(b2 - Z[p[2]]) < Math.abs(a - Z[p[2]]) ? b2 : a;
      }, liste[0]);
      Z[p[2]] = ziel;
      sel.value = String(ziel);
    });
  }

  function produktName() {
    if (!istCarport()) return Z.produkt;
    return Z.cpTyp === 'Carport TDS' ? 'Carport TDS' : 'Carport ' + Z.cpTyp.replace('Flachdach ', '');
  }

  function zusammenfassung() {
    var teile = [produktName()];
    if (istCarport()) {
      teile.push('Ausführung: ' + Z.cpVariante);
      teile.push(Z.breite + ' × ' + Z.tiefe + ' mm, Durchfahrtshöhe ' + Z.hoehe + ' mm');
      if (Z.cpVariante === 'Carport mit Überstand') teile.push('Dachüberstand: ' + Z.ueberstand + ' mm');
      var ec = stueckliste();
      if (ec && !ec.fehler) {
        teile.push(ec.sparren + ' Sparren, ' + ec.pfosten + ' Pfosten in zwei Reihen');
        teile.push('Dach: ' + ec.eindeckung);
      } else {
        teile.push(istCarportTds() ? 'Eindeckung: ' + Z.eindeckung : 'Dach: ' + Z.cpDach);
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
      if (Z.links !== 'offen') seiten.push('links ' + Z.links);
      if (Z.rechts !== 'offen') seiten.push('rechts ' + Z.rechts);
      if (Z.front !== 'offen') seiten.push('vorne ' + Z.front);
      teile.push(seiten.length ? 'Seiten: ' + seiten.join(', ') : 'Seiten: offen');
    }
    if (Z.led) teile.push('mit LED-Beleuchtung');
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

    if (produktWechsel) masseSetzen();

    Z.aufbau = wert('k3dAufbau') || Z.aufbau;
    var d = datenSystem();
    var ausDaten = !!d;
    if (ausDaten) {
      /* Rasterauswahl: nur Maße, die es in der Preisliste gibt. Die Liste
         trägt, für welches System sie gebaut wurde – steht dort noch das
         vorige System, ist ihr Wert nichts wert und das zuletzt gewählte Maß
         wird stattdessen auf das neue Raster eingerastet. */
      var passt = document.getElementById('k3dBreiteR');
      passt = passt && passt.getAttribute('data-k3d-liste') === d.system + '|' + d.material;
      if (passt) {
        Z.breite = parseInt(wert('k3dBreiteR'), 10) || Z.breite;
        Z.tiefe = parseInt(wert('k3dTiefeR'), 10) || Z.tiefe;
      }
      rasterSetzen();
    } else {
      Z.breite = parseInt(wert('k3dBreite'), 10) || Z.breite;
      Z.tiefe = parseInt(wert('k3dTiefe'), 10) || Z.tiefe;
    }
    Z.hoehe = parseInt(wert('k3dHoehe'), 10) || Z.hoehe;
    Z.neigung = parseInt(wert('k3dNeigung'), 10) || Z.neigung;
    Z.ueberstand = parseInt(wert('k3dUeberstand'), 10) || Z.ueberstand;
    Z.eindeckung = wert('k3dEindeckung') || Z.eindeckung;
    Z.links = wert('k3dLinks') || Z.links;
    Z.rechts = wert('k3dRechts') || Z.rechts;
    Z.front = wert('k3dFront') || Z.front;
    var ledEl = document.getElementById('k3dLed');
    Z.led = ledEl ? ledEl.checked : Z.led;
    Z.montage = wert('k3dMontage') || Z.montage;

    [['k3dBreite', 'breite'], ['k3dTiefe', 'tiefe'], ['k3dHoehe', 'hoehe'],
     ['k3dUeberstand', 'ueberstand']].forEach(function (paar) {
      var a = document.getElementById(paar[0] + 'Wert');
      if (a) a.textContent = Z[paar[1]] + ' mm';
    });
    var nw = document.getElementById('k3dNeigungWert');
    if (nw) nw.textContent = Z.neigung + '°';

    panelAnpassen();
    titelAnpassen();
    // Das Modell wartet auf die Stückliste vom Server. Solange nichts da
    // ist, steht die vorige Zeichnung – kein Flackern, keine Zwischenzahlen.
    stuecklisteHolen(function () {
      panelAnpassen();        // Farbpalette hängt an der Stückliste
      bauen();
      textAktualisieren();
      folgtAktualisieren();
    });
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
    z.push(['Maß', e.raster.breite + ' × ' + e.raster.tiefe + ' mm' +
            (e.imRaster ? '' : ' (nächstes lieferbares Maß)')]);
    z.push(['Sparren', e.sparren + (e.feldbreite ? ' · Achsabstand ' +
            e.feldbreite.achsabstand + ' mm' : '')]);
    z.push(['Pfosten', e.pfosten + (e.pfostenReihen > 1
            ? ' (zwei Reihen zu je ' + e.pfostenJeReihe + ')' : '')]);
    if (e.statiktraeger) z.push(['Statikträger', '189 × 117 mm über die volle Breite']);
    if (e.eindeckungGeteilt) z.push(['Eindeckung', 'quer geteilt, mit Querfuge']);
    if (e.innenkernSparren) {
      z.push(['Innenkern-Sparren', 'erforderlich' +
              (e.innenkernImPreis === false ? ', nicht im Preis enthalten' : '')]);
    }
    z.push(['Eindeckung', e.eindeckung]);
    box.innerHTML = z.map(function (r) {
      return '<li><span>' + esc(r[0]) + '</span> ' + esc(r[1]) + '</li>';
    }).join('');

    if (hinBox) {
      hinBox.innerHTML = e.hinweise.map(function (h) {
        return '<li class="k3d-hin k3d-hin--' + esc(h.art) + '">' + esc(h.text) + '</li>';
      }).join('');
    }
  }

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
   'k3dBreite', 'k3dTiefe', 'k3dBreiteR', 'k3dTiefeR', 'k3dHoehe',
   'k3dNeigung', 'k3dUeberstand', 'k3dEindeckung',
   'k3dLinks', 'k3dRechts', 'k3dFront', 'k3dLed', 'k3dMontage'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.addEventListener('input', aendern);
    e.addEventListener('change', aendern);
  });

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
        notiz: zusammenfassung().join(' · ')
      };
      if (istCarport()) {
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
      }
      window.bvKonfigVorgabe = v;
      var bubble = document.getElementById('bvKonfigBubble');
      if (bubble) bubble.click();
      // Der Assistent hoert darauf und springt direkt zu den Kontaktdaten
      document.dispatchEvent(new CustomEvent('bv-konfig-vorgabe'));
    });
  }

  /* ---------- Start ---------- */
  groesseAnpassen();
  cpVariantenSetzen();
  kameraSetzen();
  zeichnen();

  /* Zuerst fragen, welche Maße es überhaupt gibt. Erst danach steht fest,
     ob die Rasterauswahl oder die geschätzte Skizze gilt. */
  rasterHolen(function () {
    aendern();
    var ladeHinweis = document.getElementById('k3dLaden');
    if (ladeHinweis) ladeHinweis.remove();
  });
})();
