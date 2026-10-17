/* Le Cartographe — données des contrées (V0 : contrées 1 et 2).
   Repère : x → est, y → nord, carte 0–100. 1 journée = scale unités. */
(function (root) {
  'use strict';

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
    }
  ];

  var Levels = { list: LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Levels;
  else root.Levels = Levels;
})(typeof window !== 'undefined' ? window : globalThis);
