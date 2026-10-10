#!/usr/bin/env node
/* Prüft, ob der 3D-Konfigurator und der Anfrage-Assistent dieselbe Sprache
 * sprechen – und ob die Oberfläche zu jedem Produkt im Modell passt.
 *
 * Hintergrund: Der Konfigurator schickte seine Konfiguration als Vorgabe in
 * den Assistenten ("VSG-Glas", "Ja"). Der Assistent kennt dort aber nur die
 * ausführlichen Werte ("VSG-Glas Opal (milchig)", "Ja, mit LED-Spots").
 * Folge: Im Assistenten war keine Auswahl markiert und in der E-Mail an den
 * Betrieb stand bei der Beleuchtung eine leere Zeile – der Kundenwunsch war
 * unterwegs verloren gegangen, ohne dass irgendwo eine Fehlermeldung kam.
 *
 * Geprüft wird:
 *   1. Jeder Wert, den der Konfigurator übergibt, ist im Assistenten eine
 *      echte Auswahlmöglichkeit (Produkt, Carport-Typ, Ausführung, Dach,
 *      Eindeckung, Farbe, LED, Montage, Aufbau)
 *   2. Jedes Produkt im Auswahlfeld hat Maßbereiche im Modell (MASSE)
 *   3. Jeder Carport-Typ im Auswahlfeld hat Ausführungen (CP_VARIANTEN)
 *   4. Jedes data-k3d-fuer in der Seite wird im Skript ausgewertet
 *
 * Bewusst anders gebaut als der Konfigurator selbst: hier wird aus den
 * fertigen Dateien zurückgelesen, nicht aus einer gemeinsamen Liste – eine
 * gemeinsame Liste würde den Fehler mitwandern lassen.
 *
 * Gegenprobe: node scripts/pruefe-konfigurator.js --gegenprobe
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.dirname(__dirname);
const K3D = path.join(WURZEL, 'js', 'konfigurator-3d.js');
const WIZARD = path.join(WURZEL, 'js', 'anfrage-wizard.js');
const SEITE = path.join(WURZEL, 'konfigurator.html');

/* ---------- Lesen ---------- */

// Alle Auswahlwerte des Assistenten: { value: 'Carport TDS', … }
function wizardWerte(quelle) {
  const werte = new Set();
  const re = /\{\s*value:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(quelle))) werte.add(m[1].replace(/\\'/g, "'"));
  return werte;
}

// <option value="…"> eines Auswahlfeldes der Seite
function optionen(html, id) {
  const block = new RegExp('<select id="' + id + '"[^>]*>([\\s\\S]*?)</select>').exec(html);
  if (!block) return null;
  const werte = [];
  const re = /<option value="([^"]*)"/g;
  let m;
  while ((m = re.exec(block[1]))) werte.push(m[1]);
  return werte;
}

// Rechte Seite einer Zuordnung im Konfigurator-Skript, z. B. VORGABE_VERGLASUNG
function zuordnungsZiele(quelle, name) {
  const block = new RegExp('var ' + name + '\\s*=\\s*\\{([\\s\\S]*?)\\};').exec(quelle);
  if (!block) return null;
  const werte = [];
  const re = /:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block[1]))) werte.push(m[1].replace(/\\'/g, "'"));
  return werte;
}

// Schlüssel eines Objekts im Konfigurator-Skript (CP_VARIANTEN, MASSE)
function schluessel(quelle, name) {
  const block = new RegExp('var ' + name + "\\s*=\\s*\\{([\\s\\S]*?)\\n  \\};").exec(quelle);
  if (!block) return null;
  const werte = [];
  const re = /^\s{4}'([^']+)':/gm;
  let m;
  while ((m = re.exec(block[1]))) werte.push(m[1]);
  return werte;
}

