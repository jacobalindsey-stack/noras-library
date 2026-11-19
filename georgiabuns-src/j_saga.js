/* ================= Georgia Buns — the saga: data =================
   The family, their quirks, the places, the stash of coveted things, the
   cookout spread, errands (and what the cousins actually bring back), the
   Want List, phone calls, and the save that holds it all.

   The loop: every morning a few cousins wake up wanting something. You get
   three suns a day. Each run spends one. Idle cousins go on errands and
   come back at sundown with whatever they think you asked for. Every day
   ends with a cookout. Every cousin who gets what he wants earns his name. */

/* ---------- the family: 17 cousins ---------- */
// look: extras passed to buildBun; acc colors go in palette slots 19-21
const FAM = [
  { k: 'roof', fur: 'gray', color: 'GRAY', look: { shades: 1 }, tag: 'GRAY, SHADES', role: 'THE ROOF BUN', quirk: 'roof', home: 1 },
  { k: 'nib', fur: 'tan', color: 'TAN', look: { teeth: 1 }, tag: 'TAN, BUCK TEETH', role: 'THE NIBBIN\' BUN', quirk: 'nibbler' },
  { k: 'brown', fur: 'hero', color: 'BROWN', look: { pendant: 'carrot' }, tag: 'BROWN, CARROT CHAIN', quirk: 'showoff', want: 'creek' },
  { k: 'ginger', fur: 'ginger', color: 'GINGER', look: { pendant: 'rope' }, tag: 'GINGER, GOLD ROPE', quirk: 'lost', want: 'paris' },
  { k: 'white', fur: 'white', color: 'WHITE', look: { hat: 'straw', acc: ['#e8c870', '#b8963c', '#fff0b0'] }, tag: 'WHITE, STRAW HAT', quirk: 'country', want: 'peach' },
  { k: 'dark', fur: 'dark', color: 'DARK', look: { hat: 'mask', acc: ['#7a5ab8', '#4a3480', '#a88ae0'] }, tag: 'DARK, SLEEP MASK', quirk: 'sleepy', want: 'cat' },
  { k: 'smoke', fur: 'smoke', color: 'SMOKE', look: { pendant: 'ice', stud: 1 }, tag: 'SMOKE, ICED OUT', quirk: 'fancy', want: 'ice' },
  { k: 'honey', fur: 'honey', color: 'HONEY', look: { hat: 'bandana', acc: ['#d8302a', '#981a14', '#ff6a5a'] }, tag: 'HONEY, BANDANA', quirk: 'hungry', want: 'harvest' },
  { k: 'cream', fur: 'cream', color: 'CREAM', look: { beanie: '#ff8a1c' }, tag: 'CREAM, BEANIE', quirk: 'dreamer', want: 'sanitas' },
  { k: 'silver', fur: 'silver', color: 'SILVER', look: { hat: 'specs', acc: ['#2a2430', '#141018', '#5a5060'] }, tag: 'SILVER, GLASSES', quirk: 'literal', want: 'eyes' },
  { k: 'cocoa', fur: 'cocoa', color: 'COCOA', look: { hat: 'apron', acc: ['#f4f0e8', '#c8c0b0', '#ffffff'] }, tag: 'COCOA, APRON', quirk: 'haggler', want: 'grill' },
  { k: 'black', fur: 'black', color: 'BLACK', look: { hat: 'phones', acc: ['#e03a3a', '#8a1a1a', '#ff8a7a'] }, tag: 'BLACK, HEADPHONES', quirk: 'musical', want: 'speaker' },
  { k: 'rust', fur: 'rust', color: 'RUST', look: { hat: 'cap', acc: ['#2a5ab8', '#183a80', '#5a8ae0'] }, tag: 'RUST, BALL CAP', quirk: 'social', want: 'roundup' },
  { k: 'lilac', fur: 'lilac', color: 'LILAC', look: { hat: 'bucket', acc: ['#3f8a3a', '#245a20', '#6ab860'] }, tag: 'LILAC, BUCKET HAT', quirk: 'lucky', want: 'collards' },
  { k: 'ash', fur: 'ash', color: 'ASH', look: { hat: 'band', acc: ['#f6c645', '#b8860b', '#fff3b0'] }, tag: 'ASH, SWEATBAND', quirk: 'speedy', want: 'sundown' },
  { k: 'fawn', fur: 'fawn', color: 'FAWN', look: { hat: 'hard', acc: ['#ffc020', '#c88a00', '#fff080'] }, tag: 'FAWN, HARD HAT', quirk: 'handy', want: 'stew' },
  { k: 'chestnut', fur: 'chestnut', color: 'CHESTNUT', look: { hat: 'scarf', acc: ['#2a8a8a', '#185a5a', '#e8e0d0'] }, tag: 'CHESTNUT, SCARF', quirk: 'nervous', want: 'bobcat' }
];
Object.assign(BUN_FURS, {
  cream: ['#e6d4ae', '#bba67c', '#fff2d4'], silver: ['#b0b4be', '#82868f', '#dcdfe8'], cocoa: ['#76462a', '#4e2c18', '#9c6640'],
  black: ['#3a3236', '#211b1e', '#5c5258'], rust: ['#9e4428', '#6c2a16', '#c66a44'], lilac: ['#a8949e', '#7a6872', '#ccbac2'],
  ash: ['#7a8394', '#555c6b', '#a3abbb'], fawn: ['#d2a06c', '#a27444', '#f0c896'], chestnut: ['#8c5434', '#5e341e', '#b47a54']
});

const QUIRKS = {
  roof: { name: 'NEVER COMES DOWN', tip: 'LIVES ON THE ROOF. DOES NOT RUN ERRANDS. DOES SUPERVISE.' },
  nibbler: { name: 'NIBBLES', tip: 'BRINGS IT BACK. WITH BITE MARKS.' },
  showoff: { name: 'SHOW-OFF', tip: 'BRINGS IT BACK AND A CROWD TO WATCH. BETTER VIBES.' },
  lost: { name: 'GETS LOST', tip: 'ENDS UP SOMEWHERE ELSE ENTIRELY. BRINGS BACK WHATEVER THEY HAVE THERE.' },
  country: { name: 'COUNTRY', tip: 'DRIVES TO THE FARM NO MATTER WHAT YOU ASKED FOR.' },
  sleepy: { name: 'SLEEPY', tip: 'NAPS FIRST. SOMETIMES THE NAP IS ALL YOU GET.' },
  fancy: { name: 'FANCY', tip: 'BUYS THE FANCY VERSION. WITH YOUR CARROTS.' },
  hungry: { name: 'HUNGRY', tip: 'BRINGS FOOD. EATS SOME OF IT ON THE WAY.' },
  dreamer: { name: 'DREAMER', tip: 'COMES BACK WANTING SOMETHING BRAND NEW.' },
  literal: { name: 'LITERAL', tip: 'DOES EXACTLY WHAT YOU SAID. EXACTLY.' },
  haggler: { name: 'HAGGLER', tip: 'KNOWS A GUY. GETS TWICE AS MUCH.' },
  musical: { name: 'MUSICAL', tip: 'COMES BACK WITH A RECORD. AND THE THING, IF HE REMEMBERED.' },
  social: { name: 'SOCIAL', tip: 'MAKES A FRIEND. THE FRIEND COMES TO THE COOKOUT.' },
  lucky: { name: 'LUCKY', tip: 'TRIPS OVER CARROTS EVERYWHERE HE GOES.' },
  speedy: { name: 'SPEEDY', tip: 'BACK BEFORE LUNCH. GOES TWICE.' },
  handy: { name: 'HANDY', tip: 'FIXES SOMETHING ON THE WAY. GETS TIPPED FOR IT.' },
  nervous: { name: 'NERVOUS', tip: 'MIGHT SEE A BOBCAT AND COME STRAIGHT HOME.' }
};

