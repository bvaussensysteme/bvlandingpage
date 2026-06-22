/* ============================================
   BV AussenSysteme – Cookie Consent
   ============================================ */
(function () {
  'use strict';

  var COOKIE_KEY  = 'bv_cookie_consent';
  var COOKIE_DAYS = 365;

  /* ── Helpers – localStorage + Cookie (doppelt abgesichert) ── */
  function setCookie(name, value, days) {
    try {
      // localStorage als primärer Speicher (funktioniert immer)
      localStorage.setItem(name, value);
    } catch(e) {}
    try {
      var d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    } catch(e) {}
  }
  function getCookie(name) {
    // Erst localStorage prüfen
    try {
      var ls = localStorage.getItem(name);
      if (ls) return ls;
    } catch(e) {}
    // Fallback: Browser-Cookie
    try {
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name + '=') === 0)
          return decodeURIComponent(c.substring(name.length + 1));
      }
    } catch(e) {}
    return null;
  }

  /* ── Parse/Serialize consent object ── */
  // Format: "all" | "rejected" | "necessary" | "custom:analytics=0,external=1"
  function parseConsent(raw) {
    if (!raw) return null;
    if (raw === 'all')       return { analytics: true,  external: true  };
    if (raw === 'rejected')  return { analytics: false, external: false };
    if (raw === 'necessary') return { analytics: false, external: false };
    if (raw.indexOf('custom:') === 0) {
      var obj = { analytics: false, external: false };
      raw.replace('custom:', '').split(',').forEach(function(pair) {
        var kv = pair.split('=');
        if (kv.length === 2) obj[kv[0]] = kv[1] === '1';
      });
      return obj;
    }
    return null;
  }
  function serializeCustom(analytics, external) {
    return 'custom:analytics=' + (analytics ? '1' : '0') + ',external=' + (external ? '1' : '0');
  }

  /* ── Banner visibility ── */
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
    b.offsetHeight; // force reflow
    b.classList.add('cb-visible');
    if (openDetails) {
      var d = document.getElementById('cookieDetails');
      if (d) d.style.display = 'block';
      // Load saved toggle states
      var consent = parseConsent(getCookie(COOKIE_KEY));
      if (consent) {
        var cbA = document.getElementById('cbAnalytics');
        var cbE = document.getElementById('cbExternal');
        if (cbA) cbA.checked = consent.analytics;
        if (cbE) cbE.checked = consent.external;
      }
    }
  }

  /* ── Public API ── */
  window.openCookieSettings = function () {
    if (!document.getElementById('cookieBanner')) injectBanner();
    showBanner(true);
  };

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
  window.saveCustomCookies = function () {
    var cbA = document.getElementById('cbAnalytics');
    var cbE = document.getElementById('cbExternal');
    var analytics = cbA ? cbA.checked : false;
    var external  = cbE ? cbE.checked : true;
    setCookie(COOKIE_KEY, serializeCustom(analytics, external), COOKIE_DAYS);
    hideBanner();
  };
  window.showCookieDetails = function () {
    var d = document.getElementById('cookieDetails');
    if (!d) return;
    var open = d.style.display !== 'none' && d.style.display !== '';
    d.style.display = open ? 'none' : 'block';
    // Load saved states when opening
    if (!open) {
      var consent = parseConsent(getCookie(COOKIE_KEY));
      if (consent) {
        var cbA = document.getElementById('cbAnalytics');
        var cbE = document.getElementById('cbExternal');
        if (cbA) cbA.checked = consent.analytics;
        if (cbE) cbE.checked = consent.external;
      }
    }
  };

  /* ── Inject banner HTML ── */
  function injectBanner() {
    if (document.getElementById('cookieBanner')) return;
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
            'Einige sind technisch notwendig, andere helfen uns, Dienste wie Google Fonts bereitzustellen.</p>' +
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
              '<strong>Analyse &amp; Statistik</strong>' +
            '</label>' +
            '<p>Helfen uns zu verstehen, wie Besucher die Website nutzen.</p>' +
          '</div>' +
          '<div class="cb-detail-row">' +
            '<label class="cb-toggle-label">' +
              '<input type="checkbox" id="cbExternal" checked />' +
              '<span class="cb-toggle-slider"></span>' +
              '<strong>Externe Dienste</strong>' +
            '</label>' +
            '<p>Google Fonts, Trustindex. Details in unserer ' +
            '<a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
          '</div>' +
          '<div class="cb-save-row">' +
            '<button class="cb-btn cb-btn--save" onclick="saveCustomCookies()">Auswahl speichern ✓</button>' +
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
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    if (getCookie(COOKIE_KEY)) return; // already decided
    injectBanner();
  });
})();
