/* ============================================================
   game-data.jsx — DATA-DRIVEN CONTENT for The Cat Bakery
   Everything here is config. Adding recipes/levels/customers
   later is a data edit, not a code change.
   ============================================================ */

/* ---- Ingredients ---- */
const INGREDIENTS = {
  flour:    { id:'flour',    name:'Flour',          price:2,  rare:false },
  sugar:    { id:'sugar',    name:'Sugar',          price:3,  rare:false },
  butter:   { id:'butter',   name:'Butter',         price:4,  rare:false },
  milk:     { id:'milk',     name:'Milk',           price:3,  rare:false },
  egg:      { id:'egg',      name:'Eggs',           price:3,  rare:false },
  cinnamon: { id:'cinnamon', name:'Golden Cinnamon',price:25, rare:true, unlockLevel:5 },
  frosting: { id:'frosting', name:'Royal Frosting', price:12, rare:true, unlockLevel:4 },
  jam:      { id:'jam',      name:'Berry Jam',      price:8,  rare:true, unlockLevel:2 },
};
const COMMON_ING = ['flour','sugar','butter','milk','egg'];

/* ---- Recipes (cat-pastries) ---- */
const RECIPES = {
  breadsheen: {
    id:'breadsheen', name:'Breadsheen', art:'bread', tier:0,
    cost:{ flour:1 }, sells:5, rep:1, blurb:'A sleepy bread-bun cat. Humble, warm, always there for you.',
    unlock:{ start:true }, quickBake:true,
  },
  croissantsheen: {
    id:'croissantsheen', name:'Croissantsheen', art:'croissant', tier:1,
    cost:{ flour:2, butter:1 }, sells:14, rep:2, blurb:'Buttery, flaky, and perpetually mid-stretch.',
    unlock:{ start:true }, jamOk:true,
  },
  muffinsheen: {
    id:'muffinsheen', name:'Muffinsheen', art:'muffin', tier:1,
    cost:{ flour:2, sugar:1, egg:1 }, sells:16, rep:3, blurb:'A muffin-top kitty with a perky paper collar.',
    unlock:{ level:2 }, jamOk:true,
  },
  macaronsheen: {
    id:'macaronsheen', name:'Macaronsheen', art:'macaron', tier:2,
    cost:{ flour:1, sugar:2, egg:1 }, sells:22, rep:4, blurb:'Delicate, fancy, and just a little smug about it.',
    unlock:{ level:3, tool:'pipingBag' }, jamOk:true,
  },
  cakesheen: {
    id:'cakesheen', name:'Cakesheen', art:'cake', tier:3,
    cost:{ flour:3, sugar:2, egg:2, butter:1, milk:1 }, sells:45, rep:6, blurb:'A grand layer-cake cat for grand occasions.',
    unlock:{ level:4, tool:'cakePan' }, jamOk:true,
  },
  cinnamonroll: {
    id:'cinnamonroll', name:'Cinnamon Roll Cat', art:'cinnamon', tier:4,
    cost:{ flour:3, sugar:2, butter:2, milk:1, cinnamon:1 }, sells:100, rep:0, blurb:'The legendary swirl. Warm as a sunbeam. The one you have been baking toward all along.',
    unlock:{ level:5, tool:'proofingOven', ingredient:'cinnamon' }, finale:true,
  },
};
const RECIPE_ORDER = ['breadsheen','croissantsheen','muffinsheen','macaronsheen','cakesheen','cinnamonroll'];

/* ---- Tools ---- */
const TOOLS = {
  mixingBowl:   { id:'mixingBowl',   name:'Mixing Bowl',           price:0,   level:1, desc:'Where every bake begins.', owned:true },
  displayCase:  { id:'displayCase',  name:'Display Case Expansion',price:40,  level:2, desc:'+2 sales-case slots.', slots:2 },
  pipingBag:    { id:'pipingBag',    name:'Piping Bag',            price:30,  level:3, desc:'Unlocks Macaronsheen.', enables:'macaronsheen' },
  brickOven:    { id:'brickOven',    name:'Brick Oven',            price:80,  level:3, desc:'Faster bakes, +15% success.' },
  cakePan:      { id:'cakePan',      name:'Cake Pan',              price:60,  level:4, desc:'Unlocks Cakesheen.', enables:'cakesheen' },
  proofingOven: { id:'proofingOven', name:'Proofing Oven',         price:150, level:5, desc:'Best bake quality. Needed for the finale.' },
};
const TOOL_ORDER = ['displayCase','pipingBag','brickOven','cakePan','proofingOven'];

