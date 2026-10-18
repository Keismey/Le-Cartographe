var fs = require('fs');
var D = require('./data.js'), A = D.ASSETS, G = D.GROUPS;
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
var DEL = {}; 'T1 S1 S2 PO1 PO2 TITRE U1 U2 S5 S6 S7 PO3 PO4 PO5 MER TER1 TER2 TER3 FIN1 FIN2 V1 V2 V3 V4 V5 V6 V7 V8'.split(' ').forEach(function (i) { DEL[i] = 1; });
var byId = {}; A.forEach(function (a) { byId[a.id] = a; });
function count(a) { var n = a.sheet ? a.sheet[0] : (a.portrait ? a.portrait[0] : 1); return a.sheet ? n + ' icônes' : (a.portrait ? n + ' portraits' : 'image seule'); }

/* ───── page HTML (fragment pour l'outil Artifact) ───── */
var cards = '';
[5, 2, 3].forEach(function (g) {
  var list = A.filter(function (a) { return a.group === g && !DEL[a.id]; });
  cards += '<section class="grp" data-g="' + g + '"><div class="grp-h"><h2>' + esc(G[g].name) + '</h2><p>' + esc(G[g].note) + '</p></div>';
  list.forEach(function (a) {
    var ref = a.ref ? '<p class="ref">À joindre comme référence de style : <b>' + esc(byId[a.ref].title) + '</b> (' + a.ref + ')</p>' : '';
    cards += '<article class="card" id="a-' + a.id + '" data-id="' + a.id + '" data-g="' + g + '">' +
      '<header><label class="chk"><input type="checkbox" class="done" aria-label="Fait : ' + esc(a.title) + '"><span class="box" aria-hidden="true"></span></label>' +
      '<div class="ttl"><h3>' + esc(a.title) + '</h3><p class="meta"><span>' + esc(a.file) + '</span><span>' + a.fmt + '</span><span>' + count(a) + '</span></p></div></header>' +
      '<p class="use">' + esc(a.use) + '</p>' + ref +
      '<button class="copy" type="button">Copier le prompt</button>' +
      '<details><summary>Voir le prompt</summary><pre class="prompt">' + esc(D.compose(a)) + '</pre></details>' +
      '<div class="chk-l"><h4>Je vérifie</h4><ul>' + a.checks.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div></article>';
  });
  cards += '</section>';
});

cards += '<section class="grp rcv"><details><summary>Déjà reçus (' + A.filter(function (x) { return DEL[x.id]; }).length + ') : merci, tout est intégré ou rangé pour les contrées 3 à 8</summary><ul>' + A.filter(function (x) { return DEL[x.id]; }).map(function (x) { return '<li>✓ ' + esc(x.title) + '</li>'; }).join('') + '</ul></details></section>';

