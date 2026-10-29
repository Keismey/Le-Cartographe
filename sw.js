/* Le Cartographe — service worker : page en réseau d'abord (mises à jour), le reste en cache ; musiques mises en cache au fil de l'eau */
var V = '54af161bd6', CORE = 'core-' + V, MUS = 'music-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];
/* images et polices (img/, fonts/) : gardées pour jouer hors ligne ; reprises du cache précédent ou du cache du navigateur quand c'est possible */
var FILES = ["img/stamps-village.webp?v=d72173f3","img/stamps-ferme.webp?v=67c4fbbf","img/stamps-auberge.webp?v=9cdfc677","img/stamps-chapelle.webp?v=279d202e","img/stamps-abbaye.webp?v=3316a5f8","img/stamps-tannerie.webp?v=090dec3d","img/stamps-moulin.webp?v=0bcf7097","img/stamps-pont.webp?v=a146084f","img/stamps-pont_casse.webp?v=df5f014f","img/stamps-gue.webp?v=ce4ddf06","img/stamps-source.webp?v=cec080ac","img/stamps-lac.webp?v=575ed7e5","img/stamps-montagne.webp?v=dc4f6a8f","img/stamps-colline.webp?v=83cd312c","img/stamps-col.webp?v=f1420396","img/stamps-falaise.webp?v=0a6ea548","img/stamps-marais.webp?v=15d55ce3","img/stamps-rochers.webp?v=5e0680a0","img/stamps-tour.webp?v=81db3dae","img/stamps-fort.webp?v=3e99aa71","img/stamps-ville_fortifiee.webp?v=ae8e9a13","img/stamps-chateau.webp?v=56f092ef","img/stamps-mine.webp?v=0bc065b9","img/stamps-ruines.webp?v=f0b954e4","img/stamps-phare.webp?v=9e40f4a2","img/stamps-port.webp?v=60985d7b","img/stamps-crique.webp?v=9ccf8cfe","img/stamps-epave.webp?v=56b5de3f","img/stamps-ile.webp?v=99a66e53","img/stamps-plage_noire.webp?v=f05dd13e","img/stamps-carriere.webp?v=e0b04ed3","img/stamps-val_perdu.webp?v=dd142bdd","img/stamps-croisee.webp?v=b32c0202","img/stamps-fin_route.webp?v=fc741802","img/stamps-prairie.webp?v=4c1936e5","img/stamps-pierres.webp?v=1f4d9810","img/stamps-bois_clair.webp?v=af1823ca","img/stamps-foret_sombre.webp?v=d69bf5b9","img/stamps-chene.webp?v=977420fa","img/stamps-cabane_bucheron.webp?v=93938e15","img/stamps-cabane_sorciere.webp?v=c90b2caf","img/stamps-mare.webp?v=0cf5b2f1","img/ui-carnet.webp?v=107a746c","img/ui-boussole.webp?v=5f44eb62","img/ui-plume.webp?v=d5a32858","img/ui-regle.webp?v=f7a3f18b","img/ui-loupe.webp?v=dcd61b17","img/ui-sceau.webp?v=54b42f8e","img/ui-jeton_question.webp?v=cb53fa48","img/ui-jeton_eclaireur.webp?v=867703fe","img/ui-etoile.webp?v=a82b359f","img/ui-etoile_vide.webp?v=90ef307e","img/ui-eponge.webp?v=ca82c9ee","img/ui-fanion.webp?v=86b9d673","img/ui-sceau_rubans.webp?v=58e15619","img/ui-enveloppe.webp?v=3887c085","img/ui-sceau_brise.webp?v=a3ba6d17","img/ui-verdict_ok.webp?v=cc239cee","img/ui-verdict_presque.webp?v=729d0521","img/ui-verdict_rate.webp?v=5cd889a3","img/ui-coin.webp?v=ddafd159","img/ui-separateur.webp?v=69c3e2fb","img/ui-bandeau.webp?v=4056017c","img/ui-punaise.webp?v=f2a3a237","img/ui-cadre_rond.webp?v=3386daa7","img/ui-etiquette.webp?v=9648f075","img/ui-rose.webp?v=a1d681f5","img/ui-main.webp?v=3f8cf002","img/ui-annuler.webp?v=9646b913","img/ui-corbeille.webp?v=6c6cfd23","img/ui-cible.webp?v=f2ff41da","img/ui-engrenage.webp?v=634388c0","img/ui-retour.webp?v=a6914dc4","img/ui-crayon.webp?v=67ff4dfd","img/ui-gomme.webp?v=cd83b872","img/ui-pinceau.webp?v=0f5c7fe5","img/ui-zoom_plus.webp?v=4b4ee3c4","img/ui-zoom_moins.webp?v=03700548","img/ui-poing.webp?v=3902f1c1","img/portraits-odo.webp?v=976191e7","img/portraits-bartolo.webp?v=66a957d8","img/portraits-pip.webp?v=b7d1614c","img/portraits-odile.webp?v=0313c8da","img/portraits-gaspard.webp?v=0482e730","img/portraits-rufus.webp?v=5c1e14d9","img/portraits-hermance.webp?v=7eba4a18","img/portraits-roi.webp?v=ac4eb3e5","img/portraits-roi_furieux.webp?v=d2fec7c4","img/portraits-roi_severe.webp?v=98a774d0","img/portraits-roi_content.webp?v=8532de16","img/portraits-roi_ravi.webp?v=71c788f7","img/portraits-orlan.webp?v=db5360b2","img/portraits-orlan_triste.webp?v=21363827","img/portraits-orlan_clin.webp?v=3e01f147","img/portraits-orlan_dos.webp?v=2652693a","img/portraits-morgane.webp?v=d783e82c","img/portraits-valmont.webp?v=a8455f88","img/portraits-barbedouce.webp?v=1ddeaf3a","img/portraits-orlan_sage.webp?v=c758668f","img/portraits-yann.webp?v=5827c525","img/portraits-lise.webp?v=3c76e213","img/portraits-marcos.webp?v=75d53083","img/portraits-brigitte.webp?v=d560924a","img/portraits-tom.webp?v=c5e9f04f","img/portraits-hugo.webp?v=49454d50","img/portraits-gil.webp?v=567d9a0e","img/portraits-fee.webp?v=8a4c3992","img/parchment.webp?v=a831699c","img/title.webp?v=aaed4ad0","img/scenes-moulins.webp?v=e7e94cb5","img/scenes-riviere.webp?v=bd786558","img/scenes-chateau.webp?v=5912b100","img/scenes-falaise.webp?v=34240065","img/scenes-paturage.webp?v=d5bd0e5c","img/scenes-foret_nuit.webp?v=bdf8de97","img/scenes-iles.webp?v=510eb791","img/scenes-ruines.webp?v=bf8faa74","img/scenes-voyageurs.webp?v=f37cb5db","img/scenes-enveloppe.webp?v=a0f0e1b9","img/table.webp?v=c8dcf938","img/icon.webp?v=f712f7e3","fonts/police-1.woff2?v=8e18fce8","fonts/police-2.woff2?v=5185ddfa","fonts/police-3.woff2?v=b36cefad","fonts/police-4.woff2?v=3b4646c2","fonts/police-5.woff2?v=ab1973f3","fonts/police-6.woff2?v=25104323"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) {
    return c.addAll(SHELL).then(function () {
      return Promise.all(FILES.map(function (f) {
        return caches.match(f).then(function (hit) { return hit ? c.put(f, hit) : c.add(f); }).catch(function () {});
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return (k.indexOf('core-') === 0 || k.indexOf('music-') === 0) && k !== CORE && k !== MUS; }).map(function (k) { return caches.delete(k); }));
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
