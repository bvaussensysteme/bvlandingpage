/* ============================================================
   Werkstatt: Bildpfade aus dem Projektstamm laden

   Die Werkstatt (/werkstatt/) liegt eine Ebene tiefer als die
   Konfiguratorseite. konfigurator-3d.js laedt seine Texturen mit
   relativen Pfaden ('images/textur/putz.webp'), die von dort auf
   /werkstatt/images/... zeigen und ins Leere laufen. Gemessen am
   31.10.2026: acht fehlende Dateien, darunter Wandputz, Rasen,
   Steinplatten und das Bodenlogo. Genau deshalb sah die Werkstatt
   anders aus als die echte Seite.

   Warum eine eigene Datei und kein Schnipsel in der Seite:
   three.min.js wird mit `defer` geladen. Ein eingebettetes Skript
   laeuft waehrend des Einlesens und damit VOR three.js - dort gibt es
   noch kein THREE, und das Umbiegen liefe wirkungslos durch. Genau das
   ist beim ersten Versuch passiert. Aufgeschobene Dateien laufen in
   der Reihenfolge, in der sie in der Seite stehen: three.js, diese
   Datei, dann der Konfigurator.

   Warum kein <base href="/">: Das wuerde auch jede Sprungmarke (#...)
   auf die Startseite umbiegen.

   Diese Datei wird NUR von der Werkstatt eingebunden
   (scripts/baue-werkstatt.js). Auf der oeffentlichen Seite aendert
   sich nichts.
   ============================================================ */
(function () {
  if (!window.THREE || !window.THREE.DefaultLoadingManager) {
    if (window.console) console.warn('[Werkstatt] THREE fehlt – Bildpfade bleiben relativ.');
    return;
  }
  window.THREE.DefaultLoadingManager.setURLModifier(function (u) {
    var s = String(u);
    if (/^(https?:|\/|data:|blob:)/.test(s)) return s;
    return '/' + s.replace(/^\.\//, '');
  });
})();
