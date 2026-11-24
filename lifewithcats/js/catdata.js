// Life with Cats — who the cats are: coats, breeds, personalities, names,
// where they come from, and the internet-famous things they do.
import { rng, pick, weighted, hashStr } from './util.js';

export const COATS = {
  orange: { name: 'Orange tabby', base: '#d9853b', stripe: '#a5521c', pattern: 'tabby', white: 0.12, eyes: ['#d9a441', '#b9c24a'] },
  brown: { name: 'Brown tabby', base: '#9a7650', stripe: '#3e2b1d', pattern: 'tabby', white: 0.05, eyes: ['#b9c24a', '#d9a441'] },
  silver: { name: 'Silver tabby', base: '#bfc1bc', stripe: '#3f4242', pattern: 'tabby', white: 0.05, eyes: ['#9cc26a', '#d9a441'] },
  grey: { name: 'Grey', base: '#868b91', pattern: 'solid', eyes: ['#d9a441', '#9cc26a'] },
  black: { name: 'Black (a void)', base: '#2a2627', pattern: 'solid', eyes: ['#e0b13a', '#c9c43e'] },
  white: { name: 'White', base: '#eeeae1', pattern: 'solid', eyes: ['#7fb2d8', '#d9a441'] },
  cream: { name: 'Cream', base: '#e7d0a6', stripe: '#caa676', pattern: 'tabby', faint: true, eyes: ['#d9a441'] },
  tuxedo: { name: 'Tuxedo', base: '#2a2627', pattern: 'tux', white: 0.5, eyes: ['#c9c43e', '#9cc26a'] },
  greywhite: { name: 'Grey and white', base: '#848a90', pattern: 'tux', white: 0.6, eyes: ['#d9a441', '#9cc26a'] },
  orangewhite: { name: 'Ginger and white', base: '#d9853b', stripe: '#a5521c', pattern: 'tux', tabby: true, white: 0.55, eyes: ['#d9a441'] },
  calico: { name: 'Calico', base: '#efe8da', patches: ['#d9853b', '#2a2627'], pattern: 'calico', eyes: ['#d9a441', '#9cc26a'] },
  tortie: { name: 'Tortoiseshell', base: '#3a2a22', patches: ['#c46a2a', '#8a4e24', '#2a2020'], pattern: 'tortie', eyes: ['#d9a441'] },
  seal: { name: 'Seal point', base: '#ece2cc', point: '#4a3426', pattern: 'point', eyes: ['#6fa8d8'] },
  bluepoint: { name: 'Blue point', base: '#e9e6df', point: '#79808a', pattern: 'point', eyes: ['#7fb2e0'] },
  mitted: { name: 'Seal mitted', base: '#efe6d4', point: '#6a5040', pattern: 'point', mitts: true, eyes: ['#6fa8d8'] },
  spotted: { name: 'Leopard spotted', base: '#d4a35a', stripe: '#3a2618', pattern: 'spotted', eyes: ['#b9c24a', '#d9a441'] },
  russian: { name: 'Blue', base: '#7c8590', pattern: 'solid', eyes: ['#7fc26a'] },
  ruddy: { name: 'Ruddy ticked', base: '#b8743a', stripe: '#6a3a1a', pattern: 'ticked', eyes: ['#c9a83a', '#9cc26a'] },
  pink: { name: 'Pink and wrinkly', base: '#e3b2a0', pattern: 'skin', eyes: ['#9cc26a', '#7fb2d8'] },
  van: { name: 'Van', base: '#efe8da', patches: ['#d9853b'], pattern: 'van', eyes: ['#d9a441', '#7fb2d8'] },
  smoke: { name: 'Smoke', base: '#4a4648', stripe: '#9a9696', pattern: 'smoke', eyes: ['#d9a441'] },
};
export const COMMON_COATS = ['orange', 'brown', 'silver', 'grey', 'black', 'white', 'tuxedo', 'greywhite', 'orangewhite', 'calico', 'tortie', 'cream'];

