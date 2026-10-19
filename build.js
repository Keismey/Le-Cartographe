/* Assemble src/* en dist/index.html (page autonome) et dist/artifact.html (fragment pour publication). */
var fs = require('fs'), path = require('path');
var S = function (f) { return fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'); };

var css = S('fonts.css') + S('style.css');
var js = ['assets.js', 'core.js', 'levels.js', 'i18n.js', 'terrain.js', 'art.js', 'cloud.js', 'app.js'].map(S).join('\n;\n');
var b64 = function (f) { try { return fs.readFileSync(path.join(__dirname, 'assets', 'out', f)).toString('base64'); } catch (e) { return ''; } };
var ic96 = b64('icon-192.png');
var fonts = ic96 ? '<link rel="icon" type="image/png" href="data:image/png;base64,' + ic96 + '"><link rel="apple-touch-icon" href="data:image/png;base64,' + ic96 + '">' : '';
var body = '<div id="app"></div><div id="modal"></div><div id="toast" role="status"></div><div id="dragghost"></div>';
var title = 'Le Cartographe';

var full = '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">' +
  '<meta name="theme-color" content="#15242c"><title>' + title + '</title>' + fonts +
  '<style>' + css + '</style></head><body>' + body + '<script>' + js + '</script></body></html>\n';

/* Fragment pour l'outil Artifact : pas de doctype/html/head/body, titre + méta en tête */
var frag = '<title>' + title + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>' + css + '</style>\n' + body + '\n<script>' + js + '</script>\n';

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
['icon-192.png', 'icon-512.png'].forEach(function (f) { try { fs.copyFileSync(path.join(__dirname, 'assets', 'out', f), path.join(__dirname, 'dist', f)); } catch (e) {} });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), frag);
console.log('index.html ' + Math.round(full.length / 1024) + ' Ko · artifact.html ' + Math.round(frag.length / 1024) + ' Ko');
