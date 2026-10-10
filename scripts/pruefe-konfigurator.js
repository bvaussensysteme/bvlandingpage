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
const BAUTEILE = path.join(WURZEL, 'js', 'bauteile.js');
/* Die Artikelliste des Herstellers liegt bewusst NICHT im Repository
   (.gitignore). Ist sie da, wird gegen sie geprüft; ist sie nicht da, wird
   die Prüfung ausdrücklich übersprungen – nicht stillschweigend bestanden. */
const EINDECKUNG_CSV = path.join(WURZEL, 'daten', 'profile-und-eindeckung.csv');

/* Auswahlwerte eines einzelnen Schrittes im Anfrage-Assistenten.
   Gelesen wird der Block von "<name>: {" bis zum nächsten Schritt. */
function wizardSchritt(quelle, name) {
  const anfang = quelle.indexOf('\n    ' + name + ': {');
  if (anfang === -1) return null;
  const rest = quelle.slice(anfang + 8);
  const ende = rest.search(/\n    [a-z_]+: \{\n      title:/);
  const block = ende === -1 ? rest : rest.slice(0, ende);
  const werte = [];
  const re = /value: '((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block))) werte.push(m[1].replace(/\\'/g, "'"));
  return werte;
}

/* Werte einer Knopfreihe im 3D-Konfigurator (data-k3d-seg) */
function segWerte(html, id) {
  const reihe = new RegExp('data-k3d-seg="' + id + '"[^>]*>([\\s\\S]*?)</div>').exec(html);
  if (!reihe) return null;
  const werte = [];
  const re = /data-wert="([^"]*)"/g;
  let m;
  while ((m = re.exec(reihe[1]))) werte.push(m[1]);
  return werte;
}

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
/* Auswahlwerte eines Bedienelements. Produkt, Aufbau, Eindeckung und Boden
   stehen seit dem Umbau auf das Vollbild-Layout als Knopfreihe im HTML
   (versteckes Feld + <button data-wert>), die übrigen weiterhin als
   Auswahlfeld. Beide Formen werden hier gelesen – sonst prüft das Skript
   nach einem Umbau stillschweigend nichts mehr. */
