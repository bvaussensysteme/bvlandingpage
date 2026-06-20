/* ============================================
   BV AussenSysteme – Cookie Consent
   ============================================ */
(function () {
  'use strict';

  var COOKIE_KEY  = 'bv_cookie_consent';
  var COOKIE_DAYS = 365;

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(name) {
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(name + '=') === 0) return c.substring(name.length + 1);
    }
    return null;
  }

  function hideBanner() {
    var b = document.getElementById('cookieBanner');
    if (!b) return;
    b.classList.remove('cb-visible');
    setTimeout(function () { b.style.display = 'none'; }, 400);
  }

  function showBanner(openDetails) {
    var b = document.getElementById('cookieBanner');
    if (!b) return;
    b.style.display = 'flex';
    // Force reflow so transition fires
    b.offsetHeight;
    b.classList.add('cb-visible');
    if (openDetails) {
      var d = document.getElementById('cookieDetails');
      if (d) d.style.display = 'block';
    }
  }

  window.openCookieSettings = function () { showBanner(true); };

  window.acceptAll = function () {
    setCookie(COOKIE_KEY, 'all', COOKIE_DAYS);
    hideBanner();
  };
  window.acceptNecessary = function () {
    setCookie(COOKIE_KEY, 'necessary', COOKIE_DAYS);
    hideBanner();
  };
  window.rejectAll = function () {
    setCookie(COOKIE_KEY, 'rejected', COOKIE_DAYS);
    hideBanner();
  };
  window.showCookieDetails = function () {
    var d = document.getElementById('cookieDetails');
    if (d) d.style.display = (d.style.display === 'none' || d.style.display === '') ? 'block' : 'none';
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (getCookie(COOKIE_KEY)) return;

    var banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Cookie-Einstellungen');
    banner.style.display = 'none';
    banner.innerHTML =
      '<div class="cb-inner">' +
        '<div class="cb-top">' +
          '<div class="cb-icon">🍪</div>' +
          '<div class="cb-text">' +
            '<strong>Wir verwenden Cookies</strong>' +
            '<p>Wir nutzen Cookies und ähnliche Technologien, um unsere Website zu betreiben. ' +
            'Einige sind technisch notwendig, andere helfen uns, Dienste wie Google Fonts ' +
            'oder Trustindex bereitzustellen.</p>' +
          '</div>' +
        '</div>' +
        '<div class="cb-details" id="cookieDetails" style="display:none;">' +
          '<div class="cb-detail-row">' +
            '<span class="cb-badge cb-badge--required">Immer aktiv</span>' +
            '<strong>Notwendige Cookies</strong>' +
            '<p>Grundlegende Funktionen der Website (z.B. Cookie-Einstellungen speichern).</p>' +
          '</div>' +
          '<div class="cb-detail-row">' +
            '<label class="cb-toggle-label">' +
              '<input type="checkbox" id="cbAnalytics" />' +
              '<span class="cb-toggle-slider"></span>' +
              '<strong>Analyse & Statistik</strong>' +
            '</label>' +
            '<p>Helfen uns zu verstehen, wie Besucher die Website nutzen.</p>' +
          '</div>' +
          '<div class="cb-detail-row">' +
            '<label class="cb-toggle-label">' +
              '<input type="checkbox" id="cbExternal" checked />' +
              '<span class="cb-toggle-slider"></span>' +
              '<strong>Externe Dienste</strong>' +
            '</label>' +
            '<p>Google Fonts, Trustindex, sipgate AI Flow. Details in unserer ' +
            '<a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
          '</div>' +
        '</div>' +
        '<div class="cb-actions">' +
          '<button class="cb-btn cb-btn--reject"    onclick="rejectAll()">Ablehnen</button>' +
          '<button class="cb-btn cb-btn--details"   onclick="showCookieDetails()">Einstellungen ▾</button>' +
          '<button class="cb-btn cb-btn--necessary" onclick="acceptNecessary()">Nur notwendige</button>' +
          '<button class="cb-btn cb-btn--accept"    onclick="acceptAll()">Alle akzeptieren</button>' +
        '</div>' +
        '<div class="cb-links">' +
          '<a href="datenschutz.html">Datenschutz</a>' +
          '<span>·</span>' +
          '<a href="impressum.html">Impressum</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    setTimeout(function () { showBanner(false); }, 800);
  });
})();
