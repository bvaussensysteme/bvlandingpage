#!/usr/bin/env node
/* Prueft die eigene Symbolsammlung im Konfigurator.
 *
 * ANLASS. „benutz bitte keine imogis das is nicht serioes benutz eigene
 * logosammlung" (Betreiber, 31.10.2026, mit Bildschirmfoto vom iPhone:
 * die Knoepfe „Teilen" und „Maße" trugen dort bunte Emoji-Kacheln).
 *
 * DER WUNDE PUNKT. Zeichen wie ↗ ↔ ☾ ⟳ ✕ ◀ ▶ sind in Unicode normale
 * Schriftzeichen - iOS stellt sie aber von sich aus als farbiges Emoji
 * dar. Auf dem Entwicklungsrechner sieht es richtig aus, am Handy nicht.
 * Diese Pruefung faellt deshalb nicht auf das Aussehen herein, sondern
 * sucht die ZEICHEN selbst, und zwar nur dort, wo sie der Besucher zu
 * sehen bekaeme.
 *
 * GEGENPROBE (--gegenprobe): Die Quelle wird beschaedigt, JEDER FEHLER
 * EINZELN; danach muss JEDE Pruefung in mindestens einem Durchgang rot
 * geworden sein.
 *
 * Aufruf:  node scripts/pruefe-symbole.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var HTML_ORIG = fs.readFileSync(__dirname + '/../konfigurator.html', 'utf8');
var JS_ORIG = fs.readFileSync(__dirname + '/../js/konfigurator-3d.js', 'utf8');
var WK_ORIG = fs.readFileSync(__dirname + '/../scripts/baue-werkstatt.js', 'utf8');
/* Die Sammlung fuer die uebrige Website und das gemeinsame Stylesheet. */
var SAM_ORIG = fs.readFileSync(__dirname + '/../js/bv-symbole.js', 'utf8');
var CSS_ORIG = fs.readFileSync(__dirname + '/../src/css/style.css', 'utf8');
/* Die Skripte, die frueher Emoji in die Seite geschrieben haben. */
var SEITEN_JS = ['cookie', 'newsletter', 'region-info', 'main', 'slider',
                 'accessibility'].map(function (d) {
  return { name: 'js/' + d + '.js',
           text: fs.readFileSync(__dirname + '/../js/' + d + '.js', 'utf8') };
});

/* Die Zeichen, die iOS zum Emoji macht. Bewusst eine LISTE und keine
   Bereichsregel: Gedankenstrich, Anfuehrungszeichen und Auslassungs-
   punkte sind Schrift und sollen bleiben. */
var EMOJI_ZEICHEN = ['\u2197', '\u2198', '\u2199', '\u2196', '\u2194', '\u2195',
  '\u263E', '\u2600', '\u27F3', '\u21BB', '\u21BA', '\u2715', '\u2716',
  '\u274C', '\u2795', '\u25B6', '\u25C0', '\u2630', '\u26F6', '\u2713',
  '\u2714', '\u270E', '\u2611', '\u2610', '\u26A0', '\u2B50'];

