// ============================================================================
//  SPHINXES QUEST — GAME CONTENT (the editable heart of the game)
// ----------------------------------------------------------------------------
//  Everything a designer tunes lives here: tiles, scenes (as ASCII maps),
//  entities, interactables, dialogue scripts, fragments and visions.
//  The engine (play.html) reads this file and renders it.
//  To add a room: add a SCENE. To add a puzzle/talk: add an INTERACTABLE +
//  a SCRIPT. To add a fragment: add to FRAGMENTS + a VISION. No engine edits.
// ============================================================================

export const TILE_PX = 16;

// ── TILE KINDS ──────────────────────────────────────────────────────────────
// solid: blocks movement.  draw: how the engine paints the 16×16 cell.
// c=base color, alt=checker partner, top/bot=edge strips, grout=mortar lines.
export const TILES = {
  void:     { solid: true,  draw: 'flat',  c: '#0a0806' },
  // — interior (Nona's apartment) —
  wood:     { solid: false, draw: 'wood',  c: '#7a5a36', alt: '#6e5030' },
  rug:      { solid: false, draw: 'rug',   c: '#8a3b2e', accent: '#d9a441' },
  wall:     { solid: true,  draw: 'wall',  c: '#cdbfa6', top: '#e3d8c2', bot: '#a8997c' },
  wallDk:   { solid: true,  draw: 'flat',  c: '#9a8a6e' },
  window:   { solid: true,  draw: 'window',c: '#cdbfa6', glass: '#9ec3d8' },
  bed:      { solid: true,  draw: 'bed',   c: '#b8455a', sheet: '#e9d6b8', wood: '#5a3f24' },
  shelf:    { solid: true,  draw: 'shelf', c: '#5a3f24', books: ['#8a3b2e','#3b5a8a','#d9a441','#4a6b4a'] },
  table:    { solid: true,  draw: 'table', c: '#6e4e2c', top: '#8a6438' },
  sofa:     { solid: true,  draw: 'sofa',  c: '#4a6b7a', cush: '#5f86a0', hi: '#7aa6c0', wood: '#5a3f24' },
  chair:    { solid: true,  draw: 'chair', c: '#7a5636', seat: '#9a7448' },
  counter:  { solid: true,  draw: 'counter', c: '#c8b89a', top: '#e2d6ba', dk: '#9a8a6a', metal: '#aeb6ba' },
  rugTile:  { solid: false, draw: 'rug',   c: '#7a3550', accent: '#e0b25a' },
  // — courtyard (Peristyle) —
  flag:     { solid: false, draw: 'flag',  c: '#cda468', alt: '#c09558', grout: '#a0854c' },
  step:     { solid: false, draw: 'step',  c: '#b89a68', edge: '#a08850' },
  shadow:   { solid: false, draw: 'flat',  c: '#7a6240' },
  stone:    { solid: true,  draw: 'stone', c: '#3a2c1a', alt: '#4a3c28', dk: '#2a1e12' },
  plinth:   { solid: true,  draw: 'plinth',c: '#bb9a68', hi: '#d2b481', dk: '#876b50' },
  colBase:  { solid: true,  draw: 'plinth',c: '#bb9a68', hi: '#d2b481', dk: '#876b50' },
  // — alley / stairwell —
  cobble:   { solid: false, draw: 'cobble',c: '#9a8763', alt: '#8c7a58' },
  stairs:   { solid: false, draw: 'stairs',c: '#b0a079', edge: '#8a7a55' },
  door:     { solid: false, draw: 'door',  c: '#5a3f24', panel: '#6e4e2c' },
  plant:    { solid: true,  draw: 'plant', c: '#4a6b3a', pot: '#8a5a3a' },
  // — sacred interiors (Cathedral / Vestibule) —
  marble:   { solid: false, draw: 'marble',c: '#cfc4ad', alt: '#c4b8a0', vein: 'rgba(255,255,255,.12)' },
  tomb:     { solid: true,  draw: 'tomb',  c: '#2f2937', dk: '#221d2b', hi: '#3c3548' },
  niche:    { solid: true,  draw: 'niche', c: '#1a1626', wall: '#2a2336' },
  altar:    { solid: true,  draw: 'altar', c: '#c9aa6a', dk: '#9a7a44', hi: '#e0c382' },
  // — fish market / Riva waterfront (bright white limestone) —
  whiteStone:{ solid: false, draw: 'whiteStone', c: '#ece4d2', alt: '#e2d8c2', grout: '#c9bda0' },
  quay:     { solid: true,  draw: 'quay',  c: '#d8ccb2', hi: '#efe6d0', dk: '#b0a081' },
  sea:      { solid: true,  draw: 'sea',   c: '#3f7e96', dk: '#2e6379', hi: '#7fb6c6' },
  fishtable:{ solid: true,  draw: 'fishtable', c: '#e8dcc2', leg: '#6f5430', ice: '#cfe0e4' },
  crate:    { solid: true,  draw: 'crate', c: '#a07a44', hi: '#bb914f', dk: '#6f5430' },
  awning:   { solid: true,  draw: 'awning',c: '#bf4a3a', alt: '#efe6d0' },
  bakery:   { solid: true,  draw: 'bakery' },
  sundial:  { solid: false, draw: 'sundial', base: '#d8cba8', ring: '#b09a5e', mark: '#9a854e', gnomon: '#7a5a2a' },
  // — Vrtal garden (bright white stone + Split greenery + the red granite head) —
  whiteWall:{ solid: true,  draw: 'whiteWall', c: '#e6ddc8', top: '#f4eedd', bot: '#c6bb9e' },
  redhead:  { solid: true,  draw: 'redhead', c: '#9c3b2a', dk: '#742a1e', hi: '#c25a44' },
  cypress:  { solid: true,  draw: 'cypress', c: '#2f5436', dk: '#22402a', hi: '#3f6e44', trunk: '#5a3f24' },
  hedge:    { solid: true,  draw: 'hedge',   c: '#3f6b3f', hi: '#5e8a4f', dk: '#2b4a2b' },
  fountain: { solid: true,  draw: 'fountain',c: '#dcd0b6', water: '#5fa0b8', hi: '#a6d4e2' },
  vine:     { solid: true,  draw: 'vine',    c: '#3f6b3a', hi: '#5f8f4a', wall: '#e6ddc8' },
  flowerbed:{ solid: true,  draw: 'flowerbed', c: '#5a3f2a', f1: '#d96a8a', f2: '#e8c64e', f3: '#c08ad0' },
  grass:    { solid: false, draw: 'grass',   c: '#6f9a5a', alt: '#638e50' },
  // — drainage tunnels beneath the palace (wet Roman stone + water channels) —
  wetStone: { solid: false, draw: 'wetStone', c: '#3a4048', alt: '#333941', sheen: 'rgba(150,180,200,.10)' },
  tunWall:  { solid: true,  draw: 'tunWall',  c: '#2a2e34', hi: '#3a4048', dk: '#1c1f24' },
  channel:  { solid: true,  draw: 'channel',  c: '#2b5566', dk: '#1e3d49', hi: '#5fa0b8' },
  poolWater:{ solid: true,  draw: 'poolWater',c: '#2e6379', dk: '#22485a', hi: '#7fb6c6' },
  grate:    { solid: false, draw: 'grate',    c: '#3a4048', bar: '#181b20' },
  // — Palace cellars: chunky Roman brick + barrel vaults —
  brickWall:{ solid: true,  draw: 'brickWall', c: '#7a5a3c', dk: '#513a24', hi: '#9a7550', mortar: '#33261a' },
  vaultRib: { solid: false, draw: 'vaultRib',  c: '#3a3048', rib: '#5a4e72', dk: '#241d30' },
  cellarFloor:{ solid: false, draw: 'cellarFloor', c: '#4c4636', alt: '#443e30', grout: '#2c2820' },
  // — City Museum (Papalić Palace): Venetian Gothic, white stone, pointed arches —
  gothicWall:{ solid: true,  draw: 'gothicWall', c: '#e8e2d2', dk: '#c9c1ab', hi: '#f4f0e4', arch: '#b3aa90' },
  gothicFloor:{ solid: false, draw: 'gothicFloor', c: '#e9e3d3', alt: '#dcd4c0', grout: '#c2b9a0' },
  gothicArch:{ solid: true,  draw: 'gothicArch', c: '#e8e2d2', sky: '#aebfce', stone: '#cfc6ae' },
  // — Archaeological Museum: modernist glass curtain walls, light streaming —
  glassWall:{ solid: true,  draw: 'glassWall', mull: '#9aa4ac', pane: '#cfe0e8', hi: '#eef6fa', frame: '#6f797f' },
  modFloor: { solid: false, draw: 'modFloor', c: '#dcdad2', alt: '#d2cfc5', fleck: 'rgba(120,120,110,.25)' },
};

// ── FRAGMENTS (the 13 + keystone) ───────────────────────────────────────────
export const FRAGMENTS = [
  { id: 0,  roman: '0',     name: "Nona's Shard",       loc: "Nona's apartment", color: '#b0442e', got: false },
  { id: 1,  roman: 'I',     name: 'The Carved Eye',     loc: 'The Peristyle',    color: '#ffd766', got: false,
    real: 'The intact black-granite sphinx still sits in the Peristyle, the colonnaded heart of Diocletian\u2019s Palace. It\u2019s the only one of Split\u2019s sphinxes that kept its head.', fact: 'It has human hands holding an offering vessel instead of lion\u2019s paws \u2014 a New Kingdom royal detail showing the pharaoh giving gifts to the gods. Most visitors walk right past it.' },
  { id: 2,  roman: 'II',    name: 'The Missing Jaw',    loc: 'Temple of Jupiter',color: '#d8c39a', got: false,
    real: 'The headless sphinx sits just outside the Temple of Jupiter (now the Baptistery), a short walk from the Peristyle.', fact: 'The temple has one of the finest barrel-vaulted stone ceilings in the Roman world. The palace has been battered by centuries of storms \u2014 lightning really did strike the bell tower and send masonry crashing down more than once.' },
  { id: 3,  roman: 'III',   name: "The Pharaoh's Cartouche", loc: 'Archaeological Museum', color: '#e8e0c8', got: false,
    real: 'The white-limestone Amenhotep III sphinx lives in Split\u2019s Archaeological Museum, one of the oldest museums in Croatia.', fact: 'Its hieroglyphs are still legible after 3,400 years, naming the pharaoh \u201cNeb-Maat-Re.\u201d Scholars think the Peristyle sphinx may have been re-inscribed by Ramses II, who was notorious for carving his name over older kings\u2019 monuments.' },
  { id: 4,  roman: 'IV',    name: "The Lion's Paw",     loc: 'City Museum',      color: '#9a8a6e', got: false,
    real: 'The sphinx fragment missing its front is kept at the City Museum, housed in the Gothic Papali\u0107 Palace.', fact: 'In Egypt, sphinxes were protective, benevolent temple guardians \u2014 nothing like the deadly riddle-asking sphinx of Greek myth. The lion\u2019s body meant not speed but stillness: eternal, unmoving watchfulness.' },
  { id: 5,  roman: 'V',     name: 'The Belly Text',     loc: 'Palace Cellars',   color: '#7a86a8', got: false,
    real: 'A small beheaded sphinx sits in the palace substructures \u2014 the vast vaulted cellars beneath Diocletian\u2019s Palace (yes, the \u201cGame of Thrones\u201d cellars).', fact: 'These halls sat filled with rubble and forgotten for centuries, which is exactly why they survived so intact. Feral cats have ruled them for generations.' },
  { id: 6,  roman: 'VI',    name: 'The Offering Vessel',loc: 'Fish Market',      color: '#c98a4a', got: false,
    real: 'The Riva waterfront and the bustling fish market (Ribarnica) sit just outside the palace\u2019s western wall.', fact: 'Croatia holds roughly 5,000 Egyptian artifacts from before 642 AD \u2014 a staggering number for a small Adriatic country, most of it brought back by Diocletian.' },
  { id: 7,  roman: 'VII',   name: 'The Cobra Crown',    loc: 'Bell Tower',       color: '#d9a441', got: false,
    real: 'The bell tower (campanile) of the Cathedral of St. Domnius rises above the Peristyle. Its climb of roughly 173 steep, open steps gives the best view in Split.', fact: 'The uraeus \u2014 the royal cobra on a pharaoh\u2019s brow \u2014 marked its wearer as keeper of Egypt\u2019s two horizons, sunrise and sunset. From the top you can read the palace\u2019s Roman grid plan below \u2014 it really is laid out on precise, deliberate geometry.' },
  { id: 8,  roman: 'VIII',  name: 'The Nemes Headdress',loc: 'Vrtal Garden',     color: '#b0442e', got: false,
    real: 'A famous red-granite Egyptian head is built right into a wall in the Vrtal garden area of the old town, half-hidden among the greenery.', fact: 'Scholar Unkovi\u0107 counted thirteen Egyptian fragments in the palace: \u201cone mostly intact sphinx, four damaged sphinx, six parts of sphinx, and one Egyptian head of red granite.\u201d This is that head.' },
  { id: 9,  roman: 'IX',    name: 'The Dreaming Heart', loc: 'The Round Hall',   color: '#c85a6a', got: false,
    real: 'The Cathedral of St. Domnius was originally Diocletian\u2019s own mausoleum \u2014 the emperor who brought the sphinxes now lies nowhere in the church built on his tomb.', fact: 'Inside stand columns of real Aswan granite, imported from Egypt with the sphinxes. Diocletian was the only Roman emperor to voluntarily retire \u2014 he said he\u2019d rather grow cabbages in his Split garden than rule.' },
  { id: 10, roman: 'X',     name: 'The Broken Spine',   loc: 'Drainage Tunnels', color: '#8a98a8', got: false,
    real: 'Beneath the palace runs an ancient Roman drainage system \u2014 a piece of engineering still partly functional after seventeen centuries.', fact: 'Some sphinx damage came not from vandals but from accidents: stones falling, cargo dropped. The Peristyle sphinx itself was harmed by masonry falling from the bell tower after lightning strikes.' },
  { id: 11, roman: 'XI',    name: 'The Forelegs',       loc: 'The Vestibule',    color: '#d2b481', got: false,
    real: 'The Vestibule is the great circular hall between the Peristyle and Diocletian\u2019s apartments \u2014 its dome long open to the sky.', fact: 'Its acoustics are extraordinary; klapa singers perform there today for the way the round room carries a voice. It was built as a grand domed entrance to the emperor\u2019s private quarters.' },
  { id: 12, roman: 'XII',   name: 'The Last Cartouche', loc: "Nona's keystone",  color: '#caa85a', got: false,
    real: 'The keystone\u2019s hidden name is invented for the game \u2014 but re-inscription was real. Egyptian monuments were routinely re-carved as one king erased another.', fact: 'Why the Peristyle sphinx alone kept its head remains a genuine unsolved mystery of the palace. In this story\u2019s telling, the keepers always protected the Speaker \u2014 the one sphinx that must keep its eyes and mouth, because one day it would need to ask the question.' },
  { id: 13, roman: 'XIII',  name: 'The Golden Eyes',    loc: 'The Peristyle',    color: '#ffe880', got: false,
    real: 'The golden eyes are the story\u2019s invention \u2014 but stand for the real wonder that started it all: authentic Egyptian sphinxes, thousands of years old, sitting quietly in a Croatian city square.', fact: 'Egyptian guardian sphinxes were benevolent protectors of sacred places. In a sense they still are \u2014 watched over now by Split\u2019s famous street cats.' },
  { id: 14, roman: '✦',     name: 'The Keystone',       loc: "Nona's tile",      color: '#ffce5a', got: false, keystone: true },
];