/* ---------- places on the map ---------- */
const PLACES = {
  forest: { name: 'THE FOREST', sub: 'HOME', runs: ['creek', 'garden'], shops: [], song: 'title' },
  atl: { name: 'PEACHTREE', sub: 'ATL', runs: ['icebox'], shops: ['icebox', 'customs', 'market'], song: 'icebox' },
  farm: { name: 'ELLI\'S FARM', sub: 'WASHINGTON, GA', runs: ['farm'], shops: ['stand'], song: 'dexter' },
  marsh: { name: 'SULLIVAN\'S ISLAND', sub: 'SOUTH CAROLINA', runs: ['marsh'], shops: ['shack'], song: 'marsh' },
  paris: { name: 'PARIS', sub: 'FRANCE', runs: ['paris'], shops: ['maison'], song: 'french' },
  boulder: { name: 'BOULDER', sub: 'COLORADO', runs: ['boulder'], shops: ['gear'], song: 'lawn' }
};
const LVPLACE = { creek: 'forest', garden: 'forest', icebox: 'atl', farm: 'farm', marsh: 'marsh', paris: 'paris', boulder: 'boulder' };
const LVNAME = { creek: 'THE CREEK', garden: 'THE GARDEN', icebox: 'PEACHTREE', farm: 'THE FARM', marsh: 'THE MARSH', paris: 'PARIS', boulder: 'SANITAS' };
const LVEND = { creek: 'THE CREEK', garden: 'THE COOKOUT', farm: 'THE PORCH', marsh: 'THE DUNES', paris: 'THE TAXI', boulder: 'THE SUMMIT', icebox: 'THE ICE BOX' };

