# Le Cartographe

Jeu navigateur mobile d'enquête et de cartographie (Keismey Studio) : des témoins décrivent un pays, certains se trompent ; tu recoupes leurs phrases, poses les lieux, traces les rivières, puis remets ta carte au roi.

**État : V0 en test** — contrées 1 et 2, français / anglais. Pas encore référencé sur le hub.

## Jouer
`index.html` est une page autonome : l'ouvrir suffit (ou l'activer via GitHub Pages, branche `main`, dossier racine).

## Développer
```
node build.js      # assemble src/* en index.html (+ dist/)
node test/test.js  # vérifie chaque indice (vrai/faux), le score, la qualité des niveaux
```
- `src/core.js` : moteur pur (évaluation des indices, recalage, score)
- `src/levels.js` : les contrées (données)
- `src/i18n.js` : textes FR/EN
- `src/art.js` : tampons vectoriels, parchemin
- `src/app.js` : interface et interactions
