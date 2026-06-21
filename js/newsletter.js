/* ============================================
   BV AussenSysteme – Newsletter Popup
   Sendet Rabattcode BVNEWS5 per EmailJS
   Setup: https://www.emailjs.com (kostenlos)
   ============================================ */

(function () {
  'use strict';

  // ── EmailJS Konfiguration ──────────────────
  // 1. Auf emailjs.com registrieren (kostenlos)
  // 2. Service anlegen (Gmail / IONOS SMTP)
  // 3. Template anlegen mit den Variablen unten
  // 4. IDs hier eintragen:
  var EMAILJS_PUBLIC_KEY  = 'DEIN_PUBLIC_KEY';   // Account → API Keys
  var EMAILJS_SERVICE_ID  = 'DEIN_SERVICE_ID';   // Email Services
  var EMAILJS_TEMPLATE_ID = 'DEIN_TEMPLATE_ID';  // Email Templates
  // ──────────────────────────────────────────

  var POPUP_KEY     = 'bv_newsletter_shown';
  var DISMISS_KEY   = 'bv_newsletter_dismissed';
  var DELAY_MS      = 12000; // 12 Sekunden nach Seitenaufruf
  var RABATT_CODE   = 'BVNEWS5';

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

  function closePopup() {
    var p = document.getElementById('nlPopup');
    if (p) {
      p.classList.remove('nl-open');
      setTimeout(function () { p.style.display = 'none'; }, 350);
    }
    setCookie(DISMISS_KEY, '1', 30); // 30 Tage nicht nochmal zeigen
  }

  function sendEmail(email) {
    // EmailJS send
    if (typeof emailjs === 'undefined') {
      console.warn('[Newsletter] EmailJS nicht geladen – bitte API-Keys eintragen');
      return Promise.reject('emailjs_not_loaded');
    }
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:    email,
      rabatt_code: RABATT_CODE,
      firma:       'BV AussenSysteme',
    }, EMAILJS_PUBLIC_KEY);
  }

  function handleSubmit() {
    var input   = document.getElementById('nlEmail');
    var btn     = document.getElementById('nlSubmitBtn');
    var msg     = document.getElementById('nlMsg');
    var email   = input ? input.value.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      msg.style.color = '#e05555';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    msg.textContent = '';

    sendEmail(email)
      .then(function () {
        // Success
        document.getElementById('nlForm').style.display = 'none';
        document.getElementById('nlSuccess').style.display = 'flex';
        setCookie(POPUP_KEY, '1', 365);
      })
      .catch(function (err) {
        console.error('[Newsletter] Fehler:', err);
        if (err === 'emailjs_not_loaded') {
          msg.textContent = '⚙️ E-Mail-Dienst noch nicht konfiguriert (EmailJS API-Key fehlt).';
        } else {
          msg.textContent = 'Fehler beim Senden. Bitte versuche es später erneut.';
        }
        msg.style.color = '#e05555';
        btn.disabled = false;
        btn.textContent = 'Code zusenden →';
      });
  }

  window.closeNewsletterPopup = closePopup;
  window.newsletterSubmit     = handleSubmit;

  document.addEventListener('DOMContentLoaded', function () {
    // Don't show if already subscribed or dismissed
    if (getCookie(POPUP_KEY) || getCookie(DISMISS_KEY)) return;

    // Inject popup HTML
    var popup = document.createElement('div');
    popup.id = 'nlPopup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', 'Newsletter Angebot');
    popup.style.display = 'none';
    popup.innerHTML = `
      <div class="nl-backdrop" onclick="closeNewsletterPopup()"></div>
      <div class="nl-box">
        <button class="nl-close" onclick="closeNewsletterPopup()" aria-label="Schließen">✕</button>

        <div class="nl-badge">Exklusives Angebot</div>
        <div class="nl-icon">🎁</div>
        <h2 class="nl-title">5 % Rabatt auf Ihre Montage</h2>
        <p class="nl-sub">
          Jetzt Newsletter abonnieren und sofort Ihren persönlichen
          Rabattcode per E-Mail erhalten.
        </p>

        <div class="nl-highlight">
          <span class="nl-code-preview">BVNEWS5</span>
          <span class="nl-code-label">Ihr Rabattcode</span>
        </div>

        <div id="nlForm">
          <div class="nl-input-row">
            <input
              type="email"
              id="nlEmail"
              placeholder="ihre@email.de"
              autocomplete="email"
              aria-label="E-Mail-Adresse"
            />
            <button id="nlSubmitBtn" onclick="newsletterSubmit()">
              Code zusenden →
            </button>
          </div>
          <div id="nlMsg" class="nl-msg" aria-live="polite"></div>
          <p class="nl-disclaimer">
            Kein Spam. Jederzeit abmeldbar.
            <a href="datenschutz.html">Datenschutz</a>
          </p>
        </div>

        <div id="nlSuccess" class="nl-success" style="display:none;">
          <span class="nl-success-icon">✅</span>
          <div>
            <strong>Code wurde versendet!</strong>
            <p>Bitte prüfen Sie Ihr Postfach – auch den Spam-Ordner.</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // Show after delay
    setTimeout(function () {
      popup.style.display = 'flex';
      setTimeout(function () { popup.classList.add('nl-open'); }, 30);
    }, DELAY_MS);
  });
})();
