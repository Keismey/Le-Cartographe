/* Le Cartographe — remplissage du terrain : zones de couleur « crayon pâle », abstraites.
   Zones (décrites dans levels.js, en coordonnées de la vérité) + traits de brosse (mode libre).
   Rendu : un calque par type de terrain, rempli d'une trame de hachures au crayon (motif), puis posé sur le parchemin. */
(function (root) {
  'use strict';

  /* col = teinte du papier coloré, ink = trait du crayon, a = intensité, order = ordre d'empilement */
  var KINDS = {
    plain:    { name: { fr: 'Plaine',    en: 'Plains' },    col: [140, 178, 104], ink: [96, 140, 70],   a: .30, h: .21, order: 0 },
    field:    { name: { fr: 'Blé',       en: 'Wheat' },     col: [232, 196, 72],  ink: [186, 140, 30],  a: .5, h: .3, order: 1 },
    hill:     { name: { fr: 'Collines',  en: 'Hills' },     col: [192, 176, 98],  ink: [144, 122, 56],  a: .45, h: .28, order: 1 },
    marsh:    { name: { fr: 'Marais',    en: 'Marsh' },     col: [120, 164, 150], ink: [66, 118, 110],  a: .45, h: .28, order: 1 },
    sand:     { name: { fr: 'Sable',     en: 'Sand' },      col: [238, 212, 152], ink: [194, 154, 84],  a: .5, h: .26, order: 1 },
    water:    { name: { fr: 'Eau',       en: 'Water' },     col: [136, 184, 218], ink: [66, 118, 170],  a: .5, h: .28, order: 2 },
    forest:   { name: { fr: 'Forêt',     en: 'Forest' },    col: [86, 138, 88],   ink: [40, 96, 52],    a: .48, h: .1, order: 3, dots: true },
    mountain: { name: { fr: 'Montagnes', en: 'Mountains' }, col: [252, 250, 242], ink: [118, 124, 142], a: .88, h: .3, order: 4, cross: true }
  };
  var ORDER = Object.keys(KINDS).sort(function (a, b) { return KINDS[a].order - KINDS[b].order; });

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ───────── formes ───────── */
  /* Blob : ellipse (centre c, rayons r, rotation rot en degrés) au contour légèrement irrégulier. */
  function blob(z) {
    if (z._pts) return z._pts;
    var R = rng(z.seed || (Math.round(z.c[0] * 7 + z.c[1] * 13 + (z.r[0] + z.r[1]) * 5) + 11)), n = 20, pts = [], rot = (z.rot || 0) * Math.PI / 180, j = z.j == null ? .2 : z.j;
    var p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28, i;
    for (i = 0; i < n; i++) {
      var a = i / n * 6.2832, m = 1 + j * (.55 * Math.sin(a * 2 + p1) + .3 * Math.sin(a * 3 + p2) + .25 * Math.sin(a * 5 + p3));
      var ex = Math.cos(a) * z.r[0] * m, ey = Math.sin(a) * z.r[1] * m;
      pts.push([z.c[0] + ex * Math.cos(rot) - ey * Math.sin(rot), z.c[1] + ex * Math.sin(rot) + ey * Math.cos(rot)]);
    }
    z._pts = pts; return pts;
  }
  function shapePts(z) { return z.poly || blob(z); }

  /* Courbe fermée lissée (Catmull-Rom → Bézier) en pixels */
  function closedPath(c, P) {
    var n = P.length; if (n < 3) return;
    c.beginPath(); c.moveTo((P[0].x + P[n - 1].x) / 2, (P[0].y + P[n - 1].y) / 2);
    for (var i = 0; i < n; i++) { var p = P[i], q = P[(i + 1) % n]; c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2); }
    c.closePath();
  }
  function openPath(c, P) {
    c.beginPath(); c.moveTo(P[0].x, P[0].y);
    if (P.length === 1) { c.lineTo(P[0].x + .01, P[0].y); return; }
    for (var i = 1; i < P.length - 1; i++) c.quadraticCurveTo(P[i].x, P[i].y, (P[i].x + P[i + 1].x) / 2, (P[i].y + P[i + 1].y) / 2);
    c.lineTo(P[P.length - 1].x, P[P.length - 1].y);
  }

  /* ───────── trame de crayon (motif répétable) ───────── */
  var tiles = {};
  function tile(kind, us, strong) {
    var key = kind + '@' + us + (strong ? 's' : ''); if (tiles[key]) return tiles[key];
    var K = KINDS[kind], p = 8 * us, T = 12 * p, cv = document.createElement('canvas'); cv.width = cv.height = T;
    var x = cv.getContext('2d'), R = rng(kind.length * 977 + kind.charCodeAt(0) * 31), i, k;
    x.fillStyle = rgba(K.col, Math.min(.85, K.a * (strong ? 1.15 : .55))); x.fillRect(0, 0, T, T);
    /* grain de papier */
    for (i = 0; i < T * T / (40 * us * us); i++) { x.fillStyle = rgba(K.ink, (.05 + R() * .08).toFixed(3)); x.fillRect(R() * T, R() * T, us * (1 + R() * 1.6), us * (1 + R() * 1.6)); }
    function hatch(dir, a, lw, gap) {
      x.lineWidth = lw * us; x.lineCap = 'round';
      for (var c0 = -T; c0 <= T; c0 += gap) {
        var ph = ((c0 % T) + T) % T, wob = (.5 + .5 * Math.sin(ph * 12.9898)) * 6.283;
        x.strokeStyle = rgba(K.ink, (a * (.72 + .5 * ((Math.sin(ph * 4.1) + 1) / 2))).toFixed(3));
        x.beginPath();
        for (k = 0; k <= 24; k++) {
          var t = k / 24, yy = t * T, xx = c0 + (dir > 0 ? t * T : -t * T + T);
          xx += Math.sin(t * 6.283 * 3 + wob) * .55 * us;
          if (k) x.lineTo(xx, yy); else x.moveTo(xx, yy);
        }
        x.stroke();
      }
    }
    if (K.dots) {
      for (i = 0; i < T * T / (210 * us * us); i++) {
        var px = R() * T, py = R() * T, rr = (1.5 + R() * 1.8) * us;
        x.fillStyle = rgba(K.ink, .45); x.beginPath(); x.arc(px, py, rr, Math.PI, 0); x.fill();       /* petites cimes de feuillage */
        x.fillStyle = rgba(K.ink, .3); x.fillRect(px - .4 * us, py, .8 * us, rr * .9);
      }
      hatch(1, K.h, .9, p * 1.6);
    } else if (K.cross) { hatch(1, K.h, .95, p * 1.3); hatch(-1, K.h * .7, .9, p * 2); }
    else hatch(1, K.h * (strong ? 1.3 : 1), .95, p * 1.2);
    var pat = cv.getContext('2d').createPattern(cv, 'repeat'); tiles[key] = pat; return pat;
  }

  /* ───────── rendu ───────── */
  var pool = [];
  function getLayer(i, W, H) {
    var c = pool[i]; if (!c) c = pool[i] = document.createElement('canvas');
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
    return c;
  }

  /* c : contexte de dessin (en pixels CSS déjà mis à l'échelle par setTransform, ou export) ; W,H : taille du canvas en pixels de c
     tf : { X(wx), Y(wy), sc } ; zones : [{k, c,r,rot,seed | poly}] ; strokes : [{k, w, pts:[{x,y}], erase}] ; o : { u, base, clip:{x,y,w,h}, dpr } */
  function render(c, W, H, zones, strokes, tf, o) {
    o = o || {}; var u = o.u || 1, us = Math.max(.5, Math.round(u * 4) / 4), dpr = o.dpr || 1;
    var PW = Math.round(W * dpr), PH = Math.round(H * dpr);
    var layers = {}, li = 0, used = {};
    function L(k) { if (!layers[k]) { layers[k] = getLayer(li++, PW, PH); var lx = layers[k].getContext('2d'); lx.scale(dpr, dpr); lx.fillStyle = '#000'; lx.strokeStyle = '#000'; lx.lineCap = 'round'; lx.lineJoin = 'round'; } return layers[k]; }
    function toScreen(pts) { return pts.map(function (p) { return { x: tf.X(p[0] != null ? p[0] : p.x), y: tf.Y(p[1] != null ? p[1] : p.y) }; }); }
    if (o.base) {
      var lb = L(o.base).getContext('2d'); lb.fillRect(tf.X(-20), tf.Y(120), 140 * tf.sc, 140 * tf.sc); used[o.base] = true;
    }
    var outlines = [];
    (zones || []).forEach(function (z) {
      if (!KINDS[z.k]) return; var P = toScreen(shapePts(z)), lx = L(z.k).getContext('2d'); used[z.k] = true;
      closedPath(lx, P); lx.fill(); outlines.push({ k: z.k, P: P });
    });
    (strokes || []).forEach(function (s) {
      if (!s.pts || !s.pts.length) return;
      var P = toScreen(s.pts), wpx = Math.max(2, s.w * tf.sc);
      if (s.erase) { ORDER.forEach(function (k) { if (layers[k]) { var ex = layers[k].getContext('2d'); ex.save(); ex.globalCompositeOperation = 'destination-out'; ex.lineWidth = wpx; openPath(ex, P); ex.stroke(); ex.restore(); } }); return; }
      if (!KINDS[s.k]) return; var lx = L(s.k).getContext('2d'); used[s.k] = true;
      /* pinceau un peu irrégulier : deux passes décalées */
      lx.lineWidth = wpx; openPath(lx, P); lx.stroke();
      lx.lineWidth = wpx * .78; var P2 = P.map(function (p, i) { return { x: p.x + Math.sin(i * 1.7) * wpx * .08, y: p.y + Math.cos(i * 2.1) * wpx * .08 }; }); openPath(lx, P2); lx.stroke();
    });
    c.save();
    if (o.clip) { c.beginPath(); c.rect(o.clip.x, o.clip.y, o.clip.w, o.clip.h); c.clip(); }
    ORDER.forEach(function (k) {
      if (!used[k] || !layers[k]) return;
      var lc = layers[k], lx = lc.getContext('2d');
      lx.save(); lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-in';
      lx.scale(dpr, dpr); lx.fillStyle = tile(k, us, o.strong); lx.fillRect(0, 0, PW / dpr, PH / dpr); lx.restore();
      c.drawImage(lc, 0, 0, PW, PH, 0, 0, W, H);
    });
    /* contour au crayon (zones seulement), deux passes légèrement décalées */
    outlines.forEach(function (ol, idx) {
      var K = KINDS[ol.k], R = rng(idx * 131 + 7);
      for (var pass = 0; pass < 2; pass++) {
        var P = ol.P.map(function (p) { return { x: p.x + (R() - .5) * 1.6 * u, y: p.y + (R() - .5) * 1.6 * u }; });
        c.strokeStyle = rgba(K.ink, pass ? .22 : .38); c.lineWidth = (pass ? 1 : 1.5) * u; c.lineJoin = 'round'; closedPath(c, P); c.stroke();
      }
    });
    c.restore();
  }

  var Terrain = { KINDS: KINDS, ORDER: ORDER, render: render, blob: blob, tile: tile };
  if (typeof module !== 'undefined' && module.exports) module.exports = Terrain;
  else root.Terrain = Terrain;
})(typeof window !== 'undefined' ? window : globalThis);
