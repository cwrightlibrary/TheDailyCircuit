/* ------------------------------------------------------------------
   The Daily Circuit — the running order.

   Order here is the order on the site. To add, remove, or reorder a
   game, edit this array; nothing else needs to change.

   mode:  "embed"  shown inside the page (default)
          "tab"    has to open in its own window (the site refuses to be framed)
   width: the frame width this game looks best at — "fit" | "narrow" | "wide"
          (still overridable per game from the width control)
   tag:   the small category label
   ------------------------------------------------------------------ */

window.CIRCUIT_GAMES = [
  {
    id: 'wordle',
    name: 'Wordle',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    note: 'Five letters, six tries',
    tag: 'Words',
    mode: 'tab',
    width: 'narrow',
    why: 'The New York Times sends X-Frame-Options: DENY, so Wordle cannot be displayed inside another page.'
  },
  {
    id: 'connections',
    name: 'Connections',
    url: 'https://www.nytimes.com/games/connections',
    note: 'Sort sixteen words into four groups',
    tag: 'Words',
    mode: 'tab',
    width: 'narrow',
    why: 'The New York Times sends X-Frame-Options: DENY, so Connections cannot be displayed inside another page.'
  },
  {
    id: 'metazooa',
    name: 'Metazooa',
    url: 'https://metazooa.com',
    note: 'Find the animal by walking the tree of life',
    tag: 'Biology',
    width: 'fit'
  },
  {
    id: 'flora',
    name: 'Metaflora',
    url: 'https://flora.metazooa.com/?utm_source=metazooa&utm_medium=referral',
    note: 'The same hunt, for a plant',
    tag: 'Biology',
    width: 'fit'
  },
  {
    id: 'globle',
    name: 'Globle',
    url: 'https://globle-game.com',
    note: 'The map gets hotter as you close in',
    tag: 'Geography',
    width: 'wide'
  },
  {
    id: 'globle-org',
    name: 'Globle',
    url: 'https://globle.org/?',
    note: 'Mystery country, hotter or colder',
    tag: 'Geography',
    width: 'wide'
  },
  {
    id: 'worldle',
    name: 'Worldle',
    url: 'https://worldlegame.io/?',
    note: 'Name the country from its silhouette',
    tag: 'Geography',
    width: 'fit'
  },
  {
    id: 'hogwords',
    name: 'HogWords',
    url: 'https://mugglenet.com/games/hogwords/',
    note: 'Wizarding word, six guesses',
    tag: 'Words',
    width: 'narrow'
  },
  {
    id: 'tradle',
    name: 'Tradle',
    url: 'https://games.oec.world/en/tradle/',
    note: 'Guess the country from what it exports',
    tag: 'Economy',
    width: 'narrow'
  },
  {
    id: 'episode',
    name: 'Episode',
    url: 'https://episode.wtf',
    note: 'A TV show, revealed in stills',
    tag: 'Screen',
    width: 'narrow'
  },
  {
    id: 'framed',
    name: 'Framed',
    url: 'https://framed.wtf',
    note: 'A film, revealed in six frames',
    tag: 'Screen',
    width: 'narrow'
  },
  {
    id: 'flagsgame',
    name: 'Flags',
    url: 'https://flagsgame.net/?utm_source=framed&utm_medium=link&utm_campaign=games_link',
    note: 'The daily flag game',
    tag: 'Geography',
    width: 'fit'
  },
  {
    id: 'flagle',
    name: 'Flagle',
    url: 'https://flagle.org',
    note: 'Flag, uncovered square by square',
    tag: 'Geography',
    width: 'narrow'
  },
  {
    id: 'anthropeum',
    name: 'Anthropeum',
    url: 'https://anthropeum.com',
    note: 'Place and date ten artifacts',
    tag: 'History',
    width: 'fit'
  },
  {
    id: 'majority',
    name: 'Majority',
    url: 'https://www.majoritygame.com/home',
    note: 'Guess what everyone else guessed',
    tag: 'Crowd',
    width: 'narrow'
  },
  {
    id: 'raddle',
    name: 'Raddle',
    url: 'https://raddle.quest',
    note: 'Transform one word into another',
    tag: 'Words',
    width: 'narrow'
  },
  {
    id: 'closeword',
    name: 'CloseWord',
    url: 'https://closeword.org',
    note: 'Hunt the word by semantic heat',
    tag: 'Words',
    width: 'narrow'
  }
];