/* ---------- the stash: coveted things ---------- */
// cat: drip bags ride home trophy records.  ic: [icon shape, color, color2]
const STASH = {
  // drip (The Ice Box, Peachtree)
  rope: { cat: 'drip', name: 'GOLD ROPE', ic: ['rope', '#f6c645'], price: 250, shop: 'icebox', perk: 'CARROTS DRIFT TOWARD YOU.', vibes: 2 },
  pendant: { cat: 'drip', name: 'CARROT PENDANT', ic: ['pend', '#f6c645', '#ff8a1c'], price: 200, shop: 'icebox', perk: 'TEN PERCENT MORE CARROTS IN THE BANK.', vibes: 2 },
  iced: { cat: 'drip', name: 'ICED OUT CHAIN', ic: ['ice', '#e8f6ff', '#9ae8ff'], price: 400, shop: 'icebox', perk: 'GOLDEN CARROTS SHOW UP ON THE TRIP METER.', vibes: 3 },
  tennis: { cat: 'drip', name: 'TENNIS CHAIN', ic: ['chain', '#e8f6ff'], price: 300, shop: 'icebox', desc: 'NOBODY IN THE FAMILY PLAYS TENNIS.', vibes: 3 },
  pinky: { cat: 'drip', name: 'PINKY RING', ic: ['ring', '#f6c645', '#ff4fa0'], price: 150, shop: 'icebox', desc: 'FOR POINTING AT THINGS FANCILY.', vibes: 2 },
  stud: { cat: 'drip', name: 'EAR STUD', ic: ['stud', '#e8f6ff', '#9ae8ff'], price: 180, shop: 'icebox', desc: 'BUNNIES HAVE A LOT OF EAR TO WORK WITH.', vibes: 2 },
  sandchain: { cat: 'drip', name: 'SAND DOLLAR CHAIN', ic: ['sandch', '#f6c645', '#f2dca8'], price: 250, shop: 'shack', desc: 'PONTOON MADE IT. HE SAYS IT\'S WORTH ONE DOLLAR.', vibes: 2 },
  // bags and finery (Maison Carotte, Paris)
  obox: { cat: 'bags', name: 'ORANGE BOX', ic: ['box', '#ff8a1c', '#5a2a0a'], price: 300, shop: 'maison', desc: 'THE BOX IS THE POINT. THERE IS A BELT IN IT SOMEWHERE.', vibes: 3 },
  duffel: { cat: 'bags', name: 'MONOGRAM DUFFEL', ic: ['bag', '#8a5a32', '#e8c070'], price: 450, shop: 'maison', perk: 'THE FIRST DROP ON A HAUL DOESN\'T COUNT.', vibes: 3 },
  trunk: { cat: 'bags', name: 'MONOGRAM TRUNK', ic: ['trunk', '#8a5a32', '#e8c070'], price: 900, shop: 'maison', desc: 'HOLDS EXACTLY ONE CARROT. BEAUTIFULLY.', vibes: 6 },
  silk: { cat: 'bags', name: 'SILK SCARF', ic: ['scarf', '#ff8a1c', '#fff3b0'], price: 220, shop: 'maison', desc: 'IT HAS LITTLE CARROTS ON IT. OF COURSE IT DOES.', vibes: 2 },
  beret: { cat: 'bags', name: 'BERET', ic: ['beret', '#2a2430'], price: 120, shop: 'maison', desc: 'NOW HE SAYS "OUI." CONSTANTLY.', vibes: 1 },
  beanie: { cat: 'bags', name: 'BOULDER BEANIE', ic: ['beanie', '#c8302a'], price: 120, shop: 'gear', desc: 'KNIT BY A BUNNY NAMED, WE THINK, "SAGE."', vibes: 1 },
  sunhat: { cat: 'bags', name: 'MARSH SUNHAT', ic: ['beret', '#e8c870'], price: 140, shop: 'shack', desc: 'FOR SUNNING. ALL DAY. LIKE A CAT.', vibes: 1 },
  // the ride (Peachtree Customs)
  rims: { cat: 'ride', name: 'TWENTY-FOURS', ic: ['rim', '#c8ced8', '#f6c645'], price: 500, shop: 'customs', perk: 'THE ESCALADE GOES FASTER ON PEACHTREE.', vibes: 3 },
  hydro: { cat: 'ride', name: 'HYDRAULICS', ic: ['coil', '#c8ced8'], price: 400, shop: 'customs', perk: 'BIGGER HOPS OVER TRAFFIC.', vibes: 3 },
  neon: { cat: 'ride', name: 'NEON UNDERGLOW', ic: ['neon', '#ff4fa0', '#4fe0ff'], price: 300, shop: 'customs', perk: 'THE ESCALADE GLOWS. ALSO AT COOKOUTS.', vibes: 3 },
  subs: { cat: 'ride', name: 'SUBWOOFERS', ic: ['speaker', '#2a2430', '#8a8a96'], price: 350, shop: 'customs', desc: 'THE NEIGHBORS HAVE OPINIONS.', vibes: 4 },
  bumper: { cat: 'ride', name: 'NIBBLED BUMPER', ic: ['bumper', '#c8ced8'], desc: 'THE NIBBIN\' BUN GOT TO IT. IT\'S A CONVERSATION PIECE NOW.', vibes: 2 },
  // home
  grill: { cat: 'home', name: 'THE BIG GRILL', ic: ['grill', '#2a2430', '#ff6a2a'], desc: 'ONE DENT. SHAPED LIKE A BOBCAT. ADDS FLAVOR.', vibes: 6 },
  smoker: { cat: 'home', name: 'THE SMOKER', ic: ['smoker', '#3a3a40', '#9a9aa2'], price: 600, shop: 'market', desc: 'RIBS. ALL NIGHT. EVERY NIGHT.', vibes: 6 },
  lights: { cat: 'home', name: 'STRING LIGHTS', ic: ['lights', '#ffd86a', '#ff9a5a'], price: 150, shop: 'market', desc: 'THE ROOF BUN HUNG THEM. ONLY ON HIS SIDE.', vibes: 4 },
  speaker: { cat: 'home', name: 'THE BIG SPEAKER', ic: ['speaker', '#1a1420', '#ff4fa0'], desc: 'FORMERLY PROPERTY OF LES ESCARGOTS DISCO.', vibes: 6 },
  disco: { cat: 'home', name: 'DISCO BALL', ic: ['disco', '#c8ced8', '#ffffff'], price: 350, shop: 'maison', desc: 'HUNG IN SUNNY\'S TREE. SHE HAS NOT ASKED WHY.', vibes: 5 },
  swing: { cat: 'home', name: 'PORCH SWING', ic: ['swing', '#a07448', '#c8ced8'], price: 400, shop: 'stand', desc: 'DEXTER\'S IDEA. DEXTER\'S NAP SPOT, WHEN HE VISITS.', vibes: 3 },
  pool: { cat: 'home', name: 'KIDDIE POOL', ic: ['pool', '#5aa8ff', '#ff4fa0'], price: 200, shop: 'shack', desc: 'THE LAKE, BUT WORSE, BUT CLOSER.', vibes: 3 },
  hammock: { cat: 'home', name: 'THE HAMMOCK', ic: ['hammock', '#e8c870', '#5a3a22'], price: 800, shop: 'gear', perk: 'NAPS MAKE THE DAY LONGER: FOUR SUNS A DAY.', vibes: 3 },
  skis: { cat: 'home', name: 'TINY SKIS', ic: ['skis', '#c8302a', '#2a6ab8'], price: 300, shop: 'gear', desc: 'THERE IS NO SNOW IN ATLANTA. HE WEARS THEM TO THE MAILBOX.', vibes: 2 },
  // trophies from Wants
  stone: { cat: 'trophy', name: 'THE SKIPPING STONE', ic: ['stone', '#8c939a'], desc: 'SEVEN SKIPS. ALLEGEDLY.', vibes: 1 },
  peachcup: { cat: 'trophy', name: 'SWEETEST PEACH (GOLD)', ic: ['peach', '#f6c645'], desc: 'DEXTER HAD IT DIPPED IN GOLD SO NOBODY WOULD EAT IT. SOMEBODY TRIED.', vibes: 2 },
  clip: { cat: 'trophy', name: 'THE CLIPBOARD', ic: ['clip', '#a07448'], perk: 'ROUNDUPS: A BUMP ONLY SHAKES LOOSE ONE COUSIN.', vibes: 1 },
  crown: { cat: 'trophy', name: 'COLLARD CROWN', ic: ['crown', '#3f8a3a', '#6ab860'], desc: 'MADE OF COLLARDS. GETS EATEN EVERY FEW DAYS. REMADE.', vibes: 2 },
  watch: { cat: 'trophy', name: 'THE STOPWATCH', ic: ['watch', '#c8ced8', '#e03030'], perk: 'SUNDOWN RACES LAST A LITTLE LONGER.', vibes: 1 },
  ribbon: { cat: 'trophy', name: 'CAT-WALK RIBBON', ic: ['ribbon', '#2a78a8', '#f6c645'], desc: 'BEST IN SHOW. THE SHOW WAS PONTOON.', vibes: 1 },
  realeyes: { cat: 'trophy', name: 'REAL EYES', ic: ['specs', '#1a1420', '#ffffff'], perk: 'SUNNY CAN\'T TELL WHERE YOU\'RE LOOKING. NO ACORNS.', vibes: 2 },
  hammer: { cat: 'trophy', name: 'THE GOLDEN HAMMER', ic: ['hammer', '#f6c645', '#5a3a22'], desc: 'FROM THE ROOF BUN, WITH RESPECT. HE HAS NEVER GIVEN ANYBODY ANYTHING.', vibes: 2 },
  tag: { cat: 'trophy', name: 'BAGGAGE CLAIM TAG', ic: ['tag', '#f4ead0', '#c8302a'], desc: 'ATL TO CDG. THE BAG NEVER CAME. THE BUN DID.', vibes: 1 },
  hairball: { cat: 'trophy', name: 'THE BOBCAT\'S RESPECT', ic: ['hair', '#b8946a'], desc: 'IT\'S A HAIRBALL. IT MEANS EVERYTHING.', vibes: 2 },
  photo: { cat: 'trophy', name: 'SNOW BUN PHOTO', ic: ['photo', '#f4ead0', '#9ad0f0'], desc: 'THE SNOW BUN LOOKS LIKE THE BOBCAT. THE BOULDER BUNNIES SAY THAT\'S A SIGN.', vibes: 1 },
  note: { cat: 'trophy', name: 'SUNNY\'S THANK-YOU NOTE', ic: ['note', '#f4ead0', '#ff8a9a'], desc: 'IT SAYS "HMM." SHE MEANT IT.', vibes: 2 },
  shoe: { cat: 'trophy', name: 'SEVEN\'S HORSESHOE', ic: ['shoe', '#c8ced8'], desc: 'SEVEN THREW IT AT YOU. LOVINGLY.', vibes: 1 },
  bigcup: { cat: 'trophy', name: 'BIGGEST COOKOUT IN GEORGIA', ic: ['cup', '#f6c645', '#ff8a1c'], desc: 'THE WHOLE FAMILY. EVERY FRIEND. ONE GARDEN.', vibes: 10 },
  // the album, on vinyl
  r_buns: { cat: 'records', name: 'GEORGIA BUNS', ic: ['record', '#f6c645'], song: 'buns', desc: 'THE THEME. ESCALADE MUSIC.', vibes: 1 },
  r_sunny: { cat: 'records', name: 'SUNNY THE SQUIRREL', ic: ['record', '#ff8a9a'], song: 'sunny', price: 120, shop: 'market', vibes: 1 },
  r_nib: { cat: 'records', name: 'NIBBIN\' BUN', ic: ['record', '#c79c6c'], song: 'nibbin', price: 120, shop: 'market', vibes: 1 },
  r_bob: { cat: 'records', name: 'THE BOBCAT', ic: ['record', '#8a6a3a'], song: 'bobcat', vibes: 1 },
  r_marsh: { cat: 'records', name: 'MARSH BUNS', ic: ['record', '#5aa0c8'], song: 'marsh', price: 120, shop: 'shack', vibes: 1 },
  r_ice: { cat: 'records', name: 'ICE BOX', ic: ['record', '#9ae8ff'], song: 'icebox', price: 120, shop: 'market', vibes: 1 },
  r_garden: { cat: 'records', name: 'GARDEN PARTY', ic: ['record', '#7ad050'], song: 'garden', vibes: 1 },
  r_dexter: { cat: 'records', name: 'DEXTER', ic: ['record', '#e2c48e'], song: 'dexter', price: 120, shop: 'stand', vibes: 1 },
  r_french: { cat: 'records', name: 'LA FRENCH CONNEXION', ic: ['record', '#ff8a1c'], song: 'french', price: 120, shop: 'maison', vibes: 1 }
};
const STASH_CATS = [['drip', 'DRIP'], ['bags', 'FINERY'], ['ride', 'THE RIDE'], ['home', 'HOME'], ['records', 'RECORDS'], ['trophy', 'TROPHIES'], ['pantry', 'PANTRY']];

