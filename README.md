# Le Cartographe

Jeu navigateur mobile d'enquête et de cartographie (Keismey Studio) : des témoins décrivent un pays, certains se trompent ; tu recoupes leurs phrases, poses les lieux, traces les rivières, puis remets ta carte au roi.

**État : v1.4** — 8 contrées, mode libre, français / anglais. Installable en application (PWA), jouable hors ligne après la première visite.

Jouer : https://keismey.github.io/Le-Cartographe/

## Jouer en local
`index.html` est une page autonome : l'ouvrir suffit. Le service worker (hors ligne) ne s'active qu'en `http(s)`, par exemple avec `npx serve` ou `python3 -m http.server` à la racine.

## Développer
```
node build.js               # assemble src/* dans dist/
node test/test.js --rapide  # indices vrais/faux, couverture, score (quelques secondes)
node test/test.js           # tout, y compris le solveur qui vérifie que chaque contrée a une solution (plus de 5 minutes)
```
Lancer au moins `--rapide` avant chaque PR, et le test complet quand une contrée change (`src/levels.js`, `src/core.js`).

### Publier
GitHub Pages sert la racine de la branche `main` (`.nojekyll` présent). `build.js` écrit dans `dist/`, qui n'est pas suivi par git ; après un build, copier à la racine les fichiers de `dist/` :
`index.html`, `sw.js`, `manifest.webmanifest`, `icon-*.png`, `img/`, `fonts/` et `music/`. La version du service worker est l'empreinte de `index.html` : chaque nouveau build force la mise à jour chez les joueurs.

## Organisation
- `src/core.js` : moteur pur (évaluation des indices, recalage, score), testé par `test/test.js`
- `src/levels.js` : les contrées (données)
- `src/i18n.js` : textes FR/EN, notes de mise à jour
- `src/terrain.js`, `src/art.js` : zones de terrain au crayon, tampons vectoriels, parchemin, rose des vents
- `src/assets.js` : images du jeu en WebP base64 (généré par `assets/process.py`). Pour la page du site, `build.js` les écrit en fichiers dans `img/` et convertit les polices de `src/fonts.css` en woff2 dans `fonts/` : la page fait ~380 Ko au lieu de 3,8 Mo, et le service worker garde ces fichiers pour le hors-ligne. `artifact.html` garde tout embarqué.
- `src/app.js` : interface et interactions ; `src/style.css`, `src/fonts.css` : styles et polices
- `src/cloud.js` : sauvegarde en ligne facultative, seulement quand le jeu tourne comme Artifact claude.ai (sinon tout reste dans le `localStorage`)
- `src/sw.js` : modèle du service worker (`__VERSION__` remplacé au build)
- `src/ks-studio.js`, `src/ks-back.js` : outils communs aux jeux Keismey Studio (soutien, écran studio) et gestion du bouton retour du téléphone
- `assets/` : sources graphiques et sonores, non chargées par le jeu (mais servies par Pages comme tout le dépôt)
  - `raw/` : planches d'origine générées ; `out/` : images découpées, dont les icônes PWA et le logo studio repris par `build.js`
  - `process.py` : découpe les planches et régénère `src/assets.js` (Python, numpy, Pillow, scipy ; chemins absolus à adapter dans le fichier)
  - `data.js`, `build-assets.js` (génère `assets-page.html` et `assets-prompts.md`), `music-prompts.md` : prompts utilisés pour les images et les musiques
  - `music/` : musiques sources, copiées par `build.js` dans `dist/music/`
  - `fonts/` : licences OFL des polices
- `music/`, `icon-*.png`, `cover.webp`, `og.jpg` à la racine : fichiers publiés (`og.jpg` : image de partage 1200×630 ; `cover.webp` : image de couverture)
