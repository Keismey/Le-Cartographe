/* Le Cartographe — textes d'interface FR / EN */
(function (root) {
  'use strict';
  var D = {
    fr: {
      title: 'Le Cartographe',
      tagline: 'Dessine le monde, un témoignage à la fois.',
      version: 'V0 · test',
      play: 'Jouer', continue_: 'Continuer', atlas: 'Grand Atlas', notebook: 'Carnet', tools: 'Outils',
      submit: 'Remettre la carte', ask: 'Question (restants : {n})', scout: 'Éclaireur (restants : {n})',
      ruler: 'Règle-journées', ghost: 'Voir les indices', suspect: 'Je soupçonne ce témoin', single: 'Source unique',
      night: 'De nuit', confirm: 'Remettre cette carte au roi ?', result: 'Score : {s} % · {ok} lieux justes sur {t}',
      liar: '{name} mentait : {motif}', retry: 'Recommencer', next: 'Contrée suivante', export_: 'Exporter la carte (PNG)',
      settings: 'Réglages', lang: 'Langue', reset: 'Effacer la sauvegarde ?', install: 'Ajouter à l’écran d’accueil',
      offline: 'Hors-ligne : tout est prêt.', error: 'Oups, la sauvegarde a échoué.',

      back: 'Retour', start: 'Commencer', close: 'Fermer', notYet: 'Pas encore', handIn: 'Remettre', erase: 'Effacer',
      region: 'Contrée {n}', stars: '{n} étoile(s)', best: 'Meilleur : {s} %', locked: 'Verrouillée', soon: 'Bientôt',
      soonText: 'Les contrées 3 à 8 arrivent dans la prochaine version.',
      kingHint: 'Le roi précise', atlasText: 'Les contrées que vous avez relevées pour le roi.',
      orlanNotes: 'Notes d’Orlan', orlanNote: 'Note d’Orlan n°{n}', noNotes: 'Aucune note retrouvée pour l’instant.',

      move: 'Déplacer', draw: 'Tracer', drawPath: 'Tracer : {name}', undo: 'Annuler', removeStamp: 'Retirer',
      recenter: 'Recentrer', eraseStroke: 'Gommer le tracé', pin: 'Surligner', unpin: 'Ne plus surligner',
      stampsTitle: 'Tampons', stampsHelp: 'Glissez un tampon sur le parchemin. Relâchez-le hors de la carte pour le reprendre.',
      pathsTitle: 'Tracés', pathsHelp: 'Choisissez un tracé, puis dessinez au doigt. Un nouveau trait remplace l’ancien.',
      placed: 'posé', notPlaced: 'à poser', drawn: 'tracé', notDrawn: 'à tracer',
      rulerHint: 'Glissez d’un point à un autre pour mesurer.', drawHint: 'Dessinez au doigt : {name}.',
      toolsTitle: 'Outils', ghostLegend: 'Tracé net = respecté · pointillé = brisé',
      ghostOn: 'Indices affichés', ghostOff: 'Indices masqués',
      okMark: 'respecté', koMark: 'brisé', naMark: 'pas encore posé',

      says: 'dit', reply: 'Réponse', alreadyAsked: 'A déjà répondu', noToken: 'Plus de jeton',
      scoutCardTitle: 'Éclaireur', scoutVerified: 'Fait vérifié sur le terrain', scoutNone: 'Aucun fait révélé.',
      scoutEmpty: 'Plus rien à révéler', askBtn: 'Poser une question', scoutBtn: 'Envoyer l’éclaireur',
      suspected: 'Soupçonné', nobody: 'Aucun témoin.',
      statusOk: 'respecté par votre carte', statusKo: 'brisé par votre carte', statusNa: 'pas encore vérifiable',

      missing: 'Il manque {n} élément(s) sur la carte. Le roi sera moins exigeant sur ce qui manque, mais ce sera compté en erreur.',
      completeSure: 'Tout est en place.',
      resultTitle: 'Verdict du roi', detail: 'Détail', detailShow: 'Voir le détail', detailHide: 'Masquer le détail',
      vOk: 'juste', vNear: 'approché', vKo: 'raté', vMissing: 'absent', gap: 'écart : {d} j',
      liarsTitle: 'Qui se trompait', unmasked: 'Démasqué', unnoticed: 'Passé inaperçu',
      falseSuspect: 'Soupçon injustifié : {name} disait vrai.', noScoutBadge: 'Sans éclaireur',
      thirdStarNeed: 'Pour la 3e étoile, il faut aussi soupçonner les témoins fautifs avant de remettre la carte.',
      newBest: 'Nouveau meilleur score !', legendTruth: 'Vraie carte', legendYours: 'Votre carte',
      exported: 'Image prête.', exportFail: 'Impossible d’exporter l’image ici.',
      endOfV0: 'Fin de la version test : les contrées 3 à 8 arrivent bientôt.',

      settingsTitle: 'Réglages', sound: 'Sons', vibration: 'Vibration', textSize: 'Taille du texte', colorblind: 'Mode daltonien',
      on: 'activé', off: 'désactivé', exportSave: 'Exporter la sauvegarde', importSave: 'Importer une sauvegarde',
      resetYes: 'Effacer', savedOk: 'Sauvegarde importée.', importFail: 'Fichier de sauvegarde illisible.',
      saveText: 'Zone de sauvegarde (copiez ou collez ce texte)', importBtn: 'Importer ce texte',
      about: 'Zéro pub, zéro achat. Fait par Keismey Studio.',

      tutStep: 'Tutoriel {i}/{n}', tutNext: 'Suivant', tutSkip: 'Passer', tutDone: 'Compris',
      tut1: 'Touchez Odo dans le Carnet.',
      tut2: 'Chaque phrase devient un indice dans le carnet.',
      tut3: 'Ouvrez Outils, puis glissez le Moulin Haut sur le parchemin.',
      tut4: 'Utilisez la règle-journées pour mesurer entre deux repères.',
      tut5: 'Deux témoignages se contredisent ? Posez une Question.',
      tut6: 'Remettez la carte quand vous êtes prêt.',

      oneDay: 'une journée', armHint: 'Touchez le parchemin pour poser : {name}.',
      holdToSave: 'Maintenez l’image appuyée pour l’enregistrer.', download: 'Télécharger', copy: 'Copier', copied: 'Copié.',
      exportTitle: 'Votre carte', zoomIn: 'Zoom +', zoomOut: 'Zoom −', hintSelected: 'Tampon sélectionné : {name}.',
      resume: 'Reprendre', unplacedWarn: 'À poser',
      unitDay: 'j', daysWord: 'journée(s)',
      caps: { N: 'N', NE: 'NE', E: 'E', SE: 'SE', S: 'S', SW: 'SO', W: 'O', NW: 'NO' }
    },
    en: {
      title: 'The Cartographer',
      tagline: 'Draw the world, one testimony at a time.',
      version: 'V0 · test',
      play: 'Play', continue_: 'Continue', atlas: 'Grand Atlas', notebook: 'Notebook', tools: 'Tools',
      submit: 'Submit map', ask: 'Question ({n} left)', scout: 'Scout ({n} left)',
      ruler: 'Day ruler', ghost: 'Show clues', suspect: 'I suspect this witness', single: 'Single source',
      night: 'At night', confirm: 'Hand this map to the king?', result: 'Score: {s}% · {ok} of {t} places correct',
      liar: '{name} was lying: {motif}', retry: 'Retry', next: 'Next region', export_: 'Export map (PNG)',
      settings: 'Settings', lang: 'Language', reset: 'Erase save?', install: 'Add to home screen',
      offline: 'Offline: all set.', error: 'Oops, saving failed.',

      back: 'Back', start: 'Begin', close: 'Close', notYet: 'Not yet', handIn: 'Submit', erase: 'Erase',
      region: 'Region {n}', stars: '{n} star(s)', best: 'Best: {s}%', locked: 'Locked', soon: 'Soon',
      soonText: 'Regions 3 to 8 arrive in the next version.',
      kingHint: 'The king adds', atlasText: 'The regions you have charted for the king.',
      orlanNotes: 'Orlan’s notes', orlanNote: 'Orlan’s note no. {n}', noNotes: 'No notes found yet.',

      move: 'Move', draw: 'Draw', drawPath: 'Draw: {name}', undo: 'Undo', removeStamp: 'Remove',
      recenter: 'Recenter', eraseStroke: 'Erase stroke', pin: 'Highlight', unpin: 'Stop highlighting',
      stampsTitle: 'Stamps', stampsHelp: 'Drag a stamp onto the parchment. Release it off the map to take it back.',
      pathsTitle: 'Strokes', pathsHelp: 'Pick a stroke, then draw with your finger. A new stroke replaces the old one.',
      placed: 'placed', notPlaced: 'to place', drawn: 'drawn', notDrawn: 'to draw',
      rulerHint: 'Drag from one point to another to measure.', drawHint: 'Draw with your finger: {name}.',
      toolsTitle: 'Tools', ghostLegend: 'Solid = respected · dotted = broken',
      ghostOn: 'Clues shown', ghostOff: 'Clues hidden',
      okMark: 'respected', koMark: 'broken', naMark: 'not placed yet',

      says: 'says', reply: 'Reply', alreadyAsked: 'Already answered', noToken: 'No token left',
      scoutCardTitle: 'Scout', scoutVerified: 'Fact verified on the ground', scoutNone: 'No fact revealed.',
      scoutEmpty: 'Nothing left to reveal', askBtn: 'Ask a question', scoutBtn: 'Send the scout',
      suspected: 'Suspected', nobody: 'No witness.',
      statusOk: 'respected by your map', statusKo: 'broken by your map', statusNa: 'cannot be checked yet',

      missing: '{n} element(s) are missing from the map. They will count as errors.',
      completeSure: 'Everything is in place.',
      resultTitle: 'The king’s verdict', detail: 'Details', detailShow: 'Show details', detailHide: 'Hide details',
      vOk: 'correct', vNear: 'close', vKo: 'missed', vMissing: 'missing', gap: 'off by {d} d',
      liarsTitle: 'Who was wrong', unmasked: 'Unmasked', unnoticed: 'Went unnoticed',
      falseSuspect: 'Unfounded suspicion: {name} was telling the truth.', noScoutBadge: 'No scout',
      thirdStarNeed: 'For the 3rd star, you must also suspect the faulty witnesses before submitting.',
      newBest: 'New best score!', legendTruth: 'True map', legendYours: 'Your map',
      exported: 'Image ready.', exportFail: 'Cannot export the image here.',
      endOfV0: 'End of the test version: regions 3 to 8 are coming soon.',

      settingsTitle: 'Settings', sound: 'Sound', vibration: 'Vibration', textSize: 'Text size', colorblind: 'Colorblind mode',
      on: 'on', off: 'off', exportSave: 'Export save', importSave: 'Import a save',
      resetYes: 'Erase', savedOk: 'Save imported.', importFail: 'Unreadable save file.',
      saveText: 'Save area (copy or paste this text)', importBtn: 'Import this text',
      about: 'No ads, no purchases. Made by Keismey Studio.',

      tutStep: 'Tutorial {i}/{n}', tutNext: 'Next', tutSkip: 'Skip', tutDone: 'Got it',
      tut1: 'Tap Odo in the Notebook.',
      tut2: 'Every sentence becomes a clue in the notebook.',
      tut3: 'Open Tools, then drag the Upper Mill onto the parchment.',
      tut4: 'Use the day ruler to measure between two landmarks.',
      tut5: 'Two testimonies disagree? Ask a Question.',
      tut6: 'Submit the map when you are ready.',

      oneDay: 'one day', armHint: 'Tap the parchment to place: {name}.',
      holdToSave: 'Press and hold the image to save it.', download: 'Download', copy: 'Copy', copied: 'Copied.',
      exportTitle: 'Your map', zoomIn: 'Zoom +', zoomOut: 'Zoom −', hintSelected: 'Stamp selected: {name}.',
      resume: 'Resume', unplacedWarn: 'To place',
      unitDay: 'd', daysWord: 'day(s)',
      caps: { N: 'N', NE: 'NE', E: 'E', SE: 'SE', S: 'S', SW: 'SW', W: 'W', NW: 'NW' }
    }
  };

  var lang = 'fr';
  var I18n = {
    get lang() { return lang; },
    set: function (l) { lang = D[l] ? l : 'fr'; },
    t: function (k, vars) {
      var s = (D[lang][k] != null ? D[lang][k] : D.fr[k]);
      if (typeof s !== 'string') return s != null ? s : k;
      if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]);
      return s;
    },
    loc: function (o) { return o ? (o[lang] != null ? o[lang] : o.fr) : ''; },
    caps: function () { return D[lang].caps; },
    /* nombre de journées : 1,5 j (fr) / 1.5 d (en) */
    days: function (n) {
      var r = Math.round(n * 4) / 4, txt = (Math.round(r * 100) / 100).toString();
      if (lang === 'fr') txt = txt.replace('.', ',');
      return txt + ' ' + D[lang].unitDay;
    },
    dict: D
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
  else root.I18n = I18n;
})(typeof window !== 'undefined' ? window : globalThis);
