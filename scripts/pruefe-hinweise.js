#!/usr/bin/env node
/* Prüft die Trennung „für den Kunden" / „für uns" an allen vier Stellen,
 * an denen Text aus dem Konfigurator jemanden erreicht:
 *
 *   1. die Hinweisbox im Kasten „Was daraus folgt"  (js/bauteile.js)
 *   2. der Kasten „Ihre Konfiguration" auf der Seite (js/konfigurator-3d.js)
 *   3. die Zusammenfassung im Anfrage-Assistenten    (js/anfrage-wizard.js)
 *   4. die Anfrage-Mail an den Betrieb               (ebenda, Versandwege)
 *
 * Anlass (Betreiber, 15.10.2026): „nicht jeder hinweis hat den kunden was
 * anzugehen es stehen teilweise sachen drin die sind für uns relevant der
 * kunde kann damit nix anfangen". Vorher stand alles überall – auf der
 * Seite auch „ungeprüfte Annahme", eine Aussage darüber, was im Preis
 * enthalten ist, und der Name unseres Lieferanten.
 *
 * Zwei Wege zum selben Ergebnis: Die Texte werden einmal aus dem Quelltext
 * gelesen (jeder hin()-Aufruf) und einmal von js/bauteile.js wirklich
 * erzeugt. Nur der Quelltext findet einen Hinweis, den kein Maß auslöst;
 * nur die Erzeugung findet einen, der ohne Kennzeichnung durchfällt.
 *
 * Gegenprobe: node scripts/pruefe-hinweise.js --gegenprobe
 * Sie stellt den Stand vor dem 15.10.2026 wieder her (ein Topf, alles
 * sichtbar, ungefilterte Anzeige) – 15 der 17 Prüfungen schlagen dann an.
 * Die beiden übrigen („Alle fünf Maße liefern wirklich eine Stückliste",
 * „Jeder erzeugte Hinweis trägt ein Publikum") sind Vorbedingungen der
 * Erzeugung und lassen sich so nicht verfälschen; sie haben sich schon
 * bezahlt – mit falschen Systemnamen lief die Prüfung an null Hinweisen
 * durch und bestätigte sich selbst.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.dirname(__dirname);
const gegen = process.argv.indexOf('--gegenprobe') > -1;
let fehler = 0, ok = 0;

function pruefe(name, bedingung, beleg) {
  if (bedingung) { ok++; console.log('  ok      ' + name + '   ' + beleg); }
  else { fehler++; console.log('  FEHLER  ' + name + '   ' + beleg); }
}

let bauteileSrc = fs.readFileSync(path.join(WURZEL, 'js', 'bauteile.js'), 'utf8');
let k3dSrc = fs.readFileSync(path.join(WURZEL, 'js', 'konfigurator-3d.js'), 'utf8');
let awSrc = fs.readFileSync(path.join(WURZEL, 'js', 'anfrage-wizard.js'), 'utf8');

/* Verfälschung für die Prüfungen, die im Quelltext nachsehen: In der
   Gegenprobe wird der Stand VOR dem 15.10.2026 wiederhergestellt – also
   genau der Zustand, den diese Prüfungen künftig verhindern sollen. Eine
   Regex, die auch darauf passt, prüft nichts. */
