#!/usr/bin/env node
/* Prueft die anklickbaren Felder am 3D-Modell.
 *
 * ANLASS. „kleine + marken am 3d modell, eine je seitenfeld und eine am
 * dach, klick drauf springt in den bereich der dazu gehoert" (Betreiber,
 * 31.10.2026) – und am selben Tag, nach mehreren Anlaeufen: „und die
 * Punkte drehen sich quasi immer in Kamerarichtung und bleiben nicht
 * flach wie dieses Feld immer stehen … wenn man dann mit der Maus ueber
 * dieses Feld faehrt, dann sieht dieses Feld wie markiert aus … in
 * orange durchsichtig".
 *
 * DER WUNDE PUNKT ist die LAGE. Ein Feld, das neben seinem Bauteil
 * sitzt, zeigt auf das falsche – und fuehrt dann auch in die falsche
 * Einstellung. Deshalb wird die Lage hier nicht im Quelltext
 * nachgelesen, sondern AUSGEFUEHRT: markenFelder() wird aus
 * js/konfigurator-3d.js herausgeschnitten und mit eigenen Zahlen laufen
 * gelassen.
 *
 * ZWEITE BAUART, 31.10.2026: Die Felder sind FLAECHEN IN DER SZENE,
 * keine HTML-Knoepfe mehr darueber. Was dadurch wegfiel, wird hier
 * nicht mehr geprueft (Projektion, Verdeckungsstrahl je Bild,
 * Nachziehen bei Groessenaenderung). Was dafuer neu geprueft wird: dass
 * die Flaeche IN der Ebene ihres Feldes liegt, dass sich nichts zur
 * Kamera dreht, dass das Feld unter dem Zeiger orange aufleuchtet und
 * dass die Flaechen nicht im gespeicherten Bild landen.
 *
 * GEGENPROBE (--gegenprobe): Es wird nicht das Kriterium aufgeweicht,
 * sondern die Quelle beschaedigt – JEDER FEHLER EINZELN. Danach muss
 * JEDE Pruefung in mindestens einem Durchgang rot geworden sein.
 *
 * Aufruf:  node scripts/pruefe-marken.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var JS_ORIG = fs.readFileSync(__dirname + '/../js/konfigurator-3d.js', 'utf8');
var HTML_ORIG = fs.readFileSync(__dirname + '/../konfigurator.html', 'utf8');

/* Je ein Fehler, den man beim Bauen wirklich machen kann.
   [ Name, Datei ('js'|'html'), Suchtext, Ersatz ] */
