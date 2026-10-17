// game-data.js — canon data + 40+ events for The Long Apprenticeship
(function(){
  const REGIONS = [
    { id:"woods",     name:"The Woods",     capital:"Sycomore",   lore:"Beast Lore",     hue:"emerald",  particle:"firefly",  legendary:"Gravaldor" },
    { id:"sea",       name:"The Sea",       capital:"Tornpost",   lore:"Tide Lore",      hue:"slate",    particle:"rain",     legendary:"Marrowhide" },
    { id:"desert",    name:"The Desert",    capital:"Menneset",   lore:"Bone Lore",      hue:"ochre",    particle:"sand",     legendary:"Sandrith" },
    { id:"tundra",    name:"The Tundra",    capital:"Thawmoot",   lore:"Frost Lore",     hue:"ice",      particle:"snow",     legendary:"Navrashtya" },
    { id:"jungle",    name:"The Jungle",    capital:"Petalrun",   lore:"Bloom Lore",     hue:"emeraldhot",particle:"spore",    legendary:"Verditrope" },
    { id:"mountains", name:"The Mountains", capital:"Halois",     lore:"Stone Lore",     hue:"slategold",particle:"cloud",    legendary:"Dimondaise" },
  ];

  // Beasts per region — three apprentice-tier options each (canon-flavored, not character names)
  const BEASTS = {
    woods: [
      { name:"Pinepad",      kind:"Vine Bear",       color:"#5e7a4a", glyph:"bear",  trait:"hardy"  },
      { name:"Loambit",      kind:"Burrowing Fox",   color:"#8a6d3a", glyph:"fox",   trait:"clever" },
      { name:"Hush-Owl",     kind:"Quiet Owl",       color:"#7c8a6a", glyph:"owl",   trait:"silent" },
    ],
    sea: [
      { name:"Brinemane",    kind:"Tide Otter",      color:"#5d8aa8", glyph:"otter", trait:"swift"  },
      { name:"Glaucous",     kind:"Storm Petrel",    color:"#9fbac6", glyph:"bird",  trait:"keen"   },
      { name:"Stonecrab",    kind:"Anchor Crab",     color:"#3f6c84", glyph:"crab",  trait:"sturdy" },
    ],
    desert: [
      { name:"Sunscarab",    kind:"Glass Beetle",    color:"#c89150", glyph:"beetle",trait:"radiant"},
      { name:"Lirahound",    kind:"Bone Jackal",     color:"#b08a5a", glyph:"jackal",trait:"loyal"  },
      { name:"Mirage",       kind:"Veil Lizard",     color:"#d8b06a", glyph:"lizard",trait:"hidden" },
    ],
    tundra: [
      { name:"Whitlow",      kind:"Frost Hare",      color:"#cbd9e2", glyph:"hare",  trait:"quick"  },
      { name:"Brume",        kind:"Mist Lynx",       color:"#8fa3b2", glyph:"cat",   trait:"sly"    },
      { name:"Cinderclaw",   kind:"Ember Vole",      color:"#c98c6d", glyph:"vole",  trait:"warm"   },
    ],
    jungle: [
      { name:"Bellflame",    kind:"Spark Toad",      color:"#ce4a8b", glyph:"toad",  trait:"bright" },
      { name:"Twinevine",    kind:"Coil Serpent",    color:"#3a8f6d", glyph:"snake", trait:"binding"},
      { name:"Pollenarch",   kind:"Pollen Moth",     color:"#cf6fc0", glyph:"moth",  trait:"calm"   },
    ],
    mountains: [
      { name:"Cairnling",    kind:"Stone Marmot",    color:"#7a7b80", glyph:"marmot",trait:"steady" },
      { name:"Updrift",      kind:"Cloud Falcon",    color:"#a3a8b2", glyph:"falcon",trait:"high"   },
      { name:"Quartzback",   kind:"Crystal Ibex",    color:"#bdb8a7", glyph:"goat",  trait:"surefoot"},
    ],
  };

  const NAMES_FIRST = [
    "Mira","Rell","Iden","Saro","Talia","Wyn","Bram","Pell","Ona","Jessa",
    "Corin","Hale","Eska","Vasha","Linnet","Tess","Otho","Reeve","Mab","Sora",
    "Phin","Idris","Joran","Thessa","Mer","Galen","Briar","Quill","Aro","Nox",
  ];
  const NAMES_LAST = [
    "Holloway","Marrow","Underbough","Threadneedle","Saltway","Tindle","Vetch","Pennywort","Glim","Reedwhistle",
    "Inkwell","Brake","Carrick","Quillon","Tarrow","Vesper","Knell","Almond","Pyx","Yarrow",
  ];

  const SPECIALTIES = [
    { id:"tracker",  name:"Tracker", desc:"reads sign and follows trail" },
    { id:"healer",   name:"Healer",  desc:"steadies frayed Bonds"        },
    { id:"scholar",  name:"Scholar", desc:"knows the old texts"          },
    { id:"brawler",  name:"Brawler", desc:"weathers a wild charge"       },
  ];

  // ------ EVENTS ------
  // Effect helpers — each choice returns { text, deltas:[{key,val}], applyExtra?(state) }
  // Standard keys: provisions, lore, coin, morale, hollowing, days, league
  // For Bonds: bondAll, bondRandom, bondWeakest, lose (apprentice id rules)
  function mkChoice(label, flavor, deltas, opts){
    opts = opts || {};
    return Object.assign({ label, flavor, deltas, costHint:opts.costHint || null }, opts);
  }

  const EVENTS = [
    // ===== WOODS (≥5) =====
    { id:"w-mossfall", biome:"woods", tag:"WEATHER", title:"Mossfall",
      text:"A slow rain of green spores blankets the trail. The Beasts grow drowsy; one Apprentice insists the moss can be eaten.",
      choices:[
        mkChoice("Push through, hoods up.","Lose half a day to slick footing.",[{k:"days",v:1},{k:"morale",v:-3}]),
        mkChoice("Forage the moss.","Beasts nibble; humans regret it later.",[{k:"provisions",v:8},{k:"bondAll",v:-2}]),
        mkChoice("Make camp until it lifts.","Time spent. Bonds steady.",[{k:"days",v:2},{k:"bondAll",v:4},{k:"provisions",v:-6}]),
      ]},
    { id:"w-gravecho", biome:"woods", tag:"HOLLOWING", title:"A Hush in the Hollow",
      text:"You cross a circle of trees where no birds sing. A small wild Beast lies curled at the center — breathing, but Loreless. Your own Lore stutters here.",
      journal:"The silence is the loudest thing I have ever heard. — apprentice journal",
      choices:[
        mkChoice("Carry it out of the patch.","Hauling weight. Beasts agitated.",[{k:"morale",v:-3},{k:"bondAll",v:-3},{k:"provisions",v:-4}]),
        mkChoice("Mark the patch and move on.","Scholar adds notes to the map.",[{k:"hollowing",v:-2},{k:"morale",v:1}],{requiresSpecialty:"scholar"}),
        mkChoice("Leave it where it lies.","Quick. Heavy on the conscience.",[{k:"morale",v:-6}]),
      ]},
    { id:"w-cropring", biome:"woods", tag:"OUTPOST", title:"The Sycomore Cropring",
      text:"A ring of orchards on the Woods' outer edge. The toll-keeper eyes your Beasts.",
      choices:[
        mkChoice("Trade for provisions.","Standard rates.",[{k:"coin",v:-8},{k:"provisions",v:30}]),
        mkChoice("Barter with Lore.","A whispered illusion sweetens the deal.",[{k:"lore",v:-6},{k:"provisions",v:36}]),
        mkChoice("Move on hungry.","Save coin, lose morale.",[{k:"morale",v:-4}]),
      ]},
    { id:"w-gravaldor", biome:"woods", tag:"BEAST", title:"Tracks the Size of a Cart",
      text:"Tracks the size of a cart bend across the path. Locals would call this the spoor of Gravaldor himself. Your Beasts will not look at them.",
      choices:[
        mkChoice("Follow the tracks a little way.","Brave. Foolish. Possibly both.",[{k:"bondAll",v:-4},{k:"morale",v:6},{k:"lore",v:6}]),
        mkChoice("Cut a wide loop around.","Cost two days.",[{k:"days",v:2},{k:"provisions",v:-6}]),
        mkChoice("Send the Tracker ahead.","She returns pale but whole.",[{k:"lore",v:3},{k:"morale",v:3}],{requiresSpecialty:"tracker"}),
      ]},
    { id:"w-foundlng", biome:"woods", tag:"DILEMMA", title:"A Pup at the Fire",
      text:"A wild Beast pup creeps to the firelight — small, hungry, half-bonded to no one. One of your apprentices is weakest in Bond tonight.",
      choices:[
        mkChoice("Offer it a bond.","If it takes, a fragile pair-up.",[{k:"bondWeakestSet",v:55},{k:"morale",v:8}]),
        mkChoice("Feed it and let it go.","Generous. Slow.",[{k:"provisions",v:-6},{k:"morale",v:4}]),
        mkChoice("Drive it away.","Cold but safe.",[{k:"morale",v:-5}]),
      ]},
    { id:"w-skirmish-a", biome:"woods", tag:"SKIRMISH", title:"A Bristleboar in the Brake",
      text:"A boar twice the size it should be bursts from the brush, tusks alight with corrupted Lore.",
      skirmish:{ foe:"Bristleboar", foeColor:"#3e2a1c", foeGlyph:"boar", hp:60, attack:8, rounds:4 }},

    // ===== SEA (≥5) =====
    { id:"s-tornpost", biome:"sea", tag:"OUTPOST", title:"Tornpost Harbour",
      text:"The boards groan; gulls argue over fish-heads. The dockmaster offers passage along the coast.",
      choices:[
        mkChoice("Pay for a coast-runner.","Three days saved.",[{k:"coin",v:-14},{k:"days",v:-3},{k:"league",v:60}]),
        mkChoice("Walk the cliff road.","Long but free.",[{k:"days",v:2},{k:"morale",v:-3}]),
        mkChoice("Trade fish-craft for fare.","Brawler hauls nets.",[{k:"days",v:-2},{k:"league",v:40},{k:"morale",v:3}],{requiresSpecialty:"brawler"}),
      ]},
    { id:"s-weeptide", biome:"sea", tag:"WEATHER", title:"The Weeping Tide",
      text:"A black squall walks the surf, the kind sailors take their caps off to. There is no shelter for an hour's march.",
      choices:[
        mkChoice("Press through under hoods.","Soaked, but moving.",[{k:"bondAll",v:-4},{k:"morale",v:-4},{k:"days",v:1}]),
        mkChoice("Channel Lore for a windbreak.","Costly, comforting.",[{k:"lore",v:-10},{k:"morale",v:5}]),
        mkChoice("Burrow against the dunes.","Lose a day to the rain.",[{k:"days",v:2},{k:"provisions",v:-5}]),
      ]},
    { id:"s-leviathan", biome:"sea", tag:"BEAST", title:"A Shape Beneath the Wharf",
      text:"At low tide a shape the size of a longboat shifts under the planks. Some Apprentices reach for Lore; the Scholar reaches for a notebook.",
      choices:[
        mkChoice("Approach quietly.","Lore brushes Lore.",[{k:"lore",v:8},{k:"bondAll",v:2}]),
        mkChoice("Hurry on.","Caution earns nothing.",[{k:"morale",v:-2}]),
        mkChoice("Sketch it for the Khronicle.","Worth a coin or two.",[{k:"coin",v:6},{k:"morale",v:3}],{requiresSpecialty:"scholar"}),
      ]},
    { id:"s-pirates", biome:"sea", tag:"CARAVAN", title:"Wreckers on the Strand",
      text:"Figures with lanterns and short hooks pace a beach below the road. They have not seen you yet.",
      choices:[
        mkChoice("Slip past in the dunes.","Tracker leads the way.",[{k:"morale",v:3}],{requiresSpecialty:"tracker"}),
        mkChoice("Pay them off.","Coin keeps Bonds whole.",[{k:"coin",v:-12}]),
        mkChoice("Channel Lore as warning.","Loud. Effective. Costly.",[{k:"lore",v:-12},{k:"morale",v:5}]),
      ]},
    { id:"s-hollowfish", biome:"sea", tag:"HOLLOWING", title:"The Silent Cove",
      text:"A whole inlet of fish drift belly-up, untouched by gulls. Beneath the surface, the water is glassy and wrong.",
      choices:[
        mkChoice("Take fish that look untouched.","Risky food.",[{k:"provisions",v:18},{k:"bondAll",v:-4}]),
        mkChoice("Map the cove's edges.","A Hollowing patch logged.",[{k:"hollowing",v:-3},{k:"days",v:1}],{requiresSpecialty:"scholar"}),
        mkChoice("Burn an offering and move on.","Old custom, small comfort.",[{k:"provisions",v:-4},{k:"morale",v:4}]),
      ]},
    { id:"s-skirmish", biome:"sea", tag:"SKIRMISH", title:"Glass Eel in the Reeds",
      text:"A long, transparent thing rises from the brackish reeds, its teeth backlit by lightning.",
      skirmish:{ foe:"Glass Eel", foeColor:"#6ea0b8", foeGlyph:"eel", hp:55, attack:10, rounds:4 }},

    // ===== DESERT (≥5) =====
    { id:"d-menneset", biome:"desert", tag:"OUTPOST", title:"Gates of Menneset",
      text:"The university city's outer ring offers libraries, water, and a fair price for relics.",
      choices:[
        mkChoice("Resupply at the cistern.","Standard.",[{k:"coin",v:-10},{k:"provisions",v:28}]),
        mkChoice("Sell sketches to the archive.","Scholar fetches a tidy sum.",[{k:"coin",v:14},{k:"lore",v:4}],{requiresSpecialty:"scholar"}),
        mkChoice("Hire a desert-guide.","One day faster, less morale lost.",[{k:"coin",v:-12},{k:"days",v:-2},{k:"morale",v:3}]),
      ]},
    { id:"d-sandstorm", biome:"desert", tag:"WEATHER", title:"A Wall of Ochre",
      text:"A sandstorm a hundred leagues wide bears down. The Beasts press their faces into the dirt.",
      choices:[
        mkChoice("Lash tents and ride it out.","Day lost, Bonds steady.",[{k:"days",v:2},{k:"bondAll",v:2}]),
        mkChoice("March through it.","Some apprentices stumble.",[{k:"bondRandom",v:-12},{k:"morale",v:-6},{k:"days",v:1}]),
        mkChoice("Channel a windbreak.","Lore-thirsty work.",[{k:"lore",v:-14},{k:"morale",v:6}]),
      ]},
    { id:"d-oasis", biome:"desert", tag:"DILEMMA", title:"The Last Oasis",
      text:"You arrive at a small oasis already shared by a struggling family of free-folk. There is enough water for one party.",
      choices:[
        mkChoice("Share, even short.","Lose provisions, gain morale.",[{k:"provisions",v:-10},{k:"morale",v:8}]),
        mkChoice("Take only what you need.","Tense. Functional.",[{k:"provisions",v:8},{k:"morale",v:-3}]),
        mkChoice("Move on without drawing water.","Generous and foolish.",[{k:"morale",v:6},{k:"bondAll",v:-3}]),
      ]},
    { id:"d-sandrith", biome:"desert", tag:"BEAST", title:"A Dune That Was Not There",
      text:"A dune you marked yesterday is gone, replaced by a furrow miles wide. Sandrith stirs beneath the sand somewhere ahead.",
      choices:[
        mkChoice("Detour wide.","Safe, slow.",[{k:"days",v:2},{k:"provisions",v:-5}]),
        mkChoice("Cross at speed.","Lore-charge the Beasts' feet.",[{k:"lore",v:-8},{k:"morale",v:5}]),
        mkChoice("Lay an offering of bone.","Old desert custom.",[{k:"coin",v:-4},{k:"morale",v:4},{k:"bondAll",v:2}]),
      ]},
    { id:"d-hollow-glass", biome:"desert", tag:"HOLLOWING", title:"The Glass Field",
      text:"A patch of desert fused into pale glass. Boots ring on it. Lore does not.",
      choices:[
        mkChoice("Skirt the rim, mapping it.","Hollowing studied.",[{k:"hollowing",v:-3},{k:"days",v:1}],{requiresSpecialty:"scholar"}),
        mkChoice("Cross fast and quiet.","Quick. Bonds unsettled.",[{k:"bondAll",v:-5}]),
        mkChoice("Camp at the rim and listen.","An old voice in the wind.",[{k:"morale",v:-3},{k:"lore",v:6}]),
      ]},
    { id:"d-skirmish", biome:"desert", tag:"SKIRMISH", title:"Husk-Jackal Pack",
      text:"Bone-jackals with Lore-empty eyes circle the camp. Corruption has taken their Bonds.",
      skirmish:{ foe:"Husk-Jackal", foeColor:"#a38358", foeGlyph:"jackal", hp:50, attack:9, rounds:3 }},

    // ===== TUNDRA (≥5) =====
    { id:"t-thawmoot", biome:"tundra", tag:"OUTPOST", title:"Thawmoot",
      text:"A frostbound trade-circle. Furs steam over braziers; the elders read your Bonds like weather.",
      choices:[
        mkChoice("Trade for cold-weather kits.","Bonds steady in the cold.",[{k:"coin",v:-12},{k:"bondAll",v:6}]),
        mkChoice("Buy salt-meat in bulk.","Filling.",[{k:"coin",v:-8},{k:"provisions",v:22}]),
        mkChoice("Ask the elders for Lore-steadying.","A song that warms the chest.",[{k:"coin",v:-6},{k:"lore",v:12}]),
      ]},
    { id:"t-blizzard", biome:"tundra", tag:"WEATHER", title:"Whiteout",
      text:"The world goes featureless white. You cannot see the apprentice ten paces ahead.",
      choices:[
        mkChoice("Tether and march on.","Brawler at the front.",[{k:"days",v:1},{k:"bondAll",v:-2}],{requiresSpecialty:"brawler"}),
        mkChoice("Dig in. Wait it out.","Two days, warm bonds.",[{k:"days",v:2},{k:"provisions",v:-8},{k:"bondAll",v:3}]),
        mkChoice("Channel a Lore-beacon.","Drains, but saves the line.",[{k:"lore",v:-10},{k:"morale",v:4}]),
      ]},
    { id:"t-frost-fever", biome:"tundra", tag:"ILL", title:"Frost-Fever",
      text:"One apprentice wakes shivering and Lore-feverish — a sickness only the Tundra brews.",
      choices:[
        mkChoice("Healer attends through the night.","Bond restored.",[{k:"bondRandomSet",v:80},{k:"days",v:1}],{requiresSpecialty:"healer"}),
        mkChoice("Brew willowbark and march.","Bond fragile but holds.",[{k:"provisions",v:-4},{k:"bondRandom",v:-12}]),
        mkChoice("Lay them in furs for two days.","Slow. Sure.",[{k:"days",v:2},{k:"provisions",v:-8},{k:"bondRandom",v:8}]),
      ]},
    { id:"t-navrashtya", biome:"tundra", tag:"BEAST", title:"A Howl from the Ice",
      text:"At dusk a howl crosses the floes — long, layered, unhurried. Apprentices say it is Navrashtya the Long-Singer answering something.",
      choices:[
        mkChoice("Howl back, respectfully.","An old custom of the north.",[{k:"morale",v:6},{k:"lore",v:4}]),
        mkChoice("March in silence.","Safer.",[{k:"morale",v:-2}]),
        mkChoice("Try to write the song down.","Scholar grins.",[{k:"lore",v:8}],{requiresSpecialty:"scholar"}),
      ]},
    { id:"t-hollow-frost", biome:"tundra", tag:"HOLLOWING", title:"A Field of Still Snow",
      text:"A perfect-flat field where no wind moves the snow. A wrongness so quiet it is almost peaceful.",
      choices:[
        mkChoice("Cross at speed.","Bonds shiver.",[{k:"bondAll",v:-6}]),
        mkChoice("Walk the rim and listen.","Hollowing mapped.",[{k:"hollowing",v:-3},{k:"days",v:1}],{requiresSpecialty:"scholar"}),
        mkChoice("Burn a Lore-flare at its center.","Bright, defiant.",[{k:"lore",v:-12},{k:"hollowing",v:-2},{k:"morale",v:6}]),
      ]},
    { id:"t-skirmish", biome:"tundra", tag:"SKIRMISH", title:"Hollowed Lynx",
      text:"A lynx with white eyes paces the ridge. Its Lore is gone but its hunger isn't.",
      skirmish:{ foe:"Hollowed Lynx", foeColor:"#aeb9c4", foeGlyph:"cat", hp:55, attack:11, rounds:4 }},

    // ===== JUNGLE (≥5) =====
    { id:"j-petalrun", biome:"jungle", tag:"OUTPOST", title:"Petalrun Stilts",
      text:"A town on long stilts above the canopy floor. Apothecaries hawk colored vials; a courier offers a Khronicle dispatch.",
      choices:[
        mkChoice("Stock antivenins.","Costly, sensible.",[{k:"coin",v:-10},{k:"bondAll",v:5}]),
        mkChoice("Buy a paper of pollen-shielding.","Lore-thrifty.",[{k:"coin",v:-6},{k:"lore",v:8}]),
        mkChoice("Sell a courier our news.","Quick coin.",[{k:"coin",v:8},{k:"morale",v:2}]),
      ]},
    { id:"j-vinemaze", biome:"jungle", tag:"WEATHER", title:"The Vine Maze",
      text:"The trail vanishes under vines that move where you don't look.",
      choices:[
        mkChoice("Hack a path.","Brawler grins.",[{k:"days",v:1},{k:"morale",v:2},{k:"bondAll",v:-2}],{requiresSpecialty:"brawler"}),
        mkChoice("Lull them with Bloom Lore.","Costly, gentle.",[{k:"lore",v:-10},{k:"morale",v:4}]),
        mkChoice("Crawl through underneath.","Slow, scraped, alive.",[{k:"days",v:2},{k:"provisions",v:-4}]),
      ]},
    { id:"j-spore-fever", biome:"jungle", tag:"ILL", title:"Pollen-Sick",
      text:"Half the camp wakes blue-lipped and dizzy. The Healer reads the spore-mark on the leaves.",
      choices:[
        mkChoice("Healer brews a tincture.","Most recover by morning.",[{k:"bondAll",v:4},{k:"days",v:1}],{requiresSpecialty:"healer"}),
        mkChoice("Push on through it.","Risky.",[{k:"bondRandom",v:-18},{k:"morale",v:-5}]),
        mkChoice("Wait three days and rest.","Slow and safe.",[{k:"days",v:3},{k:"provisions",v:-12}]),
      ]},
    { id:"j-verditrope", biome:"jungle", tag:"BEAST", title:"The Tree That Watched",
      text:"A tree opens an eye the size of your fist and closes it again. Verditrope is awake, if not awake to you.",
      choices:[
        mkChoice("Leave an offering of fruit.","Quiet custom.",[{k:"provisions",v:-6},{k:"morale",v:5},{k:"bondAll",v:3}]),
        mkChoice("Move past without looking up.","Safer than respectful.",[{k:"morale",v:-2}]),
        mkChoice("Try to read the bark.","Scholar leaves changed.",[{k:"lore",v:10},{k:"hollowing",v:-2}],{requiresSpecialty:"scholar"}),
      ]},
    { id:"j-hollow-bloom", biome:"jungle", tag:"HOLLOWING", title:"The Pale Glade",
      text:"A clearing where every flower has gone white. The bees that find them die in the air.",
      choices:[
        mkChoice("Pass on the upwind side.","Lore-bare. Bonds quiet.",[{k:"bondAll",v:-4}]),
        mkChoice("Map the silent flowers.","Scholarship as defiance.",[{k:"hollowing",v:-3}],{requiresSpecialty:"scholar"}),
        mkChoice("Burn the patch as you go.","Drastic. Cleansing.",[{k:"lore",v:-6},{k:"hollowing",v:-2},{k:"morale",v:-3}]),
      ]},
    { id:"j-skirmish", biome:"jungle", tag:"SKIRMISH", title:"Glassthorn Ambush",
      text:"A coil-serpent with glass-clear thorns drops from the canopy.",
      skirmish:{ foe:"Glassthorn", foeColor:"#3a8f6d", foeGlyph:"snake", hp:60, attack:10, rounds:4 }},

    // ===== MOUNTAINS (≥5) =====
    { id:"m-foothills", biome:"mountains", tag:"OUTPOST", title:"The Foothill Post",
      text:"A Guild waystation flying the gold-and-slate. The wardens recognize your caravan.",
      choices:[
        mkChoice("Take rations from Guild stores.","Generous.",[{k:"provisions",v:25},{k:"morale",v:4}]),
        mkChoice("Ask for news of Halois.","Khronicle pages, fresh.",[{k:"morale",v:6}]),
        mkChoice("Donate to a struggling caravan ahead.","Generous, slow.",[{k:"coin",v:-6},{k:"morale",v:8}]),
      ]},
    { id:"m-pass", biome:"mountains", tag:"WEATHER", title:"The Quiet Pass",
      text:"A high pass, switchbacks above cloud. Your Beasts struggle for breath.",
      choices:[
        mkChoice("Climb together, slow.","Steady.",[{k:"days",v:2},{k:"bondAll",v:-2}]),
        mkChoice("Channel Lore for thin air.","Bonds eased.",[{k:"lore",v:-10},{k:"bondAll",v:4}]),
        mkChoice("Detour through the old goat road.","Tracker remembers.",[{k:"days",v:1},{k:"morale",v:3}],{requiresSpecialty:"tracker"}),
      ]},
    { id:"m-dimondaise", biome:"mountains", tag:"BEAST", title:"A Light on the Far Peak",
      text:"At dawn a slow flash lights the highest peak — Dimondaise stirring, the apprentices whisper. Some take it as omen.",
      choices:[
        mkChoice("Sing the climber's prayer.","Old comfort.",[{k:"morale",v:8}]),
        mkChoice("March in silence.","Practical.",[]),
        mkChoice("Reach toward it with Lore.","An answer comes — small, warm.",[{k:"lore",v:8},{k:"bondAll",v:4}]),
      ]},
    { id:"m-rivalcar", biome:"mountains", tag:"CARAVAN", title:"A Rival Caravan",
      text:"Another apprentice caravan crests the ridge — three left, hungry, eyeing your provisions.",
      choices:[
        mkChoice("Share rations.","Kindness costs.",[{k:"provisions",v:-12},{k:"morale",v:8}]),
        mkChoice("Trade Lore lessons for coin.","Scholarly.",[{k:"coin",v:8},{k:"lore",v:-4}],{requiresSpecialty:"scholar"}),
        mkChoice("Wave and pass.","Cold but timely.",[{k:"morale",v:-4}]),
      ]},
    { id:"m-hollow-peak", biome:"mountains", tag:"HOLLOWING", title:"A Peak Gone Dim",
      text:"A peak that should glow with Stone Lore stands grey and small. Wherever the Hollowing comes from, it has reached here too.",
      journal:"It is closer than we thought. — apprentice journal",
      choices:[
        mkChoice("Hurry. Cut sleep short.","Reach Halois sooner. Costly.",[{k:"days",v:-1},{k:"bondAll",v:-3},{k:"hollowing",v:-1}]),
        mkChoice("Map and report at the Foothill Post.","Scholarship as service.",[{k:"hollowing",v:-3}],{requiresSpecialty:"scholar"}),
        mkChoice("Hold the line. Camp and steady Bonds.","Slow. Solid.",[{k:"days",v:2},{k:"bondAll",v:6}]),
      ]},
    { id:"m-skirmish", biome:"mountains", tag:"SKIRMISH", title:"Stone-Husk",
      text:"A great Beast of granite and breath rounds the bend — its eyes are gone, its bond long broken.",
      skirmish:{ foe:"Stone-Husk", foeColor:"#7d8089", foeGlyph:"husk", hp:75, attack:12, rounds:5 }},

    // ===== ANY-BIOME (general flavour, ~10) =====
    { id:"a-dispatch-1", biome:"any", tag:"DISPATCH", title:"A Khronicle Courier",
      text:"A bird drops a folded paper at your feet. The Keeper's Khronicle: \"DOOLING POSTPONED. APPRENTICE CARAVANS ENCOURAGED TO PRESS ON.\"",
      choices:[
        mkChoice("Read it aloud.","Morale, small.",[{k:"morale",v:5}]),
        mkChoice("Pocket it.","Quiet.",[]),
      ]},
    { id:"a-dispatch-2", biome:"any", tag:"DISPATCH", title:"News from Halois",
      text:"\"GRAND KEEPER'S ELECTION DELAYED A SECOND TIME — RUMORS OF DISSENT IN THE GUILD CHAMBERS.\"",
      choices:[
        mkChoice("Discuss around the fire.","Morale shifts.",[{k:"morale",v:-3},{k:"lore",v:2}]),
        mkChoice("Set it aside.","Practical.",[]),
      ]},
    { id:"a-quiet-day", biome:"any", tag:"WEATHER", title:"A Quiet Day",
      text:"The sun is generous. The Beasts walk easy. No one falls over.",
      choices:[
        mkChoice("March long.","Extra miles.",[{k:"league",v:30},{k:"morale",v:2}]),
        mkChoice("Train the Bonds.","Practical.",[{k:"bondAll",v:6},{k:"lore",v:-4}]),
        mkChoice("Rest while you can.","Bonds eased.",[{k:"days",v:1},{k:"morale",v:4}]),
      ]},
    { id:"a-old-keeper", biome:"any", tag:"DILEMMA", title:"An Old Keeper at the Crossroad",
      text:"A retired Keeper with a tired Beast asks to share your fire. He has stories. He has a cough.",
      choices:[
        mkChoice("Welcome him.","Stories. A cough.",[{k:"morale",v:5},{k:"provisions",v:-4},{k:"lore",v:4}]),
        mkChoice("Trade rations for the use of his maps.","Tracker rejoices.",[{k:"provisions",v:-6},{k:"league",v:30}],{requiresSpecialty:"tracker"}),
        mkChoice("Send him on with food.","Generous and quick.",[{k:"provisions",v:-4},{k:"morale",v:3}]),
      ]},
    { id:"a-bond-frays", biome:"any", tag:"DILEMMA", title:"A Bond Frays",
      text:"At dusk a Beast walks ten paces off from its Keeper, then sits in the grass and looks away. The Keeper is your weakest.",
      choices:[
        mkChoice("Healer mends it.","Recovered.",[{k:"bondWeakestSet",v:75}],{requiresSpecialty:"healer"}),
        mkChoice("Let them work it out.","Slow.",[{k:"days",v:1},{k:"bondWeakest",v:8}]),
        mkChoice("Press the march.","Brutal.",[{k:"bondWeakest",v:-12},{k:"morale",v:-3}]),
      ]},
    { id:"a-merchant", biome:"any", tag:"OUTPOST", title:"A Cart with Brass Wheels",
      text:"A merchant in a coat of pockets blocks the path. \"Anything,\" he says. \"For anything.\"",
      choices:[
        mkChoice("Buy Lore-wax.","Cheap, useful.",[{k:"coin",v:-6},{k:"lore",v:10}]),
        mkChoice("Sell trail finds.","Apprentices empty pockets.",[{k:"coin",v:10},{k:"morale",v:-2}]),
        mkChoice("Buy lighter rations.","Faster march.",[{k:"coin",v:-8},{k:"provisions",v:18}]),
      ]},
    { id:"a-festival", biome:"any", tag:"OUTPOST", title:"A Wayside Festival",
      text:"A village hangs lanterns for a Dooling broadcast. Even now, even here.",
      choices:[
        mkChoice("Stay the night.","Costly, kind.",[{k:"days",v:1},{k:"morale",v:10},{k:"provisions",v:-6}]),
        mkChoice("Pay to watch a match.","A small joy.",[{k:"coin",v:-4},{k:"morale",v:6}]),
        mkChoice("Move on.","Time saved.",[{k:"morale",v:-3}]),
      ]},
    { id:"a-stranger", biome:"any", tag:"CARAVAN", title:"A Stranger Without a Beast",
      text:"A traveler with empty hands walks alongside for an hour, then asks softly if there is room.",
      choices:[
        mkChoice("Welcome them.","A quiet guest.",[{k:"morale",v:3},{k:"provisions",v:-4}]),
        mkChoice("Refuse, politely.","Bonds steady.",[{k:"morale",v:-2}]),
        mkChoice("Question them gently.","Scholar listens.",[{k:"lore",v:6},{k:"hollowing",v:-1}],{requiresSpecialty:"scholar"}),
      ]},
    { id:"a-letter", biome:"any", tag:"DISPATCH", title:"A Letter from Home",
      text:"A courier finds you with letters tied in green ribbon. Family, mostly. One Apprentice's hands shake.",
      choices:[
        mkChoice("Read by the fire together.","Bonds steady.",[{k:"morale",v:6},{k:"bondAll",v:3}]),
        mkChoice("Read in private.","Quieter.",[{k:"morale",v:2}]),
      ]},
    { id:"a-rest", biome:"any", tag:"WEATHER", title:"A Camp by Still Water",
      text:"A pond mirrors the stars so clearly the apprentices argue about which side is real.",
      choices:[
        mkChoice("Camp the night.","Easy.",[{k:"days",v:1},{k:"morale",v:5},{k:"bondAll",v:3}]),
        mkChoice("Press on under stars.","Hard. Beautiful.",[{k:"league",v:20},{k:"morale",v:-2}]),
      ]},

    // ===== NIGHT-ONLY (nocturnal beasts & dark-hour dilemmas) =====
    { id:"n-nightwatch", biome:"any", tag:"NIGHT", when:"night", title:"The Long Watch",
      text:"The dark out here is total, and full of small sounds. Who keeps watch shapes how the camp wakes.",
      choices:[
        mkChoice("Tracker takes the watch.","Nothing gets close.",[{k:"morale",v:4},{k:"lore",v:3}],{requiresSpecialty:"tracker"}),
        mkChoice("Burn a Lore-ward all night.","Costly, calming.",[{k:"lore",v:-8},{k:"hollowing",v:-4},{k:"bondAll",v:3}]),
        mkChoice("Everyone sleeps light.","Cheap. Frayed by dawn.",[{k:"bondAll",v:-3},{k:"morale",v:-3}]),
      ]},
    { id:"n-moonpredator", biome:"any", tag:"SKIRMISH", when:"night", title:"Eyes at the Edge of the Fire",
      text:"Something that hunts only after dark circles the camp — fast, low, and far too quiet for its size.",
      skirmish:{ foe:"Nightmaw", foeColor:"#2a2438", foeGlyph:"cat", hp:58, attack:11, rounds:4 }},
    { id:"n-woodglow", biome:"woods", tag:"NIGHT", when:"night", title:"Foxfire on the Trail",
      text:"The rotten logs glow green and a wild Beast watches from the dark, drawn to your Lore.",
      choices:[
        mkChoice("Leave it a share of supper.","Generous.",[{k:"provisions",v:-5},{k:"morale",v:5},{k:"bondAll",v:2}]),
        mkChoice("Gather the glowing moss.","Useful light.",[{k:"lore",v:6}]),
        mkChoice("Move on in the dark.","Stumbling.",[{k:"days",v:1},{k:"morale",v:-2}]),
      ]},
    { id:"n-deepcold", biome:"tundra", tag:"NIGHT", when:"night", title:"The Killing Cold",
      text:"The tundra night drops past anything the day prepared you for. The fire must not go out.",
      choices:[
        mkChoice("Burn extra fuel.","Warm but wasteful.",[{k:"provisions",v:-8},{k:"bondAll",v:4}]),
        mkChoice("Huddle the Beasts close.","Shared warmth.",[{k:"morale",v:3},{k:"bondAll",v:2}]),
        mkChoice("Ride out the dark, march at dawn.","Brutal.",[{k:"bondRandom",v:-12},{k:"hollowing",v:2}]),
      ]},

    // ===== DAY-ONLY (bright-hour encounters) =====
    { id:"y-highsun", biome:"any", tag:"DAY", when:"day", title:"A Generous Noon",
      text:"The sun is high and kind; the road is clear to the horizon. A good day to make ground.",
      choices:[
        mkChoice("March long while the light holds.","Extra miles.",[{k:"league",v:35},{k:"morale",v:2}]),
        mkChoice("Air the stores and mend gear.","Stock keeps better.",[{k:"provisions",v:10}]),
        mkChoice("Drill the Bonds in the open.","Practical.",[{k:"bondAll",v:6},{k:"lore",v:-4}]),
      ]},
    { id:"y-daybeast", biome:"any", tag:"SKIRMISH", when:"day", title:"A Charge in Broad Daylight",
      text:"A territorial Beast breaks cover in full sun and comes straight down the road at the caravan.",
      skirmish:{ foe:"Sungore", foeColor:"#8a4a2a", foeGlyph:"boar", hp:56, attack:9, rounds:4 }},
  ];

  // Indexed lookup
  const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
  const EVENTS_BY_BIOME = {};
  for (const ev of EVENTS){
    const k = ev.biome;
    (EVENTS_BY_BIOME[k] = EVENTS_BY_BIOME[k] || []).push(ev);
  }

  // Khronicle dispatch templates — substitution slots filled from state
  const KHRON_DISPATCHES = {
    woods: { entering:false, masthead:"THE KEEPER'S KHRONICLE", section:"Edition I — From the Woods",
      lead:{ title:"Apprentice Caravans Press into the Wilderlands",
             body:"Fresh-bonded apprentices set out this fortnight under a dimming sky. Reports from the outer Wilderlands describe what the Guild now grimly calls the {HOLLOWING}, a quiet rot in the Lore. Caravans are advised to keep close watch on their Bonds and to press toward Halois at a measured pace." },
      briefs:[
        { h:"Dooling Postponed", p:"The autumn round of Dooling will not be held in Halois this season; the Grand Keeper cites \"a matter requiring the full attention of the Guild.\"" },
        { h:"University News", p:"Menneset's Scholars admit that the Hollowing patches resist their old indexes. Apprentice scholars are encouraged to map what they cross." },
      ]},
    sea: { masthead:"THE KEEPER'S KHRONICLE", section:"Edition II — On the Sea Road",
      lead:{ title:"Caravan of Four Spotted Crossing the Weeping Tide",
             body:"Witnesses at Tornpost report a caravan led by {LEAD} {LEADLAST} pressing on through foul weather. Their Beasts are spoken of with admiration; one fisher-wife is said to have wept at the sight." },
      briefs:[
        { h:"Wreckers in the Strand", p:"The Sea Keepers have posted warnings; small caravans are asked to march in daylight only." },
        { h:"Glass Cove Sighting", p:"A patch of still water near the cove of Marrow continues to widen. The Hollowing, the Scholars confirm, is not weather." },
      ]},
    desert: { masthead:"THE KEEPER'S KHRONICLE", section:"Edition III — Out of Menneset",
      lead:{ title:"A Dune That Was Not There",
             body:"Travellers report a dune three leagues wide that walked overnight, suggesting Sandrith's restlessness. The University urges caravans to {ADVICE}." },
      briefs:[
        { h:"Glass Field Grows", p:"Menneset Scholars confirm the central Hollowing patch has expanded by a third since spring." },
        { h:"Old Custom Returns", p:"Desert villages are leaving bone offerings at trail-heads for the first time in a generation." },
      ]},
    tundra: { masthead:"THE KEEPER'S KHRONICLE", section:"Edition IV — From the Tundra",
      lead:{ title:"Long-Singer Heard Beyond the Floes",
             body:"Apprentices crossing the ice report the song of Navrashtya answering something further north. Elders of Thawmoot have begun a watch they will not explain." },
      briefs:[
        { h:"Frost-Fever Spreads", p:"Healers note an unusual surge of Lore-fever among newly-bonded apprentices crossing the cold." },
        { h:"Frost-Hare Migration", p:"Whitlows once native only to the Tundra have been seen as far south as the Woods, walking away from something." },
      ]},
    jungle: { masthead:"THE KEEPER'S KHRONICLE", section:"Edition V — In the Jungle",
      lead:{ title:"The Pale Glade Spreads",
             body:"A patch of white-flowered Hollowing in the central Jungle has tripled in size since last reporting. Petalrun's apothecaries are at work but candid: they cannot brew a cure for an absence." },
      briefs:[
        { h:"Verditrope Stirs", p:"Two villages near the eye-tree report dreams in common. Scholars are en route." },
        { h:"Bloom Lore Refuses", p:"Newly bonded Bloom Keepers report their Lore catching, then guttering, as a candle in a draft." },
      ]},
    mountains: { masthead:"THE KEEPER'S KHRONICLE", section:"Edition VI — Approaching Halois",
      lead:{ title:"The Grand Keeper Summons All Who Yet Walk",
             body:"At dusk yesterday the Grand Keeper's standard rose at full mast above the Halois hall. A summons has been issued to every caravan still on the road. \"Bring what you have learned,\" the dispatch reads. \"Bring whom you still have. Come.\"" },
      briefs:[
        { h:"A Peak Gone Dim", p:"A small mountain near Halois has gone dark in the Lore. The Stone Keepers refuse to comment." },
        { h:"Election Suspended", p:"The election of the next Grand Keeper has been suspended. \"Until the road is open,\" the office reads. \"Until we know what walks it.\"" },
      ]},
  };

  // Endings — choose by ending key
  const ENDINGS = {
    cult: {
      verdict:"THE HOLLOWING WAS A CHOICE",
      title:"The Severed",
      body:"The truth, when it comes, is human. A faction of disgruntled former Keepers, calling themselves the Severed, have spent a generation studying how to unmake a Bond on purpose — to free what they call \"the slaved Beasts.\" The Hollowing is their unmaking, spreading. Your reports, and the apprentices who carried them, will be the start of the Guild's reply."
    },
    legendary: {
      verdict:"A LEGENDARY BEAST IS DREAMING",
      title:"The Long Dream",
      body:"In Halois the Scholars compare your maps. The Hollowing patches, plotted together, trace the outline of a sleeping shape too large to be any other thing. A Legendary Beast has begun to dream wrong, and the Lore around it dims wherever the dream touches. The Guild's response will be a thing the world has not done in two hundred years."
    },
    fracture: {
      verdict:"THE LORE ITSELF IS TIRED",
      title:"The Thinning",
      body:"There is no villain. There is no waking Beast. The Lore — the magic the world has poured itself through for so long — is simply running thin in places, as ground will after too much harvest. The Guild's apprentices will spend their long lives learning a kinder husbandry. Your caravan was the first to bring back a map of where it had grown thinnest, and that map is now hung in the Grand Keeper's hall."
    }
  };

  // Legendary Beast capstone encounters. Each region has DAY and NIGHT variants
  // (see LEGENDARIES_NIGHT below); the game picks by the day/night toggle so
  // repeat runs differ. Outcomes apply as deltas; "score" feeds the license rank.
  const LEGENDARIES_DAY = {
    woods: {
      name:"Gravaldor", kind:"the Mosswarden", glyph:"bear",
      title:"A Hill That Breathes",
      intro:"The trail crests and the hill itself opens an eye. Gravaldor, vast and antlered with living pine, regards your caravan the way one regards weather. The Beast Lore of the Woods is older than any town, and it is paying attention.",
      choices:[
        { id:"commune", label:"Commune with it", desc:"Offer Lore, ask for passage",
          deltas:[{k:"lore",v:14},{k:"bondAll",v:8},{k:"hollowing",v:-6}], score:120,
          result:"You speak the old greeting. Gravaldor exhales a fog of spores that settles like a blessing — your Bonds steady, and a measure of the Hollowing lifts from the air." },
        { id:"challenge", label:"Prove your caravan", desc:"Stand and be measured",
          deltas:[{k:"morale",v:14},{k:"coin",v:20},{k:"bondRandom",v:-12}], score:160,
          result:"You hold your ground through the long testing stare. One apprentice's nerve frays — but the Mosswarden marks your caravan as worthy, and the road ahead opens proud." },
        { id:"withdraw", label:"Withdraw quietly", desc:"Lose a day, risk nothing",
          deltas:[{k:"days",v:1},{k:"provisions",v:-4}], score:40,
          result:"You back the wagon down the slope and take the long way around. Safe, slow, and the eye watches you go." },
      ],
    },
    sea: {
      name:"Marrowhide", kind:"the Tidewhale", glyph:"otter",
      title:"The Drowned Bell Rings",
      intro:"Off the Tornpost shallows a shape surfaces longer than the pier — Marrowhide, barnacled with old anchors, singing through a throat of brine. The Tide Lore says it ferries the worthy and swallows the proud.",
      choices:[
        { id:"commune", label:"Sing the tide-greeting", desc:"Trust the old courtesy",
          deltas:[{k:"lore",v:16},{k:"morale",v:10},{k:"bondAll",v:6}], score:130,
          result:"Your ragged chorus matches the whale's note. Marrowhide carries your wagon across a sandbar no map shows — hours saved, spirits lifted." },
        { id:"challenge", label:"Ride its wake", desc:"Cross on the storm it raises",
          deltas:[{k:"league",v:60},{k:"provisions",v:-6},{k:"bondRandom",v:-10}], score:150,
          result:"You lash the wagon and ride the swell. Terrifying, soaking, fast — you gain leagues, though one apprentice will not speak of it again." },
        { id:"withdraw", label:"Wait for low tide", desc:"Lose time, stay dry",
          deltas:[{k:"days",v:1},{k:"morale",v:-4}], score:40,
          result:"You make camp and wait the water out. The bell fades. The crossing, when it comes, is uneventful." },
      ],
    },
    desert: {
      name:"Sandrith", kind:"the Glass Serpent", glyph:"lizard",
      title:"The Dune That Walks",
      intro:"Heat-shimmer resolves into scales of fused glass. Sandrith coils across the whole horizon, each movement ringing like struck crystal. The Bone Lore of Menneset names it the keeper of every traveler the desert ever kept.",
      choices:[
        { id:"commune", label:"Offer water", desc:"Pour your share into the sand",
          deltas:[{k:"provisions",v:-8},{k:"lore",v:18},{k:"hollowing",v:-8}], score:140,
          result:"You pour precious water as tribute. Sandrith drinks the offering and gifts you a vision of safe wells — Lore floods in, and the Hollowing recedes from your wake." },
        { id:"challenge", label:"Outpace it", desc:"Drive the caravan flat-out",
          deltas:[{k:"league",v:70},{k:"provisions",v:-10},{k:"bondAll",v:-8}], score:155,
          result:"You run. Wheels scream, Beasts lather, glass scales close behind — and you break free onto hard ground far ahead, every Bond rattled." },
        { id:"withdraw", label:"Lie still until it passes", desc:"Burn a day in the heat",
          deltas:[{k:"days",v:1},{k:"morale",v:-6},{k:"provisions",v:-4}], score:40,
          result:"You stake down the wagon and wait under canvas while the world rings past. It costs you a day and your nerve, but it passes." },
      ],
    },
    tundra: {
      name:"Navrashtya", kind:"the Aurora Lynx", glyph:"cat",
      title:"Light With Eyes",
      intro:"The aurora bends low and gathers into a shape — Navrashtya, a lynx the size of the night sky, fur running with cold fire. The Frost Lore of Thawmoot says it tests whether a caravan still has warmth worth keeping.",
      choices:[
        { id:"commune", label:"Share your fire", desc:"Invite it to the camp",
          deltas:[{k:"morale",v:16},{k:"bondAll",v:10},{k:"provisions",v:-4}], score:135,
          result:"You stoke the fire and make room. Navrashtya curls around the whole camp till dawn — you wake warmer in body and Bond than you have in weeks." },
        { id:"challenge", label:"Match its gaze", desc:"Refuse to look away",
          deltas:[{k:"lore",v:20},{k:"hollowing",v:6},{k:"bondRandom",v:-12}], score:160,
          result:"You stare into the cold fire and do not blink. Knowledge pours in like meltwater — but the chill of it settles somewhere that will not warm, and one Bond goes brittle." },
        { id:"withdraw", label:"Douse the fire and hide", desc:"Go dark, lose warmth",
          deltas:[{k:"days",v:1},{k:"morale",v:-8}], score:40,
          result:"You smother the flames and wait in the dark. The light passes overhead without finding you. You are safe, and cold, and a day behind." },
      ],
    },
    jungle: {
      name:"Verditrope", kind:"the Eye-Tree", glyph:"moth",
      title:"The Glade That Dreams You",
      intro:"At the heart of Petalrun's canopy stands Verditrope — a tree hung with a thousand slow-blinking eyes, roots breathing like lungs. The Bloom Lore says it dreams the jungle into being, and that lately its dreams have been going wrong.",
      choices:[
        { id:"commune", label:"Enter the dream", desc:"Let it read your caravan",
          deltas:[{k:"lore",v:22},{k:"hollowing",v:-12},{k:"bondAll",v:4}], score:150,
          result:"You step into the green dream and let it know you. It wakes a little — and where its attention turns, the Hollowing thins. You leave with Lore no scholar has written." },
        { id:"challenge", label:"Wake it forcefully", desc:"Cut the binding vines",
          deltas:[{k:"coin",v:30},{k:"morale",v:10},{k:"bondRandom",v:-14},{k:"hollowing",v:8}], score:155,
          result:"You hack the caravan free of the dreaming roots. Verditrope shudders awake, scattering treasures of the lost — but the wrongness in it spills outward, and an apprentice carries some of it now." },
        { id:"withdraw", label:"Skirt the glade", desc:"Add a day in the dark",
          deltas:[{k:"days",v:1},{k:"provisions",v:-6}], score:40,
          result:"You route the wagon through the outer ferns. The eyes track you the whole way, but the dream does not reach for you." },
      ],
    },
    mountains: {
      name:"Dimondaise", kind:"the Peak-Keeper", glyph:"goat",
      title:"The Mountain Opens a Door",
      intro:"On the last pass before Halois, the rock face splits and Dimondaise steps out — a great ibex of slate and diamond, the Stone Lore made flesh. It is the final warden of the road, and it has been waiting for caravans like yours.",
      choices:[
        { id:"commune", label:"Show what you carry", desc:"Lay out your maps and Lore",
          deltas:[{k:"lore",v:18},{k:"morale",v:14},{k:"bondAll",v:8}], score:170,
          result:"You spread your road-maps of the Hollowing before it. Dimondaise studies them, then bows its diamond head — and the gates of the last pass swing wide. You descend toward Halois honored." },
        { id:"challenge", label:"Climb past it", desc:"Take the high, hard route",
          deltas:[{k:"league",v:50},{k:"provisions",v:-8},{k:"bondRandom",v:-10}], score:165,
          result:"You take the sheer route the Peak-Keeper guards. It lets you pass without a word — you save a day's march, though the climb costs you dearly in nerve." },
        { id:"withdraw", label:"Take the switchbacks", desc:"Slow and certain",
          deltas:[{k:"days",v:1},{k:"morale",v:-2}], score:50,
          result:"You wind down the long safe switchbacks. The Peak-Keeper watches from the heights until Halois comes into view below." },
      ],
    },
  };

  // Night variants — different beasts, faced when the caravan travels by night.
  const LEGENDARIES_NIGHT = {
    woods: {
      name:"Lsouvenu", kind:"the Lantern Stag", glyph:"jackal",
      title:"Lights Between the Trees",
      intro:"After dark the woods fill with drifting lights — and at their center walks Lousvenu, a great stag whose antlers burn with cold blue Lore-fire. It leads lost caravans either home or astray, depending on what it finds in them.",
      choices:[
        { id:"follow", label:"Follow its light", desc:"Trust the lantern stag",
          deltas:[{k:"league",v:55},{k:"lore",v:10},{k:"morale",v:6}], score:140,
          result:"You follow the blue fire through paths that should not connect, and wake leagues ahead with the dawn — gifted, and a little changed." },
        { id:"snuff", label:"Snuff your own fires", desc:"Hide and let it pass",
          deltas:[{k:"hollowing",v:-8},{k:"bondAll",v:4}], score:120,
          result:"You go dark and still. The stag passes without testing you, and in its wake the silence thins for a while." },
        { id:"hunt", label:"Take an antler-shard", desc:"A risk for a relic",
          deltas:[{k:"coin",v:28},{k:"lore",v:12},{k:"bondRandom",v:-14}], score:165,
          result:"You pry loose a fallen shard of burning antler — worth a fortune in Lore — but the stag's stare costs one apprentice a piece of their nerve." },
      ],
    },
    sea: {
      name:"Thessaly", kind:"the Drowned Choir", glyph:"eel",
      title:"Voices Under the Black Water",
      intro:"By night the cove sings with many voices at once — Thessaly, a coil of luminous eels that move as one mind, rising from a wreck no chart records. It trades in secrets and the drowned.",
      choices:[
        { id:"listen", label:"Listen to the choir", desc:"Learn what the drowned know",
          deltas:[{k:"lore",v:22},{k:"hollowing",v:-6},{k:"morale",v:-4}], score:150,
          result:"You let the chorus pour its centuries into you. The knowledge is vast and cold — Lore floods in, though the apprentices are quiet for days after." },
        { id:"trade", label:"Trade a keepsake", desc:"Give the sea something dear",
          deltas:[{k:"coin",v:-6},{k:"provisions",v:24},{k:"bondAll",v:5}], score:135,
          result:"You cast a treasured thing into the black water. The choir answers with nets full of strange, edible fish, and a calm that steadies every Bond." },
        { id:"flee", label:"Row hard for shore", desc:"Refuse the bargain",
          deltas:[{k:"league",v:30},{k:"morale",v:-3}], score:90,
          result:"You pull for the strand with your backs to the song. It follows to the tideline and no further." },
      ],
    },
    desert: {
      name:"Hourtatch", kind:"the Star-Scarab", glyph:"beetle",
      title:"A Constellation Lands",
      intro:"Under the desert's enormous night a shape of moving stars descends — Hourtatch, a scarab the size of a temple, its shell a window onto somewhere else. The Bone Lore says it carries the sky's memory of every road.",
      choices:[
        { id:"chart", label:"Chart its shell", desc:"Read the map of stars",
          deltas:[{k:"lore",v:18},{k:"league",v:40},{k:"provisions",v:-6}], score:155,
          result:"Your scholar copies the star-roads burning across its back. You walk the truest path you have ever known — and gain leagues for it." },
        { id:"warm", label:"Warm yourselves on it", desc:"Shelter in its glow",
          deltas:[{k:"morale",v:14},{k:"bondAll",v:8}], score:130,
          result:"You make camp against its warm, humming shell. The cold desert night becomes the best rest of the journey." },
        { id:"pry", label:"Pry loose a shell-plate", desc:"Greed under starlight",
          deltas:[{k:"coin",v:34},{k:"hollowing",v:8},{k:"bondRandom",v:-12}], score:160,
          result:"A single plate of its shell is worth a city. You take one — and something in the star-pattern goes dark where you broke it, and follows you in dreams." },
      ],
    },
    tundra: {
      name:"Sorrowmaw", kind:"the Pale Bear", glyph:"bear",
      title:"It Was Always Behind You",
      intro:"In the long polar dark, the snow itself stands up — Sorrowmaw, a bear of frost and grief twice the height of your wagon, who has paced your caravan for nights unseen. Now it steps into the firelight.",
      choices:[
        { id:"feed", label:"Feed it your stores", desc:"Buy its grief off",
          deltas:[{k:"provisions",v:-12},{k:"morale",v:10},{k:"hollowing",v:-8}], score:145,
          result:"You lay out a great share of food on the ice. Sorrowmaw eats, lays its huge head down, and the grief in the air lifts — the silence with it." },
        { id:"stand", label:"Stand between it and the camp", desc:"Refuse to run",
          deltas:[{k:"morale",v:16},{k:"coin",v:18},{k:"bondRandom",v:-16}], score:165,
          result:"You plant yourself between the pale bear and your apprentices. It tests your nerve to breaking — one of you will not sleep easy again — then bows and is gone." },
        { id:"retreat", label:"Break camp and flee", desc:"Give it the ground",
          deltas:[{k:"days",v:1},{k:"provisions",v:-6},{k:"morale",v:-6}], score:60,
          result:"You abandon the warm camp to the bear and march through the dark. Safe, exhausted, and a day poorer." },
      ],
    },
    jungle: {
      name:"Cantillae", kind:"the Moonmoth Swarm", glyph:"moth",
      title:"The Canopy Comes Alive",
      intro:"At moonrise the whole canopy lifts away — not leaves but a million luminous moths, Cantillae, a single ancient swarm-mind. It settles around your camp in a breathing cathedral of pale wings.",
      choices:[
        { id:"commune", label:"Stand still within it", desc:"Let the swarm read you",
          deltas:[{k:"lore",v:20},{k:"bondAll",v:8},{k:"hollowing",v:-6}], score:150,
          result:"You stand motionless as the swarm flows over every surface. When it lifts, you know things you cannot name — and every Bond hums a little brighter." },
        { id:"harvest", label:"Gather moon-dust", desc:"Collect their shed light",
          deltas:[{k:"coin",v:26},{k:"lore",v:8},{k:"bondRandom",v:-12}], score:160,
          result:"You sweep glowing dust from a hundred wings into jars — precious beyond reckoning — but the swarm's displeasure frays one apprentice's nerve." },
        { id:"shelter", label:"Hood the lanterns and wait", desc:"Pass the night unseen",
          deltas:[{k:"morale",v:8},{k:"provisions",v:6}], score:110,
          result:"You darken the camp and let the cathedral of wings pass over. By dawn they have left a dew of edible nectar on every leaf." },
      ],
    },
    mountains: {
      name:"Vergilion", kind:"the Comet-Ram", glyph:"goat",
      title:"A Star Caught on the Peak",
      intro:"On the final night-pass, a light falls from the sky and does not go out — Vergilion, a ram of burning stone, horns trailing comet-fire, halted on the road to Halois as if waiting to see who still walks it.",
      choices:[
        { id:"ride", label:"Take its fire to the gate", desc:"Ride the comet down",
          deltas:[{k:"league",v:60},{k:"morale",v:12},{k:"bondRandom",v:-10}], score:170,
          result:"You grasp a horn of cold comet-fire and the mountain blurs past. You reach the last descent in a single blazing night — shaken, exalted, nearly there." },
        { id:"forge", label:"Light your Lore from it", desc:"Kindle every Bond",
          deltas:[{k:"lore",v:16},{k:"bondAll",v:10},{k:"hollowing",v:-10}], score:165,
          result:"You touch your guttering Lore to its fire. It catches and roars — Bonds blaze whole again, and the silence retreats from the whole pass." },
        { id:"bow", label:"Kneel and let it pass", desc:"Honor the last warden",
          deltas:[{k:"morale",v:8},{k:"days",v:1}], score:80,
          result:"You kneel in the snow as the comet-ram regards you, then leaps for the stars. The road to Halois lies quiet and open below." },
      ],
    },
  };

  // Assemble day+night pools per region (tagged with `when`).
  const LEGENDARIES = {};
  for (const k of Object.keys(LEGENDARIES_DAY)){
    LEGENDARIES[k] = [
      { ...LEGENDARIES_DAY[k], when:"day" },
      ...(LEGENDARIES_NIGHT[k] ? [{ ...LEGENDARIES_NIGHT[k], when:"night" }] : []),
    ];
  }

  // The Reckoning — Grand-Keeper-only encounter when Hollowing hits 100%.
  // A hard skirmish; winning beats the silence back, losing ends the run.
  const RECKONING = {
    id:"reckoning", biome:"any", tag:"RECKONING", title:"The Hollowing Reckoning",
    text:"The silence has a shape now. It wears the outline of every Beast you have lost, stitched into one vast absence, and it has come to unmake your caravan's Bonds for good. There is no fleeing this. Channel everything.",
    skirmish:{ foe:"The Unmade", foeColor:"#1a1c24", foeGlyph:"husk", hp:120, attack:14, rounds:6 },
  };

  // Home-region starting bonus — home becomes an affinity, not a skip-ahead.
  const HOME_BONUS = {
    woods:     { lore:12,        note:"Woods-born: you begin with extra Beast Lore." },
    sea:       { provisions:14,  note:"Sea-born: Tornpost sent you off well-provisioned." },
    desert:    { coin:24,        note:"Desert-born: Menneset trade-marks line your purse." },
    tundra:    { morale:14,      note:"Tundra-born: cold roads do not frighten you." },
    jungle:    { lore:8, provisions:6, note:"Jungle-born: Petalrun packed both lore and roots." },
    mountains: { provisions:8, morale:8, note:"Mountain-born: the high passes are your cradle." },
  };

  // Trail briefings — practical intel about the leg the caravan is ENTERING,
  // so the Khronicle is something the player reads to plan pace/rations/warding.
  const KHRON_BRIEFING = {
    woods: {
      lede:"The Woods are forgiving — but they are where you learn the shape of the road.",
      watch:[
        "Bristleboars charge from the brush. Keep some Lore in reserve for a skirmish.",
        "The first Hollowing patches appear here. Ward early; it is cheaper than letting it climb.",
        "Standard rations and a Steady pace will carry you through without strain.",
      ],
      legDay:"Gravaldor the Mosswarden walks the daylit hills.",
      legNight:"By night, the Lantern Stag Lousvenu leads caravans home — or astray.",
    },
    sea: {
      lede:"The Sea Road is wet, cold, and hard on Bonds. Spirits fray in the rain.",
      watch:[
        "The Weeping Tide frays every Bond. Camp to recover BEFORE the storm, not after.",
        "Wreckers on the strand want coin. Keep marks in hand to buy them off.",
        "A coast-runner at Tornpost saves days — worth the fare if Bonds are thin.",
      ],
      legDay:"Marrowhide the Tidewhale surfaces in daylight shallows.",
      legNight:"After dark, the Drowned Choir Thessaly sings up from the wrecks.",
    },
    desert: {
      lede:"The Desert is the great test of provisions. Water and food run out here.",
      watch:[
        "Crossings are long. Resupply fully at Menneset and consider a Cautious pace.",
        "Sandstorms scatter the line. Generous rations keep Bonds from breaking in the wind.",
        "Glass-fields raise the Hollowing. Carry Lore to Ward as you cross.",
      ],
      legDay:"Sandrith the Glass Serpent moves beneath the noon dunes.",
      legNight:"Under the stars, the Star-Scarab Hourtatch descends.",
    },
    tundra: {
      lede:"The Tundra kills the unready. The cold itself is the enemy.",
      watch:[
        "Travel by DAY here — the night cold tears Bonds apart. Wait out dusk if you must.",
        "Buy cold-weather kits at Thawmoot; they steady every Bond against the freeze.",
        "Frost-fever strikes a single apprentice. A Healer in the party is worth a great deal.",
      ],
      legDay:"Navrashtya the Aurora Lynx tests the daylit ice.",
      legNight:"In the polar dark, the Pale Bear Sorrowmaw has been pacing you for nights.",
    },
    jungle: {
      lede:"The Jungle is alive and not always friendly. The Hollowing blooms pale here.",
      watch:[
        "Spore-sickness fells half the camp. Stock antivenins at Petalrun before you press in.",
        "The pale glades raise the Hollowing fast. Ward often or it will crest.",
        "Vines swallow the trail. A Brawler cuts the path; without one, expect lost days.",
      ],
      legDay:"Verditrope the Eye-Tree dreams in the daylit canopy.",
      legNight:"At moonrise the whole canopy lifts — Cantillae, the Moonmoth Swarm.",
    },
    mountains: {
      lede:"The last leg. Halois is close — and so is the Hollowing's deepest reach.",
      watch:[
        "The Hollowing is strongest here. Arrive with Lore in hand to Ward the final climb.",
        "Thin air wears Bonds on the passes. Reach this leg with Bonds high; camp to top them up.",
        "The Foothill Post gives Guild rations freely. Take them — the gate is near.",
      ],
      legDay:"Dimondaise the Peak-Keeper guards the daylit pass to Halois.",
      legNight:"By night, the Comet-Ram Vergilion falls burning onto the final road.",
    },
  };

  // ============================================================
  // OMENS — run modifiers drawn at the start of each pilgrimage. Two are
  // drawn per run; they bend the rules all journey long, so no two runs
  // play the same. `mods` keys ending in "Mul" multiply; the rest add.
  // type: boon / bane / mixed (for the reveal-card styling).
  // ============================================================
  const OMENS = [
    // --- Boons ---
    { id:"bountiful", type:"boon", name:"Bountiful Roads", glyph:"otter",
      blurb:"The lands give freely this year. Stores stretch, and rest restores more than it should.",
      mods:{ provDrainMul:0.6, campHealMul:1.3 } },
    { id:"lorebright", type:"boon", name:"The Lore-Bright Year", glyph:"owl",
      blurb:"Lore runs close to the surface. Warding the silence comes cheap.",
      mods:{ startLore:30, wardCostMul:0.6 } },
    { id:"fairweather", type:"boon", name:"A Season of Fair Weather", glyph:"bird",
      blurb:"Mild skies follow your caravan. Spirits hold, and Bonds fray slowly.",
      mods:{ moraleDay:1.5, bondDrainMul:0.8 } },
    { id:"kindred", type:"boon", name:"Kindred Beasts", glyph:"hare",
      blurb:"The wild Beasts sense your Bonds and gentle their challenge.",
      mods:{ skirmishMul:0.75, campHealMul:1.2 } },

    // --- Banes ---
    { id:"longwinter", type:"bane", name:"The Long Winter", glyph:"bear",
      blurb:"An early cold grips every land. Food vanishes; spirits sink.",
      mods:{ provDrainMul:1.5, moraleDay:-1.5 } },
    { id:"restless", type:"bane", name:"Restless Beasts", glyph:"jackal",
      blurb:"Something stirs the wild things. They come more often — and angrier.",
      mods:{ skirmishMul:1.3, eventChanceMul:1.25 } },
    { id:"fraying", type:"bane", name:"The Fraying", glyph:"moth",
      blurb:"Bonds wear thin this year, for reasons no Keeper can name.",
      mods:{ bondDrainMul:1.4 } },
    { id:"thinpurse", type:"bane", name:"An Empty Purse", glyph:"vole",
      blurb:"You set out poor and under-supplied. The road will be lean.",
      mods:{ startCoin:-15, startProv:-20 } },

    // --- Mixed (tradeoffs) ---
    { id:"haste", type:"mixed", name:"The Pilgrim's Haste", glyph:"hare",
      blurb:"You make ground swiftly — but haste feeds the silence.",
      mods:{ leagueMul:1.3, hollowingMul:1.3 } },
    { id:"gilded", type:"mixed", name:"The Gilded Road", glyph:"crab",
      blurb:"Fortune lines the way — and the Beasts covet what glitters.",
      mods:{ startCoin:45, skirmishMul:1.2 } },
    { id:"surge", type:"mixed", name:"A Hollowing Surge", glyph:"husk",
      blurb:"The silence presses hard this year — but Lore answers it, rich and abundant.",
      mods:{ hollowingMul:1.6, startLore:35 } },
    { id:"quiet", type:"mixed", name:"The Quiet Hollow", glyph:"toad",
      blurb:"The Hollowing sleeps. The roads lie calm — and the long days, dull.",
      mods:{ hollowingMul:0.5, eventChanceMul:0.8, moraleDay:-0.5 } },
    { id:"feast", type:"mixed", name:"Feast and Famine", glyph:"boar",
      blurb:"Plenty and want in violent turns. Stock deep when the towns allow.",
      mods:{ provDrainMul:1.7, resupplyMul:2.0 } },
  ];
  const OMENS_BY_ID = Object.fromEntries(OMENS.map(o => [o.id, o]));

  // Aggregate a list of omen ids into one modifier object.
  function combineOmens(ids){
    const M = {
      hollowingMul:1, provDrainMul:1, bondDrainMul:1, eventChanceMul:1,
      leagueMul:1, skirmishMul:1, wardCostMul:1, wardReliefMul:1, campHealMul:1, resupplyMul:1,
      moraleDay:0, startProv:0, startCoin:0, startLore:0, startMorale:0,
    };
    for (const id of (ids || [])){
      const o = OMENS_BY_ID[id];
      if (!o) continue;
      for (const [k, v] of Object.entries(o.mods)){
        if (k.endsWith("Mul")) M[k] *= v;
        else M[k] = (M[k] || 0) + v;
      }
    }
    return M;
  }

  window.WLData = { REGIONS, BEASTS, NAMES_FIRST, NAMES_LAST, SPECIALTIES, EVENTS, EVENTS_BY_ID, EVENTS_BY_BIOME, KHRON_DISPATCHES, KHRON_BRIEFING, ENDINGS, LEGENDARIES, RECKONING, HOME_BONUS, OMENS, OMENS_BY_ID, combineOmens };
})();
