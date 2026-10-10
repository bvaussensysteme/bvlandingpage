/* ============================================================
   BV AussenSysteme – 3D-Konfigurator Terrassendach TDS

   Zeigt die gewählte Konfiguration als dreidimensionales Modell:
   Maße, Aufbau, Eindeckung, Farbe und Seitenelemente wirken sich
   sofort auf das Bild aus.

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
   ============================================================ */
(function () {
  'use strict';

  var leinwand = document.getElementById('k3dCanvas');
  if (!leinwand || !window.THREE) return;

  /* ---------- Zustand ---------- */
  var Z = {
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

  /* Dachneigung: klassisch rund 6 Grad, damit Regen sicher abläuft */
  var NEIGUNG = 6 * Math.PI / 180;
  var PROFIL = 12;          // Kantenlänge der Aluminiumprofile
  var SPARREN_ABSTAND = 110; // Richtwert, wird gleichmäßig verteilt

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

  /* Boden: angedeutete Terrassenfläche auf Rasen */
  var rasen = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: 0x5f7544, roughness: 1 })
  );
  rasen.rotation.x = -Math.PI / 2;
  rasen.position.y = -0.6;
  rasen.receiveShadow = true;
  szene.add(rasen);

  var terrasse = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x8e867a, roughness: 0.85 })
  );
  terrasse.receiveShadow = true;
  szene.add(terrasse);

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

  /* ---------- Modell aufbauen ----------
     Nullpunkt liegt mittig an der Wand auf Bodenhöhe. Die Tiefe läuft
     nach +z (vom Haus weg), die Breite nach +/-x. */
  function bauen() {
    leeren(bau);

    var B = Z.breite / 10, T = Z.tiefe / 10;   // Millimeter -> Zentimeter
    var hVorn = Z.hoehe / 10;                  // Durchgangshöhe vorne
    var hHinten = hVorn + Math.tan(NEIGUNG) * T;
    var mAlu = alu();

    /* Umgebung an die Größe anpassen */
    terrasse.scale.set(B + 160, 1, T + 120);
    terrasse.position.set(0, -1, (T + 120) / 2 - 60);
    wand.visible = (Z.aufbau === 'Wandmontage');
    wand.scale.set(B + 420, hHinten + 190, 1);
    wand.position.set(0, (hHinten + 190) / 2, -12);

    /* Pfosten */
    var pfostenPaare = B > 600 ? 3 : 2;
    var xPos = [];
    for (var i = 0; i < pfostenPaare; i++) {
      xPos.push(-B / 2 + PROFIL / 2 + (B - PROFIL) * (i / (pfostenPaare - 1)));
    }
    xPos.forEach(function (x) {
      balken(PROFIL, hVorn, PROFIL, x, hVorn / 2, T - PROFIL / 2, mAlu);
      if (Z.aufbau === 'Freistehend') {
        balken(PROFIL, hHinten, PROFIL, x, hHinten / 2, PROFIL / 2, mAlu);
      }
    });

    /* Vorderes Profil mit Regenrinne, hinteres Wand- bzw. Trägerprofil */
    balken(B, PROFIL * 1.6, PROFIL * 1.3, 0, hVorn + PROFIL * 0.8, T - PROFIL / 2, mAlu);
    balken(B, PROFIL * 1.4, PROFIL, 0, hHinten + PROFIL * 0.7, PROFIL / 2, mAlu);

    /* Sparren samt Dachfüllung dazwischen */
    var felder = Math.max(2, Math.round(B / SPARREN_ABSTAND));
    var sparrenX = [];
    for (var s = 0; s <= felder; s++) sparrenX.push(-B / 2 + (B * s / felder));

    var laenge = Math.sqrt(T * T + Math.pow(hHinten - hVorn, 2));
    var mitteY = (hVorn + hHinten) / 2 + PROFIL * 0.9;
    var mitteZ = T / 2;

    sparrenX.forEach(function (x) {
      var sp = new THREE.Mesh(new THREE.BoxGeometry(PROFIL * 0.75, PROFIL, laenge), mAlu);
      sp.position.set(x, mitteY, mitteZ);
      sp.rotation.x = NEIGUNG;
      sp.castShadow = true; sp.receiveShadow = true;
      bau.add(sp);
    });

    var mFuellung = dachfuellung();
    for (var f = 0; f < felder; f++) {
      var feldBreite = (B / felder) - PROFIL * 0.75;
      var platte = new THREE.Mesh(new THREE.BoxGeometry(feldBreite, 1.6, laenge - 2), mFuellung);
      platte.position.set((sparrenX[f] + sparrenX[f + 1]) / 2, mitteY + PROFIL * 0.35, mitteZ);
      platte.rotation.x = NEIGUNG;
      bau.add(platte);
    }

    /* Seitenelemente */
    function seite(art, x, drehen) {
      if (art === 'offen') return;
      var hoch = hVorn - PROFIL;
      var breiteEl = T - PROFIL * 2;
      var mGlas = seitenglas();
      var rahmen = alu();

      var scheibe = new THREE.Mesh(new THREE.BoxGeometry(breiteEl, hoch, 1.4), mGlas);
      scheibe.position.set(x, hoch / 2 + PROFIL / 2, T / 2);
      scheibe.rotation.y = Math.PI / 2;
      bau.add(scheibe);

      // Rahmen oben und unten, bei Schiebeelementen zusätzlich die Teilung
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
    seite(Z.links, -B / 2 + PROFIL / 2, false);
    seite(Z.rechts, B / 2 - PROFIL / 2, false);

    if (Z.front !== 'offen') {
      var hochF = hVorn - PROFIL;
      var mGlasF = seitenglas();
      var scheibeF = new THREE.Mesh(new THREE.BoxGeometry(B - PROFIL * 2, hochF, 1.4), mGlasF);
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

    /* LED-Spots in den Sparren – am Abend sichtbar */
    if (Z.led) {
      var mLicht = new THREE.MeshBasicMaterial({ color: Z.abend ? 0xfff2cd : 0xe9e4d6 });
      for (var g = 0; g < felder; g++) {
        for (var r = 0; r < 2; r++) {
          var spot = new THREE.Mesh(new THREE.CylinderGeometry(Z.abend ? 4.2 : 3.2, Z.abend ? 4.2 : 3.2, 1.2, 12), mLicht);
          var zz = T * (0.3 + r * 0.42);
          spot.position.set((sparrenX[g] + sparrenX[g + 1]) / 2,
                            hVorn + PROFIL * 0.8 + Math.tan(NEIGUNG) * (T - zz) - 2, zz);
          bau.add(spot);
        }
      }
      if (Z.abend) {
        var schein = new THREE.PointLight(0xffd79a, 0.9, 900, 2);
        schein.position.set(0, hVorn - 20, T * 0.5);
        bau.add(schein);
      }
    }

    stimmung();
    kameraAnpassen();
  }

  /* ---------- Tag und Abend ---------- */
  function stimmung() {
    if (Z.abend) {
      szene.background = new THREE.Color(0x1b2430);
      szene.fog = new THREE.Fog(0x1b2430, 1400, 3400);
      himmel.intensity = 0.35; himmel.color.setHex(0x6f86a8); himmel.groundColor.setHex(0x2a2f36);
      sonne.intensity = 0.5; sonne.color.setHex(0xaec4e8);
      fuell.intensity = 0.12;
      renderer.toneMappingExposure = 0.95;
      rasen.material.color.setHex(0x3c4733);
      terrasse.material.color.setHex(0x6d6a64);
      wand.material.color.setHex(0x8e8b85);
    } else {
      szene.background = new THREE.Color(0xbcd3e6);
      szene.fog = new THREE.Fog(0xbcd3e6, 1800, 4200);
      himmel.intensity = 0.5; himmel.color.setHex(0xdfeaf5); himmel.groundColor.setHex(0x8d8268);
      sonne.intensity = 1.45; sonne.color.setHex(0xfff1d6);
      fuell.intensity = 0.3;
      renderer.toneMappingExposure = 0.72;
      rasen.material.color.setHex(0x5f7544);
      terrasse.material.color.setHex(0x8e867a);
      wand.material.color.setHex(0xcfc7b8);
    }
  }

  /* ---------- Kamera ---------- */
  var kam = { radius: 1000, theta: 0.78, phi: 1.3, ziel: new THREE.Vector3(0, 120, 120) };
  var autoDreht = false;

  function kameraAnpassen() {
    /* Der Abstand haengt an der Groesse des Daches, damit auch 7 m Breite
       vollstaendig ins Bild passen. Eine selbst gewaehlte Zoomstufe bleibt
       erhalten, solange das Modell dabei nicht angeschnitten wird - erst
       wenn es aus dem Bild laufen wuerde, rueckt die Kamera nach. */
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

  function zusammenfassung() {
    var teile = [
      'Terrassendach TDS',
      Z.aufbau,
      Z.breite + ' × ' + Z.tiefe + ' mm, Durchgangshöhe ' + Z.hoehe + ' mm',
      'Eindeckung: ' + Z.eindeckung,
      'Farbe: ' + Z.farbe
    ];
    var seiten = [];
    if (Z.links !== 'offen') seiten.push('links ' + Z.links);
    if (Z.rechts !== 'offen') seiten.push('rechts ' + Z.rechts);
    if (Z.front !== 'offen') seiten.push('vorne ' + Z.front);
    teile.push(seiten.length ? 'Seiten: ' + seiten.join(', ') : 'Seiten: offen');
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
    Z.aufbau = wert('k3dAufbau') || Z.aufbau;
    Z.breite = parseInt(wert('k3dBreite'), 10) || Z.breite;
    Z.tiefe = parseInt(wert('k3dTiefe'), 10) || Z.tiefe;
    Z.hoehe = parseInt(wert('k3dHoehe'), 10) || Z.hoehe;
    Z.eindeckung = wert('k3dEindeckung') || Z.eindeckung;
    Z.links = wert('k3dLinks') || Z.links;
    Z.rechts = wert('k3dRechts') || Z.rechts;
    Z.front = wert('k3dFront') || Z.front;
    var ledEl = document.getElementById('k3dLed');
    Z.led = ledEl ? ledEl.checked : Z.led;
    Z.montage = wert('k3dMontage') || Z.montage;
    ['k3dBreite', 'k3dTiefe', 'k3dHoehe'].forEach(function (id) {
      var a = document.getElementById(id + 'Wert');
      if (a) a.textContent = document.getElementById(id).value + ' mm';
    });
    bauen();
    textAktualisieren();
  }

  ['k3dAufbau', 'k3dBreite', 'k3dTiefe', 'k3dHoehe', 'k3dEindeckung',
   'k3dLinks', 'k3dRechts', 'k3dFront', 'k3dLed', 'k3dMontage'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.addEventListener('input', aendern);
    e.addEventListener('change', aendern);
  });

  // Farbfelder
  Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (b) {
    b.addEventListener('click', function () {
      Z.farbe = b.getAttribute('data-k3d-farbe');
      Array.prototype.forEach.call(document.querySelectorAll('[data-k3d-farbe]'), function (x) {
        x.classList.remove('is-active');
        x.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('is-active');
      b.setAttribute('aria-pressed', 'true');
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
      a.download = 'Terrassendach-TDS-' + Z.breite + 'x' + Z.tiefe + 'mm.png';
      a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
    });
  }

  /* Übergabe an den Anfrage-Assistenten: die Konfiguration wandert als
     Vorgabe in den Assistenten, damit niemand alles zweimal eingibt. */
  var anfrageBtn = document.getElementById('k3dAnfrage');
  if (anfrageBtn) {
    anfrageBtn.addEventListener('click', function () {
      window.bvKonfigVorgabe = {
        produkt: 'Terrassendach TDS',
        aufbau: Z.aufbau === 'Wandmontage' ? 'Wandmontage' : 'Freistehend',
        breite: String(Z.breite),            // der Assistent rechnet ebenfalls in Millimetern
        tiefe: String(Z.tiefe),
        hoehe: String(Z.hoehe),
        verglasung: Z.eindeckung === 'Polycarbonat' ? 'Polycarbonat' : 'VSG-Glas',
        farbe: Z.farbe,
        led: Z.led ? 'Ja' : 'Nein',
        montage: Z.montage,
        notiz: zusammenfassung().join(' · ')
      };
      var bubble = document.getElementById('bvKonfigBubble');
      if (bubble) bubble.click();
      // Der Assistent hoert darauf und springt direkt zu den Kontaktdaten
      document.dispatchEvent(new CustomEvent('bv-konfig-vorgabe'));
    });
  }

  /* ---------- Start ---------- */
  groesseAnpassen();
  aendern();
  kameraSetzen();
  zeichnen();

  var ladeHinweis = document.getElementById('k3dLaden');
  if (ladeHinweis) ladeHinweis.remove();
})();