// ── BOOK (Nona's book + chapter narration — the "story screens") ─────────────
// Longer, book-styled narrative drawn straight from the game's story. Shown via
// the {book:'id'} script effect in a parchment reader overlay. Each page is a
// string (paragraphs split on \n); a page can instead be {title,kicker,text}.
export const BOOK = {
  // The big opening exposition — pulled from the shelf in Nona's apartment.
  opening: {
    title: 'The Thirteen Sphinxes',
    sub: "from Nona's shelf",
    pages: [
      { kicker: "Nona's book · I", title: 'The Guardians of Stone',
        text: 'The book is older than you are, bound in cracked leather, and there is a sphinx pressed into the cover in flaking gold. The Croatian inside is old-fashioned — long sentences, the way people wrote a hundred years ago — but you can read it, the way Mom taught you on winter nights, and the pictures carry whatever the words leave out.\nWhen the Roman emperor Diocletian built his enormous palace here in Split, seventeen hundred years ago, he brought treasures home from every corner of the empire he ruled. From Egypt he brought sphinxes — real ones, ancient even then, carved a thousand years before Rome existed.' },
      { kicker: "Nona's book · II", title: 'What the Sphinxes Are',
        text: 'In Egypt, a sphinx was not a monster. It did not ask riddles or devour travelers — that is the Greek story, and a much later one. An Egyptian sphinx was a guardian: a lion\u2019s body for strength, a human head for wisdom, set at the doors of temples and tombs to keep watch over sacred things. Patient. Unmoving. Kind, in its stony way.\nBut guarding was only half their work. In Egypt they were called Dawn-Keepers: stone that remembers every sunrise it has ever witnessed. They stood at the temple gates to keep the count of days — every dawn for a thousand years stored in the stone, like honey in a comb.' },
      { kicker: "Nona's book · III", title: 'The Sun-Clock',
        text: 'Here is the secret the book whispers: Diocletian was the only Roman emperor who ever chose to stop being emperor. He was tired of power. He built his palace as an enormous, hidden sun-clock — courtyards, columns and halls aligned so the light walks through them in a great yearly round — because all he wanted was to watch the days turn, and grow his garden.\nA sun-clock of that size needs keepers. So he sent for the greatest keepers of days the world had ever made. The sphinxes were not stolen trophies. They were invited — and the stone, the book insists, consented to come. The cats came with them, as they always had: keepers of the small hours, the night-shift of the same watch.' },
      { kicker: "Nona's book · IV", title: 'Thirteen Pieces',
        text: 'A scholar once counted what was left: thirteen Egyptian fragments scattered across the old town — one nearly whole sphinx, four damaged ones, six loose pieces, and a single red-granite head built into a garden wall.\nOn this page of Nona\u2019s book, thirteen little sphinx figures are drawn in faded ink. Most are crossed out. In the margin, in handwriting you recognize as your grandmother\u2019s, someone has written: the cats remember what we forgot.' },
      { kicker: "Nona's book · V", title: 'The Cats',
        text: 'The street cats of Split are famous — hundreds of them, sunning on warm stone, slipping through drainage grates, tolerated by everyone. The book says they are not ordinary. It says they came in the cargo holds with the sphinxes: temple cats of Egypt, charged with guarding the guardians across the centuries.\nA sphinx has a lion\u2019s body. A lion is a cat. And when a piece of sphinx is near, the book says, the cats will show you. Watch what they watch.' },
      { kicker: "Nona's book · VI", title: 'Before the Solstice',
        text: 'The last page is a warning, underlined twice. Storms broke the sphinxes — lightning, earthquake, one hard landing at the docks — but every piece was hidden, not lost: hidden by keepers, at the places the midsummer sun touches. On the summer solstice the old stone \u201cwakes up all the way,\u201d and the pieces must be gathered before the solstice moon sets — for what wakes will have something to ask, and someone must be there to answer.\nYou close the book. Outside the window, on the wall, a large orange cat with one ear is sitting very still, staring straight up at you.' },
    ],
  },
  // Return chapters — read with Nona when you come home between fragments.
  return1: {
    title: 'Nona Knows', sub: 'the morning after',
    pages: [
      { kicker: 'Chapter · The Mentor', title: 'Nona Knows',
        text: 'You put the carved eye on the kitchen table between the coffee cups. Nona does not look surprised. She looks the way people look when a thing they have dreaded and hoped for finally arrives.\n\u201cWhen I was your age,\u201d she says, \u201cthe cats showed me things too. I thought I was dreaming. But the sphinxes remember, Mira. They were keepers of the days in Egypt. The emperor who built this place was tired — tired of being obeyed. He wanted to watch the sun cross his courtyard and grow his cabbages. So he asked the greatest keepers in the world to come and keep the days with him. Storms broke them. Time scattered them. But every piece was hidden, not lost — hidden by people like us, in places only the longest day knows. Find them all before the solstice. The longest day holds the shortest night.\u201d' },
      { kicker: 'Chapter · The Mentor', title: 'The First Fragment',
        text: 'She reaches into her apron and sets a small pouch beside your eye-fragment. Inside is a worn chip of red granite, carved with half a hieroglyph. \u201cMy first one,\u201d she says. \u201cI found it in the garden when I was nine, at sunrise. The cats led me to it.\u201d\n\u201cWhy stop?\u201d you ask. She only smiles, and pours you more coffee than a twelve-year-old should have. \u201cBecause it was not finished with me. It was waiting for you. Find them all before the solstice, draga. The cats will show you the way. Keso already has.\u201d' },
    ],
  },
  return2: {
    title: 'What We Carry', sub: 'halfway',
    pages: [
      { kicker: 'Chapter · Halfway', title: 'What We Carry',
        text: 'Half the pages of your sketchbook are full now. You spread the fragments on Nona\u2019s table and she touches each one as if greeting an old friend — the jaw, the cartouche, the lion\u2019s paw, the belly-text, the offering vessel.\n\u201cYou\u2019ve seen their memories,\u201d she says. It isn\u2019t a question. \u201cThe dawns over two seas. The great storm. The long dark under the palace.\u201d She nods slowly. \u201cA memory kept is a kind of home. That is what we do for them, Mira. We are keepers too. We keep.\u201d' },
      { kicker: 'Chapter · Halfway', title: 'The Longest Day Comes',
        text: 'She glances at the window, where the light is already staying longer each evening. \u201cThe solstice is close. When it comes, you will feel the old world shining through the new one — light that lingers, stone that hums like a held note. It is nothing to be afraid of. It is the palace remembering what it was built to do. And the cats will be with you.\u201d\nShe presses bread and cheese into your bag for the road, the way she always does. \u201cGo. Finish it. And come home when it is done.\u201d' },
    ],
  },
};

