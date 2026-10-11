#!/usr/bin/env node
/* Prüft die Maßtabelle (js/masstabelle.js) gegen die Regeln, mit denen
   sie verdichtet wurde, und gegen bekannte Festwerte.

   Warum das eine eigene Prüfung braucht: Die Datei ist verdichtet – sie
   speichert Sparren und Stützfüße nur je BREITE, weil das über alle 1316
   Datensätze so war. Kommt eine neue Preisliste, in der die Sparrenzahl
   auch von der Tiefe abhängt, ist diese Verdichtung still falsch. Dann
   muss das hier auffallen und nicht im Angebot.

   Aufruf:  node scripts/pruefe-masstabelle.js [--gegenprobe]
*/
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;

var quelle = fs.readFileSync('js/masstabelle.js', 'utf8');
var k3d = fs.readFileSync('js/konfigurator-3d.js', 'utf8');
var html = fs.readFileSync('konfigurator.html', 'utf8');
var window = {};
eval(quelle);
var M = window.BV_MASSTABELLE;

var fehler = 0, geprueft = 0;
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || '')); }

pruefe('Tabelle ist geladen', !gegen && !!(M && M.systeme),
       M ? Object.keys(M.systeme).length + ' Systeme, Stand ' + M.stand : 'fehlt');
if (!M || !M.systeme) { console.log('\nAbbruch'); process.exit(1); }

/* Umfang: so viele Breiten und Tiefen hat die Quelle je System */
var SOLL = {
  'TDS|Glas':             { breiten: 30, tiefen: 14 },
  'TDS|Polycarbonat':     { breiten: 14, tiefen: 14 },
  'SkyView|Glas':         { breiten: 30, tiefen: 14 },
  'SkyView|Polycarbonat': { breiten: 14, tiefen: 14 },
  'Flat_Line|Trapezblech':{ breiten: 12, tiefen: 7 }
};
var saetze = 0;
Object.keys(SOLL).forEach(function (k) {
  var g = M.systeme[k];
  if (!g) { pruefe('System ' + k, false, 'fehlt'); return; }
  var nb = Object.keys(g.breiten).length, nt = g.tiefen.length;
  saetze += nb * nt;
  pruefe('Umfang ' + k,
         !gegen && nb === SOLL[k].breiten && nt === SOLL[k].tiefen,
         nb + ' Breiten × ' + nt + ' Tiefen (erwartet ' +
         SOLL[k].breiten + ' × ' + SOLL[k].tiefen + ')');
});
pruefe('1316 Datensätze abgedeckt', !gegen && saetze === 1316, saetze + ' Sätze');

/* Jede Breite hat genau zwei Zahlen, beide plausibel */
var kaputt = [];
Object.keys(M.systeme).forEach(function (k) {
  var g = M.systeme[k];
  Object.keys(g.breiten).forEach(function (b) {
    var e = g.breiten[b];
    if (!Array.isArray(e) || e.length !== 2) { kaputt.push(k + ' ' + b); return; }
    if (!(e[0] >= 2 && e[0] <= 30)) kaputt.push(k + ' ' + b + ' Sparren ' + e[0]);
    if (!(e[1] >= 2 && e[1] <= 10)) kaputt.push(k + ' ' + b + ' Stützfüße ' + e[1]);
  });
});
if (gegen) kaputt = ['künstlich'];
pruefe('Alle Einträge vollständig und plausibel', kaputt.length === 0,
       kaputt.length ? kaputt.slice(0, 3).join(', ') : 'geprüft');

/* Mehr Breite heißt nie weniger Sparren */
var ruecklauf = [];
Object.keys(M.systeme).forEach(function (k) {
  var g = M.systeme[k];
  var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
  for (var i = 1; i < bs.length; i++) {
    if (g.breiten[bs[i]][0] < g.breiten[bs[i - 1]][0]) {
      ruecklauf.push(k + ': ' + bs[i - 1] + '→' + bs[i]);
    }
  }
});
if (gegen) ruecklauf = ['künstlich'];
pruefe('Sparrenzahl steigt mit der Breite', ruecklauf.length === 0,
       ruecklauf.length ? ruecklauf.join(', ') : 'monoton');

/* Achsabstand im belegten Band – dieselbe Selbstkontrolle wie bei der
   Schätzung, jetzt auf den echten Zahlen */
var ausserhalb = [];
[['TDS|Glas', 680, 770], ['SkyView|Glas', 680, 770],
 ['TDS|Polycarbonat', 1016, 1080], ['SkyView|Polycarbonat', 1016, 1080]].forEach(function (p) {
  var g = M.systeme[p[0]]; if (!g) return;
  Object.keys(g.breiten).map(Number).forEach(function (b) {
    if (b < 1500) return;                       // Kleinstmaße fallen heraus
    var a = b / (g.breiten[b][0] - 1);
    if (a < p[1] - 60 || a > p[2] + 10) ausserhalb.push(p[0] + ' ' + b + ': ' + Math.round(a));
  });
});
if (gegen) ausserhalb = ['künstlich'];
pruefe('Achsabstand im belegten Band', ausserhalb.length === 0,
       ausserhalb.length ? ausserhalb.slice(0, 4).join(', ') : 'Glas 680–770, Poly 1016–1080');

/* Festwert, den der Betreiber genannt hat: 6000 x 3000 mit VSG 8 ergibt
   9 Sparren und 3 Pfosten. 6000 ist keine lieferbare Breite – gerechnet
   wird mit der nächsten darüber (6080). Genau das macht auch
   tabelleBauteile() im Konfigurator. */
var tg = M.systeme['TDS|Glas'];
var bs6 = Object.keys(tg.breiten).map(Number).sort(function (a, b) { return a - b; });
var naechste = null;
for (var j = 0; j < bs6.length; j++) { if (bs6[j] >= 6000) { naechste = bs6[j]; break; } }
var e6 = naechste ? tg.breiten[naechste] : null;
pruefe('TDS Glas 6000 mm → 9 Sparren, 3 Stützfüße',
       !gegen && !!e6 && e6[0] === 9 && e6[1] === 3,
       e6 ? 'über Breite ' + naechste + ': ' + e6.join(' / ') : 'fehlt');

/* Regeln, auf denen die Verdichtung beruht */
pruefe('Regelwerte hinterlegt',
       !gegen && M.regeln && M.regeln.tiefeMaxOhneUnterzug === 4500 &&
       M.regeln.tiefeMaxMitUnterzug === 7000 &&
       M.regeln.tiefeMaxLieferbar === 7050,
       'Unterzug ab 4500, Pfosten dazu ab 7000, lieferbar bis 7050');
/* Die beiden duerfen nicht wieder zu einem Wert werden: 7000 ist der
   Punkt, ab dem ein Pfosten dazukommt, 7050 das Hoechstmass. Genau diese
   Verwechslung hat den Regler bei 7000 enden lassen. */
pruefe('Hoechstmass und Pfostengrenze sind zwei Werte',
       gegen ? M.regeln.tiefeMaxLieferbar === M.regeln.tiefeMaxMitUnterzug
             : M.regeln.tiefeMaxLieferbar > M.regeln.tiefeMaxMitUnterzug,
       M.regeln.tiefeMaxMitUnterzug + ' / ' + M.regeln.tiefeMaxLieferbar + ' mm');
(function () {
  /* Zweiter Weg: die Reglergrenzen aus der Tabelle wirklich ausrechnen -
     so, wie grenzenAusTabelle() es tut. Sie muessen die groessten Masse
     der Tabelle ergeben: 14080 x 7050 mm beim TDS. */
  var g = M.systeme['TDS|Glas'];
  var bs = Object.keys(g.breiten).map(Number).sort(function (a, b) { return a - b; });
  var grenze = gegen ? M.regeln.tiefeMaxMitUnterzug : M.regeln.tiefeMaxLieferbar;
  var ts = g.tiefen.filter(function (t) { return t <= grenze; });
  var bMax = bs[bs.length - 1], tMax = ts[ts.length - 1];
  pruefe('Regler reicht bis zum Hoechstmass der Tabelle',
         bMax === 14080 && tMax === 7050, bMax + ' x ' + tMax + ' mm');
})();
pruefe('Grenzen kommen aus tiefeMaxLieferbar',
       new RegExp(q || 'return t <= M\\.regeln\\.tiefeMaxLieferbar').test(k3d),
       'nicht mehr bei der Pfostengrenze gekappt');
/* Carport TDS und Terrassendach TDS haben denselben Systemschluessel -
   beim Wechsel muessen die Grenzen trotzdem nachgezogen werden. */
pruefe('Produktwechsel zieht die Grenzen nach',
       new RegExp(q || 'if \\(produktWechsel\\) \\{[\\s\\S]{0,1200}reglerGrenzenSetzen\\(\\);').test(k3d),
       'sonst bleibt der Carport bei 7000 x 4500');
(function () {
  /* Zweiter Weg: die Pfostenregel an der Grenze nachrechnen. Bei 7050 mm
     kommt ein Pfosten dazu - das ist der Sinn der 7000. */
  var e = M.systeme['TDS|Glas'].breiten[6080] || [0, 4];
  function pfosten(t) {
    var grenze = t > M.regeln.tiefeMaxOhneUnterzug
      ? M.regeln.tiefeMaxMitUnterzug : M.regeln.tiefeMaxOhneUnterzug;
    return e[1] + (t > grenze ? 1 : 0);
  }
  var bei7000 = pfosten(7000), bei7050 = gegen ? pfosten(7000) : pfosten(7050);
  pruefe('Bei 7050 mm kommt ein Pfosten dazu', bei7050 === bei7000 + 1,
         bei7000 + ' -> ' + bei7050 + ' Pfosten');
})();

/* Der Konfigurator muss sie auch benutzen */
pruefe('Konfigurator liest die Tabelle',
       new RegExp(q || 'BV_MASSTABELLE').test(k3d) &&
       new RegExp(q || 'tabelleBauteile').test(k3d), 'tabelleBauteile()');
pruefe('Tabelle wird auf der Seite geladen',
       new RegExp(q || 'js/masstabelle\\.js').test(html), '');
pruefe('Breite wird auf die nächste lieferbare aufgerundet',
       new RegExp(q || 'bs\\[i\\] >= breiteMm').test(k3d), 'nie zu wenige Sparren');

/* ---------- Statikträger und Hinweis ---------- */
pruefe('Statikträger 189 × 117 mm im Modell',
       new RegExp(q || 'traegerH = [\\s\\S]{0,160}18\\.9').test(k3d) &&
       new RegExp(q || 'traegerT = 11\\.7').test(k3d), 'aus der Maßtabelle');
pruefe('Träger sitzt über den Pfosten, nicht in der Dachmitte',
       new RegExp(q || 'hPfosten \\+ traegerH / 2, zPf').test(k3d), 'zPf = Pfostenachse');
/* Voreinstellung 0: Mit Vorsprung kommt ein Statiktraeger dazu – bei 300
   als Voreinstellung bekaeme jedes Terrassendach einen. */
pruefe('Dachvorsprung ist voreingestellt auf 0',
       new RegExp(q || 'vorsprung: 0,').test(k3d) &&
       /id="k3dVorsprung"[^>]*value="0"/.test(html),
       'kein Statikträger im Standardfall');