/* ---- Progression: cumulative rep thresholds to reach each level ---- */
const LEVEL_THRESHOLDS = [0, 0, 50, 120, 250, 450]; // index = level (1..5)
const MAX_LEVEL = 5;

/* ---- Venues / premises (the bakery upgrades its space as you grow) ----
   Each venue carries a visual `theme` used to reskin the home-base.       */
const VENUES = [
  { n:1, id:'garage', name:'Alley Garage', type:'A humble start',
    tagline:'A fold-out table, a borrowed oven, and a big dream.',
    unlocks:'Breadsheen + Croissantsheen', goal:'Reach 50 rep',
    theme:{ wall:'#aeb2b7', wall2:'#9ba0a6', floor:'#7e8388',
            counter:'#8b8f95', counterLt:'#bcc0c5', counterDk:'#646a6f', counterBd:'#3a3d42',
            signBg:'#caa06a', signFg:'#3c2614', signBd:'#5a3a1c',
            accent:'#c14b56', light:'bulb', props:'garage' } },
  { n:2, id:'truck', name:'Food Truck', type:'On the move',
    tagline:'A shiny truck, a serving hatch, and a queue forming outside.',
    unlocks:'Muffinsheen · Display Case · Pip\u2019s Birthday', goal:'Reach 120 rep',
    theme:{ wall:'#4f8f8c', wall2:'#447a78', floor:'#cfcabb',
            counter:'#d6d2c6', counterLt:'#efece2', counterDk:'#b0ac9f', counterBd:'#3c2614',
            signBg:'#f2c14e', signFg:'#3c2614', signBd:'#3c2614',
            accent:'#c14b56', light:'string', props:'truck' } },
  { n:3, id:'corner', name:'Corner Bakery', type:'Your first storefront',
    tagline:'A striped awning, a real window, and your name on the glass.',
    unlocks:'Piping Bag + Brick Oven \u2192 Macaronsheen', goal:'Reach 250 rep',
    theme:{ wall:'#efd9b3', wall2:'#e6c896', floor:'#caa06a',
            counter:'#a9783f', counterLt:'#caa06a', counterDk:'#7c5325', counterBd:'#3c2614',
            signBg:'#6fbf9a', signFg:'#16352a', signBd:'#2f5e49',
            accent:'#c14b56', light:'pendant', props:'corner' } },
  { n:4, id:'neighborhood', name:'Neighborhood Bakeshop', type:'A local favourite',
    tagline:'Wood panelling, hanging plants, regulars who know your name.',
    unlocks:'Cake Pan \u2192 Cakesheen · The Wedding', goal:'Reach 450 rep',
    theme:{ wall:'#c49463', wall2:'#b07f4c', floor:'#7c5325',
            counter:'#7c5325', counterLt:'#a9783f', counterDk:'#5a3a1c', counterBd:'#3c2614',
            signBg:'#5a3a1c', signFg:'#f2c14e', signBd:'#3c2614',
            accent:'#6fbf9a', light:'pendant2', props:'neighborhood' } },
  { n:5, id:'bigcity', name:'Big City P\u00e2tisserie', type:'The grand dream',
    tagline:'Chandeliers, marble counters, and a line around the block.',
    unlocks:'Proofing Oven · Golden Cinnamon', goal:'Bake & adopt the Cinnamon Roll Cat!',
    theme:{ wall:'#f4e4c1', wall2:'#ecd6a8', floor:'#e2d8c2',
            counter:'#e9e2d2', counterLt:'#fbf7ee', counterDk:'#c9bfa4', counterBd:'#7c5325',
            signBg:'#f2c14e', signFg:'#5a3a1c', signBd:'#7c5325',
            accent:'#c14b56', light:'chandelier', props:'bigcity' } },
];

