/* Assemble src/* en dist/index.html (page autonome) et dist/artifact.html (fragment pour publication). */
var fs = require('fs'), path = require('path');
var S = function (f) { return fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'); };

/* Page du site : images et polices en fichiers à part (img/, fonts/), chargés au besoin et mis en cache par le service worker.
   Le fragment pour l'outil Artifact garde tout embarqué. */
var crypto = require('crypto');
var outFiles = {};                       // chemin publié → contenu
var hash = function (buf) { return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8); };
var put = function (dir, name, buf) { var p = dir + '/' + name; outFiles[p] = buf; return p + '?v=' + hash(buf); };
var assetsJs = (function () {
  var g = { window: {} }; new Function('window', S('assets.js'))(g.window);
  var walk = function (o, pre) {
    Object.keys(o).forEach(function (k) {
      var v = o[k], name = pre ? pre + '-' + k : k;
      var url = function (d) { var m = /^data:image\/webp;base64,(.*)$/.exec(d); return m ? put('img', name + '.webp', Buffer.from(m[1], 'base64')) : d; };
      if (typeof v === 'string') o[k] = url(v);
      else if (v && typeof v.src === 'string') v.src = url(v.src);
      else if (v && typeof v === 'object') walk(v, name);
    });
  };
  walk(g.window.ASSETS, '');
  return 'window.ASSETS = ' + JSON.stringify(g.window.ASSETS) + ';\n';
})();
var fontsCss = (function () {
  var py = 'import sys,base64,io\nfrom fontTools.ttLib import TTFont\nf=TTFont(io.BytesIO(base64.b64decode(sys.stdin.read())),recalcTimestamp=False);f.flavor="woff2";o=io.BytesIO();f.save(o);sys.stdout.write(base64.b64encode(o.getvalue()).decode())';
  var n = 0;
  return S('fonts.css').replace(/url\(data:font\/woff;base64,([^)]+)\)\s*format\(["']?woff["']?\)|url\(data:font\/woff;base64,([^)]+)\)/g, function (all, a, b) {
    var w2 = Buffer.from(require('child_process').execFileSync('python3', ['-c', py], { input: a || b, maxBuffer: 1 << 26 }).toString(), 'base64');
    return 'url(' + put('fonts', 'police-' + (++n) + '.woff2', w2) + ') format("woff2")';
  });
})();
var css = S('fonts.css') + S('style.css'), cssPage = fontsCss + S('style.css');
var musicMap = {}, musicJs = (function () {
  var dir = path.join(__dirname, 'music'), o = {};   // musiques : un seul exemplaire, celui publié à la racine
  try { fs.readdirSync(dir).filter(function (f) { return /\.mp3$/.test(f); }).forEach(function (f) { o[f.replace(/\.mp3$/, '')] = 'music/' + f + '?v=' + hash(fs.readFileSync(path.join(dir, f))); }); } catch (e) {}
  musicMap = o;
  return 'window.MUSIC=' + JSON.stringify(o) + ';';
})();
var logo = (function () { try { return 'window.STUDIO_LOGO="data:image/webp;base64,' + fs.readFileSync(path.join(__dirname, 'assets', 'out', 'keismey-studio.webp')).toString('base64') + '";'; } catch (e) { return ''; } })();
var jsParts = function (assets) { return logo + '\n;\n' + assets + '\n;\n' + ['core.js', 'levels.js', 'i18n.js', 'terrain.js', 'art.js', 'cloud.js'].map(S).join('\n;\n') + '\n;\n' + musicJs + '\n;\n' + S('app.js'); };
var js = jsParts(S('assets.js')), jsPage = jsParts(assetsJs);
var b64 = function (f) { try { return fs.readFileSync(path.join(__dirname, 'assets', 'out', f)).toString('base64'); } catch (e) { return ''; } };
var ic96 = b64('icon-192.png');
var fonts = ic96 ? '<link rel="icon" type="image/png" href="data:image/png;base64,' + ic96 + '"><link rel="apple-touch-icon" href="data:image/png;base64,' + ic96 + '">' : '';
var body = '<div id="app"></div><div id="modal"></div><div id="toast" role="status"></div><div id="dragghost"></div>';
var title = 'Le Cartographe';