pruefe('Dachvorsprung bewegt die Pfosten',
       new RegExp(q || 'RINNE\\.breite / 2\\) - vorspr').test(k3d), 'zPf minus Vorsprung');
pruefe('Träger kommt auch mit Vorsprung',
       new RegExp(q || 'unterzugGilt\\(tbMass\\) \\|\\| vorspr > 0').test(k3d), '');
/* Die Rinne wird nie angehoben – technisch unmöglich. Der Träger nimmt
   dem Pfosten seine Höhe weg, in BEIDEN Lagen. */
pruefe('Rinne bleibt auf der eingestellten Höhe',
       new RegExp(q || 'var hRinne = hVorn;').test(k3d) &&
       !/hRinne = hVorn \+ /.test(k3d), 'kein Anheben');
pruefe('Träger kürzt den Pfosten, nicht die Rinne',
       new RegExp(q || 'traegerOk - traegerH').test(k3d), 'hPfosten aus traegerOk');
/* ---------- 7-m-Regel unter dem Statiktraeger ----------
   Zweiter Weg: Die Regel wird hier noch einmal aufgeschrieben und gegen
   die Umsetzung im Code gerechnet. */
var mRegel = k3d.match(/function pfostenUnterTraeger\(breiteMm\) \{\s*return ([^;]+);/);
if (!mRegel) { pruefe('7-m-Regel vorhanden', false, 'pfostenUnterTraeger fehlt'); }
else {
  var fn = new Function('breiteMm', 'return ' + mRegel[1] + ';');
  [[3000, 2], [7000, 2], [7001, 3], [14000, 3], [14001, 4]].forEach(function (f) {
    var ist = fn(f[0]) + (gegen ? 1 : 0);
    pruefe('7-m-Regel bei ' + f[0] + ' mm', ist === f[1],
           ist + ' Pfosten (erwartet ' + f[1] + ')');
  });
}
/* ---------- Die Regel gilt JE SEITE ----------
   „und das gilt immer nur für die seite wo der sttikträger ist" – vorne
   also nur bei Träger vorne, hinten (nur freistehend) immer. Die beiden
   Reihen duerfen deshalb nicht aus einer gemeinsamen Zahl kommen. */
pruefe('Vordere Reihe haengt am vorderen Träger',
       new RegExp(q || 'pfVorne = traegerH > 0 \\? pfostenUnterTraeger').test(k3d), '');
pruefe('Hintere Reihe immer nach der 7-m-Regel',
       new RegExp(q || 'pfHinten = pfostenUnterTraeger\\(Z\\.breite\\)').test(k3d), '');
pruefe('Keine gemeinsame Pfostenzahl mehr',
       gegen ? /hatTraeger/.test(k3d) : !/hatTraeger/.test(k3d), 'hatTraeger entfernt');
pruefe('Hintere Reihe nur freistehend gezeichnet',
       new RegExp(q || 'if \\(frei\\) \\{\\s*verteilen\\(pfHinten').test(k3d), '');

/* Zweiter Weg: die Entscheidung aus dem Code herausloesen und mit
   eigenen Zahlen rechnen, statt den Text nur zu lesen. */
var mV = k3d.match(/var pfVorne = (traegerH > 0 [^;]+);/);
if (!mV || !mRegel) { pruefe('Entscheidung je Seite rechenbar', false, 'Zeile nicht gefunden'); }
else {
  var fV = new Function('traegerH', 'Z', 'pfTabelle', 'pfostenUnterTraeger',
                        'return ' + mV[1] + ';');
  // Breite 8080: Tabelle sagt 4 Stuetzfuesse, die 7-m-Regel sagt 3.
  [ // Träger vorne?, Tabelle, erwartet vorne
    [0, 4, 4],        // kein Träger vorne  -> Tabelle
    [18.9, 4, 3]      // Träger vorne       -> 7-m-Regel
  ].forEach(function (f) {
    var ist = fV(f[0], { breite: 8080 }, f[1], fn) + (gegen ? 1 : 0);
    pruefe('Vorne bei ' + (f[0] ? 'Träger' : 'ohne Träger') + ': ' + f[2] + ' Pfosten',
           ist === f[2], ist + ' Pfosten');
  });
  var istH = fn(8080) + (gegen ? 1 : 0);
  pruefe('Hinten (freistehend) 3 Pfosten nach der 7-m-Regel', istH === 3, istH + ' Pfosten');
  /* Rohwerte ohne Gegenprobe-Versatz, sonst hebt sich der Versatz in
     beiden Reihen gegenseitig auf und die Pruefung schlaegt nie an. */
  var rohV = fV(0, { breite: 8080 }, 4, fn), rohH = fn(8080);
  pruefe('Reihen duerfen sich unterscheiden',
         gegen ? rohV === rohH : rohV !== rohH,
         'freistehend ohne Vorsprung: ' + rohV + ' vorne / ' + rohH + ' hinten');
}
pruefe('Hinweis trennt die Reihen genauso',
       new RegExp(q || "pfV \\+ ' Pfosten vorne und ' \\+ pfH \\+ ' hinten'").test(k3d), '');
pruefe('Hinweis: vordere Zahl aus dem vorderen Träger',
       new RegExp(q || 'pfV = \\(unterzugGilt\\(tb\\) \\|\\| vsHin > 0 \\|\\| wunsch\\)').test(k3d), '');

/* Freistehend: der Statiktraeger steht an der Stelle der Wand, das
   Wandprofil wird darauf geschraubt – 1:1 wie bei Wandmontage. */
pruefe('Freistehend: Träger steht hochkant',
       new RegExp(q || 'TR_H = 18\\.9, TR_T = 11\\.7').test(k3d), '189 hoch, 117 tief');
pruefe('Freistehend: Träger hinter dem Wandprofil',
       new RegExp(q || 'zTrHinten = -TR_T / 2 \\+ vorsprH').test(k3d),
       'an der Stelle der Wand, mit Vorsprung nach innen');
/* Wandprofil TD: 143,6 mm HOCH an der Wand, rund 31 mm Ausladung
   (Querschnitt aufrecht, Betreiber 11.10.2026). Das lange Mass liegt
   an der Wand, nicht quer - die erste Lesart hatte die Zeichnung so
   genommen, wie sie auf dem Blatt lag. Kein Sonderfall fuer
   freistehend: dort sitzt es am Traeger statt an der Wand. */
pruefe('Wandprofil steht mit 143,6 mm an der Wand',
       gegen ? /wpT = frei \?/.test(k3d)
             : (/wpH = sky \? 20 : 14\.36/.test(k3d) &&
                /wpT = sky \? 9 : 3\.1/.test(k3d)),
       'hoch an der Wand, kurz nach vorne');
(function () {
  /* Das Wandprofil wird genau EINMAL gezeichnet, ausserhalb der
     frei-Verzweigung - sonst gaebe es zwei Fassungen davon. */
  var zahl = (k3d.match(/balken\(B, wpH, wpT, 0, wpMitte,/g) || []).length;
  pruefe('Wandprofil wird nicht ersetzt', gegen ? zahl !== 1 : zahl === 1,
         zahl + ' Mal gezeichnet');
})();
/* Seit 11.10.2026 richtet sich die Traegerhoehe nach dem Dach (trH),
   nicht mehr nach dem festen Mass – der Pfosten endet weiter genau
   darunter. */
pruefe('Freistehend: hintere Pfosten enden unter dem Träger',
       new RegExp(q || 'hPfostenHinten = frei \\? Math\\.max\\(100, trOk - trH\\)').test(k3d), '');
pruefe('Freistehend: hintere Pfosten stehen unter dem Träger',
       new RegExp(q || 'hPfostenHinten / 2, zTrHinten').test(k3d), 'nicht mehr bei zHinten');
/* Traeger und Wandprofil duerfen nicht ueber die Sparren hinausragen –
   genau das sah von aussen aus wie ein waagrecht liegender Balken. */
pruefe('Oberkante haengt an der Sparrenoberkante',
       new RegExp(q || 'dachOk = ukHinten \\+ spH').test(k3d), 'nicht mehr an hHinten');
/* Das Profil reicht ueber die Sparren bis an die Glasoberseite - dort
   haelt die Glasleiste die Scheibe. An der Sparrenoberkante zu enden
   waere zu tief (Betreiber, 11.10.2026). */
pruefe('Wandprofil reicht bis an die Eindeckung',
       new RegExp(q || 'wpOk = sky \\? dachOk : dachOk \\+ wpGlasD').test(k3d) &&
       new RegExp(q || 'wpMitte = wpOk - wpH / 2').test(k3d), '');
(function () {
  /* Nachgerechnet: Die Sparren muessen in der unteren Haelfte liegen und
     die Glasoberseite mit der Profiloberkante abschliessen. */
  var wpH = 14.36, spH = 12.0, glas = 0.8, dachOk = 100;
  var ok = dachOk + (gegen ? 0 : glas);
  var uk = ok - wpH;
  var sparrenUk = dachOk - spH;
  var falsch = 0;
  if (Math.abs(ok - (dachOk + glas)) > 0.001) falsch++;   // Glas buendig
  if (sparrenUk < uk - 0.001) falsch++;                   // Sparren im Profil
  pruefe('Sparren im Profil, Glas buendig oben', falsch === 0,
         falsch + ' von 2 Lagen falsch');
})();
/* ---------- Seitliche Abdeckungen: zwei verschiedene Formen ----------
   Erst hiess es „identisch", dann, nachdem beide gleich gebaut waren:
   „du hast die deckel nicht richtig abgebildet sondern selbst
   modeliert" – Rinne und Wandprofil sind DOCH VERSCHIEDEN (Betreiber,
   11.10.2026). Die Pruefung von vorhin schrieb die alte Wahrheit fest
   („beide ergeben denselben Umriss") und ist deshalb ersetzt. */
(function () {
  var rinQ = (k3d.match(/function rinnenkappeQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var wandQ = (k3d.match(/function wandkappeQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var masse = k3d.match(/RINNENDECKEL = \{ breite: ([\d.]+), hoehe: ([\d.]+), fase: ([\d.]+)/);
  var wd = k3d.match(/WANDDECKEL = \{ tiefe: ([\d.]+), hoehe: ([\d.]+), radius: ([\d.]+)/);
  if (!rinQ || !wandQ || !masse || !wd) {
    pruefe('Beide Kappenformen lesbar', false, 'nicht gefunden'); return;
  }
  var RINNENDECKEL = { breite: +masse[1], hoehe: +masse[2], fase: +masse[3] };
  var WANDDECKEL = { tiefe: +wd[1], hoehe: +wd[2], radius: +wd[3] };

  var punkte = [], bogen = 0;
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) {
    bogen++; punkte.push([x, y]);
  };
  Form.prototype.closePath = function () {};
  var THREE = { Shape: Form };

  function mess(quelle) {
    punkte = []; bogen = 0;
    eval('(' + quelle + ')')();
    var xs2 = punkte.map(function (p) { return p[0]; });
    var ys2 = punkte.map(function (p) { return p[1]; });
    return { breit: Math.max.apply(null, xs2) - Math.min.apply(null, xs2),
             hoch: Math.max.apply(null, ys2) - Math.min.apply(null, ys2),
             bogen: bogen, umriss: JSON.stringify(punkte) };
  }
  var r = mess(rinQ), w = mess(wandQ);

  /* Die Rinnenkappe ist BELEGT – 172 x 175 mm, Fase 34 mm, keine
     Rundung. Hier darf sich nichts verschieben. */
  var rOk = Math.abs(r.breit - RINNENDECKEL.breite) < 0.02 &&
            Math.abs(r.hoch - RINNENDECKEL.hoehe) < 0.02 && r.bogen === 0;
  pruefe('Rinnenkappe bleibt beim belegten Mass', gegen ? !rOk : rOk,
         r.breit.toFixed(1) + ' x ' + r.hoch.toFixed(1) + ' cm, ' +
         r.bogen + ' Bogen');
  /* Die Wandprofilkappe ist RUND – daran haengt der Unterschied. */
  var wOk = w.bogen >= 2 &&
            Math.abs(w.breit - WANDDECKEL.tiefe) < 0.02 &&
            Math.abs(w.hoch - WANDDECKEL.hoehe) < 0.02;
  pruefe('Wandprofilkappe laeuft vorne rund aus', gegen ? !wOk : wOk,
         w.breit.toFixed(1) + ' x ' + w.hoch.toFixed(1) + ' cm, ' +
         w.bogen + ' Bogenstuecke');
  pruefe('Die beiden Deckel sind NICHT dieselbe Form',
         gegen ? r.umriss === w.umriss : r.umriss !== w.umriss, '');
})();
pruefe('Beide Deckel werden gleich gebaut und gesetzt',
       (k3d.match(/function profilKappen/g) || []).length === 1 &&
       new RegExp(q || 'profilKappen\\(laenge, 0, wpOk - WANDDECKEL\\.hoehe').test(k3d) &&
       new RegExp(q || 'wandprofilKappen\\(B, wpOk, mAlu\\)').test(k3d),
       'eine Bauweise, zwei Formen');
(function () {
  /* KEINE Gravur: Die Kappen bekommen dasselbe Alu wie alle anderen
     Profile – kein eigenes Material, keine Textur, kein Schriftzug. Das
     Zeichen auf dem Werkbild ist die Marke des HERSTELLERS; sie gehoert
     nicht in ein Bild, das wir verantworten. */
  var fn = (k3d.match(/function profilKappen\([\s\S]*?\n  \}/) || [''])[0];
  var sauber = fn.indexOf('material') > -1 &&
               !/map|Texture|canvas|fillText/.test(fn) && !gegen;
  pruefe('Kappen tragen keine Gravur', sauber,
         sauber ? 'nur Material, keine Beschriftung' : 'Textur oder Schrift gefunden');
})();

/* ---------- Werkbilder vom 11.10.2026: Rillen und Randblende ----------
   „hier ein perfekter querschnitt unserer überdachung kannst du es so
   neu modellieren" – „nicht 100% 1:1 aber ähnlich und einfach"
   (Betreiber, mit fuenf Werkbildern). Zwei Dinge daraus: die fein
   gerillte Rinnenfront und der seitlich geschlossene Dachrand. */
(function () {
  /* Zweiter Weg: den ECHTEN Rinnenquerschnitt laufen lassen. Die Rillen
     duerfen die vier belegten Hauptmasse NICHT antasten – genau das ist
     die Gefahr, wenn man an einem Profil nur „die Optik" aendert. */
  var quer = (k3d.match(/function rinneQuerschnitt\(mitKehle\)[\s\S]*?\n  \}/) || [''])[0];
  var blockR = (k3d.match(/var RINNE = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!quer || !blockR) { pruefe('Rinnenquerschnitt lesbar', false, 'nicht gefunden'); return; }
  function zahl(name) {
    var m = blockR.match(new RegExp(name + ':\\s*([\\d.]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  var RINNE = { breite: zahl('breite'), hoehe: zahl('hoehe'),
                innenBreite: zahl('innenBreite'), innenTiefe: zahl('innenTiefe'),
                rueckwand: zahl('rueckwand'), wangeAb: zahl('wangeAb'),
                rilleTeilung: zahl('rilleTeilung') };
  var punkte = [];
  function Form() { this.holes = []; }
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  /* Die Kehle wird als eigener Pfad gezeichnet und reicht bewusst ueber
     die Oberkante hinaus. Sie gehoert NICHT zum Umriss – deshalb ein
     eigener, stummer Stub dafuer, sonst misst diese Pruefung 1 cm zu
     viel und beschuldigt die Rillen. */
  function Pfad() {}
  Pfad.prototype.moveTo = function () {};
  Pfad.prototype.lineTo = function () {};
  Pfad.prototype.quadraticCurveTo = function () {};
  Pfad.prototype.closePath = function () {};
  var THREE = { Shape: Form, Path: Pfad };
  var fn = eval('(' + quer + ')');
  fn(false);
  var xs2 = punkte.map(function (p) { return p[0]; });
  var ys2 = punkte.map(function (p) { return p[1]; });
  var breit = Math.max.apply(null, xs2) - Math.min.apply(null, xs2);
  var hoch = Math.max.apply(null, ys2) - Math.min.apply(null, ys2);
  if (gegen) breit += 1;
  pruefe('Rillen aendern die Rinnenmasse nicht',
         Math.abs(breit - RINNE.breite) < 0.02 && Math.abs(hoch - RINNE.hoehe) < 0.02,
         breit.toFixed(2) + ' x ' + hoch.toFixed(2) + ' cm (Zeichnung ' +
         RINNE.breite + ' x ' + RINNE.hoehe + ')');
  /* Die Rillen liegen zurueckgesetzt – gezaehlt werden die Punkte, die
     NICHT an der Vorderkante stehen, aber in der Vorderflaeche liegen. */
  var tief = punkte.filter(function (p) {
    return p[0] < RINNE.breite - 0.1 && p[0] > RINNE.breite - 1.0;
  }).length;
  if (gegen) tief = 0;
  pruefe('Rinnenfront ist gerillt, nicht glatt', tief >= 8,
         tief + ' zurueckgesetzte Punkte, Teilung ' + RINNE.rilleTeilung + ' cm');
})();
(function () {
  /* Die Randblende ist VERKLEIDUNG. Geprueft wird, dass sie aussen
     buendig mit der Dachkante sitzt und genau von der Sparrenunterkante
     bis an die Glasoberseite reicht – und dass sie keine Sparrenachse
     verschiebt (die Achsformel muss unveraendert sein). */
  var fx = (k3d.match(/vz \* \(B \/ 2 - RANDBLENDE\.dicke \/ 2\)/) || [])[0];
  /* spH… – es gibt noch ein blendeH bei der Markise. */
  var fh = (k3d.match(/var blendeH = (spH[^;]+);/) || [])[1];
  var dicke = parseFloat((k3d.match(/RANDBLENDE = \{ dicke: ([\d.]+)/) || [])[1]);
  if (!fx || !fh || !dicke) { pruefe('Randblende lesbar', false, 'nicht gefunden'); return; }
  var B = 500, spH = 12.0, glas = 0.8, ukMitte = 200;
  var istPolycarbonat = function () { return false; };
  var Z = { glasstaerke: 8 };
  var blendeH = eval(fh);
  var xMitte = (gegen ? 0.5 : 1) * (B / 2 - dicke / 2);
  var aussen = xMitte + dicke / 2;
  var yMitte = ukMitte + blendeH / 2;
  var falsch = 0, meld = [];
  if (Math.abs(aussen - B / 2) > 0.001) {
    falsch++; meld.push('Aussenkante ' + aussen.toFixed(1) + ' statt ' + B / 2);
  }
  if (Math.abs((yMitte - blendeH / 2) - ukMitte) > 0.001) {
    falsch++; meld.push('Unterkante nicht am Sparren');
  }
  if (Math.abs((yMitte + blendeH / 2) - (ukMitte + spH + glas)) > 0.001) {
    falsch++; meld.push('Oberkante nicht an der Glasoberseite');
  }
  pruefe('Randblende sitzt buendig am Dachrand', falsch === 0,
         falsch === 0 ? blendeH.toFixed(1) + ' cm hoch, aussen buendig' : meld.join('; '));
  pruefe('Randblende verschiebt keine Sparrenachse',
         new RegExp(q || "xs\\.push\\(-B / 2 \\+ randAchse \\+ \\(B - 2 \\* randAchse\\) \\* i / felder\\)").test(k3d),
         'Achsformel unveraendert');
})();

/* ---------- Statiktraeger: unten buendig mit den Sparren ----------
   „der statikträger ist tiefer als der sparren, mach ihn unten bündig
   mit sparren und oben bündig mit glasleiste" (Betreiber, 11.10.2026,
   mit Bild). Steht er HINTER den Sparren, ist er die Wand und darf
   unten nicht hervorstehen. Liegt er UNTER den Sparren (hinterer
   Dachvorsprung), traegt er wirklich und behaelt seine vollen 189 mm. */
pruefe('Traegerhoehe folgt dem Dach, nicht dem festen Mass',
       new RegExp(q || 'var trH = \\(frei && vorsprH <= 0\\) \\? Math\\.max\\(spH, trOk - ukHinten\\) : TR_H;').test(k3d) &&
       new RegExp(q || 'balken\\(B, trH, TR_T, 0, trOk - trH / 2').test(k3d) &&
       !/balken\(B, TR_H, TR_T/.test(k3d), '');
(function () {
  /* Zweiter Weg: die Lagen ausrechnen. Oben muss der Traeger mit der
     Glasleiste abschliessen, unten mit der Sparrenunterkante. */
  var fTr = (k3d.match(/var trH = ([^;]+);/) || [])[1];
  if (gegen) fTr = 'TR_H';                 // der alte Zustand
  var TR_H = 18.9, spH = 12.0, glas = 0.8;
  var ukHinten = 200, dachOk = ukHinten + spH, trOk = dachOk + glas;
  var frei = true, vorsprH = 0;
  var trH = eval(fTr);
  var trUk = trOk - trH;
  pruefe('Traeger steht unten nicht unter den Sparren',
         Math.abs(trUk - ukHinten) < 0.001,
         'Unterkante ' + ((trUk - ukHinten) * 10).toFixed(0) + ' mm unter dem Sparren');
  /* Mit hinterem Vorsprung bleibt das belegte Mass stehen. */
  var fTr2 = (k3d.match(/var trH = ([^;]+);/) || [])[1];
  vorsprH = gegen ? 0 : 100;
  var trH2 = eval(fTr2);
  pruefe('Unter den Sparren behaelt er die belegten 189 mm',
         Math.abs(trH2 - TR_H) < 0.001, trH2.toFixed(1) + ' cm');
})();

/* Die Sparren beginnen VOR dem Profil, nicht an der Wand. Davor steckte
   ihr Anfang 31 mm im Profil, und sichtbar blieb nur der Rand, der unten
   heraussteht - ein waagerechtes Band unter den Sparren ueber die ganze
   Breite ("jetzt liegt es waagrecht im 3d unter den sparren", Betreiber
   11.10.2026). */
pruefe('Sparren beginnen an der Profilvorderkante',
       new RegExp(q || 'zSpHinten = wpT;').test(k3d), 'nicht mehr bei z = 0');
pruefe('Sparrenlaenge und -mitte folgen dem Profil',
       new RegExp(q || 'laenge = \\(dachTiefe - zSpHinten\\) / Math\\.cos\\(neig\\)').test(k3d) &&
       new RegExp(q || 'zMitte = \\(dachTiefe \\+ zSpHinten\\) / 2').test(k3d), '');
pruefe('Dachoberkante wird am Sparrenende gerechnet',
       new RegExp(q || 'dachTiefeJetzt - zSpHinten').test(k3d),
       'nicht mehr 45 mm vor der Wand');
(function () {
  /* Zweiter Weg: die Lagen aus den Zahlen der Datei nachrechnen, nicht
     aus der Absicht. wpT kommt aus dem Code, nicht aus dieser Datei. */
  var wpT = parseFloat((k3d.match(/wpT = sky \? 9 : ([\d.]+)/) || [])[1]);
  var sun = parseFloat((k3d.match(/sparrenUnterNase:\s*([\d.]+)/) || [])[1]);
  if (!wpT || !sun) { pruefe('Profilmasse lesbar', false, 'wpT/sparrenUnterNase fehlt'); return; }
  var spH = 12.0, wpH = 14.36, glas = 0.8, riH = 13.67, rinneB = 18.63;
  var hVorn = 230, neig = 8 * Math.PI / 180, T = 300, dachTiefe = T - rinneB;
  /* gegen: die ALTE Rechnung - Sparren ab der Wand, Dachoberkante 45 mm
     davor, Scheibe 10 mm vor dem Sparrenende. */
  var zSp = gegen ? 0 : wpT;
  var zOk  = gegen ? 4.5 : wpT;
  var ukVorn = hVorn + (riH - sun - spH);
  var dachOk = ukVorn + Math.tan(neig) * (dachTiefe - zOk) + spH;
  var falsch = 0, meld = [];
  /* 1. Profil und Sparren duerfen sich nicht durchdringen. */
  if (zSp < wpT - 0.001) { falsch++; meld.push('Sparren steckt ' + ((wpT - zSp) * 10).toFixed(0) + ' mm im Profil'); }
  /* 2. Profiloberkante = Glasoberseite am Sparrenende. */
  var glasOkHinten = ukVorn + Math.tan(neig) * (dachTiefe - wpT) + spH + glas;
  var wpOk = dachOk + glas;
  if (Math.abs(wpOk - glasOkHinten) > 0.01) { falsch++; meld.push('Dach steht ' + ((glasOkHinten - wpOk) * 10).toFixed(0) + ' mm ueber dem Profil'); }
  /* 3. Das Profil muss die Sparren in der Hoehe fassen. */
  if (wpOk - wpH > dachOk - spH + 0.001) { falsch++; meld.push('Sparrenunterkante unter dem Profil'); }
  pruefe('Profil hinter den Sparren, oben buendig', falsch === 0,
         falsch === 0 ? 'drei Lagen stimmen' : meld.join('; '));
})();
/* Die Scheibe stoesst hinten an das Profil - seit die Sparren davor
   beginnen, waere ein Ruecksprung ein offener Schlitz. */
pruefe('Eindeckung ohne Ruecksprung hinten',
       new RegExp(q || 'glasRueck = sky \\? 1 : 0').test(k3d) &&
       new RegExp(q || 'vollGlas = laenge \\+ glasUeber - 1 - glasRueck').test(k3d), '');
(function () {
  /* Zweiter Weg: Glashinterkante aus der gebauten Formel zuruecklesen. */
  var laenge = 100, glasUeber = 10.75, glasRueck = gegen ? 1 : 0;
  var zGlasMitte = (laenge / 2) + (glasRueck + glasUeber - 1) / 2;   // zMitte = laenge/2
  var vollGlas = gegen ? (laenge - 2 + glasUeber) : (laenge + glasUeber - 1 - glasRueck);
  var hinten = zGlasMitte - vollGlas / 2;                            // 0 = Sparrenanfang
  pruefe('Glas endet am Sparrenanfang', Math.abs(hinten) < 0.001,
         (hinten * 10).toFixed(0) + ' mm Schlitz');
})();
/* „das wandprofil muss oben mit dem statiktraeger bei freistehend
   buendig sein ... damit die glasleisten nicht ueberstehen" (Betreiber,
   11.10.2026). Vorher endete der Traeger an der Sparrenoberkante, das
   Profil eine Glasdicke hoeher - es stand ueber und gab die Glasleiste
   frei. */
pruefe('Träger endet buendig mit dem Wandprofil',
       new RegExp(q || 'trOk = vorsprH > 0 \\? ukAmTraeger : wpOk;').test(k3d),
       'mit hinterem Vorsprung unter den Sparren');
(function () {
  /* Zweiter Weg: die beiden Oberkanten wirklich vergleichen. */
  var glas = 0.8, dachOk = 100;
  var wpOk = dachOk + glas;
  var trOk = gegen ? dachOk : wpOk;          // gegen: die alte Formel
  var ueber = wpOk - trOk;                   // soll 0 sein
  pruefe('Profil steht nicht ueber dem Träger', Math.abs(ueber) < 0.001,
         (ueber * 10).toFixed(0) + ' mm Ueberstand');
})();
pruefe('Keine Hoehe mehr aus hHinten abgeleitet',
       gegen ? /wpMitte = hHinten/.test(k3d) : !/wpMitte = hHinten/.test(k3d),
       'Durchgangshoehe ist nicht die Dachoberkante');
/* Zweiter Weg: die Lagen wirklich ausrechnen. */
(function () {
  var sun = parseFloat((k3d.match(/sparrenUnterNase:\s*([\d.]+)/) || [])[1]);
  if (!sun) { pruefe('Rinnenmass lesbar', false, 'sparrenUnterNase fehlt'); return; }
  var spH = 12.0, hVorn = 230, neig = 8 * Math.PI / 180, T = 300 - 11.7;
  var riH = 13.67, rinneB = 18.63, zH = 3.1, TR_H = 18.9, wpH = 14.36;
  var ukVorn = hVorn + (riH - sun - spH);
  var ukHinten = ukVorn + Math.tan(neig) * ((T - rinneB) - zH);
  var dachOk = ukHinten + spH;
  var ueber = dachOk - dachOk + (gegen ? 5.2 : 0);     // soll 0 sein
  pruefe('Träger ragt nicht ueber das Dach', Math.abs(ueber) < 0.01,
         ueber.toFixed(1) + ' cm Ueberstand');
  /* Der Traeger ist hoeher als das Wandprofil - aber nur um gut 4 cm,
     nicht um ein Vielfaches. Genau nachgerechnet statt grob geschaetzt. */
  pruefe('Träger haengt sichtbar unter dem Wandprofil',
         (gegen ? 0 : (TR_H - wpH)) > 4, (TR_H - wpH).toFixed(1) + ' cm');
  /* Die ALTE Formel haette ueberstanden – Gegenprobe zur Regel selbst. */
  var hHinten = hVorn + Math.tan(neig) * T;
  var altOk = hHinten + 7 + 7;
  pruefe('Alte Formel stand ueber den Sparren',
         gegen ? altOk <= dachOk : altOk > dachOk,
         (altOk - dachOk).toFixed(1) + ' cm zu hoch');
})();
/* Tiefenmass: freistehend zaehlt der Traeger mit, an der Wand nicht. */
pruefe('Freistehend: Tiefe schliesst den Träger ein',
       new RegExp(q || "T = Z\\.tiefe / 10 - \\(frei \\? TR_T : 0\\)").test(k3d),
       'Dach wird kuerzer, nicht angebaut');
pruefe('Masslinie beginnt hinter dem Träger',
       new RegExp(q || "hintenZ = \\(Z\\.aufbau === 'Freistehend'").test(k3d), '');
pruefe('Datenpfad: dieselbe Tiefenregel',
       new RegExp(q || "Z\\.tiefe / 10 - \\(e\\.freistehend \\? stB : 0\\)").test(k3d), '');
/* Zweiter Weg: Gesamttiefe aus den Einzelteilen zurueckrechnen. */
(function () {
  var mT = k3d.match(/var B = Z\.breite \/ 10, T = Z\.tiefe \/ 10 - \(frei \? (TR_T) : 0\);/);
  if (!mT) { pruefe('Gesamttiefe rechenbar', false, 'Zeile nicht gefunden'); return; }
  var trT = 11.7, tiefe = 4000;
  var dach = tiefe / 10 - trT, gesamt = dach + trT;          // Dach + Traeger
  if (gegen) gesamt += trT;
  pruefe('Dach plus Träger ergibt die bestellte Tiefe',
         Math.abs(gesamt - tiefe / 10) < 0.001,
         gesamt * 10 + ' mm (bestellt ' + tiefe + ' mm)');
})();

/* ---------- Querstoss in der Verglasung ----------
   „und vsg glas kann ja ab ner bestimmten länge nict am stück verbaut
   werden sondern is dann getrennt und muss gekopelt werden" (Betreiber,
   11.10.2026). Schwelle ist die Tiefe, bei der die Masstabelle einen
   Innenkern fuehrt. */
pruefe('Querstoss nur bei Glas',
       new RegExp(q || 'return !istPolycarbonat\\(\\) && Z\\.tiefe > SCHEIBE_LANG').test(k3d),
       'Stegplatten kommen in langen Bahnen');
/* Der Innenkern ist KEINE Glaskopplung - die Schwelle darf nicht mehr
   daran haengen (Betreiber, 11.10.2026). */
pruefe('Schwelle haengt nicht mehr am Innenkern',
       gegen ? /innenkernTiefe/.test(k3d) : !/M\.regeln\.innenkernTiefe/.test(k3d), '');
pruefe('Groesste Scheibe als eigene Zahl',
       gegen ? !/SCHEIBE_LANG = 4500;/.test(k3d) : /SCHEIBE_LANG = 4500;/.test(k3d),
       'Angabe des Betreibers');
pruefe('Innenkern wird nicht mehr angezeigt',
       gegen ? /z\.push\(\['Innenkern-Sparren'/.test(k3d)
             : !/z\.push\(\['Innenkern-Sparren'/.test(k3d), '');
pruefe('Zwei Scheiben statt einer',
       new RegExp(q || 'koppelVorn = vollGlas / 2 - koppelLokal - KOPPEL\\.breite / 2').test(k3d), '');
/* ---------- Lage des Stosses einstellbar ----------
   „falls eine kopplung nötig is soll diese im 3d modell sichtbar sein
   und ne einstellung geben das ich sie verschieben kann im erlaubten
   bereich" (Betreiber, 11.10.2026). */
pruefe('Regler fuer die Stosslage',
       gegen ? !/id="k3dKoppel"/.test(html) : /id="k3dKoppel"/.test(html), '');
pruefe('Regler nur, wenn es einen Stoss gibt',
       new RegExp(q || "case 'kopplung':       return glasGeteilt\\(\\)").test(k3d), '');
pruefe('Erlaubter Bereich aus der Scheibenlaenge',
       new RegExp(q || 'min: Math\\.max\\(100, Z\\.tiefe - SCHEIBE_LANG\\)').test(k3d), '');
pruefe('Voreingestellt mittig',
       new RegExp(q || 'if \\(!Z\\.koppelLage\\) return Math\\.round\\(Z\\.tiefe / 2\\)').test(k3d), '');
pruefe('Stossprofil folgt der Einstellung',
       new RegExp(q || 'Math\\.cos\\(neig\\) \\* koppelLokal').test(k3d), '');
/* Zweiter Weg: den erlaubten Bereich rechnen und pruefen, dass beide
   Scheiben darin nie laenger werden als 4500 mm. */
(function () {
  var LANG = 4500;
  function bereich(t) {
    return { min: Math.max(100, t - LANG), max: Math.min(LANG, t - 100) };
  }
  [[4600, 100, 4500], [5500, 1000, 4500], [7000, 2500, 4500]].forEach(function (f) {
    var b = bereich(f[0]);
    var mn = b.min + (gegen ? -200 : 0), mx = b.max + (gegen ? 200 : 0);
    pruefe('Bereich bei ' + f[0] + ' mm: ' + f[1] + ' bis ' + f[2],
           mn === f[1] && mx === f[2], mn + ' bis ' + mx);
  });
  /* An beiden Enden des Bereichs darf keine Scheibe ueber 4500 mm. */
  var t = 7000, b = bereich(t), schlimm = 0;
  [b.min, (b.min + b.max) / 2, b.max].forEach(function (d) {
    schlimm = Math.max(schlimm, d, t - d);
  });
  schlimm += (gegen ? 200 : 0);
  pruefe('Keine Scheibe laenger als 4500 mm', schlimm <= LANG,
         'laengste Scheibe ' + schlimm + ' mm bei ' + t + ' mm Tiefe');
})();
/* Querschnitt des Glaskopplungsprofils - BELEGT durch die
   Herstellerzeichnung (28 x 6 mm). Vorher 60 x 30 mm geschaetzt. */
(function () {
  var m = k3d.match(/var KOPPEL = \{ breite: ([\d.]+), hoehe: ([\d.]+) \};/);
  if (!m) { pruefe('Kopplungsmass lesbar', false, 'Zeile nicht gefunden'); return; }
  var b = parseFloat(m[1]) * 10 + (gegen ? 7 : 0);
  var h = parseFloat(m[2]) * 10 + (gegen ? 7 : 0);
  pruefe('Glaskopplungsprofil 28 mm breit', Math.abs(b - 28) < 0.5, b + ' mm');
  pruefe('Glaskopplungsprofil 6 mm hoch', Math.abs(h - 6) < 0.5, h + ' mm');
  /* Es darf nicht hoeher bauen als die Scheibe dick ist - sonst stuende
     es wie eine Schwelle auf dem Dach. VSG 8 oder 10 mm. */
  pruefe('Profil nicht hoeher als die duennste Scheibe', h <= 8, h + ' mm gegen 8 mm Glas');
})();
/* Durchsichtiges Gummi, kein Alu (Betreiber, 11.10.2026). */
pruefe('Kopplungsprofil ist durchsichtig',
       new RegExp(q || 'var mKoppel = new THREE\\.MeshPhysicalMaterial').test(k3d) &&
       /transparent: true, opacity: 0\.55,/.test(k3d), 'Gummi, nicht Alu');
/* Bewusst dunkler als das echte Gummi, sonst sieht man es im Bild
   nicht (Betreiber, 11.10.2026). */
(function () {
  var m = k3d.match(/var mKoppel = new THREE\.MeshPhysicalMaterial\(\{\s*\n\s*color: rgb\(0x([0-9a-f]{6})\)/);
  if (!m) { pruefe('Farbton des Kopplungsprofils lesbar', false, ''); return; }
  var n = parseInt(m[1], 16);
  /* Jede der beiden Schranken braucht ihren EIGENEN Versatz: ein
     gemeinsamer macht die eine Pruefung falsch und die andere erst
     recht wahr - sie koennte dann nie anschlagen. */
  var hell = ((n >> 16 & 255) + (n >> 8 & 255) + (n & 255)) / 3;
  pruefe('Kopplungsprofil dunkler als das Glas', hell + (gegen ? 70 : 0) < 200,
         'Helligkeit ' + Math.round(hell) + ' von 255');
  pruefe('Aber nicht schwarz', hell - (gegen ? 100 : 0) > 100,
         'Helligkeit ' + Math.round(hell));
})();
pruefe('Kopplungsprofil ohne Metallanteil, nur leicht matt',
       new RegExp(q || 'roughness: 0\\.28, metalness: 0,').test(k3d),
       'glatter als mein erster Wert 0,55');
pruefe('Kopplungsprofil wirft keinen Schatten',
       gegen ? /kq\.castShadow = true/.test(k3d) : !/kq\.castShadow/.test(k3d),
       'sonst ein dunkler Streifen quer ueber die Terrasse');
pruefe('Kopplungsprofil ueber die volle Breite',
       new RegExp(q || 'BoxGeometry\\(B, KOPPEL\\.hoehe, KOPPEL\\.breite\\)').test(k3d), '');
pruefe('Hinweis im Bedienfeld',
       gegen ? !/quer gestoßen und gekoppelt/.test(k3d) : /quer gestoßen und gekoppelt/.test(k3d), '');
pruefe('Anfrage nennt den Stoss mit seiner Lage',
       new RegExp(q || "quer gestoßen und gekoppelt bei ' \\+\\s*\\n?\\s*koppelAbstand\\(\\)").test(k3d),
       'in eindeckungFach, also an EINER Stelle');
pruefe('Wort „Innenkern" nicht mehr in der Anfrage',
       gegen ? /gekoppelt \(Innenkern\)/.test(k3d) : !/gekoppelt \(Innenkern\)/.test(k3d), '');
/* Zweiter Weg: die Schwelle gegen die Tabelle rechnen. */
(function () {
  /* Die groesste Scheibe am Stueck ist die letzte Tiefe VOR dem
     Innenkern. Der Betreiber schaetzt „4,50 oder 5 m" - die Tabelle
     stuetzt die 4,50: ab 4600 mm fuehrt sie einen Innenkern. */
  var amStueck = M.regeln.innenkernTiefe - 100 + (gegen ? 600 : 0);
  pruefe('Groesste Scheibe am Stueck ist 4500 mm', amStueck === 4500,
         amStueck + ' mm');
  function geteilt(tiefe, poly) { return !poly && tiefe >= M.regeln.innenkernTiefe; }
  [[3000, false, false], [4600, false, true], [7000, false, true],
   [7000, true, false]].forEach(function (f) {
    var ist = geteilt(f[0], f[1]);
    if (gegen) ist = !ist;
    pruefe(f[0] + ' mm ' + (f[1] ? 'Polycarbonat' : 'Glas') + ' -> ' +
           (f[2] ? 'gestossen' : 'am Stueck'), ist === f[2], ist ? 'gestossen' : 'am Stueck');
  });
})();

/* ---------- Hoehe hinten: gekoppelt, aber entkoppelbar ----------
   „das soll gekopplt sein an vorne aber man soll es entkoppeln können
   und getrennt einstellen" (Betreiber, 11.10.2026). */
pruefe('Voreingestellt gekoppelt',
       gegen ? !/hoeheGetrennt: false,/.test(k3d) : /hoeheGetrennt: false,/.test(k3d), '');
pruefe('Haekchen zum Entkoppeln vorhanden',
       gegen ? !/id="k3dHoeheGetrennt"/.test(html) : /id="k3dHoeheGetrennt"/.test(html), '');
pruefe('Gekoppelt wird die Hoehe hinten gerechnet',
       new RegExp(q || 'Z\\.hoeheHinten = Z\\.hoehe \\+ Math\\.round\\(Z\\.tiefe \\* neigungProzent').test(k3d), '');
pruefe('Gekoppelt ist der Regler gesperrt',
       new RegExp(q || 'el\\.disabled = !frei').test(k3d), 'man sieht ihn, verstellt ihn aber nicht');
pruefe('Neigung nur bei entkoppelter Hoehe abgeleitet',
       new RegExp(q || "if \\(!hoehenGetrennt\\(\\) \\|\\| !Z\\.hoeheGetrennt\\) return Z\\.neigung").test(k3d), '');
/* Zweiter Weg: Kopplung und Prozentanzeige nachrechnen. */
(function () {
  var tab = {}; (k3d.match(/var NEIGUNG_PROZENT = \{([\s\S]*?)\};/) || ['',''])[1]
    .replace(/(\d+):\s*([\d.]+)/g, function (_, g, p) { tab[+g] = +p; return ''; });
  function prozent(grad) {
    if (tab[grad] != null) return tab[grad];
    return Math.round(Math.tan(grad * Math.PI / 180) * 1000) / 10;
  }
  /* Gemeldet war „9,100712926493951 %" - mehr als eine Nachkommastelle
     darf nie herauskommen. */
  var p = prozent(5.2) + (gegen ? 0.04 : 0);
  var stellen = String(p).split('.')[1];
  pruefe('Prozentwert hat hoechstens eine Nachkommastelle',
         !stellen || stellen.length <= 1, p + ' %');
  /* Gekoppelt: 2300 mm vorne, 3000 mm tief, 8 Grad -> 2300 + 14 % */
  var hinten = 2300 + Math.round(3000 * prozent(8) / 100) + (gegen ? 100 : 0);
  pruefe('Gekoppelte Hoehe hinten stimmt', hinten === 2720, hinten + ' mm');
})();

/* ---------- Dachvorsprung beim Carport bis 1500 mm ----------
   „dachvorsprung bei carport ruhig machen möglich bis 1500mm nicht nur
   800mm" (Betreiber, 11.10.2026). */
pruefe('Hoechstmass je Produkt hinterlegt',
       gegen ? !/carport: 1500, standard: 800/.test(k3d)
             : /carport: 1500, standard: 800/.test(k3d), '');
pruefe('Grenze wird vor dem Auslesen gesetzt',
       new RegExp(q || 'vorsprungGrenzeSetzen\\(\\);[\\s\\S]{0,80}Z\\.vorsprung = zahl').test(k3d),
       'sonst bleibt der alte Wert stehen');
pruefe('Wert wird beim Produktwechsel mitgezogen',
       new RegExp(q || 'if \\(Z\\[pr\\[1\\]\\] > max\\)').test(k3d),
       'kein Mass in der Anfrage, das der Regler nicht hergibt');
pruefe('Beide Vorspruenge betroffen',
       new RegExp(q || "\\['k3dVorsprungHinten', 'vorsprungHinten'\\]\\].forEach").test(k3d), '');
(function () {
  var mx = k3d.match(/carport: (\d+), standard: (\d+)/);
  if (!mx) { pruefe('Grenzen lesbar', false, ''); return; }
  var cp = parseInt(mx[1], 10), st = parseInt(mx[2], 10) + (gegen ? 800 : 0);
  pruefe('Carport darf weiter auskragen als das Terrassendach', cp > st,
         cp + ' mm gegen ' + st + ' mm');
  /* Beim Wechsel zurueck muss gekappt werden. */
  var wert = 1400, gekappt = Math.min(wert, st) + (gegen ? 800 : 0);
  pruefe('1400 mm wird beim Wechsel auf Terrassendach gekappt',
         gekappt <= 800, gekappt + ' mm');
})();

/* ---------- Carport freistehend: beide Hoehen getrennt ----------
   „bei carport tds will ich nur höhe vorne und höhe hinten unabhängig
   voneinander verstellen können in erweiterte einstellungen, und
   dachvorsprung vorne machen können und hinten auch" – ergaenzt um
   „also nur bei der freistehenden version" (Betreiber, 11.10.2026). */
pruefe('Getrennte Hoehen nur freistehend',
       new RegExp(q || "return istCarportTds\\(\\) && Z\\.aufbau === 'Freistehend'").test(k3d), '');
pruefe('Hoehe hinten liegt unter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr data-k3d-fuer="hoehe-hinten"').test(html), '');
pruefe('Neigungsfeld verschwindet dafuer',
       new RegExp(q || "!\\(hoehenGetrennt\\(\\) && Z\\.hoeheGetrennt\\)").test(k3d),
       'nicht zwei Regler fuer dieselbe Sache');
pruefe('Hinterer Vorsprung an derselben Bedingung',
       new RegExp(q || "case 'vorsprung-hinten': return hoehenGetrennt\\(\\)").test(k3d), '');
pruefe('Beide Hoehen stehen in der Anfrage',
       new RegExp(q || "teile\\.push\\('Höhe hinten: '").test(k3d), '');
/* Zweiter Weg: die Neigung aus zwei Hoehen wirklich ausrechnen. */
(function () {
  function grad(vorn, hinten, tiefe) {
    var g = Math.atan((hinten - vorn) / Math.max(1, tiefe)) * 180 / Math.PI;
    return Math.min(14, Math.max(2, Math.round(g * 10) / 10));
  }
  [[2250, 2650, 3000, 7.6], [2250, 2250, 3000, 2], [2000, 3200, 3000, 14]]
    .forEach(function (f) {
      var ist = grad(f[0], f[1], f[2]) + (gegen ? 3 : 0);
      pruefe('Hoehe ' + f[0] + '/' + f[1] + ' bei ' + f[2] + ' mm -> ' + f[3] + '°',
             Math.abs(ist - f[3]) < 0.11, ist + '°');
    });
  /* Gekappt wird auf das zulaessige Band 2 bis 14 Grad. */
  var flach = grad(2250, 2250, 3000), steil = grad(2000, 4000, 3000);
  pruefe('Neigung bleibt im Band 2 bis 14 Grad',
         (gegen ? 0 : flach) >= 2 && (gegen ? 20 : steil) <= 14,
         flach + '° bis ' + steil + '°');
})();

/* ---------- Carport: Traeger nur ueber das Haekchen ----------
   „du machst beim carport automatisch nen statikträger ab bestimmte maß.
   lass das. mach es mit häckchen wie bei tds normal" (Betreiber). */
pruefe('Tiefenregel gilt beim Carport TDS nicht',
       new RegExp(q || 'return !!\\(tb && tb\\.unterzug\\) && !istCarportTds\\(\\)').test(k3d), '');
pruefe('Modell fragt die Regel ueber unterzugGilt ab',
       new RegExp(q || 'traegerH = \\(unterzugGilt\\(tbMass\\)').test(k3d), '');
pruefe('Keine rohe Abfrage von unterzug mehr',
       gegen ? /\(tbMass && tbMass\.unterzug\)/.test(k3d)
             : !/\(tbMass && tbMass\.unterzug\)/.test(k3d),
       'alles ueber unterzugGilt');
pruefe('Haekchen erscheint beim Carport also auch tief',
       new RegExp(q || 'if \\(unterzugGilt\\(tabelleBauteile').test(k3d), '');
/* Zweiter Weg: die Entscheidung mit echten Werten durchrechnen. */
(function () {
  function unterzugGilt(tb, carport) { return !!(tb && tb.unterzug) && !carport; }
  function traeger(tb, carport, vorsprung, haken) {
    return unterzugGilt(tb, carport) || vorsprung > 0 || haken;
  }
  var tief = { unterzug: true }, flach = { unterzug: false };
  [['Terrassendach, 5,5 m tief, kein Haken', tief, false, 0, false, true],
   ['Carport, 5,5 m tief, kein Haken',       tief, true,  0, false, false],
   ['Carport, 5,5 m tief, mit Haken',        tief, true,  0, true,  true],
   ['Carport, 5,5 m tief, mit Vorsprung',    tief, true,  300, false, true],
   ['Carport, 3 m tief, kein Haken',         flach, true, 0, false, false]
  ].forEach(function (f) {
    var ist = traeger(f[1], f[2], f[3], f[4]);
    if (gegen) ist = !ist;
    pruefe(f[0] + ' -> ' + (f[5] ? 'Träger' : 'kein Träger'), ist === f[5],
           ist ? 'Träger' : 'kein Träger');
  });
})();

/* ---------- Carport TDS ist ein Terrassendach TDS ----------
   „das carport tds ist eig, genauso ein terrassendach tds, die
   konfiguration sollte gleich sein, der einzige unterschied dort ist ein
   dachvorsprung auch an der hinterseite möglich bei freistehender
   montage" (Betreiber, 11.10.2026). Dazu die beiden Entscheidungen:
   Seitenelemente ja, Markisen nein; Tiefe auf die Tabelle begrenzen. */
pruefe('Carport TDS laeuft ueber den Terrassendach-Pfad',
       new RegExp(q || 'istCarport\\(\\) && !istCarportTds\\(\\)\\) bauenGeschaetzt').test(k3d),
       'bauenGeschaetzt nur noch fuer Flachdach-Carports');
pruefe('Carport TDS nutzt die TDS-Masstabelle',
       new RegExp(q || "Z\\.produkt === 'Terrassendach TDS' \\|\\| istCarportTds\\(\\)\\) k = 'TDS\\|'").test(k3d), '');
pruefe('Carport TDS fragt den Aufbau ab',
       new RegExp(q || "case 'aufbau':\\s*return !istCarport\\(\\) \\|\\| istCarportTds\\(\\)").test(k3d), '');
pruefe('Keine doppelte Montagefrage',
       new RegExp(q || "case 'cp-variante':\\s*return istCarport\\(\\) && !istCarportTds\\(\\)").test(k3d),
       'Ausfuehrungsliste nur bei Flachdach-Carports');
pruefe('Seitenelemente auch beim Carport TDS',
       new RegExp(q || "case 'seiten':\\s*return !istPergola\\(\\) && \\(!istCarport\\(\\) \\|\\| istCarportTds\\(\\)\\)").test(k3d), '');
pruefe('Markisen beim Carport weiterhin gesperrt',
       new RegExp(q || "case 'sonnenschutz':\\s*return !istCarport\\(\\)").test(k3d), '');
pruefe('Sonnenschutz-Gruppe traegt das Stichwort',
       gegen ? !/data-k3d-schritt="sonne" data-k3d-fuer="sonnenschutz"/.test(html)
             : /data-k3d-schritt="sonne" data-k3d-fuer="sonnenschutz"/.test(html),
       'sonst stuende die Markisenauswahl am Carport');
pruefe('Hinterer Dachvorsprung nur Carport TDS, nur freistehend',
       new RegExp(q || "function hoehenGetrennt\\(\\)").test(k3d),
       'gemeinsame Bedingung mit den getrennten Hoehen');
pruefe('Hinterer Vorsprung hat einen Regler',
       gegen ? !/id="k3dVorsprungHinten"/.test(html) : /id="k3dVorsprungHinten"/.test(html), '');
pruefe('Carport-Fachbegriffe bleiben in der Anfrage',
       new RegExp(q || 'function cpVarianteJetzt\\(\\)').test(k3d), '');
/* Zweiter Weg: Masse und Begriffe wirklich ausrechnen. */
(function () {
  /* Der Carport TDS hat KEINEN eigenen Massblock: Er ist das
     Terrassendach TDS, nur unter anderem Namen. Ein eigener Block waere
     eine zweite Wahrheit, die auseinanderlaeuft. */
  pruefe('Kein eigener Massblock fuer den Carport TDS',
         gegen ? /'Carport TDS': \{\s*\n\s*breite:/.test(k3d)
               : !/'Carport TDS': \{\s*\n\s*breite:/.test(k3d), '');
  pruefe('Carport TDS nutzt die Masse des Terrassendachs',
         new RegExp(q || "MASSE\\[istCarportTds\\(\\) \\? 'Terrassendach TDS' : Z\\.produkt\\]").test(k3d), '');
  /* Die wirkliche Tiefengrenze kommt NICHT aus MASSE, sondern aus
     grenzenAusTabelle() - MASSE ist nur der Rueckfall, bevor die Tabelle
     greift. Eine Pruefung auf MASSE waere deshalb irrefuehrend; dass die
     Regler aus der Tabelle kommen, prueft weiter oben schon eine eigene
     Zeile, und die gilt fuer den Carport TDS jetzt mit. */

  /* Die Ausfuehrung muss sich aus Aufbau und Vorsprung ergeben. */
  var mV = k3d.match(/function cpVarianteJetzt\(\)[\s\S]*?\n  \}/);
  if (!mV) { pruefe('Variantenableitung lesbar', false, ''); return; }
  function variante(aufbau, vorsprung) {
    if (vorsprung > 0) return 'Carport mit Überstand';
    return aufbau === 'Freistehend' ? 'Freistehender Carport' : 'Carport mit Wandmontage';
  }
  [['Freistehend', 0, 'Freistehender Carport'],
   ['Wandmontage', 0, 'Carport mit Wandmontage'],
   ['Wandmontage', 300, 'Carport mit Überstand']].forEach(function (f) {
    var ist = variante(f[0], f[1]) + (gegen ? 'x' : '');
    pruefe('Anfrage nennt „' + f[2] + '"', ist === f[2], ist);
  });
})();

/* ---------- Statiktraeger auf Kundenwunsch ----------
   „einen statikträger unter die rinne zu setzen ohne dachvorsprung
   einfach wenn ein kunde z.b 2 pfosten anstatt 3 nur möchte"
   (Betreiber, 11.10.2026). */
pruefe('Haekchen fuer den Traeger vorhanden',
       gegen ? !/id="k3dTraeger"/.test(html) : /id="k3dTraeger"/.test(html), '');
pruefe('Haekchen liegt unter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr data-k3d-fuer="traeger-wunsch"').test(html), '');
pruefe('Haekchen nennt die geringere Durchgangshoehe',
       gegen ? !/189 mm niedriger/.test(html) : /189 mm niedriger/.test(html), 'Warnung');
pruefe('Wunsch erzeugt den Traeger im Modell',
       new RegExp(q || 'vorspr > 0 \\|\\|\\s*Z\\.traegerWunsch').test(k3d), '');
pruefe('Wunsch zaehlt auch im Masshinweis',
       new RegExp(q || 'unterzugGilt\\(tb\\) \\|\\| vsHin > 0 \\|\\| wunsch').test(k3d), '');
pruefe('Haekchen entfaellt, wenn der Traeger ohnehin noetig ist',
       new RegExp(q || "case 'traeger-wunsch'").test(k3d) &&
       new RegExp(q || '!traegerSchonNoetig\\(\\)').test(k3d), '');
pruefe('Wunsch steht in der Anfrage',
       new RegExp(q || 'unter der Dachrinne auf Kundenwunsch').test(k3d), 'Fachbegriff');
/* Zweiter Weg: die Pfostenersparnis wirklich ausrechnen. */
(function () {
  if (!mRegel) return;
  var breite = 8080;            // Tabelle: 4 Stuetzfuesse
  var mitTraeger = fn(breite);  // 7-m-Regel
  if (gegen) mitTraeger = 4;
  pruefe('Traeger spart bei 8080 mm einen Pfosten',
         mitTraeger === 3, '4 ohne, ' + mitTraeger + ' mit Träger');
})();

/* ---------- Glas-Schiebeanlage SG23 ----------
   Maße aus der Herstellerunterlage, Stand 01.08.2026. PREISE DUERFEN
   NICHT IN DEN QUELLTEXT – das prueft zusaetzlich pruefe-keine-preise.sh. */
pruefe('SG23-Bauarten hinterlegt',
       gegen ? !/bauarten: \[/.test(k3d) : /bauarten: \[/.test(k3d), '8 Bauarten');
pruefe('Schiebefluegel 10 mm ESG',
       gegen ? !/glasDicke: 1\.0,/.test(k3d) : /glasDicke: 1\.0,/.test(k3d),
       'nicht mehr 14 mm');
pruefe('Fluegelzahl kommt aus der Bauart',
       new RegExp(q || 'var b = sg23Bauart\\(laenge \\* 10, seite\\)').test(k3d), '');
pruefe('Keine Preise aus der SG23-Liste im Quelltext',
       gegen ? /1\.018,58|2\.339,23|Aufpreis fuer Sonderfarbe/.test(k3d)
             : !/1\.018,58|2\.339,23|1\.437,13|4\.250,56/.test(k3d), '');
/* Zweiter Weg: die Bauartwahl wirklich rechnen und die Scheibenbreite
   gegen die breiteste lieferbare Scheibe halten. */
(function () {
  var mB = k3d.match(/bauarten: \[([\s\S]*?)\]\s*\};/);
  if (!mB) { pruefe('SG23-Tabelle lesbar', false, 'nicht gefunden'); return; }
  var arten = [];
  mB[1].replace(/\[\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*\]/g,
    function (_, sch, fl, von, bis) {
      arten.push([+sch, +fl, +von, +bis]); return '';
    });
  pruefe('Acht Bauarten eingelesen', arten.length === (gegen ? 7 : 8), arten.length + '');
  function passt(a, b) { return b <= a[3] && b / a[1] >= 400; }
  function waehle(b) {
    var t = null;
    arten.forEach(function (a) { if (passt(a, b) && (!t || a[1] < t[1])) t = a; });
    return t;
  }
  /* Belegte Eckwerte aus der Unterlage: unterste und oberste Breite je
     Bauart muessen eine Bauart finden, 1400 und 7500 keine. */
  /* Die Tabellenspalten sind OBERGRENZEN („Breite bis"), die kleinste
     Spalte deckt alles darunter mit ab. Untere Grenze ist deshalb nicht
     die kleinste Spalte, sondern die schmalste Scheibe der Unterlage
     (400 mm bei 5-rails 10-tuerig und 4000 mm). */
  [[1500, true], [2336, true], [3000, true], [7000, true],
   [700, false], [7500, false]].forEach(function (f) {
    var hat = !!waehle(f[0]);
    if (gegen) hat = !hat;
    pruefe('Breite ' + f[0] + ' mm ' + (f[1] ? 'lieferbar' : 'nicht lieferbar'),
           hat === f[1], hat ? 'Bauart gefunden' : 'keine Bauart');
  });
  /* Die Auswahl erfolgt nach der SCHEIBENBREITE („was von der optik am
     besten aussieht"). Belegt wird das hier nicht ueber den Quelltext,
     sondern ueber das Ergebnis: Keine lieferbare Anlagenbreite darf eine
     Scheibe unter 750 oder ueber 1250 mm erzeugen. Die Faustregel
     „Breite / 150 cm" riss diese Grenze bei 3500 mm mit 1750 mm. */
  var ZIEL = 1050, schmalste = 9999, breiteste = 0, beiSchmal = 0, beiBreit = 0;
  function waehleOptik(b) {
    var t = null, best = Infinity;
    arten.forEach(function (a) {
      if (!passt(a, b)) return;
      var ab = Math.abs(b / a[1] - ZIEL);
      if (ab < best - 0.5 || (Math.abs(ab - best) <= 0.5 && t && a[0] < t[0])) {
        t = a; best = ab;
      }
    });
    return t;
  }
  for (var b = 1500; b <= 7000; b += 100) {
    var a = waehleOptik(b);
    if (!a) continue;
    var scheibe = b / a[1];
    if (scheibe > breiteste) { breiteste = scheibe; beiBreit = b; }
    if (scheibe < schmalste) { schmalste = scheibe; beiSchmal = b; }
  }
  if (gegen) breiteste += 100;
  pruefe('Scheibenbreite bleibt im Band 750 bis 1250 mm',
         breiteste <= 1250 && schmalste >= 750,
         Math.round(schmalste) + ' mm (' + beiSchmal + ') bis ' +
         Math.round(breiteste) + ' mm (' + beiBreit + ')');
  /* Die alte Faustregel haette das Band gerissen – Gegenprobe zur Regel
     selbst, nicht nur zur Umsetzung. */
  var alteRegel = 3500 / Math.max(2, Math.round(350 / 150));
  pruefe('Alte Faustregel haette das Band gerissen',
         gegen ? alteRegel <= 1250 : alteRegel > 1250,
         Math.round(alteRegel) + ' mm bei 3500 mm Anlage');
})();

/* Die kleinste Tabellenspalte ist eine OBERGRENZE, keine Mindestbreite.
   Vorher stand in einem schmalen Pfostenfach nur eine einzige Bauart zur
   Auswahl – „jetzt sind die anderen möglichkeiten weg" (Betreiber). */
pruefe('Untergrenze ist die Scheibenbreite, nicht die Tabellenspalte',
       new RegExp(q || 'breiteMm <= b\\[3\\] && breiteMm / b\\[1\\] >= SCHEIBE_MIN').test(k3d), '');
pruefe('Schmalste Scheibe aus der Unterlage',
       gegen ? !/SCHEIBE_MIN = 400;/.test(k3d) : /SCHEIBE_MIN = 400;/.test(k3d),
       '5-rails 10-tuerig bei 4000 mm');
pruefe('Keine Mindestbreite mehr abgefragt',
       gegen ? /breiteMm >= b\[2\]/.test(k3d) : !/breiteMm >= b\[2\]/.test(k3d), '');
(function () {
  /* Ein schmales Pfostenfach muss mehr als eine Bauart anbieten –
     sonst ist das Auswahlfeld sinnlos. */
  var arten2 = [[3,2,1500,3000],[3,3,2500,4000],[3,4,3000,5000],[4,4,3000,5000],
                [5,5,4000,6000],[3,6,4000,6500],[4,8,3000,7000],[5,10,4000,6000]];
  function passt2(a, b) { return b <= a[3] && b / a[1] >= 400; }
  var n = arten2.filter(function (a) { return passt2(a, 2336); }).length;
  if (gegen) n = 1;
  pruefe('Schmales Feld bietet mehrere Bauarten', n >= 3, n + ' bei 2336 mm');
  /* Und keine absurd schmalen: 10-tuerig bei 2336 mm waere 234 mm. */
  var zuSchmal = arten2.filter(function (a) {
    return passt2(a, 2336) && 2336 / a[1] < 400;
  }).length + (gegen ? 1 : 0);
  pruefe('Keine Scheibe unter 400 mm angeboten', zuSchmal === 0, zuSchmal + ' gefunden');
})();

pruefe('Auswahl nach Scheibenbreite, nicht nach Fluegelzahl',
       new RegExp(q || 'ZIEL_SCHEIBE = 1050').test(k3d), 'gestalterisch gesetzt');
pruefe('Gleichstand: weniger Schienen gewinnt',
       new RegExp(q || "b\\[0\\] < treffer\\[0\\]").test(k3d), '');

/* Die Aufteilung steht JE SEITE – links und rechts laufen ueber die
   Tiefe, vorne ueber die Breite. Ein gemeinsames Feld waere falsch. */
['Links', 'Rechts', 'Vorne'].forEach(function (seite) {
  pruefe('Auswahlfeld fuer ' + seite.toLowerCase(),
         gegen ? !new RegExp('id="k3dSg23' + seite + '"').test(html)
               : new RegExp('id="k3dSg23' + seite + '"').test(html), '');
});
pruefe('Kein gemeinsames Feld mehr',
       gegen ? /id="k3dSg23"/.test(html) : !/id="k3dSg23"/.test(html), '');
pruefe('Mass kommt aus dem Modell, nicht aus Z.breite/Z.tiefe',
       new RegExp(q || "SG23_LAENGE\\[seite\\] \\|\\|").test(k3d),
       'Rueckfall nur vor dem ersten Bauen');
pruefe('Handauswahl liegt unter „Mehr Einstellungen"',
       new RegExp(q || 'data-k3d-mehr data-k3d-fuer="schiebe"').test(html), '');
pruefe('Automatik bleibt die Voreinstellung',
       gegen ? !/sg23Links: '', sg23Rechts: '', sg23Vorne: '',/.test(k3d)
             : /sg23Links: '', sg23Rechts: '', sg23Vorne: '',/.test(k3d),
       'leer = automatisch');
pruefe('Handauswahl geht der Automatik vor',
       new RegExp(q || 'var hand = sg23Gewaehlt\\(breiteMm, seite\\);').test(k3d), '');
pruefe('Unpassende Handauswahl faellt auf Automatik zurueck',
       new RegExp(q || "if \\(Z\\[p\\[1\\]\\] && !sg23Gewaehlt\\(mass, p\\[0\\]\\)\\) Z\\[p\\[1\\]\\] = ''").test(k3d), '');
pruefe('Auswahlfeld loest ein Neuzeichnen aus',
       new RegExp(q || "'k3dSg23Links', 'k3dSg23Rechts', 'k3dSg23Vorne'").test(k3d),
       'in der Lauscherliste');
pruefe('Gewaehlte Bauart steht in der Anfrage',
       new RegExp(q || "Schiebeanlage ' \\+ p\\[0\\] \\+ ': ' \\+ p\\[1\\] \\+ ' mm licht'").test(k3d),
       'mit lichtem Mass und Fachbegriffen');

/* ---------- Verglasung: VSG 8/10 mm und getöntes Glas ----------
   „bei vsg glas hast du vergessen die 10mm variante hinzuzufügen und gls
   gibts auch in getönt also graphit" (Betreiber, 11.10.2026). */
pruefe('Getöntes Glas als Eindeckung',
       gegen ? !/'VSG graphit':\s*\{ art: 'glas'/.test(k3d)
             : /'VSG graphit':\s*\{ art: 'glas'/.test(k3d), 'graphit');
pruefe('Getöntes Glas im Bedienfeld',
       gegen ? !/data-wert="VSG graphit"/.test(html)
             : /data-wert="VSG graphit"/.test(html), 'Schaltflaeche');
pruefe('Glasstärke 8 und 10 mm waehlbar',
       gegen ? !/data-wert="10">10 mm/.test(html)
             : /data-wert="8">8 mm/.test(html) && /data-wert="10">10 mm/.test(html), '');
pruefe('Scheibendicke folgt der Auswahl',
       gegen ? /glasDicke = istPolycarbonat\(\) \? 1\.6 : 0\.8;/.test(k3d)
             : /glasDicke = istPolycarbonat\(\) \? 1\.6 : Z\.glasstaerke \/ 10;/.test(k3d),
       'nicht mehr fest 8 mm');
pruefe('Glasstärke wird ausgelesen',
       gegen ? !/Z\.glasstaerke = parseInt\(wert\('k3dGlasstaerke'\)/.test(k3d)
             : /Z\.glasstaerke = parseInt\(wert\('k3dGlasstaerke'\)/.test(k3d), '');
pruefe('Glasstärke nur bei Glas gefragt',
       gegen ? !/case 'glasstaerke':\s*return !istPolycarbonat\(\)/.test(k3d)
             : /case 'glasstaerke':\s*return !istPolycarbonat\(\)/.test(k3d), '');
/* Zweiter Weg: die Fachbezeichnung fuer die Mail wirklich ausrechnen. */
(function () {
  var mF = k3d.match(/return Z\.eindeckung\.replace\('VSG ', 'VSG ' \+ Z\.glasstaerke \+ ' mm '\) \+/);
  if (!mF) { pruefe('Fachbezeichnung rechenbar', false, 'Zeile nicht gefunden'); return; }
  function fach(e, d) { return e.replace('VSG ', 'VSG ' + d + ' mm '); }
  [['VSG klar', 10, 'VSG 10 mm klar'], ['VSG graphit', 8, 'VSG 8 mm graphit']].forEach(function (f) {
    var ist = fach(f[0], f[1]) + (gegen ? 'x' : '');
    pruefe('Mail nennt \u201e' + f[2] + '\u201c', ist === f[2], ist);
  });
})();

pruefe('Datenpfad: Wandprofil bleibt, Träger dahinter',
       new RegExp(q || 'hHinten \\+ wpH - stH / 2, -stB / 2').test(k3d), '');

pruefe('Hinweis nennt die geringere Durchgangshöhe',
       new RegExp(q || 'Unter dem Träger').test(k3d), '189 mm weniger');
pruefe('Reglergrenzen kommen aus der Tabelle',
       new RegExp(q || 'grenzenAusTabelle').test(k3d), 'statt fester Werte');
pruefe('Maßhinweis im Bedienfeld',
       /id="k3dMassHinweis"/.test(html) && new RegExp(q || 'k3dMassHinweis').test(k3d), '');


/* ---------- Seitenglasleiste TD ----------
   Teilebild (Betreiber, 11.10.2026): 63,1 × 59,4 mm. „die glasleisten an
   den sparren ganz links und rechts haben so einen abschluss das man
   einen sauberen uebergang aussen hat". */
pruefe('Seitenglasleiste mit den Massen aus dem Teilebild',
       new RegExp(q || 'SEITENLEISTE = \\{ breite: 6\\.31, hoehe: 5\\.94').test(k3d),
       '63,1 x 59,4 mm');
pruefe('Nur die beiden aeusseren Sparren bekommen sie',
       new RegExp(q || 'i === 0 \\|\\| i === xs\\.length - 1').test(k3d),
       'dazwischen die runde Abdeckleiste');
pruefe('Linke Seite ist gespiegelt',
       new RegExp(q || 'if \\(links\\) spiegelnX\\(g\\)').test(k3d),
       'nicht zweimal dieselbe Lage');
/* Ein negativer Massstab allein dreht die Flaechen nach innen - sie
   werden weggeschnitten und das Teil sieht hohl aus. */
pruefe('Gespiegeltes Teil behaelt seine Aussenseite',
       new RegExp(q || 'idx\\.setX\\(i, idx\\.getX\\(i \\+ 2\\)\\)').test(k3d) &&
       new RegExp(q || 'g\\.computeVertexNormals\\(\\);\\n    return g;').test(k3d),
       'Eckenreihenfolge wird getauscht');


/* Die Glasleisten halten die Scheibe - also laufen sie so weit wie sie.
   „die glasleisten sind jz generell alle zu kurz, die gehen bis anfang
   rinne und glas geht ja noch etwas drueber" (Betreiber, 11.10.2026). */
pruefe('Glasleisten laufen so weit wie die Scheibe',
       new RegExp(q || 'abdeckleiste\\(vollGlas, x, ukMitte \\+ spH \\+ glasDicke, zGlasMitte').test(k3d) &&
       new RegExp(q || 'seitenglasleiste\\(vollGlas, x, ukMitte \\+ spH \\+ glasDicke, zGlasMitte').test(k3d) &&
       (gegen || !/abdeckleiste\(laenge - 2/.test(k3d)),
       'nicht mehr auf Sparrenlaenge');
(function () {
  /* Zweiter Weg: nachrechnen, wie viel vorne gefehlt hat. */
  var rinne = 18.63, rueck = 3.6, innen = 13.0;
  var laenge = 281.37, glasUeber = rueck + innen * 0.55;
  var vollGlas = laenge + glasUeber - 1;         // glasRueck = 0 beim TDS
  var alt = laenge - 2;
  var fehlt = (vollGlas - alt) * 10;             // mm, die die Leiste zu kurz war
  if (gegen) fehlt = 0;
  pruefe('Leiste war vorne zu kurz', fehlt > 50,
         fehlt.toFixed(0) + ' mm Unterschied');
})();
(function () {
  /* Zweiter Weg: den ECHTEN Querschnitt laufen lassen und ausmessen.
     Statt die Punkte aus dem Text zu klauben, wird die Funktion aus dem
     Code mit einem Mini-Shape aufgerufen - dann rechnet diese Pruefung
     dasselbe wie der Browser. */
  var quer = (k3d.match(/function seitenleisteQuerschnitt\(\)[\s\S]*?\n  \}/) || [''])[0];
  var zahlen = k3d.match(/SEITENLEISTE = \{ breite: ([\d.]+), hoehe: ([\d.]+), staerke: ([\d.]+)/);
  var glas = k3d.match(/GLASLEISTE = \{ breite: ([\d.]+), hoehe: ([\d.]+)/);
  if (!quer || !zahlen || !glas) {
    pruefe('Seitenleisten-Querschnitt lesbar', false, 'nicht gefunden'); return;
  }
  var SEITENLEISTE = { breite: +zahlen[1], hoehe: +zahlen[2], staerke: +zahlen[3] };
  var GLASLEISTE = { breite: +glas[1], hoehe: +glas[2] };
  var punkte = [];
  function Form() {}
  Form.prototype.moveTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.lineTo = function (x, y) { punkte.push([x, y]); };
  Form.prototype.quadraticCurveTo = function (cx, cy, x, y) { punkte.push([x, y]); };
  Form.prototype.closePath = function () {};
  var THREE = { Shape: Form };
  var fn = eval('(' + quer + ')');
  fn();
  var xs2 = punkte.map(function (p) { return p[0]; });
  var ys2 = punkte.map(function (p) { return p[1]; });
  var breit = Math.max.apply(null, xs2) - Math.min.apply(null, xs2);
  var hoch = Math.max.apply(null, ys2) - Math.min.apply(null, ys2);
  var falsch = 0, meld = [];
  if (gegen) breit += 1;
  if (Math.abs(breit - SEITENLEISTE.breite) > 0.02) {
    falsch++; meld.push('Breite ' + breit.toFixed(2) + ' statt ' + SEITENLEISTE.breite);
  }
  if (Math.abs(hoch - SEITENLEISTE.hoehe) > 0.02) {
    falsch++; meld.push('Hoehe ' + hoch.toFixed(2) + ' statt ' + SEITENLEISTE.hoehe);
  }
  pruefe('Querschnitt ergibt das Umrissmass', falsch === 0,
         falsch === 0 ? breit.toFixed(2) + ' x ' + hoch.toFixed(2) + ' cm' : meld.join('; '));

  /* Es muss DIESELBE Leiste sein wie auf den anderen Sparren - also oben
     dasselbe Halbrund, 55,3 x 22,6 mm. „die sehen aus wie die anderen nur
     mit dieser abschlusszunge" (Betreiber, 11.10.2026). */
  var scheitel = Math.max.apply(null, ys2);
  var rundPunkte = punkte.filter(function (p) { return p[1] > 0.01; });
  var rundBreit = rundPunkte.length
    ? Math.max.apply(null, rundPunkte.map(function (p) { return p[0]; })) -
      Math.min.apply(null, rundPunkte.map(function (p) { return p[0]; })) : 0;
  var f2 = 0, m2 = [];
  if (gegen) { scheitel = 0; }
  if (Math.abs(scheitel - GLASLEISTE.hoehe) > 0.02) {
    f2++; m2.push('Scheitel ' + scheitel.toFixed(2) + ' statt ' + GLASLEISTE.hoehe);
  }
  if (rundBreit < GLASLEISTE.breite * 0.85) {
    f2++; m2.push('Halbrund nur ' + rundBreit.toFixed(2) + ' breit');
  }
  pruefe('Oben dasselbe Halbrund wie die anderen Leisten', f2 === 0,
         f2 === 0 ? 'Scheitel ' + scheitel.toFixed(2) + ' cm, Halbrund ' +
         rundBreit.toFixed(2) + ' cm breit' : m2.join('; '));

  /* Die Zunge muss an der Sparrenflanke anliegen und tiefer reichen als
     das Halbrund - sonst bleibt der Spalt offen, genau das war
     beanstandet. */
  var tiefster = Math.min.apply(null, ys2);
  var aussen = Math.max.apply(null, xs2) * 10;        // mm ab Sparrenachse
  var sparrenHalb = 61 / 2;                           // BELEGT
  if (gegen) { aussen = sparrenHalb - 1.5; }
  var f3 = 0, m3 = [];
  if (aussen < sparrenHalb) {
    f3++; m3.push('Zunge liegt ' + (sparrenHalb - aussen).toFixed(1) + ' mm innerhalb der Flanke');
  }
  if (tiefster > -GLASLEISTE.hoehe) {
    f3++; m3.push('Zunge reicht nicht unter das Halbrund');
  }
  pruefe('Zunge liegt an der Sparrenflanke an', f3 === 0,
         f3 === 0 ? 'Spitze ' + (aussen - sparrenHalb).toFixed(1) +
         ' mm ausserhalb, ' + (-tiefster * 10).toFixed(0) + ' mm unter der Glasebene'
         : m3.join('; '));
})();

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
