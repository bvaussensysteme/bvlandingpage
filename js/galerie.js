/* ============================================================
   AUSFUEHRUNGSBEISPIELE: Grossansicht

   Der Bilderstreifen steht fest in der Seite (siehe
   src/_includes/galerie.njk). Dieses Skript ergaenzt nur die
   Grossansicht. Faellt es aus, bleibt der Streifen bedienbar - er
   laesst sich waagerecht wischen, und jedes Bild ist zu sehen.

   WCAG 2.2, was hier dranhaengt:
   - 2.1.2 Keine Tastaturfalle: Tab laeuft im Fenster im Kreis.
   - 2.4.3 Fokus-Reihenfolge: Beim Oeffnen geht der Fokus ins
     Fenster, beim Schliessen zurueck auf die Kachel, von der aus
     geoeffnet wurde.
   - 1.4.13: Escape schliesst.
   - 2.5.8: Alle Schaltflaechen mindestens 44 x 44 px.
   - prefers-reduced-motion: ohne Einblenden.
   ============================================================ */
(function () {
  'use strict';
  var streifen = document.querySelectorAll('.galerie-streifen[data-galerie]');
  if (!streifen.length) return;

  var fenster = null, bildEl = null, textEl = null, zaehlerEl = null;
  var aktuelleListe = [], aktuellerIndex = 0, rueckkehr = null;

  function bauen() {
    if (fenster) return;
    fenster = document.createElement('div');
    fenster.className = 'galerie-gross';
    fenster.hidden = true;
    fenster.setAttribute('role', 'dialog');
    fenster.setAttribute('aria-modal', 'true');
    fenster.setAttribute('aria-label', 'Große Ansicht');
    fenster.innerHTML =
      '<div class="gg-huelle">' +
        '<button type="button" class="gg-knopf gg-zu" aria-label="Große Ansicht schließen">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<button type="button" class="gg-knopf gg-zurueck" aria-label="Vorheriges Bild">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
        '</button>' +
        '<figure class="gg-figur">' +
          '<img class="gg-bild" alt="">' +
          /* aria-live: Beim Blaettern bleibt der Fokus auf dem Pfeil,
             nur Bild und Text wechseln. Ohne Live-Bereich erfaehrt ein
             Screenreader davon nichts (WCAG 2.2, 4.1.3). */
          '<figcaption class="gg-text" aria-live="polite" aria-atomic="true">' +
          '<span class="gg-beschriftung"></span>' +
          '<span class="gg-zaehler"></span></figcaption>' +
        '</figure>' +
        '<button type="button" class="gg-knopf gg-vor" aria-label="Nächstes Bild">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(fenster);
    bildEl = fenster.querySelector('.gg-bild');
    textEl = fenster.querySelector('.gg-beschriftung');
    zaehlerEl = fenster.querySelector('.gg-zaehler');

    fenster.querySelector('.gg-zu').addEventListener('click', schliessen);
    fenster.querySelector('.gg-zurueck').addEventListener('click', function () { springen(-1); });
    fenster.querySelector('.gg-vor').addEventListener('click', function () { springen(1); });
    /* NUR der dunkle Grund schliesst, NICHT die Huelle. Die Huelle
       liegt auch in den 8 px zwischen "Zurueck" und "Weiter"; ein
       knapp danebengesetzter Daumen schloss damit die Ansicht,
       statt zu blaettern. Befund vom 19.11.2026. */
    fenster.addEventListener('click', function (e) {
      if (e.target === fenster) schliessen();
    });
    /* AM DOKUMENT UND NICHT AM FENSTER. Nach einer Wischgeste liegt
       der Fokus wieder auf <body>; ein Hoerer am Fenster bekommt die
       Taste dann nicht mehr, und Escape schloss nicht mehr. Gemessen
       am 19.11.2026: offen blieb offen. */
    document.addEventListener('keydown', function (e) {
      if (!fenster || fenster.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); schliessen(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); springen(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); springen(1); return; }
      if (e.key !== 'Tab') return;
      /* Tastaturschleife: Der Fokus verlaesst das Fenster nicht. */
      var ziele = fenster.querySelectorAll('button:not([disabled])');
      if (!ziele.length) return;
      var erste = ziele[0], letzte = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
      else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
    });
  }

  function zeigen(i) {
    aktuellerIndex = (i + aktuelleListe.length) % aktuelleListe.length;
    var b = aktuelleListe[aktuellerIndex];
    bildEl.src = b.src;
    /* alt bleibt leer: Die Bildunterschrift traegt denselben Text,
       sonst liest ein Screenreader ihn zweimal. */
    bildEl.alt = '';
    textEl.textContent = b.alt;
    zaehlerEl.textContent = ' (' + (aktuellerIndex + 1) + ' von ' + aktuelleListe.length + ')';
    var mehr = aktuelleListe.length > 1;
    fenster.querySelector('.gg-zurueck').hidden = !mehr;
    fenster.querySelector('.gg-vor').hidden = !mehr;
  }

  function springen(d) { zeigen(aktuellerIndex + d); }

  /* Der Rest der Seite wird fuer Hilfsmittel stillgelegt. aria-modal
     allein reicht bei aelteren Screenreadern nicht. */
  function hintergrund(aus) {
    ['main', 'header', 'footer', '.navbar'].forEach(function (w) {
      Array.prototype.forEach.call(document.querySelectorAll(w), function (e) {
        if (aus) e.setAttribute('inert', ''); else e.removeAttribute('inert');
      });
    });
  }

  function oeffnen(liste, i, kachel) {
    bauen();
    aktuelleListe = liste;
    rueckkehr = kachel;
    fenster.hidden = false;
    document.body.classList.add('galerie-offen');
    hintergrund(true);
    zeigen(i);
    fenster.querySelector('.gg-zu').focus();
  }

  function schliessen() {
    if (!fenster || fenster.hidden) return;
    fenster.hidden = true;
    document.body.classList.remove('galerie-offen');
    hintergrund(false);
    bildEl.removeAttribute('src');
    if (rueckkehr) { try { rueckkehr.focus(); } catch (e) {} }
    rueckkehr = null;
  }

  /* WISCHEN IN DER GROSSANSICHT. Am Telefon erwartet man es; ohne
     das muss man den schmalen Pfeil treffen. Nur waagerecht und erst
     ab 45 px, damit ein Antippen nicht versehentlich blaettert. */
  (function () {
    var start = null;
    document.addEventListener('touchstart', function (e) {
      if (!fenster || fenster.hidden || e.touches.length !== 1) return;
      if (!fenster.contains(e.target)) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!start || !fenster || fenster.hidden) { start = null; return; }
      var t = e.changedTouches[0];
      var dx = t.clientX - start.x, dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      springen(dx < 0 ? 1 : -1);
      /* Der Fokus soll im Fenster bleiben, sonst laeuft die naechste
         Tabulatortaste in die stillgelegte Seite dahinter. */
      try { fenster.querySelector('.gg-zu').focus(); } catch (x) {}
    }, { passive: true });
  })();

  Array.prototype.forEach.call(streifen, function (s) {
    var kacheln = s.querySelectorAll('.galerie-kachel');
    var liste = Array.prototype.map.call(kacheln, function (k) {
      var img = k.querySelector('img');
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
    Array.prototype.forEach.call(kacheln, function (k, i) {
      k.addEventListener('click', function () { oeffnen(liste, i, k); });
    });
  });
})();