// ── VISIONS (cinematic memory sequences) ────────────────────────────────────
// Each frame: a caption over a hieroglyph-lit golden world.
export const VISIONS = {
  peristyle_eye: {
    img: 'assets/visions/peristyle_eye.png?v=2',
    tint: '#1a1838',
    frames: [
      { text: 'The square shifts. The columns are new — painted red and blue, torches burning in iron brackets.', sub: 'DIOCLETIAN’S PALACE · 305 AD' },
      { text: 'An avenue of sphinxes at dawn, catching first light — as it has caught every first light for a thousand years, storing each one in the stone like honey in a comb.', sub: 'KEMET · DAWN' },
      { text: 'Then the sea: sailors singing at the oars, dolphins racing the hull, the sphinx tasting salt air for the first time — and through the night watches, a lantern swinging like a small sun.', sub: 'THE CROSSING' },
      { text: 'And then — a single carved eye, looking back at you across seventeen centuries.', sub: 'FRAGMENT I · THE CARVED EYE' },
    ],
  },
  jupiter_jaw: {
    img: 'assets/visions/jupiter_jaw.png?v=3',
    tint: '#241830',
    frames: [
      { text: 'A night of sky-splitting storm. Lightning strikes the bell tower — once, twice — and stones fall ringing through the rain.', sub: 'THE GREAT STORM' },
      { text: 'Dawn after the storm. The town’s stonemasons wade through the puddles, gathering every fallen fragment by hand, careful as surgeons.', sub: '' },
      { text: 'And one old mason, a cat on his shoulder, whispers to the stone in his hands: “Hide them where the longest day can find them. Someone who reads the cats will come.”', sub: '' },
      { text: 'The grief you braced for never comes. What rises instead is a secret, patiently kept: the pieces were never lost. They were hidden — for someone like you.', sub: 'FRAGMENT II · THE MISSING JAW' },
    ],
  },
  museum_cartouche: {
    img: 'assets/visions/museum_cartouche.png?v=2',
    tint: '#1d2236',
    frames: [
      { text: 'Glass cases. The hum of cold air. A guard dozing by the door. And on a lit pedestal — a slab of granite covered in carved ovals.', sub: 'ARCHAEOLOGICAL MUSEUM · TONIGHT' },
      { text: 'The carving pulls you in. The glass is gone. A pharaoh’s court — Amenhotep III, golden, immense, flanked by sphinxes — and a scribe carving the king’s name with pride and care, one perfect sign at a time.', sub: 'KEMET · THE COURT OF AMENHOTEP III' },
      { text: 'Then, centuries later: another pharaoh. Ramses II orders the old name chiselled out and his own carved in its place. One scribe, one chisel, one name swapped for another. Even kings steal from kings.', sub: 'THE RENAMING' },
      { text: 'But the sphinx sits unmoved beneath both names. The stone keeps the first name AND the second, the way it keeps every sunrise. Names change; the count of days does not.', sub: '' },
      { text: 'And later still: workers brushing dust away in a Split courtyard, a scholar reading a pharaoh’s name aloud after 3,400 years — the name arriving at last, like a message in a bottle.', sub: 'SPLIT · 1875' },
      { text: 'The granite warms under your fingers. One oval lifts free, warm as a coal.', sub: 'FRAGMENT III · THE PHARAOH’S CARTOUCHE' },
    ],
  },
  lionpaw_vision: {
    img: 'assets/visions/lionpaw_vision.png?v=2',
    tint: '#241d30',
    frames: [
      { text: 'A vaulted Gothic hall, all pointed arches and cold grey stone. On a pedestal, a single carved paw — too large, too perfect, lion and something more.', sub: 'CITY MUSEUM · TONIGHT' },
      { text: 'Then gold grass to the horizon. Lions at play in the last light of dusk — cubs tumbling, mothers blinking slow in the day’s last warmth.', sub: 'THE SAVANNA · DUSK' },
      { text: 'And above them, on its temple perch, the sphinx watches — still, content. It is not a lion. It is the idea of a lion: patience, warmth, watchfulness.', sub: '' },
      { text: 'A keeper does not chase the sun. A keeper waits for it. The carved paw loosens, and a piece of it is yours.', sub: 'FRAGMENT IV · THE LION’S PAW' },
    ],
  },
  belly_text: {
    img: 'assets/visions/belly_text.png?v=2',
    tint: '#181436',
    frames: [
      { text: 'The substructures. A forest of stone pillars holding up the whole palace, black water somewhere below, and cats — so many cats, all watching.', sub: 'PALACE CELLARS · DEEPER STILL' },
      { text: 'Then the ground shivers — an earthquake, old and impersonal as weather — and the floor above lets the sphinx down gently into the dark, amphorae settling around it like company.', sub: 'THE QUAKE · CENTURIES AGO' },
      { text: 'The dark is not lonely for long. Harvest songs still echo in the amphorae — and one day a cat slips in through a crack, curls against the warm belly-text, and the two keep the underground watch together.', sub: '' },
      { text: 'The Cellar Chorus sings the old lines back to you, note for note — the news of every dawn, carried down by cats for centuries — and the belly-stone loosens into your hands.', sub: 'FRAGMENT V · THE BELLY TEXT' },
    ],
  },
  tonko_vessel: {
    img: 'assets/visions/tonko_vessel.png?v=2',
    tint: '#2a1f12',
    frames: [
      { text: 'A harvest festival winds up from the water — music, garlands, children carrying flowers and honey-cakes. The whole harbour smells of thanksgiving.', sub: 'THE FESTIVAL · SPLIT HARBOUR, LONG AGO' },
      { text: 'They leave their gifts in the vessel the sphinx holds between its hands — flowers, honey-cakes, a wish for a safe crossing, a full net, one more good season.', sub: '' },
      { text: 'And the sphinx holds every gift. It keeps them all. It remembers every thanks ever whispered over that vessel — Tonko’s thirty years of luck among them, though he never knew to whom he spoke.', sub: '' },
      { text: 'The vessel-stone settles warm in your hands, full of other people’s hopes, and the bright market rushes back in around you.', sub: 'FRAGMENT VI · THE OFFERING VESSEL' },
    ],
  },
  belltower_cobra: {
    img: 'assets/visions/belltower_cobra.png?v=2',
    tint: '#241a3e',
    frames: [
      { text: 'A cobra rears on a pharaoh’s brow — the uraeus, golden, catching the first light over the Nile. One dawn, of thousands the crown has worn.', sub: 'THE URAEUS · FIRST LIGHT' },
      { text: 'Then, centuries later and a whole sea away: the same crown catching first light over the Adriatic. The sphinx’s quiet astonishment, kept forever in the stone — dawn is the same everywhere.', sub: 'TWO DAWNS' },
      { text: 'And from up here you see what the sphinx knew: the palace laid out below in perfect lines, courtyards and halls set so the light walks through them in a great yearly round. The palace is a clock. The fragments are its hours.', sub: '' },
      { text: 'The little cobra warms in your palm, and the wind on the belfry softens to almost a purr. Seven of thirteen.', sub: 'FRAGMENT VII · THE COBRA CROWN' },
    ],
  },
  cathedral_heart: {
    img: 'assets/visions/cathedral_heart.png?v=2',
    tint: '#1c1630',
    frames: [
      { text: 'Cats keep the outside watch. Inside, eight columns hold up the dome of the one room that keeps its own time — candle-lit, patient, still.', sub: 'THE ROUND HALL · TONIGHT' },
      { text: 'A tired old man kneels in garden dirt in a wide sun hat, growing cabbages. The most powerful man in the world — and when they begged him to rule again, he said he would rather grow his cabbages.', sub: 'SPLIT · THE EMPEROR’S GARDEN' },
      { text: 'He tends his rows while the light crosses the great hall behind him, hour by hour, exactly as he built it to. He is not waiting for anything. That is the whole secret. He is watching the days turn.', sub: '' },
      { text: 'At sunset he rests a hand on the sphinx. “You kept the days for the pharaohs. Keep them now for everyone who comes after me — the fishermen, the grandmothers, the children. The dawn belongs to all of them.”', sub: '' },
      { text: 'The heart-stone comes away warm in your hands, and light — not heavy at all. The best thing to keep, it turns out, is time itself.', sub: 'FRAGMENT IX · THE DREAMING HEART' },
    ],
  },
  vestibule_forelegs: {
    img: 'assets/visions/vestibule_forelegs.png?v=2',
    tint: '#181642',
    frames: [
      { text: 'The round hall stands open to the stars, and the whole city of cats has come — the walls, the niches, the broken rim of the dome, all lined with silent gold-eyed shapes.', sub: 'THE VESTIBULE · SOLSTICE NIGHT' },
      { text: 'For one heartbeat the dome closes overhead — whole again, painted with stars, ringed with torches — and you are standing in two centuries at once.', sub: '' },
      { text: 'The hum beneath the floor is not a warning. It is an orchestra tuning up — thirteen voices finding one note, almost ready after seventeen hundred years of rests.', sub: '' },
      { text: 'And above the floor, golden dust-motes swirl into an almost-shape — reaching toward you, curious and unfinished, like a word on the tip of the tongue. The Gathering. You catch the moonlight, the hum settles into a purr, and the forelegs come loose, still warm.', sub: 'FRAGMENT XI · THE FORELEGS' },
    ],
  },
  garden_nemes: {
    img: 'assets/visions/garden_nemes.png?v=2',
    tint: '#1a2a18',
    frames: [
      { text: 'A sculptor sets the great red head into a fresh white wall, the nemes stripes still bright with paint — a king’s headdress, meant to be seen, meant to last forever.', sub: 'THE HEADDRESS · LONG AGO' },
      { text: 'Forever is long. Walls weather, paint fades, and slowly the green comes: moss, then ivy, then whole curtains of vine reaching up to cover the royal stone.', sub: '' },
      { text: 'But the garden does not bury the head. The roots cradle it. The vines hold it up — and each midsummer morning they part, just so, to let the sun touch the stone for exactly one hour. Here, the sphinx was never lost — only kept, by living things.', sub: '' },
      { text: 'The nemes-stone lifts away warm and clean, and the red face goes on watching the garden it has always watched. Eight of thirteen.', sub: 'FRAGMENT VIII · THE NEMES HEADDRESS' },
    ],
  },
  spine_break: {
    img: 'assets/visions/spine_break.png?v=2',
    tint: '#12202a',
    frames: [
      { text: 'A galley grinds against the quay. Chains, ropes, shouting men — the sphinx swings out over the water on a groaning wooden crane, black granite against a hot blue sky.', sub: 'THE UNLOADING · DIOCLETIAN’S SHIPS' },
      { text: 'A rope slips. Just one. The great stone drops the last few feet and strikes the dock — and its back cracks clean across with a sound like a bell breaking.', sub: '' },
      { text: 'No vandal. No enemy. Only a long voyage and one frayed rope. The crew cushions the cracked sphinx with sailcloth, and the harbour-master decides, gently: the broken one will rest below, “where the water sings and the stone can mend its dreams.”', sub: 'NOT ALL DAMAGE COMES FROM MALICE' },
      { text: 'The curved spine-stone settles into your hands, cool and heavy, its old wound fitting your palm. Ten of thirteen.', sub: 'FRAGMENT X · THE BROKEN SPINE' },
    ],
  },
  finale_eyes: {
    img: 'assets/visions/finale_eyes.png?v=3',
    tint: '#20160a',
    frames: [
      { text: 'The riddle answered, the sphinx bows its great head — and the two carved eyes in its face ignite, gold as the first light of the first morning.', sub: 'THE PERISTYLE · SOLSTICE MIDNIGHT' },
      { text: 'They were never lost at all. They were waiting — for the question to be asked, and answered, and the circle to be complete.', sub: '' },
      { text: 'Seventeen centuries of watching in the dark. Now the sphinx, at last, can see — and the first thing it sees is you.', sub: 'FRAGMENT XIII · THE GOLDEN EYES' },
    ],
  },
  finale_circle: {
    img: 'assets/visions/finale_circle.png?v=2',
    tint: '#1a1636',
    frames: [
      { text: 'The thirteen fragments rise off the stones — and they do not build one sphinx. They build all of them. Thirteen sphinxes, golden and clear as glass, standing in a ring around the court, facing outward.', sub: 'THE GUARDIAN CIRCLE' },
      { text: 'This is the stone showing you its complete count of days — its whole treasury, opened once, for you. Every era shines through at once: Roman columns, Egyptian gold, medieval bells, the lights of the city tonight, layered like transparent paintings.', sub: '' },
      { text: 'Beautiful. Ancient. Alive. For one whole heartbeat the Peristyle holds every moment it has ever known, and the cats sit in their rings and let it happen.', sub: '' },
      { text: 'Then, gently, The Gathering dissolves into the circle, and the light lets go. The fragments drift back to the ground and are only stone again — but the night feels washed clean, and warm.', sub: '' },
    ],
  },
  finale_dawn: {
    img: 'assets/visions/finale_dawn.png?v=2',
    tint: '#3a2a1a',
    frames: [
      { text: 'Dawn. Mira walks home through a waking city — delivery trucks, bakery smells, the first ferry horn across the water. Exhausted. Calm. The fragments heavy and quiet in her bag.', sub: 'MORNING' },
      { text: 'Nona is awake, making coffee, and she smiles the smile of someone who has always known. She does not ask where Mira has been. She pours a second cup — which she has never done before.', sub: '' },
      { text: 'Sfinga is back on her tile, purring. Mira opens her sketchbook: all thirteen pages full. On the last, she draws something new — herself, with Keso, in front of the sphinx. A guardian.', sub: '' },
      { text: 'The Peristyle at sunrise. The sphinx. A one-eared cat at its base. And if you look very closely, the stone eyes catch the first light — just for a moment. Then it is only stone.', sub: 'THE END' },
    ],
  },
};