if (gegen) {
  /* Der Vorzustand im Kern: Es gab nur einen Topf, alles war sichtbar. */
  bauteileSrc = bauteileSrc.replace(/(?:^|[^A-Za-z])hinI\(/g, ' hin(');
  k3dSrc = k3dSrc
    .replace("h.fuer !== 'intern'", "h.art !== 'raster'")
    .replace('box.innerHTML = zusammenfassungKunde()', 'box.innerHTML = zusammenfassung()')
    .replace('.map(ohneLieferant);', ';')
    .replace('notiz: zusammenfassungKurz()', 'notiz: zusammenfassung()')
    .replace('fachnotiz: zusammenfassung()', 'fachtext_weg: (function () {})()');
  awSrc = awSrc
    .replace('summaryPairs(false)', 'summaryPairs()')
    .replace(/summaryPairs\(true\)/g, 'summaryPairs()')
    .replace('if (mitFachtext && answers.fachnotiz)', 'if (answers.fachnotiz)')
    .replace('if (v.fachnotiz) answers.fachnotiz = v.fachnotiz;', '');
  /* Der NUR_INTERN-Block wird gleich per eval geholt; vor der Änderung gab
     es ihn nicht, sondern nur das eine Muster für das PDF. */
  k3dSrc = k3dSrc.replace(/var NUR_INTERN = \[[\s\S]*?\n  \]/,
    "var NUR_INTERN = [/^Gerechnet mit der nächsten lieferbaren Breite/, /^Farbe:/]");
}

/* Wörter, die auf dem Bildschirm des Kunden nichts zu suchen haben. „Preis"
   steht zusätzlich unter der Grundregel „keine Preise nach außen"
   (scripts/pruefe-keine-preise.sh deckt Zahlen ab, nicht Aussagen). */
const INTERN_WOERTER = ['Preis', 'Grundpreis', 'Annahme', 'angenommen', 'ungeprüft',
  'nicht belegt', 'Betriebsgrenze', 'Betriebsregel', 'Markierung', 'Fußnote',
  'dokumentierten', 'Montageanleitung', 'Hersteller', 'Abrechnung', 'kein Set', '**'];

function verbotenes(text) {
  return INTERN_WOERTER.filter(function (w) { return text.indexOf(w) > -1; });
}

/* ---------- 1. Quelltext: jeder Hinweis ist zugeordnet ---------- */
console.log('\nHinweise in js/bauteile.js');

const direktePush = (bauteileSrc.match(/hinweise\.push\(/g) || []).length;
pruefe('Hinweise entstehen nur über hin() und hinI()',
       gegen ? direktePush !== 2 : direktePush === 2,
       direktePush + ' × hinweise.push – erwartet 2 (die beiden Helfer selbst)');

/* Jeden hin(…)- bzw. hinI(…)-Aufruf samt zusammengesetztem Text einsammeln.
   Die Texte sind über mehrere Zeilen mit + verkettet; gesucht wird bis zur
   schliessenden Klammer des Aufrufs. */
function aufrufe(name) {
  const re = new RegExp('(?:^|[^A-Za-z])' + name + '\\(\'([a-z]+)\',([\\s\\S]*?)\\);', 'g');
  const raus = [];
  let m;
  while ((m = re.exec(bauteileSrc)) !== null) {
    const text = (m[2].match(/'([^']*)'/g) || []).map(function (t) {
      return t.slice(1, -1);
    }).join('');
    raus.push({ art: m[1], text: text });
  }
  return raus;
}
const kunde = aufrufe('hin');
const intern = aufrufe('hinI');

pruefe('Beide Töpfe sind befüllt',
       kunde.length >= 5 && intern.length >= 7,
       kunde.length + ' für den Kunden, ' + intern.length + ' für uns');

let schmutzig = [];
kunde.forEach(function (h) {
  const w = verbotenes(h.text);
  if (w.length) schmutzig.push(h.art + ': ' + w.join(', '));
});
pruefe('Kein Kundenhinweis spricht von Preisliste, Annahme oder Preis',
       schmutzig.length === 0,
       schmutzig.length ? schmutzig.join(' | ')
                        : kunde.length + ' Texte gegen ' + INTERN_WOERTER.length + ' Wörter geprüft');

pruefe('Die internen Hinweise sind nicht verlorengegangen',
       intern.some(function (h) { return h.text.indexOf('Preis') > -1; }) &&
       intern.some(function (h) { return h.text.indexOf('Annahme') > -1 || h.text.indexOf('angenommen') > -1; }),
       'Preisaussage und offene Annahme stehen weiter im internen Topf');

/* ---------- 2. Zweiter Weg: wirklich erzeugte Hinweise ---------- */
console.log('\nDieselbe Prüfung an erzeugten Hinweisen');