export const BREEDS = {
  domestic: { name: 'Domestic shorthair', coats: COMMON_COATS, fluff: 0, size: 1, legs: 1, ears: 1 },
  longhair: { name: 'Domestic longhair', coats: COMMON_COATS, fluff: 0.7, size: 1.02, legs: 1, ears: 0.95 },
  siamese: { name: 'Siamese', coats: ['seal', 'bluepoint'], fluff: 0, size: 0.96, legs: 1.08, ears: 1.3, slim: 0.85, price: 700, chatty: true },
  persian: { name: 'Persian', coats: ['white', 'cream', 'grey', 'smoke', 'calico'], fluff: 1.0, size: 1.0, legs: 0.82, ears: 0.7, flat: true, price: 900 },
  mainecoon: { name: 'Maine Coon', coats: ['brown', 'silver', 'orange', 'black'], fluff: 0.8, size: 1.28, legs: 1.06, ears: 1.2, tufts: true, price: 1100 },
  ragdoll: { name: 'Ragdoll', coats: ['mitted', 'seal', 'bluepoint'], fluff: 0.65, size: 1.16, legs: 1, ears: 0.95, price: 950, floppy: true },
  bengal: { name: 'Bengal', coats: ['spotted'], fluff: 0, size: 1.05, legs: 1.06, ears: 1.0, slim: 0.92, price: 1200 },
  sphynx: { name: 'Sphynx', coats: ['pink'], fluff: -1, size: 0.95, legs: 1.05, ears: 1.55, slim: 0.9, price: 1300 },
  fold: { name: 'Scottish Fold', coats: ['grey', 'silver', 'cream', 'brown'], fluff: 0.15, size: 1.0, legs: 0.95, ears: 0.8, fold: true, round: 1.12, price: 1000 },
  munchkin: { name: 'Munchkin', coats: ['orange', 'calico', 'tuxedo', 'cream', 'grey'], fluff: 0.1, size: 0.95, legs: 0.5, ears: 1, price: 800 },
  british: { name: 'British Shorthair', coats: ['russian', 'cream', 'silver'], fluff: 0.3, size: 1.1, legs: 0.92, ears: 0.85, round: 1.18, price: 850 },
  russian: { name: 'Russian Blue', coats: ['russian'], fluff: 0.1, size: 1.0, legs: 1.06, ears: 1.15, slim: 0.9, price: 750 },
  abyssinian: { name: 'Abyssinian', coats: ['ruddy'], fluff: 0, size: 0.98, legs: 1.08, ears: 1.35, slim: 0.86, price: 900 },
  turkishvan: { name: 'Turkish Van', coats: ['van'], fluff: 0.45, size: 1.08, legs: 1.02, ears: 1.0, price: 800 },
};
export const BREEDER_LIST = ['siamese', 'russian', 'munchkin', 'british', 'turkishvan', 'abyssinian', 'persian', 'ragdoll', 'fold', 'mainecoon', 'bengal', 'sphynx'];

