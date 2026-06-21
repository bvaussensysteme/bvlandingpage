/* ============================================================
   BV AussenSysteme – Barrierefreiheits-Widget
   Vollständig isoliert – berührt keine anderen Scripts
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'bv_a11y';
  var ROOT = document.documentElement;

  /* ── Einstellungen laden / speichern ── */
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) { return {}; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ── Features definieren ── */
  var state = loadState();

  var features = [
    {
      id: 'fontSize',
      type: 'range',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><text x="2" y="16" font-size="10" font-family="sans-serif" stroke="none" fill="currentColor">A</text><text x="11" y="19" font-size="14" font-family="sans-serif" stroke="none" fill="currentColor">A</text></svg>',
      label: 'Schriftgröße',
      min: -2, max: 4, step: 1,
      default: 0,
      apply: function (val) {
        ROOT.style.fontSize = val === 0 ? '' : (16 + val * 2) + 'px';
      }
    },
    {
      id: 'contrast',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>',
      label: 'Hoher Kontrast',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-high-contrast', val);
      }
    },
    {
      id: 'underlineLinks',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
      label: 'Links unterstreichen',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-underline-links', val);
      }
    },
    {
      id: 'bigCursor',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 2l16 9.5-8.5 1.5L9 21z"/></svg>',
      label: 'Großer Cursor',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-big-cursor', val);
      }
    },
    {
      id: 'readingGuide',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      label: 'Lesehilfe',
      default: false,
      apply: function (val) {
        toggleReadingGuide(val);
      }
    },
    {
      id: 'nightMode',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>',
      label: 'Nachtmodus',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-night-mode', val);
      }
    },
    {
      id: 'dyslexia',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h13"/></svg>',
      label: 'Leseschrift',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-dyslexia', val);
      }
    },
    {
      id: 'pauseAnimations',
      type: 'toggle',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
      label: 'Animationen stoppen',
      default: false,
      apply: function (val) {
        document.body.classList.toggle('a11y-pause-animations', val);
      }
    }
  ];

  /* ── Lesehilfe (Reading Guide) ── */
  var guideEl = null;
  function toggleReadingGuide(on) {
    if (on) {
      if (!guideEl) {
        guideEl = document.createElement('div');
        guideEl.id = 'bv-reading-guide';
        document.body.appendChild(guideEl);
        document.addEventListener('mousemove', moveGuide);
      }
      guideEl.style.display = 'block';
    } else {
      if (guideEl) {
        guideEl.style.display = 'none';
        document.removeEventListener('mousemove', moveGuide);
      }
    }
  }
  function moveGuide(e) {
    if (guideEl) guideEl.style.top = (e.clientY - 20) + 'px';
  }

  /* ── Zustand auf alle Features anwenden ── */
  function applyAll() {
    features.forEach(function (f) {
      var val = state[f.id] !== undefined ? state[f.id] : f.default;
      f.apply(val);
    });
  }

  /* ── Panel HTML aufbauen ── */
  function buildPanel() {
    var rows = '';
    features.forEach(function (f) {
      var val = state[f.id] !== undefined ? state[f.id] : f.default;
      if (f.type === 'toggle') {
        rows += '<div class="a11y-row" data-id="' + f.id + '">' +
          '<div class="a11y-row-left">' +
            '<span class="a11y-row-icon">' + f.icon + '</span>' +
            '<span class="a11y-row-label">' + f.label + '</span>' +
          '</div>' +
          '<button class="a11y-toggle' + (val ? ' on' : '') + '" aria-label="' + f.label + ' ' + (val ? 'deaktivieren' : 'aktivieren') + '" aria-pressed="' + val + '">' +
            '<span class="a11y-toggle-thumb"></span>' +
          '</button>' +
        '</div>';
      } else if (f.type === 'range') {
        rows += '<div class="a11y-row a11y-row--range" data-id="' + f.id + '">' +
          '<div class="a11y-row-left">' +
            '<span class="a11y-row-icon">' + f.icon + '</span>' +
            '<span class="a11y-row-label">' + f.label + '</span>' +
          '</div>' +
          '<div class="a11y-range-controls">' +
            '<button class="a11y-range-btn" data-dir="-1" aria-label="Schrift verkleinern">−</button>' +
            '<span class="a11y-range-val">' + (val === 0 ? '100%' : (100 + val * 12.5).toFixed(0) + '%') + '</span>' +
            '<button class="a11y-range-btn" data-dir="1" aria-label="Schrift vergrößern">+</button>' +
          '</div>' +
        '</div>';
      }
    });

    return '<div id="bv-a11y-panel" role="dialog" aria-modal="false" aria-label="Barrierefreiheits-Einstellungen">' +
      '<div class="a11y-panel-header">' +
        '<div class="a11y-panel-title">' +
          '<svg class="a11y-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
          'Barrierefreiheit' +
        '</div>' +
        '<button id="bv-a11y-close" aria-label="Menü schließen">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="a11y-panel-body">' + rows + '</div>' +
      '<div class="a11y-panel-footer">' +
        '<button id="bv-a11y-reset">↺ Alles zurücksetzen</button>' +
      '</div>' +
    '</div>';
  }

  /* ── Widget-Button ── */
  function buildTrigger() {
    return '<button id="bv-a11y-trigger" aria-label="Barrierefreiheits-Einstellungen öffnen" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>' +
        '<path d="M7 9h10M12 9v11"/>' +
        '<path d="M9 14l-2 6M15 14l2 6"/>' +
      '</svg>' +
    '</button>';
  }

  /* ── CSS injizieren ── */
  function injectCSS() {
    var css = [
      /* ── Widget Isolation – immer sichtbar ── */
      '#bv-a11y-widget {',
        'isolation: isolate;',
      '}',
      '#bv-a11y-trigger { isolation: isolate; }',
      '#bv-a11y-trigger {',
        'position: fixed; bottom: 80px; right: 16px; z-index: 999998;',
        'width: 48px; height: 48px; border-radius: 50%;',
        'background: #1a1a1a; color: #C49A2A;',
        'border: 2px solid #C49A2A; cursor: pointer;',
        'display: flex; align-items: center; justify-content: center;',
        'box-shadow: 0 4px 16px rgba(0,0,0,0.3);',
        'transition: all 0.2s ease;',
        'padding: 0;',
      '}',
      '#bv-a11y-trigger:hover { background: #C49A2A; color: #000; transform: scale(1.08); }',
      '#bv-a11y-trigger svg { width: 22px; height: 22px; }',
      '@media (max-width: 600px) { #bv-a11y-trigger { bottom: 74px; right: 12px; width: 44px; height: 44px; } }',

      /* ── Panel ── */
      '#bv-a11y-panel {',
        'position: fixed; bottom: 136px; right: 16px; z-index: 999999;',
        'width: 296px; max-height: 80vh;',
        'background: #fff; border-radius: 14px;',
        'box-shadow: 0 8px 40px rgba(0,0,0,0.22);',
        'border: 1px solid #e0ddd6;',
        'overflow: hidden; display: flex; flex-direction: column;',
        'transform: translateY(12px) scale(0.96); opacity: 0;',
        'transition: transform 0.25s cubic-bezier(.22,.68,0,1.2), opacity 0.2s ease;',
        'pointer-events: none;',
      '}',
      '#bv-a11y-panel.open {',
        'transform: translateY(0) scale(1); opacity: 1; pointer-events: all;',
      '}',
      '@media (max-width: 600px) {',
        '#bv-a11y-panel { left: 8px; right: 8px; width: auto; bottom: 126px; max-height: 70vh; }',
      '}',

      /* ── Header ── */
      '.a11y-panel-header {',
        'display: flex; align-items: center; justify-content: space-between;',
        'padding: 14px 16px; background: #1a1a1a;',
        'border-bottom: 2px solid #C49A2A; flex-shrink: 0;',
      '}',
      '.a11y-panel-title {',
        'display: flex; align-items: center; gap: 8px;',
        'font-family: "Barlow Condensed", sans-serif;',
        'font-size: 1.05rem; font-weight: 700; color: #fff; letter-spacing: 0.5px;',
      '}',
      '.a11y-panel-icon { width: 18px; height: 18px; stroke: #C49A2A; }',
      '#bv-a11y-close {',
        'background: none; border: none; color: rgba(255,255,255,0.6);',
        'cursor: pointer; padding: 4px; border-radius: 4px;',
        'display: flex; align-items: center; transition: color 0.15s;',
      '}',
      '#bv-a11y-close:hover { color: #fff; }',
      '#bv-a11y-close svg { width: 18px; height: 18px; }',

      /* ── Body / Rows ── */
      '.a11y-panel-body {',
        'overflow-y: auto; flex: 1;',
        'padding: 8px 0;',
      '}',
      '.a11y-row {',
        'display: flex; align-items: center; justify-content: space-between;',
        'padding: 10px 16px; gap: 12px;',
        'transition: background 0.15s;',
      '}',
      '.a11y-row:hover { background: #f8f6f1; }',
      '.a11y-row-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }',
      '.a11y-row-icon { width: 20px; height: 20px; flex-shrink: 0; color: #C49A2A; }',
      '.a11y-row-icon svg { width: 20px; height: 20px; }',
      '.a11y-row-label {',
        'font-family: "Inter", sans-serif; font-size: 0.88rem;',
        'color: #111; font-weight: 500; white-space: nowrap;',
      '}',

      /* ── Toggle Switch ── */
      '.a11y-toggle {',
        'width: 42px; height: 24px; border-radius: 100px;',
        'background: #ddd; border: none; cursor: pointer;',
        'position: relative; flex-shrink: 0;',
        'transition: background 0.2s; padding: 0;',
      '}',
      '.a11y-toggle.on { background: #C49A2A; }',
      '.a11y-toggle-thumb {',
        'position: absolute; top: 3px; left: 3px;',
        'width: 18px; height: 18px; border-radius: 50%;',
        'background: #fff; transition: transform 0.2s;',
        'box-shadow: 0 1px 4px rgba(0,0,0,0.2);',
        'display: block;',
      '}',
      '.a11y-toggle.on .a11y-toggle-thumb { transform: translateX(18px); }',

      /* ── Range Controls ── */
      '.a11y-range-controls { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }',
      '.a11y-range-btn {',
        'width: 28px; height: 28px; border-radius: 6px;',
        'background: #f0ede6; border: 1px solid #ddd;',
        'font-size: 1.1rem; font-weight: 700; color: #111;',
        'cursor: pointer; display: flex; align-items: center; justify-content: center;',
        'transition: background 0.15s; padding: 0; line-height: 1;',
      '}',
      '.a11y-range-btn:hover { background: #C49A2A; color: #000; border-color: #C49A2A; }',
      '.a11y-range-val { font-size: 0.78rem; color: #666; min-width: 34px; text-align: center; font-family: monospace; }',

      /* ── Footer ── */
      '.a11y-panel-footer {',
        'padding: 10px 16px; border-top: 1px solid #e0ddd6; flex-shrink: 0;',
      '}',
      '#bv-a11y-reset {',
        'width: 100%; padding: 9px;',
        'background: none; border: 1.5px solid #e0ddd6;',
        'border-radius: 6px; color: #666; font-size: 0.82rem;',
        'cursor: pointer; font-family: "Inter", sans-serif;',
        'transition: all 0.15s;',
      '}',
      '#bv-a11y-reset:hover { border-color: #C49A2A; color: #9A7318; background: rgba(196,154,42,0.05); }',

      /* ── Lesehilfe ── */
      '#bv-reading-guide {',
        'position: fixed; left: 0; right: 0; height: 40px;',
        'background: rgba(196,154,42,0.12); border-top: 2px solid rgba(196,154,42,0.4);',
        'border-bottom: 2px solid rgba(196,154,42,0.4);',
        'pointer-events: none; z-index: 999990; display: none;',
        'transition: top 0.05s linear;',
      '}',

      /* ── A11Y-Modi ── */

      /* Hoher Kontrast */
      'body.a11y-high-contrast { filter: contrast(1.5) brightness(1.05); }',
      'body.a11y-high-contrast #bv-a11y-widget { filter: none; }',

      /* Links unterstreichen */
      'body.a11y-underline-links a { text-decoration: underline !important; text-decoration-thickness: 2px !important; }',

      /* Großer Cursor */
      'body.a11y-big-cursor, body.a11y-big-cursor * {',
        'cursor: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23000\' stroke=\'%23fff\' stroke-width=\'1\' d=\'M4 2l16 9.5-8.5 1.5L9 21z\'/%3E%3C/svg%3E") 4 4, auto !important;',
      '}',

      /* Nachtmodus */
      'body.a11y-night-mode { filter: invert(0.9) hue-rotate(180deg); }',
      'body.a11y-night-mode img, body.a11y-night-mode video, body.a11y-night-mode .hero { filter: invert(1) hue-rotate(180deg); }',
      'body.a11y-night-mode #bv-a11y-widget { filter: invert(1) hue-rotate(180deg); }',

      /* Leseschrift (OpenDyslexic-ähnlich via font-stack) */
      'body.a11y-dyslexia, body.a11y-dyslexia p, body.a11y-dyslexia li, body.a11y-dyslexia label {',
        'font-family: "Arial Rounded MT Bold", "Arial", sans-serif !important;',
        'letter-spacing: 0.05em !important; word-spacing: 0.15em !important; line-height: 1.8 !important;',
      '}',

      /* Animationen stoppen */
      'body.a11y-pause-animations *:not(#bv-a11y-widget):not(#bv-a11y-widget *), body.a11y-pause-animations *:not(#bv-a11y-widget)::before, body.a11y-pause-animations *:not(#bv-a11y-widget)::after {',
        'animation-play-state: paused !important;',
        'transition: none !important;',
      '}',
    ].join('\n');

    var style = document.createElement('style');
    style.id = 'bv-a11y-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── Event Handlers ── */
  function bindEvents(wrapper) {
    /* Trigger öffnet/schließt Panel */
    var trigger = document.getElementById('bv-a11y-trigger');
    var panel = document.getElementById('bv-a11y-panel');

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open);
    });

    /* Schließen-Button */
    document.getElementById('bv-a11y-close').addEventListener('click', function () {
      panel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    /* Klick außerhalb schließt Panel */
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) {
        panel.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    /* ESC schließt Panel */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        panel.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    /* Toggle Buttons */
    panel.querySelectorAll('.a11y-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.a11y-row').dataset.id;
        var feat = features.find(function (f) { return f.id === id; });
        if (!feat) return;
        var newVal = !btn.classList.contains('on');
        state[id] = newVal;
        saveState(state);
        btn.classList.toggle('on', newVal);
        btn.setAttribute('aria-pressed', newVal);
        btn.setAttribute('aria-label', feat.label + ' ' + (newVal ? 'deaktivieren' : 'aktivieren'));
        feat.apply(newVal);
      });
    });

    /* Range Buttons */
    panel.querySelectorAll('.a11y-range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.a11y-row');
        var id = row.dataset.id;
        var feat = features.find(function (f) { return f.id === id; });
        if (!feat) return;
        var dir = parseInt(btn.dataset.dir, 10);
        var cur = state[id] !== undefined ? state[id] : feat.default;
        var newVal = Math.max(feat.min, Math.min(feat.max, cur + dir * feat.step));
        state[id] = newVal;
        saveState(state);
        row.querySelector('.a11y-range-val').textContent =
          newVal === 0 ? '100%' : (100 + newVal * 12.5).toFixed(0) + '%';
        feat.apply(newVal);
      });
    });

    /* Reset */
    document.getElementById('bv-a11y-reset').addEventListener('click', function () {
      state = {};
      saveState(state);
      /* Alle Features auf Default zurücksetzen */
      features.forEach(function (f) { f.apply(f.default); });
      /* Panel neu aufbauen */
      var body = panel.querySelector('.a11y-panel-body');
      var tempPanel = document.createElement('div');
      tempPanel.innerHTML = buildPanel();
      body.innerHTML = tempPanel.querySelector('.a11y-panel-body').innerHTML;
      bindRowEvents(panel);
    });
  }

  function bindRowEvents(panel) {
    panel.querySelectorAll('.a11y-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.a11y-row').dataset.id;
        var feat = features.find(function (f) { return f.id === id; });
        if (!feat) return;
        var newVal = !btn.classList.contains('on');
        state[id] = newVal;
        saveState(state);
        btn.classList.toggle('on', newVal);
        btn.setAttribute('aria-pressed', newVal);
        feat.apply(newVal);
      });
    });
    panel.querySelectorAll('.a11y-range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.a11y-row');
        var id = row.dataset.id;
        var feat = features.find(function (f) { return f.id === id; });
        if (!feat) return;
        var dir = parseInt(btn.dataset.dir, 10);
        var cur = state[id] !== undefined ? state[id] : feat.default;
        var newVal = Math.max(feat.min, Math.min(feat.max, cur + dir * feat.step));
        state[id] = newVal;
        saveState(state);
        row.querySelector('.a11y-range-val').textContent =
          newVal === 0 ? '100%' : (100 + newVal * 12.5).toFixed(0) + '%';
        feat.apply(newVal);
      });
    });
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    applyAll(); /* gespeicherte Einstellungen sofort anwenden */

    var wrapper = document.createElement('div');
    wrapper.id = 'bv-a11y-widget';
    wrapper.setAttribute('role', 'complementary');
    wrapper.setAttribute('aria-label', 'Barrierefreiheit');
    wrapper.innerHTML = buildTrigger() + buildPanel();
    document.body.appendChild(wrapper);

    bindEvents(wrapper);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
