/* Le Cartographe — dessin : tampons vectoriels, parchemin, rose des vents, tracés lissés. */
(function (root) {
  'use strict';
  var INK = '#3a2c1c';

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function poly(ctx, pts, close) {
    ctx.beginPath();
    pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    if (close) ctx.closePath();
  }

  /* Chaque glyphe se dessine dans [-1,1]² ; ctx est déjà translaté/mis à l'échelle. */
  var G = {
    moulin: function (c) {
      poly(c, [[-.42, .85], [-.28, -.15], [.28, -.15], [.42, .85]], true); c.fill(); c.stroke();
      poly(c, [[-.34, -.15], [0, -.5], [.34, -.15]], true); c.stroke();
      var a, hx = 0, hy = -.42;
      for (a = 0; a < 4; a++) {
        var ang = Math.PI / 4 + a * Math.PI / 2, ex = hx + Math.cos(ang) * .86, ey = hy + Math.sin(ang) * .86;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke();
        var px = -Math.sin(ang) * .2, py = Math.cos(ang) * .2, mx = hx + Math.cos(ang) * .45, my = hy + Math.sin(ang) * .45;
        poly(c, [[mx, my], [ex, ey], [ex + px, ey + py], [mx + px, my + py]], true); c.stroke();
      }
    },
    pont: function (c) {
      c.beginPath(); c.moveTo(-.95, .05); c.lineTo(.95, .05); c.stroke();
      c.beginPath(); c.moveTo(-.95, -.22); c.lineTo(.95, -.22); c.stroke();
      [-.7, -.35, 0, .35, .7].forEach(function (x) { c.beginPath(); c.moveTo(x, -.22); c.lineTo(x, .05); c.stroke(); });
      c.beginPath(); c.arc(0, .05, .62, 0, Math.PI); c.stroke();
      c.beginPath(); c.moveTo(-.95, .05); c.lineTo(-.95, .3); c.moveTo(.95, .05); c.lineTo(.95, .3); c.stroke();
    },
    pont_casse: function (c) {
      c.beginPath(); c.moveTo(-.95, .05); c.lineTo(-.22, .05); c.moveTo(-.95, -.22); c.lineTo(-.22, -.22); c.stroke();
      c.beginPath(); c.moveTo(.22, .38); c.lineTo(.95, .38); c.moveTo(.22, .12); c.lineTo(.95, .12); c.stroke();
      c.beginPath(); c.arc(-.6, .05, .38, 0, Math.PI * .85); c.stroke();
      c.beginPath(); c.arc(.6, .38, .38, Math.PI * .15, Math.PI); c.stroke();
      poly(c, [[-.1, -.1], [.02, .12], [-.08, .2], [.06, .55]], false); c.stroke();
    },
    auberge: function (c) {
      c.beginPath(); c.rect(-.6, -.12, 1.2, .86); c.fill(); c.stroke();
      poly(c, [[-.78, -.12], [0, -.85], [.78, -.12]], true); c.fill(); c.stroke();
      c.beginPath(); c.rect(-.14, .2, .28, .54); c.stroke();
      c.beginPath(); c.rect(.34, -.62, .16, .34); c.stroke();
      c.beginPath(); c.moveTo(.8, -.05); c.lineTo(.8, .4); c.stroke();
      c.beginPath(); c.rect(.66, .1, .3, .26); c.stroke();
    },
    village: function (c) {
      poly(c, [[-.85, .7], [-.85, 0], [-.45, -.4], [-.05, 0], [-.05, .7]], true); c.fill(); c.stroke();
      poly(c, [[.05, .7], [.05, .15], [.4, -.2], [.75, .15], [.75, .7]], true); c.fill(); c.stroke();
      c.beginPath(); c.rect(-.55, .25, .2, .45); c.stroke();
      c.beginPath(); c.rect(.28, .35, .2, .35); c.stroke();
    },
    ferme: function (c) {
      poly(c, [[-.75, .75], [-.75, -.1], [0, -.8], [.75, -.1], [.75, .75]], true); c.fill(); c.stroke();
      c.beginPath(); c.rect(-.32, .1, .64, .65); c.stroke();
      c.beginPath(); c.moveTo(-.32, .1); c.lineTo(.32, .75); c.moveTo(.32, .1); c.lineTo(-.32, .75); c.stroke();
    },
    chapelle: function (c) {
      c.beginPath(); c.rect(-.62, .05, 1.24, .72); c.fill(); c.stroke();
      c.beginPath(); c.rect(-.2, -.45, .4, .5); c.fill(); c.stroke();
      poly(c, [[-.28, -.45], [0, -.78], [.28, -.45]], true); c.stroke();
      c.beginPath(); c.moveTo(0, -.78); c.lineTo(0, -1.02); c.moveTo(-.1, -.92); c.lineTo(.1, -.92); c.stroke();
      c.beginPath(); c.arc(0, .5, .16, Math.PI, 0); c.lineTo(.16, .77); c.lineTo(-.16, .77); c.closePath(); c.stroke();
    },
    tannerie: function (c) {
      poly(c, [[-.8, .7], [-.8, .05], [-.4, -.4], [0, .05], [0, .7]], true); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(.3, -.45); c.lineTo(.3, .75); c.moveTo(.95, -.45); c.lineTo(.95, .75); c.moveTo(.3, -.45); c.lineTo(.95, -.45); c.stroke();
      poly(c, [[.4, -.38], [.85, -.38], [.8, .1], [.9, .3], [.7, .5], [.6, .35], [.45, .5], [.35, .2]], true); c.fill(); c.stroke();
    },
    gue: function (c) {
      [-.5, -.05, .4].forEach(function (y) {
        c.beginPath(); c.moveTo(-.95, y);
        c.bezierCurveTo(-.6, y - .22, -.4, y + .22, -.05, y); c.bezierCurveTo(.3, y - .22, .55, y + .22, .95, y); c.stroke();
      });
      [[-.5, .15], [0, .2], [.5, .15]].forEach(function (p) {
        c.beginPath(); c.ellipse(p[0], p[1], .2, .13, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      });
    },
    _default: function (c) {
      c.beginPath(); c.arc(0, 0, .6, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, 0, .14, 0, Math.PI * 2); c.fill();
    }
  };

  function glyph(ctx, type, cx, cy, r, fill) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(r, r);
    ctx.lineWidth = 0.11; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.fillStyle = fill || '#cdb98c';
    (G[type] || G._default)(ctx);
    ctx.restore();
  }

  /* Parchemin : texture générée une fois (taille fixe), puis étirée. */
  var parch = null;
  function parchment() {
    if (parch) return parch;
    var N = 768, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d'), R = rng(7);
    var g = x.createRadialGradient(N * .5, N * .46, N * .12, N * .5, N * .5, N * .78);
    g.addColorStop(0, '#efe5c8'); g.addColorStop(.7, '#e2d3a8'); g.addColorStop(1, '#c8b077');
    x.fillStyle = g; x.fillRect(0, 0, N, N);
    var i;
    for (i = 0; i < 26; i++) {
      var px = R() * N, py = R() * N, pr = 40 + R() * 110, gg = x.createRadialGradient(px, py, 0, px, py, pr);
      var dark = R() < .6;
      gg.addColorStop(0, dark ? 'rgba(120,88,40,.10)' : 'rgba(255,248,225,.16)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gg; x.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    for (i = 0; i < 3800; i++) {
      x.fillStyle = 'rgba(' + (90 + R() * 40 | 0) + ',' + (62 + R() * 30 | 0) + ',30,' + (R() * .07).toFixed(3) + ')';
      x.fillRect(R() * N, R() * N, 1 + R() * 2, 1 + R() * 2);
    }
    x.lineWidth = 1;
    for (i = 0; i < 90; i++) {
      x.strokeStyle = 'rgba(110,80,40,' + (R() * .06).toFixed(3) + ')';
      var sx = R() * N, sy = R() * N; x.beginPath(); x.moveTo(sx, sy);
      x.quadraticCurveTo(sx + (R() - .5) * 90, sy + (R() - .5) * 90, sx + (R() - .5) * 140, sy + (R() - .5) * 140); x.stroke();
    }
    parch = c;
    return c;
  }

  function rose(ctx, cx, cy, r, ink) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.strokeStyle = ink || INK; ctx.fillStyle = ink || INK; ctx.lineWidth = Math.max(1, r * .05);
    ctx.beginPath(); ctx.arc(0, 0, r * .62, 0, Math.PI * 2); ctx.stroke();
    var k, a;
    for (k = 0; k < 8; k++) {
      a = k * Math.PI / 4 - Math.PI / 2; var long_ = k % 2 === 0, L = long_ ? r : r * .62, W = long_ ? r * .16 : r * .1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * L, Math.sin(a) * L);
      ctx.lineTo(Math.cos(a + Math.PI / 2) * W, Math.sin(a + Math.PI / 2) * W);
      ctx.lineTo(0, 0); ctx.lineTo(Math.cos(a - Math.PI / 2) * W, Math.sin(a - Math.PI / 2) * W);
      ctx.closePath(); if (k === 0) ctx.fill(); else ctx.stroke();
    }
    ctx.font = 'bold ' + Math.round(r * .5) + 'px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -r * 1.28);
    ctx.restore();
  }

  /* Catmull-Rom → courbes de Bézier, points déjà en pixels */
  function smooth(ctx, pts) {
    if (!pts.length) return;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) { ctx.lineTo(pts[1].x, pts[1].y); return; }
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
    }
  }

  var Art = { INK: INK, glyph: glyph, parchment: parchment, rose: rose, smooth: smooth, rng: rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = Art;
  else root.Art = Art;
})(typeof window !== 'undefined' ? window : globalThis);