var css = ':root{--night:#15242c;--night2:#1e323b;--night3:#2a434e;--line:#3b5864;--paper:#eadfc0;--text:#efe6cf;--muted:#a9b9b4;--brass:#d2a94b;--seal:#b8402a;--ok:#3f8a52;color-scheme:dark}' +
  '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{margin:0}' +
  'body{background:var(--night);color:var(--text);font-family:"Alegreya Sans","Segoe UI",system-ui,sans-serif;font-size:17px;line-height:1.4;padding-block:20px 48px}' +
  '.wrap{max-width:760px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}' +
  'h1,h2,h3{font-family:"IM Fell English",Georgia,"Times New Roman",serif;font-weight:400;margin:0;text-wrap:balance}' +
  'h1{font-size:2.3rem;color:var(--paper);line-height:1.1}h2{font-size:1.5rem;color:var(--brass)}h3{font-size:1.2rem;color:var(--paper)}' +
  '.lead{color:var(--muted);margin:8px 0 0;max-width:60ch}' +
  '.how{margin:22px 0;padding:16px;border:1px solid var(--line);border-radius:8px;background:var(--night2)}.how h2{font-size:1.2rem;margin-bottom:8px}.how ol{margin:0;padding-left:1.2em;display:grid;gap:6px}.how b{color:var(--paper)}' +
  '.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 4px}.chip{min-height:44px;padding:8px 14px;border-radius:22px;border:1px solid var(--line);background:var(--night2);color:var(--text);font:inherit;cursor:pointer}.chip[aria-pressed=true]{border-color:var(--brass);background:var(--night3);color:var(--paper)}.prog{margin-left:auto;color:var(--muted);font-variant-numeric:tabular-nums}' +
  '.grp{margin-top:30px;display:grid;gap:14px}.grp-h p{margin:4px 0 0;color:var(--muted);max-width:60ch}' +
  '.card{border:1px solid var(--line);border-radius:8px;background:var(--night2);padding:14px;display:grid;gap:10px;min-width:0}.card.is-done{opacity:.62}' +
  '.card header{display:flex;gap:12px;align-items:flex-start}.ttl{min-width:0;flex:1}.meta{margin:4px 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.84em;color:var(--muted)}.meta span:first-child{color:var(--brass);overflow-wrap:anywhere}' +
  '.chk{position:relative;flex:none;width:44px;height:44px;margin:-6px 0 0 -8px;display:grid;place-items:center;cursor:pointer}.chk input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:pointer}.box{width:26px;height:26px;border:2px solid var(--line);border-radius:6px;display:grid;place-items:center;font-weight:800;color:#fff}.chk input:checked+.box{background:var(--ok);border-color:var(--ok)}.chk input:checked+.box::after{content:"✓"}.chk input:focus-visible+.box{outline:3px solid var(--brass);outline-offset:2px}' +
  '.use{margin:0}.ref{margin:0;padding:8px 10px;border-left:3px solid var(--brass);background:var(--night);color:var(--muted);font-size:.92em}.ref b{color:var(--paper)}' +
  '.copy{min-height:48px;border-radius:6px;border:1px solid #d4573d;background:var(--seal);color:#fff6ea;font:inherit;font-weight:700;cursor:pointer}.copy.ok{background:var(--ok);border-color:var(--ok)}' +
  'details summary{min-height:44px;display:flex;align-items:center;color:var(--brass);cursor:pointer}pre.prompt{margin:0;padding:12px;background:var(--night);border:1px solid var(--line);border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere;font:.84em/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--text);user-select:text;-webkit-user-select:text}' +
  '.chk-l h4{margin:0 0 4px;font-size:.78em;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700}.chk-l ul{margin:0;padding-left:1.1em;display:grid;gap:2px;font-size:.94em}' +
  '.rcv summary{min-height:44px;display:flex;align-items:center;color:var(--brass);cursor:pointer}.rcv ul{columns:2;margin:8px 0 0;padding:0;list-style:none;color:var(--muted);font-size:.94em}.rcv li{padding:2px 0;break-inside:avoid}.card.hide,.grp.hide{display:none}:focus-visible{outline:3px solid var(--brass);outline-offset:2px}';

var js = '(function(){var KEY="cartographe-assets-done",done={};try{done=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){}' +
  'function save(){try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}}' +
  'var cards=[].slice.call(document.querySelectorAll(".card")),filter="all";' +
  'function upd(){var n=0;cards.forEach(function(c){var d=!!done[c.dataset.id];c.classList.toggle("is-done",d);c.querySelector(".done").checked=d;if(d)n++;var show=filter==="all"||(filter==="todo"?!d:c.dataset.g===filter);c.classList.toggle("hide",!show)});' +
  '[].forEach.call(document.querySelectorAll(".grp"),function(g){g.classList.toggle("hide",!g.querySelector(".card:not(.hide)"))});document.getElementById("prog").textContent=n+" faits sur "+cards.length}' +
  'cards.forEach(function(c){c.querySelector(".done").addEventListener("change",function(e){if(e.target.checked)done[c.dataset.id]=1;else delete done[c.dataset.id];save();upd()});' +
  'var b=c.querySelector(".copy");b.addEventListener("click",function(){var t=c.querySelector("pre").textContent;function ok(){b.textContent="Copié";b.classList.add("ok");setTimeout(function(){b.textContent="Copier le prompt";b.classList.remove("ok")},1600)}' +
  'function fb(){var r=document.createRange();var p=c.querySelector("pre"),d=c.querySelector("details");d.open=true;r.selectNodeContents(p);var s=getSelection();s.removeAllRanges();s.addRange(r);try{if(document.execCommand("copy"))ok()}catch(e){}}' +
  'if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,fb)}else fb()})});' +
  '[].forEach.call(document.querySelectorAll(".chip"),function(ch){ch.addEventListener("click",function(){filter=ch.dataset.f;[].forEach.call(document.querySelectorAll(".chip"),function(x){x.setAttribute("aria-pressed",x===ch?"true":"false")});upd()})});upd()})();';