const CSV = path.join(WURZEL, 'daten', 'dachmatrix.csv');
if (!fs.existsSync(CSV)) {
  console.log('  (übersprungen – daten/ fehlt, siehe daten/README.md)');
} else {
  const B = require(path.join(WURZEL, 'js', 'bauteile.js'));
  B.matrixSetzen(require(path.join(WURZEL, 'js', 'dachmatrix-daten.js')));
  /* Maße, die möglichst viele Hinweise auslösen: über dem Raster, über der
     Unterzug-Grenze, über 7 m Breite, freistehend, Polycarbonat. */
  /* Die Systemnamen sind die der Matrix („TDS"), nicht die Produktnamen
     des Konfigurators („Terrassendach TDS"). Mit den falschen Namen gibt
     bauteile() nur { fehler } zurueck – die Pruefung lief dann an null
     Hinweisen durch und bestaetigte sich selbst. Deshalb wird jeder Fall
     einzeln auf fehler geprueft und die Gesamtzahl unten mitgefordert. */
  const faelle = [
    ['TDS', 'Glas', 4000, 5000, {}],
    ['TDS', 'Glas', 7500, 4300, { freistehend: true }],
    ['TDS', 'Polycarbonat', 3870, 3500, {}],
    ['SkyView', 'Glas', 7500, 5000, {}],
    ['TDS', 'Glas', 99000, 99000, {}]
  ];
  let erzeugt = 0, ohneKennzeichen = [], schmutzig2 = [], kaputt = [];
  faelle.forEach(function (f) {
    let e;
    try { e = B.bauteile(f[0], f[1], f[2], f[3], f[4]); }
    catch (err) { kaputt.push(f[0] + '/' + f[1] + ': ' + err.message); return; }
    if (!e || e.fehler) { kaputt.push(f[0] + '/' + f[1] + ': ' + (e && e.fehler)); return; }
    (e.hinweise || []).forEach(function (h) {
      erzeugt++;
      const fuer = gegen ? 'kunde' : h.fuer;      // Gegenprobe: alles sichtbar
      if (fuer !== 'kunde' && fuer !== 'intern') ohneKennzeichen.push(h.art);
      if (fuer === 'kunde') {
        const w = verbotenes(h.text);
        if (w.length) schmutzig2.push(h.art + ': ' + w.join(', '));
      }
    });
  });
  pruefe('Alle fünf Maße liefern wirklich eine Stückliste',
         kaputt.length === 0,
         kaputt.length ? kaputt.join(' | ') : '5 von 5 gerechnet');
  pruefe('Jeder erzeugte Hinweis trägt ein Publikum',
         ohneKennzeichen.length === 0 && erzeugt >= 15,
         ohneKennzeichen.length ? 'ohne Kennzeichen: ' + ohneKennzeichen.join(', ')
                                : erzeugt + ' Hinweise aus 5 Maßen (mindestens 15 erwartet)');
  pruefe('Auch erzeugt: kein internes Wort im Kundentext',
         schmutzig2.length === 0,
         schmutzig2.length ? schmutzig2.join(' | ') : 'alle sichtbaren Texte sauber');
}

/* ---------- 3. Die Filter im Konfigurator ---------- */
console.log('\nFilter in js/konfigurator-3d.js');

pruefe('Die Hinweisbox filtert nach Publikum, nicht nach Art',
       /hinweise\.filter\(function \(h\) \{ return h\.fuer !== 'intern'; \}\)/.test(k3dSrc),
       "e.hinweise.filter(… h.fuer !== 'intern')");

pruefe('Der Kasten „Ihre Konfiguration" zeigt die gefilterte Liste',
       /box\.innerHTML = zusammenfassungKunde\(\)/.test(k3dSrc),
       'textAktualisieren() nutzt zusammenfassungKunde()');

/* nurIntern() aus dem Quelltext ziehen statt nachbauen – sonst prüfte die
   Prüfung ihre eigene Kopie der Liste. */
