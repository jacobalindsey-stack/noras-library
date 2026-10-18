/* =====================================================================
   Nora's Library — the list of games on the front page.

   To add a game: copy one entry, change it, save. It appears as the
   next act on the playbill, with the next Roman numeral.

   key     short id, letters only
   title   shown on the playbill
   kind    the kind of game, shown under the title
   platforms  where it plays well, best first: 'PC', 'iPad', 'iPhone'
   blurb   two or three sentences for the preview, in the game's own voice
   howto   one line on controls
   shots   preview images in previews/: gameplay first, then the title screen
   href    where the game lives (a file like "game.html" or a folder "game/")
   ground  the cameo's background color (from the game's own art)
   foil    the emblem's gold color (from the game's own art)
   emblem  the inside of a 64x64 SVG drawn in currentColor
   ===================================================================== */
window.NORA_GAMES = [
  {
    key: 'algol',
    title: 'Mirror of Algol',
    kind: 'Retro turn-based RPG',
    platforms: ['PC', 'iPad', 'iPhone'],
    blurb: "Alys wakes on cold tile in Glass Camineet, a city of mirror-stone under one pale moon and its impossible reflection. Everyone knows her name. She remembers nothing but a single word: home. Gather a party, fight turn-based battles, and choose between two very different endings.",
    howto: "Arrow keys to move, Z to confirm, X to go back. On a touch screen an on-screen pad appears.",
    shots: ['previews/algol-play.jpg', 'previews/algol-title.jpg'],
    href: 'algol.html',
    ground: '#0b0640',
    foil: '#e0a86a',
    emblem: '<circle cx="32" cy="20" r="10"/><path d="M10 34h44"/><circle cx="32" cy="48" r="10" stroke-dasharray="2.5 3.5"/>'
  },
  {
    key: 'blackthorn',
    title: 'Blackthorn Manor',
    kind: 'Spellcasting action adventure',
    platforms: ['PC', 'iPad', 'iPhone'],
    blurb: "Juniper Blackthorn just flunked her coven exam, and Spark is the only spell she can cast. On Halloween night her long-vanished great-aunt writes: “Come at once. Bring the cat.” Inside Blackthorn Manor every clock reads 11:59, and has for thirty years. A big adventure, made for many sittings.",
    howto: "Arrow keys to move, J to cast, K to act, L to dash, I for the cat. A gamepad or the on-screen buttons work too.",
    shots: ['previews/blackthorn-play.jpg', 'previews/blackthorn-title.jpg'],
    href: 'blackthorn.html',
    ground: '#1c1222',
    foil: '#e8a83a',
    emblem: '<path d="M8 56V32l12-10 12 10 12-10 12 10v24z"/><path d="M28 56v-7a4 4 0 0 1 8 0v7"/><rect x="14" y="38" width="5" height="6" fill="currentColor" stroke="none"/><rect x="45" y="38" width="5" height="6" fill="currentColor" stroke="none"/><path d="M46 4a8 8 0 1 0 9 11a6.5 6.5 0 1 1 -9 -11z" fill="currentColor" stroke="none"/>'
  },
  {
    key: 'adriatica',
    title: 'Adriatica',
    kind: 'Top-down puzzle adventure',
    platforms: ['PC', 'iPad', 'iPhone'],
    blurb: "Midnight in Diocletian’s Palace, Split. With her Nona’s old book and the city’s cats as guides, Mira Novak hunts for thirteen Egyptian sphinx fragments hidden across the old town. A story-rich puzzle quest for ages 9–12.",
    howto: "Arrow keys or WASD to walk, Space to look and talk, J for Mira’s sketchbook. Tap and drag on a touch screen.",
    shots: ['previews/adriatica-play.jpg', 'previews/adriatica-title.jpg'],
    href: 'adriatica/',
    ground: '#0f263b',
    foil: '#d8b67b',
    emblem: '<path d="M14 58V32a18 18 0 0 1 36 0v26"/><path d="M22 58V32a10 10 0 0 1 20 0v26"/><path d="M29 9h6l-1 7h-4z" fill="currentColor"/><path d="M32 34l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="currentColor" stroke="none"/>'
  },
  {
    key: 'adriatica2',
    title: 'Adriatica II',
    kind: 'Point-and-click adventure',
    platforms: ['iPad', 'PC'],
    blurb: "Summer on the Croatian coast. Floating off Kašjuni, Mira hears one enormous held note rising from under the sea, and follows four voices to Omiš, Brač and Korčula. A painted point-and-click story with 3D vision puzzles.",
    howto: "Click or tap: pick a verb, then something in the painting. Best on an iPad held sideways.",
    shots: ['previews/adriatica2-play.jpg', 'previews/adriatica2-title.jpg'],
    href: 'adriatica2/',
    ground: '#1f4a55',
    foil: '#f7d094',
    emblem: '<path d="M32 8v34"/><path d="M35 11l15 27H35z"/><path d="M29 17L17 38h12z"/><path d="M12 44h40l-6 7H18z"/><path d="M6 58c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0"/>'
  },
  {
    key: 'catbakery',
    title: 'The Cat Bakery',
    kind: 'Cozy bakery sim',
    platforms: ['PC', 'iPad', 'iPhone'],
    blurb: "Bake living cat-pastries, serve a town of cats, and journey toward the legendary Cinnamon Roll Cat. Start in an alley garage and work your way up to grander bakeries.",
    howto: "Click or tap. On a phone, turn it sideways. Your bakery saves automatically.",
    shots: ['previews/catbakery-play.jpg', 'previews/catbakery-title.jpg'],
    href: 'catbakery/',
    ground: '#2d1a35',
    foil: '#f2c14e',
    emblem: '<path d="M12 54c0-14 9-24 20-24s20 10 20 24z"/><path d="M19 37l1-10 7 5M45 37l-1-10-7 5"/><path d="M25 44q2 2 4 0M35 44q2 2 4 0"/><path d="M27 20c-3-3 3-5 0-8M37 20c-3-3 3-5 0-8"/>'
  },
  {
    key: 'apprenticeship',
    title: 'The Long Apprenticeship',
    kind: 'Caravan survival strategy',
    platforms: ['PC', 'iPad', 'iPhone'],
    blurb: "Every five years the apprentices walk to Halois to be licensed. This year caravans are vanishing, and a quiet thing called the Hollowing dims the Lore wherever it touches. Lead your caravan and its bonded Beasts across six wildlands.",
    howto: "Click or tap to choose. Three difficulties: Apprentice, Keeper and Grand Keeper.",
    shots: ['previews/apprenticeship-play.jpg', 'previews/apprenticeship-title.jpg'],
    href: 'apprenticeship/',
    ground: '#1a1915',
    foil: '#d4a24c',
    emblem: '<path d="M4 50l16-22 9 11 8-10 23 21z"/><path d="M31 50c-5 3 6 6-1 10"/><path d="M48 7v6M45 10h6"/>'
  }
];
