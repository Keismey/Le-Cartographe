/* Le Cartographe — application (état, écrans, interactions, rendu du parchemin). */
(function () {
  'use strict';
  var Core = window.Core, LEVELS = window.Levels.list, Art = window.Art, I = window.I18n;
  var t = I.t, loc = I.loc;
  var FONT = "'IM Fell English', Georgia, 'Times New Roman', serif";
  var KEY = 'keismey.cartographe.v1';

  /* ───────────── utilitaires ───────────── */
  function h(tag, a, kids) {
    var e = document.createElement(tag); a = a || {};
    for (var k in a) {
      var v = a[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function deepMerge(base, o) {
    if (!o || typeof o !== 'object') return base;
    for (var k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && base[k] && typeof base[k] === 'object') deepMerge(base[k], o[k]); else base[k] = o[k]; }
    return base;
  }

  /* ───────────── sauvegarde ───────────── */
  function defaultSave() { return { v: 1, settings: { lang: null, sound: true, vibrate: true, textSize: 0, cb: false }, progress: {}, notes: {}, inprogress: {}, tutDone: false, started: false }; }
  var save = (function () {
    try { var raw = localStorage.getItem(KEY); if (raw) return deepMerge(defaultSave(), JSON.parse(raw)); } catch (e) {}
    return defaultSave();
  })();
  var saveTimer = null, saveWarned = false;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(save)); }
      catch (e) { if (!saveWarned) { saveWarned = true; toast(t('error')); } }
    }, 200);
  }

  /* ───────────── état ───────────── */
  var S = {
    screen: 'title', levelIdx: 0, level: null, phase: 'play',
    placed: {}, drawn: {}, asked: {}, scoutsUsed: 0, suspects: {}, pins: {},
    mode: 'move', activePath: null, ghost: false, panel: 'tools', openCard: null,
    selected: null, armed: null, undo: [], ruler: null, rulerUsed: false, tut: null, result: null, detailOpen: false
  };
  var view = { z: 1, s0: 3, ox: 0, oy: 0 };
  var COL = { ok: '#3f8a52', ko: '#c4382c', near: '#c58a1d' };
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    COL.ok = cs.getPropertyValue('--ok').trim() || COL.ok; COL.ko = cs.getPropertyValue('--ko').trim() || COL.ko; COL.near = cs.getPropertyValue('--near').trim() || COL.near;
  }

  /* ───────────── son & vibration ───────────── */
  var AC = null;
  function audio() {
    if (!save.settings.sound) return null;
    try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
    return AC;
  }
  function tone(f, d, type, vol, when, slide) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + (when || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
    g.gain.setValueAtTime(vol || .12, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .02);
  }
  function sfx(name) {
    try {
      if (name === 'stamp') { tone(150, .16, 'sine', .22, 0, 60); tone(900, .04, 'square', .03); }
      else if (name === 'pick') tone(520, .05, 'triangle', .08);
      else if (name === 'draw') tone(330, .05, 'sawtooth', .03);
      else if (name === 'chime') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .5, 'triangle', .11, i * .12); }); }
      else if (name === 'low') tone(196, .3, 'triangle', .1);
      else if (name === 'star') { tone(880, .35, 'triangle', .13); tone(1318, .45, 'sine', .07, .05); }
    } catch (e) {}
  }
  function buzz(ms) { if (save.settings.vibrate) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  /* ───────────── toast & modale ───────────── */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }
  function modal(nodes) { var m = $('#modal'); clear(m); m.appendChild(h('div', { class: 'box', role: 'dialog', 'aria-modal': 'true' }, nodes)); m.classList.add('on'); }
  function closeModal() { $('#modal').classList.remove('on'); }

  /* ───────────── navigation ───────────── */
  function go(name) {
    S.screen = name;
    ['title', 'atlas', 'briefing', 'game'].forEach(function (n) { $('#' + n).classList.toggle('on', n === name); });
    if (name === 'atlas') renderAtlas();
    if (name === 'game') { resize(); fitView(); draw(); }
  }

  /* ───────────── écran titre ───────────── */
  function roseSvg() {
    return '<svg class="rose" viewBox="-50 -50 100 100" aria-hidden="true" fill="none" stroke="#d2a94b" stroke-width="1.6" stroke-linejoin="round">' +
      '<circle r="30"/><circle r="20" stroke-opacity=".5"/>' +
      '<path d="M0-46 L6-6 L46 0 L6 6 L0 46 L-6 6 L-46 0 L-6-6Z" fill="#d2a94b" fill-opacity=".14"/>' +
      '<path d="M0-30 L3-3 L30 0 L3 3 L0 30 L-3 3 L-30 0 L-3-3Z" transform="rotate(45)" stroke-opacity=".6"/></svg>';
  }
  function buildTitle() {
    var el = $('#title'); clear(el);
    var has = Object.keys(save.progress).length > 0 || Object.keys(save.inprogress).length > 0;
    var tt = Art.src('title'); if (tt) { el.style.backgroundImage = 'linear-gradient(180deg,rgba(4,14,18,.55) 0%,rgba(4,14,18,0) 32%,rgba(4,14,18,0) 62%,rgba(4,14,18,.72) 100%),url(' + tt + ')'; el.classList.add('art'); }
    else { var r = h('div'); r.innerHTML = roseSvg(); el.appendChild(r.firstChild); }
    el.appendChild(h('h1', { text: t('title') }));
    el.appendChild(h('p', { class: 'tag', text: t('tagline') }));
    el.appendChild(h('div', { class: 'stack' }, [
      h('button', { class: 'btn primary', id: 'btn-play', text: has ? t('continue_') : t('play'), onclick: function () { audio(); if (!has) openBriefing(0); else go('atlas'); } }),
      h('button', { class: 'btn', text: t('atlas'), onclick: function () { go('atlas'); } }),
      h('button', { class: 'btn ghost', text: t('settings'), onclick: openSettings })
    ]));
    el.appendChild(h('div', { class: 'ver', text: 'Keismey Studio · ' + t('version') }));
  }

  /* ───────────── atlas ───────────── */
  function unlocked(idx) { if (idx === 0) return true; var p = save.progress[LEVELS[idx - 1].id]; return !!(p && p.stars >= 1); }
  function ico(name, cls) { var s = Art.src('ui.' + name); return s ? h('img', { class: 'ico' + (cls ? ' ' + cls : ''), src: s, alt: '', draggable: 'false' }) : null; }
  function starImgs(n, cls, anim) {
    var a = [];
    for (var i = 0; i < 3; i++) {
      var el = ico(i < n ? 'etoile' : 'etoile_vide', cls) || h('span', { class: i < n ? '' : 'off', text: '★' });
      if (anim) { el.classList.add('pop'); el.style.animationDelay = (.45 + i * .42) + 's'; }
      a.push(el);
    }
    return a;
  }
  function portrait(w, cls) {
    var s = Art.src('portraits.' + w.id);
    return s ? h('img', { class: 'portrait ' + (cls || ''), src: s, alt: '', draggable: 'false' }) : h('span', { class: 'em', text: w.emoji });
  }
  function starsText(n) { var s = h('span', { class: 'starsrow', 'aria-label': t('stars', { n: n }) }); starImgs(n).forEach(function (x) { s.appendChild(x); }); return s; }
  function renderAtlas() {
    var el = $('#atlas'); clear(el);
    el.appendChild(h('div', { class: 'topbar gutter' }, [
      h('button', { class: 'iconbtn', 'aria-label': t('back'), text: '←', onclick: function () { buildTitle(); go('title'); } }),
      h('h2', { text: t('atlas') }),
      h('button', { class: 'iconbtn', 'aria-label': t('settings'), text: '⚙', onclick: openSettings })
    ]));
    var body = h('div', { class: 'body scroll gutter' });
    body.appendChild(h('p', { class: 'lead', text: t('atlasText') }));
    LEVELS.forEach(function (L, i) {
      var open = unlocked(i), p = save.progress[L.id], inprog = !!save.inprogress[L.id];
      var th = p && p.thumb ? h('img', { class: 'thumb', src: p.thumb, alt: '' }) : (Art.src('scenes.' + L.scene) ? h('img', { class: 'thumb', src: Art.src('scenes.' + L.scene), alt: '' }) : h('div', { class: 'thumb', text: String(L.id) }));
      var btn = h('button', { class: 'region', disabled: open ? null : true, id: 'region-' + L.id, onclick: function () { audio(); openBriefing(i); } }, [
        th,
        h('div', { class: 'meta' }, [
          h('div', { class: 'sub', text: t('region', { n: L.id }) }),
          h('div', { class: 'nm', text: loc(L.title) }),
          h('div', { class: 'sub', text: open ? (p ? t('best', { s: Math.round(p.score) }) : (inprog ? t('resume') : '')) : t('locked') })
        ]),
        open ? starsText(p ? p.stars : 0) : null
      ]);
      body.appendChild(btn);
    });
    body.appendChild(h('div', { class: 'region', style: 'opacity:.6;cursor:default' }, [
      h('div', { class: 'thumb', text: '…' }),
      h('div', { class: 'meta' }, [h('div', { class: 'nm', text: t('soon') }), h('div', { class: 'sub', text: t('soonText') })])
    ]));
    body.appendChild(h('h3', { class: 'sec', text: t('orlanNotes') }));
    var ns = h('div', { class: 'notes' }), any = false;
    LEVELS.forEach(function (L) {
      if (save.notes[L.id]) { any = true; ns.appendChild(h('div', { class: 'note' }, [h('small', { text: t('orlanNote', { n: L.id }) }), '« ' + loc(L.note) + ' »'])); }
    });
    if (!any) ns.appendChild(h('p', { class: 'help', text: t('noNotes') }));
    body.appendChild(ns);
    el.appendChild(body);
  }

  /* ───────────── briefing ───────────── */
  function openBriefing(idx) {
    var L = LEVELS[idx];
    if (save.inprogress[L.id]) { startLevel(idx, true); return; }
    var el = $('#briefing'); clear(el);
    el.className = 'screen gutter';
    el.appendChild(h('div', { class: 'scroll-card' }, [
      Art.src('scenes.' + (L.scene || '')) ? h('img', { class: 'scene', src: Art.src('scenes.' + L.scene), alt: '' }) : null,
      h('div', { class: 'parch' }, [
        Art.src('portraits.roi') ? h('img', { class: 'king', src: Art.src('portraits.roi'), alt: '' }) : null,
        h('span', { class: 'rg', text: t('region', { n: L.id }) }),
        h('h2', { text: loc(L.title) }),
        loc(L.king),
        h('div', { class: 'hint' }, [h('b', { text: t('kingHint') + ' : ' }), loc(L.hint)])
      ]),
      h('button', { class: 'btn primary', id: 'btn-start', text: t('start'), onclick: function () { sfx('pick'); startLevel(idx, false); } }),
      h('button', { class: 'linkbtn', text: t('back'), onclick: function () { go('atlas'); } })
    ]));
    S.screen = 'briefing';
    ['title', 'atlas', 'briefing', 'game'].forEach(function (n) { $('#' + n).classList.toggle('on', n === 'briefing'); });
  }

  /* ───────────── niveau ───────────── */
  function startLevel(idx, resume) {
    var L = LEVELS[idx]; S.levelIdx = idx; S.level = L; S.phase = 'play'; S.result = null; S.detailOpen = false;
    var ip = resume ? save.inprogress[L.id] : null;
    if (!resume) delete save.inprogress[L.id];
    S.placed = ip ? ip.placed || {} : {}; S.drawn = ip ? ip.drawn || {} : {};
    S.asked = ip ? ip.asked || {} : {}; S.scoutsUsed = ip ? ip.scoutsUsed || 0 : 0;
    S.suspects = ip ? ip.suspects || {} : {}; S.pins = ip ? ip.pins || {} : {};
    S.mode = 'move'; S.activePath = null; S.ghost = false; S.panel = 'tools'; S.openCard = null; S.selected = null; S.armed = null;
    S.undo = []; S.ruler = null; S.rulerUsed = false; S.tut = null; lastPanelKey = null;
    if (L.id === 1 && !save.tutDone && !ip) { S.tut = { step: 1 }; S.panel = 'notebook'; }
    save.started = true; persist();
    go('game'); renderAll();
  }
  function persistProgress() {
    if (S.phase !== 'play' || !S.level) return;
    save.inprogress[S.level.id] = { placed: S.placed, drawn: S.drawn, asked: S.asked, scoutsUsed: S.scoutsUsed, suspects: S.suspects, pins: S.pins };
    persist();
  }
  function snap() { S.undo.push(JSON.stringify({ p: S.placed, d: S.drawn })); if (S.undo.length > 40) S.undo.shift(); }
  function undo() {
    if (!S.undo.length || S.phase !== 'play') return;
    var o = JSON.parse(S.undo.pop()); S.placed = o.p; S.drawn = o.d; sfx('pick'); changed();
  }
  function changed() { persistProgress(); draw(); renderPanel(); renderHint(); tutCheck(); }

  /* ───────────── entrées du carnet ───────────── */
  function entries() {
    var L = S.level, out = [];
    L.witnesses.forEach(function (w) {
      w.statements.forEach(function (st, i) { out.push({ key: w.id + ':' + i, st: st, w: w, kind: 'say' }); });
      if (S.asked[w.id] && w.ask) out.push({ key: w.id + ':r', st: w.ask.st, w: w, kind: 'reply', reply: w.ask.reply });
    });
    L.scouts.slice(0, S.scoutsUsed).forEach(function (st, i) { out.push({ key: 'scout:' + i, st: st, w: {}, kind: 'scout' }); });
    return out;
  }
  function ctxOf(w) {
    return { pos: function (id) { return S.placed[id] || null; }, path: function (id) { return S.drawn[id] || null; }, scale: S.level.scale, witness: w || {} };
  }
  function evalEntry(e) { return Core.evalStatement(e.st, ctxOf(e.w)); }
  function shownEntries() {
    var all = entries(), pinned = all.filter(function (e) { return S.pins[e.key]; });
    if (pinned.length) return pinned;
    if (S.openCard) return all.filter(function (e) { return e.w && e.w.id === S.openCard; });
    return [];
  }
  function tokensLeft() {
    var L = S.level;
    return { ask: Math.max(0, L.tokens.ask - Object.keys(S.asked).length), scout: Math.max(0, Math.min(L.tokens.scout, L.scouts.length) - S.scoutsUsed) };
  }
  function placeById(id) { return S.level.places.filter(function (p) { return p.id === id; })[0]; }

  /* ───────────── construction de l'écran de jeu ───────────── */
  var cv, cx, cw = 0, ch = 0, dpr = 1;
  function buildGame() {
    var g = $('#game'); clear(g);
    g.appendChild(h('div', { class: 'topbar gutter' }, [
      h('button', { class: 'iconbtn', id: 'btn-exit', 'aria-label': t('atlas'), text: '←', onclick: function () { persistProgress(); go('atlas'); } }),
      h('h2', { id: 'g-title' }),
      h('button', { class: 'iconbtn', 'aria-label': t('settings'), text: '⚙', onclick: openSettings })
    ]));
    g.appendChild(h('div', { id: 'tut', class: 'gutter' }));
    var wrap = h('div', { id: 'mapwrap' }, [
      h('canvas', { id: 'map', 'aria-label': 'map' }),
      h('div', { class: 'mapfloat tr' }, [
        h('button', { id: 'z-in', 'aria-label': t('zoomIn'), text: '+', onclick: function () { zoomAt(cw / 2, ch / 2, 1.3); } }),
        h('button', { id: 'z-out', 'aria-label': t('zoomOut'), text: '−', onclick: function () { zoomAt(cw / 2, ch / 2, 1 / 1.3); } }),
        h('button', { id: 'z-fit', 'aria-label': t('recenter'), text: '⌖', onclick: function () { fitView(); draw(); } })
      ]),
      h('div', { id: 'ribbon' }),
      h('div', { id: 'hint', class: 'maphint', style: 'display:none' }),
      h('div', { id: 'maplegend', class: 'maplegend', style: 'display:none' })
    ]);
    g.appendChild(wrap);
    g.appendChild(h('div', { id: 'panel' }));
    g.appendChild(h('div', { id: 'bar', class: 'gutter' }));
    cv = $('#map'); cx = cv.getContext('2d');
    bindMap();
    if (window.ResizeObserver) new ResizeObserver(function () { resize(); draw(); }).observe(wrap);
    window.addEventListener('resize', function () { resize(); draw(); });
  }
  function resize() {
    if (!cv) return;
    var r = cv.parentNode.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var nw = Math.round(r.width), nh = Math.round(r.height); dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (nw !== cw || nh !== ch) { cw = nw; ch = nh; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); fitView(); }
  }
  function renderAll() { renderTop(); renderBar(); renderPanel(); renderHint(); renderRibbon(); renderTut(); readColors(); draw(); }
  /* Bandeau : les indices épinglés restent lisibles pendant qu'on place les tampons */
  function renderRibbon() {
    var el = $('#ribbon'); if (!el) return; clear(el);
    if (S.phase !== 'play' || !S.level) { el.style.display = 'none'; return; }
    var pinned = entries().filter(function (e) { return S.pins[e.key]; });
    if (!pinned.length) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    pinned.forEach(function (e) {
      var txt = e.kind === 'reply' ? e.reply : e.st.text;
      el.appendChild(h('button', { class: 'rb', 'aria-label': t('unpin'), onclick: function () { delete S.pins[e.key]; sfx('pick'); persistProgress(); draw(); renderPanel(); renderRibbon(); } }, [
        e.w && e.w.id ? portrait(e.w, 'xs') : (ico('jeton_eclaireur', 'xs') || null), h('span', { text: loc(txt) }), h('i', { text: '×' })
      ]));
    });
  }
  function renderTop() {
    if (!S.level) return;
    $('#g-title').textContent = S.level.id + ' · ' + loc(S.level.title);
  }
  function renderBar() {
    var b = $('#bar'); clear(b);
    if (S.phase === 'result') {
      var hasNext = LEVELS[S.levelIdx + 1] && S.result && S.result.stars >= 1;
      b.appendChild(h('button', { class: 'btn', id: 'btn-atlas', text: t('atlas'), onclick: function () { go('atlas'); } }));
      b.appendChild(h('button', { class: 'btn', id: 'btn-retry', text: t('retry'), onclick: function () { startLevel(S.levelIdx, false); } }));
      b.appendChild(h('button', { class: 'btn primary', id: 'btn-next', disabled: hasNext ? null : true, text: t('next'), onclick: function () { openBriefing(S.levelIdx + 1); } }));
      return;
    }
    b.appendChild(h('button', { class: 'btn' + (S.panel === 'notebook' ? ' active' : ''), id: 'btn-notebook', text: '📖 ' + t('notebook'), onclick: function () { S.panel = 'notebook'; sfx('pick'); renderBar(); renderPanel(); tutCheck(); } }));
    b.appendChild(h('button', { class: 'btn' + (S.panel === 'tools' ? ' active' : ''), id: 'btn-tools', text: '🧭 ' + t('tools'), onclick: function () { S.panel = 'tools'; sfx('pick'); renderBar(); renderPanel(); tutCheck(); } }));
    b.appendChild(h('button', { class: 'btn primary seal', id: 'btn-submit', text: '✒ ' + t('submit'), onclick: askSubmit }));
  }
  function renderHint() {
    var el = $('#hint'), txt = '';
    if (S.phase === 'play') {
      if (S.mode === 'ruler') txt = t('rulerHint');
      else if (S.mode === 'draw' && S.activePath) txt = t('drawHint', { name: loc(S.level.paths.filter(function (p) { return p.id === S.activePath; })[0].name) });
      else if (S.armed) txt = t('armHint', { name: loc(placeById(S.armed).name) });
    }
    el.style.display = txt ? 'block' : 'none'; el.textContent = txt;
    var lg = $('#maplegend');
    if (S.phase === 'result') {
      lg.style.display = 'flex'; clear(lg);
      lg.appendChild(h('span', {}, [h('i', { style: 'border-color:#d9a93a;border-top-style:dashed' }), t('legendTruth')]));
      lg.appendChild(h('span', {}, [h('i', { style: 'border-color:#6fa3c4' }), t('legendYours')]));
    } else lg.style.display = 'none';
  }

  /* ───────────── panneau : outils ───────────── */
  var lastPanelKey = null;
  function renderPanel() {
    var p = $('#panel'); if (!p || !S.level) return;
    var key = S.phase === 'result' ? 'result' : S.panel + ':' + S.level.id, st = key === lastPanelKey ? p.scrollTop : 0;
    lastPanelKey = key;
    clear(p);
    if (S.phase === 'result') renderResult(p);
    else if (S.panel === 'notebook') renderNotebook(p);
    else renderTools(p);
    p.scrollTop = st;
  }
  function chipImage(type) {
    var s = Art.src('stamps.' + type); if (s) return h('img', { src: s, alt: '', draggable: 'false' });
    return chipCanvas(type);
  }
  function chipCanvas(type) {
    var c = document.createElement('canvas'); c.width = c.height = 76;
    Art.glyph(c.getContext('2d'), type, 38, 40, 29, '#cdb98c'); return c;
  }
  function renderTools(p) {
    var L = S.level, pad = h('div', { class: 'pad gutter' });
    pad.appendChild(h('h3', { text: t('stampsTitle') }));
    if (!Object.keys(S.placed).length) pad.appendChild(h('p', { class: 'help', text: t('stampsHelp') }));
    var chips = h('div', { class: 'chips' });
    L.places.forEach(function (pl) {
      var done = !!S.placed[pl.id];
      var chip = h('div', { class: 'chip' + (done ? ' done' : '') + (S.armed === pl.id ? ' armed' : ''), role: 'button', tabindex: '0', 'data-id': pl.id,
        'aria-label': loc(pl.name) + ' — ' + (done ? t('placed') : t('notPlaced')) }, [
        chipImage(pl.type), h('span', { text: loc(pl.name) }), done ? h('b', { class: 'ck', text: '✓' }) : null
      ]);
      chip.addEventListener('pointerdown', function (e) { chipDown(e, pl); });
      chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.armed = S.armed === pl.id ? null : pl.id; renderPanel(); renderHint(); } });
      chips.appendChild(chip);
    });
    pad.appendChild(chips);

    if (L.paths.length) {
      pad.appendChild(h('h3', { text: t('pathsTitle') }));
      if (!Object.keys(S.drawn).length) pad.appendChild(h('p', { class: 'help', text: t('pathsHelp') }));
      var tg = h('div', { class: 'tools' });
      L.paths.forEach(function (pa) {
        var has = S.drawn[pa.id] && S.drawn[pa.id].length >= 2;
        tg.appendChild(h('button', { class: 'tool' + (S.mode === 'draw' && S.activePath === pa.id ? ' on' : ''), 'data-path': pa.id, style: 'grid-column: span 2',
          onclick: function () { if (S.mode === 'draw' && S.activePath === pa.id) { S.mode = 'move'; S.activePath = null; } else { S.mode = 'draw'; S.activePath = pa.id; } sfx('pick'); renderPanel(); renderHint(); } }, [
          h('b', {}, [ico('plume') || '✏️']), t('drawPath', { name: loc(pa.name) }) + ' · ' + (has ? t('drawn') : t('notDrawn'))
        ]));
        tg.appendChild(h('button', { class: 'tool', disabled: has ? null : true, 'data-erase': pa.id, onclick: function () { snap(); delete S.drawn[pa.id]; sfx('low'); changed(); } }, [h('b', {}, [ico('eponge') || '🧽']), t('eraseStroke')]));
      });
      pad.appendChild(tg);
    }

    pad.appendChild(h('h3', { text: t('toolsTitle') }));
    var sel = S.selected && S.placed[S.selected] ? S.selected : null;
    var tools = h('div', { class: 'tools' }, [
      h('button', { class: 'tool' + (S.mode === 'move' ? ' on' : ''), id: 't-move', onclick: function () { S.mode = 'move'; S.activePath = null; renderPanel(); renderHint(); } }, [h('b', { text: '✋' }), t('move')]),
      h('button', { class: 'tool' + (S.mode === 'ruler' ? ' on' : ''), id: 't-ruler', onclick: function () { S.mode = S.mode === 'ruler' ? 'move' : 'ruler'; S.activePath = null; S.armed = null; sfx('pick'); renderPanel(); renderHint(); } }, [h('b', {}, [ico('regle') || '📏']), t('ruler')]),
      h('button', { class: 'tool' + (S.ghost ? ' on' : ''), id: 't-ghost', onclick: function () { S.ghost = !S.ghost; sfx('pick'); draw(); renderPanel(); } }, [h('b', {}, [ico('loupe') || '👁']), t('ghost')]),
      h('button', { class: 'tool', id: 't-undo', disabled: S.undo.length ? null : true, onclick: undo }, [h('b', { text: '↶' }), t('undo')]),
      h('button', { class: 'tool', id: 't-remove', disabled: sel ? null : true, onclick: function () { if (!sel) return; snap(); delete S.placed[sel]; S.selected = null; sfx('low'); changed(); } }, [h('b', { text: '🗑' }), t('removeStamp')]),
      h('button', { class: 'tool', id: 't-fit', onclick: function () { fitView(); draw(); } }, [h('b', { text: '⌖' }), t('recenter')])
    ]);
    pad.appendChild(tools);
    if (S.ghost) pad.appendChild(h('div', { class: 'legend' }, [h('span', { text: t('ghostLegend') })]));
    p.appendChild(pad);
  }

  /* ───────────── panneau : carnet ───────────── */
  function badgeFor(status) {
    if (status === 'ok') return h('span', { class: 'badge ok', title: t('statusOk'), 'aria-label': t('statusOk'), text: '✓' });
    if (status === 'ko') return h('span', { class: 'badge ko', title: t('statusKo'), 'aria-label': t('statusKo') }, [h('i', { text: '✗' })]);
    return h('span', { class: 'badge na', title: t('statusNa'), 'aria-label': t('statusNa'), text: '·' });
  }
  function stmtRow(e) {
    var pinned = !!S.pins[e.key];
    var tag = e.kind === 'reply' ? t('reply') : (e.kind === 'scout' ? t('scoutVerified') : null);
    var txt = e.kind === 'reply' ? e.reply : e.st.text;
    var togglePin = function () { if (S.pins[e.key]) delete S.pins[e.key]; else S.pins[e.key] = true; sfx('pick'); persistProgress(); draw(); renderPanel(); renderRibbon(); };
    var row = h('div', { class: 'stmt' + (pinned ? ' pinned' : ''), 'data-key': e.key, onclick: togglePin }, [
      h('div', { class: 'tx' }, [tag ? h('small', { text: tag }) : null, '« ' + loc(txt) + ' »']),
      h('button', { class: 'pinbtn' + (pinned ? ' on' : ''), 'aria-pressed': pinned ? 'true' : 'false', 'aria-label': pinned ? t('unpin') : t('pin'), text: pinned ? '★' : '☆',
        })
    ]);
    return row;
  }
  function renderNotebook(p) {
    var L = S.level, left = tokensLeft(), pad = h('div', { class: 'pad gutter' });
    var tb = h('div', { class: 'tokenbar' }, [
      h('button', { class: 'btn small', id: 'btn-scout', disabled: left.scout > 0 ? null : true, onclick: useScout }, [ico('jeton_eclaireur', 'sm') || '🔭', ' ' + t('scout', { n: left.scout })]),
      h('button', { class: 'btn small' + (S.ghost ? ' brass' : ''), id: 'btn-ghost', 'aria-pressed': S.ghost ? 'true' : 'false', onclick: function () { S.ghost = !S.ghost; sfx('pick'); draw(); renderPanel(); } }, [ico('loupe', 'sm') || '👁', ' ' + t('ghost')])
    ]);
    pad.appendChild(tb);
    if (!S.scoutsUsed && !Object.keys(S.asked).length) pad.appendChild(h('p', { class: 'help', text: t('tokenHelp') }));
    if (S.scoutsUsed) {
      var sc = h('div', { class: 'card open' }, [
        h('div', { class: 'inner', style: 'padding-top:12px' }, [h('h3', {}, [ico('jeton_eclaireur', 'sm') || '🔭', ' ' + t('scoutCardTitle')])].concat(
          entries().filter(function (e) { return e.kind === 'scout'; }).map(stmtRow)))
      ]);
      pad.appendChild(sc);
    }
    L.witnesses.forEach(function (w) {
      var open = S.openCard === w.id;
      var ents = entries().filter(function (e) { return e.w && e.w.id === w.id; });
      var card = h('div', { class: 'card' + (open ? ' open' : ''), 'data-w': w.id }, [
        h('button', { class: 'card-h', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px;min-height:56px;width:100%;background:none;border:0;text-align:left;cursor:pointer;color:inherit', 'aria-expanded': open ? 'true' : 'false',
          onclick: function () { S.openCard = open ? null : w.id; sfx('pick'); draw(); renderPanel(); tutCheck(); } }, [
          portrait(w, 'card'),
          h('span', { class: 'who' }, [h('b', { text: loc(w.name) }), h('i', { text: loc(w.job) + (S.suspects[w.id] ? ' · ⚑ ' + t('suspected') : '') })]),
          h('span', { class: 'chev', text: '›' })
        ])
      ]);
      var inner = h('div', { class: 'inner' });
      inner.appendChild(h('p', { class: 'trait', text: loc(w.trait) }));
      if (!Object.keys(S.pins).length) inner.appendChild(h('p', { class: 'help', text: t('tapPin') }));
      ents.forEach(function (e) { inner.appendChild(stmtRow(e)); });
      var asked = !!S.asked[w.id];
      var canAsk = !asked && left.ask > 0;
      inner.appendChild(h('div', { class: 'actions' }, [
        h('button', { class: 'btn small', 'data-ask': w.id, disabled: canAsk ? null : true, onclick: function () { askWitness(w); } }, [!asked && left.ask > 0 ? ico('jeton_question', 'sm') : null, ' ' + (asked ? t('alreadyAsked') : (left.ask > 0 ? t('ask', { n: left.ask }) : t('noToken')))])
      ]));
      var lab = h('label', { class: 'check' }, [
        h('input', { type: 'checkbox', 'data-suspect': w.id, checked: S.suspects[w.id] ? true : null, onchange: function (ev) { if (ev.target.checked) S.suspects[w.id] = true; else delete S.suspects[w.id]; sfx('pick'); persistProgress(); renderPanel(); } }),
        h('span', { text: t('suspect') })
      ]);
      inner.appendChild(lab);
      card.appendChild(inner);
      pad.appendChild(card);
    });
    p.appendChild(pad);
  }
  function askWitness(w) {
    var left = tokensLeft(); if (S.asked[w.id] || left.ask < 1 || !w.ask) return;
    S.asked[w.id] = true; sfx('chime'); buzz(15);
    S.pins[w.id + ':r'] = true;
    persistProgress(); draw(); renderPanel(); tutCheck();
  }
  function useScout() {
    var left = tokensLeft(); if (left.scout < 1) return;
    S.scoutsUsed++; S.pins['scout:' + (S.scoutsUsed - 1)] = true; sfx('chime'); buzz(15);
    persistProgress(); draw(); renderPanel(); tutCheck();
  }

  /* ───────────── tutoriel ───────────── */
  var TUT_N = 6;
  function tutDone(step) {
    if (!S.tut) return false;
    switch (step) {
      case 1: return S.openCard === 'odo';
      case 2: return !!S.placed.moulin_haut;
      case 3: return !!S.placed.moulin_haut;
      case 4: return S.rulerUsed;
      case 5: return Object.keys(S.asked).length > 0;
      default: return false;
    }
  }
  function tutCheck() {
    if (!S.tut || S.phase !== 'play') return;
    var moved = false;
    while (S.tut && S.tut.step < TUT_N && tutDone(S.tut.step)) { S.tut.step++; moved = true; }
    if (moved) sfx('pick');
    renderTut();
  }
  function tutEnd() { S.tut = null; save.tutDone = true; persist(); renderTut(); }
  function renderTut() {
    var el = $('#tut'); if (!el) return; clear(el);
    if (!S.tut || S.phase !== 'play') { el.classList.remove('on'); return; }
    var step = S.tut.step, last = step >= TUT_N;
    el.classList.add('on');
    el.appendChild(h('div', { class: 't' }, [h('small', { text: t('tutStep', { i: step, n: TUT_N }) }), t('tut' + step)]));
    el.appendChild(h('button', { class: 'skip', text: t('tutSkip'), onclick: tutEnd }));
    el.appendChild(h('button', { id: 'tut-next', text: last ? t('tutDone') : t('tutNext'), onclick: function () { if (last) tutEnd(); else { S.tut.step++; renderTut(); } } }));
  }

  /* ───────────── remise & résultat ───────────── */
  function missingCount() {
    var L = S.level, n = 0;
    L.places.forEach(function (p) { if (!S.placed[p.id]) n++; });
    L.paths.forEach(function (p) { if (!(S.drawn[p.id] && S.drawn[p.id].length >= 2)) n++; });
    return n;
  }
  function askSubmit() {
    if (S.phase !== 'play') return;
    var miss = missingCount();
    modal([
      h('h2', { text: t('confirm') }),
      h('p', { text: miss ? t('missing', { n: miss }) : t('completeSure') }),
      h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn', id: 'btn-notyet', text: t('notYet'), onclick: closeModal }),
        h('button', { class: 'btn primary', id: 'btn-confirm', text: t('handIn'), onclick: function () { closeModal(); doSubmit(); } })
      ])
    ]);
  }
  function doSubmit() {
    var L = S.level;
    var sc = Core.score(L, S.placed, S.drawn);
    var stars = Core.stars(sc.score, L, S.suspects);
    var prev = save.progress[L.id], isBest = !prev || sc.score > prev.score;
    var thumb = makeThumb();
    var entry = prev ? clone(prev) : { score: 0, stars: 0, noScout: false, thumb: null };
    if (isBest) { entry.score = sc.score; if (thumb) entry.thumb = thumb; }
    entry.stars = Math.max(entry.stars, stars);
    if (S.scoutsUsed === 0 && stars >= 1) entry.noScout = true;
    save.progress[L.id] = entry;
    if (stars >= 1) save.notes[L.id] = true;
    delete save.inprogress[L.id];
    persist();
    S.result = { sc: sc, stars: stars, isBest: isBest && !!prev, noScout: S.scoutsUsed === 0 };
    S.phase = 'result'; S.mode = 'move'; S.armed = null; S.selected = null; S.ruler = null; S.tut = null;
    sfx('chime'); buzz([30, 40, 30]);
    fitView(); renderAll();
  }
  function renderResult(p) {
    var L = S.level, R = S.result, sc = R.sc, pad = h('div', { class: 'pad gutter', id: 'result' });
    var anim = !R.shown; R.shown = true;
    var kimg = Art.src('portraits.roi');
    pad.appendChild(h('div', { class: 'kingsay' }, [
      kimg ? h('img', { class: 'portrait md', src: kimg, alt: '' }) : null,
      h('div', {}, [h('h3', { text: t('resultTitle') }), h('p', { text: t(sc.score >= 88 && R.stars < 3 ? 'kingSayLiar' : 'kingSay' + R.stars) })])
    ]));
    var stars = h('div', { class: 'stars', 'aria-label': t('stars', { n: R.stars }) });
    starImgs(R.stars, 'big', anim).forEach(function (x) { stars.appendChild(x); });
    pad.appendChild(stars);
    if (anim) for (var si = 0; si < R.stars; si++) (function (k) { setTimeout(function () { if (S.phase === 'result') { sfx('star'); buzz(14); } }, 600 + k * 420); })(si);
    var okCount = 0, placeTotal = L.places.length;
    sc.items.forEach(function (it) { if (it.kind === 'place' && it.verdict === 'ok') okCount++; });
    pad.appendChild(h('div', { class: 'scoreline', id: 'scoreline', text: t('result', { s: String(Math.round(sc.score)), ok: okCount, t: placeTotal }) }));
    var vr = h('div', { class: 'verdicts' });
    sc.items.forEach(function (it) {
      var nm, vis;
      if (it.kind === 'place') { var pl0 = placeById(it.id); nm = loc(pl0.name); var ss = Art.src('stamps.' + pl0.type); vis = ss ? h('img', { src: ss, alt: '' }) : h('b', { text: '•' }); }
      else { nm = loc(L.paths.filter(function (x) { return x.id === it.id; })[0].name); vis = h('b', { class: 'wave', text: '〰' }); }
      var sym = it.err == null ? '–' : (it.verdict === 'ok' ? '✓' : (it.verdict === 'near' ? '≈' : '✗'));
      vr.appendChild(h('div', { class: 'vchip ' + (it.err == null ? 'missing' : it.verdict), title: nm }, [vis, h('span', { class: 'vn', text: nm }), h('i', { text: sym })]));
    });
    pad.appendChild(vr);
    if (R.isBest) pad.appendChild(h('div', { class: 'scoreline', style: 'color:var(--brass)', text: t('newBest') }));
    if (R.noScout && R.stars >= 1) pad.appendChild(h('div', { class: 'scoreline', style: 'font-size:.9em;color:var(--muted)', text: '🔭✗ ' + t('noScoutBadge') }));
    if (sc.score >= 88 && R.stars < 3) pad.appendChild(h('p', { class: 'help', text: t('thirdStarNeed') }));

    if (L.faulty.length) {
      pad.appendChild(h('h3', { text: t('liarsTitle') }));
      L.faulty.forEach(function (id) {
        var w = L.witnesses.filter(function (x) { return x.id === id; })[0];
        pad.appendChild(h('div', { class: 'liar' }, [
          portrait(w, 'sm'), h('b', { text: ' ' + loc(w.name) }), ' — ', h('span', { text: S.suspects[id] ? '⚑ ' + t('unmasked') : t('unnoticed') }),
          h('div', { style: 'margin-top:6px', text: t('liar', { name: loc(w.name), motif: loc(w.why) }) })
        ]));
      });
      L.witnesses.forEach(function (w) {
        if (S.suspects[w.id] && L.faulty.indexOf(w.id) < 0) pad.appendChild(h('p', { class: 'help', text: t('falseSuspect', { name: loc(w.name) }) }));
      });
    }
    if (R.stars >= 1) pad.appendChild(h('div', { class: 'orlan' }, [h('small', { text: t('orlanNote', { n: L.id }) }), '« ' + loc(L.note) + ' »']));
    pad.appendChild(h('p', { class: 'help', style: 'font-style:italic', text: loc(L.outro) }));

    pad.appendChild(h('button', { class: 'linkbtn', id: 'btn-detail', text: S.detailOpen ? t('detailHide') : t('detailShow'), onclick: function () { S.detailOpen = !S.detailOpen; renderPanel(); } }));
    if (S.detailOpen) {
      var box = h('div');
      sc.items.forEach(function (it) {
        var name, vlab, vcls = it.verdict;
        if (it.kind === 'place') name = loc(placeById(it.id).name); else name = loc(L.paths.filter(function (x) { return x.id === it.id; })[0].name);
        vlab = it.err == null ? t('vMissing') : (it.verdict === 'ok' ? t('vOk') : (it.verdict === 'near' ? t('vNear') : t('vKo')));
        box.appendChild(h('div', { class: 'row' }, [
          h('span', { class: 'nm', text: name }),
          it.err != null && it.kind === 'place' ? h('span', { class: 'sc', text: t('gap', { d: I.days(it.err / L.scale).replace(/ .*/, '') }) }) : null,
          h('span', { class: 'verd ' + vcls, text: (it.verdict === 'ok' ? '✓ ' : it.verdict === 'near' ? '~ ' : '✗ ') + vlab })
        ]));
      });
      pad.appendChild(box);
    }
    if (!LEVELS[S.levelIdx + 1]) pad.appendChild(h('p', { class: 'help', text: t('endOfV0') }));
    pad.appendChild(h('button', { class: 'btn', id: 'btn-export', text: '🖼 ' + t('export_'), onclick: exportPNG }));
    p.appendChild(pad);
  }

  /* ───────────── export & vignette ───────────── */
  function fitFor(W, H, ratio) { var s0 = Math.min(W, H) * (ratio || .9) / 100; return { z: 1, s0: s0, ox: (W - 100 * s0) / 2, oy: (H - 100 * s0) / 2 }; }
  function makeThumb() {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 168;
      var x = c.getContext('2d'); paint(x, 168, 168, fitFor(168, 168, .86), { u: .5, thumb: true });
      return c.toDataURL('image/jpeg', .6);
    } catch (e) { return null; }
  }
  function exportPNG() {
    try {
      var W = 1080, H = 1300, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'); x.fillStyle = '#15242c'; x.fillRect(0, 0, W, H);
      var m = document.createElement('canvas'); m.width = W; m.height = W;
      paint(m.getContext('2d'), W, W, fitFor(W, W, .88), { u: 2.3, result: S.result });
      x.drawImage(m, 0, 0);
      x.fillStyle = '#eadfc0'; x.textAlign = 'center'; x.font = '54px ' + FONT;
      x.fillText(loc(S.level.title), W / 2, W + 62);
      x.fillStyle = '#d2a94b'; x.font = '44px ' + FONT;
      var st = ''; for (var i = 0; i < 3; i++) st += i < S.result.stars ? '★' : '☆';
      x.fillText(st + '  ' + Math.round(S.result.sc.score) + ' %', W / 2, W + 124);
      x.fillStyle = '#a9b9b4'; x.font = '30px ' + FONT; x.fillText('Keismey Studio · ' + t('title'), W / 2, W + 176);
      var url = c.toDataURL('image/png');
      modal([
        h('h2', { text: t('exportTitle') }),
        h('img', { src: url, alt: '', style: 'width:100%;border-radius:6px;-webkit-user-select:auto;user-select:auto;-webkit-touch-callout:default' }),
        h('p', { class: 'help', text: t('holdToSave') }),
        h('div', { class: 'btnrow' }, [
          h('a', { class: 'btn', href: url, download: 'cartographe-' + S.level.id + '.png', style: 'text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center', text: t('download') }),
          h('button', { class: 'btn primary', text: t('close'), onclick: closeModal })
        ])
      ]);
    } catch (e) { toast(t('exportFail')); }
  }

  /* ───────────── réglages ───────────── */
  function applySettings() {
    var s = save.settings;
    I.set(s.lang || 'fr'); document.documentElement.lang = I.lang;
    document.documentElement.style.setProperty('--fs', [1, 1.15, 1.3][s.textSize] || 1);
    document.documentElement.setAttribute('data-cb', s.cb ? '1' : '0');
    document.title = t('title'); readColors();
  }
  function refreshUI() {
    applySettings(); buildTitle();
    if (S.screen === 'atlas') renderAtlas();
    if (S.screen === 'game' && S.level) renderAll();
    if (S.screen === 'briefing') openBriefing(S.levelIdx);
  }
  function seg(opts, cur, on) {
    return h('div', { class: 'seg' }, opts.map(function (o) { return h('button', { class: 'btn' + (String(cur) === String(o[0]) ? ' on' : ''), text: o[1], onclick: function () { on(o[0]); } }); }));
  }
  function openSettings() {
    var s = save.settings;
    modal([
      h('h2', { text: t('settingsTitle') }),
      h('div', { class: 'setrow' }, [h('span', { text: t('lang') }), seg([['fr', 'Français'], ['en', 'English']], I.lang, function (v) { s.lang = v; persist(); refreshUI(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('textSize') }), seg([[0, 'A'], [1, 'A+'], [2, 'A++']], s.textSize, function (v) { s.textSize = +v; persist(); refreshUI(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('colorblind') }), seg([['0', t('off')], ['1', t('on')]], s.cb ? '1' : '0', function (v) { s.cb = v === '1'; persist(); refreshUI(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('sound') }), seg([['1', t('on')], ['0', t('off')]], s.sound ? '1' : '0', function (v) { s.sound = v === '1'; persist(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('vibration') }), seg([['1', t('on')], ['0', t('off')]], s.vibrate ? '1' : '0', function (v) { s.vibrate = v === '1'; persist(); openSettings(); })]),
      h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn', id: 'btn-saveio', text: t('exportSave') + ' / ' + t('importSave'), onclick: openSaveIO }),
        h('button', { class: 'btn', id: 'btn-reset', text: t('reset'), onclick: openReset })
      ]),
      h('p', { class: 'help', text: t('about') }),
      h('button', { class: 'btn primary', id: 'btn-close', text: t('close'), onclick: closeModal })
    ]);
  }
  function openSaveIO() {
    var ta = h('textarea', { id: 'save-text', 'aria-label': t('saveText') });
    ta.value = JSON.stringify(save);
    modal([
      h('h2', { text: t('exportSave') + ' / ' + t('importSave') }),
      h('p', { class: 'help', text: t('saveText') }),
      ta,
      h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn', text: t('copy'), onclick: function () { try { navigator.clipboard.writeText(ta.value).then(function () { toast(t('copied')); }, function () { ta.select(); }); } catch (e) { ta.select(); } } }),
        h('button', { class: 'btn', text: t('importBtn'), onclick: function () {
          try { var o = JSON.parse(ta.value); if (!o || typeof o !== 'object' || !o.v) throw 0; save = deepMerge(defaultSave(), o); persist(); closeModal(); refreshUI(); toast(t('savedOk')); }
          catch (e) { toast(t('importFail')); } } })
      ]),
      h('button', { class: 'btn primary', text: t('close'), onclick: openSettings })
    ]);
  }
  function openReset() {
    modal([
      h('h2', { text: t('reset') }),
      h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn', text: t('notYet'), onclick: openSettings }),
        h('button', { class: 'btn primary', id: 'btn-reset-yes', text: t('resetYes'), onclick: function () {
          var lang = save.settings; save = defaultSave(); save.settings = lang; try { localStorage.removeItem(KEY); } catch (e) {} persist(); S.level = null; closeModal(); buildTitle(); go('title'); } })
      ])
    ]);
  }

  /* ───────────── vue (zoom / déplacement) ───────────── */
  function SC() { return view.s0 * view.z; }
  function w2s(p) { return { x: view.ox + p.x * SC(), y: view.oy + (100 - p.y) * SC() }; }
  function s2w(x, y) { return { x: (x - view.ox) / SC(), y: 100 - (y - view.oy) / SC() }; }
  function fitView() { view = fitFor(cw || 360, ch || 360, .86); }
  function clampView() {
    var s = SC(), size = 100 * s, m;
    if (size <= cw) view.ox = (cw - size) / 2; else { m = cw * .12; view.ox = clamp(view.ox, cw - size - m, m); }
    if (size <= ch) view.oy = (ch - size) / 2; else { m = ch * .12; view.oy = clamp(view.oy, ch - size - m, m); }
  }
  function zoomAt(px, py, f) {
    var w = s2w(px, py); view.z = clamp(view.z * f, 1, 3.6);
    var s = SC(); view.ox = px - w.x * s; view.oy = py - (100 - w.y) * s; clampView(); draw();
  }

  /* ───────────── rendu du parchemin ───────────── */
  var dirty = false;
  function draw() { if (dirty) return; dirty = true; requestAnimationFrame(function () { dirty = false; if (!cx || !S.level || S.screen !== 'game') return; animating = false; cx.setTransform(dpr, 0, 0, dpr, 0, 0); paint(cx, cw, ch, view, { u: 1, interactive: true, result: S.phase === 'result' ? S.result : null }); if (animating) draw(); }); }

  function mark(c, x, y, status, u) {
    var r = 9 * u; c.save(); c.lineWidth = 2 * u;
    if (status === 'ok') { c.fillStyle = COL.ok; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x - r * .5, y); c.lineTo(x - r * .1, y + r * .45); c.lineTo(x + r * .55, y - r * .4); c.stroke(); }
    else if (status === 'ko') { c.fillStyle = COL.ko; c.beginPath(); c.moveTo(x, y - r * 1.15); c.lineTo(x + r * 1.15, y); c.lineTo(x, y + r * 1.15); c.lineTo(x - r * 1.15, y); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x - r * .4, y - r * .4); c.lineTo(x + r * .4, y + r * .4); c.moveTo(x + r * .4, y - r * .4); c.lineTo(x - r * .4, y + r * .4); c.stroke(); }
    else if (status === 'near') { c.fillStyle = COL.near; c.beginPath(); c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 1.05, y + r * .8); c.lineTo(x - r * 1.05, y + r * .8); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x - r * .45, y + r * .2); c.quadraticCurveTo(x - r * .2, y - r * .25, x, y + r * .15); c.quadraticCurveTo(x + r * .2, y + r * .5, x + r * .45, y); c.stroke(); }
    else { c.fillStyle = 'rgba(70,55,35,.6)'; c.beginPath(); c.arc(x, y, r * .45, 0, 6.3); c.fill(); }
    c.restore();
  }
  function statusColor(s) { return s === 'ok' ? COL.ok : (s === 'ko' ? COL.ko : 'rgba(70,55,35,.55)'); }

  /* Tampon : sprite illustré, ombre, point d'ancrage exact (le centre du sprite) */
  var animating = false, lastBadge = null;
  function popScale(id) {
    var t0 = S.pop && S.pop[id]; if (!t0) return 1;
    var k = (performance.now() - t0) / 420;
    if (k >= 1) { delete S.pop[id]; return 1; }
    animating = true;
    var e = 1 - Math.pow(1 - k, 3);                     /* ease-out */
    return 1 + (1 - e) * .55 * Math.cos(k * 5.5);       /* léger rebond */
  }
  function stamp(c, x, y, pl, o) {
    var R = o.R, im = Art.img('stamps.' + pl.type), meta = Art.asset('stamps.' + pl.type), k = o.pop || 1;
    c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (im && im._ok && meta) {
      var sz = R * 3.2 * k, m = Math.max(meta.w, meta.h), w = meta.w / m * sz, hh = meta.h / m * sz;
      if (!o.ghost) { c.fillStyle = 'rgba(40,26,8,.22)'; c.beginPath(); c.ellipse(x + 1, y + hh * .36, w * .42, hh * .13, 0, 0, 6.3); c.fill(); }
      if (o.ghost) c.globalAlpha *= .72;
      c.drawImage(im, x - w / 2, y - hh / 2, w, hh);
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.fillStyle = o.ghost ? '#b5851c' : '#8a2f1d'; c.strokeStyle = '#f4ead0'; c.lineWidth = Math.max(1, R * .07);
      c.beginPath(); c.arc(x, y, Math.max(2.5, R * .13), 0, 6.3); c.fill(); c.stroke();
    } else {
      c.fillStyle = o.ghost ? 'rgba(241,231,200,.55)' : '#f1e7c8'; c.beginPath(); c.arc(x, y, R, 0, 6.3); c.fill();
      c.lineWidth = Math.max(1.5, R * .09); c.strokeStyle = o.ghost ? '#b5851c' : Art.INK;
      if (o.ghost) c.setLineDash([R * .3, R * .25]);
      c.stroke(); c.setLineDash([]);
      Art.glyph(c, pl.type, x, y + R * .04, R * .68, '#cdb98c');
    }
    if (o.selected) {
      c.strokeStyle = '#d2a94b'; c.lineWidth = Math.max(3, R * .2); c.beginPath(); c.arc(x, y, R * 1.45, 0, 6.3); c.stroke();
      if (o.badge) {
        var bx = x + R * 1.55, by = y - R * 1.55, br = Math.max(11, R * .55); lastBadge = { x: bx, y: by, r: br };
        c.fillStyle = '#b8402a'; c.strokeStyle = '#f4ead0'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, br, 0, 6.3); c.fill(); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = Math.max(2, br * .2); c.beginPath(); c.moveTo(bx - br * .38, by - br * .38); c.lineTo(bx + br * .38, by + br * .38); c.moveTo(bx + br * .38, by - br * .38); c.lineTo(bx - br * .38, by + br * .38); c.stroke();
      }
    }
    c.restore();
    if (o.q) o.q.push({ x: x, y: y, R: R, pl: pl, ghost: o.ghost, alpha: o.alpha == null ? 1 : o.alpha });
  }
  /* Étiquettes : on essaie dessous, dessus, à droite, à gauche, et on évite tampons et autres étiquettes */
  function layoutLabels(c, Q, W, H) {
    var placed = [], blocks = Q.map(function (q) { return { x: q.x - q.R * 1.3, y: q.y - q.R * 1.3, w: q.R * 2.6, h: q.R * 2.6 }; });
    function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    Q.forEach(function (q) {
      var fs = Math.max(11, q.R * .78), name = loc(q.pl.name);
      c.font = 'italic ' + fs + 'px ' + FONT; var tw = c.measureText(name).width, th = fs * 1.15, g = q.R * 1.35 + 2;
      var cands = [
        { x: q.x - tw / 2, y: q.y + g, a: 'center' }, { x: q.x - tw / 2, y: q.y - g - th, a: 'center' },
        { x: q.x + q.R * 1.5, y: q.y - th / 2, a: 'left' }, { x: q.x - q.R * 1.5 - tw, y: q.y - th / 2, a: 'left' }
      ], pick = cands[0], i;
      for (i = 0; i < cands.length; i++) {
        var r = { x: cands[i].x - 2, y: cands[i].y - 1, w: tw + 4, h: th + 2 }, bad = r.x < 2 || r.y < 2 || r.x + r.w > W - 2 || r.y + r.h > H - 2;
        for (var k = 0; k < placed.length && !bad; k++) if (hit(r, placed[k])) bad = true;
        for (k = 0; k < blocks.length && !bad; k++) if (blocks[k].x !== q.x - q.R * 1.3 || blocks[k].y !== q.y - q.R * 1.3) { if (hit(r, blocks[k])) bad = true; }
        if (!bad) { pick = cands[i]; break; }
      }
      placed.push({ x: pick.x - 2, y: pick.y - 1, w: tw + 4, h: th + 2 });
      c.save(); c.globalAlpha = q.alpha; c.textAlign = 'left'; c.textBaseline = 'top';
      c.lineJoin = 'round'; c.lineWidth = fs * .38; c.strokeStyle = 'rgba(238,226,190,.92)'; c.strokeText(name, pick.x, pick.y);
      c.fillStyle = q.ghost ? '#8a6212' : '#2f2314'; c.fillText(name, pick.x, pick.y);
      c.restore();
    });
  }

  function wedge(c, g, B, cap, tol, r1, r2, col, status) {
    var p = g.P(B), a1 = -(Core.CAPS[cap] + tol) * Math.PI / 180, a2 = -(Core.CAPS[cap] - tol) * Math.PI / 180;
    c.save(); c.globalAlpha = .16; c.fillStyle = col;
    c.beginPath(); c.arc(p.x, p.y, r2 * g.sc, a1, a2); if (r1 > 0) c.arc(p.x, p.y, r1 * g.sc, a2, a1, true); else c.lineTo(p.x, p.y); c.closePath(); c.fill();
    c.globalAlpha = .55; c.lineWidth = 1.5 * g.u; c.setLineDash([5 * g.u, 4 * g.u]); c.strokeStyle = col; c.stroke(); c.restore();
  }
  function ringAt(c, g, B, r1, r2, col, status) {
    var p = g.P(B); c.save(); c.globalAlpha = .17; c.fillStyle = col;
    c.beginPath(); c.arc(p.x, p.y, r2 * g.sc, 0, 6.3); if (r1 > 0) c.arc(p.x, p.y, r1 * g.sc, 6.3, 0, true); c.fill();
    c.globalAlpha = .55; c.lineWidth = 1.5 * g.u; c.setLineDash([5 * g.u, 4 * g.u]); c.strokeStyle = col; c.beginPath(); c.arc(p.x, p.y, r2 * g.sc, 0, 6.3); c.stroke(); c.restore();
  }
  function arrow(c, a, b, u) {
    var ang = Math.atan2(b.y - a.y, b.x - a.x), L = 9 * u;
    c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - L * Math.cos(ang - .4), b.y - L * Math.sin(ang - .4)); c.moveTo(b.x, b.y); c.lineTo(b.x - L * Math.cos(ang + .4), b.y - L * Math.sin(ang + .4)); c.stroke();
  }
  function ghostFor(c, g, e) {
    var st = e.st, r = { status: 'na' }, col = '#8a5f10', u = g.u, P = g.P, mark = function () {};
    var bias = st.exact ? 1 : ((e.w && e.w.bias && e.w.bias.dist) || 1), scale = S.level.scale;
    c.save(); c.lineWidth = 3 * u; c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
    function line(A, B) {
      var a = P(A), b = P(B);
      c.save(); c.setLineDash([8 * u, 6 * u]);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]); c.restore();
      return { a: a, b: b };
    }
    if (st.k === 'rel') {
      var A = S.placed[st.a], B = S.placed[st.b];
      if (B) {
        var claimed = st.j != null ? st.j / bias : null, tol = st.tolRel || (st.approx ? .3 : .25), ang = st.angTol || 35;
        var r1 = 0, r2 = 60;
        if (claimed != null) { if (st.jmin) { r1 = claimed * .9 * scale; r2 = 70; } else { r1 = claimed * (1 - tol) * scale; r2 = claimed * (1 + tol) * scale; } }
        if (st.cap) wedge(c, g, B, st.cap, ang, r1, r2, col, r.status);
        else if (claimed != null) ringAt(c, g, B, r1, r2, col, r.status);
        if (st.near && !st.cap) ringAt(c, g, B, 0, st.r || 18, col, r.status);
        if (st.near && st.cap) { /* cône déjà dessiné */ }
      }
      if (A && B) { var s = line(B, A); arrow(c, s.a, s.b, u); mark(c, (s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2, r.status, u); }
    } else if (st.k === 'cross') {
      var poly = S.drawn[st.path];
      if (poly && poly.length > 1) (Array.isArray(st.a) ? st.a : [st.a]).forEach(function (id) {
        var pp = S.placed[id]; if (!pp) return;
        var q = Core.polyClosest(pp, poly), rr = st.r || 6, ok = q.d <= rr;
        var s = line(pp, { x: q.x, y: q.y }); mark(c, (s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2, ok ? 'ok' : 'ko', u);
      });
    } else if (st.k === 'side') {
      var poly2 = S.drawn[st.path], P1 = S.placed[st.a];
      if (poly2 && poly2.length > 1 && P1) { var q2 = Core.polyClosest(P1, poly2); var s2 = line(P1, { x: q2.x, y: q2.y }); mark(c, (s2.a.x + s2.b.x) / 2, (s2.a.y + s2.b.y) / 2, r.status, u); }
    } else if (st.k === 'opp') {
      var A2 = S.placed[st.a], B2 = S.placed[st.b];
      if (A2 && B2 && S.drawn[st.path]) { var s3 = line(A2, B2); mark(c, (s3.a.x + s3.b.x) / 2, (s3.a.y + s3.b.y) / 2, r.status, u); }
    } else if (st.k === 'between') {
      var a3 = S.placed[st.a], b3 = S.placed[st.b], c3 = S.placed[st.c];
      if (b3 && c3) { line(b3, c3); }
      if (a3) { var pa = P(a3); mark(c, pa.x, pa.y - 26 * u, r.status, u); }
    } else {
      Core.needs(st).places.forEach(function (id) { if (S.placed[id]) { var pa2 = P(S.placed[id]); mark(c, pa2.x, pa2.y - 26 * u, r.status, u); } });
    }
    c.restore();
  }

  function paint(c, W, H, V, o) {
    var L = S.level; if (!L) return;
    lastBadge = null;
    var u = o.u || 1, sc = V.s0 * V.z;
    function X(wx) { return V.ox + wx * sc; } function Y(wy) { return V.oy + (100 - wy) * sc; }
    function P(p) { return { x: X(p.x), y: Y(p.y) }; }
    var g = { P: P, sc: sc, u: u };
    c.save(); c.fillStyle = '#1b150f'; c.fillRect(0, 0, W, H);
    var pad = 7, x0 = X(-pad), y0 = Y(100 + pad), sz = (100 + 2 * pad) * sc;
    var pim = Art.img('parchment');
    if (pim && pim._ok) c.drawImage(pim, 20, 20, 984, 984, x0, y0, sz, sz); else c.drawImage(Art.parchment(), x0, y0, sz, sz);
    c.strokeStyle = 'rgba(50,34,12,.6)'; c.lineWidth = 2 * u; c.strokeRect(x0, y0, sz, sz);
    /* cadre gradué */
    var ink = 'rgba(58,44,28,.8)', fx = X(0), fy = Y(100), fs = 100 * sc;
    c.strokeStyle = ink; c.lineWidth = 1.6 * u; c.strokeRect(fx, fy, fs, fs);
    c.lineWidth = 1 * u; c.strokeRect(fx - 3 * u, fy - 3 * u, fs + 6 * u, fs + 6 * u);
    var i;
    for (i = 5; i < 100; i += 5) {
      var tl = (i % 20 === 0 ? 2.2 : (i % 10 === 0 ? 1.5 : .9)) * sc * .6 + 2 * u;
      c.beginPath();
      c.moveTo(X(i), fy); c.lineTo(X(i), fy + tl); c.moveTo(X(i), fy + fs); c.lineTo(X(i), fy + fs - tl);
      c.moveTo(fx, Y(i)); c.lineTo(fx + tl, Y(i)); c.moveTo(fx + fs, Y(i)); c.lineTo(fx + fs - tl, Y(i)); c.stroke();
    }
    /* quadrillage léger, 1 journée */
    c.save(); c.strokeStyle = 'rgba(90,66,30,.10)'; c.lineWidth = 1 * u; c.setLineDash([2 * u, 6 * u]);
    for (i = 20; i < 100; i += 20) { c.beginPath(); c.moveTo(X(i), fy); c.lineTo(X(i), fy + fs); c.moveTo(fx, Y(i)); c.lineTo(fx + fs, Y(i)); c.stroke(); }
    c.restore();
    /* titre, échelle, rose */
    c.fillStyle = ink; c.font = 'italic ' + Math.max(11, 4.6 * sc * .8) * 1 + 'px ' + FONT; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(loc(L.title), fx, Y(103.5));
    var sy = Y(-3.6), sx0 = X(0), sx1 = X(L.scale);
    c.lineWidth = 2 * u; c.beginPath(); c.moveTo(sx0, sy); c.lineTo(sx1, sy); c.moveTo(sx0, sy - 4 * u); c.lineTo(sx0, sy + 4 * u); c.moveTo(sx1, sy - 4 * u); c.lineTo(sx1, sy + 4 * u); c.stroke();
    c.font = 'italic ' + Math.max(10, 3.4 * sc * .8) + 'px ' + FONT; c.fillText('= ' + t('oneDay'), sx1 + 6 * u, sy);
    Art.rose(c, X(91.5), Y(9), Math.max(13 * u, 5.2 * sc), 'rgba(58,44,28,.7)');

    /* tracés */
    function drawRiver(pts, alpha, dashed, tint) {
      var sp = pts.map(P); c.save(); c.globalAlpha = alpha; c.lineJoin = 'round'; c.lineCap = 'round';
      if (dashed) { c.strokeStyle = '#b5851c'; c.lineWidth = Math.max(4 * u, 1.3 * sc); c.setLineDash([9 * u, 7 * u]); Art.smooth(c, sp); c.stroke(); }
      else {
        c.strokeStyle = 'rgba(52,100,140,.28)'; c.lineWidth = Math.max(11 * u, 3.9 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#3f7aa6'; c.lineWidth = Math.max(5.6 * u, 2 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#a7d2e8'; c.lineWidth = Math.max(2.4 * u, .8 * sc); Art.smooth(c, sp); c.stroke();
      }
      c.restore();
    }
    function pathLabel(pa, pts) {
      var spts = [], si2, stamps = L.places.filter(function (q) { return S.placed[q.id]; }).map(function (q) { return P(S.placed[q.id]); });
      for (si2 = 0; si2 < pts.length - 1; si2++) for (var tt = 0; tt < 4; tt++) spts.push({ x: pts[si2].x + (pts[si2 + 1].x - pts[si2].x) * tt / 4, y: pts[si2].y + (pts[si2 + 1].y - pts[si2].y) * tt / 4 });
      var mid = spts[Math.floor(spts.length / 2)] || pts[0], bestD = -1;
      spts.forEach(function (q, qi) { if (qi < 1 || qi > spts.length - 3) return; var qs = P(q), m = 1e9; stamps.forEach(function (s2) { m = Math.min(m, Math.hypot(s2.x - qs.x, s2.y - qs.y)); }); if (m > bestD) { bestD = m; mid = q; } });
      var pp = P(mid); c.save(); c.font = 'italic ' + Math.max(11, 3.6 * sc * .8) + 'px ' + FONT; c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.lineWidth = 4 * u; c.strokeStyle = 'rgba(238,226,190,.9)'; c.strokeText(loc(pa.name), pp.x + 9 * u, pp.y - 5 * u); c.fillStyle = '#244a66'; c.fillText(loc(pa.name), pp.x + 9 * u, pp.y - 5 * u); c.restore();
    }
    var R = o.result;
    L.paths.forEach(function (pa) {
      if (R) {
        drawRiver(Core.toPts(pa.truth), .95, true);
        var it = R.sc.items.filter(function (x) { return x.id === pa.id && x.kind === 'path'; })[0];
        if (it && it.at) { drawRiver(it.at, .55, false); }
      } else {
        var pts = S.drawn[pa.id];
        var cur = G && G.type === 'draw' && G.path === pa.id ? G.pts : null;
        if (cur && cur.length > 1) drawRiver(cur, .6, false);
        else if (pts && pts.length > 1) { drawRiver(pts, 1, false); if (!o.thumb) pathLabel(pa, pts); }
      }
    });

    /* indices */
    if (!R && S.ghost && o.interactive) shownEntries().forEach(function (e) { ghostFor(c, g, e); });

    /* tampons */
    var Q = [], Rr = clamp(sc * 5.2, 14, 25) * (o.u || 1);
    if (o.thumb) Rr = clamp(sc * 5.4, 6, 14);
    if (R) {
      R.sc.items.forEach(function (it) {
        if (it.kind !== 'place') return;
        var pl = placeById(it.id), tp = P({ x: pl.truth[0], y: pl.truth[1] });
        if (it.at) {
          var ap = P(it.at);
          c.save(); c.strokeStyle = it.verdict === 'ok' ? COL.ok : (it.verdict === 'near' ? COL.near : COL.ko); c.lineWidth = 2.5 * u; c.setLineDash([4 * u, 4 * u]);
          c.beginPath(); c.moveTo(ap.x, ap.y); c.lineTo(tp.x, tp.y); c.stroke(); c.restore();
          stamp(c, tp.x, tp.y, pl, { R: Rr, ghost: true, alpha: .8, q: Q });
          stamp(c, ap.x, ap.y, pl, { R: Rr, alpha: .95, q: it.verdict === 'ok' ? null : Q });
          mark(c, ap.x + Rr * .85, ap.y - Rr * .85, it.verdict, u * 1.1);
        } else { stamp(c, tp.x, tp.y, pl, { R: Rr, ghost: true, alpha: .8, q: Q }); mark(c, tp.x + Rr * .85, tp.y - Rr * .85, 'ko', u * 1.1); }
      });
    } else {
      L.places.forEach(function (pl) {
        if (S.selected === pl.id) return; var pp = S.placed[pl.id]; if (!pp) return; var s = P(pp);
        stamp(c, s.x, s.y, pl, { R: Rr, q: Q, pop: popScale(pl.id) });
      });
      if (S.selected && S.placed[S.selected]) { var sp2 = P(S.placed[S.selected]); stamp(c, sp2.x, sp2.y, placeById(S.selected), { R: Rr, selected: true, q: Q, pop: popScale(S.selected), badge: !!o.interactive && S.phase === 'play' && !(G && G.type === 'stamp' && G.moved) }); }
    }

    layoutLabels(c, Q, W, H);

    /* règle */
    if (!R && S.ruler && o.interactive) {
      var ra = P(S.ruler.a), rb = P(S.ruler.b), d = Core.dist(S.ruler.a, S.ruler.b) / L.scale;
      c.save(); c.strokeStyle = '#7a2a1c'; c.lineWidth = 3 * u; c.setLineDash([9 * u, 5 * u]); c.beginPath(); c.moveTo(ra.x, ra.y); c.lineTo(rb.x, rb.y); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#7a2a1c'; [ra, rb].forEach(function (q) { c.beginPath(); c.arc(q.x, q.y, 5 * u, 0, 6.3); c.fill(); });
      var br = Core.bearing(S.ruler.a, S.ruler.b), best = 'E', bd = 999; for (var k in Core.CAPS) { var dd = Core.angDiff(br, Core.CAPS[k]); if (dd < bd) { bd = dd; best = k; } }
      var lab = I.caps()[best] + ' · ' + I.days(d), mx = (ra.x + rb.x) / 2, my = (ra.y + rb.y) / 2;
      c.font = 'bold ' + 14 * u + 'px ' + FONT; var tw = c.measureText(lab).width + 14 * u;
      c.fillStyle = '#f4ead0'; c.strokeStyle = '#7a2a1c'; c.lineWidth = 1.5 * u; c.beginPath(); if (c.roundRect) c.roundRect(mx - tw / 2, my - 14 * u, tw, 28 * u, 6 * u); else c.rect(mx - tw / 2, my - 14 * u, tw, 28 * u); c.fill(); c.stroke();
      c.fillStyle = '#4a1a10'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lab, mx, my + 1); c.restore();
    }
    /* vignette */
    if (!o.thumb) {
      var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    c.restore();
  }

  /* ───────────── interactions sur la carte ───────────── */
  var G = null;               /* geste en cours */
  var pointers = {};          /* pointerId → {x,y} */
  var pinch = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hitStamp(p) {
    var L = S.level, best = null, bd = 30;
    for (var i = L.places.length - 1; i >= 0; i--) {
      var pl = L.places[i], q = S.placed[pl.id]; if (!q) continue;
      var s = w2s(q), d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = pl.id; }
    }
    return best;
  }
  function snapToStamp(w) {
    var p = w2s(w), best = null, bd = 26;
    S.level.places.forEach(function (pl) { var q = S.placed[pl.id]; if (!q) return; var s = w2s(q), d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = q; } });
    return best ? { x: best.x, y: best.y } : w;
  }
  function cancelGesture() {
    if (G && G.type === 'stamp' && G.start) { S.placed[G.id] = G.start; }
    if (G && G.type === 'stamp' && G.wasNew) { delete S.placed[G.id]; }
    G = null;
  }
  function bindMap() {
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = pos(e); zoomAt(p.x, p.y, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    cv.addEventListener('pointerdown', function (e) {
      if (!S.level) return; audio();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      var p = pos(e); pointers[e.pointerId] = p;
      var ids = Object.keys(pointers);
      if (ids.length === 2) {
        cancelGesture();
        var a = pointers[ids[0]], b = pointers[ids[1]], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: view.z, w: s2w(mid.x, mid.y) };
        draw(); return;
      }
      if (ids.length > 2) return;
      var touch = e.pointerType !== 'mouse';
      if (S.phase === 'result') { G = { type: 'pan', last: p }; return; }
      if (S.mode === 'ruler') {
        var w = snapToStamp(s2w(p.x, p.y)); G = { type: 'ruler', a: w }; S.ruler = { a: w, b: w }; draw(); return;
      }
      if (S.mode === 'draw' && S.activePath) { var w2 = s2w(p.x, p.y); G = { type: 'draw', path: S.activePath, pts: [w2], raw: p }; draw(); return; }
      if (S.selected && S.placed[S.selected] && lastBadge && Math.hypot(p.x - lastBadge.x, p.y - lastBadge.y) <= lastBadge.r + 10) {
        snap(); delete S.placed[S.selected]; S.selected = null; sfx('low'); buzz(10); changed(); return;
      }
      var hit = hitStamp(p);
      if (hit) {
        S.selected = hit; var cur = S.placed[hit], sp = w2s(cur);
        G = { type: 'stamp', id: hit, start: clone(cur), moved: false, dx: sp.x - p.x, dy: sp.y - p.y, touch: touch, sx: p.x, sy: p.y };
        renderPanel(); draw(); return;
      }
      if (S.armed) { G = { type: 'armtap', sx: p.x, sy: p.y, moved: false }; return; }
      if (S.selected) { S.selected = null; renderPanel(); draw(); }
      G = { type: 'pan', last: p };
    });
    cv.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      var p = pos(e); pointers[e.pointerId] = p;
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinch) {
        var a = pointers[ids[0]], b = pointers[ids[1]], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        var d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        view.z = clamp(pinch.z0 * d / pinch.d0, 1, 3.6);
        var s = SC(); view.ox = mid.x - pinch.w.x * s; view.oy = mid.y - (100 - pinch.w.y) * s; clampView(); draw(); return;
      }
      if (!G) return;
      if (G.type === 'pan') { if (SC() > view.s0 * 1.001) { view.ox += p.x - G.last.x; view.oy += p.y - G.last.y; clampView(); draw(); } G.last = p; }
      else if (G.type === 'ruler') { var w = snapToStamp(s2w(p.x, p.y)); S.ruler = { a: G.a, b: w }; draw(); }
      else if (G.type === 'draw') {
        var wp = s2w(p.x, p.y), last = G.pts[G.pts.length - 1];
        if (Math.hypot(wp.x - last.x, wp.y - last.y) > .5 / Math.max(1, view.z * .6)) { G.pts.push({ x: clamp(wp.x, -3, 103), y: clamp(wp.y, -3, 103) }); draw(); }
      }
      else if (G.type === 'stamp') {
        if (!G.moved && Math.hypot(p.x - G.sx, p.y - G.sy) > 5) { G.moved = true; snap(); }
        if (G.moved) {
          var lift = G.touch ? 30 : 0, w3 = s2w(p.x + G.dx, p.y + G.dy - lift);
          S.placed[G.id] = { x: clamp(w3.x, 0, 100), y: clamp(w3.y, 0, 100) }; draw();
        }
      }
      else if (G.type === 'armtap') { if (Math.hypot(p.x - G.sx, p.y - G.sy) > 8) G.moved = true; }
    });
    function end(e) {
      if (!pointers[e.pointerId]) return;
      var p = pos(e); delete pointers[e.pointerId];
      if (pinch) { if (Object.keys(pointers).length < 2) { pinch = null; G = null; } return; }
      if (!G) return;
      var g = G; G = null;
      if (g.type === 'ruler') { var d = Core.dist(S.ruler.a, S.ruler.b); if (d < 1) S.ruler = null; else S.rulerUsed = true; draw(); tutCheck(); }
      else if (g.type === 'draw') {
        var pts = g.pts, len = 0; for (var i = 1; i < pts.length; i++) len += Core.dist(pts[i - 1], pts[i]);
        if (pts.length >= 2 && len > 6) { snap(); S.drawn[g.path] = Core.simplify(pts, .7); S.mode = 'move'; S.activePath = null; sfx('draw'); buzz(8); changed(); renderHint(); } else draw();
      }
      else if (g.type === 'stamp') {
        if (g.moved) {
          var r = cv.getBoundingClientRect(), out = p.x < -10 || p.y < -10 || p.x > r.width + 10 || p.y > r.height + 10;
          if (out) { delete S.placed[g.id]; S.selected = null; sfx('low'); } else { sfx('stamp'); buzz(12); }
          changed();
        } else { draw(); renderPanel(); }
      }
      else if (g.type === 'armtap' && !g.moved) {
        var w = s2w(p.x, p.y); placeAt(S.armed, w);
      }
    }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', function (e) { delete pointers[e.pointerId]; if (G && G.type === 'stamp') { S.placed[G.id] = G.start; } G = null; pinch = null; draw(); });
  }
  function placeAt(id, w) {
    snap(); S.placed[id] = { x: clamp(w.x, 0, 100), y: clamp(w.y, 0, 100) }; S.armed = null; S.selected = id;
    S.pop = S.pop || {}; S.pop[id] = performance.now();
    sfx('stamp'); buzz(12); changed();
  }

  /* glisser depuis la palette */
  function chipDown(e, pl) {
    if (S.phase !== 'play') return;
    e.preventDefault(); audio();
    var gh = $('#dragghost'), st = { sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId }, touch = e.pointerType !== 'mouse', lift = touch ? 34 : 0;
    clear(gh); var cc = chipCanvas(pl.type); cc.style.cssText = 'width:54px;height:54px;background:#f1e7c8;border:2px solid #3a2c1c;border-radius:50%'; gh.appendChild(cc);
    function mv(ev) {
      if (ev.pointerId !== st.pid) return;
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) > 8) { st.moved = true; gh.classList.add('on'); }
      if (st.moved) { gh.style.left = ev.clientX + 'px'; gh.style.top = (ev.clientY - lift) + 'px'; }
    }
    function up(ev) {
      if (ev.pointerId !== st.pid) return;
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      gh.classList.remove('on');
      if (st.moved) {
        var r = cv.getBoundingClientRect(), gx = ev.clientX, gy = ev.clientY - lift;
        if (ev.type !== 'pointercancel' && gx >= r.left && gx <= r.right && gy >= r.top && gy <= r.bottom) placeAt(pl.id, s2w(gx - r.left, gy - r.top));
        else if (S.placed[pl.id] && ev.type !== 'pointercancel') { /* lâché hors carte : le tampon retourne à la palette */ snap(); delete S.placed[pl.id]; S.selected = null; sfx('low'); changed(); }
      } else {
        if (S.placed[pl.id]) { S.selected = pl.id; sfx('pick'); renderPanel(); draw(); }
        else { S.armed = S.armed === pl.id ? null : pl.id; sfx('pick'); renderPanel(); renderHint(); }
      }
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }

  /* ───────────── démarrage ───────────── */
  function boot() {
    var app = $('#app');
    ['title', 'atlas', 'briefing', 'game'].forEach(function (n) { app.appendChild(h('section', { id: n, class: 'screen' })); });
    if (!save.settings.lang) save.settings.lang = (navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
    Art.onload = function () { draw(); };
    Art.preload();
    applySettings(); buildTitle(); buildGame(); go('title');
    $('#modal').addEventListener('pointerdown', function (e) { if (e.target === $('#modal')) closeModal(); });
    window.__cart = { S: S, save: function () { return save; }, view: function () { return view; }, w2s: w2s, s2w: s2w, startLevel: startLevel, openBriefing: openBriefing, go: go, doSubmit: doSubmit, placeAt: placeAt, snap: snap, changed: changed, askWitness: askWitness, useScout: useScout, renderAll: renderAll, setLang: function (l) { save.settings.lang = l; refreshUI(); } };
    if (document.fonts && document.fonts.load) { document.fonts.load("16px 'IM Fell English'").then(function () { draw(); }, function () {}); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