var URL_ = 'https://keismey.github.io/Le-Cartographe/';
var DESC = 'Dessine le monde d’après les témoignages des habitants : place les lieux, trace les routes et rends ta carte au roi. Gratuit, sans pub, dans le navigateur.';
var og = '<meta name="description" content="' + DESC + '">' +
  '<meta property="og:type" content="website"><meta property="og:site_name" content="Keismey Studio"><meta property="og:title" content="Le Cartographe">' +
  '<meta property="og:description" content="' + DESC + '"><meta property="og:url" content="' + URL_ + '">' +
  '<meta property="og:image" content="' + URL_ + 'og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' +
  '<meta property="og:image:alt" content="Le Cartographe · Keismey Studio"><meta property="og:locale" content="fr_FR"><meta property="og:locale:alternate" content="en_GB">' +
  '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Le Cartographe"><meta name="twitter:description" content="' + DESC + '"><meta name="twitter:image" content="' + URL_ + 'og.jpg">';
var swReg = '<script>if("serviceWorker" in navigator&&/^https?:/.test(location.protocol)){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}</script>';
var cfBeacon = "<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"cdb82226cd1b401d9e4f4e899f9b8425\"}'></script><!-- End Cloudflare Web Analytics -->";
var full = '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' +
  '<meta name="theme-color" content="#15242c"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Le Cartographe"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-192.png"><link rel="icon" type="image/png" href="icon-192.png"><title>' + title + '</title>' + og +
  '<style>' + cssPage + '</style></head><body>' + body + '<script>' + S('ks-studio.js') + '</script><script>' + S('ks-back.js') + '</script><script>' + jsPage + '</script>' + swReg + cfBeacon + '</body></html>\n';

/* Fragment pour l'outil Artifact : pas de doctype/html/head/body, titre + méta en tête */
var frag = '<title>' + title + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>' + css + '</style>\n' + body + '\n<script>' + js + '</script>\n';

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
['icon-192.png', 'icon-512.png', 'icon-maskable.png'].forEach(function (f) { try { fs.copyFileSync(path.join(__dirname, 'assets', 'out', f), path.join(__dirname, 'dist', f)); } catch (e) {} });
try {
  fs.mkdirSync(path.join(__dirname, 'dist', 'music'), { recursive: true });
  fs.readdirSync(path.join(__dirname, 'music')).forEach(function (f) { fs.copyFileSync(path.join(__dirname, 'music', f), path.join(__dirname, 'dist', 'music', f)); });
} catch (e) {}
Object.keys(outFiles).forEach(function (p) { fs.mkdirSync(path.join(__dirname, 'dist', path.dirname(p)), { recursive: true }); fs.writeFileSync(path.join(__dirname, 'dist', p), outFiles[p]); });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), frag);
console.log('index.html ' + Math.round(full.length / 1024) + ' Ko · artifact.html ' + Math.round(frag.length / 1024) + ' Ko');

/* ---------- PWA : manifeste + service worker (version = empreinte du contenu) ---------- */
var ver = crypto.createHash('sha1').update(full).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(__dirname, 'dist', 'manifest.webmanifest'), JSON.stringify({
  name: 'Le Cartographe', short_name: 'Cartographe', description: 'Dessine le monde, un témoignage à la fois.',
  lang: 'fr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#15242c', theme_color: '#15242c',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 2));
fs.writeFileSync(path.join(__dirname, 'dist', 'sw.js'), fs.readFileSync(path.join(__dirname, 'src', 'sw.js'), 'utf8').replace('__VERSION__', ver).replace('__FILES__', JSON.stringify(Object.keys(outFiles).map(function (p) { return p + full.split(p)[1].match(/^\?v=[0-9a-f]+/)[0]; }))).replace('__MUSIC__', JSON.stringify(Object.values(musicMap))));
console.log('PWA : version ' + ver);