function optionen(html, id) {
  const feld = new RegExp('<select id="' + id + '"[^>]*>([\\s\\S]*?)</select>').exec(html);
  if (feld) {
    const werte = [];
    const re = /<option value="([^"]*)"/g;
    let m;
    while ((m = re.exec(feld[1]))) werte.push(m[1]);
    return werte;
  }
  const reihe = new RegExp('data-k3d-seg="' + id + '"[^>]*>([\\s\\S]*?)</div>').exec(html);
  if (!reihe) return null;
  const werte = [];
  const re2 = /data-wert="([^"]*)"/g;
  let m2;
  while ((m2 = re2.exec(reihe[1]))) werte.push(m2[1]);
  return werte.length ? werte : null;
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
function pruefen(k3d, wizard, html, bauteile, csv) {
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
  /* Beim Lamellendach heißen Farbe und Beleuchtung im Assistenten anders als
     beim Terrassendach. Genau solche Doppelungen gehen sonst unter. */
  (zuordnungsZiele(k3d, 'VORGABE_FARBE_PERGOLA') || []).forEach(function (v) { mussKennen('Farbe (Pergola)', v); });
  (zuordnungsZiele(k3d, 'VORGABE_LED_PERGOLA') || []).forEach(function (v) { mussKennen('LED (Pergola)', v); });
  ['k3dPgDachart', 'k3dPgAusfuehrung', 'k3dPgSeitenschutz'].forEach(function (id) {
    (optionen(html, id) || []).forEach(function (v) { mussKennen(id.replace('k3dPg', 'Pergola '), v); });
  });

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

  /* 5. Neigung: zeichnet der Konfigurator genau die Systeme geneigt, die die
     Herstellerdaten als geneigt führen? js/bauteile.js führt dazu GENEIGT
     (BELEGT, technische-daten.md 1). Die geschätzte Carport-Zeichnung hatte
     dort 1,5° für das Flachdach – im Widerspruch zu den eigenen Daten, und
     sichtbar als nach vorn kippendes Dach. Vom Betreiber beanstandet. */
  if (bauteile) {
    const g = /var GENEIGT = \{([^}]*)\}/.exec(bauteile);
    const flachUndGeneigt = g && /'Flat Line':\s*true/.test(g[1]);
    const ausdruck = /var NEIGUNG = \(tds \? ([0-9.]+) : ([0-9.]+)\)/.exec(k3d);
    if (!g) {
      fehler.push('js/bauteile.js: GENEIGT nicht gefunden – Neigung nicht prüfbar');
    } else if (!ausdruck) {
      fehler.push('Konfigurator: Neigung des Flachdach-Carports nicht gefunden');
    } else if (!flachUndGeneigt && parseFloat(ausdruck[2]) !== 0) {
      fehler.push('Neigung: Flat Line/Flat Box gelten laut GENEIGT als Flachdach, ' +
                  'der Konfigurator zeichnet sie aber mit ' + ausdruck[2] + '° Gefälle');
    }
  }

  /* 6. Eindeckungen: jede Ausführung der Stegplatte aus der Artikelliste des
     Herstellers muss im Konfigurator wählbar sein. Zweiter, anders gebauter
     Weg: gelesen wird die CSV, nicht unsere eigene Tabelle. */
  if (csv) {
    const gefunden = new Set();
    const re = /Sechsfachstegplatten[^,"]*\s(\w+)"/g;
    let mc;
    while ((mc = re.exec(csv))) gefunden.add(mc[1].toLowerCase());
    const uebersetzt = { bronce: 'bronze' };
    const angeboten = (optionen(html, 'k3dEindeckung') || []).join(' ').toLowerCase();
    gefunden.forEach(function (a) {
      const name = uebersetzt[a] || a;
      if (angeboten.indexOf('polycarbonat ' + name) === -1) {
        fehler.push('Eindeckung: Stegplatte "' + a + '" steht in der Artikelliste, ' +
                    'ist im Konfigurator aber nicht wählbar');
      }
    });
    if (!gefunden.size) fehler.push('Artikelliste: keine Sechsfachstegplatten gefunden');
  }

  /* 7. Fragen einander angleichen.
     Der Betreiber will einen gemeinsamen Fragensatz: was der eine fragt,
     fragt der andere auch, mit denselben Worten. Zwei getrennte Listen sind
     dafür die Gefahr – also wird hier verglichen, Wert für Wert.

     Zwei Abweichungen sind gewollt und stehen deshalb als Ausnahme hier:
       · Eindeckung: der 3D-Konfigurator kennt kein „Noch unsicher", weil
         das Modell immer etwas zeichnen muss. Die Übersetzung prüft
         VORGABE_VERGLASUNG weiter oben.
       · Erweiterungen „Keine Angabe": im 3D-Konfigurator ist das einfach
         eine leere Auswahl, kein eigener Knopf. */
  const paare = [
    ['k3dMarkise', 'markise', 'Sonnenschutz'],
    ['k3dUntergrund', 'untergrund', 'Untergrund'],
    ['k3dFassade', 'fassade', 'Fassade'],
    ['k3dMontage', 'montage', 'Montage'],
    ['k3dAufbau', 'aufbau', 'Aufbau']
  ];
  paare.forEach(function (pr) {
    const imModell = segWerte(html, pr[0]);
    const imAssistenten = wizardSchritt(wizard, pr[1]);
    if (!imModell) { fehler.push(pr[2] + ': Knopfreihe ' + pr[0] + ' fehlt im Konfigurator'); return; }
    if (!imAssistenten) { fehler.push(pr[2] + ': Schritt ' + pr[1] + ' fehlt im Assistenten'); return; }
    imModell.forEach(function (w) {
      if (imAssistenten.indexOf(w) === -1) {
        fehler.push(pr[2] + ': "' + w + '" steht im 3D-Konfigurator, im Assistenten aber nicht');
      }
    });
    imAssistenten.forEach(function (w) {
      if (imModell.indexOf(w) === -1) {
        fehler.push(pr[2] + ': "' + w + '" steht im Assistenten, im 3D-Konfigurator aber nicht');
      }
    });
  });

  // Seitliche Erweiterungen: dieselben sechs Möglichkeiten in beiden
  const erwWizard = (/var ERW_OPTS = \[([\s\S]*?)\];/.exec(wizard) || [])[1];
  const erw3d = (/var ERW_OPTS = \[([\s\S]*?)\];/.exec(k3d) || [])[1];
  if (!erwWizard || !erw3d) {
    fehler.push('Erweiterungen: ERW_OPTS fehlt im Assistenten oder im Konfigurator');
  } else {
    /* Im Assistenten stehen Objekte ({ value: 'Keil', img: 'keil' }), im
       Konfigurator nur die Werte. Ohne diese Unterscheidung zählt der
       Bilddateiname als eigene Erweiterung. */
    const liste = function (t, nurValue) {
      const w = [];
      const re = nurValue ? /value: '((?:[^'\\]|\\.)*)'/g : /'((?:[^'\\]|\\.)*)'/g;
      let m;
      while ((m = re.exec(t))) if (m[1] !== 'Keine Angabe') w.push(m[1].replace(/\\'/g, "'"));
      return w;
    };
    const a = liste(erwWizard, true), b = liste(erw3d, false);
    a.forEach(function (w) {
      if (b.indexOf(w) === -1) fehler.push('Erweiterung "' + w + '" fehlt im 3D-Konfigurator');
    });
    b.forEach(function (w) {
      if (a.indexOf(w) === -1) fehler.push('Erweiterung "' + w + '" fehlt im Anfrage-Assistenten');
    });
  }

  /* 8. Die REGELN beim Schließen der Seiten müssen in beiden dieselben
     sein – nicht nur die Auswahlmöglichkeiten. Falsch wäre hier nicht
     bloß unschön: Wer im Konfigurator eine Schiebetür ohne Keil zusammen-
     stellt, bekäme ein Angebot über etwas, das so nicht gebaut wird.

     Verglichen werden drei Dinge:
       · welche Erweiterungen den Keil erzwingen
       · welche sich gegenseitig ausschließen
       · bei welchen Produkten es den Keil überhaupt gibt */
  function werteAusListe(quelle, name) {
    const m = new RegExp('var ' + name + ' = \\[([^\\]]*)\\]').exec(quelle);
    if (!m) return null;
    const w = [];
    const re = /'((?:[^'\\]|\\.)*)'/g;
    let x;
    while ((x = re.exec(m[1]))) w.push(x[1].replace(/\\'/g, "'"));
    return w;
  }
  function unvertraeglich(quelle, name) {
    const m = new RegExp('var ' + name + ' = \\{([\\s\\S]*?)\\n  \\};').exec(quelle)
           || new RegExp('var ' + name + ' = \\{([\\s\\S]*?)\\};').exec(quelle);
    if (!m) return null;
    const karte = {};
    const re = /'((?:[^'\\]|\\.)*)':\s*\[([^\]]*)\]/g;
    let x;
    while ((x = re.exec(m[1]))) {
      const w = [];
      const re2 = /'((?:[^'\\]|\\.)*)'/g;
      let y;
      while ((y = re2.exec(x[2]))) w.push(y[1]);
      karte[x[1]] = w.sort().join(',');
    }
    return karte;
  }

  const keilW = werteAusListe(wizard, 'ERW_REQUIRES_KEIL');
  const keil3 = werteAusListe(k3d, 'ERW_BRAUCHT_KEIL');
  if (!keilW || !keil3) {
    fehler.push('Keil-Regel: Liste fehlt im Assistenten oder im Konfigurator');
  } else if (keilW.slice().sort().join(',') !== keil3.slice().sort().join(',')) {
    fehler.push('Keil-Regel: "' + keilW.join(', ') + '" im Assistenten, "' +
                keil3.join(', ') + '" im Konfigurator');
  }

  const inkW = unvertraeglich(wizard, 'ERW_INCOMPAT');
  const ink3 = unvertraeglich(k3d, 'ERW_UNVERTRAEGLICH');
  if (!inkW || !ink3) {
    fehler.push('Unverträglichkeiten: Tabelle fehlt im Assistenten oder im Konfigurator');
  } else {
    Object.keys(inkW).forEach(function (k) {
      if (ink3[k] !== inkW[k]) {
        fehler.push('Unverträglichkeit "' + k + '": Assistent sagt [' + inkW[k] +
                    '], Konfigurator sagt [' + (ink3[k] === undefined ? 'nichts' : ink3[k]) + ']');
      }
    });
    Object.keys(ink3).forEach(function (k) {
      if (inkW[k] === undefined) {
        fehler.push('Unverträglichkeit "' + k + '" kennt nur der Konfigurator');
      }
    });
  }

  // Bei welchen Produkten gibt es den Keil? (Funktionsrumpf vergleichen)
  function keilProdukte(quelle, name) {
    const m = new RegExp('function ' + name + '\\(\\) \\{([\\s\\S]*?)\\n  \\}').exec(quelle);
    if (!m) return null;
    const w = [];
    const re = /'((?:[^'\\]|\\.)*)'/g;
    let x;
    while ((x = re.exec(m[1]))) w.push(x[1]);
    return w.sort().join(',');
  }
  const kpW = keilProdukte(wizard, 'keilAllowed');
  const kp3 = keilProdukte(k3d, 'keilErlaubt');
  if (kpW === null || kp3 === null) {
    fehler.push('Keil-Produkte: keilAllowed/keilErlaubt nicht gefunden');
  } else if (kpW !== kp3) {
    fehler.push('Keil gibt es laut Assistent bei [' + kpW + '], laut Konfigurator bei [' + kp3 + ']');
  }

  return { fehler: fehler, produkte: produkte || [], auswahl: auswahl.size,
           stichworte: stichworte.size, csvGeprueft: !!csv };
}