// Die Ausführungen selbst: ['Freistehender Carport', 'Freistehend']
function cpVariantenWerte(quelle) {
  const block = /var CP_VARIANTEN\s*=\s*\{([\s\S]*?)\n  \};/.exec(quelle);
  if (!block) return null;
  const werte = [];
  const re = /\[\s*'((?:[^'\\]|\\.)*)'\s*,/g;
  let m;
  while ((m = re.exec(block[1]))) werte.push(m[1].replace(/\\'/g, "'"));
  return werte;
}

/* ---------- Prüfen ---------- */
function pruefen(k3d, wizard, html) {
  const fehler = [];
  const auswahl = wizardWerte(wizard);
  function mussKennen(was, wert) {
    if (!wert) { fehler.push(was + ': kein Wert gefunden'); return; }
    if (!auswahl.has(wert)) {
      fehler.push(was + ': "' + wert + '" ist im Anfrage-Assistenten keine Auswahlmöglichkeit');
    }
  }

  // 1. Übergabewerte
  const produkte = optionen(html, 'k3dProdukt');
  const cpTypen = optionen(html, 'k3dCpTyp');
  const cpDach = optionen(html, 'k3dCpDach');
  const montage = optionen(html, 'k3dMontage');
  const aufbau = optionen(html, 'k3dAufbau');
  if (!produkte) fehler.push('Seite: Auswahlfeld k3dProdukt fehlt');
  (produkte || []).forEach(function (p) { mussKennen('Produkt', p); });
  (cpTypen || []).forEach(function (t) { mussKennen('Carport-Typ', t); });
  (cpDach || []).forEach(function (d) { mussKennen('Dach', d); });
  (montage || []).forEach(function (m) { mussKennen('Montage', m); });
  (aufbau || []).forEach(function (a) { mussKennen('Aufbau', a); });
  (cpVariantenWerte(k3d) || []).forEach(function (v) { mussKennen('Ausführung', v); });
  (zuordnungsZiele(k3d, 'VORGABE_VERGLASUNG') || []).forEach(function (v) { mussKennen('Eindeckung', v); });
  (zuordnungsZiele(k3d, 'VORGABE_LED') || []).forEach(function (v) { mussKennen('LED', v); });
  (zuordnungsZiele(k3d, 'VORGABE_FARBE') || []).forEach(function (v) { mussKennen('Farbe', v); });

  // Jede Farbfläche der Seite braucht eine Übersetzung mit RAL-Nummer
  const farbBlock = /var VORGABE_FARBE\s*=\s*\{([\s\S]*?)\};/.exec(k3d);
  const reFarbe = /data-k3d-farbe="([^"]+)"/g;
  let mf;
  while ((mf = reFarbe.exec(html))) {
    if (!farbBlock || farbBlock[1].indexOf("'" + mf[1] + "'") === -1) {
      fehler.push('Farbe "' + mf[1] + '" hat keine Übersetzung in VORGABE_FARBE');
    }
  }

  // Die Eindeckungs-Auswahl der Seite muss im Skript eine Übersetzung haben
  const vorgabeBlock = /var VORGABE_VERGLASUNG\s*=\s*\{([\s\S]*?)\};/.exec(k3d);
  (optionen(html, 'k3dEindeckung') || []).forEach(function (e) {
    if (!vorgabeBlock || vorgabeBlock[1].indexOf("'" + e + "'") === -1) {
      fehler.push('Eindeckung "' + e + '" hat keine Übersetzung in VORGABE_VERGLASUNG');
    }
  });

  // 2. Maßbereiche je Produkt
  const masse = schluessel(k3d, 'MASSE') || [];
  (produkte || []).forEach(function (p) {
    if (masse.indexOf(p) === -1) fehler.push('Produkt "' + p + '" hat keine Maßbereiche in MASSE');
  });

  // 3. Ausführungen je Carport-Typ
  const variantenTypen = schluessel(k3d, 'CP_VARIANTEN') || [];
  (cpTypen || []).forEach(function (t) {
    if (variantenTypen.indexOf(t) === -1) {
      fehler.push('Carport-Typ "' + t + '" hat keine Ausführungen in CP_VARIANTEN');
    }
  });

  // 4. Sichtbarkeits-Stichworte
  const stichworte = new Set();
  const reF = /data-k3d-fuer="([^"]+)"/g;
  let m;
  while ((m = reF.exec(html))) m[1].split(/\s+/).forEach(function (s) { stichworte.add(s); });
  const gilt = /function gruppeGilt\(stichwort\) \{([\s\S]*?)\n  \}/.exec(k3d);
  stichworte.forEach(function (s) {
    if (!gilt || gilt[1].indexOf("'" + s + "'") === -1) {
      fehler.push('data-k3d-fuer="' + s + '" wird in gruppeGilt() nicht ausgewertet');
    }
  });
  if (!stichworte.size) fehler.push('Seite: kein data-k3d-fuer gefunden – Produktumschaltung wirkungslos?');

  return { fehler: fehler, produkte: produkte || [], auswahl: auswahl.size, stichworte: stichworte.size };
}