/* ---------- the spread: cookout food ---------- */
const FOOD = {
  juice: { name: 'CARROT JUICE', ic: ['juice', '#ff8a1c'], vibes: 2, price: 10, shop: 'market' },
  greens: { name: 'COLLARDS', ic: ['greens', '#3f8a3a'], vibes: 3, price: 15, shop: 'market' },
  ribs: { name: 'RIBS', ic: ['ribs', '#8a3a1a'], vibes: 4, price: 25, shop: 'market' },
  pud: { name: 'BANANA PUDDING', ic: ['pud', '#f6e08a'], vibes: 5, price: 30, shop: 'market' },
  peach: { name: 'PEACHES', ic: ['peach', '#ffb347'], vibes: 2, price: 10, shop: 'stand' },
  cobbler: { name: 'PEACH COBBLER', ic: ['cobbler', '#d8a050'], vibes: 6, price: 40, shop: 'stand' },
  corn: { name: 'CORNBREAD', ic: ['corn', '#f0c040'], vibes: 2, price: 15, shop: 'stand' },
  melon: { name: 'WATERMELON', ic: ['melon', '#e03a4a'], vibes: 3, price: 20, shop: 'stand' },
  eggs: { name: 'DEVILED EGGS', ic: ['eggs', '#fff0c0'], vibes: 3, price: 12, shop: 'stand' },
  nuts: { name: 'BOILED PEANUTS', ic: ['nuts', '#c8a070'], vibes: 2, price: 12, shop: 'shack' },
  croiss: { name: 'CROISSANTS', ic: ['croiss', '#e0a050'], vibes: 3, price: 15, shop: 'maison' },
  mix: { name: 'TRAIL MIX', ic: ['mix', '#a07448'], vibes: 1, price: 15, shop: 'gear' },
  potato: { name: 'SWEET POTATOES', ic: ['potato', '#c8603a'], vibes: 2 },
  lettuce: { name: 'LETTUCE', ic: ['lettuce', '#7ad050'], vibes: 1 },
  stew: { name: 'CARROT STEW', ic: ['stew', '#ff8a1c'], vibes: 8 },
  ice: { name: 'A BAG OF ICE', ic: ['icebag', '#bfe8ff'], vibes: 1 }
};
const GUESTS = {
  dexter: { name: 'DEXTER', vibes: 5 }, elli: { name: 'MISS ELLI AND SEVEN', vibes: 6 }, pontoon: { name: 'PONTOON', vibes: 5 },
  snails: { name: 'LES ESCARGOTS DISCO', vibes: 7 }, bobcat: { name: 'THE BOBCAT (ON THE ESCALADE)', vibes: 6 }, sunny: { name: 'SUNNY (FROM HER TREE)', vibes: 5 },
  boulder: { name: 'THE BOULDER BUNNIES', vibes: 6 }
};

/* ---------- shops ---------- */
const SHOPS = {
  icebox: { name: 'THE ICE BOX', place: 'atl', song: 'icebox', hello: 'WELCOME TO THE ICE BOX. EVERYTHING DRIPS.', col: ['#2a2058', '#9ae8ff'] },
  customs: { name: 'PEACHTREE CUSTOMS', place: 'atl', song: 'theme', hello: 'BRING THE ESCALADE AROUND BACK.', col: ['#3a3a44', '#f6c645'] },
  market: { name: 'THE CORNER MARKET', place: 'atl', song: 'cookout', hello: 'GREENS, RIBS, RECORDS IN THE BACK.', col: ['#8a3a22', '#ffe08a'] },
  stand: { name: 'THE PEACH STAND', place: 'farm', song: 'dexter', hello: 'HONOR SYSTEM. DEXTER IS THE SYSTEM.', col: ['#b8302a', '#ffe08a'] },
  shack: { name: 'PONTOON\'S SHACK', place: 'marsh', song: 'marsh', hello: 'TAKE YOUR TIME. I AM.', col: ['#2a78a8', '#ffe9b0'] },
  maison: { name: 'MAISON CAROTTE', place: 'paris', song: 'french', hello: 'BONJOUR. EVERYTHING IS ORANGE.', col: ['#34307a', '#ff8a1c'] },
  gear: { name: 'BOULDER GEAR', place: 'boulder', song: 'lawn', hello: 'HEY CUZ. EVERYTHING\'S MADE OF HEMP. JUST KIDDING. MOSTLY.', col: ['#6a4a8a', '#bfe8ff'] }
};
function shopItems(id) { const out = []; for (const k in STASH) if (STASH[k].shop === id) out.push(['s', k]); for (const k in FOOD) if (FOOD[k].shop === id) out.push(['f', k]); return out; }

/* ---------- errands: ask for one thing, get... something ---------- */
// ok: what you wanted. fancy: the fancy version (costs carrots). lit: what a literal mind heard.
const ERRANDS = {
  ice: { name: 'GET ICE', ask: 'ICE', place: 'atl', ok: { food: { ice: 2 }, say: 'A BAG OF ICE. GOOD AND COLD. MOSTLY.' }, fancy: { stash: 'pinky', cost: 60, say: 'ICE. THE KIND YOU WEAR. IT\'S A PINKY RING.' }, lit: { carrots: 5, say: 'HE HEARD "REAL EYES." CAME BACK WITH A BAG OF GOOGLY EYES. THEY\'RE ON THE FRIDGE NOW.' } },
  greens: { name: 'PICK UP COLLARDS', ask: 'COLLARDS', place: 'atl', ok: { food: { greens: 2 }, say: 'TWO BUNCHES OF COLLARDS.' }, fancy: { food: { greens: 3 }, cost: 30, say: 'HEIRLOOM COLLARDS. THEY HAVE A BACKSTORY.' }, lit: { carrots: 5, say: 'A COLLARED SHIRT. HE IS WEARING IT. IT IS TOO BIG.' } },
  ribs: { name: 'GET RIBS', ask: 'RIBS', place: 'atl', ok: { food: { ribs: 2 }, say: 'TWO RACKS OF RIBS.' }, fancy: { food: { ribs: 3 }, cost: 50, say: 'THE GOOD RIBS. THE GUY KNOWS HIM BY NAME. HE DOESN\'T HAVE A NAME.' }, lit: { carrots: 5, say: 'RIBBONS. A WHOLE SPOOL. "YOU SAID RIBS." NOBODY SAID RIBBONS.' } },
  juice: { name: 'MAKE CARROT JUICE', ask: 'CARROT JUICE', place: 'forest', ok: { food: { juice: 3 }, say: 'THREE JUGS OF CARROT JUICE.' }, fancy: { food: { juice: 4 }, cost: 25, say: 'COLD-PRESSED. HE PRESSED IT WITH A COLD FACE.' }, lit: { food: { juice: 1 }, carrots: 10, say: 'ONE CARROT, AND SEPARATELY, SOME JUICE. "IT\'S CARROT JUICE IF YOU BELIEVE."' } },
  peaches: { name: 'GET PEACHES', ask: 'PEACHES', place: 'farm', ok: { food: { peach: 3 }, say: 'THREE PEACHES FROM THE STAND.' }, fancy: { food: { cobbler: 1 }, cost: 40, say: 'SKIPPED THE PEACHES. WENT STRAIGHT TO MISS ELLI\'S COBBLER.' }, lit: { carrots: 5, say: 'A DRAWING OF A PEACH. HE DID IT HIMSELF. IT\'S NOT BAD.' } },
  melon: { name: 'GET A WATERMELON', ask: 'A WATERMELON', place: 'farm', ok: { food: { melon: 1 }, say: 'ONE WATERMELON. THE BIGGEST THEY HAD.' }, fancy: { food: { melon: 2 }, cost: 30, say: 'TWO SEEDLESS. "SEEDS ARE FOR PEASANTS."' }, lit: { food: { ice: 1 }, say: 'WATER. AND A MELON. IN SEPARATE BAGS. THE WATER IS ICE NOW.' } },
  eggs: { name: 'GET EGGS FROM THE CHICKENS', ask: 'EGGS', place: 'farm', ok: { food: { eggs: 2 }, say: 'DEVILED EGGS. THE CHICKENS WERE COOL ABOUT IT.' }, fancy: { food: { eggs: 3 }, cost: 25, say: 'DEVILED EGGS WITH PAPRIKA IN A LITTLE PATTERN.' }, lit: { carrots: 5, say: 'A CHICKEN. THE CHICKEN IS NOW AT THE COOKOUT. THE CHICKEN SEEMS FINE.' } },
  nuts: { name: 'GET BOILED PEANUTS', ask: 'BOILED PEANUTS', place: 'marsh', ok: { food: { nuts: 2 }, say: 'A SACK OF BOILED PEANUTS FROM A STAND BY THE BRIDGE.' }, fancy: { food: { nuts: 3 }, cost: 25, say: 'CAJUN BOILED. HIS EARS ARE STILL HOT.' }, lit: { food: { greens: 1 }, say: 'PEAS. AND SEPARATELY, NUTS. HE MADE A SALAD OUT OF IT. IT\'S FINE.' } },
  croiss: { name: 'GET CROISSANTS', ask: 'CROISSANTS', place: 'paris', ok: { food: { croiss: 2 }, say: 'A BAG OF CROISSANTS, STILL WARM, SOMEHOW.' }, fancy: { stash: 'beret', cost: 60, say: 'CROISSANTS AND A BERET. HE SAYS THEY COME TOGETHER.' }, lit: { carrots: 10, say: 'A ROCK SHAPED LIKE THE MOON. "CRESCENT." HE IS VERY PROUD.' } },
  record: { name: 'PICK UP A RECORD', ask: 'A RECORD', place: 'atl', ok: { record: 1, say: 'A RECORD FROM THE BIN IN THE BACK.' }, fancy: { record: 1, cost: 40, say: 'A RECORD, SIGNED. BY HIM. IN THE CAR.' }, lit: { carrots: 20, say: 'HE SET A RECORD. FASTEST ROUND TRIP TO NOWHERE.' } },
  pud: { name: 'GET BANANA PUDDING', ask: 'BANANA PUDDING', place: 'atl', ok: { food: { pud: 1 }, say: 'A PAN OF BANANA PUDDING. VANILLA WAFERS ON TOP.' }, fancy: { food: { pud: 2 }, cost: 40, say: 'TWO PANS. ONE IS FOR THE ROOF BUN, WHO WILL NOT COME DOWN FOR IT.' }, lit: { food: { peach: 1 }, say: 'A BANANA. AND A PUDDING CUP. HE COMBINED THEM. IT WORKED.' } },
  corn: { name: 'GET CORNBREAD', ask: 'CORNBREAD', place: 'farm', ok: { food: { corn: 2 }, say: 'TWO SKILLETS OF CORNBREAD.' }, fancy: { food: { corn: 3 }, cost: 25, say: 'CORNBREAD WITH HONEY BUTTER. HE WANTS YOU TO KNOW ABOUT THE BUTTER.' }, lit: { food: { lettuce: 1 }, say: 'AN EAR OF CORN AND A SLICE OF WHITE BREAD. NOT EVEN TOUCHING.' } },
  mix: { name: 'GET TRAIL MIX', ask: 'TRAIL MIX', place: 'boulder', ok: { food: { mix: 2 }, say: 'TWO BAGS OF TRAIL MIX. ALL THE GOOD PARTS ARE STILL IN THERE.' }, fancy: { stash: 'beanie', cost: 60, say: 'TRAIL MIX AND A BEANIE. THE BEANIE WAS THE POINT.' }, lit: { carrots: 10, say: 'HE MIXED UP THE TRAIL. THE BOULDER BUNNIES ARE LOST NOW.' } }
};
// where a lost cousin ends up, and what he brings back
const SOUVENIRS = [
  ['PARIS', { food: { croiss: 2 } }, 'A BAG OF CROISSANTS'], ['SULLIVAN\'S ISLAND', { food: { nuts: 2 } }, 'BOILED PEANUTS'], ['WASHINGTON, GA', { food: { peach: 2 } }, 'TWO PEACHES'],
  ['BOULDER', { food: { mix: 2 } }, 'TRAIL MIX'], ['THE AIRPORT', { carrots: 25 }, 'TWENTY-FIVE CARROTS FROM UNDER THE SEATS'], ['A DINER IN MACON', { food: { corn: 1 } }, 'SOMETHING HE CALLS CORNBREAD'],
  ['STONE MOUNTAIN', { carrots: 15 }, 'FIFTEEN CARROTS AND A SUNBURN'], ['A BOAT', { food: { melon: 1 } }, 'A WATERMELON. FROM THE BOAT.']
];

