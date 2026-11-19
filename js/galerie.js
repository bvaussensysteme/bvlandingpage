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
          '<figcaption class="gg-text"><span class="gg-beschriftung"></span>' +
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
    /* Klick auf den dunklen Grund schliesst, Klick aufs Bild nicht. */
    fenster.addEventListener('click', function (e) {
      if (e.target === fenster || e.target.classList.contains('gg-huelle')) schliessen();
    });
    fenster.addEventListener('keydown', function (e) {
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
    bildEl.alt = b.alt;
    textEl.textContent = b.alt;
    zaehlerEl.textContent = ' (' + (aktuellerIndex + 1) + ' von ' + aktuelleListe.length + ')';
    var mehr = aktuelleListe.length > 1;
    fenster.querySelector('.gg-zurueck').hidden = !mehr;
    fenster.querySelector('.gg-vor').hidden = !mehr;
  }

  function springen(d) { zeigen(aktuellerIndex + d); }

  function oeffnen(liste, i, kachel) {
    bauen();
    aktuelleListe = liste;
    rueckkehr = kachel;
    fenster.hidden = false;
    document.body.classList.add('galerie-offen');
    zeigen(i);
    fenster.querySelector('.gg-zu').focus();
  }

  function schliessen() {
    if (!fenster || fenster.hidden) return;
    fenster.hidden = true;
    document.body.classList.remove('galerie-offen');
    bildEl.removeAttribute('src');
    if (rueckkehr) { try { rueckkehr.focus(); } catch (e) {} }
    rueckkehr = null;
  }

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
