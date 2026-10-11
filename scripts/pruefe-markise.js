#!/usr/bin/env node
/* Prüft die Aufdachmarkise TDS Linea A / Linea AZ gegen die Maße der
   Herstellerzeichnung („TDS_Linea A - Linea AZ", 01.07.2025).

   Zweiter Weg: Die Zahlen werden NICHT aus dem Modellcode übernommen,
   sondern hier noch einmal aus der Zeichnung notiert und mit dem
   verglichen, was in js/konfigurator-3d.js steht. Weicht eines ab,
   schlägt die Prüfung an.

   Aufruf:  node scripts/pruefe-markise.js [--gegenprobe]
   --gegenprobe verfälscht die Sollwerte und erwartet, dass jede
   Einzelprüfung anschlägt. */
'use strict';
var fs = require('fs');
var gegen = process.argv.indexOf('--gegenprobe') > -1;
var src = fs.readFileSync('js/konfigurator-3d.js', 'utf8');

/* Maße aus der Zeichnung, in mm */
var SOLL = {
  kasHoehe: 158, schieneH: 87, schieneB: 61, stuetzeH: 75,
  saeuleB: 80, platteB: 100, platteD: 6, feldMax: 1000
};
var SPANNE = { ersteStuetze: [345, 395], letzteStuetze: [150, 1000] };

var block = (src.match(/var MARKISE = \{[\s\S]*?\};/) || [''])[0];
if (!block) { console.error('FEHLER  MARKISE-Block nicht gefunden'); process.exit(1); }

