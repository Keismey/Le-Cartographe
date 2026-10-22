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
  function defaultSave() { return { v: 1, settings: { lang: null, sound: true, music: true, vibrate: true, textSize: 0, cb: false }, progress: {}, notes: {}, inprogress: {}, free: { maps: [], seq: 0 }, tutDone: false, started: false }; }
  var save = (function () {
    var keys = [KEY, KEY + '.bak'];                       /* clé principale, puis copie de secours */
    for (var i = 0; i < keys.length; i++) {
      try { var raw = localStorage.getItem(keys[i]); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') return deepMerge(defaultSave(), o); } } catch (e) {}
    }
    return defaultSave();
  })();
  var saveTimer = null, saveWarned = false, lastBak = 0;
  function persistNow() {
    clearTimeout(saveTimer); save.t = Date.now();
    try {
      var j = JSON.stringify(save), prev = localStorage.getItem(KEY);
      localStorage.setItem(KEY, j);
      if (prev && prev !== j && Date.now() - lastBak > 30000) { localStorage.setItem(KEY + '.bak', prev); lastBak = Date.now(); }
    } catch (e) { if (!saveWarned) { saveWarned = true; toast(t('error')); } }
    try { if (window.Cloud) window.Cloud.push(save); } catch (e) {}
  }
  function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 200); }
  /* Sauvegarde en ligne (Artifact) : fusion document par document, le plus récent gagne */
  function mergeRemote(r) {
    var ch = false, id;
    if (r.core && (r.core.t || 0) > (save.t || 0)) {
      ['settings', 'notes', 'tutDone', 'started', 'ending', 'endingT'].forEach(function (k) { if (r.core[k] !== undefined) save[k] = r.core[k]; });
      ch = true;
    }
    if (r.free) { save.free = save.free || { maps: [], seq: 0 }; save.free.seq = Math.max(save.free.seq || 0, r.free.seq || 0); save.free.del = (save.free.del || []).concat((r.free.del || []).filter(function (x) { return (save.free.del || []).indexOf(x) < 0; })); }
    for (id in r.progress) { var lp = save.progress[id], rp = r.progress[id]; if (!lp || (rp.t || 0) > (lp.t || 0)) { save.progress[id] = rp; ch = true; } }
    for (id in r.inprogress) { var li = save.inprogress[id], ri = r.inprogress[id]; if (!li || (ri.t || 0) > (li.t || 0)) { save.inprogress[id] = ri; ch = true; } }
    ((r.free && r.free.maps) || []).forEach(function (rm) {
      if ((save.free.del || []).indexOf(rm.id) >= 0) return;
      var lm = freeMapById(rm.id);
      if (!lm) { save.free.maps.push(rm); ch = true; } else if ((rm.t || 0) > (lm.t || 0) && !(S.free && S.free.cur === lm)) { save.free.maps[save.free.maps.indexOf(lm)] = rm; ch = true; }
    });
    save.free.maps.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
    if (ch) {
      persistNow();
      if (S.screen === 'title') { buildTitle(); go('title'); } else if (S.screen === 'atlas') renderAtlas(); else if (S.screen === 'free') buildFreeList();
      applySettings();
    }
  }

  /* ───────────── état ───────────── */
  var S = {
    screen: 'title', levelIdx: 0, level: null, phase: 'play',
    placed: {}, drawn: {}, asked: {}, scoutsUsed: 0, suspects: {}, pins: {},
    mode: 'move', activePath: null, ghost: true, panel: 'tools', openCard: null,
    selected: null, armed: null, undo: [], ruler: null, rulerUsed: false, tut: null, result: null, detailOpen: false,
    free: null, resultView: 'diff', brush: null, brushKey: '', brushSize: 6, freePath: null, tf: 'all'
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
  /* Bruitages synthétisés (aucun fichier) : plume, tampon, parchemin, pinceau, révélation */
  var NB = null, sfxLast = {};
  function noiseBuf(a) {
    if (NB && NB.sampleRate === a.sampleRate) return NB;
    NB = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    var d = NB.getChannelData(0), b0 = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; b0 = .97 * b0 + .03 * w; d[i] = w * .6 + b0 * 3; }
    return NB;
  }
  /* souffle de bruit filtré : f0→f1 (Hz), q, durée, volume, attaque, départ différé */
  function hiss(f0, f1, q, dur, vol, att, when, type) {
    var a = audio(); if (!a) return;
    var t0 = a.currentTime + (when || 0), s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a); s.loop = true;
    fl.type = type || 'bandpass'; fl.Q.value = q || 1; fl.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || .01)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(a.destination);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + .03);
  }
  function bell(f, when, vol, dur) {
    tone(f, dur || .9, 'sine', vol, when); tone(f * 2.01, (dur || .9) * .6, 'sine', vol * .35, when); tone(f * 3.97, (dur || .9) * .3, 'sine', vol * .12, when);
  }
  function sfx(name) {
    try {
      var now = Date.now();
      var gap = { scratch: 75, brush: 90, rustle: 250 }[name];
      if (gap) { if (now - (sfxLast[name] || 0) < gap) return; sfxLast[name] = now; }
      if (name === 'stamp') { tone(150, .16, 'sine', .24, 0, 55); hiss(1800, 600, .8, .07, .08, .002); hiss(300, 120, .7, .1, .1, .003, .01, 'lowpass'); }
      else if (name === 'pick') tone(520, .05, 'triangle', .08);
      else if (name === 'scratch') { var r = Math.random(); hiss(2600 + r * 2200, 1800 + r * 900, 2.2, .07 + r * .05, .05 + r * .03, .006); }
      else if (name === 'scratchend') { hiss(3600, 1500, 1.6, .16, .06, .004); tone(2200, .03, 'square', .012); }
      else if (name === 'brush') { hiss(900 + Math.random() * 500, 500, .7, .2, .05, .05, 0, 'lowpass'); }
      else if (name === 'draw') tone(330, .05, 'sawtooth', .03);
      else if (name === 'rustle') { hiss(5200, 2400, .6, .34, .05, .03); hiss(3200, 1400, .9, .22, .04, .02, .08); hiss(6500, 3000, 1.2, .08, .035, .004, .21); }
      else if (name === 'reveal') { bell(784, 0, .07, .9); bell(988, .13, .07, .9); bell(1319, .26, .08, 1.3); hiss(8000, 6000, 2, .5, .015, .1, .25, 'highpass'); }
      else if (name === 'chime') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .5, 'triangle', .11, i * .12); }); }
      else if (name === 'low') tone(196, .3, 'triangle', .1);
      else if (name === 'star') { tone(880, .35, 'triangle', .13); tone(1318, .45, 'sine', .07, .05); }
    } catch (e) {}
  }

  /* ───────────── musique : fichiers à part, fondus entre écrans, boucle sans coupure ───────────── */
  var MUSIC = window.MUSIC || {}, MVOL = .6, MX = 5;
  var mus = { tr: {}, unlocked: false, last: 0, once: null, dk: 1 };
  function mpick(list) { for (var i = 0; i < list.length; i++) if (MUSIC[list[i]]) return list[i]; return null; }
  function musicWant() {
    if (!save.settings.music || document.hidden) return null;
    if (mus.once && mus.once.excl) return null;                       /* morceau de fin : seul sur scène */
    var s = S.screen;
    if (s === 'title') return mpick(['titre']);
    if (s === 'atlas' || s === 'briefing') return mpick(['atlas', 'titre']);
    if (s === 'free') return mpick(['libre', 'atlas', 'titre']);
    if (s === 'game' && S.level) return S.free ? mpick(['libre']) : (S.level.tuto ? mpick(['atlas', 'titre']) : mpick(['c' + S.level.id]));
    return null;
  }
  function mtrack(name) {
    if (!mus.tr[name]) {
      var mk = function () { var a = new Audio(MUSIC[name]); a.preload = 'auto'; a.loop = false; a.ramp = false; return a; };
      mus.tr[name] = { els: [mk(), mk()], g: 0, act: 0 };
    }
    return mus.tr[name];
  }
  function mclamp(v) { return Math.max(0, Math.min(1, v)); }
  /* jingle (duck : la musique de fond baisse pendant ce temps) ou morceau de fin (excl : tout le reste se tait) */
  function playOnce(name, o) {
    if (!MUSIC[name] || !save.settings.music || !mus.unlocked) return;
    musicStopOnce(true);
    var a = new Audio(MUSIC[name]); a.volume = o && o.vol != null ? o.vol : .8;
    var rec = { a: a, excl: !!(o && o.excl), duck: !!(o && o.duck), v: a.volume, fade: false };
    a.onended = function () { if (mus.once === rec) mus.once = null; };
    mus.once = rec;
    var p = a.play(); if (p && p.catch) p.catch(function () { if (mus.once === rec) mus.once = null; });
  }
  function musicStopOnce(now) {
    var r = mus.once; if (!r) return;
    if (now) { try { r.a.pause(); } catch (e) {} mus.once = null; } else r.fade = true;
  }
  function musicTick() {
    var now = Date.now(), dt = Math.min(.25, (now - mus.last) / 1000); mus.last = now;
    var R = mus.once;
    if (R) {
      if (R.fade) { R.v = Math.max(0, R.v - dt / 1.2); try { R.a.volume = R.v; } catch (e) {} if (R.v <= 0) musicStopOnce(true); }
      else if (document.hidden) { if (!R.a.paused) R.a.pause(); }
      else if (R.a.paused && !R.a.ended) { var q = R.a.play(); if (q && q.catch) q.catch(function () {}); }
      if (mus.once && !save.settings.music) musicStopOnce(true);
    }
    mus.dk += ((mus.once && mus.once.duck ? .18 : 1) - mus.dk) * Math.min(1, dt * 5);
    var want = mus.unlocked ? musicWant() : null;
    if (want) mtrack(want);
    Object.keys(mus.tr).forEach(function (name) {
      var T = mus.tr[name], on = name === want;
      T.g = on ? Math.min(1, T.g + dt / 1.4) : Math.max(0, T.g - dt / 0.9);
      var e = T.els[T.act], o = T.els[1 - T.act];
      if (T.g <= 0) { if (!e.paused) e.pause(); if (!o.paused) o.pause(); return; }
      if (e.paused && !e.ended) { var pr = e.play(); if (pr && pr.catch) pr.catch(function () {}); }
      var d = e.duration;
      if (isFinite(d) && d > MX * 2) {
        var left = d - e.currentTime;
        if (left < MX && o.paused) { o.currentTime = 0; o.ramp = true; var p2 = o.play(); if (p2 && p2.catch) p2.catch(function () {}); }
        if (left < .08 || e.ended) { e.pause(); e.currentTime = 0; T.act = 1 - T.act; e = T.els[T.act]; o = T.els[1 - T.act]; }
      }
      [e, o].forEach(function (el) {
        if (el.paused) return;
        var dd = el.duration, f = 1;
        if (isFinite(dd) && dd > MX * 2) { f = Math.min(1, (dd - el.currentTime) / MX); if (el.ramp) f = Math.min(f, el.currentTime / MX); if (el.currentTime > MX) el.ramp = false; }
        try { el.volume = mclamp(T.g * MVOL * mus.dk * mclamp(f)); } catch (x) {}
      });
    });
  }
  function musicUnlock() { if (mus.unlocked) return; mus.unlocked = true; musicTick(); }
  document.addEventListener('pointerdown', musicUnlock, true);
  document.addEventListener('keydown', musicUnlock, true);
  setInterval(musicTick, 80);

  function buzz(ms) { if (save.settings.vibrate) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  /* ───────────── toast & modale ───────────── */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }
  function modal(nodes) { if (!$('#modal').classList.contains('on')) sfx('rustle'); var m = $('#modal'); clear(m); m.appendChild(h('div', { class: 'box', role: 'dialog', 'aria-modal': 'true' }, nodes)); m.classList.add('on'); }
  function closeModal() { $('#modal').classList.remove('on'); if (mus.once && mus.once.excl) musicStopOnce(false); }

  /* ───────────── notes de mise à jour (la plus récente en premier) ───────────── */
  var VERSION = '1.1';
  var PATCH_NOTES = [
    { v: '1.1', d: ['22 octobre 2026', '22 October 2026'],
      fr: ['Nouveau : un tutoriel guidé, « L’Atelier d’Orlan » : une mini-contrée où chaque geste est éclairé à l’écran. Il se relance depuis les Options.', 'Le bouton Indices est maintenant activé par défaut.'],
      en: ['New: a guided tutorial, “Orlan’s Workshop”: a mini region where each gesture is highlighted on screen. You can replay it from Options.', 'The Clues button is now on by default.'] },
    { v: '1.0', d: ['21 octobre 2026', '21 October 2026'],
      fr: ['Première version : huit contrées à relever pour le roi, deux fins, un mode libre avec tous les crayons, la musique et les bruitages.', 'Nouveau : bouton retour du téléphone, menu Options commun aux jeux du hub, sauvegarde à exporter ou importer, application installable.'],
      en: ['First release: eight regions to chart for the king, two endings, a free mode with every pencil, music and sound effects.', 'New: phone back button, the Options menu shared with the hub games, save export and import, installable app.'] }
  ];
  function openNotes() {
    save.pnV = VERSION; persist();
    var en = I.lang === 'en';
    modal([
      h('h2', { text: t('notesBtn') }),
      h('p', { class: 'help', text: 'Le Cartographe · v' + VERSION }),
      h('div', { class: 'notes' }, PATCH_NOTES.map(function (n, i) {
        var d = h('details', null, [h('summary', null, [h('b', { text: 'Version ' + n.v }), ' · ' + n.d[en ? 1 : 0]]), h('ul', null, (en ? n.en : n.fr).map(function (l) { return h('li', { text: l }); }))]);
        if (!i) d.open = true;
        return d;
      })),
      h('button', { class: 'btn primary', id: 'btn-close', text: t('close'), onclick: closeModal })
    ]);
  }

  /* ───────────── navigation ───────────── */
  function go(name) {
    S.screen = name;
    ['title', 'atlas', 'briefing', 'free', 'game'].forEach(function (n) { $('#' + n).classList.toggle('on', n === name); });
    if (name === 'atlas') renderAtlas();
    if (name === 'free') buildFreeList();
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
    var tt = Art.src('title'); if (tt) { el.style.setProperty('--tbg', 'url(' + tt + ')'); el.style.setProperty('--tshade', 'linear-gradient(180deg,rgba(4,14,18,.55) 0%,rgba(4,14,18,0) 32%,rgba(4,14,18,0) 62%,rgba(4,14,18,.72) 100%)'); el.style.backgroundImage = 'none'; el.classList.add('art'); }
    else { var r = h('div'); r.innerHTML = roseSvg(); el.appendChild(r.firstChild); }
    el.appendChild(h('div', { class: 'wordmark', 'aria-label': t('title') }, [
      h('span', { class: 'wm-small' }, [h('i'), h('b', { text: t('titleA') }), h('i')]),
      h('h1', { text: t('titleB') }),
      h('div', { class: 'wm-orn', 'aria-hidden': 'true' })
    ]));
    el.querySelector('.wm-orn').innerHTML = '<svg viewBox="0 0 240 20"><path d="M4 10 H98 M142 10 H236" stroke="#d2a94b" stroke-width="1.2" stroke-linecap="round"/><path d="M120 2 L128 10 L120 18 L112 10Z" fill="#d2a94b"/><circle cx="104" cy="10" r="2" fill="#d2a94b"/><circle cx="136" cy="10" r="2" fill="#d2a94b"/></svg>';
    el.appendChild(h('p', { class: 'tag', text: t('tagline') }));
    el.appendChild(h('div', { class: 'stack' }, [
      h('button', { class: 'btn primary', id: 'btn-play', text: has ? t('continue_') : t('play'), onclick: function () { audio(); if (!has) { if (!save.tutDone && window.Levels.tuto) startTuto(); else openBriefing(0); } else go('atlas'); } }),
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
  /* Icônes de secours (traits fins) tant qu'une planche d'icônes n'a pas été livrée : l'asset prend la place dès qu'il existe */
  var FB = {
    main: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V12M17 9a1.5 1.5 0 0 1 3 0v5c0 4-3 7-7 7h-1.5c-2.5 0-4-1-5.5-3L4 14.5a1.6 1.6 0 0 1 2.5-2L8 14"/>',
    annuler: '<path d="M3 7v6h6M3.6 13A9 9 0 1 0 6 6.3L3 9"/>',
    corbeille: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    cible: '<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    engrenage: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5l1.6 2.6 3-.6.7 3 2.8 1.3-1.2 2.8 1.2 2.8-2.8 1.3-.7 3-3-.6L12 21.5l-1.6-2.6-3 .6-.7-3-2.8-1.3 1.2-2.8-1.2-2.8 2.8-1.3.7-3 3 .6z"/>',
    retour: '<path d="M15 5l-7 7 7 7"/>',
    crayon: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
    gomme: '<path d="M4 16l9-9 6 6-6 6H8zM9 11l5 5M14 19h6"/>'
  };
  function uiIcon(name, cls) {
    var a = ico(name, cls); if (a) return a;
    if (!FB[name]) return null;
    var e = h('span', { class: 'ico fb' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
    e.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + FB[name] + '</svg>';
    return e;
  }
  /* Portrait dans son médaillon doré */
  function framed(src, cls) {
    var ring = Art.src('ui.cadre_rond');
    if (!ring) return h('img', { class: 'portrait ' + (cls || ''), src: src, alt: '', draggable: 'false' });
    return h('span', { class: 'pf ' + (cls || '') }, [h('img', { class: 'portrait', src: src, alt: '', draggable: 'false' }), h('img', { class: 'ring', src: ring, alt: '', draggable: 'false' })]);
  }
  function portrait(w, cls) {
    var s = Art.src('portraits.' + w.id);
    return s ? framed(s, cls) : h('span', { class: 'em', text: w.emoji });
  }
  function portraitKey(key, cls) { var s = Art.src('portraits.' + key); return s ? framed(s, cls) : null; }
  function vIcon(verdict, cls) { return ico(verdict === 'ok' ? 'verdict_ok' : (verdict === 'near' ? 'verdict_presque' : 'verdict_rate'), cls); }
  function starsText(n) { var s = h('span', { class: 'starsrow', 'aria-label': t('stars', { n: n }) }); starImgs(n).forEach(function (x) { s.appendChild(x); }); return s; }
  function renderAtlas() {
    var el = $('#atlas'); clear(el);
    el.appendChild(h('div', { class: 'topbar gutter' }, [
      h('button', { class: 'iconbtn', 'aria-label': t('back'), onclick: function () { buildTitle(); go('title'); } }, [uiIcon('retour')]),
      h('h2', { text: t('atlas') }),
      h('button', { class: 'iconbtn', 'aria-label': t('settings'), onclick: openSettings }, [uiIcon('engrenage')])
    ]));
    var body = h('div', { class: 'body scroll gutter' });
    body.appendChild(h('p', { class: 'lead', text: t('atlasText') }));
    LEVELS.forEach(function (L, i) {
      var open = unlocked(i), p = save.progress[L.id], inprog = !!save.inprogress[L.id];
      var tsrc = thumbFor(L, p), th = tsrc ? h('img', { class: 'thumb', src: tsrc, alt: '' }) : (Art.src('scenes.' + L.scene) ? h('img', { class: 'thumb', src: Art.src('scenes.' + L.scene), alt: '' }) : h('div', { class: 'thumb', text: String(L.id) }));
      var btn = h('button', { class: 'region', disabled: open ? null : true, id: 'region-' + L.id, onclick: function () { audio(); if (p && p.stars >= 1) openFinished(i); else openBriefing(i); } }, [
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
    body.appendChild(freeCard());
    var endc = endingCard(); if (endc) body.appendChild(endc);
    body.appendChild(h('h3', { class: 'sec', text: t('orlanNotes') }));
    var ns = h('div', { class: 'notes' }), any = false;
    LEVELS.forEach(function (L) {
      if (save.notes[L.id]) { any = true; ns.appendChild(h('div', { class: 'note' }, [h('small', { text: t('orlanNote', { n: L.id }) }), '« ' + loc(L.note) + ' »'])); }
    });
    if (!any) ns.appendChild(h('p', { class: 'help', text: t('noNotes') }));
    body.appendChild(ns);
    el.appendChild(body);
  }

  /* ───────────── fin du jeu : publier la vraie carte, ou garder le secret ───────────── */
  function lastDone() { var L = LEVELS[LEVELS.length - 1], p = save.progress[L.id]; return !!(p && p.stars >= 1); }
  function endingScene(kind) { return Art.src('scenes.' + (kind === 'publish' ? 'voyageurs' : 'enveloppe')); }
  function openEnding(replay) {
    var done = save.ending;
    if (done && replay === true) playOnce(done === 'publish' ? 'fin-publier' : 'fin-secret', { excl: true, vol: .75 });
    var kids = [h('h2', { text: t('endingTitle') })];
    if (done) {
      var im = endingScene(done); if (im) kids.push(h('img', { class: 'bigthumb', src: im, alt: '', style: 'width:100%;max-height:260px;object-fit:cover' }));
      kids.push(h('p', { text: t(done === 'publish' ? 'endingPublishText' : 'endingSecretText') }));
      kids.push(h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn', id: 'end-change', text: t('endingDecide'), onclick: function () { save.ending = null; persist(); openEnding(); } }),
        h('button', { class: 'btn primary', text: t('close'), onclick: closeModal })
      ]));
    } else {
      kids.push(h('p', { text: t('endingText') }));
      kids.push(h('div', { class: 'btnrow' }, [
        h('button', { class: 'btn primary', id: 'end-publish', text: t('endingPublish'), onclick: function () { save.ending = 'publish'; save.endingT = Date.now(); persist(); sfx('chime'); playOnce('fin-publier', { excl: true, vol: .75 }); openEnding(); if ($('#atlas').classList.contains('on')) renderAtlas(); } }),
        h('button', { class: 'btn', id: 'end-secret', text: t('endingSecret'), onclick: function () { save.ending = 'secret'; save.endingT = Date.now(); persist(); sfx('chime'); playOnce('fin-secret', { excl: true, vol: .75 }); openEnding(); if ($('#atlas').classList.contains('on')) renderAtlas(); } })
      ]));
      kids.push(h('button', { class: 'linkbtn', text: t('endingLater'), onclick: closeModal }));
    }
    modal(kids);
  }
  function endingCard() {
    if (!lastDone()) return null;
    var im = save.ending ? endingScene(save.ending) : (Art.src('scenes.enveloppe') || null);
    return h('button', { class: 'region', id: 'region-end', onclick: function () { audio(); openEnding(true); } }, [
      im ? h('img', { class: 'thumb', src: im, alt: '' }) : h('div', { class: 'thumb', text: '✒' }),
      h('div', { class: 'meta' }, [h('div', { class: 'nm', text: t('endingCard') }), h('div', { class: 'sub', text: save.ending ? t(save.ending === 'publish' ? 'endingPublishShort' : 'endingSecretShort') : t('endingDecide') })])
    ]);
  }

  /* ───────────── fiche d'une contrée terminée : voir / exporter la carte, ou rejouer ───────────── */
  function openFinished(idx) {
    var L = LEVELS[idx], p = save.progress[L.id], m = p && p.map;
    var src = bigThumbFor(L, p);
    var kids = [h('h2', { text: loc(L.title) })];
    if (src) kids.push(h('img', { class: 'bigthumb', src: src, alt: '' }));
    kids.push(h('div', { class: 'scoreline' }, [starsText(p.stars), h('span', { text: ' ' + (m ? t('mapScore', { s: Math.round(m.score) }) : t('best', { s: Math.round(p.score) })) })]));
    if (m && Math.round(m.score) !== Math.round(p.score)) kids.push(h('p', { class: 'help', text: t('best', { s: Math.round(p.score) }) }));
    if (!m) kids.push(h('p', { class: 'help', text: t('noMapSaved') }));
    var row = [];
    if (m) row.push(h('button', { class: 'btn primary', id: 'btn-export-fin', onclick: function () { exportMap({ final: finalFor(L, m), title: loc(L.title), stars: m.stars, score: m.score, file: 'contree-' + L.id }); } }, [ico('enveloppe', 'sm'), ' ' + t('exportMap')]));
    row.push(h('button', { class: 'btn', id: 'btn-replay', text: save.inprogress[L.id] ? t('resume') : t('replay'), onclick: function () { closeModal(); openBriefing(idx); } }));
    kids.push(h('div', { class: 'btnrow' }, row));
    kids.push(h('button', { class: 'linkbtn', text: t('close'), onclick: closeModal }));
    modal(kids);
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
    S.screen = 'briefing'; sfx('rustle');
    ['title', 'atlas', 'briefing', 'free', 'game'].forEach(function (n) { $('#' + n).classList.toggle('on', n === 'briefing'); });
  }

  /* ───────────── niveau ───────────── */
  function startLevel(idx, resume) {
    var L = LEVELS[idx]; S.free = null; S.brush = null; S.brushKey = ''; S.levelIdx = idx; S.level = L; S.phase = 'play'; S.result = null; S.detailOpen = false; S.resultView = 'diff';
    var ip = resume ? save.inprogress[L.id] : null;
    if (!resume) delete save.inprogress[L.id];
    S.placed = ip ? ip.placed || {} : {}; S.drawn = ip ? ip.drawn || {} : {};
    S.asked = ip ? ip.asked || {} : {}; S.scoutsUsed = ip ? ip.scoutsUsed || 0 : 0;
    S.suspects = ip ? ip.suspects || {} : {}; S.pins = ip ? ip.pins || {} : {};
    S.mode = 'move'; S.activePath = null; S.ghost = true; S.panel = 'tools'; S.openCard = null; S.selected = null; S.armed = null;
    S.undo = []; S.ruler = null; S.rulerUsed = false; S.tut = null; lastPanelKey = null; S.tf = 'all';
    save.started = true; persist();
    go('game'); renderAll();
  }
  function persistProgress() {
    if (S.free) { S.free.cur.t = Date.now(); persist(); return; }
    if (S.phase !== 'play' || !S.level || S.level.tuto) return;
    save.inprogress[S.level.id] = { placed: S.placed, drawn: S.drawn, asked: S.asked, scoutsUsed: S.scoutsUsed, suspects: S.suspects, pins: S.pins, t: Date.now() };
    persist();
  }
  function snap() {
    var o = { p: S.placed, d: S.drawn };
    if (S.free) { o.fp = S.free.cur.places; o.fa = S.free.cur.paths; o.st = S.free.cur.strokes; }
    S.undo.push(JSON.stringify(o)); if (S.undo.length > 40) S.undo.shift();
  }
  function undo() {
    if (!S.undo.length || S.phase !== 'play') return;
    var o = JSON.parse(S.undo.pop()); S.placed = o.p; S.drawn = o.d;
    if (S.free) { var m = S.free.cur; m.placed = S.placed; m.drawn = S.drawn; m.places = o.fp || []; m.paths = o.fa || []; m.strokes = o.st || []; syncFreeLevel(); S.selected = null; }
    sfx('pick'); changed();
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
      h('button', { class: 'iconbtn', id: 'btn-exit', 'aria-label': t('atlas'), onclick: function () { if (S.free) { leaveFree(); return; } persistProgress(); go('atlas'); } }, [uiIcon('retour')]),
      h('h2', { id: 'g-title' }),
      h('button', { class: 'iconbtn kingbtn', id: 'btn-king', 'aria-label': t('kingWord'), onclick: openKing }, [portraitKey('roi', 'xs') || h('span', { text: '👑' })]),
      h('button', { class: 'iconbtn', 'aria-label': t('settings'), onclick: openSettings }, [uiIcon('engrenage')])
    ]));
    var wrap = h('div', { id: 'mapwrap' }, [
      h('div', { id: 'rail' }),
      h('div', { id: 'mapcol' }, [
      h('canvas', { id: 'map', 'aria-label': 'map' }),
      h('div', { class: 'mapfloat tr' }, [
        h('button', { id: 'z-in', class: Art.src('ui.zoom_plus') ? 'coinb' : '', 'aria-label': t('zoomIn'), onclick: function () { zoomAt(cw / 2, ch / 2, 1.3); } }, [ico('zoom_plus') || document.createTextNode('+')]),
        h('button', { id: 'z-out', class: Art.src('ui.zoom_moins') ? 'coinb' : '', 'aria-label': t('zoomOut'), onclick: function () { zoomAt(cw / 2, ch / 2, 1 / 1.3); } }, [ico('zoom_moins') || document.createTextNode('−')]),
        h('button', { id: 'z-fit', class: Art.src('ui.cible') ? 'coinb' : '', 'aria-label': t('recenter'), onclick: function () { fitView(); draw(); } }, [uiIcon('cible')])
      ]),
      h('div', { id: 'ribbon' }),
      h('div', { id: 'rtoggle' }),
      h('div', { id: 'hint', class: 'maphint', style: 'display:none' }),
      h('div', { id: 'maplegend', class: 'maplegend', style: 'display:none' })
      ])
    ]);
    g.appendChild(wrap);
    g.appendChild(h('div', { id: 'panel' }));
    g.appendChild(h('div', { id: 'bar', class: 'gutter' }));
    cv = $('#map'); cx = cv.getContext('2d');
    bindMap();
    if (window.ResizeObserver) new ResizeObserver(function () { resize(); draw(); }).observe($('#mapcol'));
    window.addEventListener('resize', function () { resize(); draw(); });
  }
  function resize() {
    if (!cv) return;
    var r = cv.parentNode.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var nw = Math.round(r.width), nh = Math.round(r.height); dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (nw !== cw || nh !== ch) { cw = nw; ch = nh; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); fitView(); }
  }
  function renderAll() { railKey = ''; renderTop(); renderBar(); renderPanel(); renderHint(); renderRibbon(); renderTut(); readColors(); draw(); }

  /* ───────────── raccourcis d'outils autour de la carte ───────────── */
  function setMove() { S.mode = 'move'; S.activePath = null; S.brush && (S.brush.on = false); sfx('pick'); renderPanel(); renderHint(); draw(); }
  function toggleRuler() { S.mode = S.mode === 'ruler' ? 'move' : 'ruler'; S.activePath = null; S.armed = null; sfx('pick'); renderPanel(); renderHint(); draw(); }
  function toggleGhost() { S.ghost = !S.ghost; sfx('pick'); draw(); renderPanel(); }
  function cyclePath() {
    var ps = S.level.paths, i = -1, k;
    if (S.mode === 'draw') for (k = 0; k < ps.length; k++) if (ps[k].id === S.activePath) i = k;
    if (i + 1 >= ps.length) { S.mode = 'move'; S.activePath = null; } else { S.mode = 'draw'; S.activePath = ps[i + 1].id; S.armed = null; }
    sfx('pick'); renderPanel(); renderHint(); draw();
  }
  function dropStamp(id) {
    delete S.placed[id];
    if (S.free) { var m = S.free.cur; m.places = m.places.filter(function (p) { return p.id !== id; }); S.level.places = S.level.places.filter(function (p) { return p.id !== id; }); }
  }
  function removeSel() {
    var sel = S.selected && S.placed[S.selected] ? S.selected : null; if (!sel) return;
    snap(); dropStamp(sel); S.selected = null; sfx('low'); changed();
  }
  var railKey = '';
  function railBtn(id, icon, label, on, dis, fn) {
    return h('button', { class: 'rbtn' + (on ? ' on' : ''), id: id, 'aria-label': label, 'aria-pressed': on ? 'true' : 'false', disabled: dis ? true : null, onclick: fn }, [h('span', { class: 'ri' }, [icon]), h('small', { text: label })]);
  }
  function renderRail() {
    var el = $('#rail'), tg = $('#rtoggle'); if (!el || !tg) return;
    var inGame = S.screen === 'game' && S.level, play = inGame && S.phase === 'play', res = inGame && S.phase === 'result' && !S.free;
    var sel = !!(S.selected && S.placed[S.selected]);
    var key = [play ? 1 : 0, res ? 1 : 0, S.free ? 1 : 0, S.mode, S.activePath || '', S.ghost ? 1 : 0, S.undo.length ? 1 : 0, sel ? 1 : 0, S.resultView, S.brushKey || '', S.armed || '', I.lang, inGame ? S.level.paths.length : 0].join('|');
    if (key === railKey) return; railKey = key;
    clear(el); clear(tg);
    el.style.display = play ? 'flex' : 'none'; tg.style.display = 'none';
    if (play) {
      if (S.free) freeRail(el);
      else {
        el.appendChild(railBtn('r-move', uiIcon('main'), t('move'), S.mode === 'move', false, setMove));
        if (S.level.paths.length) el.appendChild(railBtn('r-draw', ico('plume'), t('draw'), S.mode === 'draw', false, cyclePath));
        el.appendChild(railBtn('r-ruler', ico('regle'), t('rulerShort'), S.mode === 'ruler', false, toggleRuler));
        el.appendChild(railBtn('r-ghost', ico('loupe'), t('ghostShort'), S.ghost, false, toggleGhost));
        el.appendChild(railBtn('r-undo', uiIcon('annuler'), t('undo'), false, !S.undo.length, undo));
        el.appendChild(railBtn('r-remove', uiIcon('corbeille'), t('removeStamp'), false, !sel, removeSel));
      }
    }

  }
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
        h('span', { text: loc(txt) }), h('i', { text: '×' })
      ]));
    });
  }
  /* La demande du roi, relisible à tout moment pendant le niveau */
  function openKing() {
    var L = S.level; if (!L || S.free) return;
    sfx('rustle');
    modal([
      h('div', { class: 'kingmodal' }, [
        portraitKey('roi', 'md'),
        h('div', {}, [h('small', { text: t('region', { n: L.id }) }), h('h2', { text: loc(L.title) })])
      ]),
      h('p', { class: 'kingtext', text: loc(L.king) }),
      h('div', { class: 'hint' }, [h('b', { text: t('kingHint') + ' : ' }), loc(L.hint)]),
      h('button', { class: 'btn primary', id: 'btn-king-close', text: t('close'), onclick: closeModal })
    ]);
  }
  function renderTop() {
    if (!S.level) return;
    var kb = $('#btn-king'); if (kb) kb.style.display = (S.free || S.level.tuto) ? 'none' : '';
    $('#g-title').textContent = S.free ? freeTitle(S.free.cur) : (S.level.tuto ? loc(S.level.title) : S.level.id + ' · ' + loc(S.level.title));
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
    if (S.free) {
      b.appendChild(h('button', { class: 'btn', id: 'btn-rename', text: t('freeRename'), onclick: function () { renameFree(S.free.cur); } }));
      b.appendChild(h('button', { class: 'btn primary seal', id: 'btn-export-free', onclick: exportFree }, [ico('enveloppe', 'sm'), ' ' + t('exportMap')]));
      return;
    }
    b.appendChild(h('button', { class: 'btn' + (S.panel === 'notebook' ? ' active' : ''), id: 'btn-notebook', onclick: function () { S.panel = 'notebook'; sfx('pick'); renderBar(); renderPanel(); tutCheck(); } }, [ico('carnet', 'sm'), ' ' + t('notebook')]));
    b.appendChild(h('button', { class: 'btn' + (S.panel === 'tools' ? ' active' : ''), id: 'btn-tools', onclick: function () { S.panel = 'tools'; sfx('pick'); renderBar(); renderPanel(); tutCheck(); } }, [ico('boussole', 'sm'), ' ' + t('tools')]));
    b.appendChild(h('button', { class: 'btn primary seal', id: 'btn-submit', onclick: askSubmit }, [ico('sceau', 'sm'), ' ' + t('submit')]));
  }
  function renderHint() {
    var el = $('#hint'), txt = '';
    if (S.phase === 'play') {
      if (S.mode === 'ruler') txt = t('rulerHint');
      else if (S.mode === 'draw' && S.free) txt = t('freeDrawRiver', { name: I.sub('pathNames', S.freePath) });
      else if (S.mode === 'draw' && S.activePath) txt = t('drawHint', { name: loc(S.level.paths.filter(function (p) { return p.id === S.activePath; })[0].name) });
      else if (S.armed && S.free) txt = t('freeTapToPlace', { name: I.sub('stampNames', S.armed.slice(5)) });
      else if (S.mode === 'brush' && S.brush) txt = S.brush.erase ? t('freeEraseHint') : t('freeBrushHint', { name: loc(window.Terrain.KINDS[S.brush.k].name) });
      else if (S.armed) txt = t('armHint', { name: loc(placeById(S.armed).name) });
    }
    el.style.display = txt ? 'block' : 'none'; el.textContent = txt;
    var lg = $('#maplegend');
    if (S.phase === 'result' && S.resultView !== 'final') {
      lg.style.display = 'flex'; clear(lg);
      lg.appendChild(h('span', {}, [h('i', { style: 'border-color:#d9a93a;border-top-style:dashed' }), t('legendTruth')]));
      lg.appendChild(h('span', {}, [h('i', { style: 'border-color:#6fa3c4' }), t('legendYours')]));
    } else lg.style.display = 'none';
  }

  /* ───────────── panneau : outils ───────────── */
  var lastPanelKey = null;
  function renderPanel() {
    var p = $('#panel'); if (!p || !S.level) return;
    renderRail();
    var key = S.phase === 'result' ? 'result' : S.panel + ':' + S.level.id + (S.free ? ':' + S.free.cur.id : ''), st = key === lastPanelKey ? p.scrollTop : 0;
    lastPanelKey = key;
    clear(p);
    if (S.free) renderFreePanel(p);
    else if (S.phase === 'result') renderResult(p);
    else if (S.panel === 'notebook') renderNotebook(p);
    else renderTools(p);
    p.scrollTop = st;
    tutCheck();
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
        chipImage(pl.type), h('span', { text: loc(pl.name) }), done ? h('b', { class: 'ck' }, [vIcon('ok', 'xs')]) : null
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
          h('b', {}, [ico('plume')]), t('drawPath', { name: loc(pa.name) }) + ' · ' + (has ? t('drawn') : t('notDrawn'))
        ]));
        tg.appendChild(h('button', { class: 'tool', disabled: has ? null : true, 'data-erase': pa.id, onclick: function () { snap(); delete S.drawn[pa.id]; sfx('low'); changed(); } }, [h('b', {}, [ico('eponge')]), t('eraseStroke')]));
      });
      pad.appendChild(tg);
    }

    pad.appendChild(h('h3', { text: t('toolsTitle') }));
    var sel = S.selected && S.placed[S.selected] ? S.selected : null;
    var tools = h('div', { class: 'tools' }, [
      h('button', { class: 'tool' + (S.mode === 'move' ? ' on' : ''), id: 't-move', onclick: setMove }, [h('b', {}, [uiIcon('main')]), t('move')]),
      h('button', { class: 'tool' + (S.mode === 'ruler' ? ' on' : ''), id: 't-ruler', onclick: toggleRuler }, [h('b', {}, [ico('regle')]), t('ruler')]),
      h('button', { class: 'tool' + (S.ghost ? ' on' : ''), id: 't-ghost', onclick: toggleGhost }, [h('b', {}, [ico('loupe')]), t('ghost')]),
      h('button', { class: 'tool', id: 't-undo', disabled: S.undo.length ? null : true, onclick: undo }, [h('b', {}, [uiIcon('annuler')]), t('undo')]),
      h('button', { class: 'tool', id: 't-remove', disabled: sel ? null : true, onclick: removeSel }, [h('b', {}, [uiIcon('corbeille')]), t('removeStamp')]),
      h('button', { class: 'tool', id: 't-fit', onclick: function () { fitView(); draw(); } }, [h('b', {}, [uiIcon('cible')]), t('recenter')])
    ]);
    pad.appendChild(tools);
    if (S.ghost) pad.appendChild(h('div', { class: 'legend' }, [h('span', { text: t('ghostLegend') })]));
    p.appendChild(pad);
  }

  /* ───────────── panneau : carnet ───────────── */
  function badgeFor(status) {
    if (status === 'ok') return h('span', { class: 'badge ok', title: t('statusOk'), 'aria-label': t('statusOk') }, [vIcon('ok')]);
    if (status === 'ko') return h('span', { class: 'badge ko', title: t('statusKo'), 'aria-label': t('statusKo') }, [vIcon('ko')]);
    return h('span', { class: 'badge na', title: t('statusNa'), 'aria-label': t('statusNa'), text: '·' });
  }
  var OPPCAP = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };
  function sigOf(st) {
    var n = Core.needs(st), cap = Core.effCap(st);
    if (st.k === 'rel' && !Array.isArray(st.a) && !Array.isArray(st.b)) {
      var a = st.a, b = st.b;
      if (a > b) { var tmp = a; a = b; b = tmp; cap = cap ? OPPCAP[cap] : cap; }
      return 'rel|' + a + '|' + b + '|' + (cap || (st.near ? 'near' : 'd'));
    }
    return st.k + '|' + n.places.join(',') + '|' + n.paths.join(',') + '|' + (cap || '');
  }
  /* « source unique » : aucun autre témoin n'affirme la même chose */
  function isSingle(e) {
    if (!S.level.single || e.kind !== 'say') return false;
    var sg = sigOf(e.st);
    return !S.level.witnesses.some(function (w) {
      return w.id !== e.w.id && w.statements.some(function (o) { return sigOf(o) === sg; });
    });
  }
  function stmtRow(e) {
    var pinned = !!S.pins[e.key];
    var tag = e.kind === 'reply' ? t('reply') : (e.kind === 'scout' ? t('scoutVerified') : null);
    var single = isSingle(e);
    if (!tag && e.st.night) tag = t('night'); else if (!tag && e.st.day) tag = t('day');
    if (single) tag = (tag ? tag + ' · ' : '') + t('single');
    var txt = e.kind === 'reply' ? e.reply : e.st.text;
    var togglePin = function () { if (S.pins[e.key]) delete S.pins[e.key]; else S.pins[e.key] = true; sfx('pick'); persistProgress(); draw(); renderPanel(); renderRibbon(); };
    var row = h('div', { class: 'stmt' + (pinned ? ' pinned' : ''), 'data-key': e.key, onclick: togglePin }, [
      h('div', { class: 'tx' }, [tag ? h('small', { text: tag }) : null, '« ' + loc(txt) + ' »']),
      h('button', { class: 'pinbtn' + (pinned ? ' on' : ''), 'aria-pressed': pinned ? 'true' : 'false', 'aria-label': pinned ? t('unpin') : t('pin') }, [ico('punaise')])
    ]);
    return row;
  }
  function renderNotebook(p) {
    var L = S.level, left = tokensLeft(), pad = h('div', { class: 'pad gutter' });
    var tb = h('div', { class: 'tokenbar' }, [
      h('button', { class: 'btn small', id: 'btn-scout', disabled: left.scout > 0 ? null : true, onclick: useScout }, [ico('jeton_eclaireur', 'sm'), ' ' + t('scout', { n: left.scout })]),
      h('button', { class: 'btn small' + (S.ghost ? ' brass' : ''), id: 'btn-ghost', 'aria-pressed': S.ghost ? 'true' : 'false', onclick: function () { S.ghost = !S.ghost; sfx('pick'); draw(); renderPanel(); } }, [ico('loupe', 'sm'), ' ' + t('ghost')])
    ]);
    pad.appendChild(tb);
    if (!S.scoutsUsed && !Object.keys(S.asked).length) pad.appendChild(h('p', { class: 'help', text: t('tokenHelp') }));
    if (L.night) {
      pad.appendChild(h('p', { class: 'help', text: t('nightRule') }));
      pad.appendChild(h('div', { class: 'seg', role: 'group', id: 'tfilter' }, [['all', t('fAll')], ['day', t('fDay')], ['night', t('fNight')]].map(function (o) {
        return h('button', { class: 'btn' + (S.tf === o[0] ? ' on' : ''), 'data-tf': o[0], 'aria-pressed': S.tf === o[0] ? 'true' : 'false', text: o[1], onclick: function () { S.tf = o[0]; sfx('pick'); renderPanel(); } });
      })));
    }
    if (L.single) pad.appendChild(h('p', { class: 'help', text: t('singleHint') }));
    if (L.fog) pad.appendChild(h('p', { class: 'help', text: t('fogHint') }));
    if (S.scoutsUsed) {
      var sc = h('div', { class: 'card open' }, [
        h('div', { class: 'inner', style: 'padding-top:12px' }, [h('h3', {}, [ico('jeton_eclaireur', 'sm'), ' ' + t('scoutCardTitle')])].concat(
          entries().filter(function (e) { return e.kind === 'scout'; }).map(stmtRow)))
      ]);
      pad.appendChild(sc);
    }
    L.witnesses.forEach(function (w) {
      var open = S.openCard === w.id;
      var ents = entries().filter(function (e) { return e.w && e.w.id === w.id && !(L.night && ((S.tf === 'day' && e.st.night) || (S.tf === 'night' && e.st.day))); });
      var card = h('div', { class: 'card' + (open ? ' open' : ''), 'data-w': w.id }, [
        h('button', { class: 'card-h', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px;min-height:56px;width:100%;background:none;border:0;text-align:left;cursor:pointer;color:inherit', 'aria-expanded': open ? 'true' : 'false',
          onclick: function () { S.openCard = open ? null : w.id; sfx('pick'); draw(); renderPanel(); tutCheck(); } }, [
          portrait(w, 'card'),
          h('span', { class: 'who' }, [h('b', { text: loc(w.name) }), h('i', {}, [loc(w.job) + (S.suspects[w.id] ? ' · ' : ''), S.suspects[w.id] ? ico('fanion', 'xs') : null, S.suspects[w.id] ? ' ' + t('suspected') : ''])]),
          h('span', { class: 'chev', text: '›' })
        ])
      ]);
      var inner = h('div', { class: 'inner' });
      inner.appendChild(h('p', { class: 'trait', text: loc(w.trait) }));
      if (!Object.keys(S.pins).length) inner.appendChild(h('p', { class: 'help', text: t('tapPin') }));
      ents.forEach(function (e) { inner.appendChild(stmtRow(e)); });
      var asked = !!S.asked[w.id];
      var canAsk = !asked && left.ask > 0;
      if (w.ask) inner.appendChild(h('div', { class: 'actions' }, [
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
    S.asked[w.id] = true; sfx('reveal'); buzz(15);
    S.pins[w.id + ':r'] = true;
    persistProgress(); draw(); renderPanel(); tutCheck();
  }
  function useScout() {
    var left = tokensLeft(); if (left.scout < 1) return;
    S.scoutsUsed++; S.pins['scout:' + (S.scoutsUsed - 1)] = true; sfx('reveal'); buzz(15);
    persistProgress(); draw(); renderPanel(); tutCheck();
  }

  /* ───────────── tutoriel guidé : L'Atelier d'Orlan ───────────── */
  /* Une mini-contrée (deux lieux, une rivière, un témoin). Chaque étape éclaire l'élément à toucher ;
     elle avance toute seule quand le joueur a fait le geste. */
  var TUT_STEPS = [
    { target: '#btn-notebook', done: function () { return S.panel === 'notebook'; } },
    { target: '.card[data-w="odo"] .card-h', done: function () { return S.openCard === 'odo'; } },
    { target: '.stmt', done: function () { return Object.keys(S.pins).length > 0; } },
    { target: '#btn-tools', done: function () { return S.panel === 'tools'; } },
    { target: '.chip[data-id="moulin"]', done: function () { return !!S.placed.moulin; } },
    { target: '.chip[data-id="ferme"]', done: function () { return !!S.placed.ferme; } },
    { target: '#r-ghost', info: true },
    { target: '#r-ruler', done: function () { return S.rulerUsed; } },
    { target: '#r-draw', done: function () { return S.mode === 'draw' || (S.drawn.riviere && S.drawn.riviere.length >= 2); } },
    { target: '#mapcol', soft: true, done: function () { return !!(S.drawn.riviere && S.drawn.riviere.length >= 2); } },
    { target: '#btn-submit', done: function () { return false; } }
  ];
  var TUT_N = TUT_STEPS.length, tutTimer = null, tutShown = -1;
  function startTuto() {
    var L = window.Levels.tuto; if (!L) return;
    try { persistProgress(); } catch (e) {}
    S.free = null; S.brush = null; S.brushKey = ''; S.levelIdx = -1; S.level = L; S.phase = 'play'; S.result = null; S.detailOpen = false; S.resultView = 'diff';
    S.placed = {}; S.drawn = {}; S.asked = {}; S.scoutsUsed = 0; S.suspects = {}; S.pins = {};
    S.mode = 'move'; S.activePath = null; S.ghost = true; S.panel = 'tools'; S.openCard = null; S.selected = null; S.armed = null;
    S.undo = []; S.ruler = null; S.rulerUsed = false; lastPanelKey = null; S.tf = 'all';
    S.tut = { step: 0 }; tutShown = -1;
    closeModal(); go('game'); renderAll();
  }
  function tutCheck() {
    if (!S.tut || S.phase !== 'play') return;
    var moved = false;
    while (S.tut.step < TUT_N - 1 && TUT_STEPS[S.tut.step].done && TUT_STEPS[S.tut.step].done()) { S.tut.step++; moved = true; }
    if (moved) sfx('pick');
    renderTut();
  }
  function tutEnd(toStory) {
    S.tut = null; save.tutDone = true; persist(); renderTut();
    if (toStory === false) return;
    S.level = null; closeModal();
    if (Object.keys(save.progress).length) { buildTitle(); go('atlas'); } else openBriefing(0);
  }
  function tutFinish() {
    var L = S.level, good = true;
    entries().forEach(function (e) { if (evalEntry(e).status !== 'ok') good = false; });
    sfx(good ? 'chime' : 'pick');
    modal([
      h('div', { class: 'kingmodal' }, [portraitKey('orlan', 'md'), h('div', {}, [h('small', { text: loc(L.title) }), h('h2', { text: t('tutEndT') })])]),
      h('p', { text: good ? t('tutEndOk') : t('tutEndKo') }),
      h('button', { class: 'btn primary', id: 'btn-tut-go', text: Object.keys(save.progress).length ? t('tutBack') : t('tutGo'), onclick: function () { tutEnd(); } })
    ]);
  }
  function tutPlace() {
    var layer = $('#tutlayer'); if (!layer || !S.tut) return;
    var st = TUT_STEPS[S.tut.step], tg = st && $(st.target), hole = $('#tuthole'), bub = $('#tutbub');
    var gr = $('#game').getBoundingClientRect();
    if (!tg || !tg.getBoundingClientRect().width) { hole.style.display = 'none'; bub.style.top = '64px'; bub.style.bottom = 'auto'; return; }
    if (tutShown !== S.tut.step) { tutShown = S.tut.step; try { if ($('#panel').contains(tg)) tg.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
    var r = tg.getBoundingClientRect(), pad = st.soft ? 0 : 5;
    hole.style.display = 'block'; hole.classList.toggle('soft', !!st.soft);
    hole.style.left = (r.left - gr.left - pad) + 'px'; hole.style.top = (r.top - gr.top - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
    /* la bulle va du côté opposé à la cible, pour ne jamais la cacher */
    var mid = (r.top + r.bottom) / 2 - gr.top, low = mid > gr.height * .5;
    if (low) { bub.style.top = '58px'; bub.style.bottom = 'auto'; } else { bub.style.bottom = '70px'; bub.style.top = 'auto'; }
  }
  function renderTut() {
    var g = $('#game'); if (!g) return;
    var layer = $('#tutlayer');
    if (!S.tut || S.phase !== 'play' || S.screen !== 'game') { if (layer) layer.remove(); clearInterval(tutTimer); tutTimer = null; return; }
    if (!layer) { layer = h('div', { id: 'tutlayer' }, [h('div', { id: 'tuthole' }), h('div', { id: 'tutbub' })]); g.appendChild(layer); }
    var step = S.tut.step, st = TUT_STEPS[step], last = step >= TUT_N - 1, bub = $('#tutbub'); clear(bub);
    var op = portraitKey('orlan', 'tut'); if (op) bub.appendChild(op);
    bub.appendChild(h('div', { class: 't' }, [h('small', { text: t('tutStep', { i: step + 1, n: TUT_N }) }), t('tutA' + (step + 1))]));
    var btns = h('div', { class: 'tb' });
    if (st.info) btns.appendChild(h('button', { id: 'tut-next', class: 'go', text: t('tutNext'), onclick: function () { S.tut.step++; sfx('pick'); renderTut(); } }));
    btns.appendChild(h('button', { class: 'skip', id: 'tut-skip', text: t('tutSkip'), onclick: function () { tutEnd(); } }));
    bub.appendChild(btns);
    if (!tutTimer) tutTimer = setInterval(function () { if (!S.tut || S.screen !== 'game') { renderTut(); return; } tutPlace(); }, 250);
    tutPlace();
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
    if (S.level && S.level.tuto) { tutFinish(); return; }
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
    var newMap = { placed: clone(S.placed), drawn: clone(S.drawn), score: sc.score, stars: stars, t: Date.now() };
    var entry = prev ? clone(prev) : { score: 0, stars: 0, noScout: false };
    var choice = null;
    if (!prev || !prev.map) entry.map = newMap;
    else {
      var useNew = sc.score >= prev.map.score;
      entry.map = useNew ? newMap : prev.map;
      choice = { old: prev.map, nw: newMap, sel: useNew ? 'nw' : 'old' };
    }
    delete entry.thumb;                                  /* la miniature se redessine depuis la carte conservée */
    entry.t = Date.now();
    if (isBest) entry.score = sc.score;
    entry.stars = Math.max(entry.stars, stars);
    if (S.scoutsUsed === 0 && stars >= 1) entry.noScout = true;
    save.progress[L.id] = entry;
    if (stars >= 1) save.notes[L.id] = true;
    delete save.inprogress[L.id];
    persist();
    S.result = { sc: sc, stars: stars, isBest: isBest && !!prev, noScout: S.scoutsUsed === 0, final: finalFor(L, newMap), choice: choice };
    S.resultView = 'diff';
    S.phase = 'result'; S.mode = 'move'; S.armed = null; S.selected = null; S.ruler = null; S.tut = null;
    sfx('chime'); buzz([30, 40, 30]);
    playOnce(stars >= 1 ? 'jingle-victoire' : 'jingle-echec', { duck: true, vol: .8 });
    fitView(); renderAll();
  }
  function renderResult(p) {
    var L = S.level, R = S.result, sc = R.sc, pad = h('div', { class: 'pad gutter', id: 'result' });
    pad.appendChild(h('div', { class: 'viewseg', role: 'group' }, [['diff', t('viewDiff'), 'loupe'], ['final', t('viewMine'), 'plume']].map(function (v) {
      return h('button', { class: S.resultView === v[0] ? 'on' : '', 'data-view': v[0], 'aria-pressed': S.resultView === v[0] ? 'true' : 'false', onclick: function () { S.resultView = v[0]; sfx('pick'); renderHint(); draw(); renderPanel(); } }, [ico(v[2], 'sm'), ' ' + v[1]]);
    })));
    var anim = !R.shown; R.shown = true;
    var liarCase = sc.score >= 88 && R.stars < 3;
    var kkey = R.stars >= 3 ? 'roi_ravi' : (liarCase ? 'roi_severe' : (R.stars === 2 ? 'roi_content' : (R.stars === 1 ? 'roi' : (sc.score < 25 ? 'roi_furieux' : 'roi_severe'))));
    pad.appendChild(h('div', { class: 'kingsay' }, [
      portraitKey(kkey, 'md') || portraitKey('roi', 'md'),
      h('div', {}, [h('h3', { text: t('resultTitle') }), h('p', { text: t(liarCase ? 'kingSayLiar' : 'kingSay' + R.stars) })]),
      ico(R.stars >= 1 ? 'sceau_rubans' : 'sceau_brise', 'seal')
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
      else { nm = loc(L.paths.filter(function (x) { return x.id === it.id; })[0].name); vis = h('b', { class: 'wave' }, [ico('plume')]); }
      vr.appendChild(h('div', { class: 'vchip ' + (it.err == null ? 'missing' : it.verdict), title: nm }, [vis, h('span', { class: 'vn', text: nm }), it.err == null ? h('i', { text: '–' }) : h('i', {}, [vIcon(it.verdict, 'xs')])]));
    });
    pad.appendChild(vr);
    if (R.isBest) pad.appendChild(h('div', { class: 'scoreline', style: 'color:var(--brass)', text: t('newBest') }));
    if (R.choice) {
      var ch = R.choice, opt = function (which, map, label) {
        var tsrc = makeThumb(finalFor(L, map));
        return h('button', { class: 'keepopt' + (ch.sel === which ? ' on' : ''), 'data-keep': which, 'aria-pressed': ch.sel === which ? 'true' : 'false',
          onclick: function () { ch.sel = which; save.progress[L.id].map = which === 'nw' ? ch.nw : ch.old; save.progress[L.id].t = Date.now(); persist(); sfx('pick'); renderPanel(); } }, [
          tsrc ? h('img', { src: tsrc, alt: '' }) : null, h('b', { text: label }), h('small', { text: t('mapScore', { s: Math.round(map.score) }) })
        ]);
      };
      pad.appendChild(h('div', { class: 'keepcard' }, [h('h3', { text: t('keepTitle') }), h('p', { class: 'help', text: t('keepHelp') }), h('div', { class: 'keeprow' }, [opt('old', ch.old, t('keepOld')), opt('nw', ch.nw, t('keepNew'))])]));
    }
    if (R.noScout && R.stars >= 1) pad.appendChild(h('div', { class: 'scoreline', style: 'font-size:.9em;color:var(--muted)' }, [ico('jeton_eclaireur', 'xs'), ' ' + t('noScoutBadge')]));
    if (sc.score >= 88 && R.stars < 3) pad.appendChild(h('p', { class: 'help', text: t('thirdStarNeed') }));

    if (L.faulty.length) {
      pad.appendChild(h('h3', { text: t('liarsTitle') }));
      L.faulty.forEach(function (id) {
        var w = L.witnesses.filter(function (x) { return x.id === id; })[0];
        pad.appendChild(h('div', { class: 'liar' }, [
          portrait(w, 'sm'), h('b', { text: ' ' + loc(w.name) }), ' — ', h('span', {}, [S.suspects[id] ? ico('fanion', 'xs') : null, S.suspects[id] ? ' ' + t('unmasked') : t('unnoticed')]),
          h('div', { style: 'margin-top:6px', text: t('liar', { name: loc(w.name), motif: loc(w.why) }) })
        ]));
      });
      L.witnesses.forEach(function (w) {
        if (S.suspects[w.id] && L.faulty.indexOf(w.id) < 0) pad.appendChild(h('p', { class: 'help', text: t('falseSuspect', { name: loc(w.name) }) }));
      });
    }
    if (R.stars >= 1) pad.appendChild(h('div', { class: 'orlan' }, [portraitKey(R.stars >= 3 ? 'orlan_clin' : 'orlan', 'sm'), h('div', {}, [h('small', { text: t('orlanNote', { n: L.id }) }), '« ' + loc(L.note) + ' »'])]));
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
          h('span', { class: 'verd ' + vcls }, [vIcon(it.verdict, 'xs'), ' ' + vlab])
        ]));
      });
      pad.appendChild(box);
    }
    if (!LEVELS[S.levelIdx + 1]) {
      pad.appendChild(h('p', { class: 'help', text: t('endOfV0') }));
      if (R.stars >= 1) {
        pad.appendChild(h('button', { class: 'btn primary', id: 'btn-ending', text: save.ending ? t('endingRevisit') : t('endingDecide'), onclick: function () { openEnding(true); } }));
        if (anim && !save.ending) setTimeout(function () { if (S.phase === 'result' && !save.ending && !$('#modal').classList.contains('on')) openEnding(); }, 3200);
      }
    }
    pad.appendChild(h('button', { class: 'btn', id: 'btn-export', onclick: function () { exportPNG(); } }, [ico('enveloppe', 'sm'), ' ' + t('export_')]));
    p.appendChild(pad);
  }

  /* ───────────── export & vignette ───────────── */
  function fitFor(W, H, ratio) { var s0 = Math.min(W, H) * (ratio || .9) / 100; return { z: 1, s0: s0, ox: (W - 100 * s0) / 2, oy: (H - 100 * s0) / 2 }; }
  /* ───────────── cartes finies : rendu propre, miniatures, export ───────────── */
  function finalFor(L, map) {
    var sc = Core.score(L, map.placed || {}, map.drawn || {}), placed = {}, drawn = {};
    sc.items.forEach(function (it) { if (it.at) { if (it.kind === 'place') placed[it.id] = it.at; else drawn[it.id] = it.at; } });
    return { level: L, placed: placed, drawn: drawn, sc: sc };
  }
  var thumbCache = {};
  function makeThumb(fin, size) {
    try {
      var N = size || 168, c = document.createElement('canvas'); c.width = c.height = N;
      var x = c.getContext('2d'); paint(x, N, N, fitFor(N, N, .86), { u: N / 336, thumb: true, final: fin, dpr: 1 });
      return c.toDataURL('image/jpeg', size ? .88 : .72);
    } catch (e) { return null; }
  }
  /* grande vignette nette pour la fiche d'une contrée terminée */
  var bigCache = {};
  function bigThumbFor(L, p) {
    if (!p || !p.map) return thumbFor(L, p);
    var key = L.id + ':' + (p.map.t || 0) + ':' + Math.round(p.map.score * 10) + ':' + I.lang;
    if (!bigCache[key]) bigCache[key] = makeThumb(finalFor(L, p.map), 720);
    return bigCache[key] || thumbFor(L, p);
  }
  function thumbFor(L, p) {
    if (p && p.map) {
      var key = L.id + ':' + (p.map.t || 0) + ':' + Math.round(p.map.score * 10);
      if (!thumbCache[key]) thumbCache[key] = makeThumb(finalFor(L, p.map));
      return thumbCache[key] || p.thumb || null;
    }
    return p && p.thumb || null;
  }
  function loadImg(src) {
    return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; });
  }
  /* PNG d'export : la carte propre (sans coches ni fantômes), titre sur bandeau, étoiles, score */
  function exportMap(o) {
    try {
      var W = 1080, H = 1440, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'); x.fillStyle = '#15242c'; x.fillRect(0, 0, W, H);
      var tim = Art.img('table'); if (tim && tim._ok) { x.drawImage(tim, 0, 0, tim.naturalWidth, tim.naturalHeight, 0, 0, W, W * tim.naturalHeight / tim.naturalWidth); x.drawImage(tim, 0, 0, tim.naturalWidth, tim.naturalHeight, 0, W * tim.naturalHeight / tim.naturalWidth - 2, W, W * tim.naturalHeight / tim.naturalWidth); x.fillStyle = 'rgba(4,10,14,.45)'; x.fillRect(0, 0, W, H); }
      var m = document.createElement('canvas'); m.width = W; m.height = W;
      paint(m.getContext('2d'), W, W, fitFor(W, W, .88), { u: 2.3, final: o.final, dpr: 1 });
      x.drawImage(m, 0, 0);
      var bim = Art.img('ui.bandeau'), bm = Art.asset('ui.bandeau'), by = W + 8;
      if (bim && bim._ok && bm) { var bw = 800, bh = bw * bm.h / bm.w; x.drawImage(bim, (W - bw) / 2, by, bw, bh); x.fillStyle = '#3a2a14'; x.textAlign = 'center'; x.textBaseline = 'middle'; var fs = 50; x.font = fs + 'px ' + FONT; while (x.measureText(o.title).width > 500 && fs > 26) { fs -= 2; x.font = fs + 'px ' + FONT; } x.fillText(o.title, W / 2, by + bh * .47); by += bh + 6; }
      else { x.fillStyle = '#eadfc0'; x.textAlign = 'center'; x.font = '54px ' + FONT; x.fillText(o.title, W / 2, by + 52); by += 80; }
      var yy = by + 22;
      if (o.stars != null) {
        var sim = Art.img('ui.etoile'), sev = Art.img('ui.etoile_vide'), sw = 64, gap = 14, x0 = W / 2 - (3 * sw + 2 * gap) / 2 - 90;
        for (var i = 0; i < 3; i++) { var im = i < o.stars ? sim : sev; if (im && im._ok) x.drawImage(im, x0 + i * (sw + gap), yy, sw, sw); }
        x.fillStyle = '#e7c874'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '52px ' + FONT; x.fillText(Math.round(o.score) + ' %', x0 + 3 * (sw + gap) + 14, yy + sw / 2);
        yy += sw + 22;
      }
      x.fillStyle = '#a9b9b4'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = '30px ' + FONT; x.fillText('Keismey Studio · ' + t('title'), W / 2, H - 28);
      var url = c.toDataURL('image/png');
      var shareBtn = null;
      try {
        if (navigator.canShare && navigator.share) {
          var blob = dataToBlob(url), file = new File([blob], 'cartographe.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) shareBtn = h('button', { class: 'btn', text: t('share'), onclick: function () { try { navigator.share({ files: [file], title: o.title }).catch(function () {}); } catch (e) {} } });
        }
      } catch (e) {}
      modal([
        h('h2', { text: t('exportTitle') }),
        h('img', { src: url, alt: '', style: 'width:100%;border-radius:6px;-webkit-user-select:auto;user-select:auto;-webkit-touch-callout:default' }),
        h('p', { class: 'help', text: t('holdToSave') }),
        h('div', { class: 'btnrow' }, [
          h('a', { class: 'btn', href: url, download: 'cartographe-' + (o.file || 'carte') + '.png', style: 'text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center', text: t('download') }),
          shareBtn,
          h('button', { class: 'btn primary', text: t('close'), onclick: closeModal })
        ])
      ]);
    } catch (e) { toast(t('exportFail')); }
  }
  function dataToBlob(url) {
    var b = atob(url.split(',')[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return new Blob([a], { type: 'image/png' });
  }
  function exportPNG() {
    var L = S.level, p = save.progress[L.id], m = p && p.map; if (!m) return;
    exportMap({ final: finalFor(L, m), title: loc(L.title), stars: m.stars, score: m.score, file: 'contree-' + L.id });
  }
  function resultPaintOpts() {
    var o = { u: 1, interactive: true, dpr: dpr };
    if (S.phase === 'result' && S.result) { if (S.resultView === 'final') o.final = S.result.final; else o.result = S.result; }
    return o;
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
  var installEv = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; });
  window.addEventListener('appinstalled', function () { installEv = null; });
  function openSettings() {
    var s = save.settings;
    modal([
      h('h2', { text: t('settingsTitle') }),
      h('div', { class: 'setrow' }, [h('span', { text: t('lang') }), seg([['fr', 'Français'], ['en', 'English']], I.lang, function (v) { s.lang = v; persist(); refreshUI(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('textSize') }), seg([[0, 'A'], [1, 'A+'], [2, 'A++']], s.textSize, function (v) { s.textSize = +v; persist(); refreshUI(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('colorblind') }), seg([['0', t('off')], ['1', t('on')]], s.cb ? '1' : '0', function (v) { s.cb = v === '1'; persist(); refreshUI(); openSettings(); })]),
      installEv ? h('div', { class: 'setrow' }, [h('span', { text: t('installApp') }), h('button', { class: 'btn small', id: 'btn-install', text: t('install'), onclick: function () { var ev = installEv; installEv = null; try { ev.prompt(); } catch (x) {} closeModal(); } })]) : null,
      h('div', { class: 'setrow' }, [h('span', { text: t('music') }), seg([['1', t('on')], ['0', t('off')]], s.music !== false ? '1' : '0', function (v) { s.music = v === '1'; persist(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('sound') }), seg([['1', t('on')], ['0', t('off')]], s.sound ? '1' : '0', function (v) { s.sound = v === '1'; persist(); openSettings(); })]),
      h('div', { class: 'setrow' }, [h('span', { text: t('vibration') }), seg([['1', t('on')], ['0', t('off')]], s.vibrate ? '1' : '0', function (v) { s.vibrate = v === '1'; persist(); openSettings(); })]),
      h('div', { class: 'optstack' }, [
        h('button', { class: 'btn', id: 'btn-notes', text: t('notesBtn'), onclick: openNotes }),
        h('button', { class: 'btn', id: 'btn-tuto', text: t('tutBtn'), onclick: startTuto }),
        h('button', { class: 'btn', id: 'btn-saveio', text: window.KS ? t('saveIo') : t('exportSave') + ' / ' + t('importSave'), onclick: function () {
          if (window.KS) { closeModal(); persistNow(); window.KS.saveDialog({ lang: I.lang, keys: [KEY, KEY + '.bak'], save: persistNow, file: 'le-cartographe', accent: '#d6b25a' }); } else openSaveIO(); } }),
        window.KS ? h('button', { class: 'btn', id: 'btn-bug', text: t('bugBtn'), onclick: function () { persistNow(); window.KS.bug('Le Cartographe', I.lang); } }) : null,
        window.KS ? h('button', { class: 'btn', id: 'btn-support', text: t('supportBtn'), onclick: function () { window.KS.support(); } }) : null,
        h('button', { class: 'btn', id: 'btn-title', text: t('titleScreen'), onclick: function () { persistNow(); closeModal(); buildTitle(); go('title'); } }),
        h('button', { class: 'btn', id: 'btn-reset', text: t('reset'), onclick: openReset })
      ]),
      h('p', { class: 'help', id: 'save-status', text: (window.Cloud && window.Cloud.active()) ? t('saveCloud') : t('saveLocal') }),
      h('p', { class: 'help', text: 'Le Cartographe · ' + t('version') + ' · Keismey Studio. ' + t('about') }),
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
          var lang = save.settings; save = defaultSave(); save.settings = lang; try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '.bak'); } catch (e) {} try { if (window.Cloud) window.Cloud.wipe(); } catch (e) {} persist(); S.level = null; closeModal(); buildTitle(); go('title'); } })
      ])
    ]);
  }

  /* ───────────── vue (zoom / déplacement) ───────────── */
  function SC() { return view.s0 * view.z; }
  function w2s(p) { return { x: view.ox + p.x * SC(), y: view.oy + (100 - p.y) * SC() }; }
  function s2w(x, y) { return { x: (x - view.ox) / SC(), y: 100 - (y - view.oy) / SC() }; }
  function fitView() { view = fitFor(cw || 360, ch || 360, .9); }
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
  function draw() { if (dirty) return; dirty = true; requestAnimationFrame(function () { dirty = false; renderRail(); if (!cx || !S.level || S.screen !== 'game') return; animating = false; cx.setTransform(dpr, 0, 0, dpr, 0, 0); paint(cx, cw, ch, view, resultPaintOpts()); if (animating) draw(); }); }

  function mark(c, x, y, status, u) {
    var vk = status === 'ok' ? 'ui.verdict_ok' : (status === 'near' ? 'ui.verdict_presque' : (status === 'ko' ? 'ui.verdict_rate' : null)), vim = vk && Art.img(vk);
    if (vim && vim._ok) {
      var dd = 26 * u; c.save(); c.fillStyle = 'rgba(246,238,214,.94)'; c.beginPath(); c.arc(x, y, dd * .47, 0, 6.3); c.fill(); c.drawImage(vim, x - dd / 2, y - dd / 2, dd, dd); c.restore(); return;
    }
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
        var vrim = Art.img('ui.verdict_rate');
        if (vrim && vrim._ok) { c.fillStyle = '#f6eed6'; c.strokeStyle = 'rgba(60,30,10,.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by, br, 0, 6.3); c.fill(); c.stroke(); c.drawImage(vrim, bx - br * .92, by - br * .92, br * 1.84, br * 1.84); }
        else {
        c.fillStyle = '#b8402a'; c.strokeStyle = '#f4ead0'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, br, 0, 6.3); c.fill(); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = Math.max(2, br * .2); c.beginPath(); c.moveTo(bx - br * .38, by - br * .38); c.lineTo(bx + br * .38, by + br * .38); c.moveTo(bx + br * .38, by - br * .38); c.lineTo(bx - br * .38, by + br * .38); c.stroke(); }
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
      var fs = Math.max(11, q.R * .78), name = loc(q.pl.name); if (!name) return;
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
    var FIN = o.final || null, L = FIN ? FIN.level : S.level; if (!L) return;
    var PLD = FIN ? FIN.placed : S.placed, DRN = FIN ? FIN.drawn : S.drawn, SEL = FIN ? null : S.selected, GG = FIN ? null : G;
    var FREE = !FIN && S.free && !o.result;
    lastBadge = null;
    var u = o.u || 1, sc = V.s0 * V.z;
    function X(wx) { return V.ox + wx * sc; } function Y(wy) { return V.oy + (100 - wy) * sc; }
    function P(p) { return { x: X(p.x), y: Y(p.y) }; }
    var g = { P: P, sc: sc, u: u };
    c.save(); c.fillStyle = '#1b150f'; c.fillRect(0, 0, W, H);
    var tim = Art.img('table');
    if (tim && tim._ok && !o.thumb) { var tk = Math.max(W, H) / tim.naturalWidth; c.drawImage(tim, 0, 0, tim.naturalWidth * tk, tim.naturalHeight * tk); c.fillStyle = 'rgba(4,10,14,.28)'; c.fillRect(0, 0, W, H); }
    var pad = 7, x0 = X(-pad), y0 = Y(100 + pad), sz = (100 + 2 * pad) * sc;
    var pim = Art.img('parchment');
    if (pim && pim._ok) c.drawImage(pim, 20, 20, 984, 984, x0, y0, sz, sz); else c.drawImage(Art.parchment(), x0, y0, sz, sz);
    c.strokeStyle = 'rgba(50,34,12,.6)'; c.lineWidth = 2 * u; c.strokeRect(x0, y0, sz, sz);
    var ink = 'rgba(58,44,28,.8)', fx = X(0), fy = Y(100), fs = 100 * sc;
    /* remplissage du terrain : zones au crayon pâle (carte finie, mode libre) */
    var tzones = null, tstrokes = null, tbase = null;
    if (FIN) { if (FIN.free) { tzones = []; tstrokes = FIN.strokes || []; } else { tzones = L.terrain || []; tbase = L.tbase || 'plain'; tstrokes = FIN.strokes || null; } }
    else if (FREE) { tzones = []; tstrokes = S.free.cur.strokes.concat(GG && GG.type === 'brush' ? [GG.stroke] : []); }
    if (tzones && window.Terrain) window.Terrain.render(c, W, H, tzones, tstrokes, { X: X, Y: Y, sc: sc }, { u: u, strong: !tzones.length, base: tbase, clip: { x: fx, y: fy, w: fs, h: fs }, dpr: o.dpr || 1 });
    /* cadre gradué */
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
    var rim = Art.img('ui.rose');
    if (rim && rim._ok) { var rs = Math.max(34 * u, 16 * sc); c.save(); c.globalAlpha = .93; c.drawImage(rim, X(90.5) - rs / 2, Y(10.5) - rs / 2, rs, rs); c.restore(); }
    else Art.rose(c, X(91.5), Y(9), Math.max(13 * u, 5.2 * sc), 'rgba(58,44,28,.7)');
    /* coins dorés */
    var cim = Art.img('ui.coin');
    if (cim && cim._ok && !o.thumb) {
      var cs = Math.max(30 * u, 10 * sc), off = 3.5 * u;
      [[fx - off, fy - off, 1, 1], [fx + fs + off, fy - off, -1, 1], [fx - off, fy + fs + off, 1, -1], [fx + fs + off, fy + fs + off, -1, -1]].forEach(function (q) {
        c.save(); c.translate(q[0], q[1]); c.scale(q[2], q[3]); c.globalAlpha = .95; c.drawImage(cim, 0, 0, cs, cs); c.restore();
      });
    }

    /* tracés */
    function drawRiver(pts, alpha, dashed, type) {
      var sp = pts.map(P); c.save(); c.globalAlpha = alpha; c.lineJoin = 'round'; c.lineCap = 'round';
      if (dashed) { c.strokeStyle = '#b5851c'; c.lineWidth = Math.max(4 * u, 1.3 * sc); c.setLineDash([9 * u, 7 * u]); Art.smooth(c, sp); c.stroke(); }
      else if (type === 'road') {
        c.strokeStyle = 'rgba(90,62,30,.25)'; c.lineWidth = Math.max(9 * u, 3.2 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#8b6330'; c.lineWidth = Math.max(4.6 * u, 1.6 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#d9bf86'; c.lineWidth = Math.max(1.8 * u, .6 * sc); Art.smooth(c, sp); c.stroke();
      } else if (type === 'trail') {
        c.strokeStyle = '#6b5a2e'; c.lineWidth = Math.max(3.4 * u, 1.2 * sc); c.setLineDash([2 * u, 6 * u]); Art.smooth(c, sp); c.stroke();
      } else if (type === 'coast') {
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(11 * u, 3.9 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#2f8a94'; c.lineWidth = Math.max(4.6 * u, 1.6 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#a9e2e0'; c.lineWidth = Math.max(1.8 * u, .6 * sc); c.setLineDash([3 * u, 5 * u]); Art.smooth(c, sp); c.stroke();
      } else if (type === 'ditch') {
        c.strokeStyle = 'rgba(60,70,80,.28)'; c.lineWidth = Math.max(9 * u, 3.2 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#5c6b78'; c.lineWidth = Math.max(4 * u, 1.4 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#9fb3c0'; c.lineWidth = Math.max(1.6 * u, .55 * sc); c.setLineDash([4 * u, 3 * u]); Art.smooth(c, sp); c.stroke();
      } else {
        c.strokeStyle = 'rgba(52,100,140,.28)'; c.lineWidth = Math.max(11 * u, 3.9 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#3f7aa6'; c.lineWidth = Math.max(5.6 * u, 2 * sc); Art.smooth(c, sp); c.stroke();
        c.strokeStyle = '#a7d2e8'; c.lineWidth = Math.max(2.4 * u, .8 * sc); Art.smooth(c, sp); c.stroke();
      }
      c.restore();
    }
    function pathLabel(pa, pts) {
      var spts = [], si2, stamps = L.places.filter(function (q) { return PLD[q.id]; }).map(function (q) { return P(PLD[q.id]); });
      for (si2 = 0; si2 < pts.length - 1; si2++) for (var tt = 0; tt < 4; tt++) spts.push({ x: pts[si2].x + (pts[si2 + 1].x - pts[si2].x) * tt / 4, y: pts[si2].y + (pts[si2 + 1].y - pts[si2].y) * tt / 4 });
      var mid = spts[Math.floor(spts.length / 2)] || pts[0], bestD = -1;
      spts.forEach(function (q, qi) { if (qi < 1 || qi > spts.length - 3) return; var qs = P(q), m = 1e9; stamps.forEach(function (s2) { m = Math.min(m, Math.hypot(s2.x - qs.x, s2.y - qs.y)); }); if (m > bestD) { bestD = m; mid = q; } });
      if (!loc(pa.name)) return; var pp = P(mid); c.save(); c.font = 'italic ' + Math.max(11, 3.6 * sc * .8) + 'px ' + FONT; c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.lineWidth = 4 * u; c.strokeStyle = 'rgba(238,226,190,.9)'; c.strokeText(loc(pa.name), pp.x + 9 * u, pp.y - 5 * u); c.fillStyle = '#244a66'; c.fillText(loc(pa.name), pp.x + 9 * u, pp.y - 5 * u); c.restore();
    }
    var R = o.result;
    L.paths.forEach(function (pa) {
      if (R) {
        drawRiver(Core.toPts(pa.truth), .95, true);
        var it = R.sc.items.filter(function (x) { return x.id === pa.id && x.kind === 'path'; })[0];
        if (it && it.at) { drawRiver(it.at, .55, false, pa.type); }
      } else {
        var pts = DRN[pa.id];
        var cur = GG && GG.type === 'draw' && GG.path === pa.id ? GG.pts : null;
        if (cur && cur.length > 1) drawRiver(cur, .6, false, pa.type);
        else if (pts && pts.length > 1) { drawRiver(pts, 1, false, pa.type); if (!o.thumb) pathLabel(pa, pts); }
      }
    });

    if (GG && GG.type === 'draw' && GG.path === '__new' && GG.pts.length > 1) drawRiver(GG.pts, .6, false);
    /* indices */
    if (!R && !FIN && S.ghost && o.interactive) shownEntries().forEach(function (e) { ghostFor(c, g, e); });

    /* tampons */
    var Q = [], Rr = clamp(sc * 5.2, 14, 25) * (o.u || 1);
    if (o.thumb) Rr = Math.max(6, sc * ((o.u || 1) > 1 ? 7 : 5.4));
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
        if (SEL === pl.id) return; var pp = PLD[pl.id]; if (!pp) return; var s = P(pp);
        stamp(c, s.x, s.y, pl, { R: Rr, q: Q, pop: FIN ? 1 : popScale(pl.id) });
      });
      if (SEL && PLD[SEL]) { var sp2 = P(PLD[SEL]); stamp(c, sp2.x, sp2.y, placeById(SEL), { R: Rr, selected: true, q: Q, pop: popScale(SEL), badge: !!o.interactive && S.phase === 'play' && !(G && G.type === 'stamp' && G.moved) }); }
    }

    layoutLabels(c, Q, W, H);

    /* règle */
    if (!R && !FIN && S.ruler && o.interactive) {
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
      if (S.free && S.mode === 'brush' && S.brush) { var wb = s2w(p.x, p.y); G = { type: 'brush', stroke: { k: S.brush.k || 'plain', w: S.brushSize, erase: !!S.brush.erase, pts: [[round1(wb.x), round1(wb.y)]] } }; draw(); return; }
      if (S.mode === 'draw' && S.activePath) { var w2 = s2w(p.x, p.y); G = { type: 'draw', path: S.activePath, pts: [w2], raw: p }; draw(); return; }
      if (S.selected && S.placed[S.selected] && lastBadge && Math.hypot(p.x - lastBadge.x, p.y - lastBadge.y) <= lastBadge.r + 10) {
        snap(); dropStamp(S.selected); S.selected = null; sfx('low'); buzz(10); changed(); return;
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
        if (Math.hypot(wp.x - last.x, wp.y - last.y) > .5 / Math.max(1, view.z * .6)) { G.pts.push({ x: clamp(wp.x, -3, 103), y: clamp(wp.y, -3, 103) }); sfx('scratch'); draw(); }
      }
      else if (G.type === 'brush') {
        var wq = s2w(p.x, p.y), lp = G.stroke.pts[G.stroke.pts.length - 1];
        if (Math.hypot(wq.x - lp[0], wq.y - lp[1]) > .5) { G.stroke.pts.push([round1(wq.x), round1(wq.y)]); sfx('brush'); draw(); }
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
      else if (g.type === 'brush') { snap(); S.free.cur.strokes.push(g.stroke); changed(); }
      else if (g.type === 'draw') {
        var pts = g.pts, len = 0; for (var i = 1; i < pts.length; i++) len += Core.dist(pts[i - 1], pts[i]);
        if (pts.length >= 2 && len > 6) { snap(); var pid = g.path; if (S.free && pid === '__new') pid = addFreePath(S.freePath); S.drawn[pid] = Core.simplify(pts, .7); S.mode = 'move'; S.activePath = null; sfx('scratchend'); buzz(8); changed(); renderHint(); } else draw();
      }
      else if (g.type === 'stamp') {
        if (g.moved) {
          var r = cv.getBoundingClientRect(), out = p.x < -10 || p.y < -10 || p.x > r.width + 10 || p.y > r.height + 10;
          if (out) { dropStamp(g.id); S.selected = null; sfx('low'); } else { sfx('stamp'); buzz(12); }
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
    snap(); var keepArmed = null;
    if (S.free && id.indexOf('type:') === 0) {
      var m = S.free.cur, type = id.slice(5); m.seq = (m.seq || 0) + 1; keepArmed = id; id = 'f' + m.seq;
      m.places.push({ id: id, type: type }); S.level.places.push({ id: id, type: type, name: { fr: '', en: '' }, truth: [0, 0] });
    }
    S.placed[id] = { x: clamp(w.x, 0, 100), y: clamp(w.y, 0, 100) }; S.armed = keepArmed; S.selected = id;
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
        else { S.armed = S.armed === pl.id ? null : pl.id; if (S.free) { S.mode = 'move'; S.activePath = null; } sfx('pick'); renderPanel(); renderHint(); }
      }
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }


  /* ───────────── mode libre ───────────── */
  var MAX_FREE = 12;
  function round1(v) { return Math.round(v * 10) / 10; }
  function freeUnlocked() { var p = save.progress[LEVELS[0].id]; return !!(p && p.stars >= 1); }
  /* ce que le joueur a débloqué : tout ce qu'utilisent les contrées terminées */
  function kit() {
    var K = { stamps: {}, paths: {}, terrain: { plain: 1 } };      /* la plaine est offerte dès le départ */
    LEVELS.forEach(function (L) {
      var p = save.progress[L.id]; if (!p || p.stars < 1) return;
      L.places.forEach(function (pl) { K.stamps[pl.type] = 1; });
      L.paths.forEach(function (pa) { K.paths[pa.type] = 1; });
      (L.terrain || []).forEach(function (z) { K.terrain[z.k] = 1; });
      var u = L.unlock || {};
      (u.stamps || []).forEach(function (k) { K.stamps[k] = 1; }); (u.paths || []).forEach(function (k) { K.paths[k] = 1; }); (u.terrain || []).forEach(function (k) { K.terrain[k] = 1; });
    });
    return K;
  }
  function freeTitle(m) { return m.name || t('freeUntitled', { n: m.n || 1 }); }
  function freeLevel(m) {
    var L = { id: 'free', free: true, scale: 20, title: { fr: freeTitle(m), en: freeTitle(m) }, places: [], paths: [], witnesses: [], faulty: [], scouts: [], tokens: { ask: 0, scout: 0 }, terrain: [] };
    m.places.forEach(function (p) { L.places.push({ id: p.id, type: p.type, name: { fr: '', en: '' }, truth: [0, 0] }); });
    m.paths.forEach(function (p) { L.paths.push({ id: p.id, type: p.type, name: { fr: '', en: '' }, truth: [] }); });
    return L;
  }
  function syncFreeLevel() { var L = freeLevel(S.free.cur); S.level.places = L.places; S.level.paths = L.paths; S.level.title = L.title; }
  function finalFree(m) { return { level: freeLevel(m), placed: m.placed, drawn: m.drawn, strokes: m.strokes, free: true }; }
  function freeMapById(id) { return save.free.maps.filter(function (m) { return m.id === id; })[0]; }
  function addFreePath(type) {
    var m = S.free.cur; m.seq = (m.seq || 0) + 1; var id = 'p' + m.seq;
    m.paths.push({ id: id, type: type || 'river' }); S.level.paths.push({ id: id, type: type || 'river', name: { fr: '', en: '' }, truth: [] }); return id;
  }
  function newFree() {
    if (save.free.maps.length >= MAX_FREE) { toast(t('freeMax')); return; }
    save.free.seq = (save.free.seq || 0) + 1;
    var m = { id: 'm' + Date.now().toString(36), n: save.free.seq, name: '', t: Date.now(), places: [], paths: [], placed: {}, drawn: {}, strokes: [], seq: 0 };
    save.free.maps.unshift(m); persist(); startFree(m.id);
  }
  function startFree(id) {
    var m = freeMapById(id); if (!m) return;
    S.free = { cur: m }; S.levelIdx = -1; S.level = freeLevel(m); S.phase = 'play'; S.result = null; S.resultView = 'diff';
    S.placed = m.placed; S.drawn = m.drawn; S.asked = {}; S.scoutsUsed = 0; S.suspects = {}; S.pins = {};
    S.mode = 'move'; S.activePath = null; S.ghost = false; S.panel = 'tools'; S.openCard = null; S.selected = null; S.armed = null;
    S.undo = []; S.ruler = null; S.tut = null; lastPanelKey = null; S.freePath = null; S.brush = null; S.brushKey = ''; S.brushSize = S.brushSize || 6;
    go('game'); renderAll();
  }
  function leaveFree() { persistProgress(); S.free = null; S.level = null; S.armed = null; S.mode = 'move'; S.brush = null; S.brushKey = ''; railKey = ''; go('free'); }
  function exportFree() { var m = S.free.cur; exportMap({ final: finalFree(m), title: freeTitle(m), stars: null, file: 'carte-libre' }); }
  function renameFree(m) {
    var inp = h('input', { type: 'text', id: 'free-name', maxlength: '32', value: m.name || '', placeholder: freeTitle(m), style: 'width:100%;min-height:48px;font:inherit;font-size:1.1em;padding:8px 12px;border-radius:8px;border:1px solid #8a6a2a;background:#fbf4de;color:#2f2314;-webkit-user-select:text;user-select:text' });
    var okf = function () { m.name = inp.value.trim().slice(0, 32); persist(); closeModal(); if (S.free) { syncFreeLevel(); renderTop(); renderPanel(); draw(); } else buildFreeList(); };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') okf(); });
    modal([h('h2', { text: t('freeName') }), inp, h('div', { class: 'btnrow' }, [h('button', { class: 'btn', text: t('cancel'), onclick: closeModal }), h('button', { class: 'btn primary', id: 'btn-name-ok', text: t('save'), onclick: okf })])]);
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
  }
  var freeThumbs = {};
  function freeThumb(m) { var key = m.id + ':' + m.t; if (!freeThumbs[key]) freeThumbs[key] = makeThumb(finalFree(m)); return freeThumbs[key]; }
  function freeCard() {
    var ok = freeUnlocked();
    return h('button', { class: 'region freeentry', id: 'region-free', disabled: ok ? null : true, onclick: function () { audio(); go('free'); } }, [
      h('div', { class: 'thumb freeicon' }, [ico('plume')]),
      h('div', { class: 'meta' }, [h('div', { class: 'nm', text: t('freeMode') }), h('div', { class: 'sub', text: ok ? t('freeSub') : t('freeLockedText') }), ok ? h('div', { class: 'sub', text: save.free.maps.length + ' / ' + MAX_FREE }) : null])
    ]);
  }
  function buildFreeList() {
    var el = $('#free'); if (!el) return; clear(el);
    el.appendChild(h('div', { class: 'topbar gutter' }, [
      h('button', { class: 'iconbtn', 'aria-label': t('back'), onclick: function () { go('atlas'); } }, [uiIcon('retour')]),
      h('h2', { text: t('freeMode') }),
      h('button', { class: 'iconbtn', 'aria-label': t('settings'), onclick: openSettings }, [uiIcon('engrenage')])
    ]));
    var body = h('div', { class: 'body scroll gutter' });
    body.appendChild(h('p', { class: 'lead', text: t('freeIntro') }));
    body.appendChild(h('button', { class: 'btn primary', id: 'btn-free-new', text: t('freeNew'), onclick: newFree }));
    if (!save.free.maps.length) body.appendChild(h('p', { class: 'help', text: t('freeEmpty') }));
    save.free.maps.forEach(function (m) {
      var ts = freeThumb(m);
      body.appendChild(h('div', { class: 'region freecard', 'data-fid': m.id }, [
        h('button', { class: 'fc-open', onclick: function () { audio(); startFree(m.id); } }, [
          ts ? h('img', { class: 'thumb', src: ts, alt: '' }) : h('div', { class: 'thumb' }),
          h('div', { class: 'meta' }, [h('div', { class: 'nm', text: freeTitle(m) }), h('div', { class: 'sub', text: m.places.length + ' · ' + m.paths.length })])
        ]),
        h('div', { class: 'fc-actions' }, [
          h('button', { class: 'iconbtn', 'aria-label': t('exportMap'), onclick: function () { exportMap({ final: finalFree(m), title: freeTitle(m), stars: null, file: 'carte-libre' }); } }, [ico('enveloppe')]),
          h('button', { class: 'iconbtn', 'aria-label': t('freeRename'), onclick: function () { renameFree(m); } }, [uiIcon('crayon')]),
          h('button', { class: 'iconbtn', 'aria-label': t('freeDelete'), onclick: function () {
            modal([h('h2', { text: t('freeDelete') }), h('p', { text: t('freeDeleteSure') }), h('div', { class: 'btnrow' }, [
              h('button', { class: 'btn', text: t('cancel'), onclick: closeModal }),
              h('button', { class: 'btn primary', text: t('freeDelete'), onclick: function () { save.free.maps = save.free.maps.filter(function (x) { return x.id !== m.id; }); save.free.del = (save.free.del || []).concat([m.id]).slice(-60); persist(); closeModal(); buildFreeList(); } })])]);
          } }, [uiIcon('corbeille')])
        ])
      ]));
    });
    el.appendChild(body);
  }
  /* palette & barre de raccourcis du mode libre */
  function toggleBrush(k, erase) {
    if (S.mode === 'brush' && S.brush && !!S.brush.erase === !!erase && (erase || S.brush.k === k)) { S.mode = 'move'; S.brush = null; S.brushKey = ''; }
    else { S.mode = 'brush'; S.brush = erase ? { erase: true } : { k: k }; S.brushKey = erase ? 'erase' : k; S.lastBrush = k || S.lastBrush; S.armed = null; S.activePath = null; }
    sfx('pick'); renderPanel(); renderHint(); draw();
  }
  function toggleFreeDraw(type) {
    if (S.mode === 'draw' && S.freePath === type) { S.mode = 'move'; S.activePath = null; }
    else { S.mode = 'draw'; S.activePath = '__new'; S.freePath = type; S.armed = null; S.brush = null; S.brushKey = ''; }
    sfx('pick'); renderPanel(); renderHint(); draw();
  }
  function freeRail(el) {
    var K = kit(), sel = !!(S.selected && S.placed[S.selected]), firstPath = Object.keys(K.paths)[0], terr = window.Terrain.ORDER.filter(function (k) { return K.terrain[k]; });
    el.appendChild(railBtn('r-move', uiIcon('main'), t('move'), S.mode === 'move', false, setMove));
    el.appendChild(railBtn('r-draw', ico('plume'), t('draw'), S.mode === 'draw', !firstPath, function () { toggleFreeDraw(S.freePath || firstPath); }));
    el.appendChild(railBtn('r-pencil', uiIcon('crayon'), t('pencil'), S.mode === 'brush' && S.brush && !S.brush.erase, !terr.length, function () { toggleBrush(S.lastBrush && K.terrain[S.lastBrush] ? S.lastBrush : terr[0]); }));
    el.appendChild(railBtn('r-eraser', uiIcon('gomme'), t('eraser'), S.mode === 'brush' && S.brush && S.brush.erase, false, function () { toggleBrush(null, true); }));
    el.appendChild(railBtn('r-undo', uiIcon('annuler'), t('undo'), false, !S.undo.length, undo));
    el.appendChild(railBtn('r-remove', uiIcon('corbeille'), t('removeStamp'), false, !sel, removeSel));
  }
  function renderFreePanel(p) {
    var m = S.free.cur, K = kit(), pad = h('div', { class: 'pad gutter' });
    pad.appendChild(h('h3', { text: t('freeStamps') }));
    var chips = h('div', { class: 'chips' });
    Object.keys(K.stamps).forEach(function (type) {
      var id = 'type:' + type, nm = I.sub('stampNames', type);
      var chip = h('div', { class: 'chip' + (S.armed === id ? ' armed' : ''), role: 'button', tabindex: '0', 'data-type': type, 'aria-label': nm }, [chipImage(type), h('span', { text: nm })]);
      chip.addEventListener('pointerdown', function (e) { chipDown(e, { id: id, type: type }); });
      chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.armed = S.armed === id ? null : id; S.mode = 'move'; renderPanel(); renderHint(); } });
      chips.appendChild(chip);
    });
    pad.appendChild(chips);
    pad.appendChild(h('h3', { text: t('freePaths') }));
    var tg = h('div', { class: 'tools' });
    Object.keys(K.paths).forEach(function (pt) {
      tg.appendChild(h('button', { class: 'tool' + (S.mode === 'draw' && S.freePath === pt ? ' on' : ''), 'data-fpath': pt, style: 'grid-column: span 2', onclick: function () { toggleFreeDraw(pt); } }, [h('b', {}, [ico('plume')]), t('freeDrawRiver', { name: I.sub('pathNames', pt) })]));
      m.paths.filter(function (pa) { return pa.type === pt; }).forEach(function (pa, i) {
        tg.appendChild(h('button', { class: 'tool', 'data-fdel': pa.id, onclick: function () { snap(); m.paths = m.paths.filter(function (x) { return x.id !== pa.id; }); delete m.drawn[pa.id]; S.drawn = m.drawn; syncFreeLevel(); sfx('low'); changed(); } }, [h('b', {}, [uiIcon('corbeille')]), I.sub('pathNames', pt) + ' ' + (i + 1)]));
      });
    });
    pad.appendChild(tg);
    pad.appendChild(h('h3', { text: t('freePencils') }));
    var pc = h('div', { class: 'pencils' });
    window.Terrain.ORDER.forEach(function (k) {
      if (!K.terrain[k]) return; var KK = window.Terrain.KINDS[k], on = S.mode === 'brush' && S.brush && !S.brush.erase && S.brush.k === k;
      var rgb = 'rgb(' + KK.col.join(',') + ')', ink = 'rgba(' + KK.ink.join(',') + ',.55)';
      pc.appendChild(h('button', { class: 'pencil' + (on ? ' on' : ''), 'data-brush': k, onclick: function () { toggleBrush(k); } }, [
        h('i', { style: 'background:repeating-linear-gradient(45deg,' + ink + ' 0 1px,transparent 1px 5px),' + rgb }), h('span', { text: loc(KK.name) })]));
    });
    pc.appendChild(h('button', { class: 'pencil' + (S.mode === 'brush' && S.brush && S.brush.erase ? ' on' : ''), 'data-brush': 'erase', onclick: function () { toggleBrush(null, true); } }, [h('i', { class: 'er' }, [uiIcon('gomme')]), h('span', { text: t('eraser') })]));
    pad.appendChild(pc);
    pad.appendChild(h('div', { class: 'brushsize' }, [h('span', { text: t('brushSize') }), seg([[3, t('brushS')], [6, t('brushM')], [12, t('brushL')]], S.brushSize, function (v) { S.brushSize = +v; renderPanel(); })]));
    pad.appendChild(h('button', { class: 'linkbtn', id: 'btn-free-clear', text: t('freeClear'), disabled: m.strokes.length ? null : true, onclick: function () { if (!m.strokes.length) return; snap(); m.strokes = []; sfx('low'); changed(); } }));
    pad.appendChild(h('p', { class: 'help', text: t('freeMoreHint') }));
    p.appendChild(pad);
  }

  /* ───────────── démarrage ───────────── */
  function boot() {
    var app = $('#app');
    ['title', 'atlas', 'briefing', 'free', 'game'].forEach(function (n) { app.appendChild(h('section', { id: n, class: 'screen' })); });
    try { var ql = new URLSearchParams(location.search).get('lang'); if (ql === 'fr' || ql === 'en') save.settings.lang = ql; } catch (e) {}
    if (!save.settings.lang) save.settings.lang = (navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
    var atlasT = null;
    Art.onload = function () { draw(); clearTimeout(atlasT); atlasT = setTimeout(function () { thumbCache = {}; freeThumbs = {}; if (S.screen === 'atlas') renderAtlas(); else if (S.screen === 'free') buildFreeList(); }, 250); };
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    document.addEventListener('visibilitychange', function () { if (document.hidden) { if (S.level && S.phase === 'play') persistProgress(); persistNow(); } });
    window.addEventListener('pagehide', function () { persistNow(); });
    try { if (window.Cloud) window.Cloud.start(function () { return save; }, mergeRemote); } catch (e) {}
    try { if (document.fonts) { document.fonts.load("italic 16px 'IM Fell English'"); document.fonts.ready.then(function () { draw(); }); } } catch (e) {}
    Art.preload();
    applySettings(); buildTitle(); buildGame(); go('title');
    if (!save.pnV) { var had = Object.keys(save.progress).length > 0 || Object.keys(save.inprogress).length > 0; if (had) setTimeout(function () { if (!$('#modal').classList.contains('on')) openNotes(); }, 900); else { save.pnV = VERSION; persist(); } }
    else if (save.pnV !== VERSION) setTimeout(function () { if (!$('#modal').classList.contains('on')) openNotes(); }, 900);
    $('#modal').addEventListener('pointerdown', function (e) { if (e.target === $('#modal')) closeModal(); });

    /* Bouton retour du téléphone (hub Keismey Studio, voir ks-back.js) */
    function onBack() {
      if ($('#modal').classList.contains('on')) { closeModal(); return null; }
      if (S.screen === 'game') { if (S.free) leaveFree(); else { persistProgress(); go('atlas'); } return null; }
      if (S.screen === 'briefing' || S.screen === 'free') { go('atlas'); return null; }
      if (S.screen === 'atlas') { buildTitle(); go('title'); return null; }
      modal([
        h('h2', { text: t('leaveT') }), h('p', { class: 'hint', text: t('leaveX') }),
        h('div', { class: 'btnrow' }, [
          h('button', { class: 'btn', text: t('cancel'), onclick: closeModal }),
          h('button', { class: 'btn primary', text: t('toHub'), onclick: function () { closeModal(); if (window.KSBack) window.KSBack.toHub(); } })
        ])
      ]);
      return null;
    }
    if (window.KSBack) window.KSBack.init({ back: onBack, lang: function () { return save.settings.lang === 'en' ? 'en' : 'fr'; } });
    window.__cart = { startTuto: startTuto, tutCheck: tutCheck, openKing: openKing, mus: mus, playOnce: playOnce, sfx: sfx, S: S, save: function () { return save; }, view: function () { return view; }, w2s: w2s, s2w: s2w, startLevel: startLevel, openBriefing: openBriefing, go: go, doSubmit: doSubmit, placeAt: placeAt, snap: snap, changed: changed, askWitness: askWitness, useScout: useScout, renderAll: renderAll, setLang: function (l) { save.settings.lang = l; refreshUI(); } };
    if (document.fonts && document.fonts.load) { document.fonts.load("16px 'IM Fell English'").then(function () { draw(); }, function () {}); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