// ── SCRIPTS (dialogue + scripted effects) ───────────────────────────────────
// Each step: { say, who } line, or an effect:
//   {flash}  {vision:id}  {give:fragId}  {set:flag}  {goto:scene,x,y}  {world:'sphinx'|'day'}
export const SCRIPTS = {
  intro: [
    { say: 'Split. First morning of summer. Nona’s apartment smells like lavender and old stone, and the sea is a blue stripe at the end of every street.', who: '' },
    { say: 'A whole summer here. Swimming off the rocks, gelato on the Riva, and a brand-new sketchbook to fill. Mom’s in Zagreb till Friday, so it’s just me and Nona.', who: 'MIRA' },
    { say: 'She promised the beach today — right after I unpack. Which will take four minutes.', who: 'MIRA' },
    { say: '…There’s a cat asleep on the kitchen tile. There is always a cat.', who: 'MIRA' },
    { say: 'Use the arrow keys or the on-screen pad to explore. Touch the ✦ button when something can be examined.', who: '' },
    { say: 'Nona keeps old books on that shelf. One has a sphinx on the cover — I should look at it before I do anything else.', who: 'MIRA' },
  ],
  sfinga_examine: [
    { say: 'Nona’s cat. Sfinga — “Sphinx.” Enormous, ancient, asleep on the same square tile she always picks.', who: 'MIRA' },
    { say: 'She cracks one eye at me. Goes back to sleep. Guarding her tile like it owes her money.', who: 'MIRA' },
  ],
  baka_chat: [
    { say: 'Nona looks up from her coffee. “Still here? The book won’t read itself, and the bread won’t fetch itself either.”', who: 'NONA' },
    { say: '“Go on, draga. The old stones have waited seventeen hundred years — but not for much longer. Follow the cats. They know the way before you do.”', who: 'NONA' },
  ],
  book_examine: [
    { say: 'The old book with the sphinx on the cover. Cracked leather, gold flaking off. Let me actually read this.', who: 'MIRA' },
    { book: 'opening' },
    { say: 'Thirteen fragments. Guardian cats. A deadline on the solstice. And a one-eared cat outside, staring at me. Okay. OKAY.', who: 'MIRA' },
    { set: 'sawBook' },
  ],
  window_examine: [
    { say: 'Rooftops, laundry lines, the bell tower catching the last of the sun. And cats. On every wall, every sill.', who: 'MIRA' },
    { say: 'One of them — a big orange tabby with one ear — is sitting on the wall, staring straight up at me.', who: 'MIRA' },
  ],
  baka_door: [
    { say: 'Nona’s voice from the kitchen: “Mira! Before you go chasing cats — bread, from the bakery by the Peristyle. Go, go, before they close.”', who: 'NONA' },
    { say: 'Bread first. Then… whatever that book was about. The Peristyle either way. Down the stairs and out.', who: 'MIRA' },
    { set: 'breadErrand' },
  ],
  bakery_buy: [
    { say: 'The little bakery off the square, still open. Warm bread smell, a paper bag, a few kuna. “Hvala!” One errand done.', who: 'MIRA' },
    { say: 'Nona’s bread, safe in my bag. Now — that black granite shape across the square. I know exactly what that is.', who: 'MIRA' },
    { set: 'gotBread' },
  ],
  peristyle_arrive: [
    { say: 'The Peristyle. The last tourists are leaving. The columns go gold in the low sun.', who: '' },
    { say: 'And there — the black granite sphinx. The real one. An actual Egyptian sphinx. In Croatia.', who: 'MIRA' },
    { say: 'It has human hands. Holding a little jar. Not lion’s paws — hands. Who carves that?', who: 'MIRA' },
    { say: 'First: Nona’s bread. There’s a striped bakery stall down by the south columns — the 🥖 marks it. Then I am absolutely going to touch that sphinx.', who: 'MIRA' },
    { set: 'sawPeristyleIntro' },
  ],
  sphinx_touch: [
    { say: 'A one-eared orange tabby is sitting at the sphinx’s base, tail curled over his paws, watching me like he’s been waiting all day.', who: 'MIRA' },
    { say: 'The cat from Nona’s window. Same torn ear, same steady stare. He blinks at me — slow, deliberate — then looks pointedly at the vessel in the sphinx’s hands.', who: 'MIRA' },
    { say: '“You want me to touch it. Don’t you.” He blinks again, slow as honey. Okay. Okay, cat. Let’s see.', who: 'MIRA' },
    { flash: true },
    { say: 'The stone is warm. Not sun-warm. Alive-warm — and the moment my fingers close on it, the Peristyle melts away.', who: 'MIRA' },
    { say: 'This is what the book meant. The sphinx is showing me its memory — a moment it lived through, seventeen centuries ago. I can’t change it. I can only watch, and remember.', who: '' },
    { vision: 'peristyle_eye' },
    { say: 'The vision fades. My hand is shaking. There’s a carved eye loose in the stone — it comes away in my palm.', who: 'MIRA' },
    { give: 1 },
    { say: '✎ A new clue for my sketchbook: “The stone counts sunrises.”', who: '' },
    { say: 'The cat bumps his head against my ankle. Once. Like: yes. Like: finally. I’m calling him Keso — he looks like a Keso.', who: 'MIRA' },
    { set: 'metKeso' },
    { set: 'gotFragment1' },
    { set: 'returnToNona' },
    { say: 'Keso looks west, at a low dark doorway across the square — then back at me, and pointedly up the alley toward home. Right. Nona’s bread is going cold, my head is spinning, and she needs to hear this. Home first — the rest can wait.', who: 'MIRA' },
  ],

  temple_locked: [
    { say: 'The low door to the old Temple. Keso sits down firmly in front of it and does not budge. Not yet, then.', who: 'MIRA' },
    { say: 'Nona first — her bread, and the rest of that book. The sketchbook says so too: home, up the alley, before anything else.', who: 'MIRA' },
  ],

  // ── Return-to-Nona beats (the story pauses; read the book; get the next errand) ──
  return_home_1: [
    { say: 'The apartment. Lavender and stone, and Nona at the table with two coffee cups already poured. She looks at my shaking hands and just… nods. “First — the bread.” She takes the warm loaf from my bag, sets it on the board, and cuts two thick slices.', who: '' },
    { say: 'I put the carved eye on the table. “Nona. The sphinx. It was WARM. And there was a cat, and — the cats are magic, aren’t they? They’re magic cats.”', who: 'MIRA' },
    { say: '“Magic?” She snorts into her coffee. “No, draga. The cats are employed. There is a difference. Sit. Drink. And listen.”', who: 'NONA' },
    { book: 'return1' },
    { say: 'She pressed her old red-granite fragment into my palm beside the eye. Two pieces now — and a name for the thing I’m doing.', who: 'MIRA' },
    { say: 'Her warning goes straight into my sketchbook, on the Weird Things I Noticed page: “the longest day holds the shortest night??” Underlined. Twice.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “Nona found hers at sunrise.”', who: '' },
    { set: 'didReturn1' },
    { set: 'deliveredBread' },
    { say: '“The cats will show you the rest,” she said. “Keso already has. Go west from the Peristyle, through the low door, to the old Temple — the headless one. Before the solstice, draga.”', who: 'NONA' },
    { say: 'The way west from the Peristyle is open now. Twelve to go.', who: '' },
  ],
  return_home_2: [
    { say: 'Home again, halfway through. Nona clears the table so I can lay them all out — jaw, cartouche, paw, belly-text, the offering vessel, the eye. Six pieces of a broken guardian.', who: '' },
    { say: 'She touches each one like she’s greeting an old friend. “You’ve seen their memories,” she says. Not a question.', who: 'MIRA' },
    { book: 'return2' },
    { set: 'didReturn2' },
    { say: 'She tucked bread and cheese into my bag for the road, the way she always does. “Finish it. And come home when it’s done.” The solstice is close now. I can feel it.', who: 'MIRA' },
  ],

  // ── Fragment #2 · Temple of Jupiter ──
  temple_arrive: [
    { say: 'A low, cold room. The famous barrel-vaulted ceiling arches overhead, carved with hundreds of stone coffers.', who: '' },
    { say: 'A tourist kid is being towed out by his dad as I slip in — he points at the sphinx and yells “KITTY!” He’s not wrong, exactly.', who: 'MIRA' },
    { say: 'In the centre: a sphinx with no head. Black granite, worn smooth. Its jaw is gone too — an old break, clean as storm-work.', who: 'MIRA' },
    { say: 'Two grey cats sit on either side of it, mirror images, perfectly still. Watching me.', who: 'MIRA' },
  ],
  headless_examine: [
    { say: 'The break is old and clean — storm-work, not hands. Nona’s book said lightning threw stones down from the bell tower more than once. The body stayed. It always stays.', who: 'MIRA' },
    { say: 'There’s a sundial set into the floor in front of it, and a blade of shadow from the vault lying across the stones.', who: 'MIRA' },
  ],
  jupiter_examine: [
    { say: 'The sundial is old — older than the room. The grey cats lean forward as I crouch beside it.', who: 'MIRA' },
    { puzzle: 'jupiter_dial' },
  ],
  jupiter_solve: [
    { flash: true },
    { say: 'The shadow-blade swings to the jackal and stops. Deep in the floor, a stone clicks.', who: '' },
    { vision: 'jupiter_jaw' },
    { say: 'A loose block lifts. Inside — a curve of carved granite. The sphinx’s missing jaw, light as a held breath.', who: 'MIRA' },
    { give: 2 },
    { say: '✎ A new clue for my sketchbook: “The fragments were hidden on purpose — at points the solstice sun touches.”', who: '' },
    { say: 'The grey cats rise together, press their heads to my shins once, and melt into the shadows. Two down. Eleven to go.', who: 'MIRA' },
    { set: 'gotFragment2' },
    { say: 'Keso is already trotting for the door, tail high. Back through the Peristyle and up the alley — somewhere off its east side, a museum door has quietly come unlatched. New page, sketchbook.', who: 'MIRA' },
  ],

  // ── Fragment #3 · Archaeological Museum ──
  museum_arrive: [
    { say: 'The museum’s back door was already unbolted. Of course it was — Keso slipped through a cat-flap and the latch was simply… open.', who: '' },
    { say: 'The lapidarium. Rows of Roman stones, and Egyptian ones too. Diocletian brought half of Egypt home with him.', who: 'MIRA' },
    { say: 'A black cat I’ve never seen watches from the top of a display case. It doesn’t blink. The Black Queen, I think.', who: 'MIRA' },
  ],
  cartouche_examine: [
    { say: 'A granite stela, lit from below. A royal name sealed inside an oval ring — a cartouche. The signs almost glow.', who: 'MIRA' },
    { say: 'The Black Queen taps the glass with one paw, in a slow rhythm. She wants me to read the name in the right order.', who: 'MIRA' },
    { puzzle: 'cartouche_glyphs' },
  ],
  cartouche_solve: [
    { flash: true },
    { say: 'As I name the last sign aloud, the oval’s seam splits with a sound like a held breath let go.', who: '' },
    { vision: 'museum_cartouche' },
    { say: 'A single cartouche-stone rests loose in my palm, warm as skin. Three — and I just read three-thousand-year-old Egyptian out loud, alone, at night, in a museum I’m not supposed to be in. Sketchbook, we are UNDERLINING today’s date.', who: 'MIRA' },
    { say: 'The Black Queen dips her head — the smallest bow — and is gone between the cases.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “The stone keeps every name it was ever given — even the crossed-out ones.”', who: '' },
    { give: 3 },
    { set: 'gotFragment3' },
  ],

  // ── Fragment #4 · City Museum ──
  citymuseum_arrive: [
    { say: 'The City Museum — a Gothic palace folded into the old stones. Pointed windows, glass cases with stone fragments, shelves of amphorae, a hall so quiet it swallows the sound of my own steps.', who: '' },
    { say: 'The exhibits are scattered along the walls — no signs telling me which one to look at first. Somewhere among them, one of the sphinxes.', who: 'MIRA' },
    { say: 'A grey tom is doing slow laps of the hall, like a guard who’s done this ten thousand nights. He pretends not to see me. He sees me.', who: 'MIRA' },
    { say: 'Keso sits down by the door and starts washing a paw. He’s not leading me anywhere here — this hall belongs to the grey tom.', who: 'MIRA' },
  ],
  greytom_pet: [
    { say: 'The grey tom slows near a shaft of window-light. He doesn’t stop — not exactly — he just lets me put a hand on his back as he passes.', who: 'MIRA' },
    { say: 'His fur is warm and dusty. He turns his head once, gives me the slowest possible blink, then keeps walking his patrol.', who: 'MIRA' },
    { say: 'But now, as he passes each exhibit, his eyes flick toward one particular case tucked into the back of the hall — a small carved sphinx among other stone fragments. He wants me to see it.', who: 'MIRA' },
    { set: 'pettedGreyTom' },
  ],
  lionpaw_examine: [
    { say: 'A carved sphinx, its great paw worn shiny — centuries of hands have touched it. Five smooth hollows, exactly paw-shaped.', who: 'MIRA' },
    { say: 'The grey tom sits and sets one paw down. Lifts it, sets it down. Showing me. Light the stones the way a lion sets its foot.', who: 'MIRA' },
    { puzzle: 'lionpaw_pads' },
  ],
  lionpaw_solve: [
    { flash: true },
    { say: 'The five hollows glow gold under my palm, and with a low grinding the paw gives up a single carved claw-stone.', who: '' },
    { vision: 'lionpaw_vision' },
    { say: 'The grey tom blinks once — slow, the cat way of saying I trust you — and pads off into the dark of the hall. Four now. I stay a minute anyway, hand on the worn paw, where a thousand other hands have been.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “A keeper doesn’t chase the sun. A keeper waits for it.”', who: '' },
    { give: 4 },
    { set: 'gotFragment4' },
  ],

  // ── Fragment #5 · Palace Cellars ──
  cellar_arrive: [
    { say: 'Down and down. The palace cellars — pillars like a stone forest, the air cold and wet, and everywhere the green coins of cats’ eyes.', who: '' },
    { say: 'Keso stopped at the top of the stair — sat, flicked his tail, wouldn’t follow. He leaves me to the cellar cats down here. Some places I go alone.', who: 'MIRA' },
    { say: 'Okay. It’s dark. It’s really dark, and something just dripped on my neck, and for about four seconds I want my mom. …Four seconds. Then I get my flashlight out. I didn’t come this far to be scared of a basement.', who: 'MIRA' },
    { say: 'In the centre, half-sunk in the floor, a sphinx’s body. Lines of text run the length of its belly — the Belly Text.', who: 'MIRA' },
  ],
  belly_examine: [
    { say: 'The belly-text is too worn to read by eye. But the cats here — the Cellar Chorus — they know it. They sing it in light.', who: 'MIRA' },
    { say: 'Four of them, eyes glowing in turn. Watch the order they sing… then sing it back.', who: 'MIRA' },
    { puzzle: 'belly_echo' },
  ],
  belly_solve: [
    { flash: true },
    { say: 'I echo the chorus, eye for eye, and the whole hall seems to exhale. The belly-stone shifts loose with a sound like a purr.', who: '' },
    { vision: 'belly_text' },
    { say: 'Five. Halfway and more — and the dark down here isn’t scary anymore. It’s just full of colleagues. The Cellar Chorus blinks once, together, and settles back into the dark.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “Even in the dark, the stone keeps counting — the cats bring it the news of each dawn.”', who: '' },
    { give: 5 },
    { set: 'gotFragment5' },
  ],

  // — Fragment #6 · The Fish Market (Tonko) —
  fishmarket_arrive: [
    { say: 'The Riva. White stone, white sun, the whole sea breathing in and out behind the fish tables. After the cellars, the brightness almost hurts.', who: '' },
    { say: 'A fishmonger spots my sketchbook and bellows across the tables: “Ej, mala! Draw my sea bass, he’s very handsome!” The whole row of them laughs. I kind of love this market.', who: 'MIRA' },
    { say: 'The market cats here are FAT. Sardine-fat. They don’t slink or hide — they own the place. And they’re all looking at one old man by a shed.', who: 'MIRA' },
  ],
  tonko_meet: [
    { say: 'Dobar dan! You’re Vera’s grandkid, the one always drawing. Come, come — mind the cats, they’ll have your sardine.', who: 'TONKO' },
    { say: 'That rock holding your door open — it’s got a face carved in it. Like the sphinx in the Peristyle. Where did you get it?', who: 'MIRA' },
    { say: 'That old thing? Pulled it up in my nets, oh, thirty years back. Ugly, heavy, perfect doorstop. Never let me down once.', who: 'TONKO' },
    { say: '…I really need that stone, Tonko. It’s important. I can’t pay you, but — could I draw you something? Your boat?', who: 'MIRA' },
    { say: 'Ha! Nobody’s drawn my Sv. Nikola in forty years. You make her look good, the rock is yours. Go on. Get her lines right.', who: 'TONKO' },
    { puzzle: 'tonko_sketch' },
  ],
  tonko_solve: [
    { flash: true },
    { say: 'You catch it — the high prow, the mast, the belly of the hull. Tonko leans over your sketchbook and goes very quiet.', who: '' },
    { say: 'That’s her. That’s my girl. You keep the rock, draughtsman. A fair trade — more than fair.', who: 'TONKO' },
    { say: 'The instant the doorstop touches my hands, the carved face warms, and the market and the sun fall away…', who: 'MIRA' },
    { vision: 'tonko_vessel' },
    { say: 'The Offering Vessel. Tonko’s door swings shut behind me — he doesn’t even notice, still smiling at the drawing. Best trade I’ll ever make.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “The vessel is open — it was made to receive.”', who: '' },
    { give: 6 },
    { set: 'gotFragment6' },
  ],

  // — Fragment #7 · The Bell Tower (the climb) —
  belltower_enter: [
    { say: 'The stair spirals up into the dark, narrow and worn smooth. A black shape slips up ahead of me — the Black Queen. She wants me to follow.', who: 'MIRA' },
    { goto: { scene: 'belltower', x: 15, y: 117 } },
  ],
  belltower_arrive: [
    { say: 'One hundred and seventy-three steps, Nona said. Open to the wind on every side. Dusk pouring in gold and the whole of Split shrinking below me.', who: '' },
    { say: 'The Black Queen is already halfway up, watching. My legs are jelly and I hate this and my hands won’t let go of the rail. But she waits. Cats don’t wait for anyone. She’s waiting for me.', who: 'MIRA' },
    { say: 'Use ← → to move, ↑ to jump up to the next step. Mind the wind gusts — they push. Climb to the glowing crown at the very top.', who: '' },
  ],
  belltower_solve: [
    { flash: true },
    { say: 'The last step. The belfry. The bells hang silent and the wind screams through them — and there, set into the highest stone, a small carved cobra glows gold.', who: '' },
    { vision: 'belltower_cobra' },
    { say: 'The Cobra Crown. Seven. Far below, the Black Queen yowls once — proud, maybe — and the long climb down is only steps. The view from up here… I’ll draw it forever.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “The palace is a clock. The fragments are its hours.” I’m sketching the sun-map across two whole pages.', who: '' },
    { give: 7 },
    { set: 'gotFragment7' },
    { goto: { scene: 'cathedral', x: 4, y: 5 } },
  ],

  // — Fragment #9 · Cathedral of St. Domnius (Diocletian’s Mausoleum) —
  cathedral_arrive: [
    { say: 'The Round Hall — the Emperor’s Resting Hall. Diocletian built it at the very centre of his palace, and the light crosses it in its own slow, deliberate time.', who: '' },
    { say: 'Eight columns. A stone dome. An empty tomb in the very middle. And candles — someone still lights candles down here, after seventeen hundred years.', who: 'MIRA' },
    { say: 'Keso stops at the doorway. Sits. Won’t come in — none of the cats will. Cats keep the outside watch. The Round Hall is the one room that keeps its own time, and I have to read it alone.', who: 'MIRA' },
  ],
  heart_examine: [
    { say: 'There’s a heart carved into the side of the old tomb — Egyptian, not Roman. Around it, little stones rest in a worn groove, each scratched with a sign.', who: 'MIRA' },
    { say: 'The museum sign said it: the old Egyptians weighed your heart against a feather. Too heavy, and you couldn’t pass. This heart is buried under heavy stones.', who: 'MIRA' },
    { puzzle: 'heart_scale' },
  ],
  heart_solve: [
    { flash: true },
    { say: 'One by one I lift the heavy stones away — anger, fear, regret — until only the light one is left, and the carved heart swings level with the feather.', who: '' },
    { vision: 'cathedral_heart' },
    { say: 'A panel behind the tomb slides back. The Dreaming Heart rests in the dark, warm as something alive. Nine.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “Diocletian didn’t bring keepers of an emperor. He brought keepers of the dawn — for everyone.”', who: '' },
    { give: 9 },
    { set: 'gotFragment9' },
    { say: 'Outside the doorway Keso stands and stretches. Beyond the Round Hall, the round Vestibule is open to the sky — and the way is clear.', who: '' },
  ],

  // — Fragment #11 · The Vestibule (Predvorje) —
  vestibule_arrive: [
    { say: 'The Vestibule. A perfect circle of stone, open to the night — the dome fell away centuries ago, and now the stars pour straight in.', who: '' },
    { say: 'It’s the solstice. The air is bright somehow, expectant — like the held breath before a concert begins. And the cats… every cat in Split is here, lining the walls, watching the floor.', who: 'MIRA' },
    { say: 'A blade of moonlight turns slowly around the room, touching each niche in turn. And under it, low as a heartbeat, something is humming.', who: 'MIRA' },
  ],
  forelegs_examine: [
    { say: 'The hum rises through a single worn stone under the open sky. The whole round room rings with it — the Vestibule was built to carry a voice.', who: 'MIRA' },
    { say: 'Four niches ring the walls. Only one answers the hum, glowing gold when the moonlight crosses it. Catch the light on that one.', who: 'MIRA' },
    { puzzle: 'forelegs_beam' },
  ],
  forelegs_solve: [
    { flash: true },
    { say: 'The moonlight strikes the resonant niche and the whole hall sings one long, low note. The humming stone splits open like a seed.', who: '' },
    { vision: 'vestibule_forelegs' },
    { say: 'The Forelegs — a length of carved granite, still warm from drumming. Eleven. Only the Golden Eyes remain… and whatever Nona has been hiding under that tile.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “They are almost ready to speak. Stone speaks once in a lifetime — and only in riddles.”', who: '' },
    { give: 11 },
    { set: 'gotFragment11' },
  ],

  // — Fragment #8 · The Vrtal Garden (the red-granite head) —
  garden_arrive: [
    { say: 'A green pocket of quiet behind the white walls — cypresses, a little fountain, cats asleep in the warm stone. After the tower, my legs are grateful.', who: '' },
    { say: 'And there, built right into the old wall: a huge red stone face. A pharaoh’s face, with the striped headdress. Half-swallowed by ivy. It’s been watching this garden for centuries.', who: 'MIRA' },
  ],
  garden_head: [
    { say: 'The head is red granite — older than the palace, older than Rome here. The nemes headdress is carved sharp, but the vines have grown thick right across the brow.', who: 'MIRA' },
    { say: 'The fragment’s set in the headdress itself, under the leaves. I can’t cut living vines… but the garden runs on the fountain. If I water the thirsty plants, maybe the climbing ones let go.', who: 'MIRA' },
    { puzzle: 'garden_vines' },
  ],
  garden_solve: [
    { flash: true },
    { say: 'The watered plants drink deep and uncurl, and the vines over the brow loosen and slide away — baring the blue-and-gold stripes of the nemes, clean in the sun.', who: '' },
    { vision: 'garden_nemes' },
    { say: 'The Nemes Headdress. Eight. The red face seems almost relieved — lighter, somehow, with the weight of the ivy gone. I sit on the fountain edge a while and just draw him. Some pages you don’t rush.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “Even the garden keeps the appointment.”', who: '' },
    { give: 8 },
    { set: 'gotFragment8' },
  ],

  // — Fragment #10 · The Drainage Tunnels (the Broken Spine) —
  tunnels_arrive: [
    { say: 'The grate drops me into cold, wet dark. Roman drainage — seventeen centuries old and still running. Somewhere ahead, water is moving.', who: '' },
    { say: 'I stand at the bottom of the ladder for a long minute. Nobody knows I’m down here. That thought has a weight to it, like a stone in a pocket.', who: 'MIRA' },
    { say: 'A kitten. Snow-white, spotless — down here? Impossible. It looks back at me, mews once, and trots off into the tunnel like it knows exactly where we’re going.', who: 'MIRA' },
    { say: 'No Keso this deep — just this little white ghost of a guide. Okay. One small brave thing, and then another. I follow it into the dark.', who: 'MIRA' },
  ],
  spine_examine: [
    { say: 'The kitten stops at a flooded pool. Down through the black water I can just see it — a long curved ridge of granite, like a cat arching its back. The Broken Spine.', who: 'MIRA' },
    { say: 'Too deep to reach. But these old channels still have sluice valves. If I open the right drains and shut the ones feeding this pool, the water should run off and lay the spine bare.', who: 'MIRA' },
    { puzzle: 'spine_flow' },
  ],
  spine_solve: [
    { flash: true },
    { say: 'The pool gurgles and sinks, inch by inch, until the granite spine lies gleaming and wet on the drained floor. The kitten pads down to it without a ripple.', who: '' },
    { vision: 'spine_break' },
    { say: 'The Broken Spine. Ten. Not all damage is malice — some things break simply from traveling far, and are cared for anyway. The white kitten is already gone, back into the dark. Thank you, little one.', who: 'MIRA' },
    { say: '✎ A new clue for my sketchbook: “Broken things are still keepers.”', who: '' },
    { give: 10 },
    { set: 'gotFragment10' },
  ],

  // — FINALE · The Peristyle, solstice midnight (Golden Eyes + the Guardian Circle) —
  finale_enter: [
    { say: 'It’s past midnight on the solstice. The Peristyle should be empty — but Keso is waiting at the steps, and beyond him… every cat in Split.', who: 'MIRA' },
    { goto: { scene: 'finale', x: 15, y: 20 } },
  ],
  finale_arrive: [
    { say: 'They sit in rings around the sphinx — hundreds of them, silent, facing inward. Keso at its feet. The Black Queen on a column. The Cellar Chorus. Even the little white kitten.', who: '' },
    { say: 'And the sphinx is glowing. Its black granite drinks the moonlight and gives back gold — warm, from somewhere deep inside. The vessel between its hands is open.', who: 'MIRA' },
    { say: 'Twelve fragments in my bag. Nona’s keystone in my hand. The cats are all looking at me now. It’s time.', who: 'MIRA' },
  ],
  finale_sphinx: [
    { say: 'The underside of Nona’s keystone is carved with signs I can finally read — the thirteenth cartouche, the sphinx’s own true name, waiting all along in my grandmother’s floor.', who: 'MIRA' },
    { say: 'And as my fingers trace the signs I see them — a chain of hands passing this stone down the centuries: mason to fisherman to gardener to grandmother to Nona. Every hand with a cat beside it.', who: 'MIRA' },
    { say: 'Read it right, and the vessel will open the rest of the way. Name the sphinx.', who: '' },
    { puzzle: 'last_cartouche' },
  ],
  finale_open: [
    { flash: true },
    { give: 12 },
    { give: 14 },
    { say: 'I speak the name aloud, and it lands in the silent square like a struck bell. The last cartouche warms and seals itself into the keystone.', who: '' },
    { say: 'I set the keystone into the open vessel. It fits like it was cut for this exact night — which, I understand now, it was.', who: 'MIRA' },
    { say: '✎ The last clue for my sketchbook: “The keystone is the question mark. It completes nothing — it asks.”', who: '' },
    { say: 'The keystone settles — and the sphinx’s stone eyes open. Golden. Behind it, golden dust-motes condense into thirteen faint, luminous sphinx-shapes. The Gathering, waiting.', who: '' },
    { say: 'And then the sphinx speaks — the only words it will say in my lifetime. Its voice is like warm stone and distant surf.', who: '' },
    { say: '“My cousins in Egypt guard with silence. But long ago a traveler from Greece taught me her trick — for a riddle is the only lock a stranger cannot force, and a friend cannot fail.”', who: 'THE SPHINX' },
    { say: '“I speak without a mouth and hear without ears. I have no body, but I come alive with wind. You met me in the Vestibule. What am I?”', who: 'THE SPHINX' },
    { say: 'The round hall that sings a voice back to you. “An echo,” I say — and the thirteen shapes ripple like water.', who: 'MIRA' },
    { say: '“The more of me you take, the more you leave behind. You have taken thousands of me since the day you arrived. What am I?”', who: 'THE SPHINX' },
    { say: 'Taken… and left behind? Photos? No — I don’t take photos, I draw. Breaths? The square is utterly silent. Keso’s tail ticks against the stones like a clock.', who: 'MIRA' },
    { say: 'And then I look down — at my own dusty sneakers on the moonlit stones. A whole summer of them. Up 173 steps, down every alley in Split. “Footsteps.” A second ripple, warmer.', who: 'MIRA' },
    { say: '“Two sisters are we. One gives birth to the other, and she, in turn, gives birth to the first. We have traded places since before the pharaohs — and tonight, tonight one of us is the longest she will ever be, and the other the shortest. Who are we?”', who: 'THE SPHINX' },
    { say: 'The square goes very still. Keso stretches out on the stones as if lying in a sunbeam that isn’t there. On the column top, the Black Queen’s eyes flash green in the dark.', who: '' },
    { say: 'Day cats. Night cats. And Nona’s warning, waiting on its sketchbook page since the very first morning. I feel the click.', who: 'MIRA' },
    { say: '“Day and Night,” I say. “Two sisters. You are Day and Night.”', who: 'MIRA' },
    { vision: 'finale_eyes' },
    { give: 13 },
    { say: '“Now you know what we keep. Not an emperor. Not a palace. Not even a secret. We keep the turning of the days — every dawn this stone has ever seen, held safe for everyone still to come.”', who: 'THE SPHINX' },
    { say: '“The emperor who brought us across the sea was tired of ruling men. He wanted only to watch the days turn, and he asked us to keep them turning long after him — for the fishermen, the grandmothers, the children, the cats.”', who: 'THE SPHINX' },
    { say: '“The pieces of us were hidden where the solstice sun walks, by keepers like you, so that one day a keeper like you would find them. Day gives birth to night. Night gives birth to day. And a guardian, little sister, gives birth to the next.”', who: 'THE SPHINX' },
    { say: 'One by one I lay the thirteen fragments in a circle on the old stones, following the spiral cut into the keystone. The cats watch every piece find its place.', who: '' },
    { ring: true },
    { vision: 'finale_circle' },
    { say: 'For one shining breath the Peristyle is whole — Roman, Egyptian, medieval, mine — all at once. Then the light softens, and the stones are just stones again. But the air is… lighter. Calm.', who: 'MIRA' },
    { say: 'Dawn breaks over the east wall and lands exactly on the sphinx — the sun-clock striking its greatest hour. The fragments settle. Keso bumps his head against my hand. And, for the first time, he purrs.', who: '' },
    { vision: 'finale_dawn' },
    { set: 'gameComplete' },
    { say: 'The cats stretch and disperse into the alleys, off to whatever cats go off to. Keso winds around my ankles once — slow, deliberate — and then he’s off ahead of me up the alley, tail high. Toward home.', who: 'MIRA' },
    { say: 'I follow him. The city is still asleep. My sketchbook is full and my hands smell like warm stone, and I can’t wait to tell Nona.', who: 'MIRA' },
    { goto: { scene: 'apartment', x: 10, y: 10 } },
  ],

  // Final scene: home with Nona — her last revelation, then back to the title.
  nona_final: [
    { say: 'The apartment. Lavender and stone, always. Nona is at the table with two coffee cups already poured. She looks at me — at my dusty knees and my shaking hands — and her eyes fill up, and she smiles.', who: '' },
    { say: '“Come. Sit. You did it. I knew you would.”', who: 'NONA' },
    { say: 'She reaches into the pocket of her cardigan and sets something on the table between us. A small carved sphinx eye. Warm. Familiar. And identical to the one I found on the Peristyle.', who: '' },
    { say: '“What… how?”', who: 'MIRA' },
    { say: '“My own,” she says. “The one I found when I was your age, at sunrise. I have kept it in my pocket for sixty-two years. It has been waiting for you.”', who: 'NONA' },
    { say: '“There is only one thing you still do not know, and I could not tell you until tonight. The sphinx does not choose the next keeper. The stone doesn’t know how. That is our job.”', who: 'NONA' },
    { say: '“Every keeper hides the pieces again — that much you have already guessed. But she also does one more thing. She chooses the child. She watches for the one who reads the cats. And when she is old, and it is her granddaughter’s summer, she brings her to Split — and lets the pieces find her.”', who: 'NONA' },
    { say: 'The whole summer rearranges itself in my head. The book “just lying out.” The bakery Nona sent me to — right past the sphinx. Sfinga guarding a floor-tile that just so happened to hide the keystone.', who: 'MIRA' },
    { say: '“You… you set the whole thing up. For me.”', who: 'MIRA' },
    { say: '“My grandmother set it up for me. Her grandmother set it up for her. Back and back and back, Mira, to a mason who caught a piece of stone as it fell from a burning tower and whispered to it in the rain.”', who: 'NONA' },
    { say: '“You are a Dawn-Keeper now. The palace is a clock, and you are one of its hands. One day — a long time from now — there will be a small girl who reads cats, and it will be your turn to bring her here, and let her find them.”', who: 'NONA' },
    { say: 'She slides her sphinx-eye across the table to me. It rests beside my own like two halves of the same warm heartbeat.', who: '' },
    { say: '“Keep it safe. Keep the dawns. And when the time comes, my darling — you’ll know exactly what to do.”', who: 'NONA' },
    { say: 'Outside the window, on the wall, Keso is sitting in the first light of the new day. He’s waiting for me. He always will be.', who: 'MIRA' },
    { set: 'sawEnding' },
    { flash: true },
    { say: '— The End —', who: '' },
    { say: '(Tap once more to close the sketchbook on this summer… and open a new one.)', who: '' },
    { restart: true },
  ],
  // ── FLAVOR: environmental interactables (real-world Split facts) ──
  flavor_columns: [
    { say: 'The stone is cool, and the red flecks catch the sunlight. Nona once told me these columns are Egyptian red granite from Aswan — quarried at the Nile\u2019s first cataract and shipped across the sea when the palace was built.', who: 'MIRA' },
    { say: 'She said the emperor wanted the stones to feel a little bit of home for the sphinxes. Two thousand miles from the desert, and they\u2019re still standing exactly where they were set.', who: 'MIRA' },
  ],
  flavor_cardo: [
    { say: 'The Cardo. The old Roman main street, running straight north through the palace. If I followed it long enough it would end at the harbour. Seventeen centuries of feet have polished these stones smooth.', who: 'MIRA' },
  ],
  flavor_ceiling: [
    { say: 'The barrel-vaulted ceiling arches overhead \u2014 coffered squares carved with rosettes and vines. Nona said it\u2019s one of the best-preserved Roman ceilings anywhere in the world.', who: 'MIRA' },
    { say: 'The rosettes were carved without a plan of the roof, just by feel. Every square is a little different. I could stare at them all day.', who: 'MIRA' },
  ],
  flavor_water: [
    { say: 'The harbour water is that ridiculous Adriatic clear \u2014 I can see silvery fish moving between the mooring ropes. Cold, even in June, brought up from the deep.', who: 'MIRA' },
    { say: 'Split has run a fish market on this exact spot for nine hundred years. The fishermen still bring in the same catch their great-grandfathers did: anchovies, sardines, sea bass.', who: 'MIRA' },
  ],
  flavor_fish: [
    { say: 'Crushed ice, silver bodies, one perfect octopus curled in a tin. A cat is trying to look casual next to it and failing.', who: 'MIRA' },
    { say: 'The fishmonger sees me looking and grins. \u201cAmerikanka?\u201d he asks. I nod. He hands me a wedge of dried fig for free.', who: 'MIRA' },
  ],
  flavor_fountain: [
    { say: 'A stone fountain still runs \u2014 fresh water piped in from an aqueduct Diocletian himself built. The same water the palace drank in 305 AD.', who: 'MIRA' },
    { say: 'Nona says people still fill bottles from it for luck. I cup my hand under the spout. It\u2019s so cold my teeth ache.', who: 'MIRA' },
  ],
  flavor_cypress: [
    { say: 'A cypress, tall and slim. In Dalmatia they plant them for memory \u2014 one at the birth of a child, one at the loss of someone loved. This one has to be a hundred years old at least.', who: 'MIRA' },
  ],
  flavor_palm: [
    { say: 'A Canary Island palm, pressed between two Roman walls like it was always meant to be there. The Riva down at the water is lined with them. Nona says her father planted a few of the oldest ones as a boy.', who: 'MIRA' },
  ],
  flavor_granite: [
    { say: 'One of the eight great columns holding up the dome. Real Egyptian granite, same as the ones in the Peristyle \u2014 shipped across the Mediterranean specifically for this room. They ring faintly when tapped.', who: 'MIRA' },
  ],
};

