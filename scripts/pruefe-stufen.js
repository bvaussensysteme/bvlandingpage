#!/usr/bin/env node
/* Prueft die beiden Stufen Basic und Pro.
 *
 * ANLASS. „Der 3D Konfigurator wird mit den ganzen einstellungen immer
 * unübersichtlicher und schwieriger, mach eine Basic version für leihen
 * und dann wenn man auf pro umschaltet wirklich alle einstellungen
 * vorhanden" (Betreiber, 24.10.2026). Zu dem Zeitpunkt standen 68
 * Bedieneinheiten in 9 Schritten im Bedienfeld.
 *
 * WAS BASIC ZEIGT, hat der Betreiber festgelegt: die Fragen, die ein
 * Kunde beantworten kann – Produkt, Aufbau, Breite, Tiefe, Hoehe,
 * Dacheindeckung, Farbe, die vier Seiten, Sonnenschutz, Licht,
 * Untergrund und Montage. Alles, was Fachwissen braucht, gehoert zu Pro.
 *
 * DIE HEIKLE STELLE ist nicht das Ausblenden, sondern dass in Basic
 * nichts VERSCHWINDET, was schon eingestellt wurde: Die Werte bleiben
 * stehen und die Anfrage nennt sie weiter. Stilles Zuruecksetzen waere
 * der schlimmere Fehler – dieselbe Falle wie bei der Rueckseite am
 * 23.10.2026, nur andersherum.
 *
 * Aufruf:  node scripts/pruefe-stufen.js [--gegenprobe]
 */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;

var html = fs.readFileSync('konfigurator.html', 'utf8');
var k3d  = fs.readFileSync('js/konfigurator-3d.js', 'utf8');

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

/* Alle Bedieneinheiten mit ihrem oeffnenden Tag und ihrem Inhalt. */
var GRUPPEN = [];
(function () {
  var re = /<div class="k3d-gruppe[^"]*"([^>]*)>/g, m;
  while ((m = re.exec(html))) {
    var ende = html.indexOf('\n        </div>', m.index);
    GRUPPEN.push({
      attr: m[1],
      pro: /data-k3d-pro/.test(m[1]),
      mehr: /data-k3d-mehr/.test(m[1]),
      schritt: (m[1].match(/data-k3d-schritt="([a-z]*)"/) || [])[1] || '',
      fuer: (m[1].match(/data-k3d-fuer="([^"]*)"/) || [])[1] || '',
      inhalt: html.slice(m.index, ende > -1 ? ende : m.index + 600)
    });
  }
})();
function mit(marke) {
  return GRUPPEN.filter(function (g) { return g.inhalt.indexOf(marke) > -1; });
}
pruefe('Die Bedieneinheiten lassen sich auslesen',
       gegen ? GRUPPEN.length < 50 : GRUPPEN.length > 50,
       GRUPPEN.length + ' Einheiten');

/* ---------- Der Umschalter ---------- */
pruefe('Der Umschalter steht in der Seite',
       gegen ? html.indexOf('data-k3d-seg="k3dStufe"') < 0
             : html.indexOf('data-k3d-seg="k3dStufe"') > -1 &&
               /<button type="button" data-wert="Basic">/.test(html) &&
               /<button type="button" data-wert="Pro">/.test(html),
       'zwei Knöpfe');
/* Die geführte Kopfzeile ist im Modus „Alles auf einen Blick" ausgeblendet
   (.k3d-fuehrung { display: none }). Stünde der Umschalter dort, wäre er
   genau dann weg, wenn man am meisten sieht. */
(function () {
  var a = html.indexOf('<div class="k3d-stufe">');
  var f = html.indexOf('<div class="k3d-fuehrung" id="k3dFuehrung">');
  var drin = a > f;
  pruefe('Der Umschalter steht außerhalb der geführten Kopfzeile',
         gegen ? drin : (a > -1 && f > -1 && !drin),
         'sonst verschwindet er bei „Alles auf einen Blick"');
})();
pruefe('Basic ist die Voreinstellung',
       gegen ? !/stufe: 'Basic',/.test(k3d) || !/id="k3dStufe" value="Basic"/.test(html)
             : /stufe: 'Basic',/.test(k3d) && /id="k3dStufe" value="Basic"/.test(html),
       'im Zustand und im Feld');
pruefe('Die Stufe wird beim Ändern gelesen',
       gegen ? !/Z\.stufe = wert\('k3dStufe'\) \|\| Z\.stufe;/.test(k3d)
             : /Z\.stufe = wert\('k3dStufe'\) \|\| Z\.stufe;/.test(k3d), '');

/* ---------- Was Basic verbirgt ---------- */
var sollPro = [
  ['neigung', 'Dachneigung'], ['hoehe-hinten', 'hintere Höhe'],
  ['glasstaerke', 'Glasstärke'], ['keil-glas', 'Glas im Keil'],
  ['velaris', 'Velaris-Hälfte'], ['verk-richtung', 'Ausrichtung der Paneele'],
  ['stoff-segel', 'Stofffarbe Segel'], ['stoff-plissee', 'Stofffarbe Plissee'],
  ['stoff-dach', 'Markisenstoff']
];
sollPro.forEach(function (p) {
  var g = GRUPPEN.filter(function (x) { return x.fuer === p[0]; });
  var alle = g.length > 0 && g.every(function (x) { return x.pro; });
  pruefe('Pro: ' + p[1], gegen ? !alle : alle, g.length + ' Einheit(en)');
});