/* ---------- Gegenprobe ---------- */
function gegenprobe() {
  const k3d = fs.readFileSync(K3D, 'utf8');
  const wizard = fs.readFileSync(WIZARD, 'utf8');
  const html = fs.readFileSync(SEITE, 'utf8');

  const faelle = [
    ['alte, kurze Eindeckungs-Angabe',
     function () { return [k3d.replace("'VSG-Glas Opal (milchig)'", "'VSG-Glas'"), wizard, html]; },
     /Eindeckung: "VSG-Glas"/],
    ['LED-Vorgabe ohne passenden Auswahlwert',
     function () { return [k3d.replace("'Ja, mit LED-Spots'", "'Ja'"), wizard, html]; },
     /LED: "Ja"/],
    ['Produkt ohne Maßbereiche',
     function () { return [k3d.replace("    'Flachdach SkyView': {", "    'Flachdach SkyViewX': {"), wizard, html]; },
     /Maßbereiche in MASSE/],
    ['Farbe ohne RAL-Nummer',
     function () { return [k3d.replace("'Anthrazit (RAL 7016)'", "'Anthrazit'"), wizard, html]; },
     /Farbe: "Anthrazit"/],
    ['Stichwort ohne Auswertung',
     function () { return [k3d, wizard, html.replace('data-k3d-fuer="carport"', 'data-k3d-fuer="veranda"')]; },
     /data-k3d-fuer="veranda"/]
  ];

  console.log('Gegenprobe: fünf absichtliche Fehler einbauen');
  let schlecht = 0;
  faelle.forEach(function (f) {
    const q = f[1]();
    const fehler = pruefen(q[0], q[1], q[2]).fehler;
    const erkannt = fehler.some(function (x) { return f[2].test(x); });
    console.log('  ' + (erkannt ? 'erkannt      ' : 'NICHT ERKANNT') + '  ' + f[0]);
    if (!erkannt) schlecht++;
  });
  if (schlecht) { console.log('Ergebnis: FEHLGESCHLAGEN'); return 1; }
  console.log('Ergebnis: bestanden – alle eingebauten Fehler wurden gefunden');
  return 0;
}

function main() {
  if (process.argv.indexOf('--gegenprobe') > -1) return gegenprobe();

  const e = pruefen(fs.readFileSync(K3D, 'utf8'),
                    fs.readFileSync(WIZARD, 'utf8'),
                    fs.readFileSync(SEITE, 'utf8'));
  console.log('3D-Konfigurator: ' + e.produkte.length + ' Produkte (' + e.produkte.join(', ') + '), ' +
              e.stichworte + ' Sichtbarkeits-Stichworte, ' +
              e.auswahl + ' Auswahlwerte im Assistenten');
  if (!e.fehler.length) {
    console.log('  ok      alle Übergabewerte kennt der Anfrage-Assistent');
    console.log('Ergebnis: bestanden');
    return 0;
  }
  e.fehler.forEach(function (f) { console.log('  FEHLER  ' + f); });
  console.log('Ergebnis: nicht bestanden');
  return 1;
}

process.exit(main());
