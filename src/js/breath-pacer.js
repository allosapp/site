/*!
 * Breath Pacer — breath-pacer.js
 * Minimal vanilla-JS breathing timer for /breath-pacer/
 */
(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────

  var MIN_SCALE = 0.52;
  var MAX_SCALE = 1.0;

  // ─── State ────────────────────────────────────────────────────────────────

  var state = {
    status:         'idle',   // 'idle' | 'running' | 'paused' | 'done'
    phase:          null,     // 'inhale' | 'exhale'
    bpm:            6.0,
    ratio:          'even',   // 'even' | 'long-exhale'
    sessionSeconds: null,     // null = continuous
    elapsedSeconds: 0,
    phaseElapsed:   0,
    phaseTotal:     0,
    lastTimestamp:  0,
    muted:          false,
    rafId:          null,
    labelPrefaded:  false,
  };

  // ─── DOM refs ─────────────────────────────────────────────────────────────

  var circleEl      = document.getElementById('bp-circle-wrap');
  var bgEl          = document.getElementById('bp-bg');
  var labelEl       = document.getElementById('bp-phase-label');
  var labelFadeTimer = null;
  var timerEl  = document.getElementById('bp-session-timer');
  var startBtn = document.getElementById('bp-start-btn');
  var resetBtn = document.getElementById('bp-reset-btn');
  var muteBtn  = document.getElementById('bp-mute-btn');

  // ─── Reduced-motion ───────────────────────────────────────────────────────

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Audio ────────────────────────────────────────────────────────────────

  var audioCtx     = null;
  var audioBuffers = {};

  function initAudio() {
    // If context already exists, resume if suspended (e.g. after phone call / lock screen)
    // and bail out — buffers are already loaded.
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        return audioCtx.resume().catch(function () {});
      }
      return Promise.resolve();
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return Promise.resolve();
    }

    // iOS unlock trick: play a silent one-sample buffer *synchronously* within
    // the user gesture. Without this, older iOS (incl. iOS 15 on iPhone SE)
    // keeps the context suspended even after resume() is called.
    try {
      var silence = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      var silentSrc = audioCtx.createBufferSource();
      silentSrc.buffer = silence;
      silentSrc.connect(audioCtx.destination);
      silentSrc.start(0);
    } catch (e) { /* ignore — best-effort unlock */ }

    // resume() is async; we must await it before the context is guaranteed
    // to be in 'running' state. Chain the buffer loads off its resolution.
    var resumeP = audioCtx.resume ? audioCtx.resume().catch(function () {}) : Promise.resolve();

    return resumeP.then(function () {
      return Promise.all([
        loadSound('inhale', '/assets/audio/inhale.mp3'),
        loadSound('exhale', '/assets/audio/exhale.mp3'),
      ]);
    });
  }

  // Use the callback form of decodeAudioData — the Promise API is unreliable
  // on iOS Safari below 14.5 (common on iPhone SE running older iOS).
  function loadSound(name, url) {
    return fetch(url)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (arrayBuf) {
        return new Promise(function (resolve, reject) {
          audioCtx.decodeAudioData(arrayBuf, resolve, reject);
        });
      })
      .then(function (decoded) { audioBuffers[name] = decoded; })
      .catch(function () { /* audio unavailable — continue silently */ });
  }

  function playSound(name) {
    if (state.muted || !audioCtx || !audioBuffers[name]) { return; }
    // Guard against the context being suspended mid-session (e.g. Siri, phone call)
    if (audioCtx.state === 'suspended') { audioCtx.resume().catch(function () {}); return; }
    try {
      var src = audioCtx.createBufferSource();
      src.buffer = audioBuffers[name];
      src.connect(audioCtx.destination);
      src.start(0);
    } catch (e) { /* ignore */ }
  }

  // ─── Timing helpers ───────────────────────────────────────────────────────

  function getCycleTimes() {
    var cycle = 60 / state.bpm;
    return state.ratio === 'even'
      ? { inhale: cycle / 2, exhale: cycle / 2 }
      : { inhale: cycle * 0.4, exhale: cycle * 0.6 };
  }

  // ─── Easing ───────────────────────────────────────────────────────────────

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // ─── Animation: circle scale ──────────────────────────────────────────────

  function updateCircle(progress) {
    if (reducedMotion || !circleEl) { return; }
    var t     = Math.max(0, Math.min(1, progress));
    var eased = easeInOut(t);
    var scale = state.phase === 'inhale'
      ? MIN_SCALE + (MAX_SCALE - MIN_SCALE) * eased
      : MAX_SCALE - (MAX_SCALE - MIN_SCALE) * eased;
    circleEl.style.setProperty('--circle-scale', scale.toFixed(4));
  }

  // ─── Animation: gradient hues ─────────────────────────────────────────────

  function updateGradient(timestamp) {
    if (reducedMotion || !bgEl) { return; }
    var t  = timestamp / 28000; // full hue cycle every ~28 seconds
    var h1 = 278 + Math.sin(t * Math.PI * 2) * 22; // 256–300 (purples)
    var h2 = 312 + Math.cos(t * Math.PI * 2) * 18; // 294–330 (pink-purples)
    bgEl.style.setProperty('--h1', h1.toFixed(1));
    bgEl.style.setProperty('--h2', h2.toFixed(1));
  }

  // ─── Session timer display ────────────────────────────────────────────────

  function updateTimer() {
    if (!timerEl) { return; }
    if (state.sessionSeconds === null) {
      timerEl.textContent = '';
      return;
    }
    var remaining = Math.max(0, state.sessionSeconds - Math.floor(state.elapsedSeconds));
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;
    timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ─── Phase management ─────────────────────────────────────────────────────

  function fadeOutLabel() {
    if (!labelEl) { return; }
    if (labelFadeTimer) { clearTimeout(labelFadeTimer); labelFadeTimer = null; }
    labelEl.style.opacity = '0';
  }

  function setLabel(text, immediate) {
    if (!labelEl) { return; }
    if (labelFadeTimer) { clearTimeout(labelFadeTimer); labelFadeTimer = null; }
    if (immediate) {
      labelEl.textContent = text;
      labelEl.style.opacity = text ? '1' : '0';
    } else {
      labelEl.style.opacity = '0';
      labelFadeTimer = setTimeout(function () {
        labelFadeTimer = null;
        labelEl.textContent = text;
        labelEl.style.opacity = text ? '1' : '0';
      }, 500);
    }
  }

  function enterPhase(phase, overflowSeconds, fadeIn) {
    var times          = getCycleTimes();
    state.phase        = phase;
    state.phaseTotal   = times[phase];
    state.phaseElapsed = overflowSeconds || 0;
    state.labelPrefaded = false;
    setLabel(phase === 'inhale' ? 'Inhale' : 'Exhale', !fadeIn);
    playSound(phase);
  }

  // ─── Main RAF tick ────────────────────────────────────────────────────────

  function tick(timestamp) {
    if (state.status !== 'running') { return; }

    var dt             = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;

    // Clamp large dt (e.g. tab was backgrounded)
    dt = Math.min(dt, 0.5);

    state.phaseElapsed   += dt;
    state.elapsedSeconds += dt;

    // Session complete?
    if (state.sessionSeconds !== null && state.elapsedSeconds >= state.sessionSeconds) {
      endSession();
      return;
    }

    // Pre-fade label 500ms before phase transition
    var timeRemaining = state.phaseTotal - state.phaseElapsed;
    if (!state.labelPrefaded && timeRemaining > 0 && timeRemaining <= 0.5) {
      state.labelPrefaded = true;
      fadeOutLabel();
    }

    // Phase transition?
    if (state.phaseElapsed >= state.phaseTotal) {
      var overflow  = state.phaseElapsed - state.phaseTotal;
      var nextPhase = state.phase === 'inhale' ? 'exhale' : 'inhale';
      enterPhase(nextPhase, overflow);
    }

    var progress = state.phaseTotal > 0
      ? Math.min(state.phaseElapsed / state.phaseTotal, 1)
      : 0;

    updateCircle(progress);
    updateGradient(timestamp);
    updateTimer();

    state.rafId = requestAnimationFrame(tick);
  }

  // ─── End session ──────────────────────────────────────────────────────────

  function endSession() {
    state.status = 'done';
    state.rafId  = null;
    setLabel('Complete');
    if (timerEl) { timerEl.textContent = ''; }
    if (!reducedMotion && circleEl) {
      circleEl.style.setProperty('--circle-scale', MIN_SCALE);
    }
    updateStartBtn();
    trackEvent('breath_pacer_complete', {
      bpm:     state.bpm,
      ratio:   state.ratio,
      session: state.sessionSeconds,
    });
  }

  // ─── Start button label ───────────────────────────────────────────────────

  function updateStartBtn() {
    if (!startBtn) { return; }
    var map = { idle: 'Start', running: 'Pause', paused: 'Resume', done: 'Start again' };
    var label = map[state.status] || 'Start';
    startBtn.textContent = label;
    startBtn.setAttribute('aria-label', label);
  }

  // ─── Start / Pause / Resume ───────────────────────────────────────────────

  function handleStartPause() {
    if (state.status === 'idle' || state.status === 'done') {
      initAudio().then(function () {
        state.status         = 'running';
        state.elapsedSeconds = 0;
        state.lastTimestamp  = performance.now();
        updateStartBtn();
        updateTimer();
        enterPhase('inhale', 0, true);
        state.rafId = requestAnimationFrame(tick);
        trackEvent('breath_pacer_start', {
          bpm:     state.bpm,
          ratio:   state.ratio,
          session: state.sessionSeconds,
        });
      });
    } else if (state.status === 'running') {
      if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
      state.status = 'paused';
      setLabel('Paused');
      updateStartBtn();
      trackEvent('breath_pacer_pause', { elapsed: Math.floor(state.elapsedSeconds) });
    } else if (state.status === 'paused') {
      state.status        = 'running';
      state.lastTimestamp = performance.now(); // reset to avoid dt spike on resume
      setLabel(state.phase === 'inhale' ? 'Inhale' : 'Exhale');
      updateStartBtn();
      state.rafId = requestAnimationFrame(tick);
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  function handleReset() {
    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
    state.status         = 'idle';
    state.phase          = null;
    state.elapsedSeconds = 0;
    state.phaseElapsed   = 0;
    state.labelPrefaded  = false;
    setLabel('');
    if (timerEl) { timerEl.textContent = ''; }
    if (!reducedMotion && circleEl) {
      circleEl.style.setProperty('--circle-scale', MIN_SCALE);
    }
    updateStartBtn();
    updateTimer();
  }

  // ─── Mute ─────────────────────────────────────────────────────────────────

  function handleMute() {
    state.muted = !state.muted;
    if (muteBtn) {
      muteBtn.textContent = state.muted ? 'Unmute' : 'Mute';
      muteBtn.setAttribute('aria-pressed', String(state.muted));
    }
  }

  // ─── Build preset button groups ───────────────────────────────────────────

  function buildButtons(containerId, items, isActive, onSelect) {
    var container = document.getElementById(containerId);
    if (!container) { return; }
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className    = 'bp-preset-btn';
      btn.textContent  = item.label;
      btn.type         = 'button';
      if (item.ariaLabel) { btn.setAttribute('aria-label', item.ariaLabel); }
      if (isActive(item)) { btn.classList.add('active'); }
      btn.addEventListener('click', function () {
        onSelect(item);
        container.querySelectorAll('.bp-preset-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });
      container.appendChild(btn);
    });
  }

  // ─── Analytics (Plausible) ────────────────────────────────────────────────

  function trackEvent(name, params) {
    try {
      if (typeof plausible === 'function') {
        plausible(name, { props: params || {} });
      }
    } catch (e) { /* ignore */ }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // BPM buttons
    buildButtons(
      'bp-bpm-buttons',
      [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0].map(function (v) {
        return {
          value:     v,
          label:     v.toFixed(1),
          ariaLabel: v.toFixed(1) + ' breaths per minute',
        };
      }),
      function (item) { return item.value === state.bpm; },
      function (item) { state.bpm = item.value; }
    );

    // Ratio buttons
    buildButtons(
      'bp-ratio-buttons',
      [
        { value: 'even',        label: 'Even',        ariaLabel: 'Equal inhale and exhale' },
        { value: 'long-exhale', label: 'Long exhale', ariaLabel: 'Longer exhale — 2:3 ratio' },
      ],
      function (item) { return item.value === state.ratio; },
      function (item) { state.ratio = item.value; }
    );

    // Session length buttons
    buildButtons(
      'bp-session-buttons',
      [
        { value: null, label: '\u221e',  ariaLabel: 'Continuous — no timer' },
        { value: 120,  label: '2 min' },
        { value: 300,  label: '5 min' },
        { value: 600,  label: '10 min' },
        { value: 900,  label: '15 min' },
        { value: 1200, label: '20 min' },
      ],
      function (item) { return item.value === state.sessionSeconds; },
      function (item) { state.sessionSeconds = item.value; updateTimer(); }
    );

    // Action buttons
    if (startBtn) { startBtn.addEventListener('click', handleStartPause); }
    if (resetBtn) { resetBtn.addEventListener('click', handleReset); }
    if (muteBtn)  { muteBtn.addEventListener('click',  handleMute);  }

    // Set initial circle scale
    if (!reducedMotion && circleEl) {
      circleEl.style.setProperty('--circle-scale', MIN_SCALE);
    }

    // Set initial gradient values
    if (!reducedMotion && bgEl) {
      bgEl.style.setProperty('--h1', '278');
      bgEl.style.setProperty('--h2', '312');
    }

    updateStartBtn();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