/* ---- Characters & customer dialogue ----
   kind: 'regular' (townsfolk who return), 'tourist' (passing through),
         'rare' (VIPs, big rep, level-gated), 'shop' (Marmalade)        */
const CHARACTERS = {
  marmalade:  { id:'marmalade',  name:'Marmalade',  role:'Grocery Shopkeeper', cat:'orange', tone:'warm',   kind:'shop' },
  // --- regulars ---
  bramble:    { id:'bramble',    name:'Bramble',    role:'Gruff Regular',      cat:'gray',  tone:'gruff',  kind:'regular' },
  pip:        { id:'pip',        name:'Pip',        role:'Shy Kid',            cat:'cream', tone:'shy',    kind:'regular' },
  clementine: { id:'clementine', name:'Clementine', role:'Cheery Neighbour',   cat:'orange',tone:'sunny',  kind:'regular' },
  hopkins:    { id:'hopkins',    name:'Old Hopkins', role:'Sleepy Tomcat',     cat:'gray',  tone:'drowsy', kind:'regular' },
  dot:        { id:'dot',        name:'Dot',        role:'Bouncy Kitten',      cat:'tabby', tone:'excited',kind:'regular' },
  // --- tourists ---
  skipper:    { id:'skipper',    name:'Skipper',    role:'Sailor, Passing Through', cat:'white', tone:'jolly', kind:'tourist' },
  juniper:    { id:'juniper',    name:'Juniper',    role:'Trail Hiker',        cat:'cream', tone:'breezy', kind:'tourist' },
  basil:      { id:'basil',      name:'Basil',      role:'Wandering Poet',     cat:'gray',  tone:'dreamy', kind:'tourist' },
  olive:      { id:'olive',      name:'Olive',      role:'Beachgoer',          cat:'tabby', tone:'sunny',  kind:'tourist' },
  rosco:      { id:'rosco',      name:'Rosco',      role:'Food-Cart Cat',      cat:'orange',tone:'hustle', kind:'tourist' },
  marigold:   { id:'marigold',   name:'Marigold',  role:'Flower Seller',      cat:'cream', tone:'gentle', kind:'tourist' },
  // --- rare / VIP ---
  duchess:    { id:'duchess',    name:'Duchess Featherstone', role:'Events Client', cat:'white', tone:'fancy',  kind:'rare' },
  whiskerton: { id:'whiskerton', name:'Inspector Whiskerton', role:'Food Critic',   cat:'tabby', tone:'critic', kind:'rare' },
  mayor:      { id:'mayor',      name:'Mayor Pemberton', role:'Town Mayor',     cat:'white', tone:'civic',  kind:'rare' },
  gateau:     { id:'gateau',     name:'Chef Gateau', role:'Celebrity Chef',    cat:'orange',tone:'dramatic',kind:'rare' },
  luna:       { id:'luna',       name:'Luna',       role:'Travelling Singer',  cat:'gray',  tone:'starry', kind:'rare' },
};

/* ---- Side-quests (a light narrative builds across the regions) ----
   `level` gates when the request appears; `story` is the through-line.  */
