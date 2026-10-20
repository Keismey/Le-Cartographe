/* Le Cartographe — données des contrées (contrées 1 à 8).
   Repère : x → est, y → nord, carte 0–100. 1 journée = scale unités. */
(function (root) {
  'use strict';

  /* petits utilitaires pour écrire les contrées 3 à 8 */
  function T(fr, en) { return { fr: fr, en: en }; }
  function S(k, o, fr, en) { o.k = k; o.text = T(fr, en); return o; }
  function Wt(id, emoji, nameFr, nameEn, jobFr, jobEn, traitFr, traitEn, statements, replyFr, replyEn, askSt, extra) {
    var w = { id: id, emoji: emoji, name: T(nameFr, nameEn), job: T(jobFr, jobEn), trait: T(traitFr, traitEn), statements: statements };
    if (askSt) w.ask = { reply: T(replyFr, replyEn), st: askSt };
    extra = extra || {};
    for (var k in extra) w[k] = extra[k];
    return w;
  }

  var LEVELS = [

    /* ───────────── 1 · La Vallée des Trois Meuniers (tuto) ───────────── */
    {
      id: 1, scene: 'moulins',
      title: { fr: 'La Vallée des Trois Meuniers', en: 'The Valley of the Three Millers' },
      scale: 20, tol: { ok: 12, near: 20 }, tokens: { ask: 2, scout: 1 },
      king: {
        fr: 'Orlan est parti sans prévenir. Vous reprenez ses cartes. Et ses secrets, peut-être.\n\n« Trois moulins nourrissent ma capitale. Où sont-ils ? »',
        en: 'Orlan left without a word. You take over his maps. And his secrets, perhaps.\n\n"Three mills feed my capital. Where are they?"'
      },
      hint: {
        fr: 'La Rivière Menue descend des collines du nord-ouest vers le sud-est, en passant par les trois moulins.',
        en: 'The Menue River flows from the northwest hills to the southeast, past all three mills.'
      },
      terrain: [
        { k: 'mountain', c: [4, 91], r: [24, 9], rot: -38 }, { k: 'mountain', c: [18, 99], r: [18, 7], rot: -8 }, { k: 'mountain', c: [1, 72], r: [8, 15], rot: 8 },
        { k: 'mountain', c: [99, 19], r: [11, 23], rot: 14 }, { k: 'mountain', c: [88, 3], r: [17, 8], rot: -18 }, { k: 'mountain', c: [101, 42], r: [6, 12], rot: 0 },
        { k: 'field', c: [79, 61], r: [14, 8], rot: 18 }, { k: 'field', c: [62, 82], r: [11, 7], rot: -10 }, { k: 'field', c: [29, 44], r: [10, 7], rot: 25 },
        { k: 'forest', c: [91, 87], r: [14, 11] }, { k: 'forest', c: [20, 16], r: [19, 12], rot: 10 }, { k: 'forest', c: [48, 8], r: [12, 7] }
      ],
      places: [
        { id: 'moulin_haut',   type: 'moulin',  name: { fr: 'Moulin Haut',         en: 'Upper Mill' },   truth: [20, 75] },
        { id: 'moulin_milieu', type: 'moulin',  name: { fr: 'Moulin Milieu',       en: 'Middle Mill' },  truth: [45, 55] },
        { id: 'moulin_bas',    type: 'moulin',  name: { fr: 'Moulin Bas',          en: 'Lower Mill' },   truth: [72, 38] },
        { id: 'pont',          type: 'pont',    name: { fr: 'Pont du Gué',         en: 'Ford Bridge' },  truth: [46, 45] },
        { id: 'auberge',       type: 'auberge', name: { fr: 'Auberge du Meunier',  en: "Miller's Inn" }, truth: [70, 70] }
      ],
      paths: [
        { id: 'riviere', type: 'river', name: { fr: 'Rivière Menue', en: 'Menue River' },
          truth: [[5, 85], [20, 75], [45, 55], [46, 45], [60, 40], [72, 38], [95, 25]] }
      ],
      witnesses: [
        {
          id: 'odo', emoji: '👨‍🌾', name: { fr: 'Maître Odo', en: 'Master Odo' }, job: { fr: 'Meunier', en: 'Miller' },
          trait: { fr: 'Connaît sa vallée comme sa poche. Fiable.', en: 'Knows his valley like the back of his hand. Reliable.' },
          statements: [
            { k: 'rel', a: 'moulin_haut', b: 'moulin_milieu', cap: 'NW', j: 1.5,
              text: { fr: 'Mon Moulin Haut est à un jour et demi au nord-ouest du Milieu.', en: 'My Upper Mill is a day and a half northwest of the Middle one.' } },
            { k: 'rel', a: 'moulin_bas', b: 'moulin_milieu', cap: 'SE', j: 1.5,
              text: { fr: 'Le Moulin Bas est au sud-est du Milieu, à un jour et demi.', en: 'The Lower Mill is southeast of the Middle one, a day and a half away.' } },
            { k: 'cross', a: ['moulin_haut', 'moulin_milieu', 'moulin_bas'], path: 'riviere',
              text: { fr: 'La Rivière Menue passe par mes trois moulins.', en: 'The Menue River runs past all three of my mills.' } }
          ],
          ask: {
            reply: { fr: 'Le pont ? Deux journées au sud-est de mon Moulin Haut, pas moins.', en: 'The bridge? Two days southeast of my Upper Mill, no less.' },
            st: { k: 'rel', a: 'pont', b: 'moulin_haut', cap: 'SE', j: 2,
              text: { fr: 'Le pont est à deux journées au sud-est du Moulin Haut.', en: 'The bridge is two days southeast of the Upper Mill.' } }
          }
        },
        {
          id: 'bartolo', emoji: '🧔', name: { fr: 'Bartolo', en: 'Bartolo' }, job: { fr: 'Marchand', en: 'Merchant' },
          bias: { dist: 1.3 },
          trait: { fr: 'Exagère les distances (environ +30 %). Fiable sur les routes.', en: 'Exaggerates distances (about +30%). Reliable on roads.' },
          statements: [
            { k: 'rel', a: 'moulin_bas', b: 'moulin_milieu', j: 2,
              text: { fr: 'Du Milieu au Bas, deux bonnes journées !', en: 'From the Middle Mill to the Lower one, two good days!' } },
            { k: 'rel', a: 'auberge', b: 'moulin_milieu', cap: 'NE',
              text: { fr: "Pour aller à l'auberge, depuis le Milieu, on monte vers le nord-est.", en: 'To reach the inn from the Middle Mill, you head northeast.' } }
          ],
          ask: {
            reply: { fr: "Bon, bon… une journée et demie jusqu'à l'auberge, sans exagérer.", en: 'Fine, fine… a day and a half to the inn, no exaggeration.' },
            st: { k: 'rel', a: 'auberge', b: 'moulin_milieu', j: 1.5, exact: true,
              text: { fr: "L'auberge est à une journée et demie du Moulin Milieu.", en: 'The inn is a day and a half from the Middle Mill.' } }
          }
        },
        {
          id: 'pip', emoji: '🧒', name: { fr: 'Pip', en: 'Pip' }, job: { fr: 'Enfant du village', en: 'Village child' },
          trait: { fr: 'Naïf, confond parfois la gauche et la droite. Fiable de près.', en: 'Naive, sometimes mixes up left and right. Reliable up close.' },
          statements: [
            { k: 'rel', a: 'pont', b: 'moulin_milieu', cap: 'S', near: true,
              text: { fr: 'Le pont, c’est juste en dessous du Moulin Milieu, tout près !', en: 'The bridge is right below the Middle Mill, really close!' } }
          ],
          ask: {
            reply: { fr: 'Il y a une planche qui traverse la rivière : c’est ça, le pont !', en: "There's a plank across the river: that's the bridge!" },
            st: { k: 'cross', a: 'pont', path: 'riviere',
              text: { fr: 'Le pont enjambe la rivière.', en: 'The bridge crosses the river.' } }
          }
        },
        {
          id: 'odile', emoji: '👵', name: { fr: 'Tante Odile', en: 'Aunt Odile' }, job: { fr: 'Tante du meunier', en: "The miller's aunt" },
          trait: { fr: 'Un peu confuse : elle s’embrouille parfois.', en: 'A bit confused: she sometimes gets muddled.' },
          statements: [
            { k: 'rel', a: 'auberge', b: 'moulin_milieu', cap: 'W', wrong: true,
              text: { fr: 'L’auberge ? À l’ouest du Moulin Milieu, bien sûr.', en: 'The inn? West of the Middle Mill, of course.' } }
          ],
          ask: {
            reply: { fr: 'Oh… mes gauches et mes droites ! L’auberge est à l’EST, pardon, pardon.', en: 'Oh… my lefts and rights! The inn is to the EAST, sorry, sorry.' },
            st: { k: 'rel', a: 'auberge', b: 'moulin_milieu', cap: 'E',
              text: { fr: 'L’auberge est à l’est du Moulin Milieu.', en: 'The inn is east of the Middle Mill.' } }
          },
          why: {
            fr: 'Tante Odile confond l’ouest et l’est depuis l’enfance. Aucune malice : juste une vieille habitude.',
            en: 'Aunt Odile has mixed up east and west since childhood. No malice, just an old habit.'
          }
        }
      ],
      faulty: ['odile'],
      scouts: [
        { k: 'rel', a: 'auberge', b: 'moulin_milieu', cap: 'NE',
          text: { fr: 'L’auberge est bien au nord-est du Moulin Milieu.', en: 'The inn really is northeast of the Middle Mill.' } }
      ],
      outro: { fr: 'Pas mal pour un début. Le royaume vous attend.', en: 'Not bad for a start. The kingdom awaits you.' },
      note:  { fr: 'Cherche toujours deux voix qui s’accordent.', en: 'Always look for two voices that agree.' }
    },

    /* ───────────── 2 · Les Rives du Vieux Gué ───────────── */
    {
      id: 2, scene: 'riviere',
      title: { fr: 'Les Rives du Vieux Gué', en: 'The Banks of the Old Ford' },
      scale: 20, tol: { ok: 12, near: 20 }, tokens: { ask: 2, scout: 1 },
      king: {
        fr: '« La rivière a changé de lit, et les anciennes cartes ne s’accordent plus. Relevez-la pour moi. »',
        en: '"The river has changed its bed, and the old maps no longer agree. Chart it for me."'
      },
      hint: {
        fr: 'La Rivière Vieille descend du nord, passe au Pont Cassé puis au Gué, et file vers le sud-est.',
        en: 'The Old River flows down from the north, past the Broken Bridge and the Ford, then runs southeast.'
      },
      terrain: [
        { k: 'mountain', c: [58, 101], r: [28, 8], rot: 4 }, { k: 'mountain', c: [88, 95], r: [14, 9], rot: -20 },
        { k: 'water', c: [80, -3], r: [22, 9], rot: -12 },
        { k: 'marsh', c: [60, 54], r: [7, 11], rot: 12 }, { k: 'marsh', c: [43, 33], r: [6, 8], rot: -20 },
        { k: 'field', c: [81, 73], r: [13, 9], rot: 14 }, { k: 'field', c: [68, 80], r: [10, 6], rot: -8 },
        { k: 'forest', c: [10, 63], r: [11, 19] }, { k: 'forest', c: [23, 84], r: [15, 9], rot: 10 }, { k: 'forest', c: [93, 40], r: [8, 14] },
        { k: 'hill', c: [68, 12], r: [15, 8], rot: 8 }, { k: 'hill', c: [34, 14], r: [10, 6] }
      ],
      places: [
        { id: 'gue',        type: 'gue',        name: { fr: 'Gué',                   en: 'Ford' },            truth: [50, 45] },
        { id: 'saule',      type: 'village',    name: { fr: 'Village de Saule',      en: 'Saule Village' },   truth: [30, 60] },
        { id: 'ferme',      type: 'ferme',      name: { fr: 'Ferme des Roseaux',     en: 'Reed Farm' },       truth: [75, 65] },
        { id: 'chapelle',   type: 'chapelle',   name: { fr: 'Chapelle Sainte-Anne',  en: "St Anne's Chapel" }, truth: [60, 20] },
        { id: 'tannerie',   type: 'tannerie',   name: { fr: 'Tannerie',              en: 'Tannery' },         truth: [20, 30] },
        { id: 'pont_casse', type: 'pont_casse', name: { fr: 'Pont Cassé',            en: 'Broken Bridge' },   truth: [50, 70] }
      ],
      paths: [
        { id: 'riviere', type: 'river', name: { fr: 'Rivière Vieille', en: 'Old River' },
          truth: [[55, 90], [50, 70], [50, 45], [62, 25], [70, 5]] }
      ],
      witnesses: [
        {
          id: 'gaspard', emoji: '🎣', name: { fr: 'Gaspard', en: 'Gaspard' }, job: { fr: 'Pêcheur', en: 'Fisherman' },
          trait: { fr: 'Connaît l’eau mieux que personne. Fiable sur les rivières.', en: 'Knows the water better than anyone. Reliable on rivers.' },
          statements: [
            { k: 'side', a: 'saule', path: 'riviere', cap: 'W',
              text: { fr: 'Saule est sur la rive ouest de la rivière.', en: 'Saule is on the west bank of the river.' } },
            { k: 'rel', a: 'saule', b: 'gue', j: 1, approx: true,
              text: { fr: 'Saule est à environ une journée du gué.', en: 'Saule is about a day from the ford.' } },
            { k: 'cross', a: 'gue', path: 'riviere',
              text: { fr: 'Le gué, c’est là où je pêche : en plein sur la rivière.', en: "The ford is where I fish: right on the river." } }
          ],
          ask: {
            reply: { fr: 'La crue de l’an 12 a tout déplacé. Mais Saule, elle, est au nord-ouest du gué.', en: 'The flood of year 12 moved everything. But Saule is northwest of the ford.' },
            st: { k: 'rel', a: 'saule', b: 'gue', cap: 'NW',
              text: { fr: 'Saule est au nord-ouest du gué.', en: 'Saule is northwest of the ford.' } }
          }
        },
        {
          id: 'rufus', emoji: '💂', name: { fr: 'Rufus', en: 'Rufus' }, job: { fr: 'Soldat', en: 'Soldier' },
          trait: { fr: 'Caps exacts, distances à la lieue. Fiable.', en: 'Exact bearings, distances by the league. Reliable.' },
          statements: [
            { k: 'rel', a: 'chapelle', b: 'gue', cap: 'SE', j: 1, jmin: true,
              text: { fr: 'La chapelle est au sud-est du gué, à plus d’une journée.', en: 'The chapel is southeast of the ford, more than a day away.' } },
            { k: 'rel', a: 'tannerie', b: 'saule', cap: 'S', j: 1.5,
              text: { fr: 'La tannerie est au sud de Saule, à une journée et demie.', en: 'The tannery is south of Saule, a day and a half away.' } },
            { k: 'rel', a: 'ferme', b: 'pont_casse', cap: 'E', j: 1.25,
              text: { fr: 'La ferme est à l’est du Pont Cassé, à un peu plus d’une journée.', en: 'The farm is east of the Broken Bridge, a little over a day away.' } },
            { k: 'rel', a: 'tannerie', b: 'gue', cap: 'SW', j: 1.75, approx: true,
              text: { fr: 'La tannerie est au sud-ouest du gué, à environ une journée trois quarts.', en: 'The tannery is southwest of the ford, about a day and three quarters away.' } },
            { k: 'rel', a: 'chapelle', b: 'tannerie', cap: 'E', j: 2, approx: true,
              text: { fr: 'De la tannerie, la chapelle est à l’est, à peu près deux journées.', en: 'From the tannery, the chapel is east, roughly two days away.' } }
          ],
          ask: {
            reply: { fr: 'Pour être précis : la chapelle est à une journée et quart du gué.', en: 'To be precise: the chapel is a day and a quarter from the ford.' },
            st: { k: 'rel', a: 'chapelle', b: 'gue', j: 1.25, exact: true,
              text: { fr: 'La chapelle est à une journée et quart du gué.', en: 'The chapel is a day and a quarter from the ford.' } }
          }
        },
        {
          id: 'bartolo', emoji: '🧔', name: { fr: 'Bartolo', en: 'Bartolo' }, job: { fr: 'Marchand', en: 'Merchant' },
          bias: { dist: 1.3 },
          trait: { fr: 'Exagère les distances (environ +30 %). Fiable sur les routes.', en: 'Exaggerates distances (about +30%). Reliable on roads.' },
          statements: [
            { k: 'rel', a: 'pont_casse', b: 'gue', cap: 'N', j: 1.5,
              text: { fr: 'Le pont cassé est au nord du gué, une journée et demie !', en: 'The broken bridge is north of the ford, a day and a half!' } },
            { k: 'cross', a: 'pont_casse', path: 'riviere',
              text: { fr: 'Le pont cassé, c’est sur la rivière, forcément !', en: 'The broken bridge is on the river, obviously!' } },
            { k: 'rel', a: 'ferme', b: 'gue', j: 2, approx: true,
              text: { fr: 'De la ferme au gué, deux bonnes journées de route, je vous le dis !', en: 'From the farm to the ford, a good two days on the road, I tell you!' } }
          ],
          ask: {
            reply: { fr: 'Bon… une journée et quart, si on ne compte pas les ornières.', en: 'Well… a day and a quarter, if you leave out the ruts.' },
            st: { k: 'rel', a: 'pont_casse', b: 'gue', j: 1.25, exact: true,
              text: { fr: 'Le pont cassé est à une journée et quart du gué.', en: 'The broken bridge is a day and a quarter from the ford.' } }
          }
        },
        {
          id: 'pip', emoji: '🧒', name: { fr: 'Pip', en: 'Pip' }, job: { fr: 'Enfant', en: 'Child' },
          trait: { fr: 'Naïf, confond parfois la gauche et la droite. Fiable de près.', en: 'Naive, sometimes mixes up left and right. Reliable up close.' },
          statements: [
            { k: 'opp', a: 'ferme', b: 'saule', path: 'riviere',
              text: { fr: 'La ferme est de l’autre côté de la rivière par rapport au village.', en: 'The farm is on the other side of the river from the village.' } },
            { k: 'cross', a: 'chapelle', path: 'riviere', r: 8,
              text: { fr: 'La chapelle est tout près de la rivière !', en: 'The chapel is really close to the river!' } }
          ],
          ask: {
            reply: { fr: 'La ferme ? En haut à droite du gué ! Euh… au nord-est.', en: 'The farm? Up and to the right of the ford! Er… northeast.' },
            st: { k: 'rel', a: 'ferme', b: 'gue', cap: 'NE',
              text: { fr: 'La ferme est au nord-est du gué.', en: 'The farm is northeast of the ford.' } }
          }
        },
        {
          id: 'hermance', emoji: '👩‍🦳', name: { fr: 'Hermance', en: 'Hermance' }, job: { fr: 'Vieille sage', en: 'Old sage' },
          trait: { fr: 'Se souvient d’avant. Ses souvenirs datent peut-être.', en: 'Remembers the old days. Her memories may be out of date.' },
          statements: [
            { k: 'side', a: 'saule', path: 'riviere', cap: 'E', wrong: true,
              text: { fr: 'De mon temps, la rivière passait à l’ouest de Saule, pas à l’est.', en: 'In my day the river ran west of Saule, not east.' } },
            { k: 'cross', a: 'gue', path: 'riviere',
              text: { fr: 'Le gué n’a jamais bougé : la rivière passe toujours par là.', en: 'The ford has never moved: the river still runs through it.' } }
          ],
          ask: {
            reply: { fr: 'Ah… je décrivais l’ancien lit. Oui, aujourd’hui Saule est bien sur la rive ouest.', en: 'Ah… I was describing the old bed. Yes, today Saule is on the west bank.' },
            st: { k: 'side', a: 'saule', path: 'riviere', cap: 'W',
              text: { fr: 'Aujourd’hui, Saule est sur la rive ouest.', en: 'Today, Saule is on the west bank.' } }
          },
          why: {
            fr: 'Hermance décrivait l’ancien lit de la rivière, d’avant la crue de l’an 12. Sa mémoire n’ment pas : elle est simplement périmée.',
            en: "Hermance described the river's old bed, from before the flood of year 12. Her memory isn't lying: it's just out of date."
          }
        }
      ],
      faulty: ['hermance'],
      scouts: [
        { k: 'side', a: 'saule', path: 'riviere', cap: 'W',
          text: { fr: 'Saule est bien à l’ouest de la rivière.', en: 'Saule really is west of the river.' } }
      ],
      outro: { fr: 'Les rivières mentent plus que les hommes, dit-on.', en: 'Rivers lie more than men, they say.' },
      note:  { fr: 'Là où l’eau change de lit, la mémoire vieillit.', en: 'Where water changes its bed, memory grows old.' }
    },

    /* ───────────── 3 · La Côte des Brumes ───────────── */
    {
      id: 3, scene: 'falaise', fog: true,
      title: T('La Côte des Brumes', 'The Misty Coast'),
      scale: 20, tol: { ok: 12, near: 20 }, tokens: { ask: 3, scout: 2 },
      king: T('« Mes navires se perdent dans la brume. Relevez-moi cette côte, du phare à la falaise. »', '"My ships keep getting lost in the fog. Chart this coast for me, from the lighthouse to the cliff."'),
      hint: T('La côte longe la mer à l’est, du sud au nord. Dans la brume, on donne les directions « à peu près ».', 'The coast runs along the sea to the east, from south to north. In the fog, directions are only given “roughly”.'),
      terrain: [
        { k: 'water', c: [102, 24], r: [20, 30], rot: 4 }, { k: 'water', c: [97, 90], r: [14, 16], rot: -10 },
        { k: 'sand', c: [80, 40], r: [3.5, 13], rot: 4 }, { k: 'sand', c: [80, 12], r: [4, 8] },
        { k: 'marsh', c: [28, 22], r: [13, 9], rot: -12 }, { k: 'hill', c: [45, 50], r: [10, 7], rot: 10 }, { k: 'hill', c: [30, 52], r: [8, 6] },
        { k: 'forest', c: [20, 72], r: [14, 15] }, { k: 'field', c: [55, 80], r: [12, 8], rot: 6 }, { k: 'mountain', c: [12, 97], r: [22, 8] }, { k: 'field', c: [62, 30], r: [9, 8] }
      ],
      places: [
        { id: 'port',     type: 'port',     name: T('Port-Brume', 'Mist Harbour'),       truth: [75, 40] },
        { id: 'phare',    type: 'phare',    name: T('Phare du Cap', 'Cape Lighthouse'),  truth: [88, 65] },
        { id: 'falaise',  type: 'falaise',  name: T('Falaise Blanche', 'White Cliff'),   truth: [80, 15] },
        { id: 'crique',   type: 'crique',   name: T('Crique aux Pins', 'Pine Cove'),     truth: [72, 88] },
        { id: 'hautmur',  type: 'pierres',  name: T('Haut-Mur', 'High Wall'),            truth: [45, 50] },
        { id: 'naufrage', type: 'auberge',  name: T('Auberge du Naufrage', 'Shipwreck Inn'), truth: [60, 55] },
        { id: 'marais',   type: 'marais',   name: T('Marais Gris', 'Grey Marsh'),        truth: [30, 25] },
        { id: 'cailloux', type: 'rochers',  name: T('Cailloux Blancs', 'White Rocks'),   truth: [95, 30] }
      ],
      paths: [
        { id: 'cote', type: 'coast', name: T('La Côte', 'The Coast'), truth: [[80, 100], [75, 88], [85, 70], [80, 50], [78, 30], [82, 10]] }
      ],
      witnesses: [
        Wt('yann', '⚓', 'Yann', 'Yann', 'Marin', 'Sailor', 'Lit les côtes comme d’autres lisent un livre. Fiable.', 'Reads coastlines like others read books. Reliable.', [
          S('rel', { a: 'crique', b: 'phare', cap: 'N', angTol: 50 }, 'La crique est à peu près au nord du phare.', 'The cove is roughly north of the lighthouse.'),
          S('rel', { a: 'falaise', b: 'port', cap: 'S', j: 1.25 }, 'La falaise est au sud du port, à une journée et quart.', 'The cliff is south of the harbour, a day and a quarter away.'),
          S('cross', { a: ['crique', 'phare', 'falaise', 'port'], path: 'cote' }, 'Crique, phare, falaise, port : tout est au bord de l’eau.', 'Cove, lighthouse, cliff, harbour: all of them sit on the shore.')
        ], 'Du phare au port, une journée et deux cinquièmes, cap au sud-ouest.', 'From the lighthouse to the harbour: a day and two fifths, heading southwest.',
        S('rel', { a: 'port', b: 'phare', cap: 'SW', j: 1.4, exact: true }, 'Le port est à une journée et deux cinquièmes du phare, au sud-ouest.', 'The harbour is a day and two fifths from the lighthouse, to the southwest.')),
        Wt('lise', '🔭', 'Lise', 'Lise', 'Guetteuse', 'Lookout', 'Voit loin, même dans la brume. Fiable.', 'Sees far, even through fog. Reliable.', [
          S('rel', { a: 'cailloux', b: 'phare', cap: 'SE', angTol: 50 }, 'Les Cailloux Blancs sont environ au sud-est du phare.', 'The White Rocks lie roughly southeast of the lighthouse.'),
          S('rel', { a: 'port', b: 'phare', cap: 'S', j: 1.5, approx: true, angTol: 50 }, 'Du phare, le port est à peu près au sud, dans les une journée et demie.', 'From the lighthouse, the harbour is roughly south, about a day and a half away.')
        ], 'Les Cailloux ? À une journée trois quarts du phare, pas moins.', 'The Rocks? A day and three quarters from the lighthouse, no less.',
        S('rel', { a: 'cailloux', b: 'phare', j: 1.75, exact: true }, 'Les Cailloux Blancs sont à une journée trois quarts du phare.', 'The White Rocks are a day and three quarters from the lighthouse.')),
        Wt('marcos', '🕶️', 'Marcos', 'Marcos', 'Contrebandier', 'Smuggler', 'Sait tout de la côte… et n’en dit pas tout.', 'Knows the whole coast… and doesn’t tell it all.', [
          S('rel', { a: 'phare', b: 'port', cap: 'NE', angTol: 50 }, 'Le phare est au nord-est du port, pas loin.', 'The lighthouse is northeast of the harbour, not far.'),
          S('rel', { a: 'crique', b: 'falaise', cap: 'S', near: true, r: 20, wrong: true }, 'La crique ? Tout près de la falaise, juste au sud. Rien à voir.', 'The cove? Right by the cliff, just to the south. Nothing to see.')
        ], 'Bon… la crique est au nord-ouest du phare, à une journée quatre dixièmes. Ne dites pas que c’est moi.', 'Fine… the cove is northwest of the lighthouse, a day and four tenths away. Don’t say it was me.',
        S('rel', { a: 'crique', b: 'phare', cap: 'NW', j: 1.4, exact: true }, 'La crique est au nord-ouest du phare, à une journée et deux cinquièmes.', 'The cove is northwest of the lighthouse, a day and two fifths away.'),
        { why: T('Marcos cache sa crique : c’est là qu’il débarque sa contrebande. En la plaçant près de la falaise, il détourne les regards.', 'Marcos is hiding his cove: it is where he lands his contraband. By putting it near the cliff he steers eyes away.') }),
        Wt('brigitte', '🍺', 'Brigitte', 'Brigitte', 'Aubergiste', 'Innkeeper', 'Connaît tous les voyageurs, et toutes leurs routes.', 'Knows every traveller, and every route they take.', [
          S('rel', { a: 'naufrage', b: 'port', cap: 'NW', j: 1 }, 'Mon auberge est au nord-ouest du port, à une journée.', 'My inn is northwest of the harbour, a day away.'),
          S('rel', { a: 'marais', b: 'naufrage', cap: 'SW', j: 2 }, 'Du Naufrage, le Marais Gris est au sud-ouest, à deux journées.', 'From the Shipwreck, the Grey Marsh is southwest, two days away.')
        ], 'Du port au Marais Gris, plein ouest, deux journées et deux cinquièmes.', 'From the harbour to the Grey Marsh, due west, two days and two fifths.',
        S('rel', { a: 'marais', b: 'port', cap: 'W', j: 2.4, exact: true }, 'Le Marais Gris est à l’ouest du port, à deux journées et deux cinquièmes.', 'The Grey Marsh is west of the harbour, two days and two fifths away.')),
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau. Fiable.', 'Measures everything with a line. Reliable.', [
          S('rel', { a: 'hautmur', b: 'marais', cap: 'N', angTol: 50 }, 'Haut-Mur est à peu près au nord du Marais Gris.', 'High Wall is roughly north of the Grey Marsh.'),
          S('rel', { a: 'hautmur', b: 'naufrage', cap: 'W', j: .75 }, 'Haut-Mur est à l’ouest de l’auberge, trois quarts de journée.', 'High Wall is west of the inn, three quarters of a day.')
        ], 'Du marais à Haut-Mur, une journée et demie à vol d’oiseau.', 'From the marsh to High Wall, a day and a half as the crow flies.',
        S('rel', { a: 'hautmur', b: 'marais', j: 1.5, exact: true }, 'Haut-Mur est à une journée et demie du Marais Gris.', 'High Wall is a day and a half from the Grey Marsh.')),
        Wt('pip', '🧒', 'Pip', 'Pip', 'Enfant', 'Child', 'Naïf, mais il ne rate rien de ce qui est près de lui.', 'Naive, but he misses nothing close to him.', [
          S('rel', { a: 'cailloux', b: 'port', cap: 'E', j: 1, approx: true }, 'Les Cailloux, c’est à l’est du port. À peu près une journée !', 'The Rocks are east of the harbour. About a day!')
        ], 'Les Cailloux ? En haut à droite de la falaise !', 'The Rocks? Up and to the right of the cliff!',
        S('rel', { a: 'cailloux', b: 'falaise', cap: 'NE' }, 'Les Cailloux sont au nord-est de la falaise.', 'The Rocks are northeast of the cliff.'))
      ],
      faulty: ['marcos'],
      scouts: [
        S('rel', { a: 'crique', b: 'port', cap: 'N', j: 2.4, exact: true }, 'La crique est plein nord du port, à deux journées et deux cinquièmes.', 'The cove is due north of the harbour, two days and two fifths away.'),
        S('rel', { a: 'hautmur', b: 'port', cap: 'W', j: 1.6, approx: true }, 'Haut-Mur est à l’ouest du port, à une journée et demie, environ.', 'High Wall is west of the harbour, a day and a half or so.')
      ],
      outro: T('La brume se lève. La côte est enfin à nous.', 'The fog lifts. The coast is ours at last.'),
      note:  T('Où la brume monte, un secret se couche.', 'Where the fog rises, a secret lies down.')
    },

    /* ───────────── 4 · Le Pays des Mille Collines ───────────── */
    {
      id: 4, scene: 'paturage',
      title: T('Le Pays des Mille Collines', 'The Land of a Thousand Hills'),
      scale: 20, tol: { ok: 10, near: 18 }, tokens: { ask: 3, scout: 2 },
      king: T('« Mes bergers se disputent pâturages et sources. Fixez-moi leurs limites, une bonne fois. »', '"My shepherds squabble over pastures and springs. Settle their boundaries once and for all."'),
      hint: T('Le Chemin des Crêtes relie la Tour, la Source, le Col et le Mont. Certains témoins ne savent que l’ordre dans lequel on les croise.', 'The Ridge Path links the Tower, the Spring, the Pass and the Mount. Some witnesses only know the order in which one meets them.'),
      terrain: [
        { k: 'mountain', c: [50, 99], r: [24, 9], rot: 2 }, { k: 'hill', c: [50, 72], r: [12, 10], rot: 10 }, { k: 'hill', c: [30, 52], r: [10, 8], rot: -14 },
        { k: 'hill', c: [70, 18], r: [14, 8], rot: 8 }, { k: 'hill', c: [88, 38], r: [8, 10] }, { k: 'hill', c: [12, 80], r: [10, 8] },
        { k: 'water', c: [88, 62], r: [9, 8], rot: 20 }, { k: 'forest', c: [78, 31], r: [8, 8] }, { k: 'field', c: [15, 35], r: [10, 9], rot: 12 },
        { k: 'field', c: [65, 48], r: [9, 7] }, { k: 'field', c: [38, 22], r: [9, 7], rot: -10 }
      ],
      places: [
        { id: 'mont',      type: 'montagne',   name: T('Mont Aiguillon', 'Mount Aiguillon'), truth: [50, 80] },
        { id: 'col',       type: 'col',        name: T('Col du Vent', 'Windy Pass'),          truth: [35, 60] },
        { id: 'bergerie',  type: 'ferme',      name: T('Grande Bergerie', 'Great Sheepfold'), truth: [65, 65] },
        { id: 'hameau',    type: 'village',    name: T('Hameau des Brebis', 'Sheep Hamlet'),  truth: [20, 40] },
        { id: 'source',    type: 'source',     name: T('Source Claire', 'Clear Spring'),      truth: [45, 45] },
        { id: 'bois',      type: 'bois_clair', name: T('Bois Clair', 'Light Wood'),           truth: [75, 35] },
        { id: 'tour',      type: 'tour',       name: T('Tour du Guet', 'Watchtower'),         truth: [55, 15] },
        { id: 'lac',       type: 'lac',        name: T('Lac Miroir', 'Mirror Lake'),          truth: [85, 60] }
      ],
      paths: [
        { id: 'cretes', type: 'trail', name: T('Chemin des Crêtes', 'Ridge Path'), truth: [[55, 15], [45, 45], [35, 60], [50, 80]] }
      ],
      witnesses: [
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau. Fiable.', 'Measures everything with a line. Reliable.', [
          S('order', { list: ['tour', 'source', 'col', 'mont'], axis: 'N' }, 'En remontant vers le nord, on croise la Tour, la Source, le Col, puis le Mont.', 'Heading north, you meet the Tower, the Spring, the Pass, then the Mount.'),
          S('rel', { a: 'lac', b: 'bergerie', cap: 'E', j: 1 }, 'Le lac est à l’est de la Grande Bergerie, à une journée.', 'The lake is east of the Great Sheepfold, a day away.')
        ], 'Du Lac à la Source : deux journées et un dixième, plein est.', 'From the Lake to the Spring: two days and a tenth, due east.',
        S('rel', { a: 'lac', b: 'source', cap: 'E', j: 2.1, exact: true }, 'Le lac est à l’est de la Source, à deux journées et un dixième.', 'The lake is east of the Spring, two days and a tenth away.')),
        Wt('rufus', '💂', 'Rufus', 'Rufus', 'Soldat', 'Soldier', 'Caps exacts, distances à la lieue. Fiable.', 'Exact bearings, distances by the league. Reliable.', [
          S('rel', { a: 'tour', b: 'mont', cap: 'S', j: 3 }, 'La Tour est au sud du Mont, à trois journées.', 'The Tower is south of the Mount, three days away.'),
          S('rel', { a: 'col', b: 'source', cap: 'NW' }, 'Le Col est au nord-ouest de la Source.', 'The Pass is northwest of the Spring.'),
          S('rel', { a: 'bergerie', b: 'col', cap: 'E', j: 1.5 }, 'La Bergerie est à l’est du Col, à une journée et demie.', 'The Sheepfold is east of the Pass, a day and a half away.')
        ], 'De la Source au Col : presque une journée, neuf dixièmes.', 'From the Spring to the Pass: nearly a day, nine tenths.',
        S('rel', { a: 'col', b: 'source', j: .9, exact: true }, 'Le Col est à neuf dixièmes de journée de la Source.', 'The Pass is nine tenths of a day from the Spring.')),
        Wt('bartolo', '🧔', 'Bartolo', 'Bartolo', 'Marchand', 'Merchant', 'Exagère les distances (environ +30 %). Fiable sur les routes.', 'Exaggerates distances (about +30%). Reliable on roads.', [
          S('rel', { a: 'col', b: 'source', j: 1.2 }, 'Du Col à la Source, une bonne journée et quart, je vous le jure !', 'From the Pass to the Spring, a good day and a quarter, I swear!'),
          S('rel', { a: 'hameau', b: 'col', cap: 'SW', j: 1.6, approx: true }, 'Le hameau, au sud-ouest du Col, une journée et demie de marche !', 'The hamlet, southwest of the Pass, a day and a half of walking!')
        ], 'Bon… de la Source à la Bergerie, une journée et deux cinquièmes.', 'Well… from the Spring to the Sheepfold, a day and two fifths.',
        S('rel', { a: 'bergerie', b: 'source', cap: 'NE', j: 1.4, exact: true }, 'La Bergerie est au nord-est de la Source, à une journée et deux cinquièmes.', 'The Sheepfold is northeast of the Spring, a day and two fifths away.')),
        Wt('gil', '🏹', 'Gil', 'Gil', 'Chasseur', 'Hunter', 'Connaît chaque sentier… et chaque coin de chasse qu’il garde pour lui.', 'Knows every trail… and every hunting ground he keeps to himself.', [
          S('cross', { a: ['tour', 'col'], path: 'cretes' }, 'Le Chemin des Crêtes passe par la Tour et par le Col.', 'The Ridge Path runs through the Tower and the Pass.'),
          S('rel', { a: 'lac', b: 'tour', cap: 'S', wrong: true }, 'Le Lac Miroir ? Au sud de la Tour, c’est tout droit.', 'Mirror Lake? South of the Tower, straight ahead.')
        ], 'Le lac est au nord-est du bois. Voilà, vous êtes contents ?', 'The lake is northeast of the wood. There, are you happy?',
        S('rel', { a: 'lac', b: 'bois', cap: 'NE' }, 'Le lac est au nord-est du Bois Clair.', 'The lake is northeast of the Light Wood.'),
        { why: T('Gil protège ses coins de chasse autour du lac : en l’envoyant au sud de la Tour, il écarte les curieux de ses terres.', 'Gil protects his hunting grounds around the lake: sending people south of the Tower keeps the curious off his land.') }),
        Wt('hermance', '👩‍🦳', 'Hermance', 'Hermance', 'Vieille sage', 'Old sage', 'Se souvient d’avant. Rarement en défaut sur les collines.', 'Remembers the old days. Rarely wrong about hills.', [
          S('rel', { a: 'bergerie', b: 'mont', cap: 'SE', j: 1, approx: true }, 'La Bergerie est au sud-est du Mont, à peu près une journée.', 'The Sheepfold is southeast of the Mount, about a day away.'),
          S('cross', { a: ['col', 'mont'], path: 'cretes' }, 'Le chemin des Crêtes escalade le Col puis atteint le Mont.', 'The Ridge Path climbs the Pass then reaches the Mount.')
        ], 'Le hameau est au sud-ouest du Col, à une journée et quart.', 'The hamlet is southwest of the Pass, a day and a quarter away.',
        S('rel', { a: 'hameau', b: 'col', cap: 'SW', j: 1.25, exact: true }, 'Le hameau est au sud-ouest du Col, à une journée et quart.', 'The hamlet is southwest of the Pass, a day and a quarter away.')),
        Wt('pip', '🧒', 'Pip', 'Pip', 'Enfant', 'Child', 'Naïf, mais il ne rate rien de ce qui est près de lui.', 'Naive, but he misses nothing close to him.', [
          S('rel', { a: 'hameau', b: 'source', cap: 'W', j: 1.25 }, 'Le hameau est à gauche de la Source ! Une journée et quart.', 'The hamlet is to the left of the Spring! A day and a quarter.')
        ], 'Le lac ? À droite de la Bergerie, tout droit !', 'The lake? Right of the Sheepfold, straight on!',
        S('rel', { a: 'lac', b: 'bergerie', cap: 'E' }, 'Le lac est à l’est de la Bergerie.', 'The lake is east of the Sheepfold.')),
        Wt('odo', '👨‍🌾', 'Maître Odo', 'Master Odo', 'Meunier', 'Miller', 'Connaît sa vallée comme sa poche. Fiable.', 'Knows his valley like the back of his hand. Reliable.', [
          S('rel', { a: 'bois', b: 'source', cap: 'E', j: 1.5 }, 'Le Bois Clair est à l’est de la Source, à une journée et demie.', 'The Light Wood is east of the Spring, a day and a half away.')
        ], 'La Tour est au sud de la Source : une journée et demie, et un peu plus.', 'The Tower is south of the Spring: a day and a half, and a bit more.',
        S('rel', { a: 'tour', b: 'source', cap: 'S', j: 1.6, exact: true }, 'La Tour est au sud de la Source, à une journée et six dixièmes.', 'The Tower is south of the Spring, a day and six tenths away.'))
      ],
      faulty: ['gil'],
      scouts: [
        S('rel', { a: 'mont', b: 'col', cap: 'NE' }, 'Le Mont est au nord-est du Col.', 'The Mount is northeast of the Pass.'),
        S('rel', { a: 'lac', b: 'source', j: 2, jmin: true }, 'Le lac est à plus de deux journées de la Source.', 'The lake is more than two days from the Spring.')
      ],
      outro: T('Vous mesurez des montagnes sans les gravir. Impressionnant.', 'You measure mountains without climbing them. Impressive.'),
      note:  T('Le menteur a toujours une raison ; trouve-la.', 'A liar always has a reason; find it.')
    },

    /* ───────────── 5 · La Forêt-Qui-Bouge ───────────── */
    {
      id: 5, scene: 'foret_nuit', night: true,
      title: T('La Forêt-Qui-Bouge', 'The Walking Forest'),
      scale: 20, tol: { ok: 10, near: 18 }, tokens: { ask: 3, scout: 2 },
      king: T('« On dit que ma forêt change de place la nuit. Prouvez-moi que c’est faux, ou dites-moi où elle va. »', '"They say my forest moves at night. Prove it is false, or tell me where it goes."'),
      hint: T('Un seul Sentier traverse la forêt du sud au nord. Les témoins de nuit voient tout à l’envers.', 'A single Trail crosses the forest from south to north. Those who speak at night see everything reversed.'),
      terrain: [
        { k: 'forest', c: [14, 72], r: [14, 20] }, { k: 'forest', c: [86, 78], r: [14, 16] }, { k: 'forest', c: [24, 12], r: [18, 12] },
        { k: 'forest', c: [88, 14], r: [14, 14] }, { k: 'forest', c: [50, 97], r: [22, 8] }, { k: 'forest', c: [4, 40], r: [8, 16] }, { k: 'forest', c: [97, 48], r: [8, 14] },
        { k: 'marsh', c: [24, 34], r: [10, 8], rot: 10 }, { k: 'hill', c: [75, 30], r: [9, 7], rot: 8 }, { k: 'water', c: [60, 93], r: [6, 5] }
      ],
      places: [
        { id: 'clairiere', type: 'prairie',         name: T('Grande Clairière', 'Great Clearing'),  truth: [50, 50] },
        { id: 'chene',     type: 'chene',           name: T('Vieux Chêne', 'Old Oak'),             truth: [30, 70] },
        { id: 'cabane',    type: 'cabane_bucheron', name: T('Cabane du Bûcheron', 'Woodcutter’s Hut'), truth: [70, 70] },
        { id: 'mare',      type: 'mare',            name: T('Mare aux Fées', 'Fairy Pond'),        truth: [25, 35] },
        { id: 'ruines',    type: 'ruines',          name: T('Ruines Moussues', 'Mossy Ruins'),     truth: [75, 30] },
        { id: 'sorciere',  type: 'cabane_sorciere', name: T('Cabane de la Sorcière', 'Witch’s Hut'), truth: [50, 15] },
        { id: 'lisiere',   type: 'bois_clair',      name: T('Lisière Sud', 'Southern Edge'),       truth: [50, 5] },
        { id: 'riviere',   type: 'source',          name: T('Source de la Rivière', 'River Spring'), truth: [60, 90] }
      ],
      paths: [
        { id: 'sentier', type: 'trail', name: T('Le Sentier', 'The Trail'), truth: [[50, 5], [50, 90]] }
      ],
      witnesses: [
        Wt('hugo', '🪓', 'Hugo', 'Hugo', 'Bûcheron', 'Woodcutter', 'Travaille de jour. Fiable tant que le soleil brille.', 'Works by day. Reliable while the sun shines.', [
          S('rel', { a: 'chene', b: 'clairiere', cap: 'NW', day: true }, 'De jour, le Vieux Chêne est au nord-ouest de la clairière.', 'By day, the Old Oak is northwest of the clearing.'),
          S('cross', { a: 'clairiere', path: 'sentier', day: true }, 'De jour, le Sentier traverse la clairière de part en part.', 'By day, the Trail runs straight through the clearing.')
        ], 'Du Chêne à la clairière : une journée et deux cinquièmes.', 'From the Oak to the clearing: a day and two fifths.',
        S('rel', { a: 'chene', b: 'clairiere', j: 1.4, exact: true }, 'Le Vieux Chêne est à une journée et deux cinquièmes de la clairière.', 'The Old Oak is a day and two fifths from the clearing.')),
        Wt('fee', '🧚', 'Fée-Mouche', 'Fly-Fairy', 'Fée', 'Fairy', 'Ne vole que de nuit. Tout lui semble inversé.', 'Only flies at night. Everything looks reversed to her.', [
          S('rel', { a: 'mare', b: 'clairiere', cap: 'E', night: true }, 'De nuit, la Mare aux Fées est à l’est de la clairière.', 'By night, the Fairy Pond lies east of the clearing.')
        ], 'Pour de vrai, de jour : la mare est à l’ouest, à une journée et demie.', 'For real, by day: the pond is to the west, a day and a half away.',
        S('rel', { a: 'mare', b: 'clairiere', cap: 'W', j: 1.5, exact: true }, 'La Mare aux Fées est à l’ouest de la clairière, à une journée et demie.', 'The Fairy Pond is west of the clearing, a day and a half away.')),
        Wt('morgane', '🔮', 'Morgane', 'Morgane', 'Sorcière', 'Witch', 'Règne sur la forêt de nuit. Les points cardinaux la tournent.', 'Rules the forest at night. Cardinal points spin around her.', [
          S('side', { a: 'ruines', path: 'sentier', cap: 'W', night: true }, 'De nuit, les Ruines sont à l’ouest du Sentier.', 'By night, the Ruins lie west of the Trail.'),
          S('rel', { a: 'ruines', b: 'clairiere', cap: 'SW', night: true }, 'De nuit, les Ruines sont au sud-ouest de la clairière.', 'By night, the Ruins lie southwest of the clearing.')
        ], 'De jour, les Ruines sont au sud-est de la clairière, à une journée et six dixièmes.', 'By day, the Ruins are southeast of the clearing, a day and six tenths away.',
        S('rel', { a: 'ruines', b: 'clairiere', cap: 'SE', j: 1.6, exact: true }, 'Les Ruines sont au sud-est de la clairière, à une journée et six dixièmes.', 'The Ruins are southeast of the clearing, a day and six tenths away.')),
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau, mais seulement à la lumière du jour.', 'Measures everything with a line, but only in daylight.', [
          S('rel', { a: 'cabane', b: 'clairiere', cap: 'NE', day: true }, 'De jour, la Cabane du Bûcheron est au nord-est de la clairière.', 'By day, the Woodcutter’s Hut is northeast of the clearing.'),
          S('rel', { a: 'cabane', b: 'chene', cap: 'E', j: 2, day: true }, 'De jour, la cabane est à l’est du Chêne, à deux journées.', 'By day, the hut is east of the Oak, two days away.')
        ], 'De la clairière à la cabane : une journée et deux cinquièmes.', 'From the clearing to the hut: a day and two fifths.',
        S('rel', { a: 'cabane', b: 'clairiere', cap: 'NE', j: 1.4, exact: true }, 'La cabane est au nord-est de la clairière, à une journée et deux cinquièmes.', 'The hut is northeast of the clearing, a day and two fifths away.')),
        Wt('pip', '🧒', 'Pip', 'Pip', 'Enfant', 'Child', 'Se réveille la nuit. Tout lui paraît à l’envers.', 'Wakes up at night. Everything looks backwards to him.', [
          S('rel', { a: 'ruines', b: 'sorciere', cap: 'W', night: true }, 'De nuit, les Ruines sont à gauche de chez la sorcière !', 'By night, the Ruins are to the left of the witch’s place!')
        ], 'En vrai, les Ruines sont tout à droite de la cabane de la sorcière.', 'In truth, the Ruins are way off to the right of the witch’s hut.',
        S('rel', { a: 'ruines', b: 'sorciere', cap: 'E' }, 'Les Ruines sont à l’est de la cabane de la sorcière.', 'The Ruins are east of the witch’s hut.')),
        Wt('rufus', '💂', 'Rufus', 'Rufus', 'Soldat', 'Soldier', 'Caps exacts… quand il fait jour.', 'Exact bearings… when it is daylight.', [
          S('rel', { a: 'riviere', b: 'cabane', cap: 'N', j: 1, jmin: true, day: true }, 'De jour, la Source de la Rivière est au nord de la cabane, à plus d’une journée.', 'By day, the River Spring is north of the hut, more than a day away.'),
          S('rel', { a: 'mare', b: 'chene', cap: 'S', j: 1.75, approx: true, day: true }, 'De jour, la mare est au sud du Chêne, à environ une journée trois quarts.', 'By day, the pond is south of the Oak, about a day and three quarters away.')
        ], 'De la cabane à la Source : une journée et un dixième, plein nord.', 'From the hut to the Spring: a day and a tenth, due north.',
        S('rel', { a: 'riviere', b: 'cabane', cap: 'N', j: 1.1, exact: true }, 'La Source est au nord de la cabane, à une journée et un dixième.', 'The Spring is north of the hut, a day and a tenth away.')),
        Wt('odo', '👨‍🌾', 'Maître Odo', 'Master Odo', 'Meunier', 'Miller', 'Passe par la forêt à midi. Fiable de jour.', 'Crosses the forest at noon. Reliable by day.', [
          S('rel', { a: 'sorciere', b: 'clairiere', cap: 'S', j: 1.75, day: true }, 'De jour, la cabane de la sorcière est au sud de la clairière, à une journée trois quarts.', 'By day, the witch’s hut is south of the clearing, a day and three quarters away.'),
          S('rel', { a: 'lisiere', b: 'sorciere', cap: 'S', j: .5, day: true }, 'De jour, la lisière est juste sous la sorcière : une demi-journée.', 'By day, the edge lies just below the witch: half a day.'),
          S('cross', { a: ['lisiere', 'sorciere'], path: 'sentier', day: true }, 'De jour, le Sentier passe par la lisière et la cabane de la sorcière.', 'By day, the Trail goes through the edge and the witch’s hut.')
        ], 'La clairière est au sud de la Source, à deux journées.', 'The clearing is south of the Spring, two days away.',
        S('rel', { a: 'clairiere', b: 'riviere', cap: 'S', j: 2, exact: true }, 'La clairière est au sud de la Source, à deux journées.', 'The clearing is south of the Spring, two days away.')),
        Wt('hermance', '👩‍🦳', 'Hermance', 'Hermance', 'Vieille sage', 'Old sage', 'Se promène la nuit, la tête tournée à l’envers.', 'Strolls at night, head turned the wrong way.', [
          S('rel', { a: 'chene', b: 'clairiere', cap: 'NE', night: true }, 'De nuit, le Vieux Chêne est au nord-est de la clairière.', 'By night, the Old Oak is northeast of the clearing.'),
          S('rel', { a: 'cabane', b: 'riviere', cap: 'SW', night: true }, 'De nuit, la cabane du bûcheron est au sud-ouest de la Source.', 'By night, the woodcutter’s hut is southwest of the Spring.')
        ], 'De jour, le Chêne est au nord-ouest de la clairière, assurément.', 'By day, the Oak is northwest of the clearing, certainly.',
        S('rel', { a: 'chene', b: 'clairiere', cap: 'NW' }, 'Le Vieux Chêne est au nord-ouest de la clairière.', 'The Old Oak is northwest of the clearing.'))
      ],
      faulty: [],
      scouts: [
        S('rel', { a: 'ruines', b: 'mare', cap: 'E', j: 2.5, approx: true }, 'Les Ruines sont à l’est de la mare, à deux journées et demie environ.', 'The Ruins are east of the pond, about two days and a half.'),
        S('rel', { a: 'sorciere', b: 'ruines', cap: 'W' }, 'La cabane de la sorcière est à l’ouest des Ruines.', 'The witch’s hut is west of the Ruins.')
      ],
      outro: T('La forêt bouge, mais votre carte, non.', 'The forest moves, but your map does not.'),
      note:  T('Roi ou berger, chacun voit la forêt de son côté.', 'King or shepherd, each sees the forest from their own side.')
    },

    /* ───────────── 6 · Les Marches du Rival ───────────── */
    {
      id: 6, scene: 'chateau', single: true,
      title: T('Les Marches du Rival', 'The Rival’s Marches'),
      scale: 20, tol: { ok: 10, near: 18 }, tokens: { ask: 4, scout: 3 },
      king: T('« Valmont, mon cartographe rival, a déjà dressé cette frontière. Il a l’air très sûr de lui. Vérifiez. »', '"Valmont, my rival cartographer, has already drawn this border. He seems very sure of himself. Check."'),
      hint: T('Une route relie la Tour du Centre au Pont de Fer, et un fossé enserre la Forteresse. Méfiez-vous des indices que personne d’autre ne confirme.', 'A road links the Central Tower to the Iron Bridge, and a ditch wraps around the Fortress. Beware of clues nobody else confirms.'),
      terrain: [
        { k: 'mountain', c: [8, 97], r: [20, 9], rot: -10 }, { k: 'mountain', c: [97, 96], r: [10, 12] },
        { k: 'hill', c: [25, 60], r: [10, 18], rot: 12 }, { k: 'hill', c: [82, 70], r: [10, 9], rot: -10 },
        { k: 'marsh', c: [60, 48], r: [6, 5], rot: 20 }, { k: 'forest', c: [25, 90], r: [12, 7] }, { k: 'forest', c: [8, 20], r: [10, 14] },
        { k: 'field', c: [70, 20], r: [12, 9], rot: -8 }, { k: 'field', c: [90, 25], r: [8, 10] }, { k: 'field', c: [45, 12], r: [12, 6] }
      ],
      places: [
        { id: 'forteresse',  type: 'chateau', name: T('Forteresse de Valmont', 'Valmont’s Fortress'), truth: [80, 80] },
        { id: 'tour_ouest',  type: 'tour',    name: T('Tour de l’Ouest', 'West Tower'),               truth: [20, 75] },
        { id: 'tour_centre', type: 'tour',    name: T('Tour du Centre', 'Central Tower'),             truth: [45, 65] },
        { id: 'gue',         type: 'gue',     name: T('Gué des Corbeaux', 'Ravens’ Ford'),            truth: [55, 40] },
        { id: 'pont_fer',    type: 'pont',    name: T('Pont de Fer', 'Iron Bridge'),                  truth: [35, 30] },
        { id: 'charrons',    type: 'village', name: T('Hameau des Charrons', 'Wheelwrights’ Hamlet'), truth: [65, 20] },
        { id: 'mine',        type: 'mine',    name: T('Mine d’Argent', 'Silver Mine'),                truth: [15, 45] },
        { id: 'bastide',     type: 'fort',    name: T('Bastide Est', 'East Stronghold'),              truth: [85, 45] }
      ],
      paths: [
        { id: 'route', type: 'road',  name: T('Route du Roi', 'King’s Road'), truth: [[45, 65], [40, 45], [35, 30]] },
        { id: 'fosse', type: 'ditch', name: T('Grand Fossé', 'Great Ditch'),  truth: [[60, 95], [68, 75], [88, 62], [100, 58]] }
      ],
      witnesses: [
        Wt('valmont', '🧐', 'Valmont', 'Valmont', 'Cartographe rival', 'Rival cartographer', 'Brillant, sûr de lui. Chaque phrase est impeccable.', 'Brilliant and self-assured. Every sentence is flawless.', [
          S('rel', { a: 'forteresse', b: 'tour_centre', cap: 'E', j: 1.9, approx: true }, 'Ma Forteresse est à l’est de la Tour du Centre, environ deux journées.', 'My Fortress is east of the Central Tower, about two days.'),
          S('rel', { a: 'tour_ouest', b: 'tour_centre', cap: 'W', j: 1.5, approx: true }, 'La Tour de l’Ouest est à l’ouest de celle du Centre, à une journée et demie.', 'The West Tower is west of the Central one, a day and a half away.'),
          S('rel', { a: 'mine', b: 'tour_ouest', cap: 'S', j: 1.5 }, 'La Mine est au sud de la Tour de l’Ouest, à une journée et demie.', 'The Mine is south of the West Tower, a day and a half away.'),
          S('rel', { a: 'bastide', b: 'gue', cap: 'E', j: 1.5 }, 'La Bastide est à l’est du Gué, à une journée et demie.', 'The Stronghold is east of the Ford, a day and a half away.'),
          S('rel', { a: 'charrons', b: 'gue', cap: 'S', j: 1 }, 'Les Charrons sont au sud du Gué, à une journée.', 'The Wheelwrights are south of the Ford, a day away.'),
          S('cross', { a: ['tour_centre', 'pont_fer'], path: 'route' }, 'La Route du Roi relie la Tour du Centre au Pont de Fer.', 'The King’s Road links the Central Tower to the Iron Bridge.'),
          S('rel', { a: 'gue', b: 'pont_fer', cap: 'W', wrong: true }, 'Le Gué est à l’ouest du Pont de Fer, évidemment.', 'The Ford is west of the Iron Bridge, obviously.'),
          S('rel', { a: 'charrons', b: 'bastide', cap: 'N', wrong: true }, 'Les Charrons sont au nord de la Bastide, c’est établi.', 'The Wheelwrights lie north of the Stronghold, it is well established.')
        ], 'Soit. La Forteresse est au nord-est du Gué, à deux journées et deux cinquièmes.', 'Very well. The Fortress is northeast of the Ford, two days and two fifths away.',
        S('rel', { a: 'forteresse', b: 'gue', cap: 'NE', j: 2.4, exact: true }, 'La Forteresse est au nord-est du Gué, à deux journées et deux cinquièmes.', 'The Fortress is northeast of the Ford, two days and two fifths away.'),
        { why: T('Valmont mêle le vrai et le faux avec élégance : il place le Gué à l’ouest du Pont de Fer et les Charrons au nord de la Bastide pour que le royaume paraisse plus à lui qu’il ne l’est.', 'Valmont mixes truth and falsehood with elegance: placing the Ford west of the Iron Bridge and the Wheelwrights north of the Stronghold makes the realm look more his than it is.') }),
        Wt('rufus', '💂', 'Rufus', 'Rufus', 'Soldat', 'Soldier', 'Caps exacts, distances à la lieue. Fiable.', 'Exact bearings, distances by the league. Reliable.', [
          S('rel', { a: 'gue', b: 'pont_fer', cap: 'E', j: 1 }, 'Le Gué est à l’est du Pont de Fer, à une journée.', 'The Ford is east of the Iron Bridge, a day away.')
        ], 'Du Pont de Fer au Gué : une journée et un dixième.', 'From the Iron Bridge to the Ford: a day and a tenth.',
        S('rel', { a: 'gue', b: 'pont_fer', j: 1.1, exact: true }, 'Le Gué est à une journée et un dixième du Pont de Fer.', 'The Ford is a day and a tenth from the Iron Bridge.')),
        Wt('hugo', '🪓', 'Hugo', 'Hugo', 'Bûcheron', 'Woodcutter', 'Traverse les marches avec ses fagots. Fiable.', 'Crosses the marches with his bundles. Reliable.', [
          S('rel', { a: 'charrons', b: 'bastide', cap: 'SW', j: 1.75, approx: true }, 'Les Charrons sont au sud-ouest de la Bastide, à peu près une journée trois quarts.', 'The Wheelwrights are southwest of the Stronghold, about a day and three quarters away.'),
          S('opp', { a: 'forteresse', b: 'bastide', path: 'fosse' }, 'La Forteresse et la Bastide sont de part et d’autre du Grand Fossé.', 'The Fortress and the Stronghold lie on opposite sides of the Great Ditch.')
        ], 'De la Bastide à la Forteresse : plein nord, une journée trois quarts.', 'From the Stronghold to the Fortress: due north, a day and three quarters.',
        S('rel', { a: 'forteresse', b: 'bastide', cap: 'N', j: 1.75, exact: true }, 'La Forteresse est au nord de la Bastide, à une journée trois quarts.', 'The Fortress is north of the Stronghold, a day and three quarters away.')),
        Wt('gaspard', '🎣', 'Gaspard', 'Gaspard', 'Pêcheur', 'Fisherman', 'Connaît l’eau mieux que personne. Fiable.', 'Knows the water better than anyone. Reliable.', [
          S('rel', { a: 'mine', b: 'gue', cap: 'W', j: 2 }, 'La Mine est à l’ouest du Gué, à deux journées.', 'The Mine is west of the Ford, two days away.'),
          S('side', { a: 'gue', path: 'route', cap: 'E' }, 'Le Gué est sur la rive est de la Route du Roi.', 'The Ford is on the east side of the King’s Road.')
        ], 'De la Mine au Pont de Fer : au nord-ouest du pont, une journée et quart.', 'From the Mine to the Iron Bridge: the mine lies northwest of the bridge, a day and a quarter.',
        S('rel', { a: 'mine', b: 'pont_fer', cap: 'NW', j: 1.25, exact: true }, 'La Mine est au nord-ouest du Pont de Fer, à une journée et quart.', 'The Mine is northwest of the Iron Bridge, a day and a quarter away.')),
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau. Fiable.', 'Measures everything with a line. Reliable.', [
          S('rel', { a: 'tour_centre', b: 'gue', cap: 'N', j: 1.5 }, 'La Tour du Centre est au nord du Gué, à une journée et demie.', 'The Central Tower is north of the Ford, a day and a half away.')
        ], 'De la Tour du Centre au Pont de Fer : plein nord, presque deux journées.', 'From the Central Tower to the Iron Bridge: due north, nearly two days.',
        S('rel', { a: 'tour_centre', b: 'pont_fer', cap: 'N', j: 1.8, exact: true }, 'La Tour du Centre est au nord du Pont de Fer, à une journée et quatre cinquièmes.', 'The Central Tower is north of the Iron Bridge, a day and four fifths away.')),
        Wt('lise', '🔭', 'Lise', 'Lise', 'Guetteuse', 'Lookout', 'Voit loin, même dans la brume. Fiable.', 'Sees far, even through fog. Reliable.', [
          S('rel', { a: 'bastide', b: 'forteresse', cap: 'S', j: 2, approx: true }, 'La Bastide est au sud de la Forteresse, à peu près deux journées.', 'The Stronghold is south of the Fortress, about two days away.')
        ], 'La Bastide est à l’est du Gué, à une journée et demie.', 'The Stronghold is east of the Ford, a day and a half away.',
        S('rel', { a: 'bastide', b: 'gue', cap: 'E', j: 1.5, exact: true }, 'La Bastide est à l’est du Gué, à une journée et demie.', 'The Stronghold is east of the Ford, a day and a half away.')),
        Wt('hermance', '👩‍🦳', 'Hermance', 'Hermance', 'Vieille sage', 'Old sage', 'Se souvient d’avant. Rarement en défaut.', 'Remembers the old days. Rarely wrong.', [
          S('rel', { a: 'tour_ouest', b: 'mine', cap: 'N' }, 'La Tour de l’Ouest est au nord de la Mine.', 'The West Tower is north of the Mine.')
        ], 'La Tour de l’Ouest est à l’ouest de celle du Centre, à une journée et deux cinquièmes.', 'The West Tower is west of the Central one, a day and two fifths away.',
        S('rel', { a: 'tour_ouest', b: 'tour_centre', cap: 'W', j: 1.4, exact: true }, 'La Tour de l’Ouest est à l’ouest de celle du Centre, à une journée et deux cinquièmes.', 'The West Tower is west of the Central one, a day and two fifths away.')),
        Wt('bartolo', '🧔', 'Bartolo', 'Bartolo', 'Marchand', 'Merchant', 'Exagère les distances (environ +30 %). Fiable sur les routes.', 'Exaggerates distances (about +30%). Reliable on roads.', [
          S('rel', { a: 'charrons', b: 'pont_fer', cap: 'E', j: 2 }, 'Des Charrons au Pont de Fer, deux grosses journées, plein est !', 'From the Wheelwrights to the Iron Bridge, two long days, due east!')
        ], 'Bon… une journée et six dixièmes, sans les cailloux.', 'Fine… a day and six tenths, without the stones.',
        S('rel', { a: 'charrons', b: 'pont_fer', j: 1.6, exact: true }, 'Les Charrons sont à une journée et six dixièmes du Pont de Fer.', 'The Wheelwrights are a day and six tenths from the Iron Bridge.')),
        Wt('pip', '🧒', 'Pip', 'Pip', 'Enfant', 'Child', 'Naïf, mais il ne rate rien de ce qui est près de lui.', 'Naive, but he misses nothing close to him.', [
          S('rel', { a: 'forteresse', b: 'bastide', cap: 'N' }, 'La Forteresse est tout en haut de la Bastide !', 'The Fortress is right above the Stronghold!')
        ], 'Le Gué ? À gauche de la Bastide, un peu plus bas.', 'The Ford? To the left of the Stronghold, a bit lower down.',
        S('rel', { a: 'gue', b: 'bastide', cap: 'W' }, 'Le Gué est à l’ouest de la Bastide.', 'The Ford is west of the Stronghold.'))
      ],
      faulty: ['valmont'],
      scouts: [
        S('rel', { a: 'pont_fer', b: 'gue', cap: 'SW' }, 'Le Pont de Fer est au sud-ouest du Gué.', 'The Iron Bridge is southwest of the Ford.'),
        S('rel', { a: 'mine', b: 'forteresse', j: 3, jmin: true }, 'La Mine est à plus de trois journées de la Forteresse.', 'The Mine is more than three days from the Fortress.'),
        S('rel', { a: 'charrons', b: 'pont_fer', cap: 'SE' }, 'Les Charrons sont au sud-est du Pont de Fer.', 'The Wheelwrights are southeast of the Iron Bridge.')
      ],
      outro: T('Valmont : « Tu es meilleur que moi… et ça me rend malade. »', 'Valmont: “You are better than I am… and it makes me sick.”'),
      note:  T('Ne crois pas une carte qui s’arrange trop bien.', 'Never trust a map that fits together too neatly.')
    },

    /* ───────────── 7 · L’Archipel des Cent Phares ───────────── */
    {
      id: 7, scene: 'iles', tbase: 'water',
      title: T('L’Archipel des Cent Phares', 'The Archipelago of a Hundred Lighthouses'),
      scale: 25, tol: { ok: 10, near: 18 }, tokens: { ask: 4, scout: 3 },
      king: T('« Quatre îles, un phare sur chacune, et aucune carte. Mes marins ne savent plus où ils sont. »', '"Four islands, a lighthouse on each, and no map. My sailors no longer know where they are."'),
      hint: T('Ici, une journée de mer vaut vingt-cinq lieues. Les phares se répondent : un phare bien placé en place d’autres.', 'Here, a day at sea is worth twenty-five leagues. The lighthouses answer each other: one well-placed lighthouse places the others.'),
      terrain: [
        { k: 'plain', c: [25, 72], r: [22, 20], rot: 10 }, { k: 'plain', c: [70, 76], r: [18, 16], rot: -12 },
        { k: 'plain', c: [30, 17], r: [20, 14], rot: 6 }, { k: 'plain', c: [80, 20], r: [14, 15], rot: -8 },
        { k: 'mountain', c: [14, 62], r: [7, 8], rot: 5 }, { k: 'hill', c: [75, 66], r: [8, 6] }, { k: 'marsh', c: [20, 15], r: [8, 6] },
        { k: 'forest', c: [28, 82], r: [8, 6] }, { k: 'field', c: [85, 15], r: [7, 6] }, { k: 'sand', c: [70, 88], r: [8, 3.5] }
      ],
      places: [
        { id: 'phare_matis',   type: 'phare',      name: T('Phare du Grand-Mât', 'Great Mast Lighthouse'), truth: [20, 80] },
        { id: 'port_mat',      type: 'port',       name: T('Port du Mât', 'Mast Harbour'),                truth: [30, 65] },
        { id: 'mont_voile',    type: 'montagne',   name: T('Mont Voile', 'Sail Mountain'),                 truth: [15, 60] },
        { id: 'crique_rouge',  type: 'crique',     name: T('Crique Rouge', 'Red Cove'),                    truth: [35, 85] },
        { id: 'phare_pierrot', type: 'phare',      name: T('Phare Pierrot', 'Pierrot Lighthouse'),         truth: [65, 75] },
        { id: 'carrieres',     type: 'carriere',   name: T('Carrières de Pierre', 'Stone Quarries'),       truth: [75, 65] },
        { id: 'plage_noire',   type: 'plage_noire', name: T('Plage Noire', 'Black Beach'),                 truth: [70, 85] },
        { id: 'phare_brumel',  type: 'phare',      name: T('Phare du Brumel', 'Brumel Lighthouse'),        truth: [30, 25] },
        { id: 'marais_brume',  type: 'marais',     name: T('Marais de Brume', 'Mist Marsh'),              truth: [20, 15] },
        { id: 'epave',         type: 'epave',      name: T('Épave du Fantôme', 'Ghost Wreck'),             truth: [40, 10] },
        { id: 'phare_coeur',   type: 'phare',      name: T('Phare du Cœur', 'Heart Lighthouse'),           truth: [75, 25] },
        { id: 'village_coeur', type: 'village',    name: T('Village du Cœur', 'Heart Village'),            truth: [85, 15] }
      ],
      paths: [],
      witnesses: [
        Wt('yann', '⚓', 'Yann', 'Yann', 'Marin', 'Sailor', 'Lit les côtes comme d’autres lisent un livre. Fiable.', 'Reads coastlines like others read books. Reliable.', [
          S('rel', { a: 'phare_matis', b: 'phare_pierrot', cap: 'W', j: 1.8 }, 'Du phare Pierrot au phare du Grand-Mât : plein ouest, une journée trois quarts.', 'From Pierrot to the Great Mast lighthouse: due west, a day and three quarters.')
        ], 'Les carrières sont tout près du phare Pierrot, au sud-est : une demi-journée.', 'The quarries are close to Pierrot, to the southeast: half a day.',
        S('rel', { a: 'carrieres', b: 'phare_pierrot', cap: 'SE', j: .55, exact: true }, 'Les carrières sont au sud-est du phare Pierrot, à un peu plus d’une demi-journée.', 'The quarries are southeast of Pierrot, a little over half a day away.')),
        Wt('lise', '🔭', 'Lise', 'Lise', 'Guetteuse', 'Lookout', 'Voit loin, même dans la brume. Fiable.', 'Sees far, even through fog. Reliable.', [
          S('rel', { a: 'phare_coeur', b: 'phare_brumel', cap: 'E', j: 1.8 }, 'Le phare du Cœur est à l’est du Brumel, à une journée trois quarts.', 'The Heart lighthouse is east of the Brumel, a day and three quarters away.'),
          S('rel', { a: 'marais_brume', b: 'phare_brumel', cap: 'SW', near: true }, 'Le Marais de Brume est tout près du Brumel, au sud-ouest.', 'The Mist Marsh is close to the Brumel, to the southwest.')
        ], 'L’épave est au sud-est du Brumel, à sept dixièmes de journée.', 'The wreck is southeast of the Brumel, seven tenths of a day away.',
        S('rel', { a: 'epave', b: 'phare_brumel', cap: 'SE', j: .7, exact: true }, 'L’épave est au sud-est du Brumel, à sept dixièmes de journée.', 'The wreck is southeast of the Brumel, seven tenths of a day away.')),
        Wt('barbedouce', '🏴‍☠️', 'Barbe-Douce', 'Sweetbeard', 'Vieux capitaine', 'Old captain', 'Raconte de belles histoires. Les distances, un peu moins.', 'Tells fine stories. Distances, a little less.', [
          S('rel', { a: 'plage_noire', b: 'crique_rouge', cap: 'E', j: 1.4, approx: true }, 'La Plage Noire est à l’est de la Crique Rouge, à peu près une journée et deux cinquièmes.', 'The Black Beach is east of the Red Cove, about a day and two fifths away.'),
          S('rel', { a: 'phare_brumel', b: 'phare_matis', cap: 'S', j: .5, wrong: true }, 'Le Brumel ? Juste au sud du Grand-Mât, une demi-journée de nage !', 'The Brumel? Just south of the Great Mast, half a day’s swim!')
        ], 'Bon… au sud du Grand-Mât, oui, mais à deux journées et deux dixièmes.', 'Well… south of the Great Mast, yes, but two days and two tenths away.',
        S('rel', { a: 'phare_brumel', b: 'phare_matis', cap: 'S', j: 2.2, exact: true }, 'Le Brumel est au sud du Grand-Mât, à deux journées et deux dixièmes.', 'The Brumel is south of the Great Mast, two days and two tenths away.'),
        { why: T('Barbe-Douce a un vieux compte à régler avec le Brumel : en le disant tout près, il évite qu’on cherche pourquoi il n’y met plus les pieds.', 'Sweetbeard has an old score to settle with the Brumel: claiming it is close keeps people from asking why he never sets foot there.') }),
        Wt('marcos', '🕶️', 'Marcos', 'Marcos', 'Contrebandier', 'Smuggler', 'Connaît toutes les îles… et leurs mouillages discrets.', 'Knows every island… and their discreet anchorages.', [
          S('rel', { a: 'phare_pierrot', b: 'phare_matis', cap: 'E', j: 1.8 }, 'Le phare Pierrot est à l’est du Grand-Mât, à une journée trois quarts.', 'Pierrot is east of the Great Mast, a day and three quarters away.'),
          S('rel', { a: 'phare_matis', b: 'port_mat', cap: 'NW', j: .75 }, 'Le phare du Grand-Mât est au nord-ouest du Port, à trois quarts de journée.', 'The Great Mast lighthouse is northwest of the harbour, three quarters of a day away.')
        ], 'Le Port est au sud de la Crique Rouge, à quatre cinquièmes de journée.', 'The harbour is south of the Red Cove, four fifths of a day away.',
        S('rel', { a: 'port_mat', b: 'crique_rouge', cap: 'S', j: .8, exact: true }, 'Le Port du Mât est au sud de la Crique Rouge, à quatre cinquièmes de journée.', 'Mast Harbour is south of the Red Cove, four fifths of a day away.')),
        Wt('gaspard', '🎣', 'Gaspard', 'Gaspard', 'Pêcheur', 'Fisherman', 'Connaît l’eau mieux que personne. Fiable.', 'Knows the water better than anyone. Reliable.', [
          S('rel', { a: 'epave', b: 'marais_brume', cap: 'E', j: .8 }, 'L’épave est à l’est du Marais de Brume, à quatre cinquièmes de journée.', 'The wreck is east of the Mist Marsh, four fifths of a day away.')
        ], 'Le Marais est au sud-ouest du phare du Brumel, à un peu plus d’une demi-journée.', 'The marsh is southwest of the Brumel, a little over half a day away.',
        S('rel', { a: 'marais_brume', b: 'phare_brumel', cap: 'SW', j: .55, exact: true }, 'Le Marais de Brume est au sud-ouest du Brumel, à un peu plus d’une demi-journée.', 'The Mist Marsh is southwest of the Brumel, a little over half a day away.')),
        Wt('bartolo', '🧔', 'Bartolo', 'Bartolo', 'Marchand', 'Merchant', 'Exagère les distances (environ +30 %). Fiable sur les routes.', 'Exaggerates distances (about +30%). Reliable on roads.', [
          S('rel', { a: 'phare_coeur', b: 'phare_pierrot', cap: 'S', j: 2.7 }, 'Du phare Pierrot au phare du Cœur, droit au sud, presque trois journées !', 'From Pierrot to the Heart lighthouse, due south, nearly three days!')
        ], 'Deux journées, sans compter les vagues.', 'Two days, not counting the waves.',
        S('rel', { a: 'phare_coeur', b: 'phare_pierrot', cap: 'S', j: 2, exact: true }, 'Le phare du Cœur est au sud du phare Pierrot, à deux journées.', 'The Heart lighthouse is south of Pierrot, two days away.')),
        Wt('rufus', '💂', 'Rufus', 'Rufus', 'Soldat', 'Soldier', 'Caps exacts, distances à la lieue. Fiable.', 'Exact bearings, distances by the league. Reliable.', [
          S('rel', { a: 'phare_pierrot', b: 'phare_brumel', cap: 'NE' }, 'Le phare Pierrot est au nord-est du Brumel.', 'Pierrot is northeast of the Brumel.'),
          S('rel', { a: 'carrieres', b: 'plage_noire', cap: 'S', j: .8 }, 'Les carrières sont au sud de la Plage Noire, à quatre cinquièmes de journée.', 'The quarries are south of the Black Beach, four fifths of a day away.')
        ], 'Le Mont Voile est au sud du Grand-Mât, à quatre cinquièmes de journée.', 'Sail Mountain is south of the Great Mast, four fifths of a day away.',
        S('rel', { a: 'mont_voile', b: 'phare_matis', cap: 'S', j: .8, exact: true }, 'Le Mont Voile est au sud du Grand-Mât, à quatre cinquièmes de journée.', 'Sail Mountain is south of the Great Mast, four fifths of a day away.')),
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau. Fiable.', 'Measures everything with a line. Reliable.', [
          S('rel', { a: 'mont_voile', b: 'port_mat', cap: 'W', near: true }, 'Le Mont Voile est juste à l’ouest du Port du Mât.', 'Sail Mountain lies just west of Mast Harbour.'),
          S('rel', { a: 'phare_brumel', b: 'port_mat', cap: 'S', j: 1.6, approx: true }, 'Du Port du Mât, le Brumel est plein sud, à une journée et demie environ.', 'From Mast Harbour, the Brumel lies due south, about a day and a half away.')
        ], 'La Crique Rouge est au nord du Port, à quatre cinquièmes de journée.', 'The Red Cove is north of the harbour, four fifths of a day away.',
        S('rel', { a: 'crique_rouge', b: 'port_mat', cap: 'N', j: .8, exact: true }, 'La Crique Rouge est au nord du Port du Mât, à quatre cinquièmes de journée.', 'The Red Cove is north of Mast Harbour, four fifths of a day away.')),
        Wt('pip', '🧒', 'Pip', 'Pip', 'Enfant', 'Child', 'Naïf, mais il ne rate rien de ce qui est près de lui.', 'Naive, but he misses nothing close to him.', [
          S('rel', { a: 'plage_noire', b: 'phare_pierrot', cap: 'N', near: true }, 'La Plage Noire est juste au-dessus du phare Pierrot !', 'The Black Beach is right above Pierrot!')
        ], 'Le phare du Cœur est en haut à gauche du village !', 'The Heart lighthouse is up and to the left of the village!',
        S('rel', { a: 'phare_coeur', b: 'village_coeur', cap: 'NW' }, 'Le phare du Cœur est au nord-ouest du village.', 'The Heart lighthouse is northwest of the village.')),
        Wt('hugo', '🪓', 'Hugo', 'Hugo', 'Bûcheron', 'Woodcutter', 'Passe d’île en île avec son bois. Fiable.', 'Hops from island to island with his timber. Reliable.', [
          S('rel', { a: 'village_coeur', b: 'phare_coeur', cap: 'SE', near: true }, 'Le Village du Cœur est tout près, au sud-est du phare.', 'Heart Village lies close by, southeast of the lighthouse.'),
          S('rel', { a: 'crique_rouge', b: 'phare_matis', cap: 'E', near: true }, 'La Crique Rouge est juste à l’est du Grand-Mât.', 'The Red Cove is just east of the Great Mast.')
        ], 'Les carrières sont au nord du phare du Cœur, à une journée et six dixièmes.', 'The quarries are north of the Heart lighthouse, a day and six tenths away.',
        S('rel', { a: 'carrieres', b: 'phare_coeur', cap: 'N', j: 1.6, exact: true }, 'Les carrières sont au nord du phare du Cœur, à une journée et six dixièmes.', 'The quarries are north of the Heart lighthouse, a day and six tenths away.'))
      ],
      faulty: ['barbedouce'],
      scouts: [
        S('rel', { a: 'phare_pierrot', b: 'phare_coeur', cap: 'N', j: 2, approx: true }, 'Le phare Pierrot est au nord du Cœur, à deux journées environ.', 'Pierrot is north of the Heart lighthouse, about two days away.'),
        S('rel', { a: 'phare_brumel', b: 'phare_matis', j: 2, jmin: true }, 'Le Brumel est à plus de deux journées du Grand-Mât.', 'The Brumel is more than two days from the Great Mast.'),
        S('rel', { a: 'village_coeur', b: 'phare_brumel', cap: 'E', j: 2.2, approx: true }, 'Le Village du Cœur est à l’est du Brumel, à deux journées un quart.', 'Heart Village is east of the Brumel, two days and a quarter away.')
      ],
      outro: T('Cent phares, une seule carte. Les marins vous doivent un verre.', 'A hundred lighthouses, one map. The sailors owe you a drink.'),
      note:  T('Regarde les phares : ils savent où sont les autres.', 'Watch the lighthouses: they know where the others are.')
    },

    /* ───────────── 8 · Le Royaume Oublié ───────────── */
    {
      id: 8, scene: 'ruines',
      title: T('Le Royaume Oublié', 'The Forgotten Kingdom'),
      scale: 20, tol: { ok: 9, near: 16 }, tokens: { ask: 5, scout: 3 },
      king: T('« Tout le royaume, d’un seul trait. Et ne vous fiez pas à ma propre carte : elle a été arrangée. »', '"The whole kingdom, in a single sweep. And do not trust my own map: it has been tampered with."'),
      hint: T('La Route Royale descend de la Capitale à la Fin de Route. Les lettres d’Orlan sont les seuls témoins qui ne mentent jamais.', 'The Royal Road runs from the Capital to the Road’s End. Orlan’s letters are the only witnesses who never lie.'),
      terrain: [
        { k: 'mountain', c: [8, 84], r: [14, 16], rot: -8 }, { k: 'mountain', c: [95, 99], r: [10, 8] },
        { k: 'water', c: [86, 80], r: [11, 9], rot: 10 }, { k: 'water', c: [103, 45], r: [14, 26] },
        { k: 'forest', c: [20, 50], r: [12, 14] }, { k: 'forest', c: [8, 22], r: [8, 8] },
        { k: 'hill', c: [36, 48], r: [7, 12], rot: 4 }, { k: 'hill', c: [64, 48], r: [7, 12], rot: -4 }, { k: 'hill', c: [50, 6], r: [14, 6] },
        { k: 'field', c: [80, 21], r: [11, 8], rot: -8 }, { k: 'field', c: [62, 70], r: [9, 7] }, { k: 'marsh', c: [50, 50], r: [5, 7] }, { k: 'field', c: [22, 20], r: [9, 7] }
      ],
      places: [
        { id: 'capitale',    type: 'chateau',    name: T('Capitale Royale', 'Royal Capital'),   truth: [50, 92] },
        { id: 'fort',        type: 'fort',       name: T('Fort du Sud', 'Southern Fort'),        truth: [50, 8] },
        { id: 'mont_aigle',  type: 'montagne',   name: T('Mont des Aigles', 'Eagle Mountain'),   truth: [15, 80] },
        { id: 'lac_argent',  type: 'lac',        name: T('Lac d’Argent', 'Silver Lake'),         truth: [85, 80] },
        { id: 'foret_sombre', type: 'foret_sombre', name: T('Forêt Sombre', 'Dark Forest'),      truth: [20, 50] },
        { id: 'port_dore',   type: 'port',       name: T('Port Doré', 'Golden Harbour'),         truth: [88, 45] },
        { id: 'prairie',     type: 'prairie',    name: T('Grande Prairie', 'Great Meadow'),      truth: [80, 20] },
        { id: 'abbaye',      type: 'abbaye',     name: T('Abbaye des Brumes', 'Abbey of Mists'), truth: [22, 20] },
        { id: 'pont_royal',  type: 'pont',       name: T('Pont Royal', 'Royal Bridge'),          truth: [50, 70] },
        { id: 'croisee',     type: 'croisee',    name: T('La Croisée', 'The Crossroads'),        truth: [50, 30] },
        { id: 'tour_roi',    type: 'tour',       name: T('Tour du Roi', 'King’s Tower'),         truth: [35, 75] },
        { id: 'moulin_royal', type: 'moulin',    name: T('Moulin Royal', 'Royal Mill'),          truth: [65, 70] },
        { id: 'fin_route',   type: 'fin_route',  name: T('Fin de Route', 'Road’s End'),          truth: [50, 40] },
        { id: 'val_perdu',   type: 'val_perdu',  name: T('Val Perdu', 'Lost Vale'),              truth: [50, 50] }
      ],
      paths: [
        { id: 'royale', type: 'road', name: T('Route Royale', 'Royal Road'), truth: [[50, 92], [50, 70], [50, 40]] }
      ],
      witnesses: [
        Wt('orlan', '✒️', 'Lettres d’Orlan', 'Orlan’s Letters', 'Cinq lettres', 'Five letters', 'Orlan n’a jamais menti dans ses lettres. Mais il en dit peu.', 'Orlan never lied in his letters. But he says little.', [
          S('cross', { a: 'fin_route', path: 'royale' }, 'Lettre I — La Route Royale s’arrête à la Fin de Route, ni plus, ni moins.', 'Letter I — The Royal Road ends at Road’s End, no more, no less.'),
          S('between', { a: 'val_perdu', b: 'foret_sombre', c: 'port_dore' }, 'Lettre II — Entre la Forêt Sombre et le Port Doré, il y a le Val Perdu.', 'Letter II — Between the Dark Forest and the Golden Harbour lies the Lost Vale.'),
          S('rel', { a: 'fin_route', b: 'croisee', cap: 'N', j: .5 }, 'Lettre III — La Fin de Route est une demi-journée au nord de la Croisée.', 'Letter III — Road’s End is half a day north of the Crossroads.'),
          S('rel', { a: 'pont_royal', b: 'val_perdu', cap: 'N', j: 1 }, 'Lettre IV — Le Pont Royal est à une journée au nord du Val Perdu.', 'Letter IV — The Royal Bridge is a day north of the Lost Vale.'),
          S('rel', { a: 'fin_route', b: 'val_perdu', cap: 'S', near: true }, 'Lettre V — La Fin de Route est juste au sud du Val Perdu.', 'Letter V — Road’s End lies just south of the Lost Vale.')
        ], '', '', null, { sealed: true }),
        Wt('roi', '👑', 'La carte du roi', 'The king’s map', 'Carte officielle', 'Official map', 'La carte du palais. Très belle. Un peu trop bien arrangée.', 'The palace map. Very handsome. A little too neatly arranged.', [
          S('rel', { a: 'croisee', b: 'val_perdu', near: true, r: 10, wrong: true }, 'La Croisée est au cœur du royaume, à deux pas du Val Perdu.', 'The Crossroads sit at the heart of the realm, a stone’s throw from the Lost Vale.'),
          S('rel', { a: 'port_dore', b: 'capitale', cap: 'E', j: 2, wrong: true }, 'Le Port Doré est à l’est de la Capitale, à deux journées.', 'The Golden Harbour is east of the Capital, two days away.'),
          S('cross', { a: 'croisee', path: 'royale', wrong: true }, 'La Croisée est sur la Route Royale, comme il se doit.', 'The Crossroads lie on the Royal Road, as they should.'),
          S('rel', { a: 'pont_royal', b: 'capitale', cap: 'S', j: 1 }, 'Le Pont Royal est au sud de la Capitale, à une journée.', 'The Royal Bridge is south of the Capital, a day away.')
        ], '', '', null, { sealed: true, why: T('La carte du roi a été retouchée : on a rapproché la Croisée de la Route Royale et le Port Doré de la Capitale, pour que le royaume paraisse plus uni qu’il ne l’est.', 'The king’s map has been touched up: the Crossroads were drawn onto the Royal Road and the Golden Harbour towards the Capital, to make the realm look more united than it is.') }),
        Wt('odo', '👨‍🌾', 'Maître Odo', 'Master Odo', 'Meunier', 'Miller', 'Connaît sa vallée comme sa poche. Fiable.', 'Knows his valley like the back of his hand. Reliable.', [
          S('rel', { a: 'moulin_royal', b: 'pont_royal', cap: 'E', near: true }, 'Le Moulin Royal est juste à l’est du Pont Royal.', 'The Royal Mill lies just east of the Royal Bridge.'),
          S('cross', { a: ['capitale', 'pont_royal'], path: 'royale' }, 'La Route Royale passe par la Capitale et par le Pont Royal.', 'The Royal Road runs through the Capital and the Royal Bridge.')
        ], 'Du Moulin à la Capitale : au sud-est de celle-ci, une journée et un tiers.', 'From the Mill to the Capital: southeast of it, a day and a third.',
        S('rel', { a: 'moulin_royal', b: 'capitale', cap: 'SE', j: 1.35, exact: true }, 'Le Moulin Royal est au sud-est de la Capitale, à une journée et un tiers.', 'The Royal Mill is southeast of the Capital, a day and a third away.')),
        Wt('hermance', '👩‍🦳', 'Hermance', 'Hermance', 'Vieille sage', 'Old sage', 'Se souvient d’avant. Rarement en défaut.', 'Remembers the old days. Rarely wrong.', [
          S('rel', { a: 'foret_sombre', b: 'croisee', cap: 'NW', j: 2, approx: true, angTol: 40 }, 'La Forêt Sombre est à l’ouest, un peu nord, de la Croisée : deux journées.', 'The Dark Forest lies west, a little north, of the Crossroads: two days.')
        ], 'La Forêt est à l’ouest du Val Perdu, à une journée et demie.', 'The Forest lies west of the Lost Vale, a day and a half away.',
        S('rel', { a: 'foret_sombre', b: 'val_perdu', cap: 'W', j: 1.5, exact: true }, 'La Forêt Sombre est à l’ouest du Val Perdu, à une journée et demie.', 'The Dark Forest is west of the Lost Vale, a day and a half away.')),
        Wt('rufus', '💂', 'Rufus', 'Rufus', 'Soldat', 'Soldier', 'Caps exacts, distances à la lieue. Fiable.', 'Exact bearings, distances by the league. Reliable.', [
          S('rel', { a: 'port_dore', b: 'capitale', cap: 'SE', j: 3 }, 'Le Port Doré est au sud-est de la Capitale, à trois journées.', 'The Golden Harbour is southeast of the Capital, three days away.')
        ], 'Du Val Perdu au Port Doré : plein est, une journée et neuf dixièmes.', 'From the Lost Vale to the Golden Harbour: due east, a day and nine tenths.',
        S('rel', { a: 'port_dore', b: 'val_perdu', cap: 'E', j: 1.9, exact: true }, 'Le Port Doré est à l’est du Val Perdu, à une journée et neuf dixièmes.', 'The Golden Harbour is east of the Lost Vale, a day and nine tenths away.')),
        Wt('gaspard', '🎣', 'Gaspard', 'Gaspard', 'Pêcheur', 'Fisherman', 'Connaît l’eau mieux que personne. Fiable.', 'Knows the water better than anyone. Reliable.', [
          S('rel', { a: 'lac_argent', b: 'pont_royal', cap: 'E', j: 2 }, 'Le Lac d’Argent est à l’est du Pont Royal, à deux journées.', 'Silver Lake is east of the Royal Bridge, two days away.'),
          S('rel', { a: 'capitale', b: 'pont_royal', cap: 'N', j: 1 }, 'La Capitale est au nord du Pont Royal, à une journée.', 'The Capital is north of the Royal Bridge, a day away.')
        ], 'Le Lac est à l’est de la Capitale, à près de deux journées.', 'The lake is east of the Capital, nearly two days away.',
        S('rel', { a: 'lac_argent', b: 'capitale', cap: 'E', j: 1.85, exact: true }, 'Le Lac d’Argent est à l’est de la Capitale, à une journée et quatre cinquièmes.', 'Silver Lake is east of the Capital, a day and four fifths away.')),
        Wt('lise', '🔭', 'Lise', 'Lise', 'Guetteuse', 'Lookout', 'Voit loin, même dans la brume. Fiable.', 'Sees far, even through fog. Reliable.', [
          S('rel', { a: 'abbaye', b: 'foret_sombre', cap: 'S', j: 1.5 }, 'L’Abbaye est au sud de la Forêt Sombre, à une journée et demie.', 'The Abbey is south of the Dark Forest, a day and a half away.'),
          S('rel', { a: 'fort', b: 'croisee', cap: 'S', j: 1 }, 'Le Fort est au sud de la Croisée, à une journée.', 'The Fort is south of the Crossroads, a day away.')
        ], 'L’Abbaye est à l’ouest de la Croisée, à une journée et demie.', 'The Abbey is west of the Crossroads, a day and a half away.',
        S('rel', { a: 'abbaye', b: 'croisee', cap: 'W', j: 1.5, exact: true }, 'L’Abbaye est à l’ouest de la Croisée, à une journée et demie.', 'The Abbey is west of the Crossroads, a day and a half away.')),
        Wt('tom', '📐', 'Tom', 'Tom', 'Géomètre', 'Surveyor', 'Mesure tout au cordeau. Fiable.', 'Measures everything with a line. Reliable.', [
          S('rel', { a: 'mont_aigle', b: 'tour_roi', cap: 'W', j: 1 }, 'Le Mont des Aigles est à l’ouest de la Tour du Roi, à une journée.', 'Eagle Mountain is west of the King’s Tower, a day away.'),
          S('rel', { a: 'tour_roi', b: 'pont_royal', cap: 'W', near: true }, 'La Tour du Roi est à l’ouest du Pont Royal, tout près.', 'The King’s Tower lies west of the Royal Bridge, close by.')
        ], 'Du Mont à la Capitale : à l’ouest d’elle, une journée trois quarts.', 'From the Mountain to the Capital: west of it, a day and three quarters.',
        S('rel', { a: 'mont_aigle', b: 'capitale', cap: 'W', j: 1.85, exact: true }, 'Le Mont des Aigles est à l’ouest de la Capitale, à une journée et quatre cinquièmes.', 'Eagle Mountain is west of the Capital, a day and four fifths away.')),
        Wt('hugo', '🪓', 'Hugo', 'Hugo', 'Bûcheron', 'Woodcutter', 'Traverse le royaume avec son bois. Fiable.', 'Crosses the realm with his timber. Reliable.', [
          S('rel', { a: 'prairie', b: 'croisee', cap: 'E', j: 1.5 }, 'La Grande Prairie est à l’est de la Croisée, à une journée et demie.', 'The Great Meadow is east of the Crossroads, a day and a half away.')
        ], 'De la Prairie au Port : au sud du port, une journée et trois dixièmes.', 'From the Meadow to the Harbour: south of the harbour, a day and three tenths.',
        S('rel', { a: 'prairie', b: 'port_dore', cap: 'S', j: 1.3, exact: true }, 'La Grande Prairie est au sud du Port Doré, à une journée et trois dixièmes.', 'The Great Meadow is south of the Golden Harbour, a day and three tenths away.'))
      ],
      faulty: ['roi'],
      scouts: [
        S('rel', { a: 'fort', b: 'fin_route', cap: 'S', j: 1.6, approx: true }, 'Le Fort est au sud de la Fin de Route, à une journée et demie.', 'The Fort is south of Road’s End, a day and a half away.'),
        S('rel', { a: 'abbaye', b: 'val_perdu', cap: 'SW', j: 2, approx: true }, 'L’Abbaye est au sud-ouest du Val Perdu, à deux journées.', 'The Abbey is southwest of the Lost Vale, two days away.'),
        S('rel', { a: 'lac_argent', b: 'val_perdu', cap: 'NE', j: 2.3, approx: true }, 'Le Lac d’Argent est au nord-est du Val Perdu, à deux journées et quart.', 'Silver Lake is northeast of the Lost Vale, two days and a quarter away.')
      ],
      outro: T('Le royaume entier tient sur une feuille. Orlan aurait été fier.', 'The whole kingdom fits on a single sheet. Orlan would have been proud.'),
      note:  T('Pas de route sans fin, pas de fin sans vallée.', 'No road without an end, no end without a vale.')
    }
  ];

  var Levels = { list: LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Levels;
  else root.Levels = Levels;
})(typeof window !== 'undefined' ? window : globalThis);
