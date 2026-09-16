/* ============================================================
   Konfigurator-Widget – schwebender Button, der den Anfrage-
   Assistenten öffnet. Ersetzt den früheren KI-Chat-Assistenten.

   Auf jeder Seite öffnet der Button ein Panel mit dem Assistenten.
   Die Umsetzung unterscheidet sich nur darin, woher der Assistent
   kommt:

   1) Seiten OHNE eigenen Assistenten: Dieses Skript baut die Hülle
      direkt ins Panel. anfrage-wizard.js läuft danach und findet
      sie über die IDs #awTitle, #awBody usw.

   2) Startseite: Dort steht der Assistent bereits fest im
      Kontaktbereich. Ein zweites Exemplar im Panel hätte doppelte
      IDs zur Folge und anfrage-wizard.js würde nur noch das erste
      bedienen. Deshalb wird beim Öffnen der vorhandene Assistent
      per DOM-Verschiebung ins Panel geholt und beim Schließen an
      seinen Platz zurückgesetzt. Ein Platzhalter gleicher Höhe
      hält solange das Layout des Kontaktbereichs stabil und
      übernimmt vorübergehend die id="kontakt", damit Sprungmarken
      wie /#kontakt weiter funktionieren.
      Angenehmer Nebeneffekt: Der Bearbeitungsstand bleibt beim
      Wechsel zwischen Panel und Seite vollständig erhalten.

   Deshalb MUSS dieses Skript vor anfrage-wizard.js eingebunden
   sein. Beide mit "defer", die Reihenfolge im HTML entscheidet.
   ============================================================ */