/* ---------- the Want List ---------- */
// steps: { run: level, mode, p } or { drive: 1 } or { drift: {...} }. mode: fetch haul roundup sprint toll hunt free
const done = id => SG_SAVE() && (SG_SAVE().wants[id] || {}).st === 'done';
const placeOpen = id => SG_SAVE() && !!SG_SAVE().places[id];
const WANTS = {
  creek: { who: 2, text: 'ROCKS. CREEK. TODAY.', sub: 'WOKE UP WITH A BURNING NEED TO THROW ROCKS IN THE CREEK. CAN\'T BE STOPPED. WON\'T BE.',
    steps: [{ run: 'creek', mode: 'fetch', title: 'ROCKS IN THE CREEK', tip: 'GRAB THREE GOOD ROCKS. SKIP THEM AT THE CREEK.' }],
    reward: { carrots: 50, stash: ['stone'] }, roles: ['THE CREEK BUN', 'THE SKIPPER', 'THE ROCK BUN'],
    land: 'HE SKIPPED ONE SEVEN TIMES. NOBODY SAW. HE HAS TOLD EVERYBODY.', gate: () => true },
  ice: { who: 6, text: 'DRIP DRIP LIKE WATER.', sub: 'WOKE UP NEEDING MORE ICE. NOT THE COLD KIND. HALF THE FAMILY HEARD THE COLD KIND.',
    steps: [{ drive: 1, run: 'icebox', mode: 'drive', title: 'THE ICE BOX', tip: 'DRIVE PEACHTREE. GRAB ICE, HOP TRAFFIC ON THE HYDRAULICS, PICK YOUR DRIP.' }],
    reward: { carrots: 40 }, roles: ['THE ICE BUN', 'THE JEWELER', 'DRIP'],
    land: 'TWELVE WENT TO THE ICE BOX. THREE CAME BACK WITH BAGS OF ACTUAL ICE. TWO ARE STILL OUT LOOKING FOR "REAL EYES."', gate: () => done('creek'), opens: ['atl'] },
  grill: { who: 10, text: 'WE NEED A BIGGER GRILL.', sub: 'TONIGHT\'S COOKOUT IS DOWN BY THE CREEK. THE NEW GRILL IS AT THE HOUSE. THE HOUSE IS NOT AT THE CREEK.',
    steps: [{ run: 'creek', mode: 'haul', p: { obj: 'grill' }, title: 'HAUL THE GRILL', tip: 'CARRY IT TO THE CREEK. BUMPS KNOCK IT LOOSE. GO BACK FOR IT.' }],
    reward: { carrots: 40, stash: ['grill'] }, roles: ['THE GRILL BUN', 'PITMASTER', 'SMOKEY'],
    land: 'THE GRILL MADE IT. ONE NEW DENT, SHAPED LIKE A BOBCAT. HE SAYS IT ADDS FLAVOR.', gate: () => done('creek') },
  peach: { who: 4, text: 'NEED THE SWEETEST PEACH IN GEORGIA.', sub: 'DEXTER SAYS CITY PEACHES ARE "A RUMOR." WE\'RE DRIVING TO WASHINGTON TO SETTLE IT.',
    steps: [{ run: 'farm', mode: 'fetch', title: 'COUNTRY COUSIN', tip: 'THREE PEACHES. RIDE SEVEN IF HE LETS YOU.' }],
    reward: { carrots: 50, food: { peach: 3, cobbler: 1 }, guest: 'dexter', stash: ['peachcup'] }, roles: ['THE PEACH BUN', 'THE COUNTRY BUN', 'SWEET TOOTH'],
    land: 'MISS ELLI MADE A COBBLER. DEXTER ATE A THIRD OF IT AND SAID HE WAS "JUST CHECKING IT."', gate: () => placeOpen('farm') },
  roundup: { who: 12, text: 'EVERYBODY TO THE CREEK. NOW.', sub: 'THE FAMILY IS SCATTERED ALL OVER THE FOREST, ASLEEP. HE HAS A WHISTLE AND A DREAM.',
    steps: [{ run: 'creek', mode: 'roundup', p: { n: 6 }, title: 'HEADCOUNT', tip: 'WAKE THE COUSINS AND THEY FOLLOW YOU. BUMPS SHAKE A FEW LOOSE. GO BACK FOR THEM.' }],
    reward: { carrots: 50, stash: ['clip'] }, roles: ['THE HEADCOUNT BUN', 'THE SHEPHERD', 'UNCLE BUN'],
    land: 'HE COUNTED SEVENTEEN. THEN SIXTEEN. THEN NINETEEN. HE\'S CALLING IT SEVENTEEN.', gate: () => done('grill') },
  collards: { who: 13, text: 'COLLARDS. A MOUNTAIN OF COLLARDS.', sub: 'MISS ELLI TRADES GREENS FOR CARROTS. HE WANTS ENOUGH GREENS TO BE SEEN FROM SPACE.',
    steps: [{ run: 'farm', mode: 'toll', p: { n: 75 }, title: 'GREENS MONEY', tip: 'COLLECT 75 CARROTS BEFORE THE PORCH. MISS ELLI TAKES CARROTPAY.' }],
    reward: { carrots: 20, food: { greens: 5 }, stash: ['crown'] }, roles: ['THE COLLARD BUN', 'THE COLLARD KING', 'GREENS'],
    land: 'FIVE BUSHELS. THE ESCALADE SMELLS LIKE A SUNDAY AND ALWAYS WILL.', gate: () => done('peach') },
  sundown: { who: 14, text: 'GONNA BEAT THE SUNDOWN TO THE CREEK.', sub: 'NOBODY CHALLENGED HIM. HE CHALLENGED THE SUN. THE SUN DOES NOT KNOW.',
    steps: [{ run: 'creek', mode: 'sprint', title: 'RACE THE SUN', tip: 'GET TO THE CREEK BEFORE THE SKY GOES DARK.' }],
    reward: { carrots: 50, stash: ['watch'] }, roles: ['THE SUNDOWN BUN', 'ZOOM', 'THE FAST ONE'],
    land: 'HE WON. THE SUN WENT DOWN ANYWAY. HE CONSIDERS THIS A TIE, WHICH HE WON.', gate: () => done('roundup') },
  cat: { who: 5, text: 'GOTTA LEARN TO WALK LIKE A CAT.', sub: 'PONTOON SITS UP LIKE A CAT AND SUNS ALL DAY. HE HAS NEVER WANTED ANYTHING MORE.',
    steps: [{ run: 'marsh', mode: 'fetch', title: 'MARSH BUNS', tip: 'THREE SAND DOLLARS. THE PLUFF MUD IS SLICK. PONTOON IS PAST THE DUNES.' }],
    reward: { carrots: 50, guest: 'pontoon', food: { nuts: 2 }, stash: ['ribbon'] }, roles: ['THE CAT BUN', 'SITS-UP', 'THE SUNNING BUN'],
    land: 'HE CAN SIT LIKE A CAT NOW. HE DOES IT AT THE DINNER TABLE. NOBODY LIKES IT.', gate: () => placeOpen('marsh') },
  eyes: { who: 9, text: 'HE SAID REAL ICE. I HEARD REAL EYES.', sub: 'AND NOW HE CAN\'T STOP THINKING ABOUT IT. PONTOON SAYS THERE\'S A PAIR OUT IN THE DUNES.',
    steps: [{ run: 'marsh', mode: 'hunt', p: { obj: 'realeyes' }, title: 'REAL EYES', tip: 'THE PEBBLE PINGS WHEN YOU\'RE CLOSE. YOU CAN\'T LEAVE WITHOUT THEM.' }],
    reward: { carrots: 40, stash: ['realeyes'] }, roles: ['THE REAL EYES BUN', 'FOUR EYES', 'SPECS'],
    land: 'THEY\'RE SUNGLASSES WITH EYES PAINTED ON. HE WEARS THEM TO BED. SUNNY HAS NO IDEA WHERE HE\'S LOOKING.', gate: () => done('ice') && placeOpen('marsh') },
  stew: { who: 15, text: 'CARROT STEW. TONIGHT. FROM SCRATCH.', sub: 'THE WHOLE GARDEN GOES IN THE POT. HE HAS A RECIPE. HE HAS NOT READ IT.',
    steps: [{ run: 'garden', mode: 'fetch', title: 'STEW FIXINGS', tip: 'LETTUCE, A SWEET POTATO, AND THE BIG CARROT.' },
      { drift: { text: 'GOT THE VEGETABLES. FORGOT THE ONIONS. ALSO THE ROOF IS LEAKING, AND THE ROOF BUN IS TAKING IT PERSONALLY.', stick: 'STICK TO THE STEW', go: 'FIX THE ROOF',
        stickSay: 'NO ONIONS. HE MAKES THE STEW ANYWAY.', goSay: 'STEW CAN WAIT. THE ROOF CANNOT.',
        goSteps: [{ run: 'creek', mode: 'haul', rev: 1, p: { obj: 'shingles' }, title: 'FIX THE ROOF', tip: 'THE SHINGLES ARE DOWN BY THE CREEK. HAUL THEM BACK UP TO THE HOUSE.' }],
        goReward: { carrots: 60, stash: ['hammer'] }, goRoles: ['THE HANDY BUN', 'THE ROOFER', 'THE FORGETFUL BUN'],
        goLand: 'SUN WENT DOWN. ROOF\'S FIXED. NOBODY REMEMBERS THE STEW. THE ROOF BUN HAS NEVER BEEN HAPPIER.' } }],
    reward: { carrots: 40, food: { stew: 2 } }, roles: ['THE STEW BUN', 'CHEF', 'CARROT STEW'],
    land: 'NO ONIONS. STILL THE BEST STEW ANYBODY EVER HAD. THE ROOF DRIPPED IN IT A LITTLE. HE CALLS THAT SEASONING.', gate: () => done('collards') },
  paris: { who: 3, text: 'PARIS. ALL SEVENTEEN OF US. SHOPPING.', sub: 'NOBODY SPEAKS FRENCH. THE UBER TAKES EVERYBODY TO THE BEACH. HE GETS LEFT AT BAGGAGE CLAIM. HE IS FINE WITH IT.',
    steps: [{ run: 'paris', mode: 'fetch', title: 'THE FRENCH CONNECTION', tip: 'THREE ORANGE BOXES. MAISON CAROTTE IS PAST LE CLUB.' }],
    reward: { carrots: 60, stash: ['obox', 'tag'], food: { croiss: 2 } }, roles: ['THE BAGGAGE CLAIM BUN', 'THE PARIS BUN', 'MONSIEUR BUN'],
    land: 'DAYS LATER HE SHOWED UP AT THE BEACH UNANNOUNCED, LOADED DOWN WITH ORANGE BOXES AND EXTREMELY BLINGIN\'.', gate: () => placeOpen('paris') },
  speaker: { who: 11, text: 'THE COOKOUT NEEDS REAL SPEAKERS.', sub: 'LES ESCARGOTS DISCO ARE SELLING THEIR OLD ONE. IT\'S IN PARIS. THE COOKOUT IS NOT.',
    steps: [{ run: 'paris', mode: 'haul', p: { obj: 'speaker' }, title: 'HAUL THE SPEAKER', tip: 'CARRY IT ACROSS PARIS TO THE TAXI. DON\'T DROP THE BASS.' }],
    reward: { carrots: 50, stash: ['speaker'], guest: 'snails' }, roles: ['THE DJ BUN', 'THE AUX CORD', 'BASS'],
    land: 'TOO BIG FOR THE ESCALADE. IT RODE HOME ON THE ROOF. THE ROOF BUN RODE WITH IT. HE CALLS IT HIS TOUR.', gate: () => done('paris') },
  bobcat: { who: 16, text: 'GONNA MAKE PEACE WITH THE BOBCAT.', sub: 'THE MOST NERVOUS BUN ALIVE IS DONE BEING NERVOUS. ONE BASKET OF CARROTS. ONE BOBCAT.',
    steps: [{ run: 'creek', mode: 'haul', p: { obj: 'basket' }, title: 'PEACE OFFERING', tip: 'THE BOBCAT IS UP. GET THE BASKET TO HIS TREE IN ONE PIECE.' }],
    reward: { carrots: 50, guest: 'bobcat', stash: ['hairball'] }, roles: ['THE BRAVE BUN', 'THE BOBCAT WHISPERER', 'THE NEGOTIATOR'],
    land: 'THE BOBCAT ATE THE CARROTS, SANG HIS SONG, AND LEFT A HAIRBALL ON THE BASKET. THAT\'S HOW YOU KNOW IT\'S RESPECT.', gate: () => done('sundown') && SG_SAVE().day >= 6 },
  harvest: { who: 7, text: 'HARVEST DAY. ALL OF IT.', sub: 'LETTUCE, SWEET POTATOES, AND A CARROT HE\'S BEEN WATCHING SINCE SPRING. THEN THE BIGGEST PARTY EVER.',
    steps: [{ run: 'garden', mode: 'fetch', title: 'GARDEN PARTY', tip: 'HARVEST ALL THREE. THE GROWL IN THE CABBAGE IS PROBABLY FINE.' }],
    reward: { carrots: 50, food: { lettuce: 2, potato: 3, juice: 3 }, stash: ['lights'] }, roles: ['THE GARDEN BUN', 'GREEN THUMB', 'THE HARVEST BUN'],
    land: 'THE GROWL IN THE CABBAGE WAS THE NIBBIN\' BUN. THE CABBAGE IS GONE. HE DOES NOT REGRET IT.', gate: () => done('stew') },
  sanitas: { who: 8, text: 'GONNA CLIMB MOUNT SANITAS.', sub: 'HEARD THERE\'S SNOW AT THE TOP. HE HAS NEVER SEEN SNOW. HE PACKED SUNSCREEN AND A GRILL.',
    steps: [{ run: 'boulder', mode: 'fetch', title: 'CLIMBING SANITAS', tip: 'RUN AT THE ROCK TO CLIMB. HOLD JUMP TO GO FASTER. THREE SNOWBALLS.' }],
    reward: { carrots: 60, guest: 'boulder', stash: ['photo'], food: { mix: 2 } }, roles: ['THE SNOW BUN', 'THE CLIMBER', 'MOUNTAIN BUN'],
    land: 'HE BUILT A SNOW BUN AT THE TOP. IT LOOKED LIKE THE BOBCAT. THE BOULDER BUNNIES SAY THAT\'S A SIGN.', gate: () => placeOpen('boulder') },
  // side wants: no new names, but friends for the big cookout
  sunny: { who: 0, runner: 2, side: 1, text: 'IT\'S SUNNY\'S BIRTHDAY. SHE CAN\'T KNOW I KNOW.', sub: 'THE ROOF BUN DOESN\'T COME DOWN, SO YOU\'RE GOING. THERE\'S A GOLDEN ACORN SOMEWHERE IN THE FOREST.',
    steps: [{ run: 'creek', mode: 'hunt', p: { obj: 'acorn' }, title: 'THE GOLDEN ACORN', tip: 'THE PEBBLE PINGS WHEN YOU\'RE CLOSE. FIND IT BEFORE THE CREEK.' }],
    reward: { carrots: 40, guest: 'sunny', stash: ['note'] },
    land: 'SUNNY TOOK THE ACORN, SAID "HMM," AND ONLY DROPPED ONE ACORN ON ANYBODY ALL NIGHT. THAT\'S LOVE.', gate: () => SG_SAVE().day >= 4 },
  nibcar: { who: 1, side: 1, text: 'THE ESCALADE LOOKS DELICIOUS TODAY.', sub: 'THE NIBBIN\' BUN HAS BEEN STARING AT THE BUMPER SINCE BREAKFAST. GET HIM SEVENTY CARROTS. FAST.',
    steps: [{ run: 'garden', mode: 'toll', p: { n: 70 }, title: 'FEED THE NIBBIN\' BUN', tip: 'COLLECT 70 CARROTS. OR DON\'T, AND SEE WHAT HAPPENS TO THE ESCALADE.' }],
    reward: { carrots: 20 }, lowReward: { stash: ['bumper'] },
    land: 'SEVENTY CARROTS, GONE IN A MINUTE. THE ESCALADE LIVES. THE NIBBIN\' BUN IS ALREADY LOOKING AT THE COUCH.',
    lowLand: 'NOT ENOUGH CARROTS. HE NIBBED THE BUMPER. HE SAYS IT TASTED LIKE A NEW CAR.', gate: () => SG_SAVE().day >= 3 },
  seven: { who: 4, side: 1, text: 'SEVEN WANTS TO BE LOOKED AT.', sub: 'DEXTER CALLED. SEVEN HAS BEEN STANDING IN THE PASTURE LOOKING MAJESTIC FOR THREE DAYS AND NOBODY HAS COME.',
    steps: [{ run: 'farm', mode: 'sprint', title: 'LOOK AT SEVEN', tip: 'RIDE SEVEN ACROSS THE PASTURE AND GET TO THE PORCH BEFORE SUNDOWN.' }],
    reward: { carrots: 50, guest: 'elli', stash: ['shoe'] },
    land: 'SEVEN WAS LOOKED AT. MISS ELLI CLAPPED. DEXTER SLEPT THROUGH THE WHOLE THING ON THE PORCH SWING.', gate: () => done('peach') && SG_SAVE().day >= 4 },
  finale: { who: 2, side: 1, finale: 1, text: 'THE BIGGEST COOKOUT IN GEORGIA.', sub: 'SEVENTEEN COUSINS. EVERY FRIEND THEY\'VE GOT. ONE GARDEN. GET EVERYBODY THERE.',
    steps: [{ run: 'garden', mode: 'roundup', p: { all: 1 }, title: 'THE BIGGEST COOKOUT', tip: 'ROUND UP THE WHOLE FAMILY. EVERY LAST ONE OF THEM.' }],
    reward: { carrots: 200, stash: ['bigcup'] },
    land: 'EVERYBODY CAME. THE BOBCAT SANG. SUNNY STAYED IN HER TREE AND DANCED A LITTLE. NOBODY WROTE IT DOWN, SO HERE IT IS.', gate: () => FAM.every((f, i) => i < 2 || famRole(i)) }
};
const STORY_ORDER = ['creek', 'ice', 'grill', 'peach', 'roundup', 'collards', 'sundown', 'cat', 'eyes', 'stew', 'paris', 'speaker', 'bobcat', 'harvest', 'sanitas', 'sunny', 'nibcar', 'seven', 'finale'];