// ── SCENES ─────────────────────────────────────────────────────────────
// tiles: rows of chars resolved through `legend` (char → TILES key).
// Coordinates in interactables/exits/entities/spawn are in TILES (not pixels).
export const SCENES = {

  // ───────────────────────── BAKA'S APARTMENT ─────────────────────────
  apartment: {
    name: "Nona's Apartment",
    ambient: 'interior',
    tint: 'rgba(40,28,60,0.16)',     // warm dusk interior
    legend: {
      '#': 'wall', 'n': 'window', '.': 'wood', 'r': 'rug', 'R': 'rugTile',
      'b': 'bed', 's': 'shelf', 't': 'table', 'd': 'door', 'p': 'plant',
      'S': 'sofa', 'c': 'chair', 'k': 'counter',
    },
    tiles: [
      '############n#n############',
      '#.bb.........kkkkk........#',
      '#.bb.........k......ttt..s#',
      '#............k......ccc..s#',
      '#...SS.......k...........s#',
      '#...SS..RR...............p#',
      '#.......RR................#',
      '#....rr...................#',
      '#....rr...................#',
      '#...........rr............#',
      '#...........rr...........p#',
      '#........................##',
      '#############dd############',
    ],
    spawn: { x: 16, y: 8, dir: 2 },
    entities: [
      { id: 'sfinga', type: 'cat', variant: 'cream', x: 7.5, y: 5.5, behavior: 'sleep', faceLeft: false },
      { id: 'baka', type: 'person', sprite: 'baka', x: 15, y: 3, dir: 2 },
    ],
    interactables: [
      { x: 7, y: 5, w: 2, h: 2, name: 'Sfinga', script: 'sfinga_examine', icon: '✦' },
      { x: 25, y: 2,  w: 1, h: 2, name: "Nona's book", script: 'book_examine', icon: '✦' },
      { x: 11, y: 0,  w: 3, h: 1, name: 'Window', script: 'window_examine', icon: '✦' },
      { x: 15, y: 3, w: 1, h: 1, name: 'Nona', script: 'baka_chat', icon: '✦' },
    ],
    exits: [
      { x: 12, y: 12, w: 2, h: 1, to: 'alley', tx: 5, ty: 2, gate: 'breadErrand', gateScript: 'baka_door' },
    ],
    triggers: [
      { when: 'gameComplete', unless: 'sawEnding',  run: 'nona_final' },
      { when: 'gotFragment6', unless: 'didReturn2', run: 'return_home_2' },
      { when: 'returnToNona',  unless: 'didReturn1', run: 'return_home_1' },
    ],
    onEnter: 'intro',
  },

  // ───────────────────────── ALLEY / STAIRWELL ─────────────────────────
  alley: {
    name: 'Palace Alley',
    ambient: 'court',
    tint: 'rgba(30,26,52,0.20)',
    legend: {
      '#': 'stone', 'x': 'stone', '.': 'cobble', 'S': 'stairs',
      'd': 'door', 'p': 'plant', '~': 'shadow',
    },
    tiles: [
      '#####dd#####',
      '#####..#####',
      '#....SS....#',
      '#....SS....#',
      'd..........#',
      'd.p........d',
      '#..........d',
      '#........p.#',
      'd..........#',
      'd~~.......d#',
      '#.........d#',
      '#....dd....#',
      '#....##....#',
    ],
    spawn: { x: 5, y: 2, dir: 2 },
    entities: [
      { id: 'alleyCat', type: 'cat', variant: 'grey', x: 8, y: 6,
        behavior: 'patrol', route: [[8,6],[3,9],[8,10],[2,5],[6,4],[9,8],[4,7]], faceLeft: true },
    ],
    interactables: [
      { x: 4, y: 4, w: 2, h: 1, name: 'A palm tree pressed against the wall', script: 'flavor_palm', icon: '?' },
    ],
    exits: [
      { x: 5, y: 0, w: 2, h: 1, to: 'apartment', tx: 13, ty: 11 },
      { x: 5, y: 11, w: 2, h: 1, to: 'peristyle', tx: 12, ty: 2 },
      { x: 11, y: 5, w: 1, h: 2, to: 'museum', tx: 10, ty: 10, gate: 'gotFragment2' },
      { x: 0, y: 8, w: 1, h: 2, to: 'citymuseum', tx: 10, ty: 9, gate: 'gotFragment3' },
      { x: 0, y: 4, w: 1, h: 2, to: 'fishmarket', tx: 9, ty: 12, gate: 'gotFragment5' },
      { x: 10, y: 8, w: 1, h: 2, to: 'garden', tx: 6, ty: 13, gate: 'gotFragment7' },
    ],
  },

  // ───────────────────────── THE PERISTYLE ─────────────────────────
  peristyle: {
    name: 'The Peristyle',
    ambient: 'court',
    tint: 'rgba(20,16,40,0.0)',       // golden hour — set live by engine
    legend: {
      '#': 'stone', 'x': 'stone', ',': 'flag', ';': 'flag', 'S': 'step',
      '~': 'shadow', 'C': 'colBase', 'P': 'plinth', 'd': 'door', 'k': 'bakery',
    },
    // 27 wide × 26 tall courtyard. C = column bases (tall column sprites drawn
    // on top by the engine via `props`). P = sphinx plinth. k = bakery stall.
    tiles: [
      '###########ddd#############',
      '###########,,,#############',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#SSSSSSSSSSSSSSSSSSSSSSSSS#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,PPP,,,,,,#',
      '#,,,,,,,,,,,,,,,,PPP,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      'd,,,,,,,,,,,,,,,,,,,,,,,,,d',
      'd,,,,,,,,,,,,,,,,,,,,,,,,,d',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,kkk,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#SSSSSSSSSSSSSSSSSSSSSSSSS#',
      '#,,,,,,,,,,,dd,,,,,,,,,,,,#',
      '############,,#############',
    ],
    spawn: { x: 15, y: 23, dir: 0 },
    sphinx: { cx: 18, footY: 11, art: 'peristyle' },
    entities: [
      { id: 'keso', type: 'cat', variant: 'orange', x: 16, y: 12, behavior: 'guide',
        route: [[16,12],[14,14],[18,13],[15,11]], faceLeft: true, target: 'sphinx' },
    ],
    interactables: [
      { x: 16, y: 19, w: 3, h: 1, name: 'The bakery stall', script: 'bakery_buy', icon: '🥖',
        gate: '!gotBread' },
      { x: 17, y: 9, w: 3, h: 3, name: 'The Sphinx', script: 'sphinx_touch', icon: '✦',
        gate: 'gotBread&!gotFragment1', once: true },
      { x: 17, y: 9, w: 3, h: 3, name: 'Return to the sphinx', script: 'finale_enter', icon: '✦',
        gate: 'gotFragment11' },
      { x: 2, y: 5, w: 2, h: 3, name: 'One of the great columns', script: 'flavor_columns', icon: '?' },
      { x: 3, y: 3, w: 8, h: 1, name: 'The Cardo road', script: 'flavor_cardo', icon: '?' },
    ],
    exits: [
      { x: 11, y: 0, w: 3, h: 1, to: 'alley', tx: 5, ty: 10 },
      { x: 0, y: 12, w: 1, h: 2, to: 'temple', tx: 10, ty: 13, gate: 'didReturn1', gateScript: 'temple_locked' },
      { x: 12, y: 25, w: 2, h: 1, to: 'cellar', tx: 10, ty: 12, gate: 'gotFragment4' },
      { x: 26, y: 12, w: 1, h: 2, to: 'cathedral', tx: 9, ty: 13, gate: 'gotFragment6' },
    ],
    triggers: [
      { unless: 'sawPeristyleIntro', run: 'peristyle_arrive' },
    ],
  },

  // ───────────────────────── TEMPLE OF JUPITER ─────────────────────────
  temple: {
    name: 'Temple of Jupiter',
    ambient: 'interior',
    tint: 'rgba(24,20,48,0.30)',     // cool, vaulted gloom
    legend: {
      '#': 'stone', 'x': 'stone', '.': 'flag', 'S': 'step', '~': 'shadow',
      'P': 'plinth', 'd': 'door', 'p': 'plant', 'o': 'sundial',
    },
    tiles: [
      '######################',
      '#....................#',
      '#...~~~~~~~~~~~~~~...#',
      '#....................#',
      '#........PPPP........#',
      '#........PPPP........#',
      '#....................#',
      '#.......~~~~~~.......#',
      '#........oooo........#',
      '#........oooo........#',
      '#.......~~~~~~.......#',
      '#....................#',
      '#....................#',
      '#....................#',
      '#.........dd.........#',
      '######################',
    ],
    spawn: { x: 10, y: 13, dir: 0 },
    sphinx: { cx: 10, footY: 5, art: 'headless' },
    entities: [
      { id: 'keso',  type: 'cat', variant: 'orange', x: 10, y: 11, behavior: 'guide', faceLeft: true },
      { id: 'grey1', type: 'cat', variant: 'grey', x: 6,  y: 6, behavior: 'guard', faceLeft: false },
      { id: 'grey2', type: 'cat', variant: 'grey', x: 15, y: 6, behavior: 'guard', faceLeft: true },
    ],
    interactables: [
      { x: 8, y: 8, w: 4, h: 2, name: 'The sundial in the floor', script: 'jupiter_examine', icon: '✦',
        gate: '!gotFragment2' },
      { x: 9, y: 4, w: 4, h: 2, name: 'The headless sphinx', script: 'headless_examine', icon: '?' },
      { x: 3, y: 2, w: 16, h: 1, name: 'The barrel-vaulted ceiling', script: 'flavor_ceiling', icon: '?' },
    ],
    exits: [
      { x: 10, y: 14, w: 2, h: 1, to: 'peristyle', tx: 1, ty: 12 },
    ],
    onEnter: 'temple_arrive',
  },

  // ───────────────────────── ARCHAEOLOGICAL MUSEUM ─────────────────────────
  museum: {
    name: 'Archaeological Museum',
    ambient: 'interior',
    tint: 'rgba(255,250,236,0.04)',   // bright modern gallery, daylight
    legend: {
      '#': 'glassWall', '.': 'modFloor', 'S': 'step', 's': 'shelf',
      'P': 'plinth', 'd': 'door', 'p': 'plant',
    },
    tiles: [
      '######################',
      '#..s..s..s..s..s..s..#',
      '#....................#',
      '#..P..P.......P..P...#',
      '#....................#',
      '#.......PPPP.........#',
      '#.......PPPP.........#',
      '#....................#',
      '#....................#',
      '#..P..P.......P..P...#',
      '#....................#',
      '#.........dd.........#',
      '######################',
    ],
    spawn: { x: 10, y: 10, dir: 0 },
    sphinx: { cx: 10, footY: 6, art: 'limestone' },
    lights: [
      { x: 4, y: 2, c: '255,246,214', r: 40 },
      { x: 17, y: 3, c: '235,244,255', r: 36 },
      { x: 11, y: 9, c: '255,248,224', r: 30 },
    ],
    entities: [
      { id: 'blackq', type: 'cat', variant: 'black', x: 4, y: 3, behavior: 'guard', faceLeft: true },
    ],
    interactables: [
      { x: 7, y: 7, w: 4, h: 2, name: 'The cartouche stela', script: 'cartouche_examine', icon: '✦',
        gate: '!gotFragment3' },
    ],
    exits: [
      { x: 9, y: 11, w: 2, h: 1, to: 'alley', tx: 10, ty: 6 },
    ],
    onEnter: 'museum_arrive',
  },

  // ───────────────────────── CITY MUSEUM ─────────────────────────
  citymuseum: {
    name: 'City Museum',
    ambient: 'interior',
    tint: 'rgba(214,222,236,0.05)',   // bright Venetian-Gothic white hall
    legend: {
      '#': 'gothicWall', '.': 'gothicFloor', 'S': 'step', 'A': 'gothicArch',
      'P': 'plinth', 'd': 'door', 's': 'shelf', 'p': 'plant',
    },
    tiles: [
      '###AAAA####AAAA###',
      '#..s........P.p..#',
      '#..........PPP...#',
      '#..p........P....#',
      'A.....s..........A',
      '#................#',
      '#.......p...s....#',
      '#................#',
      '#....s...........#',
      'A......p.........A',
      '#................#',
      '#.......dd.......#',
      '#.......SS.......#',
      '#####AAAAAA#######',
    ],
    spawn: { x: 9, y: 10, dir: 0 },
    sphinx: { cx: 12, footY: 2, art: 'greyblack', scale: 0.6 },
    entities: [
      { id: 'keso',    type: 'cat', variant: 'orange', x: 9, y: 11, behavior: 'guide', faceLeft: true },
      { id: 'greytom', type: 'cat', variant: 'grey', x: 7, y: 7, behavior: 'patrol',
        route: [[7,7],[4,5],[8,9],[11,6],[6,10],[9,4]], faceLeft: false },
    ],
    interactables: [
      // The grey tom — sits somewhere on his patrol; petting him earns his trust
      { x: 3, y: 4, w: 12, h: 7, name: 'Pet the grey tom', script: 'greytom_pet', icon: '♥',
        gate: '!pettedGreyTom' },
      // The tucked-away sphinx exhibit — only readable after Mira has earned the tom's blessing
      { x: 11, y: 2, w: 4, h: 2, name: "The sphinx's lion paw", script: 'lionpaw_examine', icon: '✦',
        gate: 'pettedGreyTom&!gotFragment4' },
    ],
    exits: [
      { x: 8, y: 11, w: 2, h: 1, to: 'alley', tx: 1, ty: 8 },
    ],
    onEnter: 'citymuseum_arrive',
  },

  // ───────────────────────── PALACE CELLARS ─────────────────────────
  cellar: {
    name: 'Palace Cellars',
    ambient: 'interior',
    tint: 'rgba(28,20,44,0.44)',     // warm-dark brick vault
    legend: {
      '#': 'brickWall', '.': 'cellarFloor', 'S': 'step', 'v': 'vaultRib',
      'P': 'plinth', 'd': 'door', 'g': 'grate',
    },
    tiles: [
      '######################',
      '#vvvvvvvvvvvvvvvvvvvv#',
      '#....................#',
      '#..vvvvvvvvvvvvvvvv..#',
      '#......g.............#',
      '#....................#',
      '#....................#',
      '#........PPPP........#',
      '#........PPPP........#',
      '#....................#',
      '#....................#',
      '#..vvvvvvvvvvvvvvvv..#',
      '#....................#',
      '#.........dd.........#',
      '#.........SS.........#',
      '######################',
    ],
    spawn: { x: 10, y: 12, dir: 0 },
    sphinx: { cx: 10, footY: 8, art: 'beheaded' },
    entities: [
      { id: 'chorus1', type: 'cat', variant: 'grey',   x: 4,  y: 4,  behavior: 'guard', faceLeft: false },
      { id: 'chorus2', type: 'cat', variant: 'black',  x: 17, y: 4,  behavior: 'guard', faceLeft: true },
      { id: 'chorus3', type: 'cat', variant: 'orange', x: 4,  y: 11, behavior: 'guard', faceLeft: false },
      { id: 'chorus4', type: 'cat', variant: 'cream',  x: 17, y: 11, behavior: 'guard', faceLeft: true },
    ],
    interactables: [
      { x: 8, y: 9, w: 4, h: 2, name: 'The Belly Text', script: 'belly_examine', icon: '✦',
        gate: '!gotFragment5' },
    ],
    exits: [
      { x: 10, y: 13, w: 2, h: 1, to: 'peristyle', tx: 12, ty: 23 },
      { x: 7, y: 4, w: 1, h: 1, to: 'tunnels', tx: 2, ty: 8, gate: 'gotFragment9' },
    ],
    onEnter: 'cellar_arrive',
  },

  // ───────────────────────── THE FISH MARKET (Riba / the Riva waterfront) ─────────────────────────
  // Bright, white-limestone quay open to the Adriatic. Awnings, fish on iced
  // tables, well-fed market cats — and old Tonko's storage shed, where a
  // "funny rock" has propped the door for thirty years.
  fishmarket: {
    name: 'The Fish Market',
    ambient: 'court',
    tint: 'rgba(255,246,216,0.06)',     // bright midday sun off the water
    legend: {
      '#': 'quay', '.': 'whiteStone', '~': 'sea', 'q': 'quay',
      'F': 'fishtable', 'a': 'awning', 'c': 'crate', 'd': 'door',
    },
    tiles: [
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
      'qqqqqqqqqqqqqqqqqqqq',
      '#..................#',
      '#..aa......aa......#',
      '#..FF......FF......#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..............##..#',
      '#..............##..#',
      '#..................#',
      '#..FF......FF......#',
      '#..................#',
      '#########dd#########',
    ],
    spawn: { x: 9, y: 11, dir: 0 },
    lights: [],
    entities: [
      { id: 'tonko', type: 'person', sprite: 'tonko', x: 14, y: 11, dir: 3 },
      { id: 'fmKeso',  type: 'cat', variant: 'orange', x: 6,  y: 7,  behavior: 'guide', faceLeft: false },
      { id: 'fmTabby', type: 'cat', variant: 'cream',  x: 9,  y: 6,  behavior: 'patrol', route: [[9,6],[12,8],[8,10],[10,7]], faceLeft: true },
      { id: 'fmQueen', type: 'cat', variant: 'black',  x: 4,  y: 13, behavior: 'sleep', faceLeft: false },
    ],
    interactables: [
      { x: 15, y: 9, w: 1, h: 2, name: 'Old Tonko & his doorstop', script: 'tonko_meet', icon: '✦',
        gate: '!gotFragment6' },
      { x: 3, y: 3, w: 14, h: 1, name: 'The harbour water', script: 'flavor_water', icon: '?' },
      { x: 3, y: 5, w: 3, h: 1, name: 'A fishmonger\u2019s table', script: 'flavor_fish', icon: '?' },
    ],
    exits: [
      { x: 9, y: 14, w: 2, h: 1, to: 'alley', tx: 1, ty: 4 },
    ],
    onEnter: 'fishmarket_arrive',
  },

  // ───────────────────────── CATHEDRAL OF ST. DOMNIUS (DIOCLETIAN'S MAUSOLEUM) ─────────────────────────
  // Octagonal interior ringed by a colonnade, an empty imperial tomb at the
  // centre, lit only by candles. Cats keep the outside watch — the Round Hall
  // keeps its own time, and Mira reads it alone.
  cathedral: {
    name: 'The Round Hall',
    ambient: 'interior',
    noCats: true,                    // sacred ground — not even Keso crosses the threshold
    tint: 'rgba(18,14,30,0.40)',     // candle-dark octagon
    legend: {
      '#': 'stone', '.': 'marble', 'C': 'colBase', 'T': 'tomb', 'd': 'door', 'S': 'step',
    },
    tiles: [
      '#########dd#########',
      '#####..........#####',
      '###....C....C....###',
      '##................##',
      '#SSC............C..#',
      '#SS................#',
      '#SS.....TTTT.......#',
      '#..C....TTTT....C..#',
      '#.......TTTT.......#',
      '#..................#',
      '#..C............C..#',
      '##................##',
      '###....C....C....###',
      '#####..........#####',
      '#########dd#########',
      '####################',
    ],
    spawn: { x: 9, y: 13, dir: 0 },
    lights: [
      { x: 7, y: 2 }, { x: 12, y: 2 }, { x: 3, y: 4 }, { x: 16, y: 4 },
      { x: 3, y: 10 }, { x: 16, y: 10 }, { x: 7, y: 12 }, { x: 12, y: 12 },
      { x: 9, y: 7, c: '150,170,230', r: 22 },
    ],
    entities: [],
    interactables: [
      { x: 8, y: 8, w: 4, h: 2, name: 'Diocletian’s tomb', script: 'heart_examine', icon: '✦',
        gate: '!gotFragment9' },
      { x: 1, y: 4, w: 3, h: 3, name: 'Stair to the bell tower', script: 'belltower_enter', icon: '↑',
        gate: '!gotFragment7' },
      { x: 5, y: 7, w: 2, h: 3, name: 'Egyptian granite column', script: 'flavor_granite', icon: '?' },
    ],
    exits: [
      { x: 9, y: 14, w: 2, h: 1, to: 'peristyle', tx: 25, ty: 12 },
      { x: 9, y: 0, w: 2, h: 1, to: 'vestibule', tx: 7, ty: 14, gate: 'gotFragment10' },
    ],
    onEnter: 'cathedral_arrive',
  },

  // ───────────────────────── THE BELL TOWER (campanile of St. Domnius) ─────────────────────────
  // Side-view vertical climb. 173 narrow steps, dusk wind, the Black Queen on a
  // ledge, the bells, and the cobra crown at the very top. No death — a slip
  // just returns Mira to the last safe step.
  belltower: {
    name: 'The Bell Tower',
    mode: 'climb',
    W: 30, H: 120, shaftX: 8,
    floors: 26, step: 3, ledgeW: 6,
    queenFloor: 9, bellFloor: 17,
    spawn: { x: 15, y: 117 },
    goalScript: 'belltower_solve',
    solvedFlag: 'gotFragment7',
    back: { to: 'cathedral', tx: 4, ty: 5 },
    onEnter: 'belltower_arrive',
  },

  // ───────────────────────── THE VESTIBULE (PREDVORJE) ─────────────────────────
  // A perfect circular hall whose dome fell away — open to the sky through a
  // wide oculus. Four wall niches and legendary acoustics. The resonant stone
  // sits dead centre, under the moonlight.
  vestibule: {
    name: 'The Vestibule',
    ambient: 'court',
    tint: 'rgba(24,20,60,0.42)',     // solstice indigo, sphinx-light heavy
    oculus: { cx: 7, cy: 7 },
    legend: {
      '#': 'stone', '.': 'marble', 'n': 'niche', 'a': 'altar', 'd': 'door',
    },
    tiles: [
      '#######nn#######',
      '#####......#####',
      '####........####',
      '###..........###',
      '##............##',
      '#..............#',
      '#..............#',
      'n..............n',
      '#......aa......#',
      '#..............#',
      '#..............#',
      '##............##',
      '###..........###',
      '####........####',
      '#####......#####',
      '#######dd#######',
    ],
    spawn: { x: 7, y: 14, dir: 0 },
    lights: [
      { x: 7, y: 0, c: '200,214,255', r: 14 }, { x: 0, y: 7, c: '200,214,255', r: 14 },
      { x: 15, y: 7, c: '200,214,255', r: 14 },
    ],
    entities: [
      { id: 'keso',  type: 'cat', variant: 'orange', x: 9,  y: 11, behavior: 'guard', faceLeft: true },
      { id: 'vcat1', type: 'cat', variant: 'black',  x: 3,  y: 9,  behavior: 'guard', faceLeft: false },
      { id: 'vcat2', type: 'cat', variant: 'grey',   x: 12, y: 5,  behavior: 'guard', faceLeft: true },
    ],
    interactables: [
      { x: 6, y: 7, w: 3, h: 2, name: 'The humming stone', script: 'forelegs_examine', icon: '✦',
        gate: '!gotFragment11' },
    ],
    exits: [
      { x: 7, y: 15, w: 2, h: 1, to: 'cathedral', tx: 9, ty: 1 },
    ],
    onEnter: 'vestibule_arrive',
  },

  // ───────────────────────── THE VRTAL GARDEN (the red-granite head in the wall) ─────────────────────────
  // A bright white-stone courtyard garden — cypresses, hedges, a fountain — set
  // against the ancient palace wall. Built into that wall: the famous frontal
  // red-granite Egyptian head with its blue-and-gold nemes headdress, draped in
  // vines until Mira waters the right plants and bares the stone.
  garden: {
    name: 'The Vrtal Garden',
    ambient: 'court',
    tint: 'rgba(255,246,216,0.05)',     // bright Dalmatian midday
    wallHead: { x: 7, y: 0 },            // top-left of the 2×2 red head panel (centered; pixels via *16)
    legend: {
      '#': 'whiteWall', 'H': 'redhead', '.': 'whiteStone', 'g': 'grass',
      'Y': 'cypress', 'h': 'hedge', 'f': 'fountain', 'v': 'vine',
      'b': 'flowerbed', 'd': 'door',
    },
    tiles: [
      '######vHHv######',
      '#vv###vHHv###vv#',
      'Y..gg......gg..Y',
      '#..gg......gg..#',
      '#....b....b....#',
      '#..............#',
      '#......ff......#',
      '#......ff......#',
      '#..............#',
      '#....b....b....#',
      'Y..hh......hh..Y',
      '#..hh......hh..#',
      '#..............#',
      '#####d..d#######',
      '#####....#######',
    ],
    spawn: { x: 7, y: 12, dir: 0 },
    lights: [],
    entities: [
      { id: 'gdnKeso',  type: 'cat', variant: 'orange', x: 4,  y: 5,  behavior: 'guide', faceLeft: false },
      { id: 'gdnCream', type: 'cat', variant: 'cream',  x: 11, y: 6,  behavior: 'sleep', faceLeft: true },
      { id: 'gdnGrey',  type: 'cat', variant: 'grey',   x: 8,  y: 9,  behavior: 'patrol', route: [[8,9],[12,11],[10,5],[7,8]], faceLeft: true },
    ],
    interactables: [
      { x: 7, y: 1, w: 2, h: 2, name: 'The red granite head', script: 'garden_head', icon: '✦',
        gate: '!gotFragment8' },
      { x: 6, y: 6, w: 4, h: 2, name: 'The stone fountain', script: 'flavor_fountain', icon: '?' },
      { x: 0, y: 2, w: 1, h: 9, name: 'The cypress trees', script: 'flavor_cypress', icon: '?' },
    ],
    exits: [
      { x: 5, y: 13, w: 4, h: 2, to: 'alley', tx: 10, ty: 8 },
    ],
    onEnter: 'garden_arrive',
  },

  // ───────────────────────── THE DRAINAGE TUNNELS (Roman substructure) ─────────────────────────
  // Wet, dark Roman drainage channels beneath the palace. A clean white kitten
  // scouts ahead. A flooded pool hides the Broken Spine — reroute the water to
  // drain it and lay the fragment bare.
  tunnels: {
    name: 'The Drainage Tunnels',
    ambient: 'interior',
    noCats: true,                    // Keso waits above — the white kitten scouts down here,
    tint: 'rgba(16,26,34,0.52)',      // wet black-green underdark
    legend: {
      '#': 'tunWall', '.': 'wetStone', 'c': 'channel', 'w': 'poolWater',
      'g': 'grate', 'd': 'door',
    },
    tiles: [
      '####################',
      '#..................#',
      '#..cccccccc........#',
      '#.........c........#',
      '#.........c..wwww..#',
      '#g.......cc..wwww..#',
      '#........c...wwww..#',
      '#..cccccc....wwww..#',
      '#..................#',
      '#....##....##......#',
      '####################',
    ],
    spawn: { x: 2, y: 8, dir: 3 },
    lights: [
      { x: 2, y: 5, c: '200,220,235', r: 26 },   // shaft of light from the cellar grate
      { x: 14, y: 5, c: '95,160,184', r: 20 },
    ],
    entities: [
      { id: 'kitten', type: 'cat', variant: 'white', x: 8, y: 8, behavior: 'patrol', route: [[8,8],[13,8],[15,3],[10,2]], faceLeft: false },
    ],
    interactables: [
      { x: 12, y: 4, w: 4, h: 4, name: 'The flooded pool', script: 'spine_examine', icon: '✦',
        gate: '!gotFragment10' },
    ],
    exits: [
      { x: 1, y: 5, w: 1, h: 1, to: 'cellar', tx: 7, ty: 5 },
    ],
    onEnter: 'tunnels_arrive',
  },

  // ───────────────────────── THE PERISTYLE — SOLSTICE MIDNIGHT (finale) ─────────────────────────
  // The same court, transformed: every cat in Split gathered in silent rings,
  // the sphinx glowing gold from within, its offering-vessel open. The end.
  finale: {
    name: 'The Peristyle',
    ambient: 'court',
    tint: 'rgba(14,14,44,0.62)',      // deep solstice-midnight blue
    legend: {
      '#': 'stone', 'x': 'stone', ',': 'flag', ';': 'flag', 'S': 'step',
      '~': 'shadow', 'C': 'colBase', 'P': 'plinth', 'd': 'door',
    },
    tiles: [
      '###########ddd#############',
      '###########,,,#############',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#SSSSSSSSSSSSSSSSSSSSSSSSS#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,PPP,,,,,,#',
      '#,,,,,,,,,,,,,,,,PPP,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,C,,,,,,,,,,,,,,,,,,,C,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#SSSSSSSSSSSSSSSSSSSSSSSSS#',
      '#,,,,,,,,,,,dd,,,,,,,,,,,,#',
      '############,,#############',
    ],
    spawn: { x: 15, y: 20, dir: 0 },
    sphinx: { cx: 18, footY: 11, art: 'peristyle' },
    lights: [ { x: 18, y: 9, c: '255,214,120', r: 40 } ],
    // every cat in Split, in concentric rings facing the sphinx
    entities: [
      { id: 'f_keso',  type: 'cat', variant: 'orange', x: 18, y: 13, behavior: 'sit', faceLeft: true },
      { id: 'f_queen', type: 'cat', variant: 'black',  x: 21, y: 8,  behavior: 'sit', faceLeft: true },
      { id: 'f_white', type: 'cat', variant: 'white',  x: 15, y: 8,  behavior: 'sit', faceLeft: false },
      { id: 'f_c1', type: 'cat', variant: 'grey',   x: 13, y: 12, behavior: 'sit', faceLeft: false },
      { id: 'f_c2', type: 'cat', variant: 'cream',  x: 23, y: 12, behavior: 'sit', faceLeft: true },
      { id: 'f_c3', type: 'cat', variant: 'orange', x: 11, y: 9,  behavior: 'sit', faceLeft: false },
      { id: 'f_c4', type: 'cat', variant: 'black',  x: 25, y: 9,  behavior: 'sit', faceLeft: true },
      { id: 'f_c5', type: 'cat', variant: 'grey',   x: 9,  y: 14, behavior: 'sit', faceLeft: false },
      { id: 'f_c6', type: 'cat', variant: 'cream',  x: 25, y: 15, behavior: 'sit', faceLeft: true },
      { id: 'f_c7', type: 'cat', variant: 'white',  x: 12, y: 17, behavior: 'sit', faceLeft: false },
      { id: 'f_c8', type: 'cat', variant: 'orange', x: 22, y: 18, behavior: 'sit', faceLeft: true },
      { id: 'f_c9', type: 'cat', variant: 'black',  x: 7,  y: 11, behavior: 'sit', faceLeft: false },
      { id: 'f_c10',type: 'cat', variant: 'grey',   x: 20, y: 6,  behavior: 'sit', faceLeft: true },
      { id: 'f_c11',type: 'cat', variant: 'cream',  x: 16, y: 6,  behavior: 'sit', faceLeft: false },
    ],
    interactables: [
      { x: 17, y: 9, w: 3, h: 3, name: 'The glowing sphinx', script: 'finale_sphinx', icon: '✦',
        gate: '!gotFragment13' },
    ],
    exits: [],
    onEnter: 'finale_arrive',
  },
};