const nurInternSrc = (k3dSrc.match(/var NUR_INTERN = \[[\s\S]*?\n  \}/) || [''])[0];
const nurIntern = eval('(function () { ' + nurInternSrc + '; return nurIntern; })')();
const internZeilen = [
  'Gerechnet mit der nächsten lieferbaren Breite: 4000 mm',
  'Statisch wirksame Spannweite: 4000 mm (Dachtiefe 5000 mm abzüglich Dachvorsprung)',
  'Innenkern-Träger im Sparren nötig (Tiefe über 4000 mm)'
];
const kundenZeilen = [
  'Terrassendach TDS',
  '4000 × 5000 mm, Durchgangshöhe 2500 mm',
  'Farbe: Anthrazit',
  'Unterzug (Statikträger über die ganze Breite): 2500 mm ab Wand – Felder 2500 / 2500 mm',
  'Eindeckung: VSG klar'
];
const trefferIntern = internZeilen.filter(nurIntern).length;
const trefferKunde = kundenZeilen.filter(nurIntern).length;
pruefe('Die drei internen Zeilen werden erkannt', trefferIntern === 3,
       trefferIntern + ' von 3');
pruefe('Kundenzeilen bleiben stehen – auch der Unterzug', trefferKunde === 0,
       trefferKunde + ' von ' + kundenZeilen.length + ' fälschlich gefiltert');

pruefe('Der Lieferantenname wird aus den Kundenzeilen entfernt',
       /zusammenfassungKunde[\s\S]{0,320}?\.map\(ohneLieferant\)/.test(k3dSrc),
       'zusammenfassungKunde() ruft ohneLieferant()');

/* Zurückgelesen, nicht erschlossen: die echte Funktion auf die echte Zeile.
   Dass ohneLieferant() aufgerufen WIRD, sagt noch nicht, dass es wirkt. */
const olSrc = (k3dSrc.match(/function ohneLieferant\([\s\S]*?\n  \}/) || [''])[0];
const ohneLieferant = eval('(' + olSrc.replace('function ohneLieferant', 'function') + ')');
const vdZeile = 'SG23 Richtungsangaben: von INNEN gesehen (links/rechts ' +
                'wie im VD-Anfrageformular)';
const vdRaus = ohneLieferant(vdZeile);
pruefe('Durchgelesen: aus der Zeile verschwindet der Lieferant, nicht die Aussage',
       vdRaus.indexOf('VD') === -1 && vdRaus.indexOf('von INNEN gesehen') > -1,
       '„' + vdRaus + '"');

pruefe('Der Assistent bekommt Kurzfassung und Fachtext getrennt',
       /notiz: zusammenfassungKurz\(\)/.test(k3dSrc) &&
       /fachnotiz: zusammenfassung\(\)/.test(k3dSrc),
       'v.notiz = Kurzfassung, v.fachnotiz = Fachtext + interne Hinweise');

/* ---------- 4. Anzeige und Versand im Assistenten ---------- */
console.log('\nAnfrage-Assistent');

pruefe('Die Anzeige lässt den Fachtext weg',
       /summaryRows[\s\S]{0,80}summaryPairs\(false\)/.test(awSrc),
       'summaryRows() → summaryPairs(false)');

const versandWahr = (awSrc.match(/summaryPairs\(true\)/g) || []).length;
pruefe('Jeder Versandweg schickt ihn mit',
       versandWahr === 3,
       versandWahr + ' × summaryPairs(true) – Mailtext, Web3Forms, Formspree');

pruefe('Die Fachtext-Zeile hängt am Schalter',
       /if \(mitFachtext && answers\.fachnotiz\)/.test(awSrc),
       'nur bei mitFachtext');

pruefe('Die Vorgabe aus dem Konfigurator wird übernommen',
       /if \(v\.fachnotiz\) answers\.fachnotiz = v\.fachnotiz;/.test(awSrc),
       'vorgabeUebernehmen() setzt answers.fachnotiz');

console.log('\nErgebnis: ' + (fehler === 0 ? 'bestanden' : fehler + ' Fehler') +
            ' (' + ok + ' Prüfungen ok)');
if (gegen) {
  console.log('Gegenprobe: Es MÜSSEN Fehler stehen – sonst prüft das Skript nichts.');
}
process.exit(fehler === 0 ? 0 : 1);