(function () {
  'use strict';

  var MOBILE = '(max-width: 600px)';

  // Schieberegler-Symbol: steht für "einstellen/konfigurieren"
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="4" y1="7" x2="20" y2="7"/><circle cx="15" cy="7" r="2.4"/>' +
    '<line x1="4" y1="12" x2="20" y2="12"/><circle cx="9" cy="12" r="2.4"/>' +
    '<line x1="4" y1="17" x2="20" y2="17"/><circle cx="16" cy="17" r="2.4"/>' +
    '</svg>';

  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/>' +
    '<line x1="18" y1="6" x2="6" y2="18"/></svg>';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Hülle mit exakt den IDs, die anfrage-wizard.js erwartet
  function wizardShell() {
    return '<div class="anfrage-wizard anfrage-wizard--panel" aria-label="Anfrage-Assistent">' +
      '<div class="aw-head">' +
        '<h3 id="awTitle">Kostenlose Anfrage</h3>' +
        '<p class="aw-sub" id="awSub">In wenigen Schritten zu Ihrem individuellen Angebot</p>' +
        '<div class="aw-progress" aria-hidden="true"><div class="aw-progress-bar" id="awProgressBar"></div></div>' +
      '</div>' +
      '<div class="aw-body" id="awBody"></div>' +
      '<div class="aw-nav" id="awNav">' +
        '<button type="button" class="aw-btn aw-btn--back" id="awBack">← Zurück</button>' +
        '<button type="button" class="aw-btn aw-btn--next" id="awNext">Weiter →</button>' +
      '</div>' +
    '</div>';
  }

  var inlineWizard = document.querySelector('.anfrage-wizard');
  var bubble, overlay, panel, closeBtn, lastFocus = null, isOpen = false;

  /* ---------- Aufbau ---------- */
  bubble = el('button', {
    id: 'bvKonfigBubble',
    type: 'button',
    title: 'Konfigurator öffnen',
    'aria-label': 'Konfigurator öffnen – Anfrage in wenigen Schritten'
  }, ICON);

  bubble.setAttribute('aria-expanded', 'false');
  bubble.setAttribute('aria-controls', 'bvKonfigPanel');

  overlay = el('div', { id: 'bvKonfigOverlay', hidden: 'hidden' });
  panel = el('div', {
    id: 'bvKonfigPanel',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'awTitle'
  }, inlineWizard ? '' : wizardShell());

  closeBtn = el('button', { id: 'bvKonfigClose', type: 'button', 'aria-label': 'Konfigurator schließen' }, CLOSE_ICON);
  panel.appendChild(closeBtn);

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  document.body.appendChild(bubble);

  /* ---------- Assistent zwischen Seite und Panel bewegen ---------- */
  var platzhalter = null;

  function inPanelHolen() {
    if (!inlineWizard || platzhalter) return;
    platzhalter = document.createElement('div');
    platzhalter.setAttribute('data-bv-platzhalter', '');
    // Höhe einfrieren, damit der Kontaktbereich nicht zusammenklappt
    platzhalter.style.height = inlineWizard.offsetHeight + 'px';
    // Sprungmarke mitnehmen, sonst zeigt /#kontakt ins Leere
    if (inlineWizard.id) { platzhalter.id = inlineWizard.id; inlineWizard.removeAttribute('id'); }
    inlineWizard.parentNode.insertBefore(platzhalter, inlineWizard);
    inlineWizard.classList.add('anfrage-wizard--panel');
    panel.insertBefore(inlineWizard, panel.firstChild);
  }

  function zurueckSetzen() {
    if (!inlineWizard || !platzhalter) return;
    inlineWizard.classList.remove('anfrage-wizard--panel');
    if (platzhalter.id) { inlineWizard.id = platzhalter.id; }
    platzhalter.parentNode.insertBefore(inlineWizard, platzhalter);
    platzhalter.remove();
    platzhalter = null;
  }

  /* ---------- Hintergrund festhalten ----------
     body { overflow: hidden } reicht auf iOS Safari nicht: die Seite hinter
     dem Sheet scrollt trotzdem mit. Der Body wird deshalb fixiert und um die
     aktuelle Scrollposition nach oben versetzt, sodass optisch nichts springt.
     Beim Schliessen wird beides zurueckgenommen. */
  var scrollStand = 0;
  var gesperrt = false;

  // Nur das Sheet auf dem Handy haelt die Seite fest. Auf dem Desktop schwebt
  // das Fenster und die Seite dahinter darf wie bisher scrollen.
  function istSheet() {
    return !window.matchMedia || window.matchMedia(MOBILE).matches;
  }

  function seiteSperren() {
    // Die Klasse blendet auch die uebrigen Schwebe-Buttons aus, sie wird
    // deshalb immer gesetzt - unabhaengig vom Festhalten der Seite.
    gesperrt = istSheet();
    if (gesperrt) {
      scrollStand = window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.style.top = (-scrollStand) + 'px';
    }
    document.body.classList.add('bv-konfig-open');
  }

  function seiteFreigeben() {
    if (!document.body.classList.contains('bv-konfig-open')) return;
    document.body.classList.remove('bv-konfig-open');
    document.body.style.top = '';
    if (!gesperrt) return;   // Desktop: nichts zurueckzusetzen
    gesperrt = false;
    // Ohne 'auto' wuerde das globale scroll-behavior: smooth die Rueckkehr
    // sichtbar animieren.
    var wurzel = document.documentElement;
    var vorher = wurzel.style.scrollBehavior;
    wurzel.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollStand);
    wurzel.style.scrollBehavior = vorher;
  }

  /* ---------- Öffnen / Schließen ---------- */
  function focusables() {
    return Array.prototype.filter.call(
      panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null && !n.disabled; }
    );
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    inPanelHolen();
    overlay.removeAttribute('hidden');
    // Erst im nächsten Frame die Klasse setzen, sonst spielt die Animation nicht
    requestAnimationFrame(function () {
      overlay.classList.add('open');
      panel.classList.add('open');
    });
    seiteSperren();
    bubble.setAttribute('aria-expanded', 'true');
    var f = focusables();
    (f.length ? f[0] : panel).focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    panel.classList.remove('open');
    seiteFreigeben();
    bubble.setAttribute('aria-expanded', 'false');
    // Overlay erst nach der Animation aus dem Zugriff nehmen
    // Erst nach der Schliess-Animation zuruecksetzen, sonst springt der Inhalt
    setTimeout(function () {
      if (isOpen) return;
      overlay.setAttribute('hidden', 'hidden');
      zurueckSetzen();
    }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Verhalten ---------- */
  bubble.addEventListener('click', function () { isOpen ? close() : open(); });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    // Fokus im Dialog halten
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Nach Abschluss der Anfrage automatisch schliessen waere unhoeflich –
  // der Nutzer soll die Bestaetigung und die Foto-Hinweise lesen koennen.
})();