// ── PUZZLES (close-up "Professor Layton for kids" challenges) ────────────────
// type 'dial'   — rotate the ring so the marker lands on the named glyph, confirm.
// type 'glyphs' — tap the glyphs in the correct order; gentle reset on a slip.
export const PUZZLES = {
  jupiter_dial: {
    type: 'dial',
    title: 'The Vaulted Shadow',
    prompt: 'The barrel vault drops a blade of shadow across the floor. Turn the old sundial so the shadow points to the JACKAL — the guardian of the dead.',
    hint: 'A jackal has tall pointed ears and a long muzzle. Find that one.',
    glyphs: ['eye', 'ankh', 'jackal', 'bird', 'wave', 'sun', 'feather', 'cobra'],
    target: 2,            // index into glyphs (jackal)
    onSolve: 'jupiter_solve',
  },
  cartouche_glyphs: {
    type: 'glyphs',
    title: 'The King’s Name',
    prompt: 'A cartouche holds a pharaoh’s name, read top to bottom. Tap the four signs in order: the SUN-DISC, the rearing COBRA, the standing BIRD, then the tall FEATHER.',
    hint: 'Sun first (the circle with rays), then the cobra (the rising snake), then the bird, then the long feather.',
    glyphs: ['eye', 'sun', 'cobra', 'bird', 'feather', 'wave', 'ankh', 'jackal'],
    answer: [1, 2, 3, 4],
    onSolve: 'cartouche_solve',
  },
  lionpaw_pads: {
    type: 'pads',
    title: 'The Lion’s Stride',
    prompt: 'Set your hand into the worn paw-marks and light the stones a lion sets down: the three toe-stones across the top, the pad in the middle, and the heel at the bottom.',
    hint: 'Top row, all three. Then the centre stone. Then the one directly below the centre.',
    target: [0, 1, 2, 4, 7],
    onSolve: 'lionpaw_solve',
  },
  belly_echo: {
    type: 'echo',
    title: 'The Cellar Chorus',
    prompt: 'Four cats sing the belly-song in glowing light — the old harvest lines carved along the sphinx. Watch the order their eyes flare — then tap them back in the same order.',
    hint: 'It is four notes long. Press “Listen again” any time to hear the chorus repeat.',
    pads: 4,
    sequence: [2, 0, 3, 1],
    onSolve: 'belly_solve',
  },

  // type 'scale' — lift the heavy stones off the heart pan until what remains balances the feather of truth.
  tonko_sketch: {
    type: 'pads',
    glyph: 'boat',
    title: 'Sketch the Sv. Nikola',
    prompt: 'Tonko’s old fishing boat rocks at the quay. Trace her in your sketchbook — light the line of her: the tip of the MAST up top, the SAIL at her heart, and the three planks of the HULL along the bottom.',
    hint: 'Top-centre for the mast-tip, the very middle for the sail, then all three stones along the bottom row for the hull.',
    target: [1, 4, 6, 7, 8],
    onSolve: 'tonko_solve',
  },
  heart_scale: {
    type: 'scale',
    title: 'The Weighing of the Heart',
    prompt: 'An emperor set down many heavy things when he chose his garden. In the old religion the heart was weighed against the feather of truth — too heavy, and the soul could not pass. Lift away the stones the heart no longer needs, until it is light as the feather.',
    hint: 'Keep only what is light. Take away the heavy stones — anger, fear, regret — and leave love on the pan.',
    feather: 1,
    stones: [ { v: 4, label: 'ANGER' }, { v: 3, label: 'FEAR' }, { v: 2, label: 'REGRET' }, { v: 1, label: 'LOVE' } ],
    onSolve: 'heart_solve',
  },

  // type 'beam' — a blade of moonlight rotates the niches; tap the resonant niche the instant the light crosses it.
  forelegs_beam: {
    type: 'beam',
    title: 'The Resonant Niche',
    prompt: 'The Vestibule is open to the sky, and a blade of moonlight turns slowly around its walls. Four niches ring the room — but only one answers the sphinx’s hum. Tap that niche the instant the moonlight reaches it.',
    hint: 'One niche keeps a faint gold glow — that is the resonant one. Wait until the moving moonlight lands on it, then tap. Catch it three times.',
    niches: 4,
    target: 2,
    needed: 3,
    onSolve: 'forelegs_solve',
  },

  // type 'vines' — water the thirsty plants; their climbing vines recoil and bare the red-granite head.
  garden_vines: {
    type: 'vines',
    title: 'Clear the Vines',
    prompt: 'The red granite head is half-buried under climbing vines. Water the thirsty plants at its feet — they drink, uncurl, and let go of the stone. Water the wrong ones and they only grow thicker. Bare the headdress.',
    hint: 'The drooping, dusty plants are the thirsty ones — give those the fountain water. Leave the lush, dark-green vines alone; watering them just feeds the cover.',
    pots: 5,
    target: [0, 2, 3],
    onSolve: 'garden_solve',
  },

  // type 'flow' — open the right drainage valves to empty the flooded pool and bare the spine.
  spine_flow: {
    type: 'flow',
    title: 'Drain the Pool',
    prompt: 'The Broken Spine lies under a flooded Roman pool. Six ancient sluice valves feed and drain these channels. Open the drains and shut the feeders until the pool runs dry — the water level answers every valve you turn.',
    hint: 'Watch the pool: turning a valve the right way lowers the water, the wrong way raises it. Keep the ones that lower it, and leave the rest shut.',
    gates: 6,
    target: [1, 3, 4],
    onSolve: 'spine_solve',
  },

  // the thirteenth cartouche on the underside of Nona’s keystone — the sphinx’s true name.
  last_cartouche: {
    type: 'glyphs',
    title: 'Name the Sphinx',
    prompt: 'The keystone’s hidden cartouche holds the sphinx’s own name, read top to bottom. Tap the four signs in order: the ANKH of life, the watching EYE, the standing BIRD, and the tall FEATHER of truth.',
    hint: 'Life first (the looped cross), then the eye, then the bird, then the long feather.',
    glyphs: ['eye', 'sun', 'cobra', 'bird', 'feather', 'wave', 'ankh', 'jackal'],
    answer: [6, 0, 3, 4],
    onSolve: 'finale_open',
  },
};


