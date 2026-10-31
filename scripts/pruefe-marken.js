#!/usr/bin/env node
/* Prueft die Anklickpunkte am 3D-Modell.
 *
 * ANLASS. „kleine + marken am 3d modell, eine je seitenfeld und eine am
 * dach, klick drauf springt in den bereich der dazu gehoert" (Betreiber,
 * 31.10.2026).
 *
 * DER WUNDE PUNKT ist die LAGE. Ein Punkt, der neben seinem Feld sitzt,
 * zeigt auf das falsche Bauteil – und fuehrt dann auch in die falsche
 * Einstellung. Deshalb wird die Lage hier nicht im Quelltext nachgelesen,
 * sondern AUSGEFUEHRT: markenFelder() und markeSichtbar() werden aus
 * js/konfigurator-3d.js herausgeschnitten und mit eigenen Zahlen laufen
 * gelassen.
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
  ['Links und rechts landen auf derselben Seite', 'js',
   "liste.push({ seite: 'links', x: B / 2 - PROFIL / 2, z: f.mitte,",
   "liste.push({ seite: 'links', x: -B / 2 + PROFIL / 2, z: f.mitte,"],
  ['Nur ein Punkt je Laengsseitenfeld statt zwei', 'js',
   "      liste.push({ seite: 'rechts', x: -B / 2 + PROFIL / 2, z: f.mitte,\n                   nx: -1, nz: 0, feld: i, anzahl: felder.length });\n",
   ''],
  ['Der Unterzug teilt die Seite nicht mehr', 'js',
   '    (felder || []).forEach(function (f, i) {',
   '    (felder || []).slice(0, 1).forEach(function (f, i) {'],
  ['Punkt hinten auch bei Wandmontage', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);",
   "    quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);"],
  ['Hinten folgt den VORDEREN Pfostenachsen', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,",
   "    if (rueck) quer('hinten', achsen,"],
  ['Pfostenbreite bleibt unberuecksichtigt (Punkt im Pfosten)', 'js',
   '        var von = achsenListe[i] + PROFIL / 2;\n        var bis = achsenListe[i + 1] - PROFIL / 2;',
   '        var von = achsenListe[i];\n        var bis = achsenListe[i + 1];'],
  ['Flaechenrichtung wird nicht geprueft', 'js',
   '    return (kamPos.x - p.x) * n.x + (kamPos.y - p.y) * n.y +\n           (kamPos.z - p.z) * n.z > 0;',
   '    return true;'],
  ['Punkte werden beim Neubau nicht zurueckgesetzt', 'js',
   '    MARKEN = [];', '    void 0;'],
  ['Lage wird nicht je Bild nachgezogen', 'js',
   '      markenStellen();\n      if (frisch > 0) frisch--;',
   '      if (frisch > 0) frisch--;'],
  ['Der Dachpunkt entsteht nicht mehr', 'js',
   '    markeDach();\n    markenAufbauen();', '    markenAufbauen();'],
  ['Der Schalter wirkt nicht mehr', 'js',
   '    var soll = Z.markenZeigen ? MARKEN.length : 0;',
   '    var soll = MARKEN.length;'],
  ['Punkte sind voreingestellt AUS', 'js',
   '    markenZeigen: true,', '    markenZeigen: false,'],
  ['Der Sprung zielt auf einen Bereich, den es nicht gibt', 'js',
   "    var schritt = (m.art === 'dach') ? 'dach' : 'seiten';",
   "    var schritt = (m.art === 'dach') ? 'dachflaeche' : 'seitenwahl';"],
  ['Die Huelle faengt die Zeiger ab (Modell dreht nicht mehr)', 'html',
   '.k3d-marken { position: absolute; inset: 0; pointer-events: none; z-index: 3; }',
   '.k3d-marken { position: absolute; inset: 0; z-index: 3; }'],
  ['Die Punkte selbst sind nicht anklickbar', 'html',
   'cursor: pointer; pointer-events: auto;', 'cursor: pointer;'],
  ['Punkte zu klein zum Antippen', 'html',
   'width: 24px; height: 24px; padding: 0; border-radius: 50%;',
   'width: 14px; height: 14px; padding: 0; border-radius: 50%;'],
  ['Verdeckte Punkte werden trotzdem gezeigt', 'js',
   'if (!m || m.verdeckt || !markeSichtbar(', 'if (!m || !markeSichtbar('],
  ['Die Verdeckung wird bei jedem Bild neu gestrahlt', 'js',
   'if (!erzwingen && (!bewegt || jetzt - markenPruefZeit < 110)) return;',
   'if (false) return;'],
  ['Der geteilte Strahl bleibt begrenzt zurueck', 'js',
   "      strahl.far = Infinity;         // der geteilte Strahl gehoert allen",
   '      void 0;'],
  ['Das Haekchen im Bedienfeld fehlt', 'html',
   '<input type="checkbox" id="k3dMarken" checked>',
   '<input type="checkbox" id="k3dMarkenAnzeige" checked>'],
  ['Die Huelle ueber der Leinwand fehlt', 'html',
   '<div class="k3d-marken" id="k3dMarkenHuelle"></div>', ''],
  ['Huelle und Haekchen tragen dieselbe Kennung', 'html',
   'id="k3dMarkenHuelle"', 'id="k3dMarken"'],
  ['Die Lagefunktion ist nicht mehr auffindbar', 'js',
   'function markenFelder(B, PROFIL, felder', 'function markenFelderchen(B, PROFIL, felder'],
  ['Vorne landet an der Wand statt an der Dachvorderkante', 'js',
   "    quer('vorne', achsen, vorneZ, 1);", "    quer('vorne', achsen, hintenZ, 1);"],
  ['Hinten landet an der Vorderkante', 'js',
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    hintenZ, -1);",
   "    if (rueck) quer('hinten', achsenH && achsenH.length ? achsenH : achsen,\n                    vorneZ, -1);"],
  ['Nur das erste Pfostenfach bekommt einen Punkt', 'js',
   '      mitten.forEach(function (x, i) {',
   '      mitten.slice(0, 1).forEach(function (x, i) {'],
  ['Die Feldnummer geht verloren (Beschriftung "Feld 1 von 1")', 'js',
   '                   nx: 1, nz: 0, feld: i, anzahl: felder.length });',
   '                   nx: 1, nz: 0, feld: 0, anzahl: 1 });'],
  ['Die Buehne wird nicht mehr beobachtet', 'js',
   'new ResizeObserver(groesseGebremst).observe(leinwand.parentNode);',
   'void groesseGebremst;'],
  /* Der Aufruf selbst muss weg, nicht nur sein Kommentar - sonst
     schlaegt die Pruefung nicht an (im ersten Anlauf genau so passiert). */
  ['Die Groessenanpassung zieht die Punkte nicht nach', 'js',
   "    markenStellen();\n  }\n  window.addEventListener('resize', groesseAnpassen);",
   "  }\n  window.addEventListener('resize', groesseAnpassen);"],
  ['Der Beobachter feuert ungebremst', 'js',
   '    if (groesseLaeuft) return;', '    if (false) return;'],
  ['Punkte werden ins Bild gezeichnet statt darueber gelegt', 'js',
   "      k.className = 'k3d-marke';",
   "      k.className = 'k3d-marke'; void new THREE.Sprite();"],
  ['Punkte tragen wieder ein Schriftzeichen statt eines Symbols', 'js',
   "      b.innerHTML = bvSymbol(zeichen);", "      b.textContent = '+';"]
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
  /* Die beiden Funktionen werden herausgeschnitten und ausgefuehrt.
     Sie sind absichtlich ohne Bezug nach draussen gebaut – genau damit
     das hier moeglich ist, ohne einen Browser zu starten. */
  var a = js.match(/function markenFelder\([\s\S]*?\n  \}/);
  var b = js.match(/function markeSichtbar\([\s\S]*?\n  \}/);
  var felder = null, sichtbar = null;
  try {
    if (a) felder = new Function('return (' + a[0].replace('function markenFelder', 'function') + ');')();
    if (b) sichtbar = new Function('return (' + b[0].replace('function markeSichtbar', 'function') + ');')();
  } catch (e) { felder = null; sichtbar = null; }
  return { js: js, html: html, felder: felder, sichtbar: sichtbar };
}

