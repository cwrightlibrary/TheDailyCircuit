/* ============================================================
   The Daily Circuit — application logic
   No framework, no build step. Runs from any static host.
   ============================================================ */

(function () {
  'use strict';

  var GAMES = Array.isArray(window.CIRCUIT_GAMES) ? window.CIRCUIT_GAMES : [];
  var STORE_KEY = 'dailyCircuit.v1';
  var WIDTHS = ['fit', 'narrow', 'wide'];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  if (!GAMES.length) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">' +
      'assets/games.js did not load, so there is nothing to play. Check that the file sits next to index.html.</p>';
    return;
  }

  /* ---------- elements ---------- */
  var el = {
    body: document.body,
    dateline: $('#dateline'),
    tally: $('#tally'),
    clock: $('#clock'),
    rail: $('#rail'),
    stage: $('#stage'),
    stageNo: $('#stage-no'),
    stageName: $('#stage-name'),
    stageTag: $('#stage-tag'),
    stageTime: $('#stage-time'),
    stageNote: $('#stage-note'),
    stageHost: $('#stage-host'),
    prev: $('#btn-prev'),
    next: $('#btn-next'),
    nextName: $('#next-name'),
    reload: $('#btn-reload'),
    open: $('#btn-open'),
    mode: $('#btn-mode'),
    shell: $('#frame-shell'),
    frame: $('#game-frame'),
    launchpad: $('#launchpad'),
    launchName: $('#launch-name'),
    launchNote: $('#launch-note'),
    launch: $('#btn-launch'),
    autoInline: $('#btn-auto-inline'),
    loader: $('#loader'),
    loaderHost: $('#loader-host'),
    autoPill: $('#auto-pill'),
    autoText: $('#auto-text'),
    settings: $('#btn-settings'),
    dialog: $('#dialog'),
    prefAuto: $('#pref-auto'),
    prefFocus: $('#pref-focus'),
    adWindow: $('#btn-ad-window'),
    reset: $('#btn-reset'),
    wipe: $('#btn-wipe'),
    finish: $('#finish'),
    finishTime: $('#finish-time'),
    finishDate: $('#finish-date'),
    stamps: $('#stamps'),
    again: $('#btn-again'),
    share: $('#btn-share'),
    back: $('#btn-back'),
    toast: $('#toast'),
    about: $('#about-line'),
    seg: Array.prototype.slice.call(document.querySelectorAll('.seg button'))
  };

  /* ---------- helpers ---------- */
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtTime(sec, forceHours) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    if (h > 0 || forceHours) return h + ':' + pad(m) + ':' + pad(s);
    return m + ':' + pad(s);
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  function checkSvg(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M2.6 8.3c1.2 1 2.3 2.2 3 3.4 1.7-3.4 3.9-6.4 6.9-9.3"/></svg>';
  }

  function gameIndexById(id) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return i;
    return -1;
  }

  /* ---------- state ---------- */
  function blankState() {
    return {
      day: todayKey(),
      index: 0,
      finished: false,
      done: {},
      spent: {},
      prefs: { autoOnClose: true, focus: false, width: 'fit' },
      widths: {},
      modes: {}
    };
  }

  var state = blankState();

  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      var base = blankState();
      state = Object.assign(base, saved);
      state.prefs = Object.assign(blankState().prefs, saved.prefs || {});
      state.done = saved.done && typeof saved.done === 'object' ? saved.done : {};
      state.spent = saved.spent && typeof saved.spent === 'object' ? saved.spent : {};
      state.widths = saved.widths && typeof saved.widths === 'object' ? saved.widths : {};
      state.modes = saved.modes && typeof saved.modes === 'object' ? saved.modes : {};
      if (typeof state.index !== 'number' || state.index < 0 || state.index >= GAMES.length) state.index = 0;
      state.finished = !!state.finished;
      if (state.day !== todayKey()) {
        var prefs = state.prefs, widths = state.widths, modes = state.modes, focus = state.prefs.focus;
        state = blankState();
        state.prefs = prefs;
        state.prefs.focus = !!focus;
        state.widths = widths;
        state.modes = modes;
      }
    }
  } catch (e) { /* private mode, bad JSON — start clean */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function modeOf(g) {
    var m = state.modes[g.id] || g.mode || 'embed';
    return m === 'tab' ? 'tab' : 'embed';
  }

  function widthOf(g) {
    var w = state.widths[g.id] || g.width || state.prefs.width || 'fit';
    return WIDTHS.indexOf(w) === -1 ? 'fit' : w;
  }

  function doneCount() {
    return GAMES.reduce(function (n, g) { return n + (state.done[g.id] ? 1 : 0); }, 0);
  }

  function totalSeconds() {
    return GAMES.reduce(function (n, g) { return n + (state.spent[g.id] || 0); }, 0);
  }

  function markDone(id) {
    if (!state.done[id]) {
      state.done[id] = new Date().toISOString();
      save();
    }
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    requestAnimationFrame(function () { el.toast.classList.add('is-shown'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('is-shown');
      setTimeout(function () { el.toast.hidden = true; }, 220);
    }, 2600);
  }

  /* ---------- rail ---------- */
  function buildRail() {
    var frag = document.createDocumentFragment();
    GAMES.forEach(function (g, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.index = String(i);
      btn.title = (i + 1) + '. ' + g.name + ' — ' + hostOf(g.url);
      btn.innerHTML = '<span class="num">' + pad(i + 1) + '</span>' + checkSvg('tick');
      btn.setAttribute('aria-label', 'Game ' + (i + 1) + ' of ' + GAMES.length + ': ' + g.name);
      btn.addEventListener('click', function () { goTo(i, { via: 'rail' }); });
      li.appendChild(btn);
      frag.appendChild(li);
    });
    el.rail.appendChild(frag);
  }

  function paintRail() {
    var items = el.rail.children;
    for (var i = 0; i < items.length; i++) {
      var g = GAMES[i];
      items[i].classList.toggle('is-done', !!state.done[g.id]);
      items[i].classList.toggle('is-current', !state.finished && i === state.index);
      var btn = items[i].firstChild;
      if (i === state.index && !state.finished) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
    }
  }

  /* ---------- chrome ---------- */
  function paintChrome() {
    el.tally.textContent = pad(doneCount());
    el.clock.textContent = fmtTime(totalSeconds());

    var g = GAMES[state.index];
    el.stageTime.textContent = fmtTime(state.spent[g.id] || 0);

    var prevG = state.index > 0 ? GAMES[state.index - 1] : null;
    var nextG = state.index < GAMES.length - 1 ? GAMES[state.index + 1] : null;

    el.prev.disabled = !state.finished && state.index === 0;
    el.prev.setAttribute('aria-label', prevG ? 'Previous: ' + prevG.name : 'Previous game');

    var isLast = state.index === GAMES.length - 1;
    var nextLabel = el.next.querySelector('.btn-word');
    if (nextLabel) nextLabel.textContent = isLast ? 'Finish' : 'Next';
    var nextLabelText = '';
    if (nextG) {
      var twins = GAMES.filter(function (x) { return x.name === nextG.name; }).length > 1;
      nextLabelText = twins ? hostOf(nextG.url) : nextG.name;
    }
    el.nextName.textContent = nextLabelText;
    el.next.setAttribute('aria-label', nextG ? 'Next: ' + nextG.name : 'Finish the run');

    el.autoPill.setAttribute('aria-pressed', state.prefs.autoOnClose ? 'true' : 'false');
    el.autoText.textContent = state.prefs.autoOnClose ? 'Auto-next on' : 'Auto-next off';
    if (el.autoInline) el.autoInline.textContent = state.prefs.autoOnClose ? 'on' : 'off';

    paintRail();
  }

  /* ---------- frame lifecycle ---------- */
  var loadTimer = null;
  var slowNote = null;

  function clearSlowNote() {
    clearTimeout(loadTimer);
    if (slowNote && slowNote.parentNode) slowNote.parentNode.removeChild(slowNote);
    slowNote = null;
  }

  function showSlowNote() {
    if (slowNote) return;
    slowNote = document.createElement('div');
    slowNote.className = 'frame-note';
    slowNote.innerHTML = '<span>Still blank? This site may refuse to be framed.</span>' +
      '<button type="button" class="linklike" data-act="open">Open in a window</button>' +
      '<button type="button" class="frame-note-x" aria-label="Dismiss">✕</button>';
    slowNote.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (act) { openInWindow(); return; }
      if (e.target.closest('.frame-note-x')) clearSlowNote();
    });
    el.shell.appendChild(slowNote);
  }

  function mountFrame(g) {
    el.launchpad.hidden = true;
    el.frame.hidden = false;
    el.loaderHost.textContent = hostOf(g.url);
    clearSlowNote();

    if (el.frame.dataset.url !== g.url) {
      el.loader.hidden = false;
      el.frame.dataset.url = g.url;
      el.frame.src = g.url;
      loadTimer = setTimeout(function () {
        if (!el.loader.hidden) showSlowNote();
      }, 9000);
    } else {
      el.loader.hidden = true;
    }
  }

  function unmountFrame() {
    clearSlowNote();
    el.frame.dataset.url = '';
    el.frame.hidden = true;
    el.frame.src = 'about:blank';
    el.loader.hidden = true;
    el.launchpad.hidden = false;
  }

  el.frame.addEventListener('load', function () {
    if (el.frame.dataset.url) {
      el.loader.hidden = true;
      clearSlowNote();
    }
  });

  /* ---------- launchpad ---------- */
  function renderLaunchpad(g) {
    el.launchName.textContent = g.name;
    el.launchNote.innerHTML = g.why
      ? g.why.replace(/X-Frame-Options: DENY/g, '<code>X-Frame-Options: DENY</code>')
      : 'This game opens in its own window so it can run at full size.';
    el.launch.textContent = 'Open ' + g.name + ' ↗';
    if (el.autoInline) el.autoInline.textContent = state.prefs.autoOnClose ? 'on' : 'off';
  }

  /* ---------- render stage ---------- */
  function renderStage() {
    var g = GAMES[state.index];
    var mode = modeOf(g);
    var width = widthOf(g);

    el.stageNo.textContent = pad(state.index + 1);
    el.stageName.textContent = g.name;
    el.stageName.title = g.name;
    el.stageTag.textContent = g.tag || '';
    el.stageTag.dataset.tag = g.tag || '';
    el.stageTag.hidden = !g.tag;
    el.stageNote.textContent = g.note || '';
    el.stageHost.textContent = hostOf(g.url);
    el.frame.title = g.name + ' — ' + hostOf(g.url);

    el.shell.dataset.width = width;
    el.shell.dataset.mode = mode;

    el.seg.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.width === width ? 'true' : 'false');
    });

    el.mode.setAttribute('aria-pressed', mode === 'tab' ? 'true' : 'false');
    el.mode.title = mode === 'tab' ? 'Showing: own window — click to embed' : 'Showing: embedded — click for own window';

    if (mode === 'embed') mountFrame(g);
    else { unmountFrame(); renderLaunchpad(g); }

    paintChrome();
  }

  /* ---------- navigation ---------- */

  function applyFocusMode() {
    el.body.classList.toggle('focus', !!state.prefs.focus);
    if (el.prefFocus) el.prefFocus.checked = !!state.prefs.focus;
  }

  function setHash(id) {
    var target = '#' + id;
    if (location.hash === target) return;
    try { history.replaceState(null, '', target); } catch (e) { location.hash = target; }
  }

  function goTo(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= GAMES.length) return;

    state.index = i;
    state.finished = false;
    el.body.classList.remove('is-finished');
    el.finish.hidden = true;
    el.stage.hidden = false;
    save();

    renderStage();
    setHash(GAMES[i].id);

    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (opts.via === 'rail') window.scrollTo(0, 0);
  }

  function next() {
    var g = GAMES[state.index];
    if (!g) return;
    markDone(g.id);
    if (state.index >= GAMES.length - 1) { finishRun(); return; }
    goTo(state.index + 1, { via: 'next' });
  }

  function prev() {
    if (state.finished) { goTo(GAMES.length - 1, { via: 'prev' }); return; }
    if (state.index === 0) { toast('This is the first game'); return; }
    goTo(state.index - 1, { via: 'prev' });
  }

  /* ---------- finish ---------- */
  function finishRun() {
    state.finished = true;
    save();
    el.stage.hidden = true;
    el.finish.hidden = false;
    el.body.classList.add('is-finished');
    setHash('finish');

    el.finishTime.textContent = fmtTime(totalSeconds(), true);
    el.finishDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    var frag = document.createDocumentFragment();
    GAMES.forEach(function (g, i) {
      var li = document.createElement('li');
      var done = !!state.done[g.id];
      li.style.setProperty('--i', String(i));
      li.setAttribute('aria-label', g.name + ' — ' + (done ? 'done' : 'not marked') +
        (state.spent[g.id] ? ', ' + fmtTime(state.spent[g.id]) : ''));
      li.innerHTML =
        '<span class="n">' + pad(i + 1) + '</span>' +
        (done ? checkSvg('ok') : '<svg class="ok is-empty" viewBox="0 0 16 16" aria-hidden="true"></svg>') +
        '<span class="nm">' + g.name +
          (GAMES.filter(function (x) { return x.name === g.name; }).length > 1
            ? '<span class="nm-host">' + hostOf(g.url) + '</span>' : '') +
        '</span>' +
        '<span class="t">' + (state.spent[g.id] ? fmtTime(state.spent[g.id]) : '—') + '</span>';
      frag.appendChild(li);
    });
    el.stamps.innerHTML = '';
    el.stamps.appendChild(frag);
    paintChrome();
    window.scrollTo(0, 0);
  }

  function summaryText() {
    var lines = [];
    lines.push('THE DAILY CIRCUIT — ' + doneCount() + '/' + GAMES.length + ' in ' + fmtTime(totalSeconds(), true));
    lines.push(GAMES.map(function (g) {
      var twins = GAMES.filter(function (x) { return x.name === g.name; }).length > 1;
      return (state.done[g.id] ? '✓' : '·') + g.name + (twins ? ' (' + hostOf(g.url) + ')' : '');
    }).join('  '));
    return lines.join('\n');
  }

  function copySummary() {
    var text = summaryText();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Summary copied'); }
      catch (e) { toast('Could not copy — select the text manually'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Summary copied'); }, fallback);
    } else fallback();
  }

  /* ---------- external windows ---------- */
  var popup = null;
  var popupTimer = null;
  var popupStageId = null;

  function stopWatching() {
    clearInterval(popupTimer);
    popupTimer = null;
    popup = null;
    popupStageId = null;
  }

  function watchWindow(win, id) {
    clearInterval(popupTimer);
    popup = win;
    popupStageId = id;
    popupTimer = setInterval(function () {
      if (!popup || popup.closed) {
        var closedId = popupStageId;
        stopWatching();
        onWindowClosed(closedId);
      }
    }, 650);
  }

  function onWindowClosed(id) {
    if (!id || !GAMES[state.index] || GAMES[state.index].id !== id) return;
    if (!state.prefs.autoOnClose) { toast('Window closed'); return; }
    if (!state.done[id]) markDone(id);
    var nextG = GAMES[state.index + 1];
    if (!nextG) { toast('That was the last one'); finishRun(); return; }
    toast('Next up · ' + nextG.name);
    goTo(state.index + 1, { via: 'auto' });
  }

  function openInWindow() {
    var g = GAMES[state.index];
    var win = null;
    try {
      win = window.open(g.url, 'circuit_' + g.id, 'popup=yes,width=1180,height=900,left=90,top=60');
    } catch (e) { win = null; }

    if (!win) {
      toast('Window blocked — using a new tab');
      try {
        var a = document.createElement('a');
        a.href = g.url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e2) { /* ignore */ }
      return;
    }
    watchWindow(win, g.id);
    toast(state.prefs.autoOnClose ? 'Close that window to move on' : 'Opened in its own window');
    try { win.focus(); } catch (e) { /* ignore */ }
  }

  /* ---------- mode / width toggles ---------- */
  function toggleMode() {
    var g = GAMES[state.index];
    var nextMode = modeOf(g) === 'embed' ? 'tab' : 'embed';
    state.modes[g.id] = nextMode;
    save();
    renderStage();
    toast(nextMode === 'tab' ? 'Opening in its own window' : 'Embedded in this page');
  }

  function setWidth(w) {
    var g = GAMES[state.index];
    state.widths[g.id] = w;
    save();
    el.shell.dataset.width = w;
    el.seg.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.width === w ? 'true' : 'false');
    });
  }

  function cycleWidth() {
    var g = GAMES[state.index];
    var cur = widthOf(g);
    var nextW = WIDTHS[(WIDTHS.indexOf(cur) + 1) % WIDTHS.length];
    setWidth(nextW);
    toast('Width: ' + nextW);
  }

  function reloadGame() {
    var g = GAMES[state.index];
    if (modeOf(g) !== 'embed') { openInWindow(); return; }
    el.loader.hidden = false;
    el.loaderHost.textContent = hostOf(g.url);
    el.frame.dataset.url = '';
    el.frame.src = 'about:blank';
    setTimeout(function () {
      el.frame.src = g.url;
      el.frame.dataset.url = g.url;
    }, 40);
  }

  function toggleFocus() {
    state.prefs.focus = !state.prefs.focus;
    save();
    applyFocusMode();
    toast(state.prefs.focus ? 'Focus mode on — press F to bring the chrome back' : 'Chrome restored');
  }

  /* ---------- auto-advance pref ---------- */
  function setAuto(on) {
    state.prefs.autoOnClose = !!on;
    save();
    paintChrome();
    el.prefAuto.checked = !!on;
    toast(on ? 'Auto-next on' : 'Auto-next off');
  }

  /* ---------- reset ---------- */
  function resetRun(silent) {
    var prefs = state.prefs;
    var widths = state.widths;
    var modes = state.modes;
    state = blankState();
    state.prefs = prefs;
    state.widths = widths;
    state.modes = modes;
    save();
    goTo(0, { via: 'reset' });
    if (!silent) toast('Fresh run');
  }

  /* ---------- timer ---------- */
  var lastTick = Date.now();

  function tick() {
    var now = Date.now();
    var delta = Math.min(3, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;

    if (state.day !== todayKey()) {
      resetRun(true);
      toast('New day — fresh circuit');
      return;
    }

    if (document.hidden || state.finished || el.dialog.open) return;

    var g = GAMES[state.index];
    if (!g) return;
    state.spent[g.id] = (state.spent[g.id] || 0) + delta;
    el.clock.textContent = fmtTime(totalSeconds());
    el.stageTime.textContent = fmtTime(state.spent[g.id]);
  }

  setInterval(tick, 1000);

  function persistTick() { save(); }
  setInterval(persistTick, 5000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { lastTick = Date.now(); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (el.dialog.open) {
      if (e.key === 'Escape') el.dialog.close();
      return;
    }

    var k = e.key;
    if (k === 'ArrowRight' || k === 'n' || k === 'N') { e.preventDefault(); next(); return; }
    if (k === 'ArrowLeft' || k === 'p' || k === 'P') { e.preventDefault(); prev(); return; }
    if (k === 'o' || k === 'O') { e.preventDefault(); openInWindow(); return; }
    if (k === 'e' || k === 'E') { e.preventDefault(); toggleMode(); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); reloadGame(); return; }
    if (k === 'w' || k === 'W') { e.preventDefault(); cycleWidth(); return; }
    if (k === 'f' || k === 'F') { e.preventDefault(); toggleFocus(); return; }
    if (k === '?') { e.preventDefault(); openDialog(); return; }
    if (k === 'Escape') {
      if (state.prefs.focus) toggleFocus();
      return;
    }
    if (/^[1-9]$/.test(k)) {
      e.preventDefault();
      var i = parseInt(k, 10) - 1;
      if (i < GAMES.length) goTo(i, { via: 'key' });
    }
  });

  /* ---------- dialog ---------- */
  function openDialog() {
    el.prefAuto.checked = !!state.prefs.autoOnClose;
    if (el.prefFocus) el.prefFocus.checked = !!state.prefs.focus;
    el.dialog.showModal();
  }

  el.settings.addEventListener('click', openDialog);
  el.prefAuto.addEventListener('change', function () { setAuto(el.prefAuto.checked); });

  if (el.adWindow) {
    el.adWindow.addEventListener('click', function () {
      el.dialog.close();
      openInWindow();
    });
  }
  if (el.prefFocus) {
    el.prefFocus.addEventListener('change', function () {
      state.prefs.focus = el.prefFocus.checked;
      save();
      applyFocusMode();
    });
  }

  el.reset.addEventListener('click', function () {
    el.dialog.close();
    if (window.confirm('Reset today’s run? Times and ticks start over.')) resetRun();
  });

  el.wipe.addEventListener('click', function () {
    el.dialog.close();
    if (!window.confirm('Forget all saved progress, widths, and settings?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    state = blankState();
    applyFocusMode();
    goTo(0, { via: 'reset' });
    toast('All saved data cleared');
  });

  /* ---------- wiring ---------- */
  el.prev.addEventListener('click', prev);
  el.next.addEventListener('click', next);
  el.reload.addEventListener('click', reloadGame);
  el.open.addEventListener('click', openInWindow);
  el.mode.addEventListener('click', toggleMode);
  el.launch.addEventListener('click', openInWindow);
  el.autoInline.addEventListener('click', function () { setAuto(!state.prefs.autoOnClose); });
  el.autoPill.addEventListener('click', function () { setAuto(!state.prefs.autoOnClose); });
  el.seg.forEach(function (b) {
    b.addEventListener('click', function () { setWidth(b.dataset.width); });
  });

  el.again.addEventListener('click', function () { resetRun(); });
  el.share.addEventListener('click', copySummary);
  el.back.addEventListener('click', function () { goTo(GAMES.length - 1, { via: 'back' }); });

  el.dialog.addEventListener('click', function (e) {
    if (e.target === el.dialog) el.dialog.close();
  });

  window.addEventListener('hashchange', function () {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return;
    if (h === 'finish') { finishRun(); return; }
    var i = gameIndexById(h);
    if (i >= 0) goTo(i, { via: 'hash' });
  });

  /* ---------- boot ---------- */
  function dateline() {
    var d = new Date();
    var day = d.toLocaleDateString(undefined, { weekday: 'long' });
    var rest = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    el.dateline.textContent = day + ' · ' + rest;
  }

  function boot() {
    if (el.about) {
      var hosts = {};
      GAMES.forEach(function (g) { hosts[hostOf(g.url)] = 1; });
      el.about.textContent = GAMES.length + ' games · ' + Object.keys(hosts).length + ' hosts';
    }

    dateline();
    applyFocusMode();
    buildRail();
    paintChrome();

    var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (hash === 'finish') finishRun();
    else {
      var i = gameIndexById(hash);
      goTo(i >= 0 ? i : Math.min(state.index, GAMES.length - 1), { via: 'boot' });
    }

    if (state.prefs.focus) toast('Focus mode — press F for the chrome');
  }

  boot();
})();