/* ---------- daily wants: small ones, every morning ---------- */
const DAILY = [
  { mode: 'haul', obj: 'melon', text: 'HAUL A WATERMELON TO THE COOKOUT.', lv: ['creek', 'farm', 'garden', 'marsh'], food: { melon: 1 } },
  { mode: 'haul', obj: 'cooler', text: 'THE CARROT JUICE COOLER HAS TO GET THERE COLD.', lv: ['creek', 'farm', 'garden', 'marsh', 'boulder'], food: { juice: 3 } },
  { mode: 'haul', obj: 'cobbler', text: 'MISS ELLI SENT A COBBLER. DON\'T. DROP. IT.', lv: ['farm'], food: { cobbler: 1 } },
  { mode: 'haul', obj: 'obox', text: 'CARRY THE ORANGE BOX. CAREFULLY. IT\'S MOSTLY BOX.', lv: ['paris'], food: { croiss: 1 } },
  { mode: 'toll', n: 60, text: 'NEED 60 CARROTS. DON\'T ASK WHAT FOR.', lv: ['creek', 'farm', 'garden', 'marsh', 'paris', 'boulder'], bonus: 30 },
  { mode: 'toll', n: 75, text: 'SAVING UP FOR SOMETHING SHINY. 75 CARROTS.', lv: ['creek', 'farm', 'marsh', 'paris'], bonus: 45 },
  { mode: 'sprint', text: 'BET I CAN BEAT THE SUN TO THE END.', lv: ['creek', 'farm', 'garden', 'marsh', 'paris', 'boulder'] },
  { mode: 'roundup', n: 4, text: 'THE COUSINS WANDERED OFF AGAIN.', lv: ['creek', 'farm', 'garden', 'marsh', 'paris', 'boulder'] },
  { mode: 'hunt', obj: 'chain', text: 'LOST MY CHAIN OUT THERE. NOBODY TELL THE ICE BUN.', lv: ['creek', 'farm', 'garden', 'marsh', 'paris', 'boulder'], bonus: 20 },
  { mode: 'hunt', obj: 'pebble', text: 'DROPPED MY PEBBLE PHONE. IT\'S RINGING SOMEWHERE.', lv: ['creek', 'farm', 'garden', 'marsh', 'boulder'], bonus: 20 },
  { mode: 'hunt', obj: 'record', text: 'HEARD THERE\'S A RECORD OUT THERE NOBODY\'S CLAIMED.', lv: ['creek', 'farm', 'marsh', 'paris', 'boulder'], record: 1 },
  { mode: 'drive', text: 'JUST WANNA CRUISE PEACHTREE.', lv: ['icebox'], bonus: 20 },
  { mode: 'fetch', text: 'THREE OF EVERYTHING. AGAIN. FOR LUCK.', lv: ['farm', 'marsh', 'paris', 'garden', 'boulder'], bonus: 20 }
];

