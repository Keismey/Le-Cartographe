/* Tests des niveaux : node test/test.js */
var Core = require('../src/core.js');
var Levels = require('../src/levels.js').list;
var fails = 0;
function ok(c, msg) { if (!c) { fails++; console.log('  ✗ ' + msg); } }
function rng(seed) { var s = seed >>> 0; return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function truthCtx(L, wit) {
  var pos = {}, paths = {};
  L.places.forEach(function (p) { pos[p.id] = { x: p.truth[0], y: p.truth[1] }; });
  L.paths.forEach(function (p) { paths[p.id] = Core.toPts(p.truth); });
  return { pos: function (id) { return pos[id] || null; }, path: function (id) { return paths[id] || null; }, scale: L.scale, witness: wit };
}

Levels.forEach(function (L) {
  console.log('\n=== Niveau ' + L.id + ' · ' + L.title.fr + ' ===');
  var honest = [], seenP = {}, seenPa = {};
  function mark(st) { var n = Core.needs(st); n.places.forEach(function (x) { seenP[x] = 1; }); n.paths.forEach(function (x) { seenPa[x] = 1; }); }

  L.witnesses.forEach(function (w) {
    var ctx = truthCtx(L, w);
    w.statements.concat(w.ask ? [w.ask.st] : []).forEach(function (st, i) {
      var r = Core.evalStatement(st, ctx);
      var label = w.id + ' #' + i + ' (' + st.k + ') ' + st.text.fr;
      if (st.wrong) {
        ok(r.status === 'ko', 'devrait être FAUX : ' + label + ' → ' + r.status);
        console.log('  ' + (r.status === 'ko' ? '✓' : '✗') + ' faux attendu  ' + label + ' ' + JSON.stringify(r.detail));
      } else {
        ok(r.status === 'ok', 'devrait être VRAI : ' + label + ' → ' + r.status + ' ' + JSON.stringify(r.detail));
        console.log('  ' + (r.status === 'ok' ? '✓' : '✗') + ' vrai attendu  ' + label + ' ' + JSON.stringify(r.detail, function (k, v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : v; }));
        honest.push({ st: st, w: w }); mark(st);
      }
    });
    ok(!!w.ask, w.id + ' a une réponse au jeton Question');
  });
  L.scouts.forEach(function (st) {
    var r = Core.evalStatement(st, truthCtx(L, {}));
    ok(r.status === 'ok', 'Éclaireur faux : ' + st.text.fr);
    honest.push({ st: st, w: {} }); mark(st);
  });

  /* couverture */
  L.places.forEach(function (p) { ok(seenP[p.id], 'lieu sans indice vrai : ' + p.id); });
  L.paths.forEach(function (p) { ok(seenPa[p.id], 'tracé sans indice vrai : ' + p.id); });
  L.faulty.forEach(function (id) { ok(L.witnesses.some(function (w) { return w.id === id && w.why; }), 'fautif sans explication : ' + id); });

  /* score : vérité exacte, translation, zoom, bruit */
  var placed = {}, drawn = {};
  L.places.forEach(function (p) { placed[p.id] = { x: p.truth[0], y: p.truth[1] }; });
  L.paths.forEach(function (p) { drawn[p.id] = Core.toPts(p.truth); });
  var s0 = Core.score(L, placed, drawn);
  ok(s0.score === 100, 'score vérité = ' + s0.score);
  var pl2 = {}, dr2 = {};
  L.places.forEach(function (p) { pl2[p.id] = { x: p.truth[0] * 1.1 + 9, y: p.truth[1] * 1.1 - 12 }; });
  L.paths.forEach(function (p) { dr2[p.id] = Core.toPts(p.truth).map(function (q) { return { x: q.x * 1.1 + 9, y: q.y * 1.1 - 12 }; }); });
  var s1 = Core.score(L, pl2, dr2);
  ok(s1.score === 100, 'score décalé/zoomé = ' + s1.score);
  var R = rng(L.id * 77), tot = 0, N = 200, below = 0;
  for (var t = 0; t < N; t++) {
    var pn = {}, dn = {};
    L.places.forEach(function (p) { pn[p.id] = { x: p.truth[0] + (R() - 0.5) * 12, y: p.truth[1] + (R() - 0.5) * 12 }; });
    L.paths.forEach(function (p) { dn[p.id] = Core.simplify(Core.toPts(p.truth).map(function (q) { return { x: q.x + (R() - 0.5) * 8, y: q.y + (R() - 0.5) * 8 }; }), 0.5); });
    var sc = Core.score(L, pn, dn).score; tot += sc; if (sc < 95) below++;
  }
  console.log('  score avec bruit ±6 u (placement) / ±4 u (tracé) : moyenne ' + (tot / N).toFixed(1) + ' %, ' + below + '/' + N + ' sous 95 %');
  var sw = Core.score(L, {}, {});
  ok(sw.score === 0, 'score carte vide = ' + sw.score);

  /* les erreurs fautives doivent être « piégeuses » : placer selon la phrase fausse doit baisser le score */

  /* solveur : tracés fixés à la vérité, indices vrais uniquement */
  var R2 = rng(1234 + L.id), reached = 0, runs = 60, maxErr = 0, sumErr = 0, errs = [];
  function totalCost(pos) {
    var c = 0;
    honest.forEach(function (h) {
      var ctx = { pos: function (id) { return pos[id] || null; }, path: function (id) { return Core.toPts(L.paths.filter(function (p) { return p.id === id; })[0].truth); }, scale: L.scale, witness: h.w };
      c += Core.evalStatement(h.st, ctx).cost;
    });
    return c;
  }
  for (var run = 0; run < runs; run++) {
    var pos = {};
    L.places.forEach(function (p) { pos[p.id] = { x: R2() * 100, y: R2() * 100 }; });
    var cost = totalCost(pos);
    for (var it = 0; it < 6000 && cost > 1e-9; it++) {
      var p = L.places[Math.floor(R2() * L.places.length)], old = pos[p.id], sig = 18 * (1 - it / 6000) + 1;
      pos[p.id] = { x: old.x + (R2() - 0.5) * 2 * sig, y: old.y + (R2() - 0.5) * 2 * sig };
      var nc = totalCost(pos);
      if (nc <= cost) cost = nc; else pos[p.id] = old;
    }
    if (cost <= 1e-9) {
      reached++;
      var e = 0, mx = 0;
      L.places.forEach(function (p) { var d = Core.dist(pos[p.id], { x: p.truth[0], y: p.truth[1] }); e += d; mx = Math.max(mx, d); });
      errs.push(mx); sumErr += e / L.places.length;
    }
  }
  errs.sort(function (a, b) { return a - b; });
  console.log('  solveur : ' + reached + '/' + runs + ' solutions complètes trouvées ; écart moyen à la vérité ' + (reached ? (sumErr / reached).toFixed(1) : '–') + ' u ; pire lieu (médiane des pires) ' + (errs.length ? errs[Math.floor(errs.length / 2)].toFixed(1) : '–') + ' u, max ' + (errs.length ? errs[errs.length - 1].toFixed(1) : '–') + ' u');
  ok(reached > 0, 'le solveur ne trouve aucune carte satisfaisant tous les indices vrais');

  /* qualité d'une résolution « raisonnable » : (a) cartes faisables au hasard, (b) carte « centrée »
     (moindres écarts aux indices, comme le ferait un joueur qui moyenne les témoignages) */
  function solveScore(strict, seed) {
    var Rr = rng(seed), best = null;
    for (var rs = 0; rs < 8; rs++) {
      var pos = {};
      L.places.forEach(function (p) { pos[p.id] = { x: Rr() * 100, y: Rr() * 100 }; });
      function cst(ps) {
        var c = 0;
        honest.forEach(function (h) {
          var st = h.st;
          if (strict) { st = JSON.parse(JSON.stringify(st)); st.angTol = 1; st.tolRel = 0.01; st.r = st.r; }
          var ctx = { pos: function (id) { return ps[id] || null; }, path: function (id) { return Core.toPts(L.paths.filter(function (p) { return p.id === id; })[0].truth); }, scale: L.scale, witness: h.w, angTol: strict ? 1 : 35 };
          c += Core.evalStatement(st, ctx).cost;
        });
        return c;
      }
      var cc = cst(pos);
      for (var i2 = 0; i2 < 8000; i2++) {
        var p = L.places[Math.floor(Rr() * L.places.length)], old = pos[p.id], sg = 18 * (1 - i2 / 8000) + 0.5;
        pos[p.id] = { x: old.x + (Rr() - 0.5) * 2 * sg, y: old.y + (Rr() - 0.5) * 2 * sg };
        var n2 = cst(pos); if (n2 <= cc) cc = n2; else pos[p.id] = old;
      }
      if (!best || cc < best.c) best = { c: cc, pos: JSON.parse(JSON.stringify(pos)) };
    }
    var drawnT = {}; L.paths.forEach(function (p) { drawnT[p.id] = Core.toPts(p.truth); });
    return Core.score(L, best.pos, drawnT).score;
  }
  var feas = [], i3;
  for (i3 = 0; i3 < 12; i3++) feas.push(solveScore(false, 900 + i3));
  feas.sort(function (a, b) { return a - b; });
  var cent = [];
  for (i3 = 0; i3 < 6; i3++) cent.push(solveScore(true, 500 + i3));
  cent.sort(function (a, b) { return a - b; });
  console.log('  score d\'une carte faisable au hasard : min ' + feas[0] + ' · médiane ' + feas[6] + ' · max ' + feas[11] + ' %  (tracés supposés bons)');
  ok(feas[6] >= 90, 'cartes faisables : médiane trop basse (' + feas[6] + ' < 90) — niveau sous-déterminé');
  ok(feas[1] >= 80, 'cartes faisables : 10e centile trop bas (' + feas[1] + ' < 80) — niveau sous-déterminé');
  console.log('  score d\'une carte « centrée » (moyenne des témoignages) : min ' + cent[0] + ' · médiane ' + cent[3] + ' · max ' + cent[5] + ' %');
});

console.log(fails ? '\n✗ ' + fails + ' échec(s)' : '\n✓ tous les tests passent');
process.exit(fails ? 1 : 0);
