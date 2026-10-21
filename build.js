/* Assemble src/* en dist/index.html (page autonome) et dist/artifact.html (fragment pour publication). */
var fs = require('fs'), path = require('path');
var S = function (f) { return fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'); };

var css = S('fonts.css') + S('style.css');
var musicJs = (function () {
  var dir = path.join(__dirname, 'assets', 'music'), o = {};
  try { fs.readdirSync(dir).filter(function (f) { return /\.mp3$/.test(f); }).forEach(function (f) { o[f.replace(/\.mp3$/, '')] = 'music/' + f; }); } catch (e) {}
  return 'window.MUSIC=' + JSON.stringify(o) + ';';
})();
var js = ['assets.js', 'core.js', 'levels.js', 'i18n.js', 'terrain.js', 'art.js', 'cloud.js'].map(S).join('\n;\n') + '\n;\n' + musicJs + '\n;\n' + S('app.js');
var b64 = function (f) { try { return fs.readFileSync(path.join(__dirname, 'assets', 'out', f)).toString('base64'); } catch (e) { return ''; } };
var ic96 = b64('icon-192.png');
var fonts = ic96 ? '<link rel="icon" type="image/png" href="data:image/png;base64,' + ic96 + '"><link rel="apple-touch-icon" href="data:image/png;base64,' + ic96 + '">' : '';
var body = '<div id="app"></div><div id="modal"></div><div id="toast" role="status"></div><div id="dragghost"></div>';
var title = 'Le Cartographe';

var swReg = '<script>if("serviceWorker" in navigator&&/^https?:/.test(location.protocol)){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}</script>';
var cfBeacon = "<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"cdb82226cd1b401d9e4f4e899f9b8425\"}'></script><!-- End Cloudflare Web Analytics -->";
var full = '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' +
  '<meta name="theme-color" content="#15242c"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Le Cartographe"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-192.png"><title>' + title + '</title>' + fonts +
  '<style>' + css + '</style></head><body>' + body + '<script>' + S('ks-studio.js') + '</script><script>' + S('ks-back.js') + '</script><script>' + js + '</script>' + swReg + cfBeacon + '</body></html>\n';

/* Fragment pour l'outil Artifact : pas de doctype/html/head/body, titre + méta en tête */
var frag = '<title>' + title + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>' + css + '</style>\n' + body + '\n<script>' + js + '</script>\n';

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
['icon-192.png', 'icon-512.png', 'icon-maskable.png'].forEach(function (f) { try { fs.copyFileSync(path.join(__dirname, 'assets', 'out', f), path.join(__dirname, 'dist', f)); } catch (e) {} });
try {
  fs.mkdirSync(path.join(__dirname, 'dist', 'music'), { recursive: true });
  fs.readdirSync(path.join(__dirname, 'assets', 'music')).forEach(function (f) { fs.copyFileSync(path.join(__dirname, 'assets', 'music', f), path.join(__dirname, 'dist', 'music', f)); });
} catch (e) {}
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), frag);
console.log('index.html ' + Math.round(full.length / 1024) + ' Ko · artifact.html ' + Math.round(frag.length / 1024) + ' Ko');

/* ---------- PWA : manifeste + service worker (version = empreinte du contenu) ---------- */
var crypto = require('crypto');
var ver = crypto.createHash('sha1').update(full).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(__dirname, 'dist', 'manifest.webmanifest'), JSON.stringify({
  name: 'Le Cartographe', short_name: 'Cartographe', description: 'Dessinez le monde, un témoignage à la fois.',
  lang: 'fr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#15242c', theme_color: '#15242c',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 2));
fs.writeFileSync(path.join(__dirname, 'dist', 'sw.js'), fs.readFileSync(path.join(__dirname, 'src', 'sw.js'), 'utf8').replace('__VERSION__', ver));
console.log('PWA : version ' + ver);
