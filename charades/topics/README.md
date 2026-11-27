# Charades decks

Each deck is one small file in this folder. The game reads the list in
`index.js` and loads each file named there, in that order. This file and
`../tools/` stay off the live site.

## Adding a deck

1. Copy a deck file (say `animals.js`) to a new name, e.g. `ocean.js`.
2. Change the fields:

   ```js
   export default {
     id: 'ocean',            // lowercase letters, numbers, dashes; never reuse one
     title: 'Under the Sea', // up to 24 letters, shown on the deck card
     icon: '🐙',              // one emoji
     color: '#0e7490',       // the deck's color, dark enough for white to show on it
     cards: [
       'Octopus', 'Scuba diver', 'Treasure chest',
       // ... at least 40, ideally 50-60
     ],
   };
   ```

3. Add `'ocean',` to the list in `index.js` where it should appear.
4. Check it: `node charades/tools/check-topics.mjs` from the repo root.
   It stops on duplicates (inside a deck or across decks, since Shuffle all
   mixes every deck), cards that are too long, and words that need a second
   look.
5. Commit and push. The deck shows up the next time the page loads.

To take a deck out, remove its name from `index.js` (the file can stay).
To retire one card, delete it from its deck. A deck that fails to load is
skipped with a note in the browser console; the rest still work.

## What goes in a deck

The game is calibrated for 10 to 12 year olds, played in a living room with
one person guessing and everyone else acting.

- **Fun to act out.** Every card should be something a kid can mime with
  their body in a few seconds: an animal, an action, a job, a thing you use.
  If it can only be described with words, leave it out.
- **Known by any 10-year-old.** No trivia, no hard spellings, nothing that
  needs grown-up knowledge.
- **Timeless.** No news or current events, no trends that will date.
- **No real people.** No actors, singers, athletes, YouTubers, politicians or
  historical figures.
- **No brand names or franchises** (no game, movie, toy or app names), so
  decks stay timeless and nobody is left out for not having seen something.
  Everyday words that started as brands (frisbee) are fine.
- **Nothing adult.** No alcohol, smoking, weapons used on people, dating,
  romance, scary gore, religion or politics. Spooky-fun (ghosts, zombies,
  mummies) is fine.
- **Kind.** Nothing about how people look, illness, disability or groups of
  people.
- **Short.** One to four words; 26 letters at most, so it reads from across
  the room.
- **A mix of easy and medium.** Roughly two easy cards for every harder one,
  so every turn gets a few quick wins.

Fairy tale and folk tale characters (Cinderella, Robin Hood) are fine: they
are old stories, not franchises.

## How the game uses decks

- Each turn, the player picks a deck (or Shuffle all, which mixes them).
- A word never comes up twice in one game, and each device remembers the
  words it showed lately and saves them for after the rest of the deck.
- About one card in eleven is a gold card, worth 2 points.