// ── QUEST LOG (drives the sketchbook objective list) ────────────────────────
export const QUESTS = [
  { id: 'bread',   flag: 'gotBread',     text: 'Fetch bread from the bakery by the Peristyle for Nona.' },
  { id: 'sphinx',  flag: 'gotFragment1', text: 'The black sphinx with human hands. Touch the vessel it holds.', after: 'gotBread' },
  { id: 'return1', flag: 'didReturn1',   text: 'Take the fragment home to Nona — she has a story, and the rest of the book.', after: 'gotFragment1' },
  { id: 'temple',  flag: 'gotFragment2', text: 'Follow Keso west from the Peristyle to the Temple of Jupiter. Read the vaulted shadow.', after: 'didReturn1' },
  { id: 'museum',  flag: 'gotFragment3', text: 'A side door has opened off the alley. Follow the Black Queen into the museum and read the king’s name.', after: 'gotFragment2' },
  { id: 'citymuseum', flag: 'gotFragment4', text: 'Another door has opened — west, off the alley. Find the lion’s paw in the City Museum.', after: 'gotFragment3' },
  { id: 'cellar', flag: 'gotFragment5', text: 'A low door has opened at the south end of the Peristyle. Go down into the cellars and learn the Belly Text.', after: 'gotFragment4' },
  { id: 'fishmarket', flag: 'gotFragment6', text: 'A passage off the alley opens to the Riva. The market cats lead you to old Tonko and his lucky doorstop — win the Offering Vessel.', after: 'gotFragment5' },
  { id: 'return2', flag: 'didReturn2',   text: 'Halfway. Bring the six fragments home to Nona and read on.', after: 'gotFragment6' },
  { id: 'belltower', flag: 'gotFragment7', text: 'Inside the Round Hall a stair climbs the bell tower. The Black Queen waits on a ledge — climb the 173 steps to the cobra crown.', after: 'didReturn2' },
  { id: 'garden', flag: 'gotFragment8', text: 'A gate off the alley opens to the Vrtal garden. The red granite head waits in the wall — water the thirsty plants to clear the vines and free the Nemes Headdress.', after: 'gotFragment7' },
  { id: 'cathedral', flag: 'gotFragment9', text: 'A door has opened on the east of the Peristyle — the Round Hall, the emperor’s resting hall. The cats keep the outside watch; go in alone and weigh the Dreaming Heart.', after: 'gotFragment8' },
  { id: 'tunnels', flag: 'gotFragment10', text: 'A white kitten leads you to a grate in the cellar floor. In the drainage tunnels below, reroute the water to drain the flooded pool and free the Broken Spine.', after: 'gotFragment9' },
  { id: 'vestibule', flag: 'gotFragment11', text: 'Beyond the Round Hall the Vestibule stands open to the sky. Catch the moonlight on the resonant niche and free the Forelegs.', after: 'gotFragment10' },
  { id: 'finale', flag: 'gameComplete', text: 'The solstice has come. Return to the Peristyle sphinx at midnight, name it with Nona’s keystone — and answer what it asks.', after: 'gotFragment11' },
];

