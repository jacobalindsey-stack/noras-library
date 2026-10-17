(function() {
if (window.SCENES) return;
// ADRIATICA — Scene Data
// Pure data. No logic. Every scene the game knows about.
// Images reference filenames in uploads/Mira 2 Images/
//
// Scene shape:
// {
//   name: string,
//   art: string (image filename without path),
//   ambient: { type, volume },
//   onEnter: { first: string, return: string },
//   exits: { direction: { to: sceneId, label?, gate?, gateText? } },
//   NOTE: no sprite layer. The paintings already contain their figures
//   (the klapa, the students); where a person is absent, the painting is
//   composed around that absence and the hotspot goes on the evidence —
//   the second cup, the boot on the wall. Transactions cut to a PLATE.
//   hotspots: [ { id, label, x, y, w, h, sprite?,
//     verbs: { look?, talk?, give? }
//   }],
//   wait: { ladder, afterMax, gate?, gateText?, onComplete? },
//   chapter: number,
// }

const SCENES = {

  // =============================================
  // TITLE
  // =============================================
  'title': {
    name: 'Adriatica',
    art: '28-title.jpg',
    ambient: { type: 'waves', volume: 0.06 , presence: 'forest' },
    isTitle: true,
    onEnter: { first: '', return: '' },
    exits: {},
    hotspots: [],
  },

  // =============================================
  // CHAPTER 0 — SPLIT
  // =============================================

  'kasjuni-day': {
    name: 'Kašjuni Beach',
    art: '01-kasjuni-day.jpg',
    ambient: { type: 'waves', volume: 0.08 , presence: 'forest' },
    chapter: 0,
    onEnter: {
      first: "Kašjuni, below the pine trees on Marjan hill, at the part of the afternoon when the light turns the water green and every tourist has gone back to the Old Town for ice cream. She had just come out. She was alone, and the water was still warm, and she was not in any hurry to go home.",
      return: "The rocks. The water. The same pines.",
    },
    exits: {
      right: { to: 'marjan-path', label: 'Marjan Path' },
      down: {
        label: 'Swim out',
        hideUntilOpen: true,
        // Three states, because the water means three different things to her.
        // Before the hand: nothing is calling her in. After the first voice:
        // she will not get back in, and says so herself — her decision made
        // mechanical rather than a refusal message from the game. After the
        // museum: she knows what it was, and she goes back to count them.
        route: [
          {
            done: 'bolted', to: 'underwater', gate: 'foundHand',
            gateText: "She could swim. She had been swimming all afternoon. Something on this beach was not finished with her yet.",
          },
          {
            gate: 'bolted', done: 'understoodRelief', to: 'underwater',
            gates: ['understoodRelief'],
            gateText: "She looked at it for a long time, and it went on being water, and her hands went on doing the thing her hands were doing.\n\nNot today. Not until somebody tells her what that was.",
          },
          { gate: 'understoodRelief', to: 'underwater' },
        ],
      },
    },
    hotspots: [
      {
        id: 'water', label: 'The water', x: 40, y: 62, w: 40, h: 21,
        verbs: {
          look: {
            ladder: [
              "Clear enough to see the bottom. Rocks, then sand, then the water turns that particular green that means deep.",
              "She has swum here every summer she can remember. The water has never once done anything unexpected. Until Tuesday.",
            ],
            performance: [
              "Clear enough to see the bottom. Rocks, then sand, then the green that means deep. Ana Novak swam here. It says so in a book on an island.",
              "She has swum here every summer she can remember, and so did her great-grandmother, and one of them wrote it down and neither of them said it out loud.",
            ],
            exhausted: [
              "It's water. It does what water does, which is not very much.",
              "A wasp lands on the surface, thinks better of it, and leaves.",
              "Still water. Still doing almost nothing. Very good at it.",
            ],
          },
        },
      },
      {
        id: 'rocks', label: 'The rocks', x: 4, y: 58, w: 22, h: 30,
        verbs: {
          look: {
            ladder: [
              "White limestone, warm on the surface, the kind that holds the heat of the whole afternoon.",
              "There's a flat one where she left her bag. Her phone is in it.",
            ],
            performance: [
              "White limestone, warm on the surface. Somebody sat on these rocks in 1961 and heard three of them and went home and said nothing.",
              "There's a flat one where she left her bag. Her phone is in it. She has not looked at it since Tuesday.",
            ],
            exhausted: [
              "Rocks. Still rocks.",
              "She checks the bag. Phone, towel, one shoe. Still rocks.",
              "The flat one has gone warm again where she was sitting on it.",
            ],
          },
        },
      },
      {
        // P1 · Shape A · the tutorial. Attention has depth, and nothing
        // else in the game works until the player believes that.
        id: 'carved-stone', label: 'Something in the sand', x: 22, y: 62, w: 18, h: 20,
        verbs: {
          look: {
            ladder: [
              "A lump of pale stone, half buried at the waterline. Waves have been at it for a long time.",
              {
                text: "Not a lump.\n\nFour fingers and part of a wrist, worn nearly flat. Somebody carved this, and then the sea spent eight hundred years unmaking it, and it is still, unmistakably, a hand.",
                plate: 'hand',
              },
              "It's holding something. She can't tell what. Neither, apparently, can anybody else, ever again.",
            ],
            performance: [
              "A lump of pale stone, half buried at the waterline. Somebody carved it. Somebody always carved it.",
              "Four fingers and part of a wrist. The sea has been unmaking it for eight hundred years and it is still a hand, which is either very sad or the most stubborn thing she has ever seen.",
              "It's holding something. Whoever carved it knew what. That makes two of them keeping quiet about it.",
            ],
            exhausted: [
              "A hand in the sand, holding something nobody will ever identify.",
              "She puts her own hand next to it. Hers is bigger, which seems unfair on somebody.",
              "The water comes up over the fingers and goes back down again.",
            ],
            onComplete: {
              flag: 'foundHand',
              notebook: {
                section: 'weirdThings',
                entry: { id: 'wt41', text: '#41. There is a HAND in the sand at Kašjuni. Someone carved it. The sea has been rubbing it out for eight centuries and has not finished. It is holding something and nobody will ever know what.' },
              },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The flat rock",
      settleWith: "rocks",
      x: 22, y: 66, w: 20, h: 22,
      text: "She lay back on the flat rock with her ears under the water line and did, deliberately, nothing at all.",
    },
      ladder: [
        "The sea does what the sea does. A gull argues with another gull about something.",
        "The pines move. The heat moves. Everything else is extraordinarily still.",
        "She could sit here for a very long time. She has the feeling that something is about to be different.",
      ],
      afterMax: "The afternoon holds its breath.",
    },
  },

  'underwater': {
    name: 'Underwater',
    art: '02-underwater.jpg',
    ambient: { type: 'waves', volume: 0.03 , presence: 'forest' },
    chapter: 0,
    isUnderwater: true,
    onEnter: {
      first: "She put her head under. And the world went quiet.",
      return: "Under again. The green silence.",
    },
    exits: {
      up: { to: 'kasjuni-day', label: 'Surface' },
    },
    hotspots: [
      {
        id: 'rocks-below', label: 'The rocks below', x: 20, y: 60, w: 30, h: 30,
        verbs: {
          look: {
            ladder: [
              "Stone under the sea. The same stone that's above it, only quieter.",
              "Down here, sound doesn't come from a direction. It arrives at the whole of you at once.",
            ],
            exhausted: "Stone. Waiting.",
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The rocks below",
      settleWith: "rocks-below",
      x: 34, y: 40, w: 32, h: 34,
      text: "She stopped kicking. She let herself hang there in the green with her hair going up, and waited to run out of air.",
    },
      quietedBy: ['foundHand'],
      needsQuiet: 0.6,
      noiseFromQuestions: [
        "Water in her ears and her own heart going like a fist on a door. Whatever else was down here, she was drowning it out with herself.",
        "She got about four seconds of quiet before her own head started up again about the hand.",
      ],
      // The first vision must land AFTER the museum. The kitchen opens the
      // HEARING the voice cannot be gated: it is what starts the whole story
      // (voice -> tell Dida -> he sends her to the museum -> she counts four).
      // So the VISION is the gated beat, not the stillness. She hears the bass
      // on the first visit, goes and understands the relief, and comes back to
      // the water for what the vision is now able to mean.
      ladder: [
        "Her ears go quiet in that way they do. The engines and the gulls are simply gone.",
        "Down here, sound doesn't come from a direction. It arrives at the whole of you at once.",
        {
          // THE moment the game is named after. She has no framework yet: the
          // relief at the museum is what will tell her what this was. So what
          // she gets here is not information, it is contact — and a thirteen
          // year old who makes contact with something three thousand years old
          // does not stay in the water and take notes.
          text: "And underneath everything — underneath the sand, underneath the rock the sand is sitting on — something starts.\n\nIt is not a boat. Boats have engines, and engines have a rhythm. This has no rhythm. It is one enormous held note, warm as blood, coming up through the sea floor the way heat comes up through a road at the end of a hot day.\n\nAnd it is not a noise. Mira has heard every noise this beach makes since she was four years old, and none of them were ever ADDRESSED to anybody.\n\nSomething the size of the hill is singing. It has been singing the entire time. She has been swimming around on top of it for thirteen years like an absolute idiot.",
          delay: 1800,
          sound: { voice: 'forest', fadeIn: 6 },
          flag: 'heardForest',
          notebook: {
            section: 'weirdThings',
            entry: { id: 'wt42', text: '#42. THE SEA HAS SOMETHING IN IT AND IT IS SINGING.' },
          },
        },
        {
          // She leaves. Not a punishment and not a cutscene — the only thing a
          // person actually does. The water then stays shut until the museum,
          // which turns the old refusal message into something she decided.
          text: "She was out of the water before she had decided to be.\n\nShe got herself onto the flat rock and sat there with her knees up and her hands going like something electrical, and the sea in front of her was just the sea, doing the ordinary bright thing it does at four in the afternoon.\n\nHer first coherent thought was that she was going to have to tell somebody. Her second was that there was exactly one person on this coast who would not immediately take her to a doctor.\n\nShe was not getting back in today. She knew that the way you know you are not going to touch a hot pan twice.",
          delay: 900,
          flag: 'bolted',
          actions: [{ type: 'goto', to: 'kasjuni-day', delay: 600 }],
        },
        {
          gate: 'understoodRelief',
          gateText: [
            "She got her face under and made herself hold still, and it was there, exactly where she had left it, holding.",
            "It does not answer questions. She has asked it four now, in her head, and it has gone on doing the one enormous thing it does.",
            "Her chest has started complaining. There is nothing more down here until she has been to look at the stone from Klis — the one Dida would not shut up about.\n\nUp. Out. Bus into town.",
          ],
          text: "She counted them the way she had counted the figures on the stone. Three together, holding on to each other. And, a little apart from the three, one more, underneath the others, giving them the floor to stand on.\n\nFour. There were four.\n\nThe green went gold.",
          delay: 1800,
          vision: 'V1',
        },
      ],
      afterMax: [
        "The bass holds. Enormous and warm, rising out of the stone.",
        "She could stay down here until her lungs gave out and it would still just be holding.",
        "Whatever happens next does not happen at the bottom of the sea. She surfaces.",
      ],
      onComplete: {
        flag: 'sawFirstVision',
      },
    },
  },

  'kitchen': {
    name: "Dida's Kitchen",
    art: '03-kitchen.jpg',
    ambient: { type: 'silence', volume: 0.02 , presence: 'forest' },
    chapter: 0,
    onEnter: {
      first: "Dida was doing the crossword. He did not look up. The kitchen smelled of coffee and the cat was occupying a floor tile as though the tile were built for her.",
      return: "The kitchen. Coffee. The crossword. The cat.",
    },
    exits: {
      left: { to: 'kasjuni-day', label: 'Go to the beach' },
      right: { to: 'museum', label: 'Go to the museum', gate: 'sentToMuseum', gateText: 'Dida hasn\'t said where to go yet.' },
      forward: {
        label: 'Onward',
        route: [
          {
            gate: 'sentToOmis', done: 'tonkoWisdom', to: 'omis-above',
            label: 'Saturday. The bus to Omiš.',
            // P3: she does not leave Split without Nona's cup — and she does not
            // leave without going back under, either. The first vision sits on
            // a gated rung at the bottom of Kašjuni and NOTHING pointed at it,
            // so a whole playable interlude was quietly missable.
            gates: ['sawFirstVision', 'gotCup'],
            gateText: "Nona is standing in the doorway with a basket of laundry and no intention of moving.",
            gateTextBy: {
              sawFirstVision: "Not yet. Dida said the museum first and then Omiš, and she has done the museum — but the thing she heard from underneath is still down there at Kašjuni, and she has not been back in the water since she learned how to count it.",
              gotCup: "Nona is standing in the doorway with a basket of laundry and no intention of moving.",
            },
          },
          { gate: 'heardRiver', done: 'foundNotebook', to: 'ferry-deck', label: 'The ferry to Brač.' },
          { gate: 'stoneRang', done: 'heardAll', to: 'korcula-street', label: 'The catamaran to Korčula.' },
          { gate: 'heardAll', done: 'sangWithThem', to: 'kasjuni-dawn', label: 'Before six. The beach.' },
          {
            gate: 'sangWithThem', done: 'handingOn', to: 'lake-michigan',
            label: 'October. Illinois.',
            gates: ['telling'],
            gateText: "Dida is still at the table with the third cup out, and she has not sat down yet.",
          },
        ],
      },
    },
    hotspots: [
      {
        id: 'dida', label: 'Dida', x: 63, y: 32, w: 19, h: 50,
        verbs: {
          talk: {
            gate: 'heardForest',
            // Escalates. This is the most-tapped gate in the game — a player
            // walks in and tries TALK first — and it was one sentence forever,
            // which reads as a character with no dialogue rather than a man
            // waiting for her to have something to say.
            gateText: [
              '"Well?" he says, without looking up.',
              'He fills in a word. "Mm," he says.',
              '"You have been standing there for a while," said Dida, "for somebody with nothing to report."',
              'He puts the pen down. "When you have actually got something," he said, "you will not have to work out how to start. Go on. The water is still warm."',
              '"Still nothing?" said Dida, and went back to the crossword, and Mira understood that he was not being unkind, he was being patient, which was worse.',
            ],
            ladder: [
              { text: '"There was singing. In the sea. Underwater, at Kašjuni, and it stops when you come up and it starts again when you go down, and there were four of them, I think four, and—"\n\nDida put the pen down. He did it slowly, and then he put both hands flat on the table, and then he said a word in Croatian that Mira had never heard him say and that she was fairly sure he was not supposed to say in front of her.\n\n"Four," he said.\n\n"Four."\n\n"You\'re sure it was four."\n\n"I counted eleven times."', flag: 'didaKnows' },
              { text: '"Sixty-one years," he said. "Sixty-one years I have been waiting for somebody in this family to walk through that door with wet hair and say that sentence." He pointed at her. "Your father. Nothing. Your aunt. Nothing. Every summer, in that water, nothing, the pair of them, like two potatoes."' },
              { text: '"The museum first," said Dida. "Tomorrow. Go and look at the stone from Klis. Four figures on it. Look at them properly, not for eleven seconds like a tourist. Then Omiš. Saturday. Take your cousin, he needs the sun. There\'s a canyon. Go into it and be quiet and see what happens."\n\n"You\'re not going to tell me."\n\n"Absolutely not," said Dida. "This is the best week of my life."', flag: 'sentToMuseum' },
            ],
            exhausted: 'Dida is smiling at the crossword. He is not going to say another word about it today.',
          },
          give: {
            gate: 'heardAll',
            gateText: "Not yet. She has nothing to hand him that he hasn't already got.",
            requires: 'woodenCup',
            noItemText: "She has nothing to give him.",
            text: "It was eleven at night and the third cup was already on the table and Nona had gone to bed.\n\nMira filled Nona's wooden cup from the pot and put it into her grandfather's hands.\n\nDida looked at it. Then at her. Then he laughed out loud in his own kitchen at eleven at night — a proper laugh, the kind that has been waiting sixty-one years for somewhere to go — and knocked his cup against hers.\n\n\"All four,\" he said. \"Right. Sit down. I'm going to tell you the whole thing, and it's going to take until about two.\"",
            flag: 'telling',
            consumeItem: true,
            doneText: "He is already telling her. It is going to take until about two, and Nona has already given up and gone to bed.",
            notebook: {
              section: 'didaSays',
              entry: { id: 'ds9', text: 'He said: nobody in the family since his mother. He said he stopped talking about it in 1974 because of the way people looked at him. He said he never stopped going in the water.' },
            },
          },
          look: {
            ladder: [
              "Her grandfather. Seventy-nine years old. Doing the crossword like a man who has done the crossword every morning for fifty years and sees no reason to stop now.",
              "He is looking at the sea through the window the way other people look at a television. Weird Thing #38.",
            ],
            performance: [
              "Her grandfather. Seventy-nine. His mother's name is in a book at the bottom of a ravine with three marks beside it, and Mira is fairly sure he has never seen that book.",
              "He is looking at the sea through the window the way other people look at a television. He has been doing that his whole life and nobody in this family has ever once asked him why.",
            ],
            exhausted: [
              "Dida. Crossword. Sea.",
              "He fills in four letters, looks at them, and takes them out again.",
              "He has not turned the page of that newspaper in eleven minutes.",
            ],
          },
        },
      },
      {
        id: 'cat', label: 'Keso', x: 10, y: 66, w: 14, h: 24,
        verbs: {
          give: {
            text: "There is half a tin of sardines on the counter that nobody has claimed. Mira put it down on the tile.\n\nKeso ate the lot without appearing to move, stood up, walked in a complete circle to the left for no reason available to science, and sat down again two feet from where she had started.\n\nAnd Nona — who had said one sentence all day — crossed the kitchen, put a small wooden cup into Mira's hand, and closed her fingers round it.\n\n\"It's only any good if you hand it on full,\" she said, and went back to the laundry.",
            addItem: 'woodenCup',
            flag: 'gotCup',
            plate: 'cup',
            doneText: "Keso has had the sardines, and Keso's position is that this is now a standing arrangement. Nona is back at the laundry.",
            notebook: {
              section: 'weirdThings',
              entry: { id: 'wt39', text: '#39. Nona gave me a cup. A CUP. She closed my fingers round it like it was a bird. Then she went back to the washing. I have no idea what just happened.' },
            },
          },
          look: {
            ladder: [
              "A fat grey cat occupying a floor tile as though the tile were built for her.",
              "Keso has opinions about everything and expresses them by sitting on them.",
              // The GIVE is the gate out of Split, so the sardines have to be
              // somewhere she can find them. They were nowhere — the tin only
              // existed inside the reward text, which nobody had read yet.
              "There is half a tin of sardines open on the counter that nobody has claimed, and Keso has been aware of it since before Mira came in. Neither of them is going to mention it first.",
            ],
            exhausted: "Keso. Still there. Still occupying. Still not mentioning the sardines.",
          },
        },
      },
      {
        id: 'cups', label: 'The two cups', x: 39, y: 54, w: 21, h: 13,
        verbs: {
          look: {
            ladder: [
              "Two cups and the moka pot, still going. One cup is hers. Nobody asked her whether she wanted coffee; there was simply a cup.",
              "The second chair is pulled out at an angle, the way a chair is left by somebody who intends to come back to it.",
            ],
            performance: [
              "Two cups and the moka pot. Nona put both cups out. Nona puts both cups out every morning, and has done for sixty-one years, for a man who was waiting for somebody to walk in with wet hair.",
              "The second chair is pulled out at an angle. Somebody sits there. Somebody has always sat there.",
            ],
            exhausted: [
              "Two cups. One pot. The chair at its angle.",
              "The pot has stopped going. Nobody has poured anything.",
              "Somebody has washed her cup and put it back out. Ready for tomorrow.",
            ],
          },
        },
      },
      {
        id: 'window', label: 'The window', x: 51, y: 25, w: 12, h: 25,
        verbs: {
          look: {
            ladder: [
              "The Adriatic, framed by blue shutters, doing what the Adriatic always does.",
              "Somewhere out there, under the surface, four voices are singing to nobody. Or to her.",
            ],
            performance: [
              "The Adriatic, framed by blue shutters, doing what the Adriatic always does, which turns out to be considerably more than anyone mentioned.",
              "Somewhere out there, under the surface, four voices are singing to nobody. Not to her. That was the part she had wrong.",
            ],
            exhausted: "Sea. Shutters. The ordinary everything of it.",
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The empty chair",
      settleWith: "dida",
      x: 26, y: 64, w: 20, h: 26,
      text: "She sat down in the chair opposite her grandfather and didn't say anything, which in this kitchen counted as conversation.",
    },
      ladder: [
        "The fridge hums. A scooter goes past somewhere down the hill.",
        "Nona comes in with a basket of laundry, looks at the two of them, and does not break stride.",
        '"She\'s making a lake," said Nona.\n\n"She is," Dida agreed.\n\n"On my floor."\n\n"On your floor."\n\nNona went out again.',
      ],
      afterMax: "The kitchen holds its particular peace.",
    },
  },

  'museum': {
    name: 'The Archaeological Museum',
    art: '04-museum.jpg',
    ambient: { type: 'silence', volume: 0.01 , presence: 'forest' },
    chapter: 0,
    onEnter: {
      first: "The museum was cool and quiet and smelled of stone and floor polish. The lighting was the kind that makes everything look like it matters.",
      return: "The museum. The relief. The same light.",
    },
    exits: {
      left: { to: 'kitchen', label: 'Back to the apartment' },
    },
    hotspots: [
      {
        // The placard exists so the official account is IN the room. Her
        // discovery is not that the card is wrong — it is that the card is a
        // description of a picture, and she is looking at a witness statement.
        id: 'placard', label: 'The card on the case', x: 62, y: 58, w: 15, h: 16,
        verbs: {
          look: {
            ladder: [
              "RELIEF VOTIVE. Klis, 2nd c. AD. Limestone. Three nymphs and Silvanus. — and then, in the smaller italic type they use for the part somebody actually thought about: A conventional pastoral scene representing harmony and the eternal rhythm of nature.",
              "Conventional. Pastoral. Representing.\n\nEvery word on the card assumes the person who cut this stone was decorating something. Nobody who wrote the card has ever once considered the possibility that he was reporting.",
              "She read it a fourth time and understood that the card was not lying. It was just answering a completely different question. Somebody had asked it what the carving was OF. Nobody had asked it what the carving was FOR.",
            ],
            exhausted: "Conventional. Pastoral. Representing. Three words doing an enormous amount of not-looking.",
            onComplete: {
              flag: 'readPlacard',
              notebook: {
                section: 'weirdThings',
                entry: { id: 'wt44', text: '#44. The card says "representing." It does not say "recording." Nobody has ever asked this rock what it heard.' },
              },
            },
          },
        },
      },
      {
        id: 'relief', label: 'The relief', x: 42, y: 26, w: 17, h: 42,
        verbs: {
          look: {
            ladder: [
              "A slab of limestone about the size of an oven door, lit from above in a glass case. Four figures. Three women in belted tunics, standing shoulder to shoulder, holding hands. Their faces were worn almost smooth. They were, Mira thought, and then couldn't unthink, mid-step.",
              "And at the right-hand edge, standing a little apart from the three, a figure with goat's legs and small curved horns and an animal at his knee. He was holding a set of pipes.",
              {
                gate: 'waitedAtRelief',
                // Escalating, because this is the game's first Look-Again +
                // Listen combination and one fixed line repeated forever reads
                // as a broken puzzle rather than an unfinished one. The last
                // rung names the verb, because by then she has earned it.
                gateText: [
                  "She's looked at it twice. Looking a third time at the same rock is either the stupidest thing she's ever done or the only thing she's here for.",
                  "Third time. Same rock. Same four figures. Whatever is wrong with this stone is not going to be fixed by her staring harder at it.",
                  "Nothing. She is doing the thing where you read the same sentence four times and take in less of it each go.",
                  "The case hums. A school group goes past. She is standing in a quiet room being extremely busy, and it is not working.\n\n(She could try being as quiet as the room. LISTEN.)",
                ],
                text: "There is a space between the three and the one. Not damage — the carver left it. He cut a gap into limestone on purpose, because the fourth one stands apart, and he needed you to know that.\n\nThree of them are holding on to each other. One of them is underneath, giving the other three something to stand on.\n\nAnd Mira, standing in a cold room in her own city in front of a rock somebody cut eighteen hundred years ago, gets it all at once and has to put a hand on the glass.\n\nThis is not a picture of anything. Somebody stood where she stood on Tuesday. Somebody heard the enormous warm one holding up the other three, and could not tell anybody either, and did the only thing available to them: they cut it into a stone and left it somewhere cold and public and hoped that eventually somebody would walk in who already knew.\n\nIt is not a carving. It is a message, and it is addressed to her, and it says: THERE ARE FOUR OF THEM. YOU ARE NOT THE FIRST. KEEP COUNTING.",
                actions: [
                  { type: 'flag', flag: 'understoodRelief' },
                  { type: 'flag', flag: 'sentToOmis' },
                  { type: 'unlock', target: 'omis-above' },
                ],
              },
            ],
            performance: [
              "A slab of limestone the size of an oven door. Three women holding hands, mid-step, faces worn smooth. Somebody cut this because they had heard it too.",
              "And at the right-hand edge, a little apart from the three, the one with goat's legs and the pipes. Second century. He has been standing slightly apart for eighteen hundred years.",
              "The space between the three and the one. The carver left room for it. So did whoever kept the book. So did Nona.",
            ],
            exhausted: "She has looked at this relief until her eyes hurt. Four figures. Three holding on to each other. One underneath and apart. A space between them that is not an accident, and a man eighteen hundred years dead who went to a great deal of trouble to make sure she noticed it.",
            onComplete: {
              flag: 'examinedRelief',
              notebook: {
                section: 'weirdThings',
                entry: { id: 'wt43', text: '#43. Roman relief from Klis, 2nd century. FOUR. Three holding on to each other, one underneath giving them the floor. The big warm one I heard at Kašjuni is the one underneath. He is not accompanying them. He IS the ground.\n\nSomebody else heard this. Somebody else heard this and could not tell anybody either. I am not mad, or I am mad in a way that has been going on for eighteen hundred years, which is close enough.' },
              },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "In front of the case",
      x: 10, y: 70, w: 26, h: 22,
      text: "She settled down in front of the case with her hands in her lap like someone waiting for a bus, and let the room be as quiet as it clearly wanted to be.",
    },
      ladder: [
        "The case hums. A school group goes through the next room like weather. Nobody else stops.\n\nAnd in the quiet she notices that she is doing, in a museum, in a cardigan, exactly what she did at the bottom of the sea. Going still to hear something.\n\nSomething about the stone in the case changes. Not the stone. Where she is standing in relation to it.",
      ],
      afterMax: "The museum holds its silence.",
      onComplete: {
        flag: 'waitedAtRelief',
      },
    },
  },

  'marjan-path': {
    name: 'Marjan Path',
    art: '05-marjan-path.jpg',
    ambient: { type: 'wind', volume: 0.06 , presence: 'forest' },
    chapter: 0,
    onEnter: {
      first: "Pine forest, dappled light, cicadas. Behind her the Old Town is white and gold in the morning sun. The path smells of rosemary and hot dust.",
      return: "The path through the pines. The sea below, the city behind.",
    },
    exits: {
      left: { to: 'kasjuni-day', label: 'Down to the beach' },
      right: { to: 'kitchen', label: 'Back to the apartment' },
    },
    hotspots: [
      {
        id: 'the-pines', label: 'The pines', x: 30, y: 22, w: 34, h: 44,
        verbs: {
          look: {
            ladder: [
              "The pines go all the way up the hill and all the way down to the water, and the cicadas are doing the thing where a thousand of them add up to one enormous animal breathing.",
              "She stopped with her hand flat on a trunk, and underneath the cicadas and the dust and somebody's moped down on the coast road, there it was. The same held note. Up here. In the dry. Three hundred metres from the sea.\n\nIt is not IN the water. The water is only where she happened to be standing the first time she shut up long enough to hear it.",
            ],
            exhausted: "Pines, cicadas, hot dust. And under all of it, the note, getting on with what it does.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt45', text: '#45. Heard the big one on MARJAN. Dry land, halfway up a hill, nowhere near the water. So he is not IN the sea. The hill is him. I have been walking around on top of somebody my entire life and calling it a nice view.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The warm stones",
      x: 34, y: 68, w: 32, h: 26,
      text: "She sat down on the warm stones at the side of the path and let the afternoon carry on without her.",
    },
      ladder: [
        "A large orange cat with one ear sits on a wall in a square of sunlight.",
        "He bumps his head against her knuckles once and goes back to sleep.",
      ],
      afterMax: "Pines. Cicadas. The smell of the whole afternoon.",
    },
  },

  // =============================================
  // CHAPTER 1 — OMIŠ
  // =============================================

  'omis-above': {
    name: 'Mirabella Fortress',
    art: '06-omis-from-above.jpg',
    ambient: { type: 'wind', volume: 0.07 , presence: 'river' },
    chapter: 1,
    onEnter: {
      first: "Three hundred and something steps, in August, at eleven in the morning. From the top you could see the whole town, the whole coast, and the canyon — a crack in the earth running back into the mountains, with a green thread of river at the bottom.",
      return: "The fortress. The view. The canyon like a crack in the world.",
    },
    exits: {
      down: { to: 'canyon', label: 'Into the canyon' },
      left: { to: 'omis-square', label: 'Back to the square' },
    },
    hotspots: [
      {
        id: 'canyon-view', label: 'The canyon', x: 30, y: 20, w: 40, h: 50,
        verbs: {
          look: {
            ladder: [
              "A gorge going back into the mountains, with walls of limestone three hundred metres high and a green thread of river at the bottom.",
              "Underneath the wind and the motorbike on the coast road, so faint that she couldn't be sure she wasn't inventing it, something that sounded like a note being held.",
            ],
            performance: [
              "A gorge going back into the mountains, three hundred metres of limestone and a green thread of river at the bottom. The pirates would not leave. Now she knows what they would not leave.",
              "Under the wind and the motorbike on the coast road, something that sounds like a note being held. It has been held the entire time.",
            ],
            exhausted: "The canyon. Waiting for her.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt50', text: '#50. From the top of the fortress at Omiš — a second one. Not the big warm one. Higher, and it comes from the GORGE, not from underneath. So there is one per place, and this one lives in a canyon.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The parapet",
      settleWith: "canyon-view",
      x: 30, y: 62, w: 40, h: 26,
      text: "She leaned on the parapet with the whole gorge underneath her and stopped trying to look at any of it.",
    },
      ladder: [
        "The wind comes up off the coast and the whole fortress hums with it.",
        "A bird goes into the canyon and does not come out.",
      ],
      afterMax: "The fortress holds its height.",
    },
  },

  'canyon': {
    name: 'The Canyon',
    art: '07-canyon.jpg',
    ambient: { type: 'river', volume: 0.15 , presence: 'river' },
    chapter: 1,
    onEnter: {
      first: "The walls rose. Every footstep returned after four seconds. A bird call came back as a chord. The further in it went, the higher the walls got, and the stranger everything sounded.",
      return: "The canyon. The roar. The walls going up and up.",
    },
    exits: {
      back: { to: 'omis-above', label: 'Back to the fortress' },
      // Not on screen at all until the second LOOK finds the fold in the wall.
      forward: {
        label: 'The dry channel',
        route: [
          { gate: 'foundSideChannel', to: 'side-channel', label: 'In behind the shoulder of rock' },
        ],
      },
    },
    hotspots: [
      {
        id: 'walls', label: 'The canyon walls', x: 0, y: 0, w: 100, h: 60,
        verbs: {
          look: {
            ladder: [
              "Limestone three hundred metres high. Every sound she makes comes back changed, as if the canyon is doing its own version of whatever she just said.",
              {
                text: "About two hundred metres back, the wall folds. A dry channel goes in behind a shoulder of rock — the river used to run through it and got bored.",
                actions: [{ type: 'unlock', target: 'side-channel' }],
              },
            ],
            performance: [
              "Limestone three hundred metres high. Every sound she makes comes back changed. Six hundred years of people refused to be moved out of this and not one of them wrote down why.",
              "About two hundred metres back, the wall folds. Somebody found this fold before her. Somebody always finds the fold.",
            ],
            exhausted: "There is nothing wrong with the river except that it will not stop long enough for anything else to be true.",
            onComplete: {
              flag: 'foundSideChannel',
              unlock: 'side-channel',
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The gravel bank",
      x: 28, y: 70, w: 38, h: 24,
      text: "She sat down on the gravel where the river went quiet and let the canyon get on with whatever it was doing.",
    },
      ladder: [
        "The roar fills everything. There is nothing to hear but roaring.",
        "She stood in the middle of the path with her hands over her ears and felt, for the first time since Tuesday, properly stupid.",
      ],
      afterMax: "The river will not shut up. She needs to find somewhere quieter.",
    },
  },

  'side-channel': {
    name: 'The Side Channel',
    art: '08-side-channel.jpg',
    ambient: { type: 'cave', volume: 0.04 , presence: 'river' },
    chapter: 1,
    onEnter: {
      first: "The moment she stepped into it, the world went quiet. Not silent. But the roar was outside now — behind her, on the other side of a corner, reduced to a background hush like a motorway heard from a bedroom. In here there was cool air and white stones and a smell of wet rock, and a space about the shape and size of a cathedral with the roof taken off.",
      return: "Same stones. Same shade. She sits down like somebody resuming an argument.",
    },
    exits: {
      back: { to: 'canyon', label: 'Back to the canyon' },
    },
    hotspots: [
      {
        id: 'white-stones', label: 'The stones', x: 12, y: 64, w: 30, h: 26,
        verbs: {
          look: {
            ladder: [
              "White stones, all of them rounded, all of them dry. Water did this, and then went somewhere else.",
              "They are graded. Big ones at the back, small ones at the front, sorted as carefully as a shop display, by a river that has not been here in a very long time.",
            ],
            exhausted: [
              "Sorted stones. A river's filing system.",
              "She keeps looking at them and they keep being extremely dry.",
            ],
          },
        },
      },
      {
        id: 'the-corner', label: 'The corner', x: 56, y: 30, w: 28, h: 34,
        verbs: {
          look: {
            ladder: [
              "The corner she came round. The roar is on the other side of it, and it is astonishing how much rock takes out of a sound.",
              {
                text: "Which is the thing, isn't it. The river is not quieter in here. The river is exactly as loud as it has ever been.\n\nShe is just standing somewhere it cannot reach.",
                flag: 'understoodQuiet',
                notebook: {
                  section: 'weirdThings',
                  entry: {
                    id: 'wt45',
                    text: "#45. You do not turn anything down. You go and stand where it isn't. This seems obvious written down and took me an hour.",
                  },
                },
              },
            ],
            exhausted: [
              "A corner. Doing more work than most corners.",
            ],
          },
        },
      },
    ],
    wait: {
      quietedBy: ['understoodRelief', 'understoodQuiet'],
      needsQuiet: 0.62,
      noiseFromQuestions: [
        "Nothing yet. The canyon round the corner, a long way off, and her own head still going.",
        "Almost nothing. But not nothing enough.",
      ],
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The dry channel",
      x: 30, y: 62, w: 38, h: 30,
      text: "She sat down in the dry channel, out of the wind, where nobody in the world knew she was.",
    },
      gate: 'sentToOmis',
      gateText: "She sits. Nothing happens. Maybe Dida needs to tell her where to go first.",
      ladder: [
        "Nothing happens.",
        "Still nothing. Her brain supplies, in order: this is stupid, what if a snake, what's for dinner, you look like an idiot, Duje is watching.",
        "She lets all of that go past, which is harder than it sounds and takes about four minutes.",
        "The roar is outside now, round a corner, like a motorway heard from a bedroom.",
        "A lizard comes onto a stone, decides she is furniture, and stays.",
        "Somewhere high above, a bird moves and dislodges a small stone.",
        "The stone hits another stone, and the sound goes up between the walls, and takes a very long time to come back down.",
        {
          text: "And does not entirely come back. Something stays up there, holding the note, refusing to come down with the rest of it.",
          delay: 1800,
          vision: 'V2',
          sound: { voice: 'river', fadeIn: 4 },
        },
      ],
      afterMax: "The note holds. And holds. It has no intention of stopping.",
      onComplete: {
        flag: 'heardRiver',
        notebook: {
          section: 'weirdThings',
          entry: { id: 'wt44', text: '#44. The canyon SANG. I heard it. Duje did not. An echo went up and simply refused to come down. I stood in six inches of freezing water and started laughing.' },
        },
      },
    },
  },

  'omis-square': {
    name: 'The Square at Dusk',
    art: '09-omis-square.jpg',
    ambient: { type: 'wind', volume: 0.04 , presence: 'river' },
    chapter: 1,
    onEnter: {
      first: "At about eight, when the heat finally let go of the stone and the town started coming outside, eight men walked into the middle of the square in no particular hurry, stood in a loose half-circle facing slightly inward, and stopped talking.",
      return: "The square. The fountain. The evening.",
    },
    exits: {
      right: { to: 'omis-above', label: 'Up to the fortress' },
      left: {
        to: 'kitchen', label: 'Bus back to Split',
        gates: ['heardRiver', 'tonkoWisdom'],
        gateText: "Not yet. There is something in this square she has not finished with.",
        // One line for two locks in two different places sent players back to
        // re-poke the square when what was missing was up the canyon.
        gateTextBy: {
          heardRiver: "Not yet. She came out of that dry channel above the river too early and she knows it — she just stood there being a person standing in a channel.",
          tonkoWisdom: "Not yet. The old man by the fountain got as far as the small talk and stopped, and she has not worked out what he is waiting for.",
        },
      },
    },
    hotspots: [
      {
        id: 'river-wall', label: 'The tables by the wall', x: 70, y: 66, w: 26, h: 28,
        verbs: {
          look: {
            ladder: [
              "Something came out of that boot and he hasn't noticed. A flat brass disc, worn smooth, with a hole in it.",
              {
                text: "Not a coin. A guitar pick — a plectrum for something older. Somebody wore this out over forty years.\n\nDuje got there first, picked it up, and put it in her hand without a word, which for Duje counted as a speech.",
                addItem: 'plectrum',
                plate: 'plectrum',
              },
            ],
            exhausted: "The wall. The river going under it. A warm patch where the boot was.",
          },
        },
      },
      {
        id: 'tonko', label: 'The old singer', x: 63, y: 50, w: 9, h: 36,
        verbs: {
          give: {
            requires: 'plectrum',
            noItemText: "She has nothing of his.",
            text: "She held it out. Tonko stopped talking, took it, and turned it over twice.\n\nHe did not thank her. He put it in his shirt pocket, and then he looked at her properly for the first time — the filing-system look, but with something filed under her now.\n\n\"Right,\" he said. \"Ask me again.\"",
            flag: 'returnedPlectrum',
            consumeItem: true,
            doneText: "It is in his shirt pocket. He keeps touching the outside of the pocket with two fingers, the way you check a thing is still there.",
          },
          talk: {
            ladder: [
              '"You\'re Ante\'s granddaughter," he said. Not a question. "The one with the cats."\n\n"That was last summer."\n\n"It\'s a small country."',
              {
                text: '"You don\'t learn it. You stand next to someone who knows it and you shut up for a year." He got the boot off and examined it with suspicion. "Then you sing wrong for a year. Then it\'s fine."\n\n"That\'s two years."\n\n"It\'s a very old song. It can wait two years."',
                gate: 'returnedPlectrum',
                gateText: [
                  'He does the small-talk and stops. Something is missing.',
                  'He waits. He is not going to fill the gap for her, and he has had sixty years of practice at not filling gaps.',
                  'He shifts his foot, the one with the boot off, and looks at the ground beside it, and looks away again.',
                  'Nothing. He has gone back to the boot. Whatever came out of it, he has not noticed it is gone, and she has.',
                ],
              },
              '"The thing everybody gets wrong — they practise their own part. Sit at home, learn the notes, come back perfect. And it sounds like four people shouting in a bucket." He shook the boot out. Something fell out of it. Neither of them acknowledged this. "You don\'t sing your part. You sing the space between your part and theirs. That\'s the whole job. Took me thirty years."\n\n"What if you can\'t hear the space?"\n\n"Then you\'re not listening, you\'re waiting for your turn," said Tonko. "Those are different."',
            ],
            exhausted: '"How is your grandfather?"\n\n"He\'s in an incredibly good mood."\n\n"Ha," said Tonko. "About time."',
            onComplete: {
              flag: 'tonkoWisdom',
              notebook: {
                section: 'noticed',
                entry: { id: 'n1', text: '"You don\'t sing your part. You sing the space between your part and theirs." — Tonko' },
              },
              completeAt: 3,
            },
          },
          look: {
            ladder: [
              "Very old. Very wide. Looking at her the way people look at a name they are almost sure they know.",
            ],
            exhausted: "Tonko. Boot off. Not going anywhere.",
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "A chair at the back",
      x: 16, y: 66, w: 24, h: 26,
      text: "She took a chair at the back of the square, behind everybody, and let the singing happen at her.",
    },
      ladder: [
        "Then, with no warning, no count, and nothing to give them a note, they sang.",
        "The chord opened out. It got wider. It went somewhere she wasn't expecting and then it resolved, and about forty people in the square made a small noise at the same time.",
        "One old woman by the fountain said something under her breath that was probably a swear word and was definitely a compliment.",
      ],
      afterMax: "The square holds the last note of the evening.",
    },
  },

  // =============================================
  // CHAPTER 2 — BRAČ
  // =============================================

  'ferry-deck': {
    name: 'The Ferry',
    art: '10-ferry-deck.jpg',
    ambient: { type: 'waves', volume: 0.06 , presence: 'sea' },
    chapter: 2,
    onEnter: {
      first: "There are three things you can do on the Split–Supetar ferry. You can stand at the front and get salt in your face. You can buy a coffee from a machine that has views about coffee. Or you can sit on the metal bench on the top deck and watch the town go backwards.",
      return: "The ferry. The bench. The sea between.",
    },
    exits: {
      forward: { to: 'pucisca', label: 'Arrive at Pučišća' },
    },
    hotspots: [
      {
        id: 'the-wake', label: 'The wake', x: 34, y: 60, w: 34, h: 26,
        verbs: {
          look: {
            ladder: [
              "The wake goes out behind the boat in a long flat V, and the water in the channel is a different blue from the water at Kašjuni — the blue that means there is a very long way down.",
              "Out here in the middle there is more sea than anywhere, so it ought to be louder. Instead it is thinner. Further off. She works it out about a mile short of Supetar, and it is not a comfortable thought: she is not above him any more.\n\nShe is between.",
            ],
            exhausted: "Flat blue, a long way down, and the note gone thin and far off, like a room two doors away.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt46', text: '#46. Middle of the channel — the big one goes THIN. Not quieter. Thinner. Like walking to the edge of somebody. So they have edges, which means they have PLACES, and I have been treating them like weather.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The stern rail",
      x: 32, y: 58, w: 36, h: 30,
      text: "She stayed at the rail at the back and watched the wake go flat, which takes longer than anyone expects.",
    },
      ladder: [
        "Split does a thing when you leave it by sea: the buildings fold themselves flat against the mountain and the whole city becomes one white line under one grey ridge.",
        '"Are you nervous," said Duje.\n\n"No."\n\n"You\'re doing the thing with your thumb."',
        '"What if it doesn\'t happen again," she said.\n\nDuje considered this at length.\n\n"Then you heard something amazing twice," he said, "which is twice more than me."',
      ],
      afterMax: "The engine hums. The island gets closer.",
    },
  },

  'pucisca': {
    name: 'Pučišća',
    art: '11-pucisca.jpg',
    ambient: { type: 'waves', volume: 0.05 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "The whole town is made of the same white limestone as everything else on the island, only here they never bothered to make it look old. A bay shaped like a horseshoe that is so bright you have to look at the water instead.",
      return: "The quay. The white town. The sound of hammering up the hill.",
    },
    exits: {
      up: {
        label: 'The stonemasonry school',
        // The empty workshop used to be reachable ONLY by the one-time auto-walk
        // out of the loud one. A player who left it before the stone rang could
        // never get back in — and the ferry home requires stoneRang, so the
        // island sealed with the game unfinishable. The hill now remembers
        // which room is up there.
        route: [
          { done: 'workshopEmptied', to: 'workshop-busy', label: 'The stonemasonry school' },
          { gate: 'workshopEmptied', to: 'workshop-empty', label: 'The empty workshop' },
        ],
      },
      right: { to: 'quarry', label: 'Up to the quarry' },
      back: {
        to: 'kitchen', label: 'The ferry home',
        gates: ['gotPebble', 'stoneRang', 'foundNotebook'],
        gateText: "Not yet. The island is not done with her.",
        gateTextBy: {
          gotPebble: "Not yet. There is a seven-year-old on this quay holding something in his fist and doing an extremely casual impression of a person, and she has not called his bluff.",
          stoneRang: "Not yet. That workshop up the hill goes quiet at some point in the day, and she has not been standing in it when it does.",
          foundNotebook: "Not yet. There is a door past the ravine she has not been on the other side of.",
        },
      },
    },
    hotspots: [
      {
        id: 'boy', label: 'At her elbow', x: 4, y: 62, w: 22, h: 34,
        verbs: {
          look: {
            ladder: [
              "He is holding something in a closed fist and looking at the water like a person doing an extremely casual impression of a person.",
              "He is about seven. He has positioned himself exactly at her elbow and is waiting to be noticed, and he is not going to say so.",
            ],
            exhausted: "Still holding it. Still not saying so.",
          },
          talk: {
            ladder: [
              {
                text: "\"Hi,\" said Mira.\n\nThe boy startled like a bird, closed his fist tighter, and walked off down the quay at the speed of someone who has decided not to run.",
                flag: 'boyGone',
              },
            ],
            exhausted: "He is a long way down the quay, behind a bollard, being extremely casual about a boat.",
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The quay edge",
      x: 36, y: 70, w: 34, h: 24,
      text: "She sat down on the edge of the quay with her feet over the water and stopped being in a hurry.",
    },
      ladder: [
        "Somewhere up the hill, someone was hitting stone with a hammer. And someone else was too, at a different speed.",
        {
          gateNot: 'boyGone',
          gateNotText: "It took him about four minutes to come back, which he did the long way, via a bollard and a coil of rope and a great deal of not looking at her.\n\nHe stood at her elbow again. Slightly further away than before.",
          text: "He shifts his feet. He does not go away.",
        },
        {
          text: "Then he held it out — a flat grey pebble with a hole worn clean through the middle of it.\n\n\"Look through the hole,\" he said, in careful practised English, saved up and spent on a stranger. \"Everything gets simpler.\"\n\nAnd he ran.",
          delay: 1200,
        },
      ],
      afterMax: [
        "The harbour holds its brightness.",
        "A ferry goes out. The water flattens behind it, then forgets.",
        "Somewhere up the hill, the hammering starts again at a different speed.",
      ],
      onComplete: {
        flag: 'gotPebble',
        addItem: 'pebble',
        plate: 'pebble',
        notebook: {
          section: 'weirdThings',
          entry: { id: 'wt47', text: '#47. A boy gave me a stone with a hole in it and told me everything gets simpler and then RAN. I did not ask him for it. That seems to be the rule.' },
        },
      },
    },
  },

  'workshop-busy': {
    name: 'The Workshop',
    art: '12-workshop-busy.jpg',
    ambient: { type: 'workshop', volume: 0.12 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "A long room open at one end with a view of the sea, and the floor was three inches deep in white dust. About nine students, all wearing goggles, and every single one of them was making a noise. It was the loudest peaceful room she had ever been in.",
      return: "The workshop. Still loud.",
    },
    exits: {
      back: { to: 'pucisca', label: 'Back to the harbour' },
    },
    hotspots: [
      {
        id: 'radio', label: 'The shelf', x: 15, y: 17, w: 14, h: 14,
        verbs: {
          look: {
            ladder: [
              "Tuned to something that does the pips on the hour. Nobody in here is listening to it. Everybody in here is listening to it.",
            ],
            exhausted: "The radio. Doing the pips.",
            onComplete: { flag: 'clue_radio' },
          },
        },
      },
      {
        id: 'student', label: 'A student', x: 22, y: 32, w: 16, h: 38,
        verbs: {
          talk: {
            text: '"We stop when the radio does the beeps. Then we eat. Then we come back. Every day, four years."',
            flag: 'clue_student',
          },
          look: {
            ladder: [
              "Goggles, apron, hammer going ninety times a minute. Never looks at the hammer. Not once.",
            ],
            exhausted: "Hitting stone. Not looking.",
          },
        },
      },
      {
        id: 'masters-bench', label: "The master's bench", x: 76, y: 14, w: 20, h: 18,
        verbs: {
          look: {
            ladder: [
              "A sandwich, wrapped, waiting. Half past eleven.",
            ],
            exhausted: "The sandwich. Waiting.",
            onComplete: { flag: 'clue_sandwich' },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The back wall",
      x: 44, y: 56, w: 26, h: 34,
      text: "She stood against the back wall out of everybody's way and waited to see what a room like this does on its own.",
    },
      requireAny: {
        flags: ['clue_radio', 'clue_student', 'clue_sandwich'],
        count: 2,
        text: "You cannot wait a loud room quiet. It has to empty on its own — and she doesn't yet know when that is.",
      },
      ladder: [
        {
          text: "So she stopped trying to outlast the room and simply waited for half past eleven.\n\nThe pips went.\n\nAnd the room emptied in ninety seconds — goggles up, aprons off, nine people going past her without a word because it was lunch and lunch is lunch.",
          delay: 1400,
        },
      ],
      afterMax: "The room is empty. The dust is still coming down.",
      onComplete: {
        flag: 'workshopEmptied',
        goTo: 'workshop-empty',
        goToDelay: 4200,
      },
    },
  },

  'workshop-empty': {
    name: 'The Empty Workshop',
    art: '13-workshop-empty.jpg',
    ambient: { type: 'silence', volume: 0.02 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "The pips went. The room emptied in ninety seconds. And the dust hung in the light.",
      return: "The empty workshop. The dust. The silence.",
    },
    exits: {
      back: { to: 'pucisca', label: 'Back to the harbour' },
    },
    hotspots: [
      {
        id: 'chisel', label: 'The chisel', x: 8, y: 58, w: 24, h: 18,
        verbs: {
          look: {
            ladder: [
              "A block on the nearest bench with a chisel lying on top of it. No hammer anywhere.",
              {
                text: "She picked up the chisel. It was much heavier than it looked, and warm from the last hand that had held it. She put the tip against the block and hit the end with the flat of her hand, hard, once.\n\nIt hurt.\n\nAnd the stone rang. Not a clunk. A bell — a high, clear, enormous bell, going off inside a block of marble the size of a suitcase. And it did not stop.",
                vision: 'V3',
                sound: { voice: 'stone', fadeIn: 0.01 },
              },
            ],
            performance: [
              "A block on the nearest bench, a chisel on top of it, and no hammer anywhere. The hand is the hammer. Somebody had to find that out the same stupid way.",
              "She hit the chisel with the flat of her hand, hard, once, and the stone rang like a bell and did not stop. Ana Novak got three. This is the third.",
            ],
            exhausted: "The chisel. The block. The note that will not stop.",
            onComplete: {
              flag: 'stoneRang',
              notebook: {
                section: 'weirdThings',
                entry: { id: 'wt50', text: '#50. Hit a chisel with my bare hand like an IDIOT and the whole block sang like a bell and DID NOT STOP. My hand hurts. Worth it.' },
              },
            },
          },
        },
      },
    ],
    wait: {
      // Two men told her when this room goes quiet without either of them
      // meaning to. That is the whole puzzle, and until now it was inert.
      quietedBy: ['clue_radio', 'clue_student'],
      needsQuiet: 0.9,
      noiseText: "Dust, and her own pulse, and a room she does not know the timetable of. The radio man said something about when it goes quiet in here. So did the boy with the broom. Neither of them was telling her anything; they were just talking about their day.",
      noiseFromQuestions: [
        "Dust coming down through the light, and her own pulse, and a room she does not yet understand the timetable of.",
        "Nothing. She is in the right room and she still does not know what she is waiting for it to do.",
      ],
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The doorway light",
      x: 38, y: 54, w: 26, h: 34,
      text: "She stayed in the doorway where the dust was coming down through the light and didn't touch anything.",
    },
      ladder: [
        "The dust settles. The silence is the loudest thing she has ever heard.",
      ],
      afterMax: "Empty room. Empty benches. The sea through the open end.",
    },
  },

  'quarry': {
    name: 'The Quarry',
    art: '14-quarry.jpg',
    ambient: { type: 'wind', volume: 0.05 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "Enormous white steps cut into the side of a mountain, each one twice as tall as a person. The cut faces were smooth. You could see the tool marks. They took the palace out of here.",
      return: "The quarry. Still enormous. Still white.",
    },
    exits: {
      back: { to: 'pucisca', label: 'Back to the harbour' },
      right: { to: 'blaca-ravine', label: 'To the ravine' },
    },
    hotspots: [
      {
        id: 'quarry-face', label: 'The quarry face', x: 20, y: 10, w: 60, h: 80,
        verbs: {
          look: {
            ladder: [
              "She put her hand flat on the quarry face. It was hot on the surface and cold about a centimetre in. There was something. Not a sound. A pressure, maybe — the feeling you get standing next to a very large speaker before the music starts. And then nothing.",
              "Not here. She doesn't know how she knows that, and she is completely certain.",
            ],
            performance: [
              "Hot on the surface, cold a centimetre in. A pressure, like standing beside a very large speaker before the music starts. And then nothing, and the nothing is information.",
              "Not here. She knows how she knows now, which is worse, because it means the knowing is inherited.",
            ],
            exhausted: "Not here. The quarry said no and it meant it.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt47', text: '#47. Brač quarry, hand flat on the cut face. The stone one is NOT in the quarry, and I am certain of that in a way I could not defend to a single adult. Wrong stone, or the wrong kind of quiet. Somewhere on this island it is being hit properly.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The cut face",
      settleWith: "quarry-face",
      x: 30, y: 58, w: 40, h: 30,
      text: "She put her palm flat on the cut face of the stone and kept it there, listening with her hand.",
    },
      ladder: [
        "The stone holds the heat. The sea is very far below.",
      ],
      afterMax: "The quarry is patient. It has been patient for two thousand years.",
    },
  },

  'blaca-ravine': {
    name: 'Blaca',
    art: '15-blaca-ravine.jpg',
    ambient: { type: 'wind', volume: 0.04 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "The ravine took forty-five minutes and every stone in it moved. Now there is a monastery built into a cliff, a door propped open with a rock, and a bench that has been polished shiny in the middle by four hundred years of people sitting in exactly the same spot.",
      return: "The bench. Again.",
    },
    exits: {
      back: { to: 'quarry', label: 'Back up the ravine' },
      forward: { to: 'clock-room', label: 'Inside', gate: 'custodianReturned', gateText: 'The door is shut. It is going to stay shut for as long as it likes.' },
    },
    hotspots: [],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "Outside the door",
      x: 46, y: 62, w: 26, h: 26,
      text: "She sat down outside the closed door with her back against the warm stone, and decided she was prepared to be there a while.",
    },
      ladder: [
        "Nothing happens.",
        "Still nothing.",
        "The bench is warm. That's something.",
        "A swift lands on the gutter, considers her, and leaves.",
        "She has now been sitting here longer than she has ever deliberately sat anywhere, and there is nobody to tell.",
        {
          text: "The ravine gives back the heat it took all day. The door stays closed. It is going to stay closed for exactly as long as it likes.",
          delay: 1200,
        },
      ],
      afterMax: "The bench. The ravine. The shut door.",
      onComplete: {
        flag: 'custodianReturned',
        addItem: 'clockKey',
        plate: 'key',
        message: "The door opens. He looks at her, makes a sound that is not quite a laugh, and holds out a brass winding key. He does not smile. He just holds it out, and does not take it back when she hesitates.",
        notebook: {
          section: 'weirdThings',
          entry: { id: 'wt52', text: '#52. Sat on a bench for longer than I have ever deliberately sat anywhere and a door opened and a man gave me a key without saying one word about it.' },
        },
      },
    },
  },

  'clock-room': {
    name: 'The Clock Room',
    art: '16-clock-room.jpg',
    ambient: { type: 'silence', volume: 0.01 , presence: 'stone' },
    chapter: 2,
    onEnter: {
      first: "Dozens of clocks. Wooden ones, brass ones, one enormous one with a painted face. All stopped. All stopped at different times, because they had been set to different cities, in a stone room, at the bottom of a ravine, on an island, by a man who wanted to know what time it was in Greenwich.",
      return: "The clocks. All stopped. All at different times.",
    },
    exits: {
      back: { to: 'blaca-ravine', label: 'Outside' },
    },
    hotspots: [
      {
        id: 'painted-clock', label: 'The painted-face clock', x: 55, y: 20, w: 22, h: 42,
        verbs: {
          look: {
            ladder: [
              "The big one with the painted face — a blue and gold sun surrounded by Roman numerals and small flowers that someone painted by hand in a room with no electricity.",
              "The brass ones take a square key. The wooden ones take a crank. The big one with the painted face takes something worn smooth by one hand doing one job for forty years.",
            ],
            performance: [
              "A blue and gold sun surrounded by Roman numerals and small flowers, painted by hand in a room with no electricity by a man who wrote about a ringing that would not stop.",
              "Everyone assumed he meant the stars. He did not mean the stars. He kept a notebook in the drawer underneath and he did not mean the stars.",
            ],
            exhausted: "The painted-face clock. Waiting for a key it knows.",
          },
          give: {
            requires: 'clockKey',
            noItemText: "She has nothing that fits.",
            text: "She winds it. It ticks. One tick, in a room that has been silent since 1963, and the vibration walks a drawer open half an inch.\n\nInside: a notebook. Old, leather-bound, the pages soft with use.",
            flag: 'foundNotebook',
            consumeItem: true,
            doneText: "The clock is ticking. The drawer is shut again, because it was not hers, and because it was.",
            plate: 'drawer',
            actions: [{ type: 'reader', id: 'notebook', delay: 6500 }],
            notebook: {
              section: 'weirdThings',
              entry: { id: 'wt53', text: '#53. There is a notebook. Names and marks going back further than I can read. Ana Novak, 1961. And then me, this summer, in fresh pencil, in NONA\'S handwriting.' },
            },
          },
        },
      },
    ],
    // P14 · the silence. Unskippable, once, on the way out. The last beat
    // is an empty box for three full seconds. It stays empty.
    onExit: {
      once: 'sawSilence',
      setOnComplete: true,
      beats: [
        { text: "She put the notebook back in the drawer and pushed it shut, because it was not hers, and because it was.\n\nOutside, the custodian was sitting on the bench in the last of the light.\n\n\"Don't tell anyone,\" he said. \"Please.\"", hold: 6500 },
        { text: "", hold: 3000 },
      ],
    },
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The floor",
      x: 34, y: 66, w: 34, h: 26,
      text: "She sat down on the floor among the stopped clocks, which is not a thing she would have done in June.",
    },
      ladder: [
        "The silence of a room that has been silent since 1963 is different from ordinary silence. It has had time to settle.",
      ],
      afterMax: [
        "The clocks. The silence. 1963.",
        "Dust comes down through the light. Nothing ticks.",
        "Sixty-one years of a room not being wound.",
      ],
    },
  },

  // =============================================
  // CHAPTER 3 — KORČULA
  // =============================================

  'korcula-street': {
    name: 'Korčula',
    art: '17-korcula-street.jpg',
    ambient: { type: 'wind', volume: 0.05 , presence: 'sea' },
    chapter: 3,
    onEnter: {
      first: "Korčula is built like a fish. There is a spine, which is the main street, and there are ribs, which are all the other streets. The streets on the west are curved. The streets on the east are straight. This is not an accident.",
      return: "The street. The stone. The sea at the end of it.",
    },
    exits: {
      forward: { to: 'cave-path', label: 'The coastal path' },
      back: { to: 'kitchen', label: 'The catamaran home', gate: 'heardAll', gateText: "There is a cave on the far end of this island she has not been into yet." },
    },
    hotspots: [
      {
        id: 'street', label: 'The street', x: 20, y: 10, w: 60, h: 80,
        verbs: {
          look: {
            ladder: [
              "Every street on the west side is angled to catch the summer wind. Every street on the east is angled to break the winter one.",
              "This town is a wind instrument and somebody built it that way on purpose and did not sign it.",
            ],
            performance: [
              "West side curved to catch the summer wind, east side straight to break the winter one. Somebody built a town to be played and then did not sign it.",
              "This town is a wind instrument. She is standing inside an instrument. Nobody who built it wrote down that they knew, either.",
            ],
            exhausted: "A machine for wind. Six hundred years old.",
          },
        },
      },
    ],
    wait: {
      // The one place in the game that is not about her at all: the wind is
      // simply not up yet. First visit can reach 0.72 at best, so this forces
      // exactly one leave-and-return — the mechanic the workshop proved.
      needsQuiet: 0.78,
      noiseText: "Hot stone, a shutter banging somewhere, and no wind at all. The street is holding its breath and it is not doing it for her benefit.",
      noiseFromQuestions: [
        "Nothing moving. Not a breath of it. Whatever this street does, it is not doing it at this hour.",
      ],
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The shady side",
      settleWith: "street",
      x: 12, y: 56, w: 24, h: 34,
      text: "She stood in the shade on the west side of the street and waited for the afternoon to do its trick.",
    },
      gate: 'stoneRang',
      gateText: "She waits in the shade. The street does nothing at all, and she has no idea yet what she is waiting for.",
      ladder: [
        "The maestral hasn't arrived yet. It comes in every afternoon.",
        "She waits in the shade.",
        {
          text: "And then it arrives — the summer wind, straight down the street, the whole town humming with it like a pipe.",
          sound: { voice: 'sea', fadeIn: 6 },
          flag: 'heardSea',
          notebook: {
            section: 'weirdThings',
            entry: {
              id: 'wt56',
              text: "#56. The fourth one is WIND. The whole town is the instrument. You cannot hear it until the maestral turns up, which it does at the same time every afternoon like a person with a job.",
            },
          },
        },
      ],
      afterMax: "The wind moves through the town like a song through an instrument.",
    },
  },

  'cave-path': {
    name: 'The Coastal Path',
    art: '18-cave-path.jpg',
    ambient: { type: 'wind', volume: 0.06 , presence: 'sea' },
    chapter: 3,
    onEnter: {
      first: "The path goes up along the coast. Below, the sea. Above, scrub and rock and the occasional sound of something small moving fast.",
      return: "The path. The cave above.",
    },
    exits: {
      back: { to: 'korcula-street', label: 'Back to the town' },
      up: { to: 'cave-mouth', label: 'Up to the cave' },
    },
    hotspots: [
      {
        id: 'the-hill', label: 'The hillside ahead', x: 44, y: 26, w: 30, h: 38,
        verbs: {
          look: {
            ladder: [
              "Scrub, rock, the sea a long way down on the left, and the smell of hot stone that is the smell of every summer she can remember.",
              "The hill is breathing out. There is air coming up out of the ground somewhere ahead of her, several degrees colder than the air she is standing in, and it is carrying something she can very nearly hear.",
            ],
            exhausted: "Cold air coming out of a hot hillside, which is either geology or an invitation.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt48', text: '#48. Cold air coming OUT of the hill on the Korčula path, and something in it. Whatever is in that cave, the hill is letting it out through the roof.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The rock ledge",
      x: 32, y: 64, w: 34, h: 26,
      text: "She sat on the ledge above the water and let the path wait for her instead of the other way round.",
    },
      ladder: [
        "The cicadas stop when she stops. They start again three seconds later.",
        "She tests it eleven times on the way up. It works eleven times.",
      ],
      afterMax: "The path. The cicadas. The sea below.",
    },
  },

  'cave-mouth': {
    name: 'Vela Spila',
    art: '19-cave-mouth.jpg',
    ambient: { type: 'cave', volume: 0.04 , presence: 'sea' },
    chapter: 3,
    onEnter: {
      first: "It is not a cave like a corridor. It is a cave like a hall. The roof is high and curved and there are two round holes in it, and through the holes come two shafts of white light that land on the floor in two circles. Twenty thousand years of people.",
      return: "The cave. The light. The twenty thousand years.",
    },
    exits: {
      back: { to: 'cave-path', label: 'Back down the path' },
      forward: { to: 'cave-deep', label: 'Deeper into the dark' },
    },
    hotspots: [
      {
        id: 'the-holes', label: 'The holes in the roof', x: 36, y: 14, w: 32, h: 30,
        verbs: {
          look: {
            ladder: [
              "Two round holes in the roof, and two columns of light standing on the cave floor underneath them like something you are not supposed to walk through.",
              "She clapped once, to be a scientist about it.\n\nThe sound went away from her, and came back later than it had any right to, and it came back CHANGED — rounder, and lower, and not entirely hers any more.",
            ],
            exhausted: "Two columns of light, and a room that hands sound back to you lower than you sent it.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt49', text: '#49. Clapped in the cave mouth. It gave it back LOWER than I sent it. This room does something to sound. That is not a feeling, that is an experiment, and it worked.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The cave mouth",
      x: 36, y: 50, w: 28, h: 36,
      text: "She sat just inside the mouth of the cave, where the light stopped, and stayed put.",
    },
      ladder: [
        "The light moves. Not while she watches it. Only when she looks away and back, and then it has gone somewhere else.",
      ],
      afterMax: "The cave holds its twenty thousand years.",
    },
  },

  'cave-deep': {
    name: 'The Dark',
    art: '20-cave-deep.jpg',
    ambient: { type: 'cave', volume: 0.03 , presence: 'sea' },
    chapter: 3,
    onEnter: {
      first: "She went deeper. The light was behind her, and then it wasn't. There is nothing in here to look at, which she establishes by trying, twice. There is only the option to stop.",
      return: "The dark. Again.",
    },
    exits: {
      back: { to: 'cave-mouth', label: 'Back toward the light' },
    },
    hotspots: [
      {
        // Invisible until she has been still enough for her eyes to adjust.
        // The room does not change. What she can see in it does.
        id: 'wall', label: 'The wall', showWhen: 'eyesAdjusted',
        x: 8, y: 22, w: 40, h: 46,
        verbs: {
          look: {
            ladder: [
              "There is a wall there. There has been a wall there the whole time.",
              "Hands.\n\nDozens of them, blown in ochre onto the rock — someone held a palm flat and sprayed pigment from their mouth around it, and took the hand away, and left a hole in the colour exactly the shape of a person.",
              {
                text: "They are in pairs.\n\nThat is the thing she cannot stop looking at. Not scattered. Not a crowd. Pairs — a big hand and a small hand, side by side, at the height where somebody standing would be, and somebody sitting would be.\n\nOver and over. Down the whole wall. For as far as the dark goes.",
                flag: 'sawTheChain',
                notebook: {
                  section: 'weirdThings',
                  entry: {
                    id: 'wt55b',
                    text: "#55b. The wall is pairs of hands. A big one and a small one, every time, for twenty thousand years. Nobody ever came here alone. Somebody always brought somebody.",
                  },
                },
              },
              {
                text: "The most recent pair is not very old at all.\n\nThe pigment is brighter. The small hand is about the size of hers was two summers ago, and the big one has a crooked little finger that did not set straight, because it was broken once, in a workshop, by a block that moved.\n\nShe has held that hand crossing every road in Split.",
                flag: 'sawDidasHand',
                notebook: {
                  section: 'didaSays',
                  entry: {
                    id: 'ds12',
                    text: "He never said he came here. He said his mother brought him somewhere once and he didn't want to talk about it. He was eleven. He put his hand on the wall next to hers.",
                  },
                },
              },
            ],
            exhausted: [
              "Pairs of hands, going back into the dark further than the light reaches.",
              "The bright one. The crooked finger.",
            ],
          },
        },
      },
    ],
    wait: {
      // The hardest quiet in the game, and every voice she has already found
      // is part of what buys it. The cave asks for all of her.
      quietedBy: ['heardForest', 'heardRiver', 'stoneRang', 'heardSea', 'sawTheChain'],
      needsQuiet: 0.74,
      noiseFromQuestions: [
        // Once her eyes have adjusted there IS something here, and her own
        // curiosity about it is now the loudest thing in the room. The clue is
        // that she has started wondering about something she can see.
        "Nothing. And she cannot concentrate on nothing, because there is a shape on the rock to her left that was not there when she came in, and her whole head has gone to it.",
      ],
      noiseText: "Dark. Dripping. Her own heart. She is not ready for this room yet, and the room does not care either way.",
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The dark",
      x: 32, y: 44, w: 36, h: 40,
      text: "She sat down in the dark with her back against the rock and gave the cave as long as it needed.",
    },
      ladder: [
        "The first two minutes are fine, because settling feels like doing something.",
        "Minutes three to seven are unbearable.",
        {
          text: "Her brain generates: a song she hates, the exact wording of something embarrassing she said in March, and a strong conviction that there is a spider.\n\nAnd because she has stopped moving for longer than she has ever stopped moving, her eyes give up waiting for light to arrive and start working with what is actually there.",
          flag: 'eyesAdjusted',
        },
        "At about nine minutes she gets a cramp, and moves, and feels like she has failed, and starts again.",
        "Past twelve minutes something changes, and it isn't the cave.",
        "The dripping resolves. There are three drips — one fast, one slow, one very slow — and every so often they land together, and then go out of step. It has been a rhythm the entire time. She simply wasn't.",
        "The wind through the roof holes stops being a hiss and finds a pitch.",
        {
          text: "There is no moment. It's like watching the sky get dark.",
          delay: 1800,
          vision: 'V4',
          sound: { voice: 'all', fadeIn: 8 },
        },
      ],
      afterMax: "All four. Together. For as long as she stays.",
      // Eight beats of one unbroken twelve-minute stretch of sitting still. Made
      // her re-arm the verb between every one of them, at the climax of the
      // game — the exact interruption `continuous` exists to prevent. The chain
      // breaks itself the moment the room refuses her (when her eyes adjust and
      // the wall arrives), which is when she is supposed to get up and look.
      continuous: true,
      onComplete: {
        flag: 'heardAll',
        notebook: {
          section: 'weirdThings',
          entry: { id: 'wt55', text: '#55. All four. Together. In a cave. In the dark. I sat there for I don\'t know how long. I have nothing to write about this and I am writing about it anyway.' },
        },
      },
    },
  },

  // =============================================
  // CHAPTER 4 — HOME
  // =============================================

  'kasjuni-dawn': {
    name: 'Kašjuni, Dawn',
    art: '21-kasjuni-dawn.jpg',
    ambient: { type: 'waves', volume: 0.05 , presence: 'forest' },
    chapter: 4,
    onEnter: {
      first: "Gold light, empty beach. And the four voices faintly present above the water for the first time.",
      return: "Dawn. The beach. The voices above the water.",
    },
    exits: {
      down: { to: 'underwater-finale', label: 'Swim out' },
    },
    hotspots: [
      {
        id: 'the-flat-water', label: 'The water', x: 32, y: 56, w: 38, h: 26,
        verbs: {
          look: {
            ladder: [
              "Before six. The sea is flat enough to be a floor, the light is coming in sideways and gold, and there is nobody on this beach at all.",
              "All four of them. Above the water, not under it — faint as breath on glass, and holding.\n\nThey are not waiting for her. They have never once been waiting for her. But there is a space in it, exactly the shape of the one the carver cut, and it has been open the whole time.",
            ],
            exhausted: "Flat gold water, four of them above it, and a gap in the middle the shape of a person.",
            onComplete: {
              notebook: { section: 'weirdThings', entry: { id: 'wt52', text: '#52. All four, above the water, at dawn, without even going under. Either they are getting easier to hear or I am getting quieter. Dida would say those are the same sentence and be unbearable about it.' } },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The water's edge",
      x: 83, y: 54, w: 15, h: 32,
      text: "She stood in the water up to her knees before six in the morning and waited for the light to arrive.",
    },
      ladder: [
        "She stood on the rocks with her shoes in her hand. Above the water — above it, in the air — she could hear them.",
        "Faintly. Tangled up in the small noise of the sea moving against stone. Four voices. They had been there the whole time.",
      ],
      afterMax: "The dawn holds its gold.",
    },
  },

  'underwater-finale': {
    name: 'All Four',
    art: '22-underwater-finale.jpg',
    ambient: { type: 'waves', volume: 0.02 , presence: 'forest' },
    chapter: 4,
    isUnderwater: true,
    onEnter: {
      first: "She swam out until the bottom stopped being a thing she could see. And she went under.",
      return: "Under. All four. No timer.",
    },
    exits: {
      up: {
        label: 'Surface',
        route: [
          { done: 'sangWithThem', to: 'kasjuni-dawn', label: 'Surface' },
          { gate: 'sangWithThem', to: 'kitchen', label: 'Home. Dida will still be up.' },
        ],
      },
    },
    hotspots: [],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The green water",
      x: 32, y: 38, w: 36, h: 38,
      text: "She hung in the green with her arms out and stopped counting how long she had been down.",
    },
      ladder: [
        {
          text: "They were not a song. They were not a message. They were not for anything. They were just there, and they had always been there.",
          sound: { voice: 'all', fadeIn: 6 },
        },
        "And they had been there when this was a forest with no name and no Romans in it, and they would be there in a thousand years when everything Mira had ever touched was gone.",
        "And she could hear them.",
      ],
      // One held moment, not three decisions: the scene's own line is "No
      // timer". Once she stays, the beats arrive on their own so the chord is
      // never interrupted by having to re-arm the verb.
      continuous: true,
      afterMax: "The chord holds. For as long as she stays.",
      onComplete: {
        flag: 'sangWithThem',
      },
    },
  },

  'lake-michigan': {
    name: 'Lake Michigan, October',
    art: '23-lake-michigan.jpg',
    ambient: { type: 'waves', volume: 0.04 , presence: 'sea' },
    chapter: 4,
    onEnter: {
      first: "Fifty-one degrees. Lake Michigan. October. Her mother shouting from the beach in a coat.",
      return: "The lake. October. Fifty-one degrees.",
    },
    exits: {},
    hotspots: [
      {
        id: 'vita', label: 'Beside her', x: 6, y: 60, w: 26, h: 32,
        verbs: {
          look: {
            ladder: [
              "Her sister, eight years old, in a coat, at the edge of a lake in October, being told about pneumonia and ignoring it.",
              "She has been working up to something for about four hundred miles.",
            ],
            performance: [
              "Her sister, eight years old, in a coat, at the edge of a lake in October, being told about pneumonia and ignoring it entirely.",
              "She has been working up to something for about four hundred miles. There is a book on an island with a column of names in it and no explanations, and Mira has decided she is not going to do it that way.",
            ],
            exhausted: "Vita. Waiting for an answer.",
          },
          talk: {
            ladder: [
              "\"Was it real,\" said Vita. Not loudly. It was the only question she had asked all year.",
              {
                // The other ending. Not a wrong answer and not a lesser one —
                // the book is full of people who kept it. It is only shorter
                // by one, and the game does not punish her for it.
                text: "\"Yes,\" said Mira.\n\nAnd then she stopped, with her hand round the stone in her pocket, and did not take it out.\n\nIt was hers. She had got it herself, out of a summer that had cost her every friend she had at home and most of her dignity, and there was a version of this where she got to have one thing that belonged to nobody else.\n\n\"It was real,\" she said. \"That's all.\"\n\nVita nodded, and did not ask again, because she was eight, not stupid.",
                flag: 'keptIt',
                // One decision, not two cutscenes. Nothing used to stop a player
                // doing both, and "she chose" is the whole point of the scene.
                gateNot: 'handingOn',
                gateNotText: "\"Was it real,\" Vita had asked, and Mira had already answered that by putting the stone in her hand. There was nothing to take back.",
                notebook: {
                  section: 'weirdThings',
                  entry: { id: 'wt58b', text: "#58b. I kept it. I am allowed to keep it. I am going to be thinking about this one for a long time." },
                },
              },
            ],
            exhausted: "Vita, not asking again. Which is somehow worse.",
          },
          give: {
            requires: 'pebble',
            noItemText: "She has nothing to hand her.",
            gateNot: 'keptIt',
            gateNotText: "She had already told her it was real and left it at that, and her hand had already closed round the stone in her pocket while she did it. That was the answer she gave.",
            doneText: "Her sister is out there in fifty-one degrees with a holed stone in her fist. There is nothing left to hand anybody.",
            text: "Mira took the boy's pebble out of her coat pocket, where it had been since Brač, and put it in her sister's hand, and closed her fingers round it the way Nona had closed hers.\n\n\"Look through the hole,\" she said. \"Then put your head under and don't do anything.\"\n\nVita looked at the stone for a long moment. Then she took her shoes off in fifty-one degrees, in October, in Illinois, and went down to the water without asking one further question.",
            flag: 'handingOn',
            consumeItem: true,
            plate: 'pebble',
            notebook: {
              section: 'weirdThings',
              entry: { id: 'wt58', text: '#58. I gave it to Vita. Nobody told me to. That is apparently how this works — it is only any good if you hand it on full.' },
            },
          },
        },
      },
    ],
    wait: {
    // Somewhere to be still. The verb needs a place, or players read the
    // empty scene as a broken one.
    place: {
      label: "The cold water",
      x: 34, y: 64, w: 34, h: 28,
      text: "She put her head under Lake Michigan in October and held still, which she could not have done in June.",
    },
      requireAny: {
        flags: ['handingOn', 'keptIt'],
        count: 1,
        text: "She stood at the edge of the water with a stone in her pocket and her sister waiting for an answer, and going in first would have been the wrong way round.",
      },
      ladder: [
        "She put her head under. Nothing. Water in her ears. Her own heartbeat, very loud.",
        "She stayed under for a long time, longer than she could have in June, because she had spent a summer learning to be still.",
        "Then she came up and pushed her hair off her face and laughed out loud on an empty beach in Chicago in October, because it didn't matter even slightly.",
        "It had already happened. It didn't need her to be in the room.",
      ],
      afterMax: [
        "Doma.",
        "Her mother, still shouting about pneumonia. Vita, still in the water.",
        "October. Illinois. Fifty-one degrees. Nowhere else to be.",
      ],
      onComplete: {
        ending: 'doma',
        endingDelay: 6500,
        notebook: {
          section: 'weirdThings',
          entry: { id: 'wt59', text: "#59. Last one. It had already happened. It didn't need me in the room. That is the whole thing, I think." },
        },
      },
    },
  },
};

// The ending. She has handed it on; the last thing the game does is take
// her attention off the voices and give it back to her own life.
const ENDINGS = {
  // She kept it. The chain still runs — it just runs through one person now.
  'keeper': {
    creditsAfter: 7000,
    word: 'Doma',
    beats: [
      { text: "Her mother was still shouting about pneumonia from up the beach, and her sister was throwing stones at the water the ordinary way, and somewhere under all of it four voices were holding a chord that had been going since before there were words for any of this.", hold: 11000 },
      { text: "Nobody else on this beach could hear it. That was the arrangement. Mira had made it herself, on purpose, with her eyes open, and she would have years to decide what she thought about that.", hold: 10000 },
      { text: "There was a book on an island with her name in it and four marks beside it, and one day there would be somebody she wanted to bring. It would take as long as it took. She had got quite good at that.", hold: 9500 },
    ],
  },
  'doma': {
    creditsAfter: 7000,
    word: 'Doma',
    beats: [
      { text: "Her mother was still shouting about pneumonia from up the beach, and her sister was face-down in Lake Michigan in October with a stone in her fist, and somewhere under all of it four voices were holding a chord that had been going since before there were words for any of this.", hold: 11000 },
      { text: "Mira sat down on the cold sand in her coat and waited to find out whether Vita could hear it too.", hold: 9500 },
      { text: "It would take as long as it took. She had got quite good at that.", hold: 9000 },
    ],
  },
};

// What must already be true for a chapter to be playable from a cold start.
// Used only by the dev panel.
const DEV_PREREQS = {
  0: { flags: [], items: [] },
  1: { flags: ['heardForest', 'sentToMuseum', 'understoodRelief', 'sentToOmis', 'gotCup'], items: ['woodenCup'] },
  2: { flags: ['heardForest', 'sentToMuseum', 'understoodRelief', 'sentToOmis', 'gotCup', 'foundSideChannel', 'heardRiver', 'returnedPlectrum', 'tonkoWisdom'], items: ['woodenCup'] },
  3: { flags: ['heardForest', 'sentToMuseum', 'understoodRelief', 'sentToOmis', 'gotCup', 'foundSideChannel', 'heardRiver', 'returnedPlectrum', 'tonkoWisdom', 'gotPebble', 'heardSea', 'clue_radio', 'clue_student', 'workshopEmptied', 'stoneRang', 'custodianReturned', 'foundNotebook', 'performanceMode', 'sawSilence'], items: ['woodenCup', 'pebble'] },
  4: { flags: ['heardForest', 'sentToMuseum', 'understoodRelief', 'sentToOmis', 'gotCup', 'foundSideChannel', 'heardRiver', 'returnedPlectrum', 'tonkoWisdom', 'gotPebble', 'heardSea', 'clue_radio', 'clue_student', 'workshopEmptied', 'stoneRang', 'custodianReturned', 'foundNotebook', 'performanceMode', 'sawSilence', 'heardAll'], items: ['woodenCup', 'pebble'] },
};

// Readers. A page of something, turned. The only affordance is the button,
// and the button never says anything but "turn the page".
const READERS = {
  'notebook': {
    art: 'P7-notebook-page.jpg',
    autoAdvance: 90000,
    pages: [
      "The first page is a list.\n\nNames, in ink, in a dozen different hands, going down the page and then onto the next one. Beside some of the names there are small pencil marks — one, two, sometimes three short strokes, like somebody keeping count of something without wanting to write down what.\n\nSome of the names have been crossed out. Not scribbled over. Crossed out once, carefully, with a ruler.",
      "The hands get older as she goes back. The ink goes browner. The paper gets softer at the edges where thumbs have been.\n\nAnd the marks keep going. One stroke. One stroke. Two. One. Three, once, in 1908, next to a name in handwriting so careful it must have taken the man an hour.\n\nNobody has written a single word of explanation anywhere in this book. Whoever kept it did not think an explanation was necessary, because whoever read it would already know.",
      "Ana Novak. 1961.\n\nThree marks.\n\nMira sat down on the floor of a stone room full of stopped clocks, which she would not remember deciding to do, and read the name again. Her great-grandmother. Dida's mother. Dead eleven years before Mira was born, a photograph on a shelf in an apartment in Split, a woman with her hair pinned up who had, apparently, heard three of them.\n\nAnd then written it down in a book at the bottom of a ravine on an island, and told nobody.",
      "And then, at the very bottom of the last written page, in pencil.\n\nFresh pencil. Darker than everything above it. This summer's date.\n\nMiroslava Novak.\n\nFour marks.\n\nMira looked at it for a long time. The handwriting was small and upright and slightly cramped, and she had seen it on the back of every photograph in the apartment and on the label of every jar in the pantry, and it was Nona's.",
    ],
    onComplete: {
      flag: 'performanceMode',
      message: "Nona, who had said one sentence all day. Nona, who had put a cup in her hand and closed her fingers round it.\n\nNona had been here first.",
      notebook: {
        section: 'weirdThings',
        entry: { id: 'wt54', text: '#54. The book has my name in it. THIS SUMMER. Four marks. In Nona\'s handwriting. She wrote it down before I told anybody. She wrote it down before I knew.' },
      },
    },
  },
};

// Close-up plates. Painted still-lifes at a different scale, shown as a
// framed insert. This is how a person hands her something in a game where
// no person is ever drawn into a scene.
// No captions. Every one of these repeated, near-verbatim, a sentence already
// in the text panel in the same beat — the painting says it better and the
// prose has already said it. The field still works if a plate ever needs one.
const PLATES = {
  'hand':     { art: 'P1-carved-hand.jpg',     ratio: '4 / 3', duration: 8500,
                caption: "The hand at the waterline. Four fingers and part of a wrist. Somebody's, once." },
  'cup':      { art: 'P2-wooden-cup.jpg',      ratio: '4 / 3', duration: 8000,
                caption: "Nona's cup, and her mother's before that. She closed my fingers round it and said it is only any good if you hand it on full." },
  'plectrum': { art: 'P3-plectrum.jpg',        ratio: '4 / 3', duration: 7000,
                caption: "Tonko's plectrum. Forty years of one thumb going over the same corner." },
  'pebble':   { art: 'P4-holed-pebble.jpg',    ratio: '4 / 3', duration: 8500,
                caption: "The boy's pebble, with the hole worn all the way through. He would not say a word about it." },
  'key':      { art: 'P5-brass-key.jpg',       ratio: '4 / 3', duration: 8000,
                caption: "The custodian's key. Brass, and still warm from his pocket." },
  'drawer':   { art: 'P6-drawer-notebook.jpg', ratio: '4 / 3', duration: 9000,
                caption: "One tick, and the drawer walked open half an inch. Somebody else's notebook, in a room silent since 1963." },
  'page':     { art: 'P7-notebook-page.jpg',   ratio: '3 / 4', duration: 11000,
                caption: "His handwriting, at about my age. He heard them too, and then he stopped writing it down." },
};

// Vision definitions
const VISIONS = {
  'V1': {
    art: '24-vision-silvanus.jpg',
    duration: 20000,
    voices: ['forest'],
    level: 'level1',
    flag: 'walkedTheGap',
    description: 'Silvanus with his pipe, the forest bass rising from below.',
    // Exposition. A playable interlude that ends with a dip to white and no
    // words leaves the player unsure whether they solved it, what it was, or
    // what it bought them. This says all three, in her voice.
    after: [
      { text: "The gold went out of the water and it was the sea again, ordinary and bright, and Mira was on her back on the surface with her ears full of it — four metres above a rock she was never going to be able to look at the same way." },
      { text: "She had stood next to him. Not in front of him, the way you stand in front of a thing in a museum. BESIDE him, in the space the carver cut into the limestone eighteen hundred years before she got there.\n\nThe gap in the stone is not damage and it is not decoration. It is a place. Somebody kept it open." },
      { text: "So: the enormous warm one, underneath everything, holding up the other three. He is the ground. Marjan is what he sounds like. She has been walking around on his back her whole life.\n\nOne, she thought, with the colossal cheek of a thirteen-year-old.\n\nThree to go." },
    ],
  },
  'V2': {
    art: '25-vision-river.jpg',
    duration: 20000,
    voices: ['forest', 'river'],
    description: 'The leftmost nymph, ankle-deep, swaying. Two voices.',
  },
  'V3': {
    art: '26-vision-stone.jpg',
    duration: 20000,
    voices: ['forest', 'river', 'stone'],
    description: 'The middle nymph, hands on stone. Three voices. One missing.',
  },
  'V4': {
    art: '27-vision-all-four.jpg',
    duration: 30000,
    voices: ['forest', 'river', 'stone', 'sea'],
    level: 'level2',
    flag: 'stoodInTheGap',
    description: 'The relief reassembles. All four together for the first time.',
    after: [
      { text: "The light let go of her and the cave came back — cold, and smelling of wet rock, and entirely ordinary, which after that was almost funny." },
      { text: "Four. Not four things she had collected. Four presences, standing in an arrangement somebody had cut into limestone because it was the only way they had of writing it down, and the empty place in that arrangement had been hers the entire time.\n\nRiver, stone, sea. And underneath the three of them, giving them a floor: forest.\n\nThe coast is not haunted by them. The coast IS them." },
      { text: "She sat down on the cave floor in the dark, thirteen years old, with wet feet, and understood that she was now the person who knew.\n\nWhich, it turned out, was not the end of anything. It was a job." },
    ],
  },
};

// Chapter cards
const CHAPTER_CARDS = {
  0: { title: 'PROLOGUE', subtitle: 'Split' },
  1: { title: 'ONE', subtitle: 'Omiš, where the mountain starts exactly where the town stops, and nobody in six hundred years has been able to move anyone out of it.' },
  2: { title: 'TWO', subtitle: 'Brač, which is white all the way down, and which is where Split came from, in pieces, on boats.' },
  3: { title: 'THREE', subtitle: 'Korčula, and a cave that has been in use for twenty thousand years, and eight minutes of doing nothing at all.' },
  4: { title: 'FOUR', subtitle: 'October. Illinois. Fifty-one degrees.' },
};

// Scene graph — which chapter unlocks which scenes
const CHAPTER_SCENES = {
  0: ['title', 'kasjuni-day', 'underwater', 'kitchen', 'museum', 'marjan-path'],
  1: ['omis-above', 'canyon', 'side-channel', 'omis-square'],
  2: ['ferry-deck', 'pucisca', 'workshop-busy', 'workshop-empty', 'quarry', 'blaca-ravine', 'clock-room'],
  3: ['korcula-street', 'cave-path', 'cave-mouth', 'cave-deep'],
  4: ['kasjuni-dawn', 'underwater-finale', 'lake-michigan'],
};



window.SCENES = SCENES;
window.PLATES = PLATES;
window.READERS = READERS;
window.ENDINGS = ENDINGS;
window.DEV_PREREQS = DEV_PREREQS;
window.VISIONS = VISIONS;
window.CHAPTER_CARDS = CHAPTER_CARDS;
window.CHAPTER_SCENES = CHAPTER_SCENES;
})();