// how fast each need drains (x1 is normal), how much petting they put up
// with, how naughty they get when ignored, and which naughty things they like
export const PERS = {
  cuddly: { name: 'Cuddlebug', blurb: 'Lives for laps. Will sit on your laptop if ignored.', decay: { love: 1.45 }, tol: 1.8, mischief: 0.8, fav: 'pet', kinds: { laptop: 4, knock: 1, scratch: 1, yowl: 1 } },
  chaos: { name: 'Chaos Gremlin', blurb: 'One brain cell, all of it on fire. Needs lots of play.', decay: { fun: 1.55 }, tol: 0.85, mischief: 1.7, fav: 'play', kinds: { knock: 3, zoomies: 3, curtain: 2, scratch: 1.5, plant: 1.2, trash: 1 } },
  foodie: { name: 'Snack Bandit', blurb: 'Thinks every crinkle is a treat. Gets chubby easily.', decay: { food: 1.4 }, tol: 1.2, mischief: 1.1, fav: 'treat', gain: 1.6, kinds: { counter: 4, sack: 3, trash: 2, knock: 1 } },
  diva: { name: 'Royal Diva', blurb: 'Prefers fancy food and a spotless litter box. Loves brushing.', decay: { tidy: 1.4 }, tol: 0.75, mischief: 1.0, fav: 'brush', picky: true, kinds: { knock: 2.5, scratch: 1.5, accident: 2, yowl: 1 } },
  scaredy: { name: 'Scaredy Cat', blurb: 'Hides from new things. Once they trust you, they adore you.', decay: { love: 0.9 }, tol: 1.0, mischief: 0.6, fav: 'pet', shy: true, kinds: { scratch: 1, hairball: 2, accident: 1 } },
  sleepy: { name: 'Sleepyhead', blurb: 'Professional napper. Finds every sunbeam.', decay: { fun: 0.7, energy: 1.4 }, tol: 1.3, mischief: 0.5, fav: 'nap', kinds: { scratch: 2, laptop: 1 } },
  chatty: { name: 'Chatterbox', blurb: 'Has a lot to say. Mostly at 4am.', decay: { love: 1.2 }, tol: 1.1, mischief: 1.1, fav: 'pet', chatty: true, kinds: { yowl: 4, laptop: 2, knock: 1 } },
  explorer: { name: 'Explorer', blurb: 'Must climb everything, then push it off.', decay: { fun: 1.25 }, tol: 1.0, mischief: 1.3, fav: 'play', climber: true, kinds: { curtain: 3, shelf: 3, knock: 2, plant: 1 } },
  gentle: { name: 'Gentle Giant', blurb: 'Calm, patient, friends with everyone.', decay: { fun: 0.85, love: 0.9 }, tol: 1.6, mischief: 0.5, fav: 'brush', kinds: { scratch: 2, sack: 1 } },
  grump: { name: 'Grump', blurb: 'Judges you. Secretly loves you. Will accept treats.', decay: { love: 0.65 }, tol: 0.5, mischief: 1.0, fav: 'treat', kinds: { knock: 3, scratch: 2, yowl: 1 } },
  hunter: { name: 'Mighty Hunter', blurb: 'Brings you presents. Lives for the feather wand.', decay: { fun: 1.3 }, tol: 1.0, mischief: 1.1, fav: 'play', gifts: 2.2, kinds: { plant: 2.5, knock: 1.5, curtain: 1 } },
};
export const PERS_LIST = Object.keys(PERS);

export const NAMES = ['Biscuit', 'Mochi', 'Pickles', 'Noodle', 'Waffles', 'Pumpkin', 'Ziggy', 'Luna', 'Milo', 'Cleo', 'Mittens', 'Socks', 'Beans', 'Tofu', 'Nugget', 'Pepper', 'Ginger', 'Dumpling', 'Sprout', 'Toast', 'Butterscotch', 'Hazel', 'Fig', 'Pudding', 'Muffin', 'Bagel', 'Crumpet', 'Turnip', 'Wasabi', 'Sushi', 'Bao', 'Meatball', 'Gizmo', 'Ghost', 'Smokey', 'Patches', 'Tiger', 'Ollie', 'Pancake', 'Kiwi', 'Lemon', 'Peaches', 'Puffin', 'Pebble', 'Oreo', 'Marshmallow', 'Chickpea', 'Sardine', 'Bramblewick', 'Tater Tot', 'Professor Whiskers', 'Captain Floof', 'Mr. Biscuits', 'Princess Beans', 'Chairman Meow', 'Purrito', 'Catsby', 'Sir Pounce', 'Lady Fluffington', 'Tuna', 'Clover', 'Juniper Jr.', 'Rocket', 'Button', 'Doodle', 'Sprinkles', 'Cinnamon', 'Nutmeg', 'Paprika', 'Saffron', 'Mango', 'Plum', 'Olive Jr.', 'Fennel', 'Basil Jr.', 'Shortbread', 'Scone', 'Pretzel', 'Bon Bon', 'Truffle', 'Macaroni', 'Gnocchi', 'Ravioli', 'Tortellini', 'Wonton', 'Pierogi', 'Dango', 'Onigiri', 'Kimchi', 'Miso', 'Yuzu', 'Taro', 'Boba', 'Nimbus', 'Comet', 'Pixel', 'Widget', 'Sprocket', 'Thimble', 'Teacup', 'Velvet', 'Moonpie', 'Snickerdoodle'];
const FANCY = ['Lord Wellington III', 'Contessa Velvetpaw', 'Sir Reginald Fluffbottom', 'Duchess Marmaduke', 'Baron von Whiskers', 'Lady Pemberly Purr', 'Count Cuddlesworth', 'Madame Soufflé', 'Prince Archibald', 'Dame Clementina', 'Admiral Snugglepuss', 'Viscount Biscuit', 'Her Grace, Mochi', 'Sir Toby Tuxford', 'Marquis de Meow'];