var FEHLER = [
  /* ---------- Lage der Felder ---------- */
  ['Links und rechts landen auf derselben Seite', 'js',
   "liste.push({ seite: 'links', x: B / 2 - PROFIL / 2, z: f.mitte,",
   "liste.push({ seite: 'links', x: -B / 2 + PROFIL / 2, z: f.mitte,"],
  ['Nur ein Feld je Laengsseite statt zwei', 'js',
   "      liste.push({ seite: 'rechts', x: -B / 2 + PROFIL / 2, z: f.mitte,\n                   nx: -1, nz: 0, feld: i, anzahl: felder.length,\n                   laenge: f.laenge });\n",
   ''],
  ['Der Unterzug teilt die Seite nicht mehr', 'js',
   '    (felder || []).forEach(function (f, i) {',
   '    (felder || []).slice(0, 1).forEach(function (f, i) {'],
  ['Feld hinten auch bei Wandmontage', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);",
   "    quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);"],
  ['Hinten folgt den VORDEREN Pfostenachsen', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,",
   "    if (rueck) quer('hinten', achsen,"],
  ['Pfostenbreite bleibt unberuecksichtigt (Feld im Pfosten)', 'js',
   '        var von = achsenListe[i] + PROFIL / 2;\n        var bis = achsenListe[i + 1] - PROFIL / 2;',
   '        var von = achsenListe[i] - PROFIL / 2;\n        var bis = achsenListe[i + 1] + PROFIL / 2;'],
  ['Vorne landet an der Wand statt an der Dachvorderkante', 'js',
   "    quer('vorne', achsen, vorneZ, 1);", "    quer('vorne', achsen, hintenZ, 1);"],
  ['Hinten landet an der Vorderkante', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);",
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    vorneZ, -1);"],
  ['Nur das erste Pfostenfach bekommt ein Feld', 'js',
   '      mitten.forEach(function (f, i) {',
   '      mitten.slice(0, 1).forEach(function (f, i) {'],
  ['Die Feldnummer geht verloren (Beschriftung "Feld 1 von 1")', 'js',
   '                   nx: 1, nz: 0, feld: i, anzahl: felder.length,',
   '                   nx: 1, nz: 0, feld: 0, anzahl: 1,'],
  ['Die Feldlaenge geht verloren (alle Flaechen gleich breit)', 'js',
   "                   nx: 1, nz: 0, feld: i, anzahl: felder.length,\n                   laenge: f.laenge });",
   "                   nx: 1, nz: 0, feld: i, anzahl: felder.length,\n                   laenge: 0 });"],
  ['Der Zeiger verraet nicht, dass das Feld anklickbar ist', 'js',
   "    if (neu) { leinwand.style.cursor = 'pointer'; return; }",
   '    void neu;'],
  ['Die Lagefunktion ist nicht mehr auffindbar', 'js',
   'function markenFelder(B, PROFIL, felder', 'function markenFelderchen(B, PROFIL, felder'],
  ['Felder sitzen nicht mehr mittig im Feld', 'js',
   '        p: { x: m.x, y: (yUnten + okOben) / 2, z: m.z },',
   '        p: { x: m.x, y: okOben - 2, z: m.z },'],

  /* ---------- Einbau ---------- */
  ['Felder werden beim Neubau nicht zurueckgesetzt', 'js',
   '    MARKEN = [];', '    void 0;'],
  ['Die Flaechen bleiben nach dem Neubau stehen', 'js',
   '    leeren(feldGruppe);', '    void 0;'],
  ['Die Hervorhebung bleibt nach dem Neubau stehen', 'js',
   '    feldWach = null;', '    void 0;'],
  ['Das Dachfeld entsteht nicht mehr', 'js',
   '    markeDach();\n    markenAufbauen();', '    markenAufbauen();'],
  ['Der Schalter wirkt nicht mehr', 'js',
   '    var soll = Z.markenZeigen ? MARKEN.length : 0;',
   '    var soll = MARKEN.length;'],
  ['Felder sind voreingestellt AUS', 'js',
   '    markenZeigen: true,', '    markenZeigen: false,'],
  ['Der Sprung zielt auf einen Bereich, den es nicht gibt', 'js',
   "    var schritt = (m.art === 'dach') ? 'dach' : 'seiten';",
   "    var schritt = (m.art === 'dach') ? 'dachflaeche' : 'seitenwahl';"],
  ['Das Dachfeld schwebt wieder ueber dem Dach', 'js',
   '        y = t[0].point.y;', '        void t;'],
  ['Das Dachfeld liegt flach statt in der Dachneigung', 'js',
   '          nrm.copy(t[0].face.normal).applyNormalMatrix(',
   '          void 0 || (function () {}).call(null,'],

  /* ---------- Die Flaeche liegt IM Feld ---------- */
  ['Die Flaeche wird nicht auf die Feldrichtung gedreht', 'js',
   '    o.quaternion.setFromUnitVectors(FELD_VOR, feldRichtung);',
   '    void feldRichtung;'],
  ['Das Zeichen dreht sich wieder zur Kamera', 'js',
   '        map: feldBild(markenZeichen(marke)), side: THREE.DoubleSide,',
   '        map: feldBild(markenZeichen(marke)), side: THREE.DoubleSide, void: new THREE.Sprite(),'],
  ['Die Scheibe wird wieder durchsichtig', 'js',
   "    g.fillStyle = belegt ? '#C49A2A' : '#FFFFFF';",
   "    g.fillStyle = belegt ? 'rgba(196,154,42,.80)' : 'rgba(255,255,255,.80)';"],
  ['Die Linien werden wieder duenn', 'js',
   '      g.lineWidth = 4.2;', '      g.lineWidth = 2.3;'],
  ['Der Rand wird wieder breit', 'js',
   "    g.strokeStyle = '#9A7318'; g.lineWidth = 8; g.stroke();",
   "    g.strokeStyle = '#9A7318'; g.lineWidth = 13; g.stroke();"],
  ['Das Zeichen wird beim Verkleinern wieder weichgerechnet', 'js',
   '    t.minFilter = THREE.LinearFilter;', '    void 0;'],
  ['Die Mipmap-Kette kommt zurueck', 'js',
   '    t.generateMipmaps = false;', '    void 0;'],
  ['Das Zeichen wird nur halb so fein gezeichnet', 'js',
   '    var K = 256, M = K / 2;', '    var K = 128, M = K / 2;'],
  ['Das Zeichen wird wieder von Hand gemalt statt aus dem Zeichensatz', 'js',
   '      for (var i = 0; i < u.d.length; i++) g.stroke(new Path2D(u.d[i]));',
   '      void u;'],
  ['Das Zeichen im Feld folgt einer eigenen Regel', 'js',
   '        map: feldBild(markenZeichen(marke)), side: THREE.DoubleSide,',
   "        map: feldBild(belegt ? 'stift' : 'punkt'), side: THREE.DoubleSide,"],
  ['Die Flaeche traegt keinen Verweis auf ihr Feld', 'js',
   '    f.userData.feldMarke = marke;', '    void marke;'],
  ['Das Zeichen traegt keinen Verweis auf sein Feld', 'js',
   '    z.userData.feldMarke = marke;', '    void marke;'],
  ['Das Zeichen wird beliebig klein', 'js',
   '    var gr = Math.max(14, Math.min(34, Math.min(laenge, hoehe) / 3)) *\n             FELD_ZEICHEN_ANTEIL;',
   '    var gr = Math.min(laenge, hoehe) / 30;'],
  ['Das Zeichen ist wieder so gross wie vorher', 'js',
   '  var FELD_ZEICHEN_ANTEIL = 2 / 3;', '  var FELD_ZEICHEN_ANTEIL = 1;'],
  ['Die Flaeche schneidet weg, was dahinter liegt', 'js',
   '      transparent: true, opacity: ruhe, depthWrite: false',
   '      transparent: true, opacity: ruhe, depthWrite: true'],
  ['Belegte Felder liegen als Schleier vor dem Element', 'js',
   '                           feldStoff(belegt ? 0 : FELD_RUHE));',
   '                           feldStoff(FELD_RUHE));'],
  ['Auch belegte Faecher bekommen wieder ein Zeichen', 'js',
   '      if (erwListeFeld(m.seite, m.feld).length === 0) {',
   '      if (true) {'],
  ['Das Dach verliert sein Zeichen', 'js',
   '    feldFlaeche(marke, kiste.max.x - kiste.min.x - 20, tief - 20, true);',
   '    void tief;'],
  ['Die leere Flaeche ist nicht mehr zurueckhaltend', 'js',
   '  var FELD_RUHE   = 0.09;', '  var FELD_RUHE   = 0.9;'],
  ['Die Flaechen haengen nicht am Felder-Schalter', 'js',
   '    feldGruppe.visible = !!Z.markenZeigen;', '    void 0;'],
  ['Die Weltmatrix der Flaechen wird nicht nachgezogen', 'js',
   '    feldGruppe.updateMatrixWorld(true);', '    void 0;'],

  /* ---------- Unter dem Zeiger ---------- */
  ['Unter dem Zeiger faerbt sich nichts', 'js',
   '      mat.color.copy(rgb(an ? FELD_ORANGE : 0xffffff));', '      void an;'],
  ['Das Feld unter dem Zeiger bleibt gleich durchsichtig', 'js',
   '      mat.opacity = an ? FELD_WACH : mat.userData.ruhe;',
   '      mat.opacity = mat.userData.ruhe;'],
  ['Das Schweben wird ungebremst gestrahlt', 'js',
   '      if (jetzt - zuletzt < 60) return;', '      if (false) return;'],
  ['Nach einem Ansichtswechsel leuchtet das Feld weiter', 'js',
   '    if (feldWach) { feldWach = null; feldFaerben(); }', '    void 0;'],
  ['Beim Drehen leuchtet das Feld mit', 'js',
   '    var neu = (zieht || PF_ZIEHT) ? null : feldUnterZeiger(e);',
   '    var neu = feldUnterZeiger(e);'],
  ['Felder sind auch bei abgeschaltetem Schalter anklickbar', 'js',
   '    if (!Z.markenZeigen || !feldGruppe.children.length || !e) return null;',
   '    if (!feldGruppe.children.length || !e) return null;'],
  ['Hinter einem Pfosten ist das Feld trotzdem anklickbar', 'js',
   '      if (o.userData && o.userData.feldMarke) return o.userData.feldMarke;\n'
   + '      /* Was den Blick nimmt, nimmt auch den Klick. */\n'
   + '      if (nimmtDenBlick([treffer[i]])) return null;',
   '      if (o.userData && o.userData.feldMarke) return o.userData.feldMarke;\n'
   + '      void 0;'],
  ['Hauswand und Haustuer nehmen den Klick nicht', 'js',
   '    if (wand && wand.visible) ziele.push(wand);', '    void wand;'],
  ['Der Klick aufs Feld wird nicht ausgewertet', 'js',
   '!feldGeklickt(e) && !massGeklickt(e) &&', '!massGeklickt(e) &&'],
  ['Der Klick aufs Feld fuehrt nirgendwohin', 'js',
   '    markeSpringen(m);\n    return true;', '    return true;'],

  /* ---------- Bild und PDF ---------- */
  ['Die Flaechen landen im gespeicherten Bild', 'js',
   "    feldGruppe.visible = false;\n    ziehGruppe.visible = false;",
   "    ziehGruppe.visible = false;"],
  ['Die Flaechen landen im PDF', 'js',
   '      feldGruppe.visible = false;\n      ziehGruppe.visible = false;',
   '      ziehGruppe.visible = false;'],

  /* ---------- Masse antippen ---------- */
  ['Masse sind wieder voreingestellt AUS', 'js',
   '    masseZeigen: true,', '    masseZeigen: false,'],
  ['Das Haekchen fuer die Masse steht nicht auf an', 'html',
   '<input type="checkbox" id="k3dMasse" checked>',
   '<input type="checkbox" id="k3dMasse">'],
  ['Die Schilder wissen nicht, zu welchem Mass sie gehoeren', 'js',
   "    if (feld) s.userData.massFeld = feld;", '    void feld;'],
  ['Der Klick auf ein Mass wird nicht ausgewertet', 'js',
   '!feldGeklickt(e) && !massGeklickt(e) &&', '!feldGeklickt(e) &&'],
  ['Die neue Zahl umgeht das Zahlenfeld und seine Grenzen', 'js',
   "      zahl.dispatchEvent(new Event('change', { bubbles: true }));",
   '      Z.breite = parseInt(eingabe.value, 10);'],
  ['Der Eingabekasten fehlt in der Seite', 'html',
   'id="k3dMassEingabe"', 'id="k3dMassEingabeAlt"'],
  ['Die eigenen Schalter am Masskasten fehlen', 'html',
   'id="k3dMassPlus"', 'id="k3dMassPlusAlt"'],
  ['Die Schalter tun nichts', 'js',
   '        massHalten(paar[1]);', '        void paar;'],
  ['Die Schalter achten nicht auf die Grenzen', 'js',
   '      e.value = String(Math.round(Math.min(Math.max(v, min), max)));',
   '      e.value = String(Math.round(v));'],
  ['Gedrueckt halten laeuft nicht weiter', 'js',
   '        stufeTakt = setInterval(function () { massStufe(richtung); }, 60);',
   '        void richtung;'],
  ['Der Fokus wandert beim Druecken aus dem Feld', 'js',
   '        ev.preventDefault();\n        massHalten(paar[1]);',
   '        massHalten(paar[1]);'],
  ['Das eigene Minus-Zeichen fehlt in der Sammlung', 'html',
   '<symbol id="bvs-strich" viewBox="0 0 24 24">',
   '<symbol id="bvs-strichlein" viewBox="0 0 24 24">'],

  /* ---------- Bedienung aussen ---------- */
  ['Das Stift-Zeichen fehlt im Zeichensatz', 'html',
   '<symbol id="bvs-stift"', '<symbol id="bvs-stiftchen"'],
  ['Das Haekchen im Bedienfeld fehlt', 'html',
   '<input type="checkbox" id="k3dMarken" checked>',
   '<input type="checkbox" id="k3dMarkenAnzeige" checked>'],
  ['Die Tastaturliste fehlt in der Seite', 'html',
   '<div class="k3d-marken" id="k3dMarkenHuelle"></div>', ''],
  ['Liste und Haekchen tragen dieselbe Kennung', 'html',
   'id="k3dMarkenHuelle"', 'id="k3dMarken"'],
  ['Die Tastaturliste ist sichtbar und stoert im Bild', 'html',
   '      width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);',
   '      overflow: visible;'],
  ['Die Tastaturliste bleibt auch mit Fokus unsichtbar', 'html',
   '    .k3d-marken:focus-within {', '    .k3d-marken-aus {'],
  ['Die Liste tragt wieder Schriftzeichen statt Symbole', 'js',
   "      b.innerHTML = bvSymbol(zeichen);", "      b.textContent = '+';"],
  ['Die Knoepfe der Liste bleiben verborgen', 'js',
   '      b.hidden = false;', '      b.hidden = true;'],
  ['Der Schalter in der Leiste zeichnet nicht neu', 'js',
   '    feldFaerben();\n    /* Der Schalter in der Ansichtsleiste aendert nur die Sichtbarkeit,\n       nicht das Modell - ohne das hier bliebe das letzte Bild stehen. */\n    neuZeichnen();',
   '    feldFaerben();'],
  ['Die Buehne wird nicht mehr beobachtet', 'js',
   'new ResizeObserver(groesseGebremst).observe(leinwand.parentNode);',
   'void groesseGebremst;'],
  ['Der Beobachter feuert ungebremst', 'js',
   '    if (groesseLaeuft) return;', '    if (false) return;']
];

