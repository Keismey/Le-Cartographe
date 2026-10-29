/* Le Cartographe — service worker : page en réseau d'abord (mises à jour), le reste en cache ; musiques mises en cache au fil de l'eau */
var V = '__VERSION__', CORE = 'core-' + V, MUS = 'music-v1';
/* une seule copie de la page (« index.html ») ; les grandes icônes (512 px) ne servent qu'à l'installation, le navigateur les demande lui-même */
var SHELL = ['index.html', 'manifest.webmanifest', 'icon-192.png'];
/* images et polices (img/, fonts/) : gardées pour jouer hors ligne ; reprises du cache précédent ou du cache du navigateur quand c'est possible */
var FILES = __FILES__;
/* musiques publiées, avec leur empreinte (?v=) : une musique modifiée change d'adresse, l'ancienne est retirée du cache */
var MUSIC = __MUSIC__;
var BASE = new URL('./', self.location).pathname;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) {
    /* « reload » : jamais une copie périmée du cache HTTP, la page et ses fichiers restent de la même version */
    return c.addAll(SHELL.map(function (f) { return new Request(f, { cache: 'reload' }); })).then(function () {
      return Promise.all(FILES.map(function (f) {
        return caches.match(f).then(function (hit) { return hit ? c.put(f, hit) : c.add(f); }).catch(function () {});
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  var keep = MUSIC.map(function (f) { return new URL(f, self.location).href; });
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return (k.indexOf('core-') === 0 || k.indexOf('music-') === 0) && k !== CORE && k !== MUS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () {
    return caches.open(MUS).then(function (c) {
      return c.keys().then(function (rs) { return Promise.all(rs.filter(function (r) { return keep.indexOf(r.url) < 0; }).map(function (r) { return c.delete(r); })); });
    });
  }).then(function () { return self.clients.claim(); }));
});

/* réponse partielle (Range) à partir d'un fichier complet en cache : requis par les lecteurs audio */
function rangeFrom(req, res) {
  var h = req.headers.get('range'); if (!h) return Promise.resolve(res);
  var m = /bytes=(\d*)-(\d*)/.exec(h); if (!m) return Promise.resolve(res);
  return res.arrayBuffer().then(function (buf) {
    var n = buf.byteLength, s = m[1] === '' ? Math.max(0, n - parseInt(m[2], 10)) : parseInt(m[1], 10), en = m[1] !== '' && m[2] !== '' ? Math.min(n - 1, parseInt(m[2], 10)) : n - 1;
    if (s >= n) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + n } });
    return new Response(buf.slice(s, en + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + s + '-' + en + '/' + n, 'Content-Length': String(en - s + 1), 'Accept-Ranges': 'bytes' } });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (/\/music\/[^/]+\.mp3$/.test(url.pathname)) {
    var key = url.pathname + url.search;
    e.respondWith(caches.open(MUS).then(function (c) {
      return c.match(key).then(function (hit) {
        if (hit) return rangeFrom(req, hit);
        /* pas encore en cache : un seul téléchargement du fichier entier, joué tout de suite et gardé pour la prochaine fois */
        var h = req.headers.get('range');
        if (!h || /^bytes=0-$/.test(h)) return fetch(key).then(function (r) { if (r.ok) { var cp = r.clone(); e.waitUntil(c.put(key, cp).catch(function () {})); } return r; });
        e.waitUntil(fetch(key).then(function (r) { if (r.ok) return c.put(key, r); }).catch(function () {}));
        return fetch(req);
      });
    }));
    return;
  }

  /* la page du jeu : réseau d'abord pour recevoir les mises à jour ; si le réseau traîne plus de 4 s ou manque, la copie gardée.
     La copie gardée est celle de l'installation : elle va toujours avec les images et polices de son cache. */
  if (url.pathname === BASE || url.pathname === BASE + 'index.html') {
    var net = fetch(req);
    e.respondWith(caches.match('index.html').then(function (hit) {
      if (!hit) return net;
      return Promise.race([net.then(function (r) { return r.ok ? r : hit; }, function () { return hit; }), new Promise(function (res) { setTimeout(function () { res(hit); }, 4000); })]);
    }));
    return;
  }
  /* autres pages du site (planches d'images…) : pas gardées */
  if (req.mode === 'navigate') return;

  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CORE).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