var chips = [['all', 'Tout'], ['5', 'Nouveau'], ['2', 'Recommandé'], ['3', 'Contrées 3 à 8'], ['todo', 'Reste à faire']];
var page = '<title>Assets du Cartographe</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap">\n' +
  '<style>' + css + '</style>\n<div class="wrap"><h1>Assets du Cartographe</h1>' +
  '<p class="lead">' + A.length + ' prompts pour Gemini, classés par ordre d’utilité. Chacun contient déjà le style commun : tu copies, tu colles, c’est tout.</p>' +
  '<div class="how"><h2>Comment faire</h2><ol>' +
  '<li><b>Fond blanc pur, toujours.</b> Je pose les images sur le parchemin en mode « multiplication » : le blanc disparaît tout seul, l’encre et l’aquarelle restent. Un fond gris, texturé ou ombré gâche l’effet.</li>' +
  '<li><b>Commence par « Tampons : habitat ».</b> Quand tu es content de la planche, joins-la aux demandes suivantes comme image de référence (la carte l’indique), pour que tout le jeu garde le même trait.</li>' +
  '<li><b>Une icône ratée ?</b> Redemande : « Refais uniquement l’icône 3, garde toutes les autres strictement identiques ».</li>' +
  '<li><b>Du texte parasite ?</b> Redemande avec « remove all text and letters from the image ».</li>' +
  '<li><b>Envoi :</b> joins-moi les PNG tels que Gemini les produit (pas de capture d’écran), avec le nom de fichier indiqué sur la carte. Je les découpe et je les intègre moi-même.</li></ol></div>' +
  '<div class="bar" role="group" aria-label="Filtrer">' + chips.map(function (c, i) { return '<button type="button" class="chip" data-f="' + c[0] + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + c[1] + '</button>'; }).join('') + '<span class="prog" id="prog"></span></div>' +
  cards + '</div>\n<script>' + js + '</script>\n';
fs.writeFileSync(__dirname + '/assets-page.html', page);

/* ───── version Markdown (dossier du projet) ───── */
var md = '# Assets du Cartographe : prompts pour Gemini\n\nRègles : fond blanc pur (les images sont posées en mode « multiplication »), aucun texte dans les images, commencer par « Tampons : habitat » puis le joindre comme référence aux planches suivantes.\n';
[5, 1, 2, 3, 4].forEach(function (g) {
  md += '\n## ' + G[g].name + '\n\n' + G[g].note + '\n';
  A.filter(function (a) { return a.group === g; }).forEach(function (a) {
    md += '\n### ' + a.id + ' · ' + a.title + '\n\n- Fichier : `' + a.file + '` · format ' + a.fmt + ' · ' + count(a) + '\n- Usage : ' + a.use + '\n' + (a.ref ? '- Joindre comme référence : ' + byId[a.ref].title + ' (' + a.ref + ')\n' : '') + '- Je vérifie : ' + a.checks.join(' ; ') + '\n\n```\n' + D.compose(a) + '\n```\n';
  });
});
fs.writeFileSync(__dirname + '/assets-prompts.md', md);
console.log('page', Math.round(page.length / 1024) + ' Ko', '· md', Math.round(md.length / 1024) + ' Ko');