function baue(nr) {
  var js = JS_ORIG, html = HTML_ORIG;
  if (nr != null) {
    var f = FEHLER[nr];
    var quelle = f[1] === 'js' ? js : html;
    if (quelle.indexOf(f[2]) < 0) {
      console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    if (f[1] === 'js') js = js.replace(f[2], f[3]);
    else html = html.replace(f[2], f[3]);
  }
  /* markenFelder() wird herausgeschnitten und ausgefuehrt. Sie ist
     absichtlich ohne Bezug nach draussen gebaut – genau damit das hier
     moeglich ist, ohne einen Browser zu starten. */
  var a = js.match(/function markenFelder\([\s\S]*?\n  \}/);
  var felder = null;
  try {
    if (a) felder = new Function('return (' + a[0].replace('function markenFelder', 'function') + ');')();
  } catch (e) { felder = null; }
  return { js: js, html: html, felder: felder };
}

/* ---------- Ein Durchgang ---------- */
var PF = 11;          // Pfostenbreite in cm (wie im Modell)
var B = 500;          // Anlagenbreite in cm
var VORNE = 389;      // Dachvorderkante in cm
var HINTEN = 0;

function lauf(q) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  if (!q.felder) {
    p('markenFelder() laesst sich ausfuehren', false,
      'nicht gefunden oder nicht lauffaehig');
    return e;
  }
  p('markenFelder() laesst sich ausfuehren', true,
    'aus js/konfigurator-3d.js herausgeschnitten');

  /* Ein Feld je Laengsseite (kein Unterzug), ein Fach vorne. */
  var einFeld = [{ mitte: VORNE / 2, laenge: VORNE }];
  var achsen2 = [-B / 2 + PF / 2, B / 2 - PF / 2];
  var a = q.felder(B, PF, einFeld, VORNE, HINTEN, achsen2, null, false);
  function nur(liste, seite) {
    return liste.filter(function (m) { return m.seite === seite; });
  }
  p('Ohne Unterzug: ein Feld links und eines rechts',
    nur(a, 'links').length === 1 && nur(a, 'rechts').length === 1,
    nur(a, 'links').length + ' links, ' + nur(a, 'rechts').length + ' rechts');

  p('Links liegt bei +x, rechts bei -x (wie eineSeite baut)',
    nur(a, 'links')[0] && nur(a, 'rechts')[0] &&
    nur(a, 'links')[0].x === B / 2 - PF / 2 &&
    nur(a, 'rechts')[0].x === -B / 2 + PF / 2,
    nur(a, 'links')[0] ? 'links x = ' + nur(a, 'links')[0].x + ' cm' : 'kein Feld links');

  p('Vorne liegt das Feld an der Dachvorderkante',
    nur(a, 'vorne').length === 1 && nur(a, 'vorne')[0].z === VORNE,
    nur(a, 'vorne').length ? 'z = ' + nur(a, 'vorne')[0].z + ' cm' : 'kein Feld vorne');

  p('Bei Wandmontage gibt es hinten kein Feld',
    nur(a, 'hinten').length === 0, nur(a, 'hinten').length + ' Felder hinten');

  /* Unterzug mittig: die Laengsseite zerfaellt in zwei Felder. */
  var zwei = [{ mitte: 95, laenge: 190 }, { mitte: 290, laenge: 190 }];
  var b2 = q.felder(B, PF, zwei, VORNE, HINTEN, achsen2, null, false);
  p('Mit Unterzug: zwei Felder links und zwei rechts',
    nur(b2, 'links').length === 2 && nur(b2, 'rechts').length === 2,
    nur(b2, 'links').length + ' links, ' + nur(b2, 'rechts').length + ' rechts');
  p('Jedes Feld sitzt in der Mitte SEINER Oeffnung',
    nur(b2, 'links')[0] && nur(b2, 'links')[1] &&
    nur(b2, 'links')[0].z === 95 && nur(b2, 'links')[1].z === 290,
    nur(b2, 'links').map(function (m) { return m.z; }).join(' / ') + ' cm');

  /* Drei Pfosten vorne, zwei hinten (Statiktraeger), freistehend. */
  var achsen3 = [-B / 2 + PF / 2, 0, B / 2 - PF / 2];
  var c = q.felder(B, PF, einFeld, VORNE, HINTEN, achsen3, achsen2, true);
  p('Vorne ein Feld je Pfostenfach',
    nur(c, 'vorne').length === 2,
    nur(c, 'vorne').length + ' Felder bei 3 Pfostenachsen');
  p('Hinten folgen die Felder den HINTEREN Pfosten (Statiktraeger)',
    nur(c, 'hinten').length === 1,
    nur(c, 'hinten').length + ' Felder hinten bei 2 hinteren Achsen, 3 vorne');
  p('Hinten liegt das Feld bei z = 0 (Wandebene)',
    nur(c, 'hinten')[0] && nur(c, 'hinten')[0].z === HINTEN,
    nur(c, 'hinten')[0] ? 'z = ' + nur(c, 'hinten')[0].z + ' cm' : 'kein Feld hinten');

  /* Zwei Pfosten dicht an dicht: dort ist kein lichtes Mass.
     Die MITTE zweier Achsen ist von der Pfostenbreite unabhaengig – an
     der Lage laesst sich das lichte Mass deshalb gar nicht ablesen. Was
     sich ablesen laesst: ob das enge Fach ueberhaupt ein Feld bekommt,
     und ob ein Feld in einem Pfosten steckt. (Eine Pruefung auf die
     Mitte stand hier zuerst und konnte nie anschlagen.) */
  var engeAchsen = [-B / 2 + PF / 2, -B / 2 + PF / 2 + PF, B / 2 - PF / 2];
  var eng = q.felder(B, PF, einFeld, VORNE, HINTEN, engeAchsen, null, false);
  p('Ein Fach ohne lichtes Mass bekommt kein Feld',
    nur(eng, 'vorne').length === 1,
    nur(eng, 'vorne').length + ' statt 2 – das enge Fach faellt weg');
  var imPfosten = nur(eng, 'vorne').filter(function (m) {
    return engeAchsen.some(function (ax) { return Math.abs(m.x - ax) <= PF / 2; });
  });
  p('Kein Feld steckt in einem Pfosten',
    nur(eng, 'vorne').length > 0 && imPfosten.length === 0,
    imPfosten.length + ' von ' + nur(eng, 'vorne').length + ' zu nah an einer Achse');

  /* Jedes Feld traegt die Nummer seiner Oeffnung und die Gesamtzahl –
     daraus entsteht die Beschriftung „Feld 2 von 2". */
  p('Jedes Feld kennt seine Nummer und die Gesamtzahl',
    nur(b2, 'links').every(function (m, i) { return m.feld === i && m.anzahl === 2; }),
    'links: ' + nur(b2, 'links').map(function (m) {
      return (m.feld + 1) + '/' + m.anzahl; }).join(', '));

  /* Jedes Feld traegt die Laenge seiner Oeffnung – daraus entsteht die
     Groesse der Flaeche. Ohne sie waere jede Flaeche gleich breit. */
  p('Jedes Feld kennt die Laenge seiner Oeffnung',
    nur(b2, 'links').every(function (m) { return m.laenge === 190; }) &&
    nur(c, 'vorne').every(function (m) { return m.laenge > 0; }),
    'links 190 cm, vorne ' + nur(c, 'vorne').map(function (m) {
      return Math.round(m.laenge); }).join(' / ') + ' cm');

  /* ---------- Mittig im Feld ----------
     „die sollen mittig in den feldern sitzen" (Betreiber, 31.10.2026).

     Am selben Tag hingen sie kurz an der Dachkante, weil eine Messung
     zeigte, dass sie in der Mitte einer OFFENEN Seite ueber Wiese und
     Himmel liegen. Das war meine Auslegung, nicht sein Wunsch: „das
     hab ich nie gesagt". Zurueckgenommen - und seit die Flaeche selbst
     im Feld steht, liegt dort auch kein Zeichen mehr im Leeren. */
  p('Die Felder sitzen mittig in ihrer Oeffnung',
    /p: \{ x: m\.x, y: \(yUnten \+ okOben\) \/ 2, z: m\.z \}/.test(q.js),
    'waagerecht die Feldmitte, senkrecht die Mitte der Oeffnung');

  /* ---------- Einbau im Quelltext ---------- */
  p('Die Felder werden bei jedem Neubau zurueckgesetzt',
    /leeren\(bau\);[\s\S]{0,400}?MARKEN = \[\];/.test(q.js) &&
    /leeren\(feldGruppe\);/.test(q.js),
    'MARKEN = [] und leeren(feldGruppe) in bauen()');
  p('Die Hervorhebung wird beim Neubau geloescht',
    /leeren\(feldGruppe\);[\s\S]{0,300}?feldWach = null;/.test(q.js),
    'sonst leuchtet ein Feld, das es nicht mehr gibt');
  p('Das Dachfeld entsteht nach dem Bau',
    /markeDach\(\);\s*\n\s*markenAufbauen\(\);/.test(q.js),
    'markeDach() + markenAufbauen() am Ende von bauen()');
  p('Der Schalter schaltet die Felder wirklich ab',
    /var soll = Z\.markenZeigen \? MARKEN\.length : 0;/.test(q.js) &&
    /feldGruppe\.visible = !!Z\.markenZeigen;/.test(q.js),
    'Liste und Flaechen richten sich nach Z.markenZeigen');
  p('Der Schalter in der Leiste zeichnet neu',
    /if \(!Z\.markenZeigen\) feldWach = null;\s*\n\s*feldFaerben\(\);[\s\S]{0,400}?neuZeichnen\(\);/.test(q.js),
    'sonst bliebe das letzte Bild stehen');
  p('Felder sind voreingestellt AN',
    /markenZeigen: true,/.test(q.js), 'Z.markenZeigen');

  /* Der Sprung muss in einen Bereich fuehren, den es gibt. Die Namen
     werden aus BEREICHE gelesen, nicht hier wiederholt – sonst stehen
     zwei Wahrheiten im Projekt. */
  var bereich = q.js.slice(q.js.indexOf('var BEREICHE = ['));
  bereich = bereich.slice(0, bereich.indexOf('\n  ];'));
  var sprung = (q.js.match(/var schritt = \(m\.art === 'dach'\) \? '([a-z]+)' : '([a-z]+)';/) || []);
  p('Beide Sprungziele stehen in BEREICHE',
    sprung.length === 3 &&
    bereich.indexOf("'" + sprung[1] + "'") > -1 &&
    bereich.indexOf("'" + sprung[2] + "'") > -1,
    sprung.length === 3 ? sprung[2] + ' / ' + sprung[1] : 'Sprungziele nicht gefunden');

  /* ---------- Die Flaeche liegt IN der Ebene ihres Feldes ----------
     Das ist der Kern der zweiten Bauart. „bleiben nicht flach wie
     dieses Feld immer stehen … wie als waere das eine Wand"
     (Betreiber, 31.10.2026). Eine PlaneGeometry schaut von sich aus
     nach +z; gedreht wird sie auf die Flaechenrichtung n des Feldes.
     Steht das nicht im Quelltext, liegt die Flaeche quer zum Feld. */
  p('Die Flaeche wird auf die Richtung ihres Feldes gedreht',
    /o\.quaternion\.setFromUnitVectors\(FELD_VOR, feldRichtung\);/.test(q.js) &&
    /feldRichtung\.set\(marke\.n\.x, marke\.n\.y, marke\.n\.z\)/.test(q.js),
    'Quaternion aus der Flaechenrichtung, nicht rotation.y');

  /* NICHTS darf sich zur Kamera drehen - genau das war die Beschwerde.
     THREE.Sprite ist die Bauart, die das von sich aus tut. */
  var vonFeld = q.js.indexOf('function feldFlaeche(');
  var feldCode = vonFeld > -1 ? q.js.slice(vonFeld, q.js.indexOf('\n  }', q.js.indexOf('feldGruppe.add(z);'))) : '';
  p('Kein Teil der Felder dreht sich zur Kamera',
    vonFeld > -1 && feldCode.indexOf('Sprite') < 0 &&
    feldCode.indexOf('PlaneGeometry') > -1,
    'feldFlaeche() baut Flaechen, keine Sprites');

  /* ---------- Das Zeichen kommt aus dem eigenen Zeichensatz ----------
     „nur das alte design von den + hat mir mehr gefallen und am dach
     is kein + sondern ein pfeil es soll ein + oder wie damals stift
     sein" (Betreiber, 31.10.2026). Von Hand gemalt geriet der Stift zu
     einem Pfeil. Die Umrisse kommen deshalb aus DEMSELBEN Sprite, das
     auch die Knopfliste benutzt - sonst gibt es zwei Wahrheiten. */
  p('Das Zeichen kommt aus dem Sprite, nicht aus der Hand',
    /getElementById\('bvs-' \+ name\)/.test(q.js) &&
    /g\.stroke\(new Path2D\(u\.d\[i\]\)\)/.test(q.js),
    'symbolUmriss() liest die Pfade aus konfigurator.html');
  p('Welches Zeichen, entscheidet eine einzige Regel',
    /map: feldBild\(markenZeichen\(marke\)\)/.test(q.js),
    'markenZeichen() - dieselbe Regel wie in der Knopfliste');
  p('Die beiden Zeichen stehen im Sprite',
    /<symbol id="bvs-punkt"[^>]*>[\s\S]{0,200}?<\/symbol>/.test(q.html) &&
    /<symbol id="bvs-stift"[^>]*>[\s\S]{0,200}?<\/symbol>/.test(q.html),
    'bvs-punkt und bvs-stift');

  p('Flaeche und Zeichen zeigen auf ihr Feld',
    /f\.userData\.feldMarke = marke;/.test(q.js) &&
    /z\.userData\.feldMarke = marke;/.test(q.js),
    'userData.feldMarke – daran findet der Klick sein Ziel');

  /* „passt mach die + 1/3 kleiner" (Betreiber, 01.11.2026). Verkleinert
     wird das ERGEBNIS, also auch die beiden Grenzen - würde nur geteilt,
     bliebe ein kleines Feld bei den alten 14 cm stehen. Auf die Bedienung
     wirkt sich das nicht aus: Angeklickt wird die ganze Feldfläche. */
  /* ---------- Kraeftig und scharf ----------
     „Ich will die runden Pluszeichen, die Farbe doch etwas kraeftiger
     haben, dass man es besser sieht … und nicht so duenne Linien"
     (Betreiber, 01.11.2026). Drei Dinge zahlen darauf ein, und jedes
     laesst sich einzeln wieder kaputtmachen. */
  p('Die Scheibe ist voll deckend',
    /g\.fillStyle = belegt \? '#C49A2A' : '#FFFFFF';/.test(q.js),
    'durchsichtig nahm sie die Farbe des Hintergrunds an');
  p('Die Linien sind kraeftig',
    /g\.lineWidth = 4\.2;/.test(q.js),
    'Strich 4,2 statt 2,3 - die 2,3 stammten aus dem 24-px-Knopf');
  /* „dünnere Ränder" (Betreiber, 01.11.2026): 13 verschluckte die
     Scheibe. Die Linien IM Zeichen bleiben kraeftig. */
  p('Der Rand ist schmal',
    /g\.strokeStyle = '#9A7318'; g\.lineWidth = 8; g\.stroke\(\);/.test(q.js),
    'Ring 8 statt 13');
  p('Das Zeichen bleibt beim Verkleinern scharf',
    /t\.generateMipmaps = false;/.test(q.js) &&
    /t\.minFilter = THREE\.LinearFilter;/.test(q.js),
    'ohne das rechnet three.js die Scheibe Stufe fuer Stufe weich');
  p('Das Zeichen wird fein genug gezeichnet',
    /var K = 256, M = K \/ 2;/.test(q.js),
    '256 Bildpunkte Kantenlaenge');

  p('Das Zeichen hat ein Mindest- und ein Hoechstmass',
    /var gr = Math\.max\(14, Math\.min\(34, Math\.min\(laenge, hoehe\) \/ 3\)\) \*\s*\n\s*FELD_ZEICHEN_ANTEIL;/.test(q.js),
    'ein Drittel der kurzen Seite, gedeckelt auf 14 bis 34 cm');
  p('Das Zeichen ist um ein Drittel kleiner',
    /var FELD_ZEICHEN_ANTEIL = 2 \/ 3;/.test(q.js),
    'zwei Drittel der früheren Groesse, also 9,3 bis 22,7 cm');

  p('Die Flaeche schneidet nicht weg, was dahinter liegt',
    /transparent: true, opacity: ruhe, depthWrite: false/.test(q.js),
    'depthWrite aus, depthTest an – das ist die Verdeckung');

  /* ---------- Nur LEERE Faecher bekommen ein Zeichen ----------
     „wenn man auf ein plus drueckt, und z.b glassschiebetuer oder was
     anderes auswaehlt soll das plus in diesem feld verschwinden samt
     der orangen durchsichtigen markierung … weil sonst wenn man
     glasschiebewand etc. ausgewaehlt hat, leuchtet das + durch und
     sieht unprofessionell aus" (Betreiber, 01.11.2026).

     Das Zeichen laedt zum HINZUFUEGEN ein - ist etwas drin, gibt es
     nichts mehr hinzuzufuegen. Geaendert wird im Bedienfeld. */
  p('Nur leere Faecher bekommen ein Zeichen',
    /if \(erwListeFeld\(m\.seite, m\.feld\)\.length === 0\) \{\s*\n\s*feldFlaeche\(marke, m\.laenge, okOben - yUnten, false\);/.test(q.js),
    'vor einer Glasschiebewand steht kein Plus mehr');
  /* Das Dach ist das einzige belegte Feld, das noch eine Flaeche
     bekommt - und die muss in Ruhe UNSICHTBAR sein. Mit FELD_RUHE laege
     ein Schleier ueber dem halben Bild. */
  p('Das Dach liegt nicht unter einem Schleier',
    /feldStoff\(belegt \? 0 : FELD_RUHE\)/.test(q.js),
    'belegt = 0 Deckkraft, nur unter dem Zeiger leuchtet es');
  p('Das Dach behaelt sein Zeichen',
    /feldFlaeche\(marke, kiste\.max\.x - kiste\.min\.x - 20, tief - 20, true\);/.test(q.js),
    'es ist immer belegt, und der Klick ist der einzige Weg in die Dachauswahl');

  p('Die leere Flaeche bleibt zurueckhaltend',
    /var FELD_RUHE   = 0\.0[0-9];/.test(q.js),
    'sie soll das Feld andeuten, nicht das Modell veraendern');

  p('Die Weltmatrix der Flaechen wird nachgezogen',
    /feldGruppe\.updateMatrixWorld\(true\);/.test(q.js),
    'sonst trifft der Strahl Flaechen im Nullpunkt');

  /* ---------- Das Dachfeld ---------- */
  p('Das Dachfeld sitzt auf der Dachflaeche, nicht ueber ihr',
    /new THREE\.Raycaster\(\s*\n?\s*new THREE\.Vector3\(m\.x, kiste\.max\.y \+ 100, m\.z\)/.test(q.js) &&
    /y = t\[0\]\.point\.y;/.test(q.js),
    'Strahl von oben auf die Mitte');
  p('Das Dachfeld liegt in der Neigung des Daches',
    /nrm\.copy\(t\[0\]\.face\.normal\)\.applyNormalMatrix\(/.test(q.js) &&
    /if \(nrm\.y < 0\.4\) nrm\.set\(0, 1, 0\);/.test(q.js),
    'Richtung aus der getroffenen Flaeche, Notbremse bei Lamellenkanten');

  /* ---------- Unter dem Zeiger ----------
     „wenn man dann mit der Maus ueber dieses Feld faehrt, dann sieht
     dieses Feld wie markiert aus … in orange durchsichtig". */
  p('Das Feld unter dem Zeiger wird orange',
    /mat\.color\.copy\(rgb\(an \? FELD_ORANGE : 0xffffff\)\);/.test(q.js) &&
    /var FELD_ORANGE = 0x[0-9A-Fa-f]{6};/.test(q.js),
    'eigene Farbe, aus dem Gold der Seite nach Orange verschoben');
  p('Das Feld unter dem Zeiger wird deutlicher, bleibt aber durchsichtig',
    /mat\.opacity = an \? FELD_WACH : mat\.userData\.ruhe;/.test(q.js) &&
    /var FELD_WACH   = 0\.[0-4][0-9]?;/.test(q.js),
    'FELD_WACH unter 0,5 – man soll durchsehen koennen');
  p('Bewegt sich die Kamera, verschwindet das Leuchten',
    /if \(feldWach\) \{ feldWach = null; feldFaerben\(\); \}/.test(q.js),
    'die Ansichtsknoepfe und das Rad schicken kein pointermove');
  p('Beim Drehen leuchtet kein Feld mit',
    /var neu = \(zieht \|\| PF_ZIEHT\) \? null : feldUnterZeiger\(e\);/.test(q.js),
    'sonst faehrt der Zeiger beim Drehen ueber das halbe Modell');
  p('Das Schweben wird gebremst gestrahlt, nicht je Bild',
    /if \(jetzt - zuletzt < 60\) return;/.test(q.js) &&
    /leinwand\.addEventListener\('pointermove'/.test(q.js),
    'hoechstens alle 60 ms und nur auf Bewegung des Zeigers');
  p('Der Zeiger zeigt am Feld, dass es anklickbar ist',
    /if \(neu\) \{ leinwand\.style\.cursor = 'pointer'; return; \}/.test(q.js),
    'sonst sieht man nicht, dass dort etwas geht');

  /* ---------- Der Klick ---------- */
  p('Der Klick aufs Feld wird ausgewertet und fuehrt ins Bedienfeld',
    /!feldGeklickt\(e\) &&/.test(q.js) &&
    /function feldGeklickt\(e\) \{[\s\S]{0,200}?markeSpringen\(m\);/.test(q.js),
    'feldGeklickt() als ERSTES in der Klickkette');
  p('Hinter einem Bauteil ist das Feld nicht anklickbar',
    /feldMarke\) return o\.userData\.feldMarke;[\s\S]{0,120}?if \(nimmtDenBlick\(\[treffer\[i\]\]\)\) return null;/.test(q.js),
    'was den Blick nimmt, nimmt auch den Klick');
  p('Hauswand, Vorsprung und Haustuer nehmen den Klick mit',
    /if \(wand && wand\.visible\) ziele\.push\(wand\);/.test(q.js) &&
    /if \(vorsprung && vorsprung\.visible\) ziele\.push\(vorsprung\);/.test(q.js) &&
    /if \(tuer && tuer\.visible\) ziele\.push\(tuer\);/.test(q.js),
    'sie haengen einzeln in der Szene, nicht am Bauwerk');
  p('Bei abgeschaltetem Schalter ist kein Feld anklickbar',
    /if \(!Z\.markenZeigen \|\| !feldGruppe\.children\.length/.test(q.js),
    'sonst klickte man auf etwas, das man nicht sieht');

  /* ---------- Bild und PDF ----------
     Die Flaechen sind Bedienung, kein Bauteil. Als HTML-Knoepfe fielen
     sie von selbst aus dem Bild; jetzt haengen sie in der Szene und
     muessen fuer die Aufnahme ausgeschaltet werden. */
  p('Die Flaechen bleiben aus dem gespeicherten Bild heraus',
    /feldGruppe\.visible = false;[\s\S]{0,80}?renderer\.render\(szene, kamera3\);\s*\n\s*var bild = renderer\.domElement\.toDataURL/.test(q.js),
    'bildVonAnsicht() schaltet sie vor der Aufnahme aus');
  p('Die Flaechen bleiben aus dem PDF heraus',
    /feldGruppe\.visible = false;[\s\S]{0,80}?renderer\.render\(szene, kamera3\);\s*\n\s*feldGruppe\.visible = feldVorher;/.test(q.js),
    'schuss() schaltet sie vor jeder Seite aus');

  /* ---------- Ein Maß antippen und ändern ----------
     „Die Maße sollen standartmäßig an sein … wenn man auf ein maß tippt
     oder klickt dann man z.b ne neue zahl eintragen und das ändert sich
     dann in der konfiguration" (Betreiber, 31.10.2026). */
  p('Die Maße sind voreingestellt an',
    /masseZeigen: true,/.test(q.js) &&
    /<input type="checkbox" id="k3dMasse" checked>/.test(q.html),
    'Z.masseZeigen und das Häkchen');

  p('Jedes Maßschild weiß, zu welchem Maß es gehört',
    /if \(feld\) s\.userData\.massFeld = feld;/.test(q.js) &&
    /Z\.breite \+ ' mm',\s*\n?\s*'breite'/.test(q.js) &&
    /Z\.tiefe \+ ' mm', 'tiefe'/.test(q.js) &&
    /Z\.hoehe \+ ' mm', 'hoehe'/.test(q.js),
    'breite, tiefe, hoehe');

  p('Der Klick auf ein Maß wird ausgewertet',
    /!massGeklickt\(e\) &&/.test(q.js) &&
    /strahl\.intersectObjects\(masseGruppe\.children, true\)/.test(q.js),
    'massGeklickt() in der Klickkette');

  /* Der wunde Punkt: Die neue Zahl darf NICHT am Zahlenfeld vorbei
     gesetzt werden. Dort haengt die Begrenzung auf Mindest- und
     Hoechstmass und der Neubau. Zwei Wege, die dasselbe taeten, liefen
     sonst auseinander - und eine Eingabe von 99999 mm ginge durch.
     Gemessen im Browser: 99999 wird zu 14080, dem Hoechstmass. */
  p('Die neue Zahl geht durch das Zahlenfeld, nicht daran vorbei',
    /zahl\.dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\);/.test(q.js) &&
    /MASS_FELDER = \{[\s\S]{0,400}?zahl: 'k3dBreiteZahl'/.test(q.js),
    'dort haengen Grenzen und Neubau');

  p('Der Eingabekasten steht in der Seite',
    /id="k3dMassEingabe"/.test(q.html) &&
    /id="k3dMassWert"/.test(q.html) && /id="k3dMassOk"/.test(q.html),
    'Kasten, Zahlenfeld und Übernehmen');

  /* ---------- Eigene Schalter statt der Browser-Pfeilchen ----------
     „die zahl lässt sich nicht ändern" (Betreiber, 01.11.2026, mit
     Bild). Die Pfeilchen am Zahlenfeld sind rund acht Bildpunkte hoch,
     sehen auf jedem Gerät anders aus und FEHLEN am Handy ganz - dort
     kennt type=number keine. Ob sie im Bild richtig sitzen, misst
     scripts/pruefe-konfigurator-oberflaeche.mjs. */
  p('Neben dem Zahlenfeld stehen eigene Schalter',
    /id="k3dMassMinus"/.test(q.html) && /id="k3dMassPlus"/.test(q.html) &&
    /<symbol id="bvs-strich" viewBox="0 0 24 24">/.test(q.html),
    'minus und plus aus der eigenen Sammlung');
  p('Die Schalter ändern die Zahl',
    /massHalten\(paar\[1\]\);/.test(q.js), 'pointerdown auf beiden');
  p('Die Schalter halten sich an Mindest- und Höchstmaß',
    /e\.value = String\(Math\.round\(Math\.min\(Math\.max\(v, min\), max\)\)\);/.test(q.js),
    'sonst ginge 99999 mm durch das Zahlenfeld');
  p('Gedrückt halten läuft weiter',
    /stufeTakt = setInterval\(function \(\) \{ massStufe\(richtung\); \}, 60\);/.test(q.js),
    'von 5000 auf 6000 wären es sonst hundert Klicks');
  p('Der Fokus bleibt beim Drücken im Zahlenfeld',
    /ev\.preventDefault\(\);\s*\n\s*massHalten\(paar\[1\]\);/.test(q.js),
    'sonst klappt am Handy die Tastatur zu');

  /* ---------- Groesse der Buehne ----------
     GEMESSEN am 31.10.2026: Wird die Buehne kleiner, ohne dass sich das
     Fenster aendert (am iPhone faehrt die Adressleiste beim Scrollen
     ein und aus), blieb der Zeichenpuffer der Leinwand auf der alten
     Groesse: Buehne 390 x 360, Puffer 390 x 380. Das Bild wird dann per
     CSS gedehnt - seit die Felder im Modell liegen, verzieht das das
     ganze Bild statt nur die Punkte. */
  p('Die Buehne selbst wird beobachtet, nicht nur das Fenster',
    /new ResizeObserver\(groesseGebremst\)\.observe\(leinwand\.parentNode\)/.test(q.js),
    'ResizeObserver auf der Buehne');
  p('Der Beobachter ist auf ein Bild gebremst',
    /if \(groesseLaeuft\) return;/.test(q.js) &&
    /requestAnimationFrame\(function \(\) \{\s*groesseLaeuft = false;/.test(q.js),
    'sonst rechnet er waehrend jeder Animation dutzendfach');

  /* ---------- Die Liste fuer die Tastatur ----------
     Eine Flaeche in der Szene ist kein HTML: ohne diese Liste waeren
     die Felder mit der Tabulatortaste nicht erreichbar und fuer einen
     Screenreader nicht vorhanden. Sie ist unsichtbar, aber NICHT
     display:none - sonst waere sie auch fuer die Tastatur weg. */
  var huelle = (q.html.match(/<div class="k3d-marken" id="([A-Za-z0-9]+)"><\/div>/) || []);
  p('Die Tastaturliste steht in der Seite',
    huelle.length === 2, huelle.length === 2 ? huelle[1] + ' in der Buehne' : 'keine Liste');
  p('Liste und Haekchen haben verschiedene Kennungen',
    huelle.length === 2 &&
    q.html.indexOf('id="' + huelle[1] + '"') === q.html.lastIndexOf('id="' + huelle[1] + '"') &&
    new RegExp("getElementById\\('" + huelle[1] + "'\\)").test(q.js),
    huelle.length === 2 ? huelle[1] + ' kommt genau einmal vor' : '-');
  p('Die Liste ist unsichtbar, aber nicht abgeschaltet',
    /\.k3d-marken \{[^}]*clip-path: inset\(50%\)/.test(q.html) &&
    !/\.k3d-marken \{[^}]*display: none/.test(q.html) &&
    !/class="k3d-marken"[^>]*aria-hidden/.test(q.html),
    'clip-path statt display:none – sonst waere sie auch fuer die Tastatur weg');
  p('Mit dem Fokus klappt die Liste auf',
    /\.k3d-marken:focus-within \{/.test(q.html),
    'wer mit der Tastatur arbeitet, muss sehen, wo er steht');
  p('Die Knoepfe der Liste sind erreichbar',
    /^      b\.hidden = false;$/m.test(q.js) &&
    /b\.setAttribute\('aria-label', markenBeschriftung\(m\)\);/.test(q.js),
    'nicht hidden, und jeder traegt seine Beschriftung');
  p('Haekchen und Leistenschalter sind da',
    /<input type="checkbox" id="k3dMarken" checked>/.test(q.html) &&
    /id="k3dMarkenLeiste"/.test(q.html),
    'k3dMarken + k3dMarkenLeiste');

  /* Keine Schriftzeichen als Symbol: „benutz bitte keine imogis das is
     nicht serioes benutz eigene logosammlung" (Betreiber, 31.10.2026).
     iOS macht aus ↗ ↔ ☾ von sich aus farbige Emoji - in der Liste stand
     zuerst ein getipptes Plus und ein Stift (U+270E). */
  p('Die Liste traegt gezeichnete Symbole, keine Schriftzeichen',
    /b\.innerHTML = bvSymbol\(zeichen\);/.test(q.js) &&
    !/return '\\u270e'/.test(q.js),
    'bvSymbol() aus der eigenen Sammlung');

  return e;
}

/* ---------- Normaler Durchgang ---------- */
if (!gegen) {
  console.log('\nAnklickbare Felder am Modell');
  var erg = lauf(baue(null)), rot = 0;
  erg.forEach(function (x) {
    console.log((x.ok ? '  ok      ' : '  FEHLER  ') + x.name + '   ' + x.beleg);
    if (!x.ok) rot++;
  });
  console.log('\nErgebnis: ' + (erg.length - rot) + ' bestanden, ' + rot + ' nicht bestanden');
  process.exit(rot === 0 ? 0 : 1);
}

/* ---------- Gegenprobe: jeder Fehler einzeln ---------- */
console.log('\nGegenprobe: jeder eingebaute Fehler einzeln\n');
var namen = lauf(baue(null)).map(function (x) { return x.name; });
var erwischt = namen.map(function () { return []; });
var ohneWirkung = [];
FEHLER.forEach(function (f, nr) {
  var e = lauf(baue(nr)), n = 0;
  e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(f[0]); n++; } });
  console.log('  Fehler "' + f[0] + '": ' + n + ' Pruefung(en) schlagen an');
  if (n === 0) {
    ohneWirkung.push(f[0]);
    console.log('    ACHTUNG: Dieser Fehler faellt niemandem auf.');
  }
});
console.log('');
var blind = [];
namen.forEach(function (name, i) {
  if (erwischt[i].length === 0) { blind.push(name); console.log('  BLIND   ' + name); }
  else console.log('  scharf  ' + name + '   (durch: ' + erwischt[i].join(', ') + ')');
});
console.log('\nErgebnis: ' + (namen.length - blind.length) + ' von ' + namen.length +
            ' Pruefungen schlagen an, ' + (FEHLER.length - ohneWirkung.length) +
            ' von ' + FEHLER.length + ' Fehlern werden bemerkt');
if (blind.length || ohneWirkung.length) {
  console.log('GEGENPROBE FEHLGESCHLAGEN.');
  process.exit(1);
}
console.log('Gegenprobe in Ordnung.');
process.exit(0);