/* ---------- phone calls ---------- */
const CALLS = {
  dexter: { from: 'DEXTER', who: 'dexter', when: s => s.day >= 3 && done('creek'), opens: 'farm',
    lines: ['CITY COUSINS. DEXTER HERE. FROM THE BARN.', 'Y\'ALL EVER HAD A REAL PEACH? NOT A GROCERY STORE PEACH. A REAL ONE.', 'COME UP TO WASHINGTON. BRING NOTHING. I MEAN THAT. LAST TIME Y\'ALL BROUGHT THE NIBBIN\' BUN.'] },
  pontoon: { from: 'PONTOON', who: 'pontoon', when: s => s.day >= 4 && done('peach'), opens: 'marsh',
    lines: ['HEY. IT\'S PONTOON. ON THE ISLAND.', 'Y\'ALL STILL RUN EVERYWHERE? THAT\'S SO MUCH RUNNING.', 'COME DOWN AND SIT A WHILE. LIKE A CAT. I\'LL SHOW YOU.'] },
  airline: { from: 'THE AIRLINE', who: 'phone', when: s => s.day >= 6 && done('cat'), opens: 'paris',
    lines: ['BONJOUR. THIS IS THE AIRLINE.', 'YOUR SEVENTEEN TICKETS TO PARIS ARE CONFIRMED.', '...WHO BOOKED THESE? THE NAME SAYS "THE GINGER ONE."'] },
  boulder: { from: 'THE BOULDER BUNNIES', who: 'bb1', when: s => s.day >= 7 && (done('paris') || done('sundown')), opens: 'boulder',
    lines: ['HEY CUZ. BOULDER HERE. ALL THREE OF US.', 'IT SNOWED ON SANITAS LAST NIGHT. SNOW. AT THE TOP.', 'COME CLIMB. BRING THE ONE IN THE ORANGE BEANIE. HE KEEPS ASKING ABOUT SNOW.'] },
  snails: { from: 'LES ESCARGOTS DISCO', who: 'snail', when: s => done('speaker'),
    lines: ['ALLO. IT IS LES ESCARGOTS.', 'WE HEAR YOU HAVE OUR SPEAKER. WE HEAR IT IS ON A ROOF.', 'WE WILL PLAY YOUR COOKOUTS. WE ARE VERY EXPENSIVE. FOR YOU, FREE.'] },
  elli: { from: 'MISS ELLI', who: 'elli', when: s => done('peach') && s.day >= 4,
    lines: ['WELL HEY, Y\'ALL! IT\'S ELLI.', 'DEXTER WANTED ME TO CALL. HE SAYS SEVEN IS FEELING OVERLOOKED.', 'COME UP AND LOOK AT HIM SOMETIME. HE\'D LIKE THAT.'] }
};

