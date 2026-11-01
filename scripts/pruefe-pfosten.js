#!/usr/bin/env node
/* Prueft die verschiebbaren Zwischenpfosten.
 *
 * ANLASS. „kann man ausser die eckpfosten die zwischenpfosten
 * verschieben innerhalb den erlaubten toleranzen" (Betreiber,
 * 01.11.2026). Gewaehlt wurde: Grenze aus der eigenen Masstabelle
 * herleiten, Bedienung durch Ziehen am Modell plus Zahl im Bedienfeld.
 *
 * DER WUNDE PUNKT ist die TOLERANZ. Ein Pfosten, der zu weit steht,
 * faellt im Bild nicht auf - er faellt beim Aufbau auf, und dann ist er
 * teuer. Deshalb steht hier der Zufallsversuch an erster Stelle: 4000
 * Faelle mit zufaelligen Wuenschen, und JEDES Feld muss danach in der
 * Toleranz liegen.
 *
 * GENAU DARAN ist die erste Fassung gescheitert. Sie hat jeden Pfosten
 * der Reihe nach zwischen seine Nachbarn geklemmt; 1413 von 4000
 * Faellen endeten ausserhalb, im schlimmsten Fall mit einem Feld von
 * 1458 mm bei erlaubten 2195 mm. Gerechnet wird jetzt in Feldbreiten.
 * Die Pruefung bleibt, damit dieser Weg nicht zurueckkommt.
 *
 * WAS HIER NICHT GEPRUEFT WERDEN KANN: ob sich der Pfosten im Browser
 * wirklich greifen und ziehen laesst, und ob die Kamera dabei still
 * haelt. Dafuer gibt es die Pruefungen in
 * scripts/pruefe-konfigurator-oberflaeche.mjs.
 *
 * GEGENPROBE (--gegenprobe): Es wird nicht das Kriterium aufgeweicht,
 * sondern die Quelle beschaedigt - JEDER FEHLER EINZELN.
 *
 * Aufruf:  node scripts/pruefe-pfosten.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var JS_ORIG = fs.readFileSync(__dirname + '/../js/konfigurator-3d.js', 'utf8');
var HTML_ORIG = fs.readFileSync(__dirname + '/../konfigurator.html', 'utf8');

var FEHLER = [
  /* ---------- Toleranz herleiten ---------- */
  ['Die gleichmaessige Verteilung faellt aus der Spanne', 'js',
   '    return { min: Math.min(min, jetzt), max: Math.max(max, jetzt) };',
   '    return { min: min, max: max };'],
  ['Die Spanne wird aus der Breite statt aus dem Achsmass gerechnet', 'js',
   '    var min = (minB - pfMm) / (anzahl - 1);',
   '    var min = minB / (anzahl - 1);'],
  ['Die Pfostenbreite der Reihe wird nicht beachtet', 'js',
   '    var pfMm = (randCm != null ? randCm * 2 : PFOSTEN.breite) * 10;',
   '    var pfMm = PFOSTEN.breite * 10;'],
  ['Eine Spalte mit nur einer Breite ergibt trotzdem eine Spanne', 'js',
   '    if (minB === null || maxB === minB) return null;',
   '    if (minB === null) return null;'],
  ['Die Tiefenregel wird nicht herausgerechnet', 'js',
   '    var zusatz = tb.pfosten - tb.stuetzfuesse;', '    var zusatz = 0;'],

  /* ---------- Klemmen ---------- */
  ['Geklemmt wird wieder Pfosten fuer Pfosten statt in Feldbreiten', 'js',
   '      f.push(Math.min(Math.max(xs[i + 1] - xs[i], minCm), maxCm));',
   '      f.push(xs[i + 1] - xs[i]);'],
  ['Die Gesamtbreite wird nicht wiederhergestellt', 'js',
   '      var rest = ganz - summe;', '      var rest = 0;'],
  ['Die Luft wird in die falsche Richtung gezaehlt', 'js',
   '        luft += rest > 0 ? (maxCm - f[i]) : (f[i] - minCm);',
   '        luft += rest > 0 ? (f[i] - minCm) : (maxCm - f[i]);'],
  ['Der linke Eckpfosten wandert mit', 'js',
   '    for (i = 1; i < n; i++) xs[i] = xs[i - 1] + f[i - 1];',
   '    xs[0] -= 10;\n    for (i = 1; i < n; i++) xs[i] = xs[i - 1] + f[i - 1];'],
  ['Der Versatz wird nicht geklemmt', 'js',
   '      if (gr) achsenKlemmen(xs, gr);', '      void gr;'],

  /* ---------- Spanne fuer einen einzelnen Pfosten ---------- */
  ['Die Spanne rechnet mit der gleichmaessigen statt der wirklichen Lage', 'js',
   '    var links = xs[nr - 1], rechts = xs[nr + 1];\n    if (!r.grenzen) return { von: xs[nr], bis: xs[nr], mitte: gl[nr] };',
   '    var links = gl[nr - 1], rechts = gl[nr + 1];\n    if (!r.grenzen) return { von: xs[nr], bis: xs[nr], mitte: gl[nr] };'],
  ['Nur ein Nachbar wird beachtet', 'js',
   '    var von = Math.max(links + minCm, rechts - maxCm);',
   '    var von = links + minCm;'],
  ['Eckpfosten bekommen eine Spanne', 'js',
   '    if (!r || nr < 1 || nr > r.anzahl - 2) return null;',
   '    if (!r || nr < 0 || nr > r.anzahl - 1) return null;'],
  ['Eine leere Spanne wird durchgelassen', 'js',
   '    if (bis < von) { von = gl[nr]; bis = gl[nr]; }', '    void von;'],

  /* ---------- Pfostenzahl wechselt ---------- */
  ['Der Versatz bleibt stehen, wenn die Pfostenzahl wechselt', 'js',
   '      Z.pfostenVersatz[reihe] = {};', '      void reihe;'],
  ['Die Pfostenzahl wird nicht gemerkt', 'js',
   '    PF_ANZAHL[reihe] = anzahl;', '    void anzahl;'],

  /* ---------- Ziehen am Modell ---------- */
  ['Die Pfosten tragen keine Marke mehr', 'js',
   '    if (m) m.userData.pfosten = { reihe: reihe, nr: nr };', '    void nr;'],
  ['Das Ziehen dreht wieder die Kamera mit', 'js',
   '    if (pfostenGreifen(e)) {', '    if (false) {'],
  ['Die Zeigerbewegung erreicht den Pfosten nicht', 'js',
   '    if (pfostenZiehen(e)) return;', '    void pfostenZiehen;'],
  ['Beim Loslassen wird nicht sauber neu gebaut', 'js',
   '    if (war) aendern();', '    void war;'],
  ['Der Pfosten springt mit seiner Achse unter den Zeiger', 'js',
   '    var x = bau.worldToLocal(treff).x - PF_ZIEHT.halt;',
   '    var x = bau.worldToLocal(treff).x;'],
  ['Gezogen wird auf einer festen statt einer zur Kamera zeigenden Ebene', 'js',
   '        kamera3.getWorldDirection(new THREE.Vector3()).negate(), t.punkt),',
   '        new THREE.Vector3(0, 0, 1), t.punkt),'],
  ['Der Wunsch wird beim Ziehen nicht begrenzt', 'js',
   '    x = Math.min(Math.max(x, sp.von), sp.bis);', '    void sp;'],
  ['Die gleichmaessige Lage rastet nicht mehr ein', 'js',
   '    if (Math.abs(mm) < 25) mm = 0;', '    void mm;'],
  ['Eckpfosten lassen sich greifen', 'js',
   '        if (!sp || sp.bis - sp.von < 0.2) return null;', '        if (!sp) return null;'],
  ['Ein verdeckter Pfosten laesst sich greifen', 'js',
   '        return { reihe: p.reihe, nr: p.nr, punkt: treffer[i].point };\n      }\n      if (nimmtDenBlick([treffer[i]])) return null;',
   '        return { reihe: p.reihe, nr: p.nr, punkt: treffer[i].point };\n      }\n      void treffer;'],
  ['Beim Ziehen leuchten die Feldmarken mit', 'js',
   '    var neu = (zieht || PF_ZIEHT) ? null : feldUnterZeiger(e);',
   '    var neu = zieht ? null : feldUnterZeiger(e);'],

  /* ---------- Bedienfeld ---------- */
  ['Die Reglergrenzen werden nicht nachgezogen', 'js',
   '          regler.min = Math.round((spJ.von + r.B / 2) * 10);',
   '          void spJ;'],
  ['Das lichte Mass fehlt', 'js',
   "      licht.push(Math.round(achs - pfCm * 10) + ' mm');", '      void achs;'],
  ['Der Block erscheint auch ohne Spielraum', 'js',
   '                   (r.grenzen.max - r.grenzen.min) > 1;',
   '                   true;'],
  ['Das Band beim Ziehen fehlt in der Seite', 'html',
   'id="k3dZiehband"', 'id="k3dZiehbandAlt"'],
  ['Das Band hat kein Aussehen', 'html',
   '      bottom: 140px; margin: 0; pointer-events: none; z-index: 6;',
   '      margin: 0; pointer-events: none;'],
  ['Das Band nennt nur eine der beiden Masse', 'js',
   "      Math.round(re) + ' mm · licht ' + Math.round(li - pf * 10) + ' / ' +\n" +
   "      Math.round(re - pf * 10) + ' mm'",
   "      Math.round(re) + ' mm'"],

  /* ---------- Teilen-Link und Anfrage ---------- */
  ['Der Teilen-Link vergisst die Pfostenlage', 'js',
   "    if (Object.keys(pv).length) d.pv = pv;", '    void pv;'],
  ['Der Teilen-Link liest die Pfostenlage nicht zurueck', 'js',
   "      vorne: (d.pv && d.pv.vorne && typeof d.pv.vorne === 'object') ? d.pv.vorne : {},",
   '      vorne: {},'],
  ['Der gelesene Versatz wird gleich wieder weggeraeumt', 'js',
   '    PF_ANZAHL = { vorne: 0, hinten: 0 };\n    if (d.fa) farbeSetzen(d.fa);',
   '    if (d.fa) farbeSetzen(d.fa);'],
  ['Die Anfrage nennt die Pfostenlage nicht', 'js',
   "          (pfostenNotiz().length ? ' · ' + pfostenNotiz().join(' · ') : '') +",
   "          ('') +"],
  ['Die Kurzfassung nennt die Pfostenlage nicht', 'js',
   '    pfostenNotiz().forEach(function (t) { k.push(t); });', '    void pfostenNotiz;'],
  ['achsenKlemmen() ist nicht mehr auffindbar', 'js',
   '  function achsenKlemmen(xs, gr) {', '  function achsenGeklemmt(xs, gr) {'],
  ['achsGrenzenMm() ist nicht mehr auffindbar', 'js',
   '  function achsGrenzenMm(anzahl, randCm) {',
   '  function achsGrenzen(anzahl, randCm) {'],
  ['Die obere Spanne rechnet mit der Breite statt dem Achsmass', 'js',
   '    var max = (maxB - pfMm) / (anzahl - 1);',
   '    var max = maxB / (anzahl - 1);'],
  ['Nach oben begrenzt nur ein Nachbar', 'js',
   '    var bis = Math.min(links + maxCm, rechts - minCm);',
   '    var bis = links + maxCm;'],
  ['Z kennt den Versatz nicht', 'js',
   '    pfostenVersatz: { vorne: {}, hinten: {} },',
   '    pfostenVersatzAlt: { vorne: {}, hinten: {} },'],
  ['Eine Pfostenreihe traegt keine Marke', 'js',
   "      pfostenGriff(balken(PF, lang, PF, x, yB + lang / 2, zPf, mAlu), 'vorne', iP);",
   '      balken(PF, lang, PF, x, yB + lang / 2, zPf, mAlu);'],
  ['Das Loslassen erreicht den Pfosten nicht', 'js',
   '    if (pfostenLoslassen()) return;', '    void pfostenLoslassen;'],
  ['Ein abgebrochener Zeiger laesst den Pfosten nicht los', 'js',
   "window.addEventListener('pointercancel', function () {\n    pfostenLoslassen();",
   "window.addEventListener('pointercancel', function () {"],
  ['Das Bedienfeld nennt das Achsmass nicht', 'js',
   "if (zf) zf.textContent = 'Achsmaße: ' + felder.join",
   "if (zf) zf.textContent = '' + felder.join"],
  ['Das Bedienfeld nennt die lichte Breite nicht', 'js',
   "if (zl) zl.textContent = 'lichte Breite: ' + licht.join",
   "if (zl) zl.textContent = '' + licht.join"],
  ['Die Anfrage nennt nicht, dass es Achsmasse sind', 'js',
   "aus.push('Pfosten ' + seite + ' von Achse zu Achse: ' +",
   "aus.push('Pfosten ' + seite + ': ' +"],
  ['Die Anfrage meldet auch gleichmaessige Pfosten als verschoben', 'js',
   '      if (!r || !t || !Object.keys(t).length) return;', '      if (!r) return;']
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
  /* achsenKlemmen() wird herausgeschnitten und AUSGEFUEHRT. Der
     Quelltext sagt nicht, ob eine Rechnung aufgeht - das sagt nur die
     Rechnung selbst. */
  var a = js.match(/function achsenKlemmen\([\s\S]*?\n  \}/);
  var klemmen = null;
  try {
    if (a) klemmen = new Function('return (' + a[0].replace('function achsenKlemmen', 'function') + ');')();
  } catch (e) { klemmen = null; }
  return { js: js, html: html, klemmen: klemmen };
}