/* ---------- Gegenprobe ---------- */
function gegenprobe() {
  const k3d = fs.readFileSync(K3D, 'utf8');
  const wizard = fs.readFileSync(WIZARD, 'utf8');
  const html = fs.readFileSync(SEITE, 'utf8');
  const bauteile = fs.existsSync(BAUTEILE) ? fs.readFileSync(BAUTEILE, 'utf8') : '';
  const csv = fs.existsSync(EINDECKUNG_CSV) ? fs.readFileSync(EINDECKUNG_CSV, 'utf8') : '';

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
    ['Lamellendach-Ausführung verfälscht',
     function () { return [k3d, wizard, html.replace('value="SunPro"', 'value="SunProX"')]; },
     /Pergola Ausfuehrung: "SunProX"|Pergola Ausf\u00fchrung: "SunProX"/],
    ['Creme-Weiß durch Reinweiß ersetzt',
     function () { return [k3d.replace("'Creme-Weiß (RAL 9010)'", "'Cremeweiß'"), wizard, html]; },
     /Farbe \(Pergola\): "Cremeweiß"/],
    ['Farbe ohne RAL-Nummer',
     function () { return [k3d.replace("'Anthrazit (RAL 7016)'", "'Anthrazit'"), wizard, html]; },
     /Farbe: "Anthrazit"/],
    ['Stichwort ohne Auswertung',
     function () { return [k3d, wizard, html.replace('data-k3d-fuer="carport"', 'data-k3d-fuer="veranda"')]; },
     /data-k3d-fuer="veranda"/],
    /* Genau der Fehler, den der Betreiber am Flat-Box-Dach gesehen hat */
    ['Flachdach-Carport wieder mit Gefälle',
     function () {
       return [k3d.replace('var NEIGUNG = (tds ? 6 : 0)', 'var NEIGUNG = (tds ? 6 : 1.5)'),
               wizard, html, bauteile, csv];
     },
     /Gefälle|Gef\u00e4lle/],
    ['Sonnenschutz-Angebot laeuft auseinander',
     function () {
       return [k3d, wizard,
               html.replace('data-wert="Sonnensegel"', 'data-wert="Sonnensegel XL"'),
               bauteile, csv];
     },
     /Sonnenschutz: "Sonnensegel/],
    ['Erweiterung nur in einem der beiden',
     function () {
       return [k3d.replace("'Schiebetür', 'Plankenwand'", "'Schiebetür', 'Plankenwand2'"),
               wizard, html, bauteile, csv];
     },
     /Erweiterung "Plankenwand"/],
    ['Keil-Pflicht laeuft auseinander',
     function () {
       return [k3d.replace("var ERW_BRAUCHT_KEIL = ['Velaris', 'Senkrechtmarkise', 'Schiebetür'];",
                           "var ERW_BRAUCHT_KEIL = ['Velaris', 'Senkrechtmarkise'];"),
               wizard, html, bauteile, csv];
     },
     /Keil-Regel/],
    ['Unvertraeglichkeit nur in einem der beiden',
     function () {
       return [k3d.replace("'Rahmenwand':       ['Velaris']", "'Rahmenwand':       []"),
               wizard, html, bauteile, csv];
     },
     /Unverträglichkeit "Rahmenwand"/],
    ['Keil bei einem anderen Produkt erlaubt',
     function () {
       return [k3d.replace("if (Z.produkt === 'Terrassendach TDS') return true;",
                           "if (Z.produkt === 'Flachdach SkyView') return true;"),
               wizard, html, bauteile, csv];
     },
     /Keil gibt es laut/],
    ['Stegplatte aus der Artikelliste fehlt im Konfigurator',
     function () {
       return [k3d, wizard,
               html.replace('data-wert="Polycarbonat graphit"', 'data-wert="Polycarbonat grafit"'),
               bauteile, csv];
     },
     /Artikelliste|Stegplatte/]
  ];

  console.log('Gegenprobe: ' + faelle.length + ' absichtliche Fehler einbauen');
  let schlecht = 0;
  faelle.forEach(function (f) {
    const q = f[1]();
    const fehler = pruefen(q[0], q[1], q[2], q[3] !== undefined ? q[3] : bauteile,
                           q[4] !== undefined ? q[4] : csv).fehler;
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
                    fs.readFileSync(SEITE, 'utf8'),
                    fs.existsSync(BAUTEILE) ? fs.readFileSync(BAUTEILE, 'utf8') : '',
                    fs.existsSync(EINDECKUNG_CSV) ? fs.readFileSync(EINDECKUNG_CSV, 'utf8') : '');
  console.log('3D-Konfigurator: ' + e.produkte.length + ' Produkte (' + e.produkte.join(', ') + '), ' +
              e.stichworte + ' Sichtbarkeits-Stichworte, ' +
              e.auswahl + ' Auswahlwerte im Assistenten');
  if (!e.csvGeprueft) {
    console.log('  übersprungen  Eindeckungen gegen die Artikelliste – ' +
                'daten/profile-und-eindeckung.csv liegt nicht vor (gehört nicht ins Repo)');
  }
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