/* ---------- Was Basic zeigt ----------
   Die Gegenprobe deckt genau die Verwechslung auf, die hier wehtäte:
   eine Kundenfrage versehentlich nach Pro geschoben. */
var sollBasic = [
  ['id="k3dBreiteZahl"', 'Breite'], ['id="k3dTiefeZahl"', 'Tiefe'],
  ['id="k3dHoeheZahl"', 'Höhe vorne'], ['data-k3d-fuer="glas"', 'Dacheindeckung'],
  ['data-k3d-farbe', 'Farbe'], ['data-k3d-erw="links"', 'Seite links'],
  ['data-k3d-erw="hinten"', 'Seite hinten'],
  ['data-k3d-fuer="sonnenschutz"', 'Sonnenschutz'],
  ['id="k3dLedSet"', 'Licht'], ['data-k3d-seg="k3dUntergrund"', 'Untergrund'],
  ['data-k3d-seg="k3dMontage"', 'Montage']
];
sollBasic.forEach(function (p) {
  var g = mit(p[0]);
  var frei = g.length > 0 && g.every(function (x) { return !x.pro && !x.mehr; });
  pruefe('Basic: ' + p[1], gegen ? !frei : frei, g.length + ' Einheit(en)');
});

/* ---------- Nachgerechnet: wie viel bleibt übrig ---------- */
(function () {
  var sichtbarBasic = GRUPPEN.filter(function (g) { return !g.pro && !g.mehr; });
  var proNur = GRUPPEN.filter(function (g) { return g.pro || g.mehr; });
  pruefe('Basic zeigt deutlich weniger als Pro',
         gegen ? !(sichtbarBasic.length < GRUPPEN.length * 0.6)
               : sichtbarBasic.length < GRUPPEN.length * 0.6,
         sichtbarBasic.length + ' von ' + GRUPPEN.length +
         ' Einheiten (' + proNur.length + ' nur in Pro)');
  /* Kein Schritt darf in Basic leer dastehen – ein Schritt ohne Inhalt
     wird zwar übersprungen, aber dann fehlt dem Kunden die Frage. */
  var kunde = ['produkt', 'masse', 'dach', 'farbe', 'seiten', 'sonne',
               'technik', 'umgebung'];
  var leer = kunde.filter(function (id) {
    return sichtbarBasic.filter(function (g) { return g.schritt === id; }).length === 0;
  });
  pruefe('Jeder Kundenschritt hat in Basic noch Inhalt',
         gegen ? leer.length !== 0 : leer.length === 0,
         leer.length ? 'leer: ' + leer.join(', ') : kunde.length + ' Schritte');
})();

/* ---------- Die Regel verbirgt nur, sie deckt nicht auf ---------- */
pruefe('Die Stufenregel läuft nach der Inhaltsregel',
       gegen ? !/var basic = Z\.stufe !== 'Pro';/.test(k3d)
             : /el\.hidden = !gilt;[\s\S]{0,1600}var basic = Z\.stufe !== 'Pro';/.test(k3d),
       'was inhaltlich nicht gilt, bleibt auch in Pro aus');
pruefe('In Pro werden nur Einheiten ohne Inhaltsregel wieder gezeigt',
       gegen ? !/else if \(!g\.hasAttribute\('data-k3d-fuer'\)\) g\.hidden = false;/.test(k3d)
             : /else if \(!g\.hasAttribute\('data-k3d-fuer'\)\) g\.hidden = false;/.test(k3d),
       'sonst überschreibt Pro die Inhaltsregel');
pruefe('„Mehr Einstellungen" entfällt in Basic',
       gegen ? !/if \(mehr\) mehr\.hidden = basic;/.test(k3d)
             : /if \(mehr\) mehr\.hidden = basic;/.test(k3d),
       'dort gibt es nichts aufzuklappen');

/* ---------- Nichts wird still zurückgesetzt ----------
   Der eigentliche Prüfpunkt: Wer in Pro etwas eingestellt hat und zurück
   auf Basic schaltet, darf es nicht verlieren – und die Anfrage muss es
   weiter nennen. Sie wird aus Z gebaut, nicht aus dem, was sichtbar ist. */
pruefe('Die Stufe setzt keinen einzigen Wert zurück',
       gegen ? /Z\.stufe[^\n]*\n[^\n]*Z\.(neigung|form|sfBreite1|glasStaerke) =/.test(k3d)
             : !/Z\.stufe[^\n]*\n[^\n]*Z\.(neigung|form|sfBreite1|glasStaerke) =/.test(k3d),
       'kein Reset beim Umschalten');
pruefe('Die Begründung steht im Code, nicht nur hier',
       gegen ? !/Stilles\s+Zuruecksetzen waere der schlimmere Fehler/.test(k3d)
             : /Stilles\s*\n?\s*\*?\s*Zuruecksetzen waere der schlimmere Fehler/.test(k3d),
       'damit es niemand „aufräumt"');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
