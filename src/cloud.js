/* Le Cartographe — sauvegarde en ligne (facultative) : seulement quand le jeu tourne comme Artifact claude.ai (capacités db + user).
   Hors de ce cadre (GitHub Pages, fichier local), window.claude n'existe pas : tout reste dans le localStorage de l'appareil.
   La sauvegarde est découpée en petits documents privés (data/users/<id>/…), chacun daté : le plus récent gagne, document par document. */
(function (root) {
  'use strict';
  var st = { db: null, uid: null, last: {}, ready: false, timer: null, pending: null, err: null, started: false };

  function docsOf(save) {
    var out = {}, core = {}, k;
    for (k in save) if (k !== 'progress' && k !== 'inprogress' && k !== 'free') core[k] = save[k];
    core.freeSeq = save.free && save.free.seq || 0; core.freeDel = save.free && save.free.del || [];
    out.core = { j: JSON.stringify(core), t: save.t || 0 };
    Object.keys(save.progress || {}).forEach(function (id) { out['p_' + id] = { j: JSON.stringify(save.progress[id]), t: save.progress[id].t || 0 }; });
    Object.keys(save.inprogress || {}).forEach(function (id) { out['i_' + id] = { j: JSON.stringify(save.inprogress[id]), t: save.inprogress[id].t || 0 }; });
    ((save.free && save.free.maps) || []).forEach(function (m) { out['f_' + m.id] = { j: JSON.stringify(m), t: m.t || 0 }; });
    return out;
  }

  /* Démarre : lit les documents distants, les confie à onRemote(remoteSave), puis pousse l'état local. */
  function start(getSave, onRemote) {
    if (st.started) return; st.started = true;
    var C = root.claude; if (!C || !C.use) return;
    Promise.all([C.use('db'), C.use('user')]).then(function (r) {
      var db = r[0], user = r[1]; if (!db || !user) return null;
      st.db = db;
      return user.id().then(function (id) { if (!id) { st.db = null; return null; } st.uid = id; return db.collection('data/users/' + id).get(); });
    }).then(function (snap) {
      if (!snap || !st.db) return;
      var remote = { progress: {}, inprogress: {}, free: { maps: [], seq: 0, del: [] }, core: null };
      snap.docs.forEach(function (d) {
        var v = d.data(); if (!v || typeof v.j !== 'string') return;
        var o; try { o = JSON.parse(v.j); } catch (e) { return; }
        var id = d.id; st.last[id] = v.j;
        if (id === 'core') { remote.core = o; remote.core.t = v.t || o.t || 0; remote.free.seq = o.freeSeq || 0; remote.free.del = o.freeDel || []; }
        else if (id.indexOf('p_') === 0) remote.progress[id.slice(2)] = o;
        else if (id.indexOf('i_') === 0) remote.inprogress[id.slice(2)] = o;
        else if (id.indexOf('f_') === 0) remote.free.maps.push(o);
      });
      st.ready = true;
      try { onRemote(remote); } catch (e) {}
      push(getSave());
    }).catch(function (e) { st.err = e; });
  }

  /* Pousse (avec un petit délai) les documents qui ont changé */
  function push(save) {
    if (!st.db || !st.ready) return;
    st.pending = save; clearTimeout(st.timer);
    st.timer = setTimeout(flush, 1500);
  }
  function flush() {
    var save = st.pending; if (!save || !st.db) return; st.pending = null;
    var docs = docsOf(save), ids = Object.keys(docs), chain = Promise.resolve();
    ids.forEach(function (id) {
      if (st.last[id] === docs[id].j) return;
      chain = chain.then(function () {
        if (docs[id].j.length > 240000) return;           /* au-delà de ~256 Kio le document serait refusé */
        return st.db.doc('data/users/' + st.uid + '/' + id).set({ j: docs[id].j, t: docs[id].t }).then(function () { st.last[id] = docs[id].j; });
      }).catch(function (e) { st.err = e; });
    });
    /* cartes libres supprimées */
    Object.keys(st.last).forEach(function (id) {
      if (id.indexOf('f_') === 0 && !docs[id]) chain = chain.then(function () { return st.db.doc('data/users/' + st.uid + '/' + id).delete().then(function () { delete st.last[id]; }); }).catch(function () {});
    });
  }
  function active() { return !!(st.db && st.ready); }
  /* Remise à zéro : efface aussi les documents en ligne, sinon ils reviendraient au prochain lancement */
  function wipe() {
    if (!st.db || !st.ready) return Promise.resolve();
    clearTimeout(st.timer); st.pending = null;
    var ids = Object.keys(st.last), chain = Promise.resolve();
    ids.forEach(function (id) { chain = chain.then(function () { return st.db.doc('data/users/' + st.uid + '/' + id).delete(); }).then(function () { delete st.last[id]; }, function () {}); });
    return chain;
  }

  var Cloud = { start: start, push: push, active: active, docsOf: docsOf, wipe: wipe };
  if (typeof module !== 'undefined' && module.exports) module.exports = Cloud;
  else root.Cloud = Cloud;
})(typeof window !== 'undefined' ? window : globalThis);
