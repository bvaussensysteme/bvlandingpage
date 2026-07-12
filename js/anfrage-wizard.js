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
    frage:    '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/>'
  };
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  /* ---------- Ablauf je nach Produkt ---------- */
  function computeFlow() {
    var p = answers.produkt;
    // Terrassendach TDS/SkyView: voller Detailablauf (inkl. Seitenelemente → Wintergarten)
    if (p === 'Terrassendach TDS' || p === 'Flachdach SkyView')
      return ['produkt', 'aufbau', 'fassade', 'masse', 'verglasung', 'extras', 'kontakt', 'summary'];
    // Carport: ohne Fassade/Extras
    if (p === 'Carport')
      return ['produkt', 'aufbau', 'masse', 'verglasung', 'kontakt', 'summary'];
    // Pergola/Lamellendach: ohne Verglasung (Lamellen), mit Extras
    if (p === 'Pergola / Lamellendach')
      return ['produkt', 'aufbau', 'fassade', 'masse', 'extras', 'kontakt', 'summary'];
    if (p === 'Sonstiges')
      return ['produkt', 'wunsch', 'masse', 'kontakt', 'summary'];
    return ['produkt'];
  }

  /* ---------- Wiederverwendbare Bausteine ---------- */
  function optionCards(field, opts) {
    var html = '<div class="aw-options">';
    opts.forEach(function (o) {
      var active = answers[field] === o.value ? ' is-active' : '';
      var media = o.img
        ? '<span class="aw-option-img' + (o.photo ? ' aw-option-img--photo' : '') + '"><img src="images/wizard/wz_' + o.img + '.webp" alt="" loading="lazy"></span>'
        : '<span class="aw-option-ic">' + svg(o.icon) + '</span>';
      html += '<button type="button" class="aw-option' + active + '" data-field="' + field + '" data-value="' + esc(o.value) + '">' +
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
          { value: 'Rauputz', img: 'rauputz' },
          { value: 'Verklinkert', img: 'verklinkert' },
          { value: 'Sonstiges / weiß nicht', icon: I.frage }
        ]);
      },
      valid: function () { return answers.fassade ? null : 'Bitte wählen Sie Ihre Fassade.'; }
    },

    masse: {
      title: 'Gewünschte Maße',
      sub: 'Grobe Angaben genügen – wir messen später vor Ort exakt nach',
      render: function () {
        var opt = answers.produkt === 'Sonstiges';
        return '<div class="aw-dims">' +
          dimField('breite', 'Breite', 'z. B. 4000') +
          dimField('tiefe', 'Tiefe', 'z. B. 3000') +
          dimField('hoehe', 'Höhe', 'z. B. 2500') +
          '</div>' +
          '<p class="aw-note">Angaben in Millimeter (mm).' + (opt ? ' Optional – Sie können auch ohne Maße fortfahren.' : '') + '</p>';
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

    extras: {
      title: 'Möchten Sie Extras? (Mehrfachauswahl)',
      sub: 'Alles optional – einfach anklicken, was Sie interessiert',
      render: function () {
        answers.extras = answers.extras || [];
        var groups = [
          { h: 'Beschattung / Markisen', items: ['Aufdach-Markise', 'Unterdach-Markise', 'Seitenmarkise', 'Stirnseiten-Markise'] },
          { h: 'Seiten & Abschlüsse', items: ['Festelement seitlich', 'Festelement Stirnseite', 'ESG-Glas-Schiebetüren', 'Velaris-Lamellen'] }
        ];
        var html = '';
        groups.forEach(function (g) {
          html += '<p class="aw-group-h">' + g.h + '</p><div class="aw-checks">';
          g.items.forEach(function (it) {
            var on = answers.extras.indexOf(it) !== -1 ? ' is-active' : '';
            html += '<button type="button" class="aw-check' + on + '" data-extra="' + esc(it) + '">' +
              '<span class="aw-check-box">✓</span>' + esc(it) + '</button>';
          });
          html += '</div>';
        });
        return html;
      },
      valid: function () { return null; } // optional
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
  function pill(field, value) {
    var active = answers[field] === value ? ' is-active' : '';
    return '<button type="button" class="aw-pill' + active + '" data-pill="' + field + '" data-value="' + esc(value) + '">' + esc(value) + '</button>';
  }
  function dimField(id, label, ph) {
    return '<div class="aw-dim"><label for="aw_' + id + '">' + label + '</label>' +
      '<div class="aw-dim-in"><input type="number" inputmode="numeric" min="0" id="aw_' + id + '" value="' + esc(answers[id] || '') + '" placeholder="' + ph + '"><span>mm</span></div></div>';
  }
  function txtField(id, label, v, ph, type, ac) {
    return '<div class="aw-field"><label for="' + id + '">' + label + '</label>' +
      '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(v || '') + '" placeholder="' + ph + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + '></div>';
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  function collectMasse() {
    ['breite', 'tiefe', 'hoehe'].forEach(function (k) {
      var e = document.getElementById('aw_' + k);
      if (e) answers[k] = e.value.trim();
    });
  }

  /* ---------- Zusammenfassung ---------- */
  function summaryPairs() {
    var p = [];
    p.push(['Produkt', answers.produkt]);
    if (answers.aufbau) p.push(['Aufbau', answers.aufbau]);
    if (answers.fassade) p.push(['Fassade', answers.fassade]);
    var masse = [answers.breite, answers.tiefe, answers.hoehe].filter(Boolean);
    if (masse.length) p.push(['Maße (B×T×H)', (answers.breite || '?') + ' × ' + (answers.tiefe || '?') + ' × ' + (answers.hoehe || '?') + ' mm']);
    if (answers.verglasung) p.push(['Eindeckung', answers.verglasung + (isGlas(answers.verglasung) && answers.glasstaerke ? ' · ' + answers.glasstaerke : '')]);
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
      });
    });
    // Glasstärke-Pills (Einfachauswahl)
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-pill'), function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-pill');
        answers[f] = btn.getAttribute('data-value');
        Array.prototype.forEach.call(bodyEl.querySelectorAll('.aw-pill[data-pill="' + f + '"]'), function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        clearError();
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
    var step = STEPS[id];
    var err = step.valid ? step.valid() : null;
    if (err) { showError(err); return; }

    if (id === 'produkt') flow = computeFlow();

    if (id === 'summary') { submit(); return; }

    if (idx < flow.length - 1) { idx++; render(); }
  }

  function goBack() {
    if (currentId() === 'masse') collectMasse();
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
