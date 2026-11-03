/* ============================================================
   BV AussenSysteme – eigene Reichweitenmessung (Besucherzahlen)
   ------------------------------------------------------------
   ANLASS. „an welchen Tagen kommen die meisten Besucher? Wo klicken die
   Besucher drauf? Welche Zeit ist ein Besucher wo? Welche Aktion führt
   ein Besucher durch?" (Betreiber, 03.11.2026).

   WAS HIER NICHT PASSIERT – und darauf beruht, dass keine Einwilligung
   nötig ist (§ 25 TDDDG betrifft das Speichern auf dem Gerät und das
   Lesen davon):
     · Es wird NICHTS gespeichert: kein Cookie, kein localStorage, kein
       sessionStorage. Die einzige Ausnahme ist der Abschalter unten –
       den setzt der Betrieb selbst, und zwar um NICHT gezählt zu werden.
     · Es wird nichts gelesen, woraus sich ein Gerät wiedererkennen
       ließe: kein User-Agent, keine Schriftenliste, keine Leinwand.
     · Es gibt kein Kennzeichen für „derselbe Besucher". Gezählt werden
       Aufrufe und Handlungen, keine Personen.
   Die Gegenprobe dazu steht in scripts/pruefe-messung.js: Sie liest
   diese Datei und schlägt an, sobald hier ein Speicherzugriff auftaucht,
   der nicht der Abschalter ist.

   GESENDET WIRD AM ENDE, nicht am Anfang: Erst wenn die Seite verlassen
   oder weggeschaltet wird, geht ein Paket per sendBeacon raus. Ein
   Aufruf am Anfang wüsste die Verweildauer noch nicht, und zwei Aufrufe
   wären zwei Anfragen statt einer.
   ============================================================ */
(function () {
  'use strict';

  var ZIEL = '/api/messung';
  var ABSCHALTER = 'bv_messung_aus';

  /* 1. In der Werkstatt wird nicht gemessen. Dort testet der Betrieb,
        und die eigenen Testaufrufe sollen die Zahlen nicht verfälschen –
        genau der Fehler, der in den Metricool-Zahlen steckt (dort stehen
        56 Aufrufe der Werkstatt). scripts/baue-werkstatt.js nimmt dieses
        Skript dort zusätzlich ganz heraus; beides zusammen, weil ein
        einzelner Schutz irgendwann umgebaut wird. */
  if (location.pathname.indexOf('/werkstatt') === 0) return;

  /* 2. Der Abschalter für den Betrieb selbst: Auf der Zahlenseite in der
        Werkstatt gibt es dafür einen Schalter. Er liegt im localStorage
        des jeweiligen Geräts – ohne ihn würden die eigenen Besuche auf
        der öffentlichen Website weiter mitgezählt. */
  try {
    if (window.localStorage && localStorage.getItem(ABSCHALTER) === '1') return;
  } catch (e) { /* privater Modus: dann eben ohne Abschalter */ }

  if (!navigator.sendBeacon) return;      // ohne sendBeacon lieber gar nicht

  var seite = location.pathname.split('?')[0].split('#')[0];
  if (seite.length > 120) seite = seite.slice(0, 120);

  /* Woher kommt der Besucher? Nur der fremde Gastgebername, nie die
     ganze Adresse (dort stehen Suchbegriffe). Ein Klick innerhalb der
     eigenen Seite ist keine Quelle. */
  function herkunft() {
    try {
      var r = document.referrer;
      if (!r) return 'direkt';
      var h = new URL(r).hostname.replace(/^www\./, '');
      if (h === location.hostname.replace(/^www\./, '')) return null;
      return h.slice(0, 80);
    } catch (e) { return null; }
  }

  /* Handy oder Rechner – aus der Fensterbreite, nicht aus dem
     User-Agent. Die Breite verrät nichts über das Gerät; der
     User-Agent ist ein halber Fingerabdruck. 640 px ist dieselbe
     Grenze, an der die Seite selbst umschaltet. */
  var geraet = (Math.min(window.innerWidth || 0, screen.width || 0) <= 640)
    ? 'handy' : 'rechner';

  var quelle = herkunft();
  var erstes = true;
  var ereignisse = [];
  var sichtbarSeit = (document.visibilityState === 'hidden') ? 0 : Date.now();
  var gesammelt = 0;                      // Sekunden sichtbarer Zeit

  function zeitStoppen() {
    if (!sichtbarSeit) return;
    gesammelt += Math.round((Date.now() - sichtbarSeit) / 1000);
    sichtbarSeit = 0;
  }

  /* Öffentlich, damit der Konfigurator und der Anfrage-Assistent ihre
     eigenen Schritte melden können (js/konfigurator-3d.js,
     js/anfrage-wizard.js). Unbekannte Arten wirft der Worker weg. */
  window.bvMessung = function (art, wert, zusatz) {
    if (!art || ereignisse.length >= 20) return;
    var e = { art: String(art).slice(0, 30) };
    if (wert != null) e.wert = Number(wert) || 0;
    if (zusatz) e.zusatz = String(zusatz).slice(0, 40);
    ereignisse.push(e);
  };

  /* ---------- Klicks: nur was zählt ----------
     Keine Klickkarte, sondern die Handlungen, an denen Geld hängt.
     Gemessen wird in der Erfassungsphase (true), damit ein Klick auch
     dann ankommt, wenn das Ziel das Ereignis selbst abfängt. */
  var KLICKZIELE = [
    ['a[href^="tel:"]', 'telefon'],
    ['a[href*="wa.me"]', 'whatsapp'],
    ['a[href^="mailto:"]', 'mail'],
    ['#bvKonfigBubble', 'anfrage-geoeffnet'],
    /* NICHT der Anfrage-Knopf des Konfigurators: Den meldet
       js/konfigurator-3d.js selbst (anfrageStarten) - es gibt zwei
       Knoepfe dafuer, und hier waere die Haelfte gezaehlt. */
    ['#k3dTeilen', 'konfig-teilen']
  ];
  document.addEventListener('click', function (ev) {
    var ziel = ev.target;
    if (!ziel || !ziel.closest) return;
    for (var i = 0; i < KLICKZIELE.length; i++) {
      if (ziel.closest(KLICKZIELE[i][0])) {
        window.bvMessung(KLICKZIELE[i][1]);
        return;
      }
    }
  }, true);

  /* ---------- Senden ---------- */
  function senden() {
    zeitStoppen();
    var dauer = gesammelt;
    if (!erstes && !ereignisse.length && dauer < 5) return;   // nichts Neues
    var paket = {
      seite: seite,
      geraet: geraet,
      dauer: dauer,
      neu: erstes,
      ereignisse: ereignisse
    };
    if (erstes && quelle) paket.quelle = quelle;
    try {
      navigator.sendBeacon(ZIEL, new Blob([JSON.stringify(paket)],
        { type: 'text/plain;charset=UTF-8' }));
    } catch (e) { /* dann eben nicht */ }
    erstes = false;
    ereignisse = [];
    gesammelt = 0;
  }

  /* pagehide UND visibilitychange: Auf dem iPhone feuert beim Wechseln
     der App oft nur visibilitychange, beim Verlassen der Seite nur
     pagehide. Doppelt gesendet wird nichts – nach dem ersten Paket ist
     der Zähler leer, und ein zweites geht nur mit neuem Inhalt raus. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') senden();
    else if (!sichtbarSeit) sichtbarSeit = Date.now();
  });
  window.addEventListener('pagehide', senden);
})();