export const SOURCES = {
  cds: { name: 'The Cat Distribution System', short: 'Fate', blurb: 'Nobody adopts a cat this way. The cat adopts you. Free, but you get who shows up.' },
  shelter: { name: 'Nine Lives Rescue', short: 'Shelter', blurb: 'Lovely cats waiting for a home. A small fee covers their check-up.' },
  cafe: { name: 'Clementine’s Cat Café', short: 'Cat café', blurb: 'Next door to the Cat Bakery. Friendly, people-loving cats, raised on cuddles.' },
  breeder: { name: 'Featherstone Pedigrees', short: 'Breeder', blurb: 'Duchess Featherstone’s very fancy cattery. Pick a breed. Pay a fortune.' },
};

// the meme album: each one is a photo you can catch
export const MEMES = [
  { id: 'loaf', name: 'Cat Loaf', hint: 'A cat tucked into a perfect bread shape.', likes: 1.0 },
  { id: 'fits', name: 'If I Fits, I Sits', hint: 'A cat in a box or a bag.', likes: 1.3 },
  { id: 'blep', name: 'Blep', hint: 'A tiny tongue, left out by accident.', likes: 1.5 },
  { id: 'biscuits', name: 'Making Biscuits', hint: 'Kneading a soft blanket or bed.', likes: 1.2 },
  { id: 'sploot', name: 'The Sploot', hint: 'Flat on the floor, back legs out like a frog.', likes: 1.3 },
  { id: 'trap', name: 'It’s a Trap', hint: 'Belly up. Do NOT touch the belly.', likes: 1.4 },
  { id: 'zoomies', name: 'The Zoomies', hint: 'Full speed, for no reason at all.', likes: 1.5 },
  { id: 'judge', name: 'Judging You', hint: 'A long, unblinking, disappointed stare.', likes: 1.2 },
  { id: 'blink', name: 'Slow Blink', hint: 'The cat way of saying I love you.', likes: 1.4 },
  { id: 'keyboard', name: 'Working From Home', hint: 'A cat sitting on the laptop.', likes: 1.5 },
  { id: 'regret', name: 'I Regret Nothing', hint: 'Caught mid-push, paw on the glass.', likes: 1.8 },
  { id: 'chonk', name: 'Absolute Unit', hint: 'A very round cat. Oh lawd.', likes: 1.6 },
  { id: 'sunbeam', name: 'Solar Powered', hint: 'Asleep in a patch of sunlight.', likes: 1.2 },
  { id: 'pile', name: 'Cat Pile', hint: 'Two or more cats napping together.', likes: 2.0 },
  { id: 'tv', name: 'Cat TV', hint: 'Watching birds or fish, very seriously.', likes: 1.2 },
  { id: 'floof', name: 'Second Cat Made of Fur', hint: 'Brushing a fluffy cat, fur everywhere.', likes: 1.6 },
  { id: 'gift', name: 'A Gift For You', hint: 'A cat proudly bringing you a present.', likes: 1.5 },
  { id: 'cucumber', name: 'CUCUMBER!', hint: 'Spooked into a Halloween arch.', likes: 2.2 },
  { id: 'void', name: 'The Void Stares Back', hint: 'A black cat, at night.', likes: 1.6 },
  { id: 'brain', name: 'One Brain Cell', hint: 'An orange cat doing something chaotic.', likes: 1.7 },
  { id: 'loafpile', name: 'Bakery Display', hint: 'Two loaves side by side.', likes: 2.4 },
  { id: 'perch', name: 'Supervisor', hint: 'Watching everything from up high.', likes: 1.2 },
  { id: 'laundry', name: 'Warm Laundry', hint: 'Napping in the clean washing.', likes: 1.4 },
  { id: 'meow', name: 'Loud Opinions', hint: 'Mid-meow, mouth wide open.', likes: 1.1 },
  { id: 'groom', name: 'Spa Day', hint: 'Washing behind the ears.', likes: 1.0 },
  { id: 'kitten', name: 'Tiny Beans', hint: 'A kitten doing anything at all.', likes: 1.6 },
  { id: 'hide', name: 'Can’t See Me', hint: 'Half-hidden in a tunnel or tent.', likes: 1.3 },
  { id: 'ride', name: 'Roomba Rider', hint: 'Riding the robot vacuum.', likes: 2.2 },
];
export const MEME = Object.fromEntries(MEMES.map(m => [m.id, m]));

