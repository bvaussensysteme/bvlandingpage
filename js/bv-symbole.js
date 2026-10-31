/* ---------- Eigene Symbolsammlung ----------
   „benutz bitte keine imogis das is nicht serioes benutz eigene
   logosammlung" (Betreiber, 31.10.2026, mit Bildschirmfoto vom iPhone).

   WARUM DAS NOETIG IST. Emoji sind nicht Teil unserer Gestaltung: Sie
   sehen auf jedem Geraet anders aus (Apple, Android und Windows liefern
   eigene Zeichnungen), sie nehmen unsere Farben nicht an, und sie wirken
   neben einer Angebotsanfrage wie eine Chatnachricht. Dazu kommt: Auch
   harmlose Schriftzeichen wie ↗ ↔ ☾ ⟳ stellt iOS von sich aus als
   farbiges Emoji dar - auf dem Entwicklungsrechner sieht es richtig aus,
   am Handy nicht.

   WIE ES GELOEST IST. Jedes Symbol ist ein eigener Pfad, 24 x 24, nur
   Striche in currentColor. Es nimmt damit Farbe und Groesse der Schrift
   an, in der es steht. Keine fremde Sammlung, kein fremder Pfad, keine
   nachgeladene Datei - siehe CLAUDE.md, „Nachbauten".

   WARUM DIE PFADE HIER EINGESETZT WERDEN und nicht ueber ein Sprite mit
   <use>: Ein <use> braucht sein <symbol> VOR sich im Dokument. Diese
   Datei laeuft mit "defer" zusammen mit allen anderen; wer sich auf die
   Reihenfolge verlaesst, bekommt irgendwann ein leeres Kaestchen. Der
   eingesetzte Pfad ist immer vollstaendig.

   Der 3D-Konfigurator hat seine eigene Sammlung als Sprite direkt in
   konfigurator.html - dort stehen die Symbole schon im HTML und muessen
   ohne Javascript dastehen. Geprueft werden beide von
   scripts/pruefe-symbole.js.                                            */
(function () {
  'use strict';

  var PFADE = {
    kekse: '<circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="9.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11" r=".9" fill="currentColor" stroke="none"/><circle cx="10.5" cy="15" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="15.5" r=".9" fill="currentColor" stroke="none"/>',
    geschenk: '<path d="M4 10.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M3 7.5h18v3H3z"/><path d="M12 7.5V21"/><path d="M12 7.5S10.5 3 8 3a2.2 2.2 0 0 0 0 4.5z"/><path d="M12 7.5S13.5 3 16 3a2.2 2.2 0 0 1 0 4.5z"/>',
    haken: '<path d="M5 12.5l4.6 4.6L19 7.3"/>',
    kreuz: '<path d="M6.5 6.5l11 11"/><path d="M17.5 6.5l-11 11"/>',
    ort: '<path d="M12 21.5s6.5-6.3 6.5-11a6.5 6.5 0 1 0-13 0c0 4.7 6.5 11 6.5 11z"/><circle cx="12" cy="10.3" r="2.4"/>',
    lupe: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    pause: '<path d="M9 5.5v13"/><path d="M15 5.5v13"/>',
    abspielen: '<path d="M7.5 5l11 7-11 7z"/>',
    zuruecksetzen: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V9h4.5"/>',
    zahnrad: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/>'
  };

  /* Gibt das fertige Symbol als HTML zurueck. Unbekannter Name liefert
     eine leere Zeichenkette statt eines Platzhalters: Lieber nichts als
     ein falsches Bild neben einem Preis oder einer Anfrage. */
  function bvSymbol(name, zusatzKlasse) {
    var d = PFADE[name];
    if (!d) return '';
    return '<svg class="bvs' + (zusatzKlasse ? ' ' + zusatzKlasse : '') +
           '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  window.bvSymbol = bvSymbol;
  window.BV_SYMBOLE = PFADE;
})();