const QUESTS = {
  bramble:    { id:'bramble', giver:'bramble', level:2, title:'Bramble\u2019s Secret',
                require:{ pastry:'croissantsheen', qty:2 }, reward:{ bleps:30, rep:25 },
                pitch:'\u2026Listen. Nobody hears about this. Bring me TWO Croissantsheen. They\u2019re\u2026 for a friend. The friend is me.',
                story:'Your grumpiest regular is finally warming to the world.' },
  pip:        { id:'pip', giver:'pip', level:2, title:'Pip\u2019s Birthday',
                require:{ pastry:'muffinsheen', qty:3 }, reward:{ bleps:40, rep:20 },
                pitch:'It\u2019s my birthday next visit\u2026 could you make three Muffinsheen? My friends have never had one!',
                story:'Pip is throwing their very first party in the neighbourhood.' },
  blockparty: { id:'blockparty', giver:'clementine', level:3, title:'Purrington Block Party',
                require:{ pastry:'muffinsheen', qty:4 }, reward:{ bleps:65, rep:30 },
                pitch:'The whole street is celebrating the new bakery \u2014 YOURS! Four Muffinsheen and we\u2019ll make you guest of honour!',
                story:'Word of your bakery is spreading. The neighbours want to celebrate you.' },
  critic:     { id:'critic', giver:'whiskerton', level:3, title:'The Critic\u2019s Challenge',
                require:{ critBake:'macaronsheen' }, reward:{ bleps:60, rep:30 },
                pitch:'I review only the finest. Present me a Macaronsheen of crit-success quality\u2026 and I shall be impressed. Perhaps.',
                story:'Inspector Whiskerton\u2019s column can make a bakery famous \u2014 or finished.' },
  wedding:    { id:'wedding', giver:'duchess', level:4, title:'The Wedding of the Year',
                require:{ pastry:'cakesheen', qty:1, ingredient:'frosting', iqty:1 }, reward:{ bleps:150, rep:40 },
                pitch:'I am getting married across the whole city! ONE magnificent Cakesheen with Royal Frosting, to wow the entire ceremony.',
                story:'The Duchess\u2019s wedding is the social event of the season.' },
  founding:   { id:'founding', giver:'mayor', level:4, title:'The Founding Festival',
                require:{ pastry:'cakesheen', qty:2 }, reward:{ bleps:120, rep:45 },
                pitch:'Our town turns one hundred! Two grand Cakesheen for the Founding Festival \u2014 the whole city will taste your work.',
                story:'The Mayor wants your bakery at the heart of the town\u2019s big anniversary.' },
  gala:       { id:'gala', giver:'gateau', level:4, title:'Gateau\u2019s Grand Gala',
                require:{ critBake:'cakesheen' }, reward:{ bleps:100, rep:50 },
                pitch:'Darling! A celebrity chef does NOT plate the ordinary. One flawless, crit-perfect Cakesheen for my gala. Dazzle me!',
                story:'Chef Gateau is famous coast-to-coast. Impress them and everyone hears of it.' },
  festival:   { id:'festival', giver:'mayor', level:5, title:'The Cinnamon Roll Festival',
                require:{ pastry:'cakesheen', qty:1 }, reward:{ bleps:200, rep:60 },
                pitch:'From the alley garage to the big city pâtisserie, every cat has heard you\u2019re close to the legend. We\u2019re throwing a festival! Bake one last Cakesheen for the crowd \u2014 and we\u2019ll all pitch in to fund your Golden Cinnamon.',
                story:'The whole city is rooting for you to bake the legendary Cinnamon Roll Cat. This is the send-off.' },
};

/* ---- Customer visit pool (dialogue-driven sales) ----
   rarity: 'regular' | 'tourist' | 'rare' (affects how often they appear)
   minLevel: earliest level this visit can show up.                       */