let uid = Date.now() % 100000;
export function makeCat(o = {}) {
  const seed = o.seed ?? (Math.random() * 1e9) >>> 0;
  const r = rng(seed);
  const breed = o.breed || (r() < 0.22 ? 'longhair' : 'domestic');
  const B = BREEDS[breed];
  const coat = o.coat || pick(B.coats, r);
  let pers = o.pers;
  if (!pers) {
    const w = o.persWeights || {};
    pers = weighted(PERS_LIST, k => w[k] ?? 1, r);
  }
  const age = o.age || (r() < 0.25 ? 'kitten' : r() < 0.85 ? 'adult' : 'senior');
  const C = COATS[coat];
  const name = o.name || (o.fancy ? pick(FANCY, r) : pick(NAMES, r));
  return {
    id: o.id || ('c' + seed.toString(36)),
    name, breed, coat, pers, age,
    ageDays: age === 'kitten' ? 0 : age === 'adult' ? 6 : 30,
    eye: o.eye || pick(C.eyes, r),
    seed,
    needs: { food: 70 + r() * 20, fun: 60 + r() * 30, love: 50 + r() * 30, tidy: o.scruffy ? 35 : 70 + r() * 20, energy: 70 + r() * 25 },
    weight: o.weight ?? (breed === 'british' ? 52 : 32 + r() * 16),
    health: 100, claws: 30 + r() * 30, bond: 0, source: o.source || 'cds',
    memes: {}, stats: { pets: 0, plays: 0, treats: 0, brushes: 0, catches: 0, gifts: 0, mischief: 0 },
    treatsToday: 0, adoptedDay: 0, fame: 0, price: o.price || 0,
    bladder: r() * 50,
  };
}
// what a source has on offer today
export function offers(source, day, level, r = rng(hashStr(source + day))) {
  const out = [];
  if (source === 'shelter') {
    for (let k = 0; k < 3; k++) {
      const age = r() < 0.3 ? 'senior' : r() < 0.55 ? 'adult' : 'kitten';
      const c = makeCat({ seed: Math.floor(r() * 1e9), age, source: 'shelter' });
      c.price = age === 'senior' ? 25 : age === 'adult' ? 45 : 65;
      out.push(c);
    }
  } else if (source === 'cafe') {
    for (let k = 0; k < 3; k++) {
      const c = makeCat({ seed: Math.floor(r() * 1e9), source: 'cafe', persWeights: { cuddly: 4, gentle: 3, chatty: 2, sleepy: 2, chaos: 0.3, grump: 0.2, scaredy: 0.3 }, coat: pick(['calico', 'tortie', 'cream', 'greywhite', 'orangewhite', 'white', 'silver'], r), breed: r() < 0.4 ? 'longhair' : 'domestic' });
      c.price = 140 + Math.floor(r() * 5) * 20;
      out.push(c);
    }
  } else if (source === 'breeder') {
    for (const b of BREEDER_LIST) {
      const c = makeCat({ seed: Math.floor(r() * 1e9), breed: b, source: 'breeder', fancy: true, age: r() < 0.6 ? 'kitten' : 'adult', persWeights: { diva: 4, gentle: 2, sleepy: 2, cuddly: 1.5, chaos: 0.5, grump: 1.5 } });
      c.price = BREEDS[b].price;
      out.push(c);
    }
  }
  return out;
}
// the Cat Distribution System delivers a scruffy little someone
export function stray(day, r = Math.random) {
  return makeCat({ seed: Math.floor(r() * 1e9), source: 'cds', scruffy: r() < 0.6, age: r() < 0.35 ? 'kitten' : r() < 0.9 ? 'adult' : 'senior', breed: r() < 0.15 ? 'longhair' : 'domestic' });
}
export function catTitle(c) { const B = BREEDS[c.breed], C = COATS[c.coat]; return (c.breed === 'domestic' || c.breed === 'longhair') ? `${C.name} ${c.breed === 'longhair' ? 'longhair' : 'cat'}` : `${C.name} ${B.name}`; }
export function ageLabel(c) { return c.age === 'kitten' ? 'Kitten' : c.age === 'senior' ? 'Senior' : 'Adult'; }
