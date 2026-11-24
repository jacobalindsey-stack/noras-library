// Life with Cats — the shop catalogue.
// slot: where it goes in a room ('s' small floor spot, 'l' large floor spot,
// 'window' a window perch, 'outside' outside a window, 'wall', 'bowls', 'litter').
// upgrade: a house-wide improvement instead of a thing you place.

export const SHOP_TABS = [
  { id: 'food', name: 'Food & treats' },
  { id: 'toys', name: 'Toys' },
  { id: 'furniture', name: 'Cat furniture' },
  { id: 'care', name: 'Care & gadgets' },
  { id: 'rooms', name: 'Rooms' },
];
export const ITEMS = {
  kibble: { tab: 'food', name: 'Crunchy kibble', desc: '12 servings of the basics.', price: 12, give: { kibble: 12 }, icon: 'kibble' },
  wet: { tab: 'food', name: 'Tuna pâté tins', desc: '6 servings. Cats come running at the sound of the tin.', price: 20, give: { wet: 6 }, icon: 'tin' },
  fancy: { tab: 'food', name: 'Salmon supper', desc: '5 servings of the good stuff. Divas insist on it.', price: 32, give: { fancy: 5 }, level: 3, icon: 'fish' },
  treats: { tab: 'food', name: 'Cat Bakery bites', desc: '10 treats, baked across the lane. Big purrs, but too many and kitty gets chubby.', price: 14, give: { treats: 10 }, icon: 'treat' },
  catnip: { tab: 'food', name: 'Catnip', desc: '3 pinches. A burst of fun and silliness.', price: 16, give: { catnip: 3 }, level: 2, icon: 'leaf' },

  ball: { tab: 'toys', name: 'Jingle ball', desc: 'Batted around when nobody is looking. A little fun on its own.', price: 8, slot: 's', build: 'toyBall', fun: 1, cozy: 1, icon: 'ball' },
  mouse: { tab: 'toys', name: 'Felt mouse', desc: 'Stuffed with catnip. A little fun on its own.', price: 12, slot: 's', build: 'toyMouse', fun: 1, cozy: 1, icon: 'mouse' },
  box: { tab: 'toys', name: 'Cardboard box', desc: 'The best toy ever invented. If I fits, I sits.', price: 5, slot: 's', build: 'box', fun: 1, nap: true, cozy: 1, icon: 'box' },
  bag: { tab: 'toys', name: 'Paper bag', desc: 'Crinkly hiding spot.', price: 4, slot: 's', build: 'paperBag', fun: 1, cozy: 1, icon: 'bag' },
  basket: { tab: 'toys', name: 'Toy basket', desc: 'A whole basket of toys. Lots of fun on its own.', price: 30, slot: 's', build: 'toyBasket', fun: 2, cozy: 2, level: 2, icon: 'basket' },
  tunnel: { tab: 'toys', name: 'Crinkle tunnel', desc: 'Zoom through, hide, ambush.', price: 45, slot: 'l', build: 'tunnel', fun: 2, cozy: 2, level: 2, icon: 'tunnel' },
  laser: { tab: 'toys', name: 'Laser pointer', desc: 'Play with the red dot instead of the wand. Twice the zoomies.', price: 45, upgrade: true, level: 3, icon: 'laser' },
  feeder: { tab: 'toys', name: 'Bird feeder', desc: 'Hangs outside a window. Cat TV, all day.', price: 70, slot: 'outside', build: 'birdFeeder', fun: 2, cozy: 2, level: 4, icon: 'bird' },
  tank: { tab: 'toys', name: 'Fish tank', desc: 'Cat TV, deluxe. Lots of fun on its own.', price: 260, slot: 'l', build: 'fishTank', fun: 3, cozy: 4, level: 6, icon: 'fishtank' },

  post: { tab: 'furniture', name: 'Scratching post', desc: 'Saves your sofa. Cats in this room scratch here instead (mostly).', price: 35, slot: 's', build: 'scratchPost', post: true, cozy: 2, icon: 'post' },
  pad: { tab: 'furniture', name: 'Cardboard scratcher', desc: 'A cheap scratch pad. Works, but less well than a post.', price: 16, slot: 's', build: 'scratchPad', post: true, cozy: 1, icon: 'pad' },
  bed: { tab: 'furniture', name: 'Knitted cat bed', desc: 'A cosy donut for naps.', price: 40, slot: 's', build: 'catBed', nap: true, cozy: 3, icon: 'bed' },
  perch: { tab: 'furniture', name: 'Window perch', desc: 'A sunny shelf by the window. Naps and bird watching.', price: 55, slot: 'window', build: 'windowPerch', nap: true, cozy: 3, level: 2, icon: 'perch' },
  tree: { tab: 'furniture', name: 'Cat tree', desc: 'Climbing, scratching, napping up high. Fun on its own.', price: 140, slot: 'l', build: 'catTree', post: true, nap: true, fun: 2, cozy: 4, level: 3, icon: 'tree' },
  heatbed: { tab: 'furniture', name: 'Heated bed', desc: 'The warmest nap in the house.', price: 110, slot: 's', build: 'catBed', opts: { heated: true, color: '#c99a3e' }, nap: true, cozy: 4, level: 5, icon: 'bed' },
  shelves: { tab: 'furniture', name: 'Climbing shelves', desc: 'A staircase up the wall. Explorers adore it.', price: 220, slot: 'wall', build: 'wallShelves', fun: 2, nap: true, cozy: 4, level: 8, icon: 'shelves' },
  bigtree: { tab: 'furniture', name: 'Grand cat tower', desc: 'Four storeys and a hammock. Scratching, naps, fun.', price: 360, slot: 'l', build: 'catTree', opts: { big: true, color: '#d8c6a0', color2: '#b8613f' }, post: true, nap: true, fun: 3, cozy: 6, level: 7, icon: 'tree' },

  bowls: { tab: 'care', name: 'Extra food bowls', desc: 'Another feeding spot, for a bigger family.', price: 25, slot: 'bowls', build: 'feedingStation', icon: 'bowl' },
  litter: { tab: 'care', name: 'Extra litter box', desc: 'One box for every two cats keeps everyone polite.', price: 30, slot: 'litter', build: 'litterBox', icon: 'litter' },
  grass: { tab: 'care', name: 'Cat grass', desc: 'Cats in this room nibble this instead of your plants.', price: 20, slot: 's', build: 'catGrass', grass: true, cozy: 1, level: 2, icon: 'grass' },
  glove: { tab: 'care', name: 'Grooming glove', desc: 'Brushing works faster and cats like it more.', price: 25, upgrade: true, level: 2, icon: 'brush' },
  fountain: { tab: 'care', name: 'Water fountain', desc: 'Fresh running water: bowls never run dry, and cats drink more happily.', price: 90, upgrade: true, level: 3, icon: 'fountain' },
  autofeeder: { tab: 'care', name: 'Automatic feeder', desc: 'Tops up every bowl at breakfast, lunch and dinner from your pantry.', price: 240, upgrade: true, level: 5, icon: 'feeder' },
  vacuum: { tab: 'care', name: 'Robot vacuum', desc: 'Tidies fur, hairballs, crumbs and kibble on its own. Cats ride it.', price: 320, upgrade: true, level: 6, icon: 'vacuum' },
  robolitter: { tab: 'care', name: 'Self-cleaning litter', desc: 'Every litter box scoops itself.', price: 380, upgrade: true, level: 7, icon: 'litter' },
};
export const START_ITEMS = [{ kind: 'bowls', room: 0 }, { kind: 'litter', room: 0 }, { kind: 'box', room: 0 }];