/* ---------- save ---------- */
function SG_SAVE() { return SAVE.saga; }
function famRole(i) { const f = FAM[i]; return f.role || (SAVE.saga && SAVE.saga.fam[i] && SAVE.saga.fam[i].role) || null; }
function famName(i) { return famRole(i) || FAM[i].tag; }
function famShort(i) { const r = famRole(i); return r ? r.replace(/^THE /, '') : FAM[i].color + ' COUSIN'; }
function quirkKnown(i) { return i < 2 || (SAVE.saga && SAVE.saga.fam[i] && SAVE.saga.fam[i].qk); }
function newSaga() {
  return { v: 1, day: 1, sun: 3, bank: 0, started: false, fam: FAM.map(() => ({ role: null, qk: false, away: null })), wants: {}, open: ['creek'], daily: {}, dn: 0,
    stash: { r_buns: 1 }, pantry: { juice: 2 }, guests: {}, places: { forest: 1 }, errands: [], calls: {}, call: null, log: { stuck: 0, drift: 0, runs: 0, stars: 0, vibes: 0, best: 0, days: 0 },
    today: { stars: 0, place: 'forest', news: [] }, reports: [], finale: false, seen: {} };
}
function fixSaga() {
  if (!SAVE.saga || typeof SAVE.saga !== 'object') {
    SAVE.saga = newSaga();
    // returning players: their golden carrots turn into a head start, and their drip comes with them
    const nG = Object.values(SAVE.days || {}).reduce((n, d) => n + ((d && d.gold) || []).filter(Boolean).length, 0);
    if (nG) SAVE.saga.bank += nG * 20, SAVE.saga.welcome = nG * 20;
    if (SAVE.drip === 'rope') SAVE.saga.stash.rope = 1; else if (SAVE.drip === 'ice') SAVE.saga.stash.iced = 1; else if (SAVE.drip === 'carrot') SAVE.saga.stash.pendant = 1;
  }
  const s = SAVE.saga, d = newSaga();
  for (const k in d) if (s[k] == null) s[k] = d[k];
  for (let i = 0; i < FAM.length; i++) if (!s.fam[i]) s.fam[i] = { role: null, qk: false, away: null };
  for (const k in d.log) if (s.log[k] == null) s.log[k] = d.log[k];
  s.open = s.open.filter(id => WANTS[id] || s.daily[id]);
}
function bankAdd(n) { const s = SAVE.saga; s.bank = Math.max(0, s.bank + Math.round(n)); }
function has(k) { return !!(SAVE.saga && SAVE.saga.stash[k]); }
function giveStash(k) { const s = SAVE.saga; if (!STASH[k]) return false; const first = !s.stash[k]; s.stash[k] = 1; return first; }
function giveFood(k, n) { const s = SAVE.saga; if (!FOOD[k]) return; s.pantry[k] = (s.pantry[k] || 0) + n; }
function unownedRecord() { const r = Object.keys(STASH).filter(k => STASH[k].cat === 'records' && !SAVE.saga.stash[k]); return r.length ? r[(Math.random() * r.length) | 0] : null; }
function sunsPerDay() { return 3 + (has('hammock') ? 1 : 0); }