/* Welche Felder liegen ausserhalb? In Millimetern, damit der Beleg
   lesbar ist. */
function ausserhalb(xs, gr) {
  var min = gr.min / 10 - 1e-6, max = gr.max / 10 + 1e-6, raus = [];
  for (var i = 0; i + 1 < xs.length; i++) {
    var d = xs[i + 1] - xs[i];
    if (d < min || d > max) raus.push('Feld ' + (i + 1) + ' = ' + (d * 10).toFixed(0) + ' mm');
  }
  return raus;
}

function lauf(q) {
  var e = [];
  function p(nm, bed, beleg) { e.push({ name: nm, ok: !!bed, beleg: beleg }); }
  function hat(nm, text, wo) {
    p(nm, (wo === 'html' ? q.html : q.js).indexOf(text) > -1, wo || 'js');
  }
  var GR = { min: 2195, max: 3645 };

  /* ---------- Das Klemmen, ausgefuehrt ---------- */
  if (!q.klemmen) {
    p('achsenKlemmen() laesst sich ausfuehren', false, 'nicht gefunden oder nicht lauffaehig');
  } else {
    p('achsenKlemmen() laesst sich ausfuehren', true, 'aus js/konfigurator-3d.js herausgeschnitten');

    /* 1. Der konstruierte Fall, an dem die erste Fassung gescheitert
       ist: Pfosten 3 steht weit links, Pfosten 1 und 2 muessen
       nachgeben. */
    var k1 = q.klemmen([0, 300, 600, 650, 1200], GR);
    p('Ein weit verschobener Pfosten zieht die Nachbarn mit in die Toleranz',
      ausserhalb(k1, GR).length === 0,
      k1.map(function (v) { return (v * 10).toFixed(0); }).join(' / ') + ' mm');

    /* 2. Gleichmaessig bleibt gleichmaessig - sonst spraenge das Modell
       schon, ohne dass jemand etwas verschoben hat. */
    var gl = [0, 300, 600, 900, 1200];
    var k2 = q.klemmen(gl.slice(), GR);
    p('Die gleichmaessige Verteilung bleibt unberuehrt',
      k2.every(function (v, i) { return Math.abs(v - gl[i]) < 1e-9; }),
      k2.map(function (v) { return (v * 10).toFixed(0); }).join(' / ') + ' mm');

    /* 3. Die Eckpfosten stehen fest. Sie sitzen buendig am Rand des
       Bauwerks; wandert einer, passt das Dach nicht mehr darauf. */
    var k3 = q.klemmen([0, 900, 400, 1200], GR);
    p('Die Eckpfosten bleiben, wo sie sind',
      Math.abs(k3[0] - 0) < 1e-9 && Math.abs(k3[k3.length - 1] - 1200) < 1e-9,
      'links ' + (k3[0] * 10).toFixed(0) + ' mm, rechts ' + (k3[k3.length - 1] * 10).toFixed(0) + ' mm');

    /* 4. DER ZUFALLSVERSUCH. 4000 Faelle, feste Folge (eigener
       Zufallsgeber), damit ein Fehlschlag nachvollziehbar bleibt. */
    var samen = 20261101;
    function zufall() {
      samen = (samen * 1103515245 + 12345) % 2147483648;
      return samen / 2147483648;
    }
    var rot = 0, ersterFehler = null, i, t;
    for (t = 0; t < 4000; t++) {
      var n = 3 + (t % 4);
      var ach = (GR.min + zufall() * (GR.max - GR.min)) / 10;
      var soll = [];
      for (i = 0; i < n; i++) soll.push(i * ach);
      var w = soll.slice();
      for (i = 1; i < n - 1; i++) w[i] += (zufall() * 800 - 400);
      var r = q.klemmen(w.slice(), GR);
      var raus = ausserhalb(r, GR);
      if (Math.abs(r[0] - soll[0]) > 1e-9 ||
          Math.abs(r[n - 1] - soll[n - 1]) > 1e-9) raus.push('Eckpfosten verschoben');
      if (raus.length) {
        rot++;
        if (!ersterFehler) {
          ersterFehler = 'Fall ' + t + ' (' + n + ' Pfosten, Achsmass ' +
            (ach * 10).toFixed(0) + ' mm): ' + raus.join(', ');
        }
      }
    }
    p('4000 Zufallsfaelle landen alle in der Toleranz', rot === 0,
      rot === 0 ? '0 von 4000 ausserhalb' : rot + ' von 4000 ausserhalb - ' + ersterFehler);
  }

  /* ---------- Toleranz herleiten ---------- */
  hat('Die Spanne wird aus der Masstabelle hergeleitet',
      'function achsGrenzenMm(anzahl, randCm) {');
  hat('Die gleichmaessige Verteilung gehoert immer zur Spanne',
      'return { min: Math.min(min, jetzt), max: Math.max(max, jetzt) };');
  hat('Gerechnet wird mit dem Profil der Reihe',
      'var pfMm = (randCm != null ? randCm * 2 : PFOSTEN.breite) * 10;');
  hat('Die Spanne zieht die Pfostenbreite ab, rechnet also Achse zu Achse',
      'var min = (minB - pfMm) / (anzahl - 1);');
  hat('Auch nach oben Achse zu Achse',
      'var max = (maxB - pfMm) / (anzahl - 1);');
  hat('Die Tiefenregel wird herausgerechnet',
      'var zusatz = tb.pfosten - tb.stuetzfuesse;');
  hat('Ohne zweite Breite in der Spalte gibt es keine Spanne',
      'if (minB === null || maxB === minB) return null;');

  /* ---------- Spanne je Pfosten ---------- */
  hat('Die Spanne haelt sich an die WIRKLICHE Lage der Nachbarn',
      'var links = xs[nr - 1], rechts = xs[nr + 1];\n    if (!r.grenzen)');
  hat('Beide Nachbarfelder begrenzen den Pfosten',
      'var von = Math.max(links + minCm, rechts - maxCm);');
  hat('Beide Nachbarfelder begrenzen ihn auch nach oben',
      'var bis = Math.min(links + maxCm, rechts - minCm);');
  hat('Eckpfosten haben keine Spanne',
      'if (!r || nr < 1 || nr > r.anzahl - 2) return null;');
  hat('Eine leere Spanne faellt auf die gleichmaessige Lage zurueck',
      'if (bis < von) { von = gl[nr]; bis = gl[nr]; }');

  /* ---------- Pfostenzahl wechselt ---------- */
  hat('Der gespeicherte Versatz laeuft durch das Klemmen',
      'if (gr) achsenKlemmen(xs, gr);');
  hat('Ein Wechsel der Pfostenzahl raeumt den Versatz weg',
      'Z.pfostenVersatz[reihe] = {};');
  hat('Die Pfostenzahl der letzten Reihe wird gemerkt',
      'PF_ANZAHL[reihe] = anzahl;');
  hat('Z kennt den Versatz', "pfostenVersatz: { vorne: {}, hinten: {} },");

  /* ---------- Ziehen am Modell ---------- */
  var marken = (q.js.match(/pfostenGriff\(balken\(/g) || []).length;
  /* SECHS STELLEN: Carport-TDS, Flatline und Terrassendach/Balkon
     bauen je eine vordere und eine hintere Reihe. Faellt eine weg,
     laesst sich dort kein Pfosten mehr greifen - und genau das sieht
     man im Quelltext nicht. */
  p('Jede Pfostenreihe im Modell traegt die Marke zum Greifen',
    marken >= 6, marken + ' Stellen mit pfostenGriff(balken(…))');
  hat('Die Marke nennt Reihe und Nummer',
      'if (m) m.userData.pfosten = { reihe: reihe, nr: nr };');
  hat('Der Griff am Pfosten hat Vorrang vor dem Drehen',
      'if (pfostenGreifen(e)) {');
  hat('Die Zeigerbewegung erreicht den Pfosten',
      'if (pfostenZiehen(e)) return;');
  hat('Das Loslassen erreicht den Pfosten',
      'if (pfostenLoslassen()) return;');
  hat('Ein abgebrochener Zeiger laesst den Pfosten los',
      "window.addEventListener('pointercancel', function () {\n    pfostenLoslassen();");
  hat('Beim Loslassen wird einmal ungebremst gebaut', 'if (war) aendern();');
  hat('Die Griffstelle am Pfosten wird beachtet',
      'var x = bau.worldToLocal(treff).x - PF_ZIEHT.halt;');
  hat('Gezogen wird auf einer zur Kamera zeigenden Ebene',
      'kamera3.getWorldDirection(new THREE.Vector3()).negate(), t.punkt),');
  hat('Der Wunsch wird beim Ziehen begrenzt',
      'x = Math.min(Math.max(x, sp.von), sp.bis);');
  hat('Die gleichmaessige Lage rastet ein', 'if (Math.abs(mm) < 25) mm = 0;');
  hat('Eckpfosten und starre Reihen lassen sich nicht greifen',
      'if (!sp || sp.bis - sp.von < 0.2) return null;');
  /* MIT DER VORZEILE: Derselbe Satz steht auch bei den Feldmarken.
     Ohne Anker wuerde dort beschaedigt und diese Pruefung blieb gruen. */
  hat('Was den Blick nimmt, nimmt auch den Griff',
      'return { reihe: p.reihe, nr: p.nr, punkt: treffer[i].point };\n      }\n' +
      '      if (nimmtDenBlick([treffer[i]])) return null;');
  hat('Beim Ziehen leuchtet keine Feldmarke mit',
      'var neu = (zieht || PF_ZIEHT) ? null : feldUnterZeiger(e);');

  /* ---------- Bedienfeld und Band ---------- */
  hat('Die Reglergrenzen werden bei jeder Aenderung nachgezogen',
      'regler.min = Math.round((spJ.von + r.B / 2) * 10);');
  hat('Das Bedienfeld nennt das Achsmass', "'Achsmaße: ' + felder.join");
  hat('Das Bedienfeld nennt die lichte Breite', "'lichte Breite: ' + licht.join");
  hat('Das lichte Mass wird wirklich gerechnet',
      "licht.push(Math.round(achs - pfCm * 10) + ' mm');");
  hat('Ohne Spielraum gibt es keinen Block',
      '(r.grenzen.max - r.grenzen.min) > 1;');
  hat('Das Band steht in der Seite', 'id="k3dZiehband"', 'html');
  hat('Das Band hat ein Aussehen',
      'bottom: 140px; margin: 0; pointer-events: none; z-index: 6;', 'html');
  hat('Das Band nennt Achsmass UND lichtes Mass',
      "' mm · licht ' + Math.round(li - pf * 10) + ' / ' +");

  /* ---------- Teilen-Link und Anfrage ---------- */
  hat('Der Teilen-Link traegt die Pfostenlage',
      'if (Object.keys(pv).length) d.pv = pv;');
  hat('Der Teilen-Link liest sie zurueck',
      "vorne: (d.pv && d.pv.vorne && typeof d.pv.vorne === 'object') ? d.pv.vorne : {},");
  /* MIT DER FOLGEZEILE: Dieselbe Zuweisung steht oben als Erklaerung
     der Variablen. Ohne Anker wuerde dort beschaedigt. */
  hat('Nach dem Lesen wird der Versatz nicht weggeraeumt',
      'PF_ANZAHL = { vorne: 0, hinten: 0 };\n    if (d.fa) farbeSetzen(d.fa);');
  hat('Die Anfrage nennt die Pfostenlage',
      "(pfostenNotiz().length ? ' · ' + pfostenNotiz().join(' · ') : '') +");
  hat('Die Kurzfassung nennt sie auch',
      'pfostenNotiz().forEach(function (t) { k.push(t); });');
  hat('Gleichmaessige Pfosten werden nicht als verschoben gemeldet',
      'if (!r || !t || !Object.keys(t).length) return;');
  hat('Gemeldet werden die Achsmasse',
      "'Pfosten ' + seite + ' von Achse zu Achse: ' +");

  return e;
}

if (!gegen) {
  console.log('\nVerschiebbare Zwischenpfosten');
  var erg = lauf(baue(null)), rot = 0;
  erg.forEach(function (x) {
    console.log((x.ok ? '  ok      ' : '  FEHLER  ') + x.name + '   ' + x.beleg);
    if (!x.ok) rot++;
  });
  console.log('\nErgebnis: ' + (erg.length - rot) + ' bestanden, ' + rot + ' nicht bestanden');
  process.exit(rot === 0 ? 0 : 1);
}

console.log('\nGegenprobe: jeder eingebaute Fehler einzeln\n');
var namen = lauf(baue(null)).map(function (x) { return x.name; });
var erwischt = namen.map(function () { return []; });
var ohneWirkung = [];
FEHLER.forEach(function (f, nr) {
  var e = lauf(baue(nr)), n = 0;
  e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(f[0]); n++; } });
  console.log('  Fehler "' + f[0] + '": ' + n + ' Pruefung(en) schlagen an');
  if (n === 0) { ohneWirkung.push(f[0]); console.log('    ACHTUNG: Dieser Fehler faellt niemandem auf.'); }
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
if (blind.length || ohneWirkung.length) { console.log('GEGENPROBE FEHLGESCHLAGEN.'); process.exit(1); }
console.log('Gegenprobe in Ordnung.');
process.exit(0);
