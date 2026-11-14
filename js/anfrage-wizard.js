/* ============================================================
   BV AussenSysteme – Anfrage-Assistent (geführtes Kundenleitsystem)
   Ersetzt das klassische Kontaktformular durch einen mehrstufigen
   Frage-Ablauf mit Zusammenfassung. Vanilla JS, keine Abhängigkeiten.
   ============================================================ */
(function () {
  'use strict';

  var FORMSPREE = 'https://formspree.io/f/xnjkabdv'; // nur noch Notfall-Backup
  var WEB3FORMS = 'https://api.web3forms.com/submit'; // primärer E-Mail-Weg (kostenlos)
  var WEB3FORMS_KEY = '7c268c76-c83b-4011-87de-5a843195ac0d'; // öffentlicher Access Key
  var KONTAKT_API = '/api/kontakt'; // Worker → Neon-Datenbank
  var WA_NUMBER = '4915678696609';
  var MAIL = 'info@bv-aussensysteme.de';
  var ASSET_VER = '20261104b'; // Versions-Stempel für Wizard-Bilder (Cache-Bust)

  /* „Wie sind Sie auf uns aufmerksam geworden?" – optionale Herkunftsfrage */
  var ANREDE_OPTS = ['Frau', 'Herr', 'Divers'];
  var QUELLE_OPTS = ['Empfehlung', 'Google', 'Website', 'Social Media', 'Messe',
    'Fahrzeugwerbung', 'Zeitung/Anzeige', 'Bestandskunde', 'Sonstiges'];

  /* ---- Milde Spam-/Fake-Erkennung (bewusst tolerant, blockt nur Offensichtliches) ----
     Ziel: Test-/Platzhaltereingaben abfangen, ohne echte Kunden zu verlieren. */
  // Eindeutig unechte Einzel-Namen (Vor- oder Nachname). Keine echten Vornamen hier!
  var FAKE_NAME_TOKENS = ['test', 'tester', 'testtest', 'testkunde', 'test test',
    'asdf', 'asdfasdf', 'asd', 'asddd', 'qwer', 'qwert', 'qwertz', 'qwerty',
    'xxx', 'xyz', 'abc', 'abcabc', 'fake', 'spam', 'blabla', 'bla', 'lol',
    'mustermann', 'musterfrau', 'vorname', 'nachname', 'keineangabe',
    'none', 'null', 'kein', 'unbekannt', 'fdsa', 'yxcv'];
  // Eindeutig unechte vollständige Namen (Vorname + Nachname zusammen)
  var FAKE_FULL_NAMES = ['max mustermann', 'erika mustermann', 'erika musterfrau',
    'max muster', 'john doe', 'jane doe', 'test test', 'max test'];
  // Wegwerf-/Testmail-Domains
  var DISPOSABLE_MAIL = ['example.com', 'example.de', 'example.org', 'test.de',
    'test.com', 'test.test', 'mail.com', 'mailinator.com', 'trashmail.com',
    'trashmail.de', 'wegwerfmail.de', 'tempmail.com', 'temp-mail.org',
    '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
    'byom.de', 'mail.ru', 'muster.de', 'firma.de', 'domain.de'];
  // Vollständige Tastaturreihen (klassisches Geklimper)
  var KEYBOARD_ROWS = ['qwertzuiop', 'asdfghjkl', 'yxcvbnm', 'qwertyuiop'];

  function normName(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function looksFakeName(vor, nach) {
    var v = normName(vor), n = normName(nach);
    var full = (v + (n ? ' ' + n : '')).trim();
    if (FAKE_FULL_NAMES.indexOf(full) > -1) return true;
    if (v && FAKE_NAME_TOKENS.indexOf(v) > -1) return true;
    if (n && FAKE_NAME_TOKENS.indexOf(n) > -1) return true;
    // Zeichenmuster in beiden Feldern pruefen – der Nachname ist das Pflichtfeld
    return [v, n].some(function (teil) {
      var t = teil.replace(/\s/g, '');
      if (!t) return false;
      if (/^(.)\1{3,}$/.test(t)) return true;                // aaaa, xxxx (4+ gleiche)
      return KEYBOARD_ROWS.indexOf(t) > -1;                   // ganze Tastaturreihe
    });
  }
  function looksFakeEmail(email) {
    var m = normName(email).replace(/\s/g, '');
    var at = m.indexOf('@');
    if (at < 1) return false; // Format wird separat geprüft
    var local = m.slice(0, at), domain = m.slice(at + 1);
    if (DISPOSABLE_MAIL.indexOf(domain) > -1) return true;
    if (/^(.)\1{2,}$/.test(local)) return true;               // aaa@…, xxx@…
    if (FAKE_NAME_TOKENS.indexOf(local) > -1 && /^(test|abc|xyz|muster|firma|domain)\./.test(domain)) return true;
    return false;
  }

  /* Optionen für die Erweiterungs-Dropdowns (in allen 3 Positionen identisch) */
  var ERW_OPTS = [
    { value: 'Keine Angabe' },
    { value: 'Keil', img: 'keil' },
    { value: 'Rahmenwand', img: 'rahmenwand' },
    { value: 'Schiebetür', img: 'schiebetuer' },
    { value: 'Plankenwand', img: 'plankenwand' },
    { value: 'Senkrechtmarkise', img: 'senkrechtmarkise' },
    { value: 'Velaris', img: 'velaris' }
  ];
  function erwOpt(v) { for (var i = 0; i < ERW_OPTS.length; i++) if (ERW_OPTS[i].value === v) return ERW_OPTS[i]; return null; }
  function erwIndex(v) { for (var i = 0; i < ERW_OPTS.length; i++) if (ERW_OPTS[i].value === v) return i; return 99; }

  /* Kompatibilitäts-Logik der seitlichen Erweiterungen */
  var ERW_REQUIRES_KEIL = ['Velaris', 'Senkrechtmarkise', 'Schiebetür']; // wählt Keil automatisch + sperrt ihn
  // Unverträglichkeiten (Velaris nur mit Plankenwand/Keil kombinierbar)
  var ERW_INCOMPAT = {
    'Velaris': ['Senkrechtmarkise', 'Schiebetür', 'Rahmenwand'],
    'Senkrechtmarkise': ['Velaris'],
    'Schiebetür': ['Velaris'],
    'Rahmenwand': ['Velaris']
  };
  // Stirnseiten (vorne und hinten): kein Keil, keine Auto-Keil-Regeln.
  // Der Keil gleicht das Gefaelle an den Laengsseiten aus; vorne wie hinten
  // laeuft die Dachkante waagerecht.
  function erwIsVorne(id) { return id === 'erw_vorne' || id === 'erw_hinten'; }
  // Hinten gibt es eine Seite nur freistehend – bei Wandmontage steht dort
  // das Haus ("Bei freistehen muss plankenwand, rahmen etc. also alle
  // moeglichen auch hinten moeglich sein", Betreiber 23.10.2026).
  function rueckseiteOffen() { return answers.aufbau === 'Freistehend'; }
  // Keil (Gefälle-Ausgleich) nur bei TDS-Systemen mit Außengefälle – nicht bei
  // Flachdach SkyView oder Pergola (kein Außengefälle → kein Keil nötig).
  function keilAllowed() {
    /* Die Balkonüberdachung ist technisch ein TDS – gleiches Außen-
       gefälle, also auch dieselbe Frage nach dem Keil. Stünde sie hier
       nicht, wichen Assistent und Konfigurator voneinander ab; genau
       das prüft scripts/pruefe-konfigurator.js. */
    if (answers.produkt === 'Terrassendach TDS' ||
        answers.produkt === 'Balkonüberdachung') return true;
    if (answers.produkt === 'Carport' && answers.carporttyp === 'Carport TDS') return true;
    return false;
  }
  function erwOptsFor(id) {
    return (erwIsVorne(id) || !keilAllowed()) ? ERW_OPTS.filter(function (o) { return o.value !== 'Keil'; }) : ERW_OPTS;
  }
  // bereits gewählte Option, die 'value' blockiert – oder null
  function erwBlocker(value, sel) {
    for (var i = 0; i < sel.length; i++) {
      var s = sel[i];
      if ((ERW_INCOMPAT[value] || []).indexOf(s) > -1) return s;
      if ((ERW_INCOMPAT[s] || []).indexOf(value) > -1) return s;
    }
    return null;
  }
  // Keil gesperrt (nicht abwählbar), solange eine keilpflichtige Option aktiv ist
  function erwKeilLocked(id, sel) {
    if (erwIsVorne(id) || !keilAllowed()) return false;
    for (var i = 0; i < ERW_REQUIRES_KEIL.length; i++) if (sel.indexOf(ERW_REQUIRES_KEIL[i]) > -1) return true;
    return false;
  }
  // Umschalten einer Erweiterung mit allen Automatik-/Sperr-Regeln
  function erwToggle(id, value) {
    var sel = (answers[id] || []).slice();
    if (value === 'Keine Angabe') { answers[id] = []; return; }
    var pos = sel.indexOf(value);
    if (pos > -1) {
      if (value === 'Keil' && erwKeilLocked(id, sel)) return; // gesperrt – nicht abwählbar
      sel.splice(pos, 1);
    } else {
      if (erwBlocker(value, sel)) return; // inkompatibel – ignorieren
      sel.push(value);
      if (!erwIsVorne(id) && keilAllowed() && ERW_REQUIRES_KEIL.indexOf(value) > -1 && sel.indexOf('Keil') === -1) sel.push('Keil');
    }
    sel.sort(function (a, b) { return erwIndex(a) - erwIndex(b); });
    answers[id] = sel;
  }

  var wizard = document.querySelector('.anfrage-wizard');
  if (!wizard) return;

  var bodyEl = document.getElementById('awBody');
  var backBtn = document.getElementById('awBack');
  var nextBtn = document.getElementById('awNext');
  var subEl = document.getElementById('awSub');
  var barEl = document.getElementById('awProgressBar');

  var answers = {};
  var flow = ['produkt'];
  var idx = 0;
  var openDd = null; // aktuell geöffnetes Erweiterungs-Dropdown
  var ref = 'BV-' + Date.now().toString(36).slice(-5).toUpperCase();

  /* ---------- Escaping für sichere Anzeige von Nutzereingaben ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- SVG-Icons (Feather-Stil, stroke=currentColor) ---------- */
  var I = {
    terrasse: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><rect x="9" y="13" width="6" height="6"/>',
    carport:  '<path d="M4 10l8-5 8 5"/><path d="M5 10v6h14v-6"/><circle cx="8.5" cy="18" r="1.4"/><circle cx="15.5" cy="18" r="1.4"/>',
    sommer:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
    sonst:    '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    wand:     '<line x1="4" y1="3" x2="4" y2="21"/><path d="M4 8l15 4"/><line x1="10" y1="10" x2="10" y2="19"/><line x1="18" y1="12.5" x2="18" y2="19"/>',
    frei:     '<path d="M3 9l18 4"/><line x1="5" y1="10" x2="5" y2="19"/><line x1="19" y1="13" x2="19" y2="19"/><line x1="9" y1="11" x2="9" y2="19"/><line x1="15" y1="12" x2="15" y2="19"/>',
    putz:     '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h.01M11 8h.01M15 8h.01M9 12h.01M13 12h.01M17 12h.01M7 16h.01M11 16h.01M15 16h.01"/>',
    klinker:  '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v6M15 9v6M9 15v6"/>',
    glas:     '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18"/>',
    steg:     '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M7 4v16M11 4v16M15 4v16"/>',
    flach:    '<path d="M3 8h18"/><path d="M3 8l2-2h14l2 2"/><line x1="5" y1="8" x2="5" y2="19"/><line x1="19" y1="8" x2="19" y2="19"/><line x1="12" y1="8" x2="12" y2="19"/>',
    pergola:  '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M6 8v12M18 8v12"/><path d="M6 12h12M6 16h12"/>',
    frage:    '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/>',
    aus:      '<circle cx="12" cy="12" r="9"/><line x1="6" y1="6" x2="18" y2="18"/>',
    markise:  '<path d="M2 4h20v6H2z"/><path d="M2 10l2.5 6M8 10l1 6M14 10l-1 6M22 10l-2.5 6"/>',
    lupe:     '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    brief:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    werkzeug: '<path d="M14.7 6.3a1 1 0 0 0 0 1.41l1.59 1.59a1 1 0 0 0 1.41 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    schild:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    flamme:   '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    sensor:   '<path d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/>',
    licht:    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5A5.7 5.7 0 0 0 18 7.5 6 6 0 0 0 6 7.5c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>',
    speaker:  '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12" y2="6"/>',
    solar:    '<rect x="2" y="5" width="20" height="11" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="12.5" x2="22" y2="12.5"/><line x1="8.5" y1="5" x2="8.5" y2="16"/><line x1="15" y1="5" x2="15" y2="16"/><path d="M9 20h6M12 16v4"/>'
  };
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  /* ---------- Ablauf je nach Produkt ---------- */
  function computeFlow() {
    var p = answers.produkt;
    var wand = answers.aufbau === 'Wandmontage'; // Fassade nur bei Wandmontage
    // Terrassendach TDS/SkyView: voller Detailablauf (inkl. Seitenelemente → Wintergarten)
    if (p === 'Terrassendach TDS' || p === 'Flachdach SkyView' ||
        p === 'Balkonüberdachung') {
      /* Der Stoffschritt haengt an der Bauart: Die Stoffkarte fuehrt nur
         LINEA / SOLARA / PERGOLA / LUNA / LUXORA – Plissee und Sonnensegel
         gehoeren nicht dazu und bekommen deshalb keine Stoffwahl. Die
         Senkrechtmarkise hat eine EIGENE Liste (EZIP). */
      /* Beim Balkon entfällt die Frage nach dem Aufbau – ein Balkondach
         hängt immer an der Hauswand. An ihre Stelle tritt die Frage, was
         vorne steht und wo die Pfosten aufsetzen. Ohne sie käme eine
         Anfrage herein, der man nicht ansieht, ob die Pfosten auf einer
         Mauer stehen können; das entscheidet über Pfostenlänge und
         Befestigung und müsste sonst hinterhertelefoniert werden. */
      var balkon = p === 'Balkonüberdachung';
      var tdsSchritte = ['produkt']
        .concat(balkon ? ['balkon'] : ['aufbau'])
        .concat(wand || balkon ? ['fassade'] : [])
        .concat(['masse', 'verglasung', 'markise']);
      if (answers.markise === 'Aufdachmarkise' || answers.markise === 'Unterdachmarkise')
        tdsSchritte.push('stoff');
      tdsSchritte.push('erweiterungen');
      if (['erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten'].some(function (k) {
        return (answers[k] || []).indexOf('Senkrechtmarkise') > -1;
      })) tdsSchritte.push('stoffzip');
      return tdsSchritte.concat(['led', 'farbe', 'untergrund', 'montage', 'kontakt', 'summary']);
    }
    // Carport: eigener Ablauf (Typ → Ausführung). Glas/Poly-Eindeckung nur beim
    // Carport TDS – Flat Line & Flat Box haben ein Trapezblech-Flachdach.
    if (p === 'Carport') {
      // Bei „Noch unsicher – bitte beraten" die Ausführungs-Auswahl überspringen
      if (answers.carporttyp === 'Noch unsicher – bitte beraten')
        return ['produkt', 'carporttyp', 'masse', 'led', 'farbe', 'untergrund', 'montage', 'kontakt', 'summary'];
      var cpWand = answers.carportvariante === 'Carport mit Wandmontage'; // Fassade nur bei Wandmontage
      var cpTds = answers.carporttyp === 'Carport TDS';
      // Carport TDS: Glas-/Poly-Eindeckung. Flat Line/Box: Dach-Ausführung (Trapezblech/Solar/Gründach)
      var roof = cpTds ? ['verglasung'] : ['dach'];
      return ['produkt', 'carporttyp', 'carportvariante'].concat(cpWand ? ['fassade'] : []).concat(['masse']).concat(roof).concat(['led', 'farbe', 'untergrund', 'montage', 'kontakt', 'summary']);
    }
    // Pergola/Lamellendach: eigener Ablauf (Dachart → Ausführung), kein Glasdach.
    // Seitlicher Schutz statt Aufdach-Markise, Komfort-Schritt mit Heizung/Sensorik.
    if (p === 'Pergola / Lamellendach') {
      var steps = ['produkt', 'dachart'];
      if (answers.dachart === 'Lamellendach') steps.push('dachausfuehrung'); // Ausführung nur beim Lamellendach
      steps.push('aufbau');
      if (wand) steps.push('fassade');
      steps.push('masse', 'seitenschutz');
      if (answers.seitenschutz === 'ZIP-Senkrechtmarkise') steps.push('stoffzip');
      steps.push('komfort', 'farbe', 'untergrund', 'montage', 'kontakt', 'summary');
      return steps;
    }

    // Direktkontakt: nur kurze Nachricht, keine Montagefrage
    if (p === 'Direkt anfragen')
      return ['produkt', 'wunsch', 'kontakt', 'summary'];
    return ['produkt'];
  }

  // Beim Produktwechsel alle Konfigurations-Antworten löschen (Kontaktdaten bleiben)
  function resetConfig() {
    ['aufbau', 'fassade', 'fassade_text', 'carporttyp', 'carportvariante',
     'breite', 'tiefe', 'hoehe', 'hoehebezug', 'hoehebezug_text', 'vorsprung', 'ueberstand',
     'verglasung', 'glasstaerke', 'markise', 'led', 'ledset', 'ledsetzahl', 'sound', 'soundset',
     'dachart', 'dachausfuehrung', 'seitenschutz', 'heizung', 'wettersensor', 'farbe', 'dach',
     'erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten', 'untergrund', 'montage', 'wunsch', 'extras',
     'stoff', 'stoffzip']
      .forEach(function (k) { delete answers[k]; });
  }

  /* ---------- Wiederverwendbare Bausteine ---------- */
  /* ---------- RAL-Suche im Assistenten ----------
     „baue hier als sechste kachel so ähnlich wie im 3d konfigurator wo
     man RAL farbe suchen oder eingeben kann" (Betreiber, 29.10.2026).

     Die Tabelle und die Suchlogik stehen in js/ral.js – dieselbe Quelle,
     aus der auch der Konfigurator liest. Hier liegt nur die Bedienung.

     Der Suchtext wird NICHT bei jedem Tastendruck über render() neu
     gezeichnet: Dabei verlöre das Eingabefeld den Fokus, und man könnte
     kein zweites Zeichen tippen. Stattdessen wird allein die
     Trefferliste ausgetauscht. */
  var ralFrage = '';
  var ralOffen = false;
  var RAL_TREFFER_MAX = 24;

  function ralGewaehlt() {
    return /^RAL \d{4}/.test(answers.farbe || '') ? answers.farbe : '';
  }
  function ralHex(nr) {
    var t = window.BV_RAL && window.BV_RAL.TABELLE[nr];
    return t ? '#' + ('000000' + t[0].toString(16)).slice(-6) : '#888';
  }
  function ralTrefferHtml(frage) {
    if (!window.BV_RAL) {
      return '<p class="aw-ral-stand">Die Farbtabelle konnte nicht geladen werden. ' +
             'Schreiben Sie uns den RAL-Ton einfach in die Nachricht.</p>';
    }
    var f = String(frage || '').trim();
    if (f.length < 2) {
      return '<p class="aw-ral-stand">Nummer oder Farbe eingeben – zum Beispiel ' +
             '<strong>7016</strong>, <strong>Anthrazit</strong> oder <strong>Braun</strong>.</p>';
    }
    var tr = window.BV_RAL.suchen(f);
    if (!tr.length) {
      return '<p class="aw-ral-stand">Dazu finden wir keinen RAL-Ton. ' +
             'Andere Schreibweise versuchen – oder „Andere / Beratung" wählen.</p>';
    }
    var html = '<div class="aw-ral-liste">';
    tr.slice(0, RAL_TREFFER_MAX).forEach(function (t) {
      var name = window.BV_RAL.TABELLE[t.nr][1];
      html += '<button type="button" class="aw-ral-opt" data-ral-pick="' + t.nr + '">' +
        '<span class="aw-ral-sw" style="background:' + ralHex(t.nr) + '"></span>' +
        '<span class="aw-ral-nr">RAL ' + t.nr + '</span>' +
        '<span class="aw-ral-nm">' + esc(name) + '</span></button>';
    });
    html += '</div>';
    if (tr.length > RAL_TREFFER_MAX) {
      html += '<p class="aw-ral-stand">' + tr.length + ' Treffer – die ersten ' +
              RAL_TREFFER_MAX + ' stehen hier. Genauer suchen zeigt weniger.</p>';
    }
    return html;
  }
  function ralPanelHtml() {
    return '<div class="aw-ral">' +
      '<div class="aw-field"><label for="awRalFeld">RAL-Farbe suchen oder eingeben</label>' +
      '<input type="text" id="awRalFeld" value="' + esc(ralFrage) + '" ' +
      'placeholder="z. B. 7016, Anthrazit oder Braun" autocomplete="off"></div>' +
      '<div id="awRalTreffer">' + ralTrefferHtml(ralFrage) + '</div>' +
      '<p class="aw-ral-fuss"><strong>Sonderfarben sind aufpreispflichtig.</strong> ' +
      'Den Aufpreis nennen wir Ihnen mit dem Angebot nach dem kostenlosen Aufmaß – ' +
      'er hängt von Menge und Oberfläche ab.<br>Die Farbe am Bildschirm ist eine ' +
      'Näherung. Verbindlich ist der RAL-Fächer – wir zeigen Ihnen das Muster beim Aufmaß.</p>' +
      '</div>';
  }
  function ralKachelHtml() {
    var g = ralGewaehlt();
    var nr = g ? g.slice(4, 8) : '';
    var media = g
      ? '<span class="aw-option-ic aw-option-sw" style="background:' + ralHex(nr) + '"></span>'
      : '<span class="aw-option-ic">' + svg(I.lupe) + '</span>';
    return '<button type="button" class="aw-option' + (g ? ' is-active' : '') +
      '" data-ral-open="1">' + media +
      '<span class="aw-option-lbl">' + esc(g || 'Andere RAL-Farbe suchen') + '</span>' +
      '<span class="aw-option-hint">' + (g ? 'Aufpreis – Betrag im Angebot' : '217 Töne – Nummer oder Farbname') +
      '</span></button>';
  }

  function optionCards(field, opts, modClass) {
    var html = '<div class="aw-options' + (modClass ? ' ' + modClass : '') + '">';
    opts.forEach(function (o) {
      var active = answers[field] === o.value ? ' is-active' : '';
      var muted = o.muted ? ' aw-option--muted' : '';
      var badge = o.badge ? '<span class="aw-badge">' + esc(o.badge) + '</span>' : '';
      var media = o.img
        ? '<span class="aw-option-img' + (o.photo ? ' aw-option-img--photo' : '') + '"><img src="/images/wizard/wz_' + o.img + '.webp?v=' + ASSET_VER + '" alt="" loading="lazy">' + badge + '</span>'
        : o.swatch
          ? '<span class="aw-option-ic aw-option-sw" style="background:' + o.swatch + '">' + badge + '</span>'
          : '<span class="aw-option-ic' + (o.iconBig ? ' aw-option-ic--big' : '') + '">' + svg(o.icon) + badge + '</span>';
      html += '<button type="button" class="aw-option' + active + muted + '" data-field="' + field + '" data-value="' + esc(o.value) + '">' +
        media +
        '<span class="aw-option-lbl">' + esc(o.value) + '</span>' +
        (o.hint ? '<span class="aw-option-hint">' + esc(o.hint) + '</span>' : '') +
        '</button>';
    });
    html += '</div>';
    return html;
  }

  /* ---------- Markisenstoffe ----------
     Die Liste steht in js/markisenstoffe.js, dort auch die Begruendung.
     Zwei getrennte Welten: 53 Stoffe fuer die Dachmarkisen (LINEA /
     SOLARA / PERGOLA / LUNA / LUXORA), 44 fuer die Senkrechtmarkisen
     (EZIP 105 / 125). Kein Code kommt in beiden vor. Wer das vermischt,
     schickt eine Anfrage los, die nicht bestellbar ist.

     Keine optionCards: 97 grosse Karten waeren unbedienbar. Stattdessen
     ein Musterraster, nach Farbfamilie gegliedert. */
  /* Macht aus 'AC420' bzw. 'T30812-A' den Satz, der in der Anfrage steht. */
  function stoffText(wert) {
    if (!wert) return '';
    var code = String(wert).split('-')[0];
    var alle = ((window.BV_STOFFE && window.BV_STOFFE.dach) || [])
      .concat((window.BV_STOFFE && window.BV_STOFFE.zip) || []);
    for (var i = 0; i < alle.length; i++) {
      if (alle[i].c !== code) continue;
      var d = alle[i];
      var t = d.c + (d.n ? ' ' + d.n : '') + ' · ' + d.f;
      if (d.w) t += ' · Wassersäule ' + d.w + ' mm · Lichtechtheit 4/5';
      if (String(wert).indexOf('-') > -1) t += ' · Konfektion ' + String(wert).split('-')[1];
      return t;
    }
    return String(wert);
  }

  function stoffRaster(gruppe, field) {
    var liste = (window.BV_STOFFE && window.BV_STOFFE[gruppe]) || [];
    if (!liste.length) {
      return '<p class="aw-note">Die Stoffauswahl konnte nicht geladen ' +
             'werden – wir besprechen den Stoff gern persoenlich.</p>';
    }
    function kachel(wert, bild, text) {
      var aktiv = answers[field] === wert ? ' is-active' : '';
      return '<button type="button" class="aw-stoff' + aktiv +
        '" data-field="' + field + '" data-value="' + esc(wert) + '" title="' +
        esc(text) + '"><img src="/images/stoffe/mini/' + bild +
        '.webp" alt="" loading="lazy" width="96" height="24">' +
        '<span>' + esc(text) + '</span></button>';
    }
    var html = '', fam = null;
    liste.forEach(function (st) {
      if (st.f !== fam) {
        if (fam !== null) html += '</div>';
        html += '<p class="aw-group-h">' + esc(st.f) + '</p><div class="aw-stoffe">';
        fam = st.f;
      }
      if (gruppe === 'zip') {
        html += kachel(st.c + '-A', st.c + '-A', st.c + ' A');
        html += kachel(st.c + '-B', st.c + '-B', st.c + ' B');
      } else {
        html += kachel(st.c, st.c, st.c);
      }
    });
    if (fam !== null) html += '</div>';
    html += '<div class="aw-stoffe aw-stoffe--leer">' +
      kachel('Noch offen – bitte beraten', '', 'Noch offen – bitte beraten') +
      '</div>';
    return html;
  }

  /* ---------- Schritt-Definitionen ---------- */
  var STEPS = {
    produkt: {
      title: 'Was möchten Sie kostenlos konfigurieren?',
      /* ERGAENZT 13.11.2026: Der Kurzweg ist die sechste von sechs
         Kacheln und als Abkuerzung nicht zu erkennen - seine Beschriftung
         nennt nur Beispiele ("Markise, Gelaender, Vordach"). Wer schon
         weiss, was er will, arbeitet sich stattdessen durch bis zu 13
         Schritte. Der Satz benennt den kurzen Weg, ohne ihn
         vorzudraengeln: Die Reihenfolge der Kacheln bleibt, damit die
         Hauptprodukte oben stehen. */
      sub: 'Kostenlos & unverbindlich – Sie stellen sich Ihr Wunschprodukt zusammen und erhalten ein individuelles Angebot. Sie wissen schon, was Sie möchten? Mit „Direkt anfragen" ganz unten sind es nur vier Schritte.',
      render: function () {
        return optionCards('produkt', [
          { value: 'Terrassendach TDS', img: 'terrasse', photo: true, hint: 'Klassiker – Glas oder Polycarbonat' },
          { value: 'Flachdach SkyView', img: 'flach', photo: true, hint: 'Modernes Flachdach-Design' },
          { value: 'Carport', img: 'carport', photo: true, hint: 'TDS · Flat Line · Flat Box' },
          { value: 'Balkonüberdachung', img: 'balkon', photo: true, hint: 'Für den Balkon – auf Brüstung oder Boden' },
          { value: 'Pergola / Lamellendach', img: 'pergola', photo: true, hint: 'Lamellendach · Faltdach · Velaris' },
          /* „Sonstiges" ist am 04.11.2026 weggefallen: „Sonstiges kann
             weg, weil den selben zweck erfüllt schon direkt anfragen"
             (Betreiber). Damit die Faelle, die dort standen, trotzdem
             ihren Weg finden, nennt „Direkt anfragen" sie jetzt beim
             Namen - sonst sucht jemand mit einer Markise vergeblich
             nach seinem Produkt. */
          { value: 'Direkt anfragen', icon: I.brief,
            hint: 'Markise, Geländer, Vordach … oder kurze Nachricht' }
        ], 'aw-options--equal');
      },
      valid: function () { return answers.produkt ? null : 'Bitte wählen Sie ein Produkt.'; }
    },

    aufbau: {
      title: 'Art des Aufbaus',
      render: function () {
        return optionCards('aufbau', [
          { value: 'Wandmontage', img: 'wand', photo: true, hint: 'Am Haus befestigt' },
          { value: 'Freistehend', img: 'frei', photo: true, hint: 'Auf eigenen Stützen' }
        ]);
      },
      valid: function () { return answers.aufbau ? null : 'Bitte wählen Sie die Art des Aufbaus.'; }
    },

    /* ---------- Balkon ----------
       Zwei Fragen, mehr nicht – dieselben wie im 3D-Konfigurator:
       „z.B hat man ein normales geländer oder wie hier eine wand vorne,
       geht die tiefe nur bis zum geländer oder baut man wie auf dem foto
       auf die mauer vorne" (Betreiber, 25.10.2026). */
    balkon: {
      title: 'Was steht vorne auf Ihrem Balkon?',
      sub: 'Davon hängt ab, wo die Pfosten stehen können',
      render: function () {
        return optionCards('balkonbruestung', [
          { value: 'Gemauerte Brüstung', icon: I.sonst, hint: 'Kann die Pfosten tragen' },
          { value: 'Geländer', icon: I.sonst, hint: 'Metall oder Glas – Pfosten stehen dahinter' },
          { value: 'Noch unsicher – bitte beraten', icon: I.frage }
        ], 'aw-options--equal');
      },
      valid: function () {
        return answers.balkonbruestung ? null : 'Bitte wählen Sie, was vorne steht.';
      }
    },

    carporttyp: {
      title: 'Welchen Carport möchten Sie?',
      sub: 'Wählen Sie Ihren Carport-Typ',
      render: function () {
        return optionCards('carporttyp', [
          { value: 'Carport TDS', img: 'cp_tds', photo: true, hint: 'Klassiker mit Profildach' },
          { value: 'Flachdach Flat Line', img: 'cp_flatline', photo: true, hint: 'Modernes, flaches Design' },
          { value: 'Flachdach Flat Box', img: 'cp_flatbox', photo: true, hint: 'Geschlossene Kubus-Optik' },
          { value: 'Noch unsicher – bitte beraten', icon: I.frage }
        ], 'aw-options--equal');
      },
      valid: function () { return answers.carporttyp ? null : 'Bitte wählen Sie einen Carport-Typ.'; }
    },

    carportvariante: {
      title: 'Ausführung',
      sub: 'Passend zu Ihrem Carport',
      render: function () {
        var t = answers.carporttyp, opts;
        if (t === 'Carport TDS') opts = [
          { value: 'Carport mit Wandmontage', img: 'cp_tds_wand', photo: true, hint: 'Am Haus befestigt' },
          { value: 'Freistehender Carport', img: 'cp_tds_frei', photo: true, hint: 'Auf eigenen Stützen' },
          { value: 'Carport mit Überstand', img: 'cp_tds_ueberstand', photo: true, hint: 'Mit überstehendem Dach' }
        ];
        else if (t === 'Flachdach Flat Line') opts = [
          { value: 'Flat Line', img: 'cp_fl_plain', photo: true, hint: 'Reines Flachdach' },
          { value: 'Flat Line mit Nebenraum', img: 'cp_fl_nebenraum', photo: true, hint: 'Mit integriertem Abstellraum' }
        ];
        else opts = [
          { value: 'Flat Box – Seiten & Hinterwand verkleidet', img: 'cp_fb_offen', photo: true, hint: 'Teilverkleidet, vorne offen' },
          { value: 'Flat Box – rundum verkleidet mit Garagentor', img: 'cp_fb_garage', photo: true, hint: 'Wie eine Garage' },
          { value: 'Flat Box – mit Nebenraum', img: 'cp_fl_nebenraum', photo: true, hint: 'Mit integriertem Abstellraum' }
        ];
        return optionCards('carportvariante', opts, 'aw-options--equal');
      },
      valid: function () { return answers.carportvariante ? null : 'Bitte wählen Sie eine Ausführung.'; }
    },

    fassade: {
      title: 'Wie ist Ihre Hauswand?',
      sub: 'Wichtig für die passende Befestigung',
      render: function () {
        return optionCards('fassade', [
          { value: 'Rauputz', img: 'rauputz', photo: true },
          { value: 'Verklinkert', img: 'verklinkert', photo: true },
          { value: 'Sonstiges / weiß nicht', icon: I.frage }
        ]) +
          /* Wortlaut vom Betreiber vorgegeben (06.11.2026) - und zwar
             DERSELBE wie im 3D-Konfigurator. Zwei Formulierungen fuer
             dasselbe Feld lesen sich wie zwei verschiedene Fragen. */
          '<div class="aw-subchoice"><label class="aw-group-h" for="fassadeText">Zusätzliche Angaben zur Fassade (optional)</label>' +
          '<textarea class="aw-textarea aw-textarea--sm" id="fassadeText" placeholder="z. B. Wanddämmung, Dämmstärke oder Mauerwerk">' + esc(answers.fassade_text || '') + '</textarea></div>';
      },
      collect: function () { var e = document.getElementById('fassadeText'); if (e) answers.fassade_text = e.value; },
      valid: function () { return answers.fassade ? null : 'Bitte wählen Sie Ihre Fassade.'; }
    },

    masse: {
      title: 'Gewünschte Maße',
      sub: 'Grobe Angaben genügen – wir messen später vor Ort exakt nach',
      render: function () {
        var tds = answers.produkt === 'Terrassendach TDS' ||
                  answers.produkt === 'Balkonüberdachung';
        var cpUeber = answers.carportvariante === 'Carport mit Überstand';
        /* ---------- Die Frage steht DIREKT unter der Hoehe ----------
           "das sollte direkt unter dem höhenfeld stehen, wenn man bei
           höhe was einträgt und dann soll man das beantworten MÜSSEN"
           (Betreiber, 06.11.2026, mit Bild).

           Darum bricht das Maszraster hier auf: Die Auswahl steht
           zwischen der Hoehe und dem Rest, nicht darunter am Ende.
           Sie erscheint erst, wenn eine Hoehe eingetragen ist - ohne
           Hoehe gibt es nichts zu beziehen. */
        var rest = (tds ? dimField('vorsprung', 'Dachvorsprung (optional)', 'z. B. 300', 'mm') : '') +
                   (cpUeber ? dimField('ueberstand', 'Überstand', 'z. B. 1000', 'mm') : '');
        return '<div class="aw-dims">' +
          dimField('breite', 'Breite', 'z. B. 4000', 'mm') +
          dimField('tiefe', 'Tiefe', 'z. B. 3000', 'mm') +
          dimField('hoehe', 'Höhe (optional)', 'z. B. 2500', 'mm') +
          '</div>' +
          (answers.hoehe
            ? '<div class="aw-subchoice">' +
              selectField('awHoeheBezug', 'Worauf bezieht sich Ihre Höhenangabe?',
                          answers.hoehebezug || '', HOEHE_BEZUEGE) +
              (answers.hoehebezug === 'Sonstiges'
                ? '<label class="aw-group-h" for="awHoeheBezugText">Welches Maß haben Sie gemessen?</label>' +
                  '<textarea class="aw-textarea aw-textarea--sm" id="awHoeheBezugText" ' +
                  'placeholder="z. B. Oberkante Mauerabdeckung">' +
                  esc(answers.hoehebezug_text || '') + '</textarea>'
                : '') +
              '</div>'
            : '') +
          (rest ? '<div class="aw-dims">' + rest + '</div>' : '') +
          '<p class="aw-note">Alle Maße in Millimeter (mm). Grobe Angaben genügen.</p>';
      },
      valid: function () {
        if (!answers.breite || !answers.tiefe) return 'Bitte geben Sie mindestens Breite und Tiefe an.';
        /* Wer eine Hoehe eintraegt, MUSS sagen, worauf sie sich
           bezieht (Betreiber, 06.11.2026). Eine Hoehe ohne Bezugspunkt
           ist keine Angabe, sondern eine Zahl - und beim Aufmass faengt
           das Raten an.

           Vorausgewaehlt wird trotzdem nichts: Das legte dem Kunden
           etwas in den Mund, was er nicht gesagt hat. Lieber die
           Rueckfrage hier als eine erfundene Angabe im Angebot. */
        if (answers.hoehe && !answers.hoehebezug) {
          return 'Bitte geben Sie an, worauf sich Ihre Höhenangabe bezieht.';
        }
        if (answers.hoehebezug === 'Sonstiges' && !answers.hoehebezug_text) {
          return 'Bitte beschreiben Sie kurz, welches Maß Sie gemessen haben.';
        }
        return null;
      }
    },

    verglasung: {
      title: 'Welche Eindeckung wünschen Sie?',
      render: function () {
        var opts = [
          { value: 'VSG-Glas klar', img: 'vsg_klar', photo: true, hint: 'Durchsichtig, edel' },
          { value: 'VSG-Glas Opal (milchig)', img: 'vsg_opal', photo: true, hint: 'Blickdicht, sanftes Licht' },
          /* Getöntes VSG kam am 11.10.2026 vom Betreiber dazu: „gls gibts
             auch in getönt also graphit". Foto vom Hersteller nachgereicht
             am 29.10.2026 – bis dahin stand hier ein Glas-Zeichen. */
          { value: 'VSG-Glas Graphit (getönt)', img: 'vsg_graphit', photo: true, hint: 'Getönt, starker Schatten' },
          { value: 'Polycarbonat klar', img: 'poly_klar', photo: true, hint: 'Leicht & günstiger' },
          { value: 'Polycarbonat Opal (milchig)', img: 'poly_opal', photo: true, hint: 'Wärmeschutz, diffuses Licht' },
          /* Graphit und Bronze fehlten hier, obwohl die Artikelliste alle
             vier Ausführungen der Sechsfachstegplatte führt (Art. 6126 und
             6127). Standen bis zum 29.10.2026 nur mit Stegplatten-Zeichen
             da, weil kein Foto vorlag – der Betreiber hat die beiden
             Herstellerbilder nachgereicht („hier is vsg graphit", mit den
             zugehörigen Aufnahmen). */
          { value: 'Polycarbonat Graphit', img: 'poly_graphit', photo: true, hint: 'Dunkel getönt, starker Schatten' },
          { value: 'Polycarbonat Bronze', img: 'poly_bronze', photo: true, hint: 'Bronzefarben, warmes Licht' }
        ];
        // „Noch unsicher" nur zeigen, solange keine VSG-Glas-Variante gewählt ist
        if (!isGlas(answers.verglasung)) opts.push({ value: 'Noch unsicher – bitte beraten', icon: I.frage });
        /* --equal: Die letzte Karte bei ungerader Anzahl bleibt gleich
           gross. Ohne den Schalter laeuft sie ueber die volle Breite –
           bei Polycarbonat Bronze (siebte Karte) wurde daraus mit dem
           neuen Foto eine riesige Kachel: „wieso hast du die bronze
           kachel so großgemacht die sollen ale gleich groß bleiben"
           (Betreiber, 29.10.2026). */
        var cards = optionCards('verglasung', opts, 'aw-options--equal');
        // An seiner Stelle: Glasstärke-Auswahl bei den VSG-Glas-Varianten (8 oder 10 mm)
        if (isGlas(answers.verglasung)) {
          cards += '<div class="aw-subchoice"><p class="aw-group-h">Glasstärke</p><div class="aw-pills">' +
            pill('glasstaerke', '8 mm') + pill('glasstaerke', '10 mm') + '</div></div>';
        }
        return cards;
      },
      valid: function () {
        if (!answers.verglasung) return 'Bitte wählen Sie eine Eindeckung.';
        if (isGlas(answers.verglasung) && !answers.glasstaerke) return 'Bitte wählen Sie die Glasstärke (8 oder 10 mm).';
        return null;
      }
    },

    stoff: {
      title: 'Welcher Markisenstoff?',
      sub: 'Alle Stoffe mit Lichtechtheit 4/5. Die Abbildung dient nur der Orientierung – die Farbe am Bildschirm weicht vom echten Stoff ab.',
      render: function () { return stoffRaster('dach', 'stoff'); }
    },

    stoffzip: {
      title: 'Welcher Stoff für die Senkrechtmarkise?',
      sub: 'Jeder Stoff gibt es in zwei Mustern – Konfektion A und B. Die Abbildung dient nur der Orientierung.',
      render: function () { return stoffRaster('zip', 'stoffzip'); }
    },

    markise: {
      title: 'Mehr Schatten & Komfort?',
      sub: 'Eine Markise hält Ihre Terrasse an heißen Tagen spürbar kühler – perfekt für lange Sommerabende.',
      render: function () {
        /* Die Aufdachmarkise wird auf die aeusseren Sparren der geneigten
           Dachflaeche geschraubt. Das Flachdach SkyView hat kein
           Aussengefaelle und eine umlaufende hohe Blende – dort geht sie
           nicht. Der Assistent hat sie bis 11.10.2026 trotzdem angeboten;
           beanstandet vom Betreiber. Dieselbe Regel steht im
           3D-Konfigurator in MARKISE_NICHT. */
        var oben = [];
        if (answers.produkt !== 'Flachdach SkyView') {
          oben.push({ value: 'Aufdachmarkise', img: 'markise_auf', photo: true, badge: 'Beliebt', hint: 'Hitzeschutz von oben – hält das Glasdach kühl' });
        } else if (answers.markise === 'Aufdachmarkise') {
          answers.markise = null;
        }
        oben.push({ value: 'Unterdachmarkise', img: 'markise_unter', photo: true, badge: 'Empfohlen', hint: 'Sanftes, blendfreies Licht – elegant integriert' });
        return '<p class="aw-group-h">Unsere Empfehlung</p>' +
          optionCards('markise', oben) +
          '<p class="aw-group-h aw-group-h--sep">Weitere Sonnenschutz-Varianten</p>' +
          optionCards('markise', [
            { value: 'Plissees', img: 'plissee', photo: true, hint: 'Faltbar, moderne Optik' },
            { value: 'Sonnensegel', img: 'sonnensegel', photo: true, hint: 'Leichter, textiler Schattenspender' },
            /* „Ohne" fehlte hier: Wer keine Markise will, musste bisher
               „Noch unsicher" wählen – und bekam einen Rückruf zu etwas,
               das er gar nicht möchte. Derselbe Wert steht im
               3D-Konfigurator. */
            { value: 'Ohne', icon: I.aus, iconBig: true, muted: true },
            { value: 'Noch unsicher – bitte beraten', icon: I.frage }
          ]) +
          '<p class="aw-note">Alle Varianten in vielen Farben erhältlich – den Farbwunsch klären wir persönlich.</p>';
      },
      valid: function () { return answers.markise ? null : 'Bitte wählen Sie eine Option.'; }
    },

    erweiterungen: {
      title: 'Machen Sie mehr aus Ihrer Terrasse',
      sub: 'Schon eine geschlossene Seite bringt Wind-, Sicht- und Wetterschutz – aus der Terrasse wird ein Freiluftzimmer.',
      render: function () {
        return '<div class="aw-tip"><span class="aw-tip-ic">' + svg(I.sommer) + '</span>' +
          '<span><strong>Beliebt:</strong> Die meisten Kunden schließen mindestens eine Seite – für mehr Schutz und ganzjährige Nutzung.</span></div>' +
          '<div class="aw-erws">' +
          ddField('erw_links', 'Erweiterung links') +
          ddField('erw_rechts', 'Erweiterung rechts') +
          ddField('erw_vorne', 'Erweiterung vorne (Stirnseite)') +
          (rueckseiteOffen() ? ddField('erw_hinten', 'Erweiterung hinten (Rückseite)') : '') +
          '</div>';
      },
      collect: function () {}, // Auswahl wird direkt beim Klick gesetzt
      valid: function () { return null; } // optional
    },

    led: {
      title: function () { return answers.produkt === 'Carport' ? 'Beleuchtung?' : 'Licht & Sound?'; },
      sub: 'Dezent ins Dachprofil integriert – für stimmungsvolle Abende.',
      render: function () {
        var noSound = answers.produkt === 'Carport'; // Carport: keine Lautsprecher (VD bietet sie nicht)
        // LED-Spots
        var html = '<p class="aw-group-h">LED-Spots</p>' +
          optionCards('led', [
            { value: 'Ja, mit LED-Spots', img: 'led', photo: true, badge: 'Beliebt', hint: 'Warmes Licht, unsichtbar integriert' },
            { value: 'Nein, ohne Beleuchtung', icon: I.aus, iconBig: true, muted: true }
          ]);
        if (hasLed(answers.led)) {
          html += '<div class="aw-subchoice"><p class="aw-group-h">Welche LED-Spots?</p><div class="aw-pills">' +
            pill('ledset', '6er-Set') + pill('ledset', '8er-Set') + pill('ledset', '12er-Set') +
            '</div>';
          // Anzahl der Sets erst nach Auswahl eines Sets – optional (Standard: 1 Set)
          if (answers.ledset) {
            html += '<p class="aw-group-h aw-group-h--sep">Wie viele Sets? (optional)</p><div class="aw-pills">' +
              '<span class="aw-pill-input"><input type="number" inputmode="numeric" min="1" max="20" id="ledSets" placeholder="1" value="' + esc(answers.ledsetzahl || '') + '"><span>Sets</span></span>' +
              '</div><p class="aw-note">Standard: 1 Set. Für mehrere einfach die Anzahl eintragen (z. B. 2 × ' + esc(answers.ledset) + ').</p>';
          }
          html += '</div>';
        }
        // Lautsprecher (nicht beim Carport)
        if (!noSound) {
          html += '<p class="aw-group-h aw-group-h--sep">Lautsprecher</p>' +
            optionCards('sound', [
              { value: 'Ja, mit Lautsprechern', img: 'lautsprecher', photo: true, hint: 'Musik direkt aus dem Dachprofil' },
              { value: 'Nein, ohne Lautsprecher', icon: I.aus, iconBig: true, muted: true }
            ]);
          if (isJa(answers.sound)) {
            html += '<div class="aw-subchoice"><p class="aw-group-h">Wie viele Lautsprecher?</p><div class="aw-pills">' +
              pill('soundset', '2er-Set') + pill('soundset', '4er-Set') +
              '</div></div>';
          }
        }
        return html;
      },
      valid: function () {
        if (!answers.led) return 'Bitte wählen Sie, ob Sie LED-Spots wünschen.';
        if (hasLed(answers.led) && !answers.ledset) return 'Bitte wählen Sie ein LED-Set (6er, 8er oder 12er).';
        // Anzahl der Sets (ledsetzahl) ist optional – keine Pflichtangabe
        if (answers.produkt === 'Carport') return null; // Carport: keine Lautsprecher-Abfrage
        if (!answers.sound) return 'Bitte wählen Sie, ob Sie Lautsprecher wünschen.';
        if (isJa(answers.sound) && !answers.soundset) return 'Bitte wählen Sie die Anzahl der Lautsprecher.';
        return null;
      }
    },

    dachart: {
      title: 'Welches Dach möchten Sie?',
      sub: 'Bewegliches Dach – Sonne und Schatten auf Knopfdruck',
      render: function () {
        return optionCards('dachart', [
          { value: 'Lamellendach', img: 'lam_sunpro', photo: true, badge: 'Beliebt', hint: 'Drehbare Alu-Lamellen – Sonne & Regen stufenlos steuern' },
          { value: 'Faltdach', img: 'faltdach', photo: true, hint: 'Textiles Dach – komplett öffnen & schließen' },
          { value: 'Velaris', img: 'velaris', photo: true, hint: 'Pergola mit verschiebbaren Elementen' },
          { value: 'Noch unsicher – bitte beraten', icon: I.frage }
        ], 'aw-options--equal');
      },
      valid: function () { return answers.dachart ? null : 'Bitte wählen Sie eine Dachart.'; }
    },

    dachausfuehrung: {
      title: 'Welche Ausführung?',
      sub: 'Zwei Lamellendach-Varianten',
      render: function () {
        return optionCards('dachausfuehrung', [
          { value: 'SunPro', img: 'lam_sunpro', photo: true, badge: 'Beliebt', hint: 'Bis 7 × 4,5 m · LED, Heizstrahler & Sensorik' },
          { value: 'Premium (Warema Lamaxa L50)', img: 'lam_premium', photo: true, hint: 'App & Alexa · dimmbares LED · Lautsprecher · 16 Farben' }
        ], 'aw-options--equal');
      },
      valid: function () { return answers.dachausfuehrung ? null : 'Bitte wählen Sie eine Ausführung.'; }
    },

    seitenschutz: {
      title: 'Seiten schützen?',
      sub: 'Wind, Sonne und Blicke an den offenen Seiten – ganz nach Wunsch.',
      render: function () {
        return optionCards('seitenschutz', [
          { value: 'ZIP-Senkrechtmarkise', img: 'zip', photo: true, badge: 'Beliebt', hint: 'Wind-, Sicht- & Sonnenschutz, windstabil' },
          { value: 'Glas-Schiebeelemente', img: 'glasschiebe', photo: true, hint: 'Seiten wetterfest verglasen' },
          { value: 'Nichts / später entscheiden', icon: I.frage }
        ], 'aw-options--equal');
      },
      valid: function () { return answers.seitenschutz ? null : 'Bitte wählen Sie eine Option.'; }
    },

    komfort: {
      title: 'Komfort & Technik',
      sub: 'Alles später bequem per Fernbedienung oder App steuerbar.',
      render: function () {
        var isPremium = answers.dachausfuehrung === 'Premium (Warema Lamaxa L50)';
        // Beleuchtung (Art/Anzahl wird persönlich in der Beratung geklärt)
        var html = '<p class="aw-group-h">Beleuchtung</p>' +
          optionCards('led', [
            { value: 'Ja, mit Beleuchtung', icon: I.licht, iconBig: true, badge: 'Beliebt', hint: 'Spots oder Streifen – klären wir persönlich' },
            { value: 'Nein, ohne Beleuchtung', icon: I.aus, iconBig: true, muted: true }
          ]);
        // Heizstrahler
        html += '<p class="aw-group-h aw-group-h--sep">Heizstrahler</p>' +
          optionCards('heizung', [
            { value: 'Ja, mit Heizstrahler', icon: I.flamme, iconBig: true, badge: 'Beliebt' },
            { value: 'Nein, ohne Heizung', icon: I.aus, iconBig: true, muted: true }
          ]);
        // Lautsprecher (nur Premium/Warema)
        if (isPremium) {
          html += '<p class="aw-group-h aw-group-h--sep">Lautsprecher</p>' +
            optionCards('sound', [
              { value: 'Ja, mit Lautsprechern', icon: I.speaker, iconBig: true, hint: 'Musik direkt aus dem Dachprofil' },
              { value: 'Nein, ohne Lautsprecher', icon: I.aus, iconBig: true, muted: true }
            ]);
        }
        // Wetter-Automatik
        html += '<p class="aw-group-h aw-group-h--sep">Wetter-Automatik</p>' +
          optionCards('wettersensor', [
            { value: 'Ja, mit Wetter-Automatik', icon: I.sensor, iconBig: true, hint: 'Reagiert automatisch auf Wind & Regen' },
            { value: 'Nein', icon: I.aus, iconBig: true, muted: true }
          ]);
        return html;
      },
      valid: function () {
        if (!answers.led) return 'Bitte wählen Sie, ob Sie Beleuchtung wünschen.';
        if (!answers.heizung) return 'Bitte wählen Sie, ob Sie einen Heizstrahler wünschen.';
        if (answers.dachausfuehrung === 'Premium (Warema Lamaxa L50)' && !answers.sound) return 'Bitte wählen Sie, ob Sie Lautsprecher wünschen.';
        if (!answers.wettersensor) return 'Bitte wählen Sie, ob Sie die Wetter-Automatik wünschen.';
        return null;
      }
    },

    dach: {
      title: 'Welches Dach möchten Sie?',
      sub: 'Das Flachdach – klassisch, stromerzeugend oder begrünt.',
      render: function () {
        return optionCards('dach', [
          { value: 'Trapezblech (Standard)', img: 'dach_trapez', photo: true, badge: 'Beliebt', hint: 'Robustes, pflegeleichtes Flachdach' },
          { value: 'Solar (PV-Anlage)', img: 'dach_solar', photo: true, hint: 'Eigener Strom – ideal fürs E-Auto' },
          { value: 'Dachbegrünung', img: 'dach_gruen', photo: true, hint: 'Begrüntes Dach – natürlich & dämmend' },
          { value: 'Noch unsicher – bitte beraten', icon: I.frage }
        ], 'aw-options--equal') +
          '<p class="aw-note">Details (z. B. Modulanzahl, Speicher, Wallbox) klären wir persönlich in der Beratung.</p>';
      },
      valid: function () { return answers.dach ? null : 'Bitte wählen Sie eine Dach-Ausführung.'; }
    },

    farbe: {
      title: 'Wunschfarbe (optional)',
      /* „bei wunschfarbe feht hinweis das es aufpreispflichtig is"
         (Betreiber, 29.10.2026). Im 3D-Konfigurator steht der Hinweis
         seit dem 11.10.2026, im Assistenten fehlte er. Wortlaut bewusst
         derselbe wie dort – ohne Betrag, denn der haengt von Menge und
         Oberflaeche ab und wird erst mit dem Angebot genannt. */
      sub: 'Die vier Standardfarben ohne Aufpreis – jede andere RAL-Farbe gegen Aufpreis.',
      render: function () {
        var ANTHRAZIT = { value: 'Anthrazit (RAL 7016)', swatch: '#383e42' };
        var WEISSALU = { value: 'Weißaluminium (RAL 9006)', swatch: '#a9aca9' };
        var GRAUALU = { value: 'Graualuminium (RAL 9007)', swatch: '#83878a' };
        var CREME = { value: 'Creme-Weiß (RAL 9010)', swatch: '#f1ece1' };
        var REINWEISS = { value: 'Reinweiß (RAL 9010)', swatch: '#f4f4ef' };
        var opts;
        if (answers.produkt === 'Pergola / Lamellendach') {
          opts = [ANTHRAZIT, GRAUALU, CREME]; // VD-Standardtrio Lamellendach
        } else if (answers.produkt === 'Carport' && answers.carporttyp === 'Flachdach Flat Line') {
          opts = [ANTHRAZIT, WEISSALU, GRAUALU]; // Flat Line: nur 3 Standardfarben (ohne Reinweiß)
        } else {
          opts = [ANTHRAZIT, WEISSALU, GRAUALU, REINWEISS]; // TDS/SkyView/Flat Box: 4 Standardfarben
        }
        opts.push({ value: 'Andere / Beratung', icon: I.frage });
        /* Die sechste Kachel steht ausserhalb von optionCards: Sie setzt
           nicht einfach answers.farbe, sondern klappt die Suche auf.
           Deshalb traegt sie data-ral-open statt data-field. */
        var karten = optionCards('farbe', opts, 'aw-options--equal');
        karten = karten.replace(/<\/div>$/, ralKachelHtml() + '</div>');
        return karten + (ralOffen ? ralPanelHtml() : '');
      },
      valid: function () { return null; } // optional
    },

    wunsch: {
      title: 'Was können wir für Sie tun?',
      render: function () {
        /* ---------- Maße, freiwillig ----------
           ANLASS (04.11.2026): Mit dem Wegfall der Karte „Sonstiges"
           ist der einzige Weg weggefallen, auf dem eine Markise, ein
           Geländer oder ein Vordach MIT Maßen angefragt wurde. Dort
           wurden Breite und Tiefe abgefragt; hier kam bisher nur
           Freitext an - und damit beginnt jede dieser Anfragen mit
           einer Rückfrage.

           WARUM FREIWILLIG und nicht als Pflicht: Der ganze Wert
           dieses Weges ist, dass er KEINE Fragen stellt („Ohne Fragen
           – kurze Nachricht senden"). Zwei Pflichtfelder hätten genau
           das kaputtgemacht. Wer die Maße kennt, trägt sie ein; wer
           nicht, geht weiter wie bisher.

           Dieselben Antwortfelder wie im Maßschritt (breite, tiefe) -
           damit stehen sie ohne weiteres Zutun in der
           Zusammenfassung und in der E-Mail. */
        return '<textarea class="aw-textarea" id="awWunsch" placeholder="Beschreiben Sie Ihr Vorhaben – z. B. Sonnenschutz, Geländer, Sichtschutz, Reparatur …">' + esc(answers.wunsch || '') + '</textarea>' +
          '<div class="aw-dims aw-dims--frei">' +
            dimField('breite', 'Breite (optional)', 'z. B. 4000', 'mm') +
            dimField('tiefe', 'Tiefe (optional)', 'z. B. 3000', 'mm') +
          '</div>' +
          '<p class="aw-note">Maße helfen uns beim ersten Angebot – wenn Sie sie ' +
          'nicht zur Hand haben, lassen Sie die Felder einfach leer.</p>';
      },
      collect: function () {
        answers.wunsch = (document.getElementById('awWunsch') || {}).value || '';
        ['breite', 'tiefe'].forEach(function (k) {
          var e = document.getElementById('aw_' + k);
          if (e) answers[k] = e.value || '';
        });
      },
      valid: function () {
        this.collect();
        return answers.wunsch.trim() ? null : 'Bitte beschreiben Sie kurz Ihr Anliegen.';
      }
    },

    untergrund: {
      title: 'Wie ist der Untergrund vor Ort?',
      sub: 'Wichtig für Statik und Kalkulation – wenn Sie unsicher sind, klären wir das beim Aufmaß.',
      render: function () {
        return optionCards('untergrund', [
          { value: 'Tragender Untergrund vorhanden', img: 'untergrund_platte', photo: true, hint: 'z. B. Betonplatte oder Streifenfundament' },
          { value: 'Punktfundamente nötig', img: 'untergrund_fundament', photo: true, hint: 'z. B. Rasen, Kies, Erdreich oder Pflaster' },
          { value: 'Weiß nicht – Beratung', icon: I.frage, iconBig: true, hint: 'Wir prüfen den Untergrund beim Aufmaß-Termin' }
        ], 'aw-options--equal') +
          '<div class="aw-tip aw-tip--sep"><span class="aw-tip-ic">' + svg(I.schild) + '</span>' +
          '<span><strong>Unsicher? Kein Problem.</strong> Den Untergrund prüfen wir ohnehin beim ' +
          'kostenlosen Aufmaß-Termin vor Ort. Ihre Angabe hilft uns nur, das Angebot von Anfang an ' +
          'realistisch zu kalkulieren.</span></div>';
      },
      valid: function () { return answers.untergrund ? null : 'Bitte wählen Sie den Untergrund aus.'; }
    },

    montage: {
      title: 'Montage durch unser Fachteam?',
      sub: 'Fachgerechter Aufbau – damit Ihre volle Herstellergarantie erhalten bleibt.',
      render: function () {
        return optionCards('montage', [
          { value: 'Ja, mit Fachmontage', icon: I.werkzeug, iconBig: true, badge: 'Empfohlen', hint: 'Fachgerechter Aufbau durch unser Team' },
          { value: 'Nein, Selbstmontage', icon: I.aus, iconBig: true, muted: true, hint: 'Lieferung ohne Aufbau' }
        ], 'aw-options--equal') +
          '<div class="aw-tip aw-tip--sep"><span class="aw-tip-ic">' + svg(I.schild) + '</span>' +
          '<span><strong>Warum wir die Montage empfehlen:</strong> Die volle Herstellergarantie – ' +
          '<strong>10 Jahre auf Aluminium-Produkte</strong> und <strong>5 Jahre auf Markisen, Antriebe & Elektro</strong> – ' +
          'setzt eine fachgerechte Montage voraus. Bei Selbstmontage können Garantie- und Gewährleistungsansprüche ' +
          'eingeschränkt sein. Unser Team baut millimetergenau und wetterfest auf.</span></div>';
      },
      valid: function () { return answers.montage ? null : 'Bitte wählen Sie, ob Sie eine Montage wünschen.'; }
    },

    kontakt: {
      title: 'Ihre Kontaktdaten',
      /* GEAENDERT 13.11.2026. Vorher: „Damit wir Ihnen Ihr persoenliches
         Angebot zusenden koennen." Das weckt die Erwartung, das Angebot
         komme aus diesem Formular per Mail. Der eigene Ablauf auf der
         Startseite sagt etwas anderes (Abschnitt „Prozess", Schritt 1 und
         2): erst Rueckmeldung, dann Termin und Massaufnahme vor Ort, dann
         das schriftliche Angebot. Wer ein Angebot per Mail erwartet und
         einen Aufmasstermin bekommt, fuehlt sich getaeuscht - auch wenn
         niemand gelogen hat.
         Beide Zahlen stehen schon auf der Seite und sind nicht erfunden:
         24 Stunden im Hero (hero-trust) und nach dem Absenden,
         2-3 Werktage in der FAQ ("Wie lange dauert es bis zum Angebot?"). */
      sub: 'Wir melden uns meist innerhalb von 24 Stunden. Danach Termin und Maßaufnahme vor Ort, das schriftliche Angebot folgt 2 bis 3 Werktage später.',
      render: function () {
        return '<div class="aw-contact">' +
          '<div class="aw-field"><label id="k_anrede_lbl">Anrede *</label>' +
            '<div class="aw-pills" role="group" aria-labelledby="k_anrede_lbl">' +
            ANREDE_OPTS.map(function (a) { return pill('k_anrede', a); }).join('') +
            '</div></div>' +
          '<div class="aw-row">' +
          txtField('k_vorname', 'Vorname', answers.k_vorname, 'Max', 'given-name') +
          txtField('k_nachname', 'Nachname *', answers.k_nachname, 'Mustermann', 'family-name') +
          '</div>' +
          txtField('k_email', 'E-Mail *', answers.k_email, 'max@beispiel.de', 'email', 'email') +
          txtField('k_telefon', 'Telefon / WhatsApp *', answers.k_telefon, '0156 …', 'tel', 'tel') +
          '<div class="aw-row">' +
          txtField('k_plz', 'PLZ *', answers.k_plz, 'z. B. 56410', 'text', 'postal-code', 'inputmode="numeric" maxlength="5"') +
          txtField('k_ort', 'Ort *', answers.k_ort, 'z. B. Montabaur', 'text', 'address-level2') +
          '</div>' +
          '<p class="aw-gebiet" id="aw-gebiet" hidden></p>' +
          selectField('k_quelle', 'Wie sind Sie auf uns aufmerksam geworden? (optional)', answers.k_quelle, QUELLE_OPTS) +
          '<label class="aw-consent"><input type="checkbox" id="k_consent"' + (answers.k_consent ? ' checked' : '') + '> ' +
          '<span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Daten einverstanden. *</span></label>' +
          '</div>';
      },
      collect: function () {
        answers.k_vorname = val('k_vorname');
        answers.k_nachname = val('k_nachname');
        answers.k_email = val('k_email');
        answers.k_telefon = val('k_telefon');
        answers.k_plz = val('k_plz');
        answers.k_ort = val('k_ort');
        gebietshinweisZeigen();
        answers.k_quelle = val('k_quelle');
        var c = document.getElementById('k_consent');
        answers.k_consent = c ? c.checked : false;
      },
      valid: function () {
        this.collect();
        var vorname = answers.k_vorname.trim(), nachname = answers.k_nachname.trim();
        var email = answers.k_email.trim();
        if (!answers.k_anrede) return 'Bitte wählen Sie eine Anrede.';
        if (!nachname) return 'Bitte geben Sie Ihren Nachnamen an.';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
        // Milde Fake-/Spam-Prüfung – fängt nur offensichtliche Test-/Platzhaltereingaben ab
        if (looksFakeName(vorname, nachname)) return 'Bitte geben Sie Ihren echten Namen ein – so können wir Sie persönlich ansprechen.';
        if (looksFakeEmail(email)) return 'Diese E-Mail-Adresse sieht nicht gültig aus. Bitte geben Sie eine Adresse an, unter der wir Sie erreichen können.';
        // Telefon ist Pflicht: Rueckfragen zu Massen und Untergrund lassen sich
        // am Telefon in Minuten klaeren statt in mehreren E-Mails.
        var telefon = answers.k_telefon.trim();
        if (!telefon) return 'Bitte geben Sie eine Telefonnummer an – für Rückfragen geht das am schnellsten.';
        // Bewusst tolerant: Schreibweisen wie +49, 0049, Klammern, Schraegstriche
        // und Leerzeichen sind alle in Ordnung, nur die Ziffernzahl zaehlt.
        if (telefon.replace(/[^0-9]/g, '').length < 6) return 'Diese Telefonnummer sieht zu kurz aus. Bitte prüfen Sie Ihre Eingabe.';

        // Standort ist Pflicht: ohne ihn koennen wir weder Aufmass-Termin noch
        // Anfahrt einschaetzen und auch die Lastzonen nicht bestimmen.
        var plz = answers.k_plz.trim();
        if (!plz) return 'Bitte geben Sie Ihre PLZ an – wir brauchen sie für Aufmaß und Anfahrt.';
        if (!/^[0-9]{5}$/.test(plz)) return 'Bitte geben Sie eine gültige PLZ mit fünf Ziffern an.';
        if (!answers.k_ort.trim()) return 'Bitte geben Sie Ihren Ort an.';
        if (!answers.k_consent) return 'Bitte stimmen Sie der Datenschutzerklärung zu.';
        return null;
      }
    },

    summary: {
      title: 'Zusammenfassung',
      sub: 'Bitte prüfen Sie Ihre Angaben',
      render: function () {
        return '<div class="aw-summary">' + summaryRows() + '</div>' +
          '<div id="awResult"></div>';
      },
      valid: function () { return null; }
    }
  };

  /* ---------- Feld-Helfer ---------- */
  function isGlas(v) { return v && v.indexOf('VSG-Glas') === 0; }
  function hasLed(v) { return v && v.indexOf('Ja') === 0; }
  function isJa(v) { return v && v.indexOf('Ja') === 0; }
  function pill(field, value) {
    var active = answers[field] === value ? ' is-active' : '';
    return '<button type="button" class="aw-pill' + active + '" data-pill="' + field + '" data-value="' + esc(value) + '">' + esc(value) + '</button>';
  }
  function ddThumb(value, zoomable) {
    var o = erwOpt(value);
    if (o && o.img) {
      var zoom = zoomable ? ' data-zoom="' + o.img + '" data-zoom-label="' + esc(value) + '"' : '';
      var lupe = zoomable ? '<span class="aw-dd-zoom">' + svg(I.lupe) + '</span>' : '';
      return '<span class="aw-dd-thumb"' + zoom + '><img src="/images/wizard/erw_' + o.img + '.webp?v=' + ASSET_VER + '" alt="" loading="lazy">' + lupe + '</span>';
    }
    return '<span class="aw-dd-thumb aw-dd-thumb--none">' + svg(I.aus) + '</span>';
  }
  function ddField(id, label) {
    var sel = answers[id] || [];
    var opts = erwOptsFor(id).map(function (o) {
      var isNone = o.value === 'Keine Angabe';
      var selected = isNone ? sel.length === 0 : sel.indexOf(o.value) > -1;
      var locked = o.value === 'Keil' && erwKeilLocked(id, sel);
      var blocker = (!isNone && !selected) ? erwBlocker(o.value, sel) : null;
      var disabled = !!blocker;
      var cls = 'aw-dd-opt' + (selected ? ' is-active' : '') + (disabled ? ' is-disabled' : '');
      var pick = disabled ? '' : ' data-dd-pick="' + id + '" data-value="' + esc(o.value) + '"';
      var note = disabled ? '<span class="aw-dd-note">nicht mit ' + esc(blocker) + '</span>'
               : (locked ? '<span class="aw-dd-note">erforderlich</span>' : '');
      return '<button type="button" class="' + cls + '"' + pick + '>' +
        ddThumb(o.value, true) + '<span class="aw-dd-lbl">' + esc(o.value) + '</span>' + note +
        '<span class="aw-dd-check">' + (selected ? '✓' : '') + '</span></button>';
    }).join('');
    var hint = (sel.indexOf('Rahmenwand') > -1 && sel.indexOf('Schiebetür') > -1)
      ? '<p class="aw-dd-hint">Rahmenwand unten, Schiebetür darüber montiert.</p>' : '';
    var summary = sel.length ? sel.join(' · ') : 'Keine Angabe';
    var isOpen = openDd === id;
    return '<div class="aw-dd" data-dd="' + id + '">' +
      '<span class="aw-erw-lbl">' + esc(label) + '</span>' +
      '<button type="button" class="aw-dd-toggle' + (isOpen ? ' is-open' : '') + '" data-dd-toggle="' + id + '">' +
        ddThumb(sel.length ? sel[0] : 'Keine Angabe') + '<span class="aw-dd-cur">' + esc(summary) + '</span><span class="aw-dd-arrow"></span>' +
      '</button>' +
      '<div class="aw-dd-panel" data-dd-panel="' + id + '"' + (isOpen ? '' : ' hidden') + '>' + opts + hint + '</div>' +
      '</div>';
  }
  /* Die drei Bezuege stehen hier EINMAL. Sie muessen Wort fuer Wort
     denen im 3D-Konfigurator entsprechen: Der uebergibt seine Wahl an
     dieses Feld, und was nicht genau passt, landet auf "Bitte
     waehlen ..." - die Angabe waere stillschweigend weg. */
  var HOEHE_BEZUEGE = [
    'Niedrigste Durchgangshöhe (Unterkante)',
    'Maximale Höhe an der Hauswand (Oberkante)',
    'Sonstiges'
  ];

  function dimField(id, label, ph, unit) {
    return '<div class="aw-dim"><label for="aw_' + id + '">' + label + '</label>' +
      '<div class="aw-dim-in"><input type="number" inputmode="numeric" min="0" id="aw_' + id + '" value="' + esc(answers[id] || '') + '" placeholder="' + ph + '"><span>' + (unit || 'mm') + '</span></div></div>';
  }
  function txtField(id, label, v, ph, type, ac, extra) {
    return '<div class="aw-field"><label for="' + id + '">' + label + '</label>' +
      '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(v || '') + '" placeholder="' + ph + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + (extra ? ' ' + extra : '') + '></div>';
  }
  function selectField(id, label, v, opts) {
    var o = '<option value=""' + (v ? '' : ' selected') + '>Bitte wählen …</option>';
    opts.forEach(function (opt) {
      o += '<option value="' + esc(opt) + '"' + (v === opt ? ' selected' : '') + '>' + esc(opt) + '</option>';
    });
    return '<div class="aw-field"><label for="' + id + '">' + label + '</label>' +
      '<select id="' + id + '" class="aw-select">' + o + '</select></div>';
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  function collectMasse() {
    ['breite', 'tiefe', 'hoehe', 'vorsprung', 'ueberstand'].forEach(function (k) {
      var e = document.getElementById('aw_' + k);
      if (e) answers[k] = e.value.trim();
    });
    var b2 = document.getElementById('awHoeheBezug');
    if (b2) answers.hoehebezug = b2.value;
    var t2 = document.getElementById('awHoeheBezugText');
    if (t2) answers.hoehebezug_text = t2.value.trim();
    if (answers.hoehebezug !== 'Sonstiges') answers.hoehebezug_text = '';
  }

  /* ---------- Zusammenfassung ---------- */
  function summaryPairs(mitFachtext) {
    function inFlow(s) { return flow.indexOf(s) > -1; } // nur Schritte des aktuellen Ablaufs zeigen
    var p = [];
    p.push(['Produkt', answers.produkt]);
    if (inFlow('carporttyp') && answers.carporttyp) p.push(['Carport-Typ', answers.carporttyp]);
    if (inFlow('carportvariante') && answers.carportvariante) p.push(['Ausführung', answers.carportvariante]);
    if (inFlow('dachart') && answers.dachart) p.push(['Dachart', answers.dachart + (inFlow('dachausfuehrung') && answers.dachausfuehrung ? ' · ' + answers.dachausfuehrung : '')]);
    if (inFlow('aufbau') && answers.aufbau) p.push(['Aufbau', answers.aufbau]);
    if (inFlow('fassade') && answers.fassade) p.push(['Fassade', answers.fassade + (answers.fassade_text ? ' – ' + answers.fassade_text : '')]);
    if (inFlow('masse')) {
      var masse = [answers.breite, answers.tiefe, answers.hoehe].filter(Boolean);
      if (masse.length) p.push(['Maße (B×T×H)', (answers.breite || '?') + ' × ' + (answers.tiefe || '?') + ' × ' + (answers.hoehe || '?') + ' mm']);
      /* Nur wenn der Kunde wirklich etwas gewaehlt hat - eine leere
         Zeile in der Anfrage hilft niemandem. */
      if (answers.hoehebezug) {
        p.push(['Höhenangabe bezieht sich auf', answers.hoehebezug
          + (answers.hoehebezug_text ? ' – ' + answers.hoehebezug_text : '')]);
      }
      if ((answers.produkt === 'Terrassendach TDS' ||
           answers.produkt === 'Balkonüberdachung') && answers.vorsprung) p.push(['Dachvorsprung', answers.vorsprung + ' mm']);
      if (answers.balkonbruestung) p.push(['Brüstung', answers.balkonbruestung]);
      if (answers.carportvariante === 'Carport mit Überstand' && answers.ueberstand) p.push(['Überstand', answers.ueberstand + ' mm']);
    }
    if (inFlow('verglasung') && answers.verglasung) p.push(['Eindeckung', answers.verglasung + (isGlas(answers.verglasung) && answers.glasstaerke ? ' · ' + answers.glasstaerke : '')]);
    if (inFlow('markise') && answers.markise && answers.markise !== 'Keine Markise') p.push(['Sonnenschutz', answers.markise]);
    if (inFlow('stoff') && answers.stoff) p.push(['Markisenstoff', stoffText(answers.stoff)]);
    if (inFlow('stoffzip') && answers.stoffzip) p.push(['Stoff Senkrechtmarkise', stoffText(answers.stoffzip)]);
    if (inFlow('erweiterungen')) {
      [['erw_links', 'Erweiterung links'], ['erw_rechts', 'Erweiterung rechts'],
       ['erw_vorne', 'Erweiterung vorne'], ['erw_hinten', 'Erweiterung hinten']].forEach(function (e) {
        var v = answers[e[0]];
        if (v && v.length) p.push([e[1], v.join(', ')]);
      });
    }
    if (inFlow('led')) {
      if (answers.led) {
        var ledZ = parseInt(answers.ledsetzahl, 10);
        // Kommt die Angabe aus dem 3D-Konfigurator, ist noch kein Set gewaehlt –
        // dann stand hier vorher eine leere Zeile und der LED-Wunsch fiel aus der E-Mail.
        p.push(['LED-Beleuchtung', hasLed(answers.led)
          ? (answers.ledset ? (ledZ > 1 ? ledZ + ' × ' : '') + answers.ledset : 'Ja – Set noch offen')
          : 'Nein']);
      }
      if (answers.sound) p.push(['Lautsprecher', isJa(answers.sound) ? answers.soundset : 'Nein']);
    }
    if (inFlow('seitenschutz') && answers.seitenschutz) p.push(['Seitenschutz', answers.seitenschutz]);
    if (inFlow('komfort')) {
      if (answers.led) p.push(['Beleuchtung', isJa(answers.led) ? 'Ja' : 'Nein']);
      if (answers.heizung) p.push(['Heizstrahler', isJa(answers.heizung) ? 'Ja' : 'Nein']);
      if (answers.dachausfuehrung === 'Premium (Warema Lamaxa L50)' && answers.sound) p.push(['Lautsprecher', isJa(answers.sound) ? 'Ja' : 'Nein']);
      if (answers.wettersensor) p.push(['Wetter-Automatik', isJa(answers.wettersensor) ? 'Ja' : 'Nein']);
    }
    if (inFlow('dach') && answers.dach) p.push(['Dach', answers.dach]);
    if (inFlow('farbe') && answers.farbe) p.push(['Farbe', answers.farbe]);
    /* Die Notiz aus dem 3D-Konfigurator landet in answers.wunsch (siehe
       vorgabeUebernehmen). Der Schritt „wunsch" gehört bei den
       Standardprodukten aber nicht zum Ablauf – mit der alten Bedingung fiel
       die Notiz damit komplett aus der E-Mail. Genau darin stehen die
       Angaben, für die es im Assistenten kein eigenes Feld gibt:
       Sonnenschutz, Verkleidung, Bodenbelag, Stellung der Schiebeelemente.
       Deshalb: mitschicken, sobald sie da ist. Gefunden vom Rückleseteil des
       Browsertests zum Konfigurator. */
    if (answers.wunsch) {
      p.push([inFlow('wunsch') ? 'Wunsch' : 'Aus dem 3D-Konfigurator', answers.wunsch]);
    }
    /* Der vollstaendige Fachtext aus dem Konfigurator – nur in den Versand,
       nicht in die Anzeige. Er enthaelt Fertigungs- und Kalkulationsangaben
       (Profilmasse, Spannweite, Innenkern, Bestellformular des Herstellers),
       die der Kunde nicht einordnen kann: „es stehen teilweise sachen drin
       die sind für uns relevant der kunde kann damit nix anfangen"
       (Betreiber, 15.10.2026). Deshalb entscheidet der Aufrufer:
       summaryRows() zeigt ohne, jeder Versandweg schickt mit. */
    if (mitFachtext && answers.fachnotiz) {
      p.push(['Technische Angaben (intern)', answers.fachnotiz]);
    }
    /* Der Konfigurationslink - NUR in den Versand, nicht in die Anzeige.
       „stelle sicher das auch der konfigurationslink verschickt wird das
       ich diesen aufrufen kann" (Betreiber, 02.11.2026). Der Betrieb
       oeffnet damit genau die angefragte Planung im Konfigurator und
       kann daraus auch das PDF erzeugen.

       Nicht in der Kundenzusammenfassung: Der Link ist mehrere hundert
       Zeichen lang und wuerde die Uebersicht zerreissen. */
    if (mitFachtext && answers.konfiglink) {
      p.push(['Konfigurationslink', answers.konfiglink]);
    }
    if (inFlow('untergrund') && answers.untergrund) p.push(['Untergrund', answers.untergrund]);
    if (inFlow('montage') && answers.montage) p.push(['Montage', answers.montage]);
    var name = [answers.k_vorname, answers.k_nachname].filter(Boolean).join(' ');
    if (answers.k_anrede) p.push(['Anrede', answers.k_anrede]);
    if (name) p.push(['Name', name]);
    if (answers.k_email) p.push(['E-Mail', answers.k_email]);
    if (answers.k_telefon) p.push(['Telefon', answers.k_telefon]);
    var ort = [answers.k_plz, answers.k_ort].filter(Boolean).join(' ');
    if (ort) p.push(['Ort', ort]);
    /* Nur fuer die Anfrage-E-Mail an den Betrieb, nicht fuer den
       Besucher: liegt die PLZ im ueblichen Fahrtgebiet? Siehe
       EINZUGSGEBIET weiter oben. Bei ungueltiger PLZ steht hier nichts -
       lieber keine Zeile als eine geratene. */
    if (mitFachtext) {
      /* NUR mit mitFachtext, also nur in E-Mail und Übergabe an den
         Betrieb. summaryPairs(false) ist die Zusammenfassung, die der
         BESUCHER sieht - dort darf "ausserhalb des Einzugsgebiets" nicht
         auftauchen. Dieselbe Schranke tragen fachnotiz und konfiglink. */
      var stufe = gebietspruefung(answers.k_plz);
      if (stufe === 'kern')   p.push(['Gebiet', 'im Einzugsgebiet']);
      if (stufe === 'rand')   p.push(['Gebiet', 'Randlage, geschätzt 60 bis 65 km']);
      if (stufe === 'ferner') p.push(['Gebiet', 'über 65 km, nur nach Absprache']);
    }
    if (answers.k_quelle) p.push(['Aufmerksam geworden durch', answers.k_quelle]);
    return p;
  }
  function summaryRows() {
    return summaryPairs(false).map(function (r) {
      return '<div class="aw-sum-row"><span class="aw-sum-k">' + esc(r[0]) + '</span><span class="aw-sum-v">' + esc(r[1]) + '</span></div>';
    }).join('');
  }
  function summaryText() {
    return 'Anfrage-Nr: ' + ref + '\n' + summaryPairs(true).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
  }

  /* ---------- Rendering & Navigation ---------- */
  function currentId() { return flow[idx]; }

  function render() {
    var step = STEPS[currentId()];
    document.getElementById('awTitle').textContent = typeof step.title === 'function' ? step.title() : step.title;
    subEl.textContent = step.sub || 'Anfrage-Nr. ' + ref;
    subEl.style.display = '';
    bodyEl.innerHTML = step.render();
    bodyEl.scrollTop = 0;
    if (currentId() === 'kontakt') {
      ['k_plz', 'k_ort'].forEach(function (id) {
        var f = document.getElementById(id);
        if (f) f.addEventListener('input', gebietshinweisZeigen);
      });
      gebietshinweisZeigen();
    }

    // Progress
    var pct = flow.length > 1 ? Math.round(idx / (flow.length - 1) * 100) : 0;
    barEl.style.width = pct + '%';

    // Buttons
    backBtn.style.display = idx === 0 ? 'none' : '';
    if (currentId() === 'summary') {
      nextBtn.textContent = 'Anfrage absenden ✓';
      nextBtn.classList.add('aw-btn--send');
    } else {
      nextBtn.textContent = 'Weiter →';
      nextBtn.classList.remove('aw-btn--send');
    }

    bindStep();
  }

  // Neu rendern ohne Scroll-Sprung (für Multi-Select in den Erweiterungen)
  function rerenderKeepScroll() { var st = bodyEl.scrollTop; render(); bodyEl.scrollTop = st; }

  // Bild-Großansicht (Lightbox) für die Erweiterungs-Fotos
  function openLightbox(imgSlug, label) {
    var lb = document.createElement('div');
    lb.className = 'aw-lightbox';
    lb.innerHTML = '<div class="aw-lightbox-inner">' +
      '<img src="/images/wizard/erw_' + imgSlug + '.webp?v=' + ASSET_VER + '" alt="' + esc(label) + '">' +
      '<p>' + esc(label) + '</p>' +
      '<button type="button" class="aw-lightbox-close" aria-label="Schließen">✕</button></div>';
    function close() { if (lb.parentNode) lb.parentNode.removeChild(lb); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    lb.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
  }

  /* Die Trefferknoepfe werden nach jedem Tastendruck neu erzeugt und
     muessen deshalb jedes Mal neu verdrahtet werden. */
  function ralPickBinden() {
    Array.prototype.forEach.call(bodyEl.querySelectorAll('[data-ral-pick]'), function (btn) {
      btn.addEventListener('click', function () {
        var nr = btn.getAttribute('data-ral-pick');
        var name = window.BV_RAL ? window.BV_RAL.TABELLE[nr][1] : '';
        answers.farbe = 'RAL ' + nr + (name ? ' – ' + name : '');
        clearError();
        rerenderKeepScroll();
      });
    });
  }

  function bindStep() {
    // Option-Karten (Einfachauswahl)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-option'), function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-field');
        var v = btn.getAttribute('data-value');
        // Produktwechsel → gesamte bisherige Konfiguration verwerfen (keine Vermischung)
        if (f === 'produkt' && answers.produkt !== v) resetConfig();
        answers[f] = v;
        Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-option[data-field="' + f + '"]'), function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        clearError();
        // Produkt-Auswahl aktualisiert den Ablauf sofort
        if (f === 'produkt') flow = computeFlow();
        // Carport-Typ gewechselt → Ausführung zurücksetzen + Ablauf neu berechnen
        if (f === 'carporttyp') { answers.carportvariante = ''; flow = computeFlow(); }
        // Dachart gewechselt → Ausführung zurücksetzen + Ablauf neu berechnen (Ausführung nur beim Lamellendach)
        if (f === 'dachart') { answers.dachausfuehrung = ''; flow = computeFlow(); }
        // Aufbau: Fassade-Schritt nur bei Wandmontage
        if (f === 'aufbau') {
          if (btn.getAttribute('data-value') !== 'Wandmontage') { answers.fassade = ''; answers.fassade_text = ''; }
          flow = computeFlow();
        }
        // Carport-Ausführung: Fassade nur bei Wandmontage, Überstand nur bei „mit Überstand"
        if (f === 'carportvariante') {
          var cv = btn.getAttribute('data-value');
          if (cv !== 'Carport mit Wandmontage') { answers.fassade = ''; answers.fassade_text = ''; }
          if (cv !== 'Carport mit Überstand') answers.ueberstand = '';
          flow = computeFlow();
        }
        // Eindeckung neu rendern, damit die Glasstärke-Auswahl ein-/ausblendet
        if (f === 'verglasung') { if (!isGlas(btn.getAttribute('data-value'))) answers.glasstaerke = ''; render(); }
        // LED neu rendern, damit die Set-Auswahl ein-/ausblendet
        if (f === 'led') { if (!hasLed(btn.getAttribute('data-value'))) answers.ledset = ''; rerenderKeepScroll(); }
        // Lautsprecher neu rendern, damit die Set-Auswahl ein-/ausblendet
        if (f === 'sound') { if (!isJa(btn.getAttribute('data-value'))) answers.soundset = ''; rerenderKeepScroll(); }
      });
    });
    // Pills (Glasstärke, LED-Set – Einfachauswahl)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-pill[data-pill]'), function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-pill');
        answers[f] = btn.getAttribute('data-value');
        Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-pill[data-pill="' + f + '"]'), function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        clearError();
        // LED-Set gewählt → neu rendern, damit das optionale „Wie viele Sets?"-Feld erscheint
        if (f === 'ledset') rerenderKeepScroll();
      });
    });
    /* Der Hoehenbezug: merken und neu zeichnen, damit bei "Sonstiges"
       das Freitextfeld erscheint - dieselbe Mechanik wie beim LED-Set.
       Vorher die Masse einsammeln, sonst waeren die gerade getippten
       Zahlen nach dem Neuzeichnen wieder weg. */
    /* Die Auswahl erscheint erst, wenn eine Hoehe dasteht - also muss
       das Hoehenfeld beim VERLASSEN neu zeichnen. Nicht bei jedem
       Tastendruck: Das Neuzeichnen nimmt dem Feld den Fokus, und man
       koennte die Zahl nicht zu Ende tippen. */
    var hFeld = bodyEl.querySelector('#aw_hoehe');
    if (hFeld) {
      hFeld.addEventListener('blur', function () {
        var vorher = !!answers.hoehe;
        collectMasse();
        if (!!answers.hoehe !== vorher) rerenderKeepScroll();
      });
    }
    var hBezug = bodyEl.querySelector('#awHoeheBezug');
    if (hBezug) {
      hBezug.addEventListener('change', function () {
        collectMasse();
        answers.hoehebezug = hBezug.value;
        if (answers.hoehebezug !== 'Sonstiges') answers.hoehebezug_text = '';
        rerenderKeepScroll();
      });
    }
    // Anzahl der Sets (optional, Standard 1)
    var ledSets = bodyEl.querySelector('#ledSets');
    if (ledSets) {
      ledSets.addEventListener('input', function () {
        var v = ledSets.value.replace(/[^0-9]/g, '').slice(0, 2);
        ledSets.value = v;
        answers.ledsetzahl = v;
      });
    }
    // Erweiterungs-Dropdowns: Auf-/Zuklappen (nur eines offen)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-dd-toggle'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-dd-toggle');
        openDd = (openDd === id) ? null : id;
        rerenderKeepScroll();
      });
    });
    // Erweiterungs-Optionen: Mehrfachauswahl (Panel bleibt offen)
    /* ---------- RAL-Suche ---------- */
    Array.prototype.forEach.call(bodyEl.querySelectorAll('[data-ral-open]'), function (btn) {
      btn.addEventListener('click', function () {
        ralOffen = !ralOffen;
        rerenderKeepScroll();
        var feld = bodyEl.querySelector('#awRalFeld');
        if (feld) feld.focus();
      });
    });
    var ralFeld = bodyEl.querySelector('#awRalFeld');
    if (ralFeld) {
      ralFeld.addEventListener('input', function () {
        ralFrage = ralFeld.value;
        /* Nur die Liste tauschen – siehe Begruendung bei ralTrefferHtml. */
        var ziel = bodyEl.querySelector('#awRalTreffer');
        if (ziel) { ziel.innerHTML = ralTrefferHtml(ralFrage); ralPickBinden(); }
      });
    }
    ralPickBinden();

    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-dd-opt[data-dd-pick]'), function (btn) {
      btn.addEventListener('click', function () {
        erwToggle(btn.getAttribute('data-dd-pick'), btn.getAttribute('data-value'));
        rerenderKeepScroll();
      });
    });
    // Klick auf ein Erweiterungs-Foto → Großansicht (statt Auswahl umzuschalten)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-dd-thumb[data-zoom]'), function (t) {
      t.addEventListener('click', function (e) {
        e.stopPropagation();
        openLightbox(t.getAttribute('data-zoom'), t.getAttribute('data-zoom-label'));
      });
    });
    // Checkboxen (Mehrfach)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-check'), function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-extra');
        answers.extras = answers.extras || [];
        var i = answers.extras.indexOf(v);
        if (i === -1) { answers.extras.push(v); btn.classList.add('is-active'); }
        else { answers.extras.splice(i, 1); btn.classList.remove('is-active'); }
      });
    });
  }

  function showError(msg) {
    clearError();
    var e = document.createElement('div');
    e.className = 'aw-error';
    e.id = 'awError';
    e.textContent = msg;
    bodyEl.appendChild(e);
  }
  function clearError() {
    var e = document.getElementById('awError');
    if (e) e.parentNode.removeChild(e);
  }

  function goNext() {
    var id = currentId();
    if (id === 'masse') collectMasse();
    if (id === 'erweiterungen') STEPS.erweiterungen.collect();
    if (id === 'fassade') STEPS.fassade.collect();
    var step = STEPS[id];
    var err = step.valid ? step.valid() : null;
    if (err) { showError(err); return; }

    if (id === 'produkt' || id === 'carporttyp' || id === 'aufbau' || id === 'carportvariante') flow = computeFlow();

    if (id === 'summary') { submit(); return; }

    if (idx < flow.length - 1) { idx++; render(); }
  }

  function goBack() {
    if (currentId() === 'masse') collectMasse();
    if (currentId() === 'erweiterungen') STEPS.erweiterungen.collect();
    if (currentId() === 'fassade') STEPS.fassade.collect();
    if (idx > 0) { idx--; render(); }
  }

  /* ---------- Absenden ----------
     Zwei voneinander unabhängige Wege, damit keine Anfrage verloren geht:
       1. Datenbank: POST an den eigenen Worker (/api/kontakt → Neon). Best
          effort – ein Fehler hier blockiert das Absenden NICHT.
       2. E-Mail an info@: primär über Web3Forms (kostenlos), und falls das
          scheitert automatisch über Formspree (bisheriger, bewährter Weg).
     Erst wenn KEIN E-Mail-Weg funktioniert, sieht der Nutzer einen Fehler. */
  function submit() {
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = 'Wird gesendet …';

    var name = [answers.k_vorname, answers.k_nachname].filter(Boolean).join(' ');
    var subject = 'Anfrage ' + ref + ': ' + (answers.produkt || '') + ' – ' + name;

    // 1) Datenbank (parallel, Fehler werden bewusst ignoriert)
    try {
      fetch(KONTAKT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          anrede: answers.k_anrede || '',
          name: name,
          email: answers.k_email || '',
          telefon: answers.k_telefon || '',
          plz: answers.k_plz || '',
          ort: answers.k_ort || '',
          produkt: answers.produkt || '',
          betreff: subject,
          nachricht: summaryText(),
          quelle_detail: answers.k_quelle || ''
        })
      }).catch(function () {});
    } catch (e) {}

    // 2) E-Mail: Web3Forms primär → Formspree als Fallback
    sendWeb3(subject).then(function (okW3) {
      if (okW3) { showSuccess(); return; }
      return sendFormspree(subject).then(function (okFs) {
        if (okFs) { showSuccess(); return; }
        throw new Error('kein E-Mail-Weg erfolgreich');
      });
    }).catch(function () {
      nextBtn.disabled = false;
      backBtn.disabled = false;
      nextBtn.textContent = 'Erneut senden';
      showError('Senden fehlgeschlagen. Bitte rufen Sie uns direkt an: 015678696609');
    });
  }

  // E-Mail über Web3Forms (client-seitig, kostenlos). Gibt true bei Erfolg.
  function sendWeb3(subject) {
    var payload = { access_key: WEB3FORMS_KEY, subject: subject, from_name: 'BV AussenSysteme Website', 'Anfrage-Nr': ref };
    summaryPairs(true).forEach(function (r) { payload[r[0]] = r[1]; });
    payload.replyto = answers.k_email || '';
    return fetch(WEB3FORMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); })
      .then(function (d) { return !!(d && d.success); })
      .catch(function () { return false; });
  }

  // E-Mail über Formspree (Notfall-Backup). Gibt true bei Erfolg.
  function sendFormspree(subject) {
    var fd = new FormData();
    fd.append('_subject', subject);
    fd.append('_replyto', answers.k_email || '');
    fd.append('_gotcha', '');
    fd.append('Anfrage-Nr', ref);
    summaryPairs(true).forEach(function (r) { fd.append(r[0], r[1]); });
    fd.append('Zusammenfassung', summaryText());
    return fetch(FORMSPREE, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) { return !!(d && d.ok); })
      .catch(function () { return false; });
  }

  function showSuccess() {
    /* Die einzige Zahl, an der wirklich Geld haengt: eine Anfrage, die
       den Browser verlassen hat. Hier und nicht am Absendeknopf -
       dieser Zweig wird erst erreicht, wenn ein Versandweg Erfolg
       gemeldet hat (js/messung.js, Auswertung in /werkstatt/). */
    if (window.bvMessung) window.bvMessung('anfrage-gesendet');
    document.getElementById('awNav').style.display = 'none';
    subEl.style.display = 'none';
    document.getElementById('awTitle').textContent = 'Vielen Dank!';
    barEl.style.width = '100%';

    var waText = encodeURIComponent('Hallo, hier ist meine Anfrage ' + ref + ' (' + (answers.produkt || '') + '). Ich möchte Fotos meiner Terrasse senden:');
    var mailSub = encodeURIComponent('Fotos zu Anfrage ' + ref);
    var mailBody = encodeURIComponent('Hallo BV AussenSysteme,\n\nanbei Fotos zu meiner Anfrage ' + ref + '.\n\n(Bitte Fotos an diese E-Mail anhängen.)\n\nViele Grüße');

    bodyEl.innerHTML =
      '<div class="aw-done">' +
      '<div class="aw-done-ic">✓</div>' +
      '<p class="aw-done-lead">Ihre Anfrage ist bei uns eingegangen.</p>' +
      '<p class="aw-done-ref">Anfrage-Nr. <strong>' + esc(ref) + '</strong></p>' +
      '<p class="aw-done-txt">Wir melden uns in der Regel innerhalb von 24 Stunden bei Ihnen.</p>' +
      '<div class="aw-photo-box">' +
      '<p class="aw-photo-h">Haben Sie Fotos Ihrer Terrasse?</p>' +
      '<p class="aw-photo-sub">Das hilft uns enorm bei der Planung. Senden Sie sie ganz einfach nach:</p>' +
      '<a class="aw-photo-btn aw-photo-btn--wa" href="https://wa.me/' + WA_NUMBER + '?text=' + waText + '" target="_blank" rel="noopener">Fotos per WhatsApp senden</a>' +
      '<a class="aw-photo-btn aw-photo-btn--mail" href="mailto:' + MAIL + '?subject=' + mailSub + '&body=' + mailBody + '">Fotos per E-Mail senden</a>' +
      '</div>' +
      '</div>';
  }

  /* ---------- Vorgabe aus dem 3D-Konfigurator ----------
     Wer sein Dach dort zusammengestellt hat, soll die Angaben nicht noch
     einmal eintippen. Die Konfiguration kommt als window.bvKonfigVorgabe,
     wird in die Antworten uebernommen und der Assistent springt direkt zu
     den Kontaktdaten. Zurueckblaettern bleibt moeglich, falls jemand doch
     noch etwas aendern will. */
  function vorgabeUebernehmen() {
    var v = window.bvKonfigVorgabe;
    if (!v || typeof v !== 'object') return;

    /* Jedes Feld, das der 3D-Konfigurator schickt, muss hier stehen – sonst
       kommt es nie an, ohne dass irgendwo eine Meldung erscheint. Genau das
       war schon einmal passiert (dachausfuehrung). Welche Felder es gibt,
       prüft scripts/pruefe-konfigurator.js. */
    var felder = ['produkt', 'aufbau', 'breite', 'tiefe', 'hoehe', 'verglasung',
                  'farbe', 'led', 'montage', 'dachart', 'carporttyp', 'carportvariante',
                  'dach', 'ueberstand', 'seitenschutz', 'dachausfuehrung',
                  'fassade', 'fassade_text', 'hoehebezug', 'hoehebezug_text',
                  'untergrund', 'vorsprung', 'markise',
                  'ledset', 'ledsetzahl', 'sound', 'soundset',
                  'heizung', 'wettersensor', 'stoff', 'stoffzip'];
    felder.forEach(function (k) {
      if (v[k] != null && v[k] !== '') answers[k] = String(v[k]);
    });
    // Die seitlichen Erweiterungen sind Listen, keine einzelnen Werte
    ['erw_links', 'erw_rechts', 'erw_vorne', 'erw_hinten'].forEach(function (k) {
      if (Array.isArray(v[k]) && v[k].length) answers[k] = v[k].slice();
    });
    if (v.notiz) answers.wunsch = v.notiz;
    if (v.fachnotiz) answers.fachnotiz = v.fachnotiz;
    if (v.konfiglink) answers.konfiglink = v.konfiglink;

    flow = computeFlow();
    var ziel = flow.indexOf('kontakt');
    idx = ziel > -1 ? ziel : 0;
    render();
    window.bvKonfigVorgabe = null;
  }

  document.addEventListener('bv-konfig-vorgabe', vorgabeUebernehmen);

  /* Standort aus dem Windzonen-Rechner uebernehmen.

     ANLASS (13.11.2026): Der Rechner unter /windzonen verspricht
     "Schicken Sie uns Ihre Maße, dann rechnen wir das fuer Ihren
     Standort durch" - gab den Standort aber nicht weiter. Der Besucher
     tippte PLZ und Ort hier ein zweites Mal ein, obwohl er sie dort
     gerade gesucht hatte. /windzonen ist nach der Startseite die
     zweithaeufigste Einstiegsseite (28 Aufrufe, 70 Sekunden
     Verweildauer - die laengste von allen).

     Hier wird NOCHMALS geprueft, nicht nur beim Schreiben: Der Speicher
     liegt im Browser des Besuchers und laesst sich von Hand aendern.
     Fuenf Ziffern fuer die PLZ, Buchstaben mit Leerzeichen, Bindestrich,
     Punkt, Schraegstrich und Klammern fuer den Ort, hoechstens 60
     Zeichen. Alles andere wird verworfen - sonst stuende Beliebiges in
     der Anfrage-E-Mail.

     Kein Sprung im Ablauf: Der Besucher hat nur einen Ort gesucht, kein
     Produkt gewaehlt. Die Felder sind vorbelegt und bleiben aenderbar. */
  function standortAusSpeicher() {
    var plz, ort;
    try {
      plz = sessionStorage.getItem('bv-plz');
      ort = sessionStorage.getItem('bv-ort');
      sessionStorage.removeItem('bv-plz');
      sessionStorage.removeItem('bv-ort');
    } catch (e) { return; }
    if (plz && /^\d{5}$/.test(plz) && !answers.k_plz) answers.k_plz = plz;
    if (ort && ort.length <= 60
        && /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\s.\-\/()]*$/.test(ort)
        && !answers.k_ort) answers.k_ort = ort;
  }

  /* Produktwahl von einer Produktseite uebernehmen.

     GEFUNDEN AM 13.11.2026 auf allen sechs Produktseiten: Die
     Anfrage-Knoepfe setzten per onclick
     document.getElementById('produkt').value - ein Feld, das es auf
     diesen Seiten gar nicht gibt. Jeder Klick warf einen Fehler. Und
     vier der sechs setzten ausserdem einen Wert, den der Schritt
     "produkt" nicht kennt: "Terrassenueberdachung", "Kaltwintergarten",
     "Sonnenschutz / Markise", "Gelaender". Die Vorauswahl waere also
     auch mit vorhandenem Feld verfallen.

     Warum sessionStorage und nicht window.bvKonfigVorgabe: Die Karten
     verweisen auf /#kontakt, also auf eine ANDERE Seite. Beim
     Seitenwechsel wird window verworfen.
     Warum kein Adressparameter: Der wuerde eine zweite Adresse der
     Startseite erzeugen - mit eigenem Zwischenspeicher-Eintrag und einer
     zusaetzlichen Zeile in der Reichweitenmessung.

     Warum ein SCHLUESSEL und nicht der Produktname: So kann aus dem
     Speicher nichts in die Antworten geraten, was hier nicht
     aufgeschrieben steht - und von dort in die Anfrage-E-Mail. Ein
     unbekannter Schluessel wird stillschweigend verworfen.

     Drei Produkte haben im Assistenten keine eigene Kachel (Gelaender,
     Markise, Kaltwintergarten). Die gehen ueber "Direkt anfragen" - so
     nennt dessen Beschriftung es selbst ("Markise, Gelaender, Vordach
     … oder kurze Nachricht") - und bekommen den Namen gleich in das
     Nachrichtenfeld geschrieben, damit die Anfrage nicht ohne Produkt
     ankommt. */
  /* ======================================================================
     EINZUGSGEBIET: liegt die Postleitzahl im ueblichen Fahrtgebiet?

     ANLASS (14.11.2026), Betreiber: "waere auch gut im konfigurator, wenn
     man am ende seine daten eintraegt und die plz ort etc. das das system
     prueft, ob das in unserem 60km radius ab 56422 dernbach is".

     WARUM KEIN ECHTER KILOMETER-RADIUS. Dafuer braeuchte es Koordinaten zu
     jeder Postleitzahl. Geprueft am 14.11.2026: Das amtliche BKG-Paket ist
     laut seinen Nutzungsbedingungen geldleistungsfrei nur fuer
     "Bundesbehoerden und weitere Nutzungsberechtigte im Sinne des
     § 4 V GeoBund" - ein Handwerksbetrieb gehoert nicht dazu. OpenPLZ
     stuetzt sich auf dieselben Daten. Die freien Alternativen (Eurostat
     CC-BY-SA, OSM/ODbL) tragen Share-alike. Ein Dienst im Netz wiederum
     haette die PLZ des Interessenten an einen Dritten geschickt und die
     Datenschutzerklaerung mitgeaendert. Beides wurde verworfen.

     WAS STATTDESSEN. Eine Liste der Leitregionen (die ersten drei Ziffern
     der PLZ) aus den Orten, die auf der eigenen Seite stehen. Eigene
     Angaben, keine fremde Datenbank, keine Uebermittlung.

     >>> DIESE LISTE IST EIN ENTWURF UND GEHOERT VOM BETREIBER BESTAETIGT.
     >>> Eine Leitregion deckt grob 10 bis 25 km ab. Wer eine Gegend
     >>> ergaenzen oder streichen will, aendert nur diese Zeilen.

     WAS PASSIERT, WENN ES NICHT PASST: dem Besucher NICHTS. Die eigene FAQ
     sagt "Bei groesseren Auftraegen kommen wir auch weiter" - eine Absage
     im Formular wuerde genau die Anfragen kosten, die sich lohnen. Der
     Hinweis steht nur in der Anfrage-E-Mail an den Betrieb. */
  /* Regel des Betreibers (14.11.2026): "60 grenze 65 maximal ueber 65
     nach absprache". Drei Stufen also.

     WAS DAMIT NICHT GEHT, ehrlich benannt: Eine Leitregion (die ersten
     drei Ziffern der PLZ) umfasst ein Gebiet von grob 10 bis 25 km. Die
     Linie zwischen 60 und 65 km laesst sich damit NICHT ziehen - dafuer
     braeuchte es Koordinaten, und warum es die hier nicht gibt, steht im
     Abschnitt darueber. Abgebildet sind deshalb zwei Stufen:

       kern   - liegt sicher im Gebiet (geschaetzt unter 60 km)
       rand   - liegt an der Grenze (geschaetzt 60 bis 65 km)
       sonst  - darueber, also nur nach Absprache

     ENTFERNUNGEN SIND GESCHAETZT, NICHT GEMESSEN - aus der Lage der Orte.
     Im Zweifel wird eine Gegend NICHT in "kern" aufgenommen: Ein falsches
     "liegt im Gebiet" waere ein falsches Signal in der eigenen E-Mail,
     ein fehlender Treffer kostet nichts, weil der Besucher davon nichts
     sieht.

     Herausgenommen, weil die Leitregion weit ueber 65 km hinausreicht:
     567 (Mayen zieht sich in die Vulkaneifel, Ulmen rund 85 km) und
     652 (Taunus, Hofheim rund 70 km). */
  var GEBIET_KERN = [
    '560', '561', '562', '563', '564', '565',  // Koblenz, Lahnstein, Bad Ems, Montabaur, Wirges, Dernbach, Neuwied, Westerburg
    '566',                                     // Andernach, Weissenthurm (rund 40 km)
    '575', '576',                              // Betzdorf, Wissen, Hachenburg, Altenkirchen, Bad Marienberg
    '535',                                     // Linz, Unkel, Asbach (rund 35 bis 45 km)
    '655'                                      // Limburg, Diez, Bad Camberg, Idstein (rund 25 bis 50 km)
  ];
  var GEBIET_RAND = [
    '536'                                      // Bad Honnef, Koenigswinter, Hennef, Siegburg (rund 55 bis 65 km)
  ];

  /* Gibt 'kern', 'rand', 'ferner' oder null zurueck. null heisst: keine
     gueltige PLZ, also wird nichts behauptet. */
  function gebietspruefung(plz) {
    if (!/^\d{5}$/.test(String(plz || ''))) return null;
    var v = String(plz).slice(0, 3);
    if (GEBIET_KERN.indexOf(v) > -1) return 'kern';
    if (GEBIET_RAND.indexOf(v) > -1) return 'rand';
    return 'ferner';
  }


  var PRODUKTWEGE = {
    'terrassendach-tds':  { produkt: 'Terrassendach TDS' },
    'flachdach-skyview':  { produkt: 'Flachdach SkyView' },
    'carport':            { produkt: 'Carport' },
    'pergola':            { produkt: 'Pergola / Lamellendach' },
    'balkonueberdachung': { produkt: 'Balkonüberdachung' },
    'kaltwintergarten':   { produkt: 'Direkt anfragen', wunsch: 'Kaltwintergarten' },
    'sonnenschutz':       { produkt: 'Direkt anfragen', wunsch: 'Sonnenschutz / Markise' },
    'gelaender':          { produkt: 'Direkt anfragen', wunsch: 'Geländer' },
    /* Diese Produkte haben im Assistenten keine eigene Kachel. Sie gehen
       ueber "Direkt anfragen" und tragen ihren Namen gleich im
       Nachrichtenfeld - sonst kaeme die Anfrage ohne Produkt an.
       Faltdach und Velaris gehoeren zu "Pergola / Lamellendach", so nennt
       dessen Beschriftung es selbst ("Lamellendach · Faltdach · Velaris"). */
    'fassade':            { produkt: 'Direkt anfragen', wunsch: 'Fassadenverkleidung Deco Wall' },
    'sichtschutz':        { produkt: 'Direkt anfragen', wunsch: 'Sichtschutz Aluminium' },
    'bushaltestelle':     { produkt: 'Direkt anfragen', wunsch: 'Bushaltestelle' },
    'fahrradueberdachung':{ produkt: 'Direkt anfragen', wunsch: 'Fahrradüberdachung' },
    'gartenhaus':         { produkt: 'Direkt anfragen', wunsch: 'Gartenhaus TDS' },
    'vordach-fly':        { produkt: 'Direkt anfragen', wunsch: 'Vordach FLY' },
    'vordach-front-line': { produkt: 'Direkt anfragen', wunsch: 'Vordach Front Line' },
    'vordach-front-line-plus': { produkt: 'Direkt anfragen', wunsch: 'Vordach Front Line Plus' },
    'eingangsueberdachung-tds':{ produkt: 'Direkt anfragen', wunsch: 'Eingangsüberdachung TDS' }
  };

  /* Freundliche Bestaetigung im Kontaktschritt, sobald eine PLZ aus dem
     Gebiet dasteht. BEWUSST NUR IN EINE RICHTUNG: Liegt die PLZ ausserhalb,
     erscheint NICHTS. Eine Absage im Formular wuerde Anfragen kosten, die
     der Betrieb laut eigener FAQ gerne annimmt ("Bei groesseren Auftraegen
     kommen wir auch weiter"). Der Hinweis fuer den Betrieb steht in der
     E-Mail, nicht auf dem Bildschirm des Besuchers. */
  function gebietshinweisZeigen() {
    var feld = document.getElementById('aw-gebiet');
    if (!feld) return;
    /* Direkt aus den Feldern lesen, nicht aus answers: Der Hinweis soll
       schon beim Tippen erscheinen, answers wird erst beim Weiterklicken
       gefuellt. */
    var pf = document.getElementById('k_plz'), of = document.getElementById('k_ort');
    var plz = pf ? pf.value : answers.k_plz;
    var stufe = gebietspruefung(plz);
    if (stufe === 'kern' || stufe === 'rand') {
      var ort = ((of ? of.value : answers.k_ort) || '').trim();
      feld.textContent = (ort ? ort + ' liegt in unserem Gebiet. ' : 'Das liegt in unserem Gebiet. ')
        + 'Wir sind dort regelmäßig unterwegs.';
      feld.hidden = false;
    } else {
      feld.textContent = '';
      feld.hidden = true;
    }
  }

  function produktAusSpeicher() {
    if (answers.produkt) return;   // eine 3D-Vorgabe hat Vorrang
    var k;
    try {
      k = sessionStorage.getItem('bv-produktwahl');
      /* Nur fuer diesen einen Weg. Ohne das Loeschen haette der Besucher
         die Wahl beim naechsten Oeffnen der Startseite wieder am Hals. */
      sessionStorage.removeItem('bv-produktwahl');
    } catch (e) { return; }        // privates Fenster, gesperrte Speicher
    var weg = k && Object.prototype.hasOwnProperty.call(PRODUKTWEGE, k)
      ? PRODUKTWEGE[k] : null;
    if (!weg) return;
    answers.produkt = weg.produkt;
    if (weg.wunsch) answers.wunsch = weg.wunsch;
    flow = computeFlow();
    /* Einen Schritt weiter, nicht bis zum Kontakt: Der Besucher hat nur das
       Produkt gewaehlt, nicht konfiguriert. Zurueckblaettern bleibt moeglich. */
    idx = flow.length > 1 ? 1 : 0;
    render();
  }

  /* ---------- Start ---------- */
  nextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', goBack);
  render();
  // Falls die Vorgabe schon vor dem Laden dieses Skripts gesetzt wurde
  vorgabeUebernehmen();
  produktAusSpeicher();
  standortAusSpeicher();
})();
