/* Le Cartographe — moteur pur (indices, évaluation, recalage, score).
   Aucune dépendance au DOM : testable sous Node. Monde 0–100, x → est, y → nord. */
(function (root) {
  'use strict';
  var DEG = 180 / Math.PI;
  var CAPS = { N: 90, NE: 45, E: 0, SE: -45, S: -90, SW: -135, W: 180, NW: 135 };

  function norm180(a) { return ((a + 180) % 360 + 360) % 360 - 180; }
  function angDiff(a, b) { return Math.abs(norm180(a - b)); }
  function dist(p, q) { return Math.hypot(p.x - q.x, p.y - q.y); }
  function bearing(from, to) { return Math.atan2(to.y - from.y, to.x - from.x) * DEG; }

  /* Un tracé peut être donné en [[x,y],…] ou [{x,y},…] */
  function toPts(arr) {
    if (!arr) return null;
    return arr.map(function (p) { return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y }; });
  }

  function segClosest(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    var t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    var x = a.x + t * dx, y = a.y + t * dy;
    return { x: x, y: y, t: t, d: Math.hypot(p.x - x, p.y - y) };
  }
  function polyClosest(p, poly) {
    var best = null;
    for (var i = 0; i < poly.length - 1; i++) {
      var c = segClosest(p, poly[i], poly[i + 1]);
      if (!best || c.d < best.d) { best = c; best.i = i; }
    }
    if (!best && poly.length === 1) best = { x: poly[0].x, y: poly[0].y, d: dist(p, poly[0]), i: 0, t: 0 };
    return best;
  }
  /* côté d'un point par rapport à la polyligne : +1 gauche du sens de tracé, −1 droite */
  function sideSign(p, poly) {
    var c = polyClosest(p, poly);
    var a = poly[c.i], b = poly[Math.min(c.i + 1, poly.length - 1)];
    var cr = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    return cr >= 0 ? 1 : -1;
  }

  function resample(poly, step) {
    var out = [], acc = 0;
    if (!poly || !poly.length) return out;
    out.push({ x: poly[0].x, y: poly[0].y });
    for (var i = 0; i < poly.length - 1; i++) {
      var a = poly[i], b = poly[i + 1], L = dist(a, b);
      if (L === 0) continue;
      var pos = step - acc;
      while (pos <= L) {
        out.push({ x: a.x + (b.x - a.x) * pos / L, y: a.y + (b.y - a.y) * pos / L });
        pos += step;
      }
      acc = L - (pos - step);
    }
    out.push({ x: poly[poly.length - 1].x, y: poly[poly.length - 1].y });
    return out;
  }
  function meanDistToPoly(pts, poly) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) s += polyClosest(pts[i], poly).d;
    return s / pts.length;
  }
  /* distance de Chamfer symétrique entre deux polylignes */
  function chamfer(A, B) {
    if (!A || A.length < 2 || !B || B.length < 2) return Infinity;
    var a = resample(A, 2), b = resample(B, 2);
    return 0.5 * (meanDistToPoly(a, B) + meanDistToPoly(b, A));
  }

  /* Douglas-Peucker */
  function simplify(pts, tol) {
    if (pts.length < 3) return pts.slice();
    var keep = new Array(pts.length); keep[0] = keep[pts.length - 1] = true;
    (function rec(i0, i1) {
      var a = pts[i0], b = pts[i1], dmax = 0, idx = -1;
      for (var i = i0 + 1; i < i1; i++) {
        var d = segClosest(pts[i], a, b).d;
        if (d > dmax) { dmax = d; idx = i; }
      }
      if (dmax > tol && idx > 0) { keep[idx] = true; rec(i0, idx); rec(idx, i1); }
    })(0, pts.length - 1);
    return pts.filter(function (_, i) { return keep[i]; });
  }

  /* ---------- Évaluation des indices ---------- */
  function idsOf(v) { return Array.isArray(v) ? v : [v]; }

  /* Identifiants (lieux / tracés) nécessaires pour évaluer un indice */
  function needs(st) {
    var pl = [], pa = [];
    function addP(v) { if (v != null) idsOf(v).forEach(function (x) { pl.push(x); }); }
    switch (st.k) {
      case 'rel': addP(st.a); addP(st.b); break;
      case 'between': addP(st.a); addP(st.b); addP(st.c); break;
      case 'cross': addP(st.a); pa.push(st.path); break;
      case 'side': addP(st.a); pa.push(st.path); break;
      case 'opp': addP(st.a); addP(st.b); pa.push(st.path); break;
      case 'order': (st.list || []).forEach(function (x) { pl.push(x); }); break;
    }
    return { places: pl, paths: pa };
  }

  /* ctx : { pos(id)->{x,y}|null, path(id)->pts|null, scale, nearR, angTol, witness }
     retour : { status:'ok'|'ko'|'na', cost:number, detail:{…} } */
  function evalStatement(st, ctx) {
    var nd = needs(st), i;
    for (i = 0; i < nd.places.length; i++) if (!ctx.pos(nd.places[i])) return { status: 'na', cost: 0 };
    for (i = 0; i < nd.paths.length; i++) { var pp = ctx.path(nd.paths[i]); if (!pp || pp.length < 2) return { status: 'na', cost: 0 }; }
    var cost = 0, detail = {};
    var scale = ctx.scale || 20;
    var wit = ctx.witness || {};
    var bias = st.exact ? 1 : ((wit.bias && wit.bias.dist) || 1);
    var angTol = st.angTol || ctx.angTol || 35;

    function viol(v) { if (v > 0) cost += v; }

    if (st.k === 'rel') {
      var A = ctx.pos(st.a), B = ctx.pos(st.b);
      if (st.cap) {
        var br = bearing(B, A), ad = angDiff(br, CAPS[st.cap]);
        detail.bearing = br; detail.angDiff = ad;
        viol((ad - angTol) / angTol);
      }
      if (st.j != null) {
        var d = dist(A, B) / scale, claimed = st.j / bias;
        var tol = st.tolRel || (st.approx ? 0.3 : 0.25);
        detail.days = d; detail.claimed = claimed;
        if (st.jmin) viol((claimed * 0.9 - d) / claimed);
        else viol((Math.abs(d - claimed) - tol * claimed) / claimed);
      }
      if (st.near) {
        var r = st.r || ctx.nearR || 18, dd = dist(A, B);
        detail.d = dd; viol((dd - r) / r);
      }
    } else if (st.k === 'between') {
      var a = ctx.pos(st.a), b = ctx.pos(st.b), c = ctx.pos(st.c);
      var cl = segClosest(a, b, c);
      viol((cl.d - 8) / 8);
      if (cl.t < 0.05 || cl.t > 0.95) viol(0.5);
    } else if (st.k === 'cross') {
      var poly = ctx.path(st.path), rr = st.r || 6;
      idsOf(st.a).forEach(function (id) { var dd2 = polyClosest(ctx.pos(id), poly).d; viol((dd2 - rr) / rr); });
    } else if (st.k === 'side') {
      var poly2 = ctx.path(st.path), P = ctx.pos(st.a), q = polyClosest(P, poly2);
      if (q.d >= 3) { var adj = angDiff(bearing(q, P), CAPS[st.cap]); viol((adj - 60) / 60); }
    } else if (st.k === 'opp') {
      var poly3 = ctx.path(st.path);
      if (sideSign(ctx.pos(st.a), poly3) === sideSign(ctx.pos(st.b), poly3)) cost += 1;
    } else if (st.k === 'order') {
      var ang = CAPS[st.axis] / DEG, ux = Math.cos(ang), uy = Math.sin(ang), prev = -Infinity;
      st.list.forEach(function (id) { var p = ctx.pos(id), pr = p.x * ux + p.y * uy; if (pr < prev) cost += 1; prev = pr; });
    }
    return { status: cost <= 1e-9 ? 'ok' : 'ko', cost: cost, detail: detail };
  }

  /* ---------- Recalage + score ---------- */
  /* Translation + échelle (bornée) minimisant l'erreur quadratique player→vérité */
  function align(pairs, smin, smax) {
    smin = smin || 0.8; smax = smax || 1.2;
    if (!pairs.length) return { s: 1, tx: 0, ty: 0 };
    var n = pairs.length, pcx = 0, pcy = 0, qcx = 0, qcy = 0, i;
    for (i = 0; i < n; i++) { pcx += pairs[i][0].x; pcy += pairs[i][0].y; qcx += pairs[i][1].x; qcy += pairs[i][1].y; }
    pcx /= n; pcy /= n; qcx /= n; qcy /= n;
    var num = 0, den = 0;
    for (i = 0; i < n; i++) {
      var px = pairs[i][0].x - pcx, py = pairs[i][0].y - pcy, qx = pairs[i][1].x - qcx, qy = pairs[i][1].y - qcy;
      num += px * qx + py * qy; den += px * px + py * py;
    }
    var s = den > 1e-9 ? num / den : 1;
    s = Math.max(smin, Math.min(smax, s));
    return { s: s, tx: qcx - s * pcx, ty: qcy - s * pcy };
  }
  function applyAlign(al, p) { return { x: al.s * p.x + al.tx, y: al.s * p.y + al.ty }; }

  /* level : { places:[{id,truth:[x,y]}], paths:[{id,truth:[[x,y]…]}], tol:{ok,near} }
     placed : { id:{x,y} } ; drawn : { id:[{x,y}…] } */
  /* Crédit continu : 1 dans la tolérance, 0,6 à la limite « presque », puis décroît jusqu'à 0 — une erreur de peu coûte peu. */
  function creditFor(err, tol) {
    if (err <= tol.ok) return 1;
    if (err <= tol.near) return 1 - 0.4 * (err - tol.ok) / (tol.near - tol.ok);
    var far = tol.near * 1.8;
    return err >= far ? 0 : 0.6 * (1 - (err - tol.near) / (far - tol.near));
  }
  function score(level, placed, drawn) {
    var tol = level.tol || { ok: 12, near: 20 };
    var ptol = level.ptol || { ok: 8, near: 14 };
    var pairs = [];
    level.places.forEach(function (pl) { if (placed[pl.id]) pairs.push([placed[pl.id], { x: pl.truth[0], y: pl.truth[1] }]); });
    var al = align(pairs, 0.8, 1.2);
    var items = [], ok = 0, near = 0, credit = 0;
    level.places.forEach(function (pl) {
      var it = { id: pl.id, kind: 'place', err: null, verdict: 'ko' };
      if (placed[pl.id]) {
        var q = applyAlign(al, placed[pl.id]);
        it.err = dist(q, { x: pl.truth[0], y: pl.truth[1] });
        it.at = q;
        if (it.err < tol.ok) { it.verdict = 'ok'; ok++; } else if (it.err < tol.near) { it.verdict = 'near'; near++; }
        it.credit = creditFor(it.err, tol); credit += it.credit;
      } else it.credit = 0;
      items.push(it);
    });
    (level.paths || []).forEach(function (pa) {
      var it = { id: pa.id, kind: 'path', err: null, verdict: 'ko' };
      var pts = drawn[pa.id];
      if (pts && pts.length >= 2) {
        var moved = pts.map(function (p) { return applyAlign(al, p); });
        it.err = chamfer(moved, toPts(pa.truth));
        it.at = moved;
        if (it.err < ptol.ok) { it.verdict = 'ok'; ok++; } else if (it.err < ptol.near) { it.verdict = 'near'; near++; }
        it.credit = creditFor(it.err, ptol); credit += it.credit;
      } else it.credit = 0;
      items.push(it);
    });
    var total = items.length;
    var pct = total ? Math.round(100 * credit / total * 10) / 10 : 0;
    return { score: pct, ok: ok, near: near, total: total, items: items, align: al };
  }

  /* étoiles : 1 ≥ 50, 2 ≥ 72, 3 ≥ 88 ET menteurs/fautifs soupçonnés */
  function stars(pct, level, suspects) {
    var s = 0;
    if (pct >= 50) s = 1;
    if (pct >= 72) s = 2;
    if (pct >= 88) {
      var need = (level.faulty || []);
      var allSus = need.every(function (id) { return suspects && suspects[id]; });
      s = allSus ? 3 : 2;
    }
    return s;
  }

  var Core = {
    CAPS: CAPS, angDiff: angDiff, dist: dist, bearing: bearing, toPts: toPts,
    polyClosest: polyClosest, sideSign: sideSign, resample: resample, chamfer: chamfer,
    simplify: simplify, needs: needs, evalStatement: evalStatement,
    align: align, applyAlign: applyAlign, score: score, stars: stars
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