var FEHLER = [
  ['Emoji-Zeichen in einem Knopf der Ansichtsleiste', 'html',
   '<use href="#bvs-masse"></use></svg> Maße</button>', '</svg>\u2194 Maße</button>'],
  ['Emoji-Zeichen in einem Knopf ueber der Buehne', 'html',
   '<use href="#bvs-teilen"></use></svg> <span class="k3d-immer">Teilen',
   '</svg>\u2197 <span class="k3d-immer">Teilen'],
  ['Emoji-Zeichen im Weiter-Knopf', 'html',
   'Weiter <svg class="bvs" aria-hidden="true"><use href="#bvs-rechts"></use></svg>',
   'Weiter \u25B6'],
  ['Javascript schreibt wieder ein Schriftzeichen in die Oberflaeche', 'js',
   "if (sym) sym.innerHTML = bvSymbol(Z.abend ? 'tag' : 'abend');",
   "if (sym) sym.textContent = Z.abend ? '\u2600' : '\u263E';"],
  ['Ein Symbol wird benutzt, das es im Sprite nicht gibt', 'html',
   '<symbol id="bvs-masse"', '<symbol id="bvs-massband"'],
  ['Ein Symbol liegt ungenutzt im Sprite', 'html',
   '<use href="#bvs-menue"></use>', '<use href="#bvs-teilen"></use>'],
  ['Das Sprite fehlt ganz', 'html',
   '<symbol id="bvs-teilen"', '<symbol id="unbenutzt-teilen"'],
  ['Ein Symbol wird benutzt, bevor das Sprite im Dokument steht', 'html',
   '<!-- ---------- Eigene Symbolsammlung ----------',
   '<svg class="bvs"><use href="#bvs-menue"></use></svg>\n<!-- ---------- Eigene Symbolsammlung ----------'],
  ['Die Symbole nehmen die Schriftfarbe nicht an', 'html',
   'stroke: currentColor;', 'stroke: #c8a04a;'],
  ['Ein Symbol bringt fremde Bilddaten mit', 'html',
   '<symbol id="bvs-haken" viewBox="0 0 24 24">',
   '<symbol id="bvs-haken" viewBox="0 0 24 24"><image href="data:image/png;base64,AAAA"/>'],
  ['Einem Symbol fehlt die viewBox', 'html',
   '<symbol id="bvs-punkt" viewBox="0 0 24 24">', '<symbol id="bvs-punkt">'],
  ['Das Cookie-Banner traegt wieder ein Emoji', 'seiten',
   "'<div class=\"cb-icon\">' + (window.bvSymbol ? window.bvSymbol('kekse') : '') + '</div>' +",
   "'<div class=\"cb-icon\">\ud83c\udf6a</div>' +"],
  ['Ein Symbol der Sammlung fehlt', 'sam', '    lupe:', '    lupeAlt:'],
  ['Die Sammlung gibt bei unbekanntem Namen etwas aus', 'sam',
   "    if (!d) return '';", "    if (!d) return '?';"],
  ['Die Symbole nehmen im Stylesheet die Schriftfarbe nicht an', 'css',
   'fill: none; stroke: currentColor; stroke-width: 1.9;',
   'fill: none; stroke: #c8a04a; stroke-width: 1.9;'],
  ['Die Lupe am Galeriebild ist wieder ein Emoji', 'css',
   "  content: '';\n  background-image: url(\"data:image/svg+xml,", "  content: '\ud83d\udd0d';\n  background-image: url(\"data:image/svg+xml,"],
  ['Die Werkstatt-Leiste traegt wieder ein Schriftzeichen', 'wk',
   "'<use href=\"#bvs-neuladen\"></use></svg> Neu laden</button>',",
   "'\\u21bb Neu laden</button>',"]
];

function baue(nr) {
  var q = { html: HTML_ORIG, js: JS_ORIG, wk: WK_ORIG, sam: SAM_ORIG,
            css: CSS_ORIG,
            seiten: SEITEN_JS.map(function (x) {
              return { name: x.name, text: x.text }; }) };
  if (nr == null) return q;
  var f = FEHLER[nr];
  if (f[1] === 'seiten') {
    var getroffen = 0;
    q.seiten.forEach(function (x) {
      if (x.text.indexOf(f[2]) > -1) { x.text = x.text.replace(f[2], f[3]); getroffen++; }
    });
    if (!getroffen) {
      console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
      process.exit(2);
    }
    return q;
  }
  if (q[f[1]].indexOf(f[2]) < 0) {
    console.error('FEHLER: Gegenprobe "' + f[0] + '" findet ihre Stelle nicht mehr.');
    process.exit(2);
  }
  q[f[1]] = q[f[1]].replace(f[2], f[3]);
  return q;
}

/* Nur das, was der Besucher liest: Beschriftungen von Knoepfen, Links
   und Ueberschriften. Kommentare und Fliesstext bleiben aussen vor -
   dort stehen die Zeichen absichtlich, naemlich in der Begruendung. */
function sichtbarerText(html) {
  var ohneKommentar = html.replace(/<!--[\s\S]*?-->/g, '')
                          .replace(/<style[\s\S]*?<\/style>/g, '')
                          .replace(/<script[\s\S]*?<\/script>/g, '');
  var stuecke = [];
  var re = /<(button|a|h1|h2|h3|summary|label)\b[^>]*>([\s\S]*?)<\/\1>/g, m;
  while ((m = re.exec(ohneKommentar))) stuecke.push(m[2].replace(/<[^>]*>/g, ''));
  return stuecke.join('\n');
}

