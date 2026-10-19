/* Données des prompts d'assets — Le Cartographe. Les prompts sont en anglais (pour Gemini), le reste en français. */
var STYLE = "Hand-painted antique map illustration in a storybook style: warm sepia-brown ink outlines (#3a2c1c) of steady medium weight, soft translucent watercolor washes in muted earthy colors (ochre, moss green, faded teal-blue, brick red, warm cream), light hatching for shading, slightly naive and charming, cozy medieval-fantasy mood. Flat 2D painting, no photorealism, no 3D render, no glossy effects. Absolutely no text, letters, numbers, runes, captions, signatures or watermarks.";

var VIEW_MAP = "Viewpoint: a gentle three-quarter bird's-eye view, like a symbol on an old hand-drawn map; each object compact and still readable when shrunk to 48 pixels.";
var VIEW_UI = "Viewpoint: front or slight three-quarter view, like a hand-painted game interface icon; bold simple silhouette, still readable when shrunk to 48 pixels.";

function sheet(n, cols, rows, view) {
  return "Layout: one sprite sheet, 3:2 landscape, on a perfectly flat pure white background (#FFFFFF): no paper texture, no gradient, no vignette, no ground shadow, no drop shadow, no frame, no grid lines, no dividers. Exactly " + n + " separate objects in " + cols + " columns × " + rows + " rows, each centered in its own invisible equal cell with a wide empty white margin around it. Objects must not touch, overlap or be cropped, and must all be drawn at the same visual scale and level of detail, each filling about 65% of its cell. " + view;
}
function portraits(n, cols, rows) {
  return "Layout: " + n + " separate head-and-shoulders bust portraits in a " + cols + "×" + rows + " grid, 1:1 square image, on a perfectly flat pure white background (#FFFFFF): no frames, no circles, no scenery, no shadow on the background, no dividers. Each portrait is centered in its own invisible equal cell with a wide white margin; identical head size, framing and level of detail for all; characters look toward the viewer at a slight three-quarter angle with friendly, expressive faces; the painting fades out softly into the white at the chest (no hard cropped edge).";
}

var REF = "Reference: the attached image is an already approved sheet. Match its drawing style exactly (ink line weight, color palette, level of detail, object scale) and produce a NEW sheet with the subjects below.";

