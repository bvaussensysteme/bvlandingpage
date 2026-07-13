/* ============================================================
   BV AussenSysteme – Anfrage-Assistent (geführtes Kundenleitsystem)
   Ersetzt das klassische Kontaktformular durch einen mehrstufigen
   Frage-Ablauf mit Zusammenfassung. Vanilla JS, keine Abhängigkeiten.
   ============================================================ */
(function () {
  'use strict';

  var FORMSPREE = 'https://formspree.io/f/xnjkabdv';
  var WA_NUMBER = '4915678696609';
  var MAIL = 'info@bv-aussensysteme.de';
  var ASSET_VER = '20260712p'; // Versions-Stempel für Wizard-Bilder (Cache-Bust)

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
  function erwIsVorne(id) { return id === 'erw_vorne'; } // Stirnseite: kein Keil, keine Auto-Keil-Regeln
  function erwOptsFor(id) {
    return erwIsVorne(id) ? ERW_OPTS.filter(function (o) { return o.value !== 'Keil'; }) : ERW_OPTS;
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
    if (erwIsVorne(id)) return false;
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
      if (!erwIsVorne(id) && ERW_REQUIRES_KEIL.indexOf(value) > -1 && sel.indexOf('Keil') === -1) sel.push('Keil');
    }
    sel.sort(function (a, b) { return erwIndex(a) - erwIndex(b); });
    answers[id] = sel;
  }

  var wizard = document.getElementById('anfrageWizard');
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
    lupe:     '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'
  };
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  /* ---------- Ablauf je nach Produkt ---------- */
  function computeFlow() {
    var p = answers.produkt;
    // Terrassendach TDS/SkyView: voller Detailablauf (inkl. Seitenelemente → Wintergarten)
    if (p === 'Terrassendach TDS' || p === 'Flachdach SkyView')
      return ['produkt', 'aufbau', 'fassade', 'masse', 'verglasung', 'markise', 'erweiterungen', 'led', 'kontakt', 'summary'];
    // Carport: ohne Fassade/Markise/Erweiterungen
    if (p === 'Carport')
      return ['produkt', 'aufbau', 'masse', 'verglasung', 'led', 'kontakt', 'summary'];
    // Pergola/Lamellendach: ohne Verglasung (Lamellen), mit Markise/Erweiterungen
    if (p === 'Pergola / Lamellendach')
      return ['produkt', 'aufbau', 'fassade', 'masse', 'markise', 'erweiterungen', 'led', 'kontakt', 'summary'];
    if (p === 'Sonstiges')
      return ['produkt', 'wunsch', 'masse', 'kontakt', 'summary'];
    return ['produkt'];
  }

  /* ---------- Wiederverwendbare Bausteine ---------- */
  function optionCards(field, opts) {
    var html = '<div class="aw-options">';
    opts.forEach(function (o) {
      var active = answers[field] === o.value ? ' is-active' : '';
      var muted = o.muted ? ' aw-option--muted' : '';
      var badge = o.badge ? '<span class="aw-badge">' + esc(o.badge) + '</span>' : '';
      var media = o.img
        ? '<span class="aw-option-img' + (o.photo ? ' aw-option-img--photo' : '') + '"><img src="images/wizard/wz_' + o.img + '.webp?v=' + ASSET_VER + '" alt="" loading="lazy">' + badge + '</span>'
        : '<span class="aw-option-ic' + (o.iconBig ? ' aw-option-ic--big' : '') + '">' + svg(o.icon) + '</span>';
      html += '<button type="button" class="aw-option' + active + muted + '" data-field="' + field + '" data-value="' + esc(o.value) + '">' +
        media +
        '<span class="aw-option-lbl">' + esc(o.value) + '</span>' +
        (o.hint ? '<span class="aw-option-hint">' + esc(o.hint) + '</span>' : '') +
        '</button>';
    });
    html += '</div>';
    return html;
  }

  /* ---------- Schritt-Definitionen ---------- */
  var STEPS = {
    produkt: {
      title: 'Was möchten Sie anfragen?',
      render: function () {
        return optionCards('produkt', [
          { value: 'Terrassendach TDS', img: 'terrasse', photo: true, hint: 'Klassiker – Glas oder Polycarbonat' },
          { value: 'Flachdach SkyView', img: 'flach', photo: true, hint: 'Modernes Flachdach-Design' },
          { value: 'Carport', img: 'carport', photo: true, hint: 'TDS · Flat Line · Flat Box' },
          { value: 'Pergola / Lamellendach', img: 'pergola', photo: true, hint: 'SunPro · Velaris' },
          { value: 'Sonstiges', icon: I.sonst, hint: 'Markise, Geländer, Vordach …' }
        ]);
      },
      valid: function () { return answers.produkt ? null : 'Bitte wählen Sie ein Produkt.'; }
    },

    aufbau: {
      title: 'Art des Aufbaus',
      render: function () {
        return optionCards('aufbau', [
          { value: 'Wandmontage', img: 'wand', hint: 'Am Haus befestigt' },
          { value: 'Freistehend', img: 'frei', hint: 'Auf eigenen Stützen' }
        ]);
      },
      valid: function () { return answers.aufbau ? null : 'Bitte wählen Sie die Art des Aufbaus.'; }
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
          '<div class="aw-subchoice"><label class="aw-group-h" for="fassadeText">Ergänzung zur Fassade (optional)</label>' +
          '<textarea class="aw-textarea aw-textarea--sm" id="fassadeText" placeholder="z. B. Fassadenart, Dämmung (z. B. WDVS), Dämmstärke in cm …">' + esc(answers.fassade_text || '') + '</textarea></div>';
      },
      collect: function () { var e = document.getElementById('fassadeText'); if (e) answers.fassade_text = e.value; },
      valid: function () { return answers.fassade ? null : 'Bitte wählen Sie Ihre Fassade.'; }
    },

    masse: {
      title: 'Gewünschte Maße',
      sub: 'Grobe Angaben genügen – wir messen später vor Ort exakt nach',
      render: function () {
        var opt = answers.produkt === 'Sonstiges';
        var tds = answers.produkt === 'Terrassendach TDS';
        return '<div class="aw-dims">' +
          dimField('breite', 'Breite', 'z. B. 400', 'cm') +
          dimField('tiefe', 'Tiefe', 'z. B. 300', 'cm') +
          dimField('hoehe', 'Höhe (optional)', 'z. B. 250', 'cm') +
          (tds ? dimField('vorsprung', 'Dachvorsprung (optional)', 'z. B. 30', 'cm') : '') +
          '</div>' +
          '<p class="aw-note">Alle Maße in Zentimeter (cm).' + (opt ? ' Optional – Sie können auch ohne Maße fortfahren.' : ' Grobe Angaben genügen.') + '</p>';
      },
      valid: function () {
        if (answers.produkt === 'Sonstiges') return null; // optional
        if (!answers.breite || !answers.tiefe) return 'Bitte geben Sie mindestens Breite und Tiefe an.';
        return null;
      }
    },

    verglasung: {
      title: 'Welche Eindeckung wünschen Sie?',
      render: function () {
        var opts = [
          { value: 'VSG-Glas klar', img: 'vsg_klar', photo: true, hint: 'Durchsichtig, edel' },
          { value: 'VSG-Glas Opal (milchig)', img: 'vsg_opal', photo: true, hint: 'Blickdicht, sanftes Licht' },
          { value: 'Polycarbonat klar', img: 'poly_klar', photo: true, hint: 'Leicht & günstiger' },
          { value: 'Polycarbonat Opal (milchig)', img: 'poly_opal', photo: true, hint: 'Wärmeschutz, diffuses Licht' }
        ];
        // „Noch unsicher" nur zeigen, solange keine VSG-Glas-Variante gewählt ist
        if (!isGlas(answers.verglasung)) opts.push({ value: 'Noch unsicher – bitte beraten', icon: I.frage });
        var cards = optionCards('verglasung', opts);
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

    markise: {
      title: 'Mehr Schatten & Komfort?',
      sub: 'Eine Markise hält Ihre Terrasse an heißen Tagen spürbar kühler – perfekt für lange Sommerabende.',
      render: function () {
        return '<p class="aw-group-h">Unsere Empfehlung</p>' +
          optionCards('markise', [
            { value: 'Aufdachmarkise', img: 'markise_auf', photo: true, badge: 'Beliebt', hint: 'Hitzeschutz von oben – hält das Glasdach kühl' },
            { value: 'Unterdachmarkise', img: 'markise_unter', photo: true, badge: 'Empfohlen', hint: 'Sanftes, blendfreies Licht – elegant integriert' }
          ]) +
          '<p class="aw-group-h aw-group-h--sep">Weitere Sonnenschutz-Varianten</p>' +
          optionCards('markise', [
            { value: 'Plissees', img: 'plissee', photo: true, hint: 'Faltbar, moderne Optik' },
            { value: 'Sonnensegel', img: 'sonnensegel', photo: true, hint: 'Leichter, textiler Schattenspender' },
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
          '</div>';
      },
      collect: function () {}, // Auswahl wird direkt beim Klick gesetzt
      valid: function () { return null; } // optional
    },

    led: {
      title: 'Licht & Sound?',
      sub: 'Dezent ins Dachprofil integriert – für stimmungsvolle Abende auf der Terrasse.',
      render: function () {
        // LED-Spots
        var html = '<p class="aw-group-h">LED-Spots</p>' +
          optionCards('led', [
            { value: 'Ja, mit LED-Spots', img: 'led', photo: true, badge: 'Beliebt', hint: 'Warmes Licht, unsichtbar integriert' },
            { value: 'Nein, ohne Beleuchtung', icon: I.aus, iconBig: true }
          ]);
        if (hasLed(answers.led)) {
          html += '<div class="aw-subchoice"><p class="aw-group-h">Wie viele Spots?</p><div class="aw-pills">' +
            pill('ledset', '6er-Set') + pill('ledset', '8er-Set') + pill('ledset', '12er-Set') +
            '<span class="aw-pill-input"><input type="number" inputmode="numeric" min="2" max="98" step="2" id="ledCustom" placeholder="Anzahl" value="' + esc(ledCustomVal()) + '"><span>Spots</span></span>' +
            '</div><p class="aw-note">Freie Eingabe: nur gerade Anzahl (z. B. 6, 8, 10 …).</p></div>';
        }
        // Lautsprecher
        html += '<p class="aw-group-h aw-group-h--sep">Lautsprecher</p>' +
          optionCards('sound', [
            { value: 'Ja, mit Lautsprechern', img: 'lautsprecher', photo: true, hint: 'Musik direkt aus dem Dachprofil' },
            { value: 'Nein, ohne Lautsprecher', icon: I.aus, iconBig: true }
          ]);
        if (isJa(answers.sound)) {
          html += '<div class="aw-subchoice"><p class="aw-group-h">Wie viele Lautsprecher?</p><div class="aw-pills">' +
            pill('soundset', '2er-Set') + pill('soundset', '4er-Set') +
            '</div></div>';
        }
        return html;
      },
      valid: function () {
        if (!answers.led) return 'Bitte wählen Sie, ob Sie LED-Spots wünschen.';
        if (hasLed(answers.led)) {
          if (!answers.ledset) return 'Bitte wählen Sie die Anzahl der Spots.';
          var m = /^(\d+) Spots$/.exec(answers.ledset);
          if (m && parseInt(m[1], 10) % 2 !== 0) return 'Bitte eine gerade Anzahl Spots angeben (z. B. 6, 8, 12 …).';
        }
        if (!answers.sound) return 'Bitte wählen Sie, ob Sie Lautsprecher wünschen.';
        if (isJa(answers.sound) && !answers.soundset) return 'Bitte wählen Sie die Anzahl der Lautsprecher.';
        return null;
      }
    },

    wunsch: {
      title: 'Was können wir für Sie tun?',
      render: function () {
        return '<textarea class="aw-textarea" id="awWunsch" placeholder="Beschreiben Sie Ihr Vorhaben – z. B. Sonnenschutz, Geländer, Sichtschutz, Reparatur …">' + esc(answers.wunsch || '') + '</textarea>';
      },
      collect: function () { answers.wunsch = (document.getElementById('awWunsch') || {}).value || ''; },
      valid: function () {
        this.collect();
        return answers.wunsch.trim() ? null : 'Bitte beschreiben Sie kurz Ihr Anliegen.';
      }
    },

    kontakt: {
      title: 'Ihre Kontaktdaten',
      sub: 'Damit wir Ihnen Ihr persönliches Angebot zusenden können',
      render: function () {
        return '<div class="aw-contact">' +
          '<div class="aw-row">' +
          txtField('k_vorname', 'Vorname *', answers.k_vorname, 'Max', 'given-name') +
          txtField('k_nachname', 'Nachname', answers.k_nachname, 'Mustermann', 'family-name') +
          '</div>' +
          txtField('k_email', 'E-Mail *', answers.k_email, 'max@beispiel.de', 'email', 'email') +
          txtField('k_telefon', 'Telefon / WhatsApp', answers.k_telefon, '0156 …', 'tel', 'tel') +
          '<label class="aw-consent"><input type="checkbox" id="k_consent"' + (answers.k_consent ? ' checked' : '') + '> ' +
          '<span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Daten einverstanden. *</span></label>' +
          '</div>';
      },
      collect: function () {
        answers.k_vorname = val('k_vorname');
        answers.k_nachname = val('k_nachname');
        answers.k_email = val('k_email');
        answers.k_telefon = val('k_telefon');
        var c = document.getElementById('k_consent');
        answers.k_consent = c ? c.checked : false;
      },
      valid: function () {
        this.collect();
        if (!answers.k_vorname.trim()) return 'Bitte geben Sie Ihren Vornamen an.';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(answers.k_email.trim())) return 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
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
  // Freie Spot-Anzahl (z. B. „10 Spots") → Ziffer für das Eingabefeld
  function ledCustomVal() {
    var m = /^(\d+) Spots$/.exec(answers.ledset || '');
    return m ? m[1] : '';
  }
  function ddThumb(value, zoomable) {
    var o = erwOpt(value);
    if (o && o.img) {
      var zoom = zoomable ? ' data-zoom="' + o.img + '" data-zoom-label="' + esc(value) + '"' : '';
      var lupe = zoomable ? '<span class="aw-dd-zoom">' + svg(I.lupe) + '</span>' : '';
      return '<span class="aw-dd-thumb"' + zoom + '><img src="images/wizard/erw_' + o.img + '.webp?v=' + ASSET_VER + '" alt="" loading="lazy">' + lupe + '</span>';
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
  function dimField(id, label, ph, unit) {
    return '<div class="aw-dim"><label for="aw_' + id + '">' + label + '</label>' +
      '<div class="aw-dim-in"><input type="number" inputmode="numeric" min="0" id="aw_' + id + '" value="' + esc(answers[id] || '') + '" placeholder="' + ph + '"><span>' + (unit || 'mm') + '</span></div></div>';
  }
  function txtField(id, label, v, ph, type, ac) {
    return '<div class="aw-field"><label for="' + id + '">' + label + '</label>' +
      '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(v || '') + '" placeholder="' + ph + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + '></div>';
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  function collectMasse() {
    ['breite', 'tiefe', 'hoehe', 'vorsprung'].forEach(function (k) {
      var e = document.getElementById('aw_' + k);
      if (e) answers[k] = e.value.trim();
    });
  }

  /* ---------- Zusammenfassung ---------- */
  function summaryPairs() {
    var p = [];
    p.push(['Produkt', answers.produkt]);
    if (answers.aufbau) p.push(['Aufbau', answers.aufbau]);
    if (answers.fassade) p.push(['Fassade', answers.fassade + (answers.fassade_text ? ' – ' + answers.fassade_text : '')]);
    var masse = [answers.breite, answers.tiefe, answers.hoehe].filter(Boolean);
    if (masse.length) p.push(['Maße (B×T×H)', (answers.breite || '?') + ' × ' + (answers.tiefe || '?') + ' × ' + (answers.hoehe || '?') + ' cm']);
    if (answers.vorsprung) p.push(['Dachvorsprung', answers.vorsprung + ' cm']);
    if (answers.verglasung) p.push(['Eindeckung', answers.verglasung + (isGlas(answers.verglasung) && answers.glasstaerke ? ' · ' + answers.glasstaerke : '')]);
    if (answers.markise && answers.markise !== 'Keine Markise') p.push(['Sonnenschutz', answers.markise]);
    [['erw_links', 'Erweiterung links'], ['erw_rechts', 'Erweiterung rechts'], ['erw_vorne', 'Erweiterung vorne']].forEach(function (e) {
      var v = answers[e[0]];
      if (v && v.length) p.push([e[1], v.join(', ')]);
    });
    if (answers.led) p.push(['LED-Beleuchtung', hasLed(answers.led) ? answers.ledset : 'Nein']);
    if (answers.sound) p.push(['Lautsprecher', isJa(answers.sound) ? answers.soundset : 'Nein']);
    if (answers.extras && answers.extras.length) p.push(['Extras', answers.extras.join(', ')]);
    if (answers.wunsch) p.push(['Wunsch', answers.wunsch]);
    var name = [answers.k_vorname, answers.k_nachname].filter(Boolean).join(' ');
    if (name) p.push(['Name', name]);
    if (answers.k_email) p.push(['E-Mail', answers.k_email]);
    if (answers.k_telefon) p.push(['Telefon', answers.k_telefon]);
    return p;
  }
  function summaryRows() {
    return summaryPairs().map(function (r) {
      return '<div class="aw-sum-row"><span class="aw-sum-k">' + esc(r[0]) + '</span><span class="aw-sum-v">' + esc(r[1]) + '</span></div>';
    }).join('');
  }
  function summaryText() {
    return 'Anfrage-Nr: ' + ref + '\n' + summaryPairs().map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
  }

  /* ---------- Rendering & Navigation ---------- */
  function currentId() { return flow[idx]; }

  function render() {
    var step = STEPS[currentId()];
    document.getElementById('awTitle').textContent = step.title;
    subEl.textContent = step.sub || 'Anfrage-Nr. ' + ref;
    subEl.style.display = '';
    bodyEl.innerHTML = step.render();
    bodyEl.scrollTop = 0;

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
      '<img src="images/wizard/erw_' + imgSlug + '.webp?v=' + ASSET_VER + '" alt="' + esc(label) + '">' +
      '<p>' + esc(label) + '</p>' +
      '<button type="button" class="aw-lightbox-close" aria-label="Schließen">✕</button></div>';
    function close() { if (lb.parentNode) lb.parentNode.removeChild(lb); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    lb.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
  }

  function bindStep() {
    // Option-Karten (Einfachauswahl)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-option'), function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-field');
        answers[f] = btn.getAttribute('data-value');
        Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-option[data-field="' + f + '"]'), function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        clearError();
        // Produkt-Auswahl aktualisiert den Ablauf sofort
        if (f === 'produkt') flow = computeFlow();
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
        if (f === 'ledset') { var lc = bodyEl.querySelector('#ledCustom'); if (lc) lc.value = ''; } // freie Eingabe zurücksetzen
        clearError();
      });
    });
    // Freie Spot-Anzahl
    var ledCustom = bodyEl.querySelector('#ledCustom');
    if (ledCustom) {
      ledCustom.addEventListener('input', function () {
        var v = ledCustom.value.replace(/[^0-9]/g, '').slice(0, 2);
        ledCustom.value = v;
        if (v) {
          answers.ledset = v + ' Spots';
          Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-pill[data-pill="ledset"]'), function (b) { b.classList.remove('is-active'); });
        } else {
          answers.ledset = '';
        }
        clearError();
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

    if (id === 'produkt') flow = computeFlow();

    if (id === 'summary') { submit(); return; }

    if (idx < flow.length - 1) { idx++; render(); }
  }

  function goBack() {
    if (currentId() === 'masse') collectMasse();
    if (currentId() === 'erweiterungen') STEPS.erweiterungen.collect();
    if (currentId() === 'fassade') STEPS.fassade.collect();
    if (idx > 0) { idx--; render(); }
  }

  /* ---------- Absenden ---------- */
  function submit() {
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = 'Wird gesendet …';

    var fd = new FormData();
    fd.append('_subject', 'Anfrage ' + ref + ': ' + (answers.produkt || '') + ' – ' + [answers.k_vorname, answers.k_nachname].filter(Boolean).join(' '));
    fd.append('_replyto', answers.k_email || '');
    fd.append('_gotcha', '');
    fd.append('Anfrage-Nr', ref);
    summaryPairs().forEach(function (r) { fd.append(r[0], r[1]); });
    fd.append('Zusammenfassung', summaryText());

    fetch(FORMSPREE, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error('nok');
        showSuccess();
      })
      .catch(function () {
        nextBtn.disabled = false;
        backBtn.disabled = false;
        nextBtn.textContent = 'Erneut senden';
        showError('Senden fehlgeschlagen. Bitte rufen Sie uns direkt an: 015678696609');
      });
  }

  function showSuccess() {
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

  /* ---------- Start ---------- */
  nextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', goBack);
  render();
})();
