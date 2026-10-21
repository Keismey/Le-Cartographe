/* Le Cartographe — service worker : page en réseau d'abord (mises à jour), le reste en cache ; musiques mises en cache au fil de l'eau */
var V = 'f84714078d', CORE = 'core-' + V, MUS = 'music-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CORE && k !== MUS; }).map(function (k) { return caches.delete(k); }));
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
    e.respondWith(caches.open(MUS).then(function (c) {
      return c.match(url.pathname).then(function (hit) {
        if (hit) return rangeFrom(req, hit);
        /* pas encore en cache : on laisse passer la requête, et on garde le fichier entier pour la prochaine fois */
        e.waitUntil(fetch(url.pathname).then(function (r) { if (r.ok) return c.put(url.pathname, r); }).catch(function () {}));
        return fetch(req);
      });
    }));
    return;
  }

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone(); caches.open(CORE).then(function (c) { c.put('index.html', copy); }); return r;
    }).catch(function () { return caches.match('index.html').then(function (r) { return r || caches.match('./'); }); }));
    return;
  }

  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CORE).then(function (c) { c.put(req, cp); }); } return r; });
  }));
});