export const META = {
  title: 'The Thirteen Sphinxes of Split',
  startScene: 'apartment',
};

// ── CLUES (Mira's sketchbook clue page — in the order they are collected) ─────
export const CLUES = [
  { flag: 'didReturn1',    text: 'Nona found hers at sunrise.' },
  { flag: 'gotFragment1',  text: 'The stone counts sunrises.' },
  { flag: 'gotFragment2',  text: 'The fragments were hidden on purpose — at points the solstice sun touches.' },
  { flag: 'gotFragment3',  text: 'The stone keeps every name it was ever given — even the crossed-out ones.' },
  { flag: 'gotFragment4',  text: 'A keeper doesn\u2019t chase the sun. A keeper waits for it.' },
  { flag: 'gotFragment5',  text: 'Even in the dark, the stone keeps counting — the cats bring it the news of each dawn.' },
  { flag: 'gotFragment6',  text: 'The vessel is open — it was made to receive.' },
  { flag: 'gotFragment7',  text: 'The palace is a clock. The fragments are its hours.' },
  { flag: 'gotFragment8',  text: 'Even the garden keeps the appointment.' },
  { flag: 'gotFragment9',  text: 'Diocletian didn\u2019t bring keepers of an emperor. He brought keepers of the dawn — for everyone.' },
  { flag: 'gotFragment10', text: 'Broken things are still keepers.' },
  { flag: 'gotFragment11', text: 'They are almost ready to speak. Stone speaks once in a lifetime — and only in riddles.' },
  { flag: 'gotFragment12', text: 'The keystone is the question mark. It completes nothing — it asks.' },
];