const CUSTOMER_VISITS = [
  // ===== REGULARS (return often) =====
  { id:'bramble1', who:'bramble', rarity:'regular', minLevel:1, wants:'breadsheen', wantText:'something plain. NOT sweet. A Breadsheen.',
    lines:["Hmph. Don\u2019t look at me like that. I\u2019m only here for the bread.","\u2026it\u2019s a GOOD bread. That\u2019s all."], tipRep:1 },
  { id:'bramble2', who:'bramble', rarity:'regular', minLevel:1, wants:'croissantsheen', wantText:'a Croissantsheen. Just the one.',
    lines:["Fine. Maybe one buttery one. Don\u2019t tell anyone.","I do NOT like sweets. This is\u2026 research."], tipRep:2 },
  { id:'bramble3', who:'bramble', rarity:'regular', minLevel:2, wants:'muffinsheen', wantText:'oh, fine\u2026 a Muffinsheen',
    lines:["My neighbour won\u2019t stop talking about these.","\u2026I suppose I can verify the claim. For science."], tipRep:2 },
  { id:'pip1', who:'pip', rarity:'regular', minLevel:1, wants:'breadsheen', wantText:'the cheapest one, please',
    lines:["Um\u2026 hi. I only have a few bleps. What\u2019s the\u2026 the smallest one?","Thank you for not making me feel silly about it."], kind:true, tipRep:3 },
  { id:'pip2', who:'pip', rarity:'regular', minLevel:2, wants:'muffinsheen', wantText:'a Muffinsheen, if it\u2019s not too much',
    lines:["I saved up all week! A whole Muffinsheen, just for me?","This is the best day."], kind:true, tipRep:3 },
  { id:'clementine1', who:'clementine', rarity:'regular', minLevel:1, wants:'croissantsheen', wantText:'two paws up for a Croissantsheen!',
    lines:["Morning, neighbour! The whole street smells like butter and I LOVE it.","Pop a Croissantsheen in my basket, would you?"], tipRep:2 },
  { id:'clementine2', who:'clementine', rarity:'regular', minLevel:2, wants:'muffinsheen', wantText:'a Muffinsheen for the porch swing',
    lines:["I tell everyone you\u2019re the best thing to happen to this town.","A Muffinsheen and I\u2019m a happy cat!"], tipRep:3 },
  { id:'clementine3', who:'clementine', rarity:'regular', minLevel:2, wants:'croissantsheen', wantsJam:true, wantText:'a Croissantsheen \u2014 a berry-jam one would make my morning!',
    lines:["Is that BERRY JAM I smell? Oh, you wonderful baker.","A jam-filled Croissantsheen and I\u2019ll float home, I swear."], tipRep:4 },
  { id:'hopkins1', who:'hopkins', rarity:'regular', minLevel:1, wants:'breadsheen', wantText:'a soft Breadsheen for these old teeth',
    lines:["*yawn*\u2026 oh, didn\u2019t see you there, youngster.","Something soft. A Breadsheen does an old tom just fine."], tipRep:2 },
  { id:'hopkins2', who:'hopkins', rarity:'regular', minLevel:3, wants:'croissantsheen', wantText:'a warm Croissantsheen to nap on. I mean, with.',
    lines:["In my day a pastry this fine cost a whole moon\u2019s wages.","\u2026now hand it over before I doze off again."], tipRep:3 },
  { id:'dot1', who:'dot', rarity:'regular', minLevel:2, wants:'muffinsheen', wantText:'A MUFFINSHEEN A MUFFINSHEEN!',
    lines:["Hihihi did you bake today did you did you?!","I want the bounciest one! The MUFFIN one!"], tipRep:3 },
  { id:'dot2', who:'dot', rarity:'regular', minLevel:3, wants:'macaronsheen', wantText:'the SHINY round one!! the Macaronsheen!',
    lines:["Mama said I could get the fancy one if I was good and I WAS!","It\u2019s so smooth and round I can\u2019t even!!"], tipRep:4 },
  { id:'dot3', who:'dot', rarity:'regular', minLevel:2, wants:'muffinsheen', wantsJam:true, wantText:'a Muffinsheen \u2014 with the BERRY JAM inside!! please please please',
    lines:["I heard you can put JAM inside now?! Is it TRUE??","A jammy Muffinsheen is the best thing I can even imagine!"], tipRep:4 },

  // ===== TOURISTS (passing through) =====
  { id:'skipper1', who:'skipper', rarity:'tourist', minLevel:1, wants:'croissantsheen', wantText:'a Croissantsheen for the road, matey',
    lines:["Ahoy! Sailed in on the morning tide, me.","Heard a cat could get a fine pastry here \u2014 a Croissantsheen\u2019ll do!"], tipRep:3 },
  { id:'juniper1', who:'juniper', rarity:'tourist', minLevel:2, wants:'muffinsheen', wantText:'trail fuel \u2014 a hearty Muffinsheen',
    lines:["Whew! Twelve miles down from the mountain.","A Muffinsheen would get me back up the trail!"], tipRep:3 },
  { id:'juniper2', who:'juniper', rarity:'tourist', minLevel:2, wants:'croissantsheen', wantsJam:true, wantText:'a jam-filled Croissantsheen \u2014 berries are pure trail energy!',
    lines:["Out on the ridge I dream about berry jam, no joke.","If you can tuck some into a Croissantsheen, you\u2019re a legend."], tipRep:4 },
  { id:'basil1', who:'basil', rarity:'tourist', minLevel:3, wants:'macaronsheen', wantText:'a Macaronsheen, fair as a sonnet',
    lines:["\u2018A pastry, round and pink as dawn\u2026\u2019 \u2014 forgive me, I compose as I wander.","Might such a Macaronsheen exist beyond my verse?"], tipRep:4 },
  { id:'olive1', who:'olive', rarity:'tourist', minLevel:1, wants:'breadsheen', wantText:'a Breadsheen for the beach',
    lines:["Sun\u2019s out! Just here for the day from the coast.","A simple Breadsheen and a spot of sand, perfect."], tipRep:2 },
  { id:'rosco1', who:'rosco', rarity:'tourist', minLevel:2, wants:'muffinsheen', wantText:'a Muffinsheen \u2014 strictly market research',
    lines:["I run a food cart two towns over, see.","I gotta taste the competition. One Muffinsheen, your best!"], tipRep:3 },
  { id:'rosco2', who:'rosco', rarity:'tourist', minLevel:3, wants:'macaronsheen', wantText:'a Macaronsheen \u2014 okay, you got me, I\u2019m a fan',
    lines:["Alright, alright, I drove back. Word\u2019s out about your cats.","Gimme a Macaronsheen before my cart gets jealous."], tipRep:4 },
  { id:'marigold1', who:'marigold', rarity:'tourist', minLevel:1, wants:'croissantsheen', wantText:'a Croissantsheen, traded for a posy',
    lines:["Flowers for the bakery window? They\u2019d look ever so sweet.","And a Croissantsheen for me, if you please."], tipRep:2 },
  { id:'marigold2', who:'marigold', rarity:'tourist', minLevel:2, wants:'muffinsheen', wantText:'a Muffinsheen to match my marigolds',
    lines:["Yellow blooms, golden pastry \u2014 a perfect pair!","One Muffinsheen, and I\u2019ll leave the shop smelling lovely."], tipRep:3 },

  // ===== RARE / VIP (level-gated, big reputation) =====
  { id:'duchess1', who:'duchess', rarity:'rare', minLevel:3, wants:'macaronsheen', wantText:'your finest Macaronsheen, naturally',
    lines:["One does not simply eat ordinary pastry, baker.","I require something with\u2026 elegance."], tipRep:5 },
  { id:'duchess2', who:'duchess', rarity:'rare', minLevel:4, wants:'macaronsheen', wantsJam:true, wantText:'a Macaronsheen with a heart of imported berry jam \u2014 spare no expense',
    lines:["I have tasted preserves on three continents, baker.","A jam-filled Macaronsheen, if you would. I shall pay handsomely."], tipRep:7 },
  { id:'whisk1', who:'whiskerton', rarity:'rare', minLevel:3, wants:'macaronsheen', wantText:'something worth reviewing',
    lines:["I have eaten in every bakery from the alley to the big city.","Show me you belong among them."], tipRep:6 },
  { id:'luna1', who:'luna', rarity:'rare', minLevel:3, wants:'macaronsheen', wantText:'a Macaronsheen before tonight\u2019s show',
    lines:["I sing at the grand city hall this evening, darling.","A little something sweet for the nerves \u2014 a Macaronsheen?"], tipRep:6 },
  { id:'gateau1', who:'gateau', rarity:'rare', minLevel:4, wants:'cakesheen', wantText:'a Cakesheen \u2014 and it had BETTER be grand',
    lines:["I have plated for royalty, baker. ROYALTY.","Show me a Cakesheen that doesn\u2019t embarrass us both."], tipRep:7 },
  { id:'mayor1', who:'mayor', rarity:'rare', minLevel:4, wants:'cakesheen', wantText:'a Cakesheen for the town hall',
    lines:["The council meets tonight and morale is\u2026 crumbly.","Nothing unites a town like a magnificent Cakesheen!"], tipRep:7 },
];

Object.assign(window, {
  INGREDIENTS, COMMON_ING, RECIPES, RECIPE_ORDER, TOOLS, TOOL_ORDER,
  LEVEL_THRESHOLDS, MAX_LEVEL, VENUES, CHARACTERS, QUESTS, CUSTOMER_VISITS,
});