/* ---------- Ein Durchgang ---------- */
var PF = 11;          // Pfostenbreite in cm (wie im Modell)
var B = 500;          // Anlagenbreite in cm
var VORNE = 389;      // Dachvorderkante in cm
var HINTEN = 0;

function lauf(q) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  if (!q.felder || !q.sichtbar) {
    p('markenFelder() und markeSichtbar() lassen sich ausfuehren', false,
      'nicht gefunden oder nicht lauffaehig');
    return e;
  }
  p('markenFelder() und markeSichtbar() lassen sich ausfuehren', true,
    'aus js/konfigurator-3d.js herausgeschnitten');

  /* Ein Feld je Laengsseite (kein Unterzug), ein Fach vorne. */
  var einFeld = [{ mitte: VORNE / 2, laenge: VORNE }];
  var achsen2 = [-B / 2 + PF / 2, B / 2 - PF / 2];
  var a = q.felder(B, PF, einFeld, VORNE, HINTEN, achsen2, null, false);
  function nur(liste, seite) {
    return liste.filter(function (m) { return m.seite === seite; });
  }
  p('Ohne Unterzug: ein Punkt links und einer rechts',
    nur(a, 'links').length === 1 && nur(a, 'rechts').length === 1,
    nur(a, 'links').length + ' links, ' + nur(a, 'rechts').length + ' rechts');

  p('Links liegt bei +x, rechts bei -x (wie eineSeite baut)',
    nur(a, 'links')[0] && nur(a, 'rechts')[0] &&
    nur(a, 'links')[0].x === B / 2 - PF / 2 &&
    nur(a, 'rechts')[0].x === -B / 2 + PF / 2,
    nur(a, 'links')[0] ? 'links x = ' + nur(a, 'links')[0].x + ' cm' : 'kein Punkt links');

  p('Vorne liegt der Punkt an der Dachvorderkante',
    nur(a, 'vorne').length === 1 && nur(a, 'vorne')[0].z === VORNE,
    nur(a, 'vorne').length ? 'z = ' + nur(a, 'vorne')[0].z + ' cm' : 'kein Punkt vorne');

  p('Bei Wandmontage gibt es hinten keinen Punkt',
    nur(a, 'hinten').length === 0, nur(a, 'hinten').length + ' Punkte hinten');

  /* Unterzug mittig: die Laengsseite zerfaellt in zwei Felder. */
  var zwei = [{ mitte: 95, laenge: 190 }, { mitte: 290, laenge: 190 }];
  var b2 = q.felder(B, PF, zwei, VORNE, HINTEN, achsen2, null, false);
  p('Mit Unterzug: zwei Punkte links und zwei rechts',
    nur(b2, 'links').length === 2 && nur(b2, 'rechts').length === 2,
    nur(b2, 'links').length + ' links, ' + nur(b2, 'rechts').length + ' rechts');
  p('Jeder Punkt sitzt in der Mitte SEINES Feldes',
    nur(b2, 'links')[0] && nur(b2, 'links')[1] &&
    nur(b2, 'links')[0].z === 95 && nur(b2, 'links')[1].z === 290,
    nur(b2, 'links').map(function (m) { return m.z; }).join(' / ') + ' cm');

  /* Drei Pfosten vorne, zwei hinten (Statiktraeger), freistehend. */
  var achsen3 = [-B / 2 + PF / 2, 0, B / 2 - PF / 2];
  var c = q.felder(B, PF, einFeld, VORNE, HINTEN, achsen3, achsen2, true);
  p('Vorne ein Punkt je Pfostenfach',
    nur(c, 'vorne').length === 2,
    nur(c, 'vorne').length + ' Punkte bei 3 Pfostenachsen');
  p('Hinten folgen die Punkte den HINTEREN Pfosten (Statiktraeger)',
    nur(c, 'hinten').length === 1,
    nur(c, 'hinten').length + ' Punkte hinten bei 2 hinteren Achsen, 3 vorne');
  p('Hinten liegt der Punkt bei z = 0 (Wandebene)',
    nur(c, 'hinten')[0] && nur(c, 'hinten')[0].z === HINTEN,
    nur(c, 'hinten')[0] ? 'z = ' + nur(c, 'hinten')[0].z + ' cm' : 'kein Punkt hinten');

  /* Zwei Pfosten dicht an dicht: dort ist kein lichtes Mass.
     Die MITTE zweier Achsen ist von der Pfostenbreite unabhaengig – an
     der Lage laesst sich das lichte Mass deshalb gar nicht ablesen. Was
     sich ablesen laesst: ob das enge Fach ueberhaupt einen Punkt bekommt,
     und ob ein Punkt in einem Pfosten steckt. (Eine Pruefung auf die
     Mitte stand hier zuerst und konnte nie anschlagen.) */
  var engeAchsen = [-B / 2 + PF / 2, -B / 2 + PF / 2 + PF, B / 2 - PF / 2];
  var eng = q.felder(B, PF, einFeld, VORNE, HINTEN, engeAchsen, null, false);
  p('Ein Fach ohne lichtes Mass bekommt keinen Punkt',
    nur(eng, 'vorne').length === 1,
    nur(eng, 'vorne').length + ' statt 2 – das enge Fach faellt weg');
  var imPfosten = nur(eng, 'vorne').filter(function (m) {
    return engeAchsen.some(function (ax) { return Math.abs(m.x - ax) <= PF / 2; });
  });
  p('Kein Punkt steckt in einem Pfosten',
    nur(eng, 'vorne').length > 0 && imPfosten.length === 0,
    imPfosten.length + ' von ' + nur(eng, 'vorne').length + ' zu nah an einer Achse');

  /* Jeder Punkt traegt die Nummer seines Feldes und die Gesamtzahl –
     daraus entsteht die Beschriftung „Feld 2 von 2". */
  p('Jeder Punkt kennt seine Feldnummer und die Gesamtzahl',
    nur(b2, 'links').every(function (m, i) { return m.feld === i && m.anzahl === 2; }),
    'links: ' + nur(b2, 'links').map(function (m) {
      return (m.feld + 1) + '/' + m.anzahl; }).join(', '));

  /* ---------- Was abgewandt ist, wird nicht gezeigt ---------- */
  var pl = { x: B / 2 - PF / 2, y: 130, z: 200 };
  var nl = { x: 1, y: 0, z: 0 };
  p('Der linke Punkt ist von links sichtbar und von rechts nicht',
    q.sichtbar(nl, pl, { x: 900, y: 300, z: 200 }) === true &&
    q.sichtbar(nl, pl, { x: -900, y: 300, z: 200 }) === false,
    'Skalarprodukt der Flaechenrichtung');
  p('Der Dachpunkt ist von oben sichtbar und von unten nicht',
    q.sichtbar({ x: 0, y: 1, z: 0 }, { x: 0, y: 280, z: 200 },
               { x: 0, y: 900, z: 400 }) === true &&
    q.sichtbar({ x: 0, y: 1, z: 0 }, { x: 0, y: 280, z: 200 },
               { x: 0, y: 100, z: 400 }) === false,
    'Ansicht „Darunter" zeigt ihn nicht');

  /* ---------- Einbau im Quelltext ---------- */
  p('Die Punkte werden bei jedem Neubau zurueckgesetzt',
    /leeren\(bau\);[\s\S]{0,400}?MARKEN = \[\];/.test(q.js),
    'MARKEN = [] in bauen()');
  p('Die Lage wird je gezeichnetes Bild nachgezogen',
    /renderer\.render\(szene, kamera3\);[\s\S]{0,500}?markenStellen\(\);/.test(q.js),
    'markenStellen() in zeichnen()');
  p('Der Dachpunkt entsteht nach dem Bau',
    /markeDach\(\);\s*\n\s*markenAufbauen\(\);/.test(q.js),
    'markeDach() + markenAufbauen() am Ende von bauen()');
  p('Der Schalter schaltet die Punkte wirklich ab',
    /var soll = Z\.markenZeigen \? MARKEN\.length : 0;/.test(q.js),
    'markenAufbauen() richtet sich nach Z.markenZeigen');
  p('Punkte sind voreingestellt AN',
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

  /* ---------- Oberflaeche ---------- */
  /* Die Kennung der Huelle darf NICHT die des Haekchens sein: Zwei
     Elemente mit derselben Kennung, und getElementById nimmt das erste
     im Dokument – die Punkte landen dann im Haekchen statt ueber der
     Leinwand. Genau das ist am 31.10.2026 passiert. */
  var huelle = (q.html.match(/<div class="k3d-marken" id="([A-Za-z0-9]+)"><\/div>/) || []);
  p('Die Huelle liegt ueber der Leinwand',
    huelle.length === 2, huelle.length === 2 ? huelle[1] + ' in der Buehne' : 'keine Huelle');
  p('Huelle und Haekchen haben verschiedene Kennungen',
    huelle.length === 2 &&
    q.html.indexOf('id="' + huelle[1] + '"') === q.html.lastIndexOf('id="' + huelle[1] + '"') &&
    new RegExp("getElementById\\('" + huelle[1] + "'\\)").test(q.js),
    huelle.length === 2 ? huelle[1] + ' kommt genau einmal vor' : '-');
  p('Die Huelle faengt keine Zeiger ab (Modell bleibt drehbar)',
    /\.k3d-marken \{[^}]*pointer-events: none/.test(q.html),
    'pointer-events: none');
  p('Die Punkte selbst sind anklickbar',
    /\.k3d-marke \{[^}]*pointer-events: auto/.test(q.html),
    'pointer-events: auto');
  /* Verdeckte Punkte duerfen nicht gezeigt werden: Sonst klebt der
     Punkt der abgewandten Seite mitten auf einem fremden Bauteil -
     genau das hat der Betreiber am 31.10.2026 gemeldet. */
  p('Verdeckte Punkte werden ausgeblendet',
    /if \(!m \|\| m\.verdeckt \|\| !markeSichtbar\(/.test(q.js) &&
    /m\.verdeckt = strahl\.far > 0 &&/.test(q.js),
    'markenVerdeckungPruefen()');

  /* Die Pruefung darf NICHT je Bild laufen - ein Strahl je Punkt und
     Bild ist der teuerste Posten der Zeichenschleife. */
  p('Die Verdeckung wird gebremst geprueft, nicht je Bild',
    /jetzt - markenPruefZeit < 110/.test(q.js) &&
    /if \(!erzwingen && \(!bewegt/.test(q.js),
    'hoechstens alle 110 ms und nur bei bewegter Kamera');

  /* Der Strahl gehoert auch Markise, Schiebetuer und Velaris. Wer seine
     Reichweite begrenzt und nicht zuruecksetzt, bricht deren Klicks. */
  p('Der geteilte Strahl wird wieder freigegeben',
    /strahl\.far = Infinity;/.test(q.js), 'strahl.far zurueckgesetzt');

  /* ---------- Groesse der Buehne ----------
     GEMESSEN am 31.10.2026: Wird die Buehne kleiner, ohne dass sich das
     Fenster aendert (am iPhone faehrt die Adressleiste beim Scrollen
     ein und aus), blieb der Zeichenpuffer der Leinwand auf der alten
     Groesse: Buehne 390 x 360, Puffer 390 x 380. Das Bild wird dann per
     CSS gedehnt und die Punkte rechnen schon mit der neuen Groesse -
     sie liegen neben ihrem Bauteil. */
  p('Die Buehne selbst wird beobachtet, nicht nur das Fenster',
    /new ResizeObserver\(groesseGebremst\)\.observe\(leinwand\.parentNode\)/.test(q.js),
    'ResizeObserver auf der Buehne');
  p('Die Groessenanpassung zieht die Punkte sofort nach',
    /renderer\.setSize\(breite, hoehe, false\);[\s\S]{0,700}?markenStellen\(\);/.test(q.js),
    'markenStellen() in groesseAnpassen()');
  p('Der Beobachter ist auf ein Bild gebremst',
    /if \(groesseLaeuft\) return;/.test(q.js) &&
    /requestAnimationFrame\(function \(\) \{\s*groesseLaeuft = false;/.test(q.js),
    'sonst rechnet er waehrend jeder Animation dutzendfach');

  var gr = q.html.match(/\.k3d-marke \{[^}]*width: (\d+)px/);
  p('Punkte sind mindestens 24 px gross (WCAG 2.2, 2.5.8)',
    gr && Number(gr[1]) >= 24, gr ? gr[1] + ' px' : 'keine Groesse gefunden');
  p('Haekchen und Leistenschalter sind da',
    /<input type="checkbox" id="k3dMarken" checked>/.test(q.html) &&
    /id="k3dMarkenLeiste"/.test(q.html),
    'k3dMarken + k3dMarkenLeiste');

  /* Die Punkte duerfen NICHT ins Bild geraten: „Bild speichern" und das
     PDF zeichnen die Leinwand ab. Deshalb entstehen sie als HTML-Knopf –
     im Punkt-Code darf kein THREE vorkommen. */
  var auf = q.js.indexOf('function markenAufbauen()');
  var stueck = auf > -1 ? q.js.slice(auf, q.js.indexOf('\n  }', auf)) : '';
  p('Punkte sind HTML, nicht Modell (bleiben aus Bild und PDF heraus)',
    auf > -1 && stueck.indexOf('THREE') < 0 &&
    stueck.indexOf("createElement('button')") > -1,
    'markenAufbauen() ohne THREE');

  /* Keine Schriftzeichen als Symbol: „benutz bitte keine imogis das is
     nicht serioes benutz eigene logosammlung" (Betreiber, 31.10.2026).
     iOS macht aus ↗ ↔ ☾ von sich aus farbige Emoji - im Punkt stand
     zuerst ein getipptes Plus und ein Stift (U+270E). */
  p('Die Punkte tragen gezeichnete Symbole, keine Schriftzeichen',
    /b\.innerHTML = bvSymbol\(zeichen\);/.test(q.js) &&
    !/return '\\u270e'/.test(q.js),
    'bvSymbol() aus der eigenen Sammlung');

  return e;
}

/* ---------- Normaler Durchgang ---------- */
if (!gegen) {
  console.log('\nAnklickpunkte am Modell');
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
