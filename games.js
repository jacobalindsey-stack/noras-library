/* =====================================================================
   Nora's Library — the list of games on the front page.

   To add a game: copy one entry, change it, save. It appears as the
   next act on the playbill, with the next Roman numeral.

   key     short id, letters only
   title   shown on the playbill
   kind    the kind of game, shown under the title
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
    href: 'algol.html',
    ground: '#0b0640',
    foil: '#e0a86a',
    emblem: '<circle cx="32" cy="20" r="10"/><path d="M10 34h44"/><circle cx="32" cy="48" r="10" stroke-dasharray="2.5 3.5"/>'
  },
  {
    key: 'blackthorn',
    title: 'Blackthorn Manor',
    kind: 'Spellcasting action adventure',
    href: 'blackthorn.html',
    ground: '#1c1222',
    foil: '#e8a83a',
    emblem: '<path d="M8 56V32l12-10 12 10 12-10 12 10v24z"/><path d="M28 56v-7a4 4 0 0 1 8 0v7"/><rect x="14" y="38" width="5" height="6" fill="currentColor" stroke="none"/><rect x="45" y="38" width="5" height="6" fill="currentColor" stroke="none"/><path d="M46 4a8 8 0 1 0 9 11a6.5 6.5 0 1 1 -9 -11z" fill="currentColor" stroke="none"/>'
  },
  {
    key: 'adriatica',
    title: 'Adriatica',
    kind: 'Top-down puzzle adventure',
    href: 'adriatica/',
    ground: '#0f263b',
    foil: '#d8b67b',
    emblem: '<path d="M14 58V32a18 18 0 0 1 36 0v26"/><path d="M22 58V32a10 10 0 0 1 20 0v26"/><path d="M29 9h6l-1 7h-4z" fill="currentColor"/><path d="M32 34l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="currentColor" stroke="none"/>'
  },
  {
    key: 'adriatica2',
    title: 'Adriatica II',
    kind: 'Point-and-click adventure',
    href: 'adriatica2/',
    ground: '#1f4a55',
    foil: '#f7d094',
    emblem: '<path d="M32 8v34"/><path d="M35 11l15 27H35z"/><path d="M29 17L17 38h12z"/><path d="M12 44h40l-6 7H18z"/><path d="M6 58c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0"/>'
  },
  {
    key: 'catbakery',
    title: 'The Cat Bakery',
    kind: 'Cozy bakery sim',
    href: 'catbakery/',
    ground: '#2d1a35',
    foil: '#f2c14e',
    emblem: '<path d="M12 54c0-14 9-24 20-24s20 10 20 24z"/><path d="M19 37l1-10 7 5M45 37l-1-10-7 5"/><path d="M25 44q2 2 4 0M35 44q2 2 4 0"/><path d="M27 20c-3-3 3-5 0-8M37 20c-3-3 3-5 0-8"/>'
  },
  {
    key: 'apprenticeship',
    title: 'The Long Apprenticeship',
    kind: 'Caravan survival strategy',
    href: 'apprenticeship/',
    ground: '#1a1915',
    foil: '#d4a24c',
    emblem: '<path d="M4 50l16-22 9 11 8-10 23 21z"/><path d="M31 50c-5 3 6 6-1 10"/><path d="M48 7v6M45 10h6"/>'
  }
];