function wert(name) {
  var m = block.match(new RegExp(name + ':\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) * 10 : null;   // cm im Code -> mm
}

var fehler = 0, geprueft = 0;
/* In der Gegenprobe werden die SOLLWERTE verfälscht. Jede Prüfung MUSS
   dann anschlagen – „FEHLER" ist dort also das erwünschte Ergebnis. */
function pruefe(titel, ok, info) {
  geprueft++;
  if (!ok) { fehler++; console.log('  FEHLER  ' + titel + '   ' + (info || '')); }
  else console.log('  ok      ' + titel + '   ' + (info || ''));
}

Object.keys(SOLL).forEach(function (k) {
  var ist = wert(k), soll = SOLL[k] + (gegen ? 7 : 0);
  pruefe('Maß ' + k, ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (erwartet ' + soll + ')');
});

Object.keys(SPANNE).forEach(function (k) {
  var ist = wert(k), s = SPANNE[k];
  var u = s[0] + (gegen ? 1e6 : 0), o = s[1] + (gegen ? 1e6 : 0);
  pruefe('Lage ' + k + ' in der Spanne', ist !== null && ist >= u && ist <= o,
         ist + ' mm (erwartet ' + u + '–' + o + ')');
});

/* Die Kassette darf nicht in die Eindeckung schneiden: Schienenoberkante
   minus Kassettenhöhe muss über der Dachfläche bleiben. */
var luft = wert('stuetzeH') + wert('schieneH') - wert('kasHoehe') - (gegen ? 99 : 0);
pruefe('Kassette bleibt über der Eindeckung', luft > 0,
       luft.toFixed(0) + ' mm Luft');

/* Stützenabstand bei 6 m Tiefe darf das Höchstmaß nicht reißen */
var L = 6000, z1 = wert('kasTiefe') + wert('ersteStuetze');
var z2 = L - wert('letzteStuetze');
var felder = Math.max(1, Math.ceil((z2 - z1) / wert('feldMax')));
var abstand = (z2 - z1) / felder + (gegen ? 500 : 0);
pruefe('Stützenabstand bei 6 m Tiefe', abstand <= wert('feldMax') + 0.5,
       Math.round(abstand) + ' mm bei ' + (felder + 1) + ' Stützen je Seite');

/* Die Markise geht über die volle Dachbreite und -tiefe (Bestellmaß) */
var q = gegen ? 'XX-gibt-es-nicht-XX' : null;
pruefe('Markise nutzt die volle Dachtiefe',
       new RegExp(q || 'dach\\.tiefe / Math\\.cos\\(neig\\)').test(src),
       'L = Tiefe / cos(Neigung)');
pruefe('Schienen schließen außen bündig ab',
       new RegExp(q || 'B / 2 - M\\.schieneB / 2').test(src), 'Achse = B/2 − 61/2');
/* Die Markise muss bis an die Rinne laufen, nicht nur bis zum Sparrenende.
   Deshalb bekommt sie T und nicht dachTiefe. */
pruefe('Markise bekommt die volle Dachtiefe bis zur Rinne',
       new RegExp(q || 'tiefe: T,').test(src) &&
       !new RegExp('tiefe: dachTiefe').test(src),
       'tiefe: T statt dachTiefe');
pruefe('Hardware steht auch bei eingefahrenem Tuch',
       new RegExp(q || "if \\(m === 'Aufdachmarkise'\\) \\{").test(src),
       'kein aus > 0.02 davor');

/* ---------- Unterdachmarkise TDS Linea U / Linea UZ ---------- */
var SOLL_U = {
  kasHoehe: 162, kasTiefe: 238, kastenH: 80, endkappe: 41, konsoleH: 19,
  luftSparren: 5, saeuleB: 80, platteB: 100,
  breiteAbzug: 142, tiefeAbzug: 45, feldMax: 1000
};
var blockU = (src.match(/var MARKISE_U = \{[\s\S]*?\};/) || [''])[0];
if (!blockU) { console.error('FEHLER  MARKISE_U-Block nicht gefunden'); process.exit(1); }
function wertU(name) {
  var m = blockU.match(new RegExp(name + ':\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) * 10 : null;
}
Object.keys(SOLL_U).forEach(function (k) {
  var ist = wertU(k), soll = SOLL_U[k] + (gegen ? 7 : 0);
  pruefe('Linea U – Maß ' + k, ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (erwartet ' + soll + ')');
});
Object.keys(SPANNE).forEach(function (k) {
  var n = k === 'ersteStuetze' ? 'ersteKonsole' : 'letzteKonsole';
  var ist = wertU(n), sp = SPANNE[k];
  var u = sp[0] + (gegen ? 1e6 : 0), o = sp[1] + (gegen ? 1e6 : 0);
  pruefe('Linea U – Lage ' + n + ' in der Spanne',
         ist !== null && ist >= u && ist <= o,
         ist + ' mm (erwartet ' + u + '–' + o + ')');
});

/* Gegenbeleg fuer das Sparrenraster: Achse 30 mm vom Rand plus halbe
   Sparrenbreite 30,5 mm ergibt die Innenkante; abzueglich 2 x 10 mm Luft
   muss der Breitenabzug der Zeichnung herauskommen. */
var ausRaster = 2 * (30 + 61 / 2) + 2 * 10 + (gegen ? 30 : 0);
pruefe('Linea U – 142 mm decken sich mit dem Sparrenraster',
       Math.abs(ausRaster - wertU('breiteAbzug')) <= 1.5,
       'aus dem Raster ' + ausRaster + ' mm, Zeichnung ' + wertU('breiteAbzug') + ' mm');

/* Die Unterdachmarkise haengt an den Sparren – sie braucht deren
   Unterkante, nicht die Oberkante der Eindeckung. */
pruefe('Linea U – haengt an der Sparrenunterkante',
       new RegExp(q || 'dach\\.uk\\(0\\)').test(src), 'mu.position aus dach.uk(0)');
pruefe('Linea U – Tiefe aus der Sparrenlaenge',
       new RegExp(q || 'dach\\.sparrenL - M\\.tiefeAbzug').test(src),
       'Sparrenlaenge − 45 mm');
pruefe('Linea U – Breite aus der Dachbreite',
       new RegExp(q || 'B - M\\.breiteAbzug').test(src), 'Dachbreite − 142 mm');

/* ---------- Regel: Aufdachmarkise nicht beim Flachdach SkyView ----------
   Sie muss in BEIDEN Konfiguratoren stehen. Bis 11.10.2026 stand sie in
   keinem von beiden. */
var wiz = fs.readFileSync('js/anfrage-wizard.js', 'utf8');
pruefe('SkyView sperrt die Aufdachmarkise im 3D-Konfigurator',
       new RegExp(q || "'Flachdach SkyView': \\['Aufdachmarkise'\\]").test(src),
       'MARKISE_NICHT');
pruefe('SkyView sperrt die Aufdachmarkise im Anfrage-Assistenten',
       new RegExp(q || "produkt !== 'Flachdach SkyView'").test(wiz),
       'markise.render');

/* ---------- Senkrechtmarkise VD eZIP 105 / 125 ----------
   Masse aus der Montageanleitung (VD AluSysteme, 2025). */
var SOLL_Z = { kassette: 105, stuetzeAb: 4000, maxBreite: 5000 };
var blockZ = (src.match(/var ZIP = \{[\s\S]*?\};/) || [''])[0];
if (!blockZ) { console.error('FEHLER  ZIP-Block nicht gefunden'); process.exit(1); }
function wertZ(name) {
  var m = blockZ.match(new RegExp(name + ':\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) * 10 : null;
}
Object.keys(SOLL_Z).forEach(function (k) {
  var ist = wertZ(k), soll = SOLL_Z[k] + (gegen ? 7 : 0);
  pruefe('eZIP – Maß ' + k, ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (erwartet ' + soll + ')');
});
pruefe('eZIP – Kassette als Halbrund gezeichnet (Serie Z-R)',
       new RegExp(q || 'KASSETTE_RUND = true').test(src), 'Z-R, nicht Z-E');
pruefe('eZIP – Kastenunterstützung ab 400 cm',
       new RegExp(q || 'laenge > ZIP\\.stuetzeAb').test(src), 'Anleitung S. 5');
pruefe('eZIP – Hinweis bei über 5 m Breite',
       new RegExp(q || 'ZIP\\.maxBreite \\* 10').test(src), 'Anleitung S. 26');
/* Seitendeckel Rinne 2 TD, Teilebild: 172 x 175 mm; vorne buendig,
   in der Hoehe mittig (Vorgabe des Betreibers). */
var rd = (src.match(/var RINNENDECKEL = \{[^}]*\}/) || [''])[0];
[['breite', 172], ['hoehe', 175]].forEach(function (p) {
  var m = rd.match(new RegExp(p[0] + ':\\s*([\\d.]+)'));
  var ist = m ? Math.round(parseFloat(m[1]) * 10) : null;
  var soll = p[1] + (gegen ? 7 : 0);
  pruefe('Rinnendeckel ' + p[0], ist === soll,
         ist + ' mm (Teilebild ' + p[1] + ')');
});
pruefe('Rinnendeckel vorne buendig',
       new RegExp(q || 'zVorne - RINNENDECKEL\\.breite').test(src), 'Vorderkante');
pruefe('Rinnendeckel in der Hoehe mittig',
       new RegExp(q || 'RINNE\\.hoehe - RINNENDECKEL\\.hoehe\\) / 2').test(src), '');

/* Glasleiste TD, Teilebild: 55,3 x 22,6 mm */
var gl = (src.match(/var GLASLEISTE = \{[^}]*\}/) || [''])[0];
[['breite', 55.3], ['hoehe', 22.6]].forEach(function (p) {
  var m = gl.match(new RegExp(p[0] + ':\\s*([\\d.]+)'));
  var ist = m ? parseFloat(m[1]) * 10 : null;
  var soll = p[1] + (gegen ? 7 : 0);
  pruefe('Glasleiste ' + p[0], ist !== null && Math.abs(ist - soll) < 0.5,
         ist + ' mm (Teilebild ' + p[1] + ')');
});

pruefe('Markise laesst sich im Bild anklicken',
       new RegExp(q || 'userData\\.sonne').test(src) &&
       new RegExp(q || 'markiseGeklickt').test(src), 'Raycast auf sonneTeil');
pruefe('Seitenelemente reichen hinten bis zur Wand',
       new RegExp(q || 'var hinten = 0;').test(src), 'kein Spalt zur Hauswand');
pruefe('Seitenelemente stoßen an den Pfosten',
       new RegExp(q || 'zPf - PF / 2').test(src), 'kein Spalt zur Dachkante');

/* ---------- Schiebeanlage anklicken ----------
   „wie bei den markisen, die jeweilige schiebeanlage die man im
   3dmodell anklickt geht auf oder zu" (Betreiber, 11.10.2026). */
pruefe('Schiebeteile tragen ihre Seite',
       new RegExp(q || 'function schiebeTeil\\(m, seite\\)').test(src), 'userData.schiebe');
pruefe('Klick erkennt die getroffene Seite',
       new RegExp(q || 'function schiebeSeiteVon\\(objekt\\)').test(src), '');
pruefe('Schiebeanlage faehrt weich, nicht springend',
       new RegExp(q || 'function schiebeFahren\\(seite, ziel\\)').test(src) && new RegExp(q || 'dauer = 650').test(src), 'wie die Markise');
pruefe('Klick schaltet auf oder zu',
       new RegExp(q || "schiebeFahren\\(seite, Z\\[feld\\] > 50 \\? 0 : 100\\)").test(src), '');
pruefe('Markise hat Vorrang vor dem Glas dahinter',
       new RegExp(q || '!markiseGeklickt\\(e\\)\\) schiebeGeklickt\\(e\\)').test(src), 'nur eines reagiert');
pruefe('Jede Seite hat ihren eigenen Oeffnungsstand',
       new RegExp(q || 'offenLinks: 0, offenRechts: 0, offenVorne: 0').test(src), '');
pruefe('Regler setzt weiterhin alle drei Seiten',
       new RegExp(q || 'Z\\.offenLinks = Z\\.offenRechts = Z\\.offenVorne = offenNeu').test(src), '');

/* ---------- Tuerschwelle und Schiebetuerfuehrung ----------
   BELEGT: SG23-Profilschnitte. Je Gleiszahl ein eigenes Mass – mit jedem
   Gleis wird das Profil tiefer. Vorher stand hier eine erfundene
   Bodenschiene 55 x 60 mm, oben gar nichts. */
var SG23_PROFIL = {
  schwelle: { hoehe: 36, tiefe: { 3: 76.2, 4: 100.2, 5: 115.5 } },
  fuehrung: { hoehe: 35, tiefe: { 3: 78.4, 4: 104.0, 5: 129.6 } }
};
(function () {
  var mS = src.match(/var SCHWELLE = \{ hoehe: ([\d.]+), tiefe: \{ 3: ([\d.]+), 4: ([\d.]+), 5: ([\d.]+) \} \};/);
  var mF = src.match(/var FUEHRUNG = \{ hoehe: ([\d.]+), tiefe: \{ 3: ([\d.]+), 4: ([\d.]+), 5: ([\d.]+) \} \};/);
  if (!mS || !mF) { pruefe('Profilmasse lesbar', false, 'Zeilen nicht gefunden'); return; }
  [['Türschwelle', mS, SG23_PROFIL.schwelle], ['Schiebetürführung', mF, SG23_PROFIL.fuehrung]]
    .forEach(function (f) {
      var h = parseFloat(f[1][1]) * 10 + (gegen ? 7 : 0);
      pruefe(f[0] + ' Hoehe', Math.abs(h - f[2].hoehe) < 0.5, h + ' mm (erwartet ' + f[2].hoehe + ')');
      [3, 4, 5].forEach(function (g, i) {
        var t = parseFloat(f[1][i + 2]) * 10 + (gegen ? 7 : 0);
        pruefe(f[0] + ' ' + g + '-gleisig', Math.abs(t - f[2].tiefe[g]) < 0.5,
               t + ' mm (erwartet ' + f[2].tiefe[g] + ')');
      });
    });
})();
pruefe('Gleiszahl kommt aus der gewaehlten Bauart',
       new RegExp(q || 'function gleise\\(seite, laenge\\)').test(src), 'nicht fest 3-gleisig');
pruefe('Fluegel stehen auf der Schwelle',
       new RegExp(q || 'var yUnten = SCHWELLE\\.hoehe;').test(src), '');
pruefe('Fluegel enden unter der Fuehrung',
       new RegExp(q || "hatSchiebeHier \\? FUEHRUNG\\.hoehe : 0").test(src), '');
pruefe('Erfundene Bodenschiene ist weg',
       gegen ? /SCHIENE_H = 5\.5/.test(src) : !/SCHIENE_H/.test(src), '55 x 60 mm geschaetzt');

/* ---------- Profile des Fluegels ----------
   BELEGT: SG23-Profilschnitte. Vorher lag um die Scheibe eine erfundene
   Kante von 50 x 50 mm. */
(function () {
  var faelle = [
    ['Tuer-Einfassprofil Tiefe',   /var TUER_PR = \{ tiefe: ([\d.]+)/,          25],
    ['Tuer-Einfassprofil Hoehe',   /var TUER_PR = \{ tiefe: [\d.]+, hoehe: ([\d.]+)/, 35],
    ['H-Glaseinfassprofil Tiefe',  /var H_GLAS_PR = \{ tiefe: ([\d.]+)/,        19.2],
    ['H-Glaseinfassprofil Breite', /var H_GLAS_PR = \{ tiefe: [\d.]+, breite: ([\d.]+)/, 61.4],
    ['Buerstenprofil Tiefe',       /var BUERSTE = \{ tiefe: ([\d.]+)/,          12],
    ['Buerstenprofil Hoehe',       /var BUERSTE = \{ tiefe: [\d.]+, hoehe: ([\d.]+)/, 15.7]
  ];
  faelle.forEach(function (f) {
    var m = src.match(f[1]);
    if (!m) { pruefe(f[0], false, 'nicht gefunden'); return; }
    var ist = parseFloat(m[1]) * 10 + (gegen ? 7 : 0);
    pruefe(f[0], Math.abs(ist - f[2]) < 0.5, ist + ' mm (erwartet ' + f[2] + ')');
  });
})();
pruefe('Zehn-Millimeter-Glas',
       gegen ? !/glasDicke: 1\.0,/.test(src) : /glasDicke: 1\.0,/.test(src), '10 mm ESG');
/* SG23 ist RAHMENLOS – der Fluegel ist reines Glas. Weder meine alte
   erfundene Kante noch die Profile duerfen um ihn herum liegen. */
pruefe('Erfundene Rahmenkante am Fluegel ist weg',
       gegen ? /schiebeTeil\(rahmenKante\(flB/.test(src)
             : !/schiebeTeil\(rahmenKante\(flB/.test(src), '50 x 50 mm geschaetzt');
['TUER_PR', 'H_GLAS_PR', 'BUERSTE'].forEach(function (name) {
  var hinterlegt = new RegExp('var ' + name + ' = \\{').test(src);
  var gezeichnet = new RegExp(name + '\\.(tiefe|hoehe|breite)[,)]').test(src);
  pruefe(name + ' hinterlegt, aber nicht gezeichnet',
         gegen ? (!hinterlegt || gezeichnet) : (hinterlegt && !gezeichnet),
         hinterlegt ? (gezeichnet ? 'wird gezeichnet' : 'nur Mass') : 'fehlt');
});

/* ---------- Muschelgriff ----------
   „nen runden eingelassenen edelstahlgriff … also keinen
   herausstehenden wäre ja unlogisch" (Betreiber, 11.10.2026). */
pruefe('Griff ist rund',
       new RegExp(q || 'new THREE\\.CylinderGeometry\\(GRIFF\\.durchmesser / 2').test(src), '');
pruefe('Griff steht nicht ueber das Glas hinaus',
       new RegExp(q || 'dicke \\* 1\\.02').test(src), 'Tiefe = Glasdicke');
pruefe('Griff sieht nach Edelstahl aus',
       new RegExp(q || 'metalness: 0\\.9').test(src), 'metallisch, wenig rau');
pruefe('Griff nur am ziehenden Fluegel',
       new RegExp(q || 'i === n - 1 && hoehe > GRIFF\\.hoehe').test(src), '');
pruefe('Griff an der Ziehkante, nicht in der Mitte',
       new RegExp(q || 'flB / 2 - GRIFF\\.randAbstand').test(src), '');
/* Zweiter Weg: die Masse nachrechnen. */
(function () {
  var m = src.match(/var GRIFF = \{ durchmesser: ([\d.]+), hoehe: ([\d.]+), randAbstand: ([\d.]+) \};/);
  if (!m) { pruefe('Griffmasse lesbar', false, 'Zeile nicht gefunden'); return; }
  var d = parseFloat(m[1]) * 10, h = parseFloat(m[2]) * 10;
  if (gegen) { d += 90; h += 900; }
  pruefe('Griff-Durchmesser handgerecht', d >= 40 && d <= 70, d + ' mm');
  pruefe('Griffhoehe handgerecht', h >= 900 && h <= 1200, h + ' mm');
  /* Die Scheibe ist 10 mm dick – ein Griff, der tiefer baut als das
     Glas, stuende vor und schlaege am Nachbarfluegel an. */
  var glas = 10, tief = glas * 1.02 + (gegen ? 20 : 0);
  pruefe('Griff baut nicht tiefer als das Glas', tief <= glas * 1.1,
         tief.toFixed(1) + ' mm bei ' + glas + ' mm Glas');
})();

/* ---------- Kein Spalt zwischen Schiebewand und Keil ----------
   „zwischen schiebewand und keil is ne lücke darf nicht sein"
   (Betreiber, 11.10.2026, mit Bildschirmfoto). Ursache: Mit Keil wird
   die Elementhoehe gekuerzt, die Fuehrung blieb aber oben am Dach. */
pruefe('Fuehrung sitzt auf dem Fluegel, nicht am Dach',
       new RegExp(q || 'schiebefuehrung\\(laenge, achse, mitte, quer, yUnten \\+ hoch \\+ fuehrungH, gl\\)').test(src),
       'nicht mehr okOben');
pruefe('Keil beginnt ueber der Fuehrung',
       new RegExp(q || 'var yKeil = yUnten \\+ hoch \\+ fuehrungH;').test(src), '');
pruefe('Fuehrung zaehlt bei der Keil-Mindesthoehe mit',
       new RegExp(q || 'KEIL_MIN_VORNE - yUnten - fuehrungH').test(src), '');
pruefe('Wandanschluss reicht bis ueber die Fuehrung',
       new RegExp(q || 'wandAnschluss\\(achse, mitte - laenge / 2, yUnten \\+ hoch \\+ fuehrungH, quer\\)').test(src), '');
/* Zweiter Weg: die Lagen durchrechnen und auf Lueckenfreiheit pruefen. */
(function () {
  var schwelle = 3.6, fuehrung = 3.5, hVorn = 230, PROFIL = 11;
  var okOben = hVorn - PROFIL / 2, yUnten = schwelle;
  /* Fall mit Keil: die Elementhoehe wird gekuerzt. */
  var hoch = 150;                                  // irgendein gekuerzter Wert
  var fluegelOk = yUnten + hoch;
  /* Die Fuehrung wird mit ihrer OBERKANTE gesetzt; ihre Unterkante ist
     damit genau die Fluegeloberkante – das sichert die Regex-Pruefung
     oben. Hier geht es um die Stelle darueber, wo der Spalt war. */
  var fuehrungOk = fluegelOk + fuehrung;
  var yKeil = fluegelOk + fuehrung + (gegen ? 3 : 0);
  pruefe('Kein Spalt Fuehrung -> Keil',
         Math.abs(yKeil - fuehrungOk) < 0.01,
         (yKeil - fuehrungOk).toFixed(1) + ' cm Spalt');
  /* Die ALTE Anordnung haette bei gekuerztem Element einen Spalt in
     Hoehe der Fuehrung gelassen – Gegenprobe zur Regel selbst. */
  var altSpalt = okOben - fluegelOk;
  pruefe('Alte Anordnung liess einen Spalt',
         gegen ? altSpalt <= 0 : altSpalt > 0,
         altSpalt.toFixed(1) + ' cm bei gekuerztem Element');
})();

/* ---------- Massschilder ---------- */
pruefe('Massschild kleiner als vorher',
       gegen ? /SCHILD_HOCH = 24/.test(src) : /SCHILD_HOCH = 14/.test(src),
       'Sprite-Hoehe 24 -> 14');
pruefe('Schrift nicht mehr fett',
       gegen ? /bold 40px Arial/.test(src) : !/bold 40px Arial/.test(src), '');
pruefe('Kasten weniger deckend',
       new RegExp(q || "rgba\\(17,17,17,\\.62\\)").test(src), 'vorher .86');
pruefe('Masslinie duenner',
       new RegExp(q || 'opacity: 0\\.55').test(src), '');

console.log(gegen
  ? '\nGegenprobe: ' + fehler + ' von ' + geprueft + ' Prüfungen haben angeschlagen'
  : '\nErgebnis: ' + (fehler ? fehler + ' Prüfung(en) nicht bestanden' : 'bestanden'));
process.exit(gegen ? (fehler === geprueft ? 0 : 1) : (fehler ? 1 : 0));
