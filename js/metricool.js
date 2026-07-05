/* ============================================
   BV AussenSysteme – Metricool Statistik
   Lädt erst nach Einwilligung in "Analyse & Statistik" (DSGVO)
   ============================================ */
(function () {
  'use strict';

  function hasAnalyticsConsent() {
    try {
      var raw = localStorage.getItem('bv_cookie_consent');
      if (!raw) return false;
      if (raw === 'all') return true;
      if (raw === 'rejected' || raw === 'necessary') return false;
      if (raw.indexOf('custom:') === 0) return raw.indexOf('analytics=1') !== -1;
      return false;
    } catch (e) {
      return false;
    }
  }

  function loadMetricool() {
    if (document.getElementById('mc-tracker')) return;
    var s = document.createElement('script');
    s.id = 'mc-tracker';
    s.type = 'text/javascript';
    s.src = 'https://tracker.metricool.com/resources/be.js';
    var start = function () {
      if (window.beTracker) window.beTracker.t({ hash: '6452141eeb69ebb797db534b6156e95c' });
    };
    s.onreadystatechange = start;
    s.onload = start;
    document.getElementsByTagName('head')[0].appendChild(s);
  }

  if (hasAnalyticsConsent()) loadMetricool();
  window.addEventListener('bv_consent_given', function () {
    if (hasAnalyticsConsent()) loadMetricool();
  });
})();