var ASSETS = [

  /* ───────── NOUVEAU (18 oct.) : habillage, récompenses, personnages de l'histoire ───────── */
  /* ───────── NOUVEAU (19 oct.) : icônes d'interface restées dessinées en traits simples ───────── */
  { id: 'N5', group: 6, title: "Icônes d'interface : gestes et boutons", file: 'ui-gestes.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'U1',
    use: "Aujourd'hui ces six boutons sont de simples traits que je dessine par code : ils détonnent à côté du reste. Déplacer (main), Annuler, Retirer (corbeille), Recentrer, Réglages, Retour.",
    checks: ["Silhouettes très simples, lisibles à 32 pixels", "Aucune lettre ni chiffre", "La main est ouverte et ne tient rien", "Fond blanc pur"],
    subjects: [
      "an open hand with spread fingers, palm facing the viewer, as if about to push a map across a table (the 'move' tool)",
      "a curved brass arrow turning back on itself counter-clockwise, like an undo arrow, with a small ink-stained tip",
      "a small round wooden waste bin with a lid, seen slightly from the side (the 'remove' tool)",
      "a brass gunsight-style target ring with four short tick marks at north, south, east and west (the 'recentre' tool)",
      "a brass cog wheel with eight teeth and a round hole in the middle (the 'settings' button)",
      "a thick cream parchment arrow pointing left, with a thin brass edging (the 'back' button)"
    ] },

  { id: 'N6', group: 6, title: "Icônes d'interface : mode libre", file: 'ui-libre.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'N5',
    use: "Pour le mode libre : crayon de couleur, gomme, pinceau, et les boutons de zoom. Remplaceront mes traits simples.",
    checks: ["Le crayon de couleur est bien un crayon, pas une plume", "Les boutons + et − sont dessinés (pas écrits en lettres)", "Fond blanc pur"],
    subjects: [
      "a single colored pencil with a sharpened tip, wooden body painted dark green, seen diagonally",
      "a white rubber eraser block, slightly worn at one corner, seen diagonally",
      "a fine round paint brush with a wooden handle and a tip dipped in blue",
      "a round brass button with a plain plus sign engraved in the middle (zoom in)",
      "a round brass button with a plain minus sign engraved in the middle (zoom out)",
      "a closed fist hand holding nothing, palm side, as if grabbing the paper (the 'drag' gesture)"
    ] },

  { id: 'N1', group: 5, title: 'Le roi : 4 expressions', file: 'roi-expressions.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'PO2',
    use: "Le roi réagit à ton verdict : son visage change selon les étoiles (0, 1, 2 ou 3). Aujourd'hui j'ai un seul portrait pour toutes les réactions.",
    checks: ["C'est bien le même roi que sur la planche de référence (barbe, couronne, cape d'hermine bleue)", "Les 4 humeurs se lisent au premier regard, même en petit", "Même cadrage et même taille de tête sur les 4"],
    subjects: [
      "The same elderly king as in the reference image (long white beard, gold crown, ermine-trimmed blue robe), looking severely disappointed and angry: heavy furrowed brows, mouth turned down, eyes narrowed.",
      "The same king, stern but fair, neutral expression, one eyebrow slightly raised, arms folded out of view, lips pressed together.",
      "The same king, pleased and warm: a genuine kind smile, eyes crinkled, a small approving nod of the head.",
      "The same king, astonished and delighted: eyes wide open, eyebrows high, a wide joyful smile, one hand raised to his chest."
    ] },

  { id: 'N2', group: 5, title: 'Orlan, le cartographe disparu', file: 'orlan.png', fmt: '1:1', portrait: [4, 2, 2],
    use: "Orlan, le cartographe qui est parti sans un mot et dont tu reprends les cartes. Ses notes apparaissent après chaque contrée : je veux enfin lui donner un visage.",
    checks: ["Même homme sur les 4 images (on doit le reconnaître)", "Un air énigmatique et sympathique, ni méchant ni naïf", "Les doigts tachés d'encre sont visibles sur au moins 2 images"],
    subjects: [
      "Orlan, a lean man of about 50: short salt-and-pepper beard, tired kind eyes, small round brass spectacles pushed up on his forehead, a worn green-brown travel coat with a leather map tube strapped across the chest, ink-stained fingertips. Mysterious half-smile, looking straight at the viewer.",
      "The same Orlan, pensive, looking down at a small brass compass held in his open palm.",
      "The same Orlan, with a playful wink and a raised quill pen in his ink-stained hand, as if sharing a secret.",
      "The same Orlan seen three-quarter from behind, turning his head back over his shoulder with a faint smile, map tube on his back, as if walking away."
    ] },

  { id: 'N3', group: 5, title: 'Sceaux et cachets de verdict', file: 'sceaux.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'U2',
    use: "L'instant où tu remets la carte au roi : sceau de cire, puis cachets d'encre « juste / presque / raté » posés sur chaque lieu. Remplacera mes pastilles vertes et rouges par du vrai dessin.",
    checks: ["Aucune lettre : les cachets se lisent par leur symbole (coche, vague, croix)", "Les 3 cachets d'encre ont la même taille et un bord légèrement irrégulier, comme tamponnés", "Le sceau brisé est bien en deux morceaux"],
    subjects: [
      "A fresh round seal of deep red sealing wax with an embossed eight-pointed compass-star pattern, glossy, slightly irregular edge, a short piece of cream ribbon under it.",
      "A red wax seal pressed on a small folded piece of parchment, wax slightly squeezed out around the edges.",
      "A red wax seal cracked and broken in two jagged halves, slightly separated, a few tiny wax crumbs.",
      "A round green ink stamp mark in the shape of a bold check mark inside an irregular double circle, ink slightly uneven as if stamped by hand, no text.",
      "A round amber-orange ink stamp mark showing a bold wavy line (tilde) inside an irregular double circle, ink slightly uneven, no text.",
      "A round red ink stamp mark showing a bold cross (X) inside an irregular double circle, ink slightly uneven, no text."
    ] },

  { id: 'N4', group: 5, title: "Habillage d'interface", file: 'habillage.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'U1',
    use: "Les petits ornements qui font passer les menus de « corrects » à « d'un vrai livre ancien » : coins en laiton, séparateurs, cartouche, punaise pour épingler un indice.",
    checks: ["Le coin est dessiné pour un angle haut-gauche (je le retourne pour les autres)", "Le cartouche est bien vide (aucun texte)", "Le cadre rond est vide au centre"],
    subjects: [
      "A single ornate brass corner flourish for the top-left corner of a frame: curling scrollwork, engraved look, slightly worn gold-brass, meant to be mirrored for the other corners.",
      "A long thin horizontal ornamental divider in engraved brass: a small central diamond with tiny leaf scrolls extending left and right, symmetrical.",
      "An empty ribbon banner (cartouche) in cream parchment with folded swallow-tail ends and thin brass edging, completely blank in the middle.",
      "A red wax-headed push pin (round glossy red head, silver needle) seen at a slight angle, with a tiny soft shadow-free highlight.",
      "A round empty portrait frame ring in engraved brass with a thin dark-ink outline, the inside completely empty and pure white.",
      "A blank parchment label tag with a hole and a short piece of twine, slightly curled corners, completely blank."
    ] },

  /* ───────── PRIORITÉ 1 : pour la prochaine itération ───────── */
  { id: 'T1', group: 1, title: 'Parchemin', file: 'parchemin.png', fmt: '1:1',
    use: "Fond de la carte que le joueur dessine. Remplace ma texture générée par code.",
    checks: ["La feuille remplit toute l'image, bord à bord", "Éclairage uniforme, aucun pli, trou ni déchirure", "Aucun dessin, texte ni ombre portée"],
    prompt: "A flat top-down scan of a single blank sheet of aged cream parchment paper that fills the whole image edge to edge, evenly lit, fine paper fibers, soft pale tea-colored stains, very slightly darker toward the corners, perfectly flat. No folds, no creases, no tears, no holes, no writing, no drawing, no border line, no cast shadow, no objects. Square image." },

  { id: 'S1', group: 1, title: 'Tampons : habitat', file: 'tampons-habitat.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'],
    use: "Les repères habités : village, ferme, auberge, chapelle, abbaye, tannerie. À faire en premier : cette planche fixe le style de toutes les autres.",
    subjects: [
      "a village: a cluster of three or four small timber-framed cottages with brown and red-tiled roofs",
      "a farm: a large wooden barn with a small farmhouse and a short fence",
      "an inn: a two-storey roadside inn with a chimney and a hanging tankard-shaped sign (no writing on the sign)",
      "a chapel: a small stone chapel with a tiny bell turret and a cross on the roof",
      "an abbey: a stone abbey with a tall square bell tower and a small cloister wall",
      "a tannery: a rough timber hut with a wooden frame stretching an animal hide, and a barrel"
    ],
    checks: ["Exactement 6 icônes, aucune coupée", "Fond blanc pur, pas d'ombre au sol", "Même échelle et même trait pour les 6", "Aucune lettre (surtout sur l'enseigne de l'auberge)"] },

  { id: 'S2', group: 1, title: 'Tampons : eau et passages', file: 'tampons-eau.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Moulin, pont, pont cassé, gué, source, lac. Les repères des contrées 1 et 2 sont ici et dans la planche habitat.",
    subjects: [
      "a windmill: a round stone tower with four wooden sails",
      "a stone bridge: a single-arch humpback bridge over a short stretch of blue water",
      "a broken bridge: a stone bridge collapsed in the middle, with a visible gap and fallen stones in the water",
      "a ford: a shallow river crossing marked by three stepping stones and small ripples",
      "a spring: a mossy rock with clear water bubbling out and a tiny stream",
      "a lake: a small round lake with reeds on the shore and a couple of lily pads"
    ],
    checks: ["Exactement 6 icônes, aucune coupée", "Le pont cassé se distingue nettement du pont intact", "Le moulin est bien lisible à petite taille", "Fond blanc pur"] },

  { id: 'PO1', group: 1, title: 'Portraits 1 : contrée 1', file: 'portraits-1.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'S1',
    use: "Maître Odo, Bartolo, Pip et Tante Odile. Remplacent les emojis du carnet.",
    subjects: [
      "Maître Odo, a cheerful plump middle-aged miller with rosy cheeks, flour dusting his beard and linen cap, a warm smile",
      "Bartolo, a shrewd traveling merchant in his forties, round face, neat black mustache and pointed beard, a wide-brimmed hat with a feather, a rich red coat with a fur collar, one eyebrow raised, a bulging coin pouch at his shoulder",
      "Pip, a curious village child about eight years old, messy sandy hair, a missing front tooth, an oversized patched tunic, wide bright eyes",
      "Tante Odile, a sweet, slightly confused old woman with grey hair in a loose bun with stray strands, a knitted shawl, a dreamy vague smile, head tilted"
    ],
    checks: ["4 visages bien distincts, même cadrage", "Odo : farine dans la barbe ; Bartolo : grand chapeau", "Pas de cadre rond ni de décor", "Fond blanc pur"] },

  { id: 'PO2', group: 1, title: 'Portraits 2 : contrée 2 et le roi', file: 'portraits-2.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'PO1',
    use: "Gaspard, Rufus, Hermance et le roi (qui apparaît dès le premier briefing).",
    subjects: [
      "Gaspard, a weathered middle-aged fisherman with a sun-lined face, short grey stubble, a knitted wool cap, a fishing net draped over one shoulder",
      "Rufus, a stern veteran soldier with a square jaw, a short scar on his cheek, a dented iron helmet, a steel gorget and a red tabard, serious but fair",
      "Hermance, a wise very old woman with white hair in a long braid, small round spectacles, deep kind wrinkles, a dark green hooded cloak fastened with a brooch, a calm knowing smile",
      "the king, a kindly old man with a white beard, a small simple gold crown that looks slightly too small, a deep blue velvet robe with ermine trim, tired but warm eyes"
    ],
    checks: ["4 visages distincts, même cadrage que la planche 1", "Le roi paraît bienveillant, pas autoritaire", "Fond blanc pur"] },

  { id: 'TITRE', group: 1, title: 'Écran titre', file: 'titre.png', fmt: '9:16', style: true,
    use: "Illustration plein écran de l'écran titre. J'y superpose le titre et les boutons (FR/EN), donc le haut doit rester calme.",
    checks: ["Le tiers haut est sombre et presque vide", "Aucun texte nulle part", "La lueur de bougie vient du bas droite", "Les couleurs vont avec le bleu nuit du jeu"],
    prompt: "Portrait 9:16 illustration for a game title screen. A cartographer's desk at night seen from above at a slight angle: a deep teal-navy wooden desk (#15242c) lit by a warm candle glow coming from the lower right. In the center, a large unrolled sheet of parchment on which a tiny landscape rises up out of the paper like a pop-up: little green hills, a winding blue river, a small windmill and a stone bridge. A feather quill is drawing the river line. A brass compass and an open ink bottle sit at the edges. Keep the top third of the image calm, dark and almost empty. Richer lighting than a flat sheet, but still the same hand-painted ink and watercolor look." },

  { id: 'U1', group: 1, title: 'Icônes : outils', file: 'ui-outils.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'S1',
    use: "Remplacent les emojis de la barre du bas et des outils : Carnet, Outils, Remettre, règle, tracé, indices.",
    subjects: [
      "an open notebook with a red ribbon bookmark and blank pages",
      "a brass pocket compass seen from the top, with a simple star on the dial and no letters",
      "a feather quill pen with a small ink-stained tip",
      "a wooden ruler with plain tick marks only (no numbers)",
      "a brass magnifying glass with a wooden handle",
      "a red wax seal on a small curled piece of paper, embossed with a simple compass star (no letters)"
    ],
    checks: ["Aucun chiffre sur la règle, aucune lettre sur le sceau", "Silhouettes simples, lisibles en petit", "Fond blanc pur"] },

  { id: 'U2', group: 1, title: 'Icônes : jetons et marqueurs', file: 'ui-jetons.png', fmt: '3:2', sheet: [6, 3, 2, 'UI'], ref: 'U1',
    use: "Jetons Question et Éclaireur, étoiles pleine et vide, éponge pour gommer, fanion de soupçon.",
    subjects: [
      "a round brass token coin embossed with a simple speech bubble, front view",
      "a round brass token coin embossed with a simple spyglass, front view",
      "a filled five-pointed gold star, hand-painted, slightly irregular",
      "an empty five-pointed star outline drawn only in faint brown ink with no fill",
      "a natural sea sponge, tan colored",
      "a small red pennant flag on a short wooden pin"
    ],
    checks: ["Les deux jetons sont de la même taille et bien différents", "L'étoile vide est vraiment vide", "Aucun texte ni point d'interrogation écrit sur les jetons", "Fond blanc pur"] },

  /* ───────── PRIORITÉ 2 : recommandé, rend le jeu plus beau ───────── */
  { id: 'T2', group: 2, title: 'Table sombre', file: 'table.png', fmt: '1:1',
    use: "Fond de l'application autour de la carte et des écrans. Remplace l'aplat bleu nuit.",
    checks: ["Texture douce, sans objet", "Couleur proche de #15242c", "Éclairage uniforme"],
    prompt: "A flat top-down view of a dark teal-navy leather desk surface (color close to #15242c), fine subtle grain, very faintly worn, evenly lit, filling the whole image edge to edge. No objects, no text, no stitching, no border, no strong highlights. Square image." },

  { id: 'ROSE', group: 2, title: 'Rose des vents', file: 'rose.png', fmt: '1:1', style: true,
    use: "Décor de chaque carte. Je dessine le N moi-même : la rose ne doit donc contenir aucune lettre.",
    checks: ["Aucune lettre, même pas un N", "Fond blanc pur", "Pointe nord un peu plus longue"],
    prompt: "A single ornate antique compass rose on a perfectly flat pure white background (#FFFFFF), centered with a wide white margin: an eight-pointed star with the north point slightly longer and ending in a small fleur-de-lis, a thin double outer ring with tiny tick marks, delicate shading in ink and a little muted red and ochre watercolor. No letters at all, no numbers, no shadow on the background. Square image." },

  { id: 'ICONE', group: 2, title: 'Icône de l’application', file: 'icone.png', fmt: '1:1', style: true,
    use: "Icône de l'écran d'accueil du téléphone (installation PWA). Réutilisable plus tard comme vignette du hub.",
    checks: ["Lisible quand elle est toute petite", "Le sujet reste dans le cercle central (marge de 20 %)", "Aucun texte"],
    prompt: "Square app icon: a feather quill drawing a small compass rose on a piece of aged parchment, centered, bold simple shapes with strong contrast so it stays readable at 48 pixels, on a plain deep teal-navy background (#15242c) that fills the whole square. Keep the whole subject inside the central 60% of the image with generous empty margin around it. No text." },

  /* ───────── PRIORITÉ 3 : contrées 3 à 8 (à lancer quand je les construis) ───────── */
  { id: 'S3', group: 3, title: 'Tampons : fortifications', file: 'tampons-forts.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Tours, forteresse, bastide, château royal, mine, ruines (contrées 4, 6 et 8).",
    subjects: [
      "a watchtower: a tall round stone tower with a conical roof and a small flag",
      "a frontier fortress: a stone fortress with crenellated walls and two corner towers",
      "a bastide: a small walled town with a gate, a few roofs behind the wall",
      "a royal castle: a castle with several towers and colorful banners",
      "a mine entrance: a timber-framed tunnel mouth in a rocky hillside with a small ore cart",
      "ruins: a broken stone arch and crumbled walls overgrown with ivy"
    ],
    checks: ["6 icônes, bien distinctes malgré le thème commun", "Aucune bannière avec du texte", "Fond blanc pur"] },

  { id: 'S4', group: 3, title: 'Tampons : relief', file: 'tampons-relief.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Montagne, colline, col, falaise, marais, îlot de rochers (contrées 3, 4 et 8).",
    subjects: [
      "a mountain: a rugged peak with a snow cap",
      "a hill: a smooth rounded green hill with a few tufts of grass",
      "a mountain pass: two peaks with a saddle between them and a tiny winding path",
      "a white cliff: a chalk-white cliff face above a strip of blue sea",
      "a marsh: reeds, small puddles and grass tufts in grey-green wet ground",
      "a rocky islet: a small group of grey rocks poking out of blue water"
    ],
    checks: ["La colline et la montagne ne se confondent pas", "Fond blanc pur"] },

  { id: 'S5', group: 3, title: 'Tampons : forêt', file: 'tampons-foret.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Bois, forêt sombre, grand chêne, cabanes, mare (contrées 4 et 5).",
    subjects: [
      "a light woodland: a small group of four light-green leafy trees",
      "a dark forest: a dense cluster of dark-green pine trees",
      "an ancient oak: one giant gnarled oak with a thick trunk and a wide crown",
      "a woodcutter's cabin: a small log cabin with an axe in a stump and a woodpile",
      "a witch's hut: a crooked little hut with a glowing window, a cauldron and a crescent-shaped weathervane",
      "a fairy pond: a small pond with soft glowing sparkles around it and a few red mushrooms"
    ],
    checks: ["Bois clair et forêt sombre bien différents", "Fond blanc pur"] },

  { id: 'S6', group: 3, title: 'Tampons : côte et mer', file: 'tampons-cote.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Phare, port, crique, épave, île, plage noire (contrées 3 et 7).",
    subjects: [
      "a lighthouse: a tall red-and-white striped lighthouse with a small light glowing on top",
      "a harbor town: a small port with a wooden pier, two boats and a few houses",
      "a hidden cove: a tiny sheltered cove with a pebble beach and a rowboat",
      "a shipwreck: the broken hull and mast of a wrecked wooden ship half in the water",
      "a small island: a tiny sandy island with a palm tree and a couple of rocks",
      "a black beach: a stretch of dark volcanic sand with driftwood and foam"
    ],
    checks: ["Le phare se reconnaît tout de suite", "Fond blanc pur"] },

  { id: 'S7', group: 3, title: 'Tampons : lieux singuliers', file: 'tampons-divers.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Carrières, Val Perdu (la vallée cachée de la finale), croisée des routes, fin de la route, prairie, pierres dressées.",
    subjects: [
      "a quarry: an open stone quarry with stacked cut blocks and a small crane",
      "a hidden valley: a small green valley between two hills with a faint warm golden glow rising from it",
      "a crossroads: a wooden signpost where two paths cross, with three blank wooden boards (no writing)",
      "the end of a road: a dirt road that stops at the stumps of cut-down signposts",
      "a deer meadow: a flowered meadow with two small deer",
      "standing stones: a small circle of tall standing stones"
    ],
    checks: ["Le Val Perdu a bien sa lueur dorée discrète", "Les panneaux sont vierges", "Fond blanc pur"] },

  { id: 'PO3', group: 3, title: 'Portraits 3 : la côte', file: 'portraits-3.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'PO1',
    use: "Yann, Lise, Marcos, Brigitte (contrée 3).",
    subjects: [
      "Yann, a weathered old sailor with a pipe in his mouth, a navy knitted cap, deep sea-wind wrinkles, a patient look",
      "Lise, a lighthouse keeper woman in her fifties holding a small brass lantern, hair tied back, a thick wool sweater, a calm steady gaze",
      "Marcos, a shifty smuggler with narrow eyes, a dark hooded coat, a toothpick in the corner of his mouth, a cheeky half grin",
      "Brigitte, a cheerful innkeeper woman with rolled sleeves, an apron, flushed cheeks, a foaming mug in one hand"
    ],
    checks: ["Marcos louche mais pas caricatural", "Même cadrage que les planches précédentes", "Fond blanc pur"] },

  { id: 'PO4', group: 3, title: 'Portraits 4 : collines et forêt', file: 'portraits-4.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'PO1',
    use: "Tom, Hugo, Gil, Fée-Mouche (contrées 4 et 5).",
    subjects: [
      "Tom, a young shepherd with a long wooden staff, a sheepskin cap, wind-tousled hair and a relaxed smile",
      "Hugo, a burly woodcutter with a thick red beard, a plaid shirt, an axe over his shoulder",
      "Gil, a lean hunter with a feathered hat, a short bow on his back, a sly sideways glance",
      "Fée-Mouche, a tiny forest fairy with translucent dragonfly wings, a leaf dress, mischievous eyes, soft glowing sparkles around her"
    ],
    checks: ["La fée reste de la même taille de buste que les autres", "Fond blanc pur"] },

  { id: 'PO5', group: 3, title: 'Portraits 5 : rivaux et mystères', file: 'portraits-5.png', fmt: '1:1', portrait: [4, 2, 2], ref: 'PO1',
    use: "Morgane, Valmont (le rival), Barbe-Douce, Orlan (notes et finale).",
    subjects: [
      "Morgane, a hooded sorceress with pale skin, dark purple robes and a black raven perched on her shoulder",
      "Valmont, a sly elegant rival cartographer with a thin mustache, a long dark-green coat, ink-stained fingers, a pencil behind his ear and brass dividers in his hand",
      "Barbe-Douce, a gentle old pirate with an eye patch, a red bandana, a gold earring and a surprisingly kind smile",
      "Orlan, an old kind cartographer with a long grey beard, round spectacles, ink-stained hands, a worn leather vest, a faraway wise look"
    ],
    checks: ["Valmont se distingue de Barbe-Douce (élégant contre rustique)", "Orlan a l'air doux : c'est notre mentor disparu", "Fond blanc pur"] },

  { id: 'MER', group: 3, title: 'Décors : mer', file: 'decors-mer.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Petits décors posés sur la mer des contrées 3 et 7.",
    subjects: [
      "a sailing galleon with cream sails",
      "a sea serpent with a curling body and fins",
      "a whale spouting water",
      "a small rowboat with two oars",
      "a flock of five seagulls in a loose V shape",
      "a swirl of stylized waves"
    ],
    checks: ["Fond blanc pur", "Aucune voile avec une inscription"] },

  { id: 'TER1', group: 3, title: 'Décors : arbres', file: 'decors-arbres.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Arbres semés sur la carte révélée, à la fin de chaque contrée, pour qu'elle ressemble à une vraie carte ancienne.",
    subjects: [
      "a single round-crowned oak tree, small",
      "a second, slightly different small oak tree",
      "a single pine tree, small and narrow",
      "a second, slightly different small pine tree",
      "a small group of three mixed trees",
      "a small dead tree with bare branches"
    ],
    checks: ["Arbres petits et simples (ils seront répétés des dizaines de fois)", "Fond blanc pur"] },

  { id: 'TER2', group: 3, title: 'Décors : monts et collines', file: 'decors-monts.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Reliefs semés sur la carte révélée (contrées 4, 8…).",
    subjects: [
      "a small mountain peak with a snowy tip",
      "a second, different small mountain peak",
      "a pair of small peaks side by side",
      "a small rounded hill with a tuft of grass",
      "a second, different small rounded hill",
      "a pair of small rolling hills"
    ],
    checks: ["Petits, simples, répétables", "Fond blanc pur"] },

  { id: 'TER3', group: 3, title: 'Décors : roseaux et buissons', file: 'decors-herbes.png', fmt: '3:2', sheet: [6, 3, 2, 'MAP'], ref: 'S1',
    use: "Remplissage des marais, rives et prairies sur la carte révélée.",
    subjects: [
      "a small tuft of reeds",
      "a second, different tuft of reeds",
      "a small round bush",
      "a small cluster of flowers",
      "a small group of grass blades",
      "a few small rocks"
    ],
    checks: ["Très petits et simples", "Fond blanc pur"] },

  /* ───────── PRIORITÉ 4 : fin du jeu ───────── */
  { id: 'FIN1', group: 4, title: 'Fin : publier la vraie carte', file: 'fin-publier.png', fmt: '3:4', style: true,
    use: "Illustration de la fin ouverte, quand le joueur publie la vraie carte.",
    checks: ["Ambiance d'ouverture, de matin", "Aucun texte"],
    prompt: "Portrait 3:4 illustration: a bright morning scene in which a great map is being unrolled over a kingdom. Roads open through the hills, villagers and travelers set out along new paths toward a golden valley that is now visible between the mountains, a cartographer's desk with a quill in the foreground, warm sunrise light. Hopeful, busy and cozy mood." },

  { id: 'FIN2', group: 4, title: 'Fin : garder le secret', file: 'fin-secret.png', fmt: '3:4', style: true,
    use: "Illustration de la fin intime, quand le joueur garde le Val Perdu secret.",
    checks: ["Ambiance calme, protectrice, au crépuscule", "Aucun texte"],
    prompt: "Portrait 3:4 illustration: a quiet dusk scene in which a cartographer seals a hidden valley. A small glowing green valley with tiny lit cottages is protected between mountains behind a wooden gate, a folded letter with a wax seal rests on a stone in the foreground, a blank empty margin of an old map fades into the misty distance, soft violet and gold twilight. Calm, tender, protective mood." },

  { id: 'V1', group: 4, title: 'Vignette : Vallée des Trois Meuniers', file: 'vignette-1.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing et fiche de la contrée 1 dans l'Atlas.",
    checks: ["Trois moulins visibles", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a gentle river valley at dawn with a winding blue river running past three windmills at different heights on the slopes, a small stone bridge and a roadside inn in the distance, green fields, soft golden light." },
  { id: 'V2', group: 4, title: 'Vignette : Rives du Vieux Gué', file: 'vignette-2.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 2.",
    checks: ["Pont cassé et gué visibles", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a wide river with a shallow ford of stepping stones in the foreground and a collapsed stone bridge farther up, reeds on both banks, a small village and a farm on the riverbanks, morning mist." },
  { id: 'V3', group: 4, title: 'Vignette : Côte des Brumes', file: 'vignette-3.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 3.",
    checks: ["Brume, falaise blanche, phare", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a foggy coastline with a white chalk cliff, a lighthouse with a faint warm beam, a small harbor with boats half hidden in the mist, a few rocks in the sea." },
  { id: 'V4', group: 4, title: 'Vignette : Pays des Mille Collines', file: 'vignette-4.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 4.",
    checks: ["Collines à perte de vue, bergerie", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: endless rolling green hills under a wide sky, a shepherd's sheepfold with a few sheep, a lone watchtower on a ridge, a small shining lake between the hills, a bald grey mountain far away." },
  { id: 'V5', group: 4, title: 'Vignette : Forêt-Qui-Bouge', file: 'vignette-5.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 5.",
    checks: ["Forêt étrange, lucioles", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a mysterious twilight forest whose trees seem to lean and shift, glowing fireflies and a pale mist, a woodcutter's cabin and a tiny witch's hut glowing in the distance, a fairy pond with soft sparkles." },
  { id: 'V6', group: 4, title: 'Vignette : Marches du Rival', file: 'vignette-6.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 6.",
    checks: ["Frontière, forteresse, bannière sans texte", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a tense borderland with a stone frontier fortress on a hill flying a dark-green banner (no emblem with writing), an iron bridge over a gorge, a ditch and a road snaking across the plain, stormy golden light." },
  { id: 'V7', group: 4, title: 'Vignette : Archipel des Cent Phares', file: 'vignette-7.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 7.",
    checks: ["Plusieurs îles, plusieurs phares", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: an archipelago of four rocky islands at sunset, a lighthouse on each island sending a beam across the water toward the others, a sailing ship between the islands, a sea serpent's tail rippling the surface far away." },
  { id: 'V8', group: 4, title: 'Vignette : Royaume Oublié', file: 'vignette-8.png', fmt: '3:2', style: true,
    use: "Bandeau du briefing, contrée 8 (la finale).",
    checks: ["La lueur dorée de la vallée cachée", "Aucun texte"],
    prompt: "Landscape 3:2 illustration: a vast forgotten kingdom seen from a high pass, a royal road that stops at the edge of a misty plain, a hidden valley with a faint golden glow behind a ring of mountains, a distant castle, a lone traveler with a rolled map." }
];

var GROUPS = {
  6: { name: 'Nouveau : icônes d’interface', note: 'Le tour du jeu du 19 oct. : tout le reste est maintenant dessiné. Il ne reste que ces deux planches de boutons, qui sont encore de simples traits faits par code.' },
  5: { name: 'Nouveau : habillage et personnages', note: 'Ce qui me manque pour passer la partie 1–2 de « correcte » à « excellente » : le roi qui réagit, Orlan, les sceaux de verdict et les ornements d’interface.' },
  1: { name: 'Pour la prochaine version', note: 'Reçu et intégré.' },
  2: { name: 'Recommandé', note: 'Toujours à faire : la rose des vents et la table servent à l’habillage, l’icône sert à installer le jeu sur l’écran d’accueil.' },
  3: { name: 'Contrées 3 à 8 : il manque encore 2 planches', note: 'Presque tout est reçu. Restent les fortifications et le relief, dont j’aurai besoin pour les contrées 4 et 6.' },
  4: { name: 'Fin du jeu', note: 'Illustrations des fins et bandeaux de contrées. À faire en dernier.' }
};

function compose(a) {
  var parts = [];
  if (a.style || a.sheet || a.portrait) parts.push(STYLE);
  if (a.sheet) parts.push(sheet(a.sheet[0], a.sheet[1], a.sheet[2], a.sheet[3] === 'UI' ? VIEW_UI : VIEW_MAP));
  if (a.portrait) parts.push(portraits(a.portrait[0], a.portrait[1], a.portrait[2]));
  if (a.ref) parts.push(REF);
  if (a.subjects) parts.push('Subjects, in reading order (left to right, then top to bottom):\n' + a.subjects.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'));
  if (a.prompt) parts.push(a.prompt);
  parts.push('Reminder: absolutely no text, letters or numbers anywhere in the image.');
  return parts.join('\n\n');
}
module.exports = { ASSETS: ASSETS, GROUPS: GROUPS, STYLE: STYLE, compose: compose };