function lauf(q) {
  var e = [];
  function p(name, bed, beleg) { e.push({ name: name, ok: !!bed, beleg: beleg }); }

  /* ---------- Keine Emoji-Zeichen in der Oberflaeche ---------- */
  var text = sichtbarerText(q.html);
  var treffer = EMOJI_ZEICHEN.filter(function (z) { return text.indexOf(z) > -1; });
  p('Keine Emoji-Zeichen in Beschriftungen (konfigurator.html)',
    treffer.length === 0,
    treffer.length ? treffer.map(function (z) {
      return 'U+' + z.charCodeAt(0).toString(16).toUpperCase(); }).join(' ')
      : EMOJI_ZEICHEN.length + ' Zeichen geprueft');

  /* Im Javascript zaehlt nur, was in die Seite GESCHRIEBEN wird. */
  var schreibt = (q.js.match(/(?:textContent|innerHTML)\s*=\s*[^;]*/g) || []).join('\n') +
                 '\n' + (q.js.match(/return\s*'\\u[0-9a-f]{4}'/g) || []).join('\n');
  var trefferJs = EMOJI_ZEICHEN.filter(function (z) {
    var esc = '\\u' + ('000' + z.charCodeAt(0).toString(16)).slice(-4);
    return schreibt.indexOf(z) > -1 || schreibt.toLowerCase().indexOf(esc) > -1;
  });
  p('Javascript schreibt keine Emoji-Zeichen in die Oberflaeche',
    trefferJs.length === 0,
    trefferJs.length ? trefferJs.map(function (z) {
      return 'U+' + z.charCodeAt(0).toString(16).toUpperCase(); }).join(' ')
      : 'textContent und innerHTML geprueft');

  /* ---------- Die uebrige Website ----------
     Hier zaehlt wieder nur, was in die Seite GESCHRIEBEN wird. Die
     Begruendung im Kommentar darf die Zeichen nennen - sonst koennte
     niemand nachlesen, worum es ging. */
  var EMOJI_BUNT = ['\ud83c\udf6a', '\ud83c\udf81', '\ud83d\udccd',
    '\ud83d\udd0d', '\u2705', '\u274c', '\u2699', '\u23f8', '\u21ba',
    '\u2b50', '\ud83d\udee0', '\ud83d\udcf1'];
  var schmutzig = [];
  q.seiten.forEach(function (d) {
    var ohne = d.text.replace(/\/\*[\s\S]*?\*\//g, '');
    EMOJI_BUNT.forEach(function (z) {
      if (ohne.indexOf(z) > -1 && schmutzig.indexOf(d.name) < 0) schmutzig.push(d.name);
    });
  });
  p('Kein Emoji mehr in den Skripten der Website', schmutzig.length === 0,
    schmutzig.length ? schmutzig.join(', ') : SEITEN_JS.length + ' Dateien geprueft');

  p('Die Sammlung fuer die Website ist vollstaendig',
    ['kekse', 'geschenk', 'haken', 'kreuz', 'ort', 'lupe', 'pause',
     'abspielen', 'zuruecksetzen', 'zahnrad'].every(function (nm) {
      return new RegExp('^\\s*' + nm + ':', 'm').test(q.sam);
    }), 'js/bv-symbole.js');

  /* Ein unbekannter Name darf NICHTS liefern, kein Fragezeichen und
     keinen Platzhalter: Lieber nichts als ein falsches Bild neben einer
     Anfrage. */
  p('Unbekannter Name liefert nichts statt eines Platzhalters',
    /if \(!d\) return '';/.test(q.sam), 'bvSymbol()');

  p('Die Lupe am Galeriebild ist gezeichnet, kein Emoji',
    /\.galerie-item:not\(\.galerie-placeholder\)::after \{\s*content: '';/.test(q.css) &&
    !/content: '\ud83d\udd0d'/.test(q.css), 'src/css/style.css');

  p('Das Stylesheet traegt die Einbettungsregel',
    /\.bvs\s*\{[^}]*stroke:\s*currentColor/.test(q.css), '.bvs in style.css');

  p('Die Werkstatt-Leiste nutzt das Symbol',
    /#bvs-neuladen/.test(q.wk) && !/\\u21bb/i.test(q.wk),
    'baue-werkstatt.js');

  /* ---------- Sprite und Verwendung passen zusammen ---------- */
  var def = (q.html.match(/<symbol id="(bvs-[a-z-]+)"/g) || [])
    .map(function (x) { return x.replace(/.*"(bvs-[a-z-]+)".*/, '$1'); });
  var benutztRoh = (q.html + q.js + q.wk).match(/#(bvs-[a-z-]+)/g) || [];
  var benutzt = {};
  benutztRoh.forEach(function (x) { benutzt[x.slice(1)] = true; });
  /* Javascript setzt den Namen zusammen. Das kann einfach sein -
     bvSymbol('punkt') - oder eine Entscheidung enthalten:
     bvSymbol(Z.abend ? 'tag' : 'abend'). Deshalb werden ALLE Namen in
     Anfuehrungszeichen innerhalb eines bvSymbol-Aufrufs gezaehlt; sonst
     galten 'tag' und 'auf' faelschlich als ungenutzt. */
  (q.js.match(/bvSymbol\([^)]*\)/g) || []).forEach(function (aufruf) {
    (aufruf.match(/'([a-z-]+)'/g) || []).forEach(function (w) {
      benutzt['bvs-' + w.replace(/'/g, '')] = true;
    });
  });
  (q.js.match(/return '([a-z]+)';/g) || []).forEach(function (x) {
    var w = x.replace(/.*'([a-z]+)'.*/, '$1');
    if (def.indexOf('bvs-' + w) > -1) benutzt['bvs-' + w] = true;
  });

  /* Das Sprite muss VOR der ersten Verwendung stehen. Browser loesen
     ein <use> zwar auch auf ein spaeter folgendes <symbol> auf, aber
     nicht zuverlaessig waehrend des Aufbaus - dann blitzt an der Stelle
     kurz nichts auf. Geprueft wird deshalb die Reihenfolge, nicht nur
     das Vorhandensein. (Eine blosse Zaehlung stand hier zuerst und
     konnte in der Gegenprobe nie anschlagen.) */
  var spriteAb = q.html.indexOf('<symbol id="bvs-');
  var ersteNutzung = q.html.indexOf('<use href="#bvs-');
  p('Das Sprite steht vor der ersten Verwendung',
    def.length >= 10 && spriteAb > -1 &&
    (ersteNutzung === -1 || spriteAb < ersteNutzung),
    def.length + ' Symbole, Sprite bei Zeichen ' + spriteAb +
    ', erste Verwendung bei ' + ersteNutzung);

  var fehlend = Object.keys(benutzt).filter(function (k) { return def.indexOf(k) < 0; });
  p('Jedes benutzte Symbol gibt es im Sprite', fehlend.length === 0,
    fehlend.length ? fehlend.join(', ') : Object.keys(benutzt).length + ' benutzt');

  var tot = def.filter(function (k) { return !benutzt[k]; });
  p('Kein Symbol liegt ungenutzt herum', tot.length === 0,
    tot.length ? tot.join(', ') : 'alle ' + def.length + ' im Einsatz');

  /* ---------- Die Symbole selbst ---------- */
  var bloecke = q.html.match(/<symbol id="bvs-[a-z-]+"[\s\S]*?<\/symbol>/g) || [];
  var ohneBox = bloecke.filter(function (b) { return b.indexOf('viewBox=') < 0; });
  p('Jedes Symbol hat eine viewBox', bloecke.length > 0 && ohneBox.length === 0,
    ohneBox.length ? ohneBox.length + ' ohne' : bloecke.length + ' geprueft');

  /* Eigene Pfade, nichts Fremdes: kein eingebettetes Bild, keine
     nachgeladene Datei. Sonst waere es keine eigene Sammlung mehr. */
  var fremd = bloecke.filter(function (b) {
    return /<image|xlink:href="(?!#)|url\(|data:/.test(b);
  });
  p('Die Symbole sind eigene Pfade, keine fremden Bilddaten',
    fremd.length === 0, fremd.length ? fremd.length + ' mit Fremddaten' : 'nur Pfade');

  p('Die Symbole nehmen Farbe und Groesse der Schrift an',
    /\.bvs\s*\{[^}]*stroke:\s*currentColor/.test(q.html) &&
    /\.bvs\s*\{[^}]*width:\s*[\d.]+em/.test(q.html),
    'currentColor und em-Groesse');

  return e;
}

if (!gegen) {
  console.log('\nEigene Symbolsammlung');
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
  var e = lauf(baue(nr)), z = 0;
  e.forEach(function (x, i) { if (!x.ok) { erwischt[i].push(f[0]); z++; } });
  console.log('  Fehler "' + f[0] + '": ' + z + ' Pruefung(en) schlagen an');
  if (z === 0) { ohneWirkung.push(f[0]); console.log('    ACHTUNG: faellt niemandem auf.'); }
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
